import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from "recharts";
import { Activity, CheckCircle, AlertTriangle, Upload } from "lucide-react";
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

function AbaDashboard({ dash }: { dash: any }) {
  if (!dash) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Atendimentos (Mar)"  value={dash.total_atendimentos.toLocaleString("pt-BR")} sub={`meta: ${dash.meta_total.toLocaleString("pt-BR")}`} cor="#1d4ed8" icon={<Activity size={14} color="#1d4ed8"/>}/>
        <KpiCard label="% da meta"           value={`${Math.round(dash.total_atendimentos/dash.meta_total*100)}%`} sub="produção vs meta"  cor={dash.total_atendimentos>=dash.meta_total?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={dash.total_atendimentos>=dash.meta_total?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Equipes críticas"    value={dash.equipes_criticas}   sub="abaixo da meta"                  cor={dash.equipes_criticas>0?"#dc2626":"#16a34a"} icon={<AlertTriangle size={14} color={dash.equipes_criticas>0?"#dc2626":"#16a34a"}/>}/>
        <KpiCard label="Equipes OK"          value={dash.equipes_ok}         sub="atingiram meta"                  cor="#16a34a" icon={<CheckCircle size={14} color="#16a34a"/>}/>
        <KpiCard label="Ciclo Abr/26"        value={dash.registros_abr.toLocaleString("pt-BR")} sub={`status: ${dash.ciclo_atual_status}`} cor={dash.ciclo_atual_status==="pendente"?"#d97706":"#16a34a"} icon={<Upload size={14} color={dash.ciclo_atual_status==="pendente"?"#d97706":"#16a34a"}/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Atendimentos mensais — 6 meses</div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Line type="monotone" dataKey="atend"      stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 3 }} name="Atendimentos"/>
                <Line type="monotone" dataKey="vd_acs"     stroke="#0891b2" strokeWidth={1.5} dot={false}   name="VD ACS"/>
                <Line type="monotone" dataKey="proc_odonto" stroke="#7c3aed" strokeWidth={1.5} dot={false}  name="Odonto"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Top 5 procedimentos</div>
          {dash.top_proc.map((p: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
              <span style={{ color: "#374151", fontSize: 12 }}>{p.proc}</span>
              <span style={{ fontWeight: 700, color: "#1d4ed8" }}>{p.qtd.toLocaleString("pt-BR")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AbaPorEquipe({ equipes }: { equipes: any[] | undefined }) {
  if (!equipes) return null;
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Atendimentos por equipe ESF — Mar/2026</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={equipes} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="equipe" tick={{ fontSize: 8 }} interval={0} angle={-15} textAnchor="end" height={50}/>
              <YAxis tick={{ fontSize: 10 }}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="medico"     name="Médico"      stackId="a" fill="#1d4ed8"/>
              <Bar dataKey="enfermeiro" name="Enfermeiro"  stackId="a" fill="#0891b2"/>
              <Bar dataKey="odonto"     name="Odonto"      stackId="a" fill="#7c3aed"/>
              <Bar dataKey="outros"     name="Outros"      stackId="a" fill="#6b7280" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              <th style={{ padding: "9px 14px", textAlign: "left" }}>Equipe</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Médico</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Enf.</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Odonto</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Outros</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Total</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Meta</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {equipes.map((e, i) => {
              const cor = STATUS_COR[e.status];
              const pct = Math.round(e.total / e.meta * 100);
              return (
                <tr key={e.equipe} style={{ borderTop: "1px solid #f3f4f6", background: e.status === "critico" ? "#fff7f7" : i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={{ padding: "9px 14px", fontWeight: 600 }}>{e.equipe}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right" }}>{e.medico}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right" }}>{e.enfermeiro}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right" }}>{e.odonto}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right" }}>{e.outros}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700 }}>{e.total}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: "#9ca3af" }}>{e.meta}</td>
                  <td style={{ padding: "9px 10px", textAlign: "center" }}>
                    <span style={{ background: cor + "15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{pct}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AbaProcedimentos({ procs }: { procs: any[] | undefined }) {
  if (!procs) return null;
  return (
    <div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#7c3aed", color: "#fff" }}>
              <th style={{ padding: "9px 14px", textAlign: "left" }}>Procedimento</th>
              <th style={{ padding: "9px 10px", textAlign: "left" }}>SIGTAP</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Realizado</th>
              <th style={{ padding: "9px 10px", textAlign: "right" }}>Meta</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>% Meta</th>
              <th style={{ padding: "9px 10px", textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {procs.map((p, i) => {
              const cor = STATUS_COR[p.status];
              const pct = Math.round(p.qtd / p.meta_mes * 100);
              return (
                <tr key={p.codigo} style={{ borderTop: "1px solid #f3f4f6", background: p.status === "critico" ? "#fff7f7" : i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={{ padding: "9px 14px", fontWeight: 500 }}>{p.procedimento}</td>
                  <td style={{ padding: "9px 10px", fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>{p.codigo}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700 }}>{p.qtd.toLocaleString("pt-BR")}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: "#9ca3af" }}>{p.meta_mes.toLocaleString("pt-BR")}</td>
                  <td style={{ padding: "9px 10px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                      <div style={{ background: "#f3f4f6", borderRadius: 4, height: 8, width: 60, overflow: "hidden" }}>
                        <div style={{ background: cor, height: "100%", width: `${Math.min(pct, 100)}%`, borderRadius: 4 }}/>
                      </div>
                      <span style={{ fontSize: 11, color: cor, fontWeight: 700 }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "9px 10px", textAlign: "center" }}>
                    <span style={{ background: cor + "15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
                      {p.status === "critico" ? "Crítico" : p.status === "atencao" ? "Atenção" : "OK"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AbaCiclos({ ciclos }: { ciclos: any[] | undefined }) {
  if (!ciclos) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {ciclos.map(c => (
        <div key={c.ciclo} style={{ background: "#fff", border: `1px solid ${c.status === "pendente" ? "#fde68a" : "#d1fae5"}`, borderLeft: `4px solid ${c.status === "pendente" ? "#d97706" : "#16a34a"}`, borderRadius: 8, padding: "14px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Ciclo {c.ciclo}</div>
            <span style={{ background: c.status === "pendente" ? "#fffbeb" : "#f0fdf4", color: c.status === "pendente" ? "#d97706" : "#16a34a", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 5 }}>
              {c.status === "pendente" ? "Pendente envio" : "Enviado ✓"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 12, color: "#6b7280", marginTop: 6 }}>
            {c.data_envio && <span>Enviado em: <strong style={{ color: "#374151" }}>{c.data_envio}</strong></span>}
            {c.registros && <span>Registros: <strong style={{ color: "#374151" }}>{c.registros.toLocaleString("pt-BR")}</strong></span>}
            {c.criticas !== null && c.criticas !== undefined && <span>Críticas: <strong style={{ color: c.criticas > 0 ? "#d97706" : "#16a34a" }}>{c.criticas}</strong></span>}
          </div>
        </div>
      ))}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        Envio ao SISAB via e-SUS PEC. Prazo mensal: até o 5º dia útil do mês seguinte. Validação pela COSEMS/AM e DATASUS.
      </div>
    </div>
  );
}

type Aba = "dashboard" | "equipe" | "procedimentos" | "ciclos";

export default function ProducaoSISAB() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash }   = useQuery({ queryKey: ["sisab-dash"],  queryFn: () => apiGet("/api/sisab/dashboard") as Promise<any> });
  const { data: equipes }= useQuery({ queryKey: ["sisab-equip"], queryFn: () => apiGet("/api/sisab/por-equipe") as Promise<any[]>,    enabled: aba === "equipe" });
  const { data: procs }  = useQuery({ queryKey: ["sisab-proc"],  queryFn: () => apiGet("/api/sisab/procedimentos") as Promise<any[]>, enabled: aba === "procedimentos" });
  const { data: ciclos } = useQuery({ queryKey: ["sisab-cicl"],  queryFn: () => apiGet("/api/sisab/ciclos") as Promise<any[]>,        enabled: aba === "ciclos" });

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",    label: "Dashboard" },
    { id: "equipe",       label: "Por Equipe ESF" },
    { id: "procedimentos",label: "Procedimentos" },
    { id: "ciclos",       label: "Envios SISAB" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Produção APS — SISAB</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Sistema de Informação em Saúde para a Atenção Básica · e-SUS PEC · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{dash.total_atendimentos.toLocaleString("pt-BR")}</div>
              <div style={{ fontSize: 10, opacity: .8 }}>atend. Mar/26</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba === a.id ? "2px solid #1d4ed8" : "2px solid transparent", color: aba === a.id ? "#1d4ed8" : "#6b7280", fontWeight: aba === a.id ? 700 : 400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba === "dashboard" && !dash && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba === "dashboard"     && <AbaDashboard dash={dash}/>}
        {aba === "equipe"        && <AbaPorEquipe equipes={equipes}/>}
        {aba === "procedimentos" && <AbaProcedimentos procs={procs}/>}
        {aba === "ciclos"        && <AbaCiclos ciclos={ciclos}/>}
      </div>
    </div>
  );
}
