import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Waves, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const ST_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const TEND_COR: Record<string, string> = { melhora: "#16a34a", estavel: "#d97706", piora: "#dc2626" };

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
  if (!dash) return null;
  return (
    <div>
      {dash.alertas_ativos > 0 && (
        <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
          <strong>⚠ {dash.alertas_ativos} alerta(s) ativos no SISÁGUA</strong> — Conformidade em queda: {dash.amostras_conformes_pct}% (meta {dash.meta_conformidade_pct}%). SAC Bela Vista e Vila Caboclos com cloro abaixo do VMP.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Conformidade geral"    value={dash.amostras_conformes_pct+"%"}  sub={`meta: ${dash.meta_conformidade_pct}%`}           cor={dash.amostras_conformes_pct>=95?"#16a34a":"#dc2626"} icon={<CheckCircle size={14} color={dash.amostras_conformes_pct>=95?"#16a34a":"#dc2626"}/>}/>
        <KpiCard label="Amostras coletadas"    value={dash.amostras_mes}                sub={`${dash.amostras_nao_conformes} não conformes`}    cor="#374151"   icon={<Waves size={14} color="#374151"/>}/>
        <KpiCard label="Cobertura tratada"     value={dash.cobertura_abastecimento_pct+"%"} sub={`${dash.populacao_abastecida.toLocaleString("pt-BR")} hab.`} cor={dash.cobertura_abastecimento_pct>=90?"#16a34a":"#d97706"} icon={<AlertTriangle size={14} color={dash.cobertura_abastecimento_pct>=90?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Parâmetros críticos"   value={dash.parametros_criticos}         sub="Portaria GM/MS 888/2021"                           cor={dash.parametros_criticos===0?"#16a34a":"#dc2626"} icon={<TrendingDown size={14} color={dash.parametros_criticos===0?"#16a34a":"#dc2626"}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Conformidade da água — 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="%"/>
                <Tooltip contentStyle={TT}/>
                <Bar yAxisId="l" dataKey="amostras"      name="Amostras"       fill="#0891b2" radius={[4,4,0,0]}/>
                <Bar yAxisId="l" dataKey="nao_conformes" name="Não conformes"  fill="#dc2626" radius={[4,4,0,0]}/>
                <Line yAxisId="r" type="monotone" dataKey="conformidade_pct" name="Conformidade %" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaSistemas({ sistemas }: { sistemas: any[] | undefined }) {
  if (!sistemas) return null;
  return (
    <div>
      {sistemas.map(s => {
        const cor = ST_COR[s.status];
        return (
          <div key={s.sistema} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "13px 18px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{s.sistema}</span>
                <span style={{ marginLeft: 8, background: "#f1f5f9", fontSize: 10, padding: "2px 6px", borderRadius: 4, color: "#374151" }}>{s.tipo}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {s.parametro_critico && (
                  <span style={{ background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>⚠ {s.parametro_critico}</span>
                )}
                <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{s.status==="ok"?"● Conforme":"● Atenção"}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, fontSize: 11, color: "#6b7280" }}>
              <span>Pop.: <strong style={{ color: "#374151" }}>{s.populacao.toLocaleString("pt-BR")} hab.</strong></span>
              <span>Amostras/mês: <strong>{s.amostras_mes}</strong></span>
              <span>Conformidade: <strong style={{ color: ST_COR[s.status] }}>{s.conformidade_pct}%</strong></span>
              <span>Cloro: <strong style={{ color: s.cloro_residual>=0.2?"#374151":"#dc2626" }}>{s.cloro_residual} mg/L</strong></span>
              <span>Turbidez: <strong style={{ color: s.turbidez_ntu<=5?"#374151":"#d97706" }}>{s.turbidez_ntu} NTU</strong></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AbaParametros({ params }: { params: any[] | undefined }) {
  if (!params) return null;
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Conformidade por parâmetro — Portaria GM/MS 888/2021</div>
        {params.map(p => {
          const cor = ST_COR[p.status];
          return (
            <div key={p.parametro} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{p.parametro}</span>
                  <span style={{ marginLeft: 6, fontSize: 10, color: "#9ca3af" }}>VMP: {p.vmp}</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{p.nao_conformes} NC/{p.conformes + p.nao_conformes}</span>
                  <span style={{ background: TEND_COR[p.tendencia]+"15", color: TEND_COR[p.tendencia], fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4 }}>
                    {p.tendencia==="melhora"?"↑ melhora":p.tendencia==="piora"?"↓ piora":"→ estável"}
                  </span>
                  <strong style={{ color: cor }}>{(100-p.nao_conforme_pct).toFixed(1)}%</strong>
                </div>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 10 }}>
                <div style={{ background: cor, height: "100%", width: `${100-p.nao_conforme_pct}%`, borderRadius: 6 }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaIndicadores({ inds }: { inds: any[] | undefined }) {
  if (!inds) return null;
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
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade==="%"?"%":""}</span>
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

type Aba = "dashboard"|"sistemas"|"parametros"|"indicadores";

export default function VigiAgua() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash   } = useQuery({ queryKey: ["va-dash"],  queryFn: () => apiGet("/api/vigiagua/dashboard")   as Promise<any> });
  const { data: hist   } = useQuery({ queryKey: ["va-hist"],  queryFn: () => apiGet("/api/vigiagua/historico")   as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: sists  } = useQuery({ queryKey: ["va-sys"],   queryFn: () => apiGet("/api/vigiagua/sistemas")    as Promise<any[]>, enabled: aba==="sistemas" });
  const { data: params } = useQuery({ queryKey: ["va-par"],   queryFn: () => apiGet("/api/vigiagua/parametros")  as Promise<any[]>, enabled: aba==="parametros" });
  const { data: inds   } = useQuery({ queryKey: ["va-ind"],   queryFn: () => apiGet("/api/vigiagua/indicadores") as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "sistemas",    label: `Sistemas (${dashRaw?.sistemas_monitorados ?? 0})` },
    { id: "parametros",  label: `Parâmetros (${dashRaw?.parametros_criticos ?? 0} críticos)` },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#0c4a6e 0%,#0369a1 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>VIGIÁGUA</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Vigilância da Qualidade da Água · SISÁGUA · Portaria 888/2021 · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: dashRaw.amostras_conformes_pct<95?"rgba(255,200,50,.3)":"rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.amostras_conformes_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>conformidade</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.amostras_mes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>amostras/mês</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #bae6fd" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #0369a1":"2px solid transparent", color: aba===a.id?"#0369a1":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="sistemas"    && <AbaSistemas sistemas={sists}/>}
        {aba==="parametros"  && <AbaParametros params={params}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
