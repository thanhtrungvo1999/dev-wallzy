import { createClient } from "@supabase/supabase-js";

export type Wallpaper = {
  id: string; category: string; keywords: string[]; storage_path: string; public_url: string; created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase environment variables are missing.");
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function slugifyWallpaper(value: string) {
  return String(value || "wallpaper").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "wallpaper";
}
export function wallpaperTitle(w: Wallpaper) {
  const path = String(w.storage_path || "").split("?")[0];
  const filename = decodeURIComponent(path.split("/").pop() || "").replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (filename) return filename.replace(/\b\w/g, c => c.toUpperCase()).slice(0, 120);
  return w.category ? `${w.category} 4K UHD Wallpaper` : "4K UHD Wallpaper";
}
export function wallpaperDescription(w: Wallpaper) {
  const category = w.category || "4K UHD";
  const keywords = (w.keywords || []).filter(Boolean).slice(0, 5).join(", ");
  return keywords ? `Download this ${category} 4K UHD wallpaper in original quality. Tags: ${keywords}.` : `Download this ${category} 4K UHD wallpaper in original quality from Wallzy.`;
}
export function wallpaperImageUrl(w: Wallpaper) {
  const path = String(w.storage_path || "").trim();
  if (/^https?:\/\//i.test(path)) return path;
  const base = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://img.wallzy.org").replace(/\/+$/, "");
  return path ? `${base}/${path.replace(/^\/+/, "")}` : w.public_url || "";
}
export function wallpaperPath(w: Wallpaper) {
  return `/wallpaper/${slugifyWallpaper(wallpaperTitle(w))}-${encodeURIComponent(String(w.id))}`;
}
export function wallpaperIdFromSlug(slug: string) {
  const value = decodeURIComponent(String(slug || "").replace(/^\/+|\/+$/g, ""));
  const uuid = value.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuid) return uuid[1];
  const numeric = value.match(/^(\d+)(?:-|$)/);
  if (numeric) return numeric[1];
  const legacy = value.match(/-([^/]+)$/);
  return legacy ? decodeURIComponent(legacy[1]) : null;
}
export async function getWallpaperById(id: string): Promise<Wallpaper | null> {
  const sb = getSupabase();
  const { data, error } = await sb.from("wallpapers").select("id,category,keywords,storage_path,public_url,created_at").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? { ...data, id: String(data.id), category: String(data.category || ""), keywords: Array.isArray(data.keywords) ? data.keywords : [], storage_path: String(data.storage_path || ""), public_url: String(data.public_url || ""), created_at: String(data.created_at || "") } : null;
}


import type { SupabaseClient, User } from "@supabase/supabase-js";
export type WallzyFeedWallpaper = { id:string; url:string; title:string; category:string; keywords:string[]; timestamp:string; storage_path:string };
const wallzyR2=(process.env.NEXT_PUBLIC_R2_PUBLIC_URL||"https://img.wallzy.org").replace(/\/+$/,"");
export function normalizeWallzyWallpaper(row:any):WallzyFeedWallpaper{const path=String(row?.storage_path||"").trim();const url=path?(path.startsWith("http://")||path.startsWith("https://")?path:wallzyR2+"/"+path.replace(/^\/+/, "")):String(row?.public_url||row?.url||"");return{id:String(row?.id??""),url,title:row?.title||row?.name||"",category:row?.category||"Other",keywords:Array.isArray(row?.keywords)?row.keywords:[],timestamp:row?.created_at||row?.timestamp||"",storage_path:row?.storage_path||""}}
export function createWallzyLoader(sb:SupabaseClient,category="all"){let loading=false,exhausted=false,total:number|null=null;const seen=new Set<string>(),ranges=new Set<string>();let fallback=0;const value=String(category||"").trim();return async()=>{if(loading||exhausted)return{images:[],hasMore:false};loading=true;try{if(total===null){let q=sb.from("wallpapers").select("id",{count:"exact",head:true});if(value.toLowerCase()!=="all")q=q.eq("category",value);const{count,error}=await q;if(error)throw error;total=Number(count||0)}if(!total)return{images:[],hasMore:false};const out:any[]=[];let attempts=0;while(out.length<20&&attempts++<8&&seen.size<total){const start=Math.max(0,total-5)<=0?0:Math.floor(Math.random()*(total-4));const key=start+":"+Math.min(start+4,total-1);if(ranges.has(key)&&attempts<8)continue;ranges.add(key);let q=sb.from("wallpapers").select("id,category,keywords,storage_path,public_url,created_at").order("created_at",{ascending:false}).order("id",{ascending:false}).range(start,Math.min(start+4,total-1));if(value.toLowerCase()!=="all")q=q.eq("category",value);const{data,error}=await q;if(error)throw error;for(const row of data||[]){const id=String(row.id);if(seen.has(id))continue;seen.add(id);out.push(normalizeWallzyWallpaper(row));if(out.length>=20)break}}if(out.length<20&&seen.size<total){const start=Math.min(fallback,total-1),end=Math.min(start+19,total-1);fallback=end+1;let q=sb.from("wallpapers").select("id,category,keywords,storage_path,public_url,created_at").order("created_at",{ascending:false}).order("id",{ascending:false}).range(start,end);if(value.toLowerCase()!=="all")q=q.eq("category",value);const{data,error}=await q;if(error)throw error;for(const row of data||[]){const id=String(row.id);if(seen.has(id))continue;seen.add(id);out.push(normalizeWallzyWallpaper(row));if(out.length>=20)break}}exhausted=out.length===0||seen.size>=total;return{images:out,hasMore:!exhausted}}finally{loading=false}}}
export async function searchWallzyWallpapers(sb:SupabaseClient,query:string,offset=0){const raw=String(query||"").trim().toLowerCase();if(!raw)return{images:[],hasMore:false};const terms=raw.replace(/[%,()]/g," ").split(/\s+/).filter(Boolean).slice(0,8);const filters=[`category.ilike.%${raw.replace(/[%,()]/g," ")}%`,`storage_path.ilike.%${raw.replace(/[%,()]/g," ")}%`,`public_url.ilike.%${raw.replace(/[%,()]/g," ")}%`];for(const term of terms){const safe=term.replace(/[{}(),]/g,"");if(safe)filters.push(`keywords.cs.{${safe}}`)}const{data,error,count}=await sb.from("wallpapers").select("id,category,keywords,storage_path,public_url,created_at",{count:"exact"}).or(filters.join(",")).order("created_at",{ascending:false}).order("id",{ascending:false}).range(offset,offset+19);if(error)throw error;return{images:(data||[]).map(normalizeWallzyWallpaper),hasMore:Number(count||0)>offset+20}}
export async function loadWallzyCategories(sb:SupabaseClient){const{data,error}=await sb.from("wallpapers").select("category");if(error)throw error;return[...new Set((data||[]).map(x=>String(x.category||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b))}
export async function loadWallzyFavorites(sb:SupabaseClient,user:User|null){if(!user)return[];const{data}=await sb.from("favorites").select("items").eq("user_id",user.id).maybeSingle();return Array.isArray(data?.items)?data.items:[]}
export async function saveWallzyFavorites(sb:SupabaseClient,user:User,items:any[]){const{error}=await sb.from("favorites").upsert({user_id:user.id,items},{onConflict:"user_id"});if(error)throw error}
export async function loadWallzyGradients(sb:SupabaseClient,user:User|null){if(!user)return[];const{data}=await sb.from("gradients").select("items").eq("user_id",user.id).maybeSingle();return Array.isArray(data?.items)?data.items:[]}
export async function saveWallzyGradient(sb:SupabaseClient,user:User,g:any){const existing=await loadWallzyGradients(sb,user);const items=[{...g,id:g.id||Date.now()},...existing].slice(0,50);const{error}=await sb.from("gradients").upsert({user_id:user.id,items},{onConflict:"user_id"});if(error)throw error;return items}
export async function deleteWallzyGradient(sb:SupabaseClient,user:User,id:string|number){const existing=await loadWallzyGradients(sb,user);const items=existing.filter(x=>String(x?.id)!==String(id));const{error}=await sb.from("gradients").upsert({user_id:user.id,items},{onConflict:"user_id"});if(error)throw error;return items}
