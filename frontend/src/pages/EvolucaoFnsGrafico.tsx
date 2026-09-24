/**
 * EvolucaoFnsGrafico — Dashboard Financeiro FNS · ERSUS 360 v3
 * Lógica de negócio preservada; apenas visual reconstruído.
 */
import { useState, useMemo, useRef, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Download, ArrowLeft,
  AlertTriangle, Info, CheckCircle, RefreshCw,
  DollarSign, BarChart2, Calendar, Activity,
} from "lucide-react";
import OrigemRecursosFns, { useOrigemRecursos, COR_ORIGEM } from "./OrigemRecursosFns";

// ─── Tipos compartilhados ─────────────────────────────────────────────────────
export interface CelulaMes {
  valor: number | null; ids: number[]; qtd: number; status_coleta: string;
}
export interface LinhaMatriz {
  grupo: string; acao: string; componente: string; tipo: string;
  bloco: string; meses: Record<string, CelulaMes>; total_anual: number;
}
export interface TabelaFns {
  exercicio: number; total_linhas: number; total_geral: number;
  totais_mensais: Record<string, number>;
  subtotais_grupo: Record<string, { meses: Record<string, number>; total: number }>;
  linhas: LinhaMatriz[];
  meses_status: Record<string, string>;
  grupos_disponiveis: string[];
  tipos_disponiveis: string[];
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  blue:    "#1351b4", blueL: "#e8f0fe", blueM: "#1976d2", blueDk: "#0c3d8a",
  green:   "#16a34a", greenL: "#f0fdf4", greenM: "#15803d",
  red:     "#dc2626", redL:  "#fef2f2",
  amber:   "#d97706", amberL: "#fffbeb",
  gray:    "#6b7280", grayL:  "#f8fafc", grayBdr: "#e2e8f0",
  text:    "#0f172a", textSec: "#475569", textMut: "#94a3b8",
  white:   "#ffffff",
};

const GRUPO_PALETA: Record<string, string> = {
  "Atenção Primária":                "#1351b4",
  "MAC — Média e Alta Complexidade": "#6a1b9a",
  "Atenção Especializada":           "#7b1fa2",
  "Assistência Farmacêutica":        "#00695c",
  "Vigilância em Saúde":             "#e65100",
  "Gestão do SUS":                   "#283593",
  "Piso Salarial da Enfermagem":     "#880e4f",
  "Emendas Parlamentares":           "#4e342e",
  "Investimentos":                   "#1b5e20",
  "Outros incentivos":               "#6b7280",
};

const MESES_ABREV = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MESES_FULL  = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                     "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

