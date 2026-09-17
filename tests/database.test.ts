import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("migração PostgreSQL, permissões e ciclo completo do catálogo", async (t) => {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create table auth.users(id uuid primary key);
 create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
  await db.exec(
    await readFile("supabase/migrations/001_portfolio.sql", "utf8"),
  );
  await db.exec(await readFile("supabase/migrations/002_home_carousel.sql", "utf8"));
  await db.exec(await readFile("supabase/migrations/002_home_carousel.sql", "utf8"));
  await t.test('carrossel aceita dez fotos ou seleção vazia', async()=>{
    await assert.rejects(()=>db.query('update site_settings set hero_photo_ids = $1::uuid[]',[[crypto.randomUUID()]]),/check constraint/);
    const ids=Array.from({length:10},()=>crypto.randomUUID());
    await db.query('update site_settings set hero_photo_ids = $1::uuid[]',[ids]);
    assert.deepEqual((await db.query<{hero_photo_ids:string[]}>('select hero_photo_ids from site_settings')).rows[0].hero_photo_ids,ids);
    await db.exec("update site_settings set hero_photo_ids='{}'");
  });
  async function cmd(operation: string, payload: Record<string, unknown>) {
    return (
      await db.query<{ result: { id: string } }>(
        "select public.manage_portfolio($1,$2::jsonb) as result",
        [operation, JSON.stringify(payload)],
      )
    ).rows[0].result;
  }
  const { id } = await cmd("save_project", {
    title: "Projeto de teste",
    slug: "projeto-de-teste",
    category: "Retrato",
    year: null,
    description: "",
  });
  const second = await cmd("save_project", {
    title: "Outro",
    slug: "outro",
    category: "Retrato",
  });
  await t.test("sem foto não publica", async () => {
    await assert.rejects(
      () => cmd("status", { id, status: "PUBLISHED" }),
      /capa/,
    );
  });
  const photoId = crypto.randomUUID();
  await cmd("finalize_photo", {
    id: photoId,
    projectId: id,
    path: `${id}/${photoId}.webp`,
    width: 2000,
    height: 1000,
    alt: "Teste",
  });
  await t.test("capa de outro projeto é rejeitada", async () => {
    await assert.rejects(
      () => cmd("cover", { id: second.id, photoId }),
      /deste projeto/,
    );
  });
  await cmd("cover", { id, photoId });
  await cmd("status", { id, status: "PUBLISHED" });
  await t.test("capa não pode ir para a lixeira", async () => {
    await assert.rejects(
      () => cmd("trash_photo", { id: photoId }),
      /outra capa/,
    );
  });
  await t.test(
    "ordenação recusa duplicação e lista desatualizada",
    async () => {
      await assert.rejects(
        () => cmd("reorder_projects", { ids: [id, id] }),
        /lista mudou/,
      );
      await cmd("reorder_projects", { ids: [second.id, id] });
      assert.equal(
        (
          await db.query<{ display_order: number }>(
            "select display_order from projects where id=$1",
            [id],
          )
        ).rows[0].display_order,
        1,
      );
    },
  );
  let restorable = "";
  await t.test(
    "limite de 20 é aplicado no banco e na restauração",
    async () => {
      for (let i = 1; i < 20; i++) {
        const fid = crypto.randomUUID();
        restorable = fid;
        await cmd("finalize_photo", {
          id: fid,
          projectId: id,
          path: `${id}/${fid}.webp`,
          width: 100,
          height: 100,
          alt: "",
        });
      }
      await assert.rejects(
        () =>
          cmd("finalize_photo", {
            id: crypto.randomUUID(),
            projectId: id,
            path: "excess.webp",
            width: 100,
            height: 100,
            alt: "",
          }),
        /20 fotos/,
      );
      await cmd("trash_photo", { id: restorable });
      const replacement = crypto.randomUUID();
      await cmd("finalize_photo", {
        id: replacement,
        projectId: id,
        path: `${id}/${replacement}.webp`,
        width: 100,
        height: 100,
        alt: "",
      });
      await assert.rejects(
        () => cmd("restore_photo", { id: restorable }),
        /20 fotos/,
      );
    },
  );
  await t.test("finalização repetida é idempotente", async () => {
    await cmd("finalize_photo", {
      id: photoId,
      projectId: id,
      path: "ignored.webp",
    });
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::int n from photos where id=$1",
          [photoId],
        )
      ).rows[0].n,
      1,
    );
  });
  await t.test("lixeira preserva fotos e restaura publicação", async () => {
    await cmd("trash_project", { id });
    assert.equal(
      (
        await db.query(
          "select id from projects where status='PUBLISHED' and deleted_at is null",
        )
      ).rows.length,
      0,
    );
    await cmd("restore_project", { id });
    assert.equal(
      (
        await db.query(
          "select id from projects where status='PUBLISHED' and deleted_at is null",
        )
      ).rows.length,
      1,
    );
  });
  await t.test(
    "exclusão precisa de lixeira e bloqueia restauração concorrente",
    async () => {
      await assert.rejects(
        () => cmd("claim_project_deletion", { id }),
        /lixeira/,
      );
      await cmd("trash_project", { id });
      await cmd("claim_project_deletion", { id });
      await assert.rejects(() => cmd("restore_project", { id }), /andamento/);
      await cmd("delete_project", { id });
      assert.equal(
        (await db.query("select id from photos where project_id=$1", [id])).rows
          .length,
        0,
      );
    },
  );
  await t.test(
    "anon e authenticated não leem tabelas privadas nem executam mutações",
    async () => {
      for (const role of ["anon", "authenticated"]) {
        await db.exec(`set role ${role}`);
        for (const table of [
          "projects",
          "photos",
          "contact_requests",
          "site_settings",
          "admin_users",
        ])
          await assert.rejects(
            () => db.query(`select * from ${table}`),
            /permission denied/,
          );
        await assert.rejects(
          () =>
            cmd("save_project", { title: "No", slug: "no", category: "No" }),
          /permission denied/,
        );
        await assert.rejects(
          () =>
            db.query(
              "insert into contact_requests(name,phone,message) values('No','No','No')",
            ),
          /permission denied/,
        );
        await db.exec("reset role");
      }
    },
  );
  await t.test(
    "RLS ativa nas cinco tabelas e configurações singleton",
    async () => {
      const { rows } = await db.query<{ n: number }>(
        "select count(*)::int n from pg_tables where schemaname='public' and rowsecurity",
      );
      assert.equal(rows[0].n, 5);
      await assert.rejects(
        () => db.query("insert into site_settings(name) values('Duplicado')"),
        /unique/,
      );
    },
  );
  await db.close();
});
