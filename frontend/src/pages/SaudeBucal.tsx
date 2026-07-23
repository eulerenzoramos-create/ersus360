import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Smile, AlertTriangle, Users, Activity } from "lucide-react";

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

export default function SaudeBucal() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["sb-dashboard"],
    queryFn: () => apiGet("/api/saude-bucal/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: equipes } = useQuery({
    queryKey: ["sb-equipes"],
    queryFn: () => apiGet("/api/saude-bucal/equipes"),
    enabled: aba === "equipes",
  });
  const { data: ceo } = useQuery({
    queryKey: ["sb-ceo"],
    queryFn: () => apiGet("/api/saude-bucal/ceo-especialidades"),
    enabled: aba === "ceo",
  });
  const { data: historico } = useQuery({
    queryKey: ["sb-historico"],
    queryFn: () => apiGet("/api/saude-bucal/historico"),
    enabled: aba === "historico",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["sb-indicadores"],
    queryFn: () => apiGet("/api/saude-bucal/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Smile size={15}/> },
    { key: "equipes",     label: "ESB / ESF",   icon: <Users size={15}/> },
    { key: "ceo",         label: "CEO",         icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Smile size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Bucal</h1>
            <p className="text-sm text-slate-500">ESB · CEO · Procedimentos · SIA-SUS · FMS Apuí/AM</p>
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
              <KPI label="ESB Total"            value={dashRaw.esb_total.toString()} />
              <KPI label="ESB Sem CD"           value={dashRaw.esb_sem_cd.toString()} sub="sem cirurgião-dentista" color={CRIT} />
              <KPI label="1ª Consulta/Mês"     value={dashRaw.primeiras_consultas_mes.toString()} color={ACCENT} />
              <KPI label="Cob. 1ª Consulta"    value={`${dashRaw.cobertura_primeira_consulta_pct}%`} sub="meta: 50%" color={WARN} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Proc. Básicos/Mês"   value={dashRaw.proc_basicos_mes.toLocaleString()} />
              <KPI label="Extrações/Mês"       value={dashRaw.extracoes_mes.toString()} color={WARN} />
              <KPI label="Restaurações/Mês"    value={dashRaw.restauracoes_mes.toString()} color={OK} />
              <KPI label="Razão Ext/Rest"      value={`${dashRaw.ratio_extracao_restauracao}`} sub="meta: ≤0.20" color={CRIT} />
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-900">
              <b>CEO — Lista de espera total: {dashRaw.ceo_lista_espera_total} pacientes</b> em {dashRaw.ceo_especialidades} especialidades. Prótese dentária com 204 pacientes e 98 dias de espera. {dashRaw.esb_sem_cd} equipes sem cirurgião-dentista.
            </div>
          </div>
        )}

        {aba === "equipes" && Array.isArray(equipes) && (
          <div className="space-y-3">
            {(equipes as any[]).map((e: any) => (
              <div key={e.esf} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(e.status) }} />
                    <span className="font-semibold text-slate-700">{e.esf}</span>
                  </div>
                  <div className="flex gap-2">
                    {!e.cirurgiao_dentista && <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: CRIT + "22", color: CRIT }}>SEM CD</span>}
                    {e.tsb && <span className="text-xs px-2 py-0.5 rounded" style={{ background: OK + "22", color: OK }}>TSB</span>}
                  </div>
                </div>
                {e.cirurgiao_dentista ? (
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                    <span>1ª consulta: <b>{e.primeira_consulta_mes}</b></span>
                    <span style={{ color: e.procedimentos_basicos_mes < e.meta_proc_basicos ? WARN : OK }}>
                      Proc. básicos: <b>{e.procedimentos_basicos_mes}</b>
                    </span>
                    <span>Extrações: <b>{e.extracao_mes}</b></span>
                    <span style={{ color: OK }}>Restaurações: <b>{e.restauracao_mes}</b></span>
                  </div>
                ) : (
                  <p className="text-xs text-red-600 font-medium">Sem atendimento odontológico — equipe incompleta</p>
                )}
              </div>
            ))}
          </div>
        )}

        {aba === "ceo" && Array.isArray(ceo) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Procedimentos CEO vs Lista de Espera</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ceo} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="especialidade" tick={{ fontSize: 8 }} width={260} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="procedimentos_mes" name="Proc./Mês" fill={ACCENT} radius={[0,3,3,0]} />
                  <Bar dataKey="lista_espera"       name="Lista Espera" fill={CRIT}   radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(ceo as any[]).map((c: any) => (
                <div key={c.especialidade} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor(c.status) }} />
                      <span className="font-semibold text-slate-700 text-sm">{c.especialidade}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(c.status) }}>
                      {c.procedimentos_mes} proc/mês
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                    <span>Meta: <b>{c.meta_proc_mes}/mês</b></span>
                    <span style={{ color: c.lista_espera > 50 ? CRIT : WARN }}>Espera: <b>{c.lista_espera}</b></span>
                    <span style={{ color: c.tempo_espera_dias > 45 ? CRIT : WARN }}>Tempo: <b>{c.tempo_espera_dias}d</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Produção Mensal (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="proc_basicos"      name="Proc. Básicos"   stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="restauracoes"      name="Restaurações"    stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="extracoes"         name="Extrações"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="primeiras_consultas" name="1ª Consulta"   stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
