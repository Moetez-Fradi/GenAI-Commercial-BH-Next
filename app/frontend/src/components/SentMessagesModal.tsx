import type { Client } from "../types/client";
import Modal from "./Modal";

export default function SentMessagesModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const msgs = client.messages ?? [];

  return (
    <Modal open={true} onClose={onClose}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Sent Messages — {client.name}
        </h3>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-all duration-300 text-white">
          ✕
        </button>
      </div>

      {msgs.length ? (
        <ul className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {msgs.map(m => (
            <li key={m.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="text-sm text-white/50 mb-2 flex items-center justify-between">
                <span className="text-cyan-400 capitalize">{m.channel}</span>
                <span>{new Date(m.sentAt).toLocaleString()}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm text-white">{m.content}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-white/50 italic flex items-center justify-center py-8">
          No messages sent yet.
        </div>
      )}
    </Modal>
  );
}