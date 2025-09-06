import type React from "react"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Shield, Mail, Lock, User, Eye, EyeOff, CheckCircle } from "lucide-react"

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-16 right-24 w-28 h-28 bg-green-200/30 rounded-full blur-xl animate-pulse"></div>
        <div
          className="absolute top-32 left-16 w-36 h-36 bg-emerald-300/25 rounded-full blur-2xl animate-bounce"
          style={{ animationDelay: "0.8s" }}
        ></div>
        <div
          className="absolute bottom-40 right-16 w-32 h-32 bg-lime-200/35 rounded-full blur-lg animate-pulse"
          style={{ animationDelay: "1.2s" }}
        ></div>
        <div
          className="absolute bottom-16 left-24 w-24 h-24 bg-green-300/40 rounded-full blur-xl animate-bounce"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-2/3 right-8 w-20 h-20 bg-emerald-200/30 rounded-full blur-lg animate-pulse"
          style={{ animationDelay: "0.3s" }}
        ></div>
        <div
          className="absolute top-1/4 left-8 w-40 h-40 bg-lime-300/20 rounded-full blur-2xl animate-bounce"
          style={{ animationDelay: "2.5s" }}
        ></div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-5"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-xl border border-green-200/50 rounded-2xl shadow-2xl shadow-green-500/10 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl mb-4 shadow-lg shadow-green-500/25"
            >
              <Shield className="w-8 h-8 text-white drop-shadow-sm" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join our insurance platform today</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-600" />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-600" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-600" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-green-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicators */}
              {password && (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle
                      className={`w-4 h-4 ${passwordStrength.hasLength ? "text-green-600" : "text-gray-400"}`}
                    />
                    <span className={passwordStrength.hasLength ? "text-green-600" : "text-gray-500"}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle
                      className={`w-4 h-4 ${passwordStrength.hasUpper ? "text-green-600" : "text-gray-400"}`}
                    />
                    <span className={passwordStrength.hasUpper ? "text-green-600" : "text-gray-500"}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle
                      className={`w-4 h-4 ${passwordStrength.hasLower ? "text-green-600" : "text-gray-400"}`}
                    />
                    <span className={passwordStrength.hasLower ? "text-green-600" : "text-gray-500"}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle
                      className={`w-4 h-4 ${passwordStrength.hasNumber ? "text-green-600" : "text-gray-400"}`}
                    />
                    <span className={passwordStrength.hasNumber ? "text-green-600" : "text-gray-500"}>One number</span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-green-600 font-medium hover:text-green-700 transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center"
        >
        </motion.div>
      </motion.div>
    </div>
  )
}