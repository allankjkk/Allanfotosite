import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { inquiries } from "@/features/repository";
import { AdminShell, AdminHeading } from "@/components/admin-shell";
import { InquiryList } from "@/components/admin-controls";
export default async function Page() {
  if (!(await currentAdmin())) redirect("/admin");
  return (
    <AdminShell>
      <AdminHeading title="Mensagens" />
      <InquiryList items={await inquiries()} />
    </AdminShell>
  );
}
