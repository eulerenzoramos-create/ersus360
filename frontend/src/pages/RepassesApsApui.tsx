/**
 * RepassesApsApui — Módulo Financeiro ERSUS360 — Apuí/AM
 *
 * Estrutura em 3 abas:
 *   1. Atenção Primária — e-Gestor APS  (dados de competência, parcelas, componentes, equipes)
 *   2. Repasses do FNS                  (transferências fundo a fundo, classificadas por tipo)
 *   3. Conciliação e-Gestor APS × FNS   (comparativo sem dupla contagem)
 *
 * Design: inline styles exclusivamente (sem Tailwind — não instalado no projeto).
 */
import { useState, useMemo } from "react";
import { lazy, Suspense } from "react";
import RepassesFnsPanel from "./RepassesFnsPanel";
import ConciliacaoFnsPanel from "./ConciliacaoFnsPanel";
const MatrizFnsRaw = lazy(() => import("./MatrizFns"));
const MatrizFnsLazy = () => (
  <Suspense fallback={<div style={{ padding: 60, textAlign: "center", color: "#6b7280" }}>Carregando…</div>}>
    <MatrizFnsRaw />
  </Suspense>
);
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiPost, apiPut } from "../lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import {
  ChevronDown, ChevronRight, CheckCircle, AlertTriangle,
  XCircle, ExternalLink, RefreshCw, TrendingUp, TrendingDown,
  DollarSign, Calendar, BarChart2, FileText, Download,
  Search, Filter, X,
} from "lucide-react";
import { apiGet } from "../lib/api";

// ─── Design tokens (alinhados com App.tsx) ────────────────────────────────────
const C = {
  blue:      "#1565c0",
  blueDark:  "#0f1b2d",
  blueMid:   "#1e3a5f",
  blueLight: "#e3f0ff",
  green:     "#16a34a",
  greenBg:   "#f0fdf4",
  greenBdr:  "#bbf7d0",
  amber:     "#d97706",
  amberBg:   "#fffbeb",
  amberBdr:  "#fde68a",
  red:       "#dc2626",
  redBg:     "#fef2f2",
  redBdr:    "#fecaca",
  gray:      "#6b7280",
  grayLight: "#f4f6f8",
  grayBdr:   "#e4e7ec",
  grayBdr2:  "#d1d5db",
  textPri:   "#111827",
  textSec:   "#6b7280",
  textMut:   "#9ca3af",
  money:     "#059669",
  white:     "#ffffff",
  rowHover:  "#f8faff",
  rowAlt:    "#fafbfc",
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface CompetenciaResumo {
  competencia: string; mes: string; parcela: string; nu_parcela: string;
  total_oficial: number; conciliado: boolean; fonte_situacao: string; coletado_em: string;
}
interface Componente {
  co_seq: number; descricao: string; descricao_original: string;
  gestao: string; vl_custeio: number; vl_implantacao: number; vl_total: number;
}
interface CompetenciaDetalhe {
  competencia: string; mes: string; parcela: string; nu_parcela: string;
  nu_comp_cnes: string; co_processo?: number; total_oficial: number;
  soma_componentes: number; conciliado: boolean; componentes: Componente[];
  fonte: string; fonte_situacao: string; coletado_em: string;
  data_consulta_egestor?: string;
}
interface DetalhadoData {
  competencia: string; parcela: string; populacao: number;
  faixa_equidade_esf: string; classificacao_vinculo_esf: string;
  classificacao_qualidade_esf: string; classificacao_qualidade_emulti: string;
  esf: { qt_pagas: number; qt_100pct: number; qt_75pct: number; qt_teto?: number;
    vl_fixo: number; vl_vinculo: number; vl_qualidade: number; vl_total_bruto: number; };
  eap: { qt_pagas: number; vl_total_bruto: number };
  emulti: { qt_pagas: number; qt_estrategica: number; qt_atend_remoto: number; vl_custeio: number; vl_qualidade: number; vl_atend_remoto: number; vl_total: number; };
  esb: { qt_40h_pagas_modal_i: number; qt_uom: number; vl_esb_40h: number;
    vl_qualidade_40h: number; vl_uom: number; vl_lrpd_municipal: number; vl_total_sb_calculado: number; };
  acs: { qt_teto: number; qt_direto_pago: number; vl_total: number };
  esfrb: { qt_pagas: number; vl_custeio: number; vl_qualidade: number; vl_vinculo: number; vl_extra: number; vl_total: number };
  microscopistas: { qt_pagos: number; vl_total: number };
  per_capita: { populacao: number; vl_pagamento: number };
  tetos: { esf: number; eap: number; emulti_estrategica: number; sb_40h: number };
  fonte_situacao: string; coletado_em: string;
}
interface ListaResponse {
  meta: Record<string, unknown>; ano_ciclo: number; data_consulta_egestor: string;
  coletado_em: string; total_periodo: number; competencias: CompetenciaResumo[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BRL = (v: number | null | undefined) =>
  v == null ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const BRLc = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
const pct = (p: number, t: number) => t > 0 ? ((p / t) * 100).toFixed(1) + "%" : "—";

const COMP_COLORS: Record<number, string> = {
  8: "#1565c0", 10: "#059669", 2: "#d97706",
  11: "#ea580c", 9: "#7c3aed", 12: "#0891b2", 16: "#db2777", 7: "#65a30d",
};

// ─── Componentes base ─────────────────────────────────────────────────────────

function Badge({ cor, bg, bdr, children }: { cor: string; bg: string; bdr: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: bg, color: cor, border: `1px solid ${bdr}`,
      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
      whiteSpace: "nowrap" as const,
    }}>{children}</span>
  );
}

function BadgeConciliacao({ ok }: { ok: boolean }) {
  return ok
    ? <Badge cor={C.green} bg={C.greenBg} bdr={C.greenBdr}><CheckCircle size={11} /> Conciliado</Badge>
    : <Badge cor={C.red} bg={C.redBg} bdr={C.redBdr}><XCircle size={11} /> Divergência</Badge>;
}

function BadgeFonte() {
  return (
    <a href="https://relatorioaps.saude.gov.br" target="_blank" rel="noopener noreferrer"
      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11,
        color: C.blue, textDecoration: "none", fontWeight: 600 }}>
      e-Gestor APS <ExternalLink size={10} />
    </a>
  );
}

function BadgeClass({ val }: { val: string }) {
  const map: Record<string, [string, string, string]> = {
    BOM: [C.green, C.greenBg, C.greenBdr],
    REGULAR: [C.amber, C.amberBg, C.amberBdr],
  };
  const [cor, bg, bdr] = map[val?.toUpperCase()] ?? [C.gray, C.grayLight, C.grayBdr];
  return <Badge cor={cor} bg={bg} bdr={bdr}>{val}</Badge>;
}

// ─── Tooltip personalizado do gráfico ────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: {value: number}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.grayBdr}`,
      borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,.1)",
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.textPri, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.money }}>
        {BRLc(payload[0].value)}
      </div>
    </div>
  );
}

// ─── Card de sumário ─────────────────────────────────────────────────────────
function SummaryCard({
  titulo, valor, subtitulo, Icon, cor, corBg, variacao,
}: {
  titulo: string; valor: string; subtitulo?: string;
  Icon: React.ElementType; cor: string; corBg: string; variacao?: number | null;
}) {
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.grayBdr}`,
      borderRadius: 12, padding: "18px 20px",
      boxShadow: "0 1px 4px rgba(0,0,0,.04)",
      display: "flex", flexDirection: "column" as const, gap: 8, flex: "1 1 0", minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.textSec, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
          {titulo}
        </span>
        <div style={{ background: corBg, borderRadius: 8, padding: 8, display: "flex" }}>
          <Icon size={16} color={cor} />
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.textPri, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
        {valor}
      </div>
      {(subtitulo || variacao != null) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textSec }}>
          {variacao != null && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 700,
              color: variacao >= 0 ? C.green : C.red,
            }}>
              {variacao >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {variacao >= 0 ? "+" : ""}{variacao.toFixed(1)}%
            </span>
          )}
          {subtitulo && <span>{subtitulo}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Painel de equipes ────────────────────────────────────────────────────────
function PainelEquipes({ nuParcela }: { nuParcela: string }) {
  const { data, isLoading, error } = useQuery<DetalhadoData>({
    queryKey: ["repasse-detalhado", nuParcela],
    queryFn: () => apiGet(`/api/repasses-aps/detalhado/${nuParcela}`),
    staleTime: 300_000,
  });

  if (isLoading) return (
    <div style={{ padding: "20px 0", color: C.textSec, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
      <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Consultando e-Gestor APS…
    </div>
  );
  if (error || !data) return (
    <p style={{ color: C.red, fontSize: 13 }}>Não foi possível obter detalhamento de equipes.</p>
  );

  const { esf, eap, emulti, esb, acs, esfrb, microscopistas, per_capita, tetos } = data;

  const indicadores = [
    { label: "Equidade eSF",     val: data.faixa_equidade_esf },
    { label: "Vínculo eSF/eAP",  val: data.classificacao_vinculo_esf },
    { label: "Qualidade eSF",    val: data.classificacao_qualidade_esf },
    { label: "Qualidade eMulti", val: data.classificacao_qualidade_emulti },
  ];

  const equipes = [
    { cor: "#1565c0", nome: "eSF — Saúde da Família",   qtd: `${esf.qt_pagas}`, teto: tetos.esf,   vl: esf.vl_total_bruto,      det: `F ${BRL(esf.vl_fixo)} · V ${BRL(esf.vl_vinculo)} · Q ${BRL(esf.vl_qualidade)}` },
    { cor: "#93c5fd", nome: "eAP — Atenção Primária",   qtd: `${eap.qt_pagas}`, teto: tetos.eap,   vl: eap.vl_total_bruto,     det: eap.qt_pagas === 0 ? "Sem equipes pagas" : "", dim: true },
    { cor: "#7c3aed", nome: "eMulti — Multiprofissional",qtd: `${emulti.qt_pagas} (${emulti.qt_estrategica} est.)`, teto: tetos.emulti_estrategica, vl: emulti.vl_total, det: [
        `C ${BRL(emulti.vl_custeio)}`,
        `Q ${BRL(emulti.vl_qualidade)}`,
        ...(emulti.vl_atend_remoto > 0 ? [`AR ${BRL(emulti.vl_atend_remoto)}`] : []),
      ].join(" · ") },
    { cor: "#059669", nome: "eSB — Saúde Bucal",         qtd: `${esb.qt_40h_pagas_modal_i}+${esb.qt_uom} UOM`, teto: tetos.sb_40h, vl: esb.vl_total_sb_calculado, det: `C ${BRL(esb.vl_esb_40h)} · Q ${BRL(esb.vl_qualidade_40h)} · LRPD ${BRL(esb.vl_lrpd_municipal)}` },
    { cor: "#d97706", nome: "ACS — Agentes Comunitários",qtd: `${acs.qt_direto_pago}`, teto: acs.qt_teto, vl: acs.vl_total, det: acs.qt_direto_pago > 0 ? `${BRL(acs.vl_total / acs.qt_direto_pago)}/ACS` : "—" },
    ...(esfrb.qt_pagas > 0 ? [{ cor: "#ea580c", nome: "eSFRB — Ribeirinha", qtd: `${esfrb.qt_pagas}`, teto: null as number | null, vl: esfrb.vl_total, det: `C ${BRL(esfrb.vl_custeio)} · Q ${BRL(esfrb.vl_qualidade)} · V ${BRL(esfrb.vl_vinculo)} · Ext ${BRL(esfrb.vl_extra)}` }] : []),
    ...(microscopistas.qt_pagos > 0 ? [{ cor: "#f97316", nome: "Microscopistas", qtd: `${microscopistas.qt_pagos}`, teto: null as number | null, vl: microscopistas.vl_total, det: microscopistas.qt_pagos > 0 ? `${BRL(microscopistas.vl_total / microscopistas.qt_pagos)}/mic` : "—" }] : []),
    { cor: "#0891b2", nome: "Per capita populacional", qtd: `${per_capita.populacao.toLocaleString("pt-BR")} hab`, teto: null as number | null, vl: per_capita.vl_pagamento, det: `${BRL(per_capita.vl_pagamento / Math.max(per_capita.populacao, 1))}/hab` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
      {/* Indicadores de qualidade */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
        {indicadores.map(it => (
          <div key={it.label} style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, color: C.textSec, marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{it.label}</div>
            <BadgeClass val={it.val} />
          </div>
        ))}
      </div>

      {/* Tabela de equipes */}
      <div style={{ overflowX: "auto" as const, borderRadius: 8, border: `1px solid ${C.grayBdr}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Componente", "Qtd Pagas", "Teto", "Valor Total", "Detalhes"].map((h, i) => (
                <th key={h} style={{
                  padding: "9px 12px", textAlign: (i >= 1 && i <= 2 ? "center" : i === 3 ? "right" : "left") as "center" | "right" | "left",
                  fontWeight: 700, color: C.textSec, borderBottom: `1px solid ${C.grayBdr}`,
                  whiteSpace: "nowrap" as const, fontSize: 11,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {equipes.map((eq, i) => (
              <tr key={i} style={{ opacity: (eq as { dim?: boolean }).dim ? 0.5 : 1, borderTop: `1px solid ${C.grayBdr}` }}>
                <td style={{ padding: "9px 12px", color: C.textPri }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: eq.cor, flexShrink: 0 }} />
                    {eq.nome}
                  </span>
                </td>
                <td style={{ padding: "9px 12px", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{eq.qtd}</td>
                <td style={{ padding: "9px 12px", textAlign: "center", color: C.textSec, fontVariantNumeric: "tabular-nums" }}>{eq.teto ?? "—"}</td>
                <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: C.money, fontVariantNumeric: "tabular-nums" }}>{eq.vl > 0 ? BRL(eq.vl) : "—"}</td>
                <td style={{ padding: "9px 12px", textAlign: "right", color: C.textSec, fontSize: 11 }}>{eq.det}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: C.textMut }}>
        Fonte: e-Gestor APS (tipoRelatorio=COMPLETO) · {data.coletado_em ? new Date(data.coletado_em).toLocaleString("pt-BR") : ""}
      </p>
    </div>
  );
}

