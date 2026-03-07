import { useEffect, useState } from "react";
import AppShell from "../layout/AppShell";
import ReusableTable from "../components/ReusableTable";
import { getPartnerDashboard } from "../services/partnerService";
import { formatRs } from "../utils/formatters";

const links = [
  { label: "Dashboard", to: "/partner" },
  { label: "My Profit", to: "/partner/my-profit" },
];

export default function MyProfitPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getPartnerDashboard().then((d) => setRows(d.myProfitHistory ?? []));
  }, []);

  return (
    <AppShell links={links}>
      <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-emerald-900">My Profit History</h2>
      <ReusableTable
        columns={[
          { key: "dealId", label: "Deal Id" },
          { key: "percentage", label: "Percentage", render: (r) => `${r.percentage}%` },
          { key: "profitAmount", label: "Profit Amount", render: (r) => formatRs(r.profitAmount) },
          { key: "completedDate", label: "Completed Date", render: (r) => new Date(r.completedDate).toLocaleDateString() },
        ]}
        rows={rows}
      />
    </AppShell>
  );
}
