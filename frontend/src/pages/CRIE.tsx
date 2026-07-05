import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Syringe, AlertTriangle, Users, Activity } from "lucide-react";

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

const PIE_COLORS = ["#1d4ed8","#dc2626","#16a34a","#d97706","#7c3aed","#0891b2","#f59e0b","#ec4899","#94a3b8"];

export default function CRIE() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["crie-dashboard"],
    queryFn: () => apiGet("/api/crie/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: imunobiologicos } = useQuery({
    queryKey: ["crie-imunobiologicos"],
    queryFn: () => apiGet("/api/crie/imunobiologicos"),
    enabled: aba === "imunobiologicos",
  });

  const { data: pacientes } = useQuery({
    queryKey: ["crie-pacientes"],
    queryFn: () => apiGet("/api/crie/pacientes"),
    enabled: aba === "pacientes",
  });

  const { data: historico } = useQuery({
    queryKey: ["crie-historico"],
    queryFn: () => apiGet("/api/crie/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["crie-indicadores"],
    queryFn: () => apiGet("/api/crie/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",       label: "Dashboard",        icon: <Syringe size={15}/> },
    { key: "imunobiologicos", label: "Imunobiológicos",  icon: <AlertTriangle size={15}/> },
    { key: "pacientes",       label: "Pacientes",        icon: <Users size={15}/> },
    { key: "historico",       label: "Histórico",        icon: <Activity size={15}/> },
    { key: "indicadores",     label: "Indicadores",      icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Syringe size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>CRIE</h1>
            <p className="text-sm text-slate-500">Centro de Referência para Imunobiológicos Especiais · FMS Apuí/AM</p>
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

        {/* Dashboard */}
        {aba === "dashboard" && dashRaw && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Pacientes CRIE" value={dashRaw.pacientes_cadastrados_crie.toString()} />
              <KPI label="Doses/Mês"      value={dashRaw.doses_administradas_mes.toString()} />
              <KPI label="Solicit. Pend." value={dashRaw.solicitacoes_pendentes.toString()} color={WARN} />
              <KPI label="Imunobiol. em Falta" value={dashRaw.imunobiologicos_em_falta.toString()} color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Aprob./Mês"     value={dashRaw.solicitacoes_aprovadas_mes.toString()} color={OK} />
              <KPI label="Cadeia Fria"    value={`${dashRaw.temperatura_ok_pct}%`} color={dashRaw.temperatura_ok_pct < 100 ? WARN : OK} />
              <KPI label="Encaminh. Manaus/Mês" value={dashRaw.encaminhamentos_para_manaus.toString()} color={WARN} />
              <KPI label="Estoque Total (doses)" value={dashRaw.estoque_doses_total.toString()} />
            </div>
            {dashRaw.imunobiologicos_em_falta > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle size={18} color={CRIT} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">{dashRaw.imunobiologicos_em_falta} imunobiológico(s) sem estoque</p>
                  <p className="text-sm text-red-700 mt-1">Vacina Varicela (dose extra adulto) e Influenza (dose dupla) — pedido emergência enviado à Sesa/AM.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Imunobiológicos */}
        {aba === "imunobiologicos" && Array.isArray(imunobiologicos) && (
          <div className="grid gap-3">
            {(imunobiologicos as any[]).map((im: any) => (
              <div key={im.imunobiologico} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
                style={{ borderLeft: `4px solid ${statusColor(im.status)}` }}>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-700 text-sm">{im.imunobiologico}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: statusColor(im.status) + "22", color: statusColor(im.status) }}>
                        {im.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{im.indicacao}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold" style={{ color: im.estoque_doses === 0 ? CRIT : im.estoque_doses <= im.estoque_minimo ? WARN : OK }}>
                      {im.estoque_doses}
                    </p>
                    <p className="text-xs text-slate-400">doses (mín. {im.estoque_minimo})</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                  <span>Validade: <b>{im.validade}</b></span>
                  <span>Temp. OK: <b style={{ color: im.temperatura_ok ? OK : CRIT }}>{im.temperatura_ok ? "Sim" : "NÃO"}</b></span>
                  <span>Solicit./mês: <b>{im.solicitacoes_mes}</b></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pacientes */}
        {aba === "pacientes" && pacientes && (
          <div className="space-y-4">
            <KPI label="Total Cadastrados" value={(pacientes as any).total_cadastrados?.toString() ?? ""} />
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Distribuição por Indicação</h3>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie data={(pacientes as any).por_indicacao} dataKey="n" nameKey="indicacao" cx="50%" cy="50%" outerRadius={90} label={({ pct }: any) => `${pct}%`} labelLine={false}>
                      {((pacientes as any).por_indicacao || []).map((_: any, i: number) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 grid gap-2">
                  {((pacientes as any).por_indicacao || []).map((p: any, i: number) => (
                    <div key={p.indicacao} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-600 flex-1">{p.indicacao}</span>
                      <span className="font-bold" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>{p.n}</span>
                      <span className="text-slate-400 text-xs">{p.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Histórico */}
        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Doses Administradas e Solicitações (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="doses"         name="Doses Adm."      fill={ACCENT} radius={[3,3,0,0]} />
                <Bar dataKey="aprovadas"     name="Solicit. Aprov."  fill={OK}     radius={[3,3,0,0]} />
                <Bar dataKey="encaminhamentos_manaus" name="Encaminhados Manaus" fill={WARN} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Indicadores */}
        {aba === "indicadores" && Array.isArray(indicadores) && (
          <div className="grid gap-3">
            {(indicadores as any[]).map((ind: any) => (
              <div key={ind.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(ind.status) }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-sm">{ind.indicador}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(ind.status) }}>
                      {`${ind.valor} ${ind.unidade}`} {ind.meta ? `/ meta: ${ind.meta} ${ind.unidade}` : ""}
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