// ─── Painel de detalhe de competência ─────────────────────────────────────────
function DetalhePanel({ nuParcela, competencia }: { nuParcela: string; competencia: string }) {
  const [aba, setAba] = useState<"componentes" | "equipes">("componentes");

  const { data, isLoading, error } = useQuery<CompetenciaDetalhe>({
    queryKey: ["repasse-detalhe-v2", nuParcela],
    queryFn: () => apiGet(`/api/repasses-aps/competencias/${nuParcela}`),
    staleTime: 300_000,
  });

  if (isLoading) return (
    <div style={{ background: "#f8fafc", padding: "20px 28px", borderTop: `1px solid ${C.grayBdr}`, fontSize: 13, color: C.textSec, display: "flex", gap: 8, alignItems: "center" }}>
      <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} />
      Consultando e-Gestor APS para {competencia}…
    </div>
  );

  if (error || !data) return (
    <div style={{ background: C.redBg, padding: "16px 28px", borderTop: `1px solid ${C.redBdr}` }}>
      <p style={{ color: C.red, fontSize: 13, margin: 0 }}>Não foi possível obter dados da API do e-Gestor APS.</p>
      <a href="https://relatorioaps.saude.gov.br/gerenciaaps/pagamento" target="_blank" rel="noopener noreferrer"
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: C.blue, marginTop: 6 }}>
        <ExternalLink size={11} /> Consultar diretamente no e-Gestor APS
      </a>
    </div>
  );

  const componentes = data.componentes ?? [];
  const total = data.total_oficial;
  const ABAS = [
    { id: "componentes", label: "Componentes" },
    { id: "equipes", label: "Equipes e Indicadores" },
  ] as const;

  return (
    <div style={{ background: "#f8fafc", borderTop: `1px solid ${C.grayBdr}`, padding: "20px 28px" }}>
      {/* Cabeçalho do detalhe */}
      <div style={{ display: "flex", flexWrap: "wrap" as const, alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: C.textPri }}>
          {data.competencia} — {BRL(total)}
        </span>
        <BadgeConciliacao ok={data.conciliado} />
        {data.nu_comp_cnes && (
          <span style={{ fontSize: 11, color: C.textSec }}>
            Comp. CNES: {data.nu_comp_cnes.replace(/(\d{4})(\d{2})/, "$1/$2")}
          </span>
        )}
      </div>

      {/* Barra de composição */}
      {componentes.filter(c => c.vl_total > 0).length > 0 && (
        <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", gap: 2, marginBottom: 16 }}>
          {componentes.filter(c => c.vl_total > 0).map(c => (
            <div key={c.co_seq}
              style={{ background: COMP_COLORS[c.co_seq] ?? C.gray, width: pct(c.vl_total, total) }}
              title={`${c.descricao}: ${BRL(c.vl_total)}`}
            />
          ))}
        </div>
      )}

      {/* Legenda da barra */}
      {componentes.filter(c => c.vl_total > 0).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10, marginBottom: 16 }}>
          {componentes.filter(c => c.vl_total > 0).map(c => (
            <div key={c.co_seq} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.textSec }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: COMP_COLORS[c.co_seq] ?? C.gray, flexShrink: 0 }} />
              {c.descricao}: {BRL(c.vl_total)} ({pct(c.vl_total, total)})
            </div>
          ))}
        </div>
      )}

      {/* Abas */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.grayBdr}`, marginBottom: 16 }}>
        {ABAS.map(a => {
          const ativo = aba === a.id;
          return (
            <button key={a.id} onClick={() => setAba(a.id)}
              style={{
                padding: "8px 16px", fontSize: 13, fontWeight: ativo ? 700 : 400,
                color: ativo ? C.blue : C.textSec,
                background: "none", border: "none",
                borderBottom: ativo ? `2px solid ${C.blue}` : "2px solid transparent",
                cursor: "pointer",
              }}>
              {a.label}
            </button>
          );
        })}
      </div>

      {/* Aba Componentes */}
      {aba === "componentes" && (
        <>
          {componentes.length > 0 ? (
            <div style={{ overflowX: "auto" as const, borderRadius: 8, border: `1px solid ${C.grayBdr}` }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Componente", "Custeio", "Implantação", "Total", "%"].map((h, i) => (
                      <th key={h} style={{
                        padding: "9px 12px",
                        textAlign: (i === 0 ? "left" : "right") as "left" | "right",
                        fontWeight: 700, color: C.textSec, borderBottom: `1px solid ${C.grayBdr}`,
                        fontSize: 11,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {componentes.map((c, i) => (
                    <tr key={c.co_seq} style={{
                      borderTop: `1px solid ${C.grayBdr}`,
                      background: i % 2 === 1 ? C.rowAlt : C.white,
                      opacity: c.vl_total === 0 ? 0.4 : 1,
                    }}>
                      <td style={{ padding: "9px 12px", color: C.textPri }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: COMP_COLORS[c.co_seq] ?? C.gray, flexShrink: 0 }} />
                          {c.descricao}
                        </span>
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", color: C.textSec, fontVariantNumeric: "tabular-nums" }}>{c.vl_custeio > 0 ? BRL(c.vl_custeio) : "—"}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", color: C.textSec, fontVariantNumeric: "tabular-nums" }}>{c.vl_implantacao > 0 ? BRL(c.vl_implantacao) : "—"}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: C.textPri, fontVariantNumeric: "tabular-nums" }}>{BRL(c.vl_total)}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", color: C.textMut, fontSize: 11 }}>{pct(c.vl_total, total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${C.grayBdr2}`, background: "#f1f5f9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: C.textPri }}>Total</td>
                    <td colSpan={2} />
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: C.money, fontVariantNumeric: "tabular-nums" }}>{BRL(total)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: C.textSec, fontSize: 11 }}>100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p style={{ color: C.textSec, fontSize: 13 }}>Dado ainda não disponibilizado pela fonte oficial para esta competência.</p>
          )}

          {!data.conciliado && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "flex-start", gap: 8,
              background: C.redBg, border: `1px solid ${C.redBdr}`, borderRadius: 8, padding: "10px 14px" }}>
              <AlertTriangle size={14} color={C.red} style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: C.red }}>
                Divergência: soma dos componentes ({BRL(data.soma_componentes)}) ≠ total oficial ({BRL(total)}).
              </span>
            </div>
          )}
        </>
      )}

      {/* Aba Equipes */}
      {aba === "equipes" && <PainelEquipes nuParcela={nuParcela} />}

      {/* Rodapé do detalhe */}
      <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap" as const, gap: 12, fontSize: 11, color: C.textMut }}>
        <span>Coletado em: {data.coletado_em ? new Date(data.coletado_em).toLocaleString("pt-BR") : "—"}</span>
        <a href="https://relatorioaps.saude.gov.br/gerenciaaps/pagamento" target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.blue }}>
          <ExternalLink size={10} /> Ver no e-Gestor APS
        </a>
      </div>
    </div>
  );
}

