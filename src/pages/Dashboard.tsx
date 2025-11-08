// src/pages/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // <-- REQUIRED for navigation
import { motion } from "framer-motion"; // <-- REQUIRED for animations
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowUpRight,
  ArrowDownRight,
  AlertOctagon,
  ChevronsRight,
  FileDown,
  Mail,
  PieChartIcon,
  BarChartIcon,
  LineChartIcon,
  ShieldAlert,
  FileText,
  Users,
  CheckSquare,
  HeartPulse,
  HardHat,
  Target,
  Leaf,
  Building,
  History,
  Download,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import type {
  KpiData,
  AiInsight,
  TopRisk,
  UnsafeActData,
  OpenActionData,
  CO2Data, // <-- Make sure to import CO2Data type
} from "@/types";

// --- MOCK DATA (Replace with API calls) ---

const kpiData: KpiData[] = [
  {
    title: "Incidents Open",
    value: "3",
    comparison: "20% vs last 30d",
    isPositive: false,
  },
  {
    title: "PTWs Active",
    value: "22",
    comparison: "5 expiring today",
    isPositive: false,
  },
  {
    title: "Training Due",
    value: "15",
    comparison: "5% vs last 30d",
    isPositive: false,
  },
  {
    title: "Waste Recycled",
    value: "78%",
    comparison: "2% vs last 30d",
    isPositive: true,
  },
];

const unsafeActData: UnsafeActData[] = [
  { name: "PPE Issues", value: 400, fill: "#FFC107" },
  { name: "Housekeeping", value: 300, fill: "#E53935" },
  { name: "Other", value: 300, fill: "#0B3D91" },
];

const openActionData: OpenActionData[] = [
  { name: "High", value: 5 },
  { name: "Medium", value: 12 },
  { name: "Low", value: 8 },
];

// Added type annotation
const co2EmissionsData: CO2Data[] = [
  { name: "May", CO2: 4000 },
  { name: "Jun", CO2: 3000 },
  { name: "Jul", CO2: 2000 },
  { name: "Aug", CO2: 2780 },
  { name: "Sep", CO2: 1890 },
  { name: "Oct", CO2: 2390 },
];

const aiInsightsData: AiInsight[] = [
  {
    id: "1",
    icon: LineChartIcon,
    text: "Energy usage is 15% higher than Apr 2024",
    linkText: "See meter log",
    linkHref: "#",
  },
  {
    id: "2",
    icon: FileText,
    text: "2 PTWs overdue in Unit B",
    linkText: "Assign owner",
    linkHref: "#",
  },
  {
    id: "3",
    icon: HardHat,
    text: "PPE non-compliance up 8% in Night Shift",
    linkText: "View reports",
    linkHref: "#",
  },
];

// --- UPDATED: Added 'href' for navigation ---
const moduleGridData = [
  {
    name: "Incidents & Near-Misses",
    href: "/incidents",
    icon: ShieldAlert,
    kpi: "3 open ↑20%",
    status: "2 Overdue",
    isAlert: true,
  },
  {
    name: "Permit-to-Work (PTW)",
    href: "/ptw",
    icon: FileText,
    kpi: "22 active, 5 expiring",
    status: "",
    isAlert: false,
  },
  {
    name: "Training & Competency",
    href: "/training",
    icon: Users,
    kpi: "8 due this month",
    status: "1 Overdue",
    isAlert: true,
  },
  {
    name: "Inspections & Audits",
    href: "/audits",
    icon: CheckSquare,
    kpi: "Avg score 88%",
    status: "",
    isAlert: false,
  },
  {
    name: "Medical & First-Aid",
    href: "/medical",
    icon: HeartPulse,
    kpi: "2 cases reported",
    status: "",
    isAlert: false,
  },
  {
    name: "Assets & PPE Management",
    href: "/ppe",
    icon: HardHat,
    kpi: "13 PPE expiring",
    status: "",
    isAlert: false,
  },
  {
    name: "Corrective Actions & RCA",
    href: "/rca",
    icon: Target,
    kpi: "7 open ↓30%",
    status: "3 Overdue",
    isAlert: true,
  },
  {
    name: "Environmental & Resource",
    href: "/environmental", // Corrected path
    icon: Leaf,
    kpi: "CO₂/unit 0.92",
    status: "",
    isAlert: false,
  },
  {
    name: "Social & Governance",
    href: "/governance",
    icon: Building,
    kpi: "Turnover 5.1%",
    status: "",
    isAlert: false,
  },
  {
    name: "Recent Activity",
    href: undefined, // No link
    icon: History,
    kpi: "View latest uploads",
    status: "",
    isAlert: false,
  },
];

