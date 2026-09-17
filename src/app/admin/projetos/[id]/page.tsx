import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { currentAdmin } from "@/lib/auth";
import { projectById } from "@/features/repository";
import { AdminShell, AdminHeading } from "@/components/admin-shell";
import { ProjectForm } from "@/components/forms";
import { ActionButton, PhotoManager } from "@/components/admin-controls";
import { Uploader } from "@/components/uploader";
import { labels } from "@/lib/types";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await currentAdmin())) redirect("/admin");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const p = await projectById(id);
  if (!p || p.deleted_at) notFound();
  return (
    <AdminShell>
      <AdminHeading title={p.title}>
        <span className={`badge ${p.status}`}>{labels[p.status]}</span>
      </AdminHeading>
      <div className="button-row mb-10">
        <Link
          className="button secondary"
          href={`/admin/projetos/${id}/preview`}
        >
          PRÉ-VISUALIZAR ↗
        </Link>
        {p.status === "PUBLISHED" ? (
          <ActionButton input={{ operation: "status", id, status: "INACTIVE" }}>
            DESATIVAR
          </ActionButton>
        ) : (
          <ActionButton
            input={{ operation: "status", id, status: "PUBLISHED" }}
          >
            PUBLICAR
          </ActionButton>
        )}
        <ActionButton input={{ operation: "trash_project", id }} danger>
          MOVER PARA LIXEIRA
        </ActionButton>
      </div>
      <div className="max-w-3xl">
        <ProjectForm project={p} />
      </div>
      <section className="admin-section">
        <h2>
          Fotografias{" "}
          <span className="muted">
            / {p.photos.filter((f) => !f.deleted_at).length} de 20
          </span>
        </h2>
        <Uploader
          projectId={id}
          count={p.photos.filter((f) => !f.deleted_at).length}
        />
        <p className="muted my-6">
          Arraste para ordenar ou use as setas. Escolha a capa e descreva suas
          fotos para quem usa leitor de tela.
        </p>
        <PhotoManager
          project={p}
          baseUrl={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio`}
        />
      </section>
    </AdminShell>
  );
}
