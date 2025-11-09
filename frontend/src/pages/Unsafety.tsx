// src/pages/Unsafety.tsx
"use client";
import React, { useRef, useEffect, useState } from "react"; // Added React
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion"; // Added AnimatePresence
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Loader2,
  Sparkles,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

// --- AI Motivational Quotes ---
const aiQuotes = [
  "AI is transforming the way we analyze safety data...",
  "Machine learning helps us identify patterns we couldn't see before...",
  "Every dataset tells a story, AI helps us read it...",
  "Intelligent systems are making workplaces safer...",
  "AI doesn't replace human insight, it amplifies it...",
  "Data-driven decisions powered by AI are the future of safety...",
];

// --- Color Palette ---
const COLORS = ["#0B3D91", "#00A79D", "#FFC107", "#E53935", "#64748b"];

// --- Type Definitions for Backend Data ---
interface UnsafetyCount {
  type: string;
  count: number;
}
interface AreaTrend {
  month: string;
  incidents: number;
}
interface ReportDetail {
  act: string;
  description: string;
  prevention: string;
}
interface BackendReportData {
  unsafetyData: UnsafetyCount[];
  areaData: AreaTrend[];
  reportData: ReportDetail[];
}

export const Unsafety: React.FC = () => {
  const reportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [windowWidth, setWindowWidth] = useState(1024); // RESTORED
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // --- STATE TO HOLD BACKEND DATA ---
  const [unsafetyData, setUnsafetyData] = useState<UnsafetyCount[]>([]);
  const [areaData, setAreaData] = useState<AreaTrend[]>([]);
  const [reportData, setReportData] = useState<ReportDetail[]>([]);

  // Memoize chart data
  const pieData = React.useMemo(() => {
    return unsafetyData.map((item) => ({
      name: item.type,
      value: item.count,
    }));
  }, [unsafetyData]);

  // RESTORED: Effect to track window width for responsive charts
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Rotate quotes during loading
  useEffect(() => {
    if (isGenerating) {
      const quoteInterval = setInterval(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % aiQuotes.length);
      }, 3000);
      return () => clearInterval(quoteInterval);
    }
  }, [isGenerating]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = [".xlsx", ".xls", ".csv"];
      const fileExtension = file.name
        .substring(file.name.lastIndexOf("."))
        .toLowerCase();

      if (validExtensions.includes(fileExtension)) {
        setSelectedFile(file);
        setShowDashboard(false);
      } else {
        toast.error("Invalid File Type", {
          description: "Please upload a valid Excel (.xlsx, .xls) or CSV file.",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  // --- 🚀 BACKEND LOGIC INTEGRATION 🚀 ---
  const handleGenerate = async () => {
    if (!selectedFile) {
      toast.error("No File Selected", {
        description: "Please select a file first.",
      });
      return;
    }

    setIsGenerating(true);
    setShowDashboard(false);
    setCurrentQuoteIndex(0);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // TODO: Replace this with your real backend endpoint
      // const response = await fetch("https://your-backend.api/upload-unsafety-report", { ... });
      // const data: BackendReportData = await response.json();
      
      // --- MOCKUP: Simulating backend response ---
      await new Promise((resolve) => setTimeout(resolve, 4000));
      const mockData: BackendReportData = {
        unsafetyData: [
          { type: "No PPE", count: 35 },
          { type: "Unsafe Machine Use", count: 22 },
          { type: "Slip/Trip Hazards", count: 18 },
          { type: "Fire Safety Issues", count: 12 },
          { type: "Chemical Misuse", count: 9 },
        ],
        areaData: [
          { month: "Jan", incidents: 12 },
          { month: "Feb", incidents: 18 },
          { month: "Mar", incidents: 22 },
          { month: "Apr", incidents: 25 },
          { month: "May", incidents: 30 },
        ],
        reportData: [
          {
            act: "No PPE",
            description: "Workers not wearing Personal Protective Equipment.",
            prevention: "Ensure PPE is mandatory and provide training.",
          },
          {
            act: "Unsafe Machine Use",
            description: "Machines operated without proper guarding.",
            prevention: "Install safety guards and conduct regular inspections.",
          },
          {
            act: "Slip/Trip Hazards",
            description: "Wet floors or obstructed walkways.",
            prevention: "Maintain clean floors, proper signage and lighting.",
          },
        ],
      };
      // --- End of Mockup ---

      setUnsafetyData(mockData.unsafetyData);
      setAreaData(mockData.areaData);
      setReportData(mockData.reportData);

      setIsGenerating(false);
      setShowDashboard(true);
      toast.success("Report Generated", {
        description: "Your safety dashboard is ready.",
      });

    } catch (error) {
      console.error("Error generating dashboard:", error);
      setIsGenerating(false);
      setShowDashboard(false);
      toast.error("Generation Failed", {
        description: "Could not process the file. Please try again.",
      });
    }
  };

  // --- RESTORED: Full PDF Download Logic ---
  const downloadPDF = async () => {
    try {
      if (!reportRef.current) {
        toast.error("Error", { description: "Report ref is not available" });
        return;
      }

      toast.info("Generating PDF", { description: "Please wait..." });

      // Use the button that was clicked
      const button = document.activeElement as HTMLElement;
      const originalText = button?.textContent || "Download Report";
      if (button) {
        button.textContent = "Generating...";
        button.setAttribute("disabled", "true");
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#F7F9FB", // Your app's BG color
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight,
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
      });

      if (!canvas) {
        throw new Error("Failed to capture screenshot");
      }
      
      // --- RGB Canvas Fix (from your original code) ---
      const rgbCanvas = document.createElement("canvas");
      rgbCanvas.width = canvas.width;
      rgbCanvas.height = canvas.height;
      const ctx = rgbCanvas.getContext("2d", { colorSpace: "srgb" });

      if (!ctx) {
        throw new Error("Failed to create RGB canvas context");
      }
      ctx.fillStyle = "#F7F9FB";
      ctx.fillRect(0, 0, rgbCanvas.width, rgbCanvas.height);
      ctx.drawImage(canvas, 0, 0);
      
      const cleanImgData = rgbCanvas.toDataURL("image/png", 1.0);
      // --- End of RGB Fix ---

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = rgbCanvas.width;
      const imgHeight = rgbCanvas.height;
      const ratio = imgWidth / imgHeight;

      const finalWidth = pdfWidth - 20; // 10mm margin
      const finalHeight = finalWidth / ratio;

      if (finalHeight <= pdfHeight - 20) {
        // Single page
        const yOffset = (pdfHeight - finalHeight) / 2;
        pdf.addImage(cleanImgData, "PNG", 10, yOffset, finalWidth, finalHeight, undefined, "FAST");
      } else {
        // Multi-page logic (simplified from your original)
        let position = 10;
        let pageHeight = (pdfWidth / ratio) - 20; // height of content on one page
        if(pageHeight <= 0) pageHeight = pdfHeight - 20;
        
        pdf.addImage(cleanImgData, "PNG", 10, position, finalWidth, finalHeight, undefined, "FAST");
        let heightLeft = finalHeight - pageHeight;
        
        while (heightLeft > 0) {
          position = -pageHeight + 10; // Move position up
          pdf.addPage();
          pdf.addImage(cleanImgData, "PNG", 10, position, finalWidth, finalHeight, undefined, "FAST");
          heightLeft -= pageHeight;
        }
      }

      pdf.save("Dattu_Unsafety_Report.pdf");

      if (button) {
        button.textContent = originalText;
        button.removeAttribute("disabled");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF", {
        description: `${error instanceof Error ? error.message : "Unknown error"}`,
      });

      const button = document.activeElement as HTMLElement;
      if (button) {
        button.removeAttribute("disabled");
      }
    }
  };

  // --- RENDER LOGIC ---

  // 1. UPLOAD SCREEN
  if (!showDashboard && !isGenerating) {
    return (
      <div className="w-full flex items-center justify-center py-10">
        <motion.div
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-xl border-t-4 border-[#0B3D91]">
            <CardHeader className="text-center pb-6">
              <motion.div
                className="flex justify-center mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className="p-4 rounded-full bg-gradient-to-br from-[#0B3D91]/20 to-[#00A79D]/20 border border-[#0B3D91]/30">
                  <Upload className="w-12 h-12 text-[#0B3D91]" />
                </div>
              </motion.div>
              <CardTitle className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#0B3D91] to-[#00A79D] bg-clip-text text-transparent">
                Upload Unsafe Acts Report
              </CardTitle>
              <p className="text-gray-600 text-lg">
                Upload an Excel or CSV file to generate your AI-powered
                dashboard.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#0B3D91] transition-colors duration-300 bg-gray-50"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {selectedFile ? (
                    <>
                      {selectedFile.name.endsWith(".csv") ? (
                        <FileText className="w-12 h-12 text-green-600 mb-3" />
                      ) : (
                        <FileSpreadsheet className="w-12 h-12 text-[#0B3D91] mb-3" />
                      )}
                      <p className="mb-2 text-base text-gray-700 font-semibold">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Click to change file
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="mb-2 text-base text-gray-700 font-semibold">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        Excel (.xlsx, .xls) or CSV files only
                      </p>
                    </>
                  )}
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
              </label>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedFile}
                  className="w-full bg-gradient-to-r from-[#0B3D91] to-[#00A79D] text-white font-semibold py-6 text-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate AI Dashboard
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // 2. LOADING SCREEN
  if (isGenerating) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <motion.div
          className="text-center max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="flex justify-center mb-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="p-6 rounded-full bg-gradient-to-br from-[#0B3D91]/20 to-[#00A79D]/20 border border-[#0B3D91]/30">
              <Loader2 className="w-16 h-16 text-[#0B3D91]" />
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="mb-4"
            >
              <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-[#0B3D91] to-[#00A79D] bg-clip-text text-transparent">
                Generating Your Dashboard...
              </h2>
              <div className="flex items-center justify-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-[#0B3D91] animate-pulse" />
                <p className="text-xl text-gray-600 font-medium">
                  {aiQuotes[currentQuoteIndex]}
                </p>
                <Sparkles className="w-6 h-6 text-[#00A79D] animate-pulse" />
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // 3. THE DASHBOARD
  return (
    // This div is the main container that fits inside AppLayout
    // The ref is for the PDF download
    <div ref={reportRef} id="report-content" className="w-full space-y-6">
      {/* Header Section */}
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
             <Eye className="w-8 h-8 text-[#0B3D91]" />
             AI Vision Report
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Visual analysis of unsafe acts from file: {selectedFile?.name}
          </p>
        </div>
        <Button onClick={downloadPDF} className="bg-[#0B3D91] hover:bg-[#082f70]">
          <FileText className="w-4 h-4 mr-2" />
          Download Report as PDF
        </Button>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Reported Unsafe Acts</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={unsafetyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" fontSize={10} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#0B3D91" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Unsafe Acts Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={windowWidth >= 1024 ? 110 : 90} // RESTORED
                    dataKey="value"
                    labelLine={false}
                    label={(props: any) => `${(props.percent * 100).toFixed(0)}%`} // FIXED
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Trend of Safety Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={areaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="incidents"
                    stroke="#0B3D91"
                    strokeWidth={3}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* RESTORED: Area Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Cumulative Unsafe Observations</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0B3D91" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0B3D91" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="incidents"
                    stroke="#0B3D91"
                    strokeWidth={2}
                    fill="url(#colorIncidents)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Report Section */}
      <motion.div
        className="bg-white p-6 rounded-lg shadow-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-4">
          Detailed Unsafety Report
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reportData.map((item, index) => (
            <motion.div
              key={index}
              className="p-4 rounded-lg border-l-4 border-[#0B3D91] bg-gray-50 hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
            >
              <h3 className="text-lg font-semibold mb-2 text-[#0B3D91]">
                {item.act}
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                {item.description}
              </p>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-green-700 font-medium">
                  <span className="font-semibold">Prevention:</span>{" "}
                  {item.prevention}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};