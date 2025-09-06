export default function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    accepted: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    refused: "bg-red-50 text-red-700 border border-red-200",
    not_contacted: "bg-slate-50 text-slate-700 border border-slate-200",
    // Additional status mappings for the insurance context
    Bronze: "bg-orange-50 text-orange-700 border border-orange-200",
    Silver: "bg-slate-50 text-slate-700 border border-slate-200",
    Gold: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    Premium: "bg-purple-50 text-purple-700 border border-purple-200",
    Prospect: "bg-blue-50 text-blue-700 border border-blue-200",
    "High Risk": "bg-red-50 text-red-700 border border-red-200",
    "Medium Risk": "bg-amber-50 text-amber-700 border border-amber-200",
    "Low Risk": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    HIGH_RISK: "bg-red-50 text-red-700 border border-red-200",
    MEDIUM_RISK: "bg-amber-50 text-amber-700 border border-amber-200",
    LOW_RISK: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Entreprise: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    Business: "bg-blue-50 text-blue-700 border border-blue-200",
    SME: "bg-teal-50 text-teal-700 border border-teal-200",
    "Small Business": "bg-cyan-50 text-cyan-700 border border-cyan-200",
    Startup: "bg-violet-50 text-violet-700 border border-violet-200",
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${colors[status] ?? "bg-slate-50 text-slate-700 border border-slate-200"}`}
    >
      {status}
    </span>
  )
}