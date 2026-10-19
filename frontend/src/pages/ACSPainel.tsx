// src/pages/ACSPainel.tsx — Painel ACS · eSUS PEC integrado
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users, MapPin, Home, CheckCircle, Activity, Baby, Heart,
  Star, AlertTriangle, RefreshCw, ChevronDown, ChevronRight,
  User, FileText, Search, Filter, Calendar, Wifi, WifiOff,
  BarChart2, Navigation, ClipboardList, Building2, TrendingUp,
} from "lucide-react";
import { apiGet, apiGetRaw } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import ACSGeoPage from "./ACSGeoPage";

// ── Tipos ────────────────────────────────────────────────────────────────────

interface AcsItem {
  id: number; nome: string; microarea: string; equipe: string; tipo: string; ativo: boolean;
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
  distribuicao_equipe: Record<string, number>;
  distribuicao_esf: Record<string, number>;
  mes_referencia: { label: string };
  producao_esus?: {
    competencia: string; visitas_domiciliares: number;
    atendimentos_individuais: number; atendimentos_odontologicos: number; procedimentos: number;
  } | null;
}

interface Microarea {
  codigo: string; nome: string; zona: string; equipe: string; tipo: string;
  acs_count: number; acs_ativos: number;
  familias_cadastradas: number; familias_meta: number;
  pct_cobertura: number; pct_visitas: number; gestantes_ativas: number;
  semaforo: "verde" | "amarelo" | "vermelho";
}

interface EsusStatus { conectado: boolean; autenticado: boolean; url: string; versao: string | null; instancia?: string | null; municipio?: string | null }

type Aba = "dashboard" | "visitas" | "calendario" | "cadastros_ind" | "cadastros_dom" | "lista" | "microareas" | "geo" | "sis" | "capturar";

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COR: Record<string, string> = { destaque:"#16a34a", regular:"#1351b4", critico:"#dc2626", afastado:"#9ca3af", ativo:"#1351b4", inativo:"#9ca3af" };
const STATUS_LABEL: Record<string, string> = { destaque:"Destaque", regular:"Regular", critico:"Atenção", afastado:"Afastado", ativo:"Ativo", inativo:"Sem lotação ativa" };
const SEM_COR: Record<string, string> = { verde:"#16a34a", amarelo:"#d97706", vermelho:"#dc2626", sem_dado:"#94a3b8" };
const EQUIPE_COR: Record<string, string> = {
  "KENNEDY":"#0891b2","JK":"#7c3aed","ACARI":"#059669","JUMA":"#d97706",
  "ESTRADA NOVA":"#dc2626","LIBERDADE":"#db2777","SÃO SEBASTIÃO":"#2563eb",
  "CACHOEIRA":"#16a34a","TRÊS ESTADOS":"#9333ea","AREAL":"#0369a1",
};
const TIPO_COR: Record<string, string> = { "eSF":"#1351b4","eRibeirinha":"#0891b2" };
// Legacy alias for compat
const ESF_COR = EQUIPE_COR;

