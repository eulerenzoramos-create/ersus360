// INVESTSUS 360 — Tetos municipais de emendas (PAP/MAC), limites de programas do MS e
// capacidade de recebimento. Fontes: planilhas oficiais do FNS (lidas pelo backend) e a tela
// Limites do InvestSUS (valor transcrito pelo usuário ou arquivo importado — nunca acesso
// automatizado). Nada é estimado: sem fonte, "não disponível". Saldo = teto oficial −
// comprometido (um estágio por proposta). Saldo só é "validado" quando confere com o InvestSUS.
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  RefreshCw, ExternalLink, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  Clock, Info, Landmark, Users, ClipboardList, X, Download, Upload, FileText, ShieldCheck,
} from "lucide-react";

const fmt = (v: number | null | undefined) =>
  v == null ? "Não disponível" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number | null | undefined) => (v == null ? "—" : `${v.toFixed(1)}%`);
const fmtData = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v.length === 10 ? `${v}T12:00:00` : v.endsWith("Z") || v.includes("+") ? v : `${v}Z`);
  return isNaN(d.getTime()) ? v : d.toLocaleString("pt-BR", v.length === 10 ? { dateStyle: "short" } : { dateStyle: "short", timeStyle: "short" });
};
// "10.209.109,00" | "10209109" | "10209109.5" → número
const lerReais = (s: string): number | null => {
  const t = (s ?? "").replace(/[R$\s]/g, "");
  if (!t) return null;
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  return isFinite(n) ? n : null;
};

const SITUACAO: Record<string, { label: string; cor: string; bg: string; icone: React.ReactNode }> = {
  validado:           { label: "Validado",               cor: "#047857", bg: "#ecfdf5", icone: <ShieldCheck size={12} /> },
  confirmado:         { label: "Planilha FNS lida",      cor: "#1d4ed8", bg: "#eff6ff", icone: <CheckCircle2 size={12} /> },
  pendente_validacao: { label: "Pendente de validação",  cor: "#b45309", bg: "#fffbeb", icone: <Clock size={12} /> },
  divergente:         { label: "Divergente",             cor: "#b91c1c", bg: "#fef2f2", icone: <AlertTriangle size={12} /> },
  nao_disponivel:     { label: "Não disponível",         cor: "#6b7280", bg: "#f3f4f6", icone: <Info size={12} /> },
};
// Semáforo do teto: a cor sempre vem acompanhada do texto da situação.
const SEMAFORO: Record<string, { cor: string; bg: string; barra: string }> = {
  verde:    { cor: "#047857", bg: "#ecfdf5", barra: "#10b981" },
  amarelo:  { cor: "#b45309", bg: "#fffbeb", barra: "#f59e0b" },
  vermelho: { cor: "#b91c1c", bg: "#fef2f2", barra: "#dc2626" },
  cinza:    { cor: "#4b5563", bg: "#f3f4f6", barra: "#9ca3af" },
};
const NIVEL: Record<string, { label: string; cor: string }> = {
  critico: { label: "Crítico", cor: "#dc2626" }, urgente: { label: "Urgente", cor: "#ea580c" },
  atencao: { label: "Atenção", cor: "#d97706" }, informativo: { label: "Informativo", cor: "#6366f1" },
};

const MOD_ROTULO: Record<string, string> = { rp6: "RP 6", rp7: "RP 7 — Bancada", rp8: "RP 8 — Comissão", programa: "Programa", a_classificar: "A classificar" };
const ESTAGIO_ROTULO: Record<string, string> = { aprovado: "Aprovado", proposta: "Valor da proposta", indicado: "Indicado (sem proposta aprovada)", sem_valor: "Sem valor" };
const PAGAMENTO_ROTULO: Record<string, string> = { pago: "Pago", parcial: "Pago parcialmente", aprovado_nao_pago: "Aprovada, não paga", sem_aprovacao: "Sem aprovação" };
const FASE_ROTULO: Record<string, string> = {
  a_cadastrar: "Disponível / a cadastrar", cadastrada: "Cadastrada", enviada: "Enviada", em_analise: "Em análise",
  em_diligencia: "Em diligência", em_reanalise: "Em reanálise", aprovada: "Aprovada", rejeitada: "Rejeitada",
  cancelada: "Cancelada", empenhada: "Empenhada", paga: "Paga", em_execucao: "Em execução", concluida: "Concluída",
};

const card: React.CSSProperties = { background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16 };
const rotulo: React.CSSProperties = { fontSize: 11, color: "#6b7280", fontWeight: 600 };
const inp: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 8px", fontSize: 12.5, boxSizing: "border-box", width: "100%" };
const btn = (cor?: string): React.CSSProperties => ({ padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: cor ?? "#f3f4f6", color: cor ? "#fff" : "#374151", display: "inline-flex", alignItems: "center", gap: 5 });
const th: React.CSSProperties = { padding: "6px 8px", textAlign: "left", fontWeight: 700, color: "#4b5563", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "6px 8px", color: "#111827", verticalAlign: "top" };
const tdNum: React.CSSProperties = { ...td, textAlign: "right", whiteSpace: "nowrap" };

async function baixar(url: string, nome: string) {
  const r = await api.get(url, { responseType: "blob", timeout: 120_000 });
  const u = URL.createObjectURL(r.data);
  const a = document.createElement("a"); a.href = u; a.download = nome; a.click(); URL.revokeObjectURL(u);
}

export function Selo({ situacao, prefixo }: { situacao: string; prefixo?: string }) {
  const s = SITUACAO[situacao] ?? SITUACAO.nao_disponivel;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: s.bg, color: s.cor, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {s.icone} {prefixo ? `${prefixo}: ` : ""}{s.label}
    </span>
  );
}

export function Semaforo({ s }: { s?: { cor: string; texto: string } }) {
  const c = SEMAFORO[s?.cor ?? "cinza"] ?? SEMAFORO.cinza;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: c.bg, color: c.cor, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      <span aria-hidden style={{ width: 8, height: 8, borderRadius: 99, background: c.barra }} />
      {s?.texto ?? "Sem teto oficial registrado"}
    </span>
  );
}

function Barra({ perc, cor }: { perc: number | null | undefined; cor?: string }) {
  const c = SEMAFORO[cor ?? "cinza"] ?? SEMAFORO.cinza;
  const w = Math.min(100, Math.max(0, perc ?? 0));
  return (
    <div role="progressbar" aria-valuenow={perc ?? 0} aria-valuemin={0} aria-valuemax={100}
      style={{ height: 8, background: "#e5e7eb", borderRadius: 99, overflow: "hidden", minWidth: 80 }}>
      <div style={{ width: `${w}%`, height: "100%", background: c.barra }} />
    </div>
  );
}

