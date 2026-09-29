"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="fixed inset-0 z-[99999] flex min-h-[100dvh] items-center justify-center bg-[#08080a] px-6 text-white">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.05] shadow-2xl">
          <i className="fa-solid fa-link-slash text-2xl text-white/80" />
        </div>

        <div className="mt-7 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/35">
          Error 404
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Page Not Found
        </h1>

        <p className="mx-auto mt-3 max-w-[290px] text-sm leading-6 text-white/45">
          This page does not exist or the wallpaper has been removed.
        </p>

        <div className="mt-7 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full rounded-2xl bg-white py-3.5 font-semibold text-black transition active:scale-[0.98]"
          >
            <i className="fa-solid fa-house mr-2" />
            Home
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-3.5 font-semibold text-white transition active:scale-[0.98]"
          >
            <i className="fa-solid fa-arrow-left mr-2" />
            Go Back
          </button>
        </div>
      </div>
    </main>
  );
}
