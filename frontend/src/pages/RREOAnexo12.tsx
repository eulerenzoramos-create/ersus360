import { useEffect, useState, useRef } from "react";
import { Download, Printer, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { BRL } from "../lib/fmt";

// ── Dados reais SIOPS homologado 29/04/2026 ──────────────────────────────────

const META = {
  uf: "Amazonas",
  municipio: "Apuí",
  exercicio: 2026,
  bimestre: "1°",
  periodo: "Janeiro e Fevereiro",
  fonte: "SIOPS, Apuí — homologado em 29/04/2026",
  responsavel: "ROSANGELA MOTTER",
  anexo: "RREO – ANEXO 12 (LC141/2012, art.35)",
};

// Receitas
const RECEITAS_IMPOSTOS = {
  label: "RECEITA DE IMPOSTOS (I)",
  prev_ini: 2_929_000.00, prev_atu: 2_929_000.00, realizada: 882_982.66, pct: 30.15,
  itens: [
    { desc: "Receita Resultante do Imposto Predial e Territorial Urbano – IPTU",              prev_ini: 189_000.00,    prev_atu: 189_000.00,    realizada:     4_504.13, pct:   2.38 },
    { desc: "Receita Resultante do Imposto sobre Transmissão Inter Vivos – ITBI",            prev_ini:  10_000.00,    prev_atu:  10_000.00,    realizada:   131_306.41, pct: 1_313.06 },
    { desc: "Receita Resultante do Imposto sobre Serviços de Qualquer Natureza – ISS",       prev_ini:1_050_000.00, prev_atu:1_050_000.00, realizada:   217_173.14, pct:  20.68 },
    { desc: "Receita Resultante do IRRF",                                                    prev_ini:1_680_000.00, prev_atu:1_680_000.00, realizada:   529_998.98, pct:  31.55 },
  ],
};
const RECEITAS_TRANSF = {
  label: "RECEITA DE TRANSFERÊNCIAS CONSTITUCIONAIS E LEGAIS (II)",
  prev_ini: 46_184_355.00, prev_atu: 46_184_355.00, realizada: 9_355_124.43, pct: 20.26,
  itens: [
    { desc: "Cota-Parte do Fundo de Participação dos Municípios – FPM",       prev_ini: 26_250_000.00, prev_atu: 26_250_000.00, realizada: 6_516_517.50, pct: 24.82 },
    { desc: "Cota-Parte do Imposto Territorial Rural – ITR",                   prev_ini:      3_150.00, prev_atu:      3_150.00, realizada:       388.51, pct: 12.33 },
    { desc: "Cota-Parte do IPVA",                                               prev_ini:  1_602_825.00, prev_atu:  1_602_825.00, realizada:   132_623.06, pct:  8.27 },
    { desc: "Cota-Parte do ICMS",                                               prev_ini: 18_277_035.00, prev_atu: 18_277_035.00, realizada: 2_698_536.75, pct: 14.76 },
    { desc: "Cota-Parte do IPI – Exportação",                                   prev_ini:     51_345.00, prev_atu:     51_345.00, realizada:     7_058.61, pct: 13.75 },
    { desc: "Compensações Financeiras Provenientes de Impostos e Transferências Constitucionais",
                                                                                prev_ini:          0.00, prev_atu:          0.00, realizada:         0.00, pct:  0.00 },
  ],
};
const RECEITAS_TOTAL = { prev_ini: 49_113_355.00, prev_atu: 49_113_355.00, realizada: 10_238_107.09, pct: 20.85 };

// Despesas ASPS
const DESPESAS: {
  id: string; label: string;
  dot_ini: number; dot_atu: number;
  emp: number; emp_pct: number;
  liq: number; liq_pct: number;
  pago: number; pago_pct: number;
  rp: number;
  sub: { desc: string; dot_ini: number; dot_atu: number; emp: number; emp_pct: number; liq: number; liq_pct: number; pago: number; pago_pct: number; rp: number }[];
}[] = [
  {
    id: "IV", label: "ATENÇÃO BÁSICA (IV)",
    dot_ini: 1_603_000.00, dot_atu: 1_655_250.00,
    emp: 1_379_663.41, emp_pct: 83.35, liq: 320_700.60, liq_pct: 19.37, pago: 312_746.29, pago_pct: 18.89, rp: 1_058_962.81,
    sub: [
      { desc: "Despesas Correntes",   dot_ini: 1_513_000, dot_atu: 1_565_250, emp: 1_379_663.41, emp_pct: 88.14, liq: 320_700.60, liq_pct: 20.49, pago: 312_746.29, pago_pct: 19.98, rp: 1_058_962.81 },
      { desc: "Despesas de Capital",  dot_ini:    90_000, dot_atu:    90_000, emp:           0, emp_pct:  0,    liq:          0, liq_pct:  0,    pago:          0, pago_pct:  0,    rp:           0 },
    ],
  },
  {
    id: "V", label: "ASSISTÊNCIA HOSPITALAR E AMBULATORIAL (V)",
    dot_ini: 2_833_000.00, dot_atu: 2_833_000.00,
    emp: 407_095.06, emp_pct: 14.37, liq: 157_480.97, liq_pct: 5.56, pago: 127_345.97, pago_pct: 4.50, rp: 249_614.09,
    sub: [
      { desc: "Despesas Correntes",   dot_ini: 2_773_000, dot_atu: 2_773_000, emp: 407_095.06, emp_pct: 14.68, liq: 157_480.97, liq_pct: 5.68, pago: 127_345.97, pago_pct: 4.59, rp: 249_614.09 },
      { desc: "Despesas de Capital",  dot_ini:    60_000, dot_atu:    60_000, emp:          0, emp_pct:  0,    liq:          0, liq_pct:  0,   pago:          0, pago_pct:  0,   rp:          0 },
    ],
  },
  {
    id: "VI", label: "SUPORTE PROFILÁTICO E TERAPÊUTICO (VI)",
    dot_ini: 110_000.00, dot_atu: 57_750.00,
    emp: 0, emp_pct: 0, liq: 0, liq_pct: 0, pago: 0, pago_pct: 0, rp: 0,
    sub: [
      { desc: "Despesas Correntes",   dot_ini: 100_000, dot_atu: 47_750, emp: 0, emp_pct: 0, liq: 0, liq_pct: 0, pago: 0, pago_pct: 0, rp: 0 },
      { desc: "Despesas de Capital",  dot_ini:  10_000, dot_atu: 10_000, emp: 0, emp_pct: 0, liq: 0, liq_pct: 0, pago: 0, pago_pct: 0, rp: 0 },
    ],
  },
  {
    id: "VII", label: "VIGILÂNCIA SANITÁRIA (VII)",
    dot_ini: 20_000.00, dot_atu: 20_000.00,
    emp: 0, emp_pct: 0, liq: 0, liq_pct: 0, pago: 0, pago_pct: 0, rp: 0,
    sub: [
      { desc: "Despesas Correntes",   dot_ini: 10_000, dot_atu: 10_000, emp: 0, emp_pct: 0, liq: 0, liq_pct: 0, pago: 0, pago_pct: 0, rp: 0 },
      { desc: "Despesas de Capital",  dot_ini: 10_000, dot_atu: 10_000, emp: 0, emp_pct: 0, liq: 0, liq_pct: 0, pago: 0, pago_pct: 0, rp: 0 },
    ],
  },
  {
    id: "VIII", label: "VIGILÂNCIA EPIDEMIOLÓGICA (VIII)",
    dot_ini: 595_000.00, dot_atu: 638_005.00,
    emp: 243_211.01, emp_pct: 38.12, liq: 157_134.06, liq_pct: 24.63, pago: 157_134.06, pago_pct: 24.63, rp: 86_076.95,
    sub: [
      { desc: "Despesas Correntes",   dot_ini: 540_000, dot_atu: 583_005, emp: 243_211.01, emp_pct: 41.72, liq: 157_134.06, liq_pct: 26.95, pago: 157_134.06, pago_pct: 26.95, rp: 86_076.95 },
      { desc: "Despesas de Capital",  dot_ini:  55_000, dot_atu:  55_000, emp:          0, emp_pct:  0,    liq:          0, liq_pct:  0,    pago:          0, pago_pct:  0,    rp:          0 },
    ],
  },
  {
    id: "IX", label: "ALIMENTAÇÃO E NUTRIÇÃO (IX)",
    dot_ini: 0, dot_atu: 0, emp: 0, emp_pct: 0, liq: 0, liq_pct: 0, pago: 0, pago_pct: 0, rp: 0,
    sub: [
      { desc: "Despesas Correntes",  dot_ini: 0, dot_atu: 0, emp: 0, emp_pct: 0, liq: 0, liq_pct: 0, pago: 0, pago_pct: 0, rp: 0 },
      { desc: "Despesas de Capital", dot_ini: 0, dot_atu: 0, emp: 0, emp_pct: 0, liq: 0, liq_pct: 0, pago: 0, pago_pct: 0, rp: 0 },
    ],
  },
  {
    id: "X", label: "OUTRAS SUBFUNÇÕES (X)",
    dot_ini: 3_253_391.22, dot_atu: 3_210_386.22,
    emp: 1_699_543.55, emp_pct: 52.94, liq: 1_194_431.41, liq_pct: 37.21, pago: 1_191_069.81, pago_pct: 37.10, rp: 505_112.14,
    sub: [
      { desc: "Despesas Correntes",   dot_ini: 2_334_000,   dot_atu: 2_699_314,   emp: 1_699_543.55, emp_pct: 62.96, liq: 1_194_431.41, liq_pct: 44.25, pago: 1_191_069.81, pago_pct: 44.12, rp: 505_112.14 },
      { desc: "Despesas de Capital",  dot_ini:   919_391.22, dot_atu:   511_072.22, emp:           0, emp_pct:  0,    liq:           0, liq_pct:  0,    pago:           0, pago_pct:  0,    rp:           0 },
    ],
  },
];

const TOTAL_XI = {
  label: "TOTAL (XI) = (IV + V + VI + VII + VIII + IX + X)",
  dot_ini: 8_414_391.22, dot_atu: 8_414_391.22,
  emp: 3_729_513.03, emp_pct: 44.32,
  liq: 1_829_747.04, liq_pct: 21.75,
  pago: 1_788_296.13, pago_pct: 21.25,
  rp: 1_899_765.99,
};

const APURACAO = {
  minimo_15pct: 1_535_716.06,
  valor_aplicado_emp: 3_729_513.03,
  valor_aplicado_liq: 1_829_747.04,
  valor_aplicado_pago: 1_788_296.13,
  diferenca_emp: 2_193_796.97,
  diferenca_liq:   294_030.98,
  diferenca_pago:  252_580.07,
  pct_emp: 36.42,
  pct_liq: 17.87,
  pct_pago: 17.46,
  cumpriu: true,
};

const RECEITAS_ADIC = {
  total: { prev_ini: 14_016_765.00, prev_atu: 14_016_765.00, realizada: 2_357_443.79, pct: 16.82 },
  itens: [
    { desc: "Da União",          prev_ini: 11_594_847.00, prev_atu: 11_594_847.00, realizada: 2_357_251.49, pct: 20.33 },
    { desc: "Dos Estados",       prev_ini:  2_421_918.00, prev_atu:  2_421_918.00, realizada:       192.30, pct:  0.01 },
    { desc: "Outros Municípios", prev_ini:          0.00, prev_atu:          0.00, realizada:         0.00, pct:  0.00 },
  ],
};

const TOTAL_SAUDE = { dot_ini: 22_431_156.22, dot_atu: 25_337_188.58, emp: 8_320_267.57, emp_pct: 32.84, liq: 4_096_291.72, liq_pct: 16.17, pago: 4_052_507.48, pago_pct: 15.99, rp: 4_223_975.85 };
const RECURSOS_PROPRIOS = { dot_ini: 8_414_391.22, dot_atu: 8_414_391.22, emp: 3_729_513.03, emp_pct: 44.32, liq: 1_829_747.04, liq_pct: 21.75, pago: 1_788_296.13, pago_pct: 21.25, rp: 1_899_765.99 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function N(v: number) {
  if (v === 0) return "0,00";
  return v?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function P(v: number) { return v?.toFixed(2).replace(".", ","); }

// ── Estilos das células ───────────────────────────────────────────────────────

const TH = "bg-[#D9E1F2] border border-gray-500 text-[10px] font-bold text-center px-1 py-1 leading-tight";
const TD = "border border-gray-400 text-[9.5px] px-1 py-[2px] whitespace-nowrap";
const TDN = "border border-gray-400 text-[9.5px] px-1 py-[2px] text-right tabular-nums whitespace-nowrap";
const TR_GROUP = "bg-[#BDD7EE] font-bold";
const TR_SUB   = "bg-white";
const TR_TOTAL = "bg-[#BDD7EE] font-bold";

// ── Componente principal ──────────────────────────────────────────────────────

export default function RREOAnexo12() {
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);
  const API = (import.meta as { env: { VITE_API_URL?: string } }).env.VITE_API_URL ?? "";

  function toggleSub(id: string) {
    setExpandidos(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handlePrint() { window.print(); }

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white" ref={printRef}>

      {/* ── Barra de ações (oculta na impressão) ── */}
      <div className="flex items-center justify-between mb-3 print:hidden">
        <div className="flex items-center gap-2">
          {APURACAO.cumpriu ? (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-green-700 bg-green-50 border border-green-300 rounded px-3 py-1">
              <CheckCircle2 size={15}/> LIMITE ASPS CUMPRIDO — {P(APURACAO.pct_liq)}% aplicado (mín. 15%)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-red-700 bg-red-50 border border-red-300 rounded px-3 py-1">
              <AlertCircle size={15}/> LIMITE ASPS NÃO CUMPRIDO
            </span>
          )}
          <span className="text-xs text-gray-500 flex items-center gap-1"><Info size={12}/> Clique nas linhas para expandir</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs bg-white border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50">
            <Printer size={13}/> Imprimir
          </button>
          <button onClick={async () => {
            const r = await fetch(`${API}/api/rreo-anexo12/exportar-pdf`);
            if (!r.ok) { alert("Erro ao gerar PDF. Backend offline?"); return; }
            const blob = await r.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
            a.download = "rreo_anexo12_apui_2026.pdf";
            a.click(); URL.revokeObjectURL(a.href);
          }} className="flex items-center gap-1.5 text-xs bg-blue-700 text-white rounded px-3 py-1.5 hover:bg-blue-800 cursor-pointer border-0">
            <Download size={13}/> Exportar PDF
          </button>
        </div>
      </div>

      {/* ── Container do relatório ── */}
      <div className="bg-white border border-gray-400 shadow-sm mx-auto max-w-[1400px] p-4 print:shadow-none print:border-0">

        {/* ── Cabeçalho oficial ── */}
        <div className="border-b-2 border-gray-700 pb-2 mb-3">
          <div className="flex justify-between text-[10px] text-gray-600">
            <span><strong>UF:</strong> {META.uf}</span>
            <span><strong>MUNICIPIO:</strong> {META.municipio}</span>
          </div>
          <div className="text-center mt-1">
            <p className="text-[13px] font-bold uppercase tracking-wide text-gray-800">
              RELATÓRIO RESUMIDO DA EXECUÇÃO ORÇAMENTÁRIA
            </p>
            <p className="text-[11px] font-bold uppercase text-gray-700">
              DEMONSTRATIVO DAS RECEITAS E DESPESAS COM AÇÕES E SERVIÇOS PÚBLICOS DE SAÚDE
            </p>
            <p className="text-[11px] font-bold uppercase text-gray-700">
              ORÇAMENTOS FISCAL E DA SEGURIDADE SOCIAL
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">
              {META.bimestre} Bimestre — {META.periodo} de {META.exercicio}
            </p>
          </div>
          <div className="flex justify-between items-end text-[9px] text-gray-600 mt-1">
            <span className="font-semibold">{META.anexo}</span>
            <span className="text-gray-500 italic">Em R$ 1,00</span>
          </div>
        </div>

        {/* ══ SEÇÃO 1: RECEITAS ═══════════════════════════════════════════════ */}
        <p className="text-[9px] font-bold text-gray-700 mb-1 uppercase">
          Receitas Resultantes de Impostos e Transferências Constitucionais e Legais
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse text-[9.5px]">
            <thead>
              <tr>
                <th className={`${TH} w-[45%] text-left`}>
                  RECEITAS RESULTANTES DE IMPOSTOS E TRANSFERÊNCIAS CONSTITUCIONAIS E LEGAIS
                </th>
                <th className={`${TH} w-[18%]`}>PREVISÃO INICIAL</th>
                <th className={`${TH} w-[18%]`}>PREVISÃO ATUALIZADA (a)</th>
                <th className={`${TH} w-[14%]`}>RECEITAS REALIZADAS Até o Bimestre (b)</th>
                <th className={`${TH} w-[5%]`}>% (b/a) × 100</th>
              </tr>
            </thead>
            <tbody>
              {/* Grupo Impostos */}
              <tr className="bg-[#DDEBF7] cursor-pointer hover:bg-[#C9DEF0]"
                  onClick={() => toggleSub("I")}>
                <td className={`${TD} font-bold pl-1`}>▸ {RECEITAS_IMPOSTOS.label}</td>
                <td className={TDN}>{N(RECEITAS_IMPOSTOS.prev_ini)}</td>
                <td className={TDN}>{N(RECEITAS_IMPOSTOS.prev_atu)}</td>
                <td className={TDN}>{N(RECEITAS_IMPOSTOS.realizada)}</td>
                <td className={TDN}>{P(RECEITAS_IMPOSTOS.pct)}</td>
              </tr>
              {expandidos.has("I") && RECEITAS_IMPOSTOS.itens.map((it, i) => (
                <tr key={i} className="bg-white">
                  <td className={`${TD} pl-5 text-[9px]`}>{it.desc}</td>
                  <td className={TDN}>{N(it.prev_ini)}</td>
                  <td className={TDN}>{N(it.prev_atu)}</td>
                  <td className={TDN}>{N(it.realizada)}</td>
                  <td className={TDN}>{P(it.pct)}</td>
                </tr>
              ))}

              {/* Grupo Transferências */}
              <tr className="bg-[#DDEBF7] cursor-pointer hover:bg-[#C9DEF0]"
                  onClick={() => toggleSub("II")}>
                <td className={`${TD} font-bold pl-1`}>▸ {RECEITAS_TRANSF.label}</td>
                <td className={TDN}>{N(RECEITAS_TRANSF.prev_ini)}</td>
                <td className={TDN}>{N(RECEITAS_TRANSF.prev_atu)}</td>
                <td className={TDN}>{N(RECEITAS_TRANSF.realizada)}</td>
                <td className={TDN}>{P(RECEITAS_TRANSF.pct)}</td>
              </tr>
              {expandidos.has("II") && RECEITAS_TRANSF.itens.map((it, i) => (
                <tr key={i} className="bg-white">
                  <td className={`${TD} pl-5 text-[9px]`}>{it.desc}</td>
                  <td className={TDN}>{N(it.prev_ini)}</td>
                  <td className={TDN}>{N(it.prev_atu)}</td>
                  <td className={TDN}>{N(it.realizada)}</td>
                  <td className={TDN}>{P(it.pct)}</td>
                </tr>
              ))}

              {/* Total III */}
              <tr className="bg-[#BDD7EE]">
                <td className={`${TD} font-bold text-[9.5px]`}>
                  TOTAL DAS RECEITAS RESULTANTES DE IMPOSTOS E TRANSFERÊNCIAS CONSTITUCIONAIS E LEGAIS – (III) = (I) + (II)
                </td>
                <td className={`${TDN} font-bold`}>{N(RECEITAS_TOTAL.prev_ini)}</td>
                <td className={`${TDN} font-bold`}>{N(RECEITAS_TOTAL.prev_atu)}</td>
                <td className={`${TDN} font-bold`}>{N(RECEITAS_TOTAL.realizada)}</td>
                <td className={`${TDN} font-bold`}>{P(RECEITAS_TOTAL.pct)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ══ SEÇÃO 2: DESPESAS ASPS ══════════════════════════════════════════ */}
        <p className="text-[9px] font-bold text-gray-700 mb-1 uppercase">
          Despesas com Ações e Serviços Públicos de Saúde (ASPS) – Por Subfunção e Categoria Econômica
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="border-collapse text-[9.5px]" style={{minWidth:"1100px",width:"100%"}}>
            <thead>
              <tr>
                <th className={`${TH} text-left`} style={{width:"26%"}}>
                  DESPESAS COM ASPS – POR SUBFUNÇÃO E CATEGORIA ECONÔMICA
                </th>
                <th className={TH}>DOTAÇÃO INICIAL</th>
                <th className={TH}>DOTAÇÃO ATUALIZADA (c)</th>
                <th className={TH} colSpan={2}>DESPESAS EMPENHADAS Até o Bimestre (d) / %</th>
                <th className={TH} colSpan={2}>DESPESAS LIQUIDADAS Até o Bimestre (e) / %</th>
                <th className={TH} colSpan={2}>DESPESAS PAGAS Até o Bimestre (f) / %</th>
                <th className={TH}>INSCRITAS EM RP NÃO PROCESSADOS (g)</th>
              </tr>
            </thead>
            <tbody>
              {DESPESAS.map((item) => (
                <>
                  {/* Linha agrupadora da subfunção */}
                  <tr key={item.id}
                      className="bg-[#DDEBF7] cursor-pointer hover:bg-[#C9DEF0]"
                      onClick={() => toggleSub(item.id)}>
                    <td className={`${TD} font-bold pl-1`}>▸ {item.label}</td>
                    <td className={TDN}>{N(item.dot_ini)}</td>
                    <td className={TDN}>{N(item.dot_atu)}</td>
                    <td className={TDN}>{N(item.emp)}</td>
                    <td className={TDN}>{P(item.emp_pct)}</td>
                    <td className={TDN}>{N(item.liq)}</td>
                    <td className={TDN}>{P(item.liq_pct)}</td>
                    <td className={TDN}>{N(item.pago)}</td>
                    <td className={TDN}>{P(item.pago_pct)}</td>
                    <td className={TDN}>{N(item.rp)}</td>
                  </tr>
                  {/* Sub-linhas: Correntes e Capital */}
                  {expandidos.has(item.id) && item.sub.map((s, i) => (
                    <tr key={i} className="bg-white">
                      <td className={`${TD} pl-5 text-[9px]`}>{s.desc}</td>
                      <td className={TDN}>{N(s.dot_ini)}</td>
                      <td className={TDN}>{N(s.dot_atu)}</td>
                      <td className={TDN}>{N(s.emp)}</td>
                      <td className={TDN}>{P(s.emp_pct)}</td>
                      <td className={TDN}>{N(s.liq)}</td>
                      <td className={TDN}>{P(s.liq_pct)}</td>
                      <td className={TDN}>{N(s.pago)}</td>
                      <td className={TDN}>{P(s.pago_pct)}</td>
                      <td className={TDN}>{N(s.rp)}</td>
                    </tr>
                  ))}
                </>
              ))}

              {/* Total XI */}
              <tr className={TR_TOTAL}>
                <td className={`${TD} font-bold`}>{TOTAL_XI.label}</td>
                <td className={`${TDN} font-bold`}>{N(TOTAL_XI.dot_ini)}</td>
                <td className={`${TDN} font-bold`}>{N(TOTAL_XI.dot_atu)}</td>
                <td className={`${TDN} font-bold`}>{N(TOTAL_XI.emp)}</td>
                <td className={`${TDN} font-bold`}>{P(TOTAL_XI.emp_pct)}</td>
                <td className={`${TDN} font-bold`}>{N(TOTAL_XI.liq)}</td>
                <td className={`${TDN} font-bold`}>{P(TOTAL_XI.liq_pct)}</td>
                <td className={`${TDN} font-bold`}>{N(TOTAL_XI.pago)}</td>
                <td className={`${TDN} font-bold`}>{P(TOTAL_XI.pago_pct)}</td>
                <td className={`${TDN} font-bold`}>{N(TOTAL_XI.rp)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ══ SEÇÃO 3: APURAÇÃO DO MÍNIMO ═════════════════════════════════════ */}
        <p className="text-[9px] font-bold text-gray-700 mb-1 uppercase">
          Apuração do Cumprimento do Limite Mínimo para Aplicação em ASPS
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse text-[9.5px]">
            <thead>
              <tr>
                <th className={`${TH} w-[55%] text-left`}>APURAÇÃO DO CUMPRIMENTO DO LIMITE MÍNIMO PARA APLICAÇÃO EM ASPS</th>
                <th className={TH}>DESPESAS EMPENHADAS (d)</th>
                <th className={TH}>DESPESAS LIQUIDADAS (e)</th>
                <th className={TH}>DESPESAS PAGAS (f)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className={TD}>Total das Despesas com ASPS (XII) = (XI)</td>
                <td className={TDN}>{N(APURACAO.valor_aplicado_emp)}</td>
                <td className={TDN}>{N(APURACAO.valor_aplicado_liq)}</td>
                <td className={TDN}>{N(APURACAO.valor_aplicado_pago)}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className={TD}>(-) Restos a Pagar Inscritos Indevidamente no Exercício sem Disponibilidade Financeira (XIII)</td>
                <td className={`${TDN} text-gray-400`}>N/A</td>
                <td className={`${TDN} text-gray-400`}>N/A</td>
                <td className={`${TDN} text-gray-400`}>N/A</td>
              </tr>
              <tr className="bg-white">
                <td className={TD}>(-) Despesas Custeadas com Recursos Vinculados à Parcela do Percentual Mínimo que não foi Aplicada em ASPS em Exercícios Anteriores (XIV)</td>
                <td className={TDN}>0,00</td>
                <td className={TDN}>0,00</td>
                <td className={TDN}>0,00</td>
              </tr>
              <tr className="bg-gray-50">
                <td className={TD}>(-) Despesas Custeadas com Disponibilidade de Caixa Vinculada aos Restos a Pagar Cancelados (XV)</td>
                <td className={TDN}>0,00</td>
                <td className={TDN}>0,00</td>
                <td className={TDN}>0,00</td>
              </tr>
              <tr className="bg-[#DDEBF7] font-bold">
                <td className={`${TD} font-bold`}>(=) VALOR APLICADO EM ASPS (XVI) = (XII – XIII – XIV – XV)</td>
                <td className={`${TDN} font-bold`}>{N(APURACAO.valor_aplicado_emp)}</td>
                <td className={`${TDN} font-bold`}>{N(APURACAO.valor_aplicado_liq)}</td>
                <td className={`${TDN} font-bold`}>{N(APURACAO.valor_aplicado_pago)}</td>
              </tr>
              <tr className="bg-white">
                <td className={TD}>Despesa Mínima a ser Aplicada em ASPS (XVII) = (III) × 15% (LC 141/2012)</td>
                <td className={TDN}></td>
                <td className={TDN}></td>
                <td className={`${TDN} font-bold text-blue-800`}>{N(APURACAO.minimo_15pct)}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className={TD}>Despesa Mínima a ser Aplicada em ASPS (XVII) = (III) × % (Lei Orgânica Municipal)</td>
                <td className={TDN}></td>
                <td className={TDN}></td>
                <td className={`${TDN} text-gray-400`}>N/A</td>
              </tr>
              <tr className="bg-white">
                <td className={TD}>Diferença entre o Valor Aplicado e a Despesa Mínima a ser Aplicada (XVIII) = (XVI (d ou e) – XVII)</td>
                <td className={`${TDN} text-green-700`}>{N(APURACAO.diferenca_emp)}</td>
                <td className={`${TDN} text-green-700`}>{N(APURACAO.diferenca_liq)}</td>
                <td className={`${TDN} text-green-700`}>{N(APURACAO.diferenca_pago)}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className={TD}>Limite não Cumprido (XIX) = (XVIII) (Quando valor for inferior a zero)</td>
                <td className={TDN}>0,00</td>
                <td className={TDN}>0,00</td>
                <td className={TDN}>0,00</td>
              </tr>

              {/* Linha de destaque: % aplicado */}
              <tr className={`${APURACAO.cumpriu ? "bg-green-50 border-l-4 border-l-green-500" : "bg-red-50 border-l-4 border-l-red-500"}`}>
                <td className={`${TD} font-bold`}>
                  PERCENTUAL DA RECEITA DE IMPOSTOS E TRANSFERÊNCIAS CONSTITUCIONAIS E LEGAIS APLICADO EM ASPS
                  (XVI / III) × 100 — mínimo de 15% conforme LC n° 141/2012
                </td>
                <td className={`${TDN} font-bold ${APURACAO.cumpriu ? "text-green-800" : "text-red-800"}`}>
                  {P(APURACAO.pct_emp)}%
                </td>
                <td className={`${TDN} font-bold ${APURACAO.cumpriu ? "text-green-800" : "text-red-800"}`}>
                  {P(APURACAO.pct_liq)}%
                </td>
                <td className={`${TDN} font-bold ${APURACAO.cumpriu ? "text-green-800" : "text-red-800"}`}>
                  {P(APURACAO.pct_pago)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ══ SEÇÃO 4: RECEITAS ADICIONAIS ════════════════════════════════════ */}
        <p className="text-[9px] font-bold text-gray-700 mb-1 uppercase">
          Receitas Adicionais para Financiamento da Saúde
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse text-[9.5px]">
            <thead>
              <tr>
                <th className={`${TH} w-[45%] text-left`}>RECEITAS ADICIONAIS PARA FINANCIAMENTO DA SAÚDE</th>
                <th className={TH}>PREVISÃO INICIAL</th>
                <th className={TH}>PREVISÃO ATUALIZADA (a)</th>
                <th className={TH}>RECEITAS REALIZADAS Até o Bimestre (b)</th>
                <th className={TH}>% (b/a) × 100</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#DDEBF7] cursor-pointer hover:bg-[#C9DEF0]"
                  onClick={() => toggleSub("XXIX")}>
                <td className={`${TD} font-bold pl-1`}>▸ RECEITAS DE TRANSFERÊNCIAS PARA A SAÚDE (XXIX)</td>
                <td className={TDN}>{N(RECEITAS_ADIC.total.prev_ini)}</td>
                <td className={TDN}>{N(RECEITAS_ADIC.total.prev_atu)}</td>
                <td className={TDN}>{N(RECEITAS_ADIC.total.realizada)}</td>
                <td className={TDN}>{P(RECEITAS_ADIC.total.pct)}</td>
              </tr>
              {expandidos.has("XXIX") && RECEITAS_ADIC.itens.map((it, i) => (
                <tr key={i} className="bg-white">
                  <td className={`${TD} pl-5 text-[9px]`}>{it.desc}</td>
                  <td className={TDN}>{N(it.prev_ini)}</td>
                  <td className={TDN}>{N(it.prev_atu)}</td>
                  <td className={TDN}>{N(it.realizada)}</td>
                  <td className={TDN}>{P(it.pct)}</td>
                </tr>
              ))}
              <tr className="bg-white">
                <td className={TD}>RECEITA DE OPERAÇÕES DE CRÉDITO INTERNAS E EXTERNAS VINCULADAS À SAÚDE (XXX)</td>
                <td className={TDN}>0,00</td><td className={TDN}>0,00</td>
                <td className={TDN}>0,00</td><td className={TDN}>0,00</td>
              </tr>
              <tr className="bg-gray-50">
                <td className={TD}>OUTRAS RECEITAS (XXXI)</td>
                <td className={TDN}>0,00</td><td className={TDN}>0,00</td>
                <td className={TDN}>0,00</td><td className={TDN}>0,00</td>
              </tr>
              <tr className={TR_TOTAL}>
                <td className={`${TD} font-bold`}>TOTAL RECEITAS ADICIONAIS PARA FINANCIAMENTO DA SAÚDE (XXXII) = (XXIX + XXX + XXXI)</td>
                <td className={`${TDN} font-bold`}>{N(RECEITAS_ADIC.total.prev_ini)}</td>
                <td className={`${TDN} font-bold`}>{N(RECEITAS_ADIC.total.prev_atu)}</td>
                <td className={`${TDN} font-bold`}>{N(RECEITAS_ADIC.total.realizada)}</td>
                <td className={`${TDN} font-bold`}>{P(RECEITAS_ADIC.total.pct)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ══ SEÇÃO 5: DESPESAS TOTAIS COM SAÚDE ══════════════════════════════ */}
        <p className="text-[9px] font-bold text-gray-700 mb-1 uppercase">
          Despesas com Saúde — Totais
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="border-collapse text-[9.5px]" style={{minWidth:"1100px",width:"100%"}}>
            <thead>
              <tr>
                <th className={`${TH} text-left`} style={{width:"26%"}}>DESPESAS COM SAÚDE (POR GRUPO DE NATUREZA DA DESPESA)</th>
                <th className={TH}>DOTAÇÃO INICIAL</th>
                <th className={TH}>DOTAÇÃO ATUALIZADA (c)</th>
                <th className={TH}>DESP. EMPENHADAS Até o Bimestre (d)</th>
                <th className={TH}>%</th>
                <th className={TH}>DESP. LIQUIDADAS Até o Bimestre (e)</th>
                <th className={TH}>%</th>
                <th className={TH}>DESP. PAGAS Até o Bimestre (f)</th>
                <th className={TH}>%</th>
                <th className={TH}>INSCRITAS EM RP NÃO PROCESSADOS (g)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#DDEBF7] font-bold">
                <td className={`${TD} font-bold`}>TOTAL DAS DESPESAS COM SAÚDE (XLVIII) = (XI + XL)</td>
                <td className={`${TDN} font-bold`}>{N(TOTAL_SAUDE.dot_ini)}</td>
                <td className={`${TDN} font-bold`}>{N(TOTAL_SAUDE.dot_atu)}</td>
                <td className={`${TDN} font-bold`}>{N(TOTAL_SAUDE.emp)}</td>
                <td className={`${TDN} font-bold`}>{P(TOTAL_SAUDE.emp_pct)}</td>
                <td className={`${TDN} font-bold`}>{N(TOTAL_SAUDE.liq)}</td>
                <td className={`${TDN} font-bold`}>{P(TOTAL_SAUDE.liq_pct)}</td>
                <td className={`${TDN} font-bold`}>{N(TOTAL_SAUDE.pago)}</td>
                <td className={`${TDN} font-bold`}>{P(TOTAL_SAUDE.pago_pct)}</td>
                <td className={`${TDN} font-bold`}>{N(TOTAL_SAUDE.rp)}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className={`${TD} pl-3 text-[9px]`}>(-) Despesas da Fonte: Transferências da União — inciso I do art. 5º da LC 173/2020</td>
                <td className={TDN}>{N(14_016_765.00)}</td>
                <td className={TDN}>{N(16_922_797.36)}</td>
                <td className={TDN}>{N(4_590_754.54)}</td>
                <td className={TDN}>27,13</td>
                <td className={TDN}>{N(2_266_544.68)}</td>
                <td className={TDN}>13,39</td>
                <td className={TDN}>{N(2_264_211.35)}</td>
                <td className={TDN}>13,38</td>
                <td className={TDN}>{N(2_324_209.86)}</td>
              </tr>
              <tr className="bg-[#BDD7EE] font-bold border-t-2 border-gray-600">
                <td className={`${TD} font-bold`}>TOTAL DAS DESPESAS EXECUTADAS COM RECURSOS PRÓPRIOS (XLIX)</td>
                <td className={`${TDN} font-bold`}>{N(RECURSOS_PROPRIOS.dot_ini)}</td>
                <td className={`${TDN} font-bold`}>{N(RECURSOS_PROPRIOS.dot_atu)}</td>
                <td className={`${TDN} font-bold`}>{N(RECURSOS_PROPRIOS.emp)}</td>
                <td className={`${TDN} font-bold`}>{P(RECURSOS_PROPRIOS.emp_pct)}</td>
                <td className={`${TDN} font-bold`}>{N(RECURSOS_PROPRIOS.liq)}</td>
                <td className={`${TDN} font-bold`}>{P(RECURSOS_PROPRIOS.liq_pct)}</td>
                <td className={`${TDN} font-bold`}>{N(RECURSOS_PROPRIOS.pago)}</td>
                <td className={`${TDN} font-bold`}>{P(RECURSOS_PROPRIOS.pago_pct)}</td>
                <td className={`${TDN} font-bold`}>{N(RECURSOS_PROPRIOS.rp)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Notas de rodapé ── */}
        <div className="border-t border-gray-400 pt-2 mt-2">
          <p className="text-[8px] text-gray-600 leading-tight">
            <strong>FONTE:</strong> {META.fonte} &nbsp;|&nbsp;
            <strong>Responsável:</strong> {META.responsavel} &nbsp;|&nbsp;
            Ministério da Saúde / DATASUS / SIOPS
          </p>
          <p className="text-[7.5px] text-gray-500 mt-0.5 leading-tight">
            1 – Nos cinco primeiros bimestres, o acompanhamento será feito com base na despesa liquidada. No último bimestre, o valor deverá corresponder ao total empenhado.
          </p>
          <p className="text-[7.5px] text-gray-500 leading-tight">
            2 – No caso dos municípios, o percentual mínimo a ser aplicado em ASPS corresponde ao estabelecido na LC n° 141/2012 (15%) ou no respectivo percentual definido em Lei Orgânica Municipal, se superior.
          </p>
          <p className="text-[7.5px] text-gray-500 leading-tight">
            3 – A partir de 2019, o controle da execução dos restos a pagar considera os restos a pagar processados e não processados.
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A3 landscape; margin: 1cm; }
          body { font-size: 8px; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
