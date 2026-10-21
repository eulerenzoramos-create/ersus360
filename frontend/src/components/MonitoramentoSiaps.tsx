// Monitoramento SIAPS — ausência de envio de produção válida (e-Gestor APS).
// Fonte: relatório público do e-Gestor "Equipes e serviços com ausência de envio de informação".
// A fonte só informa AUSÊNCIA e há quantas competências ela dura: o que ela não informa aparece como
// "Informação não disponibilizada pela fonte" e nunca é estimado. Cores = alerta gerencial interno.
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiGetRaw, apiPost, apiPut } from "../lib/api";
import { dataBr, useCalendarioSiaps } from "./PrazoSiapsBanner";

const NAO_DISP = "Informação não disponibilizada pela fonte";
const BASE = "/api/egestor-ausencia";

type Nivel = "verde" | "amarelo" | "laranja" | "vermelho" | "cinza";
const COR: Record<Nivel, { fg: string; bg: string; borda: string; nome: string }> = {
  verde:    { fg: "#166534", bg: "#dcfce7", borda: "#86efac", nome: "Regular" },
  amarelo:  { fg: "#854d0e", bg: "#fef9c3", borda: "#fde047", nome: "Atenção" },
  laranja:  { fg: "#9a3412", bg: "#ffedd5", borda: "#fdba74", nome: "Alto risco" },
  vermelho: { fg: "#991b1b", bg: "#fee2e2", borda: "#fca5a5", nome: "Crítico" },
  cinza:    { fg: "#4b5563", bg: "#f3f4f6", borda: "#d1d5db", nome: "Não verificado" },
};
const SUBS = [
  { id: "visao", label: "1. Visão Geral" },
  { id: "producao", label: "2. Produção por Competência" },
  { id: "equipes", label: "3. Situação das Equipes" },
  { id: "ausencia", label: "4. Ausência de Envio" },
  { id: "diagnostico", label: "5. Diagnóstico das Ausências" },
  { id: "processamento", label: "6. Processamento e Validação" },
  { id: "alertas", label: "7. Alertas e Risco de Suspensão" },
  { id: "historico", label: "8. Histórico de Competências" },
  { id: "relatorios", label: "9. Relatórios Gerenciais" },
  { id: "integracoes", label: "10. Integrações e Atualizações" },
] as const;
type Sub = (typeof SUBS)[number]["id"];

const compBr = (c?: string | null) => (c ? `${c.slice(5, 7)}/${c.slice(0, 4)}` : "—");
const dtHora = (s?: string | null) => (s ? new Date(s).toLocaleString("pt-BR") : "—");

