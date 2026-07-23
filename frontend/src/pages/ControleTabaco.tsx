import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Wind, TrendingDown, Users, Activity } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const CONTROLE_COR: Record<string, string> = { sim: "#16a34a", nao: "#dc2626" };

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Em cessação ativa"   value={dash.em_cessacao_ativa}          sub={`${dash.grupos_ativos} grupos ativos`}       cor="#374151"                              icon={<Users size={14} color="#374151"/>}/>
        <KpiCard label="Taxa cessação 12m"   value={dash.taxa_cessacao_12m_pct+"%"}  sub="meta PNCT 35%"                               cor={STATUS_COR[dash.taxa_cessacao_status]} icon={<TrendingDown size={14} color={STATUS_COR[dash.taxa_cessacao_status]}/>}/>
        <KpiCard label="TRN dispensados/mês" value={dash.trn_dispensados_mes}         sub="adesivos + goma + vareniclina"               cor="#1d4ed8"                              icon={<Activity size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Prevalência tabag."  value={dash.prevalencia_tabagismo_pct+"%"} sub={`~${dash.fumantes_estimados.toLocaleString("pt-BR")} fumantes`} cor={dash.prevalencia_tabagismo_pct>12?"#d97706":"#16a34a"} icon={<Wind size={14} color={dash.prevalencia_tabagismo_pct>12?"#d97706":"#16a34a"}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Programa de cessação — 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }}/>
                <Tooltip contentStyle={TT}/>
                <Line yAxisId="l" type="monotone" dataKey="em_cessacao"           stroke="#374151" strokeWidth={2.5} dot={{ r: 3 }} name="Em cessação"/>
                <Line yAxisId="l" type="monotone" dataKey="trn_dispensados"       stroke="#1d4ed8" strokeWidth={1.5} dot={false}   name="TRN dispensados"/>
                <Line yAxisId="r" type="monotone" dataKey="cessacoes_confirmadas" stroke="#16a34a" strokeWidth={2}   dot={{ r: 3 }} name="Cessações confirmadas"/>
                <Line yAxisId="r" type="monotone" dataKey="recaidas"              stroke="#dc2626" strokeWidth={1.5} dot={false}   name="Recaídas"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaGrupos({ grupos }: { grupos: any[] | undefined }) {
  if (!grupos) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {grupos.map(g => {
          const cor = STATUS_COR[g.status];
          return (
            <div key={g.grupo} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{g.grupo}</div>
                <span style={{ background: g.fase==="Intensiva"?"#dbeafe":"#d1fae5", color: g.fase==="Intensiva"?"#1d4ed8":"#16a34a", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{g.fase}</span>
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>{g.esf}</div>
              <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                <span>Participantes: <strong style={{ color: "#374151" }}>{g.participantes}</strong></span>
                <span>Sessões: <strong>{g.sessoes_realizadas}</strong></span>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7, marginTop: 10 }}>
                <div style={{ background: cor, height: "100%", width: `${g.taxa_adesao_pct}%`, borderRadius: 6 }}/>
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>Adesão: {g.taxa_adesao_pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaUsuarios({ usuarios }: { usuarios: any[] | undefined }) {
  if (!usuarios) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {usuarios.map(u => {
          const cessou = u.cessacao;
          const cor = cessou ? "#16a34a" : "#374151";
          return (
            <div key={u.id} style={{ background: "#fff", border: `1px solid ${u.alerta?"#dc262222":"#e5e7eb"}`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{u.id}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ background: cessou?"#dcfce7":"#fee2e2", color: cessou?"#16a34a":"#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{cessou?"Cessou ✓":"Em tratamento"}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#374151", marginBottom: 4 }}>
                Carga: <strong>{u.carga_tabagica}</strong> · {u.dependencia}
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280" }}>
                <span>TRN: <strong style={{ color: "#1d4ed8" }}>{u.trn}</strong></span>
                <span>CO: <strong style={{ color: u.co_ppm>10?"#dc2626":u.co_ppm>5?"#d97706":"#16a34a" }}>{u.co_ppm} ppm</strong></span>
                <span>Tentativa: <strong>{u.meses_tentativa} meses</strong></span>
              </div>
              {u.alerta && <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {u.alerta}</div>}
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ind.meta?6:0 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                    {ind.observacao && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{ind.observacao}</div>}
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade==="%"?"%":""}</span>
                    {ind.meta && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade==="%"?"%":""}</span>}
                  </div>
                </div>
                {ind.meta && typeof ind.valor === "number" && !ind.invertido && (
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

type Aba = "dashboard"|"grupos"|"usuarios"|"indicadores";

export default function ControleTabaco() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash } = useQuery({ queryKey: ["tab-dash"], queryFn: () => apiGet("/api/controle-tabaco/dashboard")   as Promise<any> });
  const { data: hist } = useQuery({ queryKey: ["tab-hist"], queryFn: () => apiGet("/api/controle-tabaco/historico")   as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: grps } = useQuery({ queryKey: ["tab-grps"], queryFn: () => apiGet("/api/controle-tabaco/grupos")      as Promise<any[]>, enabled: aba==="grupos" });
  const { data: usrs } = useQuery({ queryKey: ["tab-usrs"], queryFn: () => apiGet("/api/controle-tabaco/usuarios")    as Promise<any[]>, enabled: aba==="usuarios" });
  const { data: inds } = useQuery({ queryKey: ["tab-ind"],  queryFn: () => apiGet("/api/controle-tabaco/indicadores") as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "grupos",      label: `Grupos (${dashRaw?.grupos_ativos ?? 0} ativos)` },
    { id: "usuarios",    label: `Usuários (${dashRaw?.em_cessacao_ativa ?? 0})` },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Controle de Tabaco</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>PNCT · Grupos de Cessação · TRN · Medição CO · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.em_cessacao_ativa}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>em cessação</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.taxa_cessacao_12m_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>taxa cessação</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #44403c":"2px solid transparent", color: aba===a.id?"#44403c":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="grupos"      && <AbaGrupos grupos={grps}/>}
        {aba==="usuarios"    && <AbaUsuarios usuarios={usrs}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
