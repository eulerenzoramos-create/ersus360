import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell, PieChart, Pie } from "recharts";
import { Users, AlertTriangle, Activity, CheckCircle } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#e4e7ec", border: "none", borderRadius: 6, color: "#f8fafc" };
const STATUS_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const INT_CORES = ["#1d4ed8","#dc2626","#7c3aed","#0891b2","#d97706","#9ca3af"];

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
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Consultas/mês"        value={dash.consultas_mes}        sub="médicas + enfermagem"       cor="#1d4ed8" icon={<Users size={14} color="#1d4ed8"/>}/>
        <KpiCard label="PSA realizados"        value={dash.psa_mes}              sub="Mar/26"                     cor="#7c3aed" icon={<Activity size={14} color="#7c3aed"/>}/>
        <KpiCard label="Testagem IST"          value={dash.testagem_ist_mes}     sub="rastreio Mar/26"            cor="#0891b2" icon={<CheckCircle size={14} color="#0891b2"/>}/>
        <KpiCard label="Indic. críticos"       value={dash.indicadores_criticos} sub="PNAISH"                     cor="#dc2626" icon={<AlertTriangle size={14} color="#dc2626"/>}/>
        <KpiCard label="Ações PNAISH ativas"   value={`${dash.acoes_ativas}/${dash.acoes_total}`} sub="em andamento" cor="#16a34a" icon={<CheckCircle size={14} color="#16a34a"/>}/>
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Produção mensal PNAISH — 6 meses</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dash.historico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
              <YAxis tick={{ fontSize: 10 }}/>
              <Tooltip contentStyle={TT}/>
              <Line type="monotone" dataKey="consultas_medicas" stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 3 }} name="Consultas médicas"/>
              <Line type="monotone" dataKey="consultas_enf"     stroke="#7c3aed" strokeWidth={1.5} dot={false}   name="Consultas enfermagem"/>
              <Line type="monotone" dataKey="preventivo_psa"    stroke="#d97706" strokeWidth={1.5} dot={false}   name="PSA"/>
              <Line type="monotone" dataKey="testagem_ist"      stroke="#0891b2" strokeWidth={1.5} dot={false}   name="Testagem IST"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ind.indicador}</span>
                    {ind.observacao && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{ind.observacao}</div>}
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{ind.valor}%</span>
                    <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>meta: {ind.meta}%</span>
                  </div>
                </div>
                <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7 }}>
                  <div style={{ background: cor, height: "100%", width: `${Math.min(100, Math.round(ind.valor/ind.meta*100))}%`, borderRadius: 6 }}/>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function AbaInternacoes({ internacoes }: { internacoes: any[] | undefined }) {
  if (!internacoes) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Causas de internação masculina 2026</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={internacoes} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{ fontSize: 9 }}/>
                <YAxis type="category" dataKey="causa" tick={{ fontSize: 8 }} width={150}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="casos" name="Casos" radius={[0,4,4,0]}>
                  {internacoes.map((_: any, i: number) => <Cell key={i} fill={INT_CORES[i]||"#6b7280"}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>% por grupo de causas</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={internacoes} dataKey="pct" nameKey="causa" cx="50%" cy="50%" outerRadius={80} label={({ name, pct }: any) => `${pct}%`}>
                  {internacoes.map((_: any, i: number) => <Cell key={i} fill={INT_CORES[i]||"#6b7280"}/>)}
                </Pie>
                <Tooltip contentStyle={TT} formatter={(v: any, n: any) => [`${v}%`, n]}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              {["Causa","Casos","% do total","Variação 12m"].map(h=><th key={h} style={{ padding: "8px 12px", textAlign: h==="Causa"?"left":"center" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {internacoes.map((r, i) => (
              <tr key={r.causa} style={{ borderTop: "1px solid #f3f4f6", background: i%2===0?"#fff":"#f9fafb" }}>
                <td style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: INT_CORES[i]||"#6b7280", display: "inline-block", flexShrink: 0 }}/>
                  {r.causa}
                </td>
                <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700 }}>{r.casos}</td>
                <td style={{ padding: "8px 12px", textAlign: "center" }}>{r.pct}%</td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: r.variacao_12m.startsWith("+")?"#dc2626":r.variacao_12m.startsWith("-")?"#16a34a":"#9ca3af", fontWeight: 600 }}>{r.variacao_12m}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AbaAcoes({ acoes }: { acoes: any[] | undefined }) {
  if (!acoes) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {acoes.map((a, i) => (
          <div key={i} style={{ background: "#fff", border: `1px solid ${a.realizado?"#16a34a22":"#dc262622"}`, borderLeft: `4px solid ${a.realizado?"#16a34a":"#dc2626"}`, borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{a.acao}</div>
              <span style={{ background: a.realizado?"#dcfce7":"#fef2f2", color: a.realizado?"#16a34a":"#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, flexShrink: 0 }}>{a.realizado?"Ativo":"Pendente"}</span>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Freq.: <strong>{a.frequencia}</strong> · Último: <strong>{a.ultimo}</strong>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, background: "#dbeafe", border: "1px solid #93c5fd", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        <strong>PNAISH</strong> — Política Nacional de Atenção Integral à Saúde do Homem (Portaria GM/MS 1.944/2009). Homens buscam menos os serviços de saúde: consultas masculinas representam apenas 31% das consultas APS em Apuí/AM. Meta nacional: 50%.
      </div>
    </div>
  );
}

type Aba = "dashboard"|"indicadores"|"internacoes"|"acoes";

export default function SaudeHomem() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash }   = useQuery({ queryKey: ["hom-dash"],  queryFn: () => apiGet("/api/saude-homem/dashboard")   as Promise<any> });
  const { data: hist }   = useQuery({ queryKey: ["hom-hist"],  queryFn: () => apiGet("/api/saude-homem/producao")    as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: inds }   = useQuery({ queryKey: ["hom-ind"],   queryFn: () => apiGet("/api/saude-homem/indicadores") as Promise<any[]>, enabled: aba==="indicadores" });
  const { data: intrs }  = useQuery({ queryKey: ["hom-int"],   queryFn: () => apiGet("/api/saude-homem/internacoes") as Promise<any[]>, enabled: aba==="internacoes" });
  const { data: acoes }  = useQuery({ queryKey: ["hom-acao"],  queryFn: () => apiGet("/api/saude-homem/acoes")       as Promise<any[]>, enabled: aba==="acoes" });

  const dashFull = dash && hist ? { ...dash, historico: hist } : null;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",    label: "Dashboard" },
    { id: "indicadores",  label: `Indicadores (${(dash as any)?.indicadores_criticos ?? 0} críticos)` },
    { id: "internacoes",  label: "Internações" },
    { id: "acoes",        label: "Ações PNAISH" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1d4ed8 0%,#0891b2 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Saúde do Homem</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>PNAISH · PSA · Próstata · Novembro Azul · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{(dash as any).consultas_mes}</div>
              <div style={{ fontSize: 10, opacity: .8 }}>consultas/mês</div>
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
        {aba==="dashboard"   && <AbaDashboard dash={dashFull}/>}
        {aba==="indicadores" && <AbaIndicadores inds={inds}/>}
        {aba==="internacoes" && <AbaInternacoes internacoes={intrs}/>}
        {aba==="acoes"       && <AbaAcoes acoes={acoes}/>}
      </div>
    </div>
  );
}
