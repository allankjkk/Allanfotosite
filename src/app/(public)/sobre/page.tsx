import Link from "next/link";
import { about } from "@/content/about";
import { Photograph } from "@/components/photograph";
import { publicSettings } from "@/features/repository";
export const metadata = { title: "Sobre" };
export default async function About() {
  const s = await publicSettings();
  return (
    <section className="about-layout">
      <div className="page-heading">
        <span className="eyebrow">SOBRE</span>
        <h1>
          {s.name}
          <span className="accent">.</span>
        </h1>
        <p>Fotografia · {s.location}</p>
        {about.biography && (
          <p className="whitespace-pre-line">{about.biography}</p>
        )}
        <Link href="/contato" className="editorial-link">
          Vamos contar uma história? ↗
        </Link>
      </div>
      {about.portrait && (
        <Photograph
          src={about.portrait}
          alt={about.portraitAlt}
          width={3024}
          height={4032}
          priority
        />
      )}
    </section>
  );
}
