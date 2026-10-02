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
    w.id::text as id,
    coalesce(w.category,'')::text as category,
    coalesce(w.keywords,array[]::text[]) as keywords,
    coalesce(w.storage_path,'')::text as storage_path,
    coalesce(w.public_url,'')::text as public_url,
    w.created_at::text as created_at
  from public.wallpapers w
  where
    (coalesce(category_filter,'') = '' or w.category ilike category_filter)
    and not (w.id::text = any(coalesce(exclude_ids,'{}'::text[])))
  order by random()
  limit least(greatest(coalesce(result_limit,14),1),50);
$$;
