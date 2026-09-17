import type { Metadata } from "next";
import "@fontsource-variable/syne";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Allan Dantas — Fotografia",
    template: "%s · Allan Dantas",
  },
  description:
    "Cada clique, uma história! Fotografia de Allan Dantas em João Pessoa — PB.",
  ...(process.env.SITE_URL
    ? { metadataBase: new URL(process.env.SITE_URL) }
    : {}),
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
