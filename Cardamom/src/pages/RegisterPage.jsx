import { useState } from "react";
import { Link } from "react-router-dom";
import { registerPartner } from "../services/authService";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", username: "", password: "", phone: "" });
  const [message, setMessage] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerPartner(form);
      setMessage("Registration submitted. Wait for admin approval.");
      setForm({ name: "", username: "", password: "", phone: "" });
    } catch (err) {
      setMessage(err?.response?.data?.message ?? "Registration failed.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={onSubmit} className="app-panel w-full max-w-md space-y-4 p-7">
        <h2 className="text-2xl font-bold text-emerald-900">Partner Registration</h2>
        <p className="-mt-2 text-sm text-slate-600">Create account and wait for admin approval.</p>
        <input className="app-input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="app-input" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="app-input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input className="app-input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <button className="w-full rounded-xl bg-emerald-700 py-2.5 font-semibold text-white transition hover:bg-emerald-800">Submit</button>
        {message ? <p className="text-sm text-slate-700">{message}</p> : null}
        <Link className="block text-sm font-medium text-emerald-700 hover:text-emerald-800" to="/login">
          Back to login
        </Link>
      </form>
    </div>
  );
}
