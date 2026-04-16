import React from "react";

import { formatPercent, getArrow, getPnlColor } from "../../utils/format";

type ChangeCellProps = {
  value?: number | null;
  minWidth?: number;
};

const ChangeCell = ({ value, minWidth = 88 }: ChangeCellProps) => {
  const numericValue = value ?? null;
  const color =
    numericValue === null ? "var(--text-muted)" : getPnlColor(numericValue);
  const arrow = numericValue === null ? "" : getArrow(numericValue);

  return (
    <span
      className="tabular-nums font-mono inline-block text-right"
      style={{ minWidth, color }}
    >
      {numericValue === null ? "-" : `${arrow} ${formatPercent(numericValue)}`}
    </span>
  );
};

export default ChangeCell;
