const styles = {
  Approved: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  Pending: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  Rejected: "bg-rose-100 text-rose-800 ring-1 ring-rose-200",
  Completed: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
};

export default function StatusBadge({ status }) {
  const cls = styles[status] ?? "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{status}</span>;
}
