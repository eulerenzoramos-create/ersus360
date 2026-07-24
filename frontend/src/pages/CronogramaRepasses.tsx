// src/pages/CronogramaRepasses.tsx — Cronograma de Repasses FNS · Fundo a Fundo
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, DollarSign, CheckCircle, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { apiGet } from "../lib/api";

interface Repasse {
  id: string; competencia: string; bloco: string; programa: string;
  valor_previsto: number; valor_creditado: number | null;
  data_prevista: string; data_credito: string | null;
  status: "creditado" | "previsto" | "atrasado" | "parcial";
  portaria: string; observacao: string;
}

interface ResumoRepasses {
  total_previsto: number; total_creditado: number; total_aguardando: number;
  creditados: number; previstos: number; atrasados: number;
  proximo_repasse: string; proximo_valor: number; proximo_bloco: string;
}

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const COR_STATUS: Record<string, string> = {
  creditado: "#16a34a", previsto: "#1351b4", atrasado: "#dc2626", parcial: "#d97706",
};
const LABEL_STATUS: Record<string, string> = {
  creditado: "Creditado", previsto: "Previsto", atrasado: "Atrasado", parcial: "Parcial",
};

function BadgeStatus({ s }: { s: string }) {
  const cor = COR_STATUS[s] ?? "#6b7280";
  return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 10, background: cor + "18", color: cor }}>
      {LABEL_STATUS[s] ?? s}
    </span>
  );
}

// ── Barra de execução ─────────────────────────────────────────────────────────

function BarraExec({ previsto, creditado }: { previsto: number; creditado: number | null }) {
  const pct = creditado ? Math.min(100, (creditado / previsto) * 100) : 0;
  const cor = pct >= 100 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";
  return (
    <div style={{ height: 4, background: "#e5e7eb", borderRadius: 2 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: cor, borderRadius: 2 }}/>
    </div>
  );
}

// ── Card Repasse ──────────────────────────────────────────────────────────────

function CardRepasse({ r }: { r: Repasse }) {
  const cor = COR_STATUS[r.status];
  const icon = r.status === "creditado" ? <CheckCircle size={16} color="#16a34a"/> :
               r.status === "atrasado"  ? <AlertTriangle size={16} color="#dc2626"/> :
               <Clock size={16} color={r.status === "parcial" ? "#d97706" : "#1351b4"}/>;

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}20`, borderLeft: `4px solid ${cor}`, borderRadius: 10, padding: "14px 16px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ marginTop: 1 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>{r.bloco}</span>
            <BadgeStatus s={r.status}/>
            <span style={{ fontSize: 9, color: "#9ca3af" }}>{r.competencia}</span>
            <span style={{ fontSize: 9, color: "#9ca3af" }}>·</span>
            <span style={{ fontSize: 9, color: "#6b7280" }}>{r.portaria}</span>
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>{r.programa}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 8 }}>
            {[
              { l: "Valor Previsto",  v: BRL(r.valor_previsto) },
              { l: "Creditado",       v: r.valor_creditado ? BRL(r.valor_creditado) : "—" },
              { l: "Data Prevista",   v: r.data_prevista },
              { l: "Data Crédito",    v: r.data_credito ?? "—" },
            ].map(k => (
              <div key={k.l}>
                <div style={{ fontSize: 9, color: "#9ca3af" }}>{k.l}</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{k.v}</div>
              </div>
            ))}
          </div>
          <BarraExec previsto={r.valor_previsto} creditado={r.valor_creditado}/>
          {r.observacao && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 5 }}>ℹ {r.observacao}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function CronogramaRepasses() {
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroBloco, setFiltroBloco] = useState("todos");

  const { data: resumo } = useQuery<ResumoRepasses>({
    queryKey: ["repasses-resumo"],
    queryFn: () => apiGet("/api/cronograma-repasses/resumo") as Promise<ResumoRepasses>,
    staleTime: 300_000,
  });

  const { data: repasses = [], isLoading } = useQuery<Repasse[]>({
    queryKey: ["repasses-lista"],
    queryFn: () => apiGet("/api/cronograma-repasses/lista") as Promise<Repasse[]>,
    staleTime: 300_000,
  });

  const blocos = ["todos", ...Array.from(new Set(repasses.map(r => r.bloco)))];
  const visiveis = repasses.filter(r => {
    const okStatus = filtroStatus === "todos" || r.status === filtroStatus;
    const okBloco  = filtroBloco  === "todos" || r.bloco  === filtroBloco;
    return okStatus && okBloco;
  });

  const r = resumo;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#065f46 0%,#059669 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><Calendar size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Cronograma de Repasses FNS</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Transferências Fundo a Fundo · FNS → FMS Apuí/AM · Competência 2026 · Blocos de Financiamento
            </div>
          </div>
        </div>

        {r && (
          <>
            {/* Próximo repasse em destaque */}
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 10, padding: "12px 16px", marginTop: 14, display: "flex", alignItems: "center", gap: 16, border: "1px solid rgba(255,255,255,.2)" }}>
              <div style={{ background: "#fbbf24", borderRadius: 8, padding: 8 }}><DollarSign size={16} color="#fff"/></div>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>Próximo repasse previsto</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{r.proximo_bloco}</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" as const }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fbbf24" }}>{BRL(r.proximo_valor)}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>{r.proximo_repasse}</div>
              </div>
            </div>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginTop: 12 }}>
              {[
                { l: "Total Previsto",   v: BRL(r.total_previsto),   cor: "#bbf7d0" },
                { l: "Total Creditado",  v: BRL(r.total_creditado),  cor: "#86efac" },
                { l: "Aguardando",       v: BRL(r.total_aguardando), cor: "#fde68a" },
                { l: "Creditados",       v: r.creditados,            cor: "#86efac" },
                { l: "Previstos",        v: r.previstos,             cor: "#bfdbfe" },
                { l: "Atrasados",        v: r.atrasados,             cor: "#fca5a5" },
              ].map(k => (
                <div key={k.l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 12px", textAlign: "center" as const }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: k.cor }}>{k.v}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)" }}>{k.l}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        {/* Filtros */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" as const, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Status:</span>
          {["todos","creditado","previsto","atrasado","parcial"].map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: `1px solid ${filtroStatus===s?(COR_STATUS[s]??"#059669"):"#d1d5db"}`, background: filtroStatus===s?((COR_STATUS[s]??"#059669")+"15"):"#fff", color: filtroStatus===s?(COR_STATUS[s]??"#059669"):"#374151", cursor: "pointer", fontWeight: filtroStatus===s?700:400 }}>
              {s === "todos" ? "Todos" : LABEL_STATUS[s]}
            </button>
          ))}
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginLeft: 8 }}>Bloco:</span>
          {blocos.map(b => (
            <button key={b} onClick={() => setFiltroBloco(b)}
              style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: `1px solid ${filtroBloco===b?"#059669":"#d1d5db"}`, background: filtroBloco===b?"#dcfce7":"#fff", color: filtroBloco===b?"#059669":"#374151", cursor: "pointer", fontWeight: filtroBloco===b?700:400 }}>
              {b === "todos" ? "Todos" : b}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af" }}>{visiveis.length} repasse(s)</span>
        </div>

        {isLoading
          ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando cronograma...</div>
          : visiveis.map(r => <CardRepasse key={r.id} r={r}/>)
        }
      </div>
    </div>
  );
}
