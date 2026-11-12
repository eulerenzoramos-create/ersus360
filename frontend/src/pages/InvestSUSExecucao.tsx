// INVESTSUS — Execução Financeira dos Planos de Trabalho
// Aba "Execução das Propostas": painel consolidado (BI), ficha individual por proposta com
// planilha editável (previsto × empenhado × liquidado × pago), lançamentos, conta vinculada,
// documentos, histórico, alertas e relatórios. Backend: /api/investsus/execucao.
// Aprovado e repasses são oficiais (InvestSUS/FNS); execução é lançada pelo município.
import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  AlertTriangle, ArrowLeft, Check, ChevronDown, ChevronRight, Download, FileSpreadsheet, FileText,
  Info, Lock, Paperclip, Plus, Search, ShieldCheck, Upload, X, Ban, Wallet,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LineChart, Line,
} from "recharts";

// ── Formatação e estilos (mesmo padrão da tela InvestSUS) ─────────────────────
const fmt = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number | null | undefined) => (v == null ? "—" : `${v.toFixed(1).replace(".", ",")}%`);
const fmtData = (d?: string | null) => (d ? d.slice(0, 10).split("-").reverse().join("/") : "—");
const curto = (v: number) =>
  Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(1)} mi` : Math.abs(v) >= 1e3 ? `${(v / 1e3).toFixed(0)} mil` : v.toFixed(0);

const AZUL = "#1e3a5f";
const COR = {
  aprovado: "#0284c7", recebido: "#7c3aed", empenhado: "#0891b2", liquidado: "#d97706",
  pago: "#059669", saldo: "#1e3a5f", critico: "#dc2626", urgente: "#ea580c", atencao: "#d97706", informativo: "#6366f1",
};
const S = {
  card: { background: "#fff", color: "#111827", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16, marginBottom: 14 } as React.CSSProperties,
  title: { fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#111827" } as React.CSSProperties,
  btn: (cor?: string) => ({ padding: "7px 12px", borderRadius: 6, border: cor ? "none" : "1px solid #d1d5db", cursor: "pointer", fontSize: 12, fontWeight: 600, background: cor ?? "#fff", color: cor ? "#fff" : "#374151", display: "inline-flex", alignItems: "center", gap: 5 }) as React.CSSProperties,
  input: { border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 9px", fontSize: 12, width: "100%", boxSizing: "border-box" as const, outline: "none", background: "#fff", color: "#111827" },
  label: { fontSize: 11, color: "#6b7280", display: "block", marginBottom: 3, fontWeight: 500 } as React.CSSProperties,
};
// Planilha estilo Excel: grade fina, cabeçalho cinza, números à direita em fonte tabular
const XL = {
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 12, color: "#1f2937", fontVariantNumeric: "tabular-nums" as const },
  th: { background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "6px 8px", fontWeight: 700, color: "#334155", fontSize: 11, whiteSpace: "nowrap" as const, position: "sticky" as const, top: 0 },
  td: { border: "1px solid #e2e8f0", padding: "4px 8px", verticalAlign: "middle" as const },
  num: { border: "1px solid #e2e8f0", padding: "4px 8px", textAlign: "right" as const, whiteSpace: "nowrap" as const },
  cell: { border: "none", background: "transparent", color: "inherit", width: "100%", fontSize: 12, padding: "3px 2px", outline: "none", fontFamily: "inherit" } as React.CSSProperties,
};

const ORIGEM_CURTO: Record<string, string> = { rp6: "RP 6", rp7: "RP 7", rp8: "RP 8", programa: "Programa MS", outros_federais: "Outros fed.", a_classificar: "A classificar" };
const DEST_CURTO: Record<string, string> = { aps_pap: "APS/PAP", mac: "MAC", outra: "Outros MS", a_classificar: "A classificar" };
const TIPO_LANC: Record<string, string> = {
  empenho: "Empenho", anulacao_empenho: "Anulação de empenho", liquidacao: "Liquidação",
  estorno_liquidacao: "Estorno de liquidação", pagamento: "Pagamento", estorno_pagamento: "Estorno de pagamento",
  nota_fiscal: "Nota fiscal paga", estorno_nota_fiscal: "Estorno de nota fiscal",
};
const TIPO_MOV: Record<string, string> = { saldo_inicial: "Saldo inicial", rendimento: "Rendimento", devolucao: "Devolução", outra_saida: "Outra saída (tarifa etc.)" };
const TIPO_DOC: Record<string, string> = { plano_aprovado: "Plano de trabalho aprovado", espelho_proposta: "Espelho da proposta", nota_fiscal: "Nota fiscal", contrato: "Contrato", comprovante: "Comprovante", extrato: "Extrato bancário", outro: "Outro" };
const NIVEL: Record<string, { label: string; cor: string }> = {
  critico: { label: "Crítico", cor: COR.critico }, urgente: { label: "Urgente", cor: COR.urgente },
  atencao: { label: "Atenção", cor: COR.atencao }, informativo: { label: "Informativo", cor: COR.informativo },
};

const erroMsg = (e: any) => e?.response?.data?.detail ?? e?.message ?? "Erro inesperado";

export async function baixar(url: string, nome: string) {
  const r = await api.get(url, { responseType: "blob" });
  const href = URL.createObjectURL(r.data);
  const a = document.createElement("a");
  a.href = href;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 2000);
}

function OrigemDado({ origem }: { origem: string }) {
  const m: Record<string, [string, string, string]> = {
    oficial: ["Oficial FNS", "#065f46", "#d1fae5"], importado: ["Importado", "#1e40af", "#dbeafe"],
    manual: ["Manual", "#92400e", "#fef3c7"],
  };
  const [t, c, bg] = m[origem] ?? [origem, "#374151", "#f3f4f6"];
  return <span style={{ fontSize: 10, fontWeight: 700, color: c, background: bg, borderRadius: 4, padding: "1px 6px", whiteSpace: "nowrap" }}>{t}</span>;
}

function Validacao({ status }: { status: string }) {
  const m: Record<string, [string, string]> = { validado: ["Validado", "#059669"], rejeitado: ["Rejeitado", "#dc2626"], pendente: ["Pendente de validação", "#9ca3af"] };
  const [t, c] = m[status] ?? [status, "#9ca3af"];
  return <span style={{ fontSize: 10, color: c, fontWeight: 600, whiteSpace: "nowrap" }}>● {t}</span>;
}

// Semáforo da execução: <30% vermelho, <70% âmbar, ≥70% verde; sem plano = cinza
function BarraExec({ pct }: { pct: number | null | undefined }) {
  if (pct == null) return <span style={{ color: "#9ca3af", fontSize: 11 }}>sem plano</span>;
  const cor = pct >= 70 ? "#059669" : pct >= 30 ? "#d97706" : "#dc2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
      <div style={{ width: 54, height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: "100%", background: cor }} />
      </div>
      <span style={{ fontWeight: 700, color: cor, minWidth: 42, textAlign: "right" }}>{fmtPct(pct)}</span>
    </div>
  );
}

function Kpi({ label, valor, sub, cor, fonte }: { label: string; valor: string; sub?: string; cor: string; fonte?: "oficial" | "municipio" | "calculado" }) {
  const f = { oficial: "dado oficial", municipio: "lançado pelo município", calculado: "calculado" }[fonte ?? "calculado"];
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderTop: `3px solid ${cor}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: cor, lineHeight: 1.2 }}>{valor}</div>
      <div style={{ fontSize: 12, color: "#374151", marginTop: 3, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 2 }}>{sub ? `${sub} · ` : ""}{f}</div>
    </div>
  );
}

// Diálogo simples para justificativa/autorização (registros financeiros nunca são apagados)
type Dialogo = { titulo: string; autorizacao?: boolean; onOk: (j: string, a: string) => void } | null;
function DialogoJustificativa({ d, fechar }: { d: Dialogo; fechar: () => void }) {
  const [j, setJ] = useState("");
  const [a, setA] = useState("");
  if (!d) return null;
  return (
    <div role="dialog" aria-modal="true" onClick={fechar} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 10, padding: 18, width: "100%", maxWidth: 460 }}>
        <div style={{ fontWeight: 800, color: AZUL, marginBottom: 10 }}>{d.titulo}</div>
        <label style={S.label}>Justificativa *</label>
        <textarea style={{ ...S.input, minHeight: 70 }} value={j} onChange={e => setJ(e.target.value)} autoFocus />
        {d.autorizacao && (<>
          <label style={{ ...S.label, marginTop: 8 }}>Autorização correspondente * (ofício, portaria, parecer)</label>
          <input style={S.input} value={a} onChange={e => setA(e.target.value)} />
        </>)}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button style={S.btn()} onClick={() => { setJ(""); setA(""); fechar(); }}>Cancelar</button>
          <button style={S.btn(AZUL)} disabled={!j.trim() || (d.autorizacao && !a.trim())}
            onClick={() => { d.onOk(j.trim(), a.trim()); setJ(""); setA(""); fechar(); }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// ── Painel consolidado ────────────────────────────────────────────────────────
type Filtros = { exercicio: string; origem: string; destinacao: string; fase: string; situacao_plano: string; busca: string };
const FILTROS_VAZIOS: Filtros = { exercicio: "", origem: "", destinacao: "", fase: "", situacao_plano: "", busca: "" };

function qs(f: Partial<Filtros> & { proposta_id?: number | string }) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => { if (v !== "" && v != null) p.set(k, String(v)); });
  return p.toString();
}

