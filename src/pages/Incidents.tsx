// src/pages/Incidents.tsx
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
import { DatePicker } from "@/components/ui/date-picker"; // Assuming you created this
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
  PlusCircle,
  FileText,
  TrendingUp,
  Brain,
  AlertOctagon,
  Info,
  Filter,
  Check,
  Zap,
} from "lucide-react";
import type {
  Incident,
  IncidentKpi,
  IncidentSummaryData,
  InjuryTypeData,
} from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Import from sonner// Assumes you have sonner/toast

// --- Mock Data (Replace with API calls) ---

const mockKpis: IncidentKpi[] = [
  {
    title: "LTIFR",
    value: "1.22",
    formula: "(LTI × 1,000,000) / Hours Worked",
  },
  {
    title: "TRIR",
    value: "0.58",
    formula: "(Total Recordables × 200,000) / Hours Worked",
  },
  {
    title: "NMFR",
    value: "4.10",
    formula: "(Near Misses × 200,000) / Hours Worked",
  },
  {
    title: "Avg. Days Lost",
    value: "3.5",
    formula: "Total Days Lost / No. of LTIs",
  },
];

const mockIncidents: Incident[] = [
  {
    id: "INC-1024",
    date: new Date("2025-10-28"),
    department: "Assembly",
    type: "Near Miss",
    severity: "Medium",
    description: "Forklift almost hit operator",
    status: "In Progress",
  },
  {
    id: "INC-1023",
    date: new Date("2025-10-25"),
    department: "Welding",
    type: "LTI",
    severity: "High",
    description: "Burn injury to hand",
    daysLost: 5,
    status: "Open",
  },
  {
    id: "INC-1022",
    date: new Date("2025-10-22"),
    department: "Maintenance",
    type: "First Aid",
    severity: "Low",
    description: "Minor cut on finger",
    status: "Closed",
  },
];

const mockChartData: IncidentSummaryData[] = [
  { name: "Assembly", "LTI": 1, "Near Miss": 3, "First Aid": 5 },
  { name: "Welding", "LTI": 2, "Near Miss": 1, "First Aid": 2 },
  { name: "Maintenance", "LTI": 0, "Near Miss": 0, "First Aid": 4 },
  { name: "Logistics", "LTI": 0, "Near Miss": 2, "First Aid": 1 },
];

const mockPieData: InjuryTypeData[] = [
  { name: "Cuts & Lacerations", value: 40, fill: "#FFC107" },
  { name: "Burns", value: 25, fill: "#E53935" },
  { name: "Slips & Falls", value: 15, fill: "#0B3D91" },
  { name: "Other", value: 20, fill: "#00A79D" },
];

// --- Main Incident Page Component ---

