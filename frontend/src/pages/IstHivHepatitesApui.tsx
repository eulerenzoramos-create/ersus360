import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { FlaskConical, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

const SIF_COLORS: Record<string, string> = {
  "Sífilis adquirida — 15 a 24 anos": CRIT,
  "Sífilis adquirida — 25 a 39 anos": "#e11d48",
  "Sífilis em gestante":              ACCENT,
  "Sífilis adquirida — demais faixas": WARN,
};

const HEP_COLORS: Record<string, string> = {
  "Hepatite B aguda":   CRIT,
  "Hepatite B crônica": "#e11d48",
  "Hepatite C":         WARN,
  "Hepatite A":         ACCENT,
  "Hepatite D (delta)": "#7c3aed",
};

export default function IstHivHepatitesApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }       = useQuery({ queryKey: ["ist-dashboard"], queryFn: () => apiGet("/api/ist-hiv-hepatites-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: sifilis }    = useQuery({ queryKey: ["ist-sifilis"],   queryFn: () => apiGet("/api/ist-hiv-hepatites-apui/sifilis"),    enabled: aba === "sifilis" });
  const { data: hepatites }  = useQuery({ queryKey: ["ist-hep"],       queryFn: () => apiGet("/api/ist-hiv-hepatites-apui/hepatites"),  enabled: aba === "hepatites" });
  const { data: historico }  = useQuery({ queryKey: ["ist-hist"],      queryFn: () => apiGet("/api/ist-hiv-hepatites-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores }= useQuery({ queryKey: ["ist-ind"],       queryFn: () => apiGet("/api/ist-hiv-hepatites-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",  label: "Dashboard",  icon: <FlaskConical size={15}/> },
    { key: "sifilis",    label: "Sífilis/HIV", icon: <Activity size={15}/> },
    { key: "hepatites",  label: "Hepatites",   icon: <AlertTriangle size={15}/> },
    { key: "historico",  label: "Histórico",   icon: <TrendingUp size={15}/> },
    { key: "indicadores",label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <FlaskConical size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>IST / HIV / Hepatites — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Sífilis Congênita · HIV/TARV · Hepatites Virais · FMS Apuí/AM</p>
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
              <KPI label="Sífilis Congênita"  value={`${dashRaw.sifilis_congenita_por_1k_nv}/1k NV`} color={CRIT} sub={`meta: ${dashRaw.meta_sifilis_congenita_por_1k_nv}/1k NV`} />
              <KPI label="HIV Novos/Ano"       value={dashRaw.hiv_novos_casos_ano.toString()}          color={CRIT} sub={`${dashRaw.hiv_incidencia_100k}/100k hab.`} />
              <KPI label="PVHIV em TARV"       value={`${dashRaw.pvhiv_tarv_pct}%`}                   color={statusColor("critico")} sub={`meta: ${dashRaw.meta_pvhiv_tarv_pct}%`} />
              <KPI label="Carga Indetectável"  value={`${dashRaw.pvhiv_carga_indetectavel_pct}%`}     color={WARN} sub={`meta UNAIDS: ${dashRaw.meta_carga_indetectavel_pct}%`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Testagem IST / UBS"  value={`${dashRaw.testagem_ubs_cobertura_pct}%`}        color={CRIT} sub={`meta: ${dashRaw.meta_testagem_pct}%`} />
              <KPI label="Sífilis Adquirida"   value={dashRaw.sifilis_adquirida_casos_ano.toString()}  color={CRIT} sub={`${dashRaw.sifilis_adquirida_incidencia_100k}/100k`} />
              <KPI label="Hepatite B / Ano"    value={dashRaw.hepatite_b_casos_ano.toString()}         color={CRIT} sub={`${dashRaw.hepatite_b_incidencia_100k}/100k`} />
              <KPI label="Parceiro Tratado"    value={`${dashRaw.tratamento_sifilis_parceiro_pct}%`}   color={CRIT} sub={`meta: ${dashRaw.meta_tratamento_parceiro_pct}%`} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Cascata HIV (90-90-90 UNAIDS)</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "PVHIV total estimadas", value: dashRaw.pvhiv_total, max: dashRaw.pvhiv_total, color: BRAND, unit: "pcts" },
                    { label: "Em TARV (meta 90%)",    value: dashRaw.pvhiv_tarv_pct, max: 100, color: statusColor("critico"), unit: "%" },
                    { label: "Carga indetectável (meta 73%)", value: dashRaw.pvhiv_carga_indetectavel_pct, max: 100, color: WARN, unit: "%" },
                    { label: "Testagem UBS (meta 80%)", value: dashRaw.testagem_ubs_cobertura_pct, max: 100, color: CRIT, unit: "%" },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="font-bold" style={{ color: b.color }}>{b.value}{b.unit === "%" ? "%" : " " + b.unit}</span>
                      </div>
                      <ProgressBar value={typeof b.value === "number" ? b.value : 0} max={b.max} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>Sífilis congênita 18/1k NV — 36× a meta de eliminação</b> (0,5/1k NV). Parceiro não tratado em 71,6% — reinfecção garantida. Penicilina benzatina disponível na UBS mas conduta programática não existe.</p>
                <p><b>21,6% das PVHIV sem TARV</b> — AIDS ainda mata em Apuí por diagnóstico tardio e abandono de seguimento. A distância à farmácia de medicamentos especiais (Manicoré/Manaus) é a principal barreira.</p>
                <p><b>Hepatite D (delta) endêmica na Amazônia</b> — só pode ser prevenida com vacina B (72,4% vs meta 95%). Coinfecção B+D causa cirrose e hepatocarcinoma em 70-80% dos casos.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "sifilis" && Array.isArray(sifilis) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Casos de Sífilis por Categoria</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sifilis as any[]} margin={{ left: 10, right: 30 }}>
                  <XAxis dataKey="categoria" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip />
                  <Bar dataKey="casos" name="Casos" radius={[4,4,0,0]}>
                    {(sifilis as any[]).map((s: any) => <Cell key={s.categoria} fill={SIF_COLORS[s.categoria] || BRAND} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(sifilis as any[]).map((s: any) => (
                <div key={s.categoria} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: SIF_COLORS[s.categoria] || BRAND }} />
                      <span className="font-semibold text-sm text-slate-700">{s.categoria}</span>
                    </div>
                    <span className="font-bold text-slate-700">{s.casos} casos ({s.pct}%)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs mt-2">
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-slate-500">Tratamento oportuno</span>
                        <span className="font-bold" style={{ color: s.tratamento_oportuno_pct >= 80 ? OK : WARN }}>{s.tratamento_oportuno_pct}%</span>
                      </div>
                      <ProgressBar value={s.tratamento_oportuno_pct} max={100} color={s.tratamento_oportuno_pct >= 80 ? OK : WARN} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-slate-500">Parceiro tratado</span>
                        <span className="font-bold" style={{ color: s.parceiro_tratado_pct >= 70 ? OK : CRIT }}>{s.parceiro_tratado_pct}%</span>
                      </div>
                      <ProgressBar value={s.parceiro_tratado_pct} max={100} color={s.parceiro_tratado_pct >= 70 ? OK : CRIT} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "hepatites" && Array.isArray(hepatites) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Casos de Hepatites Virais — Apuí/AM</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hepatites as any[]} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="agravo" tick={{ fontSize: 9 }} width={180} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip />
                  <Bar dataKey="casos_ano" name="Casos/ano" radius={[0,3,3,0]}>
                    {(hepatites as any[]).map((h: any) => <Cell key={h.agravo} fill={HEP_COLORS[h.agravo] || BRAND} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(hepatites as any[]).map((h: any) => (
                <div key={h.agravo} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: HEP_COLORS[h.agravo] || BRAND }} />
                    <span className="font-semibold text-sm text-slate-700">{h.agravo}</span>
                  </div>
                  <div className="text-xs text-right">
                    <div><span className="font-bold" style={{ color: statusColor(h.status) }}>{h.casos_ano} casos/ano</span></div>
                    <div className="text-slate-400">incid.: {h.incidencia_100k}/100k</div>
                    {h.vacinacao_pct != null && (
                      <div className="text-slate-500">vacin.: <span style={{ color: h.vacinacao_pct >= 90 ? OK : WARN }}>{h.vacinacao_pct}%</span></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Anual — IST/HIV/Hepatites (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="sifilis_adq"     name="Sífilis adq."     stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="sifilis_cong"    name="Sífilis congênita"stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="hiv_novos"       name="HIV novos"        stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="hepatite_b"      name="Hepatite B"       stroke="#7c3aed"strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="pct" dataKey="pvhiv_tarv_pct"  name="PVHIV TARV (%)"  stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
