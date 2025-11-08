// src/components/Sidebar.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  { name: "Incidents & Near-Misses", href: "/incidents", icon: ShieldAlert },
  { name: "Permit-to-Work (PTW)", href: "/ptw", icon: FileText },
  { name: "Training & Competency", href: "/training", icon: Users },
  { name: "Inspections & Audits", href: "/audits", icon: CheckSquare },
  { name: "Medical & First-Aid", href: "/medical", icon: HeartPulse },
  { name: "Assets & PPE Management", href: "/ppe", icon: HardHat },
  { name: "Corrective Actions & RCA", href: "/rca", icon: Target },
  { name: "Environmental & Resource", href: "/environmental", icon: Leaf },
  { name: "Social & Governance", href: "/governance", icon: Building },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "AI Vision Report", href: "/unsafety", icon: Eye },
];

// 1. Define props to accept from AppLayout
interface SidebarProps {
  isCollapsed: boolean;
}

// 2. Accept props in the component
export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    // 3. Make the sidebar's width dynamic
    <aside
      className={cn(
        "fixed top-16 left-0 z-40 h-[calc(100vh-64px)] border-r bg-[#0B3D91] text-white transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[80px]" : "w-[260px]" // Dynamic width
      )}
    >
      <div className="flex h-full flex-col justify-between p-4">
        {/* Module Navigation */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                // 4. Add tooltip for accessibility when collapsed
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-200 transition-all hover:bg-white/10",
                  isActive && "bg-white/20 text-white shadow-inner",
                  isCollapsed && "justify-center" // Center icon
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0", // flex-shrink-0 prevents icon from shrinking
                    isActive && "text-[#00A79D]"
                  )}
                />
                {/* 5. Hide the text span when collapsed */}
                <span className={cn(isCollapsed && "hidden")}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Ask DATTU Button */}
        <div className="mt-auto">
          <Button
            className={cn(
              // Changed base color to Primary Navy and hover to a darker shade
              "w-full gap-3 bg-[#0B3D91] text-base font-semibold text-white hover:bg-[#082f70] transition-colors duration-200",
              isCollapsed ? "justify-center" : "justify-start" // Center content
            )}
            size="lg"
            // 6. Add tooltip for DATTU button
            title={isCollapsed ? "Ask DATTU" : undefined}
          >
            {/* 7. Hide DATTU text */}
            <span className={cn(isCollapsed && "hidden")}>Ask DATTU</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};
