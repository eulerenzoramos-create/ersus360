// src/pages/AnaliseMunicipio.tsx
import { useState } from "react";
import {
  Plus, Trash2, RefreshCw, CheckCircle, ChevronDown, ChevronUp,
  Printer, Calendar, TrendingUp, BarChart2, AlertTriangle, Target,
  ClipboardCheck, Clock, Award
} from "lucide-react";

type TipoEquipe = "eSF" | "eAP" | "eSB" | "eMulti" | "eRibeirinha";
type HorizonteAnalise = "diaria" | "mensal" | "quadrimestral";

interface Equipe {
  id: string; nome: string; tipo: TipoEquipe; ine: string;
  c1: number; c2: number; c3: number; c4: number; c5: number; c6: number; c7: number;
  b1: number; b2: number; b3: number; b4: number; b5: number; b6: number;
  m1: number; m2: number; va: number; impl: number;
}

interface Municipio { codigo: string; nome: string; uf: string; }

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
// Portaria GM/MS 3.493/2024 — Componente Qualidade C1–C7 (pesos iguais, soma 100)
const PESO_C: Record<string,number> = { c1:15, c2:15, c3:14, c4:14, c5:14, c6:14, c7:14 };
const PESO_B: Record<string,number> = { b1:20, b2:20, b3:15, b4:15, b5:15, b6:15 };
const PESO_M: Record<string,number> = { m1:50, m2:50 };

// Metas oficiais Portaria 3.493/2024
const META_C: Record<string,number> = { c1:75, c2:75, c3:70, c4:50, c5:50, c6:60, c7:40 };

const DESC_C: Record<string,string> = {
  c1:"Mais Acesso", c2:"Desenvolvimento Infantil", c3:"Gestação e Puerpério",
  c4:"Diabetes Mellitus", c5:"Hipertensão Arterial", c6:"Pessoa Idosa", c7:"Prevenção Câncer Colo"
};
const DESC_B: Record<string,string> = {
  b1:"1ª Consulta Odontológica", b2:"Conclusão Tratamento", b3:"Urgência Odonto",
  b4:"Gestante Odonto", b5:"Prevenção Coletiva", b6:"Escovação Supervisionada"
};
const DESC_M: Record<string,string> = { m1:"Saúde Mental", m2:"Reabilitação" };

const ACOES_DIARIAS: Record<string,string> = {
  // C1 — Mais Acesso: consultas realizadas no quadrimestre (meta 75%)
  C1: "Registrar TODAS as consultas do dia no PEC com tipo 'Consulta agendada' ou 'Demanda espontânea'. Verificar se cadastro está vinculado à equipe.",
  // C2 — Desenvolvimento Infantil: crianças 0–5 anos com consulta (meta 75%)
  C2: "Identificar crianças < 5 anos na agenda de hoje. Lançar consulta como 'Puericultura' no PEC. ACS: busca ativa das que não vêm há > 3 meses.",
  // C3 — Gestação e Puerpério: pré-natal adequado — ≥6 consultas + exames (meta 70%)
  C3: "Em toda consulta de pré-natal hoje: verificar número de consultas e lançar exames obrigatórios (sífilis, HIV, hemograma, GJ, urina). Lançar no PEC.",
  // C4 — Diabetes Mellitus: HbA1c solicitada nos últimos 12 meses (meta 50%)
  C4: "Para cada diabético na agenda hoje: verificar se HbA1c foi solicitada nos últimos 12 meses. Se não, solicitar e lançar exame no PEC.",
  // C5 — Hipertensão Arterial: PA aferida em consulta (meta 50%)
  C5: "Técnico/enfermeiro registra PA em TODA consulta de hipertenso hoje no PEC. Meta: pelo menos 1 aferição documentada nos últimos 12 meses.",
  // C6 — Pessoa Idosa: consulta realizada (meta 60%)
  C6: "Identificar idosos (≥ 60 anos) na agenda. Lançar tipo de atendimento correto no PEC. ACS: busca ativa de idosos sem consulta no quadrimestre.",
  // C7 — Prevenção Câncer Colo: citopatológico válido (meta 40%)
  C7: "Identificar mulheres 25–64 anos na agenda sem citopatológico válido. Oferecer coleta hoje. Lançar resultado quando disponível no PEC.",
  B1: "Agendar pacientes sem 1ª consulta odonto. Busca ativa via ACS.",
  B2: "Revisar tratamentos em andamento no PEC e finalizar registros de conclusão.",
  B3: "Verificar protocolo de urgência odonto disponível. Registrar atendimentos do dia.",
  B4: "Confirmar que gestantes têm consulta odonto agendada no pré-natal.",
  B5: "Registrar atividade coletiva de escovação no PEC como atividade coletiva.",
  B6: "Agendar supervisão de escovação nas escolas. Registrar no PEC.",
  M1: "Identificar e lançar no PEC casos de saúde mental acompanhados pelo eMulti hoje.",
  M2: "Lançar atendimentos de reabilitação com INE correto no PEC.",
};