function baixarCsv(nome: string, cab: string[], linhas: (string | number | null | undefined)[][]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const txt = [cab, ...linhas].map(l => l.map(esc).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + txt], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── peças visuais ────────────────────────────────────────────────────────────
function Selo({ nivel, texto }: { nivel: Nivel; texto?: string }) {
  const c = COR[nivel] ?? COR.cinza;
  return <span style={{ background: c.bg, color: c.fg, border: `1px solid ${c.borda}`, borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{texto ?? c.nome}</span>;
}
function Card({ titulo, valor, nivel, nota }: { titulo: string; valor: string | number; nivel?: Nivel; nota?: string }) {
  const c = nivel ? COR[nivel] : null;
  return (
    <div style={{ background: c?.bg ?? "#fff", border: `1px solid ${c?.borda ?? "#e5e7eb"}`, borderRadius: 10, padding: "12px 14px", minWidth: 150, flex: "1 1 150px" }}>
      <div style={{ fontSize: 11, color: c?.fg ?? "#374151", fontWeight: 600 }}>{titulo}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: c?.fg ?? "#111827", marginTop: 2 }}>{valor}</div>
      {nota && <div style={{ fontSize: 11, color: "#374151", marginTop: 2 }}>{nota}</div>}
    </div>
  );
}
function Aviso({ children, tom = "info" }: { children: React.ReactNode; tom?: "info" | "alerta" }) {
  const [bg, fg, bd] = tom === "alerta" ? ["#fffbeb", "#92400e", "#fde68a"] : ["#eff6ff", "#1e40af", "#bfdbfe"];
  return <div style={{ background: bg, color: fg, border: `1px solid ${bd}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 10 }}>{children}</div>;
}
const th: React.CSSProperties = { textAlign: "left", padding: "7px 8px", fontSize: 12, color: "#1f2937", background: "#f3f4f6", borderBottom: "1px solid #d1d5db", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "7px 8px", fontSize: 13, color: "#111827", borderBottom: "1px solid #eef0f3", verticalAlign: "top" };
const btn: React.CSSProperties = { padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 12 };
const btnP: React.CSSProperties = { ...btn, background: "#1d4ed8", color: "#fff", border: "1px solid #1d4ed8", fontWeight: 600 };

function SemDado({ msg }: { msg?: string }) {
  return <Aviso tom="alerta">{msg ?? "Nenhuma competência coletada ainda."} Abra <strong>10. Integrações e Atualizações</strong> e use <strong>Atualizar dados</strong>.</Aviso>;
}

// ── impressão / PDF ──────────────────────────────────────────────────────────
// Abre um documento limpo só com o relatório (sem menu, botões e filtros do sistema), com cabeçalho,
// cores preservadas e quebra de página. O estilo da tela é todo inline, então vai junto no clone.
const escHtml = (t: string) => t.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

function imprimirPainel(raiz: HTMLElement | null, titulo: string, subtitulo: string, paisagem: boolean) {
  if (!raiz) return;
  const clone = raiz.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("button, select, input, textarea, [data-no-print]").forEach(n => n.remove());
  const w = window.open("", "_blank");
  if (!w) { window.alert("O navegador bloqueou a janela de impressão. Permita pop-ups para este site e tente de novo."); return; }
  const agora = new Date().toLocaleString("pt-BR");
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escHtml(titulo)}</title><style>
    @page { size: A4 ${paisagem ? "landscape" : "portrait"}; margin: 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { margin: 0; font-family: system-ui, Arial, sans-serif; color: #111827; font-size: 12px; background: #fff; }
    .cab { border-bottom: 2px solid #1d4ed8; padding-bottom: 6px; margin-bottom: 12px; }
    .cab h1 { margin: 0; font-size: 17px; } .cab div { color: #374151; font-size: 11px; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; } thead { display: table-header-group; }
    tr, section { break-inside: avoid; } h2, h3 { break-after: avoid; }
    div { overflow: visible !important; }
    [data-print-only] { display: block !important; }
    .rod { margin-top: 14px; border-top: 1px solid #d1d5db; padding-top: 6px; color: #4b5563; font-size: 10px; }
  </style></head><body>
    <div class="cab"><h1>ERSUS 360 — ${escHtml(titulo)}</h1><div>${escHtml(subtitulo)}</div><div>Gerado em ${agora}</div></div>
    ${clone.outerHTML}
    <div class="rod">Fontes: e-Gestor APS (relatórios públicos de ausência de envio e de pagamento) e SISAB (relatório público de validação da produção), nas datas de consulta indicadas. Registros e lotes do e-SUS APS/PEC municipal não são acessados pelo ERSUS 360. As cores são alerta gerencial interno do ERSUS 360 e não substituem a situação oficial do Ministério da Saúde. O que a fonte não publica é indicado como “Informação não disponibilizada pela fonte”.</div>
  </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
}

// ── componente principal ─────────────────────────────────────────────────────
export default function MonitoramentoSiaps({ municipio }: { municipio?: { uf?: string; nome?: string } }) {
  const raizRef = useRef<HTMLDivElement>(null);
  const [sub, setSub] = useState<Sub>("visao");
  const [comp, setComp] = useState<string>("");
  const [ineSel, setIneSel] = useState<string | null>(null);
  const [compCaso, setCompCaso] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [fNivel, setFNivel] = useState<string>("todos");
  const [fTipo, setFTipo] = useState<string>("todos");

  const q = (k: string, path: string, params?: Record<string, unknown>, enabled = true) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery<any>({ queryKey: ["mon-siaps", k, params ?? {}], queryFn: () => apiGetRaw(`${BASE}${path}`, params), enabled });
  const painel = q("painel", "/painel", comp ? { competencia: comp } : undefined);
  const ausencias = q("ausencias", "/ausencias", comp ? { competencia: comp } : undefined, sub === "ausencia" || sub === "relatorios");
  const equipes = q("equipes", "/equipes", comp ? { competencia: comp } : undefined, sub === "equipes" || sub === "relatorios");
  const historico = q("historico", "/historico", { meses: 12 }, ["historico", "producao", "relatorios"].includes(sub));
  const alertas = q("alertas", "/alertas", undefined, sub === "alertas");
  const fonte = q("fonte", "/fonte", undefined, sub === "integracoes");
  const caso = q("caso", `/equipe/${ineSel}`, undefined, !!ineSel);

  const qc = useQueryClient();
  const sync = useMutation({
    mutationFn: (historicoCompleto: boolean) => apiPost<any>(`${BASE}/sincronizar`, { historico: historicoCompleto }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mon-siaps"] }),
  });

  const p = painel.data;
  const semDado = p?.situacao_dado === "nao_disponivel";
  const comps: string[] = p?.competencias_coletadas ?? [];
  const compAtual: string = comp || p?.competencia || "";

  const abrirEquipe = (ine: string, competencia?: string) => { setIneSel(ine); setCompCaso(competencia ?? null); };

  // filtros comuns (equipes)
  const tipos = useMemo(() => {
    const s = new Set<string>();
    [...(equipes.data?.equipes ?? []), ...(ausencias.data?.equipes ?? [])].forEach((e: any) => e.tipo_equipe && s.add(e.tipo_equipe));
    return [...s].sort();
  }, [equipes.data, ausencias.data]);
  const passa = (e: any) => {
    if (fNivel !== "todos" && e.nivel !== fNivel) return false;
    if (fTipo !== "todos" && e.tipo_equipe !== fTipo) return false;
    const t = busca.trim().toLowerCase();
    return !t || `${e.ine} ${e.equipe}`.toLowerCase().includes(t);
  };

  const Filtros = (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "center", fontSize: 12 }}>
      <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar equipe ou INE" style={{ ...btn, minWidth: 180 }} />
      <select value={fNivel} onChange={e => setFNivel(e.target.value)} style={btn}>
        <option value="todos">Todos os níveis</option>
        {(["verde", "amarelo", "laranja", "vermelho", "cinza"] as Nivel[]).map(n => <option key={n} value={n}>{COR[n].nome}</option>)}
      </select>
      <select value={fTipo} onChange={e => setFTipo(e.target.value)} style={btn}>
        <option value="todos">Todos os tipos de equipe</option>
        {tipos.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <span style={{ color: "#374151" }} title="A fonte pública informa apenas o código de tipologia; não classifica equipes ribeirinhas ou fluviais.">
        Ribeirinha/fluvial: {NAO_DISP.toLowerCase()}
      </span>
    </div>
  );

  // ── detalhe de uma equipe ──────────────────────────────────────────────────
  if (ineSel) return <CasoEquipe ine={ineSel} compInicial={compCaso} dados={caso.data} carregando={caso.isLoading} voltar={() => setIneSel(null)} municipio={municipio} />;

  return (
    <div ref={raizRef} style={{ color: "#111827" }}>
      {/* submenus */}
      <div data-no-print style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {SUBS.map(s => (
          <button key={s.id} onClick={() => setSub(s.id)} style={{ ...btn, background: sub === s.id ? "#1d4ed8" : "#fff", color: sub === s.id ? "#fff" : "#374151", fontWeight: sub === s.id ? 700 : 400 }}>{s.label}</button>
        ))}
      </div>

      {/* identificação da fonte e da competência — nunca apresentar dado antigo como tempo real */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", fontSize: 12, color: "#374151" }}>
        <span data-print-only style={{ display: "none" }}><strong>Competência CNES:</strong> {compBr(compAtual)}</span>
        <label data-no-print>Competência CNES:{" "}
          <select value={compAtual} onChange={e => setComp(e.target.value)} style={btn} disabled={!comps.length}>
            {comps.slice().reverse().map(c => <option key={c} value={c}>{compBr(c)}</option>)}
          </select>
        </label>
        <span><strong>Última competência disponível na fonte:</strong> {compBr(p?.ultima_competencia_fonte)}</span>
        <span><strong>Relatório gerado pela fonte em:</strong> {p?.gerado_em_fonte ?? "—"}</span>
        <span><strong>Última atualização no ERSUS:</strong> {dtHora(p?.coletado_em)}</span>
        <span><strong>Origem:</strong> e-Gestor APS (relatório público)</span>
        <button style={{ ...btnP, marginLeft: "auto" }} disabled={semDado}
          onClick={() => imprimirPainel(raizRef.current, `Monitoramento SIAPS — ${SUBS.find(x => x.id === sub)?.label.replace(/^\d+\.\s*/, "")}`,
            `${municipio?.nome ?? ""}${municipio?.uf ? "/" + municipio.uf : ""} · Competência CNES ${compBr(compAtual)}`, true)}>🖨️ Imprimir / PDF</button>
      </div>
      {p?.coleta_atrasada && <Aviso tom="alerta">Existe competência mais nova na fonte ({compBr(p.ultima_competencia_fonte)}) que ainda não foi coletada. Os números abaixo são de {compBr(p.ultima_competencia_coletada)} — atualize em Integrações e Atualizações.</Aviso>}
      {painel.isLoading && <Aviso>Carregando…</Aviso>}
      {painel.isError && <Aviso tom="alerta">Não foi possível carregar o painel agora.</Aviso>}

      {/* 1 ── Visão geral */}
      {sub === "visao" && (semDado ? <SemDado msg={p?.mensagem} /> : p && (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <Card titulo="Equipes monitoradas" valor={p.cards.equipes_monitoradas} nota={`${p.cards.equipes_cadastradas_siaps} cadastradas no SIAPS/CNES`} />
            <Card titulo="Com produção válida" valor={p.cards.equipes_com_producao_valida} nivel="verde" />
            <Card titulo="Sem produção válida" valor={p.cards.equipes_sem_producao_valida} nivel={p.cards.equipes_sem_producao_valida ? "laranja" : "verde"} />
            <Card titulo="% regular" valor={p.cards.pct_regular == null ? "—" : `${p.cards.pct_regular}%`} nivel="verde" />
            <Card titulo="1 competência sem envio" valor={p.cards.uma_competencia_sem_envio} nivel="amarelo" />
            <Card titulo="2 competências sem envio" valor={p.cards.duas_competencias_sem_envio} nivel="laranja" />
            <Card titulo="3 ou mais sem envio" valor={p.cards.tres_ou_mais_competencias_sem_envio} nivel="vermelho" />
            <Card titulo="Risco de suspensão" valor={p.cards.risco_de_suspensao} nivel={p.cards.risco_de_suspensao ? "vermelho" : "verde"} nota="alerta gerencial, não é suspensão" />
            <Card titulo="Estabelecimentos c/ ausência" valor={p.cards.estabelecimentos_com_ausencia} />
            <Card titulo="Profissionais c/ ausência" valor={p.cards.profissionais_com_ausencia} />
          </div>
          <Aviso>Transmissão, processamento, rejeições e inconsistências de cada equipe por competência: veja <strong>5. Diagnóstico das Ausências</strong> (SISAB — relatório de validação, e-Gestor e CNES).</Aviso>
          {p.destaques.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Equipes com 3 ou mais competências sem envio</div>
              {p.destaques.map((d: any) => (
                <div key={d.ine} style={{ background: COR.vermelho.bg, border: `1px solid ${COR.vermelho.borda}`, borderRadius: 8, padding: "8px 12px", marginBottom: 6, fontSize: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <strong>{d.equipe}</strong> · INE {d.ine} · {d.qt_texto}
                  <button style={{ ...btn, marginLeft: "auto" }} onClick={() => abrirEquipe(d.ine)}>Ver caso</button>
                </div>
              ))}
            </div>
          )}
          {p.avisos.map((a: string) => <Aviso key={a}>{a}</Aviso>)}
        </>
      ))}

      {/* 2 ── Produção por competência */}
      {sub === "producao" && (historico.data?.situacao_dado === "nao_disponivel" ? <SemDado /> : (
        <>
          <Aviso tom="alerta">A fonte pública <strong>não publica</strong> quantidades de produção (registrada, transmitida, validada ou rejeitada). Abaixo, o que existe de oficial por competência: equipes, estabelecimentos e profissionais <em>sem</em> produção válida.</Aviso>
          <GraficoSerie serie={historico.data?.serie ?? []} />
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead><tr>{["Competência", "Equipes sem produção válida", "Estabelecimentos", "Profissionais", "Produção registrada", "Transmitida", "Validada", "Rejeitada", "Relatório gerado em"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{(historico.data?.serie ?? []).slice().reverse().map((s: any) => (
              <tr key={s.competencia}>
                <td style={td}><strong>{compBr(s.competencia)}</strong></td><td style={td}>{s.equipes_com_ausencia}</td>
                <td style={td}>{s.estabelecimentos}</td><td style={td}>{s.profissionais}</td>
                {[0, 1, 2, 3].map(i => <td key={i} style={{ ...td, color: "#4b5563", fontSize: 11 }}>{NAO_DISP}</td>)}
                <td style={td}>{s.gerado_em_fonte ?? "—"}</td>
              </tr>))}
            </tbody>
          </table>
        </>
      ))}

      {/* 3 ── Situação das equipes */}
      {sub === "equipes" && (equipes.data?.situacao_dado === "nao_disponivel" ? <SemDado msg={equipes.data?.mensagem} /> : (
        <>
          {Filtros}
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead><tr>{["INE", "Equipe", "Tipo", "Tipologia", "Situação", "Competências sem envio", "Acompanhamento", "Responsável", ""].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{(equipes.data?.equipes ?? []).filter(passa).map((e: any) => (
              <tr key={e.ine}>
                <td style={td}>{e.ine}</td><td style={td}>{e.equipe}</td><td style={td}>{e.tipo_equipe ?? "—"}</td><td style={td}>{e.tipologia ?? "—"}</td>
                <td style={td}><Selo nivel={e.nivel} /></td><td style={td}>{e.qt_texto ?? (e.nivel === "verde" ? "Nenhuma" : "—")}</td>
                <td style={td}>{e.acompanhamento ?? "—"}</td><td style={td}>{e.responsavel ?? "—"}</td>
                <td style={td}><button style={btn} onClick={() => abrirEquipe(e.ine)}>Detalhar</button></td>
              </tr>))}
            </tbody>
          </table>
        </>
      ))}

      {/* 4 ── Ausência de envio (relatório oficial) */}
      {sub === "ausencia" && (ausencias.data?.situacao_dado === "nao_disponivel" ? <SemDado msg={ausencias.data?.mensagem} /> : ausencias.data && (
        <>
          <Aviso>Equipes e serviços com ausência de envio de informação — competência CNES {compBr(ausencias.data.competencia)}. Município IBGE {ausencias.data.municipio_ibge}.</Aviso>
          {Filtros}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
            <strong>Equipes ({ausencias.data.equipes.filter(passa).length})</strong>
            <button style={btn} onClick={() => baixarCsv(`ausencia-envio-${ausencias.data.competencia}.csv`,
              ["Competência CNES", "IBGE", "INE", "Equipe", "Tipologia", "Status", "Qtde. competências consecutivas", "Nível"],
              ausencias.data.equipes.filter(passa).map((e: any) => [compBr(ausencias.data.competencia), ausencias.data.municipio_ibge, e.ine, e.equipe, e.tipologia, e.descricao, e.qt_texto, e.rotulo]))}>Exportar CSV</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", marginBottom: 14 }}>
            <thead><tr>{["Competência CNES", "UF", "Município", "IBGE", "INE", "Tipologia", "Status", "Qtde. competências consecutivas", "Nível", ""].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{ausencias.data.equipes.filter(passa).map((e: any) => (
              <tr key={e.ine}>
                <td style={td}>{compBr(ausencias.data.competencia)}</td><td style={td}>{municipio?.uf ?? "—"}</td><td style={td}>{municipio?.nome ?? "—"}</td><td style={td}>{ausencias.data.municipio_ibge}</td>
                <td style={td}>{e.ine}<div style={{ color: "#374151", fontSize: 11 }}>{e.equipe}</div></td><td style={td}>{e.tipologia ?? "—"}{e.tipo_equipe ? ` (${e.tipo_equipe})` : ""}</td>
                <td style={td}>{e.descricao}</td><td style={td}>{e.qt_texto}</td><td style={td}><Selo nivel={e.nivel} /></td>
                <td style={td}><button style={btn} onClick={() => abrirEquipe(e.ine)}>Detalhar</button></td>
              </tr>))}
              {!ausencias.data.equipes.filter(passa).length && <tr><td colSpan={10} style={{ ...td, color: "#166534" }}>Nenhuma equipe do município consta na lista de ausência nesta competência.</td></tr>}
            </tbody>
          </table>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Estabelecimentos ({ausencias.data.estabelecimentos.length})</div>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", marginBottom: 14 }}>
            <thead><tr>{["CNES", "Componente", "Status", "Competências consecutivas", "Nível"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{ausencias.data.estabelecimentos.map((e: any, i: number) => (
              <tr key={i}><td style={td}>{e.cnes}</td><td style={td}>{e.componente ?? "—"}</td><td style={td}>{e.descricao}</td><td style={td}>{e.qt_texto}</td><td style={td}><Selo nivel={e.nivel} /></td></tr>))}
              {!ausencias.data.estabelecimentos.length && <tr><td colSpan={5} style={{ ...td, color: "#374151" }}>Nenhum estabelecimento na lista.</td></tr>}
            </tbody>
          </table>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Profissionais ({ausencias.data.profissionais.length}) — CNS parcialmente oculto</div>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead><tr>{["CNS", "CBO", "CNES", "INE", "Status", "Competências consecutivas", "Nível"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{ausencias.data.profissionais.map((e: any, i: number) => (
              <tr key={i}><td style={td}>{e.cns_mascarado}</td><td style={td}>{e.cbo ?? "—"}</td><td style={td}>{e.cnes ?? "—"}</td><td style={td}>{e.ine ?? "—"}</td><td style={td}>{e.descricao}</td><td style={td}>{e.qt_texto}</td><td style={td}><Selo nivel={e.nivel} /></td></tr>))}
              {!ausencias.data.profissionais.length && <tr><td colSpan={7} style={{ ...td, color: "#374151" }}>Nenhum profissional na lista.</td></tr>}
            </tbody>
          </table>
          {ausencias.data.avisos.map((a: string) => <div key={a} style={{ fontSize: 11, color: "#374151", marginTop: 8 }}>{a}</div>)}
        </>
      ))}

      {/* 5 ── Diagnóstico das ausências */}
      {sub === "diagnostico" && <DiagnosticoMunicipal abrir={abrirEquipe} />}

      {/* 6 ── Processamento e validação */}
      {sub === "processamento" && <Processamento />}

      {/* 6 ── Alertas */}
      {sub === "alertas" && (alertas.data?.situacao_dado === "nao_disponivel" ? <SemDado msg={alertas.data?.mensagem} /> : alertas.data && (
        <>
          <Aviso>Alertas calculados sobre a competência {compBr(alertas.data.competencia)} (a mais recente coletada).</Aviso>
          {alertas.data.alertas.length === 0 && <Aviso>Nenhum alerta ativo: nenhuma equipe do município consta na lista de ausência nesta competência.</Aviso>}
          {alertas.data.alertas.map((a: any) => (
            <div key={a.ine} style={{ background: COR[a.nivel as Nivel].bg, border: `1px solid ${COR[a.nivel as Nivel].borda}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8, fontSize: 12, color: COR[a.nivel as Nivel].fg }}>
              <div style={{ fontWeight: 700 }}>{a.mensagem}</div>
              <div style={{ marginTop: 4, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <Selo nivel={a.nivel} texto={a.situacao === "risco_de_suspensao" ? "Risco de suspensão" : "Pendente de verificação"} />
                <span>Suspensão confirmada por fonte oficial: <strong>não verificada</strong></span>
                <button style={{ ...btn, marginLeft: "auto" }} onClick={() => abrirEquipe(a.ine)}>Ver caso</button>
              </div>
            </div>))}
          {alertas.data.regularizadas.length > 0 && <div style={{ fontWeight: 700, fontSize: 13, margin: "12px 0 6px" }}>Regularizadas</div>}
          {alertas.data.regularizadas.map((r: any) => (
            <div key={r.ine} style={{ background: COR.verde.bg, border: `1px solid ${COR.verde.borda}`, color: COR.verde.fg, borderRadius: 8, padding: "8px 12px", marginBottom: 6, fontSize: 12 }}>{r.mensagem}</div>))}
          {alertas.data.avisos.map((a: string) => <Aviso key={a}>{a}</Aviso>)}
          <AlertasDiagnostico abrir={abrirEquipe} />
        </>
      ))}

      {/* 7 ── Histórico */}
      {sub === "historico" && (historico.data?.situacao_dado === "nao_disponivel" ? <SemDado /> : historico.data && (
        <HistoricoView dados={historico.data} abrir={abrirEquipe} />
      ))}

      {/* 8 ── Relatórios gerenciais */}
      {sub === "relatorios" && (
        <>
          <Aviso>Relatórios gerados a partir dos dados coletados. Para PDF, abra o submenu desejado e use <strong>🖨️ Imprimir / PDF</strong> (no topo): a impressão sai só com o relatório, sem o menu do sistema.</Aviso>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={btnP} disabled={semDado || !ausencias.data?.equipes} onClick={() => baixarCsv(`ausencia-envio-${compAtual}.csv`,
              ["Competência CNES", "IBGE", "INE", "Equipe", "Tipologia", "Status", "Qtde. competências consecutivas", "Nível"],
              (ausencias.data?.equipes ?? []).map((e: any) => [compBr(compAtual), ausencias.data.municipio_ibge, e.ine, e.equipe, e.tipologia, e.descricao, e.qt_texto, e.rotulo]))}>Ausência de envio (CSV)</button>
            <button style={btnP} disabled={!equipes.data?.equipes} onClick={() => baixarCsv(`situacao-equipes-${compAtual}.csv`,
              ["INE", "Equipe", "Tipo", "Situação", "Competências sem envio", "Acompanhamento", "Responsável"],
              (equipes.data?.equipes ?? []).map((e: any) => [e.ine, e.equipe, e.tipo_equipe, e.rotulo, e.qt_texto, e.acompanhamento, e.responsavel]))}>Situação das equipes (CSV)</button>
            <button style={btnP} disabled={!historico.data?.serie} onClick={() => baixarCsv("historico-ausencia.csv",
              ["Competência", "Equipes com ausência", "Atenção", "Alto risco", "Crítico", "Estabelecimentos", "Profissionais"],
              (historico.data?.serie ?? []).map((s: any) => [compBr(s.competencia), s.equipes_com_ausencia, s.amarelo, s.laranja, s.vermelho, s.estabelecimentos, s.profissionais]))}>Histórico (CSV)</button>
          </div>
          <div style={{ fontSize: 12, color: "#374151", marginTop: 12 }}>
            Diagnóstico por equipe e competência (transmissão, validação e rejeição pelo SISAB): aba <strong>5. Diagnóstico das Ausências</strong> (CSV) ou o relatório técnico em PDF no caso de cada equipe.
          </div>
        </>
      )}

      {/* 9 ── Integrações */}
      {sub === "integracoes" && (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
            <button style={btnP} disabled={sync.isPending} onClick={() => sync.mutate(false)}>{sync.isPending ? "Atualizando…" : "Atualizar dados (3 últimas competências)"}</button>
            <button style={btn} disabled={sync.isPending} onClick={() => sync.mutate(true)}>Carregar todo o histórico publicado</button>
            <span style={{ fontSize: 11, color: "#374151" }}>Cada competência baixa o relatório nacional; pode levar alguns minutos. Requer perfil de edição.</span>
          </div>
          {sync.isError && <Aviso tom="alerta">Não foi possível atualizar: {(sync.error as any)?.response?.data?.detail ?? "fonte indisponível ou sem permissão"}.</Aviso>}
          {sync.isSuccess && <Aviso>{sync.data.coletadas.length} competência(s) coletada(s){sync.data.erros.length ? `, ${sync.data.erros.length} com erro` : ""}.</Aviso>}
          {(fonte.data?.fontes ?? []).map((f: any) => (
            <div key={f.nome} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, fontSize: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>{f.nome}</div>
              <div>Acesso: {f.acesso} · <a href={f.url} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8" }}>abrir relatório oficial</a></div>
              <div style={{ marginTop: 6 }}><strong>Informa:</strong> {f.informa.join("; ")}.</div>
              <div style={{ marginTop: 4 }}><strong>Não informa:</strong> {f.nao_informa.join("; ")}.</div>
            </div>))}
          <div style={{ fontSize: 12, color: "#374151", marginBottom: 8 }}>
            O diagnóstico das ausências usa também o relatório público de validação do SISAB e o relatório público de pagamento do e-Gestor (botão “Verificar fontes oficiais” na aba 5, e automaticamente todo dia às 06:40). O PEC municipal não é acessado.
            Última coleta: {dtHora(fonte.data?.ultima_coleta)}.
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead><tr>{["Competência", "Relatório gerado em", "Coletado em", "Por", "Equipes", "Estab.", "Profissionais"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{(fonte.data?.coletas ?? []).slice().reverse().map((c: any) => (
              <tr key={c.competencia}><td style={td}>{compBr(c.competencia)}</td><td style={td}>{c.gerado_em_fonte ?? "—"}</td><td style={td}>{dtHora(c.coletado_em)}</td><td style={td}>{c.coletado_por ?? "—"}</td><td style={td}>{c.equipes}</td><td style={td}>{c.estabelecimentos}</td><td style={td}>{c.profissionais}</td></tr>))}
              {fonte.data && !fonte.data.coletas.length && <tr><td colSpan={7} style={{ ...td, color: "#374151" }}>Nenhuma coleta feita ainda.</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// ── 7. histórico organizado ──────────────────────────────────────────────────
function HistoricoView({ dados, abrir }: { dados: any; abrir: (ine: string) => void }) {
  const [tipoEv, setTipoEv] = useState("todos");
  const [janela, setJanela] = useState("todos");
  const [busca, setBusca] = useState("");
  const comps: string[] = dados.competencias;
  const ultima = comps[comps.length - 1];
  const nivelDe = (v: number): Nivel => (!v ? "verde" : v === 1 ? "amarelo" : v === 2 ? "laranja" : "vermelho");

  const equipes = useMemo(() => dados.matriz.map((m: any) => {
    let periodos = 0, comAus = 0, maior = 0, seq = 0, anterior = -99;
    comps.forEach(c => {
      const v = m.valores[c] || 0;
      if (!v) { seq = 0; return; }
      comAus++;
      if (seq > 0 && mesNum(c) - anterior === 1) seq++; else { seq = 1; periodos++; }
      maior = Math.max(maior, seq); anterior = mesNum(c);
    });
    return { ...m, periodos, comAus, maior, ult: m.valores[ultima] || 0 };
  }).sort((a: any, b: any) => (b.ult > 0 ? 1 : 0) - (a.ult > 0 ? 1 : 0) || b.periodos - a.periodos || b.comAus - a.comAus), [dados]);   // eslint-disable-line react-hooks/exhaustive-deps

  const entradas = dados.eventos.filter((e: any) => e.tipo === "entrou_em_ausencia").length;
  const regulariz = dados.eventos.length - entradas;
  const termo = busca.trim().toLowerCase();
  const recorte = janela === "todos" ? comps : comps.slice(-Number(janela));
  const eventos = dados.eventos.filter((e: any) => recorte.includes(e.competencia)
    && (tipoEv === "todos" || e.tipo === tipoEv) && (!termo || `${e.ine} ${e.equipe}`.toLowerCase().includes(termo)));
  const grupos = comps.slice().reverse().map(c => ({
    c, entram: eventos.filter((e: any) => e.competencia === c && e.tipo === "entrou_em_ausencia"),
    reg: eventos.filter((e: any) => e.competencia === c && e.tipo === "regularizada"),
  })).filter(g => g.entram.length || g.reg.length);

  const chip = (e: any, nivel: Nivel) => (
    <span key={e.ine} onClick={() => abrir(e.ine)} title={`INE ${e.ine}`}
      style={{ display: "inline-block", margin: "2px 4px 2px 0", padding: "2px 9px", borderRadius: 12, cursor: "pointer", fontSize: 12,
        background: COR[nivel].bg, color: COR[nivel].fg, border: `1px solid ${COR[nivel].borda}` }}>{e.equipe}</span>
  );

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <Card titulo="Equipes que já constaram na lista" valor={equipes.length} nota={`${compBr(comps[0])} a ${compBr(ultima)}`} />
        <Card titulo={`Em ausência em ${compBr(ultima)}`} valor={equipes.filter((e: any) => e.ult > 0).length} nivel={equipes.some((e: any) => e.ult > 0) ? "vermelho" : "verde"} />
        <Card titulo="Reincidentes (2+ períodos)" valor={equipes.filter((e: any) => e.periodos >= 2).length} nivel="laranja" />
        <Card titulo="Entradas em ausência" valor={entradas} nota="mudanças entre competências vizinhas" />
        <Card titulo="Regularizações" valor={regulariz} nivel="verde" />
      </div>

      <GraficoSerie serie={dados.serie} />

      <Painel titulo="Resumo por equipe" cor="#0f766e">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Equipe", "INE", "Tipo", "Competências com ausência", "Períodos", "Maior período seguido", `Situação em ${compBr(ultima)}`, ""].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{equipes.map((e: any) => (
              <tr key={e.ine}>
                <td style={td}><strong>{e.equipe}</strong></td><td style={td}>{e.ine}</td><td style={td}>{e.tipo_equipe ?? "—"}</td>
                <td style={td}>{e.comAus} de {comps.length}</td>
                <td style={td}>{e.periodos}{e.periodos >= 2 ? " (reincidente)" : ""}</td>
                <td style={td}>{e.maior} comp.</td>
                <td style={td}><Selo nivel={nivelDe(e.ult)} texto={e.ult ? (e.ult > 3 ? "Superior a 03" : `${e.ult} competência${e.ult > 1 ? "s" : ""}`) : "Sem ausência"} /></td>
                <td style={td}><button style={btn} onClick={() => abrir(e.ine)}>Detalhar</button></td>
              </tr>))}
              {!equipes.length && <tr><td style={td} colSpan={8}>Nenhuma equipe do município apareceu na lista de ausência nas competências coletadas.</td></tr>}
            </tbody>
          </table>
        </div>
      </Painel>

      <Painel titulo="Mapa por competência (nº de competências consecutivas sem envio; ok = sem ausência)" cor="#ea580c">
        <div style={{ overflow: "auto", maxHeight: 440, border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 600 }}>
            <thead><tr>
              <th style={{ ...th, position: "sticky", top: 0, left: 0, zIndex: 3, minWidth: 190 }}>Equipe</th>
              {comps.map(c => <th key={c} style={{ ...th, position: "sticky", top: 0, zIndex: 2, textAlign: "center", minWidth: 58 }}>{compBr(c)}</th>)}
            </tr></thead>
            <tbody>{equipes.map((m: any) => (
              <tr key={m.ine}>
                <td style={{ ...td, position: "sticky", left: 0, background: "#fff", zIndex: 1 }}>
                  <a style={{ cursor: "pointer", color: "#1d4ed8", fontWeight: 600 }} onClick={() => abrir(m.ine)}>{m.equipe}</a>
                  <div style={{ color: "#374151", fontSize: 11 }}>INE {m.ine}</div>
                </td>
                {comps.map(c => {
                  const v = m.valores[c] || 0; const n = nivelDe(v);
                  return <td key={c} style={{ ...td, textAlign: "center", background: COR[n].bg, color: COR[n].fg, fontWeight: 700, borderLeft: "1px solid #fff" }}>{v ? (v > 3 ? ">3" : v) : "ok"}</td>;
                })}
              </tr>))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <Selo nivel="verde" texto="ok = sem ausência" /><Selo nivel="amarelo" texto="1 competência" /><Selo nivel="laranja" texto="2 competências" /><Selo nivel="vermelho" texto="3 ou mais (>3 = superior a 3)" />
        </div>
      </Painel>

      <Painel titulo="Movimentações por competência" cor="#1d4ed8">
        <div data-no-print style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <select value={tipoEv} onChange={e => setTipoEv(e.target.value)} style={btn}>
            <option value="todos">Entradas e regularizações</option><option value="entrou_em_ausencia">Só entradas em ausência</option><option value="regularizada">Só regularizações</option>
          </select>
          <select value={janela} onChange={e => setJanela(e.target.value)} style={btn}>
            <option value="todos">Todo o período</option><option value="3">Últimas 3 competências</option><option value="6">Últimas 6 competências</option>
          </select>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar equipe ou INE" style={{ ...btn, minWidth: 180 }} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ ...th, width: 110 }}>Competência</th><th style={th}>Entraram em ausência</th><th style={th}>Regularizadas</th></tr></thead>
            <tbody>{grupos.map(g => (
              <tr key={g.c}>
                <td style={td}><strong>{compBr(g.c)}</strong></td>
                <td style={td}>{g.entram.length ? g.entram.map((e: any) => chip(e, "laranja")) : <span style={{ color: "#4b5563" }}>—</span>}</td>
                <td style={td}>{g.reg.length ? g.reg.map((e: any) => chip(e, "verde")) : <span style={{ color: "#4b5563" }}>—</span>}</td>
              </tr>))}
              {!grupos.length && <tr><td style={td} colSpan={3}>Nenhuma movimentação com esses filtros (a comparação só vale entre competências coletadas e vizinhas).</td></tr>}
            </tbody>
          </table>
        </div>
      </Painel>
    </>
  );
}

// ── gráfico de 12 meses ──────────────────────────────────────────────────────
function GraficoSerie({ serie }: { serie: any[] }) {
  if (!serie.length) return null;
  const dados = serie.map(s => ({ ...s, mes: compBr(s.competencia) }));
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, marginBottom: 12, height: 240 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Equipes sem produção válida por competência (últimos 12 meses coletados)</div>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mes" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} />
          <Tooltip /><Legend />
          <Bar dataKey="amarelo" name="1 competência" stackId="a" fill="#eab308" />
          <Bar dataKey="laranja" name="2 competências" stackId="a" fill="#f97316" />
          <Bar dataKey="vermelho" name="3 ou mais" stackId="a" fill="#dc2626" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 6. Processamento e validação ─────────────────────────────────────────────
const FONTE_ETAPA = [
  "Não acessado pelo ERSUS360 — conferir no PEC",
  "SISAB: fichas recebidas por equipe (Diagnóstico)",
  "SISAB: recebidas no prazo × fora do prazo (Diagnóstico)",
  "SISAB: aprovadas, duplicadas, data inválida (Diagnóstico)",
  "SISAB: reprovadas por CNES, INE, PROF, CBO (Diagnóstico)",
  "e-Gestor: lista oficial de ausência de envio",
];
function Processamento() {
  const { data: cal } = useCalendarioSiaps();
  const etapas = ["Registro no e-SUS APS/PEC", "Transmissão ao SISAB", "Recebimento", "Processamento", "Validação", "Disponível no SIAPS"];
  return (
    <>
      <Aviso>Recebimento, processamento e validação de cada equipe são verificados por competência em <strong>5. Diagnóstico das Ausências</strong>, pelo relatório público de validação do SISAB. O registro no PEC municipal não é acessado pelo ERSUS360. Nenhum status é presumido.</Aviso>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {etapas.map((e, i) => (
          <div key={e} style={{ background: COR.cinza.bg, border: `1px solid ${COR.cinza.borda}`, borderRadius: 8, padding: "8px 10px", fontSize: 11, flex: "1 1 130px" }}>
            <div style={{ fontWeight: 700 }}>{i + 1}. {e}</div><div style={{ color: "#374151", marginTop: 2 }}>{FONTE_ETAPA[i]}</div>
          </div>))}
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Calendário de prazos de envio ao SIAPS</div>
      {cal ? (
        <>
          <div style={{ fontSize: 11, color: "#374151", marginBottom: 6 }}>Fonte: {cal.fonte}. Confira sempre no calendário oficial vigente.</div>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead><tr>{["Competência", "Início do envio", "Prazo final (10º dia útil)", "Relatório disponível em", "Situação"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{cal.calendario.map(c => (
              <tr key={c.competencia}><td style={td}>{c.nome}</td><td style={td}>{dataBr(c.inicio)}</td><td style={td}><strong>{dataBr(c.data_limite)}</strong></td><td style={td}>{dataBr(c.data_relatorio)}</td>
                <td style={td}>{c.dias_para_limite < 0 ? "Encerrado" : c.dias_para_limite === 0 ? "Termina hoje" : `Faltam ${c.dias_para_limite} dias`}</td></tr>))}
            </tbody>
          </table>
        </>
      ) : <div style={{ fontSize: 12, color: "#374151" }}>Calendário indisponível no momento.</div>}
    </>
  );
}

// ── detalhe da equipe (painel do caso) ───────────────────────────────────────
const mesNum = (c: string) => Number(c.slice(0, 4)) * 12 + Number(c.slice(5, 7)) - 1;
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface Periodo { de: string; ate: string; duracao: number; pior: Nivel; texto: string | null; qt: number; emCurso: boolean }

// Períodos seguidos em que a equipe constou na lista de ausência (só competências coletadas e vizinhas)
function periodosDeAusencia(linha: any[]): Periodo[] {
  const out: Periodo[] = [];
  let atual: Periodo | null = null;
  linha.forEach((t, i) => {
    const ausente = t.nivel !== "verde" && t.nivel !== "cinza";
    const vizinha = atual && mesNum(t.competencia) - mesNum(atual.ate) === 1;
    if (ausente && atual && vizinha) {
      atual.ate = t.competencia; atual.duracao += 1;
      if ((t.qt_consecutivas ?? 0) > atual.qt) { atual.pior = t.nivel; atual.texto = t.qt_texto; atual.qt = t.qt_consecutivas ?? 0; }
    } else if (ausente) {
      atual = { de: t.competencia, ate: t.competencia, duracao: 1, pior: t.nivel, texto: t.qt_texto, qt: t.qt_consecutivas ?? 0, emCurso: false };
      out.push(atual);
    } else atual = null;
    if (atual && i === linha.length - 1) atual.emCurso = true;
  });
  return out;
}

function Painel({ titulo, children, cor }: { titulo: string; children: React.ReactNode; cor?: string }) {
  return (
    <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderTop: `3px solid ${cor ?? "#1d4ed8"}`, borderRadius: 10, padding: "12px 14px", marginBottom: 12, color: "#111827" }}>
      <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#111827" }}>{titulo}</h3>
      {children}
    </section>
  );
}

function CasoEquipe({ ine, compInicial, dados, carregando, voltar, municipio }: { ine: string; compInicial?: string | null; dados: any; carregando: boolean; voltar: () => void; municipio?: { uf?: string; nome?: string } }) {
  const qc = useQueryClient();
  const raizRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<{ situacao: string; responsavel: string; observacao: string } | null>(null);
  const salvar = useMutation({
    mutationFn: (f: any) => apiPut(`${BASE}/equipe/${ine}/acompanhamento`, f),
    onSuccess: () => { setForm(null); qc.invalidateQueries({ queryKey: ["mon-siaps"] }); },
  });
  const a = dados?.acompanhamento;
  const f = form ?? { situacao: a?.situacao ?? "pendente", responsavel: a?.responsavel ?? "", observacao: a?.observacao ?? "" };

  const resumo = useMemo(() => {
    if (!dados?.linha_do_tempo) return null;
    const linha: any[] = dados.linha_do_tempo;
    const total = linha.length;
    const comAus = linha.filter(t => t.nivel !== "verde" && t.nivel !== "cinza").length;
    const periodos = periodosDeAusencia(linha);
    const maior = periodos.reduce<Periodo | null>((m, p) => (!m || p.duracao > m.duracao ? p : m), null);
    const atual = linha[linha.length - 1];
    // reincidência = saiu da lista (competência coletada sem ausência) e voltou a constar depois
    const reincidiu = periodos.some((p, i) => i > 0 && linha.some(t => t.nivel === "verde" && t.competencia > periodos[i - 1].ate && t.competencia < p.de));
    return { linha, total, comAus, semAus: total - comAus, periodos, maior, atual, reincidiu, primeira: linha[0].competencia };
  }, [dados]);

  const kpi = (rotulo: string, valor: React.ReactNode, nota?: string, nivel?: Nivel) => {
    const c = nivel ? COR[nivel] : null;
    return (
      <div style={{ background: c?.bg ?? "#fff", border: `1px solid ${c?.borda ?? "#e5e7eb"}`, borderRadius: 10, padding: "10px 12px", flex: "1 1 170px", minWidth: 150 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: c?.fg ?? "#4b5563" }}>{rotulo}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: c?.fg ?? "#111827", lineHeight: 1.2 }}>{valor}</div>
        {nota && <div style={{ fontSize: 11, color: c?.fg ?? "#4b5563", marginTop: 2 }}>{nota}</div>}
      </div>
    );
  };

  const anos = resumo ? [...new Set(resumo.linha.map((t: any) => t.competencia.slice(0, 4)))] : [];
  const porComp: Record<string, any> = resumo ? Object.fromEntries(resumo.linha.map((t: any) => [t.competencia, t])) : {};

  return (
    <div ref={raizRef} style={{ color: "#111827" }}>
      <div data-no-print style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <button style={btn} onClick={voltar}>← Voltar ao Monitoramento SIAPS</button>
        {dados?.ine && <button style={btnP} onClick={() => imprimirPainel(raizRef.current, `Relatório técnico — ausência de envio — ${dados.equipe}`,
          `INE ${dados.ine} · ${municipio?.nome ?? ""}${municipio?.uf ? "/" + municipio.uf : ""}`, false)}>🖨️ Imprimir / PDF</button>}
      </div>
      {carregando && <Aviso>Carregando…</Aviso>}
      {dados?.situacao_dado === "nao_disponivel" && <SemDado msg={dados.mensagem} />}
      {dados?.ine && resumo && (
        <>
          {/* cabeçalho */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: 20, color: "#111827" }}>{dados.equipe}</h2>
            <span style={{ fontSize: 12, color: "#374151" }}>INE {dados.ine} · tipologia {dados.tipologia ?? "—"}{dados.tipo_equipe ? ` · ${dados.tipo_equipe}` : ""}</span>
          </div>

          {/* indicadores */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            {kpi(`Situação em ${compBr(resumo.atual.competencia)}`, resumo.atual.nivel === "verde" ? "Sem ausência" : COR[resumo.atual.nivel as Nivel].nome,
              resumo.atual.qt_texto ?? "competência mais recente coletada", resumo.atual.nivel)}
            {kpi("Competências coletadas", resumo.total, `${compBr(resumo.primeira)} a ${compBr(resumo.atual.competencia)}`)}
            {kpi("Com ausência de envio", resumo.comAus, `${resumo.total ? Math.round(100 * resumo.comAus / resumo.total) : 0}% do período`, resumo.comAus ? "laranja" : "verde")}
            {kpi("Sem ausência", resumo.semAus, undefined, "verde")}
            {kpi("Maior período seguido", resumo.maior ? `${resumo.maior.duracao} comp.` : "—", resumo.maior ? `${compBr(resumo.maior.de)} a ${compBr(resumo.maior.ate)}` : "nenhum")}
            {kpi("Períodos de ausência", resumo.periodos.length, resumo.reincidiu ? "houve reincidência" : undefined, resumo.reincidiu ? "vermelho" : undefined)}
          </div>

          {/* leitura do caso */}
          <Painel titulo="Resumo do caso" cor="#0f766e">
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
              <li>
                A equipe constou na lista de ausência de envio em <strong>{resumo.comAus} de {resumo.total}</strong> competências coletadas
                ({compBr(resumo.primeira)} a {compBr(resumo.atual.competencia)}).
              </li>
              {resumo.maior && (
                <li>
                  Maior período seguido: <strong>{resumo.maior.duracao} competências</strong> ({compBr(resumo.maior.de)} a {compBr(resumo.maior.ate)}),
                  chegando a “{resumo.maior.texto ?? "—"}”.
                </li>
              )}
              {resumo.reincidiu && (
                <li><strong>Reincidência:</strong> a equipe saiu da lista e voltou a constar depois — a regularização anterior não se manteve.</li>
              )}
              <li>
                {resumo.atual.nivel === "verde"
                  ? <>Na competência mais recente coletada ({compBr(resumo.atual.competencia)}) <strong>não consta</strong> na lista. Isso indica regularização do envio, mas <strong>não informa</strong> se houve suspensão de recurso no período.</>
                  : <>Na competência mais recente coletada ({compBr(resumo.atual.competencia)}) <strong>continua na lista</strong>: {resumo.atual.qt_texto}.</>}
              </li>
              <li>Suspensão de recurso: ver “Possíveis consequências” no diagnóstico de cada competência (validação da equipe no pagamento do e-Gestor); se não verificada, confirmar no Relatório de Pagamento (e-Gestor).</li>
            </ul>
          </Painel>

          {/* mapa de calor */}
          <Painel titulo="Linha do tempo por competência">
            {anos.map(ano => (
              <div key={ano} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                <strong style={{ width: 44, fontSize: 12 }}>{ano}</strong>
                {MESES.map((m, i) => ({ m, i, comp: `${ano}-${String(i + 1).padStart(2, "0")}` }))
                  .filter(({ comp }) => comp >= resumo.primeira && comp <= resumo.atual.competencia)
                  .map(({ m, comp }) => {
                  const t = porComp[comp];
                  const c = t ? COR[t.nivel as Nivel] : null;
                  return (
                    <div key={comp} title={t ? `${compBr(comp)} — ${t.qt_texto ?? "Sem ausência"}` : `${compBr(comp)} — não coletada`}
                      style={{ width: 52, padding: "5px 0", textAlign: "center", borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: c?.bg ?? "#f9fafb", color: c?.fg ?? "#4b5563", border: `1px ${t ? "solid" : "dashed"} ${c?.borda ?? "#d1d5db"}` }}>
                      {m}
                      <div style={{ fontSize: 10, fontWeight: 600 }}>{t ? (t.nivel === "verde" ? "ok" : t.qt_consecutivas > 3 ? ">3" : t.qt_consecutivas) : "—"}</div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, fontSize: 11, color: "#374151", alignItems: "center" }}>
              <Selo nivel="verde" texto="ok = sem ausência" /><Selo nivel="amarelo" texto="1 competência" /><Selo nivel="laranja" texto="2 competências" />
              <Selo nivel="vermelho" texto="3 ou mais (>3 = superior a 3)" /><span style={{ border: "1px dashed #d1d5db", borderRadius: 12, padding: "2px 10px" }}>— competência não coletada</span>
            </div>
          </Painel>

          {/* períodos */}
          <Painel titulo="Períodos de ausência" cor="#ea580c">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Início", "Fim", "Duração", "Pior situação", "Estado"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>{resumo.periodos.map(p => (
                  <tr key={p.de}>
                    <td style={td}>{compBr(p.de)}</td><td style={td}>{compBr(p.ate)}</td><td style={td}>{p.duracao} competência{p.duracao > 1 ? "s" : ""}</td>
                    <td style={td}><Selo nivel={p.pior} texto={p.texto ?? undefined} /></td>
                    <td style={td}>{p.emCurso ? <strong style={{ color: COR.vermelho.fg }}>em curso</strong> : "encerrado (saiu da lista)"}</td>
                  </tr>))}
                  {!resumo.periodos.length && <tr><td style={{ ...td, color: "#166534" }} colSpan={5}>Nenhum período de ausência nas competências coletadas.</td></tr>}
                </tbody>
              </table>
            </div>
          </Painel>

          {/* diagnóstico técnico por competência (SISAB, e-Gestor, CNES) */}
          <DiagnosticoEquipe ine={ine} compInicial={compInicial} municipio={municipio} />

          {/* causas e providências */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
            <Painel titulo="Possíveis causas gerais (roteiro de investigação)" cor="#b45309">
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.55 }}>{dados.possiveis_causas.map((c: string) => <li key={c}>{c}</li>)}</ul>
            </Painel>
            <Painel titulo="Providências gerais" cor="#15803d">
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.55 }}>{dados.providencias_recomendadas.map((c: string) => <li key={c}>{c}</li>)}</ol>
            </Painel>
          </div>
          <div style={{ fontSize: 11, color: "#4b5563", margin: "0 0 12px" }}>{dados.orientacao_nota}</div>

          {/* acompanhamento */}
          <Painel titulo="Acompanhamento" cor="#1d4ed8">
            <div data-print-only style={{ display: "none", fontSize: 13, lineHeight: 1.6 }}>
              <div>Situação: <strong>{({ pendente: "Pendente", em_acompanhamento: "Em acompanhamento", regularizado: "Regularizado", sem_providencia: "Sem providência" } as Record<string, string>)[a?.situacao ?? "pendente"]}</strong></div>
              <div>Responsável: <strong>{a?.responsavel || "—"}</strong></div>
              <div>Observação: {a?.observacao || "—"}</div>
            </div>
            <div data-no-print style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
              <select value={f.situacao} onChange={e => setForm({ ...f, situacao: e.target.value })} style={btn}>
                <option value="pendente">Pendente</option><option value="em_acompanhamento">Em acompanhamento</option>
                <option value="regularizado">Regularizado</option><option value="sem_providencia">Sem providência</option>
              </select>
              <input value={f.responsavel} onChange={e => setForm({ ...f, responsavel: e.target.value })} placeholder="Responsável" style={{ ...btn, minWidth: 200 }} />
              <textarea value={f.observacao} onChange={e => setForm({ ...f, observacao: e.target.value })} placeholder="Observação" rows={2} style={{ ...btn, minWidth: 260, flex: 1 }} />
              <button style={btnP} disabled={salvar.isPending} onClick={() => salvar.mutate(f)}>{salvar.isPending ? "Salvando…" : "Salvar"}</button>
            </div>
            {salvar.isError && <div style={{ color: "#b91c1c", marginTop: 6, fontSize: 12 }}>Não foi possível salvar (sem permissão de edição?).</div>}
            {a?.atualizado_em && <div style={{ color: "#4b5563", marginTop: 6, fontSize: 12 }}>Última atualização: {dtHora(a.atualizado_em)} por {a.atualizado_por}</div>}
          </Painel>
        </>
      )}
    </div>
  );
}

