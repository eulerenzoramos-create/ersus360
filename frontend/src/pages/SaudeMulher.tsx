import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Baby, Heart, AlertTriangle, CheckCircle } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const RISCO_COR: Record<string, string>  = { alto: "#dc2626", habitual: "#d97706", baixo: "#16a34a" };

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
  if (!dash) return <NaoDisponivelBanner nota="Dados indisponíveis. Integração não configurada no Railway. Nenhum valor foi inventado." />;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Gestantes ativas"       value={dash.gestantes_ativas}          sub="em acompanhamento"         cor="#ec4899" icon={<Baby size={14} color="#ec4899"/>}/>
        <KpiCard label="Alto risco"             value={dash.alto_risco}                sub="gestantes"                 cor={dash.alto_risco>0?"#dc2626":"#16a34a"} icon={<AlertTriangle size={14} color={dash.alto_risco>0?"#dc2626":"#16a34a"}/>}/>
        <KpiCard label="Sem HIV/Sífilis"        value={dash.sem_teste_hiv_sif}         sub="exames pendentes"          cor={dash.sem_teste_hiv_sif>0?"#d97706":"#16a34a"} icon={<AlertTriangle size={14} color={dash.sem_teste_hiv_sif>0?"#d97706":"#16a34a"}/>}/>
        <KpiCard label="Indicadores críticos"   value={dash.indicadores_criticos}      sub="abaixo da meta"            cor={dash.indicadores_criticos>0?"#dc2626":"#16a34a"} icon={<AlertTriangle size={14} color={dash.indicadores_criticos>0?"#dc2626":"#16a34a"}/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Gestantes e consultas — 6 meses</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Line type="monotone" dataKey="gestantes_ativas" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3 }} name="Gestantes"/>
                <Line type="monotone" dataKey="consultas"        stroke="#7c3aed" strokeWidth={1.5} dot={false}   name="Consultas"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Partos — normal vs total</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.historico} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="partos"        name="Total partos"  fill="#e5e7eb" radius={[4,4,0,0]}/>
                <Bar dataKey="partos_normal" name="Parto normal"  fill="#ec4899" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbaIndicadores({ indicadores }: { indicadores: any[] | undefined }) {
  if (!indicadores) return null;
  return (
    <div>
      {["critico", "atencao", "ok"].map(nivel => {
        const grupo = indicadores.filter(i => i.status === nivel);
        if (!grupo.length) return null;
        const cor = STATUS_COR[nivel];
        return (
          <div key={nivel} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: cor, marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: 1 }}>
              {nivel === "critico" ? "Crítico — abaixo da meta" : nivel === "atencao" ? "Atenção" : "OK"}
            </div>
            {grupo.map(ind => {
              const isInv = ind.invertido;
              const pct = isInv
                ? Math.max(0, Math.min(100, Math.round((1 - ind.valor / (ind.meta * 10)) * 100)))
                : Math.min(100, Math.round(ind.valor / ind.meta * 100));
              return (
                <div key={ind.indicador} style={{ background: "#fff", border: `1px solid ${cor}22`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>Fonte: {ind.fonte}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: cor }}>{ind.valor}{isInv ? "" : "%"}</span>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>meta: {ind.meta}{isInv ? "" : "%"}</span>
                    </div>
                  </div>
                  {!isInv && (
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

function AbaGestantes({ gestantes }: { gestantes: any[] | undefined }) {
  const [filtro, setFiltro] = useState("todos");
  if (!gestantes) return null;
  const lista = filtro === "todos" ? gestantes : gestantes.filter(g => g.risco === filtro);
  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <select value={filtro} onChange={e => setFiltro(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}>
          <option value="todos">Todos os riscos</option>
          <option value="alto">Alto risco</option>
          <option value="habitual">Risco habitual</option>
          <option value="baixo">Baixo risco</option>
        </select>
        <div style={{ fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>{lista.length} gestantes</div>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#ec4899", color: "#fff" }}>
              <th style={{ padding: "9px 14px", textAlign: "left" }}>Gestante</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Equipe</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>IG (sem.)</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Consultas</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Odonto</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>HIV/Síf.</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Risco</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>Retorno</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((g, i) => (
              <tr key={g.id} style={{ borderTop: "1px solid #f3f4f6", background: g.risco === "alto" ? "#fff7f7" : i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                <td style={{ padding: "9px 14px", fontWeight: 600 }}>{g.iniciais}</td>
                <td style={{ padding: "9px 10px", color: "#374151", fontSize: 11 }}>{g.equipe}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700, color: g.ig_atual >= 37 ? "#ec4899" : "#374151" }}>{g.ig_atual}</td>
                <td style={{ padding: "9px 10px", textAlign: "right" }}>
                  <span style={{ color: g.consultas >= g.consultas_meta ? "#16a34a" : "#d97706" }}>{g.consultas}</span>/{g.consultas_meta}
                </td>
                <td style={{ padding: "9px 10px", textAlign: "center" }}>{g.odonto ? <span style={{ color: "#16a34a" }}>✓</span> : <span style={{ color: "#dc2626" }}>✗</span>}</td>
                <td style={{ padding: "9px 10px", textAlign: "center" }}>{g.hiv_sifilis ? <span style={{ color: "#16a34a" }}>✓</span> : <span style={{ color: "#dc2626" }}>✗</span>}</td>
                <td style={{ padding: "9px 10px", textAlign: "center" }}>
                  <span style={{ background: RISCO_COR[g.risco] + "15", color: RISCO_COR[g.risco], fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, textTransform: "capitalize" as const }}>{g.risco}</span>
                </td>
                <td style={{ padding: "9px 10px", fontSize: 11, color: "#6b7280" }}>{g.proximo_retorno}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AbaPuerperas({ puerperas }: { puerperas: any[] | undefined }) {
  if (!puerperas) return null;
  return (
    <div>
      {puerperas.filter(p => !p.consulta_puerp).length > 0 && (
        <div style={{ background: "#fff7f7", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 6 }}>Puérperas sem consulta puerperal</div>
          {puerperas.filter(p => !p.consulta_puerp).map(p => (
            <div key={p.id} style={{ fontSize: 12, color: "#7f1d1d", padding: "2px 0" }}>• {p.iniciais} — {p.equipe} (parto {p.data_parto}, {p.dias_puerp} dias)</div>
          ))}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {puerperas.map(p => (
          <div key={p.id} style={{ background: "#fff", border: `1px solid ${p.consulta_puerp ? "#d1fae5" : "#fca5a5"}`, borderRadius: 8, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{p.iniciais}</span>
              {p.consulta_puerp
                ? <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>✓ Consultada</span>
                : <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 700 }}>⚠ Pendente</span>}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{p.equipe}</div>
            <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>Parto: {p.data_parto} · {p.dias_puerp} dias</div>
            <div style={{ marginTop: 6 }}>
              <span style={{ background: RISCO_COR[p.risco] + "15", color: RISCO_COR[p.risco], fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, textTransform: "capitalize" as const }}>{p.risco}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type Aba = "dashboard" | "indicadores" | "gestantes" | "puerperas";

export default function SaudeMulher() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash }        = useQuery({ queryKey: ["sm-dash"],  queryFn: () => apiGet("/api/saude-mulher/dashboard") as Promise<any> });
  const { data: indicadores } = useQuery({ queryKey: ["sm-ind"],   queryFn: () => apiGet("/api/saude-mulher/indicadores") as Promise<any[]>,  enabled: aba === "indicadores" });
  const { data: gestantes }   = useQuery({ queryKey: ["sm-gest"],  queryFn: () => apiGet("/api/saude-mulher/gestantes") as Promise<any[]>,    enabled: aba === "gestantes" });
  const { data: puerperas }   = useQuery({ queryKey: ["sm-puerp"], queryFn: () => apiGet("/api/saude-mulher/puerperas") as Promise<any[]>,    enabled: aba === "puerperas" });

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "indicadores", label: "Indicadores" },
    { id: "gestantes",   label: "Gestantes" },
    { id: "puerperas",   label: "Puerpério" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Saúde da Mulher</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Pré-natal · Puerpério · Preventivo · SISPRENATAL · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{dash.gestantes_ativas}</div>
              <div style={{ fontSize: 10, opacity: .8 }}>gestantes ativas</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba === a.id ? "2px solid #ec4899" : "2px solid transparent", color: aba === a.id ? "#ec4899" : "#6b7280", fontWeight: aba === a.id ? 700 : 400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba === "dashboard" && !dash && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba === "dashboard"   && <AbaDashboard dash={dash}/>}
        {aba === "indicadores" && <AbaIndicadores indicadores={indicadores}/>}
        {aba === "gestantes"   && <AbaGestantes gestantes={gestantes}/>}
        {aba === "puerperas"   && <AbaPuerperas puerperas={puerperas}/>}
      </div>
    </div>
  );
}
