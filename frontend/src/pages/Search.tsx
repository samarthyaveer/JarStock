import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { api } from "../api/client";

const Search = () => {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const companiesQuery = useQuery({
    queryKey: ["companies"],
    queryFn: api.getCompanies,
  });

  const filtered = useMemo(() => {
    const list = companiesQuery.data || [];
    const value = term.trim().toLowerCase();
    if (!value) {
      return list;
    }
    return list.filter(
      (company) =>
        company.symbol.toLowerCase().includes(value) ||
        company.name.toLowerCase().includes(value),
    );
  }, [companiesQuery.data, term]);

  return (
    <div className="panel-card rounded-panel p-3 md:p-4">
      <div className="text-label text-text-muted">Search</div>
      <input
        aria-label="Search stocks"
        className="input-field mt-3 w-full rounded-card px-3 py-2 text-body text-text-primary focus:outline-none"
        placeholder="Type a symbol or name"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />
      <div className="mt-4 space-y-2">
        {filtered.map((company) => (
          <button
            key={company.symbol}
            type="button"
            aria-label={`Open ${company.symbol}`}
            onClick={() => navigate(`/stocks/${company.symbol}`)}
            className="list-item flex w-full items-center justify-between rounded-card px-3 py-2 text-body"
          >
            <div className="min-w-0 text-left">
              <div className="truncate font-display">
                {company.symbol}
              </div>
              <div className="truncate text-label text-text-muted">
                {company.name}
              </div>
            </div>
            <span className="text-label font-mono text-text-muted">
              {company.sector || "-"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Search;
