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
    <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
      {" "}
      {/* Updated to green design with rounded corners and green border */}
      <div className="overflow-x-auto">
        <table className="w-full border border-green-200">
          {" "}
          {/* Updated border to green */}
          <thead>
            <tr className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              {" "}
              {/* Updated gradient from red/orange to green/emerald */}
              <th className="px-4 py-2 text-left">REF</th>
              <th className="px-4 py-2 text-left">NAME</th>
              <th className="px-4 py-2 text-left">RANK</th>
              <th className="px-4 py-2 text-left">RECOMMENDATIONS</th>
              <th className="px-4 py-2 text-left">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.ref_personne} className="border-t border-green-100 hover:bg-green-50/50 transition">
                {" "}
                {/* Updated border and hover colors to green */}
                <td className="px-4 py-2 font-medium text-green-700">{entry.ref_personne}</td>{" "}
                {/* Updated text color to green */}
                <td className="px-4 py-2 font-semibold">{entry.name}</td>
                <td className="px-4 py-2">{entry.rank}</td>
                <td className="px-4 py-2 space-y-2">
                  {entry.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-green-50 border border-green-200 rounded p-2" // Updated background and border to green
                    >
                      <span className="font-medium">{rec.product}</span>
                      <StatusBadge status={rec.status} />{" "}
                      {/* Replaced inline status styling with StatusBadge component */}
                      <span className="text-xs text-gray-500 ml-2">via {rec.contact_method}</span>
                      <button
                        onClick={() => setSelected({ entry, recommendation: rec })}
                        className="ml-auto bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition shadow-sm" // Updated button colors to green
                      >
                        View Messages
                      </button>
                    </div>
                  ))}
                </td>
                <td className="px-4 py-2"></td>
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