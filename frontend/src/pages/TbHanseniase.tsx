import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";
import { Activity, AlertTriangle, CheckCircle, Eye } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const SIT_COR: Record<string, string> = { em_tratamento: "#1d4ed8", alta_cura: "#16a34a", abandono: "#dc2626" };
const SIT_LABEL: Record<string, string> = { em_tratamento: "Em tratamento", alta_cura: "Alta/Cura", abandono: "Abandono" };
const GRAD_COR: Record<number, string> = { 0: "#16a34a", 1: "#d97706", 2: "#dc2626" };

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
  const histBar = dash.historico.filter((h: any) => h.ano !== "2026*");
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="TB em tratamento"   value={dash.tb_em_tratamento}  sub="casos ativos 2026"        cor="#1d4ed8" icon={<Activity size={14} color="#1d4ed8"/>}/>
        <KpiCard label="TB com alerta"      value={dash.tb_alertas}        sub="abandono / BK 2m +"        cor={dash.tb_alertas>0?"#dc2626":"#16a34a"} icon={<AlertTriangle size={14} color={dash.tb_alertas>0?"#dc2626":"#16a34a"}/>}/>
        <KpiCard label="TDO adesão"         value={dash.tb_tdo_adesao_pct+"%"} sub="tratamento observado" cor={dash.tb_tdo_adesao_pct>=80?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={dash.tb_tdo_adesao_pct>=80?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Hanseníase ativ."   value={dash.hans_em_tratamento} sub="casos em PQT"            cor="#7c3aed" icon={<Eye size={14} color="#7c3aed"/>}/>
        <KpiCard label="Coef. Hans. 2025"   value={dash.coef_hans_2025}    sub="/100 mil hab. (>10=alto)" cor={dash.coef_hans_2025>10?"#dc2626":"#16a34a"} icon={<Activity size={14} color={dash.coef_hans_2025>10?"#dc2626":"#16a34a"}/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Casos TB — histórico anual</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histBar} barSize={30}>
                <XAxis dataKey="ano" tick={{ fontSize: 10 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="tb_casos" name="Casos TB" fill="#1d4ed8" radius={[4,4,0,0]}>
                  {histBar.map((_: any, i: number) => <Cell key={i} fill={i===histBar.length-1?"#d97706":"#1d4ed8"}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Coeficiente hanseníase — histórico</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={histBar}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="ano" tick={{ fontSize: 10 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Line type="monotone" dataKey="coef_hans" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4 }} name="Coef./100mil"/>
                <Line type="monotone" dataKey="hans_casos" stroke="#ec4899" strokeWidth={1.5} dot={false} name="Casos"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbaTB({ casos }: { casos: any[] | undefined }) {
  if (!casos) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {casos.map(c => {
          const cor = SIT_COR[c.situacao] || "#6b7280";
          return (
            <div key={c.id} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{c.codigo} — TB {c.forma}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{SIT_LABEL[c.situacao]}</span>
                  {c.tdo && <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>TDO ✓</span>}
                  {!c.tdo && c.situacao==="em_tratamento" && <span style={{ background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>Sem TDO</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#6b7280" }}>
                <span>Esquema: <strong style={{ color: "#374151" }}>{c.esquema}</strong></span>
                <span>Início: <strong>{c.mes_inicio}</strong></span>
                <span>Prev. alta: <strong>{c.mes_prev_alta}</strong></span>
                <span>BK: <strong style={{ color: c.resultado_bk==="positivo"?"#d97706":"#16a34a" }}>{c.resultado_bk}</strong></span>
                <span>BK 2m: <strong style={{ color: c.baciloscopia_2m==="positivo"?"#dc2626":c.baciloscopia_2m==="negativo"?"#16a34a":"#9ca3af" }}>{c.baciloscopia_2m||"—"}</strong></span>
                <span>Contatos exam: <strong>{c.contatos_examinados}/{c.contatos_total}</strong></span>
              </div>
              {c.alerta && (
                <div style={{ marginTop: 6, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {c.alerta}</div>
              )}
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Notificante: {c.notificante}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        Protocolo PNCT: esquema RHZE (rifampicina + isoniazida + pirazinamida + etambutol) por 6 meses. TDO obrigatório. Baciloscopia de controle nos meses 2, 4 e 6. Notificação compulsória SINAN em 24h.
      </div>
    </div>
  );
}

function AbaHanseniase({ casos }: { casos: any[] | undefined }) {
  if (!casos) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {casos.map(c => {
          const grauCor = GRAD_COR[c.grau_incapacidade_atual] || "#9ca3af";
          const statusCor = c.status === "em_tratamento" ? "#1d4ed8" : "#16a34a";
          return (
            <div key={c.id} style={{ background: "#fff", border: `1px solid ${statusCor}22`, borderLeft: `4px solid ${statusCor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{c.codigo} — {c.forma} ({c.classificacao})</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ background: statusCor+"15", color: statusCor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{c.status==="em_tratamento"?"Em tratamento":"Alta/Cura"}</span>
                  <span style={{ background: grauCor+"15", color: grauCor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>Grau {c.grau_incapacidade_atual}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#6b7280" }}>
                <span>Esquema: <strong style={{ color: "#374151" }}>{c.esquema}</strong></span>
                <span>Início: <strong>{c.mes_inicio}</strong></span>
                <span>Duração: <strong>{c.duracao_prevista}</strong></span>
                <span>Contatos exam: <strong>{c.exames_contatos}</strong></span>
                <span>Grau inicial: <strong style={{ color: GRAD_COR[c.grau_incapacidade_inicial] }}>{c.grau_incapacidade_inicial}</strong></span>
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Notificante: {c.notificante}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14, background: "#faf5ff", border: "1px solid #d8b4fe", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        PQT-PB: 6 doses (6 meses). PQT-MB: 12 doses (12 meses). Grau de incapacidade: 0=sem incapacidade, 1=diminuição da sensibilidade, 2=incapacidade visível. Coeficiente ≥ 10/100 mil = hiperendêmico. Apuí/AM: 19/100 mil (2025).
      </div>
    </div>
  );
}

type Aba = "dashboard"|"tb"|"hanseniase";

export default function TbHanseniase() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash }    = useQuery({ queryKey: ["tbh-dash"],  queryFn: () => apiGet("/api/tb-hanseniase/dashboard")  as Promise<any> });
  const { data: hist }    = useQuery({ queryKey: ["tbh-hist"],  queryFn: () => apiGet("/api/tb-hanseniase/historico")  as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: tb }      = useQuery({ queryKey: ["tbh-tb"],    queryFn: () => apiGet("/api/tb-hanseniase/tuberculose") as Promise<any[]>, enabled: aba==="tb" });
  const { data: hans }    = useQuery({ queryKey: ["tbh-hans"],  queryFn: () => apiGet("/api/tb-hanseniase/hanseniase") as Promise<any[]>, enabled: aba==="hanseniase" });

  const dashFull = dash && hist ? { ...dash, historico: hist } : null;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",  label: "Dashboard" },
    { id: "tb",         label: `Tuberculose (${(dash as any)?.tb_em_tratamento ?? 0} ativos)` },
    { id: "hanseniase", label: `Hanseníase (${(dash as any)?.hans_em_tratamento ?? 0} ativos)` },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Tuberculose e Hanseníase</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>PNCT · PNCH · TDO · SINAN · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display:"flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{(dash as any).tb_em_tratamento}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>TB ativos</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{(dash as any).hans_em_tratamento}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>Hans. ativos</div>
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
        {aba==="dashboard" && !dashFull && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba==="dashboard"  && <AbaDashboard dash={dashFull}/>}
        {aba==="tb"         && <AbaTB casos={tb}/>}
        {aba==="hanseniase" && <AbaHanseniase casos={hans}/>}
      </div>
    </div>
  );
}
