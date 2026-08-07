// FilterBar — barra de filtros padronizada para dashboards do ERSUS 360
import { ReactNode } from "react";
import { Filter } from "lucide-react";

interface SelectFilter {
  type: "select";
  key: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  filters: SelectFilter[];
  children?: ReactNode;
  onReset?: () => void;
  compact?: boolean;
}

export default function FilterBar({ filters, children, onReset, compact }: FilterBarProps) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: compact ? "10px 20px" : "12px 24px",
      background: "#0a1520",
      borderBottom: "1px solid #1e3a5f",
      flexWrap: "wrap" as const,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#4b7fa3", fontSize: 12, fontWeight: 600 }}>
        <Filter size={13}/> Filtros
      </div>

      {filters.map(f => (
        <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" as const }}>
            {f.label}
          </label>
          <select
            value={f.value}
            onChange={e => f.onChange(e.target.value)}
            style={{
              background: "#0f2031",
              border: "1px solid #1e3a5f",
              borderRadius: 6,
              color: "#cbd5e1",
              fontSize: 12,
              padding: "4px 10px 4px 8px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {f.options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      ))}

      {children}

      {onReset && (
        <button
          onClick={onReset}
          style={{
            background: "none",
            border: "1px solid #1e3a5f",
            borderRadius: 6,
            color: "#64748b",
            fontSize: 11,
            padding: "4px 10px",
            cursor: "pointer",
            marginLeft: "auto",
          }}
        >
          Limpar
        </button>
      )}
    </div>
  );
}
