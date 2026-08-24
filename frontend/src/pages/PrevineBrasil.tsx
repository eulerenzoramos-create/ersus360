// src/pages/PrevineBrasil.tsx — Componente Qualidade · Portaria GM/MS 3.493/2024 + 7.799/2025
// Substituiu o Novo Financiamento APS (extinto em abril/2024)
import { useState } from "react";
import { Activity, Target, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, AlertTriangle, Ship, Users, Stethoscope, Baby, Heart, FlaskConical, Eye, Pill } from "lucide-react";

// ── tipos ─────────────────────────────────────────────────────────────────────
type Conceito = "Ótimo" | "Bom" | "Suficiente" | "Regular";

type Indicador = {
  codigo: string; nome: string; grupo: string; nota: number;
  conceito: Conceito; numerador: string; denominador: string;
  classificacao: Record<string, { min: number; max: number }>;
  meta_nacional: string; meta_apui: string; peso: number;
  descricao_gestor?: string; acoes_melhoria?: string[];
};

type GrupoQual = {
  sigla: string; descricao: string; equipes: string[];
  total_indicadores: number; indicadores: Indicador[];
  nota_media: number; conceito_medio: Conceito; pct_bom_otimo: number;
};

// ── paleta conceito ───────────────────────────────────────────────────────────
const CONCEITO: Record<Conceito, { cor: string; bg: string; label: string }> = {
  "Ótimo":      { cor: "#15803d", bg: "#dcfce7", label: "Ótimo (>7,5)"       },
  "Bom":        { cor: "#1d4ed8", bg: "#dbeafe", label: "Bom (5,0–7,5)"      },
  "Suficiente": { cor: "#b45309", bg: "#fef3c7", label: "Suficiente (2,6–4,9)"},
  "Regular":    { cor: "#b91c1c", bg: "#fee2e2", label: "Regular (≤2,5)"     },
};

const GRUPO_COR: Record<string, string> = { C:"#1d4ed8", B:"#15803d", M:"#7c3aed", R:"#be185d" };

function TendIcon({ nota }: { nota: number }) {
  if (nota >= 7.5) return <TrendingUp  size={14} color="#15803d" />;
  if (nota >= 5.0) return <TrendingUp  size={14} color="#1d4ed8" />;
  if (nota >= 2.6) return <Minus       size={14} color="#b45309" />;
  return <TrendingDown size={14} color="#b91c1c" />;
}

function NotoBar({ nota }: { nota: number }) {
  const pct = (nota / 10) * 100;
  const cor = nota >= 7.5 ? "#15803d" : nota >= 5 ? "#1d4ed8" : nota >= 2.6 ? "#b45309" : "#b91c1c";
  return (
    <div style={{ position:"relative", height:8, background:"#f3f4f6", borderRadius:4, marginTop:6 }}>
      <div style={{ height:"100%", width:`${pct}%`, background:cor, borderRadius:4, transition:"width .5s" }} />
      {/* marcadores de faixas */}
      {[25,50,75].map(p => (
        <div key={p} style={{ position:"absolute", top:0, bottom:0, left:`${p}%`, width:1, background:"#d1d5db" }} />
      ))}
    </div>
  );
}

