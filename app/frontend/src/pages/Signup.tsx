import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

if (!name || !email || !password) {
    setError("All fields are required");
    setLoading(false);
    return;
  }

  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_LINK}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: name, email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.detail || "Registration failed";
      setError(msg);
      return;
    }

    navigate("/login");
  } catch (err) {
    console.error(err);
    setError("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-orange-600 via-red-500 to-pink-500">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="backdrop-blur-lg bg-white/20 p-8 rounded-2xl shadow-2xl w-[min(400px,92vw)]"
      >
        <h1 className="text-3xl font-bold text-center text-white mb-6">Create Account</h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none bg-white/80"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none bg-white/80"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none bg-white/80"
            required
          />

          {error && <p className="text-sm text-red-200">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-sm text-center mt-4 text-white/80">
          Already have an account?{" "}
          <Link to="/login" className="text-yellow-200 font-medium hover:underline">Login</Link>
        </p>
      </motion.div>
    </div>
  );
}