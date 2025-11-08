// src/pages/Training.tsx
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
  Legend,
} from "recharts";
import {
  Users,
  PlusCircle,
  FileText,
  TrendingUp,
  Brain,
  Info,
  Filter,
  Check,
  Zap,
  GraduationCap,
  Award,
  Bell,
  AlertTriangle,
  Clock,
} from "lucide-react";
import type {
  TrainingRecord,
  TrainingKpi,
  TrainingEffectivenessData,
  TrainingCompletionData,
} from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// --- Mock Data (Replace with API calls) ---

const mockKpis: TrainingKpi[] = [
  {
    title: "Training Coverage",
    value: "92%",
    formula: "(Trained / Total) × 100",
    progress: 92,
  },
  {
    title: "Avg. Effectiveness",
    value: "+45%",
    formula: "Avg(Post – Pre Test)",
    progress: 45,
  },
  {
    title: "Expiry Compliance",
    value: "85%",
    formula: "(Valid / Total) × 100",
    progress: 85,
  },
  {
    title: "Expiring This Month",
    value: "8",
    formula: "Certificates expiring in next 30 days",
  },
];

const mockTrainingRecords: TrainingRecord[] = [
  {
    id: "TR-001",
    employeeId: "E-105",
    employeeName: "R. Singh",
    course: "Hot Work Safety",
    date: new Date("2025-09-15"),
    trainer: "S. Gupta",
    preTest: 40,
    postTest: 95,
    certificateExpiry: new Date("2026-09-14"),
    status: "Completed",
  },
  {
    id: "TR-002",
    employeeId: "E-210",
    employeeName: "V. Patel",
    course: "Confined Space Entry",
    date: new Date("2024-11-20"),
    trainer: "A. Khan",
    preTest: 55,
    postTest: 88,
    certificateExpiry: new Date("2025-11-19"),
    status: "Completed",
  },
  {
    id: "TR-003",
    employeeId: "E-315",
    employeeName: "A. Kumar",
    course: "Fire Watch",
    date: new Date("2024-10-01"),
    trainer: "S. Gupta",
    preTest: 30,
    postTest: 75,
    certificateExpiry: new Date("2025-09-30"),
    status: "Expired",
  },
];

const mockCompletionData: TrainingCompletionData[] = [
  { name: "Hot Work", completed: 45 },
  { name: "Confined Space", completed: 30 },
  { name: "Fire Watch", completed: 52 },
  { name: "LOTO", completed: 60 },
];

const mockEffectivenessData: TrainingEffectivenessData[] = [
  { name: "Assembly", effectiveness: 42 },
  { name: "Welding", effectiveness: 55 },
  { name: "Maintenance", effectiveness: 38 },
  { name: "Logistics", effectiveness: 48 },
];

// --- Main Training Page Component ---

