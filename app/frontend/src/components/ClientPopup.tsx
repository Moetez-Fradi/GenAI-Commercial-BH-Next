import type { Client, ClientPhysique, ClientMoral } from "../types/client";

interface Props {
  client: Client;
  clientPhysique?: ClientPhysique;
  clientMoral?: ClientMoral;
  onClose: () => void;
}

export default function ClientPopup({ client, clientPhysique, clientMoral, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6 w-1/3 text-white">
        <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Client Details</h2>
        <div className="space-y-4">
          <p><span className="text-white/50 font-medium">Ref:</span> <span className="text-purple-400">{client.ref_personne}</span></p>
          <p><span className="text-white/50 font-medium">Name:</span> <span className="text-white">{clientPhysique?.name || clientMoral?.raison_sociale || "N/A"}</span></p>
          <p><span className="text-white/50 font-medium">Type:</span> <span className="text-cyan-400">{client.type}</span></p>
          <p><span className="text-white/50 font-medium">Rank:</span> <span className="text-white">{client.rank}</span></p>
          <p><span className="text-white/50 font-medium">Status:</span> <span className="text-white">{client.status}</span></p>
        </div>
        <button
          className="mt-6 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-700 hover:to-cyan-700 transition-all duration-300 shadow-lg"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}