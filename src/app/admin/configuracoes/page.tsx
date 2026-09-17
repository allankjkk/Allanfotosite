import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { settings, projects } from "@/features/repository";
import { AdminShell, AdminHeading } from "@/components/admin-shell";
import { SettingsForm } from "@/components/forms";
export default async function Page() {
  if (!(await currentAdmin())) redirect("/admin");
  return (
    <AdminShell>
      <AdminHeading title="Configurações" />
      <SettingsForm
        settings={await settings()}
        projects={await projects(false, true)}
      />
    </AdminShell>
  );
}
