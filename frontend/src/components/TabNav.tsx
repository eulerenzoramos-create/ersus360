// TabNav — navegação por abas padronizada para páginas com múltiplas seções
interface Tab {
  key: string;
  label: string;
  badge?: string | number;
}

interface Props {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  style?: React.CSSProperties;
}

export default function TabNav({ tabs, active, onChange, style }: Props) {
  return (
    <div style={{
      display: "flex",
      gap: 2,
      borderBottom: "1px solid #1e3a5f",
      padding: "0 24px",
      background: "#0a1520",
      overflowX: "auto" as const,
      scrollbarWidth: "none" as const,
      ...style,
    }}>
      {tabs.map(tab => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              padding: "11px 16px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#38bdf8" : "#64748b",
              borderBottom: `2px solid ${isActive ? "#38bdf8" : "transparent"}`,
              marginBottom: -1,
              whiteSpace: "nowrap" as const,
              transition: "color .15s, border-color .15s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
                background: isActive ? "#38bdf822" : "#1e3a5f",
                color: isActive ? "#38bdf8" : "#94a3b8",
                border: `1px solid ${isActive ? "#38bdf844" : "#1e3a5f"}`,
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
