export default function ConfirmDialog({ title, onConfirm, confirmText = "Confirm" }) {
  return (
    <button onClick={onConfirm} className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white">
      {title ?? confirmText}
    </button>
  );
}
