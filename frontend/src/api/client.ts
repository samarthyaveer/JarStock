import type {
  Company,
  CompareResponse,
  HealthResponse,
  InsightResponse,
  MarketSnapshotResponse,
  MetricSeriesResponse,
  MoversResponse,
  PriceSeriesResponse,
  RefreshResponse,
  SummaryResponse,
} from "../types/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export const api = {
  health: (): Promise<HealthResponse> => request<HealthResponse>("/"),
  getCompanies: (): Promise<Company[]> => request<Company[]>("/companies"),
  getPriceSeries: (
    symbol: string,
    range?: string,
  ): Promise<PriceSeriesResponse> =>
    request<PriceSeriesResponse>(
      `/data/${encodeURIComponent(symbol)}${range ? `?range=${range}` : ""}`,
    ),
  getMetrics: (
    symbol: string,
    range?: string,
  ): Promise<MetricSeriesResponse> =>
    request<MetricSeriesResponse>(
      `/metrics/${encodeURIComponent(symbol)}${range ? `?range=${range}` : ""}`,
    ),
  getSummary: (symbol: string): Promise<SummaryResponse> =>
    request<SummaryResponse>(`/summary/${encodeURIComponent(symbol)}`),
  getInsight: (symbol: string): Promise<InsightResponse> =>
    request<InsightResponse>(`/insights/${encodeURIComponent(symbol)}`),
  compare: (
    symbol1: string,
    symbol2: string,
    range?: string,
  ): Promise<CompareResponse> =>
    request<CompareResponse>(
      `/compare?symbol1=${encodeURIComponent(symbol1)}&symbol2=${encodeURIComponent(
        symbol2,
      )}${range ? `&range=${range}` : ""}`,
    ),
  getTopGainers: (limit = 5): Promise<MoversResponse> =>
    request<MoversResponse>(`/market/top-gainers?limit=${limit}`),
  getTopLosers: (limit = 5): Promise<MoversResponse> =>
    request<MoversResponse>(`/market/top-losers?limit=${limit}`),
  getMarketSnapshot: (): Promise<MarketSnapshotResponse> =>
    request<MarketSnapshotResponse>("/market/snapshot"),
  refreshMarketSnapshot: (): Promise<RefreshResponse> =>
    request<RefreshResponse>("/refresh/market", { method: "POST" }),
  refreshSymbol: (symbol: string): Promise<RefreshResponse> =>
    request<RefreshResponse>(`/refresh/${encodeURIComponent(symbol)}`, {
      method: "POST",
    }),
};
