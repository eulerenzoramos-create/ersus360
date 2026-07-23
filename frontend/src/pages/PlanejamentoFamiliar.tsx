import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Baby, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#e4e7ec", border: "none", borderRadius: 6, color: "#f8fafc" };
const ST_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const MET_CORES = ["#1d4ed8","#0891b2","#7c3aed","#d97706","#16a34a","#dc2626","#78716c","#0f766e"];

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
      {dash.gestacoes_nao_planejadas_pct > 30 && (
        <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
          <strong>⚠ {dash.gestacoes_nao_planejadas_pct}% das gestações não foram planejadas</strong> — Adolescentes 15–19 anos: principal faixa. Reforçar PSE e distribuição de contraceptivos nas UBS.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Mulheres em método"   value={dash.mulheres_em_metodo_ativo.toLocaleString("pt-BR")} sub={`cobertura: ${dash.cobertura_pct}%`}            cor={dash.cobertura_pct>=80?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={dash.cobertura_pct>=80?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="DIU inseridos/mês"    value={dash.diu_inseridos_mes}                               sub="método de longa duração"                         cor="#7c3aed"   icon={<Baby size={14} color="#7c3aed"/>}/>
        <KpiCard label="Gestações n/planejadas"value={dash.gestacoes_nao_planejadas_pct+"%"}               sub="meta: ≤25%"                                      cor={dash.gestacoes_nao_planejadas_pct<=25?"#16a34a":"#dc2626"} icon={<AlertTriangle size={14} color={dash.gestacoes_nao_planejadas_pct<=25?"#16a34a":"#dc2626"}/>}/>
        <KpiCard label="Adolesc. em método"   value={dash.adolescentes_em_metodo_pct+"%"}                 sub="meta: 60%"                                       cor={dash.adolescentes_em_metodo_pct>=60?"#16a34a":"#dc2626"} icon={<TrendingDown size={14} color={dash.adolescentes_em_metodo_pct>=60?"#16a34a":"#dc2626"}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Planejamento Familiar — 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="%"/>
                <Tooltip contentStyle={TT}/>
                <Bar yAxisId="l" dataKey="diu"         name="DIU"          fill="#7c3aed" radius={[4,4,0,0]} stackId="a"/>
                <Bar yAxisId="l" dataKey="injetaveis"  name="Injetáveis"   fill="#0891b2" radius={[0,0,0,0]} stackId="a"/>
                <Bar yAxisId="l" dataKey="pilula"      name="Pílula"       fill="#1d4ed8" radius={[0,0,4,4]} stackId="a"/>
                <Line yAxisId="r" type="monotone" dataKey="gestacoes_nao_plan_pct" name="Gest. não plan. %" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaMetodos({ metodos }: { metodos: any[] | undefined }) {
  if (!metodos) return null;
  const total = metodos.reduce((s, m) => s + m.usuarios_ativos, 0);
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Mix de métodos contraceptivos — {total.toLocaleString("pt-BR")} usuárias ativas</div>
        {metodos.map((m, i) => (
          <div key={m.metodo} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>{m.metodo}</span>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ color: "#6b7280" }}>{m.usuarios_ativos} usuárias</span>
                <span style={{ background: "#f0fdf4", color: "#16a34a", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 3 }}>cont. {m.continuidade_pct}%</span>
                <strong style={{ color: MET_CORES[i] }}>{m.pct}%</strong>
              </div>
            </div>
            <div style={{ background: "#f3f4f6", borderRadius: 6, height: 10 }}>
              <div style={{ background: MET_CORES[i], height: "100%", width: `${m.pct * 2}%`, borderRadius: 6 }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AbaFaixaEtaria({ faixas }: { faixas: any[] | undefined }) {
  if (!faixas) return null;
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Uso de contraceptivos e gestações por faixa etária</div>
        {faixas.map(f => {
          const alertaAdolesc = f.faixa.startsWith("10") || f.faixa.startsWith("15");
          return (
            <div key={f.faixa} style={{ marginBottom: 12, background: alertaAdolesc && f.gestantes_nao_planejadas > 10 ? "#fef9c3" : "#f9fafb", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{f.faixa}</span>
                  {alertaAdolesc && f.gestantes_nao_planejadas > 0 && (
                    <span style={{ marginLeft: 6, background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 3 }}>⚠ Adolescente</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
                  <span>Consultas: <strong>{f.consultas_mes}</strong></span>
                  <span style={{ color: f.gestantes_nao_planejadas > 15 ? "#dc2626" : "#d97706" }}>Gest. n/plan.: <strong>{f.gestantes_nao_planejadas}</strong></span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                Em método: <strong style={{ color: "#374151" }}>{f.em_metodo}</strong> · Principal: {f.metodo_principal}
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
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade==="%"?"%":""}</span>
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

type Aba = "dashboard"|"metodos"|"faixaetaria"|"indicadores";

export default function PlanejamentoFamiliar() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash   } = useQuery({ queryKey: ["pf-dash"],   queryFn: () => apiGet("/api/planejamento-familiar/dashboard")    as Promise<any> });
  const { data: hist   } = useQuery({ queryKey: ["pf-hist"],   queryFn: () => apiGet("/api/planejamento-familiar/historico")    as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: mets   } = useQuery({ queryKey: ["pf-met"],    queryFn: () => apiGet("/api/planejamento-familiar/metodos")      as Promise<any[]>, enabled: aba==="metodos" });
  const { data: faixas } = useQuery({ queryKey: ["pf-faixa"],  queryFn: () => apiGet("/api/planejamento-familiar/faixa-etaria") as Promise<any[]>, enabled: aba==="faixaetaria" });
  const { data: inds   } = useQuery({ queryKey: ["pf-ind"],    queryFn: () => apiGet("/api/planejamento-familiar/indicadores")  as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "metodos",     label: `Métodos (${dashRaw?.mulheres_em_metodo_ativo?.toLocaleString("pt-BR") ?? 0} ativas)` },
    { id: "faixaetaria", label: "Por Faixa Etária" },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ style_SIAPS_PLACEHOLDER }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Planejamento Familiar</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>PAISM · Métodos Contraceptivos · DIU · Laqueadura · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.mulheres_em_metodo_ativo.toLocaleString("pt-BR")}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>em método ativo</div>
              </div>
              <div style={{ background: dashRaw.gestacoes_nao_planejadas_pct>30?"rgba(255,200,50,.3)":"rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.gestacoes_nao_planejadas_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>gest. n/planejadas</div>
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
        {aba==="metodos"     && <AbaMetodos metodos={mets}/>}
        {aba==="faixaetaria" && <AbaFaixaEtaria faixas={faixas}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
