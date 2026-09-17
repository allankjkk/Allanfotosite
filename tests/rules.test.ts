import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePhone,
  contactSchema,
  projectSchema,
  uploadSchema,
  assertPublishable,
  MAX_BYTES,
  settingsSchema,
} from "../src/lib/validation";
test("normaliza celular brasileiro, inclusive DDD 55", () => {
  assert.equal(normalizePhone("(83) 99999-1234"), "+5583999991234");
  assert.equal(normalizePhone("+55 (55) 99999-1234"), "+5555999991234");
  assert.equal(normalizePhone("(55) 99999-1234"), "+5555999991234");
});
test("rejeita DDD inválido, telefone fixo e conteúdo vazio", () => {
  for (const value of [
    "(20) 99999-1234",
    "(83) 3333-1234",
    "123",
    "+1 415 555 1212",
  ])
    assert.throws(() => normalizePhone(value));
  assert.equal(
    contactSchema.safeParse({ name: " ", phone: "83999991234", message: "olá" })
      .success,
    false,
  );
});
test("campos opcionais não fabricam ano; slug é validado", () => {
  assert.equal(
    projectSchema.parse({
      title: "História",
      slug: "historia",
      category: "Retrato",
      year: "",
      description: "",
    }).year,
    null,
  );
  assert.equal(
    projectSchema.safeParse({
      title: "História",
      slug: "../admin",
      category: "Retrato",
    }).success,
    false,
  );
});
test("publicação exige capa própria disponível", () => {
  const p = { id: "a", cover_photo_id: "b", deleted_at: null };
  assert.throws(() => assertPublishable(p, []));
  assert.throws(() =>
    assertPublishable(p, [{ id: "b", project_id: "c", deleted_at: null }]),
  );
  assert.throws(() =>
    assertPublishable(p, [{ id: "b", project_id: "a", deleted_at: "today" }]),
  );
  assert.doesNotThrow(() =>
    assertPublishable(p, [{ id: "b", project_id: "a", deleted_at: null }]),
  );
});
test("upload rejeita PNG, excesso de tamanho e identificador arbitrário", () => {
  const input = {
    projectId: crypto.randomUUID(),
    photoId: crypto.randomUUID(),
    size: 1024,
    type: "image/jpeg",
  };
  assert.equal(uploadSchema.safeParse(input).success, true);
  assert.equal(
    uploadSchema.safeParse({ ...input, type: "image/png" }).success,
    false,
  );
  assert.equal(
    uploadSchema.safeParse({ ...input, size: MAX_BYTES + 1 }).success,
    false,
  );
  assert.equal(
    uploadSchema.safeParse({ ...input, projectId: "../x" }).success,
    false,
  );
});
test("configurações rejeitam links executáveis e preservam contatos ausentes", () => {
  const s = {
    name: "Allan",
    instagram: "",
    instagram_url: "",
    whatsapp: "",
    email: "",
    location: "",
    copyright: "© Allan",
    watermark_text: "✳· ALLAN",
  };
  assert.equal(settingsSchema.safeParse(s).success, true);
  assert.equal(
    settingsSchema.safeParse({ ...s, instagram_url: "javascript:alert(1)" })
      .success,
    false,
  );
});
