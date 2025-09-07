export default function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400 border border-amber-500/20 backdrop-blur-sm",
    accepted: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 backdrop-blur-sm",
    refused: "bg-red-500/20 text-red-400 border border-red-500/20 backdrop-blur-sm",
    not_contacted: "bg-slate-500/20 text-slate-400 border border-slate-500/20 backdrop-blur-sm",
    // Additional status mappings for the insurance context
    Bronze: "bg-orange-500/20 text-orange-400 border border-orange-500/20 backdrop-blur-sm",
    Silver: "bg-slate-500/20 text-slate-400 border border-slate-500/20 backdrop-blur-sm",
    Gold: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 backdrop-blur-sm",
    Premium: "bg-purple-500/20 text-purple-400 border border-purple-500/20 backdrop-blur-sm",
    Prospect: "bg-blue-500/20 text-blue-400 border border-blue-500/20 backdrop-blur-sm",
    "High Risk": "bg-red-500/20 text-red-400 border border-red-500/20 backdrop-blur-sm",
    "Medium Risk": "bg-amber-500/20 text-amber-400 border border-amber-500/20 backdrop-blur-sm",
    "Low Risk": "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 backdrop-blur-sm",
    HIGH_RISK: "bg-red-500/20 text-red-400 border border-red-500/20 backdrop-blur-sm",
    MEDIUM_RISK: "bg-amber-500/20 text-amber-400 border border-amber-500/20 backdrop-blur-sm",
    LOW_RISK: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 backdrop-blur-sm",
    Entreprise: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 backdrop-blur-sm",
    Business: "bg-blue-500/20 text-blue-400 border border-blue-500/20 backdrop-blur-sm",
    SME: "bg-teal-500/20 text-teal-400 border border-teal-500/20 backdrop-blur-sm",
    "Small Business": "bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 backdrop-blur-sm",
    Startup: "bg-violet-500/20 text-violet-400 border border-violet-500/20 backdrop-blur-sm",
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-xl ${colors[status] ?? "bg-slate-500/20 text-slate-400 border border-slate-500/20 backdrop-blur-sm"}`}
    >
      {status}
    </span>
  )
}