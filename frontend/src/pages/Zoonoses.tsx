import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Bug, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#e4e7ec", border: "none", borderRadius: 6, color: "#f8fafc" };
const ST_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const GRAV_COR: Record<string, string> = { leve: "#16a34a", moderado: "#d97706", grave: "#dc2626" };

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
      {dash.cobertura_raiva_pct < 95 && (
        <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
          <strong>⚠ Cobertura antirrábica canina: {dash.cobertura_raiva_pct}%</strong> — meta 95%. Foco potencial em São Francisco. Risco de circulação viral.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Ofidismo/mês"     value={dash.acidentes_ofidicos_mes}       sub="acidentes com serpentes"          cor="#d97706" icon={<Bug size={14} color="#d97706"/>}/>
        <KpiCard label="Escorpionismo/mês"value={dash.acidentes_escorpionismo_mes}  sub="Tityus obscurus"                  cor="#374151" icon={<AlertTriangle size={14} color="#374151"/>}/>
        <KpiCard label="Cobertura raiva"  value={dash.cobertura_raiva_pct+"%"}      sub={`meta: ${dash.meta_raiva_pct}%`}  cor={dash.cobertura_raiva_pct>=95?"#16a34a":"#dc2626"} icon={<Shield size={14} color={dash.cobertura_raiva_pct>=95?"#16a34a":"#dc2626"}/>}/>
        <KpiCard label="Leptospirose"     value={dash.leptospirose_casos_mes}       sub="casos no mês"                     cor={dash.leptospirose_casos_mes===0?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={dash.leptospirose_casos_mes===0?"#16a34a":"#d97706"}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Acidentes — 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="ofidismo"      name="Ofidismo"      fill="#d97706" radius={[4,4,0,0]} stackId="a"/>
                <Bar dataKey="escorpionismo" name="Escorpionismo" fill="#dc2626" radius={[0,0,0,0]} stackId="a"/>
                <Bar dataKey="araneismo"     name="Araneismo"     fill="#374151" radius={[0,0,0,0]} stackId="a"/>
                <Bar dataKey="leptospirose"  name="Leptospirose"  fill="#1d4ed8" radius={[0,0,4,4]} stackId="a"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaAcidentes({ acidentes }: { acidentes: any[] | undefined }) {
  if (!acidentes) return null;
  return (
    <div>
      {acidentes.map(a => {
        const cor = ST_COR[a.status];
        return (
          <div key={a.tipo} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "14px 18px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{a.tipo}</span>
                <span style={{ marginLeft: 8, fontSize: 11, color: "#9ca3af" }}>{a.especie_principal}</span>
              </div>
              <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{a.status==="ok"?"● Controlado":"● Atenção"}</span>
            </div>
            <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#374151", marginBottom: 8, flexWrap: "wrap" as const }}>
              <span>Casos/mês: <strong>{a.casos_mes}</strong></span>
              <span>Graves: <strong style={{ color: a.casos_graves>0?"#dc2626":"#16a34a" }}>{a.casos_graves}</strong></span>
              <span>Óbitos: <strong style={{ color: a.obitos>0?"#dc2626":"#16a34a" }}>{a.obitos}</strong></span>
              {a.soro_disponivel !== null && (
                <span>Soro: <strong style={{ color: a.soro_disponivel?"#16a34a":"#dc2626" }}>{a.soro_disponivel?"Disponível":"Sem estoque"}</strong>{a.doses_soro && ` (${a.doses_soro} doses)`}</span>
              )}
              {a.tempo_atend_medio_h && (
                <span>Tempo atend.: <strong style={{ color: a.tempo_atend_medio_h<=a.meta_tempo_h?"#16a34a":"#dc2626" }}>{a.tempo_atend_medio_h}h</strong> (meta: {a.meta_tempo_h}h)</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>Locais: {a.locais_ocorrencia.join(" · ")}</div>
          </div>
        );
      })}
    </div>
  );
}

function AbaRaiva({ raiva }: { raiva: any | undefined }) {
  if (!raiva) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Cães — Cobertura antirrábica</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: raiva.cobertura_pct>=95?"#16a34a":"#dc2626" }}>{raiva.cobertura_pct}%</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>{raiva.vacinados_campanha.toLocaleString("pt-BR")} / {raiva.total_caes_estimado.toLocaleString("pt-BR")} cães</div>
          <div style={{ background: "#f3f4f6", borderRadius: 6, height: 10, marginBottom: 4 }}>
            <div style={{ background: raiva.cobertura_pct>=95?"#16a34a":"#dc2626", height: "100%", width: `${raiva.cobertura_pct}%`, borderRadius: 6 }}/>
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Meta: 95% (OMS / PNRH)</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Gatos — Cobertura antirrábica</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: raiva.cobertura_felina_pct>=80?"#16a34a":"#d97706" }}>{raiva.cobertura_felina_pct}%</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>{raiva.gatos_vacinados} / {raiva.total_gatos_estimado} gatos</div>
          <div style={{ background: "#f3f4f6", borderRadius: 6, height: 10, marginBottom: 4 }}>
            <div style={{ background: raiva.cobertura_felina_pct>=80?"#16a34a":"#d97706", height: "100%", width: `${raiva.cobertura_felina_pct}%`, borderRadius: 6 }}/>
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Meta estadual: 80%</div>
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Pontos de vacinação — cobertura por local</div>
        {raiva.pontos_vacinacao.map((p: any) => {
          const cor = ST_COR[p.status];
          return (
            <div key={p.local} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 12, width: 180, flexShrink: 0 }}>{p.local}</div>
              <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 6, height: 10 }}>
                <div style={{ background: cor, height: "100%", width: `${Math.min(100,Math.round(p.vacinados/(raiva.total_caes_estimado/6)*100))}%`, borderRadius: 6 }}/>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, width: 60, textAlign: "right", color: cor }}>{p.vacinados}</div>
            </div>
          );
        })}
        {raiva.observacao_focos && <div style={{ marginTop: 10, background: "#fef2f2", borderRadius: 6, padding: "8px 12px", fontSize: 11, color: "#dc2626" }}>⚠ {raiva.observacao_focos}</div>}
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
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade==="%"?"%":ind.unidade==="h"?"h":""}</span>
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

