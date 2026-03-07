import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppShell({ links, children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-3 pb-6 pt-4 md:flex-row md:px-5">
        <Sidebar links={links} />
        <main className="app-panel min-h-[calc(100vh-140px)] min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
