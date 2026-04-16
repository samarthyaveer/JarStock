import React, { useEffect, useMemo, useRef } from "react";
import {
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type LineData,
} from "lightweight-charts";

import type { ComparePoint } from "../../types/api";

const toBusinessDay = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
};

type CompareChartProps = {
  data: ComparePoint[];
  symbol1: string;
  symbol2: string;
};

const CompareChart = ({ data, symbol1, symbol2 }: CompareChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesOneRef = useRef<ISeriesApi<"Line"> | null>(null);
  const seriesTwoRef = useRef<ISeriesApi<"Line"> | null>(null);

  const resolveCssVar = (name: string, fallback: string) => {
    if (typeof window === "undefined") {
      return fallback;
    }
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return value || fallback;
  };

  const seriesOne = useMemo<LineData[]>(() => {
    return data.map((point) => ({
      time: toBusinessDay(point.date),
      value: point.symbol1,
    }));
  }, [data]);

  const seriesTwo = useMemo<LineData[]>(() => {
    return data.map((point) => ({
      time: toBusinessDay(point.date),
      value: point.symbol2,
    }));
  }, [data]);

  useEffect(() => {
    if (!containerRef.current || chartRef.current) {
      return;
    }

    const textMuted = resolveCssVar("--text-muted", "#8A8A8A");
    const border = resolveCssVar("--border", "#2C2C2C");
    const accent = resolveCssVar("--accent-green", "#00D09C");
    const accentAlt = resolveCssVar("--accent-yellow", "#F2C94C");

    const chart = createChart(containerRef.current, {
      height: containerRef.current.clientHeight || 200,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: textMuted,
      },
      grid: {
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      rightPriceScale: {
        borderColor: border,
      },
      timeScale: {
        borderColor: border,
      },
    });

    const seriesOneLine = chart.addLineSeries({
      color: accent,
      lineWidth: 2,
    });
    const seriesTwoLine = chart.addLineSeries({
      color: accentAlt,
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesOneRef.current = seriesOneLine;
    seriesTwoRef.current = seriesTwoLine;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        chart.applyOptions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesOneRef.current = null;
      seriesTwoRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (seriesOneRef.current) {
      seriesOneRef.current.setData(seriesOne);
    }
    if (seriesTwoRef.current) {
      seriesTwoRef.current.setData(seriesTwo);
    }
  }, [seriesOne, seriesTwo]);

  return (
    <div className="rounded-panel border border-border bg-bg-card p-3 md:p-4">
      <div className="flex items-center justify-between">
        <div className="text-label text-text-muted">Compare</div>
        <div className="flex gap-3 text-label">
          <span style={{ color: "var(--accent-green)" }}>{symbol1}</span>
          <span style={{ color: "var(--accent-yellow)" }}>{symbol2}</span>
        </div>
      </div>
      <div className="mt-3 h-[180px] sm:h-[220px] md:h-[240px]" ref={containerRef} />
    </div>
  );
};

export default CompareChart;
