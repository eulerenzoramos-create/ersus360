import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Radio, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const ST_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const NAT_COR: Record<string, string> = { alta: "#dc2626", media: "#d97706", baixa: "#16a34a" };

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
        <strong>⚠ Lancha fluvial inoperante desde 12/02/2026</strong> — comunidades ribeirinhas do Rio Madeira sem cobertura SAMU. Tempo de resposta médio 18,4 min (meta: 15 min).
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Chamadas/mês"        value={dash.chamadas_mes}                             sub={`${dash.atendimentos_realizados} atendidos`}          cor="#374151"   icon={<Radio size={14} color="#374151"/>}/>
        <KpiCard label="Tempo médio resposta" value={`${dash.tempo_resposta_medio_min} min`}        sub={`meta: ${dash.meta_tempo_resposta_min} min`}           cor={dash.tempo_resposta_medio_min<=15?"#16a34a":"#d97706"} icon={<Clock size={14} color={dash.tempo_resposta_medio_min<=15?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Taxa de atendimento"  value={`${dash.taxa_atendimento_pct}%`}              sub="meta: 95%"                                            cor={dash.taxa_atendimento_pct>=95?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={dash.taxa_atendimento_pct>=95?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Ambulâncias ativas"   value={`${dash.ambulancias_disponiveis}/${dash.ambulancias_total}`} sub={dash.ambulancia_inoperante>0?`${dash.ambulancia_inoperante} inoperante`:"todas operacionais"} cor={dash.ambulancia_inoperante>0?"#dc2626":"#16a34a"} icon={<AlertTriangle size={14} color={dash.ambulancia_inoperante>0?"#dc2626":"#16a34a"}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>SAMU — Chamadas e atendimentos (6 meses)</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit=" min"/>
                <Tooltip contentStyle={TT}/>
                <Line yAxisId="l" type="monotone" dataKey="chamadas"     name="Chamadas"     stroke="#374151" strokeWidth={1} strokeDasharray="4 2" dot={false}/>
                <Line yAxisId="l" type="monotone" dataKey="atendimentos" name="Atendidos"    stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }}/>
                <Line yAxisId="l" type="monotone" dataKey="transferencias" name="Transferências UTI" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }}/>
                <Line yAxisId="r" type="monotone" dataKey="tempo_medio"  name="Tempo médio"  stroke="#d97706" strokeWidth={2} dot={{ r: 3 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaOcorrencias({ ocorr }: { ocorr: any[] | undefined }) {
  if (!ocorr) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;
  const total = ocorr.reduce((s, o) => s + o.total, 0);
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Natureza das ocorrências — {total} atendimentos/mês</div>
        {ocorr.map(o => {
          const cor = NAT_COR[o.gravidade] ?? "#374151";
          return (
            <div key={o.natureza} style={{ marginBottom: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{o.natureza}</span>
                  <span style={{ marginLeft: 6, background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>{o.gravidade}</span>
                  {o.obitos > 0 && <span style={{ marginLeft: 4, background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>{o.obitos} óbito(s)</span>}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: "#6b7280" }}>SBV: {o.sbv} / SAV: {o.sav}</span>
                  {o.transferidos > 0 && <span style={{ color: "#7c3aed" }}>transfer.: {o.transferidos}</span>}
                  <strong style={{ color: cor }}>{o.pct}%</strong>
                </div>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 8 }}>
                <div style={{ background: cor, height: "100%", width: `${o.pct * 2.5}%`, borderRadius: 6 }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaVeiculos({ veics }: { veics: any[] | undefined }) {
  if (!veics) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;
  return (
    <div>
      {veics.map(v => {
        const cor = v.status === "operacional" ? (v.equipamentos_ok ? "#16a34a" : "#d97706") : "#dc2626";
        return (
          <div key={v.veiculo} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{v.veiculo}</span>
                <span style={{ marginLeft: 8, background: v.tipo==="SAV"?"#ede9fe":"#dbeafe", color: v.tipo==="SAV"?"#7c3aed":"#1d4ed8", fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{v.tipo}</span>
                {v.status === "inoperante" && <span style={{ marginLeft: 4, background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>INOPERANTE</span>}
                {v.status === "operacional" && !v.equipamentos_ok && <span style={{ marginLeft: 4, background: "#fef9c3", color: "#92400e", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>EQUIPAMENTO FALHO</span>}
              </div>
              <div style={{ display: "flex", gap: 10, fontSize: 12 }}>
                <span style={{ color: "#6b7280" }}>Placa: {v.placa}</span>
                <span style={{ color: "#6b7280" }}>Ano: {v.ano}</span>
                {v.km_mes > 0 && <span><strong>{v.km_mes.toLocaleString("pt-BR")}</strong> km/mês</span>}
              </div>
            </div>
            {v.observacao && (
              <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#92400e" }}>
                ⚠ {v.observacao}
              </div>
            )}
            {!v.observacao && v.equipamentos_ok && (
              <div style={{ fontSize: 11, color: "#16a34a" }}>✓ Equipamentos verificados · ✓ Operacional</div>
            )}
          </div>
        );
      })}
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
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{typeof ind.valor==="number"?ind.valor.toLocaleString("pt-BR"):ind.valor}{ind.unidade==="%"?"%":ind.unidade==="min"?" min":""}</span>
                    {ind.meta !== null && ind.meta !== undefined && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade==="%"?"%":ind.unidade==="min"?" min":""}</span>}
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

type Aba = "dashboard"|"ocorrencias"|"veiculos"|"indicadores";

export default function SAMU() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["samu-dash"],  queryFn: () => apiGet("/api/samu/dashboard")   as Promise<any> });
  const { data: hist  } = useQuery({ queryKey: ["samu-hist"],  queryFn: () => apiGet("/api/samu/historico")   as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: ocorr } = useQuery({ queryKey: ["samu-ocorr"], queryFn: () => apiGet("/api/samu/ocorrencias") as Promise<any[]>, enabled: aba==="ocorrencias" });
  const { data: veics } = useQuery({ queryKey: ["samu-veic"],  queryFn: () => apiGet("/api/samu/veiculos")    as Promise<any[]>, enabled: aba==="veiculos" });
  const { data: inds  } = useQuery({ queryKey: ["samu-ind"],   queryFn: () => apiGet("/api/samu/indicadores") as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "ocorrencias", label: `Ocorrências (${dashRaw?.chamadas_mes ?? 0}/mês)` },
    { id: "veiculos",    label: `Veículos (${dashRaw?.ambulancias_disponiveis ?? 0}/${dashRaw?.ambulancias_total ?? 0})` },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>SAMU 192</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Urgência e Emergência · Regulação · Transferências · RUE · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.chamadas_mes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>chamadas/mês</div>
              </div>
              <div style={{ background: dashRaw.tempo_resposta_medio_min > 15 ? "rgba(255,220,50,.3)" : "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.tempo_resposta_medio_min} min</div>
                <div style={{ fontSize: 10, opacity: .8 }}>tempo médio</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"3px solid #1351b4":"2px solid transparent", color: aba===a.id?"#1351b4":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && !dashRaw && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="ocorrencias" && <AbaOcorrencias ocorr={ocorr}/>}
        {aba==="veiculos"    && <AbaVeiculos veics={veics}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
