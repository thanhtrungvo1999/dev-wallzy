"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import BottomNav from "../components/BottomNav";
import {
  getWallzySupabase,
  loadWallzyFavorites,
  saveWallzyFavorites,
} from "../lib/wallpaper-client";

const WallpaperGrid = dynamic(() => import("../components/WallpaperGrid"), { ssr: false });
const AuthModal = dynamic(() => import("../components/AuthModal"), { ssr: false });

function WallzyAd({size}:{size:"320x50"|"300x250"}) {
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    let cancelled=false;
    const delay=size==="320x50"?1200:2200;
    const run=()=>{if(!cancelled)setReady(true)};
    const w=window as typeof window & {
      requestIdleCallback?: (cb:()=>void,options?:{timeout:number})=>number;
      cancelIdleCallback?: (id:number)=>void;
    };
    let idleId:number|undefined;
    const timer=window.setTimeout(run,delay);
    if(w.requestIdleCallback) idleId=w.requestIdleCallback(run,{timeout:delay});
    return()=>{
      cancelled=true;
      window.clearTimeout(timer);
      if(idleId!==undefined)w.cancelIdleCallback?.(idleId);
    };
  },[size]);

  const cfg=size==="320x50"
    ? {w:320,h:50,key:"2c49a0e222fe3b51d12473cd1592ca66",provider:"highrevenue"}
    : {w:300,h:250,key:"d57e1d0e6497dfaa47e074d39d673693",provider:"profitablerate"};

  const srcDoc = cfg.provider === "highrevenue"
    ? `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body><script>atOptions={'key':'${cfg.key}','format':'iframe','height':${cfg.h},'width':${cfg.w},'params':{}};</script><script src="https://www.highrevenueformat.com/${cfg.key}/invoke.js"></script></body></html>`
    : `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body><script async="async" data-cfasync="false" src="https://pl31436544.profitableratecpmnetwork.com/${cfg.key}/invoke.js"></script><div id="container-${cfg.key}"></div></body></html>`;

  return (
    <div className={size==="320x50"?"wallzy-ad-frame-320":"wallzy-ad-frame-300"}>
      <div className="wallzy-ad-frame-inner">
        {ready&&
          <iframe
            title="Advertisement"
            width={cfg.w}
            height={cfg.h}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups"
            srcDoc={srcDoc}
            style={{width:cfg.w,height:cfg.h,border:0,overflow:"hidden"}}
            scrolling="no"
          />
        }
      </div>
    </div>
  );
}

