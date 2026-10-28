// INVESTSUS 360 — Tetos municipais de emendas (PAP/MAC) e capacidade de recebimento.
// Fonte dos tetos: planilhas oficiais do FNS, lidas pelo backend
// (services/investsus_tetos.py). Nada é estimado: sem leitura, o card mostra
// "não disponível". Saldo = teto oficial − valor comprometido (um estágio por proposta).
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  RefreshCw, ExternalLink, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  Clock, Info, Landmark, Users, ClipboardList,
} from "lucide-react";

const fmt = (v: number | null | undefined) =>
  v == null ? "Não disponível" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number | null | undefined) => (v == null ? "—" : `${v.toFixed(1)}%`);
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

const MOD_ROTULO: Record<string, string> = { rp6: "RP 6", rp7: "RP 7 — Bancada", rp8: "RP 8 — Comissão", programa: "Programa" };
const ESTAGIO_ROTULO: Record<string, string> = { aprovado: "Aprovado", proposta: "Valor da proposta", indicado: "Indicado (sem proposta aprovada)", sem_valor: "Sem valor" };

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
  const corSaldo = c.saldo == null ? "#6b7280" : c.acima_do_teto ? "#dc2626" : "#047857";
  const usado = Math.min(100, Math.max(0, c.perc_utilizado ?? 0));
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

      <div>
        <div style={rotulo}>Saldo remanescente</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: corSaldo, lineHeight: 1.2 }}>{fmt(c.saldo)}</div>
        {c.acima_do_teto && <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 700 }}>Comprometido acima do teto oficial</div>}
      </div>

      {c.saldo != null && (
        <div>
          <div style={{ height: 8, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${usado}%`, height: "100%", background: c.acima_do_teto ? "#dc2626" : "#1e3a5f" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginTop: 3 }}>
            <span>Utilizado {fmtPct(c.perc_utilizado)}</span>
            <span>Disponível {fmtPct(c.perc_disponivel)}</span>
          </div>
        </div>
      )}

      <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 6 }}>
        <Linha k="Teto oficial do município" v={fmt(t.valor)} forte />
        <Linha k="Valor já comprometido no teto" v={fmt(c.comprometido)} />
        {c.grupo === "coletiva"
          ? ["rp7", "rp8"].map(m => (
              <Linha key={m} k={`  · ${MOD_ROTULO[m]}`} v={`${fmt(c.por_modalidade?.[m]?.valor ?? 0)} (${c.por_modalidade?.[m]?.qtd ?? 0})`} />
            ))
          : null}
      </div>

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
          <TabelaPropostas linhas={c.propostas} vazio="Nenhuma proposta deste exercício consome este teto." />
          {c.excluidas.length > 0 && (
            <div>
              <div style={{ ...rotulo, marginBottom: 3 }}>Canceladas / rejeitadas — não subtraídas (conferir tratamento oficial)</div>
              <TabelaPropostas linhas={c.excluidas} vazio="" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabelaPropostas({ linhas, vazio }: { linhas: any[]; vazio: string }) {
  if (!linhas.length) return vazio ? <div style={{ fontSize: 11.5, color: "#9ca3af" }}>{vazio}</div> : null;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
        <thead>
          <tr style={{ color: "#6b7280", textAlign: "left" }}>
            <th style={{ padding: "4px 6px" }}>Proposta</th>
            <th style={{ padding: "4px 6px" }}>Mod.</th>
            <th style={{ padding: "4px 6px" }}>Estágio</th>
            <th style={{ padding: "4px 6px", textAlign: "right" }}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map(l => (
            <tr key={l.id} style={{ borderTop: "1px solid #f3f4f6" }}>
              <td style={{ padding: "4px 6px", color: "#111827", fontFamily: "monospace" }} title={l.objeto ?? ""}>{l.numero_proposta}</td>
              <td style={{ padding: "4px 6px", color: "#111827" }}>{MOD_ROTULO[l.modalidade] ?? l.modalidade}</td>
              <td style={{ padding: "4px 6px", color: "#111827" }}>{ESTAGIO_ROTULO[l.estagio] ?? l.estagio}</td>
              <td style={{ padding: "4px 6px", color: "#111827", textAlign: "right", fontWeight: 700 }}>{fmt(l.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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

export default function TetosMunicipais() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["investsus-tetos"],
    queryFn: () => api.get("/api/investsus/tetos").then(r => r.data),
  });
  const atualizar = useMutation({
    mutationFn: () => api.post("/api/investsus/tetos/atualizar").then(r => r.data),
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
        <button onClick={() => atualizar.mutate()} disabled={atualizar.isPending}
          style={{ padding: "8px 14px", borderRadius: 6, border: "none", cursor: atualizar.isPending ? "wait" : "pointer", fontSize: 12.5, fontWeight: 700, background: "#1e3a5f", color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={13} className={atualizar.isPending ? "animate-spin" : ""} />
          {atualizar.isPending ? "Consultando FNS..." : "Atualizar Tetos Municipais"}
        </button>
      </div>
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
        {prog.programas.length === 0 ? (
          <div style={{ fontSize: 12, color: "#9ca3af" }}>Nenhuma proposta de programa cadastrada para {data.exercicio}.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ color: "#6b7280", textAlign: "left", background: "#f9fafb" }}>
                  <th style={{ padding: "6px 8px" }}>Programa</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>Propostas</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>Valor máximo autorizado</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>Valor já solicitado</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>Saldo passível de solicitação</th>
                </tr>
              </thead>
              <tbody>
                {prog.programas.map((g: any) => (
                  <tr key={g.programa} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "6px 8px", color: "#111827" }}>{g.programa}</td>
                    <td style={{ padding: "6px 8px", textAlign: "right", color: "#111827" }}>{g.propostas.length}</td>
                    <td style={{ padding: "6px 8px", textAlign: "right", color: "#6b7280" }}>{fmt(g.valor_maximo)}</td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: "#111827" }}>{fmt(g.valor_solicitado)}</td>
                    <td style={{ padding: "6px 8px", textAlign: "right", color: "#6b7280" }}>{fmt(g.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
