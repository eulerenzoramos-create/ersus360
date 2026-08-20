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
import { apiGet, apiPost } from "../lib/api";
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

const STATUS_COR: Record<string, string> = { destaque:"#16a34a", regular:"#1351b4", critico:"#dc2626", afastado:"#9ca3af" };
const STATUS_LABEL: Record<string, string> = { destaque:"Destaque", regular:"Regular", critico:"Atenção", afastado:"Afastado" };
const SEM_COR: Record<string, string> = { verde:"#16a34a", amarelo:"#d97706", vermelho:"#dc2626" };
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
          <div style={{ fontSize: 11, color: "#9ca3af" }}>{a.microarea} · {a.equipe} · {a.familias_cadastradas} famílias</div>
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

  if (isLoading) return <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>Carregando dados do e-SUS PEC...</div>;

  const prod = data?.dados;
  const disponivel = prod && prod.fonte === "esus_pec";
  const competencia = prod?.competencia ?? "—";

  // Dados reais do eSUS PEC — exibe totais de produção
  if (disponivel) {
    const cards = [
      { label: "Visitas Domiciliares", val: prod.visitas_domiciliares ?? 0, cor: "#1351b4", bg: "#eff6ff", border: "#bfdbfe" },
      { label: "Atendimentos Individuais", val: prod.atendimentos_individuais ?? 0, cor: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
      { label: "Atend. Odontológicos", val: prod.atendimentos_odontologicos ?? 0, cor: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff" },
      { label: "Procedimentos", val: prod.procedimentos ?? 0, cor: "#d97706", bg: "#fef3c7", border: "#fde68a" },
      { label: "Ativ. Coletivas", val: prod.atividades_coletivas ?? 0, cor: "#0891b2", bg: "#f0f9ff", border: "#bae6fd" },
      { label: "Encaminhamentos", val: prod.encaminhamentos ?? 0, cor: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
    ];
    return (
      <div>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>✅</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>e-SUS PEC conectado</span>
          <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>Competência {competencia}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          {cards.map(c => (
            <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "18px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: c.cor }}>{c.val.toLocaleString("pt-BR")}</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "14px 16px", fontSize: 12, color: "#6b7280" }}>
          Fonte: e-SUS PEC · Apuí/AM · IBGE 1300144 · Competência {competencia}
        </div>
      </div>
    );
  }

  // Offline — exibe banner
  return (
    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📡</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#b91c1c", marginBottom: 8 }}>e-SUS PEC Offline</div>
      <div style={{ fontSize: 13, color: "#6b7280" }}>{prod?.nota ?? "Configure ESUS_USUARIO e ESUS_SENHA no Railway para exibir dados em tempo real."}</div>
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
    queryFn: () => apiGet("/api/acs/lista") as Promise<any>,
    staleTime: 300_000,
  });

  const todosAcs: AcsItem[] = listaData?.acs ?? [];

  // Calendário do eSUS PEC (dados reais)
  const { data, isLoading } = useQuery({
    queryKey: ["acs-calendario-esus"],
    queryFn: () => apiGet("/api/acs/esus/calendario-visitas") as Promise<any>,
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
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{todosAcs.length} agentes · todas as equipes</div>
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
              <span style={{ fontSize: 11, background: `${ESF_COR[acsSel.equipe] || "#6b7280"}18`,
                color: ESF_COR[acsSel.equipe] || "#6b7280", padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>
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

// ── Banner offline ────────────────────────────────────────────────────────────
function OfflineBanner({ emoji, titulo, nota }: { emoji: string; titulo: string; nota?: string }) {
  return (
    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{emoji}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#b91c1c", marginBottom: 8 }}>{titulo}</div>
      <div style={{ fontSize: 13, color: "#6b7280" }}>{nota ?? "Configure ESUS_USUARIO e ESUS_SENHA no Railway para exibir dados em tempo real."}</div>
    </div>
  );
}

function ConectadoBanner({ texto }: { texto: string }) {
  return (
    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 16 }}>✅</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>e-SUS PEC conectado</span>
      {texto && <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>{texto}</span>}
    </div>
  );
}

// ── Aba Cadastros Individuais ─────────────────────────────────────────────────

function AbaCadastrosIndividuais() {
  const [pagina, setPagina] = useState(0);
  const [busca,  setBusca]  = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["acs-cad-ind", pagina],
    queryFn: () => apiGet("/api/acs/esus/cadastros-individuais", { pagina, tamanho: 50 }) as Promise<any>,
    staleTime: 120_000,
  });

  if (isLoading) return <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>Carregando cadastros do e-SUS PEC...</div>;

  const cad = data?.dados;
  const conectado = data?.fonte === "esus_pec";

  if (conectado) {
    const cidadaos: any[] = cad?.cidadaos ?? [];
    const filtrado = busca
      ? cidadaos.filter(c => (c.nome ?? "").toLowerCase().includes(busca.toLowerCase()) || (c.cns ?? "").includes(busca) || (c.cpf ?? "").includes(busca))
      : cidadaos;
    return (
      <div>
        <ConectadoBanner texto={`${(cad?.total ?? 0).toLocaleString("pt-BR")} cidadãos cadastrados · Apuí/AM`} />
        <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px" }}>
            <Search size={14} color="#9ca3af" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, CNS ou CPF..."
              style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent" }} />
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>Pág. {pagina + 1}/{cad?.total_paginas ?? 1} · {(cad?.total ?? 0).toLocaleString("pt-BR")} total</div>
          <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: pagina === 0 ? "#f9fafb" : "#fff", cursor: pagina === 0 ? "not-allowed" : "pointer", fontSize: 12 }}>← Ant.</button>
          <button onClick={() => setPagina(p => p + 1)} disabled={!cad?.tem_proxima}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: !cad?.tem_proxima ? "#f9fafb" : "#fff", cursor: !cad?.tem_proxima ? "not-allowed" : "pointer", fontSize: 12 }}>Próx. →</button>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e4e7ec", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                {["Nome","CNS","CPF","Dt. Nasc.","Sexo","Equipe","Microárea"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left" as const, fontWeight: 700, color: "#374151", whiteSpace: "nowrap" as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrado.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>Nenhum registro encontrado</td></tr>
              ) : filtrado.map((c: any, i: number) => (
                <tr key={c.id ?? i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "9px 14px", fontWeight: 500 }}>{c.nome ?? "—"}</td>
                  <td style={{ padding: "9px 14px", fontFamily: "monospace", color: "#6b7280" }}>{c.cns ?? "—"}</td>
                  <td style={{ padding: "9px 14px", fontFamily: "monospace", color: "#6b7280" }}>{c.cpf ?? "—"}</td>
                  <td style={{ padding: "9px 14px", color: "#6b7280" }}>{c.data_nascimento ?? "—"}</td>
                  <td style={{ padding: "9px 14px", color: "#6b7280" }}>{c.sexo ?? "—"}</td>
                  <td style={{ padding: "9px 14px", color: "#1351b4", fontWeight: 600 }}>{c.equipe ?? "—"}</td>
                  <td style={{ padding: "9px 14px", color: "#6b7280" }}>{c.microarea ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 10 }}>Fonte: e-SUS PEC · Apuí/AM · IBGE 1300144</div>
      </div>
    );
  }

  return <OfflineBanner emoji="📋" titulo="e-SUS PEC Offline" nota={cad?.nota} />;
}


