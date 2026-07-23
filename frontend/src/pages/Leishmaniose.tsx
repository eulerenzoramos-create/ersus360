import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { FlaskRound, AlertTriangle, MapPin, Activity } from "lucide-react";

const BRAND  = "#713f12";
const ACCENT = "#d97706";
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

const FORMA_COLORS = ["#d97706","#ef4444","#dc2626","#7c3aed"];

export default function Leishmaniose() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["leish-dashboard"],
    queryFn: () => apiGet("/api/leishmaniose/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: casosLta } = useQuery({
    queryKey: ["leish-lta"],
    queryFn: () => apiGet("/api/leishmaniose/casos-lta"),
    enabled: aba === "lta",
  });
  const { data: procedencia } = useQuery({
    queryKey: ["leish-proc"],
    queryFn: () => apiGet("/api/leishmaniose/procedencia"),
    enabled: aba === "procedencia",
  });
  const { data: historico } = useQuery({
    queryKey: ["leish-historico"],
    queryFn: () => apiGet("/api/leishmaniose/historico"),
    enabled: aba === "historico",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["leish-indicadores"],
    queryFn: () => apiGet("/api/leishmaniose/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <FlaskRound size={15}/> },
    { key: "lta",         label: "LTA — Formas", icon: <AlertTriangle size={15}/> },
    { key: "procedencia", label: "Procedência",  icon: <MapPin size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <FlaskRound size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Leishmaniose</h1>
            <p className="text-sm text-slate-500">LTA · LV · Glucantime · Vigilância · FMS Apuí/AM</p>
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
              <KPI label="LTA/Ano"              value={dashRaw.casos_lta_ano.toString()} color={CRIT} />
              <KPI label="Taxa LTA"             value={dashRaw.taxa_lta_100mil.toString()} sub="/100 mil hab" color={CRIT} />
              <KPI label="LV/Ano"               value={dashRaw.casos_lv_ano.toString()} color={WARN} />
              <KPI label="Cura LTA"             value={`${dashRaw.cura_lta_pct}%`} sub="meta: 90%" color={WARN} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Abandono LTA"         value={`${dashRaw.abandono_lta_pct}%`} color={WARN} />
              <KPI label="Efeitos Graves"       value={dashRaw.efeito_adverso_grave_lta.toString()} sub="Glucantime" color={WARN} />
              <KPI label="Antimonial Disponível" value={dashRaw.antimonial_disponivel ? "Sim" : "NÃO"} color={dashRaw.antimonial_disponivel ? OK : CRIT} />
              <KPI label="Óbitos LV/Ano"        value={dashRaw.obitos_lv_ano.toString()} color={dashRaw.obitos_lv_ano > 0 ? CRIT : OK} />
            </div>
          </div>
        )}

        {aba === "lta" && Array.isArray(casosLta) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Casos por Forma Clínica (2026)</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={casosLta} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="forma" tick={{ fontSize: 10 }} width={180} />
                  <Tooltip />
                  <Bar dataKey="casos_ano" name="Casos" radius={[0,3,3,0]}>
                    {(casosLta as any[]).map((_: any, i: number) => (
                      <Cell key={i} fill={FORMA_COLORS[i % FORMA_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(casosLta as any[]).map((c: any, i: number) => (
                <div key={c.forma} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: FORMA_COLORS[i] }} />
                      <span className="font-semibold text-slate-700 text-sm">{c.forma}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(c.status) }}>Cura: {c.cura_pct}%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                    <span>Casos: <b>{c.casos_ano}</b></span>
                    <span>Tratados: <b>{c.tratados}</b></span>
                    <span style={{ color: c.abandono > 0 ? WARN : OK }}>Abandono: <b>{c.abandono}</b></span>
                    <span style={{ color: c.efeito_adverso_grave > 0 ? CRIT : OK }}>Ef. grave: <b>{c.efeito_adverso_grave}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "procedencia" && Array.isArray(procedencia) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Casos por Município de Procedência</h3>
            <div className="grid gap-3">
              {(procedencia as any[]).map((p: any, i: number) => (
                <div key={p.municipio} className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: FORMA_COLORS[i % FORMA_COLORS.length] }} />
                  <span className="text-sm flex-1 text-slate-700">{p.municipio}</span>
                  <span className="text-xs text-slate-500">LTA: <b>{p.casos_lta}</b></span>
                  <span className="text-xs text-slate-500">LV: <b>{p.casos_lv}</b></span>
                  <div className="w-24 bg-slate-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${p.pct_total}%`, background: FORMA_COLORS[i % FORMA_COLORS.length] }} />
                  </div>
                  <span className="text-xs font-bold w-10 text-right" style={{ color: FORMA_COLORS[i % FORMA_COLORS.length] }}>{p.pct_total}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Série Histórica (2022–2026*)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" domain={[75, 95]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="lta"       name="Casos LTA"     stroke={CRIT}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="lv"        name="Casos LV"      stroke={WARN}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="cura_pct"  name="Cura LTA (%)"  stroke={OK}    strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
