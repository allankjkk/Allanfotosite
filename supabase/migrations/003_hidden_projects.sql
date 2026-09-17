-- Keep carousel-only groups out of public galleries without removing their photos.
alter table public.site_settings
  add column if not exists hidden_project_ids uuid[] not null default '{}';
