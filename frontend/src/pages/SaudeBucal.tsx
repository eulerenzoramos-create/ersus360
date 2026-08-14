// src/pages/SaudeBucal.tsx — Saúde Bucal · CEO · SB Brasil · SIASUS
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

interface IndicadorSB {
  id: string; codigo: string; nome: string; grupo: string;
  meta: number; realizado: number; unidade: string;
  pct_meta: number; status: "atingida" | "alerta" | "critico";
  tendencia: "alta" | "estavel" | "queda";
  historico: number[]; meses: string[];
}

interface ProcedimentoSB {
  codigo: string; descricao: string; quantidade: number; meta_mensal: number;
}

interface ResumoSB {
  score_sb: number; procedimentos_mes: number; meta_procedimentos: number;
  primeira_consulta_pct: number; tratamento_concluido_pct: number;
  cobertura_1a_consulta: number; exodontias_pct: number;
  equipes_sb: number; ceo_ativo: boolean;
}

const COR_STATUS: Record<string, string> = {
  atingida: "#16a34a", alerta: "#d97706", critico: "#dc2626",
};
const TEND: Record<string, string> = { alta: "▲", estavel: "→", queda: "▼" };
const TEND_COR: Record<string, string> = { alta: "#16a34a", estavel: "#6b7280", queda: "#dc2626" };

