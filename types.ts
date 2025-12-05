
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

// --- DYNAMIC CHART TYPES ---
export interface DynamicChartData {
  title: string;
  type: 'bar' | 'line' | 'area' | 'composed';
  data: any[];
  xAxisKey: string;
  dataKeys: { key: string; color: string; name: string }[];
}

// --- NEW: CUSTOM REPORT SECTIONS ---
export interface CustomReportSection {
  id: string;
  title: string;
  content: string;
  chart?: DynamicChartData;
}

export interface ChatResponse {
  answer: string; // The text message back to the user
  updatedAnalysis?: Partial<FinancialAnalysis>; // THE DATA TO MERGE
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
// ----------------------

export interface FinancialAnalysis {
  companyName: string; 
  reportDate: string;
  methodology?: string;
  executiveSummary: string;
  financialHealthScore: number;
  
  // Visual Data
  healthRadar: RadarPoint[]; 
  kpis: KPI[];
  historicalData: ChartPoint[];
  
  // Deep Analysis
  swotAnalysis: SWOT;
  profitabilityAnalysis: AnalysisSection;
  liquidityAnalysis: AnalysisSection;
  growthAnalysis: AnalysisSection; 
  
  strategicInsights: string[];
  recommendations: string[];

  // NEW: Dynamic sections added by the user via Chat
  customSections?: CustomReportSection[];
}

export type AnalysisStatus = 'idle' | 'parsing' | 'analyzing' | 'complete' | 'error';
