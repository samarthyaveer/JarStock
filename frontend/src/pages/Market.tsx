import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import StockRow from "../components/data/StockRow";
import SkeletonRow from "../components/data/SkeletonRow";
import type { PriceSeriesResponse } from "../types/api";

const Market = () => {
  const navigate = useNavigate();
  const companiesQuery = useQuery({
    queryKey: ["companies"],
    queryFn: api.getCompanies,
  });

  const priceQueries = useQuery({
    queryKey: [
      "market-prices",
      companiesQuery.data?.map((company) => company.symbol),
    ],
    queryFn: async () => {
      if (!companiesQuery.data) {
        return [] as PriceSeriesResponse[];
      }
      return Promise.all(
        companiesQuery.data.map((company) =>
          api.getPriceSeries(company.symbol, "30d"),
        ),
      );
    },
    enabled: Boolean(companiesQuery.data),
  });

  const priceMap = new Map(
    (priceQueries.data || []).map((series) => [series.symbol, series.prices]),
  );

  return (
    <div className="rounded-panel border border-border bg-bg-card p-3 md:p-4">
      <div className="text-label text-text-muted">Market</div>
      <div className="mt-3 overflow-hidden">
        <table className="w-full table-fixed text-body">
          <colgroup>
            <col style={{ width: "40%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <thead className="text-label text-text-muted">
            <tr>
              <th className="px-3 py-2 text-left">Company</th>
              <th className="px-3 py-2 text-right">Price</th>
              <th className="px-3 py-2 text-right">Change</th>
              <th className="px-3 py-2 text-left">Trend</th>
            </tr>
          </thead>
          <tbody>
            {companiesQuery.isLoading && (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            )}
            {companiesQuery.data?.map((company) => (
              <StockRow
                key={company.symbol}
                company={company}
                prices={priceMap.get(company.symbol)}
                onSelect={(symbol) => navigate(`/stocks/${symbol}`)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Market;
