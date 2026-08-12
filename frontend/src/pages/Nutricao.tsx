import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { ShoppingBag, AlertTriangle, Users, Activity } from "lucide-react";

const BRAND  = "#14532d";
const ACCENT = "#16a34a";
const OK     = "#16a34a";
const WARN   = "#d97706";
const CRIT   = "#dc2626";
const ORANGE = "#ea580c";

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

const CICLO_COLORS = ["#0891b2","#2563eb","#7c3aed","#d97706","#0891b2","#db2777"];

export default function Nutricao() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["nut-dashboard"],
    queryFn: () => apiGet("/api/nutricao/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: sisvan } = useQuery({
    queryKey: ["nut-sisvan"],
    queryFn: () => apiGet("/api/nutricao/sisvan-ciclos"),
    enabled: aba === "sisvan",
  });
  const { data: programas } = useQuery({
    queryKey: ["nut-programas"],
    queryFn: () => apiGet("/api/nutricao/programas"),
    enabled: aba === "programas",
  });
  const { data: historico } = useQuery({
    queryKey: ["nut-historico"],
    queryFn: () => apiGet("/api/nutricao/historico"),
    enabled: aba === "historico",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["nut-indicadores"],
    queryFn: () => apiGet("/api/nutricao/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <ShoppingBag size={15}/> },
    { key: "sisvan",      label: "SISVAN",       icon: <Users size={15}/> },
    { key: "programas",   label: "Programas",   icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <ShoppingBag size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Nutrição / SISVAN</h1>
            <p className="text-sm text-slate-500">SISVAN · Bolsa Família · Vitaminas · Suplementação · FMS Apuí/AM</p>
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
              <KPI label="Avaliados SISVAN/Mês"   value={dashRaw.avaliados_sisvan_mes.toLocaleString()} color={ACCENT} />
              <KPI label="Desnutrição Grave <5"   value={`${dashRaw.desnutricao_grave_criancas_pct}%`} sub="meta: ≤1%" color={CRIT} />
              <KPI label="Obesidade Adultos"      value={`${dashRaw.obesidade_adultos_pct}%`} color={CRIT} />
              <KPI label="Cobertura SISVAN Média" value={`${dashRaw.cobertura_sisvan_media_pct}%`} color={WARN} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Famílias BF Acomp."    value={dashRaw.familias_bf_acompanhadas.toLocaleString()} color={OK} />
              <KPI label="BF Total Famílias"     value={dashRaw.bf_total_familias.toLocaleString()} />
              <KPI label="Vitamina A <5 anos"    value={`${dashRaw.suplementacao_vit_a_pct}%`} sub="meta: 80%" color={WARN} />
              <KPI label="Ferro <2 anos"         value={`${dashRaw.suplementacao_ferro_pct}%`} sub="meta: 80%" color={CRIT} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>Dupla carga da desnutrição:</b> desnutrição grave {dashRaw.desnutricao_grave_criancas_pct}% em crianças &lt;5 anos e obesidade {dashRaw.obesidade_adultos_pct}% em adultos. Desnutrição indígena {dashRaw.desnutricao_indigena_pct}% — 2× a média municipal.
            </div>
          </div>
        )}

        {aba === "sisvan" && Array.isArray(sisvan) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Obesidade + Desnutrição por Ciclo de Vida (%)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={sisvan} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="ciclo_vida" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="desnutricao_grave_pct"    name="Desnut. Grave"  fill={CRIT}   radius={[3,3,0,0]} />
                  <Bar dataKey="desnutricao_moderada_pct" name="Desnut. Mod."   fill={WARN}   radius={[3,3,0,0]} />
                  <Bar dataKey="sobrepeso_pct"            name="Sobrepeso"      fill={ORANGE} radius={[3,3,0,0]} />
                  <Bar dataKey="obesidade_pct"            name="Obesidade"      fill="#9a3412" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(sisvan as any[]).map((s: any, i: number) => (
                <div key={s.ciclo_vida} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: CICLO_COLORS[i % CICLO_COLORS.length] }} />
                      <span className="font-semibold text-slate-700 text-sm">{s.ciclo_vida}</span>
                      <span className="text-xs text-slate-400">({s.avaliados.toLocaleString()} avaliados)</span>
                    </div>
                    <span className="text-xs" style={{ color: statusColor(s.status) }}>Cob.: <b>{s.cobertura_pct}%</b></span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-xs text-slate-500">
                    <span style={{ color: s.desnutricao_grave_pct > 2 ? CRIT : OK }}>D.grave: <b>{s.desnutricao_grave_pct}%</b></span>
                    <span style={{ color: s.desnutricao_moderada_pct > 5 ? CRIT : WARN }}>D.mod.: <b>{s.desnutricao_moderada_pct}%</b></span>
                    <span style={{ color: OK }}>Eutróf.: <b>{s.eutrofico_pct}%</b></span>
                    <span style={{ color: ORANGE }}>Sobrep.: <b>{s.sobrepeso_pct}%</b></span>
                    <span style={{ color: s.obesidade_pct > 15 ? CRIT : WARN }}>Obeso: <b>{s.obesidade_pct}%</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "programas" && Array.isArray(programas) && (
          <div className="space-y-3">
            {(programas as any[]).map((p: any) => (
              <div key={p.programa} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColor(p.status) }} />
                    <span className="font-semibold text-slate-700">{p.programa}</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: statusColor(p.status) }}>
                    Cob.: {p.cobertura_pct}%
                  </span>
                </div>
                <div className="mb-2 w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${p.cobertura_pct}%`, background: statusColor(p.status) }} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                  <span>Acompanhadas: <b>{p.acompanhadas_saude.toLocaleString()}</b></span>
                  <span>Crianças avaliadas: <b>{p.criancas_avaliadas.toLocaleString()}</b></span>
                  {p.descumprimento_pct && <span style={{ color: p.descumprimento_pct > 5 ? CRIT : WARN }}>Descumprimento: <b>{p.descumprimento_pct}%</b></span>}
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
                <Line dataKey="avaliados_sisvan"    name="Avaliados SISVAN"    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="bf_acompanhadas"     name="BF Acompanhadas"     stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="obesidade_novos"     name="Obesidade Novos"     stroke={ORANGE} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="desnutricao_graves"  name="Desnut. Graves"      stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
