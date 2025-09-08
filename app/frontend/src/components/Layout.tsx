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
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white/10 backdrop-blur-xl border-r border-white/20 text-white flex flex-col relative z-10">
        <div className="p-6 font-bold text-2xl tracking-wide text-center">
          <div className="bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
            BH Assurance
          </div>
          <span className="relative inline-block mt-2 text-4xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white/90 to-white/40">
            GENAI
            <span className="absolute inset-0 blur-md bg-gradient-to-r from-purple-400/40 to-cyan-400/40 -z-10"></span>
          </span>
        </div>
        <nav className="flex-1 space-y-2 p-4">
          {menu.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
              ${pathname === item.to 
                ? "bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-white/20" 
                : "hover:bg-white/10"}`}
            >
              {item.icon} <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <button 
          onClick={() => logout()} 
          className="flex items-center gap-3 m-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all duration-300"
        >
          <LogOut size={18} /> <span className="font-medium">Logout</span>
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/40 to-slate-900" />
          <div className="absolute top-32 right-20 w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 blur-xl rotate-12 animate-pulse" />
          <div className="absolute bottom-40 left-32 w-36 h-36 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-2xl animate-pulse" />
        </div>
        
        {/* Content with backdrop blur */}
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}