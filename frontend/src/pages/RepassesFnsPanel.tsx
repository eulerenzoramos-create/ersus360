/**
 * RepassesFnsPanel — Painel de Repasses do Fundo Nacional de Saúde
 * Fonte: consultafns.saude.gov.br (fundo a fundo)
 *
 * Complementa o painel e-Gestor APS. Valores NÃO são somados entre as duas fontes.
 * Inline styles — projeto não usa Tailwind.
 */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from "recharts";
import {
  RefreshCw, CheckCircle, XCircle, AlertTriangle, ExternalLink,
  DollarSign, TrendingUp, Search, Filter, X, Download,
  ChevronDown, ChevronRight, Layers,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  blue:      "#1565c0",
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
  purple:    "#7c3aed",
  purpleBg:  "#f5f3ff",
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

// Cores por tipo de incentivo (paleta institucional)
const TIPO_CORES: Record<string, string> = {
  "Atenção Primária":                  "#1565c0",
  "MAC — Média e Alta Complexidade":   "#7c3aed",
  "Assistência Farmacêutica":          "#0891b2",
  "Vigilância em Saúde":               "#d97706",
  "Piso Salarial da Enfermagem":       "#db2777",
  "ACS — Agentes Comunitários de Saúde": "#16a34a",
  "ACE — Agentes de Combate às Endemias": "#65a30d",
  "Gestão do SUS":                     "#ea580c",
  "Emendas Parlamentares":             "#6b7280",
  "Investimentos":                     "#0f766e",
  "Outros incentivos":                 "#9ca3af",
};

const MESES_PT = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                  "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// ─── Tipos ─────────────────────────────────────────────────────────────────────
interface Transferencia {
  id: number; exercicio: number; mes: number | null; mes_nome: string | null;
  competencia: string | null; data_pagamento: string | null;
  bloco: string | null; grupo: string | null; acao: string | null;
  acao_detalhada: string | null; tipo_incentivo: string | null;
  numero_ob: string | null; numero_portaria: string | null;
  valor_total: number | null; valor_desconto: number | null;
  valor_liquido: number | null; situacao: string | null;
  fonte: string | null; data_coleta: string | null;
  status_conciliacao: string | null; diferenca_valor: number | null;
}
interface ListaFns {
  total_registros: number; total_bruto: number; total_desconto: number;
  total_liquido: number; pagina: number; total_paginas: number;
  transferencias: Transferencia[];
}
interface ResumoFns {
  situacao_dado: string;
  totais: { total_bruto: number; total_desconto: number; total_liquido: number; quantidade_transferencias: number };
  maior_incentivo: { tipo: string; valor: number; percentual: number };
  ultima_transferencia: { data_pagamento: string | null; grupo: string | null; acao: string | null; valor_liquido: number | null };
  exercicios_disponiveis: number[]; meses_disponiveis: number[];
  coletado_em: string | null;
}
interface TipoGrafico { tipo_incentivo: string; quantidade: number; total_bruto: number; total_desconto: number; total_liquido: number; percentual: number; }
interface MensalGrafico { competencia: string; [tipo: string]: string | number; }
interface StatusFns { banco: { total_transferencias: number; total_valor_liquido: number | null; ultima_coleta: string | null; ultima_coleta_sucesso: boolean | null } }

// ─── Helpers ───────────────────────────────────────────────────────────────────
const BRL = (v: number | null | undefined) =>
  v == null ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const BRLc = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

// ─── Card de KPI ───────────────────────────────────────────────────────────────
function KpiCard({ titulo, valor, sub, cor, corBg, Icon }: {
  titulo: string; valor: string; sub?: string;
  cor: string; corBg: string; Icon: React.ElementType;
}) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12, padding: "18px 20px",
      boxShadow: "0 1px 4px rgba(0,0,0,.04)", display: "flex", flexDirection: "column" as const, gap: 8, flex: "1 1 0", minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{titulo}</span>
        <div style={{ background: corBg, borderRadius: 8, padding: 8 }}><Icon size={16} color={cor} /></div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.textPri, fontVariantNumeric: "tabular-nums" }}>{valor}</div>
      {sub && <div style={{ fontSize: 11, color: C.textSec }}>{sub}</div>}
    </div>
  );
}

