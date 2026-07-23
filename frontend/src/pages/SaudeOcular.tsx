import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Eye, AlertTriangle, Users, Activity } from "lucide-react";

const BRAND  = "#1c1917";
const ACCENT = "#78716c";
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

const COND_COLORS = ["#2563eb","#d97706","#7c3aed","#dc2626","#0891b2","#16a34a"];

export default function SaudeOcular() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["oc-dashboard"],
    queryFn: () => apiGet("/api/saude-ocular/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: condicoes } = useQuery({
    queryKey: ["oc-condicoes"],
    queryFn: () => apiGet("/api/saude-ocular/condicoes"),
    enabled: aba === "condicoes",
  });
  const { data: oculos } = useQuery({
    queryKey: ["oc-oculos"],
    queryFn: () => apiGet("/api/saude-ocular/oculos-dispensados"),
    enabled: aba === "oculos",
  });
  const { data: historico } = useQuery({
    queryKey: ["oc-historico"],
    queryFn: () => apiGet("/api/saude-ocular/historico"),
    enabled: aba === "historico",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["oc-indicadores"],
    queryFn: () => apiGet("/api/saude-ocular/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Eye size={15}/> },
    { key: "condicoes",   label: "Condições",   icon: <AlertTriangle size={15}/> },
    { key: "oculos",      label: "Óculos",      icon: <Users size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Eye size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Saúde Ocular</h1>
            <p className="text-sm text-slate-500">Catarata · Glaucoma · Retinopatia · Óculos · FMS Apuí/AM</p>
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
              <KPI label="Consultas Oftalmo/Mês" value={dashRaw.consultas_oftalmo_mes.toString()} color={ACCENT} />
              <KPI label="Cirurgias/Mês"          value={dashRaw.cirurgias_mes.toString()} color={ACCENT} />
              <KPI label="Espera Catarata"        value={dashRaw.lista_espera_catarata.toString()} sub={`${dashRaw.tempo_espera_catarata_dias}d de espera`} color={CRIT} />
              <KPI label="Rastreio Retinopatia"   value={`${dashRaw.rastreio_retinopatia_pct}%`} sub="meta: 80%" color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Catarata/Ano"           value={dashRaw.cirurgias_catarata_ano.toString()} sub="meta: 60 cirurgias" color={WARN} />
              <KPI label="Óculos Dispensados"     value={dashRaw.oculos_dispensados_ano.toString()} sub="/ano" color={OK} />
              <KPI label="Oftalmologistas"        value={dashRaw.oftalmologistas.toString()} sub={dashRaw.atendimento_oftalmo} color={WARN} />
              <KPI label="Condições Monitoradas"  value={dashRaw.condicoes_monitoradas.toString()} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>Cegueira evitável:</b> {dashRaw.lista_espera_catarata} pacientes aguardando cirurgia de catarata ({dashRaw.tempo_espera_catarata_dias} dias). Apenas {dashRaw.rastreio_retinopatia_pct}% dos diabéticos rastreados para retinopatia — meta 80%. {dashRaw.atendimento_oftalmo}.
            </div>
          </div>
        )}

        {aba === "condicoes" && Array.isArray(condicoes) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Casos por Condição Ocular (2026)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={condicoes} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="condicao" tick={{ fontSize: 8 }} width={290} />
                  <Tooltip />
                  <Bar dataKey="casos_ano" name="Casos" radius={[0,3,3,0]}>
                    {(condicoes as any[]).map((_: any, i: number) => (
                      <Cell key={i} fill={COND_COLORS[i % COND_COLORS.length]} />
                    ))}
                  </Bar>
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
                      {c.casos_ano} casos
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                    {c.cirurgia && <span style={{ color: c.lista_espera_cirurgia > 50 ? CRIT : WARN }}>Espera cirurg.: <b>{c.lista_espera_cirurgia}</b></span>}
                    {c.cirurgia && <span style={{ color: c.tempo_espera_dias > 60 ? CRIT : WARN }}>Tempo: <b>{c.tempo_espera_dias}d</b></span>}
                    {c.rastreados_pct && <span style={{ color: c.rastreados_pct < 60 ? CRIT : WARN }}>Rastreado: <b>{c.rastreados_pct}%</b></span>}
                    {c.oculos_dispensados && <span style={{ color: OK }}>Óculos disp.: <b>{c.oculos_dispensados}</b></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "oculos" && Array.isArray(oculos) && (
          <div className="space-y-3">
            {(oculos as any[]).map((o: any) => (
              <div key={o.programa} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(o.status) }} />
                    <span className="font-semibold text-slate-700">{o.programa}</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: OK }}>{o.oculos_dispensados} óculos/ano</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                  <span>Triagens: <b>{o.triagens_realizadas}</b></span>
                  <span>Beneficiários: <b>{o.beneficiarios_ano}</b></span>
                  <span>Encaminhados: <b>{o.encaminhados_spec}</b></span>
                  <span>Dispensados: <b>{o.oculos_dispensados}</b></span>
                </div>
                <div className="mt-2 w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${(o.oculos_dispensados / o.triagens_realizadas) * 100}%`, background: OK }} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"    tick={{ fontSize: 11 }} />
                <YAxis yAxisId="esp"  orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="consultas_oftalmo"      name="Consultas"       stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="oculos_dispensados"     name="Óculos Disp."    stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="cirurgias"              name="Cirurgias"        stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="esp" dataKey="lista_espera_catarata"  name="Espera Catarata" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
