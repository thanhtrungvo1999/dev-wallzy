export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[99999] w-full h-[100dvh] bg-black overflow-hidden">
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10">
        <div className="h-9 w-9 rounded-full skeleton-wave" />
        <div className="h-7 w-32 rounded-full skeleton-wave" />
        <div className="flex gap-2">
          <div className="h-9 w-9 rounded-full skeleton-wave" />
          <div className="h-9 w-24 rounded-full skeleton-wave" />
        </div>
      </div>
      <main className="px-5 pt-3">
        <div className="h-12 w-full rounded-2xl skeleton-wave mb-2" />
        <div className="flex gap-2 overflow-hidden py-2.5">
          {[120,110,130,115,125].map((w,i) => (
            <div key={i} style={{width:w}} className="h-9 shrink-0 rounded-full skeleton-wave" />
          ))}
        </div>
        <div className="h-[60px] w-full rounded-2xl skeleton-wave mb-5" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({length:6}).map((_,i) => (
            <div key={i} className="aspect-[9/16] rounded-3xl skeleton-wave" />
          ))}
        </div>
      </main>
    </div>
  );
}
