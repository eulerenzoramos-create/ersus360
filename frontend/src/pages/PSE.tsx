import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { School, AlertTriangle, CheckCircle, Users } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
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
      {(dash.cobertura_alunos_pct < 50) && (
        <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
          <strong>⚠ Cobertura de alunos abaixo da meta:</strong> {dash.cobertura_alunos_pct}% avaliados — meta PSE: ≥50% por ciclo. 5 escolas sem ações no mês.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Escolas com ações"   value={`${dash.escolas_com_acao_mes}/${dash.escolas_cadastradas}`} sub={dash.cobertura_escolas_pct+"%"}             cor={dash.cobertura_escolas_pct>=100?"#16a34a":"#d97706"} icon={<School size={14} color={dash.cobertura_escolas_pct>=100?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Alunos avaliados"    value={dash.alunos_avaliados_mes}              sub={`${dash.cobertura_alunos_pct}% dos ${dash.total_alunos_matriculados}`} cor={dash.cobertura_alunos_pct>=50?"#16a34a":"#dc2626"} icon={<Users size={14} color={dash.cobertura_alunos_pct>=50?"#16a34a":"#dc2626"}/>}/>
        <KpiCard label="Ações realizadas"    value={`${dash.acoes_realizadas_mes}/${dash.acoes_planejadas_mes}`} sub={dash.proporcao_acoes_pct+"%"}              cor={dash.proporcao_acoes_pct>=90?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={dash.proporcao_acoes_pct>=90?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Alterações/encaminhamentos" value={dash.encaminhamentos_mes}       sub={`${dash.alteracoes_encontradas_pct}% com alterações`}             cor="#374151" icon={<AlertTriangle size={14} color="#374151"/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>PSE — evolução 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="%"/>
                <Tooltip contentStyle={TT}/>
                <Bar yAxisId="l" dataKey="acoes"           name="Ações"          fill="#0891b2" radius={[4,4,0,0]}/>
                <Bar yAxisId="l" dataKey="encaminhamentos" name="Encaminhamentos" fill="#d97706" radius={[4,4,0,0]}/>
                <Line yAxisId="r" type="monotone" dataKey="cobertura_pct" name="Cobertura %" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaEscolas({ escolas }: { escolas: any[] | undefined }) {
  if (!escolas) return null;
  return (
    <div>
      {escolas.map(e => {
        const cor = ST_COR[e.status];
        return (
          <div key={e.escola} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "11px 16px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{e.escola}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{e.equipe_responsavel}</span>
                <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{e.status==="ok"?"● Ativo":e.status==="atencao"?"● Parcial":"● Sem ações"}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, fontSize: 11, color: "#6b7280" }}>
              <span>Alunos: <strong style={{ color: "#374151" }}>{e.alunos}</strong></span>
              <span>Avaliados/mês: <strong style={{ color: e.avaliados_mes>0?"#374151":"#dc2626" }}>{e.avaliados_mes}</strong></span>
              <span>Ações/mês: <strong style={{ color: e.acoes_mes>0?"#374151":"#dc2626" }}>{e.acoes_mes}</strong></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AbaAcoes({ acoes }: { acoes: any[] | undefined }) {
  if (!acoes) return null;
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Execução de ações PSE — mês atual</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {acoes.map(a => {
            const pct = Math.round(a.realizadas / a.planejadas * 100);
            const cor = pct >= 90 ? "#16a34a" : pct >= 60 ? "#d97706" : "#dc2626";
            return (
              <div key={a.acao}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span>{a.acao}</span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ color: "#9ca3af" }}>{a.realizadas}/{a.planejadas}</span>
                    {a.alteracoes > 0 && <span style={{ background: "#fef9c3", color: "#92400e", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4 }}>{a.alteracoes} alterações</span>}
                    <span style={{ color: cor, fontWeight: 700 }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ background: "#f3f4f6", borderRadius: 6, height: 9 }}>
                  <div style={{ background: cor, height: "100%", width: `${pct}%`, borderRadius: 6 }}/>
                </div>
              </div>
            );
          })}
        </div>
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

type Aba = "dashboard"|"escolas"|"acoes"|"indicadores";

export default function PSE() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["pse-dash"],  queryFn: () => apiGet("/api/pse/dashboard")   as Promise<any> });
  const { data: hist  } = useQuery({ queryKey: ["pse-hist"],  queryFn: () => apiGet("/api/pse/historico")   as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: esc   } = useQuery({ queryKey: ["pse-esc"],   queryFn: () => apiGet("/api/pse/escolas")     as Promise<any[]>, enabled: aba==="escolas" });
  const { data: acoes } = useQuery({ queryKey: ["pse-acao"],  queryFn: () => apiGet("/api/pse/acoes")       as Promise<any[]>, enabled: aba==="acoes" });
  const { data: inds  } = useQuery({ queryKey: ["pse-ind"],   queryFn: () => apiGet("/api/pse/indicadores") as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "escolas",     label: `Escolas (${dashRaw?.escolas_cadastradas ?? 0})` },
    { id: "acoes",       label: `Ações (${dashRaw?.acoes_realizadas_mes ?? 0}/${dashRaw?.acoes_planejadas_mes ?? 0})` },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>PSE — Saúde na Escola</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Programa Saúde na Escola · Triagem · Ações · Encaminhamentos · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.escolas_com_acao_mes}/{dashRaw.escolas_cadastradas}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>escolas com ações</div>
              </div>
              <div style={{ background: dashRaw.cobertura_alunos_pct<50?"rgba(255,200,50,.3)":"rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.cobertura_alunos_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>alunos avaliados</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #059669":"2px solid transparent", color: aba===a.id?"#059669":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="escolas"     && <AbaEscolas escolas={esc}/>}
        {aba==="acoes"       && <AbaAcoes acoes={acoes}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
