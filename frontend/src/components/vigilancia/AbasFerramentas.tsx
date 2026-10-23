/** Abas de ferramentas do Painel de Vigilância: Relatórios, Agente IA e Integrações (área técnica). */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Download, RefreshCw, Send } from "lucide-react";
import { api, apiGet, apiPost } from "../../lib/api";
import { COR, FVS_API, dataHora, fmt, useMunicipiosFvs, type EstadoFonte } from "../../lib/vigilanciaFvs";
import { SeloFonteFvs, Secao, SeletorAno, TabelaSimples, Vazio, botaoPri, botaoSec, rotuloStyle, selectStyle } from "./FvsBase";

// ── Relatórios ────────────────────────────────────────────────────────────────

const TIPOS = [
  ["municipal", "Relatório Epidemiológico Municipal"], ["consolidado", "Relatório Consolidado de Vigilância em Saúde"],
  ["agravo", "Relatório por Doença ou Agravo"], ["comparativo", "Relatório Comparativo entre Municípios"],
  ["pqa_vs", "Relatório de Indicadores do PQA-VS"], ["evolucao", "Relatório de Evolução Epidemiológica"],
  ["alertas", "Relatório de Alertas e Tendências"], ["estadual", "Relatório Estadual Consolidado do Amazonas"],
] as const;

export function AbaRelatorios({ mun, agravos }: { mun: string; agravos: string[] }) {
  const { data: m } = useMunicipiosFvs();
  const [tipo, setTipo] = useState<string>("municipal");
  const [formato, setFormato] = useState<"pdf" | "xlsx" | "docx">("pdf");
  const [ano, setAno] = useState(new Date().getFullYear());
  const [agravo, setAgravo] = useState(agravos[0] ?? "");
  const [outros, setOutros] = useState<string[]>([]);
  const [ia, setIa] = useState(false);
  const [erro, setErro] = useState("");
  const gerar = useMutation({
    mutationFn: async () => {
      setErro("");
      const r = await api.post(`${FVS_API}/relatorio`, {
        tipo, formato, ano, agravo: tipo === "agravo" ? agravo : null, incluir_analise_ia: ia,
        municipios: tipo === "comparativo" ? [mun, ...outros] : [mun],
      }, { responseType: "blob", timeout: 300_000 });
      const nome = /filename="([^"]+)"/.exec(r.headers["content-disposition"] ?? "")?.[1] ?? `relatorio.${formato}`;
      const url = URL.createObjectURL(r.data as Blob);
      const a = document.createElement("a");
      a.href = url; a.download = nome; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    },
    onError: async (e: any) => {
      const t = e?.response?.data instanceof Blob ? await e.response.data.text() : "";
      try { setErro(JSON.parse(t).detail); } catch { setErro("Não foi possível gerar o relatório agora."); }
    },
  });
  return (
    <Secao titulo="Gerador de relatórios">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={rotuloStyle}>Tipo
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ ...selectStyle, minWidth: 280 }}>
            {TIPOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select></label>
        <SeletorAno valor={ano} onChange={setAno} desde={2015} />
        {tipo === "agravo" && <label style={rotuloStyle}>Doença/agravo
          <select value={agravo} onChange={e => setAgravo(e.target.value)} style={selectStyle}>
            {agravos.map(a => <option key={a}>{a}</option>)}</select></label>}
        <label style={rotuloStyle}>Formato
          <select value={formato} onChange={e => setFormato(e.target.value as any)} style={selectStyle}>
            <option value="pdf">PDF</option><option value="xlsx">Excel</option><option value="docx">Word</option></select></label>
      </div>
      {tipo === "comparativo" && (
        <label style={rotuloStyle}>Comparar com (até 9, segure Ctrl para escolher vários)
          <select multiple value={outros} onChange={e => setOutros(Array.from(e.target.selectedOptions).map(o => o.value).slice(0, 9))}
            style={{ ...selectStyle, height: 140, maxWidth: 360 }}>
            {(m?.municipios ?? []).filter(x => x.ibge6 !== mun).map(x => <option key={x.ibge6} value={x.ibge6}>{x.nome}</option>)}
          </select></label>
      )}
      <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
        <input type="checkbox" checked={ia} onChange={e => setIa(e.target.checked)} />
        Incluir "Considerações técnicas" escritas pelo Agente IA (seção separada, rotulada como interpretação)
      </label>
      <div><button style={botaoPri} disabled={gerar.isPending} onClick={() => gerar.mutate()}>
        <Download size={14} /> {gerar.isPending ? "Gerando…" : "Gerar e baixar"}</button></div>
      {erro && <Vazio>{erro}</Vazio>}
      <div style={{ fontSize: 12, color: COR.sub }}>Todo relatório traz identificação do município, período, fontes oficiais com a data de
        atualização, resumo, tabelas e as limitações (o que a FVS não publica ou o ERSUS360 não extrai).</div>
    </Secao>
  );
}

// ── Agente IA ─────────────────────────────────────────────────────────────────

