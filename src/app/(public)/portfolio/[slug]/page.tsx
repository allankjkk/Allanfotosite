import { notFound } from "next/navigation";
import { projects } from "@/features/repository";
import { ProjectGallery } from "@/components/project-gallery";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const p = (await projects()).find((p) => p.slug === slug);
  return {
    title: p?.title ?? "Projeto não encontrado",
    description: p?.description || p?.category,
  };
}
export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const p = (await projects()).find((p) => p.slug === slug);
  if (!p || !p.photos.length) notFound();
  return <ProjectGallery project={p} />;
}
