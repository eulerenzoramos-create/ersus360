import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import { Users, AlertTriangle, MapPin, Activity } from "lucide-react";

const BRAND  = "#1c1917";
const ACCENT = "#f97316";
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

const PIE_COLORS = ["#f97316","#ec4899","#8b5cf6","#0891b2","#6b7280"];
const COND_COLORS = ["#dc2626","#8b5cf6","#d97706","#ec4899","#0891b2","#f97316","#7c3aed"];

export default function ConsultorioRua() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["cr-dashboard"],
    queryFn: () => apiGet("/api/consultorio-rua/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: perfil } = useQuery({
    queryKey: ["cr-perfil"],
    queryFn: () => apiGet("/api/consultorio-rua/perfil-populacional"),
    enabled: aba === "perfil",
  });

  const { data: encaminhamentos } = useQuery({
    queryKey: ["cr-encaminhamentos"],
    queryFn: () => apiGet("/api/consultorio-rua/encaminhamentos"),
    enabled: aba === "encaminhamentos",
  });

  const { data: historico } = useQuery({
    queryKey: ["cr-historico"],
    queryFn: () => apiGet("/api/consultorio-rua/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["cr-indicadores"],
    queryFn: () => apiGet("/api/consultorio-rua/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",       label: "Dashboard",       icon: <Users size={15}/> },
    { key: "perfil",          label: "Perfil",           icon: <MapPin size={15}/> },
    { key: "encaminhamentos", label: "Encaminhamentos",  icon: <AlertTriangle size={15}/> },
    { key: "historico",       label: "Histórico",        icon: <Activity size={15}/> },
    { key: "indicadores",     label: "Indicadores",      icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Users size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Consultório na Rua</h1>
            <p className="text-sm text-slate-500">Pop. em Situação de Rua · Redução de Danos · FMS Apuí/AM</p>
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
              <KPI label="Pessoas Cadastradas" value={dashRaw.pessoas_cadastradas.toString()} />
              <KPI label="Atendimentos/Mês"    value={dashRaw.atendimentos_mes.toString()} color={ACCENT} />
              <KPI label="Abordagens de Rua"   value={dashRaw.abordagens_rua_mes.toString()} color={WARN} />
              <KPI label="Testagens IST/Mês"   value={dashRaw.testagens_ists_mes.toString()} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Com CNS Vinculado"   value={`${dashRaw.usuarios_com_cns_pct}%`} color={WARN} />
              <KPI label="Encaminhamentos/Mês" value={dashRaw.encaminhamentos_mes.toString()} />
              <KPI label="Reagentes IST/Mês"   value={dashRaw.reagentes_ists_mes.toString()} color={CRIT} />
              <KPI label="Redução Danos/Mês"   value={dashRaw.reducao_danos_materiais_entregues.toString()} sub="itens entregues" color={OK} />
            </div>
          </div>
        )}

        {/* Perfil */}
        {aba === "perfil" && perfil && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Por Tempo de Rua</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={(perfil as any).por_tempo_rua} dataKey="n" nameKey="tempo" cx="50%" cy="50%" outerRadius={75} label={({ pct }: any) => `${pct}%`} labelLine={false}>
                      {((perfil as any).por_tempo_rua || []).map((_: any, i: number) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {((perfil as any).por_tempo_rua || []).map((t: any, i: number) => (
                    <div key={t.tempo} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-600">{t.tempo}: <b>{t.n}</b></span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Motivações para Situação de Rua</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={(perfil as any).por_motivacao_rua} layout="vertical" margin={{ left: 5, right: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis type="category" dataKey="motivo" tick={{ fontSize: 9 }} width={170} />
                    <Tooltip />
                    <Bar dataKey="n" name="Pessoas" radius={[0,3,3,0]}>
                      {((perfil as any).por_motivacao_rua || []).map((_: any, i: number) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-3">Condições de Saúde Prevalentes</h3>
              <div className="grid gap-2">
                {((perfil as any).condicoes_saude_prevalentes || []).map((c: any, i: number) => (
                  <div key={c.condicao} className="flex items-center gap-3">
                    <span className="text-sm flex-1 text-slate-700">{c.condicao}</span>
                    <div className="w-32 bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${c.pct}%`, background: COND_COLORS[i % COND_COLORS.length] }} />
                    </div>
                    <span className="font-bold text-sm w-12 text-right" style={{ color: COND_COLORS[i % COND_COLORS.length] }}>{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Encaminhamentos */}
        {aba === "encaminhamentos" && Array.isArray(encaminhamentos) && (
          <div className="grid gap-3">
            {(encaminhamentos as any[]).map((e: any) => (
              <div key={e.servico} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700 text-sm">{e.servico}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span>Encaminh.: <b>{e.encaminhamentos_mes}</b></span>
                    <span style={{ color: e.aceitos === e.encaminhamentos_mes ? OK : WARN }}>Aceitos: <b>{e.aceitos}</b></span>
                    {e.em_espera > 0 && <span style={{ color: CRIT }}>Espera: <b>{e.em_espera}</b></span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Tempo médio de espera:</span>
                  <span className="font-bold" style={{ color: e.tempo_medio_espera_dias > 14 ? CRIT : e.tempo_medio_espera_dias > 7 ? WARN : OK }}>
                    {e.tempo_medio_espera_dias === 0 ? "Imediato" : `${e.tempo_medio_espera_dias} dias`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Histórico */}
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
                <Line dataKey="atendimentos"   name="Atendimentos"   stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
                <Line dataKey="abordagens"     name="Abordagens"     stroke={WARN}   strokeWidth={2} dot={{ r: 3 }} />
                <Line dataKey="encaminhamentos" name="Encaminhamentos" stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
              </LineChart>
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
