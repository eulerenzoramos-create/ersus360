import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Cell } from "recharts";
import { BookOpen, Users, CheckCircle, AlertTriangle } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const SIT_COR: Record<string, string> = { concluida: "#16a34a", em_andamento: "#1d4ed8", planejada: "#9ca3af" };
const CAT_COR: Record<string, string> = {
  "Vigilância": "#d97706", "Urgência": "#dc2626", "Hospitalar": "#374151",
  "APS": "#16a34a", "Gestão e Administrativo": "#6b7280", "Farmácia": "#7c3aed"
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
  if (!dash) return null;
  return (
    <div>
      {dash.capacitacoes_obrigatorias_pendentes > 0 && (
        <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
          <strong>⚠ {dash.capacitacoes_obrigatorias_pendentes} capacitações obrigatórias pendentes</strong> — PGRSS, Higienização de mãos, preenchimento DN/DO.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Trabalhadores capacitados" value={dash.trabalhadores_capacitados_mes}     sub={`de ${dash.total_trabalhadores} total`}              cor="#374151"                              icon={<Users size={14} color="#374151"/>}/>
        <KpiCard label="Cobertura EPS"             value={dash.cobertura_eps_pct+"%"}             sub={`meta: ${dash.meta_cobertura_pct}%`}                 cor={STATUS_COR[dash.status_geral]}        icon={<CheckCircle size={14} color={STATUS_COR[dash.status_geral]}/>}/>
        <KpiCard label="Carga horária/mês"         value={dash.carga_horaria_mes+"h"}             sub={`${dash.capacitacoes_mes} capacitações`}             cor="#1d4ed8"                              icon={<BookOpen size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Obrigatórias pendentes"    value={dash.capacitacoes_obrigatorias_pendentes} sub="ação imediata"                                      cor={dash.capacitacoes_obrigatorias_pendentes>0?"#d97706":"#16a34a"} icon={<AlertTriangle size={14} color={dash.capacitacoes_obrigatorias_pendentes>0?"#d97706":"#16a34a"}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>EPS — tendência 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis yAxisId="l" tick={{ fontSize: 10 }} unit="%"/>
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }}/>
                <Tooltip contentStyle={TT}/>
                <Line yAxisId="l" type="monotone" dataKey="cobertura_pct"  stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 3 }} name="Cobertura (%)"/>
                <Line yAxisId="l" type="monotone" dataKey="satisfacao"    stroke="#16a34a" strokeWidth={1.5} dot={false}   name="Satisfação (%)"/>
                <Line yAxisId="r" type="monotone" dataKey="trabalhadores" stroke="#374151" strokeWidth={1.5} dot={{ r: 3 }} name="Capacitados"/>
                <Line yAxisId="r" type="monotone" dataKey="horas"         stroke="#d97706" strokeWidth={1}   dot={false}   name="Horas" strokeDasharray="3 2"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaCapacitacoes({ caps }: { caps: any[] | undefined }) {
  if (!caps) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {caps.map(c => {
          const sitCor = SIT_COR[c.status] ?? "#9ca3af";
          const catCor = CAT_COR[c.categoria] ?? "#374151";
          const adesao = c.concluintes > 0 ? Math.round(c.concluintes / c.inscritos * 100) : null;
          return (
            <div key={c.titulo} style={{ background: "#fff", border: `1px solid #e5e7eb`, borderLeft: `4px solid ${sitCor}`, borderRadius: 8, padding: "11px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <span style={{ background: catCor+"15", color: catCor, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, marginRight: 6 }}>{c.categoria}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{c.titulo}</span>
                  {c.pendente_obrigatorio && <span style={{ marginLeft: 6, background: "#fef9c3", color: "#92400e", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>OBRIGATÓRIO</span>}
                </div>
                <span style={{ background: sitCor+"15", color: sitCor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{c.status.replace("_"," ")}</span>
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#6b7280" }}>
                <span>{c.carga_h}h · {c.modalidade}</span>
                {c.turmas > 0 && <span>{c.turmas} turma(s)</span>}
                {c.inscritos > 0 && <span>Inscritos: <strong>{c.inscritos}</strong></span>}
                {c.concluintes > 0 && <span>Concluintes: <strong style={{ color: "#16a34a" }}>{c.concluintes}</strong></span>}
                {adesao !== null && <span>Adesão: <strong style={{ color: adesao >= 80 ? "#16a34a" : "#d97706" }}>{adesao}%</strong></span>}
                {c.satisfacao && <span>Satisfação: <strong style={{ color: "#1d4ed8" }}>{c.satisfacao}%</strong></span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AbaCategorias({ cats }: { cats: any[] | undefined }) {
  if (!cats) return null;
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Cobertura EPS por categoria (%)</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cats} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fontSize: 9 }} unit="%"/>
              <YAxis type="category" dataKey="categoria" tick={{ fontSize: 9 }} width={180}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="cobertura_pct" name="Cobertura %" radius={[0,4,4,0]}>
                {cats.map((c, i) => <Cell key={i} fill={STATUS_COR[c.status]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {cats.map(c => (
          <div key={c.categoria} style={{ background: "#fff", border: `1px solid ${STATUS_COR[c.status]}22`, borderLeft: `4px solid ${STATUS_COR[c.status]}`, borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <strong>{c.categoria}</strong>
              <span style={{ color: "#6b7280" }}>{c.trabalhadores} trabalhadores · {c.horas_per_capita}h/capita · {c.capacitacoes} capacitações</span>
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
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade==="%"?"%":ind.unidade==="h"?"h":""}</span>
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

type Aba = "dashboard"|"capacitacoes"|"categorias"|"indicadores";

export default function EducacaoPermanente() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash } = useQuery({ queryKey: ["eps-dash"],  queryFn: () => apiGet("/api/educacao-permanente/dashboard")    as Promise<any> });
  const { data: hist } = useQuery({ queryKey: ["eps-hist"],  queryFn: () => apiGet("/api/educacao-permanente/historico")    as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: caps } = useQuery({ queryKey: ["eps-caps"],  queryFn: () => apiGet("/api/educacao-permanente/capacitacoes") as Promise<any[]>, enabled: aba==="capacitacoes" });
  const { data: cats } = useQuery({ queryKey: ["eps-cats"],  queryFn: () => apiGet("/api/educacao-permanente/por-categoria") as Promise<any[]>, enabled: aba==="categorias" });
  const { data: inds } = useQuery({ queryKey: ["eps-ind"],   queryFn: () => apiGet("/api/educacao-permanente/indicadores")  as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",    label: "Dashboard" },
    { id: "capacitacoes", label: `Capacitações (${dashRaw?.capacitacoes_mes ?? 0})` },
    { id: "categorias",   label: "Por Categoria" },
    { id: "indicadores",  label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#4338ca 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Educação Permanente em Saúde</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>EPS · Capacitações · Trilhas Formativas · Avasus · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.trabalhadores_capacitados_mes}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>capacitados/mês</div>
              </div>
              <div style={{ background: dashRaw.cobertura_eps_pct < dashRaw.meta_cobertura_pct ? "rgba(255,200,50,.3)" : "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.cobertura_eps_pct}%</div>
                <div style={{ fontSize: 10, opacity: .8 }}>cobertura</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e0e7ff" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #4338ca":"2px solid transparent", color: aba===a.id?"#4338ca":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"    && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="capacitacoes" && <AbaCapacitacoes caps={caps}/>}
        {aba==="categorias"   && <AbaCategorias cats={cats}/>}
        {aba==="indicadores"  && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
