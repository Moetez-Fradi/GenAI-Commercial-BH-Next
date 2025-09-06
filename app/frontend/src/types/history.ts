export type ClientStatus = "pending" | "accepted" | "refused" | "not_contacted";
export type ContactMethod = "whatsapp" | "email" | "phone";

export interface Recommendation {
  product: string;
  status: ClientStatus;
  contact_method: ContactMethod;
}

export interface SentMessage {
  id: number;
  channel: ContactMethod;
  content: string;
  sent_at: string; // ISO string
}

export interface HistoryEntry {
  ref_personne: string;
  name: string;
  rank: number;
  recommendations: Recommendation[];
  created_at: string;
  updated_at: string;
  messages?: SentMessage[];
}