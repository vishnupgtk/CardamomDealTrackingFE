export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-700" />
    </div>
  );
}
