// src/pages/Audits.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
} from "recharts";
import {
  CheckSquare,
  PlusCircle,
  FileText,
  TrendingUp,
  Brain,
  Info,
  Filter,
  Check,
  Zap,
  ClipboardCheck,
  AlertTriangle,
  Repeat,
  ShieldAlert,
} from "lucide-react";
import type {
  AuditRecord,
  AuditKpi,
  ComplianceByAreaData,
  NcrSummaryData,
} from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// --- Mock Data (Replace with API calls) ---

const mockKpis: AuditKpi[] = [
  {
    title: "Overall Compliance",
    value: "92%",
    formula: "(Pass / Total) × 100",
    progress: 92,
  },
  {
    title: "NCR Recurrence",
    value: "15%",
    formula: "(Repeat NCR / Total NCR) × 100",
    progress: 15,
    invertProgressColor: true, // Lower is better
  },
  {
    title: "Avg. NCR Closure",
    value: "4.5 Days",
    formula: "Avg(Close Date - Open Date)",
  },
  {
    title: "Open NCRs",
    value: "5",
    formula: "Total open non-compliance reports",
  },
];

const mockAudits: AuditRecord[] = [
  {
    id: "A-101",
    area: "Welding",
    checklist: "Monthly Fire Safety",
    status: "Pass",
    riskCategory: null,
    actionOwner: null,
    auditDate: new Date("2025-10-25"),
    ncrId: null,
  },
  {
    id: "A-102",
    area: "Assembly",
    checklist: "5S Audit",
    status: "Fail (NCR)",
    riskCategory: "Medium",
    actionOwner: "S. Gupta",
    auditDate: new Date("2025-10-24"),
    ncrId: "NCR-045",
  },
  {
    id: "A-103",
    area: "Maintenance",
    checklist: "LOTO Verification",
    status: "In Progress",
    riskCategory: null,
    actionOwner: "V. Patel",
    auditDate: new Date("2025-10-28"),
    ncrId: null,
  },
  {
    id: "A-104",
    area: "Logistics",
    checklist: "Forklift Safety",
    status: "Fail (NCR)",
    riskCategory: "High",
    actionOwner: "R. Singh",
    auditDate: new Date("2025-10-22"),
    ncrId: "NCR-044",
  },
];

const mockComplianceData: ComplianceByAreaData[] = [
  { area: "Assembly", compliance: 85, fullMark: 100 },
  { area: "Welding", compliance: 95, fullMark: 100 },
  { area: "Maintenance", compliance: 92, fullMark: 100 },
  { area: "Logistics", compliance: 88, fullMark: 100 },
  { area: "Warehouse", compliance: 90, fullMark: 100 },
];

const mockNcrData: NcrSummaryData[] = [
  { name: "High", count: 3, fill: "#E53935" },
  { name: "Medium", count: 8, fill: "#FFC107" },
  { name: "Low", count: 5, fill: "#00A79D" },
];

// --- Main Audits Page Component ---

