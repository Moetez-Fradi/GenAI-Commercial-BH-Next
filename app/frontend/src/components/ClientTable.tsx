import { useState } from "react";
import type { Client } from "../types/client";
import ClientDetailsPopup from "./ClientDetailsPopup";
import MessageComposer from "./MessageComposer";
import StatusBadge from "./StatusBadge";
import { Eye, MessageSquare } from "lucide-react";

interface Props {
  title: string;
  clients: Client[];
  onUpdateClient: (updated: Client) => void;
  onMessageSent: (clientRef: string) => void;
}

export default function ClientTable({ title, clients, onUpdateClient, onMessageSent }: Props) {
  const [selected, setSelected] = useState<Client | null>(null);
  const [msgClient, setMsgClient] = useState<Client | null>(null);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <h3 className="font-semibold text-lg">{title}</h3>
        <button className="text-xs px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition">
          Filters
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
            <tr>
              <th className="p-3">Ref</th>
              <th className="p-3">Name</th>
              <th className="p-3">Recommendation</th>
              <th className="p-3">Rank</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.ref_personne} className="border-b hover:bg-gray-50 transition">
                <td className="p-3">{c.ref_personne}</td>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">
                  {c.recommendation && c.recommendation.length ? (
                    <div className="flex flex-wrap gap-1">
                      {c.recommendation.map((r) => (
                        <span
                          key={r}
                          className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800"
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
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setSelected(c)}
                      className="flex items-center gap-1 px-3 py-1 text-xs rounded bg-gray-800 text-white hover:bg-gray-700 transition"
                    >
                      <Eye size={14} /> Details
                    </button>
                    <button
                      onClick={() => setMsgClient(c)}
                      className="flex items-center gap-1 px-3 py-1 text-xs rounded bg-orange-500 text-white hover:bg-orange-600 transition"
                    >
                      <MessageSquare size={14} /> Generate
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!clients.length && (
              <tr>
                <td className="p-6 text-center text-gray-400" colSpan={6}>
                  No clients
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <ClientDetailsPopup
          client={selected}
          onClose={() => setSelected(null)}
          onUpdate={(u) => {
            onUpdateClient(u);
            setSelected(u);
          }}
        />
      )}

      {msgClient && (
        <MessageComposer
          client={msgClient}
          onClose={() => setMsgClient(null)}
          onSent={() => {
            onMessageSent(msgClient.ref_personne);
            setMsgClient(null);
          }}
        />
      )}
    </div>
  );
}