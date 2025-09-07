import type React from "react"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Shield, Mail, Lock, User, Eye, EyeOff, CheckCircle, Sparkles, Star } from "lucide-react"

export default function Signup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const passwordStrength = {
    hasLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  }

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!name || !email || !password) {
      setError("All fields are required")
      setLoading(false)
      return
    }

    if (!isPasswordStrong) {
      setError("Please ensure your password meets all requirements")
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_LINK}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, email, password }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg = data?.detail || "Registration failed"
        setError(msg)
        return
      }

      navigate("/login")
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
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            rotate: { duration: 30, repeat: Infinity, ease: "linear" },
            scale: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute top-20 left-16 w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 blur-xl"
        />
        <motion.div
          animate={{ 
            rotate: -360,
            y: [-20, 20, -20],
          }}
          transition={{ 
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            y: { duration: 8, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute bottom-32 right-20 w-40 h-40 rounded-2xl bg-gradient-to-br from-purple-500/25 to-pink-500/25 blur-2xl"
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
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.3, 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 15 
                }}
                className="relative inline-flex items-center justify-center w-20 h-20 mb-6"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl shadow-lg animate-pulse" />
                <div className="relative flex items-center justify-center w-full h-full">
                  <Shield className="w-10 h-10 text-white drop-shadow-lg" />
                </div>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-4xl font-bold text-white mb-2"
              >
                Create Account
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-white/70 text-lg"
              >
                Join our premium platform today
              </motion.p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignup} className="space-y-6">
              {/* Name Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
                    required
                  />
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-400" />
                </div>
              </motion.div>

              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
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
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-400" />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-14 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-cyan-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicators */}
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2 mt-3"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle
                        className={`w-4 h-4 transition-colors ${passwordStrength.hasLength ? "text-green-400" : "text-white/40"}`}
                      />
                      <span className={`transition-colors ${passwordStrength.hasLength ? "text-green-400" : "text-white/60"}`}>
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle
                        className={`w-4 h-4 transition-colors ${passwordStrength.hasUpper ? "text-green-400" : "text-white/40"}`}
                      />
                      <span className={`transition-colors ${passwordStrength.hasUpper ? "text-green-400" : "text-white/60"}`}>
                        One uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle
                        className={`w-4 h-4 transition-colors ${passwordStrength.hasLower ? "text-green-400" : "text-white/40"}`}
                      />
                      <span className={`transition-colors ${passwordStrength.hasLower ? "text-green-400" : "text-white/60"}`}>
                        One lowercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle
                        className={`w-4 h-4 transition-colors ${passwordStrength.hasNumber ? "text-green-400" : "text-white/40"}`}
                      />
                      <span className={`transition-colors ${passwordStrength.hasNumber ? "text-green-400" : "text-white/60"}`}>
                        One number
                      </span>
                    </div>
                  </motion.div>
                )}
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
                transition={{ delay: 1.0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-8 text-center"
            >
              <p className="text-white/70">
                Already have an account?{" "}
                <Link 
                  to="/login" 
                  className="text-cyan-400 font-medium hover:text-cyan-300 transition-colors hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </motion.div>
          </div>

          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-6 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-blue-500/20 text-sm text-white/70">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Trusted & Secure Platform
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}