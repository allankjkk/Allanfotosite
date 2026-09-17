import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { projects } from "@/features/repository";
import { AdminShell, AdminHeading } from "@/components/admin-shell";
import { ProjectList } from "@/components/admin-controls";
export default async function Page() {
  if (!(await currentAdmin())) redirect("/admin");
  const items = await projects(true);
  return (
    <AdminShell>
      <AdminHeading title="Projetos">
        <Link className="button" href="/admin/projetos/novo">
          + NOVO PROJETO
        </Link>
      </AdminHeading>
      <ProjectList projects={items} />
    </AdminShell>
  );
}
