import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Wrench, AlertTriangle, Users, Activity } from "lucide-react";

const BRAND  = "#431407";
const ACCENT = "#ea580c";
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

const SETOR_COLORS = ["#dc2626","#d97706","#ea580c","#8b5cf6","#0891b2","#10b981","#6b7280"];

export default function CEREST() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["cerest-dashboard"],
    queryFn: () => apiGet("/api/cerest/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: agravos } = useQuery({
    queryKey: ["cerest-agravos"],
    queryFn: () => apiGet("/api/cerest/agravos"),
    enabled: aba === "agravos",
  });

  const { data: setores } = useQuery({
    queryKey: ["cerest-setores"],
    queryFn: () => apiGet("/api/cerest/setores"),
    enabled: aba === "setores",
  });

  const { data: historico } = useQuery({
    queryKey: ["cerest-historico"],
    queryFn: () => apiGet("/api/cerest/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["cerest-indicadores"],
    queryFn: () => apiGet("/api/cerest/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Wrench size={15}/> },
    { key: "agravos",     label: "Agravos",    icon: <AlertTriangle size={15}/> },
    { key: "setores",     label: "Setores",    icon: <Users size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Wrench size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>CEREST — Saúde do Trabalhador</h1>
            <p className="text-sm text-slate-500">Agravos Ocupacionais · CAT · Vigilância · FMS Apuí/AM</p>
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
              <KPI label="Casos Novos/Mês"      value={dashRaw.casos_novos_mes.toString()} color={ACCENT} />
              <KPI label="Em Acompanhamento"    value={dashRaw.em_acompanhamento.toString()} />
              <KPI label="CAT Emitidas/Mês"     value={dashRaw.cat_emitidas_mes.toString()} color={WARN} />
              <KPI label="Afastados INSS"       value={dashRaw.afastados_inss.toString()} color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Agravos Críticos"     value={dashRaw.agravos_criticos.toString()} color={CRIT} />
              <KPI label="Intoxicações Agrotóx."value={dashRaw.intoxicacoes_agrotoxico_mes.toString()} sub="/mês" color={CRIT} />
              <KPI label="Acidentes Graves"     value={dashRaw.acidentes_graves_mes.toString()} sub="/mês" color={WARN} />
              <KPI label="Notif. SINAN/Mês"     value={dashRaw.notificacoes_sinan_mes.toString()} />
            </div>
          </div>
        )}

        {aba === "agravos" && Array.isArray(agravos) && (
          <div className="grid gap-3">
            {(agravos as any[]).map((a: any) => (
              <div key={a.agravo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: statusColor(a.status) }} />
                    <span className="font-semibold text-slate-700">{a.agravo}</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: statusColor(a.status) }}>
                    {a.em_acompanhamento} acompanham.
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-500">
                  <span>Novos/mês: <b style={{ color: ACCENT }}>{a.casos_novos}</b></span>
                  <span>Alta/reabil.: <b style={{ color: OK }}>{a.alta_reabilitacao}</b></span>
                  <span>Afastados: <b style={{ color: a.afastados > 10 ? CRIT : WARN }}>{a.afastados}</b></span>
                  <span>CAT emitidas: <b>{a.cat_emitidas}</b></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "setores" && Array.isArray(setores) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Casos por Setor</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={setores} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="setor" tick={{ fontSize: 9 }} width={200} />
                  <Tooltip />
                  <Bar dataKey="casos_mes" name="Casos/mês" radius={[0,3,3,0]}>
                    {(setores as any[]).map((_: any, i: number) => (
                      <Cell key={i} fill={SETOR_COLORS[i % SETOR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(setores as any[]).map((s: any, i: number) => (
                <div key={s.setor} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: SETOR_COLORS[i % SETOR_COLORS.length] }} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-700">{s.setor}</p>
                    <p className="text-xs text-slate-400">Risco: {s.risco_predominante}</p>
                  </div>
                  <div className="text-xs text-right">
                    <div>Trabalhadores: <b>{s.trabalhadores.toLocaleString()}</b></div>
                    <div style={{ color: statusColor(s.status) }}>Casos/mês: <b>{s.casos_mes}</b></div>
                  </div>
                </div>
              ))}
            </div>
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
                <Line dataKey="casos_novos"         name="Casos Novos"        stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
                <Line dataKey="cat_emitidas"         name="CAT Emitidas"       stroke={WARN}   strokeWidth={2} dot={{ r: 3 }} />
                <Line dataKey="afastados"            name="Afastados INSS"     stroke={CRIT}   strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                <Line dataKey="intoxicacoes_agrotox" name="Intox. Agrotóxico"  stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
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
                      {`${ind.valor} ${ind.unidade}`}{ind.meta ? ` / meta: ${ind.meta} ${ind.unidade}` : ""}
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
