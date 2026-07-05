import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Eye, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const CTRL_COR: Record<string, string> = { sim: "#16a34a", parcial: "#d97706", nao: "#dc2626", monitoramento: "#6b7280" };
const SIT_COR: Record<string, string> = { "lista espera": "#dc2626", "acompanhamento": "#16a34a" };

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Triagens/mês"       value={dash.triagens_mes}                    sub={`${dash.alteracoes_pct}% com alteração`}     cor="#374151"                              icon={<Eye size={14} color="#374151"/>}/>
        <KpiCard label="Encaminhamentos"    value={dash.encaminhamentos_oftalmologia}     sub="Para oftalmologista"                         cor="#1d4ed8"                              icon={<Eye size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Fila catarata"      value={dash.lista_espera_cirurgia_catarata}   sub="cirurgia pendente"                           cor={STATUS_COR[dash.lista_espera_status]} icon={<Clock size={14} color={STATUS_COR[dash.lista_espera_status]}/>}/>
        <KpiCard label="Glaucoma acomp."    value={dash.glaucoma_acompanhados}            sub="PO monitorada"                              cor="#7c3aed"                              icon={<CheckCircle size={14} color="#7c3aed"/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Triagem ocular — 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="triagens"           name="Triagens"              fill="#374151" radius={[4,4,0,0]}/>
                <Bar dataKey="suspeita_catarata"  name="Suspeita catarata"     fill="#d97706" radius={[4,4,0,0]}/>
                <Bar dataKey="suspeita_glaucoma"  name="Suspeita glaucoma"     fill="#7c3aed" radius={[4,4,0,0]}/>
                <Bar dataKey="encaminhados"       name="Encaminhados"          fill="#1d4ed8" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaCatarata({ casos }: { casos: any[] | undefined }) {
  if (!casos) return null;
  return (
    <div>
      <div style={{ marginBottom: 14, padding: "10px 14px", background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca", fontSize: 12, color: "#dc2626" }}>
        ⚠ {casos.filter(c=>c.situacao==="lista espera").length} paciente(s) aguardando cirurgia de catarata — espera média 6.2 meses
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {casos.map(c => {
          const cor = SIT_COR[c.situacao] ?? "#374151";
          return (
            <div key={c.id} style={{ background: "#fff", border: `1px solid ${c.alerta?"#dc262222":"#e5e7eb"}`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{c.id}</span>
                  <span style={{ marginLeft: 8, fontSize: 12 }}>{c.olho} — {c.grau}</span>
                </div>
                <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{c.situacao}</span>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280" }}>
                <span>AV OD: <strong style={{ color: parseFloat(c.acuidade_vd)<0.2?"#dc2626":"#374151" }}>{c.acuidade_vd}</strong></span>
                <span>AV OE: <strong style={{ color: parseFloat(c.acuidade_ve)<0.2?"#dc2626":"#374151" }}>{c.acuidade_ve}</strong></span>
                <span>Indicação: <strong>{c.indicacao}</strong></span>
                {c.aguardando_meses>0 && <span>Espera: <strong style={{ color: c.aguardando_meses>6?"#dc2626":"#d97706" }}>{c.aguardando_meses} meses</strong></span>}
              </div>
              {c.alerta && <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {c.alerta}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaGlaucoma({ casos }: { casos: any[] | undefined }) {
  if (!casos) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {casos.map(c => {
          const cor = CTRL_COR[c.controle];
          return (
            <div key={c.id} style={{ background: "#fff", border: `1px solid ${c.alerta?"#dc262222":"#e5e7eb"}`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{c.id}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#374151" }}>{c.tipo}</span>
                </div>
                <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{c.controle==="sim"?"Controlado":c.controle==="parcial"?"Parcial":c.controle==="monitoramento"?"Monitoramento":"Não controlado"}</span>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280" }}>
                <span>PO OD: <strong style={{ color: c.po_mmhg_od>21?"#dc2626":"#374151" }}>{c.po_mmhg_od} mmHg</strong></span>
                <span>PO OE: <strong style={{ color: c.po_mmhg_oe>21?"#dc2626":"#374151" }}>{c.po_mmhg_oe} mmHg</strong></span>
                <span>Medicação: <strong>{c.medicacao}</strong></span>
                <span>Consulta: <strong>{c.consulta_dias} dias</strong></span>
              </div>
              {c.alerta && <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {c.alerta}</div>}
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
                {ind.meta && typeof ind.valor==="number" && !ind.invertido && (
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

type Aba = "dashboard"|"catarata"|"glaucoma"|"indicadores";

export default function SaudeOcular() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash } = useQuery({ queryKey: ["oc-dash"], queryFn: () => apiGet("/api/saude-ocular/dashboard")   as Promise<any> });
  const { data: hist } = useQuery({ queryKey: ["oc-hist"], queryFn: () => apiGet("/api/saude-ocular/triagens")    as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: cat  } = useQuery({ queryKey: ["oc-cat"],  queryFn: () => apiGet("/api/saude-ocular/catarata")   as Promise<any[]>, enabled: aba==="catarata" });
  const { data: glc  } = useQuery({ queryKey: ["oc-glc"],  queryFn: () => apiGet("/api/saude-ocular/glaucoma")   as Promise<any[]>, enabled: aba==="glaucoma" });
  const { data: inds } = useQuery({ queryKey: ["oc-ind"],  queryFn: () => apiGet("/api/saude-ocular/indicadores") as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "catarata",    label: `Catarata (${dashRaw?.lista_espera_cirurgia_catarata ?? 0} na fila)` },
    { id: "glaucoma",    label: `Glaucoma (${dashRaw?.glaucoma_acompanhados ?? 0} acomp.)` },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#0c4a6e 0%,#0369a1 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Saúde Ocular</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Triagem visual · Catarata · Glaucoma · Óculos SUS · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.triagens_mes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>triagens/mês</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: dashRaw.lista_espera_cirurgia_catarata>20?"#fbbf24":"#fff" }}>{dashRaw.lista_espera_cirurgia_catarata}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>fila catarata</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e0f2fe" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #0369a1":"2px solid transparent", color: aba===a.id?"#0369a1":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="catarata"    && <AbaCatarata casos={cat}/>}
        {aba==="glaucoma"    && <AbaGlaucoma casos={glc}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
