import type { Client, ContactMethod, SentMessage } from "../types/client";

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

// ---- Replace these with real HTTP calls ----
export async function imputeClientData(partial: Client): Promise<Client> {
  // Mock: fill missing fields from “similar clients”
  await wait(300);
  return {
    ...partial,
    cin: partial.cin ?? "12345678",
    age: partial.age ?? 45,
    city: partial.city ?? "Tunis",
    phone: partial.phone ?? "+216 22 222 222",
    email: partial.email ?? "client@example.com",
  };
}

export async function generatePitch(client: Client): Promise<string> {
  await wait(250);
  // Mock generation — replace with your GenAI backend call
  const name = client.name.split(" ")[0];
  const recos = client.recommendation?.join(", ") || "nos offres adaptées";
  return `Salam ${name}, ${client.city ? `à ${client.city}, ` : ""}vous êtes éligible à ${recos}. Voulez-vous en discuter ?`;
}

export async function sendMessage(
  client: Client,
  channel: ContactMethod,
  content: string
): Promise<SentMessage> {
  await wait(200);
  const msg: SentMessage = {
    id: crypto.randomUUID(),
    clientRef: client.ref_personne,
    channel,
    content,
    sentAt: new Date().toISOString(),
  };
  return msg;
}