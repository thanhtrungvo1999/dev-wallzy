"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getWallzySupabase, loadWallzyGradients, saveWallzyGradient, deleteWallzyGradient } from "../lib/wallpaper-client";

const GradientStudio = dynamic(() => import("../components/GradientStudio"), { ssr: true });
const AuthModal = dynamic(() => import("../components/AuthModal"), { ssr: true });


function TouchRipple(){useEffect(()=>{const handler=(event:PointerEvent)=>{const target=(event.target as HTMLElement)?.closest?.("button,a,[role='button'],.ripple-target") as HTMLElement|null;if(!target||target.hasAttribute("disabled")||target.getAttribute("aria-disabled")==="true")return;const rect=target.getBoundingClientRect();if(!rect.width||!rect.height)return;const ripple=document.createElement("span");ripple.className="native-ripple";ripple.style.left=(event.clientX-rect.left)+"px";ripple.style.top=(event.clientY-rect.top)+"px";const radius=Math.max(rect.width,rect.height)*1.5;ripple.style.width=radius+"px";ripple.style.height=radius+"px";target.appendChild(ripple);window.setTimeout(()=>ripple.remove(),430)};document.addEventListener("pointerdown",handler,true);return()=>document.removeEventListener("pointerdown",handler,true)},[]);return null}
function WallzyAd({size}:{size:"320x50"|"300x250"}) {
  const [ready,setReady]=useState(false);
  useEffect(()=>{let cancelled=false;const delay=size==="320x50"?1200:2200;const run=()=>{if(!cancelled)setReady(true)};const w=window as typeof window & {requestIdleCallback?:Function;cancelIdleCallback?:Function};let id:any;const timer=window.setTimeout(run,delay);if(w.requestIdleCallback)id=w.requestIdleCallback(run,{timeout:delay});return()=>{cancelled=true;clearTimeout(timer);if(id!==undefined)w.cancelIdleCallback?.(id)}},[size]);
  const cfg=size==="320x50"?{w:320,h:50,key:"2c49a0e222fe3b51d12473cd1592ca66",src:"https://www.highrevenueformat.com/2c49a0e222fe3b51d12473cd1592ca66/invoke.js"}:{w:300,h:250,key:"d57e1d0e6497dfaa47e074d39d673693",src:"https://pl31436544.profitableratecpmnetwork.com/d57e1d0e6497dfaa47e074d39d673693/invoke.js"};
  const srcDoc=size==="320x50"?`<!DOCTYPE html><html><body style="margin:0;overflow:hidden"><script>atOptions={'key':'${cfg.key}','format':'iframe','height':50,'width':320,'params':{}};</script><script src="${cfg.src}"></script></body></html>`:`<!DOCTYPE html><html><body style="margin:0;overflow:hidden"><script async="async" data-cfasync="false" src="${cfg.src}"></script><div id="container-${cfg.key}"></div></body></html>`;
  return <div className={size==="320x50"?"wallzy-ad-frame-320":"wallzy-ad-frame-300"}><div className="wallzy-ad-frame-inner">{ready&&<iframe title="Advertisement" width={cfg.w} height={cfg.h} loading="lazy" sandbox="allow-scripts allow-same-origin allow-popups" srcDoc={srcDoc} style={{width:cfg.w,height:cfg.h,border:0}} scrolling="no"/>}</div></div>;
}

