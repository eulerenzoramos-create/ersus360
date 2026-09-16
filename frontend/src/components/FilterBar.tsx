// FilterBar — barra de filtros padronizada ERSUS 360 v3
import { ReactNode } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

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
  const pad = compact ? "8px 20px" : "11px 24px";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: pad,
      background: "#081422",
      borderBottom: "1px solid #1e3a5f",
      flexWrap: "wrap" as const,
      fontFamily: "var(--e-font, Inter, system-ui, sans-serif)",
    }}>
      {/* Ícone */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        color: "#3d6b8f", fontSize: 11, fontWeight: 700,
        flexShrink: 0,
      }}>
        <SlidersHorizontal size={12}/> Filtros
      </div>

      <div style={{ width: 1, height: 16, background: "#1e3a5f", flexShrink: 0 }}/>

      {/* Filtros */}
      {filters.map(f => (
        <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 10.5, color: "#4b7fa3", whiteSpace: "nowrap" as const, fontWeight: 500 }}>
            {f.label}
          </label>
          <select
            value={f.value}
            onChange={e => f.onChange(e.target.value)}
            style={{
              background: "#0f2031",
              border: "1px solid #1e3a5f",
              borderRadius: 7,
              color: "#cbd5e1",
              fontSize: 12,
              padding: "4px 28px 4px 10px",
              cursor: "pointer",
              outline: "none",
              appearance: "none" as const,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%234b7fa3' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
              transition: "border-color .15s",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(59,130,246,.15)"; }}
            onBlur={e  => { e.currentTarget.style.borderColor = "#1e3a5f"; e.currentTarget.style.boxShadow = ""; }}
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
            display: "flex", alignItems: "center", gap: 4,
            background: "none",
            border: "1px solid #1e3a5f",
            borderRadius: 7,
            color: "#4b7fa3",
            fontSize: 11,
            padding: "4px 10px",
            cursor: "pointer",
            marginLeft: "auto",
            transition: "all .15s",
            fontFamily: "inherit",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a4a72"; (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e3a5f"; (e.currentTarget as HTMLButtonElement).style.color = "#4b7fa3"; }}
        >
          <RotateCcw size={10}/> Limpar
        </button>
      )}
    </div>
  );
}
