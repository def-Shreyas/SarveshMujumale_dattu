// src/pages/PPE.tsx
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  HardHat,
  PlusCircle,
  FileText,
  TrendingUp,
  Brain,
  Info,
  Filter,
  Check,
  Zap,
  Boxes,
  MinusCircle,
  AlertTriangle,
  ShoppingCart,
  Truck,
} from "lucide-react";
import type {
  PpeItem,
  PpeKpi,
  PpeUsageData,
  PpeStockData,
  ReorderItem,
} from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// --- Mock Data (Replace with API calls) ---

const mockKpis: PpeKpi[] = [
  {
    title: "Overall Utilization",
    value: "78%",
    formula: "(Issued / Purchased) × 100",
    progress: 78,
  },
  {
    title: "Stock Turnover Rate",
    value: "2.5",
    formula: "COGS / Avg. Inventory",
  },
  {
    title: "Low Stock Alerts",
    value: "3 Items",
    formula: "Items < 15% threshold",
    progress: 10, // Assuming 3/30 items are low
    invertProgressColor: true,
  },
  {
    title: "Expired Stock",
    value: "1 Item",
    formula: "Items past expiry date",
    progress: 3, // Assuming 1/30 items
    invertProgressColor: true,
  },
];

const mockPpeStock: PpeItem[] = [
  {
    id: "PPE-001",
    name: "Safety Helmet",
    supplier: "SafeInc",
    totalPurchased: 200,
    totalIssued: 150,
    balance: 50,
    expiryDate: new Date("2026-10-31"),
    status: "In Stock",
  },
  {
    id: "PPE-002",
    name: "Cut-Resist Gloves",
    supplier: "GloveCo",
    totalPurchased: 500,
    totalIssued: 480,
    balance: 20,
    expiryDate: new Date("2026-05-31"),
    status: "Low Stock",
  },
  {
    id: "PPE-003",
    name: "Safety Goggles",
    supplier: "SafeInc",
    totalPurchased: 300,
    totalIssued: 200,
    balance: 100,
    expiryDate: new Date("2027-01-31"),
    status: "In Stock",
  },
  {
    id: "PPE-004",
    name: "Respirator Cartridge",
    supplier: "3M",
    totalPurchased: 100,
    totalIssued: 100,
    balance: 0,
    expiryDate: new Date("2025-11-30"),
    status: "Out of Stock",
  },
  {
    id: "PPE-005",
    name: "Fall Arrest Harness",
    supplier: "SafeInc",
    totalPurchased: 50,
    totalIssued: 45,
    balance: 5,
    expiryDate: new Date("2025-09-30"),
    status: "Expired",
  },
];

const mockUsageData: PpeUsageData[] = [
  { month: "May", Purchased: 200, Issued: 150 },
  { month: "Jun", Purchased: 150, Issued: 180 },
  { month: "Jul", Purchased: 300, Issued: 250 },
  { month: "Aug", Purchased: 200, Issued: 220 },
  { month: "Sep", Purchased: 400, Issued: 350 },
  { month: "Oct", Purchased: 100, Issued: 120 },
];

const mockStockData: PpeStockData[] = [
  { name: "Helmets", value: 50, fill: "#0B3D91" },
  { name: "Gloves", value: 20, fill: "#E53935" },
  { name: "Goggles", value: 100, fill: "#00A79D" },
  { name: "Harnesses", value: 5, fill: "#FFC107" },
];

const mockReorderList: ReorderItem[] = [
  { id: "PPE-002", name: "Cut-Resist Gloves", supplier: "GloveCo", currentStock: 20, predictedStockOut: "In 3 days", suggestedQuantity: 500 },
  { id: "PPE-004", name: "Respirator Cartridge", supplier: "3M", currentStock: 0, predictedStockOut: "Now", suggestedQuantity: 150 },
  { id: "PPE-005", name: "Fall Arrest Harness", supplier: "SafeInc", currentStock: 5, predictedStockOut: "In 2 days", suggestedQuantity: 50 },
];

// --- Main PPE Page Component ---

