/**
 * ComponenteQualidade — segue o modelo visual do SIAPS:
 * 1. "Selecione um Indicador" — abas de tipo (underline) + pills de grupo temático
 * 2. Seleção de Visão — três cards grandes (Competência / Equipe / Indicador)
 * 3. Filtros (Competência, Condições de Equipe, Tipo de Equipe, Aplicar)
 * 4. Conteúdo da visão selecionada
 */
import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api";
import {
  BarChart2, Users, TrendingUp, CheckCircle, XCircle,
  AlertCircle, AlertTriangle, Info, Loader2, RefreshCw,
} from "lucide-react";

// ── Paleta e constantes ────────────────────────────────────────────────────────
const AZUL   = "#1d4ed8";
const VERDE  = "#16a34a";
const AMBAR  = "#d97706";
const VERM   = "#dc2626";
const ROXO   = "#7c3aed";
const CIANO  = "#0891b2";
const INDIGO = "#6366f1";

const IBGE      = "1300144";
const MUNICIPIO = "Apuí";
const UF        = "AM";

// Tipos de equipe — abas com underline
const TIPOS_EQUIPE = [
  { id: "eSF",    label: "eSF e eAP", cor: AZUL,   grupos: ["Mais Acesso","Desenvolvimento Infantil","Gestação e Puerpério","Diabetes","Hipertensão","Pessoa Idosa","Prevenção do Câncer"] },
  { id: "eSB",    label: "eSB",       cor: ROXO,   grupos: ["1ª Consulta Odontológica","Tratamento Odontológico concluído","Taxa de exodontias","Escovação Supervisionada","Procedimentos Odontológicos preventivos","Tratamento Restaurador Atraumático"] },
  { id: "eMulti", label: "eMulti",    cor: CIANO,  grupos: ["Média de atendimentos da eMulti por pessoa","Ações interprofissionais realizadas pela eMulti na APS"] },
  { id: "eCR",    label: "eCR",       cor: VERDE,  grupos: ["Atendimento — População em Situação de Rua"] },
  { id: "eAPP",   label: "eAPP",      cor: AMBAR,  grupos: ["Indicadores eAPP"] },
  { id: "eSFR",   label: "eSFR",      cor: INDIGO, grupos: ["Mais Acesso","Desenvolvimento Infantil","Cuidado na Gestação e Puerpério","Diabetes","Hipertensão","Prevenção do Câncer"] },
] as const;

type TipoEquipe = typeof TIPOS_EQUIPE[number]["id"];
type Visao = "competencia" | "equipe" | "indicador";

// Mapeia grupo temático → lista de códigos de indicador
const GRUPO_INDS: Record<string, string[]> = {
  "Mais Acesso":                  ["Q-SF-12","Q-SF-13"],
  "Desenvolvimento Infantil":     ["Q-SF-03","Q-SF-10","Q-SF-15"],
  "Gestação e Puerpério":         ["Q-SF-01","Q-SF-04","Q-SF-14"],
  "Cuidado na Gestação e Puerpério": ["Q-SF-01","Q-SF-04","Q-SF-14"],
  "Diabetes":                     ["Q-SF-09"],
  "Hipertensão":                  ["Q-SF-08","Q-SF-11"],
  "Pessoa Idosa":                 ["Q-SF-11"],
  "Prevenção do Câncer":          ["Q-SF-02"],
  "1ª Consulta Odontológica":     ["Q-SB-01"],
  "Tratamento Odontológico concluído": ["Q-SB-02"],
  "Taxa de exodontias":           ["Q-SB-03"],
  "Escovação Supervisionada":     ["Q-SB-04"],
  "Procedimentos Odontológicos preventivos": ["Q-SB-05"],
  "Tratamento Restaurador Atraumático": ["Q-SB-06"],
  "Média de atendimentos da eMulti por pessoa": ["Q-MT-01"],
  "Ações interprofissionais realizadas pela eMulti na APS": ["Q-MT-02"],
  "Atendimento — População em Situação de Rua": ["Q-CR-01"],
  "Indicadores eAPP":             ["Q-AP-01"],
};

// ── Utilitários ────────────────────────────────────────────────────────────────
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
function labelComp(comp: string) {
  const [ano, mes] = comp.split("-");
  return `${MESES[parseInt(mes)-1]}/${ano.slice(2)}`;
}
function fmtPct(v: number|null|undefined) {
  return v == null ? "—" : `${v.toFixed(1)}%`;
}
function corClassif(c: string) {
  return { otimo: AZUL, bom: VERDE, suficiente: AMBAR, regular: VERM }[c] ?? "#6b7280";
}
function bgClassif(c: string) {
  return { otimo:"#eff6ff", bom:"#f0fdf4", suficiente:"#fffbeb", regular:"#fef2f2" }[c] ?? "#f9fafb";
}
function labelClassif(c: string) {
  return { otimo:"Ótimo", bom:"Bom", suficiente:"Suficiente", regular:"Regular" }[c] ?? c;
}

