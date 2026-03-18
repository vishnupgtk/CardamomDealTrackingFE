import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="app-panel w-full max-w-3xl p-8 md:p-10">
        <div className="flex flex-col">
          <img src="/cae-logo.svg" alt="CAE Groups" className="h-12 w-auto" />
          <p className="ml-[4.5rem] mt-1 text-sm font-medium text-slate-600">Stock and Sales Tracking</p>
        </div>
        <p className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
          Cardamom Business Suite
        </p>
        <p className="mt-3 max-w-2xl text-slate-600">
          Manage stock purchases, sales deals, partner shares, payment approvals, and profit ledger from one place.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-xl bg-emerald-700 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-800" to="/register">
            Register
          </Link>
          <Link className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50" to="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
