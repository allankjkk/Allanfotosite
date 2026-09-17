import { Header, Footer } from "@/components/layout";
import { publicSettings } from "@/features/repository";
export const dynamic = "force-dynamic";
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await publicSettings();
  return (
    <div className="public-shell">
      <a className="skip-link" href="#conteudo">
        Pular para conteúdo
      </a>
      <Header />
      <main id="conteudo">{children}</main>
      <Footer settings={settings} />
    </div>
  );
}
