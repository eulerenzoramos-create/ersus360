// EmptyState — estado vazio padronizado ERSUS 360 v3
import { LucideIcon, Database } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  title?: string;
  message?: string;
  Icon?: LucideIcon;
  action?: ReactNode;
  compact?: boolean;
}

export default function EmptyState({
  title = "Sem dados disponíveis",
  message = "Nenhum registro encontrado para os filtros selecionados.",
  Icon = Database,
  action,
  compact,
}: Props) {
  const size = compact ? 48 : 68;
  const iconSize = compact ? 22 : 30;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      padding: compact ? "32px 24px" : "72px 24px",
      gap: compact ? 10 : 14,
      textAlign: "center" as const,
      fontFamily: "var(--e-font, Inter, system-ui, sans-serif)",
    }}>
      <div style={{
        width: size, height: size,
        borderRadius: compact ? 14 : 18,
        background: "rgba(29,111,232,.08)",
        border: "1px solid #1e3a5f",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={iconSize} color="#1e3a5f" strokeWidth={1.5}/>
      </div>

      <div>
        <div style={{
          fontSize: compact ? 13 : 15,
          fontWeight: 700,
          color: "#64748b",
          marginBottom: 5,
          fontFamily: "var(--e-font-display, Syne, system-ui, sans-serif)",
        }}>
          {title}
        </div>
        <div style={{
          fontSize: compact ? 11 : 12.5,
          color: "#334155",
          maxWidth: 340,
          lineHeight: 1.6,
          margin: "0 auto",
        }}>
          {message}
        </div>
      </div>

      {action && (
        <div style={{ marginTop: 4 }}>{action}</div>
      )}
    </div>
  );
}
