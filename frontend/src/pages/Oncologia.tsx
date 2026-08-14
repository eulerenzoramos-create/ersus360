import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Search, AlertTriangle, Users, Activity } from "lucide-react";

const BRAND  = "#450a0a";
const ACCENT = "#dc2626";
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

const TIPO_COLORS = ["#7c3aed","#db2777","#0891b2","#1d4ed8","#d97706","#16a34a"];

export default function Oncologia() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["onc-dashboard"],
    queryFn: () => apiGet("/api/oncologia/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: tipos } = useQuery({
    queryKey: ["onc-tipos"],
    queryFn: () => apiGet("/api/oncologia/tipos-cancer"),
    enabled: aba === "tipos",
  });
  const { data: rastreio } = useQuery({
    queryKey: ["onc-rastreio"],
    queryFn: () => apiGet("/api/oncologia/rastreio"),
    enabled: aba === "rastreio",
  });
  const { data: historico } = useQuery({
    queryKey: ["onc-historico"],
    queryFn: () => apiGet("/api/oncologia/historico"),
    enabled: aba === "historico",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["onc-indicadores"],
    queryFn: () => apiGet("/api/oncologia/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Search size={15}/> },
    { key: "tipos",       label: "Tipos",       icon: <Users size={15}/> },
    { key: "rastreio",    label: "Rastreio",    icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Search size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Oncologia</h1>
            <p className="text-sm text-slate-500">Rastreamento · Diagnóstico Precoce · RCBP · FMS Apuí/AM</p>
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
              <KPI label="Novos Casos/Ano"       value={dashRaw.novos_casos_ano.toString()} color={CRIT} />
              <KPI label="Óbitos/Ano"            value={dashRaw.obitos_ano.toString()} color={CRIT} />
              <KPI label="Estádio Avançado"      value={`${dashRaw.estadio_avancado_pct}%`} sub="diagnosticados em III/IV" color={CRIT} />
              <KPI label="Tratam. Oportuno"      value={`${dashRaw.tratamento_oportuno_lei_pct}%`} sub="≤60 dias — Lei 12.732" color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Papanicolau Cobertura" value={`${dashRaw.cobertura_papanicolau_pct}%`} sub="meta: 80%" color={CRIT} />
              <KPI label="Mamografia Cobertura"  value={`${dashRaw.cobertura_mamografia_pct}%`} sub="meta: 70%" color={CRIT} />
              <KPI label="Rastreio Colorretal"   value={`${dashRaw.rastreio_colorretal_pct}%`} sub="meta: 40%" color={CRIT} />
              <KPI label="Referência Manaus"     value={`${dashRaw.referencia_manaus_dias}d`} sub="acesso quimio/radio" color={WARN} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>Diagnóstico tardio:</b> {dashRaw.estadio_avancado_pct}% em estádio avançado — resultado direto do rastreamento abaixo da meta. Sem quimioterapia local — referência para Manaus em {dashRaw.referencia_manaus_dias} dias. {dashRaw.obitos_ano} óbitos — maioria evitáveis.
            </div>
          </div>
        )}

        {aba === "tipos" && Array.isArray(tipos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Novos Casos por Tipo (2026)</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={tipos} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="tipo" tick={{ fontSize: 9 }} width={200} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="casos_ano"  name="Casos"   radius={[0,3,3,0]}>
                    {(tipos as any[]).map((_: any, i: number) => <Cell key={i} fill={TIPO_COLORS[i % TIPO_COLORS.length]} />)}
                  </Bar>
                  <Bar dataKey="obitos_ano" name="Óbitos"  fill={CRIT} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(tipos as any[]).map((t: any, i: number) => (
                <div key={t.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: TIPO_COLORS[i % TIPO_COLORS.length] }} />
                      <span className="font-semibold text-slate-700 text-sm">{t.tipo}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(t.status) }}>
                      {t.casos_ano} casos · {t.obitos_ano} óbitos
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                    <span style={{ color: t.estadio_avancado_pct > 50 ? CRIT : WARN }}>Estádio av.: <b>{t.estadio_avancado_pct}%</b></span>
                    <span style={{ color: t.tratamento_oportuno_pct < 80 ? CRIT : OK }}>Trat. oportuno: <b>{t.tratamento_oportuno_pct}%</b></span>
                    {t.rastreio_realizado_pct && <span style={{ color: t.rastreio_realizado_pct < 60 ? CRIT : WARN }}>Rastreio: <b>{t.rastreio_realizado_pct}%</b></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "rastreio" && Array.isArray(rastreio) && (
          <div className="space-y-3">
            {(rastreio as any[]).map((r: any, i: number) => (
              <div key={r.exame} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: TIPO_COLORS[i % TIPO_COLORS.length] }} />
                    <div>
                      <span className="font-semibold text-slate-700">{r.exame}</span>
                      <span className="ml-2 text-xs text-slate-400">{r.publico_alvo}</span>
                    </div>
                  </div>
                  {r.cobertura_pct && (
                    <span className="font-bold text-sm" style={{ color: r.cobertura_pct < 50 ? CRIT : WARN }}>
                      {r.cobertura_pct}% cobertura
                    </span>
                  )}
                </div>
                {r.meta_ano && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Realizados: {r.realizados_ano?.toLocaleString()}</span>
                      <span>Meta: {r.meta_ano?.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{
                        width: `${Math.min((r.realizados_ano / r.meta_ano) * 100, 100)}%`,
                        background: TIPO_COLORS[i % TIPO_COLORS.length],
                      }} />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                  <span>Realizados: <b>{r.realizados_ano?.toLocaleString()}</b></span>
                  {r.alterados_pct && <span style={{ color: WARN }}>Alterados: <b>{r.alterados_pct}%</b></span>}
                  {r.positivos_pct && <span style={{ color: WARN }}>Positivos: <b>{r.positivos_pct}%</b></span>}
                  {r.bi_rads_4_5_pct && <span style={{ color: CRIT }}>BI-RADS 4/5: <b>{r.bi_rads_4_5_pct}%</b></span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="novos_casos"        name="Casos Novos"       stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="papanicolau"        name="Papanicolau"       stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="mamografia"         name="Mamografia"        stroke="#db2777" strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="obitos"             name="Óbitos"            stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
                      {`${ind.valor} ${ind.unidade}`}{ind.meta != null ? ` / meta: ${ind.meta} ${ind.unidade}` : ""}
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
