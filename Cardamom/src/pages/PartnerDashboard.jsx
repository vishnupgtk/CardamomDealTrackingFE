import { useEffect, useState } from "react";
import AppShell from "../layout/AppShell";
import PaymentModal from "../components/PaymentModal";
import { createPaymentRequest, getPartnerDashboard } from "../services/partnerService";
import { formatRs } from "../utils/formatters";

const links = [
  { label: "Dashboard", to: "/partner" },
  { label: "My Profit", to: "/partner/my-profit" },
];

export default function PartnerDashboard() {
  const [data, setData] = useState(null);

  const load = () => getPartnerDashboard().then(setData).catch(() => setData({}));
  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell links={links}>
      <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-emerald-900">Partner Dashboard</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card label="My Total Profit" value={formatRs(data?.myTotalProfit)} />
        <Card label="My Completed Deals" value={data?.myCompletedDeals ?? 0} />
      </div>
      <div className="mt-4">
        <PaymentModal
          onSubmit={async (payload) => {
            await createPaymentRequest(payload);
            await load();
          }}
        />
      </div>
    </AppShell>
  );
}

function Card({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}