export const Training: React.FC = () => {
  const [kpis, setKpis] = useState<TrainingKpi[]>([]);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(
    null
  );

  // --- Data Fetching (Backend Logic) ---
  useEffect(() => {
    // TODO: Replace with API calls
    setKpis(mockKpis);
    setRecords(mockTrainingRecords);
  }, []);

  const handleFilterChange = () => {
    // TODO: Add filter state and re-fetch data
    // const query = new URLSearchParams({ course, dept, status }).toString();
    // fetch(`/api/training/filter?${query}`)
    //   .then(res => res.json())
    //   .then(data => setRecords(data));
    console.log("Filtering data...");
  };

  const handleFormSubmit = async (formData: Partial<TrainingRecord>) => {
    console.log("Submitting new training record:", formData);
    // TODO: Replace with API call
    /*
    try {
      const response = await fetch('/api/training/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to submit');
      const newRecord = await response.json();
      setRecords([newRecord, ...records]);
      setIsModalOpen(false);
      toast.success("Success", { description: "New training record added." });
    } catch (error) {
      toast.error("Error", { description: "Could not add record." });
    }
    */
    // Mock success
    const newRecord: TrainingRecord = {
      id: `TR-${Math.floor(Math.random() * 1000)}`,
      status: "Completed",
      ...formData,
    } as TrainingRecord;
    setRecords([newRecord, ...records]);
    setIsModalOpen(false);
    toast.success("Success", { description: "New training record added." });
  };

  const handleGenerateAISummary = () => {
    // TODO: API call to AI backend
    // fetch(`/api/training/ai-tna-summary`)
    //   .then(res => res.json())
    //   .then(data => {
    //     // display summary
    //   })
    toast.info("AI TNA Summary", {
      description: "Generating monthly training needs analysis...",
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
            Training & Competency
          </h1>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="gap-2 bg-[#0B3D91] hover:bg-[#082f70]">
                  <PlusCircle className="h-5 w-5" />
                  Add Training Record
                </Button>
              </motion.div>
            </DialogTrigger>
            <AddTrainingModal
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
                  Training Records
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analytics & Gaps
                </TabsTrigger>
                <TabsTrigger value="expiries">
                  <Bell className="mr-2 h-4 w-4" />
                  Expiry Reminders
                </TabsTrigger>
              </TabsList>

              {/* Records Tab */}
              <TabsContent value="records" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>All Training Records</CardTitle>
                    <CardDescription>
                      Filter, sort, and manage all employee training.
                    </CardDescription>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2 pt-4">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <Select onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Course" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hot-work">Hot Work Safety</SelectItem>
                          <SelectItem value="confined-space">Confined Space</SelectItem>
                          <SelectItem value="fire-watch">Fire Watch</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <TrainingTable
                      records={records}
                      onRowClick={(rec) => setSelectedRecord(rec)}
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
                  className="grid grid-cols-1 gap-6 md:grid-cols-2"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Completion by Course</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockCompletionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis fontSize={12} />
                          <RechartsTooltip />
                          <Bar dataKey="completed" fill="#0B3D91" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Effectiveness by Dept (Skill Gap)</CardTitle>
                      <CardDescription>Avg. (Post - Pre Test Score)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockEffectivenessData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis unit="%" fontSize={12} />
                          <RechartsTooltip />
                          <Bar dataKey="effectiveness" fill="#00A79D" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Expiries Tab */}
              <TabsContent value="expiries" className="mt-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Accordion type="single" collapsible defaultValue="item-1">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-lg font-semibold text-yellow-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Expiring This Month (8)
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {/* TODO: Populate with real data */}
                        <p>V. Patel - Confined Space - Expires 2025-11-19</p>
                        <p>...</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger className="text-lg font-semibold text-red-600">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Overdue (3)
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {/* TODO: Populate with real data */}
                        <p>A. Kumar - Fire Watch - Expired 2025-09-30</p>
                        <p>...</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
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
                    ? `Insights for ${selectedRecord.employeeName} (${selectedRecord.employeeId})`
                    : "Select a record to see AI insights"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedRecord ? (
                  <>
                    <div>
                      <h4 className="font-semibold">Effectiveness Insight</h4>
                      <p className="text-sm text-gray-600">
                        {/* TODO: Populate from AI API */}
                        Score improved from {selectedRecord.preTest}% to {selectedRecord.postTest}%.
                        This {selectedRecord.postTest - selectedRecord.preTest}% jump is {selectedRecord.postTest - selectedRecord.preTest > 40 ? "above" : "below"} average for {selectedRecord.course}.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Retraining Recommendation</h4>
                      {selectedRecord.postTest < 80 ? (
                         <p className="flex items-center gap-1 text-sm text-yellow-600">
                          <AlertTriangle className="h-4 w-4" />
                          {/* TODO: Populate from AI API */}
                          Score is below 80%. Recommend practical refresher in 6 months.
                        </p>
                      ) : (
                         <p className="flex items-center gap-1 text-sm text-green-600">
                          <Check className="h-4 w-4" />
                          Competency met. No immediate retraining needed.
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">Department Competency</h4>
                      <p className="text-sm text-gray-600">
                        {/* TODO: Populate from AI API */}
                        Their department (Assembly) has a low competency score in "Fire Watch".
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-center text-gray-500">
                    <p>Select a training record from the table</p>
                  </div>
                )}
                <Button className="w-full gap-2" onClick={handleGenerateAISummary}>
                  <Zap className="h-4 w-4" />
                  Generate Monthly TNA Summary
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
const KpiCard: React.FC<TrainingKpi> = ({ title, value, formula, progress }) => (
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
            indicatorClassName={cn(
    "!bg-primary", // This is a trick to remove the default bg-primary
    progress < 60
      ? "bg-yellow-500"
      : progress < 90
      ? "bg-teal-500" // Use your accent teal color
      : "bg-blue-600" // Use your primary navy/blue color
  )}
           />
        )}
      </CardContent>
    </Card>
  </motion.div>
);

// --- Sub-component: Training Table ---
interface TrainingTableProps {
  records: TrainingRecord[];
  onRowClick: (record: TrainingRecord) => void;
}

const TrainingTable: React.FC<TrainingTableProps> = ({ records, onRowClick }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Employee ID</TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Course</TableHead>
        <TableHead>Post-Test</TableHead>
        <TableHead>Expiry Date</TableHead>
        <TableHead>Status</TableHead>
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
          <TableCell className="font-medium">{rec.employeeId}</TableCell>
          <TableCell>{rec.employeeName}</TableCell>
          <TableCell>{rec.course}</TableCell>
          <TableCell>{rec.postTest}%</TableCell>
          <TableCell>
            {rec.certificateExpiry ? rec.certificateExpiry.toLocaleDateString() : "N/A"}
          </TableCell>
          <TableCell>
            <Badge
              className={cn(
                rec.status === "Completed" && "border-green-600 text-green-600",
                rec.status === "Expired" && "border-red-600 text-red-600",
                rec.status === "Pending" && "border-gray-500 text-gray-500"
              )}
              variant="outline"
            >
              {rec.status}
            </Badge>
          </TableCell>
        </motion.tr>
      ))}
    </TableBody>
  </Table>
);

