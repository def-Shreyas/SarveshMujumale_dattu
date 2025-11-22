"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthToken } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Loader2,
  Sparkles,
  Target,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PlusCircle,
  Brain,
  Info,
  Filter,
  Check,
  Zap,
  AlertTriangle,
} from "lucide-react";
import type { RcaAction, RcaKpi } from "@/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// Backend URL
const BACKEND_URL = "http://localhost:8000";

// AI Quotes
const aiQuotes = [
  "AI is analyzing root causes and corrective actions...",
  "Machine learning helps identify patterns in incidents...",
  "Every incident tells a safety story, AI helps us prevent it...",
];

// Types for backend integration
interface ChartFile {
  name: string;
  path?: string;
}

// Safe Markdown Renderer Component
interface SafeMarkdownProps {
  content: string;
}

const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content }) => {
  if (typeof content !== "string") {
    console.error("❌ SafeMarkdown received non-string content:", typeof content, content);
    return (
      <div className="text-red-500 p-4">
        <p>Invalid content type: {typeof content}</p>
      </div>
    );
  }

  if (!content || content.length === 0) {
    return <p className="text-gray-500">No content to display</p>;
  }

  const formatMarkdown = (text: string): string => {
    // First, strip HTML attributes from existing HTML tags to prevent them from being displayed as text
    const stripHtmlAttributes = (str: string): string => {
      // Remove style attributes and other inline attributes from HTML tags
      str = str.replace(/<([a-zA-Z][a-zA-Z0-9]*)\s+[^>]*>/g, '<$1>');
      
      // Remove any standalone HTML attribute text that might be displayed
      str = str.replace(/\b(style|class|id|width|height|align|valign|colspan|rowspan|bgcolor|color|font-size|font-family|text-align|margin|padding|border)\s*=\s*["'][^"']*["']/gi, '');
      str = str.replace(/\b(style|class|id|width|height|align|valign|colspan|rowspan|bgcolor|color|font-size|font-family|text-align|margin|padding|border)\s*=\s*[^\s>]+/gi, '');
      
      // Remove CSS unit patterns that appear standalone (like "12px", "10em", etc.) when they appear as text
      str = str.replace(/(?:^|\s)(\d+)\s*(px|em|rem|pt)(?:\s|$|;|,)/gi, ' ');
      str = str.replace(/(?:^|\s)(\d+)\s*%(?:\s|$|;|,)/gi, ' ');
      
      // Remove font-size related text patterns (like "txt small", "font-size: 12px", etc.)
      str = str.replace(/\b(txt|text|font)\s*(small|medium|large|tiny|huge|xx-small|x-small|smaller|larger|xx-large)\b/gi, '');
      str = str.replace(/\bfont-size\s*:\s*\d+\s*(px|em|rem|pt|%)/gi, '');
      
      return str;
    };

    // Clean the text first to remove HTML attributes
    text = stripHtmlAttributes(text);

    const escapeHtml = (str: string) => {
      const entityPlaceholders: { [key: string]: string } = {};
      let placeholderIndex = 0;
      let protectedStr = str.replace(/&(?:#\d+|#x[\da-fA-F]+|\w+);/g, (match) => {
        const placeholder = `__ENTITY_${placeholderIndex++}__`;
        entityPlaceholders[placeholder] = match;
        return placeholder;
      });
      protectedStr = protectedStr.replace(/&/g, '&amp;');
      protectedStr = protectedStr.replace(/</g, '&lt;');
      protectedStr = protectedStr.replace(/>/g, '&gt;');
      Object.keys(entityPlaceholders).forEach(placeholder => {
        protectedStr = protectedStr.replace(new RegExp(placeholder, 'g'), entityPlaceholders[placeholder]);
      });
      return protectedStr;
    };

    const decodeHtmlEntities = (str: string): string => {
      return str
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
        .replace(/&#x([\da-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    };

    const BR_PLACEHOLDER = '___BR_TAG_PLACEHOLDER___';
    const safeHtmlTags = [
      { pattern: /<br\s*\/?>/gi, replacement: BR_PLACEHOLDER }
    ];

    let processedText = decodeHtmlEntities(text);
    safeHtmlTags.forEach(({ pattern, replacement }) => {
      processedText = processedText.replace(pattern, replacement);
    });

    const processTables = (str: string): string => {
      const tableRegex = /(\|.+\|\r?\n\|[-\s|:]+\|\r?\n(?:\|.+\|\r?\n?)+)/g;
      return str.replace(tableRegex, (match) => {
        const lines = match.trim().split(/\r?\n/).filter(line => line.trim() && line.includes('|'));
        if (lines.length < 2) return match;
        const headerLine = lines[0];
        const dataLines = lines.slice(2);
        const headers = headerLine.split('|').map(h => h.trim()).filter(h => h && !h.match(/^[-:|\s]+$/));
        if (headers.length === 0) return match;
        let tableHtml = '<div class="overflow-x-auto my-6"><table class="min-w-full border-collapse border border-gray-300 shadow-sm">';
        tableHtml += '<thead><tr class="bg-[#0B3D91] text-white">';
        headers.forEach(header => {
          let escapedHeader = escapeHtml(header);
          escapedHeader = escapedHeader.replace(new RegExp(BR_PLACEHOLDER, 'g'), '<br />');
          tableHtml += `<th class="border border-gray-300 px-4 py-3 text-left font-semibold">${escapedHeader}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        dataLines.forEach((line, idx) => {
          const cells = line.split('|').map(c => c.trim()).filter(c => c && !c.match(/^[-:|\s]+$/));
          if (cells.length === headers.length) {
            tableHtml += `<tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100">`;
            cells.forEach(cell => {
              let cellContent = escapeHtml(cell);
              cellContent = cellContent.replace(new RegExp(BR_PLACEHOLDER, 'g'), '<br />');
              cellContent = cellContent.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
              cellContent = cellContent.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
              cellContent = cellContent.replace(/\n/g, '<br />');
              tableHtml += `<td class="border border-gray-300 px-4 py-3 align-top">${cellContent}</td>`;
            });
            tableHtml += '</tr>';
          }
        });
        tableHtml += '</tbody></table></div>';
        return tableHtml;
      });
    };

    let html = processTables(processedText);
    const escapeNonHtml = (str: string): string => {
      const parts = str.split(/(<[^>]+>)/);
      return parts.map((part) => {
        if (part.startsWith('<') && part.endsWith('>')) {
          return part;
        }
        return escapeHtml(part);
      }).join('');
    };
    html = escapeNonHtml(html);
    html = html.replace(/^#### (.*$)/gim, '<h4 class="text-xl font-bold mt-5 mb-2 text-[#0B3D91]">$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold mt-6 mb-3 text-[#0B3D91]">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold mt-8 mb-4 text-[#0B3D91]">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mt-10 mb-5 text-[#0B3D91]">$1</h1>');
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      const beforeMatch = html.substring(0, html.indexOf(match));
      const lastTable = beforeMatch.lastIndexOf('<table');
      const lastTableClose = beforeMatch.lastIndexOf('</table>');
      if (lastTable > lastTableClose) {
        return match;
      }
      return `<pre class="bg-gray-100 p-4 rounded my-4 overflow-x-auto border"><code>${code}</code></pre>`;
    });
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      const beforeMatch = html.substring(0, html.indexOf(match));
      const lastTable = beforeMatch.lastIndexOf('<table');
      const lastTableClose = beforeMatch.lastIndexOf('</table>');
      if (lastTable > lastTableClose) {
        return match;
      }
      return `<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">${code}</code>`;
    });
    html = html.replace(/\*\*(.*?)\*\*/g, (match, text) => {
      if (match.includes('<td') || match.includes('</td>')) {
        return match;
      }
      return `<strong class="font-bold text-gray-800">${text}</strong>`;
    });
    html = html.replace(/\*(.*?)\*/g, (match, text) => {
      if (match.includes('<td') || match.includes('</td>') || match.includes('<strong>')) {
        return match;
      }
      return `<em class="italic">${text}</em>`;
    });
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');
    html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 mb-1">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>');
    html = html.replace(/(<li.*<\/li>)/g, '<ul class="list-disc ml-6 my-4">$1</ul>');
    html = html.split(/\n\n+/).map(para => {
      if (para.trim()) {
        if (para.trim().startsWith('<h') || 
            para.trim().startsWith('<ul') || 
            para.trim().startsWith('<pre') ||
            para.trim().startsWith('<div') && para.includes('<table')) {
          return para;
        }
        return `<p class="mb-4 leading-relaxed">${para.replace(/\n/g, '<br />')}</p>`;
      }
      return '';
    }).join('');
    html = html.replace(new RegExp(BR_PLACEHOLDER, 'g'), '<br />');
    return html;
  };

  return (
    <div 
      className="prose prose-slate max-w-none prose-headings:text-[#0B3D91] prose-strong:text-gray-700 prose-a:text-blue-600"
      dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
    />
  );
};

