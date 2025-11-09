// src/types/index.ts

/**
 * Represents a single Key Performance Indicator.
 */
export interface KpiData {
  title: string;
  value: string;
  comparison: string;
  isPositive: boolean; // true for green (good), false for red (bad)
}

/**
 * Represents a single AI-driven insight.
 */
export interface AiInsight {
  id: string;
  icon: React.ElementType; // e.g., Lucide icon component
  text: string;
  linkText: string;
  linkHref: string;
}

/**
 * Represents a top identified risk.
 */
export interface TopRisk {
  id: string;
  priority: "High" | "Medium" | "Low";
  description: string;
  owner: string;
}

/**
 * Data for the Safety Snapshot donut chart (Unsafe Act Types).
 */
export interface UnsafeActData {
  name: string;
  value: number;
  fill: string;
  [key: string]: any;
}

/**
 * Data for the Safety Snapshot bar chart (Open Actions by Priority).
 */
export interface OpenActionData {
  name: "High" | "Medium" | "Low";
  value: number;
  [key: string]: any;
}

// Add this to src/types/index.ts
export interface CO2Data {
  name: string;
  CO2: number;
  [key: string]: any;
}
// Add these new types to src/types/index.ts

export interface Incident {
  id: string;
  date: Date;
  department: string;
  type: "LTI" | "Near Miss" | "First Aid" | "Property Damage";
  severity: "High" | "Medium" | "Low";
  description: string;
  cause?: string;
  correctiveAction?: string;
  daysLost?: number;
  status: "Open" | "Closed" | "In Progress";
  [key: string]: any; // For recharts
}

export interface IncidentKpi {
  title: string;
  value: string;
  formula: string;
}

// For the analytics charts
export interface IncidentSummaryData {
  name: string;
  LTI: number;
  "Near Miss": number;
  "First Aid": number;
  [key: string]: any;
}

export interface InjuryTypeData {
  name: string;
  value: number;
  fill: string;
  [key: string]: any;
}
// Add these new types to src/types/index.ts

export type PtwStatus = "Open" | "Closed" | "Overdue";
export type PtwWorkType = 
  | "Hot Work" 
  | "Confined Space" 
  | "Working at Height" 
  | "Electrical" 
  | "Excavation" 
  | "Other";

export interface Ptw {
  id: string;
  department: string;
  workType: PtwWorkType;
  hazards: string; // Storing as a comma-separated string for simplicity
  controls: string[]; // Storing as an array of checked control IDs
  requestedBy: string;
  approvedBy: string;
  issueDate: Date;
  closeDate?: Date;
  status: PtwStatus;
  [key: string]: any; // For recharts
}

export interface PtwKpi {
  title: string;
  value: string;
  formula: string;
}

export interface PtwTypeData {
  name: string;
  value: number;
  fill: string;
  [key: string]: any;
}

export interface PtwComplianceData {
  name: string;
  compliance: number;
  [key: string]: any;
}
// Add these new types to src/types/index.ts

export interface TrainingRecord {
  id: string;
  employeeId: string;
  employeeName: string; // Added for clarity in the table/AI panel
  course: string;
  date: Date;
  trainer: string;
  preTest: number; // Stored as percentage (0-100)
  postTest: number; // Stored as percentage (0-100)
  certificateExpiry?: Date;
  status: "Completed" | "Expired" | "Pending";
  [key: string]: any; // For recharts
}

export interface TrainingKpi {
  title: string;
  value: string;
  formula: string;
  progress?: number; // Optional progress value for progress bar
}

export interface TrainingEffectivenessData {
  name: string; // Department name
  effectiveness: number; // Avg (Post - Pre)
  [key: string]: any;
}

export interface TrainingCompletionData {
  name: string; // Course name
  completed: number;
  [key: string]: any;
}
// Add these new types to src/types/index.ts

export type AuditStatus = "Pass" | "Fail (NCR)" | "In Progress";
export type RiskCategory = "High" | "Medium" | "Low";

export interface AuditRecord {
  id: string;
  area: string;
  checklist: string; // e.g., "Monthly Fire Safety", "5S Audit"
  status: AuditStatus;
  riskCategory: RiskCategory | null; // Null if 'Pass' or 'In Progress'
  actionOwner: string | null; // Null if 'Pass' or 'In Progress'
  auditDate: Date;
  ncrId: string | null; // Non-Compliance Report ID
  [key: string]: any; // For recharts
}

export interface AuditKpi {
  title: string;
  value: string;
  formula: string;
  progress?: number;
  // For inverting progress bar color (e.g., lower is better)
  invertProgressColor?: boolean; 
}

export interface ComplianceByAreaData {
  area: string;
  compliance: number; // 0-100
  fullMark: 100;
  [key: string]: any;
}

export interface NcrSummaryData {
  name: RiskCategory; // "High", "Medium", "Low"
  count: number;
  fill: string;
  [key: string]: any;
}

// Add these new types to src/types/index.ts

