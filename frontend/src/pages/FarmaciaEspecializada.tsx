import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Pill, AlertTriangle, Clock, DollarSign } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#e4e7ec", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626", urgente: "#dc2626" };
const COMP_COR: Record<string, string> = {
  "Especializado A1": "#dc2626",
  "Especializado B1": "#d97706",
  "Especializado B2": "#16a34a",
};

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

function AbaDashboard({ dash, meds }: { dash: any; meds: any[] | undefined }) {
  if (!dash) return null;
  const barData = meds?.map(m => ({ name: m.medicamento.split(" ")[0], custo: m.custo_mes, comp: m.componente })) ?? [];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Pacientes CEAF"         value={dash.pacientes_ceaf}               sub="cadastros ativos"       cor="#7c3aed"                                      icon={<Pill size={14} color="#7c3aed"/>}/>
        <KpiCard label="Gasto mensal"           value={"R$"+dash.gasto_mes.toLocaleString("pt-BR")} sub={`${dash.gasto_federal_pct}% federal`} cor="#1d4ed8"           icon={<DollarSign size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Ações judiciais ativas" value={dash.demandas_judiciais_ativas}     sub="judicialização"         cor={STATUS_COR[dash.demandas_judiciais_status]}   icon={<AlertTriangle size={14} color={STATUS_COR[dash.demandas_judiciais_status]}/>}/>
        <KpiCard label="Renovações a vencer"    value={dash.renovacoes_vencer_30d}         sub="próximos 30 dias"       cor={STATUS_COR[dash.renovacoes_status]}           icon={<Clock size={14} color={STATUS_COR[dash.renovacoes_status]}/>}/>
      </div>
      {barData.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Custo mensal por medicamento (R$)</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => `R$${v.toLocaleString("pt-BR")}`}/>
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={100}/>
                <Tooltip contentStyle={TT} formatter={(v: any) => `R$ ${v.toLocaleString("pt-BR")}`}/>
                <Bar dataKey="custo" name="Custo/mês" radius={[0,4,4,0]}>
                  {barData.map((m, i) => <Cell key={i} fill={COMP_COR[m.comp] || "#7c3aed"}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaMedicamentos({ meds }: { meds: any[] | undefined }) {
  if (!meds) return null;
  return (
    <div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#7c3aed", color: "#fff" }}>
              {["Medicamento","Componente","Pacientes","Custo/mês","Estoque","Status"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: h==="Medicamento"?"left":"center" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meds.map((m, i) => {
              const cor = STATUS_COR[m.status];
              return (
                <tr key={m.medicamento} style={{ borderTop: "1px solid #f3f4f6", background: i%2===0?"#fff":"#f9fafb" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 600 }}>
                    {m.medicamento}
                    {m.alerta && <div style={{ fontSize: 10, color: "#dc2626", marginTop: 2 }}>⚠ {m.alerta}</div>}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                    <span style={{ background: (COMP_COR[m.componente]||"#7c3aed")+"15", color: COMP_COR[m.componente]||"#7c3aed", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3 }}>{m.componente}</span>
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700 }}>{m.pacientes}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: "#1d4ed8" }}>R$ {m.custo_mes.toLocaleString("pt-BR")}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>{m.estoque_doses} doses</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                    <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{m.status}</span>
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

function AbaJudicializacao({ juds }: { juds: any[] | undefined }) {
  if (!juds) return null;
  const total = juds.reduce((s, j) => s + j.valor_mes, 0);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
        {[["Ações ativas",juds.length,"#dc2626"],["Gasto judicial/mês","R$"+total.toLocaleString("pt-BR"),"#d97706"],["Sentença favorável",juds.filter(j=>j.fase==="Sentença favorável").length,"#7c3aed"]].map(([k,v,c])=>(
          <div key={String(k)} style={{ background:"#fff",border:`1px solid ${c}22`,borderTop:`3px solid ${c}`,borderRadius:10,padding:"12px 14px",textAlign:"center" }}>
            <div style={{ fontSize:20,fontWeight:800,color:String(c) }}>{v}</div>
            <div style={{ fontSize:12,color:"#6b7280" }}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {juds.map(j => (
          <div key={j.id} style={{ background: "#fff", border: `1px solid ${j.alerta?"#dc262222":"#e5e7eb"}`, borderLeft: `4px solid ${j.fase==="Sentença favorável"?"#7c3aed":"#dc2626"}`, borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{j.id}</span>
                <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600 }}>{j.medicamento}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ background: "#fee2e2", color: "#dc2626", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 4 }}>R$ {j.valor_mes.toLocaleString("pt-BR")}/mês</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Fase: <strong>{j.fase}</strong> · Origem: {j.origem} · Início: {j.data_inicio}</div>
            {j.alerta && <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {j.alerta}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AbaRenovacoes({ renovacoes }: { renovacoes: any[] | undefined }) {
  if (!renovacoes) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {renovacoes.map(r => {
          const cor = r.dias_restantes <= 20 ? "#dc2626" : r.dias_restantes <= 30 ? "#d97706" : "#374151";
          return (
            <div key={r.paciente} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "11px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{r.paciente}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{r.medicamento}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: cor }}>{r.dias_restantes} dias</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>Vence: {r.vencimento}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Aba = "dashboard"|"medicamentos"|"judicializacao"|"renovacoes";

export default function FarmaciaEspecializada() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash } = useQuery({ queryKey: ["fe-dash"], queryFn: () => apiGet("/api/farmacia-especializada/dashboard")       as Promise<any> });
  const { data: meds } = useQuery({ queryKey: ["fe-med"],  queryFn: () => apiGet("/api/farmacia-especializada/medicamentos")    as Promise<any[]>, enabled: aba==="dashboard"||aba==="medicamentos" });
  const { data: juds } = useQuery({ queryKey: ["fe-jud"],  queryFn: () => apiGet("/api/farmacia-especializada/judicializacoes") as Promise<any[]>, enabled: aba==="judicializacao" });
  const { data: renov}= useQuery({ queryKey: ["fe-ren"],  queryFn: () => apiGet("/api/farmacia-especializada/renovacoes")     as Promise<any[]>, enabled: aba==="renovacoes" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",       label: "Dashboard" },
    { id: "medicamentos",    label: `Medicamentos (${dashRaw?.medicamentos_ativos ?? 0} ativos)` },
    { id: "judicializacao",  label: `Judicialização (${dashRaw?.demandas_judiciais_ativas ?? 0} ações)` },
    { id: "renovacoes",      label: `Renovações (${dashRaw?.renovacoes_vencer_30d ?? 0} a vencer)` },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ style_SIAPS_PLACEHOLDER }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Farmácia Especializada</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>CEAF · Alto Custo · Judicialização · RENAME · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.pacientes_ceaf}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>pacientes CEAF</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 900 }}>R${dashRaw.gasto_mes.toLocaleString("pt-BR")}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>gasto/mês</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #d4d4d4" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"3px solid #1351b4":"2px solid transparent", color: aba===a.id?"#1351b4":"#555", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"      && <AbaDashboard dash={dashRaw} meds={meds}/>}
        {aba==="medicamentos"   && <AbaMedicamentos meds={meds}/>}
        {aba==="judicializacao" && <AbaJudicializacao juds={juds}/>}
        {aba==="renovacoes"     && <AbaRenovacoes renovacoes={renov}/>}
      </div>
    </div>
  );
}
