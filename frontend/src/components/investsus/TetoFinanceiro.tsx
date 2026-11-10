// INVESTSUS 360 — componentes padronizados de teto financeiro.
// Todo card de teto mostra os três indicadores lado a lado:
//   TETO TOTAL (azul) · VALOR UTILIZADO (laranja) · SALDO DISPONÍVEL (verde)
// com a fórmula Teto total − Valor utilizado = Saldo disponível e a barra de percentuais.
// Os valores vêm prontos do backend (services/investsus_tetos.py) — aqui só se exibe:
// nada é recalculado, estimado ou somado duas vezes (RP 7 + RP 8 = um teto só).
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export const COR_TETO = { teto: "#1d4ed8", utilizado: "#ea580c", saldo: "#047857", excedido: "#dc2626" };
const FUNDO_TETO = { teto: "#eff6ff", utilizado: "#fff7ed", saldo: "#ecfdf5", excedido: "#fef2f2" };

export const fmtBRL = (v: number | null | undefined) =>
  v == null ? "Não disponível" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number | null | undefined) => (v == null ? "—" : `${v.toFixed(1)}%`);

export const MOD_ROTULO: Record<string, string> = { rp6: "RP 6 — Individual", rp7: "RP 7 — Bancada", rp8: "RP 8 — Comissão", programa: "Programa" };
export const ESTAGIO_ROTULO: Record<string, string> = { aprovado: "Aprovado", proposta: "Valor da proposta", indicado: "Indicado (sem proposta aprovada)", sem_valor: "Sem valor" };
const SITUACAO_PROPOSTA = (s?: string) => (s ? s.replace(/_/g, " ").replace(/^./, c => c.toUpperCase()) : "—");

export type TetoValores = {
  teto: number | null | undefined;
  utilizado: number | null | undefined;
  saldo: number | null | undefined;
  percUtilizado?: number | null;
  percDisponivel?: number | null;
  acimaDoTeto?: boolean;
};

function Indicador({ rotulo, valor, tipo, compacto, nota }: { rotulo: string; valor: number | null | undefined; tipo: keyof typeof COR_TETO; compacto?: boolean; nota?: string }) {
  return (
    <div style={{ background: FUNDO_TETO[tipo], borderRadius: 8, padding: compacto ? "6px 8px" : "8px 10px", borderLeft: `3px solid ${COR_TETO[tipo]}`, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.4, color: COR_TETO[tipo], textTransform: "uppercase" }}>{rotulo}</div>
      <div style={{ fontSize: compacto ? 14.5 : 16.5, fontWeight: 800, color: valor == null ? "#9ca3af" : COR_TETO[tipo], lineHeight: 1.25, whiteSpace: "nowrap" }}>
        {fmtBRL(valor)}
      </div>
      {nota && <div style={{ fontSize: 10, color: "#6b7280" }}>{nota}</div>}
    </div>
  );
}

