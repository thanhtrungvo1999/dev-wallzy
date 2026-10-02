import type { Metadata } from "next";
import TikTokPageClient from "./tiktok-page";

export const metadata: Metadata = {
  title: "TikTok Downloader | Wallzy",
  description: "Download photos from TikTok photo posts on Wallzy.",
  alternates: { canonical: "https://www.wallzy.org/tiktok" },
  robots: { index: false, follow: false },
};
export default function TikTokPage(){return <TikTokPageClient/>}
