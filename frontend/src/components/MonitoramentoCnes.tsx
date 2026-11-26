// src/components/MonitoramentoCnes.tsx — aba "Monitoramento CNES" do módulo eGestor/SIAPS.
// Dados: /api/scnes-conformidade/* (retrato do CNES × Matriz Normativa × e-Gestor × SIAPS — validação automática).
// Padrão visual do Painel Geral da APS: cards por modalidade (clicáveis), lista no formato do portal CNES,
// profissionais da equipe, conformidade normativa com fundamentação e link, exportação PDF/Excel e ERSUS IA.
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

type Card = { cadastradas_cnes: number; ativas: number; credenciadas: number | null; homologadas: number | null;
  financiadas: number; regulares: number; com_incompatibilidade: number; profissionais: number };
type Fund = { norma: string; dispositivo: string; url: string };
type Crit = { criterio: string; exigencia: string; situacao_cnes: string; diferenca: string; situacao: string;
  fundamentacao: Fund | null; observacao: string | null };
type Equipe = { ine: string; nome: string; tipo: string; estabelecimentos: { cnes: string; nome: string }[];
  ativa: boolean; n_profissionais: number; ch_total: number; credenciada: boolean; homologada: boolean;
  financiada: boolean; situacao: string; incompatibilidades: number };
type Prof = { nome: string; cbo: string; ds_cbo: string; ch_cnes: number; ch_exigida: number | null;
  ch_aps_total: number | null; situacao: string; motivos: string[] };
type Conformidade = { situacao_dado: string; nota?: string; competencia_cnes: string; parcela_egestor: string | null;
  competencia_cnes_egestor: string | null; coletado_em: string | null; cards: Record<string, Card>; equipes: Equipe[];
  criterios_pendentes: (Crit & { ine: string; equipe: string; tipo: string })[];
  resumo: { equipes: number; irregulares: number; atencao: number; profissionais_irregulares: number };
  alteracoes: { total: number; itens: any[]; competencia_anterior: string | null } | null };

const AZUL = "#1d4ed8", BORDA = "#e5e7eb", MUTED = "#6b7280", NAVY = "#0f2a4a";
const SIT: Record<string, { rot: string; cor: string; bg: string }> = {
  conforme: { rot: "Regular", cor: "#15803d", bg: "#dcfce7" }, irregular: { rot: "Irregular", cor: "#b91c1c", bg: "#fee2e2" },
  atencao: { rot: "Atenção", cor: "#b45309", bg: "#fef3c7" }, nao_verificavel: { rot: "Não verificável", cor: "#4b5563", bg: "#f3f4f6" },
};
const ORDEM_CARDS = ["eMulti", "eSB", "eSF", "eSFR", "eAP"];
const rot = (c?: string | null) => (c && c.length === 6 ? `${c.slice(4)}/${c.slice(0, 4)}` : c || "—");

function Selo({ s }: { s: string }) {
  const x = SIT[s] ?? SIT.nao_verificavel;
  return <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 6, color: x.cor, background: x.bg,
    whiteSpace: "nowrap" }}>{x.rot}</span>;
}

async function baixar(formato: "pdf" | "xlsx", params: Record<string, string>) {
  const r = await api.get("/api/scnes-conformidade/conformidade/exportar", { params: { formato, ...params },
    responseType: "blob", timeout: 120_000 });
  const nome = /filename="([^"]+)"/.exec(r.headers["content-disposition"] ?? "")?.[1] ?? `monitoramento_cnes.${formato}`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(r.data);
  a.download = nome;
  a.click();
}

