"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getWallzySupabase, searchWallzyWallpapers } from "../lib/wallpaper";

const HISTORY_KEY="wallzy:search-history";

function SearchCard({wallpaper,onOpen}:{wallpaper:any;onOpen:()=>void}){
  const[loaded,setLoaded]=useState(false);
  const url=String(wallpaper?.url||"");
  const title=String(wallpaper?.title||wallpaper?.category||"Wallpaper");
  return <button type="button" onClick={onOpen} className="relative w-full aspect-[9/16] overflow-hidden rounded-3xl bg-[#0a0a0c] border border-white/10 text-left">{!loaded&&<div className="absolute inset-0 animate-pulse bg-white/[0.04]"/>}{url&&<img src={url} alt={title+" wallpaper"} loading="lazy" decoding="async" onLoad={()=>setLoaded(true)} onError={()=>setLoaded(true)} className={"absolute inset-0 w-full h-full object-cover transition-opacity duration-300 "+(loaded?"opacity-100":"opacity-0")}/>}<div className="absolute inset-x-2 bottom-2 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[9px] font-semibold uppercase tracking-wider text-white/90 truncate">#{String(wallpaper?.category||"Wallpaper")}</div></button>
}

export default function SearchPageClient(){
  const router=useRouter();
  const params=useSearchParams();
  const query=params.get("q")?.trim()||"";
  const rawPage=Number(params.get("page")||"1");
  const currentPage=Number.isFinite(rawPage)&&rawPage>0?Math.min(Math.floor(rawPage),50):1;
  const pageRef=useRef(currentPage);
  const loadedPageRef=useRef(0);
  const mainRef=useRef<HTMLElement|null>(null);
  const scrollKey=`wallzy:search-scroll:${query.toLowerCase()}`;
  const[input,setInput]=useState(query),[recent,setRecent]=useState<string[]>([]),[items,setItems]=useState<any[]>([]),[loading,setLoading]=useState(false),[loadingMore,setLoadingMore]=useState(false),[hasMore,setHasMore]=useState(false),[error,setError]=useState("");
  const sb=useMemo(()=>getWallzySupabase(),[]);

  useEffect(()=>{setInput(query);loadedPageRef.current=0},[query]);
  useEffect(()=>{pageRef.current=currentPage},[currentPage]);
  useEffect(()=>{try{const saved=JSON.parse(window.localStorage.getItem(HISTORY_KEY)||"[]");setRecent(Array.isArray(saved)?saved.filter((x:any)=>typeof x==="string"&&x.trim()).slice(0,8):[])}catch{setRecent([])}},[]);

  useEffect(()=>{
    let cancelled=false;
    if(!query){setItems([]);setHasMore(false);setLoading(false);setError("");return}
    if(currentPage===loadedPageRef.current)return;
    setLoading(true);setError("");
    const loads=Array.from({length:currentPage},(_,index)=>searchWallzyWallpapers(sb,query,index*20));
    Promise.all(loads).then(pages=>{if(cancelled)return;const loaded=pages.flatMap(page=>page.images||[]);const last=pages[pages.length-1];setItems(loaded);setHasMore(Boolean(last?.hasMore));loadedPageRef.current=currentPage}).catch(err=>{console.error("[Wallzy] Search failed:",err);if(!cancelled){setItems([]);setHasMore(false);setError("Unable to search wallpapers. Please try again.")}}).finally(()=>{if(!cancelled)setLoading(false)});
    return()=>{cancelled=true};
  },[query,currentPage,sb]);

  useEffect(()=>{const main=mainRef.current;if(!main)return;const restore=()=>{try{const raw=sessionStorage.getItem(scrollKey);if(raw!==null)main.scrollTop=Number(raw)||0}catch{}};if(!loading){restore();requestAnimationFrame(restore);setTimeout(restore,0)}return()=>{try{sessionStorage.setItem(scrollKey,String(main.scrollTop||0))}catch{}}},[loading,scrollKey]);

  const submit=(raw:string)=>{
    const q=raw.trim();
    if(!q){router.push("/search");return}
    const next=[q,...recent.filter(x=>x.toLowerCase()!==q.toLowerCase())].slice(0,8);
    setRecent(next);
    try{window.localStorage.setItem(HISTORY_KEY,JSON.stringify(next))}catch{}
    router.push("/search?q="+encodeURIComponent(q));
  };

  const loadMore=async()=>{
    if(!query||loadingMore||!hasMore)return;
    setLoadingMore(true);
    try{
      const nextPage=pageRef.current+1;
      const page=await searchWallzyWallpapers(sb,query,items.length);
      setItems(prev=>[...prev,...(page.images||[])]);
      setHasMore(Boolean(page.hasMore));
      pageRef.current=nextPage;
      loadedPageRef.current=nextPage;
      const next=new URLSearchParams(window.location.search);
      next.set("page",String(nextPage));
      window.history.replaceState(null,"",window.location.pathname+"?"+next.toString());
    }catch(err){console.error("[Wallzy] Search load more failed:",err)}
    finally{setLoadingMore(false)}
  };

  return <div className="w-full min-h-[100dvh] bg-black text-white">
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10"><div className="flex items-center gap-3 px-4 pt-[max(14px,env(safe-area-inset-top))] pb-3">
      <button type="button" onClick={()=>router.back()} className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white hover:bg-white/10" aria-label="Back"><i className="fa-solid fa-arrow-left"/></button>
      <form id="wallzy-search-form" onSubmit={e=>{e.preventDefault();submit(input)}} className="relative flex-1"><i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"/><input autoFocus value={input} onChange={e=>setInput(e.target.value)} placeholder="Search wallpapers..." className="w-full bg-[#0a0a0c] border border-white/10 rounded-2xl py-3 pl-10 pr-10 text-[16px] text-white placeholder-gray-500 focus:outline-none focus:border-white/30"/>{input&&<button type="button" onClick={()=>setInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label="Clear"><i className="fa-solid fa-xmark"/></button>}</form>
      <button type="submit" form="wallzy-search-form" className="text-sm font-semibold text-white">Search</button>
    </div></header>
    <main ref={mainRef} className="max-w-3xl mx-auto px-5 py-5 pb-20 overflow-y-auto max-h-[calc(100dvh-72px)] scrollbar-none">
      {!query?<section className="rounded-3xl border border-white/10 bg-[#0a0a0c] overflow-hidden"><div className="flex items-center justify-between px-4 py-4 border-b border-white/10"><div><h1 className="text-sm font-semibold text-white">Recent searches</h1><p className="text-[11px] text-white/40 mt-1">Your recent wallpaper searches</p></div>{recent.length>0&&<button type="button" onClick={()=>{setRecent([]);try{window.localStorage.removeItem(HISTORY_KEY)}catch{}}} className="text-[11px] text-white/45 hover:text-white">Clear</button>}</div>{recent.length>0?<div className="divide-y divide-white/5">{recent.map(q=><button type="button" key={q} onClick={()=>submit(q)} className="w-full flex items-center gap-3 px-4 py-4 text-left text-white/80 hover:bg-white/5"><i className="fa-regular fa-clock text-white/35 text-xs"/><span className="truncate">{q}</span><i className="fa-solid fa-arrow-right ml-auto text-[10px] text-white/25"/></button>)}</div>:<div className="px-5 py-12 text-center"><div className="mx-auto w-14 h-14 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center"><i className="fa-regular fa-clock text-white/25 text-xl"/></div><div className="mt-3 text-sm font-medium text-white/70">No recent searches</div><div className="mt-1 text-xs text-white/35">Searches you make will appear here.</div></div>}</section>:<>
        <div className="flex items-center justify-between mb-4"><div><div className="text-[11px] uppercase tracking-wider text-white/40">Search results</div><h1 className="mt-1 text-base font-semibold text-white">“{query}”</h1></div><span className="text-[11px] text-white/35">{items.length}{hasMore?"+":""} results</span></div>
        {loading?<div className="grid grid-cols-2 gap-3.5">{Array.from({length:8}).map((_,i)=><div key={i} className="aspect-[9/16] rounded-3xl bg-white/[0.04] animate-pulse border border-white/10"/>)}</div>:error?<div className="rounded-3xl border border-white/10 bg-[#0a0a0c] p-8 text-center text-sm text-white/60">{error}</div>:items.length===0?<div className="rounded-3xl border border-white/10 bg-[#0a0a0c] p-10 text-center"><div className="text-sm font-semibold">No matching wallpapers found.</div><div className="mt-2 text-xs text-white/40">Try a shorter keyword such as anime, car, nature, girl, or 4k.</div></div>:<><div className="grid grid-cols-2 gap-3.5">{items.map(w=><SearchCard key={String(w.id)} wallpaper={w} onOpen={()=>{try{sessionStorage.setItem(scrollKey,String(mainRef.current?.scrollTop||0))}catch{}router.push("/wallpaper/"+encodeURIComponent(String(w.id)))}}/>)}</div>{hasMore&&<button type="button" onClick={loadMore} disabled={loadingMore} className="w-full mt-5 py-3 rounded-2xl bg-[#121215] border border-white/10 text-sm font-semibold text-white disabled:opacity-50">{loadingMore?"Loading...":"Load more"}</button>}</>}
      </>}
    </main>
  </div>
}
