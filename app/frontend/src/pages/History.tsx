import HistoryTable from "../components/HistoryTable";
import type { Client } from "../types/client";

export default function History() {
  const history: Client[] = [
    {
      ref_personne: "C001",
      name: "Yassine B.",
      type: "physique",
      rank: 1,
      status: "accepted",
      lastContact: "whatsapp",
      recommended_products: [
        {
          product: "Auto",
          status: "accepted",
          contacts: ["email"],
          messages: [
            {
              id: "m1",
              clientRef: "C001",
              channel: "email",
              content: "Bonjour Yassine, offre Auto disponible.",
              sentAt: new Date("2025-08-25T09:00:00").toISOString(),
            },
          ],
        },
        {
          product: "Retraite",
          status: "pending",
          contacts: ["whatsapp"],
          messages: [
            {
              id: "m2",
              clientRef: "C001",
              channel: "whatsapp",
              content: "Salut Yassine, avez-vous réfléchi à la Retraite ?",
              sentAt: new Date("2025-09-01T14:30:00").toISOString(),
            },
          ],
        },
      ],
    },
    {
      ref_personne: "C002",
      type: "moral",
      raison_sociale: "Acme Corp",
      status: "refused",
      rank: 2,
      lastContact: "email",
      recommended_products: [
        {
          product: "RC Pro",
          status: "refused",
          contacts: ["email"],
          messages: [
            {
              id: "m3",
              clientRef: "C002",
              channel: "email",
              content: "Bonjour, proposition RC Pro entreprise...",
              sentAt: new Date("2025-08-26T11:15:00").toISOString(),
            },
          ],
        },
        {
          product: "Multirisque",
          status: "refused",
          contacts: ["email", "whatsapp"],
          messages: [
            {
              id: "m4",
              clientRef: "C002",
              channel: "email",
              content: "Offre Multirisque envoyée par email.",
              sentAt: new Date("2025-08-27T10:00:00").toISOString(),
            },
            {
              id: "m5",
              clientRef: "C002",
              channel: "whatsapp",
              content: "Bonjour, voici un rappel Multirisque via WhatsApp.",
              sentAt: new Date("2025-08-28T15:45:00").toISOString(),
            },
          ],
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-red-600">History</h1>
      <HistoryTable history={history} />
    </div>
  );
}