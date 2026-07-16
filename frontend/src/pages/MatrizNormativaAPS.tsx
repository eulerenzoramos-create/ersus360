// src/pages/MatrizNormativaAPS.tsx — Matriz Normativa APS · Portaria 3.493/2024
import { useState } from "react";

const COR = {
  navy:     "#0d2137",
  blue:     "#1a6baa",
  blueLt:   "#e8f1fa",
  green:    "#14864e",
  greenLt:  "#e4f5ec",
  amber:    "#b07a00",
  amberLt:  "#fdf3d0",
  red:      "#b83232",
  redLt:    "#fdeaea",
  border:   "#cdd8e8",
  bg:       "#f0f5fb",
  muted:    "#5a6e85",
  purple:   "#8b4cbf",
  orange:   "#c07020",
};

type Ind = {
  id: string; nome: string; bloco: string;
  meta: string; sistPrincipal: string; sistComp: string;
  ficha: string; portaria: string; obrigacao: string;
};

const INDICADORES: Ind[] = [
  { id:"I01", nome:"Pré-natal ≥ 6 consultas (1ª até 12ª sem.)", bloco:"Mulher/Criança",
    meta:"60%", sistPrincipal:"e-SUS PEC/CDS", sistComp:"RNDS (RES gestante)",
    ficha:"Atend. Individual (CID Z34) + Cadastro Individual (DUM)",
    portaria:"Port. 3.493/2024 Art.8º,I", obrigacao:"Registrar DUM no Cadastro Individual; todas as consultas pré-natal no PEC/CDS" },
  { id:"I02", nome:"Gestante: exames sífilis + HIV", bloco:"Mulher/Criança",
    meta:"60%", sistPrincipal:"e-SUS (Procedimentos)", sistComp:"RNDS (resultado lab)",
    ficha:"Ficha de Procedimentos + integração RNDS (Port. 1.792/2021)",
    portaria:"Port. 3.493/2024 Art.8º,II · Port. 1.792/2021", obrigacao:"Configurar e-SUS v5.2+ com integração RNDS; garantir envio de resultados laboratoriais" },
  { id:"I03", nome:"Gestante: atendimento odontológico", bloco:"Mulher/Criança",
    meta:"50%", sistPrincipal:"e-SUS Odonto (PEC/CDS)", sistComp:"—",
    ficha:"Ficha de Atendimento Odontológico Individual (tipo: Pré-natal)",
    portaria:"Port. 3.493/2024 Art.8º,III · PNAB 2.436/2017", obrigacao:"Garantir equipe eSB ativa; registrar atendimentos no módulo odonto do PEC ou CDS" },
  { id:"I04", nome:"Citopatológico do colo do útero", bloco:"Mulher/Criança",
    meta:"20%/ano", sistPrincipal:"e-SUS PEC/CDS", sistComp:"SISCAN/INCA",
    ficha:"Ficha de Procedimentos (cód. 0203010035)",
    portaria:"Port. 3.493/2024 Art.8º,IV · Res. CIT 8/2020", obrigacao:"Registrar procedimento no e-SUS; manter cadastros femininos 25–64 anos atualizados; enviar laudos ao SISCAN" },
  { id:"I05", nome:"Cobertura vacinal Poliomielite + Pentavalente (<1 ano)", bloco:"Mulher/Criança",
    meta:"95%", sistPrincipal:"SIPNI / RNDS", sistComp:"e-SUS (Ficha Vacinação)",
    ficha:"Registro no SIPNI (automático → RNDS) + Ficha de Vacinação e-SUS",
    portaria:"Port. 3.493/2024 Art.8º,V · PNI/SVS", obrigacao:"Registrar doses no SIPNI; manter Ficha de Vacinação e-SUS sincronizada; cadastros de crianças <1a atualizados" },
  { id:"I06", nome:"Hipertensos com PA aferida em cada semestre", bloco:"DCNT",
    meta:"50%", sistPrincipal:"e-SUS PEC/CDS", sistComp:"SIAPS/HÓRUS (dispensação)",
    ficha:"Ficha de Atend. Individual (CIAP K86/K87) — campo PA obrigatório",
    portaria:"Port. 3.493/2024 Art.8º,VI · Res. CIT 8/2020", obrigacao:"Identificar e cadastrar pessoas com HAS; exigir PA em TODOS os atendimentos; acompanhamento semestral de cada hipertenso" },
  { id:"I07", nome:"Diabéticos com HbA1c solicitada", bloco:"DCNT",
    meta:"50%", sistPrincipal:"e-SUS PEC/CDS", sistComp:"RNDS (resultado HbA1c) · SIAPS",
    ficha:"Ficha de Procedimentos (cód. 0202010872) + retorno RNDS",
    portaria:"Port. 3.493/2024 Art.8º,VII · Port. 1.792/2021 · Res. CIT 8/2020", obrigacao:"Registrar solicitação de HbA1c no PEC; garantir resultado via RNDS; monitorar DM cadastrados (CIAP T90)" },
  { id:"I08", nome:"Pessoas com obesidade com IMC registrado", bloco:"DCNT",
    meta:"40%", sistPrincipal:"e-SUS PEC", sistComp:"—",
    ficha:"Ficha de Atend. Individual — campos Peso/Altura (IMC calculado automaticamente no PEC)",
    portaria:"Port. 3.493/2024 Art.8º,VIII · Manual Instrutivo SAPS 2024", obrigacao:"Registrar peso/altura em cada atendimento de pessoa com obesidade; capacitar equipes para identificação ativa" },
  { id:"I09", nome:"Tratamento odontológico concluído", bloco:"Saúde Bucal",
    meta:"30%", sistPrincipal:"e-SUS Odonto (PEC/CDS)", sistComp:"—",
    ficha:"Ficha Atend. Odontológico Individual (tipo de consulta: Conclusão de Tratamento)",
    portaria:"Port. 3.493/2024 Art.8º,IX · Manual Instrutivo SAPS 2024", obrigacao:"Registrar tipo 'Conclusão de tratamento' no PEC Odonto; garantir continuidade dos pacientes iniciados" },
  { id:"I10", nome:"Crianças 0–5 anos com atendimento odontológico", bloco:"Saúde Bucal",
    meta:"30%", sistPrincipal:"e-SUS Odonto (PEC/CDS)", sistComp:"—",
    ficha:"Ficha de Atend. Odontológico Individual — faixa etária vinculada ao Cadastro Individual",
    portaria:"Port. 3.493/2024 Art.8º,X · PNAB 2.436/2017", obrigacao:"Garantir acesso de crianças <6a à eSB; manter cadastros infantis atualizados; registrar atendimentos com faixa etária correta" },
  { id:"I11", nome:"Ações coletivas de saúde bucal", bloco:"Saúde Bucal",
    meta:"Meta absoluta (SAPS)", sistPrincipal:"e-SUS (Atividade Coletiva)", sistComp:"—",
    ficha:"Ficha de Atividade Coletiva (código 0101010010 — escovação supervisionada)",
    portaria:"Port. 3.493/2024 Art.8º,XI · Manual Instrutivo SAPS 2024", obrigacao:"Planejar ações coletivas mensais de escovação; registrar na Ficha de Atividade Coletiva com código correto" },
  { id:"I12", nome:"Testes rápidos IST (HIV, Sífilis, HepB, HepC)", bloco:"IST/TB/HNS",
    meta:"Meta proporcional", sistPrincipal:"e-SUS (Procedimentos)", sistComp:"RNDS (resultado)",
    ficha:"Ficha de Procedimentos: HIV 0202040011 · Sífilis 0202040097 · HepB 0202040063 · HepC 0202040071",
    portaria:"Port. 3.493/2024 Art.8º,XII · Port. 1.792/2021", obrigacao:"Garantir insumos de TR na UBS; registrar realização via Ficha de Procedimentos; enviar resultados à RNDS (Port. 1.792/2021)" },
  { id:"I13", nome:"Acompanhamento de TB em tratamento", bloco:"IST/TB/HNS",
    meta:"75%", sistPrincipal:"e-SUS PEC (CIAP A70)", sistComp:"SINAN (denominador TB)",
    ficha:"Ficha de Atend. Individual (CID A15–A19) — CNS vinculado ao SINAN",
    portaria:"Port. 3.493/2024 Art.8º,XIII · NT SVS (TB)", obrigacao:"Garantir notificação compulsória no SINAN; registrar cada atendimento de TB no e-SUS; vincular CNS corretamente em ambos os sistemas" },
  { id:"I14", nome:"Acompanhamento de Hanseníase em tratamento", bloco:"IST/TB/HNS",
    meta:"75%", sistPrincipal:"e-SUS PEC (CIAP A78)", sistComp:"SINAN (denominador HNS)",
    ficha:"Ficha de Atend. Individual (CID A30) — integração SINAN ↔ SISAB por CNS",
    portaria:"Port. 3.493/2024 Art.8º,XIV · NT SVS (Hanseníase)", obrigacao:"Idem I13 para hanseníase; todos os casos em tratamento devem ser acompanhados pela eSF e registrados no e-SUS" },
  { id:"I15", nome:"Gestantes com TR sífilis + HIV", bloco:"IST/TB/HNS",
    meta:"60%", sistPrincipal:"e-SUS (Procedimentos)", sistComp:"RNDS (resultado)",
    ficha:"Ficha de Procedimentos (TR Sífilis 0202040097 + TR HIV 0202040011) vinculada ao CID Z34",
    portaria:"Port. 3.493/2024 Art.8º,XV · Port. 1.792/2021", obrigacao:"Registrar TR na Ficha de Procedimentos com CID Z34; garantir envio do resultado à RNDS; testar todas as gestantes no 1º trimestre" },
];

