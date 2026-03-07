import { useEffect, useState } from "react";
import AppShell from "../layout/AppShell";
import ReusableTable from "../components/ReusableTable";
import StatusBadge from "../components/StatusBadge";
import { approvePaymentRequest, getPaymentRequests, rejectPaymentRequest } from "../services/adminService";
import { formatRs } from "../utils/formatters";

const links = [
  { label: "Dashboard", to: "/admin" },
  { label: "Stocks", to: "/admin/stocks" },
  { label: "Sales", to: "/admin/sales" },
  { label: "Users", to: "/admin/users" },
  { label: "Payment Requests", to: "/admin/payment-requests" },
];

export default function PaymentRequestsPage() {
  const [rows, setRows] = useState([]);

  const load = () => getPaymentRequests().then(setRows);
  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell links={links}>
      <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-emerald-900">Payment Requests</h2>
      <ReusableTable
        columns={[
          { key: "dealId", label: "Deal" },
          { key: "requestedByPartnerName", label: "Partner" },
          { key: "amount", label: "Amount", render: (r) => formatRs(r.amount) },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          {
            key: "actions",
            label: "Actions",
            render: (r) =>
              r.status === "Pending" ? (
                <div className="flex gap-2">
                  <button className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-800" onClick={async () => { await approvePaymentRequest(r.id); load(); }}>
                    Approve
                  </button>
                  <button className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-800" onClick={async () => { await rejectPaymentRequest(r.id); load(); }}>
                    Reject
                  </button>
                </div>
              ) : (
                "-"
              ),
          },
        ]}
        rows={rows}
      />
    </AppShell>
  );
}
