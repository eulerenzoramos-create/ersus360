import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from "recharts";
import { Pill, Package, AlertTriangle, CheckCircle, DollarSign } from "lucide-react";
import { apiGet } from "../lib/api";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };
const PROG_COR = ["#1d4ed8","#7c3aed","#ec4899","#0891b2","#16a34a"];

function KpiCard({ label, value, sub, cor, icon }: { label: string; value: string | number; sub?: string; cor: string; icon: React.ReactNode }) {
  return (
    <div style={{ background:"#fff", border:`1px solid ${cor}22`, borderTop:`3px solid ${cor}`, borderRadius:10, padding:"13px 16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:5 }}>
        <span style={{ fontSize:11, color:"#6b7280" }}>{label}</span>
        <div style={{ background:`${cor}15`, borderRadius:6, padding:5 }}>{icon}</div>
      </div>
      <div style={{ fontSize:22, fontWeight:800, color:cor, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#9ca3af", marginTop:3 }}>{sub}</div>}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function AbaDashboard({ dash }: { dash: any }) {
  if (!dash) return null;
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:22 }}>
        <KpiCard label="Itens na REMUME"     value={dash.total_medicamentos}    sub={`${dash.taxa_disponibilidade}% disponíveis`}   cor="#16a34a" icon={<Pill size={14} color="#16a34a"/>}/>
        <KpiCard label="Receitas dispensadas" value={dash.receitas_mes.toLocaleString("pt-BR")} sub="Abr/2026"               cor="#1d4ed8" icon={<Package size={14} color="#1d4ed8"/>}/>
        <KpiCard label="Itens dispensados"    value={dash.itens_dispensados_mes.toLocaleString("pt-BR")} sub="no mês"         cor="#7c3aed" icon={<Package size={14} color="#7c3aed"/>}/>
        <KpiCard label="Valor dispensado"     value={BRL(dash.valor_dispensado_mes)} sub="custo mensal"  cor="#0891b2" icon={<DollarSign size={14} color="#0891b2"/>}/>
        <KpiCard label="Estoque crítico"      value={dash.itens_criticos}        sub={`${dash.itens_atencao} em atenção`}         cor={dash.itens_criticos>0?"#dc2626":"#16a34a"} icon={<AlertTriangle size={14} color={dash.itens_criticos>0?"#dc2626":"#16a34a"}/>}/>
      </div>

      {(dash.itens_criticos_lista.length > 0 || dash.proximos_vencer.length > 0) && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
          {dash.itens_criticos_lista.length > 0 && (
            <div style={{ background:"#fff7f7", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 14px" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#dc2626", marginBottom:6 }}>Estoque crítico / atenção</div>
              {dash.itens_criticos_lista.map((m: string) => <div key={m} style={{ fontSize:12, color:"#7f1d1d", padding:"2px 0" }}>• {m}</div>)}
            </div>
          )}
          {dash.proximos_vencer.length > 0 && (
            <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:8, padding:"10px 14px" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#d97706", marginBottom:6 }}>Validade até Ago/2026</div>
              {dash.proximos_vencer.map((m: string) => <div key={m} style={{ fontSize:12, color:"#92400e", padding:"2px 0" }}>• {m}</div>)}
            </div>
          )}
        </div>
      )}

      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:18 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Dispensação mensal — últimos 6 meses</div>
        <div style={{ height:160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dash.historico_dispensacao} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="mes" tick={{ fontSize:9 }}/>
              <YAxis tick={{ fontSize:10 }}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="itens_disp" name="Itens" fill="#7c3aed" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Estoque ───────────────────────────────────────────────────────────────────
function AbaEstoque({ estoque }: { estoque: any[] | undefined }) {
  const [busca, setBusca] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("todos");
  if (!estoque) return null;
  const grupos = Array.from(new Set(estoque.map(m => m.grupo))).sort();
  const lista = estoque.filter(m =>
    (filtroGrupo==="todos" || m.grupo===filtroGrupo) &&
    (busca==="" || m.principio.toLowerCase().includes(busca.toLowerCase()))
  );
  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar medicamento..." style={{ flex:1, padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:6, fontSize:13 }}/>
        <select value={filtroGrupo} onChange={e=>setFiltroGrupo(e.target.value)} style={{ padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:6, fontSize:13 }}>
          <option value="todos">Todos grupos</option>
          {grupos.map(g=><option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div style={{ border:"1px solid #e5e7eb", borderRadius:8, overflow:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"#16a34a", color:"#fff" }}>
              <th style={{ padding:"9px 14px", textAlign:"left" }}>Princípio Ativo</th>
              <th style={{ padding:"9px 10px", textAlign:"left" }}>Forma</th>
              <th style={{ padding:"9px 10px", textAlign:"left" }}>Grupo</th>
              <th style={{ padding:"9px 10px", textAlign:"left" }}>Programa</th>
              <th style={{ padding:"9px 10px", textAlign:"right" }}>Estoque</th>
              <th style={{ padding:"9px 10px", textAlign:"right" }}>Mín.</th>
              <th style={{ padding:"9px 10px", textAlign:"right" }}>Cons./mês</th>
              <th style={{ padding:"9px 10px", textAlign:"left" }}>Validade</th>
              <th style={{ padding:"9px 10px", textAlign:"center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((m, i) => {
              const cor = m.status==="critico"?"#dc2626":m.status==="atencao"?"#d97706":"#16a34a";
              return (
                <tr key={m.id} style={{ borderTop:"1px solid #f3f4f6", background:m.status==="critico"?"#fff7f7":m.status==="atencao"?"#fffbeb":i%2===0?"#fff":"#f9fafb" }}>
                  <td style={{ padding:"9px 14px", fontWeight:600 }}>{m.principio}</td>
                  <td style={{ padding:"9px 10px", color:"#6b7280" }}>{m.forma}</td>
                  <td style={{ padding:"9px 10px", color:"#374151" }}>{m.grupo}</td>
                  <td style={{ padding:"9px 10px", fontSize:11, color:"#6b7280" }}>{m.programa}</td>
                  <td style={{ padding:"9px 10px", textAlign:"right", fontWeight:700, color:cor }}>{m.estoque.toLocaleString("pt-BR")}</td>
                  <td style={{ padding:"9px 10px", textAlign:"right", color:"#9ca3af" }}>{m.estoque_min.toLocaleString("pt-BR")}</td>
                  <td style={{ padding:"9px 10px", textAlign:"right", color:"#6b7280" }}>{m.consumo_mes}</td>
                  <td style={{ padding:"9px 10px", fontSize:11, color:m.validade<="2026-08-31"?"#d97706":"#374151" }}>{m.validade}</td>
                  <td style={{ padding:"9px 10px", textAlign:"center" }}>
                    <span style={{ background:cor+"15", color:cor, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4 }}>
                      {m.status==="critico"?"Crítico":m.status==="atencao"?"Atenção":"OK"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize:12, color:"#9ca3af", marginTop:8 }}>{lista.length} itens</div>
    </div>
  );
}

// ── Programas ─────────────────────────────────────────────────────────────────
function AbaProgramas({ programas }: { programas: any[] | undefined }) {
  if (!programas) return null;
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
        {programas.map((p, i) => {
          const cor = PROG_COR[i % PROG_COR.length];
          const ok  = p.cobertura_pct >= p.meta_pct;
          return (
            <div key={p.programa} style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ fontSize:14, fontWeight:700 }}>{p.programa}</div>
                <span style={{ background:ok?"#f0fdf4":"#fff7f7", color:ok?"#16a34a":"#dc2626", fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:5 }}>
                  {p.cobertura_pct}% {ok?"✓":"⚠"}
                </span>
              </div>
              <div style={{ display:"flex", gap:18, fontSize:12, color:"#6b7280", marginBottom:10 }}>
                <span>Pacientes: <strong style={{ color:"#374151" }}>{p.pacientes.toLocaleString("pt-BR")}</strong></span>
                <span>Itens/mês: <strong style={{ color:"#374151" }}>{p.itens_mes.toLocaleString("pt-BR")}</strong></span>
              </div>
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#9ca3af", marginBottom:4 }}>
                  <span>Cobertura</span><span>Meta: {p.meta_pct}%</span>
                </div>
                <div style={{ background:"#f3f4f6", borderRadius:6, height:10, overflow:"hidden" }}>
                  <div style={{ background:ok?cor:"#dc2626", height:"100%", width:`${Math.min(p.cobertura_pct,100)}%`, borderRadius:6 }}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8, padding:"10px 14px", fontSize:12 }}>
        Dados conforme HÓRUS/BNAFAR — Componente Básico, ciclo Abr/2026. Saldo financeiro sujeito à conferência com REMUME vigente.
      </div>
    </div>
  );
}

// ── Dispensação ───────────────────────────────────────────────────────────────
function AbaDispensacao({ hist }: { hist: any[] | undefined }) {
  if (!hist) return null;
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:18 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Receitas dispensadas / mês</div>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} barSize={26}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize:9 }}/>
                <YAxis tick={{ fontSize:10 }}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="receitas" name="Receitas" fill="#1d4ed8" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:18 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Valor dispensado R$ / mês</div>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="mes" tick={{ fontSize:9 }}/>
                <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`${BRL(v)}`}/>
                <Tooltip contentStyle={TT} formatter={(v:number)=>[BRL(v), "Valor"]}/>
                <Line type="monotone" dataKey="valor" stroke="#16a34a" strokeWidth={2.5} dot={{ r:4 }} name="Valor"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div style={{ marginTop:18, border:"1px solid #e5e7eb", borderRadius:8, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"#f9fafb", borderBottom:"2px solid #e5e7eb" }}>
              <th style={{ padding:"9px 14px", textAlign:"left" }}>Mês</th>
              <th style={{ padding:"9px 10px", textAlign:"right" }}>Receitas</th>
              <th style={{ padding:"9px 10px", textAlign:"right" }}>Itens dispensados</th>
              <th style={{ padding:"9px 10px", textAlign:"right" }}>Valor (R$)</th>
            </tr>
          </thead>
          <tbody>
            {hist.map((h, i) => (
              <tr key={h.mes} style={{ borderTop:"1px solid #f3f4f6", background:i%2===0?"#fff":"#f9fafb" }}>
                <td style={{ padding:"9px 14px", fontWeight:600 }}>{h.mes}</td>
                <td style={{ padding:"9px 10px", textAlign:"right" }}>{h.receitas.toLocaleString("pt-BR")}</td>
                <td style={{ padding:"9px 10px", textAlign:"right" }}>{h.itens_disp.toLocaleString("pt-BR")}</td>
                <td style={{ padding:"9px 10px", textAlign:"right", fontWeight:700, color:"#16a34a" }}>{BRL(h.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Aba = "dashboard"|"estoque"|"programas"|"dispensacao";

export default function AssistenciaFarmaceutica() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const { data: dash }      = useQuery({ queryKey:["af-dash"],  queryFn:()=>apiGet("/api/farmacia-basica/dashboard") as Promise<any> });
  const { data: estoque }   = useQuery({ queryKey:["af-est"],   queryFn:()=>apiGet("/api/farmacia-basica/estoque") as Promise<any[]>,     enabled:aba==="estoque" });
  const { data: programas } = useQuery({ queryKey:["af-prog"],  queryFn:()=>apiGet("/api/farmacia-basica/programas") as Promise<any[]>,   enabled:aba==="programas" });
  const { data: hist }      = useQuery({ queryKey:["af-disp"],  queryFn:()=>apiGet("/api/farmacia-basica/dispensacao") as Promise<any[]>, enabled:aba==="dispensacao" });

  const ABAS: { id: Aba; label: string }[] = [
    { id:"dashboard",   label:"Dashboard" },
    { id:"estoque",     label:"Estoque REMUME" },
    { id:"programas",   label:"Programas" },
    { id:"dispensacao", label:"Dispensação" },
  ];

  return (
    <div style={{ padding:"0 0 32px", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ background:"linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color:"#fff", padding:"20px 24px 16px", borderRadius:"0 0 16px 16px", marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, margin:"0 0 4px" }}>Assistência Farmacêutica Básica</h1>
            <p style={{ fontSize:13, opacity:.85, margin:0 }}>REMUME · HÓRUS/BNAFAR · Componente Básico · FMS Apuí/AM</p>
          </div>
          {dash && (
            <div style={{ background:"rgba(255,255,255,.15)", borderRadius:8, padding:"8px 14px", textAlign:"center" }}>
              <div style={{ fontSize:20, fontWeight:900 }}>{dash.taxa_disponibilidade}%</div>
              <div style={{ fontSize:10, opacity:.8 }}>disponibilidade</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding:"0 24px" }}>
        <div style={{ display:"flex", gap:2, marginBottom:24, borderBottom:"2px solid #dcfce7" }}>
          {ABAS.map(a=>(
            <button key={a.id} onClick={()=>setAba(a.id)} style={{ padding:"9px 18px", border:"none", background:"none", cursor:"pointer", fontSize:13, borderBottom:aba===a.id?"3px solid #1351b4":"2px solid transparent", color:aba===a.id?"#16a34a":"#6b7280", fontWeight:aba===a.id?700:400, marginBottom:-2 }}>{a.label}</button>
          ))}
        </div>
        {aba==="dashboard"   && <AbaDashboard dash={dash}/>}
        {aba==="estoque"     && <AbaEstoque estoque={estoque}/>}
        {aba==="programas"   && <AbaProgramas programas={programas}/>}
        {aba==="dispensacao" && <AbaDispensacao hist={hist}/>}
      </div>
    </div>
  );
}
