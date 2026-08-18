/**
 * RepassesApsApui — Módulo de Repasses Financeiros da APS — Apuí/AM
 * Fonte: API oficial e-Gestor APS (relatorioaps-prd.saude.gov.br)
 *
 * DIAGNÓSTICO E CORREÇÃO:
 *   O projeto NÃO usa Tailwind CSS (não está instalado nem configurado).
 *   A versão anterior usava classes Tailwind que nunca eram processadas,
 *   resultando em HTML sem estilização. Esta versão usa exclusivamente
 *   inline styles, seguindo o padrão do design system do ERSUS360.
 */
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
export default function RepassesApsApui() {
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
    <div style={{ background: C.grayLight, minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
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

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 20px 60px" }}>

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