export function ExecucaoFinanceira({ propostaId, setPropostaId, onAbrirProposta }: {
  propostaId: number | null; setPropostaId: (id: number | null) => void; onAbrirProposta: (p: any) => void;
}) {
  const [f, setF] = useState<Filtros>(FILTROS_VAZIOS);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["investsus-exec-painel", f],
    queryFn: () => api.get(`/api/investsus/execucao/painel?${qs(f)}`).then(r => r.data),
    enabled: !propostaId,
  });

  if (propostaId) return <FichaExecucao propostaId={propostaId} onVoltar={() => setPropostaId(null)} onAbrirProposta={onAbrirProposta} />;
  if (isLoading) return <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Carregando execução financeira…</div>;
  if (isError) return <div style={{ ...S.card, color: "#dc2626" }}>Não foi possível carregar: {erroMsg(error)}</div>;

  const ind = data.indicadores;
  const cons = data.consolidado;
  const op = data.opcoes;
  const props: any[] = data.propostas;
  const set = (k: keyof Filtros) => (e: any) => setF(v => ({ ...v, [k]: e.target.value }));

  return (
    <div>
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#1e3a8a", display: "flex", gap: 8 }}>
        <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
        <div><b>Fonte dos valores.</b> {data.fontes.oficial} {data.fontes.municipio}</div>
      </div>

      {/* Filtros */}
      <div style={{ ...S.card, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: 10, alignItems: "end" }}>
        <div><label style={S.label}>Exercício</label>
          <select style={S.input} value={f.exercicio} onChange={set("exercicio")}>
            <option value="">Todos</option>{op.anos.map((a: number) => <option key={a} value={a}>{a}</option>)}
          </select></div>
        <div><label style={S.label}>Origem do recurso</label>
          <select style={S.input} value={f.origem} onChange={set("origem")}>
            <option value="">Todas</option>{Object.entries(op.origens).map(([k, v]: any) => <option key={k} value={k}>{v}</option>)}
            <option value="a_classificar">A classificar</option>
          </select></div>
        <div><label style={S.label}>Área de aplicação</label>
          <select style={S.input} value={f.destinacao} onChange={set("destinacao")}>
            <option value="">Todas</option>{Object.entries(op.destinacoes).map(([k, v]: any) => <option key={k} value={k}>{v}</option>)}
            <option value="a_classificar">A classificar</option>
          </select></div>
        <div><label style={S.label}>Situação da proposta</label>
          <select style={S.input} value={f.fase} onChange={set("fase")}>
            <option value="">Todas</option>{Object.entries(op.fases).map(([k, v]: any) => <option key={k} value={k}>{v}</option>)}
          </select></div>
        <div><label style={S.label}>Situação do plano</label>
          <select style={S.input} value={f.situacao_plano} onChange={set("situacao_plano")}>
            <option value="">Todas</option>{Object.entries(op.situacoes_plano).map(([k, v]: any) => <option key={k} value={k}>{v}</option>)}
          </select></div>
        <div style={{ position: "relative" }}><label style={S.label}>Proposta</label>
          <Search size={13} style={{ position: "absolute", left: 8, bottom: 9, color: "#9ca3af" }} />
          <input style={{ ...S.input, paddingLeft: 26 }} placeholder="Nº, emenda, objeto…" value={f.busca} onChange={set("busca")} /></div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>Município: <b>{data.municipio}</b><br />
          <button style={{ ...S.btn(), padding: "3px 8px", marginTop: 3 }} onClick={() => setF(FILTROS_VAZIOS)}>Limpar filtros</button></div>
      </div>

      {/* Indicadores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(190px, 100%), 1fr))", gap: 10, marginBottom: 14 }}>
        <Kpi label="Propostas" valor={String(ind.total_propostas)} sub={`${ind.propostas_sem_lancamento} sem lançamento`} cor={AZUL} />
        <Kpi label="Planos de trabalho cadastrados" valor={String(ind.total_planos)} sub={`${fmt(ind.aprovado_sem_plano)} aprovado sem plano`} cor={AZUL} fonte="municipio" />
        <Kpi label="Valor total aprovado" valor={fmt(ind.aprovado)} cor={COR.aprovado} fonte="oficial" />
        <Kpi label="Recebido do FNS" valor={fmt(ind.recebido)} sub={`${fmt(ind.recebido_emendas)} de emendas`} cor={COR.recebido} fonte="oficial" />
        <Kpi label="Aprovado ainda não recebido" valor={fmt(ind.saldo_a_receber)} cor="#6b7280" />
        <Kpi label="Empenhado" valor={fmt(ind.empenhado)} cor={COR.empenhado} fonte="municipio" />
        <Kpi label="Liquidado" valor={fmt(ind.liquidado)} cor={COR.liquidado} fonte="municipio" />
        <Kpi label="Pago" valor={fmt(ind.pago)} cor={COR.pago} fonte="municipio" />
        <Kpi label="Saldo financeiro disponível" valor={fmt(ind.saldo_financeiro)} sub="conta vinculada" cor={COR.saldo} />
        <Kpi label="Saldo de planos não executado" valor={fmt(ind.saldo_plano)} sub="previsto − pago" cor="#b45309" />
        <Kpi label="Execução financeira" valor={fmtPct(ind.perc_execucao)} sub="pago ÷ previsto" cor={ind.perc_execucao >= 70 ? "#059669" : ind.perc_execucao >= 30 ? "#d97706" : "#dc2626"} />
      </div>
      {ind.lancamentos_pendentes_validacao > 0 && (
        <div style={{ fontSize: 12, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
          {ind.lancamentos_pendentes_validacao} lançamento(s)/movimento(s) pendente(s) de validação pelo gestor municipal.
        </div>
      )}

      {/* 6.1 e 6.2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))", gap: 14 }}>
        <div style={S.card}>
          <div style={S.title}>Consolidação por modalidade de recurso</div>
          <TabelaConsolidada linhas={cons.por_origem} colunas={[["aprovado", "Aprovado"], ["recebido", "Recebido"], ["pago", "Pago"], ["saldo_financeiro", "Saldo financeiro"]]} rotulo="Modalidade" />
        </div>
        <div style={S.card}>
          <div style={S.title}>Consolidação por área de aplicação</div>
          <TabelaConsolidada linhas={cons.por_destinacao} colunas={[["recebido", "Recebido"], ["empenhado", "Empenhado"], ["liquidado", "Liquidado"], ["pago", "Pago"], ["saldo_financeiro", "Saldo"]]} rotulo="Área" />
          <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 6 }}>Uma emenda destinada à MAC entra no total de emendas e no total MAC — o total geral é o mesmo nas duas tabelas.</div>
        </div>
      </div>
      <MatrizOrigemArea matriz={cons.matriz} />
      <Graficos data={data} />

      {/* Lista de propostas */}
      <div style={S.card}>
        <div style={{ ...S.title, display: "flex", justifyContent: "space-between" }}>
          <span>Execução por proposta ({props.length})</span>
          <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 400 }}>Clique na proposta para abrir a ficha e a planilha do plano de trabalho</span>
        </div>
        {props.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: "#9ca3af" }}>Nenhuma proposta para os filtros escolhidos.</div>
        ) : (
          <div style={{ overflowX: "auto", maxHeight: 560, overflowY: "auto", border: "1px solid #cbd5e1" }}>
            <table style={XL.table}>
              <thead><tr>
                {["Proposta", "Exerc.", "Origem", "Área", "Aprovado", "Recebido", "Empenhado", "Liquidado", "Pago", "Saldo financeiro", "Saldo do plano", "% exec.", "% físico", "Plano", "Alertas"].map(h =>
                  <th key={h} style={{ ...XL.th, textAlign: ["Proposta", "Origem", "Área", "Plano"].includes(h) ? "left" : "right" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {props.map((p: any) => (
                  <tr key={p.proposta_id} onClick={() => setPropostaId(p.proposta_id)} style={{ cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")} onMouseLeave={e => (e.currentTarget.style.background = "")}>
                    <td style={XL.td}>
                      <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 11 }}>{p.numero_proposta}</div>
                      <div style={{ fontSize: 10.5, color: "#6b7280", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.objeto ?? ""}>{p.objeto || p.programa || "—"}</div>
                    </td>
                    <td style={XL.num}>{p.exercicio ?? "—"}</td>
                    <td style={XL.td}>{ORIGEM_CURTO[p.origem] ?? p.origem}{p.origem_manual ? " *" : ""}</td>
                    <td style={XL.td}>{DEST_CURTO[p.destinacao] ?? p.destinacao}{p.destinacao_manual ? " *" : ""}</td>
                    <td style={XL.num}>{fmt(p.aprovado)}</td>
                    <td style={XL.num}>{fmt(p.recebido)}</td>
                    <td style={XL.num}>{p.sem_lancamento ? <span style={{ color: "#9ca3af" }}>sem lançamento</span> : fmt(p.empenhado)}</td>
                    <td style={XL.num}>{p.sem_lancamento ? "—" : fmt(p.liquidado)}</td>
                    <td style={XL.num}>{p.sem_lancamento ? "—" : fmt(p.pago)}</td>
                    <td style={{ ...XL.num, fontWeight: 700, color: p.saldo_financeiro < 0 ? "#dc2626" : AZUL }}>{fmt(p.saldo_financeiro)}</td>
                    <td style={XL.num}>{p.saldo_plano == null ? "—" : fmt(p.saldo_plano)}</td>
                    <td style={XL.num}><BarraExec pct={p.perc_execucao} /></td>
                    <td style={XL.num}>{fmtPct(p.perc_fisico ?? 0)}</td>
                    <td style={XL.td}>{op.situacoes_plano[p.situacao_plano] ?? p.situacao_plano}</td>
                    <td style={XL.num}>{p.alertas ? <span style={{ color: NIVEL[p.alertas_niveis.includes("critico") ? "critico" : p.alertas_niveis.includes("urgente") ? "urgente" : "atencao"].cor, fontWeight: 700 }}>{p.alertas}</span> : <span style={{ color: "#059669" }}>✓</span>}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr style={{ background: "#f1f5f9", fontWeight: 800 }}>
                <td style={XL.td} colSpan={4}>TOTAL</td>
                {["aprovado", "recebido", "empenhado", "liquidado", "pago", "saldo_financeiro", "saldo_plano"].map(k =>
                  <td key={k} style={XL.num}>{fmt(cons.total[k])}</td>)}
                <td style={XL.num}><BarraExec pct={cons.total.perc_execucao} /></td>
                <td style={XL.td} colSpan={3} />
              </tr></tfoot>
            </table>
          </div>
        )}
        <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 6 }}>* classificação ajustada manualmente na ficha (as demais são derivadas da proposta oficial).</div>
      </div>
    </div>
  );
}

function TabelaConsolidada({ linhas, colunas, rotulo }: { linhas: any[]; colunas: [string, string][]; rotulo: string }) {
  const total = (k: string) => linhas.reduce((s, l) => s + (l[k] ?? 0), 0);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={XL.table}>
        <thead><tr><th style={{ ...XL.th, textAlign: "left" }}>{rotulo}</th><th style={{ ...XL.th, textAlign: "right" }}>Qtd</th>
          {colunas.map(([, h]) => <th key={h} style={{ ...XL.th, textAlign: "right" }}>{h}</th>)}</tr></thead>
        <tbody>
          {linhas.map(l => (
            <tr key={l.chave}><td style={XL.td}>{l.rotulo}</td><td style={XL.num}>{l.qtd}</td>
              {colunas.map(([k]) => <td key={k} style={XL.num}>{l.qtd ? fmt(l[k]) : <span style={{ color: "#cbd5e1" }}>—</span>}</td>)}</tr>
          ))}
          <tr style={{ background: "#f1f5f9", fontWeight: 800 }}><td style={XL.td}>TOTAL GERAL</td><td style={XL.num}>{total("qtd")}</td>
            {colunas.map(([k]) => <td key={k} style={XL.num}>{fmt(total(k))}</td>)}</tr>
        </tbody>
      </table>
    </div>
  );
}

function MatrizOrigemArea({ matriz }: { matriz: any[] }) {
  const [aberto, setAberto] = useState(false);
  const origens = Array.from(new Set(matriz.map(m => m.origem)));
  const areas = Array.from(new Set(matriz.map(m => m.destinacao)));
  const cel = (o: string, a: string) => matriz.find(m => m.origem === o && m.destinacao === a);
  return (
    <div style={S.card}>
      <button style={{ ...S.btn(), border: "none", padding: 0, fontSize: 13 }} onClick={() => setAberto(v => !v)}>
        {aberto ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Cruzamento origem × área (recebido / pago)
      </button>
      {aberto && (matriz.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 8 }}>Sem propostas.</div> : (
        <div style={{ overflowX: "auto", marginTop: 10 }}>
          <table style={XL.table}>
            <thead><tr><th style={{ ...XL.th, textAlign: "left" }}>Origem \ Área</th>{areas.map(a => <th key={a} style={{ ...XL.th, textAlign: "right" }}>{DEST_CURTO[a] ?? a}</th>)}</tr></thead>
            <tbody>{origens.map(o => (
              <tr key={o}><td style={XL.td}>{ORIGEM_CURTO[o] ?? o}</td>
                {areas.map(a => { const c = cel(o, a); return <td key={a} style={XL.num}>{c ? <>{fmt(c.recebido)}<div style={{ fontSize: 10, color: "#059669" }}>pago {fmt(c.pago)}</div></> : "—"}</td>; })}</tr>
            ))}</tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function Graficos({ data }: { data: any }) {
  const cons = data.consolidado;
  const props: any[] = data.propostas;
  const porOrigem = cons.por_origem.filter((l: any) => l.qtd).map((l: any) => ({ nome: ORIGEM_CURTO[l.chave] ?? l.rotulo, Recebido: l.recebido, Pago: l.pago, "Saldo financeiro": l.saldo_financeiro }));
  const porArea = cons.por_destinacao.filter((l: any) => l.qtd).map((l: any) => ({ nome: DEST_CURTO[l.chave] ?? l.rotulo, Recebido: l.recebido, Empenhado: l.empenhado, Liquidado: l.liquidado, Pago: l.pago }));
  const execProp = props.filter(p => p.perc_execucao != null).sort((a, b) => b.perc_execucao - a.perc_execucao).slice(0, 12).map(p => ({ nome: p.numero_proposta.slice(-8), "% execução": p.perc_execucao }));
  const ranking = [...props].filter(p => p.saldo_financeiro > 0).sort((a, b) => b.saldo_financeiro - a.saldo_financeiro).slice(0, 10).map(p => ({ nome: p.numero_proposta.slice(-8), "Saldo financeiro": p.saldo_financeiro }));
  const menores = props.filter(p => p.perc_execucao != null && p.recebido > 0).sort((a, b) => a.perc_execucao - b.perc_execucao).slice(0, 10).map(p => ({ nome: p.numero_proposta.slice(-8), "% execução": p.perc_execucao }));
  const programas = data.graficos.programas_ms.slice(0, 10).map((g: any) => ({ nome: g.programa.length > 28 ? g.programa.slice(0, 28) + "…" : g.programa, Recebido: g.recebido, Pago: g.pago }));
  const mensal = data.graficos.evolucao_mensal.map((m: any) => ({ nome: m.mes.split("-").reverse().join("/"), "Recebido FNS": m.recebido, Pago: m.pago }));
  const tt = (v: any, n: any) => (String(n).includes("%") ? fmtPct(v) : fmt(v));
  const Vazio = () => <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 12 }}>Sem dados lançados para este gráfico.</div>;
  const Caixa = ({ titulo, children, vazio }: { titulo: string; children: any; vazio: boolean }) => (
    <div style={{ ...S.card, marginBottom: 0 }}>
      <div style={{ ...S.title, fontSize: 13 }}>{titulo}</div>
      {vazio ? <Vazio /> : <ResponsiveContainer width="100%" height={220}>{children}</ResponsiveContainer>}
    </div>
  );
  const eixo = { fontSize: 10, fill: "#6b7280" };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))", gap: 14, marginBottom: 14 }}>
      <Caixa titulo="1. Recebido × pago por modalidade" vazio={!porOrigem.length}>
        <BarChart data={porOrigem}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="nome" tick={eixo} /><YAxis tickFormatter={curto} tick={eixo} /><Tooltip formatter={tt} /><Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Recebido" fill={COR.recebido} /><Bar dataKey="Pago" fill={COR.pago} /></BarChart>
      </Caixa>
      <Caixa titulo="2. Execução financeira por proposta" vazio={!execProp.length}>
        <BarChart data={execProp}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="nome" tick={eixo} /><YAxis unit="%" tick={eixo} /><Tooltip formatter={tt} />
          <Bar dataKey="% execução" fill={COR.aprovado} /></BarChart>
      </Caixa>
      <Caixa titulo="3. Saldo financeiro por modalidade" vazio={!porOrigem.length}>
        <BarChart data={porOrigem}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="nome" tick={eixo} /><YAxis tickFormatter={curto} tick={eixo} /><Tooltip formatter={tt} />
          <Bar dataKey="Saldo financeiro" fill={COR.saldo} /></BarChart>
      </Caixa>
      <Caixa titulo="4. Execução por área (APS/PAP × MAC)" vazio={!porArea.length}>
        <BarChart data={porArea}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="nome" tick={eixo} /><YAxis tickFormatter={curto} tick={eixo} /><Tooltip formatter={tt} /><Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Recebido" fill={COR.recebido} /><Bar dataKey="Empenhado" fill={COR.empenhado} /><Bar dataKey="Liquidado" fill={COR.liquidado} /><Bar dataKey="Pago" fill={COR.pago} /></BarChart>
      </Caixa>
      <Caixa titulo="5. Recursos de Programas MS" vazio={!programas.length}>
        <BarChart data={programas} layout="vertical" margin={{ left: 10 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={curto} tick={eixo} /><YAxis type="category" dataKey="nome" width={150} tick={eixo} /><Tooltip formatter={tt} /><Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Recebido" fill={COR.recebido} /><Bar dataKey="Pago" fill={COR.pago} /></BarChart>
      </Caixa>
      <Caixa titulo="6. Evolução mensal: repasses e pagamentos" vazio={!mensal.length}>
        <LineChart data={mensal}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="nome" tick={eixo} /><YAxis tickFormatter={curto} tick={eixo} /><Tooltip formatter={tt} /><Legend wrapperStyle={{ fontSize: 11 }} />
          <Line dataKey="Recebido FNS" stroke={COR.recebido} strokeWidth={2} dot={false} /><Line dataKey="Pago" stroke={COR.pago} strokeWidth={2} dot={false} /></LineChart>
      </Caixa>
      <Caixa titulo="7. Ranking de propostas por saldo financeiro" vazio={!ranking.length}>
        <BarChart data={ranking} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={curto} tick={eixo} /><YAxis type="category" dataKey="nome" width={80} tick={eixo} /><Tooltip formatter={tt} />
          <Bar dataKey="Saldo financeiro" fill={COR.saldo} /></BarChart>
      </Caixa>
      <Caixa titulo="8. Propostas com menor execução" vazio={!menores.length}>
        <BarChart data={menores} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" unit="%" tick={eixo} /><YAxis type="category" dataKey="nome" width={80} tick={eixo} /><Tooltip formatter={tt} />
          <Bar dataKey="% execução" fill={COR.critico} /></BarChart>
      </Caixa>
    </div>
  );
}

// ── Ficha individual ──────────────────────────────────────────────────────────
function FichaExecucao({ propostaId, onVoltar, onAbrirProposta }: { propostaId: number; onVoltar: () => void; onAbrirProposta: (p: any) => void }) {
  const qc = useQueryClient();
  const chave = ["investsus-exec-ficha", propostaId];
  const { data, isLoading, isError, error } = useQuery({
    queryKey: chave,
    queryFn: () => api.get(`/api/investsus/execucao/propostas/${propostaId}`).then(r => r.data),
  });
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const recarregar = () => { qc.invalidateQueries({ queryKey: chave }); qc.invalidateQueries({ queryKey: ["investsus-exec-painel"] }); qc.invalidateQueries({ queryKey: ["investsus-exec-alertas"] }); };
  const acao = async (fn: () => Promise<any>, sucesso?: string) => {
    try { const r = await fn(); setMsg(sucesso || r?.data?.mensagem ? { ok: true, texto: r?.data?.mensagem ?? sucesso } : null); recarregar(); return true; }
    catch (e) { setMsg({ ok: false, texto: erroMsg(e) }); return false; }
  };

  if (isLoading) return <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Carregando ficha…</div>;
  if (isError) return <div style={{ ...S.card, color: "#dc2626" }}>Não foi possível carregar: {erroMsg(error)} <button style={S.btn()} onClick={onVoltar}>Voltar</button></div>;

  const idf = data.identificacao, r = data.resumo, perm = data.permissoes;
  const aprovado = !!data.ficha?.plano_aprovado_em;
  const base = `/api/investsus/execucao`;

  return (
    <div>
      <DialogoJustificativa d={dialogo} fechar={() => setDialogo(null)} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <button style={S.btn()} onClick={onVoltar}><ArrowLeft size={13} /> Voltar ao painel</button>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button style={S.btn()} onClick={() => onAbrirProposta({ id: idf.proposta_id })}><FileText size={13} /> Detalhe completo da proposta</button>
          <button style={S.btn()} onClick={() => baixar(`${base}/propostas/${propostaId}/planilha.xlsx`, `plano_${idf.numero_proposta}.xlsx`).catch(e => setMsg({ ok: false, texto: erroMsg(e) }))}><FileSpreadsheet size={13} /> Exportar Excel</button>
          {perm.lancar && <ImportarPlanilha propostaId={propostaId} onFim={(t, ok) => { setMsg({ ok, texto: t }); recarregar(); }} />}
          <button style={S.btn()} onClick={() => baixar(`${base}/relatorios/individual?formato=pdf&proposta_id=${propostaId}`, `execucao_${idf.numero_proposta}.pdf`).catch(e => setMsg({ ok: false, texto: erroMsg(e) }))}><Download size={13} /> Relatório PDF</button>
        </div>
      </div>
      {msg && (
        <div style={{ background: msg.ok ? "#f0fdf4" : "#fef2f2", border: `1px solid ${msg.ok ? "#bbf7d0" : "#fecaca"}`, color: msg.ok ? "#166534" : "#991b1b", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12, display: "flex", justifyContent: "space-between", whiteSpace: "pre-line", position: "sticky", top: 8, zIndex: 50, boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}>
          <span>{msg.texto}</span><button onClick={() => setMsg(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} /></button>
        </div>
      )}

      {/* Identificação */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{idf.municipio} · IBGE {idf.municipio_ibge ?? "—"} · Exercício {idf.exercicio ?? "—"}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: AZUL, fontFamily: "monospace" }}>Proposta {idf.numero_proposta}</div>
            <div style={{ fontSize: 12, color: "#374151", marginTop: 2, maxWidth: 760 }}>{idf.objeto || idf.programa || "Objeto não informado"}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              {idf.numero_emenda && <>Emenda {idf.numero_emenda} · </>}{idf.parlamentar && <>{idf.parlamentar} · </>}
              {data.classificacao.origem_rotulo} · {data.classificacao.destinacao_rotulo} · {idf.situacao_proposta_texto || idf.fase_rotulo}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: "#6b7280" }}>
            <div>Aprovado <b style={{ color: COR.aprovado, fontSize: 14 }}>{fmt(r.aprovado)}</b> <OrigemDado origem="oficial" /></div>
            <div style={{ marginTop: 3 }}>Recebido <b style={{ color: COR.recebido, fontSize: 14 }}>{fmt(r.recebido)}</b> <OrigemDado origem="oficial" /></div>
            <div style={{ marginTop: 3 }}>{r.recebido_info.qtd_parcelas} parcela(s){r.recebido_info.ultimo_repasse ? ` · último repasse ${fmtData(r.recebido_info.ultimo_repasse)}` : ""}</div>
            {r.recebido_info.base === "proposta" && <div style={{ color: "#92400e" }}>valor pago da proposta (repasses sem detalhe de data)</div>}
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))", gap: 10, marginBottom: 14 }}>
        <Kpi label="Valor do plano de trabalho" valor={r.tem_plano ? fmt(r.valor_plano) : "sem plano"} sub={r.tem_plano && r.valor_plano_original !== r.valor_plano ? `original ${fmt(r.valor_plano_original)}` : undefined} cor={AZUL} fonte="municipio" />
        <Kpi label="Empenhado" valor={fmt(r.empenhado)} cor={COR.empenhado} fonte="municipio" />
        <Kpi label="Liquidado" valor={fmt(r.liquidado)} cor={COR.liquidado} fonte="municipio" />
        <Kpi label="Pago" valor={fmt(r.pago)} cor={COR.pago} fonte="municipio" />
        <Kpi label="A receber do FNS" valor={fmt(r.saldo_a_receber)} cor="#6b7280" />
        <Kpi label="Saldo financeiro disponível" valor={fmt(r.saldo_financeiro)} sub={r.diferenca_conciliacao != null ? `extrato: dif. ${fmt(r.diferenca_conciliacao)}` : "sem extrato informado"} cor={r.saldo_financeiro < 0 ? "#dc2626" : COR.saldo} />
        <Kpi label="Saldo do plano não executado" valor={r.saldo_plano == null ? "—" : fmt(r.saldo_plano)} cor="#b45309" />
        <Kpi label="Execução financeira" valor={fmtPct(r.perc_execucao)} sub="pago ÷ previsto" cor={(r.perc_execucao ?? 0) >= 70 ? "#059669" : (r.perc_execucao ?? 0) >= 30 ? "#d97706" : "#dc2626"} />
      </div>
      {r.sem_lancamento && (
        <div style={{ fontSize: 12, color: "#6b7280", background: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
          Não houve lançamento de execução financeira nesta proposta. Os valores de empenho, liquidação e pagamento aparecem zerados até o primeiro lançamento.
        </div>
      )}

      {data.alertas.length > 0 && (
        <div style={S.card}>
          <div style={S.title}>Pendências e alertas ({data.alertas.length})</div>
          {data.alertas.map((a: any, i: number) => <LinhaAlerta key={i} a={a} />)}
        </div>
      )}

      <CadastroFicha data={data} perm={perm} salvar={(corpo: any) => acao(() => api.put(`${base}/propostas/${propostaId}/ficha`, corpo), "Ficha salva.")} />

      <Planilha data={data} perm={perm} aprovado={aprovado} propostaId={propostaId} acao={acao} setDialogo={setDialogo} />

      <ContaVinculada data={data} perm={perm} propostaId={propostaId} acao={acao} setDialogo={setDialogo} />

      <Documentos data={data} perm={perm} propostaId={propostaId} acao={acao} setDialogo={setDialogo} setMsg={setMsg} />

      <Historico historico={data.historico} />
    </div>
  );
}

function LinhaAlerta({ a, extra }: { a: any; extra?: React.ReactNode }) {
  const n = NIVEL[a.nivel] ?? NIVEL.atencao;
  return (
    <div style={{ borderLeft: `4px solid ${n.cor}`, background: `${n.cor}0d`, borderRadius: 6, padding: "8px 12px", marginBottom: 6, fontSize: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: n.cor, textTransform: "uppercase" }}>{n.label}</span>
        {extra}
        <span style={{ fontWeight: 600, color: "#111827" }}>{a.problema}</span>
        {a.acao && <span style={{ color: "#6b7280" }}>· Ação: {a.acao}</span>}
      </div>
      <div style={{ color: "#4b5563", marginTop: 2 }}>Providência: {a.providencia}{a.responsavel ? ` · Responsável: ${a.responsavel}` : ""}</div>
    </div>
  );
}

function CadastroFicha({ data, perm, salvar }: { data: any; perm: any; salvar: (c: any) => Promise<boolean> }) {
  const fi = data.ficha ?? {};
  const auto = data.classificacao_automatica;
  const inicial = {
    origem_recurso: fi.origem_recurso ?? "", destinacao: fi.destinacao ?? "", programa_acao: fi.programa_acao ?? data.identificacao.acao_orcamentaria ?? "",
    conta_bancaria: fi.conta_bancaria ?? data.identificacao.conta_bancaria_proposta ?? "", situacao_plano: fi.situacao_plano ?? "nao_cadastrado",
    prazo_execucao: fi.prazo_execucao ?? "", responsavel: fi.responsavel ?? "", observacoes: fi.observacoes ?? "",
    saldo_extrato: fi.saldo_extrato ?? "", saldo_extrato_data: fi.saldo_extrato_data ?? "",
  };
  const [f, setF] = useState<any>(inicial);
  const [aberto, setAberto] = useState(!data.ficha);
  const set = (k: string) => (e: any) => setF((v: any) => ({ ...v, [k]: e.target.value }));
  const dis = !perm.lancar;
  const ORIG: Record<string, string> = { rp6: "Emenda individual – RP 6", rp7: "Emenda de bancada – RP 7", rp8: "Emenda de comissão – RP 8", programa: "Recursos de Programa do MS", outros_federais: "Outros recursos federais" };
  const DEST: Record<string, string> = { aps_pap: "Atenção Primária – APS/PAP", mac: "Média e Alta Complexidade – MAC", outra: "Outras finalidades/programas MS" };
  return (
    <div style={S.card}>
      <button style={{ ...S.btn(), border: "none", padding: 0, fontSize: 14, fontWeight: 700, color: "#111827" }} onClick={() => setAberto(v => !v)}>
        {aberto ? <ChevronDown size={15} /> : <ChevronRight size={15} />} Cadastro do plano de trabalho
      </button>
      {aberto && (<>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, 100%), 1fr))", gap: 10, marginTop: 12 }}>
          <div><label style={S.label}>Origem do recurso</label>
            <select style={S.input} value={f.origem_recurso} onChange={set("origem_recurso")} disabled={dis}>
              <option value="">Automática: {ORIG[auto.origem] ?? "a classificar"}</option>
              {Object.entries(ORIG).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></div>
          <div><label style={S.label}>Destinação assistencial</label>
            <select style={S.input} value={f.destinacao} onChange={set("destinacao")} disabled={dis}>
              <option value="">Automática: {DEST[auto.destinacao] ?? "a classificar"}</option>
              {Object.entries(DEST).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></div>
          <div><label style={S.label}>Programa/ação orçamentária</label><input style={S.input} value={f.programa_acao} onChange={set("programa_acao")} disabled={dis} /></div>
          <div><label style={S.label}>Conta bancária vinculada</label><input style={S.input} value={f.conta_bancaria} onChange={set("conta_bancaria")} disabled={dis} /></div>
          <div><label style={S.label}>Situação do plano de trabalho</label>
            <select style={S.input} value={f.situacao_plano} onChange={set("situacao_plano")} disabled={dis}>
              {Object.entries({ nao_cadastrado: "Não cadastrado", em_elaboracao: "Em elaboração", aprovado: "Aprovado", em_execucao: "Em execução", concluido: "Concluído" }).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></div>
          <div><label style={S.label}>Prazo de execução</label><input type="date" style={S.input} value={f.prazo_execucao} onChange={set("prazo_execucao")} disabled={dis} /></div>
          <div><label style={S.label}>Responsável pelo acompanhamento</label><input style={S.input} value={f.responsavel} onChange={set("responsavel")} disabled={dis} placeholder="Nome / setor" /></div>
          <div><label style={S.label}>Saldo do extrato bancário (conciliação)</label><input type="number" step="0.01" style={S.input} value={f.saldo_extrato} onChange={set("saldo_extrato")} disabled={dis} /></div>
          <div><label style={S.label}>Data do extrato</label><input type="date" style={S.input} value={f.saldo_extrato_data} onChange={set("saldo_extrato_data")} disabled={dis} /></div>
        </div>
        <div style={{ marginTop: 10 }}><label style={S.label}>Observações</label><textarea style={{ ...S.input, minHeight: 50 }} value={f.observacoes} onChange={set("observacoes")} disabled={dis} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Valores indicado ({fmt(data.identificacao.valor_indicado)}), aprovado e recebidos vêm do InvestSUS/FNS e não são editados aqui.</div>
          {perm.lancar && <button style={S.btn(AZUL)} onClick={() => salvar({ ...f, saldo_extrato: f.saldo_extrato === "" ? null : Number(f.saldo_extrato) })}><Check size={13} /> Salvar cadastro</button>}
        </div>
      </>)}
    </div>
  );
}

// ── Planilha editável ─────────────────────────────────────────────────────────
function CelulaEditavel({ valor, tipo = "text", onSalvar, disabled, alinhar }: { valor: any; tipo?: string; onSalvar: (v: any) => void; disabled?: boolean; alinhar?: "right" }) {
  const [v, setV] = useState(valor ?? "");
  const ultimo = useRef(valor ?? "");
  if (ultimo.current !== (valor ?? "")) { ultimo.current = valor ?? ""; setV(valor ?? ""); }
  if (disabled) return <span style={{ display: "block", textAlign: alinhar }}>{tipo === "number" && valor != null && valor !== "" ? Number(valor).toLocaleString("pt-BR") : (valor || "—")}</span>;
  return (
    <input type="text" inputMode={tipo === "number" ? "decimal" : undefined} value={v} style={{ ...XL.cell, textAlign: alinhar }}
      onFocus={e => (e.currentTarget.style.background = "#fffbeb")}
      onChange={e => setV(e.target.value)}
      onKeyDown={e => { if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur(); if (e.key === "Escape") { setV(valor ?? ""); } }}
      onBlur={e => {
        e.currentTarget.style.background = "transparent";
        if (String(v) === String(valor ?? "")) return;
        if (tipo !== "number") return onSalvar(v);
        const n = v === "" ? null : Number(String(v).includes(",") ? String(v).replace(/\./g, "").replace(",", ".") : v);
        if (n !== null && Number.isNaN(n)) { setV(valor ?? ""); return; }
        onSalvar(n);
      }} />
  );
}

function Planilha({ data, perm, aprovado, propostaId, acao, setDialogo }: any) {
  const base = `/api/investsus/execucao`;
  const acoes: any[] = data.acoes.filter((a: any) => a.ativa);
  const inativas: any[] = data.acoes.filter((a: any) => !a.ativa);
  const [expandida, setExpandida] = useState<number | null>(null);
  const [nova, setNova] = useState({ descricao: "", natureza_despesa: "", quantidade: "", unidade: "", valor_unitario: "", valor_previsto: "" });
  const lancar = perm.lancar;

  const salvarCampo = (a: any, campo: string, valor: any) => {
    const mexePrevisto = ["valor_previsto", "quantidade", "valor_unitario"].includes(campo);
    const enviar = (j?: string, au?: string) => acao(() => api.put(`${base}/acoes/${a.id}`, { [campo]: valor, justificativa: j, autorizacao: au }));
    if (aprovado && mexePrevisto) setDialogo({ titulo: `Alterar o previsto de "${a.descricao}" (plano aprovado)`, autorizacao: true, onOk: enviar });
    else enviar();
  };
  const criar = () => {
    const corpo = {
      descricao: nova.descricao, natureza_despesa: nova.natureza_despesa || null, unidade: nova.unidade || null,
      quantidade: nova.quantidade === "" ? null : Number(nova.quantidade), valor_unitario: nova.valor_unitario === "" ? null : Number(nova.valor_unitario),
      valor_previsto: nova.valor_previsto === "" ? null : Number(nova.valor_previsto),
    };
    const enviar = async (j?: string, au?: string) => {
      if (await acao(() => api.post(`${base}/propostas/${propostaId}/acoes`, { ...corpo, justificativa: j, autorizacao: au }), "Ação incluída."))
        setNova({ descricao: "", natureza_despesa: "", quantidade: "", unidade: "", valor_unitario: "", valor_previsto: "" });
    };
    if (aprovado) setDialogo({ titulo: "Incluir ação em plano já aprovado", autorizacao: true, onOk: enviar });
    else enviar();
  };
  const tot = (k: string) => acoes.reduce((s, a) => s + (a[k] ?? 0), 0);
  const totPrev = tot("previsto");

  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <div style={S.title as any}>Planilha de execução do plano de trabalho
          {aprovado
            ? <span style={{ marginLeft: 8, fontSize: 11, color: "#065f46", background: "#d1fae5", borderRadius: 4, padding: "2px 7px" }}><Lock size={10} /> Plano aprovado em {fmtData(data.ficha.plano_aprovado_em)} — previsto original preservado</span>
            : <span style={{ marginLeft: 8, fontSize: 11, color: "#92400e", background: "#fef3c7", borderRadius: 4, padding: "2px 7px" }}>Rascunho — ainda não registrado como aprovado</span>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {lancar && data.importacao.pendentes > 0 && (
            <button style={S.btn("#0891b2")} onClick={() => acao(() => api.post(`${base}/propostas/${propostaId}/importar-plano`))}>
              <Download size={13} /> Importar plano do InvestSUS ({data.importacao.pendentes})
            </button>)}
          {perm.validar && !aprovado && acoes.length > 0 && (
            <button style={S.btn("#059669")} onClick={() => { if (confirm("Registrar este plano como aprovado? O previsto atual passa a ser a referência original e alterações exigirão justificativa e autorização.")) acao(() => api.post(`${base}/propostas/${propostaId}/aprovar-plano`), "Plano registrado como aprovado."); }}>
              <ShieldCheck size={13} /> Registrar plano aprovado
            </button>)}
        </div>
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #cbd5e1" }}>
        <table style={XL.table}>
          <thead><tr>
            <th style={{ ...XL.th, width: 28 }} />
            <th style={{ ...XL.th, textAlign: "left", minWidth: 220 }}>Ação/Despesa</th>
            <th style={XL.th}>Natureza</th><th style={XL.th}>Qtd</th><th style={XL.th}>Unid.</th><th style={XL.th}>Valor unit.</th>
            <th style={{ ...XL.th, textAlign: "right" }}>Previsto original</th>
            <th style={{ ...XL.th, textAlign: "right", background: "#e0f2fe" }}>Valor previsto</th>
            <th style={{ ...XL.th, textAlign: "right" }}>Empenhado</th><th style={{ ...XL.th, textAlign: "right" }}>Liquidado</th>
            <th style={{ ...XL.th, textAlign: "right" }}>Pago</th><th style={{ ...XL.th, textAlign: "right" }}>Saldo a pagar</th>
            <th style={{ ...XL.th, textAlign: "right" }}>Saldo do plano</th><th style={{ ...XL.th, textAlign: "right" }}>% exec.</th>
            <th style={XL.th} />
          </tr></thead>
          <tbody>
            {acoes.length === 0 && (
              <tr><td colSpan={15} style={{ ...XL.td, textAlign: "center", color: "#9ca3af", padding: 20 }}>
                Nenhuma ação cadastrada. {data.importacao.pendentes > 0 ? "Importe o plano sincronizado do InvestSUS ou cadastre as ações abaixo." : "Cadastre as ações conforme o plano de trabalho aprovado."}
              </td></tr>)}
            {acoes.map((a, i) => {
              const acima = a.previsto > 0 && Math.max(a.empenhado, a.pago) > a.previsto + 0.01;
              const incons = a.liquidado > a.empenhado + 0.01 || a.pago > a.liquidado + 0.01;
              return [
                <tr key={a.id} style={{ background: expandida === a.id ? "#f8fafc" : undefined }}>
                  <td style={{ ...XL.td, textAlign: "center", cursor: "pointer", color: "#64748b" }} onClick={() => setExpandida(expandida === a.id ? null : a.id)}>
                    {expandida === a.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</td>
                  <td style={XL.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ color: "#94a3b8", fontSize: 10 }}>{i + 1}</span>
                      <CelulaEditavel valor={a.descricao} disabled={!lancar} onSalvar={v => salvarCampo(a, "descricao", v)} />
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 1 }}>
                      <OrigemDado origem={a.origem_dado} />
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>{a.qtd_lancamentos} lançamento(s)</span>
                      {acima && <span style={{ fontSize: 10, color: COR.urgente, fontWeight: 700 }}>acima do previsto</span>}
                      {incons && <span style={{ fontSize: 10, color: COR.critico, fontWeight: 700 }}>estágios inconsistentes</span>}
                    </div>
                  </td>
                  <td style={{ ...XL.td, minWidth: 78 }}><CelulaEditavel valor={a.natureza_despesa} disabled={!lancar} onSalvar={v => salvarCampo(a, "natureza_despesa", v)} /></td>
                  <td style={{ ...XL.td, minWidth: 70 }}><CelulaEditavel valor={a.quantidade} tipo="number" alinhar="right" disabled={!lancar} onSalvar={v => salvarCampo(a, "quantidade", v)} /></td>
                  <td style={{ ...XL.td, minWidth: 54 }}><CelulaEditavel valor={a.unidade} disabled={!lancar} onSalvar={v => salvarCampo(a, "unidade", v)} /></td>
                  <td style={{ ...XL.td, minWidth: 92 }}><CelulaEditavel valor={a.valor_unitario} tipo="number" alinhar="right" disabled={!lancar} onSalvar={v => salvarCampo(a, "valor_unitario", v)} /></td>
                  <td style={{ ...XL.num, color: "#64748b" }}>{fmt(a.previsto_original)}</td>
                  <td style={{ ...XL.num, background: "#f0f9ff", minWidth: 110 }}><CelulaEditavel valor={a.previsto} tipo="number" alinhar="right" disabled={!lancar} onSalvar={v => salvarCampo(a, "valor_previsto", v)} /></td>
                  <td style={XL.num}>{fmt(a.empenhado)}</td>
                  <td style={XL.num}>{fmt(a.liquidado)}</td>
                  <td style={{ ...XL.num, fontWeight: 700, color: COR.pago }}>{fmt(a.pago)}</td>
                  <td style={XL.num}>{fmt(a.saldo_a_pagar)}</td>
                  <td style={{ ...XL.num, fontWeight: 700, color: a.saldo_plano < 0 ? COR.critico : AZUL }}>{fmt(a.saldo_plano)}</td>
                  <td style={XL.num}><BarraExec pct={a.perc_execucao} /></td>
                  <td style={{ ...XL.td, textAlign: "center" }}>
                    {lancar && <button title="Excluir ação (com justificativa)" style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                      onClick={() => setDialogo({ titulo: `Excluir a ação "${a.descricao}"`, onOk: (j: string) => acao(() => api.post(`${base}/acoes/${a.id}/inativar`, { motivo: j }), "Ação excluída (fica no histórico).") })}><Ban size={13} /></button>}
                  </td>
                </tr>,
                expandida === a.id && (
                  <tr key={`l${a.id}`}><td colSpan={15} style={{ ...XL.td, background: "#f8fafc", padding: 12 }}>
                    <Lancamentos acao={a} perm={perm} acaoFn={acao} setDialogo={setDialogo} />
                  </td></tr>
                ),
              ];
            })}
          </tbody>
          {acoes.length > 0 && (
            <tfoot><tr style={{ background: "#f1f5f9", fontWeight: 800 }}>
              <td style={XL.td} /><td style={XL.td} colSpan={5}>TOTAL</td>
              <td style={XL.num}>{fmt(tot("previsto_original"))}</td><td style={XL.num}>{fmt(totPrev)}</td>
              <td style={XL.num}>{fmt(tot("empenhado"))}</td><td style={XL.num}>{fmt(tot("liquidado"))}</td><td style={XL.num}>{fmt(tot("pago"))}</td>
              <td style={XL.num}>{fmt(tot("saldo_a_pagar"))}</td><td style={XL.num}>{fmt(tot("saldo_plano"))}</td>
              <td style={XL.num}><BarraExec pct={totPrev > 0 ? (100 * tot("pago")) / totPrev : null} /></td><td style={XL.td} />
            </tr></tfoot>)}
        </table>
      </div>

      {lancar && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(110px, 100%), 1fr))", gap: 6, marginTop: 10, alignItems: "end" }}>
          <div><label style={S.label}>Nova ação/despesa *</label><input style={S.input} value={nova.descricao} onChange={e => setNova({ ...nova, descricao: e.target.value })} placeholder="Ex.: Serviços médicos especializados" /></div>
          <div><label style={S.label}>Natureza</label><input style={S.input} value={nova.natureza_despesa} onChange={e => setNova({ ...nova, natureza_despesa: e.target.value })} placeholder="339039" /></div>
          <div><label style={S.label}>Qtd</label><input type="number" style={S.input} value={nova.quantidade} onChange={e => setNova({ ...nova, quantidade: e.target.value })} /></div>
          <div><label style={S.label}>Unid.</label><input style={S.input} value={nova.unidade} onChange={e => setNova({ ...nova, unidade: e.target.value })} /></div>
          <div><label style={S.label}>Valor unit.</label><input type="number" step="0.01" style={S.input} value={nova.valor_unitario} onChange={e => setNova({ ...nova, valor_unitario: e.target.value })} /></div>
          <div><label style={S.label}>Valor previsto</label><input type="number" step="0.01" style={S.input} value={nova.valor_previsto} onChange={e => setNova({ ...nova, valor_previsto: e.target.value })} placeholder={nova.quantidade && nova.valor_unitario ? (Number(nova.quantidade) * Number(nova.valor_unitario)).toFixed(2) : ""} /></div>
          <button style={S.btn(AZUL)} disabled={!nova.descricao.trim()} onClick={criar}><Plus size={13} /> Incluir</button>
        </div>)}
      {inativas.length > 0 && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>{inativas.length} ação(ões) excluída(s): {inativas.map(a => `${a.descricao} (${a.motivo_inativacao})`).join("; ")}</div>}
      {data.lancamentos_sem_acao_ativa.length > 0 && <div style={{ fontSize: 11, color: "#92400e", marginTop: 4 }}>{data.lancamentos_sem_acao_ativa.length} lançamento(s) vinculados a ações excluídas continuam somando nos totais.</div>}
    </div>
  );
}

