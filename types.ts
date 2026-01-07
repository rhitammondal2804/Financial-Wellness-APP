export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: string;
  merchant?: string;
  isDiscretionary?: boolean; // Heuristic guess
}

export enum StressLevel {
  Stable = "Stable",
  Mild = "Mild",
  High = "High",
  Critical = "Critical"
}

export interface AIAnalysisResult {
  score: number;
  level: StressLevel;
  observations: string[];
  recentChanges: string;
  importance: string;
  recommendations: string[];
}

export interface ChartDataPoint {
  date: string;
  amount: number;
  type: 'Essential' | 'Discretionary';
}

export interface CategorySummary {
  name: string;
  value: number;
}
