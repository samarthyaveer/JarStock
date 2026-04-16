import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../api/client";
import StockRow from "../components/data/StockRow";
import SkeletonRow from "../components/data/SkeletonRow";
const Market = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const marketQuery = useQuery({
    queryKey: ["market-snapshot"],
    queryFn: api.getMarketSnapshot,
  });

  useQuery({
    queryKey: ["refresh", "market"],
    queryFn: () => api.refreshMarketSnapshot(),
    enabled: marketQuery.isFetched,
    refetchOnWindowFocus: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-snapshot"] });
    },
  });

  const marketItems = marketQuery.data?.items || [];
  const asOf = marketQuery.data?.as_of;

  return (
    <div className="panel-card rounded-panel p-3 md:p-4">
      <div className="flex items-center justify-between">
        <div className="text-label text-text-muted">Market</div>
        {asOf ? (
          <div className="text-label text-text-muted font-mono">
            As of {asOf}
          </div>
        ) : null}
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed text-body">
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
            {marketQuery.isLoading && (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            )}
            {marketItems.map((item) => (
              <StockRow
                key={item.symbol}
                company={{
                  symbol: item.symbol,
                  name: item.name,
                  sector: item.sector,
                }}
                prices={item.prices}
                onSelect={(symbol) => navigate(`/stocks/${symbol}`)}
              />
            ))}
          </tbody>
        </table>
      </div>
      {marketQuery.isError && (
        <div className="mt-3 text-body text-text-muted">
          Unable to load market data.
        </div>
      )}
    </div>
  );
};

export default Market;
