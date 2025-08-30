import type { Client } from "../types/client";
import { useState } from "react";
import SentMessagesModal from "./SentMessagesModal";
import StatusBadge from "./StatusBadge";
import { Eye } from "lucide-react";

interface Props {
  history: Client[];
}

export default function HistoryTable({ history }: Props) {
  const [selected, setSelected] = useState<Client | null>(null);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b bg-gradient-to-r from-red-600 to-orange-500 text-white">
        <h3 className="font-semibold text-lg">History</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
            <tr>
              <th className="p-3">Ref</th>
              <th className="p-3">Name</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Recommendations</th>
              <th className="p-3">Rank</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map((c) => (
              <tr key={c.ref_personne} className="border-b hover:bg-gray-50 transition">
                <td className="p-3">{c.ref_personne}</td>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 capitalize">{c.lastContact ?? "—"}</td>
                <td className="p-3">
                  {c.recommendationHistory?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {c.recommendationHistory.map((r, i) => (
                        <span
                          key={`${r}-${i}`}
                          className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>
                <td className="p-3">{c.rank}</td>
                <td className="p-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="p-3">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setSelected(c)}
                      className="flex items-center gap-1 px-3 py-1 text-xs rounded bg-gray-800 text-white hover:bg-gray-700 transition"
                    >
                      <Eye size={14} /> View Messages
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!history.length && (
              <tr>
                <td className="p-6 text-center text-gray-400" colSpan={7}>
                  No history
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <SentMessagesModal client={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}