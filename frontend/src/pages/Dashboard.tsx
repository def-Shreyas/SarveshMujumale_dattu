import React, { useState, useEffect, useMemo } from "react";
import { Activity, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HardHat,
  HeartPulse,
  Leaf,
  ShieldAlert,
  FileText,
  AlertTriangle,
  ClipboardCheck,
  GraduationCap,
  GitMerge,
  Scale,
  ArrowRight,
  TrendingUp,
  LayoutDashboard,
  BarChart3,
  List,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiClient } from "@/lib/api";
import { ActivityBarChart } from "@/components/dashboard/Charts";
import { motion } from "framer-motion";

// --- Types ---

type ModuleRow = Record<string, string | number | null>;

type ModuleKpiPayload =
  | {
    table_name?: string;
    rows?: ModuleRow[];
  }
  | Record<string, unknown>;

interface DashboardResponse {
  kpi_tables?: Record<string, ModuleKpiPayload>;
  ui_tiles?: Record<string, Record<string, unknown>>;
  tiles?: Record<string, unknown>;
}

interface QuickTileConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
  secondaryKey?: string;
  secondaryLabel?: string;
  source?: 'tile' | 'kpi_table';
  tableKey?: string;
  module?: string;
  metricName?: string; // For extracting specific metric from KPI table rows
}

interface ModuleConfig {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  route: string;
  color: string;
  gradient: string;
  hexColor: string;
}

// --- Configuration ---

const QUICK_TILE_CONFIG: QuickTileConfig[] = [
  { key: "incidents_open", label: "Open Incidents", icon: AlertTriangle, color: "text-red-500", module: "Incidents & Near-Misses" },
  { key: "ptws_active", label: "Open Permits", icon: FileText, color: "text-orange-500", module: "Permit-to-Work" },
  {
    key: "training_effectiveness",
    label: "Training Effectiveness",
    icon: GraduationCap,
    color: "text-purple-500",
    source: 'kpi_table',
    tableKey: 'Training',
    metricName: 'Effectiveness',
    module: "Training & Competency"
  },
  { key: "inspections_avg_score", label: "Compliance %", icon: ClipboardCheck, color: "text-blue-500", module: "Inspections  & Audits" },
  { key: "medical_cases_reported", label: "Medical Cases", icon: HeartPulse, color: "text-green-500", module: "Medical & First-Aid" },
  {
    key: "ppe_expiring",
    label: "Total PPE",
    icon: HardHat,
    color: "text-yellow-500",
    source: 'kpi_table',
    tableKey: 'PPE',
    module: "PPE & Assets"
  },
  { key: "corrective_open", label: "Open Actions", icon: GitMerge, color: "text-indigo-500", module: "Corrective Actions & RCA" },
  { key: "environmental_metric", label: "Env. Metric", icon: Leaf, color: "text-teal-500", module: "Environmental & Resource" },
  { key: "turnover", label: "Turnover Rate", icon: Scale, color: "text-slate-500", module: "Social & Governance" },
];

const MODULE_CONFIG: ModuleConfig[] = [
  {
    key: "Safety",
    label: "Incidents & Near-Misses ",
    description: "Incident trends and near miss analysis.",
    route: "/unsafety",
    color: "bg-red-500",
    gradient: "from-red-500 to-red-600",
    icon: AlertTriangle,
    hexColor: "#ef4444",
  },
  {
    key: "PTW",
    label: "Permit to Work",
    description: "Active permits and high-risk task monitoring.",
    route: "/ptw",
    color: "bg-orange-500",
    gradient: "from-orange-500 to-orange-600",
    icon: FileText,
    hexColor: "#f97316",
  },
  {
    key: "Inspections",
    label: "Inspections & Audits",
    description: "Compliance scores and audit findings.",
    route: "/audits",
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
    icon: ClipboardCheck,
    hexColor: "#3b82f6",
  },
  {
    key: "Medical",
    label: "Medical & First-Aid",
    description: "Health surveillance and medical case tracking.",
    route: "/medical",
    color: "bg-green-500",
    gradient: "from-green-500 to-green-600",
    icon: HeartPulse,
    hexColor: "#22c55e",
  },
  {
    key: "Training",
    label: "Training & Competency",
    description: "Employee certification and training status.",
    route: "/training",
    color: "bg-purple-500",
    gradient: "from-purple-500 to-purple-600",
    icon: GraduationCap,
    hexColor: "#a855f7",
  },
  {
    key: "PPE",
    label: "PPE & Assets",
    description: "Inventory levels and equipment status.",
    route: "/ppe",
    color: "bg-yellow-500",
    gradient: "from-yellow-500 to-yellow-600",
    icon: HardHat,
    hexColor: "#eab308",
  },
  {
    key: "Corrective Actions",
    label: "Corrective Actions (RCA)",
    description: "Root cause analysis and action closure rates.",
    route: "/rca",
    color: "bg-indigo-500",
    gradient: "from-indigo-500 to-indigo-600",
    icon: GitMerge,
    hexColor: "#6366f1",
  },
  {
    key: "Environmental",
    label: "Environmental Safety",
    description: "Resource usage and environmental impact metrics.",
    route: "/environmental",
    color: "bg-teal-500",
    gradient: "from-teal-500 to-teal-600",
    icon: Leaf,
    hexColor: "#14b8a6",
  },
  {
    key: "Social & Governance",
    label: "Social & Governance",
    description: "Governance compliance and social metrics.",
    route: "/governance",
    color: "bg-slate-500",
    gradient: "from-slate-500 to-slate-600",
    icon: Scale,
    hexColor: "#64748b",
  },
];

