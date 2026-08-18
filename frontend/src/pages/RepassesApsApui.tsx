/**
 * RepassesApsApui — Módulo de Repasses Financeiros da APS — Apuí/AM
 * Fonte: API oficial e-Gestor APS (relatorioaps-prd.saude.gov.br)
 * Todos os valores são obtidos em tempo real da fonte oficial.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown, ChevronRight, CheckCircle, AlertTriangle,
  XCircle, ExternalLink, RefreshCw,
} from "lucide-react";
import { apiGet } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompetenciaResumo {
  competencia: string;
  mes: string;
  parcela: string;
  nu_parcela: string;
  total_oficial: number;
  conciliado: boolean;
  fonte_situacao: string;
  coletado_em: string;
}

interface Componente {
  co_seq: number;
  descricao: string;
  descricao_original: string;
  gestao: string;
  vl_custeio: number;
  vl_implantacao: number;
  vl_total: number;
}

interface CompetenciaDetalhe {
  competencia: string;
  mes: string;
  parcela: string;
  nu_parcela: string;
  nu_comp_cnes: string;
  co_processo?: number;
  total_oficial: number;
  soma_componentes: number;
  conciliado: boolean;
  componentes: Componente[];
  fonte: string;
  fonte_situacao: string;
  coletado_em: string;
  data_consulta_egestor?: string;
  meta?: Record<string, unknown>;
}

interface DetalhadoData {
  competencia: string;
  parcela: string;
  populacao: number;
  ano_ref_populacao: number;
  faixa_equidade_esf: string;
  classificacao_vinculo_esf: string;
  classificacao_qualidade_esf: string;
  classificacao_qualidade_emulti: string;
  esf: {
    qt_pagas: number; qt_100pct: number; qt_75pct: number; qt_50pct: number; qt_25pct: number;
    vl_fixo: number; vl_vinculo: number; vl_qualidade: number; vl_total_bruto: number;
  };
  eap: { qt_pagas: number; vl_total_bruto: number };
  emulti: {
    qt_pagas: number; qt_estrategica: number; qt_complementar: number; qt_ampliada: number;
    vl_custeio: number; vl_qualidade: number; vl_total: number;
  };
  esb: {
    qt_40h_pagas_modal_i: number; qt_uom: number;
    vl_esb_40h: number; vl_qualidade_40h: number; vl_uom: number; vl_lrpd_municipal: number;
    vl_ceo_municipal: number; vl_total_sb_calculado: number;
  };
  acs: { qt_teto: number; qt_direto_pago: number; qt_indireto_pago: number; vl_total: number };
  esfrb: { qt_pagas: number; vl_custeio: number; vl_qualidade: number; vl_vinculo: number; vl_extra: number; vl_total: number };
  microscopistas: { qt_pagos: number; vl_total: number };
  per_capita: { populacao: number; vl_pagamento: number };
  tetos: { esf: number; eap: number; emulti_estrategica: number; sb_40h: number };
  fonte_situacao: string;
  coletado_em: string;
  data_consulta_egestor?: string;
}

interface ListaResponse {
  meta: Record<string, unknown>;
  ano_ciclo: number;
  data_consulta_egestor: string;
  coletado_em: string;
  total_periodo: number;
  competencias: CompetenciaResumo[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BRL = (v: number | null | undefined) =>
  v == null
    ? "—"
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const pct = (parte: number, total: number) =>
  total > 0 ? ((parte / total) * 100).toFixed(1) + "%" : "—";

function FonteBadge({ situacao }: { situacao: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    oficial_confirmado: {
      label: "OFICIAL e-Gestor",
      cls: "bg-green-100 text-green-800 border border-green-300",
    },
    nao_disponivel: {
      label: "NÃO DISPONÍVEL",
      cls: "bg-gray-100 text-gray-600 border border-gray-300",
    },
    calculado: {
      label: "CALCULADO",
      cls: "bg-purple-100 text-purple-800 border border-purple-300",
    },
  };
  const e = map[situacao] ?? { label: situacao, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${e.cls}`}>
      {e.label}
    </span>
  );
}

function ConciliacaoBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
      <CheckCircle className="w-3.5 h-3.5" /> Conciliado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
      <XCircle className="w-3.5 h-3.5" /> Divergente
    </span>
  );
}

// Cor de barra por componente (ordem: eSF, eSB, ACS, Demais, eMulti, PerCapita, outros)
const COMP_CORES: Record<number, string> = {
  8:  "bg-blue-500",
  10: "bg-emerald-500",
  2:  "bg-amber-500",
  11: "bg-orange-400",
  9:  "bg-violet-500",
  12: "bg-cyan-400",
  16: "bg-pink-400",
  7:  "bg-lime-400",
};

// ─── Sub-painel: Equipes e Indicadores ───────────────────────────────────────

function PainelEquipes({ nuParcela }: { nuParcela: string }) {
  const { data, isLoading, error } = useQuery<DetalhadoData>({
    queryKey: ["repasse-detalhado", nuParcela],
    queryFn: () => apiGet(`/repasses-aps/detalhado/${nuParcela}`),
    staleTime: 300_000,
  });

  if (isLoading) return <p className="text-slate-400 text-sm animate-pulse py-4">Consultando e-Gestor APS…</p>;
  if (error || !data) return <p className="text-red-500 text-sm py-4">Não foi possível obter detalhamento de equipes.</p>;

  function ClassBadge({ val }: { val: string }) {
    const c = val === "BOM" ? "bg-green-100 text-green-800 border-green-300"
            : val === "REGULAR" ? "bg-yellow-100 text-yellow-800 border-yellow-300"
            : "bg-red-100 text-red-800 border-red-300";
    return <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${c}`}>{val}</span>;
  }

  const { esf, eap, emulti, esb, acs, esfrb, microscopistas, per_capita, tetos } = data;

  return (
    <div className="space-y-4">
      {/* Indicadores gerais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Equidade eSF", val: data.faixa_equidade_esf },
          { label: "Vínculo eSF/eAP", val: data.classificacao_vinculo_esf },
          { label: "Qualidade eSF/eAP", val: data.classificacao_qualidade_esf },
          { label: "Qualidade eMulti", val: data.classificacao_qualidade_emulti },
        ].map((it) => (
          <div key={it.label} className="bg-white dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-2">
            <p className="text-xs text-slate-400 mb-1">{it.label}</p>
            <ClassBadge val={it.val} />
          </div>
        ))}
      </div>

      {/* Tabela de equipes */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 text-xs">
              <th className="px-4 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">Componente</th>
              <th className="px-4 py-2 text-center font-semibold text-slate-600 dark:text-slate-300">Qtd Pagas</th>
              <th className="px-4 py-2 text-center font-semibold text-slate-600 dark:text-slate-300">Teto</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Valor Total</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {/* eSF */}
            <tr className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-4 py-2.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mr-2" />eSF — Saúde da Família</td>
              <td className="px-4 py-2.5 text-center tabular-nums">{esf.qt_pagas} <span className="text-slate-400 text-xs">({esf.qt_100pct} × 100%)</span></td>
              <td className="px-4 py-2.5 text-center tabular-nums text-slate-400">{tetos.esf}</td>
              <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{BRL(esf.vl_total_bruto)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-xs text-slate-400">
                F {BRL(esf.vl_fixo)} · V {BRL(esf.vl_vinculo)} · Q {BRL(esf.vl_qualidade)}
              </td>
            </tr>
            {/* eAP */}
            <tr className="border-t border-slate-100 dark:border-slate-800 opacity-60">
              <td className="px-4 py-2.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-300 mr-2" />eAP — Atenção Primária</td>
              <td className="px-4 py-2.5 text-center tabular-nums">{eap.qt_pagas}</td>
              <td className="px-4 py-2.5 text-center tabular-nums text-slate-400">{tetos.eap}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{eap.vl_total_bruto > 0 ? BRL(eap.vl_total_bruto) : "—"}</td>
              <td className="px-4 py-2.5 text-right text-xs text-slate-400">Sem equipes pagas</td>
            </tr>
            {/* eMulti */}
            <tr className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-4 py-2.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-500 mr-2" />eMulti — Multiprofissional</td>
              <td className="px-4 py-2.5 text-center tabular-nums">{emulti.qt_pagas} <span className="text-slate-400 text-xs">({emulti.qt_estrategica} estratégica)</span></td>
              <td className="px-4 py-2.5 text-center tabular-nums text-slate-400">{tetos.emulti_estrategica}</td>
              <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{BRL(emulti.vl_total)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-xs text-slate-400">
                C {BRL(emulti.vl_custeio)} · Q {BRL(emulti.vl_qualidade)}
              </td>
            </tr>
            {/* eSB */}
            <tr className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-4 py-2.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />eSB — Saúde Bucal</td>
              <td className="px-4 py-2.5 text-center tabular-nums">{esb.qt_40h_pagas_modal_i} + {esb.qt_uom} UOM</td>
              <td className="px-4 py-2.5 text-center tabular-nums text-slate-400">{tetos.sb_40h}</td>
              <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{BRL(esb.vl_total_sb_calculado)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-xs text-slate-400">
                C {BRL(esb.vl_esb_40h)} · Q {BRL(esb.vl_qualidade_40h)} · UOM {BRL(esb.vl_uom)} · LRPD {BRL(esb.vl_lrpd_municipal)}
              </td>
            </tr>
            {/* ACS */}
            <tr className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-4 py-2.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-2" />ACS — Agentes Comunitários</td>
              <td className="px-4 py-2.5 text-center tabular-nums">{acs.qt_direto_pago}</td>
              <td className="px-4 py-2.5 text-center tabular-nums text-slate-400">{acs.qt_teto}</td>
              <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{BRL(acs.vl_total)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-xs text-slate-400">
                {acs.qt_direto_pago > 0 ? BRL(acs.vl_total / acs.qt_direto_pago) + "/ACS" : "—"}
              </td>
            </tr>
            {/* eSFRB */}
            {esfrb.qt_pagas > 0 && (
              <tr className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-2.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400 mr-2" />eSFRB — Ribeirinha</td>
                <td className="px-4 py-2.5 text-center tabular-nums">{esfrb.qt_pagas}</td>
                <td className="px-4 py-2.5 text-center text-slate-400">—</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{BRL(esfrb.vl_total)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-xs text-slate-400">
                  C {BRL(esfrb.vl_custeio)} · Q {BRL(esfrb.vl_qualidade)} · V {BRL(esfrb.vl_vinculo)} · Ext {BRL(esfrb.vl_extra)}
                </td>
              </tr>
            )}
            {/* Microscopistas */}
            {microscopistas.qt_pagos > 0 && (
              <tr className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-2.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-300 mr-2" />Microscopistas</td>
                <td className="px-4 py-2.5 text-center tabular-nums">{microscopistas.qt_pagos}</td>
                <td className="px-4 py-2.5 text-center text-slate-400">—</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{BRL(microscopistas.vl_total)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-xs text-slate-400">
                  {microscopistas.qt_pagos > 0 ? BRL(microscopistas.vl_total / microscopistas.qt_pagos) + "/mic" : "—"}
                </td>
              </tr>
            )}
            {/* Per capita */}
            <tr className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-4 py-2.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 mr-2" />Per capita populacional</td>
              <td className="px-4 py-2.5 text-center tabular-nums">{per_capita.populacao.toLocaleString("pt-BR")} hab</td>
              <td className="px-4 py-2.5 text-center text-slate-400">—</td>
              <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{BRL(per_capita.vl_pagamento)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-xs text-slate-400">
                {BRL(per_capita.populacao > 0 ? per_capita.vl_pagamento / per_capita.populacao : 0)}/hab
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        Fonte: e-Gestor APS (tipoRelatorio=COMPLETO) · {data.coletado_em ? new Date(data.coletado_em).toLocaleString("pt-BR") : ""}
      </p>
    </div>
  );
}

// ─── Painel de detalhe de uma competência ────────────────────────────────────

function DetalhePanel({ nuParcela, competencia }: { nuParcela: string; competencia: string }) {
  const [aba, setAba] = useState<"componentes" | "equipes">("componentes");

  const { data, isLoading, error } = useQuery<CompetenciaDetalhe>({
    queryKey: ["repasse-detalhe-v2", nuParcela],
    queryFn: () => apiGet(`/repasses-aps/competencias/${nuParcela}`),
    staleTime: 300_000,
  });

  if (isLoading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 px-8 py-5 border-t border-slate-200 dark:border-slate-700">
        <p className="text-slate-400 text-sm animate-pulse">
          Consultando e-Gestor APS para {competencia}…
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 dark:bg-red-950 px-8 py-4 border-t border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400 text-sm">
          Não foi possível obter dados da API do e-Gestor APS.
        </p>
        <a
          href="https://relatorioaps.saude.gov.br/gerenciaaps/pagamento"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
        >
          <ExternalLink className="w-3 h-3" /> Consultar diretamente no e-Gestor APS
        </a>
      </div>
    );
  }

  const componentes = data.componentes ?? [];
  const total = data.total_oficial;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-5">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="font-bold text-slate-800 dark:text-slate-100 text-base">
          {data.competencia} — {BRL(total)}
        </span>
        <FonteBadge situacao={data.fonte_situacao} />
        <ConciliacaoBadge ok={data.conciliado} />
        {data.nu_comp_cnes && (
          <span className="text-xs text-slate-400">
            Comp. CNES: {data.nu_comp_cnes.replace(/(\d{4})(\d{2})/, "$1/$2")}
          </span>
        )}
        {data.co_processo && (
          <span className="text-xs text-slate-400">Processo: {data.co_processo}</span>
        )}
      </div>

      {/* Barra de composição */}
      {componentes.length > 0 && (
        <div className="flex rounded-full h-3 overflow-hidden mb-4 gap-px">
          {componentes.filter(c => c.vl_total > 0).map((c) => (
            <div
              key={c.co_seq}
              className={`${COMP_CORES[c.co_seq] ?? "bg-slate-400"}`}
              style={{ width: pct(c.vl_total, total) }}
              title={`${c.descricao}: ${BRL(c.vl_total)}`}
            />
          ))}
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-1 mb-4 border-b border-slate-200 dark:border-slate-700">
        {(["componentes", "equipes"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              aba === a
                ? "bg-white dark:bg-slate-800 border border-b-white dark:border-b-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}
          >
            {a === "componentes" ? "Componentes" : "Equipes e Indicadores"}
          </button>
        ))}
      </div>

      {/* Aba Componentes */}
      {aba === "componentes" && (
        <>
          {componentes.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="px-4 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">Componente</th>
                    <th className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Custeio</th>
                    <th className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Implantação</th>
                    <th className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Total</th>
                    <th className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">%</th>
                  </tr>
                </thead>
                <tbody>
                  {componentes.map((c, i) => (
                    <tr
                      key={c.co_seq}
                      className={`border-t border-slate-100 dark:border-slate-800 ${c.vl_total === 0 ? "opacity-40" : ""} ${i % 2 === 0 ? "" : "bg-white/50 dark:bg-slate-950/30"}`}
                    >
                      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${COMP_CORES[c.co_seq] ?? "bg-slate-400"} mr-2`} />
                        {c.descricao}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-600 dark:text-slate-300">{c.vl_custeio > 0 ? BRL(c.vl_custeio) : "—"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-600 dark:text-slate-300">{c.vl_implantacao > 0 ? BRL(c.vl_implantacao) : "—"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-800 dark:text-slate-100">{BRL(c.vl_total)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-400 text-xs">{pct(c.vl_total, total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800">
                    <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-100">Total</td>
                    <td colSpan={2} />
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold text-emerald-700 dark:text-emerald-400">{BRL(total)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-400 text-xs">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Dado ainda não disponibilizado pela fonte oficial para esta competência.</p>
          )}

          {!data.conciliado && (
            <div className="mt-3 flex items-start gap-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-300">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Divergência: soma dos componentes ({BRL(data.soma_componentes)}) ≠ total oficial ({BRL(total)}).</span>
            </div>
          )}
        </>
      )}

      {/* Aba Equipes */}
      {aba === "equipes" && <PainelEquipes nuParcela={nuParcela} />}

      {/* Rodapé */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span>Coletado em: {data.coletado_em ? new Date(data.coletado_em).toLocaleString("pt-BR") : "—"}</span>
        <a
          href="https://relatorioaps.saude.gov.br/gerenciaaps/pagamento"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-500 hover:underline"
        >
          <ExternalLink className="w-3 h-3" /> e-Gestor APS
        </a>
      </div>
    </div>
  );
}

// ─── Linha da tabela principal ────────────────────────────────────────────────

function LinhaCompetencia({
  c, isOpen, onToggle,
}: { c: CompetenciaResumo; isOpen: boolean; onToggle: () => void }) {
  return (
    <>
      <tr
        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
          <span className="inline-flex items-center gap-2">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {c.competencia}
          </span>
        </td>
        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm">{c.parcela}</td>
        <td className="px-4 py-3 font-bold text-emerald-700 dark:text-emerald-400 text-right tabular-nums">
          {BRL(c.total_oficial)}
        </td>
        <td className="px-4 py-3 text-center">
          <ConciliacaoBadge ok={c.conciliado} />
        </td>
        <td className="px-4 py-3 text-center">
          <FonteBadge situacao={c.fonte_situacao} />
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={5} className="p-0">
            <DetalhePanel nuParcela={c.nu_parcela} competencia={c.competencia} />
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function RepassesApsApui() {
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useQuery<ListaResponse>({
    queryKey: ["repasses-aps-lista"],
    queryFn: () => apiGet("/repasses-aps/competencias"),
    staleTime: 300_000,
  });

  const toggle = (nu: string) =>
    setExpandidos((prev) => {
      const s = new Set(prev);
      s.has(nu) ? s.delete(nu) : s.add(nu);
      return s;
    });

  const competencias = data?.competencias ?? [];
  const total = data?.total_periodo ?? 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Repasses APS — Apuí/AM
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Financiamento federal da Atenção Primária à Saúde · IBGE 130014 · Ciclo 2026
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* Banner de integridade */}
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl px-5 py-3 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-green-800 dark:text-green-200">
          <strong>Fonte oficial:</strong> Todos os valores são obtidos em tempo real da API do{" "}
          <a
            href="https://relatorioaps.saude.gov.br/gerenciaaps/pagamento"
            target="_blank" rel="noopener noreferrer"
            className="underline font-semibold"
          >
            e-Gestor APS
          </a>{" "}
          (relatorioaps-prd.saude.gov.br). Nenhum valor é simulado ou estimado.
          {data?.data_consulta_egestor && (
            <span className="ml-2 text-green-600 dark:text-green-400">
              · Consulta: {data.data_consulta_egestor}
            </span>
          )}
        </div>
      </div>

      {/* Card de total */}
      {!isLoading && total > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Total acumulado (ciclo 2026)
            </p>
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {BRL(total)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Competências disponíveis
            </p>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              {competencias.length}
              <span className="text-base font-normal text-slate-400 ml-1">/ 12</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Média mensal
            </p>
            <p className="text-3xl font-bold text-slate-700 dark:text-slate-200 tabular-nums">
              {competencias.length > 0 ? BRL(total / competencias.length) : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Estado de carregamento / erro */}
      {isLoading && (
        <div className="text-center py-16 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
          <p>Consultando API do e-Gestor APS…</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">
                Não foi possível conectar ao e-Gestor APS
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Integração pendente com a fonte oficial. Os dados serão exibidos quando a conexão for restabelecida.
              </p>
              <a
                href="https://relatorioaps.saude.gov.br/gerenciaaps/pagamento"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2"
              >
                <ExternalLink className="w-3 h-3" /> Consultar diretamente no e-Gestor APS
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de competências */}
      {competencias.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">
              Competências — Ciclo 2026
            </h2>
            <span className="text-xs text-slate-400">
              Clique em uma linha para ver o detalhamento por componente
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">
                    Competência
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">
                    Parcela
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">
                    Total Oficial
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">
                    Conciliação
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">
                    Fonte
                  </th>
                </tr>
              </thead>
              <tbody>
                {competencias.map((c) => (
                  <LinhaCompetencia
                    key={c.nu_parcela}
                    c={c}
                    isOpen={expandidos.has(c.nu_parcela)}
                    onToggle={() => toggle(c.nu_parcela)}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800">
                  <td
                    colSpan={2}
                    className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200"
                  >
                    Total acumulado
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {BRL(total)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Rodapé */}
      <div className="text-xs text-slate-400 text-center space-y-1">
        <p>
          Fonte: API e-Gestor APS — Ministério da Saúde/SAPS ·{" "}
          <a
            href="https://relatorioaps.saude.gov.br"
            target="_blank" rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            relatorioaps.saude.gov.br
          </a>
        </p>
        {dataUpdatedAt > 0 && (
          <p>Última atualização local: {new Date(dataUpdatedAt).toLocaleString("pt-BR")}</p>
        )}
      </div>
    </div>
  );
}
