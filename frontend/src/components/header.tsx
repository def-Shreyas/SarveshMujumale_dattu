// src/components/Header.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Search, Menu, LogOut } from "lucide-react"; // 2. Import LogOut icon
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext"; // 3. Import useAuth hook

// Import your custom UI components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// Avatar components are no longer needed, but keeping import for safety if other files use them
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// 4. Import DropdownMenu components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import your Dattu image
import DattuLogo from "/logo dattu.png"; // Make sure this path is correct

// 3. Define props to accept from AppLayout
interface HeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

// 4. Accept props in the component
export const Header: React.FC<HeaderProps> = ({
  isCollapsed,
  setIsCollapsed,
}) => {
  // 5. Initialize hooks
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Clear authentication state
    navigate('/login'); 
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center border-b bg-white px-4 md:px-6">
      
      {/* Left: Brand + Toggle Button */}
      <div
        className={cn(
          "flex items-center gap-2 pr-4 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[80px]" : "w-[260px]" // Adjusts width
        )}
      >
        {/* Toggle button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)} // Toggles state
          className="flex-shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo Link (Visible unless collapsed) */}
        {/* <Link
          to="/"
          className={cn(
            "flex items-center gap-2",
            isCollapsed && "hidden" // Hides this link
          )}
        >
          <img src={DattuLogo} alt="DATTU" className="h-8 w-8" />
          <span className="hidden text-lg font-semibold text-[#0B3D91] md:inline-block">
            DATTU
          </span>
        </Link> */}
      </div>

      {/* Center: Search */}
      <div className="flex-1">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search incident, PTW, KPI…"
            className="w-full rounded-full bg-gray-100 pl-10"
          />
        </div>
      </div>

      {/* Right: Actions (Now incorporating Dattu branding and Logout) */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
        </Button>

        {/* Plant Selector */}
        <Select defaultValue="plant-1">
          <SelectTrigger className="hidden w-[180px] md:flex">
            <SelectValue placeholder="Select Plant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="plant-1">All Plants</SelectItem>
            <SelectItem value="plant-2">Plant A (Manufacturing)</SelectItem>
            <SelectItem value="plant-3">Plant B (Assembly)</SelectItem>
          </SelectContent>
        </Select>
        
        {/* 6. DATTU Branding and Logout Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex cursor-pointer items-center gap-2 rounded-full p-1 transition-all hover:bg-gray-100">
              <img 
                src={DattuLogo} 
                alt="DATTU Avatar" 
                className="h-8 w-8 rounded-full"
              />
              <span className="text-sm font-semibold text-[#0B3D91] hidden sm:inline-block">
                DATTU 
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Executive Co-Pilot</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Report Access</DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-500 cursor-pointer focus:bg-red-50/50" 
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};