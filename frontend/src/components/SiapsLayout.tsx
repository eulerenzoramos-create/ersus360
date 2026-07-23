// Componente de layout padrão SIAPS / e-Gestor APS
// Replica o visual do portal relatorioaps.saude.gov.br para uso interno

import { ReactNode } from "react";

const BLUE = "#1351b4";

// ── Barra de contexto azul (UF / Município / IED / Competência) ──────────────
export function SiapsInfoBar({
  uf = "AM",
  municipio = "APUÍ",
  ied,
  competencia,
  preliminar = false,
  extra,
}: {
  uf?: string;
  municipio?: string;
  ied?: number | string;
  competencia?: string;
  preliminar?: boolean;
  extra?: ReactNode;
}) {
  return (
    <div style={{
      background: BLUE, color: "#fff",
      padding: "10px 24px", display: "flex", alignItems: "center",
      gap: 28, fontSize: 13, fontWeight: 600,
    }}>
      <span>UF: <strong>{uf}</strong></span>
      <span>Município: <strong>{municipio}</strong></span>
      {ied !== undefined && <span>IED: <strong>{ied}</strong></span>}
      {competencia && <span>Competência: <strong>{competencia}</strong></span>}
      {extra}
      {preliminar && (
        <span style={{ marginLeft: "auto", background: "#fff", color: BLUE, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4 }}>
          Dado preliminar
        </span>
      )}
    </div>
  );
}

