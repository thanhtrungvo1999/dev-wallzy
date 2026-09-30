-- Wallzy wallpaper full-text search
-- Indexes category and keywords for scalable search.

alter table public.wallpapers
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('simple'::regconfig, coalesce(category, '')), 'A') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(array_to_string(keywords, ' '), '')), 'B')
  ) stored;

create index if not exists wallpapers_search_vector_idx
  on public.wallpapers using gin (search_vector);
