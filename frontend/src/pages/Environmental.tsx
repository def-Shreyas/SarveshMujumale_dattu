// src/pages/Environmental.tsx
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
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
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
} from "recharts";
import {
  Leaf,
  PlusCircle,
  FileText,
  TrendingUp,
  Brain,
  Info,
  Filter,
  Check,
  Zap,
  Factory,
  Bolt,
  Droplet,
  Recycle,
  Wind,
} from "lucide-react";
import type {
  EnvironmentalRecord,
  EnvironmentalKpi,
  ResourceTrendData,
  WasteSummaryData,
} from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

// --- Mock Data (Replace with API calls) ---

const mockKpis: EnvironmentalKpi[] = [
  {
    title: "Energy Intensity",
    value: "0.45 kWh/unit",
    formula: "Total kWh / Units Produced",
  },
  {
    title: "CO₂ Intensity",
    value: "0.08 tCO₂/unit",
    formula: "Total tCO₂ / Units Produced",
  },
  {
    title: "Recycling %",
    value: "75%",
    formula: "(Recycled / Total Waste) × 100",
    progress: 75,
  },
  {
    title: "Renewable Energy %",
    value: "22%",
    formula: "Renewable kWh / Total kWh",
    progress: 22,
  },
];

const mockEnvRecords: EnvironmentalRecord[] = [
  {
    id: "ENV-001",
    plant: "Plant A",
    month: new Date("2025-10-01"),
    energyKwh: 50000,
    waterM3: 1200,
    wasteTotalT: 50,
    wasteRecycledT: 35,
    co2T: 25,
    renewablePercent: 20,
    unitsProduced: 110000,
  },
  {
    id: "ENV-002",
    plant: "Plant B",
    month: new Date("2025-10-01"),
    energyKwh: 75000,
    waterM3: 1800,
    wasteTotalT: 60,
    wasteRecycledT: 50,
    co2T: 38,
    renewablePercent: 15,
    unitsProduced: 150000,
  },
  {
    id: "ENV-003",
    plant: "Plant A",
    month: new Date("2025-09-01"),
    energyKwh: 48000,
    waterM3: 1150,
    wasteTotalT: 48,
    wasteRecycledT: 30,
    co2T: 24,
    renewablePercent: 20,
    unitsProduced: 105000,
  },
  {
    id: "ENV-004", // Added a zero waste record to test the fix
    plant: "Plant A",
    month: new Date("2025-08-01"),
    energyKwh: 47000,
    waterM3: 1100,
    wasteTotalT: 0,
    wasteRecycledT: 0,
    co2T: 22,
    renewablePercent: 18,
    unitsProduced: 102000,
  },
];

const mockTrendData: ResourceTrendData[] = [
  { month: "May", "Energy (kWh)": 52000, "Water (m³)": 1250 },
  { month: "Jun", "Energy (kWh)": 51000, "Water (m³)": 1200 },
  { month: "Jul", "Energy (kWh)": 53000, "Water (m³)": 1300 },
  { month: "Aug", "Energy (kWh)": 55000, "Water (m³)": 1350 }, // Anomaly
  { month: "Sep", "Energy (kWh)": 48000, "Water (m³)": 1150 },
  { month: "Oct", "Energy (kWh)": 50000, "Water (m³)": 1200 },
];

// Based on Oct data for Plant A
const mockWasteData: WasteSummaryData[] = [
  { name: "Recycled", value: 35, fill: "#00A79D" },
  { name: "Landfill", value: 15, fill: "#64748b" }, // 50 total - 35 recycled
];

// --- Main Environmental Page Component ---

