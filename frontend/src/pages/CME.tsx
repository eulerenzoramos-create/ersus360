import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Thermometer, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const ST_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };

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
      {dash.indicadores_biologicos_positivos > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#dc2626" }}>
          <strong>⚠ ALERTA: {dash.indicadores_biologicos_positivos} indicador(es) biológico(s) POSITIVO(S)</strong> — Estufa Pasteur 1 com calibração vencida. Suspender uso e comunicar CCIH.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Ciclos/mês"         value={dash.ciclos_mes}                    sub={`${dash.ciclos_criticos} críticos + ${dash.ciclos_semicriticos} semicríticos`} cor="#374151" icon={<Activity size={14} color="#374151"/>}/>
        <KpiCard label="Conformidade geral" value={dash.conformidade_geral_pct+"%"}    sub={`meta: ${dash.meta_conformidade_pct}%`}                                      cor={dash.conformidade_geral_pct>=98?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={dash.conformidade_geral_pct>=98?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Bio positivos"      value={dash.indicadores_biologicos_positivos} sub="meta: 0"                                                                  cor={dash.indicadores_biologicos_positivos===0?"#16a34a":"#dc2626"} icon={<AlertTriangle size={14} color={dash.indicadores_biologicos_positivos===0?"#16a34a":"#dc2626"}/>}/>
        <KpiCard label="Lotes reprovados"   value={dash.lotes_reprovados_mes}          sub="este mês"                                                                    cor={dash.lotes_reprovados_mes===0?"#16a34a":"#d97706"} icon={<Thermometer size={14} color={dash.lotes_reprovados_mes===0?"#16a34a":"#d97706"}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Ciclos e conformidade — 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="%"/>
                <Tooltip contentStyle={TT}/>
                <Bar yAxisId="l" dataKey="ciclos"  name="Ciclos"  fill="#1d4ed8" radius={[4,4,0,0]}/>
                <Line yAxisId="r" type="monotone" dataKey="conformidade_pct" name="Conformidade %" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaEquipamentos({ ciclos }: { ciclos: any[] | undefined }) {
  if (!ciclos) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;
  return (
    <div>
      {ciclos.map(eq => {
        const cor = ST_COR[eq.status];
        return (
          <div key={eq.equipamento} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "13px 18px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{eq.equipamento}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ background: eq.calibracao==="OK"?"#dcfce7":"#fef2f2", color: eq.calibracao==="OK"?"#16a34a":"#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>Calibração: {eq.calibracao}</span>
                <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{eq.status==="ok"?"● OK":eq.status==="atencao"?"● Atenção":"● Crítico"}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 24, fontSize: 12, color: "#374151" }}>
              <span>Ciclos/mês: <strong>{eq.ciclos_mes}</strong></span>
              <span>Falhas: <strong style={{ color: eq.falhas===0?"#16a34a":"#dc2626" }}>{eq.falhas}</strong></span>
              <span>Conformidade: <strong style={{ color: eq.conformidade_pct>=98?"#16a34a":"#d97706" }}>{eq.conformidade_pct}%</strong></span>
              <span>Último bio: <strong style={{ color: eq.ultimo_bio==="Negativo"?"#16a34a":eq.ultimo_bio==="N/A"?"#9ca3af":"#dc2626" }}>{eq.ultimo_bio}</strong></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AbaRastreabilidade({ lotes }: { lotes: any[] | undefined }) {
  if (!lotes) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;
  return (
    <div>
      {lotes.map(l => {
        const reprovado = l.status === "critico";
        const cor = reprovado ? "#dc2626" : "#16a34a";
        return (
          <div key={l.lote} style={{ background: reprovado?"#fff5f5":"#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "11px 16px", marginBottom: 8, opacity: reprovado?1:0.95 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{l.lote}</span>
                <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600 }}>{l.tipo}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{l.ciclos} ciclo(s)</span>
                <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{reprovado?"REPROVADO":"OK"}</span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>Validade: {l.validade} · Destino: {l.destino}</div>
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
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade==="%"?"%":ind.unidade==="min"?" min":""}</span>
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

type Aba = "dashboard"|"equipamentos"|"rastreabilidade"|"indicadores";

export default function CME() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["cme-dash"],  queryFn: () => apiGet("/api/cme/dashboard")       as Promise<any> });
  const { data: hist  } = useQuery({ queryKey: ["cme-hist"],  queryFn: () => apiGet("/api/cme/historico")       as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: cicls } = useQuery({ queryKey: ["cme-cicls"], queryFn: () => apiGet("/api/cme/ciclos")          as Promise<any[]>, enabled: aba==="equipamentos" });
  const { data: rast  } = useQuery({ queryKey: ["cme-rast"],  queryFn: () => apiGet("/api/cme/rastreabilidade") as Promise<any[]>, enabled: aba==="rastreabilidade" });
  const { data: inds  } = useQuery({ queryKey: ["cme-ind"],   queryFn: () => apiGet("/api/cme/indicadores")     as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",        label: "Dashboard" },
    { id: "equipamentos",     label: `Equipamentos (${dashRaw?.falhas_biologico_mes ?? 0} falhas bio)` },
    { id: "rastreabilidade",  label: `Lotes (${dashRaw?.lotes_reprovados_mes ?? 0} reprov.)` },
    { id: "indicadores",      label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>CME</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Central de Material e Esterilização · Ciclos · Rastreabilidade · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.ciclos_mes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>ciclos/mês</div>
              </div>
              <div style={{ background: dashRaw.indicadores_biologicos_positivos>0?"rgba(255,80,80,.4)":"rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.conformidade_geral_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>conformidade</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #1d4ed8":"2px solid transparent", color: aba===a.id?"#1d4ed8":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && !dashRaw && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba==="dashboard"       && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="equipamentos"    && <AbaEquipamentos ciclos={cicls}/>}
        {aba==="rastreabilidade" && <AbaRastreabilidade lotes={rast}/>}
        {aba==="indicadores"     && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