const LANC_VAZIO = { tipo: "empenho", data: "", valor: "", fornecedor: "", fornecedor_documento: "", numero_empenho: "", numero_liquidacao: "", ordem_bancaria: "", documento_comprobatorio: "", historico: "" };

function Lancamentos({ acao: a, perm, acaoFn, setDialogo }: any) {
  const base = `/api/investsus/execucao`;
  const [f, setF] = useState<any>(LANC_VAZIO);
  const set = (k: string) => (e: any) => setF((v: any) => ({ ...v, [k]: e.target.value }));
  const lista: any[] = a.lancamentos;
  const salvar = async () => {
    const corpo = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === "" ? null : v]));
    if (await acaoFn(() => api.post(`${base}/acoes/${a.id}/lancamentos`, { ...corpo, valor: Number(f.valor) }), "Lançamento registrado (pendente de validação).")) setF({ ...LANC_VAZIO, tipo: f.tipo });
  };
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#334155" }}>Despesas e lançamentos da ação</div>
      {lista.length === 0 ? <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>Não houve lançamento nesta ação.</div> : (
        <div style={{ overflowX: "auto", marginBottom: 10 }}>
          <table style={{ ...XL.table, fontSize: 11 }}>
            <thead><tr>{["Tipo", "Data", "Valor", "Fornecedor", "Empenho", "Liquidação", "OB", "Documento", "Origem", "Validação", ""].map(h => <th key={h} style={{ ...XL.th, position: "static", textAlign: h === "Valor" ? "right" : "left" }}>{h}</th>)}</tr></thead>
            <tbody>{lista.map(l => (
              <tr key={l.id} style={{ opacity: l.cancelado ? 0.5 : 1, textDecoration: l.cancelado ? "line-through" : undefined }}>
                <td style={XL.td}>{TIPO_LANC[l.tipo] ?? l.tipo}</td>
                <td style={XL.td}>{fmtData(l.data)}</td>
                <td style={{ ...XL.num, color: l.tipo.startsWith("anulacao") || l.tipo.startsWith("estorno") ? COR.critico : undefined }}>{l.tipo.startsWith("anulacao") || l.tipo.startsWith("estorno") ? "−" : ""}{fmt(l.valor)}</td>
                <td style={XL.td}>{l.fornecedor ?? "—"}</td>
                <td style={XL.td}>{l.numero_empenho ?? "—"}</td><td style={XL.td}>{l.numero_liquidacao ?? "—"}</td><td style={XL.td}>{l.ordem_bancaria ?? "—"}</td>
                <td style={XL.td}>{l.documento_comprobatorio ?? "—"}</td>
                <td style={XL.td}><OrigemDado origem={l.origem_dado} /></td>
                <td style={XL.td}>{l.cancelado ? <span title={l.cancelado_motivo} style={{ fontSize: 10, color: "#6b7280" }}>cancelado por {l.cancelado_por}</span> : <Validacao status={l.status_validacao} />}</td>
                <td style={{ ...XL.td, whiteSpace: "nowrap" }}>
                  {!l.cancelado && perm.validar && l.status_validacao !== "validado" && (
                    <button title="Validar" style={{ background: "none", border: "none", cursor: "pointer", color: "#059669" }} onClick={() => acaoFn(() => api.post(`${base}/lancamentos/${l.id}/validar`, { status: "validado" }), "Lançamento validado.")}><Check size={13} /></button>)}
                  {!l.cancelado && perm.lancar && (
                    <button title="Cancelar lançamento (com justificativa)" style={{ background: "none", border: "none", cursor: "pointer", color: COR.critico }}
                      onClick={() => setDialogo({ titulo: `Cancelar ${TIPO_LANC[l.tipo]?.toLowerCase()} de ${fmt(l.valor)}`, onOk: (j: string) => acaoFn(() => api.post(`${base}/lancamentos/${l.id}/cancelar`, { motivo: j }), "Lançamento cancelado (permanece no histórico).") })}><Ban size={13} /></button>)}
                </td>
              </tr>))}</tbody>
          </table>
        </div>)}
      {perm.lancar && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 100%), 1fr))", gap: 6, alignItems: "end" }}>
          <div><label style={S.label}>Tipo *</label><select style={S.input} value={f.tipo} onChange={set("tipo")}>{Object.entries(TIPO_LANC).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label style={S.label}>Data *</label><input type="date" style={S.input} value={f.data} onChange={set("data")} /></div>
          <div><label style={S.label}>Valor (R$) *</label><input type="number" step="0.01" min="0" style={S.input} value={f.valor} onChange={set("valor")} /></div>
          <div><label style={S.label}>Fornecedor</label><input style={S.input} value={f.fornecedor} onChange={set("fornecedor")} /></div>
          <div><label style={S.label}>CNPJ do fornecedor</label><input style={S.input} value={f.fornecedor_documento} onChange={set("fornecedor_documento")} /></div>
          <div><label style={S.label}>Nº do empenho</label><input style={S.input} value={f.numero_empenho} onChange={set("numero_empenho")} /></div>
          <div><label style={S.label}>Nº da liquidação</label><input style={S.input} value={f.numero_liquidacao} onChange={set("numero_liquidacao")} /></div>
          <div><label style={S.label}>Ordem bancária</label><input style={S.input} value={f.ordem_bancaria} onChange={set("ordem_bancaria")} /></div>
          <div><label style={S.label}>Documento comprobatório</label><input style={S.input} value={f.documento_comprobatorio} onChange={set("documento_comprobatorio")} placeholder="NF 123, contrato 4/2026" /></div>
          <div style={{ gridColumn: "span 2" }}><label style={S.label}>Histórico</label><input style={S.input} value={f.historico} onChange={set("historico")} /></div>
          <button style={S.btn(AZUL)} disabled={!f.data || !(Number(f.valor) > 0)} onClick={salvar}><Plus size={13} /> Lançar</button>
        </div>)}
      <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 6 }}>O mesmo empenho, liquidação ou ordem bancária não pode ser lançado duas vezes. Para corrigir, cancele com justificativa ou use anulação/estorno.</div>
    </div>
  );
}

