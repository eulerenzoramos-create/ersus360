import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Cell } from "recharts";
import { Network, Clock, AlertTriangle, Truck } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const TFD_COR: Record<string, string> = { ativo: "#16a34a", pendente: "#d97706" };

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
        <KpiCard label="Solicitações/mês"    value={dash.solicitacoes_mes}      sub={`${dash.autorizadas_mes_pct}% autorizadas`}   cor="#374151"                              icon={<Network size={14} color="#374151"/>}/>
        <KpiCard label="Fila total"          value={dash.solicitacoes_pendentes} sub="aguardando regulação"                         cor={dash.solicitacoes_pendentes>300?"#d97706":"#374151"} icon={<Clock size={14} color={dash.solicitacoes_pendentes>300?"#d97706":"#374151"}/>}/>
        <KpiCard label="Espera média"        value={dash.espera_media_dias+"d"} sub="especialidades"                               cor={STATUS_COR[dash.espera_media_status]} icon={<Clock size={14} color={STATUS_COR[dash.espera_media_status]}/>}/>
        <KpiCard label="TFD ativos"          value={dash.tfd_ativos}            sub="tratamento fora domicílio"                    cor={STATUS_COR[dash.tfd_status]}          icon={<Truck size={14} color={STATUS_COR[dash.tfd_status]}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Regulação — fluxo mensal</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="d"/>
                <Tooltip contentStyle={TT}/>
                <Line yAxisId="l" type="monotone" dataKey="solicitacoes" stroke="#374151"  strokeWidth={2} dot={{ r: 3 }} name="Solicitações"/>
                <Line yAxisId="l" type="monotone" dataKey="autorizadas"  stroke="#16a34a" strokeWidth={2} dot={false}    name="Autorizadas"/>
                <Line yAxisId="l" type="monotone" dataKey="pendentes"    stroke="#dc2626" strokeWidth={1.5} dot={false}  name="Fila total"/>
                <Line yAxisId="r" type="monotone" dataKey="espera_media" stroke="#d97706" strokeWidth={1.5} dot={false}  name="Espera (dias)" strokeDasharray="4 2"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaEspecialidades({ espec }: { espec: any[] | undefined }) {
  if (!espec) return null;
  const criticas = espec.filter(e => e.status === "critico");
  return (
    <div>
      {criticas.length > 0 && (
        <div style={{ marginBottom: 14, padding: "10px 14px", background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca", fontSize: 12, color: "#dc2626" }}>
          ⚠ {criticas.length} especialidade(s) em situação crítica: {criticas.map(c => c.especialidade).join(", ")}
        </div>
      )}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#374151", color: "#fff" }}>
              {["Especialidade","Pendentes","Espera (d)","Autor./mês","Negados","Status"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: h==="Especialidade"?"left":"center" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {espec.map((e, i) => {
              const cor = STATUS_COR[e.status];
              return (
                <tr key={e.especialidade} style={{ borderTop: "1px solid #f3f4f6", background: i%2===0?"#fff":"#f9fafb" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 600 }}>
                    {e.especialidade}
                    {e.observacao && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{e.observacao}</div>}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: e.pendentes>40?"#dc2626":"#374151" }}>{e.pendentes}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", color: e.espera_media_dias>60?"#dc2626":e.espera_media_dias>40?"#d97706":"#374151", fontWeight: 600 }}>{e.espera_media_dias}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", color: "#16a34a" }}>{e.autorizados_mes}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", color: e.negados_mes>0?"#dc2626":"#9ca3af" }}>{e.negados_mes}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                    <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{e.status}</span>
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

function AbaExames({ exames }: { exames: any[] | undefined }) {
  if (!exames) return null;
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Exames complementares — fila e espera</div>
        <div style={{ height: 210 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={exames} layout="vertical" barSize={12}>
              <XAxis type="number" tick={{ fontSize: 9 }}/>
              <YAxis type="category" dataKey="exame" tick={{ fontSize: 9 }} width={190}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="pendentes" name="Na fila" radius={[0,4,4,0]}>
                {exames.map((e, i) => <Cell key={i} fill={STATUS_COR[e.status]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AbaTFD({ tfd }: { tfd: any[] | undefined }) {
  if (!tfd) return null;
  const custoTotal = tfd.filter(t=>t.status==="ativo").reduce((s,t)=>s+t.custo_viagem, 0);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
        {[["TFD ativos",tfd.filter(t=>t.status==="ativo").length,"#16a34a"],["Custo estimado/mês","R$"+custoTotal.toLocaleString("pt-BR"),"#d97706"],["Destino Manaus",tfd.filter(t=>t.destino==="Manaus").length,"#1d4ed8"]].map(([k,v,c])=>(
          <div key={String(k)} style={{ background:"#fff",border:`1px solid ${c}22`,borderTop:`3px solid ${c}`,borderRadius:10,padding:"12px 14px",textAlign:"center" }}>
            <div style={{ fontSize:20,fontWeight:800,color:String(c) }}>{v}</div>
            <div style={{ fontSize:12,color:"#6b7280" }}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tfd.map(t => {
          const cor = TFD_COR[t.status];
          return (
            <div key={t.id} style={{ background: "#fff", border: `1px solid ${t.alerta?"#dc262222":"#e5e7eb"}`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{t.id}</span>
                  <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600 }}>{t.especialidade}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ background: "#f3f4f6", color: "#374151", fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4 }}>{t.destino}</span>
                  <span style={{ background: "#fef9c3", color: "#a16207", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>R${t.custo_viagem.toLocaleString("pt-BR")}/viagem</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Frequência: <strong>{t.frequencia}</strong></div>
              {t.alerta && <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {t.alerta}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Aba = "dashboard"|"especialidades"|"exames"|"tfd";

export default function RegulacaoAcesso() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["reg-dash"],  queryFn: () => apiGet("/api/regulacao-acesso/dashboard")     as Promise<any> });
  const { data: espec } = useQuery({ queryKey: ["reg-espec"], queryFn: () => apiGet("/api/regulacao-acesso/especialidades") as Promise<any[]>, enabled: aba==="especialidades" });
  const { data: exam  } = useQuery({ queryKey: ["reg-exam"],  queryFn: () => apiGet("/api/regulacao-acesso/exames")         as Promise<any[]>, enabled: aba==="exames" });
  const { data: tfd   } = useQuery({ queryKey: ["reg-tfd"],   queryFn: () => apiGet("/api/regulacao-acesso/tfd")            as Promise<any[]>, enabled: aba==="tfd" });
  const { data: hist  } = useQuery({ queryKey: ["reg-hist"],  queryFn: () => apiGet("/api/regulacao-acesso/historico")      as Promise<any[]>, enabled: aba==="dashboard" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",      label: "Dashboard" },
    { id: "especialidades", label: `Especialidades (${dashRaw?.solicitacoes_criticas ?? 0} críticas)` },
    { id: "exames",         label: "Exames Complementares" },
    { id: "tfd",            label: `TFD (${dashRaw?.tfd_ativos ?? 0} ativos)` },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#374151 0%,#4b5563 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Regulação de Acesso</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>SISREG · Especialidades · Exames · TFD · Central de Regulação · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.solicitacoes_pendentes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>na fila</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.espera_media_dias}d</div>
                <div style={{ fontSize: 10, opacity: .8 }}>espera média</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #f3f4f6" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #374151":"2px solid transparent", color: aba===a.id?"#374151":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"      && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="especialidades" && <AbaEspecialidades espec={espec}/>}
        {aba==="exames"         && <AbaExames exames={exam}/>}
        {aba==="tfd"            && <AbaTFD tfd={tfd}/>}
      </div>
    </div>
  );
}
