// DataCard — card de métrica padronizado ERSUS 360 v3
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
  danger?: boolean;
  warning?: boolean;
  success?: boolean;
}

const TREND_CFG: Record<Trend, { color: string; Icon: LucideIcon }> = {
  up:      { color: "#22c55e", Icon: TrendingUp },
  down:    { color: "#ef4444", Icon: TrendingDown },
  neutral: { color: "#64748b", Icon: Minus },
};

export default function DataCard({
  label, value, sub, Icon, iconColor = "#38bdf8",
  trend, trendLabel, footer, highlight, loading,
  danger, warning, success,
}: Props) {
  const trendCfg = trend ? TREND_CFG[trend] : null;

  const accentColor = danger ? "#ef4444" : warning ? "#f59e0b" : success ? "#22c55e" : highlight ? "#38bdf8" : null;
  const borderColor = accentColor ? `${accentColor}44` : "#1e3a5f";
  const bgGradient  = accentColor
    ? `linear-gradient(135deg, ${accentColor}10, ${accentColor}06)`
    : "rgba(15,32,49,0.65)";

  return (
    <div style={{
      background: bgGradient,
      border: `1px solid ${borderColor}`,
      borderRadius: 12,
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column" as const,
      gap: 8,
      minWidth: 160,
      position: "relative" as const,
      overflow: "hidden" as const,
      transition: "box-shadow .15s, transform .15s",
      fontFamily: "var(--e-font, Inter, system-ui, sans-serif)",
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,.35)";
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLDivElement).style.boxShadow = "";
      (e.currentTarget as HTMLDivElement).style.transform = "";
    }}>

      {/* Barra de destaque */}
      {accentColor && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`,
        }}/>
      )}

      {/* Label + Ícone */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 10.5, fontWeight: 700,
          color: accentColor ? accentColor + "cc" : "#4b7fa3",
          letterSpacing: "0.07em", textTransform: "uppercase" as const,
        }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: `${iconColor}16`, border: `1px solid ${iconColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon size={14} color={iconColor}/>
          </div>
        )}
      </div>

      {/* Valor */}
      {loading ? (
        <div style={{
          height: 28, width: "60%", borderRadius: 6,
          background: "#1e3a5f",
          animation: "e-pulse 1.5s ease-in-out infinite",
        }}/>
      ) : (
        <div style={{
          fontSize: 26, fontWeight: 800,
          color: accentColor || "#f1f5f9",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
          fontFamily: "var(--e-font-display, Syne, system-ui, sans-serif)",
          letterSpacing: "-0.02em",
        }}>
          {value}
        </div>
      )}

      {/* Sub + Trend */}
      {(sub || trendCfg) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          {sub && (
            <span style={{ fontSize: 11, color: "#475569", lineHeight: 1.4 }}>{sub}</span>
          )}
          {trendCfg && trendLabel && (
            <span style={{
              display: "flex", alignItems: "center", gap: 3,
              fontSize: 11, fontWeight: 700, color: trendCfg.color,
              marginLeft: "auto", flexShrink: 0,
            }}>
              <trendCfg.Icon size={12}/>{trendLabel}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div style={{
          borderTop: "1px solid #1e3a5f44",
          paddingTop: 8, marginTop: 2,
        }}>
          {footer}
        </div>
      )}
    </div>
  );
}
