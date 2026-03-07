import { useEffect, useState } from "react";
import AppShell from "../layout/AppShell";
import ReusableTable from "../components/ReusableTable";
import StatusBadge from "../components/StatusBadge";
import { approvePartner, getUsers, rejectPartner } from "../services/adminService";

const links = [
  { label: "Dashboard", to: "/admin" },
  { label: "Stocks", to: "/admin/stocks" },
  { label: "Sales", to: "/admin/sales" },
  { label: "Users", to: "/admin/users" },
  { label: "Payment Requests", to: "/admin/payment-requests" },
];

export default function UsersPage() {
  const [users, setUsers] = useState([]);

  const load = () => getUsers().then(setUsers);
  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell links={links}>
      <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-emerald-900">Users</h2>
      <ReusableTable
        columns={[
          { key: "name", label: "Name" },
          { key: "username", label: "Username" },
          { key: "role", label: "Role" },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          {
            key: "actions",
            label: "Actions",
            render: (r) =>
              r.role === "Partner" && r.status === "Pending" ? (
                <div className="flex gap-2">
                  <button className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-800" onClick={async () => { await approvePartner(r.id); load(); }}>
                    Approve
                  </button>
                  <button className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-800" onClick={async () => { await rejectPartner(r.id); load(); }}>
                    Reject
                  </button>
                </div>
              ) : (
                "-"
              ),
          },
        ]}
        rows={users}
      />
    </AppShell>
  );
}
