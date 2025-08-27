import { useEffect, useState } from "react";
import type { Client, ContactMethod } from "../types/client";
import { generatePitch, sendMessage } from "../api/clients";

interface Props {
  client: Client;
  onClose: () => void;
  onSent: (channel: ContactMethod, content: string) => void;
}

export default function MessageComposer({ client, onClose, onSent }: Props) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const regen = async () => {
    setBusy(true);
    try {
      const m = await generatePitch(client);
      setMessage(m);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    // generate once on mount
    regen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async (channel: ContactMethod) => {
    if (!message.trim()) return;
    setBusy(true);
    try {
      await sendMessage(client, channel, message);
      onSent(channel, message);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[min(640px,92vw)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Generated Message</h3>
          <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100">✕</button>
        </div>

        <textarea
          rows={6}
          className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-orange-400"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Your pitch will appear here..."
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={regen} disabled={busy}
                  className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50">
            {busy ? "Generating..." : "Regenerate"}
          </button>
          <button onClick={() => send("whatsapp")} disabled={busy}
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
            WhatsApp
          </button>
          <button onClick={() => send("email")} disabled={busy}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
            Email
          </button>
        </div>
      </div>
    </div>
  );
}