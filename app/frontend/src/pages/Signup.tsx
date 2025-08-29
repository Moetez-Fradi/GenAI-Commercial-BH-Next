import { useState } from "react";
import { Link } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: call FastAPI backend
    console.log("Signup with", name, email, password);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-orange-600 via-red-500 to-pink-500">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-[min(400px,92vw)]">
        <h1 className="text-2xl font-bold text-center text-orange-600 mb-6">Create Account</h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none"
            required
          />
          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700"
          >
            Sign Up
          </button>
        </form>
        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-red-600 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}