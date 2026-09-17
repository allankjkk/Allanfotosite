import type { MetadataRoute } from "next";
import { projects } from "@/features/repository";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.SITE_URL;
  if (!origin) return [];
  return [
    ...["", "/portfolio", "/sobre", "/contato"].map((path) => ({
      url: `${origin}${path}`,
    })),
    ...(await projects()).map((p) => ({
      url: `${origin}/portfolio/${p.slug}`,
      lastModified: p.updated_at,
    })),
  ];
}
