// src/components/Header.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2, User, Sparkles, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useApiUsage } from "@/contexts/ApiUsageContext";
import { motion } from "framer-motion";
import { toast } from "sonner";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import DattuLogo from "/logo dattu.png";

interface HeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { logout, user } = useAuth();
  const { apiLimit, apiUsed, remainingApi, moduleUsage } = useApiUsage();
  const navigate = useNavigate();

  // const handleLogout = () => {
  //   logout();
  //   navigate("/login");
  // };

  const handleAskDattu = () => {
    toast.info("Coming Soon!", {
      description: "DATTU AI Assistant is getting ready to help you.",
      duration: 3000,
    });
  };

  const usagePercentage = (apiUsed / apiLimit) * 100;
  const getUsageColor = () => {
    if (usagePercentage > 90) return "bg-red-500";
    if (usagePercentage > 75) return "bg-orange-500";
    return "bg-gradient-to-r from-[#00A79D] to-[#0B3D91]";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center border-b bg-white/80 backdrop-blur-md px-4 md:px-6 shadow-sm transition-all duration-300">
      {/* Left: Toggle + DATTU logo */}
      <div
        className={cn(
          "flex items-center gap-2 pr-4 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[80px]" : "w-[260px]"
        )}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 focus:outline-none"
        >
          <img src={DattuLogo} alt="DATTU" className="h-10 w-10 drop-shadow-md" />
        </motion.button>
      </div>

      {/* Center: Spacer */}
      <div className="flex-1" />

      {/* Right: Actions */}
      <div className="flex items-center gap-6">
        {/* API Usage Indicator */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                className="hidden lg:flex flex-col items-end cursor-help"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-3 w-3 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    API Limit
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <div className="w-32 h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      className={cn("h-full rounded-full shadow-sm", getUsageColor())}
                      initial={{ width: 0 }}
                      animate={{ width: `${usagePercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700 tabular-nums">
                    {remainingApi.toLocaleString()} <span className="text-gray-400 font-normal">left</span>
                  </span>
                </div>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="p-3" side="bottom" align="end">
              <div className="text-xs font-semibold text-gray-700">
                <span className="block mb-1">API Calls</span>
                <div className="space-y-1">
                  {Object.entries(moduleUsage)
                    .filter(([module]) => module !== "Dashboard")
                    .map(([module, count]) => (
                      <div key={module} className="flex justify-between text-sm">
                        <span className="text-gray-600">{module}</span>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Ask DATTU Button */}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(11, 61, 145, 0.2)" }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAskDattu}
          className="hidden md:flex items-center gap-2 bg-gradient-to-r from-[#0B3D91] to-[#1e4b9e] text-white px-5 py-2.5 rounded-full font-semibold shadow-md hover:shadow-lg transition-all group"
        >
          <Sparkles className="h-4 w-4 text-yellow-300 group-hover:animate-pulse" />
          <span>Ask DATTU</span>
        </motion.button>
      </div>
    </header>
  );
};