export default function FavoritesPageClient() {
  const router=useRouter();
  const [user,setUser]=useState<any>(null);
  const [favorites,setFavorites]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [authOpen,setAuthOpen]=useState(false);
  const [message,setMessage]=useState("");

  const accountLabel=user?.user_metadata?.full_name?.split(" ")[0]||"Account";

  useEffect(()=>{
    let cancelled=false;
    const sb=getWallzySupabase();

    const run=async()=>{
      try{
        const {data:{session}}=await sb.auth.getSession();
        let currentUser=session?.user||null;

        if(!currentUser){
          const {data:{user:verifiedUser}}=await sb.auth.getUser();
          currentUser=verifiedUser||null;
        }

        if(cancelled)return;
        setUser(currentUser);

        if(!currentUser){
          setFavorites([]);
          setLoading(false);
          return;
        }

        const items=await loadWallzyFavorites(sb,currentUser);
        if(!cancelled)setFavorites(items);
      }catch(error){
        if(!cancelled){
          console.error("[Wallzy] Favorites page query failed:",error);
          setMessage("Unable to load your favorites.");
        }
      }finally{
        if(!cancelled)setLoading(false);
      }
    };

    void run();

    const subscription=sb.auth.onAuthStateChange(async(_event,session)=>{
      if(cancelled)return;
      const nextUser=session?.user||null;
      setUser(nextUser);

      if(!nextUser){
        setFavorites([]);
        setLoading(false);
        return;
      }

      try{
        setLoading(true);
        const items=await loadWallzyFavorites(sb,nextUser);
        if(!cancelled)setFavorites(items);
      }catch(error){
        if(!cancelled){
          console.error("[Wallzy] Favorites auth reload failed:",error);
          setMessage("Unable to load your favorites.");
        }
      }finally{
        if(!cancelled)setLoading(false);
      }
    }).data.subscription;

    return()=>{
      cancelled=true;
      subscription.unsubscribe();
    };
  },[]);

  const toggleFavorite=async(id:string)=>{
    if(!user){
      setAuthOpen(true);
      return;
    }

    const current=favorites;
    const exists=current.some(item=>String(item?.id)===String(id));
    if(!exists)return;

    const next=current.filter(item=>String(item?.id)!==String(id));
    setFavorites(next);

    try{
      await saveWallzyFavorites(getWallzySupabase(),user,next);
    }catch(error){
      console.error("[Wallzy] Favorite update failed:",error);
      setFavorites(current);
      setMessage("Unable to update favorite. Please try again.");
    }
  };

  const view=useMemo(()=>({
    mode:"favorites",
    items:favorites,
    favorites,
    displayedCount:favorites.length,
    hasMore:false,
    loading,
    loadingMore:false,
  }),[favorites,loading]);

  const handleLogin=async()=>{
    try{
      const sb=getWallzySupabase();
      const {error}=await sb.auth.signInWithOAuth({
        provider:"google",
        options:{redirectTo:window.location.href},
      });
      if(error)throw error;
    }catch(error:any){
      setMessage("Login failed: "+(error?.message||error));
    }
  };

  const handleLogout=async()=>{
    try{
      await getWallzySupabase().auth.signOut();
      setAuthOpen(false);
      setFavorites([]);
    }catch{
      setMessage("Error signing out.");
    }
  };

  return (
    <main className="fixed inset-0 bg-black text-white overflow-hidden">
      <header className="absolute top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl px-5 py-3.5 flex items-center justify-between border-b border-white/10">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-[#121215] border border-white/10 flex items-center justify-center"
          aria-label="Home"
        >
          <i className="fa-solid fa-arrow-left text-xs"/>
        </button>

        <div className="text-center">
          <h1 className="text-sm font-bold">Favorites</h1>
          {!loading&&user&&<p className="text-[9px] text-white/35">{favorites.length} saved</p>}
        </div>

        <button
          type="button"
          onClick={()=>setAuthOpen(true)}
          className="px-3 py-1.5 rounded-full bg-[#121215] border border-white/10 text-gray-200 text-xs font-semibold"
        >
          <i className="fa-solid fa-user-circle mr-1.5"/>
          {accountLabel}
        </button>
      </header>

      <section className="h-full overflow-y-auto scrollbar-none px-5 pt-[92px] pb-[360px]">
        <div className="flex justify-center mb-3">
          <WallzyAd size="320x50"/>
        </div>

        <WallpaperGrid
          view={view}
          onNavigate={(wallpaper)=>{
            window.sessionStorage.setItem("wallzy:return-url",window.location.href);
            router.push("/wallpaper/"+encodeURIComponent(String(wallpaper.id)));
          }}
          onToggleFavorite={toggleFavorite}
          onLoadMore={()=>{}}
          onExplore={()=>router.push("/")}
        />

        <div className="mt-8 flex justify-center">
          <WallzyAd size="300x250"/>
        </div>

        <div className="w-full flex justify-center items-center pt-[30px] pb-8">
          <div className="flex items-center justify-center gap-3 text-[15px] text-white/70 font-bold">
            <a href="/terms" className="hover:text-white transition">Terms of Use</a>
            <span className="text-white/40">|</span>
            <a href="/privacy" className="hover:text-white transition">Privacy Policy</a>
            <span className="text-white/40">|</span>
            <a href="/contact" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </section>

      <BottomNav active="favorites" />

      {authOpen&&
        <AuthModal
          user={user}
          onClose={()=>setAuthOpen(false)}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
      }

      {message&&
        <div className="fixed inset-0 z-[1700] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-5 w-full max-w-xs text-center">
            <p className="text-xs text-white">{message}</p>
            <button
              type="button"
              onClick={()=>setMessage("")}
              className="mt-4 w-full bg-white text-black rounded-2xl py-2.5 text-xs font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      }
    </main>
  );
}

