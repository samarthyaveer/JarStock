import React from "react";

type ToggleButtonProps = {
  active: boolean;
  onClick: () => void;
  label: string;
};

const ToggleButton = ({ active, onClick, label }: ToggleButtonProps) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className={
      active
        ? "rounded-chip border border-border bg-bg-surface px-2 py-1 text-label text-text-primary"
        : "rounded-chip border border-border px-2 py-1 text-label text-text-muted"
    }
  >
    {label}
  </button>
);

export default ToggleButton;