const BLOCOS = ["Todos","Mulher/Criança","DCNT","Saúde Bucal","IST/TB/HNS"];

const NORMAS = [
  { num:"01", tipo:"Portaria Federal", titulo:"Portaria GM/MS 3.493/2024", data:"Dez/2024",
    objeto:"Institui o Novo Financiamento da APS — 3 componentes, 15 indicadores, ponderadores. Substitui a Portaria 2.979/2019.", inds:"I01–I15", status:"VIGENTE", cor:COR.green },
  { num:"02", tipo:"Portaria Federal", titulo:"Portaria GM/MS 2.979/2019 (Previne Brasil)", data:"Nov/2019",
    objeto:"Modelo anterior com 7 indicadores. Parcialmente revogada pela 3.493/2024. Mantém vigência nos dispositivos não alterados.", inds:"I01 I02 I04 I05 I06 I07 (originais)", status:"REV. PARCIAL", cor:COR.amber },
  { num:"03", tipo:"Resolução CIT", titulo:"Resolução CIT nº 8/2020", data:"Mar/2020",
    objeto:"Aprovação tripartite dos indicadores Previne Brasil pela CIT. Base metodológica para cálculo dos indicadores I01–I07.", inds:"I01–I07", status:"VIGENTE", cor:COR.green },
  { num:"04", tipo:"Portaria Federal", titulo:"Portaria GM/MS 1.792/2021", data:"Jul/2021",
    objeto:"Torna obrigatório o envio de resultados laboratoriais à RNDS. Fundamenta a integração e-SUS ↔ RNDS para I02, I07, I12 e I15.", inds:"I02 I07 I12 I15", status:"VIGENTE", cor:COR.green },
  { num:"05", tipo:"Portaria Federal", titulo:"Portaria GM/MS 2.436/2017 (PNAB)", data:"Set/2017",
    objeto:"Política Nacional de Atenção Básica — define equipes (eSF/eAP/eSB), atribuições e coberturas mínimas. Base estrutural de todos os indicadores.", inds:"Todos", status:"VIGENTE", cor:COR.green },
  { num:"06", tipo:"Resolução CIT", titulo:"Resolução CIT nº 2/2021 (AF/APS)", data:"Mar/2021",
    objeto:"Integração da Assistência Farmacêutica à APS. SIAPS/HÓRUS como suporte ao monitoramento de HAS e DM (I06 e I07).", inds:"I06 I07", status:"VIGENTE", cor:COR.green },
  { num:"07", tipo:"Nota Técnica", titulo:"Nota Técnica DESF/SAPS nº 14/2023", data:"2023",
    objeto:"Esclarecimentos sobre cálculo dos indicadores e inconsistências no SISAB. Referência operacional para gestores municipais.", inds:"I01–I15", status:"VIGENTE", cor:COR.green },
  { num:"08", tipo:"Manual", titulo:"Manual Instrutivo dos Indicadores — SAPS/MS 2024", data:"2024",
    objeto:"Definição precisa de numerador, denominador, período de apuração, fonte de dados e critérios de exclusão para cada um dos 15 indicadores.", inds:"I01–I15", status:"VIGENTE", cor:COR.green },
  { num:"09", tipo:"CONASEMS", titulo:"Nota Técnica CONASEMS nº 04/2024", data:"2024",
    objeto:"Orientações aos municípios sobre a transição Previne Brasil → Novo Financiamento APS: cronograma, obrigações e impactos orçamentários.", inds:"I01–I15", status:"VIGENTE", cor:COR.blue },
  { num:"10", tipo:"Portaria Federal", titulo:"Portaria GM/MS 3.222/2019", data:"Nov/2019",
    objeto:"Versão anterior ao Previne Brasil. Revogada. Relevante apenas para auditoria de competências anteriores a Nov/2019.", inds:"—", status:"REVOGADA", cor:COR.red },
  { num:"11", tipo:"Resolução CFM", titulo:"Resolução CFM 2.228/2019", data:"2019",
    objeto:"Regulamenta prontuário eletrônico e padrões de interoperabilidade (FHIR, CNS, CPF). Fundamenta juridicamente o uso do e-SUS para apuração.", inds:"Todos", status:"VIGENTE", cor:COR.green },
  { num:"12", tipo:"Guia Técnico", titulo:"Guia Técnico e-SUS APS v5.2 — DAB/SAPS 2024", data:"2024",
    objeto:"Especificações técnicas para implantação do e-SUS APS. Versão 5.2+ obrigatória para integração RNDS; configuração e prazo de transmissão CDS.", inds:"Todos", status:"VIGENTE", cor:COR.green },
];

