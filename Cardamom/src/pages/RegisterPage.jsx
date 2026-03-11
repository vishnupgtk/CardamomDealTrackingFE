import { useState } from "react";
import { Link } from "react-router-dom";
import { registerPartner } from "../services/authService";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", username: "", password: "", phone: "" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await registerPartner(form);
      setMessage("Registration submitted. Wait for admin approval.");
      setForm({ name: "", username: "", password: "", phone: "" });
    } catch (err) {
      setMessage(err?.response?.data?.message ?? "Registration failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-shell flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={onSubmit} className="app-panel auth-card w-full max-w-md space-y-4 p-7">
        <div className="flex items-center gap-3">
          <img src="/cae-logo.svg" alt="CAE Groups" className="h-10 w-auto" />
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-emerald-900">CAE GROUPS</h1>
            <p className="text-xs text-slate-600">Stock and Sales Tracking</p>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-emerald-900">Partner Registration</h2>
        <p className="-mt-2 text-sm text-slate-600">Create account and wait for admin approval.</p>
        <input className="app-input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="app-input" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="app-input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input className="app-input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-100 border-t-white" />
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </button>
        {message ? <p className="text-sm text-slate-700">{message}</p> : null}
        <Link className="block text-sm font-medium text-emerald-700 hover:text-emerald-800" to="/login">
          Back to login
        </Link>
      </form>
    </div>
  );
}