// ─── Linha da tabela principal ────────────────────────────────────────────────
function LinhaCompetencia({
  c, anterior, isOpen, onToggle, idx,
}: {
  c: CompetenciaResumo; anterior?: CompetenciaResumo;
  isOpen: boolean; onToggle: () => void; idx: number;
}) {
  const [hover, setHover] = useState(false);
  const variacao = anterior
    ? ((c.total_oficial - anterior.total_oficial) / anterior.total_oficial) * 100
    : null;

  return (
    <>
      <tr
        onClick={onToggle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          cursor: "pointer",
          background: isOpen ? C.blueLight : hover ? C.rowHover : idx % 2 === 1 ? C.rowAlt : C.white,
          transition: "background .12s",
          borderTop: `1px solid ${C.grayBdr}`,
        }}
      >
        <td style={{ padding: "12px 16px", fontWeight: 600, color: C.textPri }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: C.blue, flexShrink: 0 }}>
              {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </span>
            {c.competencia}
          </span>
        </td>
        <td style={{ padding: "12px 16px", textAlign: "center", color: C.textSec, fontSize: 12 }}>
          {c.parcela}
        </td>
        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: C.money, fontVariantNumeric: "tabular-nums" }}>
          {BRL(c.total_oficial)}
        </td>
        <td style={{ padding: "12px 16px", textAlign: "center", fontSize: 12 }}>
          {variacao != null ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11,
              color: variacao >= 0 ? C.green : C.red, fontWeight: 700 }}>
              {variacao >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {variacao >= 0 ? "+" : ""}{variacao.toFixed(1)}%
            </span>
          ) : <span style={{ color: C.textMut }}>—</span>}
        </td>
        <td style={{ padding: "12px 16px", textAlign: "center" }}>
          <BadgeConciliacao ok={c.conciliado} />
        </td>
        <td style={{ padding: "12px 16px", textAlign: "center" }}>
          <BadgeFonte />
        </td>
        <td style={{ padding: "12px 16px", textAlign: "center" }}>
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            style={{
              background: isOpen ? C.blue : "transparent",
              color: isOpen ? C.white : C.blue,
              border: `1px solid ${C.blue}`, borderRadius: 6,
              padding: "4px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}
          >
            {isOpen ? "Fechar" : "Detalhes"}
          </button>
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={7} style={{ padding: 0 }}>
            <DetalhePanel nuParcela={c.nu_parcela} competencia={c.competencia} />
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
// ─── Componente APS (conteúdo original preservado integralmente) ─────────────
function ApsPanel() {
  const qc = useQueryClient();
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroConciliacao, setFiltroConciliacao] = useState<"todos" | "conciliado" | "divergente">("todos");
  const [refetchMsg, setRefetchMsg] = useState<"" | "ok" | "err">("");

  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useQuery<ListaResponse>({
    queryKey: ["repasses-aps-lista"],
    queryFn: () => apiGet("/api/repasses-aps/competencias"),
    staleTime: 300_000,
  });

  const toggle = (nu: string) =>
    setExpandidos(prev => {
      const s = new Set(prev);
      s.has(nu) ? s.delete(nu) : s.add(nu);
      return s;
    });

  const handleRefetch = async () => {
    try {
      await refetch();
      setRefetchMsg("ok");
      setTimeout(() => setRefetchMsg(""), 3000);
    } catch {
      setRefetchMsg("err");
      setTimeout(() => setRefetchMsg(""), 3000);
    }
  };

  const competencias = data?.competencias ?? [];
  const total = data?.total_periodo ?? 0;
  const media = competencias.length > 0 ? total / competencias.length : 0;
  const ultima = competencias[competencias.length - 1];
  const penultima = competencias[competencias.length - 2];
  const variacaoUltima = ultima && penultima
    ? ((ultima.total_oficial - penultima.total_oficial) / penultima.total_oficial) * 100
    : null;

  // Dados do gráfico
  const dadosGrafico = useMemo(() =>
    competencias.map(c => ({
      competencia: c.competencia.replace("/20", "/"),
      valor: c.total_oficial,
      nu_parcela: c.nu_parcela,
    })), [competencias]);

  // Filtros
  const competenciasFiltradas = useMemo(() =>
    competencias.filter(c => {
      const matchBusca = filtroBusca === "" ||
        c.competencia.toLowerCase().includes(filtroBusca.toLowerCase()) ||
        c.parcela.toLowerCase().includes(filtroBusca.toLowerCase());
      const matchConc = filtroConciliacao === "todos" ||
        (filtroConciliacao === "conciliado" && c.conciliado) ||
        (filtroConciliacao === "divergente" && !c.conciliado);
      return matchBusca && matchConc;
    }), [competencias, filtroBusca, filtroConciliacao]);

  const totalFiltrado = competenciasFiltradas.reduce((s, c) => s + c.total_oficial, 0);

  // Cor das barras do gráfico
  const getBarColor = (nu_parcela: string, index: number) => {
    const isLast = index === dadosGrafico.length - 1;
    return isLast ? C.blue : "#93c5fd";
  };

  return (
    <div>
      {/* CSS para animação */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .cards-grid { grid-template-columns: 1fr 1fr !important; }
          .header-actions { flex-direction: column !important; align-items: stretch !important; }
          .header-row { flex-direction: column !important; }
          .filters-row { flex-direction: column !important; }
        }
        @media (max-width: 400px) {
          .cards-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div>

        {/* ── CABEÇALHO ── */}
        <div className="header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20, flexWrap: "wrap" as const }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ background: C.blue, borderRadius: 8, padding: "6px 8px", display: "flex" }}>
                <DollarSign size={18} color="#fff" />
              </div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.textPri }}>
                Repasses Federais da Atenção Primária à Saúde
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: C.textSec }}>
              Apuí/AM · IBGE 130014 · Ciclo financeiro 2026 · Fonte: API e-Gestor APS
            </p>
          </div>

          <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
            {refetchMsg === "ok" && (
              <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>
                <CheckCircle size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
                Atualizado!
              </span>
            )}
            {refetchMsg === "err" && (
              <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>
                <XCircle size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
                Falha ao atualizar
              </span>
            )}
            <button
              onClick={handleRefetch}
              disabled={isFetching}
              aria-label="Atualizar dados do e-Gestor APS"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 8,
                padding: "8px 16px", fontSize: 13, fontWeight: 600, color: C.textPri,
                cursor: isFetching ? "not-allowed" : "pointer",
                opacity: isFetching ? 0.6 : 1,
              }}
            >
              <RefreshCw size={13} style={isFetching ? { animation: "spin 1s linear infinite" } : {}} />
              {isFetching ? "Atualizando…" : "Atualizar dados"}
            </button>
            <a
              href="https://relatorioaps.saude.gov.br/gerenciaaps/pagamento"
              target="_blank" rel="noopener noreferrer"
              aria-label="Exportar — ver no e-Gestor APS"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: C.blue, color: C.white, border: "none", borderRadius: 8,
                padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                textDecoration: "none",
              }}
            >
              <Download size={13} /> Ver fonte oficial
            </a>
          </div>
        </div>

        {/* ── BANNER DE FONTE OFICIAL ── */}
        <div style={{
          background: C.greenBg, border: `1px solid ${C.greenBdr}`,
          borderRadius: 10, padding: "10px 16px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const,
        }}>
          <CheckCircle size={15} color={C.green} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: "#166534", flex: 1 }}>
            <strong>Fonte oficial verificada:</strong>{" "}
            <a href="https://relatorioaps.saude.gov.br" target="_blank" rel="noopener noreferrer"
              style={{ color: "#166534", fontWeight: 700 }}>
              e-Gestor APS — Ministério da Saúde/SAPS
            </a>
            {" "}(relatorioaps-prd.saude.gov.br) · Nenhum valor é simulado ou estimado.
          </div>
          {data?.data_consulta_egestor && (
            <span style={{ fontSize: 11, color: "#166534", whiteSpace: "nowrap" as const }}>
              <Calendar size={10} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Consulta: {data.data_consulta_egestor}
            </span>
          )}
        </div>

        {/* ── ESTADO DE CARREGAMENTO ── */}
        {isLoading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.textSec }}>
            <RefreshCw size={32} color={C.blue} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 14 }}>Consultando API do e-Gestor APS…</p>
          </div>
        )}

        {/* ── ESTADO DE ERRO ── */}
        {error && (
          <div style={{ background: C.redBg, border: `1px solid ${C.redBdr}`, borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <XCircle size={18} color={C.red} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: "0 0 4px", fontWeight: 700, color: C.red, fontSize: 14 }}>
                  Não foi possível conectar ao e-Gestor APS
                </p>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "#991b1b" }}>
                  A integração com a fonte oficial está temporariamente indisponível.
                </p>
                <a href="https://relatorioaps.saude.gov.br/gerenciaaps/pagamento" target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: C.blue }}>
                  <ExternalLink size={11} /> Consultar diretamente no e-Gestor APS
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── CARDS DE INDICADORES ── */}
        {!isLoading && competencias.length > 0 && (
          <div className="cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
            <SummaryCard
              titulo="Total acumulado"
              valor={BRL(total)}
              subtitulo="Ciclo 2026 — dados oficiais"
              Icon={DollarSign}
              cor={C.money}
              corBg="#dcfce7"
            />
            <SummaryCard
              titulo="Competências disponíveis"
              valor={`${competencias.length} de 12`}
              subtitulo={`${12 - competencias.length} ainda não publicadas`}
              Icon={Calendar}
              cor={C.blue}
              corBg={C.blueLight}
            />
            <SummaryCard
              titulo="Média mensal"
              valor={BRL(media)}
              subtitulo="Por competência disponível"
              Icon={BarChart2}
              cor="#7c3aed"
              corBg="#f3e8ff"
            />
            <SummaryCard
              titulo={`Última: ${ultima?.competencia ?? "—"}`}
              valor={ultima ? BRL(ultima.total_oficial) : "—"}
              subtitulo="vs. mês anterior"
              variacao={variacaoUltima}
              Icon={TrendingUp}
              cor={C.money}
              corBg="#dcfce7"
            />
          </div>
        )}

        {/* ── GRÁFICO DE EVOLUÇÃO ── */}
        {!isLoading && dadosGrafico.length > 0 && (
          <div style={{
            background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12,
            padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,.04)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPri }}>
                  Evolução mensal dos repasses
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: C.textSec }}>
                  Ciclo 2026 · NOV/2025 a JUN/2026 · valores em R$
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.blue }} />
                <span style={{ fontSize: 11, color: C.textSec }}>Última competência</span>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#93c5fd" }} />
                <span style={{ fontSize: 11, color: C.textSec }}>Anteriores</span>
              </div>
            </div>

            <div aria-label="Gráfico de barras com evolução dos repasses APS por competência">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dadosGrafico} margin={{ top: 4, right: 16, left: 60, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="competencia"
                    tick={{ fontSize: 11, fill: C.textSec }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: C.textSec }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f0f4ff" }} />
                  <ReferenceLine y={media} stroke={C.amber} strokeDasharray="4 4" strokeWidth={1.5}
                    label={{ value: "Média", position: "insideTopRight", fill: C.amber, fontSize: 10 }} />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {dadosGrafico.map((entry, index) => (
                      <Cell key={entry.nu_parcela} fill={getBarColor(entry.nu_parcela, index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p style={{ margin: "8px 0 0", fontSize: 10, color: C.textMut, textAlign: "center" }}>
              Linha tracejada = média mensal ({BRL(media)}). Dados obtidos em tempo real do e-Gestor APS.
            </p>
          </div>
        )}

        {/* ── FILTROS ── */}
        {!isLoading && competencias.length > 0 && (
          <div style={{
            background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12,
            padding: "14px 20px", marginBottom: 0,
            borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
            borderBottom: "none",
          }}>
            <div className="filters-row" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" as const }}>
              <Filter size={13} color={C.textSec} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textSec, marginRight: 4 }}>Filtros:</span>

              {/* Busca */}
              <div style={{ position: "relative" as const, flex: "1 1 180px", maxWidth: 260 }}>
                <Search size={12} color={C.textMut} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  aria-label="Buscar competência"
                  placeholder="Buscar competência…"
                  value={filtroBusca}
                  onChange={e => setFiltroBusca(e.target.value)}
                  style={{
                    width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
                    border: `1px solid ${C.grayBdr}`, borderRadius: 6, fontSize: 12,
                    color: C.textPri, background: C.grayLight, outline: "none",
                    boxSizing: "border-box" as const,
                  }}
                />
              </div>

              {/* Conciliação */}
              <select
                aria-label="Filtrar por situação de conciliação"
                value={filtroConciliacao}
                onChange={e => setFiltroConciliacao(e.target.value as typeof filtroConciliacao)}
                style={{
                  padding: "6px 10px", border: `1px solid ${C.grayBdr}`, borderRadius: 6,
                  fontSize: 12, color: C.textPri, background: C.grayLight, cursor: "pointer",
                }}
              >
                <option value="todos">Todas as conciliações</option>
                <option value="conciliado">Conciliado ✓</option>
                <option value="divergente">Com divergência ✗</option>
              </select>

              {/* Limpar */}
              {(filtroBusca || filtroConciliacao !== "todos") && (
                <button
                  onClick={() => { setFiltroBusca(""); setFiltroConciliacao("todos"); }}
                  aria-label="Limpar filtros"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    background: "none", border: `1px solid ${C.grayBdr}`, borderRadius: 6,
                    padding: "6px 10px", fontSize: 11, color: C.textSec, cursor: "pointer",
                  }}
                >
                  <X size={11} /> Limpar
                </button>
              )}

              <span style={{ marginLeft: "auto", fontSize: 11, color: C.textSec }}>
                {competenciasFiltradas.length} de {competencias.length} competências
              </span>
            </div>
          </div>
        )}

        {/* ── TABELA DE COMPETÊNCIAS ── */}
        {!isLoading && competenciasFiltradas.length > 0 && (
          <div style={{
            background: C.white, border: `1px solid ${C.grayBdr}`,
            borderRadius: 12, borderTopLeftRadius: 0, borderTopRightRadius: 0,
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,.04)",
          }}>
            <div style={{ overflowX: "auto" as const }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: `2px solid ${C.grayBdr}` }}>
                    {[
                      { label: "Competência", align: "left" },
                      { label: "Parcela",     align: "center" },
                      { label: "Total Oficial", align: "right" },
                      { label: "Variação", align: "center" },
                      { label: "Conciliação", align: "center" },
                      { label: "Fonte", align: "center" },
                      { label: "Ações", align: "center" },
                    ].map(h => (
                      <th key={h.label} style={{
                        padding: "11px 16px", textAlign: h.align as "left" | "center" | "right",
                        fontWeight: 700, color: C.textSec, fontSize: 11,
                        textTransform: "uppercase" as const, letterSpacing: "0.04em",
                        whiteSpace: "nowrap" as const,
                      }}>
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {competenciasFiltradas.map((c, idx) => {
                    const idxOriginal = competencias.indexOf(c);
                    return (
                      <LinhaCompetencia
                        key={c.nu_parcela}
                        c={c}
                        anterior={idxOriginal > 0 ? competencias[idxOriginal - 1] : undefined}
                        isOpen={expandidos.has(c.nu_parcela)}
                        onToggle={() => toggle(c.nu_parcela)}
                        idx={idx}
                      />
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${C.grayBdr2}`, background: "#f1f5f9" }}>
                    <td colSpan={2} style={{ padding: "12px 16px", fontWeight: 700, color: C.textPri, fontSize: 13 }}>
                      <FileText size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                      Total acumulado do ciclo
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 800, color: C.money, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
                      {BRL(filtroConciliacao !== "todos" || filtroBusca ? totalFiltrado : total)}
                    </td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Mensagem sem resultados */}
        {!isLoading && competencias.length > 0 && competenciasFiltradas.length === 0 && (
          <div style={{
            background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12,
            padding: "40px 24px", textAlign: "center", color: C.textSec,
          }}>
            <Search size={28} color={C.textMut} style={{ marginBottom: 10 }} />
            <p style={{ margin: 0, fontSize: 14 }}>Nenhuma competência encontrada com os filtros aplicados.</p>
            <button onClick={() => { setFiltroBusca(""); setFiltroConciliacao("todos"); }}
              style={{ marginTop: 12, background: "none", border: `1px solid ${C.blue}`, color: C.blue,
                borderRadius: 6, padding: "6px 16px", fontSize: 12, cursor: "pointer" }}>
              Limpar filtros
            </button>
          </div>
        )}

        {/* ── RODAPÉ ── */}
        {!isLoading && (
          <div style={{
            marginTop: 24, padding: "16px 20px",
            background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12,
            display: "flex", flexWrap: "wrap" as const, justifyContent: "space-between",
            alignItems: "center", gap: 12, fontSize: 11, color: C.textSec,
          }}>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 16, alignItems: "center" }}>
              <span>
                <strong style={{ color: C.textPri }}>{competencias.length}</strong> competências disponíveis
              </span>
              <span>
                <strong style={{ color: C.textPri }}>{competencias.filter(c => c.conciliado).length}</strong> conciliadas
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <CheckCircle size={11} color={C.green} />
                Sincronizado com e-Gestor APS
              </span>
              {dataUpdatedAt > 0 && (
                <span>
                  Última atualização: {new Date(dataUpdatedAt).toLocaleString("pt-BR")}
                </span>
              )}
            </div>
            <a href="https://relatorioaps.saude.gov.br" target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.blue, fontSize: 11 }}>
              <ExternalLink size={10} /> relatorioaps.saude.gov.br
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Execução Financeira ──────────────────────────────────────────────────────
const SITUACAO_COR: Record<string, [string, string, string]> = {
  "Pago":       ["#059669", "#f0fdf4", "#bbf7d0"],
  "Liquidado":  ["#1565c0", "#e3f0ff", "#bfdbfe"],
  "Empenhado":  ["#d97706", "#fffbeb", "#fde68a"],
  "Pendente":   ["#dc2626", "#fef2f2", "#fecaca"],
};

function BadgeSit({ sit }: { sit: string }) {
  const [cor, bg, bdr] = SITUACAO_COR[sit] ?? ["#6b7280", "#f4f6f8", "#e4e7ec"];
  return <Badge cor={cor} bg={bg} bdr={bdr}>{sit}</Badge>;
}

type ExecucaoItem = {
  id: number; recurso: string; bloco: string; dotacao: number;
  empenhado: number; liquidado: number; pago: number;
  fornecedor: string; contrato: string; conta_pagadora: string;
  situacao: string; percentual: number;
};

type ModalTipo = "empenho" | "liquidacao" | "pagamento" | "portaria" | "documento" | null;

function ExecucaoFinanceiraPanel() {
  const qc = useQueryClient();
  const [filtroBloco, setFiltroBloco] = useState("Todos");
  const [filtroSit, setFiltroSit] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [expandido, setExpandido] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalTipo>(null);
  const [alvoId, setAlvoId] = useState<number | null>(null);

  // Formulários
  const [fEmpenho, setFEmpenho] = useState({
    recurso: "", bloco: "", dotacao: "", numero_empenho: "", data_empenho: "",
    empenhado: "", fornecedor: "", cnpj_fornecedor: "", contrato: "", conta_pagadora: "", portaria: "", observacao: "",
  });
  const [fLiq, setFLiq] = useState({ data_liquidacao: "", liquidado: "", nota_fiscal: "", observacao: "" });
  const [fPag, setFPag] = useState({ data_pagamento: "", pago: "", numero_ob: "", observacao: "" });
  const [fPort, setFPort] = useState({ portaria: "" });
  const [erroForm, setErroForm] = useState("");
  const [buscaBloco, setBuscaBloco] = useState("");
  const [blocoAberto, setBlocoAberto] = useState(false);
  const [buscaPort, setBuscaPort] = useState("");
  const [portAberto, setPortAberto] = useState(false);
  const [docArquivo, setDocArquivo] = useState<File | null>(null);
  const [docsReg, setDocsReg] = useState<{id:number;nome:string;tipo_mime:string;tamanho_kb:number;criado_em:string}[]>([]);
  const [modalEmail, setModalEmail] = useState(false);
  const [emailDest, setEmailDest] = useState("");
  const [emailMsg, setEmailMsg] = useState<"" | "ok" | "err">("");

  const { data: itens = [], isLoading } = useQuery<ExecucaoItem[]>({
    queryKey: ["execucao-financeira-fns"],
    queryFn: () => apiGet("/api/execucao-fns"),
    staleTime: 300_000,
    retry: false,
  });

  const mutEmpenho = useMutation({
    mutationFn: (body: object) => apiPost("/api/execucao-fns/empenho", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["execucao-financeira-fns"] }); setModal(null); setErroForm(""); },
    onError: () => setErroForm("Erro ao salvar. Verifique os campos e tente novamente."),
  });
  const mutLiq = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) => apiPut(`/api/execucao-fns/${id}/liquidacao`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["execucao-financeira-fns"] }); setModal(null); setErroForm(""); },
    onError: () => setErroForm("Erro ao registrar liquidação."),
  });
  const mutPag = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) => apiPut(`/api/execucao-fns/${id}/pagamento`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["execucao-financeira-fns"] }); setModal(null); setErroForm(""); },
    onError: () => setErroForm("Erro ao registrar pagamento."),
  });
  const mutPort = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) => apiPut(`/api/execucao-fns/${id}/portaria`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["execucao-financeira-fns"] }); setModal(null); setErroForm(""); },
    onError: () => setErroForm("Erro ao vincular portaria."),
  });
  const mutDoc = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) => apiPost(`/api/execucao-fns/${id}/documentos`, body),
    onSuccess: (data) => {
      setDocsReg(prev => [data as any, ...prev]);
      setDocArquivo(null);
      setErroForm("");
    },
    onError: () => setErroForm("Erro ao anexar documento."),
  });

  const { data: portariasDisp = [] } = useQuery<string[]>({
    queryKey: ["portarias-fns"],
    queryFn: () => apiGet("/api/execucao-fns/portarias"),
    staleTime: 600_000,
  });

  const abrirModal = (tipo: ModalTipo, id?: number) => {
    setErroForm("");
    setAlvoId(id ?? null);
    setModal(tipo);
  };

  const submeterEmpenho = () => {
    if (!fEmpenho.recurso.trim()) return setErroForm("Informe o recurso.");
    if (!fEmpenho.dotacao) return setErroForm("Informe o valor da dotação.");
    mutEmpenho.mutate({
      ...fEmpenho,
      dotacao: parseFloat(fEmpenho.dotacao),
      empenhado: parseFloat(fEmpenho.empenhado || "0"),
    });
  };
  const submeterLiq = () => {
    if (!alvoId) return;
    if (!fLiq.data_liquidacao || !fLiq.liquidado) return setErroForm("Informe data e valor.");
    mutLiq.mutate({ id: alvoId, body: { ...fLiq, liquidado: parseFloat(fLiq.liquidado) } });
  };
  const submeterPag = () => {
    if (!alvoId) return;
    if (!fPag.data_pagamento || !fPag.pago) return setErroForm("Informe data e valor.");
    mutPag.mutate({ id: alvoId, body: { ...fPag, pago: parseFloat(fPag.pago) } });
  };
  const submeterPort = () => {
    if (!alvoId) return;
    if (!fPort.portaria.trim()) return setErroForm("Informe a portaria.");
    mutPort.mutate({ id: alvoId, body: fPort });
  };

  const submeterDoc = async () => {
    if (!alvoId || !docArquivo) return setErroForm("Selecione um arquivo.");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const b64 = (ev.target?.result as string).split(",")[1] ?? "";
      mutDoc.mutate({
        id: alvoId,
        body: {
          nome:         docArquivo.name,
          tipo_mime:    docArquivo.type || "application/octet-stream",
          tamanho_kb:   Math.round(docArquivo.size / 1024),
          conteudo_b64: b64,
        },
      });
    };
    reader.readAsDataURL(docArquivo);
  };

  const abrirDocumentos = async (id: number) => {
    setAlvoId(id);
    setModal("documento");
    setErroForm("");
    setDocArquivo(null);
    try {
      const res = await apiGet(`/api/execucao-fns/${id}/documentos`);
      setDocsReg(res as any);
    } catch { setDocsReg([]); }
  };

  const gerarPDF = () => {
    const janela = window.open("", "_blank", "width=1100,height=800");
    if (!janela) return;
    const linhas = filtrados.map(it => `
      <tr>
        <td>${it.recurso}</td><td>${it.bloco || "—"}</td>
        <td class="num">${BRL(it.dotacao)}</td>
        <td class="num am">${BRL(it.empenhado)}</td>
        <td class="num bl">${BRL(it.liquidado)}</td>
        <td class="num vl">${BRL(it.pago)}</td>
        <td class="num gn">${BRL(it.dotacao - it.pago)}</td>
        <td class="num">${it.percentual.toFixed(1)}%</td>
        <td>${it.fornecedor || "—"}</td>
        <td>${it.situacao}</td>
      </tr>`).join("");
    janela.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
      <title>Execução Financeira FNS — Apuí/AM</title>
      <style>
        @page { size: A4 landscape; margin: 1.2cm; }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: Arial, sans-serif; font-size: 10px; color: #111; }
        .cabecalho { border-bottom: 3px solid #1565c0; padding-bottom: 10px; margin-bottom: 14px; display:flex; justify-content:space-between; }
        .titulo { font-size:16px; font-weight:800; color:#0f172a; }
        .sub { font-size:9px; color:#6b7280; margin-top:3px; }
        .cards { display:flex; gap:10px; margin-bottom:14px; }
        .card { border:1px solid #e4e7ec; border-radius:8px; padding:8px 12px; flex:1; }
        .card-label { font-size:8px; color:#6b7280; text-transform:uppercase; font-weight:700; }
        .card-val { font-size:13px; font-weight:800; margin-top:2px; }
        table { width:100%; border-collapse:collapse; }
        thead { background:#f4f6f8; }
        th { padding:6px 8px; text-align:left; font-size:9px; text-transform:uppercase; color:#6b7280; border-bottom:2px solid #e4e7ec; }
        td { padding:6px 8px; border-bottom:1px solid #f0f0f0; font-size:9px; }
        tr:nth-child(even) { background:#fafbfc; }
        .num { text-align:right; font-variant-numeric:tabular-nums; }
        .am { color:#d97706; } .bl { color:#1565c0; } .vl { color:#7c3aed; } .gn { color:#059669; }
        .rodape { margin-top:14px; font-size:8px; color:#9ca3af; border-top:1px solid #e4e7ec; padding-top:8px; display:flex; justify-content:space-between; }
        @media print { body{-webkit-print-color-adjust:exact;print-color-adjust:exact;} }
      </style></head><body>
      <div class="cabecalho">
        <div>
          <div class="titulo">CONTROLE FINANCEIRO FNS — APUÍ · Execução Financeira</div>
          <div class="sub">Município Apuí/AM · FMS CNPJ 12.834.320/0001-26 · IBGE 130014 · Exercício ${new Date().getFullYear()}</div>
        </div>
        <div style="text-align:right;font-size:9px;color:#6b7280">
          Gerado em: ${new Date().toLocaleString("pt-BR")}<br/>
          ERSUS 360 — Sistema de Gestão em Saúde
        </div>
      </div>
      <div class="cards">
        <div class="card"><div class="card-label">Dotação / Recebido</div><div class="card-val" style="color:#059669">${BRL(totalDot)}</div></div>
        <div class="card"><div class="card-label">Total empenhado</div><div class="card-val" style="color:#d97706">${BRL(totalEmp)}</div></div>
        <div class="card"><div class="card-label">Total liquidado</div><div class="card-val" style="color:#1565c0">${BRL(totalLiq)}</div></div>
        <div class="card"><div class="card-label">Total pago</div><div class="card-val" style="color:#7c3aed">${BRL(totalPago)}</div></div>
        <div class="card"><div class="card-label">Saldo livre</div><div class="card-val">${BRL(saldo)}</div></div>
        <div class="card"><div class="card-label">% Executado</div><div class="card-val">${pctExec}${pctExec !== "—" ? "%" : ""}</div></div>
      </div>
      <table>
        <thead><tr>
          <th>Recurso</th><th>Bloco</th><th>Dotação</th><th>Empenhado</th>
          <th>Liquidado</th><th>Pago</th><th>Saldo</th><th>% Exec.</th>
          <th>Fornecedor</th><th>Situação</th>
        </tr></thead>
        <tbody>${linhas || '<tr><td colspan="10" style="text-align:center;padding:20px;color:#6b7280">Nenhum registro cadastrado</td></tr>'}</tbody>
      </table>
      <div class="rodape">
        <span>Fonte: ERSUS 360 / FMS Apuí/AM · Dados registrados pela equipe de gestão.</span>
        <span>Página 1</span>
      </div>
    </body></html>`);
    janela.document.close();
    setTimeout(() => { janela.focus(); janela.print(); }, 400);
  };

  const enviarEmail = async () => {
    if (!emailDest.trim() || !emailDest.includes("@")) {
      setEmailMsg("err"); return;
    }
    try {
      await apiPost("/api/execucao-fns/email", {
        destinatario: emailDest,
        exercicio: 2026,
        total_dot: totalDot, total_emp: totalEmp,
        total_liq: totalLiq, total_pago: totalPago,
        saldo, pct_exec: pctExec,
        registros: filtrados.length,
      });
      setEmailMsg("ok");
      setTimeout(() => { setModalEmail(false); setEmailMsg(""); setEmailDest(""); }, 2000);
    } catch {
      setEmailMsg("err");
    }
  };

  const totalDot  = itens.reduce((s, i) => s + i.dotacao, 0);
  const totalEmp  = itens.reduce((s, i) => s + i.empenhado, 0);
  const totalLiq  = itens.reduce((s, i) => s + i.liquidado, 0);
  const totalPago = itens.reduce((s, i) => s + i.pago, 0);
  const saldo     = totalDot - totalPago;
  const pctExec   = totalDot > 0 ? ((totalPago / totalDot) * 100).toFixed(1) : "—";

  const blocos  = ["Todos", ...Array.from(new Set(itens.map(i => i.bloco)))];
  const sits    = ["Todos", "Empenhado", "Liquidado", "Pago", "Pendente"];

  const filtrados = itens.filter(i => {
    const mb = filtroBloco === "Todos" || i.bloco === filtroBloco;
    const ms = filtroSit   === "Todos" || i.situacao === filtroSit;
    const mq = busca === "" || i.recurso.toLowerCase().includes(busca.toLowerCase()) ||
               i.fornecedor.toLowerCase().includes(busca.toLowerCase());
    return mb && ms && mq;
  });

  const KD = { background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12,
    padding: "16px 18px", flex: "1 1 0", minWidth: 140 };
  const KL = { fontSize: 11, fontWeight: 600 as const, color: C.textSec, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: 6 };
  const KV = { fontSize: 20, fontWeight: 800 as const, color: C.textPri, fontVariantNumeric: "tabular-nums" as const };

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 20 }}>

      {/* ── Aviso de não duplicar ── */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10,
        padding: "10px 16px", display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12, color: "#1e40af" }}>
        <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Os valores registrados aqui referem-se à <strong>execução dos recursos FNS já recebidos</strong>.
          Não somam automaticamente com os valores do e-Gestor APS ou do FNS. Somente valores conciliados participam do consolidado.
        </span>
      </div>

      {/* ── Fluxo de execução ── */}
      <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
          Fluxo de execução financeira
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" as const }}>
          {[
            { label: "Repasse recebido", valor: BRL(totalDot), cor: "#059669", bg: "#f0fdf4" },
            { label: "Empenho", valor: BRL(totalEmp), cor: "#d97706", bg: "#fffbeb" },
            { label: "Liquidação", valor: BRL(totalLiq), cor: "#1565c0", bg: "#e3f0ff" },
            { label: "Pagamento", valor: BRL(totalPago), cor: "#7c3aed", bg: "#f3e8ff" },
            { label: "Saldo livre", valor: BRL(saldo), cor: "#059669", bg: "#f0fdf4" },
          ].map((f, i, arr) => (
            <div key={f.label} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ background: f.bg, border: `1px solid ${f.cor}22`, borderRadius: 10,
                padding: "10px 16px", textAlign: "center" as const, minWidth: 110 }}>
                <div style={{ fontSize: 10, color: f.cor, fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: f.cor, fontVariantNumeric: "tabular-nums" as const }}>{f.valor}</div>
              </div>
              {i < arr.length - 1 && (
                <ChevronRight size={18} color={C.grayBdr2} style={{ margin: "0 4px" }} />
              )}
            </div>
          ))}
          <div style={{ marginLeft: 16, background: C.grayLight, borderRadius: 10, padding: "10px 16px", textAlign: "center" as const }}>
            <div style={{ fontSize: 10, color: C.textSec, fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 4 }}>% Executado</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.textPri }}>{pctExec}{pctExec !== "—" ? "%" : ""}</div>
          </div>
        </div>
      </div>

      {/* ── Cards de resumo ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
        {[
          { label: "Dotação / Recebido", valor: BRL(totalDot), cor: "#059669" },
          { label: "Total empenhado",    valor: BRL(totalEmp), cor: "#d97706" },
          { label: "Total liquidado",    valor: BRL(totalLiq), cor: "#1565c0" },
          { label: "Total pago",         valor: BRL(totalPago), cor: "#7c3aed" },
          { label: "Saldo a pagar",      valor: BRL(saldo), cor: C.textPri },
        ].map(k => (
          <div key={k.label} style={KD}>
            <div style={KL}>{k.label}</div>
            <div style={{ ...KV, color: k.cor }}>{k.valor}</div>
          </div>
        ))}
      </div>

      {/* ── Barra de ações ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "center" }}>
        <button onClick={() => abrirModal("empenho")}
          style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          + Cadastrar empenho
        </button>
        <button onClick={() => abrirModal("liquidacao", itens.length > 0 ? itens[0].id : undefined)}
          style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Registrar liquidação
        </button>
        <button onClick={() => abrirModal("pagamento", itens.length > 0 ? itens[0].id : undefined)}
          style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Registrar pagamento
        </button>
        <button onClick={() => abrirModal("portaria", itens.length > 0 ? itens[0].id : undefined)}
          style={{ background: "#6b7280", color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Vincular portaria
        </button>
        <button onClick={() => itens.length > 0 ? abrirDocumentos(itens[0].id) : setErroForm("Cadastre um empenho primeiro.")}
          style={{ background: "#059669", color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Anexar documento
        </button>
        <button onClick={gerarPDF}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#dc2626", color: "#fff",
            border: "none", borderRadius: 8, padding: "8px 14px",
            fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <FileText size={13} /> Gerar PDF
        </button>
        <button onClick={() => setModalEmail(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: C.white,
            border: `1px solid ${C.grayBdr}`, borderRadius: 8, padding: "8px 14px",
            fontSize: 12, fontWeight: 600, color: C.textPri, cursor: "pointer" }}>
          <Download size={13} /> Enviar por e-mail
        </button>
        {erroForm && (
          <span style={{ fontSize: 12, color: C.red, fontWeight: 600 }}>{erroForm}</span>
        )}
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "center" }}>
        <div style={{ position: "relative" as const, flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: "absolute" as const, left: 10, top: "50%", transform: "translateY(-50%)", color: C.textSec }} />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar recurso ou fornecedor…"
            style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              border: `1px solid ${C.grayBdr}`, borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />
        </div>
        <select value={filtroBloco} onChange={e => setFiltroBloco(e.target.value)}
          style={{ border: `1px solid ${C.grayBdr}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, background: C.white }}>
          {blocos.map(b => <option key={b}>{b}</option>)}
        </select>
        <select value={filtroSit} onChange={e => setFiltroSit(e.target.value)}
          style={{ border: `1px solid ${C.grayBdr}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, background: C.white }}>
          {sits.map(s => <option key={s}>{s}</option>)}
        </select>
        {(busca || filtroBloco !== "Todos" || filtroSit !== "Todos") && (
          <button onClick={() => { setBusca(""); setFiltroBloco("Todos"); setFiltroSit("Todos"); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.textSec, display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
            <X size={13} /> Limpar
          </button>
        )}
      </div>

      {/* ── Tabela ── */}
      <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" as const }}>
          <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.grayLight, borderBottom: `2px solid ${C.grayBdr}` }}>
                {["Recurso / Bloco", "Dotação", "Empenhado", "Liquidado", "Pago", "Saldo", "% Exec.", "Fornecedor", "Conta", "Situação", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left" as const, fontWeight: 700,
                    color: C.textSec, fontSize: 11, textTransform: "uppercase" as const, whiteSpace: "nowrap" as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={11} style={{ textAlign: "center" as const, padding: 40, color: C.textSec }}>
                  <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
                </td></tr>
              )}
              {!isLoading && filtrados.length === 0 && (
                <tr><td colSpan={11}>
                  <div style={{ textAlign: "center" as const, padding: "48px 24px", color: C.textSec }}>
                    <FileText size={36} color={C.grayBdr} style={{ marginBottom: 12 }} />
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: C.textPri }}>
                      Nenhum registro de execução cadastrado
                    </div>
                    <div style={{ fontSize: 12, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
                      Use os botões acima para cadastrar empenhos, liquidações e pagamentos
                      vinculados aos recursos do Fundo Nacional de Saúde recebidos por Apuí/AM.
                    </div>
                    <div style={{ marginTop: 16, fontSize: 11, color: C.textMut }}>
                      Colunas disponíveis: Recurso · Bloco · Dotação · Empenho · Liquidação · Pagamento · Fornecedor · Contrato · Nota Fiscal · Conta Pagadora · Saldo · % Execução · Documentos
                    </div>
                  </div>
                </td></tr>
              )}
              {!isLoading && filtrados.map((it, idx) => (
                <>
                  <tr key={it.id} style={{ background: idx % 2 === 0 ? C.white : C.rowAlt,
                    borderBottom: `1px solid ${C.grayBdr}`, cursor: "pointer" }}
                    onClick={() => setExpandido(expandido === it.id ? null : it.id)}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: C.textPri }}>
                      <div>{it.recurso}</div>
                      <div style={{ fontSize: 10, color: C.textSec }}>{it.bloco}</div>
                    </td>
                    <td style={{ padding: "10px 14px", fontVariantNumeric: "tabular-nums" }}>{BRL(it.dotacao)}</td>
                    <td style={{ padding: "10px 14px", fontVariantNumeric: "tabular-nums", color: "#d97706" }}>{BRL(it.empenhado)}</td>
                    <td style={{ padding: "10px 14px", fontVariantNumeric: "tabular-nums", color: "#1565c0" }}>{BRL(it.liquidado)}</td>
                    <td style={{ padding: "10px 14px", fontVariantNumeric: "tabular-nums", color: "#7c3aed" }}>{BRL(it.pago)}</td>
                    <td style={{ padding: "10px 14px", fontVariantNumeric: "tabular-nums", color: "#059669" }}>{BRL(it.dotacao - it.pago)}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 60, height: 6, background: C.grayBdr, borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${it.percentual}%`, height: "100%", background: "#059669", borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 11 }}>{it.percentual.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", color: C.textSec }}>{it.fornecedor || "—"}</td>
                    <td style={{ padding: "10px 14px", color: C.textSec }}>{it.conta_pagadora || "—"}</td>
                    <td style={{ padding: "10px 14px" }}><BadgeSit sit={it.situacao} /></td>
                    <td style={{ padding: "10px 8px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
                        <button onClick={e => { e.stopPropagation(); abrirModal("liquidacao", it.id); }}
                          style={{ background: "#1565c0", color: "#fff", border: "none", borderRadius: 6,
                            padding: "4px 8px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
                          Liquidar
                        </button>
                        <button onClick={e => { e.stopPropagation(); abrirModal("pagamento", it.id); }}
                          style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6,
                            padding: "4px 8px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
                          Pagar
                        </button>
                        <button onClick={e => { e.stopPropagation(); abrirModal("portaria", it.id); }}
                          style={{ background: "#6b7280", color: "#fff", border: "none", borderRadius: 6,
                            padding: "4px 8px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
                          Portaria
                        </button>
                        <button onClick={e => { e.stopPropagation(); abrirDocumentos(it.id); }}
                          style={{ background: "#059669", color: "#fff", border: "none", borderRadius: 6,
                            padding: "4px 8px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
                          Docs
                        </button>
                        <button onClick={e => { e.stopPropagation(); setExpandido(expandido === it.id ? null : it.id); }}
                          style={{ background: "none", border: `1px solid ${C.grayBdr}`, borderRadius: 6,
                            padding: "4px 8px", fontSize: 10, cursor: "pointer", color: C.blue }}>
                          {expandido === it.id ? "Fechar" : "Fluxo"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandido === it.id && (
                    <tr key={`${it.id}-det`}><td colSpan={11} style={{ background: "#f8faff", padding: "16px 20px", borderBottom: `1px solid ${C.grayBdr}` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, marginBottom: 10 }}>
                        FLUXO COMPLETO — {it.recurso}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                        {[
                          { label: "Repasse", valor: BRL(it.dotacao), ok: true },
                          { label: "Empenho", valor: BRL(it.empenhado), ok: it.empenhado > 0 },
                          { label: "Liquidação", valor: BRL(it.liquidado), ok: it.liquidado > 0 },
                          { label: "Pagamento", valor: BRL(it.pago), ok: it.pago > 0 },
                          { label: "Mov. Bancária", valor: "—", ok: false },
                          { label: "Documentos", valor: it.contrato || "—", ok: !!it.contrato },
                        ].map((f, fi, fa) => (
                          <div key={f.label} style={{ display: "flex", alignItems: "center" }}>
                            <div style={{ background: f.ok ? "#f0fdf4" : C.grayLight,
                              border: `1px solid ${f.ok ? "#bbf7d0" : C.grayBdr}`, borderRadius: 8, padding: "8px 12px", minWidth: 100 }}>
                              <div style={{ fontSize: 10, color: f.ok ? "#059669" : C.textSec, fontWeight: 700, marginBottom: 3 }}>{f.label}</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: f.ok ? "#059669" : C.textMut }}>{f.valor}</div>
                            </div>
                            {fi < fa.length - 1 && <ChevronRight size={14} color={C.grayBdr2} style={{ margin: "0 2px" }} />}
                          </div>
                        ))}
                      </div>
                    </td></tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && filtrados.length > 0 && (
          <div style={{ padding: "12px 16px", background: "#f8faff", borderTop: `1px solid ${C.grayBdr}`,
            display: "flex", gap: 24, fontSize: 12, color: C.textSec, flexWrap: "wrap" as const }}>
            <span><strong style={{ color: C.textPri }}>{filtrados.length}</strong> registros</span>
            <span>Dotação: <strong style={{ color: C.textPri }}>{BRL(totalDot)}</strong></span>
            <span>Empenhado: <strong style={{ color: "#d97706" }}>{BRL(totalEmp)}</strong></span>
            <span>Pago: <strong style={{ color: "#7c3aed" }}>{BRL(totalPago)}</strong></span>
            <span>Saldo: <strong style={{ color: "#059669" }}>{BRL(saldo)}</strong></span>
          </div>
        )}
      </div>

      {/* ── MODAIS ── */}
      {modal && (
        <div style={{ position: "fixed" as const, inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div style={{ background: C.white, borderRadius: 16, padding: "28px 28px 24px", width: "100%",
            maxWidth: 540, boxShadow: "0 20px 60px rgba(0,0,0,.2)", maxHeight: "90vh", overflowY: "auto" as const }}>

            {/* Cabeçalho do modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.textPri }}>
                {modal === "empenho"   && "Cadastrar Empenho"}
                {modal === "liquidacao" && "Registrar Liquidação"}
                {modal === "pagamento" && "Registrar Pagamento"}
                {modal === "portaria"  && "Vincular Portaria"}
                {modal === "documento" && "Documentos Anexados"}
              </h2>
              <button onClick={() => setModal(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.textSec }}>
                <X size={20} />
              </button>
            </div>

            {erroForm && (
              <div style={{ background: C.redBg, border: `1px solid ${C.redBdr}`, borderRadius: 8,
                padding: "10px 14px", marginBottom: 16, fontSize: 12, color: C.red, fontWeight: 600 }}>
                {erroForm}
              </div>
            )}

            {/* ── Modal: Empenho ── */}
            {modal === "empenho" && (() => {
              const inp = (label: string, key: keyof typeof fEmpenho, tipo = "text", placeholder = "") => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.textSec, display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>{label}</label>
                  <input type={tipo} value={fEmpenho[key]} placeholder={placeholder}
                    onChange={e => setFEmpenho(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: "100%", border: `1px solid ${C.grayBdr}`, borderRadius: 8,
                      padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />
                </div>
              );
              const BLOCOS_FNS = [
                "Atenção Primária à Saúde",
                "PAP — Piso da Atenção Primária",
                "Vigilância em Saúde",
                "Média e Alta Complexidade (MAC)",
                "Assistência Farmacêutica",
                "Gestão do SUS",
                "Investimentos em Saúde",
                "MS Programa — Ministério da Saúde",
                "Emenda Individual — Parlamentar",
                "Emenda de Comissão",
                "Emenda de Bancada",
                "Emenda de Relator",
                "Custeio",
                "Investimento",
                "Pagamento de Pessoal",
                "Saneamento",
                "Saúde Indígena",
                "Alimentação e Nutrição",
                "Outro",
              ];
              const blocosFiltrados = BLOCOS_FNS.filter(b =>
                b.toLowerCase().includes(buscaBloco.toLowerCase())
              );
              return (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                    {inp("Recurso / Descrição *", "recurso")}
                    {/* Bloco — select com busca */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: C.textSec, display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>Bloco</label>
                      <div style={{ position: "relative" as const }}>
                        <Search size={12} style={{ position: "absolute" as const, left: 10, top: "50%", transform: "translateY(-50%)", color: C.textSec, pointerEvents: "none" as const }} />
                        <input
                          value={blocoAberto ? buscaBloco : fEmpenho.bloco}
                          placeholder="Clique ou digite para buscar…"
                          onFocus={() => { setBlocoAberto(true); setBuscaBloco(""); }}
                          onBlur={() => setTimeout(() => setBlocoAberto(false), 150)}
                          onChange={e => { setBuscaBloco(e.target.value); setFEmpenho(p => ({ ...p, bloco: e.target.value })); }}
                          style={{ width: "100%", paddingLeft: 30, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                            border: `1px solid ${blocoAberto ? C.blue : C.grayBdr}`, borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" as const,
                            boxShadow: blocoAberto ? `0 0 0 3px ${C.blueLight}` : "none" }} />
                        {fEmpenho.bloco && !blocoAberto && (
                          <button onClick={() => { setFEmpenho(p => ({ ...p, bloco: "" })); setBuscaBloco(""); }}
                            style={{ position: "absolute" as const, right: 8, top: "50%", transform: "translateY(-50%)",
                              background: "none", border: "none", cursor: "pointer", color: C.textSec, display: "flex" }}>
                            <X size={13} />
                          </button>
                        )}
                      </div>
                      {blocoAberto && (
                        <div style={{ border: `1px solid ${C.grayBdr}`, borderRadius: 8, marginTop: 4, background: C.white,
                          boxShadow: "0 4px 16px rgba(0,0,0,.12)", maxHeight: 200, overflowY: "auto" as const,
                          zIndex: 20, position: "relative" as const }}>
                          {blocosFiltrados.length === 0 ? (
                            <div style={{ padding: "10px 14px", fontSize: 12, color: C.textSec }}>
                              Nenhum bloco encontrado
                            </div>
                          ) : blocosFiltrados.map(b => (
                            <div key={b}
                              onMouseDown={() => { setFEmpenho(p => ({ ...p, bloco: b })); setBuscaBloco(""); setBlocoAberto(false); }}
                              style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer",
                                borderBottom: `1px solid ${C.grayLight}`,
                                background: fEmpenho.bloco === b ? C.blueLight : C.white,
                                color: fEmpenho.bloco === b ? C.blue : C.textPri,
                                fontWeight: fEmpenho.bloco === b ? 700 : 400 }}
                              onMouseEnter={e => { if (fEmpenho.bloco !== b) e.currentTarget.style.background = "#f8faff"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = fEmpenho.bloco === b ? C.blueLight : C.white; }}>
                              {b}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {inp("Dotação (R$) *", "dotacao", "number", "0,00")}
                    {inp("Valor empenhado (R$)", "empenhado", "number", "0,00")}
                    {inp("Nº do empenho", "numero_empenho")}
                    {inp("Data do empenho", "data_empenho", "date")}
                    {inp("Fornecedor", "fornecedor")}
                    {inp("CNPJ do fornecedor", "cnpj_fornecedor")}
                    {inp("Contrato / Instrumento", "contrato")}
                    {inp("Conta pagadora", "conta_pagadora")}
                    {inp("Portaria vinculada", "portaria")}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.textSec, display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>Observação</label>
                    <textarea value={fEmpenho.observacao} rows={2}
                      onChange={e => setFEmpenho(p => ({ ...p, observacao: e.target.value }))}
                      style={{ width: "100%", border: `1px solid ${C.grayBdr}`, borderRadius: 8,
                        padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" as const, resize: "vertical" as const }} />
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => setModal(null)}
                      style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 8,
                        padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Cancelar
                    </button>
                    <button onClick={submeterEmpenho} disabled={mutEmpenho.isPending}
                      style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 8,
                        padding: "9px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                        opacity: mutEmpenho.isPending ? 0.6 : 1 }}>
                      {mutEmpenho.isPending ? "Salvando…" : "Salvar empenho"}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── Modal: Liquidação ── */}
            {modal === "liquidacao" && (
              <div>
                {alvoId === null ? (
                  <div style={{ marginBottom: 16 }}>
                    {itens.length === 0 ? (
                      <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 10, padding: "14px 16px" }}>
                        <p style={{ margin: "0 0 10px", fontSize: 13, color: "#92400e", fontWeight: 600 }}>Nenhum empenho cadastrado.</p>
                        <button onClick={() => setModal("empenho")}
                          style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          + Cadastrar empenho agora
                        </button>
                      </div>
                    ) : (
                      <>
                        <label style={{ fontSize: 11, fontWeight: 700, color: C.textSec, display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>Empenho *</label>
                        <select onChange={e => setAlvoId(Number(e.target.value))}
                          style={{ width: "100%", border: `1px solid ${C.grayBdr}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" as const }}>
                          <option value="">Selecione o registro…</option>
                          {itens.map(i => <option key={i.id} value={i.id}>#{i.id} — {i.recurso}</option>)}
                        </select>
                      </>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: C.textSec, marginBottom: 16 }}>
                    Registro ID: <strong>{alvoId}</strong> — {itens.find(i => i.id === alvoId)?.recurso}
                  </p>
                )}
                {[
                  { label: "Data da liquidação *", key: "data_liquidacao", tipo: "date" },
                  { label: "Valor liquidado (R$) *", key: "liquidado", tipo: "number" },
                  { label: "Nº da nota fiscal", key: "nota_fiscal", tipo: "text" },
                  { label: "Observação", key: "observacao", tipo: "text" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.textSec, display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>{f.label}</label>
                    <input type={f.tipo} value={(fLiq as Record<string, string>)[f.key]}
                      onChange={e => setFLiq(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: "100%", border: `1px solid ${C.grayBdr}`, borderRadius: 8,
                        padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => setModal(null)}
                    style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 8,
                      padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                  <button onClick={submeterLiq} disabled={mutLiq.isPending || !alvoId}
                    style={{ background: "#1565c0", color: "#fff", border: "none", borderRadius: 8,
                      padding: "9px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      opacity: (mutLiq.isPending || !alvoId) ? 0.6 : 1 }}>
                    {mutLiq.isPending ? "Salvando…" : "Registrar liquidação"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Modal: Pagamento ── */}
            {modal === "pagamento" && (
              <div>
                {alvoId === null ? (
                  <div style={{ marginBottom: 16 }}>
                    {itens.length === 0 ? (
                      <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 10, padding: "14px 16px" }}>
                        <p style={{ margin: "0 0 10px", fontSize: 13, color: "#92400e", fontWeight: 600 }}>Nenhum empenho cadastrado.</p>
                        <button onClick={() => setModal("empenho")}
                          style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          + Cadastrar empenho agora
                        </button>
                      </div>
                    ) : (
                      <>
                        <label style={{ fontSize: 11, fontWeight: 700, color: C.textSec, display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>Empenho *</label>
                        <select onChange={e => setAlvoId(Number(e.target.value))}
                          style={{ width: "100%", border: `1px solid ${C.grayBdr}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" as const }}>
                          <option value="">Selecione o registro…</option>
                          {itens.map(i => <option key={i.id} value={i.id}>#{i.id} — {i.recurso}</option>)}
                        </select>
                      </>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: C.textSec, marginBottom: 16 }}>
                    Registro ID: <strong>{alvoId}</strong> — {itens.find(i => i.id === alvoId)?.recurso}
                  </p>
                )}
                {[
                  { label: "Data do pagamento *", key: "data_pagamento", tipo: "date" },
                  { label: "Valor pago (R$) *", key: "pago", tipo: "number" },
                  { label: "Nº da Ordem Bancária (OB)", key: "numero_ob", tipo: "text" },
                  { label: "Observação", key: "observacao", tipo: "text" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.textSec, display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>{f.label}</label>
                    <input type={f.tipo} value={(fPag as Record<string, string>)[f.key]}
                      onChange={e => setFPag(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: "100%", border: `1px solid ${C.grayBdr}`, borderRadius: 8,
                        padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => setModal(null)}
                    style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 8,
                      padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                  <button onClick={submeterPag} disabled={mutPag.isPending || !alvoId}
                    style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8,
                      padding: "9px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      opacity: (mutPag.isPending || !alvoId) ? 0.6 : 1 }}>
                    {mutPag.isPending ? "Salvando…" : "Registrar pagamento"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Modal: Portaria ── */}
            {modal === "portaria" && (() => {
              const portariasFiltradas = portariasDisp.filter(p =>
                p.toLowerCase().includes(buscaPort.toLowerCase())
              );
              return (
                <div>
                  {/* Seletor de registro quando aberto sem row */}
                  {alvoId === null ? (
                    <div style={{ marginBottom: 16 }}>
                      {itens.length === 0 ? (
                        <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 10,
                          padding: "14px 16px", marginBottom: 8 }}>
                          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#92400e", fontWeight: 600 }}>
                            Nenhum empenho cadastrado ainda.
                          </p>
                          <p style={{ margin: "0 0 12px", fontSize: 12, color: "#78350f" }}>
                            Para vincular uma portaria, primeiro cadastre um empenho usando o botão abaixo.
                          </p>
                          <button onClick={() => { setModal("empenho"); }}
                            style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 8,
                              padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                            + Cadastrar empenho agora
                          </button>
                        </div>
                      ) : (
                        <>
                          <label style={{ fontSize: 11, fontWeight: 700, color: C.textSec, display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>Empenho *</label>
                          <select onChange={e => setAlvoId(Number(e.target.value))}
                            style={{ width: "100%", border: `1px solid ${C.grayBdr}`, borderRadius: 8,
                              padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" as const }}>
                            <option value="">Selecione o registro…</option>
                            {itens.map(i => <option key={i.id} value={i.id}>#{i.id} — {i.recurso}</option>)}
                          </select>
                        </>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: C.textSec, marginBottom: 16 }}>
                      Registro ID: <strong>{alvoId}</strong>{" "}
                      — {itens.find(i => i.id === alvoId)?.recurso}
                    </p>
                  )}
                  {/* Campo portaria com autocomplete */}
                  <div style={{ marginBottom: 14, position: "relative" as const }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.textSec, display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>Portaria *</label>
                    <input
                      type="text"
                      value={fPort.portaria}
                      placeholder="Buscar ou digitar portaria…"
                      onFocus={() => setPortAberto(true)}
                      onBlur={() => setTimeout(() => setPortAberto(false), 150)}
                      onChange={e => { setFPort({ portaria: e.target.value }); setBuscaPort(e.target.value); setPortAberto(true); }}
                      style={{ width: "100%", border: `1px solid ${C.grayBdr}`, borderRadius: 8,
                        padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" as const }}
                    />
                    {portAberto && portariasFiltradas.length > 0 && (
                      <div style={{ position: "absolute" as const, top: "100%", left: 0, right: 0, background: C.white,
                        border: `1px solid ${C.grayBdr}`, borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,.12)",
                        zIndex: 100, maxHeight: 200, overflowY: "auto" as const }}>
                        {portariasFiltradas.map(p => (
                          <div key={p}
                            onMouseDown={() => { setFPort({ portaria: p }); setBuscaPort(p); setPortAberto(false); }}
                            style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer", borderBottom: `1px solid ${C.grayBdr}` }}
                            onMouseEnter={e => (e.currentTarget.style.background = C.grayLight)}
                            onMouseLeave={e => (e.currentTarget.style.background = "")}>
                            {p}
                          </div>
                        ))}
                      </div>
                    )}
                    {portAberto && portariasFiltradas.length === 0 && buscaPort.length > 0 && (
                      <div style={{ position: "absolute" as const, top: "100%", left: 0, right: 0, background: C.white,
                        border: `1px solid ${C.grayBdr}`, borderRadius: 8, padding: "10px 14px",
                        fontSize: 12, color: C.textSec, zIndex: 100 }}>
                        Nenhuma portaria cadastrada — será criada nova entrada.
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: C.textSec, marginBottom: 16 }}>
                    Ex: Portaria GM/MS nº 3.493/2024 · Portaria Ministerial nº 718/2025
                  </p>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => setModal(null)}
                      style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 8,
                        padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                    <button onClick={submeterPort} disabled={mutPort.isPending || !alvoId}
                      style={{ background: "#6b7280", color: "#fff", border: "none", borderRadius: 8,
                        padding: "9px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                        opacity: (mutPort.isPending || !alvoId) ? 0.6 : 1 }}>
                      {mutPort.isPending ? "Salvando…" : "Vincular portaria"}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── Modal: Documentos ── */}
            {modal === "documento" && (
              <div>
                <p style={{ fontSize: 12, color: C.textSec, marginBottom: 16 }}>
                  Registro ID: <strong>{alvoId}</strong>{" "}
                  — {itens.find(i => i.id === alvoId)?.recurso}
                </p>

                {/* Lista de documentos existentes */}
                {docsReg.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.textSec, marginBottom: 8, textTransform: "uppercase" as const }}>
                      Documentos anexados ({docsReg.length})
                    </p>
                    {docsReg.map(d => (
                      <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 12px", background: C.grayLight, borderRadius: 8, marginBottom: 6,
                        border: `1px solid ${C.grayBdr}` }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.textPri }}>{d.nome}</span>
                          <span style={{ fontSize: 11, color: C.textSec, marginLeft: 8 }}>{d.tamanho_kb} KB</span>
                        </div>
                        <a href={`/api/execucao-fns/documentos/${d.id}/download`} target="_blank" rel="noreferrer"
                          style={{ fontSize: 11, color: C.blue, textDecoration: "none", fontWeight: 600 }}>
                          Baixar
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload novo documento */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.textSec, display: "block", marginBottom: 4, textTransform: "uppercase" as const }}>
                    Anexar novo arquivo (PDF, DOC, imagem — máx. 5 MB)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                    onChange={e => setDocArquivo(e.target.files?.[0] ?? null)}
                    style={{ fontSize: 13, width: "100%", padding: "8px 0" }}
                  />
                  {docArquivo && (
                    <p style={{ fontSize: 11, color: C.textSec, marginTop: 4 }}>
                      Selecionado: <strong>{docArquivo.name}</strong> — {Math.round(docArquivo.size / 1024)} KB
                    </p>
                  )}
                </div>

                {erroForm && <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 10 }}>{erroForm}</p>}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => setModal(null)}
                    style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 8,
                      padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Fechar</button>
                  <button onClick={submeterDoc} disabled={!docArquivo || mutDoc.isPending}
                    style={{ background: "#059669", color: "#fff", border: "none", borderRadius: 8,
                      padding: "9px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      opacity: (!docArquivo || mutDoc.isPending) ? 0.6 : 1 }}>
                    {mutDoc.isPending ? "Enviando…" : "Anexar arquivo"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

// ─── Container principal com abas ─────────────────────────────────────────────
const ABAS = [
  { id: "aps",        label: "Atenção Primária — e-Gestor APS",  desc: "Competências, parcelas, componentes, equipes" },
  { id: "fns",        label: "Repasses do Fundo Nacional de Saúde", desc: "Transferências fundo a fundo por tipo" },
  { id: "matriz",     label: "Repasses Mensais — FNS",           desc: "Tabela matricial por grupo e mês" },
  { id: "conciliacao",label: "Conciliação e-Gestor APS × FNS",   desc: "Comparativo sem dupla contagem" },
  { id: "execucao",   label: "Execução Financeira",              desc: "Empenho · Liquidação · Pagamento · Fluxo" },
] as const;

const CB = {
  blue: "#1565c0", blueLight: "#e3f0ff", white: "#ffffff",
  grayBdr: "#e4e7ec", grayLight: "#f4f6f8", textSec: "#6b7280", textPri: "#111827",
};

export default function RepassesApsApui() {
  const [aba, setAba] = useState<"aps" | "fns" | "matriz" | "conciliacao" | "execucao">("aps");

  return (
    <div style={{ background: CB.grayLight, minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 20px 60px" }}>

        {/* Cabeçalho do módulo */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: CB.textPri }}>
            CONTROLE FINANCEIRO FNS — APUÍ
          </h1>
          <p style={{ margin: "0 0 2px", fontSize: 13, color: CB.textSec }}>
            Gestão de repasses, contas bancárias, emendas, folha, obras e execução financeira do Fundo Municipal de Saúde.
          </p>
          <p style={{ margin: 0, fontSize: 12, color: CB.textSec }}>
            Município Apuí/AM · FMS CNPJ 12.834.320/0001-26 · IBGE 130014
            {" "}· Fontes: e-Gestor APS + FNS/MS
          </p>
        </div>

        {/* Abas */}
        <div style={{ display: "flex", borderBottom: `2px solid ${CB.grayBdr}`, marginBottom: 24, gap: 0,
          overflowX: "auto" as const }}>
          {ABAS.map(a => {
            const ativo = aba === a.id;
            return (
              <button key={a.id} onClick={() => setAba(a.id)}
                style={{
                  padding: "12px 20px", fontSize: 13, fontWeight: ativo ? 700 : 500,
                  color: ativo ? CB.blue : CB.textSec,
                  background: ativo ? CB.blueLight : "transparent",
                  border: "none", borderBottom: ativo ? `3px solid ${CB.blue}` : "3px solid transparent",
                  cursor: "pointer", whiteSpace: "nowrap" as const, transition: "all .15s",
                  borderRadius: "8px 8px 0 0",
                }}>
                <div>{a.label}</div>
                <div style={{ fontSize: 10, fontWeight: 400, color: ativo ? CB.blue : CB.textSec, opacity: 0.7 }}>
                  {a.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Conteúdo da aba ativa */}
        {aba === "aps"         && <ApsPanel />}
        {aba === "fns"         && <RepassesFnsPanel />}
        {aba === "matriz"      && <MatrizFnsLazy />}
        {aba === "conciliacao" && <ConciliacaoFnsPanel />}
        {aba === "execucao"    && <ExecucaoFinanceiraPanel />}
      </div>
    </div>
  );
}
