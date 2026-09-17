import test from "node:test";
import assert from "node:assert/strict";
import { selectHomePhotos, selectGroupPhotos } from "../src/features/projects/home-carousel";
import { settingsSchema } from "../src/lib/validation";
import type { Project } from "../src/lib/types";
function fixture(): Project {
  return {
    id: "project",
    title: "Projeto",
    slug: "projeto",
    category: "Foto",
    year: null,
    description: null,
    status: "PUBLISHED",
    cover_photo_id: "cover",
    display_order: 0,
    deleted_at: null,
    created_at: "",
    updated_at: "",
    photos: ["cover", "other", "third"].map((id) => ({
      id,
      project_id: "project",
      storage_path: `${id}.webp`,
      width: 800,
      height: 600,
      alt_text: id,
      display_order: 0,
      deleted_at: null,
      created_at: "",
    })),
  };
}
test("carrossel usa seleção salva independente da capa", () => {
  const project = fixture();
  assert.deepEqual(
    selectHomePhotos([project], ["third", "other"]).map((x) => x.photo.id),
    ["third", "other"],
  );
  assert.deepEqual(selectHomePhotos([project]), []);
  project.cover_photo_id = "other";
  assert.deepEqual(
    selectHomePhotos([project], ["third"]).map((x) => x.photo.id),
    ["third"],
  );
});
test("carrossel não revela rascunhos ou lixeira", () => {
  const project = fixture();
  project.status = "DRAFT";
  assert.deepEqual(selectHomePhotos([project], ["other"]), []);
  project.status = "PUBLISHED";
  project.deleted_at = "now";
  assert.deepEqual(selectHomePhotos([project], ["other"]), []);
  project.deleted_at = null;
  project.photos[1].deleted_at = "now";
  assert.deepEqual(selectHomePhotos([project], ["other"]), []);
});
test('group uses all available photos in order, including a single photo',()=>{
 const p=fixture(); p.photos[0].display_order=2;
 assert.deepEqual(selectGroupPhotos([p],p.id).map(x=>x.photo.id),['other','third','cover']);
 p.photos=p.photos.slice(0,1); assert.equal(selectGroupPhotos([p],p.id).length,1);
 p.status='DRAFT'; assert.deepEqual(selectGroupPhotos([p],p.id),[]);
 assert.deepEqual(selectGroupPhotos([fixture()],null),[]);
});
test('settings accept a group or no carousel',()=>{
 const values={name:'Allan',instagram:'',instagram_url:'',whatsapp:'',email:'',location:'',copyright:'Allan',watermark_text:'Allan'};
 assert.equal(settingsSchema.safeParse({...values,hero_project_id:crypto.randomUUID()}).success,true);
 assert.equal(settingsSchema.parse({...values,hero_project_id:''}).hero_project_id,null);
 assert.equal(settingsSchema.safeParse({...values,hero_project_id:'invalid'}).success,false);
});
