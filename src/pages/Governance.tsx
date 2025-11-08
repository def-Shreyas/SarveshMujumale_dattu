// src/pages/Governance.tsx
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
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import {
  Building,
  PlusCircle,
  FileText,
  TrendingUp,
  Brain,
  Info,
  Filter,
  Check,
  Zap,
  Users,
  TrendingDown,
  Smile,
  FileCheck,
  Briefcase,
  AlertTriangle,
  Clock,
} from "lucide-react";
import type {
  GovernanceRecord,
  GovernanceKpi,
  DiversityData,
  EsgScorecardData,
  AttritionRiskData,
} from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

// --- Mock Data (Replace with API calls) ---

const mockKpis: GovernanceKpi[] = [
  {
    title: "Turnover Rate (YTD)",
    value: "5.1%",
    formula: "Employees Left / Avg. Employees",
    progress: 5.1,
    invertProgressColor: true,
  },
  {
    title: "Absenteeism % (MTD)",
    value: "1.8%",
    formula: "Absent Days / Total Work Days",
    progress: 1.8,
    invertProgressColor: true,
  },
  {
    title: "Policy Compliance %",
    value: "98%",
    formula: "Policies Reviewed / Total Policies",
    progress: 98,
  },
  {
    title: "Supplier Audit %",
    value: "85%",
    formula: "Audited Suppliers / Total Suppliers",
    progress: 85,
  },
];

const mockGovRecords: GovernanceRecord[] = [
  {
    id: "GOV-001",
    department: "Assembly",
    month: new Date("2025-10-01"),
    turnoverPercent: 2.5,
    trainingHours: 120,
    absenteeismPercent: 2.1,
    maleCount: 80,
    femaleCount: 20,
    policyReviewStatus: "Reviewed",
    avgSupplierScore: 92,
  },
  {
    id: "GOV-002",
    department: "Welding",
    month: new Date("2025-10-01"),
    turnoverPercent: 1.2,
    trainingHours: 90,
    absenteeismPercent: 1.5,
    maleCount: 45,
    femaleCount: 5,
    policyReviewStatus: "Reviewed",
    avgSupplierScore: 88,
  },
  {
    id: "GOV-003",
    department: "Maintenance",
    month: new Date("2025-10-01"),
    turnoverPercent: 4.0,
    trainingHours: 60,
    absenteeismPercent: 2.5,
    maleCount: 28,
    femaleCount: 2,
    policyReviewStatus: "Pending",
    avgSupplierScore: 90,
  },
];

const mockDiversityData: DiversityData[] = [
  { name: "Male", value: 153, fill: "#0B3D91" },
  { name: "Female", value: 27, fill: "#00A79D" },
];

const mockAttritionData: AttritionRiskData[] = [
  { name: "Assembly", riskPercent: 18 },
  { name: "Welding", riskPercent: 9 },
  { name: "Maintenance", riskPercent: 25 },
  { name: "Logistics", riskPercent: 12 },
];

const mockEsgData: EsgScorecardData[] = [
  { metric: "Safety", score: 92, fullMark: 100 },
  { metric: "Environment", score: 85, fullMark: 100 },
  { metric: "Social", score: 88, fullMark: 100 },
  { metric: "Governance", score: 95, fullMark: 100 },
  { metric: "Suppliers", score: 82, fullMark: 100 },
];

// --- Main Governance Page Component ---

