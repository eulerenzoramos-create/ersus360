/**
 * Agente IA de análise das Portarias do FNS — usado na aba Repasses Mensais — FNS › Portarias.
 * Etiquetas de natureza, painel consolidado, filtros, análise técnica individual e
 * "Consultar Aplicação do Recurso". Consultivo: não autoriza despesa nem altera repasses.
 */
import { useState, type CSSProperties, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, ExternalLink, RefreshCw, ShieldCheck, Sparkles, AlertTriangle, CheckCircle, Download, Printer, Mail } from "lucide-react";
import { api, apiGet, apiPost } from "../lib/api";

const C = {
  indigo: "#283593", indigoL: "#e8eaf6", green: "#2e7d32", greenL: "#e8f5e9",
  blue: "#1565c0", blueL: "#e3f0ff", amber: "#b45309", amberL: "#fff3e0",
  red: "#c62828", redL: "#ffebee", gray: "#6b7280", grayL: "#f4f6f8", bdr: "#e4e7ec",
  txt: "#111827", sec: "#6b7280", white: "#ffffff", purple: "#6a1b9a", purpleL: "#f3e5f5",
};
const BRL = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const dataBR = (s?: string | null) => (s ? new Date(s.length === 10 ? s + "T12:00:00" : s).toLocaleDateString("pt-BR") : "—");

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface PortariaIAResumo {
  numero_portaria: string; naturezas: string[]; situacao: string; classificacao_texto: string;
  programas: string[]; grupos: string[]; blocos: string[]; finalidade: string;
  valor_transferido: number; qtd_transferencias: number; pendencias: number;
  verificado_em: string | null; validado_por: string | null;
  estado?: string; estado_motivo?: string; programas_vinculados?: string[];
}
export interface PainelIA {
  exercicio: number;
  consolidado: {
    total_custeio: number; total_investimento: number; total_outra_natureza: number; total_pendente: number;
    total_geral: number; portarias_analisadas: number; portarias_validadas: number; portarias_pendentes: number;
    transferencias_analisadas: number; transferencias_sem_identificacao: number;
    por_estado?: Record<string, number>;
  };
  estados?: string[];
  ultima_verificacao: string; normas_verificadas_em: string | null; normas_com_alerta: string[];
  portarias: PortariaIAResumo[]; aviso: string;
}
interface Citacao { chave: string; norma: string; dispositivo: string; resumo: string; redacao: string; url: string; vigencia?: string; como_se_aplica?: string }
interface CategoriaDespesa { categoria: string; rotulo: string; classificacao: string; justificativa: string; fundamentacao: Citacao[] }
interface AnaliseIA {
  numero_portaria: string; naturezas: string[]; situacao: string; classificacao_texto: string;
  identificacao: {
    numero: string; ano: number | null; data_publicacao: string | null; orgao: string | null; link: string | null;
    objeto_documento: string | null; programas: string[]; grupos: string[]; blocos: string[]; finalidade: string;
    naturezas: Record<string, number>; valor_transferido: number; municipio: string | null; fundo_cnpj: string | null;
    candidatos_catalogo: { numero: string; ano: number }[];
  };
  despesas: Record<string, CategoriaDespesa[]>;
  aplicacao: string[]; restricoes: string[];
  prazos: Record<string, any>; saldos: Record<string, any>;
  fundamentacao: Citacao[]; orientacao: string; pendencias: string[];
  transferencias: { id: number; mes: number; numero_ob: string | null; programa: string | null; bloco: string | null;
    natureza: string; despesa: string; valor_liquido: number; finalidade: string; propostas: string[]; parcela_fns: string | null }[];
  verificado_em: string | null; validacao: { por: string; em: string; nota: string | null } | null; aviso: string;
  links?: LinksPortaria;
  estado_validacao?: string; estado_motivo?: string;
  portaria_repasse?: { numero: string; numero_formatado: string | null; ano: number | null; data_publicacao: string | null; link: string | null; papel: string };
  programas_vinculados?: ProgramaVinculado[];
  programas_sem_norma?: { nome: string; valor: number; qtd: number }[];
  como_utilizar?: { programa: string; limite: string; exemplos: string[] }[];
  despesas_vedadas?: { despesa: string; recurso: string; justificativa: string; fundamentacao: string[] }[];
  condicoes_execucao?: string[];
  registro_validacao?: { responsavel: string; em: string; nota: string | null; estado_na_validacao: string; fontes: { norma: string; dispositivo: string; url: string }[] };
  alteracoes?: string[];
  historico?: { versao_arquivada_em: string | null; estado: string | null; validado_por: string | null; motivo: string | null }[];
}
interface NormaOrigem extends Citacao { papel: string; conferido: boolean | null; verificado_em: string | null }
interface ProgramaVinculado {
  chave: string; nome: string; valor: number; qtd: number; normas: NormaOrigem[]; limite: string;
  exemplos: string[]; condicoes: string[]; pendente: string | null;
}
interface RespostaConsulta {
  norma_origem?: string;
  classificacao: string; categoria: string; justificativa: string; base_legal: Citacao[];
  condicoes: string[]; falta_confirmar: string[]; orientacao: string; aviso: string; citacoes_descartadas: string[];
}

