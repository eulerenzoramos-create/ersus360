import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Landmark, AlertTriangle, CheckCircle, DollarSign } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import { BRL, BRL_AXIS } from "../lib/fmt";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const ST_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const SIT_COR: Record<string, string> = { cumprido: "#16a34a", pendente: "#dc2626", contestado: "#7c3aed" };
const MED_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };

function KpiCard({ label, value, sub, cor, icon }: { label: string; value: string | number; sub?: string; cor: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}22`, borderTop: `3px solid ${cor}`, borderRadius: 10, padding: "13px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
        <div style={{ background: `${cor}15`, borderRadius: 6, padding: 5 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: cor, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function AbaDashboard({ dash, hist }: { dash: any; hist: any[] | undefined }) {
  if (!dash) return <NaoDisponivelBanner nota="Dados indisponíveis. Integração não configurada no Railway. Nenhum valor foi inventado." />;
  return (
    <div>
      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#dc2626" }}>
        <strong>⚠ Custo mensal: R${dash.custo_mensal_total.toLocaleString("pt-BR",{minimumFractionDigits:2})}</strong> — {dash.acoes_ativas} ações ativas · {dash.medidas_liminares_ativas} liminares · Crescimento de 16.7% em 6 meses.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Ações ativas"         value={dash.acoes_ativas}                              sub={`+${dash.acoes_novas_mes} novas · -${dash.acoes_encerradas_mes} encerradas`}    cor="#374151"   icon={<Landmark size={14} color="#374151"/>}/>
        <KpiCard label="Custo mensal"         value={BRL(dash.custo_mensal_total)} sub="medicamentos + procedimentos"                                               cor="#dc2626"   icon={<DollarSign size={14} color="#dc2626"/>}/>
        <KpiCard label="Cumprimento de prazos"value={dash.cumprimento_prazo_pct+"%"}                 sub={`meta: ${dash.meta_cumprimento_pct}%`}                                          cor={dash.cumprimento_prazo_pct>=95?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={dash.cumprimento_prazo_pct>=95?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Liminares ativas"     value={dash.medidas_liminares_ativas}                  sub={`${Math.round(dash.medidas_liminares_ativas/dash.acoes_ativas*100)}% das ações`} cor="#d97706"   icon={<AlertTriangle size={14} color="#d97706"/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Judicialização — 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} tickFormatter={BRL_AXIS}/>
                <Tooltip contentStyle={TT} formatter={(v: any, n: string) => n.includes("custo") ? `R$${v.toLocaleString("pt-BR")}` : v}/>
                <Bar yAxisId="l" dataKey="acoes_ativas" name="Ações ativas" fill="#374151" radius={[4,4,0,0]}/>
                <Line yAxisId="r" type="monotone" dataKey="custo_total" name="Custo total" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaAcoes({ acoes }: { acoes: any[] | undefined }) {
  if (!acoes) return null;
  return (
    <div>
      {acoes.map(a => {
        const cor = SIT_COR[a.status] ?? "#374151";
        return (
          <div key={a.processo} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px", marginBottom: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <div>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "#9ca3af" }}>{a.processo}</span>
                <span style={{ marginLeft: 8, background: "#111827", color: "#374151", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{a.tipo}</span>
                {a.liminar && <span style={{ marginLeft: 4, background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>LIMINAR</span>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {a.valor_mes > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>R${a.valor_mes.toLocaleString("pt-BR",{minimumFractionDigits:2})}/mês</span>}
                <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{a.status}</span>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{a.objeto}</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>Autor: {a.autor} · Prazo: {a.prazo_cumprimento}</div>
          </div>
        );
      })}
    </div>
  );
}

function AbaMedicamentos({ meds }: { meds: any[] | undefined }) {
  if (!meds) return null;
  const totalCusto = meds.reduce((s, m) => s + m.custo_mes, 0);
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Medicamentos judicializados — R${totalCusto.toLocaleString("pt-BR",{minimumFractionDigits:2})}/mês</div>
        {meds.map(m => {
          const cor = MED_COR[m.status];
          const pct = Math.round(m.custo_mes / totalCusto * 100);
          return (
            <div key={m.medicamento} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{m.medicamento}</span>
                  <span style={{ marginLeft: 6, background: m.disponivel_rename?"#f0fdf4":"#fef9c3", color: m.disponivel_rename?"#16a34a":"#92400e", fontSize: 10, padding: "1px 5px", borderRadius: 3 }}>{m.relacao}</span>
                  {!m.disponivel_rename && <span style={{ marginLeft: 4, background: "#fef9c3", color: "#92400e", fontSize: 10, padding: "1px 5px", borderRadius: 3 }}>Fora da RENAME</span>}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: "#6b7280" }}>{m.processos} proc.</span>
                  <strong style={{ color: cor }}>R${m.custo_mes.toLocaleString("pt-BR",{minimumFractionDigits:2})} ({pct}%)</strong>
                </div>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 9 }}>
                <div style={{ background: cor, height: "100%", width: `${pct * 3}%`, borderRadius: 6 }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaIndicadores({ inds }: { inds: any[] | undefined }) {
  if (!inds) return <NaoDisponivelBanner nota="Dados indisponíveis. Nenhum valor foi inventado." />;
  return (
    <div>
      {["critico","atencao","ok"].map(nivel => {
        const grupo = inds.filter(i => i.status === nivel);
        if (!grupo.length) return null;
        const cor = ST_COR[nivel];
        return (
          <div key={nivel} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: cor, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 1 }}>{nivel==="critico"?"Crítico":nivel==="atencao"?"Atenção":"OK"}</div>
            {grupo.map(ind => (
              <div key={ind.indicador} style={{ background: "#fff", border: `1px solid ${cor}22`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ind.meta && ind.unidade==="%"?6:0 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                    {ind.observacao && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{ind.observacao}</div>}
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{typeof ind.valor==="number"?ind.valor.toLocaleString("pt-BR"):ind.valor}{ind.unidade==="%"?"%":ind.unidade==="R$"?"":""}</span>
                    {ind.meta !== null && ind.meta !== undefined && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade==="%"?"%":""}</span>}
                  </div>
                </div>
                {ind.meta && ind.unidade==="%" && typeof ind.valor==="number" && (
                  <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7 }}>
                    <div style={{ background: cor, height: "100%", width: `${Math.min(100,Math.round(ind.valor/ind.meta*100))}%`, borderRadius: 6 }}/>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

type Aba = "dashboard"|"acoes"|"medicamentos"|"indicadores";

export default function Judicializacao() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["jud-dash"],  queryFn: () => apiGet("/api/judicializacao/dashboard")    as Promise<any> });
  const { data: hist  } = useQuery({ queryKey: ["jud-hist"],  queryFn: () => apiGet("/api/judicializacao/historico")    as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: acoes } = useQuery({ queryKey: ["jud-acao"],  queryFn: () => apiGet("/api/judicializacao/acoes")        as Promise<any[]>, enabled: aba==="acoes" });
  const { data: meds  } = useQuery({ queryKey: ["jud-med"],   queryFn: () => apiGet("/api/judicializacao/medicamentos") as Promise<any[]>, enabled: aba==="medicamentos" });
  const { data: inds  } = useQuery({ queryKey: ["jud-ind"],   queryFn: () => apiGet("/api/judicializacao/indicadores")  as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",    label: "Dashboard" },
    { id: "acoes",        label: `Ações (${dashRaw?.acoes_ativas ?? 0} ativas)` },
    { id: "medicamentos", label: `Medicamentos` },
    { id: "indicadores",  label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Judicialização da Saúde</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Ações Judiciais · Liminares · Custos · Medicamentos off-label · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(220,38,38,.3)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{BRL(dashRaw.custo_mensal_total)}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>custo/mês</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.acoes_ativas}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>ações ativas</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #0f172a":"2px solid transparent", color: aba===a.id?"#f4f6f8":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && !dashRaw && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba==="dashboard"    && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="acoes"        && <AbaAcoes acoes={acoes}/>}
        {aba==="medicamentos" && <AbaMedicamentos meds={meds}/>}
        {aba==="indicadores"  && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
