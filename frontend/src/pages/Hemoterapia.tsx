import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Cell } from "recharts";
import { Droplets, AlertTriangle, TrendingDown, CheckCircle } from "lucide-react";
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

function AbaDashboard({ dash, hist }: { dash: any; hist: any[] | undefined }) {
  if (!dash) return <NaoDisponivelBanner nota="Dados indisponíveis. Integração não configurada no Railway. Nenhum valor foi inventado." />;
  return (
    <div>
      {dash.estoque_critico && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#dc2626" }}>
          <strong>⚠ Estoque crítico:</strong> {dash.hemocomponentes_criticos?.join(", ")} — ação imediata necessária.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Doações/mês"         value={dash.doacoes_mes}                    sub={`meta: ${dash.meta_doacoes_mes}`}           cor={dash.doacoes_mes>=dash.meta_doacoes_mes?"#16a34a":"#dc2626"} icon={<Droplets size={14} color={dash.doacoes_mes>=dash.meta_doacoes_mes?"#16a34a":"#dc2626"}/>}/>
        <KpiCard label="Autossuficiência"    value={dash.autossuficiencia_pct+"%"}        sub="hemocomponentes próprios"                  cor={STATUS_COR[dash.status_estoque]}                              icon={<CheckCircle size={14} color={STATUS_COR[dash.status_estoque]}/>}/>
        <KpiCard label="Descarte de bolsas"  value={dash.descarte_pct+"%"}               sub={`${dash.bolsas_descartadas_mes} bolsas`}   cor={dash.descarte_pct>8?"#d97706":"#16a34a"}                     icon={<TrendingDown size={14} color={dash.descarte_pct>8?"#d97706":"#16a34a"}/>}/>
        <KpiCard label="Triagem inaptos"     value={dash.triagem_inaptos_pct+"%"}        sub="anemia + janela imunológica"               cor="#374151"                                                      icon={<AlertTriangle size={14} color="#374151"/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Doações — 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="coletadas"   name="Coletadas"  fill="#be123c" radius={[4,4,0,0]}/>
                <Bar dataKey="aptas"       name="Aptas"      fill="#16a34a" radius={[4,4,0,0]}/>
                <Bar dataKey="descartadas" name="Descartadas" fill="#d97706" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaEstoque({ estoque }: { estoque: any[] | undefined }) {
  if (!estoque) return <NaoDisponivelBanner nota="Dados indisponíveis. Nenhum valor foi inventado." />;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {estoque.map(e => {
          const cor = STATUS_COR[e.status];
          const pct = Math.min(100, Math.round((e.bolsas / (e.estoque_minimo * 2)) * 100));
          return (
            <div key={e.hemocomponente} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{e.hemocomponente}</div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>Validade média: {e.validade_media_dias} dias</span>
                  <span style={{ background: cor+"15", color: cor, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                    {e.bolsas} bolsas
                  </span>
                </div>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 8 }}>
                <div style={{ background: cor, height: "100%", width: `${pct}%`, borderRadius: 6 }}/>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "#9ca3af" }}>
                <span>Mínimo: {e.estoque_minimo} bolsas</span>
                <span style={{ color: cor, fontWeight: 600 }}>{e.status === "critico" ? "⚠ CRÍTICO" : e.status === "atencao" ? "⚠ Atenção" : "✓ OK"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaTriagem({ causas }: { causas: any[] | undefined }) {
  if (!causas) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Causas de inaptidão na triagem</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={causas} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fontSize: 9 }}/>
              <YAxis type="category" dataKey="causa" tick={{ fontSize: 9 }} width={180}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="inaptos" name="Inaptos" fill="#be123c" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AbaIndicadores({ inds }: { inds: any[] | undefined }) {
  if (!inds) return <NaoDisponivelBanner nota="Dados indisponíveis. Nenhum valor foi inventado." />;
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
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade==="%"?"%":ind.unidade==="‰"?"‰":""}</span>
                    {ind.meta && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade==="%"?"%":""}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

type Aba = "dashboard"|"estoque"|"triagem"|"indicadores";

export default function Hemoterapia() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash   } = useQuery({ queryKey: ["hemo-dash"],  queryFn: () => apiGet("/api/hemoterapia/dashboard")        as Promise<any> });
  const { data: hist   } = useQuery({ queryKey: ["hemo-hist"],  queryFn: () => apiGet("/api/hemoterapia/doacoes-historico") as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: est    } = useQuery({ queryKey: ["hemo-est"],   queryFn: () => apiGet("/api/hemoterapia/estoque")          as Promise<any[]>, enabled: aba==="estoque" });
  const { data: causas } = useQuery({ queryKey: ["hemo-caus"],  queryFn: () => apiGet("/api/hemoterapia/triagem-causas")   as Promise<any[]>, enabled: aba==="triagem" });
  const { data: inds   } = useQuery({ queryKey: ["hemo-ind"],   queryFn: () => apiGet("/api/hemoterapia/indicadores")      as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "estoque",     label: "Estoque" },
    { id: "triagem",     label: "Triagem" },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Hemoterapia</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Banco de Sangue · Estoque · Doadores · Triagem · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.doacoes_mes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>doações/mês</div>
              </div>
              <div style={{ background: dashRaw.estoque_critico?"rgba(255,100,100,.3)":"rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.autossuficiencia_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>autossuficiência</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #be123c":"2px solid transparent", color: aba===a.id?"#be123c":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && !dashRaw && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="estoque"     && <AbaEstoque estoque={est}/>}
        {aba==="triagem"     && <AbaTriagem causas={causas}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