type Aba = "dashboard"|"acidentes"|"raiva"|"indicadores";

export default function Zoonoses() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash  } = useQuery({ queryKey: ["zoo-dash"],  queryFn: () => apiGet("/api/zoonoses/dashboard")   as Promise<any> });
  const { data: hist  } = useQuery({ queryKey: ["zoo-hist"],  queryFn: () => apiGet("/api/zoonoses/historico")   as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: acid  } = useQuery({ queryKey: ["zoo-acid"],  queryFn: () => apiGet("/api/zoonoses/acidentes")   as Promise<any[]>, enabled: aba==="acidentes" });
  const { data: raiva } = useQuery({ queryKey: ["zoo-raiv"],  queryFn: () => apiGet("/api/zoonoses/raiva")       as Promise<any>,   enabled: aba==="raiva" });
  const { data: inds  } = useQuery({ queryKey: ["zoo-ind"],   queryFn: () => apiGet("/api/zoonoses/indicadores") as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "acidentes",   label: `Acidentes (${dashRaw ? dashRaw.acidentes_ofidicos_mes+dashRaw.acidentes_escorpionismo_mes+dashRaw.acidentes_araneismo_mes : 0})` },
    { id: "raiva",       label: `Raiva (${dashRaw?.cobertura_raiva_pct ?? 0}% cob.)` },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ background: "#fff", padding: "20px 24px 32px" }}>
      <div style={{ style_SIAPS_PLACEHOLDER }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Controle de Zoonoses</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Raiva · Ofidismo · Escorpionismo · Leptospirose · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.acidentes_ofidicos_mes + dashRaw.acidentes_escorpionismo_mes + dashRaw.acidentes_araneismo_mes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>acidentes/mês</div>
              </div>
              <div style={{ background: dashRaw.cobertura_raiva_pct<95?"rgba(255,200,50,.3)":"rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.cobertura_raiva_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>cobertura antirrábica</div>
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
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="acidentes"   && <AbaAcidentes acidentes={acid}/>}
        {aba==="raiva"       && <AbaRaiva raiva={raiva}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
