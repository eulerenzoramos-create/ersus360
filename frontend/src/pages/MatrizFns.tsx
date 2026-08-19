/**
 * MatrizFns — Repasses Mensais do Fundo Nacional de Saúde
 * Tabela matricial: linha = (grupo, ação, componente) × colunas = meses
 * Fonte oficial: consultafns.saude.gov.br
 */
import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EvolucaoFnsGrafico from "./EvolucaoFnsGrafico";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  RefreshCw, Download, X, ChevronDown, ChevronRight,
  AlertTriangle, Info, Search, Filter, ExternalLink,
  CheckCircle, XCircle, Layers, FileSpreadsheet,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";

// ─── Design tokens ──────────────────────────────────────────────────────────
const C = {
  blue:     "#1565c0", blueL:  "#e3f0ff", blueM:  "#1976d2",
  green:    "#2e7d32", greenL: "#e8f5e9", greenM: "#43a047",
  amber:    "#e65100", amberL: "#fff3e0",
  red:      "#c62828", redL:   "#ffebee",
  purple:   "#6a1b9a", purpleL:"#f3e5f5",
  teal:     "#00695c", tealL:  "#e0f2f1",
  indigo:   "#283593", indigoL:"#e8eaf6",
  brown:    "#4e342e", brownL: "#efebe9",
  gray:     "#6b7280", grayL:  "#f4f6f8", grayBdr:"#e4e7ec",
  textPri:  "#111827", textSec:"#6b7280",
  white:    "#ffffff",
  rowAlt:   "#fafbfc", rowHov: "#f0f7ff",
  subTotal: "#e8f0fe",
  total:    "#c8d8fa",
};

// Cor por grupo (official)
const GRUPO_COR: Record<string, { bg: string; txt: string; bdr: string }> = {
  "Atenção Primária":              { bg: "#e3f0ff", txt: C.blue,   bdr: "#90caf9" },
  "MAC — Média e Alta Complexidade":{ bg: "#f3e5f5", txt: C.purple, bdr: "#ce93d8" },
  "Atenção Especializada":         { bg: "#f3e5f5", txt: C.purple, bdr: "#ce93d8" },
  "Assistência Farmacêutica":      { bg: "#e0f2f1", txt: C.teal,   bdr: "#80cbc4" },
  "Vigilância em Saúde":           { bg: "#fff3e0", txt: C.amber,  bdr: "#ffcc80" },
  "Gestão do SUS":                 { bg: "#e8eaf6", txt: C.indigo, bdr: "#9fa8da" },
  "Piso Salarial da Enfermagem":   { bg: "#fce4ec", txt: "#880e4f",bdr: "#f48fb1" },
  "ACS — Agentes Comunitários de Saúde": { bg: "#e8f5e9", txt: C.green, bdr: "#a5d6a7" },
  "ACE — Agentes de Combate às Endemias": { bg: "#f9fbe7", txt: "#558b2f", bdr: "#c5e1a5" },
  "Emendas Parlamentares":         { bg: "#efebe9", txt: C.brown,  bdr: "#bcaaa4" },
  "Investimentos":                 { bg: "#e8f5e9", txt: "#1b5e20", bdr: "#81c784" },
  "Outros incentivos":             { bg: "#f4f6f8", txt: C.gray,   bdr: "#d1d5db" },
  "Não classificado":              { bg: "#f4f6f8", txt: C.gray,   bdr: "#d1d5db" },
};

const _grupoCor = (g: string) =>
  GRUPO_COR[g] ?? { bg: "#f4f6f8", txt: C.gray, bdr: "#d1d5db" };

const MESES_ABREV = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MESES_FULL  = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                     "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

// ─── Formatação ──────────────────────────────────────────────────────────────
const BRL = (v: number | null | undefined) =>
  v == null || v === 0
    ? "—"
    : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const BRL_ZERO = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface CelulaMes {
  valor:       number | null;
  ids:         number[];
  qtd:         number;
  status_coleta: string;
}

interface LinhaMatriz {
  grupo:       string;
  acao:        string;
  componente:  string;
  tipo:        string;
  bloco:       string;
  meses:       Record<string, CelulaMes>;
  total_anual: number;
}

interface TabelaFns {
  exercicio:        number;
  total_linhas:     number;
  total_geral:      number;
  totais_mensais:   Record<string, number>;
  subtotais_grupo:  Record<string, { meses: Record<string, number>; total: number }>;
  linhas:           LinhaMatriz[];
  meses_status:     Record<string, string>;
  grupos_disponiveis: string[];
  tipos_disponiveis:  string[];
}

interface Transferencia {
  id: number; exercicio: number; mes: number;
  competencia: string | null; data_pagamento: string | null;
  grupo: string | null; acao: string | null; acao_detalhada: string | null;
  tipo_incentivo: string | null; bloco: string | null;
  numero_portaria: string | null; numero_ob: string | null;
  numero_proposta: string | null; numero_processo: string | null;
  conta_bancaria: string | null;
  valor_total: number | null; valor_desconto: number; valor_liquido: number | null;
  situacao: string | null; fonte: string; url_consultada: string | null;
  data_coleta: string | null; pagina_coleta: number | null;
}

