import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Activity, AlertTriangle, MapPin, Users } from "lucide-react";

const BRAND  = "#065f46";
const ACCENT = "#10b981";
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

export default function AcademiaSaude() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["academia-saude-dashboard"],
    queryFn: () => apiGet("/api/academia-saude/dashboard"),
    enabled: aba === "dashboard",
  });

  const { data: polos } = useQuery({
    queryKey: ["academia-saude-polos"],
    queryFn: () => apiGet("/api/academia-saude/polos"),
    enabled: aba === "polos",
  });

  const { data: grupos } = useQuery({
    queryKey: ["academia-saude-grupos"],
    queryFn: () => apiGet("/api/academia-saude/grupos-especiais"),
    enabled: aba === "grupos",
  });

  const { data: historico } = useQuery({
    queryKey: ["academia-saude-historico"],
    queryFn: () => apiGet("/api/academia-saude/historico"),
    enabled: aba === "historico",
  });

  const { data: indicadores } = useQuery({
    queryKey: ["academia-saude-indicadores"],
    queryFn: () => apiGet("/api/academia-saude/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",   icon: <Activity size={15}/> },
    { key: "polos",       label: "Polos",        icon: <MapPin size={15}/> },
    { key: "grupos",      label: "Grupos Espec.", icon: <Users size={15}/> },
    { key: "historico",   label: "Histórico",    icon: <Activity size={15}/> },
    { key: "indicadores", label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <Activity size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Academia da Saúde</h1>
            <p className="text-sm text-slate-500">PNPS · Atividade Física · Práticas Corporais · FMS Apuí/AM</p>
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

        {/* Dashboard */}
        {aba === "dashboard" && dashRaw && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Usuários Ativos/Mês" value={dashRaw.usuarios_ativos_mes.toLocaleString()} sub={`meta: ${dashRaw.meta_usuarios_2026.toLocaleString()}`} color={WARN} />
              <KPI label="Cadastrados"         value={dashRaw.usuarios_cadastrados.toLocaleString()} />
              <KPI label="Polos Ativos"        value={`${dashRaw.polos_ativos}/${dashRaw.polos_cadastrados}`} color={dashRaw.polos_ativos < dashRaw.polos_cadastrados ? WARN : OK} />
              <KPI label="Grupos Especiais"    value={dashRaw.grupos_especiais.toString()} sub="usuários em grupos" color={ACCENT} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Freq. Média/Semana"  value={`${dashRaw.frequencia_media_semana}×`} sub="meta: 4×/sem" color={WARN} />
              <KPI label="Modalidades"         value={dashRaw.modalidades_ofertadas.toString()} />
              <KPI label="Prof. Ed. Física"    value={`${dashRaw.profissionais_ef_vinculados}/${dashRaw.profissionais_ef_meta}`} color={dashRaw.polos_ativos < dashRaw.polos_cadastrados ? WARN : OK} />
              <KPI label="Custo Mensal"        value={`R$${dashRaw.custo_mensal.toLocaleString("pt-BR",{minimumFractionDigits:0})}`} />
            </div>
            {dashRaw.polo_inativo > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle size={18} color={WARN} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800">Polo Vila Progresso inativo desde Mar/2026</p>
                  <p className="text-sm text-amber-700 mt-1">Sem Profissional de Educação Física — vaga em processo seletivo. 112 usuários cadastrados sem atendimento.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Polos */}
        {aba === "polos" && Array.isArray(polos) && (
          <div className="grid gap-4">
            {(polos as any[]).map((p: any) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
                style={{ borderLeft: `4px solid ${p.status === "ativo" ? OK : CRIT}` }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-700">{p.nome}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: (p.status === "ativo" ? OK : CRIT) + "22", color: p.status === "ativo" ? OK : CRIT }}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{p.localizacao} · {p.area_m2} m²</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: ACCENT }}>{p.usuarios_ativos}</p>
                    <p className="text-xs text-slate-400">ativos / {p.usuarios_cadastrados} cadastr.</p>
                  </div>
                </div>
                {p.status === "ativo" && (
                  <>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {p.modalidades.map((m: string) => (
                        <span key={m} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{m}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs text-slate-500">
                      <span>Prof.: <b>{p.profissional_ef}</b></span>
                      <span>CH: <b>{p.carga_horaria}h/sem</b></span>
                      <span>Freq.: <b>{p.frequencia_media}×/sem</b></span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{p.horarios}</p>
                  </>
                )}
                {p.status === "inativo" && (
                  <p className="text-sm text-red-600 font-medium">{p.horarios}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Grupos Especiais */}
        {aba === "grupos" && Array.isArray(grupos) && (
          <div className="grid gap-3">
            {(grupos as any[]).map((g: any) => (
              <div key={g.grupo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700">{g.grupo}</span>
                  <span className="font-bold text-lg" style={{ color: ACCENT }}>{g.usuarios} usuários</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-500">
                  <span>Polo: <b>{g.polo}</b></span>
                  <span>Prof.: <b>{g.profissional}</b></span>
                  <span>Dias: <b>{g.dias}</b></span>
                  <span>Horário: <b>{g.horario}</b></span>
                </div>
                {g.encaminhamentos_ubs && (
                  <p className="text-xs text-emerald-600 mt-2 font-medium">Integrado à UBS — encaminhamento e retorno programado</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Histórico */}
        {aba === "historico" && Array.isArray(historico) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Usuários Ativos e Novas Matrículas (2026)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="at" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="mat" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="at"  dataKey="usuarios_ativos"  name="Ativos"           stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="mat" dataKey="novas_matriculas"  name="Novas Matrículas" stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Indicadores */}
        {aba === "indicadores" && Array.isArray(indicadores) && (
          <div className="grid gap-3">
            {(indicadores as any[]).map((ind: any) => (
              <div key={ind.indicador} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
                <div className="mt-1 w-3 h-3 rounded-full flex-shrink-0" style={{ background: statusColor(ind.status) }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 text-sm">{ind.indicador}</span>
                    <span className="font-bold text-sm" style={{ color: statusColor(ind.status) }}>
                      {`${ind.valor} ${ind.unidade}`} {ind.meta !== null && ind.meta !== undefined ? `/ meta: ${ind.meta} ${ind.unidade}` : ""}
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
