import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Star, AlertTriangle, CheckCircle, ClipboardList } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const GRAV_COR: Record<string, string>   = { critica: "#dc2626", maior: "#d97706", menor: "#6b7280" };
const SIT_COR: Record<string, string>    = { concluida: "#16a34a", em_andamento: "#1d4ed8", agendada: "#9ca3af" };
const NC_COR: Record<string, string>     = { atrasada: "#dc2626", em_andamento: "#d97706", aberta: "#dc2626", concluida: "#16a34a" };
const TEND_COR: Record<string, string>   = { alta: "#16a34a", queda: "#dc2626", estavel: "#6b7280" };

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

function AbaDashboard({ dash }: { dash: any }) {
  if (!dash) return null;
  return (
    <div>
      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: "#0c4a6e" }}>
        <strong>ONA {dash.nivel_acreditacao}</strong> · Score atual: <strong>{dash.score_qualidade}%</strong> (meta {dash.meta_score}%) · Reacreditação prevista: <strong>{dash.reacreditacao_prevista}</strong>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Score qualidade"     value={dash.score_qualidade+"%"}         sub={`meta: ${dash.meta_score}%`}                                     cor={STATUS_COR[dash.status_geral]}    icon={<Star size={14} color={STATUS_COR[dash.status_geral]}/>}/>
        <KpiCard label="NC críticas abertas" value={dash.nao_conformidades_criticas}  sub={`${dash.acoes_corretivas_pendentes} ações pendentes`}            cor="#dc2626"                          icon={<AlertTriangle size={14} color="#dc2626"/>}/>
        <KpiCard label="Indicadores OK"      value={dash.indicadores_meta_atingida_pct+"%"} sub={`${dash.indicadores_qualidade_monitorados} monitorados`}  cor={dash.indicadores_meta_atingida_pct>=70?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={dash.indicadores_meta_atingida_pct>=70?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Satisfação usuário"  value={dash.satisfacao_usuario_pct+"%"}  sub={`meta: ${dash.meta_satisfacao_pct}%`}                           cor={dash.satisfacao_usuario_pct>=dash.meta_satisfacao_pct?"#16a34a":"#d97706"} icon={<ClipboardList size={14} color={dash.satisfacao_usuario_pct>=dash.meta_satisfacao_pct?"#16a34a":"#d97706"}/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Protocolos clínicos</div>
          <div style={{ display: "flex", gap: 12, fontSize: 24, fontWeight: 900 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#16a34a" }}>{dash.protocolos_vigentes}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>vigentes</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#dc2626" }}>{dash.protocolos_vencidos}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>vencidos</div>
            </div>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Auditorias no mês</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0369a1" }}>{dash.auditorias_mes}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>realizadas + agendadas</div>
        </div>
      </div>
    </div>
  );
}

function AbaIndicadoresQ({ indsQ }: { indsQ: any[] | undefined }) {
  if (!indsQ) return null;
  const areas = [...new Set(indsQ.map(i => i.area))];
  return (
    <div>
      {areas.map(area => {
        const grupo = indsQ.filter(i => i.area === area);
        return (
          <div key={area} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 1 }}>{area}</div>
            {grupo.map(ind => {
              const cor = STATUS_COR[ind.status];
              const pct = typeof ind.valor==="number" && ind.meta ? Math.min(100, Math.round(ind.valor / ind.meta * 100)) : 0;
              return (
                <div key={ind.indicador} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ind.meta?4:0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{ind.indicador}</div>
                    <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
                      <span style={{ fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade==="%"?"%":ind.unidade==="dias"?"d":""}</span>
                      {ind.meta && <span style={{ color: "#9ca3af" }}>meta: {ind.meta}{ind.unidade==="%"?"%":""}</span>}
                      <span style={{ color: TEND_COR[ind.tendencia], fontWeight: 700 }}>{ind.tendencia==="alta"?"↑":ind.tendencia==="queda"?"↓":"→"}</span>
                    </div>
                  </div>
                  {ind.meta && ind.unidade==="%" && (
                    <div style={{ background: "#f3f4f6", borderRadius: 6, height: 6 }}>
                      <div style={{ background: cor, height: "100%", width: `${pct}%`, borderRadius: 6 }}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function AbaAuditorias({ auds }: { auds: any[] | undefined }) {
  if (!auds) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {auds.map(a => {
          const cor = SIT_COR[a.status] ?? "#9ca3af";
          return (
            <div key={a.auditoria} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{a.auditoria}</div>
                <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{a.status}</span>
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#6b7280" }}>
                <span>{a.data} · {a.responsavel}</span>
                {a.pct > 0 && <span>Conformidade: <strong style={{ color: a.pct >= 90 ? "#16a34a" : a.pct >= 75 ? "#d97706" : "#dc2626" }}>{a.pct}%</strong></span>}
                {a.nc_criticas > 0 && <span style={{ color: "#dc2626" }}>⚠ {a.nc_criticas} NC crítica(s)</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaNCs({ ncs }: { ncs: any[] | undefined }) {
  if (!ncs) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {ncs.map(nc => {
          const cor = NC_COR[nc.status] ?? "#374151";
          const gravCor = GRAV_COR[nc.gravidade] ?? "#374151";
          return (
            <div key={nc.id} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "11px 16px", opacity: nc.status==="concluida"?0.7:1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{nc.id}</span>
                  <span style={{ marginLeft: 6, background: gravCor+"15", color: gravCor, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{nc.gravidade}</span>
                  <span style={{ marginLeft: 6, fontSize: 11, color: "#6b7280" }}>{nc.area}</span>
                </div>
                <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{nc.status}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{nc.descricao}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Resp.: {nc.responsavel} · Prazo: {nc.prazo}</div>
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
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade==="%"?"%":""}</span>
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

type Aba = "dashboard"|"indicadores-q"|"auditorias"|"ncs"|"indicadores";

export default function GestaoQualidade() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["gq-dash"],  queryFn: () => apiGet("/api/gestao-qualidade/dashboard")             as Promise<any> });
  const { data: indsQ } = useQuery({ queryKey: ["gq-indq"],  queryFn: () => apiGet("/api/gestao-qualidade/indicadores-qualidade") as Promise<any[]>, enabled: aba==="indicadores-q" });
  const { data: auds  } = useQuery({ queryKey: ["gq-auds"],  queryFn: () => apiGet("/api/gestao-qualidade/auditorias")            as Promise<any[]>, enabled: aba==="auditorias" });
  const { data: ncs   } = useQuery({ queryKey: ["gq-ncs"],   queryFn: () => apiGet("/api/gestao-qualidade/nao-conformidades")     as Promise<any[]>, enabled: aba==="ncs" });
  const { data: inds  } = useQuery({ queryKey: ["gq-ind"],   queryFn: () => apiGet("/api/gestao-qualidade/indicadores")          as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",     label: "Dashboard" },
    { id: "indicadores-q", label: `Indicadores (${dashRaw?.indicadores_qualidade_monitorados ?? 0})` },
    { id: "auditorias",    label: `Auditorias (${dashRaw?.auditorias_mes ?? 0})` },
    { id: "ncs",           label: `NC (${dashRaw?.nao_conformidades_abertas ?? 0})` },
    { id: "indicadores",   label: "Painel ONA" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#0369a1 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Gestão da Qualidade</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>ONA · Acreditação · Indicadores · Auditorias · NC · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.score_qualidade}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>score ONA</div>
              </div>
              <div style={{ background: dashRaw.nao_conformidades_criticas > 0 ? "rgba(255,100,100,.3)" : "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.nao_conformidades_criticas}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>NC críticas</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e0f2fe", flexWrap: "wrap" as const }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 12, borderBottom: aba===a.id?"2px solid #0369a1":"2px solid transparent", color: aba===a.id?"#0369a1":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"     && <AbaDashboard dash={dashRaw}/>}
        {aba==="indicadores-q" && <AbaIndicadoresQ indsQ={indsQ}/>}
        {aba==="auditorias"    && <AbaAuditorias auds={auds}/>}
        {aba==="ncs"           && <AbaNCs ncs={ncs}/>}
        {aba==="indicadores"   && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
