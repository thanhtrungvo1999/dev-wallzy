import { notFound } from "next/navigation";
import WallpaperDetailShell from "../../../wallpaper/[slug]/detail-shell";
import { getWallpaperById, wallpaperIdFromSlug } from "../../../lib/wallpaper";

type Props = { params: Promise<{ slug: string }> };

export default async function WallpaperModal({ params }: Props) {
  const { slug } = await params;
  const id = wallpaperIdFromSlug(slug);
  if (!id) notFound();

  const wallpaper = await getWallpaperById(id);
  if (!wallpaper) notFound();

  return <WallpaperDetailShell wallpaper={wallpaper} modal />;
}
