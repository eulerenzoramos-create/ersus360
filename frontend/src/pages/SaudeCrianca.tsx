import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";
import { Baby, AlertTriangle, CheckCircle, Heart } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#e4e7ec", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const RISCO_COR:  Record<string, string> = { alto: "#dc2626", medio: "#d97706", baixo: "#16a34a" };
const NUTRI_COR:  Record<string, string> = {
  eutrofico: "#16a34a", sobrepeso: "#d97706",
  risco_baixo_peso: "#dc2626", desnutricao_risco: "#dc2626",
};
const NUTRI_LABEL: Record<string, string> = {
  eutrofico: "Eutrófico", sobrepeso: "Sobrepeso",
  risco_baixo_peso: "Risco Baixo Peso", desnutricao_risco: "Desnutrição Risco",
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

function AbaDashboard({ dash }: { dash: any }) {
  if (!dash) return null;
  const pctBF = Math.round(dash.familias_bf_acomp / dash.familias_bf_total * 100);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Crianças acomp."     value={dash.criancas_acompanhadas}      sub="SISVAN Mar/26"              cor="#ec4899" icon={<Baby size={14} color="#ec4899"/>}/>
        <KpiCard label="Puericultura/mês"    value={dash.consultas_puericultura_mes} sub="consultas realizadas"       cor="#7c3aed" icon={<Heart size={14} color="#7c3aed"/>}/>
        <KpiCard label="Alto risco"          value={dash.alto_risco}                 sub="monitoramento intensivo"    cor={dash.alto_risco>0?"#dc2626":"#16a34a"} icon={<AlertTriangle size={14} color={dash.alto_risco>0?"#dc2626":"#16a34a"}/>}/>
        <KpiCard label="Sem vacinas em dia"  value={dash.sem_vacinas_dia}            sub="pendência"                  cor={dash.sem_vacinas_dia>0?"#d97706":"#16a34a"} icon={<AlertTriangle size={14} color={dash.sem_vacinas_dia>0?"#d97706":"#16a34a"}/>}/>
        <KpiCard label="Bolsa Família"       value={`${pctBF}%`}                     sub={`${dash.familias_bf_acomp}/${dash.familias_bf_total} famílias`} cor={pctBF>=85?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={pctBF>=85?"#16a34a":"#d97706"}/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Crianças acompanhadas — 6 meses</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Line type="monotone" dataKey="criancas_acomp"            stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3 }} name="Crianças"/>
                <Line type="monotone" dataKey="consultas_puericultura"    stroke="#7c3aed" strokeWidth={1.5} dot={false}   name="Puericultura"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Condicionalidades Bolsa Família por equipe</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.bf_resumo} layout="vertical" barSize={10}>
                <XAxis type="number" domain={[0,100]} tick={{ fontSize: 9 }}/>
                <YAxis type="category" dataKey="equipe" tick={{ fontSize: 8 }} width={115}/>
                <Tooltip contentStyle={TT} formatter={(v: number) => [`${v}%`, "Acompanham."]}/>
                <Bar dataKey="pct" name="%" radius={[0,4,4,0]}>
                  {dash.bf_resumo?.map((e: any, i: number) => <Cell key={i} fill={e.pct>=85?"#16a34a":e.pct>=75?"#d97706":"#dc2626"}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbaCriancas({ criancas }: { criancas: any[] | undefined }) {
  const [filtro, setFiltro] = useState("todos");
  if (!criancas) return null;
  const lista = filtro === "todos" ? criancas : criancas.filter(c => c.risco === filtro);
  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <select value={filtro} onChange={e => setFiltro(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}>
          <option value="todos">Todos</option>
          <option value="alto">Alto risco</option>
          <option value="medio">Médio risco</option>
          <option value="baixo">Baixo risco</option>
        </select>
        <div style={{ fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>{lista.length} crianças</div>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#ec4899", color: "#fff" }}>
              <th style={{ padding: "9px 14px", textAlign: "left" }}>Criança</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Equipe</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Idade</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Peso</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Altura</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Caderneta</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Vacinas</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Nutrição</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Risco</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c, i) => (
              <tr key={c.id} style={{ borderTop: "1px solid #f3f4f6", background: c.risco==="alto"?"#fff7f7":i%2===0?"#fff":"#f9fafb" }}>
                <td style={{ padding: "9px 14px", fontWeight: 600 }}>{c.iniciais}</td>
                <td style={{ padding: "9px 10px", fontSize: 11, color: "#374151" }}>{c.equipe}</td>
                <td style={{ padding: "9px 10px", textAlign: "right" }}>{c.idade_meses}m</td>
                <td style={{ padding: "9px 10px", textAlign: "right", color: "#6b7280" }}>{c.peso_kg}kg</td>
                <td style={{ padding: "9px 10px", textAlign: "right", color: "#6b7280" }}>{c.altura_cm}cm</td>
                <td style={{ padding: "9px 10px", textAlign: "center" }}>{c.caderneta_atualizada ? <span style={{ color: "#16a34a" }}>✓</span> : <span style={{ color: "#dc2626" }}>✗</span>}</td>
                <td style={{ padding: "9px 10px", textAlign: "center" }}>{c.vacinas_dia ? <span style={{ color: "#16a34a" }}>✓</span> : <span style={{ color: "#dc2626" }}>✗</span>}</td>
                <td style={{ padding: "9px 10px", textAlign: "center" }}>
                  <span style={{ background: (NUTRI_COR[c.estado_nutricional]||"#6b7280")+"15", color: NUTRI_COR[c.estado_nutricional]||"#6b7280", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                    {NUTRI_LABEL[c.estado_nutricional] || c.estado_nutricional}
                  </span>
                </td>
                <td style={{ padding: "9px 10px", textAlign: "center" }}>
                  <span style={{ background: RISCO_COR[c.risco]+"15", color: RISCO_COR[c.risco], fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, textTransform: "capitalize" as const }}>{c.risco}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              const pct = ind.invertido ? 0 : Math.min(100, Math.round(ind.valor / ind.meta * 100));
              return (
                <div key={ind.indicador} style={{ background: "#fff", border: `1px solid ${cor}22`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ind.invertido ? 0 : 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                    <div style={{ flexShrink: 0, marginLeft: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}%</span>
                      <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}%</span>
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

function AbaBolsaFamilia({ bf }: { bf: any[] | undefined }) {
  if (!bf) return null;
  const total_fam  = bf.reduce((s, e) => s + e.familias_bf, 0);
  const total_acomp = bf.reduce((s, e) => s + e.acomp_saude, 0);
  const pct_total  = Math.round(total_acomp / total_fam * 100);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[["Famílias BF", total_fam, "#1d4ed8"], ["Acompanhadas", total_acomp, "#16a34a"], ["Cobertura", `${pct_total}%`, pct_total>=85?"#16a34a":"#d97706"]].map(([k,v,c])=>(
          <div key={String(k)} style={{ background: "#fff", border: `1px solid ${c}22`, borderTop: `3px solid ${c}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: String(c) }}>{v}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#7c3aed", color: "#fff" }}>
              <th style={{ padding: "9px 14px", textAlign: "left" }}>Equipe</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Famílias BF</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Acompanhadas</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Vacinas dia</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Cresc. acomp.</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>% Cobertura</th>
            </tr>
          </thead>
          <tbody>
            {bf.map((e, i) => {
              const cor = e.pct >= 85 ? "#16a34a" : e.pct >= 75 ? "#d97706" : "#dc2626";
              return (
                <tr key={e.equipe} style={{ borderTop: "1px solid #f3f4f6", background: e.pct < 75 ? "#fff7f7" : i%2===0?"#fff":"#f9fafb" }}>
                  <td style={{ padding: "9px 14px", fontWeight: 600 }}>{e.equipe}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right" }}>{e.familias_bf}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700 }}>{e.acomp_saude}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right" }}>{e.criancas_vacinas_dia}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right" }}>{e.criancas_crescimento}</td>
                  <td style={{ padding: "9px 10px", textAlign: "center" }}>
                    <span style={{ background: cor+"15", color: cor, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{e.pct.toFixed(1)}%</span>
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

type Aba = "dashboard"|"criancas"|"indicadores"|"bolsa";

export default function SaudeCrianca() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dashRaw }    = useQuery({ queryKey: ["sc-dash"],  queryFn: () => apiGet("/api/saude-crianca/dashboard") as Promise<any> });
  const { data: criancas }   = useQuery({ queryKey: ["sc-cri"],   queryFn: () => apiGet("/api/saude-crianca/criancas") as Promise<any[]>,      enabled: aba==="criancas" });
  const { data: indicadores }= useQuery({ queryKey: ["sc-ind"],   queryFn: () => apiGet("/api/saude-crianca/indicadores") as Promise<any[]>,   enabled: aba==="indicadores" });
  const { data: bf }         = useQuery({ queryKey: ["sc-bf"],    queryFn: () => apiGet("/api/saude-crianca/bolsa-familia") as Promise<any[]>, enabled: aba==="dashboard"||aba==="bolsa" });

  const dash = dashRaw && bf ? { ...dashRaw, bf_resumo: bf.map(e => ({ equipe: e.equipe.replace("ESF ",""), pct: e.pct })) } : null;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",  label: "Dashboard" },
    { id: "criancas",   label: "Crianças" },
    { id: "indicadores",label: "Indicadores" },
    { id: "bolsa",      label: "Bolsa Família" },
  ];

  return (
    <div style={{ background: "#fff", padding: "20px 24px 32px" }}>
      <div style={{ style_SIAPS_PLACEHOLDER }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Saúde da Criança</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Puericultura · SISVAN · Bolsa Família · FMS Apuí/AM</p>
          </div>
          {dashRaw && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.criancas_acompanhadas}</div>
              <div style={{ fontSize: 10, opacity: .8 }}>crianças acomp.</div>
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
        {aba==="dashboard"   && <AbaDashboard dash={dash}/>}
        {aba==="criancas"    && <AbaCriancas criancas={criancas}/>}
        {aba==="indicadores" && <AbaIndicadores indicadores={indicadores}/>}
        {aba==="bolsa"       && <AbaBolsaFamilia bf={bf}/>}
      </div>
    </div>
  );
}
