"use client";
import React, { useRef, useEffect, useState } from "react";
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
  GraduationCap,
  BarChart2,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// 👇 change this if your backend runs on a different URL/port
const BACKEND_URL = "http://localhost:8000";

// --- AI Motivational Quotes for Training ---
const aiQuotes = [
  "AI is analyzing training effectiveness and competency gaps...",
  "Identifying skill development opportunities across your workforce...",
  "Evaluating training completion rates and certification compliance...",
  "Analyzing pre-test vs post-test improvements to measure learning outcomes...",
  "Detecting departments with training gaps and recommending targeted programs...",
  "Processing training records to build a comprehensive competency matrix...",
  "Identifying employees requiring refresher training based on expiry dates...",
  "Building predictive models for training needs analysis...",
];

// --- Types ---
interface ChartFile {
  name: string;
  path?: string;
}

// ✅ Safe Markdown Renderer Component
interface SafeMarkdownProps {
  content: string;
}

const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content }) => {
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

  // Simple markdown-to-HTML converter (same as Unsafety.tsx)
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
      let protectedStr = str.replace(
        /&(?:#\d+|#x[\da-fA-F]+|\w+);/g,
        (match) => {
          const placeholder = `__ENTITY_${placeholderIndex++}__`;
          entityPlaceholders[placeholder] = match;
          return placeholder;
        }
      );

      protectedStr = protectedStr.replace(/&/g, "&amp;");
      protectedStr = protectedStr.replace(/</g, "&lt;");
      protectedStr = protectedStr.replace(/>/g, "&gt;");

      Object.keys(entityPlaceholders).forEach((placeholder) => {
        protectedStr = protectedStr.replace(
          new RegExp(placeholder, "g"),
          entityPlaceholders[placeholder]
        );
      });

      return protectedStr;
    };

    const decodeHtmlEntities = (str: string): string => {
      return (
        str
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/&nbsp;/g, " ")
          .replace(/&#(\d+);/g, (_, dec) =>
            String.fromCharCode(parseInt(dec, 10))
          )
          .replace(/&#x([\da-fA-F]+);/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
          )
      );
    };

    const BR_PLACEHOLDER = "___BR_TAG_PLACEHOLDER___";
    const safeHtmlTags = [
      { pattern: /<br\s*\/?>/gi, replacement: BR_PLACEHOLDER },
    ];

    let processedText = decodeHtmlEntities(text);
    safeHtmlTags.forEach(({ pattern, replacement }) => {
      processedText = processedText.replace(pattern, replacement);
    });

    // Training-specific risk indicators and highlighting
    const addRiskIndicators = (text: string): string => {
      const riskPatterns = [
        { 
          pattern: /\b(high risk|critical risk|severe risk|extreme risk|urgent|critical|severe|dangerous|hazardous|non-compliance|expired|overdue|failing|inadequate)\b/gi, 
          class: 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300',
          icon: '🔴'
        },
        { 
          pattern: /\b(medium risk|moderate risk|moderate|warning|caution|significant|pending|review required|needs improvement|attention required)\b/gi, 
          class: 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300',
          icon: '🟠'
        },
        { 
          pattern: /\b(low risk|minimal risk|safe|acceptable|controlled|minor|negligible|approved|valid|compliant|certified|completed|proficient)\b/gi, 
          class: 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300',
          icon: '🟢'
        }
      ];

      let processed = text;
      riskPatterns.forEach(({ pattern, class: className, icon }) => {
        processed = processed.replace(pattern, (match) => {
          if (processed.includes(`class="${className}"`)) return match;
          return `<span class="${className}">${icon} ${match}</span>`;
        });
      });
      return processed;
    };

    const highlightImportant = (text: string): string => {
      text = text.replace(/(\d+\.?\d*%)/g, '<span class="font-bold text-[#0B3D91] bg-blue-50 px-1.5 py-0.5 rounded">$1</span>');
      text = text.replace(/\b(\d{2,})\b/g, (match) => {
        if (match.length === 4 && parseInt(match) >= 1900 && parseInt(match) <= 2100) return match;
        return `<span class="font-semibold text-[#0B3D91]">${match}</span>`;
      });
      const keywords = ['training', 'certification', 'competency', 'qualification', 'skill gap', 'assessment', 'evaluation', 'compliance', 'violation', 'recommendation', 'action required', 'priority', 'key finding', 'summary', 'conclusion', 'finding', 'training need', 'competency level'];
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
        text = text.replace(regex, '<strong class="font-bold text-gray-900 underline decoration-2 decoration-[#0B3D91]">$1</strong>');
      });
      return text;
    };

    const processTables = (str: string): string => {
      const tableRegex = /(\|.+\|\r?\n\|[-\s|:]+\|\r?\n(?:\|.+\|\r?\n?)+)/g;

      return str.replace(tableRegex, (match) => {
        const lines = match
          .trim()
          .split(/\r?\n/)
          .filter((line) => line.trim() && line.includes("|"));
        if (lines.length < 2) return match;

        const headerLine = lines[0];
        const dataLines = lines.slice(2);

        const headers = headerLine
          .split("|")
          .map((h) => h.trim())
          .filter((h) => h && !h.match(/^[-:|\s]+$/));

        if (headers.length === 0) return match;

        let tableHtml = '<div class="overflow-x-auto my-6 shadow-md rounded-lg border border-gray-200"><table class="min-w-full border-collapse bg-white">';

        tableHtml += '<thead><tr class="bg-gradient-to-r from-[#0B3D91] to-[#00A79D] text-white">';
        headers.forEach((header) => {
          let escapedHeader = escapeHtml(header);
          escapedHeader = escapedHeader.replace(
            new RegExp(BR_PLACEHOLDER, "g"),
            "<br />"
          );
          tableHtml += `<th class="border-b-2 border-[#082f70] px-6 py-4 text-left font-bold text-sm uppercase tracking-wider">${escapedHeader}</th>`;
        });
        tableHtml += "</tr></thead>";

        tableHtml += '<tbody class="bg-white divide-y divide-gray-200">';
        dataLines.forEach((line, idx) => {
          const cells = line
            .split("|")
            .map((c) => c.trim())
            .filter((c) => c && !c.match(/^[-:|\s]+$/));
          if (cells.length === headers.length) {
            const rowClass = idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100';
            tableHtml += `<tr class="${rowClass} transition-colors duration-150">`;
            cells.forEach((cell) => {
              let cellContent = escapeHtml(cell);
              cellContent = cellContent.replace(
                new RegExp(BR_PLACEHOLDER, "g"),
                "<br />"
              );
              cellContent = cellContent.replace(
                /\*\*(.*?)\*\*/g,
                '<strong class="font-bold text-gray-900">$1</strong>'
              );
              cellContent = cellContent.replace(
                /\*(.*?)\*/g,
                '<em class="italic text-gray-700">$1</em>'
              );
              
              // Add risk indicators to cells
              cellContent = addRiskIndicators(cellContent);
              
              // Highlight important information in cells
              cellContent = highlightImportant(cellContent);
              
              // Detect risk level in cell and add background color
              let cellClass = 'border border-gray-200 px-6 py-4 align-top text-sm';
              const cellLower = cell.toLowerCase();
              if (/high|critical|severe|extreme|urgent|dangerous|hazardous|non-compliance|expired|overdue|failing|inadequate/.test(cellLower)) {
                cellClass += ' bg-red-50 border-l-4 border-l-red-500';
              } else if (/medium|moderate|warning|caution|significant|pending|review required|needs improvement|attention required/.test(cellLower)) {
                cellClass += ' bg-orange-50 border-l-4 border-l-orange-500';
              } else if (/low|minimal|safe|acceptable|controlled|minor|negligible|approved|valid|compliant|certified|completed|proficient/.test(cellLower)) {
                cellClass += ' bg-green-50 border-l-4 border-l-green-500';
              }
              
              cellContent = cellContent.replace(/\n/g, "<br />");
              tableHtml += `<td class="${cellClass}">${cellContent}</td>`;
            });
            tableHtml += "</tr>";
          }
        });
        tableHtml += "</tbody></table></div>";

        return tableHtml;
      });
    };

    let html = processTables(processedText);

    const escapeNonHtml = (str: string): string => {
      const parts = str.split(/(<[^>]+>)/);
      return parts
        .map((part) => {
          if (part.startsWith("<") && part.endsWith(">")) {
            return part;
          }
          return escapeHtml(part);
        })
        .join("");
    };

    html = escapeNonHtml(html);
    
    // Add risk indicators to non-table content
    html = addRiskIndicators(html);
    
    // Highlight important information
    html = highlightImportant(html);

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

    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      const beforeMatch = html.substring(0, html.indexOf(match));
      const lastTable = beforeMatch.lastIndexOf("<table");
      const lastTableClose = beforeMatch.lastIndexOf("</table>");
      if (lastTable > lastTableClose) {
        return match;
      }
      return `<pre class="bg-gray-100 p-4 rounded my-4 overflow-x-auto border"><code>${code}</code></pre>`;
    });

    html = html.replace(/`([^`]+)`/g, (match, code) => {
      const beforeMatch = html.substring(0, html.indexOf(match));
      const lastTable = beforeMatch.lastIndexOf("<table");
      const lastTableClose = beforeMatch.lastIndexOf("</table>");
      if (lastTable > lastTableClose) {
        return match;
      }
      return `<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">${code}</code>`;
    });

    html = html.replace(/\*\*(.*?)\*\*/g, (match, text) => {
      if (match.includes("<td") || match.includes("</td>")) {
        return match;
      }
      return `<strong class="font-bold text-gray-800">${text}</strong>`;
    });

    html = html.replace(/\*(.*?)\*/g, (match, text) => {
      if (
        match.includes("<td") ||
        match.includes("</td>") ||
        match.includes("<strong>")
      ) {
        return match;
      }
      return `<em class="italic">${text}</em>`;
    });

    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
    );

    html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 mb-1">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>');

    html = html.replace(
      /(<li.*<\/li>)/g,
      '<ul class="list-disc ml-6 my-4">$1</ul>'
    );

    html = html
      .split(/\n\n+/)
      .map((para) => {
        if (para.trim()) {
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

    html = html.replace(new RegExp(BR_PLACEHOLDER, "g"), "<br />");

    return html;
  };

  return (
    <div
      className="prose prose-slate max-w-none prose-headings:text-[#0B3D91] prose-strong:text-gray-700 prose-a:text-blue-600"
      dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
    />
  );
};

// --- Component ---
export const Training: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  const reportRef = useRef<HTMLDivElement | null>(null);
  const reportContentRef = useRef<HTMLDivElement | null>(null);
  const chartsContentRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // backend data
  const [aiReport, setAiReport] = useState<string>("");
  const [chartList, setChartList] = useState<ChartFile[]>([]);
  const [selectedChartName, setSelectedChartName] = useState<string>("");
  const [selectedChartHtml, setSelectedChartHtml] = useState<string>("");

  // rotate quotes while generating
  useEffect(() => {
    if (isGenerating) {
      const quoteInterval = setInterval(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % aiQuotes.length);
      }, 3000);
      return () => clearInterval(quoteInterval);
    }
  }, [isGenerating]);

  // handle file pick
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

  // helper: upload file to backend
  const uploadExcelFile = async (file: File) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("User not authenticated — no token found.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BACKEND_URL}/upload-training`, {
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

  // helper: trigger backend to build report.md and charts/*.html
  const triggerGeneration = async () => {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    // Generate report
    const r1 = await fetch(`${BACKEND_URL}/generate-training-report`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!r1.ok) {
      let errorMessage = `Report generation failed (${r1.status})`;
      const clonedResponse = r1.clone();
      
      try {
        const errorData = await r1.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        try {
          const errorText = await clonedResponse.text();
          if (errorText && errorText.trim()) {
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

    await new Promise((res) => setTimeout(res, 1200));

    // Generate charts
    const r2 = await fetch(`${BACKEND_URL}/generate-training-charts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!r2.ok) {
      let errorMessage = `Chart generation failed (${r2.status})`;
      const clonedResponse2 = r2.clone();
      
      try {
        const errorData = await r2.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        try {
          const errorText = await clonedResponse2.text();
          if (errorText && errorText.trim()) {
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

  // helper: pull AI report text
  const fetchReportText = async (): Promise<string> => {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const res = await fetch(`${BACKEND_URL}/training-report`, {
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
        const detail =
          parsed.detail || parsed.message || JSON.stringify(parsed);
        console.error("Report endpoint returned JSON error:", parsed);
        throw new Error(detail);
      } catch (e) {
        if (!res.ok) {
          console.error("Report endpoint returned non-json error:", raw);
          throw new Error(raw || `Fetch /training-report failed (${res.status})`);
        }
      }
    }

    if (!res.ok) {
      console.error("Fetching /training-report failed", res.status, raw);
      throw new Error(raw || `Fetching /training-report failed (${res.status})`);
    }

    if (typeof raw !== "string") {
      console.error(
        "❌ CRITICAL: fetchReportText received non-string:",
        typeof raw,
        raw
      );
      return "";
    }

    const cleaned = String(raw).trim();
    return cleaned;
  };

  // helper: pull list of charts
  const fetchChartsList = async () => {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const res = await fetch(`${BACKEND_URL}/training-charts`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Fetching /training-charts list failed (${res.status}): ${body}`);
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

    if (data.total_training_charts && Array.isArray(data.charts)) {
      return data.charts.map((chart: any) => ({
        name: chart.name ?? "",
        path: chart.path,
      }));
    }

    return [];
  };

  // helper: fetch an individual chart HTML
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

  // main "Generate" button flow
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
      await uploadExcelFile(selectedFile);
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
        console.error(
          "❌ CRITICAL: reportText is not a string! Type:",
          typeof reportText,
          "Value:",
          reportText
        );
        safeReport = "";
      }

      if (typeof safeReport === "string") {
        setAiReport(safeReport);
      } else {
        console.error(
          "❌ Final check failed - safeReport is not string:",
          typeof safeReport
        );
        setAiReport("");
      }

      if (chartsArr && chartsArr.length > 0) {
        setChartList(chartsArr);

        const firstChartName = chartsArr[0].name;
        setSelectedChartName(firstChartName);

        try {
          const firstHtml = await fetchChartHtml(firstChartName);
          setSelectedChartHtml(firstHtml);
        } catch (err: any) {
          console.error("Failed to auto-load first chart:", err);
          toast.error("Failed to load first chart", {
            description: err.message,
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

      toast.dismiss("upload");
      toast.dismiss("gen_report");
      toast.dismiss("gen_charts");

      const errorMessage = error?.message || "Could not process the file. Please try again.";
      toast.error("Generation Failed", {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  // when user changes dropdown chart
  const handleChartSelect = async (chartName: string) => {
    setSelectedChartName(chartName);

    try {
      const html = await fetchChartHtml(chartName);
      setSelectedChartHtml(html);
    } catch (error: any) {
      console.error("Failed to load chart:", error);
      toast.error("Failed to load chart", {
        description: error.message,
      });
      setSelectedChartHtml("<p>Error loading chart.</p>");
    }
  };

  // Download PDF of both report and charts
  const downloadPDF = async () => {
    if (!reportContentRef.current) {
      toast.error("Error", {
        description: "Cannot find report content to download.",
      });
      return;
    }

    toast.info("Generating PDF", { 
      description: "Capturing report and charts... This may take a moment." 
    });

    const originalBG = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#FFFFFF";

    const originalReportStyles: { display?: string; visibility?: string; opacity?: string } = {};
    const originalChartsStyles: { display?: string; visibility?: string; opacity?: string } = {};

    try {
      if (reportContentRef.current) {
        const reportEl = reportContentRef.current as HTMLElement;
        originalReportStyles.display = reportEl.style.display;
        originalReportStyles.visibility = reportEl.style.visibility;
        originalReportStyles.opacity = reportEl.style.opacity;
        reportEl.style.display = 'block';
        reportEl.style.visibility = 'visible';
        reportEl.style.opacity = '1';
      }

      if (chartsContentRef.current) {
        const chartsEl = chartsContentRef.current as HTMLElement;
        originalChartsStyles.display = chartsEl.style.display;
        originalChartsStyles.visibility = chartsEl.style.visibility;
        originalChartsStyles.opacity = chartsEl.style.opacity;
        chartsEl.style.display = 'block';
        chartsEl.style.visibility = 'visible';
        chartsEl.style.opacity = '1';
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const pageMargin = 10;
      const safePdfHeight = pdfHeight - pageMargin * 2;
      const safePdfWidth = pdfWidth - pageMargin * 2;

      const addCanvasToPdf = (canvas: HTMLCanvasElement, pdf: jsPDF, startNewPage: boolean = false) => {
        const imgData = canvas.toDataURL("image/png", 1.0);
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        if (imgWidth === 0 || imgHeight === 0) {
          return;
        }

        if (startNewPage) {
          pdf.addPage();
        }

        const pageImgHeight = (safePdfWidth * imgHeight) / imgWidth;
        let heightLeft = pageImgHeight;
        let position = pageMargin;

        pdf.addImage(
          imgData,
          "PNG",
          pageMargin,
          position,
          safePdfWidth,
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
            safePdfWidth,
            pageImgHeight
          );
          heightLeft -= safePdfHeight;
        }
      };

      toast.info("Capturing report...", { id: "pdf-progress" });
      
      if (reportContentRef.current) {
        reportContentRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const reportCanvas = await html2canvas(reportContentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FFFFFF",
        logging: false,
        allowTaint: false,
        removeContainer: false,
        imageTimeout: 15000,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-ref="report-content"]') || 
                               clonedDoc.body.querySelector('.shadow-lg');
          if (clonedElement) {
            (clonedElement as HTMLElement).style.backgroundColor = '#FFFFFF';
          }
        },
      });

      addCanvasToPdf(reportCanvas, pdf);

      if (chartsContentRef.current && chartList.length > 0 && selectedChartHtml) {
        toast.info("Capturing charts...", { id: "pdf-progress" });
        
        if (chartsContentRef.current) {
          chartsContentRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        const chartsCanvas = await html2canvas(chartsContentRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#FFFFFF",
          logging: false,
          allowTaint: false,
          removeContainer: false,
          imageTimeout: 15000,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc) => {
            const iframes = clonedDoc.querySelectorAll('iframe');
            iframes.forEach((iframe) => {
              iframe.style.display = 'block';
              iframe.style.visibility = 'visible';
              iframe.style.opacity = '1';
            });
          },
        });

        pdf.addPage();
        pdf.setFontSize(18);
        pdf.setTextColor(11, 61, 145);
        pdf.text("Interactive Charts", pageMargin, pageMargin + 10);

        const chartsImgData = chartsCanvas.toDataURL("image/png", 1.0);
        const chartsImgWidth = chartsCanvas.width;
        const chartsImgHeight = chartsCanvas.height;

        if (chartsImgWidth > 0 && chartsImgHeight > 0) {
          const chartsPageImgHeight = (safePdfWidth * chartsImgHeight) / chartsImgWidth;
          let chartsHeightLeft = chartsPageImgHeight;
          let chartsPosition = pageMargin + 15;

          pdf.addImage(
            chartsImgData,
            "PNG",
            pageMargin,
            chartsPosition,
            safePdfWidth,
            chartsPageImgHeight
          );
          chartsHeightLeft -= (safePdfHeight - 15);

          while (chartsHeightLeft > 0) {
            chartsPosition = -chartsHeightLeft + pageMargin;
            pdf.addPage();
            pdf.addImage(
              chartsImgData,
              "PNG",
              pageMargin,
              chartsPosition,
              safePdfWidth,
              chartsPageImgHeight
            );
            chartsHeightLeft -= safePdfHeight;
          }
        }
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Dattu_Training_Report_${timestamp}.pdf`;

      pdf.save(filename);
      
      toast.success("PDF Generated Successfully!", { id: "pdf-progress" });
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF", {
        description: error?.message || "An error occurred while generating the PDF.",
        id: "pdf-progress",
      });
    } finally {
      if (reportContentRef.current) {
        const reportEl = reportContentRef.current as HTMLElement;
        if (originalReportStyles.display !== undefined) {
          reportEl.style.display = originalReportStyles.display;
        }
        if (originalReportStyles.visibility !== undefined) {
          reportEl.style.visibility = originalReportStyles.visibility;
        }
        if (originalReportStyles.opacity !== undefined) {
          reportEl.style.opacity = originalReportStyles.opacity;
        }
      }

      if (chartsContentRef.current) {
        const chartsEl = chartsContentRef.current as HTMLElement;
        if (originalChartsStyles.display !== undefined) {
          chartsEl.style.display = originalChartsStyles.display;
        }
        if (originalChartsStyles.visibility !== undefined) {
          chartsEl.style.visibility = originalChartsStyles.visibility;
        }
        if (originalChartsStyles.opacity !== undefined) {
          chartsEl.style.opacity = originalChartsStyles.opacity;
        }
      }

      document.body.style.backgroundColor = originalBG;
    }
  };

  // --- RENDER LOGIC ---

  // 1. UPLOAD SCREEN
  if (!showDashboard && !isGenerating) {
    return (
      <div className="w-full py-12">
        <div className="text-center mb-10">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-extrabold text-[#0B3D91]"
          >
            <span className="px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 shadow-sm">
              DATTU AI Training Analyzer
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto mt-3"
          >
            Upload your Excel training dataset and let DATTU generate a smart,
            interactive, AI-powered analysis — including charts, trends and a
            full executive report.
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            {
              title: "1. Upload Excel File",
              icon: Upload,
              desc: "Upload training database Excel files.",
            },
            {
              title: "2. AI Analyzes Data",
              icon: Sparkles,
              desc: "DATTU processes training records, effectiveness & generates insights.",
            },
            {
              title: "3. View Dashboard",
              icon: BarChart2,
              desc: "Get interactive charts & a detailed AI written report.",
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
                    <GraduationCap className="w-12 h-12 text-[#0B3D91]" />
                  </motion.div>
                </div>
              </motion.div>

              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#0B3D91] to-[#00A79D] bg-clip-text text-transparent">
                Upload Training Database
              </CardTitle>
              <p className="text-gray-600 text-lg">
                Choose an Excel file (.xlsx / .xls) to begin the analysis.
              </p>
            </CardHeader>

            <CardContent className="space-y-6 px-6 sm:px-8 pb-8">
              <motion.label
                htmlFor="file-upload-training"
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
                      <GraduationCap className="w-12 h-12 text-gray-400 mb-3" />
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
                  id="file-upload-training"
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

  // 2. LOADING SCREEN
  if (isGenerating) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <motion.div
          className="text-center max-w-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
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
              <Bot className="w-16 h-16 text-[#0B3D91]" />
            </div>
          </motion.div>

          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#0B3D91] to-[#00A79D] bg-clip-text text-transparent">
            Analyzing Your Training Data...
          </h2>

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

  // 3. Dashboard (results)
  return (
    <div className="w-full space-y-6">
      <motion.div
        className="flex flex-wrap justify-between items-center gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-[#0B3D91]" />
            AI Training Analysis Report
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Analysis of: {selectedFile?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={downloadPDF}
            className="bg-[#0B3D91] hover:bg-[#082f70]"
          >
            <FileText className="w-4 h-4 mr-2" />
            Download Report (PDF)
          </Button>
          <Button onClick={() => setShowDashboard(false)} variant="outline">
            Upload New File
          </Button>
        </div>
      </motion.div>

      <div ref={reportRef} className="bg-white p-2 sm:p-4 rounded-md">
        <Tabs defaultValue="report">
          <TabsList className="w-full justify-start h-12 bg-gray-100">
            <TabsTrigger
              value="report"
              className="flex items-center gap-2 text-base data-[state=active]:bg-white"
            >
              <Sparkles className="h-5 w-5 text-[#0B3D91]" /> AI-Generated
              Report
            </TabsTrigger>
            <TabsTrigger
              value="charts"
              className="flex items-center gap-2 text-base data-[state=active]:bg-white"
            >
              <BarChart2 className="h-5 w-5 text-[#00A79D]" /> Interactive
              Charts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="report" className="mt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-lg">
                <div ref={reportContentRef}>
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-800">
                      <span className="text-4xl text-[#0B3D91] font-extrabold underline">
                        DATTU
                      </span>{" "}
                      Training Analysis
                    </CardTitle>

                    <CardDescription className="text-lg text-gray-600">
                      This is the full report generated by the AI based on your
                      uploaded training data.
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
                      const safeContent: string =
                        typeof aiReport === "string"
                          ? aiReport
                          : String(aiReport || "");

                      if (typeof aiReport !== "string") {
                        console.error(
                          "❌ RENDER CHECK - aiReport is NOT a string! Type:",
                          typeof aiReport,
                          "Value:",
                          aiReport
                        );
                      }

                      if (
                        typeof safeContent === "string" &&
                        safeContent.length > 0
                      ) {
                        return <SafeMarkdown content={safeContent} />;
                      } else {
                        return (
                          <p className="text-red-500">
                            {aiReport
                              ? "Invalid report format received from backend."
                              : "No report loaded yet."}
                          </p>
                        );
                      }
                    })()}
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="charts" className="mt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-lg">
                <div ref={chartsContentRef}>
                  <CardHeader>
                    <CardTitle>Interactive Charts</CardTitle>
                    <CardDescription>
                      Select a chart to view the interactive (Plotly) HTML report
                      generated by the backend.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <Select
                      onValueChange={handleChartSelect}
                      value={selectedChartName || undefined}
                    >
                      <SelectTrigger className="w-full md:w-1/2">
                        <SelectValue placeholder="Select a chart to display" />
                      </SelectTrigger>

                      <SelectContent>
                        {chartList.map((chart) => (
                          <SelectItem key={chart.name} value={chart.name}>
                            {chart.name
                              .replace(".html", "")
                              .replace(/_/g, " ")
                              .replace(/^\d+\s*/, "")
                              .replace(/^training_/i, "")}
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
                          <p className="ml-2">
                            {selectedChartName
                              ? "Loading Chart..."
                              : "Select a chart from the dropdown"}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
