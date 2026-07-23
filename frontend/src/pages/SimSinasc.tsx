import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";
import { Activity, AlertTriangle, Heart, Users } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const LOCAL_COR: Record<string, string> = { hospital: "#1d4ed8", domicilio: "#d97706", via_publica: "#dc2626" };
const TIPO_OI: Record<string, string> = { neonatal_precoce: "#dc2626", neonatal_tardio: "#d97706", pos_neonatal: "#7c3aed" };
const TIPO_OI_LABEL: Record<string, string> = { neonatal_precoce: "Neonatal precoce (0-6d)", neonatal_tardio: "Neonatal tardio (7-27d)", pos_neonatal: "Pós-neonatal (28d-1a)" };

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
  const capitulosBar = [
    { name: "Cardiovasc.", n: 3, cor: "#1d4ed8" },
    { name: "Causas ext.", n: 2, cor: "#dc2626" },
    { name: "Neoplasias",  n: 1, cor: "#7c3aed" },
    { name: "Respirat.",   n: 1, cor: "#0891b2" },
    { name: "Infecciosas", n: 1, cor: "#d97706" },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Óbitos gerais 2026"  value={dash.obitos_gerais_2026}    sub="Jan–Mar/26"                 cor="#374151"  icon={<Activity size={14} color="#374151"/>}/>
        <KpiCard label="Nascidos vivos 2026" value={dash.nascidos_vivos_2026}   sub="Jan–Mar/26"                 cor="#16a34a"  icon={<Heart size={14} color="#16a34a"/>}/>
        <KpiCard label="Óbitos infantis 2026" value={dash.obitos_infantis_2026} sub="< 1 ano"                    cor={dash.obitos_infantis_2026>0?"#dc2626":"#16a34a"} icon={<AlertTriangle size={14} color={dash.obitos_infantis_2026>0?"#dc2626":"#16a34a"}/>}/>
        <KpiCard label="TMI 2026 (parcial)"  value={dash.tmi_2026}              sub="/1.000 NV · meta ≤15"       cor={dash.tmi_2026>15?"#dc2626":"#16a34a"} icon={<Activity size={14} color={dash.tmi_2026>15?"#dc2626":"#16a34a"}/>}/>
        <KpiCard label="Óbitos evitáveis"    value={dash.obitos_evitaveis}      sub="Jan–Mar/26"                 cor={dash.obitos_evitaveis>2?"#d97706":"#16a34a"} icon={<AlertTriangle size={14} color={dash.obitos_evitaveis>2?"#d97706":"#16a34a"}/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>TMI — Histórico anual (por 1.000 NV)</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="ano" tick={{ fontSize: 10 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Line type="monotone" dataKey="tmi"           stroke="#dc2626" strokeWidth={2.5} dot={{ r: 4 }} name="TMI"/>
                <Line type="monotone" dataKey="obitos_gerais" stroke="#374151" strokeWidth={1.5} dot={false}   name="Óbitos gerais"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Óbitos gerais 2026 por capítulo CID</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capitulosBar} barSize={36}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="n" name="Óbitos" radius={[4,4,0,0]}>
                  {capitulosBar.map((b, i) => <Cell key={i} fill={b.cor}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbaObitos({ obitos }: { obitos: any[] | undefined }) {
  if (!obitos) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {obitos.map(o => {
          const lCor = LOCAL_COR[o.local_ocorrencia] || "#6b7280";
          return (
            <div key={o.id} style={{ background: "#fff", border: `1px solid ${o.evitavel?"#d97706":"#e5e7eb"}`, borderLeft: `4px solid ${lCor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{o.capitulo_cid}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {o.evitavel && <span style={{ background: "#fef3c7", color: "#d97706", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>Evitável</span>}
                  <span style={{ background: lCor+"15", color: lCor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{o.local_ocorrencia.replace("_"," ")}</span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>{o.causa_basica}</div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280" }}>
                <span>{o.sexo==="M"?"♂ Masculino":"♀ Feminino"} · {o.idade} anos</span>
                <span>Mês: <strong>{o.mes}/2026</strong></span>
                <span>Investigado: <strong style={{ color: o.investigado?"#16a34a":"#dc2626" }}>{o.investigado?"Sim":"Não"}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaObitosInfantis({ obitos }: { obitos: any[] | undefined }) {
  if (!obitos) return null;
  return (
    <div>
      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 12, marginBottom: 16, color: "#dc2626" }}>
        <strong>⚠ {obitos.length} óbito{obitos.length!==1?"s":""} infantil{obitos.length!==1?"s":""} Jan–Mar/2026.</strong> Todos são passíveis de investigação obrigatória (Portaria MS 72/2010). Comitê de Mortalidade Infantil municipal deve ser acionado.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {obitos.map(o => {
          const tCor = TIPO_OI[o.tipo] || "#6b7280";
          return (
            <div key={o.id} style={{ background: "#fff", border: `1px solid ${tCor}22`, borderLeft: `4px solid ${tCor}`, borderRadius: 8, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{TIPO_OI_LABEL[o.tipo]}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {o.evitavel && <span style={{ background: "#fef3c7", color: "#d97706", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>Evitável</span>}
                  <span style={{ background: tCor+"15", color: tCor, fontSize: 10, padding: "2px 7px", borderRadius: 4 }}>{o.mes}/2026</span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>{o.causa}</div>
              <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#6b7280" }}>
                <span>IG: <strong>{o.ig_semanas} sem.</strong></span>
                <span>Peso nasc.: <strong>{o.peso_nasc}g</strong></span>
                <span>Local: <strong>{o.local}</strong></span>
                <span>Investigado: <strong style={{ color: o.investigado?"#16a34a":"#dc2626" }}>{o.investigado?"Sim":"Não"}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaNascidosVivos({ nvs }: { nvs: any[] | undefined }) {
  if (!nvs) return null;
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Nascimentos por mês 2026</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={nvs} barSize={40}>
              <XAxis dataKey="mes" tick={{ fontSize: 10 }}/>
              <YAxis tick={{ fontSize: 10 }}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="nascimentos" name="Nascimentos" fill="#16a34a" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#16a34a", color: "#fff" }}>
              {["Mês","Nascimentos","Parto normal","Cesárea","Prematuros","Baixo peso","Apgar1<7","Apgar5<7"].map(h=>(
                <th key={h} style={{ padding: "8px 12px", textAlign: h==="Mês"?"left":"center" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nvs.map((n, i) => (
              <tr key={n.mes} style={{ borderTop: "1px solid #f3f4f6", background: i%2===0?"#fff":"#f9fafb" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600 }}>{n.mes}/26</td>
                <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, color: "#16a34a" }}>{n.nascimentos}</td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: "#1d4ed8" }}>{n.parto_normal_pct}%</td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: n.cesarea_pct>40?"#d97706":"#374151" }}>{n.cesarea_pct}%</td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: n.prematuros>0?"#d97706":"#9ca3af" }}>{n.prematuros}</td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: n.baixo_peso>0?"#d97706":"#9ca3af" }}>{n.baixo_peso}</td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: n.apgar1_menor7>0?"#d97706":"#9ca3af" }}>{n.apgar1_menor7}</td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: n.apgar5_menor7>0?"#dc2626":"#9ca3af" }}>{n.apgar5_menor7}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Aba = "dashboard"|"obitos"|"infantis"|"nv";

export default function SimSinasc() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dashRaw } = useQuery({ queryKey: ["sim-dash"],  queryFn: () => apiGet("/api/sim-sinasc/dashboard")      as Promise<any> });
  const { data: hist }    = useQuery({ queryKey: ["sim-hist"],  queryFn: () => apiGet("/api/sim-sinasc/historico")       as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: obitos }  = useQuery({ queryKey: ["sim-obit"],  queryFn: () => apiGet("/api/sim-sinasc/obitos")          as Promise<any[]>, enabled: aba==="obitos" });
  const { data: oi }      = useQuery({ queryKey: ["sim-oi"],    queryFn: () => apiGet("/api/sim-sinasc/obitos-infantis") as Promise<any[]>, enabled: aba==="infantis" });
  const { data: nvs }     = useQuery({ queryKey: ["sim-nv"],    queryFn: () => apiGet("/api/sim-sinasc/nascidos-vivos")  as Promise<any[]>, enabled: aba==="nv" });

  const dash = dashRaw && hist ? { ...dashRaw, historico: hist } : null;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "obitos",    label: `Óbitos (${dashRaw?.obitos_gerais_2026 ?? 0})` },
    { id: "infantis",  label: `Óbitos Infantis (${dashRaw?.obitos_infantis_2026 ?? 0})` },
    { id: "nv",        label: `Nascidos Vivos (${dashRaw?.nascidos_vivos_2026 ?? 0})` },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#374151 0%,#1d4ed8 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>SIM / SINASC</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Mortalidade · Nascidos Vivos · TMI · Comitê Infantil · FMS Apuí/AM</p>
          </div>
          {dashRaw && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.tmi_2026}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>TMI 2026</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.nascidos_vivos_2026}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>NV 2026</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #f1f5f9" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #374151":"2px solid transparent", color: aba===a.id?"#374151":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && <AbaDashboard dash={dash}/>}
        {aba==="obitos"    && <AbaObitos obitos={obitos}/>}
        {aba==="infantis"  && <AbaObitosInfantis obitos={oi}/>}
        {aba==="nv"        && <AbaNascidosVivos nvs={nvs}/>}
      </div>
    </div>
  );
}
