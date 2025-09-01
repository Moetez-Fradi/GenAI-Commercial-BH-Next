// src/types/client.ts (updated)

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

/* -------------------- Recommendation -------------------- */
/** A recommendation entry can be a plain string or a richer object from the backend. */
export interface Recommendation {
  product?: string | null;      // normalized product name
  label?: string | null;        // human-friendly label
  score?: number | null;        // numeric score (0..100) if available
  product_id?: string | null;   // any other backend prop you want to keep
  raw?: any;                    // preserve full object if you need it
  [key: string]: any;
}

/* -------------------- Physique Clients -------------------- */
export interface ClientPhysique {
  ref_personne: string;
  type: "physique";
  name: string;
  rank?: number;
  status: ClientStatus;

  // can be strings (legacy) or objects (newer backend)
  recommended_products?: (string | Recommendation)[];
  recommendation_count?: number;

  // enriched profile
  cin?: string;
  age?: number;
  city?: string;
  phone?: string;
  email?: string;

  // last contact
  lastContact?: ContactMethod | null;

  // previously sent messages
  messages?: SentMessage[];
}

/* -------------------- Moral Clients -------------------- */
export interface ClientMoral {
  ref_personne: string;
  type: "moral";
  raison_sociale?: string;

  // can be strings (legacy) or objects (newer backend)
  recommended_products?: (string | Recommendation)[];
  recommendation_count?: number;

  // enriched profile
  client_score?: number;
  client_segment?: string;
  risk_profile?: string;
  estimated_budget?: number;
  total_capital_assured?: number;
  total_premiums_paid?: number;

  // last contact
  lastContact?: ContactMethod | null;

  // previously sent messages
  messages?: SentMessage[];
}

/* -------------------- Unified Type -------------------- */
export type Client = ClientPhysique | ClientMoral;
