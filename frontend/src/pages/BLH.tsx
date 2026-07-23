import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Droplets, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#e4e7ec", border: "none", borderRadius: 6, color: "#f8fafc" };
const ST_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };

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
        <KpiCard label="Coletado/mês"       value={`${(dash.coleta_ml_mes/1000).toFixed(1)}L`}       sub={`${dash.doadores_ativas} doadoras ativas`}               cor="#374151"    icon={<Droplets size={14} color="#374151"/>}/>
        <KpiCard label="Pasteurizado/mês"   value={`${(dash.pasteurizado_ml_mes/1000).toFixed(1)}L`} sub={`${dash.reprovados_pasteurizado_pct}% reprovados`}         cor={dash.reprovados_pasteurizado_pct<=3?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={dash.reprovados_pasteurizado_pct<=3?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="RN beneficiados"    value={dash.rn_beneficiados_mes}                         sub={`${dash.rn_prematuros_beneficiados} prematuros`}           cor="#1d4ed8"    icon={<TrendingUp size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Doadoras ativas"    value={dash.doadores_ativas}                             sub={`meta: 30 · total cad.: ${dash.doadores_cadastradas_total}`} cor={dash.doadores_ativas>=30?"#16a34a":"#d97706"} icon={<AlertTriangle size={14} color={dash.doadores_ativas>=30?"#16a34a":"#d97706"}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>BLH — evolução 6 meses (mL)</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 9 }} tickFormatter={v => `${(v/1000).toFixed(0)}L`}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }}/>
                <Tooltip contentStyle={TT} formatter={(v: any) => `${v.toLocaleString("pt-BR")} mL`}/>
                <Bar yAxisId="l" dataKey="coletado"      name="Coletado"       fill="#0891b2" radius={[4,4,0,0]}/>
                <Bar yAxisId="l" dataKey="pasteurizado"  name="Pasteurizado"   fill="#1d4ed8" radius={[4,4,0,0]}/>
                <Bar yAxisId="l" dataKey="distribuido"   name="Distribuído"    fill="#16a34a" radius={[4,4,0,0]}/>
                <Line yAxisId="r" type="monotone" dataKey="rn_beneficiados" name="RN benef." stroke="#d97706" strokeWidth={2} dot={{ r: 3 }}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaColeta({ coleta }: { coleta: any | undefined }) {
  if (!coleta) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Por tipo de coleta</div>
          {coleta.por_tipo.map((t: any) => (
            <div key={t.tipo} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span>{t.tipo}</span>
                <span style={{ fontWeight: 700 }}>{(t.volume_ml/1000).toFixed(1)}L · {t.doadoras} doadoras</span>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 10 }}>
                <div style={{ background: "#0891b2", height: "100%", width: `${t.pct}%`, borderRadius: 6 }}/>
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af", textAlign: "right", marginTop: 2 }}>{t.pct}%</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Por município de origem</div>
          {coleta.por_municipio_origem.map((m: any) => (
            <div key={m.municipio} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f3f4f6", fontSize: 12 }}>
              <span>{m.municipio}</span>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ color: "#6b7280" }}>{m.doadoras} doadoras</span>
                <strong>{(m.volume_ml/1000).toFixed(1)}L</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Coleta semanal — mês atual</div>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={coleta.doacoes_coleta_mensal} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="semana" tick={{ fontSize: 10 }}/>
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v/1000).toFixed(1)}L`}/>
              <Tooltip contentStyle={TT} formatter={(v: any) => `${v.toLocaleString("pt-BR")} mL`}/>
              <Bar dataKey="hospitalar" name="Hospitalar" fill="#1d4ed8" stackId="a" radius={[0,0,4,4]}/>
              <Bar dataKey="domiciliar" name="Domiciliar" fill="#0891b2" stackId="a" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AbaPasteurizacao({ past }: { past: any | undefined }) {
  if (!past) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#374151" }}>{past.lotes_mes}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>lotes no mês</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#16a34a" }}>{past.aprovados}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>aprovados</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: past.reprovados>0?"#dc2626":"#16a34a" }}>{past.reprovados}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>reprovados ({past.reprovado_pct}%)</div>
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Lotes — resultado pasteurização</div>
        {past.lotes_detalhe.map((l: any) => {
          const reprovado = l.resultado === "Reprovado";
          const cor = reprovado ? "#dc2626" : "#16a34a";
          return (
            <div key={l.lote} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 6, marginBottom: 4, background: reprovado?"#fff5f5":"#f9fafb", border: `1px solid ${cor}22` }}>
              <div>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{l.lote}</span>
                <span style={{ marginLeft: 10, fontSize: 12 }}>{l.volume_ml} mL</span>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
                <span>Acidez: <strong>{l.acidez}°D</strong></span>
                <span>Crem.: <strong>{l.crematocrito}%</strong></span>
                <span style={{ background: cor+"15", color: cor, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{l.resultado}</span>
              </div>
              {reprovado && <div style={{ fontSize: 11, color: "#dc2626", marginLeft: 8 }}>{l.motivo}</div>}
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
        const cor = ST_COR[nivel];
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
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{typeof ind.valor==="number"?ind.valor.toLocaleString("pt-BR"):ind.valor}{ind.unidade==="%"?"%":ind.unidade==="°D"?"°D":ind.unidade==="mL"?" mL":""}</span>
                    {ind.meta !== null && ind.meta !== undefined && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade==="%"?"%":""}</span>}
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

type Aba = "dashboard"|"coleta"|"pasteurizacao"|"indicadores";

export default function BLH() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["blh-dash"],  queryFn: () => apiGet("/api/blh/dashboard")       as Promise<any> });
  const { data: hist  } = useQuery({ queryKey: ["blh-hist"],  queryFn: () => apiGet("/api/blh/historico")       as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: col   } = useQuery({ queryKey: ["blh-col"],   queryFn: () => apiGet("/api/blh/coleta")          as Promise<any>,   enabled: aba==="coleta" });
  const { data: past  } = useQuery({ queryKey: ["blh-past"],  queryFn: () => apiGet("/api/blh/pasteurizacao")   as Promise<any>,   enabled: aba==="pasteurizacao" });
  const { data: inds  } = useQuery({ queryKey: ["blh-ind"],   queryFn: () => apiGet("/api/blh/indicadores")     as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",     label: "Dashboard" },
    { id: "coleta",        label: `Coleta (${dashRaw?.doadores_ativas ?? 0} doadoras)` },
    { id: "pasteurizacao", label: `Pasteurização` },
    { id: "indicadores",   label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ style_SIAPS_PLACEHOLDER }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Banco de Leite Humano</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Coleta · Pasteurização · UTIN/Maternidade · RDC 171/2006 · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{(dashRaw.coleta_ml_mes/1000).toFixed(1)}L</div>
                <div style={{ fontSize: 10, opacity: .8 }}>coletados/mês</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.rn_beneficiados_mes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>RN beneficiados</div>
              </div>
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
        {aba==="dashboard"     && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="coleta"        && <AbaColeta coleta={col}/>}
        {aba==="pasteurizacao" && <AbaPasteurizacao past={past}/>}
        {aba==="indicadores"   && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
