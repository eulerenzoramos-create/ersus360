/**
 * Previsto × Recebido — evolução do Controle Financeiro FNS
 *
 * Compara a previsão das Portarias (portarias_municipio) com os pagamentos já
 * coletados do FNS, por COMPETÊNCIA (a data do crédito é mostrada, mas não
 * define a competência). Previsão não é receita e nunca é somada ao recebido.
 * Respeita os mesmos filtros da tela (exercício, período, grupo, tipo, busca)
 * e o município da sessão.
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Link2, Plus, RefreshCw, Trash2, Unlink, X } from "lucide-react";
import { api, apiGet } from "../lib/api";
import { useAuth } from "../App";

const C = {
  blue: "#1565c0", blueL: "#e3f0ff", green: "#15803d", greenL: "#dcfce7", red: "#b91c1c", redL: "#fee2e2",
  amber: "#b45309", amberL: "#fef3c7", orange: "#c2410c", orangeL: "#ffedd5", gray: "#64748b",
  grayL: "#f1f5f9", grayBdr: "#e2e8f0", white: "#fff", text: "#0f172a",
};
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const SIT: Record<string, { rotulo: string; icone: string; cor: string; fundo: string }> = {
  PAGO:                 { rotulo: "PAGO",                  icone: "🟢", cor: C.green,  fundo: C.greenL },
  PARCIAL:              { rotulo: "PARCIAL",               icone: "🟡", cor: C.amber,  fundo: C.amberL },
  NAO_RECEBIDO:         { rotulo: "NÃO RECEBIDO",          icone: "🔴", cor: C.red,    fundo: C.redL },
  PAGO_A_MAIOR:         { rotulo: "PAGO A MAIOR",          icone: "🔵", cor: C.blue,   fundo: C.blueL },
  A_VENCER:             { rotulo: "A VENCER",              icone: "⚪", cor: C.gray,   fundo: C.grayL },
  CONCILIACAO_PENDENTE: { rotulo: "CONCILIAÇÃO PENDENTE",  icone: "🟠", cor: C.orange, fundo: C.orangeL },
};
const PERIODICIDADES = ["unica", "mensal", "bimestral", "trimestral", "quadrimestral", "semestral", "anual"];
const PODE_EDITAR = new Set(["administrador_geral", "superadmin", "admin", "gestor", "financeiro", "contabilidade"]);

const brl = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const compRotulo = (c: string) => `${MESES[Number(c.slice(5, 7)) - 1]}/${c.slice(0, 4)}`;
const dataBR = (d: string) => d.split("-").reverse().join("/");
const erroDe = (e: any) => e?.response?.data?.detail ? String(e.response.data.detail) : "Não foi possível concluir a operação.";

export interface FiltrosFns {
  exercicio: number; mesInicio: number; mesFim: number;
  grupo?: string; tipo?: string; busca?: string;
}

function paramsDe(f: FiltrosFns) {
  const p = new URLSearchParams({ exercicio: String(f.exercicio), mes_inicio: String(f.mesInicio), mes_fim: String(f.mesFim) });
  if (f.grupo) p.set("grupo", f.grupo);
  if (f.tipo) p.set("tipo_incentivo", f.tipo);
  if (f.busca) p.set("busca", f.busca);
  return p.toString();
}

export function usePainelPrevisto(f: FiltrosFns) {
  const qs = paramsDe(f);
  return useQuery<any>({
    queryKey: ["fns-previsto", qs],
    queryFn: () => apiGet(`/api/fns-previsao/painel?${qs}`),
    staleTime: 120_000,
  });
}

function Card({ rotulo, valor, cor }: { rotulo: string; valor: string; cor: string }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: 0.5 }}>{rotulo}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: cor, marginTop: 4 }}>{valor}</div>
    </div>
  );
}

export function CardsPrevisto({ cards }: { cards: any }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 14 }}>
      <Card rotulo="Previsto no exercício" valor={brl(cards.previsto)} cor={C.text} />
      <Card rotulo="Recebido" valor={brl(cards.recebido)} cor={C.green} />
      <Card rotulo="A receber" valor={brl(cards.a_receber)} cor={cards.a_receber > 0 ? C.red : C.green} />
      <Card rotulo="% Recebido" valor={cards.pct_recebido == null ? "—" :
        `${cards.pct_recebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%`} cor={C.blue} />
    </div>
  );
}

function Situacao({ s }: { s: string }) {
  const x = SIT[s] ?? SIT.A_VENCER;
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center", fontSize: 11, fontWeight: 700,
      color: x.cor, background: x.fundo, borderRadius: 999, padding: "3px 8px", whiteSpace: "nowrap" }}>
      {x.icone} {x.rotulo}
    </span>
  );
}

// ── Formulário de previsão ────────────────────────────────────────────────────
const VAZIO = {
  numero_portaria: "", ano_portaria: new Date().getFullYear(), orgao_emissor: "GM/MS", data_portaria: "",
  exercicio: new Date().getFullYear(), grupo: "", acao: "", componente: "", programa: "",
  valor_previsto: "", periodicidade: "unica", competencia_inicial: "", qtd_parcelas: 1,
  valor_parcela: "", fundamento: "",
};

function FormPrevisao({ inicial, exercicio, classificacoes, onFechar, onSalvo }: {
  inicial?: any; exercicio: number; classificacoes: string[][]; onFechar: () => void; onSalvo: (msg: string) => void;
}) {
  const [f, setF] = useState<any>(inicial ? {
    ...VAZIO, ...inicial, data_portaria: inicial.data_portaria ?? "", valor_previsto: inicial.valor_previsto ?? "",
    valor_parcela: inicial.valor_parcela ?? "", grupo: inicial.grupo ?? "", acao: inicial.acao ?? "",
    componente: inicial.componente ?? "", fundamento: inicial.fundamento ?? "",
    competencia_inicial: inicial.competencia_inicial ?? "", qtd_parcelas: inicial.qtd_parcelas ?? 1,
  } : { ...VAZIO, exercicio, ano_portaria: exercicio });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const set = (k: string) => (e: any) => setF((x: any) => ({ ...x, [k]: e.target.value }));

  const escolherClassificacao = (texto: string) => {
    const c = classificacoes.find(([, , comp]) => comp === texto);
    setF((x: any) => c ? { ...x, grupo: c[0], acao: c[1], componente: c[2] } : { ...x, componente: texto });
  };

  const salvar = async () => {
    setErro(""); setSalvando(true);
    const corpo = {
      ...f, ano_portaria: Number(f.ano_portaria), exercicio: Number(f.exercicio),
      valor_previsto: Number(String(f.valor_previsto).replace(",", ".")),
      qtd_parcelas: Number(f.qtd_parcelas) || 1,
      valor_parcela: f.valor_parcela === "" ? null : Number(String(f.valor_parcela).replace(",", ".")),
      data_portaria: f.data_portaria || null,
    };
    try {
      const r = inicial?.id ? await api.put(`/api/fns-previsao/previsoes/${inicial.id}`, corpo)
                            : await api.post("/api/fns-previsao/previsoes", corpo);
      const n = r.data?.conciliacao?.vinculados ?? 0;
      onSalvo(`Previsão salva.${n ? ` ${n} pagamento(s) do FNS conciliado(s) automaticamente.` : ""}`);
    } catch (e) { setErro(erroDe(e)); } finally { setSalvando(false); }
  };

  const campo = (rotulo: string, k: string, extra: any = {}) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 11, fontWeight: 600, color: C.gray, minWidth: 0 }}>
      {rotulo}
      <input value={f[k]} onChange={set(k)} {...extra}
        style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.grayBdr}`, fontSize: 13, color: C.text, minWidth: 0 }} />
    </label>
  );

  return (
    <div style={{ background: C.white, border: `1px solid ${C.blue}`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <b style={{ fontSize: 14 }}>{inicial?.id ? "Editar previsão da Portaria" : "Nova previsão da Portaria"}</b>
        <button onClick={onFechar} aria-label="Fechar" style={{ marginLeft: "auto", border: "none", background: "none", cursor: "pointer" }}><X size={16} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        {campo("Nº da Portaria *", "numero_portaria", { placeholder: "Ex.: 3493" })}
        {campo("Ano da Portaria *", "ano_portaria", { type: "number" })}
        {campo("Órgão", "orgao_emissor")}
        {campo("Data da Portaria", "data_portaria", { type: "date" })}
        {campo("Exercício *", "exercicio", { type: "number" })}
        {campo("Valor previsto (total) *", "valor_previsto", { inputMode: "decimal", placeholder: "0,00" })}
        <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 11, fontWeight: 600, color: C.gray }}>
          Periodicidade
          <select value={f.periodicidade} onChange={set("periodicidade")}
            style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.grayBdr}`, fontSize: 13 }}>
            {PERIODICIDADES.map(p => <option key={p} value={p}>{p === "unica" ? "única" : p}</option>)}
          </select>
        </label>
        {campo("Competência (inicial) *", "competencia_inicial", { type: "month" })}
        {f.periodicidade !== "unica" && campo("Qtd. de parcelas", "qtd_parcelas", { type: "number", min: 1 })}
        {campo("Valor da parcela (opcional)", "valor_parcela", { inputMode: "decimal", placeholder: "calculado se vazio" })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginTop: 10 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 11, fontWeight: 600, color: C.gray }}>
          Componente (como aparece no FNS) *
          <input list="componentes-fns" value={f.componente} onChange={e => escolherClassificacao(e.target.value)}
            style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.grayBdr}`, fontSize: 13 }} />
          <datalist id="componentes-fns">
            {classificacoes.filter(c => c[2]).map(c => <option key={c.join("|")} value={c[2]}>{c[0]} · {c[1]}</option>)}
          </datalist>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          {campo("Grupo", "grupo")}
          {campo("Ação", "acao")}
        </div>
        {campo("Fundamento / origem", "fundamento", { placeholder: "Ex.: Portaria GM/MS nº … — anexo, item …" })}
      </div>
      {erro && <div role="alert" style={{ color: C.red, fontSize: 12.5, marginTop: 8 }}>{erro}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={salvar} disabled={salvando}
          style={{ background: C.blue, color: C.white, border: "none", borderRadius: 7, padding: "8px 14px", fontWeight: 700, cursor: "pointer" }}>
          {salvando ? "Salvando…" : "Salvar previsão"}
        </button>
        <span style={{ fontSize: 11.5, color: C.gray, alignSelf: "center" }}>
          A previsão é só referência: não entra como receita.
        </span>
      </div>
    </div>
  );
}

// ── Visão principal ───────────────────────────────────────────────────────────
export default function PrevistoRecebidoFns({ filtros }: { filtros: FiltrosFns }) {
  const auth = useAuth();
  const podeEditar = PODE_EDITAR.has(auth.perfil);
  const qc = useQueryClient();
  const { data, isLoading, error } = usePainelPrevisto(filtros);
  const { data: previsoes } = useQuery<any[]>({
    queryKey: ["fns-previsoes", filtros.exercicio],
    queryFn: () => apiGet(`/api/fns-previsao/previsoes?exercicio=${filtros.exercicio}`),
    staleTime: 120_000,
  });
  const [visao, setVisao] = useState<"competencias" | "matriz">("competencias");
  const [medida, setMedida] = useState<"recebido" | "previsto" | "diferenca">("recebido");
  const [form, setForm] = useState<any | null>(null);
  const [vinculando, setVinculando] = useState<any | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const recarregar = async () => {
    await qc.invalidateQueries({ queryKey: ["fns-previsto"] });
    await qc.invalidateQueries({ queryKey: ["fns-previsoes"] });
    await qc.invalidateQueries({ queryKey: ["fns-validacoes"] });
  };
  const acao = async (fn: () => Promise<any>, ok: string) => {
    setOcupado(true); setMsg(null);
    try { const r = await fn(); setMsg({ ok: true, t: typeof r === "string" ? r : ok }); await recarregar(); }
    catch (e) { setMsg({ ok: false, t: erroDe(e) }); }
    finally { setOcupado(false); }
  };

  const vincular = (linha: any, transferenciaId: number, sugestao: boolean) => {
    const cand = linha.candidatos.find((c: any) => c.id === transferenciaId);
    const texto = `Vincular o pagamento FNS de ${brl(cand?.valor_liquido)} ` +
      `(crédito em ${cand?.data_pagamento ? dataBR(cand.data_pagamento) : "—"}) à competência ` +
      `${compRotulo(linha.competencia)} da ${linha.portaria}?\n\nEsta vinculação manual fica registrada na auditoria.`;
    if (!window.confirm(texto)) return;
    acao(() => api.post("/api/fns-previsao/vinculos", {
      transferencia_id: transferenciaId, previsao_id: linha.previsao_id, competencia: linha.competencia,
      motivo: sugestao ? "sugestão confirmada pelo usuário" : "vínculo manual",
    }), "Pagamento vinculado à competência.");
    setVinculando(null);
  };

  const classificacoes: string[][] = data?.classificacoes_fns ?? [];
  const mesesVisiveis = useMemo(() => Array.from({ length: filtros.mesFim - filtros.mesInicio + 1 },
    (_, i) => filtros.mesInicio + i), [filtros.mesInicio, filtros.mesFim]);

  if (error) return <div role="alert" style={{ color: C.red, padding: 16 }}>{erroDe(error)}</div>;

  return (
    <div>
      {data && <CardsPrevisto cards={data.cards} />}

      {data?.alertas?.length > 0 && (
        <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
          <div style={{ fontWeight: 700, color: C.amber, display: "flex", gap: 8, alignItems: "center" }}>
            <AlertTriangle size={14} /> Conciliação Previsto × Recebido
          </div>
          {data.alertas.map((a: any) => <div key={a.tipo} style={{ marginTop: 4, color: "#5d4037" }}>{a.mensagem} — <em>{a.providencia}</em></div>)}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        {(["competencias", "matriz"] as const).map(v => (
          <button key={v} onClick={() => setVisao(v)} style={{
            padding: "6px 12px", borderRadius: 7, border: `1px solid ${visao === v ? C.blue : C.grayBdr}`,
            background: visao === v ? C.blue : C.white, color: visao === v ? C.white : C.text, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            {v === "competencias" ? "Por competência" : "Matriz mensal"}
          </button>
        ))}
        {podeEditar && <>
          <button onClick={() => setForm({})} style={{ display: "flex", gap: 5, alignItems: "center", padding: "6px 12px",
            borderRadius: 7, border: "none", background: C.green, color: C.white, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={13} /> Nova previsão
          </button>
          <button disabled={ocupado} title="Cria as previsões com a Portaria e a Comp./Parcela que o FNS informa em cada pagamento"
            onClick={() => {
              if (!window.confirm(`Gerar as previsões de ${filtros.exercicio} a partir das Portarias e parcelas informadas pelo FNS?

` +
                "Previsões já cadastradas não são alteradas. Confira depois valor e ano de cada Portaria.")) return;
              acao(async () => {
                const r = await api.post(`/api/fns-previsao/previsoes/gerar-do-fns?exercicio=${filtros.exercicio}`);
                return r.data.criadas
                  ? `${r.data.criadas} previsão(ões) gerada(s) do FNS · ${r.data.conciliacao?.vinculados ?? 0} pagamento(s) conciliado(s).`
                  : "Nenhuma previsão nova: os pagamentos ainda sem Comp./Parcela precisam de “Sincronizar com FNS”, ou já existem previsões para eles.";
              }, "Previsões geradas.");
            }} style={{ display: "flex", gap: 5, alignItems: "center", padding: "6px 12px",
            borderRadius: 7, border: `1px solid ${C.blue}`, background: C.white, color: C.blue, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            <RefreshCw size={13} /> Gerar previsões do FNS
          </button>
          <button disabled={ocupado} onClick={() => acao(async () => {
            const r = await api.post("/api/fns-previsao/conciliar");
            return `${r.data.vinculados} pagamento(s) conciliado(s) automaticamente.`;
          }, "Conciliação executada.")} style={{ display: "flex", gap: 5, alignItems: "center", padding: "6px 12px",
            borderRadius: 7, border: `1px solid ${C.grayBdr}`, background: C.white, fontSize: 12.5, cursor: "pointer" }}>
            <RefreshCw size={13} /> Conciliar agora
          </button>
        </>}
        {data && <span style={{ fontSize: 11.5, color: C.gray }}>
          {data.total_previsoes} previsão(ões) cadastrada(s) · {data.pagamentos_sem_previsao} pagamento(s) FNS sem previsão correspondente
        </span>}
      </div>

      {msg && <div role={msg.ok ? "status" : "alert"} style={{ fontSize: 12.5, marginBottom: 10, color: msg.ok ? C.green : C.red }}>{msg.t}</div>}

      {form && <FormPrevisao inicial={form.id ? form : undefined} exercicio={filtros.exercicio}
        classificacoes={classificacoes} onFechar={() => setForm(null)}
        onSalvo={async (t) => { setForm(null); setMsg({ ok: true, t }); await recarregar(); }} />}

      {isLoading && <div style={{ padding: 20, color: C.gray }}>Carregando…</div>}

      {data && visao === "competencias" && (
        <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 10, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: C.grayL, textAlign: "left" }}>
                {["Competência", "Portaria", "Previsto", "Recebido FNS", "Diferença", "Data do Crédito", "Situação", ""].map(h =>
                  <th key={h} style={{ padding: "8px 10px", fontSize: 11, color: C.gray, whiteSpace: "nowrap" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.linhas.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 18, color: C.gray, textAlign: "center" }}>
                  Nenhuma previsão para os filtros atuais.{podeEditar && " Clique em “Gerar previsões do FNS” (usa a Portaria e a Comp./Parcela de cada pagamento) ou cadastre em “Nova previsão”."}
                </td></tr>
              )}
              {data.linhas.map((l: any) => (
                <tr key={`${l.previsao_id}-${l.competencia}`} style={{ borderTop: `1px solid ${C.grayBdr}`, verticalAlign: "top" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {compRotulo(l.competencia)}
                    {l.qtd_parcelas > 1 && <div style={{ fontSize: 10.5, color: C.gray, fontWeight: 500 }}>parcela {l.parcela}/{l.qtd_parcelas}</div>}
                  </td>
                  <td style={{ padding: "8px 10px", minWidth: 180 }}>
                    <div style={{ fontWeight: 600 }}>{l.portaria}</div>
                    <div style={{ fontSize: 11, color: C.gray }}>{l.componente || l.acao}</div>
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", whiteSpace: "nowrap" }}>{brl(l.previsto)}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", whiteSpace: "nowrap", fontWeight: 700 }}>
                    {l.transferencias.length ? brl(l.recebido) : "—"}
                    {l.coleta_incompleta && <div style={{ fontSize: 10.5, color: C.amber, fontWeight: 500 }}>coleta incompleta</div>}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", whiteSpace: "nowrap",
                    color: l.diferenca < 0 ? C.red : l.diferenca > 0 ? C.blue : C.green }}>{brl(l.diferenca)}</td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                    {l.datas_credito.length ? l.datas_credito.map(dataBR).join(", ") : "—"}
                    {l.parcela_fns?.length > 0 && <div title="Referência oficial informada pelo FNS"
                      style={{ fontSize: 10.5, color: C.text, fontWeight: 600 }}>FNS: parcela {l.parcela_fns.join(", ")}</div>}
                    {l.pago_em_mes_diferente && <div title="Crédito em mês diferente da competência de referência"
                      style={{ fontSize: 10.5, color: C.blue }}>ℹ pago em outro mês</div>}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <Situacao s={l.situacao} />
                    {l.vinculo_tipo === "manual" && <div style={{ fontSize: 10.5, color: C.gray, marginTop: 3 }}>vínculo manual</div>}
                  </td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                    {podeEditar && l.transferencias.length > 0 && (
                      <button disabled={ocupado} title="Desfazer vínculo"
                        onClick={() => window.confirm("Desfazer o vínculo deste pagamento com a competência? (registrado na auditoria)") &&
                          acao(() => Promise.all(l.transferencias.map((t: any) => api.delete(`/api/fns-previsao/vinculos/${t.id}`))),
                               "Vínculo desfeito.")}
                        style={{ border: `1px solid ${C.grayBdr}`, background: C.white, borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
                        <Unlink size={12} />
                      </button>
                    )}
                    {podeEditar && !l.transferencias.length && l.sugestao_transferencia_id && (
                      <button disabled={ocupado} onClick={() => vincular(l, l.sugestao_transferencia_id, true)}
                        style={{ border: "none", background: C.orange, color: C.white, borderRadius: 6, padding: "4px 8px",
                          fontSize: 11.5, fontWeight: 700, cursor: "pointer", marginRight: 4 }}>
                        Confirmar sugestão
                      </button>
                    )}
                    {podeEditar && !l.transferencias.length && l.candidatos.length > 0 && (
                      <button disabled={ocupado} onClick={() => setVinculando(l)} title="Escolher pagamento"
                        style={{ border: `1px solid ${C.grayBdr}`, background: C.white, borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
                        <Link2 size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && visao === "matriz" && (
        <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 10, padding: 12, overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }} role="radiogroup" aria-label="Valor exibido">
            {(["recebido", "previsto", "diferenca"] as const).map(m => (
              <button key={m} role="radio" aria-checked={medida === m} onClick={() => setMedida(m)} style={{
                padding: "5px 11px", borderRadius: 6, border: `1px solid ${medida === m ? C.blue : C.grayBdr}`,
                background: medida === m ? C.blueL : C.white, color: C.text, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {m === "recebido" ? "Recebido" : m === "previsto" ? "Previsto" : "Diferença"}
              </button>
            ))}
            <span style={{ fontSize: 11, color: C.gray, alignSelf: "center" }}>por competência de referência · só itens com previsão</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.grayL }}>
                <th style={{ padding: "7px 8px", textAlign: "left", fontSize: 11, color: C.gray }}>Grupo / Ação / Componente</th>
                {mesesVisiveis.map(m => <th key={m} style={{ padding: "7px 8px", textAlign: "right", fontSize: 11, color: C.gray }}>{MESES[m - 1]}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.matriz.map((r: any) => (
                <tr key={`${r.grupo}|${r.acao}|${r.componente}`} style={{ borderTop: `1px solid ${C.grayBdr}` }}>
                  <td style={{ padding: "7px 8px", minWidth: 220 }}>
                    <div style={{ fontSize: 10.5, color: C.gray }}>{r.grupo}</div>
                    <div style={{ fontWeight: 600 }}>{r.componente || r.acao}</div>
                  </td>
                  {mesesVisiveis.map(m => {
                    const cel = r.meses[m];
                    const v = cel?.[medida] ?? 0;
                    const vazio = !cel || (cel.previsto === 0 && cel.recebido === 0);
                    return <td key={m} style={{ padding: "7px 8px", textAlign: "right", whiteSpace: "nowrap",
                      color: medida === "diferenca" && !vazio ? (v < 0 ? C.red : v > 0 ? C.blue : C.green) : C.text }}>
                      {vazio ? "—" : brl(v)}
                    </td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Escolha manual de pagamento */}
      {vinculando && (
        <div role="dialog" aria-modal="true" aria-label="Vincular pagamento FNS" onClick={() => setVinculando(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", zIndex: 1000, display: "flex",
            alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.white, borderRadius: 12, padding: 18, width: "100%", maxWidth: 560 }}>
            <b style={{ fontSize: 14 }}>Vincular pagamento — {compRotulo(vinculando.competencia)} · {vinculando.portaria}</b>
            <p style={{ fontSize: 12, color: C.gray, margin: "6px 0 10px" }}>
              Previsto: {brl(vinculando.previsto)}. Escolha o pagamento do FNS que corresponde a esta competência.
              Valor igual não comprova a competência — confira a Portaria/extrato. O vínculo fica na auditoria.
            </p>
            {vinculando.candidatos.map((c: any) => (
              <button key={c.id} onClick={() => vincular(vinculando, c.id, false)}
                style={{ display: "block", width: "100%", textAlign: "left", border: `1px solid ${C.grayBdr}`, borderRadius: 8,
                  padding: "8px 10px", marginBottom: 6, background: c.id === vinculando.sugestao_transferencia_id ? C.orangeL : C.white, cursor: "pointer" }}>
                <b>{c.valor_liquido == null ? "sem valor líquido (coleta incompleta)" : brl(c.valor_liquido)}</b>
                {" · crédito em "}{c.data_pagamento ? dataBR(c.data_pagamento) : "—"}
                {c.parcela_fns && <> · <b>parcela {c.parcela_fns}</b></>}
                {c.id === vinculando.sugestao_transferencia_id && <span style={{ color: C.orange, fontWeight: 700 }}> · sugestão</span>}
                <div style={{ fontSize: 11, color: C.gray }}>{c.componente}{c.numero_portaria ? ` · Portaria ${c.numero_portaria}` : ""}</div>
              </button>
            ))}
            <button onClick={() => setVinculando(null)} style={{ marginTop: 6, border: "none", background: "none", color: C.gray, cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Previsões cadastradas */}
      {previsoes && previsoes.length > 0 && (
        <details style={{ marginTop: 16, background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 10, padding: "10px 14px" }}>
          <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Previsões cadastradas ({previsoes.length})</summary>
          {previsoes.map(p => (
            <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center", borderTop: `1px solid ${C.grayBdr}`, padding: "8px 0", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>{p.portaria} · {brl(p.valor_previsto)}</div>
                <div style={{ fontSize: 11, color: C.gray }}>
                  {p.componente || p.acao} · {p.periodicidade === "unica" ? "parcela única" : `${p.qtd_parcelas} parcelas ${p.periodicidade}s`}
                  {" "}a partir de {p.competencia_inicial ? compRotulo(p.competencia_inicial) : "—"}
                  {p.fundamento ? ` · ${p.fundamento}` : ""}
                </div>
              </div>
              {podeEditar && <>
                <button onClick={() => setForm(p)} style={{ border: `1px solid ${C.grayBdr}`, background: C.white, borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Editar</button>
                <button onClick={() => window.confirm("Excluir esta previsão? Os pagamentos do FNS não são apagados; só o vínculo é desfeito.") &&
                  acao(() => api.delete(`/api/fns-previsao/previsoes/${p.id}`), "Previsão excluída.")}
                  aria-label="Excluir previsão" style={{ border: `1px solid ${C.grayBdr}`, background: C.white, borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
                  <Trash2 size={12} color={C.red} />
                </button>
              </>}
            </div>
          ))}
        </details>
      )}

      {data && <p style={{ fontSize: 11.5, color: C.gray, marginTop: 12 }}>{data.nota}</p>}
    </div>
  );
}

/** Bloco para o Relatório Mensal: aparece só quando há previsão cadastrada. */
export function ResumoPrevistoRelatorio({ filtros, onAbrir }: { filtros: FiltrosFns; onAbrir: () => void }) {
  const { data } = usePainelPrevisto(filtros);
  if (!data || !data.total_previsoes || data.linhas.length === 0) return null;
  const cont = data.situacoes as Record<string, number>;
  return (
    <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
        <b style={{ fontSize: 13 }}>Previsto (Portarias) × Recebido (FNS) no período</b>
        <button onClick={onAbrir} style={{ marginLeft: "auto", border: `1px solid ${C.blue}`, color: C.blue, background: C.white,
          borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Ver detalhes</button>
      </div>
      <CardsPrevisto cards={data.cards} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {Object.entries(cont).map(([s, n]) => <span key={s} style={{ fontSize: 11.5 }}><Situacao s={s} /> {n}</span>)}
      </div>
    </div>
  );
}