// ── Diagnóstico técnico da ausência de envio ─────────────────────────────────
// Cruza a lista oficial de ausência com o retorno oficial do processamento (SISAB — relatório público de
// validação), a validação da equipe no pagamento do e-Gestor e o XML-CNES do mesmo mês. O backend nunca
// promove indício a causa; esta tela só mostra o que veio de lá.
type Classe = "causa_confirmada" | "possivel_causa" | "sem_inconsistencia" | "indisponivel";
const COR_CLASSE: Record<Classe, { fg: string; bg: string; borda: string; nome: string }> = {
  causa_confirmada:   { fg: "#991b1b", bg: "#fee2e2", borda: "#fca5a5", nome: "Causa confirmada" },
  possivel_causa:     { fg: "#854d0e", bg: "#fef9c3", borda: "#fde047", nome: "Possível causa" },
  sem_inconsistencia: { fg: "#1e40af", bg: "#eff6ff", borda: "#bfdbfe", nome: "Sem inconsistência identificada" },
  indisponivel:       { fg: "#4b5563", bg: "#f3f4f6", borda: "#d1d5db", nome: "Diagnóstico indisponível" },
};
const COR_ACHADO: Record<string, string> = { confirmada: "#991b1b", possivel: "#854d0e", informativo: "#1e40af" };
const ROT_ACHADO: Record<string, string> = { confirmada: "Confirmado", possivel: "Indício", informativo: "Informativo" };
const ROT_CAT: Record<string, string> = { A: "Registro", B: "Transmissão/processamento", C: "Cadastro", D: "SIAPS" };
const ETAPA_OK = new Set(["recebido", "processado", "regular"]);
const ETAPA_RUIM = new Set(["nao_recebido", "sem_registros", "pendencia", "ausencia"]);

