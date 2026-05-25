import { useEffect, useMemo, useState } from "react";
import AppShell from "../layout/AppShell";
import { formatKg, formatRs } from "../utils/formatters";

const links = [
  { label: "Dashboard", to: "/admin" },
  { label: "Stocks", to: "/admin/stocks" },
  { label: "Sales", to: "/admin/sales" },
  { label: "Users", to: "/admin/users" },
  { label: "Payment Requests", to: "/admin/payment-requests" },
  { label: "Rough Notes", to: "/admin/rough-notes" },
  { label: "Basic Calculator", to: "/admin/calculator" },
  { label: "Sample Profit Calculation", to: "/admin/sample-profit" },
];

const NOTES_STORAGE_KEY = "cae-rough-work-notes-v1";
const emptyNote = { title: "", content: "" };
const toolDetails = {
  notes: {
    title: "Rough Notes",
    description: "Quick workings saved in this browser only. Nothing here changes stocks, sales, or profit records.",
  },
  calculator: {
    title: "Basic Calculator",
    description: "Use a simple calculator for quick arithmetic without affecting any application record.",
  },
  profit: {
    title: "Sample Profit Calculation",
    description: "Preview profit for trial purposes only. This does not create a sale or update profit records.",
  },
};

function loadStoredNotes() {
  try {
    const notes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) ?? "[]");
    return Array.isArray(notes) ? notes : [];
  } catch {
    return [];
  }
}

function newNoteId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function asNumber(value) {
  return Number(value) || 0;
}

