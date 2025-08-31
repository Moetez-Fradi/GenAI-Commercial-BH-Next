import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();
  const active = (p: string) =>
    pathname === p ? "underline decoration-2 underline-offset-4" : "opacity-85 hover:opacity-100";

  return (
    <nav className="bg-red-600 text-white px-6 py-4 flex items-center justify-between shadow">
      <Link to="/Dashboard" className="font-bold text-xl hover:text-orange-200 transition">GENAI Dashboard</Link>
      <div className="space-x-6 text-sm md:text-base">
        <Link to="/Dashboard" className={active("/Dashboard")}>Clients</Link>
        <Link to="/history" className={active("/history")}>History</Link>
      </div>
    </nav>
  );
}