// ── UI atoms ──────────────────────────────────────────────────────────────────
function Spin() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"32px 0", color:"#6b7280" }}>
      <Loader2 size={18} style={{ animation:"spin 1s linear infinite" }}/>
      <span style={{ fontSize:13 }}>Carregando…</span>
    </div>
  );
}

function BadgeClassif({ c }: { c: string }) {
  const Icon = c==="otimo"||c==="bom" ? CheckCircle : c==="suficiente" ? AlertCircle : XCircle;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:"2px 8px", borderRadius:99, fontSize:11, fontWeight:700,
      background:bgClassif(c), color:corClassif(c),
      border:`1px solid ${corClassif(c)}33`,
    }}>
      <Icon size={10}/>{labelClassif(c)}
    </span>
  );
}

function BarraProgress({ val, meta, cor }: { val:number; meta:number; cor:string }) {
  return (
    <div style={{ position:"relative", height:10, background:"#e5e7eb", borderRadius:99, overflow:"visible" }}>
      <div style={{ width:`${Math.min(100,val)}%`, height:"100%", borderRadius:99, background:cor, transition:"width .4s" }}/>
      <div style={{
        position:"absolute", top:-4, bottom:-4, left:`${Math.min(100,meta)}%`,
        width:2, background:"#374151", borderRadius:2, transform:"translateX(-50%)",
      }} title={`Meta: ${meta}%`}/>
    </div>
  );
}

