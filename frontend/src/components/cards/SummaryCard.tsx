import React from "react";

import type { SummaryResponse } from "../../types/api";
import { formatNumber } from "../../utils/format";

type SummaryCardProps = {
  summary?: SummaryResponse | null;
  isLoading?: boolean;
};

const SummaryCard = ({ summary, isLoading }: SummaryCardProps) => (
  <div className="rounded-panel border border-border bg-bg-card p-3 md:p-4">
    <div className="text-label text-text-muted">Summary</div>
    {isLoading ? (
      <div className="mt-4 space-y-2">
        <div className="skeleton h-4 w-32 rounded-chip" />
        <div className="skeleton h-4 w-28 rounded-chip" />
        <div className="skeleton h-4 w-36 rounded-chip" />
      </div>
    ) : summary ? (
      <div className="mt-3 space-y-2 text-body">
        <div className="flex items-center justify-between">
          <span className="text-text-muted">52w High</span>
          <span className="tabular-nums">{formatNumber(summary.high_52w)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted">52w Low</span>
          <span className="tabular-nums">{formatNumber(summary.low_52w)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Avg Close</span>
          <span className="tabular-nums">
            {formatNumber(summary.avg_close)}
          </span>
        </div>
      </div>
    ) : (
      <div className="mt-3 text-body text-text-muted">
        No summary available.
      </div>
    )}
  </div>
);

export default SummaryCard;
