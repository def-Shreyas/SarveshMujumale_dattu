// src/pages/PTW.tsx
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  FileText,
  PieChart as PieChartIcon,
  TrendingUp,
  Brain,
  Info,
  Filter,
  Check,
  Zap,
  PlusCircle,
  FileCheck,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import type {
  Ptw,
  PtwKpi,
  PtwTypeData,
  PtwComplianceData,
} from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// --- Mock Data (Replace with API calls) ---

const mockKpis: PtwKpi[] = [
  {
    title: "Closure Efficiency",
    value: "88%",
    formula: "(Closed / Total) × 100",
  },
  {
    title: "Avg. Closure Time",
    value: "6.2 Hrs",
    formula: "Mean(Close – Issue Date)",
  },
  {
    title: "Overdue PTWs",
    value: "4%",
    formula: "(Overdue / Total) × 100",
  },
  {
    title: "Total Open",
    value: "22",
    formula: "All currently active permits",
  },
];

const mockPtws: Ptw[] = [
  {
    id: "PTW-2051",
    department: "Welding",
    workType: "Hot Work",
    hazards: "Sparks, Fumes, Fire",
    controls: ["fire-extinguisher", "ventilation"],
    requestedBy: "R. Singh",
    approvedBy: "S. Gupta",
    issueDate: new Date("2025-10-28T09:00:00"),
    status: "Open",
  },
  {
    id: "PTW-2050",
    department: "Maintenance",
    workType: "Working at Height",
    hazards: "Fall from height, Dropped objects",
    controls: ["harness", "barricade", "helmet"],
    requestedBy: "V. Patel",
    approvedBy: "S. Gupta",
    issueDate: new Date("2025-10-27T10:00:00"),
    closeDate: new Date("2025-10-27T16:00:00"),
    status: "Closed",
  },
  {
    id: "PTW-2049",
    department: "Assembly",
    workType: "Confined Space",
    hazards: "Poor ventilation, Engulfment",
    controls: ["gas-monitor", "attendant"],
    requestedBy: "A. Khan",
    approvedBy: "S. Gupta",
    issueDate: new Date("2025-10-26T08:00:00"),
    status: "Overdue",
  },
];

const mockPieData: PtwTypeData[] = [
  { name: "Hot Work", value: 40, fill: "#E53935" },
  { name: "Confined Space", value: 15, fill: "#FFC107" },
  { name: "Working at Height", value: 25, fill: "#0B3D91" },
  { name: "Electrical", value: 10, fill: "#00A79D" },
  { name: "Other", value: 10, fill: "#64748b" },
];

const mockComplianceData: PtwComplianceData[] = [
  { name: "Area Barricaded", compliance: 95 },
  { name: "Fire Extinguisher", compliance: 88 },
  { name: "Gas Monitor", compliance: 92 },
  { name: "Safety Harness", compliance: 85 },
  { name: "LOTO Applied", compliance: 98 },
];

// --- Main PTW Page Component ---

