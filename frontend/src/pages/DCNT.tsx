import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Heart, AlertTriangle, Activity, TrendingUp } from "lucide-react";

const BRAND  = "#dbeafe";
const ACCENT = "#2563eb";
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

const COND_COLORS = ["#2563eb","#dc2626","#d97706","#0891b2","#7c3aed","#16a34a"];

export default function DCNT() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["dcnt-dashboard"],
    queryFn: () => apiGet("/api/dcnt/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: condicoes } = useQuery({
    queryKey: ["dcnt-condicoes"],
    queryFn: () => apiGet("/api/dcnt/condicoes"),
    enabled: aba === "condicoes",
  });
  const { data: serie } = useQuery({
    queryKey: ["dcnt-serie"],
    queryFn: () => apiGet("/api/dcnt/has-dm-serie"),
    enabled: aba === "serie",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["dcnt-indicadores"],
    queryFn: () => apiGet("/api/dcnt/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Heart size={15}/> },
    { key: "condicoes",   label: "Condições",   icon: <AlertTriangle size={15}/> },
    { key: "serie",       label: "HAS / DM",    icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <Activity size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Heart size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>DCNT — Doenças Crônicas</h1>
            <p className="text-sm text-slate-500">HAS · DM · Obesidade · DPOC · ICC · DRC · FMS Apuí/AM</p>
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
              <KPI label="HAS em Tratamento"    value={dashRaw.has_em_tratamento.toLocaleString()} />
              <KPI label="DM em Tratamento"     value={dashRaw.dm_em_tratamento.toLocaleString()} />
              <KPI label="Controle HAS"         value={`${dashRaw.controle_has_pct}%`} sub="meta: 70%" color={WARN} />
              <KPI label="Controle DM"          value={`${dashRaw.controle_dm_pct}%`} sub="meta: 70%" color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Obesidade Prev."      value={`${dashRaw.obesidade_prevalencia_pct}%`} sub="adultos" color={CRIT} />
              <KPI label="Intern. Evitáveis/Mês" value={dashRaw.internacoes_evitaveis_mes.toString()} color={CRIT} />
              <KPI label="Amputações DM/Ano"   value={dashRaw.amputacoes_dm_ano.toString()} color={CRIT} />
              <KPI label="Óbitos DCNT/Ano"     value={dashRaw.obitos_dcnt_ano.toString()} color={CRIT} />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
              <b>HiperDia cadastrados: {dashRaw.hiperdia_cadastrados.toLocaleString()}</b> — controle HAS {dashRaw.controle_has_pct}% e DM {dashRaw.controle_dm_pct}% abaixo das metas. {dashRaw.amputacoes_dm_ano} amputações por DM — sinal de controle insuficiente. {dashRaw.internacoes_evitaveis_mes} internações evitáveis/mês.
            </div>
          </div>
        )}

        {aba === "condicoes" && Array.isArray(condicoes) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Diagnosticados vs Em Tratamento vs Controlados</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={condicoes} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="condicao" tick={{ fontSize: 8 }} width={250} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="diagnosticados"  name="Diagnosticados" fill={ACCENT} radius={[0,3,3,0]} />
                  <Bar dataKey="em_tratamento"   name="Em Tratamento"  fill={WARN}   radius={[0,3,3,0]} />
                  <Bar dataKey="controlados"     name="Controlados"    fill={OK}     radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(condicoes as any[]).map((c: any, i: number) => (
                <div key={c.condicao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COND_COLORS[i % COND_COLORS.length] }} />
                      <span className="font-semibold text-slate-700 text-sm">{c.condicao}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(c.status) }}>
                      Controle: {c.controle_pct}%
                    </span>
                  </div>
                  <div className="mb-2 w-full bg-slate-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${c.controle_pct}%`, background: statusColor(c.status) }} />
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                    <span>Diagn.: <b>{c.diagnosticados.toLocaleString()}</b></span>
                    <span>Trat.: <b>{c.em_tratamento.toLocaleString()}</b></span>
                    <span>Intern./ano: <b style={{ color: c.internacoes_ano > 30 ? CRIT : WARN }}>{c.internacoes_ano}</b></span>
                    <span>Óbitos: <b style={{ color: c.obitos_ano > 10 ? CRIT : WARN }}>{c.obitos_ano}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "serie" && Array.isArray(serie) && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Consultas HAS/DM e Controle Glicêmico (2026)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={serie} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="pct" orientation="right" domain={[50, 60]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="n"   dataKey="has_consultas"          name="Consultas HAS"       stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="n"   dataKey="dm_consultas"           name="Consultas DM"        stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="n"   dataKey="insulina_dispensada"    name="Insulina Disp."      stroke={WARN}   strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                  <Line yAxisId="pct" dataKey="glicemia_controlada_pct" name="Glicemia Controlada (%)" stroke={OK} strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
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
