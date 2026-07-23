import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Heart, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#e4e7ec", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const CONTROLE_COR: Record<string, string> = { sim: "#16a34a", parcial: "#d97706", nao: "#dc2626" };

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

function AbaDashboard({ dash, intern }: { dash: any; intern: any[] | undefined }) {
  if (!dash) return null;
  const pieDCNT = [
    { name: "HAS",        n: intern?.[intern.length-1]?.has        ?? 0, cor: "#dc2626" },
    { name: "DM",         n: intern?.[intern.length-1]?.dm         ?? 0, cor: "#d97706" },
    { name: "DPOC",       n: intern?.[intern.length-1]?.dpoc       ?? 0, cor: "#7c3aed" },
    { name: "Renal",      n: intern?.[intern.length-1]?.renal      ?? 0, cor: "#1d4ed8" },
    { name: "Obesidade",  n: intern?.[intern.length-1]?.obesidade  ?? 0, cor: "#16a34a" },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="HAS cadastrados"      value={dash.has_cadastrados}              sub={`${dash.has_controlados_pct}% controlados`}  cor={STATUS_COR[dash.has_controlados_status]}  icon={<Heart size={14} color={STATUS_COR[dash.has_controlados_status]}/>}/>
        <KpiCard label="DM cadastrados"       value={dash.dm_cadastrados}               sub={`${dash.dm_controlados_pct}% controlados`}   cor={STATUS_COR[dash.dm_controlados_status]}   icon={<Activity size={14} color={STATUS_COR[dash.dm_controlados_status]}/>}/>
        <KpiCard label="Obesidade adultos"    value={dash.obesidade_adultos_pct+"%"}    sub="IMC ≥ 30"                                     cor={STATUS_COR[dash.obesidade_status]}        icon={<TrendingUp size={14} color={STATUS_COR[dash.obesidade_status]}/>}/>
        <KpiCard label="Internações DCNT/mês" value={dash.internacoes_dcnt_mes}         sub="Mar/26"                                        cor={STATUS_COR[dash.internacoes_dcnt_status]} icon={<AlertTriangle size={14} color={STATUS_COR[dash.internacoes_dcnt_status]}/>}/>
      </div>
      {intern && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Internações por DCNT — 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intern} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="has"       name="HAS"       fill="#dc2626" stackId="a" radius={[0,0,0,0]}/>
                <Bar dataKey="dm"        name="DM"        fill="#d97706" stackId="a"/>
                <Bar dataKey="dpoc"      name="DPOC"      fill="#7c3aed" stackId="a"/>
                <Bar dataKey="renal"     name="Renal"     fill="#1d4ed8" stackId="a"/>
                <Bar dataKey="obesidade" name="Obesidade" fill="#16a34a" stackId="a" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
            {pieDCNT.map(p => (
              <span key={p.name} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ background: p.cor, borderRadius: 3, width: 10, height: 10, display: "inline-block" }}/>
                {p.name}: <strong>{p.n}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AbaHipertensos({ lista }: { lista: any[] | undefined }) {
  const [filtro, setFiltro] = useState("todos");
  if (!lista) return null;
  const items = filtro === "todos" ? lista : filtro === "alerta" ? lista.filter(h => h.controle === "nao") : lista.filter(h => h.classificacao.includes(filtro));
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[["todos","Todos",lista.length,"#374151"],["alerta","Não controlados",lista.filter(h=>h.controle==="nao").length,"#dc2626"],["Estágio 2","Estágio 2",lista.filter(h=>h.classificacao==="Estágio 2").length,"#d97706"]].map(([k,l,n,c])=>(
          <button key={String(k)} onClick={()=>setFiltro(String(k))} style={{ padding:"6px 14px",border:`1px solid ${filtro===k?c:"#e5e7eb"}`,borderRadius:20,background:filtro===k?`${c}15`:"#fff",color:filtro===k?String(c):"#374151",fontSize:12,cursor:"pointer",fontWeight:filtro===k?700:400 }}>{l} ({n})</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map(h => {
          const cor = CONTROLE_COR[h.controle];
          return (
            <div key={h.id} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{h.id}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>{h.classificacao}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{h.controle==="sim"?"Controlado":h.controle==="parcial"?"Parcial":"Não controlado"}</span>
                  {!h.uso_medicacao && <span style={{ background: "#fee2e2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>Sem medicação</span>}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#374151" }}>PA: <strong>{h.pa_sistolica}/{h.pa_diastolica} mmHg</strong> · Última consulta: <strong>{h.consulta_dias} dias</strong></div>
              {h.alerta && <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {h.alerta}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaDiabeticos({ lista }: { lista: any[] | undefined }) {
  if (!lista) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lista.map(d => {
          const cor = CONTROLE_COR[d.controle];
          return (
            <div key={d.id} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{d.id}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, background: "#fef9c3", color: "#a16207", padding: "1px 7px", borderRadius: 4 }}>{d.tipo}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{d.controle==="sim"?"Controlado":d.controle==="parcial"?"Parcial":"Não controlado"}</span>
                  {d.uso_insulina && <span style={{ background: "#ede9fe", color: "#7c3aed", fontSize: 10, padding: "2px 7px", borderRadius: 4 }}>Insulina</span>}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#374151" }}>
                HbA1c: <strong style={{ color: d.hba1c>9?"#dc2626":d.hba1c>7?"#d97706":"#16a34a" }}>{d.hba1c}%</strong>
                {" · "}Glicemia jejum: <strong>{d.glicemia_jejum} mg/dL</strong>
                {" · "}Consulta: <strong>{d.consulta_dias} dias</strong>
              </div>
              {d.complicacao && <div style={{ fontSize: 11, color: "#d97706", marginTop: 3 }}>Complicação: {d.complicacao}</div>}
              {d.alerta && <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {d.alerta}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaIndicadores({ inds }: { inds: any[] | undefined }) {
  if (!inds) return null;
  const barData = inds.filter(i => typeof i.valor === "number" && i.meta && i.meta > 1);
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Indicadores vs. meta (%)</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fontSize: 9 }} unit="%" domain={[0, 100]}/>
              <YAxis type="category" dataKey="indicador" tick={{ fontSize: 9 }} width={200}/>
              <Tooltip contentStyle={TT} formatter={(v: any) => `${v}%`}/>
              <Bar dataKey="valor" name="Realizado" radius={[0,4,4,0]}>
                {barData.map((ind, i) => <Cell key={i} fill={STATUS_COR[ind.status]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

type Aba = "dashboard"|"hipertensos"|"diabeticos"|"indicadores";

export default function HiperDia() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash } = useQuery({ queryKey: ["hpd-dash"],  queryFn: () => apiGet("/api/hiperdia/dashboard")    as Promise<any> });
  const { data: has  } = useQuery({ queryKey: ["hpd-has"],   queryFn: () => apiGet("/api/hiperdia/hipertensos")  as Promise<any[]>, enabled: aba==="hipertensos" });
  const { data: dm   } = useQuery({ queryKey: ["hpd-dm"],    queryFn: () => apiGet("/api/hiperdia/diabeticos")   as Promise<any[]>, enabled: aba==="diabeticos" });
  const { data: intern}= useQuery({ queryKey: ["hpd-int"],   queryFn: () => apiGet("/api/hiperdia/internacoes")  as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: inds } = useQuery({ queryKey: ["hpd-ind"],   queryFn: () => apiGet("/api/hiperdia/indicadores")  as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "hipertensos", label: `HAS (${dashRaw?.has_cadastrados ?? 0} cad.)` },
    { id: "diabeticos",  label: `DM (${dashRaw?.dm_cadastrados ?? 0} cad.)` },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ background: "#fff", padding: "20px 24px 32px" }}>
      <div style={{ style_SIAPS_PLACEHOLDER }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>HiperDia / DCNT</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Hipertensão · Diabetes · Obesidade · DPOC · Linha de Cuidado DCNT · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.has_controlados_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>HAS controlada</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.dm_controlados_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>DM controlada</div>
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
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} intern={intern}/>}
        {aba==="hipertensos" && <AbaHipertensos lista={has}/>}
        {aba==="diabeticos"  && <AbaDiabeticos lista={dm}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
