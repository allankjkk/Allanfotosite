import Link from "next/link";
import { Photograph } from "./photograph";
import { imageUrl } from "@/features/repository";
import type { Project } from "@/lib/types";
export function ProjectGallery({
  project: p,
  preview = false,
}: {
  project: Project;
  preview?: boolean;
}) {
  return (
    <>
      <Link
        className="back-link"
        href={preview ? `/admin/projetos/${p.id}` : "/portfolio"}
      >
        ↖ {preview ? "Voltar à edição" : "Todos os trabalhos"}
      </Link>
      <div className="page-heading">
        <span className="eyebrow">
          {p.category}
          {p.year ? ` · ${p.year}` : ""}
        </span>
        <h1 className="project-title">{p.title}</h1>
        {p.description && <p>{p.description}</p>}
      </div>
      <div className="gallery">
        {p.photos
          .filter((f) => !f.deleted_at)
          .sort((a, b) => a.display_order - b.display_order)
          .map((f, i) => (
            <figure key={f.id} className={f.height > f.width ? "portrait" : ""}>
              <Photograph
                src={imageUrl(f.storage_path)}
                alt={f.alt_text || `${p.title} — fotografia ${i + 1}`}
                width={f.width}
                height={f.height}
                priority={i === 0}
              />
            </figure>
          ))}
      </div>
      <Link
        className="editorial-link"
        href={preview ? `/admin/projetos/${p.id}` : "/portfolio"}
      >
        ↖ {preview ? "Voltar à edição" : "Voltar ao portfólio"}
      </Link>
    </>
  );
}
