// src/pages/RCA.tsx
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Target,
  PlusCircle,
  FileText,
  TrendingUp,
  Brain,
  Info,
  Filter,
  Check,
  Zap,
  AlertTriangle,
  Clock,
  UserCheck,
} from "lucide-react";
import type { RcaAction, RcaKpi, RcaStatusData, RcaSlaData } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// --- Mock Data (Replace with API calls) ---

const mockKpis: RcaKpi[] = [
  {
    title: "Action Closure %",
    value: "75%",
    formula: "(Closed / Total) × 100",
    progress: 75,
  },
  {
    title: "Overdue Actions",
    value: "3",
    formula: "Count(>DueDate)",
    progress: 15, // Assuming 3/20 actions are overdue
    invertProgressColor: true,
  },
  {
    title: "Avg. Closure Time",
    value: "8.2 Days",
    formula: "Avg(Close Date - Open Date)",
  },
  {
    title: "Total Open Actions",
    value: "5",
    formula: "All open and in-progress actions",
  },
];

const mockRcaActions: RcaAction[] = [
  {
    id: "CA-001",
    relatedIncident: "INC-1023",
    rootCause: "Improper machine guarding",
    assignedTo: "S. Gupta",
    dueDate: new Date("2025-11-15"),
    status: "In Progress",
  },
  {
    id: "CA-002",
    relatedIncident: "A-102",
    rootCause: "Poor 5S (Sort step)",
    assignedTo: "V. Patel",
    dueDate: new Date("2025-11-10"),
    status: "Closed",
  },
  {
    id: "CA-003",
    relatedIncident: "INC-1024",
    rootCause: "Pedestrian walkway not marked",
    assignedTo: "R. Singh",
    dueDate: new Date("2025-11-01"),
    status: "Overdue",
  },
  {
    id: "CA-004",
    relatedIncident: "A-104",
    rootCause: "Forklift operator training lapsed",
    assignedTo: "A. Khan",
    dueDate: new Date("2025-11-20"),
    status: "Open",
  },
];

const mockStatusData: RcaStatusData[] = [
  { name: "Closed", value: 15, fill: "#00A79D" },
  { name: "In Progress", value: 3, fill: "#0B3D91" },
  { name: "Open", value: 2, fill: "#FFC107" },
  { name: "Overdue", value: 3, fill: "#E53935" },
];

const mockSlaData: RcaSlaData[] = [
  { name: "On Time", value: 15, fill: "#00A79D" },
  { name: "Overdue", value: 3, fill: "#E53935" },
];

// --- Main RCA Page Component ---

