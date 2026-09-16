// PageHeader — cabeçalho padronizado ERSUS 360 v3
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface Badge {
  label: string;
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "cyan";
}

interface Props {
  title: string;
  subtitle?: string;
  Icon?: LucideIcon;
  iconColor?: string;
  badges?: Badge[];
  actions?: ReactNode;
  breadcrumb?: string;
}

const BADGE: Record<string, { bg: string; color: string; border: string }> = {
  blue:   { bg:"#1e40af18", color:"#60a5fa", border:"#1e40af44" },
  green:  { bg:"#16532218", color:"#4ade80", border:"#16532244" },
  yellow: { bg:"#78350f18", color:"#fbbf24", border:"#78350f44" },
  red:    { bg:"#7f1d1d18", color:"#f87171", border:"#7f1d1d44" },
  purple: { bg:"#4c1d9518", color:"#c084fc", border:"#4c1d9544" },
  cyan:   { bg:"#0e749018", color:"#67e8f9", border:"#0e749044" },
};

export default function PageHeader({
  title, subtitle, Icon, iconColor = "#38bdf8",
  badges = [], actions, breadcrumb,
}: Props) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #0a1828 0%, #0d2040 100%)",
      borderBottom: "1px solid #1e3a5f",
      padding: "20px 28px 18px",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16,
      fontFamily: "var(--e-font, Inter, system-ui, sans-serif)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        {Icon && (
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: `${iconColor}14`,
            border: `1px solid ${iconColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 0 16px ${iconColor}18`,
          }}>
            <Icon size={22} color={iconColor}/>
          </div>
        )}

        <div style={{ minWidth: 0 }}>
          {breadcrumb && (
            <div style={{
              fontSize: 9.5, color: "#3d6b8f", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 3,
            }}>
              {breadcrumb}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
            <h1 style={{
              fontSize: 20, fontWeight: 800, color: "#e2e8f0", margin: 0, lineHeight: 1.2,
              fontFamily: "var(--e-font-display, Syne, system-ui, sans-serif)",
              letterSpacing: "-0.03em",
            }}>
              {title}
            </h1>

            {badges.map((b, i) => {
              const s = BADGE[b.color ?? "blue"] ?? BADGE.blue;
              return (
                <span key={i} style={{
                  fontSize: 9.5, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                  letterSpacing: "0.05em", textTransform: "uppercase" as const,
                  background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                  flexShrink: 0,
                }}>
                  {b.label}
                </span>
              );
            })}
          </div>

          {subtitle && (
            <p style={{ fontSize: 12, color: "#4b7fa3", margin: "4px 0 0", lineHeight: 1.5 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" as const }}>
          {actions}
        </div>
      )}
    </div>
  );
}
