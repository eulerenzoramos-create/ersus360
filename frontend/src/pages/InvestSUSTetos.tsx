// INVESTSUS 360 — Tetos municipais de emendas (PAP/MAC) e capacidade de recebimento.
// Fonte dos tetos: planilhas oficiais do FNS, lidas pelo backend
// (services/investsus_tetos.py). Nada é estimado: sem leitura, o card mostra
// "não disponível". Saldo = teto oficial − valor comprometido (um estágio por proposta).
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { IndicadoresPrograma, SincronizacaoProgramas, TabelaPropostasProgramas, AreaSelo, AREA_ROTULO } from "../components/investsus/ProgramasMS";
import { TetoTresValores, valoresDoCard, TabelaPropostasTeto, ResumoGerencialTetos, SeletorExercicio, MOD_ROTULO, ESTAGIO_ROTULO } from "../components/investsus/TetoFinanceiro";
import {
  RefreshCw, ExternalLink, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  Clock, Info, Landmark, Users, ClipboardList,
} from "lucide-react";

const fmt = (v: number | null | undefined) =>
  v == null ? "Não disponível" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtData = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v.length === 10 ? `${v}T12:00:00` : v.endsWith("Z") || v.includes("+") ? v : `${v}Z`);
  return isNaN(d.getTime()) ? v : d.toLocaleString("pt-BR", v.length === 10 ? { dateStyle: "short" } : { dateStyle: "short", timeStyle: "short" });
};

const SITUACAO: Record<string, { label: string; cor: string; bg: string; icone: React.ReactNode }> = {
  confirmado:         { label: "Confirmado",             cor: "#047857", bg: "#ecfdf5", icone: <CheckCircle2 size={12} /> },
  pendente_validacao: { label: "Pendente de validação",  cor: "#b45309", bg: "#fffbeb", icone: <Clock size={12} /> },
  nao_disponivel:     { label: "Não disponível",         cor: "#6b7280", bg: "#f3f4f6", icone: <Info size={12} /> },
};


const card: React.CSSProperties = { background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16 };
const rotulo: React.CSSProperties = { fontSize: 11, color: "#6b7280", fontWeight: 600 };

function Selo({ situacao }: { situacao: string }) {
  const s = SITUACAO[situacao] ?? SITUACAO.nao_disponivel;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: s.bg, color: s.cor, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {s.icone} {s.label}
    </span>
  );
}

function Linha({ k, v, forte, cor }: { k: string; v: React.ReactNode; forte?: boolean; cor?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "4px 0", fontSize: 12.5 }}>
      <span style={{ color: "#4b5563" }}>{k}</span>
      <span style={{ fontWeight: forte ? 800 : 600, color: cor ?? "#111827", textAlign: "right" }}>{v}</span>
    </div>
  );
}

