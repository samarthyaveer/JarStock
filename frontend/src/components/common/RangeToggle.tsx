import React from "react";

type RangeToggleProps = {
  range: string;
  onChange: (value: string) => void;
};

const ranges = [
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "1Y", value: "1y" },
  { label: "MAX", value: "max" },
];

const RangeToggle = ({ range, onChange }: RangeToggleProps) => (
  <div className="flex gap-2">
    {ranges.map((frame) => (
      <button
        key={frame.value}
        type="button"
        aria-label={`Range ${frame.label}`}
        onClick={() => onChange(frame.value)}
        className={
          frame.value === range
            ? "pill pill-active rounded-chip px-2 py-1 text-label"
            : "pill rounded-chip px-2 py-1 text-label text-text-muted"
        }
      >
        {frame.label}
      </button>
    ))}
  </div>
);

export default RangeToggle;