// ── Aba Cadastros Domiciliares ────────────────────────────────────────────────

function AbaCadastrosDomiciliares() {
  const [pagina, setPagina] = useState(0);
  const [busca,  setBusca]  = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["acs-cad-dom", pagina],
    queryFn: () => apiGet("/api/acs/esus/cadastros-domiciliares", { pagina, tamanho: 50 }) as Promise<any>,
    staleTime: 120_000,
  });

  if (isLoading) return <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>Carregando domicílios do e-SUS PEC...</div>;

  const cad = data?.dados;
  const conectado = data?.fonte === "esus_pec";

  if (conectado) {
    const domicilios: any[] = cad?.domicilios ?? [];
    const filtrado = busca
      ? domicilios.filter(d => (d.logradouro ?? "").toLowerCase().includes(busca.toLowerCase()) || (d.bairro ?? "").toLowerCase().includes(busca.toLowerCase()) || (d.microarea ?? "").includes(busca))
      : domicilios;
    return (
      <div>
        <ConectadoBanner texto={`${(cad?.total ?? 0).toLocaleString("pt-BR")} domicílios · Apuí/AM`} />
        <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px" }}>
            <Search size={14} color="#9ca3af" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por logradouro, bairro ou microárea..."
              style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent" }} />
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>Pág. {pagina + 1}/{cad?.total_paginas ?? 1}</div>
          <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e5e7eb", cursor: pagina === 0 ? "not-allowed" : "pointer", fontSize: 12 }}>← Ant.</button>
          <button onClick={() => setPagina(p => p + 1)} disabled={!cad?.tem_proxima}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e5e7eb", cursor: !cad?.tem_proxima ? "not-allowed" : "pointer", fontSize: 12 }}>Próx. →</button>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e4e7ec", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                {["Logradouro","Nº","Bairro","CEP","Microárea","Famílias"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left" as const, fontWeight: 700, color: "#374151" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrado.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>Nenhum registro encontrado</td></tr>
              ) : filtrado.map((d: any, i: number) => (
                <tr key={d.id ?? i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "9px 14px", fontWeight: 500 }}>{d.logradouro || "—"}</td>
                  <td style={{ padding: "9px 14px", color: "#6b7280" }}>{d.numero ?? "s/n"}</td>
                  <td style={{ padding: "9px 14px", color: "#6b7280" }}>{d.bairro ?? "—"}</td>
                  <td style={{ padding: "9px 14px", color: "#6b7280", fontFamily: "monospace" }}>{d.cep ?? "—"}</td>
                  <td style={{ padding: "9px 14px", color: "#1351b4", fontWeight: 600 }}>{d.microarea ?? "—"}</td>
                  <td style={{ padding: "9px 14px", color: "#16a34a", fontWeight: 700 }}>{d.familias ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 10 }}>Fonte: e-SUS PEC · Apuí/AM · IBGE 1300144</div>
      </div>
    );
  }

  return <OfflineBanner emoji="🏠" titulo="e-SUS PEC Offline" nota={cad?.nota} />;
}

