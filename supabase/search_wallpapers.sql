create or replace function public.wallpapers_search_text(values text[])
returns text
language sql
immutable
parallel safe
as $$
  select array_to_string(coalesce(values, array[]::text[]), ' ');
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
    w,
    ts_rank(
      to_tsvector(
        'simple'::regconfig,
        coalesce(w.category,'') || ' ' || public.wallpapers_search_text(w.keywords)
      ),
      to_tsquery('simple'::regconfig, q.tsquery)
    ) as rank
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
  m.w.id::text,
  coalesce(m.w.category,'')::text,
  coalesce(m.w.keywords,array[]::text[]),
  coalesce(m.w.storage_path,'')::text,
  coalesce(m.w.public_url,'')::text,
  coalesce(m.w.created_at,'')::text,
  m.rank::real
from matched m
order by m.rank desc, m.w.created_at desc nulls last, m.w.id::text desc
offset greatest(search_offset,0)
limit least(greatest(search_limit,1),50);
$$;