// src/pages/SIOPSCompleto.tsx — SIOPS · Gestão Orçamentária e Financeira da Saúde
// FMS Apuí/AM · 2026 · Lei 4.320/64 · LC 141/2012
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  DollarSign, TrendingUp, AlertTriangle, CheckCircle,
  ChevronDown, ChevronRight, Download, Filter, Info, Clock,
} from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";

// ── Tema ──────────────────────────────────────────────────────────────────────
const COR = {
  primary:  "#0c4a6e",
  blue:     "#1d4ed8",
  green:    "#16a34a",
  yellow:   "#d97706",
  red:      "#dc2626",
  gray:     "#9ca3af",
  purple:   "#7c3aed",
  cyan:     "#0891b2",
};

const COR_NIVEL: Record<string, string> = {
  vermelho: COR.red, amarelo: COR.yellow, verde: COR.green, cinza: COR.gray,
};
const COR_STATUS: Record<string, string> = {
  critico: COR.red, atencao: COR.yellow, em_execucao: COR.blue, ok: COR.green,
};

// ── Tooltips do Recharts ──────────────────────────────────────────────────────
const TT_STYLE = { fontSize: 11, background: "#fff", border: "1px solid #e4e7ec", borderRadius: 6 };

const fmtTT = (v: number, name: string) => [BRL(v), name];
const fmtYAxis = (v: number) => BRL_AXIS(v);

// ── Componentes base ──────────────────────────────────────────────────────────

