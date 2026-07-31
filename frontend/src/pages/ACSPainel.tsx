// src/pages/ACSPainel.tsx — Painel ACS · eSUS PEC integrado
import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users, MapPin, Home, CheckCircle, Activity, Baby, Heart,
  Star, AlertTriangle, RefreshCw, ChevronDown, ChevronRight,
  User, FileText, Search, Filter, Calendar, Wifi, WifiOff,
  BarChart2, Navigation, ClipboardList, Building2, TrendingUp,
} from "lucide-react";
import { apiGet } from "../lib/api";
import ACSGeoPage from "./ACSGeoPage";

// ── Tipos ────────────────────────────────────────────────────────────────────

interface AcsItem {
  id: number; nome: string; microarea: string; esf: string; ativo: boolean;
  familias_cadastradas: number; familias_meta: number;
  pct_visitas: number; pct_cadastro: number;
  status: "destaque" | "regular" | "critico" | "afastado";
  visitas: { programadas: number; realizadas: number; nao_encontradas: number; recusas: number };
  indicadores: { gestantes_ativas: number; criancas_lt2: number; has: number; dm: number; idosos: number };
}

interface DashboardAcs {
  kpis: {
    total_acs: number; acs_ativos: number; total_microareas: number;
    familias_cadastradas: number; familias_meta: number; pct_cobertura: number;
    visitas_programadas: number; visitas_realizadas: number; pct_visitas: number;
    gestantes_ativas: number; criancas_lt2: number; has_acompanhados: number; dm_acompanhados: number;
  };
  acs_destaques: AcsItem[]; acs_criticos: AcsItem[];
  distribuicao_esf: Record<string, number>;
  mes_referencia: { label: string };
}

interface Microarea {
  codigo: string; nome: string; zona: string; esf: string;
  acs_count: number; acs_ativos: number;
  familias_cadastradas: number; familias_meta: number;
  pct_cobertura: number; pct_visitas: number; gestantes_ativas: number;
  semaforo: "verde" | "amarelo" | "vermelho";
}

interface EsusStatus { conectado: boolean; autenticado: boolean; url: string; versao: string | null }

type Aba = "dashboard" | "visitas" | "calendario" | "cadastros_ind" | "cadastros_dom" | "lista" | "microareas" | "geo" | "sis";

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COR: Record<string, string> = { destaque:"#16a34a", regular:"#1351b4", critico:"#dc2626", afastado:"#9ca3af" };
const STATUS_LABEL: Record<string, string> = { destaque:"Destaque", regular:"Regular", critico:"Atenção", afastado:"Afastado" };
const SEM_COR: Record<string, string> = { verde:"#16a34a", amarelo:"#d97706", vermelho:"#dc2626" };
const ESF_COR: Record<string, string> = { "ESF I":"#0891b2","ESF II":"#7c3aed","ESF III":"#16a34a","ESF IV":"#d97706","ESF V":"#dc2626" };

function Bar({ pct, cor, height = 6 }: { pct: number; cor: string; height?: number }) {
  return (
    <div style={{ height, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: cor, borderRadius: 4, transition: "width .4s" }} />
    </div>
  );
}

function Badge({ label, cor, bg, border }: { label: string; cor: string; bg: string; border: string }) {
  return (
    <span style={{ background: bg, color: cor, border: `1px solid ${border}`, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" as const }}>
      {label}
    </span>
  );
}

function KpiCard({ icon, label, val, sub, cor, bg, border }: {
  icon: React.ReactNode; label: string; val: string | number; sub?: string;
  cor: string; bg: string; border: string;
}) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
        <div style={{ background: `${cor}18`, borderRadius: 7, padding: 6, color: cor }}>{icon}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: cor, lineHeight: 1 }}>{val}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Card ACS ─────────────────────────────────────────────────────────────────

