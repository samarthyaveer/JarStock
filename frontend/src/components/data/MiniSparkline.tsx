import React from "react";

type MiniSparklineProps = {
  values: number[];
  width?: number;
  height?: number;
};

const MiniSparkline = ({
  values,
  width = 80,
  height = 32,
}: MiniSparklineProps) => {
  if (values.length < 2) {
    return <div style={{ width, height }} />;
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} aria-hidden="true">
      <polyline
        fill="none"
        stroke="var(--accent-green)"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
};

export default MiniSparkline;
