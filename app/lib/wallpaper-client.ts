"use client";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

let wallzySupabaseClient: SupabaseClient | null = null;

export type WallzyFeedWallpaper = {
  id:string; url:string; original_url:string; title:string; category:string;
  keywords:string[]; timestamp:string; storage_path:string;
};

export function getWallzySupabase(){
  if(wallzySupabaseClient)return wallzySupabaseClient;
  if(!supabaseUrl||!supabaseKey)throw new Error("Supabase environment variables are missing.");
  wallzySupabaseClient=createClient(supabaseUrl,supabaseKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return wallzySupabaseClient;
}

const wallzyR2=(process.env.NEXT_PUBLIC_R2_PUBLIC_URL||"https://img.wallzy.org").replace(/\/+$/,"");
const wallzyTransformBase=(process.env.NEXT_PUBLIC_IMAGE_TRANSFORM_URL||process.env.NEXT_PUBLIC_R2_PUBLIC_URL||"https://img.wallzy.org").replace(/\/+$/,"");

export function normalizeWallzyWallpaper(row:any):WallzyFeedWallpaper{
  const path=String(row?.storage_path||"").trim();
  const originalUrl=path?(path.startsWith("http://")||path.startsWith("https://")?path:wallzyR2+"/"+path.replace(/^\/+/, "")):String(row?.public_url||row?.url||"");
  const url=originalUrl?`${wallzyTransformBase}/cdn-cgi/image/width=240,quality=30,format=auto/${originalUrl}`:"";
  return{id:String(row?.id??""),url,original_url:originalUrl,title:row?.title||row?.name||"",category:row?.category||"Other",keywords:Array.isArray(row?.keywords)?row.keywords:[],timestamp:row?.created_at||row?.timestamp||"",storage_path:row?.storage_path||""};
}

export async function getWallzyLatestMarker(sb:SupabaseClient,category="all"){const value=String(category||"").trim();let q=sb.from("wallpapers").select("id,created_at").order("created_at",{ascending:false}).order("id",{ascending:false}).limit(1);if(value.toLowerCase()!=="all")q=q.ilike("category",value);const{data,error}=await q.maybeSingle();if(error)throw error;const row=data as any;return row?{id:String(row.id??""),created_at:String(row.created_at??"")}:{id:"",created_at:""};}

export function createWallzyLoader(sb:SupabaseClient,category="all",options:{randomize?:boolean;pageSize?:number;initialOffset?:number}={}){
  let loading=false,exhausted=false,initialized=false,offset=Number.isFinite(options.initialOffset)?Math.max(0,Math.floor(options.initialOffset as number)):0;
  const value=String(category||"").trim();
  const randomize=options.randomize!==false;
  const pageSize=Math.min(Math.max(options.pageSize||20,1),50);
  return async()=>{
    if(loading||exhausted)return{images:[],hasMore:false};
    loading=true;
    try{
      if(!initialized){
        if(randomize&&options.initialOffset===undefined){
          let countQuery=sb.from("wallpapers").select("id",{count:"exact",head:true});
          if(value.toLowerCase()!=="all")countQuery=countQuery.eq("category",value);
          const{count,error:countError}=await countQuery;
          if(countError)throw countError;
          const total=count||0;
          offset=total>pageSize?Math.floor(Math.random()*(total-pageSize+1)):0;
        }
        initialized=true;
      }
      const start=offset,end=start+pageSize;
      let q=sb.from("wallpapers").select("id,category,keywords,storage_path,public_url,created_at").order("created_at",{ascending:false}).order("id",{ascending:false});
      if(value.toLowerCase()!=="all")q=q.eq("category",value);
      q=q.range(start,end);
      const{data,error}=await q;
      if(error)throw error;
      const rows=data||[];
      const visibleRows=rows.slice(0,pageSize);
      offset=start+visibleRows.length;
      if(rows.length<=pageSize)exhausted=true;
      return{images:visibleRows.map(normalizeWallzyWallpaper),hasMore:!exhausted,nextOffset:offset};
    }finally{loading=false}
  };
}

export async function searchWallzyWallpapers(sb:SupabaseClient,query:string,offset=0){
  const raw=String(query||"").trim().toLowerCase().replace(/^#+/,"");
  if(!raw)return{images:[],hasMore:false};
  const{data,error}=await sb.rpc("search_wallpapers",{search_query:raw,search_offset:offset,search_limit:21});
  if(error)throw error;
  const rows=Array.isArray(data)?data:[];
  return{images:rows.slice(0,20).map(normalizeWallzyWallpaper),hasMore:rows.length>20};
}

let wallzyCategoriesCache:string[]|null=null;
let wallzyCategoriesPromise:Promise<string[]>|null=null;
export async function loadWallzyCategories(sb:SupabaseClient){
  if(wallzyCategoriesCache)return wallzyCategoriesCache;
  if(wallzyCategoriesPromise)return wallzyCategoriesPromise;
  wallzyCategoriesPromise=(async()=>{
    const{data,error}=await sb.from("categories").select("*");
    if(error)throw error;
    const categories=(data||[]).map((x:any)=>String(x?.name??x?.category??x?.title??x?.slug??"").trim()).filter(Boolean);
    const available=await Promise.all(categories.map(async category=>{
      const{count,error}=await sb.from("wallpapers").select("id",{count:"exact",head:true}).ilike("category",category);
      if(error)throw error;
      return count&&count>0?category:null;
    }));
    const priority=["Sports Graphic","Car Art","Movie","Nature","WILD ANIMAL","Cartoon Character","Chibi"];
    const priorityIndex=(value:string)=>priority.findIndex(x=>x.toLowerCase()===value.toLowerCase());
    wallzyCategoriesCache=[...new Set(available.filter(Boolean) as string[])].sort((a,b)=>{
      const ai=priorityIndex(a),bi=priorityIndex(b);
      if(ai!==-1||bi!==-1){
        if(ai===-1)return 1;
        if(bi===-1)return -1;
        return ai-bi;
      }
      if(a.toLowerCase()==="other")return 1;if(b.toLowerCase()==="other")return -1;return a.localeCompare(b);
    });
    return wallzyCategoriesCache;
  })().catch(error=>{wallzyCategoriesPromise=null;throw error});
  return wallzyCategoriesPromise;
}

export async function loadWallzyFavorites(sb:SupabaseClient,user:User|null){
  if(!user)return[];
  const{data,error}=await sb.from("favorites").select("items").eq("user_id",user.id).maybeSingle();
  if(error)throw error;
  return Array.isArray(data?.items)?data.items.map(normalizeWallzyWallpaper):[];
}
export async function saveWallzyFavorites(sb:SupabaseClient,user:User,items:any[]){
  const normalized=items.map(normalizeWallzyWallpaper);
  const{error}=await sb.from("favorites").upsert({user_id:user.id,items:normalized},{onConflict:"user_id"});
  if(error)throw error;
}
export async function loadWallzyGradients(sb:SupabaseClient,user:User|null){
  if(!user)return[];
  const{data}=await sb.from("gradients").select("items").eq("user_id",user.id).maybeSingle();
  return Array.isArray(data?.items)?data.items:[];
}
export async function saveWallzyGradient(sb:SupabaseClient,user:User,g:any){
  const existing=await loadWallzyGradients(sb,user);
  const items=[{...g,id:g.id||Date.now()},...existing].slice(0,50);
  const{error}=await sb.from("gradients").upsert({user_id:user.id,items},{onConflict:"user_id"});
  if(error)throw error; return items;
}
export async function deleteWallzyGradient(sb:SupabaseClient,user:User,id:string|number){
  const existing=await loadWallzyGradients(sb,user);
  const items=existing.filter(x=>String(x?.id)!==String(id));
  const{error}=await sb.from("gradients").upsert({user_id:user.id,items},{onConflict:"user_id"});
  if(error)throw error; return items;
}
