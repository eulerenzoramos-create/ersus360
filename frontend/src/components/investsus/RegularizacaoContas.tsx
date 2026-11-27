// InvestSUS — aba "Regularização de Contas" (ADPF 854)
// Fonte: painel público do FNS "Regularização Contas Emendas" (Qlik), lido pelo backend
// (services/investsus_regularizacao_contas.py). Nada aqui é digitado: só o que o painel mostra.
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import {
  AlertTriangle, CheckCircle2, Clock, ExternalLink, Info, Landmark, Link2, RefreshCw, Search,
} from "lucide-react";

type Proposta = {
  id: number; numero_proposta: string; exercicio: number | null; modalidade: string | null;
  situacao: string | null; situacao_original: string | null; parlamentar: string | null;
  valor_aprovado: number; valor_pago: number; objeto: string | null;
};
type Conta = {
  id: number; cnpj: string; uf: string; municipio: string; esfera: string; banco: string;
  agencia_dv: string; conta_dv: string; nova_conta_cef: string; data_abertura: string | null;
  status_regularizacao: string; possui_pendencia: boolean; numero_emenda: string;
  numero_proposta: string; link_consulta_fns: string; historico: { em: string; de: string | null; para: string }[] | null;
  proposta: Proposta | null; divergencias: string[]; atualizado_em: string | null;
};
type Resposta = {
  fonte: string; url_painel: string;
  resumo: {
    total_contas: number; total_regularizadas: number; total_pendentes: number; total_em_acompanhamento: number;
    vinculadas: number; sem_proposta: number; com_divergencia: number; por_status: Record<string, number>;
  };
  contas: Conta[]; contas_fora_do_painel: Conta[];
  propostas_pagas_sem_conta_no_painel: { id: number; numero_proposta: string; exercicio: number | null; modalidade: string | null; valor_pago: number }[];
  ultima_coleta: { coletado_em: string; origem: string; usuario: string | null; atualizacao_bb: string | null; atualizacao_cef: string | null } | null;
  ultima_falha: { coletado_em: string; erro: string } | null;
};

const STATUS: Record<string, { label: string; cor: string; bg: string; icone: React.ReactNode }> = {
  "REGULARIZADA":             { label: "Regularizada",            cor: "#059669", bg: "#f0fdf4", icone: <CheckCircle2 size={12} /> },
  "PENDENTE":                 { label: "Pendente",                cor: "#dc2626", bg: "#fef2f2", icone: <AlertTriangle size={12} /> },
  "ABERTURA RECENTE":         { label: "Abertura recente",        cor: "#0284c7", bg: "#eff6ff", icone: <Clock size={12} /> },
  "NÃO INFORMADO PELO BANCO": { label: "Não informado pelo banco", cor: "#d97706", bg: "#fffbeb", icone: <Info size={12} /> },
};
const MODALIDADE: Record<string, string> = { rp6: "RP 6", rp7: "RP 7", rp8: "RP 8", programa: "Programa MS" };

const fmt = (v: number) => (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (iso: string | null | undefined) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");
const dataHoraBR = (iso: string | null | undefined) =>
  iso ? new Date(iso.endsWith("Z") ? iso : iso + "Z").toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

const card: React.CSSProperties = { background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16, marginBottom: 14 };
const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", fontSize: 11, fontWeight: 700, color: "#475569", background: "#f8fafc", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "8px 10px", fontSize: 12, color: "#111827", borderBottom: "1px solid #f1f5f9", verticalAlign: "top" };
const btn = (cor?: string): React.CSSProperties => ({ padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: cor ?? "#f3f4f6", color: cor ? "#fff" : "#374151", display: "flex", alignItems: "center", gap: 5 });
const input: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 6, padding: "7px 10px", fontSize: 13, outline: "none", background: "#fff" };