function ContaVinculada({ data, perm, propostaId, acao, setDialogo }: any) {
  const base = `/api/investsus/execucao`;
  const [f, setF] = useState({ tipo: "rendimento", data: "", valor: "", descricao: "", documento: "" });
  const r = data.resumo, mv = r.movimentos;
  return (
    <div style={S.card}>
      <div style={{ ...S.title, display: "flex", alignItems: "center", gap: 6 }}><Wallet size={15} /> Conta vinculada — saldo financeiro</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", fontSize: 12, marginBottom: 10, fontVariantNumeric: "tabular-nums" }}>
        <span>Saldo inicial <b>{fmt(mv.saldo_inicial)}</b></span><span>+ Repasses FNS <b style={{ color: COR.recebido }}>{fmt(r.recebido)}</b></span>
        <span>+ Rendimentos <b>{fmt(mv.rendimento)}</b></span><span>− Pagamentos <b style={{ color: COR.pago }}>{fmt(r.pago)}</b></span>
        <span>− Devoluções <b>{fmt(mv.devolucao)}</b></span><span>− Outras saídas <b>{fmt(mv.outra_saida)}</b></span>
        <span>= <b style={{ color: r.saldo_financeiro < 0 ? COR.critico : AZUL, fontSize: 14 }}>{fmt(r.saldo_financeiro)}</b></span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(330px, 100%), 1fr))", gap: 14 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>Repasses do FNS <OrigemDado origem="oficial" /></div>
          {data.repasses_fns.length === 0 ? <div style={{ fontSize: 12, color: "#9ca3af" }}>{r.recebido > 0 ? "Repasse informado na proposta, sem parcelas detalhadas. Sincronize o InvestSUS para trazer datas e OBs." : "Nenhum repasse registrado."}</div> : (
            <table style={{ ...XL.table, fontSize: 11 }}><thead><tr>{["Data", "Parcela", "OB", "Valor"].map(h => <th key={h} style={{ ...XL.th, position: "static" }}>{h}</th>)}</tr></thead>
              <tbody>{data.repasses_fns.map((p: any) => <tr key={p.id}><td style={XL.td}>{fmtData(p.data)}</td><td style={XL.td}>{p.parcela ?? "—"}</td><td style={XL.td}>{p.ordem_bancaria ?? "—"}</td><td style={XL.num}>{fmt(p.valor)}</td></tr>)}</tbody></table>)}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>Saldo inicial, rendimentos, devoluções e outras saídas</div>
          {data.movimentos.length === 0 ? <div style={{ fontSize: 12, color: "#9ca3af" }}>Não houve lançamento.</div> : (
            <table style={{ ...XL.table, fontSize: 11 }}><thead><tr>{["Tipo", "Data", "Valor", "Descrição", "Origem", ""].map(h => <th key={h} style={{ ...XL.th, position: "static" }}>{h}</th>)}</tr></thead>
              <tbody>{data.movimentos.map((m: any) => (
                <tr key={m.id} style={{ opacity: m.cancelado ? 0.5 : 1, textDecoration: m.cancelado ? "line-through" : undefined }}>
                  <td style={XL.td}>{TIPO_MOV[m.tipo] ?? m.tipo}</td><td style={XL.td}>{fmtData(m.data)}</td><td style={XL.num}>{fmt(m.valor)}</td>
                  <td style={XL.td}>{m.descricao ?? "—"}</td><td style={XL.td}><OrigemDado origem={m.origem_dado} /> {!m.cancelado && <Validacao status={m.status_validacao} />}</td>
                  <td style={{ ...XL.td, whiteSpace: "nowrap" }}>
                    {!m.cancelado && perm.validar && m.status_validacao !== "validado" && <button title="Validar" style={{ background: "none", border: "none", cursor: "pointer", color: "#059669" }} onClick={() => acao(() => api.post(`${base}/movimentos/${m.id}/validar`, { status: "validado" }), "Movimento validado.")}><Check size={13} /></button>}
                    {!m.cancelado && perm.lancar && <button title="Cancelar" style={{ background: "none", border: "none", cursor: "pointer", color: COR.critico }} onClick={() => setDialogo({ titulo: `Cancelar ${TIPO_MOV[m.tipo]?.toLowerCase()} de ${fmt(m.valor)}`, onOk: (j: string) => acao(() => api.post(`${base}/movimentos/${m.id}/cancelar`, { motivo: j }), "Movimento cancelado.") })}><Ban size={13} /></button>}
                  </td>
                </tr>))}</tbody></table>)}
          {perm.lancar && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(110px, 100%), 1fr))", gap: 6, marginTop: 8, alignItems: "end" }}>
              <div><label style={S.label}>Tipo</label><select style={S.input} value={f.tipo} onChange={e => setF({ ...f, tipo: e.target.value })}>{Object.entries(TIPO_MOV).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label style={S.label}>Data</label><input type="date" style={S.input} value={f.data} onChange={e => setF({ ...f, data: e.target.value })} /></div>
              <div><label style={S.label}>Valor</label><input type="number" step="0.01" style={S.input} value={f.valor} onChange={e => setF({ ...f, valor: e.target.value })} /></div>
              <div><label style={S.label}>Descrição/documento</label><input style={S.input} value={f.descricao} onChange={e => setF({ ...f, descricao: e.target.value })} /></div>
              <button style={S.btn(AZUL)} disabled={!f.data || !(Number(f.valor) > 0)} onClick={async () => { if (await acao(() => api.post(`${base}/propostas/${propostaId}/movimentos`, { ...f, valor: Number(f.valor) }), "Movimento registrado.")) setF({ ...f, data: "", valor: "", descricao: "" }); }}><Plus size={13} /></button>
            </div>)}
        </div>
      </div>
    </div>
  );
}

