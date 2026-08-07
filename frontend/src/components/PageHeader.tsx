// PageHeader — cabeçalho padronizado para todas as páginas do ERSUS 360
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface Badge {
  label: string;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
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

const BADGE_COLORS: Record<string, string> = {
  blue:   "background:#1e40af22;color:#60a5fa;border:1px solid #1e40af44",
  green:  "background:#16532222;color:#4ade80;border:1px solid #16532244",
  yellow: "background:#78350f22;color:#fbbf24;border:1px solid #78350f44",
  red:    "background:#7f1d1d22;color:#f87171;border:1px solid #7f1d1d44",
  purple: "background:#4c1d9522;color:#c084fc;border:1px solid #4c1d9544",
};

export default function PageHeader({ title, subtitle, Icon, iconColor = "#38bdf8", badges = [], actions, breadcrumb }: Props) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #0f2031 0%, #0a1520 100%)",
      borderBottom: "1px solid #1e3a5f",
      padding: "20px 28px 16px",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {Icon && (
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: `${iconColor}18`,
            border: `1px solid ${iconColor}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon size={22} color={iconColor}/>
          </div>
        )}
        <div>
          {breadcrumb && (
            <div style={{ fontSize: 10, color: "#4b7fa3", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
              {breadcrumb}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", margin: 0, lineHeight: 1.2 }}>
              {title}
            </h1>
            {badges.map((b, i) => (
              <span key={i} style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                letterSpacing: "0.05em", textTransform: "uppercase",
                ...(Object.fromEntries((BADGE_COLORS[b.color ?? "blue"] ?? BADGE_COLORS.blue)
                  .split(";").filter(Boolean).map(p => {
                    const [k, v] = p.split(":");
                    return [k.trim().replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase()), v.trim()];
                  }))),
              }}>
                {b.label}
              </span>
            ))}
          </div>
          {subtitle && (
            <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0", lineHeight: 1.4 }}>{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
