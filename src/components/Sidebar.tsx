// ...existing code...
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
import { LayoutDashboard, BarChart3, Users, Zap, Bot } from "lucide-react";

// Menu items.
const items = [
  {
    title: "Module1",
    url: "/unsafety",
    icon: LayoutDashboard,
  },
  {
    title: "Module2",
    url: "/module2",
    icon: BarChart3,
  },
  {
    title: "Module3",
    url: "#",
    icon: Users,
  },
  {
    title: "Module4",
    url: "#",
    icon: Zap,
  },
  {
    title: "Chatbot",
    url: "/chatbot",
    icon: Bot,
  },
];

export default function AppSidebar() {
  return (
    <Sidebar className="bg-[#0f172a] border-r border-slate-800">
      <SidebarContent className="gap-0 bg-[#0f172a]">
        <SidebarGroup className="border-b border-slate-200 pb-4">
          <div className="px-2 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-300">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-900">
                  D
                </span>
              </div>
              <h1 className="text-lg font-semibold text-slate-100">
                DATTU
              </h1>
            </div>
          </div>
        </SidebarGroup>

        <SidebarGroup className="px-0 bg-[#0f172a]">
          <SidebarGroupLabel className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-100">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2 py-2">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="group relative flex h-10 items-center gap-3 rounded-md px-3 py-6 text-slate-100 transition-all duration-200 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <a
                        href={item.url}
                        className="flex w-full items-center gap-3"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-lg font-medium">
                          {item.title}
                        </span>
                        <div className="h-1 w-1 rounded-full opacity-0 transition-opacity group-hover:opacity-100 bg-slate-900 dark:bg-white"></div>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto border-t border-slate-200 dark:border-slate-800 px-4 py-4">
          <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              💡 Tip: Use keyboard shortcuts for faster navigation
            </p>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}