// --- Helpers ---

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && value !== true && value !== false) {
    return formatValue(asNumber);
  }
  return String(value);
};

const humanizeKey = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/pct/gi, "%")
    .replace(/\b\w/g, (match) => match.toUpperCase());

const extractRows = (payload?: ModuleKpiPayload): ModuleRow[] => {
  if (
    payload &&
    typeof payload === "object" &&
    "rows" in payload &&
    Array.isArray((payload as { rows?: ModuleRow[] }).rows)
  ) {
    return ((payload as { rows?: ModuleRow[] }).rows ?? []).filter(Boolean);
  }
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return Object.entries(payload)
      .filter(([key]) => key !== "table_name")
      .map(([Metric, Value]) => ({
        Metric,
        Value: (Value ?? null) as string | number | null,
      }));
  }
  return [];
};

const getTableName = (payload?: ModuleKpiPayload) => {
  if (
    payload &&
    typeof payload === "object" &&
    "table_name" in payload &&
    typeof (payload as { table_name?: string }).table_name === "string"
  ) {
    return (payload as { table_name?: string }).table_name;
  }
  return undefined;
};

// --- Components ---

const DashboardHero = ({ onUploadClick: __ }: { onUploadClick?: () => void }) => (
  <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B3D91] to-[#00A79D] p-8 text-white shadow-2xl transition-all duration-300 hover:shadow-blue-900/20 hover:scale-[1.002]">
    <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

      {/* Left Column: Title & Information */}
      <div className="max-w-3xl space-y-4">
        <h1 className="flex items-center gap-3 text-4xl font-extrabold tracking-tight">
          Executive Dashboard
          <Activity className="h-6 w-6 opacity-80" />
        </h1>

        {/* Information about the Executive Dashboard */}
        <p className="text-lg text-blue-50 opacity-90 leading-relaxed">
          Centralized safety command center. Monitor KPIs, incident trends, and compliance status across all modules in one view.
        </p>

        {/* Highlighted Restriction Section */}
        <div className="mt-2 flex items-start gap-3 rounded-xl bg-white/10 border border-white/20 p-4 backdrop-blur-md shadow-inner">
          <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-yellow-300" />
          <div className="text-sm">
            <p className="font-bold text-yellow-300">Data Visualization Requirement</p>
            <p className="text-blue-50">
              Please note: This dashboard is <strong>generated only when you generate the charts</strong>.
              The metrics above will remain empty until you have uploaded your files and processed the visual reports.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Call to Action */}
      {/* <div className="mt-4 md:mt-2 shrink-0">
        <button 
            onClick={onUploadClick}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-[#0B3D91] shadow-lg transition-transform hover:-translate-y-1 hover:bg-blue-50 active:scale-95 md:w-auto"
        >
          <Upload size={20} />
          Generate Charts
        </button>
      </div> */}
    </div>

    {/* Decorative Background Elements */}
    <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl transition-transform duration-700 group-hover:scale-110"></div>
    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-white opacity-10 blur-2xl transition-transform duration-700 group-hover:scale-110"></div>
  </div>
);

