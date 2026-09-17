import Link from "next/link";
import { projects, imageUrl } from "@/features/repository";
import { Photograph } from "@/components/photograph";
import { ContactCTA } from "@/components/layout";
export const metadata = {
  title: "Portfólio",
  description: "Uma seleção de histórias que passaram pela minha câmera.",
};
export default async function Portfolio() {
  const items = await projects();
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">PORTFÓLIO</span>
        <h1>
          TRABALHOS<span className="accent">.</span>
        </h1>
        <p>Uma seleção de histórias que passaram pela minha câmera.</p>
      </div>
      <div className="editorial-grid">
        {items.map((p, i) => {
          const cover = p.photos.find((f) => f.id === p.cover_photo_id);
          return (
            <article key={p.id} className="work">
              <Link href={`/portfolio/${p.slug}`}>
                {cover && (
                  <Photograph
                    src={imageUrl(cover.storage_path)}
                    alt={cover.alt_text || p.title}
                    width={cover.width}
                    height={cover.height}
                    priority={i === 0}
                  />
                )}
                <div className="work-caption">
                  <span className="work-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2>
                      {p.title} <span aria-hidden>↗</span>
                    </h2>
                    <p>
                      {p.category}
                      {p.year ? ` · ${p.year}` : ""}
                    </p>
                    {p.description && (
                      <p className="work-description">{p.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
      {!items.length && (
        <div className="empty-state">
          <p>Os próximos trabalhos serão publicados aqui.</p>
        </div>
      )}
      <ContactCTA />
    </>
  );
}