function Banner() {
  return (
    <div style={{ background: `linear-gradient(135deg,${COR.primary} 0%,#075985 100%)`, padding: "18px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}>
          <DollarSign size={18} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>
          SIOPS — Gestão Orçamentária e Financeira da Saúde
        </span>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)" }}>
        FMS Apuí/AM · Exercício 2026 · Lei 4.320/64 · LC 141/2012 · EC 29/2000
      </div>
    </div>
  );
}

function FonteBadge({ info }: { info: any }) {
  if (!info) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  const cor = info.status === "referencia" ? "#d97706" : "#16a34a";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fffbeb",
      border: `1px solid ${cor}40`, borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 11 }}>
      <Info size={13} color={cor} />
      <div style={{ color: "#78350f" }}>
        <strong>Fonte:</strong> {info.fonte} ·{" "}
        <strong>Referência:</strong> {info.data_referencia} ·{" "}
        <strong>Período:</strong> {info.periodo} ·{" "}
        <span style={{ background: cor + "22", color: cor, borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>
          {info.status === "referencia" ? "Dados de referência" : "Dados oficiais"}
        </span>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, cor, icon, tooltip }: {
  label: string; value: string; sub?: string; cor: string;
  icon: React.ReactNode; tooltip?: string;
}) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}22`, borderTop: `3px solid ${cor}`,
      borderRadius: 10, padding: "12px 14px", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.04em" }}>{label}</span>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {tooltip && (
            <div style={{ position: "relative" }}
              onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
              <Info size={11} color="#9ca3af" style={{ cursor: "help" }} />
              {showTip && (
                <div style={{ position: "absolute", right: 0, top: 16, background: "#111827", color: "#fff",
                  fontSize: 10, padding: "6px 10px", borderRadius: 6, width: 220, zIndex: 99, lineHeight: 1.5 }}>
                  {tooltip}
                </div>
              )}
            </div>
          )}
          <div style={{ background: `${cor}15`, borderRadius: 6, padding: 4 }}>{icon}</div>
        </div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: cor, lineHeight: 1.2, wordBreak: "break-word" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ── Aba: Painel Geral ─────────────────────────────────────────────────────────

function AbaPainelGeral({ dados }: { dados: any }) {
  if (!dados) return <NaoDisponivelBanner nota="Integração com SIOPS ainda não configurada no Railway. Nenhum dado fiscal foi inventado." />;
  const ind = dados.indicadores;

  const kpisReceita = [
    { label: "Receita prevista total",       value: BRL(ind.receita_prevista_total),    cor: COR.blue,   tt: "Total de receitas previstas para o exercício de 2026." },
    { label: "Receita arrecadada",           value: BRL(ind.receita_arrecadada),        cor: COR.green,  tt: "Receita efetivamente arrecadada até a data de referência (1º ao 4º Bimestre parcial)." },
    { label: "Receita própria — saúde",      value: BRL(ind.receita_propria_saude),     cor: COR.purple, tt: "Recursos próprios do município destinados à saúde (gasto próprio saúde)." },
    { label: "Transferências da União (SUS)", value: BRL(ind.transferencias_uniao),     cor: COR.cyan,   tt: "Transferências federais fundo a fundo ao FMS (FNS — bloco de custeio e investimento)." },
    { label: "Transferências do Estado",     value: BRL(ind.transferencias_estado),     cor: COR.gray,   tt: "Recursos estaduais transferidos ao FMS (sem registro no período)." },
  ];

  const kpisDespesa = [
    { label: "Dotação atualizada",           value: BRL(ind.dotacao_atualizada),        cor: COR.blue,   tt: "Dotação orçamentária aprovada + suplementações/reduções no exercício." },
    { label: "Empenhado",                    value: BRL(ind.empenhado),                 cor: COR.purple, tt: "Valor empenhado: reserva de crédito para uma despesa futura." },
    { label: "Liquidado",                    value: BRL(ind.liquidado),                 cor: COR.yellow, tt: "Despesa cuja entrega ou prestação de serviço foi reconhecida (art. 63 Lei 4.320/64)." },
    { label: "Pago",                         value: BRL(ind.pago),                      cor: COR.green,  tt: "Valor efetivamente transferido ao fornecedor/credor (extinção da obrigação)." },
    { label: "Saldo a empenhar",             value: BRL(ind.saldo_empenhar),            cor: COR.cyan,   tt: "Dotação atualizada menos valor empenhado — disponível para novos empenhos." },
  ];

  const kpisASPS = [
    { label: "% ASPS aplicado (acum.)",      value: PCT(ind.pct_asps_acumulado),        cor: ind.pct_asps_acumulado >= 15 ? COR.green : COR.red, tt: "Percentual de recursos próprios aplicados em ASPS (Ações e Serviços Públicos de Saúde). Meta mínima: 15% (LC 141/2012)." },
    { label: "Valor mínimo exigido (15%)",   value: BRL(ind.valor_minimo_exigido),      cor: COR.blue,   tt: "Valor correspondente a 15% da receita própria — mínimo constitucional obrigatório." },
    { label: "Valor aplicado em ASPS",       value: BRL(ind.valor_efetivamente_aplicado), cor: COR.green, tt: "Total de recursos próprios efetivamente aplicados em ações e serviços públicos de saúde." },
    { label: "Superávit constitucional",     value: BRL(ind.diferenca_minimo),          cor: COR.green,  tt: "Diferença entre o valor aplicado e o mínimo exigido. Valor positivo = conforme." },
  ];

  const kpisRP = [
    { label: "Restos a pagar inscritos",     value: BRL(ind.restos_pagar_inscritos),    cor: COR.yellow, tt: "Total inscrito em restos a pagar no exercício." },
    { label: "RP processados",               value: BRL(ind.restos_pagar_processados),  cor: COR.yellow, tt: "Restos a pagar com liquidação reconhecida (entrega/serviço confirmado)." },
    { label: "RP não processados",           value: BRL(ind.restos_pagar_nao_processados), cor: COR.red, tt: "Restos a pagar sem liquidação — empenho sem reconhecimento da entrega." },
    { label: "RP pagos",                     value: BRL(ind.restos_pagar_pagos),        cor: COR.green,  tt: "Restos a pagar efetivamente liquidados e pagos no período." },
    { label: "RP cancelados",               value: BRL(ind.restos_pagar_cancelados),    cor: COR.gray,   tt: "Restos a pagar cancelados por prescrição, renúncia ou outros motivos." },
  ];

  const gridStyle = { display: "grid", gap: 12, marginBottom: 20 };
  const secTitle = (txt: string, cor: string) => (
    <div style={{ fontSize: 12, fontWeight: 800, color: cor, textTransform: "uppercase" as const,
      letterSpacing: "0.06em", marginBottom: 10, paddingBottom: 6,
      borderBottom: `2px solid ${cor}30` }}>
      {txt}
    </div>
  );

  return (
    <div>
      {secTitle("Receitas", COR.blue)}
      <div style={{ ...gridStyle, gridTemplateColumns: "repeat(5,1fr)" }}>
        {kpisReceita.map(k => (
          <KpiCard key={k.label} label={k.label} value={k.value} cor={k.cor} tooltip={k.tt}
            icon={<DollarSign size={12} color={k.cor} />} />
        ))}
      </div>

      {secTitle("Despesas — Execução Orçamentária", COR.purple)}
      <div style={{ ...gridStyle, gridTemplateColumns: "repeat(5,1fr)" }}>
        {kpisDespesa.map(k => (
          <KpiCard key={k.label} label={k.label} value={k.value} cor={k.cor} tooltip={k.tt}
            icon={<TrendingUp size={12} color={k.cor} />} />
        ))}
      </div>

      {secTitle("ASPS — Mínimo Constitucional (LC 141/2012)", COR.green)}
      <div style={{ ...gridStyle, gridTemplateColumns: "repeat(4,1fr)" }}>
        {kpisASPS.map(k => (
          <KpiCard key={k.label} label={k.label} value={k.value} cor={k.cor} tooltip={k.tt}
            icon={<CheckCircle size={12} color={k.cor} />} />
        ))}
      </div>
      <div style={{ background: ind.status_minimo_constitucional === "atingido" ? "#f0fdf4" : "#fef2f2",
        border: `1px solid ${ind.status_minimo_constitucional === "atingido" ? "#bbf7d0" : "#fecaca"}`,
        borderRadius: 8, padding: "10px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
        <CheckCircle size={14} color={ind.status_minimo_constitucional === "atingido" ? COR.green : COR.red} />
        <span style={{ color: ind.status_minimo_constitucional === "atingido" ? "#166534" : "#991b1b" }}>
          {ind.status_minimo_constitucional === "atingido"
            ? `Apuí/AM está CONFORME com o mínimo constitucional. ${PCT(ind.pct_asps_acumulado)} aplicados em ASPS (meta 15%). Superávit: ${BRL(ind.diferenca_minimo)}.`
            : `ATENÇÃO: Apuí/AM está ABAIXO do mínimo constitucional. ${PCT(ind.pct_asps_acumulado)} < 15%. Déficit: ${BRL(Math.abs(ind.diferenca_minimo))}.`}
        </span>
      </div>

      {secTitle("Restos a Pagar", COR.yellow)}
      <div style={{ ...gridStyle, gridTemplateColumns: "repeat(5,1fr)" }}>
        {kpisRP.map(k => (
          <KpiCard key={k.label} label={k.label} value={k.value} cor={k.cor} tooltip={k.tt}
            icon={<Clock size={12} color={k.cor} />} />
        ))}
      </div>
    </div>
  );
}

// ── Aba: Programas ────────────────────────────────────────────────────────────

function AbaProgramas({ dados }: { dados: any }) {
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());

  if (!dados) return <NaoDisponivelBanner nota="Integração com SIOPS ainda não configurada no Railway. Nenhum dado fiscal foi inventado." />;
  const { programas, totais } = dados;

  const toggle = (id: number) => {
    const s = new Set(expandidos);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpandidos(s);
  };

  const COR_S = (s: string) => COR_STATUS[s] || COR.blue;

  const barraExec = (pct: number, cor: string) => (
    <div style={{ height: 4, background: "#f3f4f6", borderRadius: 4, width: "100%", marginTop: 2 }}>
      <div style={{ height: 4, background: cor, borderRadius: 4, width: `${Math.min(pct, 100)}%` }} />
    </div>
  );

  return (
    <div>
      {/* Totalizadores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { l: "Dotação total",       v: BRL(totais?.dotacao_atualizada), c: COR.blue },
          { l: "Total empenhado",     v: BRL(totais?.empenhado),          c: COR.purple },
          { l: "Total pago",          v: BRL(totais?.pago),               c: COR.green },
          { l: "Saldo a empenhar",    v: BRL(totais?.saldo_empenhar),     c: COR.cyan },
          { l: "% Exec. orçamentária", v: PCT(totais?.pct_exec_orc),      c: COR.blue },
        ].map(k => (
          <div key={k.l} style={{ background: "#fff", border: `1px solid ${k.c}22`,
            borderTop: `3px solid ${k.c}`, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>{k.l}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Tabela com drill-down */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: COR.blue, color: "#fff" }}>
              <th style={{ padding: "9px 12px", textAlign: "left" }}>Programa</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Dotação Atualizada</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Empenhado</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Liquidado</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Pago</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Saldo a Empenhar</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Exec. Orç. %</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Exec. Fin. %</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Fonte</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Status</th>
              <th style={{ padding: "9px 10px" }}></th>
            </tr>
          </thead>
          <tbody>
            {programas.map((p: any, i: number) => {
              const cor = COR_S(p.status);
              const exp = expandidos.has(p.id);
              return (
                <>
                  <tr key={p.id} style={{ borderTop: "1px solid #f3f4f6",
                    background: p.status === "critico" ? "#fff7f7" : i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={{ padding: "9px 12px", fontWeight: 600 }}>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 1 }}>{p.codigo}</div>
                      {p.programa}
                    </td>
                    <td style={{ padding: "9px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{BRL(p.dotacao_atualizada)}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: COR.purple, fontVariantNumeric: "tabular-nums" }}>{BRL(p.empenhado)}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: COR.yellow, fontVariantNumeric: "tabular-nums" }}>{BRL(p.liquidado)}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: COR.green, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{BRL(p.pago)}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: COR.cyan, fontVariantNumeric: "tabular-nums" }}>{BRL(p.saldo_empenhar)}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: p.pct_exec_orc < 30 ? COR.red : p.pct_exec_orc < 60 ? COR.yellow : COR.green }}>
                        {PCT(p.pct_exec_orc)}
                      </div>
                      {barraExec(p.pct_exec_orc, p.pct_exec_orc < 30 ? COR.red : p.pct_exec_orc < 60 ? COR.yellow : COR.green)}
                    </td>
                    <td style={{ padding: "9px 10px", textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: p.pct_exec_fin < 30 ? COR.red : COR.green }}>
                        {PCT(p.pct_exec_fin)}
                      </div>
                      {barraExec(p.pct_exec_fin, p.pct_exec_fin < 30 ? COR.red : COR.green)}
                    </td>
                    <td style={{ padding: "9px 10px", fontSize: 10, color: "#6b7280" }}>{p.fonte}</td>
                    <td style={{ padding: "9px 10px", textAlign: "center" }}>
                      <span style={{ background: cor + "15", color: cor, fontSize: 9,
                        fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
                        {p.status === "critico" ? "⚠ Crítico" : "✓ Em execução"}
                      </span>
                    </td>
                    <td style={{ padding: "9px 10px", textAlign: "center" }}>
                      <button onClick={() => toggle(p.id)} style={{ border: "none", background: "none",
                        cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center" }}>
                        {exp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </td>
                  </tr>
                  {exp && (
                    <tr key={`detail-${p.id}`}>
                      <td colSpan={11} style={{ padding: 0, background: "#f8fafc" }}>
                        <div style={{ padding: "12px 20px 14px 28px", borderLeft: `3px solid ${cor}`,
                          borderBottom: "1px solid #e5e7eb" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: cor, marginBottom: 8 }}>
                            ▸ Ações orçamentárias — {p.programa}
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
                            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 6, padding: "8px 10px" }}>
                              <div style={{ fontSize: 9, color: "#9ca3af" }}>Saldo a liquidar</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: COR.yellow }}>{BRL(p.saldo_liquidar)}</div>
                            </div>
                            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 6, padding: "8px 10px" }}>
                              <div style={{ fontSize: 9, color: "#9ca3af" }}>Meta física</div>
                              <div style={{ fontSize: 11, fontWeight: 600 }}>{p.meta_fisica}</div>
                            </div>
                            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 6, padding: "8px 10px" }}>
                              <div style={{ fontSize: 9, color: "#9ca3af" }}>Subfunção</div>
                              <div style={{ fontSize: 11, fontWeight: 600 }}>{p.subfuncao}</div>
                            </div>
                          </div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                            <thead>
                              <tr style={{ background: "#e8f0fe" }}>
                                <th style={{ padding: "5px 10px", textAlign: "left", color: COR.blue }}>Ação orçamentária</th>
                                <th style={{ padding: "5px 10px", textAlign: "right", color: COR.blue }}>Empenhado</th>
                                <th style={{ padding: "5px 10px", textAlign: "right", color: COR.blue }}>Pago</th>
                                <th style={{ padding: "5px 10px", textAlign: "right", color: COR.blue }}>Exec. Fin. %</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(p.acoes || []).map((a: any, j: number) => (
                                <tr key={j} style={{ borderTop: "1px solid #f3f4f6" }}>
                                  <td style={{ padding: "5px 10px" }}>{a.descricao}</td>
                                  <td style={{ padding: "5px 10px", textAlign: "right", color: COR.purple, fontVariantNumeric: "tabular-nums" }}>{BRL(a.empenhado)}</td>
                                  <td style={{ padding: "5px 10px", textAlign: "right", color: COR.green, fontVariantNumeric: "tabular-nums" }}>{BRL(a.pago)}</td>
                                  <td style={{ padding: "5px 10px", textAlign: "right", color: COR.blue }}>
                                    {a.empenhado > 0 ? PCT((a.pago / a.empenhado) * 100) : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#1e3a5f", color: "#fff", fontWeight: 700 }}>
              <td style={{ padding: "9px 12px" }}>TOTAL</td>
              <td style={{ padding: "9px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{BRL(totais?.dotacao_atualizada)}</td>
              <td style={{ padding: "9px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{BRL(totais?.empenhado)}</td>
              <td style={{ padding: "9px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{BRL(totais?.liquidado)}</td>
              <td style={{ padding: "9px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{BRL(totais?.pago)}</td>
              <td style={{ padding: "9px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{BRL(totais?.saldo_empenhar)}</td>
              <td style={{ padding: "9px 10px", textAlign: "right" }}>{PCT(totais?.pct_exec_orc)}</td>
              <td style={{ padding: "9px 10px", textAlign: "right" }}>{PCT(totais?.pct_exec_fin)}</td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legenda de fórmulas */}
      <div style={{ marginTop: 14, padding: "10px 14px", background: "#f8fafc",
        border: "1px solid #e4e7ec", borderRadius: 8, fontSize: 10, color: "#6b7280" }}>
        <strong>Fórmulas:</strong>{" "}
        Exec. Orç. = Empenhado ÷ Dotação Atualizada × 100 ·{" "}
        Exec. Fin. = Pago ÷ Dotação Atualizada × 100 ·{" "}
        Saldo a Empenhar = Dotação Atualizada − Empenhado ·{" "}
        Saldo a Liquidar = Empenhado − Liquidado
      </div>
    </div>
  );
}

// ── Aba: Comparativos ─────────────────────────────────────────────────────────

function AbaComparativos({ dados }: { dados: any }) {
  if (!dados) return <NaoDisponivelBanner nota="Integração com SIOPS ainda não configurada no Railway. Nenhum dado fiscal foi inventado." />;
  const c = dados.comparativos;

  const chartStyle = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 16 };
  const ChartTitle = ({ t }: { t: string }) => (
    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: "#374151" }}>{t}</div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Previsto vs Arrecadado */}
      <div style={chartStyle}>
        <ChartTitle t="Receita: Prevista × Arrecadada — por Bimestre" />
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={c.previsto_vs_arrecadado.filter((d: any) => d.arrecadado !== null)} barGap={4} barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="bimestre" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 9 }} width={90} tickFormatter={fmtYAxis} />
            <Tooltip contentStyle={TT_STYLE} formatter={fmtTT} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="previsto"    name="Previsto"    fill="#93c5fd" radius={[3,3,0,0]} />
            <Bar dataKey="arrecadado"  name="Arrecadado"  fill={COR.blue} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dotação vs Empenhado */}
      <div style={chartStyle}>
        <ChartTitle t="Execução Orçamentária: Dotação × Empenhado — por Bimestre" />
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={c.dotacao_vs_empenhado} barGap={4} barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="bimestre" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 9 }} width={90} tickFormatter={fmtYAxis} />
            <Tooltip contentStyle={TT_STYLE} formatter={fmtTT} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="dotacao"    name="Dotação atualizada" fill="#dbeafe" radius={[3,3,0,0]} />
            <Bar dataKey="empenhado"  name="Empenhado"          fill={COR.purple} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Empenhado vs Pago */}
      <div style={chartStyle}>
        <ChartTitle t="Execução Financeira: Empenhado × Liquidado × Pago — por Bimestre" />
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={c.empenhado_vs_pago} barGap={3} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="bimestre" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 9 }} width={90} tickFormatter={fmtYAxis} />
            <Tooltip contentStyle={TT_STYLE} formatter={fmtTT} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="empenhado"  name="Empenhado"  fill={COR.purple} radius={[3,3,0,0]} />
            <Bar dataKey="liquidado"  name="Liquidado"  fill={COR.yellow} radius={[3,3,0,0]} />
            <Bar dataKey="pago"       name="Pago"       fill={COR.green}  radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Próprios vs Transferências */}
      <div style={chartStyle}>
        <ChartTitle t="Recursos Próprios × Transferências SUS — por Bimestre" />
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={c.proprios_vs_transferencias} barGap={4} barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="bimestre" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 9 }} width={90} tickFormatter={fmtYAxis} />
            <Tooltip contentStyle={TT_STYLE} formatter={fmtTT} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="proprios"          name="Rec. Próprios"    fill={COR.green} radius={[3,3,0,0]} />
            <Bar dataKey="transferencias_sus" name="Transferências SUS" fill={COR.cyan} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Execução por programa */}
      <div style={{ ...chartStyle, gridColumn: "1 / -1" }}>
        <ChartTitle t="Execução por Programa — Dotação × Empenhado × Pago" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={c.por_programa} barGap={3} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="programa" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 9 }} width={90} tickFormatter={fmtYAxis} />
            <Tooltip contentStyle={TT_STYLE} formatter={fmtTT} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="dotacao"   name="Dotação"   fill="#dbeafe" radius={[3,3,0,0]} />
            <Bar dataKey="empenhado" name="Empenhado" fill={COR.purple} radius={[3,3,0,0]} />
            <Bar dataKey="pago"      name="Pago"      fill={COR.green}  radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Aba: Alertas ──────────────────────────────────────────────────────────────

function AbaAlertas({ dados }: { dados: any }) {
  if (!dados) return <NaoDisponivelBanner nota="Integração com SIOPS ainda não configurada no Railway. Nenhum dado fiscal foi inventado." />;
  const { alertas, resumo } = dados;

  const resumoItems = [
    { label: "Críticos",    count: resumo.criticos,  cor: COR.red },
    { label: "Atenção",     count: resumo.atencao,   cor: COR.yellow },
    { label: "Regulares",   count: resumo.regulares, cor: COR.green },
    { label: "Sem dado",    count: resumo.sem_dado,  cor: COR.gray },
  ];

  const ICONE: Record<string, React.ReactNode> = {
    vermelho: <AlertTriangle size={16} color={COR.red} />,
    amarelo:  <AlertTriangle size={16} color={COR.yellow} />,
    verde:    <CheckCircle size={16} color={COR.green} />,
    cinza:    <Info size={16} color={COR.gray} />,
  };

  return (
    <div>
      {/* Resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {resumoItems.map(r => (
          <div key={r.label} style={{ background: "#fff", border: `1px solid ${r.cor}30`,
            borderTop: `3px solid ${r.cor}`, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: r.cor }}>{r.count}</div>
            <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>{r.label}</div>
          </div>
        ))}
      </div>

      {/* Lista de alertas */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {alertas.map((a: any) => {
          const cor = COR_NIVEL[a.nivel] || COR.gray;
          return (
            <div key={a.id} style={{ background: "#fff", border: `1px solid ${cor}30`,
              borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {ICONE[a.nivel]}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{a.titulo}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{a.programa}</div>
                  </div>
                </div>
                {a.pct != null && (
                  <div style={{ background: cor + "15", color: cor, fontSize: 12, fontWeight: 800,
                    padding: "3px 10px", borderRadius: 20 }}>
                    {a.pct.toFixed(1).replace(".", ",")}%
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>{a.descricao}</div>
              {a.valor_referencia != null && (
                <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
                  <span>Referência: <strong style={{ color: COR.blue }}>{BRL(a.valor_referencia)}</strong></span>
                  <span>Executado: <strong style={{ color: cor }}>{BRL(a.valor_executado)}</strong></span>
                </div>
              )}
              <div style={{ background: "#f8fafc", borderRadius: 6, padding: "6px 10px", fontSize: 11,
                color: "#374151", borderLeft: `2px solid ${cor}` }}>
                <strong>Ação recomendada:</strong> {a.acao_recomendada}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

type Aba = "painel" | "programas" | "comparativos" | "alertas";

export default function SIOPSCompleto() {
  const [aba, setAba] = useState<Aba>("painel");
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);
  const [filtroProg, setFiltroProg] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const queryProg = {
    ...(filtroProg  ? { programa: filtroProg }   : {}),
    ...(filtroStatus ? { status: filtroStatus }  : {}),
    ...(filtroTipo   ? { tipo_recurso: filtroTipo } : {}),
  };
  const qParams = new URLSearchParams(queryProg as any).toString();

  const { data: painel }   = useQuery({ queryKey: ["sc-painel"], queryFn: () => apiGet("/api/siops-completo/painel-geral") as Promise<any> });
  const { data: progs }    = useQuery({ queryKey: ["sc-progs", qParams], queryFn: () => apiGet(`/api/siops-completo/programas${qParams ? "?" + qParams : ""}`) as Promise<any>, enabled: aba === "programas" });
  const { data: comps }    = useQuery({ queryKey: ["sc-comps"], queryFn: () => apiGet("/api/siops-completo/comparativos") as Promise<any>, enabled: aba === "comparativos" });
  const { data: alertas }  = useQuery({ queryKey: ["sc-alertas"], queryFn: () => apiGet("/api/siops-completo/alertas") as Promise<any>, enabled: aba === "alertas" });

  const limparFiltros = () => { setFiltroProg(""); setFiltroStatus(""); setFiltroTipo(""); };
  const filtrosAtivos = [filtroProg, filtroStatus, filtroTipo].filter(Boolean).length;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "painel",       label: "Painel Geral" },
    { id: "programas",    label: "Relatório por Programa" },
    { id: "comparativos", label: "Comparativos" },
    { id: "alertas",      label: "Alertas Gerenciais" },
  ];

  const importInfo = painel?.importacao;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <Banner />

      <div style={{ padding: "20px 28px 60px" }}>
        <FonteBadge info={importInfo} />

        {/* Barra de ferramentas */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          {/* Abas */}
          <div style={{ display: "flex", gap: 2, borderBottom: "2px solid #e4e7ec" }}>
            {ABAS.map(a => (
              <button key={a.id} onClick={() => setAba(a.id)}
                style={{ padding: "8px 16px", border: "none", background: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: aba === a.id ? 700 : 400,
                  color: aba === a.id ? COR.cyan : "#6b7280",
                  borderBottom: aba === a.id ? `2px solid ${COR.cyan}` : "2px solid transparent",
                  marginBottom: -2 }}>
                {a.label}
              </button>
            ))}
          </div>

          {/* Ações */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {aba === "programas" && (
              <button onClick={() => setFiltrosVisiveis(!filtrosVisiveis)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                  border: `1px solid ${filtrosAtivos > 0 ? COR.cyan : "#d1d5db"}`, borderRadius: 7,
                  background: filtrosAtivos > 0 ? "#e0f2fe" : "#fff", fontSize: 12, cursor: "pointer",
                  color: filtrosAtivos > 0 ? COR.cyan : "#374151" }}>
                <Filter size={13} />
                Filtros {filtrosAtivos > 0 && `(${filtrosAtivos} ativo${filtrosAtivos > 1 ? "s" : ""})`}
              </button>
            )}
            {(["csv","xlsx","pdf"] as const).map((fmt) => {
              const API = import.meta.env.VITE_API_URL ?? "";
              const url = `${API}/api/siops-completo/exportar-${fmt}`;
              const label = fmt === "csv" ? "CSV" : fmt === "xlsx" ? "Excel" : "PDF";
              const bg   = fmt === "pdf" ? "#fee2e2" : fmt === "xlsx" ? "#dcfce7" : "#fff";
              const col  = fmt === "pdf" ? "#b91c1c" : fmt === "xlsx" ? "#15803d" : "#374151";
              const mime = fmt === "csv" ? "text/csv" : fmt === "xlsx"
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "application/pdf";
              const filename = `siops_loa_2026.${fmt}`;
              async function baixar() {
                const r = await fetch(url);
                if (!r.ok) { alert("Erro ao gerar arquivo. Verifique se o backend está online."); return; }
                const blob = await r.blob();
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([blob], { type: mime }));
                a.download = filename;
                a.click();
                URL.revokeObjectURL(a.href);
              }
              return (
                <button key={fmt} onClick={baixar}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                    border: `1px solid ${col}40`, borderRadius: 7, background: bg,
                    fontSize: 12, cursor: "pointer", color: col }}>
                  <Download size={13} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Painel de filtros */}
        {filtrosVisiveis && aba === "programas" && (
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10,
            padding: "14px 16px", marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" as const }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>Programa</div>
              <input value={filtroProg} onChange={e => setFiltroProg(e.target.value)}
                placeholder="Buscar programa..." style={{ border: "1px solid #d1d5db", borderRadius: 6,
                  padding: "6px 10px", fontSize: 12, width: 200 }} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>Status</div>
              <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
                style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px", fontSize: 12 }}>
                <option value="">Todos</option>
                <option value="em_execucao">Em execução</option>
                <option value="critico">Crítico</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>Tipo de recurso</div>
              <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
                style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px", fontSize: 12 }}>
                <option value="">Todos</option>
                <option value="proprio">Próprio</option>
                <option value="proprio_federal">Próprio + Federal</option>
                <option value="proprio_emenda">Próprio + Emenda</option>
              </select>
            </div>
            <button onClick={limparFiltros}
              style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: 6,
                background: "#fff", fontSize: 12, cursor: "pointer", color: "#374151" }}>
              Limpar filtros
            </button>
            {filtrosAtivos > 0 && (
              <div style={{ fontSize: 11, color: COR.cyan, background: "#e0f2fe",
                padding: "4px 10px", borderRadius: 20 }}>
                {filtrosAtivos} filtro{filtrosAtivos > 1 ? "s" : ""} ativo{filtrosAtivos > 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}

        {/* Conteúdo das abas */}
        {aba === "painel"       && <AbaPainelGeral dados={painel} />}
        {aba === "programas"    && <AbaProgramas dados={progs} />}
        {aba === "comparativos" && <AbaComparativos dados={comps} />}
        {aba === "alertas"      && <AbaAlertas dados={alertas} />}
      </div>
    </div>
  );
}
