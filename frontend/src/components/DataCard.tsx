// DataCard — card de métrica padronizado para dashboards do ERSUS 360
import { ReactNode } from "react";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

type Trend = "up" | "down" | "neutral";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  Icon?: LucideIcon;
  iconColor?: string;
  trend?: Trend;
  trendLabel?: string;
  footer?: ReactNode;
  highlight?: boolean;
  loading?: boolean;
}

const TREND_CONFIG: Record<Trend, { color: string; Icon: LucideIcon }> = {
  up:      { color: "#4ade80", Icon: TrendingUp },
  down:    { color: "#f87171", Icon: TrendingDown },
  neutral: { color: "#94a3b8", Icon: Minus },
};

export default function DataCard({
  label, value, sub, Icon, iconColor = "#38bdf8",
  trend, trendLabel, footer, highlight, loading,
}: Props) {
  const trendCfg = trend ? TREND_CONFIG[trend] : null;

  return (
    <div style={{
      background: highlight
        ? "linear-gradient(135deg,#1d4ed811,#0ea5e911)"
        : "rgba(15,32,49,0.6)",
      border: `1px solid ${highlight ? "#38bdf833" : "#1e3a5f"}`,
      borderRadius: 12,
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column" as const,
      gap: 8,
      minWidth: 160,
      position: "relative" as const,
      overflow: "hidden" as const,
    }}>
      {highlight && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: "linear-gradient(90deg,#38bdf8,#818cf8)",
        }}/>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: `${iconColor}18`, border: `1px solid ${iconColor}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={14} color={iconColor}/>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ height: 28, width: "60%", borderRadius: 6, background: "#1e3a5f", animation: "pulse 1.5s infinite" }}/>
      ) : (
        <div style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {value}
        </div>
      )}

      {(sub || trendCfg) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          {sub && <span style={{ fontSize: 11, color: "#475569" }}>{sub}</span>}
          {trendCfg && trendLabel && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: trendCfg.color }}>
              <trendCfg.Icon size={12}/>{trendLabel}
            </span>
          )}
        </div>
      )}

      {footer && (
        <div style={{ borderTop: "1px solid #1e3a5f", paddingTop: 8, marginTop: 2 }}>
          {footer}
        </div>
      )}
    </div>
  );
}
