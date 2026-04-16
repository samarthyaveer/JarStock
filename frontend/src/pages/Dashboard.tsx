import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import InsightCard from "../components/cards/InsightCard";
import MoversCard from "../components/cards/MoversCard";
import StatCard from "../components/cards/StatCard";
import SummaryCard from "../components/cards/SummaryCard";
import CompareChart from "../components/chart/CompareChart";
import PriceChart from "../components/chart/PriceChart";
import RangeToggle from "../components/common/RangeToggle";
import ToggleButton from "../components/common/ToggleButton";
import { useUiStore } from "../store/uiStore";
import { useWatchlistStore } from "../store/watchlistStore";
import { formatNumber } from "../utils/format";
import type { Company } from "../types/api";

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [range, setRange] = useState("90d");
  const [showPrediction, setShowPrediction] = useState(false);
  const [compareSymbol, setCompareSymbol] = useState<string | null>(null);
  const selectedSymbol = useUiStore((state) => state.selectedSymbol);
  const setSelectedSymbol = useUiStore((state) => state.setSelectedSymbol);
  const toggleWatch = useWatchlistStore((state) => state.toggleSymbol);
  const isWatching = useWatchlistStore((state) => state.isWatching);

  const companiesQuery = useQuery({
    queryKey: ["companies"],
    queryFn: api.getCompanies,
  });

  useEffect(() => {
    if (!selectedSymbol && companiesQuery.data?.length) {
      setSelectedSymbol(companiesQuery.data[0].symbol);
    }
  }, [companiesQuery.data, selectedSymbol, setSelectedSymbol]);

  useEffect(() => {
    if (!compareSymbol && selectedSymbol && companiesQuery.data?.length) {
      const fallback = companiesQuery.data.find(
        (company) => company.symbol !== selectedSymbol,
      );
      if (fallback) {
        setCompareSymbol(fallback.symbol);
      }
    }
  }, [compareSymbol, selectedSymbol, companiesQuery.data]);

  useEffect(() => {
    if (selectedSymbol && compareSymbol === selectedSymbol && companiesQuery.data?.length) {
      const fallback = companiesQuery.data.find(
        (company) => company.symbol !== selectedSymbol,
      );
      if (fallback) {
        setCompareSymbol(fallback.symbol);
      }
    }
  }, [compareSymbol, selectedSymbol, companiesQuery.data]);

  const filteredCompanies = useMemo<Company[]>(() => {
    const list = companiesQuery.data || [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return list;
    }
    return list.filter(
      (company) =>
        company.symbol.toLowerCase().includes(term) ||
        company.name.toLowerCase().includes(term),
    );
  }, [companiesQuery.data, searchTerm]);

  const priceQuery = useQuery({
    queryKey: ["prices", selectedSymbol, range],
    queryFn: () => api.getPriceSeries(selectedSymbol || "", range),
    enabled: Boolean(selectedSymbol),
  });

  const summaryQuery = useQuery({
    queryKey: ["summary", selectedSymbol],
    queryFn: () => api.getSummary(selectedSymbol || ""),
    enabled: Boolean(selectedSymbol),
  });

  const insightQuery = useQuery({
    queryKey: ["insight", selectedSymbol],
    queryFn: () => api.getInsight(selectedSymbol || ""),
    enabled: Boolean(selectedSymbol),
  });

  const gainersQuery = useQuery({
    queryKey: ["top-gainers"],
    queryFn: () => api.getTopGainers(5),
  });

  const losersQuery = useQuery({
    queryKey: ["top-losers"],
    queryFn: () => api.getTopLosers(5),
  });

  const compareQuery = useQuery({
    queryKey: ["compare", selectedSymbol, compareSymbol, range],
    queryFn: () =>
      api.compare(selectedSymbol || "", compareSymbol || "", range),
    enabled: Boolean(
      selectedSymbol && compareSymbol && selectedSymbol !== compareSymbol,
    ),
  });

  const selectedCompany = useMemo(() => {
    return (
      companiesQuery.data?.find(
        (company) => company.symbol === selectedSymbol,
      ) || null
    );
  }, [companiesQuery.data, selectedSymbol]);

  const priceList = priceQuery.data?.prices || [];
  const latestClose = priceList[priceList.length - 1]?.close;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-12">
        <div className="xl:col-span-3 space-y-3 md:space-y-4">
          <div className="rounded-panel border border-border bg-bg-card p-3 md:p-4">
            <div className="text-label text-text-muted">Companies</div>
            <input
              aria-label="Search companies"
              className="mt-3 w-full rounded-card border border-border bg-bg-surface px-3 py-2 text-body text-text-primary"
              placeholder="Search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <div className="mt-3 space-y-2 max-h-[220px] sm:max-h-[320px] md:max-h-[420px] overflow-y-auto">
              {companiesQuery.isLoading && (
                <div className="text-body text-text-muted">
                  Loading companies
                </div>
              )}
              {filteredCompanies.map((company) => (
                <button
                  key={company.symbol}
                  type="button"
                  aria-label={`Select ${company.symbol}`}
                  onClick={() => setSelectedSymbol(company.symbol)}
                  className={
                    company.symbol === selectedSymbol
                      ? "flex w-full items-center justify-between rounded-card border border-border bg-bg-surface px-3 py-2"
                      : "flex w-full items-center justify-between rounded-card border border-border px-3 py-2 text-text-muted"
                  }
                >
                  <span className="truncate text-left">
                    {company.symbol} {company.name}
                  </span>
                  <span className="text-label">{company.sector || "-"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="hidden sm:block rounded-panel border border-border bg-bg-card p-3 md:p-4">
            <div className="text-label text-text-muted">Watchlist</div>
            <div className="mt-3 space-y-2">
              {selectedCompany ? (
                <button
                  type="button"
                  aria-label="Toggle watchlist"
                  onClick={() => toggleWatch(selectedCompany.symbol)}
                  className="w-full rounded-card border border-border px-3 py-2 text-body"
                >
                  {isWatching(selectedCompany.symbol) ? "Remove" : "Add"} {selectedCompany.symbol}
                </button>
              ) : (
                <div className="text-body text-text-muted">Select a symbol</div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-9 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Companies"
              value={`${companiesQuery.data?.length || 0}`}
            />
            <StatCard
              label="Latest Close"
              value={latestClose ? formatNumber(latestClose) : "-"}
              subtext={selectedSymbol || "Select symbol"}
            />
            <StatCard
              label="52w High"
              value={
                summaryQuery.data ? formatNumber(summaryQuery.data.high_52w) : "-"
              }
            />
            <StatCard
              label="52w Low"
              value={
                summaryQuery.data ? formatNumber(summaryQuery.data.low_52w) : "-"
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <RangeToggle range={range} onChange={setRange} />
            <ToggleButton
              active={showPrediction}
              onClick={() => setShowPrediction((prev) => !prev)}
              label="Prediction"
            />
          </div>

          <PriceChart
            data={priceQuery.data?.prices || []}
            showPrediction={showPrediction}
          />

          <div className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2">
            <SummaryCard
              summary={summaryQuery.data}
              isLoading={summaryQuery.isLoading}
            />
            <InsightCard
              insight={insightQuery.data}
              isLoading={insightQuery.isLoading}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2">
            <MoversCard
              title="Top Gainers"
              items={gainersQuery.data?.items}
              isLoading={gainersQuery.isLoading}
            />
            <MoversCard
              title="Top Losers"
              items={losersQuery.data?.items}
              isLoading={losersQuery.isLoading}
            />
          </div>

          <div className="rounded-panel border border-border bg-bg-card p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="text-label text-text-muted">Compare</div>
              <div className="flex gap-2">
                <select
                  aria-label="Compare symbol"
                  className="rounded-card border border-border bg-bg-surface px-2 py-1 text-label"
                  value={compareSymbol || ""}
                  onChange={(event) => setCompareSymbol(event.target.value)}
                >
                  {(companiesQuery.data || [])
                    .filter((company) => company.symbol !== selectedSymbol)
                    .map((company) => (
                      <option key={company.symbol} value={company.symbol}>
                        {company.symbol}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            {compareQuery.data ? (
              <div className="mt-4 space-y-3">
                <div className="text-label text-text-muted tabular-nums">
                  Correlation {formatNumber(compareQuery.data.correlation, 3)}
                </div>
                <CompareChart
                  data={compareQuery.data.series}
                  symbol1={compareQuery.data.symbol1}
                  symbol2={compareQuery.data.symbol2}
                />
              </div>
            ) : (
              <div className="mt-4 text-body text-text-muted">Select two symbols to compare.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
