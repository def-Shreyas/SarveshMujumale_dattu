export interface Incident {
  case_id: string;
  title: string;
  year: number;
  country: string;
  industry: string;
  severity: "Low" | "Medium" | "High" | "Fatal";
  summary: string;
  lessons_learned: string[];
  source_url: string;
}

export interface SafetyQueryResponse {
  query: string;
  total_cases: number;
  //cases: IncidentCase[];
}
