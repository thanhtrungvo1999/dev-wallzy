import { notFound } from "next/navigation";
import WallpaperDetailShell from "@/app/wallpaper/[slug]/detail-shell";
import {
  getWallpaperById,
  wallpaperIdFromSlug,
} from "@/app/lib/wallpaper";

type Props = { params: Promise<{ slug: string }> };

export default async function WallpaperModal({ params }: Props) {
  const { slug } = await params;
  const id = wallpaperIdFromSlug(slug);
  if (!id) notFound();

  const wallpaper = await getWallpaperById(id);
  if (!wallpaper) notFound();

  return (
    <div className="fixed inset-0 z-[1200] bg-black">
      <WallpaperDetailShell wallpaper={wallpaper} />
    </div>
  );
}