const topRisksData: TopRisk[] = [
  {
    id: "r1",
    priority: "High",
    description: "Forklift collision risk in Warehouse A",
    owner: "S. Gupta",
  },
  {
    id: "r2",
    priority: "High",
    description: "Hot work permit non-compliance",
    owner: "R. Singh",
  },
  {
    id: "r3",
    priority: "Medium",
    description: "Chemical spill containment",
    owner: "V. Patel",
  },
  {
    id: "r4",
    priority: "Medium",
    description: "Working at height (Scaffolding)",
    owner: "S. Gupta",
  },
  {
    id: "r5",
    priority: "Low",
    description: "Training records for new hires",
    owner: "A. Khan",
  },
];

// --- Main Dashboard Component ---

export const Dashboard: React.FC = () => {
  return (
    <TooltipProvider>
      <div className="flex min-h-full gap-6">
        {/* Main Canvas (Center) */}
        <div className="flex-1 space-y-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Executive Dashboard
          </h1>

          {/* Row A: KPI Card Ribbon */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiData.map((kpi) => (
              <KpiCard key={kpi.title} {...kpi} />
            ))}
          </div>

          {/* Row B: Three Primary Panels */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Panel: Safety Snapshot */}
            <Card className="col-span-1 shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle>Safety Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-600">
                    Unsafe Act Types
                  </h3>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={unsafeActData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {unsafeActData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-600">
                    Open Actions by Priority
                  </h3>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={openActionData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                        />
                        <RechartsTooltip />
                        <Bar dataKey="value" barSize={20}>
                          {openActionData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.name === "High"
                                  ? "#E53935"
                                  : entry.name === "Medium"
                                  ? "#FFC107"
                                  : "#00A79D"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
              <div className="border-t p-4">
                <Button className="bg-[#0B3D91] hover:bg-[#082f70]">
                  Report Near Miss
                </Button>
                <Button variant="outline" className="ml-2">
                  Create Action
                </Button>
              </div>
            </Card>

            {/* Center Panel: ESG Snapshot */}
            <Card className="col-span-1 flex flex-col shadow-sm">
              <CardHeader>
                <CardTitle>ESG Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-4">
                  <p className="text-xs text-gray-500">
                    CO₂ per unit vs last month
                  </p>
                  <p className="text-3xl font-bold text-[#E53935]">8.5%</p>
                </div>
                <div className="h-[150px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={co2EmissionsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <RechartsTooltip />
                      <Line
                        type="monotone"
                        dataKey="CO2"
                        stroke="#0B3D91"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <div className="border-t p-4">
                <Button variant="link" className="p-0">
                  View full ESG Report
                  <ChevronsRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Row C: Module Grid */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              All Modules
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {moduleGridData.map((mod) => (
                <ModuleTile key={mod.name} {...mod} />
              ))}
              {/* Generate Report Tile (as a CTA) */}
              <Card className="group flex h-full flex-col items-center justify-center gap-2 bg-[#0B3D91] p-4 text-white shadow-sm transition-all hover:bg-[#082f70] hover:shadow-lg">
                <Download className="h-8 w-8" />
                <span className="text-center text-sm font-semibold">
                  Generate Monthly Report
                </span>
              </Card>
            </div>
          </div>
        </div>

        {/* Right Insights Rail */}
        <aside className="hidden w-[300px] flex-shrink-0 space-y-6 lg:block">
          {/* AI Insights Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-[#0B3D91]" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiInsightsData.map((insight) => (
                <div key={insight.id} className="flex gap-3">
                  <insight.icon className="mt-1 h-5 w-5 flex-shrink-0 text-[#00A79D]" />
                  <div>
                    <p className="text-sm">{insight.text}</p>
                    <a
                      href={insight.linkHref}
                      className="text-sm font-medium text-[#0B3D91] hover:underline"
                    >
                      {insight.linkText}
                    </a>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top 5 Risks Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Top 5 Risks</CardTitle>
              <CardDescription>
                <Select defaultValue="30d">
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="mtd">Month-to-Date</SelectItem>
                    <SelectItem value="ytd">Year-to-Date</SelectItem>
                  </SelectContent>
                </Select>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topRisksData.map((risk) => (
                <div key={risk.id} className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-1 h-2 w-2 flex-shrink-0 rounded-full",
                      risk.priority === "High" && "bg-[#E53935]",
                      risk.priority === "Medium" && "bg-[#FFC107]",
                      risk.priority === "Low" && "bg-[#00A79D]"
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium">{risk.description}</p>
                    <p className="text-xs text-gray-500">Owner: {risk.owner}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Export Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Quick Export</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start gap-2">
                <FileDown className="h-4 w-4" /> Export Executive PDF
              </Button>
              <Button variant="outline" className="justify-start gap-2">
                <FileDown className="h-4 w-4" /> Export Full CSV
              </Button>
              <Button variant="outline" className="justify-start gap-2">
                <Mail className="h-4 w-4" /> Email Summary
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </TooltipProvider>
  );
};

// --- Sub-components for Dashboard ---

/**
 * KPI Card Component
 */
const KpiCard: React.FC<KpiData> = ({
  title,
  value,
  comparison,
  isPositive,
}) => (
  <Card className="shadow-sm">
    <CardHeader className="pb-2">
      <CardDescription>{title}</CardDescription>
      <CardTitle className="text-3xl">{value}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-1 text-xs">
        {isPositive ? (
          <ArrowUpRight className="h-4 w-4 text-green-600" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-red-600" />
        )}
        <span className={cn(isPositive ? "text-green-600" : "text-red-600")}>
          {comparison}
        </span>
      </div>
    </CardContent>
  </Card>
);

/**
 * Module Tile Component
 */
// UPDATED interface to accept 'href'
interface ModuleTileProps {
  name: string;
  icon: React.ElementType;
  kpi: string;
  status: string;
  isAlert: boolean;
  href?: string; // href is optional
}

// UPDATED the ModuleTile component to be a clickable link
const ModuleTile: React.FC<ModuleTileProps> = ({
  name,
  icon: Icon,
  kpi,
  status,
  isAlert,
  href,
}) => {
  // Define the content of the card
  const cardContent = (
    <motion.div
      whileHover={{ scale: 1.03 }} // Add hover animation
      className="h-full"
    >
      <Card className="group flex h-full flex-col justify-between p-4 shadow-sm transition-all hover:shadow-md">
        <div>
          <div className="flex items-center justify-between">
            <Icon className="h-6 w-6 text-gray-500 group-hover:text-[#0B3D91]" />
            {isAlert && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                {status}
              </span>
            )}
          </div>
          <p className="mt-4 text-sm font-semibold text-gray-800">{name}</p>
        </div>
        <p className="text-lg font-bold text-gray-900">{kpi}</p>
      </Card>
    </motion.div>
  );

  // If href is provided, wrap in a Link
  if (href) {
    return (
      <Link to={href} className="no-underline">
        {cardContent}
      </Link>
    );
  }

  // Otherwise, just render the (non-clickable) card (e.g., for "Recent Activity")
  return cardContent;
};