import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Users, AlertTriangle, Activity, MapPin } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const ACESSO_COR: Record<string, string> = { fluvial: "#1d4ed8", "fluvial+terrestre": "#d97706" };

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
        <KpiCard label="Pop. indígena"      value={dash.populacao_indigena.toLocaleString("pt-BR")} sub={`${dash.aldeias} aldeias · ${dash.etnias} etnias`} cor="#7c3aed" icon={<Users size={14} color="#7c3aed"/>}/>
        <KpiCard label="Consultas/mês"      value={dash.consultas_mes}        sub="Mar/2026"                   cor="#1d4ed8"  icon={<Activity size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Encaminhamentos"    value={dash.encaminhamentos_mes}  sub="referências Mar/26"          cor="#d97706"  icon={<MapPin size={14} color="#d97706"/>}/>
        <KpiCard label="Cobertura vacinal"  value={dash.cobertura_vacinal_pct+"%"} sub="meta 95%"              cor={dash.cobertura_vacinal_pct<80?"#dc2626":"#d97706"} icon={<Activity size={14} color={dash.cobertura_vacinal_pct<80?"#dc2626":"#d97706"}/>}/>
        <KpiCard label="Indic. críticos"    value={dash.indicadores_criticos} sub="abaixo da meta"             cor="#dc2626"  icon={<AlertTriangle size={14} color="#dc2626"/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Consultas e encaminhamentos — 6 meses</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Line type="monotone" dataKey="consultas"        stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3 }} name="Consultas"/>
                <Line type="monotone" dataKey="encaminhamentos"  stroke="#d97706" strokeWidth={1.5} dot={false}   name="Encaminhamentos"/>
                <Line type="monotone" dataKey="vacinacoes"       stroke="#16a34a" strokeWidth={1.5} dot={false}   name="Vacinações"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Consultas por aldeia — Mar/26</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.aldeias_chart || []} layout="vertical" barSize={13}>
                <XAxis type="number" tick={{ fontSize: 9 }}/>
                <YAxis type="category" dataKey="aldeia" tick={{ fontSize: 8 }} width={120}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="consultas_mes" name="Consultas" fill="#7c3aed" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 18, background: "#faf5ff", border: "1px solid #d8b4fe", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        <strong>Articulação SESAI/DSEI Alto Rio Purus:</strong> FMS Apuí atua como referência para internação e especialidades. Portaria MS 254/2002 — Política Nacional de Atenção à Saúde dos Povos Indígenas. Notificação epidemiológica e vacinação de responsabilidade compartilhada DSEI/Secretaria Municipal.
      </div>
    </div>
  );
}

function AbaAldeias({ aldeias }: { aldeias: any[] | undefined }) {
  if (!aldeias) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {aldeias.map(a => {
          const isAlerta = a.status === "alerta_acesso";
          return (
            <div key={a.id} style={{ background: "#fff", border: `1px solid ${isAlerta?"#dc2626":"#e5e7eb"}`, borderLeft: `4px solid ${isAlerta?"#dc2626":"#7c3aed"}`, borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{a.aldeia}</div>
                {isAlerta && <span style={{ background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>⚠ Alerta acesso</span>}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                Etnia: <strong style={{ color: "#374151" }}>{a.etnia}</strong> · Pop.: <strong>{a.populacao}</strong> · Distância: <strong>{a.distancia_km} km</strong>
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
                <span style={{ background: (ACESSO_COR[a.acesso]||"#6b7280")+"15", color: ACESSO_COR[a.acesso]||"#6b7280", padding: "2px 7px", borderRadius: 4, fontWeight: 600 }}>{a.acesso}</span>
                <span>Polo: <strong>{a.polo_base}</strong></span>
              </div>
              <div style={{ display: "flex", gap: 20, fontSize: 12, marginTop: 8, borderTop: "1px solid #f3f4f6", paddingTop: 8 }}>
                <span>ACS indígena: <strong>{a.acs_indigena}</strong></span>
                <span>Consult./mês: <strong style={{ color: "#7c3aed" }}>{a.consultas_mes}</strong></span>
                <span>Encam.: <strong style={{ color: "#d97706" }}>{a.encaminhamentos}</strong></span>
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
            {grupo.map(ind => {
              const pct = ind.invertido ? 100 : Math.min(100, Math.round(Number(ind.valor) / Number(ind.meta) * 100));
              return (
                <div key={ind.indicador} style={{ background: "#fff", border: `1px solid ${cor}22`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                      {ind.observacao && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{ind.observacao}</div>}
                    </div>
                    <div style={{ flexShrink: 0, marginLeft: 12, textAlign: "right" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade.startsWith("%")||ind.unidade.startsWith("/")?ind.unidade:" "+ind.unidade}</span>
                      <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade.startsWith("%")?ind.unidade:""}</span>
                    </div>
                  </div>
                  {!ind.invertido && (
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

function AbaReferencias({ refs }: { refs: any[] | undefined }) {
  if (!refs) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {refs.map((r, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderLeft: "4px solid #7c3aed", borderRadius: 8, padding: "14px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{r.destino}</div>
              <span style={{ background: "#f5f3ff", color: "#7c3aed", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 4 }}>{r.casos_2026} casos 2026</span>
            </div>
            <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#6b7280" }}>
              <span>Especialidade: <strong style={{ color: "#374151" }}>{r.especialidade}</strong></span>
              <span>Distância: <strong>{r.distancia_km === 0 ? "local" : r.distancia_km+" km"}</strong></span>
              <span>Transporte: <strong>{r.transporte}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type Aba = "dashboard"|"aldeias"|"indicadores"|"referencias";

export default function SaudeIndigena() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dashRaw } = useQuery({ queryKey: ["si-dash"], queryFn: () => apiGet("/api/saude-indigena/dashboard") as Promise<any> });
  const { data: aldeias } = useQuery({ queryKey: ["si-ald"],  queryFn: () => apiGet("/api/saude-indigena/aldeias")    as Promise<any[]>, enabled: aba==="aldeias"||aba==="dashboard" });
  const { data: inds }    = useQuery({ queryKey: ["si-ind"],  queryFn: () => apiGet("/api/saude-indigena/indicadores") as Promise<any[]>, enabled: aba==="indicadores" });
  const { data: refs }    = useQuery({ queryKey: ["si-ref"],  queryFn: () => apiGet("/api/saude-indigena/referencias") as Promise<any[]>, enabled: aba==="referencias" });

  const dash = dashRaw && aldeias ? { ...dashRaw, aldeias_chart: aldeias.map(a => ({ aldeia: a.aldeia.replace("Aldeia ",""), consultas_mes: a.consultas_mes })) } : null;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "aldeias",     label: `Aldeias (${dashRaw?.aldeias ?? 0})` },
    { id: "indicadores", label: "Indicadores" },
    { id: "referencias", label: "Referências" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#6d28d9 0%,#15803d 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Saúde Indígena</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>SESAI · DSEI Alto Rio Purus · 6 Aldeias · FMS Apuí/AM</p>
          </div>
          {dashRaw && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.populacao_indigena}</div>
              <div style={{ fontSize: 10, opacity: .8 }}>indígenas</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #f3e8ff" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #7c3aed":"2px solid transparent", color: aba===a.id?"#7c3aed":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"   && <AbaDashboard dash={dash}/>}
        {aba==="aldeias"     && <AbaAldeias aldeias={aldeias}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
        {aba==="referencias" && <AbaReferencias refs={refs}/>}
      </div>
    </div>
  );
}
