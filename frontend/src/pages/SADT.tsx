import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Cell } from "recharts";
import { FlaskConical, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };

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
      {dash.criticos_pendentes > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#dc2626" }}>
          <strong>⚠ {dash.criticos_pendentes} resultado(s) crítico(s) pendente(s) de notificação</strong> — verificação imediata necessária.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Exames/mês"          value={dash.exames_mes.toLocaleString("pt-BR")} sub={`${dash.laudos_digitais_pct}% laudos digitais`} cor="#374151"                              icon={<FlaskConical size={14} color="#374151"/>}/>
        <KpiCard label="TAT Laboratório"     value={dash.tat_lab_horas+"h"}                  sub={`meta: ${dash.meta_tat_lab_horas}h`}            cor={dash.tat_lab_horas<=dash.meta_tat_lab_horas?"#16a34a":"#d97706"}     icon={<Clock size={14} color={dash.tat_lab_horas<=dash.meta_tat_lab_horas?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Pendentes resultado" value={dash.pendentes_resultado}                sub={`${dash.pendentes_coleta} pend. coleta`}        cor={dash.pendentes_resultado>50?"#d97706":"#16a34a"}                     icon={<AlertTriangle size={14} color={dash.pendentes_resultado>50?"#d97706":"#16a34a"}/>}/>
        <KpiCard label="Exames alterados"    value={dash.alterados_pct+"%"}                  sub={`${dash.exames_alterados_mes} exames`}          cor="#d97706"                              icon={<CheckCircle size={14} color="#d97706"/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Produção SADT — 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="lab"    name="Laboratório" fill="#0369a1" radius={[4,4,0,0]} stackId="a"/>
                <Bar dataKey="imagem" name="Imagem"      fill="#7c3aed" radius={[0,0,0,0]} stackId="a"/>
                <Bar dataKey="outros" name="Outros"      fill="#374151" radius={[0,0,4,4]} stackId="a"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaLaboratorio({ exames }: { exames: any[] | undefined }) {
  if (!exames) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;
  return (
    <div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#0369a1", color: "#fff" }}>
              {["Exame","Realizados","Alterados","% Alter.","TAT","Críticos","Status"].map(h=>(
                <th key={h} style={{ padding: "7px 10px", textAlign: h==="Exame"?"left":"center" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exames.map((e, i) => (
              <tr key={e.exame} style={{ borderTop: "1px solid #f3f4f6", background: i%2===0?"#fff":"#f8fafc" }}>
                <td style={{ padding: "7px 10px", fontWeight: 500 }}>{e.exame}</td>
                <td style={{ padding: "7px 10px", textAlign: "center", fontWeight: 700 }}>{e.realizados_mes}</td>
                <td style={{ padding: "7px 10px", textAlign: "center" }}>{e.alterados}</td>
                <td style={{ padding: "7px 10px", textAlign: "center", color: e.alt_pct > 25 ? "#d97706" : "#374151" }}>{e.alt_pct}%</td>
                <td style={{ padding: "7px 10px", textAlign: "center", color: e.tat_h > 8 ? "#dc2626" : "#16a34a" }}>{e.tat_h}h</td>
                <td style={{ padding: "7px 10px", textAlign: "center" }}>
                  {e.criticos > 0 && <span style={{ background: "#fef2f2", color: "#dc2626", fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{e.criticos}</span>}
                  {e.criticos === 0 && <span style={{ color: "#9ca3af" }}>—</span>}
                </td>
                <td style={{ padding: "7px 10px", textAlign: "center" }}>
                  <span style={{ background: STATUS_COR[e.status]+"15", color: STATUS_COR[e.status], fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{e.status}</span>
                </td>
              </tr>
            ))}
            {exames.filter(e => e.alerta).map(e => (
              <tr key={e.exame+"_alert"}>
                <td colSpan={7} style={{ padding: "4px 10px", background: "#fef9c3", fontSize: 11, color: "#92400e" }}>⚠ {e.exame}: {e.alerta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AbaImagem({ modalidades }: { modalidades: any[] | undefined }) {
  if (!modalidades) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {modalidades.map(m => {
          const cor = STATUS_COR[m.status];
          return (
            <div key={m.modalidade} style={{ background: "#fff", border: `1px solid ${m.alerta?"#dc262222":"#e5e7eb"}`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{m.modalidade}</span>
                  <span style={{ marginLeft: 8, fontSize: 11, color: "#6b7280" }}>{m.equipamento}</span>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                  <span>Realizados: <strong style={{ color: "#374151" }}>{m.realizados_mes}</strong></span>
                  <span>Pendentes: <strong style={{ color: m.pendentes > 3 ? "#dc2626" : "#374151" }}>{m.pendentes}</strong></span>
                  <span>TAT: <strong style={{ color: m.tat_h > 48 ? "#dc2626" : m.tat_h > 24 ? "#d97706" : "#16a34a" }}>{m.tat_h}h</strong></span>
                </div>
              </div>
              {m.alerta && <div style={{ marginTop: 5, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {m.alerta}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaCriticos({ criticos }: { criticos: any[] | undefined }) {
  if (!criticos) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {criticos.map(c => {
          const notCor = c.notificado ? "#16a34a" : "#dc2626";
          return (
            <div key={c.id} style={{ background: "#fff", border: `2px solid ${notCor}44`, borderLeft: `5px solid ${notCor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{c.id}</span>
                  <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 700 }}>{c.exame}</span>
                </div>
                <span style={{ background: notCor+"15", color: notCor, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                  {c.notificado ? "✓ Notificado" : "⚠ PENDENTE"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12, color: "#6b7280" }}>
                <span>Valor: <strong style={{ color: "#dc2626", fontSize: 14 }}>{c.valor}</strong></span>
                <span>Referência: {c.referencia}</span>
                <span>Resultado: {c.hora_resultado}</span>
              </div>
              {c.conduta && <div style={{ marginTop: 6, background: "#f0fdf4", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#16a34a" }}>Conduta: {c.conduta}</div>}
              {c.alerta && <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 700 }}>⚠ {c.alerta}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Aba = "dashboard"|"laboratorio"|"imagem"|"criticos";

export default function SADT() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["sadt-dash"],  queryFn: () => apiGet("/api/sadt/dashboard")  as Promise<any> });
  const { data: hist  } = useQuery({ queryKey: ["sadt-hist"],  queryFn: () => apiGet("/api/sadt/historico")  as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: lab   } = useQuery({ queryKey: ["sadt-lab"],   queryFn: () => apiGet("/api/sadt/laboratorio") as Promise<any[]>, enabled: aba==="laboratorio" });
  const { data: imgs  } = useQuery({ queryKey: ["sadt-img"],   queryFn: () => apiGet("/api/sadt/imagem")     as Promise<any[]>, enabled: aba==="imagem" });
  const { data: crits } = useQuery({ queryKey: ["sadt-crit"],  queryFn: () => apiGet("/api/sadt/criticos")   as Promise<any[]>, enabled: aba==="criticos" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "laboratorio", label: `Laboratório (${dashRaw?.exames_lab_mes?.toLocaleString("pt-BR") ?? 0})` },
    { id: "imagem",      label: `Imagem (${dashRaw?.exames_imagem_mes ?? 0})` },
    { id: "criticos",    label: `Resultados Críticos${dashRaw?.criticos_pendentes>0?" ⚠":""}` },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>SADT — Apoio Diagnóstico</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Laboratório · Imagem · Resultados Críticos · TAT · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.exames_mes.toLocaleString("pt-BR")}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>exames/mês</div>
              </div>
              {dashRaw.criticos_pendentes > 0 && (
                <div style={{ background: "rgba(255,80,80,.4)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.criticos_pendentes}</div>
                  <div style={{ fontSize: 10, opacity: .8 }}>críticos pend.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"3px solid #1351b4":"2px solid transparent", color: aba===a.id?"#0369a1":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && !dashRaw && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="laboratorio" && <AbaLaboratorio exames={lab}/>}
        {aba==="imagem"      && <AbaImagem modalidades={imgs}/>}
        {aba==="criticos"    && <AbaCriticos criticos={crits}/>}
      </div>
    </div>
  );
}
