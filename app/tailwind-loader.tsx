"use client";
import { useEffect } from "react";
export default function TailwindLoader(){
  useEffect(()=>{
    if(document.querySelector('script[data-wallzy-tailwind]')) return;
    const script=document.createElement("script");
    script.src="https://cdn.tailwindcss.com";
    script.async=true;
    script.dataset.wallzyTailwind="1";
    document.head.appendChild(script);
  },[]);
  return null;
}
