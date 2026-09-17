import Link from "next/link";
import { currentAdmin } from "@/lib/auth";
import { projects, inquiries } from "@/features/repository";
import { AdminShell, AdminHeading } from "@/components/admin-shell";
import { labels } from "@/lib/types";
export default async function Dashboard() {
  if (!(await currentAdmin())) return <AdminShell>{null}</AdminShell>;
  const [all, messages] = await Promise.all([projects(true), inquiries()]);
  const active = all.filter((p) => !p.deleted_at);
  return (
    <AdminShell>
      <AdminHeading title="Dashboard">
        <Link className="button" href="/admin/projetos/novo">
          + NOVO PROJETO
        </Link>
      </AdminHeading>
      <div className="stats">
        {[
          [
            "Projetos publicados",
            active.filter((p) => p.status === "PUBLISHED").length,
          ],
          ["Rascunhos", active.filter((p) => p.status === "DRAFT").length],
          [
            "Novas mensagens",
            messages.filter((m) => m.status === "NEW").length,
          ],
        ].map(([label, n]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{n}</strong>
          </div>
        ))}
      </div>
      <section className="admin-section">
        <h2>Projetos recentes</h2>
        {[...active]
          .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
          .slice(0, 5)
          .map((p) => (
            <Link
              className="admin-row"
              key={p.id}
              href={`/admin/projetos/${p.id}`}
            >
              <span>{p.title}</span>
              <span className="badge">{labels[p.status]}</span>
            </Link>
          ))}
        {!active.length && (
          <p className="empty-state">Comece criando seu primeiro projeto.</p>
        )}
      </section>
      <section className="admin-section">
        <h2>Últimas mensagens</h2>
        {messages.slice(0, 5).map((m) => (
          <Link className="admin-row" key={m.id} href="/admin/mensagens">
            <span>{m.name}</span>
            <span className="badge">{labels[m.status]}</span>
          </Link>
        ))}
        {!messages.length && (
          <p className="empty-state">
            As mensagens do formulário aparecerão aqui.
          </p>
        )}
      </section>
    </AdminShell>
  );
}
