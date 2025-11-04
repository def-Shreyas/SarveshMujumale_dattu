"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { validateCredentials } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react"; // 👈 added

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👈 toggle state
  const [showConfirm, setShowConfirm] = useState(false); // 👈 for confirm field too
  const navigate = useNavigate();

  const login = () => {
    if (validateCredentials(username, password)) {
      localStorage.setItem("auth", "true");
      toast.success("✅ Welcome back, Safety Manager!");
      navigate("/dashboard");
    } else {
      toast.error("❌ Invalid credentials. Please try again.");
    }
  };

  const register = () => {
    if (!username || !password || !confirm) {
      toast.error("❌ Please fill all fields");
      return;
    }
    if (password !== confirm) {
      toast.error("⚠️ Passwords do not match");
      return;
    }
    localStorage.setItem("registeredUser", JSON.stringify({ username, password }));
    toast.success("🎉 Account created successfully");
    setMode("login");
  };

  const formVariant = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.95 },
  };

  return (
    <div
      className="h-screen flex justify-center items-center"
      style={{
        background:
          "linear-gradient(135deg, rgba(43,108,176,0.15) 0%, rgba(44,163,163,0.15) 100%)",
      }}
    >
      <motion.div
        className="bg-white/90 backdrop-blur-lg p-10 rounded-2xl shadow-2xl w-full max-w-md border border-[#E6EDF5]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* DATTU header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-center items-center gap-3 mb-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg shadow-md"
              style={{
                background:
                  "linear-gradient(135deg, rgba(44,163,163,1) 0%, rgba(43,108,176,1) 100%)",
              }}
            >
              <span className="text-lg font-bold text-white">D</span>
            </div>
            <h1 className="text-2xl font-bold text-[#10243A] tracking-wide">
              DATTU
            </h1>
          </div>
          <p className="text-sm text-[#10243A]/70">
            Your Safety AI — always ready to assist
          </p>
        </motion.div>

        {/* Login / Register form */}
        <AnimatePresence mode="wait">
          {mode === "login" ? (
            <motion.div
              key="login"
              variants={formVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-xl font-semibold text-center text-[#10243A] mb-4">
                Welcome Back 👋
              </h2>

              <Input
                placeholder="Username"
                className="mb-3"
                onChange={(e) => setUsername(e.target.value)}
              />

              {/* Password with eye icon */}
              <div className="relative mb-4">
                <Input
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#2B6CB0] transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 250, damping: 20 }}
                className="w-full bg-[#2B6CB0] text-white py-2 rounded-lg shadow-md"
                onClick={login}
              >
                Login
              </motion.button>

              <p className="text-sm text-center text-[#10243A]/60 mt-4">
                DATTU remembers your last session — stay safe, stay smart.
              </p>

              <div className="text-center mt-6">
                <button
                  onClick={() => setMode("register")}
                  className="text-[#2B6CB0] text-sm hover:underline"
                >
                  Don’t have an account? Register
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="register"
              variants={formVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-xl font-semibold text-center text-[#10243A] mb-4">
                Create Your Account 🛡️
              </h2>

              <Input
                placeholder="Username"
                className="mb-3"
                onChange={(e) => setUsername(e.target.value)}
              />

              {/* Password with eye icon */}
              <div className="relative mb-3">
                <Input
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#2CA3A3] transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Confirm Password with eye icon */}
              <div className="relative mb-4">
                <Input
                  placeholder="Confirm Password"
                  type={showConfirm ? "text" : "password"}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#2CA3A3] transition"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 250, damping: 20 }}
                className="w-full bg-[#2CA3A3] text-white py-2 rounded-lg shadow-md"
                onClick={register}
              >
                Register
              </motion.button>

              <p className="text-sm text-center text-[#10243A]/60 mt-4">
                DATTU ensures your data remains secure and private 🔒
              </p>

              <div className="text-center mt-6">
                <button
                  onClick={() => setMode("login")}
                  className="text-[#2B6CB0] text-sm hover:underline"
                >
                  Already registered? Login
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Background motion accents */}
      <motion.div
        className="absolute top-20 left-10 w-24 h-24 rounded-full bg-[#2B6CB0]/10 blur-2xl"
        animate={{ y: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-[#2CA3A3]/10 blur-2xl"
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
      />
    </div>
  );
}
