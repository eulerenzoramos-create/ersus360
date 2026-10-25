// Diagnóstico Situacional da Saúde Municipal — painel, checklist A–I, validação técnica, 5W2H, histórico
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Download, FileText, History, Info, Paperclip, RefreshCw, XCircle } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../App";

// ── Tipos ────────────────────────────────────────────────────────────────────
type Classe = "regular" | "pendencia" | "critico" | "nao_se_aplica" | "nao_verificado";
interface Anexo { id: number; nome: string; tamanho: number; descricao: string | null; enviado_por: string | null; enviado_em: string }
interface Item {
  id: number; codigo: string; area: string; area_nome: string; titulo: string; pergunta: string | null;
  modo: "automatico" | "integracao" | "levantamento"; modo_rotulo: string; fonte_sugerida: string | null; evidencia_esperada: string | null;
  classificacao: Classe; classificacao_rotulo: string; origem: string; natureza: string | null; validacao: string; tipo_dado: string;
  fonte: string | null; competencia: string | null; evidencia: string | null; data_referencia: string | null; justificativa: string | null;
  prioridade: string | null; responsavel: string | null; observacoes: string | null; vazio_assistencial: boolean;
  validado_por: string | null; validado_em: string | null; atualizado_por: string | null; atualizado_em: string | null; anexos?: Anexo[];
}
interface Diag {
  id: number; exercicio: number; periodo_tipo: string; periodo: number; rotulo: string; situacao: string;
  situacao_rotulo?: string; responsavel_tecnico: string | null; objetivo: string | null; observacoes: string | null; ultima_coleta: string | null;
  totais?: Record<Classe, number>;
}
interface Linha { codigo: string; titulo: string; antes: Classe; depois: Classe }
interface Evolucao { pioraram: Linha[]; melhoraram: Linha[]; novos_criticos: Linha[]; mudancas: Linha[]; totais_anterior: Record<Classe, number>; totais_atual: Record<Classe, number> }
interface Painel {
  municipio: string; uf: string | null; diagnostico: Diag; totais: Record<Classe, number>; total_itens: number;
  por_tipo_dado: Record<string, number>;
  por_area: { area: string; nome: string; totais: Record<Classe, number>; modos: Record<string, number> }[];
  problemas: Item[]; prioridades: Item[]; anterior: Diag | null; evolucao: Evolucao | null;
  alertas: { severidade: string; tipo: string; texto: string }[];
  acoes: { total: number; atrasadas: number; concluidas: number }; nota: string;
}
interface Acao {
  id: number; item_id: number; item_codigo?: string; item_titulo?: string; o_que: string; por_que: string | null; onde: string | null;
  quando: string | null; quem: string | null; como: string | null; quanto: number | null; quanto_texto: string | null;
  produto: string | null; indicador: string | null; evidencia: string | null; prioridade: string | null; status: string; atrasada: boolean;
}

// ── Aparência ────────────────────────────────────────────────────────────────
const COR: Record<Classe, string> = { regular: "#059669", pendencia: "#d97706", critico: "#dc2626", nao_se_aplica: "#64748b", nao_verificado: "#94a3b8" };
const ROT: Record<Classe, string> = { regular: "Regular", pendencia: "Com pendência", critico: "Crítico", nao_se_aplica: "Não se aplica", nao_verificado: "Não verificado" };
const TIPO: Record<string, string> = { automatico: "Automático", declarado: "Declarado", validado: "Validado" };
const VAL: Record<string, string> = { pendente: "Aguardando validação", confirmado: "Validado", contestado: "Contestado" };
const NAT: Record<string, string> = { comprovado: "Achado comprovado", hipotese: "Hipótese" };
const PRIO: Record<string, string> = { alta: "Alta", media: "Média", baixa: "Baixa" };
const STATUS: Record<string, string> = { nao_iniciada: "Não iniciada", em_andamento: "Em andamento", concluida: "Concluída", cancelada: "Cancelada" };
const AREAS: Record<string, string> = { A: "Planejamento e Controle Social", B: "Atenção Primária à Saúde", C: "Rede de Serviços e CNES",
  D: "Regulação e Acesso", E: "Vigilância em Saúde", F: "Assistência Farmacêutica", G: "Financiamento e Recursos Federais",
  H: "Gestão de Pessoas", I: "Território e Acesso" };
const card: React.CSSProperties = { background: "#fff", color: "#1f2937", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 12 };
const inp: React.CSSProperties = { width: "100%", padding: "6px 8px", border: "1px solid #d4d4d0", borderRadius: 6, fontSize: 13, boxSizing: "border-box" };
const btn = (cor = "#1d4ed8"): React.CSSProperties => ({ background: cor, color: "#fff", border: "none", borderRadius: 6, padding: "7px 12px",
  fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 });
