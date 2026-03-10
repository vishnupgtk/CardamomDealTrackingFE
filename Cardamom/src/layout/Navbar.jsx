import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 py-3 md:px-5">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-emerald-900">CAE GROUPS</h1>
          <p className="text-xs font-medium text-emerald-700">Inventory, deals, payments, and profits</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
            {user?.display_name ?? user?.unique_name ?? "User"}
          </span>
          <button
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
