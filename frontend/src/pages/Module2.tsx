  import { useRef, useEffect, useState } from "react";
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
import { motion } from "framer-motion";
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
} from "lucide-react";

// Dummy chart data
const unsafetyData = [
  { type: "No PPE", count: 35 },
  { type: "Unsafe Machine Use", count: 22 },
  { type: "Slip/Trip Hazards", count: 18 },
  { type: "Fire Safety Issues", count: 12 },
  { type: "Chemical Misuse", count: 9 },
];
const pieData = unsafetyData.map((item) => ({
  name: item.type,
  value: item.count,
}));
const areaData = [
  { month: "Jan", incidents: 12 },
  { month: "Feb", incidents: 18 },
  { month: "Mar", incidents: 22 },
  { month: "Apr", incidents: 25 },
  { month: "May", incidents: 30 },
];
const COLORS = ["#38bdf8", "#64748b", "#22c55e", "#facc15", "#ef4444"];

// AI Motivational Quotes
const aiQuotes = [
  "AI is transforming the way we analyze safety data...",
  "Machine learning helps us identify patterns we couldn't see before...",
  "Every dataset tells a story, AI helps us read it...",
  "Intelligent systems are making workplaces safer...",
  "AI doesn't replace human insight, it amplifies it...",
  "Data-driven decisions powered by AI are the future of safety...",
  "Artificial Intelligence is unlocking new possibilities in safety analytics...",
  "Let AI handle the data crunching while you focus on insights...",
  "Smart algorithms are processing your data to reveal hidden patterns...",
  "AI-powered analytics: turning raw data into actionable safety intelligence...",
];

// Report data
const reportData = [
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
  {
    act: "Fire Safety Issues",
    description: "Fire extinguishers missing or blocked exits.",
    prevention: "Regular fire drills and equipment checks.",
  },
  {
    act: "Chemical Misuse",
    description: "Improper storage/handling of chemicals.",
    prevention: "Provide MSDS sheets and training on handling chemicals.",
  },
];