const dataBr = (d?: string | null) => (d ? d.split("T")[0].split("-").reverse().join("/") : "—");
const erroDe = (e: unknown) => (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
const msgErro = (e: unknown) => { const d = erroDe(e); return typeof d === "string" ? d : d ? "Dados inválidos." : e ? "Falha na operação." : null; };

function Selo({ c }: { c: Classe }) {
  return <span style={{ background: COR[c] + "1a", color: COR[c], border: `1px solid ${COR[c]}55`, borderRadius: 999,
    padding: "1px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{ROT[c]}</span>;
}
function Etiqueta({ t, cor = "#475569" }: { t: string; cor?: string }) {
  return <span style={{ color: cor, background: "#f1f5f9", borderRadius: 4, padding: "1px 6px", fontSize: 11, whiteSpace: "nowrap" }}>{t}</span>;
}
function Totais({ t }: { t: Record<Classe, number> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
      {(Object.keys(ROT) as Classe[]).map(k => (
        <div key={k} style={{ ...card, marginBottom: 0, borderTop: `3px solid ${COR[k]}`, padding: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b" }}>{ROT[k]}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: COR[k] }}>{t?.[k] ?? 0}</div>
        </div>))}
    </div>);
}

// ── Painel executivo ─────────────────────────────────────────────────────────
function PainelExecutivo({ p, irArea, abrir }: { p: Painel; irArea: (a: string) => void; abrir: (codigo: string) => void }) {
  return (
    <>
      <Totais t={p.totais} />
      <div style={{ ...card, marginTop: 12, fontSize: 12, color: "#475569", display: "flex", gap: 16, flexWrap: "wrap" }}>
        <span><b>{p.total_itens}</b> itens</span>
        {Object.entries(p.por_tipo_dado).map(([k, v]) => <span key={k}>{TIPO[k]}: <b>{v}</b></span>)}
        <span>Ações 5W2H: <b>{p.acoes.total}</b> ({p.acoes.concluidas} concluídas, {p.acoes.atrasadas} atrasadas)</span>
      </div>
      {p.alertas.length > 0 && (
        <div style={card}>
          <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#1f2937" }}>Alertas</h3>
          {p.alertas.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 6, fontSize: 13, padding: "3px 0", color: a.severidade === "critico" ? "#b91c1c" : "#92400e" }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />{a.texto}</div>))}
        </div>)}
      <div style={card}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#1f2937" }}>Situação por área</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead><tr style={{ textAlign: "left", color: "#64748b" }}><th>Área</th>{(Object.keys(ROT) as Classe[]).map(k => <th key={k}>{ROT[k]}</th>)}<th>Fonte dos itens</th></tr></thead>
            <tbody>{p.por_area.map(a => (
              <tr key={a.area} style={{ borderTop: "1px solid #eee", cursor: "pointer" }} onClick={() => irArea(a.area)}>
                <td style={{ padding: "6px 4px", color: "#1d4ed8", fontWeight: 600 }}>{a.area} — {a.nome}</td>
                {(Object.keys(ROT) as Classe[]).map(k => <td key={k} style={{ color: a.totais[k] ? COR[k] : "#cbd5e1", fontWeight: 700 }}>{a.totais[k] ?? 0}</td>)}
                <td style={{ color: "#64748b" }}>{a.modos.automatico} auto · {a.modos.integracao} integração · {a.modos.levantamento} levantamento</td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
      <div style={card}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#1f2937" }}>Principais problemas</h3>
        {p.problemas.length === 0 ? <div style={{ fontSize: 13, color: "#64748b" }}>Nenhum problema registrado nos itens verificados.</div> :
          p.problemas.map(i => (
            <div key={i.id} onClick={() => abrir(i.codigo)} style={{ display: "flex", gap: 8, alignItems: "baseline", padding: "6px 0", borderTop: "1px solid #f1f1f1", cursor: "pointer", flexWrap: "wrap" }}>
              <Selo c={i.classificacao} /><b style={{ fontSize: 13 }}>{i.codigo} {i.titulo}</b>
              <Etiqueta t={TIPO[i.tipo_dado]} />{i.natureza && <Etiqueta t={NAT[i.natureza]} cor={i.natureza === "hipotese" ? "#92400e" : "#065f46"} />}
              {i.prioridade && <Etiqueta t={`Prioridade ${PRIO[i.prioridade]}`} cor="#7c2d12" />}
              <div style={{ width: "100%", fontSize: 12, color: "#475569" }}>{i.justificativa}</div>
            </div>))}
      </div>
      <div style={card}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#1f2937" }}>Evolução</h3>
        {!p.evolucao || !p.anterior ? <div style={{ fontSize: 13, color: "#64748b" }}>Sem diagnóstico anterior para comparar.</div> : (
          <div style={{ fontSize: 13 }}>
            <div style={{ color: "#64748b", marginBottom: 6 }}>Comparado a {p.anterior.rotulo}</div>
            {p.evolucao.mudancas.length === 0 && <div>Nenhuma mudança de classificação.</div>}
            {p.evolucao.mudancas.map(m => (
              <div key={m.codigo} style={{ display: "flex", gap: 6, alignItems: "center", padding: "2px 0", flexWrap: "wrap" }}>
                <b>{m.codigo}</b> {m.titulo}: <Selo c={m.antes} /> → <Selo c={m.depois} />
              </div>))}
          </div>)}
      </div>
      <div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 6 }}><Info size={14} />{p.nota}</div>
    </>);
}

// ── Detalhe do item: declaração, validação, anexos, histórico ────────────────
function DetalheItem({ item, podeEditar, bloqueado, onFechar }: { item: Item; podeEditar: boolean; bloqueado: boolean; onFechar: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    classificacao: item.classificacao, natureza: item.natureza ?? "", fonte: item.fonte ?? "", competencia: item.competencia ?? "",
    data_referencia: item.data_referencia ?? "", evidencia: item.evidencia ?? "", justificativa: item.justificativa ?? "",
    prioridade: item.prioridade ?? "", responsavel: item.responsavel ?? "", observacoes: item.observacoes ?? "", vazio_assistencial: item.vazio_assistencial,
  });
  const [obsVal, setObsVal] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const hist = useQuery({ queryKey: ["diag-hist", item.id], queryFn: () => api.get(`/api/diagnostico-situacional/itens/${item.id}/historico`).then(r => r.data as { id: number; evento: string; descricao: string; usuario: string | null; criado_em: string }[]) });
  const recarregar = () => { qc.invalidateQueries({ queryKey: ["diag"] }); qc.invalidateQueries({ queryKey: ["diag-hist", item.id] }); };
  const salvar = useMutation({
    mutationFn: () => {
      const corpo: Record<string, unknown> = {};
      const orig: Record<string, unknown> = { ...item, natureza: item.natureza ?? "", fonte: item.fonte ?? "", competencia: item.competencia ?? "",
        data_referencia: item.data_referencia ?? "", evidencia: item.evidencia ?? "", justificativa: item.justificativa ?? "",
        prioridade: item.prioridade ?? "", responsavel: item.responsavel ?? "", observacoes: item.observacoes ?? "" };
      (Object.keys(f) as (keyof typeof f)[]).forEach(k => { if (f[k] !== orig[k]) corpo[k] = f[k] === "" ? null : f[k]; });
      return api.put(`/api/diagnostico-situacional/itens/${item.id}`, corpo).then(r => r.data);
    }, onSuccess: recarregar });
  const validar = useMutation({
    mutationFn: (decisao: "confirmar" | "contestar") => api.post(`/api/diagnostico-situacional/itens/${item.id}/validar`, { decisao, observacao: obsVal || null }).then(r => r.data),
    onSuccess: () => { setObsVal(""); recarregar(); } });
  const anexar = useMutation({
    mutationFn: () => { const fd = new FormData(); fd.append("arquivo", arquivo as File);
      return api.post(`/api/diagnostico-situacional/itens/${item.id}/anexos`, fd, { headers: { "Content-Type": "multipart/form-data" } }); },
    onSuccess: () => { setArquivo(null); recarregar(); } });
  const remover = useMutation({ mutationFn: (id: number) => api.delete(`/api/diagnostico-situacional/anexos/${id}`), onSuccess: recarregar });
  const baixar = async (a: Anexo) => {
    const r = await api.get(`/api/diagnostico-situacional/anexos/${a.id}`, { responseType: "blob" });
    const url = URL.createObjectURL(r.data); const el = document.createElement("a"); el.href = url; el.download = a.nome; el.click(); URL.revokeObjectURL(url);
  };
  const editavel = podeEditar && !bloqueado;
  const campo = (rot: string, el: React.ReactNode) => <label style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 8 }}>{rot}{el}</label>;
  return (
    <div style={{ ...card, borderLeft: `4px solid ${COR[item.classificacao]}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{item.codigo} {item.titulo}</div>
          <div style={{ fontSize: 13, color: "#475569", margin: "4px 0" }}>{item.pergunta}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Selo c={item.classificacao} /><Etiqueta t={TIPO[item.tipo_dado]} /><Etiqueta t={VAL[item.validacao]} />
            {item.natureza && <Etiqueta t={NAT[item.natureza]} />}<Etiqueta t={item.modo_rotulo} cor="#1e40af" />
          </div>
        </div>
        <button style={btn("#64748b")} onClick={onFechar}>Fechar</button>
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
        Fonte oficial/esperada: {item.fonte_sugerida} — evidência esperada: {item.evidencia_esperada}
      </div>
      {item.evidencia && <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "#f8fafc", padding: 8, borderRadius: 6 }}>{item.evidencia}</pre>}
      {item.validado_por && <div style={{ fontSize: 12, color: "#475569" }}>{VAL[item.validacao]} por {item.validado_por} em {dataBr(item.validado_em)}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 12 }}>
        <div>
          <h4 style={{ margin: "0 0 6px", fontSize: 13, color: "#1f2937" }}>Declaração / edição técnica</h4>
          {campo("Classificação", <select style={inp} disabled={!editavel} value={f.classificacao} onChange={e => setF({ ...f, classificacao: e.target.value as Classe })}>
            {(Object.keys(ROT) as Classe[]).map(k => <option key={k} value={k}>{ROT[k]}</option>)}</select>)}
          {campo("Natureza do achado", <select style={inp} disabled={!editavel} value={f.natureza} onChange={e => setF({ ...f, natureza: e.target.value })}>
            <option value="">—</option><option value="comprovado">Achado comprovado</option><option value="hipotese">Hipótese (a confirmar)</option></select>)}
          {campo("Fonte", <input style={inp} disabled={!editavel} value={f.fonte} onChange={e => setF({ ...f, fonte: e.target.value })} />)}
          {campo("Competência", <input style={inp} disabled={!editavel} value={f.competencia} onChange={e => setF({ ...f, competencia: e.target.value })} />)}
          {campo("Data do dado", <input type="date" style={inp} disabled={!editavel} value={f.data_referencia} onChange={e => setF({ ...f, data_referencia: e.target.value })} />)}
          {campo("Justificativa", <textarea style={{ ...inp, minHeight: 60 }} disabled={!editavel} value={f.justificativa} onChange={e => setF({ ...f, justificativa: e.target.value })} />)}
          {campo("Evidência", <textarea style={{ ...inp, minHeight: 60 }} disabled={!editavel} value={f.evidencia} onChange={e => setF({ ...f, evidencia: e.target.value })} />)}
        </div>
        <div>
          <h4 style={{ margin: "0 0 6px", fontSize: 13, color: "#1f2937" }}>Gestão do item</h4>
          {campo("Prioridade", <select style={inp} disabled={!editavel} value={f.prioridade} onChange={e => setF({ ...f, prioridade: e.target.value })}>
            <option value="">—</option>{Object.entries(PRIO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>)}
          {campo("Responsável", <input style={inp} disabled={!editavel} value={f.responsavel} onChange={e => setF({ ...f, responsavel: e.target.value })} />)}
          {campo("Observações", <textarea style={{ ...inp, minHeight: 60 }} disabled={!editavel} value={f.observacoes} onChange={e => setF({ ...f, observacoes: e.target.value })} />)}
          <label style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
            <input type="checkbox" disabled={!editavel} checked={f.vazio_assistencial} onChange={e => setF({ ...f, vazio_assistencial: e.target.checked })} /> Registrar como vazio assistencial</label>
          {editavel && <button style={btn()} disabled={salvar.isPending} onClick={() => salvar.mutate()}>Salvar</button>}
          {msgErro(salvar.error) && <div style={{ color: "#b91c1c", fontSize: 12, marginTop: 6 }}>{msgErro(salvar.error)}</div>}
          {item.origem === "automatico" && editavel && <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>Alterar o dado transforma o item em declarado e exige nova validação.</div>}

          <h4 style={{ margin: "14px 0 6px", fontSize: 13, color: "#1f2937" }}>Validação técnica</h4>
          {editavel ? <>
            <textarea style={{ ...inp, minHeight: 50 }} placeholder="Observação (obrigatória para contestar)" value={obsVal} onChange={e => setObsVal(e.target.value)} />
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button style={btn("#059669")} onClick={() => validar.mutate("confirmar")}><CheckCircle2 size={14} />Confirmar</button>
              <button style={btn("#b91c1c")} onClick={() => validar.mutate("contestar")}><XCircle size={14} />Contestar</button>
            </div>
            {msgErro(validar.error) && <div style={{ color: "#b91c1c", fontSize: 12, marginTop: 6 }}>{msgErro(validar.error)}</div>}
          </> : <div style={{ fontSize: 12, color: "#64748b" }}>{bloqueado ? "Diagnóstico concluído." : "Seu perfil só consulta."}</div>}
        </div>
        <div>
          <h4 style={{ margin: "0 0 6px", fontSize: 13, display: "flex", gap: 6, color: "#1f2937" }}><Paperclip size={14} />Anexos</h4>
          {(item.anexos ?? []).length === 0 && <div style={{ fontSize: 12, color: "#64748b" }}>Nenhum anexo.</div>}
          {(item.anexos ?? []).map(a => (
            <div key={a.id} style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center", padding: "2px 0" }}>
              <a href="#" onClick={e => { e.preventDefault(); baixar(a); }}>{a.nome}</a>
              <span style={{ color: "#94a3b8" }}>{dataBr(a.enviado_em)}</span>
              {editavel && <button style={{ ...btn("#94a3b8"), padding: "1px 6px", fontSize: 11 }} onClick={() => remover.mutate(a.id)}>remover</button>}
            </div>))}
          {editavel && <div style={{ marginTop: 6 }}>
            <input type="file" onChange={e => setArquivo(e.target.files?.[0] ?? null)} style={{ fontSize: 12 }} />
            {arquivo && <button style={{ ...btn(), marginTop: 4 }} onClick={() => anexar.mutate()}>Enviar</button>}
            {msgErro(anexar.error) && <div style={{ color: "#b91c1c", fontSize: 12 }}>{msgErro(anexar.error)}</div>}
          </div>}
          <h4 style={{ margin: "14px 0 6px", fontSize: 13, display: "flex", gap: 6, color: "#1f2937" }}><History size={14} />Histórico</h4>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {(hist.data ?? []).map(h => (
              <div key={h.id} style={{ fontSize: 11, padding: "3px 0", borderTop: "1px solid #f1f1f1" }}>
                <b>{dataBr(h.criado_em)}</b> · {h.usuario ?? "sistema"} · {h.evento}<div style={{ color: "#475569" }}>{h.descricao}</div>
              </div>))}
          </div>
        </div>
      </div>
    </div>);
}

// ── Checklist por área ───────────────────────────────────────────────────────
function Checklist({ itens, area, setArea, aberto, setAberto, podeEditar, bloqueado }: {
  itens: Item[]; area: string; setArea: (a: string) => void; aberto: string | null; setAberto: (c: string | null) => void; podeEditar: boolean; bloqueado: boolean }) {
  const da = itens.filter(i => i.area === area);
  const item = itens.find(i => i.codigo === aberto);
  return (
    <>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
        {Object.entries(AREAS).map(([a, n]) => (
          <button key={a} onClick={() => { setArea(a); setAberto(null); }} title={n}
            style={{ ...btn(area === a ? "#1d4ed8" : "#e2e8f0"), color: area === a ? "#fff" : "#1f2937" }}>{a} — {n}</button>))}
      </div>
      {item && <DetalheItem key={item.id + item.atualizado_em!} item={item} podeEditar={podeEditar} bloqueado={bloqueado} onFechar={() => setAberto(null)} />}
      <div style={card}>
        {da.map(i => (
          <div key={i.id} onClick={() => setAberto(i.codigo)} style={{ padding: "8px 0", borderTop: "1px solid #f1f1f1", cursor: "pointer",
            background: aberto === i.codigo ? "#f8fafc" : undefined }}>
            <div style={{ display: "flex", gap: 6, alignItems: "baseline", flexWrap: "wrap" }}>
              <Selo c={i.classificacao} /><b style={{ fontSize: 13 }}>{i.codigo} {i.titulo}</b>
              <Etiqueta t={TIPO[i.tipo_dado]} />{i.validacao !== "pendente" && <Etiqueta t={VAL[i.validacao]} />}
              <Etiqueta t={i.modo_rotulo} cor="#1e40af" />{(i.anexos ?? []).length > 0 && <Etiqueta t={`${i.anexos!.length} anexo(s)`} />}
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{i.justificativa ?? i.pergunta}</div>
            {i.fonte && <div style={{ fontSize: 11, color: "#94a3b8" }}>{i.fonte}{i.competencia ? ` · ${i.competencia}` : ""}{i.data_referencia ? ` · ${dataBr(i.data_referencia)}` : ""}</div>}
          </div>))}
      </div>
    </>);
}

// ── Plano de ação 5W2H ───────────────────────────────────────────────────────
const VAZIA = { item_id: 0, o_que: "", por_que: "", onde: "", quando: "", quem: "", como: "", quanto: "", quanto_texto: "",
  produto: "", indicador: "", evidencia: "", prioridade: "", status: "nao_iniciada" };
function Plano({ diagId, itens, podeEditar }: { diagId: number; itens: Item[]; podeEditar: boolean }) {
  const qc = useQueryClient();
  const acoes = useQuery({ queryKey: ["diag", "acoes", diagId], queryFn: () => api.get(`/api/diagnostico-situacional/diagnosticos/${diagId}/acoes`).then(r => r.data as Acao[]) });
  const validados = itens.filter(i => (i.classificacao === "critico" || i.classificacao === "pendencia") && i.validacao === "confirmado");
  const [f, setF] = useState<typeof VAZIA>({ ...VAZIA });
  const [editando, setEditando] = useState<number | null>(null);
  const corpo = () => { const c: Record<string, unknown> = {};
    Object.entries(f).forEach(([k, v]) => { c[k] = v === "" ? null : k === "quanto" ? Number(v) : v; }); if (editando) delete c.item_id; return c; };
  const salvar = useMutation({
    mutationFn: () => editando ? api.put(`/api/diagnostico-situacional/acoes/${editando}`, corpo()) : api.post(`/api/diagnostico-situacional/diagnosticos/${diagId}/acoes`, corpo()),
    onSuccess: () => { setF({ ...VAZIA }); setEditando(null); qc.invalidateQueries({ queryKey: ["diag"] }); } });
  const excluir = useMutation({ mutationFn: (id: number) => api.delete(`/api/diagnostico-situacional/acoes/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["diag"] }) });
  const editar = (a: Acao) => { setEditando(a.id); setF({ ...VAZIA, ...Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v === null ? "" : String(v)])), item_id: a.item_id } as typeof VAZIA); };
  const c = (k: keyof typeof VAZIA, rot: string, tipo = "text") => (
    <label style={{ fontSize: 12, color: "#475569" }}>{rot}
      {tipo === "area" ? <textarea style={{ ...inp, minHeight: 50 }} value={String(f[k])} onChange={e => setF({ ...f, [k]: e.target.value })} />
        : <input type={tipo} style={inp} value={String(f[k])} onChange={e => setF({ ...f, [k]: e.target.value })} />}</label>);
  return (
    <>
      {podeEditar && (
        <div style={card}>
          <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#1f2937" }}>{editando ? "Editar ação" : "Nova ação"}</h3>
          {validados.length === 0 && !editando ? <div style={{ fontSize: 13, color: "#64748b" }}>O plano de ação parte de problemas validados: confirme um item Crítico ou Com pendência no checklist.</div> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
              {!editando && <label style={{ fontSize: 12, color: "#475569" }}>Problema validado
                <select style={inp} value={f.item_id} onChange={e => setF({ ...f, item_id: Number(e.target.value) })}>
                  <option value={0}>Selecione…</option>{validados.map(i => <option key={i.id} value={i.id}>{i.codigo} {i.titulo} ({ROT[i.classificacao]})</option>)}</select></label>}
              {c("o_que", "O quê (What)", "area")}{c("por_que", "Por quê (Why)", "area")}{c("como", "Como (How)", "area")}
              {c("onde", "Onde (Where)")}{c("quando", "Quando — prazo (When)", "date")}{c("quem", "Quem (Who)")}
              {c("quanto", "Quanto — R$ (How much)", "number")}{c("quanto_texto", "Fonte do recurso / obs. de custo")}
              {c("produto", "Produto esperado")}{c("indicador", "Indicador de acompanhamento")}{c("evidencia", "Evidência de conclusão", "area")}
              <label style={{ fontSize: 12, color: "#475569" }}>Prioridade<select style={inp} value={f.prioridade} onChange={e => setF({ ...f, prioridade: e.target.value })}>
                <option value="">—</option>{Object.entries(PRIO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
              <label style={{ fontSize: 12, color: "#475569" }}>Status<select style={inp} value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
              <div style={{ display: "flex", gap: 6, alignItems: "end" }}>
                <button style={btn()} disabled={salvar.isPending || (!editando && !f.item_id) || f.o_que.length < 3} onClick={() => salvar.mutate()}>Salvar</button>
                {editando && <button style={btn("#64748b")} onClick={() => { setEditando(null); setF({ ...VAZIA }); }}>Cancelar</button>}
              </div>
            </div>)}
          {msgErro(salvar.error) && <div style={{ color: "#b91c1c", fontSize: 12, marginTop: 6 }}>{msgErro(salvar.error)}</div>}
        </div>)}
      <div style={{ ...card, overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", minWidth: 900 }}>
          <thead><tr style={{ textAlign: "left", color: "#64748b" }}>
            <th>Problema</th><th>O quê</th><th>Por quê</th><th>Onde</th><th>Quando</th><th>Quem</th><th>Como</th><th>Quanto</th><th>Produto / indicador</th><th>Prioridade</th><th>Status</th><th></th></tr></thead>
          <tbody>{(acoes.data ?? []).map(a => (
            <tr key={a.id} style={{ borderTop: "1px solid #eee", verticalAlign: "top", background: a.atrasada ? "#fef2f2" : undefined }}>
              <td style={{ padding: "6px 4px" }}><b>{a.item_codigo}</b> {a.item_titulo}</td><td>{a.o_que}</td><td>{a.por_que ?? "—"}</td><td>{a.onde ?? "—"}</td>
              <td>{dataBr(a.quando)}{a.atrasada && <div style={{ color: "#b91c1c", fontWeight: 700 }}>atrasada</div>}</td><td>{a.quem ?? "—"}</td><td>{a.como ?? "—"}</td>
              <td>{a.quanto != null ? a.quanto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}{a.quanto_texto && <div style={{ color: "#64748b" }}>{a.quanto_texto}</div>}</td>
              <td>{a.produto ?? "—"}<div style={{ color: "#64748b" }}>{a.indicador}</div></td><td>{a.prioridade ? PRIO[a.prioridade] : "—"}</td><td>{STATUS[a.status]}</td>
              <td>{podeEditar && <><button style={{ ...btn(), padding: "2px 6px", fontSize: 11 }} onClick={() => editar(a)}>editar</button>{" "}
                <button style={{ ...btn("#94a3b8"), padding: "2px 6px", fontSize: 11 }} onClick={() => { if (confirm("Excluir esta ação?")) excluir.mutate(a.id); }}>excluir</button></>}</td>
            </tr>))}</tbody>
        </table>
        {(acoes.data ?? []).length === 0 && <div style={{ fontSize: 13, color: "#64748b", padding: 8 }}>Nenhuma ação cadastrada.</div>}
      </div>
    </>);
}

// ── Histórico e comparação ───────────────────────────────────────────────────
function Historico({ lista, atual, selecionar }: { lista: Diag[]; atual: number; selecionar: (d: Diag) => void }) {
  const outros = lista.filter(d => d.id !== atual);
  const [com, setCom] = useState<number | null>(outros[0]?.id ?? null);
  useEffect(() => { setCom(outros[0]?.id ?? null); }, [atual]); // eslint-disable-line react-hooks/exhaustive-deps
  const comp = useQuery({ queryKey: ["diag", "comparar", atual, com], enabled: !!com,
    queryFn: () => api.get(`/api/diagnostico-situacional/diagnosticos/${atual}/comparar`, { params: { com } }).then(r => r.data as Evolucao & { anterior: Diag }) });
  return (
    <>
      <div style={card}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#1f2937" }}>Diagnósticos do município</h3>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "left", color: "#64748b" }}><th>Período</th><th>Situação</th>{(Object.keys(ROT) as Classe[]).map(k => <th key={k}>{ROT[k]}</th>)}<th>Última coleta</th></tr></thead>
          <tbody>{lista.map(d => (
            <tr key={d.id} onClick={() => selecionar(d)} style={{ borderTop: "1px solid #eee", cursor: "pointer", fontWeight: d.id === atual ? 700 : 400 }}>
              <td style={{ padding: "6px 4px", color: "#1d4ed8" }}>{d.rotulo}</td><td>{d.situacao_rotulo ?? d.situacao}</td>
              {(Object.keys(ROT) as Classe[]).map(k => <td key={k} style={{ color: COR[k] }}>{d.totais?.[k] ?? 0}</td>)}<td>{dataBr(d.ultima_coleta)}</td>
            </tr>))}</tbody>
        </table>
      </div>
      <div style={card}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, color: "#1f2937" }}>Comparação entre períodos</h3>
        {outros.length === 0 ? <div style={{ fontSize: 13, color: "#64748b" }}>Gere outro diagnóstico para comparar.</div> : <>
          <select style={{ ...inp, maxWidth: 320 }} value={com ?? ""} onChange={e => setCom(Number(e.target.value))}>
            {outros.map(d => <option key={d.id} value={d.id}>{d.rotulo}</option>)}</select>
          {comp.data && <div style={{ fontSize: 13, marginTop: 8 }}>
            <div>Pioraram: <b style={{ color: "#b91c1c" }}>{comp.data.pioraram.length}</b> · Melhoraram: <b style={{ color: "#059669" }}>{comp.data.melhoraram.length}</b> · Novos críticos: <b>{comp.data.novos_criticos.length}</b></div>
            {comp.data.mudancas.map(m => <div key={m.codigo} style={{ display: "flex", gap: 6, alignItems: "center", padding: "2px 0", flexWrap: "wrap" }}><b>{m.codigo}</b> {m.titulo}: <Selo c={m.antes} /> → <Selo c={m.depois} /></div>)}
            {comp.data.mudancas.length === 0 && <div style={{ color: "#64748b" }}>Nenhuma mudança de classificação.</div>}
          </div>}
        </>}
      </div>
    </>);
}