const EXEMPLOS = [
  "Qual a situação epidemiológica da dengue no município em 2026?",
  "Quantos casos de malária foram registrados no último período disponível?",
  "Quais municípios apresentam aumento de casos de tuberculose?",
  "Como está a evolução da sífilis congênita no Amazonas?",
  "Compare os indicadores epidemiológicos de Apuí e Maués.",
  "Quais indicadores do PQA-VS estão abaixo da meta?",
  "Quais doenças apresentaram maior crescimento neste município?",
];

interface RespostaIA { resposta: string; fontes: string[]; consultas: { ferramenta: string; erro: boolean }[]; aviso: string; gerado_em: string }

export function AbaAgenteIA({ mun }: { mun: string }) {
  const [pergunta, setPergunta] = useState("");
  const [hist, setHist] = useState<{ p: string; r?: RespostaIA; erro?: string }[]>([]);
  const enviar = useMutation({
    mutationFn: (p: string) => apiPost<RespostaIA>(`${FVS_API}/ia`, { pergunta: p, mun }),
    onMutate: p => { setHist(h => [...h, { p }]); setPergunta(""); },
    onSuccess: r => setHist(h => h.map((x, i) => i === h.length - 1 ? { ...x, r } : x)),
    onError: (e: any) => setHist(h => h.map((x, i) => i === h.length - 1 ? { ...x, erro: e?.response?.data?.detail ?? "A IA não respondeu." } : x)),
  });
  return (
    <Secao titulo={<span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Bot size={17} /> Agente IA — Vigilância em Saúde</span>}>
      <div style={{ fontSize: 12, color: COR.sub }}>Responde só com os dados oficiais integrados da FVS-RCP/AM. Cada resposta separa
        "Dados oficiais" de "Análise da IA" e lista as fontes consultadas. Se o dado não existe, ele diz.</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {EXEMPLOS.map(e => <button key={e} style={{ ...botaoSec, fontWeight: 500 }} onClick={() => setPergunta(e)}>{e}</button>)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {hist.map((h, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ alignSelf: "flex-end", background: COR.primariaClara, borderRadius: 10, padding: "8px 11px", fontSize: 13, maxWidth: "85%" }}>{h.p}</div>
            {!h.r && !h.erro && <Vazio>Consultando os dados integrados…</Vazio>}
            {h.erro && <Vazio>{h.erro}</Vazio>}
            {h.r && (
              <div style={{ background: "#fff", border: `1px solid ${COR.borda}`, borderRadius: 10, padding: 12 }}>
                <Markdown texto={h.r.resposta} />
                <div style={{ fontSize: 11, color: COR.sub, marginTop: 8, borderTop: `1px solid ${COR.borda}`, paddingTop: 6 }}>
                  <b>Fontes:</b> {h.r.fontes.join(" · ") || "nenhuma consulta de dados"} — {h.r.consultas.length} consulta(s) · {h.r.aviso}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={e => { e.preventDefault(); if (pergunta.trim().length >= 3) enviar.mutate(pergunta.trim()); }}
        style={{ display: "flex", gap: 8 }}>
        <input value={pergunta} onChange={e => setPergunta(e.target.value)} maxLength={1500} placeholder="Pergunte sobre a vigilância em saúde do Amazonas…"
          style={{ ...selectStyle, flex: 1 }} aria-label="Pergunta para o Agente IA" />
        <button type="submit" style={botaoPri} disabled={enviar.isPending}><Send size={14} /> Enviar</button>
      </form>
    </Secao>
  );
}

/** Markdown mínimo (títulos, listas, negrito, tabelas) sem HTML injetado. */
function Markdown({ texto }: { texto: string }) {
  const blocos: JSX.Element[] = [];
  const linhas = texto.split("\n");
  const inline = (s: string) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : p);
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    if (l.startsWith("|") && linhas[i + 1]?.match(/^\|[\s:-]+\|/)) {
      const cab = l.split("|").slice(1, -1).map(c => c.trim());
      const corpo: string[][] = [];
      i += 2;
      while (i < linhas.length && linhas[i].startsWith("|")) { corpo.push(linhas[i].split("|").slice(1, -1).map(c => c.trim())); i++; }
      i--;
      blocos.push(<TabelaSimples key={i} colunas={cab} linhas={corpo.map(r => r.map(c => inline(c)))} alinhar={cab.map(() => "left")} />);
    } else if (/^#{1,3} /.test(l)) {
      blocos.push(<div key={i} style={{ fontWeight: 800, fontSize: l.startsWith("## ") ? 14 : 13, marginTop: 8, color: COR.texto }}>{l.replace(/^#+ /, "")}</div>);
    } else if (/^\s*[-*] /.test(l)) {
      blocos.push(<div key={i} style={{ fontSize: 13, paddingLeft: 14, textIndent: -10 }}>• {inline(l.replace(/^\s*[-*] /, ""))}</div>);
    } else if (l.trim()) {
      blocos.push(<p key={i} style={{ fontSize: 13, margin: "4px 0", lineHeight: 1.5 }}>{inline(l)}</p>);
    }
  }
  return <div>{blocos}</div>;
}

// ── Integrações (área técnica) ────────────────────────────────────────────────

interface Integracoes {
  fontes: (EstadoFonte & { titulo: string; periodicidade: string; endereco: string; metadados: string; metodo: string;
    municipios: string; subabas: string[]; indicadores: string[] })[];
  paineis_sem_extracao: { titulo: string; integracao: string; plataforma: string; nota?: string }[];
  historico: { id: number; fonte: string; origem: string; usuario: string | null; iniciado_em: string; concluido_em: string | null;
    situacao: string; registros: number | null; novos: number | null; alterados: number | null; removidos: number | null;
    validacao: Record<string, any> | null; erro: string | null }[];
  pode_sincronizar: boolean;
}

export function AbaIntegracoes() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["fvs-integracoes"], queryFn: () => apiGet<Integracoes>(`${FVS_API}/integracoes`), refetchInterval: 20_000 });
  const sinc = useMutation({
    mutationFn: (corpo: { fonte?: string; forcar?: boolean }) => apiPost(`${FVS_API}/sincronizar`, corpo),
    onSuccess: () => setTimeout(() => qc.invalidateQueries({ queryKey: ["fvs-integracoes"] }), 1500),
  });
  const d = q.data;
  if (!d) return <Vazio>{q.isError ? "Não foi possível carregar a situação das integrações." : "Carregando…"}</Vazio>;
  return <>
    <Secao titulo="Fontes com extração automática" direita={d.pode_sincronizar &&
      <button style={botaoPri} onClick={() => sinc.mutate({})} disabled={sinc.isPending}><RefreshCw size={14} /> Atualizar todas</button>}>
      {sinc.isSuccess && <Vazio>Atualização iniciada em segundo plano — o histórico abaixo mostra o resultado (a malária leva alguns minutos).</Vazio>}
      <div style={{ display: "grid", gap: 10 }}>
        {d.fontes.map(f => (
          <div key={f.fonte} style={{ background: "#fff", border: `1px solid ${COR.borda}`, borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <b style={{ fontSize: 14, color: COR.texto }}>{f.titulo}</b>
              {d.pode_sincronizar && <div style={{ display: "flex", gap: 6 }}>
                <button style={botaoSec} onClick={() => sinc.mutate({ fonte: f.fonte })}><RefreshCw size={13} /> Atualizar</button>
                <button style={botaoSec} title="Reprocessa mesmo sem nova publicação da FVS" onClick={() => sinc.mutate({ fonte: f.fonte, forcar: true })}>Reprocessar</button>
              </div>}
            </div>
            <SeloFonteFvs estado={f} />
            <div style={{ fontSize: 12, color: COR.sub }}>
              <div><b>Endereço:</b> <a href={f.metadados} target="_blank" rel="noreferrer">{f.endereco}</a></div>
              <div><b>Método:</b> {f.metodo}</div>
              <div><b>Abrangência:</b> {f.municipios} · <b>Frequência:</b> {f.periodicidade} · <b>Registros agregados:</b> {fmt(f.registros)}</div>
              <div><b>Indicadores:</b> {f.indicadores.slice(0, 12).map(i => i.replace("casos:", "")).join(", ")}{f.indicadores.length > 12 ? ` e mais ${f.indicadores.length - 12}` : ""}</div>
            </div>
          </div>
        ))}
      </div>
    </Secao>
    <Secao titulo="Painéis sem extração (só visualização oficial)">
      <TabelaSimples colunas={["Painel", "Plataforma", "Motivo"]} alinhar={["left", "left", "left"]}
        linhas={d.paineis_sem_extracao.map(p => [p.titulo, p.plataforma === "powerbi" ? "Power BI" : "Tableau Public",
          p.integracao === "bloqueado_lgpd" ? "Pasta pública contém dado pessoal identificado — não baixada (LGPD)"
            : p.nota ?? (p.plataforma === "powerbi" ? "Power BI 'Publicar na Web' não oferece exportação de dados" : "Só visualização")])} />
    </Secao>
    <Secao titulo="Histórico de execuções">
      <TabelaSimples colunas={["Início", "Fonte", "Origem", "Situação", "Registros", "Novos", "Alterados", "Removidos", "Validação / erro"]}
        alinhar={["left", "left", "left", "left", "right", "right", "right", "right", "left"]}
        linhas={d.historico.map(h => [dataHora(h.iniciado_em), h.fonte, h.origem + (h.usuario ? ` (${h.usuario})` : ""), h.situacao,
          fmt(h.registros), fmt(h.novos), fmt(h.alterados), fmt(h.removidos),
          h.erro ?? (h.validacao ? `dup. ${h.validacao.chaves_duplicadas ?? 0} · conflitos ${h.validacao.chaves_conflitantes_descartadas ?? 0} · sem dado: ${(h.validacao.municipios_sem_dado ?? []).length} mun.` : "—")])} />
    </Secao>
  </>;
}