function Bar({ pct, cor, height = 6 }: { pct: number; cor: string; height?: number }) {
  return (
    <div style={{ height, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct ?? 0, 100)}%`, height: "100%", background: cor, borderRadius: 4, transition: "width .4s" }} />
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
        <span style={{ fontSize: 12, color: "#374151" }}>{label}</span>
        <div style={{ background: `${cor}18`, borderRadius: 7, padding: 6, color: cor }}>{icon}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: cor, lineHeight: 1 }}>{val}</div>
      {sub && <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Card ACS ─────────────────────────────────────────────────────────────────

function AcsCard({ a }: { a: AcsItem }) {
  const [open, setOpen] = useState(false);
  const cor = STATUS_COR[a.status] ?? "#1351b4";
  const corVis = a.pct_visitas == null ? "#94a3b8" : a.pct_visitas >= 90 ? "#16a34a" : a.pct_visitas >= 70 ? "#d97706" : "#dc2626";
  const corCad = a.pct_cadastro == null ? "#94a3b8" : a.pct_cadastro >= 90 ? "#16a34a" : "#d97706";

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
          <div style={{ fontSize: 11, color: "#4b5563" }}>{a.microarea} · {a.equipe} · {fmtN(a.familias_cadastradas)} famílias</div>
        </div>
        <div style={{ display: "flex", gap: 18, alignItems: "center", flexShrink: 0 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: corVis }}>{a.pct_visitas == null ? "—" : `${a.pct_visitas}%`}</div>
            <div style={{ fontSize: 10, color: "#4b5563" }}>famílias visitadas</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: corCad }}>{fmtN(a.visitas?.realizadas)}</div>
            <div style={{ fontSize: 10, color: "#4b5563" }}>visitas realizadas</div>
          </div>
          {open ? <ChevronDown size={14} color="#9ca3af" /> : <ChevronRight size={14} color="#9ca3af" />}
        </div>
      </div>

      {open && (
        <div style={{ padding: "12px 16px 16px", borderTop: `1px solid ${cor}20`, background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: "#374151", marginBottom: 5 }}>
                Visitas realizadas — {fmtN(a.visitas.realizadas)} · famílias visitadas {a.pct_visitas == null ? "—" : `${a.pct_visitas}%`}
              </div>
              <Bar pct={a.pct_visitas} cor={corVis} height={8} />
              <div style={{ fontSize: 10, color: "#4b5563", marginTop: 4 }}>
                {fmtN(a.visitas.nao_encontradas)} ausentes · {fmtN(a.visitas.recusas)} recusas
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#374151", marginBottom: 5 }}>
                Famílias cadastradas — {fmtN(a.familias_cadastradas)} · visitadas no período {fmtN((a as any).familias_visitadas)}
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
                <div style={{ fontSize: 18, fontWeight: 800, color: k.cor }}>{fmtN(k.val)}</div>
                <div style={{ fontSize: 10, color: "#4b5563" }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Aba Visitas ───────────────────────────────────────────────────────────────

function AbaVisitas({ fonte, periodTipo, competencia: compProp, dataFiltro, anoFiltro }: {
  fonte: string; periodTipo: string; competencia: string; dataFiltro: string; anoFiltro: string;
}) {
  const params = useMemo(() => {
    if (periodTipo === "diario")  return { periodo: "diario",  data: dataFiltro };
    if (periodTipo === "anual")   return { periodo: "anual",   ano: anoFiltro };
    return { periodo: "mensal", competencia: compProp };
  }, [periodTipo, compProp, dataFiltro, anoFiltro]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["acs-visitas", params],
    queryFn: () => apiGetRaw("/api/acs/esus/visitas", params) as Promise<any>,
    staleTime: 120_000,
  });

  if (isLoading) return <div style={{ padding: 48, textAlign: "center", color: "#4b5563" }}>Carregando visitas...</div>;

  if (isError) return <OfflineBanner emoji="⚠️" titulo="Não foi possível conectar ao servidor"
    nota="Verifique a conexão com a API ou tente novamente em instantes." />;

  const prod = data?.dados;
  if (!prod) return (
    <div style={{ padding: 32, textAlign: "center" as const, color: "#374151", background: "#f8fafc", borderRadius: 10, border: "1px solid #e4e7ec" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#374151", marginBottom: 4 }}>Aguardando dados do e-SUS PEC</div>
      <div style={{ fontSize: 12 }}>{data?.nota ?? "Aguardando os dados do e-SUS PEC pelo agente local — veja a aba Capturar PEC."}</div>
    </div>
  );

  const isPec    = prod.fonte === "esus_pec";
  const compLabel = prod.periodo_label ?? prod.competencia ?? "—";

  const bannerBg    = isPec ? "#f0fdf4" : "#eff6ff";
  const bannerBd    = isPec ? "#bbf7d0" : "#bfdbfe";
  const bannerTxt   = isPec ? "#15803d" : "#1d4ed8";
  const bannerEmoji = isPec ? "✅" : "📋";
  const bannerMsg   = isPec ? `e-SUS PEC · agente local · competência ${prod.competencia ?? "—"}` : "Aguardando dados do e-SUS PEC";

  const cardsTop = [
    { label: "Visitas realizadas",          val: prod.visitas_domiciliares ?? null,  cor: "#1351b4", bg: "#eff6ff", border: "#bfdbfe" },
    { label: "Fichas de visita registradas", val: prod.visitas_registradas ?? null, cor: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
    { label: "Ausentes / não encontrados",  val: prod.nao_encontradas ?? null,       cor: "#d97706", bg: "#fef3c7", border: "#fde68a" },
    { label: "Recusas",                     val: prod.recusas ?? null,               cor: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
    { label: "ACS ativos",                  val: prod.acs_ativos ?? null,            cor: "#0891b2", bg: "#f0f9ff", border: "#bae6fd" },
  ];

  return (
    <div>
      {/* Banner fonte */}
      <div style={{ background: bannerBg, border: `1px solid ${bannerBd}`, borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>{bannerEmoji}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: bannerTxt }}>{bannerMsg}</span>
        <span style={{ fontSize: 12, color: "#374151", marginLeft: 8 }}>Período: {compLabel}</span>

      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {cardsTop.map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "18px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: c.cor, fontVariantNumeric: "tabular-nums" }}>
              {typeof c.val === "number" ? c.val.toLocaleString("pt-BR") : (c.val ?? "—")}
            </div>
            <div style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Visitas por equipe (e-SUS PEC, via agente) */}
      {Array.isArray(prod.por_equipe) && prod.por_equipe.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", fontWeight: 700, fontSize: 13 }}>Visitas por equipe</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Equipe","Realizadas","Fichas registradas"].map(h => (
                  <th key={h} style={{ padding: "8px 14px", fontSize: 11, fontWeight: 600, color: "#374151", textAlign: h === "Equipe" ? "left" : "right" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prod.por_equipe.map((eq: any) => (
                <tr key={eq.equipe} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 14px", fontSize: 12, fontWeight: 600 }}>{eq.equipe}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, textAlign: "right", color: "#1351b4", fontWeight: 700 }}>{fmtN(eq.realizadas)}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, textAlign: "right", color: "#374151" }}>{fmtN(eq.registradas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 11, color: "#4b5563" }}>
        Fonte: {isPec ? "e-SUS PEC (agente local, dados agregados)" : "aguardando integração"} · Período: {compLabel}
      </div>
    </div>
  );
}

// ── Aba Calendário ────────────────────────────────────────────────────────────

function AbaCalendario() {
  const [acsSel, setAcsSel] = useState<{ id: number; nome: string; equipe: string; tipo: string; microarea: string } | null>(null);
  const [busca, setBusca] = useState("");

  // Lista de todos os ACS
  const { data: listaData } = useQuery({
    queryKey: ["acs-lista-calendario"],
    queryFn: () => apiGetRaw("/api/acs/lista") as Promise<any>,
    staleTime: 300_000,
  });

  const todosAcs: AcsItem[] = listaData?.acs ?? [];

  // Calendário do eSUS PEC (dados reais)
  const { data, isLoading } = useQuery({
    queryKey: ["acs-calendario-esus"],
    queryFn: () => apiGetRaw("/api/acs/esus/calendario-visitas") as Promise<any>,
    staleTime: 120_000,
  });

  const fonte   = data?.fonte ?? "offline";
  const eventos = data?.eventos ?? [];
  const dias    = data?.dias ?? 31;

  // Agrupar por dia
  const porDia: Record<number, { prog: number; real: number }> = {};
  eventos.forEach((e: any) => {
    if (!porDia[e.dia]) porDia[e.dia] = { prog: 0, real: 0 };
    porDia[e.dia].prog += e.programadas;
    porDia[e.dia].real += e.realizadas;
  });

  const totalProg = Object.values(porDia).reduce((s, d) => s + d.prog, 0) || (fonte === "offline" ? 0 : 0);
  const totalReal = Object.values(porDia).reduce((s, d) => s + d.real, 0) || (data?.total_visitas ?? 0);
  const pct = totalProg > 0 ? Math.round(totalReal / totalProg * 100) : 0;

  // Agrupar ACS por equipe para o painel lateral
  const porEquipe: Record<string, AcsItem[]> = {};
  todosAcs.forEach((a: AcsItem) => {
    if (!porEquipe[a.equipe]) porEquipe[a.equipe] = [];
    porEquipe[a.equipe].push(a);
  });
  const esfsOrdem = ["KENNEDY","JK","ACARI","JUMA","ESTRADA NOVA","LIBERDADE","SÃO SEBASTIÃO","CACHOEIRA","TRÊS ESTADOS","AREAL"];
  const acsVisiveis = todosAcs.filter(a =>
    !busca || a.nome.toLowerCase().includes(busca.toLowerCase()) || a.microarea.toLowerCase().includes(busca.toLowerCase())
  );

  const titulo = acsSel
    ? `${acsSel.nome} · ${acsSel.microarea} · ${acsSel.equipe}`
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
          <div style={{ fontSize: 10, color: "#4b5563" }}>{todosAcs.length} agentes · todas as equipes</div>
        </button>

        {/* Lista agrupada por equipe (ou filtrada pela busca) */}
        {busca ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {acsVisiveis.map(a => {
              const cor = ESF_COR[a.equipe] || "#6b7280";
              const sel = acsSel?.id === a.id;
              return (
                <button key={a.id} onClick={() => setAcsSel({ id: a.id, nome: a.nome, equipe: a.equipe, tipo: a.tipo, microarea: a.microarea })}
                  style={{ textAlign: "left", padding: "7px 10px", borderRadius: 8, border: "1px solid",
                    borderColor: sel ? cor : "transparent",
                    background: sel ? `${cor}15` : "transparent", cursor: "pointer" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{a.nome}</div>
                  <div style={{ fontSize: 10, color: cor, fontWeight: 600 }}><span style={{ background: TIPO_COR[a.tipo] || "#6b7280", color:"#fff", borderRadius:4, padding:"0 5px", fontSize:9, marginRight:4 }}>{a.tipo}</span>{a.microarea}</div>
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
                      <button key={a.id} onClick={() => setAcsSel({ id: a.id, nome: a.nome, equipe: a.equipe, tipo: a.tipo, microarea: a.microarea })}
                        style={{ textAlign: "left", padding: "6px 10px", borderRadius: 7, border: "1px solid",
                          borderColor: sel ? cor : "transparent",
                          background: sel ? `${cor}18` : "transparent", cursor: "pointer" }}>
                        <div style={{ fontSize: 11, fontWeight: sel ? 700 : 500, color: sel ? cor : "#374151" }}>{a.nome}</div>
                        <div style={{ fontSize: 9, color: "#4b5563" }}>{a.microarea}</div>
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
              <div style={{ fontSize: 12, color: "#374151" }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Calendário grid */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Julho/2026 — Calendário de Visitas</div>
            {acsSel && (
              <span style={{ fontSize: 11, background: `${ESF_COR[acsSel.equipe] || "#6b7280"}18`,
                color: ESF_COR[acsSel.equipe] || "#6b7280", padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>
                {acsSel.nome} · {acsSel.microarea}
              </span>
            )}
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#4b5563" }}>Carregando calendário...</div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
                {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#4b5563", paddingBottom: 6 }}>{d}</div>
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
                      <div style={{ fontSize: 8, color: "#4b5563" }}>{d.real}/{d.prog}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 10, color: "#4b5563" }}>
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

// ── Banner offline ────────────────────────────────────────────────────────────
function OfflineBanner({ emoji, titulo, nota }: { emoji: string; titulo: string; nota?: string }) {
  return (
    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{emoji}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#b91c1c", marginBottom: 8 }}>{titulo}</div>
      <div style={{ fontSize: 13, color: "#374151" }}>{nota ?? "Configure ESUS_USUARIO e ESUS_SENHA no Railway para exibir dados em tempo real."}</div>
    </div>
  );
}

function ConectadoBanner({ texto }: { texto: string }) {
  return (
    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 16 }}>✅</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>e-SUS PEC conectado</span>
      {texto && <span style={{ fontSize: 12, color: "#374151", marginLeft: 8 }}>{texto}</span>}
    </div>
  );
}

// ── Aba Cadastros Individuais ─────────────────────────────────────────────────

function TabelaCadastros({ titulo, rota, colunas }: { titulo: string; rota: string; colunas: [string, string][] }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["acs-cad", rota],
    queryFn: () => apiGetRaw(rota) as Promise<any>,
    staleTime: 120_000,
  });
  if (isLoading) return <div style={{ padding: 48, textAlign: "center", color: "#4b5563" }}>Carregando...</div>;
  if (isError) return <OfflineBanner emoji="⚠️" titulo="Não foi possível conectar ao servidor"
    nota="Verifique a conexão com a API ou tente novamente em instantes." />;
  if (data?.fonte !== "esus_pec") return <NaoDisponivelBanner titulo="Aguardando dados do e-SUS PEC" rodape={null} nota={data?.nota ?? "Aguardando os dados do e-SUS PEC pelo agente local."} />;
  const linhas: any[] = data?.por_microarea ?? [];
  return (
    <div>
      <ConectadoBanner texto={`${titulo}: ${fmtN(data?.total)} · competência ${data?.competencia ?? "—"}`} />
      <div style={{ fontSize: 12, color: "#374151", marginBottom: 12 }}>
        Por minimização de dados (LGPD), o ERSUS360 recebe só contagens por equipe e microárea. A ficha de cada
        cidadão continua no e-SUS PEC, acessível a quem tem perfil para isso.
      </div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e4e7ec", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
              {["Equipe", "Microárea", ...colunas.map(c => c[1])].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left" as const, fontWeight: 700, color: "#374151" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 ? (
              <tr><td colSpan={2 + colunas.length} style={{ padding: 32, textAlign: "center", color: "#4b5563" }}>Sem detalhamento por microárea neste envio</td></tr>
            ) : linhas.map((l: any, i: number) => (
              <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "9px 14px", color: "#1351b4", fontWeight: 600 }}>{l.equipe ?? "—"}</td>
                <td style={{ padding: "9px 14px" }}>{l.microarea ?? "—"}</td>
                {colunas.map(([k]) => <td key={k} style={{ padding: "9px 14px" }}>{k.startsWith("pct") ? (l[k] == null ? "—" : `${l[k]}%`) : fmtN(l[k])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Aba Cadastros Individuais ─────────────────────────────────────────────────

function AbaCadastrosIndividuais() {
  return <TabelaCadastros titulo="Cadastros individuais" rota="/api/acs/esus/cadastros-individuais"
    colunas={[["individuos", "Indivíduos cadastrados"]]} />;
}

// ── Aba Cadastros Domiciliares ────────────────────────────────────────────────

function AbaCadastrosDomiciliares() {
  return <TabelaCadastros titulo="Domicílios cadastrados" rota="/api/acs/esus/cadastros-domiciliares"
    colunas={[["domicilios", "Domicílios"], ["familias", "Famílias"], ["pct_familias_visitadas", "Famílias visitadas no período"]]} />;
}

// ── Aba Lista ACS com dados eSUS PEC ─────────────────────────────────────────

function AbaListaAcs({ acsRef }: { acsRef: AcsItem[] }) {
  const [busca, setBusca]   = useState("");
  const [filtroEq, setFiltroEq] = useState("Todas");

  const { data: esusAcs } = useQuery({
    queryKey: ["esus-acs"],
    queryFn: () => apiGetRaw("/api/acs/esus/acs") as Promise<any>,
    staleTime: 300_000,
    retry: false,
  });

  const conectado = esusAcs?.fonte === "esus_pec";
  const acsList: any[] = acsRef;

  const equipes = ["Todas", ...Array.from(new Set(acsList.map((a: any) => a.equipe ?? a.equipe).filter(Boolean))) as string[]];

  const filtrado = acsList.filter((a: any) => {
    const okBusca = !busca || (a.nome ?? "").toLowerCase().includes(busca.toLowerCase()) || (a.cns ?? "").includes(busca);
    const okEq    = filtroEq === "Todas" || a.equipe === filtroEq;
    return okBusca && okEq;
  });

  return (
    <div>
      {conectado && <ConectadoBanner texto={`${esusAcs?.total ?? 0} ACS no e-SUS PEC · CBO 515105`} />}
      {!conectado && (
        <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
          Aguardando os dados do e-SUS PEC pelo agente local — veja a aba Capturar PEC.
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" as const, alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px" }}>
          <Search size={14} color="#9ca3af" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar ACS por nome ou CNS..."
            style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent" }} />
        </div>
        <select value={filtroEq} onChange={e => setFiltroEq(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, background: "#fff" }}>
          {equipes.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <span style={{ fontSize: 12, color: "#4b5563" }}>{filtrado.length} ACS</span>
      </div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e4e7ec", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
              {["Nome","CNS","CBO","Unidade","Equipe","INE"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left" as const, fontWeight: 700, color: "#374151" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrado.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#4b5563" }}>Nenhum ACS encontrado</td></tr>
            ) : filtrado.map((a: any, i: number) => {
              const cor = ESF_COR[a.equipe ?? ""] || "#6b7280";
              return (
                <tr key={a.id ?? a.cns ?? i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "9px 14px", fontWeight: 600 }}>{a.nome}</td>
                  <td style={{ padding: "9px 14px", fontFamily: "monospace", color: "#374151" }}>{a.cns ?? "—"}</td>
                  <td style={{ padding: "9px 14px", color: "#374151", fontSize: 11 }}>{a.cbo ?? "ACS"}</td>
                  <td style={{ padding: "9px 14px", color: "#374151" }}>{a.unidade ?? "—"}</td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{ background: `${cor}15`, color: cor, padding: "2px 8px", borderRadius: 6, fontWeight: 700, fontSize: 11 }}>{a.equipe ?? "—"}</span>
                  </td>
                  <td style={{ padding: "9px 14px", fontFamily: "monospace", color: "#4b5563", fontSize: 10 }}>{a.ine ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: "#4b5563", marginTop: 10 }}>
        Fonte: {conectado ? "e-SUS PEC (agente local, dados agregados)" : "aguardando integração"}
      </div>
    </div>
  );
}

// ── Aba Microáreas com dados eSUS PEC ─────────────────────────────────────────

function AbaMicroareas({ maRef }: { maRef: any[] }) {
  const { data: terr } = useQuery({
    queryKey: ["esus-territorios"],
    queryFn: () => apiGetRaw("/api/acs/esus/territorios") as Promise<any>,
    staleTime: 300_000,
    retry: false,
  });

  const conectado = terr?.fonte === "esus_pec";
  const microareas = maRef; // microáreas do último lote do agente (vazio até o primeiro envio)

  return (
    <div>
      {conectado && <ConectadoBanner texto={`${terr?.dados?.total ?? 0} territórios no e-SUS PEC`} />}
      {!conectado && (
        <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
          Aguardando os dados do e-SUS PEC pelo agente local — veja a aba Capturar PEC.
        </div>
      )}

      {/* Se eSUS conectado, mostra territórios reais */}
      {conectado && terr?.dados?.territorios?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#1351b4" }}>📍 Territórios / Equipes — e-SUS PEC</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12, marginBottom: 16 }}>
            {(terr.dados.territorios as any[]).map((t: any, i: number) => (
              <div key={t.ine ?? i} style={{ background: "#fff", border: "1px solid #bfdbfe", borderTop: "4px solid #1351b4", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t.nome || `Equipe ${i+1}`}</div>
                <div style={{ fontSize: 11, color: "#374151", marginBottom: 8 }}>INE: {t.ine ?? "—"} · {t.tipo}</div>
                <div style={{ fontSize: 12, color: "#374151" }}>Unidade: {t.unidade ?? "—"}</div>
                <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>{t.total_mas} microáreas</div>
                {t.profissionais?.length > 0 && (
                  <div style={{ fontSize: 10, color: "#374151", marginTop: 6, borderTop: "1px solid #f3f4f6", paddingTop: 6 }}>
                    ACS: {t.profissionais.slice(0, 3).join(", ")}{t.profissionais.length > 3 ? ` +${t.profissionais.length - 3}` : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Microáreas do último lote do agente */}
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Microáreas — e-SUS PEC (agente local)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12 }}>
        {microareas.map((ma: any) => {
          const cor = SEM_COR[ma.semaforo ?? "sem_dado"] ?? SEM_COR.sem_dado;
          return (
            <div key={ma.codigo} style={{ background: "#fff", border: `1px solid ${cor}30`, borderTop: `4px solid ${cor}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{ma.codigo}</div>
                  <div style={{ fontSize: 12, color: "#374151" }}>{ma.nome}</div>
                  <div style={{ fontSize: 10, color: "#4b5563" }}>{ma.equipe}{ma.acs ? ` · ${ma.acs}` : ""}</div>
                </div>
                <div style={{ background: `${cor}18`, color: cor, fontSize: 14, fontWeight: 800, padding: "4px 10px", borderRadius: 8 }}>{ma.pct_visitas == null ? "—" : `${ma.pct_visitas}%`}</div>
              </div>
              <Bar pct={ma.pct_visitas} cor={cor} height={8} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#4b5563", marginTop: 6 }}>
                <span>{fmtN(ma.familias_cadastradas)} fam. · {fmtN(ma.domicilios)} dom.</span>
                {ma.gestantes_ativas > 0 && <span style={{ color: "#7c3aed" }}>♀ {ma.gestantes_ativas}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 16, fontSize: 11, color: "#4b5563" }}>
        {[{cor:"#16a34a",l:"≥90%"},{cor:"#d97706",l:"70-89%"},{cor:"#dc2626",l:"<70%"}].map(x => (
          <span key={x.l} style={{ display:"flex",alignItems:"center",gap:4 }}><span style={{ width:10,height:10,borderRadius:2,background:x.cor,display:"inline-block" }}/>{x.l} das famílias visitadas no período</span>
        ))}
      </div>
    </div>
  );
}

