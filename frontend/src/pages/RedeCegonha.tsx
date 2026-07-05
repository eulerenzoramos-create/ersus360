import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Baby, AlertTriangle, Heart, Activity } from "lucide-react";

const BRAND  = "#831843";
const ACCENT = "#db2777";
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

const EQUIPE_COLORS = ["#16a34a","#d97706","#d97706","#dc2626","#dc2626","#dc2626"];

export default function RedeCegonha() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["rc-dashboard"],
    queryFn: () => apiGet("/api/rede-cegonha/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: equipes } = useQuery({
    queryKey: ["rc-equipes"],
    queryFn: () => apiGet("/api/rede-cegonha/equipes"),
    enabled: aba === "equipes",
  });

  const { data: sifilis } = useQuery({
    queryKey: ["rc-sifilis"],
    queryFn: () => apiGet("/api/rede-cegonha/sifilis"),
    enabled: aba === "sifilis",
  });

  const { data: historico } = useQuery({
    queryKey: ["rc-historico"],
    queryFn: () => apiGet("/api/rede-cegonha/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["rc-indicadores"],
    queryFn: () => apiGet("/api/rede-cegonha/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;
  const sifilisRaw = sifilis as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Baby size={15}/> },
    { key: "equipes",     label: "Por ESF",    icon: <Heart size={15}/> },
    { key: "sifilis",     label: "Sífilis",    icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Baby size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Rede Cegonha</h1>
            <p className="text-sm text-slate-500">Pré-natal · Parto · Puerpério · Sífilis · FMS Apuí/AM</p>
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
              <KPI label="Gestantes Ativas"      value={dashRaw.gestantes_ativas.toString()} />
              <KPI label="Pré-natal Adequado"    value={`${dashRaw.pn_adequado_pct}%`} sub="meta: 85%" color={CRIT} />
              <KPI label="Puerpério Realizado"   value={`${dashRaw.puerperio_realizado_pct}%`} sub="meta: 85%" color={CRIT} />
              <KPI label="Partos/Mês"            value={dashRaw.partos_mes.toString()} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Cesáreas"              value={`${dashRaw.partos_cesareas_pct}%`} sub="meta: ≤45%" color={WARN} />
              <KPI label="Sífilis Congênita/Ano" value={dashRaw.sifilis_congenita_casos_ano.toString()} sub="meta: 0" color={CRIT} />
              <KPI label="VDRL 1º Trim."         value={`${dashRaw.vdrl_1trim_pct}%`} sub="meta: 100%" color={WARN} />
              <KPI label="Amam. Exclusivo"       value={`${dashRaw.aleitamento_exclusivo_pct}%`} sub="meta: 60%" color={WARN} />
            </div>
          </div>
        )}

        {aba === "equipes" && Array.isArray(equipes) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Pré-natal Adequado por ESF</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={equipes} margin={{ left: 5, right: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="equipe" tick={{ fontSize: 9 }} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="pn_adequado_pct" name="Pré-natal Adequado %" radius={[3,3,0,0]}>
                    {(equipes as any[]).map((_: any, i: number) => (
                      <Cell key={i} fill={EQUIPE_COLORS[i] || CRIT} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(equipes as any[]).map((e: any, i: number) => (
                <div key={e.equipe} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: EQUIPE_COLORS[i] || CRIT }} />
                      <span className="font-semibold text-slate-700 text-sm">{e.equipe}</span>
                      <span className="text-xs text-slate-400">({e.gestantes_ativas} gestantes)</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(e.status) }}>PN: {e.pn_adequado_pct}%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                    <span>VDRL: <b style={{ color: e.vdrl_1trim_pct < 85 ? CRIT : OK }}>{e.vdrl_1trim_pct}%</b></span>
                    <span>HIV: <b style={{ color: e.hiv_1trim_pct < 85 ? CRIT : OK }}>{e.hiv_1trim_pct}%</b></span>
                    <span>Hep.B: <b>{e.hep_b_pct}%</b></span>
                    <span>Puerpério: <b style={{ color: e.puerperio_pct < 65 ? CRIT : WARN }}>{e.puerperio_pct}%</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "sifilis" && sifilisRaw && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Sífilis Gestante/Ano"    value={sifilisRaw.casos_sifilis_gestante_ano.toString()} color={CRIT} />
              <KPI label="Taxa (por mil NV)"        value={sifilisRaw.taxa_sifilis_gestante.toString()} color={CRIT} />
              <KPI label="Sífilis Congênita/Ano"   value={sifilisRaw.casos_sifilis_congenita_ano.toString()} sub={`meta: 0.5/mil NV`} color={CRIT} />
              <KPI label="Tratamento Adequado"     value={`${sifilisRaw.tratamento_adequado_gestante_pct}%`} sub="parceiro tratado: 41.7%" color={WARN} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Série Mensal — Sífilis 2026</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={sifilisRaw.serie_mensal} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="n"   dataKey="sifilis_gestante"        name="Síf. Gestante"        stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="n"   dataKey="sifilis_congenita"        name="Síf. Congênita"       stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="pct" dataKey="tratamento_adequado_pct" name="Trat. Adequado (%)"    stroke={OK}     strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" domain={[40, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="gestantes"        name="Gestantes"        stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="n"   dataKey="partos"           name="Partos/Mês"       stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="pct" dataKey="pn_adequado_pct"  name="PN Adequado (%)"  stroke={OK}     strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="pct" dataKey="puerperio_pct"    name="Puerpério (%)"    stroke={WARN}   strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
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
