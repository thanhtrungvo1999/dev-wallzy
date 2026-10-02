-- Use PostgreSQL TABLESAMPLE for lightweight random wallpaper reads.
-- SYSTEM_ROWS is a TABLESAMPLE method that samples physical table blocks.
create extension if not exists tsm_system_rows;

drop index if exists public.wallpapers_random_category_idx;
drop index if exists public.wallpapers_random_key_idx;
alter table public.wallpapers drop column if exists random_key;

create or replace function public.get_random_wallpapers(
  category_filter text default '',
  result_limit integer default 14,
  exclude_ids text[] default '{}'
)
returns table (
  id text,
  category text,
  keywords text[],
  storage_path text,
  public_url text,
  created_at text
)
language sql
volatile
as $$
  select
    w.id::text,
    coalesce(w.category,'')::text,
    coalesce(w.keywords,array[]::text[]),
    coalesce(w.storage_path,'')::text,
    coalesce(w.public_url,'')::text,
    w.created_at::text
  from public.wallpapers tablesample system_rows(
    least(greatest(coalesce(result_limit,14) * 20,100),2000)
  ) as w
  where
    (coalesce(category_filter,'') = '' or lower(w.category)=lower(category_filter))
    and not (w.id::text = any(coalesce(exclude_ids,'{}'::text[])))
  limit least(greatest(coalesce(result_limit,14),1),50);
$$;