// ── Aba Lista ACS com dados eSUS PEC ─────────────────────────────────────────

function AbaListaAcs({ acsRef }: { acsRef: AcsItem[] }) {
  const [busca, setBusca]   = useState("");
  const [filtroEq, setFiltroEq] = useState("Todas");

  const { data: esusAcs } = useQuery({
    queryKey: ["esus-acs"],
    queryFn: () => apiGet("/api/acs/esus/acs") as Promise<any>,
    staleTime: 300_000,
    retry: false,
  });

  const conectado = esusAcs?.fonte === "esus_pec";
  const acsList: any[] = conectado ? (esusAcs?.dados?.acs ?? []) : acsRef;

  const equipes = ["Todas", ...Array.from(new Set(acsList.map((a: any) => a.equipe ?? a.equipe).filter(Boolean))) as string[]];

  const filtrado = acsList.filter((a: any) => {
    const okBusca = !busca || (a.nome ?? "").toLowerCase().includes(busca.toLowerCase()) || (a.cns ?? "").includes(busca);
    const okEq    = filtroEq === "Todas" || a.equipe === filtroEq;
    return okBusca && okEq;
  });

  return (
    <div>
      {conectado && <ConectadoBanner texto={`${esusAcs?.dados?.total ?? 0} ACS no e-SUS PEC · CBO 515140`} />}
      {!conectado && (
        <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
          ⚠ Dados de referência CNES — configure ESUS_USUARIO e ESUS_SENHA no Railway para dados reais do e-SUS PEC.
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
        <span style={{ fontSize: 12, color: "#9ca3af" }}>{filtrado.length} ACS</span>
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
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>Nenhum ACS encontrado</td></tr>
            ) : filtrado.map((a: any, i: number) => {
              const cor = ESF_COR[a.equipe ?? ""] || "#6b7280";
              return (
                <tr key={a.id ?? a.cns ?? i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "9px 14px", fontWeight: 600 }}>{a.nome}</td>
                  <td style={{ padding: "9px 14px", fontFamily: "monospace", color: "#6b7280" }}>{a.cns ?? "—"}</td>
                  <td style={{ padding: "9px 14px", color: "#6b7280", fontSize: 11 }}>{a.cbo ?? "ACS"}</td>
                  <td style={{ padding: "9px 14px", color: "#6b7280" }}>{a.unidade ?? "—"}</td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{ background: `${cor}15`, color: cor, padding: "2px 8px", borderRadius: 6, fontWeight: 700, fontSize: 11 }}>{a.equipe ?? "—"}</span>
                  </td>
                  <td style={{ padding: "9px 14px", fontFamily: "monospace", color: "#9ca3af", fontSize: 10 }}>{a.ine ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 10 }}>
        Fonte: {conectado ? "e-SUS PEC · Apuí/AM · IBGE 1300144" : "CNES / Referência Municipal"}
      </div>
    </div>
  );
}

// ── Aba Microáreas com dados eSUS PEC ─────────────────────────────────────────

function AbaMicroareas({ maRef }: { maRef: any[] }) {
  const { data: terr } = useQuery({
    queryKey: ["esus-territorios"],
    queryFn: () => apiGet("/api/acs/esus/territorios") as Promise<any>,
    staleTime: 300_000,
    retry: false,
  });

  const conectado = terr?.fonte === "esus_pec";
  const microareas = maRef; // sempre mostra referência; enriquece com eSUS se disponível

  return (
    <div>
      {conectado && <ConectadoBanner texto={`${terr?.dados?.total ?? 0} territórios no e-SUS PEC`} />}
      {!conectado && (
        <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
          ⚠ Dados de referência — configure credenciais no Railway para territórios reais do e-SUS PEC.
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
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>INE: {t.ine ?? "—"} · {t.tipo}</div>
                <div style={{ fontSize: 12, color: "#374151" }}>Unidade: {t.unidade ?? "—"}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{t.total_mas} microáreas</div>
                {t.profissionais?.length > 0 && (
                  <div style={{ fontSize: 10, color: "#6b7280", marginTop: 6, borderTop: "1px solid #f3f4f6", paddingTop: 6 }}>
                    ACS: {t.profissionais.slice(0, 3).join(", ")}{t.profissionais.length > 3 ? ` +${t.profissionais.length - 3}` : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sempre mostra microáreas de referência */}
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Microáreas — Dados CNES de Referência</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12 }}>
        {microareas.map((ma: any) => {
          const cor = SEM_COR[ma.semaforo];
          return (
            <div key={ma.codigo} style={{ background: "#fff", border: `1px solid ${cor}30`, borderTop: `4px solid ${cor}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{ma.codigo}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{ma.nome}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{ma.zona === "urbana" ? "🏙 Urbana" : "🌲 Rural"} · {ma.equipe}</div>
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
  );
}

// ── Aba Tempo Real ────────────────────────────────────────────────────────────

function AbaTempoReal() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["esus-tempo-real"],
    queryFn: () => apiGet("/api/acs/esus/tempo-real") as Promise<any>,
    staleTime: 60_000,
    refetchInterval: 120_000, // atualiza a cada 2 min
  });

  const conectado = data?.fonte === "esus_pec";
  const d         = data?.dados;
  const prod      = d?.producao;
  const cad       = d?.cadastros;
  const ts        = d?.ts_verificacao ?? data?.dados?.ts_verificacao;
  const tsLabel   = ts ? new Date(ts).toLocaleTimeString("pt-BR") : "—";

  if (isLoading) return <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>Consultando e-SUS PEC em tempo real...</div>;

  if (!conectado) {
    return (
      <div>
        <OfflineBanner emoji="📡" titulo="e-SUS PEC Offline" nota={d?.nota} />
        <div style={{ marginTop: 16, background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "20px 24px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Como ativar o Tempo Real</div>
          {[
            { step: "1", desc: "Acesse Railway → seu projeto → Variables" },
            { step: "2", desc: "Adicione ESUS_USUARIO com seu login do e-SUS PEC" },
            { step: "3", desc: "Adicione ESUS_SENHA com sua senha" },
            { step: "4", desc: "O Railway redeploy automaticamente em ~2 min" },
          ].map(s => (
            <div key={s.step} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1351b4", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{s.step}</div>
              <div style={{ fontSize: 13, color: "#374151", paddingTop: 4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
        <span style={{ fontSize: 16 }}>🟢</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>e-SUS PEC · Tempo Real</span>
        <span style={{ fontSize: 11, color: "#6b7280" }}>Última atualização: {tsLabel}</span>
        <span style={{ fontSize: 11, color: "#6b7280" }}>Competência: {d?.competencia}</span>
        <button onClick={() => refetch()}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: "#1351b4", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12 }}>
          <RefreshCw size={12} /> Atualizar agora
        </button>
      </div>

      {/* Produção em tempo real */}
      {prod && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📊 Produção — {d?.competencia}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {[
              { label: "Visitas Domiciliares",     val: prod.visitas_domiciliares,        cor: "#1351b4", bg: "#eff6ff", border: "#bfdbfe" },
              { label: "Atendimentos Individuais", val: prod.atendimentos_individuais,    cor: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
              { label: "Atend. Odontológicos",     val: prod.atendimentos_odontologicos,  cor: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff" },
              { label: "Procedimentos",             val: prod.procedimentos,               cor: "#d97706", bg: "#fef3c7", border: "#fde68a" },
              { label: "Atividades Coletivas",      val: prod.atividades_coletivas,        cor: "#0891b2", bg: "#f0f9ff", border: "#bae6fd" },
              { label: "Encaminhamentos",           val: prod.encaminhamentos,             cor: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
            ].map(c => (
              <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "18px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: c.cor }}>{(c.val ?? 0).toLocaleString("pt-BR")}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cadastros */}
      {cad && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "22px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#1351b4" }}>{(cad.individuais ?? 0).toLocaleString("pt-BR")}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Cidadãos Cadastrados</div>
          </div>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "22px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#16a34a" }}>{d?.total_acs_esus ?? "—"}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>ACS Cadastrados no e-SUS</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "22px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>Apuí/AM</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>IBGE 1300144</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{d?.competencia}</div>
          </div>
        </div>
      )}

      <div style={{ fontSize: 11, color: "#9ca3af" }}>Fonte: e-SUS PEC · {BASE_URL} · Atualização automática a cada 2 min</div>
    </div>
  );
}

const BASE_URL = "esus.apui.am.gov.br";

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
    { id: "capturar" as Aba,       label: "📋 Capturar PEC",      icon: null },
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
                  eSUS PEC · {esusStatus?.conectado ? (esusStatus.autenticado ? "Conectado ✓" : "Sem credenciais") : "Offline"}
                </div>
                <div style={{ fontSize: 9, color: "#6b7280" }}>
                  {esusStatus?.autenticado ? `v${esusStatus.versao || "—"} · ${esusStatus.instancia || ""}` : esusStatus?.conectado ? "Adicione ESUS_USUARIO e ESUS_SENHA no Railway" : "Servidor inacessível"}
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
        {aba === "dashboard" && !k && !isLoading && (
          <NaoDisponivelBanner nota="Dados de referência CNES não carregados. Tente recarregar a página." />
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
                    <div style={{ fontSize: 10, color: "#6b7280" }}>{c.label}</div>
                  </div>
                ))}
              </div>
            )}
            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
              <KpiCard icon={<Users size={18}/>}       label="ACS Ativos"           val={`${k.acs_ativos}/${k.total_acs}`} sub={`${k.total_microareas} microáreas`}          cor="#1351b4" bg="#eff6ff" border="#bfdbfe" />
              <KpiCard icon={<Home size={18}/>}         label="Cobertura Familiar"   val={`${k.pct_cobertura}%`}             sub={`${k.familias_cadastradas?.toLocaleString("pt-BR")} famílias`} cor="#16a34a" bg="#f0fdf4" border="#bbf7d0" />
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
                          <div style={{ fontSize: 11, color: "#6b7280" }}>{a.microarea} · {a.equipe}</div>
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
                          <div style={{ fontSize: 11, color: "#6b7280" }}>{a.microarea} · {a.equipe}</div>
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
// Aba Capturar PEC — bookmarklet + colar dados
// ─────────────────────────────────────────────────────────────────────────────
function AbaCapturarPEC() {
  const [json, setJson] = React.useState("");
  const [salvando, setSalvando] = React.useState(false);
  const [ok, setOk] = React.useState(false);
  const [erro, setErro] = React.useState("");
  const BASE_URL = window.location.origin;

  const bookmarkletCode = `javascript:(function(){
var ERSUS='${BASE_URL}';
var IBGE='1300144';
var comp=new Date().toISOString().slice(0,7).replace('-','');

function gql(q,v){
  return fetch('/graphql',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({query:q,variables:v})}).then(r=>r.json()).catch(()=>null);
}

var Q_PROD=\`query P($m:String!,$c:String!){relatorioAtendimentos(filter:{municipio:{codigoIbge:$m}competencia:$c}){totalAtendimentosIndividuais totalAtendimentosOdontologicos totalVisitasDomiciliares totalProcedimentos totalAtividadesColetivas totalEncaminhamentos}}\`;
var Q_CAD=\`query C($m:String!){cidadaos(filter:{municipio:{codigoIbge:$m}},page:0,size:1){totalElements}}\`;
var Q_ACS=\`query A($m:String!){profissionaisDeSaude(filter:{municipio:{codigoIbge:$m}}){nome cns cbo{codigo descricao}lotacoes{unidadeSaude{nome}equipe{ine nome}}}}\`;
var Q_VIS=\`query V($m:String!,$c:String!){visitasDomiciliares(filter:{municipio:{codigoIbge:$m}competencia:$c},page:0,size:999){totalElements content{dataVisita microArea profissional{nome cbo{codigo}}desfecho{descricao}turno}}}\`;

Promise.all([
  gql(Q_PROD,{m:IBGE,c:comp}),
  gql(Q_CAD,{m:IBGE}),
  gql(Q_ACS,{m:IBGE}),
  gql(Q_VIS,{m:IBGE,c:comp}),
]).then(function(rs){
  var prod=rs[0]&&rs[0].data&&rs[0].data.relatorioAtendimentos;
  var cad=rs[1]&&rs[1].data&&rs[1].data.cidadaos;
  var profs=rs[2]&&rs[2].data&&rs[2].data.profissionaisDeSaude;
  var vis=rs[3]&&rs[3].data&&rs[3].data.visitasDomiciliares;

  var acs=(profs||[]).filter(function(p){return p.cbo&&(p.cbo.codigo||'').indexOf('515140')>=0;});
  var por_dia={};
  var por_acs={};
  (vis&&vis.content||[]).forEach(function(v){
    var d=(v.dataVisita||'').split('-')[2]||'0';
    por_dia[d]=(por_dia[d]||0)+1;
    var n=(v.profissional&&v.profissional.nome)||'—';
    por_acs[n]=(por_acs[n]||0)+1;
  });

  var dados={
    origem:'bookmarklet_pec',
    competencia:comp.slice(0,4)+'-'+comp.slice(4),
    capturado_em:new Date().toISOString(),
    producao:prod?{
      visitas_domiciliares:prod.totalVisitasDomiciliares,
      atendimentos_individuais:prod.totalAtendimentosIndividuais,
      atendimentos_odontologicos:prod.totalAtendimentosOdontologicos,
      procedimentos:prod.totalProcedimentos,
      atividades_coletivas:prod.totalAtividadesColetivas,
      encaminhamentos:prod.totalEncaminhamentos
    }:null,
    cadastros:cad?{total_cidadaos:cad.totalElements}:null,
    total_acs:acs.length,
    acs:acs.slice(0,10).map(function(p){return{nome:p.nome,cns:p.cns,cbo:(p.cbo||{}).descricao,equipe:(((p.lotacoes||[])[0]||{}).equipe||{}).nome};}),
    visitas:{
      total:vis?vis.totalElements:0,
      por_dia:Object.keys(por_dia).sort().map(function(d){return{dia:parseInt(d),total:por_dia[d]};}),
      por_acs:Object.keys(por_acs).sort(function(a,b){return por_acs[b]-por_acs[a];}).slice(0,10).map(function(n){return{nome:n,total:por_acs[n]};})
    }
  };

  var json=JSON.stringify(dados);
  navigator.clipboard.writeText(json).then(function(){
    alert('✓ Dados do e-SUS PEC copiados!\\nAgora vá ao ERSUS360 → Painel ACS → Capturar PEC → cole e salve.');
  }).catch(function(){
    prompt('Copie o JSON abaixo (Ctrl+A, Ctrl+C):',json);
  });
}).catch(function(e){alert('Erro: '+e.message);});
})();`;

  async function salvar() {
    if (!json.trim()) { setErro("Cole o JSON antes de salvar."); return; }
    setSalvando(true); setErro(""); setOk(false);
    try {
      const dados = JSON.parse(json);
      await apiPost("/api/acs/esus/snapshot", dados);
      setOk(true); setJson("");
    } catch (e: any) {
      setErro("JSON inválido ou erro ao salvar: " + e.message);
    } finally { setSalvando(false); }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Instruções */}
      <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Como capturar dados do e-SUS PEC</div>
        {[
          { n: "1", t: "Abra o e-SUS PEC no Chrome", d: "esus.apui.am.gov.br — faça login com gov.br normalmente" },
          { n: "2", t: "Execute o bookmarklet", d: "Clique no botão abaixo para copiar o código, depois cole na barra de endereços do Chrome e pressione Enter" },
          { n: "3", t: "Aguarde a captura", d: "O bookmarklet consulta a API do e-SUS PEC e copia o JSON automaticamente" },
          { n: "4", t: "Cole e salve aqui", d: "Volte ao ERSUS360, cole o JSON na área abaixo e clique em Salvar" },
        ].map(s => (
          <div key={s.n} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ minWidth: 28, height: 28, borderRadius: "50%", background: "#1351b4", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>{s.n}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{s.t}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{s.d}</div>
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            navigator.clipboard.writeText(bookmarkletCode).then(() => alert("✓ Código copiado!\n\nAgora:\n1. Abra o e-SUS PEC no Chrome (esus.apui.am.gov.br)\n2. Clique na barra de endereços\n3. Delete o endereço e cole o código copiado\n4. Pressione Enter")).catch(() => prompt("Copie o código abaixo:", bookmarkletCode));
          }}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "#1351b4", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700, marginTop: 8 }}>
          📋 Copiar código do bookmarklet
        </button>
      </div>

      {/* Área de colar */}
      <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "20px 24px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Colar dados capturados do e-SUS PEC</div>
        <textarea
          value={json}
          onChange={e => { setJson(e.target.value); setErro(""); setOk(false); }}
          placeholder='Cole aqui o JSON copiado do e-SUS PEC (começa com {"origem":"bookmarklet_pec"...)'
          style={{ width: "100%", height: 120, fontFamily: "monospace", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 8, padding: 10, resize: "vertical", boxSizing: "border-box" as const }}
        />
        {erro && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 6 }}>{erro}</div>}
        {ok && <div style={{ color: "#16a34a", fontSize: 12, marginTop: 6 }}>✓ Dados salvos com sucesso! Acesse as outras abas para ver.</div>}
        <button
          onClick={salvar}
          disabled={salvando || !json.trim()}
          style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, background: salvando ? "#9ca3af" : "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", cursor: salvando ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700 }}>
          {salvando ? "Salvando..." : "💾 Salvar no Painel ACS"}
        </button>
      </div>
    </div>
  );
}
