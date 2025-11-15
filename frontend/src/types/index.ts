// This is the complete and final types file.
// It includes all interfaces for all 9 modules plus the dashboard.

import type { ReactNode, ReactElement } from "react";

// --- For AuthContext & Settings ---
export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user" | "CEO" | "CFO" | "CHRO" | "COO" | "SafetyManager";
  company_name?: string;
  subscription_tier: string;
  status: string; 
}

export interface ApiUsage {
  daily_limit: number;
  monthly_limit: number;
  api_calls_today: number;
  api_calls_month: number;
}

// --- For Dashboard.tsx ---
export interface KpiData {
  title: string;
  value: string;
  comparison: string;
  isPositive: boolean;
}

export interface AiInsight {
  id: string;
  icon: React.ElementType;
  text: string;
  linkText: string;
  linkHref: string;
}

export interface TopRisk {
  id: string;
  priority: "High" | "Medium" | "Low";
  description: string;
  owner: string;
}

export interface UnsafeActData {
  name: string;
  value: number;
  fill: string;
  [key: string]: any; // For recharts
}

export interface OpenActionData {
  name: "High" | "Medium" | "Low";
  value: number;
  [key: string]: any; // For recharts
}

export interface CO2Data {
  name: string;
  CO2: number;
  [key: string]: any; // For recharts
}

// --- For Incidents.tsx (Module 1) ---
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

// --- For PTW.tsx (Module 2) ---
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
  hazards: string;
  controls: string[];
  requestedBy: string;
  approvedBy: string;
  issueDate: Date;
  closeDate?: Date;
  status: PtwStatus;
  [key: string]: any;
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

// --- For Training.tsx (Module 3) ---
export interface TrainingRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  course: string;
  date: Date;
  trainer: string;
  preTest: number;
  postTest: number;
  certificateExpiry?: Date;
  status: "Completed" | "Expired" | "Pending";
  [key: string]: any;
}

export interface TrainingKpi {
  title: string;
  value: string;
  formula: string;
  progress?: number;
}

export interface TrainingEffectivenessData {
  name: string;
  effectiveness: number;
  [key: string]: any;
}

export interface TrainingCompletionData {
  name: string;
  completed: number;
  [key: string]: any;
}

// --- For Audits.tsx (Module 4) ---
export type AuditStatus = "Pass" | "Fail (NCR)" | "In Progress";
export type RiskCategory = "High" | "Medium" | "Low";

export interface AuditRecord {
  id: string;
  area: string;
  checklist: string;
  status: AuditStatus;
  riskCategory: RiskCategory | null;
  actionOwner: string | null;
  auditDate: Date;
  ncrId: string | null;
  [key: string]: any;
}

export interface AuditKpi {
  title: string;
  value: string;
  formula: string;
  progress?: number;
  invertProgressColor?: boolean; 
}

export interface ComplianceByAreaData {
  area: string;
  compliance: number;
  fullMark: 100;
  [key: string]: any;
}

export interface NcrSummaryData {
  name: RiskCategory;
  count: number;
  fill: string;
  [key: string]: any;
}

// --- For Medical.tsx (Module 5) ---
export type InjuryType = "Cut" | "Burn" | "Sprain" | "Fall" | "Chemical" | "Other";

export interface MedicalCase {
  id: string;
  date: Date;
  department: string;
  injuryType: InjuryType;
  firstAidGiven: string;
  hospitalization: boolean;
  daysLost: number;
  [key: string]: any;
}

export interface MedicalKpi {
  title: string;
  value: string;
  formula: string;
  trend?: string;
  isPositive?: boolean;
}

export interface InjurySummaryData {
  name: string;
  "First Aid": number;
  LTI: number;
  [key: string]: any;
}

export interface ResponseTimeData {
  name: string;
  "Avg. Time (min)": number;
  [key: string]: any;
}

export interface DrillComplianceData {
  name: string;
  compliance: number;
  [key: string]: any;
}

// --- For PPE.tsx (Module 6) ---
export type PpeStatus = "In Stock" | "Low Stock" | "Out of Stock" | "Expired";

export interface PpeItem {
  id: string;
  name: string;
  supplier: string;
  totalPurchased: number;
  totalIssued: number;
  balance: number;
  expiryDate: Date;
  status: PpeStatus;
  [key: string]: any;
}

export interface PpeKpi {
  title: string;
  value: string;
  formula: string;
  progress?: number;
  invertProgressColor?: boolean;
}

export interface PpeUsageData {
  month: string;
  Purchased: number;
  Issued: number;
  [key: string]: any;
}

export interface PpeStockData {
  name: string;
  value: number;
  fill: string;
  [key: string]: any;
}

export interface ReorderItem {
  id: string;
  name: string;
  supplier: string;
  currentStock: number;
  predictedStockOut: string;
  suggestedQuantity: number;
}

// --- For RCA.tsx (Module 7) ---
export type RcaStatus = "Open" | "In Progress" | "Closed" | "Overdue";

export interface RcaAction {
  id: string;
  relatedIncident: string;
  rootCause: string;
  assignedTo: string;
  dueDate: Date;
  status: RcaStatus;
  [key: string]: any;
}

export interface RcaKpi {
  title: string;
  value: string;
  formula: string;
  progress?: number;
  invertProgressColor?: boolean;
}

export interface RcaStatusData {
  name: string;
  value: number;
  fill: string;
  [key: string]: any;
}

export interface RcaSlaData {
  name: "On Time" | "Overdue";
  value: number;
  fill: string;
  [key: string]: any;
}

// --- For Environmental.tsx (Module 8) ---
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
  unitsProduced: number;
  [key: string]: any;
}

export interface EnvironmentalKpi {
  title: string;
  value: string;
  formula: string;
  progress?: number;
  invertProgressColor?: boolean;
}

export interface ResourceTrendData {
  month: string;
  "Energy (kWh)": number;
  "Water (m³)": number;
  [key:string]: any;
}

export interface WasteSummaryData {
  name: "Recycled" | "Landfill";
  value: number;
  fill: string;
  [key: string]: any;
}

// --- For Governance.tsx (Module 9) ---
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
  avgSupplierScore: number;
  [key: string]: any;
}

export interface GovernanceKpi {
  title: string;
  value: string;
  formula: string;
  progress?: number;
  invertProgressColor?: boolean;
}

export interface DiversityData {
  name: "Male" | "Female" | "Other";
  value: number;
  fill: string;
  [key: string]: any;
}

export interface EsgScorecardData {
  metric: "Social" | "Governance" | "Environment" | "Safety" | "Suppliers";
  score: number;
  fullMark: 100;
  [key: string]: any;
}

export interface AttritionRiskData {
  name: string;
  riskPercent: number;
  [key: string]: any;
}