export const PTW: React.FC = () => {
  const [kpis, setKpis] = useState<PtwKpi[]>([]);
  const [ptws, setPtws] = useState<Ptw[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPtw, setSelectedPtw] = useState<Ptw | null>(null);

  // --- Data Fetching (Backend Logic) ---
  useEffect(() => {
    // TODO: Replace with API call
    setKpis(mockKpis);
    setPtws(mockPtws);
  }, []);

  const handleFilterChange = () => {
    // TODO: Add filter state and re-fetch data
    // const query = new URLSearchParams({ date, dept, status }).toString();
    // fetch(`/api/ptw/filter?${query}`)
    //   .then(res => res.json())
    //   .then(data => setPtws(data));
    console.log("Filtering data...");
  };

  const handleFormSubmit = async (formData: Partial<Ptw>) => {
    console.log("Submitting new PTW:", formData);
    // TODO: Replace with API call
    /*
    try {
      const response = await fetch('/api/ptw/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to submit');
      const newPtw = await response.json();
      setPtws([newPtw, ...ptws]);
      setIsModalOpen(false);
      toast.success("Success", { description: "New PTW created." });
    } catch (error) {
      toast.error("Error", { description: "Could not create PTW." });
    }
    */
    // Mock success
    const newPtw: Ptw = {
      id: `PTW-${Math.floor(Math.random() * 1000)}`,
      issueDate: new Date(),
      status: "Open",
      ...formData,
    } as Ptw;
    setPtws([newPtw, ...ptws]);
    setIsModalOpen(false);
    toast.success("Success", { description: "New PTW created." });
  };
  
  const handleGenerateAIReview = () => {
    if (!selectedPtw) return;
    // TODO: API call to AI backend
    // fetch(`/api/ptw/ai-review?id=${selectedPtw.id}`)
    //   .then(res => res.json())
    //   .then(data => {
    //     // setAiReview(data.review)
    //   })
    toast.info("AI Review", { description: `Checking controls for ${selectedPtw.id}...` });
  }

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
            Permit-to-Work (PTW)
          </h1>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="gap-2 bg-[#0B3D91] hover:bg-[#082f70]">
                  <PlusCircle className="h-5 w-5" />
                  Create New PTW
                </Button>
              </motion.div>
            </DialogTrigger>
            <CreatePtwModal
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="records">
                  <FileText className="mr-2 h-4 w-4" />
                  Permit Records
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>
              
              {/* Records Tab */}
              <TabsContent value="records" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>All Permits</CardTitle>
                    <CardDescription>
                      Filter, sort, and manage all active and closed permits.
                    </CardDescription>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2 pt-4">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <DatePicker 
                        date={undefined} // TODO: Connect to filter state
                        onSelect={handleFilterChange}
                      />
                      <Select onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assembly">Assembly</SelectItem>
                          <SelectItem value="welding">Welding</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Work Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hot-work">Hot Work</SelectItem>
                          <SelectItem value="confined-space">Confined Space</SelectItem>
                          <SelectItem value="height">Working at Height</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PtwTable 
                      ptws={ptws} 
                      onRowClick={(ptw) => setSelectedPtw(ptw)}
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
                      <CardTitle>PTW Type Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mockPieData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={(entry) => `${entry.value}%`}
                          >
                            {mockPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Legend />
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Safety Checklist Compliance</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={mockComplianceData} 
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
                          <Bar dataKey="compliance" fill="#00A79D" barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
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
                  {selectedPtw
                    ? `Insights for ${selectedPtw.id}`
                    : "Select a permit to see AI insights"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPtw ? (
                  <>
                    <div>
                      <h4 className="font-semibold">AI Control Verification</h4>
                      <p className="flex items-center gap-1 text-sm text-gray-600">
                        {/* TODO: Populate from AI API */}
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                        Controls match {selectedPtw.workType} hazards.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Predicted Load</h4>
                      <p className="text-sm text-gray-600">
                        {/* TODO: Populate from AI API */}
                        Low permit load predicted for {selectedPtw.department} next shift.
                      </p>
                    </div>
                    {selectedPtw.status === "Overdue" && (
                      <div>
                        <h4 className="font-semibold">Overdue Alert</h4>
                        <p className="flex items-center gap-1 text-sm text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          This permit is overdue! Escalate to supervisor.
                        </p>
                      </div>
                    )}
                    <Button className="w-full gap-2" onClick={handleGenerateAIReview}>
                      <Zap className="h-4 w-4" />
                      Run AI Review
                    </Button>
                  </>
                ) : (
                  <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-center text-gray-500">
                    <p>Select a permit from the table</p>
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
const KpiCard: React.FC<PtwKpi> = ({ title, value, formula }) => (
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
      </CardContent>
    </Card>
  </motion.div>
);

// --- Sub-component: PTW Table ---
interface PtwTableProps {
  ptws: Ptw[];
  onRowClick: (ptw: Ptw) => void;
}

const PtwTable: React.FC<PtwTableProps> = ({ ptws, onRowClick }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Permit ID</TableHead>
        <TableHead>Work Type</TableHead>
        <TableHead>Department</TableHead>
        <TableHead>Issue Date</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {ptws.map((ptw) => (
        <motion.tr
          key={ptw.id}
          className="cursor-pointer"
          onClick={() => onRowClick(ptw)}
          whileHover={{ backgroundColor: "#F7F9FB" }}
        >
          <TableCell className="font-medium">{ptw.id}</TableCell>
          <TableCell>{ptw.workType}</TableCell>
          <TableCell>{ptw.department}</TableCell>
          <TableCell>{ptw.issueDate.toLocaleString()}</TableCell>
          <TableCell>
            <Badge
              className={cn(
                ptw.status === "Open" && "border-yellow-600 text-yellow-600",
                ptw.status === "Closed" && "border-green-600 text-green-600",
                ptw.status === "Overdue" && "border-red-600 text-red-600"
              )}
              variant="outline"
            >
              {ptw.status}
            </Badge>
          </TableCell>
        </motion.tr>
      ))}
    </TableBody>
  </Table>
);

// --- Sub-component: Create PTW Modal ---

const safetyChecklistItems = [
  { id: "barricade", label: "Work Area Barricaded" },
  { id: "gas-monitor", label: "Gas Monitor Calibrated & Used" },
  { id: "ventilation", label: "Adequate Ventilation" },
  { id: "fire-extinguisher", label: "Fire Extinguisher Present" },
  { id: "harness", label: "Safety Harness & Lanyard" },
  { id: "loto", label: "LOTO Applied" },
  { id: "helmet", label: "Helmet & Safety Shoes" },
  { id: "attendant", label: "Confined Space Attendant Present" },
];

interface CreatePtwModalProps {
  onSubmit: (formData: Partial<Ptw>) => void;
  onClose: () => void;
}

const CreatePtwModal: React.FC<CreatePtwModalProps> = ({
  onSubmit,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<Ptw>>({
    status: "Open",
    controls: [],
  });

  const handleSubmit = () => {
    // Basic validation
    if (!formData.department || !formData.workType || !formData.issueDate) {
      toast.error("Error", { description: "Please fill in Dept, Work Type, and Issue Date." });
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (key: keyof Ptw, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };
  
  const handleCheckboxChange = (controlId: string, checked: boolean) => {
    const currentControls = formData.controls || [];
    let newControls: string[];
    if (checked) {
      newControls = [...currentControls, controlId];
    } else {
      newControls = currentControls.filter((id) => id !== controlId);
    }
    handleChange("controls", newControls);
  };

  return (
    <DialogContent className="sm:max-w-[800px]">
      <DialogHeader>
        <DialogTitle>Create New Permit-to-Work</DialogTitle>
        <DialogDescription>
          Fill in all details and verify safety controls.
        </DialogDescription>
      </DialogHeader>
      <div className="grid max-h-[70vh] grid-cols-1 gap-6 overflow-y-auto p-1 md:grid-cols-3">
        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Select onValueChange={(val) => handleChange("workType", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Work Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hot Work">Hot Work</SelectItem>
                <SelectItem value="Confined Space">Confined Space</SelectItem>
                <SelectItem value="Working at Height">Working at Height</SelectItem>
                <SelectItem value="Electrical">Electrical</SelectItem>
                <SelectItem value= "Excavation">Excavation</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="List known hazards (e.g., Sparks, Fumes, Fall risk...)"
            onChange={(e) => handleChange("hazards", e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input 
              placeholder="Requested By"
              onChange={(e) => handleChange("requestedBy", e.target.value)}
            />
             <Input 
              placeholder="Approved By"
              onChange={(e) => handleChange("approvedBy", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Issue Date & Time</label>
              <DatePicker
                date={formData.issueDate as Date | undefined}
                onSelect={(date) => handleChange("issueDate", date)}
              />
            </div>
             <div>
              <label className="text-sm font-medium">Close Date & Time (Optional)</label>
              <DatePicker
                date={formData.closeDate as Date | undefined}
                onSelect={(date) => handleChange("closeDate", date)}
              />
            </div>
          </div>
        </div>
        
        {/* Right Column: Checklist */}
        <div className="md:col-span-1 space-y-2 rounded-md border p-4">
           <h4 className="font-semibold text-gray-800">Safety Controls Checklist</h4>
           <div className="space-y-3">
            {safetyChecklistItems.map((item) => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={item.id} 
                  onCheckedChange={(checked) => handleCheckboxChange(item.id, !!checked)}
                  checked={formData.controls?.includes(item.id)}
                />
                <label
                  htmlFor={item.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {item.label}
                </label>
              </div>
            ))}
           </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button className="bg-[#0B3D91] hover:bg-[#082f70]" onClick={handleSubmit}>
          <FileCheck className="mr-2 h-4 w-4" />
          Issue Permit
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};