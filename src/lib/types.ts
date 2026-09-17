export type ProjectStatus = "DRAFT" | "PUBLISHED" | "INACTIVE";
export type ContactStatus = "NEW" | "VIEWED" | "IN_CONTACT" | "FINISHED";
export interface Photo {
  id: string;
  project_id: string;
  storage_path: string;
  width: number;
  height: number;
  alt_text: string | null;
  display_order: number;
  deleted_at: string | null;
  created_at: string;
}
export interface Project {
  id: string;
  title: string;
  slug: string;
  category: string;
  year: number | null;
  description: string | null;
  status: ProjectStatus;
  cover_photo_id: string | null;
  display_order: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  photos: Photo[];
}
export interface Settings {
  id: string;
  name: string;
  instagram: string | null;
  instagram_url: string | null;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  copyright: string | null;
  watermark_text: string | null;
  hero_project_id?: string | null;
  hero_photo_ids?: string[];
  hidden_project_ids?: string[];
}
export type PublicSettings = Omit<
  Settings,
  | "id"
  | "watermark_text"
  | "hero_photo_ids"
  | "hidden_project_ids"
  | "hero_project_id"
>;
export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  message: string;
  status: ContactStatus;
  created_at: string;
}
export interface ActionResult {
  ok: boolean;
  message: string;
  errors?: Record<string, string[]>;
  id?: string;
}
export const labels: Record<ProjectStatus | ContactStatus, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  INACTIVE: "Inativo",
  NEW: "Nova",
  VIEWED: "Visualizada",
  IN_CONTACT: "Em contato",
  FINISHED: "Finalizada",
};