export const Incidents: React.FC = () => {
  const [kpis, setKpis] = useState<IncidentKpi[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [filterDate, setFilterDate] = useState<Date | undefined>();

  // const { toast } = useToast(); // For notifications

  // --- Data Fetching (Backend Logic) ---
  useEffect(() => {
    // TODO: Replace with API call
    // fetch('/api/incidents/kpis').then(res => res.json()).then(data => setKpis(data));
    setKpis(mockKpis);

    // TODO: Replace with API call
    // fetch('/api/incidents/all').then(res => res.json()).then(data => setIncidents(data));
    setIncidents(mockIncidents);
  }, []);

  const handleFilterChange = () => {
    // TODO: Add filter state and re-fetch data
    // const query = new URLSearchParams({ date, dept, severity }).toString();
    // fetch(`/api/incidents/filter?${query}`)
    //   .then(res => res.json())
    //   .then(data => setIncidents(data));
    console.log("Filtering data...");
  };

  const handleFormSubmit = async (formData: Partial<Incident>) => {
    console.log("Submitting new incident:", formData);
    // TODO: Replace with API call
    /*
    try {
      const response = await fetch('/api/incidents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to submit');
      const newIncident = await response.json();
      setIncidents([newIncident, ...incidents]);
      setIsModalOpen(false);
      toast({ title: "Success", description: "New incident reported." });
    } catch (error) {
      toast({ title: "Error", description: "Could not submit incident." });
    }
    */
    // Mock success
    const newIncident: Incident = {
      id: `INC-${Math.floor(Math.random() * 1000)}`,
      date: new Date(),
      status: "Open",
      ...formData,
    } as Incident;
    setIncidents([newIncident, ...incidents]);
    setIsModalOpen(false);
     toast.success("Success", { description: "New incident reported." });
  };
  
  const handleGenerateAISummary = () => {
    if (!selectedIncident) return;
    // TODO: API call to AI backend
    // fetch(`/api/incidents/ai-summary?id=${selectedIncident.id}`)
    //   .then(res => res.json())
    //   .then(data => {
    //     // setAiSummary(data.summary)
    //   })
    alert(`Generating AI summary for ${selectedIncident.id}...`);
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
            Incidents & Near-Misses
          </h1>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="gap-2 bg-[#0B3D91] hover:bg-[#082f70]">
                  <PlusCircle className="h-5 w-5" />
                  Report New Incident
                </Button>
              </motion.div>
            </DialogTrigger>
            <ReportIncidentModal
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
                  Incident Records
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Visual Analytics
                </TabsTrigger>
              </TabsList>
              
              {/* Records Tab */}
              <TabsContent value="records" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>All Incidents</CardTitle>
                    <CardDescription>
                      Filter, sort, and manage all reported incidents.
                    </CardDescription>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2 pt-4">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <DatePicker 
                        date={filterDate}
                        onSelect={(date) => {
                        setFilterDate(date);
                        handleFilterChange(); // Optionally filter immediately
                            }}
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
                          <SelectValue placeholder="Severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <IncidentTable 
                      incidents={incidents} 
                      onRowClick={(inc) => setSelectedIncident(inc)}
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
                      <CardTitle>Incidents by Department</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis fontSize={12} />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="LTI" fill="#E53935" />
                          <Bar dataKey="Near Miss" fill="#FFC107" />
                          <Bar dataKey="First Aid" fill="#00A79D" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Injury Type Distribution</CardTitle>
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
                            label={(entry) => `${entry.name} (${entry.value}%)`}
                          >
                            {mockPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
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
            <Card className="sticky top-20"> {/* Sticky for long pages */}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-[#0B3D91]" />
                  AI Co-Pilot
                </CardTitle>
                <CardDescription>
                  {selectedIncident
                    ? `Insights for ${selectedIncident.id}`
                    : "Select an incident to see AI insights"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedIncident ? (
                  <>
                    <div>
                      <h4 className="font-semibold">Management Summary (Draft)</h4>
                      <p className="text-sm text-gray-600">
                        {/* TODO: Populate from AI API */}
                        A {selectedIncident.severity.toLowerCase()} severity {selectedIncident.type.toLowerCase()} occurred in {selectedIncident.department} on {selectedIncident.date.toLocaleDateString()}...
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Probable Causes (Auto-RCA)</h4>
                      <ul className="list-disc pl-5 text-sm text-gray-600">
                        {/* TODO: Populate from AI API */}
                        <li>Probable Cause 1...</li>
                        <li>Probable Cause 2...</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold">Recurring Patterns</h4>
                      <p className="flex items-center gap-1 text-sm text-red-600">
                        <AlertOctagon className="h-4 w-4" />
                        {/* TODO: Populate from AI API */}
                        3 similar incidents in {selectedIncident.department} in 60 days.
                      </p>
                    </div>
                    <Button className="w-full gap-2" onClick={handleGenerateAISummary}>
                      <Zap className="h-4 w-4" />
                      Regenerate AI Insights
                    </Button>
                  </>
                ) : (
                  <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-center text-gray-500">
                    <p>Select an incident from the table</p>
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
const KpiCard: React.FC<IncidentKpi> = ({ title, value, formula }) => (
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

// --- Sub-component: Incident Table ---
interface IncidentTableProps {
  incidents: Incident[];
  onRowClick: (incident: Incident) => void;
}

const IncidentTable: React.FC<IncidentTableProps> = ({ incidents, onRowClick }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Incident ID</TableHead>
        <TableHead>Date</TableHead>
        <TableHead>Department</TableHead>
        <TableHead>Type</TableHead>
        <TableHead>Severity</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {incidents.map((incident) => (
        <motion.tr
          key={incident.id}
          className="cursor-pointer"
          onClick={() => onRowClick(incident)}
          whileHover={{ backgroundColor: "#F7F9FB" }} // Your app's bg color
        >
          <TableCell className="font-medium">{incident.id}</TableCell>
          <TableCell>{incident.date.toLocaleDateString()}</TableCell>
          <TableCell>{incident.department}</TableCell>
          <TableCell>{incident.type}</TableCell>
          <TableCell>
            <Badge
              className={cn(
                incident.severity === "High" && "bg-red-100 text-red-800",
                incident.severity === "Medium" && "bg-yellow-100 text-yellow-800",
                incident.severity === "Low" && "bg-green-100 text-green-800"
              )}
            >
              {incident.severity}
            </Badge>
          </TableCell>
          <TableCell>
            <Badge
              variant={incident.status === "Closed" ? "default" : "outline"}
            >
              {incident.status}
            </Badge>
          </TableCell>
        </motion.tr>
      ))}
    </TableBody>
  </Table>
);

// --- Sub-component: Report Incident Modal ---
interface ReportIncidentModalProps {
  onSubmit: (formData: Partial<Incident>) => void;
  onClose: () => void;
}

const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  onSubmit,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<Incident>>({
    status: "Open",
    severity: "Low",
    type: "Near Miss",
  });

  const handleSubmit = () => {
    // Basic validation
    if (!formData.date || !formData.department || !formData.description) {
      alert("Please fill in Date, Department, and Description.");
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (key: keyof Incident, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
<DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Report New Incident</DialogTitle>
        <DialogDescription>
          Fill in the details of the incident or near miss.
        </DialogDescription>
      </DialogHeader>
      <div className="grid max-h-[60vh] grid-cols-1 gap-4 overflow-y-auto p-1 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Incident Date</label>
          <DatePicker 
            // 1. ADDED THIS DATE PROP
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
        <Select 
          defaultValue="Near Miss" 
          onValueChange={(val) => handleChange("type", val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Incident Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Near Miss">Near Miss</SelectItem>
            <SelectItem value="First Aid">First Aid</SelectItem>
            <SelectItem value="Property Damage">Property Damage</SelectItem>
            <SelectItem value="LTI">LTI (Lost Time Injury)</SelectItem>
          </SelectContent>
        </Select>
        <Select
          defaultValue="Low"
          onValueChange={(val) => handleChange("severity", val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Low">Low</SelectItem>
            {/* 2. REMOVED THE </M> TYPO HERE */}
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            placeholder="Describe what happened..."
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Initial Cause (Optional)</label>
          <Textarea
            placeholder="Initial thoughts on the cause..."
            onChange={(e) => handleChange("cause", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Corrective Action (Optional)</label>
          <Textarea
            placeholder="Immediate actions taken..."
            onChange={(e) => handleChange("correctiveAction", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Days Lost (if LTI)</label>
          <Input 
            type="number" 
            placeholder="0"
            onChange={(e) => handleChange("daysLost", parseInt(e.target.value) || 0)} 
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button className="bg-[#0B3D91] hover:bg-[#082f70]" onClick={handleSubmit}>
          <Check className="mr-2 h-4 w-4" />
          Submit Report
        </Button>
    </DialogFooter>
  </DialogContent>
  );
};