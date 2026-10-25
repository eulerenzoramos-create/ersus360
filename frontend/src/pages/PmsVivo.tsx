// PMS Vivo — Gestão, Execução e Resultados do Plano Municipal de Saúde (fases 1–3: PMS, PAS, Minhas Ações, validação)
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Info, Paperclip, Target, Upload, XCircle } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../App";

// ── Tipos ────────────────────────────────────────────────────────────────────
interface Ref { tipos_indicador: Record<string, string>; polaridades: Record<string, string>; situacoes_acao: Record<string, string>;
  exige_justificativa: string[]; pode_planejar: boolean; pode_validar: boolean; usuario_id: number | null }
interface Plano { id: number; titulo: string; vigencia_inicio: number; vigencia_fim: number; versao: number; situacao: string;
  plano_origem_id: number | null; motivo_versao: string | null; resolucao_cms: string | null; aprovado_por: string | null; aprovado_em: string | null }
interface MetaAnual { ano: number; meta_prevista: number | null; resultado: number | null }
interface Meta { id: number; uid: string; codigo: string; descricao: string; indicador: string | null; tipo_indicador: string | null;
  unidade: string | null; polaridade: string | null; formula: string | null; linha_base: number | null; ano_linha_base: number | null;
  meta_quadrienal: number | null; fonte: string | null; setor_responsavel: string | null; metas_anuais: MetaAnual[] | Record<string, number | null>; acoes?: number }
interface Objetivo { id?: number; codigo: string; descricao: string; metas: Meta[] }
interface Diretriz { id?: number; codigo: string; descricao: string; objetivos: Objetivo[] }
interface Anexo { id: number; nome: string; tamanho: number; descricao: string | null; enviado_por: string | null; enviado_em: string }
interface PlanoDet extends Plano { anos: number[]; diretrizes: Diretriz[]; documentos: Anexo[] }
interface Pas { id: number; plano_id: number; exercicio: number; situacao: string; resolucao_cms: string | null }
interface MetaRef { id: number; codigo: string; descricao: string }
interface Acao { id: number; codigo: string; descricao: string; produto: string | null; quantidade_prevista: number | null; prazo: string | null;
  setor_responsavel: string | null; responsavel_usuario_id: number | null; responsavel_nome: string | null; recursos: string | null;
  fonte_financiamento: string | null; indicador_acompanhamento: string | null; evidencia_esperada: string | null; situacao: string;
  situacao_rotulo: string; percentual_execucao: number | null; quantidade_realizada: number | null; resultado_alcancado: string | null;
  justificativa: string | null; situacao_validada_por: string | null; atrasada: boolean; prazo_proximo: boolean; metas: MetaRef[];
  aguardando_validacao?: boolean; devolvida?: boolean; parecer?: string | null; evidencia_pendente?: boolean; exercicio?: number }
interface Atualizacao { id: number; acao_id: number; situacao: string; situacao_rotulo: string; percentual_execucao: number | null;
  quantidade_realizada: number | null; resultado_alcancado: string | null; justificativa: string | null; status: string;
  informado_por: string; informado_em: string; validado_por: string | null; validado_em: string | null; parecer: string | null }
interface AcaoDet extends Acao { atualizacoes: Atualizacao[]; anexos: Anexo[]; historico: { evento: string; descricao: string; usuario: string | null; criado_em: string }[];
  pode_atualizar: boolean; pode_validar: boolean }
interface Previa { diretrizes: Diretriz[]; erros: string[]; avisos: string[]; totais: Record<string, number> }

// ── Aparência ────────────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: "#fff", color: "#1f2937", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 12 };
const h3: React.CSSProperties = { margin: "0 0 8px", fontSize: 15, color: "#1f2937" };
const inp: React.CSSProperties = { width: "100%", padding: "6px 8px", border: "1px solid #d4d4d0", borderRadius: 6, fontSize: 13, boxSizing: "border-box" };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, color: "#475569", marginBottom: 8 };
const btn = (cor = "#1d4ed8"): React.CSSProperties => ({ background: cor, color: "#fff", border: "none", borderRadius: 6, padding: "7px 12px",
  fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 });
const COR_SIT: Record<string, string> = { nao_iniciada: "#64748b", em_andamento: "#2563eb", concluida: "#059669", parcial: "#d97706",
  nao_executada: "#dc2626", cancelada: "#475569" };
const COR_PLANO: Record<string, string> = { rascunho: "#d97706", aprovado: "#059669", substituido: "#94a3b8" };
const ROT_PLANO: Record<string, string> = { rascunho: "Proposta (rascunho)", aprovado: "Aprovado — oficial", substituido: "Substituído" };
const dataBr = (d?: string | null) => (d ? d.split("T")[0].split("-").reverse().join("/") : "—");
const num = (v: number | null | undefined) => (v == null ? "—" : v.toLocaleString("pt-BR", { maximumFractionDigits: 2 }));
const erro = (e: unknown) => { const d = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  return typeof d === "string" ? d : d ? "Dados inválidos." : e ? "Falha na operação." : null; };
const Erro = ({ e }: { e: unknown }) => erro(e) ? <div style={{ color: "#b91c1c", fontSize: 12, marginTop: 6 }}>{erro(e)}</div> : null;
const Selo = ({ t, cor }: { t: string; cor: string }) => <span style={{ background: cor + "1a", color: cor, border: `1px solid ${cor}55`,
  borderRadius: 999, padding: "1px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{t}</span>;
async function baixar(url: string, nome: string) {
  const r = await api.get(url, { responseType: "blob" });
  const u = URL.createObjectURL(r.data); const a = document.createElement("a"); a.href = u; a.download = nome; a.click(); URL.revokeObjectURL(u);
}
const upload = (url: string, arquivo: File, extra: Record<string, string> = {}) => {
  const fd = new FormData(); fd.append("arquivo", arquivo); Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
  return api.post(url, fd, { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data);
};

// ── Aba PMS ──────────────────────────────────────────────────────────────────
function Importacao({ plano, ref_ }: { plano: PlanoDet; ref_: Ref }) {
  const qc = useQueryClient();
  const [previa, setPrevia] = useState<Previa | null>(null);
  const ler = useMutation({ mutationFn: (f: File) => upload(`/api/pms-vivo/planos/${plano.id}/importar/previa`, f), onSuccess: setPrevia });
  const tem = plano.diretrizes.length > 0;
  const gravar = useMutation({ mutationFn: () => api.post(`/api/pms-vivo/planos/${plano.id}/importar/confirmar`, { diretrizes: previa!.diretrizes, substituir: tem }),
    onSuccess: () => { setPrevia(null); qc.invalidateQueries({ queryKey: ["pms"] }); } });
  return (
    <div style={card}>
      <h3 style={h3}>Importar metas do PMS (planilha)</h3>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Baixe o modelo, preencha só com o que está no PMS e envie. Nada é gravado antes da sua revisão; células ilegíveis ficam vazias e são apontadas.</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button style={btn("#475569")} onClick={() => baixar(`/api/pms-vivo/modelo.xlsx?vigencia_inicio=${plano.vigencia_inicio}`, `modelo_pms_${plano.vigencia_inicio}.xlsx`)}><Download size={14} />Planilha modelo</button>
        <label style={{ ...btn(), cursor: "pointer" }}><FileSpreadsheet size={14} />{ler.isPending ? "Lendo…" : "Enviar planilha preenchida"}
          <input type="file" accept=".xlsx" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) ler.mutate(f); e.target.value = ""; }} /></label>
      </div>
      <Erro e={ler.error} />
      {previa && <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13 }}><b>Prévia:</b> {previa.totais.diretrizes} diretriz(es), {previa.totais.objetivos} objetivo(s), {previa.totais.metas} meta(s)</div>
        {previa.erros.length > 0 && <div style={{ color: "#b91c1c", fontSize: 12, margin: "6px 0" }}><b>Erros (corrija na planilha):</b>{previa.erros.map((x, i) => <div key={i}>• {x}</div>)}</div>}
        {previa.avisos.length > 0 && <div style={{ color: "#92400e", fontSize: 12, margin: "6px 0" }}><b>Avisos:</b>{previa.avisos.map((x, i) => <div key={i}>• {x}</div>)}</div>}
        <Arvore diretrizes={previa.diretrizes} anos={plano.anos} ref_={ref_} />
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btn("#059669")} disabled={gravar.isPending || previa.erros.length > 0} onClick={() => { if (!tem || confirm("Substituir as metas atuais deste rascunho pela planilha?")) gravar.mutate(); }}>
            <CheckCircle2 size={14} />Confirmar e gravar</button>
          <button style={btn("#64748b")} onClick={() => setPrevia(null)}>Descartar</button>
        </div>
        {previa.erros.length > 0 && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>A gravação fica bloqueada enquanto houver erros.</div>}
        <Erro e={gravar.error} />
      </div>}
    </div>);
}

function anuais(m: Meta, anos: number[]): (number | null)[] {
  if (Array.isArray(m.metas_anuais)) return anos.map(a => (m.metas_anuais as MetaAnual[]).find(x => x.ano === a)?.meta_prevista ?? null);
  return anos.map(a => (m.metas_anuais as Record<string, number | null>)[String(a)] ?? null);
}