// ─── Etiquetas ────────────────────────────────────────────────────────────────
const NAT_COR: Record<string, { bg: string; txt: string }> = {
  "CUSTEIO": { bg: C.blueL, txt: C.blue },
  "INVESTIMENTO": { bg: C.greenL, txt: C.green },
  "OUTRA NATUREZA": { bg: C.purpleL, txt: C.purple },
  "EM ANÁLISE": { bg: C.amberL, txt: C.amber },
};
export function EtiquetasNatureza({ resumo }: { resumo?: PortariaIAResumo }) {
  const nats = !resumo ? ["EM ANÁLISE"] : resumo.naturezas.length ? resumo.naturezas : ["EM ANÁLISE"];
  const pendente = resumo?.situacao === "pendente_confirmacao";
  return (
    <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap", verticalAlign: "middle" }}>
      {nats.map(n => (
        <span key={n} style={{ background: NAT_COR[n]?.bg ?? C.grayL, color: NAT_COR[n]?.txt ?? C.gray,
          border: `1px solid ${NAT_COR[n]?.txt ?? C.gray}33`, borderRadius: 4, padding: "1px 6px",
          fontSize: 10, fontWeight: 800, letterSpacing: 0.3 }}>{n}</span>
      ))}
      {pendente && !nats.includes("EM ANÁLISE") && (
        <span style={{ background: NAT_COR["EM ANÁLISE"].bg, color: C.amber, borderRadius: 4, padding: "1px 6px",
          fontSize: 10, fontWeight: 800 }}>EM ANÁLISE</span>
      )}
      {resumo?.estado
        ? <EtiquetaEstado estado={resumo.estado} titulo={resumo.estado_motivo} />
        : resumo?.situacao === "validada" && (
          <span title={`Validada por ${resumo.validado_por ?? ""}`} style={{ background: C.greenL, color: C.green,
            borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>✓ VALIDADA</span>
        )}
    </span>
  );
}

const ESTADO_COR: Record<string, { bg: string; txt: string }> = {
  "ANÁLISE PENDENTE": { bg: C.redL, txt: C.red },
  "NORMA LOCALIZADA": { bg: C.amberL, txt: C.amber },
  "FUNDAMENTAÇÃO CONFERIDA": { bg: C.blueL, txt: C.blue },
  "AGUARDANDO VALIDAÇÃO TÉCNICA": { bg: C.indigoL, txt: C.indigo },
  "VALIDADA PELO RESPONSÁVEL": { bg: C.greenL, txt: C.green },
};
export const EtiquetaEstado = ({ estado, titulo }: { estado?: string; titulo?: string }) => !estado ? null : (
  <span title={titulo} style={{ background: ESTADO_COR[estado]?.bg ?? C.grayL, color: ESTADO_COR[estado]?.txt ?? C.gray,
    border: `1px solid ${(ESTADO_COR[estado]?.txt ?? C.gray)}55`, borderRadius: 999, padding: "1px 8px", fontSize: 10,
    fontWeight: 800, whiteSpace: "nowrap" }}>{estado}</span>
);

const CLS_COR: Record<string, { bg: string; txt: string }> = {
  "PERMITIDO": { bg: C.greenL, txt: C.green },
  "PERMITIDO COM CONDIÇÕES": { bg: C.blueL, txt: C.blue },
  "VEDADO": { bg: C.redL, txt: C.red },
  "EXIGE ANÁLISE COMPLEMENTAR": { bg: C.amberL, txt: C.amber },
  "CLASSIFICAÇÃO PENDENTE DE CONFIRMAÇÃO": { bg: C.amberL, txt: C.amber },
};
const Classe = ({ c }: { c: string }) => (
  <span style={{ background: CLS_COR[c]?.bg ?? C.grayL, color: CLS_COR[c]?.txt ?? C.gray, borderRadius: 4,
    padding: "2px 7px", fontSize: 10.5, fontWeight: 800, whiteSpace: "nowrap" }}>{c}</span>
);

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function usePortariasIA(exercicio: number) {
  return useQuery<PainelIA>({
    queryKey: ["fns-portarias-ia", exercicio],
    queryFn: () => apiGet(`/api/fns-portarias-ia/painel?exercicio=${exercicio}`),
    staleTime: 300_000,
  });
}

// ─── Filtros ──────────────────────────────────────────────────────────────────
export interface FiltrosIA { portaria: string; programa: string; bloco: string; natureza: string; situacao: string }
export const FILTROS_VAZIOS: FiltrosIA = { portaria: "", programa: "", bloco: "", natureza: "", situacao: "" };

export function passaFiltro(p: { numero_portaria: string }, r: PortariaIAResumo | undefined, f: FiltrosIA): boolean {
  if (f.portaria && !p.numero_portaria.toLowerCase().includes(f.portaria.toLowerCase())) return false;
  if (!r) return !(f.programa || f.bloco || f.natureza || f.situacao);
  if (f.programa && !r.grupos.includes(f.programa)) return false;
  if (f.bloco && !r.blocos.includes(f.bloco)) return false;
  if (f.natureza && !(r.naturezas.length ? r.naturezas : ["EM ANÁLISE"]).includes(f.natureza)) return false;
  if (f.situacao && (r.estado ?? r.situacao) !== f.situacao) return false;
  return true;
}

// ─── Painel consolidado ───────────────────────────────────────────────────────
export function PainelConsolidadoIA({ painel, filtros, setFiltros, exercicio }: {
  painel?: PainelIA; filtros: FiltrosIA; setFiltros: (f: FiltrosIA) => void; exercicio: number;
}) {
  const qc = useQueryClient();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  if (!painel) return null;
  const k = painel.consolidado;
  const programas = [...new Set(painel.portarias.flatMap(p => p.grupos))].sort();
  const blocos = [...new Set(painel.portarias.flatMap(p => p.blocos))].sort();

  const executar = async (tipo: "lote" | "normas") => {
    setOcupado(tipo); setMsg(null);
    try {
      if (tipo === "lote") {
        const r: any = await apiPost(`/api/fns-portarias-ia/analisar-lote?exercicio=${exercicio}`);
        setMsg(`Análise em lote concluída: ${r.portarias} portarias, ${r.transferencias} transferências.`);
      } else {
        const r: any = await apiPost(`/api/fns-portarias-ia/verificar-normas`);
        setMsg(`Normas conferidas no texto oficial: ${r.conferem} conferem` +
          (r.nao_conferem.length ? `, ${r.nao_conferem.length} com possível alteração` : "") +
          (r.indisponiveis.length ? `, ${r.indisponiveis.length} indisponíveis` : "") + ".");
      }
      await qc.invalidateQueries({ queryKey: ["fns-portarias-ia"] });
    } catch (e: any) {
      setMsg(e?.response?.data?.detail ?? "Não foi possível concluir agora.");
    } finally { setOcupado(null); }
  };

  const card = (label: string, val: string | number, cor: string, sub?: string) => (
    <div style={{ flex: "1 1 160px", background: C.white, borderRadius: 10, padding: "10px 14px", border: `1px solid ${C.bdr}` }}>
      <div style={{ fontSize: 11, color: C.sec }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 17, color: cor, marginTop: 2 }}>{val}</div>
      {sub && <div style={{ fontSize: 10.5, color: C.sec, marginTop: 2 }}>{sub}</div>}
    </div>
  );
  const sel = (label: string, key: keyof FiltrosIA, opts: [string, string][]) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 10, fontWeight: 600, color: C.sec, minWidth: 140, flex: "1 1 140px" }}>
      {label}
      <select value={filtros[key]} onChange={e => setFiltros({ ...filtros, [key]: e.target.value })}
        style={{ padding: "5px 6px", borderRadius: 6, border: `1px solid ${C.bdr}`, fontSize: 12, background: C.white, color: C.txt }}>
        <option value="">Todos</option>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );

  return (
    <div style={{ background: C.indigoL, border: `1px solid #c5cae9`, borderRadius: 12, padding: 14, marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <Sparkles size={16} color={C.indigo} />
        <span style={{ fontWeight: 800, color: C.indigo, fontSize: 14 }}>Agente de Análise das Portarias</span>
        <span style={{ fontSize: 11, color: C.sec }}>
          Última verificação: {dataBR(painel.ultima_verificacao)} · Normas conferidas no texto oficial: {painel.normas_verificadas_em ? dataBR(painel.normas_verificadas_em) : "ainda não (conferência manual 16/11/2026)"}
        </span>
        <span style={{ flex: 1 }} />
        <button onClick={() => executar("normas")} disabled={!!ocupado} style={btn(false)}>
          <ShieldCheck size={13} /> {ocupado === "normas" ? "Conferindo…" : "Verificar normas"}
        </button>
        <button onClick={() => executar("lote")} disabled={!!ocupado} style={btn(true)}>
          <RefreshCw size={13} /> {ocupado === "lote" ? "Analisando…" : "Reanalisar todas"}
        </button>
      </div>
      {painel.normas_com_alerta.length > 0 && (
        <div style={{ background: C.amberL, color: C.amber, borderRadius: 8, padding: "6px 10px", fontSize: 12, marginBottom: 8 }}>
          <AlertTriangle size={13} style={{ verticalAlign: "-2px" }} /> Dispositivo não reencontrado no texto oficial (possível alteração ou revogação): {painel.normas_com_alerta.join(", ")}. As portarias afetadas ficaram pendentes de confirmação.
        </div>
      )}
      {msg && <div style={{ fontSize: 12, color: C.indigo, marginBottom: 8 }}>{msg}</div>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        {card("Custeio", BRL(k.total_custeio), C.blue, "Bloco de Manutenção")}
        {card("Investimento", BRL(k.total_investimento), C.green, "Bloco de Estruturação")}
        {card("Classificação pendente", BRL(k.total_pendente), C.amber, "Em análise / outra natureza")}
        {card("Portarias analisadas", k.portarias_analisadas, C.indigo, `${k.portarias_validadas} validadas · ${k.portarias_pendentes} pendentes`)}
        {card("Transferências sem identificação normativa", k.transferencias_sem_identificacao, C.red, `de ${k.transferencias_analisadas} analisadas (sem dupla contagem)`)}
      </div>
      {k.por_estado && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.sec, fontWeight: 600 }}>Validação das análises:</span>
          {Object.entries(k.por_estado).map(([e, n]) => (
            <button key={e} onClick={() => setFiltros({ ...filtros, situacao: filtros.situacao === e ? "" : e })}
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, opacity: n ? 1 : 0.5 }}>
              <EtiquetaEstado estado={`${e}`} /> <b style={{ fontSize: 11, color: C.txt }}>{n}</b>
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 10, fontWeight: 600, color: C.sec, flex: "1 1 140px" }}>
          Portaria
          <input value={filtros.portaria} onChange={e => setFiltros({ ...filtros, portaria: e.target.value })}
            placeholder="Nº" style={{ padding: "5px 6px", borderRadius: 6, border: `1px solid ${C.bdr}`, fontSize: 12 }} />
        </label>
        {sel("Programa", "programa", programas.map(p => [p, p]))}
        {sel("Bloco de financiamento", "bloco", blocos.map(b => [b, b]))}
        {sel("Natureza", "natureza", ["CUSTEIO", "INVESTIMENTO", "OUTRA NATUREZA", "EM ANÁLISE"].map(n => [n, n]))}
        {sel("Situação da análise", "situacao", (painel.estados ?? []).map(e => [e, e]))}
        <button onClick={() => setFiltros(FILTROS_VAZIOS)} style={btn(false)}>Limpar</button>
      </div>
      <div style={{ fontSize: 10.5, color: C.sec, marginTop: 8 }}>{painel.aviso}</div>
    </div>
  );
}

