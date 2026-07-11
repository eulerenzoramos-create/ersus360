import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Landmark, DollarSign, AlertTriangle, BarChart3, Activity,
  ArrowDownUp, ClipboardList, Layers,
} from "lucide-react";

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const BRLK = (v: number) => {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}K`;
  return BRL(v);
};
const PCT = (v: number) => `${v.toFixed(1)}%`;

const BRAND = "#1e3a5f";
const ACCENT = "#1d4ed8";
const OK = "#16a34a";
const WARN = "#d97706";
const CRIT = "#dc2626";
const BLOCOS_COLORS = ["#1d4ed8", "#0891b2", "#7c3aed", "#16a34a", "#d97706"];

function sc(s: string) {
  if (s === "ok") return OK;
  if (s === "atencao") return WARN;
  return CRIT;
}

const KPI = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold mt-1" style={{ color: color || BRAND }}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

const BarOrc = ({ label, val, max, color }: { label: string; val: number; max: number; color: string }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="w-20 text-slate-500 shrink-0">{label}</span>
    <div className="flex-1 bg-slate-100 rounded-full h-2">
      <div className="h-2 rounded-full" style={{ width: `${Math.min((val / max) * 100, 100)}%`, background: color }} />
    </div>
    <span className="w-24 text-right font-semibold text-slate-700">{BRLK(val)}</span>
    <span className="w-10 text-right text-slate-400">{PCT((val / max) * 100)}</span>
  </div>
);

const BLOCO_LABEL: Record<string, string> = {
  AB: "Atenção Básica", MAC: "MAC", VIG: "Vigilância", FARM: "Farmácia",
};

export default function SIOPSDetalhado() {
  const [aba, setAba] = useState("dashboard");
  const [filtroBloco, setFiltroBloco] = useState("TODOS");

  const { data: dash }    = useQuery({ queryKey: ["siops-dash"],   queryFn: () => apiGet("/api/siops-detalhado/dashboard"),          enabled: aba === "dashboard" });
  const { data: blocos }  = useQuery({ queryKey: ["siops-blocos"], queryFn: () => apiGet("/api/siops-detalhado/blocos"),              enabled: aba === "blocos" });
  const { data: ec29 }    = useQuery({ queryKey: ["siops-ec29"],   queryFn: () => apiGet("/api/siops-detalhado/ec29"),                enabled: aba === "ec29" });
  const { data: hist }    = useQuery({ queryKey: ["siops-hist"],   queryFn: () => apiGet("/api/siops-detalhado/historico"),           enabled: aba === "historico" });
  const { data: ind }     = useQuery({ queryKey: ["siops-ind"],    queryFn: () => apiGet("/api/siops-detalhado/indicadores"),         enabled: aba === "indicadores" });
  const { data: transf }  = useQuery({ queryKey: ["siops-transf"], queryFn: () => apiGet("/api/siops-detalhado/transferencias"),      enabled: aba === "transferencias" });
  const { data: orcam }   = useQuery({ queryKey: ["siops-orcam"],  queryFn: () => apiGet("/api/siops-detalhado/execucao-orcamentaria"), enabled: aba === "orcamento" });
  const { data: natData } = useQuery({ queryKey: ["siops-nat"],    queryFn: () => apiGet("/api/siops-detalhado/despesa-natureza"),    enabled: aba === "natureza" });
  const { data: rfData }  = useQuery({ queryKey: ["siops-rf"],     queryFn: () => apiGet("/api/siops-detalhado/receita-despesa"),     enabled: aba === "receita" });

  const d = dash as any;

  const ABAS = [
    { key: "dashboard",      label: "Dashboard",         icon: <Landmark size={14}/> },
    { key: "blocos",         label: "Blocos",            icon: <BarChart3 size={14}/> },
    { key: "transferencias", label: "Transferências",    icon: <ArrowDownUp size={14}/> },
    { key: "orcamento",      label: "Exec. Orçamentária",icon: <ClipboardList size={14}/> },
    { key: "natureza",       label: "Natureza Despesa",  icon: <Layers size={14}/> },
    { key: "ec29",           label: "EC-29",             icon: <DollarSign size={14}/> },
    { key: "receita",        label: "Receita vs Despesa",icon: <Activity size={14}/> },
    { key: "indicadores",    label: "Indicadores",       icon: <AlertTriangle size={14}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Landmark size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>SIOPS Detalhado</h1>
            <p className="text-sm text-slate-500">
              Vinculação EC-29 · Blocos · Transferências FNS/FES · Execução Orçamentária · FMS Apuí/AM
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {ABAS.map((a) => (
            <button key={a.key} onClick={() => setAba(a.key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={aba === a.key ? { background: BRAND, color: "white" } : { background: "white", color: "#475569", border: "1px solid #e2e8f0" }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD ── */}
        {aba === "dashboard" && d && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="EC-29 Aplicado"       value={PCT(d.aplicacao_saude_pct)}    sub={`Meta: ${d.vinculacao_minima_ec29_pct}%`} color={OK} />
              <KPI label="Superávit EC-29"       value={BRLK(d.superavit_ec29_valor)} sub={`+${d.superavit_ec29_pct} p.p. acima`}    color={OK} />
              <KPI label="MAC Executado"         value={PCT(d.mac_executado_pct)}      sub={BRLK(d.mac_executado_valor)}               color={WARN} />
              <KPI label="Teto MAC Anual"        value={BRLK(d.teto_mac_anual)}        sub={d.competencia} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Total Transferências"  value={BRLK(d.total_transferencias_recebidas)} sub="FNS + FES recebidos" color={ACCENT} />
              <KPI label="Recursos Próprios"     value={BRLK(d.total_recursos_proprios)}         sub="Tesouro municipal"  color={BRAND} />
              <KPI label="Despesa Total Saúde"   value={BRLK(d.total_despesa_saude)}             sub="Empenhado acumulado" color={BRAND} />
              <KPI label="Despesa/Habitante/Ano" value="R$ 668"  sub="Meta: R$600 — acima"       color={OK} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Distribuição por Bloco de Financiamento</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Atenção Básica",    pct: d.bloco_atencao_basica_pct },
                  { label: "MAC",               pct: d.bloco_mac_pct },
                  { label: "Vigilância",        pct: d.bloco_vigilancia_pct },
                  { label: "Assist. Farm.",     pct: d.bloco_assistencia_farm_pct },
                  { label: "Gestão",            pct: d.bloco_gestao_pct },
                ].map((b, i) => (
                  <div key={b.label} className="text-center p-3 rounded-lg" style={{ background: `${BLOCOS_COLORS[i]}18` }}>
                    <p className="text-2xl font-bold" style={{ color: BLOCOS_COLORS[i] }}>{b.pct}%</p>
                    <p className="text-xs text-slate-500 mt-1">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-900">
                <b>EC-29 superado em 4,8 p.p.</b> — Apuí aplica 19,8% da receita de impostos em saúde, acima do mínimo constitucional de 15%. O superávit de R$895.920 representa margem real de custeio.
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-900">
                <b>MAC com 25,8% de saldo</b> — R$1.105.272 do teto MAC disponíveis. Ritmo de execução abaixo do esperado — risco de devolução ao FNS se não houver aceleração no 2º trimestre.
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-900">
                <b>34,3% de recursos próprios</b> — Do total gasto em saúde, R$2,87M são de tesouro municipal. Município acima da média para municípios AM de porte similar (28,4%).
              </div>
            </div>
          </div>
        )}

        {/* ── BLOCOS ── */}
        {aba === "blocos" && Array.isArray(blocos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Execução por Bloco (R$) — Federal · Estadual · Municipal</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={blocos as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="bloco" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => BRL(v)} />
                  <Legend />
                  <Bar dataKey="federal"   name="Federal"   fill="#1d4ed8" radius={[3,3,0,0]} />
                  <Bar dataKey="estadual"  name="Estadual"  fill="#0891b2" radius={[3,3,0,0]} />
                  <Bar dataKey="municipal" name="Municipal" fill="#7c3aed" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(blocos as any[]).map((b: any, i: number) => (
                <div key={b.bloco} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700">{b.bloco}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-500">Total: <b>{BRLK(b.total)}</b></span>
                      <span className="font-bold" style={{ color: BLOCOS_COLORS[i] }}>{b.pct_exec}% executado</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                    <div className="h-2 rounded-full" style={{ width: `${b.pct_exec}%`, background: BLOCOS_COLORS[i] }} />
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div className="bg-blue-50 rounded p-2 text-center">
                      <p className="text-slate-400 mb-0.5">Federal</p>
                      <p className="font-bold text-blue-700">{BRLK(b.federal)}</p>
                    </div>
                    <div className="bg-cyan-50 rounded p-2 text-center">
                      <p className="text-slate-400 mb-0.5">Estadual</p>
                      <p className="font-bold text-cyan-700">{BRLK(b.estadual)}</p>
                    </div>
                    <div className="bg-purple-50 rounded p-2 text-center">
                      <p className="text-slate-400 mb-0.5">Municipal</p>
                      <p className="font-bold text-purple-700">{BRLK(b.municipal)}</p>
                    </div>
                    <div className="bg-green-50 rounded p-2 text-center">
                      <p className="text-slate-400 mb-0.5">Executado</p>
                      <p className="font-bold text-green-700">{BRLK(b.executado)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TRANSFERÊNCIAS ── */}
        {aba === "transferencias" && Array.isArray(transf) && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {["TODOS","AB","MAC","VIG","FARM"].map((b) => (
                <button key={b} onClick={() => setFiltroBloco(b)}
                  className="px-3 py-1 rounded-full text-xs font-medium border"
                  style={filtroBloco === b ? { background: BRAND, color: "white", borderColor: BRAND } : { background: "white", color: "#475569", borderColor: "#e2e8f0" }}>
                  {b === "TODOS" ? "Todos os blocos" : BLOCO_LABEL[b] || b}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="grid grid-cols-3 gap-4 mb-4 text-xs text-center">
                {["FNS","FES","Total"].map((f) => {
                  const lista = (transf as any[]).filter((t: any) => filtroBloco === "TODOS" || t.bloco === filtroBloco);
                  const v = f === "Total"
                    ? lista.reduce((s: number, t: any) => s + t.valor_recebido, 0)
                    : lista.filter((t: any) => t.fonte === f).reduce((s: number, t: any) => s + t.valor_recebido, 0);
                  return (
                    <div key={f} className="rounded-lg p-3" style={{ background: f === "FNS" ? "#dbeafe" : f === "FES" ? "#e0f2fe" : "#dcfce7" }}>
                      <p className="text-slate-500">{f === "Total" ? "Total Recebido" : `Repasse ${f}`}</p>
                      <p className="text-lg font-bold text-slate-700">{BRLK(v)}</p>
                    </div>
                  );
                })}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-2 text-slate-500 font-medium">Programa / Incentivo</th>
                      <th className="text-center py-2 px-2 text-slate-500 font-medium">Bloco</th>
                      <th className="text-center py-2 px-2 text-slate-500 font-medium">Fonte</th>
                      <th className="text-right py-2 px-2 text-slate-500 font-medium">Previsto/Ano</th>
                      <th className="text-right py-2 px-2 text-slate-500 font-medium">Recebido</th>
                      <th className="text-center py-2 px-2 text-slate-500 font-medium">Exec. %</th>
                      <th className="text-left py-2 px-2 text-slate-500 font-medium">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(transf as any[])
                      .filter((t: any) => filtroBloco === "TODOS" || t.bloco === filtroBloco)
                      .map((t: any) => (
                        <tr key={t.programa} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-2 font-medium text-slate-700">{t.programa}</td>
                          <td className="py-2 px-2 text-center">
                            <span className="px-1.5 py-0.5 rounded text-slate-600 bg-slate-100">{t.bloco}</span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className="px-1.5 py-0.5 rounded font-medium" style={{ background: t.fonte === "FNS" ? "#dbeafe" : "#e0f2fe", color: t.fonte === "FNS" ? "#1d4ed8" : "#0891b2" }}>{t.fonte}</span>
                          </td>
                          <td className="py-2 px-2 text-right text-slate-600">{t.valor_anual > 0 ? BRLK(t.valor_anual) : "—"}</td>
                          <td className="py-2 px-2 text-right font-semibold text-slate-700">{t.valor_recebido > 0 ? BRLK(t.valor_recebido) : "—"}</td>
                          <td className="py-2 px-2 text-center">
                            <span className="font-bold" style={{ color: sc(t.status) }}>{t.valor_anual > 0 ? `${t.pct_exec}%` : "—"}</span>
                          </td>
                          <td className="py-2 px-2 text-slate-400 max-w-xs">{t.obs}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── EXECUÇÃO ORÇAMENTÁRIA ── */}
        {aba === "orcamento" && Array.isArray(orcam) && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
              <b>Pipeline orçamentário:</b> Dotação Atual → Empenhado → Liquidado → Pago · Quanto resta a empenhar antes do encerramento do exercício.
            </div>
            {(orcam as any[]).map((a: any) => (
              <div key={a.acao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-700 text-sm">{a.acao}</p>
                    <p className="text-xs text-slate-400">Função: {a.funcao}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-slate-400">Dotação atual</p>
                    <p className="font-bold text-slate-700">{BRLK(a.dotacao_atual)}</p>
                    {a.creditos_adic > 0 && <p className="text-green-600">+{BRLK(a.creditos_adic)} créditos ad.</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <BarOrc label="Empenhado"  val={a.empenhado}  max={a.dotacao_atual} color="#1d4ed8" />
                  <BarOrc label="Liquidado"  val={a.liquidado}  max={a.dotacao_atual} color="#0891b2" />
                  <BarOrc label="Pago"       val={a.pago}       max={a.dotacao_atual} color="#16a34a" />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">A empenhar: <b className="text-slate-600">{BRLK(a.a_empenhar)}</b></span>
                  <span className="px-2 py-0.5 rounded-full font-medium text-xs" style={{ background: `${sc(a.status)}22`, color: sc(a.status) }}>
                    {a.status === "ok" ? "Regular" : a.status === "atencao" ? "Atenção" : "Crítico"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── NATUREZA DA DESPESA ── */}
        {aba === "natureza" && natData && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-4">Despesa por Natureza — Empenhado</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={(natData as any).resumo} dataKey="empenhado" nameKey="natureza" cx="50%" cy="50%" outerRadius={85} label={({ pct }) => `${(pct * 100).toFixed(0)}%`}>
                      {((natData as any).resumo as any[]).map((n: any) => (
                        <Cell key={n.natureza} fill={n.cor} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => BRLK(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-4">Dotação vs Empenhado por Natureza</h3>
                <div className="space-y-3">
                  {((natData as any).resumo as any[]).map((n: any) => (
                    <div key={n.natureza}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">{n.natureza}</span>
                        <span className="font-bold" style={{ color: n.cor }}>{BRLK(n.empenhado)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.min((n.empenhado / n.dotacao) * 100, 100)}%`, background: n.cor }} />
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                        <span>Dotação: {BRLK(n.dotacao)}</span>
                        <span>{PCT((n.empenhado / n.dotacao) * 100)} exec.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal por Natureza (R$)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={(natData as any).mensal} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => BRLK(v)} />
                  <Legend />
                  <Bar dataKey="pessoal"     name="Pessoal"            fill="#1e3a5f" stackId="a" radius={[0,0,0,0]} />
                  <Bar dataKey="custeio"     name="Custeio/Serviços"   fill="#1d4ed8" stackId="a" />
                  <Bar dataKey="farmacia"    name="Material Farmacol." fill="#7c3aed" stackId="a" />
                  <Bar dataKey="investimento"name="Investimento"       fill="#dc2626" stackId="a" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── EC-29 ── */}
        {aba === "ec29" && ec29 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <KPI label="Receita Base (IRRF+IPTU+ISS…)" value={BRLK((ec29 as any).receita_base)} />
              <KPI label="Mínimo EC-29 (15%)"            value={BRL((ec29 as any).minimo_legal_valor)} />
              <KPI label="Aplicado"                      value={PCT((ec29 as any).aplicado_pct)} sub={BRL((ec29 as any).aplicado_valor)} color={OK} />
              <KPI label="Superávit"                     value={`${(ec29 as any).superavit_pct} p.p.`} sub={BRL((ec29 as any).superavit_valor)} color={OK} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Série Histórica EC-29 — Receita Base e % Aplicado (2021–2026)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={(ec29 as any).serie_historica} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="pct" domain={[12, 22]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="val" orientation="right" tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number, name: string) => name.includes("%") ? PCT(v) : BRLK(v)} />
                  <Legend />
                  <ReferenceLine yAxisId="pct" y={15} stroke={CRIT} strokeDasharray="4 4" label={{ value: "Mínimo 15%", position: "insideRight", fontSize: 10 }} />
                  <Line yAxisId="pct" dataKey="aplicado_pct"   name="EC-29 % Aplicado"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="val" dataKey="aplicado_valor" name="Valor Aplicado (R$)" stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── RECEITA VS DESPESA ── */}
        {aba === "receita" && Array.isArray(rfData) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Receita Arrecadada vs Despesa Realizada em Saúde (últimos 6 meses)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rfData as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => BRLK(v)} />
                  <Legend />
                  <Bar dataKey="receita_propria"  name="Receita Própria"    fill="#7c3aed" radius={[3,3,0,0]} />
                  <Bar dataKey="transferencias"   name="Transferências"     fill="#1d4ed8" radius={[3,3,0,0]} />
                  <Bar dataKey="despesa_saude"    name="Despesa em Saúde"   fill="#0891b2" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Saldo Mensal (Receita Total − Despesa Saúde)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={rfData as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => BRLK(v)} />
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <Line dataKey="saldo" name="Saldo" stroke={OK} strokeWidth={2} dot={{ r: 5 }} fill={OK} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(rfData as any[]).map((r: any) => (
                <div key={r.mes} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center gap-4 text-sm">
                  <span className="font-semibold text-slate-500 w-16 shrink-0">{r.mes}</span>
                  <div className="flex gap-6 flex-1 flex-wrap">
                    <span className="text-purple-600">Própria: <b>{BRLK(r.receita_propria)}</b></span>
                    <span className="text-blue-600">Transf.: <b>{BRLK(r.transferencias)}</b></span>
                    <span className="text-cyan-600">Total: <b>{BRLK(r.total_receita)}</b></span>
                    <span className="text-slate-600">Despesa: <b>{BRLK(r.despesa_saude)}</b></span>
                  </div>
                  <span className="font-bold shrink-0" style={{ color: r.saldo >= 0 ? OK : CRIT }}>
                    {r.saldo >= 0 ? "+" : ""}{BRLK(r.saldo)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── INDICADORES ── */}
        {aba === "indicadores" && Array.isArray(ind) && (
          <div className="grid gap-3">
            {(ind as any[]).map((i: any) => (
              <div key={i.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: sc(i.status) }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-semibold text-slate-700 text-sm">{i.indicador}</span>
                    <span className="font-bold text-sm" style={{ color: sc(i.status) }}>
                      {typeof i.valor === "number" && i.unidade === "R$" ? BRL(i.valor) : `${i.valor} ${i.unidade}`}
                      {i.meta != null ? ` / meta: ${i.unidade === "R$" ? BRL(i.meta) : `${i.meta} ${i.unidade}`}` : ""}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{i.observacao}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