function Documentos({ data, perm, propostaId, acao, setDialogo, setMsg }: any) {
  const base = `/api/investsus/execucao`;
  const [tipo, setTipo] = useState("plano_aprovado");
  const [lancId, setLancId] = useState("");
  const inp = useRef<HTMLInputElement>(null);
  const lancs = data.acoes.flatMap((a: any) => a.lancamentos.filter((l: any) => !l.cancelado).map((l: any) => ({ ...l, acao: a.descricao })));
  const enviar = async (file: File) => {
    const fd = new FormData();
    fd.append("arquivo", file);
    fd.append("tipo", tipo);
    if (lancId) fd.append("lancamento_id", lancId);
    await acao(() => api.post(`${base}/propostas/${propostaId}/documentos`, fd, { headers: { "Content-Type": "multipart/form-data" } }), `Documento "${file.name}" anexado.`);
    if (inp.current) inp.current.value = "";
  };
  return (
    <div style={S.card}>
      <div style={{ ...S.title, display: "flex", alignItems: "center", gap: 6 }}><Paperclip size={15} /> Documentação</div>
      {data.documentos.length === 0 ? <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>Nenhum documento anexado.</div> : (
        <table style={{ ...XL.table, fontSize: 11, marginBottom: 10 }}><thead><tr>{["Tipo", "Arquivo", "Lançamento", "Enviado por", "Data", ""].map(h => <th key={h} style={{ ...XL.th, position: "static" }}>{h}</th>)}</tr></thead>
          <tbody>{data.documentos.map((d: any) => {
            const l = lancs.find((x: any) => x.id === d.lancamento_id);
            return (
              <tr key={d.id}><td style={XL.td}>{TIPO_DOC[d.tipo] ?? d.tipo}</td>
                <td style={XL.td}><button style={{ background: "none", border: "none", color: "#0284c7", cursor: "pointer", padding: 0, fontSize: 11 }} onClick={() => baixar(`${base}/documentos/${d.id}`, d.nome).catch(e => setMsg({ ok: false, texto: erroMsg(e) }))}>{d.nome}</button> <span style={{ color: "#9ca3af" }}>({Math.ceil(d.tamanho / 1024)} KB)</span></td>
                <td style={XL.td}>{l ? `${TIPO_LANC[l.tipo]} ${fmt(l.valor)} — ${l.acao}` : d.lancamento_id ? `#${d.lancamento_id}` : "—"}</td>
                <td style={XL.td}>{d.enviado_por}</td><td style={XL.td}>{fmtData(d.criado_em)}</td>
                <td style={XL.td}>{perm.lancar && <button title="Remover (com justificativa)" style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }} onClick={() => setDialogo({ titulo: `Remover o documento "${d.nome}"`, onOk: (j: string) => acao(() => api.post(`${base}/documentos/${d.id}/remover`, { motivo: j }), "Documento removido (registro mantido no histórico).") })}><X size={13} /></button>}</td>
              </tr>);
          })}</tbody></table>)}
      {perm.lancar && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "end" }}>
          <div style={{ minWidth: 180 }}><label style={S.label}>Tipo de documento</label><select style={S.input} value={tipo} onChange={e => setTipo(e.target.value)}>{Object.entries(TIPO_DOC).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div style={{ minWidth: 260, flex: 1 }}><label style={S.label}>Vincular a um lançamento (opcional)</label>
            <select style={S.input} value={lancId} onChange={e => setLancId(e.target.value)}><option value="">— documento da proposta —</option>
              {lancs.map((l: any) => <option key={l.id} value={l.id}>{TIPO_LANC[l.tipo]} {fmt(l.valor)} · {fmtData(l.data)} · {l.acao}</option>)}</select></div>
          <input ref={inp} type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.odt,.ods,.csv,.txt" style={{ display: "none" }} onChange={e => e.target.files?.[0] && enviar(e.target.files[0])} />
          <button style={S.btn(AZUL)} onClick={() => inp.current?.click()}><Upload size={13} /> Anexar arquivo</button>
          <span style={{ fontSize: 10.5, color: "#9ca3af" }}>PDF, imagem, documento ou planilha — até 10 MB.</span>
        </div>)}
    </div>
  );
}

function ImportarPlanilha({ propostaId, onFim }: { propostaId: number; onFim: (texto: string, ok: boolean) => void }) {
  const inp = useRef<HTMLInputElement>(null);
  const enviar = async (file: File, confirmar: boolean) => {
    const fd = new FormData();
    fd.append("arquivo", file);
    fd.append("confirmar", String(confirmar));
    return (await api.post(`/api/investsus/execucao/propostas/${propostaId}/planilha/importar`, fd, { headers: { "Content-Type": "multipart/form-data" } })).data;
  };
  const escolher = async (file: File) => {
    try {
      const pv = await enviar(file, false);
      const texto = `Prévia: ${pv.novas_acoes} nova(s) ação(ões) e ${pv.lancamentos} lançamento(s) na planilha.` +
        (pv.erros.length ? `\n${pv.erros.length} linha(s) com problema:\n- ${pv.erros.slice(0, 8).join("\n- ")}` : "") +
        "\n\nLançamentos já registrados serão ignorados. Confirmar importação?";
      if (!confirm(texto)) return;
      const r = await enviar(file, true);
      onFim(`Importação concluída: ${r.acoes_criadas} ação(ões) e ${r.lancamentos_criados} lançamento(s) incluídos.` +
        (r.duplicados.length ? ` ${r.duplicados.length} já existente(s) ignorado(s).` : "") +
        (r.erros.length ? `\nProblemas:\n- ${r.erros.slice(0, 8).join("\n- ")}` : ""), true);
    } catch (e) { onFim(erroMsg(e), false); }
    finally { if (inp.current) inp.current.value = ""; }
  };
  return (<>
    <input ref={inp} type="file" accept=".xlsx" style={{ display: "none" }} onChange={e => e.target.files?.[0] && escolher(e.target.files[0])} />
    <button style={S.btn()} onClick={() => inp.current?.click()} title="Importe a planilha no formato exportado pelo ERSUS360"><Upload size={13} /> Importar Excel</button>
  </>);
}

function Historico({ historico }: { historico: any[] }) {
  const [aberto, setAberto] = useState(false);
  const CAMPO: Record<string, string> = { valor_previsto: "valor previsto" };
  return (
    <div style={S.card}>
      <button style={{ ...S.btn(), border: "none", padding: 0, fontSize: 14, fontWeight: 700, color: "#111827" }} onClick={() => setAberto(v => !v)}>
        {aberto ? <ChevronDown size={15} /> : <ChevronRight size={15} />} Histórico de alterações ({historico.length})
      </button>
      {aberto && (historico.length === 0 ? <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>Sem registros.</div> : (
        <div style={{ overflowX: "auto", maxHeight: 360, overflowY: "auto", marginTop: 10 }}>
          <table style={{ ...XL.table, fontSize: 11 }}><thead><tr>{["Data/hora", "Usuário", "Registro", "Evento", "Campo", "Anterior", "Novo", "Justificativa / autorização"].map(h => <th key={h} style={XL.th}>{h}</th>)}</tr></thead>
            <tbody>{historico.map(h => (
              <tr key={h.id}><td style={XL.td}>{h.criado_em ? new Date(h.criado_em + "Z").toLocaleString("pt-BR") : "—"}</td><td style={XL.td}>{h.usuario}</td>
                <td style={XL.td}>{h.entidade} #{h.entidade_id}</td><td style={XL.td}>{h.evento}</td><td style={XL.td}>{CAMPO[h.campo] ?? h.campo ?? "—"}</td>
                <td style={XL.td}>{h.valor_anterior ?? "—"}</td><td style={XL.td}>{h.valor_novo ?? "—"}</td>
                <td style={XL.td}>{[h.justificativa, h.autorizacao && `Autorização: ${h.autorizacao}`].filter(Boolean).join(" · ") || "—"}</td></tr>))}</tbody></table>
        </div>))}
    </div>
  );
}

// ── Pendências (aba "Pendências e Alertas") ───────────────────────────────────
export function AlertasExecucao({ onAbrir }: { onAbrir: (propostaId: number) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["investsus-exec-alertas"],
    queryFn: () => api.get(`/api/investsus/execucao/alertas`).then(r => r.data),
  });
  const [nivel, setNivel] = useState("");
  const lista: any[] = useMemo(() => (data?.alertas ?? []).filter((a: any) => !nivel || a.nivel === nivel), [data, nivel]);
  if (isLoading) return <div style={{ padding: 20, color: "#9ca3af" }}>Carregando pendências da execução…</div>;
  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={S.title as any}><AlertTriangle size={14} style={{ verticalAlign: -2 }} /> Execução financeira dos planos de trabalho ({data?.total ?? 0})</div>
        <select style={{ ...S.input, width: 170 }} value={nivel} onChange={e => setNivel(e.target.value)}>
          <option value="">Todos os níveis</option>{Object.entries(NIVEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10 }}>{data?.aviso}</div>
      {lista.length === 0 ? <div style={{ color: "#059669", fontSize: 12, fontWeight: 600 }}>Nenhuma pendência na execução financeira.</div> :
        lista.map((a, i) => (
          <div key={i} style={{ cursor: "pointer" }} onClick={() => onAbrir(a.proposta_id)}>
            <LinhaAlerta a={a} extra={<span style={{ fontFamily: "monospace", fontSize: 11, background: "#f3f4f6", borderRadius: 3, padding: "1px 6px", fontWeight: 700 }}>{a.numero_proposta}</span>} />
          </div>))}
    </div>
  );
}

// ── Relatórios (aba "Relatórios") ─────────────────────────────────────────────
const RELATORIOS: [string, string, string][] = [
  ["consolidado", "1 — Execução financeira consolidada", "Todas as propostas: recebido, empenhado, liquidado, pago e saldos."],
  ["individual", "2 — Execução individual do plano de trabalho", "Ações previstas × execução realizada de uma proposta."],
  ["modalidade", "3 — Execução por modalidade", "RP 6, RP 7, RP 8 e Programas MS (com cruzamento por área)."],
  ["area", "4 — Execução por área assistencial", "APS/PAP, MAC e demais programas."],
  ["saldos", "5 — Saldos financeiros", "Repasses, pagamentos, rendimentos, devoluções e saldo disponível."],
  ["pendencias", "6 — Pendências", "Sem lançamento, inconsistências, documentos e prazos críticos."],
];

