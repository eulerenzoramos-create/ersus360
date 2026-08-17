import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Monitor, AlertTriangle, Radio, TrendingUp } from "lucide-react";

const BRAND  = "#dbeafe";
const ACCENT = "#1d4ed8";
const OK     = "#16a34a";
const WARN   = "#d97706";
const CRIT   = "#dc2626";

function statusColor(s: string) {
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

const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div className="w-full bg-slate-100 rounded-full h-2.5">
    <div className="h-2.5 rounded-full" style={{ width: `${Math.min(value / max * 100, 100)}%`, background: color }} />
  </div>
);

export default function TelessaudeApui() {
  const [aba, setAba] = useState("dashboard");
  const [expandedAps, setExpandedAps] = useState<string[]>([]);

  const { data: dash }        = useQuery({ queryKey: ["ts-dashboard"],  queryFn: () => apiGet("/api/telessaude-apui/dashboard"),    enabled: aba === "dashboard" });
  const { data: espec }       = useQuery({ queryKey: ["ts-espec"],      queryFn: () => apiGet("/api/telessaude-apui/especialidades"),enabled: aba === "especialidades" });
  const { data: conect }      = useQuery({ queryKey: ["ts-conect"],     queryFn: () => apiGet("/api/telessaude-apui/conectividade"), enabled: aba === "conectividade" });
  const { data: historico }   = useQuery({ queryKey: ["ts-historico"],  queryFn: () => apiGet("/api/telessaude-apui/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["ts-ind"],        queryFn: () => apiGet("/api/telessaude-apui/indicadores"),   enabled: aba === "indicadores" });
  const { data: emulti, isLoading: emultiLoading, isError: emultiError } = useQuery({ queryKey: ["ts-emulti"], queryFn: () => apiGet("/api/telessaude-apui/emulti-remoto"), enabled: aba === "emulti", retry: 2 });

  const dashRaw   = dash as any;
  const emultiRaw = emulti as any;

  const ABAS = [
    { key: "dashboard",     label: "Dashboard",           icon: <Monitor size={15}/> },
    { key: "especialidades",label: "Especialidades",      icon: <Radio size={15}/> },
    { key: "conectividade", label: "Conectividade",       icon: <Radio size={15}/> },
    { key: "historico",     label: "Histórico",           icon: <TrendingUp size={15}/> },
    { key: "indicadores",   label: "Indicadores",         icon: <AlertTriangle size={15}/> },
    { key: "emulti",        label: "🚨 eMulti Remoto",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Monitor size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>TeleSaúde — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Teleconsulta · Telediagnóstico · 2ª Opinião · Conectividade UBS · FMS Apuí/AM</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {ABAS.map((a) => (
            <button key={a.key} onClick={() => setAba(a.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={aba === a.key ? { background: BRAND, color: "white" } : { background: "white", color: "#475569", border: "1px solid #e2e8f0" }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>

        {aba === "dashboard" && !dashRaw && (
          <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />
        )}

        {aba === "dashboard" && dashRaw && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Teleconsultas/Ano"       value={dashRaw.teleconsultas_realizadas_ano?.toLocaleString()} color={ACCENT} sub={`${dashRaw.teleconsultas_mes_atual}/mês atual`} />
              <KPI label="Telediagnósticos/Ano"    value={dashRaw.telediagnosticos_ano.toString()} color={BRAND} />
              <KPI label="Resolubilidade"          value={`${dashRaw.taxa_resolubilidade_pct}%`} color={WARN} sub="meta: 80%" />
              <KPI label="Referências Evitadas"    value={`${dashRaw.evitou_referencia_manaus_pct}%`} color={OK} sub="evitou viagem a Manaus" />
            </div>
            <div className="grid grid-cols-2 md:grid-calls-4 md:grid-cols-4 gap-4">
              <KPI label="UBS Conectadas"          value={`${dashRaw.ubs_com_conectividade}/${dashRaw.ubs_total}`} color={WARN} sub={`${dashRaw.conectividade_pct}% cobertura`} />
              <KPI label="Velocidade Média"        value={`${dashRaw.velocidade_media_mbps} Mbps`} color={WARN} sub={`meta: ${dashRaw.meta_velocidade_mbps} Mbps`} />
              <KPI label="Especialidades"          value={dashRaw.especialidades_disponiveis.toString()} sub="disponíveis via tela" />
              <KPI label="Tele-ECG/Ano"            value={dashRaw.tele_eletrocardiograma_ano.toString()} color={BRAND} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Conectividade por UBS</h3>
                <div className="space-y-2">
                  {[
                    { label: "Fibra óptica (≥8 Mbps)", count: 1, color: OK },
                    { label: "Rádio 4G (2–5 Mbps)",   count: 4, color: WARN },
                    { label: "Satélite VSAT (<2 Mbps)",count: 2, color: CRIT },
                    { label: "Sem conexão",            count: 2, color: "#6b7280" },
                  ].map((c) => (
                    <div key={c.label} className="flex items-center gap-3">
                      <span className="text-xs w-40 text-slate-600">{c.label}</span>
                      <ProgressBar value={c.count} max={8} color={c.color} />
                      <span className="text-xs font-bold w-4" style={{ color: c.color }}>{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900 flex flex-col gap-2 justify-center">
                <p><b>Impacto econômico:</b> teleconsulta evita viagem a Manaus — estimativa de R$ 180 mil/ano economizados em custeio de transporte e hospedagem.</p>
                <p><b>Aldeia sem conexão:</b> 2 UBS indígenas sem internet — populações mais vulneráveis excluídas do acesso à teleconsulta.</p>
                <p><b>VSAT insuficiente:</b> 0,8 Mbps no Rio Juma não suporta videochamada — teleconsultas são apenas assíncronas (envio de imagens).</p>
              </div>
            </div>
          </div>
        )}

        {aba === "especialidades" && Array.isArray(espec) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Consultas por Especialidade — 2025</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={(espec as any[])} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="especialidade" tick={{ fontSize: 9 }} width={200} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip formatter={(v: any, n: any) => [v, n === "consultas_ano" ? "Consultas" : "Resolubilidade %"]} />
                  <Bar dataKey="consultas_ano" name="Consultas" radius={[0,3,3,0]}>
                    {(espec as any[]).map((e: any) => <Cell key={e.especialidade} fill={statusColor(e.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(espec as any[]).map((e: any) => (
                <div key={e.especialidade} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{e.especialidade}</span>
                      <span className="ml-2 text-xs text-slate-400">{e.disponibilidade}</span>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="text-slate-500">{e.consultas_ano} consultas</span>
                      <span className="font-bold" style={{ color: statusColor(e.status) }}>{e.resolubilidade_pct}% resolutivo</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-24">Resolubilidade:</span>
                    <ProgressBar value={e.resolubilidade_pct} max={100} color={statusColor(e.status)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "conectividade" && Array.isArray(conect) && (
          <div className="grid gap-3">
            {(conect as any[]).map((u: any) => (
              <div key={u.ubs} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(u.status) }} />
                    <span className="font-semibold text-slate-700">{u.ubs}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: statusColor(u.status) }}>
                    {u.conectada ? `${u.velocidade_mbps} Mbps` : "Sem conexão"}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-500 mb-2">
                  <span>Tipo: <b>{u.tipo}</b></span>
                  <span className={u.conectada ? "text-green-600" : "text-red-600"}>
                    {u.conectada ? "✓ Conectada" : "✗ Sem internet"}
                  </span>
                </div>
                {u.conectada && (
                  <ProgressBar value={u.velocidade_mbps} max={10} color={statusColor(u.status)} />
                )}
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal — TeleSaúde (Jan–Jun/2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="teleconsultas"  name="Teleconsultas"   stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="telediag"       name="Telediagnósticos"stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="segunda_opiniao"name="2ª Opinião"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="resolvidas_pct" name="Resolubilidade %" stroke={OK}    strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {aba === "indicadores" && Array.isArray(indicadores) && (
          <div className="grid gap-3">
            {(indicadores as any[]).map((ind: any) => (
              <div key={ind.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(ind.status) }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-sm">{ind.indicador}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(ind.status) }}>
                      {`${ind.valor} ${ind.unidade}`}{ind.meta != null ? ` / meta: ${ind.meta}` : ""}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{ind.observacao}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── eMulti Atendimento Remoto ── */}
        {aba === "emulti" && emultiRaw && (() => {
          const d = emultiRaw;
          const diag = d.diagnostico ?? {};
          const gerarRelatorio = () => {
            const linhas: string[] = [
              "=".repeat(70),
              "RELATÓRIO DE INCONSISTÊNCIAS — eMulti ATENDIMENTO REMOTO",
              `Município: ${d.municipio}/${d.uf}   Período: ${d.periodo_analise ?? "JAN–AGO/2026"}`,
              `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
              `Fonte: ${d.fonte_dados ?? "e-Gestor APS"}`,
              "=".repeat(70),
              "",
              "► RESUMO EXECUTIVO",
              diag.resumo_executivo ?? "",
              "",
              `► IMPACTO FINANCEIRO TOTAL: R$ ${(d.perda_acumulada ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
              `  Meses sem receber: ${d.meses_sem_receber ?? 0}   Potencial/mês: R$ ${(d.valor_potencial_mensal ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
              "",
              "► HISTÓRICO DE PAGAMENTOS",
              ...(d.historico_pagamentos ?? []).map((h: any) =>
                `  ${h.competencia} (${h.parcela}): R$ ${Number(h.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} — ${h.status === "nao_pago" ? "NÃO RECEBIDO" : "RECEBIDO"}`
              ),
              "",
              "► INCONSISTÊNCIAS IDENTIFICADAS",
              ...(d.inconsistencias ?? []).flatMap((inc: any, i: number) => [
                "",
                `  [${inc.codigo}] ${inc.titulo}`,
                `  Gravidade: ${inc.gravidade.toUpperCase()}   Status: ${inc.status.toUpperCase()}`,
                `  Portaria: ${inc.portaria}`,
                `  Descrição: ${inc.descricao}`,
                `  Ação corretiva: ${inc.acao_corretiva}`,
                `  Prazo: ${inc.prazo}   Responsável: ${inc.responsavel}`,
                inc.impacto_financeiro > 0
                  ? `  Impacto financeiro: R$ ${inc.impacto_financeiro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  : "",
              ]),
              "",
              "► DIAGNÓSTICO E PREVISÃO",
              `  Total de inconsistências: ${diag.total_inconsistencias ?? 0}`,
              `  Críticas: ${diag.criticas ?? 0}   Altas: ${diag.altas ?? 0}   Médias: ${diag.medias ?? 0}`,
              `  Previsão de regularização: ${diag.previsao_regularizacao ?? ""}`,
              `  Próximo repasse estimado: ${diag.proximo_repasse_estimado ?? ""}`,
              "",
              "=".repeat(70),
              "Relatório gerado pelo ERSUS 360 — FMS Apuí/AM   v1.0.0",
              "=".repeat(70),
            ];
            const blob = new Blob([linhas.join("\n")], { type: "text/plain;charset=utf-8" });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href = url; a.download = `relatorio_emulti_apui_${new Date().toISOString().slice(0,10)}.txt`;
            a.click(); URL.revokeObjectURL(url);
          };

          return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Banner crítico */}
            <div style={{ background: "#fef2f2", border: "2px solid #fca5a5", borderRadius: 10, padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ fontSize: 24 }}>🚨</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#b91c1c", marginBottom: 4 }}>
                    eMulti — Atendimento Remoto: R$ 0,00 recebido em {d.competencia_verificada}
                  </div>
                  <div style={{ fontSize: 13, color: "#7f1d1d" }}>
                    Período analisado: <strong>{d.periodo_analise}</strong> · Perda acumulada:{" "}
                    <strong>R$ {(d.perda_acumulada ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong> · {d.meses_sem_receber} meses sem receber · Port. GM/MS nº 635/2023
                  </div>
                </div>
              </div>
              <button onClick={gerarRelatorio}
                style={{ flexShrink: 0, background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                ⬇ Gerar Relatório
              </button>
            </div>

            {/* Diagnóstico resumido */}
            {diag.resumo_executivo && (
              <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#713f12" }}>
                <strong>Diagnóstico:</strong> {diag.resumo_executivo}
              </div>
            )}

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
              {[
                { label: `Recebido ${d.competencia_verificada}`, val: "R$ 0,00", cor: "#dc2626" },
                { label: "Potencial/mês",     val: `R$ ${(d.valor_potencial_mensal??0).toLocaleString("pt-BR",{minimumFractionDigits:2})}`, cor: "#d97706" },
                { label: "Perda acumulada",   val: `R$ ${(d.perda_acumulada??0).toLocaleString("pt-BR",{minimumFractionDigits:2})}`, cor: "#dc2626" },
                { label: "Meses sem receber", val: `${d.meses_sem_receber} de ${d.parcela?.split("/")[1]??12}`, cor: "#dc2626" },
                { label: "Inconsistências",   val: `${diag.criticas??0} críticas`, cor: "#dc2626" },
                { label: "Modalidade",        val: d.modalidade_credenciada ?? "—", cor: "#1d4ed8" },
              ].map(k => (
                <div key={k.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: ".07em" }}>{k.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: k.cor, marginTop: 4 }}>{k.val}</div>
                </div>
              ))}
            </div>

            {/* Histórico de pagamentos */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: "#1d4ed8" }}>Histórico de Pagamentos — Jan a Ago/2026</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                {d.historico_pagamentos?.map((h: any) => (
                  <div key={h.competencia} style={{ background: h.status === "nao_pago" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${h.status === "nao_pago" ? "#fca5a5" : "#86efac"}`, borderRadius: 7, padding: "8px 14px", textAlign: "center" as const }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>{h.competencia}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: h.status === "nao_pago" ? "#dc2626" : "#16a34a" }}>
                      R$ {Number(h.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 9, color: "#9ca3af" }}>{h.parcela}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: h.status === "nao_pago" ? "#dc2626" : "#16a34a", marginTop: 2 }}>
                      {h.status === "nao_pago" ? "NÃO RECEBIDO" : "RECEBIDO"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conformidade e-Gestor */}
            {d.conformidade_egestor && (() => {
              const ceg = d.conformidade_egestor;
              return (
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ background: "#f0f9ff", borderBottom: "1px solid #bae6fd", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: "#0369a1", textTransform: "uppercase" as const, letterSpacing: ".07em" }}>
                      Conformidade e-Gestor APS — {ceg.competencia_referencia} (Parcela {ceg.parcela_referencia})
                    </span>
                    <span style={{ fontSize: 11, color: "#0369a1" }}>Total APS: <strong>R$ {ceg.total_aps_repasse?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></span>
                  </div>

                  {/* Componentes eMulti */}
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: "#374151", marginBottom: 8 }}>Componentes eMulti (JUN/2026)</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                      {ceg.componentes_emulti?.map((c: any) => (
                        <div key={c.componente} style={{ flex: 1, minWidth: 180, background: c.status === "pago" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${c.status === "pago" ? "#86efac" : "#fca5a5"}`, borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>{c.componente}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: c.status === "pago" ? "#16a34a" : "#dc2626" }}>
                            R$ {c.valor_pago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </div>
                          {c.valor_referencia !== c.valor_pago && (
                            <div style={{ fontSize: 10, color: "#9ca3af" }}>Potencial: R$ {c.valor_referencia.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                          )}
                          <div style={{ fontSize: 10, fontWeight: 700, color: c.status === "pago" ? "#16a34a" : "#dc2626", marginTop: 4 }}>
                            {c.status === "pago" ? "✓ PAGO" : "✕ NÃO PAGO"}
                          </div>
                          {c.motivo_bloqueio && <div style={{ fontSize: 10, color: "#dc2626", marginTop: 3 }}>{c.motivo_bloqueio}</div>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Indicadores e-Gestor */}
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: "#374151", marginBottom: 8 }}>Indicadores e-Gestor — eMulti</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8 }}>
                      {Object.entries(ceg.indicadores_egestor ?? {}).map(([k, v]: [string, any]) => {
                        const labels: Record<string, string> = {
                          equipes_credenciadas: "Equipes credenciadas",
                          equipes_adesao_remoto_tic: "Adesão Remoto TIC",
                          equipes_homologadas: "Equipes homologadas",
                          equipes_pagas: "Equipes pagas",
                          equipes_atendimento_remoto_pagas: "Remoto pagas",
                        };
                        const isProblema = k === "equipes_atendimento_remoto_pagas" && v === 0;
                        return (
                          <div key={k} style={{ background: isProblema ? "#fef2f2" : "#f8fafc", border: `1px solid ${isProblema ? "#fca5a5" : "#e5e7eb"}`, borderRadius: 7, padding: "8px 12px" }}>
                            <div style={{ fontSize: 10, color: "#6b7280" }}>{labels[k] ?? k}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: isProblema ? "#dc2626" : "#16a34a" }}>{v}</div>
                            {isProblema && <div style={{ fontSize: 9, color: "#dc2626", fontWeight: 700 }}>⚠ BLOQUEIO</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Análise de conformidade */}
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: "#374151", marginBottom: 8 }}>Análise de Conformidade</div>
                    {ceg.analise_conformidade?.map((a: any) => (
                      <div key={a.item} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", borderBottom: "1px solid #f9fafb" }}>
                        <div style={{ flexShrink: 0, width: 18, height: 18, borderRadius: "50%", background: a.conforme ? "#f0fdf4" : "#fef2f2", border: `1.5px solid ${a.conforme ? "#16a34a" : "#dc2626"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: a.conforme ? "#16a34a" : "#dc2626" }}>
                          {a.conforme ? "✓" : "✕"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{a.item}</div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>{a.valor_egestor} — {a.obs}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Conclusão */}
                  <div style={{ padding: "12px 16px", background: "#fef9c3", borderTop: "1px solid #fde047" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#713f12", marginBottom: 4 }}>Conclusão da Análise e-Gestor:</div>
                    <div style={{ fontSize: 12, color: "#78350f" }}>{ceg.conclusao}</div>
                  </div>

                  {/* Tabela APS com detalhamento */}
                  <div style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: "#374151", marginBottom: 8 }}>
                      Recursos APS por Componente — JUN/2026
                      <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 400, marginLeft: 8 }}>Clique em cada linha para ver o detalhamento</span>
                    </div>
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                      {/* Header */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 120px 80px", background: "#f8fafc", padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "#6b7280", gap: 8 }}>
                        <span>Ação / Programa</span>
                        <span style={{ textAlign: "right" as const }}>Custeio</span>
                        <span style={{ textAlign: "right" as const }}>Portaria</span>
                        <span style={{ textAlign: "center" as const }}>Status</span>
                      </div>
                      {ceg.aps_componentes_jun2026?.map((row: any, i: number) => {
                        const isExpanded = expandedAps.includes(row.acao);
                        const stColor = row.status === "pago" ? "#16a34a" : row.status === "parcial" ? "#d97706" : "#dc2626";
                        const stBg = row.status === "pago" ? "#f0fdf4" : row.status === "parcial" ? "#fffbeb" : "#fef2f2";
                        const stLabel = row.status === "pago" ? "Pago" : row.status === "parcial" ? "Parcial" : "R$ 0,00";
                        return (
                          <div key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                            <div
                              onClick={() => setExpandedAps(prev => isExpanded ? prev.filter(x => x !== row.acao) : [...prev, row.acao])}
                              style={{ display: "grid", gridTemplateColumns: "1fr 140px 120px 80px", padding: "10px 12px", gap: 8, cursor: "pointer", background: isExpanded ? "#f0f9ff" : (i % 2 === 0 ? "#fff" : "#fafafa"), alignItems: "center" }}
                            >
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 10, color: "#6b7280" }}>{isExpanded ? "▼" : "▶"}</span>
                                  {row.acao}
                                </div>
                                <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{row.descricao}</div>
                                {row.alerta && <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 700, marginTop: 2 }}>⚠ {row.alerta}</div>}
                              </div>
                              <div style={{ textAlign: "right" as const, fontWeight: 700, fontSize: 13, color: row.custeio > 0 ? "#16a34a" : "#9ca3af", fontVariantNumeric: "tabular-nums" }}>
                                R$ {row.custeio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </div>
                              <div style={{ textAlign: "right" as const, fontSize: 10, color: "#6b7280" }}>{row.portaria?.split("—")[0]?.trim()}</div>
                              <div style={{ textAlign: "center" as const }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: stBg, color: stColor, border: `1px solid ${stColor}` }}>{stLabel}</span>
                              </div>
                            </div>
                            {isExpanded && (
                              <div style={{ background: "#f0f9ff", borderTop: "1px solid #bae6fd", padding: "10px 16px 10px 28px" }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: "#0369a1", marginBottom: 6 }}>Detalhamento dos sub-repasses:</div>
                                {row.detalhes?.map((d: any, j: number) => (
                                  <div key={j} style={{ padding: "6px 0", borderBottom: "1px solid #e0f2fe" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                      <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{d.item}</span>
                                        {d.alerta && <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 700, marginTop: 2 }}>⚠ {d.alerta}</div>}
                                      </div>
                                      <div style={{ flexShrink: 0, fontWeight: 700, fontSize: 13, fontVariantNumeric: "tabular-nums", color: d.status === "nao_pago" ? "#dc2626" : "#16a34a", marginLeft: 16 }}>
                                        R$ {Number(d.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        {d.status === "nao_pago" && <span style={{ fontSize: 9, marginLeft: 4, color: "#dc2626" }}>✕</span>}
                                        {d.status === "pago" && <span style={{ fontSize: 9, marginLeft: 4, color: "#16a34a" }}>✓</span>}
                                      </div>
                                    </div>
                                    {d.egestor && (
                                      <div style={{ marginTop: 6, padding: "6px 10px", background: "#fff", border: "1px solid #bae6fd", borderRadius: 6 }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "#0369a1", marginBottom: 4 }}>📋 Dados e-Gestor APS — {d.egestor.competencia_cnes} · Parcela {d.egestor.parcela}</div>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "3px 16px" }}>
                                          {d.egestor.equipes_credenciadas !== undefined && (
                                            <div style={{ fontSize: 10, color: "#374151" }}>Equipes credenciadas: <b>{d.egestor.equipes_credenciadas}</b></div>
                                          )}
                                          {d.egestor.equipes_adesao_remoto_tic !== undefined && (
                                            <div style={{ fontSize: 10, color: "#374151" }}>Adesão Remoto TIC: <b>{d.egestor.equipes_adesao_remoto_tic}</b></div>
                                          )}
                                          {d.egestor.equipes_homologadas !== undefined && (
                                            <div style={{ fontSize: 10, color: "#374151" }}>Homologadas: <b>{d.egestor.equipes_homologadas}</b></div>
                                          )}
                                          {d.egestor.equipes_pagas !== undefined && (
                                            <div style={{ fontSize: 10, color: "#374151" }}>Equipes pagas: <b>{d.egestor.equipes_pagas}</b></div>
                                          )}
                                          {d.egestor.equipes_atendimento_remoto_pagas !== undefined && (
                                            <div style={{ fontSize: 10, color: d.egestor.equipes_atendimento_remoto_pagas === 0 ? "#dc2626" : "#16a34a", fontWeight: 700 }}>
                                              Remoto pagas: {d.egestor.equipes_atendimento_remoto_pagas} {d.egestor.equipes_atendimento_remoto_pagas === 0 ? "⚠" : "✓"}
                                            </div>
                                          )}
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "3px 8px", marginTop: 4, paddingTop: 4, borderTop: "1px solid #e0f2fe" }}>
                                          {[
                                            { label: "Pagamento", val: d.egestor.pagamento },
                                            { label: "Ajuste", val: d.egestor.ajuste },
                                            { label: "Desconto", val: d.egestor.desconto },
                                            { label: "Total", val: d.egestor.total },
                                          ].map(({ label, val }) => (
                                            <div key={label} style={{ fontSize: 10, textAlign: "center" as const }}>
                                              <div style={{ color: "#6b7280" }}>{label}</div>
                                              <div style={{ fontWeight: 700, color: val === 0 ? "#9ca3af" : "#111827", fontVariantNumeric: "tabular-nums" }}>
                                                R$ {Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                <div style={{ fontSize: 10, color: "#0369a1", marginTop: 6 }}>{row.portaria}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 120px 80px", background: "#eff6ff", padding: "10px 12px", gap: 8, borderTop: "2px solid #bfdbfe" }}>
                        <span style={{ fontWeight: 700, color: "#1e40af", fontSize: 12 }}>TOTAL REPASSE APS — JUN/2026</span>
                        <span style={{ textAlign: "right" as const, fontWeight: 800, color: "#1e40af", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                          R$ {ceg.total_aps_repasse?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        <span />
                        <span style={{ textAlign: "center" as const, fontSize: 10, fontWeight: 700, color: "#d97706" }}>Parcial</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>Fonte: {ceg.fonte}</div>
                  </div>
                </div>
              );
            })()}

            {/* Inconsistências */}
            {d.inconsistencias && d.inconsistencias.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: "#fef2f2", borderBottom: "1px solid #fca5a5", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: "#b91c1c", textTransform: "uppercase" as const, letterSpacing: ".07em" }}>
                    Inconsistências Identificadas ({d.inconsistencias.length})
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {diag.criticas > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: "#dc2626", color: "#fff", padding: "2px 8px", borderRadius: 20 }}>{diag.criticas} Crítica{diag.criticas > 1 ? "s" : ""}</span>}
                    {diag.altas > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: "#d97706", color: "#fff", padding: "2px 8px", borderRadius: 20 }}>{diag.altas} Alta{diag.altas > 1 ? "s" : ""}</span>}
                    {diag.medias > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: "#2563eb", color: "#fff", padding: "2px 8px", borderRadius: 20 }}>{diag.medias} Média{diag.medias > 1 ? "s" : ""}</span>}
                  </div>
                </div>
                {d.inconsistencias.map((inc: any) => {
                  const gCor = inc.gravidade === "critica" ? "#dc2626" : inc.gravidade === "alta" ? "#d97706" : "#2563eb";
                  const gBg  = inc.gravidade === "critica" ? "#fef2f2" : inc.gravidade === "alta" ? "#fffbeb" : "#eff6ff";
                  return (
                    <div key={inc.codigo} style={{ borderBottom: "1px solid #f3f4f6", padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 10, fontWeight: 800, background: gBg, color: gCor, border: `1px solid ${gCor}`, padding: "2px 7px", borderRadius: 4, flexShrink: 0, marginTop: 2 }}>
                          {inc.codigo}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>{inc.titulo}</div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>{inc.descricao}</div>
                          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "#1d4ed8", fontWeight: 600 }}>→ {inc.acao_corretiva}</span>
                            <span style={{ fontSize: 10, background: "#dbeafe", color: "#1e40af", fontWeight: 700, padding: "1px 8px", borderRadius: 20 }}>⏰ {inc.prazo}</span>
                            <span style={{ fontSize: 10, color: "#6b7280" }}>👤 {inc.responsavel}</span>
                            {inc.impacto_financeiro > 0 && (
                              <span style={{ fontSize: 10, background: "#fef2f2", color: "#dc2626", fontWeight: 700, padding: "1px 8px", borderRadius: 20 }}>
                                💸 R$ {inc.impacto_financeiro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 10, color: "#9ca3af" }}>{inc.portaria}</div>
                        </div>
                        <div style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: gBg, color: gCor, border: `1px solid ${gCor}` }}>
                          {inc.gravidade.charAt(0).toUpperCase() + inc.gravidade.slice(1)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Checklist regulatório */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: "#f8faff", borderBottom: "1px solid #e5e7eb", padding: "10px 16px", fontWeight: 700, fontSize: 12, color: "#1d4ed8", textTransform: "uppercase" as const, letterSpacing: ".07em" }}>
                Checklist Regulatório — Port. GM/MS nº 635/2023
              </div>
              {d.checklist?.map((c: any) => {
                const cor = c.status === "ok" ? "#16a34a" : c.status === "verificar" ? "#d97706" : "#dc2626";
                const bg  = c.status === "ok" ? "#f0fdf4" : c.status === "verificar" ? "#fffbeb" : "#fef2f2";
                const ic  = c.status === "ok" ? "✓" : c.status === "verificar" ? "!" : "✕";
                return (
                  <div key={c.item} style={{ borderBottom: "1px solid #f3f4f6", padding: "12px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: bg, border: `1.5px solid ${cor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: cor, marginTop: 2 }}>
                      {ic}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{c.item}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{c.descricao}</div>
                      <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" as const }}>
                        <span style={{ fontSize: 11, color: "#1d4ed8", fontWeight: 600 }}>→ {c.acao}</span>
                        {c.prazo !== "—" && <span style={{ fontSize: 10, background: "#dbeafe", color: "#1e40af", fontWeight: 700, padding: "1px 8px", borderRadius: 20 }}>⏰ {c.prazo}</span>}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: bg, color: cor, border: `1px solid ${cor}`, marginTop: 2 }}>
                      {c.status === "ok" ? "OK" : c.status === "verificar" ? "Verificar" : "Pendente"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Previsão */}
            <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#78350f" }}>
              <strong>Previsão de regularização:</strong> {diag.previsao_regularizacao} — <strong>Próximo repasse estimado:</strong> {diag.proximo_repasse_estimado}.
              <br/>Verificar confirmação no e-Gestor APS até 15/09/2026 · Fonte: {d.fonte_dados}
            </div>
          </div>
          );
        })()}

        {aba === "emulti" && emultiLoading && (
          <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Carregando dados eMulti Remoto...</div>
        )}
        {aba === "emulti" && !emultiLoading && (emultiError || !emultiRaw) && (
          <NaoDisponivelBanner nota="Backend Railway ainda iniciando — aguarde 30 segundos e clique na aba novamente." />
        )}
      </div>
    </div>
  );
}