interface KpiCardProps {
  title: string;
  value: string;
  icon?: LucideIcon;
  color?: string;
  loading: boolean;
  secondaryValue?: string;
  secondaryLabel?: string;
  moduleName?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, color, loading, secondaryValue, secondaryLabel, moduleName }) => (
  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
    <Card className="overflow-hidden border-none shadow-lg transition-shadow hover:shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {moduleName && (
              <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${color?.replace('text-', 'bg-')}/10 ${color}`}>
                {moduleName}
              </span>
            )}
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="mt-2 h-8 w-24" />
            ) : (
              <div className="mt-1 flex items-baseline gap-3">
                <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
                {secondaryValue && (
                  <div className="flex flex-col border-l pl-3 text-xs text-muted-foreground">
                    <span className="font-bold text-gray-700">{secondaryValue}</span>
                    <span>{secondaryLabel}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div className={`rounded-full p-3 ${color?.replace('text-', 'bg-')}/10`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card >
  </motion.div >
);

interface ModuleCardProps {
  config: ModuleConfig;
  payload?: ModuleKpiPayload;
  uiTiles?: Record<string, unknown>;
  loading: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ config, payload, uiTiles, loading }) => {
  let rows = extractRows(payload);
  
  // Filter out specific metrics for Medical module
  if (config.key === "Medical") {
    rows = rows.filter(row => {
      const metric = row.Metric ?? humanizeKey(Object.keys(row)[0] ?? "");
      return metric !== "Avg Response Time (min)" && metric !== "Drill Compliance %";
    });
  }
  
  // Filter out specific metrics for Environmental module
  if (config.key === "Environmental") {
    rows = rows.filter(row => {
      const metric = row.Metric ?? humanizeKey(Object.keys(row)[0] ?? "");
      return metric !== "Energy Intensity" && metric !== "CO₂ Intensity";
    });
  }
  
  // Filter out specific metrics for Social & Governance module
  if (config.key === "Social & Governance") {
    rows = rows.filter(row => {
      const metric = row.Metric ?? humanizeKey(Object.keys(row)[0] ?? "");
      return metric !== "Policy Compliance (%)" && metric !== "Supplier Audit (%)";
    });
  }
  
  const hasData = rows.length > 0;
  const tableName = getTableName(payload);
  const stats = Object.entries(uiTiles ?? {}).slice(0, 3);

  // Prepare chart data if possible
  const chartData = useMemo(() => {
    return rows.slice(0, 10).map(row => {
      const name = row.Metric ?? humanizeKey(Object.keys(row)[0] ?? "");
      const value = row.Value ?? Object.values(row).find(v => typeof v === 'number');
      return { name, value: typeof value === 'string' ? Number(value.replace(/[%,\s]/g, '')) || 0 : Number(value) || 0 };
    });
  }, [rows]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }
      }
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="flex h-full flex-col overflow-hidden border-t-4 shadow-md transition-all hover:shadow-xl" style={{ borderTopColor: config.color?.replace('bg-', '') || '#0B3D91' }}>
        <CardHeader className="bg-gray-50/50 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 text-white shadow-sm bg-gradient-to-br ${config.gradient}`}>
                <config.icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-800">{config.label}</CardTitle>
                <CardDescription className="text-xs font-medium text-gray-500">{config.description}</CardDescription>
              </div>
            </div>
            <Badge variant={hasData ? "default" : "secondary"} className={hasData ? "bg-[#00A79D] hover:bg-[#008a7e]" : ""}>
              {hasData ? "Active" : "No Data"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ) : hasData ? (
            <Tabs defaultValue="chart" className="w-full">
              <div className="mb-4 flex items-center justify-between">
                {tableName && (
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                    <TrendingUp className="h-3 w-3" />
                    {tableName}
                  </h4>
                )}
                <TabsList className="h-8">
                  <TabsTrigger value="chart" className="h-6 px-2 text-xs"><BarChart3 className="mr-1 h-3 w-3" /> Chart</TabsTrigger>
                  <TabsTrigger value="list" className="h-6 px-2 text-xs"><List className="mr-1 h-3 w-3" /> List</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="chart" className="mt-0">
                <div className="h-[200px] w-full">
                  <ActivityBarChart data={chartData} colors={[config.hexColor || '#0B3D91']} height={200} />
                </div>
              </TabsContent>

              <TabsContent value="list" className="mt-0">
                <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-2">
                  {rows.map((row, idx) => (
                    <div
                      key={`${config.key}-row-${idx}`}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                    >
                      <span className="text-sm font-medium text-gray-600">
                        {row.Metric ?? humanizeKey(Object.keys(row)[0] ?? "")}
                      </span>
                      <span className="font-bold text-gray-900">
                        {row.Value !== undefined
                          ? formatValue(row.Value)
                          : formatValue(
                            Object.values(row).find(
                              (value) => typeof value !== "string"
                            )
                          )}
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Quick Stats Chips */}
              {stats.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4">
                  {stats.map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                      {humanizeKey(key)}: {formatValue(value)}
                    </Badge>
                  ))}
                </div>
              )}
            </Tabs>
          ) : (
            <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center transition-colors hover:border-[#0B3D91]/30 hover:bg-blue-50/30">
              <div className="rounded-full bg-white p-4 shadow-sm">
                <config.icon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-gray-900">No Data Available</p>
                <p className="text-xs text-gray-500">Your data will appear here once you generate a chart.</p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t bg-gray-50/30 p-4">
          {config.route ? (
            <Button
              variant="ghost"
              className="group w-full justify-between text-[#0B3D91] hover:bg-[#0B3D91]/5 hover:text-[#0B3D91]"
              asChild
            >
              <Link to={config.route}>
                <span className="font-semibold">Open Module</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          ) : (
            <p className="w-full text-center text-xs text-muted-foreground">
              Module unavailable
            </p>
          )}
        </CardFooter>
      </Card>
    </motion.div >
  );
};

