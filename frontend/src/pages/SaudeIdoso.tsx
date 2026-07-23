import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";
import { Users, AlertTriangle, Activity, Heart } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#e4e7ec", border: "none", borderRadius: 6, color: "#f8fafc" };
const FRAG_COR: Record<string, string> = { fragil: "#dc2626", pre_fragil: "#d97706", robusto: "#16a34a" };
const FRAG_LABEL: Record<string, string> = { fragil: "Frágil", pre_fragil: "Pré-frágil", robusto: "Robusto" };
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

function AbaDashboard({ dash }: { dash: any }) {
  if (!dash) return null;
  const fragData = [
    { name: "Frágil",    n: dash.frageis,    cor: "#dc2626" },
    { name: "Pré-frágil",n: dash.pre_frageis,cor: "#d97706" },
    { name: "Robusto",   n: dash.robustos,   cor: "#16a34a" },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Idosos cadastrados" value={dash.total_idosos}     sub="≥ 60 anos acompanhados"    cor="#7c3aed" icon={<Users size={14} color="#7c3aed"/>}/>
        <KpiCard label="Frágeis (IVCF)"     value={dash.frageis}          sub="necessitam cuidado intenso" cor="#dc2626" icon={<AlertTriangle size={14} color="#dc2626"/>}/>
        <KpiCard label="Pré-frágeis"        value={dash.pre_frageis}      sub="risco de fragilização"      cor="#d97706" icon={<Heart size={14} color="#d97706"/>}/>
        <KpiCard label="Com alerta"         value={dash.com_alerta}       sub="quedas / polifarmácia"      cor={dash.com_alerta>3?"#dc2626":"#d97706"} icon={<AlertTriangle size={14} color={dash.com_alerta>3?"#dc2626":"#d97706"}/>}/>
        <KpiCard label="Quedas acumuladas"  value={dash.quedas_acumuladas} sub="último ano"                cor="#d97706" icon={<Activity size={14} color="#d97706"/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Classificação IVCF — fragilidade</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fragData} barSize={60}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="n" name="Idosos" radius={[4,4,0,0]}>
                  {fragData.map((f, i) => <Cell key={i} fill={f.cor}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Consultas e visitas domiciliares</div>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Line type="monotone" dataKey="consultas"    stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3 }} name="Consultas"/>
                <Line type="monotone" dataKey="visitas_dom"  stroke="#1d4ed8" strokeWidth={1.5} dot={false}   name="Visitas dom."/>
                <Line type="monotone" dataKey="quedas_atend" stroke="#dc2626" strokeWidth={1.5} dot={false}   name="Quedas atend."/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbaIdosos({ idosos }: { idosos: any[] | undefined }) {
  const [filtro, setFiltro] = useState("todos");
  if (!idosos) return null;
  const lista = filtro === "todos" ? idosos : filtro === "alerta" ? idosos.filter(i => i.alerta) : idosos.filter(i => i.fragilidade === filtro);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[["todos","Todos",idosos.length,"#374151"],["fragil","Frágil",idosos.filter(i=>i.fragilidade==="fragil").length,"#dc2626"],["pre_fragil","Pré-frágil",idosos.filter(i=>i.fragilidade==="pre_fragil").length,"#d97706"],["robusto","Robusto",idosos.filter(i=>i.fragilidade==="robusto").length,"#16a34a"],["alerta","⚠ Alertas",idosos.filter(i=>i.alerta).length,"#dc2626"]].map(([k,l,n,c])=>(
          <button key={String(k)} onClick={() => setFiltro(String(k))} style={{ padding: "6px 14px", border: `1px solid ${filtro===k?c:"#e5e7eb"}`, borderRadius: 20, background: filtro===k?`${c}15`:"#fff", color: filtro===k?String(c):"#374151", fontSize: 12, cursor: "pointer", fontWeight: filtro===k?700:400 }}>{l} ({n})</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lista.map(p => {
          const cor = FRAG_COR[p.fragilidade];
          return (
            <div key={p.id} style={{ background: "#fff", border: `1px solid ${p.alerta?"#dc262622":"#e5e7eb"}`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{p.codigo} — {p.sexo==="F"?"♀":"♂"} {p.idade} anos · {p.esf}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ background: cor+"15", color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{FRAG_LABEL[p.fragilidade]} (IVCF {p.ivcf})</span>
                  {p.polifarmacia && <span style={{ background: "#fef3c7", color: "#d97706", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>Polifarmácia</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280" }}>
                <span>Quedas/ano: <strong style={{ color: p.quedas_ultimo_ano>=3?"#dc2626":"#374151" }}>{p.quedas_ultimo_ano}</strong></span>
                <span>Caderneta: <strong style={{ color: p.caderneta?"#16a34a":"#dc2626" }}>{p.caderneta?"✓":"✗"}</strong></span>
                <span>Vis. domiciliar: <strong style={{ color: p.visita_domiciliar?"#16a34a":"#9ca3af" }}>{p.visita_domiciliar?"✓":"—"}</strong></span>
                <span>Cuidador: <strong style={{ color: p.cuidador?"#16a34a":"#9ca3af" }}>{p.cuidador?"✓":"—"}</strong></span>
              </div>
              {p.alerta && <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {p.alerta}</div>}
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
            {grupo.map(ind => {
              const pct = ind.invertido ? 100 : Math.min(100, Math.round(ind.valor / ind.meta * 100));
              return (
                <div key={ind.indicador} style={{ background: "#fff", border: `1px solid ${cor}22`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ind.invertido ? 0 : 6 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                      {ind.observacao && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{ind.observacao}</div>}
                    </div>
                    <div style={{ flexShrink: 0, marginLeft: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}{ind.unidade.startsWith("%")?"%":""}</span>
                      <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}{ind.unidade.startsWith("%")?"%":""}</span>
                    </div>
                  </div>
                  {!ind.invertido && (
                    <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7 }}>
                      <div style={{ background: cor, height: "100%", width: `${pct}%`, borderRadius: 6 }}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

type Aba = "dashboard"|"idosos"|"indicadores";

export default function SaudeIdoso() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dashRaw } = useQuery({ queryKey: ["ido-dash"], queryFn: () => apiGet("/api/saude-idoso/dashboard")   as Promise<any> });
  const { data: hist }    = useQuery({ queryKey: ["ido-hist"], queryFn: () => apiGet("/api/saude-idoso/historico")   as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: idosos }  = useQuery({ queryKey: ["ido-list"], queryFn: () => apiGet("/api/saude-idoso/idosos")      as Promise<any[]>, enabled: aba==="idosos" });
  const { data: inds }    = useQuery({ queryKey: ["ido-ind"],  queryFn: () => apiGet("/api/saude-idoso/indicadores") as Promise<any[]>, enabled: aba==="indicadores" });

  const dash = dashRaw && hist ? { ...dashRaw, historico: hist } : null;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "idosos",      label: `Idosos (${dashRaw?.total_idosos ?? 0})` },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ fontFamily: "Rawline, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      {/* Barra azul SIAPS */}
      <div style={{ background: "#1351b4", color: "#fff", padding: "10px 24px", display: "flex", alignItems: "center", gap: 28, fontSize: 13, fontWeight: 600 }}>
        <span>UF: <strong>AM</strong></span>
        <span>Município: <strong>APUÍ</strong></span>
        <span>Competência: <strong>Jul/2026</strong></span>
      </div>
      {/* Conteúdo branco */}
      <div style={{ background: "#fff", minHeight: "calc(100vh - 40px)", padding: "24px 28px" }}>
        {/* Título da seção */}
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1351b4", marginBottom: 6 }}>Saúde da Pessoa Idosa</div>
        <div style={{ fontSize: 12, color: "#555", marginBottom: 20 }}>IVCF · Fragilidade · Caderneta · Quedas · FMS Apuí/AM</div>

        {/* Abas */}
        <div style={{ display: "flex", borderBottom: "2px solid #d4d4d4", marginBottom: 24, gap: 0 }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "11px 20px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: aba===a.id?700:400, color: aba===a.id?"#1351b4":"#555", borderBottom: aba===a.id?"3px solid #1351b4":"3px solid transparent", marginBottom: -2, whiteSpace: "nowrap" }}>
              {a.label}
            </button>
          ))}
        </div>

        {/* KPIs */}
        {dashRaw && (
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Idosos cadastrados", value: dashRaw.total_idosos, cor: "#1351b4" },
              { label: "Frágeis (IVCF)",     value: dashRaw.frageis,      cor: "#dc2626" },
              { label: "Pré-frágeis",        value: dashRaw.pre_frageis,  cor: "#d97706" },
              { label: "Com alerta",         value: dashRaw.com_alerta,   cor: "#d97706" },
              { label: "Quedas acumuladas",  value: dashRaw.quedas_acumuladas, cor: "#555" },
            ].map(k => (
              <div key={k.label} style={{ flex: 1, background: "#fff", border: "1px solid #d4d4d4", borderRadius: 4, padding: "14px 18px", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: k.cor, lineHeight: 1.1 }}>{k.value ?? "—"}</div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{k.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Conteúdo das abas */}
        {aba==="dashboard"   && <AbaDashboard dash={dash}/>}
        {aba==="idosos"      && <AbaIdosos idosos={idosos}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