function MiniSpark({ vals, cor }: { vals: number[]; cor: string }) {
  const max = Math.max(...vals) || 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * 100},${38 - (v / max) * 34}`).join(" ");
  return (
    <svg width="80" height="40" viewBox="0 0 100 40" style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="2.5" strokeLinejoin="round"/>
      <circle cx={100} cy={38 - (vals[vals.length - 1] / max) * 34} r="3.5" fill={cor}/>
    </svg>
  );
}

function CardIndicadorSB({ ind }: { ind: IndicadorSB }) {
  const [aberto, setAberto] = useState(false);
  const cor = COR_STATUS[ind.status];
  const pct = Math.min(100, ind.pct_meta);

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}25`, borderLeft: `4px solid ${cor}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setAberto(o => !o)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: cor + "12", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" as const }}>
          <svg width="48" height="48" style={{ position: "absolute" as const, top: 0, left: 0 }}>
            <circle cx="24" cy="24" r="20" fill="none" stroke={cor + "30"} strokeWidth="4"/>
            <circle cx="24" cy="24" r="20" fill="none" stroke={cor} strokeWidth="4"
              strokeDasharray={`${(pct / 100) * 125.6} 125.6`}
              strokeDashoffset="31.4" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 9, fontWeight: 900, color: cor, position: "relative" as const, zIndex: 1 }}>{pct?.toFixed(0)}%</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>{ind.nome}</span>
            <span style={{ fontSize: 9, fontWeight: 800, background: cor + "18", color: cor, padding: "2px 7px", borderRadius: 10 }}>
              {ind.status === "atingida" ? "Meta atingida" : ind.status === "alerta" ? "Alerta" : "Crítico"}
            </span>
            <span style={{ fontSize: 9, color: "#9ca3af" }}>{ind.codigo} · {ind.grupo}</span>
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 10, color: "#6b7280" }}>
            <span>Realizado: <b style={{ color: cor }}>{ind.realizado} {ind.unidade}</b></span>
            <span>Meta: <b>{ind.meta} {ind.unidade}</b></span>
            <span style={{ color: TEND_COR[ind.tendencia], fontWeight: 700 }}>{TEND[ind.tendencia]} {ind.tendencia}</span>
          </div>
        </div>
        <MiniSpark vals={ind.historico} cor={cor}/>
        {aberto ? <ChevronDown size={14} color="#9ca3af"/> : <ChevronRight size={14} color="#9ca3af"/>}
      </div>

      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}15`, padding: "14px 16px", background: "#fafafa" }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10 }}>Histórico mensal 2026</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 6 }}>
            {ind.historico.map((v, i) => {
              const c2 = v >= ind.meta / 12 ? "#16a34a" : v >= (ind.meta / 12) * 0.75 ? "#d97706" : "#dc2626";
              return (
                <div key={i} style={{ textAlign: "center" as const }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: c2 }}>{v}</div>
                  <div style={{ fontSize: 8, color: "#9ca3af" }}>{ind.meses[i]}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SaudeBucal() {
  const [aba, setAba] = useState<"indicadores" | "producao">("indicadores");
  const [filtroGrupo, setFiltroGrupo] = useState("todos");

  const { data: resumo } = useQuery<ResumoSB>({
    queryKey: ["sb-resumo"],
    queryFn: () => apiGet("/api/saude-bucal/resumo") as Promise<ResumoSB>,
    staleTime: 300_000,
  });

  const { data: indicadores = [], isLoading: loadI } = useQuery<IndicadorSB[]>({
    queryKey: ["sb-indicadores"],
    queryFn: () => apiGet("/api/saude-bucal/indicadores") as Promise<IndicadorSB[]>,
    staleTime: 300_000,
  });

  const { data: procedimentos = [], isLoading: loadP } = useQuery<ProcedimentoSB[]>({
    queryKey: ["sb-procedimentos"],
    queryFn: () => apiGet("/api/saude-bucal/procedimentos") as Promise<ProcedimentoSB[]>,
    staleTime: 300_000,
  });

  const grupos = ["todos", ...Array.from(new Set(indicadores.map(i => i.grupo))).sort()];
  const visiveis = indicadores.filter(i => filtroGrupo === "todos" || i.grupo === filtroGrupo);
  const r = resumo;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#0891b2 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "5px 8px", fontSize: 18 }}>🦷</div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Saúde Bucal · SB Brasil</span>
              <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,.2)", color: "#bae6fd", padding: "2px 9px", borderRadius: 10 }}>SIASUS · CEO</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Indicadores SB Brasil · Produção odontológica ambulatorial · ESB · FMS Apuí/AM · 2026
            </div>
          </div>
        </div>

        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 8, marginTop: 16 }}>
            {[
              { l: "Score SB",          v: `${r.score_sb}/10`,              cor: r.score_sb >= 7 ? "#86efac" : r.score_sb >= 5 ? "#fde68a" : "#fca5a5" },
              { l: "Proced./mês",       v: r.procedimentos_mes,             cor: "#bae6fd" },
              { l: "Meta/mês",          v: r.meta_procedimentos,            cor: "#bae6fd" },
              { l: "1ª Consulta",       v: `${r.primeira_consulta_pct}%`,   cor: "#86efac" },
              { l: "Trat. Concluído",   v: `${r.tratamento_concluido_pct}%`, cor: "#86efac" },
              { l: "Cob. 1ª Consulta",  v: `${r.cobertura_1a_consulta}%`,   cor: "#fde68a" },
              { l: "% Exodontia",       v: `${r.exodontias_pct}%`,          cor: r.exodontias_pct > 30 ? "#fca5a5" : "#86efac" },
              { l: "ESB ativas",        v: r.equipes_sb,                    cor: "#86efac" },
            ].map(k => (
              <div key={k.l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 8px", textAlign: "center" as const }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: k.cor }}>{k.v}</div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,.5)" }}>{k.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: 4, width: "fit-content" }}>
          {(["indicadores", "producao"] as const).map(a => (
            <button key={a} onClick={() => setAba(a)}
              style={{ padding: "7px 18px", fontSize: 11, fontWeight: 700, borderRadius: 8, border: "none", cursor: "pointer",
                background: aba === a ? "#0891b2" : "transparent", color: aba === a ? "#fff" : "#6b7280" }}>
              {a === "indicadores" ? "Indicadores SB Brasil" : "Produção Ambulatorial"}
            </button>
          ))}
        </div>

        {aba === "indicadores" && (
          <>
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" as const, alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Grupo:</span>
              {grupos.map(g => (
                <button key={g} onClick={() => setFiltroGrupo(g)}
                  style={{ padding: "5px 10px", fontSize: 10, borderRadius: 20, border: `1px solid ${filtroGrupo===g?"#0891b2":"#d1d5db"}`, background: filtroGrupo===g?"#e0f2fe":"#fff", color: filtroGrupo===g?"#0891b2":"#374151", cursor: "pointer" }}>
                  {g === "todos" ? "Todos" : g}
                </button>
              ))}
            </div>
            {loadI
              ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando indicadores...</div>
              : visiveis.length === 0
                ? <NaoDisponivelBanner titulo="Indicadores Saude Bucal indisponiveis" nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />
                : visiveis.map(ind => <CardIndicadorSB key={ind.id} ind={ind}/>)
            }
          </>
        )}

        {aba === "producao" && (
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Código SIGTAP", "Procedimento", "Qtd. mês", "Meta/mês", "% Meta"].map(h => (
                    <th key={h} style={{ textAlign: "left" as const, padding: "10px 14px", fontSize: 9, fontWeight: 700, color: "#9ca3af", borderBottom: "1px solid #e4e7ec" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadP
                  ? <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Carregando...</td></tr>
                  : procedimentos.length === 0
                  ? <tr><td colSpan={5} style={{ padding: 24 }}><NaoDisponivelBanner titulo="Producao odontologica indisponivel" nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." /></td></tr>
                  : procedimentos.map((p, i) => {
                      const pct = p.meta_mensal > 0 ? Math.round((p.quantidade / p.meta_mensal) * 100) : 0;
                      const cor = pct >= 100 ? "#16a34a" : pct >= 75 ? "#d97706" : "#dc2626";
                      return (
                        <tr key={p.codigo} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ padding: "9px 14px", fontSize: 9, color: "#9ca3af", fontFamily: "monospace" }}>{p.codigo}</td>
                          <td style={{ padding: "9px 14px", fontSize: 11, fontWeight: 600, color: "#374151" }}>{p.descricao}</td>
                          <td style={{ padding: "9px 14px", fontSize: 11, fontWeight: 700 }}>{p.quantidade}</td>
                          <td style={{ padding: "9px 14px", fontSize: 11, color: "#6b7280" }}>{p.meta_mensal}</td>
                          <td style={{ padding: "9px 14px" }}>
                            <span style={{ fontSize: 10, fontWeight: 900, color: cor }}>{pct}%</span>
                          </td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
