/**
 * Central de alertas da Vigilância em Saúde — alertas por prioridade (crítico/alto/moderado/informativo),
 * categoria (epidemiológico, ambiental, desempenho; integração técnica à parte), filtros, detalhe expansível e
 * acompanhamento (avaliação técnica + providências, com histórico) para o município da sessão.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertOctagon, AlertTriangle, ChevronDown, ChevronRight, Info, Search, ShieldAlert, Wrench } from "lucide-react";
import { apiGet, apiPost } from "../../lib/api";
import { COR, FVS_API, SUBABA_ROTA, dataHora } from "../../lib/vigilanciaFvs";
import { Secao, TagOrigem, Vazio, botaoPri, botaoSec, rotuloStyle, selectStyle } from "./FvsBase";

export type Prioridade = "critico" | "alto" | "moderado" | "informativo";
export interface AlertaCentral {
  chave: string; tipo: "oficial" | "calculado" | "integracao"; nivel: string; fonte: string; titulo: string; detalhe: string;
  formula?: string; subaba: string; prioridade: Prioridade; categoria: "epidemiologico" | "ambiental" | "desempenho" | "integracao";
  agravo: string | null; area: string;
  acompanhamento: { situacao: string; atualizado_em?: string; por?: string; eventos: number } | null;
}
export interface Central {
  municipio: string; ano: number; alertas: AlertaCentral[]; resumo: Record<Prioridade, number>;
  por_categoria: Record<string, number>; criterios: Record<Prioridade, string>; legenda: Record<string, string>;
  acompanhamento_habilitado: boolean; pode_registrar: boolean; situacoes: string[];
}

export const PRIORIDADE: Record<Prioridade, { rotulo: string; cor: string; fundo: string; Icon: typeof AlertTriangle }> = {
  critico: { rotulo: "Crítico", cor: "#991b1b", fundo: "#fef2f2", Icon: AlertOctagon },
  alto: { rotulo: "Alto", cor: "#c2410c", fundo: "#fff7ed", Icon: ShieldAlert },
  moderado: { rotulo: "Moderado", cor: "#a16207", fundo: "#fefce8", Icon: AlertTriangle },
  informativo: { rotulo: "Informativo", cor: "#475569", fundo: "#f8fafc", Icon: Info },
};
const CATEGORIA: Record<string, string> = {
  epidemiologico: "Epidemiológico", ambiental: "Ambiental", desempenho: "Desempenho (PQA-VS/Vigiagua)", integracao: "Integração técnica",
};
const AREA: Record<string, string> = {
  respiratoria: "Respiratória", diarreicas: "Diarreicas/Água", arboviroses: "Arboviroses/Endemias", notificacoes: "Notificações",
  ambiental: "Ambiental", pqa: "PQA-VS", epidemiologia: "Notificações",
};
const SITUACAO: Record<string, string> = {
  novo: "Novo", em_avaliacao: "Em avaliação", em_acompanhamento: "Em acompanhamento", encerrado: "Encerrado", descartado: "Descartado",
};

export function useCentral(mun: string, ano: number, ativo = true) {
  return useQuery({ queryKey: ["vig-central", mun, ano], enabled: ativo,
    queryFn: () => apiGet<Central>(`${FVS_API}/alertas/central`, { mun, ano }) });
}

export function SeloPrioridade({ p }: { p: Prioridade }) {
  const s = PRIORIDADE[p];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 800, color: s.cor,
    background: s.fundo, border: `1px solid ${s.cor}40`, borderRadius: 999, padding: "1px 8px", textTransform: "uppercase", letterSpacing: .3 }}>
    <s.Icon size={11} /> {s.rotulo}</span>;
}

/** Faixa-resumo para o topo do painel: contagem por prioridade (sem integração técnica). */
export function ResumoAlertas({ central, onAbrir }: { central?: Central; onAbrir: (p?: Prioridade) => void }) {
  if (!central) return null;
  const epid = central.alertas.filter(a => a.categoria !== "integracao");
  const tecnicos = central.alertas.length - epid.length;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", background: "#fff", border: `1px solid ${COR.borda}`,
      borderRadius: 12, padding: "8px 10px" }} role="region" aria-label="Resumo dos alertas">
      <b style={{ fontSize: 12.5, color: COR.texto, marginRight: 4 }}>Alertas ativos</b>
      {(["critico", "alto", "moderado", "informativo"] as Prioridade[]).map(p => {
        const n = epid.filter(a => a.prioridade === p).length;
        const s = PRIORIDADE[p];
        return <button key={p} onClick={() => onAbrir(p)} disabled={!n} style={{ ...botaoSec, borderColor: n ? `${s.cor}55` : COR.borda,
          color: n ? s.cor : "#94a3b8", background: n ? s.fundo : "#fff", cursor: n ? "pointer" : "default" }}>
          <s.Icon size={13} /> {n} {s.rotulo.toLowerCase()}{n === 1 ? "" : "s"}</button>;
      })}
      {tecnicos > 0 && <span style={{ fontSize: 11.5, color: COR.sub, display: "inline-flex", gap: 4, alignItems: "center" }}>
        <Wrench size={12} /> {tecnicos} aviso(s) técnico(s) de integração</span>}
      <button onClick={() => onAbrir()} style={{ ...botaoSec, marginLeft: "auto" }}>Abrir central</button>
    </div>
  );
}

