"use client"

import { Outlet, Link, useLocation } from "react-router-dom"
import { Home, History, LogOut, AlertTriangle } from "lucide-react"
import { useAuth } from "../context/AuthContext"

export default function Layout() {
  const { pathname } = useLocation()
  const { logout } = useAuth()

  const menu = [
    { to: "/dashboard/clients-morales", label: "Clients Morales", icon: <Home size={18} /> },
    { to: "/dashboard/clients-physiques", label: "Clients Physiques", icon: <Home size={18} /> },
    { to: "/history", label: "History", icon: <History size={18} /> },
    { to: "/dashboard/alerts", label: "Alerts", icon: <AlertTriangle size={18} /> }
  ];


  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gradient-to-b from-green-600 to-emerald-500 text-white flex flex-col">
        {" "}
        {/* Updated gradient from red/orange to green/emerald */}
        <div className="p-4 font-bold text-xl tracking-wide text-center">
          BH Assurance <br />
          <span className="text-green-200">GENAI</span>
        </div>
        <nav className="flex-1 space-y-2 p-3">
          {menu.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition 
              ${pathname === item.to ? "bg-white/20" : "hover:bg-white/10"}`}
            >
              {item.icon} <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="flex items-center gap-2 p-3 hover:bg-white/10 transition">
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}