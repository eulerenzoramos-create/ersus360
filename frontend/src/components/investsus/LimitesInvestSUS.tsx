// Tela "Limites" do InvestSUS dentro do ERSUS360: os tipos de limite do exercício
// (8 em 2026) com as mesmas colunas — Limite · Valor Indicado · Limite a Indicar.
// Os valores vêm da API oficial lida pelo navegador logado no gov.br (relay.ts);
// nada é calculado aqui. Os quatro "Incremento ao custeio" validam os cards de teto.
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "../../lib/api";
import { capturarLimites } from "./relay";
import { COR_TETO, fmtBRL } from "./TetoFinanceiro";

const CAT_ROTULO: Record<string, string> = {
  individual_pap: "Teto RP 6 · PAP", individual_mac: "Teto RP 6 · MAC",
  coletiva_pap: "Teto RP 7+8 · PAP", coletiva_mac: "Teto RP 7+8 · MAC",
};

const fmtData = (iso?: string | null) => (iso ? new Date(iso.endsWith("Z") ? iso : iso + "Z").toLocaleString("pt-BR") : "nunca");

export function LimitesInvestSUS({ exercicio, limites, cards }: { exercicio: number; limites: any[]; cards?: any[] }) {
  const qc = useQueryClient();
  const [sel, setSel] = useState<string>("todos");
  const [estado, setEstado] = useState<"" | "rodando" | "sem_sessao">("");
  const [progresso, setProgresso] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const { data: escopo } = useQuery({ queryKey: ["investsus-escopo-limites"], queryFn: () => api.get("/api/investsus/escopo").then(r => r.data) });
  const fundo = escopo?.fundo;
  const pronto = !!(fundo?.cnpj && fundo?.contexto_investsus);

  const atualizar = async () => {
    if (!pronto) return;
    setEstado("rodando"); setErro(null);
    try {
      const tipos = await capturarLimites(fundo.cnpj, fundo.contexto_investsus, exercicio, setProgresso);
      if (!tipos.length) throw new Error("O InvestSUS não devolveu nenhum tipo de limite.");
      setProgresso("Gravando no ERSUS360…");
      await api.post("/api/investsus/limites/sincronizar", { exercicio, tipos });
      await qc.invalidateQueries({ queryKey: ["investsus-tetos"] });
      setEstado("");
    } catch (e: any) {
      if (e?.message === "SEM_SESSAO") { setEstado("sem_sessao"); return; }
      setErro(e?.response?.data?.detail || e?.message || "Não foi possível ler os limites.");
      setEstado("");
    } finally {
      setProgresso("");
    }
  };

  const capturas = limites.map(l => l.capturado_em).filter(Boolean).sort();
  const ultima = capturas.length ? capturas[capturas.length - 1] : null;
  const atual = sel === "todos" ? null : limites.find(l => l.descricao === sel);
  const confDe = (cat?: string | null) => (cat ? cards?.find(c => c.categoria === cat)?.investsus_limites : null);

  const th: React.CSSProperties = { background: "#1aa7e9", color: "#fff", fontSize: 11.5, fontWeight: 700, padding: "9px 10px", textAlign: "center", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "8px 10px", fontSize: 12.5, borderTop: "1px solid #e5e7eb", color: "#111827" };
  const num: React.CSSProperties = { ...td, textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Limites do InvestSUS — {exercicio}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            Mesma tela "Limites" do InvestSUS · Limite − Valor Indicado = Limite a Indicar · última leitura: {fmtData(ultima)}
          </div>
        </div>
        <button onClick={atualizar} disabled={!pronto || estado === "rodando"}
          title={pronto ? "Lê a tela Limites do InvestSUS (precisa estar logado no gov.br em outra aba)" : "CNPJ do Fundo não cadastrado"}
          style={{ padding: "8px 14px", borderRadius: 6, border: "none", fontSize: 12.5, fontWeight: 700, color: "#fff",
            background: !pronto || estado === "rodando" ? "#9ca3af" : "#1aa7e9", cursor: !pronto || estado === "rodando" ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={13} style={{ animation: estado === "rodando" ? "spin 1s linear infinite" : "none" }} />
          {estado === "rodando" ? (progresso || "Lendo…") : "Atualizar Limites"}
        </button>
      </div>

      {estado === "sem_sessao" && (
        <div role="alert" style={{ background: "#fffbeb", color: "#78350f", border: "1px solid #fde68a", borderRadius: 8, padding: 10, fontSize: 12 }}>
          Você não está logado no InvestSUS neste navegador.{" "}
          <a href="https://investsus.saude.gov.br" target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", fontWeight: 600 }}>Abrir o InvestSUS ↗</a>,
          entre com o gov.br, volte para esta aba e clique de novo em <strong>Atualizar Limites</strong>.
        </div>
      )}
      {erro && <div role="alert" style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 8, padding: 10, fontSize: 12 }}>{erro}</div>}

      {!limites.length ? (
        <div style={{ fontSize: 12, color: "#6b7280", background: "#f8fafc", borderRadius: 8, padding: 12 }}>
          A tela Limites de {exercicio} ainda não foi lida. Entre no InvestSUS com o gov.br em outra aba e clique em
          <strong> Atualizar Limites</strong> — os 8 tipos de limite (Incremento PAP/MAC individuais e coletivas, Agora Tem
          Especialistas, Custeio PAP, Custeio MAC e Rede Sarah) aparecem aqui com os valores oficiais.
        </div>
      ) : (
        <>
          <select value={sel} onChange={e => setSel(e.target.value)}
            style={{ padding: "10px 12px", borderRadius: 6, border: "1px solid #d0e3f4", fontSize: 12.5, fontWeight: 700, color: "#111827", background: "#fff" }}>
            <option value="todos">TODOS OS LIMITES ({limites.length})</option>
            {limites.map(l => <option key={l.descricao} value={l.descricao}>{l.descricao}</option>)}
          </select>

          <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...th, textAlign: "left" }}>{atual ? (atual.tipo_limite === "CNES" ? "Estabelecimento" : "Município") : "Tipo de limite"}</th>
                  <th style={th}>Limite</th>
                  <th style={th}>Valor Indicado</th>
                  <th style={th}>Limite a Indicar</th>
                  {!atual && <th style={th}>Conferência ERSUS360</th>}
                </tr>
              </thead>
              <tbody>
                {atual ? (
                  atual.linhas.length ? atual.linhas.map((x: any, i: number) => (
                    <tr key={i}>
                      <td style={td}>{x.nome ?? "—"}{x.cnes ? ` (CNES ${x.cnes})` : ""}</td>
                      <td style={num}>{x.compartilhado_secretaria ? <span style={{ color: "#6b7280" }}>Compartilhado com a secretaria</span> : fmtBRL(x.limite)}</td>
                      <td style={num}>{fmtBRL(x.valor_indicado)}</td>
                      <td style={{ ...num, fontWeight: 800, color: "#16a34a" }}>{fmtBRL(x.limite_a_indicar)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} style={{ ...td, color: "#6b7280", textAlign: "center" }}>Nenhum limite para o Fundo neste tipo em {exercicio}.</td></tr>
                  )
                ) : limites.map(l => {
                  const conf = confDe(l.categoria);
                  return (
                    <tr key={l.descricao} style={{ cursor: "pointer" }} onClick={() => setSel(l.descricao)}>
                      <td style={{ ...td, fontWeight: 600 }}>{l.descricao}</td>
                      <td style={num}>{l.linhas?.length ? fmtBRL(l.limite) : "—"}</td>
                      <td style={num}>{l.linhas?.length ? fmtBRL(l.valor_indicado) : "—"}</td>
                      <td style={{ ...num, fontWeight: 800, color: "#16a34a" }}>{l.linhas?.length ? fmtBRL(l.limite_a_indicar) : "—"}</td>
                      <td style={{ ...td, fontSize: 11.5 }}>
                        {!l.categoria ? <span style={{ color: "#6b7280" }}>Programa · {l.area === "pap" ? "PAP" : l.area === "mac" ? "MAC" : "outros"}</span>
                          : !conf?.disponivel ? <span style={{ color: "#6b7280" }}>{CAT_ROTULO[l.categoria]}</span>
                          : conf.validado ? <span style={{ color: COR_TETO.saldo, fontWeight: 700 }}><CheckCircle2 size={12} style={{ verticalAlign: -2 }} /> {CAT_ROTULO[l.categoria]} confere</span>
                          : <span style={{ color: "#b45309", fontWeight: 700 }} title={[
                              !conf.limite_confere && `Teto FNS difere do Limite em ${fmtBRL(conf.diferenca_limite)}`,
                              !conf.indicado_confere && `Utilizado ERSUS360 difere do Valor Indicado em ${fmtBRL(conf.diferenca_indicado)}`,
                            ].filter(Boolean).join(" · ")}>
                              <AlertTriangle size={12} style={{ verticalAlign: -2 }} /> {CAT_ROTULO[l.categoria]} diverge
                            </span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!atual && <div style={{ fontSize: 10.5, color: "#6b7280" }}>Clique numa linha para ver o detalhe por município/estabelecimento, como no InvestSUS.</div>}
        </>
      )}
    </div>
  );
}
