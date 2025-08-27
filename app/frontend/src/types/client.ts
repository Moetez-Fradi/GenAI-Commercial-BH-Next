export type ClientType = "physique" | "moral";
export type ClientStatus = "pending" | "accepted" | "refused" | "not_contacted";
export type ContactMethod = "whatsapp" | "email" | "phone";

export interface SentMessage {
  id: string;
  clientRef: string;
  channel: ContactMethod;
  content: string;
  sentAt: string; // ISO string
}

export interface Client {
  ref_personne: string;
  name: string;
  type: ClientType;
  rank: number;
  status: ClientStatus;

  // enriched profile
  cin?: string;
  age?: number;
  city?: string;
  phone?: string;
  email?: string;

  // recommendations (current and historical)
  recommendation?: string[];          // current suggestions for dashboard
  recommendationHistory?: string[];   // past suggestions (history page)

  // last contact
  lastContact?: ContactMethod | null;

  // previously sent messages
  messages?: SentMessage[];
}
