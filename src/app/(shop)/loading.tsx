export default function Loading() {
  return (
    <div className="fixed inset-x-0 top-0 z-[100] h-1 w-full overflow-hidden bg-ivory">
      <div className="h-full w-1/3 bg-bronze animate-loading-slide" />
    </div>
  );
}
