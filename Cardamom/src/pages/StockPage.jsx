import { useEffect, useMemo, useState } from "react";
import AppShell from "../layout/AppShell";
import ReusableTable from "../components/ReusableTable";
import {
  addPurchasePayment,
  createPurchase,
  getPurchasePaymentTransactions,
  getStockRecycleBin,
  getStockSummary,
  getStockTransactions,
  permanentDeletePurchase,
  restorePurchase,
  softDeletePurchase,
  updatePurchase,
} from "../services/adminService";
import { formatKg, formatRs } from "../utils/formatters";

const links = [
  { label: "Dashboard", to: "/admin" },
  { label: "Stocks", to: "/admin/stocks" },
  { label: "Sales", to: "/admin/sales" },
  { label: "Users", to: "/admin/users" },
  { label: "Payment Requests", to: "/admin/payment-requests" },
];

const initialForm = {
  supplierName: "",
  totalKg: "",
  sampleKgs: "",
  excessKgs: "",
  brokerCharge: "",
  pricePerKg: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  notes: "",
};

const initialPaymentForm = {
  amount: "",
  paymentDate: new Date().toISOString().slice(0, 10),
  notes: "",
};
const actionBtnBase =
  "inline-flex h-8 min-w-[94px] items-center justify-center whitespace-nowrap rounded-md border px-2.5 text-xs font-semibold disabled:cursor-not-allowed";
const actionBtnNeutral = `${actionBtnBase} border-slate-300 text-slate-700 hover:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400`;
const actionBtnSuccess = `${actionBtnBase} border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:border-slate-300 disabled:text-slate-400`;
const actionBtnDanger = `${actionBtnBase} border-rose-300 text-rose-700 hover:bg-rose-50 disabled:border-slate-200 disabled:text-slate-400`;
const actionBtnRestore = `${actionBtnBase} border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:border-slate-200 disabled:text-slate-400`;

function normalizeStockRow(row) {
  const totalKg = Number(row.totalKg ?? row.TotalKg ?? 0);
  const sampleKgs = Number(row.sampleKgs ?? row.SampleKgs ?? 0);
  const excessKgs = Number(row.excessKgs ?? row.ExcessKgs ?? 0);
  const sellableKgs = Number(row.sellableKgs ?? row.SellableKgs ?? totalKg + sampleKgs + excessKgs);
  const brokerCharge = Number(row.brokerCharge ?? row.BrokerCharge ?? 0);

  return {
    ...row,
    purchaseId: row.purchaseId ?? row.PurchaseId,
    supplierName: row.supplierName ?? row.SupplierName,
    purchaseDate: row.purchaseDate ?? row.PurchaseDate,
    totalKg,
    sampleKgs,
    excessKgs,
    sellableKgs,
    brokerCharge,
    pricePerKg: Number(row.pricePerKg ?? row.PricePerKg ?? 0),
    totalCost: Number(row.totalCost ?? row.TotalCost ?? (totalKg * Number(row.pricePerKg ?? row.PricePerKg ?? 0)) + brokerCharge),
    remainingKg: Number(row.remainingKg ?? row.RemainingKg ?? 0),
    totalPaid: Number(row.totalPaid ?? row.TotalPaid ?? 0),
    pendingAmount: Number(row.pendingAmount ?? row.PendingAmount ?? 0),
  };
}

