
export type Language = 'it' | 'en' | 'es' | 'fr' | 'de';

export interface KPI {
  label: string;
  value: string | number;
  unit?: string;
  trend: 'up' | 'down' | 'neutral';
  color: 'green' | 'red' | 'blue' | 'yellow';
  insight: string;
}

export interface ChartPoint {
  period: string;
  [key: string]: number | string;
}

export interface RadarPoint {
  subject: string;
  A: number; // The score (0-100)
  fullMark: number;
}

export interface SWOT {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface AnalysisSection {
  title: string;
  content: string; // Long text
  keyTakeaways?: string[];
}

export interface FinancialAnalysis {
  companyName: string; // New: Explicit company name
  reportDate: string;
  methodology?: string;
  executiveSummary: string;
  financialHealthScore: number;
  
  // Visual Data
  healthRadar: RadarPoint[]; // New: For Radar Chart
  kpis: KPI[];
  historicalData: ChartPoint[];
  
  // Deep Analysis
  swotAnalysis: SWOT;
  profitabilityAnalysis: AnalysisSection;
  liquidityAnalysis: AnalysisSection;
  growthAnalysis: AnalysisSection; // New
  
  strategicInsights: string[];
  recommendations: string[];
}

export type AnalysisStatus = 'idle' | 'parsing' | 'analyzing' | 'complete' | 'error';
