// src/pages/QualidadeCADSUS.tsx — Painel de Qualidade Cadastral CADSUS por Microárea
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserCheck, MapPin, RefreshCw, AlertCircle, CheckCircle,
  ChevronDown, ChevronRight, Search, BarChart3, Users, Percent,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Microarea {
  codigo: string; nome: string; acs: string; ine_equipe: string; total_cidadaos: number;
  score_qualidade: number; tendencia: "melhora" | "piora" | "estavel";
  indicadores: Record<string, Indicador>;
  criticos: CidadaoCritico[];
}

interface Indicador {
  label: string; pct: number; meta: number; qtd_ok: number; total: number;
}

interface CidadaoCritico {
  cns: string; nome: string; problema: string; criticidade: "alta" | "media";
}

interface PainelResumo {
  competencia: string; total_microareas: number; score_municipio: number;
  total_cidadaos: number; cidadaos_completos: number; cidadaos_incompletos: number;
  distribuicao_score: { faixa: string; qtd: number; pct: number; cor: string }[];
  indicadores_municipio: Record<string, { pct: number; meta: number; label: string }>;
  historico_score: { mes: string; score: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function qCor(s: number) {
  return s >= 85 ? "#16a34a" : s >= 65 ? "#d97706" : "#dc2626";
}

function MiniBar({ pct, meta, cor }: { pct: number; meta: number; cor: string }) {
  return (
    <div style={{ position: "relative", height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "visible" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: cor, borderRadius: 4 }}/>
      {/* Marcador de meta */}
      <div style={{ position: "absolute", top: -3, left: `${Math.min(meta, 100)}%`, width: 2, height: 14, background: "#374151", borderRadius: 1, transform: "translateX(-50%)" }}/>
    </div>
  );
}

// ── Card Microárea ────────────────────────────────────────────────────────────

function CardMicroarea({ m }: { m: Microarea }) {
  const [aberto, setAberto] = useState(false);
  const cor = qCor(m.score_qualidade);

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}30`, borderLeft: `4px solid ${cor}`, borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
      <div onClick={() => setAberto(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 18px", cursor: "pointer" }}>

        {/* Score círculo */}
        <div style={{ textAlign: "center", minWidth: 52 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: cor, lineHeight: 1 }}>{m.score_qualidade}</div>
          <div style={{ fontSize: 9, color: "#9ca3af" }}>qualidade</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{m.nome}</span>
            <span style={{ fontSize: 10, color: "#6b7280", background: "#f1f5f9", padding: "1px 7px", borderRadius: 10 }}>
              <MapPin size={10} style={{ verticalAlign: "middle", marginRight: 3 }}/>ACS: {m.acs}
            </span>
            <span style={{ fontSize: 9, color: m.tendencia==="melhora"?"#16a34a":m.tendencia==="piora"?"#dc2626":"#9ca3af", fontWeight: 700 }}>
              {m.tendencia==="melhora" ? "↑ Melhora" : m.tendencia==="piora" ? "↓ Piora" : "→ Estável"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            {m.total_cidadaos} cidadãos · INE {m.ine_equipe} · {m.criticos.length} registros críticos
          </div>
        </div>

        {/* Barra de qualidade resumida */}
        <div style={{ minWidth: 120 }}>
          <MiniBar pct={m.score_qualidade} meta={85} cor={cor}/>
          <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 3, textAlign: "right" }}>meta 85</div>
        </div>

        {aberto ? <ChevronDown size={14} color="#9ca3af"/> : <ChevronRight size={14} color="#9ca3af"/>}
      </div>

      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}20`, padding: "14px 18px", background: "#fafafa" }}>
          {/* Indicadores */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Indicadores de Qualidade</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
              {Object.entries(m.indicadores).map(([key, ind]) => {
                const iCor = ind.pct >= ind.meta ? "#16a34a" : ind.pct >= ind.meta * 0.75 ? "#d97706" : "#dc2626";
                return (
                  <div key={key} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{ind.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: iCor }}>{ind.pct}%</span>
                    </div>
                    <MiniBar pct={ind.pct} meta={ind.meta} cor={iCor}/>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#9ca3af", marginTop: 4 }}>
                      <span>{ind.qtd_ok}/{ind.total} registros</span>
                      <span>meta {ind.meta}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cidadãos críticos */}
          {m.criticos.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "#dc2626" }}>
                Registros para Regularização — {m.criticos.length}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 6 }}>
                {m.criticos.slice(0, 9).map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#fff", border: `1px solid ${c.criticidade==="alta"?"#fecaca":"#fef3c7"}`, borderRadius: 7, padding: "7px 10px" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.criticidade==="alta"?"#dc2626":"#d97706", marginTop: 4, flexShrink: 0 }}/>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{c.nome}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>CNS {c.cns}</div>
                      <div style={{ fontSize: 10, color: c.criticidade==="alta"?"#dc2626":"#d97706" }}>{c.problema}</div>
                    </div>
                  </div>
                ))}
                {m.criticos.length > 9 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 11 }}>
                    +{m.criticos.length - 9} registros...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function QualidadeCADSUS() {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [abaAtiva, setAbaAtiva] = useState<"microareas"|"panorama">("microareas");
  const qc = useQueryClient();

  const { data: painel, isLoading: loadPainel } = useQuery<PainelResumo>({
    queryKey: ["cadsus-painel"],
    queryFn: () => apiGet("/api/cadsus-qualidade/resumo") as Promise<PainelResumo>,
    staleTime: 60_000,
  });

  const { data: microareas = [], isLoading: loadMicro } = useQuery<Microarea[]>({
    queryKey: ["cadsus-microareas", filtro],
    queryFn: () => apiGet("/api/cadsus-qualidade/microareas", { filtro }) as Promise<Microarea[]>,
    staleTime: 60_000,
  });

  const sincronizar = useMutation({
    mutationFn: () => apiPost("/api/cadsus-qualidade/sincronizar"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cadsus-painel"] }); qc.invalidateQueries({ queryKey: ["cadsus-microareas"] }); },
  });

  const visiveis = microareas.filter(m =>
    !busca || m.nome.toLowerCase().includes(busca.toLowerCase()) || m.acs.toLowerCase().includes(busca.toLowerCase())
  );

  const p = painel;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#1351b4 100%)", padding: "18px 28px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}>
                <UserCheck size={18} color="#fff"/>
              </div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Qualidade Cadastral CADSUS</span>
              {p && (
                <span style={{ background: "rgba(255,255,255,.2)", color: "#fff", borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                  {p.competencia}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Completude · Consistência · Unicidade · Atualização por microárea
            </div>
          </div>
          <button onClick={() => sincronizar.mutate()} disabled={sincronizar.isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            <RefreshCw size={13}/>{sincronizar.isPending ? "Sincronizando..." : "Sincronizar CADSUS"}
          </button>
        </div>

        {/* KPIs */}
        {p && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginTop: 16 }}>
            {[
              { label: "Score Municipal", val: p.score_municipio, suf: "", cor: qCor(p.score_municipio)+"dd" },
              { label: "Microáreas", val: p.total_microareas, suf: "", cor: "#fff" },
              { label: "Total Cidadãos", val: p.total_cidadaos.toLocaleString("pt-BR"), suf: "", cor: "#bfdbfe" },
              { label: "Completos", val: p.cidadaos_completos.toLocaleString("pt-BR"), suf: "", cor: "#86efac" },
              { label: "Incompletos", val: p.cidadaos_incompletos.toLocaleString("pt-BR"), suf: "", cor: "#fca5a5" },
            ].map(k => (
              <div key={k.label} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: k.cor }}>{k.val}{k.suf}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>{k.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Abas */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e4e7ec", padding: "0 28px", display: "flex" }}>
        {(["microareas","panorama"] as const).map(a => (
          <button key={a} onClick={() => setAbaAtiva(a)}
            style={{ padding: "12px 18px", fontSize: 13, fontWeight: abaAtiva===a?700:400, background: "none", border: "none", borderBottom: abaAtiva===a?"2px solid #1351b4":"2px solid transparent", color: abaAtiva===a?"#1351b4":"#6b7280", cursor: "pointer" }}>
            {a === "microareas" ? "Por Microárea" : "Panorama Municipal"}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        {abaAtiva === "panorama" && p && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Indicadores municipio */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Indicadores de Qualidade Municipal</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {Object.entries(p.indicadores_municipio).map(([key, ind]) => {
                  const iCor = ind.pct >= ind.meta ? "#16a34a" : ind.pct >= ind.meta * 0.75 ? "#d97706" : "#dc2626";
                  return (
                    <div key={key}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{ind.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: iCor }}>{ind.pct}% <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400 }}>/ meta {ind.meta}%</span></span>
                      </div>
                      <MiniBar pct={ind.pct} meta={ind.meta} cor={iCor}/>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Histórico */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Histórico — Score de Qualidade</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
                {p.historico_score.map((h, i) => {
                  const hCor = qCor(h.score);
                  const alt = Math.max(8, (h.score / 100) * 100);
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: hCor }}>{h.score}</div>
                      <div style={{ width: "100%", height: alt, background: hCor, borderRadius: "3px 3px 0 0", opacity: 0.8 }}/>
                      <div style={{ fontSize: 8, color: "#9ca3af", whiteSpace: "nowrap" as const }}>{h.mes}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Distribuição */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px", gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Distribuição de Microáreas por Score</div>
              <div style={{ display: "flex", gap: 8 }}>
                {p.distribuicao_score.map(d => (
                  <div key={d.faixa} style={{ flex: 1, background: `${d.cor}10`, border: `1px solid ${d.cor}30`, borderRadius: 8, padding: "14px", textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: d.cor }}>{d.qtd}</div>
                    <div style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>{d.faixa}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{d.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {abaAtiva === "microareas" && (
          <>
            {/* Filtros */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 12px" }}>
                <Search size={12} color="#9ca3af"/>
                <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar microárea ou ACS..."
                  style={{ border: "none", outline: "none", fontSize: 12, width: 200, background: "transparent" }}/>
              </div>
              {[{id:"todas",l:"Todas"},{id:"criticas",l:"Críticas (<65)"},{id:"atencao",l:"Atenção (65–84)"},{id:"boas",l:"Boas (≥85)"}].map(f=>(
                <button key={f.id} onClick={() => setFiltro(f.id)}
                  style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: `1px solid ${filtro===f.id?"#1351b4":"#d1d5db"}`, background: filtro===f.id?"#eff6ff":"#fff", color: filtro===f.id?"#1351b4":"#374151", cursor: "pointer", fontWeight: filtro===f.id?700:400 }}>
                  {f.l}
                </button>
              ))}
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>{visiveis.length} microáreas</span>
            </div>

            {(loadMicro || loadPainel) ? (
              <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando dados CADSUS...</div>
            ) : (
              visiveis.length === 0
                ? <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}><UserCheck size={32} color="#d1d5db" style={{ marginBottom: 8 }}/><br/>Nenhuma microárea encontrada.</div>
                : visiveis.map(m => <CardMicroarea key={m.codigo} m={m}/>)
            )}
          </>
        )}
      </div>
    </div>
  );
}
