/**
 * ConciliacaoFnsPanel — Conciliação e-Gestor APS × FNS
 * Compara competências APS com transferências fundo a fundo do FNS.
 *
 * REGRA FUNDAMENTAL: valores das duas fontes NÃO são somados.
 * São exibidos separados com status de conciliação.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle, AlertTriangle, XCircle, ExternalLink, RefreshCw,
  ChevronDown, ChevronRight, Info,
} from "lucide-react";
import { apiGet } from "../lib/api";

const C = {
  blue: "#1565c0", blueLight: "#e3f0ff",
  green: "#16a34a", greenBg: "#f0fdf4", greenBdr: "#bbf7d0",
  amber: "#d97706", amberBg: "#fffbeb", amberBdr: "#fde68a",
  red: "#dc2626", redBg: "#fef2f2", redBdr: "#fecaca",
  purple: "#7c3aed", purpleBg: "#f5f3ff",
  gray: "#6b7280", grayLight: "#f4f6f8", grayBdr: "#e4e7ec", grayBdr2: "#d1d5db",
  textPri: "#111827", textSec: "#6b7280", textMut: "#9ca3af",
  money: "#059669", white: "#ffffff", rowHover: "#f8faff", rowAlt: "#fafbfc",
};

const BRL = (v: number | null | undefined) =>
  v == null ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface LinhaConc {
  competencia_egestor: string; parcela: string; nu_parcela: string;
  mes_calendario: number | null; mes_nome: string;
  total_egestor: number; total_fns: number; diferenca: number;
  status_conciliacao: string; conciliado: boolean;
  transferencias_fns: { grupo: string; acao: string; acao_detalhada: string;
    tipo_incentivo: string; valor_total: number; valor_desconto: number; valor_liquido: number;
    data_pagamento: string | null; numero_ob: string | null }[];
}
interface ConcResponse {
  exercicio: number;
  resumo: {
    total_competencias_egestor: number; total_conciliadas: number;
    total_nao_conciliadas: number; total_fns_sem_egestor: number;
    total_egestor: number; total_fns_aps: number; diferenca_geral: number;
  };
  conciliacao_por_competencia: LinhaConc[];
  fns_sem_correspondencia_egestor: { mes: number; mes_nome: string; total_fns: number; status_conciliacao: string; transferencias_fns: unknown[] }[];
  outros_incentivos_fns: Record<string, number>;
  nota: string;
}

const STATUS_CONFIG: Record<string, { cor: string; bg: string; bdr: string; label: string; Icon: React.ElementType }> = {
  conciliado: { cor: C.green, bg: C.greenBg, bdr: C.greenBdr, label: "Conciliado", Icon: CheckCircle },
  conciliado_com_diferenca_de_agrupamento: { cor: C.amber, bg: C.amberBg, bdr: C.amberBdr, label: "Conciliado (agrupamento)", Icon: AlertTriangle },
  pagamento_nao_identificado_no_fns: { cor: C.gray, bg: C.grayLight, bdr: C.grayBdr, label: "Pag. não identificado no FNS", Icon: Info },
  valor_fns_maior_exige_analise: { cor: C.purple, bg: C.purpleBg, bdr: "#c4b5fd", label: "FNS > e-Gestor (analisar)", Icon: AlertTriangle },
  valor_divergente: { cor: C.red, bg: C.redBg, bdr: C.redBdr, label: "Valor divergente", Icon: XCircle },
  transferencia_retroativa_ou_competencia_nao_processada: { cor: C.amber, bg: C.amberBg, bdr: C.amberBdr, label: "Retroativo / Não processado", Icon: AlertTriangle },
};

function BadgeStatus({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { cor: C.gray, bg: C.grayLight, bdr: C.grayBdr, label: status, Icon: Info };
  const { cor, bg, bdr, label, Icon } = cfg;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px",
      background: bg, color: cor, border: `1px solid ${bdr}`, borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" as const }}>
      <Icon size={10} /> {label}
    </span>
  );
}

function LinhaConcilaicao({ l, idx }: { l: LinhaConc; idx: number }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const diff = l.diferenca;
  const diffColor = diff === 0 ? C.green : diff > 0 ? C.purple : C.red;

  return (
    <>
      <tr onClick={() => setOpen(o => !o)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ cursor: l.transferencias_fns.length > 0 ? "pointer" : "default",
          background: open ? C.blueLight : hover ? C.rowHover : idx % 2 === 1 ? C.rowAlt : C.white,
          borderTop: `1px solid ${C.grayBdr}`, transition: "background .12s" }}>
        <td style={{ padding: "11px 14px", fontWeight: 600, color: C.textPri }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {l.transferencias_fns.length > 0 ? (
              open ? <ChevronDown size={14} color={C.blue} /> : <ChevronRight size={14} color={C.blue} />
            ) : <span style={{ width: 14 }} />}
            {l.competencia_egestor}
          </span>
        </td>
        <td style={{ padding: "11px 14px", textAlign: "center", fontSize: 12, color: C.textSec }}>{l.parcela}</td>
        <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700, color: C.money, fontVariantNumeric: "tabular-nums" }}>
          {BRL(l.total_egestor)}
        </td>
        <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums",
          color: l.total_fns > 0 ? C.blue : C.textMut }}>
          {l.total_fns > 0 ? BRL(l.total_fns) : "Não identificado"}
        </td>
        <td style={{ padding: "11px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums",
          color: diffColor, fontWeight: 600 }}>
          {l.total_fns > 0 ? (diff >= 0 ? "+" : "") + BRL(diff) : "—"}
        </td>
        <td style={{ padding: "11px 14px", textAlign: "center" }}>
          <BadgeStatus status={l.status_conciliacao} />
        </td>
      </tr>
      {open && l.transferencias_fns.length > 0 && (
        <tr>
          <td colSpan={6} style={{ background: "#f8fafc", borderTop: `1px solid ${C.grayBdr}`, padding: "16px 28px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, marginBottom: 10,
              textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
              Transferências FNS correspondentes
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  {["Data Pagamento", "Grupo", "Ação Detalhada", "Valor Total", "Desconto", "Valor Líquido", "Nº OB"].map((h, i) => (
                    <th key={h} style={{ padding: "7px 12px", textAlign: (i >= 3 && i <= 5 ? "right" : "left") as "right" | "left",
                      fontWeight: 700, color: C.textSec, borderBottom: `1px solid ${C.grayBdr}`, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {l.transferencias_fns.map((t, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.grayBdr}` }}>
                    <td style={{ padding: "7px 12px", color: C.textSec }}>
                      {t.data_pagamento ? new Date(t.data_pagamento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td style={{ padding: "7px 12px", color: C.textPri, maxWidth: 160 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", display: "block", whiteSpace: "nowrap" as const }} title={t.grupo}>{t.grupo || "—"}</span>
                    </td>
                    <td style={{ padding: "7px 12px", color: C.textSec, maxWidth: 200 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", display: "block", whiteSpace: "nowrap" as const }} title={t.acao_detalhada}>{t.acao_detalhada || t.acao || "—"}</span>
                    </td>
                    <td style={{ padding: "7px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{BRL(t.valor_total)}</td>
                    <td style={{ padding: "7px 12px", textAlign: "right", color: C.red, fontVariantNumeric: "tabular-nums" }}>
                      {t.valor_desconto ? BRL(t.valor_desconto) : "—"}
                    </td>
                    <td style={{ padding: "7px 12px", textAlign: "right", fontWeight: 700, color: C.money, fontVariantNumeric: "tabular-nums" }}>{BRL(t.valor_liquido)}</td>
                    <td style={{ padding: "7px 12px", color: C.textMut, fontSize: 11 }}>{t.numero_ob || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ConciliacaoFnsPanel() {
  const [exercicio, setExercicio] = useState(2026);

  const { data, isLoading, error, refetch, isFetching } = useQuery<ConcResponse>({
    queryKey: ["fns-conciliacao", exercicio],
    queryFn: () => apiGet(`/api/repasses-fns/conciliacao?exercicio=${exercicio}`),
    staleTime: 300_000,
  });

  const res = data?.resumo;

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 20 }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>

      {/* Banner explicativo */}
      <div style={{ background: C.amberBg, border: `1px solid ${C.amberBdr}`, borderRadius: 10, padding: "12px 18px",
        display: "flex", alignItems: "flex-start", gap: 10 }}>
        <AlertTriangle size={16} color={C.amber} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 12, color: "#92400e" }}>
          <strong>Atenção — Perspectivas diferentes:</strong> o e-Gestor APS detalha a <em>competência</em> (componentes e equipes programados),
          enquanto o FNS registra a <em>data de crédito bancário</em> (efetivação do pagamento). Uma competência e-Gestor pode ser
          paga em mês diferente no FNS. Diferenças de agrupamento são esperadas e não indicam fraude.{" "}
          <strong>Os valores nunca são somados.</strong>
        </div>
      </div>

      {/* Controles */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.textSec }}>Exercício:</label>
        <select value={exercicio} onChange={e => setExercicio(Number(e.target.value))}
          style={{ padding: "7px 12px", border: `1px solid ${C.grayBdr}`, borderRadius: 8, fontSize: 13 }}>
          {[2026, 2025, 2024].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button onClick={() => refetch()} disabled={isFetching}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.white,
            border: `1px solid ${C.grayBdr}`, borderRadius: 8, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>
          <RefreshCw size={13} style={isFetching ? { animation: "spin 1s linear infinite" } : {}} />
          Atualizar
        </button>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: C.textSec }}>
          <RefreshCw size={28} color={C.blue} style={{ animation: "spin 1s linear infinite", marginBottom: 10 }} />
          <p style={{ margin: 0 }}>Conciliando e-Gestor APS × FNS…</p>
        </div>
      )}

      {error && (
        <div style={{ background: C.redBg, border: `1px solid ${C.redBdr}`, borderRadius: 10, padding: "14px 18px",
          color: C.red, fontSize: 13 }}>
          Não foi possível carregar a conciliação. Execute /sincronizar FNS primeiro.
        </div>
      )}

      {/* Cards de resumo */}
      {res && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
          {[
            { label: "Competências e-Gestor", val: String(res.total_competencias_egestor), cor: C.blue, bg: C.blueLight },
            { label: "Conciliadas", val: String(res.total_conciliadas), cor: C.green, bg: C.greenBg },
            { label: "Não conciliadas", val: String(res.total_nao_conciliadas), cor: C.red, bg: C.redBg },
            { label: "FNS sem e-Gestor", val: String(res.total_fns_sem_egestor), cor: C.amber, bg: C.amberBg },
            { label: "Total e-Gestor APS", val: BRL(res.total_egestor), cor: C.money, bg: C.greenBg },
            { label: "Total FNS (APS)", val: BRL(res.total_fns_aps), cor: C.blue, bg: C.blueLight },
            { label: "Diferença geral", val: BRL(res.diferenca_geral),
              cor: Math.abs(res.diferenca_geral) < 0.02 ? C.green : C.amber,
              bg: Math.abs(res.diferenca_geral) < 0.02 ? C.greenBg : C.amberBg },
          ].map(c => (
            <div key={c.label} style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textSec, textTransform: "uppercase" as const, marginBottom: 6, letterSpacing: "0.04em" }}>{c.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: c.cor, fontVariantNumeric: "tabular-nums" }}>{c.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabela de conciliação */}
      {data?.conciliacao_por_competencia && (
        <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.grayBdr}`, fontWeight: 700, fontSize: 14, color: C.textPri }}>
            Conciliação por competência — e-Gestor APS × FNS
          </div>
          <div style={{ overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f1f5f9", borderBottom: `2px solid ${C.grayBdr}` }}>
                  {["Competência (e-Gestor)", "Parcela", "Total e-Gestor", "Total FNS (APS)", "Diferença", "Status"].map((h, i) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: (i >= 2 && i <= 4 ? "right" : i === 5 ? "center" : "left") as "right" | "center" | "left",
                      fontWeight: 700, color: C.textSec, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.conciliacao_por_competencia.map((l, i) => (
                  <LinhaConcilaicao key={l.nu_parcela} l={l} idx={i} />
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid ${C.grayBdr2}`, background: "#f1f5f9" }}>
                  <td colSpan={2} style={{ padding: "11px 14px", fontWeight: 700, color: C.textPri }}>Totais</td>
                  <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 800, color: C.money, fontVariantNumeric: "tabular-nums" }}>
                    {BRL(res?.total_egestor)}
                  </td>
                  <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 800, color: C.blue, fontVariantNumeric: "tabular-nums" }}>
                    {BRL(res?.total_fns_aps)}
                  </td>
                  <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 800, color: C.amber, fontVariantNumeric: "tabular-nums" }}>
                    {res ? BRL(res.diferenca_geral) : "—"}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Outros incentivos FNS (não APS) */}
      {data?.outros_incentivos_fns && Object.keys(data.outros_incentivos_fns).length > 0 && (
        <div style={{ background: C.white, border: `1px solid ${C.grayBdr}`, borderRadius: 12, padding: "16px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.textPri, marginBottom: 12 }}>
            Outros incentivos FNS (não Atenção Primária)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            {Object.entries(data.outros_incentivos_fns).map(([tipo, valor]) => (
              <div key={tipo} style={{ background: C.grayLight, borderRadius: 8, padding: "10px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: C.textPri, fontWeight: 600 }}>{tipo}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.money, fontVariantNumeric: "tabular-nums" }}>
                  {BRL(valor as number)}
                </span>
              </div>
            ))}
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 11, color: C.textMut }}>
            Estes valores NÃO estão incluídos na conciliação com e-Gestor APS, pois correspondem a outros programas do Ministério da Saúde.
          </p>
        </div>
      )}

      {/* Nota técnica */}
      {data?.nota && (
        <div style={{ background: C.blueLight, border: `1px solid #bfdbfe`, borderRadius: 10, padding: "12px 16px",
          display: "flex", gap: 8, alignItems: "flex-start" }}>
          <Info size={14} color={C.blue} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 11, color: "#1e40af" }}>{data.nota}</p>
        </div>
      )}

      {/* Links */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const, fontSize: 11, color: C.textSec }}>
        <a href="https://consultafns.saude.gov.br" target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.blue }}>
          <ExternalLink size={10} /> consultafns.saude.gov.br
        </a>
        <a href="https://relatorioaps.saude.gov.br" target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.blue }}>
          <ExternalLink size={10} /> relatorioaps.saude.gov.br (e-Gestor APS)
        </a>
      </div>
    </div>
  );
}
