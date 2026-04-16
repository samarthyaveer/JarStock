import React from "react";

type StatCardProps = {
  label: string;
  value: string;
  subtext?: string;
};

const StatCard = ({ label, value, subtext }: StatCardProps) => (
  <div className="panel-card rounded-panel p-3 md:p-4">
    <div className="text-label text-text-muted">{label}</div>
    <div className="mt-2 text-heading md:text-hero tabular-nums font-display">
      {value}
    </div>
    {subtext ? (
      <div className="mt-1 text-label text-text-muted font-mono">
        {subtext}
      </div>
    ) : null}
  </div>
);

export default StatCard;