export const Environmental: React.FC = () => {
  const [kpis, setKpis] = useState<EnvironmentalKpi[]>([]);
  const [records, setRecords] = useState<EnvironmentalRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<EnvironmentalRecord | null>(
    null
  );

  // --- Data Fetching (Backend Logic) ---
  useEffect(() => {
    // TODO: Replace with API calls
    setKpis(mockKpis);
    setRecords(mockEnvRecords);
  }, []);

  const handleFilterChange = () => {
    // TODO: Add filter state and re-fetch data
    // const query = new URLSearchParams({ plant, month }).toString();
    // fetch(`/api/env/filter?${query}`)
    //   .then(res => res.json())
    //   .then(data => setRecords(data));
    console.log("Filtering data...");
  };

  const handleFormSubmit = async (formData: Partial<EnvironmentalRecord>) => {
    console.log("Submitting new env record:", formData);
    // TODO: Replace with API call
    /*
    try {
      const response = await fetch('/api/env/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to submit');
      const newRecord = await response.json();
      setRecords([newRecord, ...records]);
      setIsModalOpen(false);
      toast.success("Success", { description: "New monthly data logged." });
    } catch (error) {
      toast.error("Error", { description: "Could not log data." });
    }
    */
    // Mock success
    const newRecord: EnvironmentalRecord = {
      id: `ENV-${Math.floor(Math.random() * 1000)}`,
      ...formData,
    } as EnvironmentalRecord;
    setRecords([newRecord, ...records]);
    setIsModalOpen(false);
    toast.success("Success", { description: "New monthly data logged." });
  };

  const handleGenerateAI = () => {
    // TODO: API call to AI backend
    // fetch(`/api/env/ai-summary`)
    //   .then(res => res.json())
    //   .then(data => {
    //     // display summary
    //   })
    toast.info("AI Co-Pilot", {
      description: "Generating environmental summary...",
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
            Environmental & Resource Use
          </h1>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="gap-2 bg-[#0B3D91] hover:bg-[#082f70]">
                  <PlusCircle className="h-5 w-5" />
                  Add Monthly Data
                </Button>
              </motion.div>
            </DialogTrigger>
            <AddDataModal
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ledger">
                  <FileText className="mr-2 h-4 w-4" />
                  Data Ledger
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Trend Analytics
                </TabsTrigger>
              </TabsList>

              {/* Ledger Tab */}
              <TabsContent value="ledger" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Resource Ledger</CardTitle>
                    <CardDescription>
                      Track all resource consumption data by plant and month.
                    </CardDescription>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2 pt-4">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <Select onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Plant" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plant-a">Plant A</SelectItem>
                          <SelectItem value="plant-b">Plant B</SelectItem>
                        </SelectContent>
                      </Select>
                      <DatePicker
                        date={undefined} // TODO: Connect to filter state
                        onSelect={handleFilterChange}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <EnvironmentalTable
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
                  className="grid grid-cols-1 gap-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Energy & Water Trend (6 Months)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" fontSize={12} />
                          <YAxis yAxisId="left" unit=" kWh" fontSize={12} />
                          <YAxis yAxisId="right" orientation="right" unit=" m³" fontSize={12} />
                          <RechartsTooltip />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="Energy (kWh)"
                            stroke="#0B3D91"
                            strokeWidth={2}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="Water (m³)"
                            stroke="#00A79D"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Waste Recycling Summary (This Month)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mockWasteData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={(entry) => `${entry.name} (${entry.value}t)`}
                          >
                            {mockWasteData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Legend />
                          <RechartsTooltip />
                        </PieChart>
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
                  DATTU AI
                </CardTitle>
                <CardDescription>
  {selectedRecord
    ? `Insights for ${selectedRecord.plant} (${
        selectedRecord.month
          ? format(selectedRecord.month, "MMM yyyy")
          : "Invalid Date"
      })`
    : "Select a record to see AI insights"}
</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedRecord ? (
                  <>
                    <div>
                      <h4 className="font-semibold">Abnormal Consumption</h4>
                      <p className="flex items-center gap-1 text-sm text-yellow-600">
                        <Bolt className="h-4 w-4" />
                        {/* TODO: Populate from AI API */}
                        Energy use is 15% above 6-month average for this plant.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Reduction Recommendation</h4>
                      <p className="text-sm text-gray-600">
                        {/* TODO: Populate from AI API */}
                        Anomaly detected in 'Energy (kWh)'. Recommend checking compressor bank 2 for air leaks, as this was the root cause in Aug 2025.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Environmental Summary</h4>
                      <p className="text-sm text-gray-600">
                        {/* TODO: Populate from AI API */}
                        This month saw a 5% increase in energy intensity, while recycling rates improved by 2%.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-center text-gray-500">
                    <p>Select a data record from the table</p>
                  </div>
                )}
                <Button className="w-full gap-2" onClick={handleGenerateAI}>
                  <Zap className="h-4 w-4" />
                  Generate Full Summary
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
const KpiCard: React.FC<EnvironmentalKpi> = ({
  title,
  value,
  formula,
  progress,
  invertProgressColor = false,
}) => {
  let progressColor = "bg-blue-600"; // Default
  if (progress !== undefined) {
    if (invertProgressColor) {
      progressColor = progress > 15 ? "bg-red-500" : (progress > 5 ? "bg-yellow-500" : "bg-green-600");
    } else {
      progressColor = progress < 30 ? "bg-yellow-500" : (progress < 60 ? "bg-teal-500" : "bg-green-600");
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

// --- Sub-component: Environmental Table ---
interface EnvironmentalTableProps {
  records: EnvironmentalRecord[];
  onRowClick: (record: EnvironmentalRecord) => void;
}

const EnvironmentalTable: React.FC<EnvironmentalTableProps> = ({ records, onRowClick }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Plant</TableHead>
        <TableHead>Month</TableHead>
        <TableHead>Energy (kWh)</TableHead>
        <TableHead>Water (m³)</TableHead>
        <TableHead>CO₂ (t)</TableHead>
        <TableHead>Recycling %</TableHead>
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
          <TableCell className="font-medium">{rec.plant}</TableCell>
          <TableCell>
  {rec.month ? format(rec.month, "MMM yyyy") : "Invalid Date"}
</TableCell>
          <TableCell>{rec.energyKwh.toLocaleString()}</TableCell>
          <TableCell>{rec.waterM3.toLocaleString()}</TableCell>
          <TableCell>{rec.co2T}</TableCell>
          {/* --- FIX 1: ADDED DIVIDE-BY-ZERO CHECK --- */}
          <TableCell>
            {rec.wasteTotalT > 0
              ? `${((rec.wasteRecycledT / rec.wasteTotalT) * 100).toFixed(0)}%`
              : "N/A"}
          </TableCell>
        </motion.tr>
      ))}
    </TableBody>
  </Table>
);

// --- Sub-component: Add Monthly Data Modal ---
interface AddDataModalProps {
  onSubmit: (formData: Partial<EnvironmentalRecord>) => void;
  onClose: () => void;
}

const AddDataModal: React.FC<AddDataModalProps> = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState<Partial<EnvironmentalRecord>>({});

  const handleSubmit = () => {
    // --- FIX 2: CORRECTED VALIDATION LOGIC ---
    if (
      !formData.plant ||
      !formData.month ||
      formData.energyKwh === undefined ||
      formData.waterM3 === undefined ||
      formData.wasteTotalT === undefined ||
      formData.wasteRecycledT === undefined ||
      formData.co2T === undefined ||
      formData.renewablePercent === undefined ||
      formData.unitsProduced === undefined
    ) {
      toast.error("Error", { description: "Please fill in all fields." });
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (key: keyof EnvironmentalRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Leaf className="h-6 w-6" /> Add Monthly Environmental Data
        </DialogTitle>
        <DialogDescription>
          Enter all resource consumption data for the specified plant and month.
        </DialogDescription>
      </DialogHeader>
      <div className="grid max-h-[70vh] grid-cols-1 gap-x-6 gap-y-4 overflow-y-auto p-1 md:grid-cols-2">
        {/* Plant & Month */}
        <Select onValueChange={(val) => handleChange("plant", val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Plant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Plant A">Plant A</SelectItem>
            <SelectItem value="Plant B">Plant B</SelectItem>
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
           <h4 className="text-sm font-medium text-gray-500">Resource Consumption</h4>
        </div>
        
        <div>
          <Label htmlFor="energyKwh">Energy (kWh)</Label>
          <Input id="energyKwh" type="number" placeholder="e.g., 50000"
            onChange={(e) => handleChange("energyKwh", parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label htmlFor="waterM3">Water (m³)</Label>
          <Input id="waterM3" type="number" placeholder="e.g., 1200"
            onChange={(e) => handleChange("waterM3", parseFloat(e.target.value) || 0)} />
        </div>
        
         <div className="md:col-span-2 border-t pt-4">
           <h4 className="text-sm font-medium text-gray-500">Waste & Emissions</h4>
        </div>
        
         <div>
          <Label htmlFor="wasteTotalT">Total Waste (t)</Label>
          <Input id="wasteTotalT" type="number" placeholder="e.g., 50"
            onChange={(e) => handleChange("wasteTotalT", parseFloat(e.target.value) || 0)} />
        </div>
         <div>
          <Label htmlFor="wasteRecycledT">Recycled Waste (t)</Label>
          <Input id="wasteRecycledT" type="number" placeholder="e.g., 35"
            onChange={(e) => handleChange("wasteRecycledT", parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label htmlFor="co2T">CO₂ (t)</Label>
          <Input id="co2T" type="number" placeholder="e.g., 25"
            onChange={(e) => handleChange("co2T", parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label htmlFor="renewablePercent">Renewable %</Label>
          <Input id="renewablePercent" type="number" placeholder="e.g., 20"
            onChange={(e) => handleChange("renewablePercent", parseFloat(e.target.value) || 0)} />
        </div>
        
         <div className="md:col-span-2 border-t pt-4">
           <h4 className="text-sm font-medium text-gray-500">Production (for KPIs)</h4>
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="unitsProduced">Total Units Produced</Label>
          <Input id="unitsProduced" type="number" placeholder="e.g., 110000"
            onChange={(e) => handleChange("unitsProduced", parseFloat(e.target.value) || 0)} />
        </div>
        
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button className="bg-[#0B3D91] hover:bg-[#082f70]" onClick={handleSubmit}>
          <Check className="mr-2 h-4 w-4" />
          Log Data
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};