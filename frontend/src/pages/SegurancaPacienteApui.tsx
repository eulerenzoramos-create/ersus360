import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { Shield, AlertTriangle, TrendingUp, Activity } from "lucide-react";

const BRAND  = "#dbeafe";
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

export default function SegurancaPacienteApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["sp-dash"],  queryFn: () => apiGet("/api/seguranca-paciente-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: metas }       = useQuery({ queryKey: ["sp-meta"],  queryFn: () => apiGet("/api/seguranca-paciente-apui/metas"),      enabled: aba === "metas" });
  const { data: acoes }       = useQuery({ queryKey: ["sp-acao"],  queryFn: () => apiGet("/api/seguranca-paciente-apui/acoes"),      enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["sp-hist"],  queryFn: () => apiGet("/api/seguranca-paciente-apui/historico"), enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["sp-ind"],   queryFn: () => apiGet("/api/seguranca-paciente-apui/indicadores"),enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",  icon: <Shield size={15}/> },
    { key: "metas",       label: "Protocolos", icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",      icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",  icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Shield size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Segurança do Paciente — Apuí/AM</h1>
            <p className="text-sm text-slate-500">NSP · Checklist OMS · Higiene das Mãos · IRAS · Queda Hospitalar · NOTIVISA · RDC 36/2013 · FMS Apuí/AM</p>
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
              <KPI label="Eventos adversos 2025 (EA)"         value={`${dashRaw.eventos_adversos_2025} notif.`}       color={CRIT} sub={`grave: ${dashRaw.eventos_adversos_graves_2025} · óbito: ${dashRaw.obito_evento_adverso_2025} · real estimado: ×${dashRaw.subnotificacao_ea_estimativa}`} />
              <KPI label="IRAS — taxa infecção hosp. (meta: < 5%)" value={`${dashRaw.iras_taxa_pct}%`}                color={CRIT} sub={`higiene mãos: ${dashRaw.higiene_maos_pct}% (meta 80%) · R$ 2,72M/ano em IRAS`} />
              <KPI label="Checklist cirúrgico OMS (meta: 100%)" value={`${dashRaw.checklist_cirurgico_uso_pct}%`}     color={CRIT} sub={`${dashRaw.cirurgias_apui_2025} cirurgias/ano · compl.: ${dashRaw.complicacao_cirurgica_pct}% (-47% com checklist)`} />
              <KPI label="NSP — Núcleo Segurança do Paciente"  value={dashRaw.nucleo_seguranca_paciente ? "Implantado" : "Ausente"} color={CRIT} sub="RDC 36/2013 obrigatório · auto-infração ANVISA: R$ 2k-75k" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Pulseira identificação (meta: 100%)" value={`${dashRaw.pulseira_identificacao_pct}%`}       color={CRIT} sub={`${dashRaw.erro_medicacao_2025} erros medicação (${dashRaw.erro_medicacao_grave_2025} graves) 2025`} />
              <KPI label="Avaliação risco queda hosp. (meta: 100%)" value={`${dashRaw.avaliacao_risco_queda_hospitalar_pct}%`} color={CRIT} sub={`${dashRaw.queda_hospitalar_2025} quedas · ${dashRaw.queda_com_dano_2025} com dano`} />
              <KPI label="Lesão por pressão (meta: < 3%)"      value={`${dashRaw.lesao_pressao_incidencia_pct}%`}    color={CRIT} sub={`protocolo lesão: ${dashRaw.protocolo_lesao_pressao ? "SIM" : "NÃO"} · 1 lesão g4: R$ 84.000`} />
              <KPI label="Custo estimado eventos adversos/ano" value={`R$ ${((dashRaw.custo_evento_adverso_estimado||0)/1e6).toFixed(1)}M`} color={CRIT} sub="42 eventos adversos × custo médio R$ 48k = custo prevenível" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Protocolos de Segurança — Adesão Atual</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Checklist cirúrgico OMS", val: dashRaw.checklist_cirurgico_uso_pct, meta: 100 },
                    { label: "Higiene das mãos",        val: dashRaw.higiene_maos_pct,            meta: 80  },
                    { label: "Pulseira identificação",  val: dashRaw.pulseira_identificacao_pct,  meta: 100 },
                    { label: "Avaliação queda (Morse)", val: dashRaw.avaliacao_risco_queda_hospitalar_pct, meta: 100 },
                    { label: "Notificação EA (NOTIVISA)",val: dashRaw.notificacao_ea_pct,         meta: 100 },
                    { label: "IRAS — meta < 5%",        val: 100 - dashRaw.iras_taxa_pct * 10,   meta: 95  },
                  ].map((f: any) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className="text-slate-600 w-44 text-xs">{f.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${Math.min(Math.max(f.val, 0), 100)}%`, background: f.val >= f.meta * 0.8 ? OK : CRIT }} />
                      </div>
                      <span className="font-bold text-xs" style={{ color: f.val >= f.meta * 0.8 ? OK : CRIT }}>{f.val}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>NSP: zero em Apuí</b> (obrigatório por RDC ANVISA 36/2013). 42 eventos adversos em 2025 — 4 notificados (9,5%). Subnotificação 10:1 = ~420 EA reais. Auto-infração ANVISA: R$ 2k-75k. NSP: redesignação de função existente = R$ 0. Prazo: 30 dias.</p>
                <p><b>IRAS 12,4%</b> (meta &lt; 5%). Higiene das mãos: 38,4% (meta 80%). Álcool gel 70% em todos os pontos: R$ 4.200/ano. IRAS custo: R$ 2,72M/ano. ROI álcool gel: 648:1. Checklist OMS cirúrgico: 18,4% (meta 100%) — R$ 0, -47% complicações cirúrgicas.</p>
                <p><b>28 quedas hospitalares em 2025</b> (8 com dano). Escala de Morse: R$ 0. Grade lateral: R$ 2.800. Lesão por pressão: 8,4% (meta &lt; 3%). Braden: R$ 0. Mudança de decúbito: R$ 0. 28 erros de medicação (4 graves) — pulseira: R$ 2.876/ano elimina 80% dos erros.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "metas" && Array.isArray(metas) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={metas as any[]} margin={{ top: 5, right: 20, bottom: 80, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="meta" tick={{ fontSize: 7 }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="valor"      name="Adesão atual (%)" radius={[4,4,0,0]}>
                  {(metas as any[]).map((m: any, i: number) => <Cell key={i} fill={m.atingida ? OK : CRIT} />)}
                </Bar>
                <Bar dataKey="valor_meta" name="Meta (%)"          radius={[4,4,0,0]} fill={ACCENT} opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(metas as any[]).map((m: any) => (
                <div key={m.meta} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: m.atingida ? OK : CRIT }} />
                      <p className="font-semibold text-sm text-slate-700">{m.meta}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.atingida ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {m.atingida ? "Atingida" : "Não atingida"}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">{m.valor}% / meta {m.valor_meta}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{m.observacao}</p>
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
                  <div className="text-right text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${a.implementada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {a.implementada ? "Implementada" : "Não implementada"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">R$ {(a.custo||0).toLocaleString()} · {a.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Segurança do Paciente — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left"  dataKey="eventos_adversos"  name="Eventos adversos"     stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" dataKey="checklist_pct"     name="Checklist OMS (%)"    stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line yAxisId="right" dataKey="higiene_maos_pct"  name="Higiene mãos (%)"     stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="2 2" />
                <Line yAxisId="left"  dataKey="notificados"       name="EA notificados"        stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left"  dataKey="queda_hospitalar"  name="Quedas hospitalares"  stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 2" />
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
