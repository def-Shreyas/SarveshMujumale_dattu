"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { validateCredentials } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Image import
import DattuImage from "/hii dattu.png";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const { login } = useAuth();

  const handleLogin = () => {
    if (validateCredentials(username, password)) {
      login();
      toast.success("✅ Welcome back, Safety Manager!");
      navigate("/");
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
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const primaryNavy = "#0B3D91";
  const accentTeal = "#00A79D";

  return (
    <div
      className="h-screen flex justify-center items-center p-4 md:p-8"
      style={{
        background: `linear-gradient(135deg, ${primaryNavy}1A 0%, ${accentTeal}1A 100%)`,
      }}
    >
      <motion.div
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
      >
        {/* ==================================================== 
             LEFT COLUMN: DATTU IMAGE + HELLO TEXT
           ==================================================== */}
        <motion.div
          className="flex flex-col justify-center items-center text-center p-8"
          style={{
            background: `linear-gradient(180deg, ${primaryNavy} 0%, ${accentTeal} 100%)`,
          }}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* DATTU IMAGE */}
          <motion.img
            src={DattuImage}
            alt="Dattu AI welcomes you"
            className="w-1/2 max-w-[180px] h-auto mb-4 drop-shadow-xl rounded-lg"
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
          />

          {/* Text Below */}
          <div className="text-white">
            <h1 className="text-2xl font-bold tracking-tight">Hello, I’m Dattu 👋</h1>
            <p className="text-sm mt-2 opacity-90 font-medium">
              Your Expertise Matters
            </p>
          </div>
        </motion.div>

        {/* ==================================================== 
             RIGHT COLUMN: LOGIN FORM 
           ==================================================== */}
        <div className="p-8 lg:p-10 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.div
                key="login"
                variants={formVariant}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-extrabold text-[#10243A] mb-2">
                  Sign In to Co-Pilot
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Access your Executive Safety Dashboard.
                </p>

                <Input
                  placeholder="Username"
                  className="mb-4 h-10 text-base"
                  onChange={(e) => setUsername(e.target.value)}
                />

                {/* Password with eye icon */}
                <div className="relative mb-5">
                  <Input
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 h-10 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <motion.button
                  whileHover={{
                    scale: 1.01,
                    boxShadow: "0 4px 15px rgba(11, 61, 145, 0.4)",
                  }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full bg-[#0B3D91] text-white py-2.5 rounded-xl text-base font-semibold transition-colors duration-300 shadow-lg"
                  onClick={handleLogin}
                >
                  <Zap className="inline mr-2 h-4 w-4" /> Access Dashboard
                </motion.button>

                <div className="text-center mt-5">
                  <button
                    onClick={() => setMode("register")}
                    className="text-sm hover:underline text-gray-600"
                  >
                    Don’t have an account? Register
                  </button>
                </div>
              </motion.div>
            ) : (
// --- Register Form ---
<motion.div
  key="register"
  variants={formVariant}
  initial="hidden"
  animate="visible"
  exit="exit"
  transition={{ duration: 0.3 }}
>
  <h2 className="text-2xl font-extrabold text-[#10243A] mb-2">
    Create Account 🛡️
  </h2>
  <p className="text-sm text-gray-500 mb-6">
    Registration is typically handled by HR/IT.
  </p>

  {/* New Name Input */}
  <Input
    placeholder="Full Name"
    className="mb-3 h-10 text-base"
    onChange={(e) => console.log("Name:", e.target.value)} // replace with state if needed
  />

  <Input
    placeholder="Username"
    className="mb-3 h-10 text-base"
    onChange={(e) => setUsername(e.target.value)}
  />

  <div className="relative mb-3">
    <Input
      placeholder="Password"
      type={showPassword ? "text" : "password"}
      onChange={(e) => setPassword(e.target.value)}
      className="pr-10 h-10 text-base"
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>

  <div className="relative mb-5">
    <Input
      placeholder="Confirm Password"
      type={showConfirm ? "text" : "password"}
      onChange={(e) => setConfirm(e.target.value)}
      className="pr-10 h-10 text-base"
    />
    <button
      type="button"
      onClick={() => setShowConfirm(!showConfirm)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
    >
      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>

  <motion.button
    whileHover={{
      scale: 1.01,
      boxShadow: "0 4px 15px rgba(0, 167, 157, 0.4)",
    }}
    whileTap={{ scale: 0.99 }}
    className="w-full bg-[#00A79D] text-white py-2.5 rounded-xl text-base font-semibold transition-colors duration-300 shadow-lg"
    onClick={register}
  >
    Register (Mock)
  </motion.button>

  <div className="text-center mt-5">
    <button
      onClick={() => setMode("login")}
      className="text-sm hover:underline"
      style={{ color: primaryNavy }}
    >
      Already registered? Sign In
    </button>
  </div>
</motion.div>

            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
