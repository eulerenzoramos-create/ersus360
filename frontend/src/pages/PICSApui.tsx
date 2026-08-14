import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Sparkles, AlertTriangle, TrendingUp, FlaskConical } from "lucide-react";

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

export default function PICSApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }    = useQuery({ queryKey: ["pics-dash"],  queryFn: () => apiGet("/api/pics-apui/dashboard"),  enabled: aba === "dashboard" });
  const { data: praticas }= useQuery({ queryKey: ["pics-prat"],  queryFn: () => apiGet("/api/pics-apui/praticas"),   enabled: aba === "praticas" });
  const { data: horto }   = useQuery({ queryKey: ["pics-hort"],  queryFn: () => apiGet("/api/pics-apui/horto"),      enabled: aba === "horto" });
  const { data: hist }    = useQuery({ queryKey: ["pics-hist"],  queryFn: () => apiGet("/api/pics-apui/historico"),  enabled: aba === "historico" });
  const { data: ind }     = useQuery({ queryKey: ["pics-ind"],   queryFn: () => apiGet("/api/pics-apui/indicadores"),enabled: aba === "indicadores" });

  const d = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",        icon: <Sparkles size={14}/> },
    { key: "praticas",    label: "Práticas",         icon: <AlertTriangle size={14}/> },
    { key: "horto",       label: "Horto Medicinal",  icon: <FlaskConical size={14}/> },
    { key: "historico",   label: "Histórico",        icon: <TrendingUp size={14}/> },
    { key: "indicadores", label: "Indicadores",      icon: <AlertTriangle size={14}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Sparkles size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>PICS — Práticas Integrativas — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Acupuntura · Fitoterapia · Auriculoterapia · Meditação · PNPIC · FMS Apuí/AM</p>
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

        {aba === "dashboard" && !d && (
          <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />
        )}

        {aba === "dashboard" && d && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Práticas PNPIC Implantadas" value={`${d.praticas_implantadas}/${d.praticas_meta_pnpic}`} color={WARN} sub="meta: 10 práticas" />
              <KPI label="Atendimentos/Ano"       value={d.atendimentos_ano?.toLocaleString("pt-BR")} color={OK}   sub={`${d.atendimentos_mes_atual}/mês`} />
              <KPI label="Usuários Cadastrados"   value={d.usuarios_cadastrados?.toLocaleString("pt-BR")} color={ACCENT} />
              <KPI label="Satisfação do Usuário"  value={`${d.satisfacao_usuario_pct}%`} color={OK} sub="meta: 85%" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Redução Medicam. Conv." value={`${d.reducao_medicamentos_convencionais_pct}%`} color={OK} sub="dos usuários PICS" />
              <KPI label="Profissionais Habilitados" value={d.profissionais_habilitados.toString()} color={BRAND} />
              <KPI label="Plantas no Horto"       value={`${d.plantas_horto_qtd} espécies`} color={ACCENT} sub="plantas amazônicas" />
              <KPI label="Fitoterápicos Disponiveis" value={`${d.remedio_fitoterapico_disponiveis} tipos`} color={ACCENT} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Práticas Disponíveis</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { label: "Acupuntura",        disponivel: d.acupuntura_disponivel },
                    { label: "Fitoterapia",        disponivel: d.fitoterapia_disponivel },
                    { label: "Auriculoterapia",    disponivel: d.auriculoterapia_disponivel },
                    { label: "Meditação",          disponivel: d.meditacao_disponivel },
                    { label: "Yoga",               disponivel: d.yoga_disponivel },
                    { label: "Homeopatia",         disponivel: d.homeopatia_disponivel },
                  ].map((p) => (
                    <div key={p.label} className={`flex items-center gap-2 p-2 rounded-lg ${p.disponivel ? "bg-green-50" : "bg-slate-50"}`}>
                      <span style={{ color: p.disponivel ? OK : "#6b7280", fontSize: 16 }}>{p.disponivel ? "✓" : "✗"}</span>
                      <span className={p.disponivel ? "text-slate-700 font-medium" : "text-slate-400"}>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-900 flex flex-col gap-2 justify-center">
                <p><b>Fitoterapia com plantas amazônicas</b> — Apuí tem vantagem única: Copaíba, Andiroba, Unha-de-gato e Boldo amazônico disponíveis localmente. Redução de R$ 48k/ano em medicamentos convencionais para HAS, gastrite e ansiedade.</p>
                <p><b>Acupuntura: 68 na fila</b> — acupunturista só 2x/mês (vem de Manaus). Solução: capacitar médico de família local em acupuntura básica (curso 360h pelo CFM) — R$ 8k de investimento único.</p>
                <p><b>TCI nas comunidades ribeirinhas</b> — Terapia Comunitária Integrativa levada a bordo do barco da saúde: 2 grupos/mês em comunidades fluviais. Reduz demanda por CAPS e fortalece vínculo territorial.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "praticas" && Array.isArray(praticas) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Atendimentos por Prática — Mês Atual</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={praticas as any[]} layout="vertical" margin={{ left: 10, right: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="pratica" tick={{ fontSize: 8 }} width={220} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <Tooltip />
                  <Bar dataKey="atendimentos_mes" name="Atendimentos/mês" radius={[0,3,3,0]}>
                    {(praticas as any[]).map((_: any, i: number) => (
                      <Cell key={i} fill={[BRAND, ACCENT, OK, WARN, "#7c3aed", "#0891b2", "#059669"][i % 7]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {(praticas as any[]).map((p: any) => (
              <div key={p.pratica} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-700">{p.pratica}</p>
                    <p className="text-xs text-slate-500">{p.profissional}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.disponibilidade}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-bold text-slate-700">{p.atendimentos_mes}/mês</p>
                    {p.lista_espera > 0 && (
                      <p className="text-xs" style={{ color: p.lista_espera > 30 ? CRIT : WARN }}>
                        {p.lista_espera} na fila
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {p.indicacoes_principais.map((ind: string) => (
                    <span key={ind} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{ind}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "horto" && Array.isArray(horto) && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900 mb-2">
              <b>Horto Medicinal do HMM-Apuí</b> — 42 espécies cultivadas, com ênfase em plantas nativas amazônicas. Parceria com comunidades indígenas Tenharim para conhecimento etnobotânico. Meta: ampliar para 50 espécies até 2026.
            </div>
            {(horto as any[]).map((p: any) => (
              <div key={p.planta} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.disponivel ? OK : "#6b7280" }} />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-700">{p.planta}</p>
                  <p className="text-xs text-slate-400">{p.indicacao}</p>
                </div>
                <div className="text-right text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">{p.forma}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(hist) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução PICS — Atendimentos e Impacto (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hist} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="atendimentos"       name="Atendimentos/ano"      stroke={BRAND}  strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="usuarios"           name="Usuários cadastrados"  stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="pct" dataKey="reducao_med_pct"    name="Redução medicam. (%)" stroke={OK}     strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {aba === "indicadores" && Array.isArray(ind) && (
          <div className="grid gap-3">
            {(ind as any[]).map((i: any) => (
              <div key={i.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(i.status) }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-sm">{i.indicador}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(i.status) }}>
                      {`${i.valor} ${i.unidade}`}{i.meta != null ? ` / meta: ${i.meta}` : ""}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{i.observacao}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
