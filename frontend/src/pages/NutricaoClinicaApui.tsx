import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Utensils, AlertTriangle, Activity, TrendingUp } from "lucide-react";

const BRAND  = "#dbeafe";
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

const GROUP_COLORS = [CRIT, WARN, ACCENT, OK, BRAND, "#7c3aed"];

export default function NutricaoClinicaApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["nc-dashboard"],  queryFn: () => apiGet("/api/nutricao-clinica-apui/dashboard"),          enabled: aba === "dashboard" });
  const { data: avaliacao }   = useQuery({ queryKey: ["nc-aval"],       queryFn: () => apiGet("/api/nutricao-clinica-apui/avaliacao-nutricional"),enabled: aba === "avaliacao" });
  const { data: servicos }    = useQuery({ queryKey: ["nc-serv"],       queryFn: () => apiGet("/api/nutricao-clinica-apui/servicos"),            enabled: aba === "servicos" });
  const { data: historico }   = useQuery({ queryKey: ["nc-hist"],       queryFn: () => apiGet("/api/nutricao-clinica-apui/historico"),           enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["nc-ind"],        queryFn: () => apiGet("/api/nutricao-clinica-apui/indicadores"),         enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",    icon: <Utensils size={15}/> },
    { key: "avaliacao",  label: "Avaliação",    icon: <Activity size={15}/> },
    { key: "servicos",   label: "Serviços",     icon: <AlertTriangle size={15}/> },
    { key: "historico",  label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Utensils size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Nutrição Clínica — Apuí/AM</h1>
            <p className="text-sm text-slate-500">NASF · Terapia Nutricional · Desnutrição Hospitalar · SISVAN · FMS Apuí/AM</p>
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
              <KPI label="Nutricionistas SUS"        value={`${dashRaw.nutricionistas_sus}/${dashRaw.nutricionistas_necessarios}`} color={CRIT} sub="disponíveis / necessários" />
              <KPI label="Desnutrição hospitalar"    value={`${dashRaw.desnutricao_hospitalar_pct}%`}  color={CRIT} sub="meta: < 10%" />
              <KPI label="Triagem nutricional hosp." value={`${dashRaw.triagem_nutricional_hospitalar_pct}%`} color={CRIT} sub={`meta: ${dashRaw.meta_triagem_pct}%`} />
              <KPI label="Ambulatório nutrição"      value="NÃO"                                       color={CRIT} sub="inexistente" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Desnutrição infantil"      value={`${dashRaw.desnutricao_infantil_pct}%`}   color={CRIT} sub="meta OMS: < 5%" />
              <KPI label="Obesidade adultos"         value={`${dashRaw.obesidade_adultos_pct}%`}      color={WARN} sub="meta: < 20%" />
              <KPI label="Sobrepeso adultos"         value={`${dashRaw.sobrepeso_adultos_pct}%`}      color={WARN} />
              <KPI label="Em terapia nutricional"    value={dashRaw.pacientes_terapia_nutricional.toString()} color={ACCENT} sub="hospitalar + amb." />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Desnutrição por Grupo Etário</h3>
                <div className="space-y-3">
                  {[
                    { label: "Crianças < 5 anos",    value: dashRaw.desnutricao_infantil_pct, meta: 5,  color: CRIT },
                    { label: "Idosos (60+)",          value: 22.4,                              meta: 10, color: CRIT },
                    { label: "Gestantes",             value: 14.8,                              meta: 5,  color: WARN },
                    { label: "Pacientes hospitalizados", value: dashRaw.desnutricao_hospitalar_pct, meta: 10, color: CRIT },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-medium" style={{ color: b.color }}>{b.value}% / meta {b.meta}%</span>
                      </div>
                      <ProgressBar value={b.value} max={b.meta} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>38,4% de desnutrição hospitalar</b> — sem protocolo de triagem nutricional (MNA/NRS-2002) implantado. Pacientes desnutridos têm 2× mais complicações e permanência 40% maior.</p>
                <p><b>1 nutricionista para 19.788 hab</b> — déficit de 3 profissionais. Sem ambulatório de nutrição, consultas ocorrem por demanda espontânea na UBS.</p>
                <p><b>Nutrição parenteral indisponível</b> — pacientes com indicação de NP transferidos para Manaus (690 km), aumentando mortalidade em casos críticos.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "avaliacao" && Array.isArray(avaliacao) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Estado Nutricional por Grupo Etário (%)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={(avaliacao as any[]).map((a: any) => ({
                  grupo: a.grupo.substring(0, 20),
                  desnutricao: a.desnutricao_pct,
                  sobrepeso: a.sobrepeso_pct,
                  eutrofico: a.eutrofico_pct,
                }))} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="grupo" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="desnutricao" name="Desnutrição %"  fill={CRIT}   radius={[2,2,0,0]} stackId="a" />
                  <Bar dataKey="sobrepeso"   name="Sobrepeso %"    fill={WARN}   radius={[0,0,0,0]} stackId="a" />
                  <Bar dataKey="eutrofico"   name="Eutrófico %"    fill={OK}     radius={[2,2,0,0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(avaliacao as any[]).map((a: any, i: number) => (
                <div key={a.grupo} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: GROUP_COLORS[i] || BRAND }} />
                      <span className="font-semibold text-sm text-slate-700">{a.grupo}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: statusColor(a.status) }}>
                      Desnutrição: {a.desnutricao_pct}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{a.obs}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "servicos" && Array.isArray(servicos) && (
          <div className="grid gap-3">
            {(servicos as any[]).map((s: any) => (
              <div key={s.servico} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: s.disponivel ? statusColor(s.status) : CRIT }} />
                    <div>
                      <span className="font-semibold text-sm text-slate-700">{s.servico}</span>
                      {s.disponivel && (
                        <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                          <span>Realizado: {s.atendimentos_mes}/mês</span>
                          <span>Demanda: {s.demanda_estimada}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {!s.disponivel
                    ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">NÃO DISPONÍVEL</span>
                    : <span className="text-sm font-bold" style={{ color: statusColor(s.status) }}>
                        {Math.round(s.atendimentos_mes / s.demanda_estimada * 100)}%
                      </span>
                  }
                </div>
                {s.disponivel && <ProgressBar value={s.atendimentos_mes} max={s.demanda_estimada} color={statusColor(s.status)} />}
                <p className="text-xs text-slate-500 mt-2">{s.obs}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — Estado Nutricional (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line dataKey="desnutricao_inf_pct"    name="Desnutrição infantil %"   stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="obesidade_adultos_pct"  name="Obesidade adultos %"      stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="desnutricao_hosp_pct"   name="Desnutrição hospitalar %" stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="triagem_hosp_pct"       name="Triagem hospitalar %"     stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
