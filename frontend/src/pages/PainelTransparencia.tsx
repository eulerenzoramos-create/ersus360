// src/pages/PainelTransparencia.tsx — Painel de Transparência · LAI / e-SUS
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Download, Globe, FileText, DollarSign, Users, BarChart3, Shield } from "lucide-react";
import { apiGet } from "../lib/api";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface IndicadorPublico {
  categoria: string; nome: string; valor: string; referencia: string;
  fonte: string; competencia: string; status: "publicado" | "pendente" | "revisao";
}

interface SolicitacaoLAI {
  protocolo: string; data: string; assunto: string;
  status: "respondida" | "em_analise" | "pendente" | "negada";
  prazo_resp: string; dias_restantes: number | null;
}

interface DespesaPublica {
  categoria: string; empenhado: number; liquidado: number; pago: number; pct_exec: number;
}

interface ResumoTransparencia {
  indice_transparencia: number; indicadores_publicados: number;
  solicitacoes_lai: number; solicitacoes_respondidas: number;
  taxa_resposta_lai_pct: number; ultima_atualizacao: string;
  portal_url: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────


const COR_STATUS_IND: Record<string, string> = {
  publicado: "#16a34a", pendente: "#d97706", revisao: "#1351b4",
};

function BadgeLAI({ s }: { s: string }) {
  const m: Record<string,[string,string]> = {
    respondida: ["#dcfce7","#166534"], em_analise: ["#dbeafe","#1e40af"],
    pendente: ["#fef3c7","#92400e"], negada: ["#fee2e2","#991b1b"],
  };
  const [bg,cor] = m[s] ?? ["#f1f5f9","#64748b"];
  const labels: Record<string,string> = { respondida:"Respondida", em_analise:"Em Análise", pendente:"Pendente", negada:"Negada" };
  return <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10, background: bg, color: cor }}>{labels[s]??s}</span>;
}

// ── Gauge de transparência ────────────────────────────────────────────────────