const btn = (primario: boolean): CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, fontSize: 12,
  fontWeight: 700, cursor: "pointer", border: primario ? "none" : `1px solid ${C.indigo}55`,
  background: primario ? C.indigo : C.white, color: primario ? C.white : C.indigo,
});

// ─── Análise técnica individual + consulta ────────────────────────────────────
export function AnaliseTecnicaPortaria({ numero, exercicio, abrirConsulta, onClose }: {
  numero: string; exercicio: number; abrirConsulta?: boolean; onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: r, isLoading, error } = useQuery<AnaliseIA>({
    queryKey: ["fns-portaria-ia", exercicio, numero],
    queryFn: () => apiGet(`/api/fns-portarias-ia/portaria?exercicio=${exercicio}&numero=${encodeURIComponent(numero)}`),
  });
  const [aba, setAba] = useState<"analise" | "despesas" | "prazos" | "fund" | "consulta">(abrirConsulta ? "consulta" : "analise");
  const [pergunta, setPergunta] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [resp, setResp] = useState<RespostaConsulta | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [validando, setValidando] = useState(false);

  const consultar = async () => {
    if (pergunta.trim().length < 5) return;
    setConsultando(true); setErro(null); setResp(null);
    try {
      setResp(await apiPost<RespostaConsulta>("/api/fns-portarias-ia/consultar", { numero, exercicio, pergunta }));
    } catch (e: any) {
      setErro(e?.response?.data?.detail ?? "Não foi possível consultar a IA agora.");
    } finally { setConsultando(false); }
  };
  const validar = async () => {
    setValidando(true);
    try {
      await apiPost("/api/fns-portarias-ia/validar", { numero, exercicio });
      await qc.invalidateQueries({ queryKey: ["fns-portaria-ia", exercicio, numero] });
      await qc.invalidateQueries({ queryKey: ["fns-portarias-ia"] });
    } catch (e: any) {
      setErro(e?.response?.data?.detail ?? "Não foi possível validar.");
    } finally { setValidando(false); }
  };

  const titulo = numero === "Sem portaria" ? "Transferências sem portaria identificada" : `Portaria nº ${numero}`;
  const sec = (t: string) => <div style={{ fontWeight: 800, color: C.indigo, fontSize: 12.5, textTransform: "uppercase", letterSpacing: 0.4, margin: "14px 0 6px" }}>{t}</div>;
  const linha = (k: string, v: ReactNode) => (
    <div style={{ display: "flex", gap: 10, fontSize: 12.5, padding: "3px 0", borderBottom: `1px dashed ${C.bdr}` }}>
      <span style={{ color: C.sec, minWidth: 170 }}>{k}</span><span style={{ color: C.txt, flex: 1 }}>{v}</span>
    </div>
  );
  const citacao = (c: Citacao) => (
    <div key={c.chave} style={{ fontSize: 12, padding: "6px 0", borderBottom: `1px solid ${C.bdr}` }}>
      <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, color: C.blue }}>
        {c.norma}, {c.dispositivo} <ExternalLink size={11} style={{ verticalAlign: "-1px" }} />
      </a>
      <div style={{ color: C.txt }}>{c.resumo}</div>
      {c.como_se_aplica && <div style={{ color: C.indigo }}>→ {c.como_se_aplica}</div>}
      <div style={{ color: C.sec, fontSize: 11 }}>Redação: {c.redacao}{c.vigencia ? ` · ${c.vigencia}` : ""}</div>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,.45)", zIndex: 1000,
      display: "flex", justifyContent: "flex-end" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "min(860px, 100%)", height: "100%", background: C.white,
        overflowY: "auto", boxShadow: "-8px 0 24px rgba(0,0,0,.15)", padding: "18px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.sec, fontWeight: 600 }}>ANÁLISE TÉCNICA — EXERCÍCIO {exercicio}</div>
            <div style={{ fontWeight: 800, fontSize: 19, color: C.txt }}>{titulo}</div>
            {r && <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <EtiquetasNatureza resumo={{ ...r, situacao: r.situacao } as any} />
              <span style={{ fontSize: 11, color: r.situacao === "pendente_confirmacao" ? C.amber : C.sec, fontWeight: 600 }}>
                {r.validacao ? `Validada por ${r.validacao.por} em ${dataBR(r.validacao.em)}` : r.classificacao_texto}
              </span>
            </div>}
          </div>
          {r && <AcoesPdf numero={numero} exercicio={exercicio} />}
          <button onClick={onClose} aria-label="Fechar" style={{ border: "none", background: "transparent", cursor: "pointer", color: C.gray }}><X size={20} /></button>
        </div>

        <div style={{ display: "flex", gap: 4, marginTop: 12, borderBottom: `1px solid ${C.bdr}`, flexWrap: "wrap" }}>
          {([["analise", "Análise"], ["despesas", "Despesas permitidas"], ["prazos", "Prazos, saldos e planos"], ["fund", "Fundamentação"], ["consulta", "Consultar Aplicação do Recurso"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setAba(k)} style={{ border: "none", background: "transparent", cursor: "pointer",
              padding: "8px 10px", fontSize: 12.5, fontWeight: aba === k ? 800 : 500, color: aba === k ? C.indigo : C.sec,
              borderBottom: aba === k ? `3px solid ${C.indigo}` : "3px solid transparent" }}>{l}</button>
          ))}
        </div>

        {isLoading && <div style={{ padding: 30, color: C.sec }}>Analisando…</div>}
        {error && <div style={{ padding: 30, color: C.red }}>Não foi possível carregar a análise.</div>}

        {r && aba === "analise" && (
          <div>
            {r.estado_validacao && (
              <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
                background: ESTADO_COR[r.estado_validacao]?.bg ?? C.grayL, borderRadius: 8, padding: "8px 12px" }}>
                <EtiquetaEstado estado={r.estado_validacao} />
                <span style={{ fontSize: 12, color: C.txt }}>{r.validacao ? `Validada por ${r.validacao.por} em ${dataBR(r.validacao.em)}` : r.estado_motivo}</span>
              </div>
            )}
            {sec("Identificação do recurso")}
            <DocumentoOficial numero={numero} exercicio={exercicio} links={r.links} />
            <NormasOrigem r={r} />
            {r.pendencias.length > 0 && (
              <div style={{ background: C.amberL, borderRadius: 8, padding: "8px 12px", marginTop: 12, fontSize: 12, color: C.amber }}>
                <b>Pendências:</b>
                <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>{r.pendencias.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
            )}
            {sec("Identificação")}
            {linha("Número", r.identificacao.numero)}
            {linha("Ano / publicação", r.identificacao.ano ? `${r.identificacao.ano} · ${dataBR(r.identificacao.data_publicacao)}` : "Não confirmado — portaria não cadastrada no catálogo")}
            {linha("Natureza do recurso", Object.entries(r.identificacao.naturezas).map(([n, v]) => `${n}: ${BRL(v)}`).join(" · "))}
            {linha("Bloco de financiamento (FNS)", r.identificacao.blocos.join(" · ") || "Não informado pelo FNS")}
            {linha("Programa / componente (FNS)", r.identificacao.programas.join(" · "))}
            {linha("Finalidade", r.identificacao.finalidade)}
            {linha("Valor transferido", <b style={{ color: C.green }}>{BRL(r.identificacao.valor_transferido)}</b>)}
            {linha("Município / fundo", `${r.identificacao.municipio ?? "—"} · FMS ${r.identificacao.fundo_cnpj ?? "—"}`)}
            {(r.como_utilizar?.length ?? 0) > 0 && <>
              {sec("Como utilizar o recurso")}
              {r.como_utilizar!.map(cu => (
                <div key={cu.programa} style={{ fontSize: 12.5, marginBottom: 8 }}>
                  <b>{cu.programa}:</b> {cu.limite}
                  <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>{cu.exemplos.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
              ))}
            </>}
            {(r.despesas_vedadas?.length ?? 0) > 0 && <>
              {sec("Despesas vedadas")}
              {[...new Map(r.despesas_vedadas!.map(d => [`${d.despesa}|${d.recurso}`, d])).values()].map(d => (
                <div key={`${d.despesa}|${d.recurso}`} style={{ fontSize: 12, padding: "3px 0", borderBottom: `1px dashed ${C.bdr}` }}>
                  <b style={{ color: C.red }}>{d.despesa}</b> <span style={{ color: C.sec }}>({d.recurso})</span> — {d.justificativa}
                  <div style={{ color: C.sec, fontSize: 11 }}>{d.fundamentacao.join("; ")}</div>
                </div>
              ))}
            </>}
            {(r.condicoes_execucao?.length ?? 0) > 0 && <>
              {sec("Condições para execução")}
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5 }}>{r.condicoes_execucao!.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </>}
            {sec("Aplicação")}
            <div style={{ fontSize: 12.5 }}>{r.aplicacao.length ? r.aplicacao.join(" · ") : "Nenhuma despesa confirmada — análise complementar."}</div>
            {sec("Restrições")}
            <div style={{ fontSize: 12.5, color: C.red }}>{r.restricoes.length ? r.restricoes.join(" · ") : "Nenhuma vedação expressa identificada; ver categorias que exigem análise."}</div>
            {sec("Orientação ao gestor")}
            <div style={{ fontSize: 13, background: C.indigoL, borderRadius: 8, padding: "10px 12px", color: C.txt, lineHeight: 1.5 }}>{r.orientacao}</div>
            {r.registro_validacao && (
              <div style={{ fontSize: 11.5, color: C.sec, marginTop: 10 }}>
                Validação registrada por <b>{r.registro_validacao.responsavel}</b> em {dataBR(r.registro_validacao.em)}
                {r.registro_validacao.nota ? ` — “${r.registro_validacao.nota}”` : ""} · {r.registro_validacao.fontes.length} fonte(s) conferida(s).
              </div>
            )}
            {(r.alteracoes?.length ?? 0) > 0 && <>
              {sec("Alterações desde a análise anterior")}
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>{r.alteracoes!.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </>}
            {(r.historico?.length ?? 0) > 0 && (
              <div style={{ fontSize: 11, color: C.sec, marginTop: 6 }}>
                Histórico: {r.historico!.length} versão(ões) anterior(es) preservada(s) para auditoria
                {r.historico![0].versao_arquivada_em ? ` — última em ${dataBR(r.historico![0].versao_arquivada_em)}` : ""}.
              </div>
            )}
            {sec("Transferências classificadas")}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                <thead><tr style={{ background: C.grayL }}>
                  {["Mês", "OB", "Programa", "Natureza", "Despesa", "Parcela", "Valor"].map(h => <th key={h} style={{ textAlign: "left", padding: "5px 8px", color: C.sec }}>{h}</th>)}
                </tr></thead>
                <tbody>{r.transferencias.map(t => (
                  <tr key={t.id} style={{ borderBottom: `1px solid ${C.bdr}` }}>
                    <td style={{ padding: "4px 8px" }}>{t.mes ? MESES[t.mes - 1] : "—"}</td>
                    <td style={{ padding: "4px 8px" }}>{t.numero_ob ?? "—"}</td>
                    <td style={{ padding: "4px 8px", maxWidth: 260 }}>{t.programa ?? "—"}{t.propostas.length ? <div style={{ color: C.sec }}>Proposta {t.propostas.join(", ")}</div> : null}</td>
                    <td style={{ padding: "4px 8px" }}><span style={{ color: NAT_COR[t.natureza]?.txt, fontWeight: 700 }}>{t.natureza}</span></td>
                    <td style={{ padding: "4px 8px" }}>{t.despesa}</td>
                    <td style={{ padding: "4px 8px" }}>{t.parcela_fns ?? "—"}</td>
                    <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{BRL(t.valor_liquido)}</td>
                  </tr>))}</tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
              {!r.validacao && (r.estado_validacao === "FUNDAMENTAÇÃO CONFERIDA" || r.estado_validacao === "AGUARDANDO VALIDAÇÃO TÉCNICA") && (
                <button onClick={validar} disabled={validando} style={btn(true)}>
                  <CheckCircle size={13} /> {validando ? "Validando…" : "Validar análise técnica (responsável)"}
                </button>
              )}
              <span style={{ fontSize: 11, color: C.sec }}>Última verificação: {dataBR(r.verificado_em)}</span>
              {!r.validacao && r.estado_validacao && !(r.estado_validacao === "FUNDAMENTAÇÃO CONFERIDA" || r.estado_validacao === "AGUARDANDO VALIDAÇÃO TÉCNICA") && (
                <span style={{ fontSize: 11, color: C.amber }}>A validação técnica fica disponível quando a fundamentação estiver conferida.</span>
              )}
            </div>
          </div>
        )}

        {r && aba === "despesas" && Object.entries(r.despesas).map(([nat, cats]) => (
          <div key={nat}>
            {sec(`Recurso: ${nat}`)}
            {cats.map(c => (
              <div key={c.categoria} style={{ border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "8px 10px", marginBottom: 6 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 12.5, flex: 1 }}>{c.rotulo}</span><Classe c={c.classificacao} />
                </div>
                <div style={{ fontSize: 12, color: C.txt, marginTop: 4 }}>{c.justificativa}</div>
                <div style={{ fontSize: 11, color: C.sec, marginTop: 3 }}>
                  {c.fundamentacao.map(f => <a key={f.chave} href={f.url} target="_blank" rel="noopener noreferrer" style={{ marginRight: 10, color: C.blue }}>{f.norma.replace(/ nº /, " ")}, {f.dispositivo}</a>)}
                </div>
              </div>
            ))}
          </div>
        ))}

        {r && aba === "prazos" && (
          <div>
            {sec("Prazos e planos")}
            {linha("Prazo de execução", r.prazos.prazo_execucao)}
            {linha("Saldos remanescentes", r.prazos.saldos_remanescentes)}
            {linha("Plano de trabalho", <>{r.prazos.plano_trabalho.exigido} — {r.prazos.plano_trabalho.texto}
              {(r.prazos.plano_trabalho.propostas || []).map((p: any) => <div key={p.numero_proposta} style={{ color: C.sec, fontSize: 11.5 }}>
                Proposta {p.numero_proposta}{p.objeto ? ` · ${p.objeto}` : ""}{p.planos_trabalho?.length ? ` · ${p.planos_trabalho.length} plano(s) de trabalho (${p.planos_trabalho.map((x: any) => x.situacao).filter(Boolean).join(", ")})` : ""}</div>)}</>)}
            {linha("Planejamento e orçamento", r.prazos.planejamento)}
            {linha("Monitoramento e prestação de contas", r.prazos.monitoramento)}
            {linha("Reprogramação / devolução", r.prazos.reprogramacao_devolucao)}
            {sec("Saldos")}
            {linha("Valor autorizado (previsto)", r.saldos.autorizado != null ? BRL(r.saldos.autorizado) : "Não registrado")}
            {linha("Transferido no exercício", BRL(r.saldos.transferido))}
            {linha("Saldo bancário", r.saldos.bancario_nota)}
            {linha("Saldo contábil", r.saldos.contabil_nota)}
            {linha("Saldo comprometido", r.saldos.comprometido != null ? <>{BRL(r.saldos.comprometido)} <span style={{ color: C.sec }}>({r.saldos.comprometido_nota})</span></> : r.saldos.comprometido_nota)}
            {linha("Saldo disponível", r.saldos.disponivel_estimado != null ? <>{BRL(r.saldos.disponivel_estimado)} <span style={{ color: C.sec }}>({r.saldos.disponivel_nota})</span></> : r.saldos.disponivel_nota)}
          </div>
        )}

        {r && aba === "fund" && <div>{sec("Fundamentação legal e vigência")}{r.fundamentacao.map(citacao)}</div>}

        {r && aba === "consulta" && (
          <div>
            {sec("Consultar Aplicação do Recurso")}
            <div style={{ fontSize: 12, color: C.sec, marginBottom: 6 }}>
              Descreva a despesa pretendida. A resposta considera só esta portaria, a natureza do recurso, a finalidade, o plano de trabalho e a base normativa conferida.
            </div>
            <textarea value={pergunta} onChange={e => setPergunta(e.target.value)} rows={3} maxLength={1500}
              placeholder="Ex.: Posso adquirir um veículo com este recurso?"
              style={{ width: "100%", boxSizing: "border-box", borderRadius: 8, border: `1px solid ${C.bdr}`, padding: 10, fontSize: 13, fontFamily: "inherit" }} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "6px 0 10px" }}>
              {["Posso comprar medicamentos?", "Posso pagar profissionais?", "Posso contratar serviços?", "Posso adquirir equipamentos?", "Posso realizar manutenção predial?", "Posso comprar combustível?", "Posso reformar uma unidade de saúde?", "Posso utilizar saldo remanescente?"].map(s => (
                <button key={s} onClick={() => setPergunta(s)} style={{ ...btn(false), fontWeight: 500, fontSize: 11 }}>{s}</button>
              ))}
            </div>
            <button onClick={consultar} disabled={consultando || pergunta.trim().length < 5} style={btn(true)}>
              <Sparkles size={13} /> {consultando ? "Analisando… (pode levar até 1 minuto)" : "Consultar"}
            </button>
            {erro && <div style={{ color: C.red, fontSize: 12.5, marginTop: 10 }}>{erro}</div>}
            {resp && (
              <div style={{ border: `1px solid ${C.bdr}`, borderRadius: 10, padding: 14, marginTop: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Classe c={resp.classificacao} /></div>
                <div style={{ fontSize: 13, marginTop: 8, whiteSpace: "pre-wrap" }}>{resp.justificativa}</div>
                {resp.norma_origem && <div style={{ fontSize: 12.5, marginTop: 8 }}><b>Portaria de origem e regulamentação:</b> {resp.norma_origem}</div>}
                {resp.condicoes.length > 0 && <>{sec("Condições")}<ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5 }}>{resp.condicoes.map((c, i) => <li key={i}>{c}</li>)}</ul></>}
                {resp.falta_confirmar.length > 0 && <>{sec("Falta confirmar")}<ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: C.amber }}>{resp.falta_confirmar.map((c, i) => <li key={i}>{c}</li>)}</ul></>}
                {sec("Base legal")}
                {resp.base_legal.length ? resp.base_legal.map(citacao) : <div style={{ fontSize: 12, color: C.amber }}>Sem fundamentação na base conferida — análise complementar necessária.</div>}
                {sec("Orientação")}
                <div style={{ fontSize: 13, background: C.indigoL, borderRadius: 8, padding: "8px 10px" }}>{resp.orientacao}</div>
                <div style={{ fontSize: 10.5, color: C.sec, marginTop: 8 }}>{resp.aviso}</div>
              </div>
            )}
          </div>
        )}
        {r && <div style={{ fontSize: 10.5, color: C.sec, marginTop: 18 }}>{r.aviso}</div>}
      </div>
    </div>
  );
}

