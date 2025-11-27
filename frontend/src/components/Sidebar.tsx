import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

// Import Lucide icons
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  HeartPulse,
  HardHat,
  Leaf,
  Scale,
  GitMerge,
  GraduationCap,
  AlertTriangle,
  MoreVertical,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Incidents & Near-Misses", href: "/unsafety", icon: AlertTriangle },
  { name: "Permit-to-Work (PTW)", href: "/ptw", icon: FileText },
  { name: "Inspections & Audits", href: "/audits", icon: CheckSquare },
  { name: "Medical & First-Aid", href: "/medical", icon: HeartPulse },
  { name: "Training & Competency", href: "/training", icon: GraduationCap },
  { name: "Assets & PPE Management", href: "/ppe", icon: HardHat },
  { name: "Corrective Actions & RCA", href: "/rca", icon: GitMerge },
  { name: "Environmental & Resource", href: "/environmental", icon: Leaf },
  { name: "Social & Governance", href: "/governance", icon: Scale },
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
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <motion.aside
      className={cn(
        "fixed top-16 left-0 z-40 h-[calc(100vh-64px)] border-r border-blue-900 bg-[#0B3D91] text-white"
      )}
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 40
      }}
    >
      <div className="flex h-full flex-col p-4">

        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-1 pr-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <motion.div
                  key={item.name}
                  whileHover={{ x: isCollapsed ? 0 : 5 }}
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
                        isActive && "text-[#00A79D]"
                      )}
                    />
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

        {/* Footer Section: Settings & Profile */}
        <div className="mt-auto pt-4 flex flex-col gap-2">

          {/* Settings Button - OUTSIDE the dropdown, directly in sidebar */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              onClick={() => navigate("/settings")}
              className={cn(
                "w-full gap-3 border-2 border-[#0B3D91] bg-white text-[#0B3D91] text-base font-semibold transition-all duration-200 shadow-md",
                "hover:bg-gray-100 hover:shadow-lg",
                isCollapsed ? "justify-center" : "justify-start"
              )}
              size="lg"
            >
              <Settings className="h-5 w-5" />
              <motion.span
                className="overflow-hidden whitespace-nowrap"
                variants={textVariant}
                animate={isCollapsed ? "hidden" : "visible"}
              >
                Settings
              </motion.span>
            </Button>
          </motion.div>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full gap-3 h-auto py-2 px-2 hover:bg-white/10 text-white hover:text-white transition-all duration-200 outline-none ring-0 focus-visible:ring-0",
                  isCollapsed ? "justify-center" : "justify-start"
                )}
              >
                <Avatar className="h-9 w-9 border-2 border-white/20">
                  <AvatarImage src={user?.avatar_url} alt={user?.username} />
                  <AvatarFallback className="bg-[#00A79D] text-white font-bold">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <motion.div
                  className="flex flex-col items-start text-left overflow-hidden"
                  variants={textVariant}
                  animate={isCollapsed ? "hidden" : "visible"}
                >
                  <span className="text-sm font-bold truncate w-40">{user?.username || "User"}</span>
                  <span className="text-xs text-gray-300 truncate w-40">{user?.company_name || "Company"}</span>
                </motion.div>

                {!isCollapsed && (
                  <MoreVertical className="h-4 w-4 ml-auto text-gray-400" />
                )}
              </Button>
            </DropdownMenuTrigger>

            {/* Dropdown Content */}
            <DropdownMenuContent
              side="top"
              align="center"
              sideOffset={8}
              className={cn(
                "w-[220px] p-2",
                // Matches sidebar blue, adds subtle border
                "bg-[#FAF9F6] border border-white/10 text-black shadow-xl z-50"
              )}
            >
              {/* Minimal Header */}
              <DropdownMenuLabel className="font-normal p-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-black">
                    {user?.username}
                  </p>
                  <p className="text-xs leading-none text-black opacity-70">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-black" />

              {/* Only Logout Button as requested */}
              <DropdownMenuItem
                onClick={() => { logout(); navigate("/login"); }}
                className="text-black hover:text-black focus:text-black cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.aside>
  );
};