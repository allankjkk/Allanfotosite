import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { AdminShell, AdminHeading } from "@/components/admin-shell";
import { ProjectForm } from "@/components/forms";
export default async function Page() {
  if (!(await currentAdmin())) redirect("/admin");
  return (
    <AdminShell>
      <AdminHeading title="Novo projeto" />
      <div className="max-w-3xl">
        <p className="muted mb-8">
          Salve as informações para começar a adicionar suas fotografias.
        </p>
        <ProjectForm />
      </div>
    </AdminShell>
  );
}
