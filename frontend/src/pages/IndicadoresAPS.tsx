/**
 * Indicadores APS — PEC, SIAPS e Cofinanciamento
 * Módulo eGestor · ERSUS 360
 *
 * Três camadas obrigatórias (Portaria 3.493/2024 · SIAPS):
 *   A. Operacional Diário     — fonte e-SUS APS/PEC   (verde  #16a34a)
 *   B. Monitoramento Mensal   — fonte SIAPS            (azul   #1d4ed8)
 *   C. Avaliação Quadrimestral— resultado oficial      (roxo   #7c3aed)
 *
 * Regra: dado diário PEC NUNCA é apresentado como resultado oficial do SIAPS.
 */
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Star, TrendingUp, AlertTriangle, CheckCircle,
  RefreshCw, Download, Info, Calendar, Database, Activity,
  BarChart2, Clock, Shield, ChevronDown, ChevronRight,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";

// ── Constantes de Identidade Visual (Seção 16) ────────────────────────────────
const COR = {
  OPERACIONAL:     "#16a34a",  // verde  — PEC
  MENSAL:          "#1d4ed8",  // azul   — SIAPS oficial
  QUADRIMESTRAL:   "#7c3aed",  // roxo   — resultado oficial
  PRELIMINAR:      "#d97706",  // amarelo — preliminar
  INCONSISTENCIA:  "#dc2626",  // vermelho — erro/risco
  INDISPONIVEL:    "#6b7280",  // cinza  — sem dado
  REFERENCIA:      "#0891b2",  // ciano  — referência municipal
};

const LABEL_FONTE: Record<string, string> = {
  operacional:        "Estimativa operacional — fonte e-SUS APS/PEC",
  mensal:             "Resultado mensal preliminar do SIAPS",
  quadrimestral:      "Resultado oficial da avaliação quadrimestral",
  referencia_municipal: "Referência municipal — não substitui resultado oficial do SIAPS",
};

const COR_PONT = (p: number) =>
  p > 8.5 ? "#1d4ed8" : p >= 7 ? "#16a34a" : p >= 5 ? "#d97706" : "#dc2626";
const LABEL_PONT = (p: number) =>
  p > 8.5 ? "Ótimo" : p >= 7 ? "Bom" : p >= 5 ? "Suficiente" : "Regular";
const BG_PONT = (p: number) =>
  p > 8.5 ? "#eff6ff" : p >= 7 ? "#f0fdf4" : p >= 5 ? "#fffbeb" : "#fff7f7";

// ── Meses / Helpers ───────────────────────────────────────────────────────────
const MESES_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const compLabel = (c: string) => {
  try { const [a,m]=c.split("-"); return `${MESES_PT[+m-1]}/${a}`; } catch { return c; }
};
const compAtual = () => {
  const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
};

// Variáveis A–K CVAT com descrição oficial
const VARIAVEIS_CVAT = [
  {key:"A", nome:"Pessoas somente com Cadastro Individual atualizado",         pts:"0,75 pts/pessoa"},
  {key:"B", nome:"Pessoas com Cadastro Individual e Domiciliar atualizado",    pts:"1,5 pts/pessoa"},
  {key:"C", nome:"Total de pessoas com Cadastro (A + B)",                      pts:"—"},
  {key:"D", nome:"Pessoas acompanhadas sem critério prioritário",              pts:"1 pt/pessoa"},
  {key:"E", nome:"Crianças e idosos acompanhados",                             pts:"1,2 pts/pessoa"},
  {key:"F", nome:"Beneficiários BPC ou PBF acompanhados",                     pts:"1,3 pts/equipe"},
  {key:"G", nome:"Crianças e idosos beneficiários BPC ou PBF acompanhados",   pts:"2,5 pts/pessoa"},
  {key:"H", nome:"Total de pessoas Acompanhadas",                              pts:"—"},
  {key:"I", nome:"Atendimentos sujeitos à Avaliação de Satisfação",           pts:"—"},
  {key:"J", nome:"Atendimentos com Avaliação de Satisfação (>5%→0,3; ≤5%→0,15)", pts:"variável"},
  {key:"K", nome:"Pessoas vinculadas à Equipe",                               pts:"—"},
];

