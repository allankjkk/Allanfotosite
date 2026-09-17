import { ContactForm } from "@/components/forms";
import { Channels } from "@/components/layout";
import { publicSettings } from "@/features/repository";
export const metadata = { title: "Contato" };
export default async function Contact() {
  const settings = await publicSettings();
  return (
    <div className="contact-layout">
      <div className="page-heading">
        <span className="eyebrow">CONTATO</span>
        <h1>
          Vamos contar
          <br />
          sua história<span className="accent">?</span>
        </h1>
        <p>Me conta o que você tem em mente.</p>
        <Channels settings={settings} />
      </div>
      <ContactForm />
    </div>
  );
}
