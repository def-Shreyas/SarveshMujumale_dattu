import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "@/components/header"; // Corrected import path
import { Sidebar } from "@/components/Sidebar";
//import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { motion } from "framer-motion"; // <-- 1. Import motion

export const AppLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 2. Define the animation variants for the main content
  // This will smoothly animate the 'paddingLeft' property
  const mainVariants = {
    collapsed: { paddingLeft: "80px" },
    expanded: { paddingLeft: "260px" },
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F7F9FB]">
      {/* 3. Pass state and setter to Header */}
      <Header 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />
      
      {/* 4. Pass state to Sidebar */}
      <Sidebar isCollapsed={isCollapsed} />

      {/* 5. Replaced <main> with <motion.main> */}
      <motion.main
        className="pt-16" // Base class (padding-top)
        variants={mainVariants}
        // Animate to the 'collapsed' or 'expanded' variant
        animate={isCollapsed ? "collapsed" : "expanded"} 
        transition={{ 
          // Use a 'spring' animation for a natural, smooth feel
          type: "spring", 
          stiffness: 400, 
          damping: 40 
        }} 
      >
        {/* p-6 adds the internal padding for your pages */}
        <div className="p-6">
          <Outlet /> {/* Your pages (e.g., Dashboard) will render here */}
        </div>
      </motion.main>
      
      {/* Toaster for notifications */}
      <Toaster richColors />
    </div>
  );
};