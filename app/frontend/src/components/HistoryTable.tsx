import { useState } from "react";
import { type HistoryEntry, type Recommendation } from "../types/history";
import MessagesModal from "./MessagesModal";

interface Props {
  entries: HistoryEntry[];
}

export default function HistoryTable({ entries }: Props) {
  const [selected, setSelected] = useState<{
    entry: HistoryEntry;
    recommendation: Recommendation;
  } | null>(null);

  return (
    <div className="overflow-x-auto rounded-lg shadow">
      <table className="w-full border border-gray-200">
        <thead>
          <tr className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
            <th className="px-4 py-2 text-left">REF</th>
            <th className="px-4 py-2 text-left">NAME</th>
            <th className="px-4 py-2 text-left">RANK</th>
            <th className="px-4 py-2 text-left">RECOMMENDATIONS</th>
            <th className="px-4 py-2 text-left">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.ref_personne} className="border-t">
              <td className="px-4 py-2">{entry.ref_personne}</td>
              <td className="px-4 py-2 font-semibold">{entry.name}</td>
              <td className="px-4 py-2">{entry.rank}</td>
              <td className="px-4 py-2 space-y-2">
                {entry.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 border rounded p-2"
                  >
                    <span className="font-medium">{rec.product}</span>
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        rec.status === "accepted"
                          ? "bg-green-100 text-green-700"
                          : rec.status === "refused"
                          ? "bg-red-100 text-red-700"
                          : rec.status === "pending"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {rec.status}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      via {rec.contact_method}
                    </span>
                    <button
                      onClick={() => setSelected({ entry, recommendation: rec })}
                      className="ml-auto bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
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

      {selected && (
        <MessagesModal
          client={selected.entry}
          recommendation={selected.recommendation}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}