import Link from "next/link";
import type { PublicSettings } from "@/lib/types";
import { whatsappUrl } from "@/lib/validation";
import { Navigation } from "./navigation";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Allan Dantas — início">
      <span className="brand-symbol" aria-hidden>
        ✳·
      </span>
      <span>ALLAN DANTAS</span>
    </Link>
  );
}
export function Header() {
  return (
    <header className="site-header">
      <Brand />
      <Navigation />
    </header>
  );
}
export function Channels({ settings: s }: { settings: PublicSettings }) {
  return (
    <div className="channels">
      {s.instagram_url && (
        <a
          href={s.instagram_url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Instagram ${s.instagram ?? ""}`}
        >
          Instagram ↗
        </a>
      )}
      {s.whatsapp && (
        <a href={whatsappUrl(s.whatsapp)} target="_blank" rel="noreferrer">
          WhatsApp ↗
        </a>
      )}
      {s.email && <a href={`mailto:${s.email}`}>{s.email} ↗</a>}
    </div>
  );
}
export function Footer({ settings: s }: { settings: PublicSettings }) {
  return (
    <footer className="site-footer">
      <div className="footer-icons">
        {s.instagram_url && (
          <a
            href={s.instagram_url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Instagram ${s.instagram ?? ""}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r=".7" />
            </svg>
          </a>
        )}
        {s.whatsapp && (
          <a
            href={whatsappUrl(s.whatsapp)}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.5 11.5a8.5 8.5 0 0 1-12.8 7.3L3 20l1.2-4.7a8.5 8.5 0 1 1 16.3-3.8Z" />
              <path d="M8 7.5c-2 4 4.5 10 8 7l-2-2-1.3 1.2-2.5-2.5L11 9Z" />
            </svg>
          </a>
        )}
        {s.email && (
          <a href={`mailto:${s.email}`} aria-label={`E-mail: ${s.email}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="2.5" y="4.5" width="19" height="15" rx="1" />
              <path d="m3 5 9 8 9-8" />
            </svg>
          </a>
        )}
      </div>
      <span>{s.location}</span>
      <small>
        {s.copyright}
        <br /> Todos os direitos reservados.
      </small>
    </footer>
  );
}
export function ContactCTA() {
  return (
    <section className="contact-cta">
      <span className="brand-symbol" aria-hidden>
        ✳
      </span>
      <h2>Quer contar a sua história?</h2>
      <Link className="editorial-link" href="/contato">
        ENTRAR EM CONTATO ↗
      </Link>
    </section>
  );
}