const ACOES_MENSAIS: Record<string,string> = {
  C1: "Auditar relatório do e-Gestor AB: quantas consultas foram computadas? Identificar equipes com baixo acesso e planejar mutirão de consultas no próximo mês.",
  C2: "Revisar lista de crianças < 5 anos vinculadas: todas com consulta no quadrimestre? ACS: busca ativa dos faltosos. Planejar Dia D de puericultura se necessário.",
  C3: "Auditar pré-natais do mês: todas com ≥ 6 consultas e exames obrigatórios lançados? Cruzar lista de gestantes ativas com resultados no PEC.",
  C4: "Gerar relatório de diabéticos sem HbA1c nos últimos 12 meses. Agendar consultas prioritárias. Meta mensal: zerar fila de pendentes.",
  C5: "Reunião de equipe: revisar lista de hipertensos sem PA documentada no quadrimestre. Planejar Dia D de aferição para os faltosos.",
  C6: "Auditoria de idosos (≥ 60 anos): todos com consulta no quadrimestre? Cruzar com cadastro SISAB. ACS: visita domiciliar aos acamados.",
  C7: "Realizar Dia D de citopatológico. Convocar mulheres 25–64 sem exame válido. Verificar envio de lâminas ao laboratório e lançamento de resultados no PEC.",
  B1: "Auditoria mensal: quantos pacientes sem 1ª consulta odonto? Busca ativa focada.",
  B2: "Fechar todos os tratamentos em andamento há mais de 30 dias. Registrar no PEC.",
  B3: "Revisar atendimentos de urgência odonto do mês — todos registrados corretamente?",
  B4: "Toda gestante nova no mês deve ter consulta odonto agendada. Verificar.",
  B5: "Agendar 2 atividades coletivas de escovação para o próximo mês.",
  B6: "Calendário mensal de supervisão nas escolas. Pelo menos 2 visitas/mês.",
  M1: "Reunião mensal do eMulti: revisar casos de saúde mental e garantir lançamento no PEC.",
  M2: "Auditar atendimentos de reabilitação — todos com INE correto registrado.",
};

function calcScore(eq: Equipe) {
  let quali = 0;
  const gaps: { ind: string; desc: string; atual: number; pts: number; peso: number; meta: number }[] = [];

  const calcGrupo = (keys: string[], pesos: Record<string,number>, descs: Record<string,string>, metas?: Record<string,number>) => {
    keys.forEach(k => {
      const val = (eq as any)[k] as number;
      const peso = pesos[k];
      const meta = metas?.[k] ?? 80;
      quali += (val / 100) * peso;
      if (val < meta) gaps.push({ ind: k.toUpperCase(), desc: descs[k], atual: val, pts: Math.round((meta - val) / 100 * peso * 10) / 10, peso, meta });
    });
  };

  if (eq.tipo === "eSF" || eq.tipo === "eAP" || eq.tipo === "eRibeirinha")
    calcGrupo(["c1","c2","c3","c4","c5","c6","c7"], PESO_C, DESC_C, META_C);
  else if (eq.tipo === "eSB")
    calcGrupo(["b1","b2","b3","b4","b5","b6"], PESO_B, DESC_B);
  else if (eq.tipo === "eMulti")
    calcGrupo(["m1","m2"], PESO_M, DESC_M);

  gaps.sort((a, b) => b.pts - a.pts);
  const total = quali * 0.7 + eq.va * 0.2 + eq.impl * 0.1;
  return { total: Math.round(total * 10) / 10, quali: Math.round(quali * 10) / 10, gaps };
}

