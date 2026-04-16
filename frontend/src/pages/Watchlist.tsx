import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import { useWatchlistStore } from "../store/watchlistStore";

const Watchlist = () => {
  const navigate = useNavigate();
  const symbols = useWatchlistStore((state) => state.symbols);
  const toggleSymbol = useWatchlistStore((state) => state.toggleSymbol);

  const companiesQuery = useQuery({
    queryKey: ["companies"],
    queryFn: api.getCompanies,
  });

  const watchlistCompanies = (companiesQuery.data || []).filter((company) =>
    symbols.includes(company.symbol),
  );

  return (
    <div className="rounded-panel border border-border bg-bg-card p-3 md:p-4">
      <div className="text-label text-text-muted">Watchlist</div>
      <div className="mt-3 space-y-2">
        {watchlistCompanies.length === 0 && (
          <div className="text-body text-text-muted">No symbols added.</div>
        )}
        {watchlistCompanies.map((company) => (
          <div
            key={company.symbol}
            className="flex items-center justify-between rounded-card border border-border px-3 py-2"
          >
            <button
              type="button"
              aria-label={`Open ${company.symbol}`}
              onClick={() => navigate(`/stocks/${company.symbol}`)}
              className="truncate text-left text-body"
            >
              {company.symbol} {company.name}
            </button>
            <button
              type="button"
              aria-label={`Remove ${company.symbol}`}
              onClick={() => toggleSymbol(company.symbol)}
              className="text-label text-text-muted"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Watchlist;
