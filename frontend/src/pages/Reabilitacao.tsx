import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { UserCheck, AlertTriangle, Clock, Activity } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626", urgente: "#dc2626" };

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

function AbaDashboard({ dash, prod }: { dash: any; prod: any[] | undefined }) {
  if (!dash) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="PCD cadastrados"     value={dash.pcd_cadastrados}          sub="RCPD / SIGTAP"          cor="#6366f1"                              icon={<UserCheck size={14} color="#6366f1"/>}/>
        <KpiCard label="BPC/LOAS ativos"     value={dash.bpc_beneficiarios}         sub="INSS benefício"         cor="#16a34a"                              icon={<UserCheck size={14} color="#16a34a"/>}/>
        <KpiCard label="Em reabilitação"     value={dash.em_reabilitacao}           sub="acompanhamento ativo"   cor="#1d4ed8"                              icon={<Activity size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Lista espera CER"    value={dash.lista_espera_cer}          sub="CER regional"           cor={STATUS_COR[dash.lista_espera_status]} icon={<Clock size={14} color={STATUS_COR[dash.lista_espera_status]}/>}/>
      </div>
      {prod && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Produção reabilitação — 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prod} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="fisioterapia"       name="Fisioterapia"       fill="#1d4ed8" stackId="a"/>
                <Bar dataKey="fonoaudiologia"     name="Fonoaudiologia"     fill="#7c3aed" stackId="a"/>
                <Bar dataKey="terapia_ocupacional" name="T. Ocupacional"    fill="#d97706" stackId="a"/>
                <Bar dataKey="psicologia"         name="Psicologia"         fill="#16a34a" stackId="a" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaPacientes({ pacientes }: { pacientes: any[] | undefined }) {
  const [filtro, setFiltro] = useState("todos");
  if (!pacientes) return null;
  const lista = filtro === "todos" ? pacientes : filtro === "opme" ? pacientes.filter(p => p.opme) : filtro === "bpc" ? pacientes.filter(p => p.bpc) : pacientes.filter(p => p.alerta);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[["todos","Todos",pacientes.length,"#374151"],["opme","OPME Pendente",pacientes.filter(p=>p.opme).length,"#d97706"],["alerta","⚠ Alertas",pacientes.filter(p=>p.alerta).length,"#dc2626"],["bpc","BPC/LOAS",pacientes.filter(p=>p.bpc).length,"#16a34a"]].map(([k,l,n,c])=>(
          <button key={String(k)} onClick={()=>setFiltro(String(k))} style={{ padding:"6px 14px",border:`1px solid ${filtro===k?c:"#e5e7eb"}`,borderRadius:20,background:filtro===k?`${c}15`:"#fff",color:filtro===k?String(c):"#374151",fontSize:12,cursor:"pointer",fontWeight:filtro===k?700:400 }}>{l} ({n})</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lista.map(p => (
          <div key={p.id} style={{ background: "#fff", border: `1px solid ${p.alerta?"#dc262222":"#e5e7eb"}`, borderLeft: `4px solid ${p.alerta?"#dc2626":p.opme?"#d97706":"#6366f1"}`, borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{p.id}</span>
                <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600 }}>{p.deficiencia}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {p.bpc && <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>BPC ✓</span>}
                {p.opme && <span style={{ background: "#fef9c3", color: "#a16207", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>OPME</span>}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Causa: {p.causa} · Modalidade: <strong>{p.modalidade}</strong> · {p.sessoes_mes} sessões/mês</div>
            {p.opme && <div style={{ fontSize: 11, color: "#d97706", marginTop: 3 }}>OPME: {p.opme}</div>}
            {p.alerta && <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {p.alerta}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AbaIndicadores({ inds }: { inds: any[] | undefined }) {
  if (!inds) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {inds.map(ind => {
          const cor = STATUS_COR[ind.status];
          return (
            <div key={ind.indicador} style={{ background: "#fff", border: `1px solid ${cor}22`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</div>
                  {ind.observacao && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{ind.observacao}</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade==="%"?"%":""}</span>
                  {ind.meta && <div style={{ fontSize: 10, color: "#9ca3af" }}>meta: {ind.meta}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Aba = "dashboard"|"pacientes"|"indicadores";

export default function Reabilitacao() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash } = useQuery({ queryKey: ["reab-dash"], queryFn: () => apiGet("/api/reabilitacao/dashboard")   as Promise<any> });
  const { data: pac  } = useQuery({ queryKey: ["reab-pac"],  queryFn: () => apiGet("/api/reabilitacao/pacientes")   as Promise<any[]>, enabled: aba==="pacientes" });
  const { data: prod } = useQuery({ queryKey: ["reab-prod"], queryFn: () => apiGet("/api/reabilitacao/producao")    as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: inds } = useQuery({ queryKey: ["reab-ind"],  queryFn: () => apiGet("/api/reabilitacao/indicadores") as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "pacientes",   label: `Pacientes (${dashRaw?.pcd_cadastrados ?? 0} PCD)` },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#4338ca 0%,#6366f1 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Reabilitação / Deficiência</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>RCPD · BPC/LOAS · CER · OPME · Viver sem Limite · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.pcd_cadastrados}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>PCD cadastrados</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.atendimentos_mes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>atend./mês</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e0e7ff" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #4338ca":"2px solid transparent", color: aba===a.id?"#4338ca":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} prod={prod}/>}
        {aba==="pacientes"   && <AbaPacientes pacientes={pac}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
