import React from "react";

import type { MoverItem } from "../../types/api";
import { formatNumber, formatPercent, getArrow, getPnlColor } from "../../utils/format";

type MoversCardProps = {
  title: string;
  items?: MoverItem[];
  isLoading?: boolean;
};

const MoversCard = ({ title, items, isLoading }: MoversCardProps) => (
  <div className="panel-card rounded-panel p-3 md:p-4">
    <div className="text-label text-text-muted">{title}</div>
    {isLoading ? (
      <div className="mt-3 space-y-2">
        <div className="skeleton h-4 w-40 rounded-chip" />
        <div className="skeleton h-4 w-32 rounded-chip" />
        <div className="skeleton h-4 w-36 rounded-chip" />
      </div>
    ) : items && items.length ? (
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div
            key={item.symbol}
            className="flex items-center justify-between text-body"
          >
            <div className="min-w-0">
              <div className="truncate">{item.symbol} {item.name}</div>
              <div className="text-label text-text-muted tabular-nums font-mono">
                {formatNumber(item.close)}
              </div>
            </div>
            <div
              className="tabular-nums text-right font-mono"
              style={{ minWidth: 88, color: getPnlColor(item.daily_return) }}
            >
              {getArrow(item.daily_return)} {formatPercent(item.daily_return)}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="mt-3 text-body text-text-muted">No data available.</div>
    )}
  </div>
);

export default MoversCard;
