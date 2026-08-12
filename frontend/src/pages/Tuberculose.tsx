import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Wind, AlertTriangle, Users, Activity } from "lucide-react";

const BRAND  = "#dbeafe";
const ACCENT = "#2563eb";
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

const TIPO_COLORS = ["#1d4ed8","#7c3aed","#0891b2","#dc2626","#9a3412"];

export default function Tuberculose() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["tb-dashboard"],
    queryFn: () => apiGet("/api/tuberculose/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: tipos } = useQuery({
    queryKey: ["tb-tipos"],
    queryFn: () => apiGet("/api/tuberculose/casos-por-tipo"),
    enabled: aba === "tipos",
  });
  const { data: contatos } = useQuery({
    queryKey: ["tb-contatos"],
    queryFn: () => apiGet("/api/tuberculose/investigacao-contatos"),
    enabled: aba === "contatos",
  });
  const { data: serie } = useQuery({
    queryKey: ["tb-serie"],
    queryFn: () => apiGet("/api/tuberculose/serie-historica"),
    enabled: aba === "serie",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["tb-indicadores"],
    queryFn: () => apiGet("/api/tuberculose/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Wind size={15}/> },
    { key: "tipos",       label: "Tipos/Formas", icon: <Users size={15}/> },
    { key: "contatos",    label: "Contatos",     icon: <AlertTriangle size={15}/> },
    { key: "serie",       label: "Série Hist.",  icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Wind size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Tuberculose</h1>
            <p className="text-sm text-slate-500">DOTS · TB-HIV · TDR · SINAN · FMS Apuí/AM</p>
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
              <KPI label="Casos Novos/Ano"   value={dashRaw.casos_novos_ano.toString()} color={CRIT} />
              <KPI label="Taxa Incidência"   value={`${dashRaw.taxa_incidencia_100mil}`} sub="/100 mil — ALTA PRIOR." color={CRIT} />
              <KPI label="Em Tratamento"     value={dashRaw.em_tratamento.toString()} />
              <KPI label="Coinfecção TB-HIV" value={`${dashRaw.coinfeccao_hiv_pct}%`} color={CRIT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Abandono"          value={`${dashRaw.abandono_pct}%`} sub="meta: ≤5%" color={CRIT} />
              <KPI label="Cura PQT"          value={`${dashRaw.cura_pct}%`} sub="meta: 85%" color={CRIT} />
              <KPI label="DOTS"              value={`${dashRaw.dots_pct}%`} sub="meta: 80%" color={CRIT} />
              <KPI label="TDR (Resistente)"  value={dashRaw.tdr_casos.toString()} sub="casos" color={CRIT} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>{dashRaw.classificacao_municipio}:</b> Taxa incidência {dashRaw.taxa_incidencia_100mil}/100 mil — meta OMS End TB é 10/100 mil até 2035. Abandono {dashRaw.abandono_pct}% favorece resistência. {dashRaw.tdr_casos} caso(s) de TB drogarresistente detectado(s).
            </div>
          </div>
        )}

        {aba === "tipos" && Array.isArray(tipos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Casos por Tipo/Forma (2026)</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={tipos} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="tipo" tick={{ fontSize: 9 }} width={220} />
                  <Tooltip />
                  <Bar dataKey="casos_ano" name="Casos" radius={[0,3,3,0]}>
                    {(tipos as any[]).map((_: any, i: number) => (
                      <Cell key={i} fill={TIPO_COLORS[i % TIPO_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(tipos as any[]).map((t: any, i: number) => (
                <div key={t.tipo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: TIPO_COLORS[i] }} />
                      <span className="font-semibold text-slate-700 text-sm">{t.tipo}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(t.status) }}>Cura: {t.cura_pct}%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                    <span>Casos: <b>{t.casos_ano}</b></span>
                    <span style={{ color: t.abandono > 0 ? CRIT : OK }}>Abandono: <b>{t.abandono}</b></span>
                    <span style={{ color: t.dots_pct < 70 ? CRIT : WARN }}>DOTS: <b>{t.dots_pct}%</b></span>
                    <span>Cultura: <b>{t.cultura_realizada_pct}%</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "contatos" && Array.isArray(contatos) && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Investigação de Contatos (2026)</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={contatos} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="categoria" tick={{ fontSize: 9 }} width={230} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="identificados" name="Identificados" fill="#1d4ed8" radius={[0,3,3,0]} />
                  <Bar dataKey="examinados"    name="Examinados"    fill={ACCENT}   radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(contatos as any[]).map((c: any) => (
              <div key={c.categoria} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                <span className="font-medium text-slate-700 text-sm">{c.categoria}</span>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Ident.: <b>{c.identificados}</b></span>
                  <span>Exam.: <b>{c.examinados}</b></span>
                  <span style={{ color: c.pct_examinados < 70 ? CRIT : WARN }}>
                    Cob.: <b>{c.pct_examinados}%</b>
                  </span>
                  <span style={{ color: c.ltbi_detectados > 0 ? WARN : OK }}>
                    ILTB: <b>{c.ltbi_detectados}</b>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "serie" && Array.isArray(serie) && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Série Histórica (2022–2026*)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={serie} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="n"    tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="pct"  orientation="right" domain={[0, 25]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="n"   dataKey="casos_novos"         name="Casos Novos"         stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="pct" dataKey="cura_pct"            name="Cura (%)"            stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                  <Line yAxisId="pct" dataKey="abandono_pct"        name="Abandono (%)"        stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                  <Line yAxisId="pct" dataKey="coinfeccao_hiv_pct"  name="Coinfec. HIV (%)"    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
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