// ── Aba Tempo Real ────────────────────────────────────────────────────────────

// ── Situação do PEC_SYNC_AGENT (agente local somente leitura) ──────────────────
function fmtN(v: any) { return v === null || v === undefined ? "—" : Number(v).toLocaleString("pt-BR"); }

const ESTADOS_AGENTE: Record<string, { rotulo: string; cor: string; bg: string; emoji: string }> = {
  atualizado:    { rotulo: "Atualizado",         cor: "#15803d", bg: "#f0fdf4", emoji: "🟢" },
  conectado:     { rotulo: "Conectado",          cor: "#1d4ed8", bg: "#eff6ff", emoji: "🔵" },
  sincronizando: { rotulo: "Sincronizando",      cor: "#1d4ed8", bg: "#eff6ff", emoji: "🔄" },
  desatualizado: { rotulo: "Desatualizado",      cor: "#b45309", bg: "#fffbeb", emoji: "🟡" },
  offline:       { rotulo: "Offline",            cor: "#b91c1c", bg: "#fef2f2", emoji: "🔴" },
  erro:          { rotulo: "Erro de integração", cor: "#b91c1c", bg: "#fef2f2", emoji: "⛔" },
  sem_agente:    { rotulo: "Aguardando agente",  cor: "#475569", bg: "#f8fafc", emoji: "⚪" },
};

