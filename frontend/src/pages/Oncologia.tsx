import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Heart, AlertTriangle, Clock, Users } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const SIT_COR: Record<string, string> = {
  "Em QT": "#1d4ed8", "Em RT": "#7c3aed", "Em QT+RT": "#6d28d9",
  "Paliativos": "#dc2626", "Pós-cirurgia": "#16a34a",
  "Aguard. biópsia": "#d97706", "Em hormonioterapia": "#0369a1",
  "Em QT pediátrica": "#ec4899", "Em QT CHOP": "#1d4ed8",
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
      {dash.tempo_medio_diagnostico_dias > dash.meta_diagnostico_dias && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#dc2626" }}>
          <strong>⚠ Lei 12.732:</strong> Prazo máximo de {dash.meta_diagnostico_dias} dias para início do tratamento. Tempo médio atual: <strong>{dash.tempo_medio_diagnostico_dias} dias</strong> — {dash.tempo_medio_diagnostico_dias - dash.meta_diagnostico_dias} dias acima.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Pacientes oncológicos" value={dash.pacientes_oncologicos}             sub={`${dash.em_tratamento_ativo} em trat. ativo`}                cor="#374151"  icon={<Users size={14} color="#374151"/>}/>
        <KpiCard label="Cuidados paliativos"   value={dash.cuidados_paliativos}              sub="conforto + dor"                                              cor="#dc2626"  icon={<Heart size={14} color="#dc2626"/>}/>
        <KpiCard label="Tempo diagnóstico"     value={dash.tempo_medio_diagnostico_dias+"d"} sub={`meta: ${dash.meta_diagnostico_dias}d (Lei 12.732)`}         cor="#dc2626"  icon={<Clock size={14} color="#dc2626"/>}/>
        <KpiCard label="TFD oncologia"         value={dash.tfd_oncologia_ativos}             sub="em tratamento fora domicílio"                                cor="#d97706"  icon={<AlertTriangle size={14} color="#d97706"/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Oncologia — tendência 6 meses</div>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="d"/>
                <Tooltip contentStyle={TT}/>
                <ReferenceLine yAxisId="r" y={30} stroke="#16a34a" strokeDasharray="4 2" label={{ value: "meta 30d", fontSize: 9, fill: "#16a34a" }}/>
                <Line yAxisId="l" type="monotone" dataKey="em_tratamento" stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 3 }} name="Em tratamento"/>
                <Line yAxisId="l" type="monotone" dataKey="paliativos"    stroke="#dc2626" strokeWidth={2}   dot={{ r: 3 }} name="Paliativos"/>
                <Line yAxisId="l" type="monotone" dataKey="casos_novos"   stroke="#d97706" strokeWidth={1.5} dot={{ r: 3 }} name="Casos novos"/>
                <Line yAxisId="r" type="monotone" dataKey="tempo_diag_dias" stroke="#6b7280" strokeWidth={1} dot={false} name="Tempo diagn. (d)" strokeDasharray="3 2"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaPacientes({ pacientes }: { pacientes: any[] | undefined }) {
  if (!pacientes) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {pacientes.map(p => {
          const cor = STATUS_COR[p.status];
          const sitCor = SIT_COR[p.situacao] ?? "#374151";
          return (
            <div key={p.id} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "11px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{p.id}</span>
                  <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 700 }}>{p.topografia}</span>
                  <span style={{ marginLeft: 6, fontSize: 11, color: "#6b7280" }}>Est. {p.estadiamento}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ background: sitCor+"15", color: sitCor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{p.situacao}</span>
                  {p.tfd && <span style={{ background: "#fef9c3", color: "#92400e", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>TFD</span>}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {p.ciclo && <span>Ciclo: <strong>{p.ciclo}</strong> · </span>}
                {p.tempo_espera_dias && <span>Espera: <strong style={{ color: p.tempo_espera_dias > 30 ? "#dc2626" : "#374151" }}>{p.tempo_espera_dias} dias</strong></span>}
              </div>
              {p.alerta && <div style={{ marginTop: 4, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {p.alerta}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaPaliativos({ pals }: { pals: any[] | undefined }) {
  if (!pals) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pals.map(p => {
          const cor = STATUS_COR[p.status];
          return (
            <div key={p.id} style={{ background: "#fff", border: `2px solid ${cor}33`, borderLeft: `5px solid ${cor}`, borderRadius: 8, padding: "12px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{p.id}</span>
                  <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 700 }}>{p.diagnostico}</span>
                </div>
                <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
                  <span style={{ color: p.visita_domiciliar ? "#16a34a" : "#dc2626" }}>{p.visita_domiciliar ? "✓ Visita domiciliar" : "✗ Sem visita"}</span>
                  <span style={{ color: p.familiar_cuidador ? "#16a34a" : "#dc2626" }}>{p.familiar_cuidador ? "✓ Cuidador" : "✗ Sem cuidador"}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280" }}>
                <span>Sintoma: <strong style={{ color: "#dc2626" }}>{p.sintoma_principal}</strong></span>
                {p.morfina_dose && <span>Morfina: <strong>{p.morfina_dose}</strong></span>}
                <span>Dias: <strong>{p.dias_programa}</strong></span>
              </div>
              {p.alerta && <div style={{ marginTop: 5, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 700 }}>⚠ {p.alerta}</div>}
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ind.meta && typeof ind.valor==="number"?6:0 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                    {ind.observacao && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{ind.observacao}</div>}
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade==="%"?"%":ind.unidade==="dias"?" dias":""}</span>
                    {ind.meta && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade==="%"?"%":""}</span>}
                  </div>
                </div>
                {ind.meta && typeof ind.valor==="number" && ind.unidade==="%" && (
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

type Aba = "dashboard"|"pacientes"|"paliativos"|"indicadores";

export default function Oncologia() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["onc-dash"], queryFn: () => apiGet("/api/oncologia/dashboard")    as Promise<any> });
  const { data: hist  } = useQuery({ queryKey: ["onc-hist"], queryFn: () => apiGet("/api/oncologia/historico")    as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: pacs  } = useQuery({ queryKey: ["onc-pacs"], queryFn: () => apiGet("/api/oncologia/pacientes")   as Promise<any[]>, enabled: aba==="pacientes" });
  const { data: pals  } = useQuery({ queryKey: ["onc-pals"], queryFn: () => apiGet("/api/oncologia/paliativos")  as Promise<any[]>, enabled: aba==="paliativos" });
  const { data: inds  } = useQuery({ queryKey: ["onc-ind"],  queryFn: () => apiGet("/api/oncologia/indicadores") as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "pacientes",   label: `Pacientes (${dashRaw?.pacientes_oncologicos ?? 0})` },
    { id: "paliativos",  label: `Paliativos (${dashRaw?.cuidados_paliativos ?? 0})` },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#831843 0%,#be185d 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Oncologia e Cuidados Paliativos</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Lei 12.732 · TFD · Rastreamento · Paliativos · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.pacientes_oncologicos}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>pacientes</div>
              </div>
              <div style={{ background: dashRaw.tempo_medio_diagnostico_dias > dashRaw.meta_diagnostico_dias ? "rgba(255,100,100,.3)" : "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.tempo_medio_diagnostico_dias}d</div>
                <div style={{ fontSize: 10, opacity: .8 }}>tempo diagn.</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #fce7f3" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #be185d":"2px solid transparent", color: aba===a.id?"#be185d":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="pacientes"   && <AbaPacientes pacientes={pacs}/>}
        {aba==="paliativos"  && <AbaPaliativos pals={pals}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
