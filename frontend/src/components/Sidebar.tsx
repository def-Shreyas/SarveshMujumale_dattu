import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion"; // <-- 1. IMPORTED FRAMER MOTION
import { ScrollArea } from "@/components/ui/scroll-area"; // <-- 2. IMPORTED SCROLL AREA

// Import Lucide icons
import {
  LayoutDashboard,
  ShieldAlert,
  FileText,
  Users,
  CheckSquare,
  HeartPulse,
  HardHat,
  Target,
  Leaf,
  Building,
  MessageSquare,
  Settings,
  Eye,
} from "lucide-react";

// Import your Dattu image
import DattuAvatar from "/logo dattu.png"; // Make sure this path is correct

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "AI Vision Report", href: "/unsafety", icon: Eye },
  { name: "Permit-to-Work (PTW)", href: "/ptw", icon: FileText },
  { name: "Inspections & Audits", href: "/audits", icon: CheckSquare },
  { name: "Medical & First-Aid", href: "/medical", icon: HeartPulse },
  { name: "Incidents & Near-Misses", href: "/incidents", icon: ShieldAlert },
  { name: "Training & Competency", href: "/training", icon: Users },
  { name: "Assets & PPE Management", href: "/ppe", icon: HardHat },
  { name: "Corrective Actions & RCA", href: "/rca", icon: Target },
  { name: "Environmental & Resource", href: "/environmental", icon: Leaf },
  { name: "Social & Governance", href: "/governance", icon: Building },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isCollapsed: boolean;
}

// Animation for the text
const textVariant = {
  hidden: { opacity: 0, width: 0, x: -10, transition: { duration: 0.1 } },
  visible: { opacity: 1, width: "auto", x: 0, transition: { duration: 0.2, delay: 0.1 } },
};

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    // 3. Replaced <aside> with <motion.aside>
    <motion.aside
      className={cn(
        // 4. KEPT YOUR NAVY BLUE BACKGROUND
        "fixed top-16 left-0 z-40 h-[calc(100vh-64px)] border-r border-blue-900 bg-[#0B3D91] text-white"
      )}
      // 5. Animate the width property for a smooth collapse
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ 
        type: "spring",
        stiffness: 400, 
        damping: 40 
      }}
    >
      <div className="flex h-full flex-col p-4">
        
        {/* 6. ADDED SMOOTH SCROLLER */}
        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-1 pr-2"> {/* pr-2 adds space for scrollbar */}
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                // 7. ADDED MOTION WRAPPER
                <motion.div
                  key={item.name}
                  whileHover={{ x: isCollapsed ? 0 : 5 }} // Nudges on hover
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Link
                    to={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-200 transition-all hover:bg-white/10",
                      isActive && "bg-white/20 text-white shadow-inner",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isActive && "text-[#00A79D]" // Accent teal for active icon
                      )}
                    />
                    {/* 8. THIS IS THE SMOOTH FADE FOR TEXT */}
                    <motion.span
                      className="overflow-hidden whitespace-nowrap"
                      variants={textVariant}
                      animate={isCollapsed ? "hidden" : "visible"}
                    >
                      {item.name}
                    </motion.span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* 9. UPGRADED "ASK DATTU" BUTTON */}
        <div className="mt-auto pt-4"> 
          <motion.div 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.98 }}
            title={isCollapsed ? "Ask DATTU" : undefined}
          >
            <Button
              variant="outline" 
              className={cn(
                // White button, Navy text
                "w-full gap-3 border-2 border-[#0B3D91] bg-white text-[#0B3D91] text-base font-semibold transition-all duration-200 shadow-md",
                "hover:bg-gray-100 hover:shadow-lg", 
                isCollapsed ? "justify-center" : "justify-start"
              )}
              size="lg"
            >
              {/* Avatar with "bouncy" hover */}
              <motion.div 
                className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border-2 border-[#0B3D91]"
                whileHover={{ rotate: [0, 10, -5, 0], scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <img
                  src={DattuAvatar}
                  alt="Dattu Assistant"
                  className="h-full w-full object-cover"
                />
              </motion.div>
              
              {/* Animated text that fades smoothly */}
              <motion.span
                className="overflow-hidden whitespace-nowrap"
                variants={textVariant}
                animate={isCollapsed ? "hidden" : "visible"}
              >
                Ask DATTU
              </motion.span>
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.aside>
  );
};