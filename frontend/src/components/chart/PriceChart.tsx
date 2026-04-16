import React, { useEffect, useMemo, useRef } from "react";
import {
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  LineStyle,
  type LineData,
} from "lightweight-charts";

import type { PricePoint } from "../../types/api";


const toBusinessDay = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
};

type PriceChartProps = {
  data: PricePoint[];
  showPrediction?: boolean;
};

const PriceChart = ({ data, showPrediction = false }: PriceChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const predictionRef = useRef<ISeriesApi<"Line"> | null>(null);

  const resolveCssVar = (name: string, fallback: string) => {
    if (typeof window === "undefined") {
      return fallback;
    }
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return value || fallback;
  };

  const seriesData = useMemo<LineData[]>(() => {
    if (!data.length) {
      return [];
    }
    return data.map((point) => ({
      time: toBusinessDay(point.date),
      value: point.close,
    }));
  }, [data]);

  const predictionData = useMemo<LineData[]>(() => {
    if (!showPrediction || data.length < 10) {
      return [];
    }
    return buildPrediction(data);
  }, [data, showPrediction]);

  useEffect(() => {
    if (!containerRef.current || chartRef.current) {
      return;
    }

    const textMuted = resolveCssVar("--text-muted", "#8A8A8A");
    const border = resolveCssVar("--border", "#2C2C2C");
    const accent = resolveCssVar("--accent-green", "#00D09C");
    const accentAlt = resolveCssVar("--accent-yellow", "#F2C94C");

    const chart = createChart(containerRef.current, {
      height: containerRef.current.clientHeight || 240,
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

    const lineSeries = chart.addLineSeries({
      color: accent,
      lineWidth: 2,
    });

    const predictionSeries = chart.addLineSeries({
      color: accentAlt,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
    });

    chartRef.current = chart;
    seriesRef.current = lineSeries;
    predictionRef.current = predictionSeries;

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
      seriesRef.current = null;
      predictionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (seriesRef.current) {
      seriesRef.current.setData(seriesData);
    }
    if (predictionRef.current) {
      predictionRef.current.setData(predictionData);
    }
  }, [seriesData, predictionData]);

  return (
    <div className="panel-card rounded-panel p-3 md:p-4">
      <div className="flex items-center justify-between">
        <div className="text-label text-text-muted">Price</div>
      </div>
      <div className="mt-3 h-[220px] sm:h-[260px] md:h-[320px]" ref={containerRef} />
    </div>
  );
};

const buildPrediction = (data: PricePoint[]): LineData[] => {
  const slice = data.slice(-30);
  const n = slice.length;
  const xs = slice.map((_, index) => index);
  const ys = slice.map((point) => point.close);

  const xMean = xs.reduce((sum, x) => sum + x, 0) / n;
  const yMean = ys.reduce((sum, y) => sum + y, 0) / n;
  const numerator = xs.reduce((sum, x, i) => sum + (x - xMean) * (ys[i] - yMean), 0);
  const denominator = xs.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0) || 1;
  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;

  const lastDate = slice[slice.length - 1]?.date;
  if (!lastDate) {
    return [];
  }

  const predictions: LineData[] = [];
  const last = new Date(`${lastDate}T00:00:00Z`);

  for (let i = 1; i <= 10; i += 1) {
    const futureDate = new Date(last);
    futureDate.setDate(last.getDate() + i);
    const value = slope * (n - 1 + i) + intercept;
    predictions.push({
      time: {
        year: futureDate.getUTCFullYear(),
        month: futureDate.getUTCMonth() + 1,
        day: futureDate.getUTCDate(),
      },
      value,
    });
  }

  return predictions;
};

export default PriceChart;
