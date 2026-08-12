// src/pages/PrevisaoPrevineBrasil.tsx — Modelo Preditivo ML · Previne Brasil
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Brain, TrendingUp, TrendingDown, RefreshCw, Target, AlertTriangle,
  CheckCircle, Zap, BarChart3, Activity, ChevronDown, ChevronRight,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface PrevisaoIndicador {
  codigo: string; nome: string; grupo: "C" | "B" | "M";
  valor_atual: number; meta: number; pct_meta: number;
  previsao_proximo: number; previsao_daqui2: number; previsao_daqui3: number;
  tendencia: "crescimento" | "queda" | "estavel";
  confianca_pct: number; gap_fechamento: number;
  fatores_risco: FatorRisco[];
  acoes_recomendadas: string[];
  historico: { competencia: string; valor: number }[];
}

interface FatorRisco {
  fator: string; impacto: "alto" | "medio" | "baixo"; direcao: "positivo" | "negativo";
}

interface ResumoPrevisao {
  competencia_atual: string; competencia_previsao: string;
  score_atual: number; score_previsto: number; delta_score: number;
  indicadores_em_risco: number; indicadores_no_prazo: number;
  acuracia_modelo: number; ultima_atualizacao: string;
  modelo_versao: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pctCor(pct: number) {
  return pct >= 100 ? "#16a34a" : pct >= 70 ? "#d97706" : "#dc2626";
}
function tendIcon(t: string) {
  return t === "crescimento" ? <TrendingUp size={12} color="#16a34a"/> :
         t === "queda"       ? <TrendingDown size={12} color="#dc2626"/> :
         <Activity size={12} color="#9ca3af"/>;
}

// ── Mini Sparkline ────────────────────────────────────────────────────────────

function Sparkline({ historico, previsoes }: { historico: { competencia: string; valor: number }[]; previsoes: number[] }) {
  const todos = [...historico.map(h => h.valor), ...previsoes];
  const min = Math.min(...todos);
  const max = Math.max(...todos);
  const range = max - min || 1;
  const W = 180; const H = 42;
  const pts = historico.map((h, i) => ({ x: i * (W / (historico.length + previsoes.length - 1)), y: H - ((h.valor - min) / range) * (H - 4) + 2 }));
  const prvPts = previsoes.map((v, i) => ({ x: (historico.length - 1 + i + 1) * (W / (historico.length + previsoes.length - 1)), y: H - ((v - min) / range) * (H - 4) + 2 }));
  const allPts = [...pts, ...prvPts];
  const path = allPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const histPath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const prvPath = [pts[pts.length - 1], ...prvPts].map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <path d={histPath} fill="none" stroke="#1351b4" strokeWidth={2} strokeLinecap="round"/>
      <path d={prvPath} fill="none" stroke="#1351b4" strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round" opacity={0.6}/>
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#1351b4"/>)}
      {prvPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#fff" stroke="#1351b4" strokeWidth={1.5}/>)}
    </svg>
  );
}

// ── Card Indicador ────────────────────────────────────────────────────────────

function CardIndicador({ ind }: { ind: PrevisaoIndicador }) {
  const [aberto, setAberto] = useState(false);
  const cor = pctCor(ind.pct_meta);
  const corPrev = pctCor((ind.previsao_daqui3 / ind.meta) * 100);

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}25`, borderLeft: `4px solid ${cor}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setAberto(o => !o)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{ind.nome}</span>
            <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 7px", borderRadius: 12, background: ind.grupo === "C" ? "#dbeafe" : ind.grupo === "B" ? "#fce7f3" : "#dcfce7", color: ind.grupo === "C" ? "#1d4ed8" : ind.grupo === "B" ? "#9d174d" : "#166534" }}>
              Grupo {ind.grupo}
            </span>
            {tendIcon(ind.tendencia)}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>Atual: {ind.valor_atual}% · Meta: {ind.meta}% · Atingimento: {ind.pct_meta}%</div>
        </div>
        <div style={{ flexShrink: 0, textAlign: "center" as const }}>
          <Sparkline historico={ind.historico} previsoes={[ind.previsao_proximo, ind.previsao_daqui2, ind.previsao_daqui3]}/>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
          <div style={{ textAlign: "center" as const }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: corPrev }}>{ind.previsao_daqui3}%</div>
            <div style={{ fontSize: 9, color: "#9ca3af" }}>prev. +3m</div>
          </div>
          <div style={{ textAlign: "center" as const }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: ind.confianca_pct >= 80 ? "#16a34a" : "#d97706" }}>{ind.confianca_pct}%</div>
            <div style={{ fontSize: 9, color: "#9ca3af" }}>confiança</div>
          </div>
          {aberto ? <ChevronDown size={14} color="#9ca3af"/> : <ChevronRight size={14} color="#9ca3af"/>}
        </div>
      </div>

      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}15`, padding: "14px 16px", background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Fatores de risco */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Fatores que Influenciam</div>
              {ind.fatores_risco.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, fontWeight: 700,
                    background: f.impacto === "alto" ? "#fee2e2" : f.impacto === "medio" ? "#fef3c7" : "#f1f5f9",
                    color: f.impacto === "alto" ? "#dc2626" : f.impacto === "medio" ? "#d97706" : "#6b7280" }}>
                    {f.impacto === "alto" ? "Alto" : f.impacto === "medio" ? "Médio" : "Baixo"}
                  </span>
                  <span style={{ fontSize: 11, color: f.direcao === "positivo" ? "#16a34a" : "#dc2626" }}>
                    {f.direcao === "positivo" ? "▲" : "▼"} {f.fator}
                  </span>
                </div>
              ))}
            </div>
            {/* Ações recomendadas */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Ações Recomendadas pelo Modelo</div>
              {ind.acoes_recomendadas.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 7, marginBottom: 5 }}>
                  <span style={{ color: "#1351b4", fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ fontSize: 11, color: "#374151" }}>{a}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Previsões mês a mês */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Previsão ML — Próximos 3 Meses</div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { label: "+1 mês", val: ind.previsao_proximo },
                { label: "+2 meses", val: ind.previsao_daqui2 },
                { label: "+3 meses", val: ind.previsao_daqui3 },
              ].map(p => {
                const c = pctCor((p.val / ind.meta) * 100);
                return (
                  <div key={p.label} style={{ flex: 1, textAlign: "center" as const, background: "#fff", border: `1px solid ${c}30`, borderRadius: 8, padding: "10px" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: c }}>{p.val}%</div>
                    <div style={{ fontSize: 9, color: "#9ca3af" }}>{p.label}</div>
                    <div style={{ fontSize: 9, color: c, fontWeight: 700 }}>{Math.round((p.val / ind.meta) * 100)}% da meta</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function PrevisaoPrevineBrasil() {
  const [filtroGrupo, setFiltroGrupo] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const qc = useQueryClient();

  const { data: resumo, isLoading: loadRes } = useQuery<ResumoPrevisao>({
    queryKey: ["previsao-resumo"],
    queryFn: () => apiGet("/api/previsao-previne/resumo") as Promise<ResumoPrevisao>,
    staleTime: 300_000,
  });

  const { data: indicadores = [], isLoading: loadInd } = useQuery<PrevisaoIndicador[]>({
    queryKey: ["previsao-indicadores", filtroGrupo],
    queryFn: () => apiGet("/api/previsao-previne/indicadores", { grupo: filtroGrupo !== "todos" ? filtroGrupo : undefined }) as Promise<PrevisaoIndicador[]>,
    staleTime: 300_000,
  });

  const retreinar = useMutation({
    mutationFn: () => apiPost("/api/previsao-previne/retreinar"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["previsao-resumo"] }); qc.invalidateQueries({ queryKey: ["previsao-indicadores"] }); },
  });

  const r = resumo;

  const visiveis = indicadores.filter(ind => {
    if (filtroStatus === "risco") return ind.pct_meta < 70;
    if (filtroStatus === "atencao") return ind.pct_meta >= 70 && ind.pct_meta < 100;
    if (filtroStatus === "meta") return ind.pct_meta >= 100;
    return true;
  });

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#7c3aed 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><Brain size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Previsão ML — Previne Brasil</span>
              {r && <span style={{ background: "rgba(255,255,255,.15)", color: "#c4b5fd", borderRadius: 6, padding: "2px 10px", fontSize: 10, fontWeight: 700 }}>
                Modelo v{r.modelo_versao} · Acurácia {r.acuracia_modelo}%
              </span>}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Modelo preditivo · Regressão ARIMA + Gradient Boosting · Previsão 3 meses · Grupos C, B e M
            </div>
          </div>
          <button onClick={() => retreinar.mutate()} disabled={retreinar.isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            <Zap size={12}/>{retreinar.isPending ? "Retreinando..." : "Retreinar Modelo"}
          </button>
        </div>

        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginTop: 16 }}>
            {[
              { label: "Score Atual", val: r.score_atual, suf: "", cor: pctCor(r.score_atual) + "dd" },
              { label: "Score Previsto", val: r.score_previsto, suf: "", cor: "#c4b5fd" },
              { label: "Δ Score", val: (r.delta_score > 0 ? "+" : "") + r.delta_score, suf: "", cor: r.delta_score >= 0 ? "#86efac" : "#fca5a5" },
              { label: "Em Risco", val: r.indicadores_em_risco, suf: "", cor: "#fca5a5" },
              { label: "No Prazo", val: r.indicadores_no_prazo, suf: "", cor: "#86efac" },
            ].map(k => (
              <div key={k.label} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 14px", textAlign: "center" as const }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: k.cor }}>{k.val}{k.suf}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.55)" }}>{k.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        {/* Filtros */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Grupo:</span>
          {["todos","C","B","M"].map(g => (
            <button key={g} onClick={() => setFiltroGrupo(g)}
              style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: `1px solid ${filtroGrupo===g?"#7c3aed":"#d1d5db"}`, background: filtroGrupo===g?"#ede9fe":"#fff", color: filtroGrupo===g?"#7c3aed":"#374151", cursor: "pointer", fontWeight: filtroGrupo===g?700:400 }}>
              {g === "todos" ? "Todos" : `Grupo ${g}`}
            </button>
          ))}
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginLeft: 8 }}>Status:</span>
          {[{id:"todos",l:"Todos"},{id:"risco",l:"Em Risco (<70%)"},{id:"atencao",l:"Atenção (70–99%)"},{id:"meta",l:"Na Meta (≥100%)"}].map(s => (
            <button key={s.id} onClick={() => setFiltroStatus(s.id)}
              style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: `1px solid ${filtroStatus===s.id?"#7c3aed":"#d1d5db"}`, background: filtroStatus===s.id?"#ede9fe":"#fff", color: filtroStatus===s.id?"#7c3aed":"#374151", cursor: "pointer", fontWeight: filtroStatus===s.id?700:400 }}>
              {s.l}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>{visiveis.length} indicadores</span>
        </div>

        {(loadInd || loadRes)
          ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Calculando previsões...</div>
          : visiveis.length === 0
            ? <NaoDisponivelBanner titulo="Previsao ML indisponivel" nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />
            : visiveis.map(ind => <CardIndicador key={ind.codigo} ind={ind}/>)
        }
      </div>
    </div>
  );
}