export default function CentralAlertas({ mun, ano, prioridadeInicial }: { mun: string; ano: number; prioridadeInicial?: Prioridade }) {
  const q = useCentral(mun, ano);
  const [prio, setPrio] = useState<string>(prioridadeInicial ?? "");
  const [cat, setCat] = useState("");
  const [area, setArea] = useState("");
  const [sit, setSit] = useState("");
  const [busca, setBusca] = useState("");
  const [abertos, setAbertos] = useState<Record<string, boolean>>({ critico: true, alto: true, moderado: true, informativo: false, integracao: false });
  const d = q.data;
  const filtrados = useMemo(() => (d?.alertas ?? []).filter(a =>
    (!prio || a.prioridade === prio) && (!cat || a.categoria === cat) && (!area || a.area === area)
    && (!sit || (a.acompanhamento?.situacao ?? "novo") === sit)
    && (!busca || `${a.titulo} ${a.detalhe} ${a.agravo ?? ""}`.toLowerCase().includes(busca.toLowerCase()))), [d, prio, cat, area, sit, busca]);
  if (q.isLoading) return <Vazio>Calculando os alertas…</Vazio>;
  if (!d) return <Vazio>Não foi possível carregar a central de alertas agora.</Vazio>;
  const epid = filtrados.filter(a => a.categoria !== "integracao");
  const tecnicos = filtrados.filter(a => a.categoria === "integracao");
  const grupos = (["critico", "alto", "moderado", "informativo"] as Prioridade[]).map(p => ({ p, itens: epid.filter(a => a.prioridade === p) }));
  const areas = Array.from(new Set(d.alertas.map(a => a.area)));
  return <>
    <Secao titulo="Central de alertas">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
        {(["critico", "alto", "moderado", "informativo"] as Prioridade[]).map(p => {
          const s = PRIORIDADE[p]; const n = d.alertas.filter(a => a.prioridade === p && a.categoria !== "integracao").length;
          return <button key={p} onClick={() => setPrio(prio === p ? "" : p)} aria-pressed={prio === p}
            style={{ textAlign: "left", background: prio === p ? s.fundo : "#fff", border: `1px solid ${prio === p ? s.cor : COR.borda}`,
              borderLeft: `4px solid ${s.cor}`, borderRadius: 10, padding: "8px 10px", cursor: "pointer" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: s.cor, display: "flex", gap: 4, alignItems: "center" }}><s.Icon size={13} /> {s.rotulo}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COR.texto }}>{n}</div>
          </button>;
        })}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={rotuloStyle}>Categoria
          <select value={cat} onChange={e => setCat(e.target.value)} style={selectStyle}>
            <option value="">Todas</option>{Object.entries(CATEGORIA).map(([k, v]) => <option key={k} value={k}>{v} ({d.por_categoria[k] ?? 0})</option>)}
          </select></label>
        <label style={rotuloStyle}>Área
          <select value={area} onChange={e => setArea(e.target.value)} style={selectStyle}>
            <option value="">Todas</option>{areas.map(a => <option key={a} value={a}>{AREA[a] ?? a}</option>)}
          </select></label>
        {d.acompanhamento_habilitado && <label style={rotuloStyle}>Acompanhamento
          <select value={sit} onChange={e => setSit(e.target.value)} style={selectStyle}>
            <option value="">Todos</option>{d.situacoes.map(s => <option key={s} value={s}>{SITUACAO[s]}</option>)}
          </select></label>}
        <label style={{ ...rotuloStyle, flex: "1 1 200px" }}>Buscar
          <span style={{ position: "relative" }}><Search size={13} style={{ position: "absolute", left: 9, top: 11, color: COR.sub }} />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Agravo, indicador…" style={{ ...selectStyle, width: "100%", paddingLeft: 28 }} /></span></label>
      </div>
      {grupos.map(({ p, itens }) => itens.length > 0 && (
        <Grupo key={p} titulo={<><SeloPrioridade p={p} /> <span style={{ color: COR.sub, fontWeight: 600 }}>{itens.length} alerta(s)</span></>}
          aberto={abertos[p]} onAlternar={() => setAbertos(a => ({ ...a, [p]: !a[p] }))}>
          {itens.map(a => <LinhaAlerta key={a.chave} a={a} ano={ano} central={d} />)}
        </Grupo>
      ))}
      {!epid.length && <Vazio>Nenhum alerta epidemiológico, ambiental ou de desempenho com os filtros escolhidos.</Vazio>}
    </Secao>

    <Secao titulo={<span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Wrench size={15} /> Avisos técnicos de integração</span>}>
      <div style={{ fontSize: 12, color: COR.sub }}>Situação da coleta automática das fontes. Não são alertas epidemiológicos.</div>
      {tecnicos.length ? (
        <Grupo titulo={<span style={{ color: COR.sub, fontWeight: 600 }}>{tecnicos.length} aviso(s)</span>} aberto={abertos.integracao}
          onAlternar={() => setAbertos(a => ({ ...a, integracao: !a.integracao }))}>
          {tecnicos.map(a => <LinhaAlerta key={a.chave} a={a} ano={ano} central={d} />)}
        </Grupo>
      ) : <Vazio>Todas as fontes atualizadas.</Vazio>}
    </Secao>

    <details style={{ fontSize: 12, color: COR.sub, background: "#fff", border: `1px solid ${COR.borda}`, borderRadius: 10, padding: "8px 12px" }}>
      <summary style={{ cursor: "pointer", fontWeight: 700, color: COR.texto }}>Critérios de prioridade (documentados)</summary>
      {(Object.keys(d.criterios) as Prioridade[]).map(k => <p key={k} style={{ margin: "6px 0" }}><b>{PRIORIDADE[k].rotulo}:</b> {d.criterios[k]}</p>)}
      <p style={{ margin: "6px 0" }}>{d.legenda.oficial} {d.legenda.calculado}</p>
    </details>
  </>;
}

