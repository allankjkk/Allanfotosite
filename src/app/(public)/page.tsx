import Link from "next/link";
import { homePhotos, imageUrl } from "@/features/repository";
import { HomeCarousel } from "@/components/home-carousel";
export default async function Home() {
  const selected = await homePhotos();
  return (
    <>
      <section className={`hero${selected.length ? " hero-photographs" : ""}`} aria-label="Fotografia em destaque">
        {selected.length ? (
          <HomeCarousel
            slides={selected.map(({ photo, project }) => ({
              id: photo.id,
              src: imageUrl(photo.storage_path),
              alt: photo.alt_text || project.title,
              width: photo.width,
              height: photo.height,
            }))}
          />
        ) : (
          <div className="empty-hero">
            <span className="eyebrow">ALLAN DANTAS · FOTOGRAFIA</span>
            <p>
              Novas histórias
              <br />
              em breve.
            </p>
            <span className="empty-line" />
          </div>
        )}
      </section>
      <section className="home-signature">
        <h1>
          <span>Cada clique,</span>
          <strong>uma história!</strong>
        </h1>
        <Link className="editorial-link" href="/portfolio">
          Explorar portfólio <span aria-hidden>↗</span>
        </Link>
      </section>
    </>
  );
}
