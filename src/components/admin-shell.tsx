import Link from "next/link";
import { currentAdmin } from "@/lib/auth";
import { Brand } from "./layout";
import { LoginForm } from "./forms";
import { logout } from "@/features/actions";
export async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await currentAdmin();
  if (!user)
    return (
      <div className="login-shell">
        <Brand />
        <main>
          <span className="eyebrow">ÁREA ADMINISTRATIVA</span>
          <h1>
            Bom te ver
            <br />
            por aqui.
          </h1>
          <LoginForm />
          <Link className="back-link" href="/">
            ↖ Voltar ao site
          </Link>
        </main>
      </div>
    );
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Brand />
        <p className="eyebrow">ÁREA ADMINISTRATIVA</p>
        <nav aria-label="Administração">
          {[
            ["/admin", "Dashboard"],
            ["/admin/projetos", "Projetos"],
            ["/admin/mensagens", "Mensagens"],
            ["/admin/lixeira", "Lixeira"],
            ["/admin/configuracoes", "Configurações"],
          ].map(([href, title]) => (
            <Link key={href} href={href}>
              {title}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/">Ver site ↗</Link>
          <form action={logout}>
            <button className="text-button">Sair</button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
export function AdminHeading({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="admin-heading">
      <div>
        <span className="eyebrow">ALLAN DANTAS · ADMIN</span>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}
