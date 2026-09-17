-- Add the independent home selection without changing projects or uploaded files.
alter table public.site_settings
  add column if not exists hero_photo_ids uuid[] not null default '{}';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'site_settings_hero_ten') then
    alter table public.site_settings add constraint site_settings_hero_ten
      check (cardinality(hero_photo_ids) in (0, 10));
  end if;
end $$;
