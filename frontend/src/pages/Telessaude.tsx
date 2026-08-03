import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Cell } from "recharts";
import { Monitor, Clock, TrendingUp, DollarSign } from "lucide-react";
import { apiGet } from "../lib/api";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const RESOL_COR = (pct: number) => pct >= 70 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";

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
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#166534" }}>
        <strong>Telessaúde Apuí:</strong> {dash.regulacoes_evitadas_mes} regulações evitadas/mês · economia estimada de <strong>R${dash.economia_estimada_mes.toLocaleString("pt-BR")}</strong> em TFD + diárias. Tempo médio resposta: {dash.tempo_medio_resposta_horas}h (meta {dash.meta_resposta_horas}h).
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Teleatendimentos/mês"   value={dash.total_teleatendimentos_mes}    sub={`${dash.especialidades_ativas} especialidades`}    cor="#1d4ed8"                              icon={<Monitor size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Tempo resp. médio"       value={dash.tempo_medio_resposta_horas+"h"} sub={`meta: ${dash.meta_resposta_horas}h`}             cor={dash.tempo_medio_resposta_horas<=dash.meta_resposta_horas?"#16a34a":"#d97706"} icon={<Clock size={14} color={dash.tempo_medio_resposta_horas<=dash.meta_resposta_horas?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Internações evitadas"   value={dash.internacoes_evitadas_pct+"%"}  sub="resolubilidade na APS"                            cor="#16a34a"                              icon={<TrendingUp size={14} color="#16a34a"/>}/>
        <KpiCard label="Economia/mês"           value={"R$"+dash.economia_estimada_mes.toLocaleString("pt-BR")} sub="TFD + transporte + diárias"   cor="#16a34a"                              icon={<DollarSign size={14} color="#16a34a"/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Produção telessaúde — 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar yAxisId="l" dataKey="teleconsultas" name="Teleconsultas" fill="#1d4ed8" radius={[4,4,0,0]} stackId="a"/>
                <Bar yAxisId="l" dataKey="teleecg"       name="Tele-ECG"      fill="#0369a1" radius={[0,0,0,0]} stackId="a"/>
                <Bar yAxisId="l" dataKey="telederma"     name="Telederma"     fill="#7c3aed" radius={[0,0,0,0]} stackId="a"/>
                <Bar yAxisId="l" dataKey="segunda_opiniao" name="2ª opinião"  fill="#374151" radius={[0,0,4,4]} stackId="a"/>
                <Line yAxisId="r" type="monotone" dataKey="economia" name="Economia (R$)" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaEspecialidades({ specs }: { specs: any[] | undefined }) {
  if (!specs) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {specs.map(s => {
          const cor = RESOL_COR(s.resolubilidade_pct);
          return (
            <div key={s.especialidade} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{s.especialidade}</div>
                <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                  <span>Consultas: <strong>{s.teleconsultas}</strong></span>
                  {s.tele_ecg > 0 && <span>Tele-ECG: <strong>{s.tele_ecg}</strong></span>}
                  <span>Resp.: <strong style={{ color: s.tempo_resp_h > s.tempo_resp_h + 2 ? "#dc2626" : "#374151" }}>{s.tempo_resp_h}h</strong></span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>Regulações evitadas: <strong>{s.regulacoes_evitadas}</strong></span>
                <span style={{ fontSize: 12, fontWeight: 700, color: cor }}>{s.resolubilidade_pct}% resolubilidade</span>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7 }}>
                <div style={{ background: cor, height: "100%", width: `${s.resolubilidade_pct}%`, borderRadius: 6 }}/>
              </div>
              {s.observacao && <div style={{ marginTop: 5, background: "#fef9c3", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#92400e" }}>⚠ {s.observacao}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaESF({ units }: { units: any[] | undefined }) {
  if (!units) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {units.map(u => {
          const cor = u.adesao_pct >= 90 ? "#16a34a" : u.adesao_pct >= 75 ? "#d97706" : "#dc2626";
          return (
            <div key={u.esf} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{u.esf}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>Principal: {u.top_especialidade}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#1d4ed8" }}>{u.teleconsultas_mes}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>consultas/mês</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 3 }}>Adesão {u.adesao_pct}%</div>
                  <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7 }}>
                    <div style={{ background: cor, height: "100%", width: `${u.adesao_pct}%`, borderRadius: 6 }}/>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 3 }}>Resolubilidade {u.resolubilidade_pct}%</div>
                  <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7 }}>
                    <div style={{ background: RESOL_COR(u.resolubilidade_pct), height: "100%", width: `${u.resolubilidade_pct}%`, borderRadius: 6 }}/>
                  </div>
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
            {grupo.map(ind => (
              <div key={ind.indicador} style={{ background: "#fff", border: `1px solid ${cor}22`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                    {ind.observacao && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{ind.observacao}</div>}
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>
                      {ind.unidade==="R$" ? "R$"+Number(ind.valor).toLocaleString("pt-BR") : ind.valor}{ind.unidade==="%"?"%":ind.unidade==="h"?"h":ind.unidade==="un"?" un":""}
                    </span>
                    {ind.meta && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade==="%"?"%":""}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

type Aba = "dashboard"|"especialidades"|"esf"|"indicadores";

export default function Telessaude() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["tele-dash"],  queryFn: () => apiGet("/api/telessaude/dashboard")      as Promise<any> });
  const { data: hist  } = useQuery({ queryKey: ["tele-hist"],  queryFn: () => apiGet("/api/telessaude/historico")      as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: specs } = useQuery({ queryKey: ["tele-spec"],  queryFn: () => apiGet("/api/telessaude/especialidades") as Promise<any[]>, enabled: aba==="especialidades" });
  const { data: esfs  } = useQuery({ queryKey: ["tele-esf"],   queryFn: () => apiGet("/api/telessaude/solicitantes")   as Promise<any[]>, enabled: aba==="esf" });
  const { data: inds  } = useQuery({ queryKey: ["tele-ind"],   queryFn: () => apiGet("/api/telessaude/indicadores")    as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",      label: "Dashboard" },
    { id: "especialidades", label: `Especialidades (${dashRaw?.especialidades_ativas ?? 0})` },
    { id: "esf",            label: "Por ESF" },
    { id: "indicadores",    label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Telessaúde</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Teleconsulta · Tele-ECG · Teledermatologia · 2ª Opinião · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.total_teleatendimentos_mes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>atendimentos/mês</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{BRL(dashRaw.economia_estimada_mes)}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>economia/mês</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #1d4ed8":"2px solid transparent", color: aba===a.id?"#1d4ed8":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"      && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="especialidades" && <AbaEspecialidades specs={specs}/>}
        {aba==="esf"            && <AbaESF units={esfs}/>}
        {aba==="indicadores"    && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
