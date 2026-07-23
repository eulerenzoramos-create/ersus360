import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Users, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#e4e7ec", border: "none", borderRadius: 6, color: "#f8fafc" };
const ST_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const CAT_COR: Record<string, string> = {
  "Psicologia": "#7c3aed", "Serviço Social": "#0891b2", "Fisioterapia": "#d97706",
  "Nutrição": "#16a34a", "Farmácia Clínica": "#374151", "Educação Física": "#059669",
  "Terapia Ocupacional": "#ea580c", "Medicina Veterinária": "#78716c", "Psiquiatria": "#6d28d9",
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Atend. compartilhados" value={dash.atendimentos_compartilhados_mes}  sub={`${dash.atendimentos_individuais_mes} individuais`}   cor="#374151"   icon={<Users size={14} color="#374151"/>}/>
        <KpiCard label="Discussões de caso"    value={dash.discussoes_caso_mes}              sub="apoio matricial"                                      cor="#0891b2"   icon={<CheckCircle size={14} color="#0891b2"/>}/>
        <KpiCard label="Resolubilidade"        value={dash.resolubilidade_pct+"%"}           sub="meta: 80%"                                            cor={dash.resolubilidade_pct>=80?"#16a34a":"#d97706"} icon={<TrendingUp size={14} color={dash.resolubilidade_pct>=80?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Vulnerab. social"      value={dash.casos_vulnerabilidade_social}     sub="em acompanhamento"                                    cor="#d97706"   icon={<AlertTriangle size={14} color="#d97706"/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>NASF-AB — evolução 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="%"/>
                <Tooltip contentStyle={TT}/>
                <Bar yAxisId="l" dataKey="atend_compartilhados" name="Compartilhados" fill="#0891b2" radius={[4,4,0,0]} stackId="a"/>
                <Bar yAxisId="l" dataKey="atend_individuais"    name="Individuais"    fill="#7c3aed" radius={[4,4,0,0]} stackId="a"/>
                <Line yAxisId="r" type="monotone" dataKey="resolubilidade_pct" name="Resolubilidade %" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaEquipe({ equipe }: { equipe: any[] | undefined }) {
  if (!equipe) return null;
  return (
    <div>
      {equipe.map(p => {
        const cor = ST_COR[p.status];
        const catCor = CAT_COR[p.categoria] ?? "#374151";
        return (
          <div key={p.profissional} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${catCor}`, borderRadius: 8, padding: "12px 16px", marginBottom: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{p.profissional}</span>
                <span style={{ marginLeft: 8, background: catCor+"15", color: catCor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{p.categoria}</span>
              </div>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{p.carga_h}h/sem</span>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
              <span>Atend./mês: <strong style={{ color: "#374151" }}>{p.atend_mes}</strong></span>
              <span>Discuss. caso: <strong>{p.discuss_mes}</strong></span>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>ESF: {p.esf_apoiadas.join(" · ")}</div>
          </div>
        );
      })}
    </div>
  );
}

function AbaPrioridades({ prioridades }: { prioridades: any[] | undefined }) {
  if (!prioridades) return null;
  const total = prioridades.reduce((s, p) => s + p.casos, 0);
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Demandas NASF-AB por categoria — {total.toLocaleString("pt-BR")} pacientes</div>
      {prioridades.map(p => {
        const cor = ST_COR[p.status];
        return (
          <div key={p.categoria} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <div>
                <span style={{ fontWeight: 600 }}>{p.categoria}</span>
                <span style={{ marginLeft: 6, fontSize: 11, color: "#9ca3af" }}>{p.esf_maior_demanda}</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ color: "#6b7280" }}>{p.casos} casos</span>
                <strong style={{ color: cor }}>{p.pct}%</strong>
              </div>
            </div>
            <div style={{ background: "#f3f4f6", borderRadius: 6, height: 9 }}>
              <div style={{ background: cor, height: "100%", width: `${p.pct * 3.5}%`, borderRadius: 6 }}/>
            </div>
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

type Aba = "dashboard"|"equipe"|"prioridades"|"indicadores";

export default function NASF() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["nasf-dash"],  queryFn: () => apiGet("/api/nasf/dashboard")    as Promise<any> });
  const { data: hist  } = useQuery({ queryKey: ["nasf-hist"],  queryFn: () => apiGet("/api/nasf/historico")    as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: equip } = useQuery({ queryKey: ["nasf-eq"],    queryFn: () => apiGet("/api/nasf/equipe")       as Promise<any[]>, enabled: aba==="equipe" });
  const { data: prios } = useQuery({ queryKey: ["nasf-prio"],  queryFn: () => apiGet("/api/nasf/prioridades")  as Promise<any[]>, enabled: aba==="prioridades" });
  const { data: inds  } = useQuery({ queryKey: ["nasf-ind"],   queryFn: () => apiGet("/api/nasf/indicadores")  as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "equipe",      label: `Equipe (${dashRaw?.profissionais_nasf ?? 0})` },
    { id: "prioridades", label: `Demandas (${dashRaw?.pacientes_acompanhados?.toLocaleString("pt-BR") ?? 0})` },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ background: "#fff", padding: "20px 24px 32px" }}>
      <div style={{ style_SIAPS_PLACEHOLDER }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>NASF-AB</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Núcleo Ampliado de Saúde da Família · Apoio Matricial · 5 ESF · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.atendimentos_compartilhados_mes + dashRaw.atendimentos_individuais_mes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>atendimentos/mês</div>
              </div>
              <div style={{ background: dashRaw.resolubilidade_pct<80?"rgba(255,200,50,.3)":"rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.resolubilidade_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>resolubilidade</div>
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
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="equipe"      && <AbaEquipe equipe={equip}/>}
        {aba==="prioridades" && <AbaPrioridades prioridades={prios}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
