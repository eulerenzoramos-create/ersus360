import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Cell } from "recharts";
import { Clock, AlertTriangle, CheckCircle, Users } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const ST_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const CLASS_COR: Record<string, string> = {
  vermelho_emergencia: "#dc2626", laranja_muito_urgente: "#ea580c",
  amarelo_urgente: "#ca8a04", verde_pouco_urgente: "#16a34a", azul_nao_urgente: "#2563eb",
};
const CLASS_LABEL: Record<string, string> = {
  vermelho_emergencia: "Vermelho (Emergência)", laranja_muito_urgente: "Laranja (Muito urgente)",
  amarelo_urgente: "Amarelo (Urgente)", verde_pouco_urgente: "Verde (Pouco urgente)", azul_nao_urgente: "Azul (Não urgente)",
};

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
  const classDist = [
    { key: "vermelho_emergencia",   n: dash.vermelho_emergencia },
    { key: "laranja_muito_urgente", n: dash.laranja_muito_urgente },
    { key: "amarelo_urgente",       n: dash.amarelo_urgente },
    { key: "verde_pouco_urgente",   n: dash.verde_pouco_urgente },
    { key: "azul_nao_urgente",      n: dash.azul_nao_urgente },
  ];
  return (
    <div>
      {dash.tempo_espera_verde_min > dash.meta_verde_min && (
        <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
          <strong>⚠ Espera Verde acima do padrão Manchester:</strong> {dash.tempo_espera_verde_min} min (meta ≤{dash.meta_verde_min} min) · Fuga: {dash.fuga_antes_atend_pct}% dos pacientes.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Atendimentos/mês"   value={dash.atendimentos_upa_mes?.toLocaleString("pt-BR")} sub={`${dash.atendimentos_classificados_pct}% classificados`}                   cor="#374151"   icon={<Users size={14} color="#374151"/>}/>
        <KpiCard label="Espera Verde (P3)"  value={dash.tempo_espera_verde_min+"min"}                 sub={`meta: ≤${dash.meta_verde_min} min`}                                     cor={dash.tempo_espera_verde_min<=dash.meta_verde_min?"#16a34a":"#d97706"} icon={<Clock size={14} color={dash.tempo_espera_verde_min<=dash.meta_verde_min?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Espera Amarelo (P2)"value={dash.tempo_espera_amarelo_min+"min"}               sub={`meta: ≤${dash.meta_amarelo_min} min`}                                   cor={dash.tempo_espera_amarelo_min<=dash.meta_amarelo_min?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={dash.tempo_espera_amarelo_min<=dash.meta_amarelo_min?"#16a34a":"#d97706"}/>}/>
        <KpiCard label="Fuga antes atend."  value={dash.fuga_antes_atend_pct+"%"}                     sub="meta: ≤3%"                                                               cor={dash.fuga_antes_atend_pct<=3?"#16a34a":"#d97706"} icon={<AlertTriangle size={14} color={dash.fuga_antes_atend_pct<=3?"#16a34a":"#d97706"}/>}/>
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Distribuição por classificação — mês atual ({dash.atendimentos_upa_mes?.toLocaleString("pt-BR")} atend.)</div>
        {classDist.map(c => {
          const pct = Math.round(c.n / dash.atendimentos_upa_mes * 100);
          const cor = CLASS_COR[c.key];
          return (
            <div key={c.key} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: cor }}>{CLASS_LABEL[c.key]}</span>
                <span><strong>{c.n}</strong> ({pct}%)</span>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: 6, height: 10 }}>
                <div style={{ background: cor, height: "100%", width: `${pct}%`, borderRadius: 6 }}/>
              </div>
            </div>
          );
        })}
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Evolução — tempo de espera e fugas</div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }} unit="min"/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="%"/>
                <Tooltip contentStyle={TT}/>
                <Line yAxisId="l" type="monotone" dataKey="tempo_verde"   name="Espera Verde (min)"   stroke="#ca8a04" strokeWidth={2} dot={{ r: 3 }}/>
                <Line yAxisId="l" type="monotone" dataKey="tempo_amarelo" name="Espera Amarelo (min)" stroke="#ea580c" strokeWidth={1.5} dot={false}/>
                <Line yAxisId="r" type="monotone" dataKey="fuga_pct"      name="Fuga (%)"             stroke="#dc2626" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="4 2"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaFluxo({ fluxo }: { fluxo: any | undefined }) {
  if (!fluxo) return <NaoDisponivelBanner nota="Dados indisponíveis. Nenhum valor foi inventado." />;
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Atendimentos por turno</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fluxo.por_turno} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="turno" tick={{ fontSize: 9 }}/>
              <YAxis tick={{ fontSize: 10 }}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="vermelho"  name="Vermelho"  fill="#dc2626" stackId="a"/>
              <Bar dataKey="laranja"   name="Laranja"   fill="#ea580c" stackId="a"/>
              <Bar dataKey="amarelo"   name="Amarelo"   fill="#ca8a04" stackId="a"/>
              <Bar dataKey="verde"     name="Verde"     fill="#16a34a" stackId="a"/>
              <Bar dataKey="azul"      name="Azul"      fill="#2563eb" stackId="a" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Atendimentos por dia da semana</div>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fluxo.por_dia_semana} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="dia" tick={{ fontSize: 11 }}/>
              <YAxis tick={{ fontSize: 10 }}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="atend" name="Atendimentos" radius={[4,4,0,0]}>
                {fluxo.por_dia_semana.map((_: any, i: number) => (
                  <Cell key={i} fill={i < 5 ? "#1d4ed8" : "#6b7280"}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AbaQueixas({ queixas }: { queixas: any[] | undefined }) {
  if (!queixas) return <NaoDisponivelBanner nota="Dados indisponíveis. Nenhum valor foi inventado." />;
  const total = queixas.reduce((s, q) => s + q.casos, 0);
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Principais queixas — {total?.toLocaleString("pt-BR")} atendimentos</div>
      {queixas.map(q => {
        const cor = q.classificacao_modal === "Vermelho" ? "#dc2626" : q.classificacao_modal === "Laranja" ? "#ea580c" : q.classificacao_modal === "Amarelo" ? "#ca8a04" : q.classificacao_modal === "Azul" ? "#2563eb" : "#16a34a";
        return (
          <div key={q.queixa} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>{q.queixa}</span>
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4 }}>{q.classificacao_modal}</span>
                <strong>{q.casos} ({q.pct}%)</strong>
              </div>
            </div>
            <div style={{ background: "#f3f4f6", borderRadius: 6, height: 8 }}>
              <div style={{ background: cor, height: "100%", width: `${q.pct * 4}%`, borderRadius: 6 }}/>
            </div>
          </div>
        );
      })}
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
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade==="%"?"%":ind.unidade==="min"?" min":""}</span>
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

type Aba = "dashboard"|"fluxo"|"queixas"|"indicadores";

export default function Acolhimento() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash   } = useQuery({ queryKey: ["acol-dash"],  queryFn: () => apiGet("/api/acolhimento/dashboard")   as Promise<any> });
  const { data: hist   } = useQuery({ queryKey: ["acol-hist"],  queryFn: () => apiGet("/api/acolhimento/historico")   as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: fluxo  } = useQuery({ queryKey: ["acol-flux"],  queryFn: () => apiGet("/api/acolhimento/fluxo")       as Promise<any>,   enabled: aba==="fluxo" });
  const { data: queixas = []} = useQuery({ queryKey: ["acol-qx"],    queryFn: () => apiGet("/api/acolhimento/queixas")     as Promise<any[]>, enabled: aba==="queixas" });
  const { data: inds   } = useQuery({ queryKey: ["acol-ind"],   queryFn: () => apiGet("/api/acolhimento/indicadores") as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "fluxo",       label: "Fluxo por Turno/Dia" },
    { id: "queixas",     label: `Queixas (${dashRaw?.atendimentos_upa_mes?.toLocaleString("pt-BR") ?? 0})` },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Acolhimento / Classificação de Risco</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Protocolo Manchester · ABCDE · UPA 24h · Tempo de Espera · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.atendimentos_upa_mes?.toLocaleString("pt-BR")}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>atend./mês UPA</div>
              </div>
              <div style={{ background: dashRaw.tempo_espera_verde_min>dashRaw.meta_verde_min?"rgba(255,200,50,.3)":"rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.tempo_espera_verde_min}min</div>
                <div style={{ fontSize: 10, opacity: .8 }}>espera verde</div>
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
        {aba==="dashboard" && !dashRaw && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="fluxo"       && <AbaFluxo fluxo={fluxo}/>}
        {aba==="queixas"     && <AbaQueixas queixas={queixas}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
