// src/pages/DashboardExecutivo360.tsx — Dashboard Executivo · ERSUS 360 · Visão Unificada
import { useQuery } from "@tanstack/react-query";
import { Activity, DollarSign, Users, Syringe, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { apiGet } from "../lib/api";

interface KPIBloco {
  modulo: string; icone: string;
  indicadores: KPI[];
}

interface KPI {
  nome: string; valor: string; status: "ok" | "alerta" | "critico";
  tendencia: "alta" | "estavel" | "queda" | null;
  rota: string;
}

interface ResumoExecutivo {
  saude_score: number; financeiro_score: number;
  alertas_criticos: number; alertas_atencao: number;
  modulos_ok: number; modulos_total: number;
  ultima_atualizacao: string;
  blocos: KPIBloco[];
}

const COR: Record<string, string> = { ok: "#16a34a", alerta: "#d97706", critico: "#dc2626" };
const BG: Record<string, string>  = { ok: "#dcfce7", alerta: "#fef3c7", critico: "#fee2e2" };

function TendIcon({ t }: { t: string | null }) {
  if (t === "alta")   return <TrendingUp  size={11} color="#16a34a"/>;
  if (t === "queda")  return <TrendingDown size={11} color="#dc2626"/>;
  return <Minus size={11} color="#9ca3af"/>;
}

function ScoreRing({ score, label, cor }: { score: number; label: string; cor: string }) {
  const r = 42, circ = 2 * Math.PI * r;
  const dash = (score / 10) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 6 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke={cor + "25"} strokeWidth="8"/>
        <circle cx="50" cy="50" r={r} fill="none" stroke={cor} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4} strokeLinecap="round"/>
        <text x="50" y="46" textAnchor="middle" fontSize="20" fontWeight="900" fill={cor}>{score.toFixed(1)}</text>
        <text x="50" y="62" textAnchor="middle" fontSize="9" fill="#9ca3af">/10</text>
      </svg>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{label}</span>
    </div>
  );
}

function CardKPI({ kpi }: { kpi: KPI }) {
  const cor = COR[kpi.status];
  const bg  = BG[kpi.status];
  return (
    <a href={`#${kpi.rota}`} style={{ textDecoration: "none", display: "block" }}
       onClick={e => { e.preventDefault(); window.location.hash = kpi.rota; }}>
      <div style={{ background: bg, border: `1px solid ${cor}30`, borderRadius: 8, padding: "8px 10px", cursor: "pointer", transition: "opacity .15s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
          <span style={{ fontSize: 9, color: "#6b7280", lineHeight: 1.3, flex: 1 }}>{kpi.nome}</span>
          {kpi.tendencia && <TendIcon t={kpi.tendencia}/>}
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, color: cor }}>{kpi.valor}</div>
      </div>
    </a>
  );
}

function BlocoModulo({ bloco }: { bloco: KPIBloco }) {
  const criticos = bloco.indicadores.filter(k => k.status === "critico").length;
  const alertas  = bloco.indicadores.filter(k => k.status === "alerta").length;
  const titCor   = criticos > 0 ? "#dc2626" : alertas > 0 ? "#d97706" : "#16a34a";
  return (
    <div style={{ background: "#fff", border: `1px solid #e4e7ec`, borderTop: `3px solid ${titCor}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 16 }}>{bloco.icone}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#374151" }}>{bloco.modulo}</span>
        {criticos > 0 && <span style={{ fontSize: 9, background: "#fee2e2", color: "#dc2626", padding: "1px 6px", borderRadius: 8, fontWeight: 700 }}>{criticos} crítico(s)</span>}
        {alertas  > 0 && <span style={{ fontSize: 9, background: "#fef3c7", color: "#d97706", padding: "1px 6px", borderRadius: 8, fontWeight: 700 }}>{alertas} alerta(s)</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {bloco.indicadores.map((k, i) => <CardKPI key={i} kpi={k}/>)}
      </div>
    </div>
  );
}

export default function DashboardExecutivo360() {
  const { data: resumo, isLoading } = useQuery<ResumoExecutivo>({
    queryKey: ["exec360-resumo"],
    queryFn: () => apiGet("/api/dashboard-exec/resumo") as Promise<ResumoExecutivo>,
    staleTime: 120_000,
    refetchInterval: 120_000,
  });

  if (isLoading || !resumo) return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
      Carregando visão executiva...
    </div>
  );

  const r = resumo;
  const saude_cor  = r.saude_score >= 7 ? "#16a34a" : r.saude_score >= 5 ? "#d97706" : "#dc2626";
  const fin_cor    = r.financeiro_score >= 7 ? "#16a34a" : r.financeiro_score >= 5 ? "#d97706" : "#dc2626";

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#1e40af 100%)", padding: "20px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><Activity size={20} color="#fff"/></div>
              <span style={{ fontWeight: 900, fontSize: 22, color: "#fff", letterSpacing: -0.5 }}>ERSUS 360</span>
              <span style={{ fontSize: 10, fontWeight: 800, background: "rgba(255,255,255,.2)", color: "#bfdbfe", padding: "2px 10px", borderRadius: 10 }}>DASHBOARD EXECUTIVO</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>
              Visão unificada · {r.modulos_ok}/{r.modulos_total} módulos OK · Apuí/AM · Atualizado: {r.ultima_atualizacao}
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <ScoreRing score={r.saude_score}      label="Score Saúde"      cor={saude_cor}/>
            <ScoreRing score={r.financeiro_score} label="Score Financeiro" cor={fin_cor}/>
          </div>
        </div>

        {/* Barra de status */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 20 }}>
          {[
            { l: "Alertas Críticos",  v: r.alertas_criticos, cor: "#fca5a5", icon: <AlertTriangle size={14} color="#fca5a5"/> },
            { l: "Em Atenção",        v: r.alertas_atencao,  cor: "#fde68a", icon: <AlertTriangle size={14} color="#fde68a"/> },
            { l: "Módulos OK",        v: r.modulos_ok,       cor: "#86efac", icon: <CheckCircle   size={14} color="#86efac"/> },
            { l: "Total de Módulos",  v: r.modulos_total,    cor: "#bfdbfe", icon: <Activity      size={14} color="#bfdbfe"/> },
          ].map(k => (
            <div key={k.l} style={{ background: "rgba(255,255,255,.1)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              {k.icon}
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: k.cor, lineHeight: 1 }}>{k.v}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)", marginTop: 2 }}>{k.l}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid de módulos */}
      <div style={{ padding: "20px 28px 60px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 12, letterSpacing: 0.5 }}>
          PAINEL DE INDICADORES — {r.blocos.length} ÁREAS · CLIQUE NO INDICADOR PARA ABRIR O MÓDULO
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {r.blocos.map((b, i) => <BlocoModulo key={i} bloco={b}/>)}
        </div>
      </div>
    </div>
  );
}
