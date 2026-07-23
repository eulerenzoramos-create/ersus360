import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Shield, AlertTriangle, Activity, CheckCircle } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#e4e7ec", border: "none", borderRadius: 6, color: "#f8fafc" };
const ADESAO_COR: Record<string, string> = { boa: "#16a34a", irregular: "#dc2626" };
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
        <KpiCard label="HIV em TARV"         value={dash.hiv_em_tarv}         sub="pacientes ativos"         cor="#1d4ed8" icon={<Shield size={14} color="#1d4ed8"/>}/>
        <KpiCard label="HIV alertas"         value={dash.hiv_alertas}         sub="CV detectável / atraso"    cor={dash.hiv_alertas>0?"#dc2626":"#16a34a"} icon={<AlertTriangle size={14} color={dash.hiv_alertas>0?"#dc2626":"#16a34a"}/>}/>
        <KpiCard label="Sífilis casos 2026"  value={dash.sifilis_casos_2026}  sub="adquirida notificada"      cor="#d97706" icon={<Activity size={14} color="#d97706"/>}/>
        <KpiCard label="Síf. congênita 2026" value={dash.sifilis_congenita_2026} sub="meta: zero"            cor={dash.sifilis_congenita_2026>0?"#dc2626":"#16a34a"} icon={<AlertTriangle size={14} color={dash.sifilis_congenita_2026>0?"#dc2626":"#16a34a"}/>}/>
        <KpiCard label="PrEP ativos"         value={dash.prep_usuarios}        sub="profilaxia pré-exposição" cor="#7c3aed" icon={<CheckCircle size={14} color="#7c3aed"/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Testagens rápidas — 6 meses</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.historico_testagem} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="hiv_rapido"    name="HIV"       fill="#1d4ed8" radius={[4,4,0,0]}/>
                <Bar dataKey="sifilis_rapido" name="Sífilis"  fill="#d97706" radius={[4,4,0,0]}/>
                <Bar dataKey="hepatite_b"    name="Hep. B"    fill="#16a34a" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Positivos por mês</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico_testagem}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Line type="monotone" dataKey="sifilis_positivos" stroke="#d97706" strokeWidth={2.5} dot={{ r: 3 }} name="Sífilis +"/>
                <Line type="monotone" dataKey="hiv_positivos"     stroke="#dc2626" strokeWidth={1.5} dot={{ r: 2 }} name="HIV +"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
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
        const cor = STATUS_COR[nivel];
        return (
          <div key={nivel} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: cor, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 1 }}>{nivel==="critico"?"Crítico":nivel==="atencao"?"Atenção":"OK"}</div>
            {grupo.map(ind => {
              const isNum = typeof ind.valor === "number" && !ind.unidade.startsWith("/");
              const pct = ind.invertido ? 100 : isNum ? Math.min(100, Math.round(ind.valor / ind.meta * 100)) : 100;
              return (
                <div key={ind.indicador} style={{ background: "#fff", border: `1px solid ${cor}22`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ind.invertido ? 0 : 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                    <div style={{ flexShrink: 0, marginLeft: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade.startsWith("%")?"%":""}</span>
                      <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade.startsWith("%")?"%":""}</span>
                    </div>
                  </div>
                  {!ind.invertido && isNum && (
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

function AbaPacientesHIV({ pacientes }: { pacientes: any[] | undefined }) {
  if (!pacientes) return null;
  const alertas = pacientes.filter(p => p.alerta);
  return (
    <div>
      {alertas.length > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 12, marginBottom: 14, color: "#dc2626" }}>
          <strong>⚠ {alertas.length} pacientes requerem atenção imediata</strong> — CV detectável ou consulta em atraso.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pacientes.map(p => {
          const adCor = ADESAO_COR[p.adesao] || "#6b7280";
          return (
            <div key={p.id} style={{ background: "#fff", border: `1px solid ${p.alerta?"#dc262622":"#e5e7eb"}`, borderLeft: `4px solid ${p.cv_detectavel?"#dc2626":p.adesao==="irregular"?"#d97706":"#16a34a"}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{p.codigo}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ background: adCor+"15", color: adCor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>Adesão {p.adesao}</span>
                  {p.cv_detectavel && <span style={{ background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>CV detectável</span>}
                  {!p.cv_detectavel && <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>CV indetectável</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#6b7280" }}>
                <span>Esquema: <strong style={{ color: "#374151" }}>{p.esquema}</strong></span>
                <span>CD4: <strong style={{ color: p.cd4_atual<200?"#dc2626":p.cd4_atual<500?"#d97706":"#16a34a" }}>{p.cd4_atual} cél/mm³</strong></span>
                <span>Últ. consulta: <strong>{p.ult_consulta}</strong></span>
                <span>Próx. consulta: <strong>{p.prox_consulta}</strong></span>
              </div>
              {p.alerta && (
                <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {p.alerta}</div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        Protocolo PCDT HIV/AIDS 2022: esquema preferencial TDF+3TC+DTG. Meta 95-95-95 UNAIDS: 95% diagnosticados, 95% em TARV, 95% com CV indetectável. SAE Apuí: funciona no mesmo espaço da UBS Central (pactuado CIR).
      </div>
    </div>
  );
}

function AbaPrEP({ prep }: { prep: any }) {
  if (!prep) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[["PrEP ativos", prep.usuarios_prep_ativos, "#7c3aed"],["Novas iniciações 2026", prep.novas_iniciaciones_2026, "#1d4ed8"],["Adesão PrEP", prep.adesao_pct+"%", "#16a34a"],["PEP 2026", prep.profilaxia_pep_2026, "#d97706"]].map(([k,v,c])=>(
          <div key={String(k)} style={{ background: "#fff", border:`1px solid ${c}22`, borderTop:`3px solid ${c}`, borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: String(c) }}>{v}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Informações PrEP / PEP</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
          {[
            ["PrEP disponível na UBS", prep.prep_disponivel ? "Sim ✓" : "Não", prep.prep_disponivel?"#16a34a":"#dc2626"],
            ["Esquema PrEP", "TDF+FTC (Truvada genérico)", "#374151"],
            ["PEP (pós-exposição)", "TDF+3TC+DTG por 28 dias — dispensar até 72h", "#374151"],
            ["Testagem vinculada", "HIV + Sífilis + Hepatites B/C a cada 3 meses", "#374151"],
          ].map(([k,v,c])=>(
            <div key={String(k)} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: 8 }}>
              <span style={{ color: "#6b7280" }}>{k}</span>
              <span style={{ fontWeight: 600, color: String(c) }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type Aba = "dashboard"|"indicadores"|"hiv"|"prep";

export default function IstHiv() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash }      = useQuery({ queryKey: ["ist-dash"],  queryFn: () => apiGet("/api/ist-hiv/dashboard")     as Promise<any> });
  const { data: testagem }  = useQuery({ queryKey: ["ist-test"],  queryFn: () => apiGet("/api/ist-hiv/testagem")      as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: inds }      = useQuery({ queryKey: ["ist-ind"],   queryFn: () => apiGet("/api/ist-hiv/indicadores")   as Promise<any[]>, enabled: aba==="indicadores" });
  const { data: pacHIV }    = useQuery({ queryKey: ["ist-hiv"],   queryFn: () => apiGet("/api/ist-hiv/hiv-pacientes") as Promise<any[]>, enabled: aba==="hiv" });
  const { data: prep }      = useQuery({ queryKey: ["ist-prep"],  queryFn: () => apiGet("/api/ist-hiv/prep")          as Promise<any>,   enabled: aba==="prep" });

  const dashFull = dash && testagem ? { ...dash, historico_testagem: testagem } : null;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "indicadores", label: `Indicadores IST (${(dash as any)?.indicadores_criticos ?? 0} críticos)` },
    { id: "hiv",         label: `HIV/TARV (${(dash as any)?.hiv_em_tarv ?? 0})` },
    { id: "prep",        label: "PrEP / PEP" },
  ];

  return (
    <div style={{ background: "#fff", padding: "20px 24px 32px" }}>
      <div style={{ style_SIAPS_PLACEHOLDER }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>IST / HIV / AIDS</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>DIAHV · SAE · Testagem · PrEP · PEP · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{(dash as any).sifilis_congenita_2026}</div>
              <div style={{ fontSize: 10, opacity: .8 }}>síf. congênita 2026</div>
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
        {aba==="dashboard"   && <AbaDashboard dash={dashFull}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
        {aba==="hiv"         && <AbaPacientesHIV pacientes={pacHIV}/>}
        {aba==="prep"        && <AbaPrEP prep={prep}/>}
      </div>
    </div>
  );
}
