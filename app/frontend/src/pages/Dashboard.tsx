import { useState, useEffect } from "react";
import ClientTable from "../components/ClientTable";
import { useAuth } from "../context/AuthContext";
import type { Client } from "../types/client";

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { token } = useAuth();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_LINK}/clients/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.detail || "Failed to fetch clients");
        }

        const data: Client[] = await res.json();
        setClients(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [token]);

  const updateClient = (u: Client) =>
    setClients(prev => prev.map(c => (c.ref_personne === u.ref_personne ? u : c)));

  const markMessaged = (ref: string) =>
    setClients(prev =>
      prev.map(c =>
        c.ref_personne === ref ? { ...c, lastContact: "whatsapp" } : c
      )
    );

  const physiques = clients.filter(c => c.type === "physique");
  const morals = clients.filter(c => c.type === "moral");

  if (loading) return <p>Loading clients...</p>;
  if (error) return <p className="text-red-600">{error}</p>;


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-red-600">Clients</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClientTable
          title="Client Physique"
          clients={physiques}
          onUpdateClient={updateClient}
          onMessageSent={markMessaged}
        />
        <ClientTable
          title="Client Moral"
          clients={morals}
          onUpdateClient={updateClient}
          onMessageSent={markMessaged}
        />
      </div>
    </div>
  );
}