function Arvore({ diretrizes, anos, ref_ }: { diretrizes: Diretriz[]; anos: number[]; ref_: Ref }) {
  if (!diretrizes.length) return <div style={{ fontSize: 13, color: "#64748b" }}>Nenhuma meta cadastrada.</div>;
  return <>{diretrizes.map(d => (
    <div key={d.codigo} style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#1e3a8a" }}>Diretriz {d.codigo} — {d.descricao}</div>
      {d.objetivos.map(o => (
        <div key={o.codigo} style={{ margin: "6px 0 0 12px" }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Objetivo {o.codigo} — {o.descricao}</div>
          <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", minWidth: 900 }}>
            <thead><tr style={{ textAlign: "left", color: "#64748b" }}><th>Meta</th><th>Indicador</th><th>Tipo</th><th>Linha de base</th><th>Meta 4 anos</th>
              {anos.map(a => <th key={a}>{a}</th>)}<th>Fonte</th><th>Setor</th><th>Ações</th></tr></thead>
            <tbody>{o.metas.map(m => (
              <tr key={m.codigo} style={{ borderTop: "1px solid #eee", verticalAlign: "top" }}>
                <td style={{ padding: "5px 4px", maxWidth: 260 }}><b>{m.codigo}</b> {m.descricao}</td>
                <td>{m.indicador ?? "—"}{m.unidade ? ` (${m.unidade})` : ""}</td>
                <td title={m.tipo_indicador ? ref_.tipos_indicador[m.tipo_indicador] : "Não informado"}>{m.tipo_indicador ?? <span style={{ color: "#d97706" }}>não informado</span>}</td>
                <td>{num(m.linha_base)}{m.ano_linha_base ? ` (${m.ano_linha_base})` : ""}</td><td>{num(m.meta_quadrienal)}</td>
                {anuais(m, anos).map((v, i) => <td key={i}>{num(v)}</td>)}
                <td>{m.fonte ?? "—"}</td><td>{m.setor_responsavel ?? "—"}</td>
                <td>{m.acoes ?? "—"}</td>
              </tr>))}</tbody></table></div>
        </div>))}
    </div>))}</>;
}

function AbaPms({ ref_, planoId, setPlanoId }: { ref_: Ref; planoId: number | null; setPlanoId: (n: number) => void }) {
  const qc = useQueryClient();
  const planos = useQuery({ queryKey: ["pms", "planos"], queryFn: () => api.get("/api/pms-vivo/planos").then(r => r.data as Plano[]) });
  const det = useQuery({ queryKey: ["pms", "plano", planoId], enabled: !!planoId, queryFn: () => api.get(`/api/pms-vivo/planos/${planoId}`).then(r => r.data as PlanoDet) });
  const [novo, setNovo] = useState({ titulo: "", vigencia_inicio: new Date().getFullYear() });
  const criar = useMutation({ mutationFn: () => api.post("/api/pms-vivo/planos", novo).then(r => r.data as Plano),
    onSuccess: p => { qc.invalidateQueries({ queryKey: ["pms"] }); setPlanoId(p.id); } });
  const [resolucao, setResolucao] = useState("");
  const aprovar = useMutation({ mutationFn: () => api.post(`/api/pms-vivo/planos/${planoId}/aprovar`, { resolucao_cms: resolucao }),
    onSuccess: () => { setResolucao(""); qc.invalidateQueries({ queryKey: ["pms"] }); } });
  const [motivo, setMotivo] = useState("");
  const versao = useMutation({ mutationFn: () => api.post(`/api/pms-vivo/planos/${planoId}/nova-versao`, { motivo }).then(r => r.data as Plano),
    onSuccess: p => { setMotivo(""); qc.invalidateQueries({ queryKey: ["pms"] }); setPlanoId(p.id); } });
  const [pdf, setPdf] = useState<File | null>(null);
  const anexar = useMutation({ mutationFn: () => upload(`/api/pms-vivo/planos/${planoId}/documento`, pdf!), onSuccess: () => { setPdf(null); qc.invalidateQueries({ queryKey: ["pms"] }); } });
  const p = det.data;
  return (
    <>
      <div style={{ ...card, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
        <label style={{ ...lbl, marginBottom: 0, minWidth: 320 }}>Versão do PMS
          <select style={inp} value={planoId ?? ""} onChange={e => setPlanoId(Number(e.target.value))}>
            <option value="">Selecione…</option>
            {(planos.data ?? []).map(x => <option key={x.id} value={x.id}>{x.vigencia_inicio}–{x.vigencia_fim} · v{x.versao} · {ROT_PLANO[x.situacao]}</option>)}
          </select></label>
        {ref_.pode_planejar && <>
          <label style={{ ...lbl, marginBottom: 0, flex: 1, minWidth: 220 }}>Novo PMS — título<input style={inp} value={novo.titulo} onChange={e => setNovo({ ...novo, titulo: e.target.value })} placeholder="Plano Municipal de Saúde 2026–2029" /></label>
          <label style={{ ...lbl, marginBottom: 0, width: 110 }}>Início<input type="number" style={inp} value={novo.vigencia_inicio} onChange={e => setNovo({ ...novo, vigencia_inicio: Number(e.target.value) })} /></label>
          <button style={btn()} disabled={novo.titulo.length < 3 || criar.isPending} onClick={() => criar.mutate()}>Cadastrar PMS</button>
        </>}
        <Erro e={criar.error} />
      </div>
      {planos.isSuccess && planos.data.length === 0 && <div style={card}>Nenhum PMS cadastrado neste município.{!ref_.pode_planejar && " O cadastro é feito pela Coordenação de Planejamento."}</div>}
      {p && <>
        <div style={{ ...card, borderLeft: `4px solid ${COR_PLANO[p.situacao]}` }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <b style={{ fontSize: 16 }}>{p.titulo}</b><Selo t={`v${p.versao} · ${ROT_PLANO[p.situacao]}`} cor={COR_PLANO[p.situacao]} />
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
            Vigência {p.vigencia_inicio}–{p.vigencia_fim}
            {p.resolucao_cms && <> · {p.resolucao_cms}</>}{p.aprovado_por && <> · aprovado por {p.aprovado_por} em {dataBr(p.aprovado_em)}</>}
            {p.motivo_versao && <> · proposta: {p.motivo_versao}</>}
          </div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Documento oficial: {p.documentos.length ? p.documentos.map(d =>
            <a key={d.id} href="#" style={{ marginRight: 8 }} onClick={e => { e.preventDefault(); baixar(`/api/pms-vivo/anexos/${d.id}`, d.nome); }}><Paperclip size={12} /> {d.nome}</a>) : "não anexado"}</div>
          {ref_.pode_planejar && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
            <input type="file" accept=".pdf" style={{ fontSize: 12 }} onChange={e => setPdf(e.target.files?.[0] ?? null)} />
            {pdf && <button style={btn("#475569")} onClick={() => anexar.mutate()}><Upload size={14} />Anexar PDF do PMS</button>}
            {p.situacao === "rascunho" ? <>
              <input style={{ ...inp, width: 260 }} placeholder="Resolução do CMS que aprovou" value={resolucao} onChange={e => setResolucao(e.target.value)} />
              <button style={btn("#059669")} disabled={resolucao.length < 3} onClick={() => { if (confirm("Aprovar esta versão? Ela passa a ser a oficial e não poderá ser editada.")) aprovar.mutate(); }}>Aprovar versão</button>
            </> : p.situacao === "aprovado" && <>
              <input style={{ ...inp, width: 300 }} placeholder="Motivo da proposta de alteração" value={motivo} onChange={e => setMotivo(e.target.value)} />
              <button style={btn("#d97706")} disabled={motivo.length < 5} onClick={() => versao.mutate()}>Criar nova versão (proposta)</button>
            </>}
          </div>}
          <Erro e={aprovar.error} /><Erro e={versao.error} /><Erro e={anexar.error} />
        </div>
        {ref_.pode_planejar && p.situacao === "rascunho" && <Importacao plano={p} ref_={ref_} />}
        <div style={card}><h3 style={h3}>Diretrizes, objetivos e metas</h3><Arvore diretrizes={p.diretrizes} anos={p.anos} ref_={ref_} /></div>
      </>}
    </>);
}

// ── Execução: formulário e detalhe da ação ───────────────────────────────────
function InformarExecucao({ acao, ref_ }: { acao: Acao; ref_: Ref }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ situacao: acao.situacao === "nao_iniciada" ? "em_andamento" : acao.situacao, percentual_execucao: "", quantidade_realizada: "", resultado_alcancado: "", justificativa: "" });
  const [arq, setArq] = useState<File | null>(null);
  const enviar = useMutation({
    mutationFn: async () => {
      const u = (await api.post(`/api/pms-vivo/acoes/${acao.id}/atualizacoes`, {
        situacao: f.situacao, percentual_execucao: f.percentual_execucao === "" ? null : Number(f.percentual_execucao),
        quantidade_realizada: f.quantidade_realizada === "" ? null : Number(f.quantidade_realizada),
        resultado_alcancado: f.resultado_alcancado || null, justificativa: f.justificativa || null })).data as Atualizacao;
      if (arq) await upload(`/api/pms-vivo/acoes/${acao.id}/anexos`, arq, { atualizacao_id: String(u.id), descricao: "Evidência da execução" });
      return u;
    }, onSuccess: () => { setArq(null); qc.invalidateQueries({ queryKey: ["pms"] }); } });
  const exige = ref_.exige_justificativa.includes(f.situacao);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginTop: 8 }}>
      <label style={lbl}>Situação informada<select style={inp} value={f.situacao} onChange={e => setF({ ...f, situacao: e.target.value })}>
        {Object.entries(ref_.situacoes_acao).filter(([k]) => k !== "nao_iniciada").map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      <label style={lbl}>% de execução<input type="number" min={0} max={100} style={inp} value={f.percentual_execucao} onChange={e => setF({ ...f, percentual_execucao: e.target.value })} /></label>
      <label style={lbl}>Quantidade realizada{acao.quantidade_prevista != null ? ` (prevista ${num(acao.quantidade_prevista)})` : ""}<input type="number" min={0} style={inp} value={f.quantidade_realizada} onChange={e => setF({ ...f, quantidade_realizada: e.target.value })} /></label>
      <label style={lbl}>Resultado alcançado{f.situacao === "concluida" ? " *" : ""}<textarea style={{ ...inp, minHeight: 50 }} value={f.resultado_alcancado} onChange={e => setF({ ...f, resultado_alcancado: e.target.value })} /></label>
      <label style={lbl}>Justificativa{exige ? " *" : ""}<textarea style={{ ...inp, minHeight: 50 }} value={f.justificativa} onChange={e => setF({ ...f, justificativa: e.target.value })} /></label>
      <label style={lbl}>Evidência{acao.evidencia_esperada ? ` (esperada: ${acao.evidencia_esperada})` : ""}<input type="file" style={{ fontSize: 12 }} onChange={e => setArq(e.target.files?.[0] ?? null)} /></label>
      <div style={{ alignSelf: "end" }}><button style={btn()} disabled={enviar.isPending} onClick={() => enviar.mutate()}>Enviar para validação</button><Erro e={enviar.error} /></div>
    </div>);
}

