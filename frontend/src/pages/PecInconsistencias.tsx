// Inconsistências de envio do PEC — relatório de inconsistências do recebimento de fichas no e-SUS PEC,
// agregado pelo agente local (tipo de ficha × CNES × situação × tipo de erro). Nenhum dado de cidadão.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileWarning, Info } from "lucide-react";
import { api } from "../lib/api";

interface Erro { tipo_ficha: string; cnes: string | null; tipo_erro: string; mensagem: string | null; quantidade: number }
interface Registro { tipo_ficha: string; cnes: string | null; situacao: string; quantidade: number }
interface Painel {
  status: "ok" | "aguardando_agente"; competencias: string[]; agente: string; fonte?: string;
  lote: null | {
    competencia: string; recebido_em: string | null; gerado_em: string | null; pec_versao: string | null;
    periodo: { inicio: string; fim: string } | null; totais: { lotes: number; registros: number } | null;
    por_situacao: { situacao: string; quantidade: number }[]; por_tipo_ficha: Registro[]; erros: Erro[];
  };
}

const card: React.CSSProperties = { background: "#fff", color: "#1f2937", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 12 };
const th: React.CSSProperties = { textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontWeight: 600 };
const td: React.CSSProperties = { padding: "6px 8px", borderBottom: "1px solid #f3f4f6", verticalAlign: "top" };
const ROTULO_ERRO: Record<string, string> = {
  campo_nao_preenchido: "Campo obrigatório não preenchido", campo_invalido: "Campo inválido",
  regra: "Regra de validação negada", sem_detalhe: "Sem detalhe no PEC",
};
const ESTADO_AGENTE: Record<string, string> = {
  sem_agente: "Agente local ainda não instalado", conectado: "Agente conectado", atualizado: "Agente atualizado",
  desatualizado: "Agente desatualizado", offline: "Agente sem contato", erro: "Agente com erro no banco do PEC",
};
const competenciaBr = (c: string) => c.split("-").reverse().join("/");
const dataHora = (d?: string | null) => (d ? new Date(d).toLocaleString("pt-BR") : "—");
const corSituacao = (s: string) => (s === "Completo" ? "#16a34a" : s === "Repetido" ? "#6b7280" : "#dc2626");

