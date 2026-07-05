import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Brain, AlertTriangle, Users, Activity } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const DISP_COR: Record<string, string>  = { "CAPS I": "#7c3aed", "NASF-AB": "#1d4ed8", "CAPS AD": "#dc2626" };

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Atend. individual/mês" value={dash.atend_individual_mes}  sub="CAPS + NASF-AB"      cor="#7c3aed" icon={<Brain size={14} color="#7c3aed"/>}/>
        <KpiCard label="Matriciamento/mês"     value={dash.matriciamento_mes}     sub="apoio matricial ESF"  cor="#1d4ed8" icon={<Activity size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Usuários priorizados"  value={dash.usuarios_priorizados}  sub="PTS ativo"            cor="#7c3aed" icon={<Users size={14} color="#7c3aed"/>}/>
        <KpiCard label="Com alerta"            value={dash.usuarios_alerta}       sub="retorno / risco"      cor={dash.usuarios_alerta>2?"#dc2626":"#d97706"} icon={<AlertTriangle size={14} color={dash.usuarios_alerta>2?"#dc2626":"#d97706"}/>}/>
        <KpiCard label="Grupos ativos"         value={dash.grupos_ativos}         sub="terapêuticos"         cor="#16a34a" icon={<Users size={14} color="#16a34a"/>}/>
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Produção NASF-AB / Saúde Mental — 6 meses</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dash.historico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
              <YAxis tick={{ fontSize: 10 }}/>
              <Tooltip contentStyle={TT}/>
              <Line type="monotone" dataKey="atend_individual"    stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3 }} name="Atend. individual"/>
              <Line type="monotone" dataKey="matriciamento"       stroke="#1d4ed8" strokeWidth={1.5} dot={false}   name="Matriciamento"/>
              <Line type="monotone" dataKey="apoio_matricial_esf" stroke="#16a34a" strokeWidth={1.5} dot={false}   name="Apoio matricial ESF"/>
              <Line type="monotone" dataKey="interconsulta"       stroke="#d97706" strokeWidth={1.5} dot={false}   name="Interconsulta"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AbaUsuarios({ usuarios }: { usuarios: any[] | undefined }) {
  const [filtro, setFiltro] = useState("todos");
  if (!usuarios) return null;
  const lista = filtro === "todos" ? usuarios : filtro === "alerta" ? usuarios.filter(u => u.alerta) : usuarios.filter(u => u.dispositivo === filtro || !u.retorno_regular);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[["todos","Todos",usuarios.length,"#374151"],["alerta","⚠ Alertas",usuarios.filter(u=>u.alerta).length,"#dc2626"],["CAPS I","CAPS I",usuarios.filter(u=>u.dispositivo==="CAPS I").length,"#7c3aed"],["NASF-AB","NASF-AB",usuarios.filter(u=>u.dispositivo==="NASF-AB").length,"#1d4ed8"]].map(([k,l,n,c])=>(
          <button key={String(k)} onClick={()=>setFiltro(String(k))} style={{ padding:"6px 14px",border:`1px solid ${filtro===k?c:"#e5e7eb"}`,borderRadius:20,background:filtro===k?`${c}15`:"#fff",color:filtro===k?String(c):"#374151",fontSize:12,cursor:"pointer",fontWeight:filtro===k?700:400 }}>{l} ({n})</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lista.map(u => {
          const dCor = DISP_COR[u.dispositivo] || "#6b7280";
          return (
            <div key={u.id} style={{ background: "#fff", border: `1px solid ${u.alerta?"#dc262222":"#e5e7eb"}`, borderLeft: `4px solid ${dCor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{u.codigo}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ background: dCor+"15", color: dCor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{u.dispositivo}</span>
                  {u.pts && <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>PTS ✓</span>}
                  {u.medicacao_depot && <span style={{ background: "#ede9fe", color: "#7c3aed", fontSize: 10, padding: "2px 7px", borderRadius: 4 }}>Depot</span>}
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#374151", marginBottom: 5 }}>{u.diagnostico}</div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280" }}>
                <span>Retorno regular: <strong style={{ color: u.retorno_regular?"#16a34a":"#dc2626" }}>{u.retorno_regular?"Sim":"Não"}</strong></span>
              </div>
              {u.alerta && <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {u.alerta}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaGrupos({ grupos }: { grupos: any[] | undefined }) {
  if (!grupos) return null;
  const total_part = grupos.reduce((s, g) => s + g.participantes, 0);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
        {[["Grupos ativos",grupos.filter(g=>g.status==="ativo").length,"#16a34a"],["Participantes",total_part,"#7c3aed"],["Freq. semanal",grupos.filter(g=>g.freq==="Semanal").length,"#1d4ed8"]].map(([k,v,c])=>(
          <div key={String(k)} style={{ background:"#fff",border:`1px solid ${c}22`,borderTop:`3px solid ${c}`,borderRadius:10,padding:"12px 14px",textAlign:"center" }}>
            <div style={{ fontSize:22,fontWeight:800,color:String(c) }}>{v}</div>
            <div style={{ fontSize:12,color:"#6b7280" }}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {grupos.map((g, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderLeft: "4px solid #7c3aed", borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{g.grupo}</div>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280" }}>
              <span>Freq.: <strong>{g.freq}</strong></span>
              <span>Participantes: <strong style={{ color: "#7c3aed" }}>{g.participantes}</strong></span>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>Facilitador: {g.facilitador}</div>
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
      {["critico","atencao","ok"].map(nivel => {
        const grupo = inds.filter(i => i.status === nivel);
        if (!grupo.length) return null;
        const cor = STATUS_COR[nivel];
        return (
          <div key={nivel} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: cor, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 1 }}>{nivel==="critico"?"Crítico":nivel==="atencao"?"Atenção":"OK"}</div>
            {grupo.map(ind => {
              const pct = ind.invertido ? 100 : Math.min(100, typeof ind.valor === "number" && ind.meta > 1 ? Math.round(ind.valor / ind.meta * 100) : 100);
              return (
                <div key={ind.indicador} style={{ background: "#fff", border: `1px solid ${cor}22`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ind.invertido ? 0 : 6 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                      {ind.observacao && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{ind.observacao}</div>}
                    </div>
                    <div style={{ flexShrink: 0, marginLeft: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade.startsWith("%")?"%":""}</span>
                      <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade.startsWith("%")?"%":""}</span>
                    </div>
                  </div>
                  {!ind.invertido && typeof ind.valor === "number" && ind.meta > 1 && (
                    <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7 }}>
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

type Aba = "dashboard"|"usuarios"|"grupos"|"indicadores";

export default function SaudeMental() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash }     = useQuery({ queryKey: ["sm-dash"], queryFn: () => apiGet("/api/saude-mental/dashboard")   as Promise<any> });
  const { data: prod }     = useQuery({ queryKey: ["sm-prod"], queryFn: () => apiGet("/api/saude-mental/producao")    as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: usuarios } = useQuery({ queryKey: ["sm-usr"],  queryFn: () => apiGet("/api/saude-mental/usuarios")   as Promise<any[]>, enabled: aba==="usuarios" });
  const { data: grupos }   = useQuery({ queryKey: ["sm-grp"],  queryFn: () => apiGet("/api/saude-mental/grupos")     as Promise<any[]>, enabled: aba==="grupos" });
  const { data: inds }     = useQuery({ queryKey: ["sm-ind"],  queryFn: () => apiGet("/api/saude-mental/indicadores") as Promise<any[]>, enabled: aba==="indicadores" });

  const dashFull = dash && prod ? { ...dash, historico: prod } : null;
  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "usuarios",    label: `Usuários (${dashRaw?.usuarios_priorizados ?? 0})` },
    { id: "grupos",      label: `Grupos (${dashRaw?.grupos_ativos ?? 0})` },
    { id: "indicadores", label: `Indicadores (${dashRaw?.indicadores_criticos ?? 0} críticos)` },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#4c1d95 0%,#7c3aed 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Saúde Mental</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>NASF-AB · CAPS I · RAPS · Matriciamento · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{(dash as any).atend_individual_mes}</div>
              <div style={{ fontSize: 10, opacity: .8 }}>atend./mês</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #ede9fe" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #7c3aed":"2px solid transparent", color: aba===a.id?"#7c3aed":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"   && <AbaDashboard dash={dashFull}/>}
        {aba==="usuarios"    && <AbaUsuarios usuarios={usuarios}/>}
        {aba==="grupos"      && <AbaGrupos grupos={grupos}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
