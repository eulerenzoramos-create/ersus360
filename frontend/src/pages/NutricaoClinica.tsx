import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Activity, AlertTriangle, Users, CheckCircle } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const TN_COR: Record<string, string>     = { "Enteral": "#0369a1", "Parenteral": "#7c3aed", "Oral+supl.": "#16a34a" };

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
  if (!dash) return <NaoDisponivelBanner nota="Dados indisponíveis. Integração não configurada no Railway. Nenhum valor foi inventado." />;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Em terapia nutricional"  value={dash.em_terapia_nutricional}      sub={`${dash.terapia_enteral} enteral · ${dash.terapia_parenteral} parenteral`} cor="#0369a1"                              icon={<Activity size={14} color="#0369a1"/>}/>
        <KpiCard label="Risco nutricional"        value={dash.risco_nutricional}           sub={`${dash.risco_nutricional_pct}% dos triados`}                             cor="#d97706"                              icon={<AlertTriangle size={14} color="#d97706"/>}/>
        <KpiCard label="Triagem NRS-2002"         value={dash.triagem_cobertura_pct+"%"}  sub={`${dash.triados_nrs2002}/${dash.pacientes_internados} pacientes`}          cor={dash.triagem_cobertura_pct>=90?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={dash.triagem_cobertura_pct>=90?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Desnutrição na admissão"  value={dash.desnutridos_admissao_pct+"%"} sub="prevalência hospitalar"                                                  cor={dash.desnutridos_admissao_pct>30?"#dc2626":"#d97706"} icon={<Users size={14} color={dash.desnutridos_admissao_pct>30?"#dc2626":"#d97706"}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Terapia nutricional — tendência 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }} unit="%"/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }}/>
                <Tooltip contentStyle={TT}/>
                <Line yAxisId="l" type="monotone" dataKey="triados_pct"  stroke="#374151" strokeWidth={2} dot={{ r: 3 }} name="Triados (%)"/>
                <Line yAxisId="l" type="monotone" dataKey="risco_pct"    stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} name="Risco nutricional (%)"/>
                <Line yAxisId="r" type="monotone" dataKey="em_tn"        stroke="#0369a1" strokeWidth={2.5} dot={{ r: 3 }} name="Em TN (qtd)"/>
                <Line yAxisId="r" type="monotone" dataKey="complicacoes" stroke="#dc2626" strokeWidth={1.5} dot={false}   name="Complicações"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaPacientes({ pacientes }: { pacientes: any[] | undefined }) {
  if (!pacientes) return <NaoDisponivelBanner nota="Dados indisponíveis. Nenhum valor foi inventado." />;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pacientes.map(p => {
          const cor = STATUS_COR[p.status];
          const tnCor = TN_COR[p.tipo_tn] ?? "#374151";
          return (
            <div key={p.id} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{p.id}</span>
                  <span style={{ marginLeft: 8, background: tnCor+"15", color: tnCor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{p.tipo_tn}</span>
                  <span style={{ marginLeft: 6, fontSize: 12, color: "#374151", fontWeight: 600 }}>{p.setor}</span>
                </div>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>{p.dias_tn} dias TN</span>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: p.complicacao?4:0 }}>
                <strong>{p.diagnostico}</strong> · {p.triagem} · {p.formula}
              </div>
              {p.complicacao && (
                <div style={{ marginTop: 4, background: "#fef9c3", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#92400e" }}>⚠ Complicação: {p.complicacao}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaSetores({ setores }: { setores: any[] | undefined }) {
  if (!setores) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {setores.map(s => {
          const corCob = s.cobertura_pct >= 95 ? "#16a34a" : s.cobertura_pct >= 80 ? "#d97706" : "#dc2626";
          return (
            <div key={s.setor} style={{ background: "#fff", border: "1px solid #e5e7eb", borderLeft: `4px solid ${corCob}`, borderRadius: 8, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{s.setor}</div>
                <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                  <span>Internados: <strong>{s.internados}</strong></span>
                  <span>Triados: <strong>{s.triados}</strong></span>
                  <span style={{ color: s.risco > 3 ? "#dc2626" : "#d97706" }}>Em risco: <strong>{s.risco}</strong></span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 3 }}>Cobertura de triagem</div>
                  <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7 }}>
                    <div style={{ background: corCob, height: "100%", width: `${s.cobertura_pct}%`, borderRadius: 6 }}/>
                  </div>
                  <div style={{ fontSize: 11, color: corCob, fontWeight: 600, marginTop: 2 }}>{s.cobertura_pct}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 3 }}>Prevalência de risco</div>
                  <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7 }}>
                    <div style={{ background: s.risco_pct > 50 ? "#dc2626" : "#d97706", height: "100%", width: `${s.risco_pct}%`, borderRadius: 6 }}/>
                  </div>
                  <div style={{ fontSize: 11, color: s.risco_pct > 50 ? "#dc2626" : "#d97706", fontWeight: 600, marginTop: 2 }}>{s.risco_pct}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaIndicadores({ inds }: { inds: any[] | undefined }) {
  if (!inds) return <NaoDisponivelBanner nota="Dados indisponíveis. Nenhum valor foi inventado." />;
  return (
    <div>
      {["critico","atencao","ok"].map(nivel => {
        const grupo = inds.filter(i => i.status === nivel);
        if (!grupo.length) return null;
        const cor = STATUS_COR[nivel];
        return (
          <div key={nivel} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: cor, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 1 }}>{nivel==="critico"?"Crítico":nivel==="atencao"?"Atenção":"OK"}</div>
            {grupo.map(ind => (
              <div key={ind.indicador} style={{ background: "#fff", border: `1px solid ${cor}22`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ind.meta?6:0 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                    {ind.observacao && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{ind.observacao}</div>}
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade==="%"?"%":""}</span>
                    {ind.meta && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade==="%"?"%":""}</span>}
                  </div>
                </div>
                {ind.meta && typeof ind.valor==="number" && (
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

type Aba = "dashboard"|"pacientes"|"setores"|"indicadores";

export default function NutricaoClinica() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["nut-dash"],  queryFn: () => apiGet("/api/nutricao-clinica/dashboard")     as Promise<any> });
  const { data: hist  } = useQuery({ queryKey: ["nut-hist"],  queryFn: () => apiGet("/api/nutricao-clinica/historico")     as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: pacs  } = useQuery({ queryKey: ["nut-pacs"],  queryFn: () => apiGet("/api/nutricao-clinica/pacientes")     as Promise<any[]>, enabled: aba==="pacientes" });
  const { data: sets  } = useQuery({ queryKey: ["nut-sets"],  queryFn: () => apiGet("/api/nutricao-clinica/triagem-setores") as Promise<any[]>, enabled: aba==="setores" });
  const { data: inds  } = useQuery({ queryKey: ["nut-ind"],   queryFn: () => apiGet("/api/nutricao-clinica/indicadores")   as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "pacientes",   label: `Pacientes em TN (${dashRaw?.em_terapia_nutricional ?? 0})` },
    { id: "setores",     label: "Triagem por Setor" },
    { id: "indicadores", label: "Indicadores EMTN" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Nutrição Clínica — EMTN</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Triagem NRS-2002 · Terapia Enteral/Parenteral · Avaliação Nutricional · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.em_terapia_nutricional}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>em TN</div>
              </div>
              <div style={{ background: dashRaw.desnutridos_admissao_pct > 30 ? "rgba(255,100,100,.3)" : "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.desnutridos_admissao_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>desnutrição adm.</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"3px solid #1351b4":"2px solid transparent", color: aba===a.id?"#1351b4":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && !dashRaw && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="pacientes"   && <AbaPacientes pacientes={pacs}/>}
        {aba==="setores"     && <AbaSetores setores={sets}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