interface DetalheCelula {
  mes: number; mes_nome: string; grupo: string | null;
  acao: string | null; componente: string | null;
  qtd: number; total_bruto: number; total_desconto: number; total_liquido: number;
  transferencias: Transferencia[];
  validacao_liquido: boolean;
}

// ─── Modal de detalhe da célula ───────────────────────────────────────────────
function ModalDetalhe({
  info, onClose,
}: {
  info: { ids: number[]; mes: number; grupo: string; acao: string; componente: string; exercicio: number };
  onClose: () => void;
}) {
  const idParam = info.ids.join(",");
  const { data, isLoading } = useQuery<DetalheCelula>({
    queryKey: ["fns-detalhe-celula", idParam, info.mes, info.exercicio],
    queryFn: () =>
      apiGet(`/api/repasses-fns/matriz-detalhe?exercicio=${info.exercicio}&mes=${info.mes}` +
        (idParam ? `&ids=${idParam}` : `&grupo=${encodeURIComponent(info.grupo)}&acao=${encodeURIComponent(info.acao)}&componente=${encodeURIComponent(info.componente)}`)),
    staleTime: 300_000,
  });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "32px 16px", overflowY: "auto",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: C.white, borderRadius: 12, width: "100%", maxWidth: 840,
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ background: C.blue, color: C.white, padding: "16px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {MESES_FULL[info.mes - 1]} — Detalhamento
            </div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
              {info.grupo} {info.acao ? "· " + info.acao : ""} {info.componente ? "· " + info.componente : ""}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.white, cursor: "pointer", marginLeft: 16 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: C.gray }}>Carregando…</div>
          ) : !data ? (
            <div style={{ textAlign: "center", padding: 40, color: C.red }}>Erro ao carregar detalhamento.</div>
          ) : (
            <>
              {/* KPIs */}
              <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                {[
                  { label: "Total bruto", val: data.total_bruto, cor: C.textPri },
                  { label: "Desconto", val: data.total_desconto, cor: C.red },
                  { label: "Valor líquido", val: data.total_liquido, cor: C.green },
                  { label: "Transferências", val: data.qtd, cor: C.blue, brl: false },
                ].map(k => (
                  <div key={k.label} style={{
                    flex: "1 1 160px", background: C.grayL, borderRadius: 8,
                    padding: "10px 14px", border: `1px solid ${C.grayBdr}`,
                  }}>
                    <div style={{ fontSize: 11, color: C.textSec }}>{k.label}</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: k.cor, marginTop: 2 }}>
                      {k.brl === false ? k.val : BRL_ZERO(k.val as number)}
                    </div>
                  </div>
                ))}
              </div>

              {!data.validacao_liquido && (
                <div style={{ background: "#fff3e0", border: "1px solid #ffcc80", borderRadius: 8,
                  padding: "8px 12px", fontSize: 12, color: C.amber, marginBottom: 12, display: "flex", gap: 8 }}>
                  <AlertTriangle size={14} /> Atenção: valor líquido total difere de bruto − desconto. Verificar na fonte FNS.
                </div>
              )}

              {/* Lista de transferências */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: C.blue, color: C.white }}>
                      {["Data Pgto","Ação Detalhada","Tipo","Portaria","Nº OB","Bruto","Desconto","Líquido","Situação","Fonte"].map(h => (
                        <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.transferencias.map((t, i) => (
                      <tr key={t.id} style={{ background: i % 2 === 0 ? C.white : C.rowAlt }}>
                        <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                          {t.data_pagamento ? new Date(t.data_pagamento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td style={{ padding: "6px 10px", maxWidth: 180, wordBreak: "break-word" }}>{t.acao_detalhada || t.acao || "—"}</td>
                        <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>{t.tipo_incentivo || "—"}</td>
                        <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>{t.numero_portaria || "—"}</td>
                        <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>{t.numero_ob || "—"}</td>
                        <td style={{ padding: "6px 10px", textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                          {BRL_ZERO(t.valor_total ?? 0)}
                        </td>
                        <td style={{ padding: "6px 10px", textAlign: "right", whiteSpace: "nowrap", color: C.red, fontVariantNumeric: "tabular-nums" }}>
                          {t.valor_desconto ? BRL_ZERO(t.valor_desconto) : "—"}
                        </td>
                        <td style={{ padding: "6px 10px", textAlign: "right", whiteSpace: "nowrap", fontWeight: 700, color: C.green, fontVariantNumeric: "tabular-nums" }}>
                          {BRL_ZERO(t.valor_liquido ?? 0)}
                        </td>
                        <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                          <span style={{
                            background: t.situacao === "Pago" ? C.greenL : C.amberL,
                            color: t.situacao === "Pago" ? C.green : C.amber,
                            borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 600,
                          }}>{t.situacao || "—"}</span>
                        </td>
                        <td style={{ padding: "6px 10px", whiteSpace: "nowrap", fontSize: 11 }}>
                          {t.url_consultada
                            ? <a href={t.url_consultada} target="_blank" rel="noreferrer"
                                style={{ color: C.blueM, display: "flex", alignItems: "center", gap: 4 }}>
                                <ExternalLink size={11} />{t.fonte}
                              </a>
                            : t.fonte}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 12, fontSize: 11, color: C.textSec }}>
                Fonte: consultafns.saude.gov.br · Fundo Nacional de Saúde (FNS)
                · Dados coletados automaticamente — não editados manualmente.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Célula da tabela ─────────────────────────────────────────────────────────
function Celula({
  cel, onClique, mesAtual,
}: {
  cel: CelulaMes;
  onClique: () => void;
  mesAtual: boolean;
}) {
  const [hov, setHov] = useState(false);
  const temValor = cel.valor != null && cel.valor > 0;
  const status = cel.status_coleta;

  let bg = "transparent";
  let txt = C.textSec;
  let conteudo: string | React.ReactNode = "—";

  if (status === "nao_coletado") {
    conteudo = <span style={{ fontSize: 10, color: "#aaa" }}>N/D</span>;
  } else if (status === "pendente") {
    conteudo = <span style={{ fontSize: 10, color: C.amber }}>Pendente</span>;
  } else if (status === "incompleto" && !temValor) {
    conteudo = <span style={{ fontSize: 10, color: C.amber }}>Incompleto</span>;
  } else if (temValor) {
    conteudo = cel.valor!.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    txt = C.textPri;
  } else {
    conteudo = <span style={{ fontSize: 10, color: "#bbb" }}>R$ 0,00</span>;
  }

  if (mesAtual) bg = "#fffde7";
  if (hov && temValor) bg = "#e3f0ff";

  return (
    <td
      onClick={temValor ? onClique : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={temValor ? `${cel.valor!.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} — ${cel.qtd} transferência(s). Clique para detalhar.` : undefined}
      style={{
        padding: "5px 8px", textAlign: "right", fontSize: 12,
        fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
        background: bg, color: txt, cursor: temValor ? "pointer" : "default",
        borderBottom: `1px solid ${C.grayBdr}`,
        borderLeft: `1px solid ${C.grayBdr}`,
        transition: "background 0.1s",
        minWidth: 90,
      }}
    >
      {conteudo}
      {temValor && cel.qtd > 1 && (
        <span style={{ fontSize: 9, color: C.blueM, marginLeft: 3 }}>({cel.qtd})</span>
      )}
    </td>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MatrizFns() {
  const [exercicio, setExercicio] = useState(new Date().getFullYear());
  const [mesInicio, setMesInicio] = useState(1);
  const [mesFim, setMesFim]       = useState(12);
  const [filtroGrupo,     setFiltroGrupo]     = useState("");
  const [filtroAcao,      setFiltroAcao]      = useState("");
  const [filtroComp,      setFiltroComp]      = useState("");
  const [filtroTipo,      setFiltroTipo]      = useState("");
  const [filtroBusca,     setFiltroBusca]     = useState("");
  const [gruposColapsados, setGruposColapsados] = useState<Set<string>>(new Set());
  const [detalhe, setDetalhe] = useState<{
    ids: number[]; mes: number; grupo: string; acao: string; componente: string; exercicio: number;
  } | null>(null);
  const [graficoAtivo, setGraficoAtivo] = useState<"barras" | "empilhado" | "linha">("barras");
  const [sincronizando, setSincronizando] = useState(false);
  const [sincMsg, setSincMsg] = useState("");
  const [viewMode, setViewMode] = useState<"tabela" | "evolucao">("tabela");

  const qc = useQueryClient();
  const tabelaRef = useRef<HTMLDivElement>(null);
  const mesAtualNum = new Date().getMonth() + 1;

  // ── Queries ───────────────────────────────────────────────────────────────
  const params = new URLSearchParams({
    exercicio: String(exercicio),
    mes_inicio: String(mesInicio),
    mes_fim: String(mesFim),
  });
  if (filtroGrupo) params.set("grupo", filtroGrupo);
  if (filtroAcao)  params.set("acao", filtroAcao);
  if (filtroComp)  params.set("componente", filtroComp);
  if (filtroTipo)  params.set("tipo_incentivo", filtroTipo);
  if (filtroBusca) params.set("busca", filtroBusca);

  const { data, isLoading, error } = useQuery<TabelaFns>({
    queryKey: ["fns-matriz", params.toString()],
    queryFn: () => apiGet(`/api/repasses-fns/matriz-tabela?${params}`),
    staleTime: 300_000,
  });

  const { data: opcoes } = useQuery({
    queryKey: ["fns-opcoes", exercicio],
    queryFn: () => apiGet(`/api/repasses-fns/matriz-opcoes?exercicio=${exercicio}`),
    staleTime: 600_000,
  });

  const { data: validacoes } = useQuery({
    queryKey: ["fns-validacoes", exercicio],
    queryFn: () => apiGet(`/api/repasses-fns/matriz-validacoes?exercicio=${exercicio}`),
    staleTime: 300_000,
  });

  // ── Meses visíveis ────────────────────────────────────────────────────────
  const mesesVisiveis = useMemo(
    () => Array.from({ length: mesFim - mesInicio + 1 }, (_, i) => mesInicio + i),
    [mesInicio, mesFim]
  );

  // ── Agrupa linhas por grupo ───────────────────────────────────────────────
  const grupos = useMemo(() => {
    if (!data) return [];
    const mapa: Record<string, LinhaMatriz[]> = {};
    for (const l of data.linhas) {
      if (!mapa[l.grupo]) mapa[l.grupo] = [];
      mapa[l.grupo].push(l);
    }
    return Object.entries(mapa);
  }, [data]);

  // ── Dados dos gráficos ────────────────────────────────────────────────────
  const dadosGraficoGrupos = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.subtotais_grupo).map(([g, st]) => ({
      grupo: g.length > 25 ? g.slice(0, 25) + "…" : g,
      grupoFull: g,
      total: Math.round(st.total),
      cor: _grupoCor(g).txt,
    })).sort((a, b) => b.total - a.total);
  }, [data]);

  const dadosGraficoMensal = useMemo(() => {
    if (!data) return [];
    return mesesVisiveis.map(m => {
      const obj: Record<string, number | string> = { mes: MESES_ABREV[m - 1] };
      for (const [g, st] of Object.entries(data.subtotais_grupo)) {
        obj[g] = Math.round(st.meses[String(m)] || 0);
      }
      return obj;
    });
  }, [data, mesesVisiveis]);

  const dadosGraficoLinha = useMemo(() => {
    if (!data) return [];
    return mesesVisiveis.map(m => ({
      mes: MESES_ABREV[m - 1],
      total: Math.round(data.totais_mensais[String(m)] || 0),
    }));
  }, [data, mesesVisiveis]);

  // ── Sincronização ─────────────────────────────────────────────────────────
  const sincronizar = async () => {
    setSincronizando(true);
    setSincMsg("Sincronizando todos os meses…");
    try {
      const r = await apiPost(
        `/api/repasses-fns/sincronizar-periodo?exercicio=${exercicio}&mes_inicio=1&mes_fim=12`,
        {}
      ) as { total_inseridos?: number; resultados?: { registros_inseridos?: number }[] };
      const ins = r.total_inseridos ?? 0;
      setSincMsg(`✓ ${ins} registros importados.`);
      await qc.invalidateQueries({ queryKey: ["fns-matriz"] });
      await qc.invalidateQueries({ queryKey: ["fns-validacoes"] });
    } catch (e) {
      setSincMsg(`✗ Erro: ${e instanceof Error ? e.message : "Falha."}`);
    } finally {
      setSincronizando(false);
      setTimeout(() => setSincMsg(""), 12000);
    }
  };

  // ── Exportar Excel ────────────────────────────────────────────────────────
  const exportarExcel = async () => {
    try {
      const API_BASE = (import.meta as { env: Record<string, string> }).env?.VITE_API_URL ?? "";
      const url = `${API_BASE}/api/repasses-fns/planilha?exercicio=${exercicio}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${response.status}`);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `ERSUS360_REPASSES_FNS_APUI_${exercicio}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (e) {
      alert(`Erro ao exportar: ${e instanceof Error ? e.message : e}`);
    }
  };

  const toggleGrupo = useCallback((g: string) => {
    setGruposColapsados(prev => {
      const s = new Set(prev);
      s.has(g) ? s.delete(g) : s.add(g);
      return s;
    });
  }, []);

  const limparFiltros = () => {
    setFiltroGrupo(""); setFiltroAcao(""); setFiltroComp("");
    setFiltroTipo(""); setFiltroBusca("");
    setMesInicio(1); setMesFim(12);
  };

  const temFiltro = filtroGrupo || filtroAcao || filtroComp || filtroTipo || filtroBusca;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", color: C.textPri }}>

      {/* ── Cabeçalho ── */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.blue, margin: 0 }}>
          Módulo Financeiro — Repasses Federais FNS
        </h2>
        <p style={{ fontSize: 13, color: C.textSec, marginTop: 4, marginBottom: 0 }}>
          Apuí/AM · FMS CNPJ 12.834.320/0001-26 · IBGE 130014 ·{" "}
          <a href="https://consultafns.saude.gov.br" target="_blank" rel="noreferrer"
            style={{ color: C.blueM }}>consultafns.saude.gov.br</a>
          {" "}· Valores <strong>NÃO somados</strong> com e-Gestor APS
        </p>
      </div>

      {/* ── Toggle de visão ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16,
        background: C.grayL, padding: 4, borderRadius: 10, width: "fit-content",
        border: `1px solid ${C.grayBdr}` }}>
        {([
          { key: "tabela",   label: "📋 Relatório Mensal Detalhado" },
          { key: "evolucao", label: "📈 Evolução Gráfica dos Repasses" },
        ] as const).map(v => (
          <button key={v.key} onClick={() => setViewMode(v.key)} style={{
            padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: viewMode === v.key ? 700 : 500,
            background: viewMode === v.key ? C.blue : "transparent",
            color: viewMode === v.key ? C.white : C.textSec,
            transition: "all 0.15s",
          }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ── Visão: Evolução Gráfica ── */}
      {viewMode === "evolucao" && data && (
        <EvolucaoFnsGrafico
          data={data}
          exercicio={exercicio}
          onVoltar={() => setViewMode("tabela")}
          onSincronizar={sincronizar}
          isSincronizando={sincronizando}
        />
      )}
      {viewMode === "evolucao" && !data && !isLoading && (
        <div style={{ textAlign: "center", padding: 60, color: C.textSec }}>
          Carregue os dados primeiro usando o Relatório Mensal Detalhado.
        </div>
      )}

      {/* ── Visão: Tabela (original intacta) ── */}
      {viewMode === "tabela" && (<>

      {/* ── Alertas de validação ── */}
      {validacoes?.alertas?.length > 0 && (
        <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8,
          padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
          <div style={{ fontWeight: 700, color: C.amber, display: "flex", gap: 8, alignItems: "center" }}>
            <AlertTriangle size={14} /> {validacoes.alertas.length} alerta(s) de validação
          </div>
          {validacoes.alertas.map((a: { tipo: string; mensagem: string; providencia: string }, i: number) => (
            <div key={i} style={{ marginTop: 4, color: "#5d4037" }}>
              · {a.mensagem} — <em>{a.providencia}</em>
            </div>
          ))}
        </div>
      )}

      {/* ── Filtros ── */}
      <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 10,
        padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10, alignItems: "flex-end" }}>

          {/* Exercício */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textSec, display: "block", marginBottom: 4 }}>EXERCÍCIO</label>
            <select value={exercicio} onChange={e => setExercicio(Number(e.target.value))}
              style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.grayBdr}`, fontSize: 13, cursor: "pointer" }}>
              {[2026, 2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Período */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textSec, display: "block", marginBottom: 4 }}>PERÍODO</label>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <select value={mesInicio} onChange={e => setMesInicio(Number(e.target.value))}
                style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.grayBdr}`, fontSize: 12, cursor: "pointer" }}>
                {MESES_ABREV.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
              <span style={{ fontSize: 12, color: C.gray }}>até</span>
              <select value={mesFim} onChange={e => setMesFim(Number(e.target.value))}
                style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.grayBdr}`, fontSize: 12, cursor: "pointer" }}>
                {MESES_ABREV.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Grupo */}
          <div style={{ flex: "1 1 140px" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textSec, display: "block", marginBottom: 4 }}>GRUPO</label>
            <select value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)}
              style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.grayBdr}`, fontSize: 12, cursor: "pointer" }}>
              <option value="">Todos os grupos</option>
              {(opcoes?.grupos ?? data?.grupos_disponiveis ?? []).map((g: string) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div style={{ flex: "1 1 140px" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textSec, display: "block", marginBottom: 4 }}>TIPO</label>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
              style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.grayBdr}`, fontSize: 12, cursor: "pointer" }}>
              <option value="">Todos os tipos</option>
              {(opcoes?.tipos ?? data?.tipos_disponiveis ?? []).map((t: string) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Busca */}
          <div style={{ flex: "2 1 200px" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textSec, display: "block", marginBottom: 4 }}>BUSCA</label>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: C.gray }} />
              <input
                value={filtroBusca}
                onChange={e => setFiltroBusca(e.target.value)}
                placeholder="Ação, componente, portaria…"
                style={{ width: "100%", padding: "6px 8px 6px 26px", borderRadius: 6,
                  border: `1px solid ${C.grayBdr}`, fontSize: 12, boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "center" }}>
            {temFiltro && (
              <button onClick={limparFiltros}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
                  border: `1px solid ${C.grayBdr}`, borderRadius: 7, background: C.white,
                  fontSize: 12, cursor: "pointer", color: C.textSec }}>
                <X size={11} /> Limpar
              </button>
            )}

            {sincMsg && (
              <span style={{ fontSize: 11, fontWeight: 700,
                color: sincMsg.startsWith("✓") ? C.green : sincMsg.startsWith("✗") ? C.red : C.amber }}>
                {sincMsg}
              </span>
            )}

            <button onClick={sincronizar} disabled={sincronizando}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px",
                background: C.blue, color: C.white, border: "none", borderRadius: 7,
                fontSize: 12, fontWeight: 600, cursor: sincronizando ? "wait" : "pointer",
                opacity: sincronizando ? 0.7 : 1 }}>
              <RefreshCw size={12} style={sincronizando ? { animation: "spin 1s linear infinite" } : {}} />
              {sincronizando ? "Sincronizando…" : "Sincronizar com FNS"}
            </button>

            <button onClick={exportarExcel}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px",
                background: C.green, color: C.white, border: "none", borderRadius: 7,
                fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <FileSpreadsheet size={12} /> Exportar Excel
            </button>
          </div>
        </div>
      </div>

      {/* ── KPIs de topo ── */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Total anual recebido", val: data.total_geral, cor: C.blue, bg: C.blueL },
            ...mesesVisiveis.slice(0, 3).map(m => ({
              label: MESES_FULL[m - 1],
              val: data.totais_mensais[String(m)] ?? 0,
              cor: mesAtualNum === m ? C.amber : C.textPri,
              bg: mesAtualNum === m ? "#fff8e1" : C.grayL,
            })),
            { label: "Nº de linhas", val: data.total_linhas, cor: C.textSec, bg: C.grayL, brl: false },
          ].map((k, i) => (
            <div key={i} style={{ background: k.bg, borderRadius: 8, padding: "12px 14px",
              border: `1px solid ${C.grayBdr}` }}>
              <div style={{ fontSize: 11, color: C.textSec }}>{k.label}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: k.cor, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>
                {(k as { brl?: boolean }).brl === false
                  ? String(k.val)
                  : (k.val as number).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Gráficos ── */}
      {data && data.total_linhas > 0 && (
        <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 10,
          padding: "16px", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" as const }}>
            {(["barras", "empilhado", "linha"] as const).map(g => (
              <button key={g} onClick={() => setGraficoAtivo(g)}
                style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                  background: graficoAtivo === g ? C.blue : C.grayL,
                  color: graficoAtivo === g ? C.white : C.textSec,
                  border: `1px solid ${graficoAtivo === g ? C.blue : C.grayBdr}`,
                  fontWeight: graficoAtivo === g ? 600 : 400 }}>
                {g === "barras" ? "Por Grupo" : g === "empilhado" ? "Mensal por Grupo" : "Evolução Mensal"}
              </button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            {graficoAtivo === "barras" ? (
              <BarChart data={dadosGraficoGrupos} layout="vertical" margin={{ left: 180, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="grupo" tick={{ fontSize: 11 }} width={180} />
                <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
                <Bar dataKey="total" onClick={(d: { grupoFull: string }) => setFiltroGrupo(d.grupoFull)} cursor="pointer" radius={[0,4,4,0]}>
                  {dadosGraficoGrupos.map((entry, i) => (
                    <Cell key={i} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            ) : graficoAtivo === "empilhado" ? (
              <BarChart data={dadosGraficoMensal} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {Object.keys(data.subtotais_grupo).map((g, i) => (
                  <Bar key={g} dataKey={g} stackId="a" fill={Object.values(GRUPO_COR)[i % Object.values(GRUPO_COR).length]?.txt ?? C.blue} />
                ))}
              </BarChart>
            ) : (
              <LineChart data={dadosGraficoLinha} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
                <Line type="monotone" dataKey="total" stroke={C.blue} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Tabela matricial ── */}
      <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 10,
        overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>

        {isLoading && (
          <div style={{ padding: 60, textAlign: "center", color: C.gray }}>
            <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 8 }} />
            <br />Carregando matriz de repasses…
          </div>
        )}

        {error && (
          <div style={{ padding: 40, textAlign: "center" }}>
            <XCircle size={32} style={{ color: C.red, marginBottom: 8 }} />
            <div style={{ fontWeight: 700, color: C.red, marginBottom: 6 }}>Erro ao carregar dados</div>
            <div style={{ fontSize: 12, color: C.textSec, maxWidth: 420, margin: "0 auto" }}>
              {String(error).includes("404")
                ? "Endpoint ainda não disponível no servidor. Aguarde o deploy do Railway ser concluído e recarregue a página."
                : "Verifique a conexão com a internet e tente novamente."}
            </div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 10 }}>
              {String(error)}
            </div>
          </div>
        )}

        {data && data.total_linhas === 0 && !isLoading && (
          <div style={{ padding: 60, textAlign: "center", color: C.gray }}>
            <Info size={32} style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Nenhum repasse encontrado para os filtros aplicados</div>
            <div style={{ fontSize: 13 }}>Use o botão "Sincronizar com FNS" para importar os dados oficiais.</div>
          </div>
        )}

        {data && data.total_linhas > 0 && (
          <div ref={tabelaRef} style={{ overflowX: "auto", maxWidth: "100%" }}>
            <table style={{ borderCollapse: "collapse", minWidth: 1100, width: "100%" }}>
              <thead>
                {/* Linha de status de coleta */}
                <tr>
                  <th colSpan={4} style={{ background: C.blue, padding: "10px 12px", textAlign: "left",
                    fontSize: 12, fontWeight: 700, color: C.white, position: "sticky", left: 0, zIndex: 3 }}>
                    GRUPO / AÇÃO / COMPONENTE
                  </th>
                  {mesesVisiveis.map(m => (
                    <th key={m} style={{
                      background: mesAtualNum === m ? "#e65100" : C.blue,
                      color: C.white, padding: "8px 6px", fontSize: 11, fontWeight: 600,
                      textAlign: "center", minWidth: 90,
                      borderLeft: "1px solid rgba(255,255,255,0.2)",
                    }}>
                      <div>{MESES_ABREV[m - 1]}</div>
                      <div style={{ fontSize: 9, fontWeight: 400, opacity: 0.8 }}>
                        {data.meses_status[String(m)] === "ok" ? "✓"
                          : data.meses_status[String(m)] === "incompleto" ? "⚠"
                          : data.meses_status[String(m)] === "pendente" ? "!"
                          : "N/D"}
                      </div>
                    </th>
                  ))}
                  <th style={{ background: "#0d47a1", color: C.white, padding: "10px 8px",
                    fontSize: 11, fontWeight: 700, textAlign: "right", minWidth: 110,
                    borderLeft: "1px solid rgba(255,255,255,0.2)" }}>
                    TOTAL ANUAL
                  </th>
                </tr>

                {/* Sub-cabeçalho de colunas de texto */}
                <tr style={{ background: "#e8f0fe", fontSize: 11, fontWeight: 600, color: "#283593" }}>
                  <th style={{ padding: "6px 12px", textAlign: "left", position: "sticky", left: 0, zIndex: 3, background: "#e8f0fe", borderBottom: `2px solid ${C.grayBdr}`, minWidth: 180 }}>Grupo</th>
                  <th style={{ padding: "6px 12px", textAlign: "left", borderBottom: `2px solid ${C.grayBdr}`, minWidth: 200 }}>Ação</th>
                  <th style={{ padding: "6px 12px", textAlign: "left", borderBottom: `2px solid ${C.grayBdr}`, minWidth: 220 }}>Componente / Ação detalhada</th>
                  <th style={{ padding: "6px 8px", textAlign: "center", borderBottom: `2px solid ${C.grayBdr}`, minWidth: 80 }}>Tipo</th>
                  {mesesVisiveis.map(m => (
                    <th key={m} style={{ padding: "6px 6px", textAlign: "center", borderBottom: `2px solid ${C.grayBdr}`,
                      borderLeft: `1px solid ${C.grayBdr}`, minWidth: 90, fontVariantNumeric: "tabular-nums" }}>
                      {exercicio}/{String(m).padStart(2, "0")}
                    </th>
                  ))}
                  <th style={{ padding: "6px 8px", textAlign: "right", borderBottom: `2px solid ${C.grayBdr}`,
                    borderLeft: `1px solid ${C.grayBdr}`, minWidth: 110 }}>Total</th>
                </tr>
              </thead>

              <tbody>
                {grupos.map(([nomeGrupo, linhas]) => {
                  const cor = _grupoCor(nomeGrupo);
                  const colapsado = gruposColapsados.has(nomeGrupo);
                  const subtotal = data.subtotais_grupo[nomeGrupo];

                  return (
                    <>
                      {/* Linha de grupo */}
                      <tr key={`grp-${nomeGrupo}`}
                        onClick={() => toggleGrupo(nomeGrupo)}
                        style={{ cursor: "pointer", background: cor.bg, userSelect: "none" }}>
                        <td colSpan={4}
                          style={{ padding: "8px 12px", fontWeight: 700, fontSize: 13,
                            color: cor.txt, position: "sticky", left: 0, zIndex: 2,
                            background: cor.bg, borderTop: `2px solid ${cor.bdr}`,
                            borderBottom: `1px solid ${cor.bdr}` }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {colapsado ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                            {nomeGrupo}
                            <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 6 }}>
                              ({linhas.length} linha{linhas.length !== 1 ? "s" : ""})
                            </span>
                          </span>
                        </td>
                        {mesesVisiveis.map(m => (
                          <td key={m} style={{
                            padding: "8px 8px", textAlign: "right", fontSize: 12,
                            fontWeight: 600, color: cor.txt, fontVariantNumeric: "tabular-nums",
                            background: cor.bg, borderTop: `2px solid ${cor.bdr}`,
                            borderBottom: `1px solid ${cor.bdr}`,
                            borderLeft: `1px solid ${cor.bdr}`, whiteSpace: "nowrap",
                          }}>
                            {(subtotal?.meses[String(m)] ?? 0) > 0
                              ? (subtotal.meses[String(m)]).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
                              : "—"}
                          </td>
                        ))}
                        <td style={{ padding: "8px 8px", textAlign: "right", fontWeight: 700,
                          fontSize: 13, color: cor.txt, background: cor.bg,
                          borderTop: `2px solid ${cor.bdr}`, borderBottom: `1px solid ${cor.bdr}`,
                          borderLeft: `2px solid ${cor.bdr}`, whiteSpace: "nowrap",
                          fontVariantNumeric: "tabular-nums" }}>
                          {BRL_ZERO(subtotal?.total ?? 0)}
                        </td>
                      </tr>

                      {/* Linhas de detalhamento */}
                      {!colapsado && linhas.map((linha, ri) => {
                        const altRow = ri % 2 === 1;
                        const bgRow = altRow ? "#fafbfc" : C.white;
                        return (
                          <tr key={`${nomeGrupo}-${ri}`}
                            style={{ background: bgRow }}>
                            {/* Grupo (sticky) */}
                            <td style={{
                              padding: "6px 12px", fontSize: 11, color: cor.txt,
                              borderLeft: `3px solid ${cor.bdr}`,
                              borderBottom: `1px solid ${C.grayBdr}`,
                              position: "sticky", left: 0, zIndex: 1,
                              background: bgRow, maxWidth: 180,
                              wordBreak: "break-word",
                            }}>
                              <span style={{ fontSize: 10, color: C.textSec }}>{linha.bloco || "—"}</span>
                            </td>

                            {/* Ação */}
                            <td style={{ padding: "6px 12px", fontSize: 12,
                              borderBottom: `1px solid ${C.grayBdr}`,
                              borderLeft: `1px solid ${C.grayBdr}`,
                              maxWidth: 200, wordBreak: "break-word" }}>
                              {linha.acao || "—"}
                            </td>

                            {/* Componente */}
                            <td style={{ padding: "6px 12px", fontSize: 12,
                              borderBottom: `1px solid ${C.grayBdr}`,
                              borderLeft: `1px solid ${C.grayBdr}`,
                              maxWidth: 220, wordBreak: "break-word" }}>
                              <div style={{ fontWeight: 500 }}>{linha.componente || "—"}</div>
                              {linha.grupo && (
                                <div style={{ fontSize: 10, color: C.textSec, marginTop: 1 }}>{linha.grupo}</div>
                              )}
                            </td>

                            {/* Tipo */}
                            <td style={{ padding: "6px 8px", textAlign: "center", fontSize: 11,
                              borderBottom: `1px solid ${C.grayBdr}`,
                              borderLeft: `1px solid ${C.grayBdr}` }}>
                              <span style={{ background: cor.bg, color: cor.txt, borderRadius: 4,
                                padding: "2px 6px", whiteSpace: "nowrap", fontSize: 10, fontWeight: 600 }}>
                                {linha.tipo?.split(" ")[0] || "—"}
                              </span>
                            </td>

                            {/* Células mensais */}
                            {mesesVisiveis.map(m => (
                              <Celula
                                key={m}
                                cel={linha.meses[String(m)] ?? { valor: null, ids: [], qtd: 0, status_coleta: "nao_coletado" }}
                                mesAtual={mesAtualNum === m}
                                onClique={() => setDetalhe({
                                  ids: linha.meses[String(m)]?.ids ?? [],
                                  mes: m,
                                  grupo: linha.grupo,
                                  acao: linha.acao,
                                  componente: linha.componente,
                                  exercicio,
                                })}
                              />
                            ))}

                            {/* Total anual */}
                            <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700,
                              fontSize: 12, color: C.textPri, whiteSpace: "nowrap",
                              fontVariantNumeric: "tabular-nums",
                              borderBottom: `1px solid ${C.grayBdr}`,
                              borderLeft: `2px solid ${C.grayBdr}` }}>
                              {BRL(linha.total_anual)}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Subtotal do grupo */}
                      {!colapsado && (
                        <tr key={`sub-${nomeGrupo}`}
                          style={{ background: C.subTotal, fontWeight: 700 }}>
                          <td colSpan={4} style={{ padding: "7px 12px", fontSize: 12,
                            color: "#283593", position: "sticky", left: 0, zIndex: 2,
                            background: C.subTotal, borderTop: `2px solid #c5cae9`,
                            borderBottom: `2px solid #c5cae9` }}>
                            Subtotal — {nomeGrupo}
                          </td>
                          {mesesVisiveis.map(m => (
                            <td key={m} style={{ padding: "7px 8px", textAlign: "right", fontSize: 12,
                              fontVariantNumeric: "tabular-nums", color: "#283593",
                              borderTop: `2px solid #c5cae9`, borderBottom: `2px solid #c5cae9`,
                              borderLeft: `1px solid #c5cae9`, whiteSpace: "nowrap" }}>
                              {(subtotal?.meses[String(m)] ?? 0) > 0
                                ? (subtotal.meses[String(m)]).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
                                : "—"}
                            </td>
                          ))}
                          <td style={{ padding: "7px 8px", textAlign: "right", fontSize: 12,
                            fontVariantNumeric: "tabular-nums", color: "#283593",
                            borderTop: `2px solid #c5cae9`, borderBottom: `2px solid #c5cae9`,
                            borderLeft: `2px solid #c5cae9`, whiteSpace: "nowrap" }}>
                            {BRL_ZERO(subtotal?.total ?? 0)}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}

                {/* Total geral */}
                <tr style={{ background: C.total, fontWeight: 700 }}>
                  <td colSpan={4} style={{ padding: "10px 12px", fontSize: 13, color: "#0d47a1",
                    position: "sticky", left: 0, zIndex: 2, background: C.total,
                    borderTop: "3px solid #7986cb", borderBottom: "3px solid #7986cb" }}>
                    TOTAL GERAL — {exercicio}
                  </td>
                  {mesesVisiveis.map(m => (
                    <td key={m} style={{ padding: "10px 8px", textAlign: "right", fontSize: 12,
                      fontVariantNumeric: "tabular-nums", color: "#0d47a1",
                      borderTop: "3px solid #7986cb", borderBottom: "3px solid #7986cb",
                      borderLeft: `1px solid #7986cb`, whiteSpace: "nowrap", fontWeight: 700 }}>
                      {(data.totais_mensais[String(m)] ?? 0) > 0
                        ? (data.totais_mensais[String(m)]).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
                        : "—"}
                    </td>
                  ))}
                  <td style={{ padding: "10px 8px", textAlign: "right", fontSize: 14,
                    fontVariantNumeric: "tabular-nums", color: "#0d47a1",
                    borderTop: "3px solid #7986cb", borderBottom: "3px solid #7986cb",
                    borderLeft: "3px solid #7986cb", whiteSpace: "nowrap", fontWeight: 800 }}>
                    {BRL_ZERO(data.total_geral)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Legenda de status */}
        <div style={{ padding: "8px 16px", background: C.grayL, borderTop: `1px solid ${C.grayBdr}`,
          display: "flex", gap: 16, fontSize: 11, color: C.gray, flexWrap: "wrap" as const }}>
          <span>✓ Coletado</span>
          <span>⚠ Coleta incompleta</span>
          <span>! Pendente</span>
          <span>N/D Não coletado</span>
          <span style={{ marginLeft: "auto" }}>
            Fonte: <a href="https://consultafns.saude.gov.br" target="_blank" rel="noreferrer" style={{ color: C.blueM }}>
              consultafns.saude.gov.br
            </a> · Transferências fundo a fundo · Dados oficiais FNS/MS
          </span>
        </div>
      </div>

      {/* ── Modal de detalhe ── */}
      {detalhe && <ModalDetalhe info={detalhe} onClose={() => setDetalhe(null)} />}

      {/* ── CSS animação spin ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 600px) {
          table { font-size: 11px; }
        }
      `}</style>
      </>)}
    </div>
  );
}
