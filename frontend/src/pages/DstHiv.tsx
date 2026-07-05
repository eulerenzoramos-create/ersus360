import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { ShieldCheck, AlertTriangle, Users, Activity } from "lucide-react";

const BRAND  = "#4a044e";
const ACCENT = "#a21caf";
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

const FAIXA_COLORS = ["#dc2626","#d97706","#16a34a","#0891b2","#7c3aed"];

export default function DstHiv() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["hiv-dashboard"],
    queryFn: () => apiGet("/api/dst-hiv/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: pvha } = useQuery({
    queryKey: ["hiv-pvha"],
    queryFn: () => apiGet("/api/dst-hiv/pvha-perfil"),
    enabled: aba === "pvha",
  });
  const { data: dst } = useQuery({
    queryKey: ["hiv-dst"],
    queryFn: () => apiGet("/api/dst-hiv/dst-notificacoes"),
    enabled: aba === "dst",
  });
  const { data: serie } = useQuery({
    queryKey: ["hiv-serie"],
    queryFn: () => apiGet("/api/dst-hiv/serie-mensal"),
    enabled: aba === "serie",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["hiv-indicadores"],
    queryFn: () => apiGet("/api/dst-hiv/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <ShieldCheck size={15}/> },
    { key: "pvha",        label: "PVHA / TARV",  icon: <Users size={15}/> },
    { key: "dst",         label: "DST / Sífilis",icon: <AlertTriangle size={15}/> },
    { key: "serie",       label: "Série Mensal", icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <ShieldCheck size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>DST / HIV / AIDS</h1>
            <p className="text-sm text-slate-500">PVHA · TARV · 90-90-90 · Sífilis · PrEP/PEP · FMS Apuí/AM</p>
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
              <KPI label="PVHA Total"         value={dashRaw.pvha_total.toString()} />
              <KPI label="HIV Novos/Ano"      value={dashRaw.hiv_novos_ano.toString()} color={CRIT} />
              <KPI label="Em TARV"            value={`${dashRaw.tarv_pct}%`} sub="meta: 90% (cascata)" color={WARN} />
              <KPI label="CV Suprimida"       value={`${dashRaw.cv_suprimida_pct}%`} sub="meta: 90%" color={WARN} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Sífilis Adquirida"  value={dashRaw.sifilis_adquirida_ano.toString()} sub="/ano" color={CRIT} />
              <KPI label="Sífilis Gestante"   value={dashRaw.sifilis_gestante_ano.toString()} sub="/ano" color={CRIT} />
              <KPI label="Sífilis Congênita"  value={dashRaw.sifilis_congenita_ano.toString()} sub="/ano — meta 0" color={CRIT} />
              <KPI label="Óbitos AIDS/Ano"    value={dashRaw.obitos_aids_ano.toString()} color={CRIT} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>Cascata {dashRaw.cascata_meta}:</b> TARV {dashRaw.tarv_pct}% · CV suprimida {dashRaw.cv_suprimida_pct}%. Sífilis congênita {dashRaw.sifilis_congenita_ano} casos — 74× a meta de eliminação. {dashRaw.prep_usuarios} usuários em PrEP ativa.
            </div>
          </div>
        )}

        {aba === "pvha" && Array.isArray(pvha) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">PVHA por Faixa Etária</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={pvha} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="faixa" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pvha"         name="PVHA"        fill={ACCENT} radius={[3,3,0,0]} />
                  <Bar dataKey="tarv_pct"     name="TARV (%)"    fill={OK}     radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(pvha as any[]).map((p: any, i: number) => (
                <div key={p.faixa} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: FAIXA_COLORS[i % FAIXA_COLORS.length] }} />
                      <span className="font-semibold text-slate-700 text-sm">{p.faixa}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(p.status) }}>
                      {p.pvha} PVHA
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                    <span>TARV: <b style={{ color: p.tarv_pct < 80 ? CRIT : p.tarv_pct < 90 ? WARN : OK }}>{p.tarv_pct}%</b></span>
                    <span>CV Suprimida: <b style={{ color: p.cv_suprimida_pct < 80 ? CRIT : WARN }}>{p.cv_suprimida_pct}%</b></span>
                    <span>CD4 médio: <b>{p.cd4_medio}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "dst" && Array.isArray(dst) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Notificações por Agravo (2026)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dst} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="agravo" tick={{ fontSize: 9 }} width={240} />
                  <Tooltip />
                  <Bar dataKey="casos_ano" name="Casos" radius={[0,3,3,0]}>
                    {(dst as any[]).map((d: any, i: number) => (
                      <Cell key={i} fill={statusColor(d.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(dst as any[]).map((d: any) => (
                <div key={d.agravo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor(d.status) }} />
                    <span className="font-medium text-slate-700 text-sm">{d.agravo}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Casos: <b>{d.casos_ano}</b></span>
                    {d.taxa_100mil && <span>Taxa: <b style={{ color: statusColor(d.status) }}>{d.taxa_100mil}/100mil</b></span>}
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: statusColor(d.tendencia === "alta" ? "critico" : d.tendencia === "estavel" ? "atencao" : "ok") + "22", color: statusColor(d.tendencia === "alta" ? "critico" : d.tendencia === "estavel" ? "atencao" : "ok") }}>
                      {d.tendencia}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "serie" && Array.isArray(serie) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Série Mensal (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={serie} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" domain={[85, 92]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="hiv_novos"    name="HIV Novos"       stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="sifilis_adq"  name="Sífilis Adq."    stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="sifilis_gest" name="Sífilis Gest."   stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="tarv_pct"     name="TARV (%)"        stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
