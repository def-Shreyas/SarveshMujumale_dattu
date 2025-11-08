// src/layouts/AppLayout.tsx
import React, { useState } from "react"; // 1. Import useState
import { Outlet } from "react-router-dom";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner"; // Import your cn utility

export const AppLayout: React.FC = () => {
  // 2. Add state for the sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="relative min-h-screen w-full bg-[#F7F9FB]">
      {/* 3. Pass state and setter to Header */}
      <Header 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />
      
      {/* 4. Pass state to Sidebar */}
      <Sidebar isCollapsed={isCollapsed} />

      {/* 5. Main Content Area adjusts its padding */}
      <main
        className={cn(
          "pt-16 transition-all duration-300 ease-in-out", // Base classes
          isCollapsed ? "pl-[80px]" : "pl-[260px]"     // Dynamic padding
        )}
      >
        <div className="p-6">
          <Outlet /> {/* Your pages (e.g., Dashboard) will render here */}
        </div>
      </main>
      <Toaster richColors />
    </div>
  );
};