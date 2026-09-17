-- Select one entire group instead of individual photos.
alter table public.site_settings add column if not exists hero_project_id uuid references public.projects(id) on delete set null;
alter table public.site_settings drop constraint if exists site_settings_hero_ten;