function DetalheAcao({ id, ref_, onFechar }: { id: number; ref_: Ref; onFechar: () => void }) {
  const q = useQuery({ queryKey: ["pms", "acao", id], queryFn: () => api.get(`/api/pms-vivo/acoes/${id}`).then(r => r.data as AcaoDet) });
  const a = q.data;
  if (!a) return null;
  const pendente = a.atualizacoes.some(u => u.status === "pendente");
  return (
    <div style={{ ...card, borderLeft: `4px solid ${COR_SIT[a.situacao]}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div><b style={{ fontSize: 15 }}>{a.codigo} — {a.descricao}</b>
          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}><Selo t={`Oficial: ${a.situacao_rotulo}`} cor={COR_SIT[a.situacao]} />
            {a.atrasada && <Selo t="Atrasada" cor="#dc2626" />}{pendente && <Selo t="Aguardando validação" cor="#7c3aed" />}</div></div>
        <button style={btn("#64748b")} onClick={onFechar}>Fechar</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 6, fontSize: 12, marginTop: 8, color: "#334155" }}>
        <div><b>Metas do PMS:</b> {a.metas.map(m => `${m.codigo}`).join(", ")}</div>
        <div><b>Produto:</b> {a.produto ?? "—"} · <b>Qtd. prevista:</b> {num(a.quantidade_prevista)}</div>
        <div><b>Prazo:</b> {dataBr(a.prazo)} · <b>Exercício:</b> {a.exercicio}</div>
        <div><b>Setor:</b> {a.setor_responsavel ?? "—"} · <b>Responsável:</b> {a.responsavel_nome ?? "—"}</div>
        <div><b>Recursos:</b> {a.recursos ?? "—"} · <b>Financiamento:</b> {a.fonte_financiamento ?? "—"}</div>
        <div><b>Indicador de acompanhamento:</b> {a.indicador_acompanhamento ?? "—"}</div>
        <div><b>Execução física validada:</b> {num(a.percentual_execucao)}% · qtd. {num(a.quantidade_realizada)}</div>
        <div><b>Resultado:</b> {a.resultado_alcancado ?? "—"}</div>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, display: "flex", gap: 6 }}><Info size={13} />Esta é a execução física da ação. O cumprimento da meta e o desempenho do indicador são acompanhados no monitoramento das metas.</div>
      {a.pode_atualizar && !pendente && !["cancelada", "nao_executada", "parcial", "concluida"].includes(a.situacao) && <InformarExecucao acao={a} ref_={ref_} />}
      {a.pode_atualizar && ["nao_executada", "parcial"].includes(a.situacao) && <Reprogramar acao={a} />}
      <h4 style={{ margin: "12px 0 4px", fontSize: 13, color: "#1f2937" }}>Atualizações</h4>
      {a.atualizacoes.length === 0 && <div style={{ fontSize: 12, color: "#64748b" }}>Nenhuma.</div>}
      {a.atualizacoes.map(u => <div key={u.id} style={{ fontSize: 12, padding: "4px 0", borderTop: "1px solid #f1f1f1" }}>
        <b>{u.situacao_rotulo}</b> — {u.status === "pendente" ? "aguardando validação" : u.status === "validada" ? `validada por ${u.validado_por}` : `devolvida por ${u.validado_por}`}
        {" "}· informado por {u.informado_por} em {dataBr(u.informado_em)}{u.resultado_alcancado && <> · {u.resultado_alcancado}</>}{u.justificativa && <> · justificativa: {u.justificativa}</>}{u.parecer && <> · parecer: {u.parecer}</>}
      </div>)}
      <h4 style={{ margin: "12px 0 4px", fontSize: 13, color: "#1f2937" }}>Evidências</h4>
      {a.anexos.length === 0 ? <div style={{ fontSize: 12, color: "#64748b" }}>Nenhuma.</div> : a.anexos.map(x =>
        <div key={x.id} style={{ fontSize: 12 }}><a href="#" onClick={e => { e.preventDefault(); baixar(`/api/pms-vivo/anexos/${x.id}`, x.nome); }}>{x.nome}</a> · {x.enviado_por} · {dataBr(x.enviado_em)}</div>)}
      <h4 style={{ margin: "12px 0 4px", fontSize: 13, color: "#1f2937" }}>Histórico</h4>
      <div style={{ maxHeight: 180, overflowY: "auto" }}>{a.historico.map((h, i) => <div key={i} style={{ fontSize: 11, padding: "2px 0" }}><b>{dataBr(h.criado_em)}</b> · {h.usuario ?? "sistema"} · {h.descricao}</div>)}</div>
    </div>);
}

// ── Aba PAS e ações ──────────────────────────────────────────────────────────
const ACAO_VAZIA = { codigo: "", descricao: "", meta_ids: [] as number[], produto: "", quantidade_prevista: "", prazo: "", setor_responsavel: "",
  responsavel_usuario_id: "", recursos: "", fonte_financiamento: "", indicador_acompanhamento: "", evidencia_esperada: "" };

function AbaPas({ ref_, planoId }: { ref_: Ref; planoId: number | null }) {
  const qc = useQueryClient();
  const plano = useQuery({ queryKey: ["pms", "plano", planoId], enabled: !!planoId, queryFn: () => api.get(`/api/pms-vivo/planos/${planoId}`).then(r => r.data as PlanoDet) });
  const pass = useQuery({ queryKey: ["pms", "pas", planoId], enabled: !!planoId, queryFn: () => api.get(`/api/pms-vivo/planos/${planoId}/pas`).then(r => r.data as Pas[]) });
  const resp = useQuery({ queryKey: ["pms", "resp"], queryFn: () => api.get("/api/pms-vivo/responsaveis").then(r => r.data as { id: number; nome: string; perfil: string }[]) });
  const [pasId, setPasId] = useState<number | null>(null);
  useEffect(() => { if (pass.data?.length && !pass.data.some(p => p.id === pasId)) setPasId(pass.data[pass.data.length - 1].id); }, [pass.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const [filtro, setFiltro] = useState({ setor: "", situacao: "" });
  const acoes = useQuery({ queryKey: ["pms", "acoes", pasId, filtro], enabled: !!pasId,
    queryFn: () => api.get(`/api/pms-vivo/pas/${pasId}/acoes`, { params: { setor: filtro.setor || undefined, situacao: filtro.situacao || undefined } }).then(r => r.data as Acao[]) });
  const [exercicio, setExercicio] = useState("");
  const criarPas = useMutation({ mutationFn: () => api.post(`/api/pms-vivo/planos/${planoId}/pas`, { exercicio: Number(exercicio) }).then(r => r.data as Pas),
    onSuccess: x => { qc.invalidateQueries({ queryKey: ["pms"] }); setPasId(x.id); } });
  const [resPas, setResPas] = useState("");
  const aprovarPas = useMutation({ mutationFn: () => api.post(`/api/pms-vivo/pas/${pasId}/aprovar`, { resolucao_cms: resPas }), onSuccess: () => qc.invalidateQueries({ queryKey: ["pms"] }) });
  const [f, setF] = useState({ ...ACAO_VAZIA });
  const criarAcao = useMutation({
    mutationFn: () => api.post(`/api/pms-vivo/pas/${pasId}/acoes`, Object.fromEntries(Object.entries(f).map(([k, v]) =>
      [k, v === "" ? null : (k === "quantidade_prevista" || k === "responsavel_usuario_id") ? Number(v) : v]))),
    onSuccess: () => { setF({ ...ACAO_VAZIA }); qc.invalidateQueries({ queryKey: ["pms"] }); } });
  const [aberta, setAberta] = useState<number | null>(null);
  const metas = useMemo(() => (plano.data?.diretrizes ?? []).flatMap(d => d.objetivos.flatMap(o => o.metas)), [plano.data]);
  const pas = pass.data?.find(x => x.id === pasId);
  const setores = useMemo(() => Array.from(new Set((acoes.data ?? []).map(a => a.setor_responsavel).filter(Boolean))) as string[], [acoes.data]);

  if (!planoId) return <div style={card}>Selecione uma versão do PMS na aba "Plano (PMS)".</div>;
  const c = (k: keyof typeof ACAO_VAZIA, rot: string, tipo = "text") => <label style={lbl}>{rot}{tipo === "area"
    ? <textarea style={{ ...inp, minHeight: 46 }} value={String(f[k])} onChange={e => setF({ ...f, [k]: e.target.value })} />
    : <input type={tipo} style={inp} value={String(f[k])} onChange={e => setF({ ...f, [k]: e.target.value })} />}</label>;
  return (
    <>
      <div style={{ ...card, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
        <label style={{ ...lbl, marginBottom: 0, width: 220 }}>Programação Anual (PAS)<select style={inp} value={pasId ?? ""} onChange={e => setPasId(Number(e.target.value))}>
          <option value="">—</option>{(pass.data ?? []).map(x => <option key={x.id} value={x.id}>PAS {x.exercicio} · {x.situacao === "aprovada" ? "aprovada" : "rascunho"}</option>)}</select></label>
        {ref_.pode_planejar && plano.data?.situacao === "aprovado" && <>
          <label style={{ ...lbl, marginBottom: 0, width: 120 }}>Novo exercício<select style={inp} value={exercicio} onChange={e => setExercicio(e.target.value)}>
            <option value="">—</option>{plano.data.anos.map(a => <option key={a} value={a}>{a}</option>)}</select></label>
          <button style={btn()} disabled={!exercicio} onClick={() => criarPas.mutate()}>Criar PAS</button></>}
        {plano.data && plano.data.situacao !== "aprovado" && <div style={{ fontSize: 12, color: "#92400e" }}>A PAS é vinculada a uma versão aprovada do PMS.</div>}
        {pas && ref_.pode_planejar && pas.situacao === "rascunho" && <>
          <input style={{ ...inp, width: 240 }} placeholder="Resolução do CMS que aprovou a PAS" value={resPas} onChange={e => setResPas(e.target.value)} />
          <button style={btn("#059669")} disabled={resPas.length < 3} onClick={() => aprovarPas.mutate()}>Aprovar PAS</button></>}
        {pas?.resolucao_cms && <span style={{ fontSize: 12, color: "#475569" }}>{pas.resolucao_cms}</span>}
        <Erro e={criarPas.error} /><Erro e={aprovarPas.error} />
      </div>
      {pas && ref_.pode_planejar && (
        <div style={card}><h3 style={h3}>Nova ação da PAS {pas.exercicio}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
            {c("codigo", "Código *")}{c("descricao", "Descrição da ação *", "area")}{c("produto", "Produto / entrega")}
            {c("quantidade_prevista", "Quantidade prevista", "number")}{c("prazo", "Prazo", "date")}{c("setor_responsavel", "Setor responsável")}
            <label style={lbl}>Responsável (usuário)<select style={inp} value={f.responsavel_usuario_id} onChange={e => setF({ ...f, responsavel_usuario_id: e.target.value })}>
              <option value="">—</option>{(resp.data ?? []).map(u => <option key={u.id} value={u.id}>{u.nome} ({u.perfil})</option>)}</select></label>
            {c("recursos", "Recursos necessários", "area")}{c("fonte_financiamento", "Fonte de financiamento")}
            {c("indicador_acompanhamento", "Indicador de acompanhamento")}{c("evidencia_esperada", "Evidência esperada", "area")}
            <label style={lbl}>Metas do PMS * (uma ou mais)<select multiple style={{ ...inp, minHeight: 90 }} value={f.meta_ids.map(String)}
              onChange={e => setF({ ...f, meta_ids: Array.from(e.target.selectedOptions).map(o => Number(o.value)) })}>
              {metas.map(m => <option key={m.id} value={m.id}>{m.codigo} — {m.descricao.slice(0, 80)}</option>)}</select></label>
          </div>
          <button style={btn()} disabled={!f.codigo || f.descricao.length < 3 || !f.meta_ids.length || criarAcao.isPending} onClick={() => criarAcao.mutate()}>Incluir ação</button>
          <Erro e={criarAcao.error} />
        </div>)}
      {aberta && <DetalheAcao id={aberta} ref_={ref_} onFechar={() => setAberta(null)} />}
      {pas && <div style={card}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <select style={{ ...inp, width: 200 }} value={filtro.setor} onChange={e => setFiltro({ ...filtro, setor: e.target.value })}><option value="">Todos os setores</option>{setores.map(s => <option key={s}>{s}</option>)}</select>
          <select style={{ ...inp, width: 200 }} value={filtro.situacao} onChange={e => setFiltro({ ...filtro, situacao: e.target.value })}><option value="">Todas as situações</option>{Object.entries(ref_.situacoes_acao).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </div>
        <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", minWidth: 800 }}>
          <thead><tr style={{ textAlign: "left", color: "#64748b" }}><th>Ação</th><th>Metas</th><th>Produto</th><th>Prazo</th><th>Responsável</th><th>Situação oficial</th></tr></thead>
          <tbody>{(acoes.data ?? []).map(a => (
            <tr key={a.id} onClick={() => setAberta(a.id)} style={{ borderTop: "1px solid #eee", cursor: "pointer", verticalAlign: "top", background: aberta === a.id ? "#f8fafc" : undefined }}>
              <td style={{ padding: "6px 4px" }}><b>{a.codigo}</b> {a.descricao}</td><td>{a.metas.map(m => m.codigo).join(", ")}</td>
              <td>{a.produto ?? "—"}{a.quantidade_prevista != null && ` (${num(a.quantidade_prevista)})`}</td>
              <td style={{ color: a.atrasada ? "#dc2626" : undefined }}>{dataBr(a.prazo)}{a.atrasada && " · atrasada"}</td>
              <td>{a.responsavel_nome ?? "—"}<div style={{ color: "#64748b" }}>{a.setor_responsavel}</div></td>
              <td><Selo t={a.situacao_rotulo} cor={COR_SIT[a.situacao]} />{a.aguardando_validacao && <div style={{ color: "#7c3aed", marginTop: 2 }}>aguardando validação</div>}</td>
            </tr>))}</tbody></table></div>
        {(acoes.data ?? []).length === 0 && <div style={{ fontSize: 13, color: "#64748b", padding: 8 }}>Nenhuma ação.</div>}
      </div>}
    </>);
}

// ── Minhas Ações ─────────────────────────────────────────────────────────────
function MinhasAcoes({ ref_ }: { ref_: Ref }) {
  const q = useQuery({ queryKey: ["pms", "minhas"], queryFn: () => api.get("/api/pms-vivo/minhas-acoes").then(r => r.data as { acoes: Acao[]; resumo: Record<string, number> }) });
  const [aberta, setAberta] = useState<number | null>(null);
  if (!q.data) return null;
  const r = q.data.resumo;
  const cards: [string, string, string][] = [["total", "Minhas ações", "#1d4ed8"], ["atrasadas", "Atrasadas", "#dc2626"], ["prazo_proximo", "Prazo em até 15 dias", "#d97706"],
    ["aguardando_validacao", "Aguardando validação", "#7c3aed"], ["devolvidas", "Devolvidas", "#b91c1c"], ["evidencias_pendentes", "Evidências a apresentar", "#0f766e"]];
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 12 }}>
        {cards.map(([k, t, cor]) => <div key={k} style={{ ...card, marginBottom: 0, borderTop: `3px solid ${cor}`, padding: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b" }}>{t}</div><div style={{ fontSize: 24, fontWeight: 700, color: cor }}>{r[k] ?? 0}</div></div>)}
      </div>
      {aberta && <DetalheAcao id={aberta} ref_={ref_} onFechar={() => setAberta(null)} />}
      <div style={card}>
        {q.data.acoes.length === 0 && <div style={{ fontSize: 13, color: "#64748b" }}>Nenhuma ação sob sua responsabilidade.</div>}
        {q.data.acoes.map(a => (
          <div key={a.id} onClick={() => setAberta(a.id)} style={{ padding: "8px 0", borderTop: "1px solid #f1f1f1", cursor: "pointer" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "baseline", flexWrap: "wrap" }}>
              <Selo t={a.situacao_rotulo} cor={COR_SIT[a.situacao]} /><b style={{ fontSize: 13 }}>{a.codigo} {a.descricao}</b>
              {a.atrasada && <Selo t="Atrasada" cor="#dc2626" />}{a.prazo_proximo && <Selo t="Prazo próximo" cor="#d97706" />}
              {a.aguardando_validacao && <Selo t="Aguardando validação" cor="#7c3aed" />}{a.devolvida && <Selo t="Devolvida" cor="#b91c1c" />}
              {a.evidencia_pendente && <Selo t="Evidência a apresentar" cor="#0f766e" />}
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>PAS {a.exercicio} · prazo {dataBr(a.prazo)} · metas {a.metas.map(m => m.codigo).join(", ")}
              {a.produto && <> · entrega: {a.produto}</>}{a.evidencia_esperada && <> · evidência: {a.evidencia_esperada}</>}</div>
            {a.devolvida && a.parecer && <div style={{ fontSize: 12, color: "#b91c1c" }}>Motivo da devolução: {a.parecer}</div>}
          </div>))}
      </div>
    </>);
}

// ── Validações ───────────────────────────────────────────────────────────────
function Validacoes({ ref_ }: { ref_: Ref }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["pms", "validacoes"], queryFn: () => api.get("/api/pms-vivo/validacoes-pendentes").then(r => r.data as (Atualizacao & { acao: { id: number; codigo: string; descricao: string; evidencia_esperada: string | null; tem_evidencia: boolean }; pode_validar: boolean })[]) });
  const [parecer, setParecer] = useState<Record<number, string>>({});
  const [aberta, setAberta] = useState<number | null>(null);
  const decidir = useMutation({ mutationFn: ({ id, decisao }: { id: number; decisao: string }) => api.post(`/api/pms-vivo/atualizacoes/${id}/validar`, { decisao, parecer: parecer[id] || null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pms"] }) });
  return (
    <>
      {aberta && <DetalheAcao id={aberta} ref_={ref_} onFechar={() => setAberta(null)} />}
      <div style={card}>
        <h3 style={h3}>Execuções aguardando validação</h3>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>A situação oficial da ação só muda depois da validação, feita por pessoa diferente de quem informou. Conclusão exige a evidência esperada; cancelamento, autorização do Secretário ou da Coordenação de Planejamento.</div>
        {(q.data ?? []).length === 0 && <div style={{ fontSize: 13, color: "#64748b" }}>Nenhuma pendência.</div>}
        <Erro e={decidir.error} />
        {(q.data ?? []).map(u => (
          <div key={u.id} style={{ padding: "8px 0", borderTop: "1px solid #f1f1f1", fontSize: 13 }}>
            <a href="#" onClick={e => { e.preventDefault(); setAberta(u.acao.id); }}><b>{u.acao.codigo}</b> {u.acao.descricao}</a>
            <div style={{ fontSize: 12, color: "#475569" }}>Informado: <b>{u.situacao_rotulo}</b> por {u.informado_por} em {dataBr(u.informado_em)}
              {u.percentual_execucao != null && <> · {num(u.percentual_execucao)}%</>}{u.quantidade_realizada != null && <> · qtd. {num(u.quantidade_realizada)}</>}
              {u.resultado_alcancado && <> · {u.resultado_alcancado}</>}{u.justificativa && <> · justificativa: {u.justificativa}</>}</div>
            {u.acao.evidencia_esperada && <div style={{ fontSize: 12, color: u.acao.tem_evidencia ? "#059669" : "#b91c1c" }}>
              {u.acao.tem_evidencia ? "Evidência anexada" : "Evidência esperada não anexada"}: {u.acao.evidencia_esperada}</div>}
            {u.pode_validar ? <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <input style={{ ...inp, maxWidth: 360 }} placeholder="Parecer (obrigatório para devolver)" value={parecer[u.id] ?? ""} onChange={e => setParecer({ ...parecer, [u.id]: e.target.value })} />
              <button style={btn("#059669")} onClick={() => decidir.mutate({ id: u.id, decisao: "validar" })}><CheckCircle2 size={14} />Validar</button>
              <button style={btn("#b91c1c")} onClick={() => decidir.mutate({ id: u.id, decisao: "devolver" })}><XCircle size={14} />Devolver</button>
            </div> : <div style={{ fontSize: 12, color: "#64748b" }}>{ref_.pode_validar ? "Você informou esta execução: outra pessoa deve validar." : "Seu perfil não valida execuções."}</div>}
          </div>))}
      </div>
    </>);
}

// ══ Entrega 2 — monitoramento ══════════════════════════════════════════════
interface AnoMon { ano: number; meta_prevista: number | null; resultado: number | null; fonte: string | null; competencia: string | null;
  registrado_por: string | null; cumprimento: number | null; situacao: string }
interface MetaMon extends Meta { diretriz: string | null; diretriz_id: number | null; anos: AnoMon[]; situacao: string | null; cumprimento: number | null;
  acumulado: { valor: number | null; regra: string }; cumprimento_quadrienal: number | null; tendencia: string | null;
  acoes_no_ano: number; acoes_com_problema: number; fonte_automatica: string | null }
interface Alerta { severidade: string; tipo: string; texto: string; acao_id: number | null; meta_id: number | null; responsavel: string | null }
const COR_META: Record<string, string> = { alcancada: "#059669", nao_alcancada: "#dc2626", em_risco: "#d97706", em_acompanhamento: "#2563eb",
  sem_resultado: "#94a3b8", prevista: "#64748b" };
const ROT_META: Record<string, string> = { alcancada: "Alcançada", nao_alcancada: "Não alcançada", em_risco: "Em risco",
  em_acompanhamento: "Em acompanhamento", sem_resultado: "Sem resultado", prevista: "Prevista" };
const COR_SEV: Record<string, string> = { critico: "#dc2626", atencao: "#d97706", info: "#2563eb" };
const TEND: Record<string, string> = { melhora: "↗ melhora", piora: "↘ piora", estavel: "→ estável" };
const ANO_ATUAL = new Date().getFullYear();

function Kpi({ t, v, cor }: { t: string; v: number | string | null; cor: string }) {
  return <div style={{ ...card, marginBottom: 0, borderTop: `3px solid ${cor}`, padding: 12 }}>
    <div style={{ fontSize: 11, color: "#64748b" }}>{t}</div><div style={{ fontSize: 22, fontWeight: 700, color: cor }}>{v ?? "—"}</div></div>;
}

function PainelGestor({ planoId, ano }: { planoId: number; ano: number }) {
  const resp = useQuery({ queryKey: ["pms", "resp"], queryFn: () => api.get("/api/pms-vivo/responsaveis").then(r => r.data as { id: number; nome: string }[]) });
  const plano = useQuery({ queryKey: ["pms", "plano", planoId], queryFn: () => api.get(`/api/pms-vivo/planos/${planoId}`).then(r => r.data as PlanoDet) });
  const [f, setF] = useState({ diretriz_id: "", setor: "", responsavel_usuario_id: "", situacao: "" });
  const q = useQuery({ queryKey: ["pms", "painel", planoId, ano, f], queryFn: () => api.get(`/api/pms-vivo/planos/${planoId}/painel`, {
    params: { ano, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)) } }).then(r => r.data) });
  const p = q.data;
  return (
    <>
      <div style={{ ...card, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select style={{ ...inp, width: 260 }} value={f.diretriz_id} onChange={e => setF({ ...f, diretriz_id: e.target.value })}>
          <option value="">Todas as diretrizes</option>{(plano.data?.diretrizes ?? []).map(d => <option key={d.id} value={d.id}>{d.codigo} — {d.descricao.slice(0, 50)}</option>)}</select>
        <select style={{ ...inp, width: 200 }} value={f.setor} onChange={e => setF({ ...f, setor: e.target.value })}>
          <option value="">Todos os setores</option>{(p?.setores ?? []).map((s: string) => <option key={s}>{s}</option>)}</select>
        <select style={{ ...inp, width: 200 }} value={f.responsavel_usuario_id} onChange={e => setF({ ...f, responsavel_usuario_id: e.target.value })}>
          <option value="">Todos os responsáveis</option>{(resp.data ?? []).map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}</select>
        <select style={{ ...inp, width: 200 }} value={f.situacao} onChange={e => setF({ ...f, situacao: e.target.value })}>
          <option value="">Todas as situações</option><option value="atrasada">Atrasadas</option><option value="aguardando_validacao">Aguardando validação</option>
          <option value="concluida">Concluídas</option><option value="nao_executada">Não executadas</option><option value="em_andamento">Em andamento</option></select>
      </div>
      {p && <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginBottom: 12 }}>
          <Kpi t="Metas do PMS" v={p.metas.total} cor="#1d4ed8" /><Kpi t="Metas alcançadas" v={p.metas.alcancada} cor="#059669" />
          <Kpi t="Metas em risco" v={p.metas.em_risco} cor="#d97706" /><Kpi t="Não alcançadas" v={p.metas.nao_alcancada} cor="#dc2626" />
          <Kpi t="Sem resultado" v={p.metas.sem_resultado + p.metas.em_acompanhamento} cor="#94a3b8" />
          <Kpi t="Ações concluídas" v={`${p.acoes.concluidas}/${p.acoes.total}`} cor="#059669" /><Kpi t="Ações atrasadas" v={p.acoes.atrasadas} cor="#dc2626" />
          <Kpi t="Não executadas" v={p.acoes.nao_executadas} cor="#b91c1c" /><Kpi t="Aguardando validação" v={p.acoes.aguardando_validacao} cor="#7c3aed" />
          <Kpi t="Reprogramação proposta" v={p.acoes.reprogramacao_proposta ?? "entrega 3"} cor="#64748b" />
        </div>
        <div style={card}><h3 style={h3}>Resultados por área (diretriz)</h3>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}><thead><tr style={{ textAlign: "left", color: "#64748b" }}><th>Diretriz</th><th>Metas</th><th>Ações</th></tr></thead>
            <tbody>{p.por_area.map((a: { diretriz: string; metas: Record<string, number>; acoes: Record<string, number> }, i: number) => (
              <tr key={i} style={{ borderTop: "1px solid #eee", verticalAlign: "top" }}><td style={{ padding: "5px 4px" }}>{a.diretriz}</td>
                <td>{Object.entries(a.metas).map(([k, v]) => <div key={k} style={{ color: COR_META[k] }}>{ROT_META[k]}: {v}</div>)}</td>
                <td>{Object.entries(a.acoes).map(([k, v]) => <div key={k}>{k.replace("_", " ")}: {v}</div>)}{!Object.keys(a.acoes).length && "—"}</td></tr>))}</tbody></table></div>
        <div style={card}><h3 style={h3}>Responsáveis com atualizações pendentes</h3>
          {p.responsaveis_pendentes.length === 0 ? <div style={{ fontSize: 13, color: "#64748b" }}>Nenhum.</div> :
            p.responsaveis_pendentes.map((r: { responsavel: string; pendencias: number; tipos: string[] }) => <div key={r.responsavel} style={{ fontSize: 13, padding: "3px 0" }}>
              <b>{r.responsavel}</b>: {r.pendencias} pendência(s) — {r.tipos.join(", ").replace(/_/g, " ")}</div>)}</div>
        <div style={card}><h3 style={h3}>Metas em risco ou não alcançadas</h3>
          {p.metas_em_risco.length === 0 ? <div style={{ fontSize: 13, color: "#64748b" }}>Nenhuma com resultado registrado.</div> :
            p.metas_em_risco.map((m: MetaMon) => <div key={m.id} style={{ fontSize: 13, padding: "3px 0" }}><Selo t={ROT_META[m.situacao!]} cor={COR_META[m.situacao!]} /> <b>{m.codigo}</b> {m.descricao}
              {m.cumprimento != null && ` — ${num(m.cumprimento)}% da meta anual`}</div>)}</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>{p.nota}</div>
      </>}
    </>);
}

function Metas({ planoId, ano, ref_ }: { planoId: number; ano: number; ref_: Ref }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["pms", "mon", planoId, ano], queryFn: () => api.get(`/api/pms-vivo/planos/${planoId}/monitoramento`, { params: { ano } }).then(r => r.data as {
    anos: number[]; metas: MetaMon[]; fontes_automaticas: Record<string, { rotulo: string; tipo: string }>; plano: Plano }) });
  const [ed, setEd] = useState<{ meta: number; ano: number; resultado: string; fonte: string; competencia: string } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const salvar = useMutation({ mutationFn: () => api.put(`/api/pms-vivo/metas/${ed!.meta}/resultados/${ed!.ano}`, {
    resultado: ed!.resultado === "" ? null : Number(ed!.resultado.replace(",", ".")), fonte: ed!.fonte || null, competencia: ed!.competencia || null,
    observacao: ed!.resultado === "" ? "Resultado removido pelo técnico" : null }), onSuccess: () => { setEd(null); qc.invalidateQueries({ queryKey: ["pms"] }); } });
  const coletar = useMutation({ mutationFn: ({ meta, a }: { meta: number; a: number }) => api.post(`/api/pms-vivo/metas/${meta}/resultados/${a}/coletar`).then(r => r.data),
    onSuccess: r => { setMsg(r.ok ? `Resultado coletado: ${num(r.resultado)} (${r.fonte}, ${r.competencia}).` : `Sem dado na fonte: ${r.motivo}`); qc.invalidateQueries({ queryKey: ["pms"] }); } });
  const fonte = useMutation({ mutationFn: ({ meta, codigo }: { meta: number; codigo: string }) => api.put(`/api/pms-vivo/metas/${meta}/fonte-automatica`, { fonte_automatica: codigo || null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pms"] }) });
  const d = q.data;
  if (!d) return null;
  const aprovado = d.plano.situacao === "aprovado";
  return (
    <div style={card}>
      <h3 style={h3}>Metas — previsto × resultado ({d.anos[0]}–{d.anos[d.anos.length - 1]})</h3>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Situação no ano {ano}. Resultado só com fonte; percentuais, taxas e índices não são somados entre anos. Clique numa célula de ano para registrar o resultado.</div>
      {msg && <div style={{ fontSize: 12, color: "#1e40af", marginBottom: 6 }}>{msg}</div>}<Erro e={salvar.error} /><Erro e={coletar.error} /><Erro e={fonte.error} />
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", minWidth: 1000 }}>
        <thead><tr style={{ textAlign: "left", color: "#64748b" }}><th>Meta</th><th>Tipo</th>{d.anos.map(a => <th key={a}>{a}<div style={{ fontWeight: 400 }}>meta → resultado</div></th>)}
          <th>Acumulado / último</th><th>Meta 4 anos</th><th>Tendência</th><th>Situação {ano}</th><th>Fonte automática</th></tr></thead>
        <tbody>{d.metas.map(m => (
          <tr key={m.id} style={{ borderTop: "1px solid #eee", verticalAlign: "top" }}>
            <td style={{ padding: "5px 4px", maxWidth: 240 }}><b>{m.codigo}</b> {m.descricao}<div style={{ color: "#64748b" }}>{m.indicador}</div></td>
            <td>{m.tipo_indicador ?? <span style={{ color: "#d97706" }}>não informado</span>}</td>
            {m.anos.map(a => <td key={a.ano} title={a.fonte ? `${a.fonte}${a.competencia ? " · " + a.competencia : ""} · ${a.registrado_por}` : "Sem resultado"}
              onClick={() => aprovado && ref_.pode_validar && setEd({ meta: m.id, ano: a.ano, resultado: a.resultado == null ? "" : String(a.resultado), fonte: a.fonte ?? "", competencia: a.competencia ?? "" })}
              style={{ cursor: aprovado && ref_.pode_validar ? "pointer" : undefined }}>
              {num(a.meta_prevista)} → <b style={{ color: COR_META[a.situacao] }}>{num(a.resultado)}</b>{a.cumprimento != null && <div style={{ color: "#64748b" }}>{num(a.cumprimento)}%</div>}
              {m.fonte_automatica && ref_.pode_validar && aprovado && a.ano <= ANO_ATUAL && <button style={{ ...btn("#0f766e"), padding: "1px 6px", fontSize: 10, marginTop: 2 }}
                onClick={e => { e.stopPropagation(); coletar.mutate({ meta: m.id, a: a.ano }); }}>coletar</button>}</td>)}
            <td title={m.acumulado.regra}>{num(m.acumulado.valor)}<div style={{ color: "#64748b", fontSize: 10 }}>{m.acumulado.regra}</div></td>
            <td>{num(m.meta_quadrienal)}{m.cumprimento_quadrienal != null && <div style={{ color: "#64748b" }}>{num(m.cumprimento_quadrienal)}%</div>}</td>
            <td>{m.tendencia ? TEND[m.tendencia] : "—"}</td>
            <td>{m.situacao ? <Selo t={ROT_META[m.situacao]} cor={COR_META[m.situacao]} /> : "—"}{m.acoes_com_problema > 0 && <div style={{ color: "#b91c1c" }}>{m.acoes_com_problema} ação(ões) com problema</div>}</td>
            <td>{ref_.pode_planejar ? <select style={{ ...inp, width: 150, fontSize: 11 }} value={m.fonte_automatica ?? ""} onChange={e => fonte.mutate({ meta: m.id, codigo: e.target.value })}>
              <option value="">Manual</option>{Object.entries(d.fontes_automaticas).map(([k, v]) => <option key={k} value={k} title={v.rotulo}>{v.rotulo.slice(0, 40)}</option>)}</select>
              : (m.fonte_automatica ? d.fontes_automaticas[m.fonte_automatica]?.rotulo : "Manual")}</td>
          </tr>))}</tbody></table></div>
      {ed && <div style={{ ...card, background: "#f8fafc", marginTop: 10 }}>
        <b style={{ fontSize: 13 }}>Resultado {ed.ano} — meta {d.metas.find(m => m.id === ed.meta)?.codigo}</b>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          <input style={{ ...inp, width: 120 }} placeholder="Resultado" value={ed.resultado} onChange={e => setEd({ ...ed, resultado: e.target.value })} />
          <input style={{ ...inp, width: 260 }} placeholder="Fonte (obrigatória)" value={ed.fonte} onChange={e => setEd({ ...ed, fonte: e.target.value })} />
          <input style={{ ...inp, width: 160 }} placeholder="Competência" value={ed.competencia} onChange={e => setEd({ ...ed, competencia: e.target.value })} />
          <button style={btn()} onClick={() => salvar.mutate()}>Salvar</button><button style={btn("#64748b")} onClick={() => setEd(null)}>Cancelar</button>
        </div></div>}
    </div>);
}

function Kanban({ planoId, ano, ref_ }: { planoId: number; ano: number; ref_: Ref }) {
  const q = useQuery({ queryKey: ["pms", "kanban", planoId, ano], queryFn: () => api.get(`/api/pms-vivo/planos/${planoId}/kanban`, { params: { ano } }).then(r => r.data as {
    colunas: { id: string; titulo: string; acoes: Acao[] }[]; nota: string }) });
  const [aberta, setAberta] = useState<number | null>(null);
  const cor: Record<string, string> = { nao_iniciada: "#64748b", em_andamento: "#2563eb", atrasada: "#dc2626", aguardando_validacao: "#7c3aed", concluida: "#059669", encerrada: "#475569" };
  return (
    <>
      {aberta && <DetalheAcao id={aberta} ref_={ref_} onFechar={() => setAberta(null)} />}
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{q.data?.nota}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8 }}>
        {(q.data?.colunas ?? []).map(col => (
          <div key={col.id} style={{ background: "#f1f5f9", borderRadius: 8, padding: 8, borderTop: `3px solid ${cor[col.id]}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: cor[col.id], marginBottom: 6 }}>{col.titulo} ({col.acoes.length})</div>
            {col.acoes.map(a => <div key={a.id} onClick={() => setAberta(a.id)} style={{ ...card, padding: 8, marginBottom: 6, cursor: "pointer", fontSize: 12 }}>
              <b>{a.codigo}</b> {a.descricao}<div style={{ color: "#64748b", marginTop: 2 }}>{a.responsavel_nome ?? "sem responsável"} · {dataBr(a.prazo)}</div></div>)}
          </div>))}
      </div>
    </>);
}

