// AppSidebar.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Bot } from "lucide-react";

/**
 * Palette (used across the component)
 * - softBlue:   #2B6CB0
 * - slate:      #10243A
 * - ivory:      #F6F8FB
 * - steelGray:  #E6EDF5
 * - tealAccent: #2CA3A3
 * - amber:      #F6A623
 * - softRed:    #E04B4B
 * - green:      #1E9A61
 */

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Reports",
    url: "/unsafety",
    icon: Users,
  },
  {
    title: "Chatbot",
    url: "/chatbot",
    icon: Bot,
  },
];

export default function AppSidebar() {
  const [activePath, setActivePath] = useState<string>("/dashboard");
  const [mounted, setMounted] = useState(false);

  // set active path from current location (browser)
  useEffect(() => {
    setMounted(true);
    try {
      const path = window?.location?.pathname || "/dashboard";
      setActivePath(path);
    } catch {
      // SSR safe fallback
      setActivePath("/dashboard");
    }
  }, []);

  // small easing config reused
  const hoverAnim = useMemo(
    () => ({
      scale: 1.02,
      transition: { type: "spring", stiffness: 260, damping: 22 },
    }),
    []
  );

  // subtle entrance for sidebar content
  const containerVariants = {
    hidden: { opacity: 0, x: -8 },
    show: {
      opacity: 1,
      x: 0,
      transition: { staggerChildren: 0.03, delayChildren: 0.05 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, x: -6 },
    show: { opacity: 1, x: 0, transition: { duration: 0.28 } },
  };

  // helper to format aria label + microcopy for clarity
  const ariaLabel = (title: string, active: boolean) =>
    `${title}${active ? " (current page)" : ""}`;

  /* ------------------- Tip rotation logic ------------------- */
  const tips = [
    {
      title: "Focus on small wins",
      body: "Logging quick observations steadily builds momentum — aim for 3 small fixes per shift. DATTU will assist by suggesting priority actions.",
    },
    {
      title: "Be proactive, not reactive",
      body: "Use early alerts from DATTU’s analysis — preventing one potential incident is worth more than managing five after they happen.",
    },
    {
      title: "Keep your team involved",
      body: "Encourage team inputs on reported issues. Involving others reduces stress and spreads accountability — safety is a shared habit.",
    },
    {
      title: "Simplify your day",
      body: "Let DATTU handle repetitive reporting. You focus on insights, field observations, and leadership — that’s how efficiency grows.",
    },
  ];

  const DISPLAY_MS = 14000; // 14 seconds per tip for comfortable reading

  const [tipIndex, setTipIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        setTipIndex((prev) => (prev + 1) % tips.length);
      }
    }, DISPLAY_MS);
    return () => clearInterval(interval);
  }, [isPaused]);
  /* ----------------- End tip rotation logic ----------------- */

  return (
    <Sidebar className="bg-[#F6F8FB] border-r border-[#E6EDF5] shadow-sm">
      <SidebarContent className="gap-0 bg-[#F6F8FB] text-[#10243A]">
        {/* Header */}
        <SidebarGroup className="border-b border-[#E6EDF5] pb-4">
          <div className="px-3 py-5">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg shadow-md"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(44,163,163,1) 0%, rgba(43,108,176,1) 100%)",
                }}
                aria-hidden
              >
                <span className="text-sm font-bold text-white select-none">
                  D
                </span>
              </div>

              <div>
                <h1
                  className="text-lg font-semibold tracking-wide"
                  style={{ color: "#10243A" }}
                >
                  DATTU
                </h1>
                <div className="text-xs text-[#10243A]/60 -mt-0.5">
                  Safety AI Console
                </div>
              </div>
            </div>
          </div>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup className="px-0 bg-[#F6F8FB]">
          <SidebarGroupLabel className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#10243A]/70">
            Navigation
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <AnimatePresence>
              <motion.div
                className="px-2 py-2"
                initial="hidden"
                animate="show"
                variants={containerVariants}
              >
                <SidebarMenu className="gap-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      mounted &&
                      (activePath === item.url ||
                        activePath === item.url + "/");

                    return (
                      <motion.div key={item.title} variants={itemVariants}>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            // use relative class for active indicator
                            className={`group relative flex h-11 items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-200 focus:outline-none`}
                          >
                            <a
                              href={item.url}
                              aria-label={ariaLabel(item.title, isActive)}
                              aria-current={isActive ? "page" : undefined}
                              className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium
                                ${
                                  isActive
                                    ? "bg-gradient-to-r from-[#E6EDF5] to-[#F6F8FB] shadow-sm text-[#2B6CB0]"
                                    : "text-[#10243A] hover:bg-[#E6EDF5] hover:text-[#2B6CB0]"
                                }`}
                              // subtle animation on hover using framer-motion wrapper below
                            >
                              <motion.span
                                className="h-5 w-5 flex items-center justify-center shrink-0"
                                initial={{ opacity: 0.9 }}
                                whileHover={{ x: 3 }}
                                transition={{ type: "spring", stiffness: 200 }}
                              >
                                <Icon
                                  className={`h-4 w-4 ${
                                    isActive
                                      ? "text-[#2B6CB0]"
                                      : "text-[#2B6CB0]/90"
                                  }`}
                                />
                              </motion.span>

                              <span className="flex-1 text-lg">
                                {item.title}
                              </span>

                              {/* active left indicator */}
                              <div className="ml-2 flex items-center">
                                <div
                                  className={`h-2 w-2 rounded-full transition-all duration-250 ${
                                    isActive
                                      ? "bg-[#F6A623] opacity-100"
                                      : "opacity-0"
                                  }`}
                                  aria-hidden
                                />
                              </div>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </motion.div>
                    );
                  })}
                </SidebarMenu>
              </motion.div>
            </AnimatePresence>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tip / microcopy area — supportive tone, encourages learning */}
        <div
          className="mt-auto border-t border-[#E6EDF5] px-4 py-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-lg bg-[#E6EDF5]/50 p-4"
            role="note"
            aria-live="polite"
          >
            <p className="text-xs font-medium text-[#10243A] mb-2 flex items-center gap-1">
              💡 <span>Tip</span>
            </p>

            <div className="text-xs text-[#10243A]/80 leading-snug">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tipIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="space-y-1"
                >
                  <div className="font-semibold text-[#10243A] text-sm">
                    {tips[tipIndex].title}
                  </div>

                  <div className="text-xs text-[#10243A]/80 leading-relaxed">
                    {tips[tipIndex].body}
                  </div>

                  {/* progress bar - continuous */}
                  <div className="mt-2 h-1 w-full bg-[#D8E2EB] rounded-full overflow-hidden">
                    <motion.div
                      key={tipIndex + "-progress"}
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: DISPLAY_MS / 1000,
                        ease: "linear",
                      }}
                      className="h-1 bg-[#2B6CB0]"
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
