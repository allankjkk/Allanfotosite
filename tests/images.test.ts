import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { processPhoto } from "../src/features/photos/image-processor";
function hasGps(exif: Buffer | undefined) {
  if (!exif) return false;
  const offset = exif.subarray(0, 4).toString() === "Exif" ? 6 : 0;
  const little = exif.subarray(offset, offset + 2).toString() === "II";
  const u16 = (at: number) =>
    little ? exif.readUInt16LE(at) : exif.readUInt16BE(at);
  const u32 = (at: number) =>
    little ? exif.readUInt32LE(at) : exif.readUInt32BE(at);
  const start = offset + u32(offset + 4);
  for (let i = 0; i < u16(start); i++)
    if (u16(start + 2 + i * 12) === 0x8825) return true;
  return false;
}
test("processa proporções, remove GPS e reaplica autoria em WebP", async () => {
  const original = await sharp({
    create: { width: 2400, height: 1200, channels: 3, background: "#365544" },
  })
    .withExif({
      IFD0: { Artist: "Original" },
      IFD3: { GPSLatitudeRef: "N", GPSLatitude: "10/1 20/1 30/1" },
    })
    .jpeg()
    .toBuffer();
  assert.ok(hasGps((await sharp(original).metadata()).exif));
  const output = await processPhoto(original, {
    name: "Allan Dantas",
    copyright: "© Allan Dantas",
    watermark_text: "✳· ALLAN DANTAS",
    instagram: "@allan.pht",
  });
  assert.equal(output.width, 2000);
  assert.equal(output.height, 1000);
  const meta = await sharp(output.buffer).metadata();
  assert.equal(meta.format, "webp");
  assert.ok(meta.xmp?.toString().includes("Allan Dantas"));
  assert.ok(meta.exif?.toString().includes("Allan Dantas"));
  assert.ok(!meta.xmp?.toString().includes("GPS"));
  assert.equal(hasGps(meta.exif), false);
  const decoded = await sharp(output.buffer).raw().toBuffer();
  const watermarkRegion = decoded.subarray(Math.floor(decoded.length * 0.94));
  assert.ok(watermarkRegion.some((value) => value > 130));
});
test("corrige orientação EXIF sem ampliar a fotografia", async () => {
  const original = await sharp({
    create: { width: 1200, height: 800, channels: 3, background: "#334455" },
  })
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer();
  const output = await processPhoto(original, {
    name: "Allan",
    copyright: "© Allan",
    watermark_text: "Allan",
    instagram: "",
  });
  assert.equal(output.width, 800);
  assert.equal(output.height, 1200);
  assert.ok(
    [undefined, 1].includes(
      (await sharp(output.buffer).metadata()).orientation,
    ),
  );
});
test("recusa arquivo com formato real não permitido", async () => {
  const png = await sharp({
    create: { width: 10, height: 10, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
  await assert.rejects(() =>
    processPhoto(png, {
      name: "Allan",
      copyright: "© Allan",
      watermark_text: "Allan",
      instagram: "",
    }),
  );
});