export default function StudioPageClient(){
  const router=useRouter();
  const [user,setUser]=useState<any>(null),[saved,setSaved]=useState<any[]>([]),[loading,setLoading]=useState(true),[authOpen,setAuthOpen]=useState(false),[message,setMessage]=useState("");
  const accountLabel=user?.user_metadata?.full_name?.split(" ")[0]||"Account";

  useEffect(()=>{let cancelled=false;const sb=getWallzySupabase();const run=async()=>{try{const {data:{session}}=await sb.auth.getSession();let u=session?.user||null;if(!u){const {data:{user:v}}=await sb.auth.getUser();u=v||null}if(cancelled)return;setUser(u);if(!u){setSaved([]);return}setSaved(await loadWallzyGradients(sb,u))}catch(e){if(!cancelled)setMessage("Unable to load your gradients.")}finally{if(!cancelled)setLoading(false)}};void run();const sub=sb.auth.onAuthStateChange(async(_e,s)=>{const u=s?.user||null;setUser(u);if(!u){setSaved([]);return}try{setSaved(await loadWallzyGradients(sb,u))}catch{setMessage("Unable to load your gradients.")}}).data.subscription;return()=>{cancelled=true;sub.unsubscribe()}},[]);

  const onSave=async(g:any)=>{if(!user){setAuthOpen(true);return}try{setSaved(await saveWallzyGradient(getWallzySupabase(),user,g))}catch{setMessage("Unable to save gradient. Please try again.")}};
  const onDelete=async(id:string|number)=>{if(!user){setAuthOpen(true);return}try{setSaved(await deleteWallzyGradient(getWallzySupabase(),user,id))}catch{setMessage("Unable to delete gradient.")}};
  const onDownload=(g:any)=>{const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext("2d");if(!ctx)return;const gr=g.type==="circle"?ctx.createRadialGradient(540,960,0,540,960,960):ctx.createLinearGradient(0,0,1080,1920);gr.addColorStop(0,g.color1||"#111111");gr.addColorStop(1,g.color2||"#ffffff");ctx.fillStyle=gr;ctx.fillRect(0,0,1080,1920);canvas.toBlob(b=>{if(!b)return;const u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="wallzy-gradient.png";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)},"image/png")};

  return <main className="fixed inset-0 bg-black text-white overflow-hidden"><TouchRipple/>
    <header className="absolute top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl px-5 py-3.5 flex items-center justify-between border-b border-white/10">
      <button type="button" onClick={()=>router.push("/")} className="w-9 h-9 rounded-full bg-[#121215] border border-white/10 flex items-center justify-center"><i className="fa-solid fa-arrow-left text-xs"/></button>
      <div className="text-center"><h1 className="text-sm font-bold">Studio</h1><p className="text-[9px] text-white/35">Gradient Studio</p></div>
      <button type="button" onClick={()=>setAuthOpen(true)} className="px-3 py-1.5 rounded-full bg-[#121215] border border-white/10 text-gray-200 text-xs font-semibold"><i className="fa-solid fa-user-circle mr-1.5"/>{accountLabel}</button>
    </header>
    <section className="h-full overflow-y-auto scrollbar-none px-5 pt-[92px] pb-[360px]">
      <div className="flex justify-center mb-3"><WallzyAd size="320x50"/></div>
      <GradientStudio saved={saved} onSave={onSave} onDownload={onDownload} onDelete={onDelete}/>
      <div className="mt-8 flex justify-center"><WallzyAd size="300x250"/></div>
      <div className="w-full flex justify-center items-center pt-[30px] pb-8"><div className="flex items-center justify-center gap-3 text-[15px] text-white/70 font-bold"><a href="/terms">Terms of Use</a><span>|</span><a href="/privacy">Privacy Policy</a><span>|</span><a href="/contact">Contact</a></div></div>
    </section>
    <BottomNav router={router}/>
    {authOpen&&<AuthModal user={user} onClose={()=>setAuthOpen(false)} onLogin={async()=>{await getWallzySupabase().auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.href}})}} onLogout={async()=>{await getWallzySupabase().auth.signOut();setAuthOpen(false);setSaved([])}}/>}
    {message&&<div className="fixed inset-0 z-[1700] bg-black/70 flex items-center justify-center p-5"><div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-5 w-full max-w-xs text-center"><p className="text-xs">{message}</p><button onClick={()=>setMessage("")} className="mt-4 w-full bg-white text-black rounded-2xl py-2.5 text-xs font-semibold">Got it</button></div></div>}
  </main>
}
function BottomNav({router}:{router:any}){return <footer className="absolute bottom-12 inset-x-6 z-40 bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/10 py-2.5 px-6 flex justify-around items-center rounded-full shadow-2xl">{[["/","fa-regular fa-compass","Explore"],["/favorites","fa-regular fa-heart","Favorites"],["/studio","fa-solid fa-palette","Studio"],["/tiktok","fa-brands fa-tiktok","TikTok"]].map(([path,icon,label],i)=><div key={path} className="contents">{i>0&&<div className="w-px h-4 bg-white/10"/>}<button type="button" onClick={()=>router.push(path)} className={"flex flex-col items-center space-y-0.5 "+(path==="/studio"?"text-white":"text-gray-400")}><i className={icon+" text-xs"}/><span className="text-[9px] font-semibold">{label}</span></button></div>)}</footer>}