/** Os três indicadores lado a lado + barra utilizado/disponível. */
export function TetoTresValores({ v, compacto }: { v: TetoValores; compacto?: boolean }) {
  const excedido = !!v.acimaDoTeto;
  const usado = Math.min(100, Math.max(0, v.percUtilizado ?? 0));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))", gap: 6 }}>
        <Indicador rotulo="Teto total" valor={v.teto} tipo="teto" compacto={compacto} />
        <Indicador rotulo="Valor utilizado" valor={v.utilizado} tipo="utilizado" compacto={compacto}
          nota={v.teto != null ? `${fmtPct(v.percUtilizado)} do teto` : undefined} />
        <Indicador rotulo={excedido ? "Saldo (excedido)" : "Saldo disponível"} valor={v.saldo} tipo={excedido ? "excedido" : "saldo"} compacto={compacto}
          nota={v.teto != null ? `${fmtPct(v.percDisponivel)} do teto` : "sem teto oficial"} />
      </div>
      {v.teto != null ? (
        <div>
          <div style={{ display: "flex", height: 8, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${usado}%`, background: excedido ? COR_TETO.excedido : COR_TETO.utilizado }} />
            <div style={{ flex: 1, background: excedido ? COR_TETO.excedido : COR_TETO.saldo, opacity: 0.35 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginTop: 3, gap: 8, flexWrap: "wrap" }}>
            <span style={{ color: COR_TETO.utilizado, fontWeight: 600 }}>Utilizado {fmtPct(v.percUtilizado)}</span>
            <span style={{ color: excedido ? COR_TETO.excedido : COR_TETO.saldo, fontWeight: 600 }}>
              {excedido ? "Comprometido acima do teto oficial" : `Disponível ${fmtPct(v.percDisponivel)}`}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "#6b7280" }}>
          Teto oficial não disponível para este exercício — o saldo não é calculado (nenhum valor é estimado).
        </div>
      )}
      {!compacto && (
        <div style={{ fontSize: 10.5, color: "#6b7280" }}>Teto total − Valor utilizado = Saldo disponível</div>
      )}
    </div>
  );
}

/** Converte um card do endpoint /api/investsus/tetos nos três valores. */
export const valoresDoCard = (c: any): TetoValores => ({
  teto: c?.teto?.valor ?? null,
  utilizado: c?.comprometido ?? null,
  saldo: c?.saldo ?? null,
  percUtilizado: c?.perc_utilizado,
  percDisponivel: c?.perc_disponivel,
  acimaDoTeto: c?.acima_do_teto,
});

/** Memória de cálculo: propostas que comprometem o teto, com número, valor, modalidade,
 *  classificação, situação e referência oficial. */
export function TabelaPropostasTeto({ linhas, referencia, vazio }: { linhas: any[]; referencia?: string | null; vazio: string }) {
  if (!linhas.length) return vazio ? <div style={{ fontSize: 11.5, color: "#9ca3af" }}>{vazio}</div> : null;
  const th: React.CSSProperties = { padding: "4px 6px", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "4px 6px", color: "#111827", verticalAlign: "top" };
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
        <thead>
          <tr style={{ color: "#6b7280", textAlign: "left" }}>
            <th style={th}>Proposta</th>
            <th style={{ ...th, textAlign: "right" }}>Valor</th>
            <th style={th}>Modalidade</th>
            <th style={th}>Classificação</th>
            <th style={th}>Situação</th>
            <th style={th}>Estágio do valor</th>
            <th style={th}>Referência oficial</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map(l => (
            <tr key={l.id} style={{ borderTop: "1px solid #f3f4f6" }}>
              <td style={{ ...td, fontFamily: "monospace" }} title={l.objeto ?? ""}>{l.numero_proposta}</td>
              <td style={{ ...td, textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{fmtBRL(l.valor)}</td>
              <td style={td}>{MOD_ROTULO[l.modalidade] ?? l.modalidade}</td>
              <td style={td}>{l.classificacao ?? "—"}</td>
              <td style={td}>{SITUACAO_PROPOSTA(l.situacao)}</td>
              <td style={td}>{ESTAGIO_ROTULO[l.estagio] ?? l.estagio}</td>
              <td style={{ ...td, color: "#4b5563", minWidth: 180 }}>{referencia ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SITUACAO_TETO: Record<string, { label: string; cor: string }> = {
  confirmado: { label: "Confirmado", cor: "#047857" },
  pendente_validacao: { label: "Pendente de validação", cor: "#b45309" },
  nao_disponivel: { label: "Não disponível", cor: "#6b7280" },
};

/** Quadro consolidado do município: tetos, utilizado e saldo por modalidade, sem duplicidade. */
export function ResumoGerencialTetos({ resumo, exercicio }: { resumo: any; exercicio?: number }) {
  const [abrirMods, setAbrirMods] = useState(false);
  if (!resumo?.linhas?.length) return null;
  const th: React.CSSProperties = { padding: "6px 8px", textAlign: "right", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "6px 8px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" };
  const t = resumo.total;
  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Resumo gerencial dos tetos{exercicio ? ` — ${exercicio}` : ""}</div>
        <button onClick={() => setAbrirMods(v => !v)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "#1e3a5f" }}>
          {abrirMods ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Detalhar RP 7 / RP 8
        </button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ color: "#6b7280", background: "#f9fafb" }}>
              <th style={{ ...th, textAlign: "left" }}>Modalidade</th>
              <th style={{ ...th, textAlign: "left" }}>Componente</th>
              <th style={{ ...th, color: COR_TETO.teto }}>Teto total</th>
              <th style={{ ...th, color: COR_TETO.utilizado }}>Valor utilizado</th>
              <th style={{ ...th, color: COR_TETO.saldo }}>Saldo disponível</th>
              <th style={th}>% utilizado</th>
              <th style={th}>Propostas</th>
              <th style={{ ...th, textAlign: "left" }}>Situação</th>
            </tr>
          </thead>
          <tbody>
            {resumo.linhas.map((l: any) => {
              const sit = SITUACAO_TETO[l.situacao] ?? SITUACAO_TETO.nao_disponivel;
              const excedido = l.saldo != null && l.saldo < 0;
              return [
                <tr key={l.categoria} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={{ ...td, textAlign: "left", fontWeight: 600, color: "#111827", whiteSpace: "normal", minWidth: 150 }}>{l.modalidade}</td>
                  <td style={{ ...td, textAlign: "left", fontWeight: 600, color: "#374151" }}>{l.componente === "pap" ? "PAP — Atenção Primária" : "MAC — Média e Alta Complexidade"}</td>
                  <td style={{ ...td, color: l.teto == null ? "#9ca3af" : COR_TETO.teto }}>{fmtBRL(l.teto)}</td>
                  <td style={{ ...td, color: COR_TETO.utilizado }}>{fmtBRL(l.utilizado)}</td>
                  <td style={{ ...td, color: l.saldo == null ? "#9ca3af" : excedido ? COR_TETO.excedido : COR_TETO.saldo }}>{fmtBRL(l.saldo)}</td>
                  <td style={{ ...td, fontWeight: 600, color: "#374151" }}>{fmtPct(l.perc_utilizado)}</td>
                  <td style={{ ...td, fontWeight: 600, color: "#374151" }}>{l.qtd_propostas}</td>
                  <td style={{ ...td, textAlign: "left", color: sit.cor }}>{sit.label}</td>
                </tr>,
                abrirMods && l.modalidades.length > 1 ? l.modalidades.map((m: string) => (
                  <tr key={`${l.categoria}-${m}`} style={{ color: "#6b7280" }}>
                    <td style={{ ...td, textAlign: "left", fontWeight: 400, paddingLeft: 22 }}>· {MOD_ROTULO[m]}</td>
                    <td style={{ ...td, textAlign: "left", fontWeight: 400 }}>parte do teto único</td>
                    <td style={{ ...td, fontWeight: 400 }}>—</td>
                    <td style={{ ...td, fontWeight: 600, color: COR_TETO.utilizado }}>{fmtBRL(l.por_modalidade?.[m]?.valor ?? 0)}</td>
                    <td style={{ ...td, fontWeight: 400 }}>—</td>
                    <td style={{ ...td, fontWeight: 400 }}></td>
                    <td style={{ ...td, fontWeight: 400 }}>{l.por_modalidade?.[m]?.qtd ?? 0}</td>
                    <td></td>
                  </tr>
                )) : null,
              ];
            })}
            <tr style={{ borderTop: "2px solid #e5e7eb", background: "#f9fafb" }}>
              <td style={{ ...td, textAlign: "left", color: "#111827" }} colSpan={2}>Total do município</td>
              <td style={{ ...td, color: t.teto == null ? "#9ca3af" : COR_TETO.teto }}>{fmtBRL(t.teto)}</td>
              <td style={{ ...td, color: COR_TETO.utilizado }}>{fmtBRL(t.utilizado)}</td>
              <td style={{ ...td, color: t.saldo == null ? "#9ca3af" : t.saldo < 0 ? COR_TETO.excedido : COR_TETO.saldo }}>{fmtBRL(t.saldo)}</td>
              <td style={{ ...td, color: "#374151" }}>{fmtPct(t.perc_utilizado)}</td>
              <td style={{ ...td, color: "#374151" }}>{t.qtd_propostas}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 10.5, color: "#6b7280", marginTop: 6, lineHeight: 1.5 }}>
        Uma linha por teto oficial: RP 7 (bancada) e RP 8 (comissão) dividem um único teto e não são somados em duplicidade.
        Individuais e coletivas são tetos independentes. {!t.completo && "Total do teto e do saldo só aparece quando todos os tetos oficiais do exercício foram lidos."}
      </div>
    </div>
  );
}

/** Seletor de exercício usado nos painéis de teto. */
export function SeletorExercicio({ valor, anos, onChange, comTeto }: { valor: number | string; anos: number[]; onChange: (ano: number) => void; comTeto?: number[] }) {
  if (!anos?.length) return null;
  return (
    <label style={{ fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
      Exercício
      <select value={valor} onChange={e => onChange(Number(e.target.value))}
        style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12.5, background: "#fff", color: "#111827" }}>
        {anos.map(a => (
          <option key={a} value={a}>{a}{comTeto && !comTeto.includes(a) ? " (sem teto oficial cadastrado)" : ""}</option>
        ))}
      </select>
    </label>
  );
}
