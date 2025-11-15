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
// NOTE: replaced custom Input usage with native input for ref support
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Loader2,
  Sparkles,
  Eye,
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
import { cn } from "@/lib/utils";

// 👇 change this if your backend runs on a different URL/port
const BACKEND_URL = "http://localhost:8000";

// --- AI Motivational Quotes ---
const aiQuotes = [
  "AI is transforming the way we analyze safety data...",
  "Machine learning helps us identify patterns we couldn't see before...",
  "Every dataset tells a story, AI helps us read it...",
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
        const lines = match.trim().split(/\r?\n/).filter(line => line.trim() && line.includes('|'));
        if (lines.length < 2) return match; // Need at least header and separator
        
        const headerLine = lines[0];
        const dataLines = lines.slice(2); // Skip header and separator
        
        // Parse header - split by | and filter empty
        const headers = headerLine.split('|').map(h => h.trim()).filter(h => h && !h.match(/^[-:|\s]+$/));
        
        if (headers.length === 0) return match; // No valid headers
        
        // Build table HTML
        let tableHtml = '<div class="overflow-x-auto my-6"><table class="min-w-full border-collapse border border-gray-300 shadow-sm">';
        
        // Table header
        tableHtml += '<thead><tr class="bg-[#0B3D91] text-white">';
        headers.forEach(header => {
          // Escape header text (but restore BR placeholders)
          let escapedHeader = escapeHtml(header);
          escapedHeader = escapedHeader.replace(new RegExp(BR_PLACEHOLDER, 'g'), '<br />');
          tableHtml += `<th class="border border-gray-300 px-4 py-3 text-left font-semibold">${escapedHeader}</th>`;
        });
        tableHtml += '</tr></thead>';
        
        // Table body
        tableHtml += '<tbody>';
        dataLines.forEach((line, idx) => {
          const cells = line.split('|').map(c => c.trim()).filter(c => c && !c.match(/^[-:|\s]+$/));
          // Only process if we have the right number of cells
          if (cells.length === headers.length) {
            tableHtml += `<tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100">`;
            cells.forEach(cell => {
              // Escape cell content first (but preserve BR placeholders)
              let cellContent = escapeHtml(cell);
              // Restore BR placeholders as actual <br /> tags
              cellContent = cellContent.replace(new RegExp(BR_PLACEHOLDER, 'g'), '<br />');
              // Then process inline markdown in cells (bold, italic, etc.)
              cellContent = cellContent.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
              cellContent = cellContent.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
              // Handle line breaks in cells (convert newlines to <br />)
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
export const Unsafety: React.FC = () => {
  const reportRef = useRef<HTMLDivElement | null>(null);
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

  // helper: trigger backend to build report.md and charts/*.html
const triggerGeneration = async () => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const r1 = await fetch(`${BACKEND_URL}/generate-report`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!r1.ok) throw new Error(`Report generation failed (${r1.status})`);

  // 🔥 ADD THIS LINE — prevents race condition
  await new Promise((res) => setTimeout(res, 1200));

  const r2 = await fetch(`${BACKEND_URL}/generate-charts`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!r2.ok) throw new Error(`Chart generation failed (${r2.status})`);
};


  // helper: pull AI report text
  const fetchReportText = async (): Promise<string> => {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const res = await fetch(`${BACKEND_URL}/report`, {
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
    console.log("🔍 Raw response preview (first 200 chars):", raw?.substring(0, 200) || "EMPTY");

    // If backend returned JSON (error) — parse and throw
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        const detail = parsed.detail || parsed.message || JSON.stringify(parsed);
        console.error("Report endpoint returned JSON error:", parsed);
        throw new Error(detail);
      } catch (e) {
        // not valid JSON - still treat as error if status not ok
        if (!res.ok) {
          console.error("Report endpoint returned non-json error:", raw);
          throw new Error(raw || `Fetch /report failed (${res.status})`);
        }
      }
    }

    if (!res.ok) {
      // some non-JSON error body
      console.error("Fetching /report failed", res.status, raw);
      throw new Error(raw || `Fetching /report failed (${res.status})`);
    }

    // ✅ ENFORCE: Always return a clean string
    // Remove any potential React elements or objects
    if (typeof raw !== "string") {
      console.error("❌ CRITICAL: fetchReportText received non-string:", typeof raw, raw);
      return "";
    }

    // Sanitize: ensure it's a plain string, no objects embedded
    const cleaned = String(raw).trim();
    console.log("✅ Cleaned report type:", typeof cleaned);
    console.log("✅ Cleaned report length:", cleaned.length);

    return cleaned;
  };

  // helper: pull list of charts
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
      // 1. upload file
      toast.info("Uploading file...", { id: "upload" });
      await uploadExcelFile(selectedFile);
      toast.success("File Uploaded!", { id: "upload" });

      // 2. tell backend to build report + charts
      toast.info("Generating AI report...", { id: "gen_report" });
      toast.info("Generating charts...", { id: "gen_charts" });
      await triggerGeneration();
      toast.success("AI Report Generated!", { id: "gen_report" });
      toast.success("Charts Generated!", { id: "gen_charts" });

      // 3. fetch results
      toast.info("Loading results...");
      const [reportText, chartsArr] = await Promise.all([
        fetchReportText(),
        fetchChartsList(),
      ]);

      // ✅ ENFORCE: aiReport must ALWAYS be a string
      console.log("🔍 reportText type before setAiReport:", typeof reportText);
      console.log("🔍 reportText value preview:", reportText?.substring?.(0, 100) || reportText);

      // Double-check and sanitize before setting state
      let safeReport: string;
      if (typeof reportText === "string") {
        safeReport = reportText.trim();
      } else {
        console.error("❌ CRITICAL: reportText is not a string! Type:", typeof reportText, "Value:", reportText);
        safeReport = "";
      }

      console.log("✅ Setting aiReport with type:", typeof safeReport, "length:", safeReport.length);
      // Use the safe setter to ensure type safety
      if (typeof safeReport === "string") {
        setAiReport(safeReport);
      } else {
        console.error("❌ Final check failed - safeReport is not string:", typeof safeReport);
        setAiReport("");
      }

      if (chartsArr && chartsArr.length > 0) {
        setChartList(chartsArr);

        // auto-load first chart into iframe
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

      toast.error("Generation Failed", {
        description:
          error?.message ||
          "Could not process the file. Please try again.",
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

  // Download PDF of the report tab
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

    pdf.save("Dattu_AI_Report.pdf");
  };

  //
  // ---------- RENDERING ----------
  //

  // 1. Upload screen
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
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                }}
              >
                <div className="p-4 rounded-full bg-gradient-to-br from-[#0B3D91]/20 to-[#00A79D]/20 border border-[#0B3D91]/30">
                  <Upload className="w-12 h-12 text-[#0B3D91]" />
                </div>
              </motion.div>
              <CardTitle className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#0B3D91] to-[#00A79D] bg-clip-text text-transparent">
                Upload Unsafe Acts Report
              </CardTitle>
              <p className="text-gray-600 text-lg">
                Upload the `sample.xlsx` file to generate your
                AI-powered dashboard.
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
                      <Upload className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="mb-2 text-base text-gray-700 font-semibold">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        Excel (.xlsx, .xls) files only
                      </p>
                    </>
                  )}
                </div>

                {/* Use native input so ref works */}
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

  // 2. Loading screen
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
            <Eye className="w-8 h-8 text-[#0B3D91]" />
            AI Vision Report
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Analysis of: {selectedFile?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadPDF} className="bg-[#0B3D91] hover:bg-[#082f70]">
            <FileText className="w-4 h-4 mr-2" />
            Download Report (PDF)
          </Button>
          <Button onClick={() => setShowDashboard(false)} variant="outline">
            Upload New File
          </Button>
        </div>
      </motion.div>

      {/* PDF capture region */}
      <div ref={reportRef} className="bg-white p-2 sm:p-4 rounded-md">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Gemini AI Analysis</CardTitle>
                  <CardDescription>
                    This is the full report generated by the AI based on your uploaded data.
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
                    // ✅ SAFE RENDERER: Validate before rendering
                    // Enforce string type one more time before rendering
                    const safeContent: string = typeof aiReport === "string" ? aiReport : String(aiReport || "");

                    // Log only if there's an issue (to reduce console noise)
                    if (typeof aiReport !== "string") {
                      console.error("❌ RENDER CHECK - aiReport is NOT a string! Type:", typeof aiReport, "Value:", aiReport);
                    }

                    if (typeof safeContent === "string" && safeContent.length > 0) {
                      // Use the SafeMarkdown component which has error boundaries and fallbacks
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

          {/* Charts tab */}
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
        </Tabs>
      </div>
    </div>
  );
};
