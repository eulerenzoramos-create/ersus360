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
      {a.pode_atualizar && !pendente && a.situacao !== "cancelada" && <InformarExecucao acao={a} ref_={ref_} />}
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

// ── Página ───────────────────────────────────────────────────────────────────
export default function PmsVivo() {
  const auth = useAuth() as unknown as { municipio: string; municipio_uf?: string };
  const ref_ = useQuery({ queryKey: ["pms", "ref"], queryFn: () => api.get("/api/pms-vivo/referencias").then(r => r.data as Ref) });
  const planos = useQuery({ queryKey: ["pms", "planos"], queryFn: () => api.get("/api/pms-vivo/planos").then(r => r.data as Plano[]) });
  const [planoId, setPlanoId] = useState<number | null>(null);
  useEffect(() => { if (!planoId && planos.data?.length) setPlanoId((planos.data.find(p => p.situacao === "aprovado") ?? planos.data[0]).id); }, [planos.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const [aba, setAba] = useState<"pms" | "pas" | "minhas" | "validacoes">("minhas");
  if (!ref_.data) return <div style={{ padding: 20 }}>Carregando…</div>;
  const abas = [["minhas", "Minhas Ações"], ["pms", "Plano (PMS)"], ["pas", "PAS e ações"], ["validacoes", "Validações"]] as const;
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
      {aba === "pms" && <AbaPms ref_={ref_.data} planoId={planoId} setPlanoId={setPlanoId} />}
      {aba === "pas" && <AbaPas ref_={ref_.data} planoId={planoId} />}
      {aba === "minhas" && <MinhasAcoes ref_={ref_.data} />}
      {aba === "validacoes" && <Validacoes ref_={ref_.data} />}
      <div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 6, marginTop: 8 }}><AlertTriangle size={14} />Nenhum resultado é preenchido sem fonte: campos vazios significam que o PMS ou o responsável não informaram.</div>
    </div>);
}