function Linha({ k, v, forte, cor }: { k: string; v: React.ReactNode; forte?: boolean; cor?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "4px 0", fontSize: 12.5 }}>
      <span style={{ color: "#4b5563" }}>{k}</span>
      <span style={{ fontWeight: forte ? 800 : 600, color: cor ?? "#111827", textAlign: "right" }}>{v}</span>
    </div>
  );
}

// ── Alertas dos tetos ─────────────────────────────────────────────────────────
export function AlertasTetos({ alertas, max }: { alertas: any[]; max?: number }) {
  const [todos, setTodos] = useState(false);
  if (!alertas?.length) return null;
  const lista = todos || !max ? alertas : alertas.slice(0, max);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {lista.map((a: any, i: number) => {
        const n = NIVEL[a.nivel] ?? NIVEL.atencao;
        return (
          <div key={`${a.tipo}-${a.categoria}-${i}`} style={{ borderLeft: `4px solid ${n.cor}`, background: `${n.cor}0d`, borderRadius: 6, padding: "7px 10px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>
              <span style={{ color: n.cor, marginRight: 6 }}>{n.label}</span>{a.titulo}
            </div>
            <div style={{ fontSize: 11.5, color: "#374151" }}>{a.mensagem}</div>
          </div>
        );
      })}
      {max && alertas.length > max && (
        <button onClick={() => setTodos(v => !v)} style={{ ...btn(), alignSelf: "flex-start", fontSize: 11 }}>
          {todos ? "Mostrar menos" : `Ver todos os ${alertas.length} alertas`}
        </button>
      )}
    </div>
  );
}

// ── Quadro de controle (Painel de Propostas) ──────────────────────────────────
const MODALIDADES_FILTRO: Record<string, string[]> = { rp6: ["individual"], rp7: ["coletiva"], rp8: ["coletiva"] };

export function QuadroControleTetos({ tetos, onAbrirMemoria }: { tetos: any; onAbrirMemoria?: (categoria: string) => void }) {
  const [detalhada, setDetalhada] = useState(false);
  const [modalidade, setModalidade] = useState("");
  const [componente, setComponente] = useState("");
  const [validacao, setValidacao] = useState("");
  const [programa, setPrograma] = useState("");
  if (!tetos) return <div style={{ ...card, marginBottom: 14, color: "#9ca3af", fontSize: 12 }}>Carregando tetos...</div>;

  const cards: any[] = tetos.cards ?? [];
  const progs: any[] = tetos.programacao?.programas ?? [];
  const passa = (c: any) =>
    (!modalidade || (MODALIDADES_FILTRO[modalidade] ?? []).includes(c.grupo)) &&
    (!componente || c.componente === componente) &&
    (!validacao || c.validacao?.saldo === validacao);
  const linhas = cards.filter(passa);
  const progsVis = progs.filter(g => (!programa || (g.categoria ?? g.programa) === programa) && (!validacao || g.validacao?.saldo === validacao));
  const algumFiltro = modalidade || componente || validacao || programa;
  const mun = tetos.municipio;

  const celSaldo = (c: any, saldo: number | null, cat: string) => (
    <button onClick={() => onAbrirMemoria?.(cat)} title="Abrir a memória de cálculo"
      style={{ border: "none", background: "none", padding: 0, cursor: onAbrirMemoria ? "pointer" : "default", fontWeight: 800, fontSize: 13,
        color: saldo == null ? "#9ca3af" : c.semaforo?.cor === "vermelho" ? "#b91c1c" : "#047857", textDecoration: onAbrirMemoria ? "underline dotted" : "none" }}>
      {saldo == null ? "Não disponível" : fmt(saldo)}
    </button>
  );

  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Saldo disponível nos tetos PAP e MAC — {tetos.exercicio}</div>
        <span style={{ fontSize: 11, color: "#6b7280" }}>
          {mun ? `${mun.nome}/${mun.uf} · IBGE ${mun.ibge} · ` : ""}Saldo = teto oficial − comprometido (custeio Incremento Temporário)
        </span>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 10, fontSize: 12 }}>
        <select aria-label="Modalidade" style={{ ...inp, width: "auto" }} value={modalidade} onChange={e => setModalidade(e.target.value)}>
          <option value="">RP 6, RP 7 e RP 8</option><option value="rp6">RP 6 — individuais</option>
          <option value="rp7">RP 7 — bancada</option><option value="rp8">RP 8 — comissão</option>
        </select>
        <select aria-label="Componente" style={{ ...inp, width: "auto" }} value={componente} onChange={e => setComponente(e.target.value)}>
          <option value="">PAP e MAC</option><option value="pap">PAP</option><option value="mac">MAC</option>
        </select>
        <select aria-label="Validação" style={{ ...inp, width: "auto" }} value={validacao} onChange={e => setValidacao(e.target.value)}>
          <option value="">Qualquer validação</option>
          {["validado", "pendente_validacao", "divergente", "nao_disponivel"].map(v => <option key={v} value={v}>{SITUACAO[v].label}</option>)}
        </select>
        <select aria-label="Tipo de programa" style={{ ...inp, width: "auto" }} value={programa} onChange={e => setPrograma(e.target.value)}>
          <option value="">Todos os programas</option>
          {progs.map(g => <option key={g.categoria ?? g.programa} value={g.categoria ?? g.programa}>{g.programa}</option>)}
        </select>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#374151" }}>
          <input type="checkbox" checked={detalhada} onChange={e => setDetalhada(e.target.checked)} /> Visão detalhada
        </label>
        {algumFiltro && <button style={{ ...btn(), fontSize: 11 }} onClick={() => { setModalidade(""); setComponente(""); setValidacao(""); setPrograma(""); }}><X size={11} /> Limpar</button>}
      </div>
      {(modalidade === "rp7" || modalidade === "rp8") && (
        <div style={{ fontSize: 11.5, color: "#1e3a5f", background: "#eff6ff", borderRadius: 6, padding: "6px 10px", marginBottom: 8 }}>
          RP 7 e RP 8 dividem um único teto: o saldo abaixo é do teto compartilhado; a linha destacada mostra só a parte {modalidade === "rp7" ? "da bancada" : "da comissão"}.
        </div>
      )}

      {/* A e B — emendas */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ ...th, minWidth: 190 }}>Controle</th>
              <th style={{ ...th, textAlign: "right" }}>Teto oficial</th>
              {detalhada && <><th style={{ ...th, textAlign: "right" }}>Indicado</th><th style={{ ...th, textAlign: "right" }}>Cadastrado</th></>}
              <th style={{ ...th, textAlign: "right" }}>Comprometido</th>
              {detalhada && <><th style={{ ...th, textAlign: "right" }}>Aprovado</th><th style={{ ...th, textAlign: "right" }}>Pago</th></>}
              <th style={{ ...th, textAlign: "right" }}>Saldo p/ novas propostas</th>
              <th style={{ ...th, minWidth: 130 }}>Utilização</th>
              <th style={th}>Situação</th>
              <th style={th}>Validação</th>
            </tr>
          </thead>
          <tbody>
            {!linhas.length && <tr><td style={{ ...td, color: "#9ca3af" }} colSpan={11}>Nenhum controle de emenda com esses filtros.</td></tr>}
            {linhas.map(c => {
              const m = c.metricas ?? {};
              const subs = detalhada || modalidade === "rp7" || modalidade === "rp8"
                ? Object.entries(c.detalhe_modalidade ?? {}).filter(([k]) => c.grupo === "coletiva" && (!modalidade || modalidade === k))
                : [];
              return (
                <FragmentoLinhas key={c.categoria}>
                  <tr style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={td}>
                      <div style={{ fontWeight: 800 }}>{c.rotulo_curto}</div>
                      <div style={{ fontSize: 10.5, color: "#6b7280" }}>
                        {c.grupo === "coletiva" ? "Bancada + comissão — teto compartilhado" : "Individuais — teto próprio"} · {c.componente === "pap" ? "ação 2E89" : "ação 2E90"}
                      </div>
                    </td>
                    <td style={tdNum}>
                      {fmt(c.teto_oficial)}
                      <div style={{ fontSize: 10, color: "#6b7280" }}>{c.origem_teto === "investsus_limites" ? "tela Limites InvestSUS" : c.origem_teto === "planilha_fns" ? "planilha FNS" : "—"}</div>
                    </td>
                    {detalhada && <><td style={tdNum}>{fmt(m.valor_indicado)}</td><td style={tdNum}>{fmt(m.valor_proposta)}</td></>}
                    <td style={tdNum}>{fmt(c.comprometido)}</td>
                    {detalhada && <><td style={tdNum}>{fmt(m.valor_aprovado)}</td><td style={tdNum}>{fmt(m.valor_pago)}</td></>}
                    <td style={tdNum}>{celSaldo(c, c.saldo, c.categoria)}</td>
                    <td style={td}><Barra perc={c.perc_utilizado} cor={c.semaforo?.cor} /><div style={{ fontSize: 10.5, color: "#4b5563", marginTop: 2 }}>{fmtPct(c.perc_utilizado)} utilizado</div></td>
                    <td style={td}><Semaforo s={c.semaforo} /></td>
                    <td style={td}><Selo situacao={c.validacao?.saldo ?? "nao_disponivel"} /></td>
                  </tr>
                  {subs.map(([mod, mm]: [string, any]) => (
                    <tr key={mod} style={{ background: modalidade === mod ? "#eff6ff" : "#fafafa" }}>
                      <td style={{ ...td, paddingLeft: 22, fontSize: 11.5, color: "#374151" }}>↳ {MOD_ROTULO[mod]} ({mm.qtd} proposta{mm.qtd !== 1 ? "s" : ""})</td>
                      <td style={{ ...tdNum, color: "#9ca3af" }}>compartilhado</td>
                      {detalhada && <><td style={tdNum}>{fmt(mm.valor_indicado)}</td><td style={tdNum}>{fmt(mm.valor_proposta)}</td></>}
                      <td style={tdNum}>{fmt(mm.comprometido)}</td>
                      {detalhada && <><td style={tdNum}>{fmt(mm.valor_aprovado)}</td><td style={tdNum}>{fmt(mm.valor_pago)}</td></>}
                      <td style={{ ...tdNum, color: "#9ca3af" }}>—</td>
                      <td style={{ ...td, fontSize: 10.5, color: "#4b5563" }}>{c.teto_oficial ? `${fmtPct((100 * mm.comprometido) / c.teto_oficial)} do teto` : "—"}</td>
                      <td style={td} colSpan={2} />
                    </tr>
                  ))}
                </FragmentoLinhas>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* C — programas do MS */}
      {(!modalidade && !componente) && progsVis.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Recursos de programas do Ministério da Saúde — limites separados dos tetos de emendas</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={th}>Programa</th><th style={{ ...th, textAlign: "right" }}>Limite oficial</th>
                  {detalhada && <th style={{ ...th, textAlign: "right" }}>Aprovado</th>}
                  <th style={{ ...th, textAlign: "right" }}>Comprometido</th>
                  {detalhada && <th style={{ ...th, textAlign: "right" }}>Pago</th>}
                  <th style={{ ...th, textAlign: "right" }}>Saldo</th><th style={th}>Situação</th><th style={th}>Validação</th>
                </tr>
              </thead>
              <tbody>
                {progsVis.map(g => (
                  <tr key={g.categoria ?? g.programa} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={td}>{g.programa} <span style={{ fontSize: 10.5, color: "#6b7280" }}>({g.propostas.length} proposta{g.propostas.length !== 1 ? "s" : ""})</span></td>
                    <td style={tdNum}>{fmt(g.valor_maximo)}</td>
                    {detalhada && <td style={tdNum}>{fmt(g.valor_aprovado)}</td>}
                    <td style={tdNum}>{fmt(g.valor_solicitado)}</td>
                    {detalhada && <td style={tdNum}>{fmt(g.valor_pago)}</td>}
                    <td style={tdNum}>{g.categoria ? celSaldo(g, g.saldo, g.categoria) : fmt(g.saldo)}</td>
                    <td style={td}><Semaforo s={g.semaforo} /></td>
                    <td style={td}><Selo situacao={g.validacao?.saldo ?? "nao_disponivel"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 8, lineHeight: 1.5 }}>
        Clique no saldo para ver a memória de cálculo (com exportação em PDF e Excel). "Validado" só aparece quando o teto e o valor
        utilizado foram conferidos com a tela Limites do InvestSUS; sem isso o saldo é calculado pelo ERSUS360 e fica pendente.
        Situação: verde até {tetos.regras?.limiar_esgotamento ?? 80}% de utilização, amarelo a partir de {tetos.regras?.limiar_esgotamento ?? 80}%, vermelho com teto esgotado, cinza sem teto oficial.
      </div>

      {(tetos.alertas ?? []).length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ ...rotulo, marginBottom: 6 }}>Alertas dos tetos ({tetos.alertas.length})</div>
          <AlertasTetos alertas={tetos.alertas} max={4} />
        </div>
      )}
    </div>
  );
}

function FragmentoLinhas({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ── Memória de Cálculo do Teto (modal) ────────────────────────────────────────
function MemoriaCalculo({ controle, exercicio, onFechar }: { controle: any; exercicio: number; onFechar: () => void }) {
  const [mod, setMod] = useState("");
  const [fase, setFase] = useState("");
  const [pag, setPag] = useState("");
  const [incl, setIncl] = useState("");
  const [baixando, setBaixando] = useState<string | null>(null);
  const linhas: any[] = controle.memoria_linhas ?? [];
  const filtradas = linhas.filter(x =>
    (!mod || x.modalidade === mod) && (!fase || x.fase === fase) && (!pag || x.situacao_pagamento === pag) &&
    (!incl || (incl === "sim") === !!x.incluida));
  const somaFiltro = filtradas.reduce((a, x) => a + (x.valor_considerado ?? 0), 0);
  const teto = controle.teto_oficial ?? controle.valor_maximo ?? null;
  const comprometido = controle.comprometido ?? controle.metricas?.comprometido ?? 0;
  const lim = controle.limite_investsus;
  const fns = controle.teto;
  const opcoes = (campo: string) => Array.from(new Set(linhas.map(x => x[campo]).filter(Boolean))) as string[];
  const exportar = async (formato: "pdf" | "xlsx") => {
    setBaixando(formato);
    try { await baixar(`/api/investsus/tetos/memoria/${controle.categoria}?exercicio=${exercicio}&formato=${formato}`, `memoria_teto_${controle.categoria}_${exercicio}.${formato}`); }
    finally { setBaixando(null); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Memória de cálculo do teto" onClick={onFechar} style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", zIndex: 1000, display: "flex",
      alignItems: "flex-start", justifyContent: "center", padding: "32px 12px", overflowY: "auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 1080, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e3a5f" }}>Memória de Cálculo do Teto — {controle.rotulo_curto ?? controle.programa}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Exercício {exercicio}{controle.rotulo_investsus ? ` · tela Limites: "${controle.rotulo_investsus}"` : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={btn("#475569")} disabled={!!baixando} onClick={() => exportar("pdf")}><Download size={13} />{baixando === "pdf" ? "Gerando..." : "PDF"}</button>
            <button style={btn("#475569")} disabled={!!baixando} onClick={() => exportar("xlsx")}><Download size={13} />{baixando === "xlsx" ? "Gerando..." : "Excel"}</button>
            <button aria-label="Fechar" onClick={onFechar} style={{ ...btn(), padding: 6 }}><X size={16} /></button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 10, margin: "12px 0" }}>
          <div style={{ ...card, padding: 12 }}>
            <Linha k="Teto oficial" v={fmt(teto)} forte />
            <Linha k="Comprometido no teto" v={fmt(comprometido)} />
            <Linha k="Saldo para novas propostas" v={fmt(controle.saldo)} forte cor={controle.semaforo?.cor === "vermelho" ? "#b91c1c" : "#047857"} />
            <Linha k="Utilização" v={fmtPct(controle.perc_utilizado)} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              <Semaforo s={controle.semaforo} />
              <Selo situacao={controle.validacao?.teto ?? "nao_disponivel"} prefixo="Teto" />
              <Selo situacao={controle.validacao?.saldo ?? "nao_disponivel"} prefixo="Saldo" />
            </div>
          </div>
          <div style={{ ...card, padding: 12, fontSize: 11.5, color: "#374151", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={rotulo}>Fonte do teto</div>
            {lim ? (
              <>
                <div><b>Tela Limites do InvestSUS</b> — {lim.origem === "arquivo" ? `arquivo ${lim.arquivo_nome}` : "valor transcrito"}, versão {lim.versao}</div>
                <div>Consulta em {fmtData(lim.consultado_em)} · registrado por {lim.registrado_por ?? "—"} em {fmtData(lim.registrado_em)}</div>
                {lim.valor_utilizado != null && <div>Utilizado na tela: {fmt(lim.valor_utilizado)} · saldo na tela: {fmt(lim.saldo)}</div>}
              </>
            ) : <div>Sem registro da tela Limites do InvestSUS.</div>}
            {fns?.valor != null && (
              <div>Planilha FNS: {fmt(fns.valor)} — {fns.documento} (publicação {fmtData(fns.data_publicacao)}, lida em {fmtData(fns.consultado_em)})</div>
            )}
          </div>
        </div>

        {(controle.validacao?.divergencias ?? []).length > 0 && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 12, color: "#991b1b" }}>
            <div style={{ fontWeight: 800, marginBottom: 3 }}>Divergências</div>
            {controle.validacao.divergencias.map((d: any, i: number) => <div key={i}>• {d.mensagem}</div>)}
          </div>
        )}
        {(controle.memoria_calculo ?? []).length > 0 && (
          <ol style={{ margin: "0 0 10px", paddingLeft: 18, fontSize: 12, color: "#374151", display: "flex", flexDirection: "column", gap: 3 }}>
            {controle.memoria_calculo.map((m: string, i: number) => <li key={i}>{m}</li>)}
          </ol>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <span style={rotulo}>Filtrar propostas</span>
          <select aria-label="Tipo de emenda" style={{ ...inp, width: "auto" }} value={mod} onChange={e => setMod(e.target.value)}>
            <option value="">Todos os tipos</option>{opcoes("modalidade").map(o => <option key={o} value={o}>{MOD_ROTULO[o] ?? o}</option>)}
          </select>
          <select aria-label="Situação da proposta" style={{ ...inp, width: "auto" }} value={fase} onChange={e => setFase(e.target.value)}>
            <option value="">Qualquer situação</option>{opcoes("fase").map(o => <option key={o} value={o}>{FASE_ROTULO[o] ?? o}</option>)}
          </select>
          <select aria-label="Situação do pagamento" style={{ ...inp, width: "auto" }} value={pag} onChange={e => setPag(e.target.value)}>
            <option value="">Qualquer pagamento</option>{opcoes("situacao_pagamento").map(o => <option key={o} value={o}>{PAGAMENTO_ROTULO[o] ?? o}</option>)}
          </select>
          <select aria-label="Inclusão no teto" style={{ ...inp, width: "auto" }} value={incl} onChange={e => setIncl(e.target.value)}>
            <option value="">Incluídas e excluídas</option><option value="sim">Só incluídas</option><option value="nao">Só excluídas</option>
          </select>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={th}>Proposta</th><th style={th}>Tipo</th><th style={th}>Comp.</th><th style={th}>Situação</th>
                <th style={th}>Pagamento</th><th style={th}>Estágio</th><th style={{ ...th, textAlign: "right" }}>Valor considerado</th><th style={th}>Justificativa</th>
              </tr>
            </thead>
            <tbody>
              {!filtradas.length && <tr><td colSpan={8} style={{ ...td, color: "#9ca3af" }}>Nenhuma proposta {linhas.length ? "com esses filtros" : "deste exercício neste controle"}.</td></tr>}
              {filtradas.map(x => (
                <tr key={`${x.id}-${x.incluida}`} style={{ borderTop: "1px solid #f3f4f6", opacity: x.incluida ? 1 : 0.75 }}>
                  <td style={{ ...td, fontFamily: "monospace" }} title={x.objeto ?? ""}>{x.numero_proposta}</td>
                  <td style={td}>{x.tipo_emenda}</td>
                  <td style={td}>{(x.componente ?? "").toUpperCase()}</td>
                  <td style={td}>{FASE_ROTULO[x.fase] ?? x.situacao ?? "—"}</td>
                  <td style={td}>{PAGAMENTO_ROTULO[x.situacao_pagamento] ?? "—"}</td>
                  <td style={td}>{ESTAGIO_ROTULO[x.estagio] ?? x.estagio}</td>
                  <td style={{ ...tdNum, fontWeight: 700 }}>{fmt(x.valor_considerado)}</td>
                  <td style={{ ...td, color: x.incluida ? "#047857" : "#92400e" }}>{x.justificativa}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #e5e7eb" }}>
                <td style={{ ...td, fontWeight: 800 }} colSpan={6}>Total {filtradas.length !== linhas.length ? "das propostas filtradas" : "comprometido"}</td>
                <td style={{ ...tdNum, fontWeight: 800 }}>{fmt(somaFiltro)}</td><td style={td} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Validação oficial: registro da tela Limites e importação de arquivo ───────
function ValidacaoLimites({ data, exercicio }: { data: any; exercicio: number }) {
  const qc = useQueryClient();
  const limites: Record<string, string> = data.limites_investsus ?? {};
  const [form, setForm] = useState({ categoria: Object.keys(limites)[0] ?? "individual_pap", valor_limite: "", valor_utilizado: "", saldo: "", consultado_em: new Date().toISOString().slice(0, 10), observacao: "" });
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<any>(null);
  const [verHist, setVerHist] = useState(false);
  const recarregar = () => qc.invalidateQueries({ queryKey: ["investsus-tetos"] });
  const erroDe = (e: any) => e?.response?.data?.detail ?? (e ? "Falha ao gravar." : null);

  const registrar = useMutation({
    mutationFn: () => api.post("/api/investsus/tetos/limites", {
      exercicio, categoria: form.categoria, valor_limite: lerReais(form.valor_limite),
      valor_utilizado: lerReais(form.valor_utilizado), saldo: lerReais(form.saldo),
      consultado_em: form.consultado_em || null, observacao: form.observacao || null,
    }).then(r => r.data),
    onSuccess: () => { setForm(f => ({ ...f, valor_limite: "", valor_utilizado: "", saldo: "", observacao: "" })); recarregar(); },
  });
  const importar = useMutation({
    mutationFn: (confirmar: boolean) => {
      const fd = new FormData(); fd.append("arquivo", arquivo as File);
      return api.post(`/api/investsus/tetos/limites/importar?exercicio=${exercicio}&confirmar=${confirmar}`, fd,
        { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data);
    },
    onSuccess: (r: any) => { setPrevia(r); if (r.confirmado) { setArquivo(null); recarregar(); } },
  });
  const modelo = () => {
    const ibge = data.municipio?.ibge ?? "";
    const csv = "﻿exercicio;ibge;limite;valor_limite;valor_utilizado;saldo\n" +
      Object.values(limites).map(r => `${exercicio};${ibge};${r};;;`).join("\n") + "\n";
    const u = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = u; a.download = `modelo_limites_investsus_${exercicio}.csv`; a.click(); URL.revokeObjectURL(u);
  };
  const valorPreenchido = lerReais(form.valor_limite);
  const conta = (() => {
    const l = lerReais(form.valor_limite), u = lerReais(form.valor_utilizado), s = lerReais(form.saldo);
    return l != null && u != null && s != null && Math.abs(l - u - s) > 0.01 ? "Limite − utilizado ≠ saldo: confira a transcrição." : null;
  })();
  const cards: any[] = data.cards ?? [];
  const progs: any[] = (data.programacao?.programas ?? []).filter((g: any) => g.categoria);
  const hist: any[] = data.historico ?? [];

  return (
    <div style={{ ...card, display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={16} /> Validação oficial dos limites — {exercicio}</div>
        <div style={{ fontSize: 12, color: "#4b5563", marginTop: 2, lineHeight: 1.5 }}>
          O limite que vale é o da tela <b>Limites</b> do InvestSUS (investsus.saude.gov.br/limite), acessada com o gov.br do município.
          Não há API pública autorizada para essa tela e o ERSUS360 não faz login nem captura sessão: copie os valores de cada item do
          seletor (Limite, Utilizado e Saldo) ou importe uma planilha/CSV. Cada registro guarda data da consulta, responsável e versão.
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            <th style={th}>Item da tela Limites</th><th style={{ ...th, textAlign: "right" }}>Planilha FNS</th>
            <th style={{ ...th, textAlign: "right" }}>Tela InvestSUS</th><th style={{ ...th, textAlign: "right" }}>Utilizado (tela)</th>
            <th style={{ ...th, textAlign: "right" }}>Comprometido ERSUS360</th><th style={th}>Validação</th>
          </tr></thead>
          <tbody>
            {[...cards.map(c => ({ cat: c.categoria, rot: c.rotulo_investsus, fns: c.teto?.valor, lim: c.limite_investsus, comp: c.comprometido, val: c.validacao })),
              ...progs.map(g => ({ cat: g.categoria, rot: g.programa, fns: null, lim: g.limite_investsus, comp: g.valor_solicitado, val: g.validacao }))].map(r => (
              <tr key={r.cat} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={td}>{r.rot}</td>
                <td style={tdNum}>{r.fns == null ? "—" : fmt(r.fns)}</td>
                <td style={tdNum}>{r.lim ? <>{fmt(r.lim.valor_limite)}<div style={{ fontSize: 10, color: "#6b7280" }}>v{r.lim.versao} · {fmtData(r.lim.consultado_em)}</div></> : "Não registrado"}</td>
                <td style={tdNum}>{r.lim?.valor_utilizado == null ? "—" : fmt(r.lim.valor_utilizado)}</td>
                <td style={tdNum}>{fmt(r.comp)}</td>
                <td style={td}><Selo situacao={r.val?.saldo ?? "nao_disponivel"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 12 }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800 }}>Registrar valor copiado da tela Limites</div>
          <label style={rotulo}>Item do seletor
            <select style={inp} value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
              {Object.entries(limites).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            <label style={rotulo}>Limite (R$)<input style={inp} inputMode="decimal" placeholder="0,00" value={form.valor_limite} onChange={e => setForm({ ...form, valor_limite: e.target.value })} /></label>
            <label style={rotulo}>Utilizado (R$)<input style={inp} inputMode="decimal" placeholder="opcional" value={form.valor_utilizado} onChange={e => setForm({ ...form, valor_utilizado: e.target.value })} /></label>
            <label style={rotulo}>Saldo (R$)<input style={inp} inputMode="decimal" placeholder="opcional" value={form.saldo} onChange={e => setForm({ ...form, saldo: e.target.value })} /></label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 6 }}>
            <label style={rotulo}>Data da consulta<input type="date" style={inp} value={form.consultado_em} onChange={e => setForm({ ...form, consultado_em: e.target.value })} /></label>
            <label style={rotulo}>Observação<input style={inp} value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} /></label>
          </div>
          {conta && <div style={{ fontSize: 11.5, color: "#b45309" }}>{conta}</div>}
          {registrar.error && <div style={{ fontSize: 11.5, color: "#b91c1c" }}>{String(erroDe(registrar.error))}</div>}
          {registrar.isSuccess && <div style={{ fontSize: 11.5, color: "#047857" }}>Registrado (versão {registrar.data?.versao}).</div>}
          <button style={{ ...btn("#1e3a5f"), alignSelf: "flex-start" }} disabled={valorPreenchido == null || !!conta || registrar.isPending} onClick={() => registrar.mutate()}>
            {registrar.isPending ? "Gravando..." : "Registrar limite"}
          </button>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800 }}>Importar planilha ou CSV de limites</div>
          <div style={{ fontSize: 11.5, color: "#4b5563" }}>Colunas: exercicio, ibge, limite (nome do item da tela), valor_limite e, opcionalmente, valor_utilizado e saldo. O arquivo é recusado se o exercício, o IBGE ou o limite não conferirem.</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <button style={btn()} onClick={modelo}><FileText size={13} /> Baixar modelo</button>
            <input type="file" accept=".csv,.xlsx" onChange={e => { setArquivo(e.target.files?.[0] ?? null); setPrevia(null); }} style={{ fontSize: 11.5 }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={btn("#475569")} disabled={!arquivo || importar.isPending} onClick={() => importar.mutate(false)}><Upload size={13} /> Validar arquivo</button>
            <button style={btn("#1e3a5f")} disabled={!arquivo || !previa || previa.erros?.length > 0 || previa.confirmado || importar.isPending} onClick={() => importar.mutate(true)}>Confirmar importação</button>
          </div>
          {importar.error && <div style={{ fontSize: 11.5, color: "#b91c1c" }}>{String(erroDe(importar.error))}</div>}
          {previa && (
            <div style={{ fontSize: 11.5, background: "#f9fafb", borderRadius: 6, padding: 8 }}>
              {previa.confirmado
                ? <div style={{ color: "#047857", fontWeight: 700 }}>{previa.gravados} limite(s) gravado(s) de {previa.arquivo}.</div>
                : <div><b>{previa.linhas.length}</b> linha(s) válida(s), <b>{previa.erros.length}</b> com erro.</div>}
              {previa.linhas.map((l: any) => <div key={l.linha}>Linha {l.linha}: {limites[l.categoria] ?? l.categoria} — {fmt(l.valor_limite)}{l.valor_utilizado != null ? ` (utilizado ${fmt(l.valor_utilizado)})` : ""}</div>)}
              {previa.erros.map((e: any) => <div key={e.linha} style={{ color: "#b91c1c" }}>Linha {e.linha}: {e.erros.join("; ")}</div>)}
            </div>
          )}
        </div>
      </div>

      <div>
        <button onClick={() => setVerHist(v => !v)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#1e3a5f" }}>
          {verHist ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Histórico de limites ({hist.length})
        </button>
        {verHist && (
          <div style={{ overflowX: "auto", marginTop: 6 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
              <thead><tr style={{ background: "#f9fafb" }}>
                <th style={th}>Registrado em</th><th style={th}>Item</th><th style={th}>Origem</th><th style={th}>Versão</th>
                <th style={{ ...th, textAlign: "right" }}>Limite</th><th style={{ ...th, textAlign: "right" }}>Utilizado</th>
                <th style={th}>Responsável</th><th style={th}>Arquivo / observação</th>
              </tr></thead>
              <tbody>
                {!hist.length && <tr><td colSpan={8} style={{ ...td, color: "#9ca3af" }}>Nenhum registro neste exercício.</td></tr>}
                {hist.map((h: any) => (
                  <tr key={h.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={td}>{fmtData(h.registrado_em)}</td>
                    <td style={td}>{limites[h.categoria] ?? h.categoria}</td>
                    <td style={td}>{h.origem === "planilha_fns" ? "Planilha FNS" : h.origem === "arquivo" ? "Arquivo importado" : "Tela Limites (transcrição)"}</td>
                    <td style={td}>v{h.versao}</td>
                    <td style={tdNum}>{fmt(h.valor_limite)}</td>
                    <td style={tdNum}>{h.valor_utilizado == null ? "—" : fmt(h.valor_utilizado)}</td>
                    <td style={td}>{h.registrado_por ?? "—"}</td>
                    <td style={{ ...td, fontSize: 10.5, color: "#4b5563" }}>{[h.arquivo_nome, h.arquivo_hash ? `sha256 ${h.arquivo_hash.slice(0, 12)}…` : null, h.observacao].filter(Boolean).join(" · ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cards por categoria (aba Recursos Disponíveis) ────────────────────────────
function CardTeto({ c, onMemoria }: { c: any; onMemoria: () => void }) {
  const [aberto, setAberto] = useState(false);
  const t = c.teto ?? {};
  const corSaldo = c.saldo == null ? "#6b7280" : c.semaforo?.cor === "vermelho" ? "#dc2626" : "#047857";
  const cnes: any[] = t.detalhes?.cnes ?? [];
  const m = c.metricas ?? {};
  return (
    <div style={{ ...card, borderTop: `4px solid ${c.componente === "pap" ? "#0284c7" : "#7c3aed"}`, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>
            {c.componente === "pap" ? "PAP — Atenção Primária" : "MAC — Média e Alta Complexidade"}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>Custeio · Incremento Temporário ({c.componente === "pap" ? "ação 2E89" : "ação 2E90"})</div>
        </div>
        <Selo situacao={c.validacao?.saldo ?? c.situacao} />
      </div>

      <div>
        <div style={rotulo}>Saldo para novas propostas</div>
        <button onClick={onMemoria} title="Abrir a memória de cálculo" style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: 24, fontWeight: 800, color: corSaldo, lineHeight: 1.2, textDecoration: "underline dotted" }}>{fmt(c.saldo)}</button>
      </div>

      {c.teto_oficial != null && (
        <div>
          <Barra perc={c.perc_utilizado} cor={c.semaforo?.cor} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#6b7280", marginTop: 4, gap: 6 }}>
            <span>Utilizado {fmtPct(c.perc_utilizado)}</span>
            <Semaforo s={c.semaforo} />
          </div>
        </div>
      )}

      <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 6 }}>
        <Linha k="Teto oficial do município" v={fmt(c.teto_oficial)} forte />
        <Linha k="Indicado" v={fmt(m.valor_indicado)} />
        <Linha k="Cadastrado em propostas" v={fmt(m.valor_proposta)} />
        <Linha k="Comprometido no teto" v={fmt(c.comprometido)} />
        {c.grupo === "coletiva"
          ? ["rp7", "rp8"].map(md => (
              <Linha key={md} k={`  · ${MOD_ROTULO[md]}`} v={`${fmt(c.por_modalidade?.[md]?.valor ?? 0)} (${c.por_modalidade?.[md]?.qtd ?? 0})`} />
            ))
          : null}
        <Linha k="Aprovado" v={fmt(m.valor_aprovado)} />
        <Linha k="Pago" v={fmt(m.valor_pago)} />
      </div>

      <div style={{ fontSize: 11, color: "#4b5563", background: "#f9fafb", borderRadius: 6, padding: 8, display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <Selo situacao={c.validacao?.teto ?? "nao_disponivel"} prefixo="Teto" />
          <Selo situacao={c.validacao?.saldo ?? "nao_disponivel"} prefixo="Saldo" />
        </div>
        {c.limite_investsus
          ? <div><b>Tela Limites InvestSUS:</b> {fmt(c.limite_investsus.valor_limite)} · consulta {fmtData(c.limite_investsus.consultado_em)} · v{c.limite_investsus.versao}</div>
          : <div><b>Tela Limites InvestSUS:</b> não registrado</div>}
        <div><b>Planilha FNS:</b> {fmt(t.valor)} — {t.documento ?? "—"}</div>
        <div><b>Publicação:</b> {fmtData(t.data_publicacao)} · <b>Última consulta:</b> {fmtData(t.consultado_em)}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {t.url_planilha && <a href={t.url_planilha} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", display: "inline-flex", alignItems: "center", gap: 3 }}>Planilha oficial FNS <ExternalLink size={11} /></a>}
          {t.url_pagina && <a href={t.url_pagina} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", display: "inline-flex", alignItems: "center", gap: 3 }}>Página e portaria <ExternalLink size={11} /></a>}
        </div>
        {t.erro && <div style={{ color: "#b45309" }}><AlertTriangle size={11} style={{ verticalAlign: -1 }} /> {t.erro}</div>}
        {(c.validacao?.motivos ?? []).map((mt: string, i: number) => <div key={i} style={{ color: "#92400e" }}>• {mt}</div>)}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={onMemoria} style={{ ...btn("#1e3a5f"), fontSize: 11.5 }}><ClipboardList size={13} /> Memória de cálculo ({(c.memoria_linhas ?? []).length})</button>
        {cnes.length > 0 && (
          <button onClick={() => setAberto(v => !v)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#1e3a5f" }}>
            {aberto ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Limite por CNES
          </button>
        )}
      </div>
      {aberto && cnes.map((x: any) => (
        <Linha key={`${x.cnes}-${x.aba}`} k={`CNES ${x.cnes} · ${x.estabelecimento ?? ""}${x.entidade_sem_fins_lucrativos ? " (sem fins lucrativos)" : ""}`} v={fmt(x.valor)} />
      ))}
    </div>
  );
}

function Grupo({ titulo, sub, icone, cards, onMemoria }: { titulo: string; sub: string; icone: React.ReactNode; cards: any[]; onMemoria: (cat: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icone}
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{titulo}</div>
          <div style={{ fontSize: 11.5, color: "#6b7280" }}>{sub}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 12 }}>
        {cards.map(c => <CardTeto key={c.categoria} c={c} onMemoria={() => onMemoria(c.categoria)} />)}
      </div>
    </div>
  );
}

export function useTetos(exercicio?: number | string) {
  return useQuery({
    queryKey: ["investsus-tetos", exercicio ?? ""],
    queryFn: () => api.get(`/api/investsus/tetos${exercicio ? `?exercicio=${exercicio}` : ""}`).then(r => r.data),
    retry: 1,
  });
}

export function controleDaCategoria(data: any, categoria: string | null) {
  if (!data || !categoria) return null;
  return (data.cards ?? []).find((c: any) => c.categoria === categoria)
    ?? (data.programacao?.programas ?? []).find((g: any) => g.categoria === categoria) ?? null;
}

export default function TetosMunicipais({ categoriaMemoria, onMemoriaFechada }: { categoriaMemoria?: string | null; onMemoriaFechada?: () => void }) {
  const qc = useQueryClient();
  const [exercicio, setExercicio] = useState<number | "">("");
  const [memoria, setMemoria] = useState<string | null>(categoriaMemoria ?? null);
  useEffect(() => { if (categoriaMemoria) setMemoria(categoriaMemoria); }, [categoriaMemoria]);
  const { data, isLoading, error } = useTetos(exercicio || undefined);
  const atualizar = useMutation({
    mutationFn: () => api.post(`/api/investsus/tetos/atualizar${exercicio ? `?exercicio=${exercicio}` : ""}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investsus-tetos"] }),
  });
  const controle = useMemo(() => controleDaCategoria(data, memoria), [data, memoria]);

  if (isLoading) return <div style={{ ...card, color: "#9ca3af", fontSize: 12 }}>Carregando tetos municipais...</div>;
  if (error || !data) return <div style={{ ...card, color: "#b45309", fontSize: 12 }}>Não foi possível carregar os tetos municipais.</div>;

  const cards: any[] = data.cards ?? [];
  const ind = cards.filter(c => c.grupo === "individual");
  const col = cards.filter(c => c.grupo === "coletiva");
  const pendInd = data.a_classificar?.individual ?? [];
  const pendCol = data.a_classificar?.coletiva ?? [];
  const semMod = data.sem_modalidade ?? [];
  const prog = data.programacao ?? { programas: [] };
  const erroAtualizar = (atualizar.error as any)?.response?.data?.detail ?? (atualizar.error ? "Falha ao consultar o FNS." : null);
  const falhas = (atualizar.data?.resultados ?? []).filter((r: any) => r.erro);
  const temFns = (data.fontes ?? []).length > 0;
  const fechar = () => { setMemoria(null); onMemoriaFechada?.(); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 18 }}>
      {/* Cabeçalho */}
      <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", background: "#f8fafc" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1e3a5f" }}>Capacidade de recebimento — tetos municipais {data.exercicio}</div>
          <div style={{ fontSize: 12, color: "#4b5563", maxWidth: 760 }}>
            Quanto o município ainda pode cadastrar em novas propostas de custeio (Incremento Temporário PAP/MAC) e nos limites de
            programas do MS: saldo = teto oficial − valor já comprometido nas propostas do exercício.
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
            {data.municipio ? `${data.municipio.nome}/${data.municipio.uf} (IBGE ${data.municipio.ibge}) · ` : ""}
            Última consulta ao FNS: {fmtData(data.ultima_consulta)} · Última sincronização das propostas: {fmtData(data.ultima_sincronizacao_propostas)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
            Exercício
            <select style={{ ...inp, width: 100 }} value={exercicio || data.exercicio} onChange={e => setExercicio(Number(e.target.value))}>
              {(data.exercicios_disponiveis ?? [data.exercicio]).map((a: number) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <button onClick={() => atualizar.mutate()} disabled={atualizar.isPending || !temFns} title={temFns ? "" : "Sem planilhas oficiais do FNS cadastradas para este exercício"}
            style={{ padding: "8px 14px", borderRadius: 6, border: "none", cursor: atualizar.isPending ? "wait" : "pointer", fontSize: 12.5, fontWeight: 700, background: temFns ? "#1e3a5f" : "#9ca3af", color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={13} className={atualizar.isPending ? "animate-spin" : ""} />
            {atualizar.isPending ? "Consultando FNS..." : "Atualizar Tetos Municipais"}
          </button>
        </div>
      </div>
      {erroAtualizar && <div style={{ ...card, color: "#b91c1c", fontSize: 12, background: "#fef2f2" }}>{String(erroAtualizar)}</div>}
      {falhas.length > 0 && (
        <div style={{ ...card, color: "#b45309", fontSize: 12, background: "#fffbeb" }}>
          {falhas.map((f: any) => <div key={f.categoria}>{f.categoria}: {f.erro}</div>)}
        </div>
      )}

      {(data.alertas ?? []).length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} /> Alertas dos tetos ({data.alertas.length})</div>
          <AlertasTetos alertas={data.alertas} max={6} />
        </div>
      )}

      {(pendInd.length > 0 || pendCol.length > 0 || semMod.length > 0) && (
        <div style={{ ...card, background: "#fffbeb", borderColor: "#fde68a", fontSize: 12, color: "#92400e" }}>
          <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}><AlertTriangle size={13} /> Propostas fora do cálculo — o saldo fica pendente de validação</div>
          {pendInd.length > 0 && <div>{pendInd.length} emenda(s) individual(is) {data.exercicio} sem componente identificado (PAP/MAC, custeio ou investimento): {pendInd.map((p: any) => p.numero_proposta).join(", ")}.</div>}
          {pendCol.length > 0 && <div>{pendCol.length} emenda(s) coletiva(s) {data.exercicio} sem componente identificado: {pendCol.map((p: any) => p.numero_proposta).join(", ")}.</div>}
          {semMod.length > 0 && <div>{semMod.length} proposta(s) de Incremento PAP/MAC sem modalidade (RP 6/7/8) definida: {semMod.map((p: any) => p.numero_proposta).join(", ")}.</div>}
          <div style={{ marginTop: 4 }}>Sincronize os detalhes (ação orçamentária) ou classifique a proposta para que entre no teto correto.</div>
        </div>
      )}

      <ValidacaoLimites data={data} exercicio={data.exercicio} />

      <Grupo titulo="A — Emendas individuais (RP 6)" sub="Portaria GM/MS nº 10.297/2026 · teto próprio, independente das coletivas"
        icone={<Users size={18} color="#1e3a5f" />} cards={ind} onMemoria={setMemoria} />
      <Grupo titulo="B — Emendas coletivas (RP 7 bancada + RP 8 comissão)" sub="Portaria GM/MS nº 8.283/2025 (red. 10.352/2026) · bancada e comissão dividem um teto único"
        icone={<Landmark size={18} color="#1e3a5f" />} cards={col} onMemoria={setMemoria} />

      {/* C — Recursos de programas */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: 6 }}>
            <ClipboardList size={16} /> C — Recursos de programas do Ministério da Saúde ({data.exercicio})
          </div>
          <Selo situacao={prog.situacao} />
        </div>
        <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 10 }}>{prog.nota}</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ color: "#6b7280", textAlign: "left", background: "#f9fafb" }}>
                <th style={th}>Programa</th>
                <th style={{ ...th, textAlign: "right" }}>Propostas</th>
                <th style={{ ...th, textAlign: "right" }}>Limite oficial</th>
                <th style={{ ...th, textAlign: "right" }}>Comprometido</th>
                <th style={{ ...th, textAlign: "right" }}>Aprovado</th>
                <th style={{ ...th, textAlign: "right" }}>Pago</th>
                <th style={{ ...th, textAlign: "right" }}>Saldo</th>
                <th style={th}>Situação</th>
              </tr>
            </thead>
            <tbody>
              {prog.programas.map((g: any) => (
                <tr key={g.categoria ?? g.programa} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={td}>{g.programa}{g.categoria && <div><button onClick={() => setMemoria(g.categoria)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", color: "#1d4ed8", fontSize: 11 }}>Memória de cálculo</button></div>}</td>
                  <td style={tdNum}>{g.propostas.length}</td>
                  <td style={{ ...tdNum, color: g.valor_maximo == null ? "#6b7280" : "#111827" }}>{fmt(g.valor_maximo)}</td>
                  <td style={{ ...tdNum, fontWeight: 700 }}>{fmt(g.valor_solicitado)}</td>
                  <td style={tdNum}>{fmt(g.valor_aprovado)}</td>
                  <td style={tdNum}>{fmt(g.valor_pago)}</td>
                  <td style={{ ...tdNum, color: g.saldo == null ? "#6b7280" : "#111827" }}>{fmt(g.saldo)}</td>
                  <td style={td}><Semaforo s={g.semaforo} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>
        <b>Como o saldo é calculado:</b> cada proposta entra uma única vez, pelo estágio mais avançado de valor
        (aprovado → valor da proposta → indicado); empenhado e pago não são somados de novo. Só o custeio
        Incremento Temporário (ações 2E89/2E90) consome teto; investimento não. Canceladas e rejeitadas não ocupam o
        limite e aparecem na memória de cálculo como excluídas. Devoluções não recompõem o teto sem ato oficial.
        {data.propostas_outros_exercicios > 0 && ` ${data.propostas_outros_exercicios} proposta(s) de outros exercícios não entram no teto de ${data.exercicio}.`}
      </div>

      {controle && <MemoriaCalculo controle={controle} exercicio={data.exercicio} onFechar={fechar} />}
    </div>
  );
}
