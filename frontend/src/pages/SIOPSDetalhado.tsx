import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { Landmark, DollarSign, AlertTriangle, BarChart3, Activity } from "lucide-react";

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const BRLK = (v: number) => {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}K`;
  return BRL(v);
};

const BRAND = "#1e3a5f";
const ACCENT = "#1d4ed8";
const OK = "#16a34a";
const WARN = "#d97706";
const CRIT = "#dc2626";

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

const BLOCOS_COLORS = ["#1d4ed8", "#0891b2", "#7c3aed", "#16a34a", "#d97706"];

export default function SIOPSDetalhado() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["siops-detalhado-dashboard"],
    queryFn: () => apiGet("/api/siops-detalhado/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: blocos } = useQuery({
    queryKey: ["siops-detalhado-blocos"],
    queryFn: () => apiGet("/api/siops-detalhado/blocos"),
    enabled: aba === "blocos",
  });

  const { data: ec29 } = useQuery({
    queryKey: ["siops-detalhado-ec29"],
    queryFn: () => apiGet("/api/siops-detalhado/ec29"),
    enabled: aba === "ec29",
  });

  const { data: historico } = useQuery({
    queryKey: ["siops-detalhado-historico"],
    queryFn: () => apiGet("/api/siops-detalhado/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["siops-detalhado-indicadores"],
    queryFn: () => apiGet("/api/siops-detalhado/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <Landmark size={15}/> },
    { key: "blocos",      label: "Blocos",        icon: <BarChart3 size={15}/> },
    { key: "ec29",        label: "EC-29",         icon: <DollarSign size={15}/> },
    { key: "historico",   label: "Histórico",     icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",   icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Landmark size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>SIOPS Detalhado</h1>
            <p className="text-sm text-slate-500">Vinculação EC-29 · Blocos · Teto MAC · FMS Apuí/AM</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {ABAS.map((a) => (
            <button
              key={a.key}
              onClick={() => setAba(a.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={
                aba === a.key
                  ? { background: BRAND, color: "white" }
                  : { background: "white", color: "#475569", border: "1px solid #e2e8f0" }
              }
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {aba === "dashboard" && dashRaw && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="EC-29 Aplicado" value={`${dashRaw.aplicacao_saude_pct}%`} sub={`Meta: ${dashRaw.vinculacao_minima_ec29_pct}%`} color={OK} />
              <KPI label="Superávit EC-29" value={BRLK(dashRaw.superavit_ec29_valor)} sub={`+${dashRaw.superavit_ec29_pct} p.p. acima`} color={OK} />
              <KPI label="MAC Executado" value={`${dashRaw.mac_executado_pct}%`} sub={BRLK(dashRaw.mac_executado_valor)} color={WARN} />
              <KPI label="Teto MAC Anual" value={BRLK(dashRaw.teto_mac_anual)} sub={dashRaw.competencia} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Distribuição por Bloco de Financiamento</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Atenção Básica",    pct: dashRaw.bloco_atencao_basica_pct },
                  { label: "MAC",               pct: dashRaw.bloco_mac_pct },
                  { label: "Vigilância",         pct: dashRaw.bloco_vigilancia_pct },
                  { label: "Assist. Farm.",      pct: dashRaw.bloco_assistencia_farm_pct },
                  { label: "Gestão",             pct: dashRaw.bloco_gestao_pct },
                ].map((b, i) => (
                  <div key={b.label} className="text-center p-3 rounded-lg" style={{ background: `${BLOCOS_COLORS[i]}18` }}>
                    <p className="text-2xl font-bold" style={{ color: BLOCOS_COLORS[i] }}>{b.pct}%</p>
                    <p className="text-xs text-slate-500 mt-1">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Blocos */}
        {aba === "blocos" && Array.isArray(blocos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Execução por Bloco (R$)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={blocos} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="bloco" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => BRL(v)} />
                  <Legend />
                  <Bar dataKey="federal"   name="Federal"   fill="#1d4ed8" radius={[3,3,0,0]} />
                  <Bar dataKey="estadual"  name="Estadual"  fill="#0891b2" radius={[3,3,0,0]} />
                  <Bar dataKey="municipal" name="Municipal" fill="#7c3aed" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(blocos as any[]).map((b: any, i: number) => (
                <div key={b.bloco} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700">{b.bloco}</span>
                    <span className="text-sm font-bold" style={{ color: BLOCOS_COLORS[i] }}>{b.pct_exec}% executado</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                    <div className="h-2 rounded-full" style={{ width: `${b.pct_exec}%`, background: BLOCOS_COLORS[i] }} />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs text-slate-500 mt-2">
                    <span>Federal: <b>{BRLK(b.federal)}</b></span>
                    <span>Estadual: <b>{BRLK(b.estadual)}</b></span>
                    <span>Municipal: <b>{BRLK(b.municipal)}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EC-29 */}
        {aba === "ec29" && ec29 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <KPI label="Receita Base" value={BRLK((ec29 as any).receita_base)} />
              <KPI label="Mínimo EC-29 (15%)" value={BRL((ec29 as any).minimo_legal_valor)} />
              <KPI label="Aplicado" value={`${(ec29 as any).aplicado_pct}%`} sub={BRL((ec29 as any).aplicado_valor)} color={OK} />
              <KPI label="Superávit" value={`${(ec29 as any).superavit_pct} p.p.`} sub={BRL((ec29 as any).superavit_valor)} color={OK} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Série Histórica EC-29 (%)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={(ec29 as any).serie_historica} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                  <YAxis domain={[12, 22]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <ReferenceLine y={15} stroke={CRIT} strokeDasharray="4 4" label={{ value: "Mínimo 15%", position: "right", fontSize: 10 }} />
                  <Line dataKey="aplicado_pct" name="EC-29 Aplicado" stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Histórico */}
        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal (últimos 6 meses)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" domain={[14, 22]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="mac" orientation="right" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="pct" dataKey="pct_ec29"     name="EC-29 (%)" stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="mac" dataKey="mac_exec_pct" name="MAC Exec (%)" stroke={OK}    strokeWidth={2} dot={{ r: 3 }} />
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
                      {typeof ind.valor === "number" && ind.unidade === "R$" ? BRL(ind.valor) : `${ind.valor} ${ind.unidade}`}
                      {ind.meta !== null && ind.meta !== undefined ? ` / meta: ${ind.unidade === "R$" ? BRL(ind.meta) : `${ind.meta} ${ind.unidade}`}` : ""}
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