function GaugeTransparencia({ score }: { score: number }) {
  const cor = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
  const r = 52; const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  return (
    <div style={{ textAlign: "center" as const }}>
      <svg width={130} height={130} viewBox="0 0 130 130">
        <circle cx={65} cy={65} r={r} fill="none" stroke="#e5e7eb" strokeWidth={10}/>
        <circle cx={65} cy={65} r={r} fill="none" stroke={cor} strokeWidth={10}
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
          transform="rotate(-90 65 65)"/>
        <text x={65} y={60} textAnchor="middle" dominantBaseline="middle" fontSize={28} fontWeight={900} fill={cor}>{score}</text>
        <text x={65} y={80} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#9ca3af">/100</text>
      </svg>
      <div style={{ fontSize: 12, fontWeight: 700, color: cor }}>
        {score >= 80 ? "Transparência Alta" : score >= 60 ? "Transparência Média" : "Transparência Baixa"}
      </div>
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function PainelTransparencia() {
  const [tab, setTab] = useState<"indicadores" | "financeiro" | "lai" | "publicacoes">("indicadores");

  const { data: resumo } = useQuery<ResumoTransparencia>({
    queryKey: ["transp-resumo"],
    queryFn: () => apiGet("/api/transparencia/resumo") as Promise<ResumoTransparencia>,
    staleTime: 300_000,
  });

  const { data: indicadores = [] } = useQuery<IndicadorPublico[]>({
    queryKey: ["transp-indicadores"],
    queryFn: () => apiGet("/api/transparencia/indicadores") as Promise<IndicadorPublico[]>,
    staleTime: 300_000,
  });

  const { data: solicitacoes = [] } = useQuery<SolicitacaoLAI[]>({
    queryKey: ["transp-lai"],
    queryFn: () => apiGet("/api/transparencia/lai") as Promise<SolicitacaoLAI[]>,
    staleTime: 300_000,
  });

  const { data: despesas = [] } = useQuery<DespesaPublica[]>({
    queryKey: ["transp-despesas"],
    queryFn: () => apiGet("/api/transparencia/despesas") as Promise<DespesaPublica[]>,
    staleTime: 300_000,
  });

  const r = resumo;
  const categorias = Array.from(new Set(indicadores.map(i => i.categoria)));

  if (!isLoading && !resumo) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="PainelTransparencia indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0c4a6e 0%,#0284c7 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><Eye size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Painel de Transparência · LAI</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Lei de Acesso à Informação (Lei 12.527/2011) · Indicadores públicos de saúde · FMS Apuí/AM
            </div>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            <Globe size={12}/> Portal Transparência
          </button>
        </div>

        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginTop: 16 }}>
            {[
              { l: "Índice LAI",        v: `${r.indice_transparencia}/100`, cor: "#7dd3fc" },
              { l: "Indicadores Pub.",  v: r.indicadores_publicados,        cor: "#bae6fd" },
              { l: "Solicit. LAI",      v: r.solicitacoes_lai,              cor: "#bae6fd" },
              { l: "Respondidas",       v: r.solicitacoes_respondidas,      cor: "#86efac" },
              { l: "Taxa Resposta",     v: `${r.taxa_resposta_lai_pct}%`,   cor: "#86efac" },
              { l: "Atualização",       v: r.ultima_atualizacao,            cor: "rgba(255,255,255,.5)" },
            ].map(k => (
              <div key={k.l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 12px", textAlign: "center" as const }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: k.cor }}>{k.v}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)" }}>{k.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: 4, marginBottom: 16, width: "fit-content" as const }}>
          {([["indicadores","Indicadores Públicos"],["financeiro","Execução Financeira"],["lai","Solicitações LAI"],["publicacoes","Publicações"]] as [string,string][]).map(([id,l]) => (
            <button key={id} onClick={() => setTab(id as any)}
              style={{ padding: "6px 16px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: tab===id?700:400, background: tab===id?"#0284c7":"transparent", color: tab===id?"#fff":"#6b7280", cursor: "pointer" }}>
              {l}
            </button>
          ))}
        </div>

        {tab === "indicadores" && (
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
            {r && <GaugeTransparencia score={r.indice_transparencia}/>}
            <div>
              {categorias.map(cat => (
                <div key={cat} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#0284c7", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{cat}</div>
                  <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, overflow: "hidden" }}>
                    {indicadores.filter(i => i.categoria === cat).map((ind, idx) => (
                      <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 100px 100px 80px 80px", gap: 12, padding: "10px 14px", borderBottom: "1px solid #f3f4f6", fontSize: 11, alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{ind.nome}</div>
                          <div style={{ fontSize: 9, color: "#9ca3af" }}>{ind.fonte} · {ind.competencia}</div>
                        </div>
                        <div style={{ fontWeight: 900, fontSize: 13 }}>{ind.valor}</div>
                        <div style={{ fontSize: 10, color: "#6b7280" }}>{ind.referencia}</div>
                        <div style={{ fontSize: 9, color: COR_STATUS_IND[ind.status], fontWeight: 800 }}>{ind.status}</div>
                        <button style={{ padding: "3px 8px", fontSize: 9, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <Download size={9}/> CSV
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "financeiro" && (
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e4e7ec", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", gap: 12, fontSize: 10, fontWeight: 700, color: "#6b7280" }}>
              <span>CATEGORIA</span><span style={{textAlign:"right" as const}}>EMPENHADO</span><span style={{textAlign:"right" as const}}>LIQUIDADO</span><span style={{textAlign:"right" as const}}>PAGO</span><span style={{textAlign:"center" as const}}>EXECUÇÃO</span>
            </div>
            {despesas.map((d, i) => {
              const cor = d.pct_exec >= 80 ? "#16a34a" : d.pct_exec >= 50 ? "#d97706" : "#dc2626";
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", gap: 12, padding: "12px 16px", borderBottom: "1px solid #f3f4f6", fontSize: 11, alignItems: "center" }}>
                  <span style={{ fontWeight: 600 }}>{d.categoria}</span>
                  <span style={{ textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{BRL(d.empenhado)}</span>
                  <span style={{ textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>{BRL(d.liquidado)}</span>
                  <span style={{ textAlign: "right" as const, fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{BRL(d.pago)}</span>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: cor, textAlign: "center" as const, marginBottom: 3 }}>{d.pct_exec}%</div>
                    <div style={{ height: 4, background: "#f3f4f6", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${d.pct_exec}%`, background: cor, borderRadius: 2 }}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "lai" && (
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e4e7ec", display: "grid", gridTemplateColumns: "120px 1fr 100px 100px 80px", gap: 12, fontSize: 10, fontWeight: 700, color: "#6b7280" }}>
              <span>PROTOCOLO</span><span>ASSUNTO</span><span>STATUS</span><span>PRAZO</span><span style={{textAlign:"center" as const}}>DIAS</span>
            </div>
            {solicitacoes.map((s, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr 100px 100px 80px", gap: 12, padding: "10px 16px", borderBottom: "1px solid #f3f4f6", fontSize: 11, alignItems: "center" }}>
                <span style={{ fontFamily: "monospace", fontSize: 10 }}>{s.protocolo}</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.assunto}</div>
                  <div style={{ fontSize: 9, color: "#9ca3af" }}>Recebida em {s.data}</div>
                </div>
                <BadgeLAI s={s.status}/>
                <span style={{ fontSize: 10 }}>{s.prazo_resp}</span>
                <span style={{ textAlign: "center" as const, fontSize: 11, fontWeight: 800, color: s.dias_restantes !== null ? (s.dias_restantes <= 3 ? "#dc2626" : "#374151") : "#9ca3af" }}>
                  {s.dias_restantes !== null ? `${s.dias_restantes}d` : "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === "publicacoes" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {[
              { titulo: "Relatório Anual de Gestão 2025", tipo: "RAG", data: "31/01/2026", tamanho: "2,4 MB", icon: FileText, cor: "#1351b4" },
              { titulo: "Prestação de Contas TCE/AM 2025", tipo: "TCE", data: "05/02/2026", tamanho: "1,8 MB", icon: Shield, cor: "#dc2626" },
              { titulo: "RDQA — 3º Quadrimestre 2025", tipo: "RDQA", data: "28/02/2026", tamanho: "0,9 MB", icon: BarChart3, cor: "#7c3aed" },
              { titulo: "Plano Municipal de Saúde 2026-2029", tipo: "PMS", data: "15/01/2026", tamanho: "3,2 MB", icon: FileText, cor: "#059669" },
              { titulo: "Boletim Epidemiológico — Jun/2026", tipo: "Boletim", data: "15/07/2026", tamanho: "0,6 MB", icon: BarChart3, cor: "#ea580c" },
              { titulo: "SIOPS — Gastos em Saúde 2026/1º Sem.", tipo: "SIOPS", data: "20/07/2026", tamanho: "0,4 MB", icon: DollarSign, cor: "#16a34a" },
            ].map((p, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "16px" }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: p.cor + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <p.icon size={16} color={p.cor}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: p.cor, marginBottom: 2 }}>{p.tipo}</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{p.titulo}</div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#9ca3af" }}>{p.data} · {p.tamanho}</span>
                  <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", fontSize: 10, fontWeight: 700, background: p.cor, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
                    <Download size={10}/> PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
