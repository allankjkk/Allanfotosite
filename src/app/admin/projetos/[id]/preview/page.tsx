import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { currentAdmin } from "@/lib/auth";
import { projectById, publicSettings } from "@/features/repository";
import { ProjectGallery } from "@/components/project-gallery";
import { Header, Footer } from "@/components/layout";
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
    <div className="public-shell">
      <a className="skip-link" href="#conteudo">
        Pular para conteúdo
      </a>
      <Header />
      <main id="conteudo">
        <p className="preview-banner">
          PRÉ-VISUALIZAÇÃO PRIVADA · As alterações ainda podem não estar
          publicadas.
        </p>
        <ProjectGallery project={p} preview />
      </main>
      <Footer settings={await publicSettings()} />
    </div>
  );
}