export type InjuryType = "Cut" | "Burn" | "Sprain" | "Fall" | "Chemical" | "Other";

export interface MedicalCase {
  id: string; // Case ID
  date: Date;
  department: string;
  injuryType: InjuryType;
  firstAidGiven: string; // Text description
  hospitalization: boolean; // Yes/No
  daysLost: number;
  [key: string]: any; // For recharts
}

export interface MedicalKpi {
  title: string;
  value: string;
  formula: string;
  trend?: string; // e.g., "vs last month"
  isPositive?: boolean; // For trend color
}

// First-aid vs LTI summary
export interface InjurySummaryData {
  name: string; // Department
  "First Aid": number;
  LTI: number;
  [key: string]: any;
}

// Response time analytics
export interface ResponseTimeData {
  name: string; // Month
  "Avg. Time (min)": number;
  [key: string]: any;
}

// Drill compliance report
export interface DrillComplianceData {
  name: string; // e.g., "Fire Drill", "Spill Drill"
  compliance: number;
  [key: string]: any;
}
// Add these new types to src/types/index.ts

export type PpeStatus = "In Stock" | "Low Stock" | "Out of Stock" | "Expired";

export interface PpeItem {
  id: string; // PPE ID
  name: string; // Item Name
  supplier: string;
  totalPurchased: number;
  totalIssued: number;
  balance: number; // totalPurchased - totalIssued
  expiryDate: Date;
  status: PpeStatus;
  [key: string]: any; // For recharts
}

export interface PpeKpi {
  title: string;
  value: string;
  formula: string;
  progress?: number;
  invertProgressColor?: boolean;
}

// For Usage vs. Purchase chart
export interface PpeUsageData {
  month: string;
  Purchased: number;
  Issued: number;
  [key: string]: any;
}

// For Stock Summary by Type chart
export interface PpeStockData {
  name: string; // PPE Type
  value: number; // Balance
  fill: string;
  [key: string]: any;
}

// For AI modal (reorder list)
export interface ReorderItem {
  id: string;
  name: string;
  supplier: string;
  currentStock: number;
  predictedStockOut: string; // e.g., "In 5 days"
  suggestedQuantity: number;
}
// Add these new types to src/types/index.ts

export type RcaStatus = "Open" | "In Progress" | "Closed" | "Overdue";

export interface RcaAction {
  id: string; // Action ID
  relatedIncident: string; // e.g., "INC-1023" or "A-102"
  rootCause: string;
  assignedTo: string; // Action Owner
  dueDate: Date;
  status: RcaStatus;
  [key: string]: any; // For recharts
}

export interface RcaKpi {
  title: string;
  value: string;
  formula: string;
  progress?: number;
  invertProgressColor?: boolean;
}

// For Open vs Closed chart
export interface RcaStatusData {
  name: string;
  value: number;
  fill: string;
  [key: string]: any;
}

// For SLA tracking chart
export interface RcaSlaData {
  name: "On Time" | "Overdue";
  value: number;
  fill: string;
  [key: string]: any;
}
// Add these new types to src/types/index.ts

export interface EnvironmentalRecord {
  id: string;
  plant: string;
  month: Date;
  energyKwh: number;
  waterM3: number;
  wasteTotalT: number;
  wasteRecycledT: number;
  co2T: number;
  renewablePercent: number;
  unitsProduced: number; // Essential for intensity KPIs
  [key: string]: any; // For recharts
}

export interface EnvironmentalKpi {
  title: string;
  value: string;
  formula: string;
  progress?: number;
  invertProgressColor?: boolean;
}

// For Energy/Water Trend
export interface ResourceTrendData {
  month: string;
  "Energy (kWh)": number;
  "Water (m³)": number;
  [key:string]: any;
}

// For Waste Summary
export interface WasteSummaryData {
  name: "Recycled" | "Landfill";
  value: number; // in Tons
  fill: string;
  [key: string]: any;
}
// Add these new types to src/types/index.ts

export type PolicyStatus = "Reviewed" | "Pending" | "Overdue";

export interface GovernanceRecord {
  id: string;
  department: string;
  month: Date;
  turnoverPercent: number;
  trainingHours: number;
  absenteeismPercent: number;
  maleCount: number;
  femaleCount: number;
  policyReviewStatus: PolicyStatus;
  avgSupplierScore: number; // 0-100
  [key: string]: any; // For recharts
}

export interface GovernanceKpi {
  title: string;
  value: string;
  formula: string;
  progress?: number;
  invertProgressColor?: boolean;
}

// For Diversity Chart
export interface DiversityData {
  name: "Male" | "Female" | "Other";
  value: number;
  fill: string;
  [key: string]: any;
}

// For ESG Scorecard
export interface EsgScorecardData {
  metric: "Social" | "Governance" | "Environment" | "Safety" | "Suppliers";
  score: number;
  fullMark: 100;
  [key: string]: any;
}

// For Attrition Risk
export interface AttritionRiskData {
  name: string; // Department
  riskPercent: number;
  [key: string]: any;
}