export default function MonitoramentoCnes({ voltar }: { voltar?: () => void }) {
  const qc = useQueryClient();
  const [tipo, setTipo] = useState("");
  const [situacao, setSituacao] = useState("");
  const [cnes, setCnes] = useState("");
  const [sub, setSub] = useState<"equipes" | "conformidade" | "alteracoes" | "ia">("equipes");
  const [ine, setIne] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const params: Record<string, string> = {};
  if (tipo) params.tipo = tipo;
  if (situacao) params.situacao = situacao;
  if (cnes) params.cnes = cnes;

  const q = useQuery<Conformidade>({ queryKey: ["cnes-conformidade", tipo, situacao, cnes],
    queryFn: () => api.get("/api/scnes-conformidade/conformidade", { params }).then(r => r.data) });
  const todos = useQuery<Conformidade>({ queryKey: ["cnes-conformidade", "", "", ""],
    queryFn: () => api.get("/api/scnes-conformidade/conformidade").then(r => r.data) });
  const estabs = useMemo(() => {
    const m = new Map<string, string>();
    (todos.data?.equipes ?? []).forEach(e => e.estabelecimentos.forEach(x => m.set(x.cnes, x.nome)));
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [todos.data]);

  async function coletar() {
    setOcupado(true); setMsg(null);
    try {
      const r = (await api.post("/api/scnes-conformidade/retrato/coletar", {}, { timeout: 300_000 })).data;
      setMsg(`CNES ${rot(r.competencia)} coletado: ${r.totais.equipes} equipes, ${r.totais.profissionais_em_equipes} ` +
             `profissionais em equipes${r.alertas ? ` · alertas: ${r.alertas.criados} novos, ${r.alertas.resolvidos} resolvidos` : ""}.`);
      qc.invalidateQueries({ queryKey: ["cnes-conformidade"] });
    } catch (e: any) {
      setMsg(e?.response?.data?.detail ?? "Não foi possível coletar o CNES agora.");
    } finally { setOcupado(false); }
  }

  const d = q.data;
  const cards = todos.data?.cards ?? {};
  const filtrado = !!(tipo || situacao || cnes);
  // "← Voltar" volta um nível: lista filtrada (aberta por um card) → lista completa → Painel Geral do eGestor/SIAPS
  function topo() {
    // a página pode rolar na janela ou no contêiner principal do layout
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelectorAll("main, [data-scroll], .overflow-y-auto").forEach(el => (el as HTMLElement).scrollTo?.({ top: 0 }));
  }
  function voltarAba() { voltar?.(); topo(); }
  function voltarNivel() {
    if (filtrado || sub !== "equipes") { setTipo(""); setSituacao(""); setCnes(""); setSub("equipes"); return; }
    voltarAba();
  }
  const rotuloVoltar = filtrado ? "← Voltar à lista completa" : sub !== "equipes" ? "← Voltar às equipes"
    : "← Voltar ao Painel Geral";
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ background: "#fff", border: `1px solid ${BORDA}`, borderRadius: 10, padding: "14px 18px",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {voltar && <button onClick={voltarAba} style={btn()} title="Voltar ao Painel Geral do eGestor/SIAPS">← Voltar</button>}
            <div style={{ fontSize: 18, fontWeight: 700, color: NAVY }}>Monitoramento CNES — equipes e conformidade normativa</div>
          </div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
            {d?.situacao_dado === "oficial"
              ? <>CNES {rot(d.competencia_cnes)} (API pública, coletado em {d.coletado_em ? new Date(d.coletado_em).toLocaleString("pt-BR") : "—"})
                 {" · "}e-Gestor parcela {rot(d.parcela_egestor)} (CNES {rot(d.competencia_cnes_egestor)}) · tipo oficial pelo SIAPS</>
              : "Sem retrato do CNES — clique em Atualizar CNES."}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={coletar} disabled={ocupado} style={btn(true)}>{ocupado ? "Coletando…" : "Atualizar CNES"}</button>
          <button onClick={() => baixar("pdf", params)} disabled={d?.situacao_dado !== "oficial"} style={btn()}>Exportar PDF</button>
          <button onClick={() => baixar("xlsx", params)} disabled={d?.situacao_dado !== "oficial"} style={btn()}>Exportar Excel</button>
        </div>
      </div>
      {msg && <div style={{ fontSize: 13, padding: 10, borderRadius: 8, background: "#eff6ff", color: NAVY }}>{msg}</div>}
      {q.isError && <div style={{ color: "#b91c1c" }}>Não foi possível carregar o monitoramento do CNES.</div>}

      {/* Cards por modalidade — clicáveis (filtram a lista) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {ORDEM_CARDS.filter(t => cards[t]?.cadastradas_cnes).map(t => {
          const c = cards[t]; const ativo = tipo === t;
          return (
            <button key={t} onClick={() => { setTipo(ativo ? "" : t); setSub("equipes"); }}
              style={{ textAlign: "left", cursor: "pointer", background: "#fff", borderRadius: 10, padding: 14,
                border: `2px solid ${ativo ? AZUL : BORDA}` }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: AZUL }}>{c.ativas}</div>
                <div style={{ fontSize: 14, color: "#374151" }}>equipes {t}</div>
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 8, display: "grid", gridTemplateColumns: "1fr auto", rowGap: 2 }}>
                <span>Cadastradas no CNES</span><b>{c.cadastradas_cnes}</b>
                <span>Credenciadas</span><b>{c.credenciadas ?? "não publicado"}</b>
                <span>Homologadas</span><b>{c.homologadas ?? "não publicado"}</b>
                <span>Financiadas</span><b>{c.financiadas}</b>
                <span>Regulares</span><b style={{ color: "#15803d" }}>{c.regulares}</b>
                <span>Com incompatibilidade</span><b style={{ color: c.com_incompatibilidade ? "#b91c1c" : undefined }}>{c.com_incompatibilidade}</b>
                <span>Profissionais</span><b>{c.profissionais}</b>
              </div>
            </button>);
        })}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", fontSize: 13 }}>
        <select value={tipo} onChange={e => setTipo(e.target.value)} style={sel}>
          <option value="">Todas as modalidades</option>{ORDEM_CARDS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={situacao} onChange={e => setSituacao(e.target.value)} style={sel}>
          <option value="">Todas as situações</option>{Object.entries(SIT).map(([k, v]) => <option key={k} value={k}>{v.rot}</option>)}
        </select>
        <select value={cnes} onChange={e => setCnes(e.target.value)} style={{ ...sel, maxWidth: 320 }}>
          <option value="">Todos os estabelecimentos</option>{estabs.map(([c, n]) => <option key={c} value={c}>{n} ({c})</option>)}
        </select>
        {d?.resumo && <span style={{ color: MUTED }}>{d.resumo.irregulares} irregular(es) · {d.resumo.atencao} em atenção (município)</span>}
      </div>

      {/* Sub-abas */}
      <div style={{ display: "flex", gap: 6, borderBottom: `1px solid ${BORDA}`, position: "sticky", top: 0, zIndex: 5,
        background: "#f8fafc", alignItems: "center", flexWrap: "wrap" }}>
        {([["equipes", "Equipes"], ["conformidade", "Conformidade normativa"], ["alteracoes", "Alterações cadastrais"],
           ["ia", "Análise ERSUS IA"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setSub(k)} style={{ padding: "8px 14px", border: "none", cursor: "pointer",
            background: "transparent", fontWeight: 600, fontSize: 14, color: sub === k ? AZUL : MUTED,
            borderBottom: `3px solid ${sub === k ? AZUL : "transparent"}` }}>{l}</button>))}
        {(voltar || filtrado || sub !== "equipes") && (
          <button onClick={voltarNivel} style={{ ...btn(), marginLeft: "auto", marginBottom: 4 }}>{rotuloVoltar}</button>)}
      </div>

      {sub === "equipes" && d?.situacao_dado === "oficial" && (
        <Tabela cab={["INE", "Nome da equipe", "Modalidade", "CNES", "Nº profissionais", "Carga horária", "e-Gestor", "Situação"]}>
          {d.equipes.map(e => (
            <tr key={e.ine} onClick={() => setIne(e.ine)} style={{ cursor: "pointer", borderTop: `1px solid ${BORDA}` }}>
              <td style={td}><code>{e.ine}</code></td><td style={td}><b>{e.nome}</b></td><td style={td}>{e.tipo}</td>
              <td style={td}>{e.estabelecimentos.map(x => x.cnes).join(", ")}</td>
              <td style={tdN}>{e.n_profissionais}</td><td style={tdN}>{e.ch_total} h</td>
              <td style={td}>{e.financiada ? "Financiada" : e.credenciada ? "Não paga na parcela" : "Sem pagamento federal"}</td>
              <td style={td}><Selo s={e.situacao} />{e.incompatibilidades > 0 && <span style={{ fontSize: 12, color: MUTED }}> · {e.incompatibilidades}</span>}</td>
            </tr>))}
        </Tabela>)}

      {sub === "conformidade" && d?.situacao_dado === "oficial" && (
        d.criterios_pendentes.length === 0 ? <div style={{ color: "#15803d" }}>Nenhum critério irregular ou em atenção no filtro atual.</div> :
        <Tabela cab={["Equipe", "Critério", "Exigência MS", "Situação CNES", "Diferença", "Situação", "Fundamentação"]}>
          {d.criterios_pendentes.map((c, i) => (
            <tr key={i} style={{ borderTop: `1px solid ${BORDA}`, verticalAlign: "top" }}>
              <td style={td}><b>{c.tipo} {c.equipe}</b><div style={{ fontSize: 12, color: MUTED }}>INE {c.ine}</div></td>
              <td style={td}>{c.criterio}</td><td style={td}>{c.exigencia}</td><td style={td}>{c.situacao_cnes}</td>
              <td style={td}>{c.diferenca}{c.observacao && <div style={{ fontSize: 12, color: "#92400e", marginTop: 4 }}>{c.observacao}</div>}</td>
              <td style={td}><Selo s={c.situacao} /></td>
              <td style={td}>{c.fundamentacao ? <a href={c.fundamentacao.url} target="_blank" rel="noreferrer" style={{ color: AZUL }}>
                {c.fundamentacao.norma}</a> : "—"}<div style={{ fontSize: 12 }}>{c.fundamentacao?.dispositivo}</div></td>
            </tr>))}
        </Tabela>)}

      {sub === "alteracoes" && d?.situacao_dado === "oficial" && (
        !d.alteracoes ? <div style={{ color: MUTED }}>Primeiro retrato do município: as alterações aparecem a partir da próxima coleta.</div> :
        d.alteracoes.itens.length === 0 ? <div style={{ color: MUTED }}>Nenhuma alteração desde {rot(d.alteracoes.competencia_anterior)}.</div> :
        <Tabela cab={["Tipo", "Equipe", "Profissional", "Detalhe"]}>
          {d.alteracoes.itens.map((a, i) => (
            <tr key={i} style={{ borderTop: `1px solid ${BORDA}` }}>
              <td style={td}>{String(a.tipo).replace(/_/g, " ")}</td><td style={td}>{a.equipe} ({a.ine})</td>
              <td style={td}>{a.profissional ?? "—"}{a.cbo ? ` · CBO ${a.cbo}` : ""}</td>
              <td style={td}>{a.de != null ? `${a.de} h → ${a.para} h` : a.data ?? ""}</td>
            </tr>))}
        </Tabela>)}

      {sub === "ia" && <AnaliseIA />}
      {ine && <DetalheEquipe ine={ine} fechar={() => setIne(null)} />}
    </div>
  );
}

