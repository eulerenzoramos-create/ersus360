import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from "recharts";
import { Activity, AlertTriangle, Users, TrendingUp } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#e4e7ec", border: "none", borderRadius: 6, color: "#f8fafc" };

const NUTRI_CORES: Record<string, string> = {
  eutrofico: "#16a34a", sobrepeso: "#d97706", obesidade: "#dc2626",
  desnutricao: "#7c3aed", baixo_peso: "#7c3aed", normal: "#16a34a",
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

function AbaDashboard({ dash }: { dash: any }) {
  if (!dash) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Crianças acomp."   value={dash.criancas_acompanhadas}  sub="< 5 anos Mar/26"       cor="#1d4ed8" icon={<Users size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Gestantes acomp."  value={dash.gestantes_acompanhadas} sub="por trimestre"          cor="#ec4899" icon={<Activity size={14} color="#ec4899"/>}/>
        <KpiCard label="Adultos/Idosos"    value={dash.adultos_acompanhados}   sub="estado nutricional"     cor="#7c3aed" icon={<TrendingUp size={14} color="#7c3aed"/>}/>
        <KpiCard label="Desnutrição <5a"   value={dash.desnutricao_criancas_pct+"%"} sub={`BF inadimp: ${dash.bf_inadimplentes_total}`} cor={dash.desnutricao_criancas_pct>10?"#dc2626":"#d97706"} icon={<AlertTriangle size={14} color={dash.desnutricao_criancas_pct>10?"#dc2626":"#d97706"}/>}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Acompanhamentos — 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico_acompanhamento}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 10 }}/>
                <Tooltip contentStyle={TT}/>
                <Line type="monotone" dataKey="criancas"       stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 3 }} name="Crianças"/>
                <Line type="monotone" dataKey="gestantes"      stroke="#ec4899" strokeWidth={1.5} dot={false}   name="Gestantes"/>
                <Line type="monotone" dataKey="adultos_idosos" stroke="#7c3aed" strokeWidth={1.5} dot={false}   name="Adultos/Idosos"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Déficit nutricional crianças por faixa etária</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.criancas_chart || []} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{ fontSize: 9 }} unit="%"/>
                <YAxis type="category" dataKey="faixa" tick={{ fontSize: 9 }} width={80}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="desnut_pct" name="Desnut." fill="#7c3aed" radius={[0,4,4,0]}/>
                <Bar dataKey="sob_pct"    name="Sobrepeso" fill="#d97706" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbaCriancas({ dados }: { dados: any[] | undefined }) {
  if (!dados) return null;
  const COLS = ["Faixa etária","Acomp.","Eutrófico","Sobrepeso","Obesidade","Desnutrição","Risco desnut."];
  return (
    <div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto", marginBottom: 18 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              {COLS.map(h => <th key={h} style={{ padding: "9px 12px", textAlign: h==="Faixa etária"?"left":"center" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {dados.map((r, i) => (
              <tr key={r.faixa} style={{ borderTop: "1px solid #f3f4f6", background: i%2===0?"#fff":"#f9fafb" }}>
                <td style={{ padding: "9px 12px", fontWeight: 600 }}>{r.faixa}</td>
                <td style={{ padding: "9px 12px", textAlign: "center" }}>{r.acomp}</td>
                <td style={{ padding: "9px 12px", textAlign: "center", color: "#16a34a", fontWeight: 700 }}>{r.eutrofico_pct}%</td>
                <td style={{ padding: "9px 12px", textAlign: "center", color: "#d97706", fontWeight: 700 }}>{r.sob_pct}%</td>
                <td style={{ padding: "9px 12px", textAlign: "center", color: "#dc2626", fontWeight: 700 }}>{r.obe_pct}%</td>
                <td style={{ padding: "9px 12px", textAlign: "center", color: "#7c3aed", fontWeight: 700 }}>{r.desnut_pct}%</td>
                <td style={{ padding: "9px 12px", textAlign: "center", color: "#0891b2" }}>{r.risco_desnut_pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Estado nutricional por faixa — % eutrófico vs déficit</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados} barSize={24}>
              <XAxis dataKey="faixa" tick={{ fontSize: 9 }}/>
              <YAxis tick={{ fontSize: 10 }} unit="%"/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="eutrofico_pct" name="Eutrófico"  fill="#16a34a" radius={[4,4,0,0]}/>
              <Bar dataKey="sob_pct"       name="Sobrepeso"  fill="#d97706" radius={[4,4,0,0]}/>
              <Bar dataKey="desnut_pct"    name="Desnutrição" fill="#7c3aed" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AbaGestantes({ dados }: { dados: any[] | undefined }) {
  if (!dados) return null;
  const barData = dados.map(g => ({
    name: g.trimestre,
    eutrofica: g.eutrofica_pct,
    sobrepeso: g.sobrepeso_pct + g.obesidade_pct,
    baixo_peso: g.baixo_peso_pct,
  }));
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Estado nutricional por trimestre gestacional</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barSize={40}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }}/>
              <YAxis tick={{ fontSize: 10 }} unit="%"/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="eutrofica"  name="Eutrófica"  fill="#16a34a" radius={[4,4,0,0]}/>
              <Bar dataKey="sobrepeso"  name="Sobrepeso/Obesidade" fill="#d97706" radius={[4,4,0,0]}/>
              <Bar dataKey="baixo_peso" name="Baixo peso" fill="#7c3aed" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {dados.map(g => (
          <div key={g.trimestre} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#ec4899" }}>{g.trimestre}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{g.acomp} gestantes</div>
            {[["Eutrófica", g.eutrofica_pct, "#16a34a"],["Sobrepeso", g.sobrepeso_pct, "#d97706"],["Obesidade", g.obesidade_pct, "#dc2626"],["Baixo peso", g.baixo_peso_pct, "#7c3aed"]].map(([k,v,c])=>(
              <div key={String(k)} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                <span>{k}</span>
                <span style={{ fontWeight: 700, color: String(c) }}>{v}%</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function AbaBolsaFamilia({ dados }: { dados: any[] | undefined }) {
  if (!dados) return null;
  const total_benef = dados.reduce((s, e) => s + e.beneficiarios, 0);
  const total_inad  = dados.reduce((s, e) => s + e.inadimplentes, 0);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
        {[["Beneficiários SISVAN",total_benef.toLocaleString("pt-BR"),"#1d4ed8"],["Inadimplentes",total_inad,"#dc2626"],["Taxa inadimpl.",Math.round(total_inad/total_benef*100)+"%","#d97706"]].map(([k,v,c])=>(
          <div key={String(k)} style={{ background: "#fff", border:`1px solid ${c}22`, borderTop:`3px solid ${c}`, borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: String(c) }}>{v}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#16a34a", color: "#fff" }}>
              {["Equipe","Beneficiários","Crianças acomp.","Gestantes acomp.","Inadimplentes"].map(h=>(
                <th key={h} style={{ padding: "8px 12px", textAlign: h==="Equipe"?"left":"center" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dados.map((e, i) => (
              <tr key={e.equipe} style={{ borderTop: "1px solid #f3f4f6", background: e.inadimplentes>25?"#fff7f7":i%2===0?"#fff":"#f9fafb" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600 }}>{e.equipe}</td>
                <td style={{ padding: "8px 12px", textAlign: "center" }}>{e.beneficiarios}</td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: e.acomp_criancas_pct>=80?"#16a34a":"#d97706", fontWeight: 700 }}>{e.acomp_criancas_pct}%</td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: e.acomp_gestantes_pct>=80?"#16a34a":"#d97706", fontWeight: 700 }}>{e.acomp_gestantes_pct}%</td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: e.inadimplentes>25?"#dc2626":"#374151", fontWeight: e.inadimplentes>25?700:400 }}>{e.inadimplentes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 14, background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        Condicionalidade nutricional Bolsa Família: crianças 0-7a e gestantes devem ter acompanhamento nutricional semestral. Inadimplência em 2 períodos consecutivos gera bloqueio do benefício (IN MDS nº 2/2021).
      </div>
    </div>
  );
}

type Aba = "dashboard"|"criancas"|"gestantes"|"bf";

export default function SISVAN() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dashRaw }   = useQuery({ queryKey: ["sisvan-dash"],  queryFn: () => apiGet("/api/sisvan/dashboard") as Promise<any> });
  const { data: criancas }  = useQuery({ queryKey: ["sisvan-cri"],   queryFn: () => apiGet("/api/sisvan/criancas")  as Promise<any[]>, enabled: aba==="criancas"||aba==="dashboard" });
  const { data: gestantes } = useQuery({ queryKey: ["sisvan-gest"],  queryFn: () => apiGet("/api/sisvan/gestantes") as Promise<any[]>, enabled: aba==="gestantes" });
  const { data: bf }        = useQuery({ queryKey: ["sisvan-bf"],    queryFn: () => apiGet("/api/sisvan/bolsa-familia") as Promise<any[]>, enabled: aba==="bf" });

  const dash = dashRaw && criancas ? {
    ...dashRaw,
    criancas_chart: criancas,
  } : null;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "criancas",  label: `Crianças < 5a (${dashRaw?.criancas_acompanhadas ?? 0})` },
    { id: "gestantes", label: "Gestantes" },
    { id: "bf",        label: "Bolsa Família" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ style_SIAPS_PLACEHOLDER }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>SISVAN — Vigilância Nutricional</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Crianças · Gestantes · Adultos/Idosos · Bolsa Família · FMS Apuí/AM</p>
          </div>
          {dashRaw && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.desnutricao_criancas_pct}%</div>
              <div style={{ fontSize: 10, opacity: .8 }}>desnutrição &lt;5a</div>
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
        {aba==="dashboard" && <AbaDashboard dash={dash}/>}
        {aba==="criancas"  && <AbaCriancas dados={criancas}/>}
        {aba==="gestantes" && <AbaGestantes dados={gestantes}/>}
        {aba==="bf"        && <AbaBolsaFamilia dados={bf}/>}
      </div>
    </div>
  );
}
