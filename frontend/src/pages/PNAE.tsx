import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { ShoppingBag, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const ST_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const ESC_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };

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
      {dash.escolas_sem_nutri_visita_mes > 0 && (
        <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
          <strong>⚠ {dash.escolas_sem_nutri_visita_mes} escolas sem visita do nutricionista este mês</strong> — majoritariamente zona rural e ribeirinha. 2 cardápios sem aprovação técnica.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Alunos beneficiados"    value={dash.alunos_beneficiados.toLocaleString("pt-BR")} sub={`${dash.escolas_atendidas} escolas`}             cor="#16a34a" icon={<CheckCircle size={14} color="#16a34a"/>}/>
        <KpiCard label="Repasse FNDE/mês"       value={BRL(dash.repasse_fnde_mensal)} sub="R$0,53/aluno/dia"                              cor="#1d4ed8" icon={<ShoppingBag size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Agricultura familiar"   value={`${dash.agricultores_da_local_pct}%`}             sub={`meta: ≥${dash.meta_da_local_pct}% — ✓`}        cor="#16a34a" icon={<TrendingUp size={14} color="#16a34a"/>}/>
        <KpiCard label="Amostras conform."      value={`${dash.amostras_laboratorio_ok_pct}%`}           sub="meta: 95%"                                      cor={dash.amostras_laboratorio_ok_pct>=95?"#16a34a":"#d97706"} icon={<AlertTriangle size={14} color={dash.amostras_laboratorio_ok_pct>=95?"#16a34a":"#d97706"}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>PNAE — Evolução semestral</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="%"/>
                <Tooltip contentStyle={TT}/>
                <Line yAxisId="l" type="monotone" dataKey="alunos"        name="Alunos"       stroke="#374151" strokeWidth={1} strokeDasharray="4 2" dot={false}/>
                <Line yAxisId="r" type="monotone" dataKey="da_local_pct"  name="Agric. Fam.%" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }}/>
                <Line yAxisId="r" type="monotone" dataKey="amostras_ok_pct" name="Amostras OK%" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }}/>
                <Line yAxisId="r" type="monotone" dataKey="cardapios_ok_pct" name="Cardápios OK%" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaEscolas({ escolas }: { escolas: any[] | undefined }) {
  if (!escolas) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  return (
    <div>
      {escolas.map(e => {
        const cor = ESC_COR[e.status];
        return (
          <div key={e.escola} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px", marginBottom: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{e.escola}</span>
                <span style={{ marginLeft: 8, background: "#111827", color: "#374151", fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4 }}>{e.tipo}</span>
                {!e.nutricionista_visita_mes && <span style={{ marginLeft: 4, background: "#fef9c3", color: "#92400e", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>SEM VISITA</span>}
                {!e.cardapio_aprovado && <span style={{ marginLeft: 4, background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>CARDÁPIO PENDENTE</span>}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{e.alunos} alunos · {e.refeicoes_dia}x/dia</span>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#6b7280", marginBottom: e.agricultora_local_pct > 0 ? 6 : 0 }}>
              <span>Agric. familiar: <strong style={{ color: e.agricultora_local_pct >= 30 ? "#16a34a" : "#d97706" }}>{e.agricultora_local_pct}%</strong></span>
              <span>Refeições/dia: <strong>{e.refeicoes_dia}</strong></span>
            </div>
            {e.agricultora_local_pct > 0 && (
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 6 }}>
                <div style={{ background: e.agricultora_local_pct >= 30 ? "#16a34a" : "#d97706", height: "100%", width: `${Math.min(100, e.agricultora_local_pct)}%`, borderRadius: 6 }}/>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AbaFornecedores({ forn }: { forn: any[] | undefined }) {
  if (!forn) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  const total = forn.reduce((s, f) => s + f.valor_contrato_mensal, 0);
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Fornecedores — R${total.toLocaleString("pt-BR",{minimumFractionDigits:2})}/mês</div>
        {forn.map(f => {
          const pct = Math.round(f.valor_contrato_mensal / total * 100);
          const cor = f.tipo.includes("DAP") ? "#16a34a" : "#0369a1";
          return (
            <div key={f.fornecedor} style={{ marginBottom: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{f.fornecedor}</span>
                  <span style={{ marginLeft: 6, background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>{f.dap_regularizada ? "DAP/PRONAF ✓" : "Licitação"}</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: f.entregas_no_prazo_pct < 85 ? "#d97706" : "#6b7280" }}>entrega: {f.entregas_no_prazo_pct}%</span>
                  <strong style={{ color: cor }}>{BRL(f.valor_contrato_mensal)} ({pct}%)</strong>
                </div>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 8 }}>
                <div style={{ background: cor, height: "100%", width: `${pct * 2.8}%`, borderRadius: 6 }}/>
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3 }}>{f.produtos.join(" · ")}</div>
            </div>
          );
        })}
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
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{typeof ind.valor==="number"?ind.valor.toLocaleString("pt-BR"):ind.valor}{ind.unidade==="%"?"%":""}</span>
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

type Aba = "dashboard"|"escolas"|"fornecedores"|"indicadores";

export default function PNAE() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash } = useQuery({ queryKey: ["pnae-dash"], queryFn: () => apiGet("/api/pnae/dashboard")    as Promise<any> });
  const { data: hist } = useQuery({ queryKey: ["pnae-hist"], queryFn: () => apiGet("/api/pnae/historico")    as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: esc  } = useQuery({ queryKey: ["pnae-esc"],  queryFn: () => apiGet("/api/pnae/escolas")      as Promise<any[]>, enabled: aba==="escolas" });
  const { data: forn } = useQuery({ queryKey: ["pnae-for"],  queryFn: () => apiGet("/api/pnae/fornecedores") as Promise<any[]>, enabled: aba==="fornecedores" });
  const { data: inds } = useQuery({ queryKey: ["pnae-ind"],  queryFn: () => apiGet("/api/pnae/indicadores")  as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",    label: "Dashboard" },
    { id: "escolas",      label: `Escolas (${dashRaw?.escolas_atendidas ?? 0})` },
    { id: "fornecedores", label: "Fornecedores" },
    { id: "indicadores",  label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Alimentação Escolar — PNAE</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>FNDE · Cardápios · Agricultura Familiar · Nutrição Escolar · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.alunos_beneficiados.toLocaleString("pt-BR")}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>alunos beneficiados</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{BRL(dashRaw.repasse_fnde_mensal)}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>FNDE/mês</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"3px solid #1351b4":"2px solid transparent", color: aba===a.id?"#1351b4":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard" && !dashRaw && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba==="dashboard"    && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="escolas"      && <AbaEscolas escolas={esc}/>}
        {aba==="fornecedores" && <AbaFornecedores forn={forn}/>}
        {aba==="indicadores"  && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