// --- Main Page Component ---

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/dashboard");
        if (!ignore) {
          setData(response);
          setError(null);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to load dashboard.";
        if (!ignore) {
          setError(message);
          setData(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    fetchDashboard();
    return () => {
      ignore = true;
    };
  }, []);

  const quickTiles = useMemo(
    () =>
      QUICK_TILE_CONFIG.map((tile) => {
        let value = "0";
        let secondaryValue = undefined;

        // Determine Primary Value
        if (tile.source === 'kpi_table' && tile.tableKey && data?.kpi_tables?.[tile.tableKey]) {
          const kpiData = data.kpi_tables[tile.tableKey];
          if ('rows' in kpiData && Array.isArray(kpiData.rows)) {
            // If metricName is specified, find the specific metric row
            if (tile.metricName) {
              const metricName = tile.metricName;
              const metricRow = kpiData.rows.find(
                (row: ModuleRow) => 
                  (row.Metric === metricName) || 
                  (row.Metric && String(row.Metric).toLowerCase().includes(metricName.toLowerCase()))
              );
              if (metricRow) {
                value = formatValue(metricRow.Value);
              } else {
                value = "—"; // Not found
              }
            } else {
              // Default: count rows
              value = formatValue(kpiData.rows.length);
            }
          } else if ('total_rows' in kpiData) {
            value = formatValue((kpiData as any).total_rows);
          }
        } else {
          value = formatValue(data?.tiles?.[tile.key]);
        }

        // Determine Secondary Value
        if (tile.secondaryKey) {
          // If secondary key is a tile key (like 'training_due'), fetch from tiles
          if (data?.tiles && tile.secondaryKey in data.tiles) {
            secondaryValue = formatValue(data.tiles[tile.secondaryKey]);
          }
          // Fallback to checking kpi_tables if not found in tiles (legacy behavior)
          else if (data?.kpi_tables?.[tile.secondaryKey]) {
            const kpiData = data.kpi_tables[tile.secondaryKey];
            if ('rows' in kpiData && Array.isArray(kpiData.rows)) {
              secondaryValue = formatValue(kpiData.rows.length);
            } else if ('total_rows' in kpiData) {
              secondaryValue = formatValue((kpiData as any).total_rows);
            }
          }
        }

        return {
          ...tile,
          value,
          secondaryValue,
          secondaryLabel: tile.secondaryLabel
        };
      }),
    [data]
  );

  return (
    <div className="min-h-screen space-y-8 bg-gray-50/30 p-4 sm:p-6 lg:p-8">
      {/* Hero Section */}
      <DashboardHero />

      {/* Error State */}
      {error && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <Card className="border-red-500/40 bg-red-50 shadow-sm">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="rounded-full bg-red-100 p-2">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-800">Connection Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick KPIs Section */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-[#0B3D91]" />
            <h2 className="text-2xl font-bold text-gray-900">Key Performance Indicators</h2>
          </div>
          <Badge variant="outline" className="bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
            {loading ? "Updating..." : `Last Updated: ${new Date().toLocaleTimeString()}`}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickTiles.map((tile) => (
            <KpiCard
              key={tile.key}
              title={tile.label}
              value={tile.value}
              icon={tile.icon}
              color={tile.color}
              loading={loading}
              secondaryValue={tile.secondaryValue}
              secondaryLabel={tile.secondaryLabel}
              moduleName={tile.module}
            />
          ))}
        </div>
      </section>

      {/* Modules Grid Section */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Module Analytics</h2>
          <p className="text-muted-foreground">
            Detailed breakdown of performance metrics across all safety modules.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {MODULE_CONFIG.map((module) => (
            <ModuleCard
              key={module.key}
              config={module}
              payload={data?.kpi_tables?.[module.key]}
              uiTiles={data?.ui_tiles?.[module.key]}
              loading={loading}
            />
          ))}
        </div>
      </section>

      {/* Footer / Info Section */}
      <section className="mt-12 text-center">
        <p className="text-sm text-gray-400">
          DATTU AI Safety Management System • v2.0 • Secure & Encrypted
        </p>
      </section>
    </div>
  );
};