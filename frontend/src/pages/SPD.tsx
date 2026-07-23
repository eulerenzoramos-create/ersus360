import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { UserCheck, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#e4e7ec", border: "none", borderRadius: 6, color: "#f8fafc" };
const ST_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const TIPO_CORES = ["#1d4ed8","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626"];

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
      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#dc2626" }}>
        <strong>⚠ Oficina Ortopédica sem profissional desde Jan/26</strong> — 48 pacientes aguardando órteses/próteses sem previsão de atendimento. Fonoaudiologia com espera de 75 dias.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="PCD cadastradas"        value={dash.pessoas_cadastradas.toLocaleString("pt-BR")} sub="Carteira Saúde PCD: 312"                            cor="#374151"   icon={<UserCheck size={14} color="#374151"/>}/>
        <KpiCard label="Em reabilitação ativa"  value={dash.em_reabilitacao_ativa}                       sub={`${Math.round(dash.em_reabilitacao_ativa/dash.pessoas_cadastradas*100)}% do total`} cor="#1d4ed8" icon={<Activity size={14} color="#1d4ed8"/>}/>
        <KpiCard label="BPC beneficiários"      value={dash.bpc_beneficiarios}                           sub="acompanhamento APS 100%"                           cor="#16a34a"   icon={<CheckCircle size={14} color="#16a34a"/>}/>
        <KpiCard label="Aguard. avaliação"      value={dash.aguardando_avaliacao}                        sub="CIF + BPC + Regulação"                             cor="#d97706"   icon={<AlertTriangle size={14} color="#d97706"/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>SPD — Reabilitação e sessões (6 meses)</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }}/>
                <Tooltip contentStyle={TT}/>
                <Line yAxisId="l" type="monotone" dataKey="sessoes"     name="Sessões/mês"   stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }}/>
                <Line yAxisId="r" type="monotone" dataKey="em_reab"     name="Em reabilitação" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }}/>
                <Line yAxisId="r" type="monotone" dataKey="cadastrados" name="Cadastrados"   stroke="#6b7280" strokeWidth={1} strokeDasharray="4 2" dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaTipos({ tipos }: { tipos: any[] | undefined }) {
  if (!tipos) return null;
  const totalCad = tipos.reduce((s, t) => s + t.total, 0);
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Distribuição por tipo de deficiência — {totalCad} PCD</div>
        {tipos.map((t, i) => (
          <div key={t.tipo} style={{ marginBottom: 14, background: "#f9fafb", borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t.tipo}</span>
              <div style={{ display: "flex", gap: 10, fontSize: 11 }}>
                <span style={{ color: "#6b7280" }}>{t.total} PCD ({t.pct}%)</span>
                <span style={{ color: "#1d4ed8" }}>Reab.: {t.em_reabilitacao}</span>
                {t.bpc > 0 && <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "1px 6px", borderRadius: 3, fontWeight: 700 }}>BPC: {t.bpc}</span>}
              </div>
            </div>
            <div style={{ background: "#e5e7eb", borderRadius: 6, height: 9, marginBottom: 4 }}>
              <div style={{ background: TIPO_CORES[i], height: "100%", width: `${t.pct * 2}%`, borderRadius: 6 }}/>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>{t.servicos_principais}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AbaReabilitacao({ reab }: { reab: any[] | undefined }) {
  if (!reab) return null;
  return (
    <div>
      {reab.map(s => {
        const cor = ST_COR[s.status];
        const espPct = Math.min(100, Math.round(s.lista_espera / (s.pacientes_ativos || 1) * 100));
        return (
          <div key={s.servico} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{s.servico}</span>
                {s.profissionais === 0 && <span style={{ marginLeft: 8, background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>SEM PROFISSIONAL</span>}
              </div>
              <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 4 }}>{s.status}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, fontSize: 12, marginBottom: 10 }}>
              <div><span style={{ color: "#9ca3af" }}>Sessões/mês</span><div style={{ fontWeight: 700, fontSize: 15 }}>{s.sessoes_mes}</div></div>
              <div><span style={{ color: "#9ca3af" }}>Pacientes ativos</span><div style={{ fontWeight: 700, fontSize: 15 }}>{s.pacientes_ativos}</div></div>
              <div><span style={{ color: "#9ca3af" }}>Lista de espera</span><div style={{ fontWeight: 700, fontSize: 15, color: s.lista_espera > 20 ? "#dc2626" : "#374151" }}>{s.lista_espera}</div></div>
              <div><span style={{ color: "#9ca3af" }}>Espera (dias)</span><div style={{ fontWeight: 700, fontSize: 15, color: s.tempo_espera_dias > 30 ? "#dc2626" : "#374151" }}>{s.tempo_espera_dias}d</div></div>
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Lista de espera / ativos: {espPct}%</div>
            <div style={{ background: "#f3f4f6", borderRadius: 6, height: 6 }}>
              <div style={{ background: cor, height: "100%", width: `${espPct}%`, borderRadius: 6 }}/>
            </div>
          </div>
        );
      })}
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

type Aba = "dashboard"|"tipos"|"reabilitacao"|"indicadores";

export default function SPD() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash } = useQuery({ queryKey: ["spd-dash"], queryFn: () => apiGet("/api/spd/dashboard")    as Promise<any> });
  const { data: hist } = useQuery({ queryKey: ["spd-hist"], queryFn: () => apiGet("/api/spd/historico")    as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: tipos} = useQuery({ queryKey: ["spd-tip"],  queryFn: () => apiGet("/api/spd/tipos")        as Promise<any[]>, enabled: aba==="tipos" });
  const { data: reab } = useQuery({ queryKey: ["spd-reab"], queryFn: () => apiGet("/api/spd/reabilitacao") as Promise<any[]>, enabled: aba==="reabilitacao" });
  const { data: inds } = useQuery({ queryKey: ["spd-ind"],  queryFn: () => apiGet("/api/spd/indicadores")  as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",    label: "Dashboard" },
    { id: "tipos",        label: `Tipos (${dashRaw?.pessoas_cadastradas ?? 0} PCD)` },
    { id: "reabilitacao", label: "Reabilitação" },
    { id: "indicadores",  label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Saúde da Pessoa com Deficiência</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>BPC · CIF · Reabilitação · Órteses e Próteses · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.pessoas_cadastradas}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>PCD cadastradas</div>
              </div>
              <div style={{ background: dashRaw.em_reabilitacao_ativa < 200 ? "rgba(220,150,50,.35)" : "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.em_reabilitacao_ativa}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>em reabilitação</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #dbeafe" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #1d4ed8":"2px solid transparent", color: aba===a.id?"#1d4ed8":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"    && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="tipos"        && <AbaTipos tipos={tipos}/>}
        {aba==="reabilitacao" && <AbaReabilitacao reab={reab}/>}
        {aba==="indicadores"  && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