// ── Componente: Badge de Fonte ─────────────────────────────────────────────────
function BadgeFonte({ tipo, situacao }: { tipo: string; situacao?: string }) {
  const sit = situacao || tipo;
  const COR_BG: Record<string,string> = {
    operacional:          "#f0fdf4", mensal: "#eff6ff", quadrimestral: "#faf5ff",
    preliminar:           "#fffbeb", referencia_municipal: "#f0f9ff",
    nao_disponivel:       "#f9fafb", oficial: "#faf5ff",
  };
  const COR_TEXT: Record<string,string> = {
    operacional:          "#15803d", mensal: "#1d4ed8", quadrimestral: "#7c3aed",
    preliminar:           "#92400e", referencia_municipal: "#0369a1",
    nao_disponivel:       "#6b7280", oficial: "#7c3aed",
  };
  const ICONE: Record<string,string> = {
    operacional:"🟢", mensal:"🔵", quadrimestral:"🟣",
    preliminar:"🟡", referencia_municipal:"🔷", nao_disponivel:"⚫", oficial:"🟣",
  };
  const label = LABEL_FONTE[sit] ?? sit;
  const bg   = COR_BG[sit]   ?? "#f9fafb";
  const cor  = COR_TEXT[sit] ?? "#6b7280";
  const ico  = ICONE[sit]    ?? "⚪";
  return (
    <span style={{
      background: bg, color: cor, border: `1px solid ${cor}33`,
      borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600,
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span>{ico}</span>{label}
    </span>
  );
}

// ── Componente: Card KPI ────────────────────────────────────────────────────────
function KpiCard({ label, valor, cor, sub }: { label:string; valor:any; cor:string; sub?:string }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${cor}22`,
      borderTop: `3px solid ${cor}`, borderRadius: 10,
      padding: "14px 16px", textAlign: "center",
    }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: cor, fontVariantNumeric:"tabular-nums" }}>{valor}</div>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Seção: Faixa de identificação da camada ────────────────────────────────────
function FaixaCamada({ tipo, situacao, dataExtracao }: {tipo:string; situacao?:string; dataExtracao?:string}) {
  const COR_FAIXA: Record<string,string> = {
    operacional: COR.OPERACIONAL, mensal: COR.MENSAL,
    quadrimestral: COR.QUADRIMESTRAL, referencia_municipal: COR.REFERENCIA,
  };
  const sit = situacao || tipo;
  const cor = COR_FAIXA[sit] ?? COR.INDISPONIVEL;
  return (
    <div style={{
      background: `${cor}10`, border: `1px solid ${cor}40`,
      borderLeft: `4px solid ${cor}`, borderRadius: 8,
      padding: "10px 16px", marginBottom: 16,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <BadgeFonte tipo={tipo} situacao={situacao} />
        {dataExtracao && (
          <span style={{fontSize:11, color:"#9ca3af"}}>Extração: {new Date(dataExtracao).toLocaleString("pt-BR")}</span>
        )}
      </div>
      <span style={{fontSize:11, color:"#9ca3af", fontStyle:"italic"}}>
        {sit === "operacional" ? "Dado sujeito a alteração — não substitui resultado oficial do SIAPS" :
         sit === "referencia_municipal" ? "Dado de referência — importe via SIAPS para atualização" :
         sit === "preliminar" ? "Resultado preliminar — sujeito a consolidação pelo MS" :
         sit === "oficial" ? "Resultado oficial publicado pelo Ministério da Saúde" : ""}
      </span>
    </div>
  );
}

// ── Aba: CVAT (Componente Vínculo e Acompanhamento) ───────────────────────────
function AbaCvat({ competencia, ibge }: { competencia:string; ibge:string }) {
  const [showVars, setShowVars] = useState(false);
  const [expandEq, setExpandEq] = useState<string|null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ind-aps-cvat", ibge, competencia],
    queryFn: () => apiGet("/api/indicadores-aps/cvat", { ibge, competencia }) as Promise<any>,
    staleTime: 300_000,
  });

  if (isLoading) return <div style={{padding:48,textAlign:"center",color:"#9ca3af"}}>Carregando CVAT...</div>;

  if (!data?.disponivel) return (
    <div style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:12,padding:32,textAlign:"center"}}>
      <Database size={36} color="#9ca3af" style={{marginBottom:12}} />
      <div style={{fontSize:15,fontWeight:700,color:"#374151",marginBottom:8}}>Dados CVAT não importados</div>
      <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>{data?.nota}</div>
      <div style={{fontSize:12,color:"#9ca3af"}}>
        Competência: {compLabel(competencia)} · IBGE: {ibge}
      </div>
    </div>
  );

  const d = data;
  const equipes = d.equipes ?? [];

  return (
    <div>
      <FaixaCamada tipo="mensal" situacao={d.situacao} dataExtracao={d.data_extracao} />

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
        <KpiCard label="Equipes" valor={d.total_equipes} cor={COR.MENSAL} />
        <KpiCard label="Pessoas vinculadas" valor={(d.total_pessoas_vinculadas||0).toLocaleString("pt-BR")} cor="#7c3aed" />
        <KpiCard label="Pessoas acompanhadas" valor={(d.total_pessoas_acompanhadas||0).toLocaleString("pt-BR")} cor={COR.OPERACIONAL} />
        <KpiCard label="Pontuação média" valor={(d.pontuacao_media||0).toFixed(2)} cor={COR_PONT(d.pontuacao_media||0)} sub={LABEL_PONT(d.pontuacao_media||0)} />
        <KpiCard label="IED municipal" valor={d.ied||"—"} cor={COR.PRELIMINAR} />
      </div>

      {/* Distribuição por classificação */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20}}>
        {[
          {label:"Ótimo (> 8,5)",      n:d.por_status?.otimo||0,      cor:"#1d4ed8",bg:"#eff6ff"},
          {label:"Bom (7,0–8,5)",      n:d.por_status?.bom||0,        cor:"#16a34a",bg:"#f0fdf4"},
          {label:"Suficiente (5,0–6,9)",n:d.por_status?.suficiente||0, cor:"#d97706",bg:"#fffbeb"},
          {label:"Regular (< 5,0)",    n:d.por_status?.regular||0,    cor:"#dc2626",bg:"#fff7f7"},
        ].map(s=>(
          <div key={s.label} style={{background:s.bg,border:`1px solid ${s.cor}22`,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:s.cor,fontWeight:600}}>{s.label}</span>
            <span style={{fontSize:22,fontWeight:800,color:s.cor}}>{s.n}</span>
          </div>
        ))}
      </div>

      {/* Botão expandir variáveis A–K */}
      <button onClick={()=>setShowVars(v=>!v)}
        style={{display:"flex",alignItems:"center",gap:6,background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:600,marginBottom:16}}>
        {showVars ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
        Legenda das variáveis A–K (Portaria 3.493/2024)
      </button>

      {showVars && (
        <div style={{background:"#f8faff",border:"1px solid #dbeafe",borderRadius:10,padding:16,marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:"#1d4ed8",marginBottom:10}}>Variáveis do Componente Vínculo e Acompanhamento Territorial</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#eff6ff"}}>
                {["Var.","Descrição oficial","Pontuação"].map(h=>(
                  <th key={h} style={{padding:"6px 10px",textAlign:"left",fontWeight:700,color:"#1e40af",borderBottom:"1px solid #bfdbfe"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VARIAVEIS_CVAT.map(v=>(
                <tr key={v.key} style={{borderBottom:"1px solid #f0f4ff"}}>
                  <td style={{padding:"5px 10px",fontWeight:800,color:"#1d4ed8"}}>{v.key}</td>
                  <td style={{padding:"5px 10px",color:"#374151"}}>{v.nome}</td>
                  <td style={{padding:"5px 10px",color:"#6b7280"}}>{v.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabela de equipes */}
      <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden"}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid #f3f4f6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontWeight:700,fontSize:13}}>Resultado por Equipe — CVAT · {compLabel(competencia)}</span>
          <span style={{fontSize:11,color:"#9ca3af"}}>Fonte: {d.fonte} · {d.situacao}</span>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#f9fafb"}}>
                {["Equipe","UBS","Tipo","INE","Parâm.","A","B","C","D","E","F","G","H","I","J","K","Pontuação","Classif."].map(h=>(
                  <th key={h} style={{padding:"8px 10px",textAlign:h==="Equipe"||h==="UBS"?"left":"right",fontSize:11,fontWeight:600,color:"#6b7280",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {equipes.map((eq:any,i:number)=>{
                const cls = eq.classificacao || eq.status || "";
                const cor = cls==="otimo"?"#1d4ed8":cls==="bom"?"#16a34a":cls==="suficiente"?"#d97706":"#dc2626";
                return (
                  <tr key={i} style={{borderTop:"1px solid #f3f4f6",background:i%2===0?"#fff":"#fafafa"}}>
                    <td style={{padding:"7px 10px",fontWeight:700,whiteSpace:"nowrap"}}>{eq.equipe}</td>
                    <td style={{padding:"7px 10px",fontSize:11,color:"#6b7280",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{eq.ubs}</td>
                    <td style={{padding:"7px 10px",textAlign:"center"}}>{eq.tipo}</td>
                    <td style={{padding:"7px 10px",textAlign:"right",fontFamily:"monospace",fontSize:11,color:"#9ca3af"}}>{eq.ine}</td>
                    <td style={{padding:"7px 10px",textAlign:"right"}}>{(eq.parametro||0).toLocaleString("pt-BR")}</td>
                    {["A","B","C","D","E","F","G","H","I","J","K"].map(v=>(
                      <td key={v} style={{padding:"7px 10px",textAlign:"right",color:["H","K"].includes(v)?"#1d4ed8":"inherit",fontWeight:["H","K"].includes(v)?700:400}}>
                        {(eq[v]||0).toLocaleString("pt-BR")}
                      </td>
                    ))}
                    <td style={{padding:"7px 10px",textAlign:"right",fontWeight:800,color:cor}}>
                      {(eq.pontuacao||0).toFixed(2)}
                    </td>
                    <td style={{padding:"7px 10px",textAlign:"center"}}>
                      <span style={{background:BG_PONT(eq.pontuacao||0),color:cor,fontWeight:700,fontSize:11,padding:"2px 8px",borderRadius:4}}>
                        {LABEL_PONT(eq.pontuacao||0)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{marginTop:10,fontSize:11,color:"#9ca3af"}}>
        Fonte: {d.fonte==="referencia_municipal" ? "Referência municipal Apuí/AM · Dado confirmado e-Gestor/SIAPS" : "SIAPS — Ministério da Saúde"}
        {" · "}IBGE {ibge} · Competência {compLabel(competencia)}
        {d.nota && <span style={{color:"#d97706",marginLeft:8}}>⚠ {d.nota}</span>}
      </div>
    </div>
  );
}

// ── Aba: Operacional PEC ───────────────────────────────────────────────────────
function AbaOperacional({ competencia, ibge }: {competencia:string; ibge:string}) {
  return (
    <div>
      <FaixaCamada tipo="operacional" situacao="operacional" />
      <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:32,textAlign:"center"}}>
        <Activity size={36} color={COR.OPERACIONAL} style={{marginBottom:12}} />
        <div style={{fontSize:15,fontWeight:700,color:"#15803d",marginBottom:8}}>
          Dados operacionais diários — e-SUS APS/PEC
        </div>
        <div style={{fontSize:13,color:"#166534",marginBottom:16}}>
          Configure <code style={{background:"#dcfce7",padding:"1px 6px",borderRadius:4}}>ESUS_USUARIO</code> e{" "}
          <code style={{background:"#dcfce7",padding:"1px 6px",borderRadius:4}}>ESUS_SENHA</code>{" "}
          no Railway para ativar o acompanhamento operacional diário do PEC.
        </div>
        <div style={{fontSize:12,color:"#9ca3af"}}>
          Os dados operacionais incluem: cadastros, atendimentos, visitas domiciliares,
          procedimentos, vacinação, pré-natal, condições crônicas e fichas pendentes.
        </div>
        <div style={{marginTop:16,fontSize:11,color:"#d97706",fontWeight:600}}>
          ⚠ Dados do PEC são ESTIMATIVAS OPERACIONAIS — nunca substituem o resultado oficial do SIAPS.
        </div>
      </div>
    </div>
  );
}

// ── Aba: Quadrimestral ─────────────────────────────────────────────────────────
function AbaQuadrimestral({ competencia, ibge }: {competencia:string; ibge:string}) {
  const ano = parseInt(competencia.split("-")[0] || String(new Date().getFullYear()));
  const mes = parseInt(competencia.split("-")[1] || "1");
  const q   = mes <= 4 ? 1 : mes <= 8 ? 2 : 3;
  const meses = q===1?["Jan","Fev","Mar","Abr"]:q===2?["Mai","Jun","Jul","Ago"]:["Set","Out","Nov","Dez"];

  const { data, isLoading } = useQuery({
    queryKey: ["ind-aps-quad", ibge, ano, q],
    queryFn: () => apiGet("/api/indicadores-aps/quadrimestral", { ibge, ano, q }) as Promise<any>,
    staleTime: 600_000,
  });

  if (isLoading) return <div style={{padding:48,textAlign:"center",color:"#9ca3af"}}>Carregando quadrimestre...</div>;

  return (
    <div>
      <FaixaCamada tipo="quadrimestral" situacao="oficial" />

      <div style={{background:"#faf5ff",border:"1px solid #e9d5ff",borderRadius:10,padding:16,marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <Shield size={18} color={COR.QUADRIMESTRAL} />
          <span style={{fontWeight:700,fontSize:14,color:COR.QUADRIMESTRAL}}>
            Avaliação Quadrimestral · Q{q}/{ano} ({meses[0]}–{meses[3]})
          </span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {meses.map((m,i)=>(
            <div key={m} style={{background:"#fff",border:"1px solid #e9d5ff",borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
              <div style={{fontSize:12,fontWeight:700,color:COR.QUADRIMESTRAL}}>{m}/{ano}</div>
              <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>Mês {i+1}</div>
            </div>
          ))}
        </div>
      </div>

      {!data?.disponivel ? (
        <div style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:12,padding:32,textAlign:"center"}}>
          <Star size={32} color="#9ca3af" style={{marginBottom:12}} />
          <div style={{fontSize:15,fontWeight:700,color:"#374151",marginBottom:8}}>
            Resultado quadrimestral Q{q}/{ano} não publicado
          </div>
          <div style={{fontSize:13,color:"#6b7280"}}>{data?.nota}</div>
          <div style={{fontSize:11,color:"#9ca3af",marginTop:12}}>
            O resultado oficial é publicado pelo Ministério da Saúde após o encerramento do quadrimestre.
            <br/>Use o endpoint <code>/api/indicadores-aps/quadrimestral</code> para importar quando disponível.
          </div>
        </div>
      ) : (
        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#faf5ff"}}>
                {["Equipe","Indicador","Mês 1","Mês 2","Mês 3","Mês 4","Média","Pontuação","Classif.","Componente"].map(h=>(
                  <th key={h} style={{padding:"8px 12px",textAlign:["Equipe","Indicador","Componente"].includes(h)?"left":"right",fontSize:11,fontWeight:600,color:"#7c3aed"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.resultados||[]).map((r:any,i:number)=>(
                <tr key={i} style={{borderTop:"1px solid #f3f4f6"}}>
                  <td style={{padding:"7px 12px",fontWeight:600}}>{r.equipe_nome}</td>
                  <td style={{padding:"7px 12px",color:"#374151"}}>{r.indicador_nome}</td>
                  <td style={{padding:"7px 12px",textAlign:"right"}}>{r.resultado_mes1?.toFixed(1)||"—"}%</td>
                  <td style={{padding:"7px 12px",textAlign:"right"}}>{r.resultado_mes2?.toFixed(1)||"—"}%</td>
                  <td style={{padding:"7px 12px",textAlign:"right"}}>{r.resultado_mes3?.toFixed(1)||"—"}%</td>
                  <td style={{padding:"7px 12px",textAlign:"right"}}>{r.resultado_mes4?.toFixed(1)||"—"}%</td>
                  <td style={{padding:"7px 12px",textAlign:"right",fontWeight:700,color:COR.QUADRIMESTRAL}}>{r.media_quadrimestre?.toFixed(1)||"—"}%</td>
                  <td style={{padding:"7px 12px",textAlign:"right",fontWeight:800}}>{r.pontuacao?.toFixed(2)||"—"}</td>
                  <td style={{padding:"7px 12px",textAlign:"center"}}>
                    <span style={{background:BG_PONT(r.pontuacao||0),color:COR_PONT(r.pontuacao||0),fontWeight:700,fontSize:11,padding:"2px 8px",borderRadius:4}}>
                      {LABEL_PONT(r.pontuacao||0)}
                    </span>
                  </td>
                  <td style={{padding:"7px 12px",color:"#6b7280"}}>{r.componente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Aba: Sincronização ─────────────────────────────────────────────────────────
function AbaSincronizacao({ ibge }: {ibge:string}) {
  const [importando, setImportando] = useState(false);
  const [competenciaImport, setCompetenciaImport] = useState(compAtual());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ind-sinc", ibge],
    queryFn: () => apiGet("/api/indicadores-aps/sincronizacoes", { ibge }) as Promise<any>,
    staleTime: 60_000,
  });

  const handleImportar = async () => {
    setImportando(true);
    try {
      await apiPost(`/api/indicadores-aps/importar-siaps?ibge=${ibge}&competencia=${competenciaImport}`, {});
      await refetch();
    } catch (e) { console.error(e); }
    finally { setImportando(false); }
  };

  return (
    <div>
      <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:16,marginBottom:20}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
          <Database size={14} color="#1d4ed8"/>Importar dados do SIAPS
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <input type="month" value={competenciaImport} onChange={e=>setCompetenciaImport(e.target.value)}
            style={{border:"1px solid #d1d5db",borderRadius:6,padding:"6px 10px",fontSize:13}} />
          <button onClick={handleImportar} disabled={importando}
            style={{background:importando?"#9ca3af":"#1d4ed8",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",cursor:importando?"not-allowed":"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
            {importando ? <><RefreshCw size={13} style={{animation:"spin 1s linear infinite"}}/> Importando...</> : <><Database size={13}/> Importar {compLabel(competenciaImport)}</>}
          </button>
        </div>
        <div style={{fontSize:11,color:"#9ca3af",marginTop:8}}>
          Requer credenciais SIAPS (SIAPS_CPF + SIAPS_SENHA) configuradas no Railway.
        </div>
      </div>

      {isLoading ? <div style={{padding:32,textAlign:"center",color:"#9ca3af"}}>Carregando histórico...</div> : (
        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid #f3f4f6",fontWeight:700,fontSize:13}}>
            Histórico de Sincronizações
          </div>
          {(data?.sincronizacoes||[]).length === 0 ? (
            <div style={{padding:32,textAlign:"center",color:"#9ca3af"}}>Nenhuma sincronização registrada.</div>
          ) : (
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:"#f9fafb"}}>
                  {["Fonte","Competência","Iniciado","Duração","Inseridos","Atualizados","Rejeitados","Status"].map(h=>(
                    <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:600,color:"#6b7280"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.sincronizacoes||[]).map((s:any,i:number)=>(
                  <tr key={i} style={{borderTop:"1px solid #f3f4f6"}}>
                    <td style={{padding:"7px 12px",fontWeight:600}}>{s.fonte}</td>
                    <td style={{padding:"7px 12px"}}>{s.competencia ? compLabel(s.competencia) : "—"}</td>
                    <td style={{padding:"7px 12px",color:"#6b7280"}}>{s.iniciado_em ? new Date(s.iniciado_em).toLocaleString("pt-BR") : "—"}</td>
                    <td style={{padding:"7px 12px"}}>{s.duracao_s != null ? `${s.duracao_s.toFixed(1)}s` : "—"}</td>
                    <td style={{padding:"7px 12px",textAlign:"right",color:"#16a34a",fontWeight:700}}>{s.registros_inseridos||0}</td>
                    <td style={{padding:"7px 12px",textAlign:"right",color:"#d97706"}}>{s.registros_atualizados||0}</td>
                    <td style={{padding:"7px 12px",textAlign:"right",color:"#dc2626"}}>{s.registros_rejeitados||0}</td>
                    <td style={{padding:"7px 12px"}}>
                      <span style={{background:s.sucesso?"#f0fdf4":"#fef2f2",color:s.sucesso?"#15803d":"#b91c1c",fontWeight:700,fontSize:11,padding:"2px 8px",borderRadius:4}}>
                        {s.sucesso?"✅ Sucesso":"❌ Erro"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ── Componente Principal ───────────────────────────────────────────────────────
type Aba = "cvat" | "mensal" | "diario" | "quadrimestral" | "sincronizacao";

export default function IndicadoresAPS() {
  const ibge = "1300144"; // Apuí/AM — multimunicípio: buscar do contexto global
  const [competencia, setCompetencia] = useState(compAtual);
  const [aba, setAba] = useState<Aba>("cvat");

  const { data: dashboard, isLoading: loadDash, refetch } = useQuery({
    queryKey: ["ind-aps-dash", ibge, competencia],
    queryFn: () => apiGet("/api/indicadores-aps/dashboard", { ibge, competencia }) as Promise<any>,
    staleTime: 300_000,
  });

  const ano = parseInt(competencia.split("-")[0]);
  const mes = parseInt(competencia.split("-")[1]);
  const q   = mes <= 4 ? 1 : mes <= 8 ? 2 : 3;

  const ABAS: Array<{id:Aba; label:string; cor:string; icone:React.ReactNode}> = [
    {id:"cvat",          label:"Vínculo / CVAT",     cor:COR.MENSAL,          icone:<Users size={13}/>},
    {id:"mensal",        label:"Qualidade Mensal",   cor:COR.MENSAL,          icone:<BarChart2 size={13}/>},
    {id:"diario",        label:"Operacional PEC",    cor:COR.OPERACIONAL,     icone:<Activity size={13}/>},
    {id:"quadrimestral", label:"Quadrimestral",      cor:COR.QUADRIMESTRAL,   icone:<Star size={13}/>},
    {id:"sincronizacao", label:"Sincronização",      cor:COR.INDISPONIVEL,    icone:<Database size={13}/>},
  ];

  return (
    <div style={{fontFamily:"Inter, system-ui, sans-serif",background:"#f4f6f8",minHeight:"100vh"}}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{background:"linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 100%)",padding:"18px 28px 0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
              <div style={{background:"rgba(255,255,255,0.15)",borderRadius:8,padding:6}}>
                <BarChart2 size={18} color="#fff"/>
              </div>
              <span style={{fontWeight:800,fontSize:20,color:"#fff"}}>Indicadores APS</span>
              <span style={{background:"rgba(255,255,255,0.15)",color:"#bfdbfe",borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:600}}>
                eGestor · SIAPS
              </span>
            </div>
            <div style={{fontSize:12,color:"#93c5fd"}}>
              PEC, SIAPS e Cofinanciamento · Apuí/AM · IBGE {ibge} · Portaria MS 3.493/2024
            </div>
            {/* Aviso SIAPS substituiu SISAB */}
            <div style={{marginTop:6,background:"rgba(255,255,255,0.12)",borderRadius:6,padding:"4px 12px",fontSize:11,color:"#bfdbfe",display:"inline-block"}}>
              ℹ O SIAPS substituiu o SISAB como fonte federal oficial para monitoramento e avaliação da APS.
            </div>
          </div>

          {/* Filtro global de competência + controles */}
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"3px 4px",display:"flex",gap:2}}>
              <span style={{color:"rgba(255,255,255,0.6)",fontSize:11,padding:"4px 8px"}}>Competência</span>
              <input type="month" value={competencia} onChange={e=>setCompetencia(e.target.value)}
                style={{background:"rgba(255,255,255,0.15)",color:"#bfdbfe",border:"1px solid rgba(255,255,255,0.3)",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:600,outline:"none",colorScheme:"dark"}} />
            </div>
            <div style={{color:"rgba(255,255,255,0.7)",fontSize:11}}>Q{q}/{ano}</div>
            <button onClick={()=>refetch()}
              style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.15)",color:"#fff",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>
              <RefreshCw size={13}/> Atualizar
            </button>
          </div>
        </div>

        {/* KPIs rápidos */}
        {dashboard && !loadDash && (
          <div style={{display:"flex",gap:12,marginBottom:14}}>
            {[
              {label:"Equipes",             val:dashboard.mensal?.cvat?.total_equipes||"—",          cor:"#fff"},
              {label:"Vinculadas",          val:(dashboard.mensal?.cvat?.total_pessoas_vinculadas||0).toLocaleString("pt-BR"), cor:"#bfdbfe"},
              {label:"Acompanhadas",        val:(dashboard.mensal?.cvat?.total_pessoas_acompanhadas||0).toLocaleString("pt-BR"), cor:"#bbf7d0"},
              {label:"Pont. média CVAT",    val:(dashboard.mensal?.cvat?.pontuacao_media||0).toFixed(2), cor:"#fde68a"},
              {label:"IED",                 val:dashboard.mensal?.cvat?.ied||"—",                    cor:"#ddd6fe"},
              {label:"Quadrimestre",        val:dashboard.quadrimestre?.label||`Q${q}/${ano}`,       cor:"#e9d5ff"},
            ].map(k=>(
              <div key={k.label} style={{background:"rgba(255,255,255,0.1)",borderRadius:8,padding:"6px 14px",textAlign:"center"}}>
                <div style={{fontSize:16,fontWeight:800,color:k.cor}}>{k.val}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.6)"}}>{k.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Abas */}
        <div style={{display:"flex",gap:0,overflowX:"auto"}}>
          {ABAS.map(a=>(
            <button key={a.id} onClick={()=>setAba(a.id)}
              style={{display:"flex",alignItems:"center",gap:6,padding:"10px 18px",border:"none",
                borderBottom:aba===a.id?"3px solid #fff":"3px solid transparent",
                background:"transparent",color:aba===a.id?"#fff":"rgba(255,255,255,0.6)",
                fontWeight:aba===a.id?700:400,cursor:"pointer",fontSize:12,whiteSpace:"nowrap" as const}}>
              {a.icone} {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Conteúdo das Abas ────────────────────────────────────────────── */}
      <div style={{padding:"24px 28px 60px"}}>

        {/* Aviso de separação obrigatória de fontes */}
        <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"8px 16px",marginBottom:20,display:"flex",gap:12,alignItems:"center",fontSize:12}}>
          <AlertTriangle size={14} color="#d97706"/>
          <span style={{color:"#92400e",fontWeight:600}}>Importante:</span>
          <span style={{color:"#78350f"}}>
            🟢 Verde = Operacional PEC (estimativa) &nbsp;|&nbsp;
            🔵 Azul = Monitoramento mensal SIAPS &nbsp;|&nbsp;
            🟣 Roxo = Avaliação quadrimestral oficial &nbsp;|&nbsp;
            🟡 Amarelo = Dado preliminar &nbsp;|&nbsp;
            🔷 Ciano = Referência municipal
          </span>
        </div>

        {aba === "cvat"          && <AbaCvat competencia={competencia} ibge={ibge} />}
        {aba === "mensal"        && (
          <div>
            <FaixaCamada tipo="mensal" situacao="preliminar" />
            <div style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:12,padding:32,textAlign:"center"}}>
              <BarChart2 size={36} color={COR.MENSAL} style={{marginBottom:12}}/>
              <div style={{fontSize:15,fontWeight:700,color:"#1d4ed8",marginBottom:8}}>
                Qualidade Mensal — {compLabel(competencia)}
              </div>
              <div style={{fontSize:13,color:"#6b7280"}}>
                Importe os resultados do SIAPS na aba <strong>Sincronização</strong> para visualizar os indicadores de qualidade mensais.
              </div>
            </div>
          </div>
        )}
        {aba === "diario"        && <AbaOperacional competencia={competencia} ibge={ibge} />}
        {aba === "quadrimestral" && <AbaQuadrimestral competencia={competencia} ibge={ibge} />}
        {aba === "sincronizacao" && <AbaSincronizacao ibge={ibge} />}
      </div>
    </div>
  );
}