const SYS_COR: Record<string,string> = {
  "e-SUS": COR.blue, "RNDS": COR.green, "SIAPS": COR.purple,
  "SINAN": COR.orange, "SISAB": COR.red,
};

function Tag({ label, cor, bkg }: { label:string; cor:string; bkg:string }) {
  return (
    <span style={{ display:"inline-block", borderRadius:4, padding:"2px 8px",
      fontSize:10, fontWeight:700, background:bkg, color:cor, border:`1px solid ${cor}44`,
      whiteSpace:"nowrap", lineHeight:1.6 }}>{label}</span>
  );
}

function SysTag({ name }: { name: string }) {
  const cor = Object.entries(SYS_COR).find(([k]) => name.startsWith(k))?.[1] ?? COR.muted;
  return <Tag label={name} cor={cor} bkg={cor+"18"} />;
}

function StatusTag({ s }: { s: string }) {
  const cor = s === "VIGENTE" ? COR.green : s === "REV. PARCIAL" ? COR.amber : COR.red;
  return <Tag label={s} cor={cor} bkg={cor+"18"} />;
}

const tabStyle = (active: boolean) => ({
  padding:"10px 18px", border:"none", cursor:"pointer", fontSize:12, fontWeight:600,
  background: active ? COR.blue : "transparent",
  color: active ? "#fff" : COR.muted,
  borderRadius:"6px 6px 0 0",
} as React.CSSProperties);

const cardStyle: React.CSSProperties = {
  background:"#fff", border:`1px solid ${COR.border}`, borderRadius:10,
  padding:"18px 20px", marginBottom:16,
};
const thStyle: React.CSSProperties = {
  background:COR.blueLt, color:COR.navy, padding:"9px 12px",
  textAlign:"left", fontSize:11, fontWeight:700,
  letterSpacing:".03em", borderBottom:`2px solid ${COR.blue}`,
  whiteSpace:"nowrap",
};
const tdStyle: React.CSSProperties = {
  padding:"9px 12px", borderBottom:`1px solid ${COR.border}`,
  verticalAlign:"top", fontSize:12,
};

