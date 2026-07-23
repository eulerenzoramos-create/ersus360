import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Bug, AlertTriangle, Activity, MapPin } from "lucide-react";

const BRAND  = "#14532d";
const ACCENT = "#16a34a";
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

const ESP_COLORS = ["#0891b2", "#dc2626", "#d97706"];

export default function MalariaEndemias() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }      = useQuery({ queryKey: ["me-dashboard"], queryFn: () => apiGet("/api/malaria-endemias/dashboard"),      enabled: aba === "dashboard" });
  const { data: malaria }   = useQuery({ queryKey: ["me-malaria"],   queryFn: () => apiGet("/api/malaria-endemias/malaria"),         enabled: aba === "malaria" });
  const { data: outras }    = useQuery({ queryKey: ["me-outras"],    queryFn: () => apiGet("/api/malaria-endemias/outras-endemias"), enabled: aba === "outras" });
  const { data: historico } = useQuery({ queryKey: ["me-historico"], queryFn: () => apiGet("/api/malaria-endemias/historico"),       enabled: aba === "historico" });
  const { data: indicadores }= useQuery({ queryKey: ["me-ind"],     queryFn: () => apiGet("/api/malaria-endemias/indicadores"),     enabled: aba === "indicadores" });

  const dashRaw   = dash as any;
  const malariaRaw= malaria as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",    icon: <Bug size={15}/> },
    { key: "malaria",     label: "Malária",      icon: <Bug size={15}/> },
    { key: "outras",      label: "Outras Endemias",icon: <Activity size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Bug size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Malária e Endemias</h1>
            <p className="text-sm text-slate-500">Malária · Leishmaniose · Dengue · Hanseníase · TB · Chagas · FMS Apuí/AM</p>
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
              <KPI label="Malária — Casos/Ano"    value={dashRaw.malaria_casos_ano.toString()} color={CRIT} />
              <KPI label="IVP Malária"            value={dashRaw.malaria_ivp.toString()}       color={CRIT} sub="meta: ≤10 (baixo risco)" />
              <KPI label="Dengue — Casos/Ano"     value={dashRaw.dengue_casos_ano.toString()}  color={WARN} />
              <KPI label="Leishmaniose Visceral"  value={dashRaw.leishmaniose_visceral_casos.toString()} color={CRIT} sub="casos em 2025" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="P. falciparum"          value={`${dashRaw.malaria_falciparum_pct}%`} color={CRIT} sub="dos casos malária" />
              <KPI label="L. Tegumentar (LTA)"    value={dashRaw.leishmaniose_tegumentar_casos.toString()} color={WARN} />
              <KPI label="Hanseníase"             value="12 casos"  color={WARN} sub="endêmico" />
              <KPI label="Tuberculose"            value="8 casos"   color={WARN} sub="1 TB-RR" />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900">
              <b>ALTO RISCO — IVP 36,8 (meta ≤10).</b> Apuí entre os municípios com maior carga de malária no Amazonas. Garimpo ilegal é o principal fator sem controle vetorial. Leishmaniose visceral em expansão urbana. 48,4% dos casos de malária são indígenas.
            </div>
          </div>
        )}

        {aba === "malaria" && malariaRaw && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Casos/Ano"          value={malariaRaw.casos_ano.toString()}           color={CRIT} />
              <KPI label="IVP"                value={malariaRaw.ivp.toString()}                 color={CRIT} sub={malariaRaw.ivp_classificacao} />
              <KPI label="Lâmina Positiva"    value={`${malariaRaw.laminoscopia_positiva_pct}%`} color={WARN} />
              <KPI label="Tratamento Concluído" value={`${malariaRaw.tratamento_concluido_pct}%`} color={WARN} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-4">Distribuição por Espécie</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={malariaRaw.distribuicao_especie} dataKey="casos" nameKey="especie" cx="50%" cy="50%" outerRadius={70} label={({ pct }) => `${pct}%`}>
                      {malariaRaw.distribuicao_especie.map((_: any, i: number) => <Cell key={i} fill={ESP_COLORS[i % ESP_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-4">Zonas Críticas</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={malariaRaw.zonas_criticas} layout="vertical" margin={{ left: 10, right: 40 }}>
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis type="category" dataKey="zona" tick={{ fontSize: 8 }} width={190} />
                    <Tooltip />
                    <Bar dataKey="casos" name="Casos" radius={[0,3,3,0]}>
                      {malariaRaw.zonas_criticas.map((z: any) => <Cell key={z.zona} fill={statusColor(z.status)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 rounded p-3">{malariaRaw.obs}</p>
          </div>
        )}

        {aba === "outras" && Array.isArray(outras) && (
          <div className="grid gap-3">
            {(outras as any[]).map((e: any) => (
              <div key={e.doenca} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700">{e.doenca}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: statusColor(e.status) }}>{e.casos_ano} casos</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: statusColor(e.status) + "22", color: statusColor(e.status) }}>{e.status.toUpperCase()}</span>
                  </div>
                </div>
                <div className="flex gap-6 text-xs text-slate-500 mb-2">
                  <span>Forma: <b>{e.forma}</b></span>
                  <span>Tratamento: <b>{e.tratamento}</b></span>
                  {e.cura_pct > 0 && <span style={{ color: OK }}>Cura: <b>{e.cura_pct}%</b></span>}
                </div>
                {e.obs && <p className="text-xs text-amber-700 bg-amber-50 rounded p-2">{e.obs}</p>}
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução das Endemias — 2022 a 2025</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="m" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="o" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="m" dataKey="malaria"     name="Malária"       stroke={CRIT}   strokeWidth={3} dot={{ r: 5 }} />
                <Line yAxisId="m" dataKey="dengue"      name="Dengue"        stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="o" dataKey="lta"         name="Leishm. Teg."  stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="o" dataKey="lv"          name="Leishm. Visc." stroke="#db2777" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="o" dataKey="hanseniase"  name="Hanseníase"    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
