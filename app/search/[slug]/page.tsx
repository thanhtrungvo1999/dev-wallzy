import SearchPageClient from "../search-page-client";

type Props = { params: Promise<{ slug: string }> };

export default async function SearchSlugPage({ params }: Props) {
  const { slug } = await params;
  return <SearchPageClient initialQuery={decodeURIComponent(slug)} />;
}
