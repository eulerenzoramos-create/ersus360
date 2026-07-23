import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { UserCog, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#e4e7ec", border: "none", borderRadius: 6, color: "#f8fafc" };
const ST_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const CAT_COR: Record<string, string> = {
  "Saúde mental": "#7c3aed", "Musculoesquelético": "#d97706", "Infecciosa": "#dc2626",
  "Familiar": "#9ca3af", "Acidente trabalho": "#ef4444", "Digestivo": "#0891b2",
  "Urológico": "#0369a1", "Cardiovascular": "#be123c", "Outros": "#6b7280",
};
const CAT_STATUS: Record<string, string> = {
  "em_andamento": "#d97706", "concluido": "#16a34a", "investigando": "#1d4ed8",
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

function AbaDashboard({ dash, hist }: { dash: any; hist: any[] | undefined }) {
  if (!dash) return null;
  return (
    <div>
      {(dash.taxa_absenteismo_pct > dash.meta_absenteismo_pct || dash.cat_abertas_mes > 0) && (
        <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
          <strong>⚠ Absenteísmo acima da meta:</strong> {dash.taxa_absenteismo_pct}% (meta {dash.meta_absenteismo_pct}%) · {dash.cat_abertas_mes} CAT(s) abertas no mês · 34% dos afastamentos por saúde mental.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Absenteísmo"          value={dash.taxa_absenteismo_pct+"%"}       sub={`meta: ${dash.meta_absenteismo_pct}% · ${dash.dias_perdidos_mes} dias perdidos`}       cor={dash.taxa_absenteismo_pct<=dash.meta_absenteismo_pct?"#16a34a":"#d97706"} icon={<TrendingDown size={14} color={dash.taxa_absenteismo_pct<=dash.meta_absenteismo_pct?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Afastamentos/mês"     value={dash.afastamentos_mes}               sub={`${dash.afastamentos_ativos} ativos agora`}                                              cor="#374151"   icon={<UserCog size={14} color="#374151"/>}/>
        <KpiCard label="CAT abertas"          value={dash.cat_abertas_mes}                sub="acidentes de trabalho"                                                                   cor={dash.cat_abertas_mes===0?"#16a34a":"#d97706"} icon={<AlertTriangle size={14} color={dash.cat_abertas_mes===0?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Periódicos em dia"    value={dash.exames_periodicos_pct_dia+"%"}  sub={`${dash.exames_periodicos_pendentes} serv. pendentes`}                                   cor={dash.exames_periodicos_pct_dia>=95?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={dash.exames_periodicos_pct_dia>=95?"#16a34a":"#d97706"}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Saúde do servidor — 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="%"/>
                <Tooltip contentStyle={TT}/>
                <Bar yAxisId="l" dataKey="afastamentos"  name="Afastamentos"  fill="#7c3aed" radius={[4,4,0,0]}/>
                <Bar yAxisId="l" dataKey="dias_perdidos" name="Dias perdidos"  fill="#0891b2" radius={[4,4,0,0]}/>
                <Line yAxisId="r" type="monotone" dataKey="absenteismo_pct" name="Absenteísmo %" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaAfastamentos({ afasts }: { afasts: any[] | undefined }) {
  if (!afasts) return null;
  const total_casos = afasts.reduce((s, a) => s + a.casos, 0);
  const total_dias  = afasts.reduce((s, a) => s + a.dias_mes, 0);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#374151" }}>{total_casos}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>afastamentos no mês</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#374151" }}>{total_dias}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>dias perdidos no mês</div>
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Afastamentos por CID — mês atual</div>
        {afasts.map(a => {
          const catCor = CAT_COR[a.categoria] ?? "#374151";
          const pctCasos = Math.round(a.casos / total_casos * 100);
          return (
            <div key={a.cid} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <div>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: "#9ca3af", marginRight: 6 }}>{a.cid}</span>
                  <span style={{ fontWeight: 600 }}>{a.descricao}</span>
                  <span style={{ marginLeft: 6, background: catCor+"15", color: catCor, fontSize: 10, padding: "1px 5px", borderRadius: 3 }}>{a.categoria}</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: "#6b7280" }}>{a.dias_mes}d · {a.setor}</span>
                  <strong>{a.casos} casos ({pctCasos}%)</strong>
                </div>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 8 }}>
                <div style={{ background: catCor, height: "100%", width: `${pctCasos * 2.5}%`, borderRadius: 6 }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaCAT({ cats }: { cats: any[] | undefined }) {
  if (!cats) return null;
  return (
    <div>
      {cats.map(c => {
        const cor = CAT_STATUS[c.status] ?? "#374151";
        const gravCor = c.gravidade==="grave"?"#dc2626":c.gravidade==="moderado"?"#d97706":"#16a34a";
        return (
          <div key={c.cat} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "13px 18px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#9ca3af" }}>{c.cat}</span>
                <span style={{ marginLeft: 8, fontSize: 11, color: "#6b7280" }}>{c.data}</span>
                <span style={{ marginLeft: 8, background: c.tipo==="Trajeto"?"#eff6ff":"#fef2f2", color: c.tipo==="Trajeto"?"#1d4ed8":"#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{c.tipo}</span>
                <span style={{ marginLeft: 4, background: gravCor+"15", color: gravCor, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{c.gravidade}</span>
              </div>
              <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{c.status.replace("_"," ")}</span>
            </div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              <strong>{c.servidor}</strong> — {c.setor}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>Agente: {c.agente}</div>
          </div>
        );
      })}
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
        const cor = ST_COR[nivel];
        return (
          <div key={nivel} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: cor, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 1 }}>{nivel==="critico"?"Crítico":nivel==="atencao"?"Atenção":"OK"}</div>
            {grupo.map(ind => (
              <div key={ind.indicador} style={{ background: "#fff", border: `1px solid ${cor}22`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ind.meta && ind.unidade==="%"?6:0 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                    {ind.observacao && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{ind.observacao}</div>}
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade==="%"?"%":""}</span>
                    {ind.meta !== null && ind.meta !== undefined && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade==="%"?"%":""}</span>}
                  </div>
                </div>
                {ind.meta && ind.unidade==="%" && typeof ind.valor==="number" && (
                  <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7 }}>
                    <div style={{ background: cor, height: "100%", width: `${Math.min(100,Math.round(ind.valor/ind.meta*100))}%`, borderRadius: 6 }}/>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

type Aba = "dashboard"|"afastamentos"|"cat"|"indicadores";

export default function SaudeServidor() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["ss-dash"],  queryFn: () => apiGet("/api/saude-servidor/dashboard")    as Promise<any> });
  const { data: hist  } = useQuery({ queryKey: ["ss-hist"],  queryFn: () => apiGet("/api/saude-servidor/historico")    as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: afsts } = useQuery({ queryKey: ["ss-afst"],  queryFn: () => apiGet("/api/saude-servidor/afastamentos") as Promise<any[]>, enabled: aba==="afastamentos" });
  const { data: cats  } = useQuery({ queryKey: ["ss-cat"],   queryFn: () => apiGet("/api/saude-servidor/cat")          as Promise<any[]>, enabled: aba==="cat" });
  const { data: inds  } = useQuery({ queryKey: ["ss-ind"],   queryFn: () => apiGet("/api/saude-servidor/indicadores")  as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",    label: "Dashboard" },
    { id: "afastamentos", label: `Afastamentos (${dashRaw?.afastamentos_mes ?? 0})` },
    { id: "cat",          label: `CAT (${dashRaw?.cat_abertas_mes ?? 0} abertas)` },
    { id: "indicadores",  label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ style_SIAPS_PLACEHOLDER }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Saúde do Servidor</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>PCMSO · Absenteísmo · CAT · Exames Periódicos · 486 servidores · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: dashRaw.taxa_absenteismo_pct>dashRaw.meta_absenteismo_pct?"rgba(255,200,50,.3)":"rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.taxa_absenteismo_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>absenteísmo</div>
              </div>
              <div style={{ background: dashRaw.cat_abertas_mes>0?"rgba(255,100,100,.3)":"rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.cat_abertas_mes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>CAT no mês</div>
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
        {aba==="dashboard"    && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="afastamentos" && <AbaAfastamentos afasts={afsts}/>}
        {aba==="cat"          && <AbaCAT cats={cats}/>}
        {aba==="indicadores"  && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
