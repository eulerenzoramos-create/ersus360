/**
 * EvolucaoFnsGrafico — Evolução Mensal dos Repasses do FNS
 * Reutiliza TabelaFns já carregada por MatrizFns — zero chamadas extras.
 */
import { useState, useMemo, useRef, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
  BarChart, Bar, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Download, ArrowLeft,
         AlertTriangle, Info, CheckCircle, RefreshCw } from "lucide-react";

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
const C = {
  blue: "#1565c0", blueL: "#e3f0ff", blueM: "#1976d2",
  green: "#2e7d32", greenL: "#e8f5e9", greenM: "#43a047",
  red: "#c62828", redL: "#ffebee",
  amber: "#e65100", amberL: "#fff3e0",
  gray: "#6b7280", grayL: "#f4f6f8", grayBdr: "#e4e7ec",
  textPri: "#111827", textSec: "#6b7280", white: "#ffffff",
  yellow: "#f59e0b", yellowL: "#fffbeb",
};

const GRUPO_PALETA: Record<string, string> = {
  "Atenção Primária":               "#1565c0",
  "MAC — Média e Alta Complexidade":"#6a1b9a",
  "Atenção Especializada":          "#7b1fa2",
  "Assistência Farmacêutica":       "#00695c",
  "Vigilância em Saúde":            "#e65100",
  "Gestão do SUS":                  "#283593",
  "Piso Salarial da Enfermagem":    "#880e4f",
  "Emendas Parlamentares":          "#4e342e",
  "Investimentos":                  "#1b5e20",
  "Outros incentivos":              "#6b7280",
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
  if (s === "coletado")    return "✓ Coletado";
  if (s === "incompleto")  return "⚠ Incompleto";
  if (s === "pendente")    return "! Pendente";
  if (s === "futuro")      return "— Futuro";
  return "N/D";
}

function corPonto(status: string, variacao: "aumento"|"reducao"|"estavel"|null): string {
  if (status === "incompleto" || status === "pendente") return C.yellow;
  if (status === "nao_coletado" || status === "futuro") return C.gray;
  if (variacao === "aumento")  return C.greenM;
  if (variacao === "reducao")  return C.red;
  return C.blue;
}

// ─── Cálculo de variação ─────────────────────────────────────────────────────
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