function Cronograma({ planoId, ano }: { planoId: number; ano: number }) {
  const q = useQuery({ queryKey: ["pms", "crono", planoId, ano], queryFn: () => api.get(`/api/pms-vivo/planos/${planoId}/cronograma`, { params: { ano } }).then(r => r.data as {
    mes: string; acoes: (Acao & { coluna: string })[] }[]) });
  const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return (
    <div style={card}><h3 style={h3}>Cronograma de execução — prazos e responsáveis ({ano})</h3>
      {(q.data ?? []).length === 0 && <div style={{ fontSize: 13, color: "#64748b" }}>Nenhuma ação na PAS do ano.</div>}
      {(q.data ?? []).map(g => <div key={g.mes} style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#1e3a8a" }}>{g.mes === "sem_prazo" ? "Sem prazo definido" : `${MESES[Number(g.mes.slice(5)) - 1]}/${g.mes.slice(0, 4)}`}</div>
        {g.acoes.map(a => <div key={a.id} style={{ fontSize: 12, display: "flex", gap: 8, padding: "3px 0 3px 10px", borderLeft: `3px solid ${COR_SIT[a.situacao]}`, marginTop: 3, flexWrap: "wrap" }}>
          <b>{dataBr(a.prazo)}</b><span>{a.codigo} {a.descricao}</span><span style={{ color: "#475569" }}>{a.responsavel_nome ?? "sem responsável"}{a.setor_responsavel ? ` · ${a.setor_responsavel}` : ""}</span>
          <Selo t={a.atrasada ? "Atrasada" : a.situacao_rotulo} cor={a.atrasada ? "#dc2626" : COR_SIT[a.situacao]} /></div>)}
      </div>)}
    </div>);
}

