export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
      <div
        className="h-9 w-9 rounded-full border-2 border-white/20 border-t-white animate-spin"
        aria-label="Loading"
      />
    </div>
  );
}