export default function StockPage() {
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [viewMode, setViewMode] = useState("active");
  const [query, setQuery] = useState({
    page: 1,
    pageSize: 10,
    search: "",
    fromDate: "",
    toDate: "",
  });
  const [paging, setPaging] = useState({ totalCount: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [paymentModalStock, setPaymentModalStock] = useState(null);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [historyModalStock, setHistoryModalStock] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [actionBusyKey, setActionBusyKey] = useState("");
  const hasDateFilters = Boolean(query.fromDate || query.toDate);

  const loadData = async () => {
    setLoading(true);
    try {
      const requestParams = {
        page: query.page,
        pageSize: query.pageSize,
        search: query.search || undefined,
        fromDate: query.fromDate || undefined,
        toDate: query.toDate || undefined,
      };
      const [summaryRes, rowsRes] = await Promise.all([
        getStockSummary({
          fromDate: query.fromDate || undefined,
          toDate: query.toDate || undefined,
        }),
        viewMode === "active" ? getStockTransactions(requestParams) : getStockRecycleBin(requestParams),
      ]);
      setSummary(summaryRes);
      if (Array.isArray(rowsRes)) {
        setRows(rowsRes.map(normalizeStockRow));
        setPaging({ totalCount: rowsRes.length, totalPages: 1 });
      } else {
        setRows((rowsRes.items ?? []).map(normalizeStockRow));
        setPaging({ totalCount: rowsRes.totalCount ?? 0, totalPages: rowsRes.totalPages ?? 0 });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [viewMode, query.page, query.pageSize, query.search, query.fromDate, query.toDate]);

  const totalCostPreview = useMemo(() => {
    const kg = Number(form.totalKg) || 0;
    const rate = Number(form.pricePerKg) || 0;
    const broker = Number(form.brokerCharge || 0);
    return (kg * rate) + broker;
  }, [form.totalKg, form.pricePerKg, form.brokerCharge]);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const kg = Number(form.totalKg);
    const sampleKgs = Number(form.sampleKgs || 0);
    const excessKgs = Number(form.excessKgs || 0);
    const brokerCharge = Number(form.brokerCharge || 0);
    const price = Number(form.pricePerKg);

    if (
      !form.supplierName.trim() ||
      !form.purchaseDate ||
      kg <= 0 ||
      sampleKgs < 0 ||
      excessKgs < 0 ||
      brokerCharge < 0 ||
      price <= 0
    ) {
      setError("Please fill all required fields with valid values.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        supplierName: form.supplierName.trim(),
        totalKg: kg,
        sampleKgs,
        excessKgs,
        brokerCharge,
        pricePerKg: price,
        purchaseDate: form.purchaseDate,
        notes: form.notes?.trim() || null,
      };
      if (editingStock) {
        await updatePurchase(editingStock.purchaseId, payload);
      } else {
        await createPurchase(payload);
      }
      setSuccess(editingStock ? "Stock updated successfully." : "Stock purchase added successfully.");
      setForm(initialForm);
      setEditingStock(null);
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.error ?? err?.response?.data?.message ?? "Failed to save stock.");
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    setError("");
    setSuccess("");
    setEditingStock(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (row) => {
    if (!row) return;
    const purchaseDate = row.purchaseDate ? new Date(row.purchaseDate) : null;
    const safePurchaseDate =
      purchaseDate && !Number.isNaN(purchaseDate.getTime())
        ? purchaseDate.toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

    setError("");
    setSuccess("");
    setEditingStock(row);
    setForm({
      supplierName: row.supplierName,
      totalKg: String(row.totalKg),
      sampleKgs: String(row.sampleKgs ?? 0),
      excessKgs: String(row.excessKgs ?? 0),
      brokerCharge: String(row.brokerCharge ?? 0),
      pricePerKg: String(row.pricePerKg),
      purchaseDate: safePurchaseDate,
      notes: row.notes ?? "",
    });
    setIsModalOpen(true);
  };

  const handleSoftDelete = async (row) => {
    if (!row?.purchaseId || actionBusyKey) return;
    const ok = window.confirm(`Move "${row.supplierName}" to recycle bin?`);
    if (!ok) return;
    setActionBusyKey(`${row.purchaseId}:delete`);
    try {
      await softDeletePurchase(row.purchaseId);
      setSuccess("Stock moved to recycle bin.");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.error ?? err?.response?.data?.message ?? "Failed to delete stock.");
    } finally {
      setActionBusyKey("");
    }
  };

  const handleRestore = async (row) => {
    if (!row?.purchaseId || actionBusyKey) return;
    setActionBusyKey(`${row.purchaseId}:restore`);
    try {
      await restorePurchase(row.purchaseId);
      setSuccess("Stock restored.");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.error ?? err?.response?.data?.message ?? "Failed to restore stock.");
    } finally {
      setActionBusyKey("");
    }
  };

  const handlePermanentDelete = async (row) => {
    if (!row?.purchaseId || actionBusyKey) return;
    const ok = window.confirm(`Permanently delete "${row.supplierName}"? This cannot be undone.`);
    if (!ok) return;
    setActionBusyKey(`${row.purchaseId}:permanent-delete`);
    try {
      await permanentDeletePurchase(row.purchaseId);
      setSuccess("Stock permanently deleted.");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.error ?? err?.response?.data?.message ?? "Failed to permanently delete stock.");
    } finally {
      setActionBusyKey("");
    }
  };

  const openPaymentModal = (stockRow) => {
    if (!stockRow) return;
    setPaymentModalStock(stockRow);
    setPaymentError("");
    setPaymentForm(initialPaymentForm);
  };

  const closePaymentModal = () => {
    if (paymentSaving) return;
    setPaymentModalStock(null);
  };

  const handleAddPurchasePayment = async (e) => {
    e.preventDefault();
    if (!paymentModalStock) return;

    setPaymentError("");
    setPaymentSaving(true);
    try {
      const amount = Number(paymentForm.amount);
      if (amount <= 0) {
        throw new Error("Payment amount must be greater than zero.");
      }
      if (amount > Number(paymentModalStock.pendingAmount || 0)) {
        throw new Error("Payment cannot exceed pending amount.");
      }

      await addPurchasePayment(paymentModalStock.purchaseId, {
        amount,
        paymentDate: paymentForm.paymentDate || null,
        notes: paymentForm.notes?.trim() || null,
      });

      setPaymentModalStock(null);
      await loadData();
      setSuccess("Supplier payment saved successfully.");
    } catch (err) {
      setPaymentError(
        err?.response?.data?.error ??
          err?.response?.data?.message ??
          err.message ??
          "Failed to save supplier payment.",
      );
    } finally {
      setPaymentSaving(false);
    }
  };

  const openHistoryModal = async (stockRow) => {
    if (!stockRow?.purchaseId || actionBusyKey) return;
    setActionBusyKey(`${stockRow.purchaseId}:history`);
    setHistoryModalStock(stockRow);
    setPaymentHistory([]);
    setHistoryError("");
    setHistoryLoading(true);
    try {
      const transactions = await getPurchasePaymentTransactions(stockRow.purchaseId);
      setPaymentHistory(transactions);
    } catch (err) {
      setHistoryError(
        err?.response?.data?.error ??
          err?.response?.data?.message ??
          "Failed to load payment transactions.",
      );
    } finally {
      setHistoryLoading(false);
      setActionBusyKey("");
    }
  };

  const closeHistoryModal = () => {
    if (historyLoading) return;
    setHistoryModalStock(null);
  };

  return (
    <AppShell links={links}>
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-emerald-800">Stocks</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setViewMode("active");
                setQuery((q) => ({ ...q, page: 1 }));
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${viewMode === "active" ? "bg-emerald-700 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
            >
              Active Stocks
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("recycle");
                setQuery((q) => ({ ...q, page: 1 }));
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${viewMode === "recycle" ? "bg-rose-700 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
            >
              Recycle Bin
            </button>
            {viewMode === "active" ? (
              <button
                onClick={openCreateModal}
                className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                + Add Stock
              </button>
            ) : null}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-5">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Search supplier..."
            value={query.search}
            onChange={(e) => setQuery((q) => ({ ...q, search: e.target.value, page: 1 }))}
          />
          <input
            type="date"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={query.fromDate}
            onChange={(e) => setQuery((q) => ({ ...q, fromDate: e.target.value, page: 1 }))}
          />
          <input
            type="date"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={query.toDate}
            onChange={(e) => setQuery((q) => ({ ...q, toDate: e.target.value, page: 1 }))}
          />
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={query.pageSize}
            onChange={(e) => setQuery((q) => ({ ...q, pageSize: Number(e.target.value), page: 1 }))}
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setQuery((q) => ({ ...q, fromDate: "", toDate: "", page: 1 }))}
            disabled={!hasDateFilters}
          >
            Reset Dates
          </button>
        </div>
      </div>

      {success ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}
      {error && !isModalOpen ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card title="Total Purchased" value={formatKg(summary?.totalPurchasedStock)} />
        <Card title="Total Sold" value={formatKg(summary?.totalSoldStock)} />
        <Card title="Remaining" value={formatKg(summary?.remainingStock)} />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card title="Total Purchase Cost" value={formatRs(summary?.totalPurchaseCost)} />
        <Card title="Payment Paid" value={formatRs(summary?.totalSupplierPaid)} />
        <Card title="Pending Payment" value={formatRs(summary?.totalSupplierPending)} />
      </div>

      <ReusableTable
        columns={[
          { key: "supplierName", label: "Dealer / Supplier" },
          {
            key: "purchaseDate",
            label: "Purchase Date",
            render: (r) => (r.purchaseDate ? new Date(r.purchaseDate).toLocaleDateString() : "-"),
          },
          { key: "totalKg", label: "Total Kg", render: (r) => formatKg(r.totalKg) },
          { key: "sampleKgs", label: "Sample Kg", render: (r) => formatKg(Number(r.sampleKgs) || 0) },
          { key: "excessKgs", label: "Excess Kg", render: (r) => formatKg(Number(r.excessKgs) || 0) },
          {
            key: "sellableKgs",
            label: "Sellable Kg",
            render: (r) =>
              formatKg((Number(r.totalKg) || 0) + (Number(r.sampleKgs) || 0) + (Number(r.excessKgs) || 0)),
          },
          { key: "pricePerKg", label: "Price/Kg", render: (r) => `${formatRs(r.pricePerKg)} / kg` },
          { key: "brokerCharge", label: "Broker Charge", render: (r) => formatRs(r.brokerCharge) },
          { key: "totalCost", label: "Total Cost", render: (r) => formatRs(r.totalCost) },
          { key: "remainingKg", label: "Remaining Kg", render: (r) => formatKg(r.remainingKg) },
          { key: "totalPaid", label: "Paid", render: (r) => formatRs(r.totalPaid) },
          { key: "pendingAmount", label: "Pending", render: (r) => formatRs(r.pendingAmount) },
          {
            key: "notes",
            label: "Notes",
            render: (r) =>
              r.notes ? (
                <span className="inline-block max-w-[220px] truncate align-bottom" title={r.notes}>
                  {r.notes}
                </span>
              ) : (
                "-"
              ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (r) => (
              <div className="flex items-center gap-2 whitespace-nowrap">
                {(() => {
                  const rowBusy = actionBusyKey.startsWith(`${r.purchaseId}:`);
                  return viewMode === "active" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openPaymentModal(r)}
                        disabled={rowBusy || Number(r.pendingAmount) <= 0}
                        className={actionBtnSuccess}
                      >
                        Add Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => openHistoryModal(r)}
                        disabled={rowBusy}
                        className={actionBtnNeutral}
                      >
                        View Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(r)}
                        disabled={rowBusy || paymentSaving || historyLoading}
                        className={actionBtnNeutral}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSoftDelete(r)}
                        disabled={rowBusy}
                        className={actionBtnDanger}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRestore(r)}
                        disabled={rowBusy}
                        className={actionBtnRestore}
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePermanentDelete(r)}
                        disabled={rowBusy}
                        className={actionBtnDanger}
                      >
                        Delete Permanently
                      </button>
                    </>
                  );
                })()}
              </div>
            ),
          },
        ]}
        rows={rows}
      />

      <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
        <span>
          Total: {paging.totalCount} | Page {query.page} of {Math.max(1, paging.totalPages)}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
            disabled={query.page <= 1}
            onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
            disabled={query.page >= Math.max(1, paging.totalPages)}
            onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
          >
            Next
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-slate-500">Refreshing stock data...</p>
      ) : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-bold text-emerald-800">{editingStock ? "Edit Purchase Stock" : "Add Purchase Stock"}</h3>
              <button
                className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
              >
                X
              </button>
            </div>

            <form onSubmit={onSubmit} className="min-h-0 flex-1 overflow-y-auto space-y-4 p-5">
              {error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Dealer / Supplier" required>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-600 focus:ring-2"
                    value={form.supplierName}
                    onChange={(e) => onChange("supplierName", e.target.value)}
                    placeholder="Enter dealer name"
                  />
                </Field>

                <Field label="Purchase Date" required>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-600 focus:ring-2"
                    value={form.purchaseDate}
                    onChange={(e) => onChange("purchaseDate", e.target.value)}
                  />
                </Field>

                <Field label="Total Kg" required>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-600 focus:ring-2"
                    value={form.totalKg}
                    onChange={(e) => onChange("totalKg", e.target.value)}
                    placeholder="0.00"
                  />
                </Field>

                <Field label="Price per Kg" required>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-600 focus:ring-2"
                    value={form.pricePerKg}
                    onChange={(e) => onChange("pricePerKg", e.target.value)}
                    placeholder="0.00"
                  />
                </Field>

                <Field label="Broker Charge">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-600 focus:ring-2"
                    value={form.brokerCharge}
                    onChange={(e) => onChange("brokerCharge", e.target.value)}
                    placeholder="0.00"
                  />
                </Field>

                <Field label="Sample Kgs">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-600 focus:ring-2"
                    value={form.sampleKgs}
                    onChange={(e) => onChange("sampleKgs", e.target.value)}
                    placeholder="0.00"
                  />
                </Field>

                <Field label="Excess Kgs">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-600 focus:ring-2"
                    value={form.excessKgs}
                    onChange={(e) => onChange("excessKgs", e.target.value)}
                    placeholder="0.00"
                  />
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-600 focus:ring-2"
                  value={form.notes}
                  onChange={(e) => onChange("notes", e.target.value)}
                  placeholder="Optional notes..."
                />
              </Field>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Estimated Total Cost: <span className="font-bold">{formatRs(totalCostPreview)}</span>
              </div>

              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white pt-3">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingStock ? "Update Stock" : "Save Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {paymentModalStock ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-lg font-bold text-emerald-800">Add Supplier Payment</h3>
              <button
                onClick={closePaymentModal}
                className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100"
                type="button"
              >
                X
              </button>
            </div>

            <form onSubmit={handleAddPurchasePayment} className="space-y-4 p-5">
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <p>
                  Supplier: <span className="font-semibold">{paymentModalStock.supplierName}</span>
                </p>
                <p>
                  Total Cost: <span className="font-semibold">{formatRs(paymentModalStock.totalCost)}</span>
                </p>
                <p>
                  Already Paid: <span className="font-semibold">{formatRs(paymentModalStock.totalPaid)}</span>
                </p>
                <p>
                  Pending: <span className="font-semibold text-amber-700">{formatRs(paymentModalStock.pendingAmount)}</span>
                </p>
              </div>

              {paymentError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {paymentError}
                </div>
              ) : null}

              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Payment Amount *</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 ring-emerald-600 focus:ring-2"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Payment Date</span>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 ring-emerald-600 focus:ring-2"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, paymentDate: e.target.value }))}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Notes</span>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 ring-emerald-600 focus:ring-2"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </label>

              <div className="flex justify-end gap-3 border-t pt-3">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
                  onClick={closePaymentModal}
                  disabled={paymentSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                  disabled={paymentSaving}
                >
                  {paymentSaving ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {historyModalStock ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-emerald-800">Supplier Payment Transactions</h3>
                <p className="text-sm text-slate-600">
                  Supplier: {historyModalStock.supplierName} | Purchase Cost: {formatRs(historyModalStock.totalCost)}
                </p>
              </div>
              <button
                onClick={closeHistoryModal}
                className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100"
                type="button"
              >
                X
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-5">
              {historyLoading ? (
                <p className="text-sm text-slate-600">Loading transactions...</p>
              ) : historyError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {historyError}
                </div>
              ) : paymentHistory.length === 0 ? (
                <p className="text-sm text-slate-600">No payments found for this purchase.</p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Amount</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Created By</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Notes</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Running Paid</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((item, idx) => {
                      const runningPaid = paymentHistory
                        .slice(0, idx + 1)
                        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                      const remaining = Math.max(
                        0,
                        Number(historyModalStock.totalCost || 0) - runningPaid,
                      );
                      return (
                        <tr key={item.paymentId} className="border-t border-slate-100">
                          <td className="px-3 py-2 text-slate-700">
                            {new Date(item.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 font-semibold text-emerald-700">{formatRs(item.amount)}</td>
                          <td className="px-3 py-2 text-slate-700">{item.createdBy}</td>
                          <td className="px-3 py-2 text-slate-700">{item.notes || "-"}</td>
                          <td className="px-3 py-2 text-slate-700">{formatRs(runningPaid)}</td>
                          <td className="px-3 py-2 text-amber-700">{formatRs(remaining)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function Card({ title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-600">{title}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <p className="mb-1 text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </p>
      {children}
    </label>
  );
}
