import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    spacing: {
      0: "0px",
      1: "4px",
      2: "8px",
      3: "12px",
      4: "16px",
      6: "24px",
      8: "32px",
      12: "48px",
    },
    extend: {
      colors: {
        "bg-primary": "var(--bg-primary)",
        "bg-surface": "var(--bg-surface)",
        "bg-card": "var(--bg-card)",
        "accent-green": "var(--accent-green)",
        "accent-yellow": "var(--accent-yellow)",
        "accent-red": "var(--accent-red)",
        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",
        border: "var(--border)",
      },
      borderRadius: {
        chip: "6px",
        card: "8px",
        panel: "12px",
      },
      fontSize: {
        label: ["11px", { lineHeight: "1.4" }],
        body: ["13px", { lineHeight: "1.6" }],
        sub: ["15px", { lineHeight: "1.6" }],
        heading: ["18px", { lineHeight: "1.4" }],
        hero: ["24px", { lineHeight: "1.2" }],
      },
    },
  },
  plugins: [],
};

export default config;
