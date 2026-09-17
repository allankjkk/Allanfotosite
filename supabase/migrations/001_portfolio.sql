begin;
create type public.project_status as enum ('DRAFT','PUBLISHED','INACTIVE');
create type public.contact_status as enum ('NEW','VIEWED','IN_CONTACT','FINISHED');
create table public.projects (
 id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique, category text not null,
 year integer, description text, status public.project_status not null default 'DRAFT', cover_photo_id uuid,
 display_order integer not null default 0 check(display_order>=0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.photos (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
 storage_path text not null unique, width integer check(width>0), height integer check(height>0), alt_text text,
 display_order integer not null default 0 check(display_order>=0), created_at timestamptz not null default now(), deleted_at timestamptz
);
alter table public.projects add constraint projects_cover_photo_fk foreign key(cover_photo_id) references public.photos(id) on delete set null;
create table public.contact_requests (id uuid primary key default gen_random_uuid(), name text not null, phone text not null, message text not null, status public.contact_status not null default 'NEW', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.site_settings (id uuid primary key default gen_random_uuid(), name text not null, instagram text, instagram_url text, whatsapp text, email text, location text, copyright text, watermark_text text, updated_at timestamptz not null default now());
create unique index site_settings_singleton on public.site_settings ((true));
create table public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
-- Internal deletion claims prevent restoration while Storage removal is in flight.
alter table public.projects add column deletion_pending boolean not null default false;
alter table public.photos add column deletion_pending boolean not null default false;
create index on public.projects(status, display_order);
create index on public.photos(project_id, display_order);
create index on public.contact_requests(status, created_at);
alter table public.projects enable row level security;
alter table public.photos enable row level security;
alter table public.contact_requests enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_users enable row level security;

-- All database access is through authorized server operations. No browser table access.
-- service_role bypasses RLS; authorization and public filtering are enforced in the server.
revoke all on public.projects, public.photos, public.contact_requests, public.site_settings, public.admin_users from anon, authenticated;
grant all on public.projects, public.photos, public.contact_requests, public.site_settings, public.admin_users to service_role;
insert into public.site_settings(name,instagram,instagram_url,location,copyright,watermark_text)
values ('Allan Dantas','@allan.pht','https://instagram.com/allan.pht','João Pessoa — PB','© Allan Dantas','✳· ALLAN DANTAS');

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('originals','originals',false,26214400,array['image/jpeg','image/webp']),
 ('portfolio','portfolio',true,26214400,array['image/webp'])
on conflict(id) do update set public=excluded.public, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;
-- No anon/authenticated Storage write policies. Server-issued path-scoped signed
-- upload tokens allow TUS upload to originals only. Service role handles all other I/O.

-- Serialize the small, single-administrator catalog to make publication, restoration,
-- concurrent uploads and ordering atomic. This narrowly scoped function avoids a
-- separate job/queue subsystem. It is callable only by the trusted application server.
create function public.manage_portfolio(operation text, payload jsonb) returns jsonb
language plpgsql security invoker set search_path = public, pg_temp as $$
declare p public.projects; f public.photos; entity_id uuid; result_id uuid; item jsonb; n integer; total integer;
begin
 perform pg_advisory_xact_lock(818271);
 entity_id := nullif(payload->>'id','')::uuid;
 if operation='save_project' then
   if entity_id is null then
     insert into projects(title,slug,category,year,description,display_order) values(payload->>'title',payload->>'slug',payload->>'category',(payload->>'year')::integer,payload->>'description',(select coalesce(max(display_order),-1)+1 from projects)) returning id into result_id;
   else
     update projects set title=payload->>'title',slug=payload->>'slug',category=payload->>'category',year=(payload->>'year')::integer,description=payload->>'description',updated_at=now() where id=entity_id and deleted_at is null returning id into result_id;
     if result_id is null then raise exception 'Projeto indisponível.'; end if;
   end if;
   return jsonb_build_object('id',result_id);
 elsif operation='reorder_projects' or operation='reorder_photos' then
   if operation='reorder_projects' then select count(*) into total from projects where deleted_at is null;
   else
     select * into p from projects where id=(payload->>'projectId')::uuid and deleted_at is null;
     if not found then raise exception 'Projeto indisponível.'; end if;
     select count(*) into total from photos where project_id=p.id and deleted_at is null;
   end if;
   if jsonb_array_length(payload->'ids')<>total or (select count(distinct value) from jsonb_array_elements_text(payload->'ids'))<>total then raise exception 'A lista mudou. Atualize a página e tente novamente.'; end if;
   n:=0;
   for item in select value from jsonb_array_elements(payload->'ids') loop
     if operation='reorder_projects' then update projects set display_order=n,updated_at=now() where id=(item#>>'{}')::uuid and deleted_at is null;
     else update photos set display_order=n where id=(item#>>'{}')::uuid and project_id=p.id and deleted_at is null; end if;
     if not found then raise exception 'Item inválido na ordenação.'; end if;
     n:=n+1;
   end loop;
 elsif operation='finalize_photo' then
   select * into p from projects where id=(payload->>'projectId')::uuid and deleted_at is null;
   if not found then raise exception 'Projeto indisponível.'; end if;
   if exists(select 1 from photos where id=entity_id and project_id=p.id) then return jsonb_build_object('id',entity_id); end if;
   if (select count(*) from photos where project_id=p.id and deleted_at is null)>=20 then raise exception 'Limite de 20 fotos atingido.'; end if;
   insert into photos(id,project_id,storage_path,width,height,alt_text,display_order) values(entity_id,p.id,payload->>'path',(payload->>'width')::integer,(payload->>'height')::integer,payload->>'alt',(select coalesce(max(display_order),-1)+1 from photos where project_id=p.id));
 elsif operation in ('status','cover','trash_project','restore_project','delete_project','claim_project_deletion') then
   select * into p from projects where id=entity_id;
   if not found then raise exception 'Projeto indisponível.'; end if;
   if p.deletion_pending and operation not in ('delete_project','claim_project_deletion') then raise exception 'Exclusão definitiva em andamento. Conclua a exclusão na lixeira.'; end if;
   if operation='status' then
     if p.deleted_at is not null then raise exception 'Restaure o projeto antes de alterar a publicação.'; end if;
     if payload->>'status'='PUBLISHED' and not exists(select 1 from photos where id=p.cover_photo_id and project_id=p.id and deleted_at is null) then raise exception 'Escolha uma capa entre as fotos disponíveis antes de publicar.'; end if;
     update projects set status=(payload->>'status')::project_status,updated_at=now() where id=p.id;
   elsif operation='cover' then
     if p.deleted_at is not null or not exists(select 1 from photos where id=(payload->>'photoId')::uuid and project_id=p.id and deleted_at is null) then raise exception 'A capa deve ser uma foto disponível deste projeto.'; end if;
     update projects set cover_photo_id=(payload->>'photoId')::uuid,updated_at=now() where id=p.id;
   elsif operation='trash_project' then update projects set deleted_at=now(),updated_at=now() where id=p.id;
   elsif operation='restore_project' then
     if p.status='PUBLISHED' and not exists(select 1 from photos where id=p.cover_photo_id and project_id=p.id and deleted_at is null) then raise exception 'O projeto publicado precisa de uma capa válida antes de ser restaurado.'; end if;
     update projects set deleted_at=null,updated_at=now() where id=p.id;
   elsif operation='claim_project_deletion' then
     if p.deleted_at is null then raise exception 'Mova o projeto para a lixeira primeiro.'; end if;
     if exists(select 1 from photos where project_id=p.id and deletion_pending) then raise exception 'Conclua primeiro a exclusão da foto na lixeira.'; end if;
     update projects set deletion_pending=true where id=p.id;
   elsif operation='delete_project' then
     if p.deleted_at is null then raise exception 'Mova o projeto para a lixeira primeiro.'; end if;
     if not p.deletion_pending then raise exception 'Confirme a exclusão primeiro.'; end if;
     delete from projects where id=p.id;
   end if;
 elsif operation in ('alt','trash_photo','restore_photo','delete_photo','claim_photo_deletion') then
   select * into f from photos where id=entity_id;
   if not found then raise exception 'Foto indisponível.'; end if;
   select * into p from projects where id=f.project_id;
   if p.deletion_pending then raise exception 'A exclusão definitiva do projeto está em andamento.'; end if;
   if f.deletion_pending and operation not in ('delete_photo','claim_photo_deletion') then raise exception 'Exclusão definitiva em andamento. Conclua a exclusão na lixeira.'; end if;
   if operation='alt' then update photos set alt_text=payload->>'alt' where id=f.id;
   elsif operation='trash_photo' then
     if p.cover_photo_id=f.id then raise exception 'Escolha outra capa antes de mover esta foto para a lixeira.'; end if;
     update photos set deleted_at=now() where id=f.id;
   elsif operation='restore_photo' then
     if p.deleted_at is not null then raise exception 'Restaure primeiro o projeto desta foto.'; end if;
     if f.deleted_at is not null and (select count(*) from photos where project_id=p.id and deleted_at is null)>=20 then raise exception 'Limite de 20 fotos atingido. Libere espaço antes de restaurar.'; end if;
     update photos set deleted_at=null where id=f.id;
   elsif operation='claim_photo_deletion' then
     if f.deleted_at is null then raise exception 'Mova a foto para a lixeira primeiro.'; end if;
     update photos set deletion_pending=true where id=f.id;
   elsif operation='delete_photo' then
     if f.deleted_at is null then raise exception 'Mova a foto para a lixeira primeiro.'; end if;
     if not f.deletion_pending then raise exception 'Confirme a exclusão primeiro.'; end if;
     delete from photos where id=f.id;
   end if;
 else raise exception 'Operação inválida.';
 end if;
 return jsonb_build_object('id',entity_id);
end $$;
revoke all on function public.manage_portfolio(text,jsonb) from public, anon, authenticated;
grant execute on function public.manage_portfolio(text,jsonb) to service_role;
commit;
