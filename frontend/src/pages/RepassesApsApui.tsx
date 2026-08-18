/**
 * RepassesApsApui — Módulo de Repasses Financeiros da APS — Apuí/AM
 * Dados reais do e-Gestor APS com rastreabilidade de fonte e nível de confiança.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown, ChevronRight, CheckCircle, AlertTriangle,
  XCircle, Info, Download, RefreshCw, ExternalLink,
} from "lucide-react";
import { apiGet } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Competencia {
  competencia: string; mes: string; parcela: string;
  total_oficial: number; fonte: string; fonte_situacao: string;
  componentes_situacao: string; componentes_nota?: string;
  emulti_detalhado?: EMultiDetalhe;
}

interface EMultiDetalhe {
  custeio: number; qualidade: number; remoto: number; total: number;
  fonte: string; fonte_situacao: string;
}

interface SubComponente {
  item: string; valor: number | null; situacao: string;
  nota?: string; fonte?: string; alerta?: string;
  valor_referencia?: number; indicadores_egestor?: Record<string, any>;
}

interface Inconsistencia {
  codigo: string; gravidade: string; titulo: string;
  descricao: string; impacto_financeiro?: number;
  acao_corretiva?: string; responsavel?: string; corrigido?: boolean;
}

interface Acao {
  acao: string; descricao: string; portaria: string;
  valor_custeio: number; valor_implantacao: number; valor_total: number;
  fonte_situacao: string; fonte: string;
  sub_componentes: SubComponente[];
  inconsistencias: Inconsistencia[];
  nota?: string;
}

interface DetalheCompetencia {
  competencia: string; mes: string; parcela: string;
  total_oficial: number; fonte_situacao: string;
  componentes_situacao: string;
  acoes?: Acao[];
  conciliacao?: { total_oficial: number; soma_componentes: number; diferenca: number; conciliado: boolean };
  mensagem?: string;
  emulti_detalhado?: EMultiDetalhe;
  alerta_remoto_emulti?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BRL = (v: number | null | undefined) =>
  v == null
    ? "—"
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function FonteBadge({ situacao }: { situacao: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    oficial_confirmado: { label: "OFICIAL e-Gestor", cls: "bg-green-100 text-green-800 border border-green-300" },
    oficial_aguardando: { label: "OFICIAL — Aguardando", cls: "bg-blue-100 text-blue-800 border border-blue-300" },
    nao_disponivel:     { label: "NÃO DISPONÍVEL",     cls: "bg-gray-100  text-gray-600  border border-gray-300" },
    parcial:            { label: "PARCIAL",            cls: "bg-yellow-100 text-yellow-800 border border-yellow-300" },
    confirmado:         { label: "CONFIRMADO",         cls: "bg-green-100 text-green-800 border border-green-300" },
    calculado:          { label: "CALCULADO",          cls: "bg-purple-100 text-purple-800 border border-purple-300" },
  };
  const entry = map[situacao] ?? { label: situacao, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${entry.cls}`}>
      {entry.label}
    </span>
  );
}

function GravidadeIcon({ g }: { g: string }) {
  if (g === "critica") return <XCircle className="w-4 h-4 text-red-600 inline mr-1" />;
  if (g === "alta")    return <AlertTriangle className="w-4 h-4 text-orange-500 inline mr-1" />;
  return <Info className="w-4 h-4 text-yellow-500 inline mr-1" />;
}

// ─── Componente: Linha de competência ─────────────────────────────────────────

function LinhaCompetencia({ c, isOpen, onToggle }: {
  c: Competencia; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {c.competencia}
        </td>
        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm">{c.parcela}</td>
        <td className="px-4 py-3 font-bold text-emerald-700 dark:text-emerald-400 text-right tabular-nums">
          {BRL(c.total_oficial)}
        </td>
        <td className="px-4 py-3 text-center">
          <FonteBadge situacao={c.fonte_situacao} />
        </td>
        <td className="px-4 py-3 text-center">
          <FonteBadge situacao={c.componentes_situacao} />
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={5} className="px-0 py-0">
            <DetalheCompetenciaPanel mes={c.mes} competencia={c.competencia} />
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Painel de detalhe ao expandir competência ───────────────────────────────

function DetalheCompetenciaPanel({ mes, competencia }: { mes: string; competencia: string }) {
  const { data, isLoading, error } = useQuery<DetalheCompetencia>({
    queryKey: ["repasse-detalhe", mes],
    queryFn: () => apiGet(`/repasses-aps/competencias/${mes}`),
    staleTime: 300_000,
  });

  if (isLoading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 px-8 py-6 border-t border-slate-200 dark:border-slate-700">
        <p className="text-slate-500 text-sm animate-pulse">Carregando detalhes de {competencia}...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 px-8 py-4 border-t border-red-200">
        <p className="text-red-600 text-sm">Erro ao carregar detalhes.</p>
      </div>
    );
  }

  // Competências sem detalhamento confirmado
  if (!data.acoes) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 px-8 py-6 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-3 mb-4">
          <Info className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Total oficial: {BRL(data.total_oficial)}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{data.mensagem}</p>
            <a
              href="https://relatorioaps.saude.gov.br/gerenciaaps/pagamento"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2"
            >
              <ExternalLink className="w-3 h-3" /> Acessar e-Gestor APS
            </a>
          </div>
        </div>

        {data.emulti_detalhado && (
          <div className="mt-4 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
            <div className="bg-blue-50 dark:bg-blue-950 px-4 py-2 border-b border-blue-200 dark:border-blue-800">
              <span className="font-semibold text-blue-800 dark:text-blue-300 text-sm">
                eMulti — Detalhamento confirmado
              </span>
              <FonteBadge situacao={data.emulti_detalhado.fonte_situacao} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 py-3 bg-white dark:bg-slate-900">
              {[
                { l: "Custeio", v: data.emulti_detalhado.custeio },
                { l: "Qualidade", v: data.emulti_detalhado.qualidade },
                { l: "Remoto TIC", v: data.emulti_detalhado.remoto },
                { l: "Total eMulti", v: data.emulti_detalhado.total },
              ].map(({ l, v }) => (
                <div key={l}>
                  <p className="text-xs text-slate-500 mb-0.5">{l}</p>
                  <p className={`font-bold text-sm ${v === 0 ? "text-red-600" : "text-slate-800 dark:text-slate-100"}`}>
                    {BRL(v)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // JUN/2026: detalhamento completo
  return (
    <div className="bg-slate-50 dark:bg-slate-900 px-6 py-5 border-t border-slate-200 dark:border-slate-700 space-y-4">

      {/* Conciliação */}
      {data.conciliacao && (
        <div className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold
          ${data.conciliacao.conciliado
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-700"}`}
        >
          {data.conciliacao.conciliado
            ? <CheckCircle className="w-4 h-4" />
            : <XCircle className="w-4 h-4" />}
          Conciliação: Soma dos componentes = {BRL(data.conciliacao.soma_componentes)} | Total oficial = {BRL(data.conciliacao.total_oficial)}
          {data.conciliacao.conciliado ? " ✓ OK" : ` — DIVERGÊNCIA: ${BRL(data.conciliacao.diferenca)}`}
        </div>
      )}

      {/* Alerta eMulti */}
      {data.alerta_remoto_emulti && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          {data.alerta_remoto_emulti}
        </div>
      )}

      {/* Ações */}
      {data.acoes?.map((acao) => (
        <AcaoCard key={acao.acao} acao={acao} />
      ))}
    </div>
  );
}

