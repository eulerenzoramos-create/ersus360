// InvestSUS — aba "Monitoramento de Execução" (Monitoramento de Emendas do InvestSUS)
// Dados oficiais: lidos pelo navegador do usuário logado no InvestSUS (gov.br) e gravados no
// ERSUS360 (/api/investsus/monitoramento/sincronizar). A equipe pode preparar o preenchimento
// aqui (mesmas regras do formulário oficial) e marcar quando lançou no InvestSUS.
// O ERSUS360 não grava nada no InvestSUS.
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import {
  AlertTriangle, CheckCircle2, Clock, ExternalLink, Eye, History, Info, LayoutDashboard, ListChecks,
  Pencil, RefreshCw, Search, X,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Status = "atualizada" | "desatualizada" | "finalizada";
type Registro = {
  id: number; monitoramento_id: number; origem: "investsus" | "ersus";
  execucao_iniciada: string | null; status_execucao: string | null; percentual_execucao: number | null;
  data_provavel_finalizacao: string | null; descricao: string; observacao: string | null; usuario: string | null;
  criado_em: string | null; lancado_no_investsus: boolean; lancado_em: string | null; lancado_por: string | null;
  numero_proposta?: string; exercicio?: number; tipo_proposta?: string;
};
type Item = {
  id: number; numero_proposta: string; exercicio: number | null; tipo_recurso: string | null;
  tipo_proposta: string | null; situacao: string | null; instrumento: string | null; valor: number;
  status: Status; status_rotulo: string; dt_operacao: string | null;
  dias_desde_atualizacao: number | null; vence_em_dias: number | null; data_limite_atualizacao: string | null;
  a_vencer: boolean; data_provavel_vencida: boolean;
  execucao_iniciada: string | null; status_execucao: string | null; percentual_execucao: number | null;
  data_provavel_finalizacao: string | null; descricao: string; link_investsus: string;
  proposta: { id: number; modalidade: string; objeto: string | null; valor_pago: number } | null;
  preenchimento_ersus_pendente: Registro | null;
};
type Resposta = {
  url_tela: string; regras: { dias_validade: number; dias_aviso: number; ano_inicial: number };
  resumo: {
    total: number; valor_total: number; por_status: Record<Status, { quantidade: number; valor: number }>;
    a_vencer: number; data_provavel_vencida: number; nao_iniciadas: number; sem_formulario: number;
    preenchimentos_nao_lancados: number; pagas_sem_monitoramento: number; percentual_medio: number | null;
  };
  itens: Item[];
  pagas_sem_monitoramento: { id: number; numero_proposta: string; exercicio: number; modalidade: string; valor_pago: number; situacao_original: string | null }[];
  ultima_coleta: { coletado_em: string; usuario: string | null; anos: number[]; resumo: any; resumo_oficial: any } | null;
};

// ── Formatação ────────────────────────────────────────────────────────────────
const fmt = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtData = (d?: string | null) => (d ? d.slice(0, 10).split("-").reverse().join("/") : "—");
const fmtDataHora = (d?: string | null) => (d ? new Date(d.endsWith("Z") || d.includes("+") ? d : d + "Z").toLocaleString("pt-BR") : "—");
const erroMsg = (e: any) => e?.response?.data?.detail ?? e?.message ?? "Erro inesperado";

const AZUL = "#1e3a5f";
// Mesmas cores da tela do InvestSUS (pendente vermelho, atualizada verde, finalizada azul)
const COR_STATUS: Record<Status, string> = { desatualizada: "#d32f2f", atualizada: "#2e7d32", finalizada: "#1aa7e9" };
const S = {
  card: { background: "#fff", color: "#111827", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16, marginBottom: 14 } as React.CSSProperties,
  title: { fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#111827" } as React.CSSProperties,
  btn: (cor?: string) => ({ padding: "7px 12px", borderRadius: 6, border: cor ? "none" : "1px solid #d1d5db", cursor: "pointer", fontSize: 12, fontWeight: 600, background: cor ?? "#fff", color: cor ? "#fff" : "#374151", display: "inline-flex", alignItems: "center", gap: 5 }) as React.CSSProperties,
  input: { border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 9px", fontSize: 12, boxSizing: "border-box" as const, outline: "none", background: "#fff", color: "#111827" },
  label: { fontSize: 11, color: "#6b7280", display: "block", marginBottom: 3, fontWeight: 500 } as React.CSSProperties,
  th: { background: "#1565c0", color: "#fff", padding: "9px 8px", fontSize: 11, fontWeight: 700, textAlign: "center" as const, whiteSpace: "nowrap" as const },
  td: { borderBottom: "1px solid #e5e7eb", padding: "8px", fontSize: 12, textAlign: "center" as const, color: "#1f2937" },
  sub: (ativo: boolean) => ({ padding: "7px 14px", borderRadius: 999, border: ativo ? "none" : "1px solid #cbd5e1", background: ativo ? AZUL : "#fff", color: ativo ? "#fff" : "#334155", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }) as React.CSSProperties,
};

function Selo({ status }: { status: Status }) {
  const rot = { desatualizada: "Desatualizada", atualizada: "Atualizada", finalizada: "Finalizada" }[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: COR_STATUS[status] + "1a", color: COR_STATUS[status], border: `1px solid ${COR_STATUS[status]}55`, borderRadius: 999, padding: "2px 9px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: 7, background: COR_STATUS[status] }} /> {rot}
    </span>
  );
}

// ── Leitura do InvestSUS pelo navegador (mesma técnica do "Atualizar do InvestSUS") ──
const _API = "https://investsus-backend-prd.saude.gov.br/api";
const _cab = (contexto: string): Record<string, string> => ({
  "content-type": "application/json", "accept": "application/json, text/plain, */*",
  "cz-aphrodite-de-peixes": "DIREME", "cz-milo-de-escopiao": "ENTPUBLICAFNS", "cz-mu-de-aries": contexto,
});
const SITUACAO_PAGA = 67;
const anosMonitorados = () => { const a = new Date().getFullYear(); return a - 1 >= 2025 ? [a - 1, a] : [a]; };

export async function capturarMonitoramento(cnpj: string, contexto: string, onProg: (m: string) => void) {
  const headers = _cab(contexto);
  const itens: any[] = [];
  const resumos: Record<string, any> = {};
  for (const ano of anosMonitorados()) {
    onProg(`Lendo o Monitoramento de ${ano} no InvestSUS…`);
    for (let pagina = 1; pagina <= 20; pagina++) {
      let r: Response;
      try {
        r = await fetch(`${_API}/monitoramento/paginado`, {
          method: "POST", credentials: "include", headers,
          body: JSON.stringify({ filter: { idSituacaoProposta: SITUACAO_PAGA, ano, cnpj }, pageNumber: pagina, pageSize: 100 }),
        });
      } catch { throw new Error("SEM_SESSAO"); }
      if (r.status === 401 || r.status === 403) throw new Error("SEM_SESSAO");
      if (!r.ok) throw new Error(`O InvestSUS respondeu com erro ${r.status}. Tente de novo em alguns minutos.`);
      let d: any;
      try { d = await r.json(); } catch { throw new Error("SEM_SESSAO"); }
      const lote: any[] = Array.isArray(d) ? d : (d?.items ?? []);
      itens.push(...lote);
      const total = Array.isArray(d) ? lote.length : Number(d?.total ?? lote.length);
      if (!lote.length || lote.length < 100 || itens.length >= total) break;
    }
    try {
      const q = new URLSearchParams({ idSituacaoProposta: String(SITUACAO_PAGA), ano: String(ano), cnpj });
      const r = await fetch(`${_API}/geral/monitoramento/tipos-monitoramento/valores?${q}`, { credentials: "include", headers });
      if (r.ok) resumos[String(ano)] = await r.json();
    } catch { /* o resumo do gráfico é opcional */ }
  }
  // Formulário de cada proposta (botão lápis do InvestSUS)
  const fila = itens.filter(i => i?.coProposta);
  const porCo: Record<string, any> = {};
  let feitos = 0;
  const trabalhar = async () => {
    while (fila.length) {
      const it = fila.shift();
      try {
        const r = await fetch(`${_API}/monitoramento/projeto/${it.coProposta}`, { credentials: "include", headers });
        if (r.ok) { const t = await r.text(); porCo[String(it.coProposta)] = t ? JSON.parse(t) : {}; }
      } catch { /* sem formulário: fica o que já havia */ }
      feitos++;
      onProg(`Lendo o monitoramento de cada proposta… ${feitos}/${itens.length}`);
    }
  };
  await Promise.all([trabalhar(), trabalhar(), trabalhar(), trabalhar()]);
  return {
    anos: anosMonitorados(), resumos,
    itens: itens.map(it => ({ item: it, monitoramento: it?.coProposta != null && String(it.coProposta) in porCo ? porCo[String(it.coProposta)] : null })),
  };
}

function SincronizarMonitoramento({ ultima }: { ultima: Resposta["ultima_coleta"] }) {
  const qc = useQueryClient();
  const { data: escopo } = useQuery({ queryKey: ["investsus-escopo-monit"], queryFn: () => api.get("/api/investsus/escopo").then(r => r.data) });
  const [estado, setEstado] = useState<"" | "rodando" | "sem_sessao">("");
  const [prog, setProg] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const fundo = escopo?.fundo;
  const pronto = !!(fundo?.cnpj && fundo?.contexto_investsus);

  const rodar = async () => {
    setEstado("rodando"); setErro(null); setMsg(null);
    try {
      const payload = await capturarMonitoramento(fundo.cnpj, fundo.contexto_investsus, setProg);
      setProg("Gravando no ERSUS360…");
      const r = (await api.post("/api/investsus/monitoramento/sincronizar", payload)).data;
      setMsg(`✓ ${r.lidas} propostas lidas · ${r.alteradas} com monitoramento alterado · ${r.alertas} alerta(s) novo(s) · ${r.alertas_encerrados} encerrado(s)`);
      qc.invalidateQueries({ queryKey: ["investsus-monitoramento"] });
      qc.invalidateQueries({ queryKey: ["investsus-monitoramento-hist"] });
      setEstado("");
    } catch (e: any) {
      if (e?.message === "SEM_SESSAO") { setEstado("sem_sessao"); return; }
      setErro(erroMsg(e)); setEstado("");
    } finally { setProg(""); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <a href="https://investsus.saude.gov.br/monitoramento" target="_blank" rel="noreferrer" style={{ ...S.btn(), textDecoration: "none" }}>
          <ExternalLink size={13} /> Abrir no InvestSUS
        </a>
        <button style={S.btn(pronto && estado !== "rodando" ? "#047857" : "#9ca3af")} disabled={!pronto || estado === "rodando"} onClick={rodar}>
          <RefreshCw size={13} style={{ animation: estado === "rodando" ? "spin 1s linear infinite" : "none" }} />
          {estado === "rodando" ? (prog || "Atualizando…") : "Atualizar do InvestSUS"}
        </button>
      </div>
      <div style={{ fontSize: 11, color: "#64748b" }}>
        {ultima ? <>Última leitura: {fmtDataHora(ultima.coletado_em)}{ultima.usuario ? ` · ${ultima.usuario}` : ""}</> : "Ainda não lido do InvestSUS"}
      </div>
      {!pronto && escopo && <div style={{ fontSize: 12, color: "#92400e" }}>CNPJ do Fundo não cadastrado (Municípios → Dados / CNPJ).</div>}
      {estado === "sem_sessao" && (
        <div role="alert" style={{ background: "#fffbeb", color: "#78350f", border: "1px solid #fde68a", borderRadius: 8, padding: 10, fontSize: 12, maxWidth: 460 }}>
          <strong>Você não está logado no InvestSUS neste navegador.</strong> Abra o InvestSUS, entre com o gov.br, volte e clique de novo.
        </div>
      )}
      {erro && <div role="alert" style={{ color: "#991b1b", fontSize: 12 }}>Erro: {erro}</div>}
      {msg && <div role="status" style={{ color: "#166534", fontSize: 12, fontWeight: 600 }}>{msg}</div>}
    </div>
  );
}

// ── Formulário (mesmas regras do "Cadastrar Monitoramento" do InvestSUS) ──────
function FormularioMonitoramento({ item, onFechar }: { item: Item; onFechar: () => void }) {
  const qc = useQueryClient();
  const base = item.preenchimento_ersus_pendente ?? item;
  const [ini, setIni] = useState<string>(base.execucao_iniciada ?? "");
  const [st, setSt] = useState<string>(base.status_execucao ?? "");
  const [pct, setPct] = useState<string>(base.percentual_execucao != null && base.status_execucao === "PARCIAL" ? String(base.percentual_execucao) : "");
  const [dataProv, setDataProv] = useState<string>(base.status_execucao !== "TOTAL" ? (base.data_provavel_finalizacao ?? "") : "");
  const [dataFim, setDataFim] = useState<string>(base.status_execucao === "TOTAL" ? (base.data_provavel_finalizacao ?? "") : "");
  const [obs, setObs] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const hoje = new Date().toISOString().slice(0, 10);

  const salvar = useMutation({
    mutationFn: () => api.post(`/api/investsus/monitoramento/${item.id}/registros`, {
      execucao_iniciada: ini, status_execucao: ini === "S" ? st : null,
      percentual_execucao: ini === "S" && st === "PARCIAL" ? pct : null,
      data_provavel_finalizacao: ini === "N" || st === "PARCIAL" ? dataProv : null,
      data_finalizacao: ini === "S" && st === "TOTAL" ? dataFim : null, observacao: obs,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["investsus-monitoramento"] }); qc.invalidateQueries({ queryKey: ["investsus-monitoramento-hist"] }); onFechar(); },
    onError: (e) => setErro(erroMsg(e)),
  });

  const radio = (nome: string, valor: string, atual: string, set: (v: string) => void, rotulo: string) => (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, marginRight: 16, fontSize: 13, cursor: "pointer" }}>
      <input type="radio" name={nome} checked={atual === valor} onChange={() => set(valor)} /> {rotulo}
    </label>
  );

  return (
    <div role="dialog" aria-modal="true" onClick={onFechar} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", color: "#111827", borderRadius: 12, width: "100%", maxWidth: 560, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: AZUL }}>Monitoramento de Execução</div>
          <button onClick={onFechar} aria-label="Fechar" style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><X size={18} /></button>
        </div>
        <div style={{ fontSize: 12, color: "#475569", marginBottom: 14 }}>
          Proposta <strong>{item.numero_proposta}</strong> · {item.tipo_proposta ?? "—"} · {fmt(item.valor)}
          <div style={{ marginTop: 4 }}>No InvestSUS hoje: {item.descricao}</div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <span style={S.label}>A execução foi iniciada?</span>
          {radio("ini", "S", ini, v => { setIni(v); setSt(""); setPct(""); setDataProv(""); setDataFim(""); }, "Sim")}
          {radio("ini", "N", ini, v => { setIni(v); setSt(""); setPct(""); setDataProv(""); setDataFim(""); }, "Não")}
        </div>
        {ini === "S" && (
          <div style={{ marginBottom: 12 }}>
            <span style={S.label}>Status da execução</span>
            {radio("st", "TOTAL", st, v => { setSt(v); setPct("100"); setDataProv(""); }, "Total")}
            {radio("st", "PARCIAL", st, v => { setSt(v); setPct(""); setDataFim(""); }, "Parcial")}
          </div>
        )}
        {ini === "S" && st === "PARCIAL" && (
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Percentual de execução (1 a 100)</label>
            <input type="number" min={1} max={100} value={pct} onChange={e => setPct(e.target.value)} style={{ ...S.input, width: 120 }} />
          </div>
        )}
        {ini === "S" && st === "TOTAL" && (
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Data de finalização (não pode ser futura) · percentual 100%</label>
            <input type="date" max={hoje} value={dataFim} onChange={e => setDataFim(e.target.value)} style={S.input} />
          </div>
        )}
        {(ini === "N" || (ini === "S" && st === "PARCIAL")) && (
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Data provável de finalização (hoje ou futura)</label>
            <input type="date" min={hoje} value={dataProv} onChange={e => setDataProv(e.target.value)} style={S.input} />
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Observação interna (não vai para o InvestSUS)</label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} style={{ ...S.input, width: "100%", resize: "vertical" }}
            placeholder="Ex.: licitação concluída, aguardando entrega do fornecedor" />
        </div>

        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: 10, fontSize: 12, color: "#1e3a8a", marginBottom: 12, display: "flex", gap: 8 }}>
          <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>O ERSUS360 guarda este preenchimento como <strong>“a lançar no InvestSUS”</strong>. Lance os mesmos valores no InvestSUS
            (lápis da proposta) — a próxima atualização confere e marca como lançado.</div>
        </div>
        {erro && <div role="alert" style={{ color: "#b91c1c", fontSize: 12, marginBottom: 10 }}>{erro}</div>}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <a href={item.link_investsus} target="_blank" rel="noreferrer" style={{ ...S.btn(), textDecoration: "none" }}><ExternalLink size={13} /> Abrir esta proposta no InvestSUS</a>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btn()} onClick={onFechar}>Cancelar</button>
            <button style={S.btn(AZUL)} disabled={salvar.isPending} onClick={() => { setErro(null); salvar.mutate(); }}>
              {salvar.isPending ? "Salvando…" : "Salvar no ERSUS360"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-aba: Painel ───────────────────────────────────────────────────────────
function Painel({ d, onFiltrarStatus }: { d: Resposta; onFiltrarStatus: (s: Status) => void }) {
  const r = d.resumo;
  const fatias = (["atualizada", "desatualizada", "finalizada"] as Status[])
    .map(s => ({ s, nome: { atualizada: "Atualizada", desatualizada: "Desatualizada", finalizada: "Finalizada" }[s], valor: r.por_status[s].quantidade }))
    .filter(x => x.valor > 0);
  const card = (titulo: string, valor: string | number, cor: string, sub?: string, onClick?: () => void) => (
    <button onClick={onClick} disabled={!onClick} style={{ textAlign: "left", background: "#fff", border: `1px solid ${cor}55`, borderTop: `3px solid ${cor}`, borderRadius: 10, padding: "12px 14px", cursor: onClick ? "pointer" : "default", minWidth: 0 }}>
      <div style={{ fontSize: 11, color: cor, fontWeight: 700, textTransform: "uppercase", letterSpacing: .4 }}>{titulo}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginTop: 2 }}>{valor}</div>
      {sub && <div style={{ fontSize: 11, color: "#64748b" }}>{sub}</div>}
    </button>
  );
  return (
    <div>
      <div style={{ ...S.card, display: "grid", gridTemplateColumns: "minmax(220px, 300px) 1fr", gap: 20, alignItems: "center" }} className="monit-painel">
        <div style={{ height: 240, position: "relative" }}>
          {r.total === 0 ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12, textAlign: "center" }}>
              Sem propostas pagas lidas.<br />Clique em “Atualizar do InvestSUS”.
            </div>
          ) : (
            <>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={fatias} dataKey="valor" nameKey="nome" innerRadius={72} outerRadius={100} stroke="#fff" strokeWidth={2}
                    onClick={(x: any) => onFiltrarStatus(x.s)} cursor="pointer">
                    {fatias.map(f => <Cell key={f.s} fill={COR_STATUS[f.s]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any) => [`${v} proposta(s)`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: AZUL }}>{r.total}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Total de Propostas</div>
              </div>
            </>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          {card("Atualizadas", r.por_status.atualizada.quantidade, COR_STATUS.atualizada, fmt(r.por_status.atualizada.valor), () => onFiltrarStatus("atualizada"))}
          {card("Desatualizadas", r.por_status.desatualizada.quantidade, COR_STATUS.desatualizada, "> 30 dias ou sem data", () => onFiltrarStatus("desatualizada"))}
          {card("Finalizadas", r.por_status.finalizada.quantidade, COR_STATUS.finalizada, "execução total")}
          {card("Vencem em 7 dias", r.a_vencer, "#d97706", "atualizar antes dos 30 dias")}
          {card("Total pago monitorado", fmt(r.valor_total), AZUL, `${r.total} proposta(s) paga(s)`)}
          {card("Execução média", r.percentual_medio != null ? `${r.percentual_medio.toFixed(0)}%` : "—", "#7c3aed", "propostas iniciadas")}
        </div>
      </div>

      <div style={{ ...S.card, display: "flex", gap: 10, alignItems: "flex-start", background: "#f8fafc" }}>
        <Info size={16} color={AZUL} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.7 }}>
          <strong>Regra do InvestSUS:</strong> entram as propostas na situação <em>Proposta Paga</em> desde {d.regras.ano_inicial}.
          A proposta fica <span style={{ color: COR_STATUS.atualizada, fontWeight: 700 }}>atualizada</span> por {d.regras.dias_validade} dias após
          o último preenchimento; depois passa a <span style={{ color: COR_STATUS.desatualizada, fontWeight: 700 }}>desatualizada</span>.
          Execução total marca como <span style={{ color: COR_STATUS.finalizada, fontWeight: 700 }}>finalizada</span>.
          O preenchimento é feito no InvestSUS (Início → Monitoramento de Execução → lápis); aqui você acompanha,
          prepara os valores e recebe os avisos.
          {d.ultima_coleta?.resumo_oficial && Object.keys(d.ultima_coleta.resumo_oficial).length > 0 && (
            <div style={{ marginTop: 4, color: "#64748b" }}>
              Gráfico oficial na última leitura: {Object.entries(d.ultima_coleta.resumo_oficial).map(([ano, v]: any) =>
                `${ano}: ${v?.quantidade ?? "—"} proposta(s)${Array.isArray(v?.itens) ? " (" + v.itens.map((i: any) => `${i.descricaoAgrupadorTipoProposta ?? "?"} ${i.quantidade ?? ""}`.trim()).join(", ") + ")" : ""}`).join(" · ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-aba: Propostas ────────────────────────────────────────────────────────
function Propostas({ itens, filtroStatus, setFiltroStatus, onEditar, onAbrirProposta }: {
  itens: Item[]; filtroStatus: Status | ""; setFiltroStatus: (s: Status | "") => void;
  onEditar: (i: Item) => void; onAbrirProposta?: (p: any) => void;
}) {
  const lista = filtroStatus ? itens.filter(i => i.status === filtroStatus) : itens;
  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div style={S.title}>Propostas pagas em monitoramento ({lista.length})</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["", "desatualizada", "atualizada", "finalizada"] as const).map(s => (
            <button key={s || "todas"} style={S.sub(filtroStatus === s)} onClick={() => setFiltroStatus(s)}>
              {s === "" ? "Todas" : s[0].toUpperCase() + s.slice(1) + "s"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
          <thead>
            <tr>
              {["", "N. Proposta", "Tipo de Recurso", "Tipo", "Situação", "Instrumento", "Valor", "Monitoramento", "Última atualização", "Prazo", ""].map((h, i) => (
                <th key={i} style={{ ...S.th, borderTopLeftRadius: i === 0 ? 8 : 0, borderTopRightRadius: i === 10 ? 8 : 0 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.map(i => (
              <tr key={i.id} style={{ background: i.status === "desatualizada" ? "#fef2f2" : undefined }}
                title={i.status === "desatualizada" ? "Proposta sem atualização há mais de 30 dias ou sem data." : i.status === "atualizada" ? "Proposta atualizada nos últimos 30 dias." : "Proposta finalizada."}>
                <td style={S.td}><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 10, background: COR_STATUS[i.status] }} /></td>
                <td style={{ ...S.td, fontVariantNumeric: "tabular-nums" }}>{i.numero_proposta}</td>
                <td style={S.td}>{i.tipo_recurso ?? "—"}</td>
                <td style={S.td}>{i.tipo_proposta ?? "—"}</td>
                <td style={S.td}>{i.situacao ?? "—"}</td>
                <td style={S.td}>{i.instrumento ?? "—"}</td>
                <td style={{ ...S.td, textAlign: "right", whiteSpace: "nowrap" }}>{fmt(i.valor)}</td>
                <td style={{ ...S.td, textAlign: "left" }}>
                  <Selo status={i.status} />
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{i.descricao}</div>
                  {i.execucao_iniciada === "S" && i.percentual_execucao != null && (
                    <div style={{ background: "#e5e7eb", borderRadius: 3, height: 5, marginTop: 4, width: 140 }}>
                      <div style={{ background: COR_STATUS[i.status], height: 5, borderRadius: 3, width: `${Math.min(100, i.percentual_execucao)}%` }} />
                    </div>
                  )}
                  {i.preenchimento_ersus_pendente && (
                    <div style={{ fontSize: 11, color: "#b45309", marginTop: 3, fontWeight: 600 }}>⚑ Preparado no ERSUS360, falta lançar</div>
                  )}
                </td>
                <td style={S.td}>{fmtData(i.dt_operacao)}{i.dias_desde_atualizacao != null && <div style={{ fontSize: 11, color: "#64748b" }}>há {i.dias_desde_atualizacao} dia(s)</div>}</td>
                <td style={S.td}>
                  {i.status === "atualizada" && i.vence_em_dias != null ? (
                    <span style={{ color: i.a_vencer ? "#d97706" : "#334155", fontWeight: i.a_vencer ? 700 : 400 }}>
                      vence em {i.vence_em_dias} dia(s)<div style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>{fmtData(i.data_limite_atualizacao)}</div>
                    </span>
                  ) : i.status === "desatualizada" ? <span style={{ color: COR_STATUS.desatualizada, fontWeight: 700 }}>atualizar já</span> : "—"}
                  {i.data_provavel_vencida && <div style={{ fontSize: 11, color: "#b91c1c" }}>previsão vencida ({fmtData(i.data_provavel_finalizacao)})</div>}
                </td>
                <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                  {i.proposta && onAbrirProposta && (
                    <button title="Detalhar Proposta" aria-label="Detalhar Proposta" style={{ background: "none", border: "none", cursor: "pointer", color: "#1565c0", padding: 4 }}
                      onClick={() => onAbrirProposta({ id: i.proposta!.id })}><Eye size={17} /></button>
                  )}
                  <button title="Cadastrar Monitoramento" aria-label="Cadastrar Monitoramento" style={{ background: "none", border: "none", cursor: "pointer", color: "#1565c0", padding: 4 }}
                    onClick={() => onEditar(i)}><Pencil size={16} /></button>
                  <a title="Abrir no InvestSUS" aria-label="Abrir no InvestSUS" href={i.link_investsus} target="_blank" rel="noreferrer" style={{ color: "#1565c0", padding: 4, display: "inline-flex" }}><ExternalLink size={15} /></a>
                </td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={11} style={{ ...S.td, color: "#94a3b8", padding: 24 }}>Nenhuma proposta neste filtro.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Sub-aba: Pendências ───────────────────────────────────────────────────────
function Pendencias({ d, onEditar, onAbrirProposta }: { d: Resposta; onEditar: (i: Item) => void; onAbrirProposta?: (p: any) => void }) {
  const qc = useQueryClient();
  const lancar = useMutation({
    mutationFn: (rid: number) => api.post(`/api/investsus/monitoramento/registros/${rid}/lancado`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["investsus-monitoramento"] }); qc.invalidateQueries({ queryKey: ["investsus-monitoramento-hist"] }); },
  });
  const grupos: { titulo: string; cor: string; desc: string; itens: Item[]; icone: JSX.Element }[] = [
    { titulo: "Desatualizadas", cor: COR_STATUS.desatualizada, icone: <AlertTriangle size={15} />, desc: "Sem preenchimento há mais de 30 dias (ou nunca). Preencher no InvestSUS.", itens: d.itens.filter(i => i.status === "desatualizada") },
    { titulo: `Vencem em até ${d.regras.dias_aviso} dias`, cor: "#d97706", icone: <Clock size={15} />, desc: "Ainda atualizadas, mas passam a desatualizadas em breve.", itens: d.itens.filter(i => i.a_vencer) },
    { titulo: "Previsão de finalização vencida", cor: "#b91c1c", icone: <AlertTriangle size={15} />, desc: "A data provável informada já passou: rever a data ou o status.", itens: d.itens.filter(i => i.data_provavel_vencida) },
  ];
  const naoLancados = d.itens.filter(i => i.preenchimento_ersus_pendente);
  return (
    <div>
      {grupos.map(g => (
        <div key={g.titulo} style={{ ...S.card, borderLeft: `4px solid ${g.cor}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: g.cor, fontWeight: 700, fontSize: 14 }}>{g.icone} {g.titulo} ({g.itens.length})</div>
          <div style={{ fontSize: 12, color: "#64748b", margin: "2px 0 8px" }}>{g.desc}</div>
          {g.itens.length === 0 ? <div style={{ fontSize: 12, color: "#16a34a", display: "flex", alignItems: "center", gap: 5 }}><CheckCircle2 size={14} /> Nada pendente.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {g.itens.map(i => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>
                  <div><strong>{i.numero_proposta}</strong> · {i.tipo_proposta ?? "—"} · {fmt(i.valor)}<div style={{ color: "#64748b" }}>{i.descricao} · última atualização {fmtData(i.dt_operacao)}</div></div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={S.btn()} onClick={() => onEditar(i)}><Pencil size={13} /> Preparar</button>
                    <a href={i.link_investsus} target="_blank" rel="noreferrer" style={{ ...S.btn("#1565c0"), textDecoration: "none" }}><ExternalLink size={13} /> Lançar no InvestSUS</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ ...S.card, borderLeft: "4px solid #b45309" }}>
        <div style={{ color: "#b45309", fontWeight: 700, fontSize: 14 }}>Preparados no ERSUS360, falta lançar no InvestSUS ({naoLancados.length})</div>
        <div style={{ fontSize: 12, color: "#64748b", margin: "2px 0 8px" }}>A próxima atualização confere sozinha; ou marque quando lançar.</div>
        {naoLancados.length === 0 ? <div style={{ fontSize: 12, color: "#16a34a" }}>Nenhum.</div> : naoLancados.map(i => (
          <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 12, marginBottom: 6 }}>
            <div><strong>{i.numero_proposta}</strong> · preparado: {i.preenchimento_ersus_pendente!.descricao}
              <div style={{ color: "#64748b" }}>por {i.preenchimento_ersus_pendente!.usuario ?? "—"} em {fmtDataHora(i.preenchimento_ersus_pendente!.criado_em)}{i.preenchimento_ersus_pendente!.observacao ? ` · ${i.preenchimento_ersus_pendente!.observacao}` : ""}</div></div>
            <div style={{ display: "flex", gap: 6 }}>
              <a href={i.link_investsus} target="_blank" rel="noreferrer" style={{ ...S.btn(), textDecoration: "none" }}><ExternalLink size={13} /> InvestSUS</a>
              <button style={S.btn("#047857")} disabled={lancar.isPending} onClick={() => lancar.mutate(i.preenchimento_ersus_pendente!.id)}><CheckCircle2 size={13} /> Já lancei</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, borderLeft: "4px solid #6366f1" }}>
        <div style={{ color: "#4f46e5", fontWeight: 700, fontSize: 14 }}>Pagas no ERSUS360 e fora do Monitoramento ({d.pagas_sem_monitoramento.length})</div>
        <div style={{ fontSize: 12, color: "#64748b", margin: "2px 0 8px" }}>Têm valor pago gravado, mas não vieram na lista do Monitoramento do InvestSUS (ex.: situação ainda não é “Proposta Paga”). Conferir.</div>
        {!d.ultima_coleta ? <div style={{ fontSize: 12, color: "#94a3b8" }}>Faça a primeira leitura do InvestSUS para comparar.</div>
          : d.pagas_sem_monitoramento.length === 0 ? <div style={{ fontSize: 12, color: "#16a34a" }}>Todas as propostas pagas estão no Monitoramento.</div>
          : d.pagas_sem_monitoramento.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 12, marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
              <div><strong>{p.numero_proposta}</strong> · {p.exercicio} · pago {fmt(p.valor_pago)}<div style={{ color: "#64748b" }}>{p.situacao_original ?? "—"}</div></div>
              {onAbrirProposta && <button style={S.btn()} onClick={() => onAbrirProposta({ id: p.id })}><Eye size={13} /> Ver proposta</button>}
            </div>
          ))}
      </div>
    </div>
  );
}

// ── Sub-aba: Histórico ────────────────────────────────────────────────────────
function Historico({ ano }: { ano: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["investsus-monitoramento-hist", ano],
    queryFn: () => api.get("/api/investsus/monitoramento/historico", { params: ano ? { ano } : {} }).then(r => r.data),
  });
  if (isLoading) return <div style={S.card}>Carregando…</div>;
  const regs: Registro[] = data?.registros ?? [];
  return (
    <div>
      <div style={S.card}>
        <div style={S.title}>Histórico do monitoramento ({regs.length})</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
            <thead><tr>{["Quando", "Proposta", "Origem", "Monitoramento", "Por", "Lançado no InvestSUS", "Observação"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {regs.map(r => (
                <tr key={r.id}>
                  <td style={S.td}>{fmtDataHora(r.criado_em)}</td>
                  <td style={S.td}>{r.numero_proposta}<div style={{ fontSize: 11, color: "#64748b" }}>{r.tipo_proposta ?? ""}</div></td>
                  <td style={S.td}>{r.origem === "investsus"
                    ? <span style={{ color: "#1565c0", fontWeight: 700 }}>InvestSUS (oficial)</span>
                    : <span style={{ color: "#b45309", fontWeight: 700 }}>ERSUS360 (preparado)</span>}</td>
                  <td style={{ ...S.td, textAlign: "left" }}>{r.descricao}</td>
                  <td style={S.td}>{r.usuario ?? "—"}</td>
                  <td style={S.td}>{r.lancado_no_investsus ? <span style={{ color: "#16a34a" }}>Sim{r.lancado_por ? ` · ${r.lancado_por}` : ""}</span> : <span style={{ color: "#b45309" }}>Não</span>}</td>
                  <td style={{ ...S.td, textAlign: "left" }}>{r.observacao ?? "—"}</td>
                </tr>
              ))}
              {regs.length === 0 && <tr><td colSpan={7} style={{ ...S.td, color: "#94a3b8", padding: 24 }}>Sem histórico ainda.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.title}>Leituras do InvestSUS</div>
        {(data?.coletas ?? []).length === 0 ? <div style={{ fontSize: 12, color: "#94a3b8" }}>Nenhuma leitura ainda.</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            {data.coletas.map((c: any, i: number) => (
              <div key={i}>{fmtDataHora(c.coletado_em)} · {c.usuario ?? "—"} · anos {(c.anos ?? []).join(", ")} · {c.resumo?.total ?? 0} propostas
                ({c.resumo?.atualizada ?? 0} atualizadas, {c.resumo?.desatualizada ?? 0} desatualizadas, {c.resumo?.finalizada ?? 0} finalizadas)</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
type SubAba = "painel" | "propostas" | "pendencias" | "historico";

export default function MonitoramentoExecucao({ onAbrirProposta }: { onAbrirProposta?: (p: any) => void }) {
  const [sub, setSub] = useState<SubAba>("painel");
  const [ano, setAno] = useState<string>(String(new Date().getFullYear()));
  const [numero, setNumero] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<Status | "">("");
  const [editando, setEditando] = useState<Item | null>(null);

  const { data, isLoading, error } = useQuery<Resposta>({
    queryKey: ["investsus-monitoramento", ano, busca],
    queryFn: () => api.get("/api/investsus/monitoramento", { params: { ...(ano ? { ano } : {}), ...(busca ? { numero: busca } : {}) } }).then(r => r.data),
  });
  const anos = useMemo(() => { const a = new Date().getFullYear(); const l: number[] = []; for (let x = a; x >= 2025; x--) l.push(x); return l; }, []);
  const pend = data ? data.resumo.por_status.desatualizada.quantidade + data.resumo.a_vencer + data.resumo.data_provavel_vencida
    + data.resumo.preenchimentos_nao_lancados + data.resumo.pagas_sem_monitoramento : 0;

  const subAbas: { key: SubAba; label: string; icone: JSX.Element; badge?: number }[] = [
    { key: "painel", label: "Painel", icone: <LayoutDashboard size={13} /> },
    { key: "propostas", label: "Propostas", icone: <ListChecks size={13} />, badge: data?.resumo.total },
    { key: "pendencias", label: "Pendências", icone: <AlertTriangle size={13} />, badge: pend },
    { key: "historico", label: "Histórico", icone: <History size={13} /> },
  ];

  return (
    <div>
      <style>{`@media (max-width: 720px){ .monit-painel{ grid-template-columns: 1fr !important; } }`}</style>
      <div style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: AZUL }}>Monitoramento de Execução da Proposta</div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>Mesma lista do InvestSUS (Monitoramento de Emendas): propostas pagas e a situação do preenchimento.</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select value={ano} onChange={e => setAno(e.target.value)} style={S.input} aria-label="Ano">
              <option value="">Todos os anos</option>
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <form onSubmit={e => { e.preventDefault(); setBusca(numero.trim()); setSub("propostas"); }} style={{ display: "flex", gap: 0 }}>
              <input value={numero} onChange={e => setNumero(e.target.value)} placeholder="Número da proposta" style={{ ...S.input, borderTopRightRadius: 0, borderBottomRightRadius: 0, width: 200 }} />
              <button type="submit" style={{ ...S.btn("#1aa7e9"), borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}><Search size={13} /> Buscar</button>
            </form>
            {busca && <button style={S.btn()} onClick={() => { setBusca(""); setNumero(""); }}>Limpar busca</button>}
          </div>
        </div>
        <SincronizarMonitoramento ultima={data?.ultima_coleta ?? null} />
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {subAbas.map(a => (
          <button key={a.key} style={S.sub(sub === a.key)} onClick={() => setSub(a.key)}>
            {a.icone} {a.label}
            {!!a.badge && <span style={{ background: sub === a.key ? "#fff" : (a.key === "pendencias" ? "#dc2626" : "#e2e8f0"), color: sub === a.key ? AZUL : (a.key === "pendencias" ? "#fff" : "#334155"), borderRadius: 999, padding: "0 7px", fontSize: 11 }}>{a.badge}</span>}
          </button>
        ))}
      </div>

      {isLoading ? <div style={S.card}>Carregando…</div>
        : error ? <div style={{ ...S.card, color: "#b91c1c" }}>Erro ao carregar: {erroMsg(error)}</div>
        : !data ? null
        : sub === "painel" ? <Painel d={data} onFiltrarStatus={s => { setFiltroStatus(s); setSub("propostas"); }} />
        : sub === "propostas" ? <Propostas itens={data.itens} filtroStatus={filtroStatus} setFiltroStatus={setFiltroStatus} onEditar={setEditando} onAbrirProposta={onAbrirProposta} />
        : sub === "pendencias" ? <Pendencias d={data} onEditar={setEditando} onAbrirProposta={onAbrirProposta} />
        : <Historico ano={ano} />}

      {editando && <FormularioMonitoramento item={editando} onFechar={() => setEditando(null)} />}
    </div>
  );
}
