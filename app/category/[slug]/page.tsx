import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveCategoryBySearch } from "../../lib/category-search";
import CategoryPageClient from "../category-page-client";

type Props={params:Promise<{slug:string}>};

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const{slug}=await params;
  const category=await resolveCategoryBySearch(slug);
  if(!category)return{title:"Page Not Found | Wallzy",robots:{index:false,follow:false}};
  const url="https://www.wallzy.org/category/"+encodeURIComponent(slug);
  return{title:`${category} Wallpapers | Wallzy`,description:`Discover ${category} 4K UHD wallpapers on Wallzy. Download original-quality wallpapers for your phone.`,alternates:{canonical:url},openGraph:{title:`${category} Wallpapers | Wallzy`,description:`Discover ${category} 4K UHD wallpapers on Wallzy.`,url,type:"website"}};
}

export default async function CategoryPage({params}:Props){
  const{slug}=await params;
  const category=await resolveCategoryBySearch(slug);
  if(!category)notFound();
  return <CategoryPageClient category={category}/>;
}