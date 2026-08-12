import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Shield, AlertTriangle, Users, Activity } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };

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
      <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
        <strong>PNAISP:</strong> Unidade prisional com {dash.populacao_privada_liberdade} PPL — {dash.superlotacao_pct}% acima da capacidade. Equipe PNAISP: {dash.medico_horas_semanais}h médico + {dash.enfermeiro_horas_semanais}h enfermagem/semana.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Pop. Privada Liberdade"  value={dash.populacao_privada_liberdade}    sub={`cap. ${dash.capacidade_unidade} — +${dash.superlotacao_pct}%`}  cor="#374151"                              icon={<Users size={14} color="#374151"/>}/>
        <KpiCard label="Cobertura APS"           value={dash.cobertura_aps_pct+"%"}          sub="meta PNAISP: 100%"                                               cor={STATUS_COR[dash.cobertura_aps_pct>=90?"ok":dash.cobertura_aps_pct>=75?"atencao":"critico"]} icon={<Shield size={14} color={STATUS_COR[dash.cobertura_aps_pct>=90?"ok":dash.cobertura_aps_pct>=75?"atencao":"critico"]}/>}/>
        <KpiCard label="TB ativa"                value={dash.casos_tb_ativos}                sub={`prevalência ~27/1.000`}                                          cor="#dc2626"                              icon={<AlertTriangle size={14} color="#dc2626"/>}/>
        <KpiCard label="Saúde mental acomp."     value={dash.saude_mental_acompanhados}      sub="RAPS + CAPS AD"                                                  cor="#7c3aed"                              icon={<Activity size={14} color="#7c3aed"/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Produção assistencial PNAISP — 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="consultas_medicas" name="Consultas médicas" fill="#374151" radius={[4,4,0,0]} stackId="a"/>
                <Bar dataKey="enfermagem"         name="Enfermagem"        fill="#6b7280" radius={[0,0,0,0]} stackId="a"/>
                <Bar dataKey="saude_mental"       name="Saúde mental"      fill="#7c3aed" radius={[0,0,0,0]} stackId="a"/>
                <Bar dataKey="odonto"             name="Odontologia"       fill="#0369a1" radius={[0,0,4,4]} stackId="a"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaDoencas({ doencas }: { doencas: any[] | undefined }) {
  if (!doencas) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {doencas.map(d => {
          const cor = STATUS_COR[d.status];
          const pct = Math.min(100, Math.round(d.em_tratamento_pct));
          return (
            <div key={d.doenca} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{d.doenca}</span>
                  <span style={{ marginLeft: 8, fontSize: 11, color: "#6b7280" }}>{d.casos} casos · {d.prevalencia_1000.toFixed(1)}/1.000</span>
                </div>
                <span style={{ background: cor+"15", color: cor, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                  {d.em_tratamento_pct}% em trat.
                </span>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7 }}>
                <div style={{ background: cor, height: "100%", width: `${pct}%`, borderRadius: 6 }}/>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "#9ca3af" }}>
                <span>{d.observacao}</span>
                <span>meta trat.: {d.meta_tratamento_pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaAcoes({ acoes }: { acoes: any[] | undefined }) {
  if (!acoes) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {acoes.map(a => {
          const cor = STATUS_COR[a.status];
          return (
            <div key={a.acao} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{a.acao}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>{a.periodicidade}</span>
                  <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{a.cobertura_pct}%</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Realizados: <strong>{a.realizados}</strong>
                {a.positivos !== null && a.positivos !== undefined && <span> · Positivos: <strong style={{ color: a.positivos > 0 ? "#dc2626" : "#16a34a" }}>{a.positivos}</strong></span>}
              </div>
              {a.alerta && <div style={{ marginTop: 5, background: "#fef9c3", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#92400e" }}>⚠ {a.alerta}</div>}
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

type Aba = "dashboard"|"doencas"|"acoes"|"indicadores";

export default function SaudePrisional() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash   } = useQuery({ queryKey: ["pris-dash"],  queryFn: () => apiGet("/api/saude-prisional/dashboard")        as Promise<any> });
  const { data: hist   } = useQuery({ queryKey: ["pris-hist"],  queryFn: () => apiGet("/api/saude-prisional/producao")         as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: doenc  } = useQuery({ queryKey: ["pris-doe"],   queryFn: () => apiGet("/api/saude-prisional/doencas-prevalentes") as Promise<any[]>, enabled: aba==="doencas" });
  const { data: acoes  } = useQuery({ queryKey: ["pris-ac"],    queryFn: () => apiGet("/api/saude-prisional/acoes-saude")      as Promise<any[]>, enabled: aba==="acoes" });
  const { data: inds   } = useQuery({ queryKey: ["pris-ind"],   queryFn: () => apiGet("/api/saude-prisional/indicadores")      as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "doencas",     label: `Doenças (${dashRaw?.casos_tb_ativos ?? 0} TB + ${dashRaw?.casos_hiv ?? 0} HIV)` },
    { id: "acoes",       label: "Ações de Saúde" },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Saúde Prisional — PNAISP</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>População Privada de Liberdade · TB/HIV/IST · Saúde Mental · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.populacao_privada_liberdade}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>PPL</div>
              </div>
              <div style={{ background: dashRaw.superlotacao_pct > 20 ? "rgba(255,100,100,.3)" : "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.superlotacao_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>superlotação</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #44403c":"2px solid transparent", color: aba===a.id?"#44403c":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && !dashRaw && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="doencas"     && <AbaDoencas doencas={doenc}/>}
        {aba==="acoes"       && <AbaAcoes acoes={acoes}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
