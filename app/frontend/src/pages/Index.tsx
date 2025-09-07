// pages/Index.tsx
import { motion } from "framer-motion"
import { Shield, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background (same style as login) */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/40 to-slate-900" />
        
        {/* Floating glow elements */}
        <motion.div
          animate={{ rotate: -360, scale: [1, 1.15, 1] }}
          transition={{ 
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            scale: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute top-32 left-20 w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 blur-xl"
        />
        <motion.div
          animate={{ rotate: 360, y: [-15, 15, -15] }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            y: { duration: 7, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute top-40 right-32 w-36 h-36 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-2xl"
        />
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {/* Logo / Icon */}
        <motion.div
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
          className="relative inline-flex items-center justify-center w-24 h-24 mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-3xl shadow-lg animate-pulse" />
          <div className="relative flex items-center justify-center w-full h-full">
            <Shield className="w-12 h-12 text-white drop-shadow-lg" />
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-300 via-cyan-300 to-purple-300 bg-clip-text text-transparent"
        >
          Premium Insurance Platform
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-lg text-white/70 mb-12 max-w-2xl mx-auto"
        >
          Experience the future of insurance management with our extraordinary platform
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/signup"
            className="px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 transition-all duration-300 flex items-center gap-3 text-lg shadow-lg"
          >
            Get Started
          </Link>

          <Link
            to="/login"
            className="px-8 py-4 rounded-xl font-semibold text-white/90 bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center gap-3 text-lg"
          >
            Sign In
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

export default Index