export const PPE: React.FC = () => {
  const [kpis, setKpis] = useState<PpeKpi[]>([]);
  const [stock, setStock] = useState<PpeItem[]>([]);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isIssueStockOpen, setIsIssueStockOpen] = useState(false);
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [selectedPpe, setSelectedPpe] = useState<PpeItem | null>(null);

  // --- Data Fetching (Backend Logic) ---
  useEffect(() => {
    // TODO: Replace with API calls
    setKpis(mockKpis);
    setStock(mockPpeStock);
  }, []);

  const handleFilterChange = () => {
    // TODO: Add filter state and re-fetch data
    // const query = new URLSearchParams({ type, status }).toString();
    // fetch(`/api/ppe/filter?${query}`)
    //   .then(res => res.json())
    //   .then(data => setStock(data));
    console.log("Filtering data...");
  };

  const handleAddStock = async (formData: Partial<PpeItem>) => {
    console.log("Adding new stock:", formData);
    // TODO: Replace with API call
    /*
    try {
      const response = await fetch('/api/ppe/add-stock', { ... });
      if (!response.ok) throw new Error('Failed to submit');
      const updatedStock = await response.json();
      setStock(updatedStock);
      setIsAddStockOpen(false);
      toast.success("Success", { description: "New stock added to inventory." });
    } catch (error) {
      toast.error("Error", { description: "Could not add stock." });
    }
    */
    // Mock success
    const newItem: PpeItem = {
      id: `PPE-${Math.floor(Math.random() * 1000)}`,
      totalIssued: 0,
      balance: formData.totalPurchased || 0,
      status: "In Stock",
      ...formData,
    } as PpeItem;
    setStock([newItem, ...stock]);
    setIsAddStockOpen(false);
    toast.success("Success", { description: "New stock added." });
  };

  const handleIssueStock = async (formData: { ppeId: string; department: string; quantity: number }) => {
    console.log("Issuing stock:", formData);
     // TODO: Replace with API call
    /*
    try {
      const response = await fetch('/api/ppe/issue-stock', { ... });
      if (!response.ok) throw new Error('Failed to submit');
      const updatedStockItem = await response.json();
      // Update the item in the local state
      setStock(stock.map(item => item.id === updatedStockItem.id ? updatedStockItem : item));
      setIsIssueStockOpen(false);
      toast.success("Success", { description: "Stock issued successfully." });
    } catch (error) {
      toast.error("Error", { description: "Could not issue stock." });
    }
    */
    // Mock success
    const targetItem = stock.find(item => item.id === formData.ppeId);
    if (targetItem) {
      targetItem.totalIssued += formData.quantity;
      targetItem.balance = targetItem.totalPurchased - targetItem.totalIssued;
      if (targetItem.balance / targetItem.totalPurchased < 0.15) {
        targetItem.status = "Low Stock";
      }
      if (targetItem.balance <= 0) {
        targetItem.status = "Out of Stock";
      }
    }
    setIsIssueStockOpen(false);
    toast.success("Success", { description: `Issued ${formData.quantity} to ${formData.department}.` });
  };

  const handleGenerateReorderList = () => {
    // TODO: API call to AI backend
    // fetch(`/api/ppe/ai-reorder-list`)
    //   .then(res => res.json())
    //   .then(data => {
    //     // setReorderList(data);
    //   })
    setIsReorderOpen(true); // Open the reorder list modal
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Assets & PPE Management
          </h1>
          <div className="flex gap-2">
            <Dialog open={isIssueStockOpen} onOpenChange={setIsIssueStockOpen}>
              <DialogTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="outline" className="gap-2">
                    <MinusCircle className="h-5 w-5" />
                    Issue Stock
                  </Button>
                </motion.div>
              </DialogTrigger>
              <IssuePpeModal
                stockItems={stock}
                onSubmit={handleIssueStock}
                onClose={() => setIsIssueStockOpen(false)}
              />
            </Dialog>
            
            <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
              <DialogTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="gap-2 bg-[#0B3D91] hover:bg-[#082f70]">
                    <PlusCircle className="h-5 w-5" />
                    Add New Stock
                  </Button>
                </motion.div>
              </DialogTrigger>
              <AddPpeStockModal
                onSubmit={handleAddStock}
                onClose={() => setIsAddStockOpen(false)}
              />
            </Dialog>
          </div>
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
                  Stock Ledger
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Usage Analytics
                </TabsTrigger>
                <TabsTrigger value="alerts">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Reorder Alerts
                </TabsTrigger>
              </TabsList>

              {/* Ledger Tab */}
              <TabsContent value="ledger" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>PPE Inventory Ledger</CardTitle>
                    <CardDescription>
                      Live inventory of all PPE items.
                    </CardDescription>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2 pt-4">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <Select onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select PPE Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="helmet">Safety Helmet</SelectItem>
                          <SelectItem value="gloves">Cut-Resist Gloves</SelectItem>
                          <SelectItem value="goggles">Safety Goggles</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in-stock">In Stock</SelectItem>
                          <SelectItem value="low-stock">Low Stock</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PpeTable
                      stock={stock}
                      onRowClick={(item) => setSelectedPpe(item)}
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
                      <CardTitle>Usage vs. Purchase (6 Months)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockUsageData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" fontSize={12} />
                          <YAxis fontSize={12} />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="Purchased" fill="#0B3D91" />
                          <Bar dataKey="Issued" fill="#00A79D" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Stock Summary by Type</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mockStockData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={(entry) => `${entry.name} (${entry.value})`}
                          >
                            {mockStockData.map((entry, index) => (
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

              {/* Reorder Alerts Tab */}
              <TabsContent value="alerts" className="mt-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Accordion type="multiple" defaultValue={["low-stock", "expired"]}>
                    <AccordionItem value="low-stock">
                      <AccordionTrigger className="text-lg font-semibold text-yellow-600">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Low Stock Items (1)
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {/* TODO: Populate with real data */}
                        <p>PPE-002: Cut-Resist Gloves - 20 remaining</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="out-of-stock">
                      <AccordionTrigger className="text-lg font-semibold text-red-600">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Out of Stock Items (1)
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {/* TODO: Populate with real data */}
                        <p>PPE-004: Respirator Cartridge - 0 remaining</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="expired">
                      <AccordionTrigger className="text-lg font-semibold text-red-600">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Expired Stock (1)
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {/* TODO: Populate with real data */}
                        <p>PPE-005: Fall Arrest Harness - 5 expired on 2025-09-30</p>
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
                  {selectedPpe
                    ? `Insights for ${selectedPpe.name}`
                    : "Select an item to see AI insights"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPpe ? (
                  <>
                    <div>
                      <h4 className="font-semibold">Predicted Stock-Out</h4>
                      <p className={cn(
                        "text-sm font-bold",
                        selectedPpe.status === "Low Stock" ? "text-red-600" : "text-gray-600"
                      )}>
                        {/* TODO: Populate from AI API */}
                        {selectedPpe.status === "Low Stock" ? "In approx. 3 days" : "In 25 days"}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">High-Usage Departments</h4>
                      <ul className="list-disc pl-5 text-sm text-gray-600">
                        {/* TODO: Populate from AI API */}
                        <li>Assembly (60%)</li>
                        <li>Welding (30%)</li>
                        <li>Maintenance (10%)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold">Suggested Reorder Qty</h4>
                      <p className="text-lg font-bold text-gray-900">
                         {/* TODO: Populate from AI API */}
                        {selectedPpe.name === "Cut-Resist Gloves" ? 500 : 200} units
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-center text-gray-500">
                    <p>Select a PPE item from the table</p>
                  </div>
                )}
                <Button 
                  className="w-full gap-2" 
                  onClick={handleGenerateReorderList}
                >
                  <Zap className="h-4 w-4" />
                  Auto-Generate Reorder List
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Reorder List Modal */}
        <Dialog open={isReorderOpen} onOpenChange={setIsReorderOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                AI-Generated Reorder List
              </DialogTitle>
              <DialogDescription>
                Based on current stock, usage trends, and predicted stock-outs.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Predicted Stock-Out</TableHead>
                    <TableHead>Suggested Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* TODO: Populate with real AI data */}
                  {mockReorderList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="font-bold text-red-600">{item.currentStock}</TableCell>
                      <TableCell className="font-medium text-yellow-600">{item.predictedStockOut}</TableCell>
                      <TableCell className="font-bold text-green-600">{item.suggestedQuantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReorderOpen(false)}>
                Close
              </Button>
              <Button className="gap-2 bg-[#0B3D91] hover:bg-[#082f70]">
                <Truck className="mr-2 h-4 w-4" />
                Create Purchase Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  );
};

// --- Sub-component: KPI Card ---
const KpiCard: React.FC<PpeKpi> = ({
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
              indicatorClassName={cn("!bg-primary", progressColor)}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// --- Sub-component: PPE Table ---
interface PpeTableProps {
  stock: PpeItem[];
  onRowClick: (item: PpeItem) => void;
}

const PpeTable: React.FC<PpeTableProps> = ({ stock, onRowClick }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Item Name</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Balance</TableHead>
        <TableHead>Expiry Date</TableHead>
        <TableHead>Supplier</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {stock.map((item) => (
        <motion.tr
          key={item.id}
          className="cursor-pointer"
          onClick={() => onRowClick(item)}
          whileHover={{ backgroundColor: "#F7F9FB" }}
        >
          <TableCell className="font-medium">{item.name}</TableCell>
          <TableCell>
            <Badge
              className={cn(
                item.status === "In Stock" && "border-green-600 text-green-600",
                item.status === "Low Stock" && "border-yellow-600 text-yellow-600",
                item.status === "Out of Stock" && "border-red-600 text-red-600",
                item.status === "Expired" && "border-red-800 bg-red-100 text-red-800"
              )}
              variant="outline"
            >
              {item.status}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <span className="font-bold">{item.balance}</span>
              <Progress 
                value={(item.balance / item.totalPurchased) * 100} 
                className="h-2 w-20"
                indicatorClassName={cn(
                  "!bg-primary", 
                  item.balance / item.totalPurchased < 0.15 ? "bg-red-500" : "bg-green-500"
                )}
              />
            </div>
          </TableCell>
          <TableCell>{item.expiryDate.toLocaleDateString()}</TableCell>
          <TableCell>{item.supplier}</TableCell>
        </motion.tr>
      ))}
    </TableBody>
  </Table>
);

// --- Sub-component: Add Stock Modal ---
interface AddPpeStockModalProps {
  onSubmit: (formData: Partial<PpeItem>) => void;
  onClose: () => void;
}

const AddPpeStockModal: React.FC<AddPpeStockModalProps> = ({
  onSubmit,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<PpeItem>>({});

  const handleSubmit = () => {
    // Basic validation
    if (!formData.name || !formData.supplier || !formData.totalPurchased || !formData.purchaseDate || !formData.expiryDate) {
      toast.error("Error", { description: "Please fill in all fields." });
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (key: keyof PpeItem, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Boxes className="h-6 w-6" /> Add New PPE Stock
        </DialogTitle>
        <DialogDescription>
          Add a new purchase order or stock item to the inventory.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
        <Input 
          placeholder="Item Name (e.g., Safety Helmet)"
          className="md:col-span-2"
          onChange={(e) => handleChange("name", e.target.value)}
        />
        <Input 
          placeholder="Supplier (e.g., SafeInc)"
          onChange={(e) => handleChange("supplier", e.target.value)}
        />
        <Input 
          type="number"
          placeholder="Quantity Purchased"
          onChange={(e) => handleChange("totalPurchased", parseInt(e.target.value) || 0)}
        />
        <div>
          <label className="text-sm font-medium">Purchase Date</label>
          <DatePicker
            date={formData.purchaseDate as Date | undefined}
            onSelect={(date) => handleChange("purchaseDate", date)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Expiry Date</label>
          <DatePicker
            date={formData.expiryDate as Date | undefined}
            onSelect={(date) => handleChange("expiryDate", date)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button className="bg-[#0B3D91] hover:bg-[#082f70]" onClick={handleSubmit}>
          <Check className="mr-2 h-4 w-4" />
          Add to Stock
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

// --- Sub-component: Issue Stock Modal ---
interface IssuePpeModalProps {
  stockItems: PpeItem[];
  onSubmit: (formData: { ppeId: string; department: string; quantity: number }) => void;
  onClose: () => void;
}

const IssuePpeModal: React.FC<IssuePpeModalProps> = ({
  stockItems,
  onSubmit,
  onClose,
}) => {
  const [ppeId, setPpeId] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);

  const handleSubmit = () => {
    // Basic validation
    if (!ppeId || !department || quantity <= 0) {
      toast.error("Error", { description: "Please fill in all fields correctly." });
      return;
    }
    onSubmit({ ppeId, department, quantity });
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <MinusCircle className="h-6 w-6" /> Issue PPE Stock
        </DialogTitle>
        <DialogDescription>
          Issue stock to a department and update inventory.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <Select onValueChange={setPpeId}>
          <SelectTrigger>
            <SelectValue placeholder="Select PPE Item" />
          </SelectTrigger>
          <SelectContent>
            {stockItems
              .filter(item => item.status !== "Out of Stock")
              .map(item => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} (Balance: {item.balance})
                </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setDepartment}>
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
        <Input 
          type="number"
          placeholder="Quantity Issued"
          onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button className="bg-[#00A79D] hover:bg-[#008a7e]" onClick={handleSubmit}>
          <Check className="mr-2 h-4 w-4" />
          Issue Stock
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};