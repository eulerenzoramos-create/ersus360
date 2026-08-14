// src/pages/PrevineBrasil.tsx — Componente Qualidade · Portaria GM/MS 3.493/2024 + 7.799/2025
// Substituiu o Novo Financiamento APS (extinto em abril/2024)
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Target, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, AlertTriangle, Ship, Users, Stethoscope, Baby, Heart, FlaskConical, Eye, Pill } from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

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

// ── componente principal ──────────────────────────────────────────────────────
export default function ComponenteQualidade() {
  const [tab, setTab] = useState<"consolidado" | "grupoC" | "grupoB" | "grupoM" | "ribeirinha">("consolidado");
  const [competencia, setCompetencia] = useState("202507");
  const mes = competencia.slice(4);
  const ano = competencia.slice(0, 4);

  const { data, isLoading } = useQuery({
    queryKey: ["componente-qualidade", mes, ano],
    queryFn: () => apiGet(`/api/parametros-ms/componente-qualidade?mes=${mes}&ano=${ano}`),
  });

  const grupoC: GrupoQual | null = data?.grupos?.C ?? null;
  const grupoB: GrupoQual | null = data?.grupos?.B ?? null;
  const grupoM: GrupoQual | null = data?.grupos?.M ?? null;

  const totalBomOtimo = data
    ? Math.round(((grupoC?.pct_bom_otimo ?? 0) + (grupoB?.pct_bom_otimo ?? 0) + (grupoM?.pct_bom_otimo ?? 0)) / 3)
    : 0;

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
        <select value={competencia} onChange={e => setCompetencia(e.target.value)}
          style={{ padding:"7px 12px", borderRadius:6, border:"1px solid #e0e0e0", fontSize:13 }}>
          {["202503","202504","202505","202506","202507"].map(c => (
            <option key={c} value={c}>{c.slice(4)}/{c.slice(0,4)}</option>
          ))}
        </select>
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
      {!data && (
          <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />
        )}

        {data && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:10, marginBottom:20 }}>
          {[
            { label:"15 Indicadores", val:"C/B/M",            cor:"#1e40af", sub:"Componente Qualidade"         },
            { label:"Bom/Ótimo",      val:`${totalBomOtimo}%`, cor:"#15803d", sub:"indicadores consolidados"     },
            { label:"Grupo C (eSF)",  val:`${grupoC?.nota_media?.toFixed(1) ?? "—"}/10`, cor:GRUPO_COR.C, sub:`${grupoC?.conceito_medio ?? "—"} · 7 ind.` },
            { label:"Grupo B (eSB)",  val:`${grupoB?.nota_media?.toFixed(1) ?? "—"}/10`, cor:GRUPO_COR.B, sub:`${grupoB?.conceito_medio ?? "—"} · 6 ind.` },
            { label:"Grupo M (eMulti)",val:`${grupoM?.nota_media?.toFixed(1) ?? "—"}/10`,cor:GRUPO_COR.M, sub:`${grupoM?.conceito_medio ?? "—"} · 2 ind.` },
          ].map(k => (
            <div key={k.label} style={{ background:"#fff", borderRadius:8, padding:"12px 16px", border:`2px solid ${k.cor}20`, textAlign:"center" }}>
              <div style={{ fontSize:24, fontWeight:900, color:k.cor, lineHeight:1 }}>{k.val}</div>
              <div style={{ fontSize:11, fontWeight:700, color:"#374151", marginTop:2 }}>{k.label}</div>
              <div style={{ fontSize:10, color:"#9ca3af" }}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

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
        <div>
          {isLoading ? (
            <div style={{ padding:40, textAlign:"center", color:"#9ca3af" }}>Carregando indicadores...</div>
          ) : !data ? (
            <div style={{ padding:40, textAlign:"center", color:"#9ca3af" }}>Sem dados para a competência selecionada</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {[
                { key:"C", grupo:grupoC, DescIcon:<Users size={16}/> },
                { key:"B", grupo:grupoB, DescIcon:<Stethoscope size={16}/> },
                { key:"M", grupo:grupoM, DescIcon:<Activity size={16}/> },
              ].map(({ key, grupo }) => grupo && (
                <div key={key} style={{ border:`1px solid ${GRUPO_COR[key]}30`, borderRadius:10, overflow:"hidden" }}>
                  <GrupoHeader grupo={key} data={grupo} />
                  <div style={{ padding:16, background:"#f9fafb" }}>
                    <div style={{ fontSize:12, color:"#6b7280", marginBottom:12 }}>
                      Equipes: {grupo.equipes.join(", ")} · {grupo.total_indicadores} indicadores
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
                      {grupo.indicadores.map(ind => (
                        <CardIndicador key={ind.codigo} ind={ind} grupo={key} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Grupo C — eSF/eAP ── */}
      {tab === "grupoC" && (
        <div>
          {!grupoC ? (
            <div style={{ padding:40, textAlign:"center", color:"#9ca3af" }}>Carregando...</div>
          ) : (
            <div>
              <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8, padding:"10px 16px", marginBottom:16, fontSize:13, color:"#1e40af" }}>
                <b>Grupo C — eSF e eAP</b> · 7 indicadores (C1–C7) · Portaria GM/MS 3.493/2024 + 7.799/2025 · Efeitos financeiros desde 05/2025
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
                {grupoC.indicadores.map(ind => <CardIndicador key={ind.codigo} ind={ind} grupo="C" />)}
              </div>
              <div style={{ marginTop:16, background:"#fff", borderRadius:8, padding:"12px 16px", border:"1px solid #e5e7eb", fontSize:12, color:"#6b7280" }}>
                <b>Fonte:</b> SIAPS (e-Gestor APS) · <b>Periodicidade:</b> Mensal · <b>Sistema:</b> PEC eSUS / SISAB para registro de produção
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Grupo B — eSB ── */}
      {tab === "grupoB" && (
        <div>
          {!grupoB ? (
            <div style={{ padding:40, textAlign:"center", color:"#9ca3af" }}>Carregando...</div>
          ) : (
            <div>
              <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"10px 16px", marginBottom:16, fontSize:13, color:"#15803d" }}>
                <b>Grupo B — eSB Modalidade I e II</b> · 6 indicadores (B1–B6) · Portaria GM/MS 3.493/2024 + 7.799/2025
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
                {grupoB.indicadores.map(ind => <CardIndicador key={ind.codigo} ind={ind} grupo="B" />)}
              </div>
              <div style={{ marginTop:16, background:"#fff", borderRadius:8, padding:"12px 16px", border:"1px solid #e5e7eb", fontSize:12, color:"#6b7280" }}>
                <b>Fonte:</b> SIAPS (e-Gestor APS) · <b>Periodicidade:</b> Mensal · <b>Sistema:</b> SISAB (SIA/SUS para procedimentos odontológicos)
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Grupo M — eMulti ── */}
      {tab === "grupoM" && (
        <div>
          {!grupoM ? (
            <div style={{ padding:40, textAlign:"center", color:"#9ca3af" }}>Carregando...</div>
          ) : (
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