function DetalheEquipe({ ine, fechar }: { ine: string; fechar: () => void }) {
  useEffect(() => {
    const esc = (ev: KeyboardEvent) => { if (ev.key === "Escape") fechar(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [fechar]);
  const conf = useQuery<any>({ queryKey: ["cnes-equipe", ine],
    queryFn: () => api.get(`/api/scnes-conformidade/conformidade/equipes/${ine}`).then(r => r.data) });
  const ret = useQuery<any>({ queryKey: ["cnes-retrato-equipe", ine],
    queryFn: () => api.get(`/api/scnes-conformidade/retrato/equipes/${ine}`).then(r => r.data) });
  const outras = useMemo(() => {
    const m = new Map<string, any[]>();
    (ret.data?.profissionais ?? []).forEach((p: any) => m.set(`${p.nome}|${p.cbo}`, p.outras_lotacoes ?? []));
    return m;
  }, [ret.data]);
  const e = conf.data;
  return (
    <div onClick={fechar} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", zIndex: 50,
      display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "40px 16px", overflowY: "auto" }}>
      <div onClick={ev => ev.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 20,
        width: "min(1100px, 100%)", display: "grid", gap: 14 }}>
        <div><button onClick={fechar} style={btn()}>← Voltar à lista de equipes</button></div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: NAVY }}>{e ? `${e.tipo} ${e.nome}` : "Carregando…"}</div>
            {e && <div style={{ fontSize: 13, color: MUTED }}>INE {e.ine} · {e.estabelecimentos.map((x: any) => `${x.nome} (${x.cnes})`).join(", ")}
              {" · "}CNES {rot(e.competencia_cnes)} · e-Gestor {rot(e.parcela_egestor)}</div>}
          </div>
          <button onClick={fechar} style={btn()}>Fechar</button>
        </div>
        {e && <>
          <Tabela cab={["Profissional", "CBO", "CH CNES", "CH exigida", "Outros vínculos no município", "Situação"]}>
            {e.profissionais.map((p: Prof, i: number) => {
              const o = outras.get(`${p.nome}|${p.cbo}`) ?? [];
              return (
                <tr key={i} style={{ borderTop: `1px solid ${BORDA}`, verticalAlign: "top" }}>
                  <td style={td}><b>{p.nome}</b></td><td style={td}>{p.cbo}<div style={{ fontSize: 12, color: MUTED }}>{p.ds_cbo}</div></td>
                  <td style={tdN}>{p.ch_cnes} h</td><td style={tdN}>{p.ch_exigida != null ? `${p.ch_exigida} h` : "—"}</td>
                  <td style={td}>{o.length ? o.map((l: any, k: number) => <div key={k} style={{ fontSize: 12 }}>
                    {l.estabelecimento} · CBO {l.cbo} · {l.ch_total} h{l.vinculo ? ` · ${l.vinculo}` : ""}</div>) : "—"}</td>
                  <td style={td}><Selo s={p.situacao} />{p.motivos.length > 0 &&
                    <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 4 }}>{p.motivos.join("; ")}</div>}</td>
                </tr>);
            })}
          </Tabela>
          <Tabela cab={["Critério", "Exigência MS", "Situação CNES", "Diferença", "Situação", "Fundamentação"]}>
            {e.criterios.map((c: Crit, i: number) => (
              <tr key={i} style={{ borderTop: `1px solid ${BORDA}`, verticalAlign: "top" }}>
                <td style={td}><b>{c.criterio}</b></td><td style={td}>{c.exigencia}</td><td style={td}>{c.situacao_cnes}</td>
                <td style={td}>{c.diferenca}{c.observacao && <div style={{ fontSize: 12, color: "#92400e", marginTop: 4 }}>{c.observacao}</div>}</td>
                <td style={td}><Selo s={c.situacao} /></td>
                <td style={td}>{c.fundamentacao ? <a href={c.fundamentacao.url} target="_blank" rel="noreferrer" style={{ color: AZUL }}>
                  {c.fundamentacao.norma}</a> : "—"}<div style={{ fontSize: 12 }}>{c.fundamentacao?.dispositivo}</div></td>
              </tr>))}
          </Tabela>
          <div style={{ fontSize: 12, color: MUTED }}>{ret.data?.nota}</div>
        </>}
      </div>
    </div>
  );
}

