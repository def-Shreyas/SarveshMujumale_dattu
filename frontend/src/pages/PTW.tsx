"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthToken, apiClient } from "@/lib/api";
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
  FileCheck,
  BarChart2,
  Bot,
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
import { cn } from "@/lib/utils";

// 👇 change this if your backend runs on a different URL/port
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// --- AI Motivational Quotes ---
const aiQuotes = [
  "AI is analyzing your PTW data...",
  "Analyzing your permit-to-work data...",
  "Identifying bottlenecks in your PTW approval chain...",
  "Scanning permits for high-risk work like 'Hot Work' and 'Confined Space'...",
  "Correlating permit data with safety KPIs to find hidden trends...",
  "Checking for overdue permits and compliance gaps...",
];

// --- Types ---
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

  // Simple markdown-to-HTML converter
  const formatMarkdown = (text: string): string => {
    // First, strip HTML attributes from existing HTML tags to prevent them from being displayed as text
    const stripHtmlAttributes = (str: string): string => {
      // Remove style attributes and other inline attributes from HTML tags
      // This handles cases like <p style="font-size: 12px"> or <div class="something">
      str = str.replace(/<([a-zA-Z][a-zA-Z0-9]*)\s+[^>]*>/g, '<$1>');

      // Remove any standalone HTML attribute text that might be displayed (like style="..." or class="...")
      // This handles cases where HTML attributes appear as plain text
      str = str.replace(/\b(style|class|id|width|height|align|valign|colspan|rowspan|bgcolor|color|font-size|font-family|text-align|margin|padding|border)\s*=\s*["'][^"']*["']/gi, '');
      str = str.replace(/\b(style|class|id|width|height|align|valign|colspan|rowspan|bgcolor|color|font-size|font-family|text-align|margin|padding|border)\s*=\s*[^\s>]+/gi, '');

      // Remove CSS unit patterns that appear standalone (like "12px", "10em", etc.) when they appear as text
      // Only remove if they appear in contexts suggesting HTML/CSS attributes
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
      let protectedStr = str.replace(/&(?:#\d+|#x[\da-fA-F]+|\w+);/g, (match) => {
        const placeholder = `__ENTITY_${placeholderIndex++}__`;
        entityPlaceholders[placeholder] = match;
        return placeholder;
      });

      // Now escape only <, >, and & (but not the ones we protected)
      protectedStr = protectedStr.replace(/&/g, '&amp;');
      protectedStr = protectedStr.replace(/</g, '&lt;');
      protectedStr = protectedStr.replace(/>/g, '&gt;');

      // Restore protected entities
      Object.keys(entityPlaceholders).forEach(placeholder => {
        protectedStr = protectedStr.replace(new RegExp(placeholder, 'g'), entityPlaceholders[placeholder]);
      });

      return protectedStr;
    };

    // Decode any existing HTML entities that might be in the markdown
    // (in case the backend already escaped them)
    const decodeHtmlEntities = (str: string): string => {
      // Handle both named entities and numeric entities
      return str
        // Named entities
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        // Numeric entities (decimal and hex)
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
        .replace(/&#x([\da-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      // Note: We don't decode &amp;, &lt;, &gt; here as they might be intentional
      // and we'll handle them in escapeHtml
    };

    // Preserve safe HTML tags like <br>, <br/>, <br /> before escaping
    // Use placeholders that won't be escaped
    const BR_PLACEHOLDER = '___BR_TAG_PLACEHOLDER___';
    const safeHtmlTags = [
      { pattern: /<br\s*\/?>/gi, replacement: BR_PLACEHOLDER }
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
            tableHtml += `<tr class="${idx % 2 === 0 ? "bg-white" : "bg-gray-50"
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
      return parts.map((part) => {
        if (part.startsWith('<') && part.endsWith('>')) {
          return part; // Already HTML, don't escape
        }
        return escapeHtml(part);
      }).join('');
    };

    // Escape non-HTML parts
    html = escapeNonHtml(html);

    // Headers (process from largest to smallest)
    html = html.replace(/^#### (.*$)/gim, '<h4 class="text-xl font-bold mt-5 mb-2 text-[#0B3D91]">$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold mt-6 mb-3 text-[#0B3D91]">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold mt-8 mb-4 text-[#0B3D91]">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mt-10 mb-5 text-[#0B3D91]">$1</h1>');

    // Code blocks (before inline code) - but skip if inside table
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      // Check if this is inside a table
      const beforeMatch = html.substring(0, html.indexOf(match));
      const lastTable = beforeMatch.lastIndexOf('<table');
      const lastTableClose = beforeMatch.lastIndexOf('</table>');
      if (lastTable > lastTableClose) {
        return match; // Inside table, don't process
      }
      return `<pre class="bg-gray-100 p-4 rounded my-4 overflow-x-auto border"><code>${code}</code></pre>`;
    });

    // Inline code (but not inside tables)
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      const beforeMatch = html.substring(0, html.indexOf(match));
      const lastTable = beforeMatch.lastIndexOf('<table');
      const lastTableClose = beforeMatch.lastIndexOf('</table>');
      if (lastTable > lastTableClose) {
        return match; // Inside table, don't process
      }
      return `<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">${code}</code>`;
    });

    // Bold (but preserve what's already in tables)
    html = html.replace(/\*\*(.*?)\*\*/g, (match, text) => {
      // Check if already inside a table cell
      if (match.includes('<td') || match.includes('</td>')) {
        return match; // Already processed in table
      }
      return `<strong class="font-bold text-gray-800">${text}</strong>`;
    });

    // Italic
    html = html.replace(/\*(.*?)\*/g, (match, text) => {
      if (match.includes('<td') || match.includes('</td>') || match.includes('<strong>')) {
        return match; // Already processed
      }
      return `<em class="italic">${text}</em>`;
    });

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');

    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 mb-1">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>');

    // Wrap list items in ul
    html = html.replace(/(<li.*<\/li>)/g, '<ul class="list-disc ml-6 my-4">$1</ul>');

    // Line breaks - convert double newlines to paragraph breaks
    // But skip if inside table
    html = html.split(/\n\n+/).map(para => {
      if (para.trim()) {
        // Don't wrap if already a header, list, code block, or table
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

    // Restore BR placeholders as actual <br /> tags (at the very end, after all processing)
    html = html.replace(new RegExp(BR_PLACEHOLDER, 'g'), '<br />');

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

// --- Component ---
export const PTW: React.FC = () => {
  const reportRef = useRef<HTMLDivElement | null>(null);
  const reportContentRef = useRef<HTMLDivElement | null>(null);
  const chartsContentRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingCharts, setIsGeneratingCharts] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // backend data
  const [aiReport, setAiReport] = useState<string>("");
  const [chartList, setChartList] = useState<ChartFile[]>([]);
  const [selectedChartName, setSelectedChartName] = useState<string>("");
  const [selectedChartHtml, setSelectedChartHtml] = useState<string>("");

  // rotate quotes while generating
  useEffect(() => {
    if (isGeneratingReport || isGeneratingCharts) {
      const quoteInterval = setInterval(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % aiQuotes.length);
      }, 3000);
      return () => clearInterval(quoteInterval);
    }
  }, [isGeneratingReport, isGeneratingCharts]);

  // ✅ DEBUG: Monitor aiReport changes to catch any type issues
  useEffect(() => {
    console.log("🔍 aiReport state changed - Type:", typeof aiReport);
    console.log("🔍 aiReport state changed - Is string?", typeof aiReport === "string");
    if (typeof aiReport !== "string") {
      console.error("❌ CRITICAL: aiReport state is NOT a string! Type:", typeof aiReport, "Value:", aiReport);
    } else {
      console.log("✅ aiReport state is valid string, length:", aiReport.length);
    }
  }, [aiReport]);

  // handle file pick
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const validExtensions = [".xlsx", ".xls"];
      const fileExtension = file.name
        .substring(file.name.lastIndexOf("."))
        .toLowerCase();

      if (validExtensions.includes(fileExtension)) {
        // Check file size (limit to 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
          toast.error("File Too Large", {
            description: "Please upload a file smaller than 10MB.",
          });
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }

        setSelectedFile(file);
        setFileUploaded(false);
        setShowReport(false);
        setShowCharts(false);
        setAiReport("");
        setChartList([]);
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
  const uploadPtwFile = async (file: File) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("User not authenticated — no token found.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BACKEND_URL}/upload-ptw`, {
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

    const data = await res.json();
    return data;
  };

  // helper: generate report
  const generateReport = async () => {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    setIsGeneratingReport(true);
    setCurrentQuoteIndex(0);

    try {
      const response = await apiClient.post("/generate-ptw-report");

      if (response && response.report_content) {
        // Use report_content directly from API response
        const reportContent = typeof response.report_content === "string"
          ? response.report_content
          : String(response.report_content || "");

        setAiReport(reportContent);
        setShowReport(true);
        toast.success("Report Generated!", {
          description: `Report generated successfully (${response.report_length || 0} characters)`,
        });
      } else {
        throw new Error("Invalid response from server: missing report_content");
      }
    } catch (error: any) {
      console.error("Error generating report:", error);
      const errorMessage = error?.message || "Failed to generate report. Please try again.";

      // Provide user-friendly error messages
      if (errorMessage.includes("API key") || errorMessage.includes("GOOGLE_API_KEY")) {
        toast.error("API Configuration Error", {
          description: "API key not configured. Please contact the administrator.",
        });
      } else if (errorMessage.includes("No extracted tables") || errorMessage.includes("upload")) {
        toast.error("Upload Required", {
          description: "Please upload the Excel file first before generating the report.",
        });
      } else if (errorMessage.includes("network") || errorMessage.includes("connection")) {
        toast.error("Network Error", {
          description: "Please check your internet connection and try again.",
        });
      } else {
        toast.error("Report Generation Failed", {
          description: errorMessage,
        });
      }
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // helper: generate charts
  const generateCharts = async () => {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    setIsGeneratingCharts(true);
    setCurrentQuoteIndex(0);
    // Reset chart state - don't show charts until user selects one
    setSelectedChartName("");
    setSelectedChartHtml("");

    try {
      const response = await apiClient.post("/generate-ptw-charts");

      if (response && response.chart_files && Array.isArray(response.chart_files)) {
        const charts = response.chart_files.map((name: string) => ({ name }));
        setChartList(charts);

        // Don't auto-load first chart - let user select from dropdown
        // Only set showCharts to true so the dropdown appears
        setShowCharts(true);
        toast.success("Charts Generated!", {
          description: `${charts.length} chart(s) generated successfully. Please select a chart to view.`,
        });
      } else {
        throw new Error("Invalid response from server: missing chart_files");
      }
    } catch (error: any) {
      console.error("Error generating charts:", error);
      const errorMessage = error?.message || "Failed to generate charts. Please try again.";

      if (errorMessage.includes("No extracted tables") || errorMessage.includes("upload")) {
        toast.error("Upload Required", {
          description: "Please upload the Excel file first before generating charts.",
        });
      } else {
        toast.error("Chart Generation Failed", {
          description: errorMessage,
        });
      }
    } finally {
      setIsGeneratingCharts(false);
    }
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

  // main "Upload" button flow
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("No File Selected");
      return;
    }

    setIsUploading(true);
    setFileUploaded(false);
    setShowReport(false);
    setShowCharts(false);
    setAiReport("");
    setChartList([]);

    try {
      toast.info("Uploading file...", { id: "upload" });
      await uploadPtwFile(selectedFile);
      toast.success("File Uploaded Successfully!", { id: "upload" });
      setFileUploaded(true);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      const errorMessage = error?.message || "Could not upload the file. Please try again.";
      toast.error("Upload Failed", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // when user changes dropdown chart
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

    // Store original styles to restore later
    const originalReportStyles: { display?: string; visibility?: string; opacity?: string } = {};
    const originalChartsStyles: { display?: string; visibility?: string; opacity?: string } = {};

    try {
      // Temporarily make both tabs visible for capture
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

      // Wait a bit for styles to apply and iframes to render
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

      // Helper function to add canvas to PDF with pagination
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

        // Add first page
        pdf.addImage(
          imgData,
          "PNG",
          pageMargin,
          position,
          safePdfWidth,
          pageImgHeight
        );
        heightLeft -= safePdfHeight;

        // Add additional pages if needed
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

      // 1. Capture Report Tab
      toast.info("Capturing report...", { id: "pdf-progress" });

      // Scroll to top of report content
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
          // Ensure colors are preserved in cloned document
          const clonedElement = clonedDoc.querySelector('[data-ref="report-content"]') ||
            clonedDoc.body.querySelector('.shadow-lg');
          if (clonedElement) {
            (clonedElement as HTMLElement).style.backgroundColor = '#FFFFFF';
          }
        },
      });

      addCanvasToPdf(reportCanvas, pdf);

      // 2. Capture Charts Tab (if charts exist)
      if (chartsContentRef.current && chartList.length > 0 && selectedChartHtml) {
        toast.info("Capturing charts...", { id: "pdf-progress" });

        // Scroll to top of charts content
        if (chartsContentRef.current) {
          chartsContentRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Wait a bit more for iframe to fully render
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Capture the charts container
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
            // Ensure iframe content is visible
            const iframes = clonedDoc.querySelectorAll('iframe');
            iframes.forEach((iframe) => {
              iframe.style.display = 'block';
              iframe.style.visibility = 'visible';
              iframe.style.opacity = '1';
            });
          },
        });

        // Add charts section with title
        pdf.addPage();
        pdf.setFontSize(18);
        pdf.setTextColor(11, 61, 145); // #0B3D91
        pdf.text("Interactive Charts", pageMargin, pageMargin + 10);

        // Add charts image below title
        const chartsImgData = chartsCanvas.toDataURL("image/png", 1.0);
        const chartsImgWidth = chartsCanvas.width;
        const chartsImgHeight = chartsCanvas.height;

        if (chartsImgWidth > 0 && chartsImgHeight > 0) {
          const chartsPageImgHeight = (safePdfWidth * chartsImgHeight) / chartsImgWidth;
          let chartsHeightLeft = chartsPageImgHeight;
          let chartsPosition = pageMargin + 15; // Offset for title

          // Add first page of charts
          pdf.addImage(
            chartsImgData,
            "PNG",
            pageMargin,
            chartsPosition,
            safePdfWidth,
            chartsPageImgHeight
          );
          chartsHeightLeft -= (safePdfHeight - 15);

          // Add additional pages if needed
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

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Dattu_PTW_Report_${timestamp}.pdf`;

      // Save PDF - this will trigger the file explorer dialog
      pdf.save(filename);

      toast.success("PDF Generated Successfully!", { id: "pdf-progress" });
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF", {
        description: error?.message || "An error occurred while generating the PDF.",
        id: "pdf-progress",
      });
    } finally {
      // Restore original styles
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

  //
  // ---------- RENDERING ----------
  //

  // 1. Upload screen
  if (!fileUploaded && !isUploading) {
    return (
      // Use py-12 for consistent vertical padding
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
              Permit-to-Work (PTW) Analyzer
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto mt-3"
          >
            Upload your Permit-to-Work (PTW) Excel data and let DATTU generate
            a smart, interactive dashboard of closure rates, high-risk work, and AI insights.
          </motion.p>
        </div>

        {/* HOW IT WORKS */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            {
              title: "1. Upload PTW Excel",
              icon: Upload,
              desc: "Upload your raw PTW logs and KPI Excel files.",
            },
            {
              title: "2. AI Analyzes Risks",
              icon: Sparkles,
              desc: "DATTU processes closure times, work types & risks.",
            },
            {
              title: "3. View Dashboard",
              icon: BarChart2,
              desc: "Get interactive charts on overdue permits & compliance.",
            },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              // --- ENHANCED HOVER ---
              whileHover={{ y: -5, scale: 1.02 }}
              className="group bg-white shadow-md rounded-xl p-5 border border-gray-200 hover:shadow-xl hover:border-[#00A79D] transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                {/* --- ICON ANIMATION --- */}
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
                  {/* --- "MOVING" ICON (for PTW) --- */}
                  <motion.div
                    animate={{ y: [0, -4, 0] }} // Bobbing animation
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <FileCheck className="w-12 h-12 text-[#0B3D91]" />
                  </motion.div>
                </div>
              </motion.div>

              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#0B3D91] to-[#00A79D] bg-clip-text text-transparent">
                {/* --- Text for PTW --- */}
                Upload PTW & KPI Report
              </CardTitle>
              <p className="text-gray-600 text-lg">
                Choose an Excel file (.xlsx / .xls) containing Permit to Work (PTW) data to begin the analysis.
              </p>
            </CardHeader>

            <CardContent className="space-y-6 px-6 sm:px-8 pb-8">
              {/* --- DRAG & DROP HOVER EFFECT --- */}
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
                      <Upload className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="mb-2 text-base font-semibold text-gray-700">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        Excel (.xlsx, .xls) files only (Max 10MB)
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

              {/* --- ENHANCED BUTTON HOVER --- */}
              <motion.div
                whileHover={{ scale: selectedFile ? 1.02 : 1 }}
                whileTap={{ scale: selectedFile ? 0.99 : 1 }}
              >
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="w-full bg-gradient-to-r from-[#0B3D91] to-[#00A79D] text-white font-semibold py-6 text-lg transition-all duration-300 disabled:opacity-50
                             shadow-lg hover:shadow-xl hover:shadow-[#0B3D91]/40"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Upload File
                    </>
                  )}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ... (keep the rest of your file, including the 'isGenerating' and 'showDashboard' blocks)


  // 2. Uploading screen
  if (isUploading) {
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
              <Upload className="w-16 h-16 text-[#0B3D91]" />
            </div>
          </motion.div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#0B3D91] to-[#00A79D] bg-clip-text text-transparent">
            Uploading Your File...
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Please wait while we process your Excel file.
          </p>
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

  // 3. After upload - show Generate buttons
  if (fileUploaded && !showReport && !showCharts && !isGeneratingReport && !isGeneratingCharts) {
    return (
      <div className="w-full py-12">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-extrabold text-[#0B3D91] mb-4">
            File Uploaded Successfully!
          </h1>
          <p className="text-lg text-gray-600">
            File: <span className="font-semibold">{selectedFile?.name}</span>
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-lg border-t-4 border-[#0B3D91] h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-[#0B3D91]" />
                  Generate AI Report
                </CardTitle>
                <CardDescription>
                  Generate a comprehensive AI-powered analysis report of your Permit to Work (PTW) data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={generateReport}
                  disabled={isGeneratingReport}
                  className="w-full bg-[#0B3D91] hover:bg-[#082f70] text-white font-semibold py-6 text-lg"
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-lg border-t-4 border-[#00A79D] h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="w-6 h-6 text-[#00A79D]" />
                  Generate Charts
                </CardTitle>
                <CardDescription>
                  Generate interactive charts and visualizations from your Permit to Work (PTW) data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={generateCharts}
                  disabled={isGeneratingCharts}
                  className="w-full bg-[#00A79D] hover:bg-[#008a7e] text-white font-semibold py-6 text-lg"
                >
                  {isGeneratingCharts ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Charts...
                    </>
                  ) : (
                    <>
                      <BarChart2 className="w-5 h-5 mr-2" />
                      Generate Charts
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="flex justify-center mt-8">
          <Button
            onClick={() => {
              setFileUploaded(false);
              setSelectedFile(null);
              setShowReport(false);
              setShowCharts(false);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            variant="outline"
          >
            Upload New File
          </Button>
        </div>
      </div>
    );
  }

  // 4. Loading screen for report generation
  if (isGeneratingReport) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <motion.div
          className="text-center max-w-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* --- ENHANCED: "Breathing" AI Icon --- */}
          <motion.div
            className="flex justify-center mb-8"
            animate={{ scale: [1, 1.05, 1] }} // "Breathing" effect
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="p-6 rounded-full bg-gradient-to-br from-[#0B3D91]/20 to-[#00A79D]/20 border-2 border-[#0B3D91]/30 shadow-lg">
              {/* --- NEW: AI-themed Icon --- */}
              <Bot className="w-16 h-16 text-[#0B3D91]" />
            </div>
          </motion.div>

          {/* Main Title */}
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#0B3D91] to-[#00A79D] bg-clip-text text-transparent">
            Generating AI Report...
          </h2>

          {/* Rotating AI Quotes (Using your PTW quotes) */}
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

          {/* --- NEW: Dynamic Loading Step Text --- */}
          <div className="h-6 mt-4"> {/* Height container */}
            <AnimatePresence mode="wait">
              <motion.p
                // Keyed to the step
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-gray-500"
              >

              </motion.p>
            </AnimatePresence>
          </div>

          {/* --- NEW: Indeterminate Progress Bar --- */}
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

  // 5. Loading screen for chart generation
  if (isGeneratingCharts) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <motion.div
          className="text-center max-w-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* --- ENHANCED: "Breathing" Chart Icon --- */}
          <motion.div
            className="flex justify-center mb-8"
            animate={{ scale: [1, 1.05, 1] }} // "Breathing" effect
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="p-6 rounded-full bg-gradient-to-br from-[#00A79D]/20 to-[#0B3D91]/20 border-2 border-[#00A79D]/30 shadow-lg">
              <BarChart2 className="w-16 h-16 text-[#00A79D]" />
            </div>
          </motion.div>

          {/* Main Title */}
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#00A79D] to-[#0B3D91] bg-clip-text text-transparent">
            Generating Interactive Charts...
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
                <Sparkles className="w-5 h-5 text-[#00A79D] animate-pulse" />
                <p className="text-xl text-gray-600 font-medium">
                  {aiQuotes[currentQuoteIndex]}
                </p>
                <Sparkles className="w-5 h-5 text-[#0B3D91] animate-pulse" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* --- Indeterminate Progress Bar --- */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-8 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-[#00A79D] to-[#0B3D91] h-2.5 rounded-full"
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

  // Helper function to render report content
  const renderReportContent = () => {
    return (
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
                PTW & KPI Analysis
              </CardTitle>

              <CardDescription className="text-lg text-gray-600">
                This is the full PTW and KPI analysis report generated by the AI based on your
                uploaded data.
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
    );
  };

  // Helper function to render charts content
  const renderChartsContent = () => {
    return (
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
                        .replace(/^\d+\s*/, "")}
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
                  <div className="h-full w-full flex flex-col items-center justify-center text-gray-500">
                    <BarChart2 className="h-12 w-12 mb-4 text-gray-400" />
                    <p className="text-lg font-medium">
                      {chartList.length > 0
                        ? "Please select a chart from the dropdown above to view it"
                        : "No charts available"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>
    );
  };

  // 6. Dashboard (results) - Show Report or Charts
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
            <FileCheck className="w-8 h-8 text-[#0B3D91]" />
            Permit-to-Work (PTW)
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Analysis of: {selectedFile?.name}
          </p>
        </div>
        <div className="flex gap-2">
          {showReport && (
            <Button
              onClick={downloadPDF}
              className="bg-[#0B3D91] hover:bg-[#082f70]"
            >
              <FileText className="w-4 h-4 mr-2" />
              Download Report (PDF)
            </Button>
          )}
          <Button
            onClick={() => {
              setFileUploaded(false);
              setShowReport(false);
              setShowCharts(false);
              setSelectedFile(null);
              setAiReport("");
              setChartList([]);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            variant="outline"
          >
            Upload New File
          </Button>
          {fileUploaded && (
            <>
              {!showReport && (
                <Button
                  onClick={generateReport}
                  disabled={isGeneratingReport}
                  className="bg-[#0B3D91] hover:bg-[#082f70]"
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              )}
              {!showCharts && (
                <Button
                  onClick={generateCharts}
                  disabled={isGeneratingCharts}
                  className="bg-[#00A79D] hover:bg-[#008a7e]"
                >
                  {isGeneratingCharts ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BarChart2 className="w-4 h-4 mr-2" />
                      Generate Charts
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* PDF capture region */}
      <div ref={reportRef} className="bg-white p-2 sm:p-4 rounded-md">
        {showReport && showCharts ? (
          <Tabs defaultValue="report">
            <TabsList className="w-full justify-start h-12 bg-gray-100">
              <TabsTrigger
                value="report"
                className="flex items-center gap-2 text-base data-[state=active]:bg-white"
              >
                <Sparkles className="h-5 w-5 text-[#0B3D91]" /> AI-Generated Report
              </TabsTrigger>
              <TabsTrigger
                value="charts"
                className="flex items-center gap-2 text-base data-[state=active]:bg-white"
              >
                <BarChart2 className="h-5 w-5 text-[#00A79D]" /> Interactive Charts
              </TabsTrigger>
            </TabsList>

            {/* Report tab */}
            <TabsContent value="report" className="mt-6">
              {renderReportContent()}
            </TabsContent>

            {/* Charts tab */}
            <TabsContent value="charts" className="mt-6">
              {renderChartsContent()}
            </TabsContent>
          </Tabs>
        ) : showReport ? (
          renderReportContent()
        ) : showCharts ? (
          renderChartsContent()
        ) : null}
      </div>
    </div>
  );
};
