"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { privileged, configured, sessionClient } from "@/lib/supabase/server";
import { contactSchema, projectSchema, settingsSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";
import { command, projectById, settings } from "./repository";
import { projects } from "./repository";

function failure(error: unknown): ActionResult {
  if (error instanceof z.ZodError)
    return {
      ok: false,
      message: "Confira os campos indicados.",
      errors: z.flattenError(error).fieldErrors as Record<string, string[]>,
    };
  return {
    ok: false,
    message:
      error instanceof Error
        ? error.message
        : "Não foi possível concluir. Tente novamente.",
  };
}
function refresh() {
  revalidatePath("/", "layout");
}
export async function login(
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    if (!configured())
      return {
        ok: false,
        message:
          "Configure o Supabase conforme o guia de instalação para acessar o painel.",
      };
    const input = z
      .object({ email: z.email(), password: z.string().min(1) })
      .parse(Object.fromEntries(form));
    const client = await sessionClient();
    const { error } = await client.auth.signInWithPassword(input);
    if (error) return { ok: false, message: "E-mail ou senha inválidos." };
    try {
      await requireAdmin();
    } catch {
      await client.auth.signOut();
      return {
        ok: false,
        message: "Esta conta não possui acesso administrativo.",
      };
    }
    refresh();
    return { ok: true, message: "Acesso autorizado." };
  } catch (error) {
    return failure(error);
  }
}
export async function logout() {
  if (configured()) {
    const client = await sessionClient();
    await client.auth.signOut();
  }
  refresh();
}
export async function sendContact(
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const input = contactSchema.parse(Object.fromEntries(form));
    if (!configured())
      return {
        ok: false,
        message:
          "O formulário ainda não está disponível. Entre em contato pelo Instagram.",
      };
    const { error } = await privileged()
      .from("contact_requests")
      .insert({ ...input, status: "NEW" });
    if (error)
      return {
        ok: false,
        message: "Não foi possível enviar agora. Tente novamente.",
      };
    return { ok: true, message: "Mensagem recebida! Aguarde meu contato." };
  } catch (error) {
    return failure(error);
  }
}
export async function saveProject(
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const raw = Object.fromEntries(form);
    if (!raw.id) delete raw.id;
    const input = projectSchema.parse(raw);
    const data = await command("save_project", input);
    refresh();
    return { ok: true, message: "Projeto salvo.", id: data.id };
  } catch (error) {
    return failure(error);
  }
}
const operationSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("status"),
    id: z.uuid(),
    status: z.enum(["DRAFT", "PUBLISHED", "INACTIVE"]),
  }),
  z.object({ operation: z.literal("cover"), id: z.uuid(), photoId: z.uuid() }),
  z.object({
    operation: z.enum([
      "trash_project",
      "restore_project",
      "trash_photo",
      "restore_photo",
    ]),
    id: z.uuid(),
  }),
  z.object({
    operation: z.literal("alt"),
    id: z.uuid(),
    alt: z.string().trim().max(500),
  }),
  z.object({
    operation: z.literal("reorder_projects"),
    ids: z.array(z.uuid()),
  }),
  z.object({
    operation: z.literal("reorder_photos"),
    projectId: z.uuid(),
    ids: z.array(z.uuid()),
  }),
]);
export async function manage(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const data = operationSchema.parse(input);
    const { operation, ...payload } = data;
    await command(operation, payload);
    refresh();
    return { ok: true, message: "Alteração salva." };
  } catch (error) {
    return failure(error);
  }
}
export async function permanentlyDelete(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { id, kind, confirmation } = z
      .object({
        id: z.uuid(),
        kind: z.enum(["project", "photo"]),
        confirmation: z.literal("EXCLUIR"),
      })
      .parse(input);
    if (confirmation !== "EXCLUIR") throw new Error("Confirmação necessária.");
    await command(
      kind === "project" ? "claim_project_deletion" : "claim_photo_deletion",
      { id },
    );
    const client = privileged();
    let paths: string[] = [];
    if (kind === "project") {
      const p = await projectById(id);
      if (!p?.deleted_at) throw new Error("Este projeto não está na lixeira.");
      paths = p.photos.map((f) => f.storage_path);
      const { data, error } = await client.storage
        .from("originals")
        .list(id, { limit: 1000 });
      if (error)
        throw new Error(
          "Não foi possível verificar os arquivos temporários. Tente novamente.",
        );
      if (data?.length) {
        const { error: removeError } = await client.storage
          .from("originals")
          .remove(data.map((f) => `${id}/${f.name}`));
        if (removeError)
          throw new Error("Não foi possível remover os originais temporários.");
      }
    } else {
      const { data, error } = await client
        .from("photos")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data.deleted_at)
        throw new Error("Esta foto não está na lixeira.");
      paths = [data.storage_path];
    }
    // Storage first: on failure keep the trashed records so the operation can be retried.
    if (paths.length) {
      const { error } = await client.storage.from("portfolio").remove(paths);
      if (error)
        throw new Error(
          "Não foi possível remover os arquivos. O item continua na lixeira para tentar novamente.",
        );
    }
    await command(kind === "project" ? "delete_project" : "delete_photo", {
      id,
    });
    refresh();
    return { ok: true, message: "Item excluído definitivamente." };
  } catch (error) {
    return failure(error);
  }
}
export async function updateInquiry(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { id, status } = z
      .object({
        id: z.uuid(),
        status: z.enum(["VIEWED", "IN_CONTACT", "FINISHED"]),
      })
      .parse(input);
    let query = privileged()
      .from("contact_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (status === "VIEWED") query = query.eq("status", "NEW");
    const { error } = await query;
    if (error) throw new Error("Não foi possível atualizar a mensagem.");
    refresh();
    return { ok: true, message: "Status atualizado." };
  } catch (error) {
    return failure(error);
  }
}
export async function saveSettings(
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const input = settingsSchema.parse(Object.fromEntries(form));
    const existing = await settings();
    if (
      input.hero_project_id &&
      !(await projects(false, true)).some(
        (p) => p.id === input.hero_project_id && p.photos.length > 0,
      )
    ) {
      throw new Error("Escolha um grupo publicado com pelo menos uma foto.");
    }
    const { error } = await privileged()
      .from("site_settings")
      .update({
        ...input,
        hidden_project_ids: existing.hidden_project_ids ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw new Error("Não foi possível salvar as configurações.");
    refresh();
    return { ok: true, message: "Configurações salvas." };
  } catch (error) {
    return failure(error);
  }
}
