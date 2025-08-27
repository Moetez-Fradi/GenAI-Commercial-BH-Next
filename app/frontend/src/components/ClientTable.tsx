import { useState } from "react";
import type { Client } from "../types/client";
import ClientDetailsPopup from "./ClientDetailsPopup";
import MessageComposer from "./MessageComposer";

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
    <div className="bg-white rounded-xl shadow w-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-orange-600">{title}</h3>
        {/* Filters entry point (hook up later) */}
        <button className="text-xs px-3 py-1 border rounded hover:bg-gray-50">Filters</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-orange-500 text-white">
            <tr>
              <th className="p-2">Ref</th>
              <th className="p-2">Name</th>
              <th className="p-2">Recommendation</th>
              <th className="p-2">Rank</th>
              <th className="p-2">Status</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.ref_personne} className="odd:bg-white even:bg-orange-50/30">
                <td className="p-2">{c.ref_personne}</td>
                <td className="p-2">{c.name}</td>
                <td className="p-2">
                  {c.recommendation && c.recommendation.length ? (
                    <div className="flex flex-wrap gap-1">
                      {c.recommendation.map((r) => (
                        <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                          {r}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>
                <td className="p-2">{c.rank}</td>
                <td className="p-2 capitalize">{c.status}</td>
                <td className="p-2">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setSelected(c)}
                      className="px-3 py-1 text-xs rounded bg-neutral-800 text-white hover:opacity-90"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setMsgClient(c)}
                      className="px-3 py-1 text-xs rounded bg-orange-500 text-white hover:bg-orange-600"
                    >
                      Generate
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!clients.length && (
              <tr>
                <td className="p-6 text-center text-gray-400" colSpan={6}>No data</td>
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