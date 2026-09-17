import { z } from "zod";
export const MAX_BYTES = 25 * 1024 * 1024;
export const MAX_PHOTOS = 20;
export function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) digits = digits.slice(2);
  if (!/^[1-9]{2}9\d{8}$/.test(digits))
    throw new Error("Informe um celular com DDD e 9 dígitos.");
  const ddd = Number(digits.slice(0, 2));
  if (
    ![
      11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34,
      35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62,
      63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85,
      86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
    ].includes(ddd)
  )
    throw new Error("Informe um DDD válido.");
  return `+55${digits}`;
}
export function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").replace(/^55(?=\d{11}$)/, "");
  return d.length === 11
    ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    : value;
}
export function whatsappUrl(value: string) {
  return `https://wa.me/${normalizePhone(value).slice(1)}`;
}
const phone = z.string().transform((v, ctx) => {
  try {
    return normalizePhone(v);
  } catch {
    ctx.addIssue({
      code: "custom",
      message: "Informe um celular válido com DDD.",
    });
    return z.NEVER;
  }
});
const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Campo obrigatório.")
    .max(max, `Use até ${max} caracteres.`);
export const contactSchema = z.object({
  name: text(120),
  phone,
  message: text(5000),
});
export const projectSchema = z.object({
  id: z.uuid().optional(),
  title: text(180),
  slug: text(200).regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use letras minúsculas, números e hífens.",
  ),
  category: text(100),
  year: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().int().min(1800).max(2200).nullable(),
  ),
  description: z.string().trim().max(10000).default(""),
});
export const uploadSchema = z.object({
  projectId: z.uuid(),
  photoId: z.uuid(),
  type: z.enum(["image/jpeg", "image/webp"]),
  size: z.number().int().positive().max(MAX_BYTES),
});
export const settingsSchema = z.object({
  hero_project_id: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.uuid().nullable(),
  ),
  name: text(120),
  instagram: z.string().trim().max(100),
  instagram_url: z.union([
    z.literal(""),
    z
      .url()
      .refine(
        (v) => new URL(v).protocol === "https:",
        "Use um endereço HTTPS.",
      ),
  ]),
  whatsapp: z.union([z.literal(""), phone]),
  email: z.union([z.literal(""), z.email()]),
  location: z.string().trim().max(180),
  copyright: text(240),
  watermark_text: text(100),
});
export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
export function assertPublishable(
  project: {
    deleted_at: string | null;
    cover_photo_id: string | null;
    id: string;
  },
  photos: { id: string; project_id: string; deleted_at: string | null }[],
) {
  if (
    project.deleted_at ||
    !photos.some(
      (p) =>
        p.id === project.cover_photo_id &&
        p.project_id === project.id &&
        !p.deleted_at,
    )
  )
    throw new Error(
      "Escolha uma capa entre as fotos disponíveis antes de publicar.",
    );
}