function dataHora(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Manaus", dateStyle: "short", timeStyle: "short" });
}

function n(v: any) { return v === null || v === undefined ? "—" : Number(v).toLocaleString("pt-BR"); }

function CartaoSituacaoAgente({ s }: { s: any }) {
  const e = ESTADOS_AGENTE[s?.estado] ?? ESTADOS_AGENTE.sem_agente;
  return (
    <div style={{ background: e.bg, border: `1px solid ${e.cor}40`, borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
        <span style={{ fontSize: 18 }}>{e.emoji}</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: e.cor }}>e-SUS PEC · {e.rotulo}</span>
        <span style={{ fontSize: 12, color: "#475569" }}>{s?.texto}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10, marginTop: 12, fontSize: 12, color: "#374151" }}>
        <div><strong>Modo:</strong> {s?.modo ?? "—"}</div>
        <div><strong>Último contato do agente:</strong> {dataHora(s?.ultimo_contato)}</div>
        <div><strong>Última sincronização ACS:</strong> {dataHora(s?.ultima_sincronizacao_acs)}</div>
        <div><strong>Lido no PEC em:</strong> {dataHora(s?.ultimo_lote?.lido_no_pec_em)}</div>
        <div><strong>Competência:</strong> {s?.ultimo_lote?.competencia ?? "—"}</div>
        <div><strong>Versão do PEC:</strong> {s?.pec_versao ?? "—"} · <strong>agente</strong> {s?.agente_versao ?? "—"}</div>
        {s?.rejeicoes_24h > 0 && <div style={{ color: "#b91c1c" }}><strong>Envios rejeitados (24 h):</strong> {s.rejeicoes_24h}</div>}
      </div>
    </div>
  );
}