function SeloClasse({ c }: { c: Classe }) {
  const k = COR_CLASSE[c] ?? COR_CLASSE.indisponivel;
  return <span style={{ background: k.bg, color: k.fg, border: `1px solid ${k.borda}`, borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{k.nome.toUpperCase()}</span>;
}
function Etapa({ e }: { e?: any }) {
  if (!e) return <span>—</span>;
  const cor = ETAPA_OK.has(e.status) ? "#166534" : ETAPA_RUIM.has(e.status) ? "#991b1b" : "#4b5563";
  return (
    <div>
      <div style={{ color: cor, fontWeight: 600 }}>{e.texto}</div>
      <div style={{ fontSize: 11, color: "#4b5563" }}>{e.fonte}{e.consultado_em ? ` · consultado em ${dtHora(e.consultado_em)}` : ""}</div>
    </div>
  );
}

// estado da verificação das fontes oficiais (roda em segundo plano no servidor)
function useVerificacao() {
  const qc = useQueryClient();
  const estado = useQuery<any>({
    queryKey: ["mon-siaps-verif"], queryFn: () => apiGetRaw(`${BASE}/diagnostico/verificacao`),
    refetchInterval: q => (q.state.data?.em_andamento ? 5000 : false),
  });
  const andando = !!estado.data?.em_andamento;
  const antes = useRef(andando);
  useEffect(() => {
    if (antes.current && !andando) qc.invalidateQueries({ queryKey: ["mon-siaps"] });
    antes.current = andando;
  }, [andando, qc]);
  const iniciar = useMutation({
    mutationFn: (competencias?: string[]) => apiPost<any>(`${BASE}/diagnostico/verificar`, competencias ? { competencias } : {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mon-siaps-verif"] }),
  });
  return { estado: estado.data, andando, iniciar };
}

function BotaoVerificar({ competencias, rotulo }: { competencias?: string[]; rotulo?: string }) {
  const { estado, andando, iniciar } = useVerificacao();
  const r = estado?.resultado;
  return (
    <div data-no-print style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 12, color: "#374151" }}>
      <button style={btnP} disabled={andando || iniciar.isPending} onClick={() => iniciar.mutate(competencias)}>
        {andando ? "Verificando fontes oficiais…" : rotulo ?? "🔎 Verificar fontes oficiais"}
      </button>
      {andando && <span>Consultando SISAB e e-Gestor ({estado?.competencias?.length ?? 0} competência(s), cerca de 30 s cada). Pode continuar usando o sistema.</span>}
      {!andando && r && !r.erro && <span>Última verificação: {dtHora(estado?.concluido_em)} — {r.consultas?.length ?? 0} consulta(s){r.erros?.length ? `, ${r.erros.length} com erro` : ""}{r.alteradas?.length ? `, ${r.alteradas.length} com dados alterados` : ""}.</span>}
      {!andando && r?.erro && <span style={{ color: "#b91c1c" }}>{r.erro}</span>}
      {iniciar.isError && <span style={{ color: "#b91c1c" }}>{(iniciar.error as any)?.response?.data?.detail ?? "Não foi possível iniciar (sem permissão de edição?)."}</span>}
    </div>
  );
}

// ── 5. Diagnóstico das ausências (resumo gerencial do município) ─────────────
function DiagnosticoMunicipal({ abrir }: { abrir: (ine: string, comp?: string) => void }) {
  const { data: d, isLoading, isError } = useQuery<any>({ queryKey: ["mon-siaps", "diag-resumo"], queryFn: () => apiGetRaw(`${BASE}/diagnostico/resumo`) });
  const [fComp, setFComp] = useState("todas");
  const [fEst, setFEst] = useState("todos");
  const [fTipo, setFTipo] = useState("todos");
  const [fClasse, setFClasse] = useState("todas");
  const [busca, setBusca] = useState("");
  if (isLoading) return <Aviso>Carregando…</Aviso>;
  if (isError) return <Aviso tom="alerta">Não foi possível carregar o diagnóstico agora.</Aviso>;
  if (!d || d.situacao_dado === "nao_disponivel") return <SemDado msg={d?.mensagem} />;
  const casos: any[] = d.casos;
  const uniq = (k: string) => [...new Set(casos.map(c => c[k]).filter(Boolean))].sort() as string[];
  const t = busca.trim().toLowerCase();
  const vis = casos.filter(c => (fComp === "todas" || c.competencia === fComp) && (fEst === "todos" || c.estabelecimento === fEst)
    && (fTipo === "todos" || c.tipo_equipe === fTipo) && (fClasse === "todas" || c.classificacao === fClasse)
    && (!t || `${c.ine} ${c.equipe}`.toLowerCase().includes(t)));
  const k = d.cards;
  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <Card titulo="Equipes monitoradas" valor={k.equipes_monitoradas} />
        <Card titulo="Equipes com ausência" valor={k.equipes_com_ausencia} nivel={k.equipes_com_ausencia ? "laranja" : "verde"} nota="nas competências coletadas" />
        <Card titulo="Competências afetadas" valor={k.competencias_afetadas} nota={`${k.casos} caso(s) equipe × competência`} />
        <Card titulo="Inconsistências confirmadas" valor={k.inconsistencias_confirmadas} nivel={k.inconsistencias_confirmadas ? "vermelho" : undefined} />
        <Card titulo="Possíveis inconsistências" valor={k.possiveis_inconsistencias} nivel={k.possiveis_inconsistencias ? "amarelo" : undefined} />
        <Card titulo="Sem diagnóstico conclusivo" valor={k.sem_diagnostico_conclusivo} nivel="cinza" nota={k.indisponiveis ? `${k.indisponiveis} sem dados suficientes` : undefined} />
        <Card titulo="Equipes com reincidência" valor={k.equipes_com_reincidencia} nivel={k.equipes_com_reincidencia ? "vermelho" : undefined} />
        <Card titulo="Pendências p/ intervenção da SMS" valor={k.pendencias_intervencao_sms} nivel={k.pendencias_intervencao_sms ? "laranja" : "verde"} nota={`ausência em curso em ${compBr(d.competencia_mais_recente)}`} />
      </div>
      <div style={{ marginBottom: 12 }}><BotaoVerificar /></div>
      {d.avisos.map((a: string) => <Aviso key={a}>{a}</Aviso>)}

      <PreviaSisab abrir={abrir} />

      {d.pendencias_intervencao_sms.length > 0 && (
        <Painel titulo={`Pendências que exigem intervenção da Secretaria — ${compBr(d.competencia_mais_recente)}`} cor="#ea580c">
          {d.pendencias_intervencao_sms.map((p: any) => (
            <div key={p.ine} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 13, padding: "4px 0", borderBottom: "1px solid #eef0f3" }}>
              <strong>{p.equipe}</strong> · INE {p.ine} · acompanhamento: {p.acompanhamento}{p.responsavel ? ` (${p.responsavel})` : ""}
              <button data-no-print style={{ ...btn, marginLeft: "auto" }} onClick={() => abrir(p.ine, d.competencia_mais_recente)}>Ver diagnóstico</button>
            </div>))}
        </Painel>
      )}

      <div data-no-print style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "center", fontSize: 12 }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar equipe ou INE" style={{ ...btn, minWidth: 180 }} />
        <select value={fComp} onChange={e => setFComp(e.target.value)} style={btn}>
          <option value="todas">Todas as competências</option>{uniq("competencia").reverse().map(c => <option key={c} value={c}>{compBr(c)}</option>)}
        </select>
        <select value={fEst} onChange={e => setFEst(e.target.value)} style={btn}>
          <option value="todos">Todos os estabelecimentos</option>{uniq("estabelecimento").map(c => <option key={c} value={c}>CNES {c}</option>)}
        </select>
        <select value={fTipo} onChange={e => setFTipo(e.target.value)} style={btn}>
          <option value="todos">Todos os tipos de equipe</option>{uniq("tipo_equipe").map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={fClasse} onChange={e => setFClasse(e.target.value)} style={btn}>
          <option value="todas">Todas as situações</option>{(Object.keys(COR_CLASSE) as Classe[]).map(c => <option key={c} value={c}>{COR_CLASSE[c].nome}</option>)}
        </select>
        <button style={btn} onClick={() => baixarCsv("diagnostico-ausencias.csv",
          ["Competência", "INE", "Equipe", "Tipo", "CNES", "Diagnóstico", "Causa", "Situação SIAPS", "Última verificação"],
          vis.map(c => [compBr(c.competencia), c.ine, c.equipe, c.tipo_equipe, c.estabelecimento, c.classificacao_rotulo, c.causa, c.situacao_siaps, dtHora(c.ultima_verificacao)]))}>CSV</button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead><tr>{["Competência", "Equipe", "INE", "Tipo", "CNES", "Diagnóstico", "Causa / indício principal", "Última verificação", ""].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {vis.map(c => (
              <tr key={c.ine + c.competencia}>
                <td style={td}>{compBr(c.competencia)}</td><td style={td}>{c.equipe}</td><td style={td}>{c.ine}</td><td style={td}>{c.tipo_equipe ?? "—"}</td>
                <td style={td}>{c.estabelecimento ?? "—"}</td><td style={td}><SeloClasse c={c.classificacao} /></td><td style={td}>{c.causa}</td>
                <td style={td}>{dtHora(c.ultima_verificacao)}</td>
                <td style={td}><button data-no-print style={btn} onClick={() => abrir(c.ine, c.competencia)}>Ver diagnóstico</button></td>
              </tr>))}
            {!vis.length && <tr><td colSpan={9} style={{ ...td, color: "#374151" }}>Nenhum caso com os filtros escolhidos.</td></tr>}
          </tbody>
        </table>
      </div>

      <details style={{ marginTop: 12, fontSize: 12 }}>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>Evidências oficiais consultadas ({d.evidencias.length})</summary>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", marginTop: 6 }}>
          <thead><tr>{["Fonte", "Competência", "Situação", "Consultado em", "Observação"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{d.evidencias.map((e: any) => (
            <tr key={e.fonte + e.competencia}><td style={td}>{e.fonte}</td><td style={td}>{compBr(e.competencia)}</td>
              <td style={td}>{({ ok: "consultado", nao_publicado: "ainda não publicado", erro: "erro na consulta" } as Record<string, string>)[e.situacao] ?? e.situacao}</td>
              <td style={td}>{dtHora(e.consultado_em)}</td><td style={td}>{e.mensagem ?? ""}</td></tr>))}
            {!d.evidencias.length && <tr><td colSpan={5} style={{ ...td, color: "#374151" }}>Nenhuma consulta feita ainda — use “Verificar fontes oficiais”.</td></tr>}
          </tbody>
        </table>
      </details>
    </>
  );
}

// ── alertas do diagnóstico (aba de alertas) ──────────────────────────────────
const ROT_ALERTA: Record<string, string> = {
  nova_ocorrencia: "Nova ocorrência", consecutivas: "Competências consecutivas", reincidencia: "Reincidência após regularização",
  rejeicao: "Rejeição no processamento", divergencia_cadastral: "Divergência cadastral",
  alteracao_processamento: "Alteração nos dados oficiais", sem_solucao: "Pendência sem solução",
};
const COR_GRAV: Record<string, Nivel> = { critico: "vermelho", alto: "laranja", atencao: "amarelo", info: "cinza" };

function AlertasDiagnostico({ abrir }: { abrir: (ine: string, comp?: string) => void }) {
  const { data: d } = useQuery<any>({ queryKey: ["mon-siaps", "diag-alertas"], queryFn: () => apiGetRaw(`${BASE}/diagnostico/alertas`) });
  if (!d || d.situacao_dado === "nao_disponivel") return null;
  return (
    <Painel titulo="Alertas do diagnóstico" cor="#b91c1c">
      {!d.alertas.length && <div style={{ fontSize: 13, color: "#166534" }}>Nenhum alerta de diagnóstico ativo.</div>}
      {d.alertas.map((a: any, i: number) => {
        const c = COR[COR_GRAV[a.gravidade] ?? "cinza"];
        return (
          <div key={i} style={{ background: c.bg, border: `1px solid ${c.borda}`, color: c.fg, borderRadius: 8, padding: "8px 12px", marginBottom: 6, fontSize: 12 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <strong>{ROT_ALERTA[a.tipo] ?? a.tipo}</strong>
              {a.equipe && <span>· {a.equipe} (INE {a.ine})</span>}<span>· {compBr(a.competencia)}</span>
              {a.ine && <button data-no-print style={{ ...btn, marginLeft: "auto" }} onClick={() => abrir(a.ine, a.competencia)}>Ver diagnóstico</button>}
            </div>
            <div style={{ marginTop: 3, color: "#1f2937" }}>{a.mensagem}</div>
            <div style={{ marginTop: 2, fontSize: 11, color: "#4b5563" }}>Fonte: {a.fonte} · consultado em {dtHora(a.consultado_em)}</div>
          </div>);
      })}
    </Painel>
  );
}

// ── diagnóstico de uma competência (caso da equipe) ──────────────────────────
const quando = (s?: string | null) => (!s ? "" : s.length > 10 ? dtHora(s) : s.split("-").reverse().join("/"));

function DiagnosticoCompetencia({ d, municipio }: { d: any; municipio?: string }) {
  const k = COR_CLASSE[d.classificacao as Classe];
  const linha = (rotulo: string, valor: React.ReactNode) => (
    <tr><td style={{ ...td, width: 210, fontWeight: 600, color: "#374151", background: "#f9fafb" }}>{rotulo}</td><td style={td}>{valor}</td></tr>
  );
  const erros = d.achados.filter((a: any) => a.erro_oficial);
  return (
    <section style={{ border: `1px solid ${k.borda}`, borderLeft: `5px solid ${k.fg}`, borderRadius: 8, background: "#fff", marginBottom: 12 }}>
      <div style={{ background: k.bg, color: k.fg, padding: "8px 12px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <strong style={{ fontSize: 14 }}>Competência {compBr(d.competencia)}</strong><SeloClasse c={d.classificacao} />
        <span style={{ fontWeight: 600 }}>{d.causa}</span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {linha("Município e estabelecimento", `${municipio || "—"} · CNES ${d.estabelecimento?.length ? d.estabelecimento.join(", ") : "não identificado"}`)}
          {linha("Equipe / INE / tipo", `${d.equipe} · INE ${d.ine} · ${d.tipo_equipe ?? "—"}${d.tipologia ? ` (tipologia ${d.tipologia})` : ""}`)}
          {linha("Situação SIAPS", <Etapa e={d.situacao_siaps} />)}
          {linha("Produção na origem (PEC)", <Etapa e={d.etapas.origem} />)}
          {linha("Transmissão", <Etapa e={d.etapas.transmissao} />)}
          {linha("Processamento e validação", <Etapa e={d.etapas.processamento} />)}
          {linha("Cadastro (e-Gestor)", <Etapa e={d.etapas.cadastro} />)}
          {linha("Inconsistências identificadas", d.achados.length ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>{d.achados.map((a: any) => (
              <li key={a.codigo + a.titulo} style={{ marginBottom: 4 }}>
                <strong style={{ color: COR_ACHADO[a.classe] }}>[{ROT_ACHADO[a.classe]} · {ROT_CAT[a.categoria]}]</strong> {a.titulo}
                <div style={{ fontSize: 12, color: "#374151" }}>{a.descricao}</div>
                <div style={{ fontSize: 11, color: "#4b5563" }}>Fonte: {a.fonte}{a.consultado_em ? ` · ${quando(a.consultado_em)}` : ""}</div>
              </li>))}</ul>) : "Nenhuma inconsistência identificada nas fontes consultadas.")}
          {linha("Código / descrição do erro oficial", erros.length ? erros.map((a: any) => <div key={a.codigo + a.titulo}><code>{a.erro_oficial.codigo}</code> — {a.erro_oficial.descricao}</div>) : "Nenhum código de erro oficial disponível para esta competência.")}
          {linha("Causa", <><SeloClasse c={d.classificacao} /> <span style={{ marginLeft: 6 }}>{d.causa}</span>
            {d.hipoteses_a_verificar.length > 0 && <div style={{ fontSize: 12, marginTop: 4 }}>Hipóteses a verificar: {d.hipoteses_a_verificar.join("; ")}.</div>}</>)}
          {linha("Possíveis consequências", d.consequencias.length ? d.consequencias.map((c: any, i: number) => <div key={i}>{c.texto} <span style={{ fontSize: 11, color: "#4b5563" }}>({c.fonte})</span></div>)
            : "Situação de pagamento da competência não verificada.")}
          {linha("Não verificado", d.fontes_nao_verificadas.length ? d.fontes_nao_verificadas.join("; ") + "." : "—")}
          {linha("Data da última verificação", dtHora(d.ultima_verificacao))}
        </tbody>
      </table>
      {d.orientacoes.length > 0 && (
        <div style={{ padding: "10px 12px" }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Orientação técnica para regularização</div>
          {d.orientacoes.map((o: any) => (
            <div key={o.codigo} style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 10px", marginBottom: 6, fontSize: 12, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700 }}>{o.problema}</div>
              <div><strong>Impacto na contabilização:</strong> {o.impacto}</div>
              <div><strong>Onde verificar/corrigir:</strong> {o.sistema}</div>
              <div><strong>Procedimento recomendado:</strong> {o.procedimento}</div>
              <div><strong>Responsável sugerido:</strong> {o.responsavel}</div>
              <div><strong>Providência:</strong> {o.providencia}</div>
              <div style={{ color: "#92400e" }}><strong>Atenção:</strong> {o.regra}</div>
            </div>))}
        </div>
      )}
    </section>
  );
}

function DiagnosticoEquipe({ ine, compInicial, municipio }: { ine: string; compInicial?: string | null; municipio?: { uf?: string; nome?: string } }) {
  const { data: d, isLoading } = useQuery<any>({ queryKey: ["mon-siaps", "diag-equipe", ine], queryFn: () => apiGetRaw(`${BASE}/diagnostico/equipe/${ine}`) });
  const [sel, setSel] = useState<string | null>(compInicial ?? null);
  if (isLoading) return <Aviso>Carregando diagnóstico…</Aviso>;
  if (!d || d.situacao_dado === "nao_disponivel") return null;
  const diags: any[] = d.diagnosticos;
  const atual = diags.find(x => x.competencia === sel) ?? diags[0];
  const mun = `${municipio?.nome || d.municipio || ""}${municipio?.uf ? "/" + municipio.uf : ""}`;
  const conta = (c: Classe) => diags.filter(x => x.classificacao === c).length;
  return (
    <>
      <Painel titulo="Diagnóstico técnico da ausência de envio" cor="#7c3aed">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 6, fontSize: 13, marginBottom: 10 }}>
          <div><strong>Município:</strong> {mun || "—"} (IBGE {d.municipio_ibge ?? "—"})</div>
          <div><strong>Estabelecimento:</strong> CNES {d.estabelecimento ?? "não identificado"}</div>
          <div><strong>Equipe:</strong> {d.equipe} · INE {d.ine} · {d.tipo_equipe ?? "—"}</div>
          <div><strong>Período analisado:</strong> {compBr(d.periodo.de)} a {compBr(d.periodo.ate)} ({d.periodo.competencias_coletadas} competências)</div>
        </div>
        {!diags.length ? <div style={{ fontSize: 13, color: "#166534" }}>Nenhuma competência com ausência de envio no período.</div> : (
          <>
            <div style={{ fontSize: 13, marginBottom: 8 }}>
              {diags.length} competência(s) com ausência: <strong>{conta("causa_confirmada")}</strong> com causa confirmada · <strong>{conta("possivel_causa")}</strong> com possível causa · <strong>{conta("sem_inconsistencia") + conta("indisponivel")}</strong> sem diagnóstico conclusivo.
            </div>
            <div data-no-print style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#374151" }}>Competência analisada:</span>
              {diags.map(x => {
                const k = COR_CLASSE[x.classificacao as Classe];
                const ativo = x.competencia === atual?.competencia;
                return <button key={x.competencia} onClick={() => setSel(x.competencia)} title={k.nome}
                  style={{ ...btn, background: ativo ? k.fg : k.bg, color: ativo ? "#fff" : k.fg, border: `1px solid ${k.borda}`, fontWeight: 700 }}>{compBr(x.competencia)}</button>;
              })}
              <span style={{ marginLeft: "auto" }}><BotaoVerificar competencias={d.competencias_com_ausencia} rotulo="🔎 Verificar fontes desta equipe" /></span>
            </div>
            <div data-no-print>{atual && <DiagnosticoCompetencia d={atual} municipio={mun} />}</div>
            <div data-print-only style={{ display: "none" }}>{diags.map(x => <DiagnosticoCompetencia key={x.competencia} d={x} municipio={mun} />)}</div>
          </>
        )}
      </Painel>
      <Painel titulo="Evidências e fontes" cor="#6b7280">
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          <div><strong>Fontes consultadas:</strong> {d.fontes_consultadas.length ? d.fontes_consultadas.join("; ") : "nenhuma consulta feita ainda — use “Verificar fontes”"}.</div>
          <div><strong>Não acessadas pelo ERSUS360:</strong> registros de produção e lotes de transmissão do e-SUS APS/PEC municipal; retornos detalhados da área logada do SIAPS.</div>
          {d.avisos.map((a: string) => <div key={a} style={{ fontSize: 12, color: "#4b5563", marginTop: 4 }}>{a}</div>)}
        </div>
      </Painel>
      <Painel titulo="Resumo conclusivo para a gestão municipal" cor="#0f766e">
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{d.conclusao}</div>
        {d.reincidencia && <div style={{ fontSize: 13, marginTop: 4 }}><strong>Reincidência:</strong> a equipe saiu da lista oficial e voltou a constar — a regularização anterior não se manteve.</div>}
      </Painel>
    </>
  );
}

// ── Prévia pelo SISAB (competências ainda sem lista oficial de ausência) ────
const COR_PREVIA: Record<string, Nivel> = { sem_envio: "vermelho", sem_aprovadas: "laranja", so_reprovada: "laranja", so_fora_do_prazo: "amarelo", com_producao: "verde" };
const dataBrIso = (s?: string | null) => (s ? s.slice(0, 10).split("-").reverse().join("/") : "—");

function PreviaSisab({ abrir }: { abrir: (ine: string, comp?: string) => void }) {
  const { data: d } = useQuery<any>({ queryKey: ["mon-siaps", "diag-previa"], queryFn: () => apiGetRaw(`${BASE}/diagnostico/previa`) });
  const [verTodas, setVerTodas] = useState(false);
  if (!d || d.situacao_dado === "nao_disponivel" || !d.competencias?.length) return null;
  return (
    <Painel titulo={`Prévia pelo SISAB — competências ainda sem lista oficial (após ${compBr(d.ultima_competencia_oficial)})`} cor="#0369a1">
      {d.avisos.map((a: string) => <Aviso key={a} tom={a.startsWith("PRÉVIA") ? "alerta" : "info"}>{a}</Aviso>)}
      {d.competencias.map((c: any) => {
        const risco = c.equipes.filter((e: any) => e.risco);
        const lista = verTodas ? c.equipes : risco;
        return (
          <div key={c.competencia} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
              <strong style={{ fontSize: 14 }}>Competência {compBr(c.competencia)}</strong>
              <Selo nivel={c.parcial ? "amarelo" : "cinza"} texto={c.parcial ? `Prazo em curso até ${dataBrIso(c.prazo)} — parcial` : `Prazo encerrado em ${dataBrIso(c.prazo)}`} />
              {c.equipes.some((e: any) => e.preliminar) && <Selo nivel="amarelo" texto="Resultado preliminar no SISAB" />}
              <span style={{ fontSize: 12, color: "#374151" }}>
                {c.sisab === "ok" ? `SISAB consultado em ${dtHora(c.consultado_em)}` : c.sisab === "nao_consultado" ? "SISAB ainda não consultado — use “Verificar fontes oficiais”" : c.mensagem}
              </span>
            </div>
            {c.sisab === "ok" && (
              <>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12, marginBottom: 6 }}>
                  <Selo nivel="vermelho" texto={`${c.resumo.sem_envio} sem nenhuma ficha`} />
                  <Selo nivel="laranja" texto={`${c.resumo.sem_aprovadas} sem aprovadas`} />
                  <Selo nivel="laranja" texto={`${c.resumo.so_reprovada} só reprovadas`} />
                  <Selo nivel="amarelo" texto={`${c.resumo.so_fora_do_prazo} só fora do prazo`} />
                  <Selo nivel="verde" texto={`${c.resumo.com_producao} com produção no prazo`} />
                </div>
                {lista.length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
                    <thead><tr>{["Equipe", "INE", "Tipo", "Prévia SISAB", "Recebidas", "Aprovadas", "No prazo", ""].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                    <tbody>{lista.map((e: any) => (
                      <tr key={e.ine}>
                        <td style={td}>{e.equipe}</td><td style={td}>{e.ine}</td><td style={td}>{e.tipo_equipe ?? "—"}</td>
                        <td style={td}><Selo nivel={COR_PREVIA[e.situacao]} texto={e.texto} />{e.nota && <div style={{ fontSize: 11, color: "#4b5563", marginTop: 2 }}>{e.nota}</div>}
                          {Object.keys(e.reprovados_por_motivo).length > 0 && <div style={{ fontSize: 11, marginTop: 2 }}>Reprovadas: {Object.entries(e.reprovados_por_motivo).map(([m, q]) => `${m}: ${q}`).join(", ")}</div>}</td>
                        <td style={td}>{e.recebidos}</td><td style={td}>{e.aprovados}</td><td style={td}>{e.aprovados_no_prazo}</td>
                        <td style={td}><button data-no-print style={btn} onClick={() => abrir(e.ine)}>Histórico</button></td>
                      </tr>))}
                    </tbody>
                  </table>
                ) : <div style={{ fontSize: 13, color: "#166534" }}>Nenhuma equipe em risco nesta competência pelo SISAB.</div>}
              </>
            )}
          </div>
        );
      })}
      <label data-no-print style={{ fontSize: 12, color: "#374151" }}>
        <input type="checkbox" checked={verTodas} onChange={e => setVerTodas(e.target.checked)} /> Mostrar também as equipes com produção no prazo
      </label>
    </Painel>
  );
}
