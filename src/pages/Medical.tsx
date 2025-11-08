// src/pages/Medical.tsx
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
import type {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  LineChart,
  Line,
} from "recharts";
import {
  HeartPulse,
  PlusCircle,
  FileText,
  TrendingUp,
  Brain,
  Info,
  Filter,
  Check,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Siren,
  Timer,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";
import type {
  MedicalCase,
  MedicalKpi,
  InjurySummaryData,
  ResponseTimeData,
  DrillComplianceData,
} from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// --- Mock Data (Replace with API calls) ---

const mockKpis: MedicalKpi[] = [
  {
    title: "FA Cases / Month",
    value: "12",
    formula: "Total first aid cases this month",
    trend: "+2 vs last month",
    isPositive: false, // More cases is bad
  },
  {
    title: "Avg. Response Time",
    value: "3.2 min",
    formula: "Avg. time from report to first aid",
    trend: "-0.5 min vs last month",
    isPositive: true, // Lower time is good
  },
  {
    title: "Drill Compliance %",
    value: "95%",
    formula: "Quarterly emergency drill pass rate",
    trend: "+5% vs last quarter",
    isPositive: true,
  },
  {
    title: "Days Lost (LTI)",
    value: "5",
    formula: "Total days lost from new cases this month",
    trend: "0 vs last month",
    isPositive: true,
  },
];

const mockMedicalCases: MedicalCase[] = [
  {
    id: "MC-051",
    date: new Date("2025-10-28"),
    department: "Assembly",
    injuryType: "Cut",
    firstAidGiven: "Cleaned wound, applied bandage.",
    hospitalization: false,
    daysLost: 0,
  },
  {
    id: "MC-050",
    date: new Date("2025-10-25"),
    department: "Welding",
    injuryType: "Burn",
    firstAidGiven: "Cooled burn, applied gel.",
    hospitalization: true,
    daysLost: 5,
  },
  {
    id: "MC-049",
    date: new Date("2025-10-22"),
    department: "Logistics",
    injuryType: "Sprain",
    firstAidGiven: "Ice pack, compression.",
    hospitalization: false,
    daysLost: 0,
  },
];

const mockInjurySummary: InjurySummaryData[] = [
  { name: "Assembly", "First Aid": 5, LTI: 0 },
  { name: "Welding", "First Aid": 2, LTI: 1 },
  { name: "Maintenance", "First Aid": 3, LTI: 0 },
  { name: "Logistics", "First Aid": 2, LTI: 1 },
];

const mockResponseTime: ResponseTimeData[] = [
  { name: "May", "Avg. Time (min)": 4.5 },
  { name: "Jun", "Avg. Time (min)": 4.0 },
  { name: "Jul", "Avg. Time (min)": 3.8 },
  { name: "Aug", "Avg. Time (min)": 4.1 },
  { name: "Sep", "Avg. Time (min)": 3.5 },
  { name: "Oct", "Avg. Time (min)": 3.2 },
];

const mockDrillData: DrillComplianceData[] = [
  { name: "Fire Drill (Q3)", compliance: 95 },
  { name: "Spill Drill (Q3)", compliance: 90 },
  { name: "Evacuation (Q2)", compliance: 100 },
  { name: "Medical (Q2)", compliance: 88 },
];

// --- Main Medical Page Component ---

export const Medical: React.FC = () => {
  const [kpis, setKpis] = useState<MedicalKpi[]>([]);
  const [cases, setCases] = useState<MedicalCase[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<MedicalCase | null>(null);

  // --- Data Fetching (Backend Logic) ---
  useEffect(() => {
    // TODO: Replace with API calls
    setKpis(mockKpis);
    setCases(mockMedicalCases);
  }, []);

  const handleFilterChange = () => {
    // TODO: Add filter state and re-fetch data
    // const query = new URLSearchParams({ date, dept, injuryType }).toString();
    // fetch(`/api/medical/filter?${query}`)
    //   .then(res => res.json())
    //   .then(data => setCases(data));
    console.log("Filtering data...");
  };

  const handleFormSubmit = async (formData: Partial<MedicalCase>) => {
    console.log("Submitting new medical case:", formData);
    // TODO: Replace with API call
    /*
    try {
      const response = await fetch('/api/medical/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to submit');
      const newCase = await response.json();
      setCases([newCase, ...cases]);
      setIsModalOpen(false);
      toast.success("Success", { description: "New medical case logged." });
    } catch (error) {
      toast.error("Error", { description: "Could not log case." });
    }
    */
    // Mock success
    const newCase: MedicalCase = {
      id: `MC-${Math.floor(Math.random() * 1000)}`,
      ...formData,
    } as MedicalCase;
    setCases([newCase, ...cases]);
    setIsModalOpen(false);
    toast.success("Success", { description: "New medical case logged." });
  };

  const handleGenerateAI = () => {
    if (!selectedCase) return;
    // TODO: API call to AI backend
    // fetch(`/api/medical/ai-insight?id=${selectedCase.id}`)
    //   .then(res => res.json())
    //   .then(data => {
    //     // display summary
    //   })
    toast.info("AI Co-Pilot", {
      description: `Analyzing patterns for ${selectedCase.department}...`,
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
            Medical & First-Aid
          </h1>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="gap-2 bg-[#0B3D91] hover:bg-[#082f70]">
                  <PlusCircle className="h-5 w-5" />
                  Log New Case
                </Button>
              </motion.div>
            </DialogTrigger>
            <AddMedicalCaseModal
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
                  Case Records
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="drills">
                  <Siren className="mr-2 h-4 w-4" />
                  Drill Reports
                </TabsTrigger>
              </TabsList>

              {/* Records Tab */}
              <TabsContent value="records" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>All Medical Cases</CardTitle>
                    <CardDescription>
                      Filter and manage all first-aid and medical cases.
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
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assembly">Assembly</SelectItem>
                          <SelectItem value="welding">Welding</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Injury Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cut">Cut</SelectItem>
                          <SelectItem value="burn">Burn</SelectItem>
                          <SelectItem value="sprain">Sprain</SelectItem>
                          <SelectItem value="fall">Fall</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <MedicalTable
                      cases={cases}
                      onRowClick={(c) => setSelectedCase(c)}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="mt-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 gap-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>First-Aid vs LTI Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockInjurySummary}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis fontSize={12} />
                          <RechartsTooltip />
                          <Legend />
                          <Bar
                            dataKey="First Aid"
                            stackId="a"
                            fill="#00A79D"
                          />
                          <Bar dataKey="LTI" stackId="a" fill="#E53935" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Average Response Time (Monthly)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockResponseTime}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis
                            unit=" min"
                            domain={["dataMin - 1", "dataMax + 1"]}
                            fontSize={12}
                          />
                          <RechartsTooltip />
                          <Line
                            type="monotone"
                            dataKey="Avg. Time (min)"
                            stroke="#0B3D91"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Drill Reports Tab */}
              <TabsContent value="drills" className="mt-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Drill Compliance Report</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={mockDrillData}
                            layout="vertical"
                            margin={{ left: 30 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} unit="%" fontSize={12} />
                            <YAxis
                              dataKey="name"
                              type="category"
                              fontSize={12}
                              width={100}
                              axisLine={false}
                              tickLine={false}
                            />
                            <RechartsTooltip />
                            <Bar dataKey="compliance" fill="#00A79D" barSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
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
                  {selectedCase
                    ? `Insights for Case ${selectedCase.id}`
                    : "Select a case to see AI insights"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCase ? (
                  <>
                    <div>
                      <h4 className="font-semibold">Repetitive Injury Pattern</h4>
                      <p className="flex items-center gap-1 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        {/* TODO: Populate from AI API */}
                        This is the 3rd 'Cut' injury in '{selectedCase.department}' this month.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Suggested Intervention</h4>
                      <p className="text-sm text-gray-600">
                        {/* TODO: Populate from AI API */}
                        Recommend 'Hand Safety' toolbox talk for the {selectedCase.department} department. Review glove PPE compliance.
                      </p>
                    </div>
                    {selectedCase.hospitalization && (
                      <div>
                        <h4 className="font-semibold">Wellness Follow-up</h4>
                        <p className="text-sm text-gray-600">
                          {/* TODO: Populate from AI API */}
                          Schedule return-to-work assessment and wellness check-in.
                        </p>
                      </div>
                    )}
                    <Button className="w-full gap-2" onClick={handleGenerateAI}>
                      <Zap className="h-4 w-4" />
                      Suggest Interventions
                    </Button>
                  </>
                ) : (
                  <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-center text-gray-500">
                    <p>Select a medical case from the table</p>
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
const KpiCard: React.FC<MedicalKpi> = ({
  title,
  value,
  formula,
  trend,
  isPositive,
}) => (
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
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            )}
            <span
              className={cn(isPositive ? "text-green-600" : "text-red-600")}
            >
              {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

// --- Sub-component: Medical Table ---
interface MedicalTableProps {
  cases: MedicalCase[];
  onRowClick: (c: MedicalCase) => void;
}

const MedicalTable: React.FC<MedicalTableProps> = ({ cases, onRowClick }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Case ID</TableHead>
        <TableHead>Date</TableHead>
        <TableHead>Department</TableHead>
        <TableHead>Injury Type</TableHead>
        <TableHead>Hospitalization</TableHead>
        <TableHead>Days Lost</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {cases.map((c) => (
        <motion.tr
          key={c.id}
          className="cursor-pointer"
          onClick={() => onRowClick(c)}
          whileHover={{ backgroundColor: "#F7F9FB" }}
        >
          <TableCell className="font-medium">{c.id}</TableCell>
          <TableCell>{c.date.toLocaleDateString()}</TableCell>
          <TableCell>{c.department}</TableCell>
          <TableCell>{c.injuryType}</TableCell>
          <TableCell>
            <Badge
              className={cn(
                c.hospitalization
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              )}
            >
              {c.hospitalization ? "Yes" : "No"}
            </Badge>
          </TableCell>
          <TableCell>{c.daysLost}</TableCell>
        </motion.tr>
      ))}
    </TableBody>
  </Table>
);

// --- Sub-component: Add Medical Case Modal ---
interface AddMedicalCaseModalProps {
  onSubmit: (formData: Partial<MedicalCase>) => void;
  onClose: () => void;
}

const AddMedicalCaseModal: React.FC<AddMedicalCaseModalProps> = ({
  onSubmit,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<MedicalCase>>({
    hospitalization: false,
    daysLost: 0,
  });

  const handleSubmit = () => {
    // Basic validation
    if (!formData.date || !formData.department || !formData.injuryType || !formData.firstAidGiven) {
      toast.error("Error", {
        description: "Please fill in all required fields.",
      });
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (key: keyof MedicalCase, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <HeartPulse className="h-6 w-6" /> Log New Medical Case
        </DialogTitle>
        <DialogDescription>
          Record a new first-aid or medical treatment case.
        </DialogDescription>
      </DialogHeader>
      <div className="grid max-h-[60vh] grid-cols-1 gap-4 overflow-y-auto p-1 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Case Date</label>
          <DatePicker
            date={formData.date as Date | undefined}
            onSelect={(date) => handleChange("date", date)}
          />
        </div>
        <Select onValueChange={(val) => handleChange("department", val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Assembly">Assembly</SelectItem>
            <SelectItem value="Welding">Welding</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
            <SelectItem value="Logistics">Logistics</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={(val) => handleChange("injuryType", val)}>
          <SelectTrigger className="md:col-span-2">
            <SelectValue placeholder="Select Injury Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cut">Cut</SelectItem>
            <SelectItem value="Burn">Burn</SelectItem>
            <SelectItem value="Sprain">Sprain</SelectItem>
            <SelectItem value="Fall">Fall</SelectItem>
            <SelectItem value="Chemical">Chemical Exposure</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="md:col-span-2">
           <label className="text-sm font-medium">First Aid Given</label>
           <Textarea 
             placeholder="Describe the first aid treatment provided..."
             onChange={(e) => handleChange("firstAidGiven", e.target.value)}
           />
        </div>

        <div className="flex items-center space-x-2">
          <Switch 
            id="hospitalization" 
            checked={formData.hospitalization}
            onCheckedChange={(checked) => handleChange("hospitalization", checked)}
          />
          <Label htmlFor="hospitalization" className="text-sm font-medium">
            Hospitalization Required?
          </Label>
        </div>
        
        {/* Conditionally show Days Lost only if hospitalized */}
        {formData.hospitalization && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-1"
          >
            <label className="text-sm font-medium">Days Lost</label>
            <Input 
              type="number" 
              placeholder="0"
              onChange={(e) => handleChange("daysLost", parseInt(e.target.value) || 0)} 
            />
          </motion.div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button className="bg-[#0B3D91] hover:bg-[#082f70]" onClick={handleSubmit}>
          <Check className="mr-2 h-4 w-4" />
          Log Case
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};