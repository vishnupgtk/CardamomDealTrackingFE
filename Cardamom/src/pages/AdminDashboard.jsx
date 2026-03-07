import { useEffect, useState } from "react";
import AppShell from "../layout/AppShell";
import LoadingSpinner from "../components/LoadingSpinner";
import { addExpenditure, getAdminDashboard, getExpenditures } from "../services/adminService";
import { formatKg, formatRs } from "../utils/formatters";

const links = [
  { label: "Dashboard", to: "/admin" },
  { label: "Stocks", to: "/admin/stocks" },
  { label: "Sales", to: "/admin/sales" },
  { label: "Users", to: "/admin/users" },
  { label: "Payment Requests", to: "/admin/payment-requests" },
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [expenditures, setExpenditures] = useState([]);
  const [form, setForm] = useState({
    amount: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const loadDashboard = async () => {
    try {
      const [dashboardRes, expenditureRes] = await Promise.all([
        getAdminDashboard(),
        getExpenditures(),
      ]);
      setData(dashboardRes);
      setExpenditures(Array.isArray(expenditureRes) ? expenditureRes : []);
    } catch {
      setData({});
      setExpenditures([]);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onSubmitExpenditure = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const amount = Number(form.amount);
    if (amount <= 0) {
      setFormError("Expenditure amount must be greater than zero.");
      return;
    }

    setSaving(true);
    try {
      await addExpenditure({
        amount,
        expenseDate: form.expenseDate || null,
        notes: form.notes?.trim() || null,
      });
      setForm({
        amount: "",
        expenseDate: new Date().toISOString().slice(0, 10),
        notes: "",
      });
      setFormSuccess("Expenditure added successfully.");
      await loadDashboard();
    } catch (err) {
      setFormError(err?.response?.data?.error ?? err?.response?.data?.message ?? "Failed to add expenditure.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell links={links}>
      {!data ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-extrabold tracking-tight text-emerald-900">Admin Dashboard</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="Total Purchases" value={formatKg(data.totalPurchases)} />
            <Card label="Total Sales" value={formatRs(data.totalSales)} />
            <Card label="Outstanding Payments" value={formatRs(data.outstandingPayments)} />
            <Card label="Gross Profit" value={formatRs(data.totalProfit)} />
            <Card label="Total Expenditure" value={formatRs(data.totalExpenditure)} />
            <Card label="Net Profit" value={formatRs(data.netProfit)} />
            <Card label="Today's Payments" value={formatRs(data.todaysPayments)} />
            <Card label="Remaining Stock" value={formatKg(data.stockSummary?.remainingStock)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <h3 className="text-lg font-bold text-emerald-900">Add Expenditure</h3>
              <p className="mt-1 text-sm text-slate-600">Track money spent from profit with notes.</p>

              <form onSubmit={onSubmitExpenditure} className="mt-4 space-y-3">
                {formError ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {formError}
                  </div>
                ) : null}
                {formSuccess ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {formSuccess}
                  </div>
                ) : null}

                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-700">Amount *</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-600 focus:ring-2"
                    placeholder="Enter amount"
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-700">Expense Date</span>
                  <input
                    type="date"
                    value={form.expenseDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, expenseDate: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-600 focus:ring-2"
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-700">Notes</span>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-600 focus:ring-2"
                    placeholder="Why this expenditure?"
                  />
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Add Expenditure"}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
              <h3 className="text-lg font-bold text-emerald-900">Recent Expenditures</h3>
              <div className="mt-3 overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Amount</th>
                      <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Added By</th>
                      <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenditures.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                          No expenditures added yet.
                        </td>
                      </tr>
                    ) : (
                      expenditures.map((item) => (
                        <tr key={item.expenditureId} className="border-t border-slate-100">
                          <td className="px-3 py-2 text-slate-700">{new Date(item.expenseDate).toLocaleDateString()}</td>
                          <td className="px-3 py-2 font-semibold text-slate-800">{formatRs(item.amount)}</td>
                          <td className="px-3 py-2 text-slate-700">{item.createdBy}</td>
                          <td className="px-3 py-2 text-slate-700">
                            {item.notes ? (
                              <span className="inline-block max-w-[360px] truncate align-bottom" title={item.notes}>
                                {item.notes}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Card({ label, value }) {
  const display = String(value ?? "-");
  const isCurrency = display.startsWith("Rs");
  const isKg = display.endsWith("kg");

  let primary = display;
  let unit = "";

  if (isCurrency) {
    unit = "Rs";
    primary = display.replace(/^Rs\s*/, "");
  } else if (isKg) {
    unit = "kg";
    primary = display.replace(/\s*kg$/, "");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <div className="mt-2 flex items-end gap-2 whitespace-nowrap text-slate-900">
        {isCurrency ? <span className="pb-1 text-xl font-bold text-slate-600">{unit}</span> : null}
        <span className="text-[2.4rem] font-extrabold leading-none tracking-tight">{primary}</span>
        {isKg ? <span className="pb-1 text-xl font-bold text-slate-600">{unit}</span> : null}
      </div>
    </div>
  );
}
