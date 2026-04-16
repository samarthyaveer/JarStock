import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  const [showMovers, setShowMovers] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareSymbol, setCompareSymbol] = useState<string | null>(null);
  const selectedSymbol = useUiStore((state) => state.selectedSymbol);
  const setSelectedSymbol = useUiStore((state) => state.setSelectedSymbol);
  const toggleWatch = useWatchlistStore((state) => state.toggleSymbol);
  const isWatching = useWatchlistStore((state) => state.isWatching);
  const queryClient = useQueryClient();

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

  useQuery({
    queryKey: ["refresh", "symbol", selectedSymbol],
    queryFn: () => api.refreshSymbol(selectedSymbol || ""),
    enabled: Boolean(selectedSymbol),
    refetchOnWindowFocus: false,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["prices", selectedSymbol],
      });
      queryClient.invalidateQueries({
        queryKey: ["summary", selectedSymbol],
      });
      queryClient.invalidateQueries({
        queryKey: ["insight", selectedSymbol],
      });
      queryClient.invalidateQueries({
        queryKey: ["compare", selectedSymbol],
      });
      queryClient.invalidateQueries({ queryKey: ["market-snapshot"] });
    },
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
  const latestDate = priceList[priceList.length - 1]?.date;
  const asOf = gainersQuery.data?.as_of || losersQuery.data?.as_of || latestDate;
  const isWatched = selectedCompany
    ? isWatching(selectedCompany.symbol)
    : false;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-12">
        <div className="xl:col-span-3 space-y-3 md:space-y-4">
          <div className="panel-card rounded-panel p-3 md:p-4">
            <div className="text-label text-text-muted">Companies</div>
            <input
              aria-label="Search companies"
              className="input-field mt-3 w-full rounded-card px-3 py-2 text-body text-text-primary focus:outline-none"
              placeholder="Search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <div className="mt-3 space-y-2 max-h-[220px] sm:max-h-[320px] md:max-h-[420px] overflow-y-auto pr-1">
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
                      ? "list-item list-item-active flex w-full items-center justify-between rounded-card px-3 py-2 text-body"
                      : "list-item flex w-full items-center justify-between rounded-card px-3 py-2 text-body text-text-muted hover:text-text-primary"
                  }
                >
                  <div className="min-w-0 text-left">
                    <div className="truncate font-display">
                      {company.symbol}
                    </div>
                    <div className="truncate text-label text-text-muted">
                      {company.name}
                    </div>
                  </div>
                  <span
                    className={
                      company.symbol === selectedSymbol
                        ? "text-label font-mono text-text-primary"
                        : "text-label font-mono text-text-muted"
                    }
                  >
                    {company.sector || "-"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="hidden sm:block panel-card rounded-panel p-3 md:p-4">
            <div className="text-label text-text-muted">Watchlist</div>
            <div className="mt-3 space-y-2">
              {selectedCompany ? (
                <button
                  type="button"
                  aria-label="Toggle watchlist"
                  onClick={() => toggleWatch(selectedCompany.symbol)}
                  className={
                    isWatched
                      ? "pill pill-active w-full rounded-chip px-3 py-2 text-body"
                      : "pill w-full rounded-chip px-3 py-2 text-body text-text-primary"
                  }
                >
                  {isWatched ? "Watching" : "Add"} {selectedCompany.symbol}
                </button>
              ) : (
                <div className="text-body text-text-muted">Select a symbol</div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-9 space-y-4 md:space-y-6">
          <div className="panel-card rounded-panel p-4 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="text-label text-text-muted">Overview</div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-display text-hero">
                    {selectedSymbol || "Select symbol"}
                  </div>
                  {selectedCompany?.sector ? (
                    <span className="chip rounded-chip px-2 py-1 text-label text-text-muted">
                      {selectedCompany.sector}
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-body text-text-muted">
                  {selectedCompany?.name ||
                    "Pick a company to explore pricing and insight."}
                </div>
                {asOf ? (
                  <div className="text-label text-text-muted font-mono">
                    As of {asOf}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <RangeToggle range={range} onChange={setRange} />
                <ToggleButton
                  active={showPrediction}
                  onClick={() => setShowPrediction((prev) => !prev)}
                  label="Prediction"
                />
                {selectedCompany ? (
                  <button
                    type="button"
                    aria-label="Toggle watchlist"
                    onClick={() => toggleWatch(selectedCompany.symbol)}
                    className={
                      isWatched
                        ? "pill pill-active rounded-chip px-3 py-2 text-label"
                        : "pill rounded-chip px-3 py-2 text-label text-text-primary"
                    }
                  >
                    {isWatched ? "Watching" : "Add Watchlist"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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

          <div className="flex items-center justify-between md:hidden">
            <div className="text-label text-text-muted">Sections</div>
            <div className="flex gap-2">
              <ToggleButton
                active={showMovers}
                onClick={() => setShowMovers((prev) => !prev)}
                label="Movers"
              />
              <ToggleButton
                active={showCompare}
                onClick={() => setShowCompare((prev) => !prev)}
                label="Compare"
              />
            </div>
          </div>

          <div
            className={`${showMovers ? "grid" : "hidden"} grid-cols-1 gap-3 md:gap-4 md:grid lg:grid-cols-2`}
          >
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

          <div
            className={`${showCompare ? "block" : "hidden"} panel-card rounded-panel p-3 md:block md:p-4`}
          >
            <div className="flex items-center justify-between">
              <div className="text-label text-text-muted">Compare</div>
              <div className="flex gap-2">
                <select
                  aria-label="Compare symbol"
                  className="input-field rounded-card px-2 py-1 text-label"
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
                <div className="text-label text-text-muted tabular-nums font-mono">
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
