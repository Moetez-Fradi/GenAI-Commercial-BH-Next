"use client"

import { useState } from "react"
import type { HistoryEntry, Recommendation } from "../types/history"
import MessagesModal from "./MessagesModal"
import StatusBadge from "./StatusBadge" // Added StatusBadge import

interface Props {
  entries: HistoryEntry[]
}

export default function HistoryTable({ entries }: Props) {
  const [selected, setSelected] = useState<{
    entry: HistoryEntry
    recommendation: Recommendation
  } | null>(null)

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white">
              <th className="px-4 py-4 text-left text-sm font-medium uppercase">Ref</th>
              <th className="px-4 py-4 text-left text-sm font-medium uppercase">Name</th>
              <th className="px-4 py-4 text-left text-sm font-medium uppercase">Rank</th>
              <th className="px-4 py-4 text-left text-sm font-medium uppercase">Recommendations</th>
              <th className="px-4 py-4 text-left text-sm font-medium uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.ref_personne} className="border-b border-white/10 hover:bg-white/5 transition-all duration-300">
                <td className="px-4 py-4 font-medium text-purple-400">{entry.ref_personne}</td>
                <td className="px-4 py-4 font-medium text-white">{entry.name}</td>
                <td className="px-4 py-4 text-white/70">{entry.rank}</td>
                <td className="px-4 py-4 space-y-3">
                  {entry.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3"
                    >
                      <span className="font-medium text-white">{rec.product}</span>
                      <StatusBadge status={rec.status} />
                      <span className="text-xs text-white/50">via {rec.contact_method}</span>
                      <button
                        onClick={() => setSelected({ entry, recommendation: rec })}
                        className="ml-auto px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-700 hover:to-cyan-700 transition-all duration-300 text-sm shadow-lg"
                      >
                        View Messages
                      </button>
                    </div>
                  ))}
                </td>
                <td className="px-4 py-4"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <MessagesModal
          client={selected.entry}
          recommendation={selected.recommendation}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}