export default function RoughWorkPage({ tool = "notes" }) {
  const activeTool = toolDetails[tool] ? tool : "notes";
  const [notes, setNotes] = useState(loadStoredNotes);
  const [noteForm, setNoteForm] = useState(emptyNote);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const saveNote = (event) => {
    event.preventDefault();
    const content = noteForm.content.trim();
    if (!content) return;

    const timestamp = new Date().toISOString();
    const title = noteForm.title.trim() || content.split("\n")[0].slice(0, 50) || "Rough note";

    if (editingId) {
      setNotes((current) =>
        current.map((note) =>
          note.id === editingId ? { ...note, title, content, updatedAt: timestamp } : note,
        ),
      );
    } else {
      setNotes((current) => [
        { id: newNoteId(), title, content, createdAt: timestamp, updatedAt: timestamp },
        ...current,
      ]);
    }

    setNoteForm(emptyNote);
    setEditingId(null);
  };

  const editNote = (note) => {
    setNoteForm({ title: note.title, content: note.content });
    setEditingId(note.id);
  };

  const deleteNote = (note) => {
    if (!window.confirm(`Delete rough note "${note.title}"?`)) return;
    setNotes((current) => current.filter((item) => item.id !== note.id));
    if (editingId === note.id) {
      setNoteForm(emptyNote);
      setEditingId(null);
    }
  };

  return (
    <AppShell links={links}>
      <div className="mb-5">
        <h2 className="text-2xl font-extrabold tracking-tight text-emerald-900">{toolDetails[activeTool].title}</h2>
        <p className="mt-1 text-sm text-slate-600">{toolDetails[activeTool].description}</p>
      </div>

      {activeTool === "notes" && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Rough Notepad</h3>
              <p className="text-sm text-slate-600">Keep quick workings and update or delete them anytime.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {notes.length} note{notes.length === 1 ? "" : "s"}
            </span>
          </div>

          <form onSubmit={saveNote} className="rounded-xl border border-slate-200 bg-white p-3">
            <input
              className="app-input mb-3"
              placeholder="Title (optional)"
              value={noteForm.title}
              onChange={(event) => setNoteForm((current) => ({ ...current, title: event.target.value }))}
            />
            <textarea
              className="app-input min-h-32 resize-y"
              placeholder="Write your rough calculation or reminder..."
              required
              value={noteForm.content}
              onChange={(event) => setNoteForm((current) => ({ ...current, content: event.target.value }))}
            />
            <div className="mt-3 flex justify-end gap-2">
              {editingId && (
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  onClick={() => {
                    setNoteForm(emptyNote);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                {editingId ? "Update Note" : "Save Note"}
              </button>
            </div>
          </form>

          <div className="mt-4 space-y-3">
            {notes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
                No rough notes saved yet.
              </div>
            ) : (
              notes.map((note) => (
                <article key={note.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate font-semibold text-slate-900">{note.title}</h4>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Updated {new Date(note.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => editNote(note)}
                        className="rounded-md border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteNote(note)}
                        className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{note.content}</p>
                </article>
              ))
            )}
          </div>
        </section>
      )}
      {activeTool === "calculator" && <BasicCalculator />}
      {activeTool === "profit" && <SampleProfitCalculator />}
    </AppShell>
  );
}

function calculateResult(first, second, operator) {
  if (operator === "+") return first + second;
  if (operator === "-") return first - second;
  if (operator === "*") return first * second;
  if (operator === "/") return second === 0 ? null : first / second;
  return second;
}

const initialCalculator = {
  display: "0",
  stored: null,
  operator: null,
  waiting: false,
};

function addCalculatorDigit(current, digit) {
  return {
    ...current,
    display: current.waiting || current.display === "Error" || current.display === "0"
      ? digit
      : `${current.display}${digit}`,
    waiting: false,
  };
}

function addCalculatorDecimal(current) {
  if (current.waiting || current.display === "Error") {
    return { ...current, display: "0.", waiting: false };
  }
  return current.display.includes(".") ? current : { ...current, display: `${current.display}.` };
}

function chooseCalculatorOperator(current, operator) {
  const entered = Number(current.display);
  if (current.display === "Error") {
    return { display: "0", stored: null, operator, waiting: true };
  }
  if (current.operator && !current.waiting) {
    const result = calculateResult(current.stored, entered, current.operator);
    if (result == null) return { ...initialCalculator, display: "Error", waiting: true };
    return { display: String(result), stored: result, operator, waiting: true };
  }
  return { ...current, stored: current.stored ?? entered, operator, waiting: true };
}

function finishCalculatorCalculation(current) {
  if (!current.operator || current.waiting || current.display === "Error") return current;
  const result = calculateResult(current.stored, Number(current.display), current.operator);
  if (result == null) return { ...initialCalculator, display: "Error", waiting: true };
  return { display: String(result), stored: null, operator: null, waiting: false };
}

function backspaceCalculatorDisplay(current) {
  if (current.display === "Error") return initialCalculator;
  if (current.waiting) return current;
  const nextValue = current.display.slice(0, -1);
  return { ...current, display: nextValue && nextValue !== "-" ? nextValue : "0" };
}

function BasicCalculator() {
  const [calculator, setCalculator] = useState(initialCalculator);

  const enterDigit = (digit) => {
    setCalculator((current) => addCalculatorDigit(current, digit));
  };

  const enterDecimal = () => {
    setCalculator(addCalculatorDecimal);
  };

  const selectOperator = (operator) => {
    setCalculator((current) => chooseCalculatorOperator(current, operator));
  };

  const showResult = () => {
    setCalculator(finishCalculatorCalculation);
  };

  const applyPercentage = () => {
    setCalculator((current) => {
      if (current.display === "Error") return current;
      return { ...current, display: String(Number(current.display) / 100) };
    });
  };

  const toggleSign = () => {
    setCalculator((current) => {
      if (current.display === "Error" || Number(current.display) === 0) return current;
      return { ...current, display: String(-Number(current.display)) };
    });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      const numpadDigit = /^Numpad(\d)$/.exec(event.code)?.[1];
      const numpadOperator = {
        NumpadAdd: "+",
        NumpadSubtract: "-",
        NumpadMultiply: "*",
        NumpadDivide: "/",
      }[event.code];
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName)
      ) {
        return;
      }

      if (numpadDigit) {
        event.preventDefault();
        setCalculator((current) => addCalculatorDigit(current, numpadDigit));
      } else if (/^\d$/.test(event.key)) {
        event.preventDefault();
        setCalculator((current) => addCalculatorDigit(current, event.key));
      } else if (event.code === "NumpadDecimal" || event.key === ".") {
        event.preventDefault();
        setCalculator(addCalculatorDecimal);
      } else if (numpadOperator || ["+", "-", "*", "/"].includes(event.key)) {
        event.preventDefault();
        setCalculator((current) => chooseCalculatorOperator(current, numpadOperator ?? event.key));
      } else if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        setCalculator(finishCalculatorCalculation);
      } else if (event.key === "%") {
        event.preventDefault();
        setCalculator((current) =>
          current.display === "Error" ? current : { ...current, display: String(Number(current.display) / 100) },
        );
      } else if (event.key === "Backspace") {
        event.preventDefault();
        setCalculator(backspaceCalculatorDisplay);
      } else if (event.key === "Escape" || event.key === "Delete") {
        event.preventDefault();
        setCalculator(initialCalculator);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const numericButtons = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-lg font-bold text-slate-900">Basic Calculator</h3>
      <p className="mb-4 text-sm text-slate-600">
        Use the on-screen keys or your desktop number pad. Press Enter for result, Backspace to erase, and Esc to clear.
      </p>
      <div className="mx-auto max-w-sm rounded-2xl bg-slate-900 p-4 shadow-sm">
        <div className="mb-3 min-h-16 overflow-hidden rounded-xl bg-slate-800 px-4 py-3 text-right text-3xl font-semibold text-white">
          {calculator.display}
        </div>
        <div className="grid grid-cols-4 gap-2">
          <CalcButton label="C" action={() => setCalculator(initialCalculator)} muted />
          <CalcButton label="+/-" action={toggleSign} muted />
          <CalcButton label="%" action={applyPercentage} muted />
          <CalcButton label="/" action={() => selectOperator("/")} operation />
          {numericButtons.map((digit, index) => (
            <span key={digit} className="contents">
              <CalcButton label={digit} action={() => enterDigit(digit)} />
              {index === 2 && <CalcButton label="x" action={() => selectOperator("*")} operation />}
              {index === 5 && <CalcButton label="-" action={() => selectOperator("-")} operation />}
              {index === 8 && <CalcButton label="+" action={() => selectOperator("+")} operation />}
            </span>
          ))}
          <button
            type="button"
            onClick={() => enterDigit("0")}
            className="col-span-2 rounded-xl bg-slate-700 px-4 py-3 text-left text-lg font-semibold text-white hover:bg-slate-600"
          >
            0
          </button>
          <CalcButton label="." action={enterDecimal} />
          <CalcButton label="=" action={showResult} operation />
        </div>
      </div>
    </section>
  );
}

function CalcButton({ label, action, operation = false, muted = false }) {
  const color = operation
    ? "bg-emerald-600 hover:bg-emerald-500"
    : muted
      ? "bg-slate-600 hover:bg-slate-500"
      : "bg-slate-700 hover:bg-slate-600";
  return (
    <button
      type="button"
      onClick={action}
      className={`rounded-xl px-4 py-3 text-lg font-semibold text-white transition ${color}`}
    >
      {label}
    </button>
  );
}

function SampleProfitCalculator() {
  const [values, setValues] = useState({
    purchaseKg: "",
    sampleKg: "",
    excessKg: "",
    purchaseRate: "",
    brokerCharge: "",
    saleKg: "",
    sellingRate: "",
    extraCharges: "",
    partnerPercentage: "",
  });

  const result = useMemo(() => {
    const purchaseKg = asNumber(values.purchaseKg);
    const sellableKg = purchaseKg + asNumber(values.sampleKg) + asNumber(values.excessKg);
    const stockCost = (purchaseKg * asNumber(values.purchaseRate)) + asNumber(values.brokerCharge);
    const costPerKg = sellableKg > 0 ? stockCost / sellableKg : 0;
    const saleKg = asNumber(values.saleKg);
    const saleIncome = (saleKg * asNumber(values.sellingRate)) + asNumber(values.extraCharges);
    const allocatedCost = saleKg * costPerKg;
    const profit = saleIncome - allocatedCost;
    const percentage = asNumber(values.partnerPercentage);
    return {
      sellableKg,
      stockCost,
      costPerKg,
      saleKg,
      saleIncome,
      allocatedCost,
      profit,
      partnerProfit: (profit * percentage) / 100,
      percentage,
      ready: purchaseKg > 0 && sellableKg > 0 && saleKg > 0,
    };
  }, [values]);

  const updateValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900">Sample Profit Calculation</h3>
        <p className="text-sm text-slate-600">
          Trial-only preview using the same completed-deal cost method as sales profit. It does not create a sale.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <NumberField label="Purchase kg" value={values.purchaseKg} onChange={(value) => updateValue("purchaseKg", value)} />
          <NumberField label="Sample kg" value={values.sampleKg} onChange={(value) => updateValue("sampleKg", value)} />
          <NumberField label="Excess kg" value={values.excessKg} onChange={(value) => updateValue("excessKg", value)} />
          <NumberField label="Purchase rate / kg" value={values.purchaseRate} onChange={(value) => updateValue("purchaseRate", value)} />
          <NumberField label="Broker charge" value={values.brokerCharge} onChange={(value) => updateValue("brokerCharge", value)} />
          <NumberField label="Sale kg" value={values.saleKg} onChange={(value) => updateValue("saleKg", value)} />
          <NumberField label="Selling rate / kg" value={values.sellingRate} onChange={(value) => updateValue("sellingRate", value)} />
          <NumberField label="Extra charges" value={values.extraCharges} onChange={(value) => updateValue("extraCharges", value)} />
          <NumberField
            label="Partner share % (optional)"
            value={values.partnerPercentage}
            onChange={(value) => updateValue("partnerPercentage", value)}
          />
          <div className="flex items-end sm:col-span-2 xl:col-span-3">
            <button
              type="button"
              onClick={() =>
                setValues({
                  purchaseKg: "",
                  sampleKg: "",
                  excessKg: "",
                  purchaseRate: "",
                  brokerCharge: "",
                  saleKg: "",
                  sellingRate: "",
                  extraCharges: "",
                  partnerPercentage: "",
                })
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear Sample
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
          {result.saleKg > result.sellableKg && result.sellableKg > 0 && (
            <p className="mb-3 rounded-lg bg-amber-100 p-2 text-xs font-medium text-amber-800">
              Sale kg is greater than the available sellable kg in this sample.
            </p>
          )}
          {result.percentage > 100 && (
            <p className="mb-3 rounded-lg bg-amber-100 p-2 text-xs font-medium text-amber-800">
              Partner share cannot be more than 100% in an actual deal.
            </p>
          )}
          <ResultRow label="Sellable stock" value={formatKg(result.sellableKg)} />
          <ResultRow label="Total stock cost" value={formatRs(result.stockCost)} />
          <ResultRow label="Effective cost / kg" value={formatRs(result.costPerKg)} />
          <ResultRow label="Sales amount" value={formatRs(result.saleIncome)} />
          <ResultRow label="Allocated cost" value={formatRs(result.allocatedCost)} />
          <div className="my-3 border-t border-emerald-200" />
          <ResultRow
            label="Estimated profit"
            value={result.ready ? formatRs(result.profit) : "-"}
            strong
            negative={result.ready && result.profit < 0}
          />
          {values.partnerPercentage !== "" && (
            <ResultRow
              label={`Partner share (${result.percentage}%)`}
              value={result.ready ? formatRs(result.partnerProfit) : "-"}
              negative={result.ready && result.partnerProfit < 0}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        type="number"
        min="0"
        step="0.01"
        className="app-input mt-1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ResultRow({ label, value, strong = false, negative = false }) {
  return (
    <div className={`flex items-center justify-between gap-3 py-1.5 ${strong ? "text-lg font-bold" : "text-sm"}`}>
      <span className={strong ? "text-emerald-900" : "text-slate-600"}>{label}</span>
      <span className={negative ? "font-semibold text-rose-700" : strong ? "text-emerald-900" : "font-semibold text-slate-800"}>
        {value}
      </span>
    </div>
  );
}
