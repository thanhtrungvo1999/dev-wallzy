create or replace function public.wallpapers_search_text(arr text[])
returns text
language sql
immutable
parallel safe
as $$
  select array_to_string(coalesce(arr, array[]::text[]), ' ');
$$;

create index if not exists wallpapers_search_fts_idx
on public.wallpapers
using gin (
  to_tsvector(
    'simple'::regconfig,
    coalesce(category,'') || ' ' || public.wallpapers_search_text(keywords)
  )
);

create or replace function public.search_wallpapers(
  search_query text,
  search_offset integer default 0,
  search_limit integer default 20
)
returns table (
  id text,
  category text,
  keywords text[],
  storage_path text,
  public_url text,
  created_at text,
  rank real
)
language sql
stable
as $$
with tokens as (
  select distinct regexp_replace(lower(trim(x)), '[^[:alnum:]_]+', '', 'g') as token
  from regexp_split_to_table(trim(coalesce(search_query,'')), '\s+') x
  where trim(x) <> ''
  limit 5
),
q as (
  select string_agg(token || ':*', ' | ') as tsquery
  from tokens
  where token <> ''
),
matched as (
  select
    w.id::text as id,
    coalesce(w.category,'')::text as category,
    coalesce(w.keywords,array[]::text[]) as keywords,
    coalesce(w.storage_path,'')::text as storage_path,
    coalesce(w.public_url,'')::text as public_url,
    coalesce(w.created_at,'')::text as created_at,
    ts_rank(
      to_tsvector(
        'simple'::regconfig,
        coalesce(w.category,'') || ' ' || public.wallpapers_search_text(w.keywords)
      ),
      to_tsquery('simple'::regconfig, q.tsquery)
    )::real as rank
  from public.wallpapers w
  cross join q
  where q.tsquery is not null
    and q.tsquery <> ''
    and to_tsvector(
      'simple'::regconfig,
      coalesce(w.category,'') || ' ' || public.wallpapers_search_text(w.keywords)
    ) @@ to_tsquery('simple'::regconfig, q.tsquery)
)
select
  m.id,
  m.category,
  m.keywords,
  m.storage_path,
  m.public_url,
  m.created_at,
  m.rank
from matched m
order by m.rank desc, m.created_at desc nulls last, m.id desc
offset greatest(search_offset,0)
limit least(greatest(search_limit,1),50);
$$;