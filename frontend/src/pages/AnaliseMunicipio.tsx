// src/pages/AnaliseMunicipio.tsx — Análise Brasil 360 para qualquer município
import { useState, useRef } from "react";
import {
  Search, Plus, Trash2, BarChart2, Download, RefreshCw,
  Trophy, AlertTriangle, CheckCircle, Target, ChevronDown, ChevronUp, Printer
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────
type TipoEquipe = "eSF" | "eAP" | "eSB" | "eMulti" | "eRibeirinha";

interface Equipe {
  id: string;
  nome: string;
  tipo: TipoEquipe;
  ine: string;
  // Grupo C (eSF/eAP)
  c1: number; c2: number; c3: number; c4: number; c5: number; c6: number; c7: number;
  // Grupo B (eSB)
  b1: number; b2: number; b3: number; b4: number; b5: number; b6: number;
  // Grupo M (eMulti)
  m1: number; m2: number;
  // Vínculo e Acompanhamento
  va: number;
  // Implantação
  impl: number;
}

interface Municipio {
  codigo: string;
  nome: string;
  uf: string;
}

// ── Municípios brasileiros (sample — busca por nome) ─────────────────────
// Em produção, buscaria da API IBGE
const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

// ── Pesos por indicador (Portaria 3.493/2024) ────────────────────────────
const PESO_C = { c1:10, c2:25, c3:10, c4:10, c5:15, c6:20, c7:10 };
const PESO_B = { b1:20, b2:20, b3:15, b4:15, b5:15, b6:15 };
const PESO_M = { m1:50, m2:50 };

// ── Descrições dos indicadores ────────────────────────────────────────────
const DESC_C: Record<string,string> = {
  c1:"Acesso Avaliado", c2:"Pré-natal Adequado", c3:"Rastreio Colo Útero",
  c4:"Rastreio Mama", c5:"HAS Controlada", c6:"Puericultura", c7:"Saúde Bucal Gestante"
};
const DESC_B: Record<string,string> = {
  b1:"1ª Consulta Odontológica", b2:"Conclusão Tratamento", b3:"Urgência Odonto",
  b4:"Gestante Odonto", b5:"Prevenção Coletiva", b6:"Escovação Supervisionada"
};
const DESC_M: Record<string,string> = { m1:"Saúde Mental", m2:"Reabilitação" };

// ── Cálculo de score ──────────────────────────────────────────────────────
function calcScore(eq: Equipe): { total: number; quali: number; va: number; impl: number; gaps: {ind:string;desc:string;atual:number;pts:number}[] } {
  let quali = 0;
  const gaps: {ind:string;desc:string;atual:number;pts:number}[] = [];

  if (eq.tipo === "eSF" || eq.tipo === "eAP") {
    const inds = ["c1","c2","c3","c4","c5","c6","c7"] as const;
    inds.forEach(k => {
      const val = eq[k] as number;
      const peso = PESO_C[k];
      const score = (val / 100) * peso;
      quali += score;
      if (val < 80) gaps.push({ ind: k.toUpperCase(), desc: DESC_C[k], atual: val, pts: Math.round((80 - val) / 100 * peso * 10) / 10 });
    });
  } else if (eq.tipo === "eSB") {
    const inds = ["b1","b2","b3","b4","b5","b6"] as const;
    inds.forEach(k => {
      const val = eq[k] as number;
      const peso = PESO_B[k];
      const score = (val / 100) * peso;
      quali += score;
      if (val < 80) gaps.push({ ind: k.toUpperCase(), desc: DESC_B[k], atual: val, pts: Math.round((80 - val) / 100 * peso * 10) / 10 });
    });
  } else if (eq.tipo === "eMulti") {
    const inds = ["m1","m2"] as const;
    inds.forEach(k => {
      const val = eq[k] as number;
      const peso = PESO_M[k];
      const score = (val / 100) * peso;
      quali += score;
      if (val < 80) gaps.push({ ind: k.toUpperCase(), desc: DESC_M[k], atual: val, pts: Math.round((80 - val) / 100 * peso * 10) / 10 });
    });
  }

  gaps.sort((a, b) => b.pts - a.pts);
  const total = quali * 0.7 + eq.va * 0.2 + eq.impl * 0.1;
  return { total: Math.round(total * 10) / 10, quali: Math.round(quali * 10) / 10, va: eq.va, impl: eq.impl, gaps };
}

function classificar(pts: number) {
  if (pts >= 75) return { label: "ÓTIMO", cor: "#22c55e", bg: "#14532d" };
  if (pts >= 60) return { label: "BOM", cor: "#f59e0b", bg: "#78350f" };
  if (pts >= 50) return { label: "SUFICIENTE", cor: "#fb923c", bg: "#7c2d12" };
  return { label: "REGULAR", cor: "#ef4444", bg: "#7f1d1d" };
}

function novaEquipe(): Equipe {
  return {
    id: Math.random().toString(36).slice(2),
    nome: "", tipo: "eSF", ine: "",
    c1:0,c2:0,c3:0,c4:0,c5:0,c6:0,c7:0,
    b1:0,b2:0,b3:0,b4:0,b5:0,b6:0,
    m1:0,m2:0, va:0, impl:0
  };
}

// ── Ações recomendadas por indicador ─────────────────────────────────────
const ACOES: Record<string, string> = {
  C1: "Registrar retorno de 30 dias no PEC após cada consulta. Tipo de atendimento correto.",
  C2: "HbA1c + VDRL na 1ª consulta pré-natal. Lançar resultado no PEC com tipo correto.",
  C3: "Busca ativa mulheres 25-64 anos sem citopatológico. Dia D de coleta.",
  C4: "Busca ativa mulheres 50-69 anos. Solicitar mamografia e lançar resultado no PEC.",
  C5: "Técnico de enfermagem lança PA em TODA consulta de hipertenso. Meta: PA <140/90.",
  C6: "Agenda de puericultura 2x/semana. Busca ativa crianças <2 anos via ACS.",
  C7: "Consulta odontológica da gestante no pré-natal. Integrar agendas odonto + pré-natal.",
  B1: "Agenda de primeira consulta odontológica. Busca ativa de pacientes sem consulta.",
  B2: "Finalizar tratamentos em andamento no PEC. Registrar conclusão corretamente.",
  B3: "Protocolo de urgência odonto disponível. Registro de atendimentos de urgência.",
  B4: "Gestante deve ter consulta odonto no pré-natal. Integrar com equipe eSF.",
  B5: "Atividade coletiva de escovação. Registrar no PEC como atividade coletiva.",
  B6: "Supervisão de escovação nas escolas. Registrar no PEC.",
  M1: "Casos de saúde mental identificados e acompanhados pelo eMulti. Lançar no PEC.",
  M2: "Casos de reabilitação identificados. Atendimentos lançados no PEC com INE correto.",
};

// ── Componente ────────────────────────────────────────────────────────────
export default function AnaliseMunicipio() {
  const [etapa, setEtapa] = useState<"municipio"|"equipes"|"analise">("municipio");
  const [municipio, setMunicipio] = useState<Municipio>({ codigo: "", nome: "", uf: "AM" });
  const [quadrimestre, setQuadrimestre] = useState("Q2/2026");
  const [equipes, setEquipes] = useState<Equipe[]>([novaEquipe()]);
  const [expandido, setExpandido] = useState<Record<string,boolean>>({});
  const [busca, setBusca] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  function addEquipe() { setEquipes(p => [...p, novaEquipe()]); }
  function removeEquipe(id: string) { setEquipes(p => p.filter(e => e.id !== id)); }
  function updateEquipe(id: string, campo: keyof Equipe, valor: string | number) {
    setEquipes(p => p.map(e => e.id === id ? { ...e, [campo]: valor } : e));
  }
  function toggleExp(id: string) { setExpandido(p => ({ ...p, [id]: !p[id] })); }

  const resultados = equipes.map(eq => ({ eq, ...calcScore(eq) }));
  const otimo = resultados.filter(r => r.total >= 75).length;
  const bom = resultados.filter(r => r.total >= 60 && r.total < 75).length;
  const risco = resultados.filter(r => r.total < 60).length;
  const mediaGeral = resultados.length ? Math.round(resultados.reduce((a,r) => a + r.total, 0) / resultados.length * 10) / 10 : 0;

  function imprimir() {
    const w = window.open("", "_blank", "width=1000,height=700");
    if (!w) { alert("Permita popups para imprimir."); return; }
    const rows = resultados.map(r => {
      const cl = classificar(r.total);
      const topGap = r.gaps[0];
      return `<tr>
        <td>${r.eq.nome || "(sem nome)"}</td>
        <td>${r.eq.tipo}</td>
        <td style="font-weight:700;color:${cl.cor}">${r.total}</td>
        <td style="font-weight:700;color:${cl.cor}">${cl.label}</td>
        <td>${r.total >= 75 ? "—" : "+" + (75 - r.total).toFixed(1) + " pts"}</td>
        <td>${topGap ? topGap.ind + " (" + topGap.atual + "%)" : "—"}</td>
        <td>${topGap ? ACOES[topGap.ind] || "—" : "Manter protocolo"}</td>
      </tr>`;
    }).join("");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8">
    <title>Análise Brasil 360 — ${municipio.nome}/${municipio.uf}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:20px;color:#111}
      h1{font-size:16px;margin-bottom:4px}
      h2{font-size:13px;color:#555;margin-bottom:16px;font-weight:normal}
      table{width:100%;border-collapse:collapse;font-size:11px}
      th{background:#1e3a5f;color:#fff;padding:6px 8px;text-align:left}
      td{padding:5px 8px;border-bottom:1px solid #eee}
      tr:nth-child(even) td{background:#f9f9f9}
      .kpi{display:inline-block;margin-right:24px;font-size:13px}
      .kpi b{font-size:22px;display:block}
      @media print{body{padding:0}}
    </style></head><body>
    <h1>Análise Brasil 360 — Componente Qualidade</h1>
    <h2>${municipio.nome}/${municipio.uf} · IBGE: ${municipio.codigo || "—"} · Quadrimestre: ${quadrimestre} · Portaria GM/MS 3.493/2024</h2>
    <div style="margin-bottom:16px">
      <span class="kpi"><b>${mediaGeral}</b>Média Geral</span>
      <span class="kpi"><b style="color:#22c55e">${otimo}</b>ÓTIMO (≥75)</span>
      <span class="kpi"><b style="color:#f59e0b">${bom}</b>BOM (60–74)</span>
      <span class="kpi"><b style="color:#ef4444">${risco}</b>Risco (&lt;60)</span>
      <span class="kpi"><b>${equipes.length}</b>Equipes</span>
    </div>
    <table><thead><tr>
      <th>Equipe</th><th>Tipo</th><th>Score</th><th>Classificação</th>
      <th>Falta p/ ÓTIMO</th><th>Maior Gap</th><th>Ação Prioritária</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <p style="font-size:10px;color:#888;margin-top:20px">
      Gerado pelo ERSUS360 · ${new Date().toLocaleString("pt-BR")} · Scores informados manualmente via e-Gestor AB
    </p>
    <script>window.onload=function(){window.print();setTimeout(function(){window.close()},1000)}<\/script>
    </body></html>`);
    w.document.close();
  }

  const s: Record<string, React.CSSProperties> = {
    page: { padding: "0 0 60px 0", fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh", color: "#111827" },
    header: { background: "linear-gradient(135deg,#0f172a,#1e3a5f)", borderBottom: "1px solid #1e293b", padding: "16px 24px" },
    body: { padding: "20px 24px" },
    card: { background: "#ffffff", borderRadius: 10, padding: 18, marginBottom: 14, border: "1px solid #334155" },
    label: { fontSize: 11, color: "#6b7280", marginBottom: 4, display: "block", textTransform: "uppercase" as const, letterSpacing: 0.5 },
    input: { background: "#f4f6f8", border: "1px solid #334155", borderRadius: 6, color: "#111827", padding: "7px 10px", fontSize: 13, width: "100%", outline: "none" },
    select: { background: "#f4f6f8", border: "1px solid #334155", borderRadius: 6, color: "#111827", padding: "7px 10px", fontSize: 13, width: "100%", outline: "none" },
    btn: { padding: "8px 18px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
    grid4: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 },
    row: { display: "flex", gap: 10, alignItems: "center" },
  };

  function IndSlider({ id, campo, label, valor }: { id:string; campo:keyof Equipe; label:string; valor:number }) {
    const cor = valor >= 80 ? "#22c55e" : valor >= 60 ? "#f59e0b" : "#ef4444";
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: cor }}>{valor}%</span>
        </div>
        <input type="range" min={0} max={100} step={1} value={valor}
          onChange={e => updateEquipe(id, campo, Number(e.target.value))}
          style={{ width: "100%", accentColor: cor, height: 4 }}
        />
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Search size={20} color="#3b82f6" />
              <span style={{ fontWeight: 700, fontSize: 17 }}>Análise Brasil 360 — Qualquer Município</span>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Portaria GM/MS 3.493/2024 · Componente Qualidade · eSF, eSB, eMulti, eRibeirinha</div>
          </div>
          {etapa === "analise" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...s.btn, background: "#dbeafe", color: "#1d4ed8" }} onClick={() => setEtapa("equipes")}>
                <RefreshCw size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />Editar
              </button>
              <button style={{ ...s.btn, background: "#166534", color: "#bbf7d0" }} onClick={imprimir}>
                <Printer size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />Imprimir / PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #1e293b", padding: "0 24px" }}>
        {[
          { key: "municipio", label: "1. Município" },
          { key: "equipes",   label: "2. Equipes & Scores" },
          { key: "analise",   label: "3. Análise" },
        ].map((t, i) => (
          <button key={t.key} onClick={() => { if (i === 0 || (i === 1) || etapa === "analise") setEtapa(t.key as any); }}
            style={{ padding: "10px 20px", fontSize: 13, fontWeight: etapa === t.key ? 700 : 400,
              border: "none", borderBottom: etapa === t.key ? "2px solid #3b82f6" : "2px solid transparent",
              background: "transparent", color: etapa === t.key ? "#3b82f6" : "#6b7280", cursor: "pointer", marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={s.body}>

        {/* ETAPA 1 — Município */}
        {etapa === "municipio" && (
          <div style={{ maxWidth: 560 }}>
            <div style={s.card}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Identificação do Município</div>

              <div style={{ ...s.grid2, marginBottom: 14 }}>
                <div>
                  <label style={s.label}>Estado (UF)</label>
                  <select style={s.select} value={municipio.uf} onChange={e => setMunicipio(p => ({ ...p, uf: e.target.value }))}>
                    {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Código IBGE</label>
                  <input style={s.input} placeholder="Ex: 1300144" value={municipio.codigo}
                    onChange={e => setMunicipio(p => ({ ...p, codigo: e.target.value }))} />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Nome do Município</label>
                <input style={s.input} placeholder="Ex: Apuí" value={municipio.nome}
                  onChange={e => setMunicipio(p => ({ ...p, nome: e.target.value }))} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={s.label}>Quadrimestre de Referência</label>
                <select style={s.select} value={quadrimestre} onChange={e => setQuadrimestre(e.target.value)}>
                  {["Q1/2025","Q2/2025","Q3/2025","Q1/2026","Q2/2026","Q3/2026"].map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div style={{ background: "#f4f6f8", borderRadius: 8, padding: 14, marginBottom: 20, border: "1px solid #1e3a5f" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", marginBottom: 8 }}>📋 Como usar</div>
                <ol style={{ fontSize: 12, color: "#6b7280", paddingLeft: 16, margin: 0, lineHeight: 1.8 }}>
                  <li>Acesse o <strong style={{ color: "#111827" }}>e-Gestor AB</strong> → SIAPS → Componente Qualidade</li>
                  <li>Selecione o município e o quadrimestre</li>
                  <li>Anote o score de cada indicador de cada equipe</li>
                  <li>Preencha aqui e gere a análise completa</li>
                </ol>
              </div>

              <button style={{ ...s.btn, background: "#1d4ed8", color: "#fff", width: "100%", fontSize: 14 }}
                disabled={!municipio.nome}
                onClick={() => setEtapa("equipes")}>
                Continuar → Cadastrar Equipes
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 2 — Equipes */}
        {etapa === "equipes" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{municipio.nome}/{municipio.uf} — {quadrimestre}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Informe os scores de cada indicador (% de cobertura conforme e-Gestor AB)</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...s.btn, background: "#dbeafe", color: "#1d4ed8" }} onClick={addEquipe}>
                  <Plus size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />Adicionar Equipe
                </button>
                <button style={{ ...s.btn, background: "#166534", color: "#bbf7d0" }}
                  disabled={equipes.some(e => !e.nome)}
                  onClick={() => setEtapa("analise")}>
                  Gerar Análise →
                </button>
              </div>
            </div>

            {equipes.map((eq, idx) => {
              const { total } = calcScore(eq);
              const cl = classificar(total);
              const aberto = expandido[eq.id] !== false; // default aberto
              const indsC = ["c1","c2","c3","c4","c5","c6","c7"] as const;
              const indsB = ["b1","b2","b3","b4","b5","b6"] as const;
              const indsM = ["m1","m2"] as const;

              return (
                <div key={eq.id} style={{ ...s.card, border: `1px solid ${cl.cor}44` }}>
                  {/* Cabeçalho da equipe */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: aberto ? 16 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                      <span style={{ background: "#f4f6f8", color: "#6b7280", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{idx+1}</span>
                      <input style={{ ...s.input, maxWidth: 220, fontWeight: 600 }} placeholder="Nome da equipe (ex: ESF Kennedy)"
                        value={eq.nome} onChange={e => updateEquipe(eq.id, "nome", e.target.value)} />
                      <select style={{ ...s.select, maxWidth: 130 }} value={eq.tipo}
                        onChange={e => updateEquipe(eq.id, "tipo", e.target.value as TipoEquipe)}>
                        <option value="eSF">eSF</option>
                        <option value="eAP">eAP</option>
                        <option value="eSB">eSB</option>
                        <option value="eMulti">eMulti</option>
                        <option value="eRibeirinha">eRibeirinha</option>
                      </select>
                      <input style={{ ...s.input, maxWidth: 120 }} placeholder="INE (opcional)"
                        value={eq.ine} onChange={e => updateEquipe(eq.id, "ine", e.target.value)} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ textAlign: "center", minWidth: 70 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: cl.cor }}>{total}</div>
                        <div style={{ fontSize: 10, background: cl.bg, color: cl.cor, borderRadius: 10, padding: "1px 6px" }}>{cl.label}</div>
                      </div>
                      <button onClick={() => toggleExp(eq.id)} style={{ background: "#d1d5db", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#6b7280" }}>
                        {aberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button onClick={() => removeEquipe(eq.id)} style={{ background: "#450a0a", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#ef4444" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {aberto && (
                    <div>
                      {/* Vínculo e Acompanhamento + Implantação */}
                      <div style={{ ...s.grid2, marginBottom: 16 }}>
                        <IndSlider id={eq.id} campo="va" label="Vínculo e Acompanhamento (%)" valor={eq.va} />
                        <IndSlider id={eq.id} campo="impl" label="Implantação (%)" valor={eq.impl} />
                      </div>

                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Componente Qualidade — {eq.tipo === "eSB" ? "Grupo B" : eq.tipo === "eMulti" ? "Grupo M" : "Grupo C"}
                      </div>

                      {/* eSF / eAP / eRibeirinha → Grupo C */}
                      {(eq.tipo === "eSF" || eq.tipo === "eAP" || eq.tipo === "eRibeirinha") && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
                          {indsC.map(k => <IndSlider key={k} id={eq.id} campo={k} label={`${k.toUpperCase()} — ${DESC_C[k]}`} valor={eq[k]} />)}
                        </div>
                      )}

                      {/* eSB → Grupo B */}
                      {eq.tipo === "eSB" && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
                          {indsB.map(k => <IndSlider key={k} id={eq.id} campo={k} label={`${k.toUpperCase()} — ${DESC_B[k]}`} valor={eq[k]} />)}
                        </div>
                      )}

                      {/* eMulti → Grupo M */}
                      {eq.tipo === "eMulti" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          {indsM.map(k => <IndSlider key={k} id={eq.id} campo={k} label={`${k.toUpperCase()} — ${DESC_M[k]}`} valor={eq[k]} />)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <button style={{ ...s.btn, background: "#ffffff", color: "#6b7280", border: "1px dashed #334155", width: "100%", marginTop: 4 }} onClick={addEquipe}>
              <Plus size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />Adicionar outra equipe
            </button>
          </div>
        )}

        {/* ETAPA 3 — Análise */}
        {etapa === "analise" && (
          <div ref={printRef}>
            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Média Geral", valor: mediaGeral, cor: classificar(mediaGeral).cor },
                { label: "ÓTIMO ≥75", valor: otimo, cor: "#22c55e" },
                { label: "BOM 60–74", valor: bom, cor: "#f59e0b" },
                { label: "Risco <60", valor: risco, cor: "#ef4444" },
                { label: "Total Equipes", valor: equipes.length, cor: "#6b7280" },
              ].map(k => (
                <div key={k.label} style={{ background: "#ffffff", borderRadius: 10, padding: "14px 16px", textAlign: "center", border: "1px solid #334155" }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: k.cor }}>{k.valor}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Tabela de resultados */}
            <div style={{ ...s.card, overflow: "auto" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Resultado por Equipe — {municipio.nome}/{municipio.uf} · {quadrimestre}</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 700 }}>
                <thead>
                  <tr style={{ background: "#f4f6f8" }}>
                    {["Equipe","Tipo","Score","Classificação","Falta p/ ÓTIMO","Maior Gap","Ação Prioritária"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #334155" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultados.sort((a,b) => b.total - a.total).map(r => {
                    const cl = classificar(r.total);
                    const gap = r.gaps[0];
                    return (
                      <tr key={r.eq.id} style={{ borderBottom: "1px solid #1e293b" }}>
                        <td style={{ padding: "9px 10px", fontWeight: 600 }}>{r.eq.nome || "(sem nome)"}</td>
                        <td style={{ padding: "9px 10px" }}><span style={{ background: "#d1d5db", borderRadius: 6, padding: "2px 7px", fontSize: 11 }}>{r.eq.tipo}</span></td>
                        <td style={{ padding: "9px 10px", fontWeight: 800, fontSize: 16, color: cl.cor }}>{r.total}</td>
                        <td style={{ padding: "9px 10px" }}>
                          <span style={{ background: cl.bg, color: cl.cor, borderRadius: 10, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{cl.label}</span>
                        </td>
                        <td style={{ padding: "9px 10px", color: r.total >= 75 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                          {r.total >= 75 ? "✅ Atingido" : `+${(75 - r.total).toFixed(1)} pts`}
                        </td>
                        <td style={{ padding: "9px 10px" }}>
                          {gap ? <span style={{ color: "#f59e0b", fontWeight: 600 }}>{gap.ind} ({gap.atual}%)</span> : <span style={{ color: "#22c55e" }}>—</span>}
                        </td>
                        <td style={{ padding: "9px 10px", fontSize: 12, color: "#6b7280", maxWidth: 260 }}>
                          {gap ? ACOES[gap.ind] || "—" : "Manter protocolo atual"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Análise por equipe — gaps detalhados */}
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Gaps Detalhados por Equipe</div>
            {resultados.filter(r => r.gaps.length > 0).sort((a,b) => a.total - b.total).map(r => {
              const cl = classificar(r.total);
              return (
                <div key={r.eq.id} style={{ ...s.card, borderLeft: `4px solid ${cl.cor}`, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{r.eq.nome}</span>
                      <span style={{ fontSize: 11, background: "#d1d5db", borderRadius: 6, padding: "2px 7px", marginLeft: 8 }}>{r.eq.tipo}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: cl.cor }}>{r.total} pts</span>
                      <span style={{ fontSize: 11, background: cl.bg, color: cl.cor, borderRadius: 10, padding: "3px 10px", fontWeight: 700 }}>{cl.label}</span>
                      {r.total < 75 && <span style={{ fontSize: 12, color: "#ef4444" }}>faltam +{(75 - r.total).toFixed(1)} pts</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {r.gaps.map(g => (
                      <div key={g.ind} style={{ background: "#f4f6f8", borderRadius: 8, padding: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ minWidth: 40, textAlign: "center" }}>
                          <div style={{ fontWeight: 800, color: "#f59e0b", fontSize: 14 }}>{g.ind}</div>
                          <div style={{ fontSize: 10, color: "#6b7280" }}>{g.atual}%</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", marginBottom: 4 }}>{g.desc}</div>
                          <div style={{ height: 5, background: "#ffffff", borderRadius: 3, marginBottom: 6 }}>
                            <div style={{ height: "100%", width: `${g.atual}%`, background: g.atual >= 80 ? "#22c55e" : g.atual >= 60 ? "#f59e0b" : "#ef4444", borderRadius: 3 }} />
                          </div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>{ACOES[g.ind]}</div>
                        </div>
                        <div style={{ minWidth: 44, textAlign: "center", background: "#22c55e15", borderRadius: 6, padding: "4px 6px" }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#22c55e" }}>+{g.pts}</div>
                          <div style={{ fontSize: 9, color: "#6b7280" }}>pts</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {resultados.filter(r => r.total >= 75).length > 0 && (
              <div style={{ ...s.card, borderLeft: "4px solid #22c55e" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <CheckCircle size={16} color="#22c55e" />
                  <span style={{ fontWeight: 700, color: "#22c55e" }}>Equipes já em ÓTIMO — Manter protocolo</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {resultados.filter(r => r.total >= 75).map(r => (
                    <span key={r.eq.id} style={{ background: "#14532d", color: "#bbf7d0", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 600 }}>
                      {r.eq.nome} ({r.total} pts)
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ ...s.card, background: "#f4f6f8", border: "1px solid #1e3a5f", marginTop: 8 }}>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                Análise gerada pelo ERSUS360 · Scores informados manualmente via e-Gestor AB · Portaria GM/MS 3.493/2024
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
