import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { UserCog, AlertTriangle, Users, Activity } from "lucide-react";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";

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

export default function GestaoPessoas() {
  const [aba, setAba] = useState("dashboard");

  const { data: dash } = useQuery({
    queryKey: ["gp-dashboard"],
    queryFn: () => apiGet("/api/gestao-pessoas/dashboard"),
    enabled: aba === "dashboard",
  });
  const { data: cargos } = useQuery({
    queryKey: ["gp-cargos"],
    queryFn: () => apiGet("/api/gestao-pessoas/cargos"),
    enabled: aba === "cargos",
  });
  const { data: afastamentos } = useQuery({
    queryKey: ["gp-afastamentos"],
    queryFn: () => apiGet("/api/gestao-pessoas/afastamentos"),
    enabled: aba === "afastamentos",
  });
  const { data: absenteismo } = useQuery({
    queryKey: ["gp-absenteismo"],
    queryFn: () => apiGet("/api/gestao-pessoas/absenteismo"),
    enabled: aba === "absenteismo",
  });
  const { data: indicadores } = useQuery({
    queryKey: ["gp-indicadores"],
    queryFn: () => apiGet("/api/gestao-pessoas/indicadores"),
    enabled: aba === "indicadores",
  });

  const dashRaw = dash as any;

  const ABAS = [
    { key: "dashboard",    label: "Dashboard",    icon: <UserCog size={15}/> },
    { key: "cargos",       label: "Quadro",       icon: <Users size={15}/> },
    { key: "afastamentos", label: "Afastamentos", icon: <AlertTriangle size={15}/> },
    { key: "absenteismo",  label: "Absenteísmo",  icon: <Activity size={15}/> },
    { key: "indicadores",  label: "Indicadores",  icon: <AlertTriangle size={15}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: BRAND }}>
            <UserCog size={22} color="white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Gestão de Pessoas / RH</h1>
            <p className="text-sm text-slate-500">Quadro · Afastamentos · Absenteísmo · Folha · FMS Apuí/AM</p>
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
              <KPI label="Total RH Saúde"          value={dashRaw.total_rh.toString()} />
              <KPI label="Servidores Ativos"        value={dashRaw.servidores_ativos.toString()} color={ACCENT} />
              <KPI label="Afastados"                value={dashRaw.servidores_afastados.toString()} color={CRIT} />
              <KPI label="Contratos Temporários"    value={dashRaw.contratos_temporarios.toString()} color={WARN} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Cargos Críticos Vagos"    value={dashRaw.cargos_vagos_criticos.toString()} color={CRIT} />
              <KPI label="Estagiários"              value={dashRaw.estagiarios.toString()} />
              <KPI label="Folha Mensal"             value={BRL(dashRaw.folha_mensal_r)} color={WARN} />
              <KPI label="Folha/Receita Saúde"      value={`${dashRaw.folha_percentual_receita_saude}%`} color={dashRaw.folha_percentual_receita_saude > 60 ? CRIT : OK} sub="limite: 60%" />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <b>Folha acima do limite prudencial</b> ({dashRaw.folha_percentual_receita_saude}% vs limite 60%). {dashRaw.cargos_vagos_criticos} cargos críticos vagos — médico (4), ACS (6), fisioterapeuta (2). Alta dependência de contratos temporários ({dashRaw.contratos_temporarios} servidores).
            </div>
          </div>
        )}

        {aba === "cargos" && Array.isArray(cargos) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Lotados vs Necessários por Cargo</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cargos} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="cargo" tick={{ fontSize: 8 }} width={230} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="lotados"    name="Lotados"    fill={ACCENT} radius={[0,3,3,0]} />
                  <Bar dataKey="necessarios" name="Necessários" fill="#374151" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {(cargos as any[]).map((c: any) => (
                <div key={c.cargo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: statusColor(c.status) }} />
                    <span className="font-semibold text-slate-700 text-sm">{c.cargo}</span>
                  </div>
                  <div className="flex gap-5 text-xs text-slate-500">
                    <span>Lotados: <b>{c.lotados}</b></span>
                    <span>Necessários: <b>{c.necessarios}</b></span>
                    <span style={{ color: c.vacantes > 0 ? CRIT : OK }}>Vagos: <b>{c.vacantes}</b></span>
                    <span style={{ color: c.afastados > 0 ? WARN : "inherit" }}>Afastados: <b>{c.afastados}</b></span>
                    <span style={{ color: c.temporarios > 2 ? WARN : "inherit" }}>Temporários: <b>{c.temporarios}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === "afastamentos" && Array.isArray(afastamentos) && (
          <div className="grid gap-3">
            {(afastamentos as any[]).map((af: any) => (
              <div key={af.motivo} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor(af.status) }} />
                  <span className="font-semibold text-slate-700 text-sm">{af.motivo}</span>
                </div>
                <div className="flex gap-6 text-xs text-slate-500">
                  <span>Qtd: <b>{af.quantidade}</b></span>
                  <span>Média: <b>{af.media_dias}d</b></span>
                  {af.custo_mensal_r > 0 && (
                    <span style={{ color: CRIT }}>Custo/mês: <b>R$ {af.custo_mensal_r.toLocaleString()}</b></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "absenteismo" && Array.isArray(absenteismo) && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4">Absenteísmo e Horas Extras Mensais (2026)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={absenteismo} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="n"   tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="pct" orientation="right" domain={[2, 6]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="n"   dataKey="faltas_justificadas"     name="Faltas Justificadas"     stroke={WARN}   strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="n"   dataKey="faltas_nao_justificadas" name="Faltas Não Justificadas" stroke={CRIT}   strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="n"   dataKey="horas_extras"            name="Horas Extras"            stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="4 4" />
                  <Line yAxisId="pct" dataKey="taxa_absenteismo_pct"    name="Taxa Absenteísmo %"      stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs bg-white rounded-xl border border-slate-200 shadow-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Mês","Faltas Just.","Faltas Não Just.","Horas Extras","Taxa Absenteísmo"].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-slate-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(absenteismo as any[]).map((row: any) => (
                    <tr key={row.mes} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-3 py-2 font-semibold text-slate-700">{row.mes}</td>
                      <td className="px-3 py-2">{row.faltas_justificadas}</td>
                      <td className="px-3 py-2" style={{ color: row.faltas_nao_justificadas > 12 ? CRIT : "inherit" }}>{row.faltas_nao_justificadas}</td>
                      <td className="px-3 py-2" style={{ color: row.horas_extras > 300 ? WARN : "inherit" }}>{row.horas_extras}</td>
                      <td className="px-3 py-2 font-bold" style={{ color: row.taxa_absenteismo_pct > 4 ? CRIT : WARN }}>{row.taxa_absenteismo_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