// ─── Link oficial da portaria ─────────────────────────────────────────────────
interface LinkDoc { ano: number | null; link: string; data_publicacao: string | null; orgao?: string | null; titulo?: string }
interface LinksPortaria { cadastrado: LinkDoc[]; dou: LinkDoc[]; busca_dou: string | null; numero_formatado: string | null }

function DocumentoOficial({ numero, exercicio, links }: { numero: string; exercicio: number; links?: LinksPortaria }) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({ ano: "", data: "", link: "" });
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; txt: string } | null>(null);
  if (!links || !links.busca_dou) return null;   // "Sem portaria": não há o que linkar

  const salvar = async (dados: { ano: string; data: string; link: string }) => {
    setSalvando(true); setMsg(null);
    try {
      await apiPost("/api/fns-portarias-ia/documento", {
        numero, exercicio, ano: Number(dados.ano), link: dados.link.trim(),
        data_publicacao: dados.data || null,
      });
      setMsg({ ok: true, txt: "Link oficial registrado no catálogo de portarias." });
      setAberto(false);
      await qc.invalidateQueries({ queryKey: ["fns-portaria-ia", exercicio, numero] });
      await qc.invalidateQueries({ queryKey: ["fns-portarias-ia"] });
    } catch (e: any) {
      setMsg({ ok: false, txt: e?.response?.data?.detail ?? "Não foi possível registrar o link." });
    } finally { setSalvando(false); }
  };
  const usar = (d: LinkDoc) => salvar({ ano: String(d.ano ?? ""), data: (d.data_publicacao ?? "").slice(0, 10), link: d.link });
  const abrir = (href: string, txt: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ color: C.blue, fontWeight: 700, wordBreak: "break-all" }}>{txt} <ExternalLink size={11} style={{ verticalAlign: "-1px" }} /></a>
  );
  const inp: CSSProperties = { padding: "5px 7px", borderRadius: 6, border: `1px solid ${C.bdr}`, fontSize: 12 };
  const cad = links.cadastrado[0];

  return (
    <div style={{ border: `1px solid ${cad ? "#a5d6a7" : C.bdr}`, background: cad ? C.greenL : C.grayL, borderRadius: 10,
      padding: "10px 12px", marginTop: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 12.5, color: C.indigo, textTransform: "uppercase", letterSpacing: 0.4 }}>
        Documento oficial — Portaria nº {links.numero_formatado}
      </div>

      {cad ? (
        <div style={{ fontSize: 12.5, marginTop: 6 }}>
          {abrir(cad.link, cad.link)}
          <div style={{ color: C.green, fontSize: 11.5, marginTop: 2 }}>
            ✓ Cadastrado no catálogo{cad.ano ? ` · ${cad.orgao ?? "GM/MS"} ${cad.ano}` : ""}{cad.data_publicacao ? ` · publicada em ${dataBR(cad.data_publicacao)}` : ""}
          </div>
        </div>
      ) : links.dou.length > 0 ? (
        <div style={{ fontSize: 12.5, marginTop: 6 }}>
          <div style={{ color: C.amber, fontSize: 11.5, marginBottom: 4 }}>
            Encontrada no DOU pela captura diária do ERSUS360. Confira se é a portaria do repasse (o FNS informa só o número, sem o ano).
          </div>
          {links.dou.map(d => (
            <div key={d.link} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: "4px 0", borderTop: `1px dashed ${C.bdr}` }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                {abrir(d.link, d.titulo || d.link)}
                <div style={{ color: C.sec, fontSize: 11 }}>{d.data_publicacao ? `Publicada em ${dataBR(d.data_publicacao)}` : ""}{d.orgao ? ` · ${d.orgao}` : ""}</div>
              </div>
              {d.ano && <button onClick={() => usar(d)} disabled={salvando} style={btn(false)}>Confirmar este link</button>}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: C.sec, marginTop: 6 }}>
          Link ainda não cadastrado. O FNS informa só o número da portaria, sem o ano.
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
        <a href={links.busca_dou} target="_blank" rel="noopener noreferrer" style={{ ...btn(false), textDecoration: "none" }}>
          <ExternalLink size={12} /> Buscar no Diário Oficial da União
        </a>
        {!cad && <button onClick={() => setAberto(!aberto)} style={btn(true)}>Registrar link oficial</button>}
      </div>

      {aberto && !cad && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginTop: 8 }}>
          <label style={{ display: "flex", flexDirection: "column", fontSize: 10, fontWeight: 600, color: C.sec }}>
            Ano da portaria
            <input type="number" min={1990} max={exercicio} value={form.ano} placeholder={String(exercicio)}
              onChange={e => setForm({ ...form, ano: e.target.value })} style={{ ...inp, width: 90 }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: 10, fontWeight: 600, color: C.sec }}>
            Publicação (opcional)
            <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} style={inp} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: 10, fontWeight: 600, color: C.sec, flex: "1 1 260px" }}>
            Link oficial (DOU ou Saúde Legis)
            <input value={form.link} placeholder="https://www.in.gov.br/web/dou/-/portaria-gm/ms-n-…"
              onChange={e => setForm({ ...form, link: e.target.value })} style={inp} />
          </label>
          <button onClick={() => salvar(form)} disabled={salvando || !form.ano || form.link.trim().length < 12} style={btn(true)}>
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      )}
      {msg && <div style={{ fontSize: 12, marginTop: 6, color: msg.ok ? C.green : C.red }}>{msg.txt}</div>}
    </div>
  );
}

