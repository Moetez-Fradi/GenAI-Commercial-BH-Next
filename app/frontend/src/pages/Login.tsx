import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

if (!email || !password) {
    setError("Please provide email and password.");
    setLoading(false);
    return;
  }

  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_LINK}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.detail || "Invalid credentials";
      setError(msg);
      return;
    }

    // success
    const token = data?.access_token;
    if (!token) {
      setError("No token received from server.");
      return;
    }

    login(token);
    navigate("/Dashboard");
  } catch (err) {
    console.error(err);
    setError("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-600 via-orange-500 to-yellow-400">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="backdrop-blur-lg bg-white/20 p-8 rounded-2xl shadow-2xl w-[min(400px,92vw)]"
      >
        <h1 className="text-3xl font-bold text-center text-white mb-6">GENAI Dashboard</h1>

        <form onSubmit={handleLogin} className="space-y-4">
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
            className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-sm text-center mt-4 text-white/80">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-yellow-200 font-medium hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}