// --- Sub-component: Add Training Modal ---
interface AddTrainingModalProps {
  onSubmit: (formData: Partial<TrainingRecord>) => void;
  onClose: () => void;
}

const AddTrainingModal: React.FC<AddTrainingModalProps> = ({
  onSubmit,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<TrainingRecord>>({
    preTest: 0,
    postTest: 0,
  });

  const handleSubmit = () => {
    // Basic validation
    if (!formData.employeeId || !formData.course || !formData.date || !formData.trainer) {
      toast.error("Error", { description: "Please fill in all required fields." });
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (key: keyof TrainingRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
           <GraduationCap className="h-6 w-6" /> Add New Training Record
        </DialogTitle>
        <DialogDescription>
          Log a new training session for an employee.
        </DialogDescription>
      </DialogHeader>
      <div className="grid max-h-[60vh] grid-cols-1 gap-4 overflow-y-auto p-1 md:grid-cols-2">
        <Input 
          placeholder="Employee ID (e.g., E-105)"
          onChange={(e) => handleChange("employeeId", e.target.value)}
        />
        <Input 
          placeholder="Employee Name"
          onChange={(e) => handleChange("employeeName", e.target.value)}
        />
        <Select onValueChange={(val) => handleChange("course", val)}>
          <SelectTrigger className="md:col-span-2">
            <SelectValue placeholder="Select Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Hot Work Safety">Hot Work Safety</SelectItem>
            <SelectItem value="Confined Space Entry">Confined Space Entry</SelectItem>
            <SelectItem value="Fire Watch">Fire Watch</SelectItem>
            <SelectItem value="LOTO">LOTO (Lockout/Tagout)</SelectItem>
            <SelectItem value="Forklift Operation">Forklift Operation</SelectItem>
          </SelectContent>
        </Select>
         <Input 
          placeholder="Trainer Name"
          onChange={(e) => handleChange("trainer", e.target.value)}
        />
        <div>
          <label className="text-sm font-medium">Training Date</label>
          <DatePicker
            date={formData.date as Date | undefined}
            onSelect={(date) => handleChange("date", date)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Pre-Test Score (%)</label>
          <Input 
            type="number" 
            placeholder="0"
            onChange={(e) => handleChange("preTest", parseInt(e.target.value) || 0)} 
          />
        </div>
        <div>
          <label className="text-sm font-medium">Post-Test Score (%)</label>
          <Input 
            type="number" 
            placeholder="0"
            onChange={(e) => handleChange("postTest", parseInt(e.target.value) || 0)} 
          />
        </div>
         <div className="md:col-span-2">
          <label className="text-sm font-medium">Certificate Expiry Date (Optional)</label>
          <DatePicker
            date={formData.certificateExpiry as Date | undefined}
            onSelect={(date) => handleChange("certificateExpiry", date)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button className="bg-[#0B3D91] hover:bg-[#082f70]" onClick={handleSubmit}>
          <Check className="mr-2 h-4 w-4" />
          Save Record
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};