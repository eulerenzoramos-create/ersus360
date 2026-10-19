// Monitoramento SIAPS — ausência de envio de produção válida (e-Gestor APS).
// Fonte: relatório público do e-Gestor "Equipes e serviços com ausência de envio de informação".
// A fonte só informa AUSÊNCIA e há quantas competências ela dura: o que ela não informa aparece como
// "Informação não disponibilizada pela fonte" e nunca é estimado. Cores = alerta gerencial interno.
import { useMemo, useState } from "react";
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
  { id: "processamento", label: "5. Processamento e Validação" },
  { id: "alertas", label: "6. Alertas e Risco de Suspensão" },
  { id: "historico", label: "7. Histórico de Competências" },
  { id: "relatorios", label: "8. Relatórios Gerenciais" },
  { id: "integracoes", label: "9. Integrações e Atualizações" },
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
      <div style={{ fontSize: 11, color: c?.fg ?? "#6b7280", fontWeight: 600 }}>{titulo}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: c?.fg ?? "#111827", marginTop: 2 }}>{valor}</div>
      {nota && <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{nota}</div>}
    </div>
  );
}
function Aviso({ children, tom = "info" }: { children: React.ReactNode; tom?: "info" | "alerta" }) {
  const [bg, fg, bd] = tom === "alerta" ? ["#fffbeb", "#92400e", "#fde68a"] : ["#eff6ff", "#1e40af", "#bfdbfe"];
  return <div style={{ background: bg, color: fg, border: `1px solid ${bd}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 10 }}>{children}</div>;
}
const th: React.CSSProperties = { textAlign: "left", padding: "7px 8px", fontSize: 11, color: "#374151", background: "#f3f4f6", borderBottom: "1px solid #d1d5db", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "7px 8px", fontSize: 12, borderBottom: "1px solid #eef0f3", verticalAlign: "top" };
const btn: React.CSSProperties = { padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 12 };
const btnP: React.CSSProperties = { ...btn, background: "#1d4ed8", color: "#fff", border: "1px solid #1d4ed8", fontWeight: 600 };

function SemDado({ msg }: { msg?: string }) {
  return <Aviso tom="alerta">{msg ?? "Nenhuma competência coletada ainda."} Abra <strong>9. Integrações e Atualizações</strong> e use <strong>Atualizar dados</strong>.</Aviso>;
}

// ── componente principal ─────────────────────────────────────────────────────
export default function MonitoramentoSiaps({ municipio }: { municipio?: { uf?: string; nome?: string } }) {
  const [sub, setSub] = useState<Sub>("visao");
  const [comp, setComp] = useState<string>("");
  const [ineSel, setIneSel] = useState<string | null>(null);
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

  const abrirEquipe = (ine: string) => { setIneSel(ine); };

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
      <span style={{ color: "#6b7280" }} title="A fonte pública informa apenas o código de tipologia; não classifica equipes ribeirinhas ou fluviais.">
        Ribeirinha/fluvial: {NAO_DISP.toLowerCase()}
      </span>
    </div>
  );

  // ── detalhe de uma equipe ──────────────────────────────────────────────────
  if (ineSel) return <CasoEquipe ine={ineSel} dados={caso.data} carregando={caso.isLoading} voltar={() => setIneSel(null)} />;

  return (
    <div style={{ color: "#111827" }}>
      {/* submenus */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {SUBS.map(s => (
          <button key={s.id} onClick={() => setSub(s.id)} style={{ ...btn, background: sub === s.id ? "#1d4ed8" : "#fff", color: sub === s.id ? "#fff" : "#374151", fontWeight: sub === s.id ? 700 : 400 }}>{s.label}</button>
        ))}
      </div>

      {/* identificação da fonte e da competência — nunca apresentar dado antigo como tempo real */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", fontSize: 12, color: "#374151" }}>
        <label>Competência CNES:{" "}
          <select value={compAtual} onChange={e => setComp(e.target.value)} style={btn} disabled={!comps.length}>
            {comps.slice().reverse().map(c => <option key={c} value={c}>{compBr(c)}</option>)}
          </select>
        </label>
        <span><strong>Última competência disponível na fonte:</strong> {compBr(p?.ultima_competencia_fonte)}</span>
        <span><strong>Relatório gerado pela fonte em:</strong> {p?.gerado_em_fonte ?? "—"}</span>
        <span><strong>Última atualização no ERSUS:</strong> {dtHora(p?.coletado_em)}</span>
        <span><strong>Origem:</strong> e-Gestor APS (relatório público)</span>
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
          <Aviso tom="alerta">Envio pendente, produção rejeitada e inconsistências: {NAO_DISP}. A fonte pública não publica esses números.</Aviso>
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
                {[0, 1, 2, 3].map(i => <td key={i} style={{ ...td, color: "#9ca3af", fontSize: 10 }}>{NAO_DISP}</td>)}
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
                <td style={td}>{e.ine}<div style={{ color: "#6b7280", fontSize: 10 }}>{e.equipe}</div></td><td style={td}>{e.tipologia ?? "—"}{e.tipo_equipe ? ` (${e.tipo_equipe})` : ""}</td>
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
              {!ausencias.data.estabelecimentos.length && <tr><td colSpan={5} style={{ ...td, color: "#6b7280" }}>Nenhum estabelecimento na lista.</td></tr>}
            </tbody>
          </table>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Profissionais ({ausencias.data.profissionais.length}) — CNS parcialmente oculto</div>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead><tr>{["CNS", "CBO", "CNES", "INE", "Status", "Competências consecutivas", "Nível"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{ausencias.data.profissionais.map((e: any, i: number) => (
              <tr key={i}><td style={td}>{e.cns_mascarado}</td><td style={td}>{e.cbo ?? "—"}</td><td style={td}>{e.cnes ?? "—"}</td><td style={td}>{e.ine ?? "—"}</td><td style={td}>{e.descricao}</td><td style={td}>{e.qt_texto}</td><td style={td}><Selo nivel={e.nivel} /></td></tr>))}
              {!ausencias.data.profissionais.length && <tr><td colSpan={7} style={{ ...td, color: "#6b7280" }}>Nenhum profissional na lista.</td></tr>}
            </tbody>
          </table>
          {ausencias.data.avisos.map((a: string) => <div key={a} style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>{a}</div>)}
        </>
      ))}

      {/* 5 ── Processamento e validação */}
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
        </>
      ))}

      {/* 7 ── Histórico */}
      {sub === "historico" && (historico.data?.situacao_dado === "nao_disponivel" ? <SemDado /> : historico.data && (
        <>
          <GraficoSerie serie={historico.data.serie} />
          <div style={{ fontWeight: 700, fontSize: 13, margin: "6px 0" }}>Competências consecutivas sem envio, por equipe (0 = sem ausência na competência coletada)</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", background: "#fff", minWidth: 600 }}>
              <thead><tr><th style={th}>Equipe</th>{historico.data.competencias.map((c: string) => <th key={c} style={th}>{compBr(c)}</th>)}</tr></thead>
              <tbody>{historico.data.matriz.map((m: any) => (
                <tr key={m.ine}>
                  <td style={td}><a style={{ cursor: "pointer", color: "#1d4ed8" }} onClick={() => abrirEquipe(m.ine)}>{m.equipe}</a><div style={{ color: "#6b7280", fontSize: 10 }}>INE {m.ine}</div></td>
                  {historico.data.competencias.map((c: string) => {
                    const v = m.valores[c]; const n: Nivel = !v ? "verde" : v === 1 ? "amarelo" : v === 2 ? "laranja" : "vermelho";
                    return <td key={c} style={{ ...td, textAlign: "center", background: COR[n].bg, color: COR[n].fg, fontWeight: 700 }}>{v > 3 ? ">3" : v}</td>;
                  })}
                </tr>))}
                {!historico.data.matriz.length && <tr><td style={td} colSpan={99}>Nenhuma equipe do município apareceu na lista de ausência nas competências coletadas.</td></tr>}
              </tbody>
            </table>
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, margin: "14px 0 6px" }}>Eventos entre competências vizinhas</div>
          {historico.data.eventos.length === 0 && <div style={{ fontSize: 12, color: "#6b7280" }}>Nenhuma mudança entre competências consecutivas coletadas.</div>}
          {historico.data.eventos.map((e: any, i: number) => (
            <div key={i} style={{ fontSize: 12, padding: "4px 0" }}>
              <Selo nivel={e.tipo === "regularizada" ? "verde" : "laranja"} texto={e.tipo === "regularizada" ? "Regularizada" : "Entrou em ausência"} /> {compBr(e.competencia)} — {e.equipe} (INE {e.ine})
            </div>))}
        </>
      ))}

      {/* 8 ── Relatórios gerenciais */}
      {sub === "relatorios" && (
        <>
          <Aviso>Relatórios gerados a partir dos dados coletados. Para PDF, use <strong>Imprimir / salvar PDF</strong> do navegador.</Aviso>
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
            <button style={btn} onClick={() => window.print()}>Imprimir / salvar PDF</button>
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 12 }}>
            Relatórios de produção transmitida, validada e rejeitada: {NAO_DISP}.
          </div>
        </>
      )}

      {/* 9 ── Integrações */}
      {sub === "integracoes" && (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
            <button style={btnP} disabled={sync.isPending} onClick={() => sync.mutate(false)}>{sync.isPending ? "Atualizando…" : "Atualizar dados (3 últimas competências)"}</button>
            <button style={btn} disabled={sync.isPending} onClick={() => sync.mutate(true)}>Carregar todo o histórico publicado</button>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Cada competência baixa o relatório nacional; pode levar alguns minutos. Requer perfil de edição.</span>
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
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
            Outras fontes (SCNES, SIAPS, PEC) alimentam as demais abas do e-Gestor APS; nenhuma delas é usada aqui para inferir produção.
            Última coleta: {dtHora(fonte.data?.ultima_coleta)}.
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead><tr>{["Competência", "Relatório gerado em", "Coletado em", "Por", "Equipes", "Estab.", "Profissionais"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{(fonte.data?.coletas ?? []).slice().reverse().map((c: any) => (
              <tr key={c.competencia}><td style={td}>{compBr(c.competencia)}</td><td style={td}>{c.gerado_em_fonte ?? "—"}</td><td style={td}>{dtHora(c.coletado_em)}</td><td style={td}>{c.coletado_por ?? "—"}</td><td style={td}>{c.equipes}</td><td style={td}>{c.estabelecimentos}</td><td style={td}>{c.profissionais}</td></tr>))}
              {fonte.data && !fonte.data.coletas.length && <tr><td colSpan={7} style={{ ...td, color: "#6b7280" }}>Nenhuma coleta feita ainda.</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </div>
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

// ── 5. Processamento e validação ─────────────────────────────────────────────
function Processamento() {
  const { data: cal } = useCalendarioSiaps();
  const etapas = ["Registro no e-SUS APS/PEC", "Transmissão ao SISAB", "Recebimento", "Processamento", "Validação", "Disponível no SIAPS"];
  return (
    <>
      <Aviso tom="alerta">O ERSUS360 não tem acesso autorizado às etapas de processamento e validação. A linha do tempo abaixo mostra o fluxo geral; a situação de cada etapa é: <strong>{NAO_DISP}</strong>. Nenhum status é presumido.</Aviso>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {etapas.map((e, i) => (
          <div key={e} style={{ background: COR.cinza.bg, border: `1px solid ${COR.cinza.borda}`, borderRadius: 8, padding: "8px 10px", fontSize: 11, flex: "1 1 130px" }}>
            <div style={{ fontWeight: 700 }}>{i + 1}. {e}</div><div style={{ color: "#6b7280", marginTop: 2 }}>{NAO_DISP}</div>
          </div>))}
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Calendário de prazos de envio ao SIAPS</div>
      {cal ? (
        <>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>Fonte: {cal.fonte}. Confira sempre no calendário oficial vigente.</div>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead><tr>{["Competência", "Início do envio", "Prazo final (10º dia útil)", "Relatório disponível em", "Situação"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{cal.calendario.map(c => (
              <tr key={c.competencia}><td style={td}>{c.nome}</td><td style={td}>{dataBr(c.inicio)}</td><td style={td}><strong>{dataBr(c.data_limite)}</strong></td><td style={td}>{dataBr(c.data_relatorio)}</td>
                <td style={td}>{c.dias_para_limite < 0 ? "Encerrado" : c.dias_para_limite === 0 ? "Termina hoje" : `Faltam ${c.dias_para_limite} dias`}</td></tr>))}
            </tbody>
          </table>
        </>
      ) : <div style={{ fontSize: 12, color: "#6b7280" }}>Calendário indisponível no momento.</div>}
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

function CasoEquipe({ ine, dados, carregando, voltar }: { ine: string; dados: any; carregando: boolean; voltar: () => void }) {
  const qc = useQueryClient();
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
    <div style={{ color: "#111827" }}>
      <button style={{ ...btn, marginBottom: 10 }} onClick={voltar}>← Voltar ao Monitoramento SIAPS</button>
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
              <li>Suspensão de recurso: <strong>não verificada</strong> — confirmar no Relatório de Pagamento (aba “Relatório de Pagamento (e-Gestor)”).</li>
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
                        background: c?.bg ?? "#f9fafb", color: c?.fg ?? "#9ca3af", border: `1px ${t ? "solid" : "dashed"} ${c?.borda ?? "#d1d5db"}` }}>
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

          {/* o que a fonte não informa */}
          <Painel titulo="O que a fonte não informa" cor="#6b7280">
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <div>Histórico de transmissões: <strong>{NAO_DISP}</strong></div>
              <div>Processamento e rejeição: <strong>{NAO_DISP}</strong></div>
              <div style={{ color: "#4b5563", fontSize: 12, marginTop: 4 }}>Última verificação no ERSUS: {dtHora(dados.ultima_verificacao)}</div>
            </div>
          </Painel>

          {/* causas e providências */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
            <Painel titulo="Possíveis causas" cor="#b45309">
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.55 }}>{dados.possiveis_causas.map((c: string) => <li key={c}>{c}</li>)}</ul>
            </Painel>
            <Painel titulo="Providências recomendadas" cor="#15803d">
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.55 }}>{dados.providencias_recomendadas.map((c: string) => <li key={c}>{c}</li>)}</ol>
            </Painel>
          </div>
          <div style={{ fontSize: 11, color: "#4b5563", margin: "0 0 12px" }}>{dados.orientacao_nota}</div>

          {/* acompanhamento */}
          <Painel titulo="Acompanhamento" cor="#1d4ed8">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
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
