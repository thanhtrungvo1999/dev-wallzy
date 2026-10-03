export default function Loading() {
  return (
    <div className="fixed inset-0 z-[2147482000] flex items-center justify-center bg-black/20">
      <div
        className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/15 border-t-white"
        aria-label="Loading"
        role="status"
      />
    </div>
  );
}
