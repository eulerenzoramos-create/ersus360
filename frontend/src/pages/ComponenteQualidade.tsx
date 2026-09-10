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
// Nomes curtos para cabeçalhos de tabela (sem truncar automaticamente)
const NOMES_CURTOS: Record<string,string> = {
  C1:"Mais Acesso", C2:"Desenv. Infantil", C3:"Gestação/Puerpério",
  C4:"Diabetes", C5:"Hipertensão", C6:"Pessoa Idosa", C7:"Prev. Câncer",
  B1:"1ª Consulta", B2:"Trat. Concluído", B3:"Taxa Exodontias",
  B4:"Escovação Sup.", B5:"Prev. Odonto", B6:"ART",
  M1:"Média Atend.", M2:"Ações Interprofis.",
  R1:"Mais Acesso (R)", R2:"Desenv. Infantil (R)", R3:"Gestação (R)",
  R4:"Diabetes (R)", R5:"Hipertensão (R)", R6:"Prev. Câncer (R)",
  CR1:"Acesso eCR", CR2:"Gestação eCR", CR3:"IST eCR", CR4:"TB eCR",
  P1:"Acesso eAPP", P2:"Gestação eAPP", P3:"DM/HAS eAPP", P4:"IST eAPP", P5:"TB eAPP",
};

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

// ── Parâmetros de referência — Guia de Bolso CONASEMS/MS · Atualização Julho 2026 ─
// Limiar "Ótimo" de cada indicador (usado para classificar resultado)
const METAS: Record<string,number> = {
  // eSF/eAP — C1: Ótimo > 50 (limite sup. 70); C2–C7: Ótimo > 75
  C1:50, C2:75, C3:75, C4:75, C5:75, C6:75, C7:75,
  // eSB — B1: Ótimo > 1,25; B2: Ótimo > 75; B3: Ótimo ≥ 3 (inverted); B4: Ótimo > 1; B5: Ótimo ≥ 65; B6: Ótimo > 8
  B1:1.25, B2:75, B3:3, B4:1, B5:65, B6:8,
  // eMulti — M1: Ótimo > 3; M2: Ótimo > 5
  M1:3, M2:5,
  // eAPP / eCR (mantidos)
  P1:75, P2:70, P3:50, P4:60, P5:85,
  CR1:75,CR2:70,CR3:60,CR4:85,
  // eSFR — R1: Ótimo > 50; R2–R6: Ótimo > 75
  R1:50, R2:75, R3:75, R4:75, R5:75, R6:75,
};

