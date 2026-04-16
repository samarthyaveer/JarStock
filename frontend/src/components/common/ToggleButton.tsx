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
        ? "pill pill-active rounded-chip px-2 py-1 text-label"
        : "pill rounded-chip px-2 py-1 text-label text-text-muted"
    }
  >
    {label}
  </button>
);

export default ToggleButton;
