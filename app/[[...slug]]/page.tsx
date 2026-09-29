type Props = { params: Promise<{ slug?: string[] }> };

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const path = (slug || []).join("/").toLowerCase();

  // These routes are rendered by the client Wallzy shell.
  if (path === "studio" || path === "tiktok") return null;

  // Any other unmatched route must use the custom 404 page.
  const { notFound } = await import("next/navigation");
  notFound();
}