function AbaTempoReal() {
  const { data: s, refetch } = useQuery({
    queryKey: ["pec-agente-situacao"],
    queryFn: () => apiGet("/api/pec-agente/situacao") as Promise<any>,
    refetchInterval: 120_000,
  });
  const { data: tr } = useQuery({
    queryKey: ["esus-tempo-real"],
    queryFn: () => apiGetRaw("/api/acs/esus/tempo-real") as Promise<any>,
    refetchInterval: 120_000,
  });
  const k = tr?.dados?.kpis_mes;
  return (
    <div>
      <div style={{ fontSize: 12, color: "#374151", marginBottom: 10 }}>
        Visão operacional da integração. Os dados vêm do agente instalado no servidor do PEC por consulta
        periódica — por isso a tela mostra <strong>atualização automática</strong> e a periodicidade, não “tempo real”.
        <button onClick={() => refetch()} style={{ marginLeft: 10, background: "none", border: "1px solid #cbd5e1", borderRadius: 6, padding: "2px 10px", cursor: "pointer", fontSize: 11 }}>
          <RefreshCw size={11} /> Verificar agora
        </button>
      </div>
      <CartaoSituacaoAgente s={s} />
      {k && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
          {[
            { label: "ACS ativos", val: `${n(k.acs_ativos)} / ${n(k.total_acs)}` },
            { label: "Visitas realizadas", val: n(k.visitas_realizadas) },
            { label: "Fichas de visita registradas", val: n(k.visitas_registradas) },
            { label: "Famílias cadastradas", val: n(k.familias_cadastradas) },
            { label: "% famílias visitadas", val: k.pct_familias_visitadas == null ? "—" : `${k.pct_familias_visitadas}%` },
          ].map(c => (
            <div key={c.label} style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#1351b4" }}>{c.val}</div>
              <div style={{ fontSize: 11, color: "#374151" }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}
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
  const [periodTipo, setPeriodTipo] = useState<"diario" | "mensal" | "anual">("mensal");
  const [competencia, setCompetencia] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dataFiltro, setDataFiltro] = useState(() => new Date().toISOString().slice(0, 10));
  const [anoFiltro, setAnoFiltro] = useState(() => String(new Date().getFullYear()));

  // O catch-all "/acs/*" mantém este mesmo componente montado ao navegar entre
  // os links do menu — sem isto, trocar de link não muda nada na tela (o bug
  // relatado como "sistema travado").
  useEffect(() => {
    const nova = ROTA_PARA_ABA[location.pathname];
    if (nova) setAba(nova);
  }, [location.pathname]);

  const dashParams = useMemo(() => {
    if (periodTipo === "diario")  return { periodo: "diario",  data: dataFiltro };
    if (periodTipo === "anual")   return { periodo: "anual",   ano: anoFiltro };
    return { periodo: "mensal", competencia };
  }, [periodTipo, competencia, dataFiltro, anoFiltro]);

  const { data: dash, isLoading, refetch } = useQuery<DashboardAcs>({
    queryKey: ["acs-dashboard", dashParams],
    queryFn: () => apiGetRaw("/api/acs/dashboard", dashParams) as Promise<DashboardAcs>,
    staleTime: 60_000,
  });

  const { data: listaData } = useQuery({
    queryKey: ["acs-lista", esfFiltro],
    queryFn: () => apiGetRaw("/api/acs/lista", esfFiltro !== "Todas" ? { esf: esfFiltro } : undefined) as Promise<any>,
    staleTime: 60_000,
  });

  const { data: maData } = useQuery({
    queryKey: ["acs-microareas"],
    queryFn: () => apiGetRaw("/api/acs/microareas") as Promise<any>,
    staleTime: 60_000,
  });

  const { data: esusStatus } = useQuery<EsusStatus>({
    queryKey: ["esus-status"],
    queryFn: () => apiGetRaw("/api/acs/esus/status") as Promise<EsusStatus>,
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
    { id: "capturar" as Aba,       label: "📋 Capturar PEC",      icon: null },
  ];


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
              {/* Seletor de período: Diário | Mensal | Anual */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "3px 4px" }}>
                {(["diario","mensal","anual"] as const).map(t => (
                  <button key={t} onClick={() => setPeriodTipo(t)}
                    style={{
                      background: periodTipo === t ? "rgba(255,255,255,0.25)" : "transparent",
                      color: periodTipo === t ? "#fff" : "rgba(255,255,255,0.55)",
                      border: "none", borderRadius: 5, padding: "2px 9px",
                      fontSize: 10, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
                    }}>
                    {t === "diario" ? "Diário" : t === "mensal" ? "Mensal" : "Anual"}
                  </button>
                ))}
              </div>
              {periodTipo === "diario" && (
                <input type="date" value={dataFiltro} onChange={e => setDataFiltro(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.15)", color: "#bfdbfe", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, outline: "none", colorScheme: "dark" }} />
              )}
              {periodTipo === "mensal" && (
                <input type="month" value={competencia} onChange={e => setCompetencia(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.15)", color: "#bfdbfe", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, outline: "none", colorScheme: "dark" }} />
              )}
              {periodTipo === "anual" && (
                <input type="number" value={anoFiltro} onChange={e => setAnoFiltro(e.target.value)}
                  min="2020" max="2030" style={{ background: "rgba(255,255,255,0.15)", color: "#bfdbfe", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, outline: "none", width: 72, colorScheme: "dark" }} />
              )}
            </div>
            <div style={{ fontSize: 12, color: "#bfdbfe" }}>
              Agentes Comunitários de Saúde · {dash?.kpis ? `${dash.kpis.total_acs} ACS · ${dash.kpis.total_microareas} microáreas · competência ${dash.competencia ?? "—"}` : "aguardando dados do e-SUS PEC"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Status do agente local do e-SUS PEC */}
            {(() => {
              const ag = (esusStatus as any)?.agente;
              const e = ESTADOS_AGENTE[ag?.estado] ?? ESTADOS_AGENTE.sem_agente;
              return (
                <div style={{ background: e.bg, border: `1px solid ${e.cor}40`, borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  {["atualizado", "conectado", "desatualizado"].includes(ag?.estado) ? <Wifi size={14} color={e.cor} /> : <WifiOff size={14} color={e.cor} />}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: e.cor }}>e-SUS PEC · {e.rotulo}</div>
                    <div style={{ fontSize: 9, color: "#374151" }}>
                      {ag?.ultima_sincronizacao_acs ? `última sincronização ${dataHora(ag.ultima_sincronizacao_acs)}` : "agente local ainda não enviou os dados dos ACS"}
                    </div>
                  </div>
                </div>
              );
            })()}
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

      <div style={{ padding: "24px 28px 60px", color: "#111827" }}>

        {isLoading && <div style={{ textAlign: "center", padding: 60, color: "#4b5563" }}>Carregando painel ACS...</div>}

        {/* ── Dashboard ── */}
        {aba === "dashboard" && !k && !isLoading && (
          <NaoDisponivelBanner titulo="Aguardando dados do e-SUS PEC" rodape={null} nota={(dash as any)?.nota ?? "Aguardando os dados do e-SUS PEC pelo agente local — veja a aba Capturar PEC."} />
        )}

        {aba === "dashboard" && k && (
          <div>
            {/* Banner eSUS PEC em tempo real */}
            {dash?.producao_esus && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap" as const, alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}>✅ e-SUS PEC · Produção {dash.producao_esus.competencia}</span>
                {[
                  { label: "Visitas Dom.", val: dash.producao_esus.visitas_domiciliares },
                  { label: "Atend. Individuais", val: dash.producao_esus.atendimentos_individuais },
                  { label: "Atend. Odonto", val: dash.producao_esus.atendimentos_odontologicos },
                  { label: "Procedimentos", val: dash.producao_esus.procedimentos },
                ].map(c => (
                  <div key={c.label} style={{ textAlign: "center", background: "#fff", border: "1px solid #bbf7d0", borderRadius: 8, padding: "6px 14px", minWidth: 80 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#15803d" }}>{(c.val ?? 0).toLocaleString("pt-BR")}</div>
                    <div style={{ fontSize: 10, color: "#374151" }}>{c.label}</div>
                  </div>
                ))}
              </div>
            )}
            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
              <KpiCard icon={<Users size={18}/>}       label="ACS Ativos"           val={`${k.acs_ativos}/${k.total_acs}`} sub={`${k.total_microareas} microáreas`}          cor="#1351b4" bg="#eff6ff" border="#bfdbfe" />
              <KpiCard icon={<Home size={18}/>}         label="Famílias cadastradas" val={fmtN(k.familias_cadastradas)}   sub={`${fmtN(k.domicilios_cadastrados)} domicílios`} cor="#16a34a" bg="#f0fdf4" border="#bbf7d0" />
              <KpiCard icon={<CheckCircle size={18}/>} label="Famílias visitadas"   val={k.pct_familias_visitadas == null ? "—" : `${k.pct_familias_visitadas}%`} sub={`${fmtN(k.visitas_realizadas)} visitas realizadas no período`} cor="#1351b4" bg="#eff6ff" border="#bfdbfe" />
              <KpiCard icon={<Activity size={18}/>}    label="Grupos Prioritários"  val={k.gestantes_ativas == null && k.criancas_lt2 == null ? "—" : (k.gestantes_ativas ?? 0) + (k.criancas_lt2 ?? 0)} sub={`${fmtN(k.gestantes_ativas)} gest. · ${fmtN(k.criancas_lt2)} <2a`} cor="#7c3aed" bg="#faf5ff" border="#e9d5ff" />
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
                    {[k.gestantes_ativas, k.criancas_lt2, k.has_acompanhados, k.dm_acompanhados].every(v => v == null) ? "—" : [k.gestantes_ativas, k.criancas_lt2, k.has_acompanhados, k.dm_acompanhados].reduce((a: number, v) => a + (v ?? 0), 0)}
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
                          <div style={{ fontSize: 11, color: "#374151" }}>{a.microarea} · {a.equipe}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>{a.pct_visitas}% fam. visitadas</div>
                          <div style={{ fontSize: 11, color: "#4b5563" }}>{a.familias_cadastradas} fam.</div>
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
                          <div style={{ fontSize: 11, color: "#374151" }}>{a.microarea} · {a.equipe}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#dc2626" }}>{a.pct_visitas}% fam. visitadas</div>
                          <div style={{ fontSize: 11, color: "#4b5563" }}>{fmtN(a.familias_cadastradas)} fam.</div>
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
        {aba === "visitas" && <AbaVisitas fonte={esusStatus?.autenticado ? "esus_pec" : "referencia"} periodTipo={periodTipo} competencia={competencia} dataFiltro={dataFiltro} anoFiltro={anoFiltro} />}

        {/* ── Calendário ── */}
        {aba === "calendario" && <AbaCalendario />}

        {/* ── Cadastros Individuais ── */}
        {aba === "cadastros_ind" && <AbaCadastrosIndividuais />}

        {/* ── Cadastros Domiciliares ── */}
        {aba === "cadastros_dom" && <AbaCadastrosDomiciliares />}

        {/* ── Lista ACS ── */}
        {aba === "lista" && <AbaListaAcs acsRef={(listaData?.acs ?? []) as AcsItem[]} />}

        {/* ── Microáreas ── */}
        {aba === "microareas" && <AbaMicroareas maRef={maData?.microareas ?? []} />}

        {/* ── Tempo Real (e-SUS PEC) ── */}
        {aba === "geo" && <AbaTempoReal />}

        {/* ── Capturar PEC (bookmarklet) ── */}
        {aba === "capturar" && <AbaCapturarPEC />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Aba Capturar PEC — central de administração da integração (PEC_SYNC_AGENT)
// ─────────────────────────────────────────────────────────────────────────────
const TIPO_EXEC: Record<string, string> = { acs: "Dados ACS", esquema: "Diagnóstico de esquema", heartbeat: "Verificação do agente" };
const STATUS_EXEC: Record<string, { rotulo: string; cor: string }> = {
  aceito: { rotulo: "Aceito", cor: "#15803d" },
  sem_alteracao: { rotulo: "Sem alteração", cor: "#475569" },
  rejeitado: { rotulo: "Rejeitado", cor: "#b91c1c" },
  erro_origem: { rotulo: "Erro no PEC", cor: "#b91c1c" },
};

function AbaCapturarPEC() {
  const { data: s } = useQuery({ queryKey: ["pec-agente-situacao"], queryFn: () => apiGet("/api/pec-agente/situacao") as Promise<any> });
  const { data: ex } = useQuery({ queryKey: ["pec-agente-execucoes"], queryFn: () => apiGet("/api/pec-agente/execucoes", { limite: 50 }) as Promise<any> });
  const { data: esq } = useQuery({ queryKey: ["pec-agente-esquema"], queryFn: () => apiGet("/api/pec-agente/esquema") as Promise<any>, retry: false });
  const tabelas = Object.entries((esq?.tabelas ?? {}) as Record<string, any>);
  const semLeitura = tabelas.filter(([, t]) => t.select_permitido === false).map(([nome]) => nome);
  const card = { background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 22px", marginBottom: 16 } as const;
  return (
    <div>
      <CartaoSituacaoAgente s={s} />

      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Como a integração funciona</div>
        <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
          e-SUS PEC (banco do servidor municipal) → <strong>agente local somente leitura</strong> (pasta <code>pec_sync_agent</code>)
          → HTTPS com chave do município → ERSUS360 → Painel ACS.<br />
          O banco do PEC nunca fica exposto à internet e o ERSUS360 recebe só <strong>contagens agregadas</strong>
          (por equipe, ACS e microárea) — nenhum nome, CPF, CNS ou dado clínico de cidadão.
          Nada é gravado no PEC.
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Diagnóstico do banco do PEC (para os dados dos ACS)</div>
        {!esq?.recebido_em ? (
          <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
            Ainda não recebido. No servidor do PEC, na pasta do agente, a TI executa:
            <pre style={{ background: "#0f172a", color: "#e2e8f0", borderRadius: 8, padding: 12, fontSize: 12, marginTop: 8 }}>python diagnostico_acs.py --pec-versao 5.5.28</pre>
            O comando só lê o catálogo do banco (nomes de tabelas e colunas e as permissões do usuário do agente)
            — nenhuma linha de dados — e envia o resultado para cá.
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#374151" }}>
            Recebido em {dataHora(esq.recebido_em)} · PEC {esq.pec_versao ?? "—"} · {tabelas.length} tabelas descritas.
            {semLeitura.length > 0 && (
              <div style={{ marginTop: 8, color: "#b45309" }}>
                Sem permissão de leitura para o agente: {semLeitura.join(", ")}.
              </div>
            )}
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Histórico de execuções</div>
        {(ex?.execucoes ?? []).length === 0 ? (
          <div style={{ fontSize: 13, color: "#374151" }}>Nenhum envio do agente ainda.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr>{["Recebido", "Tipo", "Situação", "Competência", "Registros", "Detalhe"].map(h =>
                <th key={h} style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #e4e7ec", color: "#64748b" }}>{h}</th>)}</tr></thead>
              <tbody>
                {(ex?.execucoes ?? []).map((e: any) => (
                  <tr key={e.id}>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" as const }}>{dataHora(e.recebido_em)}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid #f1f5f9" }}>{TIPO_EXEC[e.tipo] ?? e.tipo}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid #f1f5f9", color: STATUS_EXEC[e.status]?.cor, fontWeight: 700 }}>{STATUS_EXEC[e.status]?.rotulo ?? e.status}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid #f1f5f9" }}>{e.competencia ?? "—"}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid #f1f5f9" }}>{n(e.registros)}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid #f1f5f9", color: "#475569" }}>{e.mensagem ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
