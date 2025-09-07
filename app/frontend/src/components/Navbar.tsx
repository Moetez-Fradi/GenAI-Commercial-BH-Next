import { Link, useLocation } from "react-router-dom"

export default function Navbar() {
  const { pathname } = useLocation()
  const active = (p: string) =>
    pathname === p ? "underline decoration-2 underline-offset-4" : "opacity-85 hover:opacity-100"

  return (
    <nav className="bg-white/10 backdrop-blur-xl border-b border-white/20 text-white px-6 py-4 flex items-center justify-between">
      <Link 
        to="/Dashboard" 
        className="font-bold text-xl bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent hover:from-purple-300 hover:to-cyan-300 transition-all duration-300"
      >
        GENAI Dashboard
      </Link>
      <div className="space-x-6 text-sm md:text-base">
        <Link 
          to="/Dashboard" 
          className={`${active("/Dashboard")} transition-all duration-300 hover:text-purple-400`}
        >
          Clients
        </Link>
        <Link 
          to="/history" 
          className={`${active("/history")} transition-all duration-300 hover:text-purple-400`}
        >
          History
        </Link>
      </div>
    </nav>
  )
}