function Grupo({ titulo, aberto, onAlternar, children }: { titulo: React.ReactNode; aberto: boolean; onAlternar: () => void; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${COR.borda}`, borderRadius: 10, background: "#fff", overflow: "hidden" }}>
      <button onClick={onAlternar} aria-expanded={aberto} style={{ width: "100%", display: "flex", gap: 8, alignItems: "center", padding: "9px 12px",
        background: COR.fundo, border: 0, borderBottom: aberto ? `1px solid ${COR.borda}` : 0, cursor: "pointer", fontSize: 12.5 }}>
        {aberto ? <ChevronDown size={15} /> : <ChevronRight size={15} />} {titulo}
      </button>
      {aberto && <div>{children}</div>}
    </div>
  );
}

function LinhaAlerta({ a, ano, central }: { a: AlertaCentral; ano: number; central: Central }) {
  const [aberto, setAberto] = useState(false);
  const s = PRIORIDADE[a.prioridade];
  const situacao = a.acompanhamento?.situacao;
  return (
    <div style={{ borderBottom: `1px solid ${COR.borda}`, borderLeft: `3px solid ${s.cor}` }}>
      <button onClick={() => setAberto(x => !x)} aria-expanded={aberto}
        style={{ width: "100%", display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", background: "none", border: 0, cursor: "pointer", textAlign: "left" }}>
        {aberto ? <ChevronDown size={14} color={COR.sub} /> : <ChevronRight size={14} color={COR.sub} />}
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: COR.texto }}>{a.titulo}</span>
        <span style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 10.5, color: COR.sub }}>{AREA[a.area] ?? a.area}</span>
          <TagOrigem origem={a.tipo} />
          {situacao && <span style={{ fontSize: 10.5, fontWeight: 700, borderRadius: 4, padding: "1px 6px",
            color: situacao === "novo" ? COR.medio : situacao === "encerrado" || situacao === "descartado" ? "#15803d" : COR.oficial,
            background: "#f1f5f9" }}>{SITUACAO[situacao]}</span>}
        </span>
      </button>
      {aberto && (
        <div style={{ padding: "0 12px 12px 34px", display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: COR.texto }}>
          <div>{a.detalhe}</div>
          {a.formula && <div style={{ fontSize: 11.5, color: COR.sub }}><b>Indicador/critério:</b> {a.formula}</div>}
          <div style={{ fontSize: 11.5, color: COR.sub }}><b>Fonte:</b> {a.fonte} · <b>Categoria:</b> {CATEGORIA[a.categoria]} · <b>Período:</b> {ano}
            {a.agravo ? <> · <b>Agravo:</b> {a.agravo}</> : null}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SUBABA_ROTA[a.subaba] && a.subaba !== "painel" && <Link to={SUBABA_ROTA[a.subaba]} style={botaoSec}>Abrir subaba</Link>}
          </div>
          {central.acompanhamento_habilitado && a.categoria !== "integracao" && <Acompanhamento a={a} ano={ano} podeRegistrar={central.pode_registrar} situacoes={central.situacoes} />}
          {!central.acompanhamento_habilitado && <div style={{ fontSize: 11.5, color: COR.sub }}>O acompanhamento (avaliação técnica e providências)
            só é registrado pelo próprio município.</div>}
        </div>
      )}
    </div>
  );
}

function Acompanhamento({ a, ano, podeRegistrar, situacoes }: { a: AlertaCentral; ano: number; podeRegistrar: boolean; situacoes: string[] }) {
  const qc = useQueryClient();
  const hist = useQuery({ queryKey: ["vig-alerta-hist", a.chave],
    queryFn: () => apiGet<{ historico: { situacao: string; avaliacao: string | null; providencias: string | null; usuario: string; perfil: string; criado_em: string }[] }>(
      `${FVS_API}/alertas/acompanhamento/${a.chave}`) });
  const [situacao, setSituacao] = useState(a.acompanhamento?.situacao === "novo" ? "em_avaliacao" : a.acompanhamento?.situacao ?? "em_avaliacao");
  const [avaliacao, setAvaliacao] = useState("");
  const [providencias, setProvidencias] = useState("");
  const salvar = useMutation({
    mutationFn: () => apiPost(`${FVS_API}/alertas/acompanhamento`, { chave: a.chave, titulo: a.titulo, ano, situacao,
      avaliacao: avaliacao || null, providencias: providencias || null }),
    onSuccess: () => { setAvaliacao(""); setProvidencias("");
      qc.invalidateQueries({ queryKey: ["vig-central"] }); qc.invalidateQueries({ queryKey: ["vig-alerta-hist", a.chave] }); },
  });
  const area: React.CSSProperties = { ...selectStyle, width: "100%", minHeight: 56, fontFamily: "inherit", resize: "vertical" };
  return (
    <div style={{ background: COR.fundo, border: `1px solid ${COR.borda}`, borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
      <b style={{ fontSize: 12.5 }}>Acompanhamento técnico</b>
      {podeRegistrar ? (
        <form onSubmit={e => { e.preventDefault(); salvar.mutate(); }} style={{ display: "grid", gap: 6 }}>
          <label style={rotuloStyle}>Situação
            <select value={situacao} onChange={e => setSituacao(e.target.value)} style={{ ...selectStyle, maxWidth: 240 }}>
              {situacoes.filter(s => s !== "novo").map(s => <option key={s} value={s}>{SITUACAO[s]}</option>)}</select></label>
          <label style={rotuloStyle}>Avaliação técnica
            <textarea value={avaliacao} onChange={e => setAvaliacao(e.target.value)} maxLength={4000} style={area}
              placeholder="O que foi verificado (ficha, investigação, consistência do dado). Não registrar nome, CPF ou CNS de paciente." /></label>
          <label style={rotuloStyle}>Providências
            <textarea value={providencias} onChange={e => setProvidencias(e.target.value)} maxLength={4000} style={area} /></label>
          <div><button type="submit" style={botaoPri} disabled={salvar.isPending}>{salvar.isPending ? "Salvando…" : "Registrar"}</button></div>
          {salvar.isError && <div style={{ color: COR.alto, fontSize: 12 }}>Não foi possível registrar (verifique sua permissão).</div>}
        </form>
      ) : <div style={{ fontSize: 11.5, color: COR.sub }}>Seu perfil pode consultar, mas não registrar acompanhamento.</div>}
      {(hist.data?.historico.length ?? 0) > 0 && (
        <div style={{ display: "grid", gap: 4 }}>
          <b style={{ fontSize: 11.5, color: COR.sub }}>Histórico de alterações</b>
          {hist.data!.historico.map((h, i) => (
            <div key={i} style={{ fontSize: 11.5, borderLeft: `2px solid ${COR.borda}`, paddingLeft: 8 }}>
              <b>{SITUACAO[h.situacao]}</b> · {dataHora(h.criado_em)} · {h.usuario} ({h.perfil})
              {h.avaliacao && <div><i>Avaliação:</i> {h.avaliacao}</div>}
              {h.providencias && <div><i>Providências:</i> {h.providencias}</div>}
            </div>))}
        </div>
      )}
    </div>
  );
}
