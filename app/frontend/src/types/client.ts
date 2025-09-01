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
export interface Recommendation {
  product: string;                     // normalized product name
  label?: string;                      // human-friendly label
  score?: number | null;
  status?: ClientStatus;               // accepted / refused / pending
  contacts?: ContactMethod[];          // e.g. ["email"], ["whatsapp"], ["email", "whatsapp"]
  messages?: SentMessage[];            // history of messages for this recommendation
  [key: string]: any;                  // keep backend flexibility
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

  // previously sent messages (all messages across recs)
  messages?: SentMessage[];
}

/* -------------------- Moral Clients -------------------- */
export interface ClientMoral {
  ref_personne: string;
  type: "moral";
  raison_sociale?: string;
  status: ClientStatus;
  rank?: number;

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

  // previously sent messages (all messages across recs)
  messages?: SentMessage[];
}

/* -------------------- Unified Type -------------------- */
export type Client = ClientPhysique | ClientMoral;
