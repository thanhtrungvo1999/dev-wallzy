alter table public.wallpapers
  add column if not exists random_key double precision not null default random();

create index if not exists wallpapers_random_category_idx
on public.wallpapers (lower(category), random_key);

create index if not exists wallpapers_random_key_idx
on public.wallpapers (random_key);

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
stable
as $$
with params as (
  select
    least(greatest(coalesce(result_limit,14),1),50)::integer as lim,
    random()::double precision as pivot
),
first_part as (
  select
    w.id::text,
    coalesce(w.category,'')::text as category,
    coalesce(w.keywords,array[]::text[]) as keywords,
    coalesce(w.storage_path,'')::text as storage_path,
    coalesce(w.public_url,'')::text as public_url,
    w.created_at::text as created_at,
    w.random_key
  from public.wallpapers w
  cross join params p
  where
    (coalesce(category_filter,'') = '' or lower(w.category)=lower(category_filter))
    and not (w.id::text = any(coalesce(exclude_ids,'{}'::text[])))
    and w.random_key >= p.pivot
  order by w.random_key
  limit (select lim from params)
),
second_part as (
  select
    w.id::text,
    coalesce(w.category,'')::text as category,
    coalesce(w.keywords,array[]::text[]) as keywords,
    coalesce(w.storage_path,'')::text as storage_path,
    coalesce(w.public_url,'')::text as public_url,
    w.created_at::text as created_at,
    w.random_key
  from public.wallpapers w
  cross join params p
  where
    (coalesce(category_filter,'') = '' or lower(w.category)=lower(category_filter))
    and not (w.id::text = any(coalesce(exclude_ids,'{}'::text[])))
    and w.random_key < p.pivot
  order by w.random_key
  limit greatest(
    (select lim from params) - (select count(*) from first_part),
    0
  )
)
select id,category,keywords,storage_path,public_url,created_at
from first_part
union all
select id,category,keywords,storage_path,public_url,created_at
from second_part;
$$;
