"use client";
import { useState } from "react";
import type { Project } from "@/lib/types";
export function HeroPicker({
  projects,
  initialProjectId,
  errors,
}: {
  projects: Project[];
  initialProjectId: string;
  errors?: string[];
}) {
  const [selected, setSelected] = useState(initialProjectId);
  const project = projects.find((p) => p.id === selected);
  return (
    <section className="hero-picker-section">
      <h2>Carrossel da página inicial</h2>
      <label htmlFor="hero-project">Grupo de fotos</label>
      <select
        id="hero-project"
        name="hero_project_id"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">Nenhum — desativar carrossel</option>
        {selected && !project && (
          <option value={selected}>Grupo indisponível — escolha outro</option>
        )}
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title} ({p.photos.length} fotos)
          </option>
        ))}
      </select>
      <p className="muted">
        Todas as fotos do grupo escolhido aparecem na capa, na ordem definida em
        Projetos. Não é necessário ter 10 fotos. Esse grupo fica oculto no
        portfólio automaticamente.
      </p>
      {project && (
        <p role="status">
          {project.photos.length} foto(s) no carrossel. Para adicionar, remover
          ou ordenar fotos, edite esse grupo em Projetos.
        </p>
      )}
      {errors && (
        <p role="alert" className="field-error">
          {errors.join(" ")}
        </p>
      )}
    </section>
  );
}