// ── Piloto: o que tem dado, exige integração ou levantamento ─────────────────
function Fontes() {
  const q = useQuery({ queryKey: ["diag", "piloto"], queryFn: () => api.get("/api/diagnostico-situacional/piloto").then(r => r.data as {
    municipio: string; totais: Record<string, number>; areas: { area: string; nome: string; automatico: string[]; integracao: string[]; levantamento: string[] }[] }) });
  if (!q.data) return null;
  return (
    <div style={card}>
      <h3 style={{ margin: "0 0 4px", fontSize: 15, color: "#1f2937" }}>Como cada item é verificado — {q.data.municipio}</h3>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
        {q.data.totais.automatico} itens com dado automático · {q.data.totais.integracao} exigem integração · {q.data.totais.levantamento} dependem de levantamento municipal.
        Os resultados aparecem só depois que o diagnóstico é gerado e os técnicos declaram/validam.</div>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
        <thead><tr style={{ textAlign: "left", color: "#64748b" }}><th>Área</th><th>Dado automático</th><th>Exige integração</th><th>Levantamento municipal</th></tr></thead>
        <tbody>{q.data.areas.map(a => (
          <tr key={a.area} style={{ borderTop: "1px solid #eee", verticalAlign: "top" }}>
            <td style={{ padding: "6px 4px", fontWeight: 600 }}>{a.area} — {a.nome}</td>
            {(["automatico", "integracao", "levantamento"] as const).map(m => <td key={m}>{a[m].map(t => <div key={t}>{t}</div>)}{a[m].length === 0 && "—"}</td>)}
          </tr>))}</tbody></table></div>
    </div>);
}

