import type { Client, Recommendation } from "../types/client";

interface Props {
  client: Client;
  recommendation: Recommendation;
  onClose: () => void;
}

export default function MessagesModal({ client, recommendation, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Messages – {client.ref_personne} (
            {"name" in client ? client.name : client.raison_sociale}) –{" "}
            {recommendation.product}
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
          {recommendation.messages && recommendation.messages.length > 0 ? (
            recommendation.messages.map((msg) => (
              <div
                key={msg.id}
                className="border rounded-lg p-3 bg-gray-50 shadow-sm"
              >
                <div className="text-xs text-gray-500 mb-1">
                  {new Date(msg.sentAt).toLocaleString()} • via{" "}
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