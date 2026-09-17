import sharp from "sharp";
export function escapeXml(value: string) {
  return value.replace(
    /[<>&'\"]/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[c]!,
  );
}
export async function processPhoto(
  input: Buffer,
  identity: {
    name: string;
    copyright: string;
    watermark_text: string;
    instagram: string;
  },
) {
  const metadata = await sharp(input, {
    limitInputPixels: 100_000_000,
  }).metadata();
  if (
    !["jpeg", "webp"].includes(metadata.format ?? "") ||
    (metadata.pages ?? 1) > 1
  )
    throw new Error("Envie uma fotografia JPEG ou WebP estática válida.");
  const base = await sharp(input, { limitInputPixels: 100_000_000 })
    .rotate()
    .resize({
      width: 2000,
      height: 2000,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toBuffer({ resolveWithObject: true });
  const { width, height } = base.info;
  const font = Math.max(10, Math.round(Math.min(width, height) * 0.026));
  const margin = Math.round(Math.min(width, height) * 0.035);
  const mark = Buffer.from(
    `<svg width="${width}" height="${height}"><text x="${width - margin}" y="${height - margin}" text-anchor="end" font-family="sans-serif" font-size="${font}" fill="white" fill-opacity="0.62">${escapeXml(identity.watermark_text)}</text></svg>`,
  );
  const xmp = `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/" photoshop:Credit="${escapeXml(identity.name)}"><dc:creator><rdf:Seq><rdf:li>${escapeXml(identity.name)}</rdf:li></rdf:Seq></dc:creator><dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(identity.copyright)}</rdf:li></rdf:Alt></dc:rights><dc:source>${escapeXml(identity.instagram)}</dc:source></rdf:Description></rdf:RDF></x:xmpmeta>`;
  const buffer = await sharp(base.data)
    .composite([{ input: mark }])
    .withExif({
      IFD0: { Artist: identity.name, Copyright: identity.copyright },
    })
    .withXmp(xmp)
    .webp({ quality: 85 })
    .toBuffer();
  return { buffer, width, height };
}
