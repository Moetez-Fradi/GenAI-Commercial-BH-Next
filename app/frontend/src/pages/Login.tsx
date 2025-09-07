import type React from "react"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { motion } from "framer-motion"
import { Shield, Mail, Lock, Eye, EyeOff, LogIn, Sparkles } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!email || !password) {
      setError("Please provide email and password.")
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_LINK}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg = data?.detail || "Invalid credentials"
        setError(msg)
        return
      }

      const token = data?.access_token
      if (!token) {
        setError("No token received from server.")
        return
      }

      login(token)
      navigate("/dashboard/clients-morales")
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/40 to-slate-900" />
        
        {/* Floating elements */}
        <motion.div
          animate={{ 
            rotate: -360,
            scale: [1, 1.15, 1],
          }}
          transition={{ 
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute top-32 left-20 w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 blur-xl rotate-12"
        />
        <motion.div
          animate={{ 
            rotate: 360,
            y: [-15, 15, -15],
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            y: { duration: 7, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute top-40 right-32 w-36 h-36 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-2xl"
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Main Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.3, 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 15 
                }}
                className="relative inline-flex items-center justify-center w-20 h-20 mb-6"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl shadow-lg animate-pulse" />
                <div className="relative flex items-center justify-center w-full h-full">
                  <Shield className="w-10 h-10 text-white drop-shadow-lg" />
                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-pulse" />
                </div>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-4xl font-bold text-white mb-2"
              >
                Welcome Back
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-white/70 text-lg"
              >
                Access your premium dashboard
              </motion.p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300"
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-14 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300"
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-purple-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm"
                >
                  <p className="text-sm text-red-400 font-medium">{error}</p>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="mt-8 text-center"
            >
              <p className="text-white/70">
                Don't have an account?{" "}
                <Link 
                  to="/signup" 
                  className="text-purple-400 font-medium hover:text-purple-300 transition-colors hover:underline"
                >
                  Create Account
                </Link>
              </p>
            </motion.div>
          </div>

          {/* Security Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="mt-6 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-green-500/20 text-sm text-white/70">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Secure & Encrypted
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}