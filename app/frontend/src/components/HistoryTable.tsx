import type { Client } from "../types/client";
import { useState } from "react";
import SentMessagesModal from "./SentMessagesModal";

interface Props {
  history: Client[];
}

export default function HistoryTable({ history }: Props) {
  const [selected, setSelected] = useState<Client | null>(null);

  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-red-600 text-white">
          <tr>
            <th className="p-2">Ref</th>
            <th className="p-2">Name</th>
            <th className="p-2">Contact</th>
            <th className="p-2">Recommendations</th>
            <th className="p-2">Rank</th>
            <th className="p-2">Status</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {history.map((c) => (
            <tr key={c.ref_personne} className="odd:bg-white even:bg-red-50/40">
              <td className="p-2">{c.ref_personne}</td>
              <td className="p-2">{c.name}</td>
              <td className="p-2 capitalize">{c.lastContact ?? "—"}</td>
              <td className="p-2">
                {c.recommendationHistory?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {c.recommendationHistory.map((r, i) => (
                      <span key={`${r}-${i}`} className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                        {r}
                      </span>
                    ))}
                  </div>
                ) : <span className="text-gray-400 text-sm">—</span>}
              </td>
              <td className="p-2">{c.rank}</td>
              <td className="p-2 capitalize">{c.status}</td>
              <td className="p-2">
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelected(c)}
                    className="px-3 py-1 text-xs rounded bg-neutral-800 text-white hover:opacity-90"
                  >
                    View sent messages
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {!history.length && (
            <tr>
              <td className="p-6 text-center text-gray-400" colSpan={7}>No history</td>
            </tr>
          )}
        </tbody>
      </table>

      {selected && (
        <SentMessagesModal
          client={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}