"use client";
import { useEffect, useMemo, useState } from "react";
import WallpaperCard from "./WallpaperCard";

const HOME_SESSION_KEY="wallzy:home-category-cache:v1";
function readHomeSession(categories:string[]){
  try{
    const raw=window.sessionStorage.getItem(HOME_SESSION_KEY);
    if(!raw)return null;
    const data=JSON.parse(raw);
    if(!Array.isArray(data?.categories)||data.categories.join("|")!==categories.join("|")||!Array.isArray(data?.sections))return null;
    return data.sections;
  }catch{return null}
}
function writeHomeSession(categories:string[],sections:any[]){
  try{window.sessionStorage.setItem(HOME_SESSION_KEY,JSON.stringify({categories:[...categories],sections}));}catch{}
}

export default function HomeCategorySections({categories,favorites,onNavigate,onToggleFavorite,onViewAll,sb}:{categories:string[];favorites:any[];onNavigate:(wallpaper:any)=>void;onToggleFavorite:(id:string)=>void;onViewAll:(category:string)=>void;sb:any}){
  const hasCategories=Array.isArray(categories)&&categories.length>0;
  const sessionSections=useMemo(()=>hasCategories?readHomeSession(categories):null,[categories,hasCategories]);
  const[sections,setSections]=useState<any[]>(()=>sessionSections||[]);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    let cancelled=false;

    if(!hasCategories){
      setSections([]);
      setLoading(true);
      return()=>{cancelled=true};
    }

    (async()=>{
      if(!sb)return;

      const cached=readHomeSession(categories);
      if(cached){
        if(cancelled)return;
        setSections(cached);
        setLoading(false);
        return;
      }

      setSections([]);
      setLoading(true);

      const client=await import("../lib/wallpaper-client");

      const loadOne=async(category:string)=>{
        try{
          const loader=client.createWallzyLoader(sb,category,{randomize:true,pageSize:6});
          const page=await loader();
          return{category,items:page.images||[]};
        }catch(error){
          console.error("[Wallzy] Home category load failed:",category,error);
          return{category,items:[]};
        }
      };

      try{
        const results=await Promise.all(categories.map(loadOne));
        if(cancelled)return;
        const next=results.filter(x=>x.items.length>0);
        writeHomeSession(categories,next);
        setSections(next);
      }finally{
        if(!cancelled)setLoading(false);
      }
    })();

    return()=>{cancelled=true};
  },[sb,categories,hasCategories]);

  const favSet=useMemo(()=>new Set((favorites||[]).map((x:any)=>String(x?.id||""))),[favorites]);

  if(loading||!hasCategories){
    return <div className="space-y-7 min-h-[1900px]">
      {(hasCategories?categories:[""]).map((category,sectionIndex)=>(
        <section key={category||sectionIndex} className="min-w-0 min-h-[292px]">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="h-4 w-28 rounded-full skeleton-wave"/>
            <div className="h-3 w-14 rounded-full skeleton-wave"/>
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({length:6}).map((_,i)=>(
              <div key={i} className="relative shrink-0 w-[145px] aspect-[9/16] rounded-3xl bg-[#0a0a0c] overflow-hidden border border-white/10">
                <div className="absolute inset-0 skeleton-wave"/>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>;
  }

  return <div id="homeCategorySections" className="space-y-7 min-h-[1900px]">
    {categories.map((category,sectionIndex)=>{
      const section=sections.find((x:any)=>x.category===category);
      if(!section){
        return <section key={category} className="min-w-0 min-h-[292px]">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-white truncate">{category}</h2>
            <button type="button" onClick={()=>onViewAll(category)} className="ripple-target shrink-0 ml-3 text-[10px] font-semibold uppercase tracking-wider text-white/50 hover:text-white transition">
              View all <i className="fa-solid fa-arrow-right ml-1 text-[8px]"/>
            </button>
          </div>
        </section>;
      }

      const{items}=section;
      return <section key={category} className="min-w-0 min-h-[292px]">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-white truncate">{category}</h2>
          <button type="button" onClick={()=>onViewAll(category)} className="ripple-target shrink-0 ml-3 text-[10px] font-semibold uppercase tracking-wider text-white/50 hover:text-white transition">
            View all <i className="fa-solid fa-arrow-right ml-1 text-[8px]"/>
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto overscroll-x-contain scrollbar-none pb-1">
          {items.map((w:any,i:number)=>
            <div key={String(w.id)} className="shrink-0 w-[145px]">
              <WallpaperCard
                wallpaper={w}
                isFavorite={favSet.has(String(w.id))}
                isPriority={sectionIndex===0&&i===0}
                showCategory={false}
                showFavorite={false}
                onNavigate={()=>onNavigate(w)}
                onToggleFavorite={()=>onToggleFavorite(String(w.id))}
              />
            </div>
          )}
        </div>
      </section>;
    })}
  </div>;
}
