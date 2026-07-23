import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Syringe, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div className="w-full bg-slate-100 rounded-full h-2.5">
    <div className="h-2.5 rounded-full" style={{ width: `${Math.min(value / max * 100, 100)}%`, background: color }} />
  </div>
);

export default function ImunizacaoApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["imu-dashboard"], queryFn: () => apiGet("/api/imunizacao-apui/dashboard"),   enabled: aba === "dashboard" });
  const { data: vacinas }     = useQuery({ queryKey: ["imu-vacinas"],   queryFn: () => apiGet("/api/imunizacao-apui/vacinas"),     enabled: aba === "vacinas" });
  const { data: cadeia }      = useQuery({ queryKey: ["imu-cadeia"],    queryFn: () => apiGet("/api/imunizacao-apui/cadeia-frio"), enabled: aba === "cadeia" });
  const { data: historico }   = useQuery({ queryKey: ["imu-hist"],      queryFn: () => apiGet("/api/imunizacao-apui/historico"),   enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["imu-ind"],       queryFn: () => apiGet("/api/imunizacao-apui/indicadores"), enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",    icon: <Syringe size={15}/> },
    { key: "vacinas",    label: "Coberturas",   icon: <Activity size={15}/> },
    { key: "cadeia",     label: "Cadeia Frio",  icon: <AlertTriangle size={15}/> },
    { key: "historico",  label: "Histórico",    icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Syringe size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Imunização / PNI — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Calendário Vacinal · Cadeia de Frio · Abandono · FMS Apuí/AM</p>
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
              <KPI label="Pentavalente D3"          value={`${dashRaw.pentavalente_d3_pct}%`}          color={CRIT} sub={`meta: ${dashRaw.meta_cobertura_pct}%`} />
              <KPI label="SCR D1 (Sarampo)"         value={`${dashRaw.triplice_viral_d1_pct}%`}        color={CRIT} sub="limiar rebanho: 95%" />
              <KPI label="HPV Feminino D2"           value={`${dashRaw.hpv_feminino_d2_pct}%`}         color={CRIT} sub="meta: 80%" />
              <KPI label="Abandono Penta D1→D3"     value={`${dashRaw.abandono_pentavalente_d1_d3_pct}%`} color={CRIT} sub={`meta: ≤ ${dashRaw.meta_abandono_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="BCG (RN)"                 value={`${dashRaw.bcg_pct}%`}                      color={WARN} sub="meta: 95%" />
              <KPI label="Hep B (ao nascer)"         value={`${dashRaw.hepatite_b_ao_nascer_pct}%`}     color={CRIT} sub="< 24h pós-parto" />
              <KPI label="Doses Perdidas (pane 2024)" value={dashRaw.doses_perdidas_pane_2024?.toLocaleString()} color={CRIT} sub="geladeira quebrada" />
              <KPI label="Salas c/ Geladeira"        value={`${dashRaw.salas_vacinacao - 2}/${dashRaw.salas_vacinacao}`} color={CRIT} sub="2 salas sem refrigeração" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Coberturas Prioritárias</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "BCG (meta 95%)",          value: dashRaw.bcg_pct,                        color: WARN },
                    { label: "Pentavalente D3 (meta 95%)", value: dashRaw.pentavalente_d3_pct,          color: CRIT },
                    { label: "Polio D3 (meta 95%)",     value: dashRaw.polio_vpod3_pct,                 color: CRIT },
                    { label: "SCR D1 (meta 95%)",       value: dashRaw.triplice_viral_d1_pct,           color: CRIT },
                    { label: "SCR D2 (meta 95%)",       value: dashRaw.triplice_viral_d2_pct,           color: CRIT },
                    { label: "HPV Fem. D2 (meta 80%)",  value: dashRaw.hpv_feminino_d2_pct,             color: CRIT },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value}%</span>
                      </div>
                      <ProgressBar value={b.value} max={100} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Sarampo: 64,2% — abaixo do limiar crítico</b>. AM teve surto em 2018-2019 iniciado em municípios com cobertura semelhante. Garimpeiros de outros estados e países são vetores de reintrodução. Surto em Apuí = UPA sem isolamento + transfer para Manaus.</p>
                <p><b>Pane na cadeia de frio (2024): 3.840 doses destruídas</b> — R$ 28k em imunobiológicos perdidos. 2 salas vacinação sem geladeira própria (Vila do Juma + ribeirinha): caixa de isopor com gelo = cadeia precária. CGPNI exige novo relatório de pane anualmente.</p>
                <p><b>Abandono 18,4% (meta 5%)</b> — criança inicia esquema mas não completa. Zona rural a 40-80 km da UBS: mensal incompatível com realidade. ACS sem cronograma de vacinação domiciliar sistematizado.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "vacinas" && Array.isArray(vacinas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Cobertura Vacinal por Imunobiológico (%)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vacinas as any[]} layout="vertical" margin={{ left: 10, right: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="vacina" tick={{ fontSize: 8 }} width={220} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="cobertura_pct" name="Cobertura (%)" radius={[0,3,3,0]}>
                    {(vacinas as any[]).map((v: any) => <Cell key={v.vacina} fill={statusColor(v.status)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(vacinas as any[]).map((v: any) => (
                <div key={v.vacina} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: statusColor(v.status) }} />
                      <span className="font-semibold text-sm text-slate-700">{v.vacina}</span>
                      <span className="text-xs text-slate-400">({v.publico})</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(v.status) }}>{v.cobertura_pct}% / meta {v.meta_pct}%</span>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{v.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "cadeia" && Array.isArray(cadeia) && (
          <div className="space-y-3">
            {(cadeia as any[]).map((s: any) => (
              <div key={s.sala} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: statusColor(s.status) }} />
                  <div>
                    <p className="font-semibold text-sm text-slate-700">{s.sala}</p>
                    <p className="text-xs text-slate-400">{s.geladeiras} geladeira(s) — {s.funcionando ? "funcionando" : "sem geladeira / não funciona"}</p>
                  </div>
                </div>
                <div className="text-xs text-right space-y-0.5">
                  {s.doses_armazenadas > 0 && <div>Doses: <b>{s.doses_armazenadas.toLocaleString()}</b></div>}
                  {s.temperatura_ok_pct > 0 && <div>Temp OK: <b style={{ color: s.temperatura_ok_pct >= 90 ? OK : s.temperatura_ok_pct >= 80 ? WARN : CRIT }}>{s.temperatura_ok_pct}%</b></div>}
                  {!s.funcionando && <div className="font-bold" style={{ color: CRIT }}>Vacinação impossível</div>}
                </div>
              </div>
            ))}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
              <b>Ação urgente:</b> Vila do Juma e postos ribeirinhos sem geladeira dependem de caixa de isopor com gelo para vacinação eventual. CGPNI exige câmara fria em toda sala de vacina. Aquisição de 2 geladeiras IEC (R$ 8.400 cada) resolve o problema estrutural.
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Coberturas Vacinais (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[30, 100]} />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Legend />
                <Line dataKey="pentavalente_pct"    name="Pentavalente D3"   stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="scr_d1_pct"          name="SCR D1 (sarampo)" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="hpv_pct"             name="HPV fem. D2"      stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="influenza_idosos_pct"name="Influenza idosos"  stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="abandono_pct"        name="Abandono (%)"     stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