// ─── Formatação ───────────────────────────────────────────────────────────────
function fmtAbrev(v: number | null | undefined): string {
  if (v == null) return "N/D";
  if (v === 0) return "R$ 0,00";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mi`;
  if (abs >= 1_000)     return `R$ ${(v / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtBRL(v: number | null | undefined): string {
  if (v == null) return "N/D";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Status do mês ───────────────────────────────────────────────────────────
type StatusMes = "coletado" | "incompleto" | "nao_coletado" | "pendente" | "futuro";

function labelStatus(s: string): string {
  if (s === "coletado")   return "✓ Coletado";
  if (s === "incompleto") return "⚠ Incompleto";
  if (s === "pendente")   return "! Pendente";
  if (s === "futuro")     return "— Futuro";
  return "N/D";
}

function corPonto(status: string, variacao: "aumento"|"reducao"|"estavel"|null): string {
  if (status === "incompleto" || status === "pendente") return T.amber;
  if (status === "nao_coletado" || status === "futuro") return T.gray;
  if (variacao === "aumento") return T.green;
  if (variacao === "reducao") return T.red;
  return T.blue;
}

// ─── Cálculo de variação (lógica preservada) ─────────────────────────────────
interface Variacao {
  reais: number; pct: number;
  tipo: "aumento" | "reducao" | "estavel";
}

function calcVar(atual: number | null, anterior: number | null): Variacao | null {
  if (atual == null || anterior == null || anterior === 0) return null;
  const d = atual - anterior;
  const pct = (d / anterior) * 100;
  return {
    reais: d, pct,
    tipo: Math.abs(d) < 0.01 ? "estavel" : d > 0 ? "aumento" : "reducao",
  };
}

// ─── Dados mensais derivados (lógica preservada) ──────────────────────────────
interface PontoMensal {
  mes: number; label: string; labelFull: string;
  valor: number | null; status: string;
  valido: boolean;
  variacao: Variacao | null;
  cor: string;
}

function derivarPontos(
  totais: Record<string, number>,
  mesesStatus: Record<string, string>,
  mesesVisiveis: number[]
): PontoMensal[] {
  const pts: PontoMensal[] = mesesVisiveis.map(m => {
    const status = (mesesStatus[String(m)] ?? "nao_coletado") as StatusMes;
    const temValor = (totais[String(m)] ?? 0) > 0;
    const valido = status === "coletado" || (status === "incompleto" && temValor);
    const valor = valido ? (totais[String(m)] ?? null) : null;
    return { mes: m, label: MESES_ABREV[m-1], labelFull: MESES_FULL[m-1], valor, status, valido, variacao: null, cor: T.blue };
  });

  for (let i = 1; i < pts.length; i++) {
    const a = pts[i]; const b = pts[i-1];
    if (a.valido && b.valido) a.variacao = calcVar(a.valor, b.valor);
    a.cor = corPonto(a.status, a.variacao?.tipo ?? null);
  }
  if (pts.length > 0) pts[0].cor = corPonto(pts[0].status, null);
  return pts;
}

// ─── Análise automática (lógica preservada) ───────────────────────────────────
function gerarAnalise(pontos: PontoMensal[], subtotaisGrupo: TabelaFns["subtotais_grupo"]): string[] {
  const validos = pontos.filter(p => p.valido);
  if (validos.length < 2) return ["Dados insuficientes para análise automática."];
  const linhas: string[] = [];
  const max = validos.reduce((a, b) => (b.valor ?? 0) > (a.valor ?? 0) ? b : a);
  const min = validos.reduce((a, b) => (b.valor ?? 0) < (a.valor ?? 0) ? b : a);
  const aumentos = validos.filter(p => p.variacao?.tipo === "aumento");
  const reducoes = validos.filter(p => p.variacao?.tipo === "reducao");
  linhas.push(`O maior repasse do período foi em ${max.labelFull} (${fmtBRL(max.valor)}).`);
  if (min.mes !== max.mes) linhas.push(`O menor valor registrado foi em ${min.labelFull} (${fmtBRL(min.valor)}).`);
  if (aumentos.length > 0) {
    const ma = aumentos.reduce((a, b) => (b.variacao!.reais > a.variacao!.reais ? b : a));
    linhas.push(`O maior aumento ocorreu em ${ma.labelFull}: +${fmtBRL(ma.variacao!.reais)} (+${ma.variacao!.pct.toFixed(2)}%).`);
  }
  if (reducoes.length > 0) {
    const mr = reducoes.reduce((a, b) => (b.variacao!.reais < a.variacao!.reais ? b : a));
    linhas.push(`A maior redução ocorreu em ${mr.labelFull}: ${fmtBRL(mr.variacao!.reais)} (${mr.variacao!.pct.toFixed(2)}%).`);
  }
  const grupoMax = Object.entries(subtotaisGrupo)
    .map(([nome, g]) => ({ nome, val: g.meses[String(max.mes)] ?? 0 }))
    .sort((a, b) => b.val - a.val)[0];
  if (grupoMax?.val > 0) linhas.push(`Em ${max.labelFull}, o grupo "${grupoMax.nome}" foi o maior contribuinte (${fmtBRL(grupoMax.val)}).`);
  const incompletos = pontos.filter(p => p.status === "incompleto" || p.status === "pendente");
  if (incompletos.length > 0) linhas.push(`Atenção: ${incompletos.length} mês(es) com coleta incompleta — variações não calculadas nesses períodos.`);
  return linhas;
}

// ─── KPI Card executivo ───────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon, borderColor }: {
  label: string; value: string; sub?: string;
  color?: string; icon?: React.ReactNode; borderColor?: string;
}) {
  return (
    <div style={{
      background: T.white, borderRadius: 12,
      border: `1px solid ${T.grayBdr}`,
      borderTop: `3px solid ${borderColor ?? color ?? T.blue}`,
      padding: "14px 18px", flex: "1 1 150px", minWidth: 140,
      boxShadow: "0 1px 4px rgba(0,0,0,.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 10.5, color: T.textSec, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        {icon && <span style={{ color: color ?? T.blue, opacity: 0.8 }}>{icon}</span>}
      </div>
      <div style={{ fontWeight: 800, fontSize: 18, color: color ?? T.text,
        fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Seta de variação ────────────────────────────────────────────────────────
function SetaVar({ v, size = "md" }: { v: Variacao | null; size?: "sm" | "md" }) {
  const fs = size === "sm" ? 11 : 12;
  if (!v) return <span style={{ color: T.gray, fontSize: fs }}>—</span>;
  const { tipo, reais, pct } = v;
  if (tipo === "estavel") return (
    <span style={{ color: T.gray, fontSize: fs, display: "flex", alignItems: "center", gap: 3 }}>
      <Minus size={12} /> Estável
    </span>
  );
  const cor = tipo === "aumento" ? T.green : T.red;
  const Icon = tipo === "aumento" ? TrendingUp : TrendingDown;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <Icon size={13} color={cor} />
      <span style={{ color: cor, fontSize: fs, fontWeight: 700 }}>
        {tipo === "aumento" ? "+" : ""}{pct.toFixed(2)}%
      </span>
      <span style={{ color: T.textSec, fontSize: fs - 1 }}>
        ({tipo === "aumento" ? "+" : ""}{fmtAbrev(reais)})
      </span>
    </div>
  );
}

const COR_EMENDA_GLOBAL = "#7c4f1a";

// ─── Tooltip profissional ─────────────────────────────────────────────────────
function TooltipTotal({ active, payload, mediaM, onClickMes }: any) {
  if (!active || !payload?.length) return null;
  const p: PontoMensal = payload[0]?.payload;
  const acimaDaMedia = p.valor != null && mediaM > 0 && p.valor > mediaM;
  const difMedia = p.valor != null && mediaM > 0 ? p.valor - mediaM : null;

  return (
    <div style={{
      background: T.white, border: `1px solid ${T.grayBdr}`, borderRadius: 10,
      padding: "12px 16px", boxShadow: "0 8px 24px rgba(0,0,0,.12)",
      fontSize: 12, minWidth: 220, fontFamily: "Inter, system-ui, sans-serif",
    }}>
      {/* Cabeçalho */}
      <div style={{
        fontWeight: 800, color: T.blue, fontSize: 13, marginBottom: 8,
        paddingBottom: 8, borderBottom: `2px solid ${T.blue}`,
        textTransform: "uppercase", letterSpacing: "0.05em",
      }}>
        {p.labelFull.toUpperCase()} / {new Date().getFullYear()}
      </div>

      {p.valido ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ color: T.textSec }}>Total recebido</span>
            <span style={{ fontWeight: 800, color: T.green, fontSize: 14 }}>{fmtBRL(p.valor)}</span>
          </div>
          {/* Decomposição de emendas quando presente */}
          {(payload[0]?.payload as any)?.emendaChart > 0 && (() => {
            const em: number = (payload[0]?.payload as any).emendaChart;
            const semEm = (p.valor ?? 0) - em;
            const pct = p.valor ? ((em / p.valor) * 100).toFixed(1) : "0";
            return (
              <>
                <div style={{ background: "#fdf3e7", borderRadius: 6, padding: "8px 10px",
                  marginBottom: 6, border: `1px solid ${COR_EMENDA_GLOBAL}22` }}>
                  <div style={{ fontWeight: 700, color: COR_EMENDA_GLOBAL, fontSize: 11,
                    marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    📋 Emendas Parlamentares — {pct}% do total
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ color: T.textSec }}>Valor emendas</span>
                    <span style={{ fontWeight: 800, color: COR_EMENDA_GLOBAL }}>{fmtBRL(em)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: T.textSec }}>Repasse regular</span>
                    <span style={{ fontWeight: 600, color: T.textSec }}>{fmtBRL(semEm)}</span>
                  </div>
                </div>
              </>
            );
          })()}
          {p.variacao && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ color: T.textSec }}>Variação</span>
              <SetaVar v={p.variacao} size="sm" />
            </div>
          )}
          {difMedia != null && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ color: T.textSec }}>Vs. média</span>
              <span style={{ fontWeight: 700, color: acimaDaMedia ? T.green : T.red, fontSize: 11 }}>
                {acimaDaMedia ? "▲ acima" : "▼ abaixo"} ({fmtAbrev(Math.abs(difMedia))})
              </span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: T.textSec }}>Situação</span>
            <span style={{ fontWeight: 600, color: T.green, fontSize: 11 }}>✓ Coleta completa</span>
          </div>
        </>
      ) : (
        <div style={{ color: T.amber, fontWeight: 600, marginBottom: 6 }}>
          {p.status === "incompleto" ? "⚠ Coleta incompleta — dados parciais" : "— Dado não disponível"}
        </div>
      )}

      {onClickMes && p.valido && (
        <div style={{
          marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.grayBdr}`,
          color: T.blue, fontSize: 11, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <Info size={11} /> Ver detalhes deste mês
        </div>
      )}
    </div>
  );
}

// ─── Dot customizado (fix: não renderiza para incompleto sem valor) ───────────
function DotCustom(props: any) {
  const { cx, cy, payload } = props;
  if (!payload) return null;
  const p: PontoMensal = payload;
  // Não renderiza se sem dados ou se cy é inválido (incompleto sem valor)
  if (p.status === "nao_coletado" || p.status === "futuro") return null;
  if (!p.valido || p.valor == null) return null;
  const fill = p.cor;
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill={fill} stroke={T.white} strokeWidth={2.5}/>
      {(p.status === "incompleto") && (
        <circle cx={cx} cy={cy} r={10} fill="none" stroke={T.amber} strokeWidth={2} strokeDasharray="3 2"/>
      )}
    </g>
  );
}

// ─── Label valor no ponto ─────────────────────────────────────────────────────
function LabelPonto(props: any) {
  const { x, y, index, payload } = props;
  if (!payload?.valido) return null;
  const label = fmtAbrev(payload.valor);
  const offset = index % 2 === 0 ? -14 : 14;
  return (
    <text x={x} y={y + offset} textAnchor="middle" fontSize={9} fill={T.textSec} fontWeight={700}>
      {label}
    </text>
  );
}

// ─── Label da linha de média (fix: não ultrapassa borda) ──────────────────────
function LabelMedia({ viewBox, mediaM }: any) {
  if (!viewBox) return null;
  const { x, y, width } = viewBox;
  const texto = `Média: ${fmtAbrev(mediaM)}`;
  return (
    <g>
      <rect x={x + width - 140} y={y - 18} width={140} height={18} rx={4} fill="rgba(255,255,255,0.9)" />
      <text x={x + width - 4} y={y - 5} textAnchor="end" fontSize={10} fill={T.gray} fontWeight={700}>
        {texto}
      </text>
    </g>
  );
}

// ─── Gráfico de evolução de um grupo ─────────────────────────────────────────
const COR_EMENDA = "#7c4f1a";

function CardGrupo({ nome, dados, cor, emendas }: {
  nome: string; dados: PontoMensal[]; cor: string; emendas?: PontoMensal[];
}) {
  const validos = dados.filter(p => p.valido && p.valor != null);
  if (validos.length === 0) return null;
  const total = validos.reduce((s, p) => s + (p.valor ?? 0), 0);
  const media = total / validos.length;
  const max = validos.reduce((a, b) => (b.valor ?? 0) > (a.valor ?? 0) ? b : a);
  const min = validos.reduce((a, b) => (b.valor ?? 0) < (a.valor ?? 0) ? b : a);

  // Emendas válidas para este período
  const emValidAs = emendas?.filter(p => p.valido && (p.valor ?? 0) > 0) ?? [];
  const totalEmendas = emValidAs.reduce((s, p) => s + (p.valor ?? 0), 0);
  const maxEmenda = emValidAs.length > 0
    ? emValidAs.reduce((a, b) => (b.valor ?? 0) > (a.valor ?? 0) ? b : a)
    : null;

  // Juntar dados: valorChart (grupo) + emendaChart
  const chartData = dados.map(p => {
    const em = emendas?.find(e => e.mes === p.mes);
    return {
      ...p,
      valorChart:  p.valido && p.valor != null ? p.valor : undefined,
      emendaChart: em?.valido && (em.valor ?? 0) > 0 ? em.valor : undefined,
      emendaValor: em?.valido ? (em.valor ?? 0) : 0,
    };
  });

  // Tooltip enriquecido com emendas
  function TooltipGrupo({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const p = payload[0]?.payload;
    const em = p?.emendaValor ?? 0;
    const pct = p?.valorChart && p.valorChart > 0 && em > 0
      ? ((em / p.valorChart) * 100).toFixed(1) : null;
    return (
      <div style={{ background: T.white, border: `1px solid ${T.grayBdr}`, borderRadius: 10,
        padding: "12px 16px", boxShadow: "0 6px 20px rgba(0,0,0,.12)", fontSize: 12, minWidth: 210 }}>
        <div style={{ fontWeight: 800, color: cor, fontSize: 13, marginBottom: 8,
          paddingBottom: 6, borderBottom: `2px solid ${cor}` }}>
          {p?.labelFull?.toUpperCase()}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ color: T.textSec }}>Total recebido</span>
          <span style={{ fontWeight: 800, color: T.green }}>{fmtBRL(p?.valorChart)}</span>
        </div>
        {em > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: T.textSec }}>Emendas Parlamentares</span>
              <span style={{ fontWeight: 700, color: COR_EMENDA }}>{fmtBRL(em)}</span>
            </div>
            {pct && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ color: T.textSec }}>% do total</span>
                <span style={{ fontWeight: 700, color: COR_EMENDA }}>{pct}%</span>
              </div>
            )}
            {p?.valorChart && em > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ color: T.textSec }}>Sem emendas</span>
                <span style={{ fontWeight: 600, color: T.textSec }}>{fmtBRL(p.valorChart - em)}</span>
              </div>
            )}
          </>
        )}
        {p?.variacao && (
          <div style={{ paddingTop: 6, borderTop: `1px solid ${T.grayBdr}`, marginTop: 4 }}>
            <SetaVar v={p.variacao} size="sm" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: T.white, border: `1px solid ${T.grayBdr}`, borderRadius: 12,
      borderLeft: `4px solid ${cor}`, padding: "16px 20px", marginBottom: 14 }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: cor, marginBottom: 12, letterSpacing: "-0.01em" }}>
        {nome}
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {[
          { label: "Total",  val: fmtBRL(total) },
          { label: "Média",  val: fmtAbrev(media) },
          { label: "Maior",  val: `${fmtAbrev(max.valor)} (${max.label})` },
          { label: "Menor",  val: `${fmtAbrev(min.valor)} (${min.label})` },
        ].map(k => (
          <div key={k.label} style={{ flex: "1 1 120px", background: T.grayL, borderRadius: 8,
            padding: "8px 12px", border: `1px solid ${T.grayBdr}` }}>
            <div style={{ fontSize: 10, color: T.textSec, fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.05em" }}>{k.label}</div>
            <div style={{ fontWeight: 700, fontSize: 12, color: T.text, marginTop: 2 }}>{k.val}</div>
          </div>
        ))}
        {totalEmendas > 0 && (
          <div style={{ flex: "1 1 140px", background: "#fdf3e7", borderRadius: 8,
            padding: "8px 12px", border: `1px solid ${COR_EMENDA}30` }}>
            <div style={{ fontSize: 10, color: COR_EMENDA, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.05em" }}>Emendas Parl.</div>
            <div style={{ fontWeight: 700, fontSize: 12, color: COR_EMENDA, marginTop: 2 }}>
              {fmtBRL(totalEmendas)}
            </div>
            {maxEmenda && (
              <div style={{ fontSize: 10, color: COR_EMENDA, opacity: 0.8 }}>
                Pico: {fmtAbrev(maxEmenda.valor)} ({maxEmenda.label})
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legenda do gráfico */}
      {totalEmendas > 0 && (
        <div style={{ display: "flex", gap: 16, fontSize: 11, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 20, height: 3, background: cor, display: "inline-block", borderRadius: 2 }}/>
            <span style={{ color: T.textSec }}>Total do grupo</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 20, height: 0, display: "inline-block",
              borderTop: `2px dashed ${COR_EMENDA}` }}/>
            <span style={{ color: COR_EMENDA, fontWeight: 600 }}>Emendas Parlamentares</span>
          </span>
        </div>
      )}

      <ResponsiveContainer width="100%" height={totalEmendas > 0 ? 200 : 160}>
        <LineChart data={chartData} margin={{ top: 20, right: 24, left: 10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.textSec }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmtAbrev(v).replace("R$ ","")} width={65}
            axisLine={false} tickLine={false} />
          <Tooltip content={<TooltipGrupo />} />

          {/* Anotação no pico de emendas */}
          {maxEmenda && totalEmendas > 0 && (
            <ReferenceLine x={maxEmenda.label} stroke={COR_EMENDA} strokeDasharray="4 3"
              label={{
                value: `Emenda: ${fmtAbrev(maxEmenda.valor)}`,
                position: "top", fontSize: 10, fill: COR_EMENDA, fontWeight: 700,
              }}
            />
          )}

          {/* Linha principal do grupo */}
          <Line type="monotone" dataKey="valorChart" stroke={cor} strokeWidth={2.5} name="Total"
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (!payload?.valido || payload.valor == null) return <g key={`d-${props.index}`}/>;
              return <circle key={`d-${props.index}`} cx={cx} cy={cy} r={4}
                fill={cor} stroke={T.white} strokeWidth={2}/>;
            }}
            connectNulls={false}
          />

          {/* Linha de emendas (tracejada) */}
          {totalEmendas > 0 && (
            <Line
              type="monotone" dataKey="emendaChart" stroke={COR_EMENDA}
              strokeWidth={2} strokeDasharray="6 4" name="Emendas Parlamentares"
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (!payload?.emendaChart) return <g key={`em-${props.index}`}/>;
                return <circle key={`em-${props.index}`} cx={cx} cy={cy} r={4}
                  fill={COR_EMENDA} stroke={T.white} strokeWidth={2}/>;
              }}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
interface Props {
  data: TabelaFns;
  exercicio: number;
  onVoltar: () => void;
  onSincronizar?: () => void;
  isSincronizando?: boolean;
}

export default function EvolucaoFnsGrafico({ data, exercicio, onVoltar, onSincronizar, isSincronizando }: Props) {
  const [gruposSelecionados, setGruposSelecionados] = useState<string[]>([]);
  const [mostrarRotulos, setMostrarRotulos]         = useState(false);
  const [filtroVariacao, setFiltroVariacao]         = useState<"todos"|"aumentos"|"reducoes">("todos");
  const [mesInicio, setMesInicio] = useState(1);
  const [mesFim, setMesFim]       = useState(12);
  const [escalaLog, setEscalaLog] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const mesesVisiveis = useMemo(
    () => Array.from({ length: mesFim - mesInicio + 1 }, (_, i) => mesInicio + i),
    [mesInicio, mesFim]
  );

  const pontos = useMemo(
    () => derivarPontos(data.totais_mensais, data.meses_status, mesesVisiveis),
    [data, mesesVisiveis]
  );

  const pontosPorGrupo = useMemo(() => {
    const result: Record<string, PontoMensal[]> = {};
    for (const [nome, g] of Object.entries(data.subtotais_grupo)) {
      result[nome] = derivarPontos(g.meses, data.meses_status, mesesVisiveis);
    }
    return result;
  }, [data, mesesVisiveis]);

  const gruposComDados = useMemo(
    () => data.grupos_disponiveis.filter(g => pontosPorGrupo[g]?.some(p => p.valido)),
    [data.grupos_disponiveis, pontosPorGrupo]
  );

  const gruposAtivos = gruposSelecionados.length > 0 ? gruposSelecionados : gruposComDados.slice(0, 4);

  // KPIs — lógica preservada
  const pontosValidos = pontos.filter(p => p.valido && p.valor != null);
  const totalAcumulado = pontosValidos.reduce((s, p) => s + (p.valor ?? 0), 0);
  const mediaM = pontosValidos.length > 0 ? totalAcumulado / pontosValidos.length : 0;
  const maxPonto = pontosValidos.length > 0 ? pontosValidos.reduce((a, b) => (b.valor ?? 0) > (a.valor ?? 0) ? b : a) : null;
  const minPonto = pontosValidos.length > 0 ? pontosValidos.reduce((a, b) => (b.valor ?? 0) < (a.valor ?? 0) ? b : a) : null;
  const qtdAumentos = pontos.filter(p => p.variacao?.tipo === "aumento").length;
  const qtdReducoes = pontos.filter(p => p.variacao?.tipo === "reducao").length;
  const qtdIncomp   = pontos.filter(p => p.status === "incompleto" || p.status === "pendente").length;
  const qtdCompletos = pontosValidos.filter(p => p.status === "coletado").length;

  const lastCompleto = [...pontosValidos].filter(p => p.status === "coletado").pop();

  const analise = useMemo(() => gerarAnalise(pontos, data.subtotais_grupo), [pontos, data]);

  const { data: origem } = useOrigemRecursos(exercicio);

  const dataMultiLinha = useMemo(() => mesesVisiveis.map(m => {
    const row: Record<string, any> = { mes: m, label: MESES_ABREV[m-1] };
    for (const g of gruposAtivos) {
      const pt = pontosPorGrupo[g]?.find(p => p.mes === m);
      row[g] = pt?.valido ? pt.valor : undefined;
    }
    // Emendas Parlamentares como série separada no gráfico de grupos
    const emPt = (pontosPorGrupo["Emendas Parlamentares"] ?? []).find(e => e.mes === m);
    row["__emendas__"] = emPt?.valido && (emPt.valor ?? 0) > 0 ? emPt.valor : undefined;
    return row;
  }), [mesesVisiveis, gruposAtivos, pontosPorGrupo]);

  const pontosFiltrados = useMemo(() => {
    if (filtroVariacao === "aumentos") return pontos.filter(p => p.variacao?.tipo === "aumento");
    if (filtroVariacao === "reducoes") return pontos.filter(p => p.variacao?.tipo === "reducao");
    return pontos;
  }, [pontos, filtroVariacao]);

  // Dados chart: meses incompletos sem valor = undefined (não conecta)
  const emPts = pontosPorGrupo["Emendas Parlamentares"] ?? [];
  const chartTotalData = pontos.map(p => {
    const em = emPts.find(e => e.mes === p.mes);
    return {
      ...p,
      valorChart:  (p.valido && p.valor != null) ? p.valor : undefined,
      emendaChart: (em?.valido && (em.valor ?? 0) > 0) ? em.valor : undefined,
    };
  });
  const totalEmendas = emPts.filter(e => e.valido && (e.valor ?? 0) > 0).reduce((s, e) => s + (e.valor ?? 0), 0);
  const maxEmendaPonto = emPts.filter(e => e.valido && (e.valor ?? 0) > 0).length > 0
    ? emPts.filter(e => e.valido && (e.valor ?? 0) > 0).reduce((a, b) => (b.valor ?? 0) > (a.valor ?? 0) ? b : a)
    : null;

  const toggleGrupo = useCallback((g: string) => {
    setGruposSelecionados(prev => {
      const base = prev.length === 0 ? gruposComDados.slice(0, 4) : prev;
      return base.includes(g) ? base.filter(x => x !== g) : [...base, g];
    });
  }, [gruposComDados]);

  const exportarPDF = useCallback(() => {
    const area = document.getElementById("ersus-print-area");
    const content = chartRef.current;
    if (!area || !content) return;
    area.innerHTML = `
      <div style="font-family:Inter,system-ui,sans-serif;color:#0f172a">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1351b4;padding-bottom:10px;margin-bottom:14px">
          <div>
            <div style="font-size:18px;font-weight:800;color:#0f172a">CONTROLE FINANCEIRO FNS — APUÍ · Evolução por Grupo</div>
            <div style="font-size:10px;color:#6b7280">FMS Apuí/AM · CNPJ 12.834.320/0001-26 · IBGE 1300144 · Exercício ${exercicio}</div>
          </div>
          <div style="text-align:right;font-size:10px;color:#6b7280">
            Gerado em: ${new Date().toLocaleDateString("pt-BR")}<br/>Fonte: consultafns.saude.gov.br
          </div>
        </div>
        ${content.innerHTML}
      </div>`;
    area.style.zoom = "0.45";
    setTimeout(() => { window.print(); setTimeout(() => { area.style.zoom = ""; area.innerHTML = ""; }, 800); }, 200);
  }, [exercicio]);

  // ─── Estilo base da seção ─────────────────────────────────────────────────
  const secCard: React.CSSProperties = {
    background: T.white, border: `1px solid ${T.grayBdr}`, borderRadius: 14,
    padding: "20px 24px", marginBottom: 20,
    boxShadow: "0 1px 6px rgba(0,0,0,.05)",
  };
  const secTitle: React.CSSProperties = {
    fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 4,
    fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.02em",
  };
  const secSub: React.CSSProperties = {
    fontSize: 12, color: T.textSec, marginBottom: 16,
  };

  return (
    <div ref={chartRef} style={{ fontFamily: "Inter, system-ui, sans-serif", color: T.text }}>

      {/* ── Barra de navegação ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={onVoltar} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
          background: T.white, border: `1px solid ${T.grayBdr}`, borderRadius: 8,
          fontSize: 12, cursor: "pointer", fontWeight: 600, color: T.text,
          boxShadow: "0 1px 3px rgba(0,0,0,.05)",
        }}>
          <ArrowLeft size={14} /> Voltar ao Relatório
        </button>

        <div style={{ fontSize: 12, color: T.textSec }}>
          Apuí/AM · CNPJ 12.834.320/0001-26 · Exercício {exercicio}
          {" "}·{" "}
          <a href="https://consultafns.saude.gov.br" target="_blank" rel="noreferrer"
            style={{ color: T.blue }}>consultafns.saude.gov.br</a>
        </div>

        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          {onSincronizar && (
            <button onClick={onSincronizar} disabled={isSincronizando} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              background: T.white, border: `1px solid ${T.grayBdr}`, borderRadius: 8,
              fontSize: 12, cursor: "pointer", color: T.textSec,
            }}>
              <RefreshCw size={13} style={{ animation: isSincronizando ? "spin 1s linear infinite" : "none" }} />
              Atualizar
            </button>
          )}
          <button onClick={exportarPDF} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
            background: "linear-gradient(135deg,#1351b4,#0c3d8a)", border: "none", borderRadius: 8,
            fontSize: 12, cursor: "pointer", color: T.white, fontWeight: 700,
          }}>
            <Download size={13} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* ── Alerta meses incompletos (compacto) ── */}
      {qtdIncomp > 0 && (
        <div style={{
          background: T.amberL, border: `1px solid #fde68a`, borderRadius: 10,
          padding: "10px 16px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 10, fontSize: 12,
        }}>
          <AlertTriangle size={15} color={T.amber} style={{ flexShrink: 0 }} />
          <span style={{ color: "#92400e", fontWeight: 600 }}>
            Competências com coleta incompleta:{" "}
            <strong>{pontos.filter(p => p.status === "incompleto" || p.status === "pendente").map(p => p.label).join(", ")}</strong>
            {" "}— excluídas da média e variação.
          </span>
        </div>
      )}

      {/* ── KPIs executivos ── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <KpiCard
          label="Total recebido" value={fmtBRL(totalAcumulado)}
          color={T.blue} borderColor={T.blue}
          icon={<DollarSign size={16}/>}
          sub={`${pontosValidos.length} meses com dados`}
        />
        <KpiCard
          label="Média mensal" value={fmtAbrev(mediaM)}
          color={T.textSec} borderColor="#94a3b8"
          icon={<BarChart2 size={16}/>}
          sub="Somente competências completas"
        />
        {maxPonto && (
          <KpiCard
            label="Maior repasse" value={fmtAbrev(maxPonto.valor)}
            color={T.green} borderColor={T.green}
            icon={<TrendingUp size={16}/>}
            sub={maxPonto.labelFull}
          />
        )}
        {minPonto && (
          <KpiCard
            label="Menor repasse" value={fmtAbrev(minPonto.valor)}
            color={T.red} borderColor={T.red}
            icon={<TrendingDown size={16}/>}
            sub={minPonto.labelFull}
          />
        )}
        {lastCompleto?.variacao && (
          <KpiCard
            label={`Variação — ${lastCompleto.label}`}
            value={`${lastCompleto.variacao.pct >= 0 ? "+" : ""}${lastCompleto.variacao.pct.toFixed(1)}%`}
            color={lastCompleto.variacao.tipo === "aumento" ? T.green : T.red}
            borderColor={lastCompleto.variacao.tipo === "aumento" ? T.green : T.red}
            icon={lastCompleto.variacao.tipo === "aumento" ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
            sub={`vs. ${MESES_ABREV[(lastCompleto.mes - 2 + 12) % 12]}`}
          />
        )}
        <KpiCard
          label="Meses crescimento" value={String(qtdAumentos)}
          color={T.green} borderColor={T.green}
          icon={<Activity size={16}/>}
          sub={`${qtdReducoes} com redução`}
        />
        <KpiCard
          label="Competências completas" value={String(qtdCompletos)}
          color={T.blue} borderColor={T.blue}
          icon={<Calendar size={16}/>}
          sub={qtdIncomp > 0 ? `${qtdIncomp} incompletas` : "Todas completas"}
        />
      </div>

      {/* ── Filtros de período ── */}
      <div style={{
        ...secCard, padding: "12px 20px", marginBottom: 20,
        display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.textSec,
          textTransform: "uppercase", letterSpacing: "0.06em" }}>Período:</span>
        <select value={mesInicio} onChange={e => setMesInicio(Number(e.target.value))}
          style={{ fontSize: 12, padding: "5px 10px", borderRadius: 7,
            border: `1px solid ${T.grayBdr}`, color: T.text, background: T.grayL }}>
          {Array.from({length:12},(_,i)=>i+1).map(m => (
            <option key={m} value={m}>{MESES_FULL[m-1]}</option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: T.textSec }}>até</span>
        <select value={mesFim} onChange={e => setMesFim(Number(e.target.value))}
          style={{ fontSize: 12, padding: "5px 10px", borderRadius: 7,
            border: `1px solid ${T.grayBdr}`, color: T.text, background: T.grayL }}>
          {Array.from({length:12},(_,i)=>i+1).filter(m=>m>=mesInicio).map(m => (
            <option key={m} value={m}>{MESES_FULL[m-1]}</option>
          ))}
        </select>

        <div style={{ width: 1, height: 20, background: T.grayBdr }} />

        {/* Filtro variação */}
        {(["todos","aumentos","reducoes"] as const).map(f => (
          <button key={f} onClick={() => setFiltroVariacao(f)} style={{
            padding: "5px 12px", fontSize: 11, borderRadius: 20, cursor: "pointer",
            border: `1px solid ${filtroVariacao===f ? T.blue : T.grayBdr}`,
            background: filtroVariacao===f ? T.blue : T.white,
            color: filtroVariacao===f ? T.white : T.textSec,
            fontWeight: filtroVariacao===f ? 700 : 400,
          }}>
            {f === "todos" ? "Todos" : f === "aumentos" ? "↑ Aumentos" : "↓ Reduções"}
          </button>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => setEscalaLog(v => !v)} style={{
            padding: "5px 12px", fontSize: 11, borderRadius: 20, cursor: "pointer",
            border: `1px solid ${escalaLog ? T.blue : T.grayBdr}`,
            background: escalaLog ? T.blueL : T.white,
            color: escalaLog ? T.blue : T.textSec, fontWeight: escalaLog ? 700 : 400,
          }}>
            {escalaLog ? "Escala Log ✓" : "Escala Log"}
          </button>
          <button onClick={() => setMostrarRotulos(v => !v)} style={{
            padding: "5px 12px", fontSize: 11, borderRadius: 20, cursor: "pointer",
            border: `1px solid ${mostrarRotulos ? T.blue : T.grayBdr}`,
            background: mostrarRotulos ? T.blueL : T.white,
            color: mostrarRotulos ? T.blue : T.textSec, fontWeight: mostrarRotulos ? 700 : 400,
          }}>
            {mostrarRotulos ? "Rótulos ✓" : "Rótulos"}
          </button>
        </div>
      </div>

      {/* ── Gráfico principal ── */}
      <div style={secCard}>
        <div style={secTitle}>Evolução Total dos Repasses Mensais do FNS</div>
        <div style={secSub}>
          Exercício {exercicio} · Valores líquidos oficiais · Fonte: consultafns.saude.gov.br
          {escalaLog && <span style={{ color: T.amber, fontWeight: 600 }}> · Escala logarítmica ativa</span>}
        </div>

        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={chartTotalData} margin={{ top: 30, right: 32, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: T.textSec }} axisLine={false} tickLine={false} />
            <YAxis
              scale={escalaLog ? "log" : "auto"}
              domain={escalaLog ? ["auto", "auto"] : [0, "auto"]}
              tick={{ fontSize: 10, fill: T.textSec }}
              tickFormatter={v => fmtAbrev(v).replace("R$ ", "")}
              width={78}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={(props: any) => <TooltipTotal {...props} mediaM={mediaM} />} />
            {mediaM > 0 && (
              <ReferenceLine
                y={mediaM}
                stroke={T.gray}
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={<LabelMedia mediaM={mediaM} />}
              />
            )}
            <Line
              type="monotone"
              dataKey="valorChart"
              stroke={T.blue}
              strokeWidth={2.5}
              dot={<DotCustom />}
              activeDot={{ r: 9, fill: T.blue, stroke: T.white, strokeWidth: 3 }}
              label={mostrarRotulos ? <LabelPonto /> : undefined}
              connectNulls={false}
            />
            {/* ── Linha de Emendas Parlamentares ── */}
            {totalEmendas > 0 && (
              <Line
                type="monotone"
                dataKey="emendaChart"
                stroke={COR_EMENDA}
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!payload?.emendaChart) return <g key={`em-${props.index}`}/>;
                  return <circle key={`em-${props.index}`} cx={cx} cy={cy} r={5}
                    fill={COR_EMENDA} stroke={T.white} strokeWidth={2}/>;
                }}
                connectNulls={false}
                name="Emendas Parlamentares"
              />
            )}
            {/* Anotação no pico de emendas */}
            {maxEmendaPonto && totalEmendas > 0 && (
              <ReferenceLine
                x={maxEmendaPonto.label}
                stroke={COR_EMENDA}
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: `Emenda: ${fmtAbrev(maxEmendaPonto.valor)}`,
                  position: "insideTopLeft",
                  fontSize: 10.5,
                  fill: COR_EMENDA,
                  fontWeight: 700,
                  dy: -14,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Legenda */}
        <div style={{ display: "flex", gap: 20, fontSize: 11.5, color: T.textSec,
          marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.grayBdr}`, flexWrap: "wrap" }}>
          {[
            { cor: T.green,  label: "Aumento",           shape: "circle" },
            { cor: T.red,    label: "Redução",            shape: "circle" },
            { cor: T.blue,   label: "Referência (1º mês)", shape: "circle" },
            { cor: T.amber,  label: "Coleta incompleta", shape: "dashed" },
            { cor: T.gray,   label: "Dado indisponível", shape: "line"   },
            { cor: T.gray,   label: "Média mensal",      shape: "dashed-line" },
          ].map(l => (
            <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {l.shape === "circle" && (
                <span style={{ width: 10, height: 10, background: l.cor,
                  borderRadius: "50%", display: "inline-block", border: `2px solid ${l.cor}30` }} />
              )}
              {l.shape === "dashed" && (
                <span style={{ width: 10, height: 10, background: "none",
                  borderRadius: "50%", display: "inline-block",
                  border: `2px dashed ${l.cor}` }} />
              )}
              {l.shape === "line" && (
                <span style={{ width: 16, height: 2, background: l.cor,
                  display: "inline-block", borderRadius: 1, opacity: 0.5 }} />
              )}
              {l.shape === "dashed-line" && (
                <span style={{ width: 16, height: 0, display: "inline-block",
                  borderTop: `2px dashed ${l.cor}` }} />
              )}
              {l.label}
            </span>
          ))}
          {totalEmendas > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 6,
              background: "#fdf3e7", borderRadius: 6, padding: "3px 10px",
              border: `1px solid ${COR_EMENDA}30` }}>
              <span style={{ width: 18, height: 0, display: "inline-block",
                borderTop: `2.5px dashed ${COR_EMENDA}` }} />
              <span style={{ color: COR_EMENDA, fontWeight: 700 }}>
                Emendas Parlamentares · {fmtBRL(totalEmendas)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ── Cards de variação mensal ── */}
      <div style={secCard}>
        <div style={secTitle}>Variação Mensal</div>
        <div style={secSub}>Clique em um mês para ver o detalhamento completo</div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
        }}>
          {pontosFiltrados.map(p => {
            const isAumento = p.variacao?.tipo === "aumento";
            const isReducao = p.variacao?.tipo === "reducao";
            const isIncomp  = !p.valido;
            const isPrimeiro = !p.variacao && p.valido;

            const bg = isAumento ? "#f0fdf4" : isReducao ? "#fef2f2"
                     : isIncomp ? "#fffbeb" : isPrimeiro ? T.blueL : T.grayL;
            const borderC = isAumento ? T.green : isReducao ? T.red
                          : isIncomp ? T.amber : isPrimeiro ? T.blue : T.grayBdr;
            const acimaDaMedia = p.valor != null && mediaM > 0 && p.valor > mediaM;

            return (
              <div key={p.mes} style={{
                background: bg,
                borderRadius: 10,
                border: `1px solid ${borderC}40`,
                borderTop: `3px solid ${borderC}`,
                padding: "12px 14px",
                cursor: p.valido ? "pointer" : "default",
                transition: "box-shadow .15s, transform .15s",
                minHeight: 110,
                display: "flex", flexDirection: "column", gap: 6,
              }}
              onMouseEnter={e => {
                if (p.valido) {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 14px rgba(0,0,0,.1)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "";
                (e.currentTarget as HTMLDivElement).style.transform = "";
              }}>
                {/* Mês + badge status */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: T.text }}>
                    {p.labelFull}
                  </span>
                  {isIncomp && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: T.amber,
                      background: "#fef3c7", borderRadius: 4, padding: "1px 5px", border: "1px solid #fde68a" }}>
                      INCOMPLETO
                    </span>
                  )}
                  {isPrimeiro && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: T.blue,
                      background: T.blueL, borderRadius: 4, padding: "1px 5px", border: `1px solid ${T.blue}30` }}>
                      REF
                    </span>
                  )}
                </div>

                {/* Valor */}
                {p.valido ? (
                  <div style={{ fontWeight: 800, fontSize: 15, color: T.text,
                    fontVariantNumeric: "tabular-nums" }}>
                    {fmtAbrev(p.valor)}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: T.amber, fontWeight: 600 }}>Coleta incompleta</div>
                )}

                {/* Variação */}
                <SetaVar v={p.variacao} size="sm" />

                {/* Vs média */}
                {p.valido && mediaM > 0 && (
                  <div style={{ fontSize: 10, color: acimaDaMedia ? T.green : T.red, fontWeight: 600 }}>
                    {acimaDaMedia ? "▲ acima" : "▼ abaixo"} da média
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Gráfico por grupo (multi-linha) ── */}
      <div style={secCard}>
        <div style={secTitle}>Evolução Mensal por Grupo de Recurso</div>
        <div style={secSub}>Clique nos grupos para ocultar ou exibir</div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {gruposComDados.map(g => {
            const ativo = gruposAtivos.includes(g);
            const cor = GRUPO_PALETA[g] ?? T.gray;
            return (
              <button key={g} onClick={() => toggleGrupo(g)} style={{
                padding: "5px 12px", fontSize: 11, borderRadius: 20, cursor: "pointer",
                border: `2px solid ${ativo ? cor : T.grayBdr}`,
                background: ativo ? cor + "18" : T.white,
                color: ativo ? cor : T.textSec, fontWeight: ativo ? 700 : 400,
                transition: "all .15s",
              }}>
                {g}
              </button>
            );
          })}
        </div>

        {totalEmendas > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
            background: "#fdf3e7", borderRadius: 8, padding: "8px 14px",
            border: `1px solid ${COR_EMENDA}30`, fontSize: 12 }}>
            <span style={{ width: 20, height: 0, display: "inline-block",
              borderTop: `2.5px dashed ${COR_EMENDA}`, flexShrink: 0 }} />
            <span style={{ fontWeight: 700, color: COR_EMENDA }}>Emendas Parlamentares</span>
            <span style={{ color: T.textSec }}>— exibidas em destaque no gráfico ·</span>
            <span style={{ fontWeight: 700, color: COR_EMENDA }}>{fmtBRL(totalEmendas)} no período</span>
          </div>
        )}

        <ResponsiveContainer width="100%" height={totalEmendas > 0 ? 360 : 320}>
          <LineChart data={dataMultiLinha} margin={{ top: 24, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: T.textSec }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmtAbrev(v).replace("R$ ","")} width={75}
              axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null;
                const emItem = payload.find((p: any) => p.dataKey === "__emendas__");
                const grupos = payload.filter((p: any) => p.dataKey !== "__emendas__");
                const emVal: number = emItem?.value ?? 0;
                return (
                  <div style={{ background: T.white, border: `1px solid ${T.grayBdr}`, borderRadius: 10,
                    padding: "12px 16px", boxShadow: "0 6px 20px rgba(0,0,0,.12)", fontSize: 12, minWidth: 240 }}>
                    <div style={{ fontWeight: 800, color: T.blue, fontSize: 13, marginBottom: 8,
                      paddingBottom: 6, borderBottom: `2px solid ${T.blue}`, textTransform: "uppercase" }}>
                      {label} / {exercicio}
                    </div>
                    {grupos.map((item: any) => (
                      <div key={item.dataKey} style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: 5 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, background: item.color,
                            borderRadius: "50%", display: "inline-block" }} />
                          <span style={{ color: T.textSec }}>{item.name}</span>
                        </span>
                        <span style={{ fontWeight: 700, color: item.color }}>{fmtBRL(item.value)}</span>
                      </div>
                    ))}
                    {(() => {
                      const mesNum = payload[0]?.payload?.mes;
                      const og = origem?.meses?.[mesNum] ?? {};
                      const comEmenda = grupos.filter((it: any) => (og[it.dataKey]?.emendas ?? 0) > 0);
                      if (!comEmenda.length) return null;
                      return (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.grayBdr}` }}>
                          <div style={{ fontWeight: 700, color: COR_ORIGEM.individual, fontSize: 11, marginBottom: 4,
                            textTransform: "uppercase" }}>Dos quais — emendas parlamentares</div>
                          {comEmenda.map((it: any) => {
                            const o = og[it.dataKey];
                            return (
                              <div key={it.dataKey} style={{ marginBottom: 4 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                  <span style={{ color: T.textSec }}>{it.name}</span>
                                  <span style={{ fontWeight: 700, color: COR_ORIGEM.individual }}>{fmtBRL(o.emendas)} ({o.pct_emendas}%)</span>
                                </div>
                                <div style={{ fontSize: 10.5, color: T.textMut }}>
                                  Ministério {fmtBRL(o.ministerio)}
                                  {o.individual > 0 && ` · individual ${fmtBRL(o.individual)}`}
                                  {o.bancada > 0 && ` · bancada ${fmtBRL(o.bancada)}`}
                                  {o.comissao > 0 && ` · comissão ${fmtBRL(o.comissao)}`}
                                  {o.emenda_nao_classificada > 0 && ` · a classificar ${fmtBRL(o.emenda_nao_classificada)}`}
                                  {o.proposta_nao_identificada > 0 && ` · proposta a confirmar ${fmtBRL(o.proposta_nao_identificada)}`}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                    {emVal > 0 && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.grayBdr}`,
                        background: "#fdf3e7", borderRadius: 6, padding: "8px 10px", marginBottom: -4 }}>
                        <div style={{ fontWeight: 700, color: COR_EMENDA, fontSize: 11,
                          marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          📋 Emendas Parlamentares
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: T.textSec }}>Total emendas no mês</span>
                          <span style={{ fontWeight: 800, color: COR_EMENDA }}>{fmtBRL(emVal)}</span>
                        </div>
                        {grupos.reduce((s: number, g: any) => s + (g.value ?? 0), 0) > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                            <span style={{ color: T.textSec }}>% sobre total grupos</span>
                            <span style={{ fontWeight: 600, color: COR_EMENDA }}>
                              {((emVal / grupos.reduce((s: number, g: any) => s + (g.value ?? 0), 0)) * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Legend
              formatter={(value: string) =>
                value === "__emendas__"
                  ? <span style={{ color: COR_EMENDA, fontWeight: 700 }}>Emendas Parlamentares</span>
                  : value
              }
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
            {/* Linhas por grupo */}
            {gruposAtivos.map(g => (
              <Line key={g} type="monotone" dataKey={g}
                stroke={GRUPO_PALETA[g] ?? T.gray} strokeWidth={2} name={g}
                dot={{ r: 4, fill: GRUPO_PALETA[g] ?? T.gray, stroke: T.white, strokeWidth: 2 }}
                connectNulls={false}
              />
            ))}
            {/* Linha de Emendas Parlamentares */}
            {totalEmendas > 0 && (
              <>
                <Line
                  type="monotone"
                  dataKey="__emendas__"
                  stroke={COR_EMENDA}
                  strokeWidth={2.5}
                  strokeDasharray="8 4"
                  name="__emendas__"
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (!payload?.__emendas__) return <g key={`eme-${props.index}`}/>;
                    return <circle key={`eme-${props.index}`} cx={cx} cy={cy} r={5}
                      fill={COR_EMENDA} stroke={T.white} strokeWidth={2}/>;
                  }}
                  connectNulls={false}
                />
                {maxEmendaPonto && (
                  <ReferenceLine
                    x={maxEmendaPonto.label}
                    stroke={COR_EMENDA}
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                    label={{
                      value: `Emenda: ${fmtAbrev(maxEmendaPonto.valor)}`,
                      position: "top",
                      fontSize: 10,
                      fill: COR_EMENDA,
                      fontWeight: 700,
                    }}
                  />
                )}
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <OrigemRecursosFns exercicio={exercicio} mesesVisiveis={mesesVisiveis} />

      {/* ── Cards individuais por grupo ── */}
      <div style={{ fontWeight: 800, fontSize: 14, color: T.text, marginBottom: 14,
        letterSpacing: "-0.02em" }}>
        Evolução Detalhada por Grupo
      </div>
      {gruposAtivos.map(g => (
        <CardGrupo
          key={g}
          nome={g}
          dados={pontosPorGrupo[g] ?? []}
          cor={GRUPO_PALETA[g] ?? T.gray}
          emendas={pontosPorGrupo["Emendas Parlamentares"]}
        />
      ))}

      {/* ── Análise automática ── */}
      <div style={{ background: T.blueL, border: `1px solid #93c5fd`,
        borderRadius: 12, padding: "18px 22px", marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: T.blue, marginBottom: 12,
          display: "flex", alignItems: "center", gap: 8 }}>
          <Info size={15} /> Análise Automática
          <span style={{ fontWeight: 400, fontSize: 10, color: T.textSec }}>
            (calculada a partir dos dados oficiais do FNS)
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {analise.map((linha, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start",
              fontSize: 12.5, color: T.text, lineHeight: 1.6 }}>
              <CheckCircle size={14} color={T.blue} style={{ marginTop: 2, flexShrink: 0 }} />
              {linha}
            </div>
          ))}
        </div>
      </div>

      {/* ── Rodapé ── */}
      <div style={{ background: T.grayL, borderRadius: 8, padding: "10px 16px",
        fontSize: 10.5, color: T.textSec,
        display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
        <span>ERSUS 360 · Evolução FNS · Apuí/AM · Exercício {exercicio}</span>
        <span>Fonte: consultafns.saude.gov.br · Dados oficiais FNS/MS · {new Date().toLocaleDateString("pt-BR")}</span>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