function Alertas({ planoId, ano }: { planoId: number; ano: number }) {
  const q = useQuery({ queryKey: ["pms", "alertas", planoId, ano], queryFn: () => api.get(`/api/pms-vivo/planos/${planoId}/alertas`, { params: { ano } }).then(r => r.data as Alerta[]) });
  return (
    <div style={card}><h3 style={h3}>Alertas e cobranças ({ano})</h3>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Ações atrasadas e metas em risco também vão diariamente para a central de alertas do ERSUS360. Outros canais só com integração autorizada.</div>
      {(q.data ?? []).length === 0 && <div style={{ fontSize: 13, color: "#64748b" }}>Nenhum alerta.</div>}
      {(q.data ?? []).map((a, i) => <div key={i} style={{ display: "flex", gap: 6, fontSize: 13, padding: "3px 0", color: COR_SEV[a.severidade] }}>
        <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />{a.texto}{a.responsavel && <span style={{ color: "#475569" }}> — {a.responsavel}</span>}</div>)}
    </div>);
}

function Fca({ planoId, ano, ref_ }: { planoId: number; ano: number; ref_: Ref }) {
  const qc = useQueryClient();
  const lista = useQuery({ queryKey: ["pms", "fca", planoId, ano], queryFn: () => api.get(`/api/pms-vivo/planos/${planoId}/fca`, { params: { ano } }).then(r => r.data as {
    id: number; meta_id: number | null; acao_id: number | null; fato: string; causa: string; causa_validacao: string; causa_validada_por: string | null;
    acao_corretiva: string; responsavel: string | null; prazo: string | null; situacao: string; atrasada: boolean; criado_por: string }[]) });
  const mon = useQuery({ queryKey: ["pms", "mon", planoId, ano], queryFn: () => api.get(`/api/pms-vivo/planos/${planoId}/monitoramento`, { params: { ano } }).then(r => r.data as { metas: MetaMon[] }) });
  const kb = useQuery({ queryKey: ["pms", "kanban", planoId, ano], queryFn: () => api.get(`/api/pms-vivo/planos/${planoId}/kanban`, { params: { ano } }).then(r => r.data as { colunas: { id: string; acoes: Acao[] }[] }) });
  const metasProb = (mon.data?.metas ?? []).filter(m => m.situacao === "em_risco" || m.situacao === "nao_alcancada");
  const acoesProb = (kb.data?.colunas ?? []).flatMap(c => c.acoes).filter(a => a.atrasada || a.situacao === "nao_executada" || a.situacao === "parcial");
  const [f, setF] = useState({ alvo: "", fato: "", causa: "", acao_corretiva: "", responsavel: "", prazo: "" });
  const criar = useMutation({ mutationFn: () => { const [tipo, id] = f.alvo.split(":");
    return api.post(`/api/pms-vivo/planos/${planoId}/fca`, { ano, [tipo === "m" ? "meta_id" : "acao_id"]: Number(id), fato: f.fato, causa: f.causa,
      acao_corretiva: f.acao_corretiva, responsavel: f.responsavel || null, prazo: f.prazo || null }); },
    onSuccess: () => { setF({ alvo: "", fato: "", causa: "", acao_corretiva: "", responsavel: "", prazo: "" }); qc.invalidateQueries({ queryKey: ["pms"] }); } });
  const validar = useMutation({ mutationFn: (id: number) => api.post(`/api/pms-vivo/fca/${id}/validar-causa`), onSuccess: () => qc.invalidateQueries({ queryKey: ["pms"] }) });
  const situacao = useMutation({ mutationFn: ({ id, s }: { id: number; s: string }) => api.put(`/api/pms-vivo/fca/${id}`, { situacao: s }), onSuccess: () => qc.invalidateQueries({ queryKey: ["pms"] }) });
  return (
    <>
      <div style={card}><h3 style={h3}>Nova análise FCA — Fato, Causa, Ação corretiva</h3>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Para meta não alcançada ou em risco, ou ação não executada, parcial ou atrasada. A causa fica como <b>hipótese</b> até ser validada por outra pessoa com evidência.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
          <label style={lbl}>Meta ou ação analisada<select style={inp} value={f.alvo} onChange={e => setF({ ...f, alvo: e.target.value })}><option value="">Selecione…</option>
            {metasProb.map(m => <option key={"m" + m.id} value={`m:${m.id}`}>Meta {m.codigo} — {ROT_META[m.situacao!]}</option>)}
            {acoesProb.map(a => <option key={"a" + a.id} value={`a:${a.id}`}>Ação {a.codigo} — {a.atrasada ? "atrasada" : a.situacao_rotulo}</option>)}</select></label>
          <label style={lbl}>Fato — o que aconteceu<textarea style={{ ...inp, minHeight: 50 }} value={f.fato} onChange={e => setF({ ...f, fato: e.target.value })} /></label>
          <label style={lbl}>Causa — por que ficou abaixo do previsto<textarea style={{ ...inp, minHeight: 50 }} value={f.causa} onChange={e => setF({ ...f, causa: e.target.value })} /></label>
          <label style={lbl}>Ação corretiva<textarea style={{ ...inp, minHeight: 50 }} value={f.acao_corretiva} onChange={e => setF({ ...f, acao_corretiva: e.target.value })} /></label>
          <label style={lbl}>Responsável<input style={inp} value={f.responsavel} onChange={e => setF({ ...f, responsavel: e.target.value })} /></label>
          <label style={lbl}>Prazo<input type="date" style={inp} value={f.prazo} onChange={e => setF({ ...f, prazo: e.target.value })} /></label>
        </div>
        <button style={btn()} disabled={!f.alvo || f.fato.length < 5 || f.causa.length < 5 || f.acao_corretiva.length < 5} onClick={() => criar.mutate()}>Registrar FCA</button>
        <Erro e={criar.error} />
      </div>
      <div style={card}><h3 style={h3}>Análises registradas ({ano})</h3><Erro e={validar.error} />
        {(lista.data ?? []).length === 0 && <div style={{ fontSize: 13, color: "#64748b" }}>Nenhuma.</div>}
        {(lista.data ?? []).map(x => <div key={x.id} style={{ fontSize: 13, padding: "6px 0", borderTop: "1px solid #f1f1f1" }}>
          <div><b>Fato:</b> {x.fato}</div>
          <div><b>Causa:</b> {x.causa} <Selo t={x.causa_validacao === "confirmada" ? `Causa validada por ${x.causa_validada_por}` : "Hipótese"} cor={x.causa_validacao === "confirmada" ? "#059669" : "#d97706"} /></div>
          <div><b>Ação corretiva:</b> {x.acao_corretiva} · {x.responsavel ?? "sem responsável"} · prazo {dataBr(x.prazo)} · {x.situacao.replace("_", " ")}{x.atrasada && <b style={{ color: "#dc2626" }}> · atrasada</b>}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            {ref_.pode_validar && x.causa_validacao !== "confirmada" && <button style={{ ...btn("#059669"), padding: "2px 8px", fontSize: 11 }} onClick={() => validar.mutate(x.id)}>Validar causa</button>}
            {x.situacao !== "concluida" && <select style={{ ...inp, width: 160, fontSize: 11 }} value={x.situacao} onChange={e => situacao.mutate({ id: x.id, s: e.target.value })}>
              <option value="aberta">Aberta</option><option value="em_andamento">Em andamento</option><option value="concluida">Concluída</option><option value="cancelada">Cancelada</option></select>}
          </div></div>)}
      </div>
    </>);
}

