// src/components/MessageComposer.tsx
import { useEffect, useState } from "react";
import type { Client, ContactMethod } from "../types/client";
import Modal from "./Modal";
import { useAuth } from "../context/AuthContext";
// removed sendMessage import since we now call backend endpoints directly

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

  const buildMessages = (c: Client) => {
    const msgs: { role: string; content: string }[] = [];

    // include previous messages lightly as assistant context
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
        : undefined;
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

    msgs.push({
      role: "user",
      content:
        `You are a concise sales assistant. Write a short, friendly commercial pitch (2-3 sentences) proposing "${product}" to ${who}. ` +
        (details.length ? `Customer details: ${details.join(", ")}. ` : "") +
        "Make the tone professional and helpful, include one short call-to-action (CTA), and keep it suitable for WhatsApp or email. " +
        "Return only the pitch text (no extra commentary).",
    });

    return msgs;
  };

  const callLLM = async (c: Client) => {
    const BACKEND = import.meta.env.VITE_BACKEND_LINK?.replace(/\/$/, "") ?? "";
    if (!BACKEND) throw new Error("VITE_BACKEND_LINK is not configured");
    const res = await fetch(`${BACKEND}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        messages: buildMessages(c),
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
      const m = await callLLM(client);
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


          // this should be changed when the contacts are available
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
        // if (!rawPhone) {
        //   alert("No phone number found for this client.");
        //   return;
        // }
        // const localNumber = sanitizeTunisianLocalNumber(rawPhone);
        // if (!/^\d+$/.test(localNumber)) {
        //   alert("Client phone number looks invalid after sanitization: " + localNumber);
        //   return;
        // }

        const payload = {
          phone_number: "26907092",
          message: message,
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
        // optionally check json.status or sid
        onSent(channel, message);
        onClose();
      } else if (channel === "email") {
        const recipient = extractEmail(client as any);
        // if (!recipient) {
        //   alert("No email address found for this client.");
        //   return;
        // }

        const anyC: any = client as any;
        const firstRec =
          Array.isArray(anyC.recommended_products) && anyC.recommended_products.length
            ? anyC.recommended_products[0]
            : undefined;
        const product = pickProduct(firstRec);
        const subject = `Quick proposal: ${product}`;
        
        const payload = {
          recipient : "truetoneofficial1@gmail.com",
          subject,
          body: message,
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
