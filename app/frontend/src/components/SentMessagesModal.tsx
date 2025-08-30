import type { Client } from "../types/client";
import Modal from "./Modal";

export default function SentMessagesModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const msgs = client.messages ?? [];

  return (
    <Modal open={true} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-red-600">Sent messages — {client.name}</h3>
        <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100">✕</button>
      </div>

      {msgs.length ? (
        <ul className="space-y-3 max-h-[50vh] overflow-auto">
          {msgs.map(m => (
            <li key={m.id} className="border rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1 flex justify-between">
                <span className="capitalize">{m.channel}</span>
                <span>{new Date(m.sentAt).toLocaleString()}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm">{m.content}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-gray-500">No messages sent yet.</div>
      )}
    </Modal>
  );
}