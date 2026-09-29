import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug?: string[] }> };

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (slug?.length) notFound();
  return null;
}
