"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Zap, Lightbulb, ShieldCheck, Heart, Users, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils"; // <-- Import 'cn' is included

// Import your Dattu image (make sure it's in /public/dattu-namaste.png)
import DattuImage from "/Dattu Namaste Gesture.jpg"; 

const safetyTips = [
  {
    icon: ShieldCheck,
    text: "A strong safety culture starts at the top. Your visible leadership saves lives.",
  },
  {
    icon: Lightbulb,
    text: "Proactive safety (finding risks) is always more effective than reactive safety (fixing accidents).",
  },
  {
    icon: Users,
    text: "The best safety insights come from your frontline workers. Listen to them.",
  },
  {
    icon: TrendingUp,
    text: "What gets measured gets managed. Use your data to drive safety decisions.",
  },
  {
    icon: Heart,
    text: "Safety is not a cost. It is an investment in your most valuable asset: your people.",
  }
];

// --- Animation Variants ---
const formContainerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3, 
      staggerChildren: 0.1, 
    },
  },
};

const formItemVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};
// ---

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false); 
  const [currentTipIndex, setCurrentTipIndex] = useState(0); 
  const navigate = useNavigate();

  const { login, isAuthenticated } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // --- Auth Logic ---
  useEffect(() => {
    if (isAuthenticated) {
      toast.success("✅ Welcome back!");
      navigate("/"); 
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, []); 

  // --- Tip Rotator Logic ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % safetyTips.length);
    }, 8000); // Rotates every 8 seconds
    return () => clearInterval(timer);
  }, []);


  // --- Full-Stack Login Function ---
  const handleLogin = async () => {
    if (!termsAccepted) {
      toast.error("Please accept the terms and data privacy policy to continue.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Invalid credentials");
      }
      login(data.user, data.access_token);
    } catch (error: any) {
      console.error("Login failed:", error);
      toast.error(`❌ ${error.message || "Login failed. Please try again."}`);
    }
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
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
      >
        {/* ==================================================== 
             LEFT COLUMN: DATTU IMAGE + GREETING + TIPS
           ==================================================== */}
        <motion.div
          className="flex flex-col justify-between text-center p-8 md:p-12"
          style={{
            background: `linear-gradient(180deg, ${primaryNavy} 0%, ${accentTeal} 100%)`,
          }}
          variants={formContainerVariant}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Top Section: Dattu + Greeting */}
          <div>
            <motion.div
              className="w-full flex justify-center"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
            >
              <img
                src={DattuImage}
                alt="Dattu AI welcomes you with a Namaste gesture"
                className="w-1/2 max-w-[200px] h-auto drop-shadow-xl" 
              />
            </motion.div>
            <div className="text-white mt-6">
              <motion.h1 
                className="text-3xl font-bold tracking-tight"
                variants={formItemVariant}
              >
                Namaskar, I’m DATTU
              </motion.h1>
              <motion.p 
                className="text-xl mt-1 opacity-90 font-light"
                variants={formItemVariant}
              >
                Your Safety AI Assistant
              </motion.p>
            </div>
          </div>
          
          {/* Bottom Section: Tips Box */}
          <motion.div
            className="mt-10 z-10 p-4 bg-white/10 rounded-lg text-white text-left"
            variants={formItemVariant}
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-yellow-300" />
              <h3 className="font-semibold text-lg">Safety Tip for Leaders</h3>
            </div>
            
            <div className="relative h-20"> {/* Container to hold rotating tips */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTipIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="absolute w-full"
                >
                  <p className="italic text-base font-light">
                    "{safetyTips[currentTipIndex].text}"
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* --- 8-SECOND PROGRESS BAR --- */}
            <div className="w-full bg-white/20 rounded-full h-1 mt-4 overflow-hidden">
              <AnimatePresence>
                <motion.div
                  key={currentTipIndex} // This key forces it to remount
                  className="h-1 bg-white rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 8, ease: "linear" }} // 8-second duration
                />
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>

        {/* ==================================================== 
             RIGHT COLUMN: LOGIN FORM (WITH MODALS)
           ==================================================== */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <motion.div
            key="login"
            variants={formContainerVariant}
            initial="hidden"
            animate="visible"
          >
            <motion.h2 
              className="text-3xl font-extrabold text-[#10243A] mb-2"
              variants={formItemVariant}
            >
              Sign in to DATTU 
            </motion.h2>
            <motion.p 
              className="text-sm text-gray-500 mb-6"
              variants={formItemVariant}
            >
              Access your Executive Safety Dashboard.
            </motion.p>

            <motion.div variants={formItemVariant}>
              <Label htmlFor="username">Username</Label>
              <motion.div whileHover={{ scale: 1.02 }}>
                <Input
                  id="username"
                  placeholder="e.g., admin"
                  className="mb-4 h-11 text-base"
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </motion.div>
            </motion.div>

            <motion.div variants={formItemVariant}>
              <Label htmlFor="password">Password</Label>
              <motion.div whileHover={{ scale: 1.02 }} className="relative mb-5">
                <Input
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 h-11 text-base"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </motion.div>
            </motion.div>

            {/* --- T&C Checkbox with Modals --- */}
            <motion.div className="mb-5" variants={formItemVariant}>
              {/* Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={termsAccepted}
                  // @ts-ignore
                  onCheckedChange={setTermsAccepted}
                />
                <Label htmlFor="terms" className="text-sm font-medium text-gray-600">
                  I agree to the terms below.
                </Label>
              </div>
              
              {/* Links (Separated from Label to fix bug) */}
              <div className="text-sm text-gray-600 mt-2 ml-6 space-x-2">
                {/* --- T&C Modal --- */}
                <Dialog>
                  <DialogTrigger asChild>
                    <span className="text-blue-600 hover:underline cursor-pointer font-semibold">
                      Terms & Conditions
                    </span>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Terms & Conditions</DialogTitle>
                      <DialogDescription>
                        Last Updated: {new Date().toLocaleDateString()}
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] p-4 border rounded-md">
                      {/* --- FIXED: Replaced <pre> with <p> and <ul> for readability --- */}
                      <h3 className="font-bold text-lg">1. Use of the Platform</h3>
                      <p>You agree to use DATTU only for lawful purposes related to workplace safety, training, compliance, and analysis. You must not misuse the platform, reverse-engineer the code, attempt to bypass security controls, or interfere with service operations.</p>
                      
                      <h3 className="font-bold text-lg mt-4">2. User Accounts</h3>
                      <p>You are responsible for maintaining the confidentiality of your login credentials. Any activity under your account is considered your responsibility.</p>
                      
                      <h3 className="font-bold text-lg mt-4">3. Intellectual Property</h3>
                      <p>DATTU, its algorithms, AI models, workflows, and UI/UX are the exclusive intellectual property of [Your Company Name]. You receive a non-transferable, limited license to use the software for internal business purposes only.</p>
                      
                      <h3 className="font-bold text-lg mt-4">4. Data Usage & Ownership</h3>
                      <p>You retain ownership of all files and data you upload ("Customer Data"). By uploading data, you grant us a restricted license to process it solely for:</p>
                      <ul className="list-disc pl-6">
                        <li>Providing AI insights</li>
                        <li>Generating reports</li>
                        <li>Improving platform functionality</li>
                      </ul>
                      <p>We do **not** use your data to train generalized models without explicit permission.</p>
                      
                      <h3 className="font-bold text-lg mt-4">5. Limitation of Liability</h3>
                      <p>To the fullest extent permitted by law, DATTU and [Your Company Name] shall not be liable for any loss of data, business interruption, lost profits, or indirect damages. You use the platform **at your own risk**.</p>
                      
                      <h3 className="font-bold text-lg mt-4">6. Governing Law</h3>
                      <p>These Terms shall be governed under the jurisdiction of [Your Jurisdiction, e.g., Maharashtra, India].</p>
                      
                      <h3 className="font-bold text-lg mt-4">7. Contact</h3>
                      <p>For any questions about these Terms, please contact us at <a href="mailto:info.dattu@gurumaulient.in" className="text-blue-600 underline">info.dattu@gurumaulient.in</a>.</p>
                    </ScrollArea>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button">Close</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <span className="text-gray-300">|</span>

                {/* --- Privacy Policy Modal --- */}
                <Dialog>
                  <DialogTrigger asChild>
                    <span className="text-blue-600 hover:underline cursor-pointer font-semibold">
                      Data Privacy Policy
                    </span>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Data Privacy Policy (DPA Summary)</DialogTitle>
                      <DialogDescription>
                        How we process and protect your data.
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] p-4 border rounded-md">
                      <h3 className="font-bold text-lg">1. Data Controller vs. Processor</h3>
                      <p>You are the **Data Controller**. You own the data. We, [Your Company Name], are the **Data Processor**. We process data only on your instructions.</p>
                      
                      <h3 className="font-bold text-lg mt-4">2. Data We Process</h3>
                      <p>We process data you provide, including: Employee names, incident reports, audit forms, training records, and uploaded files (Excel, CSVs). This data is stored securely in our MongoDB database.</p>
                      
                      <h3 className="font-bold text-lg mt-4">3. Security Measures</h3>
                      <p>We implement industry-standard security measures, including:</p>
                      <ul className="list-disc pl-6">
                        <li>Data encryption at rest and in transit (SSL).</li>
                        <li>Strict role-based access control.</li>
                        <li>Secure API authentication (JWT).</li>
                        <li>Regular security audits and vulnerability scanning.</li>
                      </ul>

                      <h3 className="font-bold text-lg mt-4">4. Use of AI (Gemini)</h3>
                      <p>To provide AI-generated reports (like in the "AI Vision Report" module), we send a summarized, anonymized version of your data to the Google Gemini API. Your raw data files *never* leave our secure environment. Google does not use your data for training their models.</p>
                      
                      <h3 className="font-bold text-lg mt-4">5. Your Rights</h3>
                      <p>You have the right to access, amend, and delete your data. Upon contract termination, all your data will be permanently deleted from our systems within 30 days.</p>
                      
                      <h3 className="font-bold text-lg mt-4">6. Contact</h3>
                      <p>For any data privacy questions, please contact our Data Protection Officer at <a href="mailto:info.dattu@gurumaulient.in" className="text-blue-600 underline">info.dattu@gurumaulient.in</a>.</p>
                    </ScrollArea>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button">Close</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <span className="text-gray-300">|</span>

                {/* --- Enterprise Compliance Modal --- */}
                <Dialog>
                  <DialogTrigger asChild>
                    <span className="text-blue-600 hover:underline cursor-pointer font-semibold">
                      Enterprise Compliance
                    </span>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Enterprise-Grade Compliance</DialogTitle>
                      <DialogDescription>
                        Our commitment to data protection, security, and reliability.
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] p-4 border rounded-md">
                      <h3 className="font-bold text-lg text-gray-800">Data Protection Standards</h3>
                      <ul className="list-disc pl-5 text-sm space-y-1 mt-2 text-gray-700">
                        <li>✔ GDPR compliant (Article 5, 6, 28)</li>
                        <li>✔ CCPA + CPRA compliant</li>
                        <li>✔ SOC-2 aligned operational practices</li>
                        <li>✔ Data encrypted at rest and in transit</li>
                        <li>✔ Zero data training without explicit customer consent</li>
                        <li>✔ Role-based access controls</li>
                      </ul>

                      <h3 className="font-bold text-lg text-gray-800 mt-4">Data Residency & Isolation</h3>
                      <ul className="list-disc pl-5 text-sm space-y-1 mt-2 text-gray-700">
                        <li>All customer data is isolated per organization.</li>
                        <li>Dedicated environments available for enterprise clients.</li>
                        <li>Flexible data locality options.</li>
                      </ul>
                      
                      <h3 className="font-bold text-lg text-gray-800 mt-4">Security Architecture</h3>
                      <ul className="list-disc pl-5 text-sm space-y-1 mt-2 text-gray-700">
                        <li>Multi-layered cloud security</li>
                        <li>Strict access governance</li>
                        <li>Continuous monitoring and audit logs</li>
                        <li>Secure API interactions</li>
                        <li>Enforced MFA for enterprise accounts</li>
                      </ul>
                    </ScrollArea>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button">Close</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>
            {/* --- END OF FIX --- */}

            {/* --- Login Button with disabled logic --- */}
            <motion.div variants={formItemVariant}>
              <motion.button
                whileHover={{
                  scale: termsAccepted ? 1.01 : 1, 
                  boxShadow: termsAccepted ? "0 4px 15px rgba(11, 61, 145, 0.4)" : "none",
                }}
                whileTap={{ scale: termsAccepted ? 0.99 : 1 }}
                className={cn(
                  "w-full text-white py-3 rounded-xl text-base font-semibold transition-all duration-300 shadow-lg",
                  termsAccepted 
                    ? "bg-[#0B3D91] cursor-pointer" 
                    : "bg-gray-400 cursor-not-allowed opacity-70"
                )}
                onClick={handleLogin}
                disabled={!termsAccepted} // <-- Button is disabled
              >
                <Zap className="inline mr-2 h-4 w-4" /> Access Dashboard
              </motion.button>
            </motion.div>
            
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}