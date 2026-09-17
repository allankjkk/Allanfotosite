import "server-only";
import { privileged, configured } from "@/lib/supabase/server";
import type { Project, Settings, PublicSettings, Inquiry } from "@/lib/types";
import { selectGroupPhotos } from "./projects/home-carousel";
export const defaults: PublicSettings = {
  name: "Allan Dantas",
  instagram: "@allan.pht",
  instagram_url: "https://instagram.com/allan.pht",
  whatsapp: null,
  email: null,
  location: "João Pessoa — PB",
  copyright: "© Allan Dantas",
};
export const imageUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio/${path}`;
export async function publicSettings(): Promise<PublicSettings> {
  if (!configured()) return defaults;
  const { data, error } = await privileged()
    .from("site_settings")
    .select("name,instagram,instagram_url,whatsapp,email,location,copyright")
    .single();
  if (error) throw error;
  return data;
}
export async function settings(): Promise<Settings> {
  const { data, error } = await privileged()
    .from("site_settings")
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
export async function homePhotos() {
  if (!configured()) return [];
  const [global, catalog] = await Promise.all([
    settings(),
    projects(false, true),
  ]);
  return selectGroupPhotos(catalog, global.hero_project_id);
}
export async function projects(
  admin = false,
  includeHidden = false,
): Promise<Project[]> {
  if (!configured()) return [];
  let query = privileged()
    .from("projects")
    .select("*,photos!photos_project_id_fkey(*)")
    .order("display_order")
    .order("created_at");
  if (!admin) query = query.eq("status", "PUBLISHED").is("deleted_at", null);
  const { data, error } = await query;
  if (error) throw error;
  const global = !admin && !includeHidden ? await settings() : null;
  const hidden = global
    ? [...(global.hidden_project_ids ?? []), global.hero_project_id].filter(
        Boolean,
      )
    : [];
  return (data as Project[])
    .filter((p) => !hidden.includes(p.id))
    .map((p) => ({
      ...p,
      photos: p.photos
        .filter((f) => admin || !f.deleted_at)
        .sort((a, b) => a.display_order - b.display_order),
    }));
}
export async function projectById(id: string): Promise<Project | null> {
  const { data, error } = await privileged()
    .from("projects")
    .select("*,photos!photos_project_id_fkey(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Project | null;
}
export async function inquiries(): Promise<Inquiry[]> {
  const { data, error } = await privileged()
    .from("contact_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function command(
  operation: string,
  payload: Record<string, unknown>,
) {
  const { data, error } = await privileged().rpc("manage_portfolio", {
    operation,
    payload,
  });
  if (error) {
    if (error.code === "23505")
      throw new Error("Este endereço já está em uso. Escolha outro slug.");
    if (error.code === "P0001") throw new Error(error.message);
    throw new Error("Não foi possível salvar. Tente novamente.");
  }
  return data;
}
