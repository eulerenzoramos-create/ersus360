import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";
import { Smile, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const TIPO_COR: Record<string, string> = { preventivo: "#16a34a", restaurador: "#1d4ed8", cirurgico: "#dc2626", urgencia: "#d97706", periodontia: "#7c3aed", endodontia: "#0891b2", reabilitacao: "#ec4899" };

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Equipes ESB"           value={dash.equipes_esb}                sub="ativas"                     cor="#0891b2" icon={<Smile size={14} color="#0891b2"/>}/>
        <KpiCard label="1ª consulta/mês"       value={dash.total_1a_consulta}          sub="programáticas Mar/26"       cor="#1d4ed8" icon={<Activity size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Procedimentos/mês"     value={dash.total_procedimentos}        sub="total equipes"              cor="#7c3aed" icon={<CheckCircle size={14} color="#7c3aed"/>}/>
        <KpiCard label="Indicadores críticos"  value={dash.indicadores_criticos}       sub="abaixo da meta"             cor={dash.indicadores_criticos>0?"#dc2626":"#16a34a"} icon={<AlertTriangle size={14} color={dash.indicadores_criticos>0?"#dc2626":"#16a34a"}/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Produção mensal — 6 meses</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Line type="monotone" dataKey="1a_consulta"   stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 3 }} name="1ª Consulta"/>
                <Line type="monotone" dataKey="procedimentos" stroke="#7c3aed" strokeWidth={1.5} dot={false}   name="Procedimentos"/>
                <Line type="monotone" dataKey="urgencias"     stroke="#dc2626" strokeWidth={1.5} dot={false}   name="Urgências"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>1ª consulta por equipe ESB — Mar/26</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.equipes_resumo} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{ fontSize: 9 }}/>
                <YAxis type="category" dataKey="equipe" tick={{ fontSize: 9 }} width={110}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="1a_consulta_mes" name="1ª consulta" radius={[0,4,4,0]}>
                  {dash.equipes_resumo?.map((e: any, i: number) => <Cell key={i} fill={e.status==="ok"?"#16a34a":e.status==="atencao"?"#d97706":"#dc2626"}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbaEquipes({ equipes }: { equipes: any[] | undefined }) {
  if (!equipes) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {equipes.map(e => {
          const cor = STATUS_COR[e.status];
          const pct = Math.round(e["1a_consulta_mes"] / e.meta_1a * 100);
          return (
            <div key={e.equipe} style={{ background: "#fff", border: `1px solid ${cor}22`, borderTop: `3px solid ${cor}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{e.equipe}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>CD: {e.cd} · TSS: {e.tss}</div>
                </div>
                <span style={{ background: cor+"15", color: cor, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5 }}>{pct}% meta</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12, marginBottom: 10 }}>
                {[["1ª Consulta", e["1a_consulta_mes"]], ["Total cons.", e.cons_total_mes], ["Urgências", e.urgencia_mes], ["Restaurações", e.restauracao_mes], ["Extrações", e.extracao_mes], ["Escovação", e.escovacao_mes]].map(([k,v])=>(
                  <div key={String(k)} style={{ textAlign: "center", background: "#f9fafb", borderRadius: 6, padding: "6px 4px" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#374151" }}>{v}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{k}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 8, overflow: "hidden" }}>
                <div style={{ background: cor, height: "100%", width: `${Math.min(pct,100)}%`, borderRadius: 6 }}/>
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Pop. coberta: {e.pop_coberta.toLocaleString("pt-BR")} hab.</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaIndicadores({ indicadores }: { indicadores: any[] | undefined }) {
  if (!indicadores) return null;
  return (
    <div>
      {["critico","atencao","ok"].map(nivel => {
        const grupo = indicadores.filter(i => i.status === nivel);
        if (!grupo.length) return null;
        const cor = STATUS_COR[nivel];
        return (
          <div key={nivel} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: cor, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 1 }}>{nivel==="critico"?"Crítico":nivel==="atencao"?"Atenção":"OK"}</div>
            {grupo.map(ind => {
              const pct = ind.invertido ? 100 : Math.min(100, Math.round(ind.valor / ind.meta * 100));
              return (
                <div key={ind.indicador} style={{ background: "#fff", border: `1px solid ${cor}22`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ind.invertido ? 0 : 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                    <div style={{ flexShrink: 0, marginLeft: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade.startsWith("%") || ind.unidade.startsWith("/") ? ind.unidade : " "+ind.unidade}</span>
                      <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade.startsWith("%") || ind.unidade.startsWith("/") ? ind.unidade : ""}</span>
                    </div>
                  </div>
                  {!ind.invertido && (
                    <div style={{ background: "#f3f4f6", borderRadius: 6, height: 8, overflow: "hidden" }}>
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

function AbaProcedimentos({ procs }: { procs: any[] | undefined }) {
  if (!procs) return null;
  const total = procs.reduce((s, p) => s + p.qtd, 0);
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Procedimentos realizados — Mar/2026</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={procs} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fontSize: 9 }}/>
              <YAxis type="category" dataKey="procedimento" tick={{ fontSize: 9 }} width={200}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="qtd" name="Qtd." radius={[0,4,4,0]}>
                {procs.map((p, i) => <Cell key={i} fill={TIPO_COR[p.tipo] || "#94a3b8"}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {procs.map(p => (
          <div key={p.procedimento} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", fontSize: 12 }}>
            <span style={{ color: TIPO_COR[p.tipo]||"#374151", fontWeight: 700 }}>{p.qtd}</span>
            <span style={{ color: "#6b7280", marginLeft: 6 }}>{p.procedimento}</span>
            <span style={{ marginLeft: 6, fontSize: 10, background: (TIPO_COR[p.tipo]||"#94a3b8")+"15", color: TIPO_COR[p.tipo]||"#6b7280", padding: "1px 5px", borderRadius: 3 }}>{p.tipo}</span>
          </div>
        ))}
        <div style={{ background: "#1d4ed8", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#fff", fontWeight: 700 }}>
          Total: {total} procedimentos
        </div>
      </div>
    </div>
  );
}

type Aba = "dashboard"|"equipes"|"indicadores"|"procedimentos";

export default function SaudeBucal() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dashRaw }   = useQuery({ queryKey: ["sb-dash"], queryFn: () => apiGet("/api/saude-bucal/dashboard") as Promise<any> });
  const { data: equipes }   = useQuery({ queryKey: ["sb-equip"],queryFn: () => apiGet("/api/saude-bucal/equipes") as Promise<any[]>,       enabled: aba==="dashboard"||aba==="equipes" });
  const { data: indicadores}= useQuery({ queryKey: ["sb-ind"],  queryFn: () => apiGet("/api/saude-bucal/indicadores") as Promise<any[]>,   enabled: aba==="indicadores" });
  const { data: procs }     = useQuery({ queryKey: ["sb-proc"], queryFn: () => apiGet("/api/saude-bucal/procedimentos") as Promise<any[]>, enabled: aba==="procedimentos" });
  const { data: hist }      = useQuery({ queryKey: ["sb-hist"], queryFn: () => apiGet("/api/saude-bucal/historico") as Promise<any[]>,     enabled: aba==="dashboard" });

  const dash = dashRaw && equipes && hist ? { ...dashRaw, historico: hist, equipes_resumo: equipes } : null;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",    label: "Dashboard" },
    { id: "equipes",      label: "Equipes ESB" },
    { id: "indicadores",  label: "Indicadores" },
    { id: "procedimentos",label: "Procedimentos" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#0891b2 0%,#1d4ed8 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Saúde Bucal</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>ESB · Procedimentos Odontológicos · SISAB · FMS Apuí/AM</p>
          </div>
          {dashRaw && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.total_1a_consulta}</div>
              <div style={{ fontSize: 10, opacity: .8 }}>1ª consulta/mês</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e0f2fe" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #0891b2":"2px solid transparent", color: aba===a.id?"#0891b2":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"     && <AbaDashboard dash={dash}/>}
        {aba==="equipes"       && <AbaEquipes equipes={equipes}/>}
        {aba==="indicadores"   && <AbaIndicadores indicadores={indicadores}/>}
        {aba==="procedimentos" && <AbaProcedimentos procs={procs}/>}
      </div>
    </div>
  );
}
