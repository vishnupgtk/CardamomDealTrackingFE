import { useState } from "react";

export default function PaymentModal({ onSubmit }) {
  const [dealId, setDealId] = useState("");
  const [amount, setAmount] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    await onSubmit({ dealId, amount: Number(amount) });
    setDealId("");
    setAmount("");
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="font-semibold">Request Payment Entry</h3>
      <input className="w-full rounded border p-2" placeholder="Deal Id" value={dealId} onChange={(e) => setDealId(e.target.value)} />
      <input className="w-full rounded border p-2" placeholder="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <button className="rounded bg-emerald-700 px-3 py-2 text-white">Submit</button>
    </form>
  );
}
