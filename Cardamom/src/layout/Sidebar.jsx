import { NavLink } from "react-router-dom";

export default function Sidebar({ links }) {
  return (
    <aside className="app-panel w-full p-3 md:w-64 md:shrink-0">
      <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/admin" || link.to === "/partner"}
            className={({ isActive }) =>
              `rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
