import { type HistoryEntry, type Recommendation, type SentMessage } from "../types/history";
import { useEffect, useState } from "react";

interface Props {
  client: HistoryEntry;
  recommendation: Recommendation;
  onClose: () => void;
}

export default function MessagesModal({ client, recommendation, onClose }: Props) {
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_LINK}/history/${client.ref_personne}/messages`
        );
        console.log(`${import.meta.env.VITE_BACKEND_LINK}/history/${client.ref_personne}/messages`)
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [client.ref_personne]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 w-full max-w-2xl rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Messages – <span className="text-purple-400">{client.ref_personne}</span> ({client.name}) – {recommendation.product}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all duration-300 text-white"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-white/50 italic flex items-center justify-center py-8">
              Loading messages...
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
              >
                <div className="text-sm text-white/50 mb-2 flex items-center gap-2">
                  <span>{new Date(msg.sent_at).toLocaleString()}</span>
                  <span className="text-white/30">•</span>
                  <span className="text-cyan-400 capitalize">{msg.channel}</span>
                </div>
                <p className="text-white">{msg.content}</p>
              </div>
            ))
          ) : (
            <div className="text-white/50 italic flex items-center justify-center py-8">
              No messages found for this recommendation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}