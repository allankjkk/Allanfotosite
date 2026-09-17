import { redirect } from "next/navigation";
import Image from "next/image";
import { currentAdmin } from "@/lib/auth";
import { projects } from "@/features/repository";
import { AdminShell, AdminHeading } from "@/components/admin-shell";
import { ActionButton, DeleteButton } from "@/components/admin-controls";
export default async function Page() {
  if (!(await currentAdmin())) redirect("/admin");
  const all = await projects(true);
  const removed = all.filter((p) => p.deleted_at);
  const photos = all.flatMap((p) =>
    p.photos.filter((f) => f.deleted_at).map((f) => ({ ...f, title: p.title })),
  );
  return (
    <AdminShell>
      <AdminHeading title="Lixeira" />
      <p className="muted">
        Os arquivos permanecem guardados até você confirmar a exclusão
        definitiva.
      </p>
      <section className="admin-section">
        <h2>Projetos</h2>
        {removed.map((p) => (
          <article className="admin-row" key={p.id}>
            {p.photos.find((f) => f.id === p.cover_photo_id) && (
              <Image
                unoptimized
                className="admin-thumb"
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio/${p.photos.find((f) => f.id === p.cover_photo_id)!.storage_path}`}
                width={96}
                height={72}
                alt={`Capa de ${p.title}`}
              />
            )}
            <div className="flex-1">
              <h3>{p.title}</h3>
              <small>
                Removido em{" "}
                {new Date(p.deleted_at!).toLocaleDateString("pt-BR", {
                  timeZone: "America/Fortaleza",
                })}
              </small>
            </div>
            <ActionButton input={{ operation: "restore_project", id: p.id }}>
              RESTAURAR
            </ActionButton>
            <DeleteButton kind="project" id={p.id} title={p.title} />
          </article>
        ))}
        {!removed.length && (
          <p className="empty-state">Nenhum projeto na lixeira.</p>
        )}
      </section>
      <section className="admin-section">
        <h2>Fotos</h2>
        {photos.map((p) => (
          <article className="admin-row" key={p.id}>
            <Image
              unoptimized
              className="admin-thumb"
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio/${p.storage_path}`}
              width={96}
              height={72}
              alt={p.alt_text || `Foto de ${p.title}`}
            />
            <div className="flex-1">
              <h3>
                {p.alt_text || "Fotografia"} · {p.title}
              </h3>
              <small>
                Removida em{" "}
                {new Date(p.deleted_at!).toLocaleDateString("pt-BR", {
                  timeZone: "America/Fortaleza",
                })}
              </small>
            </div>
            <ActionButton input={{ operation: "restore_photo", id: p.id }}>
              RESTAURAR
            </ActionButton>
            <DeleteButton
              kind="photo"
              id={p.id}
              title={p.alt_text || `Foto de ${p.title}`}
            />
          </article>
        ))}
        {!photos.length && (
          <p className="empty-state">Nenhuma foto na lixeira.</p>
        )}
      </section>
    </AdminShell>
  );
}
