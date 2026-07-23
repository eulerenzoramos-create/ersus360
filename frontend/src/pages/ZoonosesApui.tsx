import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { FlaskRound, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#1e3a5f";
const ACCENT = "#1d4ed8";
const OK     = "#16a34a";
const WARN   = "#d97706";
const CRIT   = "#dc2626";

function statusColor(s: string) {
  if (s === "critico") return CRIT;
  if (s === "atencao") return WARN;
  return OK;
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

export default function ZoonosesApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["zoo-dash"],   queryFn: () => apiGet("/api/zoonoses-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: doencas }     = useQuery({ queryKey: ["zoo-doenc"],  queryFn: () => apiGet("/api/zoonoses-apui/doencas"),    enabled: aba === "doencas" });
  const { data: acoes }       = useQuery({ queryKey: ["zoo-acoes"],  queryFn: () => apiGet("/api/zoonoses-apui/acoes"),      enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["zoo-hist"],   queryFn: () => apiGet("/api/zoonoses-apui/historico"),  enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["zoo-ind"],    queryFn: () => apiGet("/api/zoonoses-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <FlaskRound size={15}/> },
    { key: "doencas",     label: "Doenças",    icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <FlaskRound size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Controle de Zoonoses — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Raiva · Leptospirose · Leishmaniose · Hantavirose · CCZ · Vacinação Animal · FMS Apuí/AM</p>
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
              <KPI label="Raiva animal 2025"           value={`${dashRaw.raiva_animais_confirmada_2025} focos`}      color={WARN} sub={`vacinação canina: ${dashRaw.caes_vacinados_antirabico_pct}% (meta 80%)`} />
              <KPI label="Leptospirose 2025"           value={`${dashRaw.leptospirose_casos_2025} casos`}           color={CRIT} sub={`${dashRaw.leptospirose_obitos_2025} óbitos · ${dashRaw.leptospirose_taxa_100k}/100k`} />
              <KPI label="Leishmaniose Visceral 2025"  value={`${dashRaw.leishmaniose_visceral_casos_2025} casos`}  color={CRIT} sub={`${dashRaw.leishmaniose_obitos_2025} óbitos · cão positivo: ${dashRaw.leishmaniose_cao_positivo_pct}%`} />
              <KPI label="Hantavirose 2025"            value={`${dashRaw.hantavirose_casos_2025} casos`}            color={CRIT} sub={`${dashRaw.hantavirose_obitos_2025} óbitos (50% letald.)`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="CCZ no município"            value={dashRaw.ccz_apui ? "Ativo" : "Inexistente"}          color={CRIT} sub="2 AGVs vs necessidade de 8" />
              <KPI label="Cães errantes estimados"     value={dashRaw.caes_errantes_estimados.toLocaleString()}    color={CRIT} sub={`${dashRaw.castracoes_sus_2025} castrações (meta ${dashRaw.meta_castracoes_ano})`} />
              <KPI label="Leishmaniose Tegumentar"     value={`${dashRaw.leishmaniose_tegumentar_casos_2025} casos`} color={CRIT} sub="garimpeiros e rurais" />
              <KPI label="Brucelose 2025"              value={`${dashRaw.brucelose_casos_2025} casos`}             color={WARN} sub="trabalhadores rurais" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Controle Vetorial — Situação Atual</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Vacinação antirrábica canina (${dashRaw.caes_vacinados_antirabico_pct}% / meta 80%)`,  value: dashRaw.caes_vacinados_antirabico_pct, max: 100, color: CRIT },
                    { label: `Vacinação antirrábica felina (${dashRaw.gatos_vacinados_antirabico_pct}% / meta 80%)`, value: dashRaw.gatos_vacinados_antirabico_pct, max: 100, color: CRIT },
                    { label: `Castrações (${dashRaw.castracoes_sus_2025}/${dashRaw.meta_castracoes_ano} = 10%)`,     value: dashRaw.castracoes_sus_2025, max: dashRaw.meta_castracoes_ano, color: CRIT },
                    { label: `AGVs (${dashRaw.agente_controle_zoonoses}/${dashRaw.meta_agente_controle_zoonoses})`, value: dashRaw.agente_controle_zoonoses, max: dashRaw.meta_agente_controle_zoonoses, color: CRIT },
                    { label: `Profilaxia antirrábica completa (${dashRaw.profilaxia_antirabica_completa_pct}% / 100%)`, value: dashRaw.profilaxia_antirabica_completa_pct, max: 100, color: WARN },
                  ].map((b: any) => (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{b.label}</span>
                      </div>
                      <ProgressBar value={b.value} max={b.max} color={b.color} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex flex-col gap-2 justify-center">
                <p><b>Leptospirose 170/100k = 11,3× média BR</b> — 42 casos + 3 óbitos em 2025. Lixão + esgoto a céu aberto = 62.400 ratos estimados. Doxiciclina profilática em enchentes: R$ 4.200 = 80% de redução. Custo das hospitalizações evitáveis: R$ 94k/ano.</p>
                <p><b>Hantavirose: 50% de letalidade</b> — 2 de 4 mortos no transporte para Manaus (sem UTI no HMM). Prevenção: orientação de garimpeiros sobre roedores silvestres = custo R$ 0 via ACS. Surto de 2023 (8 casos): ausência de protocolo de resposta.</p>
                <p><b>Vacinação canina em 48,4% (meta 80%)</b> — 4 focos de raiva animal em 2025. 2.840 cães errantes sem vacinação. Campanha rural: zero ponto de vacinação. CCZ: inexistente. Castração: 10% da meta (84 de 840). UFAM/CRMV-AM: parceria de custo zero disponível.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "doencas" && Array.isArray(doencas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Casos de Zoonoses em Humanos — Apuí/AM 2025</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(doencas as any[])} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="doenca" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="casos_humanos_2025" name="Casos humanos" radius={[4,4,0,0]}>
                    {(doencas as any[]).map((d: any, i: number) => <Cell key={i} fill={statusColor(d.status)} />)}
                  </Bar>
                  <Bar dataKey="obitos" name="Óbitos" fill={BRAND} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(doencas as any[]).map((d: any) => (
                <div key={d.doenca} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(d.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{d.doenca}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <span className="font-bold text-slate-700">{d.casos_humanos_2025} casos humanos</span>
                      {d.obitos > 0 && <span className="ml-1 font-bold text-red-700">· {d.obitos} óbito(s)</span>}
                      {d.casos_animais_2025 > 0 && <p className="text-xs text-slate-400">{d.casos_animais_2025} casos animais</p>}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{d.observacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "acoes" && Array.isArray(acoes) && (
          <div className="grid gap-3">
            {(acoes as any[]).map((a: any) => (
              <div key={a.acao} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: a.implementada ? OK : CRIT }} />
                    <p className="font-semibold text-sm text-slate-700">{a.acao}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {a.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    {a.cobertura_atual_pct != null && <p className="text-xs mt-0.5">{a.cobertura_atual_pct}% / meta {a.meta_pct}%</p>}
                    {a.custo > 0 && <p className="text-xs text-slate-400">R$ {a.custo.toLocaleString()} · {a.prazo_meses}m</p>}
                    {a.custo === 0 && <p className="text-xs text-green-600">custo R$ 0 · {a.prazo_meses}m</p>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Zoonoses — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="leptospirose"     name="Leptospirose"       stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="lv_casos"         name="LV (calazar)"       stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="hantavirose"      name="Hantavirose"        stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="vacina_caes_pct"  name="Vacina cão (%)"     stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
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