export const Governance: React.FC = () => {
  const [kpis, setKpis] = useState<GovernanceKpi[]>([]);
  const [records, setRecords] = useState<GovernanceRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<GovernanceRecord | null>(
    null
  );

  // --- Data Fetching (Backend Logic) ---
  useEffect(() => {
    // TODO: Replace with API calls
    setKpis(mockKpis);
    setRecords(mockGovRecords);
  }, []);

  const handleFilterChange = () => {
    // TODO: Add filter state and re-fetch data
    // const query = new URLSearchParams({ dept, month }).toString();
    // fetch(`/api/gov/filter?${query}`)
    //   .then(res => res.json())
    //   .then(data => setRecords(data));
    console.log("Filtering data...");
  };

  const handleFormSubmit = async (formData: Partial<GovernanceRecord>) => {
    console.log("Submitting new S&G metrics:", formData);
    // TODO: Replace with API call
    /*
    try {
      const response = await fetch('/api/gov/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to submit');
      const newRecord = await response.json();
      setRecords([newRecord, ...records]);
      setIsModalOpen(false);
      toast.success("Success", { description: "New S&G metrics logged." });
    } catch (error) {
      toast.error("Error", { description: "Could not log metrics." });
    }
    */
    // Mock success
    const newRecord: GovernanceRecord = {
      id: `GOV-${Math.floor(Math.random() * 1000)}`,
      ...formData,
    } as GovernanceRecord;
    setRecords([newRecord, ...records]);
    setIsModalOpen(false);
    toast.success("Success", { description: "New S&G metrics logged." });
  };

  const handleGenerateAI = () => {
    // TODO: API call to AI backend
    // fetch(`/api/gov/ai-summary`)
    //   .then(res => res.json())
    //   .then(data => {
    //     // display summary
    //   })
    toast.info("AI Co-Pilot", {
      description: "Generating governance score summary...",
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
            Social & Governance Metrics
          </h1>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="gap-2 bg-[#0B3D91] hover:bg-[#082f70]">
                  <PlusCircle className="h-5 w-5" />
                  Add Monthly Metrics
                </Button>
              </motion.div>
            </DialogTrigger>
            <AddMetricsModal
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
            <Tabs defaultValue="ledger">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ledger">
                  <FileText className="mr-2 h-4 w-4" />
                  Metrics Ledger
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <Users className="mr-2 h-4 w-4" />
                  Workforce Analytics
                </TabsTrigger>
                <TabsTrigger value="governance">
                  <Building className="mr-2 h-4 w-4" />
                  Governance Reports
                </TabsTrigger>
              </TabsList>

              {/* Ledger Tab */}
              <TabsContent value="ledger" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>S&G Metrics Ledger</CardTitle>
                    <CardDescription>
                      Monthly Social & Governance data by department.
                    </CardDescription>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2 pt-4">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <Select onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assembly">Assembly</SelectItem>
                          <SelectItem value="welding">Welding</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      <DatePicker
                        date={undefined} // TODO: Connect to filter state
                        onSelect={handleFilterChange}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <GovernanceTable
                      records={records}
                      onRowClick={(rec) => setSelectedRecord(rec)}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Workforce Analytics Tab */}
              <TabsContent value="analytics" className="mt-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 gap-6 md:grid-cols-2"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Workforce Diversity Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mockDiversityData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={(entry) => `${entry.name} (${entry.value})`}
                          >
                            {mockDiversityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Attrition Risk by Department</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockAttritionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis unit="%" fontSize={12} />
                          <RechartsTooltip />
                          <Bar dataKey="riskPercent" fill="#E53935" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Governance Reports Tab */}
              <TabsContent value="governance" className="mt-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 gap-6 md:grid-cols-2"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Overall ESG Scorecard</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart
                          cx="50%"
                          cy="50%"
                          outerRadius="80%"
                          data={mockEsgData}
                        >
                          <PolarGrid />
                          <PolarAngleAxis dataKey="metric" fontSize={12} />
                          <Radar
                            name="Score"
                            dataKey="score"
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
                      <CardTitle>Policy Compliance Report</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible>
                        <AccordionItem value="item-1">
                          <AccordionTrigger className="font-semibold text-red-600">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5" />
                              Overdue Reviews (1)
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {/* TODO: Populate with real data */}
                            <p>Policy #201: Working at Height - Due 2025-10-15</p>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                          <AccordionTrigger className="font-semibold text-yellow-600">
                            <div className="flex items-center gap-2">
                              <Clock className="h-5 w-5" />
                              Pending Reviews (2)
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {/* TODO: Populate with real data */}
                            <p>Policy #305: Chemical Handling - Due 2025-11-30</p>
                            <p>Policy #112: Grievance Redressal - Due 2025-12-01</p>
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
                  {selectedRecord
                    ? `Insights for ${selectedRecord.department} (${format(
                        selectedRecord.month,
                        "MMM yyyy"
                      )})`
                    : "Select a record to see AI insights"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedRecord ? (
                  <>
                    <div>
                      <h4 className="font-semibold">Attrition Risk</h4>
                      <p className="flex items-center gap-1 text-sm text-red-600">
                        <TrendingDown className="h-4 w-4" />
                        {/* TODO: Populate from AI API */}
                        Turnover ( {selectedRecord.turnoverPercent}% ) is high. Attrition risk for this dept is 25% above average.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Survey Sentiment (Mock)</h4>
                      <p className="flex items-center gap-1 text-sm text-gray-600">
                        <Smile className="h-4 w-4" />
                        {/* TODO: Populate from AI API */}
                        Sentiment analysis of recent surveys shows neutral-to-negative sentiment in {selectedRecord.department}.
                      </p>
                    </div>
                    {selectedRecord.policyReviewStatus !== "Reviewed" && (
                       <div>
                         <h4 className="font-semibold">Governance Flag</h4>
                         <p className="flex items-center gap-1 text-sm text-yellow-600">
                           <FileCheck className="h-4 w-4" />
                           {/* TODO: Populate from AI API */}
                           Policies for this department are {selectedRecord.policyReviewStatus.toLowerCase()}.
                         </p>
                       </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-center text-gray-500">
                    <p>Select a record from the table</p>
                  </div>
                )}
                <Button className="w-full gap-2" onClick={handleGenerateAI}>
                  <Zap className="h-4 w-4" />
                  Generate Governance Score
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

// --- Sub-component: KPI Card ---
const KpiCard: React.FC<GovernanceKpi> = ({
  title,
  value,
  formula,
  progress,
  invertProgressColor = false,
}) => {
  let progressColor = "bg-blue-600"; // Default
  if (progress !== undefined) {
    if (invertProgressColor) {
      // Lower is better (e.g., Turnover %)
      progressColor = progress > 10 ? "bg-red-500" : (progress > 5 ? "bg-yellow-500" : "bg-green-600");
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
              indicatorClassName={cn("!bg-primary", progressColor)}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// --- Sub-component: Governance Table ---
interface GovernanceTableProps {
  records: GovernanceRecord[];
  onRowClick: (record: GovernanceRecord) => void;
}

const GovernanceTable: React.FC<GovernanceTableProps> = ({ records, onRowClick }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Department</TableHead>
        <TableHead>Month</TableHead>
        <TableHead>Turnover</TableHead>
        <TableHead>Absenteeism</TableHead>
        <TableHead>Gender Ratio (M/F)</TableHead>
        <TableHead>Policy Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {records.map((rec) => (
        <motion.tr
          key={rec.id}
          className="cursor-pointer"
          onClick={() => onRowClick(rec)}
          whileHover={{ backgroundColor: "#F7F9FB" }}
        >
          <TableCell className="font-medium">{rec.department}</TableCell>
          <TableCell>{format(rec.month, "MMM yyyy")}</TableCell>
          <TableCell>{rec.turnoverPercent}%</TableCell>
          <TableCell>{rec.absenteeismPercent}%</TableCell>
          <TableCell>{`${rec.maleCount} / ${rec.femaleCount}`}</TableCell>
          <TableCell>
            <Badge
              className={cn(
                rec.policyReviewStatus === "Reviewed" && "border-green-600 text-green-600",
                rec.policyReviewStatus === "Pending" && "border-yellow-600 text-yellow-600",
                rec.policyReviewStatus === "Overdue" && "border-red-600 text-red-600"
              )}
              variant="outline"
            >
              {rec.policyReviewStatus}
            </Badge>
          </TableCell>
        </motion.tr>
      ))}
    </TableBody>
  </Table>
);

// --- Sub-component: Add Monthly Metrics Modal ---
interface AddMetricsModalProps {
  onSubmit: (formData: Partial<GovernanceRecord>) => void;
  onClose: () => void;
}

const AddMetricsModal: React.FC<AddMetricsModalProps> = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState<Partial<GovernanceRecord>>({});

  const handleSubmit = () => {
    // Basic validation
    if (
      !formData.department ||
      !formData.month ||
      formData.turnoverPercent === undefined ||
      formData.trainingHours === undefined ||
      formData.absenteeismPercent === undefined ||
      formData.maleCount === undefined ||
      formData.femaleCount === undefined ||
      !formData.policyReviewStatus ||
      formData.avgSupplierScore === undefined
    ) {
      toast.error("Error", { description: "Please fill in all fields." });
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (key: keyof GovernanceRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Building className="h-6 w-6" /> Add Monthly S&G Metrics
        </DialogTitle>
        <DialogDescription>
          Log all Social & Governance data for a specific department and month.
        </DialogDescription>
      </DialogHeader>
      <div className="grid max-h-[70vh] grid-cols-1 gap-x-6 gap-y-4 overflow-y-auto p-1 md:grid-cols-2">
        {/* Dept & Month */}
        <Select onValueChange={(val) => handleChange("department", val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Assembly">Assembly</SelectItem>
            <SelectItem value="Welding">Welding</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
            <SelectItem value="Logistics">Logistics</SelectItem>
            <SelectItem value="Corporate">Corporate</SelectItem>
          </SelectContent>
        </Select>
        <div>
          <DatePicker
            date={formData.month as Date | undefined}
            onSelect={(date) => handleChange("month", date)}
          />
           <p className="text-xs text-muted-foreground">Select any day in the month you are reporting for.</p>
        </div>

        <div className="md:col-span-2 border-t pt-4">
           <h4 className="text-sm font-medium text-gray-500">Social Metrics (Workforce)</h4>
        </div>

        <div>
          <Label htmlFor="turnoverPercent">Turnover %</Label>
          <Input id="turnoverPercent" type="number" placeholder="e.g., 2.5"
            onChange={(e) => handleChange("turnoverPercent", parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label htmlFor="absenteeismPercent">Absenteeism %</Label>
          <Input id="absenteeismPercent" type="number" placeholder="e.g., 1.8"
            onChange={(e) => handleChange("absenteeismPercent", parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label htmlFor="trainingHours">Total Training Hours</Label>
          <Input id="trainingHours" type="number" placeholder="e.g., 120"
            onChange={(e) => handleChange("trainingHours", parseFloat(e.target.value) || 0)} />
        </div>
        
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="maleCount">Male Count</Label>
            <Input id="maleCount" type="number" placeholder="e.g., 80"
              onChange={(e) => handleChange("maleCount", parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <Label htmlFor="femaleCount">Female Count</Label>
            <Input id="femaleCount" type="number" placeholder="e.g., 20"
              onChange={(e) => handleChange("femaleCount", parseInt(e.target.value) || 0)} />
          </div>
        </div>

        <div className="md:col-span-2 border-t pt-4">
           <h4 className="text-sm font-medium text-gray-500">Governance Metrics</h4>
        </div>

        <Select onValueChange={(val) => handleChange("policyReviewStatus", val)}>
          <SelectTrigger>
            <SelectValue placeholder="Policy Review Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Reviewed">Reviewed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <div>
          <Label htmlFor="avgSupplierScore">Avg. Supplier Score (0-100)</Label>
          <Input id="avgSupplierScore" type="number" placeholder="e.g., 92"
            onChange={(e) => handleChange("avgSupplierScore", parseFloat(e.target.value) || 0)} />
        </div>

      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button className="bg-[#0B3D91] hover:bg-[#082f70]" onClick={handleSubmit}>
          <Check className="mr-2 h-4 w-4" />
          Log Metrics
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};