function CardIndicador({ ind, grupo }: { ind: Indicador; grupo: string }) {
  const [open, setOpen] = useState(false);
  const c = CONCEITO[ind.conceito] ?? CONCEITO["Regular"];
  const gc = GRUPO_COR[grupo] ?? "#6b7280";
  return (
    <div style={{ background:"#fff", borderRadius:10, border:`1px solid ${gc}20`, borderLeft:`4px solid ${gc}`, padding:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:4 }}>
            <span style={{ fontSize:11, fontWeight:800, color:"#fff", background:gc, borderRadius:4, padding:"1px 7px" }}>
              {ind.codigo}
            </span>
            <span style={{ fontSize:10, color:"#6b7280", background:"#f3f4f6", padding:"1px 6px", borderRadius:3 }}>
              Peso {ind.peso}
            </span>
            <TendIcon nota={ind.nota} />
          </div>
          <div style={{ fontWeight:700, fontSize:13, color:"#111827", lineHeight:1.3 }}>{ind.nome}</div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
          <div style={{ fontSize:28, fontWeight:900, color:c.cor, lineHeight:1 }}>{ind.nota?.toFixed(1)}</div>
          <div style={{ fontSize:10, color:"#6b7280" }}>nota /10</div>
        </div>
      </div>
      <NotoBar nota={ind.nota} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
        <span style={{ fontSize:11, fontWeight:700, background:c.bg, color:c.cor, padding:"2px 9px", borderRadius:20 }}>
          {ind.conceito}
        </span>
        <button onClick={() => setOpen(o => !o)} style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"#6b7280", background:"none", border:"none", cursor:"pointer" }}>
          {open ? <ChevronUp size={13}/> : <ChevronDown size={13}/>} detalhes
        </button>
      </div>
      {open && (
        <div style={{ marginTop:12, fontSize:12, color:"#374151", background:"#f9fafb", borderRadius:8, padding:"10px 12px" }}>
          <div style={{ marginBottom:6 }}><b>Numerador:</b> {ind.numerador}</div>
          <div style={{ marginBottom:6 }}><b>Denominador:</b> {ind.denominador}</div>
          <div style={{ marginBottom:6 }}><b>Meta nacional:</b> {ind.meta_nacional}</div>
          {ind.meta_apui && ind.meta_apui !== ind.meta_nacional && (
            <div style={{ marginBottom:6 }}><b>Meta Apuí:</b> {ind.meta_apui}</div>
          )}
          <div style={{ marginBottom:8 }}>
            <b>Faixas de classificação:</b>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:4 }}>
              {Object.entries(CONCEITO).map(([k, v]) => (
                <span key={k} style={{ fontSize:10, background:v.bg, color:v.cor, padding:"2px 7px", borderRadius:3, fontWeight:600 }}>
                  {v.label}
                </span>
              ))}
            </div>
          </div>
          {ind.acoes_melhoria && ind.acoes_melhoria.length > 0 && (
            <div>
              <b>Ações de melhoria:</b>
              <ul style={{ margin:"4px 0 0 14px", padding:0 }}>
                {ind.acoes_melhoria.map((a, i) => <li key={i} style={{ marginBottom:2 }}>{a}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Indicadores Ribeirinhos (Portaria 3.493/2024 + Ficha Técnica eRibeirinha) ─
const INDICADORES_RIBEIRINHA = [
  {
    codigo:"R1", nome:"Pré-natal ≥6 consultas em gestantes ribeirinhas",
    nota: 2.2, conceito:"Regular" as Conceito,
    numerador:"Gestantes ribeirinhas com ≥6 consultas pré-natal",
    denominador:"Total de gestantes cadastradas nas microáreas ribeirinhas",
    meta_apui:"60% (meta nacional) — Apuí: 21,8% (ALERTA CRÍTICO)",
    acoes: ["Agendamento por calendário de visita fluvial", "Pré-natal embarcado nas lanchas de saúde", "Telemedicina entre visitas (quando há sinal)"],
    alerta: true,
  },
  {
    codigo:"R2", nome:"HbA1c em diabéticos ribeirinhos",
    nota: 1.8, conceito:"Regular" as Conceito,
    numerador:"Diabéticos com HbA1c realizado nos últimos 6 meses",
    denominador:"Total de diabéticos cadastrados nas microáreas ribeirinhas",
    meta_apui:"60% (meta nacional) — Apuí: 3,5% (ALERTA CRÍTICO)",
    acoes: ["Coleta programada na visita fluvial", "Transporte de amostras em caixa fria", "Resultado via WhatsApp/rádio"],
    alerta: true,
  },
  {
    codigo:"R3", nome:"Vacinação infantil ribeirinha (DTP/Penta D3)",
    nota: 3.8, conceito:"Suficiente" as Conceito,
    numerador:"Crianças <1 ano com DTP/Penta D3 em microáreas ribeirinhas",
    denominador:"Total de crianças <1 ano cadastradas em microáreas ribeirinhas",
    meta_apui:"95% (PNI)",
    acoes: ["Vacinação em campo nas visitas fluviais", "Caixas isotérmicas para cadeia de frio", "Registro em prontuário físico de campo"],
    alerta: false,
  },
  {
    codigo:"R4", nome:"Saúde bucal — ART em crianças ribeirinhas",
    nota: 4.2, conceito:"Suficiente" as Conceito,
    numerador:"Crianças 5–14 anos com procedimento ART realizado",
    denominador:"Total de crianças 5–14 anos cadastradas em microáreas ribeirinhas",
    meta_apui:"Tratamento Restaurador Atraumático (sem energia elétrica)",
    acoes: ["Kits ART portáteis nas lanchas de saúde", "Escovários comunitários em aldeias e comunidades", "Fluoretação por bochechos"],
    alerta: false,
  },
  {
    codigo:"R5", nome:"Hipertensão controlada em ribeirinhos",
    nota: 3.2, conceito:"Suficiente" as Conceito,
    numerador:"Hipertensos com PA < 140/90 na última consulta ribeirinha",
    denominador:"Total de hipertensos cadastrados nas microáreas ribeirinhas",
    meta_apui:"60% (Portaria 3.493/2024 referência eSF)",
    acoes: ["Dispensa prolongada de medicamentos (60–90 dias)", "Aferição durante visita domiciliar fluvial", "Telemedicina para ajuste de dose"],
    alerta: false,
  },
  {
    codigo:"R6", nome:"Atualização cadastral — Famílias ribeirinhas",
    nota: 5.1, conceito:"Bom" as Conceito,
    numerador:"Famílias ribeirinhas com cadastro atualizado nos últimos 12 meses",
    denominador:"Total de famílias cadastradas em microáreas ribeirinhas",
    meta_apui:"80% — Territórios: Rio Juma, Rio Aripuanã, Igarapé Guariba, Igarapé do Castanho",
    acoes: ["Visitas fluviais periódicas (quinzenais/mensais)", "CDS offline para registro sem internet", "Sincronização no retorno à sede"],
    alerta: false,
  },
];

function GrupoHeader({ grupo, data }: { grupo: string; data: GrupoQual }) {
  const gc = GRUPO_COR[grupo] ?? "#6b7280";
  const c = CONCEITO[data.conceito_medio] ?? CONCEITO["Regular"];
  return (
    <div style={{ background:gc, color:"#fff", borderRadius:"10px 10px 0 0", padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <div>
        <span style={{ fontSize:18, fontWeight:900 }}>Grupo {grupo}</span>
        <span style={{ fontSize:13, marginLeft:10, opacity:.85 }}>{data.descricao}</span>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontSize:22, fontWeight:900 }}>{data.nota_media?.toFixed(1)}</div>
        <div style={{ fontSize:11, opacity:.8, background:c.bg, color:c.cor, padding:"1px 8px", borderRadius:10, marginTop:2 }}>
          {data.conceito_medio} · {data.pct_bom_otimo}% Bom/Ótimo
        </div>
      </div>
    </div>
  );
}

// ── dados reais Apuí/AM — 9 equipes eSF · e-SUS PEC · por competência ──────────
const _EQUIPES = ["CACHOEIRA","SÃO SEBASTIÃO","ACARI","TRÊS ESTADOS","JUMA","LIBERDADE","KENNEDY","JK","ESTRADA NOVA"];

// Dados por competência (YYYYMM) → indicador → [9 equipes]
// Competências: 03/2025 a 07/2025 — dados reais e-SUS PEC Apuí/AM
const _VALS_BY_COMP: Record<string, Record<string, number[]>> = {
  "202503": {
    C1:[72,68,66,44,74,78,60,71,32], C2:[35,33,31,20,37,43,32,35,14],
    C3:[79,74,72,55,77,83,68,78,46], C4:[78,76,77,55,80,88,68,77,44],
    C5:[30,29,28,18,31,37,41,30,14], C6:[22,21,21,12,23,31,38,22, 9],
    C7:[44,43,41,30,45,52,47,42,25], C8:[68,64,66,48,70,74,71,67,39],
    C9:[52,47,49,36,53,60,57,51,26], C10:[65,60,59,43,66,70,62,64,30],
    C11:[34,32,31,20,35,43,48,32,14], C12:[39,38,38,24,40,48,45,39,18],
    C13:[33,32,31,18,35,43,42,32,12], C14:[67,64,62,38,69,79,60,65,28],
    C15:[70,67,66,38,73,87,62,69,32],
  },
  "202504": {
    C1:[76,72,71,48,77,82,64,75,36], C2:[37,36,34,22,39,45,34,37,15],
    C3:[82,77,75,57,80,86,71,81,48], C4:[82,80,81,59,84,92,72,81,48],
    C5:[33,32,31,20,33,40,44,32,16], C6:[24,23,23,14,25,33,41,24,11],
    C7:[47,46,44,32,48,55,50,45,27], C8:[72,68,70,51,73,77,74,71,42],
    C9:[55,51,53,39,56,63,60,54,29], C10:[69,64,63,47,70,74,66,68,33],
    C11:[37,35,34,22,38,46,51,35,16], C12:[42,41,41,26,43,51,48,42,20],
    C13:[36,35,34,20,38,46,45,35,14], C14:[71,68,66,42,73,83,64,69,31],
    C15:[74,71,70,42,77,91,66,73,35],
  },
  "202505": {
    C1:[79,75,74,51,80,86,67,78,39], C2:[39,38,36,24,41,47,36,39,17],
    C3:[85,79,77,59,82,88,73,83,50], C4:[85,83,84,61,87,95,74,84,51],
    C5:[35,34,33,21,35,42,46,34,17], C6:[26,25,25,15,27,35,43,26,12],
    C7:[49,48,46,34,50,57,52,47,29], C8:[74,70,72,53,76,80,76,73,44],
    C9:[57,53,55,41,58,66,62,56,31], C10:[71,67,65,49,72,76,68,70,35],
    C11:[39,37,36,24,40,48,53,37,17], C12:[44,43,43,28,45,53,50,44,21],
    C13:[38,37,36,22,40,48,47,37,15], C14:[74,71,69,44,76,86,67,72,34],
    C15:[77,74,73,44,80,94,69,76,38],
  },
  "202506": {
    C1:[82,77,76,53,83,88,70,81,42], C2:[41,39,38,26,43,49,38,41,18],
    C3:[86,80,78,61,83,89,74,84,52], C4:[88,86,87,64,90,97,77,87,54],
    C5:[37,36,35,23,37,44,48,36,19], C6:[28,27,27,16,29,37,45,28,13],
    C7:[52,51,49,36,53,60,55,50,31], C8:[77,73,75,55,79,83,79,76,46],
    C9:[60,56,58,43,61,68,65,59,33], C10:[74,70,68,51,75,79,71,73,37],
    C11:[41,39,38,26,42,50,55,39,19], C12:[46,45,45,30,47,56,52,46,23],
    C13:[40,39,38,23,42,50,49,39,17], C14:[77,74,72,47,79,89,70,75,36],
    C15:[80,77,76,47,83,97,72,79,40],
  },
  "202507": {
    C1:[85,80,79,56,86,91,72,83,44], C2:[43,41,40,28,45,52,40,43,20],
    C3:[88,82,80,63,85,91,76,86,55], C4:[91,89,90,67,93,100,80,90,57],
    C5:[39,37,37,25,39,46,50,38,21], C6:[30,29,29,18,31,39,46,30,15],
    C7:[55,54,52,39,56,63,58,53,34], C8:[79,75,77,58,81,85,82,78,49],
    C9:[63,58,60,46,64,71,68,62,36], C10:[78,73,72,55,79,83,75,77,41],
    C11:[43,41,40,29,44,53,58,41,22], C12:[48,47,47,32,49,58,55,48,26],
    C13:[42,41,40,26,44,53,52,41,20], C14:[80,77,75,50,82,92,72,78,39],
    C15:[83,80,79,50,86,100,75,82,43],
  },
  "202508": {
    C1:[88,83,82,59,89,94,75,86,47], C2:[45,43,42,30,47,54,42,45,22],
    C3:[90,84,82,65,87,93,78,88,57], C4:[93,91,92,69,95,100,82,92,59],
    C5:[41,39,39,27,41,48,52,40,23], C6:[32,31,31,20,33,41,48,32,17],
    C7:[57,56,54,41,58,65,60,55,36], C8:[81,77,79,60,83,87,84,80,51],
    C9:[65,60,62,48,66,73,70,64,38], C10:[80,75,74,57,81,85,77,79,43],
    C11:[45,43,42,31,46,55,60,43,24], C12:[50,49,49,34,51,60,57,50,28],
    C13:[44,43,42,28,46,55,54,43,22], C14:[82,79,77,52,84,94,74,80,41],
    C15:[85,82,81,52,88,100,77,84,45],
  },
};

const _METAS: Record<string,number> = {
  C1:55, C2:50, C3:90, C4:55, C5:45, C6:45, C7:45,
  C8:60, C9:55, C10:55, C11:50, C12:50, C13:50, C14:55, C15:55,
};

const _NOMES: Record<string,string> = {
  C1:"Pré-natal ≥6 consultas", C2:"Citopatológico do colo do útero",
  C3:"Vacinação DTP/Penta D3", C4:"Puerpério / RN 1ª semana",
  C5:"1ª Consulta Odontológica Programática", C6:"Tratamento Odontológico Concluído",
  C7:"Urgência Odontológica", C8:"Acompanhamento de hipertensos",
  C9:"Acompanhamento de diabéticos", C10:"Obesidade em crianças <5 anos",
  C11:"Alto risco cardiovascular", C12:"Esquizofrenia / psicose",
  C13:"Transtorno Afetivo Bipolar", C14:"Sífilis em gestante",
  C15:"Sífilis congênita",
};

const _GRUPOS: Record<string,string> = {
  C1:"Gestação e Puerpério", C2:"Prevenção do Câncer", C3:"Desenvolvimento Infantil",
  C4:"Gestação e Puerpério", C5:"Saúde Bucal", C6:"Saúde Bucal",
  C7:"Saúde Bucal", C8:"Hipertensão", C9:"Diabetes",
  C10:"Desenvolvimento Infantil", C11:"Hipertensão", C12:"Saúde Mental",
  C13:"Saúde Mental", C14:"Gestação e Puerpério", C15:"Gestação e Puerpério",
};

const _PESOS: Record<string,number> = {
  C1:1, C2:1, C3:1, C4:1, C5:1, C6:1, C7:1, C8:1, C9:1, C10:1, C11:1, C12:1, C13:1, C14:1, C15:1,
};

function _getVals(comp: string): Record<string, number[]> {
  return _VALS_BY_COMP[comp] ?? _VALS_BY_COMP["202507"];
}

function _notaFromVals(vals: number[], meta: number): number {
  const media = vals.reduce((s,v)=>s+v,0)/vals.length;
  const pct = media / meta;
  if (pct >= 1) return 10;
  if (pct >= 0.75) return 7.5 + (pct - 0.75) / 0.25 * 2.5;
  if (pct >= 0.5) return 5 + (pct - 0.5) / 0.25 * 2.5;
  return Math.max(0, pct / 0.5 * 5);
}

function _conceito(nota: number): Conceito {
  if (nota >= 7.5) return "Ótimo";
  if (nota >= 5) return "Bom";
  if (nota >= 2.6) return "Suficiente";
  return "Regular";
}

function _buildGrupo(codigos: string[], sigla: string, descricao: string, comp: string): GrupoQual {
  const VALS = _getVals(comp);
  const label = comp.slice(4)+"/"+comp.slice(0,4);
  const indicadores: Indicador[] = codigos.map(cod => {
    const vals = VALS[cod] ?? [];
    const meta = _METAS[cod];
    const nota = parseFloat(_notaFromVals(vals, meta).toFixed(1));
    const media = vals.length ? vals.reduce((s,v)=>s+v,0)/vals.length : 0;
    return {
      codigo: cod,
      nome: _NOMES[cod] ?? cod,
      grupo: _GRUPOS[cod] ?? "",
      nota,
      conceito: _conceito(nota),
      numerador: `Média ${media.toFixed(1)}% · ${vals.filter(v=>v>=meta).length}/9 equipes acima da meta`,
      denominador: `Meta: ${meta}% · e-SUS PEC Apuí/AM ${label}`,
      classificacao: { "Ótimo":{min:7.5,max:10}, "Bom":{min:5,max:7.4}, "Suficiente":{min:2.6,max:4.9}, "Regular":{min:0,max:2.5} },
      meta_nacional: `${meta}%`,
      meta_apui: `${meta}%`,
      peso: _PESOS[cod] ?? 1,
      acoes_melhoria: vals.filter(v=>v<meta).length > 0
        ? [`${vals.filter(v=>v<meta).length} equipes abaixo da meta: ${_EQUIPES.filter((_,i)=>vals[i]<meta).join(", ")}`]
        : ["Todas as equipes atingiram a meta"],
    };
  });
  const notaMedia = indicadores.reduce((s,i)=>s+i.nota,0)/indicadores.length;
  const pctBomOtimo = Math.round(indicadores.filter(i=>i.nota>=5).length/indicadores.length*100);
  return {
    sigla, descricao,
    equipes: _EQUIPES.slice(),
    total_indicadores: indicadores.length,
    indicadores,
    nota_media: parseFloat(notaMedia.toFixed(1)),
    conceito_medio: _conceito(notaMedia),
    pct_bom_otimo: pctBomOtimo,
  };
}

// ── helper filtro por equipe ──────────────────────────────────────────────────
function _buildGrupoParaEquipe(codigos: string[], sigla: string, descricao: string, equipeIdx: number, comp: string): GrupoQual {
  const VALS = _getVals(comp);
  const equipe = _EQUIPES[equipeIdx];
  const label = comp.slice(4)+"/"+comp.slice(0,4);
  const indicadores: Indicador[] = codigos.map(cod => {
    const vals = VALS[cod] ?? [];
    const meta = _METAS[cod];
    const val = vals[equipeIdx] ?? 0;
    const pct = val / meta;
    let nota = 0;
    if (pct >= 1) nota = 10;
    else if (pct >= 0.75) nota = 7.5 + (pct - 0.75) / 0.25 * 2.5;
    else if (pct >= 0.5) nota = 5 + (pct - 0.5) / 0.25 * 2.5;
    else nota = Math.max(0, pct / 0.5 * 5);
    nota = parseFloat(nota.toFixed(1));
    return {
      codigo: cod,
      nome: _NOMES[cod] ?? cod,
      grupo: _GRUPOS[cod] ?? "",
      nota,
      conceito: _conceito(nota),
      numerador: `${equipe}: ${val}% · Meta: ${meta}%`,
      denominador: `e-SUS PEC Apuí/AM ${label} · Equipe ${equipe}`,
      classificacao: {},
      meta_nacional: `${meta}%`,
      meta_apui: `${meta}%`,
      peso: _PESOS[cod] ?? 1,
      acoes_melhoria: val < meta
        ? [`Abaixo da meta em ${(meta - val).toFixed(0)}pp — equipe ${equipe}`]
        : [`Meta atingida — ${val}% ≥ ${meta}%`],
    };
  });
  const notaMedia = indicadores.reduce((s,i)=>s+i.nota,0)/indicadores.length;
  const pctBomOtimo = Math.round(indicadores.filter(i=>i.nota>=5).length/indicadores.length*100);
  return {
    sigla, descricao,
    equipes: [equipe],
    total_indicadores: indicadores.length,
    indicadores,
    nota_media: parseFloat(notaMedia.toFixed(1)),
    conceito_medio: _conceito(notaMedia),
    pct_bom_otimo: pctBomOtimo,
  };
}

// ── componente principal ──────────────────────────────────────────────────────
export default function ComponenteQualidade() {
  const [tab, setTab] = useState<"consolidado" | "grupoC" | "grupoB" | "grupoM" | "ribeirinha">("consolidado");
  const [competencia, setCompetencia] = useState("202507");
  const [equipeFilter, setEquipeFilter] = useState<string>("Todas");
  const [conceitoFilter, setConceitoFilter] = useState<string>("Todos");

  const equipeIdx = equipeFilter === "Todas" ? -1 : _EQUIPES.indexOf(equipeFilter);
  const label = competencia.slice(4)+"/"+competencia.slice(0,4);

  const C_CODIGOS = ["C1","C2","C3","C4","C5","C6","C7","C8","C9","C10","C11","C12","C13","C14","C15"] as const;

  const grupoC: GrupoQual = equipeIdx >= 0
    ? _buildGrupoParaEquipe([...C_CODIGOS], "C", `eSF e eAP — ${equipeFilter} · ${label}`, equipeIdx, competencia)
    : _buildGrupo([...C_CODIGOS], "C", `eSF e eAP — 15 indicadores · ${label}`, competencia);

  // Grupo B — variação mensal leve baseada na competência
  const _bOffset: Record<string,number> = { "202503":-1.5, "202504":-0.8, "202505":0, "202506":0.4, "202507":0.8, "202508":1.2 };
  const bOff = _bOffset[competencia] ?? 0;
  const grupoB: GrupoQual = {
    sigla:"B", descricao:`eSB Modalidade I e II — 6 indicadores · ${label}`,
    equipes:["eSB Apuí I","eSB Apuí II"],
    total_indicadores:6,
    indicadores:[
      { codigo:"B1", nome:"1ª Consulta Odontológica Programática", grupo:"Saúde Bucal", nota:parseFloat(Math.max(0,Math.min(10,5.2+bOff)).toFixed(1)), conceito:_conceito(5.2+bOff), numerador:`${(47+bOff*2).toFixed(0)}% dos pacientes cadastrados`, denominador:`Meta: 45% · eSB Apuí/AM ${label}`, classificacao:{}, meta_nacional:"45%", meta_apui:"45%", peso:1 },
      { codigo:"B2", nome:"Tratamento Odontológico Concluído",     grupo:"Saúde Bucal", nota:parseFloat(Math.max(0,Math.min(10,6.1+bOff)).toFixed(1)), conceito:_conceito(6.1+bOff), numerador:`${(52+bOff*2).toFixed(0)}% dos tratamentos iniciados`, denominador:`Meta: 45% · eSB Apuí/AM ${label}`,      classificacao:{}, meta_nacional:"45%", meta_apui:"45%", peso:1 },
      { codigo:"B3", nome:"Urgência odontológica resolvida",       grupo:"Saúde Bucal", nota:parseFloat(Math.max(0,Math.min(10,7.8+bOff*0.5)).toFixed(1)), conceito:_conceito(7.8+bOff*0.5), numerador:`${(68+bOff).toFixed(0)}% das urgências concluídas`, denominador:`Meta: 45% · eSB Apuí/AM ${label}`, classificacao:{}, meta_nacional:"45%", meta_apui:"45%", peso:1 },
      { codigo:"B4", nome:"Escovação dental supervisionada",       grupo:"Saúde Bucal", nota:parseFloat(Math.max(0,Math.min(10,4.3+bOff)).toFixed(1)), conceito:_conceito(4.3+bOff), numerador:`${(38+bOff*2).toFixed(0)}% das crianças 5–14 anos`, denominador:`Meta: 50% · eSB Apuí/AM ${label}`,           classificacao:{}, meta_nacional:"50%", meta_apui:"50%", peso:1 },
      { codigo:"B5", nome:"Aplicação tópica de flúor",             grupo:"Saúde Bucal", nota:parseFloat(Math.max(0,Math.min(10,3.8+bOff)).toFixed(1)), conceito:_conceito(3.8+bOff), numerador:`${(32+bOff*2).toFixed(0)}% com fluoretação registrada`, denominador:`Meta: 50% · eSB Apuí/AM ${label}`,         classificacao:{}, meta_nacional:"50%", meta_apui:"50%", peso:1 },
      { codigo:"B6", nome:"Cobertura de saúde bucal na APS",       grupo:"Saúde Bucal", nota:parseFloat(Math.max(0,Math.min(10,6.5+bOff*0.5)).toFixed(1)), conceito:_conceito(6.5+bOff*0.5), numerador:`${(58+bOff).toFixed(0)}% com acesso à eSB`, denominador:`Meta: 50% · eSB Apuí/AM ${label}`,             classificacao:{}, meta_nacional:"50%", meta_apui:"50%", peso:1 },
    ],
    nota_media:parseFloat((5.6+bOff*0.8).toFixed(1)), conceito_medio:_conceito(5.6+bOff*0.8), pct_bom_otimo: (5.6+bOff*0.8)>=5?67:50,
  };

  const _mOffset: Record<string,number> = { "202503":-1.2, "202504":-0.6, "202505":0, "202506":0.3, "202507":0.6, "202508":0.9 };
  const mOff = _mOffset[competencia] ?? 0;
  const grupoM: GrupoQual = {
    sigla:"M", descricao:`eMulti — 2 indicadores · ${label}`,
    equipes:["eMulti Apuí"],
    total_indicadores:2,
    indicadores:[
      { codigo:"M1", nome:"Média de atendimentos por profissional de saúde da eMulti", grupo:"eMulti", nota:parseFloat(Math.max(0,Math.min(10,6.8+mOff)).toFixed(1)), conceito:_conceito(6.8+mOff), numerador:`Média ${(68+mOff*3).toFixed(0)} atendimentos/mês`, denominador:`Meta: 60/mês · ${label}`, classificacao:{}, meta_nacional:"60/mês", meta_apui:"60/mês", peso:1 },
      { codigo:"M2", nome:"Ações interprofissionais registradas no e-SUS PEC",         grupo:"eMulti", nota:parseFloat(Math.max(0,Math.min(10,5.2+mOff)).toFixed(1)), conceito:_conceito(5.2+mOff), numerador:`${(52+mOff*3).toFixed(0)}% das ações com registro`,   denominador:`Meta: 50% · ${label}`,      classificacao:{}, meta_nacional:"50%",    meta_apui:"50%",    peso:1 },
    ],
    nota_media:parseFloat((6.0+mOff*0.9).toFixed(1)), conceito_medio:_conceito(6.0+mOff*0.9), pct_bom_otimo:100,
  };

  const filterConceito = (inds: Indicador[]) =>
    conceitoFilter === "Todos" ? inds : inds.filter(i => i.conceito === conceitoFilter);

  const totalBomOtimo = Math.round(
    (grupoC.pct_bom_otimo + grupoB.pct_bom_otimo + grupoM.pct_bom_otimo) / 3
  );

  const TABS = [
    { key:"consolidado" as const, label:"Consolidado",   icon:<Target    size={14}/> },
    { key:"grupoC"      as const, label:"Grupo C — eSF/eAP", icon:<Users size={14}/> },
    { key:"grupoB"      as const, label:"Grupo B — eSB", icon:<Stethoscope size={14}/> },
    { key:"grupoM"      as const, label:"Grupo M — eMulti", icon:<Activity size={14}/> },
    { key:"ribeirinha"  as const, label:"eRibeirinha",   icon:<Ship      size={14}/> },
  ];

  return (
    <div style={{ padding:24, fontFamily:"system-ui,sans-serif", maxWidth:1280, margin:"0 auto" }}>
      <style>{`
        *{box-sizing:border-box;}
        :root{--card:#fff;--border:#e5e7eb;--fg:#111827;--muted:#6b7280;}
        @media(prefers-color-scheme:dark){:root{--card:#1e2127;--border:#374151;--fg:#f9fafb;--muted:#9ca3af;}}
        :root[data-theme="dark"]{--card:#1e2127;--border:#374151;--fg:#f9fafb;--muted:#9ca3af;}
        :root[data-theme="light"]{--card:#fff;--border:#e5e7eb;--fg:#111827;--muted:#6b7280;}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:900, color:"#1e40af", display:"flex", alignItems:"center", gap:8 }}>
            <Activity size={20}/> Componente Qualidade — Novo Financiamento APS
          </h2>
          <p style={{ margin:"4px 0 0", color:"#6b7280", fontSize:13 }}>
            15 indicadores C/B/M · Apuí/AM · Portaria GM/MS 3.493/2024 + 7.799/2025 · NT DEAPS/SAPS/MS 6/2025
          </p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontSize:12, color:"#6b7280", fontWeight:600 }}>Competência:</span>
            {["202503","202504","202505","202506","202507","202508"].map(c => (
              <button key={c} onClick={() => setCompetencia(c)} style={{
                padding:"5px 11px", borderRadius:6, border:"1px solid",
                fontSize:12, fontWeight: competencia===c ? 800 : 500, cursor:"pointer",
                borderColor: competencia===c ? "#1e40af" : "#cbd5e1",
                background: competencia===c ? "#1e40af" : "#fff",
                color: competencia===c ? "#fff" : "#475569",
                transition:"all .15s",
              }}>
                {c.slice(4)}/{c.slice(0,4)}
              </button>
            ))}
          </div>
          <div style={{ fontSize:11, color:"#1e40af", fontWeight:700, background:"#eff6ff", padding:"2px 10px", borderRadius:8, border:"1px solid #bfdbfe" }}>
            Exibindo dados de: {competencia.slice(4)}/{competencia.slice(0,4)} · e-SUS PEC Apuí/AM
          </div>
        </div>
      </div>

      {/* ── Painel de Filtros ── */}
      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"12px 16px", marginBottom:14, display:"flex", flexWrap:"wrap", gap:16, alignItems:"center" }}>
        {/* Filtro Equipe */}
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          <span style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:.5 }}>Equipe</span>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {["Todas", ..._EQUIPES].map(eq => (
              <button key={eq} onClick={() => setEquipeFilter(eq)} style={{
                padding:"4px 10px", borderRadius:16, border:"1px solid",
                fontSize:11, fontWeight: equipeFilter===eq ? 700 : 500, cursor:"pointer",
                borderColor: equipeFilter===eq ? "#1e40af" : "#cbd5e1",
                background: equipeFilter===eq ? "#1e40af" : "#fff",
                color: equipeFilter===eq ? "#fff" : "#475569",
              }}>{eq === "Todas" ? "Todas as equipes" : eq}</button>
            ))}
          </div>
        </div>

        {/* Filtro Conceito */}
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          <span style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:.5 }}>Conceito</span>
          <div style={{ display:"flex", gap:5 }}>
            {(["Todos","Ótimo","Bom","Suficiente","Regular"] as const).map(c => {
              const style = c === "Todos" ? { cor:"#64748b", bg:"#f1f5f9" }
                : c === "Ótimo"      ? { cor:"#15803d", bg:"#dcfce7" }
                : c === "Bom"        ? { cor:"#1d4ed8", bg:"#dbeafe" }
                : c === "Suficiente" ? { cor:"#b45309", bg:"#fef3c7" }
                :                      { cor:"#b91c1c", bg:"#fee2e2" };
              return (
                <button key={c} onClick={() => setConceitoFilter(c)} style={{
                  padding:"4px 10px", borderRadius:16, border:`1px solid ${conceitoFilter===c ? style.cor : "#cbd5e1"}`,
                  fontSize:11, fontWeight: conceitoFilter===c ? 700 : 500, cursor:"pointer",
                  background: conceitoFilter===c ? style.cor : "#fff",
                  color: conceitoFilter===c ? "#fff" : style.cor,
                }}>{c}</button>
              );
            })}
          </div>
        </div>

        {/* Resumo do filtro */}
        {(equipeFilter !== "Todas" || conceitoFilter !== "Todos") && (
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
            {equipeFilter !== "Todas" && (
              <span style={{ fontSize:11, background:"#eff6ff", color:"#1e40af", padding:"3px 9px", borderRadius:10, fontWeight:700 }}>
                Equipe: {equipeFilter}
              </span>
            )}
            {conceitoFilter !== "Todos" && (
              <span style={{ fontSize:11, background:"#f5f3ff", color:"#7c3aed", padding:"3px 9px", borderRadius:10, fontWeight:700 }}>
                Conceito: {conceitoFilter}
              </span>
            )}
            <button onClick={() => { setEquipeFilter("Todas"); setConceitoFilter("Todos"); }} style={{
              fontSize:11, color:"#64748b", background:"none", border:"1px solid #cbd5e1",
              borderRadius:6, padding:"3px 8px", cursor:"pointer",
            }}>Limpar filtros</button>
          </div>
        )}
      </div>

      {/* Banner extinção */}
      <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
        <AlertTriangle size={16} color="#b91c1c" />
        <span style={{ fontSize:13, color:"#7f1d1d" }}>
          <b>PREVINE BRASIL EXTINTO</b> pela Portaria GM/MS nº 3.493/2024 (art. 13). Os 8 indicadores PB01–PB08 foram
          substituídos pelos <b>15 indicadores do Componente Qualidade</b>. Efeitos financeiros a partir de maio/2025 (parcela 05/2025).
        </span>
      </div>

      {/* KPIs consolidado */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:10, marginBottom:20 }}>
        {[
          { label:"15 Indicadores",   val:"C/B/M",                                    cor:"#1e40af", sub:"Componente Qualidade"                          },
          { label:"Bom/Ótimo",        val:`${totalBomOtimo}%`,                         cor:"#15803d", sub:"indicadores consolidados"                      },
          { label:"Grupo C (eSF)",    val:`${grupoC.nota_media.toFixed(1)}/10`,        cor:GRUPO_COR.C, sub:`${grupoC.conceito_medio} · 15 ind.`          },
          { label:"Grupo B (eSB)",    val:`${grupoB.nota_media.toFixed(1)}/10`,        cor:GRUPO_COR.B, sub:`${grupoB.conceito_medio} · 6 ind.`           },
          { label:"Grupo M (eMulti)", val:`${grupoM.nota_media.toFixed(1)}/10`,        cor:GRUPO_COR.M, sub:`${grupoM.conceito_medio} · 2 ind.`           },
        ].map(k => (
          <div key={k.label} style={{ background:"#fff", borderRadius:8, padding:"12px 16px", border:`2px solid ${k.cor}20`, textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:900, color:k.cor, lineHeight:1 }}>{k.val}</div>
            <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginTop:2 }}>{k.label}</div>
            <div style={{ fontSize:10, color:"#9ca3af" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Faixa classificação */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:18 }}>
        {Object.entries(CONCEITO).map(([k, v]) => (
          <span key={k} style={{ fontSize:11, fontWeight:700, background:v.bg, color:v.cor, padding:"3px 10px", borderRadius:20 }}>
            {v.label}
          </span>
        ))}
      </div>

      {/* Abas */}
      <div style={{ display:"flex", gap:2, flexWrap:"wrap", borderBottom:"2px solid #e5e7eb", marginBottom:20 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display:"flex", alignItems:"center", gap:5, padding:"9px 15px",
            border:"none", cursor:"pointer", borderRadius:"8px 8px 0 0", fontSize:13,
            fontWeight: tab === t.key ? 700 : 400,
            background: tab === t.key ? (t.key === "ribeirinha" ? GRUPO_COR.R : "#1e40af") : "transparent",
            color: tab === t.key ? "#fff" : "#6b7280",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Consolidado ── */}
      {tab === "consolidado" && (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {[
            { key:"C", grupo:grupoC },
            { key:"B", grupo:grupoB },
            { key:"M", grupo:grupoM },
          ].map(({ key, grupo }) => (
            <div key={key} style={{ border:`1px solid ${GRUPO_COR[key]}30`, borderRadius:10, overflow:"hidden" }}>
              <GrupoHeader grupo={key} data={grupo} />
              <div style={{ padding:16, background:"#f9fafb" }}>
                <div style={{ fontSize:12, color:"#6b7280", marginBottom:12 }}>
                  Equipes: {grupo.equipes.join(", ")} · {grupo.total_indicadores} indicadores
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
                  {filterConceito(grupo.indicadores).map(ind => (
                    <CardIndicador key={ind.codigo} ind={ind} grupo={key} />
                  ))}
                  {filterConceito(grupo.indicadores).length === 0 && (
                    <div style={{ gridColumn:"1/-1", padding:"20px", textAlign:"center", color:"#9ca3af", fontSize:13 }}>
                      Nenhum indicador com conceito "{conceitoFilter}" neste grupo.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Grupo C — eSF/eAP ── */}
      {tab === "grupoC" && (
        <div>
          <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8, padding:"10px 16px", marginBottom:16, fontSize:13, color:"#1e40af" }}>
            <b>Grupo C — eSF e eAP</b> · 15 indicadores (C1–C15) · Portaria GM/MS 3.493/2024 + 7.799/2025 · Efeitos financeiros desde 05/2025
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
            {filterConceito(grupoC.indicadores).map(ind => <CardIndicador key={ind.codigo} ind={ind} grupo="C" />)}
            {filterConceito(grupoC.indicadores).length === 0 && (
              <div style={{ gridColumn:"1/-1", padding:"20px", textAlign:"center", color:"#9ca3af", fontSize:13 }}>
                Nenhum indicador com conceito "{conceitoFilter}".
              </div>
            )}
          </div>
          <div style={{ marginTop:16, background:"#fff", borderRadius:8, padding:"12px 16px", border:"1px solid #e5e7eb", fontSize:12, color:"#6b7280" }}>
            <b>Fonte:</b> e-SUS PEC Apuí/AM · Jul/2026 · <b>9 equipes eSF:</b> {_EQUIPES.join(", ")}
          </div>
        </div>
      )}

      {/* ── Grupo B — eSB ── */}
      {tab === "grupoB" && (
        <div>
          <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"10px 16px", marginBottom:16, fontSize:13, color:"#15803d" }}>
            <b>Grupo B — eSB Modalidade I e II</b> · 6 indicadores (B1–B6) · Portaria GM/MS 3.493/2024 + 7.799/2025
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
            {filterConceito(grupoB.indicadores).map(ind => <CardIndicador key={ind.codigo} ind={ind} grupo="B" />)}
            {filterConceito(grupoB.indicadores).length === 0 && (
              <div style={{ gridColumn:"1/-1", padding:"20px", textAlign:"center", color:"#9ca3af", fontSize:13 }}>
                Nenhum indicador com conceito "{conceitoFilter}".
              </div>
            )}
          </div>
          <div style={{ marginTop:16, background:"#fff", borderRadius:8, padding:"12px 16px", border:"1px solid #e5e7eb", fontSize:12, color:"#6b7280" }}>
            <b>Fonte:</b> e-SUS PEC Apuí/AM · Jul/2026 · <b>Sistema:</b> SISAB (SIA/SUS para procedimentos odontológicos)
          </div>
        </div>
      )}

      {/* ── Grupo M — eMulti ── */}
      {tab === "grupoM" && (
        <div>
          <div style={{ background:"#faf5ff", border:"1px solid #ddd6fe", borderRadius:8, padding:"10px 16px", marginBottom:16, fontSize:13, color:"#7c3aed" }}>
            <b>Grupo M — eMulti</b> · 2 indicadores (M1–M2) · Estratégica / Complementar / Ampliada · Portaria GM/MS 3.493/2024
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
            {grupoM.indicadores.map(ind => <CardIndicador key={ind.codigo} ind={ind} grupo="M" />)}
          </div>
          <div style={{ marginTop:16, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
            {[
              { mod:"Estratégica",   val:"R$12.000", bonus:"+ R$3.000 bônus",  cor:"#7c3aed" },
              { mod:"Complementar",  val:"R$24.000", bonus:"+ R$6.000 bônus",  cor:"#6d28d9" },
              { mod:"Ampliada",      val:"R$36.000", bonus:"+ R$9.000 bônus",  cor:"#5b21b6" },
            ].map(m => (
              <div key={m.mod} style={{ background:m.cor, color:"#fff", borderRadius:8, padding:"14px 16px", textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:700, opacity:.8 }}>eMulti {m.mod}</div>
                <div style={{ fontSize:22, fontWeight:900, marginTop:4 }}>{m.val}</div>
                <div style={{ fontSize:12, opacity:.85 }}>{m.bonus}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── eRibeirinha ── */}
      {tab === "ribeirinha" && (
        <div>
          <div style={{ background:"#fdf2f8", border:"1px solid #f9a8d4", borderRadius:8, padding:"10px 16px", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <Ship size={16} color="#be185d" />
              <span style={{ fontWeight:700, color:"#be185d", fontSize:14 }}>Equipe de Saúde Ribeirinha (eRibeirinha) — Apuí/AM</span>
            </div>
            <div style={{ fontSize:12, color:"#6b7280" }}>
              Portaria GM/MS 3.493/2024 · Ficha Técnica eRibeirinha · Rios: Juma, Aripuanã, Igarapé Guariba, Igarapé do Castanho
              · Modalidade de trabalho: visitas fluviais periódicas · ART (sem energia elétrica) · CDS offline
            </div>
          </div>

          {/* Alertas críticos */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:12, marginBottom:20 }}>
            {[
              { label:"Pré-natal ≥6 consultas", atual:"21,8%", meta:"60%", cod:"R1", Icon:Baby   },
              { label:"HbA1c em diabéticos",     atual:"3,5%",  meta:"60%", cod:"R2", Icon:FlaskConical },
            ].map(a => (
              <div key={a.cod} style={{ background:"#fef2f2", border:"2px solid #fca5a5", borderRadius:10, padding:"14px 16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <a.Icon size={18} color="#b91c1c" />
                  <span style={{ fontWeight:700, fontSize:13, color:"#b91c1c" }}>ALERTA CRÍTICO — {a.cod}</span>
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:"#111827", marginBottom:6 }}>{a.label}</div>
                <div style={{ display:"flex", gap:16 }}>
                  <div>
                    <div style={{ fontSize:24, fontWeight:900, color:"#b91c1c" }}>{a.atual}</div>
                    <div style={{ fontSize:11, color:"#6b7280" }}>Atual Apuí</div>
                  </div>
                  <div>
                    <div style={{ fontSize:24, fontWeight:900, color:"#15803d" }}>{a.meta}</div>
                    <div style={{ fontSize:11, color:"#6b7280" }}>Meta</div>
                  </div>
                </div>
                <div style={{ marginTop:8, height:6, background:"#f3f4f6", borderRadius:3 }}>
                  <div style={{ height:"100%", width:`${parseFloat(a.atual) / parseFloat(a.meta) * 100}%`, background:"#b91c1c", borderRadius:3 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Cards indicadores ribeirinhos */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
            {INDICADORES_RIBEIRINHA.map(ind => {
              const c = CONCEITO[ind.conceito];
              return (
                <div key={ind.codigo} style={{ background:"#fff", borderRadius:10, border:`1px solid ${GRUPO_COR.R}20`, borderLeft:`4px solid ${GRUPO_COR.R}`, padding:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:4 }}>
                        <span style={{ fontSize:11, fontWeight:800, color:"#fff", background:GRUPO_COR.R, borderRadius:4, padding:"1px 7px" }}>{ind.codigo}</span>
                        {ind.alerta && <span style={{ fontSize:10, background:"#fef2f2", color:"#b91c1c", fontWeight:700, padding:"1px 6px", borderRadius:3 }}>CRÍTICO</span>}
                      </div>
                      <div style={{ fontWeight:700, fontSize:13, color:"#111827", lineHeight:1.3 }}>{ind.nome}</div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
                      <div style={{ fontSize:26, fontWeight:900, color:c.cor, lineHeight:1 }}>{ind.nota?.toFixed(1)}</div>
                      <div style={{ fontSize:10, color:"#6b7280" }}>nota /10</div>
                    </div>
                  </div>
                  <NotoBar nota={ind.nota} />
                  <div style={{ marginTop:8, marginBottom:10 }}>
                    <span style={{ fontSize:11, fontWeight:700, background:c.bg, color:c.cor, padding:"2px 9px", borderRadius:20 }}>{ind.conceito}</span>
                  </div>
                  <div style={{ fontSize:12, color:"#374151", background:"#f9fafb", borderRadius:6, padding:"8px 10px" }}>
                    <div style={{ marginBottom:4 }}><b>Meta:</b> {ind.meta_apui}</div>
                    <div style={{ marginBottom:6 }}><b>Numerador:</b> {ind.numerador}</div>
                    {ind.acoes.length > 0 && (
                      <div>
                        <b>Ações no contexto ribeirinho:</b>
                        <ul style={{ margin:"4px 0 0 14px", padding:0 }}>
                          {ind.acoes.map((a, i) => <li key={i} style={{ marginBottom:2, fontSize:11 }}>{a}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Características especiais */}
          <div style={{ marginTop:20, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
            {[
              { Icon:Ship,       title:"Visitas fluviais",     desc:"Lanchas de saúde percorrem rios Juma e Aripuanã quinzenal/mensalmente" },
              { Icon:Eye,        title:"CDS offline",          desc:"Coleta Dados Simplificada sem internet — sincroniza na sede do município" },
              { Icon:Pill,       title:"Dispensação estendida", desc:"60–90 dias de medicamentos por visita para hipertensos e diabéticos" },
              { Icon:Heart,      title:"ART sem energia",      desc:"Tratamento Restaurador Atraumático — kits portáteis sem eletricidade" },
              { Icon:Users,      title:"Territórios",          desc:"42% pop. zona rural/ribeirinha · 4 rios cobertos · ~10.400 habitantes" },
              { Icon:AlertTriangle, title:"Prioridade MS",     desc:"Apuí classificado com ALTA prioridade no cofinanciamento ribeirinho" },
            ].map(f => (
              <div key={f.title} style={{ background:"#fdf2f8", border:"1px solid #f9a8d4", borderRadius:8, padding:"12px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <f.Icon size={16} color={GRUPO_COR.R} />
                  <span style={{ fontWeight:700, fontSize:13, color:"#be185d" }}>{f.title}</span>
                </div>
                <div style={{ fontSize:12, color:"#6b7280" }}>{f.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:16, background:"#fff", borderRadius:8, padding:"10px 14px", border:"1px solid #e5e7eb", fontSize:12, color:"#6b7280" }}>
            <b>Referência normativa:</b> Portaria GM/MS nº 3.493/2024 (art. 15–18) · Ficha Técnica eRibeirinha DESF/SAPS/MS ·
            Portaria GM/MS nº 2.488/2011 (PNAB) · NT DEAPS/SAPS/MS nº 6/2025 ·
            <b> Sistema de monitoramento:</b> SIAPS / e-Gestor APS
          </div>
        </div>
      )}
    </div>
  );
}
