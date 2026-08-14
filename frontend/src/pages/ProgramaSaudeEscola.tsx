import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { School, AlertTriangle, Activity, Users } from "lucide-react";

const BRAND  = "#14532d";
const ACCENT = "#16a34a";
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
  <div className="w-full bg-slate-100 rounded-full h-2">
    <div className="h-2 rounded-full" style={{ width: `${Math.min(value / max * 100, 100)}%`, background: color }} />
  </div>
);

export default function ProgramaSaudeEscola() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }      = useQuery({ queryKey: ["pse-dashboard"], queryFn: () => apiGet("/api/programa-saude-escola/dashboard"), enabled: aba === "dashboard" });
  const { data: escolas }   = useQuery({ queryKey: ["pse-escolas"],   queryFn: () => apiGet("/api/programa-saude-escola/escolas"),   enabled: aba === "escolas" });
  const { data: acoes }     = useQuery({ queryKey: ["pse-acoes"],     queryFn: () => apiGet("/api/programa-saude-escola/acoes"),     enabled: aba === "acoes" });
  const { data: historico } = useQuery({ queryKey: ["pse-historico"], queryFn: () => apiGet("/api/programa-saude-escola/historico"), enabled: aba === "historico" });
  const { data: indicadores }= useQuery({ queryKey: ["pse-ind"],     queryFn: () => apiGet("/api/programa-saude-escola/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <School size={15}/> },
    { key: "escolas",     label: "Escolas",    icon: <School size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <Activity size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <School size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Programa Saúde na Escola (PSE)</h1>
            <p className="text-sm text-slate-500">22 Escolas · 3.512 Alunos · 3 Componentes · 8 Equipes · FMS Apuí/AM</p>
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
              <KPI label="Escolas no PSE"         value={`${dashRaw.escolas_pse_vinculadas}/${dashRaw.escolas_municipais_total}`} color={ACCENT} sub={`${dashRaw.escolas_pse_pct}% vinculadas`} />
              <KPI label="Alunos Cobertos"         value={dashRaw.alunos_pse_cobertos?.toLocaleString()} color={ACCENT} sub={`${dashRaw.alunos_pse_pct}% do total`} />
              <KPI label="Equipes Vinculadas"      value={dashRaw.equipes_saude_vinculadas.toString()} />
              <KPI label="Ações Realizadas (2025)" value={`${dashRaw.acoes_realizadas_ano}/${dashRaw.acoes_meta_ano}`} color={WARN} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Componente 1 — Avaliação Saúde", pct: dashRaw.componente1_pct },
                { label: "Componente 2 — Promoção Saúde",  pct: dashRaw.componente2_pct },
                { label: "Componente 3 — Educ. Permanente",pct: dashRaw.componente3_pct },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <p className="text-xs text-slate-500 mb-1">{c.label}</p>
                  <p className="text-xl font-bold mb-2" style={{ color: statusColor(c.pct >= 75 ? "ok" : c.pct >= 60 ? "atencao" : "critico") }}>{c.pct}%</p>
                  <ProgressBar value={c.pct} max={100} color={statusColor(c.pct >= 75 ? "ok" : c.pct >= 60 ? "atencao" : "critico")} />
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "escolas" && Array.isArray(escolas) && (
          <div className="grid gap-3">
            {(escolas as any[]).map((esc: any) => (
              <div key={esc.escola} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-700 text-sm">{esc.escola}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: esc.zona === "urbana" ? "#eff6ff" : "#f0fdf4", color: esc.zona === "urbana" ? ACCENT : OK }}>{esc.zona}</span>
                    {!esc.pse && <span className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-600">Sem PSE</span>}
                  </div>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>Alunos: <b>{esc.alunos}</b></span>
                    <span>Equipe: <b>{esc.equipe || "—"}</b></span>
                    <span>Ações 2025: <b>{esc.acoes_2025}</b></span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded ml-4"
                  style={{ background: statusColor(esc.status) + "22", color: statusColor(esc.status) }}>
                  {esc.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}

        {aba === "acoes" && Array.isArray(acoes) && (
          <div className="space-y-6">
            {(acoes as any[]).map((comp: any) => (
              <div key={comp.componente} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-4">{comp.componente}</h3>
                <div className="space-y-3">
                  {comp.acoes.map((a: any) => (
                    <div key={a.acao}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600">{a.acao}</span>
                        <span className="font-bold text-sm" style={{ color: statusColor(a.status) }}>{a.pct?.toFixed(0)}%</span>
                      </div>
                      <ProgressBar value={a.pct} max={100} color={statusColor(a.status)} />
                      <p className="text-xs text-slate-400 mt-0.5">{a.realizadas} / {a.meta} {a.meta <= 50 ? "escolas" : "alunos"}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução PSE — 2022–2025</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="n"   orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="pct" dataKey="comp1_pct"      name="Componente 1 %"  stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="comp2_pct"      name="Componente 2 %"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="comp3_pct"      name="Componente 3 %"  stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="alunos_cobertos" name="Alunos Cobertos" stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
