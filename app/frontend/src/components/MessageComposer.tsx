import { useEffect, useState } from "react";
import type { Client, ContactMethod } from "../types/client";
import Modal from "./Modal";
import { useAuth } from "../context/AuthContext";

interface Props {
  client: Client;
  onClose: () => void;
  onSent: (channel: ContactMethod, content: string) => void;
  initialMessage?: string;
}

export default function MessageComposer({
  client,
  onClose,
  onSent,
  initialMessage,
}: Props) {
  const [message, setMessage] = useState(initialMessage ?? "");
  const [customPrompt, setCustomPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const { token } = useAuth();

  const pickProduct = (recommended?: any) => {
    if (!recommended) return "the recommended product";
    if (typeof recommended === "string") return recommended;
    return (
      recommended.product ??
      recommended.label ??
      recommended.product_id ??
      String(recommended.raw ?? "the recommended product")
    );
  };

  // Build a clearer, more structured set of messages for the LLM
  const buildMessages = (c: Client) => {
    const msgs: { role: string; content: string }[] = [];

    // System instruction: role + hard constraints
    msgs.push({
      role: "system",
      content:
        "You are a concise, professional sales assistant that writes short commercial pitches suitable for WhatsApp or email. " +
        "Always return ONLY the pitch text (no commentary, no metadata). Keep the pitch to 2–3 short sentences and include a single short call-to-action (CTA). " +
        "Avoid emojis, hashtags, and long sign-offs. Use available customer details (age, city, status) to personalize the pitch when relevant. " +
        "If the pitch is intended for email, keep it slightly more formal and still short.",
    });

    // include previous messages lightly as assistant context (if available)
    const anyC: any = c as any;
    if (Array.isArray(anyC.messages) && anyC.messages.length) {
      anyC.messages.forEach((m: any) => {
        const text = typeof m === "string" ? m : m.content ?? m.body ?? "";
        if (text) msgs.push({ role: "assistant", content: text });
      });
    }

    // first recommended product
    const firstRec =
      Array.isArray(anyC.recommended_products) && anyC.recommended_products.length
        ? anyC.recommended_products[0]
        : anyC.recommended_products;
    const product = pickProduct(firstRec);

    const ref = anyC.ref_personne;
    const who =
      anyC.type === "physique"
        ? `customer ${anyC.name ?? ref}`
        : `company ${anyC.raison_sociale ?? ref}`;

    const details: string[] = [];
    if ("age" in anyC && anyC.age) details.push(`age: ${anyC.age}`);
    if ("city" in anyC && anyC.city) details.push(`city: ${anyC.city}`);
    if ("status" in anyC && anyC.status) details.push(`status: ${anyC.status}`);

    // Primary user instruction describing the actual task
    msgs.push({
      role: "user",
      content:
        `Task: write a short, helpful sales pitch proposing \"${product}\" to ${who}. ` +
        (details.length ? `Customer details: ${details.join(", ")}. ` : "") +
        "Tone: professional and helpful. Length: 2–3 short sentences. Include exactly one short CTA (e.g., 'Reply to this message to get 10% off' or 'Would you like a quick quote?'). " +
        "Channel: message must be suitable for WhatsApp or for email as a short body. Output only the pitch text (no headings, no signatures, no extra notes).",
    });

    return msgs;
  };

  const callLLM = async (c: Client, userPrompt?: string) => {
    const BACKEND = import.meta.env.VITE_BACKEND_LINK?.replace(/\/$/, "") ?? "";
    if (!BACKEND) throw new Error("VITE_BACKEND_LINK is not configured");

    const messages = buildMessages(c);
    // If the user entered a custom prompt, pass it as an additional 'user' message
    if (userPrompt && userPrompt.trim()) {
      messages.push({ role: "user", content: `User prompt: ${userPrompt.trim()}` });
    }

    const res = await fetch(`${BACKEND}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        messages,
        temperature: 1.0,
        max_tokens: 300,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`LLM request failed: ${res.status} ${res.statusText} ${text}`);
    }
    const json = await res.json();
    return (json?.reply ?? "").trim();
  };

  // If no initialMessage provided, generate on mount.
  useEffect(() => {
    if (initialMessage) return; // already prefilled
    const run = async () => {
      setBusy(true);
      try {
        const m = await callLLM(client);
        setMessage(m);
      } catch (err: any) {
        console.error("Generate failed", err);
        setMessage("");
        alert("Failed to generate message: " + (err?.message ?? "unknown error"));
      } finally {
        setBusy(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage, client]);

  const regenManual = async () => {
    setBusy(true);
    try {
      // send customPrompt if user provided one
      const m = await callLLM(client, customPrompt);
      setMessage(m);
    } catch (err: any) {
      console.error("Regenerate failed", err);
      alert("Failed to regenerate message: " + (err?.message ?? "unknown error"));
    } finally {
      setBusy(false);
    }
  };

  // Helpers to extract phone/email from client (best-effort)
  const extractPhone = (c: any): string | null => {
    const candidates = [
      c.phone,
      c.phone_number,
      c.phoneNumber,
      c.telephone,
      c.mobile,
      c.tel,
      c.contact_phone,
    ];
    for (const v of candidates) {
      if (!v) continue;
      const s = String(v).trim();
      if (s) return s;
    }
    return null;
  };

  const extractEmail = (c: any): string | null => {
    const candidates = [c.email, c.email_address, c.contact_email, c.mail];
    for (const v of candidates) {
      if (!v) continue;
      const s = String(v).trim();
      if (s) return s;
    }
    return null;
  };

  // sanitize Tunisian phone for your backend which prefixes +216
  const sanitizeTunisianLocalNumber = (raw: string) => {
    let s = raw.replace(/[\s\-\(\)\+]/g, ""); // remove spaces, dashes, parentheses and plus
    // If user accidentally provided the international form like 216XXXXXXXX, remove leading 216
    if (s.startsWith("216")) s = s.slice(3);
    // If it starts with a leading 0 (e.g. 09xxxxxx) remove it because backend prefixes +216
    if (s.startsWith("0")) s = s.slice(1);
    return s;
  };

  const send = async (channel: ContactMethod) => {
    if (!message.trim()) {
      alert("Message is empty.");
      return;
    }
    setBusy(true);
    const BACKEND = import.meta.env.VITE_BACKEND_LINK?.replace(/\/$/, "") ?? "";
    if (!BACKEND) {
      alert("Backend not configured (VITE_BACKEND_LINK).");
      setBusy(false);
      return;
    }

    try {
      if (channel === "whatsapp") {
        const rawPhone = extractPhone(client as any);

        const firstRec =
          Array.isArray(client.recommended_products) && client.recommended_products.length
            ? client.recommended_products[0]
            : client.recommended_products;

        const product = pickProduct(firstRec);

        const payload = {
          phone_number: "26907092",
          message: message,
          ref_personne: String(client.ref_personne),
          recommendations: [
            { product: product, status: "pending", contact_method: "whatsapp" },
          ],
        };

        const res = await fetch(`${BACKEND}/whatsapp/send_whatsapp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`WhatsApp send failed: ${res.status} ${res.statusText} ${text}`);
        }

        const json = await res.json();
        onSent(channel, message);
        onClose();
      } else if (channel === "email") {
        const recipient = extractEmail(client as any);

        const anyC: any = client as any;
        const firstRec =
          Array.isArray(anyC.recommended_products) && anyC.recommended_products.length
            ? anyC.recommended_products[0]
            : undefined;
        const product = pickProduct(firstRec);
        const subject = `Quick proposal: ${product}`;

        const payload = {
          recipient: "truetoneofficial1@gmail.com",
          subject,
          body: message,
          ref_personne: String(client.ref_personne),
          rank: client.rank ? client.rank : 0,
          recommendations: [
            {
              product: product,
              status: "pending",
              contact_method: "email",
            },
          ],
        };

        const res = await fetch(`${BACKEND}/email/send_email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Email send failed: ${res.status} ${res.statusText} ${text}`);
        }

        const json = await res.json();
        onSent(channel, message);
        onClose();
      } else {
        alert("Unknown channel: " + String(channel));
      }
    } catch (err: any) {
      console.error("Send failed", err);
      alert("Failed to send message: " + (err?.message ?? "unknown error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-orange-600">Generated Message</h3>
        <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100">
          ✕
        </button>
      </div>

      <textarea
        rows={6}
        className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-orange-400"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Your pitch will appear here..."
      />

      {/* custom prompt bar: optional user prompt sent to LLM when regenerating */}
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Custom prompt (optional)</label>
        <textarea
          rows={3}
          className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-orange-300"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Optional: tweak the tone, emphasise urgency, ask to mention a discount, or request a different CTA. This will be appended to the LLM input when you press Regenerate."
        />
        <p className="text-xs text-gray-500 mt-1">If provided, this will be sent to the LLM as an extra user prompt when generating.</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={regenManual}
          disabled={busy}
          className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {busy ? "Generating..." : "Regenerate"}
        </button>

        <button
          onClick={() => send("whatsapp")}
          disabled={busy}
          className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          WhatsApp
        </button>

        <button
          onClick={() => send("email")}
          disabled={busy}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Email
        </button>
      </div>
    </Modal>
  );
}
