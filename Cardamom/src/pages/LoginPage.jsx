import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const { login: loginUser } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(form);
      loginUser(data.token, data.role);
      navigate(data.role === "Admin" ? "/admin" : "/partner");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Login failed.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={onSubmit} className="app-panel w-full max-w-md space-y-4 p-7">
        <h2 className="text-2xl font-bold text-emerald-900">Welcome Back</h2>
        <p className="-mt-2 text-sm text-slate-600">Sign in to continue to your dashboard.</p>
        <input className="app-input" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="app-input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="w-full rounded-xl bg-emerald-700 py-2.5 font-semibold text-white transition hover:bg-emerald-800">Login</button>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        <Link className="block text-sm font-medium text-emerald-700 hover:text-emerald-800" to="/register">
          New partner? 
        </Link>
      </form>
    </div>
  );
}