// ─── PDF da análise técnica: baixar, imprimir, enviar por e-mail ──────────────
async function obterPdf(numero: string, exercicio: number): Promise<{ blob: Blob; nome: string }> {
  const r = await api.get("/api/fns-portarias-ia/portaria/pdf", {
    params: { numero, exercicio }, responseType: "blob",
  });
  const disp = String(r.headers["content-disposition"] ?? "");
  const nome = /filename="([^"]+)"/.exec(disp)?.[1] ?? `relatorio-tecnico-portaria-${numero}-${exercicio}.pdf`;
  return { blob: new Blob([r.data], { type: "application/pdf" }), nome };
}

function AcoesPdf({ numero, exercicio }: { numero: string; exercicio: number }) {
  const [ocupado, setOcupado] = useState<"baixar" | "imprimir" | "email" | null>(null);
  const [emailAberto, setEmailAberto] = useState(false);
  const [destinos, setDestinos] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; txt: string } | null>(null);

  const baixar = async () => {
    setOcupado("baixar"); setMsg(null);
    try {
      const { blob, nome } = await obterPdf(numero, exercicio);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch { setMsg({ ok: false, txt: "Não foi possível gerar o PDF." }); }
    finally { setOcupado(null); }
  };
  const imprimir = async () => {
    setOcupado("imprimir"); setMsg(null);
    try {
      const { blob } = await obterPdf(numero, exercicio);
      const url = URL.createObjectURL(blob);
      const fr = document.createElement("iframe");
      fr.style.position = "fixed"; fr.style.width = "0"; fr.style.height = "0"; fr.style.border = "0";
      fr.src = url;
      fr.onload = () => { try { fr.contentWindow?.focus(); fr.contentWindow?.print(); } catch { window.open(url, "_blank"); } };
      document.body.appendChild(fr);
      setTimeout(() => { fr.remove(); URL.revokeObjectURL(url); }, 120_000);
    } catch { setMsg({ ok: false, txt: "Não foi possível gerar o PDF." }); }
    finally { setOcupado(null); }
  };
  const enviar = async () => {
    const lista = destinos.split(/[,;\s]+/).map(e => e.trim()).filter(Boolean);
    if (!lista.length) return;
    setOcupado("email"); setMsg(null);
    try {
      await apiPost("/api/fns-portarias-ia/portaria/enviar-email",
        { numero, exercicio, destinatarios: lista, mensagem: mensagem.trim() || null });
      setMsg({ ok: true, txt: `PDF enviado para ${lista.join(", ")}.` });
      setEmailAberto(false); setDestinos(""); setMensagem("");
    } catch (e: any) {
      setMsg({ ok: false, txt: e?.response?.data?.detail ?? "Não foi possível enviar o e-mail." });
    } finally { setOcupado(null); }
  };

  const b: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 7,
    fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${C.indigo}55`, background: C.white, color: C.indigo };
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button onClick={baixar} disabled={!!ocupado} style={b}><Download size={13} /> {ocupado === "baixar" ? "Gerando…" : "Emitir Relatório Técnico da Portaria"}</button>
        <button onClick={imprimir} disabled={!!ocupado} style={b}><Printer size={13} /> {ocupado === "imprimir" ? "Gerando…" : "Imprimir"}</button>
        <button onClick={() => { setEmailAberto(!emailAberto); setMsg(null); }} disabled={!!ocupado}
          style={{ ...b, background: C.indigo, color: C.white, border: "none" }}><Mail size={13} /> Enviar por e-mail</button>
      </div>
      {emailAberto && (
        <div style={{ position: "absolute", top: 36, right: 0, zIndex: 5, width: 340, background: C.white,
          border: `1px solid ${C.bdr}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.15)", padding: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 12.5, color: C.indigo, marginBottom: 6 }}>Enviar PDF por e-mail</div>
          <label style={{ fontSize: 11, color: C.sec, fontWeight: 600 }}>Para (até 5, separados por vírgula)</label>
          <input value={destinos} onChange={e => setDestinos(e.target.value)} placeholder="secretaria@municipio.gov.br"
            style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.bdr}`, fontSize: 12, marginBottom: 6 }} />
          <label style={{ fontSize: 11, color: C.sec, fontWeight: 600 }}>Mensagem (opcional)</label>
          <textarea value={mensagem} onChange={e => setMensagem(e.target.value)} rows={3} maxLength={2000}
            style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.bdr}`, fontSize: 12, fontFamily: "inherit" }} />
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 6 }}>
            <button onClick={() => setEmailAberto(false)} style={b}>Cancelar</button>
            <button onClick={enviar} disabled={ocupado === "email" || !destinos.trim()}
              style={{ ...b, background: C.indigo, color: C.white, border: "none" }}>{ocupado === "email" ? "Enviando…" : "Enviar"}</button>
          </div>
          <div style={{ fontSize: 10.5, color: C.sec, marginTop: 6 }}>O PDF vai anexado. Se o envio não estiver configurado no servidor, baixe o PDF e anexe ao seu e-mail.</div>
          {msg && <div style={{ fontSize: 11.5, color: msg.ok ? C.green : C.red, marginTop: 6 }}>{msg.txt}</div>}
        </div>
      )}
      {msg && !emailAberto && <div style={{ fontSize: 11.5, color: msg.ok ? C.green : C.red, maxWidth: 360, textAlign: "right" }}>{msg.txt}</div>}
    </div>
  );
}

