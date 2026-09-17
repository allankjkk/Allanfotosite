import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { privileged } from "@/lib/supabase/server";
import { uploadSchema, MAX_BYTES, MAX_PHOTOS } from "@/lib/validation";
import { command, projectById, settings } from "../repository";
import { processPhoto } from "./image-processor";
function sign(value: string) {
  return createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(value)
    .digest("base64url");
}
export async function authorizeUpload(raw: unknown) {
  const user = await requireAdmin();
  const input = uploadSchema.parse(raw);
  const project = await projectById(input.projectId);
  if (!project || project.deleted_at) throw new Error("Projeto indisponível.");
  if (project.photos.filter((f) => !f.deleted_at).length >= MAX_PHOTOS)
    throw new Error("Limite de 20 fotos atingido.");
  if (project.photos.some((f) => f.id === input.photoId))
    throw new Error("Esta foto já foi recebida. Atualize o projeto.");
  const path = `${input.projectId}/${input.photoId}`;
  const { data, error } = await privileged()
    .storage.from("originals")
    .createSignedUploadUrl(path);
  if (error) throw new Error("Não foi possível autorizar o envio.");
  const body = Buffer.from(
    JSON.stringify({
      ...input,
      userId: user.id,
      expires: Date.now() + 2 * 60 * 60 * 1000,
    }),
  ).toString("base64url");
  return {
    token: data.token,
    path,
    ticket: `${body}.${sign(body)}`,
    // x-signature is validated on the signed TUS route, not the session-JWT route.
    endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable/sign`,
  };
}
export async function finishUpload(raw: unknown) {
  const user = await requireAdmin();
  const { ticket } = z.object({ ticket: z.string().max(4000) }).parse(raw);
  const [body, signature] = ticket.split(".");
  const expected = sign(body ?? "");
  if (
    !signature ||
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    throw new Error("Autorização de envio inválida.");
  const input = uploadSchema
    .extend({ userId: z.uuid(), expires: z.number() })
    .parse(JSON.parse(Buffer.from(body, "base64url").toString()));
  if (input.userId !== user.id || input.expires < Date.now())
    throw new Error("Autorização expirada. Tente enviar novamente.");
  const client = privileged();
  const original = `${input.projectId}/${input.photoId}`;
  const path = `${input.projectId}/${input.photoId}.webp`;
  const project = await projectById(input.projectId);
  if (!project || project.deleted_at) throw new Error("Projeto indisponível.");
  if (project.photos.some((f) => f.id === input.photoId)) {
    const { error } = await client.storage.from("originals").remove([original]);
    if (error)
      throw new Error(
        "Foto salva. Tente novamente para concluir a limpeza do original.",
      );
    return { id: input.photoId };
  }
  const { data, error } = await client.storage
    .from("originals")
    .download(original);
  if (error || !data)
    throw new Error("Não foi possível ler o envio. Tente novamente.");
  if (data.size > MAX_BYTES || data.size !== input.size)
    throw new Error("O tamanho recebido é inválido.");
  const identity = await settings();
  const result = await processPhoto(Buffer.from(await data.arrayBuffer()), {
    name: identity.name,
    copyright: identity.copyright ?? "",
    watermark_text: identity.watermark_text ?? "✳· ALLAN DANTAS",
    instagram: identity.instagram ?? "",
  });
  const uploaded = await client.storage
    .from("portfolio")
    .upload(path, result.buffer, {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "3600",
    });
  if (uploaded.error)
    throw new Error("Não foi possível salvar a imagem processada.");
  try {
    await command("finalize_photo", {
      id: input.photoId,
      projectId: input.projectId,
      path,
      width: result.width,
      height: result.height,
      alt: "",
    });
  } catch (error) {
    const { data: existing } = await client
      .from("photos")
      .select("id")
      .eq("id", input.photoId)
      .maybeSingle();
    if (!existing) await client.storage.from("portfolio").remove([path]);
    throw error;
  }
  const removed = await client.storage.from("originals").remove([original]);
  if (removed.error)
    throw new Error(
      "Foto salva. Tente novamente para concluir a limpeza do original.",
    );
  return { id: input.photoId };
}
