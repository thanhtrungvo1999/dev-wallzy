"use client";

import { useEffect } from "react";

const keyFor=(url=window.location.href)=>"wallzy:scroll:"+new URL(url,window.location.origin).pathname+new URL(url,window.location.origin).search;

function findScroller(){
  const nodes=Array.from(document.querySelectorAll<HTMLElement>("main,section,[role='main']"));
  return nodes.find(el=>{
    const style=getComputedStyle(el);
    return el.scrollHeight>el.clientHeight+8 && /(auto|scroll)/.test(style.overflowY);
  })||null;
}

export default function NavigationScroll(){
  useEffect(()=>{
    if(typeof window==="undefined")return;
    history.scrollRestoration="manual";
    let navigation:"push"|"replace"|"pop"="push";
    const originalPush=history.pushState;
    const originalReplace=history.replaceState;
    history.pushState=function(...args){navigation="push";return originalPush.apply(this,args)};
    history.replaceState=function(...args){navigation="replace";return originalReplace.apply(this,args)};
    const save=()=>{
      const el=findScroller();
      if(!el)return;
      try{sessionStorage.setItem(keyFor(),String(el.scrollTop))}catch{}
    };
    const restore=()=>{
      const el=findScroller();
      if(!el)return;
      if(navigation==="pop"){
        try{
          const value=sessionStorage.getItem(keyFor());
          if(value!==null)el.scrollTop=Number(value)||0;
        }catch{}
      }else if(navigation==="push"){
        el.scrollTop=0;
      }
    };
    const onPop=()=>{navigation="pop";requestAnimationFrame(()=>requestAnimationFrame(restore))};
    const onScroll=()=>save();
    window.addEventListener("popstate",onPop);
    window.addEventListener("scroll",onScroll,true);
    const timer=window.setTimeout(restore,0);
    const observer=new MutationObserver(()=>requestAnimationFrame(restore));
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>{
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("popstate",onPop);
      window.removeEventListener("scroll",onScroll,true);
      history.pushState=originalPush;
      history.replaceState=originalReplace;
      save();
    };
  },[]);
  return null;
}