// ─── Normas de origem e regulamentação ────────────────────────────────────────
function NormasOrigem({ r }: { r: AnaliseIA }) {
  const vinc = r.programas_vinculados ?? [];
  const sem = r.programas_sem_norma ?? [];
  if (!vinc.length && !sem.length) return null;
  return (
    <div style={{ border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 12px", marginTop: 10 }}>
      <div style={{ fontWeight: 800, fontSize: 12.5, color: C.indigo, textTransform: "uppercase", letterSpacing: 0.4 }}>
        Normas de origem e regulamentação
      </div>
      <div style={{ fontSize: 11.5, color: C.sec, margin: "2px 0 6px" }}>
        {r.portaria_repasse?.papel ?? "A portaria de repasse autoriza a transferência; as regras de aplicação estão nas normas abaixo."}
      </div>
      {vinc.map(v => (
        <div key={v.chave} style={{ padding: "6px 0", borderTop: `1px dashed ${C.bdr}` }}>
          <div style={{ fontSize: 12.5 }}><b>{v.nome}</b> <span style={{ color: C.sec }}>· {BRL(v.valor)} · {v.qtd} transf.</span></div>
          {v.pendente
            ? <div style={{ fontSize: 12, color: C.red }}>{v.pendente}</div>
            : v.normas.map(n => (
              <div key={n.chave} style={{ display: "flex", gap: 8, fontSize: 12, padding: "2px 0", alignItems: "baseline", flexWrap: "wrap" }}>
                <span style={{ minWidth: 150, color: C.sec, fontSize: 11 }}>{n.papel}</span>
                <span style={{ flex: 1, minWidth: 240 }}>
                  <a href={n.url} target="_blank" rel="noopener noreferrer" style={{ color: C.blue, fontWeight: 700 }}>
                    {n.norma}, {n.dispositivo} <ExternalLink size={10} style={{ verticalAlign: "-1px" }} />
                  </a> — {n.resumo}
                </span>
                <span style={{ fontSize: 10.5, color: n.conferido ? C.green : C.amber, whiteSpace: "nowrap" }}>
                  {n.conferido ? `✓ conferido ${dataBR(n.verificado_em)}` : "não conferido ainda"}
                </span>
              </div>
            ))}
        </div>
      ))}
      {sem.map(s => (
        <div key={s.nome} style={{ fontSize: 12, color: C.red, padding: "4px 0", borderTop: `1px dashed ${C.bdr}` }}>
          <b>Sem norma conferida:</b> {s.nome} — {BRL(s.valor)} ({s.qtd} transf.). Análise pendente.
        </div>
      ))}
    </div>
  );
}