function AcsCard({ a }: { a: AcsItem }) {
  const [open, setOpen] = useState(false);
  const cor = STATUS_COR[a.status];
  const corVis = a.pct_visitas >= 90 ? "#16a34a" : a.pct_visitas >= 70 ? "#d97706" : "#dc2626";
  const corCad = a.pct_cadastro >= 90 ? "#16a34a" : "#d97706";

  return (
    <div style={{ border: `1px solid ${cor}30`, borderLeft: `4px solid ${cor}`, borderRadius: 10, background: "#fff", overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}>
        <div style={{ width: 38, height: 38, borderRadius: 19, background: `${cor}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <User size={16} color={cor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            {a.nome}
            <Badge label={STATUS_LABEL[a.status]} cor={cor} bg={`${cor}15`} border={`${cor}40`} />
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>{a.microarea} · {a.esf} · {a.familias_cadastradas} famílias</div>
        </div>
        <div style={{ display: "flex", gap: 18, alignItems: "center", flexShrink: 0 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: corVis }}>{a.pct_visitas}%</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>visitas</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: corCad }}>{a.pct_cadastro}%</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>cadastro</div>
          </div>
          {open ? <ChevronDown size={14} color="#9ca3af" /> : <ChevronRight size={14} color="#9ca3af" />}
        </div>
      </div>

      {open && (
        <div style={{ padding: "12px 16px 16px", borderTop: `1px solid ${cor}20`, background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 5 }}>
                Visitas — {a.visitas.realizadas}/{a.visitas.programadas} programadas · {a.pct_visitas}%
              </div>
              <Bar pct={a.pct_visitas} cor={corVis} height={8} />
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
                {a.visitas.nao_encontradas} não encontradas · {a.visitas.recusas} recusas
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 5 }}>
                Famílias — {a.familias_cadastradas}/{a.familias_meta} · {a.pct_cadastro}%
              </div>
              <Bar pct={a.pct_cadastro} cor={corCad} height={8} />
              <div style={{ fontSize: 10, color: a.pct_cadastro < 80 ? "#dc2626" : "#9ca3af", marginTop: 4 }}>
                {a.pct_cadastro < 80 ? `⚠ ${a.familias_meta - a.familias_cadastradas} cadastros pendentes` : "✓ Meta atingida"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
            {[
              { label: "Gestantes", val: a.indicadores.gestantes_ativas, cor: "#7c3aed" },
              { label: "< 2 anos",  val: a.indicadores.criancas_lt2,     cor: "#0891b2" },
              { label: "HAS",       val: a.indicadores.has,              cor: "#d97706" },
              { label: "DM",        val: a.indicadores.dm,               cor: "#dc2626" },
              { label: "Idosos",    val: a.indicadores.idosos,           cor: "#6b7280" },
            ].map(k => (
              <div key={k.label} style={{ textAlign: "center", padding: "7px 12px", background: `${k.cor}10`, borderRadius: 8, minWidth: 56 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: k.cor }}>{k.val}</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Aba Visitas ───────────────────────────────────────────────────────────────

function AbaVisitas({ fonte }: { fonte: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["acs-visitas"],
    queryFn: () => apiGet("/api/acs/esus/visitas") as Promise<any>,
    staleTime: 120_000,
  });

  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroEsf, setFiltroEsf] = useState("Todas");

  const visitas = data?.dados ?? [];
  const tiposCor: Record<string, string> = {
    visita_periodica: "#1351b4", busca_ativa: "#d97706",
    acompanhamento_gestante: "#7c3aed", acompanhamento_crianca: "#0891b2", outros: "#6b7280",
  };
  const tiposLabel: Record<string, string> = {
    visita_periodica: "Periódica", busca_ativa: "Busca Ativa",
    acompanhamento_gestante: "Gestante", acompanhamento_crianca: "Criança <2a", outros: "Outros",
  };
  const desfechoCor: Record<string, string> = {
    visita_realizada: "#16a34a", ausente: "#d97706", recusa: "#dc2626",
  };

  const filtradas = visitas.filter((v: any) =>
    (filtroTipo === "todos" || v.tipo_visita === filtroTipo) &&
    (filtroEsf === "Todas" || v.esf === filtroEsf)
  );

  const resumo = {
    total: visitas.length,
    realizadas: visitas.filter((v: any) => v.desfecho === "visita_realizada").length,
    ausentes: visitas.filter((v: any) => v.desfecho === "ausente").length,
    recusas: visitas.filter((v: any) => v.desfecho === "recusa").length,
  };

  if (isLoading) return <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>Carregando visitas...</div>;

  return (
    <div>
      {/* Resumo KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Visitas", val: resumo.total, cor: "#1351b4", bg: "#eff6ff", border: "#bfdbfe" },
          { label: "Realizadas", val: resumo.realizadas, cor: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
          { label: "Ausentes", val: resumo.ausentes, cor: "#d97706", bg: "#fef3c7", border: "#fde68a" },
          { label: "Recusas", val: resumo.recusas, cor: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.cor }}>{k.val}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
        <select value={filtroEsf} onChange={e => setFiltroEsf(e.target.value)}
          style={{ border: "1px solid #d1d5db", borderRadius: 7, padding: "7px 12px", fontSize: 12 }}>
          {["Todas","ESF I","ESF II","ESF III","ESF IV","ESF V"].map(e => <option key={e}>{e}</option>)}
        </select>
        <div style={{ display: "flex", gap: 6 }}>
          {["todos","visita_periodica","busca_ativa","acompanhamento_gestante","acompanhamento_crianca"].map(t => (
            <button key={t} onClick={() => setFiltroTipo(t)}
              style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: "1px solid #d1d5db", background: filtroTipo === t ? "#1351b4" : "#fff", color: filtroTipo === t ? "#fff" : "#374151", cursor: "pointer", fontWeight: filtroTipo === t ? 700 : 400 }}>
              {t === "todos" ? "Todos" : tiposLabel[t]}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>{filtradas.length} visitas</span>
      </div>

      {/* Tabela */}
      <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Data","ACS","Microárea","ESF","Tipo","Turno","Desfecho","Grupos Prioritários"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 11, borderBottom: "2px solid #e4e7ec", whiteSpace: "nowrap" as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.slice(0, 100).map((v: any, i: number) => {
                const gps = Object.entries(v.grupos_prioritarios || {}).filter(([, val]) => val).map(([k]) => k.replace("_", " "));
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "9px 12px", color: "#374151" }}>{v.data}</td>
                    <td style={{ padding: "9px 12px", fontWeight: 500 }}>{v.acs_nome}</td>
                    <td style={{ padding: "9px 12px" }}><span style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: 5, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{v.microarea}</span></td>
                    <td style={{ padding: "9px 12px", fontSize: 11, color: ESF_COR[v.esf] || "#374151", fontWeight: 600 }}>{v.esf}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{ background: `${tiposCor[v.tipo_visita] || "#6b7280"}15`, color: tiposCor[v.tipo_visita] || "#6b7280", borderRadius: 5, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
                        {tiposLabel[v.tipo_visita] || v.tipo_visita}
                      </span>
                    </td>
                    <td style={{ padding: "9px 12px", fontSize: 11, color: "#6b7280", textTransform: "capitalize" as const }}>{v.turno}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{ background: `${desfechoCor[v.desfecho] || "#6b7280"}15`, color: desfechoCor[v.desfecho] || "#6b7280", borderRadius: 5, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
                        {v.desfecho === "visita_realizada" ? "✓ Realizada" : v.desfecho === "ausente" ? "Ausente" : "Recusa"}
                      </span>
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
                        {gps.map((g: string) => (
                          <span key={g} style={{ background: "#faf5ff", color: "#7c3aed", fontSize: 9, padding: "1px 6px", borderRadius: 4, border: "1px solid #e9d5ff" }}>{g}</span>
                        ))}
                        {gps.length === 0 && <span style={{ color: "#d1d5db", fontSize: 10 }}>—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtradas.length > 100 && (
            <div style={{ padding: "10px 16px", fontSize: 11, color: "#9ca3af", textAlign: "center", borderTop: "1px solid #f3f4f6" }}>
              Mostrando 100 de {filtradas.length} visitas · Exporte para ver todas
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Aba Calendário ────────────────────────────────────────────────────────────

function AbaCalendario() {
  const [acsSel, setAcsSel] = useState<{ id: number; nome: string; esf: string; microarea: string } | null>(null);
  const [busca, setBusca] = useState("");

  // Lista de todos os ACS
  const { data: listaData } = useQuery({
    queryKey: ["acs-lista-calendario"],
    queryFn: () => apiGet("/api/acs/lista") as Promise<any>,
    staleTime: 300_000,
  });

  const todosAcs: AcsItem[] = listaData?.acs ?? [];

  // Calendário do ACS selecionado (ou geral)
  const { data, isLoading } = useQuery({
    queryKey: ["acs-calendario", acsSel?.id ?? null],
    queryFn: () => apiGet("/api/acs/esus/calendario-visitas", acsSel ? { acs_id: acsSel.id } : undefined) as Promise<any>,
    staleTime: 120_000,
  });

  const eventos = data?.eventos ?? [];
  const dias = data?.dias ?? 31;

  // Agrupar por dia
  const porDia: Record<number, { prog: number; real: number }> = {};
  eventos.forEach((e: any) => {
    if (!porDia[e.dia]) porDia[e.dia] = { prog: 0, real: 0 };
    porDia[e.dia].prog += e.programadas;
    porDia[e.dia].real += e.realizadas;
  });

  const totalProg = Object.values(porDia).reduce((s, d) => s + d.prog, 0);
  const totalReal = Object.values(porDia).reduce((s, d) => s + d.real, 0);
  const pct = totalProg > 0 ? Math.round(totalReal / totalProg * 100) : 0;

  // Agrupar ACS por equipe para o painel lateral
  const porEquipe: Record<string, AcsItem[]> = {};
  todosAcs.forEach((a: AcsItem) => {
    if (!porEquipe[a.esf]) porEquipe[a.esf] = [];
    porEquipe[a.esf].push(a);
  });
  const esfsOrdem = ["ESF I", "ESF II", "ESF III", "ESF IV", "ESF V"];
  const acsVisiveis = todosAcs.filter(a =>
    !busca || a.nome.toLowerCase().includes(busca.toLowerCase()) || a.microarea.toLowerCase().includes(busca.toLowerCase())
  );

  const titulo = acsSel
    ? `${acsSel.nome} · ${acsSel.microarea} · ${acsSel.esf}`
    : "Todos os ACS — Julho/2026";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, alignItems: "start" }}>
      {/* Painel lateral — seleção de ACS */}
      <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "14px 12px", maxHeight: 680, overflowY: "auto" as const }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>Selecionar ACS</div>

        {/* Busca */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", marginBottom: 12 }}>
          <Search size={12} color="#9ca3af" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar ACS ou microárea..."
            style={{ border: "none", outline: "none", fontSize: 11, flex: 1, background: "transparent", color: "#374151" }} />
        </div>

        {/* Botão "Todos" */}
        <button onClick={() => { setAcsSel(null); setBusca(""); }}
          style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "1px solid", marginBottom: 10,
            borderColor: !acsSel ? "#1351b4" : "#e5e7eb",
            background: !acsSel ? "#eff6ff" : "transparent", cursor: "pointer" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: !acsSel ? "#1351b4" : "#374151" }}>Todos os ACS</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{todosAcs.length} agentes · todas as equipes</div>
        </button>

        {/* Lista agrupada por equipe (ou filtrada pela busca) */}
        {busca ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {acsVisiveis.map(a => {
              const cor = ESF_COR[a.esf] || "#6b7280";
              const sel = acsSel?.id === a.id;
              return (
                <button key={a.id} onClick={() => setAcsSel({ id: a.id, nome: a.nome, esf: a.esf, microarea: a.microarea })}
                  style={{ textAlign: "left", padding: "7px 10px", borderRadius: 8, border: "1px solid",
                    borderColor: sel ? cor : "transparent",
                    background: sel ? `${cor}15` : "transparent", cursor: "pointer" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{a.nome}</div>
                  <div style={{ fontSize: 10, color: cor, fontWeight: 600 }}>{a.esf} · {a.microarea}</div>
                </button>
              );
            })}
          </div>
        ) : (
          esfsOrdem.filter(esf => porEquipe[esf]).map(esf => {
            const cor = ESF_COR[esf] || "#6b7280";
            return (
              <div key={esf} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: cor, textTransform: "uppercase" as const,
                  letterSpacing: "0.06em", padding: "4px 6px", background: `${cor}12`, borderRadius: 6, marginBottom: 4 }}>
                  {esf} · {porEquipe[esf].length} ACS
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {porEquipe[esf].map(a => {
                    const sel = acsSel?.id === a.id;
                    return (
                      <button key={a.id} onClick={() => setAcsSel({ id: a.id, nome: a.nome, esf: a.esf, microarea: a.microarea })}
                        style={{ textAlign: "left", padding: "6px 10px", borderRadius: 7, border: "1px solid",
                          borderColor: sel ? cor : "transparent",
                          background: sel ? `${cor}18` : "transparent", cursor: "pointer" }}>
                        <div style={{ fontSize: 11, fontWeight: sel ? 700 : 500, color: sel ? cor : "#374151" }}>{a.nome}</div>
                        <div style={{ fontSize: 9, color: "#9ca3af" }}>{a.microarea}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Conteúdo principal */}
      <div>
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Visitas Programadas", val: isLoading ? "…" : totalProg, cor: "#1351b4", bg: "#eff6ff", border: "#bfdbfe" },
            { label: "Visitas Realizadas",  val: isLoading ? "…" : totalReal, cor: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
            { label: "Taxa de Realização",  val: isLoading ? "…" : `${pct}%`,
              cor: pct >= 90 ? "#16a34a" : pct >= 70 ? "#d97706" : "#dc2626",
              bg: pct >= 90 ? "#f0fdf4" : pct >= 70 ? "#fef3c7" : "#fef2f2",
              border: pct >= 90 ? "#bbf7d0" : pct >= 70 ? "#fde68a" : "#fecaca" },
          ].map(k => (
            <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 10, padding: "16px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: k.cor }}>{k.val}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Calendário grid */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Julho/2026 — Calendário de Visitas</div>
            {acsSel && (
              <span style={{ fontSize: 11, background: `${ESF_COR[acsSel.esf] || "#6b7280"}18`,
                color: ESF_COR[acsSel.esf] || "#6b7280", padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>
                {acsSel.nome} · {acsSel.microarea}
              </span>
            )}
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Carregando calendário...</div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
                {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#9ca3af", paddingBottom: 6 }}>{d}</div>
                ))}
                {/* offset: 01/Jul/2026 = Quarta = índice 3 */}
                {Array.from({ length: 3 }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: dias }).map((_, i) => {
                  const dia = i + 1;
                  const d = porDia[dia];
                  if (!d) return (
                    <div key={dia} style={{ aspectRatio: "1", borderRadius: 8, background: "#f9fafb", border: "1px solid #f3f4f6",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#d1d5db" }}>
                      {dia}
                    </div>
                  );
                  const taxa = d.prog > 0 ? Math.round(d.real / d.prog * 100) : 0;
                  const cor = taxa >= 90 ? "#16a34a" : taxa >= 70 ? "#d97706" : "#dc2626";
                  return (
                    <div key={dia} style={{ aspectRatio: "1", borderRadius: 8, background: `${cor}10`, border: `1px solid ${cor}30`,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{dia}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: cor }}>{taxa}%</div>
                      <div style={{ fontSize: 8, color: "#9ca3af" }}>{d.real}/{d.prog}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 10, color: "#9ca3af" }}>
                {[{ cor:"#16a34a", label:"≥90%" },{ cor:"#d97706", label:"70-89%" },{ cor:"#dc2626", label:"<70%" }].map(l => (
                  <span key={l.label} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ width:10, height:10, borderRadius:2, background:l.cor, display:"inline-block" }}/>{l.label} realizado
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Aba Cadastros Individuais ─────────────────────────────────────────────────

function AbaCadastrosIndividuais() {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [pagina, setPagina] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["acs-cad-ind", pagina],
    queryFn: () => apiGet("/api/acs/esus/cadastros-individuais", { pagina }) as Promise<any>,
    staleTime: 120_000,
  });

  const fichas = (data?.dados ?? []).filter((f: any) => {
    if (filtroStatus !== "todos" && f.status_cadastro !== filtroStatus) return false;
    if (busca && !f.nome.toLowerCase().includes(busca.toLowerCase()) && !f.cns.includes(busca)) return false;
    return true;
  });

  if (isLoading) return <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>Carregando cadastros...</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" as const, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, padding: "7px 12px", flex: 1, minWidth: 200 }}>
          <Search size={13} color="#9ca3af" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou CNS..."
            style={{ border: "none", outline: "none", fontSize: 12, flex: 1 }} />
        </div>
        {["todos","completo","parcial","incompleto"].map(s => {
          const cor = s === "completo" ? "#16a34a" : s === "parcial" ? "#d97706" : s === "incompleto" ? "#dc2626" : "#374151";
          return (
            <button key={s} onClick={() => setFiltroStatus(s)}
              style={{ padding: "6px 14px", fontSize: 11, borderRadius: 20, border: `1px solid ${cor}60`, background: filtroStatus === s ? cor : "#fff", color: filtroStatus === s ? "#fff" : cor, cursor: "pointer", fontWeight: 600 }}>
              {s === "todos" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          );
        })}
        <span style={{ fontSize: 12, color: "#9ca3af" }}>{fichas.length} fichas</span>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Nome / CNS","ACS","Microárea","Nascimento","Sexo","Raça/Cor","Condições","Moradia","Status","Completude"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 11, borderBottom: "2px solid #e4e7ec", whiteSpace: "nowrap" as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fichas.slice(0, 50).map((f: any) => {
                const cor = f.status_cadastro === "completo" ? "#16a34a" : f.status_cadastro === "parcial" ? "#d97706" : "#dc2626";
                const conds = Object.entries(f.condicoes_saude || {}).filter(([,v]) => v).map(([k]) => k.replace(/_/g, " "));
                return (
                  <tr key={f.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "9px 12px" }}>
                      <div style={{ fontWeight: 500 }}>{f.nome}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>{f.cns?.slice(0,9)}...</div>
                    </td>
                    <td style={{ padding: "9px 12px", fontSize: 11 }}>{f.acs_nome}</td>
                    <td style={{ padding: "9px 12px" }}><span style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: 5, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{f.microarea}</span></td>
                    <td style={{ padding: "9px 12px", color: "#6b7280", fontSize: 11 }}>{f.data_nascimento}</td>
                    <td style={{ padding: "9px 12px", textAlign: "center" }}>{f.sexo}</td>
                    <td style={{ padding: "9px 12px", fontSize: 11 }}>{f.raca_cor}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
                        {conds.map((c: string) => <span key={c} style={{ background: "#faf5ff", color: "#7c3aed", fontSize: 9, padding: "1px 5px", borderRadius: 4 }}>{c}</span>)}
                        {conds.length === 0 && <span style={{ color: "#d1d5db", fontSize: 10 }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: "9px 12px", fontSize: 11, textTransform: "capitalize" as const, color: "#6b7280" }}>{f.situacao_moradia?.replace(/_/g, " ")}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{ background: `${cor}15`, color: cor, borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700, border: `1px solid ${cor}40` }}>
                        {f.status_cadastro === "completo" ? "✓" : f.status_cadastro === "parcial" ? "⚠" : "✗"} {f.status_cadastro}
                      </span>
                    </td>
                    <td style={{ padding: "9px 12px", minWidth: 90 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Bar pct={f.pct_completo} cor={cor} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: cor, minWidth: 32 }}>{f.pct_completo}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
        <button onClick={() => setPagina(p => Math.max(0, p-1))} disabled={pagina === 0}
          style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 12 }}>← Anterior</button>
        <span style={{ padding: "6px 14px", fontSize: 12, color: "#6b7280" }}>Página {pagina + 1}</span>
        <button onClick={() => setPagina(p => p+1)}
          style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 12 }}>Próxima →</button>
      </div>
    </div>
  );
}

// ── Aba Cadastros Domiciliares ────────────────────────────────────────────────

function AbaCadastrosDomiciliares() {
  const [pagina, setPagina] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["acs-cad-dom", pagina],
    queryFn: () => apiGet("/api/acs/esus/cadastros-domiciliares", { pagina }) as Promise<any>,
    staleTime: 120_000,
  });

  if (isLoading) return <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>Carregando domicílios...</div>;

  const fichas = data?.dados ?? [];

  const resumo = {
    total: data?.total ?? 0,
    completos: fichas.filter((f: any) => f.status_cadastro === "completo").length,
    comAgua: fichas.filter((f: any) => f.abastecimento_agua === "rede_publica").length,
    comEnergia: fichas.filter((f: any) => f.energia_eletrica).length,
    animais: fichas.filter((f: any) => f.animais_domicilio).length,
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Domicílios", val: resumo.total, cor: "#1351b4", bg: "#eff6ff", border: "#bfdbfe" },
          { label: "Completos", val: resumo.completos, cor: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
          { label: "Rede Pública Água", val: resumo.comAgua, cor: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
          { label: "Com Energia Elét.", val: resumo.comEnergia, cor: "#d97706", bg: "#fef3c7", border: "#fde68a" },
          { label: "Animais no Domicílio", val: resumo.animais, cor: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff" },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.cor }}>{k.val}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Logradouro","ACS","Microárea","ESF","Moradores","Tipo Imóvel","Água","Lixo","Energia","Animais","Status"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 11, borderBottom: "2px solid #e4e7ec", whiteSpace: "nowrap" as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fichas.slice(0, 50).map((f: any) => {
                const cor = f.status_cadastro === "completo" ? "#16a34a" : f.status_cadastro === "parcial" ? "#d97706" : "#dc2626";
                return (
                  <tr key={f.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "9px 12px", fontWeight: 500 }}>{f.logradouro}</td>
                    <td style={{ padding: "9px 12px", fontSize: 11 }}>{f.acs_nome}</td>
                    <td style={{ padding: "9px 12px" }}><span style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: 5, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{f.microarea}</span></td>
                    <td style={{ padding: "9px 12px", fontSize: 11, color: ESF_COR[f.esf] || "#374151", fontWeight: 600 }}>{f.esf}</td>
                    <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 700, color: "#374151" }}>{f.moradores}</td>
                    <td style={{ padding: "9px 12px", fontSize: 11, textTransform: "capitalize" as const, color: "#6b7280" }}>{f.tipo_moradia}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{ fontSize: 10, color: f.abastecimento_agua === "rede_publica" ? "#16a34a" : "#dc2626" }}>
                        {f.abastecimento_agua === "rede_publica" ? "✓ Rede" : f.abastecimento_agua?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "9px 12px", fontSize: 11, color: f.destino_lixo === "coletado" ? "#16a34a" : "#dc2626", textTransform: "capitalize" as const }}>{f.destino_lixo?.replace(/_/g, " ")}</td>
                    <td style={{ padding: "9px 12px", textAlign: "center" }}>{f.energia_eletrica ? "✓" : <span style={{ color: "#dc2626" }}>✗</span>}</td>
                    <td style={{ padding: "9px 12px", textAlign: "center" }}>{f.animais_domicilio ? "Sim" : "—"}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{ background: `${cor}15`, color: cor, borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700 }}>
                        {f.status_cadastro}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
        <button onClick={() => setPagina(p => Math.max(0, p-1))} disabled={pagina === 0}
          style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 12 }}>← Anterior</button>
        <span style={{ padding: "6px 14px", fontSize: 12, color: "#6b7280" }}>Página {pagina + 1}</span>
        <button onClick={() => setPagina(p => p+1)}
          style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 12 }}>Próxima →</button>
      </div>
    </div>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────

// Rotas do menu lateral que já têm uma aba correspondente aqui dentro.
// "Cadastros do Cidadão" (/acs/cadastros-cid) e "Visitas Domiciliares Cidadão"
// (/acs/visitas-cidadao) ainda não têm conteúdo próprio — por isso não estão
// neste mapa (cairiam incorretamente numa aba errada em vez de ficarem no
// Dashboard, que é o comportamento honesto até essas telas existirem).
const ROTA_PARA_ABA: Record<string, Aba> = {
  "/acs/painel": "dashboard",
  "/acs/calendario": "calendario",
  "/acs/cadastros-ind": "cadastros_ind",
  "/acs/cadastros-dom": "cadastros_dom",
};

export default function ACSPainel() {
  const location = useLocation();
  const [aba, setAba] = useState<Aba>(() => ROTA_PARA_ABA[location.pathname] ?? "dashboard");
  const [esfFiltro, setEsfFiltro] = useState("Todas");
  const [statusFiltro, setStatusFiltro] = useState("Todos");

  // O catch-all "/acs/*" mantém este mesmo componente montado ao navegar entre
  // os links do menu — sem isto, trocar de link não muda nada na tela (o bug
  // relatado como "sistema travado").
  useEffect(() => {
    const nova = ROTA_PARA_ABA[location.pathname];
    if (nova) setAba(nova);
  }, [location.pathname]);

  const { data: dash, isLoading, refetch } = useQuery<DashboardAcs>({
    queryKey: ["acs-dashboard"],
    queryFn: () => apiGet("/api/acs/dashboard") as Promise<DashboardAcs>,
    staleTime: 60_000,
  });

  const { data: listaData } = useQuery({
    queryKey: ["acs-lista", esfFiltro],
    queryFn: () => apiGet("/api/acs/lista", esfFiltro !== "Todas" ? { esf: esfFiltro } : undefined) as Promise<any>,
    staleTime: 60_000,
  });

  const { data: maData } = useQuery({
    queryKey: ["acs-microareas"],
    queryFn: () => apiGet("/api/acs/microareas") as Promise<any>,
    staleTime: 60_000,
  });

  const { data: esusStatus } = useQuery<EsusStatus>({
    queryKey: ["esus-status"],
    queryFn: () => apiGet("/api/acs/esus/status") as Promise<EsusStatus>,
    staleTime: 300_000,
    retry: false,
  });

  const k = dash?.kpis;
  const acsListaFiltrada = ((listaData?.acs ?? []) as AcsItem[]).filter(a =>
    statusFiltro === "Todos" || a.status === statusFiltro
  );

  const ABAS = [
    { id: "dashboard" as Aba,       label: "Dashboard",            icon: <BarChart2 size={13} /> },
    { id: "visitas" as Aba,         label: "Visitas",              icon: <Home size={13} /> },
    { id: "calendario" as Aba,      label: "Calendário",           icon: <Calendar size={13} /> },
    { id: "cadastros_ind" as Aba,   label: "Cadastros Individuais", icon: <User size={13} /> },
    { id: "cadastros_dom" as Aba,   label: "Cadastros Domiciliares", icon: <Building2 size={13} /> },
    { id: "lista" as Aba,           label: "Lista de ACS",         icon: <Users size={13} /> },
    { id: "microareas" as Aba,      label: "Microáreas",           icon: <MapPin size={13} /> },
    { id: "geo" as Aba,             label: "Tempo Real",           icon: <Navigation size={13} /> },
  ];

  const corPec = esusStatus?.conectado ? (esusStatus.autenticado ? "#16a34a" : "#d97706") : "#dc2626";
  const bgPec  = esusStatus?.conectado ? (esusStatus.autenticado ? "#f0fdf4" : "#fef3c7") : "#fef2f2";

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>

      {/* Header InvestSUS */}
      <div style={{ background: "linear-gradient(135deg,#1351b4 0%,#0c3d8a 100%)", padding: "18px 28px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: 6 }}>
                <Users size={18} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Painel ACS</span>
              <span style={{ background: "rgba(255,255,255,0.15)", color: "#bfdbfe", borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                {dash?.mes_referencia?.label ?? "Julho/2026"}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#bfdbfe" }}>
              Agentes Comunitários de Saúde · Apuí/AM · 65 ACS · 65 Microáreas
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Status eSUS PEC */}
            <div style={{ background: bgPec, border: `1px solid ${corPec}40`, borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              {esusStatus?.conectado ? <Wifi size={14} color={corPec} /> : <WifiOff size={14} color={corPec} />}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: corPec }}>
                  eSUS PEC · {esusStatus?.conectado ? (esusStatus.autenticado ? "Conectado" : "Sem autenticação") : "Offline"}
                </div>
                <div style={{ fontSize: 9, color: "#6b7280" }}>
                  {esusStatus?.conectado ? `v${esusStatus.versao || "—"}` : "Dados de referência em uso"}
                </div>
              </div>
            </div>
            <button onClick={() => refetch()}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              <RefreshCw size={13} /> Atualizar
            </button>
          </div>
        </div>

        {/* Abas */}
        <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", border: "none",
                borderBottom: aba === a.id ? "3px solid #fff" : "3px solid transparent",
                background: "transparent", color: aba === a.id ? "#fff" : "rgba(255,255,255,0.6)",
                fontWeight: aba === a.id ? 700 : 400, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" as const, marginBottom: -1 }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 28px 60px" }}>

        {isLoading && <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando painel ACS...</div>}

        {/* ── Dashboard ── */}
        {aba === "dashboard" && k && (
          <div>
            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
              <KpiCard icon={<Users size={18}/>}       label="ACS Ativos"           val={`${k.acs_ativos}/${k.total_acs}`} sub={`${k.total_microareas} microáreas`}          cor="#1351b4" bg="#eff6ff" border="#bfdbfe" />
              <KpiCard icon={<Home size={18}/>}         label="Cobertura Familiar"   val={`${k.pct_cobertura}%`}             sub={`${k.familias_cadastradas.toLocaleString("pt-BR")} famílias`} cor="#16a34a" bg="#f0fdf4" border="#bbf7d0" />
              <KpiCard icon={<CheckCircle size={18}/>} label="Visitas Realizadas"   val={`${k.pct_visitas}%`}               sub={`${k.visitas_realizadas}/${k.visitas_programadas} programadas`} cor={k.pct_visitas>=90?"#16a34a":k.pct_visitas>=70?"#d97706":"#dc2626"} bg={k.pct_visitas>=90?"#f0fdf4":k.pct_visitas>=70?"#fef3c7":"#fef2f2"} border={k.pct_visitas>=90?"#bbf7d0":k.pct_visitas>=70?"#fde68a":"#fecaca"} />
              <KpiCard icon={<Activity size={18}/>}    label="Grupos Prioritários"  val={k.gestantes_ativas + k.criancas_lt2} sub={`${k.gestantes_ativas} gest. · ${k.criancas_lt2} <2a`} cor="#7c3aed" bg="#faf5ff" border="#e9d5ff" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 22 }}>
              {/* Distribuição ESF */}
              <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Distribuição por Equipe ESF</div>
                {Object.entries(dash!.distribuicao_esf).map(([esf, n]) => {
                  const cor = ESF_COR[esf] || "#6b7280";
                  return (
                    <div key={esf} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{esf}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: cor }}>{n} ACS</span>
                      </div>
                      <Bar pct={(n / k.acs_ativos) * 100} cor={cor} height={8} />
                    </div>
                  );
                })}
              </div>

              {/* Grupos prioritários */}
              <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Grupos Prioritários Acompanhados</div>
                {[
                  { label: "Gestantes ativas",  val: k.gestantes_ativas, cor: "#7c3aed", icon: <Baby size={16}/> },
                  { label: "Crianças < 2 anos", val: k.criancas_lt2,     cor: "#0891b2", icon: <Baby size={16}/> },
                  { label: "HAS acompanhados",  val: k.has_acompanhados, cor: "#d97706", icon: <Heart size={16}/> },
                  { label: "DM acompanhados",   val: k.dm_acompanhados,  cor: "#dc2626", icon: <Activity size={16}/> },
                ].map(g => (
                  <div key={g.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ color: g.cor }}>{g.icon}</div>
                      <span style={{ fontSize: 13, color: "#374151" }}>{g.label}</span>
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 800, color: g.cor }}>{g.val}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>Total grupos</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#1351b4" }}>
                    {k.gestantes_ativas + k.criancas_lt2 + k.has_acompanhados + k.dm_acompanhados}
                  </span>
                </div>
              </div>
            </div>

            {/* Destaques e atenção */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              {dash!.acs_destaques.length > 0 && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <Star size={15} color="#16a34a" /> ACS Destaque do Mês
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {dash!.acs_destaques.map(a => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fff", borderRadius: 10, border: "1px solid #bbf7d0", borderLeft: "4px solid #16a34a" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{a.nome}</div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>{a.microarea} · {a.esf}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>{a.pct_visitas}% visitas</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>{a.familias_cadastradas} fam.</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {dash!.acs_criticos.length > 0 && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={15} color="#dc2626" /> Necessitam Atenção
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {dash!.acs_criticos.map(a => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fff", borderRadius: 10, border: "1px solid #fecaca", borderLeft: "4px solid #dc2626" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{a.nome}</div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>{a.microarea} · {a.esf}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#dc2626" }}>{a.pct_visitas}% visitas</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>{a.pct_cadastro}% cad.</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Visitas ── */}
        {aba === "visitas" && <AbaVisitas fonte={esusStatus?.autenticado ? "esus_pec" : "referencia"} />}

        {/* ── Calendário ── */}
        {aba === "calendario" && <AbaCalendario />}

        {/* ── Cadastros Individuais ── */}
        {aba === "cadastros_ind" && <AbaCadastrosIndividuais />}

        {/* ── Cadastros Domiciliares ── */}
        {aba === "cadastros_dom" && <AbaCadastrosDomiciliares />}

        {/* ── Lista ACS ── */}
        {aba === "lista" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" as const, alignItems: "center" }}>
              {["Todas","ESF I","ESF II","ESF III","ESF IV","ESF V"].map(e => (
                <button key={e} onClick={() => setEsfFiltro(e)}
                  style={{ padding: "6px 14px", fontSize: 12, borderRadius: 20, border: "1px solid #d1d5db", background: esfFiltro === e ? "#1351b4" : "#fff", color: esfFiltro === e ? "#fff" : "#374151", cursor: "pointer", fontWeight: esfFiltro === e ? 700 : 400 }}>
                  {e}
                </button>
              ))}
              <div style={{ width: 1, height: 20, background: "#e5e7eb" }} />
              {["Todos","destaque","regular","critico","afastado"].map(s => {
                const cor = s === "Todos" ? "#374151" : STATUS_COR[s];
                return (
                  <button key={s} onClick={() => setStatusFiltro(s)}
                    style={{ padding: "6px 14px", fontSize: 12, borderRadius: 20, border: `1px solid ${cor}60`, background: statusFiltro === s ? cor : "#fff", color: statusFiltro === s ? "#fff" : cor, cursor: "pointer", fontWeight: statusFiltro === s ? 700 : 400 }}>
                    {s === "Todos" ? "Todos" : STATUS_LABEL[s]}
                  </button>
                );
              })}
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>{acsListaFiltrada.length} ACS</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {acsListaFiltrada.map(a => <AcsCard key={a.id} a={a} />)}
            </div>
          </div>
        )}

        {/* ── Microáreas ── */}
        {aba === "microareas" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12 }}>
              {(maData?.microareas ?? []).map((ma: Microarea) => {
                const cor = SEM_COR[ma.semaforo];
                return (
                  <div key={ma.codigo} style={{ background: "#fff", border: `1px solid ${cor}30`, borderTop: `4px solid ${cor}`, borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{ma.codigo}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{ma.nome}</div>
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>{ma.zona === "urbana" ? "🏙 Urbana" : "🌲 Rural"} · {ma.esf}</div>
                      </div>
                      <div style={{ background: `${cor}18`, color: cor, fontSize: 14, fontWeight: 800, padding: "4px 10px", borderRadius: 8 }}>{ma.pct_cobertura}%</div>
                    </div>
                    <Bar pct={ma.pct_cobertura} cor={cor} height={8} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
                      <span>{ma.familias_cadastradas}/{ma.familias_meta} fam. · {ma.pct_visitas}% vis.</span>
                      {ma.gestantes_ativas > 0 && <span style={{ color: "#7c3aed" }}>♀ {ma.gestantes_ativas}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 16, fontSize: 11, color: "#9ca3af" }}>
              {[{cor:"#16a34a",l:"≥90%"},{cor:"#d97706",l:"70-89%"},{cor:"#dc2626",l:"<70%"}].map(x => (
                <span key={x.l} style={{ display:"flex",alignItems:"center",gap:4 }}><span style={{ width:10,height:10,borderRadius:2,background:x.cor,display:"inline-block" }}/>{x.l} cobertura</span>
              ))}
            </div>
          </div>
        )}

        {/* ── Geo ── */}
        {aba === "geo" && (
          <div style={{ margin: "-24px -28px", minHeight: 640 }}>
            <ACSGeoPage />
          </div>
        )}
      </div>
    </div>
  );
}
