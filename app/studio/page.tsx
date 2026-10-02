import type { Metadata } from "next";
import StudioPageClient from "./studio-page";

export const metadata: Metadata = {
  title: "Gradient Studio | Wallzy",
  description: "Create and save custom gradients on Wallzy.",
  alternates: { canonical: "https://www.wallzy.org/studio" },
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  return <StudioPageClient />;
}