export default function UnsafetyDashboard() {
  const reportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [windowWidth, setWindowWidth] = useState(1024);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

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
      }, 3000); // Change quote every 3 seconds
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
      } else {
        alert("Please upload a valid Excel (.xlsx, .xls) or CSV file.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    try {
      setIsGenerating(true);
      setShowDashboard(false);

      // Simulate processing time (3-5 seconds)
      const processingTime = 3000 + Math.random() * 2000;
      await new Promise((resolve) => setTimeout(resolve, processingTime));

      // Here you would normally process the file
      // For now, we'll just show the dashboard
      setIsGenerating(false);
      setShowDashboard(true);
    } catch (error) {
      console.error("Error generating dashboard:", error);
      // Reset states on error
      setIsGenerating(false);
      setShowDashboard(false);
      alert("Failed to generate dashboard. Please try again.");
    }
  };

  const downloadPDF = async () => {
    try {
      if (!reportRef.current) {
        console.error("Report ref is not available");
        alert("Unable to generate PDF. The report section is not available.");
        return;
      }

      // Show a loading message
      const button = document.activeElement as HTMLElement;
      const originalText = button?.textContent || "";
      if (button) {
        button.textContent = "Generating PDF...";
        button.setAttribute("disabled", "true");
      }

      // Wait a bit to ensure DOM is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#0f172a",
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight,
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
      });

      if (!canvas) {
        throw new Error("Failed to capture screenshot");
      }

      // Convert canvas to RGB format to avoid OKLCH color issues
      // Use getImageData/putImageData to force RGB conversion
      const rgbCanvas = document.createElement("canvas");
      rgbCanvas.width = canvas.width;
      rgbCanvas.height = canvas.height;
      const ctx = rgbCanvas.getContext("2d", {
        colorSpace: "srgb",
        willReadFrequently: false,
      });

      if (!ctx) {
        throw new Error("Failed to create RGB canvas context");
      }

      // Fill with background color first
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, rgbCanvas.width, rgbCanvas.height);

      // Draw the original canvas onto RGB canvas
      // Drawing forces color space conversion from OKLCH to sRGB
      ctx.drawImage(canvas, 0, 0);

      // Create a clean image data URL that's guaranteed to be RGB
      // Convert canvas to blob first, then to data URL to ensure RGB format
      // Using blob ensures complete color space conversion
      const blob = await new Promise<Blob | null>((resolve) => {
        rgbCanvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
      });

      if (!blob) {
        throw new Error("Failed to convert canvas to blob");
      }

      // Convert blob to base64 data URL
      const reader = new FileReader();
      const cleanImgData = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to read blob as data URL"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate image dimensions from RGB canvas
      const imgWidth = rgbCanvas.width;
      const imgHeight = rgbCanvas.height;
      const ratio = imgWidth / imgHeight;

      const finalWidth = pdfWidth - 20; // 10mm margin on each side
      const finalHeight = finalWidth / ratio;

      // If content fits on one page, center it
      if (finalHeight <= pdfHeight - 20) {
        const yOffset = (pdfHeight - finalHeight) / 2;
        pdf.addImage(
          cleanImgData,
          "PNG",
          10,
          yOffset,
          finalWidth,
          finalHeight,
          undefined,
          "FAST"
        );
      } else {
        // Multiple pages - simpler approach
        const pageHeight = pdfHeight - 20; // With margins
        let yPosition = 10;
        let sourceY = 0;

        while (sourceY < imgHeight) {
          if (yPosition > 10) {
            pdf.addPage();
            yPosition = 10;
          }

          const remainingHeight = imgHeight - sourceY;
          const heightOnPage = Math.min(
            (remainingHeight * finalWidth) / imgWidth,
            pageHeight
          );

          // Create a temporary canvas for this page with RGB context
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = imgWidth;
          pageCanvas.height = Math.min(
            remainingHeight,
            (pageHeight * imgWidth) / finalWidth
          );
          const ctx = pageCanvas.getContext("2d", {
            colorSpace: "srgb",
            willReadFrequently: false,
          });

          if (ctx) {
            // Fill with background
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

            ctx.drawImage(
              rgbCanvas,
              0,
              sourceY,
              imgWidth,
              pageCanvas.height,
              0,
              0,
              imgWidth,
              pageCanvas.height
            );

            // Convert to blob for RGB safety
            const pageBlob = await new Promise<Blob | null>((resolve) => {
              pageCanvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
            });

            if (pageBlob) {
              const pageReader = new FileReader();
              const pageImgData = await new Promise<string>(
                (resolve, reject) => {
                  pageReader.onloadend = () => {
                    if (typeof pageReader.result === "string") {
                      resolve(pageReader.result);
                    } else {
                      reject(new Error("Failed to read page blob"));
                    }
                  };
                  pageReader.onerror = reject;
                  pageReader.readAsDataURL(pageBlob);
                }
              );

              pdf.addImage(
                pageImgData,
                "PNG",
                10,
                yPosition,
                finalWidth,
                heightOnPage,
                undefined,
                "FAST"
              );
            }
          }

          sourceY += pageCanvas.height;
          yPosition += heightOnPage;
        }
      }

      pdf.save("Factory_Unsafety_Report.pdf");

      // Restore button
      if (button) {
        button.textContent = originalText;
        button.removeAttribute("disabled");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(
        `Failed to generate PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please try again.`
      );

      // Restore button on error
      const button = document.activeElement as HTMLElement;
      if (button) {
        button.removeAttribute("disabled");
      }
    }
  };

  // Show file upload if dashboard is not shown
  if (!showDashboard && !isGenerating) {
    return (
      <div className="w-full min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-[#1e293b] border border-slate-700/50 shadow-xl">
            <CardHeader className="text-center pb-6">
              <motion.div
                className="flex justify-center mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className="p-4 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                  <Upload className="w-12 h-12 text-blue-400" />
                </div>
              </motion.div>
              <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Upload Your Data File
              </CardTitle>
              <p className="text-gray-300 text-sm sm:text-base lg:text-lg mt-2">
                Upload an Excel (.xlsx, .xls) or CSV file to generate your
                safety dashboard
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-blue-500/50 transition-colors duration-300 bg-[#0f172a]/50"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {selectedFile ? (
                        <>
                          {selectedFile.name.endsWith(".csv") ? (
                            <FileText className="w-16 h-16 text-green-400 mb-3" />
                          ) : (
                            <FileSpreadsheet className="w-16 h-16 text-blue-400 mb-3" />
                          )}
                          <p className="mb-2 text-sm sm:text-base text-gray-300 font-semibold">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Click to change file
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-400 mb-3" />
                          <p className="mb-2 text-sm sm:text-base text-gray-300 font-semibold">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-400">
                            Excel (.xlsx, .xls) or CSV files only
                          </p>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-green-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-400">
                          File selected: {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={!selectedFile}
                  className="w-full bg-gradient-to-r from-[#38bdf8] to-[#06b6d4] text-black font-semibold py-6 text-lg hover:shadow-lg hover:shadow-sky-500/50 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show loader with quotes during generation
  if (isGenerating) {
    return (
      <div className="w-full min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-4">
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
            <div className="p-6 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <Loader2 className="w-16 h-16 text-blue-400" />
            </div>
          </motion.div>

          <motion.div
            key={currentQuoteIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Generating Your Dashboard...
            </h2>
            <div className="flex items-center justify-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 font-medium">
                {aiQuotes[currentQuoteIndex]}
              </p>
              <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div className="flex justify-center gap-2 mt-8">
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0s" }}
              ></div>
              <div
                className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Show dashboard
  return (
    <div className="w-full bg-[#0f172a] text-white p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 lg:space-y-8">
      {/* Header Section */}
      <motion.div
        className="mb-6 lg:mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 lg:mb-3 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Factory Safety Observations Dashboard
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-300 max-w-3xl">
          Visual representation of unsafe acts reported by safety officers.
        </p>
      </motion.div>

      {/* Charts Grid - Responsive for tablets and laptops */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-[#1e293b] border border-slate-700/50 hover:border-sky-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-sky-500/10">
            <CardHeader className="pb-3 lg:pb-4">
              <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold">
                Reported Unsafe Acts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer
                width="100%"
                height={280}
                className="sm:h-[320px] lg:h-[360px] xl:h-[400px]"
              >
                <BarChart
                  data={unsafetyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="type"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
                  />
                  <Bar dataKey="count" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="bg-[#1e293b] border border-slate-700/50 hover:border-sky-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-sky-500/10">
            <CardHeader className="pb-3 lg:pb-4">
              <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold">
                Unsafe Acts Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer
                width="100%"
                height={280}
                className="sm:h-[320px] lg:h-[360px] xl:h-[400px]"
              >
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={
                      windowWidth >= 1280 ? 120 : windowWidth >= 1024 ? 110 : 90
                    }
                    dataKey="value"
                    label={(props: { name?: string; percent?: number }) =>
                      props.name && props.percent
                        ? `${props.name}: ${(props.percent * 100).toFixed(0)}%`
                        : ""
                    }
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Line Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="bg-[#1e293b] border border-slate-700/50 hover:border-sky-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-sky-500/10">
            <CardHeader className="pb-3 lg:pb-4">
              <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold">
                Trend of Safety Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer
                width="100%"
                height={280}
                className="sm:h-[320px] lg:h-[360px] xl:h-[400px]"
              >
                <LineChart
                  data={areaData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="incidents"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ fill: "#38bdf8", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Area Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="bg-[#1e293b] border border-slate-700/50 hover:border-sky-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-sky-500/10">
            <CardHeader className="pb-3 lg:pb-4">
              <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold">
                Cumulative Unsafe Observations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer
                width="100%"
                height={280}
                className="sm:h-[320px] lg:h-[360px] xl:h-[400px]"
              >
                <AreaChart
                  data={areaData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="colorIncidents"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="incidents"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fill="url(#colorIncidents)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Report Section - Responsive layout */}
      <motion.div
        ref={reportRef}
        className="bg-[#1e293b] p-4 sm:p-6 lg:p-8 xl:p-10 rounded-lg lg:rounded-xl border border-slate-700/50 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="mb-6 lg:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 lg:mb-4">
            Detailed Unsafety Report
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-300 max-w-3xl">
            Summary of all unsafe acts reported in the factory and recommended
            prevention measures.
          </p>
        </div>

        {/* Report Grid - Responsive for tablets and laptops */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 lg:mb-8">
          {reportData.map((item, index) => (
            <motion.div
              key={index}
              className="p-4 sm:p-5 lg:p-6 rounded-lg lg:rounded-xl bg-[#0f172a] border-l-4 border-[#38bdf8] hover:border-[#06b6d4] hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-300 hover:scale-[1.02]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
            >
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2 lg:mb-3 text-sky-400">
                {item.act}
              </h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-300 mb-3 lg:mb-4 leading-relaxed">
                {item.description}
              </p>
              <div className="pt-2 lg:pt-3 border-t border-slate-700">
                <p className="text-xs sm:text-sm lg:text-base text-green-400 font-medium">
                  <span className="font-semibold">Prevention:</span>{" "}
                  {item.prevention}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center lg:justify-start">
          <Button
            onClick={downloadPDF}
            className="bg-gradient-to-r from-[#38bdf8] to-[#06b6d4] text-black font-semibold px-6 sm:px-8 lg:px-10 py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-lg hover:shadow-lg hover:shadow-sky-500/50 transition-all duration-300 hover:scale-105"
          >
            Download Report as PDF
          </Button>
        </div>
      </motion.div>
    </div>
  );
}