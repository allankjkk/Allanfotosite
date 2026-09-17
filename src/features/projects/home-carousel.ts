import type { Project } from "@/lib/types";

// Keep the saved selection order, independently of project covers and catalog order.
export function selectHomePhotos(projects: Project[], ids: string[] = []) {
  return ids.flatMap((id) => {
    for (const project of projects) {
      if (project.status !== "PUBLISHED" || project.deleted_at) continue;
      const photo = project.photos.find(
        (photo) => photo.id === id && !photo.deleted_at,
      );
      if (photo) return [{ project, photo }];
    }
    return [];
  });
}

export function selectGroupPhotos(
  projects: Project[],
  projectId?: string | null,
) {
  const project = projects.find(
    (p) => p.id === projectId && p.status === "PUBLISHED" && !p.deleted_at,
  );
  if (!project) return [];
  return project.photos
    .filter((p) => !p.deleted_at)
    .sort((a, b) => a.display_order - b.display_order)
    .map((photo) => ({ project, photo }));
}
