import type { Metadata } from "next";
import FavoritesPageClient from "./favorites-page";

export const metadata: Metadata = {
  title: "Favorite Wallpapers | Wallzy",
  description: "Your saved wallpapers on Wallzy.",
  alternates: { canonical: "https://www.wallzy.org/favorites" },
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return <FavoritesPageClient />;
}
