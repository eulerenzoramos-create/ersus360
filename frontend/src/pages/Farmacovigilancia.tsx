import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { AlertTriangle, Pill, CheckCircle, TrendingUp } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const GRAV_COR: Record<string, string> = { grave: "#dc2626", moderada: "#d97706", leve: "#6b7280" };
const SIT_COR: Record<string, string> = { aberto: "#dc2626", em_andamento: "#d97706", concluido: "#16a34a" };

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
      {dash.notificadas_notivisa_pct < 100 && (
        <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
          <strong>⚠ Subnotificação:</strong> Taxa de notificação ao NOTIVISA: <strong>{dash.notificadas_notivisa_pct}%</strong>. Estima-se que <strong>{dash.taxa_subnotificacao_estimada_pct}%</strong> dos eventos adversos não são notificados.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Notificações/mês"   value={dash.notificacoes_mes}                  sub={`${dash.ram_mes} RAM + ${dash.queixas_tecnicas_mes} QT`}   cor="#374151"   icon={<AlertTriangle size={14} color="#374151"/>}/>
        <KpiCard label="RAM graves"          value={dash.notificacoes_graves_mes}           sub="internações + óbitos"                                      cor="#dc2626"   icon={<Pill size={14} color="#dc2626"/>}/>
        <KpiCard label="Notificação NOTIVISA"value={dash.notificadas_notivisa_pct+"%"}      sub={`meta: ${dash.meta_notivisa_pct}%`}                        cor={dash.notificadas_notivisa_pct>=98?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={dash.notificadas_notivisa_pct>=98?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Alertas ativos"      value={dash.medicamentos_alerta_mes}           sub={`${dash.medicamentos_retirados} med. retirado`}            cor="#d97706"   icon={<TrendingUp size={14} color="#d97706"/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Notificações — 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="%"/>
                <Tooltip contentStyle={TT}/>
                <Bar yAxisId="l" dataKey="ram"     name="RAM"            fill="#dc2626" radius={[4,4,0,0]} stackId="a"/>
                <Bar yAxisId="l" dataKey="queixas" name="Queixas técn."  fill="#d97706" radius={[0,0,4,4]} stackId="a"/>
                <Line yAxisId="r" type="monotone" dataKey="notivisa_pct" name="NOTIVISA %" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaNotificacoes({ nots }: { nots: any[] | undefined }) {
  if (!nots) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {nots.map(n => {
          const cor = GRAV_COR[n.gravidade] ?? "#374151";
          return (
            <div key={n.id} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "11px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{n.id}</span>
                  <span style={{ marginLeft: 6, background: n.tipo==="RAM"?"#fef2f2":"#fef9c3", color: n.tipo==="RAM"?"#dc2626":"#92400e", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{n.tipo}</span>
                  <span style={{ marginLeft: 6, background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{n.gravidade}</span>
                  {!n.notivisa && <span style={{ marginLeft: 6, background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>⚠ Não notificado</span>}
                </div>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{n.profissional}</span>
              </div>
              <div style={{ fontSize: 12, marginBottom: 2 }}>
                <strong>{n.medicamento}</strong> → <span style={{ color: "#374151" }}>{n.reacao}</span>
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Causalidade: {n.causalidade} · Desfecho: {n.desfecho}</div>
              {n.alerta && <div style={{ marginTop: 4, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {n.alerta}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaAlertas({ alertas }: { alertas: any[] | undefined }) {
  if (!alertas) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {alertas.map(a => {
          const cor = SIT_COR[a.status] ?? "#374151";
          return (
            <div key={a.medicamento} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "13px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{a.medicamento}</div>
                <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{a.status.replace("_"," ")}</span>
              </div>
              <div style={{ fontSize: 12, color: "#374151", marginBottom: 4 }}>⚠ <strong>{a.alerta}</strong></div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Ação: {a.acao} · Prazo: {a.prazo}</div>
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
        const cor = STATUS_COR[nivel];
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
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade==="%"?"%":ind.unidade==="dias"?" dias":""}</span>
                    {ind.meta && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade==="%"?"%":""}</span>}
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

type Aba = "dashboard"|"notificacoes"|"alertas"|"indicadores";

export default function Farmacovigilancia() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["fvg-dash"],  queryFn: () => apiGet("/api/farmacovigilancia/dashboard")     as Promise<any> });
  const { data: hist  } = useQuery({ queryKey: ["fvg-hist"],  queryFn: () => apiGet("/api/farmacovigilancia/historico")     as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: nots  } = useQuery({ queryKey: ["fvg-nots"],  queryFn: () => apiGet("/api/farmacovigilancia/notificacoes")  as Promise<any[]>, enabled: aba==="notificacoes" });
  const { data: alts  } = useQuery({ queryKey: ["fvg-alts"],  queryFn: () => apiGet("/api/farmacovigilancia/alertas")       as Promise<any[]>, enabled: aba==="alertas" });
  const { data: inds  } = useQuery({ queryKey: ["fvg-ind"],   queryFn: () => apiGet("/api/farmacovigilancia/indicadores")   as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",     label: "Dashboard" },
    { id: "notificacoes",  label: `Notificações (${dashRaw?.notificacoes_mes ?? 0})` },
    { id: "alertas",       label: `Alertas (${dashRaw?.medicamentos_alerta_mes ?? 0})` },
    { id: "indicadores",   label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Farmacovigilância</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>RAM · NOTIVISA · Queixas Técnicas · Alertas ANVISA · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.notificacoes_mes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>notificações/mês</div>
              </div>
              <div style={{ background: dashRaw.notificacoes_graves_mes > 0 ? "rgba(255,100,100,.3)" : "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.notificacoes_graves_mes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>RAM graves</div>
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
        {aba==="dashboard"    && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="notificacoes" && <AbaNotificacoes nots={nots}/>}
        {aba==="alertas"      && <AbaAlertas alertas={alts}/>}
        {aba==="indicadores"  && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
