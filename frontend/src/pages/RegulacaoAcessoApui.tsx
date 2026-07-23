import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Clipboard, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#dbeafe";
const ACCENT = "#1d4ed8";
const OK     = "#16a34a";
const WARN   = "#d97706";
const CRIT   = "#dc2626";

function statusColor(s: string) {
  if (s === "critico") return CRIT;
  if (s === "atencao") return WARN;
  return OK;
}

const KPI = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold mt-1" style={{ color: color || BRAND }}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

export default function RegulacaoAcessoApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["ra-dash"],  queryFn: () => apiGet("/api/regulacao-acesso-apui/dashboard"),        enabled: aba === "dashboard" });
  const { data: espec }       = useQuery({ queryKey: ["ra-esp"],   queryFn: () => apiGet("/api/regulacao-acesso-apui/especialidades"),    enabled: aba === "especialidades" });
  const { data: exames }      = useQuery({ queryKey: ["ra-exam"],  queryFn: () => apiGet("/api/regulacao-acesso-apui/exames-mac"),        enabled: aba === "exames" });
  const { data: historico }   = useQuery({ queryKey: ["ra-hist"],  queryFn: () => apiGet("/api/regulacao-acesso-apui/historico"),         enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["ra-ind"],   queryFn: () => apiGet("/api/regulacao-acesso-apui/indicadores"),       enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",      label: "Dashboard",      icon: <Clipboard size={15}/> },
    { key: "especialidades", label: "Especialidades", icon: <Activity size={15}/> },
    { key: "exames",         label: "Exames MAC",     icon: <AlertTriangle size={15}/> },
    { key: "historico",      label: "Histórico",      icon: <TrendingUp size={15}/> },
    { key: "indicadores",    label: "Indicadores",    icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Clipboard size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Regulação e Acesso às Especialidades — Apuí/AM</h1>
            <p className="text-sm text-slate-500">SISREG · Fila de Espera · TFD · Especialidades · Exames MAC · Contrarreferência · FMS Apuí/AM</p>
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

        {aba === "dashboard" && dashRaw && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Fila de espera ativa"              value={`${dashRaw.fila_total_ativa.toLocaleString()} pacientes`} color={CRIT} sub={`consultas: ${dashRaw.fila_consultas_espec} · exames MAC: ${dashRaw.fila_exames_mac} · cirurgias: ${dashRaw.fila_cirurgias_eletivas}`} />
              <KPI label="Tempo médio de espera (meta: 60d)" value={`${dashRaw.tempo_medio_espera_dias} dias`}                color={CRIT} sub={`neurologia: 312d · ortopedia: 284d · urologia: 224d`} />
              <KPI label="Pacientes >180 dias em fila"       value={`${dashRaw.pendentes_mais_180dias}`}                      color={CRIT} sub="Risco de agravamento clínico + judicialização SUS" />
              <KPI label="Referências a Manaus/mês"          value={`${dashRaw.referencias_manaus_mes}`}                      color={WARN} sub="600 km · TFD ou lancha/avião particular · custo R$ 1.200–8.400" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Solicitações reguladas/mês"        value={`${dashRaw.reguladas_pct}%`}                              color={WARN} sub={`${dashRaw.reguladas_mes} de ${dashRaw.solicitacoes_mes} solicitações · ${dashRaw.negadas_mes} negadas`} />
              <KPI label="Contrarreferência com retorno"     value={`${dashRaw.contrarreferencias_retorno_pct}%`}             color={CRIT} sub="61,6% sem contrarreferência — perda de continuidade do cuidado na APS" />
              <KPI label="SISREG implantado"                 value="Parcial"                                                  color={WARN} sub="Módulo ambulatorial ativo · módulo de exames com subutilização" />
              <KPI label="Tele-especialidade — solução"      value="R$ 0"                                                     color={OK}   sub="TELESSAÚDE-AM: dermatologia, neurologia, psiquiatria em teleconsultoria" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Fila de Espera — Crescimento 2025</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Ortopedia (meta: < 60d)",  val: 284, meta: 60,  cor: CRIT },
                    { label: "Neurologia (meta: < 60d)", val: 312, meta: 60,  cor: CRIT },
                    { label: "Dermatologia",             val: 248, meta: 60,  cor: CRIT },
                    { label: "Cardiologia",              val: 184, meta: 60,  cor: CRIT },
                    { label: "Oftalmologia",             val: 168, meta: 60,  cor: CRIT },
                    { label: "Psiquiatria",              val: 124, meta: 60,  cor: CRIT },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className="text-slate-600 w-44 text-xs">{f.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${Math.min((f.val / 350) * 100, 100)}%`, background: f.cor }} />
                      </div>
                      <span className="font-bold text-xs" style={{ color: f.cor }}>{f.val}d</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>1.284 pacientes na fila</b> — crescimento +136 em 6 meses (+11,8%). Neurologia: 312 dias (meta 60d). Psiquiatria: 124 dias, 2 visitas/mês de psiquiatra de Manaus. TELESSAÚDE-AM: telepsiquiatria gratuita, reduz demanda presencial -40%. Dermatologia: 248 dias — tele-dermatologia via foto (WhatsApp seguro + TELESSAÚDE): R$ 0, resolve 60% dos casos sem deslocamento.</p>
                <p><b>184 pacientes &gt;180 dias em fila</b>. Judicialização SUS: cada ação judicial custa R$ 4.200 + resolve o caso de 1 sem resolver os 1.283. Oferta articulada com consórcio regional (Humaitá, Manicoré, Novo Aripuanã): mutirão trimestral. Ortopedia: 148 em fila × R$ 1.200 deslocamento = R$ 177.600/ano apenas em TFD.</p>
                <p><b>Contrarreferência: 38,4% retornam para APS</b> (meta 80%). 61,6% sem contrarreferência = médico da UBS sem informação sobre especialista = duplicação de pedidos + perda de continuidade. Formulário de contrarreferência: R$ 0. Ligação ativa do regulador para especialista: protocolo municipal em 30 dias.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "especialidades" && Array.isArray(espec) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={espec as any[]} margin={{ top: 5, right: 20, bottom: 80, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="especialidade" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="fila"           name="Fila ativa" radius={[4,4,0,0]}>
                  {(espec as any[]).map((e: any, i: number) => <Cell key={i} fill={statusColor(e.status)} />)}
                </Bar>
                <Bar dataKey="cotas_mes"      name="Cotas/mês"  radius={[4,4,0,0]} fill={OK} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(espec as any[]).map((e: any) => (
                <div key={e.especialidade} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: statusColor(e.status) }} />
                      <span className="font-semibold text-slate-700 text-sm">{e.especialidade}</span>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(e.status) }}>{e.fila} em fila · {e.espera_media_dias}d espera</span>
                      <p className="text-slate-400">{e.cotas_mes} cotas/mês · {e.oferta}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "exames" && Array.isArray(exames) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={exames as any[]} margin={{ top: 5, right: 20, bottom: 80, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="exame" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="fila" name="Fila ativa" radius={[4,4,0,0]}>
                  {(exames as any[]).map((e: any, i: number) => <Cell key={i} fill={statusColor(e.status)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(exames as any[]).map((e: any) => (
                <div key={e.exame} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(e.status) }} />
                    <span className="text-sm font-semibold text-slate-700">{e.exame}</span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-bold" style={{ color: statusColor(e.status) }}>{e.fila} em fila · {e.espera_dias}d</span>
                    <p className="text-slate-400">{e.cotas_mes} cotas/mês</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução da Fila de Regulação — Apuí/AM (Jan–Jun 2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="fila_total"      name="Fila total"         stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="referencias_manaus" name="Ref. Manaus/mês" stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="reguladas_pct"   name="Reguladas (%)"      stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="left"  dataKey="solicitacoes"    name="Solicitações/mês"    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
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
      </div>
    </div>
  );
}
