import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import InsightCard from "../components/cards/InsightCard";
import SummaryCard from "../components/cards/SummaryCard";
import PriceChart from "../components/chart/PriceChart";
import RangeToggle from "../components/common/RangeToggle";
import ToggleButton from "../components/common/ToggleButton";
import PriceCell from "../components/data/PriceCell";
import ChangeCell from "../components/data/ChangeCell";
import { useUiStore } from "../store/uiStore";

const StockDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const setSelectedSymbol = useUiStore((state) => state.setSelectedSymbol);
  const [range, setRange] = useState("90d");
  const [showPrediction, setShowPrediction] = useState(false);

  useEffect(() => {
    if (symbol) {
      setSelectedSymbol(symbol.toUpperCase());
    }
  }, [symbol, setSelectedSymbol]);

  const priceQuery = useQuery({
    queryKey: ["prices", symbol, range],
    queryFn: () => api.getPriceSeries(symbol || "", range),
    enabled: Boolean(symbol),
  });

  const summaryQuery = useQuery({
    queryKey: ["summary", symbol],
    queryFn: () => api.getSummary(symbol || ""),
    enabled: Boolean(symbol),
  });

  const insightQuery = useQuery({
    queryKey: ["insight", symbol],
    queryFn: () => api.getInsight(symbol || ""),
    enabled: Boolean(symbol),
  });

  const priceList = priceQuery.data?.prices || [];
  const last = priceList[priceList.length - 1]?.close ?? null;
  const prev = priceList[priceList.length - 2]?.close ?? null;
  const change = last && prev ? (last - prev) / prev : null;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="rounded-panel border border-border bg-bg-card p-3 md:p-4">
        <div className="text-label text-text-muted">Latest</div>
        <div className="mt-2 flex items-center gap-6">
          <PriceCell value={last} className="text-heading md:text-hero" minWidth={120} />
          <ChangeCell value={change} minWidth={120} />
        </div>
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
    </div>
  );
};

export default StockDetail;
