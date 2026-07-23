import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Cell } from "recharts";
import { Monitor, CheckCircle, AlertTriangle, Globe } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const SYS_COR: Record<string, string>   = { online: "#16a34a", atencao: "#d97706", offline: "#dc2626" };

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
      {dash.alertas_integracao > 0 && (
        <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
          <strong>⚠ {dash.alertas_integracao} alerta(s) de integração</strong> — GAL-PEC sem integração automática + CDS Matupi com backlog.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Cobertura PEC"        value={dash.cobertura_pec_pct+"%"}          sub={`meta: ${dash.meta_pec_pct}%`}                          cor={dash.cobertura_pec_pct>=95?"#16a34a":"#d97706"} icon={<Monitor size={14} color={dash.cobertura_pec_pct>=95?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Envios RNDS"          value={dash.envios_rnds_sucesso_pct+"%"}    sub={`${dash.registros_rnds_mes.toLocaleString("pt-BR")} reg./mês`} cor={dash.envios_rnds_sucesso_pct>=98?"#16a34a":"#d97706"} icon={<Globe size={14} color={dash.envios_rnds_sucesso_pct>=98?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Fichas digitais"      value={dash.fichas_digitais_pct+"%"}        sub="sem papel"                                              cor={dash.fichas_digitais_pct>=90?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={dash.fichas_digitais_pct>=90?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Sync pendentes"       value={dash.sincronizacoes_pendentes}       sub="CDS Matupi"                                             cor={dash.sincronizacoes_pendentes>50?"#d97706":"#16a34a"} icon={<AlertTriangle size={14} color={dash.sincronizacoes_pendentes>50?"#d97706":"#16a34a"}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Saúde digital — evolução 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }} unit="%"/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }}/>
                <Tooltip contentStyle={TT}/>
                <Line yAxisId="l" type="monotone" dataKey="pec_cobertura"   stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 3 }} name="PEC cobertura (%)"/>
                <Line yAxisId="l" type="monotone" dataKey="fichas_digitais" stroke="#7c3aed" strokeWidth={1.5} dot={false}   name="Fichas digitais (%)"/>
                <Line yAxisId="l" type="monotone" dataKey="sucesso_pct"     stroke="#16a34a" strokeWidth={1.5} dot={{ r: 3 }} name="Sucesso RNDS (%)"/>
                <Line yAxisId="r" type="monotone" dataKey="registros_rnds"  stroke="#374151" strokeWidth={1}   dot={false}   name="Registros RNDS" strokeDasharray="3 2"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaSistemas({ sistemas }: { sistemas: any[] | undefined }) {
  if (!sistemas) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {sistemas.map(s => {
          const cor = SYS_COR[s.status];
          return (
            <div key={s.sistema} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "11px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{s.sistema}</span>
                  <span style={{ marginLeft: 8, fontSize: 11, color: "#9ca3af" }}>v{s.versao}</span>
                  <span style={{ marginLeft: 6, fontSize: 11, color: "#6b7280" }}>{s.cobertura}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {s.sync_pendentes > 0 && (
                    <span style={{ background: "#fef9c3", color: "#92400e", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{s.sync_pendentes} pend.</span>
                  )}
                  <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                    {s.status === "online" ? "● Online" : s.status === "atencao" ? "● Atenção" : "● Offline"}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>
                Uptime: <strong style={{ color: s.uptime_pct >= 99 ? "#16a34a" : s.uptime_pct >= 95 ? "#d97706" : "#dc2626" }}>{s.uptime_pct}%</strong>
                {" · "}Última sync: {s.ultima_sync}
              </div>
              {s.observacao && <div style={{ marginTop: 4, background: "#fef9c3", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#92400e" }}>⚠ {s.observacao}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaRNDS({ rnds }: { rnds: any | undefined }) {
  if (!rnds) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#374151" }}>{rnds.registros_mes.toLocaleString("pt-BR")}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>registros/mês</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#16a34a" }}>{rnds.sucesso_pct}%</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>sucesso</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#dc2626" }}>{rnds.erros_pct}%</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>erros</div>
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Envios por tipo de registro</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rnds.por_tipo.map((t: any) => (
            <div key={t.tipo} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 12, width: 230, flexShrink: 0 }}>{t.tipo}</div>
              <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 6, height: 10 }}>
                <div style={{ background: t.pct >= 95 ? "#16a34a" : "#d97706", height: "100%", width: `${t.pct}%`, borderRadius: 6 }}/>
              </div>
              <div style={{ fontSize: 11, width: 80, textAlign: "right", color: t.pct >= 95 ? "#16a34a" : "#d97706", fontWeight: 700 }}>{t.pct}% ({t.sucesso}/{t.enviados})</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Principais erros de integração</div>
        {rnds.erros_principais.map((e: any) => (
          <div key={e.erro} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6", fontSize: 12 }}>
            <span>{e.erro}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: "#6b7280", fontSize: 11 }}>{e.tipo}</span>
              <strong style={{ color: "#dc2626" }}>{e.ocorrencias}x</strong>
            </div>
          </div>
        ))}
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ind.meta && ind.unidade==="%"?6:0 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                    {ind.observacao && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{ind.observacao}</div>}
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade==="%"?"%":""}</span>
                    {ind.meta && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade==="%"?"%":""}</span>}
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

type Aba = "dashboard"|"sistemas"|"rnds"|"indicadores";

export default function SaudeDigital() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash    } = useQuery({ queryKey: ["sd-dash"],  queryFn: () => apiGet("/api/saude-digital/dashboard")    as Promise<any> });
  const { data: hist    } = useQuery({ queryKey: ["sd-hist"],  queryFn: () => apiGet("/api/saude-digital/historico")    as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: sists   } = useQuery({ queryKey: ["sd-sys"],   queryFn: () => apiGet("/api/saude-digital/sistemas")     as Promise<any[]>, enabled: aba==="sistemas" });
  const { data: rnds    } = useQuery({ queryKey: ["sd-rnds"],  queryFn: () => apiGet("/api/saude-digital/rnds")         as Promise<any>,   enabled: aba==="rnds" });
  const { data: inds    } = useQuery({ queryKey: ["sd-ind"],   queryFn: () => apiGet("/api/saude-digital/indicadores")  as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",  label: "Dashboard" },
    { id: "sistemas",   label: `Sistemas (${dashRaw?.alertas_integracao ?? 0} alertas)` },
    { id: "rnds",       label: `RNDS (${dashRaw?.registros_rnds_mes?.toLocaleString("pt-BR") ?? 0})` },
    { id: "indicadores",label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Saúde Digital</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>e-SUS PEC · RNDS · Prontuário Eletrônico · Interoperabilidade · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{dashRaw.registros_rnds_mes.toLocaleString("pt-BR")}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>registros RNDS/mês</div>
              </div>
              <div style={{ background: dashRaw.alertas_integracao > 0 ? "rgba(255,200,50,.3)" : "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.cobertura_pec_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>cobertura PEC</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #0891b2":"2px solid transparent", color: aba===a.id?"#0891b2":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"  && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="sistemas"   && <AbaSistemas sistemas={sists}/>}
        {aba==="rnds"       && <AbaRNDS rnds={rnds}/>}
        {aba==="indicadores"&& <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
