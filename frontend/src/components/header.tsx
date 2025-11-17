// src/components/Header.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Menu, LogOut, Building2, User } from "lucide-react"; // Removed Search and Bell, added Building2 and User icons
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext"; // 3. Import useAuth hook

// Import your custom UI components
import { Button } from "@/components/ui/button";
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
  const { logout, user } = useAuth();
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

      {/* Center: Company Name and Username */}
      <div className="flex-1 flex items-center justify-center gap-4 md:gap-6">
        {user && (
          <>
            {/* Company Name */}
            {user.company_name && (
              <>
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-[#0B3D91]" />
                  <span className="text-base md:text-lg font-semibold text-gray-700 hidden sm:inline-block">
                    {user.company_name}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 sm:hidden">
                    {user.company_name.length > 15 
                      ? user.company_name.substring(0, 15) + '...' 
                      : user.company_name}
                  </span>
                </div>
                {/* Separator */}
                <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              </>
            )}
            
            {/* Username */}
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-[#00A79D]" />
              <span className="text-base md:text-lg font-semibold text-gray-800">
                {user.username}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right: Actions (Now incorporating Dattu branding and Logout) */}
      <div className="flex items-center gap-4">
        {/* DATTU Branding and Logout Dropdown */}
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
            <DropdownMenuLabel>DATTU AI Assistant</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
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