export function RelatoriosExecucao({ tipoRecurso = "" }: { tipoRecurso?: string } = {}) {
  const { data } = useQuery({
    queryKey: ["investsus-exec-painel", FILTROS_VAZIOS],
    queryFn: () => api.get(`/api/investsus/execucao/painel`).then(r => r.data),
  });
  const [f, setF] = useState({ exercicio: "", origem: "", destinacao: "", proposta_id: "" });
  const [erro, setErro] = useState<string | null>(null);
  const [baixando, setBaixando] = useState<string | null>(null);
  const gerar = async (tipo: string, formato: string) => {
    setErro(null);
    if (tipo === "individual" && !f.proposta_id) { setErro("Escolha a proposta para o relatório individual."); return; }
    setBaixando(`${tipo}-${formato}`);
    try { await baixar(`/api/investsus/execucao/relatorios/${tipo}?${qs({ ...f, formato, tipo_recurso: tipoRecurso } as any)}`, `investsus_execucao_${tipo}.${formato}`); }
    catch (e) { setErro(erroMsg(e)); }
    finally { setBaixando(null); }
  };
  return (
    <div style={S.card}>
      <div style={S.title}>Relatórios da execução financeira dos planos de trabalho</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(170px, 100%), 1fr))", gap: 10, marginBottom: 12 }}>
        <div><label style={S.label}>Exercício</label><select style={S.input} value={f.exercicio} onChange={e => setF({ ...f, exercicio: e.target.value })}><option value="">Todos</option>{(data?.opcoes.anos ?? []).map((a: number) => <option key={a} value={a}>{a}</option>)}</select></div>
        <div><label style={S.label}>Origem</label><select style={S.input} value={f.origem} onChange={e => setF({ ...f, origem: e.target.value })}><option value="">Todas</option>{Object.entries(data?.opcoes.origens ?? {}).map(([k, v]: any) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label style={S.label}>Área</label><select style={S.input} value={f.destinacao} onChange={e => setF({ ...f, destinacao: e.target.value })}><option value="">Todas</option>{Object.entries(data?.opcoes.destinacoes ?? {}).map(([k, v]: any) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label style={S.label}>Proposta (relatório 2)</label><select style={S.input} value={f.proposta_id} onChange={e => setF({ ...f, proposta_id: e.target.value })}><option value="">Escolha…</option>{(data?.propostas ?? []).map((p: any) => <option key={p.proposta_id} value={p.proposta_id}>{p.numero_proposta} ({p.exercicio ?? "—"})</option>)}</select></div>
      </div>
      {erro && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 8 }}>{erro}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 10 }}>
        {RELATORIOS.map(([tipo, titulo, desc]) => (
          <div key={tipo} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: AZUL }}>{titulo}</div>
            <div style={{ fontSize: 11, color: "#6b7280", margin: "3px 0 8px" }}>{desc}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={S.btn(AZUL)} disabled={!!baixando} onClick={() => gerar(tipo, "pdf")}><FileText size={13} /> {baixando === `${tipo}-pdf` ? "Gerando…" : "PDF"}</button>
              <button style={S.btn("#059669")} disabled={!!baixando} onClick={() => gerar(tipo, "xlsx")}><FileSpreadsheet size={13} /> {baixando === `${tipo}-xlsx` ? "Gerando…" : "Excel"}</button>
            </div>
          </div>))}
      </div>
    </div>
  );
}

// ── Repasses e Planos — controle das emendas no modelo das planilhas do Fundo ─
// Só propostas com dinheiro recebido do FNS, por tipo (RP 6/7/8/Programa). Cada uma abre o
// plano de trabalho convertido em controle por finalidade: entrada = valor da finalidade,
// cada nota fiscal é uma saída (elemento de despesa, fornecedor, nº da NF) com saldo atual.
const TIPOS_REPASSE: [string, string][] = [["rp6", "Emendas RP 6"], ["rp7", "Emendas RP 7"], ["rp8", "Emendas RP 8"], ["programa", "Programas MS"]];
const natFmt = (c?: string | null) => (c && /^\d{6}$/.test(c) ? `${c[0]}.${c[1]}.${c.slice(2, 4)}.${c.slice(4, 6)}` : c || "—");