function classificar(pts: number) {
  if (pts >= 75) return { label: "ÓTIMO", cor: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" };
  if (pts >= 60) return { label: "BOM", cor: "#d97706", bg: "#fef3c7", border: "#fde68a" };
  if (pts >= 50) return { label: "SUFICIENTE", cor: "#ea580c", bg: "#fff7ed", border: "#fed7aa" };
  return { label: "REGULAR", cor: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
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

// Barra de progresso visual
function ProgressBar({ valor, meta = 80 }: { valor: number; meta?: number }) {
  const cor = valor >= meta ? "#16a34a" : valor >= 60 ? "#d97706" : "#dc2626";
  return (
    <div style={{ height: 6, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, valor)}%`, background: cor, borderRadius: 4, transition: "width 0.3s" }} />
    </div>
  );
}

// ── Análise DIÁRIA ────────────────────────────────────────────────────────────
function AnaliseDiaria({ equipes }: { equipes: Equipe[] }) {
  const [checked, setChecked] = useState<Record<string,boolean>>({});
  const toggle = (k: string) => setChecked(p => ({ ...p, [k]: !p[k] }));

  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ background: "#dbeafe", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <Clock size={16} color="#1d4ed8" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1d4ed8" }}>Agenda do dia — {hoje}</span>
        </div>
        <span style={{ fontSize: 12, color: "#6b7280" }}>Ações prioritárias para hoje por equipe</span>
      </div>

      {equipes.map(eq => {
        const { gaps } = calcScore(eq);
        const cl = classificar(calcScore(eq).total);
        const acoesPendentes = gaps.slice(0, 4); // top 4 gaps

        return (
          <div key={eq.id} style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, marginBottom: 14, overflow: "hidden" }}>
            {/* Cabeçalho equipe */}
            <div style={{ background: "linear-gradient(90deg,#f8faff,#fff)", borderBottom: "1px solid #e4e7ec", padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: "#1351b4", color: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>{eq.tipo}</div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{eq.nome || "(sem nome)"}</span>
              {eq.ine && <span style={{ fontSize: 11, color: "#9ca3af" }}>INE: {eq.ine}</span>}
              <div style={{ marginLeft: "auto", background: cl.bg, border: `1px solid ${cl.border}`, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700, color: cl.cor }}>{cl.label}</div>
            </div>

            {/* Lista de ações */}
            <div style={{ padding: "14px 18px" }}>
              {acoesPendentes.length === 0 ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#16a34a", fontSize: 13 }}>
                  <CheckCircle size={16} />
                  <span>Todos os indicadores ≥ 80% — manter protocolo atual!</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {acoesPendentes.map(g => {
                    const key = `${eq.id}-${g.ind}`;
                    const done = checked[key];
                    return (
                      <div key={g.ind}
                        onClick={() => toggle(key)}
                        style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 14px", borderRadius: 8, background: done ? "#f0fdf4" : "#f9fafb", border: `1px solid ${done ? "#bbf7d0" : "#e5e7eb"}`, cursor: "pointer", transition: "all 0.15s" }}>
                        <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${done ? "#16a34a" : "#d1d5db"}`, background: done ? "#16a34a" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                          {done && <CheckCircle size={12} color="#fff" />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                            <span style={{ background: "#fef3c7", color: "#d97706", borderRadius: 5, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>{g.ind}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: done ? "#6b7280" : "#111827", textDecoration: done ? "line-through" : "none" }}>{g.desc}</span>
                            <span style={{ fontSize: 11, color: "#dc2626", marginLeft: "auto" }}>+{g.pts} pts potenciais</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>{ACOES_DIARIAS[g.ind]}</div>
                          <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 10, color: "#9ca3af" }}>Atual: {g.atual}%</span>
                            <div style={{ flex: 1 }}><ProgressBar valor={g.atual} meta={g.meta} /></div>
                            <span style={{ fontSize: 10, color: "#6b7280" }}>Meta: {g.meta}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {gaps.length > 4 && (
                <div style={{ marginTop: 8, fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
                  + {gaps.length - 4} outros indicadores com gap · ver análise quadrimestral completa
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Análise MENSAL ────────────────────────────────────────────────────────────
function AnaliseMensal({ equipes }: { equipes: Equipe[] }) {
  const agora = new Date();
  const diasNoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
  const diaAtual = agora.getDate();
  const diasRestantes = diasNoMes - diaAtual;
  const pctMes = Math.round((diaAtual / diasNoMes) * 100);

  const mes = agora.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div>
      {/* Barra do mês */}
      <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "14px 18px", marginBottom: 18, display: "flex", gap: 24, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Mês atual</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", textTransform: "capitalize" }}>{mes}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
            <span>Dia {diaAtual} de {diasNoMes}</span>
            <span style={{ color: diasRestantes <= 5 ? "#dc2626" : "#6b7280", fontWeight: diasRestantes <= 5 ? 700 : 400 }}>{diasRestantes} dias restantes</span>
          </div>
          <ProgressBar valor={pctMes} meta={100} />
        </div>
        <div style={{ background: diasRestantes <= 5 ? "#fef2f2" : "#f0fdf4", border: `1px solid ${diasRestantes <= 5 ? "#fecaca" : "#bbf7d0"}`, borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: diasRestantes <= 5 ? "#dc2626" : "#16a34a" }}>{diasRestantes}d</div>
          <div style={{ fontSize: 10, color: "#6b7280" }}>restantes</div>
        </div>
      </div>

      {equipes.map(eq => {
        const { gaps, total } = calcScore(eq);
        const cl = classificar(total);

        // Todos os indicadores desta equipe
        const todasChaves = eq.tipo === "eSB"
          ? ["b1","b2","b3","b4","b5","b6"]
          : eq.tipo === "eMulti"
            ? ["m1","m2"]
            : ["c1","c2","c3","c4","c5","c6","c7"];
        const descs = eq.tipo === "eSB" ? DESC_B : eq.tipo === "eMulti" ? DESC_M : DESC_C;

        return (
          <div key={eq.id} style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ borderBottom: "1px solid #e4e7ec", padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: "#1351b4", color: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>{eq.tipo}</div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{eq.nome || "(sem nome)"}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: cl.cor }}>{total}</span>
                <span style={{ fontSize: 11, background: cl.bg, color: cl.cor, borderRadius: 20, padding: "3px 12px", fontWeight: 700, border: `1px solid ${cl.border}` }}>{cl.label}</span>
              </div>
            </div>

            <div style={{ padding: "16px 18px" }}>
              {/* Indicadores com meta mensal */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12, marginBottom: 16 }}>
                {todasChaves.map(k => {
                  const val = (eq as any)[k] as number;
                  const gap = 80 - val;
                  const ptsGanho = gap > 0 ? Math.round(gap / 100 * (eq.tipo === "eSB" ? PESO_B[k] : eq.tipo === "eMulti" ? PESO_M[k] : PESO_C[k]) * 10) / 10 : 0;
                  const cor = val >= 80 ? "#16a34a" : val >= 60 ? "#d97706" : "#dc2626";

                  return (
                    <div key={k} style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px", border: `1px solid ${val >= 80 ? "#bbf7d0" : "#e5e7eb"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#1351b4", marginRight: 6 }}>{k.toUpperCase()}</span>
                          <span style={{ fontSize: 11, color: "#374151" }}>{descs[k]}</span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{val}%</span>
                      </div>
                      <ProgressBar valor={val} />
                      <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af" }}>
                        <span>{val >= 80 ? "✅ Meta atingida" : `Precisa +${gap}% para atingir 80%`}</span>
                        {gap > 0 && <span style={{ color: "#dc2626", fontWeight: 600 }}>+{ptsGanho} pts em jogo</span>}
                      </div>
                      {gap > 0 && (
                        <div style={{ marginTop: 6, fontSize: 10, color: "#6b7280", background: "#fff3cd", padding: "4px 8px", borderRadius: 4 }}>
                          {ACOES_MENSAIS[k.toUpperCase()]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* VA e Implantação */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { k: "va", label: "Vínculo e Acompanhamento", val: eq.va },
                  { k: "impl", label: "Implantação", val: eq.impl },
                ].map(({ k, label, val }) => (
                  <div key={k} style={{ background: "#f0f4ff", borderRadius: 8, padding: "10px 12px", border: "1px solid #c7d2fe" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: "#374151" }}>{label}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: val >= 80 ? "#16a34a" : "#d97706" }}>{val}%</span>
                    </div>
                    <ProgressBar valor={val} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Análise QUADRIMESTRAL ─────────────────────────────────────────────────────
function AnaliseQuadrimestral({ equipes, municipio, quadrimestre, imprimir }: {
  equipes: Equipe[]; municipio: { nome: string; uf: string; codigo: string };
  quadrimestre: string; imprimir: () => void;
}) {
  const resultados = equipes.map(eq => ({ eq, ...calcScore(eq) }));
  const otimo = resultados.filter(r => r.total >= 75).length;
  const bom = resultados.filter(r => r.total >= 60 && r.total < 75).length;
  const risco = resultados.filter(r => r.total < 60).length;
  const mediaGeral = resultados.length
    ? Math.round(resultados.reduce((a, r) => a + r.total, 0) / resultados.length * 10) / 10
    : 0;
  const clMedia = classificar(mediaGeral);

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Média Geral", valor: mediaGeral, cor: clMedia.cor, bg: clMedia.bg, border: clMedia.border, big: true },
          { label: "ÓTIMO ≥75", valor: otimo, cor: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", big: false },
          { label: "BOM 60–74", valor: bom, cor: "#d97706", bg: "#fef3c7", border: "#fde68a", big: false },
          { label: "Risco <60", valor: risco, cor: "#dc2626", bg: "#fef2f2", border: "#fecaca", big: false },
          { label: "Equipes", valor: equipes.length, cor: "#1351b4", bg: "#eff6ff", border: "#bfdbfe", big: false },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: k.big ? 32 : 26, fontWeight: 800, color: k.cor, lineHeight: 1 }}>{k.valor}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Barra geral */}
      <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "14px 18px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 600, color: "#111827" }}>
          <span>Progresso geral do município — {municipio.nome}/{municipio.uf} · {quadrimestre}</span>
          <span style={{ color: clMedia.cor }}>{mediaGeral}/100 pts</span>
        </div>
        <ProgressBar valor={mediaGeral} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#9ca3af" }}>
          <span>0</span>
          <span>50 — Suficiente</span>
          <span>60 — Bom</span>
          <span>75 — Ótimo</span>
          <span>100</span>
        </div>
      </div>

      {/* Tabela de equipes */}
      <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #e4e7ec", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Ranking de Equipes — {quadrimestre}</span>
          <button onClick={imprimir} style={{ display: "flex", alignItems: "center", gap: 6, background: "#1351b4", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Printer size={13} /> Imprimir / PDF
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["#","Equipe","Tipo","Score","Classificação","Falta p/ ÓTIMO","Maior Gap","Ação Prioritária"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, color: "#6b7280", fontWeight: 600, borderBottom: "2px solid #e4e7ec", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...resultados].sort((a, b) => b.total - a.total).map((r, i) => {
                const cl = classificar(r.total);
                const gap = r.gaps[0];
                return (
                  <tr key={r.eq.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: i === 0 ? "#d97706" : "#9ca3af" }}>{i + 1}º</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#111827" }}>{r.eq.nome || "(sem nome)"}</td>
                    <td style={{ padding: "10px 12px" }}><span style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{r.eq.tipo}</span></td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: cl.cor }}>{r.total}</span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: cl.bg, color: cl.cor, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700, border: `1px solid ${cl.border}` }}>{cl.label}</span>
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: r.total >= 75 ? "#16a34a" : "#dc2626" }}>
                      {r.total >= 75 ? "✅ Atingido" : `+${(75 - r.total).toFixed(1)} pts`}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {gap ? <span style={{ background: "#fef3c7", color: "#d97706", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{gap.ind} ({gap.atual}%)</span> : <span style={{ color: "#16a34a" }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 11, color: "#6b7280", maxWidth: 240 }}>
                      {gap ? ACOES_DIARIAS[gap.ind] || "—" : "Manter protocolo"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gaps por equipe */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Plano de Ação por Equipe</div>
      {[...resultados].filter(r => r.gaps.length > 0).sort((a, b) => a.total - b.total).map(r => {
        const cl = classificar(r.total);
        return (
          <div key={r.eq.id} style={{ background: "#fff", border: "1px solid #e4e7ec", borderLeft: `4px solid ${cl.cor}`, borderRadius: 10, marginBottom: 12 }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{r.eq.nome || "(sem nome)"}</span>
                <span style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{r.eq.tipo}</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: cl.cor }}>{r.total} pts</span>
                <span style={{ background: cl.bg, color: cl.cor, border: `1px solid ${cl.border}`, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>{cl.label}</span>
                {r.total < 75 && <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>faltam +{(75 - r.total).toFixed(1)} pts</span>}
              </div>
            </div>
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {r.gaps.map(g => (
                <div key={g.ind} style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 14px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 44, textAlign: "center", background: "#fef3c7", borderRadius: 6, padding: "4px 0" }}>
                    <div style={{ fontWeight: 800, color: "#d97706", fontSize: 13 }}>{g.ind}</div>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>{g.atual}%</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", marginBottom: 4 }}>{g.desc}</div>
                    <ProgressBar valor={g.atual} />
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 5 }}>{ACOES_MENSAIS[g.ind]}</div>
                  </div>
                  <div style={{ minWidth: 50, textAlign: "center", background: "#f0fdf4", borderRadius: 8, padding: "6px 8px", border: "1px solid #bbf7d0" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>+{g.pts}</div>
                    <div style={{ fontSize: 9, color: "#6b7280" }}>pts</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {resultados.filter(r => r.total >= 75).length > 0 && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 18px", marginTop: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <Award size={16} color="#16a34a" />
            <span style={{ fontWeight: 700, color: "#16a34a", fontSize: 13 }}>Equipes em ÓTIMO — Parabéns! Manter protocolo</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {resultados.filter(r => r.total >= 75).map(r => (
              <span key={r.eq.id} style={{ background: "#16a34a", color: "#fff", borderRadius: 20, padding: "4px 16px", fontSize: 12, fontWeight: 600 }}>
                {r.eq.nome || "(sem nome)"} · {r.total} pts
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 11, color: "#9ca3af", textAlign: "center", padding: "12px 0", borderTop: "1px solid #e4e7ec" }}>
        ERSUS360 · Análise gerada com scores informados via e-Gestor AB · Portaria GM/MS 3.493/2024
      </div>
    </div>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────
export default function AnaliseMunicipio() {
  const [etapa, setEtapa] = useState<"municipio" | "equipes" | "analise">("municipio");
  const [horizonteAtivo, setHorizonteAtivo] = useState<HorizonteAnalise>("quadrimestral");
  const [municipio, setMunicipio] = useState<Municipio>({ codigo: "", nome: "", uf: "AM" });
  const [quadrimestre, setQuadrimestre] = useState("Q2/2026");
  const [equipes, setEquipes] = useState<Equipe[]>([novaEquipe()]);
  const [expandido, setExpandido] = useState<Record<string, boolean>>({});

  function addEquipe() { setEquipes(p => [...p, novaEquipe()]); }
  function removeEquipe(id: string) { setEquipes(p => p.filter(e => e.id !== id)); }
  function updateEquipe(id: string, campo: keyof Equipe, valor: string | number) {
    setEquipes(p => p.map(e => e.id === id ? { ...e, [campo]: valor } : e));
  }
  function toggleExp(id: string) { setExpandido(p => ({ ...p, [id]: !p[id] })); }

  const resultados = equipes.map(eq => ({ eq, ...calcScore(eq) }));
  const mediaGeral = resultados.length
    ? Math.round(resultados.reduce((a, r) => a + r.total, 0) / resultados.length * 10) / 10
    : 0;

  function imprimir() {
    const w = window.open("", "_blank", "width=1000,height=700");
    if (!w) { alert("Permita popups para imprimir."); return; }
    const rows = resultados.map(r => {
      const cl = classificar(r.total);
      const gap = r.gaps[0];
      return `<tr>
        <td>${r.eq.nome || "(sem nome)"}</td><td>${r.eq.tipo}</td>
        <td style="font-weight:800;color:${cl.cor}">${r.total}</td>
        <td style="color:${cl.cor};font-weight:700">${cl.label}</td>
        <td>${r.total >= 75 ? "✅" : "+" + (75 - r.total).toFixed(1) + " pts"}</td>
        <td>${gap ? gap.ind + " (" + gap.atual + "%)" : "—"}</td>
        <td>${gap ? ACOES_MENSAIS[gap.ind] || "—" : "Manter protocolo"}</td>
      </tr>`;
    }).join("");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8">
    <title>Análise Brasil 360 — ${municipio.nome}/${municipio.uf} · ${quadrimestre}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:20px;color:#111}
      h1{font-size:16px;margin-bottom:4px}h2{font-size:13px;color:#555;margin-bottom:16px;font-weight:normal}
      table{width:100%;border-collapse:collapse;font-size:11px}
      th{background:#1351b4;color:#fff;padding:7px 10px;text-align:left}
      td{padding:6px 10px;border-bottom:1px solid #eee}tr:nth-child(even) td{background:#f9f9f9}
      .kpi{display:inline-block;margin-right:24px;font-size:13px}.kpi b{font-size:22px;display:block}
      @media print{body{padding:0}}
    </style></head><body>
    <h1>Análise Brasil 360 — Componente Qualidade · Portaria GM/MS 3.493/2024</h1>
    <h2>${municipio.nome}/${municipio.uf} · IBGE: ${municipio.codigo || "—"} · Quadrimestre: ${quadrimestre}</h2>
    <div style="margin-bottom:16px">
      <span class="kpi"><b>${mediaGeral}</b>Média Geral</span>
      <span class="kpi"><b style="color:#16a34a">${resultados.filter(r => r.total >= 75).length}</b>ÓTIMO ≥75</span>
      <span class="kpi"><b style="color:#d97706">${resultados.filter(r => r.total >= 60 && r.total < 75).length}</b>BOM 60-74</span>
      <span class="kpi"><b style="color:#dc2626">${resultados.filter(r => r.total < 60).length}</b>Risco &lt;60</span>
    </div>
    <table><thead><tr><th>Equipe</th><th>Tipo</th><th>Score</th><th>Classificação</th><th>Falta p/ Ótimo</th><th>Maior Gap</th><th>Ação do Mês</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p style="font-size:10px;color:#888;margin-top:20px">ERSUS360 · ${new Date().toLocaleString("pt-BR")}</p>
    <script>window.onload=function(){window.print();setTimeout(function(){window.close()},1000)}<\/script>
    </body></html>`);
    w.document.close();
  }

  function IndSlider({ id, campo, label, valor, meta = 80 }: { id: string; campo: keyof Equipe; label: string; valor: number; meta?: number }) {
    const cor = valor >= meta ? "#16a34a" : valor >= meta * 0.75 ? "#d97706" : "#dc2626";
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: cor }}>{valor}%</span>
        </div>
        <input type="range" min={0} max={100} step={1} value={valor}
          onChange={e => updateEquipe(id, campo, Number(e.target.value))}
          style={{ width: "100%", accentColor: cor, height: 4 }} />
        <div style={{ fontSize: 9, color: "#9ca3af", textAlign: "right" as const }}>meta: {meta}%</div>
      </div>
    );
  }

  const INPUT = { background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, color: "#111827", padding: "9px 12px", fontSize: 13, width: "100%", outline: "none" };
  const SELECT = { ...INPUT };
  const BTN_BASE = { padding: "9px 18px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 };

  const HORIZONTES: { id: HorizonteAnalise; label: string; icon: React.ReactNode }[] = [
    { id: "diaria", label: "Agenda Diária", icon: <Clock size={14} /> },
    { id: "mensal", label: "Metas do Mês", icon: <TrendingUp size={14} /> },
    { id: "quadrimestral", label: "Quadrimestral", icon: <BarChart2 size={14} /> },
  ];

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh", color: "#111827" }}>

      {/* Header InvestSUS */}
      <div style={{ background: "linear-gradient(135deg, #1351b4 0%, #0c3d8a 100%)", padding: "20px 28px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: 6 }}>
                <BarChart2 size={18} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>Análise Brasil 360</span>
              <span style={{ background: "rgba(255,255,255,0.15)", color: "#bfdbfe", borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>Componente Qualidade</span>
            </div>
            <div style={{ fontSize: 12, color: "#bfdbfe" }}>
              Portaria GM/MS 3.493/2024 · eSF · eSB · eMulti · eRibeirinha
              {municipio.nome && <span style={{ marginLeft: 8, color: "#93c5fd", fontWeight: 600 }}>· {municipio.nome}/{municipio.uf} · {quadrimestre}</span>}
            </div>
          </div>
          {etapa === "analise" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...BTN_BASE, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }} onClick={() => setEtapa("equipes")}>
                <RefreshCw size={13} /> Editar Equipes
              </button>
            </div>
          )}
        </div>

        {/* Steps */}
        <div style={{ display: "flex", gap: 0 }}>
          {[
            { key: "municipio", label: "1. Município", icon: <Target size={13} /> },
            { key: "equipes", label: "2. Equipes & Scores", icon: <ClipboardCheck size={13} /> },
            { key: "analise", label: "3. Análise", icon: <BarChart2 size={13} /> },
          ].map((t, i) => {
            const ativa = etapa === t.key;
            const habilitada = i === 0 || i === 1 || etapa === "analise";
            return (
              <button key={t.key}
                onClick={() => { if (habilitada) setEtapa(t.key as any); }}
                style={{ padding: "10px 22px", fontSize: 13, fontWeight: ativa ? 700 : 400,
                  border: "none", borderBottom: ativa ? "3px solid #fff" : "3px solid transparent",
                  background: "transparent", color: ativa ? "#fff" : "rgba(255,255,255,0.6)",
                  cursor: habilitada ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 6, marginBottom: -1 }}>
                {t.icon}{t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "24px 28px 60px" }}>

        {/* ETAPA 1 — Município */}
        {etapa === "municipio" && (
          <div style={{ maxWidth: 560 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: "1px solid #e4e7ec" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 20 }}>Identificação do Município</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 5, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Estado (UF)</label>
                  <select style={SELECT} value={municipio.uf} onChange={e => setMunicipio(p => ({ ...p, uf: e.target.value }))}>
                    {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 5, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Código IBGE</label>
                  <input style={INPUT} placeholder="Ex: 1300144" value={municipio.codigo} onChange={e => setMunicipio(p => ({ ...p, codigo: e.target.value }))} />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 5, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Nome do Município</label>
                <input style={INPUT} placeholder="Ex: Apuí" value={municipio.nome} onChange={e => setMunicipio(p => ({ ...p, nome: e.target.value }))} />
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 5, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Quadrimestre de Referência</label>
                <select style={SELECT} value={quadrimestre} onChange={e => setQuadrimestre(e.target.value)}>
                  {["Q1/2025","Q2/2025","Q3/2025","Q1/2026","Q2/2026","Q3/2026"].map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div style={{ background: "#eff6ff", borderRadius: 10, padding: 16, marginBottom: 22, border: "1px solid #bfdbfe" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", marginBottom: 8 }}>📋 Como usar</div>
                <ol style={{ fontSize: 12, color: "#374151", paddingLeft: 18, margin: 0, lineHeight: 2 }}>
                  <li>Acesse o <strong>e-Gestor AB</strong> → SIAPS → Componente Qualidade</li>
                  <li>Selecione o município e o quadrimestre de referência</li>
                  <li>Anote os scores de cada indicador por equipe</li>
                  <li>Volte aqui, preencha os dados e gere a análise em 3 horizontes</li>
                </ol>
              </div>

              <button
                style={{ ...BTN_BASE, background: "#1351b4", color: "#fff", width: "100%", justifyContent: "center", fontSize: 14, padding: "12px 18px", opacity: !municipio.nome ? 0.5 : 1 }}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>{municipio.nome}/{municipio.uf} — {quadrimestre}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Informe os scores de cada indicador conforme e-Gestor AB</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={{ ...BTN_BASE, background: "#fff", color: "#374151", border: "1px solid #d1d5db" }} onClick={addEquipe}>
                  <Plus size={14} /> Adicionar Equipe
                </button>
                <button style={{ ...BTN_BASE, background: "#1351b4", color: "#fff" }}
                  onClick={() => setEtapa("analise")}>
                  Gerar Análise →
                </button>
              </div>
            </div>

            {equipes.map((eq, idx) => {
              const { total } = calcScore(eq);
              const cl = classificar(total);
              const aberto = expandido[eq.id] !== false;
              const indsC = ["c1","c2","c3","c4","c5","c6","c7"] as const;
              const indsB = ["b1","b2","b3","b4","b5","b6"] as const;
              const indsM = ["m1","m2"] as const;

              return (
                <div key={eq.id} style={{ background: "#fff", borderRadius: 12, border: `1px solid ${cl.border}`, marginBottom: 12, overflow: "hidden" }}>
                  {/* Cabeçalho */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: aberto ? "1px solid #f3f4f6" : "none", cursor: "pointer" }}
                    onClick={() => toggleExp(eq.id)}>
                    <span style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, minWidth: 24, textAlign: "center" }}>{idx + 1}</span>
                    <input style={{ ...INPUT, maxWidth: 220, fontWeight: 600 }} placeholder="Nome da equipe"
                      value={eq.nome} onClick={e => e.stopPropagation()} onChange={e => updateEquipe(eq.id, "nome", e.target.value)} />
                    <select style={{ ...SELECT, maxWidth: 130 }} value={eq.tipo}
                      onClick={e => e.stopPropagation()} onChange={e => updateEquipe(eq.id, "tipo", e.target.value as TipoEquipe)}>
                      <option value="eSF">eSF</option>
                      <option value="eAP">eAP</option>
                      <option value="eSB">eSB</option>
                      <option value="eMulti">eMulti</option>
                      <option value="eRibeirinha">eRibeirinha</option>
                    </select>
                    <input style={{ ...INPUT, maxWidth: 120 }} placeholder="INE (opcional)"
                      value={eq.ine} onClick={e => e.stopPropagation()} onChange={e => updateEquipe(eq.id, "ine", e.target.value)} />

                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ textAlign: "center", minWidth: 60 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: cl.cor, lineHeight: 1 }}>{total}</div>
                        <div style={{ fontSize: 10, background: cl.bg, color: cl.cor, borderRadius: 10, padding: "1px 8px", fontWeight: 700 }}>{cl.label}</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); toggleExp(eq.id); }}
                        style={{ background: "#f3f4f6", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#6b7280" }}>
                        {aberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button onClick={e => { e.stopPropagation(); removeEquipe(eq.id); }}
                        style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: "#dc2626" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {aberto && (
                    <div style={{ padding: "16px 18px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                        <IndSlider id={eq.id} campo="va" label="Vínculo e Acompanhamento (%)" valor={eq.va} />
                        <IndSlider id={eq.id} campo="impl" label="Implantação (%)" valor={eq.impl} />
                      </div>

                      <div style={{ fontSize: 10, fontWeight: 700, color: "#1351b4", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 12 }}>
                        Componente Qualidade — {eq.tipo === "eSB" ? "Grupo B (eSB)" : eq.tipo === "eMulti" ? "Grupo M (eMulti)" : "Grupo C (eSF/eAP)"}
                      </div>

                      {(eq.tipo === "eSF" || eq.tipo === "eAP" || eq.tipo === "eRibeirinha") && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
                          {indsC.map(k => <IndSlider key={k} id={eq.id} campo={k} label={`${k.toUpperCase()} — ${DESC_C[k]}`} valor={eq[k]} meta={META_C[k]} />)}
                        </div>
                      )}
                      {eq.tipo === "eSB" && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
                          {indsB.map(k => <IndSlider key={k} id={eq.id} campo={k} label={`${k.toUpperCase()} — ${DESC_B[k]}`} valor={eq[k]} />)}
                        </div>
                      )}
                      {eq.tipo === "eMulti" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                          {indsM.map(k => <IndSlider key={k} id={eq.id} campo={k} label={`${k.toUpperCase()} — ${DESC_M[k]}`} valor={eq[k]} />)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <button style={{ ...BTN_BASE, background: "#fff", color: "#6b7280", border: "1px dashed #d1d5db", width: "100%", justifyContent: "center", marginTop: 4 }} onClick={addEquipe}>
              <Plus size={14} /> Adicionar outra equipe
            </button>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button style={{ ...BTN_BASE, background: "#1351b4", color: "#fff", padding: "12px 28px", fontSize: 14 }}
                onClick={() => setEtapa("analise")}>
                Gerar Análise →
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 3 — Análise */}
        {etapa === "analise" && (
          <div>
            {/* Seletor de horizonte */}
            <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
              {HORIZONTES.map(h => (
                <button key={h.id} onClick={() => setHorizonteAtivo(h.id)}
                  style={{ ...BTN_BASE, padding: "10px 20px", fontSize: 13,
                    background: horizonteAtivo === h.id ? "#1351b4" : "#fff",
                    color: horizonteAtivo === h.id ? "#fff" : "#374151",
                    border: horizonteAtivo === h.id ? "1px solid #1351b4" : "1px solid #d1d5db",
                    fontWeight: horizonteAtivo === h.id ? 700 : 500 }}>
                  {h.icon} {h.label}
                </button>
              ))}
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 8, padding: "8px 14px", fontSize: 12 }}>
                  <span style={{ color: "#6b7280" }}>{municipio.nome}/{municipio.uf}</span>
                  <span style={{ color: "#d1d5db", margin: "0 8px" }}>·</span>
                  <span style={{ color: "#1351b4", fontWeight: 700 }}>{quadrimestre}</span>
                  <span style={{ color: "#d1d5db", margin: "0 8px" }}>·</span>
                  <span style={{ fontWeight: 700, color: classificar(mediaGeral).cor }}>{mediaGeral} pts</span>
                </div>
              </div>
            </div>

            {horizonteAtivo === "diaria" && <AnaliseDiaria equipes={equipes} />}
            {horizonteAtivo === "mensal" && <AnaliseMensal equipes={equipes} />}
            {horizonteAtivo === "quadrimestral" && (
              <AnaliseQuadrimestral
                equipes={equipes}
                municipio={municipio}
                quadrimestre={quadrimestre}
                imprimir={imprimir}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
