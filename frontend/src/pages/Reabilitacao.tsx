import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { UserCheck, AlertTriangle, Users, Activity } from "lucide-react";

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

const MOD_COLORS = ["#2563eb","#7c3aed","#0891b2","#d97706","#16a34a"];
const DEF_COLORS = ["#2563eb","#7c3aed","#d97706","#0891b2","#dc2626","#16a34a"];

export default function Reabilitacao() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["reab-dashboard"],
    queryFn: () => apiGet("/api/reabilitacao/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: modalidades } = useQuery({
    queryKey: ["reab-modalidades"],
    queryFn: () => apiGet("/api/reabilitacao/modalidades"),
    enabled: aba === "modalidades",
  });
  const { data: pcd } = useQuery({
    queryKey: ["reab-pcd"],
    queryFn: () => apiGet("/api/reabilitacao/pcd-cadastros"),
    enabled: aba === "pcd",
  });
  const { data: historico } = useQuery({
    queryKey: ["reab-historico"],
    queryFn: () => apiGet("/api/reabilitacao/historico"),
    enabled: aba === "historico",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["reab-indicadores"],
    queryFn: () => apiGet("/api/reabilitacao/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <UserCheck size={15}/> },
    { key: "modalidades", label: "Modalidades", icon: <Users size={15}/> },
    { key: "pcd",         label: "PCD",         icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",   icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores", icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <UserCheck size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Reabilitação / PCD</h1>
            <p className="text-sm text-slate-500">Fisioterapia · TO · Fono · Órteses · BPC · FMS Apuí/AM</p>
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
              <KPI label="PCD Cadastrados"       value={dashRaw.pcd_cadastrados?.toLocaleString()} />
              <KPI label="Em Reabilitação"       value={dashRaw.pacientes_reab_ativos?.toLocaleString()} color={ACCENT} />
              <KPI label="Lista de Espera"       value={dashRaw.lista_espera_total.toString()} color={CRIT} />
              <KPI label="Sessões/Mês"           value={dashRaw.sessoes_mes?.toLocaleString()} color={ACCENT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="CER Municipal"         value={dashRaw.cer_municipal ? "Sim" : "NÃO"} color={CRIT} />
              <KPI label="Órteses/Próteses Pend." value={dashRaw.ortese_protese_pendente.toString()} sub="PCD sem dispositivo" color={CRIT} />
              <KPI label="BPC Beneficiários"     value={dashRaw.bpc_beneficiarios.toString()} color={OK} />
              <KPI label="Altas/Mês"             value={dashRaw.alta_mes.toString()} color={OK} />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>Sem CER municipal</b> — reabilitação especializada via referência. {dashRaw.lista_espera_total} pacientes em espera. {dashRaw.ortese_protese_pendente} PCD aguardam órtese/prótese. Fisioterapia: 42 dias de espera (meta 15d).
            </div>
          </div>
        )}

        {aba === "modalidades" && Array.isArray(modalidades) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Ativos vs Lista de Espera por Modalidade</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={modalidades} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="modalidade" tick={{ fontSize: 9 }} width={200} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pacientes_ativos" name="Ativos"      fill={ACCENT} radius={[0,3,3,0]} />
                  <Bar dataKey="lista_espera"     name="Lista Espera" fill={CRIT}   radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(modalidades as any[]).map((m: any, i: number) => (
                <div key={m.modalidade} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: MOD_COLORS[i % MOD_COLORS.length] }} />
                      <span className="font-semibold text-slate-700 text-sm">{m.modalidade}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(m.status) }}>
                      Espera: {m.lista_espera} · {m.tempo_espera_dias}d
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                    <span>Ativos: <b>{m.pacientes_ativos}</b></span>
                    <span>Sessões/mês: <b>{m.sessoes_mes}</b></span>
                    <span>Profissionais: <b>{m.profissionais}</b></span>
                    <span style={{ color: OK }}>Altas/mês: <b>{m.alta_mes}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "pcd" && Array.isArray(pcd) && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">PCD Cadastrados por Tipo de Deficiência</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={pcd} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="tipo_deficiencia" tick={{ fontSize: 9 }} width={210} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cadastrados"          name="Cadastrados"   fill={ACCENT} radius={[0,3,3,0]} />
                  <Bar dataKey="ortese_protese_entregue" name="Disp. Entregue" fill={OK}  radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {(pcd as any[]).map((p: any, i: number) => (
                <div key={p.tipo_deficiencia} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: DEF_COLORS[i % DEF_COLORS.length] }} />
                      <span className="font-semibold text-slate-700 text-sm">{p.tipo_deficiencia}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: statusColor(p.status) }}>
                      {p.cadastrados} cadastrados
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                    <span style={{ color: OK }}>BPC: <b>{p.beneficio_bpc}</b></span>
                    {p.ortese_protese_indicada > 0 && (
                      <>
                        <span>Disp. indicado: <b>{p.ortese_protese_indicada}</b></span>
                        <span style={{ color: p.ortese_protese_entregue < p.ortese_protese_indicada ? CRIT : OK }}>
                          Entregue: <b>{p.ortese_protese_entregue}</b>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Mensal (2026)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="n"    tick={{ fontSize: 11 }} />
                <YAxis yAxisId="esp"  orientation="right" domain={[370, 420]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="n"   dataKey="sessoes_total"      name="Sessões Totais"    stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="novos_pacientes"    name="Novos Pacientes"   stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="n"   dataKey="altas"              name="Altas"             stroke={OK}     strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="esp" dataKey="lista_espera_total" name="Lista Espera"      stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
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
