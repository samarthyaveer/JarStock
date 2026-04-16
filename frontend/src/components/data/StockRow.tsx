import React from "react";

import type { Company, PricePoint } from "../../types/api";
import ChangeCell from "./ChangeCell";
import MiniSparkline from "./MiniSparkline";
import PriceCell from "./PriceCell";

const getChange = (prices: PricePoint[] | undefined) => {
  if (!prices || prices.length < 2) {
    return null;
  }
  const last = prices[prices.length - 1]?.close;
  const prev = prices[prices.length - 2]?.close;
  if (last === undefined || prev === undefined || prev === 0) {
    return null;
  }
  return (last - prev) / prev;
};

const getLast = (prices: PricePoint[] | undefined) => {
  if (!prices || prices.length === 0) {
    return null;
  }
  return prices[prices.length - 1]?.close ?? null;
};

type StockRowProps = {
  company: Company;
  prices?: PricePoint[];
  onSelect?: (symbol: string) => void;
  isActive?: boolean;
};

const StockRow = ({ company, prices, onSelect, isActive }: StockRowProps) => {
  const last = getLast(prices);
  const change = getChange(prices);
  const sparklineValues = prices
    ? prices.slice(-7).map((item) => item.close)
    : [];

  return (
    <tr
      className={
        isActive
          ? "bg-bg-card cursor-pointer"
          : "cursor-pointer transition-colors hover:bg-bg-surface"
      }
      onClick={() => onSelect?.(company.symbol)}
      tabIndex={0}
      role="button"
      aria-label={`Open ${company.symbol}`}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onSelect?.(company.symbol);
        }
      }}
    >
      <td className="px-3 py-2 md:py-3">
        <div className="text-body font-display text-text-primary">
          {company.symbol}
        </div>
        <div className="truncate text-label text-text-muted">
          {company.name}
        </div>
      </td>
      <td className="px-3 py-2 md:py-3 text-right">
        <PriceCell value={last} />
      </td>
      <td className="px-3 py-2 md:py-3 text-right">
        <ChangeCell value={change} />
      </td>
      <td className="px-3 py-2 md:py-3">
        <MiniSparkline values={sparklineValues} />
      </td>
    </tr>
  );
};

export default StockRow;