// ─── Dados mensais derivados ──────────────────────────────────────────────────
interface PontoMensal {
  mes: number; label: string; labelFull: string;
  valor: number | null; status: string;
  valido: boolean; // coletado = true, incompleto/futuro = false
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
    const valido = status === "coletado";
    const valor = valido ? (totais[String(m)] ?? null) : null;
    return { mes: m, label: MESES_ABREV[m-1], labelFull: MESES_FULL[m-1], valor, status, valido, variacao: null, cor: C.blue };
  });

  // Calcular variação apenas entre meses válidos consecutivos
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i]; const b = pts[i-1];
    if (a.valido && b.valido) {
      a.variacao = calcVar(a.valor, b.valor);
    }
    a.cor = corPonto(a.status, a.variacao?.tipo ?? null);
  }
  if (pts.length > 0) pts[0].cor = corPonto(pts[0].status, null);

  return pts;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub?: string; color?: string; icon?: React.ReactNode;
}) {
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 10,
      padding: "12px 16px", flex: "1 1 160px", minWidth: 140,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        {icon && <span style={{ color: color ?? C.blue }}>{icon}</span>}
        <span style={{ fontSize: 11, color: C.textSec, fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontWeight: 800, fontSize: 15, color: color ?? C.textPri, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: C.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Seta de variação ────────────────────────────────────────────────────────
function SetaVar({ v }: { v: Variacao | null }) {
  if (!v) return <span style={{ color: C.gray, fontSize: 11 }}>—</span>;
  const { tipo, reais, pct } = v;
  if (tipo === "estavel") return (
    <span style={{ color: C.gray, fontSize: 11, display: "flex", alignItems: "center", gap: 2 }}>
      <Minus size={12} /> Estável
    </span>
  );
  const cor = tipo === "aumento" ? C.greenM : C.red;
  const Icon = tipo === "aumento" ? TrendingUp : TrendingDown;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <Icon size={14} color={cor} />
      <span style={{ color: cor, fontSize: 11, fontWeight: 700 }}>
        {tipo === "aumento" ? "+" : ""}{pct.toFixed(2)}%
      </span>
      <span style={{ color: C.textSec, fontSize: 10 }}>
        ({tipo === "aumento" ? "+" : ""}{fmtAbrev(reais)})
      </span>
    </div>
  );
}

// ─── Tooltip customizado ──────────────────────────────────────────────────────
function TooltipTotal({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const p: PontoMensal = payload[0]?.payload;
  return (
    <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 8,
      padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontSize: 12, minWidth: 200 }}>
      <div style={{ fontWeight: 700, color: C.textPri, marginBottom: 4 }}>{p.labelFull}</div>
      <div style={{ color: C.textSec, marginBottom: 4 }}>{labelStatus(p.status)}</div>
      {p.valido ? (
        <div style={{ fontWeight: 700, color: C.blue, fontSize: 14 }}>{fmtBRL(p.valor)}</div>
      ) : (
        <div style={{ color: C.amber, fontSize: 12 }}>
          {p.status === "incompleto" ? "Coleta incompleta — valor parcial" : "Dado não disponível"}
        </div>
      )}
      {p.variacao && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${C.grayBdr}` }}>
          <SetaVar v={p.variacao} />
        </div>
      )}
    </div>
  );
}

// ─── Dot customizado para LineChart ─────────────────────────────────────────
function DotCustom(props: any) {
  const { cx, cy, payload } = props;
  if (!payload) return null;
  const p: PontoMensal = payload;
  if (p.status === "nao_coletado" || p.status === "futuro") return null;
  const fill = p.cor;
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill={fill} stroke={C.white} strokeWidth={2} />
      {p.status === "incompleto" && (
        <circle cx={cx} cy={cy} r={9} fill="none" stroke={C.yellow} strokeWidth={2} strokeDasharray="3 2" />
      )}
    </g>
  );
}

// ─── Label customizado nos pontos ─────────────────────────────────────────────
function LabelPonto(props: any) {
  const { x, y, value, index, payload } = props;
  if (!payload?.valido) return null;
  const label = fmtAbrev(value);
  const offset = index % 2 === 0 ? -18 : 18;
  return (
    <text x={x} y={y + offset} textAnchor="middle" fontSize={9} fill={C.textSec} fontWeight={600}>
      {label}
    </text>
  );
}

// ─── Gráfico de evolução de um grupo ─────────────────────────────────────────
function CardGrupo({ nome, dados, cor }: {
  nome: string; dados: PontoMensal[]; cor: string;
}) {
  const validos = dados.filter(p => p.valido && p.valor != null);
  if (validos.length === 0) return null;

  const total = validos.reduce((s, p) => s + (p.valor ?? 0), 0);
  const media = total / validos.length;
  const max   = validos.reduce((a, b) => (b.valor ?? 0) > (a.valor ?? 0) ? b : a);
  const min   = validos.reduce((a, b) => (b.valor ?? 0) < (a.valor ?? 0) ? b : a);
  const aumentos = dados.filter(p => p.variacao?.tipo === "aumento").length;
  const reducoes = dados.filter(p => p.variacao?.tipo === "reducao").length;

  const chartData = dados.map(p => ({ ...p, valorChart: p.valido ? p.valor : undefined }));

  return (
    <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12,
      padding: "16px 20px", marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: cor, marginBottom: 12,
        borderLeft: `4px solid ${cor}`, paddingLeft: 10 }}>
        Evolução — {nome}
      </div>

      {/* KPIs do grupo */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        {[
          { label: "Total acumulado", val: fmtBRL(total) },
          { label: "Média mensal",    val: fmtAbrev(media) },
          { label: "Maior repasse",   val: `${fmtAbrev(max.valor)} (${max.label})` },
          { label: "Menor repasse",   val: `${fmtAbrev(min.valor)} (${min.label})` },
          { label: "Meses com aumento", val: String(aumentos), suf: "" },
          { label: "Meses com redução", val: String(reducoes), suf: "" },
        ].map(k => (
          <div key={k.label} style={{ flex: "1 1 120px", background: C.grayL, borderRadius: 8,
            padding: "8px 12px", border: `1px solid ${C.grayBdr}` }}>
            <div style={{ fontSize: 10, color: C.textSec }}>{k.label}</div>
            <div style={{ fontWeight: 700, fontSize: 12, color: C.textPri, marginTop: 2 }}>{k.val}</div>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmtAbrev(v).replace("R$ ","")} width={70} />
          <Tooltip content={<TooltipTotal />} />
          <Line
            type="monotone" dataKey="valorChart"
            stroke={cor} strokeWidth={2.5}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (!payload?.valido) return <g key={`dot-${props.index}`} />;
              return <circle key={`dot-${props.index}`} cx={cx} cy={cy} r={5} fill={cor} stroke={C.white} strokeWidth={2} />;
            }}
            label={<LabelPonto />}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Análise automática em texto ──────────────────────────────────────────────
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
    const maiorAumento = aumentos.reduce((a, b) => (b.variacao!.reais > a.variacao!.reais ? b : a));
    linhas.push(`O maior aumento ocorreu em ${maiorAumento.labelFull}: +${fmtBRL(maiorAumento.variacao!.reais)} (+${maiorAumento.variacao!.pct.toFixed(2)}%).`);
  }
  if (reducoes.length > 0) {
    const maiorReducao = reducoes.reduce((a, b) => (b.variacao!.reais < a.variacao!.reais ? b : a));
    linhas.push(`A maior redução ocorreu em ${maiorReducao.labelFull}: ${fmtBRL(maiorReducao.variacao!.reais)} (${maiorReducao.variacao!.pct.toFixed(2)}%).`);
  }

  // Identificar grupo responsável por max
  const grupoMax = Object.entries(subtotaisGrupo)
    .map(([nome, g]) => ({ nome, val: g.meses[String(max.mes)] ?? 0 }))
    .sort((a, b) => b.val - a.val)[0];
  if (grupoMax && grupoMax.val > 0) {
    linhas.push(`Em ${max.labelFull}, o grupo "${grupoMax.nome}" foi o maior contribuinte (${fmtBRL(grupoMax.val)}).`);
  }

  const incompletos = pontos.filter(p => p.status === "incompleto" || p.status === "pendente");
  if (incompletos.length > 0) {
    linhas.push(`Atenção: ${incompletos.length} mês(es) com coleta incompleta — variações não calculadas nesses períodos.`);
  }

  return linhas;
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
  const [mostrarRotulos, setMostrarRotulos]         = useState(true);
  const [filtroVariacao, setFiltroVariacao]         = useState<"todos"|"aumentos"|"reducoes">("todos");
  const [mesInicio, setMesInicio] = useState(1);
  const [mesFim, setMesFim]       = useState(12);
  const chartRef = useRef<HTMLDivElement>(null);

  const mesesVisiveis = useMemo(
    () => Array.from({ length: mesFim - mesInicio + 1 }, (_, i) => mesInicio + i),
    [mesInicio, mesFim]
  );

  // Pontos mensais totais
  const pontos = useMemo(
    () => derivarPontos(data.totais_mensais, data.meses_status, mesesVisiveis),
    [data, mesesVisiveis]
  );

  // Pontos por grupo
  const pontosPorGrupo = useMemo(() => {
    const result: Record<string, PontoMensal[]> = {};
    for (const [nome, g] of Object.entries(data.subtotais_grupo)) {
      const pts = derivarPontos(g.meses, data.meses_status, mesesVisiveis);
      result[nome] = pts;
    }
    return result;
  }, [data, mesesVisiveis]);

  const gruposComDados = useMemo(
    () => data.grupos_disponiveis.filter(g => pontosPorGrupo[g]?.some(p => p.valido)),
    [data.grupos_disponiveis, pontosPorGrupo]
  );

  // Inicializar grupos selecionados
  const gruposAtivos = gruposSelecionados.length > 0 ? gruposSelecionados : gruposComDados.slice(0, 4);

  // KPIs globais
  const pontosValidos = pontos.filter(p => p.valido && p.valor != null);
  const totalAcumulado = pontosValidos.reduce((s, p) => s + (p.valor ?? 0), 0);
  const mediaM = pontosValidos.length > 0 ? totalAcumulado / pontosValidos.length : 0;
  const maxPonto = pontosValidos.length > 0 ? pontosValidos.reduce((a, b) => (b.valor ?? 0) > (a.valor ?? 0) ? b : a) : null;
  const minPonto = pontosValidos.length > 0 ? pontosValidos.reduce((a, b) => (b.valor ?? 0) < (a.valor ?? 0) ? b : a) : null;
  const qtdAumentos = pontos.filter(p => p.variacao?.tipo === "aumento").length;
  const qtdReducoes = pontos.filter(p => p.variacao?.tipo === "reducao").length;
  const qtdIncomp   = pontos.filter(p => p.status === "incompleto" || p.status === "pendente").length;

  const analise = useMemo(() => gerarAnalise(pontos, data.subtotais_grupo), [pontos, data]);

  // Dados multi-linha por grupo
  const dataMultiLinha = useMemo(() => mesesVisiveis.map(m => {
    const row: Record<string, any> = { mes: m, label: MESES_ABREV[m-1] };
    for (const g of gruposAtivos) {
      const pt = pontosPorGrupo[g]?.find(p => p.mes === m);
      row[g] = pt?.valido ? pt.valor : undefined;
    }
    return row;
  }), [mesesVisiveis, gruposAtivos, pontosPorGrupo]);

  // Filtrar pontos para variação
  const pontosFiltrados = useMemo(() => {
    if (filtroVariacao === "aumentos") return pontos.filter(p => p.variacao?.tipo === "aumento");
    if (filtroVariacao === "reducoes") return pontos.filter(p => p.variacao?.tipo === "reducao");
    return pontos;
  }, [pontos, filtroVariacao]);

  // Dados chart total
  const chartTotalData = pontos.map(p => ({
    ...p, valorChart: p.valido ? p.valor : undefined,
  }));

  // Toggle grupo
  const toggleGrupo = useCallback((g: string) => {
    setGruposSelecionados(prev => {
      const base = prev.length === 0 ? gruposComDados.slice(0, 4) : prev;
      return base.includes(g) ? base.filter(x => x !== g) : [...base, g];
    });
  }, [gruposComDados]);

  // Exportar PNG via SVG dos charts (funcionalidade básica via print)
  const exportarPNG = useCallback(() => {
    alert("Para exportar como imagem, use 'Exportar PDF' e salve como PNG a partir do visualizador de PDF.");
  }, []);

  // Exportar PDF (usa a impressão com zoom)
  const exportarPDF = useCallback(() => {
    const area = document.getElementById("ersus-print-area");
    if (!area) return;
    const content = chartRef.current;
    if (!content) return;
    area.innerHTML = `
      <div style="font-family:system-ui,sans-serif;color:#111827">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1d4ed8;padding-bottom:10px;margin-bottom:14px">
          <div>
            <div style="font-size:18px;font-weight:800;color:#0f172a">ERSUS 360 — Evolução dos Repasses FNS</div>
            <div style="font-size:10px;color:#6b7280">FMS Apuí/AM · CNPJ 12.834.320/0001-26 · IBGE 1300144 · Exercício ${exercicio}</div>
          </div>
          <div style="text-align:right;font-size:10px;color:#6b7280">
            Gerado em: ${new Date().toLocaleDateString("pt-BR")}<br/>
            Fonte: consultafns.saude.gov.br
          </div>
        </div>
        ${content.innerHTML}
      </div>`;
    area.style.zoom = "0.45";
    setTimeout(() => { window.print(); setTimeout(() => { area.style.zoom = ""; area.innerHTML = ""; }, 800); }, 200);
  }, [exercicio]);

  return (
    <div ref={chartRef} style={{ fontFamily: "system-ui, sans-serif", color: C.textPri }}>
      {/* ── Barra de navegação ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={onVoltar} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
          background: C.grayL, border: `1px solid ${C.grayBdr}`, borderRadius: 8,
          fontSize: 12, cursor: "pointer", fontWeight: 600, color: C.textPri,
        }}>
          <ArrowLeft size={14} /> Relatório Detalhado
        </button>

        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          {onSincronizar && (
            <button onClick={onSincronizar} disabled={isSincronizando} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
              background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 8,
              fontSize: 12, cursor: "pointer", color: C.textSec,
            }}>
              <RefreshCw size={13} style={{ animation: isSincronizando ? "spin 1s linear infinite" : "none" }} />
              Atualizar dados
            </button>
          )}
          <button onClick={exportarPDF} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
            background: C.blue, border: "none", borderRadius: 8,
            fontSize: 12, cursor: "pointer", color: C.white, fontWeight: 600,
          }}>
            <Download size={13} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* ── Identificação ── */}
      <div style={{ background: C.blueL, border: `1px solid #90caf9`, borderRadius: 10,
        padding: "10px 16px", marginBottom: 16, fontSize: 12 }}>
        <span style={{ fontWeight: 700, color: C.blue }}>Evolução Mensal dos Repasses do FNS</span>
        <span style={{ color: C.textSec }}> · Apuí/AM · FMS CNPJ 12.834.320/0001-26 · IBGE 1300144 · Exercício {exercicio}</span>
        <span style={{ color: C.textSec }}> · Fonte: </span>
        <a href="https://consultafns.saude.gov.br" target="_blank" rel="noreferrer" style={{ color: C.blueM }}>
          consultafns.saude.gov.br
        </a>
        <span style={{ color: C.textSec }}> — Valores NÃO somados com e-Gestor APS</span>
      </div>

      {/* ── Filtros de período ── */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
        background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 10,
        padding: "10px 16px", marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>Período:</span>
        <select value={mesInicio} onChange={e => setMesInicio(Number(e.target.value))}
          style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.grayBdr}` }}>
          {Array.from({length:12},(_,i)=>i+1).map(m => (
            <option key={m} value={m}>{MESES_FULL[m-1]}</option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: C.textSec }}>até</span>
        <select value={mesFim} onChange={e => setMesFim(Number(e.target.value))}
          style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.grayBdr}` }}>
          {Array.from({length:12},(_,i)=>i+1).filter(m=>m>=mesInicio).map(m => (
            <option key={m} value={m}>{MESES_FULL[m-1]}</option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          {(["todos","aumentos","reducoes"] as const).map(f => (
            <button key={f} onClick={() => setFiltroVariacao(f)} style={{
              padding: "4px 10px", fontSize: 11, borderRadius: 16, cursor: "pointer",
              border: `1px solid ${filtroVariacao===f ? C.blue : C.grayBdr}`,
              background: filtroVariacao===f ? C.blue : C.white,
              color: filtroVariacao===f ? C.white : C.textSec, fontWeight: filtroVariacao===f ? 700 : 400,
            }}>
              {f === "todos" ? "Todos" : f === "aumentos" ? "↑ Aumentos" : "↓ Reduções"}
            </button>
          ))}
          <button onClick={() => setMostrarRotulos(v => !v)} style={{
            padding: "4px 10px", fontSize: 11, borderRadius: 16, cursor: "pointer",
            border: `1px solid ${mostrarRotulos ? C.blue : C.grayBdr}`,
            background: mostrarRotulos ? C.blueL : C.white,
            color: mostrarRotulos ? C.blue : C.textSec,
          }}>
            {mostrarRotulos ? "Ocultar rótulos" : "Mostrar rótulos"}
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <KpiCard label="Total acumulado" value={fmtBRL(totalAcumulado)} color={C.blue} icon={<Info size={14}/>} />
        <KpiCard label="Média mensal" value={fmtAbrev(mediaM)} color={C.textSec} />
        {maxPonto && <KpiCard label="Maior repasse" value={fmtAbrev(maxPonto.valor)} sub={maxPonto.labelFull} color={C.greenM} icon={<TrendingUp size={14}/>} />}
        {minPonto && <KpiCard label="Menor repasse" value={fmtAbrev(minPonto.valor)} sub={minPonto.labelFull} color={C.red} icon={<TrendingDown size={14}/>} />}
        <KpiCard label="Meses com aumento" value={String(qtdAumentos)} color={C.greenM} icon={<TrendingUp size={14}/>} />
        <KpiCard label="Meses com redução" value={String(qtdReducoes)} color={C.red} icon={<TrendingDown size={14}/>} />
        {qtdIncomp > 0 && <KpiCard label="Coleta incompleta" value={`${qtdIncomp} mês(es)`} color={C.amber} icon={<AlertTriangle size={14}/>} />}
      </div>

      {/* ── Alerta meses incompletos ── */}
      {qtdIncomp > 0 && (
        <div style={{ background: C.amberL, border: `1px solid #ffcc80`, borderRadius: 8,
          padding: "8px 14px", fontSize: 12, color: C.amber, marginBottom: 16,
          display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={14} />
          Meses com coleta incompleta ({pontos.filter(p=>p.status==="incompleto"||p.status==="pendente").map(p=>p.label).join(", ")})
          não são tratados como R$ 0,00 e não são usados para calcular variação.
        </div>
      )}

      {/* ── Gráfico 1: Total mensal ── */}
      <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12,
        padding: "20px", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.textPri, marginBottom: 4 }}>
          Evolução Total dos Repasses Mensais do FNS
        </div>
        <div style={{ fontSize: 11, color: C.textSec, marginBottom: 16 }}>
          Exercício {exercicio} · Valores líquidos oficiais · Clique no ponto para ver detalhes
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartTotalData} margin={{ top: 30, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={v => fmtAbrev(v).replace("R$ ", "")}
              width={75}
            />
            <Tooltip content={<TooltipTotal />} />
            <ReferenceLine y={mediaM} stroke={C.gray} strokeDasharray="4 3"
              label={{ value: `Média: ${fmtAbrev(mediaM)}`, position: "right", fontSize: 10, fill: C.gray }} />
            <Line
              type="monotone"
              dataKey="valorChart"
              stroke={C.blueM}
              strokeWidth={2.5}
              dot={<DotCustom />}
              activeDot={{ r: 8 }}
              label={mostrarRotulos ? <LabelPonto /> : undefined}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Legenda de cores */}
        <div style={{ display: "flex", gap: 16, fontSize: 11, color: C.textSec, marginTop: 8, flexWrap: "wrap" }}>
          {[
            { cor: C.greenM, label: "↑ Aumento" },
            { cor: C.red,    label: "↓ Redução" },
            { cor: C.blue,   label: "● Referência (1º mês)" },
            { cor: C.yellow, label: "◎ Coleta incompleta" },
            { cor: C.gray,   label: "— Dado não disponível" },
          ].map(l => (
            <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, background: l.cor, borderRadius: "50%", display: "inline-block" }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Variação mês a mês ── */}
      <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12,
        padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.textPri, marginBottom: 12 }}>
          Variação Mensal
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {pontosFiltrados.map(p => {
            const bgCard = p.variacao?.tipo === "aumento" ? C.greenL
                         : p.variacao?.tipo === "reducao" ? C.redL
                         : C.grayL;
            return (
              <div key={p.mes} style={{
                background: bgCard, borderRadius: 8, padding: "10px 14px",
                border: `1px solid ${C.grayBdr}`, minWidth: 120, flex: "0 0 auto",
              }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: C.textPri, marginBottom: 4 }}>
                  {p.label}
                </div>
                {p.valido ? (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.textPri, marginBottom: 4 }}>
                      {fmtAbrev(p.valor)}
                    </div>
                    <SetaVar v={p.variacao} />
                  </>
                ) : (
                  <div style={{ fontSize: 11, color: C.amber }}>
                    {p.status === "incompleto" ? "Incompleto" : "N/D"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Gráfico 2: Por grupo (multi-linha) ── */}
      <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12,
        padding: "20px", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.textPri, marginBottom: 4 }}>
          Evolução Mensal por Grupo de Recurso
        </div>
        <div style={{ fontSize: 11, color: C.textSec, marginBottom: 12 }}>
          Clique na legenda para ocultar/exibir grupos
        </div>

        {/* Seletor de grupos */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {gruposComDados.map(g => {
            const ativo = gruposAtivos.includes(g);
            const cor = GRUPO_PALETA[g] ?? C.gray;
            return (
              <button key={g} onClick={() => toggleGrupo(g)} style={{
                padding: "4px 10px", fontSize: 11, borderRadius: 16, cursor: "pointer",
                border: `2px solid ${ativo ? cor : C.grayBdr}`,
                background: ativo ? cor + "22" : C.white,
                color: ativo ? cor : C.textSec, fontWeight: ativo ? 700 : 400,
              }}>
                {g}
              </button>
            );
          })}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dataMultiLinha} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmtAbrev(v).replace("R$ ","")} width={75} />
            <Tooltip
              formatter={(value: number, name: string) => [fmtBRL(value), name]}
              labelFormatter={l => `${l} / ${exercicio}`}
            />
            <Legend />
            {gruposAtivos.map(g => (
              <Line
                key={g}
                type="monotone"
                dataKey={g}
                stroke={GRUPO_PALETA[g] ?? C.gray}
                strokeWidth={2}
                dot={{ r: 4, fill: GRUPO_PALETA[g] ?? C.gray }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Gráfico 3: Cards individuais por grupo ── */}
      <div style={{ fontWeight: 700, fontSize: 14, color: C.textPri, marginBottom: 10 }}>
        Evolução por Grupo (detalhado)
      </div>
      {gruposAtivos.map(g => (
        <CardGrupo
          key={g}
          nome={g}
          dados={pontosPorGrupo[g] ?? []}
          cor={GRUPO_PALETA[g] ?? C.gray}
        />
      ))}

      {/* ── Análise automática ── */}
      <div style={{ background: C.blueL, border: `1px solid #90caf9`, borderRadius: 12,
        padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.blue, marginBottom: 10,
          display: "flex", alignItems: "center", gap: 6 }}>
          <Info size={14} /> Análise Automática
          <span style={{ fontWeight: 400, fontSize: 10, color: C.textSec }}>(baseada em cálculos dos dados oficiais)</span>
        </div>
        {analise.map((linha, i) => (
          <div key={i} style={{ fontSize: 12, color: C.textPri, marginBottom: 6,
            display: "flex", gap: 8, alignItems: "flex-start" }}>
            <CheckCircle size={13} color={C.blue} style={{ marginTop: 1, flexShrink: 0 }} />
            {linha}
          </div>
        ))}
      </div>

      {/* ── Rodapé ── */}
      <div style={{ background: C.grayL, borderRadius: 8, padding: "8px 14px", fontSize: 10,
        color: C.textSec, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
        <span>ERSUS 360 · Evolução FNS · Apuí/AM · Exercício {exercicio}</span>
        <span>Fonte: consultafns.saude.gov.br · Dados oficiais FNS/MS · Gerado em {new Date().toLocaleDateString("pt-BR")}</span>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