export const Audits: React.FC = () => {
  const [kpis, setKpis] = useState<AuditKpi[]>([]);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);

  // --- Data Fetching (Backend Logic) ---
  useEffect(() => {
    // TODO: Replace with API calls
    setKpis(mockKpis);
    setAudits(mockAudits);
  }, []);

  const handleFilterChange = () => {
    // TODO: Add filter state and re-fetch data
    // const query = new URLSearchParams({ area, status, risk }).toString();
    // fetch(`/api/audits/filter?${query}`)
    //   .then(res => res.json())
    //   .then(data => setAudits(data));
    console.log("Filtering data...");
  };

  const handleFormSubmit = async (formData: Partial<AuditRecord>) => {
    console.log("Starting new audit:", formData);
    // TODO: Replace with API call
    /*
    try {
      const response = await fetch('/api/audits/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to submit');
      const newAudit = await response.json();
      setAudits([newAudit, ...audits]);
      setIsModalOpen(false);
      toast.success("Success", { description: "New audit has been started." });
    } catch (error) {
      toast.error("Error", { description: "Could not start audit." });
    }
    */
    // Mock success
    const newAudit: AuditRecord = {
      id: `A-${Math.floor(Math.random() * 1000)}`,
      auditDate: new Date(),
      status: "In Progress",
      riskCategory: null,
      ncrId: null,
      ...formData,
    } as AuditRecord;
    setAudits([newAudit, ...audits]);
    setIsModalOpen(false);
    toast.success("Success", { description: "New audit has been started." });
  };

  const handleGenerateAI = () => {
    if (!selectedAudit) return;
    // TODO: API call to AI backend
    // fetch(`/api/audits/ai-insight?id=${selectedAudit.id}`)
    //   .then(res => res.json())
    //   .then(data => {
    //     // display summary
    //   })
    toast.info("AI Co-Pilot", {
      description: `Analyzing audit ${selectedAudit.id}...`,
    });
  };

  return (
    <TooltipProvider>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            Inspections & Audits
          </h1>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="gap-2 bg-[#0B3D91] hover:bg-[#082f70]">
                  <PlusCircle className="h-5 w-5" />
                  Start New Audit
                </Button>
              </motion.div>
            </DialogTrigger>
            <StartAuditModal
              onSubmit={handleFormSubmit}
              onClose={() => setIsModalOpen(false)}
            />
          </Dialog>
        </div>

        {/* KPIs Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.title} {...kpi} />
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left/Main Panel */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="records">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="records">
                  <FileText className="mr-2 h-4 w-4" />
                  Audit Records
                </TabsTrigger>
                <TabsTrigger value="scorecards">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Audit Scorecards
                </TabsTrigger>
                <TabsTrigger value="ncrs">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Recurring NCRs
                </TabsTrigger>
              </TabsList>

              {/* Records Tab */}
              <TabsContent value="records" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>All Audit Records</CardTitle>
                    <CardDescription>
                      Filter and manage all scheduled and completed audits.
                    </CardDescription>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2 pt-4">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <DatePicker
                        date={undefined} // TODO: Connect to filter state
                        onSelect={handleFilterChange}
                      />
                      <Select onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assembly">Assembly</SelectItem>
                          <SelectItem value="welding">Welding</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pass">Pass</SelectItem>
                          <SelectItem value="fail">Fail (NCR)</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <AuditTable
                      audits={audits}
                      onRowClick={(audit) => setSelectedAudit(audit)}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Scorecards Tab */}
              <TabsContent value="scorecards" className="mt-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 gap-6 md:grid-cols-2"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Compliance Score by Area</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart
                          cx="50%"
                          cy="50%"
                          outerRadius="80%"
                          data={mockComplianceData}
                        >
                          <PolarGrid />
                          <PolarAngleAxis dataKey="area" fontSize={12} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar
                            name="Compliance"
                            dataKey="compliance"
                            stroke="#0B3D91"
                            fill="#0B3D91"
                            fillOpacity={0.6}
                          />
                          <RechartsTooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>NCR Summary by Risk</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockNcrData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis fontSize={12} />
                          <RechartsTooltip />
                          <Bar dataKey="count">
                            {mockNcrData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))} 
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Recurring NCRs Tab */}
              <TabsContent value="ncrs" className="mt-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Recurring Non-Compliance List</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible>
                        <AccordionItem value="item-1">
                          <AccordionTrigger className="font-semibold">
                            <div className="flex items-center gap-2">
                              <Repeat className="h-5 w-5" />
                              (3 recurrences) Machine Guarding - Assembly
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {/* TODO: Populate with real data */}
                            <p>NCR-045 (2025-10-24) - Owner: S. Gupta - Status: Open</p>
                            <p>NCR-032 (2025-09-20) - Owner: S. Gupta - Status: Closed</p>
                            <p>NCR-018 (2025-08-15) - Owner: S. Gupta - Status: Closed</p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                          <AccordionTrigger className="font-semibold">
                            <div className="flex items-center gap-2">
                              <Repeat className="h-5 w-5" />
                              (2 recurrences) Improper LOTO - Maintenance
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {/* TODO: Populate with real data */}
                            <p>NCR-040 (2025-10-15) - Owner: V. Patel - Status: Open</p>
                            <p>NCR-025 (2025-09-10) - Owner: V. Patel - Status: Closed</p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right AI Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-[#0B3D91]" />
                  AI Co-Pilot
                </CardTitle>
                <CardDescription>
                  {selectedAudit
                    ? `Insights for Audit ${selectedAudit.id}`
                    : "Select an audit to see AI insights"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedAudit ? (
                  <>
                    <div>
                      <h4 className="font-semibold">Audit Failure Risk</h4>
                      <p className="flex items-center gap-1 text-sm text-yellow-600">
                        <ShieldAlert className="h-4 w-4" />
                        {/* TODO: Populate from AI API */}
                        Risk for {selectedAudit.area} is 35% higher this month.
                      </p>
                    </div>
                    {selectedAudit.status === "Fail (NCR)" && (
                      <>
                        <div>
                          <h4 className="font-semibold">Recurring NCR Alert</h4>
                          <p className="flex items-center gap-1 text-sm text-red-600">
                            <Repeat className="h-4 w-4" />
                            {/* TODO: Populate from AI API */}
                            This is a recurring NCR (3 times in 6 months).
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold">Suggested Preventive Action</h4>
                          <p className="text-sm text-gray-600">
                            {/* TODO: Populate from AI API */}
                            Recommend dedicated toolbox talk for Assembly line on 5S principles and re-labeling all tool shadows.
                          </p>
                        </div>
                      </>
                    )}
                    <Button className="w-full gap-2" onClick={handleGenerateAI}>
                      <Zap className="h-4 w-4" />
                      Generate Suggestions
                    </Button>
                  </>
                ) : (
                  <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-center text-gray-500">
                    <p>Select an audit record from the table</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

// --- Sub-component: KPI Card ---
const KpiCard: React.FC<AuditKpi> = ({
  title,
  value,
  formula,
  progress,
  invertProgressColor = false,
}) => {
  let progressColor = "bg-blue-600"; // Default
  if (progress !== undefined) {
    if (invertProgressColor) {
      // Lower is better (e.g., Recurrence %)
      progressColor = progress > 15 ? "bg-red-500" : (progress > 5 ? "bg-yellow-500" : "bg-green-600");
    } else {
      // Higher is better (e.g., Compliance %)
      progressColor = progress < 80 ? "bg-red-500" : (progress < 90 ? "bg-yellow-500" : "bg-green-600");
    }
  }

  return (
    <motion.div whileHover={{ scale: 1.03 }}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{formula}</p>
            </TooltipContent>
          </Tooltip>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{value}</div>
          {progress !== undefined && (
            <Progress
              value={progress}
              className="mt-2 h-2"
              indicatorClassName={cn("!bg-primary", progressColor)} // Override default
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// --- Sub-component: Audit Table ---
interface AuditTableProps {
  audits: AuditRecord[];
  onRowClick: (audit: AuditRecord) => void;
}

const AuditTable: React.FC<AuditTableProps> = ({ audits, onRowClick }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Audit ID</TableHead>
        <TableHead>Area</TableHead>
        <TableHead>Checklist</TableHead>
        <TableHead>Audit Date</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Risk</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {audits.map((audit) => (
        <motion.tr
          key={audit.id}
          className="cursor-pointer"
          onClick={() => onRowClick(audit)}
          whileHover={{ backgroundColor: "#F7F9FB" }}
        >
          <TableCell className="font-medium">{audit.id}</TableCell>
          <TableCell>{audit.area}</TableCell>
          <TableCell>{audit.checklist}</TableCell>
          <TableCell>{audit.auditDate.toLocaleDateString()}</TableCell>
          <TableCell>
            <Badge
              className={cn(
                audit.status === "Pass" && "border-green-600 text-green-600",
                audit.status === "Fail (NCR)" && "border-red-600 text-red-600",
                audit.status === "In Progress" && "border-yellow-600 text-yellow-600"
              )}
              variant="outline"
            >
              {audit.status}
            </Badge>
          </TableCell>
          <TableCell>
            {audit.riskCategory ? (
              <Badge
                className={cn(
                  audit.riskCategory === "High" && "bg-red-100 text-red-800",
                  audit.riskCategory === "Medium" && "bg-yellow-100 text-yellow-800",
                  audit.riskCategory === "Low" && "bg-green-100 text-green-800"
                )}
              >
                {audit.riskCategory}
              </Badge>
            ) : (
              "N/A"
            )}
          </TableCell>
        </motion.tr>
      ))}
    </TableBody>
  </Table>
);

// --- Sub-component: Start Audit Modal ---
interface StartAuditModalProps {
  onSubmit: (formData: Partial<AuditRecord>) => void;
  onClose: () => void;
}

const StartAuditModal: React.FC<StartAuditModalProps> = ({
  onSubmit,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<AuditRecord>>({
    status: "In Progress", // Default to In Progress
  });

  const handleSubmit = () => {
    // Basic validation
    if (!formData.area || !formData.checklist || !formData.auditDate) {
      toast.error("Error", {
        description: "Please fill in Area, Checklist, and Audit Date.",
      });
      return;
    }
    // Handle conditional risk
    if (formData.status !== "Fail (NCR)") {
      formData.riskCategory = null;
    }
    onSubmit(formData);
  };

  const handleChange = (key: keyof AuditRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6" /> Start New Audit
        </DialogTitle>
        <DialogDescription>
          Select the area, checklist, and date to begin a new audit.
        </DialogDescription>
      </DialogHeader>
      {/* Updated grid to be 2 columns for better layout */}
      <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
        {/* Area Dropdown (spans both columns) */}
        <Select onValueChange={(val) => handleChange("area", val)}>
          <SelectTrigger className="md:col-span-2">
            <SelectValue placeholder="Select Area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Assembly">Assembly</SelectItem>
            <SelectItem value="Welding">Welding</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
            <SelectItem value="Logistics">Logistics</SelectItem>
            <SelectItem value="Warehouse">Warehouse</SelectItem>
          </SelectContent>
        </Select>

        {/* Checklist Dropdown (spans both columns) */}
        <Select onValueChange={(val) => handleChange("checklist", val)}>
          <SelectTrigger className="md:col-span-2">
            <SelectValue placeholder="Select Checklist" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Monthly Fire Safety">Monthly Fire Safety</SelectItem>
            <SelectItem value="5S Audit">5S Audit</SelectItem>
            <SelectItem value="LOTO Verification">LOTO Verification</SelectItem>
            <SelectItem value="Forklift Safety">Forklift Safety</SelectItem>
            <SelectItem value="Machine Guarding">Machine Guarding</SelectItem>
          </SelectContent>
        </Select>

        {/* Audit Date */}
        <div>
          <label className="text-sm font-medium">Audit Date</label>
          <DatePicker
            date={formData.auditDate as Date | undefined}
            onSelect={(date) => handleChange("auditDate", date)}
          />
        </div>

        {/* Action Owner */}
        <div>
          <label className="text-sm font-medium">Action Owner</label>
          <Input
            placeholder="e.g., S. Gupta"
            onChange={(e) => handleChange("actionOwner", e.target.value)}
          />
        </div>

        {/* --- NEW: Status Dropdown --- */}
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select
            defaultValue="In Progress"
            onValueChange={(val) => handleChange("status", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Pass">Pass</SelectItem>
              <SelectItem value="Fail (NCR)">Fail (NCR)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* --- NEW: Risk Category Dropdown (Conditional) --- */}
        <div>
          <label className="text-sm font-medium">Risk Category (if Fail)</label>
          <Select
            // This is disabled unless status is 'Fail (NCR)'
            disabled={formData.status !== "Fail (NCR)"}
            onValueChange={(val) => handleChange("riskCategory", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button className="bg-[#0B3D91] hover:bg-[#082f70]" onClick={handleSubmit}>
          <Check className="mr-2 h-4 w-4" />
          Start Audit
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
