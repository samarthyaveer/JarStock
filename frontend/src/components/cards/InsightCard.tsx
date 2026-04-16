import React from "react";

import type { InsightResponse } from "../../types/api";

type InsightCardProps = {
  insight?: InsightResponse | null;
  isLoading?: boolean;
};

const getToneClass = (insight: InsightResponse) => {
  const risk = insight.risk.toLowerCase();

  if (risk.includes("high")) {
    return "text-bad";
  }

  if (risk.includes("low")) {
    return "text-good";
  }

  if (risk.includes("moderate")) {
    return "text-okay";
  }

  return "text-okay";
};

const InsightCard = ({ insight, isLoading }: InsightCardProps) => (
  <div className="panel-card rounded-panel p-3 md:p-4">
    <div className="text-label text-text-muted">Insight</div>
    {isLoading ? (
      <div className="mt-4 space-y-2">
        <div className="skeleton h-4 w-32 rounded-chip" />
        <div className="skeleton h-4 w-48 rounded-chip" />
      </div>
    ) : insight ? (
      <div className="mt-3 space-y-2 text-body">
        <div
          className={`font-display text-sub md:text-heading ${getToneClass(
            insight,
          )}`}
        >
          {insight.label}
        </div>
        <div className="text-text-muted">{insight.summary}</div>
        <div className="text-label text-text-muted tabular-nums font-mono">
          {insight.risk} | Confidence {Math.round(insight.confidence * 100)}%
        </div>
      </div>
    ) : (
      <div className="mt-3 text-body text-text-muted">
        No insight available.
      </div>
    )}
  </div>
);

export default InsightCard;