// --- Mock Data (for existing UI components) ---
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
    progress: 15,
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


// --- Main RCA Page Component ---
export const RCA: React.FC = () => {
  const reportRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [kpis, setKpis] = useState<RcaKpi[]>([]);
  const [actions, setActions] = useState<RcaAction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<RcaAction | null>(null);

  // Backend integration state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [aiReport, setAiReport] = useState<string>("");
  const [chartList, setChartList] = useState<ChartFile[]>([]);
  const [selectedChartName, setSelectedChartName] = useState<string>("");
  const [selectedChartHtml, setSelectedChartHtml] = useState<string>("");

  // Rotate quotes while generating
  useEffect(() => {
    if (isGenerating) {
      const quoteInterval = setInterval(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % aiQuotes.length);
      }, 3000);
      return () => clearInterval(quoteInterval);
    }
  }, [isGenerating]);

  // --- Data Fetching (Backend Logic) ---
  useEffect(() => {
    // Keep mock data for existing UI components
    setKpis(mockKpis);
    setActions(mockRcaActions);
  }, []);

  // Handle file pick
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const validExtensions = [".xlsx", ".xls"];
      const fileExtension = file.name
        .substring(file.name.lastIndexOf("."))
        .toLowerCase();

      if (validExtensions.includes(fileExtension)) {
        setSelectedFile(file);
        setShowDashboard(false);
      } else {
        toast.error("Invalid File Type", {
          description: "Please upload a valid Excel (.xlsx, .xls) file.",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  // Upload file to backend
  const uploadSafetyFile = async (file: File) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("User not authenticated — no token found.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BACKEND_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => `${res.statusText}`);
      console.error("Upload error body:", text);
      throw new Error(`Upload failed (${res.status}): ${text}`);
    }
  };

  // Trigger backend to build report and charts
  const triggerGeneration = async () => {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    // Generate report
    const r1 = await fetch(`${BACKEND_URL}/generate-report`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!r1.ok) {
      // Extract detailed error message from response
      let errorMessage = `Report generation failed (${r1.status})`;
      
      // Clone response to read it multiple times if needed
      const clonedResponse = r1.clone();
      
      try {
        const errorData = await r1.json();
        // FastAPI returns errors in {detail: "message"} format
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // If JSON parsing fails, try to get text response from cloned response
        try {
          const errorText = await clonedResponse.text();
          if (errorText && errorText.trim()) {
            // Try to parse as JSON if it looks like JSON
            if (errorText.trim().startsWith("{") || errorText.trim().startsWith("[")) {
              try {
                const parsed = JSON.parse(errorText);
                errorMessage = parsed.detail || parsed.message || errorText;
              } catch {
                errorMessage = errorText;
              }
            } else {
              errorMessage = errorText;
            }
          }
        } catch (e2) {
          // If both fail, use default message
          console.error("Failed to parse error response:", e, e2);
        }
      }
      
      // Provide user-friendly error messages
      if (errorMessage.includes("API key") || errorMessage.includes("GOOGLE_API_KEY")) {
        throw new Error("API key not configured. Please contact the administrator to set up the Google API key.");
      } else if (errorMessage.includes("No extracted tables") || errorMessage.includes("upload")) {
        throw new Error("Please upload the Excel file first before generating the report.");
      } else if (errorMessage.includes("network") || errorMessage.includes("connection")) {
        throw new Error("Network error. Please check your internet connection and try again.");
      } else {
        throw new Error(errorMessage);
      }
    }

    // 🔥 ADD THIS LINE — prevents race condition
    await new Promise((res) => setTimeout(res, 1200));

    // Generate charts
    const r2 = await fetch(`${BACKEND_URL}/generate-charts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!r2.ok) {
      // Extract detailed error message from response
      let errorMessage = `Chart generation failed (${r2.status})`;
      
      // Clone response to read it multiple times if needed
      const clonedResponse2 = r2.clone();
      
      try {
        const errorData = await r2.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        try {
          const errorText = await clonedResponse2.text();
          if (errorText && errorText.trim()) {
            // Try to parse as JSON if it looks like JSON
            if (errorText.trim().startsWith("{") || errorText.trim().startsWith("[")) {
              try {
                const parsed = JSON.parse(errorText);
                errorMessage = parsed.detail || parsed.message || errorText;
              } catch {
                errorMessage = errorText;
              }
            } else {
              errorMessage = errorText;
            }
          }
        } catch (e2) {
          console.error("Failed to parse error response:", e, e2);
        }
      }
      throw new Error(errorMessage);
    }
  };

  // Fetch AI report text
  const fetchReportText = async (): Promise<string> => {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const res = await fetch(`${BACKEND_URL}/report`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let raw: string;
    try {
      raw = await res.text();
    } catch (error) {
      console.error("Failed to read response as text:", error);
      throw new Error("Failed to read report response");
    }

    const trimmed = raw.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        const detail = parsed.detail || parsed.message || JSON.stringify(parsed);
        throw new Error(detail);
      } catch {
        if (!res.ok) {
          throw new Error(raw || `Fetch /report failed (${res.status})`);
        }
      }
    }

    if (!res.ok) {
      throw new Error(raw || `Fetching /report failed (${res.status})`);
    }

    if (typeof raw !== "string") {
      console.error("❌ CRITICAL: fetchReportText received non-string:", typeof raw, raw);
      return "";
    }

    return String(raw).trim();
  };

  // Fetch charts list
  const fetchChartsList = async () => {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const res = await fetch(`${BACKEND_URL}/charts`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Fetching /charts list failed (${res.status}): ${body}`);
    }

    const data = await res.json().catch(() => null);
    if (!data) return [];

    if (Array.isArray(data)) {
      return data.map((name: string) => ({ name }));
    }

    if (Array.isArray(data.charts)) {
      return data.charts.map((chart: { name?: string; path?: string }) => ({
        name: chart.name ?? "",
        path: chart.path,
      }));
    }

    return [];
  };

  // Fetch individual chart HTML
  const fetchChartHtml = async (chartName: string) => {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const res = await fetch(`${BACKEND_URL}/charts/${chartName}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Fetching chart failed (${res.status}): ${body}`);
    }

    return await res.text();
  };

  // Main generate button flow
  const handleGenerate = async () => {
    if (!selectedFile) {
      toast.error("No File Selected");
      return;
    }

    setIsGenerating(true);
    setShowDashboard(false);
    setCurrentQuoteIndex(0);

    try {
      toast.info("Uploading file...", { id: "upload" });
      await uploadSafetyFile(selectedFile);
      toast.success("File Uploaded!", { id: "upload" });

      toast.info("Generating AI report...", { id: "gen_report" });
      toast.info("Generating charts...", { id: "gen_charts" });
      await triggerGeneration();
      toast.success("AI Report Generated!", { id: "gen_report" });
      toast.success("Charts Generated!", { id: "gen_charts" });

      toast.info("Loading results...");
      const [reportText, chartsArr] = await Promise.all([
        fetchReportText(),
        fetchChartsList(),
      ]);

      let safeReport: string;
      if (typeof reportText === "string") {
        safeReport = reportText.trim();
      } else {
        console.error("❌ CRITICAL: reportText is not a string!");
        safeReport = "";
      }

      if (typeof safeReport === "string") {
        setAiReport(safeReport);
      } else {
        setAiReport("");
      }

      if (chartsArr && chartsArr.length > 0) {
        setChartList(chartsArr);
        const firstChartName = chartsArr[0].name;
        setSelectedChartName(firstChartName);

        try {
          const firstHtml = await fetchChartHtml(firstChartName);
          setSelectedChartHtml(firstHtml);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Unknown error";
          console.error("Failed to auto-load first chart:", err);
          toast.error("Failed to load first chart", {
            description: errorMessage,
          });
          setSelectedChartHtml("<p>Error loading chart.</p>");
        }
      } else {
        toast.error("No charts were generated by the backend.");
        setChartList([]);
        setSelectedChartName("");
        setSelectedChartHtml("");
      }

      setIsGenerating(false);
      setShowDashboard(true);
      toast.success("Dashboard is ready!");
    } catch (error: any) {
      console.error("Error generating dashboard:", error);
      setIsGenerating(false);
      setShowDashboard(false);

      // Clear any pending progress toasts
      toast.dismiss("upload");
      toast.dismiss("gen_report");
      toast.dismiss("gen_charts");

      // Show error with detailed message
      const errorMessage = error?.message || "Could not process the file. Please try again.";
      toast.error("Generation Failed", {
        description: errorMessage,
        duration: 5000, // Show for 5 seconds so user can read it
      });
    }
  };

  // Handle chart selection
  const handleChartSelect = async (chartName: string) => {
    setSelectedChartName(chartName);

    try {
      const html = await fetchChartHtml(chartName);
      setSelectedChartHtml(html);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to load chart:", error);
      toast.error("Failed to load chart", {
        description: errorMessage,
      });
      setSelectedChartHtml("<p>Error loading chart.</p>");
    }
  };

  // Download PDF
  const downloadPDF = async () => {
    const element = reportRef.current;
    if (!element) {
      toast.error("Error", {
        description: "Cannot find report to download.",
      });
      return;
    }

    toast.info("Generating PDF", { description: "Please wait..." });

    const originalBG = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#FFFFFF";

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#FFFFFF",
    });

    document.body.style.backgroundColor = originalBG;

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const pageImgHeight =
      imgWidth > 0 ? (pdfWidth - 20) * (imgHeight / imgWidth) : 0;
    let heightLeft = pageImgHeight;
    let position = 10;
    const pageMargin = 10;
    const safePdfHeight = pdfHeight - pageMargin * 2;

    pdf.addImage(
      imgData,
      "PNG",
      pageMargin,
      position,
      pdfWidth - pageMargin * 2,
      pageImgHeight
    );
    heightLeft -= safePdfHeight;

    while (heightLeft > 0) {
      position = -heightLeft + pageMargin;
      pdf.addPage();
      pdf.addImage(
        imgData,
        "PNG",
        pageMargin,
        position,
        pdfWidth - pageMargin * 2,
        pageImgHeight
      );
      heightLeft -= safePdfHeight;
    }

    pdf.save("DATTU_RCA_Report.pdf");
  };

  const handleFilterChange = () => {
    // TODO: Add filter state and re-fetch data
    console.log("Filtering data...");
  };

  const handleFormSubmit = async (formData: Partial<RcaAction>) => {
    console.log("Creating new action:", formData);
    // Mock success for now
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
    toast.info("AI Co-Pilot", {
      description: `Analyzing root cause for ${selectedAction.id}...`,
    });
  };

  // Upload screen
  if (!showDashboard && !isGenerating) {
    return (
      <div className="w-full py-12">
        {/* TOP PAGE HEADING */}
        <div className="text-center mb-10">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-extrabold text-[#0B3D91]"
          >
            <span className="px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 shadow-sm">
              DATTU AI RCA Analyzer
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto mt-3"
          >
            Upload your Excel corrective action data and let DATTU generate
            a smart, interactive dashboard of root causes, action status, and AI insights.
          </motion.p>
        </div>

        {/* HOW IT WORKS */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            {
              title: "1. Upload RCA Excel",
              icon: Upload,
              desc: "Upload your raw corrective action & root cause Excel files.",
            },
            {
              title: "2. AI Analyzes Root Causes",
              icon: Sparkles,
              desc: "DATTU processes action status, effectiveness & patterns.",
            },
            {
              title: "3. View Dashboard",
              icon: BarChart2,
              desc: "Get interactive charts on root causes & closure rates.",
            },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group bg-white shadow-md rounded-xl p-5 border border-gray-200 hover:shadow-xl hover:border-[#00A79D] transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  transition={{ type: "spring", stiffness: 300 }}
                  className="group-hover:scale-110"
                >
                  <step.icon className="w-8 h-8 text-[#0B3D91] transition-colors group-hover:text-[#00A79D]" />
                </motion.div>
                <p className="font-semibold text-gray-800">{step.title}</p>
              </div>
              <p className="text-sm text-gray-600">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* UPLOAD CARD */}
        <motion.div
          className="w-full flex items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-xl border-t-4 border-[#0B3D91] w-full max-w-2xl overflow-hidden">
            <CardHeader className="text-center pb-6">
              <motion.div
                className="flex justify-center mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                }}
              >
                <div className="p-4 rounded-full bg-gradient-to-br from-[#0B3D91]/15 to-[#00A79D]/15 border border-[#0B3D91]/30">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Target className="w-12 h-12 text-[#0B3D91]" />
                  </motion.div>
                </div>
              </motion.div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#0B3D91] to-[#00A79D] bg-clip-text text-transparent">
                Upload Safety Data for RCA
              </CardTitle>
              <p className="text-gray-600 text-lg">
                Choose an Excel file (.xlsx / .xls) to begin the analysis.
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
                      <FileSpreadsheet className="w-12 h-12 text-[#0B3D91] mb-3" />
                      <p className="mb-2 text-base text-gray-700 font-semibold">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Click to change file
                      </p>
                    </>
                  ) : (
                    <>
                      <Target className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="mb-2 text-base text-gray-700 font-semibold">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        Excel (.xlsx, .xls) files only
                      </p>
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
              </label>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.99 }}>
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

  // Loading screen
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
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
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
                Analyzing Your Data...
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

  // Dashboard (results)
  return (
    <TooltipProvider>
      <div className="w-full space-y-6">
        <motion.div
          className="flex flex-wrap justify-between items-center gap-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Target className="w-8 h-8 text-[#0B3D91]" />
              Corrective Actions & RCA
            </h1>
            {selectedFile && (
              <p className="text-lg text-gray-600 max-w-3xl">
                Analysis of: {selectedFile.name}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {showDashboard && (
              <Button onClick={downloadPDF} className="bg-[#0B3D91] hover:bg-[#082f70]">
                <FileText className="w-4 h-4 mr-2" />
                Download Report (PDF)
              </Button>
            )}
            <Button onClick={() => setShowDashboard(false)} variant="outline">
              Upload New File
            </Button>
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
        </motion.div>

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
            <div ref={reportRef}>
              <Tabs defaultValue={showDashboard ? "report" : "ledger"}>
                <TabsList className="grid w-full grid-cols-3">
                  {showDashboard && (
                    <>
                      <TabsTrigger value="report">
                        <Sparkles className="mr-2 h-4 w-4 text-[#0B3D91]" />
                        AI-Generated Report
                      </TabsTrigger>
                      <TabsTrigger value="charts">
                        <BarChart2 className="mr-2 h-4 w-4 text-[#00A79D]" />
                        Interactive Charts
                      </TabsTrigger>
                    </>
                  )}
                  <TabsTrigger value="ledger">
                    <FileText className="mr-2 h-4 w-4" />
                    Action Ledger
                  </TabsTrigger>
                </TabsList>

                {/* AI Report Tab */}
                {showDashboard && (
                  <TabsContent value="report" className="mt-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                      <Card className="shadow-lg">
                        <CardHeader>
                          <CardTitle>DATTU AI Analysis</CardTitle>
                          <CardDescription>
                            This is the full report generated by the DATTU based on your uploaded data.
                          </CardDescription>
                        </CardHeader>
                        <CardContent
                          className={cn(
                            "prose prose-slate max-w-none",
                            "prose-headings:text-[#0B3D91] prose-strong:text-gray-700 prose-a:text-blue-600",
                            "prose-table:border prose-th:p-2 prose-td:p-2"
                          )}
                        >
                          {(() => {
                            const safeContent: string = typeof aiReport === "string" ? aiReport : String(aiReport || "");
                            if (typeof safeContent === "string" && safeContent.length > 0) {
                              return <SafeMarkdown content={safeContent} />;
                            } else {
                              return (
                                <p className="text-red-500">
                                  {aiReport ? "Invalid report format received from backend." : "No report loaded yet."}
                                </p>
                              );
                            }
                          })()}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                )}

                {/* Charts Tab */}
                {showDashboard && (
                  <TabsContent value="charts" className="mt-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                      <Card className="shadow-lg">
                        <CardHeader>
                          <CardTitle>Interactive Charts</CardTitle>
                          <CardDescription>
                            Select a chart to view the interactive (Plotly) HTML report generated by the backend.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Select onValueChange={handleChartSelect} value={selectedChartName || undefined}>
                            <SelectTrigger className="w-full md:w-1/2">
                              <SelectValue placeholder="Select a chart to display" />
                            </SelectTrigger>
                            <SelectContent>
                              {chartList.map((chart) => (
                                <SelectItem key={chart.name} value={chart.name}>
                                  {chart.name.replace(".html", "").replace(/_/g, " ").replace(/^\d+\s*/, "")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="w-full h-[600px] border rounded-md overflow-hidden bg-white">
                            {selectedChartHtml ? (
                              <iframe
                                srcDoc={selectedChartHtml}
                                title="Interactive Chart"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                sandbox="allow-scripts"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-500">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <p className="ml-2">{selectedChartName ? "Loading Chart..." : "Select a chart from the dropdown"}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                )}

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
              </Tabs>
            </div>
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
                          Overdue by {formatDistanceToNow(selectedAction.dueDate)}!
                        </p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold">Preventive Measure</h4>
                      <p className="text-sm text-gray-600">
                        Based on root cause '{selectedAction.rootCause}', recommend updating SOP-201 and retraining all welding staff.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Related Actions</h4>
                      <p className="text-sm text-gray-600">
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
      </div>
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
  let progressColor = "bg-blue-600";
  if (progress !== undefined) {
    if (invertProgressColor) {
      progressColor = progress > 15 ? "bg-red-500" : (progress > 5 ? "bg-yellow-500" : "bg-green-600");
    } else {
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
    if (!formData.relatedIncident || !formData.rootCause || !formData.assignedTo || !formData.dueDate) {
      toast.error("Error", { description: "Please fill in all required fields." });
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (key: keyof RcaAction, value: unknown) => {
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
