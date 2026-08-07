// EmptyState — estado vazio padronizado para seções sem dados
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
  return (
    <div style={{
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      padding: compact ? "32px 24px" : "64px 24px",
      gap: 12,
      color: "#475569",
      textAlign: "center" as const,
    }}>
      <div style={{
        width: compact ? 48 : 64, height: compact ? 48 : 64,
        borderRadius: compact ? 12 : 16,
        background: "#1e3a5f22",
        border: "1px solid #1e3a5f",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={compact ? 22 : 28} color="#38bdf855"/>
      </div>
      <div>
        <div style={{ fontSize: compact ? 13 : 15, fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: compact ? 11 : 12, color: "#475569", maxWidth: 320, lineHeight: 1.5 }}>
          {message}
        </div>
      </div>
      {action}
    </div>
  );
}