export const RCA: React.FC = () => {
  const [kpis, setKpis] = useState<RcaKpi[]>([]);
  const [actions, setActions] = useState<RcaAction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<RcaAction | null>(null);

  // --- Data Fetching (Backend Logic) ---
  useEffect(() => {
    // TODO: Replace with API calls
    setKpis(mockKpis);
    setActions(mockRcaActions);
  }, []);

  const handleFilterChange = () => {
    // TODO: Add filter state and re-fetch data
    // const query = new URLSearchParams({ assignedTo, status }).toString();
    // fetch(`/api/rca/filter?${query}`)
    //   .then(res => res.json())
    //   .then(data => setActions(data));
    console.log("Filtering data...");
  };

  const handleFormSubmit = async (formData: Partial<RcaAction>) => {
    console.log("Creating new action:", formData);
    // TODO: Replace with API call
    /*
    try {
      const response = await fetch('/api/rca/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to submit');
      const newAction = await response.json();
      setActions([newAction, ...actions]);
      setIsModalOpen(false);
      toast.success("Success", { description: "New corrective action created." });
    } catch (error) {
      toast.error("Error", { description: "Could not create action." });
    }
    */
    // Mock success
    const newAction: RcaAction = {
      id: `CA-${Math.floor(Math.random() * 1000)}`,
      ...formData,
    } as RcaAction;
    setActions([newAction, ...actions]);
    setIsModalOpen(false);
    toast.success("Success", {
      description: "New corrective action created.",
    });
  };

  const handleGenerateAI = () => {
    if (!selectedAction) return;
    // TODO: API call to AI backend
    // fetch(`/api/rca/ai-prevent?id=${selectedAction.id}`)
    //   .then(res => res.json())
    //   .then(data => {
    //     // display summary
    //   })
    toast.info("AI Co-Pilot", {
      description: `Analyzing root cause for ${selectedAction.id}...`,
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
            Corrective Actions & RCA
          </h1>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="gap-2 bg-[#0B3D91] hover:bg-[#082f70]">
                  <PlusCircle className="h-5 w-5" />
                  Create New Action
                </Button>
              </motion.div>
            </DialogTrigger>
            <CreateActionModal
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
                  Action Ledger
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              {/* Ledger Tab */}
              <TabsContent value="ledger" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>All Corrective Actions (CAPA)</CardTitle>
                    <CardDescription>
                      Track all open, overdue, and closed actions.
                    </CardDescription>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2 pt-4">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Filter by Incident ID..."
                        className="w-[180px]"
                        onChange={handleFilterChange}
                      />
                      <Select onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Assigned To" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="s-gupta">S. Gupta</SelectItem>
                          <SelectItem value="v-patel">V. Patel</SelectItem>
                          <SelectItem value="r-singh">R. Singh</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <RcaTable
                      actions={actions}
                      onRowClick={(action) => setSelectedAction(action)}
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
                      <CardTitle>Open vs. Closed Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mockStatusData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={(entry) => `${entry.name} (${entry.value})`}
                          >
                            {mockStatusData.map((entry, index) => (
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
                      <CardTitle>SLA Closure Tracking</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mockSlaData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={(entry) => `${entry.name} (${entry.value})`}
                          >
                            {mockSlaData.map((entry, index) => (
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
                  AI Co-Pilot
                </CardTitle>
                <CardDescription>
                  {selectedAction
                    ? `Insights for ${selectedAction.id}`
                    : "Select an action to see AI insights"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedAction ? (
                  <>
                    {selectedAction.status === "Overdue" && (
                      <div>
                        <h4 className="font-semibold">Overdue Action Flag</h4>
                        <p className="flex items-center gap-1 text-lg font-bold text-red-600">
                          <AlertTriangle className="h-5 w-5" />
                          {/* TODO: Populate from logic */}
                          Overdue by {formatDistanceToNow(selectedAction.dueDate)}!
                        </p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold">Preventive Measure</h4>
                      <p className="text-sm text-gray-600">
                        {/* TODO: Populate from AI API */}
                        Based on root cause '{selectedAction.rootCause}', recommend updating SOP-201 and retraining all welding staff.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Related Actions</h4>
                      <p className="text-sm text-gray-600">
                        {/* TODO: Populate from AI API */}
                        2 similar actions were logged for 'Improper machine guarding' in the last 6 months.
                      </p>
                    </div>
                    <Button className="w-full gap-2" onClick={handleGenerateAI}>
                      <Zap className="h-4 w-4" />
                      Suggest Prevention
                    </Button>
                  </>
                ) : (
                  <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-center text-gray-500">
                    <p>Select an action from the table</p>
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
const KpiCard: React.FC<RcaKpi> = ({
  title,
  value,
  formula,
  progress,
  invertProgressColor = false,
}) => {
  let progressColor = "bg-blue-600"; // Default
  if (progress !== undefined) {
    if (invertProgressColor) {
      // Lower is better (e.g., Overdue %)
      progressColor = progress > 15 ? "bg-red-500" : (progress > 5 ? "bg-yellow-500" : "bg-green-600");
    } else {
      // Higher is better (e.g., Closure %)
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

// --- Sub-component: RCA Table ---
interface RcaTableProps {
  actions: RcaAction[];
  onRowClick: (action: RcaAction) => void;
}

const RcaTable: React.FC<RcaTableProps> = ({ actions, onRowClick }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Action ID</TableHead>
        <TableHead>Related Incident/Audit</TableHead>
        <TableHead>Assigned To</TableHead>
        <TableHead>Due Date</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {actions.map((action) => (
        <motion.tr
          key={action.id}
          className="cursor-pointer"
          onClick={() => onRowClick(action)}
          whileHover={{ backgroundColor: "#F7F9FB" }}
        >
          <TableCell className="font-medium">{action.id}</TableCell>
          <TableCell>{action.relatedIncident}</TableCell>
          <TableCell>{action.assignedTo}</TableCell>
          <TableCell>
            <div className={cn(
              action.status === "Overdue" && "text-red-600 font-medium"
            )}>
              {action.dueDate.toLocaleDateString()}
            </div>
          </TableCell>
          <TableCell>
            <Badge
              className={cn(
                action.status === "Closed" && "border-green-600 text-green-600",
                action.status === "Overdue" && "border-red-600 text-red-600",
                action.status === "In Progress" && "border-yellow-600 text-yellow-600",
                action.status === "Open" && "border-gray-500 text-gray-500"
              )}
              variant="outline"
            >
              {action.status}
            </Badge>
          </TableCell>
        </motion.tr>
      ))}
    </TableBody>
  </Table>
);

// --- Sub-component: Create Action Modal ---
interface CreateActionModalProps {
  onSubmit: (formData: Partial<RcaAction>) => void;
  onClose: () => void;
}

const CreateActionModal: React.FC<CreateActionModalProps> = ({
  onSubmit,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<RcaAction>>({
    status: "Open",
  });

  const handleSubmit = () => {
    // Basic validation
    if (!formData.relatedIncident || !formData.rootCause || !formData.assignedTo || !formData.dueDate) {
      toast.error("Error", { description: "Please fill in all required fields." });
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (key: keyof RcaAction, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Target className="h-6 w-6" /> Create New Corrective Action
        </DialogTitle>
        <DialogDescription>
          Assign a new action based on an incident or audit finding.
        </DialogDescription>
      </DialogHeader>
      <div className="grid max-h-[60vh] grid-cols-1 gap-4 overflow-y-auto p-1 md:grid-cols-2">
        <Input 
          placeholder="Related Incident/Audit ID (e.g., INC-1023)"
          className="md:col-span-2"
          onChange={(e) => handleChange("relatedIncident", e.target.value)}
        />
        
        <div className="md:col-span-2">
           <label className="text-sm font-medium">Root Cause</label>
           <Textarea 
             placeholder="Describe the root cause of the issue..."
             onChange={(e) => handleChange("rootCause", e.target.value)}
           />
        </div>

        <Select onValueChange={(val) => handleChange("assignedTo", val)}>
          <SelectTrigger>
            <SelectValue placeholder="Assigned To" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="S. Gupta">S. Gupta</SelectItem>
            <SelectItem value="V. Patel">V. Patel</SelectItem>
            <SelectItem value="R. Singh">R. Singh</SelectItem>
            <SelectItem value="A. Khan">A. Khan</SelectItem>
          </SelectContent>
        </Select>

        <div>
          <label className="text-sm font-medium">Due Date</label>
          <DatePicker
            date={formData.dueDate as Date | undefined}
            onSelect={(date) => handleChange("dueDate", date)}
          />
        </div>

        {/* Wrap the Select in a div and apply the layout class to it */}
        <div className="md:col-span-2"> 
          <Select 
            defaultValue="Open"
            onValueChange={(val) => handleChange("status", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
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
          Create Action
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};