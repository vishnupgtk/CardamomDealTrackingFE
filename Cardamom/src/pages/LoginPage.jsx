import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: loginUser } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(form);
      loginUser(data.token, data.role);
      navigate(data.role === "Admin" ? "/admin" : "/partner");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={onSubmit} className="app-panel auth-card w-full max-w-md space-y-4 p-7">
        <div className="flex flex-col">
          <img src="/cae-logo.svg" alt="CAE Groups" className="h-10 w-auto" />
          <p className="ml-16 mt-1 text-sm font-medium text-slate-600">Stock and Sales Tracking</p>
        </div>
        <h2 className="text-2xl font-bold text-emerald-900">Welcome Back</h2>
        <p className="-mt-2 text-sm text-slate-600">Sign in to continue to your dashboard.</p>
        <input className="app-input" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="app-input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-100 border-t-white" />
              Signing in...
            </>
          ) : (
            "Login"
          )}
        </button>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        <Link className="block text-sm font-medium text-emerald-700 hover:text-emerald-800" to="/register">
          New partner? 
        </Link>
      </form>
    </div>
  );
}
