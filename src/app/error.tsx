"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="public-shell page-heading">
      <h1>Não foi possível carregar.</h1>
      <p>Tente novamente em instantes.</p>
      <button className="button" onClick={reset}>
        TENTAR NOVAMENTE
      </button>
    </main>
  );
}