export default function PecInconsistencias() {
  const [competencia, setCompetencia] = useState("");
  const q = useQuery({
    queryKey: ["pec-inconsistencias", competencia],
    queryFn: () => api.get<Painel>("/api/pec-agente/inconsistencias/painel", { params: { competencia } }).then(r => r.data),
    staleTime: 60_000,
    placeholderData: prev => prev,   // troca de competência sem a tela piscar
  });
  const p = q.data;
  const l = p?.lote;
  const comProblema = (l?.por_situacao ?? []).filter(s => s.situacao !== "Completo" && s.situacao !== "Repetido")
    .reduce((a, s) => a + s.quantidade, 0);

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 22, margin: "0 0 4px", color: "#1f2937" }}>
        <FileWarning size={22} /> Inconsistências de envio do PEC
      </h1>
      <p style={{ color: "#6b7280", margin: "0 0 16px" }}>
        Relatório de inconsistências do recebimento de fichas no e-SUS PEC (CDS, aplicativos e sistemas próprios ou de terceiros),
        por competência, tipo de ficha e unidade (CNES).
      </p>

      {q.isLoading && <div style={card}>Carregando…</div>}
      {q.isError && <div style={{ ...card, color: "#dc2626" }}>Não foi possível consultar o relatório.</div>}

      {p && !l && (
        <div style={{ ...card, borderLeft: "4px solid #d97706" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#d97706" }}>
            <AlertTriangle size={18} /> Aguardando o agente local (PEC_SYNC_AGENT)
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 14 }}>
            {ESTADO_AGENTE[p.agente] ?? p.agente}. O relatório aparece aqui depois que o agente ler o PEC.
            Nenhum número é exibido antes disso.
          </p>
        </div>
      )}

      {l && (
        <>
          <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
            <label style={{ fontSize: 14 }}>
              Competência{" "}
              <select value={competencia || l.competencia} onChange={e => setCompetencia(e.target.value)}
                style={{ marginLeft: 6, padding: "4px 8px", borderRadius: 6, border: "1px solid #d1d5db" }}>
                {p!.competencias.map(c => <option key={c} value={c}>{competenciaBr(c)}</option>)}
              </select>
            </label>
            <div><div style={{ fontSize: 12, color: "#6b7280" }}>Lotes recebidos</div><div style={{ fontSize: 22, fontWeight: 700 }}>{l.totais?.lotes ?? 0}</div></div>
            <div><div style={{ fontSize: 12, color: "#6b7280" }}>Registros</div><div style={{ fontSize: 22, fontWeight: 700 }}>{l.totais?.registros ?? 0}</div></div>
            <div><div style={{ fontSize: 12, color: "#6b7280" }}>Com problema</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: comProblema ? "#dc2626" : "#16a34a" }}>{comProblema}</div></div>
            <div style={{ fontSize: 12, color: "#6b7280", marginLeft: "auto" }}>
              Lido no PEC em {dataHora(l.gerado_em)}{l.pec_versao ? ` · PEC ${l.pec_versao}` : ""}
            </div>
          </div>

          {(l.totais?.registros ?? 0) === 0 ? (
            <div style={{ ...card, borderLeft: "4px solid #16a34a" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#16a34a" }}>
                <CheckCircle2 size={18} /> Nenhuma ficha recebida pelo PEC nesta competência
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 14 }}>
                O PEC não registrou recebimento de lotes (CDS, aplicativos ou integrações) entre {l.periodo?.inicio?.split("-").reverse().join("/")} e {l.periodo?.fim?.split("-").reverse().join("/")}.
              </p>
            </div>
          ) : (
            <>
              <div style={card}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Situação dos registros recebidos</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {l.por_situacao.map(s => (
                    <span key={s.situacao} style={{ border: `1px solid ${corSituacao(s.situacao)}`, color: corSituacao(s.situacao),
                      borderRadius: 999, padding: "2px 10px", fontSize: 13 }}>{s.situacao}: <b>{s.quantidade}</b></span>
                  ))}
                </div>
              </div>

              <div style={card}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Erros de validação ({l.erros.length})</div>
                {l.erros.length === 0 ? <div style={{ fontSize: 14, color: "#16a34a" }}>Nenhum erro de validação registrado.</div> : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead><tr><th style={th}>Tipo de ficha</th><th style={th}>CNES</th><th style={th}>Tipo de erro</th><th style={th}>Mensagem do PEC</th><th style={{ ...th, textAlign: "right" }}>Qtd.</th></tr></thead>
                      <tbody>{l.erros.map((e, i) => (
                        <tr key={i}><td style={td}>{e.tipo_ficha}</td><td style={td}>{e.cnes ?? "—"}</td>
                          <td style={td}>{ROTULO_ERRO[e.tipo_erro] ?? e.tipo_erro}</td><td style={td}>{e.mensagem ?? "—"}</td>
                          <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{e.quantidade}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={card}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Registros por tipo de ficha e unidade</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead><tr><th style={th}>Tipo de ficha</th><th style={th}>CNES</th><th style={th}>Situação</th><th style={{ ...th, textAlign: "right" }}>Qtd.</th></tr></thead>
                    <tbody>{l.por_tipo_ficha.map((r, i) => (
                      <tr key={i}><td style={td}>{r.tipo_ficha}</td><td style={td}>{r.cnes ?? "—"}</td>
                        <td style={{ ...td, color: corSituacao(r.situacao) }}>{r.situacao}</td>
                        <td style={{ ...td, textAlign: "right" }}>{r.quantidade}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, marginBottom: 6 }}><Info size={16} /> Como funciona</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
          <li>O agente local lê no PEC, somente leitura, o relatório de inconsistências do recebimento de fichas e envia só contagens.</li>
          <li>Não saem do PEC: nome ou identificação de quem enviou, identificador da ficha, nome do arquivo nem conteúdo das fichas.
            Nas mensagens, números longos (CPF, CNS) aparecem como ###.</li>
          <li>Registro "Inválido" ou "Incompleto" precisa ser corrigido no sistema que gerou a ficha e reenviado ao PEC.</li>
        </ul>
        {p?.fonte && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>Fonte: {p.fonte}</div>}
      </div>
    </div>
  );
}