export default function MatrizNormativaAPS() {
  const [tab, setTab] = useState<"visao"|"indicadores"|"sistemas"|"normas">("visao");
  const [bloco, setBloco] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [det, setDet] = useState<Ind|null>(null);

  const inds = INDICADORES.filter(i =>
    (bloco === "Todos" || i.bloco === bloco) &&
    (!busca || i.nome.toLowerCase().includes(busca.toLowerCase()) || i.id.includes(busca.toUpperCase()))
  );

  const blocoCor: Record<string,string> = {
    "Mulher/Criança": COR.blue, "DCNT": COR.amber, "Saúde Bucal": COR.purple, "IST/TB/HNS": COR.orange,
  };

  return (
    <div style={{ fontFamily:"system-ui, sans-serif", minHeight:"100vh", background:COR.bg }}>

      {/* Header */}
      <div style={{ background:COR.navy, color:"#fff", padding:"18px 28px 14px",
        display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700 }}>Matriz Normativa — Novo Financiamento da APS</div>
          <div style={{ fontSize:12, color:"#9ab8d8", marginTop:4 }}>
            Portaria GM/MS 3.493/2024 · Sistemas DATASUS · 15 Indicadores de Desempenho · Rastreabilidade Normativa
          </div>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["Portaria 3.493/2024","e-SUS APS","RNDS","SISAB","SIAPS","CONASEMS"].map(l => (
            <span key={l} style={{ background:"rgba(255,255,255,.12)", border:"1px solid rgba(255,255,255,.22)",
              borderRadius:4, padding:"3px 10px", fontSize:11, color:"#c5dcf5" }}>{l}</span>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, padding:"16px 24px 0" }}>
        {[
          { val:"3",   lbl:"Componentes de Financiamento",     cor:COR.blue },
          { val:"15",  lbl:"Indicadores de Desempenho (P4P)",  cor:COR.green },
          { val:"4",   lbl:"Sistemas DATASUS envolvidos",      cor:COR.amber },
          { val:"12+", lbl:"Instrumentos normativos",          cor:COR.purple },
        ].map(k => (
          <div key={k.lbl} style={{ background:"#fff", borderRadius:8, padding:"14px 16px",
            border:`1px solid ${COR.border}`, borderTop:`3px solid ${k.cor}` }}>
            <div style={{ fontSize:28, fontWeight:900, color:k.cor, lineHeight:1 }}>{k.val}</div>
            <div style={{ fontSize:11, color:COR.muted, marginTop:4 }}>{k.lbl}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:2, padding:"16px 24px 0",
        borderBottom:`2px solid ${COR.border}`, background:COR.bg }}>
        {([
          { k:"visao"       as const, l:"Visão Geral" },
          { k:"indicadores" as const, l:"15 Indicadores" },
          { k:"sistemas"    as const, l:"Sistemas DATASUS" },
          { k:"normas"      as const, l:"Matriz Normativa" },
        ]).map(a => (
          <button key={a.k} onClick={() => setTab(a.k)} style={tabStyle(tab === a.k)}>{a.l}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:"24px 24px 48px", maxWidth:1200, margin:"0 auto" }}>

        {/* ── VISÃO GERAL ── */}
        {tab === "visao" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {/* Componentes */}
              <div style={cardStyle}>
                <div style={{ fontWeight:700, marginBottom:14, color:COR.navy, fontSize:13,
                  borderBottom:`1px solid ${COR.border}`, paddingBottom:10 }}>
                  ⚖️ Componentes da Portaria 3.493/2024
                </div>
                {[
                  { n:"I", cor:COR.blue, titulo:"Capitação Ponderada", desc:"Pagamento fixo por pessoa cadastrada e vinculada à eSF/eAP. Valor per capita ponderado por IVS, distância e porte. Base: R$ 7,84/pessoa·mês (Art. 6º).", tags:["e-SUS APS","Cadastro Individual","SISAB"] },
                  { n:"II", cor:COR.green, titulo:"Pagamento por Desempenho (P4P)", desc:"Avaliação semestral dos 15 indicadores clínico-assistenciais. Pontuação proporcional ao alcance das metas. Repasse vinculado ao desempenho apurado no SISAB.", tags:["15 indicadores","Semestral","SISAB/DAB"] },
                  { n:"III", cor:COR.purple, titulo:"Incentivo p/ Ações Estratégicas (IAE)", desc:"Recursos complementares: PMAQ, Consultório na Rua, Equipes Ribeirinhas, Quilombolas, eMulti, eSB, UBS Fluviais e programas prioritários do MS.", tags:["eMulti","eSB Tipo I/II","Pop. Especiais"] },
                ].map(c => (
                  <div key={c.n} style={{ display:"flex", gap:12, padding:"12px 0",
                    borderBottom:`1px solid ${COR.border}` }}>
                    <div style={{ width:28, height:28, borderRadius:6, background:c.cor, color:"#fff",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontWeight:800, fontSize:11, flexShrink:0 }}>{c.n}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:12 }}>{c.titulo}</div>
                      <div style={{ fontSize:11, color:COR.muted, marginTop:3 }}>{c.desc}</div>
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:6 }}>
                        {c.tags.map(t => <Tag key={t} label={t} cor={c.cor} bkg={c.cor+"18"} />)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fluxo */}
              <div style={cardStyle}>
                <div style={{ fontWeight:700, marginBottom:14, color:COR.navy, fontSize:13,
                  borderBottom:`1px solid ${COR.border}`, paddingBottom:10 }}>
                  🔄 Fluxo: Registro → Apuração → Repasse
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap",
                  justifyContent:"center", padding:"12px 0 20px" }}>
                  {[
                    { lbl:"Profissional", sub:"Atendimento UBS", cor:"#888" },
                    { lbl:"e-SUS APS", sub:"PEC/CDS local", cor:COR.blue },
                    { lbl:"RNDS", sub:"Barramento FHIR R4", cor:COR.green },
                    { lbl:"SISAB", sub:"Consolidação", cor:COR.red },
                    { lbl:"FNS/MS", sub:"Cálculo e repasse", cor:COR.purple },
                  ].map((box, i, arr) => (
                    <>
                      <div key={box.lbl} style={{ background:"#fff", border:`1.5px solid ${box.cor}`,
                        borderRadius:8, padding:"10px 12px", textAlign:"center", fontSize:11, minWidth:90 }}>
                        <div style={{ fontWeight:700, color:box.cor, fontSize:12 }}>{box.lbl}</div>
                        <div style={{ color:COR.muted, marginTop:2 }}>{box.sub}</div>
                      </div>
                      {i < arr.length - 1 && <span style={{ color:COR.muted, fontSize:16 }}>→</span>}
                    </>
                  ))}
                </div>
                <div style={{ fontWeight:700, color:COR.navy, fontSize:12, marginBottom:10 }}>Prazos críticos</div>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                  {[
                    ["Transmissão fichas CDS → SISAB","Até dia 5 do mês seguinte","e-SUS CDS"],
                    ["Sincronização PEC → RNDS","Diária (automática)","RNDS"],
                    ["Apuração semestral indicadores","Jan·Fev (1º sem) / Jul·Ago (2º sem)","SISAB/DAB"],
                    ["Publicação NF no SIOPS","Até 30 dias após apuração","SIOPS/MS"],
                    ["Transferência fundo a fundo","Mensal (Comp. I) · Semestral (Comp. II)","FNS → FMS"],
                  ].map(([ev,pz,sis]) => (
                    <tr key={ev} style={{ borderBottom:`1px solid ${COR.border}` }}>
                      <td style={{ padding:"7px 8px", color:COR.navy }}>{ev}</td>
                      <td style={{ padding:"7px 8px", color:COR.muted }}>{pz}</td>
                      <td style={{ padding:"7px 8px" }}><Tag label={sis} cor={COR.blue} bkg={COR.blueLt}/></td>
                    </tr>
                  ))}
                </table>
              </div>
            </div>

            {/* Comparativo */}
            <div style={cardStyle}>
              <div style={{ fontWeight:700, marginBottom:14, color:COR.navy, fontSize:13,
                borderBottom:`1px solid ${COR.border}`, paddingBottom:10 }}>
                📊 Previne Brasil (2.979/2019) vs Novo Financiamento APS (3.493/2024)
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      {["Dimensão","Previne Brasil (2.979/2019)","Novo Financiamento APS (3.493/2024)","Impacto para o Gestor"].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Indicadores P4P","7 indicadores","15 indicadores",<Tag label="↑ complexidade" cor={COR.amber} bkg={COR.amberLt}/>],
                      ["Valor per capita base","R$ 5,50/pessoa·mês","R$ 7,84/pessoa·mês",<Tag label="+42% de reajuste" cor={COR.green} bkg={COR.greenLt}/>],
                      ["Ponderadores","IVS, distância, porte","IVS, distância, porte + ruralidade",<Tag label="Mais equidade" cor={COR.green} bkg={COR.greenLt}/>],
                      ["Saúde Bucal","Não ponderada no P4P","3 indicadores (I09–I11)",<Tag label="Nova obrigação" cor={COR.amber} bkg={COR.amberLt}/>],
                      ["Registro obrigatório","e-SUS APS (CDS/PEC)","e-SUS APS + RNDS (obrigatório)",<Tag label="Novo req. RNDS" cor={COR.red} bkg={COR.redLt}/>],
                      ["Prazo de apuração","Quadrimestral","Semestral",<Tag label="Mais tempo" cor={COR.green} bkg={COR.greenLt}/>],
                    ].map(([dim,ant,nov,imp],i) => (
                      <tr key={i}>
                        <td style={{ ...tdStyle, fontWeight:600 }}>{dim}</td>
                        <td style={{ ...tdStyle, color:COR.muted }}>{ant}</td>
                        <td style={{ ...tdStyle }}>{nov}</td>
                        <td style={{ ...tdStyle }}>{imp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 15 INDICADORES ── */}
        {tab === "indicadores" && (
          <div>
            {/* Filtros */}
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
              <input placeholder="Buscar indicador (ex: gestante, PA, HbA1c)..."
                value={busca} onChange={e => setBusca(e.target.value)}
                style={{ border:`1px solid ${COR.border}`, borderRadius:6,
                  padding:"7px 12px", fontSize:12, width:300 }} />
              {BLOCOS.map(b => (
                <button key={b} onClick={() => setBloco(b)} style={{
                  padding:"5px 12px", borderRadius:5, border:"1px solid",
                  borderColor: bloco === b ? (blocoCor[b] ?? COR.blue) : COR.border,
                  background: bloco === b ? (blocoCor[b] ?? COR.blue) : "#fff",
                  color: bloco === b ? "#fff" : COR.muted,
                  fontWeight: bloco === b ? 700 : 400, fontSize:11, cursor:"pointer",
                }}>{b}</button>
              ))}
              <span style={{ fontSize:11, color:COR.muted, marginLeft:4 }}>{inds.length} indicadores</span>
            </div>

            <div style={cardStyle}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      {["#","Indicador","Bloco","Meta","Sistema Principal","Sistem. Complementar","Portaria",""].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inds.map(ind => (
                      <tr key={ind.id} style={{ borderBottom:`1px solid ${COR.border}`,
                        background: det?.id === ind.id ? COR.blueLt : undefined }}
                        onClick={() => setDet(det?.id === ind.id ? null : ind)}>
                        <td style={{ ...tdStyle, fontWeight:700, color:COR.blue, cursor:"pointer", whiteSpace:"nowrap" }}>{ind.id}</td>
                        <td style={{ ...tdStyle, maxWidth:280, cursor:"pointer" }}>{ind.nome}</td>
                        <td style={{ ...tdStyle }}><Tag label={ind.bloco} cor={blocoCor[ind.bloco]??COR.muted} bkg={(blocoCor[ind.bloco]??COR.muted)+"18"}/></td>
                        <td style={{ ...tdStyle, fontWeight:700, color:COR.green, whiteSpace:"nowrap" }}>{ind.meta}</td>
                        <td style={{ ...tdStyle }}><SysTag name={ind.sistPrincipal.split(" ")[0]}/></td>
                        <td style={{ ...tdStyle }}>{ind.sistComp !== "—" ? <SysTag name={ind.sistComp.split(" ")[0]}/> : <span style={{color:COR.muted}}>—</span>}</td>
                        <td style={{ ...tdStyle, fontSize:10, color:COR.muted }}>{ind.portaria.split("·")[0]}</td>
                        <td style={{ ...tdStyle, cursor:"pointer", color:COR.blue }}>
                          {det?.id === ind.id ? "▲" : "▼"}
                        </td>
                      </tr>
                    ))}
                    {inds.length === 0 && (
                      <tr><td colSpan={8} style={{ padding:24, textAlign:"center", color:COR.muted }}>Nenhum indicador encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detalhe expandido */}
            {det && (
              <div style={{ ...cardStyle, borderLeft:`4px solid ${COR.blue}` }}>
                <div style={{ fontWeight:700, fontSize:14, color:COR.navy, marginBottom:12 }}>
                  {det.id} — {det.nome}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:COR.muted, marginBottom:4 }}>FICHA / REGISTRO</div>
                    <div style={{ fontSize:12 }}>{det.ficha}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:COR.muted, marginBottom:4, marginTop:12 }}>BASE NORMATIVA</div>
                    <div style={{ fontSize:12 }}>{det.portaria}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:COR.muted, marginBottom:4 }}>OBRIGAÇÃO DO GESTOR MUNICIPAL</div>
                    <div style={{ fontSize:12, lineHeight:1.7 }}>{det.obrigacao}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SISTEMAS DATASUS ── */}
        {tab === "sistemas" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {[
                { cor:COR.blue, titulo:"e-SUS APS (PEC + CDS)", icone:"🖥️",
                  rows:[
                    ["Gestor","DAB/SAPS — Ministério da Saúde"],
                    ["Módulos","PEC (Prontuário Eletrônico do Cidadão) + CDS (Coleta de Dados Simplificada)"],
                    ["Fichas CDS","Cadastro Individual, Domiciliar, Atend. Individual, Atend. Odonto, Atividade Coletiva, Vacinação, Visita Domiciliar, Procedimentos, Marcadores Alimentares"],
                    ["Sincronização","PEC → RNDS via FHIR R4 (automático diário) · CDS → SISAB (prazo: dia 5 do mês)"],
                    ["Versão mínima","e-SUS APS 5.2+ (obrigatório para integração RNDS)"],
                    ["Indicadores","I01 I02 I03 I04 I05* I06 I07 I08 I09 I10 I11 I12* I13* I14* I15"],
                    ["Obrigatoriedade","Port. 3.493/2024, Art. 14 — uso do e-SUS condição para repasse"],
                  ]},
                { cor:COR.green, titulo:"RNDS — Rede Nacional de Dados em Saúde", icone:"🌐",
                  rows:[
                    ["Gestor","DATASUS/SE — Secretaria Executiva MS"],
                    ["Padrão","HL7 FHIR R4 (perfis RES — Registro Eletrônico de Saúde BR)"],
                    ["Recursos FHIR","Patient (CNS), Immunization (I05), Observation (PA, IMC, HbA1c), DiagnosticReport (I02, I07, I12, I15), Encounter, AllergyIntolerance"],
                    ["Integração chave","SIPNI (vacinação→I05) · SISCAN (cito→I04) · Lab resultados (→I07) · HIV/Sífilis (→I02, I15)"],
                    ["Indicadores","I02 I04 I05 I07 I12 I15"],
                    ["Obrigatoriedade","Resolução CFM 2.228/2019 + Portaria 1.792/2021"],
                    ["Acesso gestor","Conecte SUS Gestor · API FHIR auditada · Painel RNDS/DAB"],
                  ]},
                { cor:COR.purple, titulo:"SIAPS — Assist. Farmacêutica", icone:"💊",
                  rows:[
                    ["Gestor","DAF/SCTIE — Departamento de Assistência Farmacêutica"],
                    ["Módulos","HÓRUS (dispensação), e-AF (Assistência Farmacêutica), REMUME, CATMAT"],
                    ["Relevância APS","Dispensação de anti-hipertensivos e hipoglicemiantes como proxy de acompanhamento (I06 e I07)"],
                    ["Cruzamento","HÓRUS (DM) × e-SUS (atendimento) → validação I07 · REMUME × CDS Procedimentos → completude"],
                    ["Indicadores apoiados","I06 (HAS — dispensação) · I07 (DM — dispensação + HbA1c) · I08 (Obesidade — referência)"],
                    ["Base legal","Resolução CIT 2/2021 · Portaria 3.916/1998 (PNAF)"],
                  ]},
                { cor:COR.red, titulo:"SISAB / SINAN / SIPNI", icone:"📊",
                  rows:[
                    ["SISAB","Consolida dados do e-SUS, gera relatórios, calcula denominadores e APURA todos os 15 indicadores P4P. Acesso: sisab.saude.gov.br"],
                    ["SINAN","Sistema de Informação de Agravos de Notificação. Fonte de denominador para I13 (TB) e I14 (Hanseníase). Vinculação por CNS/CPF."],
                    ["SIPNI","Sistema Nacional de Informações sobre Imunizações. Integrado à RNDS automaticamente. Fonte de I05."],
                    ["Painel APS","painel.saude.gov.br/aps — monitoramento mensal por equipe/município"],
                    ["e-Gestor AB","e-gestorab.saude.gov.br — relatórios de cobertura, cadastros e indicadores em tempo real"],
                    ["Apuração oficial","SISAB é o sistema de apuração oficial para o Componente II (P4P) da Portaria 3.493/2024"],
                  ]},
              ].map(sys => (
                <div key={sys.titulo} style={{ ...cardStyle }}>
                  <div style={{ fontWeight:700, marginBottom:14, color:sys.cor, fontSize:13,
                    borderBottom:`1px solid ${COR.border}`, paddingBottom:10 }}>
                    {sys.icone} {sys.titulo}
                  </div>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <tbody>
                      {sys.rows.map(([k,v]) => (
                        <tr key={k} style={{ borderBottom:`1px solid ${COR.border}` }}>
                          <td style={{ ...tdStyle, fontWeight:600, color:COR.navy, width:"35%", whiteSpace:"nowrap" }}>{k}</td>
                          <td style={{ ...tdStyle, color:COR.muted }}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Matriz de integração */}
            <div style={cardStyle}>
              <div style={{ fontWeight:700, marginBottom:14, color:COR.navy, fontSize:13,
                borderBottom:`1px solid ${COR.border}`, paddingBottom:10 }}>
                🔗 Integração por Indicador — Fonte Principal × Complementar
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Ind.</th>
                      <th style={{ ...thStyle, background:"#ddeeff", color:"#0d3a6e" }}>e-SUS APS</th>
                      <th style={{ ...thStyle, background:"#d5f0e0", color:"#0a3d22" }}>RNDS</th>
                      <th style={{ ...thStyle, background:"#ede0f8", color:"#4a1870" }}>SIAPS</th>
                      <th style={{ ...thStyle, background:"#fde8d5", color:"#6b2800" }}>SINAN</th>
                      <th style={thStyle}>Tipo de dado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["I01","✅ Principal","🟡 RES gestante","—","—","Atendimento + DUM"],
                      ["I02","✅ Solicitação","✅ Resultado lab","—","—","Procedimento + RNDS"],
                      ["I03","✅ Principal","—","—","—","Atend. Odontológico"],
                      ["I04","✅ Solicitação","🟡 SISCAN","—","—","Procedimento 0203010035"],
                      ["I05","✅ Ficha Vacina","✅ SIPNI","—","—","Imunização D3 Polio + Penta"],
                      ["I06","✅ Principal","—","🟡 Dispensação","—","PA aferida CIAP K86/K87"],
                      ["I07","✅ Solicitação","✅ Resultado HbA1c","🟡 Dispensação DM","—","Procedimento 0202010872"],
                      ["I08","✅ Principal","—","🟡 Tratamento","—","Peso/Altura IMC calculado"],
                      ["I09","✅ Principal","—","—","—","Atend. Odonto Conclusão"],
                      ["I10","✅ Principal","—","—","—","Atend. Odonto 0–5 anos"],
                      ["I11","✅ Principal","—","—","—","Ficha Atividade Coletiva"],
                      ["I12","✅ Registro TR","✅ Resultado TR","—","—","Procedimento 4 agravos"],
                      ["I13","✅ Atendimento","—","—","✅ Denominador TB","CNS vinculado SINAN↔e-SUS"],
                      ["I14","✅ Atendimento","—","—","✅ Denominador HNS","CNS vinculado SINAN↔e-SUS"],
                      ["I15","✅ Procedimento","✅ Resultado","—","—","TR Sífilis + HIV (gestante)"],
                    ].map(([id,...cells]) => (
                      <tr key={id} style={{ borderBottom:`1px solid ${COR.border}` }}>
                        <td style={{ ...tdStyle, fontWeight:700, color:COR.blue }}>{id}</td>
                        {cells.slice(0,4).map((c,i) => (
                          <td key={i} style={{ ...tdStyle, textAlign:"center", fontSize:13,
                            color: c === "✅ Principal" || c === "✅ Solicitação" || c === "✅ Ficha Vacina" || c === "✅ Atendimento" || c === "✅ Procedimento" || c === "✅ Registro TR" || c === "✅ Resultado lab" || c === "✅ Resultado HbA1c" || c === "✅ Resultado TR" || c === "✅ SIPNI" || c === "✅ Denominador TB" || c === "✅ Denominador HNS" ? COR.green
                              : c.startsWith("🟡") ? COR.amber : COR.muted }}>
                            {c}
                          </td>
                        ))}
                        <td style={{ ...tdStyle, fontSize:11, color:COR.muted }}>{cells[4]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── MATRIZ NORMATIVA ── */}
        {tab === "normas" && (
          <div>
            <div style={cardStyle}>
              <div style={{ fontWeight:700, marginBottom:14, color:COR.navy, fontSize:13,
                borderBottom:`1px solid ${COR.border}`, paddingBottom:10 }}>
                📋 Todos os Instrumentos Normativos
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      {["#","Tipo","Instrumento","Data","Objeto","Indicadores","Status"].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {NORMAS.map(n => (
                      <tr key={n.num} style={{ borderBottom:`1px solid ${COR.border}` }}>
                        <td style={{ ...tdStyle, fontWeight:700, color:COR.blue }}>{n.num}</td>
                        <td style={{ ...tdStyle }}>
                          <Tag label={n.tipo} cor={COR.navy} bkg={COR.blueLt}/>
                        </td>
                        <td style={{ ...tdStyle, fontWeight:600, minWidth:220 }}>{n.titulo}</td>
                        <td style={{ ...tdStyle, whiteSpace:"nowrap", color:COR.muted }}>{n.data}</td>
                        <td style={{ ...tdStyle, fontSize:11, color:COR.muted, maxWidth:340 }}>{n.objeto}</td>
                        <td style={{ ...tdStyle, fontSize:11, whiteSpace:"nowrap" }}>{n.inds}</td>
                        <td style={{ ...tdStyle }}><StatusTag s={n.status}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rastreabilidade por indicador */}
            <div style={cardStyle}>
              <div style={{ fontWeight:700, marginBottom:14, color:COR.navy, fontSize:13,
                borderBottom:`1px solid ${COR.border}`, paddingBottom:10 }}>
                🗂️ Rastreabilidade Normativa: Indicador × Portaria × Sistema × Obrigação
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      {["Ind.","Indicador","Portaria Principal","Instrumento Complementar","Sistema Obrigatório","Obrigação do Gestor"].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {INDICADORES.map(ind => (
                      <tr key={ind.id} style={{ borderBottom:`1px solid ${COR.border}` }}>
                        <td style={{ ...tdStyle, fontWeight:700, color:COR.blue, whiteSpace:"nowrap" }}>{ind.id}</td>
                        <td style={{ ...tdStyle, maxWidth:200, fontSize:11 }}>{ind.nome}</td>
                        <td style={{ ...tdStyle, fontSize:11, color:COR.muted, whiteSpace:"nowrap" }}>
                          {ind.portaria.split("·")[0].trim()}
                        </td>
                        <td style={{ ...tdStyle, fontSize:11, color:COR.muted }}>
                          {ind.portaria.split("·").slice(1).join("·").trim() || "—"}
                        </td>
                        <td style={{ ...tdStyle }}>
                          <SysTag name={ind.sistPrincipal.split(" ")[0]}/>
                          {ind.sistComp !== "—" && <><br/><SysTag name={ind.sistComp.split(" ")[0]}/></>}
                        </td>
                        <td style={{ ...tdStyle, fontSize:11, color:COR.muted }}>{ind.obrigacao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Checklist */}
            <div style={cardStyle}>
              <div style={{ fontWeight:700, marginBottom:14, color:COR.navy, fontSize:13,
                borderBottom:`1px solid ${COR.border}`, paddingBottom:10 }}>
                ⚠️ Checklist de Conformidade para Gestores Municipais
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[
                  { ok:true,  titulo:"e-SUS APS atualizado para v5.2+",         desc:"Versão mínima para integração com a RNDS. Obrigatória pela Port. 3.493/2024, Art. 14." },
                  { ok:true,  titulo:"Cadastros Individuais atualizados ≥ 85%",  desc:"Denominadores de todos os 15 indicadores derivam do Cadastro Individual no SISAB. Inconsistências inflam ou deflam metas." },
                  { ok:true,  titulo:"Transmissão mensal ao SISAB (até dia 5)",  desc:"Municípios com transmissão irregular perdem dados na apuração semestral. Monitorar no SISAB Gestor." },
                  { ok:false, titulo:"Integração RNDS configurada no e-SUS",     desc:"Novo requisito (Port. 3.493/2024 + Port. 1.792/2021). Sem integração RNDS, indicadores I02, I05, I07, I12 e I15 são prejudicados." },
                  { ok:false, titulo:"Equipe eSB (Saúde Bucal) implantada",      desc:"I03, I09 e I10 dependem da existência de equipe eSB. Municípios sem eSB ficam zerados nesses indicadores." },
                  { ok:false, titulo:"SINAN sincronizado (TB e Hanseníase)",      desc:"I13 e I14 cruzam SINAN (denominador) × e-SUS (atendimento). CNS deve ser idêntico nos dois sistemas." },
                  { ok:false, titulo:"Não registrar em sistemas paralelos",       desc:"Registros em Excel, Google Forms ou SIAB legado NÃO entram na apuração. Apenas e-SUS (PEC/CDS) é reconhecido pelo SISAB." },
                  { ok:false, titulo:"Atendimentos sem CNS/CPF são descartados", desc:"Registros sem identificação do cidadão não são vinculados ao denominador e são excluídos dos 15 indicadores." },
                ].map(item => (
                  <div key={item.titulo} style={{ display:"flex", gap:10, padding:"12px",
                    background: item.ok ? COR.greenLt : COR.redLt,
                    borderRadius:8, border:`1px solid ${item.ok ? COR.green : COR.red}30` }}>
                    <div style={{ width:28, height:28, borderRadius:6, flexShrink:0,
                      background: item.ok ? COR.green : COR.red, color:"#fff",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontWeight:800, fontSize:14 }}>{item.ok ? "✓" : "✗"}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:12, color: item.ok ? COR.green : COR.red }}>{item.titulo}</div>
                      <div style={{ fontSize:11, color:COR.muted, marginTop:4 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize:10, color:COR.muted, fontStyle:"italic", marginTop:8 }}>
              Referências: Portaria GM/MS 3.493/2024 · Portaria GM/MS 2.979/2019 · Resolução CIT 8/2020 · Portaria GM/MS 1.792/2021 · Portaria GM/MS 2.436/2017 (PNAB) · Manual Instrutivo dos Indicadores SAPS/MS 2024 · Nota Técnica DESF/SAPS nº 14/2023 · Guia Técnico e-SUS APS v5.2 · Nota Técnica CONASEMS nº 04/2024 · Resolução CFM 2.228/2019. Atualizar conforme Notas Técnicas SAPS publicadas em aps.saude.gov.br
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
