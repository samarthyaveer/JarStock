export interface HealthResponse {
  status: string;
  service: string;
}

export interface Company {
  symbol: string;
  name: string;
  sector?: string | null;
}

export interface PricePoint {
  date: string;
  close: number;
}

export interface PriceSeriesResponse {
  symbol: string;
  prices: PricePoint[];
}

export interface SummaryResponse {
  symbol: string;
  high_52w: number;
  low_52w: number;
  avg_close: number;
}

export interface InsightResponse {
  symbol: string;
  label: string;
  confidence: number;
  summary: string;
  risk: string;
}

export interface MetricPoint {
  date: string;
  daily_return: number | null;
  ma7: number | null;
  volatility: number | null;
  momentum: number | null;
}

export interface MetricSeriesResponse {
  symbol: string;
  metrics: MetricPoint[];
}

export interface ComparePoint {
  date: string;
  symbol1: number;
  symbol2: number;
}

export interface CompareResponse {
  symbol1: string;
  symbol2: string;
  correlation: number;
  series: ComparePoint[];
}

export interface MoverItem {
  symbol: string;
  name: string;
  close: number;
  daily_return: number;
}

export interface MoversResponse {
  as_of: string;
  items: MoverItem[];
}
