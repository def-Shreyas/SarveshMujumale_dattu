// src/pages/PPE.tsx
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
  Upload,
  FileSpreadsheet,
  Loader2,
  Sparkles,
  BarChart2,
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
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Backend URL
const BACKEND_URL = "http://localhost:8000";

// AI Quotes
const aiQuotes = [
  "AI is analyzing PPE inventory and usage patterns...",
  "Machine learning helps predict stock-outs and optimize reorder points...",
  "Every PPE item tells a safety story, AI helps us manage it better...",
];

// Types for backend integration
interface ChartFile {
  name: string;
  path?: string;
}

// ✅ Safe Markdown Renderer Component - NO ReactMarkdown, just plain HTML
interface SafeMarkdownProps {
  content: string;
}

// ✅ ULTRA-SIMPLE SOLUTION: Convert markdown to HTML string, then render as HTML
// This completely avoids ReactMarkdown and any React element issues
const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content }) => {
  // Validate content is a string
  if (typeof content !== "string") {
    console.error(
      "❌ SafeMarkdown received non-string content:",
      typeof content,
      content
    );
    return (
      <div className="text-red-500 p-4">
        <p>Invalid content type: {typeof content}</p>
      </div>
    );
  }

  if (!content || content.length === 0) {
    return <p className="text-gray-500">No content to display</p>;
  }

  // Simple markdown-to-HTML converter
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

    // Escape HTML for content (not attributes) - only escape <, >, and & (when not part of valid entities)
    // Quotes don't need to be escaped in HTML content, only in attribute values
    const escapeHtml = (str: string) => {
      // First, protect existing HTML entities
      const entityPlaceholders: { [key: string]: string } = {};
      let placeholderIndex = 0;
      let protectedStr = str.replace(
        /&(?:#\d+|#x[\da-fA-F]+|\w+);/g,
        (match) => {
          const placeholder = `__ENTITY_${placeholderIndex++}__`;
          entityPlaceholders[placeholder] = match;
          return placeholder;
        }
      );

      // Now escape only <, >, and & (but not the ones we protected)
      protectedStr = protectedStr.replace(/&/g, "&amp;");
      protectedStr = protectedStr.replace(/</g, "&lt;");
      protectedStr = protectedStr.replace(/>/g, "&gt;");

      // Restore protected entities
      Object.keys(entityPlaceholders).forEach((placeholder) => {
        protectedStr = protectedStr.replace(
          new RegExp(placeholder, "g"),
          entityPlaceholders[placeholder]
        );
      });

      return protectedStr;
    };

    // Decode any existing HTML entities that might be in the markdown
    // (in case the backend already escaped them)
    const decodeHtmlEntities = (str: string): string => {
      // Handle both named entities and numeric entities
      return (
        str
          // Named entities
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/&nbsp;/g, " ")
          // Numeric entities (decimal and hex)
          .replace(/&#(\d+);/g, (_, dec) =>
            String.fromCharCode(parseInt(dec, 10))
          )
          .replace(/&#x([\da-fA-F]+);/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
          )
      );
      // Note: We don't decode &amp;, &lt;, &gt; here as they might be intentional
      // and we'll handle them in escapeHtml
    };

    // Preserve safe HTML tags like <br>, <br/>, <br /> before escaping
    // Use placeholders that won't be escaped
    const BR_PLACEHOLDER = "___BR_TAG_PLACEHOLDER___";
    const safeHtmlTags = [
      { pattern: /<br\s*\/?>/gi, replacement: BR_PLACEHOLDER },
    ];

    // Step 1: Decode any existing HTML entities first
    // Step 2: Replace safe HTML tags with placeholders
    let processedText = decodeHtmlEntities(text);
    safeHtmlTags.forEach(({ pattern, replacement }) => {
      processedText = processedText.replace(pattern, replacement);
    });

    // Process tables FIRST (before escaping, as tables contain pipes)
    // Note: escapeHtml is accessible here due to closure
    const processTables = (str: string): string => {
      // Match markdown tables: | Header | Header | followed by |---|---| followed by | Cell | Cell |
      // More flexible regex to handle various table formats
      const tableRegex = /(\|.+\|\r?\n\|[-\s|:]+\|\r?\n(?:\|.+\|\r?\n?)+)/g;

      return str.replace(tableRegex, (match) => {
        const lines = match
          .trim()
          .split(/\r?\n/)
          .filter((line) => line.trim() && line.includes("|"));
        if (lines.length < 2) return match; // Need at least header and separator

        const headerLine = lines[0];
        const dataLines = lines.slice(2); // Skip header and separator

        // Parse header - split by | and filter empty
        const headers = headerLine
          .split("|")
          .map((h) => h.trim())
          .filter((h) => h && !h.match(/^[-:|\s]+$/));

        if (headers.length === 0) return match; // No valid headers

        // Build table HTML
        let tableHtml =
          '<div class="overflow-x-auto my-6"><table class="min-w-full border-collapse border border-gray-300 shadow-sm">';

        // Table header
        tableHtml += '<thead><tr class="bg-[#0B3D91] text-white">';
        headers.forEach((header) => {
          // Escape header text (but restore BR placeholders)
          let escapedHeader = escapeHtml(header);
          escapedHeader = escapedHeader.replace(
            new RegExp(BR_PLACEHOLDER, "g"),
            "<br />"
          );
          tableHtml += `<th class="border border-gray-300 px-4 py-3 text-left font-semibold">${escapedHeader}</th>`;
        });
        tableHtml += "</tr></thead>";

        // Table body
        tableHtml += "<tbody>";
        dataLines.forEach((line, idx) => {
          const cells = line
            .split("|")
            .map((c) => c.trim())
            .filter((c) => c && !c.match(/^[-:|\s]+$/));
          // Only process if we have the right number of cells
          if (cells.length === headers.length) {
            tableHtml += `<tr class="${
              idx % 2 === 0 ? "bg-white" : "bg-gray-50"
            } hover:bg-gray-100">`;
            cells.forEach((cell) => {
              // Escape cell content first (but preserve BR placeholders)
              let cellContent = escapeHtml(cell);
              // Restore BR placeholders as actual <br /> tags
              cellContent = cellContent.replace(
                new RegExp(BR_PLACEHOLDER, "g"),
                "<br />"
              );
              // Then process inline markdown in cells (bold, italic, etc.)
              cellContent = cellContent.replace(
                /\*\*(.*?)\*\*/g,
                '<strong class="font-bold">$1</strong>'
              );
              cellContent = cellContent.replace(
                /\*(.*?)\*/g,
                '<em class="italic">$1</em>'
              );
              // Handle line breaks in cells (convert newlines to <br />)
              cellContent = cellContent.replace(/\n/g, "<br />");
              tableHtml += `<td class="border border-gray-300 px-4 py-3 align-top">${cellContent}</td>`;
            });
            tableHtml += "</tr>";
          }
        });
        tableHtml += "</tbody></table></div>";

        return tableHtml;
      });
    };

    // Process tables first
    let html = processTables(processedText);

    // Now escape HTML (but preserve already-generated table HTML and BR placeholders)
    // We need to escape only the parts that aren't already HTML
    const escapeNonHtml = (str: string): string => {
      // Split by HTML tags, escape non-HTML parts
      const parts = str.split(/(<[^>]+>)/);
      return parts
        .map((part) => {
          if (part.startsWith("<") && part.endsWith(">")) {
            return part; // Already HTML, don't escape
          }
          return escapeHtml(part);
        })
        .join("");
    };

    // Escape non-HTML parts
    html = escapeNonHtml(html);

    // Headers (process from largest to smallest)
    html = html.replace(
      /^#### (.*$)/gim,
      '<h4 class="text-xl font-bold mt-5 mb-2 text-[#0B3D91]">$1</h4>'
    );
    html = html.replace(
      /^### (.*$)/gim,
      '<h3 class="text-2xl font-bold mt-6 mb-3 text-[#0B3D91]">$1</h3>'
    );
    html = html.replace(
      /^## (.*$)/gim,
      '<h2 class="text-3xl font-bold mt-8 mb-4 text-[#0B3D91]">$1</h2>'
    );
    html = html.replace(
      /^# (.*$)/gim,
      '<h1 class="text-4xl font-bold mt-10 mb-5 text-[#0B3D91]">$1</h1>'
    );

    // Code blocks (before inline code) - but skip if inside table
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      // Check if this is inside a table
      const beforeMatch = html.substring(0, html.indexOf(match));
      const lastTable = beforeMatch.lastIndexOf("<table");
      const lastTableClose = beforeMatch.lastIndexOf("</table>");
      if (lastTable > lastTableClose) {
        return match; // Inside table, don't process
      }
      return `<pre class="bg-gray-100 p-4 rounded my-4 overflow-x-auto border"><code>${code}</code></pre>`;
    });

    // Inline code (but not inside tables)
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      const beforeMatch = html.substring(0, html.indexOf(match));
      const lastTable = beforeMatch.lastIndexOf("<table");
      const lastTableClose = beforeMatch.lastIndexOf("</table>");
      if (lastTable > lastTableClose) {
        return match; // Inside table, don't process
      }
      return `<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">${code}</code>`;
    });

    // Bold (but preserve what's already in tables)
    html = html.replace(/\*\*(.*?)\*\*/g, (match, text) => {
      // Check if already inside a table cell
      if (match.includes("<td") || match.includes("</td>")) {
        return match; // Already processed in table
      }
      return `<strong class="font-bold text-gray-800">${text}</strong>`;
    });

    // Italic
    html = html.replace(/\*(.*?)\*/g, (match, text) => {
      if (
        match.includes("<td") ||
        match.includes("</td>") ||
        match.includes("<strong>")
      ) {
        return match; // Already processed
      }
      return `<em class="italic">${text}</em>`;
    });

    // Links
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
    );

    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 mb-1">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>');

    // Wrap list items in ul
    html = html.replace(
      /(<li.*<\/li>)/g,
      '<ul class="list-disc ml-6 my-4">$1</ul>'
    );

    // Line breaks - convert double newlines to paragraph breaks
    // But skip if inside table
    html = html
      .split(/\n\n+/)
      .map((para) => {
        if (para.trim()) {
          // Don't wrap if already a header, list, code block, or table
          if (
            para.trim().startsWith("<h") ||
            para.trim().startsWith("<ul") ||
            para.trim().startsWith("<pre") ||
            (para.trim().startsWith("<div") && para.includes("<table"))
          ) {
            return para;
          }
          return `<p class="mb-4 leading-relaxed">${para.replace(
            /\n/g,
            "<br />"
          )}</p>`;
        }
        return "";
      })
      .join("");

    // Restore BR placeholders as actual <br /> tags (at the very end, after all processing)
    html = html.replace(new RegExp(BR_PLACEHOLDER, "g"), "<br />");

    return html;
  };

  // Render as plain HTML - NO React elements, just HTML string
  return (
    <div
      className="prose prose-slate max-w-none prose-headings:text-[#0B3D91] prose-strong:text-gray-700 prose-a:text-blue-600"
      dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
    />
  );
};

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
  const reportRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [kpis, setKpis] = useState<PpeKpi[]>([]);
  const [stock, setStock] = useState<PpeItem[]>([]);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isIssueStockOpen, setIsIssueStockOpen] = useState(false);
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [selectedPpe, setSelectedPpe] = useState<PpeItem | null>(null);

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
    setStock(mockPpeStock);
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
  const uploadPpeFile = async (file: File) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("User not authenticated — no token found.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BACKEND_URL}/upload-ppe`, {
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
    const r1 = await fetch(`${BACKEND_URL}/generate-ppe-report`, {
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
    const r2 = await fetch(`${BACKEND_URL}/generate-ppe-charts`, {
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

    const res = await fetch(`${BACKEND_URL}/ppe-report`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Always get raw text first
    let raw: string;
    try {
      raw = await res.text();
    } catch (error) {
      console.error("Failed to read response as text:", error);
      throw new Error("Failed to read report response");
    }

    // Log the raw response for debugging
    console.log("🔍 Raw response type:", typeof raw);
    console.log("🔍 Raw response length:", raw?.length || 0);
    console.log(
      "🔍 Raw response preview (first 200 chars):",
      raw?.substring(0, 200) || "EMPTY"
    );

    // If backend returned JSON (error) — parse and throw
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        const detail =
          parsed.detail || parsed.message || JSON.stringify(parsed);
        console.error("Report endpoint returned JSON error:", parsed);
        throw new Error(detail);
      } catch (e) {
        // not valid JSON - still treat as error if status not ok
        if (!res.ok) {
          console.error("Report endpoint returned non-json error:", raw);
          throw new Error(raw || `Fetch /ppe-report failed (${res.status})`);
        }
      }
    }

    if (!res.ok) {
      // some non-JSON error body
      console.error("Fetching /ppe-report failed", res.status, raw);
      throw new Error(raw || `Fetching /ppe-report failed (${res.status})`);
    }

    // ✅ ENFORCE: Always return a clean string
    // Remove any potential React elements or objects
    if (typeof raw !== "string") {
      console.error(
        "❌ CRITICAL: fetchReportText received non-string:",
        typeof raw,
        raw
      );
      return "";
    }

    // Sanitize: ensure it's a plain string, no objects embedded
    const cleaned = String(raw).trim();
    console.log("✅ Cleaned report type:", typeof cleaned);
    console.log("✅ Cleaned report length:", cleaned.length);

    return cleaned;
  };

  // Fetch charts list
  const fetchChartsList = async () => {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const res = await fetch(`${BACKEND_URL}/ppe-charts`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Fetching /ppe-charts list failed (${res.status}): ${body}`);
    }

    const data = await res.json().catch(() => null);
    if (!data) return [];

    if (Array.isArray(data)) {
      return data.map((name: string) => ({ name }));
    }

    if (Array.isArray(data.charts)) {
      return data.charts.map((chart: any) => ({
        name: chart.name ?? "",
        path: chart.path,
      }));
    }

    return [];
  };

  // Fetch chart HTML
  const fetchChartHtml = async (chartName: string): Promise<string> => {
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

    const html = await res.text();
    return html;
  };

  // Main workflow: upload -> generate -> fetch
  const handleGenerate = async () => {
    if (!selectedFile) {
      toast.error("No file selected", {
        description: "Please select a file to upload.",
      });
      return;
    }

    try {
      setIsGenerating(true);
      setShowDashboard(false);

      toast.info("Uploading file...", { id: "upload" });
      await uploadPpeFile(selectedFile);
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

    pdf.save("DATTU_PPE_Report.pdf");
  };

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
              DATTU AI PPE & Assets Analyzer
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto mt-3"
          >
            Upload your Excel PPE and assets data and let DATTU generate a smart,
            interactive dashboard of inventory metrics, usage patterns, and AI insights.
          </motion.p>
        </div>

        {/* HOW IT WORKS */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            {
              title: "1. Upload PPE Excel",
              icon: Upload,
              desc: "Upload your raw PPE inventory and assets Excel files.",
            },
            {
              title: "2. AI Analyzes Inventory",
              icon: Sparkles,
              desc: "DATTU processes stock levels, usage patterns & predicts reorder needs.",
            },
            {
              title: "3. View Dashboard",
              icon: BarChart2,
              desc: "Get interactive charts on stock levels & inventory insights.",
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
                    <HardHat className="w-12 h-12 text-[#0B3D91]" />
                  </motion.div>
                </div>
              </motion.div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#0B3D91] to-[#00A79D] bg-clip-text text-transparent">
                Upload PPE & Assets Report
              </CardTitle>
              <p className="text-gray-600 text-lg">
                Choose an Excel file (.xlsx / .xls) to begin the analysis.
              </p>
            </CardHeader>

            <CardContent className="space-y-6 px-6 sm:px-8 pb-8">
              <motion.label
                htmlFor="file-upload"
                whileHover={{ scale: 1.02, backgroundColor: "#fafcff" }}
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#0B3D91] transition-colors duration-300 bg-gray-50"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {selectedFile ? (
                    <>
                      <FileSpreadsheet className="w-12 h-12 text-[#0B3D91] mb-3" />
                      <p className="mb-2 text-base font-semibold text-gray-700">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Click to change file
                      </p>
                    </>
                  ) : (
                    <>
                      <HardHat className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="mb-2 text-base font-semibold text-gray-700">
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
              </motion.label>

              <motion.div
                whileHover={{ scale: selectedFile ? 1.02 : 1 }}
                whileTap={{ scale: selectedFile ? 0.99 : 1 }}
              >
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedFile}
                  className="w-full bg-gradient-to-r from-[#0B3D91] to-[#00A79D] text-white font-semibold py-6 text-lg transition-all duration-300 disabled:opacity-50
                             shadow-lg hover:shadow-xl hover:shadow-[#0B3D91]/40"
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Enhanced: "Breathing" AI Icon */}
          <motion.div
            className="flex justify-center mb-8"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="p-6 rounded-full bg-gradient-to-br from-[#0B3D91]/20 to-[#00A79D]/20 border-2 border-[#0B3D91]/30 shadow-lg">
              <HardHat className="w-16 h-16 text-[#0B3D91]" />
            </div>
          </motion.div>

          {/* Main Title */}
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#0B3D91] to-[#00A79D] bg-clip-text text-transparent">
            Analyzing Your PPE & Assets Data...
          </h2>

          {/* Rotating AI Quotes */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="mb-4"
            >
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="w-5 h-5 text-[#0B3D91] animate-pulse" />
                <p className="text-xl text-gray-600 font-medium">
                  {aiQuotes[currentQuoteIndex]}
                </p>
                <Sparkles className="w-5 h-5 text-[#00A79D] animate-pulse" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Indeterminate Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-8 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-[#0B3D91] to-[#00A79D] h-2.5 rounded-full"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>
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
              <HardHat className="w-8 h-8 text-[#0B3D91]" />
              Assets & PPE Management
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
                <TabsList className={cn("grid w-full", showDashboard ? "grid-cols-5" : "grid-cols-3")}>
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
      </div>
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

  const handleChange = (key: keyof PpeItem, value: string | number | Date | undefined) => {
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