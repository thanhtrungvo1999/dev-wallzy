-- Switch random wallpaper loading to PostgreSQL TABLESAMPLE.
-- Remove the temporary random_key approach from the previous experiment.
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
language plpgsql
volatile
as $$
declare
  wanted integer := least(greatest(coalesce(result_limit,14),1),50);
  sample_percent real := 5;
  rows_found integer := 0;
begin
  -- TABLESAMPLE SYSTEM samples physical table pages instead of scanning
  -- and sorting the whole wallpapers table.
  while sample_percent <= 100 and rows_found < wanted loop
    return query execute format($sql$
      select
        w.id::text,
        coalesce(w.category,'')::text,
        coalesce(w.keywords,array[]::text[]),
        coalesce(w.storage_path,'')::text,
        coalesce(w.public_url,'')::text,
        w.created_at::text
      from public.wallpapers tablesample system (%s) as w
      where
        (coalesce($1,'') = '' or lower(w.category)=lower($1))
        and not (w.id::text = any(coalesce($2,'{}'::text[])))
      limit $3
    $sql$, sample_percent)
    using category_filter, exclude_ids, wanted;

    get diagnostics rows_found = row_count;

    if rows_found >= wanted then
      exit;
    end if;

    sample_percent := least(sample_percent * 2, 100);
    if sample_percent = 100 then
      exit;
    end if;
  end loop;

  return;
end;
$$;