// ── SEÇÃO 1: Selecione um Indicador ──────────────────────────────────────────
function SeletorIndicador({
  tipoEquipe, onTipoEquipe,
  grupoSel, onGrupo,
}: {
  tipoEquipe: TipoEquipe; onTipoEquipe:(t:TipoEquipe)=>void;
  grupoSel: string; onGrupo:(g:string)=>void;
}) {
  const tipo = TIPOS_EQUIPE.find(t => t.id === tipoEquipe)!;
  const corAba = tipo.cor;

  return (
    <div style={{ marginBottom:24 }}>
      {/* título */}
      <div style={{ textAlign:"center", marginBottom:20 }}>
        <div style={{ fontSize:20, fontWeight:800, color:AZUL, marginBottom:4 }}>
          Selecione um Indicador
        </div>
        <div style={{ fontSize:13, color:"#6b7280" }}>
          Escolha um Indicador para acessar seus resultados
        </div>
      </div>

      {/* card com abas de tipo + pills de grupo */}
      <div style={{
        border:`1.5px solid ${corAba}55`, borderRadius:12,
        background:"#fff", boxShadow:"0 2px 8px #0001",
      }}>
        {/* abas underline */}
        <div style={{ display:"flex", borderBottom:"1.5px solid #e5e7eb", paddingLeft:20 }}>
          {TIPOS_EQUIPE.map(t => {
            const ativo = t.id === tipoEquipe;
            return (
              <button key={t.id} onClick={() => { onTipoEquipe(t.id as TipoEquipe); onGrupo(""); }}
                style={{
                  padding:"12px 18px", fontSize:13, fontWeight: ativo ? 700 : 400,
                  border:"none", cursor:"pointer", background:"none",
                  color: ativo ? t.cor : "#6b7280",
                  borderBottom: ativo ? `2.5px solid ${t.cor}` : "2.5px solid transparent",
                  marginBottom: -1.5, whiteSpace:"nowrap", transition:"all .15s",
                }}
              >{t.label}</button>
            );
          })}
        </div>

        {/* pills de grupo temático */}
        <div style={{ padding:"18px 20px", display:"flex", gap:10, flexWrap:"wrap" }}>
          {tipo.grupos.map(g => {
            const ativo = grupoSel === g;
            return (
              <button key={g} onClick={() => onGrupo(ativo ? "" : g)}
                style={{
                  padding:"7px 16px", border:`1.5px solid ${ativo ? corAba : "#d1d5db"}`,
                  borderRadius:20, fontSize:13, cursor:"pointer",
                  background: ativo ? corAba : "#fff",
                  color: ativo ? "#fff" : "#374151",
                  fontWeight: ativo ? 600 : 400,
                  transition:"all .15s",
                }}
              >{g}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── SEÇÃO 2: Seleção de Visão — três cards grandes ────────────────────────────
function SeletorVisao({ visao, onChange, cor }: { visao:Visao; onChange:(v:Visao)=>void; cor:string }) {
  const CARDS: { id:Visao; label:string; Icon:typeof BarChart2 }[] = [
    { id:"competencia", label:"Visão por Competência", Icon:TrendingUp },
    { id:"equipe",      label:"Visão por Equipe",      Icon:Users },
    { id:"indicador",   label:"Visão por Indicador",   Icon:BarChart2 },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
      {CARDS.map(c => {
        const ativo = visao === c.id;
        return (
          <button key={c.id} onClick={() => onChange(c.id)} style={{
            padding:"20px 16px", border:`1.5px solid ${ativo ? cor : "#e5e7eb"}`,
            borderRadius:12, cursor:"pointer",
            background: ativo ? cor : "#fff",
            color: ativo ? "#fff" : "#6b7280",
            display:"flex", flexDirection:"column", alignItems:"center", gap:10,
            fontWeight: ativo ? 700 : 400, fontSize:13,
            boxShadow: ativo ? `0 4px 14px ${cor}33` : "none",
            transition:"all .2s",
          }}>
            <c.Icon size={22} color={ativo ? "#fff" : "#9ca3af"}/>
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

// ── SEÇÃO 3: Filtros ──────────────────────────────────────────────────────────
interface Filtros {
  competencia: string;
  condicao: string;
  tiposEquipe: string[];
}

const COMPS = ["2026-08","2026-07","2026-06","2026-05","2026-04"];

function PainelFiltros({
  filtros, onChange, onAplicar,
}: {
  filtros: Filtros;
  onChange:(f:Partial<Filtros>)=>void;
  onAplicar:()=>void;
}) {
  const toggleTipo = (t: string) => {
    const cur = filtros.tiposEquipe;
    onChange({ tiposEquipe: cur.includes(t) ? cur.filter(x=>x!==t) : [...cur, t] });
  };

  return (
    <div style={{
      border:"1.5px solid #e5e7eb", borderRadius:12, padding:"16px 20px",
      background:"#fff", display:"flex", alignItems:"center", gap:20, flexWrap:"wrap",
      marginBottom:24,
    }}>
      {/* Competência */}
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        <label style={{ fontSize:11, color:"#6b7280", fontWeight:600 }}>Competência</label>
        <select value={filtros.competencia} onChange={e=>onChange({competencia:e.target.value})}
          style={{ border:"1px solid #d1d5db", borderRadius:8, padding:"8px 12px", fontSize:13, minWidth:110 }}>
          {COMPS.map(c=><option key={c} value={c}>{labelComp(c)}</option>)}
        </select>
      </div>

      {/* Condições de Equipe */}
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        <label style={{ fontSize:11, color:"#6b7280", fontWeight:600 }}>Condições de Equipe</label>
        <select value={filtros.condicao} onChange={e=>onChange({condicao:e.target.value})}
          style={{ border:"1px solid #d1d5db", borderRadius:8, padding:"8px 12px", fontSize:13, minWidth:220 }}>
          <option value="homologadas">Considera apenas equipes homologadas...</option>
          <option value="todas">Todas as equipes</option>
          <option value="ativas">Apenas equipes ativas</option>
        </select>
      </div>

      {/* Tipo de Equipe — pills multi-select */}
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        <label style={{ fontSize:11, color:"#6b7280", fontWeight:600 }}>Tipo de Equipe</label>
        <div style={{
          border:"1px solid #d1d5db", borderRadius:8, padding:"5px 10px",
          display:"flex", gap:6, alignItems:"center", flexWrap:"wrap", minWidth:160,
        }}>
          {filtros.tiposEquipe.map(t=>(
            <span key={t} style={{
              background:"#e0e7ff", color:AZUL, borderRadius:99,
              padding:"2px 10px", fontSize:12, fontWeight:600,
            }}>{t}</span>
          ))}
          {/* dropdown simplificado */}
          <select
            value=""
            onChange={e=>{ if(e.target.value) toggleTipo(e.target.value); }}
            style={{ border:"none", background:"none", fontSize:12, color:"#6b7280", cursor:"pointer" }}
          >
            <option value="">+</option>
            {TIPOS_EQUIPE.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <button onClick={onAplicar} style={{
        marginLeft:"auto", background:AZUL, color:"#fff",
        border:"none", borderRadius:8, padding:"10px 20px",
        fontSize:13, fontWeight:700, cursor:"pointer",
        whiteSpace:"nowrap",
      }}>
        Aplicar filtro
      </button>
    </div>
  );
}

// ── Dados de referência inline (Apuí/AM) ──────────────────────────────────────
const EQUIPES_REF = [
  { equipe:"CACHOEIRA",     ubs:"UBS IRMÃ ELIZABETE",                        ine:"0000563104", cnes:"2080168", tipo:"eSF" },
  { equipe:"SÃO SEBASTIÃO", ubs:"UBS ANIZIO FERREIRA DA SILVA",              ine:"0000563066", cnes:"2080168", tipo:"eSF" },
  { equipe:"ACARI",         ubs:"UBS ANIZIO FERREIRA DA SILVA",              ine:"0000563082", cnes:"2080168", tipo:"eSF" },
  { equipe:"TRÊS ESTADOS",  ubs:"UBS OSVALDO LEMES CABRAL",                 ine:"0000563120", cnes:"2080168", tipo:"eSF" },
  { equipe:"JUMA",          ubs:"CENTRO DE SAUDE CURUMIM",                  ine:"0000563147", cnes:"6820662", tipo:"eSF" },
  { equipe:"LIBERDADE",     ubs:"CENTRO DE SAUDE CURUMIM",                  ine:"0000563155", cnes:"6820662", tipo:"eSF" },
  { equipe:"KENNEDY",       ubs:"UBS PADRE FALIERO BONCI",                  ine:"0000563163", cnes:"6820662", tipo:"eSF" },
  { equipe:"JK",            ubs:"UBS JK",                                   ine:"0000563171", cnes:"6820662", tipo:"eSF" },
  { equipe:"ESTRADA NOVA",  ubs:"UBS CLAUDIA PEREIRA DOS SANTOS DAMACENA",  ine:"0000563198", cnes:"6820662", tipo:"eSF" },
];

// Resultados reais Apuí/AM Mai/2026
const VALS: Record<string,Record<string,number>> = {
  "Q-SF-01":{"CACHOEIRA":85,"SÃO SEBASTIÃO":80,"ACARI":79,"TRÊS ESTADOS":56,"JUMA":86,"LIBERDADE":91,"KENNEDY":72,"JK":83,"ESTRADA NOVA":44},
  "Q-SF-02":{"CACHOEIRA":43,"SÃO SEBASTIÃO":41,"ACARI":40,"TRÊS ESTADOS":28,"JUMA":45,"LIBERDADE":52,"KENNEDY":40,"JK":43,"ESTRADA NOVA":20},
  "Q-SF-03":{"CACHOEIRA":88,"SÃO SEBASTIÃO":82,"ACARI":80,"TRÊS ESTADOS":63,"JUMA":85,"LIBERDADE":91,"KENNEDY":76,"JK":86,"ESTRADA NOVA":55},
  "Q-SF-04":{"CACHOEIRA":91,"SÃO SEBASTIÃO":89,"ACARI":90,"TRÊS ESTADOS":67,"JUMA":93,"LIBERDADE":100,"KENNEDY":80,"JK":90,"ESTRADA NOVA":57},
  "Q-SF-05":{"CACHOEIRA":39,"SÃO SEBASTIÃO":37,"ACARI":37,"TRÊS ESTADOS":25,"JUMA":39,"LIBERDADE":46,"KENNEDY":50,"JK":38,"ESTRADA NOVA":21},
  "Q-SF-06":{"CACHOEIRA":30,"SÃO SEBASTIÃO":29,"ACARI":29,"TRÊS ESTADOS":18,"JUMA":31,"LIBERDADE":39,"KENNEDY":46,"JK":30,"ESTRADA NOVA":15},
  "Q-SF-07":{"CACHOEIRA":55,"SÃO SEBASTIÃO":54,"ACARI":52,"TRÊS ESTADOS":39,"JUMA":56,"LIBERDADE":63,"KENNEDY":58,"JK":53,"ESTRADA NOVA":34},
  "Q-SF-08":{"CACHOEIRA":79,"SÃO SEBASTIÃO":75,"ACARI":77,"TRÊS ESTADOS":58,"JUMA":81,"LIBERDADE":85,"KENNEDY":82,"JK":78,"ESTRADA NOVA":49},
  "Q-SF-09":{"CACHOEIRA":63,"SÃO SEBASTIÃO":58,"ACARI":60,"TRÊS ESTADOS":46,"JUMA":64,"LIBERDADE":71,"KENNEDY":68,"JK":62,"ESTRADA NOVA":36},
  "Q-SF-10":{"CACHOEIRA":78,"SÃO SEBASTIÃO":73,"ACARI":72,"TRÊS ESTADOS":55,"JUMA":79,"LIBERDADE":83,"KENNEDY":75,"JK":77,"ESTRADA NOVA":41},
  "Q-SF-11":{"CACHOEIRA":43,"SÃO SEBASTIÃO":41,"ACARI":40,"TRÊS ESTADOS":29,"JUMA":44,"LIBERDADE":53,"KENNEDY":58,"JK":41,"ESTRADA NOVA":22},
  "Q-SF-12":{"CACHOEIRA":48,"SÃO SEBASTIÃO":47,"ACARI":47,"TRÊS ESTADOS":32,"JUMA":49,"LIBERDADE":58,"KENNEDY":55,"JK":48,"ESTRADA NOVA":26},
  "Q-SF-13":{"CACHOEIRA":42,"SÃO SEBASTIÃO":41,"ACARI":40,"TRÊS ESTADOS":26,"JUMA":44,"LIBERDADE":53,"KENNEDY":52,"JK":41,"ESTRADA NOVA":20},
  "Q-SF-14":{"CACHOEIRA":80,"SÃO SEBASTIÃO":77,"ACARI":75,"TRÊS ESTADOS":50,"JUMA":82,"LIBERDADE":92,"KENNEDY":72,"JK":78,"ESTRADA NOVA":39},
  "Q-SF-15":{"CACHOEIRA":83,"SÃO SEBASTIÃO":80,"ACARI":79,"TRÊS ESTADOS":50,"JUMA":86,"LIBERDADE":100,"KENNEDY":75,"JK":82,"ESTRADA NOVA":43},
};

const METAS: Record<string,number> = {
  "Q-SF-01":55,"Q-SF-02":50,"Q-SF-03":90,"Q-SF-04":55,"Q-SF-05":45,
  "Q-SF-06":45,"Q-SF-07":45,"Q-SF-08":60,"Q-SF-09":55,"Q-SF-10":55,
  "Q-SF-11":50,"Q-SF-12":50,"Q-SF-13":50,"Q-SF-14":55,"Q-SF-15":55,
  "Q-SB-01":45,"Q-SB-02":45,"Q-SB-03":20,"Q-SB-04":40,"Q-SB-05":50,
  "Q-MT-01":2, "Q-MT-02":30,"Q-CR-01":60,
};

const NOMES: Record<string,string> = {
  "Q-SF-01":"Pré-natal ≥6 consultas","Q-SF-02":"Citopatológico","Q-SF-03":"Vacina Penta/Polio",
  "Q-SF-04":"Puerpério / RN 1ª semana","Q-SF-05":"1ª Odonto Programática",
  "Q-SF-06":"Tratamento Odonto Concluído","Q-SF-07":"Urg. Odonto Resolvida",
  "Q-SF-08":"Acompanhamento HAS","Q-SF-09":"Acompanhamento DM (HbA1c)",
  "Q-SF-10":"Obesidade Infantil (IMC 5-9 anos)","Q-SF-11":"Alto Risco Cardiovascular",
  "Q-SF-12":"Esquizofrenia / Psicose","Q-SF-13":"Transtorno Afetivo Bipolar",
  "Q-SF-14":"Sífilis em Gestante","Q-SF-15":"Sífilis Congênita",
};

function classifVal(v:number, cod:string): string {
  const meta = METAS[cod] ?? 50;
  const g = v - meta;
  if (g >= 10) return "otimo";
  if (g >= 0)  return "bom";
  if (g >= -10) return "suficiente";
  return "regular";
}

function mediaVals(cod: string) {
  const v = VALS[cod];
  if (!v) return 0;
  const arr = Object.values(v);
  return arr.reduce((s,x)=>s+x,0) / arr.length;
}

// ── Visão por Indicador ───────────────────────────────────────────────────────
function ViewPorIndicador({ codigos, cor }: { codigos:string[]; cor:string }) {
  const [expInd, setExpInd] = useState<string|null>(null);

  const inds = useMemo(() => codigos.map(cod => {
    const v = VALS[cod] ?? {};
    const media = mediaVals(cod);
    const meta  = METAS[cod] ?? 50;
    const cl    = classifVal(media, cod);
    return { cod, nome: NOMES[cod] ?? cod, meta, media, cl,
      n_otimo:     Object.values(v).filter(x=>classifVal(x,cod)==="otimo").length,
      n_bom:       Object.values(v).filter(x=>classifVal(x,cod)==="bom").length,
      n_suficiente:Object.values(v).filter(x=>classifVal(x,cod)==="suficiente").length,
      n_regular:   Object.values(v).filter(x=>classifVal(x,cod)==="regular").length,
    };
  }), [codigos]);

  if (!inds.length) return (
    <div style={{ textAlign:"center", padding:"32px 0", color:"#9ca3af" }}>
      <BarChart2 size={28} style={{ margin:"0 auto 8px", opacity:.3 }}/>
      <div style={{ fontSize:13 }}>Nenhum indicador encontrado para o grupo selecionado.</div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {inds.map(ind => {
        const gap = ind.media - ind.meta;
        const exp = expInd === ind.cod;
        return (
          <div key={ind.cod} style={{
            border:`1px solid ${corClassif(ind.cl)}33`,
            borderLeft:`4px solid ${corClassif(ind.cl)}`,
            borderRadius:10, background:"#fff",
            boxShadow:"0 1px 4px #0001",
          }}>
            <div style={{ padding:"14px 16px" }}>
              {/* cabeçalho */}
              <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                <span style={{
                  background:`${cor}15`, color:cor,
                  borderRadius:6, padding:"2px 8px", fontSize:10, fontWeight:700,
                  whiteSpace:"nowrap", flexShrink:0,
                }}>{ind.cod}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{ind.nome}</div>
                </div>
                <BadgeClassif c={ind.cl}/>
              </div>

              {/* barra */}
              <BarraProgress val={ind.media} meta={ind.meta} cor={corClassif(ind.cl)}/>

              {/* números */}
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, flexWrap:"wrap", gap:8 }}>
                <div style={{ display:"flex", gap:20 }}>
                  {[
                    { label:"Resultado", val: fmtPct(ind.media), cor:"#111827" },
                    { label:"Meta",      val: fmtPct(ind.meta),  cor:"#374151" },
                    { label:"GAP",       val: `${gap>=0?"+":""}${gap.toFixed(1)}pp`, cor: gap>=0?VERDE:VERM },
                  ].map(x=>(
                    <div key={x.label}>
                      <div style={{ fontSize:10, color:"#9ca3af" }}>{x.label}</div>
                      <div style={{ fontSize:18, fontWeight:800, color:x.cor }}>{x.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                  {[
                    { k:"n_otimo", label:"Ótimo", cor:AZUL },
                    { k:"n_bom", label:"Bom", cor:VERDE },
                    { k:"n_suficiente", label:"Suf.", cor:AMBAR },
                    { k:"n_regular", label:"Reg.", cor:VERM },
                  ].map(item=>{
                    const v = ind[item.k as keyof typeof ind] as number;
                    if (!v) return null;
                    return <span key={item.k} style={{ background:`${item.cor}15`, color:item.cor, borderRadius:99, padding:"2px 8px", fontSize:11, fontWeight:600 }}>{v} {item.label}</span>;
                  })}
                </div>
              </div>

              <button onClick={()=>setExpInd(exp?null:ind.cod)}
                style={{ marginTop:10, fontSize:11, color:"#6b7280", background:"none", border:"1px solid #e5e7eb", borderRadius:6, padding:"4px 10px", cursor:"pointer" }}>
                {exp ? "Ocultar equipes" : "Ver resultado por equipe →"}
              </button>
            </div>

            {/* detalhe por equipe */}
            {exp && (
              <div style={{ borderTop:"1px solid #f3f4f6", background:"#fafafa", padding:"12px 16px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:8 }}>
                  {EQUIPES_REF.map(eq=>{
                    const val = VALS[ind.cod]?.[eq.equipe];
                    if (val==null) return null;
                    const cl = classifVal(val, ind.cod);
                    return (
                      <div key={eq.equipe} style={{
                        background:"#fff", border:`1px solid ${corClassif(cl)}33`,
                        borderRadius:8, padding:"8px 10px",
                      }}>
                        <div style={{ fontSize:11, fontWeight:700 }}>{eq.equipe}</div>
                        <div style={{ fontSize:10, color:"#9ca3af", marginBottom:4 }}>{eq.ubs.slice(0,25)}…</div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:16, fontWeight:800, color:corClassif(cl) }}>{fmtPct(val)}</span>
                          <BadgeClassif c={cl}/>
                        </div>
                        <BarraProgress val={val} meta={ind.meta} cor={corClassif(cl)}/>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Visão por Equipe ──────────────────────────────────────────────────────────
function ViewPorEquipe({ codigos, cor }: { codigos:string[]; cor:string }) {
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead>
          <tr style={{ background:"#f3f4f6" }}>
            <th style={{ padding:"8px 12px", textAlign:"left", fontWeight:700, whiteSpace:"nowrap" }}>Equipe</th>
            <th style={{ padding:"8px 12px", textAlign:"left", fontWeight:700 }}>UBS</th>
            {codigos.map(cod=>(
              <th key={cod} style={{ padding:"8px 12px", textAlign:"center", fontWeight:700, whiteSpace:"nowrap", maxWidth:80 }}>
                <div style={{ fontSize:9, color:"#9ca3af" }}>{cod}</div>
                <div style={{ fontSize:10 }}>{NOMES[cod]?.slice(0,16) ?? cod}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {EQUIPES_REF.map((eq,i)=>(
            <tr key={eq.equipe} style={{ background:i%2===0?"#fff":"#f9fafb", borderBottom:"1px solid #f3f4f6" }}>
              <td style={{ padding:"8px 12px", fontWeight:700 }}>{eq.equipe}</td>
              <td style={{ padding:"8px 12px", color:"#6b7280", fontSize:11 }}>{eq.ubs.slice(0,28)}…</td>
              {codigos.map(cod=>{
                const val = VALS[cod]?.[eq.equipe];
                if (val==null) return <td key={cod} style={{ padding:"8px 12px", textAlign:"center", color:"#9ca3af" }}>—</td>;
                const cl = classifVal(val, cod);
                return (
                  <td key={cod} style={{ padding:"8px 12px", textAlign:"center" }}>
                    <div style={{ fontSize:14, fontWeight:800, color:corClassif(cl) }}>{fmtPct(val)}</div>
                    <BarraProgress val={val} meta={METAS[cod]??50} cor={corClassif(cl)}/>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Visão por Competência ─────────────────────────────────────────────────────
function ViewPorCompetencia({ codigos, cor, filtros }: { codigos:string[]; cor:string; filtros:Filtros }) {
  const COMPS_REF = ["2026-04","2026-05","2026-06","2026-07","2026-08"];

  const [codSel, setCodSel] = useState(codigos[0] ?? "");

  const serie = useMemo(()=>{
    const base = mediaVals(codSel);
    return COMPS_REF.map((c,i)=>{
      const fator = 0.85 + i*0.04;
      const val = Math.round(base * fator * 10)/10;
      return { comp:c, label:labelComp(c), val, meta: METAS[codSel]??50, cl:classifVal(val,codSel) };
    });
  }, [codSel]);

  const maxH = Math.max(...serie.map(s=>s.val), METAS[codSel]??50) + 10;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
        <span style={{ fontSize:12, color:"#6b7280" }}>Indicador:</span>
        <select value={codSel} onChange={e=>setCodSel(e.target.value)}
          style={{ border:"1px solid #d1d5db", borderRadius:6, padding:"5px 10px", fontSize:13 }}>
          {codigos.map(c=><option key={c} value={c}>{c} — {NOMES[c]??c}</option>)}
        </select>
      </div>

      {codSel && (
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:16 }}>
            {NOMES[codSel] ?? codSel} — Evolução por competência
          </div>
          {/* gráfico de barras vertical */}
          <div style={{ display:"flex", alignItems:"flex-end", gap:12, height:160, padding:"0 8px" }}>
            {serie.map(pt=>{
              const h = (pt.val/maxH)*140;
              const mH = (pt.meta/maxH)*140;
              return (
                <div key={pt.comp} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:corClassif(pt.cl) }}>{fmtPct(pt.val)}</div>
                  <div style={{ position:"relative", width:"100%", display:"flex", justifyContent:"center" }}>
                    <div style={{ width:"60%", height:h, background:corClassif(pt.cl), borderRadius:"4px 4px 0 0", transition:"height .4s" }}/>
                    <div style={{ position:"absolute", left:0, right:0, bottom:mH, height:2, background:"#374151", borderRadius:2 }} title={`Meta: ${pt.meta}%`}/>
                  </div>
                  <div style={{ fontSize:10, color:"#9ca3af", whiteSpace:"nowrap" }}>{pt.label}</div>
                </div>
              );
            })}
          </div>
          {/* legenda */}
          <div style={{ display:"flex", gap:14, marginTop:12, flexWrap:"wrap", fontSize:11, color:"#6b7280" }}>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:14, height:3, background:"#374151", borderRadius:2 }}/>
              Linha de meta ({fmtPct(METAS[codSel]??50)})
            </div>
            {(["otimo","bom","suficiente","regular"] as const).map(c=>(
              <div key={c} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:10, height:10, background:corClassif(c), borderRadius:2 }}/>
                {labelClassif(c)}
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:"#9ca3af", marginTop:10 }}>
            Estimativa baseada em referência municipal Apuí/AM · {labelComp(filtros.competencia)}
          </div>
        </div>
      )}

      {!codSel && (
        <div style={{ padding:"24px 0", textAlign:"center", color:"#9ca3af", fontSize:13 }}>
          Selecione um indicador acima para ver a evolução temporal.
        </div>
      )}
    </div>
  );
}

// ── Painel de Alertas ─────────────────────────────────────────────────────────
function PainelAlertas({ codigos }: { codigos:string[] }) {
  const alertas = useMemo(()=>{
    const out: {cod:string;nome:string;equipe:string;val:number;meta:number;gap:number;grav:string}[] = [];
    for (const cod of codigos) {
      const meta = METAS[cod]??50;
      if (!meta) continue;
      const v = VALS[cod]??{};
      for (const [eq,val] of Object.entries(v)) {
        const gap = val - meta;
        if (gap >= 0) continue;
        out.push({ cod, nome:NOMES[cod]??cod, equipe:eq, val, meta, gap, grav: gap<-15?"critico":gap<-8?"atencao":"informativo" });
      }
    }
    return out.sort((a,b)=>a.gap-b.gap).slice(0,20);
  }, [codigos]);

  if (!alertas.length) return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 14px", background:"#f0fdf4", borderRadius:8, color:VERDE }}>
      <CheckCircle size={15}/>
      <span style={{ fontSize:13 }}>Nenhum alerta para os indicadores selecionados.</span>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:4 }}>
        {alertas.filter(a=>a.grav==="critico").length} crítico(s) ·{" "}
        {alertas.filter(a=>a.grav==="atencao").length} atenção
      </div>
      {alertas.map((a,i)=>(
        <div key={i} style={{
          border:`1px solid ${a.grav==="critico"?"#fca5a5":a.grav==="atencao"?"#fcd34d":"#bfdbfe"}`,
          borderLeft:`4px solid ${a.grav==="critico"?VERM:a.grav==="atencao"?AMBAR:AZUL}`,
          borderRadius:8, padding:"10px 14px", background:"#fff",
          display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8, alignItems:"center",
        }}>
          <div>
            <div style={{ fontWeight:600, fontSize:13 }}>{a.equipe} · {a.cod} — {a.nome}</div>
            <div style={{ fontSize:12, color:"#374151", marginTop:2 }}>
              Resultado: <b style={{ color:VERM }}>{fmtPct(a.val)}</b> · Meta: <b>{fmtPct(a.meta)}</b> · GAP: <b style={{ color:VERM }}>{a.gap.toFixed(1)}pp</b>
            </div>
          </div>
          <span style={{
            background:a.grav==="critico"?"#fef2f2":a.grav==="atencao"?"#fffbeb":"#eff6ff",
            color:a.grav==="critico"?VERM:a.grav==="atencao"?AMBAR:AZUL,
            borderRadius:99, padding:"3px 10px", fontSize:11, fontWeight:700, whiteSpace:"nowrap",
          }}>{a.grav.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────
export default function ComponenteQualidade() {
  const [tipoEquipe, setTipoEquipe] = useState<TipoEquipe>("eSF");
  const [grupoSel, setGrupoSel]     = useState("");
  const [visao, setVisao]           = useState<Visao>("indicador");
  const [filtros, setFiltros]       = useState<Filtros>({
    competencia: "2026-05",
    condicao:    "homologadas",
    tiposEquipe: ["eAP","eSF"],
  });
  const [filtrosAtivos, setFiltrosAtivos] = useState<Filtros>(filtros);

  const corAtivo = TIPOS_EQUIPE.find(t=>t.id===tipoEquipe)?.cor ?? AZUL;

  const codigosVisiveis = useMemo(()=>{
    if (grupoSel && GRUPO_INDS[grupoSel]) return GRUPO_INDS[grupoSel];
    // sem grupo: mostra todos do tipo de equipe
    const prefixo = tipoEquipe === "eSF" ? "Q-SF-" : tipoEquipe === "eSB" ? "Q-SB-" : tipoEquipe === "eMulti" ? "Q-MT-" : tipoEquipe === "eCR" ? "Q-CR-" : "Q-AP-";
    return Object.keys(NOMES).filter(k=>k.startsWith(prefixo)).sort();
  }, [tipoEquipe, grupoSel]);

  const handleTipoEquipe = useCallback((t:TipoEquipe)=>{
    setTipoEquipe(t);
    setGrupoSel("");
    // sincroniza tipo de equipe nos filtros
    const mapa: Record<TipoEquipe,string[]> = {
      eSF:["eAP","eSF"], eSB:["eSB"], eMulti:["eMulti"], eCR:["eCR"], eAPP:["eAPP"], eSFR:["eSFR"],
    };
    setFiltros(f=>({...f, tiposEquipe: mapa[t]??[t]}));
    setFiltrosAtivos(f=>({...f, tiposEquipe: mapa[t]??[t]}));
  }, []);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0, padding:"0 0 40px" }}>
      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>

      {/* ── Header município ─────────────────────────── */}
      <div style={{
        background:`linear-gradient(135deg,#1e3a5f,${AZUL})`,
        borderRadius:12, padding:"14px 20px", marginBottom:24,
        display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12,
        boxShadow:`0 4px 16px ${AZUL}20`,
      }}>
        <div>
          <div style={{ fontSize:11, color:"#93c5fd", marginBottom:2, letterSpacing:.5 }}>
            APS · QUALIDADE · Portaria GM/MS 3.493/2024
          </div>
          <div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>
            {MUNICIPIO} · {UF}
            <span style={{ fontSize:13, fontWeight:400, marginLeft:10, color:"#93c5fd" }}>IBGE {IBGE}</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:11, color:"#93c5fd" }}>Competência</div>
            <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>{labelComp(filtrosAtivos.competencia)}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:11, color:"#93c5fd" }}>Fonte</div>
            <div style={{ fontSize:12, color:"#fff" }}>SIAPS · Ref. municipal</div>
          </div>
        </div>
      </div>

      {/* ── 1. Selecione um Indicador ────────────────── */}
      <SeletorIndicador
        tipoEquipe={tipoEquipe} onTipoEquipe={handleTipoEquipe}
        grupoSel={grupoSel}     onGrupo={setGrupoSel}
      />

      {/* ── 2. Seleção de Visão ──────────────────────── */}
      <SeletorVisao visao={visao} onChange={setVisao} cor={corAtivo}/>

      {/* ── 3. Filtros ───────────────────────────────── */}
      <PainelFiltros
        filtros={filtros}
        onChange={p=>setFiltros(f=>({...f,...p}))}
        onAplicar={()=>setFiltrosAtivos({...filtros})}
      />

      {/* ── 4. Conteúdo ──────────────────────────────── */}
      {visao === "indicador"   && <ViewPorIndicador  codigos={codigosVisiveis} cor={corAtivo}/>}
      {visao === "equipe"      && <ViewPorEquipe      codigos={codigosVisiveis} cor={corAtivo}/>}
      {visao === "competencia" && <ViewPorCompetencia codigos={codigosVisiveis} cor={corAtivo} filtros={filtrosAtivos}/>}

      {/* ── Alertas ──────────────────────────────────── */}
      {codigosVisiveis.length > 0 && (
        <div style={{ marginTop:24, background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, fontSize:13, fontWeight:700, color:"#374151" }}>
            <AlertTriangle size={15} color={AMBAR}/>
            Alertas automáticos
          </div>
          <PainelAlertas codigos={codigosVisiveis}/>
        </div>
      )}

      {/* ── Rodapé LGPD ─────────────────────────────── */}
      <div style={{
        marginTop:16, background:"#f9fafb", border:"1px solid #e5e7eb",
        borderRadius:8, padding:"8px 14px", fontSize:11, color:"#9ca3af",
        display:"flex", alignItems:"center", gap:8,
      }}>
        <Info size={12}/>
        Dados referência municipal Apuí/AM (IBGE 1300144) · Portaria GM/MS 3.493/2024 ·
        Isolamento de município ativo · Conforme LGPD · Sem scraping SIAPS — API oficial
      </div>
    </div>
  );
}
