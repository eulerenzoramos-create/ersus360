import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Sparkles, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#e4e7ec", border: "none", borderRadius: 6, color: "#f8fafc" };
const ST_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };

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
        <KpiCard label="Atendimentos/mês"       value={dash.atendimentos_mes}            sub={`+${dash.aumento_atendimentos_pct}% vs anterior`}            cor="#374151"   icon={<Sparkles size={14} color="#374151"/>}/>
        <KpiCard label="Satisfação"              value={dash.satisfacao_pct+"%"}          sub={`meta: 90%`}                                                  cor="#16a34a"   icon={<CheckCircle size={14} color="#16a34a"/>}/>
        <KpiCard label="Modalidades ativas"      value={dash.modalidades_ativas}          sub={`${dash.profissionais_habilitados} profissionais`}            cor="#7c3aed"   icon={<Sparkles size={14} color="#7c3aed"/>}/>
        <KpiCard label="Redução encaminhamentos" value={dash.reducao_encaminhamentos_especialidade_pct+"%"} sub="menos esp. solicitadas" cor="#16a34a" icon={<TrendingUp size={14} color="#16a34a"/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>PICS — evolução 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="%"/>
                <Tooltip contentStyle={TT}/>
                <Bar yAxisId="l" dataKey="acupuntura"  name="Acupuntura"  fill="#7c3aed" radius={[4,4,0,0]} stackId="a"/>
                <Bar yAxisId="l" dataKey="fitoterapia" name="Fitoterapia" fill="#0891b2" radius={[4,4,0,0]} stackId="a"/>
                <Line yAxisId="r" type="monotone" dataKey="satisfacao_pct" name="Satisfação %" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaModalidades({ mods }: { mods: any[] | undefined }) {
  if (!mods) return null;
  return (
    <div>
      {mods.map(m => {
        const cor = ST_COR[m.status];
        return (
          <div key={m.modalidade} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "13px 18px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{m.modalidade}</span>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{m.profissional} · {m.carga_semanal_h}h/semana</div>
              </div>
              <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{m.status==="ok"?"● OK":"● Limitado"}</span>
            </div>
            <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#374151" }}>
              <span>Atendimentos/mês: <strong>{m.atendimentos_mes}</strong></span>
              <span>Pacientes ativos: <strong>{m.pacientes_ativos}</strong></span>
            </div>
            {m.observacao && <div style={{ marginTop: 8, background: "#fef9c3", borderRadius: 4, padding: "5px 10px", fontSize: 11, color: "#92400e" }}>⚠ {m.observacao}</div>}
          </div>
        );
      })}
    </div>
  );
}

function AbaCondicoes({ conds }: { conds: any[] | undefined }) {
  if (!conds) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Condições tratadas com PICS — melhora clínica relatada</div>
      {conds.map(c => (
        <div key={c.condicao} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
            <div>
              <span style={{ fontWeight: 600 }}>{c.condicao}</span>
              <span style={{ marginLeft: 8, fontSize: 11, color: "#9ca3af" }}>{c.modalidade_principal}</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <span style={{ color: "#6b7280" }}>{c.pacientes} pac.</span>
              <strong style={{ color: c.melhora_pct >= 70 ? "#16a34a" : c.melhora_pct >= 50 ? "#d97706" : "#dc2626" }}>{c.melhora_pct}% melhora</strong>
            </div>
          </div>
          <div style={{ background: "#f3f4f6", borderRadius: 6, height: 9 }}>
            <div style={{ background: c.melhora_pct >= 70 ? "#16a34a" : c.melhora_pct >= 50 ? "#d97706" : "#dc2626", height: "100%", width: `${c.melhora_pct}%`, borderRadius: 6 }}/>
          </div>
        </div>
      ))}
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

type Aba = "dashboard"|"modalidades"|"condicoes"|"indicadores";

export default function PICS() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["pics-dash"],  queryFn: () => apiGet("/api/pics/dashboard")    as Promise<any> });
  const { data: hist  } = useQuery({ queryKey: ["pics-hist"],  queryFn: () => apiGet("/api/pics/historico")    as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: mods  } = useQuery({ queryKey: ["pics-mods"],  queryFn: () => apiGet("/api/pics/modalidades")  as Promise<any[]>, enabled: aba==="modalidades" });
  const { data: conds } = useQuery({ queryKey: ["pics-cond"],  queryFn: () => apiGet("/api/pics/condicoes")    as Promise<any[]>, enabled: aba==="condicoes" });
  const { data: inds  } = useQuery({ queryKey: ["pics-ind"],   queryFn: () => apiGet("/api/pics/indicadores")  as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "modalidades", label: `Modalidades (${dashRaw?.modalidades_ativas ?? 0})` },
    { id: "condicoes",   label: "Condições Tratadas" },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ style_SIAPS_PLACEHOLDER }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>PICS</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Práticas Integrativas e Complementares · Acupuntura · Fitoterapia · PNPICS · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.atendimentos_mes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>atendimentos/mês</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.satisfacao_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>satisfação</div>
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
        {aba==="modalidades" && <AbaModalidades mods={mods}/>}
        {aba==="condicoes"   && <AbaCondicoes conds={conds}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