function AnaliseIA() {
  const [resp, setResp] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  async function pedir() {
    setCarregando(true); setErro(null);
    try {
      setResp((await api.post("/api/siaps-ia/analisar", { modo: "cnes", pergunta: null }, { timeout: 300_000 })).data);
    } catch (e: any) {
      setErro(e?.response?.data?.detail ?? "Não foi possível consultar a IA agora.");
    } finally { setCarregando(false); }
  }
  return (
    <div style={{ background: "#fff", border: "1px solid #c7d2fe", borderRadius: 10, padding: 16, display: "grid", gap: 10 }}>
      <div style={{ fontSize: 13, color: MUTED }}>
        O ERSUS IA interpreta a validação automática (não muda nenhuma situação calculada), prioriza os riscos e propõe um
        plano de ação por equipe, citando a fundamentação de cada item.
      </div>
      <div><button onClick={pedir} disabled={carregando} style={btn(true)}>{carregando ? "Analisando…" : "Analisar Monitoramento CNES"}</button></div>
      {erro && <div style={{ color: "#b91c1c", fontSize: 13 }}>{erro}</div>}
      {resp && <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.55 }}>{resp.resposta}
        <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>Fontes: {(resp.fontes ?? []).join("; ")}</div></div>}
    </div>
  );
}

function Tabela({ cab, children }: { cab: string[]; children: React.ReactNode }) {
  return (
    <div style={{ overflowX: "auto", background: "#fff", border: `1px solid ${BORDA}`, borderRadius: 10 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr style={{ background: "#f9fafb", textAlign: "left", color: MUTED, fontSize: 12 }}>
          {cab.map(c => <th key={c} style={{ padding: "8px 10px", fontWeight: 600 }}>{c}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

const td: React.CSSProperties = { padding: "8px 10px" };
const tdN: React.CSSProperties = { padding: "8px 10px", textAlign: "right", whiteSpace: "nowrap" };
const sel: React.CSSProperties = { padding: "6px 8px", border: `1px solid ${BORDA}`, borderRadius: 6, background: "#fff" };
function btn(primario = false): React.CSSProperties {
  return { padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
    border: `1px solid ${primario ? AZUL : BORDA}`, background: primario ? AZUL : "#fff", color: primario ? "#fff" : NAVY };
}