function KPI({ valor, label, sub, cor }: { valor: string; label: string; sub?: string; cor: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", borderTop: `3px solid ${cor}` }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: cor }}>{valor}</div>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

export function StatusConta({ status }: { status: string }) {
  const c = STATUS[status] ?? { label: status, cor: "#6b7280", bg: "#f3f4f6", icone: null };
  return (
    <span style={{ background: c.bg, color: c.cor, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4 }}>
      {c.icone} {c.label}
    </span>
  );
}

export default function RegularizacaoContas({ onAbrirProposta }: { onAbrirProposta?: (p: { id: number }) => void }) {
  const qc = useQueryClient();
  const [filtroStatus, setFiltroStatus] = useState("");
  const [busca, setBusca] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  const { data, isLoading, error } = useQuery<Resposta>({
    queryKey: ["investsus-regularizacao-contas"],
    queryFn: () => api.get("/api/investsus/regularizacao-contas").then(r => r.data),
  });

  const sinc = useMutation({
    mutationFn: () => api.post("/api/investsus/regularizacao-contas/sincronizar").then(r => r.data),
    onSuccess: (r: any) => {
      const p = r.resumo;
      setMsg({ ok: true, texto: `Painel do FNS lido: ${p.total_contas} conta(s), ${p.total_pendentes} pendente(s)`
        + (r.novas_pendencias ? ` — ${r.novas_pendencias} nova(s) pendência(s) com alerta` : "")
        + (r.alertas_encerrados ? ` — ${r.alertas_encerrados} alerta(s) encerrado(s)` : "") + "." });
      qc.invalidateQueries({ queryKey: ["investsus-regularizacao-contas"] });
      qc.invalidateQueries({ queryKey: ["investsus-alertas"] });
    },
    onError: (e: any) => setMsg({ ok: false, texto: e?.response?.data?.detail ?? "Não foi possível ler o painel do FNS agora." }),
  });

  const contas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (data?.contas ?? []).filter(c =>
      (!filtroStatus || (filtroStatus === "_divergencia" ? c.divergencias.length > 0
        : filtroStatus === "_sem_proposta" ? !c.proposta : c.status_regularizacao === filtroStatus))
      && (!q || [c.conta_dv, c.numero_emenda, c.numero_proposta, c.proposta?.parlamentar ?? ""].some(x => x.toLowerCase().includes(q))));
  }, [data, filtroStatus, busca]);

  if (isLoading) return <div style={{ ...card, color: "#6b7280", fontSize: 13 }}>Carregando contas…</div>;
  if (error) return <div style={{ ...card, color: "#b91c1c", fontSize: 13 }}>Erro ao carregar a regularização de contas.</div>;
  const r = data!.resumo;
  const semColeta = !data!.ultima_coleta;
  const pendentes = data!.contas.filter(c => c.possui_pendencia);

  return (
    <div>
      {/* Faixa de escopo — mesmo padrão do Painel de Propostas */}
      <div style={{ ...card, background: "#eff6ff", borderColor: "#bfdbfe", display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 16px" }}>
        <Info size={16} color="#1d4ed8" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12.5, color: "#1e3a5f" }}>
          <b>Regularização de contas (ADPF 854).</b> Situação de cada conta bancária de emenda parlamentar no painel
          público do FNS, filtrado por UF, município e esfera municipal. O BB e a CEF atualizam o painel semanalmente;
          o ERSUS360 lê todo dia às 06:50 e cruza cada conta com as propostas do InvestSUS.
        </div>
      </div>

      {/* Barra de ações */}
      <div style={{ ...card, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
        <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
          <div><b style={{ color: "#1e3a5f" }}>Última leitura:</b> {semColeta ? "ainda não lido" : `${dataHoraBR(data!.ultima_coleta!.coletado_em)} · ${data!.ultima_coleta!.origem === "agendado" ? "automática" : data!.ultima_coleta!.usuario ?? data!.ultima_coleta!.origem}`}</div>
          {!semColeta && (
            <div><b style={{ color: "#1e3a5f" }}>Dados do banco:</b> BB {dataBR(data!.ultima_coleta!.atualizacao_bb)} · CEF {dataBR(data!.ultima_coleta!.atualizacao_cef)}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href={data!.url_painel} target="_blank" rel="noopener noreferrer" style={{ ...btn(), textDecoration: "none" }}>
            <ExternalLink size={13} /> Abrir painel do FNS
          </a>
          <button style={btn("#1e3a5f")} disabled={sinc.isPending} onClick={() => { setMsg(null); sinc.mutate(); }}>
            <RefreshCw size={13} className={sinc.isPending ? "animate-spin" : undefined} /> {sinc.isPending ? "Lendo painel…" : "Atualizar do FNS"}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ ...card, padding: "10px 16px", background: msg.ok ? "#f0fdf4" : "#fef2f2", borderColor: msg.ok ? "#bbf7d0" : "#fecaca", color: msg.ok ? "#166534" : "#b91c1c", fontSize: 12.5, fontWeight: 600 }}>
          {msg.texto}
        </div>
      )}
      {data!.ultima_falha && (
        <div style={{ ...card, padding: "10px 16px", background: "#fffbeb", borderColor: "#fde68a", color: "#92400e", fontSize: 12 }}>
          A leitura de {dataHoraBR(data!.ultima_falha.coletado_em)} falhou ({data!.ultima_falha.erro}). Os dados abaixo são da última leitura bem-sucedida.
        </div>
      )}

      {semColeta ? (
        <div style={{ ...card, textAlign: "center", padding: 32 }}>
          <Landmark size={28} color="#94a3b8" />
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e3a5f", marginTop: 8 }}>Nenhuma leitura do painel ainda</div>
          <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 4 }}>Clique em <b>Atualizar do FNS</b> para ler as contas do município (não precisa de login).</div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 14 }}>
            <KPI valor={`${r.total_contas}`} label="Contas no painel" sub={`${r.vinculadas} vinculada(s) a propostas`} cor="#1e3a5f" />
            <KPI valor={`${r.total_regularizadas}`} label="Regularizadas"
              sub={r.total_contas ? `${((r.total_regularizadas / r.total_contas) * 100).toFixed(1)}% das contas` : undefined} cor="#059669" />
            <KPI valor={`${r.total_pendentes}`} label="Pendentes de regularização" sub={r.total_pendentes ? "alerta urgente gerado" : "nenhuma pendência"} cor={r.total_pendentes ? "#dc2626" : "#6b7280"} />
            <KPI valor={`${r.total_em_acompanhamento}`} label="Em acompanhamento" sub="abertura recente / não informado" cor="#0284c7" />
            <KPI valor={`${r.sem_proposta + r.com_divergencia}`} label="Para conferir" sub={`${r.sem_proposta} sem proposta · ${r.com_divergencia} divergência(s)`} cor={r.sem_proposta + r.com_divergencia ? "#d97706" : "#6b7280"} />
          </div>

          {/* Pendências em destaque */}
          {pendentes.length > 0 && (
            <div style={{ ...card, borderColor: "#fecaca", background: "#fff7f7" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 800, color: "#b91c1c", marginBottom: 8 }}>
                <AlertTriangle size={16} /> {pendentes.length} conta(s) pendente(s) de regularização
              </div>
              {pendentes.map(c => (
                <div key={c.id} style={{ fontSize: 12.5, color: "#374151", padding: "6px 0", borderTop: "1px dashed #fecaca" }}>
                  <b>{c.banco}</b> ag. {c.agencia_dv} c/c <b>{c.conta_dv}</b> · emenda {c.numero_emenda} · proposta{" "}
                  {c.proposta && onAbrirProposta
                    ? <a style={{ color: "#1d4ed8", cursor: "pointer", fontWeight: 600 }} onClick={() => onAbrirProposta({ id: c.proposta!.id })}>{c.numero_proposta}</a>
                    : c.numero_proposta}
                  {c.proposta?.parlamentar && <> · {c.proposta.parlamentar}</>}
                  <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>
                    Providência: regularizar a titularidade da conta junto ao banco; o painel do FNS reflete a mudança na próxima atualização semanal. Dúvidas: investsus@saude.gov.br.
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tabela */}
          <div style={card}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Situação de Regularidade de Contas</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151" }}>
                  Situação
                  <select style={input} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} aria-label="Filtrar por situação">
                    <option value="">Todas ({r.total_contas})</option>
                    {Object.entries(r.por_status).map(([k, n]) => <option key={k} value={k}>{STATUS[k]?.label ?? k} ({n})</option>)}
                    <option value="_sem_proposta">Sem proposta no InvestSUS ({r.sem_proposta})</option>
                    <option value="_divergencia">Com divergência ({r.com_divergencia})</option>
                  </select>
                </label>
                <div style={{ position: "relative" }}>
                  <Search size={13} color="#9ca3af" style={{ position: "absolute", left: 9, top: 10 }} />
                  <input style={{ ...input, paddingLeft: 28, width: 230 }} placeholder="Conta, emenda, proposta, parlamentar"
                    value={busca} onChange={e => setBusca(e.target.value)} aria-label="Buscar conta" />
                </div>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
                <thead>
                  <tr>
                    <th style={th}>Situação</th><th style={th}>Banco</th><th style={th}>Agência</th><th style={th}>Conta</th>
                    <th style={th}>Abertura</th><th style={th}>Emenda</th><th style={th}>Proposta</th>
                    <th style={th}>Proposta no InvestSUS</th><th style={th}>FNS</th>
                  </tr>
                </thead>
                <tbody>
                  {contas.map(c => (
                    <tr key={c.id} style={{ background: c.possui_pendencia ? "#fff7f7" : undefined }}>
                      <td style={td}>
                        <StatusConta status={c.status_regularizacao} />
                        {c.historico && c.historico.length > 1 && (
                          <div style={{ fontSize: 10.5, color: "#6b7280", marginTop: 3 }} title={c.historico.map(h => `${dataHoraBR(h.em)}: ${h.de ?? "—"} → ${h.para}`).join("\n")}>
                            desde {dataBR(c.historico[c.historico.length - 1].em)}
                          </div>
                        )}
                      </td>
                      <td style={td}>{c.banco}{c.nova_conta_cef && !c.nova_conta_cef.startsWith("Não se aplica") && <div style={{ fontSize: 10.5, color: "#6b7280" }}>Nova conta CEF: {c.nova_conta_cef}</div>}</td>
                      <td style={{ ...td, fontFamily: "ui-monospace, monospace" }}>{c.agencia_dv}</td>
                      <td style={{ ...td, fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>{c.conta_dv}</td>
                      <td style={td}>{dataBR(c.data_abertura)}</td>
                      <td style={{ ...td, fontFamily: "ui-monospace, monospace" }}>{c.numero_emenda}</td>
                      <td style={{ ...td, fontFamily: "ui-monospace, monospace", fontSize: 11.5 }}>{c.numero_proposta.split(";").map(p => <div key={p}>{p}</div>)}</td>
                      <td style={td}>
                        {c.proposta ? (
                          <div>
                            <a style={{ color: "#1d4ed8", cursor: onAbrirProposta ? "pointer" : undefined, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}
                              onClick={() => onAbrirProposta?.({ id: c.proposta!.id })}>
                              <Link2 size={11} /> {c.proposta.modalidade ? MODALIDADE[c.proposta.modalidade] ?? c.proposta.modalidade : "Proposta"} · {c.proposta.exercicio ?? "—"}
                            </a>
                            {c.proposta.parlamentar && <div style={{ fontSize: 11, color: "#374151" }}>{c.proposta.parlamentar}</div>}
                            <div style={{ fontSize: 10.5, color: "#6b7280" }}>Pago {fmt(c.proposta.valor_pago)}{c.proposta.situacao_original ? ` · ${c.proposta.situacao_original}` : ""}</div>
                          </div>
                        ) : <span style={{ fontSize: 11, color: "#d97706", fontWeight: 600 }}>Não encontrada no InvestSUS 360</span>}
                        {c.divergencias.map(d => <div key={d} style={{ fontSize: 10.5, color: "#b45309", marginTop: 2 }}>⚠ {d}</div>)}
                      </td>
                      <td style={td}>
                        {c.link_consulta_fns && (
                          <a href={c.link_consulta_fns} target="_blank" rel="noopener noreferrer" title="Consulta FNS da proposta" style={{ color: "#1d4ed8", display: "inline-flex" }}>
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                  {contas.length === 0 && (
                    <tr><td style={{ ...td, textAlign: "center", color: "#6b7280" }} colSpan={9}>Nenhuma conta com esse filtro.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 10 }}>
              Fonte: {data!.fonte}. Pendência = status PENDENTE no painel (gera alerta urgente em Pendências e Alertas e é encerrado quando o painel passa a mostrar a conta regularizada).
            </div>
          </div>

          {/* Conferências */}
          {(data!.propostas_pagas_sem_conta_no_painel.length > 0 || data!.contas_fora_do_painel.length > 0) && (
            <div style={card}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Para conferir</div>
              {data!.propostas_pagas_sem_conta_no_painel.length > 0 && (
                <div style={{ fontSize: 12.5, color: "#374151", marginBottom: 8 }}>
                  <b>{data!.propostas_pagas_sem_conta_no_painel.length} proposta(s) com pagamento sem conta no painel:</b>{" "}
                  {data!.propostas_pagas_sem_conta_no_painel.map((p, i) => (
                    <span key={p.id}>
                      {i > 0 && ", "}
                      <a style={{ color: "#1d4ed8", cursor: onAbrirProposta ? "pointer" : undefined }} onClick={() => onAbrirProposta?.({ id: p.id })}>{p.numero_proposta}</a>
                      {" "}({p.exercicio ?? "—"}, {fmt(p.valor_pago)})
                    </span>
                  ))}
                  <div style={{ fontSize: 11, color: "#6b7280" }}>As aberturas listadas no painel começam em 26/12/2024; propostas pagas em contas mais antigas podem não aparecer.</div>
                </div>
              )}
              {data!.contas_fora_do_painel.length > 0 && (
                <div style={{ fontSize: 12.5, color: "#374151" }}>
                  <b>{data!.contas_fora_do_painel.length} conta(s) que estavam no painel e saíram na última leitura:</b>{" "}
                  {data!.contas_fora_do_painel.map(c => `${c.conta_dv} (${STATUS[c.status_regularizacao]?.label ?? c.status_regularizacao})`).join(", ")}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
