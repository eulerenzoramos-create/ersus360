/**
 * ComponenteQualidade — segue o modelo visual do SIAPS:
 * 1. "Selecione um Indicador" — abas de tipo (underline) + pills de grupo temático
 * 2. Seleção de Visão — três cards grandes (Competência / Equipe / Indicador)
 * 3. Filtros (Competência, Condições de Equipe, Tipo de Equipe, Aplicar)
 * 4. Conteúdo da visão selecionada
 */
import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
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

// Catálogo oficial por tipo de equipe — Portaria GM/MS 3.493/2024 + NT DEAPS/SAPS/MS 6/2025
// Cada tipo tem seus próprios grupos temáticos mapeados para os códigos oficiais
const GRUPO_INDS_POR_TIPO: Record<string, Record<string, string[]>> = {
  eSF: {
    "Mais Acesso":              ["C1"],
    "Desenvolvimento Infantil": ["C2"],
    "Gestação e Puerpério":     ["C3"],
    "Diabetes":                 ["C4"],
    "Hipertensão":              ["C5"],
    "Pessoa Idosa":             ["C6"],
    "Prevenção do Câncer":      ["C7"],
  },
  eSB: {
    "1ª Consulta Odontológica":                        ["B1"],
    "Tratamento Odontológico concluído":               ["B2"],
    "Taxa de exodontias":                              ["B3"],
    "Escovação Supervisionada":                        ["B4"],
    "Procedimentos Odontológicos preventivos":         ["B5"],
    "Tratamento Restaurador Atraumático":              ["B6"],
  },
  eMulti: {
    "Média de atendimentos da eMulti por pessoa":             ["M1"],
    "Ações interprofissionais realizadas pela eMulti na APS": ["M2"],
  },
  eCR: {
    "Atendimento — População em Situação de Rua": ["CR1","CR2","CR3","CR4"],
  },
  eAPP: {
    "Indicadores eAPP": ["P1","P2","P3","P4","P5"],
  },
  eSFR: {
    "Mais Acesso":                     ["R1"],
    "Desenvolvimento Infantil":        ["R2"],
    "Cuidado na Gestação e Puerpério": ["R3"],
    "Diabetes":                        ["R4"],
    "Hipertensão":                     ["R5"],
    "Prevenção do Câncer":             ["R6"],
  },
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

// ── Equipes reais Apuí/AM — IBGE 1300144 ─────────────────────────────────────
const EQUIPES_REF = [
  { equipe:"CACHOEIRA",     ubs:"UBS IRMÃ ELIZABETE",                       ine:"0000563104", cnes:"2080168", tipo:"eSF" },
  { equipe:"SÃO SEBASTIÃO", ubs:"UBS ANIZIO FERREIRA DA SILVA",             ine:"0000563066", cnes:"2080168", tipo:"eSF" },
  { equipe:"ACARI",         ubs:"UBS ANIZIO FERREIRA DA SILVA",             ine:"0000563082", cnes:"2080168", tipo:"eSF" },
  { equipe:"TRÊS ESTADOS",  ubs:"UBS OSVALDO LEMES CABRAL",                ine:"0000563120", cnes:"2080168", tipo:"eSF" },
  { equipe:"JUMA",          ubs:"CENTRO DE SAUDE CURUMIM",                 ine:"0000563147", cnes:"6820662", tipo:"eSF" },
  { equipe:"LIBERDADE",     ubs:"CENTRO DE SAUDE CURUMIM",                 ine:"0000563155", cnes:"6820662", tipo:"eSF" },
  { equipe:"KENNEDY",       ubs:"UBS PADRE FALIERO BONCI",                 ine:"0000563163", cnes:"6820662", tipo:"eSF" },
  { equipe:"JK",            ubs:"UBS JK",                                  ine:"0000563171", cnes:"6820662", tipo:"eSF" },
  { equipe:"ESTRADA NOVA",  ubs:"UBS CLAUDIA PEREIRA DOS SANTOS DAMACENA", ine:"0000563198", cnes:"6820662", tipo:"eSF" },
];

// ── NOMES oficiais — Portaria GM/MS 3.493/2024 + NT DEAPS/SAPS/MS 6/2025 ─────
const NOMES: Record<string,string> = {
  // eSF / eAP
  "C1":"Mais Acesso à Atenção Primária à Saúde",
  "C2":"Cuidado no Desenvolvimento Infantil",
  "C3":"Cuidado na Gestação e Puerpério",
  "C4":"Cuidado da Pessoa com Diabetes",
  "C5":"Cuidado da Pessoa com Hipertensão",
  "C6":"Cuidado da Pessoa Idosa",
  "C7":"Cuidado da Mulher na Prevenção do Câncer",
  // eSB
  "B1":"Primeira Consulta Odontológica Programada",
  "B2":"Tratamento Odontológico Concluído",
  "B3":"Taxa de Exodontias",
  "B4":"Escovação Dental Supervisionada",
  "B5":"Procedimentos Odontológicos Preventivos",
  "B6":"Tratamento Restaurador Atraumático",
  // eMulti
  "M1":"Média de Atendimentos por Pessoa pela eMulti na APS",
  "M2":"Ações Interprofissionais Realizadas pela eMulti na APS",
  // eAPP
  "P1":"Mais Acesso à Atenção Primária Prisional",
  "P2":"Cuidado na Gestação (eAPP)",
  "P3":"Cuidado da Pessoa com Diabetes e/ou Hipertensão (eAPP)",
  "P4":"Rastreio de Infecções Sexualmente Transmissíveis (eAPP)",
  "P5":"Cuidado da Pessoa com Tuberculose (eAPP)",
  // eCR
  "CR1":"Mais Acesso à eCR",
  "CR2":"Cuidado na Gestação (eCR)",
  "CR3":"Rastreio de IST (eCR)",
  "CR4":"Cuidado da Pessoa com Tuberculose (eCR)",
  // eSFR
  "R1":"Mais Acesso à eSFR",
  "R2":"Cuidado no Desenvolvimento Infantil (eSFR)",
  "R3":"Cuidado na Gestação e Puerpério (eSFR)",
  "R4":"Cuidado da Pessoa com Diabetes (eSFR)",
  "R5":"Cuidado da Pessoa com Hipertensão (eSFR)",
  "R6":"Cuidado da Mulher na Prevenção do Câncer (eSFR)",
};

// ── Parâmetros de referência — Portaria GM/MS 3.493/2024 ─────────────────────
const METAS: Record<string,number> = {
  C1:75, C2:75, C3:70, C4:50, C5:50, C6:60, C7:40,
  B1:45, B2:45, B3:20, B4:40, B5:50, B6:30,
  M1:2,  M2:30,
  P1:75, P2:70, P3:50, P4:60, P5:85,
  CR1:75,CR2:70,CR3:60,CR4:85,
  R1:75, R2:75, R3:70, R4:50, R5:50, R6:40,
};

// ── Boas práticas por indicador — fichas metodológicas vigentes ───────────────
const BOAS_PRATICAS: Record<string,{cod:string;desc:string;campo:string}[]> = {
  C1:[
    {cod:"BP-C1-a",desc:"Cadastro Individual atualizado (últimos 12 meses)",campo:"Ficha de Cadastro Individual — CDS/e-SUS PEC"},
    {cod:"BP-C1-b",desc:"Cadastro Domiciliar atualizado (últimos 12 meses)",campo:"Ficha de Cadastro Domiciliar — CDS/e-SUS PEC"},
    {cod:"BP-C1-c",desc:"Ao menos 1 atendimento/consulta registrado no período",campo:"Atendimento Individual — CDS/PEC"},
  ],
  C2:[
    {cod:"BP-C2-a",desc:"Criança <2 anos com peso registrado no período",campo:"Ficha de Atendimento Individual — antropometria"},
    {cod:"BP-C2-b",desc:"Comprimento/altura registrado no período",campo:"Ficha de Atendimento Individual — PEC"},
    {cod:"BP-C2-c",desc:"Avaliação de desenvolvimento neuropsicomotor (DNPM)",campo:"Ficha de Atendimento Individual — campo DNPM"},
    {cod:"BP-C2-d",desc:"Vacinação em dia conforme calendário do MS",campo:"e-SUS PEC — módulo vacinação"},
  ],
  C3:[
    {cod:"BP-C3-a",desc:"Gestante com ≥6 consultas de pré-natal realizadas",campo:"Ficha de Atendimento Individual — CIAP2: W78"},
    {cod:"BP-C3-b",desc:"Consulta de puerpério realizada até 42 dias pós-parto",campo:"Ficha de Atendimento Individual — CIAP2: W90/W91"},
    {cod:"BP-C3-c",desc:"Consulta do RN na 1ª semana de vida",campo:"Ficha de Atendimento Individual — CID-10: Z00.1"},
    {cod:"BP-C3-d",desc:"Exames laboratoriais solicitados conforme protocolo",campo:"Ficha de Atendimento Individual — procedimentos"},
  ],
  C4:[
    {cod:"BP-C4-a",desc:"Pessoa com DM2 cadastrada e ativa no território",campo:"Ficha de Cadastro Individual — condição: DM"},
    {cod:"BP-C4-b",desc:"Hemoglobina glicada (HbA1c) solicitada no período",campo:"Ficha de Atendimento Individual — exame HbA1c"},
    {cod:"BP-C4-c",desc:"Consulta médica ou de enfermagem registrada",campo:"Ficha de Atendimento Individual — CIAP2: T90"},
    {cod:"BP-C4-d",desc:"Pressão arterial aferida e registrada",campo:"Ficha de Atendimento Individual — PA"},
  ],
  C5:[
    {cod:"BP-C5-a",desc:"Pessoa com HAS cadastrada e ativa no território",campo:"Ficha de Cadastro Individual — condição: HAS"},
    {cod:"BP-C5-b",desc:"Pressão arterial aferida e registrada no período",campo:"Ficha de Atendimento Individual — PA"},
    {cod:"BP-C5-c",desc:"Consulta médica ou de enfermagem registrada",campo:"Ficha de Atendimento Individual — CIAP2: K86"},
    {cod:"BP-C5-d",desc:"Estratificação de risco cardiovascular realizada",campo:"Ficha de Atendimento Individual — risco CV"},
  ],
  C6:[
    {cod:"BP-C6-a",desc:"Pessoa ≥60 anos com Avaliação Multidimensional Rápida (AMR)",campo:"Ficha de Atendimento Individual — AMR"},
    {cod:"BP-C6-b",desc:"Avaliação cognitiva (MEEM ou equivalente) registrada",campo:"Ficha de Atendimento Individual — campo cognitivo"},
    {cod:"BP-C6-c",desc:"Consulta realizada no período (médico ou enfermeiro)",campo:"Ficha de Atendimento Individual"},
    {cod:"BP-C6-d",desc:"Vacinação em dia (Influenza, Pneumocócica)",campo:"e-SUS PEC — módulo vacinação"},
  ],
  C7:[
    {cod:"BP-C7-a",desc:"Mulher 25–64 anos com citopatológico realizado (últimos 3 anos)",campo:"Ficha de Atendimento Individual — CIAP2: X86 / CID: Z12.4"},
    {cod:"BP-C7-b",desc:"Mulher 50–69 anos com mamografia realizada (últimos 2 anos)",campo:"Ficha de Atendimento Individual — CIAP2: X22 / CID: Z12.3"},
  ],
};

// VALS é agora dinâmico — preenchido pela API /api/pec/indicadores/{competencia}
// Formato: { "C1": { "CACHOEIRA": 82.4, ... }, ... }
// Convertido de: { equipes: { "CACHOEIRA": { C1: 82.4, ... } } }
function buildVals(equipes: Record<string,Record<string,number>>): Record<string,Record<string,number>> {
  const result: Record<string,Record<string,number>> = {};
  for (const [equipe, inds] of Object.entries(equipes)) {
    for (const [cod, pct] of Object.entries(inds)) {
      if (!result[cod]) result[cod] = {};
      result[cod][equipe] = pct;
    }
  }
  return result;
}

function classifVal(v:number, cod:string): string {
  const meta = METAS[cod] ?? 50;
  const g = v - meta;
  if (g >= 10) return "otimo";
  if (g >= 0)  return "bom";
  if (g >= -10) return "suficiente";
  return "regular";
}

function mediaVals(cod: string, vals: Record<string,Record<string,number>>): number | null {
  const v = vals[cod];
  if (!v || Object.keys(v).length === 0) return null;
  const arr = Object.values(v);
  return arr.reduce((s,x)=>s+x,0) / arr.length;
}

// ── Visão por Indicador ───────────────────────────────────────────────────────
function ViewPorIndicador({ codigos, cor, vals }: { codigos:string[]; cor:string; vals:Record<string,Record<string,number>> }) {
  const [expInd, setExpInd] = useState<string|null>(null);

  const inds = useMemo(() => codigos.map(cod => {
    const media = mediaVals(cod, vals);
    const meta  = METAS[cod] ?? 50;
    const temDado = media !== null;
    const cl    = temDado ? classifVal(media!, cod) : "regular";
    const v     = vals[cod] ?? {};
    return { cod, nome: NOMES[cod] ?? cod, meta, media, cl, temDado,
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
        const gap = ind.temDado ? ind.media! - ind.meta : null;
        const exp = expInd === ind.cod;
        const bpList = BOAS_PRATICAS[ind.cod] ?? [];
        const borderCor = ind.temDado ? corClassif(ind.cl) : "#d1d5db";
        return (
          <div key={ind.cod} style={{
            border:`1px solid ${borderCor}33`,
            borderLeft:`4px solid ${borderCor}`,
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
                  <div style={{ fontSize:10, color:"#9ca3af", marginTop:2 }}>
                    Portaria GM/MS 3.493/2024 · Meta de referência: {fmtPct(ind.meta)}
                  </div>
                </div>
                {ind.temDado && <BadgeClassif c={ind.cl}/>}
              </div>

              {/* sem dado */}
              {!ind.temDado ? (
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:"#f8fafc", border:"1px dashed #d1d5db", borderRadius:8, marginBottom:8 }}>
                  <AlertCircle size={14} color="#9ca3af"/>
                  <span style={{ fontSize:12, color:"#6b7280" }}>
                    Dado ainda não disponível. Resultado será exibido após importação do SIAPS ou sincronização do e-SUS PEC.
                  </span>
                </div>
              ) : (
                <>
                  <BarraProgress val={ind.media!} meta={ind.meta} cor={corClassif(ind.cl)}/>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, flexWrap:"wrap", gap:8 }}>
                    <div style={{ display:"flex", gap:20 }}>
                      {[
                        { label:"Resultado", val: fmtPct(ind.media), cor:"#111827" },
                        { label:"Meta",      val: fmtPct(ind.meta),  cor:"#374151" },
                        { label:"GAP",       val: `${gap!>=0?"+":""}${gap!.toFixed(1)}pp`, cor: gap!>=0?VERDE:VERM },
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
                </>
              )}

              {/* Boas práticas */}
              {bpList.length > 0 && (
                <details style={{ marginTop:10 }}>
                  <summary style={{ fontSize:11, color:"#6b7280", cursor:"pointer", listStyle:"none", display:"flex", alignItems:"center", gap:4 }}>
                    <Info size={11}/> Boas práticas — ficha metodológica vigente
                  </summary>
                  <div style={{ marginTop:8, border:"1px solid #e5e7eb", borderRadius:8, overflow:"hidden" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                      <thead>
                        <tr style={{ background:"#f8fafc" }}>
                          <th style={{ padding:"6px 10px", textAlign:"left", color:"#374151", fontWeight:700, width:80 }}>Código</th>
                          <th style={{ padding:"6px 10px", textAlign:"left", color:"#374151", fontWeight:700 }}>Boa Prática</th>
                          <th style={{ padding:"6px 10px", textAlign:"left", color:"#374151", fontWeight:700 }}>Campo no PEC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bpList.map(bp=>(
                          <tr key={bp.cod} style={{ borderTop:"1px solid #f3f4f6" }}>
                            <td style={{ padding:"6px 10px", fontWeight:700, color:cor }}>{bp.cod}</td>
                            <td style={{ padding:"6px 10px", color:"#374151" }}>{bp.desc}</td>
                            <td style={{ padding:"6px 10px", color:"#6b7280" }}>{bp.campo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}

              <button onClick={()=>setExpInd(exp?null:ind.cod)}
                style={{ marginTop:10, fontSize:11, color:"#6b7280", background:"none", border:"1px solid #e5e7eb", borderRadius:6, padding:"4px 10px", cursor:"pointer" }}>
                {exp ? "Ocultar equipes" : "Ver resultado por equipe →"}
              </button>
            </div>

            {/* detalhe por equipe */}
            {exp && (
              <div style={{ borderTop:"1px solid #f3f4f6", background:"#fafafa", padding:"12px 16px" }}>
                {!ind.temDado ? (
                  <div style={{ fontSize:12, color:"#9ca3af", textAlign:"center", padding:"12px 0" }}>
                    Resultado por equipe não disponível — dado ainda não importado do SIAPS.
                  </div>
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:8 }}>
                    {EQUIPES_REF.map(eq=>{
                      const val = vals[ind.cod]?.[eq.equipe];
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
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Visão por Equipe ──────────────────────────────────────────────────────────
function ViewPorEquipe({ codigos, cor, vals }: { codigos:string[]; cor:string; vals:Record<string,Record<string,number>> }) {
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
                const val = vals[cod]?.[eq.equipe];
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
function ViewPorCompetencia({ codigos, cor, filtros, vals }: { codigos:string[]; cor:string; filtros:Filtros; vals:Record<string,Record<string,number>> }) {
  const COMPS_REF = ["2026-04","2026-05","2026-06","2026-07","2026-08"];

  const [codSel, setCodSel] = useState(codigos[0] ?? "");

  const temDado = mediaVals(codSel, vals) !== null;

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
          {!temDado ? (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px", background:"#f8fafc", border:"1px dashed #d1d5db", borderRadius:8 }}>
              <AlertCircle size={16} color="#9ca3af"/>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Dado ainda não disponível</div>
                <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>
                  O histórico de competências será exibido após importação dos resultados oficiais do SIAPS · Meta de referência: {fmtPct(METAS[codSel]??50)}
                </div>
              </div>
            </div>
          ) : null}
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
function PainelAlertas({ codigos, vals }: { codigos:string[]; vals:Record<string,Record<string,number>> }) {
  const alertas = useMemo(()=>{
    const out: {cod:string;nome:string;equipe:string;val:number;meta:number;gap:number;grav:string}[] = [];
    for (const cod of codigos) {
      const meta = METAS[cod]??50;
      if (!meta) continue;
      const v = vals[cod]??{};
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
    const gruposDoTipo = GRUPO_INDS_POR_TIPO[tipoEquipe] ?? {};
    if (grupoSel && gruposDoTipo[grupoSel]) return gruposDoTipo[grupoSel];
    // sem grupo selecionado: exibe todos os indicadores do tipo
    return Object.values(gruposDoTipo).flat();
  }, [tipoEquipe, grupoSel]);

  // ── Busca dados C1–C7 da API (agente PEC) ───────────────────────────────
  const compApi = filtrosAtivos.competencia; // "YYYY-MM"
  const { data: pecData, isLoading: pecLoading } = useQuery({
    queryKey: ["pec-indicadores", compApi],
    queryFn:  () => apiGet(`/api/pec/indicadores/${compApi}`),
    staleTime: 1000 * 60 * 15, // revalida a cada 15 min
    retry: false,
  });
  const vals: Record<string,Record<string,number>> = pecData?.equipes
    ? buildVals(pecData.equipes)
    : {};

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
      {pecLoading && (
        <div style={{ textAlign:"center", padding:24, color:"#6b7280", fontSize:13 }}>
          <Loader2 size={18} style={{ display:"inline", animation:"spin 1s linear infinite", marginRight:6 }}/>
          Buscando dados do e-SUS PEC…
        </div>
      )}
      {!pecLoading && visao === "indicador"   && <ViewPorIndicador  codigos={codigosVisiveis} cor={corAtivo} vals={vals}/>}
      {!pecLoading && visao === "equipe"      && <ViewPorEquipe      codigos={codigosVisiveis} cor={corAtivo} vals={vals}/>}
      {!pecLoading && visao === "competencia" && <ViewPorCompetencia codigos={codigosVisiveis} cor={corAtivo} filtros={filtrosAtivos} vals={vals}/>}

      {/* ── Alertas ──────────────────────────────────── */}
      {codigosVisiveis.length > 0 && (
        <div style={{ marginTop:24, background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, fontSize:13, fontWeight:700, color:"#374151" }}>
            <AlertTriangle size={15} color={AMBAR}/>
            Alertas automáticos
          </div>
          <PainelAlertas codigos={codigosVisiveis} vals={vals}/>
        </div>
      )}

      {/* ── Rodapé LGPD ─────────────────────────────── */}
      <div style={{
        marginTop:16, background:"#f9fafb", border:"1px solid #e5e7eb",
        borderRadius:8, padding:"8px 14px", fontSize:11, color:"#9ca3af",
        display:"flex", alignItems:"center", gap:8,
      }}>
        <Info size={12}/>
        Apuí/AM · IBGE 1300144 · Portaria GM/MS 3.493/2024 + NT DEAPS/SAPS/MS 6/2025 ·
        Resultados exibidos após importação de arquivo oficial do SIAPS ou sincronização do e-SUS PEC · Conforme LGPD
      </div>
    </div>
  );
}
