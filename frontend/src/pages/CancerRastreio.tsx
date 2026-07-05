import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";
import { Search, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const SIT_COR: Record<string, string> = {
  "encaminhado":        "#7c3aed",
  "em acompanhamento":  "#1d4ed8",
  "acompanhamento":     "#16a34a",
  "aguardando retorno": "#d97706",
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

function AbaDashboard({ dash, colo, mama }: { dash: any; colo: any[] | undefined; mama: any[] | undefined }) {
  if (!dash) return null;
  const series = colo && mama ? colo.map((c, i) => ({ mes: c.competencia, colo_pct: c.cobertura_pct, mama_pct: mama[i]?.cobertura_pct ?? 0 })) : [];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Cobertura colo do útero"  value={dash.colo_utero_cobertura_pct+"%"} sub="25-64 anos"             cor={STATUS_COR[dash.colo_utero_status]}  icon={<Search size={14} color={STATUS_COR[dash.colo_utero_status]}/>}/>
        <KpiCard label="Cobertura mamografia"      value={dash.mama_cobertura_pct+"%"}       sub="50-69 anos"             cor={STATUS_COR[dash.mama_status]}         icon={<Search size={14} color={STATUS_COR[dash.mama_status]}/>}/>
        <KpiCard label="Alterações detectadas"     value={dash.alteracoes_detectadas}         sub="encaminhados: "+dash.encaminhamentos_referencia  cor="#d97706"   icon={<AlertTriangle size={14} color="#d97706"/>}/>
        <KpiCard label="Aguard. resultado"         value={dash.exames_aguardando_resultado}    sub=">30 dias pendentes"   cor="#6b7280"                              icon={<Clock size={14} color="#6b7280"/>}/>
      </div>
      {series.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Cobertura de rastreio — 6 meses (%)</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 80]}/>
                <Tooltip contentStyle={TT} formatter={(v: any) => `${v}%`}/>
                <Line type="monotone" dataKey="colo_pct"  stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} name="Colo do útero"/>
                <Line type="monotone" dataKey="mama_pct"  stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3 }} name="Mama"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaRastreio({ tipo, dados }: { tipo: "colo"|"mama"; dados: any[] | undefined }) {
  if (!dados) return null;
  const cor    = tipo === "colo" ? "#dc2626" : "#7c3aed";
  const label  = tipo === "colo" ? "Colo do útero" : "Mama";
  const barKey = tipo === "colo" ? "coletados" : "exames";
  const ult    = dados[dados.length - 1];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
        {[
          ["Elegíveis", ult.elegiveis, "#374151"],
          [tipo==="colo"?"Coletados":"Exames", ult[barKey], cor],
          ["Cobertura", `${ult.cobertura_pct}%`, ult.cobertura_pct<50?"#dc2626":"#d97706"],
          ["Alterações", ult.alteracoes, ult.alteracoes>0?"#d97706":"#16a34a"],
        ].map(([k,v,c]) => (
          <div key={String(k)} style={{ background: "#fff", border: `1px solid ${c}22`, borderTop: `3px solid ${c}`, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: String(c) }}>{v}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{k}</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>Mar/26</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{label} — histórico 6 meses</div>
        <div style={{ height: 190 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="competencia" tick={{ fontSize: 9 }}/>
              <YAxis yAxisId="l" tick={{ fontSize: 10 }}/>
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9 }} unit="%"/>
              <Tooltip contentStyle={TT}/>
              <Bar yAxisId="l" dataKey={barKey}    name="Realizados" fill={cor} radius={[4,4,0,0]}/>
              <Bar yAxisId="l" dataKey="alteracoes" name="Alterações" fill="#d97706" radius={[4,4,0,0]}/>
              <Line yAxisId="r" type="monotone" dataKey="cobertura_pct" stroke="#374151" strokeWidth={2} dot={{ r: 2 }} name="Cobertura %"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AbaCasos({ casos }: { casos: any[] | undefined }) {
  if (!casos) return null;
  const tipos = ["Colo do útero", "Mama", "Próstata"];
  return (
    <div>
      {tipos.map(tipo => {
        const grupo = casos.filter(c => c.tipo === tipo);
        if (!grupo.length) return null;
        const cor = tipo === "Colo do útero" ? "#dc2626" : tipo === "Mama" ? "#7c3aed" : "#1d4ed8";
        return (
          <div key={tipo} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: cor, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 1 }}>{tipo}</div>
            {grupo.map(c => (
              <div key={c.id} style={{ background: "#fff", border: `1px solid ${c.alerta?"#dc262222":"#e5e7eb"}`, borderLeft: `4px solid ${SIT_COR[c.situacao]||cor}`, borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{c.id}</span>
                    <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600 }}>{c.resultado}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span style={{ background: (SIT_COR[c.situacao]||cor)+"15", color: SIT_COR[c.situacao]||cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{c.situacao}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{c.data} · {c.encaminhamento} · ESF: {c.esf}</div>
                {c.alerta && <div style={{ marginTop: 6, background: "#fef2f2", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>⚠ {c.alerta}</div>}
              </div>
            ))}
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
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Indicadores SISCAN / INCA</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inds.filter(i=>typeof i.valor==="number"&&i.meta&&i.meta>1)} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fontSize: 9 }} unit="%" domain={[0,100]}/>
              <YAxis type="category" dataKey="indicador" tick={{ fontSize: 9 }} width={220}/>
              <Tooltip contentStyle={TT} formatter={(v: any)=>`${v}%`}/>
              <Bar dataKey="valor" name="Realizado" radius={[0,4,4,0]}>
                {inds.filter(i=>typeof i.valor==="number"&&i.meta&&i.meta>1).map((ind, i) => <Cell key={i} fill={STATUS_COR[ind.status]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

type Aba = "dashboard"|"colo"|"mama"|"casos"|"indicadores";

export default function CancerRastreio() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash }  = useQuery({ queryKey: ["cr-dash"],  queryFn: () => apiGet("/api/cancer-rastreio/dashboard")       as Promise<any> });
  const { data: colo }  = useQuery({ queryKey: ["cr-colo"],  queryFn: () => apiGet("/api/cancer-rastreio/colo-utero")      as Promise<any[]>, enabled: aba==="dashboard"||aba==="colo" });
  const { data: mama }  = useQuery({ queryKey: ["cr-mama"],  queryFn: () => apiGet("/api/cancer-rastreio/mama")            as Promise<any[]>, enabled: aba==="dashboard"||aba==="mama" });
  const { data: casos } = useQuery({ queryKey: ["cr-casos"], queryFn: () => apiGet("/api/cancer-rastreio/casos-alterados") as Promise<any[]>, enabled: aba==="casos" });
  const { data: inds }  = useQuery({ queryKey: ["cr-ind"],   queryFn: () => apiGet("/api/cancer-rastreio/indicadores")     as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",   label: "Dashboard" },
    { id: "colo",        label: `Colo do Útero (${dashRaw?.colo_utero_cobertura_pct ?? 0}%)` },
    { id: "mama",        label: `Mama (${dashRaw?.mama_cobertura_pct ?? 0}%)` },
    { id: "casos",       label: `Casos Alterados (${dashRaw?.alteracoes_detectadas ?? 0})` },
    { id: "indicadores", label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#be185d 0%,#ec4899 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Rastreio de Câncer</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>SISCAN · INCA · Colo do útero · Mama · Próstata · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.alteracoes_detectadas}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>alterações detec.</div>
              </div>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.encaminhamentos_referencia}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>encaminhamentos</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #fce7f3" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #be185d":"2px solid transparent", color: aba===a.id?"#be185d":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"   && <AbaDashboard dash={dashRaw} colo={colo} mama={mama}/>}
        {aba==="colo"        && <AbaRastreio tipo="colo" dados={colo}/>}
        {aba==="mama"        && <AbaRastreio tipo="mama" dados={mama}/>}
        {aba==="casos"       && <AbaCasos casos={casos}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
