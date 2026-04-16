import React, { useEffect, useRef } from "react";

import { formatNumber } from "../../utils/format";

type PriceCellProps = {
  value?: number | null;
  minWidth?: number;
  digits?: number;
  className?: string;
};

const PriceCell = ({
  value,
  minWidth = 88,
  digits = 2,
  className,
}: PriceCellProps) => {
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const prevRef = useRef<number | null>(null);

  useEffect(() => {
    const node = spanRef.current;
    if (!node) {
      return;
    }

    const formatted = formatNumber(value ?? null, digits);
    node.textContent = formatted;

    if (prevRef.current !== null && value !== null && value !== undefined) {
      const directionClass =
        value >= prevRef.current ? "flash-up" : "flash-down";
      node.classList.add(directionClass);
      window.setTimeout(() => {
        node.classList.remove(directionClass);
      }, 300);
    }

    prevRef.current = value ?? null;
  }, [value, digits]);

  return (
    <span
      ref={spanRef}
      className={`tabular-nums inline-block text-right ${className || ""}`}
      style={{ minWidth }}
    >
      -
    </span>
  );
};

export default PriceCell;
