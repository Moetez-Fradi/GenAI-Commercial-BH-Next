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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Messages – {client.ref_personne} ({client.name}) – {recommendation.product}
          </h2>
          <button
            onClick={onClose}
            className="text-red-600 font-bold text-lg hover:text-red-800"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="text-gray-500 italic">Loading messages...</p>
          ) : messages.length > 0 ? (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="border rounded-lg p-3 bg-gray-50 shadow-sm"
              >
                <div className="text-xs text-gray-500 mb-1">
                  {new Date(msg.sent_at).toLocaleString()} • via{" "}
                  <span className="capitalize">{msg.channel}</span>
                </div>
                <p className="text-gray-800">{msg.content}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm italic">
              No messages found for this recommendation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}