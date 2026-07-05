import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { FileText, AlertTriangle, CheckCircle, DollarSign } from "lucide-react";
import { apiGet } from "../lib/api";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };
const ST_COR: Record<string, string> = { ok: "#16a34a", atencao: "#d97706", critico: "#dc2626" };
const CONT_COR: Record<string, string> = { ativo: "#16a34a", vencendo: "#d97706", vencido: "#dc2626" };
const CAT_COR: Record<string, string> = { medicamentos: "#1d4ed8", servicos: "#7c3aed", equipamentos: "#0891b2", material: "#0f766e", obras: "#d97706", ti: "#374151" };

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
      {(dash.contratos_vencidos > 0 || dash.contratos_vencendo_30d > 0) && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#dc2626" }}>
          <strong>⚠ {dash.contratos_vencidos} contrato(s) vencido(s)</strong> sem renovação · <strong>{dash.contratos_vencendo_30d} vencendo em 30 dias</strong> — iniciar processos licitatórios imediatamente.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Contratos ativos"      value={dash.contratos_ativos}                              sub={`${dash.fornecedores_ativos} fornecedores`}    cor="#374151" icon={<FileText size={14} color="#374151"/>}/>
        <KpiCard label="Valor total mensal"    value={`R$${(dash.valor_total_mensal/1000).toFixed(1)}k`}  sub={`${dash.execucao_orcamentaria_pct}% executado`} cor="#0369a1" icon={<DollarSign size={14} color="#0369a1"/>}/>
        <KpiCard label="Vencendo em 30 dias"   value={dash.contratos_vencendo_30d}                       sub="renovação urgente"                             cor={dash.contratos_vencendo_30d>3?"#dc2626":"#d97706"} icon={<AlertTriangle size={14} color={dash.contratos_vencendo_30d>3?"#dc2626":"#d97706"}/>}/>
        <KpiCard label="Execução orçamentária" value={`${dash.execucao_orcamentaria_pct}%`}               sub="meta: 90%"                                    cor={dash.execucao_orcamentaria_pct>=90?"#16a34a":"#d97706"} icon={<CheckCircle size={14} color={dash.execucao_orcamentaria_pct>=90?"#16a34a":"#d97706"}/>}/>
      </div>
      {hist && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Evolução orçamentária — 6 meses</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }}/>
                <YAxis tick={{ fontSize: 9 }} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`}/>
                <Tooltip contentStyle={TT} formatter={(v: any) => `R$${Number(v).toLocaleString("pt-BR")}`}/>
                <Bar dataKey="valor_empenhado" name="Empenhado" fill="#1d4ed8" radius={[4,4,0,0]} opacity={0.6}/>
                <Bar dataKey="valor_pago"      name="Pago"      fill="#16a34a" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaContratos({ conts }: { conts: any[] | undefined }) {
  if (!conts) return null;
  return (
    <div>
      {conts.map(c => {
        const cor = CONT_COR[c.status] ?? "#374151";
        const catCor = CAT_COR[c.categoria] ?? "#374151";
        return (
          <div key={c.contrato} style={{ background: "#fff", border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "12px 16px", marginBottom: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <div>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "#9ca3af" }}>{c.contrato}</span>
                <span style={{ marginLeft: 8, background: catCor+"15", color: catCor, fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{c.categoria}</span>
                {c.status === "vencido"  && <span style={{ marginLeft: 4, background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>VENCIDO</span>}
                {c.status === "vencendo" && <span style={{ marginLeft: 4, background: "#fef9c3", color: "#92400e", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>VENCENDO</span>}
              </div>
              {c.valor_mensal > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>R${c.valor_mensal.toLocaleString("pt-BR",{minimumFractionDigits:2})}/mês</span>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{c.objeto}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: c.saldo_pct > 0 ? 6 : 0 }}>Fornecedor: {c.fornecedor} · {c.inicio} → {c.termino}</div>
            {c.saldo_pct > 0 && (
              <div>
                <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 3 }}>Saldo contratual: {c.saldo_pct}%</div>
                <div style={{ background: "#f3f4f6", borderRadius: 6, height: 6 }}>
                  <div style={{ background: c.saldo_pct < 20 ? "#dc2626" : c.saldo_pct < 50 ? "#d97706" : "#16a34a", height: "100%", width: `${c.saldo_pct}%`, borderRadius: 6 }}/>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AbaFornecedores({ forn }: { forn: any[] | undefined }) {
  if (!forn) return null;
  const maxVal = Math.max(...forn.map(f => f.valor_total_mes));
  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Fornecedores ativos — avaliação e ocorrências</div>
        {forn.map(f => {
          const av = f.avaliacao;
          const avCor = av >= 8.5 ? "#16a34a" : av >= 7 ? "#d97706" : "#dc2626";
          return (
            <div key={f.fornecedor} style={{ marginBottom: 12, background: f.ocorrencias >= 3 ? "#fef2f2" : "#f9fafb", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{f.fornecedor}</span>
                  {!f.registro_anvisa && <span style={{ marginLeft: 6, background: "#fef9c3", color: "#92400e", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>Sem ANVISA</span>}
                  {f.ocorrencias >= 3 && <span style={{ marginLeft: 4, background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>{f.ocorrencias} ocorrências</span>}
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                  <span style={{ color: "#6b7280" }}>R${(f.valor_total_mes/1000).toFixed(1)}k/mês</span>
                  <span style={{ fontWeight: 700, color: avCor }}>⭐ {f.avaliacao}</span>
                </div>
              </div>
              <div style={{ background: "#e5e7eb", borderRadius: 6, height: 7 }}>
                <div style={{ background: avCor, height: "100%", width: `${(f.valor_total_mes / maxVal) * 100}%`, borderRadius: 6 }}/>
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

type Aba = "dashboard"|"contratos"|"fornecedores"|"indicadores";

export default function Contratos() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash } = useQuery({ queryKey: ["ct-dash"], queryFn: () => apiGet("/api/contratos/dashboard")    as Promise<any> });
  const { data: hist } = useQuery({ queryKey: ["ct-hist"], queryFn: () => apiGet("/api/contratos/historico")    as Promise<any[]>, enabled: aba==="dashboard" });
  const { data: conts} = useQuery({ queryKey: ["ct-con"],  queryFn: () => apiGet("/api/contratos/contratos")    as Promise<any[]>, enabled: aba==="contratos" });
  const { data: forn } = useQuery({ queryKey: ["ct-for"],  queryFn: () => apiGet("/api/contratos/fornecedores") as Promise<any[]>, enabled: aba==="fornecedores" });
  const { data: inds } = useQuery({ queryKey: ["ct-ind"],  queryFn: () => apiGet("/api/contratos/indicadores")  as Promise<any[]>, enabled: aba==="indicadores" });

  const dashRaw = dash as any;

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",    label: "Dashboard" },
    { id: "contratos",    label: `Contratos (${dashRaw?.contratos_ativos ?? 0})` },
    { id: "fornecedores", label: "Fornecedores" },
    { id: "indicadores",  label: "Indicadores" },
  ];

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#0369a1 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Gestão de Contratos</h1>
            <p style={{ fontSize: 13, opacity: .85, margin: 0 }}>Contratos · Convênios · Fornecedores · Licitações · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 900 }}>R${(dashRaw.valor_total_mensal/1000).toFixed(1)}k</div>
                <div style={{ fontSize: 10, opacity: .8 }}>valor/mês</div>
              </div>
              <div style={{ background: dashRaw.contratos_vencidos>0?"rgba(220,38,38,.35)":"rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{dashRaw.contratos_ativos}</div>
                <div style={{ fontSize: 10, opacity: .8 }}>contratos ativos</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #dbeafe" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{ padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderBottom: aba===a.id?"2px solid #0369a1":"2px solid transparent", color: aba===a.id?"#0369a1":"#6b7280", fontWeight: aba===a.id?700:400, marginBottom: -2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"    && <AbaDashboard dash={dashRaw} hist={hist}/>}
        {aba==="contratos"    && <AbaContratos conts={conts}/>}
        {aba==="fornecedores" && <AbaFornecedores forn={forn}/>}
        {aba==="indicadores"  && <AbaIndicadores inds={inds}/>}
      </div>
    </div>
  );
}
