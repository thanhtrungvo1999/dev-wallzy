type Props = { params: Promise<{ slug?: string[] }> };

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const path = (slug || []).join("/").toLowerCase();

  // The home page is the root route rendered by the Wallzy shell.
  if (!path) return null;

  // These routes are rendered by the client Wallzy shell.
  if (path === "studio" || path === "tiktok") return null;

  // Any other unmatched route must use the custom 404 page.
  const { notFound } = await import("next/navigation");
  notFound();
}