// ── Boas práticas por indicador — Guia de Bolso CONASEMS/MS · Julho 2026 ────────
// Fonte: Portaria GM/MS 3.493/2024 atualizada + NT DEAPS/SAPS/MS 6/2025
const BOAS_PRATICAS: Record<string,{cod:string;desc:string;campo:string}[]> = {
  // C1 — Mais Acesso: indicador de razão (sem boas práticas pontuadas)
  C1:[],

  // C2 — Desenvolvimento Infantil (crianças até 2 anos) — 5 boas práticas · 20 pts cada
  C2:[
    {cod:"A",desc:"1ª consulta presencial por médico(a) ou enfermeiro(a) até o 30º dia de vida (20 pts)",campo:"Atendimento Individual — CBO: 2235/2251/2252 · proc. 03.01.01.006-4"},
    {cod:"B",desc:"≥9 consultas presenciais ou remotas por médico(a) ou enfermeiro(a) até 2 anos (20 pts)",campo:"Atendimento Individual — teleconsulta 03.01.01.025-0"},
    {cod:"C",desc:"≥9 registros simultâneos de peso e altura até 2 anos (20 pts)",campo:"Proc. 01.01.04.002-4 / 01.01.04.008-3 / 01.01.04.007-5 · avaliação crescimento 03.01.01.026-9"},
    {cod:"D",desc:"≥2 visitas domiciliares por ACS/TACS — 1ª até 30 dias de vida, 2ª até 6 meses (20 pts)",campo:"Atendimento Individual — CBO: 5151-05 / 3222-55"},
    {cod:"E",desc:"Vacinas DTPa/Penta, Polio (VIP), SCR/SCRV, Pneumocócica — todas as doses recomendadas (20 pts)",campo:"e-SUS PEC Vacinação — cód. 09/17/29/39/42/43/46/47/58/22/24/56/26/59/106/107"},
  ],

  // C3 — Gestação e Puerpério — 11 boas práticas (A=10 pts; B-K=9 pts cada)
  C3:[
    {cod:"A",desc:"1ª consulta presencial ou remota por médico(a)/enfermeiro(a) até a 12ª semana de gestação (10 pts)",campo:"Atendimento Individual — CIAP2: W78/W79/W81/W84/W85 · CID: O10–O99 / Z32–Z36"},
    {cod:"B",desc:"≥7 consultas presenciais ou remotas por médico(a)/enfermeiro(a) durante a gestação (9 pts)",campo:"Proc. 03.01.01.006-4 / 03.01.01.003-0 / 03.01.01.011-0 / 03.01.01.025-0"},
    {cod:"C",desc:"≥7 registros de aferição de pressão arterial durante a gestação (9 pts)",campo:"Proc. 03.01.10.003-9"},
    {cod:"D",desc:"≥7 registros simultâneos de peso e altura durante a gestação (9 pts)",campo:"Proc. 01.01.04.002-4 / 01.01.04.008-3 / 01.01.04.007-5"},
    {cod:"E",desc:"≥3 visitas domiciliares por ACS/TACS após a 1ª consulta de pré-natal (9 pts)",campo:"Atendimento Individual — CBO: 5151-05 / 3222-55"},
    {cod:"F",desc:"Vacina dTpa (acelular) registrada a partir da 20ª semana de cada gestação (9 pts)",campo:"e-SUS PEC Vacinação — cód. 57 (Vacina dTpa adulto)"},
    {cod:"G",desc:"Testes rápidos ou exames avaliados para sífilis, HIV e hepatites B e C no 1º trimestre (9 pts)",campo:"Proc. 02.14.01.004-0 / 02.14.01.007-4 / 02.14.01.010-4 / 02.14.01.023-6 / 02.14.01.025-2"},
    {cod:"H",desc:"Testes rápidos ou exames avaliados para sífilis e HIV no 3º trimestre (9 pts)",campo:"Proc. 02.14.01.007-4 / 02.14.01.025-2 / 02.14.01.004-0 / 02.14.01.027-9"},
    {cod:"I",desc:"≥1 consulta presencial ou remota por médico(a)/enfermeiro(a) durante o puerpério (9 pts)",campo:"Proc. 03.01.01.012-9 / 03.01.01.006-4 / 03.01.01.025-0 · CIAP2: W90–W96"},
    {cod:"J",desc:"≥1 visita domiciliar por ACS/TACS durante o puerpério (9 pts)",campo:"Atendimento Individual — CBO: 5151-05 / 3222-55 · proc. 03.01.01.013-7"},
    {cod:"K",desc:"≥1 atividade em saúde bucal por cirurgião-dentista ou TSB durante a gestação (9 pts)",campo:"Atendimento Individual — CBO: 2232 / 3224"},
  ],

  // C4 — Diabetes — 6 boas práticas (A/D=20 pts; B/C/E/F=15 pts)
  C4:[
    {cod:"A",desc:"≥1 consulta presencial ou remota por médico(a)/enfermeiro(a) nos últimos 6 meses (20 pts)",campo:"CID: E10/E11/E14 · CIAP2: T89/T90 · proc. 03.01.01.006-4 / 03.01.01.003-0"},
    {cod:"B",desc:"≥1 aferição de pressão arterial registrada nos últimos 6 meses (15 pts)",campo:"Proc. 03.01.10.003-9"},
    {cod:"C",desc:"≥1 registro simultâneo de peso e altura nos últimos 12 meses (15 pts)",campo:"Proc. 01.01.04.002-4 / 01.01.04.008-3 / 01.01.04.007-5"},
    {cod:"D",desc:"≥2 visitas domiciliares por ACS/TACS com intervalo ≥30 dias nos últimos 12 meses (20 pts)",campo:"Atendimento Individual — CBO: 5151-05 / 3222-55"},
    {cod:"E",desc:"≥1 solicitação ou avaliação de hemoglobina glicada (HbA1c) nos últimos 12 meses (15 pts)",campo:"Proc. 02.02.01.050-3 · SIGTAP ABEX008"},
    {cod:"F",desc:"≥1 avaliação dos pés realizada nos últimos 12 meses (15 pts)",campo:"Proc. 03.01.04.009-5 (Exame do pé diabético)"},
  ],

  // C5 — Hipertensão — 4 boas práticas · 25 pts cada
  C5:[
    {cod:"A",desc:"≥1 consulta presencial ou remota por médico(a)/enfermeiro(a) nos últimos 6 meses (25 pts)",campo:"CID: I10–I15/O10–O11 · CIAP2: K86/K87 · proc. 03.01.01.006-4 / 03.01.01.003-0"},
    {cod:"B",desc:"≥1 aferição de pressão arterial registrada nos últimos 6 meses (25 pts)",campo:"Proc. 03.01.10.003-9"},
    {cod:"C",desc:"≥1 registro simultâneo de peso e altura nos últimos 12 meses (25 pts)",campo:"Proc. 01.01.04.002-4 / 01.01.04.008-3 / 01.01.04.007-5"},
    {cod:"D",desc:"≥2 visitas domiciliares por ACS/TACS com intervalo ≥30 dias nos últimos 12 meses (25 pts)",campo:"Atendimento Individual — CBO: 5151-05 / 3222-55"},
  ],

  // C6 — Pessoa Idosa (≥60 anos) — 4 boas práticas · 25 pts cada
  C6:[
    {cod:"A",desc:"≥1 consulta presencial ou remota por médico(a)/enfermeiro(a) nos últimos 12 meses (25 pts)",campo:"Proc. 03.01.01.006-4 / 03.01.01.003-0 / 03.01.01.025-0"},
    {cod:"B",desc:"≥1 registro simultâneo de peso e altura (avaliação antropométrica) nos últimos 12 meses (25 pts)",campo:"Proc. 01.01.04.002-4 / 01.01.04.008-3 / 01.01.04.007-5"},
    {cod:"C",desc:"≥2 visitas domiciliares por ACS/TACS com intervalo ≥30 dias nos últimos 12 meses (25 pts)",campo:"Atendimento Individual — CBO: 5151-05 / 3222-55"},
    {cod:"D",desc:"≥1 dose da vacina contra influenza nos últimos 12 meses (25 pts)",campo:"e-SUS PEC Vacinação — cód. 33 (trivalente) / 77 (tetravalente)"},
  ],

  // C7 — Prevenção do Câncer — 4 boas práticas (A/D=20 pts; B/C=30 pts)
  C7:[
    {cod:"A",desc:"≥1 exame rastreamento câncer colo útero em mulheres/homens trans 25–64 anos (últimos 36 meses; 60 meses se HPV molecular) (20 pts)",campo:"Proc. 02.01.02.003-3 / 02.03.01.008-6 / 02.03.01.001-9 / 02.01.02.007-6 / 02.02.10.025-1"},
    {cod:"B",desc:"≥1 dose vacina HPV para crianças/adolescentes do sexo feminino 9–14 anos (30 pts)",campo:"e-SUS PEC Vacinação — cód. 67 (HPV quadrivalente) / 93 (HPV nonavalente)"},
    {cod:"C",desc:"≥1 atendimento presencial/remoto sobre saúde sexual e reprodutiva para adolescentes/mulheres/homens trans 14–69 anos (últimos 12 meses) (30 pts)",campo:"Proc. 03.01.01.003-0 / 03.01.01.006-4 / 03.01.01.025-0 · CID: Z30/Z70 · CIAP2: X01–X13"},
    {cod:"D",desc:"≥1 exame rastreamento câncer mama em mulheres/homens trans 50–69 anos (últimos 24 meses) (20 pts)",campo:"Proc. 02.04.03.003-0 / 02.04.03.018-8"},
  ],

  // eSB — B1: Primeira Consulta Programada (razão por pessoa; sem boas práticas)
  B1:[],
  // B2 — Tratamento Concluído
  B2:[
    {cod:"—",desc:"Nº pessoas com tratamento odontológico concluído ÷ Nº pessoas com 1ª consulta odontológica programada no período (resultado em %)",campo:"Proc. 03.01.01.015-3 (conclusão registrada pelo CD) — CBO: 2232-08/93/72"},
  ],
  // B3 — Taxa de Exodontia (Ótimo: ≥3% e <10%; resultado invertido)
  B3:[
    {cod:"—",desc:"Nº exodontias ÷ Total de procedimentos individuais preventivos, curativos e exodontias (%). Ótimo: ≥3% e <10%",campo:"Numerador: proc. 04.14.02.013-8 / 04.14.02.014-6 · Denominador: procedimentos clínicos eSB"},
  ],
  // B4 — Escovação Supervisionada (razão; sem boas práticas)
  B4:[],
  // B5 — Procedimentos Odontológicos Preventivos (Ótimo: ≥65% e ≤85%)
  B5:[
    {cod:"—",desc:"Nº procedimentos preventivos individuais ÷ Total de procedimentos individuais (%). Ótimo: ≥65% e ≤85%",campo:"Numerador: cariostático/selante/flúor/higiene/profilaxia · proc. 01.01.02.005-8 a 01.01.02.012-0 / 03.07.03.004-0"},
  ],
  // B6 — Tratamento Restaurador Atraumático (Ótimo: >8%)
  B6:[
    {cod:"—",desc:"Nº procedimentos ART ÷ Total de procedimentos restauradores (%). Ótimo: >8%",campo:"Numerador: proc. 03.07.01.007-4 · Denominador: restaurações 03.07.01.003-1/008-2/010-4/011-2/012-0 + ART"},
  ],

  // eMulti — M1: Média de atendimentos por pessoa (Ótimo: >3)
  M1:[
    {cod:"—",desc:"Nº total de atendimentos individuais e coletivos da eMulti ÷ Nº pessoas com ≥1 atendimento individual ou participação em atividade coletiva no período",campo:"Atendimento Individual/Coletivo — CBOs eMulti (assistente social, farmacêutico, fisioterapeuta, fono, nutricionista, psicólogo, terapeuta ocupacional, educador físico, geriatra, pediatra, etc.)"},
  ],
  // M2 — Ações Interprofissionais (Ótimo: >5%)
  M2:[
    {cod:"—",desc:"Ações compartilhadas entre eMulti e outras equipes ÷ Total de ações da eMulti (%). Inclui atendimentos individuais compartilhados, atividades coletivas compartilhadas e Módulo Compartilhamento do Cuidado do PEC",campo:"PEC — ações com ≥1 CNS de CBO eMulti como profissional principal ou secundário em ação compartilhada com eSF/eAP/eSB/eCR/eSFR/UBSF"},
  ],

  // eSFR — R1: Acesso (sem boas práticas, mesmo parâmetro do C1)
  R1:[],
  // R2 — Desenvolvimento Infantil (eSFR) — 4 boas práticas · 25 pts cada
  R2:[
    {cod:"A",desc:"≥6 consultas presenciais ou remotas por médico(a)/enfermeiro(a) até 2 anos de vida (25 pts)",campo:"Atendimento Individual — CBO: 2235/2251/2252 · proc. 03.01.01.006-4 / 03.01.01.025-0"},
    {cod:"B",desc:"≥6 registros simultâneos de peso e altura até 2 anos de vida (25 pts)",campo:"Proc. 01.01.04.002-4 / 01.01.04.008-3 / 01.01.04.007-5"},
    {cod:"C",desc:"≥6 visitas domiciliares por ACS/TACS — 1ª até 30 dias de vida, 2ª até 6 meses (25 pts)",campo:"Atendimento Individual — CBO: 5151-05 / 3222-55"},
    {cod:"D",desc:"Vacinas DTPa/Penta, Polio, SCR/SCRV, Pneumocócica — todas as doses recomendadas (25 pts)",campo:"e-SUS PEC Vacinação — cód. 09/17/29/39/42/43/46/47/58/22/24/56/26/59/106/107"},
  ],
  // R3 — Gestação e Puerpério (eSFR) — 9 boas práticas (A/I=15 pts; B–H=10 pts)
  R3:[
    {cod:"A",desc:"≥5 consultas presenciais ou remotas por médico(a)/enfermeiro(a) durante a gestação (15 pts)",campo:"Proc. 03.01.01.006-4 / 03.01.01.003-0 / 03.01.01.011-0 / 03.01.01.025-0"},
    {cod:"B",desc:"≥5 registros de aferição de pressão arterial durante a gestação (10 pts)",campo:"Proc. 03.01.10.003-9"},
    {cod:"C",desc:"≥5 registros simultâneos de peso e altura durante a gestação (10 pts)",campo:"Proc. 01.01.04.002-4 / 01.01.04.008-3 / 01.01.04.007-5"},
    {cod:"D",desc:"≥3 visitas domiciliares por ACS/TACS com intervalo ≥30 dias após 1ª consulta (10 pts)",campo:"Atendimento Individual — CBO: 5151-05 / 3222-55"},
    {cod:"E",desc:"Testes rápidos ou exames para sífilis, HIV e hepatites B e C no 1º trimestre (10 pts)",campo:"Proc. 02.14.01.004-0 / 02.14.01.007-4 / 02.14.01.010-4 / 02.14.01.023-6 / 02.14.01.025-2"},
    {cod:"F",desc:"Testes rápidos ou exames para sífilis e HIV no 3º trimestre (10 pts)",campo:"Proc. 02.14.01.007-4 / 02.14.01.025-2 / 02.14.01.004-0 / 02.14.01.027-9"},
    {cod:"G",desc:"≥1 consulta presencial ou remota por médico(a)/enfermeiro(a) durante o puerpério (10 pts)",campo:"Proc. 03.01.01.012-9 / 03.01.01.006-4 / 03.01.01.025-0"},
    {cod:"H",desc:"≥1 visita domiciliar por ACS/TACS durante o puerpério (10 pts)",campo:"Atendimento Individual — CBO: 5151-05 / 3222-55 · proc. 03.01.01.013-7"},
    {cod:"I",desc:"≥1 atividade em saúde bucal por cirurgião-dentista ou TSB durante a gestação (15 pts)",campo:"Atendimento Individual — CBO: 2232 / 3224"},
  ],
  // R4 — Diabetes (eSFR) — 6 boas práticas (A/D=20 pts; B/C/E/F=15 pts — D=25 pts)
  R4:[
    {cod:"A",desc:"≥1 consulta presencial ou remota por médico(a)/enfermeiro(a) nos últimos 6 meses (20 pts)",campo:"CID: E10/E11/E14 · CIAP2: T89/T90 · proc. 03.01.01.006-4 / 03.01.01.003-0"},
    {cod:"B",desc:"≥1 aferição de pressão arterial registrada nos últimos 6 meses (15 pts)",campo:"Proc. 03.01.10.003-9"},
    {cod:"C",desc:"≥1 registro de peso e altura nos últimos 12 meses (15 pts)",campo:"Proc. 01.01.04.002-4 / 01.01.04.008-3 / 01.01.04.007-5"},
    {cod:"D",desc:"≥2 visitas domiciliares por ACS/TACS com intervalo ≥30 dias nos últimos 12 meses (25 pts)",campo:"Atendimento Individual — CBO: 5151-05 / 3222-55"},
    {cod:"E",desc:"≥1 registro de Hemoglobina Glicada solicitada ou avaliada nos últimos 12 meses (15 pts)",campo:"Proc. 02.02.01.050-3 · SIGTAP ABEX008"},
    {cod:"F",desc:"≥1 registro de avaliação dos pés nos últimos 12 meses (15 pts)",campo:"Proc. 03.01.04.009-5 (Exame do pé diabético)"},
  ],
  // R5 — Hipertensão (eSFR) — 4 boas práticas · 25 pts cada (igual ao C5)
  R5:[
    {cod:"A",desc:"≥1 consulta presencial ou remota por médico(a)/enfermeiro(a) nos últimos 6 meses (25 pts)",campo:"CID: I10–I15/O10–O11 · CIAP2: K86/K87"},
    {cod:"B",desc:"≥1 aferição de pressão arterial registrada nos últimos 6 meses (25 pts)",campo:"Proc. 03.01.10.003-9"},
    {cod:"C",desc:"≥1 registro simultâneo de peso e altura nos últimos 12 meses (25 pts)",campo:"Proc. 01.01.04.002-4 / 01.01.04.008-3 / 01.01.04.007-5"},
    {cod:"D",desc:"≥2 visitas domiciliares por ACS/TACS com intervalo ≥30 dias nos últimos 12 meses (25 pts)",campo:"Atendimento Individual — CBO: 5151-05 / 3222-55"},
  ],
  // R6 — Prevenção do Câncer (eSFR) — 2 boas práticas · 50 pts cada
  R6:[
    {cod:"A",desc:"≥1 exame rastreamento câncer colo útero em mulheres/homens trans 25–64 anos (últimos 36 meses) (50 pts)",campo:"Proc. 02.01.02.003-3 / 02.03.01.008-6 / 02.03.01.001-9 / 02.01.02.007-6 / ABEX001 / ABP022"},
    {cod:"B",desc:"≥1 dose vacina HPV para crianças/adolescentes do sexo feminino 9–14 anos (50 pts)",campo:"e-SUS PEC Vacinação — cód. 67 (HPV quadrivalente) / 93 (HPV nonavalente)"},
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
const _BADGE: Record<string,{bg:string;color:string;label:string}> = {
  otimo:      { bg:"#dbeafe", color:"#1d4ed8", label:"Ótimo"      },
  bom:        { bg:"#dcfce7", color:"#16a34a", label:"Bom"        },
  suficiente: { bg:"#fef9c3", color:"#92400e", label:"Suf."       },
  regular:    { bg:"#fee2e2", color:"#dc2626", label:"Regular"    },
};

function CelulaEquipe({ val, cod }: { val:number|undefined; cod:string }) {
  if (val == null) return (
    <td style={{ padding:"10px 8px", textAlign:"center", verticalAlign:"middle" }}>
      <span style={{ fontSize:11, color:"#d1d5db", fontStyle:"italic" }}>—</span>
    </td>
  );
  const meta = METAS[cod] ?? 50;
  const cl   = classifVal(val, cod);
  const bd   = _BADGE[cl] ?? _BADGE.regular;
  const pct  = Math.min(100, (val / (meta * 1.4)) * 100);
  const mpct = Math.min(100, (meta / (meta * 1.4)) * 100);
  return (
    <td style={{ padding:"10px 8px", textAlign:"center", verticalAlign:"middle" }}>
      {/* valor + badge */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, marginBottom:5 }}>
        <span style={{ fontSize:13, fontWeight:800, color:bd.color, fontVariantNumeric:"tabular-nums" }}>
          {fmtPct(val)}
        </span>
        <span style={{
          fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:99,
          background:bd.bg, color:bd.color, letterSpacing:.3,
        }}>{bd.label}</span>
      </div>
      {/* barra com marcador de meta */}
      <div style={{ position:"relative", height:6, background:"#f3f4f6", borderRadius:99, overflow:"hidden" }}>
        <div style={{
          position:"absolute", left:0, top:0, bottom:0,
          width:`${pct}%`, borderRadius:99,
          background: cl==="otimo"?"#3b82f6": cl==="bom"?"#22c55e": cl==="suficiente"?"#f59e0b":"#ef4444",
          transition:"width .3s",
        }}/>
      </div>
      {/* linha de meta */}
      <div style={{ position:"relative", height:3 }}>
        <div style={{
          position:"absolute", top:0, bottom:0,
          left:`calc(${mpct}% - 1px)`,
          width:2, background:"#6b7280", borderRadius:1,
        }}/>
      </div>
      <div style={{ fontSize:9, color:"#9ca3af", marginTop:1, fontVariantNumeric:"tabular-nums" }}>
        meta {fmtPct(meta)}
      </div>
    </td>
  );
}

function ViewPorEquipe({ codigos, cor, vals }: { codigos:string[]; cor:string; vals:Record<string,Record<string,number>> }) {
  // score global por equipe (média dos indicadores disponíveis)
  const scores = useMemo(()=> EQUIPES_REF.map(eq=>{
    const disponíveis = codigos.filter(c=> vals[c]?.[eq.equipe] != null);
    const soma = disponíveis.reduce((s,c)=> s + (vals[c]?.[eq.equipe]??0), 0);
    return { equipe:eq.equipe, media: disponíveis.length ? soma/disponíveis.length : null };
  }), [codigos, vals]);

  return (
    <div>
      {/* legenda */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:12, fontSize:11, color:"#6b7280" }}>
        {Object.entries(_BADGE).map(([k,b])=>(
          <span key={k} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ width:10, height:10, borderRadius:3, background:b.bg, border:`1px solid ${b.color}`, display:"inline-block" }}/>
            {b.label}
          </span>
        ))}
        <span style={{ marginLeft:8 }}>
          <span style={{ display:"inline-block", width:2, height:10, background:"#6b7280", marginRight:3, verticalAlign:"middle" }}/>
          linha = meta
        </span>
      </div>

      <div style={{ overflowX:"auto", borderRadius:10, border:"1px solid #e5e7eb" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr>
              {/* Equipe — sticky */}
              <th style={{
                padding:"12px 16px", textAlign:"left", fontWeight:700, whiteSpace:"nowrap",
                background:"#1e3a5f", color:"#fff", position:"sticky", left:0, zIndex:3,
                borderRight:"2px solid #2d5491",
              }}>Equipe</th>
              {/* UBS */}
              <th style={{ padding:"12px 14px", textAlign:"left", fontWeight:600,
                background:"#1e3a5f", color:"#93c5fd", whiteSpace:"nowrap", fontSize:11 }}>
                UBS
              </th>
              {/* Média geral */}
              <th style={{ padding:"12px 10px", textAlign:"center", fontWeight:700,
                background:"#1e3a5f", color:"#fff", whiteSpace:"nowrap", borderRight:"2px solid #2d5491" }}>
                Média
              </th>
              {/* Indicadores */}
              {codigos.map(cod=>(
                <th key={cod} style={{
                  padding:"10px 6px", textAlign:"center", background:"#1e3a5f",
                  color:"#fff", minWidth:120,
                }}>
                  <div style={{ fontSize:10, color:"#93c5fd", letterSpacing:.5, fontWeight:600 }}>{cod}</div>
                  <div style={{ fontSize:11, fontWeight:600, marginTop:2, lineHeight:1.2 }}>
                    {NOMES_CURTOS[cod] ?? cod}
                  </div>
                  <div style={{ fontSize:9, color:"#64748b", marginTop:2 }}>
                    meta {METAS[cod] != null ? `${METAS[cod]}%` : "—"}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EQUIPES_REF.map((eq,i)=>{
              const sc    = scores.find(s=>s.equipe===eq.equipe);
              const scCl  = sc?.media != null ? classifVal(sc.media, "C2") : "regular";
              const bd    = _BADGE[scCl] ?? _BADGE.regular;
              const bgRow = i%2===0 ? "#fff" : "#f8fafc";
              return (
                <tr key={eq.equipe} style={{ background:bgRow }}>
                  {/* Equipe — sticky */}
                  <td style={{
                    padding:"10px 16px", fontWeight:800, fontSize:13, whiteSpace:"nowrap",
                    borderBottom:"1px solid #e5e7eb", position:"sticky", left:0,
                    background:bgRow, zIndex:1, borderRight:"2px solid #e5e7eb",
                  }}>{eq.equipe}</td>
                  {/* UBS */}
                  <td style={{
                    padding:"10px 14px", color:"#6b7280", fontSize:10,
                    borderBottom:"1px solid #e5e7eb", whiteSpace:"nowrap",
                  }}>{eq.ubs.length>30 ? eq.ubs.slice(0,30)+"…" : eq.ubs}</td>
                  {/* Média */}
                  <td style={{ padding:"10px 8px", textAlign:"center",
                    borderBottom:"1px solid #e5e7eb", borderRight:"2px solid #e5e7eb" }}>
                    {sc?.media != null ? (
                      <span style={{
                        display:"inline-block", padding:"4px 12px", borderRadius:99,
                        background:bd.bg, color:bd.color,
                        fontWeight:800, fontSize:13, fontVariantNumeric:"tabular-nums",
                        border:`1px solid ${bd.color}40`,
                      }}>{sc.media.toFixed(1)}%</span>
                    ) : <span style={{ color:"#d1d5db", fontSize:11 }}>—</span>}
                  </td>
                  {/* Células por indicador */}
                  {codigos.map(cod=>(
                    <CelulaEquipe key={cod} val={vals[cod]?.[eq.equipe]} cod={cod}/>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