export function RepassesPlanos({ propostaId, setPropostaId, onPlanilhaCompleta }: {
  propostaId: number | null; setPropostaId: (id: number | null) => void; onPlanilhaCompleta: (id: number) => void;
}) {
  const [exercicio, setExercicio] = useState("");
  const [tipo, setTipo] = useState("");
  const [busca, setBusca] = useState("");
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["investsus-exec-painel", { exercicio, origem: tipo }],
    queryFn: () => api.get(`/api/investsus/execucao/painel?${qs({ exercicio, origem: tipo } as any)}`).then(r => r.data),
    enabled: !propostaId,
  });
  if (propostaId) return <ControleEmenda propostaId={propostaId} onVoltar={() => setPropostaId(null)} onPlanilhaCompleta={onPlanilhaCompleta} />;
  if (isLoading) return <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Carregando repasses…</div>;
  if (isError) return <div style={{ ...S.card, color: "#dc2626" }}>Não foi possível carregar: {erroMsg(error)}</div>;

  const b = busca.trim().toLowerCase();
  const recebidas: any[] = data.propostas.filter((p: any) => p.recebido > 0)
    .filter((p: any) => !b || [p.numero_proposta, p.numero_emenda, p.objeto, p.parlamentar, p.programa].join(" ").toLowerCase().includes(b));
  const soma = (ls: any[], k: string) => ls.reduce((s, p) => s + (p[k] ?? 0), 0);
  const porTipo = TIPOS_REPASSE.map(([k, rot]) => {
    const ls = recebidas.filter(p => p.origem === k);
    return { k, rot, qtd: ls.length, recebido: soma(ls, "recebido"), pago: soma(ls, "pago"), saldo: soma(ls, "saldo_financeiro") };
  });
  const outros = recebidas.filter(p => !TIPOS_REPASSE.some(([k]) => k === p.origem));

  return (
    <div>
      <Conferencia />
      <div style={{ ...S.card, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(170px, 100%), 1fr))", gap: 10, alignItems: "end" }}>
        <div><label style={S.label}>Exercício</label>
          <select style={S.input} value={exercicio} onChange={e => setExercicio(e.target.value)}>
            <option value="">Todos</option>{data.opcoes.anos.map((a: number) => <option key={a} value={a}>{a}</option>)}
          </select></div>
        <div><label style={S.label}>Tipo de recurso</label>
          <select style={S.input} value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="">Todos</option>{TIPOS_REPASSE.map(([k, r]) => <option key={k} value={k}>{r}</option>)}
          </select></div>
        <div style={{ position: "relative", gridColumn: "span 2" }}><label style={S.label}>Proposta, emenda, parlamentar ou finalidade</label>
          <Search size={13} style={{ position: "absolute", left: 8, bottom: 9, color: "#9ca3af" }} />
          <input style={{ ...S.input, paddingLeft: 26 }} value={busca} onChange={e => setBusca(e.target.value)} /></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 10, marginBottom: 14 }}>
        {porTipo.map(t => (
          <div key={t.k} style={{ background: "#fff", color: "#111827", border: "1px solid #e5e7eb", borderTop: `3px solid ${COR.recebido}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{t.rot} <span style={{ color: "#9ca3af", fontWeight: 500 }}>({t.qtd})</span></div>
            <div style={{ fontSize: 18, fontWeight: 800, color: COR.recebido, marginTop: 4 }}>{fmt(t.recebido)}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>recebido do FNS · oficial</div>
            <div style={{ fontSize: 11.5, marginTop: 6, display: "flex", justifyContent: "space-between" }}><span>Gasto (NFs)</span><b style={{ color: COR.pago }}>{fmt(t.pago)}</b></div>
            <div style={{ fontSize: 11.5, display: "flex", justifyContent: "space-between" }}><span>Saldo em conta</span><b style={{ color: AZUL }}>{fmt(t.saldo)}</b></div>
          </div>))}
        <div style={{ background: AZUL, color: "#fff", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>TOTAL RECEBIDO ({recebidas.length})</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{fmt(soma(recebidas, "recebido"))}</div>
          <div style={{ fontSize: 11, opacity: .8, marginTop: 2 }}>emendas + programas</div>
          <div style={{ fontSize: 11.5, marginTop: 6, display: "flex", justifyContent: "space-between" }}><span>Gasto (NFs)</span><b>{fmt(soma(recebidas, "pago"))}</b></div>
          <div style={{ fontSize: 11.5, display: "flex", justifyContent: "space-between" }}><span>Saldo em conta</span><b>{fmt(soma(recebidas, "saldo_financeiro"))}</b></div>
        </div>
      </div>
      {outros.length > 0 && <div style={{ fontSize: 11.5, color: "#92400e", marginBottom: 10 }}>{outros.length} proposta(s) recebida(s) ainda sem tipo (RP 6/7/8/Programa) definido — entram só no total. Classifique na ficha da proposta.</div>}

      <div style={S.card}>
        <div style={{ ...S.title, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          <span>Repasses recebidos ({recebidas.length})</span>
          <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 400 }}>Clique para abrir o plano de trabalho e lançar as notas fiscais</span>
        </div>
        {recebidas.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: "#9ca3af" }}>Nenhum repasse recebido para os filtros. Se faltar algo, use <b>Sincronizar</b> para trazer os repasses do InvestSUS.</div>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid #cbd5e1" }}>
            <table style={XL.table}>
              <thead><tr>{["Proposta", "Tipo", "Finalidade", "Recebido", "Gasto (NFs)", "Saldo do plano", "Saldo em conta", "% gasto", "Plano"].map(h =>
                <th key={h} style={{ ...XL.th, textAlign: ["Proposta", "Tipo", "Finalidade", "Plano"].includes(h) ? "left" : "right" }}>{h}</th>)}</tr></thead>
              <tbody>{recebidas.map(p => (
                <tr key={p.proposta_id} style={{ cursor: "pointer" }} onClick={() => setPropostaId(p.proposta_id)}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")} onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  <td style={XL.td}><div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 11 }}>{p.numero_proposta}</div>
                    <div style={{ fontSize: 10.5, color: "#6b7280" }}>{p.exercicio}{p.parlamentar ? ` · ${p.parlamentar}` : ""}</div></td>
                  <td style={XL.td}>{ORIGEM_CURTO[p.origem] ?? p.origem}<div style={{ fontSize: 10.5, color: "#6b7280" }}>{DEST_CURTO[p.destinacao] ?? ""}</div></td>
                  <td style={{ ...XL.td, maxWidth: 320 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.objeto ?? ""}>{p.objeto || p.programa || "—"}</div></td>
                  <td style={{ ...XL.num, fontWeight: 700, color: COR.recebido }}>{fmt(p.recebido)}</td>
                  <td style={XL.num}>{p.pago ? fmt(p.pago) : <span style={{ color: "#9ca3af" }}>sem lançamento</span>}</td>
                  <td style={XL.num}>{p.saldo_plano == null ? <span style={{ color: "#9ca3af" }}>plano não convertido</span> : fmt(p.saldo_plano)}</td>
                  <td style={{ ...XL.num, fontWeight: 700, color: AZUL }}>{fmt(p.saldo_financeiro)}</td>
                  <td style={XL.num}><BarraExec pct={p.recebido > 0 ? (100 * p.pago) / p.recebido : null} /></td>
                  <td style={XL.td}>{data.opcoes.situacoes_plano[p.situacao_plano] ?? p.situacao_plano}</td>
                </tr>))}</tbody>
              <tfoot><tr style={{ background: "#f1f5f9", fontWeight: 800 }}>
                <td style={XL.td} colSpan={3}>TOTAL</td>
                <td style={XL.num}>{fmt(soma(recebidas, "recebido"))}</td><td style={XL.num}>{fmt(soma(recebidas, "pago"))}</td>
                <td style={XL.num}>{fmt(soma(recebidas, "saldo_plano"))}</td><td style={XL.num}>{fmt(soma(recebidas, "saldo_financeiro"))}</td>
                <td style={XL.td} colSpan={2} />
              </tr></tfoot>
            </table>
          </div>)}
      </div>
    </div>
  );
}

function ExcluirOcultas() {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [marcadas, setMarcadas] = useState<string[]>(["canceladas"]);
  const [texto, setTexto] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const { data, refetch } = useQuery({ queryKey: ["investsus-exclusao"], queryFn: () => api.get(`/api/investsus/exclusao`).then(r => r.data) });
  if (!data?.pode_excluir) return null;
  const total = data.categorias.reduce((s: number, c: any) => s + c.qtd, 0);
  if (!total && !msg) return null;
  const selecionadas = data.categorias.filter((c: any) => marcadas.includes(c.chave));
  const qtd = selecionadas.reduce((s: number, c: any) => s + c.qtd - c.bloqueadas, 0);
  const excluir = async () => {
    setOcupado(true);
    try {
      const r = (await api.post(`/api/investsus/exclusao`, { categorias: marcadas, confirmacao: texto })).data;
      setMsg(`${r.excluidas} proposta(s) excluída(s) do banco. Uma cópia foi guardada para recuperação.` +
        (r.mantidas_com_execucao.length ? ` ${r.mantidas_com_execucao.length} mantida(s) porque têm execução lançada.` : ""));
      setAberto(false); setTexto("");
      ["investsus-conferencia", "investsus-exec-painel", "investsus-dashboard", "investsus-propostas"].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
      refetch();
    } catch (e) { setMsg(erroMsg(e)); } finally { setOcupado(false); }
  };
  return (<>
    {msg && <div style={{ fontSize: 12, marginTop: 8 }}>{msg}</div>}
    {total > 0 && <button style={{ ...S.btn("#b91c1c"), padding: "4px 10px", marginTop: 8 }} onClick={() => setAberto(true)}>
      <Ban size={12} /> Excluir do banco propostas que o InvestSUS não mostra ({total})</button>}
    {aberto && (
      <div role="dialog" aria-modal="true" onClick={() => setAberto(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 1100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: "#fff", color: "#111827", borderRadius: 10, padding: 18, width: "100%", maxWidth: 820 }}>
          <div style={{ fontWeight: 800, color: "#b91c1c", marginBottom: 6 }}>Excluir propostas do banco</div>
          <div style={{ fontSize: 12, color: "#374151", marginBottom: 10 }}>Escolha o que apagar. Antes de apagar, o sistema guarda uma cópia para recuperação e registra na auditoria. Proposta com notas ou lançamentos de execução não é apagada.</div>
          {data.categorias.map((c: any) => (
            <div key={c.chave} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 700, fontSize: 13 }}>
                <input type="checkbox" disabled={!c.qtd} checked={marcadas.includes(c.chave)}
                  onChange={e => setMarcadas(m => e.target.checked ? [...m, c.chave] : m.filter(x => x !== c.chave))} />
                {c.rotulo}: {c.qtd} proposta(s) · {fmt(c.valor_indicado)}{c.bloqueadas ? ` · ${c.bloqueadas} com execução (ficam)` : ""}
              </label>
              {c.qtd > 0 && <div style={{ maxHeight: 140, overflowY: "auto", marginTop: 6, fontSize: 11.5 }}>
                {c.propostas.map((p: any) => <div key={p.id} style={{ color: p.bloqueada ? "#9ca3af" : "#374151" }}>
                  <span style={{ fontFamily: "monospace" }}>{p.numero_proposta}</span> · {p.exercicio ?? "—"} · {p.situacao || "—"} · {fmt(p.valor_indicado)}{p.bloqueada ? " (tem execução — não será apagada)" : ""}</div>)}
              </div>}
            </div>))}
          <div style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap", marginTop: 6 }}>
            <div><label style={S.label}>Digite EXCLUIR para confirmar a exclusão de {qtd} proposta(s)</label>
              <input style={{ ...S.input, width: 200 }} value={texto} onChange={e => setTexto(e.target.value)} /></div>
            <button style={S.btn()} onClick={() => setAberto(false)}>Cancelar</button>
            <button style={S.btn("#b91c1c")} disabled={ocupado || !qtd || texto.trim().toUpperCase() !== "EXCLUIR"} onClick={excluir}>
              <Ban size={13} /> {ocupado ? "Excluindo…" : `Excluir ${qtd} proposta(s)`}</button>
          </div>
        </div>
      </div>)}
  </>);
}

function Conferencia() {
  const { data } = useQuery({ queryKey: ["investsus-conferencia"], queryFn: () => api.get(`/api/investsus/conferencia`).then(r => r.data) });
  const [aberto, setAberto] = useState(false);
  if (!data) return null;
  const u = data.ultima;
  const nao: any[] = data.nao_encontradas;
  if (!u) return (
    <div style={{ ...S.card, background: "#fffbeb", color: "#78350f", fontSize: 12.5 }}>
      <b>Ainda não conferido com o InvestSUS.</b> Clique em <b>Sincronizar → Atualizar do InvestSUS</b> (logado no gov.br): o ERSUS360 busca os exercícios {new Date().getFullYear() - 1} e {new Date().getFullYear()} e marca o que não está na lista oficial.
    </div>);
  const ersus = Object.fromEntries((data.ersus_por_exercicio ?? []).map((r: any) => [r.exercicio, r]));
  return (
    <div style={{ ...S.card, background: nao.length ? "#fffbeb" : "#f0fdf4", color: nao.length ? "#78350f" : "#14532d", fontSize: 12.5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span><b>Conferido com o InvestSUS</b> em {new Date(u.conferido_em + "Z").toLocaleString("pt-BR")}: {u.investsus_total} propostas na lista oficial · {u.conferidas} no ERSUS360
          {nao.length > 0 ? <> · <b>{nao.length} não encontrada(s) no InvestSUS</b> ({fmt(nao.reduce((s, p) => s + (p.valor_indicado || 0), 0))}), fora dos totais</> : " · tudo confere"}</span>
        <button style={{ ...S.btn(), padding: "3px 9px" }} onClick={() => setAberto(v => !v)}>{aberto ? "Ocultar" : "Ver por exercício"}</button>
      </div>
      <ExcluirOcultas />
      {aberto && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 12, marginTop: 10 }}>
          <table style={{ ...XL.table, background: "#fff" }}>
            <thead><tr>{["Exercício", "InvestSUS (qtd)", "InvestSUS (valor)", "ERSUS360 (qtd)", "ERSUS360 (valor)"].map(h => <th key={h} style={{ ...XL.th, position: "static" }}>{h}</th>)}</tr></thead>
            <tbody>{(u.investsus_por_exercicio ?? []).map((r: any) => {
              const e = ersus[r.exercicio] ?? { qtd: 0, valor: 0 };
              const difere = e.qtd !== r.qtd || Math.abs(e.valor - r.valor) > 0.01;
              return <tr key={r.exercicio} style={{ color: difere ? "#b91c1c" : undefined }}><td style={XL.td}>{r.exercicio}</td><td style={XL.num}>{r.qtd}</td><td style={XL.num}>{fmt(r.valor)}</td><td style={XL.num}>{e.qtd}</td><td style={XL.num}>{fmt(e.valor)}</td></tr>;
            })}</tbody>
          </table>
          {nao.length > 0 && (
            <table style={{ ...XL.table, background: "#fff" }}>
              <thead><tr>{["Não encontradas no InvestSUS", "Exerc.", "Valor", "Origem do cadastro"].map(h => <th key={h} style={{ ...XL.th, position: "static" }}>{h}</th>)}</tr></thead>
              <tbody>{nao.map(p => <tr key={p.id}><td style={XL.td}><span style={{ fontFamily: "monospace" }}>{p.numero_proposta}</span><div style={{ fontSize: 10.5, color: "#6b7280" }}>{p.objeto}</div></td>
                <td style={XL.num}>{p.exercicio ?? "—"}</td><td style={XL.num}>{fmt(p.valor_indicado)}</td><td style={XL.td}>{p.fonte_dado ?? "—"}</td></tr>)}</tbody>
            </table>)}
        </div>)}
    </div>
  );
}

const NF_VAZIA = { acao_id: "", natureza_despesa: "", data: "", fornecedor: "", fornecedor_documento: "", documento_comprobatorio: "", valor: "", historico: "" };

function ControleEmenda({ propostaId, onVoltar, onPlanilhaCompleta }: { propostaId: number; onVoltar: () => void; onPlanilhaCompleta: (id: number) => void }) {
  const qc = useQueryClient();
  const chave = ["investsus-exec-ficha", propostaId];
  const { data, isLoading, isError, error } = useQuery({ queryKey: chave, queryFn: () => api.get(`/api/investsus/execucao/propostas/${propostaId}`).then(r => r.data) });
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const acao = async (fn: () => Promise<any>, sucesso?: string) => {
    try {
      const r = await fn();
      setMsg({ ok: true, texto: r?.data?.mensagem ?? sucesso ?? "Feito." });
      qc.invalidateQueries({ queryKey: chave });
      qc.invalidateQueries({ queryKey: ["investsus-exec-painel"] });
      return true;
    } catch (e) { setMsg({ ok: false, texto: erroMsg(e) }); return false; }
  };
  if (isLoading) return <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Carregando plano de trabalho…</div>;
  if (isError) return <div style={{ ...S.card, color: "#dc2626" }}>Não foi possível carregar: {erroMsg(error)} <button style={S.btn()} onClick={onVoltar}>Voltar</button></div>;

  const dg = data.dados_gerais, r = data.resumo, perm = data.permissoes;
  const acoes: any[] = data.acoes.filter((a: any) => a.ativa);
  const grupos: [string, any[]][] = [];
  for (const a of acoes) {
    const g = a.grupo || a.descricao;
    const existente = grupos.find(x => x[0] === g);
    if (existente) existente[1].push(a); else grupos.push([g, [a]]);
  }
  const naturezas: any[] = data.naturezas;
  const base = `/api/investsus/execucao`;
  const converter = () => acao(() => api.post(`${base}/propostas/${propostaId}/importar-plano`));

  return (
    <div>
      <DialogoJustificativa d={dialogo} fechar={() => setDialogo(null)} />
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <button style={S.btn()} onClick={onVoltar}><ArrowLeft size={13} /> Voltar aos repasses</button>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button style={S.btn("#059669")} onClick={() => baixar(`${base}/propostas/${propostaId}/controle.xlsx`, `controle_emenda_${dg.numero_proposta}.xlsx`).catch(e => setMsg({ ok: false, texto: erroMsg(e) }))}><FileSpreadsheet size={13} /> Baixar Excel (modelo do Fundo)</button>
          {perm.lancar && acoes.length > 0 && <ImportarControle propostaId={propostaId} onFim={(texto, ok) => {
            setMsg({ ok, texto }); qc.invalidateQueries({ queryKey: chave }); qc.invalidateQueries({ queryKey: ["investsus-exec-painel"] });
          }} />}
          <button style={S.btn()} onClick={() => onPlanilhaCompleta(propostaId)}><FileText size={13} /> Planilha completa (empenho/liquidação)</button>
        </div>
      </div>
      {msg && (
        <div style={{ background: msg.ok ? "#f0fdf4" : "#fef2f2", border: `1px solid ${msg.ok ? "#bbf7d0" : "#fecaca"}`, color: msg.ok ? "#166534" : "#991b1b", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12, display: "flex", justifyContent: "space-between", position: "sticky", top: 8, zIndex: 50, boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}>
          <span>{msg.texto}</span><button onClick={() => setMsg(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} /></button>
        </div>)}

      <div style={S.card}>
        <div style={{ ...S.title, marginBottom: 8 }}>Dados gerais da emenda</div>
        <table style={XL.table}><tbody>
          {([["Ano", dg.ano], ["Beneficiário", dg.beneficiario], ["Dirigente", dg.dirigente], ["Município", dg.municipio], ["CNPJ", dg.cnpj],
            ["Nº da proposta", dg.numero_proposta], ["Tipo", `${data.classificacao.origem_rotulo} · ${data.classificacao.destinacao_rotulo}`],
            ["Parlamentar", dg.parlamentar], ["Objeto", dg.objeto], ["Finalidade", dg.finalidade]] as [string, any][]).filter(([, v]) => v).map(([k, v]) => (
            <tr key={k}><td style={{ ...XL.td, background: "#f8fafc", fontWeight: 700, width: 170 }}>{k}</td><td style={{ ...XL.td, whiteSpace: "pre-line" }}>{v}</td></tr>))}
          <tr><td style={{ ...XL.td, background: "#f8fafc", fontWeight: 700 }}>Valor da proposta</td><td style={{ ...XL.td, fontWeight: 700 }}>{fmt(dg.valor)}</td></tr>
        </tbody></table>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(170px, 100%), 1fr))", gap: 10, marginTop: 12 }}>
          <Kpi label="Recebido do FNS" valor={fmt(r.recebido)} sub={`${r.recebido_info.qtd_parcelas} parcela(s)`} cor={COR.recebido} fonte="oficial" />
          <Kpi label="Valor do plano" valor={r.tem_plano ? fmt(r.valor_plano) : "não convertido"} cor={AZUL} fonte="municipio" />
          <Kpi label="Gasto (notas fiscais)" valor={fmt(r.pago)} cor={COR.pago} fonte="municipio" />
          <Kpi label="Saldo do plano" valor={r.saldo_plano == null ? "—" : fmt(r.saldo_plano)} sub="previsto − gasto" cor="#b45309" />
          <Kpi label="Saldo em conta" valor={fmt(r.saldo_financeiro)} sub="recebido + rendimentos − gasto" cor={r.saldo_financeiro < 0 ? COR.critico : AZUL} />
        </div>
      </div>

      {acoes.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 30 }}>
          <div style={{ fontWeight: 700, color: AZUL, marginBottom: 6 }}>O plano de trabalho ainda não foi convertido em planilha</div>
          {data.importacao.disponiveis > 0 ? (<>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>O plano sincronizado do InvestSUS tem {data.importacao.disponiveis} item(ns) (metas/naturezas). A conversão cria uma linha por ação, agrupada pela finalidade, com o valor previsto.</div>
            {perm.lancar && <button style={S.btn(AZUL)} onClick={converter}><Download size={13} /> Converter plano do InvestSUS em planilha</button>}
          </>) : (
            <div style={{ fontSize: 12, color: "#6b7280" }}>O plano desta proposta não veio do InvestSUS. Use <b>Sincronizar → Atualizar do InvestSUS</b> (traz o plano de cada proposta) ou cadastre as ações na planilha completa.</div>
          )}
        </div>
      ) : grupos.map(([g, itens]) => <LivroFinalidade key={g} grupo={g} itens={itens} naturezas={naturezas} perm={perm} acao={acao} setDialogo={setDialogo} origem={data.classificacao.origem_rotulo} />)}

      {acoes.length > 0 && data.importacao.pendentes > 0 && perm.lancar && (
        <div style={{ fontSize: 12, color: "#92400e", marginBottom: 12 }}>O plano sincronizado tem {data.importacao.pendentes} item(ns) ainda não convertidos. <button style={{ ...S.btn(), padding: "2px 8px" }} onClick={converter}>Converter os que faltam</button></div>)}

      <div style={S.card}>
        <div style={S.title}>Saldo por natureza (elemento) de despesa</div>
        {naturezas.length === 0 ? <div style={{ fontSize: 12, color: "#9ca3af" }}>O plano sincronizado não trouxe naturezas de despesa.</div> : (
          <div style={{ overflowX: "auto" }}><table style={XL.table}>
            <thead><tr>{["Elemento", "Descrição", "Previsto no plano (InvestSUS)", "Notas baixadas", "Saldo"].map(h => <th key={h} style={{ ...XL.th, position: "static", textAlign: h === "Elemento" || h === "Descrição" ? "left" : "right" }}>{h}</th>)}</tr></thead>
            <tbody>{naturezas.map(n => (
              <tr key={n.codigo}><td style={{ ...XL.td, fontFamily: "monospace" }}>{n.codigo === "sem_natureza" ? "—" : natFmt(n.codigo)}</td>
                <td style={XL.td}>{n.descricao || (n.codigo === "sem_natureza" ? "Notas sem elemento informado" : "")}{n.fora_do_plano && n.codigo !== "sem_natureza" && <span style={{ color: COR.urgente, fontSize: 10.5, fontWeight: 700 }}> · fora do plano</span>}</td>
                <td style={XL.num}>{fmt(n.previsto)}</td><td style={XL.num}>{fmt(n.pago)}</td>
                <td style={{ ...XL.num, fontWeight: 700, color: n.saldo < 0 ? COR.critico : AZUL }}>{fmt(n.saldo)}</td></tr>))}</tbody>
            <tfoot><tr style={{ background: "#f1f5f9", fontWeight: 800 }}><td style={XL.td} colSpan={2}>TOTAL</td>
              <td style={XL.num}>{fmt(naturezas.reduce((s, n) => s + n.previsto, 0))}</td><td style={XL.num}>{fmt(naturezas.reduce((s, n) => s + n.pago, 0))}</td>
              <td style={XL.num}>{fmt(naturezas.reduce((s, n) => s + n.saldo, 0))}</td></tr></tfoot>
          </table></div>)}
      </div>
    </div>
  );
}

function LivroFinalidade({ grupo, itens, naturezas, perm, acao, setDialogo, origem }: {
  grupo: string; itens: any[]; naturezas: any[]; perm: any; acao: (fn: () => Promise<any>, s?: string) => Promise<boolean>;
  setDialogo: (d: Dialogo) => void; origem: string;
}) {
  const base = `/api/investsus/execucao`;
  const total = itens.reduce((s, a) => s + a.previsto, 0);
  const gasto = itens.reduce((s, a) => s + a.pago, 0);
  const [f, setF] = useState<any>({ ...NF_VAZIA, acao_id: itens.length === 1 ? String(itens[0].id) : "" });
  const set = (k: string) => (e: any) => setF((v: any) => ({ ...v, [k]: e.target.value }));
  const nomesNat: Record<string, string> = Object.fromEntries(naturezas.map(n => [n.codigo, n.descricao]));
  // Livro: notas/pagamentos de todas as ações da finalidade em ordem de data, com saldo atual
  const notas = itens.flatMap(a => a.lancamentos
    .filter((l: any) => !l.cancelado && ["nota_fiscal", "estorno_nota_fiscal", "pagamento", "estorno_pagamento"].includes(l.tipo))
    .map((l: any) => ({ ...l, acao: a.descricao, nat: l.natureza_despesa || a.natureza_despesa })))
    .sort((x: any, y: any) => (x.data === y.data ? x.id - y.id : x.data.localeCompare(y.data)));
  let saldo = total;
  const acaoSel = itens.find(a => String(a.id) === f.acao_id);
  const salvar = async () => {
    const corpo = {
      tipo: "nota_fiscal", data: f.data, valor: Number(f.valor), natureza_despesa: f.natureza_despesa || acaoSel?.natureza_despesa || null,
      fornecedor: f.fornecedor || null, fornecedor_documento: f.fornecedor_documento || null,
      documento_comprobatorio: f.documento_comprobatorio, historico: f.historico || null,
    };
    if (await acao(() => api.post(`${base}/acoes/${f.acao_id}/lancamentos`, corpo), `Nota fiscal ${f.documento_comprobatorio} lançada — saldo baixado.`))
      setF({ ...NF_VAZIA, acao_id: f.acao_id, natureza_despesa: f.natureza_despesa });
  };
  return (
    <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
      <div style={{ background: AZUL, color: "#fff", padding: "10px 14px" }}>
        <div style={{ fontSize: 11, opacity: .85 }}>CONTROLE DE EXECUÇÃO — {origem.toUpperCase()}</div>
        <div style={{ fontSize: 14, fontWeight: 800 }}>FINALIDADE: {grupo.toUpperCase()} — {fmt(total)}</div>
        <div style={{ fontSize: 11.5, marginTop: 2 }}>Gasto {fmt(gasto)} · Saldo <b>{fmt(total - gasto)}</b></div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ overflowX: "auto", border: "1px solid #cbd5e1", marginBottom: 12 }}>
          <table style={XL.table}>
            <thead><tr>{["Ação do plano", "Elemento", "Valor previsto", "Gasto", "Saldo", "% gasto"].map(h => <th key={h} style={{ ...XL.th, position: "static", textAlign: h === "Ação do plano" || h === "Elemento" ? "left" : "right" }}>{h}</th>)}</tr></thead>
            <tbody>{itens.map(a => (
              <tr key={a.id}><td style={XL.td}>{a.descricao}</td><td style={{ ...XL.td, fontFamily: "monospace", fontSize: 11 }}>{a.natureza_despesa ? natFmt(a.natureza_despesa) : "várias"}</td>
                <td style={XL.num}>{fmt(a.previsto)}</td><td style={{ ...XL.num, color: COR.pago }}>{fmt(a.pago)}</td>
                <td style={{ ...XL.num, fontWeight: 700, color: a.saldo_plano < 0 ? COR.critico : AZUL }}>{fmt(a.saldo_plano)}</td><td style={XL.num}><BarraExec pct={a.perc_execucao} /></td></tr>))}</tbody>
          </table>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Entradas e saídas</div>
        <div style={{ overflowX: "auto", border: "1px solid #cbd5e1" }}>
          <table style={XL.table}>
            <thead><tr>{["Data", "Entrada", "Saída", "Ação / finalidade", "Elemento de despesa", "Fornecedor", "Nº nota fiscal", "Saldo atual", ""].map(h => <th key={h} style={{ ...XL.th, position: "static", textAlign: ["Entrada", "Saída", "Saldo atual"].includes(h) ? "right" : "left" }}>{h}</th>)}</tr></thead>
            <tbody>
              <tr style={{ background: "#f0fdf4", fontWeight: 700 }}><td style={XL.td}>—</td><td style={XL.num}>{fmt(total)}</td><td style={XL.num} /><td style={XL.td}>Valor da finalidade no plano de trabalho</td><td style={XL.td} colSpan={3} /><td style={XL.num}>{fmt(total)}</td><td style={XL.td} /></tr>
              {notas.length === 0 && <tr><td colSpan={9} style={{ ...XL.td, textAlign: "center", color: "#9ca3af", padding: 14 }}>Nenhuma nota fiscal lançada nesta finalidade.</td></tr>}
              {notas.map((l: any) => {
                const v = (l.tipo.startsWith("estorno") ? -1 : 1) * l.valor;
                saldo -= v;
                return (
                  <tr key={l.id}><td style={XL.td}>{fmtData(l.data)}</td><td style={XL.num} />
                    <td style={{ ...XL.num, color: v < 0 ? COR.recebido : COR.critico }}>{v < 0 ? `estorno ${fmt(-v)}` : fmt(v)}</td>
                    <td style={XL.td}>{l.historico || l.acao}{l.historico && <div style={{ fontSize: 10.5, color: "#6b7280" }}>{l.acao}</div>}</td>
                    <td style={{ ...XL.td, fontSize: 11 }}>{l.nat ? `${natFmt(l.nat)} ${nomesNat[l.nat] ?? ""}` : "—"}</td>
                    <td style={XL.td}>{l.fornecedor ?? "—"}</td><td style={XL.td}>{l.documento_comprobatorio ?? l.ordem_bancaria ?? "—"}</td>
                    <td style={{ ...XL.num, fontWeight: 700, color: saldo < 0 ? COR.critico : AZUL }}>{fmt(saldo)}</td>
                    <td style={{ ...XL.td, whiteSpace: "nowrap" }}><OrigemDado origem={l.origem_dado} />
                      {perm.lancar && <button title="Cancelar nota (com justificativa)" style={{ background: "none", border: "none", cursor: "pointer", color: COR.critico }}
                        onClick={() => setDialogo({ titulo: `Cancelar a nota ${l.documento_comprobatorio ?? ""} de ${fmt(l.valor)}`, onOk: (j: string) => acao(() => api.post(`${base}/lancamentos/${l.id}/cancelar`, { motivo: j }), "Nota cancelada (fica no histórico) e saldo devolvido.") })}><Ban size={12} /></button>}</td>
                  </tr>);
              })}
            </tbody>
          </table>
        </div>
        {perm.lancar && (
          <div style={{ marginTop: 10, background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: AZUL, marginBottom: 6 }}><Plus size={12} style={{ verticalAlign: -2 }} /> Lançar nota fiscal (baixa o saldo da ação e da natureza)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: 6, alignItems: "end" }}>
              <div style={{ gridColumn: "span 2" }}><label style={S.label}>Ação do plano *</label>
                <select style={S.input} value={f.acao_id} onChange={e => { const a = itens.find(x => String(x.id) === e.target.value); setF((v: any) => ({ ...v, acao_id: e.target.value, natureza_despesa: a?.natureza_despesa ?? v.natureza_despesa })); }}>
                  <option value="">Escolha…</option>{itens.map(a => <option key={a.id} value={a.id}>{a.descricao} — saldo {fmt(a.saldo_plano)}</option>)}
                </select></div>
              <div style={{ gridColumn: "span 2" }}><label style={S.label}>Elemento de despesa</label>
                <select style={S.input} value={f.natureza_despesa} onChange={set("natureza_despesa")}>
                  <option value="">{acaoSel?.natureza_despesa ? `Da ação (${natFmt(acaoSel.natureza_despesa)})` : "Escolha…"}</option>
                  {naturezas.filter(n => n.codigo !== "sem_natureza").map(n => <option key={n.codigo} value={n.codigo}>{natFmt(n.codigo)} {n.descricao ?? ""} — saldo {fmt(n.saldo)}</option>)}
                </select></div>
              <div><label style={S.label}>Data *</label><input type="date" style={S.input} value={f.data} onChange={set("data")} /></div>
              <div><label style={S.label}>Valor (R$) *</label><input type="number" step="0.01" min="0" style={S.input} value={f.valor} onChange={set("valor")} /></div>
              <div><label style={S.label}>Nº nota fiscal *</label><input style={S.input} value={f.documento_comprobatorio} onChange={set("documento_comprobatorio")} /></div>
              <div style={{ gridColumn: "span 2" }}><label style={S.label}>Fornecedor</label><input style={S.input} value={f.fornecedor} onChange={set("fornecedor")} /></div>
              <div><label style={S.label}>CNPJ do fornecedor</label><input style={S.input} value={f.fornecedor_documento} onChange={set("fornecedor_documento")} /></div>
              <div style={{ gridColumn: "span 2" }}><label style={S.label}>Finalidade / descrição do gasto</label><input style={S.input} value={f.historico} onChange={set("historico")} placeholder="Ex.: consultas especializadas de julho" /></div>
              <button style={S.btn(AZUL)} disabled={!f.acao_id || !f.data || !(Number(f.valor) > 0) || !f.documento_comprobatorio.trim()} onClick={salvar}><Check size={13} /> Lançar nota</button>
            </div>
            <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 6 }}>A mesma nota do mesmo fornecedor não entra duas vezes. Para corrigir, cancele a nota com justificativa. Anexe o PDF da nota na planilha completa.</div>
          </div>)}
      </div>
    </div>
  );
}

// Importação das planilhas de controle já preenchidas (modelos MAC por natureza e PAP por
// finalidade): prévia por aba, escolha da ação quando não houver vínculo automático e data
// padrão para notas sem data. Nota repetida não entra duas vezes.
function ImportarControle({ propostaId, onFim }: { propostaId: number; onFim: (texto: string, ok: boolean) => void }) {
  const inp = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<any>(null);
  const [mapa, setMapa] = useState<Record<string, string>>({});
  const [dataPadrao, setDataPadrao] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const enviar = async (file: File, confirmar: boolean, m = mapa, d = dataPadrao) => {
    const fd = new FormData();
    fd.append("arquivo", file);
    fd.append("confirmar", String(confirmar));
    if (d) fd.append("data_padrao", d);
    fd.append("mapa", JSON.stringify(m));
    return (await api.post(`/api/investsus/execucao/propostas/${propostaId}/controle/importar`, fd, { headers: { "Content-Type": "multipart/form-data" } })).data;
  };
  const fechar = () => { setPrevia(null); setArquivo(null); setMapa({}); setDataPadrao(""); if (inp.current) inp.current.value = ""; };
  const ver = async (file: File, m = mapa, d = dataPadrao) => {
    setOcupado(true);
    try { setPrevia(await enviar(file, false, m, d)); } catch (e) { onFim(erroMsg(e), false); fechar(); } finally { setOcupado(false); }
  };
  const confirmar = async () => {
    if (!arquivo) return;
    setOcupado(true);
    try {
      const r = await enviar(arquivo, true);
      onFim(`Planilha importada: ${r.criadas} nota(s) lançada(s).` +
        (r.duplicadas.length ? ` ${r.duplicadas.length} já existia(m) e foi(ram) ignorada(s).` : "") +
        (r.erros.length ? ` Problemas: ${r.erros.slice(0, 5).join("; ")}` : ""), true);
      fechar();
    } catch (e) { onFim(erroMsg(e), false); } finally { setOcupado(false); }
  };
  const semData = previa?.abas.reduce((s: number, a: any) => s + a.sem_data, 0) ?? 0;
  const semVinculo = previa?.abas.filter((a: any) => a.notas > 0 && !a.acao_id).length ?? 0;
  return (<>
    <input ref={inp} type="file" accept=".xlsx" style={{ display: "none" }}
      onChange={e => { const file = e.target.files?.[0]; if (file) { setArquivo(file); ver(file, {}, ""); } }} />
    <button style={S.btn()} disabled={ocupado} onClick={() => inp.current?.click()} title="Planilha de controle já preenchida (modelo MAC ou PAP)">
      <Upload size={13} /> {ocupado && !previa ? "Lendo planilha…" : "Importar planilha preenchida"}
    </button>
    {previa && (
      <div role="dialog" aria-modal="true" onClick={fechar} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 1100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: "#fff", color: "#111827", borderRadius: 10, padding: 18, width: "100%", maxWidth: 900 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontWeight: 800, color: AZUL }}>Prévia da importação — {arquivo?.name}</div>
            <button onClick={fechar} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
          </div>
          {!previa.confere_proposta && <div style={{ background: "#fef2f2", color: "#991b1b", borderRadius: 6, padding: 8, fontSize: 12, marginBottom: 8 }}>
            A planilha é da proposta <b>{previa.numero_planilha}</b>, diferente desta. Escolha a planilha certa.</div>}
          <div style={{ overflowX: "auto" }}>
            <table style={XL.table}>
              <thead><tr>{["Aba da planilha", "Modelo", "Notas", "Valor", "Lançar na ação", "Como foi vinculada"].map(h => <th key={h} style={{ ...XL.th, position: "static" }}>{h}</th>)}</tr></thead>
              <tbody>{previa.abas.map((a: any) => (
                <tr key={a.aba}>
                  <td style={XL.td}>{a.aba}{a.finalidade && <div style={{ fontSize: 10.5, color: "#6b7280" }}>{a.finalidade}</div>}{a.avisos.map((t: string) => <div key={t} style={{ fontSize: 10.5, color: "#92400e" }}>{t}</div>)}</td>
                  <td style={XL.td}>{a.modelo === "pap" ? "PAP (finalidade)" : a.modelo === "mac" ? `MAC (natureza ${natFmt(a.natureza)})` : "—"}</td>
                  <td style={XL.num}>{a.notas}{a.sem_data ? <div style={{ fontSize: 10, color: "#92400e" }}>{a.sem_data} sem data</div> : null}{a.sem_numero ? <div style={{ fontSize: 10, color: "#6b7280" }}>{a.sem_numero} sem nº</div> : null}</td>
                  <td style={XL.num}>{fmt(a.valor)}</td>
                  <td style={{ ...XL.td, minWidth: 220 }}>{a.notas === 0 ? <span style={{ color: "#9ca3af" }}>nenhuma nota lançada</span> : (
                    <select style={S.input} value={mapa[a.aba] ?? (a.acao_id ? String(a.acao_id) : "")}
                      onChange={e => { const m = { ...mapa, [a.aba]: e.target.value }; setMapa(m); if (arquivo) ver(arquivo, m); }}>
                      <option value="">Escolha a ação…</option>
                      {previa.acoes.map((x: any) => <option key={x.id} value={x.id}>{x.grupo ? `${x.grupo} › ` : ""}{x.descricao}</option>)}
                    </select>)}</td>
                  <td style={{ ...XL.td, fontSize: 11, color: a.acao_id ? "#065f46" : "#92400e" }}>{a.notas ? a.motivo : ""}</td>
                </tr>))}</tbody>
            </table>
          </div>
          {semData > 0 && (
            <div style={{ display: "flex", gap: 8, alignItems: "end", marginTop: 10, background: "#fffbeb", padding: 8, borderRadius: 6, color: "#78350f", fontSize: 12, flexWrap: "wrap" }}>
              <div>{semData} nota(s) sem data na planilha. Informe a data a usar para elas (ou preencha as datas na planilha e importe de novo):</div>
              <input type="date" style={{ ...S.input, width: 160 }} value={dataPadrao} onChange={e => { setDataPadrao(e.target.value); if (arquivo) ver(arquivo, mapa, e.target.value); }} />
            </div>)}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: 12 }}>Serão lançadas <b>{previa.notas_a_importar}</b> nota(s), <b>{fmt(previa.valor_a_importar)}</b>, marcadas como <OrigemDado origem="importado" />. Notas já lançadas (mesmo nº e fornecedor) são ignoradas.
              {semVinculo > 0 && <span style={{ color: "#92400e" }}> {semVinculo} aba(s) sem ação escolhida ficam de fora.</span>}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={S.btn()} onClick={fechar}>Cancelar</button>
              <button style={S.btn(AZUL)} disabled={ocupado || !previa.confere_proposta || previa.notas_a_importar === 0} onClick={confirmar}><Check size={13} /> {ocupado ? "Importando…" : "Importar notas"}</button>
            </div>
          </div>
        </div>
      </div>)}
  </>);
}