function CardTeto({ c }: { c: any }) {
  const [aberto, setAberto] = useState(false);
  const t = c.teto ?? {};
  const cnes: any[] = t.detalhes?.cnes ?? [];
  return (
    <div style={{ ...card, borderTop: `4px solid ${c.componente === "pap" ? "#0284c7" : "#7c3aed"}`, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>
            {c.componente === "pap" ? "PAP — Atenção Primária" : "MAC — Média e Alta Complexidade"}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>Custeio · Incremento Temporário ({c.componente === "pap" ? "ação 2E89" : "ação 2E90"})</div>
        </div>
        <Selo situacao={c.situacao} />
      </div>

      <TetoTresValores v={valoresDoCard(c)} />

      {c.grupo === "coletiva" && (
        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 6 }}>
          {["rp7", "rp8"].map(m => (
            <Linha key={m} k={`Utilizado · ${MOD_ROTULO[m]} (teto único)`} v={`${fmt(c.por_modalidade?.[m]?.valor ?? 0)} (${c.por_modalidade?.[m]?.qtd ?? 0})`} />
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: "#4b5563", background: "#f9fafb", borderRadius: 6, padding: 8, display: "flex", flexDirection: "column", gap: 3 }}>
        <div><b>Referência:</b> {t.documento ?? "—"}</div>
        <div><b>Publicação:</b> {fmtData(t.data_publicacao)} · <b>Última consulta:</b> {fmtData(t.consultado_em)}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {t.url_planilha && <a href={t.url_planilha} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", display: "inline-flex", alignItems: "center", gap: 3 }}>Planilha oficial FNS <ExternalLink size={11} /></a>}
          {t.url_pagina && <a href={t.url_pagina} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", display: "inline-flex", alignItems: "center", gap: 3 }}>Página e portaria <ExternalLink size={11} /></a>}
        </div>
        {t.erro && <div style={{ color: "#b45309" }}><AlertTriangle size={11} style={{ verticalAlign: -1 }} /> {t.erro}</div>}
      </div>

      <button onClick={() => setAberto(v => !v)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#1e3a5f" }}>
        {aberto ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Memória de cálculo e propostas ({c.propostas.length})
      </button>
      {aberto && (
        <div style={{ fontSize: 12, color: "#374151", display: "flex", flexDirection: "column", gap: 8 }}>
          <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
            {c.memoria_calculo.map((m: string, i: number) => <li key={i}>{m}</li>)}
          </ol>
          {cnes.length > 0 && (
            <div>
              <div style={{ ...rotulo, marginBottom: 3 }}>Limite por CNES (planilha MAC)</div>
              {cnes.map((x: any) => (
                <Linha key={`${x.cnes}-${x.aba}`} k={`CNES ${x.cnes} · ${x.estabelecimento ?? ""}${x.entidade_sem_fins_lucrativos ? " (sem fins lucrativos)" : ""}`} v={fmt(x.valor)} />
              ))}
            </div>
          )}
          {Object.keys(c.por_estagio ?? {}).length > 0 && (
            <div>
              <div style={{ ...rotulo, marginBottom: 3 }}>Comprometido por estágio</div>
              {Object.entries(c.por_estagio).map(([k, v]: any) => <Linha key={k} k={ESTAGIO_ROTULO[k] ?? k} v={fmt(v)} />)}
            </div>
          )}
          <div style={{ ...rotulo, marginBottom: 3 }}>Propostas que comprometem o teto</div>
          <TabelaPropostasTeto linhas={c.propostas} referencia={t.documento} vazio="Nenhuma proposta deste exercício consome este teto." />
          {c.excluidas.length > 0 && (
            <div>
              <div style={{ ...rotulo, marginBottom: 3 }}>Canceladas / rejeitadas — não subtraídas (conferir tratamento oficial)</div>
              <TabelaPropostasTeto linhas={c.excluidas} referencia={t.documento} vazio="" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Tipo como aparece na coluna "Tipo" do InvestSUS (CUSTEIO PAP / CUSTEIO MAC).
const tipoPrograma = (nome: string) => {
  const c = (nome ?? "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/MAC|MEDIA E ALTA|ESPECIALIZADA/.test(c)) return "Recurso de programa · Custeio MAC";
  if (/PAP|APS|PRIMARIA|BASICA/.test(c)) return "Recurso de programa · Custeio PAP";
  return "Recurso de programa";
};

function CardPrograma({ g, exercicio }: { g: any; exercicio: number }) {
  const [aberto, setAberto] = useState(false);
  const [editar, setEditar] = useState(false);
  const lim = g.limite;
  return (
    <div style={{ ...card, borderTop: "4px solid #0f766e", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{g.programa}</div>
          <div style={{ fontSize: 11, color: "#6b7280", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <AreaSelo area={g.area} /> {tipoPrograma(g.programa)} · {g.propostas.length} proposta(s) {exercicio}
          </div>
        </div>
        <Selo situacao={g.situacao_limite} />
      </div>
      <IndicadoresPrograma g={g} />
      <div style={{ fontSize: 11, color: "#4b5563", background: "#f9fafb", borderRadius: 6, padding: 8, display: "flex", flexDirection: "column", gap: 3 }}>
        {lim ? (
          <>
            <div><b>Referência:</b> {lim.documento}</div>
            <div><b>Registrado:</b> {fmtData(lim.registrado_em)}{lim.registrado_por ? ` · ${lim.registrado_por}` : ""}</div>
            {lim.url && <a href={lim.url} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", display: "inline-flex", alignItems: "center", gap: 3 }}>Documento oficial <ExternalLink size={11} /></a>}
            {lim.observacao && <div>{lim.observacao}</div>}
          </>
        ) : (
          <div style={{ color: "#92400e" }}>
            <AlertTriangle size={11} style={{ verticalAlign: -1 }} /> Valor máximo autorizado não registrado. Consulte a portaria/edital do
            programa ou o valor exibido no InvestSUS ao cadastrar a proposta e registre-o com a referência oficial.
          </div>
        )}
        <button onClick={() => setEditar(v => !v)} style={{ alignSelf: "flex-start", border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: 11.5, fontWeight: 700, color: "#0f766e" }}>
          {editar ? "Cancelar" : lim ? "Atualizar valor máximo autorizado" : "Registrar valor máximo autorizado"}
        </button>
        {editar && <FormLimitePrograma programa={g.programa} exercicio={exercicio} inicial={lim} onFim={() => setEditar(false)} />}
      </div>
      <button onClick={() => setAberto(v => !v)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#1e3a5f" }}>
        {aberto ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Memória de cálculo e propostas ({g.propostas.length})
      </button>
      {aberto && (
        <div style={{ fontSize: 12, color: "#374151", display: "flex", flexDirection: "column", gap: 8 }}>
          <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
            {(g.memoria_calculo ?? []).map((m: string, i: number) => <li key={i}>{m}</li>)}
          </ol>
          <TabelaPropostasTeto linhas={g.propostas} referencia={lim?.documento ?? "Valor máximo não registrado"} vazio="Nenhuma proposta deste exercício neste programa." />
          {g.excluidas?.length > 0 && (
            <div>
              <div style={{ ...rotulo, marginBottom: 3 }}>Canceladas / rejeitadas — não subtraídas</div>
              <TabelaPropostasTeto linhas={g.excluidas} referencia={lim?.documento} vazio="" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// "1.234.567,89" ou "1234567.89" → número; texto inválido → NaN.
const parseBRL = (t: string) => {
  const v = t.replace(/[R$\s]/g, "");
  if (v.includes(",")) return Number(v.replace(/\./g, "").replace(",", "."));
  return /^\d+(\.\d{1,2})?$/.test(v) ? Number(v) : Number(v.replace(/\./g, ""));
};

const inp: React.CSSProperties = { padding: "5px 8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, background: "#fff", color: "#111827", minWidth: 0 };

function FormLimitePrograma({ programa, exercicio, inicial, onFim, editarNome }: { programa: string; exercicio: number; inicial?: any; onFim: () => void; editarNome?: boolean }) {
  const qc = useQueryClient();
  const [nome, setNome] = useState(programa);
  const [valor, setValor] = useState(inicial?.valor != null ? String(inicial.valor).replace(".", ",") : "");
  const [documento, setDocumento] = useState(inicial?.documento ?? "");
  const [url, setUrl] = useState(inicial?.url ?? "");
  const [observacao, setObservacao] = useState(inicial?.observacao ?? "");
  const salvar = useMutation({
    mutationFn: () => api.post("/api/investsus/tetos/programas/limite", {
      programa: nome, exercicio, documento, url, observacao,
      valor: parseBRL(valor),
    }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["investsus-tetos"] }); onFim(); },
  });
  const valido = nome.trim() && documento.trim() && parseBRL(valor) > 0;
  const erro = (salvar.error as any)?.response?.data?.detail;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 6, marginTop: 4 }}>
      {editarNome && <input style={inp} placeholder="Programa (como aparece no InvestSUS)" value={nome} onChange={e => setNome(e.target.value)} />}
      <input style={inp} placeholder={`Valor máximo autorizado ${exercicio} (R$)`} inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)} />
      <input style={inp} placeholder="Referência oficial (portaria/edital ou tela InvestSUS)" value={documento} onChange={e => setDocumento(e.target.value)} />
      <input style={inp} placeholder="Link do documento (opcional)" value={url} onChange={e => setUrl(e.target.value)} />
      <input style={inp} placeholder="Observação (opcional)" value={observacao} onChange={e => setObservacao(e.target.value)} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button disabled={!valido || salvar.isPending} onClick={() => salvar.mutate()}
          style={{ padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700, background: valido ? "#0f766e" : "#9ca3af", color: "#fff", cursor: valido ? "pointer" : "not-allowed" }}>
          {salvar.isPending ? "Salvando..." : "Salvar"}
        </button>
        {erro && <span style={{ color: "#b91c1c", fontSize: 11 }}>{String(erro)}</span>}
      </div>
      <div style={{ gridColumn: "1 / -1", fontSize: 10.5, color: "#6b7280" }}>
        O valor anterior não é apagado: fica no histórico do registro. Use somente o valor publicado na portaria/edital ou exibido no InvestSUS.
      </div>
    </div>
  );
}

function NovoLimitePrograma({ exercicio }: { exercicio: number }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div style={{ marginTop: 10, fontSize: 12 }}>
      <button onClick={() => setAberto(v => !v)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#0f766e" }}>
        {aberto ? "Cancelar" : "+ Registrar limite de outro programa"}
      </button>
      {aberto && <FormLimitePrograma programa="" exercicio={exercicio} onFim={() => setAberto(false)} editarNome />}
    </div>
  );
}

function Grupo({ titulo, sub, icone, cards }: { titulo: string; sub: string; icone: React.ReactNode; cards: any[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icone}
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{titulo}</div>
          <div style={{ fontSize: 11.5, color: "#6b7280" }}>{sub}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {cards.map(c => <CardTeto key={c.categoria} c={c} />)}
      </div>
    </div>
  );
}

export default function TetosMunicipais({ onSincronizar }: { onSincronizar?: () => void } = {}) {
  const qc = useQueryClient();
  const [exercicio, setExercicio] = useState<number | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["investsus-tetos", "recursos", exercicio],
    queryFn: () => api.get(`/api/investsus/tetos${exercicio ? `?exercicio=${exercicio}` : ""}`).then(r => r.data),
    placeholderData: (anterior: any) => anterior,
  });
  const atualizar = useMutation({
    mutationFn: () => api.post(`/api/investsus/tetos/atualizar?exercicio=${data?.exercicio ?? ""}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investsus-tetos"] }),
  });

  if (isLoading) return <div style={{ ...card, color: "#9ca3af", fontSize: 12 }}>Carregando tetos municipais...</div>;
  if (error || !data) return <div style={{ ...card, color: "#b45309", fontSize: 12 }}>Não foi possível carregar os tetos municipais.</div>;

  const cards: any[] = data.cards ?? [];
  const ind = cards.filter(c => c.grupo === "individual");
  const col = cards.filter(c => c.grupo === "coletiva");
  const pendInd = data.a_classificar?.individual ?? [];
  const pendCol = data.a_classificar?.coletiva ?? [];
  const semMod = data.sem_modalidade ?? [];
  const prog = data.programacao ?? { programas: [] };
  const erroAtualizar = (atualizar.error as any)?.response?.data?.detail ?? (atualizar.error ? "Falha ao consultar o FNS." : null);
  const falhas = (atualizar.data?.resultados ?? []).filter((r: any) => r.erro);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 18 }}>
      {/* Cabeçalho */}
      <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", background: "#f8fafc" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1e3a5f" }}>Capacidade de recebimento — tetos municipais {data.exercicio}</div>
          <div style={{ fontSize: 12, color: "#4b5563", maxWidth: 760 }}>
            Quanto o município ainda pode receber em novas indicações de custeio (Incremento Temporário PAP/MAC):
            saldo = teto oficial publicado pelo FNS − valor já comprometido nas propostas do exercício.
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Última consulta ao FNS: {fmtData(data.ultima_consulta)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <SeletorExercicio valor={data.exercicio} anos={data.exercicios_disponiveis ?? [data.exercicio]}
          comTeto={data.exercicios_com_teto_oficial} onChange={setExercicio} />
        <button onClick={() => atualizar.mutate()} disabled={atualizar.isPending || !(data.exercicios_com_teto_oficial ?? [data.exercicio]).includes(data.exercicio)}
          title={(data.exercicios_com_teto_oficial ?? [data.exercicio]).includes(data.exercicio) ? "" : "Sem planilha oficial do FNS cadastrada para este exercício"}
          style={{ padding: "8px 14px", borderRadius: 6, border: "none", cursor: atualizar.isPending ? "wait" : "pointer", fontSize: 12.5, fontWeight: 700, background: "#1e3a5f", color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={13} className={atualizar.isPending ? "animate-spin" : ""} />
          {atualizar.isPending ? "Consultando FNS..." : "Atualizar Tetos Municipais"}
        </button>
        </div>
      </div>
      {!(data.exercicios_com_teto_oficial ?? [data.exercicio]).includes(data.exercicio) && (
        <div style={{ ...card, background: "#f8fafc", fontSize: 12, color: "#374151" }}>
          <Info size={12} style={{ verticalAlign: -1 }} /> Ainda não há planilha oficial do FNS cadastrada no ERSUS360 para o exercício {data.exercicio}.
          O valor utilizado pelas propostas de {data.exercicio} aparece normalmente; teto e saldo ficam "Não disponível" até a planilha oficial do exercício ser cadastrada — nenhum valor é estimado.
        </div>
      )}
      {erroAtualizar && <div style={{ ...card, color: "#b91c1c", fontSize: 12, background: "#fef2f2" }}>{String(erroAtualizar)}</div>}
      {falhas.length > 0 && (
        <div style={{ ...card, color: "#b45309", fontSize: 12, background: "#fffbeb" }}>
          {falhas.map((f: any) => <div key={f.categoria}>{f.categoria}: {f.erro}</div>)}
        </div>
      )}

      {(pendInd.length > 0 || pendCol.length > 0 || semMod.length > 0) && (
        <div style={{ ...card, background: "#fffbeb", borderColor: "#fde68a", fontSize: 12, color: "#92400e" }}>
          <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}><AlertTriangle size={13} /> Propostas fora do cálculo — o saldo fica pendente de validação</div>
          {pendInd.length > 0 && <div>{pendInd.length} emenda(s) individual(is) {data.exercicio} sem componente identificado (PAP/MAC, custeio ou investimento): {pendInd.map((p: any) => p.numero_proposta).join(", ")}.</div>}
          {pendCol.length > 0 && <div>{pendCol.length} emenda(s) coletiva(s) {data.exercicio} sem componente identificado: {pendCol.map((p: any) => p.numero_proposta).join(", ")}.</div>}
          {semMod.length > 0 && <div>{semMod.length} proposta(s) de Incremento PAP/MAC sem modalidade (RP 6/7/8) definida: {semMod.map((p: any) => p.numero_proposta).join(", ")}.</div>}
          <div style={{ marginTop: 4 }}>Sincronize os detalhes (ação orçamentária) ou classifique a proposta para que entre no teto correto.</div>
        </div>
      )}

      <ResumoGerencialTetos resumo={data.resumo} exercicio={data.exercicio} />

      <Grupo titulo="Emendas individuais (RP 6)" sub="Portaria GM/MS nº 10.297/2026 · teto próprio, independente das coletivas"
        icone={<Users size={18} color="#1e3a5f" />} cards={ind} />
      <Grupo titulo="Emendas coletivas (RP 7 bancada + RP 8 comissão)" sub="Portaria GM/MS nº 8.283/2025 (red. 10.352/2026) · bancada e comissão dividem um teto único"
        icone={<Landmark size={18} color="#1e3a5f" />} cards={col} />

      {/* Recursos de programação */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: 6 }}>
            <ClipboardList size={16} /> Recursos de programação do Ministério da Saúde ({data.exercicio})
          </div>
          <Selo situacao={prog.situacao} />
        </div>
        <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 10 }}>{prog.nota}</div>
        <div style={{ marginBottom: 12 }}>
          <SincronizacaoProgramas sinc={data.sincronizacao} onSincronizar={onSincronizar} />
        </div>
        {prog.programas.length === 0 ? (
          <div style={{ fontSize: 12, color: "#9ca3af" }}>Nenhuma proposta de programa cadastrada para {data.exercicio}.</div>
        ) : (
          (["pap", "mac", "outros", "misto"] as const).map(area => {
            const gs = prog.programas.filter((g: any) => (g.area ?? "outros") === area);
            if (!gs.length) return null;
            return (
              <div key={area} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: AREA_ROTULO[area].cor, margin: "4px 0 8px" }}>
                  {AREA_ROTULO[area].label} ({gs.length} programa{gs.length !== 1 ? "s" : ""})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(460px, 100%), 1fr))", gap: 12 }}>
                  {gs.map((g: any) => <CardPrograma key={g.programa} g={g} exercicio={data.exercicio} />)}
                </div>
              </div>
            );
          })
        )}
        <NovoLimitePrograma exercicio={data.exercicio} />
        <div style={{ marginTop: 14, borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
          <TabelaPropostasProgramas programas={prog.programas} />
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>
        <b>Como o saldo é calculado:</b> cada proposta entra uma única vez, pelo estágio mais avançado de valor
        (aprovado → valor da proposta → indicado); empenhado e pago não são somados de novo. Só o custeio
        Incremento Temporário (ações 2E89/2E90) consome teto; investimento não. Canceladas e rejeitadas não são
        subtraídas e aparecem à parte para conferência. {data.propostas_outros_exercicios > 0 && `${data.propostas_outros_exercicios} proposta(s) de outros exercícios não entram no teto de ${data.exercicio}.`}
      </div>
    </div>
  );
}
