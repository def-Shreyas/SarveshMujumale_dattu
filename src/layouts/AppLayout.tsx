"use client";

import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Settings, LogOut, User, ChevronDown } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-24 shrink-0 items-center justify-between border-b border-[#E6EDF5] bg-[#F6F8FB] px-8 shadow-sm sticky top-0 z-40">
          {/* Left Section: Sidebar Trigger + Motivational Message */}
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1 text-[#10243A]" />

            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-xl font-semibold text-[#10243A] leading-tight">
                Hello, Safety Manager!
              </h1>
              <p className="text-sm text-[#10243A]/70 mt-1">
                “Your vigilance saves lives — DATTU’s here to make it easier.”
              </p>
            </motion.div>
          </div>

          {/* Right Section: User Info */}
          <div className="relative">
            <button
              className="flex items-center gap-3 focus:outline-none"
              onClick={() => setShowDropdown((prev) => !prev)}
            >
              {/* Greeting */}
              <div className="flex flex-col items-end text-right">
                <span className="text-sm font-semibold text-[#10243A] leading-tight">
                  Hello, Admin
                </span>
                <span className="text-xs text-[#10243A]/70 leading-tight">
                  Safety Professional
                </span>
              </div>

              {/* User Avatar */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#2CA3A3] overflow-hidden border border-[#E6EDF5] shadow-sm"
              >
                <img
                  src="/assets/admin-avatar.png"
                  alt="Admin Avatar"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.outerHTML =
                      "<div class='flex h-11 w-11 items-center justify-center rounded-full bg-[#2CA3A3] text-white font-semibold'>A</div>";
                  }}
                />
              </motion.div>

              {/* Dropdown Arrow */}
              <ChevronDown
                size={18}
                className={`text-[#10243A] transition-transform duration-200 ${
                  showDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-52 bg-white rounded-lg border border-[#E6EDF5] shadow-lg py-2 z-50"
                >
                  <a
                    href="#profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[#10243A] hover:bg-[#E6EDF5] transition"
                  >
                    <User size={16} className="text-[#2B6CB0]" /> My Profile
                  </a>
                  <a
                    href="#settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[#10243A] hover:bg-[#E6EDF5] transition"
                  >
                    <Settings size={16} className="text-[#2CA3A3]" /> Settings
                  </a>
                  <div className="border-t border-[#E6EDF5] my-1" />
                  <a
                    href="/"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[#E04B4B] hover:bg-[#E6EDF5] transition"
                  >
                    <LogOut size={16} /> Logout
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-auto bg-[#F6F8FB]">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
