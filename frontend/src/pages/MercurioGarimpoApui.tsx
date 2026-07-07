import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { FlaskConical, AlertTriangle, TrendingUp, Activity } from "lucide-react";

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

export default function MercurioGarimpoApui() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash }        = useQuery({ queryKey: ["hg-dash"],  queryFn: () => apiGet("/api/mercurio-garimpo-apui/dashboard"),          enabled: aba === "dashboard" });
  const { data: populacoes }  = useQuery({ queryKey: ["hg-pop"],   queryFn: () => apiGet("/api/mercurio-garimpo-apui/populacoes-expostas"),enabled: aba === "populacoes" });
  const { data: acoes }       = useQuery({ queryKey: ["hg-acao"],  queryFn: () => apiGet("/api/mercurio-garimpo-apui/acoes"),              enabled: aba === "acoes" });
  const { data: historico }   = useQuery({ queryKey: ["hg-hist"],  queryFn: () => apiGet("/api/mercurio-garimpo-apui/historico"),          enabled: aba === "historico" });
  const { data: indicadores } = useQuery({ queryKey: ["hg-ind"],   queryFn: () => apiGet("/api/mercurio-garimpo-apui/indicadores"),        enabled: aba === "indicadores" });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",   label: "Dashboard",         icon: <FlaskConical size={15}/> },
    { key: "populacoes",  label: "Populações Expostas",icon: <Activity size={15}/> },
    { key: "acoes",       label: "Ações",              icon: <AlertTriangle size={15}/> },
    { key: "historico",   label: "Histórico",          icon: <TrendingUp size={15}/> },
    { key: "indicadores", label: "Indicadores",        icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <FlaskConical size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Mercúrio e Garimpo — Apuí/AM</h1>
            <p className="text-sm text-slate-500">Contaminação · Ribeirinhos · Crianças · Garimpo Ilegal · Dano Neurológico · FIOCRUZ · FMS Apuí/AM</p>
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
              <KPI label="Mercúrio nos ribeirinhos"    value={`${dashRaw.nivel_mercurio_cabelo_ribeirinhos_ug_g} µg/g`}  color={CRIT} sub={`${dashRaw.vezes_acima_oms}× acima da OMS`} />
              <KPI label="Ribeirinhos expostos"        value={dashRaw.ribeirinhos_expostos_mercurio.toLocaleString()}     color={CRIT} sub="exposição crônica" />
              <KPI label="Crianças com Hg elevado"     value={dashRaw.danos_neurologicos_criancas_estimados}              color={CRIT} sub={`${dashRaw.criancas_nivel_mercurio_elevado_pct}% das ribeirinhas`} />
              <KPI label="Garimpos ilegais ativos"     value={dashRaw.garimpos_ilegais_ativos}                            color={CRIT} sub={`${dashRaw.area_garimpo_hectares.toLocaleString()} hectares`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Mercúrio lançado/ano"        value={`${dashRaw.mercurio_liberado_kg_ano} kg`}               color={CRIT} sub="nos rios de Apuí" />
              <KPI label="Perda de QI (crianças)"      value={`${dashRaw.perda_qi_pontos_media} pontos/criança`}      color={CRIT} sub="dano neurológico estimado" />
              <KPI label="Dosagem Hg disponível SUS"   value="Não"                                                    color={CRIT} sub="zero exames em 2025" />
              <KPI label="Custo social anual"          value={`R$ ${(dashRaw.custo_social_mercurio_anual/1000000).toFixed(1)}M`} color={CRIT} sub="potencial produtivo perdido" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-3">Nível de Mercúrio por Grupo (µg/g) vs Limite OMS (0,05)</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: `Garimpeiros: ${dashRaw.nivel_mercurio_cabelo_ribeirinhos_ug_g*2}× limite`,  value: dashRaw.nivel_mercurio_cabelo_ribeirinhos_ug_g*2,  max: 100, color: CRIT },
                    { label: `Ribeirinhos adultos: ${dashRaw.nivel_mercurio_cabelo_ribeirinhos_ug_g}× limite`, value: dashRaw.nivel_mercurio_cabelo_ribeirinhos_ug_g, max: 100, color: CRIT },
                    { label: `Crianças ribeirinhas: ${dashRaw.criancas_nivel_mercurio_elevado_pct}% afetadas`, value: dashRaw.criancas_nivel_mercurio_elevado_pct, max: 100, color: CRIT },
                    { label: `Gestantes: ${dashRaw.gestantes_nivel_mercurio_elevado_pct}% acima do limite`, value: dashRaw.gestantes_nivel_mercurio_elevado_pct, max: 100, color: CRIT },
                    { label: `Peixes contaminados: ${dashRaw.peixes_contaminados_especies_pct}% das espécies`, value: dashRaw.peixes_contaminados_especies_pct, max: 100, color: WARN },
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
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex flex-col gap-2 justify-center">
                <p><b>848× acima do limite OMS</b> — 42,4 µg/g nos ribeirinhos (limite OMS: 0,05 µg/g). 284 kg de mercúrio lançados nos rios de Apuí por ano por 42 garimpos ilegais. 2 óbitos em 2025 relacionados.</p>
                <p><b>842 crianças com dano neurológico ativo</b> — 84,4% das crianças ribeirinhas. Perda média de 8,4 pontos de QI por criança = 7.073 pontos de QI perdidos coletivamente. Dano irreversível após 5 anos de exposição.</p>
                <p><b>Intervenções de baixo custo disponíveis agora</b> — Cartilha de peixe seguro: R$ 4.800 (reduz exposição 40-60% em 6 meses). Dosagem LACEN-AM: R$ 28/pessoa. Ação MPF contra garimpo: R$ 0 para o município.</p>
              </div>
            </div>
          </div>
        )}

        {aba === "populacoes" && Array.isArray(populacoes) && (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={populacoes as any[]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="grupo" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="expostos" name="Expostos" radius={[4,4,0,0]}>
                  {(populacoes as any[]).map((_: any, i: number) => <Cell key={i} fill={CRIT} />)}
                </Bar>
                <Bar dataKey="nivel_mercurio_medio_ug_g" name="Hg médio (µg/g)" radius={[4,4,0,0]} fill={WARN} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid gap-3">
              {(populacoes as any[]).map((p: any) => (
                <div key={p.grupo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: statusColor(p.status) }} />
                      <p className="font-semibold text-sm text-slate-700">{p.grupo}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold" style={{ color: statusColor(p.status) }}>{p.expostos.toLocaleString()} expostos</span>
                      <span className="text-slate-400"> · {p.nivel_mercurio_medio_ug_g} µg/g</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 ml-5">{p.observacao}</p>
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
                    <p className="text-xs text-slate-400 mt-0.5">R$ {a.custo.toLocaleString()} · {a.prazo_meses}m</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 ml-5">{a.observacao}</p>
              </div>
            ))}
          </div>
        )}

        {aba === "historico" && Array.isArray(historico) && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-4">Evolução Contaminação por Mercúrio — Apuí/AM (2022–2025)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="nivel_mercurio_medio"  name="Hg médio (µg/g)"    stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="criancas_afetadas"     name="Crianças afetadas"  stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                <Line dataKey="area_garimpo_ha"       name="Área garimpo (ha)"  stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} />
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
