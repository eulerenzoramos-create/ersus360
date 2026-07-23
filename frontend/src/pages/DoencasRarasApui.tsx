import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { FlaskRound, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
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

export default function DoencasRarasApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["dr-dashboard"],  queryFn: () => apiGet("/api/doencas-raras-apui/dashboard"),     enabled: aba === "dashboard" });
  const { data: doencas }     = useQuery({ queryKey: ["dr-doencas"],    queryFn: () => apiGet("/api/doencas-raras-apui/doencas"),       enabled: aba === "doencas" });
  const { data: judicial }    = useQuery({ queryKey: ["dr-judicial"],   queryFn: () => apiGet("/api/doencas-raras-apui/judicializacao"),enabled: aba === "judicializacao" });
  const { data: historico }   = useQuery({ queryKey: ["dr-hist"],       queryFn: () => apiGet("/api/doencas-raras-apui/historico"),     enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["dr-ind"],        queryFn: () => apiGet("/api/doencas-raras-apui/indicadores"),   enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",      label: "Dashboard",       icon: <FlaskRound size={15}/> },
    { key: "doencas",        label: "Doenças",         icon: <Activity size={15}/> },
    { key: "judicializacao", label: "Judicialização",  icon: <AlertTriangle size={15}/> },
    { key: "historico",      label: "Histórico",       icon: <TrendingUp size={15}/> },
    { key: "indicadores",    label: "Indicadores",     icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <FlaskRound size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Doenças Raras — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Anemia falciforme · Hemofilia · Mucoviscidose · Doenças lisossomais · Judicialização · FMS Apuí/AM</p>
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
              <KPI label="Estimados no município"   value={dashRaw.doencas_raras_estimados?.toLocaleString()} color={CRIT} sub={`${dashRaw.doencas_raras_estimados_pct}% da população`} />
              <KPI label="Cadastrados no sistema"   value={`${dashRaw.doencas_raras_cadastrados}`}            color={CRIT} sub={`${dashRaw.doencas_raras_cadastrados_pct}% dos estimados`} />
              <KPI label="Tempo médio de diagnóstico" value={`${dashRaw.tempo_medio_diagnostico_anos} anos`} color={CRIT} sub="meta: 2 anos" />
              <KPI label="Processos judiciais ativos" value={`${dashRaw.processos_judiciais_ativos}`}         color={CRIT} sub={`R$ ${dashRaw.custo_medio_judicial_mes?.toLocaleString()}/mês médio`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Med. órfão disponível local" value={`${dashRaw.medicamento_orfao_disponivel_municipio_pct}%`} color={CRIT} sub="apenas 18,4%" />
              <KPI label="Doença falciforme"         value={`${dashRaw.sickle_cell_casos} casos`}             color={WARN} sub="principal DR em Apuí" />
              <KPI label="D. neurológicas raras"     value={`${dashRaw.doencas_neurologicas_raras_casos} casos`} color={CRIT} sub="EM, SLA, DMD" />
              <KPI label="Geneticista"               value={`${dashRaw.geneticista_municipio}`}               color={CRIT} sub="zero em Apuí" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Acesso a Medicamentos por Via</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Disponível no município (${dashRaw.medicamento_orfao_disponivel_municipio_pct}%)`, value: dashRaw.medicamento_orfao_disponivel_municipio_pct, max: 100, color: CRIT },
                    { label: `Via CEAF estadual (${dashRaw.medicamento_orfao_via_ceaf_pct}%)`,                   value: dashRaw.medicamento_orfao_via_ceaf_pct,             max: 100, color: WARN },
                    { label: `Via judicial (${dashRaw.medicamento_orfao_via_judicial_pct}%)`,                    value: dashRaw.medicamento_orfao_via_judicial_pct,         max: 100, color: CRIT },
                    { label: `Diagnóstico confirmado (${dashRaw.diagnostico_confirmado_pct}%)`,                  value: dashRaw.diagnostico_confirmado_pct,                 max: 100, color: CRIT },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                      </div>
                      <ProgressBar value={b.value} max={b.max} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>Odisseia diagnóstica: 7,2 anos</b> — paciente consulta média de 8,4 especialistas antes do diagnóstico. Sem geneticista em Apuí: toda suspeita = TFD para Manaus, espera 4-6 meses. Dano orgânico irreversível nesse intervalo.</p>
                <p><b>10% dos estimados cadastrados</b> — 1.482 estimados, 148 cadastrados. Sem cadastro = sem CEAF, sem protocolo, sem referência. Cada paciente sem cadastro custa mais ao sistema pela via judicial.</p>
                <p><b>38 judiciais ativos e crescendo</b> — custo municipal mensal: R$ 235.200. Tendência de dobrar em 3 anos. Solução: protocolo de diagnóstico + acesso via CEAF organizado reduz judicial em 60%.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "doencas" && Array.isArray(doencas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-2">
              <h3 className="font-semibold text-slate-700 mb-3">Casos Confirmados por Doença Rara</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={doencas as any[]} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="doenca" tick={{ fontSize: 7 }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="casos_confirmados" name="Confirmados" fill={CRIT} />
                  <Bar dataKey="casos_suspeitos"   name="Suspeitos"  fill={WARN} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(doencas as any[]).map((d: any) => (
              <div key={d.doenca} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(d.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{d.doenca}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: statusColor(d.status) }}>{d.casos_confirmados} confirmados</span>
                    <p className="text-xs text-slate-400">suspeitos: {d.casos_suspeitos} · tratamento: {d.tratamento_pct}%</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{d.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "judicializacao" && Array.isArray(judicial) && (
          <div className="grid gap-3">
            {(judicial as any[]).map((j: any) => (
              <div key={j.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(j.status) }} />
                    <p className="font-semibold text-sm text-slate-700">{j.tipo}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold" style={{ color: CRIT }}>{j.processos} processos ativos</span>
                    <p className="text-xs text-slate-400">custo mês: R$ {j.custo_mes_total?.toLocaleString()} · liber.: {j.tempo_medio_liberacao_dias}d</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{j.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Doenças Raras — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="cadastrados"       name="Cadastrados (pac.)"     stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="judiciais_ativos"  name="Judiciais ativos"       stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="tratamento_pct"    name="Em tratamento (%)"      stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="tempo_diag_anos"   name="Tempo diagnóstico (a)"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
