import { useEffect, useMemo, useState } from "react";
import AppShell from "../layout/AppShell";
import ReusableTable from "../components/ReusableTable";
import {
  addDealPayment,
  createBuyer,
  createDeal,
  getDealPaymentTransactions,
  getApprovedPartners,
  getAvailableStocks,
  getBuyers,
  getSalesRecycleBin,
  getSalesTransactions,
  permanentDeleteDeal,
  restoreDeal,
  softDeleteDeal,
  updateDeal,
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
  buyerId: "",
  totalKg: "",
  sellingPricePerKg: "",
  dealDate: new Date().toISOString().slice(0, 10),
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

export default function SalesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("active");
  const [query, setQuery] = useState({
    page: 1,
    pageSize: 10,
    search: "",
    fromDate: "",
    toDate: "",
  });
  const [paging, setPaging] = useState({ totalCount: 0, totalPages: 0 });
  const [buyers, setBuyers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [useNewBuyer, setUseNewBuyer] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [newBuyer, setNewBuyer] = useState({ name: "", phone: "", address: "" });
  const [partnerShares, setPartnerShares] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [paymentModalDeal, setPaymentModalDeal] = useState(null);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [historyModalDeal, setHistoryModalDeal] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [editDeal, setEditDeal] = useState(null);
  const [editForm, setEditForm] = useState({ buyerId: "", sellingPricePerKg: "", dealDate: "", notes: "" });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [actionBusyKey, setActionBusyKey] = useState("");

  const loadSales = async () => {
    setLoading(true);
    const params = {
      page: query.page,
      pageSize: query.pageSize,
      search: query.search || undefined,
      fromDate: query.fromDate || undefined,
      toDate: query.toDate || undefined,
    };
    try {
      const res = viewMode === "active" ? await getSalesTransactions(params) : await getSalesRecycleBin(params);
      if (Array.isArray(res)) {
        setRows(res);
        setPaging({ totalCount: res.length, totalPages: 1 });
      } else {
        setRows(res.items ?? []);
        setPaging({ totalCount: res.totalCount ?? 0, totalPages: res.totalPages ?? 0 });
      }
    } catch (err) {
      setError(err?.response?.data?.error ?? err?.response?.data?.message ?? "Failed to load sales.");
    } finally {
      setLoading(false);
    }
  };
  const loadInputs = async () => {
    try {
      const [buyersRes, partnersRes, stocksRes] = await Promise.all([
        getBuyers(),
        getApprovedPartners(),
        getAvailableStocks(),
      ]);
      setBuyers(buyersRes);
      setPartners(partnersRes);
      setStocks(stocksRes);
      setPartnerShares(partnersRes.map((p) => ({ partnerId: p.partnerId, percentage: "" })));
      setAllocations(stocksRes.map((s) => ({ purchaseId: s.purchaseId, allocatedKg: "" })));
    } catch (err) {
      setError(err?.response?.data?.error ?? err?.response?.data?.message ?? "Failed to load form inputs.");
    }
  };

  useEffect(() => {
    loadInputs();
  }, []);

  useEffect(() => {
    loadSales();
  }, [viewMode, query.page, query.pageSize, query.search, query.fromDate, query.toDate]);

  const totalAmountPreview = useMemo(() => {
    const kg = Number(form.totalKg) || 0;
    const rate = Number(form.sellingPricePerKg) || 0;
    return kg * rate;
  }, [form.totalKg, form.sellingPricePerKg]);

  const shareTotal = useMemo(
    () => partnerShares.reduce((sum, p) => sum + (Number(p.percentage) || 0), 0),
    [partnerShares],
  );

  const allocationTotal = useMemo(
    () => allocations.reduce((sum, a) => sum + (Number(a.allocatedKg) || 0), 0),
    [allocations],
  );

  const salesSummary = useMemo(() => {
    const totalDealAmount = rows.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
    const totalPaid = rows.reduce((sum, r) => sum + (Number(r.totalPaid) || 0), 0);
    const totalPending = rows.reduce((sum, r) => sum + (Number(r.pendingAmount) || 0), 0);
    const totalProfit = rows.reduce((sum, r) => sum + (Number(r.profit) || 0), 0);
    return { totalDealAmount, totalPaid, totalPending, totalProfit };
  }, [rows]);

  const setShare = (partnerId, value) => {
    setPartnerShares((prev) =>
      prev.map((p) => (p.partnerId === partnerId ? { ...p, percentage: value } : p)),
    );
  };

  const setAllocation = (purchaseId, value) => {
    setAllocations((prev) =>
      prev.map((a) => (a.purchaseId === purchaseId ? { ...a, allocatedKg: value } : a)),
    );
  };

  const openModal = () => {
    setError("");
    setSuccess("");
    setUseNewBuyer(false);
    setForm(initialForm);
    setNewBuyer({ name: "", phone: "", address: "" });
    setPartnerShares((prev) => prev.map((p) => ({ ...p, percentage: "" })));
    setAllocations((prev) => prev.map((a) => ({ ...a, allocatedKg: "" })));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
  };

  const openPaymentModal = (dealRow) => {
    if (!dealRow) return;
    setPaymentModalDeal(dealRow);
    setPaymentError("");
    setPaymentForm({
      amount: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: "",
    });
  };

  const closePaymentModal = () => {
    if (paymentSaving) return;
    setPaymentModalDeal(null);
  };

  const openHistoryModal = async (dealRow) => {
    if (!dealRow?.dealId || actionBusyKey) return;
    setActionBusyKey(`${dealRow.dealId}:history`);
    setHistoryModalDeal(dealRow);
    setPaymentHistory([]);
    setHistoryError("");
    setHistoryLoading(true);
    try {
      const payments = await getDealPaymentTransactions(dealRow.dealId);
      setPaymentHistory(payments);
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
    setHistoryModalDeal(null);
  };

  const openEditDealModal = (row) => {
    if (!row) return;
    const dealDate = row.dealDate ? new Date(row.dealDate) : null;
    const safeDealDate =
      dealDate && !Number.isNaN(dealDate.getTime())
        ? dealDate.toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

    setEditError("");
    setEditDeal(row);
    setEditForm({
      buyerId: row.buyerId,
      sellingPricePerKg: String(row.sellingPricePerKg),
      dealDate: safeDealDate,
      notes: row.notes ?? "",
    });
  };

  const closeEditDealModal = () => {
    if (editSaving) return;
    setEditDeal(null);
  };

  const handleUpdateDeal = async (e) => {
    e.preventDefault();
    if (!editDeal) return;
    setEditError("");
    setEditSaving(true);
    try {
      await updateDeal(editDeal.dealId, {
        buyerId: editForm.buyerId,
        sellingPricePerKg: Number(editForm.sellingPricePerKg),
        dealDate: editForm.dealDate,
        notes: editForm.notes?.trim() || null,
      });
      setEditDeal(null);
      setSuccess("Deal updated successfully.");
      await loadSales();
    } catch (err) {
      setEditError(err?.response?.data?.error ?? err?.response?.data?.message ?? "Failed to update deal.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleSoftDeleteDeal = async (row) => {
    if (!row?.dealId || actionBusyKey) return;
    const ok = window.confirm(`Move sale for "${row.buyerName}" to recycle bin?`);
    if (!ok) return;
    setActionBusyKey(`${row.dealId}:delete`);
    try {
      await softDeleteDeal(row.dealId);
      setSuccess("Sale moved to recycle bin.");
      await loadSales();
    } catch (err) {
      setError(err?.response?.data?.error ?? err?.response?.data?.message ?? "Failed to delete sale.");
    } finally {
      setActionBusyKey("");
    }
  };

  const handleRestoreDeal = async (row) => {
    if (!row?.dealId || actionBusyKey) return;
    setActionBusyKey(`${row.dealId}:restore`);
    try {
      await restoreDeal(row.dealId);
      setSuccess("Sale restored.");
      await loadSales();
    } catch (err) {
      setError(err?.response?.data?.error ?? err?.response?.data?.message ?? "Failed to restore sale.");
    } finally {
      setActionBusyKey("");
    }
  };

  const handlePermanentDeleteDeal = async (row) => {
    if (!row?.dealId || actionBusyKey) return;
    const ok = window.confirm(`Permanently delete sale for "${row.buyerName}"? This cannot be undone.`);
    if (!ok) return;
    setActionBusyKey(`${row.dealId}:permanent-delete`);
    try {
      await permanentDeleteDeal(row.dealId);
      setSuccess("Sale permanently deleted.");
      await loadSales();
    } catch (err) {
      setError(err?.response?.data?.error ?? err?.response?.data?.message ?? "Failed to permanently delete sale.");
    } finally {
      setActionBusyKey("");
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentModalDeal) return;

    setPaymentError("");
    setPaymentSaving(true);

    try {
      const amount = Number(paymentForm.amount);
      if (amount <= 0) {
        throw new Error("Payment amount must be greater than zero.");
      }
      if (amount > Number(paymentModalDeal.pendingAmount || 0)) {
        throw new Error("Payment cannot exceed pending amount.");
      }

      await addDealPayment(paymentModalDeal.dealId, {
        amount,
        paymentDate: paymentForm.paymentDate || null,
        notes: paymentForm.notes?.trim() || null,
      });

      setPaymentModalDeal(null);
      await loadSales();
      setSuccess("Payment saved successfully.");
    } catch (err) {
      setPaymentError(
        err?.response?.data?.error ??
          err?.response?.data?.message ??
          err.message ??
          "Failed to add payment.",
      );
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const totalKg = Number(form.totalKg);
      const pricePerKg = Number(form.sellingPricePerKg);

      if (totalKg <= 0 || pricePerKg <= 0 || !form.dealDate) {
        throw new Error("Please enter valid sales values.");
      }

      let buyerId = form.buyerId;
      if (useNewBuyer) {
        if (!newBuyer.name.trim()) {
          throw new Error("Buyer name is required.");
        }
        const buyerCreateRes = await createBuyer({
          name: newBuyer.name.trim(),
          phone: newBuyer.phone?.trim() || null,
          address: newBuyer.address?.trim() || null,
        });
        buyerId = buyerCreateRes.id;
      }

      if (!buyerId) {
        throw new Error("Please select or create a buyer.");
      }

      const partnersPayload = partnerShares
        .map((p) => ({ partnerId: p.partnerId, percentage: Number(p.percentage) || 0 }))
        .filter((p) => p.percentage > 0);
      const allocationsPayload = allocations
        .map((a) => ({ purchaseId: a.purchaseId, allocatedKg: Number(a.allocatedKg) || 0 }))
        .filter((a) => a.allocatedKg > 0);

      if (partnersPayload.length === 0 || allocationsPayload.length === 0) {
        throw new Error("Partner distribution and stock allocation are required.");
      }
      if (shareTotal !== 100) {
        throw new Error("Partner distribution must total 100%.");
      }
      if (allocationTotal !== totalKg) {
        throw new Error("Stock allocation total must match deal total kg.");
      }

      await createDeal({
        buyerId,
        totalKg,
        sellingPricePerKg: pricePerKg,
        dealDate: form.dealDate,
        notes: form.notes?.trim() || null,
        partners: partnersPayload,
        allocations: allocationsPayload,
      });

      setSuccess("Sales deal created successfully.");
      setIsModalOpen(false);
      await Promise.all([loadSales(), loadInputs()]);
    } catch (err) {
      setError(
        err?.response?.data?.error ??
          err?.response?.data?.message ??
          err.message ??
          "Failed to create sales deal.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell links={links}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-emerald-800">Sales Transactions</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setViewMode("active");
              setQuery((q) => ({ ...q, page: 1 }));
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${viewMode === "active" ? "bg-emerald-700 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
          >
            Active Sales
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
              className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white shadow-sm hover:bg-emerald-800"
              onClick={openModal}
            >
              + Add Sales
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Search buyer/phone..."
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
      </div>

      {success ? (
        <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}
      {error && !isModalOpen ? (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total Deal Amount</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{formatRs(salesSummary.totalDealAmount)}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">Total Paid</p>
          <p className="mt-1 text-xl font-bold text-emerald-800">{formatRs(salesSummary.totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">Total Pending</p>
          <p className="mt-1 text-xl font-bold text-amber-800">{formatRs(salesSummary.totalPending)}</p>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-sm text-indigo-700">Total Profit (Completed)</p>
          <p className="mt-1 text-xl font-bold text-indigo-800">{formatRs(salesSummary.totalProfit)}</p>
        </div>
      </div>

      <ReusableTable
        columns={[
          { key: "buyerName", label: "Buyer" },
          { key: "buyerPhone", label: "Phone" },
          { key: "buyerAddress", label: "Address" },
          {
            key: "dealDate",
            label: "Deal Date",
            render: (r) => (r.dealDate ? new Date(r.dealDate).toLocaleDateString() : "-"),
          },
          { key: "totalKg", label: "Total Kg", render: (r) => formatKg(r.totalKg) },
          { key: "sellingPricePerKg", label: "Sell Price/Kg", render: (r) => `${formatRs(r.sellingPricePerKg)} / kg` },
          { key: "totalAmount", label: "Deal Amount", render: (r) => formatRs(r.totalAmount) },
          { key: "totalPaid", label: "Paid", render: (r) => formatRs(r.totalPaid) },
          { key: "pendingAmount", label: "Pending", render: (r) => formatRs(r.pendingAmount) },
          { key: "profit", label: "Profit", render: (r) => (r.profit == null ? "-" : formatRs(r.profit)) },
          { key: "status", label: "Status" },
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
                  const rowBusy = actionBusyKey.startsWith(`${r.dealId}:`);
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
                        onClick={() => openEditDealModal(r)}
                        disabled={rowBusy || paymentSaving || historyLoading}
                        className={actionBtnNeutral}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSoftDeleteDeal(r)}
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
                        onClick={() => handleRestoreDeal(r)}
                        disabled={rowBusy}
                        className={actionBtnRestore}
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePermanentDeleteDeal(r)}
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

      {loading ? <p className="mt-3 text-sm text-slate-500">Refreshing sales data...</p> : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b bg-white px-5 py-4">
              <h3 className="text-lg font-bold text-emerald-800">Create Sales Deal</h3>
              <button
                onClick={closeModal}
                className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100"
                type="button"
              >
                X
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                {error ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">Deal Date *</span>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 ring-emerald-600 focus:ring-2"
                      value={form.dealDate}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, dealDate: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">Total Kg *</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 ring-emerald-600 focus:ring-2"
                      value={form.totalKg}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, totalKg: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">
                      Selling Price / Kg *
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 ring-emerald-600 focus:ring-2"
                      value={form.sellingPricePerKg}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          sellingPricePerKg: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">
                      Estimated Deal Amount
                    </span>
                    <input
                      value={formatRs(totalAmountPreview)}
                      disabled
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
                    />
                  </label>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-2 flex items-center gap-3">
                    <p className="font-semibold text-slate-800">Buyer</p>
                    <button
                      type="button"
                      className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => setUseNewBuyer((v) => !v)}
                    >
                      {useNewBuyer ? "Select Existing Buyer" : "Create New Buyer"}
                    </button>
                  </div>
                  {useNewBuyer ? (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        className="rounded border border-slate-300 px-3 py-2"
                        placeholder="Buyer Name *"
                        value={newBuyer.name}
                        onChange={(e) =>
                          setNewBuyer((b) => ({ ...b, name: e.target.value }))
                        }
                      />
                      <input
                        className="rounded border border-slate-300 px-3 py-2"
                        placeholder="Phone"
                        value={newBuyer.phone}
                        onChange={(e) =>
                          setNewBuyer((b) => ({ ...b, phone: e.target.value }))
                        }
                      />
                      <input
                        className="rounded border border-slate-300 px-3 py-2"
                        placeholder="Address"
                        value={newBuyer.address}
                        onChange={(e) =>
                          setNewBuyer((b) => ({ ...b, address: e.target.value }))
                        }
                      />
                    </div>
                  ) : (
                    <select
                      className="w-full rounded border border-slate-300 px-3 py-2"
                      value={form.buyerId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, buyerId: e.target.value }))
                      }
                    >
                      <option value="">Select Buyer</option>
                      {buyers.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} {b.phone ? `(${b.phone})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="mb-2 font-semibold text-slate-800">
                    Partner Distribution (must total 100%)
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {partners.map((p) => (
                      <label key={p.partnerId} className="text-sm">
                        <span className="mb-1 block text-slate-700">{p.partnerName}</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full rounded border border-slate-300 px-3 py-2"
                          value={
                            partnerShares.find((x) => x.partnerId === p.partnerId)
                              ?.percentage ?? ""
                          }
                          onChange={(e) => setShare(p.partnerId, e.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                  <p
                    className={`mt-2 text-sm ${
                      shareTotal === 100 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    Current Total: {shareTotal}%
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="mb-2 font-semibold text-slate-800">
                    Stock Allocation (must equal total kg)
                  </p>
                  <div className="space-y-2">
                    {stocks.map((s) => (
                      <div
                        key={s.purchaseId}
                        className="grid items-center gap-2 sm:grid-cols-[1.8fr_1fr_1fr]"
                      >
                        <div className="text-sm text-slate-700">
                          {s.supplierName} - remaining {formatKg(s.remainingKg)} @ {formatRs(s.pricePerKg)} / kg
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="rounded border border-slate-300 px-3 py-2"
                          placeholder="Allocated Kg"
                          value={
                            allocations.find((x) => x.purchaseId === s.purchaseId)
                              ?.allocatedKg ?? ""
                          }
                          onChange={(e) => setAllocation(s.purchaseId, e.target.value)}
                        />
                        <div className="text-xs text-slate-500">
                          {new Date(s.purchaseDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p
                    className={`mt-2 text-sm ${
                      allocationTotal === (Number(form.totalKg) || 0)
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    Allocated Total: {allocationTotal} kg / Deal Total:{" "}
                    {formatKg(Number(form.totalKg) || 0)}
                  </p>
                </div>

                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-700">Notes</span>
                  <textarea
                    rows={3}
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t bg-white px-5 py-4">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Sales Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editDeal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-lg font-bold text-emerald-800">Edit Sales Deal</h3>
              <button
                onClick={closeEditDealModal}
                className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100"
                type="button"
              >
                X
              </button>
            </div>
            <form onSubmit={handleUpdateDeal} className="space-y-4 p-5">
              {editError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {editError}
                </div>
              ) : null}
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Buyer *</span>
                <select
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={editForm.buyerId}
                  onChange={(e) => setEditForm((f) => ({ ...f, buyerId: e.target.value }))}
                >
                  <option value="">Select Buyer</option>
                  {buyers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.phone ? `(${b.phone})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Deal Date *</span>
                <input
                  type="date"
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={editForm.dealDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, dealDate: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Selling Price / Kg *</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={editForm.sellingPricePerKg}
                  onChange={(e) => setEditForm((f) => ({ ...f, sellingPricePerKg: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Notes</span>
                <textarea
                  rows={3}
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </label>
              <div className="flex justify-end gap-3 border-t pt-3">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
                  onClick={closeEditDealModal}
                  disabled={editSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                  disabled={editSaving}
                >
                  {editSaving ? "Saving..." : "Update Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {paymentModalDeal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-lg font-bold text-emerald-800">Add Buyer Payment</h3>
              <button
                onClick={closePaymentModal}
                className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100"
                type="button"
              >
                X
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-4 p-5">
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <p>
                  Buyer: <span className="font-semibold">{paymentModalDeal.buyerName}</span>
                </p>
                <p>
                  Deal Amount: <span className="font-semibold">{formatRs(paymentModalDeal.totalAmount)}</span>
                </p>
                <p>
                  Already Paid: <span className="font-semibold">{formatRs(paymentModalDeal.totalPaid)}</span>
                </p>
                <p>
                  Pending: <span className="font-semibold text-amber-700">{formatRs(paymentModalDeal.pendingAmount)}</span>
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

      {historyModalDeal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-emerald-800">Payment Transactions</h3>
                <p className="text-sm text-slate-600">
                  Buyer: {historyModalDeal.buyerName} | Deal Amount: {formatRs(historyModalDeal.totalAmount)}
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
                <p className="text-sm text-slate-600">No payment transactions found for this sale.</p>
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
                        Number(historyModalDeal.totalAmount || 0) - runningPaid,
                      );

                      return (
                        <tr key={item.paymentId} className="border-t border-slate-100">
                          <td className="px-3 py-2 text-slate-700">
                            {new Date(item.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 font-semibold text-emerald-700">
                            {formatRs(item.amount)}
                          </td>
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

            <div className="flex items-center justify-between border-t bg-slate-50 px-5 py-3 text-sm">
              <p className="text-slate-700">
                Total Paid:{" "}
                <span className="font-semibold text-emerald-700">
                  {formatRs(paymentHistory.reduce((sum, p) => sum + (Number(p.amount) || 0), 0))}
                </span>
              </p>
              <p className="text-slate-700">
                Balance:{" "}
                <span className="font-semibold text-amber-700">
                  {formatRs(Math.max(
                    0,
                    Number(historyModalDeal.totalAmount || 0) -
                      paymentHistory.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
                  ))}
                </span>
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