// ══ Entrega 3 — reprogramação, RDQA/RAG, reuniões, Diagnóstico, relatórios ══
interface Reprog { id: number; acao_id: number; ano_origem: number; ano_destino: number; situacao_origem: string; motivo: string;
  continua_necessaria: boolean; novo_prazo: string | null; nova_quantidade: number | null; ajuste_meta: string | null; recursos: string | null;
  responsavel_nome: string | null; justificativa_tecnica: string; situacao: string; situacao_rotulo: string; proposto_por: string;
  decidido_por: string | null; parecer: string | null; acao_destino_id: number | null; acao: { id: number; codigo: string; descricao: string; situacao_rotulo: string } }

function Reprogramar({ acao }: { acao: Acao }) {
  const qc = useQueryClient();
  const resp = useQuery({ queryKey: ["pms", "resp"], queryFn: () => api.get("/api/pms-vivo/responsaveis").then(r => r.data as { id: number; nome: string }[]) });
  const [f, setF] = useState({ motivo: "", continua_necessaria: true, novo_prazo: "", nova_quantidade: "", ajuste_meta: "", recursos: "", responsavel_usuario_id: "", justificativa_tecnica: "" });
  const enviar = useMutation({ mutationFn: () => api.post(`/api/pms-vivo/acoes/${acao.id}/reprogramar`, {
    ...f, novo_prazo: f.novo_prazo || null, nova_quantidade: f.nova_quantidade === "" ? null : Number(f.nova_quantidade),
    responsavel_usuario_id: f.responsavel_usuario_id ? Number(f.responsavel_usuario_id) : null, ajuste_meta: f.ajuste_meta || null, recursos: f.recursos || null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pms"] }) });
  const t = (k: "motivo" | "ajuste_meta" | "recursos" | "justificativa_tecnica", r: string) => <label style={lbl}>{r}<textarea style={{ ...inp, minHeight: 44 }} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} /></label>;
  return (
    <div style={{ ...card, background: "#fffbeb", marginTop: 8 }}>
      <b style={{ fontSize: 13 }}>Reprogramar para o exercício seguinte</b>
      <div style={{ fontSize: 11, color: "#92400e", marginBottom: 6 }}>A situação deste ano fica preservada. A proposta precisa ser aprovada e só então entra na PAS seguinte (em rascunho). Nenhum recurso é transferido automaticamente.</div>
      {enviar.isSuccess ? <div style={{ fontSize: 12, color: "#059669" }}>Proposta enviada para decisão.</div> : <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
          {t("motivo", "Motivo *")}
          <label style={lbl}>A ação continua necessária?<select style={inp} value={f.continua_necessaria ? "1" : "0"} onChange={e => setF({ ...f, continua_necessaria: e.target.value === "1" })}><option value="1">Sim</option><option value="0">Não</option></select></label>
          <label style={lbl}>Novo prazo<input type="date" style={inp} value={f.novo_prazo} onChange={e => setF({ ...f, novo_prazo: e.target.value })} /></label>
          <label style={lbl}>Nova quantidade<input type="number" style={inp} value={f.nova_quantidade} onChange={e => setF({ ...f, nova_quantidade: e.target.value })} /></label>
          {t("ajuste_meta", "Ajuste de meta proposto")}{t("recursos", "Recursos necessários")}
          <label style={lbl}>Responsável<select style={inp} value={f.responsavel_usuario_id} onChange={e => setF({ ...f, responsavel_usuario_id: e.target.value })}><option value="">Mantém o atual</option>{(resp.data ?? []).map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}</select></label>
          {t("justificativa_tecnica", "Justificativa técnica *")}
        </div>
        <button style={btn("#d97706")} disabled={f.motivo.length < 5 || f.justificativa_tecnica.length < 5} onClick={() => enviar.mutate()}>Encaminhar para aprovação</button>
        <Erro e={enviar.error} />
      </>}
    </div>);
}

function Reprogramacoes({ planoId, ref_ }: { planoId: number; ref_: Ref }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["pms", "reprog", planoId], queryFn: () => api.get(`/api/pms-vivo/planos/${planoId}/reprogramacoes`).then(r => r.data as Reprog[]) });
  const pass = useQuery({ queryKey: ["pms", "pas", planoId], queryFn: () => api.get(`/api/pms-vivo/planos/${planoId}/pas`).then(r => r.data as Pas[]) });
  const [parecer, setParecer] = useState<Record<number, string>>({});
  const [codigo, setCodigo] = useState<Record<number, string>>({});
  const decidir = useMutation({ mutationFn: ({ id, decisao }: { id: number; decisao: string }) => api.post(`/api/pms-vivo/reprogramacoes/${id}/decidir`, { decisao, parecer: parecer[id] || null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pms"] }) });
  const incluir = useMutation({ mutationFn: ({ id, pas_id }: { id: number; pas_id: number }) => api.post(`/api/pms-vivo/reprogramacoes/${id}/incluir`, { pas_id, codigo: codigo[id] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pms"] }) });
  return (
    <div style={card}><h3 style={h3}>Reprogramar para o Exercício Seguinte</h3>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Proposta feita pelo responsável na ação não executada ou parcial; decisão do Secretário ou do Planejamento (outra pessoa); depois de aprovada, inclusão na PAS do ano seguinte ainda em rascunho.</div>
      <Erro e={decidir.error} /><Erro e={incluir.error} />
      {(q.data ?? []).length === 0 && <div style={{ fontSize: 13, color: "#64748b" }}>Nenhuma reprogramação.</div>}
      {(q.data ?? []).map(r => {
        const destino = (pass.data ?? []).find(p => p.exercicio === r.ano_destino && p.situacao === "rascunho");
        return (
          <div key={r.id} style={{ fontSize: 13, padding: "8px 0", borderTop: "1px solid #f1f1f1" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "baseline" }}><Selo t={r.situacao_rotulo} cor={r.situacao === "rejeitada" ? "#dc2626" : r.situacao === "proposta" ? "#d97706" : "#059669"} />
              <b>{r.acao.codigo}</b> {r.acao.descricao} · {r.ano_origem} ({r.acao.situacao_rotulo}) → {r.ano_destino}</div>
            <div style={{ fontSize: 12, color: "#475569" }}>Motivo: {r.motivo} · Continua necessária: {r.continua_necessaria ? "sim" : "não"} · Novo prazo: {dataBr(r.novo_prazo)} · Nova qtd.: {num(r.nova_quantidade)}
              {r.ajuste_meta && <> · Ajuste de meta: {r.ajuste_meta}</>}{r.recursos && <> · Recursos: {r.recursos}</>} · Justificativa: {r.justificativa_tecnica} · proposta por {r.proposto_por}
              {r.decidido_por && <> · decidida por {r.decidido_por}{r.parecer && ` (${r.parecer})`}</>}</div>
            {r.situacao === "proposta" && ref_.pode_planejar && <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              <input style={{ ...inp, maxWidth: 300 }} placeholder="Parecer (obrigatório para rejeitar)" value={parecer[r.id] ?? ""} onChange={e => setParecer({ ...parecer, [r.id]: e.target.value })} />
              <button style={btn("#059669")} onClick={() => decidir.mutate({ id: r.id, decisao: "aprovar" })}>Aprovar</button>
              <button style={btn("#b91c1c")} onClick={() => decidir.mutate({ id: r.id, decisao: "rejeitar" })}>Rejeitar</button></div>}
            {r.situacao === "aprovada" && ref_.pode_planejar && (destino ? <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <input style={{ ...inp, maxWidth: 160 }} placeholder="Código na PAS nova" value={codigo[r.id] ?? ""} onChange={e => setCodigo({ ...codigo, [r.id]: e.target.value })} />
              <button style={btn()} disabled={!codigo[r.id]} onClick={() => incluir.mutate({ id: r.id, pas_id: destino.id })}>Incluir na PAS {r.ano_destino}</button></div>
              : <div style={{ fontSize: 12, color: "#92400e" }}>Crie a PAS {r.ano_destino} (rascunho) na aba "PAS e ações" para incluir.</div>)}
          </div>);
      })}
    </div>);
}

function RdqaRag({ planoId, ano }: { planoId: number; ano: number }) {
  const [modo, setModo] = useState<"q1" | "q2" | "q3" | "anual">("q1");
  const q = useQuery({ queryKey: ["pms", "rdqa", planoId, ano, modo], queryFn: () => (modo === "anual"
    ? api.get(`/api/pms-vivo/planos/${planoId}/avaliacao-anual`, { params: { ano } })
    : api.get(`/api/pms-vivo/planos/${planoId}/quadrimestre`, { params: { ano, q: Number(modo[1]) } })).then(r => r.data) });
  const d = q.data;
  const tipo = modo === "anual" ? "anual" : "quadrimestral";
  const params = modo === "anual" ? `ano=${ano}` : `ano=${ano}&quadrimestre=${modo[1]}`;
  return (
    <>
      <div style={{ ...card, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {(["q1", "q2", "q3", "anual"] as const).map(m => <button key={m} onClick={() => setModo(m)} style={{ ...btn(modo === m ? "#1d4ed8" : "#e2e8f0"), color: modo === m ? "#fff" : "#1f2937" }}>
          {m === "anual" ? `Avaliação anual ${ano} (RAG)` : `${m[1]}º quadrimestre (RDQA)`}</button>)}
        <button style={btn("#475569")} onClick={() => baixar(`/api/pms-vivo/planos/${planoId}/relatorios/${tipo}?formato=pdf&${params}`, `pms_${tipo}_${ano}.pdf`)}><Download size={14} />PDF</button>
        <button style={btn("#475569")} onClick={() => baixar(`/api/pms-vivo/planos/${planoId}/relatorios/${tipo}?formato=xlsx&${params}`, `pms_${tipo}_${ano}.xlsx`)}><Download size={14} />Excel</button>
      </div>
      {d && <div style={card}>
        <div style={{ fontSize: 12, color: "#92400e", marginBottom: 8 }}>{d.aviso}</div>
        {modo === "anual" ? <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginBottom: 10 }}>
            <Kpi t="Ações previstas" v={d.acoes.previstas} cor="#1d4ed8" /><Kpi t="Executadas" v={d.acoes.executadas} cor="#059669" />
            <Kpi t="Parcialmente" v={d.acoes.parcialmente_executadas} cor="#d97706" /><Kpi t="Não executadas" v={d.acoes.nao_executadas} cor="#dc2626" />
            <Kpi t="Metas alcançadas" v={d.metas.alcancadas} cor="#059669" /><Kpi t="Metas não alcançadas" v={d.metas.nao_alcancadas} cor="#dc2626" />
          </div>
          <h4 style={{ margin: "8px 0 4px", fontSize: 13, color: "#1f2937" }}>Principais resultados</h4>
          {d.principais_resultados.length ? d.principais_resultados.map((x: { acao: string; resultado: string }) => <div key={x.acao} style={{ fontSize: 12 }}><b>{x.acao}</b>: {x.resultado}</div>) : <div style={{ fontSize: 12, color: "#64748b" }}>Nenhum.</div>}
          <h4 style={{ margin: "8px 0 4px", fontSize: 13, color: "#1f2937" }}>Justificativas</h4>
          {d.justificativas.length ? d.justificativas.map((x: { acao: string; situacao: string; justificativa: string }) => <div key={x.acao} style={{ fontSize: 12 }}><b>{x.acao}</b> ({x.situacao}): {x.justificativa ?? "—"}</div>) : <div style={{ fontSize: 12, color: "#64748b" }}>Nenhuma.</div>}
        </> : <>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Período: {dataBr(d.periodo.inicio)} a {dataBr(d.periodo.fim)} · ações realizadas: <b>{d.acoes_realizadas.length}</b> · pendentes: <b>{d.acoes_pendentes.length}</b> · metas alcançadas: <b>{d.metas_alcancadas.length}</b></div>
          {d.acoes_realizadas.map((a: Acao) => <div key={a.id} style={{ fontSize: 12 }}>✔ <b>{a.codigo}</b> {a.descricao} — {a.resultado_alcancado ?? "—"}</div>)}
          {d.acoes_pendentes.map((a: Acao) => <div key={a.id} style={{ fontSize: 12, color: "#b91c1c" }}>• <b>{a.codigo}</b> {a.descricao} — prazo {dataBr(a.prazo)}</div>)}
        </>}
        <h4 style={{ margin: "8px 0 4px", fontSize: 13, color: "#1f2937" }}>Dificuldades (FCA)</h4>
        {d.dificuldades.length ? d.dificuldades.map((x: { fato: string; causa: string; causa_validacao: string }, i: number) => <div key={i} style={{ fontSize: 12 }}>{x.fato} — causa ({x.causa_validacao === "confirmada" ? "validada" : "hipótese"}): {x.causa}</div>) : <div style={{ fontSize: 12, color: "#64748b" }}>Nenhuma registrada.</div>}
        <h4 style={{ margin: "8px 0 4px", fontSize: 13, color: "#1f2937" }}>Recomendações</h4>
        {d.recomendacoes.length ? d.recomendacoes.map((x: string, i: number) => <div key={i} style={{ fontSize: 12 }}>• {x}</div>) : <div style={{ fontSize: 12, color: "#64748b" }}>Nenhuma.</div>}
      </div>}
    </>);
}

interface Reuniao { id: number; data: string; titulo: string; participantes: string | null; ata: string | null; situacao: string;
  pauta: { metas_em_risco: { codigo: string; descricao: string }[]; acoes_atrasadas: { codigo: string; descricao: string; prazo: string | null; responsavel: string | null }[];
    pendencias_por_responsavel: { responsavel: string; itens: string[] }[]; problemas_para_decisao: string[];
    reprogramacoes_propostas: { acao: string; motivo: string; ano_destino: number }[]; providencias_anteriores: { reuniao: string; decisao: string; responsavel: string | null; prazo: string | null }[] };
  decisoes: { id: number; descricao: string; responsavel: string | null; prazo: string | null; situacao: string; observacao: string | null; atrasada: boolean }[] }

function Reunioes({ planoId, ano, ref_ }: { planoId: number; ano: number; ref_: Ref }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["pms", "reunioes", planoId], queryFn: () => api.get(`/api/pms-vivo/planos/${planoId}/reunioes`).then(r => r.data as Reuniao[]) });
  const [nova, setNova] = useState({ data: new Date().toISOString().slice(0, 10), titulo: "" });
  const criar = useMutation({ mutationFn: () => api.post(`/api/pms-vivo/planos/${planoId}/reunioes`, { ...nova, ano }), onSuccess: () => qc.invalidateQueries({ queryKey: ["pms"] }) });
  const [aberta, setAberta] = useState<number | null>(null);
  const [ata, setAta] = useState({ participantes: "", ata: "" });
  const [dec, setDec] = useState({ descricao: "", responsavel: "", prazo: "" });
  const [obs, setObs] = useState<Record<number, string>>({});
  const salvar = useMutation({ mutationFn: (situacao?: string) => api.put(`/api/pms-vivo/reunioes/${aberta}`, { ...ata, ...(situacao ? { situacao } : {}) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["pms"] }) });
  const decidir = useMutation({ mutationFn: () => api.post(`/api/pms-vivo/reunioes/${aberta}/decisoes`, { descricao: dec.descricao, responsavel: dec.responsavel || null, prazo: dec.prazo || null }),
    onSuccess: () => { setDec({ descricao: "", responsavel: "", prazo: "" }); qc.invalidateQueries({ queryKey: ["pms"] }); } });
  const cumprir = useMutation({ mutationFn: ({ id, situacao }: { id: number; situacao: string }) => api.put(`/api/pms-vivo/decisoes/${id}`, { situacao, observacao: obs[id] || null }), onSuccess: () => qc.invalidateQueries({ queryKey: ["pms"] }) });
  const r = q.data?.find(x => x.id === aberta);
  useEffect(() => { if (r) setAta({ participantes: r.participantes ?? "", ata: r.ata ?? "" }); }, [aberta]); // eslint-disable-line react-hooks/exhaustive-deps
  const lista = (t: string, itens: React.ReactNode[]) => <><h4 style={{ margin: "8px 0 4px", fontSize: 13, color: "#1f2937" }}>{t}</h4>{itens.length ? itens : <div style={{ fontSize: 12, color: "#64748b" }}>Nenhum.</div>}</>;
  return (
    <>
      {ref_.pode_validar && <div style={{ ...card, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
        <label style={{ ...lbl, marginBottom: 0 }}>Data<input type="date" style={inp} value={nova.data} onChange={e => setNova({ ...nova, data: e.target.value })} /></label>
        <label style={{ ...lbl, marginBottom: 0, flex: 1 }}>Título<input style={inp} value={nova.titulo} placeholder="Reunião mensal de monitoramento do PMS" onChange={e => setNova({ ...nova, titulo: e.target.value })} /></label>
        <button style={btn()} disabled={nova.titulo.length < 3} onClick={() => criar.mutate()}>Gerar pauta e criar reunião</button><Erro e={criar.error} />
      </div>}
      <div style={card}><h3 style={h3}>Reuniões de monitoramento</h3>
        {(q.data ?? []).length === 0 && <div style={{ fontSize: 13, color: "#64748b" }}>Nenhuma reunião.</div>}
        {(q.data ?? []).map(x => <div key={x.id} onClick={() => setAberta(x.id)} style={{ fontSize: 13, padding: "6px 0", borderTop: "1px solid #f1f1f1", cursor: "pointer", fontWeight: aberta === x.id ? 700 : 400 }}>
          {dataBr(x.data)} — {x.titulo} · {x.situacao} · {x.decisoes.length} decisão(ões){x.decisoes.some(d => d.atrasada) && <span style={{ color: "#dc2626" }}> · decisão atrasada</span>}</div>)}
      </div>
      {r && <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><b style={{ fontSize: 15 }}>{dataBr(r.data)} — {r.titulo}</b>
          <button style={btn("#475569")} onClick={() => baixar(`/api/pms-vivo/reunioes/${r.id}/relatorio.pdf`, `reuniao_${r.data}.pdf`)}><Download size={14} />Pauta e registro (PDF)</button></div>
        {lista("Metas em risco", r.pauta.metas_em_risco.map(m => <div key={m.codigo} style={{ fontSize: 12 }}>{m.codigo} — {m.descricao}</div>))}
        {lista("Ações atrasadas", r.pauta.acoes_atrasadas.map(a => <div key={a.codigo} style={{ fontSize: 12 }}>{a.codigo} — {a.descricao} · {dataBr(a.prazo)} · {a.responsavel ?? "—"}</div>))}
        {lista("Pendências por responsável", r.pauta.pendencias_por_responsavel.map(p => <div key={p.responsavel} style={{ fontSize: 12 }}><b>{p.responsavel}</b>: {p.itens.join("; ")}</div>))}
        {lista("Problemas que exigem decisão", r.pauta.problemas_para_decisao.map((t, i) => <div key={i} style={{ fontSize: 12 }}>{t}</div>))}
        {lista("Reprogramações propostas", r.pauta.reprogramacoes_propostas.map(p => <div key={p.acao} style={{ fontSize: 12 }}>{p.acao} → {p.ano_destino}: {p.motivo}</div>))}
        {lista("Providências da reunião anterior", r.pauta.providencias_anteriores.map((p, i) => <div key={i} style={{ fontSize: 12 }}>{p.reuniao}: {p.decisao} ({p.responsavel ?? "—"}, {dataBr(p.prazo)})</div>))}
        {ref_.pode_validar && <>
          <h4 style={{ margin: "12px 0 4px", fontSize: 13, color: "#1f2937" }}>Registro</h4>
          <label style={lbl}>Participantes<input style={inp} value={ata.participantes} onChange={e => setAta({ ...ata, participantes: e.target.value })} /></label>
          <label style={lbl}>Ata<textarea style={{ ...inp, minHeight: 70 }} value={ata.ata} onChange={e => setAta({ ...ata, ata: e.target.value })} /></label>
          <div style={{ display: "flex", gap: 6 }}><button style={btn()} onClick={() => salvar.mutate(undefined)}>Salvar</button><button style={btn("#059669")} onClick={() => salvar.mutate("realizada")}>Salvar como realizada</button></div>
        </>}
        <h4 style={{ margin: "12px 0 4px", fontSize: 13, color: "#1f2937" }}>Decisões</h4><Erro e={cumprir.error} />
        {r.decisoes.map(d => <div key={d.id} style={{ fontSize: 12, padding: "4px 0", borderTop: "1px solid #f1f1f1" }}>
          {d.descricao} · {d.responsavel ?? "—"} · prazo {dataBr(d.prazo)} · <b style={{ color: d.atrasada ? "#dc2626" : undefined }}>{d.situacao}{d.atrasada && " (atrasada)"}</b>{d.observacao && ` · ${d.observacao}`}
          {ref_.pode_validar && d.situacao === "pendente" && <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
            <input style={{ ...inp, maxWidth: 300 }} placeholder="Como foi cumprida / por que cancelar" value={obs[d.id] ?? ""} onChange={e => setObs({ ...obs, [d.id]: e.target.value })} />
            <button style={{ ...btn("#059669"), padding: "2px 8px", fontSize: 11 }} onClick={() => cumprir.mutate({ id: d.id, situacao: "cumprida" })}>Cumprida</button>
            <button style={{ ...btn("#94a3b8"), padding: "2px 8px", fontSize: 11 }} onClick={() => cumprir.mutate({ id: d.id, situacao: "cancelada" })}>Cancelar</button></div>}
        </div>)}
        {ref_.pode_validar && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
          <input style={{ ...inp, flex: 1, minWidth: 220 }} placeholder="Nova decisão" value={dec.descricao} onChange={e => setDec({ ...dec, descricao: e.target.value })} />
          <input style={{ ...inp, width: 180 }} placeholder="Responsável" value={dec.responsavel} onChange={e => setDec({ ...dec, responsavel: e.target.value })} />
          <input type="date" style={{ ...inp, width: 150 }} value={dec.prazo} onChange={e => setDec({ ...dec, prazo: e.target.value })} />
          <button style={btn()} disabled={dec.descricao.length < 3} onClick={() => decidir.mutate()}>Registrar decisão</button></div>}
      </div>}
    </>);
}

function CruzamentoDiagnostico({ planoId, ano, ref_ }: { planoId: number; ano: number; ref_: Ref }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["pms", "diag", planoId, ano], queryFn: () => api.get(`/api/pms-vivo/planos/${planoId}/diagnostico`, { params: { ano } }).then(r => r.data) });
  const mon = useQuery({ queryKey: ["pms", "mon", planoId, ano], queryFn: () => api.get(`/api/pms-vivo/planos/${planoId}/monitoramento`, { params: { ano } }).then(r => r.data as { metas: MetaMon[] }) });
  const [sel, setSel] = useState<Record<number, string>>({});
  const vincular = useMutation({ mutationFn: (item: number) => api.post(`/api/pms-vivo/planos/${planoId}/diagnostico/vinculos`, { diag_item_id: item, meta_id: Number(sel[item]) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pms"] }) });
  const remover = useMutation({ mutationFn: (id: number) => api.delete(`/api/pms-vivo/diagnostico/vinculos/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["pms"] }) });
  const d = q.data;
  if (!d) return null;
  return (
    <>
      <div style={card}><h3 style={h3}>Diagnóstico Situacional × PMS/PAS</h3>
        {!d.diagnostico ? <div style={{ fontSize: 13 }}>{d.recomendacoes[0]}</div> : <>
          <div style={{ fontSize: 13, marginBottom: 8 }}>Diagnóstico: <b>{d.diagnostico.rotulo}</b> · problemas contemplados no planejamento: <b>{d.contemplados}</b> · sem ação correspondente: <b style={{ color: d.sem_acao ? "#dc2626" : undefined }}>{d.sem_acao}</b></div>
          <Erro e={vincular.error} />
          {d.problemas.map((p: { item_id: number; codigo: string; titulo: string; classificacao: string; validacao: string; contemplado: boolean; vinculos: { id: number; meta: string | null; acao: string | null }[] }) => (
            <div key={p.item_id} style={{ fontSize: 13, padding: "6px 0", borderTop: "1px solid #f1f1f1" }}>
              <Selo t={p.classificacao === "critico" ? "Crítico" : "Com pendência"} cor={p.classificacao === "critico" ? "#dc2626" : "#d97706"} /> <b>{p.codigo}</b> {p.titulo}
              {p.validacao !== "confirmado" && <span style={{ color: "#92400e", fontSize: 11 }}> · ainda não validado</span>}
              <div style={{ fontSize: 12, color: p.contemplado ? "#059669" : "#b91c1c" }}>{p.contemplado ? "Contemplado: " : "Sem meta ou ação correspondente"}
                {p.vinculos.map(v => <span key={v.id}>{v.meta ? `meta ${v.meta}` : `ação ${v.acao ?? "?"}`}{ref_.pode_planejar && <a href="#" onClick={e => { e.preventDefault(); remover.mutate(v.id); }}> (remover)</a>} </span>)}</div>
              {ref_.pode_planejar && <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                <select style={{ ...inp, maxWidth: 360 }} value={sel[p.item_id] ?? ""} onChange={e => setSel({ ...sel, [p.item_id]: e.target.value })}><option value="">Vincular a uma meta…</option>
                  {(mon.data?.metas ?? []).map(m => <option key={m.id} value={m.id}>{m.codigo} — {m.descricao.slice(0, 60)}</option>)}</select>
                <button style={{ ...btn(), padding: "2px 10px", fontSize: 12 }} disabled={!sel[p.item_id]} onClick={() => vincular.mutate(p.item_id)}>Vincular</button></div>}
            </div>))}
        </>}
      </div>
      {d.diagnostico && <div style={card}><h3 style={h3}>Recomendações para avaliação da gestão</h3>
        {d.recomendacoes.length ? d.recomendacoes.map((x: string, i: number) => <div key={i} style={{ fontSize: 12 }}>• {x}</div>) : <div style={{ fontSize: 12, color: "#64748b" }}>Nenhuma.</div>}
      </div>}
    </>);
}

const RELATORIOS: [string, string][] = [["execucao_pas", "Execução da PAS"], ["metas_pms", "Metas do PMS"], ["pendencias", "Pendências"],
  ["por_responsavel", "Por responsável"], ["quadrimestral", "Quadrimestral (RDQA)"], ["anual", "Anual (RAG)"], ["reprogramacoes", "Reprogramações"],
  ["plano_acao", "Plano de ação 5W2H"]];
function Relatorios({ planoId, ano }: { planoId: number; ano: number }) {
  const [quad, setQuad] = useState("1");
  return (
    <div style={card}><h3 style={h3}>Relatórios e exportações ({ano})</h3>
      <label style={{ fontSize: 12, color: "#475569" }}>Quadrimestre (para o relatório quadrimestral) <select style={{ ...inp, width: 80, display: "inline-block" }} value={quad} onChange={e => setQuad(e.target.value)}><option>1</option><option>2</option><option>3</option></select></label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 8, marginTop: 10 }}>
        {RELATORIOS.map(([k, t]) => <div key={k} style={{ ...card, marginBottom: 0, padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13 }}>{t}</span><span style={{ display: "flex", gap: 4 }}>
            {(["pdf", "xlsx"] as const).map(f => <button key={f} style={{ ...btn("#475569"), padding: "3px 8px", fontSize: 11 }}
              onClick={() => baixar(`/api/pms-vivo/planos/${planoId}/relatorios/${k}?formato=${f}&ano=${ano}&quadrimestre=${quad}`, `pms_${k}_${ano}.${f}`)}>{f === "pdf" ? "PDF" : "Excel"}</button>)}</span></div>)}
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>A pauta e o registro de cada reunião são baixados na aba "Reuniões". Relatórios do RDQA e do RAG são de apoio e não substituem os instrumentos oficiais do DGMP/DigiSUS.</div>
    </div>);
}

// ── Página ───────────────────────────────────────────────────────────────────
export default function PmsVivo() {
  const auth = useAuth() as unknown as { municipio: string; municipio_uf?: string };
  const ref_ = useQuery({ queryKey: ["pms", "ref"], queryFn: () => api.get("/api/pms-vivo/referencias").then(r => r.data as Ref) });
  const planos = useQuery({ queryKey: ["pms", "planos"], queryFn: () => api.get("/api/pms-vivo/planos").then(r => r.data as Plano[]) });
  const [planoId, setPlanoId] = useState<number | null>(null);
  useEffect(() => { if (!planoId && planos.data?.length) setPlanoId((planos.data.find(p => p.situacao === "aprovado") ?? planos.data[0]).id); }, [planos.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const [aba, setAba] = useState<"painel" | "metas" | "kanban" | "cronograma" | "alertas" | "fca" | "reprogramacao" | "rdqa" | "reunioes" | "diagnostico" | "relatorios" | "pms" | "pas" | "minhas" | "validacoes">("minhas");
  const [ano, setAno] = useState(ANO_ATUAL);
  const plano = planos.data?.find(p => p.id === planoId);
  useEffect(() => { if (plano && (ano < plano.vigencia_inicio || ano > plano.vigencia_fim)) setAno(plano.vigencia_inicio); }, [plano]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ref_.data) return <div style={{ padding: 20 }}>Carregando…</div>;
  const abas = [["minhas", "Minhas Ações"], ["painel", "Painel do gestor"], ["metas", "Metas"], ["kanban", "Kanban"], ["cronograma", "Cronograma"],
    ["alertas", "Alertas"], ["fca", "FCA"], ["reprogramacao", "Reprogramação"], ["rdqa", "RDQA / RAG"], ["reunioes", "Reuniões"],
    ["diagnostico", "Diagnóstico"], ["relatorios", "Relatórios"], ["pms", "Plano (PMS)"], ["pas", "PAS e ações"], ["validacoes", "Validações"]] as const;
  const precisaPlano = ["painel", "metas", "kanban", "cronograma", "alertas", "fca", "reprogramacao", "rdqa", "reunioes", "diagnostico", "relatorios"].includes(aba);
  return (
    <div style={{ padding: 20, maxWidth: 1300, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <Target size={24} style={{ color: "#1d4ed8" }} /><h1 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>PMS Vivo — Gestão, Execução e Resultados</h1>
      </div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>{auth.municipio}{auth.municipio_uf ? `/${auth.municipio_uf}` : ""} · PMS → PAS → execução das ações → validação. Versão aprovada é oficial; alterações viram proposta.</div>
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e5e5e3", marginBottom: 12, flexWrap: "wrap" }}>
        {abas.map(([k, r]) => <button key={k} onClick={() => setAba(k)} style={{ background: "none", border: "none", padding: "8px 12px", cursor: "pointer", fontSize: 13,
          fontWeight: aba === k ? 700 : 500, color: aba === k ? "#1d4ed8" : "#475569", borderBottom: aba === k ? "2px solid #1d4ed8" : "2px solid transparent" }}>{r}</button>)}
      </div>
      {precisaPlano && (planoId && plano ? <div style={{ ...card, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", padding: 10 }}>
        <span style={{ fontSize: 13 }}><b>{plano.titulo}</b> · v{plano.versao} · {ROT_PLANO[plano.situacao]}</span>
        <label style={{ fontSize: 12, color: "#475569" }}>Ano <select style={{ ...inp, width: 100, display: "inline-block" }} value={ano} onChange={e => setAno(Number(e.target.value))}>
          {Array.from({ length: plano.vigencia_fim - plano.vigencia_inicio + 1 }, (_, i) => plano.vigencia_inicio + i).map(a => <option key={a} value={a}>{a}</option>)}</select></label>
        <span style={{ fontSize: 12, color: "#64748b" }}>Troque a versão do PMS na aba "Plano (PMS)".</span>
      </div> : <div style={card}>Cadastre ou selecione um PMS na aba "Plano (PMS)".</div>)}
      {precisaPlano && planoId && plano && <>
        {aba === "painel" && <PainelGestor planoId={planoId} ano={ano} />}
        {aba === "metas" && <Metas planoId={planoId} ano={ano} ref_={ref_.data} />}
        {aba === "kanban" && <Kanban planoId={planoId} ano={ano} ref_={ref_.data} />}
        {aba === "cronograma" && <Cronograma planoId={planoId} ano={ano} />}
        {aba === "alertas" && <Alertas planoId={planoId} ano={ano} />}
        {aba === "fca" && <Fca planoId={planoId} ano={ano} ref_={ref_.data} />}
        {aba === "reprogramacao" && <Reprogramacoes planoId={planoId} ref_={ref_.data} />}
        {aba === "rdqa" && <RdqaRag planoId={planoId} ano={ano} />}
        {aba === "reunioes" && <Reunioes planoId={planoId} ano={ano} ref_={ref_.data} />}
        {aba === "diagnostico" && <CruzamentoDiagnostico planoId={planoId} ano={ano} ref_={ref_.data} />}
        {aba === "relatorios" && <Relatorios planoId={planoId} ano={ano} />}
      </>}
      {aba === "pms" && <AbaPms ref_={ref_.data} planoId={planoId} setPlanoId={setPlanoId} />}
      {aba === "pas" && <AbaPas ref_={ref_.data} planoId={planoId} />}
      {aba === "minhas" && <MinhasAcoes ref_={ref_.data} />}
      {aba === "validacoes" && <Validacoes ref_={ref_.data} />}
      <div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 6, marginTop: 8 }}><AlertTriangle size={14} />Nenhum resultado é preenchido sem fonte: campos vazios significam que o PMS ou o responsável não informaram.</div>
    </div>);
}