// ── Página ───────────────────────────────────────────────────────────────────
const ANO = new Date().getFullYear();
const PERIODOS = [{ v: "anual:0", r: "Anual" }, { v: "quadrimestre:1", r: "1º quadrimestre" }, { v: "quadrimestre:2", r: "2º quadrimestre" },
  { v: "quadrimestre:3", r: "3º quadrimestre" }, { v: "semestre:1", r: "1º semestre" }, { v: "semestre:2", r: "2º semestre" }];
const PERFIS_EDICAO = ["admin", "gestor", "financeiro", "contabilidade"];

export default function DiagnosticoSituacional() {
  const auth = useAuth() as unknown as { municipio: string; municipio_uf?: string; perfil: string; administrador_geral: boolean };
  const podeEditar = auth.administrador_geral || PERFIS_EDICAO.includes(auth.perfil);
  const qc = useQueryClient();
  const [exercicio, setExercicio] = useState(ANO);
  const [periodo, setPeriodo] = useState(`quadrimestre:${Math.min(3, Math.ceil((new Date().getMonth() + 1) / 4))}`);
  const [aba, setAba] = useState<"painel" | "checklist" | "plano" | "historico" | "fontes">("painel");
  const [area, setArea] = useState("A");
  const [aberto, setAberto] = useState<string | null>(null);
  const [tipo, num] = periodo.split(":");

  const lista = useQuery({ queryKey: ["diag", "lista"], queryFn: () => api.get("/api/diagnostico-situacional/diagnosticos").then(r => r.data as { diagnosticos: Diag[] }) });
  const atual = useMemo(() => lista.data?.diagnosticos.find(d => d.exercicio === exercicio && d.periodo_tipo === tipo && d.periodo === Number(num)), [lista.data, exercicio, tipo, num]);
  const painel = useQuery({ queryKey: ["diag", "painel", atual?.id], enabled: !!atual, queryFn: () => api.get(`/api/diagnostico-situacional/diagnosticos/${atual!.id}/painel`).then(r => r.data as Painel) });
  const det = useQuery({ queryKey: ["diag", "det", atual?.id], enabled: !!atual, queryFn: () => api.get(`/api/diagnostico-situacional/diagnosticos/${atual!.id}`).then(r => r.data as Diag & { itens: Item[] }) });
  const criar = useMutation({ mutationFn: () => api.post("/api/diagnostico-situacional/diagnosticos", { exercicio, periodo_tipo: tipo, periodo: Number(num) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diag"] }) });
  const coletar = useMutation({ mutationFn: () => api.post(`/api/diagnostico-situacional/diagnosticos/${atual!.id}/coletar`), onSuccess: () => qc.invalidateQueries({ queryKey: ["diag"] }) });
  const situacao = useMutation({ mutationFn: (s: string) => api.put(`/api/diagnostico-situacional/diagnosticos/${atual!.id}`, { situacao: s }), onSuccess: () => qc.invalidateQueries({ queryKey: ["diag"] }) });
  const [baixando, setBaixando] = useState(false);
  const pdf = async () => {
    setBaixando(true);
    try {
      const r = await api.get(`/api/diagnostico-situacional/diagnosticos/${atual!.id}/relatorio.pdf`, { responseType: "blob", timeout: 120_000 });
      const url = URL.createObjectURL(r.data); const el = document.createElement("a");
      el.href = url; el.download = `diagnostico_situacional_${exercicio}_${tipo}${Number(num) || ""}.pdf`; el.click(); URL.revokeObjectURL(url);
    } finally { setBaixando(false); }
  };
  const bloqueado = atual?.situacao === "concluido";
  const abas = [["painel", "Painel executivo"], ["checklist", "Checklist por área"], ["plano", "Plano de ação 5W2H"], ["historico", "Histórico e comparação"], ["fontes", "Fontes e piloto"]] as const;

  return (
    <div style={{ padding: 20, maxWidth: 1300, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <ClipboardCheck size={24} style={{ color: "#1d4ed8" }} />
        <h1 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>Diagnóstico Situacional da Saúde Municipal</h1>
      </div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
        9 áreas de avaliação · dado automático (fontes oficiais), declarado (município) e validado (técnico) · ausência de dado = Não verificado
      </div>

      <div style={{ ...card, display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
        <label style={{ fontSize: 12, color: "#475569" }}>Município
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1f2937", padding: "6px 0" }} title="A troca de município é feita pelo cabeçalho (auditada)">
            {auth.municipio}{auth.municipio_uf ? `/${auth.municipio_uf}` : ""}</div></label>
        <label style={{ fontSize: 12, color: "#475569" }}>Exercício
          <select style={{ ...inp, width: 110 }} value={exercicio} onChange={e => { setExercicio(Number(e.target.value)); setAberto(null); }}>
            {Array.from({ length: 6 }, (_, i) => ANO - i).map(a => <option key={a} value={a}>{a}</option>)}</select></label>
        <label style={{ fontSize: 12, color: "#475569" }}>Período
          <select style={{ ...inp, width: 170 }} value={periodo} onChange={e => { setPeriodo(e.target.value); setAberto(null); }}>
            {PERIODOS.map(p => <option key={p.v} value={p.v}>{p.r}</option>)}</select></label>
        <div style={{ flex: 1 }} />
        {atual && <>
          <span style={{ fontSize: 12, color: "#64748b" }}>Situação: <b>{atual.situacao_rotulo ?? atual.situacao}</b> · última coleta {dataBr(atual.ultima_coleta)}</span>
          {podeEditar && !bloqueado && <button style={btn("#0f766e")} disabled={coletar.isPending} onClick={() => coletar.mutate()}><RefreshCw size={14} />{coletar.isPending ? "Coletando…" : "Atualizar dados automáticos"}</button>}
          {podeEditar && (bloqueado
            ? <button style={btn("#64748b")} onClick={() => situacao.mutate("em_validacao")}>Reabrir</button>
            : <button style={btn("#475569")} onClick={() => { if (confirm("Concluir o diagnóstico? As edições ficam bloqueadas até reabrir.")) situacao.mutate("concluido"); }}>Concluir</button>)}
          <button style={btn()} disabled={baixando} onClick={pdf}><Download size={14} />{baixando ? "Gerando…" : "Relatório PDF"}</button>
        </>}
      </div>

      {lista.isLoading && <div style={card}>Carregando…</div>}
      {lista.isSuccess && !atual && (
        <div style={card}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>Não há diagnóstico para {exercicio} — {PERIODOS.find(p => p.v === periodo)?.r}.</div>
          {podeEditar ? <button style={btn()} disabled={criar.isPending} onClick={() => criar.mutate()}><FileText size={14} />{criar.isPending ? "Gerando e coletando fontes…" : "Gerar diagnóstico"}</button>
            : <div style={{ fontSize: 12, color: "#64748b" }}>Seu perfil só consulta diagnósticos já gerados.</div>}
          {msgErro(criar.error) && <div style={{ color: "#b91c1c", fontSize: 12, marginTop: 6 }}>{msgErro(criar.error)}</div>}
          <div style={{ marginTop: 12 }}><Fontes /></div>
        </div>)}

      {atual && <>
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e5e5e3", marginBottom: 12, flexWrap: "wrap" }}>
          {abas.map(([k, r]) => (
            <button key={k} onClick={() => setAba(k)} style={{ background: "none", border: "none", padding: "8px 12px", cursor: "pointer", fontSize: 13,
              fontWeight: aba === k ? 700 : 500, color: aba === k ? "#1d4ed8" : "#475569", borderBottom: aba === k ? "2px solid #1d4ed8" : "2px solid transparent" }}>{r}</button>))}
        </div>
        {aba === "painel" && painel.data && <PainelExecutivo p={painel.data} irArea={a => { setArea(a); setAberto(null); setAba("checklist"); }}
          abrir={c => { setArea(c[0]); setAberto(c); setAba("checklist"); }} />}
        {aba === "checklist" && det.data && <Checklist itens={det.data.itens} area={area} setArea={setArea} aberto={aberto} setAberto={setAberto} podeEditar={podeEditar} bloqueado={bloqueado} />}
        {aba === "plano" && det.data && <Plano diagId={atual.id} itens={det.data.itens} podeEditar={podeEditar && !bloqueado} />}
        {aba === "historico" && lista.data && <Historico lista={lista.data.diagnosticos} atual={atual.id} selecionar={d => { setExercicio(d.exercicio); setPeriodo(`${d.periodo_tipo}:${d.periodo}`); setAba("painel"); }} />}
        {aba === "fontes" && <Fontes />}
      </>}
    </div>);
}
