import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Cell } from "recharts";
import { Layers, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const PRIOR_COR: Record<string, string> = { urgencia: "#dc2626", eletiva: "#1d4ed8" };

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
        <KpiCard label="Taxa de ocupação"     value={dash.taxa_ocupacao_pct+"%"}          sub={`${dash.leitos_ocupados}/${dash.leitos_total} leitos`}  cor={STATUS_COR[dash.taxa_ocupacao_status]} icon={<Layers size={14} color={STATUS_COR[dash.taxa_ocupacao_status]}/>}/>
        <KpiCard label="Média permanência"    value={dash.media_permanencia_dias+"d"}      sub="giro: "+dash.giro_cama+" camas/mês"                     cor="#1d4ed8"                               icon={<Clock size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Internações/mês"      value={dash.internacoes_mes}                 sub={`${dash.altas_mes} altas · ${dash.obitos_internacao_mes} óbitos`} cor="#374151"               icon={<TrendingUp size={14} color="#374151"/>}/>
        <KpiCard label="Lista espera cirurgia" value={dash.lista_espera_cirurgia}          sub="procedimentos eletivos"                                  cor={STATUS_COR[dash.lista_espera_status]} icon={<AlertTriangle size={14} color={STATUS_COR[dash.lista_espera_status]}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Internações e taxa de ocupação — 6 meses</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="%"/>
                <Tooltip contentStyle={TT}/>
                <Bar yAxisId="l" dataKey="internacoes"  name="Internações" fill="#1d4ed8" radius={[4,4,0,0]}/>
                <Bar yAxisId="l" dataKey="transferencias" name="Transferências" fill="#d97706" radius={[4,4,0,0]}/>
                <Line yAxisId="r" type="monotone" dataKey="taxa_ocupacao" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="Ocupação %"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaLeitos({ clinicas }: { clinicas: any[] | undefined }) {
  if (!clinicas) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {clinicas.map(c => {
          const cor = STATUS_COR[c.status];
          const barW = Math.round(c.taxa_pct);
          return (
            <div key={c.clinica} style={{ background: "#fff", border: `1px solid ${cor}22`, borderRadius: 8, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{c.clinica}</span>
                  <span style={{ marginLeft: 10, fontSize: 12, color: "#6b7280" }}>{c.ocupados}/{c.total} leitos</span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{c.taxa_pct}%</span>
                  <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{c.status}</span>
                </div>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 8 }}>
                <div style={{ background: cor, height: "100%", width: `${barW}%`, borderRadius: 6, transition: "width .3s" }}/>
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Permanência média: {c.permanencia_med} dias</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaCausas({ causas }: { causas: any[] | undefined }) {
  if (!causas) return null;
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Internações por capítulo CID — Mar/26</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={causas} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fontSize: 9 }}/>
              <YAxis type="category" dataKey="capitulo_cid" tick={{ fontSize: 9 }} width={180}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="internacoes" name="Internações" fill="#1d4ed8" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AbaListaEspera({ lista }: { lista: any[] | undefined }) {
  if (!lista) return null;
  const urgentes = lista.filter(i => i.prioridade === "urgencia" && i.aguardando > 0);
  return (
    <div>
      {urgentes.length > 0 && (
        <div style={{ marginBottom: 14, padding: "10px 14px", background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca", fontSize: 12, color: "#dc2626" }}>
          ⚠ {urgentes.length} procedimento(s) de urgência na fila — avaliar priorização
        </div>
      )}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              {["Procedimento","Aguardando","Espera média","Prioridade"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: h==="Procedimento"?"left":"center" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.map((item, i) => {
              const cor = PRIOR_COR[item.prioridade];
              return (
                <tr key={item.procedimento} style={{ borderTop: "1px solid #f3f4f6", background: i%2===0?"#fff":"#f9fafb" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 600 }}>
                    {item.procedimento}
                    {item.alerta && <div style={{ fontSize: 10, color: "#dc2626", marginTop: 2 }}>⚠ {item.alerta}</div>}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: item.aguardando>5?"#dc2626":"#374151" }}>{item.aguardando}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", color: item.espera_media_dias>60?"#dc2626":item.espera_media_dias>30?"#d97706":"#374151" }}>{item.espera_media_dias} dias</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                    <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{item.prioridade}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Aba = "dashboard"|"leitos"|"causas"|"lista-espera";

export default function GestaoLeitos() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash   } = useQuery({ queryKey: ["gl-dash"],  queryFn: () => apiGet("/api/gestao-leitos/dashboard")   as Promise<any> });
  const { data: clin   } = useQuery({ queryKey: ["gl-clin"],  queryFn: () => apiGet("/api/gestao-leitos/leitos-clinica") as Promise<any[]>, enabled: aba==="leitos" });
  const { data: hist   } = useQuery({ queryKey: ["gl-hist"],  queryFn: () => apiGet("/api/gestao-leitos/historico")    as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: causas } = useQuery({ queryKey: ["gl-caus"],  queryFn: () => apiGet("/api/gestao-leitos/causas")       as Promise<any[]>, enabled: aba==="causas" });
  const { data: lista  } = useQuery({ queryKey: ["gl-lista"], queryFn: () => apiGet("/api/gestao-leitos/lista-espera") as Promise<any[]>, enabled: aba==="lista-espera" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "leitos",      label: `Leitos por Clínica (${dashRaw?.leitos_total ?? 0} total)` },
    { id: "causas",      label: "Causas CID" },
    { id: "lista-espera", label: `Lista de Espera (${dashRaw?.lista_espera_cirurgia ?? 0})` },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Gestão de Leitos</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Taxa de ocupação · Internações · Rotatividade · Lista de espera · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.taxa_ocupacao_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>ocupação</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.internacoes_mes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>intern./mês</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #dbeafe" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #1d4ed8":"2px solid transparent", color: aba===a.id?"#1d4ed8":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"    && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="leitos"       && <AbaLeitos clinicas={clin}/>}
        {aba==="causas"       && <AbaCausas causas={causas}/>}
        {aba==="lista-espera" && <AbaListaEspera lista={lista}/>}
      </div>
    </div>
  );
}