// ─── Card de Ação ─────────────────────────────────────────────────────────────

function AcaoCard({ acao }: { acao: Acao }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
      {/* Cabeçalho da ação */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 flex-1">
          {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{acao.acao}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{acao.descricao}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <FonteBadge situacao={acao.fonte_situacao} />
          <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums text-sm">
            {BRL(acao.valor_total)}
          </span>
        </div>
      </button>

      {/* Inconsistências rápidas */}
      {acao.inconsistencias?.length > 0 && (
        <div className="border-t border-orange-100 bg-orange-50 dark:bg-orange-950/30 px-4 py-2">
          {acao.inconsistencias.map((inc) => (
            <div key={inc.codigo} className="flex items-start gap-2 text-xs text-orange-800 dark:text-orange-300">
              <GravidadeIcon g={inc.gravidade} />
              <span>
                {inc.corrigido && <span className="line-through text-slate-400 mr-1">[CORRIGIDO]</span>}
                <strong>{inc.codigo}</strong>: {inc.titulo}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Sub-componentes */}
      {open && (
        <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {acao.sub_componentes.map((sc, i) => (
            <SubComponenteRow key={i} sc={sc} />
          ))}

          {/* Rodapé da ação */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
            <div className="text-xs text-slate-500 max-w-md">
              <span className="font-semibold">Fonte:</span> {acao.fonte}
            </div>
            <div className="text-xs text-slate-500">{acao.portaria}</div>
          </div>

          {/* Nota especial */}
          {acao.nota && (
            <div className="px-4 py-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 italic">
              {acao.nota}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Linha de sub-componente ─────────────────────────────────────────────────

function SubComponenteRow({ sc }: { sc: SubComponente }) {
  const [open, setOpen] = useState(false);
  const naoDisponivel = sc.situacao === "nao_disponivel";

  return (
    <div className="px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          {sc.indicadores_egestor && (
            <button onClick={() => setOpen(!open)} className="text-slate-400 hover:text-slate-600">
              {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          )}
          <p className={`text-sm ${naoDisponivel ? "text-slate-400" : "text-slate-700 dark:text-slate-200"}`}>
            {sc.item}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <FonteBadge situacao={sc.situacao} />
          <span className={`tabular-nums text-sm font-semibold ${
            naoDisponivel ? "text-slate-400 italic" :
            sc.valor === 0 ? "text-red-600" :
            "text-slate-800 dark:text-slate-100"
          }`}>
            {naoDisponivel ? "—" : BRL(sc.valor)}
          </span>
        </div>
      </div>

      {/* Nota */}
      {sc.nota && (
        <p className="text-xs text-slate-400 mt-1 ml-5 italic">{sc.nota}</p>
      )}

      {/* Alerta */}
      {sc.alerta && (
        <div className="mt-2 ml-5 bg-red-50 border border-red-200 rounded px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          {sc.alerta}
        </div>
      )}

      {/* Indicadores do e-Gestor */}
      {open && sc.indicadores_egestor && (
        <div className="mt-3 ml-5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
            Indicadores e-Gestor APS
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
            {Object.entries(sc.indicadores_egestor).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-slate-500 capitalize">{k.replace(/_/g, " ")}:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                  {typeof v === "number" ? (k.includes("equipe") ? String(v) : BRL(v)) : String(v)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function RepassesApsApui() {
  const [anoFiltro, setAnoFiltro] = useState<number>(2026);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const { data: resumo, isLoading: loadingResumo } = useQuery({
    queryKey: ["repasses-aps-resumo"],
    queryFn: () => apiGet("/repasses-aps/resumo-executivo"),
    staleTime: 300_000,
  });

  const { data: listagem, isLoading: loadingLista, refetch } = useQuery<{
    competencias: Competencia[]; resumo: any;
  }>({
    queryKey: ["repasses-aps-lista", anoFiltro],
    queryFn: () => apiGet(`/repasses-aps/competencias?ano=${anoFiltro}`),
    staleTime: 300_000,
  });

  const { data: inconsistencias } = useQuery({
    queryKey: ["repasses-aps-inc"],
    queryFn: () => apiGet("/repasses-aps/inconsistencias"),
    staleTime: 300_000,
  });

  const toggle = (mes: string) => {
    setExpandidos(prev => {
      const n = new Set(prev);
      if (n.has(mes)) n.delete(mes); else n.add(mes);
      return n;
    });
  };

  const cards = resumo?.cards;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 px-4 py-6 space-y-6">

      {/* Cabeçalho */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl px-6 py-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Repasses Financeiros — APS
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Município de Apuí/AM · IBGE 130014 · CNPJ FMS: 12.834.320/0001-26
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Fonte primária: e-Gestor APS (relatorioaps.saude.gov.br) · Atualizado em: 18/08/2026
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a
              href="https://relatorioaps.saude.gov.br/gerenciaaps/pagamento"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs border border-blue-300 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> e-Gestor APS
            </a>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-xs border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar
            </button>
          </div>
        </div>

        {/* Aviso de integridade de dados */}
        <div className="mt-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-xs text-blue-800 dark:text-blue-300">
          <Info className="w-4 h-4 inline mr-2" />
          <strong>Sobre os dados:</strong> todos os valores apresentados como "OFICIAL e-Gestor" foram extraídos
          de prints do portal e-Gestor APS fornecidos pelo gestor em AGO/2026. Dados marcados como
          "NÃO DISPONÍVEL" não estão disponíveis na fonte oficial — não são apresentados como zero.
          Nenhum valor foi estimado, simulado ou preenchido artificialmente.
        </div>
      </div>

      {/* Cards executivos */}
      {!loadingResumo && cards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardValor
            titulo="Acumulado JAN–JUN/2026"
            valor={cards.total_acumulado_2026?.valor}
            situacao={cards.total_acumulado_2026?.fonte_situacao}
            cor="emerald"
          />
          <CardValor
            titulo="Média Mensal 2026"
            valor={cards.media_mensal_2026?.valor}
            situacao={cards.media_mensal_2026?.fonte_situacao}
            cor="blue"
          />
          <CardValor
            titulo={`Maior Repasse (${cards.maior_repasse_2026?.competencia})`}
            valor={cards.maior_repasse_2026?.valor}
            situacao="oficial_confirmado"
            cor="violet"
          />
          <CardValor
            titulo="Perda eMulti Remoto Confirmada"
            valor={cards.perda_remoto_emulti_confirmada?.valor}
            situacao="oficial_confirmado"
            cor="red"
            subtitulo="JUN + MAI/2026 · demais meses verificar"
          />
        </div>
      )}

      {/* Alertas críticos */}
      {resumo?.alertas_criticos?.length > 0 && (
        <div className="space-y-2">
          {resumo.alertas_criticos.map((a: any, i: number) => (
            <div key={i} className={`rounded-xl px-5 py-4 border flex items-start gap-3 ${
              a.nivel === "critico"
                ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                : "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800"
            }`}>
              {a.nivel === "critico"
                ? <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                : <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />}
              <div>
                <p className={`font-semibold text-sm ${a.nivel === "critico" ? "text-red-800 dark:text-red-300" : "text-orange-800 dark:text-orange-300"}`}>
                  [{a.acao}] {a.titulo}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{a.providencia}</p>
              </div>
              {a.valor && (
                <span className={`ml-auto font-bold tabular-nums text-sm flex-shrink-0 ${
                  a.nivel === "critico" ? "text-red-700" : "text-orange-700"
                }`}>
                  {BRL(a.valor)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tabela de competências */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-bold text-slate-800 dark:text-slate-100">Competências</h2>
          <div className="flex items-center gap-3">
            {[2025, 2026].map(ano => (
              <button
                key={ano}
                onClick={() => setAnoFiltro(ano)}
                className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${
                  anoFiltro === ano
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {ano}
              </button>
            ))}
          </div>
        </div>

        {loadingLista ? (
          <div className="px-6 py-10 text-center text-slate-400 text-sm animate-pulse">
            Carregando competências...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Competência</th>
                    <th className="px-4 py-3 text-left">Parcela</th>
                    <th className="px-4 py-3 text-right">Total Oficial</th>
                    <th className="px-4 py-3 text-center">Dado Total</th>
                    <th className="px-4 py-3 text-center">Detalhamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {listagem?.competencias.map(c => (
                    <LinhaCompetencia
                      key={c.mes}
                      c={c}
                      isOpen={expandidos.has(c.mes)}
                      onToggle={() => toggle(c.mes)}
                    />
                  ))}
                </tbody>
                {listagem?.resumo && (
                  <tfoot>
                    <tr className="bg-emerald-50 dark:bg-emerald-950/30 border-t-2 border-emerald-300 dark:border-emerald-700 font-bold">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200" colSpan={2}>
                        Total acumulado
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {BRL(listagem.competencias.reduce((s, c) => s + c.total_oficial, 0))}
                      </td>
                      <td colSpan={2} className="px-4 py-3 text-center text-xs text-slate-500">
                        {listagem.competencias.length} competências
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Conciliação JAN–JUN/2026 */}
            {listagem?.resumo?.conciliacao_jan_jun_2026 && anoFiltro === 2026 && (
              <div className={`px-6 py-3 text-xs border-t ${
                listagem.resumo.conciliacao_jan_jun_2026.status === "OK"
                  ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}>
                <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                Conciliação JAN–JUN/2026: total acumulado = {BRL(listagem.resumo.total_jan_jun_2026)} |
                Valor de referência e-Gestor = R$ 3.686.187,50 |
                Diferença = {BRL(listagem.resumo.conciliacao_jan_jun_2026.diferenca)}
                {listagem.resumo.conciliacao_jan_jun_2026.status === "OK" ? " ✓" : " ✗"}
              </div>
            )}
          </>
        )}
      </div>

      {/* Dados pendentes */}
      {resumo?.dados_pendentes?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl px-6 py-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" />
            Dados ainda não disponíveis / pendentes de confirmação
          </h3>
          <ul className="space-y-1">
            {resumo.dados_pendentes.map((d: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
                {d}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-400 mt-3 italic">
            {resumo.como_obter_pendentes}
          </p>
        </div>
      )}

      {/* Inconsistências */}
      {inconsistencias?.inconsistencias?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl px-6 py-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Inconsistências Identificadas ({inconsistencias.total})
          </h3>
          <div className="space-y-3">
            {inconsistencias.inconsistencias.map((inc: any) => (
              <div key={inc.codigo} className={`rounded-xl border px-4 py-3 ${
                inc.gravidade === "critica"
                  ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                  : inc.gravidade === "alta"
                  ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20"
                  : "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20"
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                      <GravidadeIcon g={inc.gravidade} />
                      {inc.codigo} — {inc.titulo}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{inc.descricao}</p>
                    {inc.acao_corretiva && (
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1.5">
                        <strong>Ação:</strong> {inc.acao_corretiva}
                      </p>
                    )}
                    {inc.responsavel && (
                      <p className="text-xs text-slate-500 mt-1">
                        <strong>Responsável:</strong> {inc.responsavel}
                        {inc.prazo && ` · Prazo: ${inc.prazo}`}
                      </p>
                    )}
                  </div>
                  {(inc.impacto_financeiro_mensal || inc.total_impacto_confirmado) && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-500">Impacto</p>
                      <p className="font-bold text-red-600 tabular-nums text-sm">
                        {BRL(inc.total_impacto_confirmado ?? inc.impacto_financeiro_mensal)}
                      </p>
                      {inc.total_impacto_confirmado && (
                        <p className="text-xs text-slate-400">confirmado</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Card de valor ───────────────────────────────────────────────────────────

function CardValor({
  titulo, valor, situacao, cor, subtitulo
}: {
  titulo: string; valor: number | null | undefined;
  situacao: string; cor: string; subtitulo?: string;
}) {
  const paleta: Record<string, string> = {
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400",
    blue:    "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400",
    violet:  "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400",
    red:     "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400",
  };
  return (
    <div className={`rounded-2xl border px-5 py-4 ${paleta[cor] ?? paleta.blue}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-current opacity-70 mb-1">{titulo}</p>
      <p className="text-2xl font-bold tabular-nums text-current">
        {BRL(valor)}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <FonteBadge situacao={situacao} />
      </div>
      {subtitulo && <p className="text-xs opacity-60 mt-1">{subtitulo}</p>}
    </div>
  );
}
