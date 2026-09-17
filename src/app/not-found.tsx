import Link from "next/link";
import { Header } from "@/components/layout";
export default function NotFound() {
  return (
    <div className="public-shell">
      <Header />
      <main className="page-heading">
        <span className="eyebrow">404</span>
        <h1>
          Esse instante
          <br />
          não está aqui.
        </h1>
        <p>A página que você procura não foi encontrada.</p>
        <Link className="editorial-link" href="/portfolio">
          Voltar ao portfólio ↗
        </Link>
      </main>
    </div>
  );
}