// ── Abas horizontais estilo SIAPS ─────────────────────────────────────────────
export function SiapsTabs<T extends string>({
  abas,
  ativa,
  onChange,
}: {
  abas: { id: T; label: string }[];
  ativa: T;
  onChange: (id: T) => void;
}) {
  return (
    <div style={{ display: "flex", borderBottom: `2px solid #d4d4d4`, marginBottom: 24, gap: 0, overflowX: "auto" }}>
      {abas.map(a => (
        <button
          key={a.id}
          onClick={() => onChange(a.id)}
          style={{
            padding: "11px 20px",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: ativa === a.id ? 700 : 400,
            color: ativa === a.id ? BLUE : "#555",
            borderBottom: ativa === a.id ? `3px solid ${BLUE}` : "3px solid transparent",
            marginBottom: -2,
            whiteSpace: "nowrap",
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}

// ── Card KPI estilo SIAPS (número colorido grande + label) ───────────────────
export function SiapsKpi({
  label,
  value,
  sub,
  cor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  cor?: string;
}) {
  const c = cor ?? BLUE;
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #d4d4d4",
      borderRadius: 4,
      padding: "14px 18px",
      textAlign: "center",
      flex: 1,
      minWidth: 110,
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: c, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#555", marginTop: 4, lineHeight: 1.3 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Linha de classificação (Ótimo / Bom / Suficiente / Regular) ───────────────
export function SiapsClassificacao({
  otimo = 0,
  bom = 0,
  suficiente = 0,
  regular = 0,
}: {
  otimo?: number; bom?: number; suficiente?: number; regular?: number;
}) {
  const items = [
    { label: "Ótimo (>8.5)",    n: otimo,     bg: "#f0f9ff", cor: "#1351b4", border: "#bfdbfe" },
    { label: "Bom (7–8.5)",     n: bom,       bg: "#f0fdf4", cor: "#16a34a", border: "#bbf7d0" },
    { label: "Suficiente (5–6.9)", n: suficiente, bg: "#fffbeb", cor: "#d97706", border: "#fde68a" },
    { label: "Regular (<5)",    n: regular,   bg: "#fff1f2", cor: "#dc2626", border: "#fecdd3" },
  ];
  return (
    <div style={{ display: "flex", gap: 0, marginBottom: 20, border: "1px solid #d4d4d4", borderRadius: 4, overflow: "hidden" }}>
      {items.map(it => (
        <div key={it.label} style={{
          flex: 1, background: it.bg, padding: "12px 16px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderRight: "1px solid #d4d4d4",
        }}>
          <span style={{ fontSize: 12, color: "#555" }}>{it.label}</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: it.cor }}>{it.n}</span>
        </div>
      ))}
    </div>
  );
}

// ── Cabeçalho de seção (título azul + badges + botão download) ────────────────
export function SiapsSecaoHeader({
  titulo,
  competencia,
  tipo,
  preliminar = false,
  onDownload,
}: {
  titulo: string;
  competencia?: string;
  tipo?: string;
  preliminar?: boolean;
  onDownload?: () => void;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: BLUE, marginBottom: 6 }}>{titulo}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          {preliminar && (
            <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, border: "1px solid #fde68a" }}>
              Dado preliminar
            </span>
          )}
          {competencia && (
            <span style={{ background: "#f0f9ff", color: BLUE, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 3, border: "1px solid #bfdbfe" }}>
              Competência: {competencia}
            </span>
          )}
          {tipo && (
            <span style={{ background: "#f0f9ff", color: BLUE, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 3, border: "1px solid #bfdbfe" }}>
              Tipo: {tipo}
            </span>
          )}
        </div>
      </div>
      {onDownload && (
        <button onClick={onDownload} style={{
          background: BLUE, color: "#fff", border: "none", borderRadius: 4,
          padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          ↓ Baixar dados
        </button>
      )}
    </div>
  );
}

// ── Tabela padrão SIAPS (cabeçalho azul) ─────────────────────────────────────
export function SiapsTabela({
  colunas,
  linhas,
  busca,
  onBusca,
  total,
}: {
  colunas: string[];
  linhas: ReactNode[][];
  busca?: string;
  onBusca?: (v: string) => void;
  total?: number;
}) {
  return (
    <div>
      {onBusca !== undefined && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <input
            value={busca ?? ""}
            onChange={e => onBusca(e.target.value)}
            placeholder="Pesquisar UBS ou equipe..."
            style={{
              width: 340, padding: "8px 12px", border: "1px solid #d4d4d4",
              borderRadius: 4, fontSize: 13, outline: "none",
            }}
          />
          {total !== undefined && (
            <span style={{ fontSize: 12, color: "#888" }}>Quantidade de itens: {total}</span>
          )}
        </div>
      )}
      <div style={{ overflowX: "auto" as const }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {colunas.map((col, i) => (
                <th key={i} style={{
                  background: BLUE, color: "#fff", padding: "10px 12px",
                  textAlign: i === 0 ? "left" : "center", fontWeight: 700,
                  fontSize: 11, letterSpacing: 0.3,
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: "1px solid #e5e7eb", background: ri % 2 === 0 ? "#fff" : "#f9fafb" }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: "10px 12px", textAlign: ci === 0 ? "left" : "center", verticalAlign: "middle" }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Layout completo de página ─────────────────────────────────────────────────
export function SiapsPage({
  titulo,
  competencia,
  tipo,
  uf = "AM",
  municipio = "APUÍ",
  ied,
  preliminar = false,
  children,
  onDownload,
}: {
  titulo: string;
  competencia?: string;
  tipo?: string;
  uf?: string;
  municipio?: string;
  ied?: number | string;
  preliminar?: boolean;
  children: ReactNode;
  onDownload?: () => void;
}) {
  return (
    <div style={{ fontFamily: "Rawline, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <SiapsInfoBar uf={uf} municipio={municipio} ied={ied} competencia={competencia} preliminar={preliminar} />
      <div style={{ background: "#fff", minHeight: "calc(100vh - 40px)" }}>
        <div style={{ padding: "24px 28px" }}>
          <SiapsSecaoHeader titulo={titulo} competencia={competencia} tipo={tipo} preliminar={preliminar} onDownload={onDownload} />
          {children}
        </div>
      </div>
    </div>
  );
}