// ─── Tooltip gráfico ───────────────────────────────────────────────────────────
function TooltipFns({ active, payload, label }: { active?: boolean; payload?: {name: string; value: number}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,.1)", maxWidth: 280 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.textPri, marginBottom: 6, wordBreak: "break-word" as const }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 12, color: C.textSec, marginBottom: 2 }}>
          <span style={{ fontWeight: 600 }}>{p.name}: </span>
          <span style={{ color: C.money, fontWeight: 700 }}>{BRLc(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Linha expansível da tabela ────────────────────────────────────────────────
function LinhaFns({ t, idx }: { t: Transferencia; idx: number }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const cor = TIPO_CORES[t.tipo_incentivo || ""] || C.gray;

  return (
    <>
      <tr
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ cursor: "pointer", background: open ? C.blueLight : hover ? C.rowHover : idx % 2 === 1 ? C.rowAlt : C.white, borderTop: `1px solid ${C.grayBdr}`, transition: "background .12s" }}>
        <td style={{ padding: "10px 14px", color: C.textSec, fontSize: 12, whiteSpace: "nowrap" as const }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.blue }}>
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {t.data_pagamento ? new Date(t.data_pagamento + "T00:00:00").toLocaleDateString("pt-BR") : (t.mes_nome || "—")}
          </span>
        </td>
        <td style={{ padding: "10px 14px", fontSize: 12, maxWidth: 180 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, color: C.textPri, fontWeight: 600 }}>
              {t.tipo_incentivo || "—"}
            </span>
          </div>
        </td>
        <td style={{ padding: "10px 14px", fontSize: 11, color: C.textSec, maxWidth: 200 }}>
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }} title={t.acao_detalhada || t.acao || ""}>
            {t.acao_detalhada || t.acao || "—"}
          </div>
        </td>
        <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: C.textSec, fontSize: 12 }}>
          {BRL(t.valor_total)}
        </td>
        <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: t.valor_desconto ? C.red : C.textMut, fontSize: 12 }}>
          {t.valor_desconto ? BRL(t.valor_desconto) : "—"}
        </td>
        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: C.money, fontSize: 13 }}>
          {BRL(t.valor_liquido)}
        </td>
        <td style={{ padding: "10px 14px", textAlign: "center", fontSize: 11 }}>
          <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 12, background: C.greenBg, color: C.green, fontWeight: 700, border: `1px solid ${C.greenBdr}` }}>
            {t.situacao || "Pago"}
          </span>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} style={{ background: "#f8fafc", borderTop: `1px solid ${C.grayBdr}`, padding: 0 }}>
            <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 12 }}>
              {[
                ["Bloco", t.bloco],
                ["Grupo", t.grupo],
                ["Ação", t.acao],
                ["Ação Detalhada", t.acao_detalhada],
                ["Competência", t.competencia],
                ["Data Pagamento", t.data_pagamento],
                ["Nº Ordem Bancária", t.numero_ob],
                ["Nº Portaria", t.numero_portaria],
                ["Fonte", t.fonte],
                ["Coletado em", t.data_coleta ? new Date(t.data_coleta).toLocaleString("pt-BR") : null],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string}>
                  <div style={{ fontWeight: 700, color: C.textSec, fontSize: 10, textTransform: "uppercase" as const, marginBottom: 2 }}>{k}</div>
                  <div style={{ color: C.textPri, wordBreak: "break-word" as const }}>{v}</div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function RepassesFnsPanel() {
  const qc = useQueryClient();
  const [exercicio, setExercicio] = useState<number>(2026);
  const [mes, setMes] = useState<number | "">("");
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [barraAtiva, setBarraAtiva] = useState<string | null>(null);
  const [sincMsg, setSincMsg] = useState<"" | "ok" | "err" | "loading">("");
  const [sincDetalhe, setSincDetalhe] = useState<string>("");

  const statusQ = useQuery<StatusFns>({
    queryKey: ["fns-status"],
    queryFn: () => apiGet("/api/repasses-fns/status"),
    staleTime: 60_000,
  });

  const resumoQ = useQuery<ResumoFns>({
    queryKey: ["fns-resumo", exercicio, mes],
    queryFn: () => apiGet(`/api/repasses-fns/resumo?exercicio=${exercicio}${mes ? `&mes=${mes}` : ""}`),
    staleTime: 300_000,
  });

  const listaQ = useQuery<ListaFns>({
    queryKey: ["fns-lista", exercicio, mes, busca, tipoFiltro, pagina],
    queryFn: () => {
      const p = new URLSearchParams({ exercicio: String(exercicio), pagina: String(pagina), tamanho: "50" });
      if (mes) p.set("mes", String(mes));
      if (busca) p.set("busca", busca);
      if (tipoFiltro) p.set("tipo_incentivo", tipoFiltro);
      return apiGet(`/api/repasses-fns/transferencias?${p}`);
    },
    staleTime: 300_000,
  });

  const tiposQ = useQuery<{ dados: TipoGrafico[]; total_liquido_geral: number }>({
    queryKey: ["fns-tipos", exercicio, mes, tipoFiltro],
    queryFn: () => {
      const p = new URLSearchParams({ exercicio: String(exercicio) });
      if (mes) p.set("mes", String(mes));
      return apiGet(`/api/repasses-fns/grafico-tipos?${p}`);
    },
    staleTime: 300_000,
  });

  const mensalQ = useQuery<{ dados: MensalGrafico[]; tipos: string[] }>({
    queryKey: ["fns-mensal", exercicio],
    queryFn: () => apiGet(`/api/repasses-fns/grafico-mensal?exercicio=${exercicio}`),
    staleTime: 300_000,
  });

  // Sincronização
  const sincronizar = async () => {
    setSincMsg("loading");
    setSincDetalhe("");
    try {
      let r: Record<string, unknown>;
      if (!mes) {
        // Sincronizar ano inteiro (jan–dez)
        setSincDetalhe("Coletando todos os meses do ano...");
        r = await apiPost(`/api/repasses-fns/sincronizar-periodo?exercicio=${exercicio}&mes_inicio=1&mes_fim=12`, {});
        if (r.sucesso !== false) {
          const meses = (r.resultados as {registros_inseridos?: number; registros_atualizados?: number}[]) || [];
          const totalIns = meses.reduce((s, m) => s + (m.registros_inseridos || 0), 0);
          const totalAtl = meses.reduce((s, m) => s + (m.registros_atualizados || 0), 0);
          setSincMsg("ok");
          setSincDetalhe(`Ano ${exercicio} completo: ${totalIns} inseridos, ${totalAtl} atualizados.`);
        } else {
          setSincMsg("err");
          setSincDetalhe((r.mensagem_erro as string) || "Erro ao sincronizar.");
        }
      } else {
        r = await apiPost(`/api/repasses-fns/sincronizar?exercicio=${exercicio}&mes=${mes}`, {});
        if (r.sucesso) {
          setSincMsg("ok");
          setSincDetalhe(`${r.registros_inseridos} inseridos, ${r.registros_atualizados} atualizados. ` +
            (r.todas_paginas_coletadas ? "Todas as páginas coletadas." : "⚠ Nem todas as páginas foram coletadas."));
        } else {
          setSincMsg("err");
          setSincDetalhe((r.mensagem_erro as string) || "Fonte não disponível.");
        }
      }
      await qc.invalidateQueries({ queryKey: ["fns-status"] });
      await qc.invalidateQueries({ queryKey: ["fns-resumo"] });
      await qc.invalidateQueries({ queryKey: ["fns-lista"] });
      await qc.invalidateQueries({ queryKey: ["fns-tipos"] });
      await qc.invalidateQueries({ queryKey: ["fns-mensal"] });
    } catch (e: unknown) {
      setSincMsg("err");
      setSincDetalhe(e instanceof Error ? e.message : "Erro desconhecido.");
    }
    setTimeout(() => setSincMsg(""), 12000);
  };

  const resumo = resumoQ.data;
  const lista  = listaQ.data;
  const tipos  = tiposQ.data?.dados || [];
  const mensal = mensalQ.data;
  const semDados = statusQ.data?.banco?.total_transferencias === 0;

  // Filtra tabela pela barra clicada no gráfico
  const transferencias = useMemo(() => {
    if (!lista?.transferencias) return [];
    if (barraAtiva) return lista.transferencias.filter(t => t.tipo_incentivo === barraAtiva);
    return lista.transferencias;
  }, [lista, barraAtiva]);

  const limpar = () => {
    setBusca(""); setTipoFiltro(""); setMes(""); setBarraAtiva(null); setPagina(1);
  };

  const temFiltro = busca || tipoFiltro || mes || barraAtiva;

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 20 }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>

      {/* ── Banner de fonte oficial ── */}
      <div style={{ background: "#eff6ff", border: `1px solid #bfdbfe`, borderRadius: 10, padding: "10px 16px",
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
        <CheckCircle size={14} color={C.blue} style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: "#1e40af", flex: 1 }}>
          <strong>Fonte oficial:</strong>{" "}
          <a href="https://consultafns.saude.gov.br" target="_blank" rel="noopener noreferrer" style={{ color: "#1e40af", fontWeight: 700 }}>
            Fundo Nacional de Saúde — FNS/MS
          </a>
          {" "}(consultafns.saude.gov.br) · Transferências fundo a fundo. Valores NÃO somados com e-Gestor APS.
        </div>
        {statusQ.data?.banco?.ultima_coleta && (
          <span style={{ fontSize: 11, color: "#1e40af", whiteSpace: "nowrap" as const }}>
            Última coleta: {new Date(statusQ.data.banco.ultima_coleta).toLocaleString("pt-BR")}
          </span>
        )}
      </div>

      {/* ── Aviso se banco vazio ── */}
      {semDados && (
        <div style={{ background: C.amberBg, border: `1px solid ${C.amberBdr}`, borderRadius: 10, padding: "14px 18px",
          display: "flex", alignItems: "flex-start", gap: 10 }}>
          <AlertTriangle size={16} color={C.amber} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.amber, marginBottom: 4 }}>
              Nenhuma transferência FNS importada ainda
            </div>
            <div style={{ fontSize: 12, color: "#92400e" }}>
              Selecione o exercício e o mês abaixo e clique em "Sincronizar com FNS" para coletar os dados oficiais.
            </div>
          </div>
        </div>
      )}

      {/* ── Filtros + botão sincronizar ── */}
      <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12, padding: "14px 20px" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, alignItems: "center" }}>
          <Filter size={13} color={C.textSec} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.textSec }}>Filtros:</span>

          <select value={exercicio} onChange={e => { setExercicio(Number(e.target.value)); setPagina(1); }}
            style={{ padding: "6px 10px", border: `1px solid ${C.grayBdr}`, borderRadius: 6, fontSize: 12, color: C.textPri, background: C.grayLight }}>
            {[2026, 2025, 2024].map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select value={mes} onChange={e => { setMes(e.target.value ? Number(e.target.value) : ""); setPagina(1); }}
            style={{ padding: "6px 10px", border: `1px solid ${C.grayBdr}`, borderRadius: 6, fontSize: 12, color: C.textPri, background: C.grayLight }}>
            <option value="">Todos os meses</option>
            {MESES_PT.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>

          <select value={tipoFiltro} onChange={e => { setTipoFiltro(e.target.value); setPagina(1); }}
            style={{ padding: "6px 10px", border: `1px solid ${C.grayBdr}`, borderRadius: 6, fontSize: 12, color: C.textPri, background: C.grayLight }}>
            <option value="">Todos os tipos</option>
            {Object.keys(TIPO_CORES).map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <div style={{ position: "relative" as const, flex: "1 1 160px", maxWidth: 240 }}>
            <Search size={12} color={C.textMut} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input type="text" placeholder="Buscar…" value={busca} onChange={e => { setBusca(e.target.value); setPagina(1); }}
              style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
                border: `1px solid ${C.grayBdr}`, borderRadius: 6, fontSize: 12, background: C.grayLight, boxSizing: "border-box" as const }} />
          </div>

          {temFiltro && (
            <button onClick={limpar}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none",
                border: `1px solid ${C.grayBdr}`, borderRadius: 6, padding: "6px 10px", fontSize: 11, color: C.textSec, cursor: "pointer" }}>
              <X size={11} /> Limpar
            </button>
          )}

          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
            {sincMsg === "ok" && <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>✓ {sincDetalhe}</span>}
            {sincMsg === "err" && <span style={{ fontSize: 11, color: C.red, fontWeight: 700 }}>✗ {sincDetalhe}</span>}
            {sincMsg === "loading" && <span style={{ fontSize: 11, color: C.amber }}>Coletando dados do FNS…</span>}
            <button onClick={sincronizar} disabled={sincMsg === "loading"}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.blue, color: C.white,
                border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                opacity: sincMsg === "loading" ? 0.6 : 1 }}>
              <RefreshCw size={13} style={sincMsg === "loading" ? { animation: "spin 1s linear infinite" } : {}} />
              Sincronizar com FNS
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {resumo && resumo.situacao_dado === "oficial_validado" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
          <KpiCard titulo="Total bruto" valor={BRL(resumo.totais.total_bruto)} cor={C.blue} corBg={C.blueLight} Icon={DollarSign}
            sub="Soma das transferências FNS" />
          <KpiCard titulo="Total de descontos" valor={BRL(resumo.totais.total_desconto)} cor={C.red} corBg={C.redBg} Icon={TrendingUp}
            sub="Glosas ou devoluções" />
          <KpiCard titulo="Total líquido recebido" valor={BRL(resumo.totais.total_liquido)} cor={C.money} corBg={C.greenBg} Icon={DollarSign}
            sub="Valor efetivamente transferido" />
          <KpiCard titulo="Transferências" valor={String(resumo.totais.quantidade_transferencias)} cor={C.purple} corBg={C.purpleBg} Icon={Layers}
            sub="Registros no período" />
          <KpiCard titulo={`Maior: ${resumo.maior_incentivo?.tipo?.split("—")[0]?.trim() || "—"}`}
            valor={BRL(resumo.maior_incentivo?.valor)}
            sub={`${resumo.maior_incentivo?.percentual?.toFixed(1) || "—"}% do total`}
            cor={C.amber} corBg={C.amberBg} Icon={TrendingUp} />
          <KpiCard titulo="Última transferência"
            valor={resumo.ultima_transferencia?.data_pagamento
              ? new Date(resumo.ultima_transferencia.data_pagamento + "T00:00:00").toLocaleDateString("pt-BR")
              : "—"}
            sub={BRL(resumo.ultima_transferencia?.valor_liquido)}
            cor={C.green} corBg={C.greenBg} Icon={CheckCircle} />
        </div>
      )}

      {/* ── Gráfico por tipo ── */}
      {tipos.length > 0 && (
        <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12, padding: "20px 24px",
          boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPri }}>
              Distribuição dos repasses por tipo de incentivo
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: C.textSec }}>
              Clique em uma barra para filtrar a tabela · {exercicio}{mes ? `/${String(mes).padStart(2, "0")}` : ""}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(220, tipos.length * 36)}>
            <BarChart data={tipos} layout="vertical" margin={{ top: 4, right: 100, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 10, fill: C.textSec }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="tipo_incentivo" width={220}
                tick={{ fontSize: 11, fill: C.textSec }} axisLine={false} tickLine={false} />
              <Tooltip content={<TooltipFns />} />
              <Bar dataKey="total_liquido" name="Valor Líquido" radius={[0, 4, 4, 0]} maxBarSize={28}
                onClick={(d) => setBarraAtiva(barraAtiva === d.tipo_incentivo ? null : d.tipo_incentivo)}
                cursor="pointer">
                {tipos.map((entry) => (
                  <Cell key={entry.tipo_incentivo}
                    fill={TIPO_CORES[entry.tipo_incentivo] || C.gray}
                    opacity={barraAtiva && barraAtiva !== entry.tipo_incentivo ? 0.3 : 1} />
                ))}
                <LabelList
                  dataKey="percentual"
                  position="right"
                  formatter={(v: number) => `${v.toFixed(1)}%`}
                  style={{ fontSize: 11, fill: C.textSec }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {barraAtiva && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.blue }}>
              <Filter size={12} />
              Filtrando: <strong>{barraAtiva}</strong>
              <button onClick={() => setBarraAtiva(null)}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: `1px solid ${C.blue}`,
                  borderRadius: 6, padding: "2px 8px", fontSize: 11, color: C.blue, cursor: "pointer" }}>
                <X size={10} /> Remover filtro
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Gráfico mensal ── */}
      {mensal && mensal.dados.length > 0 && (
        <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12, padding: "20px 24px",
          boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: C.textPri }}>
            Evolução mensal por tipo de incentivo
          </h2>
          <p style={{ margin: "0 0 14px", fontSize: 11, color: C.textSec }}>Barras empilhadas por categoria — valores em R$</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mensal.dados} margin={{ top: 4, right: 16, left: 60, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="competencia" tick={{ fontSize: 10, fill: C.textSec }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 10, fill: C.textSec }} axisLine={false} tickLine={false} width={56} />
              <Tooltip content={<TooltipFns />} />
              {mensal.tipos.map(tipo => (
                <Bar key={tipo} dataKey={tipo} name={tipo} stackId="a"
                  fill={TIPO_CORES[tipo] || C.gray} maxBarSize={48} radius={[0,0,0,0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12, marginTop: 10 }}>
            {mensal.tipos.map(tipo => (
              <div key={tipo} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.textSec }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: TIPO_CORES[tipo] || C.gray }} />
                {tipo}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabela de transferências ── */}
      <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12, overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
        {/* Cabeçalho tabela */}
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.grayBdr}`, display: "flex",
          justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: C.textPri }}>
            Transferências FNS
            {barraAtiva && <span style={{ fontSize: 11, color: C.blue, marginLeft: 8 }}>— {barraAtiva}</span>}
          </span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {lista && (
              <span style={{ fontSize: 12, color: C.textSec }}>
                {lista.total_registros} registros · {BRL(lista.total_liquido)} líquido
              </span>
            )}
            <a href="https://consultafns.saude.gov.br" target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: C.blue }}>
              <ExternalLink size={11} /> FNS
            </a>
          </div>
        </div>

        {listaQ.isLoading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: C.textSec }}>
            <RefreshCw size={24} color={C.blue} style={{ animation: "spin 1s linear infinite", marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 13 }}>Carregando transferências…</p>
          </div>
        ) : transferencias.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center", color: C.textSec }}>
            <Layers size={28} color={C.textMut} style={{ marginBottom: 10 }} />
            <p style={{ margin: 0, fontSize: 14 }}>
              {semDados ? "Clique em Sincronizar com FNS para importar os dados oficiais." : "Nenhuma transferência para os filtros aplicados."}
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" as const }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: `2px solid ${C.grayBdr}` }}>
                    {["Data", "Tipo", "Ação / Descrição", "Valor Total", "Desconto", "Valor Líquido", "Situação"].map((h, i) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: (i >= 3 && i <= 5 ? "right" : i === 6 ? "center" : "left") as "right" | "center" | "left",
                        fontWeight: 700, color: C.textSec, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.04em", whiteSpace: "nowrap" as const }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transferencias.map((t, i) => <LinhaFns key={t.id} t={t} idx={i} />)}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${C.grayBdr2}`, background: "#f1f5f9" }}>
                    <td colSpan={3} style={{ padding: "10px 14px", fontWeight: 700, color: C.textPri, fontSize: 13 }}>
                      Total {barraAtiva ? `(${barraAtiva})` : "geral"}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: C.textSec, fontWeight: 700 }}>
                      {BRL(transferencias.reduce((s, t) => s + (t.valor_total || 0), 0))}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: C.red }}>
                      {BRL(transferencias.reduce((s, t) => s + (t.valor_desconto || 0), 0))}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: C.money, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
                      {BRL(transferencias.reduce((s, t) => s + (t.valor_liquido || 0), 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Paginação */}
            {lista && lista.total_paginas > 1 && (
              <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.grayBdr}`, display: "flex",
                justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: C.textSec }}>
                  Página {lista.pagina} de {lista.total_paginas}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  {pagina > 1 && (
                    <button onClick={() => setPagina(p => p - 1)}
                      style={{ padding: "5px 12px", border: `1px solid ${C.grayBdr}`, borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
                      ← Anterior
                    </button>
                  )}
                  {pagina < lista.total_paginas && (
                    <button onClick={() => setPagina(p => p + 1)}
                      style={{ padding: "5px 12px", border: `1px solid ${C.blue}`, borderRadius: 6, fontSize: 12,
                        background: C.blue, color: C.white, cursor: "pointer" }}>
                      Próxima →
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Rodapé ── */}
      <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12, padding: "12px 20px",
        display: "flex", flexWrap: "wrap" as const, justifyContent: "space-between", alignItems: "center",
        gap: 10, fontSize: 11, color: C.textSec }}>
        <span>
          CNPJ FMS Apuí: <strong>12.834.320/0001-26</strong> · IBGE: <strong>130014</strong> · AM
        </span>
        <a href="https://consultafns.saude.gov.br" target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.blue }}>
          <ExternalLink size={10} /> consultafns.saude.gov.br
        </a>
      </div>
    </div>
  );
}
