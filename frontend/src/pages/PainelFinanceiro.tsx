import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, Cell,
} from "recharts";
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Clock, RefreshCw, Download, FileText,
  ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { apiGet } from "../lib/api";
import { BRL, BRL_AXIS } from "../lib/fmt";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Bloco {
  bloco: string; codigo: string; cor: string;
  previsto_ano: number; recebido_ano: number;
  empenhado: number; liquidado: number; pago: number;
  pct_execucao: number;
  ultima_parcela: string; proxima_parcela: string;
}

interface Empenho {
  id: string; credor: string; objeto: string; valor: number;
  data: string; bloco: string; status: string;
}

interface Repasse { mes: string; previsto: number; recebido: number | null; diferenca: number | null }

interface Siops {
  pct_proprio_saude: number; meta_minima: number; conforme: boolean;
  margem_seguranca: number;
  historico: { ano: number; pct: number; conforme: boolean; parcial?: boolean }[];
}

interface Painel {
  municipio: string; uf: string; mes_referencia: string;
  receitas: Record<string, number>;
  despesas: Record<string, number>;
  blocos: Bloco[];
  blocos_mes?: any[];
  repasses_mensais: Repasse[];
  empenhos_pendentes: Empenho[];
  siops: Siops;
  alertas: { nivel: string; bloco: string; msg: string }[];
  kpis: {
    pct_execucao_geral: number; pct_arrecadacao: number;
    saldo_disponivel: number; siops_conforme: boolean;
    total_empenhos_pendentes: number; valor_pendente_liquidar: number;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const R = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

const Pct = ({ v, meta, inverted = false }: { v: number; meta?: number; inverted?: boolean }) => {
  const ok = meta ? (inverted ? v <= meta : v >= meta) : v >= 70;
  return (
    <span style={{ fontWeight: 700, color: ok ? "#16a34a" : v >= (meta ?? 0) * 0.8 ? "#d97706" : "#dc2626" }}>
      {v.toFixed(1)}%
    </span>
  );
};

function MiniBar({ pct, cor, height = 8 }: { pct: number; cor: string; height?: number }) {
  return (
    <div style={{ height, background: "#e5e7eb", borderRadius: height / 2, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: cor, transition: "width .6s", borderRadius: height / 2 }} />
    </div>
  );
}

const TOOLTIPSTYLE = { fontSize: 12, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };

// ── Card KPI ──────────────────────────────────────────────────────────────────

function KpiCard({ label, val, sub, icon, bg, cor, delta }: {
  label: string; val: string; sub?: string; icon: React.ReactNode;
  bg: string; cor: string; delta?: number;
}) {
  return (
    <div style={{ background: bg, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ color: cor, opacity: .8 }}>{icon}</div>
        {delta !== undefined && (
          <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 2, color: delta >= 0 ? "#16a34a" : "#dc2626" }}>
            {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: cor }}>{val}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Bloco card ────────────────────────────────────────────────────────────────

function BlocoCard({ b }: { b: Bloco }) {
  const [open, setOpen] = useState(false);
  const cor = b.pct_execucao >= 65 ? "#16a34a" : b.pct_execucao >= 40 ? "#d97706" : "#dc2626";

  return (
    <div style={{ border: `1px solid ${b.cor}30`, borderLeft: `4px solid ${b.cor}`, borderRadius: 8, overflow: "hidden", background: "#fff" }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", cursor: "pointer" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: b.cor + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: b.cor }}>{b.codigo}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{b.bloco}</div>
          <MiniBar pct={b.pct_execucao} cor={cor} />
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: cor }}>{b.pct_execucao}%</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>exec.</div>
        </div>
        {open ? <ChevronDown size={14} color="#9ca3af" /> : <ChevronRight size={14} color="#9ca3af" />}
      </div>

      {open && (
        <div style={{ padding: "10px 14px 14px", borderTop: `1px solid ${b.cor}20`, background: b.cor + "05" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 10 }}>
            {[
              { label: "Recebido FNS",  val: R(b.recebido_ano),  cor: "#2563eb" },
              { label: "Liquidado",     val: R(b.liquidado),     cor: "#d97706" },
              { label: "Pago",          val: R(b.pago),          cor: "#16a34a" },
            ].map(k => (
              <div key={k.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: k.cor }}>{k.val}</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{k.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#6b7280" }}>
            <span>Última parcela: {b.ultima_parcela}</span>
            <span>Próxima: <strong>{b.proxima_parcela}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tooltip personalizado para gráficos ───────────────────────────────────────

function TooltipRepasse({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const prev = payload.find((p: any) => p.dataKey === "previsto");
  const rec  = payload.find((p: any) => p.dataKey === "recebido");
  return (
    <div style={{ ...TOOLTIPSTYLE, padding: "8px 12px" }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {prev && <div style={{ color: "#1d4ed8" }}>Previsto: {R(prev.value)}</div>}
      {rec  && <div style={{ color: "#4ade80" }}>Recebido: {R(rec.value)}</div>}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

// ── Consulta FNS Detalhada ────────────────────────────────────────────────────

const MESES_FNS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const TIPOS_CONSULTA = ["Fundo a Fundo","Convênios/Instrumentos","Emendas Parlamentares","Ações e Programas"];
const BLOCOS_FNS_OPT = ["Atenção Primária","Atenção Especializada","Vigilância em Saúde","Assistência Farmacêutica","Gestão do SUS","Estruturação"];
const REPASSES_FNS = ["PAB Fixo","PAB Variável","Média e Alta Complexidade","FAEC","Medicamentos","Ações Estratégicas"];
const ESTADOS_BR = ["","AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const BRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const TIPOS_ABA_FNS = [
  { id: "detalhada",         label: "Detalhada",                                    publico: true,  hash: "detalhada"          },
  { id: "consolidada",       label: "Consolidada Fundo a Fundo",                    publico: true,  hash: "consolidada"        },
  { id: "repasse-dia",       label: "Repasses do Dia",                              publico: true,  hash: "contas-bancarias"   },
  { id: "contas-bancarias",  label: "Contas Bancárias",                             publico: true,  hash: "contas-bancarias"   },
  { id: "desconto-mac",      label: "Desconto Mac",                                 publico: true,  hash: "desconto-mac"       },
  { id: "convenios",         label: "Convênios/TED/Termo de Cooperação",            publico: false, hash: "convenios"          },
  { id: "equipamentos",      label: "Equipamentos e Materiais Permanentes",         publico: false, hash: "equipamentos"       },
  { id: "pendencias",        label: "Fundos de Saúde - Pendências NJ/CNPJ",        publico: false, hash: "pendencias"         },
  { id: "grafico",           label: "Gráfico Comparativo por Ano",                  publico: false, hash: "grafico-comparativo"},
  { id: "proposta",          label: "Proposta",                                     publico: false, hash: "proposta"           },
];

// ── Mapeamento de portarias por ação (usado quando API não retorna o campo) ──
const PORTARIA_MAP: Record<string, { portaria: string; base_legal: string; link_portaria: string }> = {
  "ATENÇÃO À SAÚDE DA POPULAÇÃO PARA PROCEDIMENTOS NO MAC": {
    portaria: "Portaria de Consolidação GM/MS nº 6/2017 — Bloco MAC (Atenção de Média e Alta Complexidade Ambulatorial e Hospitalar)",
    base_legal: "Lei nº 8.080/1990, art. 26; Port. GM/MS nº 1.631/2015; Nota Técnica DAHU/MS",
    link_portaria: "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prc0006_03_10_2017.html",
  },
  "EMENDA - INCREMENTO TEMPORÁRIO AO CUSTEIO DOS SERVIÇOS DE ASSISTÊNCIA HOSPITALAR E AMBULATORIAL": {
    portaria: "Lei Orçamentária Anual (LOA) — Emenda Parlamentar ao custeio do MAC",
    base_legal: "CF/1988, art. 166, §9º; Lei nº 8.080/1990; Resolução CFO nº 1/2006",
    link_portaria: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
  },
  "INCENTIVO FINANCEIRO DA APS - ATENCAO A SAUDE BUCAL": {
    portaria: "Portaria GM/MS nº 3.493, de 10 de abril de 2024 — Novo Financiamento da Atenção Primária à Saúde",
    base_legal: "Lei nº 8.080/1990, art. 198 §1º; Dec. nº 7.508/2011; Port. GM/MS nº 3.493/2024, Anexo III",
    link_portaria: "https://www.in.gov.br/en/web/dou/-/portaria-gm/ms-n-3.493-de-10-de-abril-de-2024",
  },
  "INCENTIVO FINANCEIRO DA APS - EQUIPES DE SAÚDE DA FAMÍLIA/ESF E EQUIPES DE ATENÇÃO PRIMÁRIA/EAP": {
    portaria: "Portaria GM/MS nº 3.493, de 10 de abril de 2024 — Novo Financiamento da Atenção Primária à Saúde",
    base_legal: "Lei nº 8.080/1990, art. 198 §1º; Dec. nº 7.508/2011; Port. GM/MS nº 3.493/2024, Anexos I e II",
    link_portaria: "https://www.in.gov.br/en/web/dou/-/portaria-gm/ms-n-3.493-de-10-de-abril-de-2024",
  },
  "INCENTIVO FINANCEIRO DA APS - DEMAIS PROGRAMAS, SERVIÇOS E EQUIPES DA ATENÇÃO PRIMÁRIA": {
    portaria: "Portaria GM/MS nº 3.493, de 10 de abril de 2024 — Novo Financiamento da Atenção Primária à Saúde",
    base_legal: "Lei nº 8.080/1990, art. 198 §1º; Dec. nº 7.508/2011; Port. GM/MS nº 3.493/2024, Anexo IV",
    link_portaria: "https://www.in.gov.br/en/web/dou/-/portaria-gm/ms-n-3.493-de-10-de-abril-de-2024",
  },
  "INCENTIVO FINANCEIRO DA APS - EQUIPES MULTIPROFISSIONAIS - EMULTI": {
    portaria: "Portaria GM/MS nº 635, de 22 de maio de 2023 — Equipes Multiprofissionais (eMulti) | Port. GM/MS nº 3.493/2024",
    base_legal: "Lei nº 8.080/1990; Port. GM/MS nº 635/2023; Port. GM/MS nº 3.493/2024, Anexo V",
    link_portaria: "https://www.in.gov.br/en/web/dou/-/portaria-gm/ms-n-635-de-22-de-maio-de-2023",
  },
  "AGENTES COMUNITÁRIOS DE SAÚDE": {
    portaria: "Portaria GM/MS nº 3.493, de 10 de abril de 2024 — Novo Financiamento da Atenção Primária à Saúde",
    base_legal: "Lei nº 11.350/2006 (ACS e ACE); Port. GM/MS nº 3.493/2024, Anexo VI; Dec. nº 7.508/2011",
    link_portaria: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11350.htm",
  },
  "TRANSFERÊNCIA AOS ENTES FEDERATIVOS PARA O PAGAMENTO DOS VENCIMENTOS DOS AGENTES DE COMBATE ÀS ENDEMIAS": {
    portaria: "Lei nº 11.350/2006 — Agentes de Combate às Endemias (ACE) | Port. GM/MS nº 1.378/2013 — Vigilância em Saúde",
    base_legal: "Lei nº 11.350/2006, art. 11; Port. GM/MS nº 1.378/2013; Dec. nº 7.508/2011",
    link_portaria: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11350.htm",
  },
  "INCENTIVO FINANCEIRO AOS ESTADOS, DISTRITO FEDERAL E MUNICÍPIOS PARA A VIGILÂNCIA EM SAÚDE - DESPESAS": {
    portaria: "Portaria GM/MS nº 1.378, de 9 de julho de 2013 — Vigilância em Saúde",
    base_legal: "Lei nº 8.080/1990; Port. GM/MS nº 1.378/2013; Dec. nº 7.508/2011",
    link_portaria: "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2013/prt1378_09_07_2013.html",
  },
  "CBAF - RECURSOS FINANCEIROS A TRANSFERIR PARA AQUISICAO PELAS SECRETARIAS DE SAUDE DOS ESTADOS, MUNICIPIOS E DO DISTRITO FEDERAL": {
    portaria: "Portaria GM/MS nº 3.992/2017 — Financiamento e transferência de recursos federais para Assistência Farmacêutica",
    base_legal: "Lei nº 8.080/1990, art. 6º e 26; Dec. nº 7.508/2011; Port. GM/MS nº 3.992/2017",
    link_portaria: "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prt3992_28_12_2017.html",
  },
};

const PORTARIA_KEYWORDS: Array<{ keywords: string[]; key: string }> = [
  { keywords: ["PROCEDIMENTOS NO MAC", "ATENÇÃO À SAÚDE DA POPULAÇÃO"], key: "ATENÇÃO À SAÚDE DA POPULAÇÃO PARA PROCEDIMENTOS NO MAC" },
  { keywords: ["EMENDA", "INCREMENTO TEMPORÁRIO"], key: "EMENDA - INCREMENTO TEMPORÁRIO AO CUSTEIO DOS SERVIÇOS DE ASSISTÊNCIA HOSPITALAR E AMBULATORIAL" },
  { keywords: ["SAUDE BUCAL", "SAÚDE BUCAL", "BUCAL"], key: "INCENTIVO FINANCEIRO DA APS - ATENCAO A SAUDE BUCAL" },
  { keywords: ["EMULTI", "MULTIPROFISSIONAIS", "EQUIPES MULTIPROFISSIONAIS"], key: "INCENTIVO FINANCEIRO DA APS - EQUIPES MULTIPROFISSIONAIS - EMULTI" },
  { keywords: ["ESF", "EQUIPES DE SAÚDE DA FAMÍLIA", "EQUIPES DE SAUDE DA FAMILIA", "EAP"], key: "INCENTIVO FINANCEIRO DA APS - EQUIPES DE SAÚDE DA FAMÍLIA/ESF E EQUIPES DE ATENÇÃO PRIMÁRIA/EAP" },
  { keywords: ["DEMAIS PROGRAMAS", "DEMAIS PROG"], key: "INCENTIVO FINANCEIRO DA APS - DEMAIS PROGRAMAS, SERVIÇOS E EQUIPES DA ATENÇÃO PRIMÁRIA" },
  { keywords: ["AGENTES COMUNITÁRIOS", "AGENTES COMUNITARIOS", "ACS"], key: "AGENTES COMUNITÁRIOS DE SAÚDE" },
  { keywords: ["AGENTES DE COMBATE", "ENDEMIAS", "ACE"], key: "TRANSFERÊNCIA AOS ENTES FEDERATIVOS PARA O PAGAMENTO DOS VENCIMENTOS DOS AGENTES DE COMBATE ÀS ENDEMIAS" },
  { keywords: ["VIGILÂNCIA EM SAÚDE", "VIGILANCIA EM SAUDE", "INCENTIVO FINANCEIRO AOS ESTADOS"], key: "INCENTIVO FINANCEIRO AOS ESTADOS, DISTRITO FEDERAL E MUNICÍPIOS PARA A VIGILÂNCIA EM SAÚDE - DESPESAS" },
  { keywords: ["CBAF", "AQUISICAO", "AQUISIÇÃO"], key: "CBAF - RECURSOS FINANCEIROS A TRANSFERIR PARA AQUISICAO PELAS SECRETARIAS DE SAUDE DOS ESTADOS, MUNICIPIOS E DO DISTRITO FEDERAL" },
];

function _getPortaria(row: any) {
  if (row.portaria) return row;
  const text = ((row.acao ?? "") + " " + (row.acao_detalhada ?? "")).toUpperCase();
  if (!text.trim()) return null;
  for (const { keywords, key } of PORTARIA_KEYWORDS) {
    if (keywords.some(kw => text.includes(kw.toUpperCase())) && PORTARIA_MAP[key]) {
      return { ...row, ...PORTARIA_MAP[key] };
    }
  }
  return null;
}

function AbaConsultaFNS() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = MESES_FNS[new Date().getMonth()];
  const hoje = new Date();

  // ── Tipo de aba ───────────────────────────────────────────────────────────
  const [tipoAba, setTipoAba]       = useState("detalhada");
  const [showMenuTipos, setShowMenuTipos] = useState(false);
  const tipoAtual = TIPOS_ABA_FNS.find(t => t.id === tipoAba) ?? TIPOS_ABA_FNS[0];

  // ── Detalhada states ──────────────────────────────────────────────────────
  const [ano, setAno]             = useState(String(anoAtual));
  const [mes, setMes]             = useState(mesAtual);
  const [tipoConsulta, setTipo]   = useState("Fundo a Fundo");
  const [bloco, setBloco]         = useState("");
  const [cpf, setCpf]             = useState("");
  const [estado, setEstado]       = useState("AM");
  const [municipio, setMunicipio] = useState("APUÍ");
  const [municipiosLista, setMunicipiosLista] = useState<string[]>([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);

  useEffect(() => {
    if (!estado) { setMunicipiosLista([]); return; }
    setLoadingMunicipios(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios?orderBy=nome`)
      .then(r => r.json())
      .then((data: { nome: string }[]) => {
        const lista = data.map(m => m.nome.toUpperCase());
        setMunicipiosLista(lista);
        setMunicipio(prev => lista.includes(prev.toUpperCase()) ? prev.toUpperCase() : (lista[0] ?? ""));
      })
      .catch(() => setMunicipiosLista([]))
      .finally(() => setLoadingMunicipios(false));
  }, [estado]);

  const [processo, setProcesso]   = useState("");
  const [propostaNum, setPropostaNum] = useState("");
  const [repasse, setRepasse]     = useState("");
  const [dtIni, setDtIni]         = useState("");
  const [dtFim, setDtFim]         = useState("");
  const [portaria, setPortaria]   = useState("");
  const [modalPortaria, setModalPortaria] = useState<any | null>(null);
  const [pgSize, setPgSize]       = useState(25);
  const [pgCur, setPgCur]         = useState(1);

  const [consultaParams, setConsultaParams] = useState<{
    estado: string; municipio: string; ano: string; mes: string; bloco: string;
  } | null>({ estado: "AM", municipio: "APUÍ", ano: String(anoAtual), mes: "", bloco: "" });

  const { data: fnsData, isFetching: fnsLoading } = useQuery({
    queryKey: ["fns-acoes", consultaParams],
    queryFn: () => {
      if (!consultaParams) return Promise.resolve(null);
      const p = new URLSearchParams({
        estado: consultaParams.estado,
        municipio: consultaParams.municipio,
        ano: consultaParams.ano,
        mes: consultaParams.mes,
        ...(consultaParams.bloco ? { bloco: consultaParams.bloco } : {}),
      });
      return apiGet(`/api/financeiro/fns-acoes?${p}`) as Promise<any>;
    },
    enabled: !!consultaParams,
  });

  const acoes: any[] = fnsData?.acoes ?? [];
  const entidade = fnsData?.entidade;
  const totalPages = Math.ceil(acoes.length / pgSize);
  const paginadas = acoes.slice((pgCur - 1) * pgSize, pgCur * pgSize);

  const limpar = () => {
    setAno(String(anoAtual)); setMes(mesAtual); setTipo("Fundo a Fundo");
    setBloco(""); setCpf(""); setEstado(""); setMunicipio(""); setMunicipiosLista([]);
    setProcesso(""); setPropostaNum(""); setRepasse("");
    setDtIni(""); setDtFim(""); setPortaria("");
    setConsultaParams(null);
  };

  // ── Repasses do Dia states ────────────────────────────────────────────────
  const [rdAno, setRdAno] = useState(String(anoAtual));
  const [rdMes, setRdMes] = useState(String(hoje.getMonth() + 1).padStart(2, "0"));
  const [rdDia, setRdDia] = useState(String(hoje.getDate()).padStart(2, "0"));
  const [rdParams, setRdParams] = useState<{ ano: string; mes: string; dia: string } | null>(null);

  const { data: rdData, isFetching: rdLoading } = useQuery({
    queryKey: ["fns-repasse-dia", rdParams],
    queryFn: () => {
      if (!rdParams) return Promise.resolve(null);
      return apiGet(`/api/financeiro/fns-repasse-dia?ano=${rdParams.ano}&mes=${rdParams.mes}&dia=${rdParams.dia}`) as Promise<any>;
    },
    enabled: !!rdParams,
  });

  const inputSt: React.CSSProperties = { width: "100%", border: "1px solid #d1d5db", borderRadius: 4, padding: "7px 10px", fontSize: 13, background: "#fff", outline: "none", boxSizing: "border-box" };
  const selSt: React.CSSProperties   = { ...inputSt, cursor: "pointer" };
  const lblSt: React.CSSProperties   = { fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 };
  const btnConsultar = (loading: boolean, onClick: () => void) => (
    <button onClick={onClick} disabled={loading}
      style={{ background: loading ? "#6b7280" : "#2a5298", color: "#fff", border: "none", borderRadius: 4, padding: "8px 22px", cursor: loading ? "wait" : "pointer", fontSize: 13, fontWeight: 700 }}>
      {loading ? "⏳ Consultando..." : "🔍 Consultar"}
    </button>
  );

  /* ── Modal Portaria ─────────────────────────────────────────────────────── */
  const ModalPortaria = modalPortaria && (
    <div onClick={() => setModalPortaria(null)}
      style={{ position: "fixed", inset: 0, background: "rgba(10,20,50,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 10, padding: 28, maxWidth: 560, width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.22)", position: "relative" }}>
        {/* Cabeçalho */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Portaria de Referência</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a3a6b", lineHeight: 1.45 }}>{modalPortaria.grupo}</div>
            <div style={{ fontSize: 12, color: "#374151", marginTop: 4, lineHeight: 1.4 }}>{modalPortaria.acao_detalhada}</div>
          </div>
          <button onClick={() => setModalPortaria(null)}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af", marginLeft: 12, lineHeight: 1 }}>✕</button>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "0 0 16px" }} />

        {/* Portaria */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>📄 Instrumento Legal</div>
          <div style={{ fontSize: 13, color: "#111827", lineHeight: 1.55, fontWeight: 600 }}>{modalPortaria.portaria}</div>
        </div>

        {/* Base Legal */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>⚖️ Base Legal</div>
          <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.55 }}>{modalPortaria.base_legal}</div>
        </div>

        {/* Valor */}
        {modalPortaria.valor_liquido != null && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "10px 14px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>Valor Líquido Recebido (Jan–Jun 2026)</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#15803d" }}>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(modalPortaria.valor_liquido)}</span>
          </div>
        )}

        {/* Botões */}
        <div style={{ display: "flex", gap: 10 }}>
          {modalPortaria.link_portaria && (
            <button onClick={() => window.open(modalPortaria.link_portaria, "_blank")}
              style={{ flex: 1, background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              🔗 Acessar Portaria
            </button>
          )}
          <button onClick={() => window.open("https://consultafns.saude.gov.br/#/detalhada", "_blank")}
            style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "9px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            📊 Ver no FNS
          </button>
          <button onClick={() => setModalPortaria(null)}
            style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "9px 14px", cursor: "pointer", fontSize: 13 }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }} onClick={() => showMenuTipos && setShowMenuTipos(false)}>
      {ModalPortaria}

      {/* ── Header FNS ── */}
      <div style={{ background: "#1a3a6b", color: "#fff", borderRadius: "10px 10px 0 0", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 300, letterSpacing: 1 }}>Consulta</span>
          <span style={{ width: 1, height: 20, background: "rgba(255,255,255,.4)", display: "inline-block" }} />
          <span style={{ fontSize: 14, fontWeight: 700 }}>Fundo Nacional de Saúde</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 11 }}>
          {["A⁻","A","A⁺"].map(a => <span key={a} style={{ background: "rgba(255,255,255,.2)", padding: "2px 8px", borderRadius: 3, cursor: "pointer" }}>{a}</span>)}
          <span style={{ opacity: .7 }}>PT ▾</span>
          <span style={{ opacity: .7 }}>V.1.50.1</span>
          <button onClick={() => window.open(`https://consultafns.saude.gov.br/#/${tipoAtual.hash}`,"_blank")}
            style={{ background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.4)", color: "#fff", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 11 }}>
            ? Ajuda ↗
          </button>
        </div>
      </div>

      {/* Sub-menu com dropdown */}
      <div style={{ background: "#2a5298", padding: "7px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 10 }}>
        <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowMenuTipos(v => !v)}
            style={{ background: showMenuTipos ? "rgba(255,255,255,.25)" : "none", border: showMenuTipos ? "1px solid rgba(255,255,255,.5)" : "1px solid transparent", color: "#fff", fontSize: 13, cursor: "pointer", borderRadius: 4, padding: "5px 12px", display: "flex", alignItems: "center", gap: 6 }}
          >
            Tipos de consulta ▾
          </button>
          {showMenuTipos && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,.18)", zIndex: 200, minWidth: 340, overflow: "hidden" }}>
              {TIPOS_ABA_FNS.map((t, i) => (
                <button key={t.id} onClick={() => { setTipoAba(t.id); setShowMenuTipos(false); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "10px 16px", border: "none",
                    background: t.id === tipoAba ? "#eff6ff" : i % 2 === 0 ? "#fff" : "#fafafa",
                    cursor: "pointer", textAlign: "left", fontSize: 13,
                    color: t.id === tipoAba ? "#1d4ed8" : "#374151",
                    fontWeight: t.id === tipoAba ? 700 : 400,
                    borderBottom: "1px solid #f3f4f6",
                  }}>
                  <span>{t.label}</span>
                  {!t.publico
                    ? <span style={{ fontSize: 10, background: "#fef3c7", color: "#92400e", padding: "2px 7px", borderRadius: 10, border: "1px solid #fde68a", flexShrink: 0 }}>🔒 Login</span>
                    : t.id === tipoAba
                    ? <span style={{ fontSize: 10, background: "#dbeafe", color: "#1d4ed8", padding: "2px 7px", borderRadius: 10, flexShrink: 0 }}>✓ Ativo</span>
                    : null}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => window.open(`https://consultafns.saude.gov.br/#/${tipoAtual.hash}`,"_blank")}
          style={{ background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.4)", color: "#fff", borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
          ↗ Abrir no FNS
        </button>
      </div>

      {/* Breadcrumb */}
      <div style={{ background: "#f3f4f6", padding: "5px 20px", fontSize: 12, color: "#6b7280", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
        <span>Consulta FNS</span>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ color: "#374151", fontWeight: 600 }}>{tipoAtual.label}</span>
        {!tipoAtual.publico && <span style={{ marginLeft: 4, color: "#92400e", fontWeight: 600 }}>🔒 Requer autenticação</span>}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ── DETALHADA ── */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {tipoAba === "detalhada" && (
        <>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "18px 20px" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", margin: "0 0 12px", borderBottom: "2px solid #e4e7ec", paddingBottom: 8 }}>Detalhada</h2>
            <div style={{ background: "#dbeafe", borderRadius: 4, padding: "8px 12px", fontSize: 12, color: "#1e40af", marginBottom: 8 }}>
              Os campos com <span style={{ color: "#dc2626" }}>*</span> são obrigatórios.
            </div>
            <div style={{ background: "#dbeafe", borderRadius: 4, padding: "8px 12px", fontSize: 12, color: "#1e40af", marginBottom: 16, lineHeight: 1.5 }}>
              De acordo com o Manual de Ordem Bancária da STN, os valores repassados serão creditados em no máximo dois dias úteis após a data de emissão da OB para correntistas do Banco do Brasil. Para os demais bancos o prazo é de no máximo três dias úteis.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "120px 160px 1fr 200px", gap: 14, marginBottom: 14 }}>
              <div><label style={lblSt}><span style={{ color: "#dc2626" }}>* </span>Ano</label>
                <select value={ano} onChange={e => setAno(e.target.value)} style={selSt}>
                  {[2026,2025,2024,2023,2022].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div><label style={lblSt}>Mês</label>
                <select value={mes} onChange={e => setMes(e.target.value)} style={selSt}>
                  {MESES_FNS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div><label style={lblSt}><span style={{ color: "#dc2626" }}>* </span>Tipo de consulta</label>
                <select value={tipoConsulta} onChange={e => setTipo(e.target.value)} style={selSt}>
                  {TIPOS_CONSULTA.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label style={lblSt}>Bloco</label>
                <select value={bloco} onChange={e => setBloco(e.target.value)} style={selSt}>
                  <option value="">Selecione</option>
                  {BLOCOS_FNS_OPT.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lblSt}>CPF/CNPJ/UG</label>
                <input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="Ex.: CPF(12345678901)..." style={inputSt} />
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>Ex.: CPF(12345678901), CNPJ(12345678901234) e UG(123456)</div>
              </div>
              <div><label style={lblSt}>Estado</label>
                <select value={estado} onChange={e => setEstado(e.target.value)} style={selSt}>
                  <option value="">Selecione</option>
                  {ESTADOS_BR.filter(e => e).map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div><label style={lblSt}>Município</label>
                {municipiosLista.length > 0 ? (
                  <select value={municipio} onChange={e => setMunicipio(e.target.value)} style={selSt} disabled={loadingMunicipios}>
                    {municipiosLista.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : (
                  <input value={loadingMunicipios ? "Carregando..." : municipio} onChange={e => setMunicipio(e.target.value)}
                    placeholder={estado ? "Carregando municípios..." : "Selecione o estado primeiro"}
                    style={{ ...inputSt, color: loadingMunicipios ? "#9ca3af" : undefined }} disabled={loadingMunicipios} />
                )}
              </div>
              <div><label style={lblSt}>Processo</label>
                <input value={processo} onChange={e => setProcesso(e.target.value)} placeholder="Ex.: (12345678901234567)" style={inputSt} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
              <div><label style={lblSt}>Proposta</label><input value={propostaNum} onChange={e => setPropostaNum(e.target.value)} style={inputSt} /></div>
              <div><label style={lblSt}>Repasse</label>
                <select value={repasse} onChange={e => setRepasse(e.target.value)} style={selSt}>
                  <option value="">Selecione</option>
                  {REPASSES_FNS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div><label style={lblSt}>Data inicial da OB</label>
                <div style={{ position: "relative" }}>
                  <input value={dtIni} onChange={e => setDtIni(e.target.value)} placeholder="__/__/____" style={{ ...inputSt, paddingRight: 28 }} />
                  <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>📅</span>
                </div>
              </div>
              <div><label style={lblSt}>Data final da OB</label>
                <div style={{ position: "relative" }}>
                  <input value={dtFim} onChange={e => setDtFim(e.target.value)} placeholder="__/__/____" style={{ ...inputSt, paddingRight: 28 }} />
                  <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>📅</span>
                </div>
              </div>
              <div><label style={lblSt}>Portaria</label><input value={portaria} onChange={e => setPortaria(e.target.value)} style={inputSt} /></div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
              <button onClick={limpar} style={{ border: "1px solid #d1d5db", borderRadius: 4, padding: "8px 20px", background: "#fff", cursor: "pointer", fontSize: 13 }}>✏ Limpar</button>
              {btnConsultar(fnsLoading, () => { setConsultaParams({ estado, municipio, ano, mes, bloco }); setPgCur(1); })}
            </div>
          </div>

          {consultaParams && fnsLoading && (
            <div style={{ background: "#f0f4ff", border: "1px solid #c7d2fe", borderTop: "none", padding: "20px", textAlign: "center", color: "#3730a3", fontSize: 14 }}>
              ⏳ Consultando dados do FNS para <strong>{consultaParams.municipio}/{consultaParams.estado}</strong>...
            </div>
          )}
          {consultaParams && !fnsLoading && !entidade && fnsData !== undefined && (
            <div style={{ background: "#fff7f7", border: "1px solid #fecaca", borderTop: "none", padding: "20px", textAlign: "center", color: "#dc2626", fontSize: 14 }}>
              {fnsData?.aviso ?? `Município '${consultaParams.municipio}' não encontrado no estado ${consultaParams.estado}.`}
            </div>
          )}
          {consultaParams && !fnsLoading && entidade && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderTop: "none", padding: "16px 20px" }}>
              {fnsData?.competencia && (
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "7px 14px", marginBottom: 12, fontSize: 12, color: "#1e40af", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 700 }}>Competência:</span>
              <span style={{ fontWeight: 800, fontSize: 14 }}>{fnsData.competencia}</span>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, marginBottom: 16, fontSize: 13 }}>
                {([
                  ["Entidade", entidade.nome],
                  ["CPF/CNPJ", entidade.cnpj],
                  ["UF", entidade.uf ?? consultaParams.estado],
                  ["Município", entidade.municipio ?? entidade.nome],
                  ["Código IBGE", entidade.ibge],
                  ["População", entidade.populacao ? `${Number(entidade.populacao).toLocaleString("pt-BR")} habitantes` : "—"],
                  ["Ano Censo", entidade.ano_censo],
                  ["Prefeito(a)", entidade.prefeito],
                  ["Data Inicial Gestão", entidade.data_gestao],
                  ["Secretário(a)", entidade.secretario],
                  ["Presidente Conselho", entidade.presidente_conselho],
                ] as [string, any][]).map(([label, val]) => (
                  <div key={label} style={{ padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 1 }}>{label}</div>
                    <div style={{ fontWeight: 600, color: "#ffffff" }}>{val}</div>
                  </div>
                ))}
              </div>

              {acoes.length === 0 && (
                <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, padding: "16px", textAlign: "center", color: "#6b7280", fontSize: 13, margin: "8px 0" }}>
                  Nenhuma ação de repasse encontrada para os filtros selecionados.
                </div>
              )}

              <div style={{ overflowX: "auto", border: "1px solid #d1dce8", borderRadius: 4 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: "#b8cce4", color: "#1a3a6b" }}>
                      {["Bloco ⇅","Grupo ⇅","Ação Detalhada ⇅","Valor Total ⇅","Valor Desconto ⇅","Valor Líquido ⇅","Ações"].map(h => (
                        <th key={h} style={{ padding: "10px 10px", textAlign: h.startsWith("Valor") ? "right" : "left", fontWeight: 700, borderRight: "1px solid #a8bcd4", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginadas.map((row: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #e2eaf4", background: i % 2 === 0 ? "#fff" : "#f4f8fc" }}>
                        <td style={{ padding: "9px 10px", color: "#2a5298", fontSize: 11, maxWidth: 140, lineHeight: 1.4 }}>{row.bloco}</td>
                        <td style={{ padding: "9px 10px", fontWeight: 600, color: "#1a3a6b", maxWidth: 160, lineHeight: 1.4 }}>{row.grupo}</td>
                        <td style={{ padding: "9px 10px", color: row.valor_total ? "#374151" : "#6b7280", fontStyle: row.valor_total ? "normal" : "italic", maxWidth: 220, lineHeight: 1.4 }}>{row.acao_detalhada}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: row.valor_total ? 700 : 400, color: row.valor_total ? "#1a3a6b" : "#9ca3af" }}>{row.valor_total != null ? BRL(row.valor_total) : ""}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", color: "#374151" }}>{row.valor_desconto != null ? BRL(row.valor_desconto) : ""}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: row.valor_liquido ? 700 : 400, color: row.valor_liquido ? "#16a34a" : "#9ca3af" }}>{row.valor_liquido != null ? BRL(row.valor_liquido) : ""}</td>
                        <td style={{ padding: "9px 10px", textAlign: "center" }}>
                          {(() => { const pr = _getPortaria(row); return (
                          <button
                            title={pr ? "Ver portaria de referência" : "Ver no FNS"}
                            onClick={() => pr ? setModalPortaria(pr) : window.open("https://consultafns.saude.gov.br/#/detalhada","_blank")}
                            style={{ background: pr ? "#1d4ed8" : "#6b7280", border: "none", borderRadius: 4, width: 28, height: 28, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ color: "#fff", fontSize: 13 }}>{pr ? "📋" : "👁"}</span>
                          </button>
                          ); })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#e8f0f8", fontWeight: 700 }}>
                      <td colSpan={3} style={{ padding: "10px 10px", textAlign: "right", color: "#1a3a6b", fontSize: 13 }}>Total Geral</td>
                      <td style={{ padding: "10px 10px", textAlign: "right", color: "#1a3a6b", fontSize: 13 }}>{fnsData ? BRL(fnsData.total_geral) : "—"}</td>
                      <td style={{ padding: "10px 10px", textAlign: "right", color: "#1a3a6b", fontSize: 13 }}>{fnsData ? BRL(fnsData.total_desconto) : "—"}</td>
                      <td style={{ padding: "10px 10px", textAlign: "right", color: "#16a34a", fontSize: 13 }}>{fnsData ? BRL(fnsData.total_liquido) : "—"}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setPgCur(p => Math.max(1, p - 1))} disabled={pgCur === 1}
                    style={{ border: "1px solid #d1dce8", borderRadius: 3, padding: "4px 10px", cursor: "pointer", background: pgCur === 1 ? "#f3f4f6" : "#fff", fontSize: 13 }}>«</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPgCur(p)}
                      style={{ border: "1px solid #d1dce8", borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontSize: 13, background: pgCur === p ? "#2a5298" : "#fff", color: pgCur === p ? "#fff" : "#374151", fontWeight: pgCur === p ? 700 : 400 }}>{p}</button>
                  ))}
                  <button onClick={() => setPgCur(p => Math.min(totalPages, p + 1))} disabled={pgCur === totalPages}
                    style={{ border: "1px solid #d1dce8", borderRadius: 3, padding: "4px 10px", cursor: "pointer", background: pgCur === totalPages ? "#f3f4f6" : "#fff", fontSize: 13 }}>»</button>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[10, 25, 50, 100].map(n => (
                    <button key={n} onClick={() => { setPgSize(n); setPgCur(1); }}
                      style={{ border: "1px solid #d1dce8", borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontSize: 13, background: pgSize === n ? "#2a5298" : "#fff", color: pgSize === n ? "#fff" : "#374151", fontWeight: pgSize === n ? 700 : 400 }}>{n}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 8, fontSize: 11, color: "#9ca3af" }}>
                Fonte: <a href="https://consultafns.saude.gov.br/#/detalhada/acao" target="_blank" rel="noreferrer" style={{ color: "#2a5298" }}>consultafns.saude.gov.br</a> — dados reais {ano}
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ── REPASSES DO DIA / CONTAS BANCÁRIAS ── */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {(tipoAba === "repasse-dia" || tipoAba === "contas-bancarias") && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "18px 20px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", margin: "0 0 12px", borderBottom: "2px solid #e4e7ec", paddingBottom: 8 }}>
            {tipoAtual.label}
          </h2>
          <div style={{ background: "#dbeafe", borderRadius: 4, padding: "8px 12px", fontSize: 12, color: "#1e40af", marginBottom: 16, lineHeight: 1.5 }}>
            Exibe os repasses do FNS realizados em um dia específico para qualquer município do Brasil.
            {rdData?.ultimo_pagamento && <span> Último pagamento registrado: <strong>{rdData.ultimo_pagamento}</strong>.</span>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "120px 140px 140px 1fr", gap: 14, marginBottom: 16, alignItems: "end" }}>
            <div><label style={lblSt}>Ano</label>
              <select value={rdAno} onChange={e => setRdAno(e.target.value)} style={selSt}>
                {[2026,2025,2024,2023,2022].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div><label style={lblSt}>Mês (número)</label>
              <select value={rdMes} onChange={e => setRdMes(e.target.value)} style={selSt}>
                {MESES_FNS.map((m, i) => <option key={i+1} value={String(i+1).padStart(2,"0")}>{String(i+1).padStart(2,"0")} – {m}</option>)}
              </select>
            </div>
            <div><label style={lblSt}>Dia</label>
              <select value={rdDia} onChange={e => setRdDia(e.target.value)} style={selSt}>
                {Array.from({ length: 31 }, (_, i) => String(i+1).padStart(2,"0")).map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {btnConsultar(rdLoading, () => setRdParams({ ano: rdAno, mes: rdMes, dia: rdDia }))}
              <button onClick={() => setRdParams(null)} style={{ border: "1px solid #d1d5db", borderRadius: 4, padding: "8px 16px", background: "#fff", cursor: "pointer", fontSize: 13 }}>✏ Limpar</button>
            </div>
          </div>

          {rdLoading && (
            <div style={{ textAlign: "center", padding: 30, color: "#3730a3", fontSize: 14 }}>⏳ Consultando repasses do dia...</div>
          )}

          {!rdLoading && rdData && (
            <>
              {rdData.repasses?.length === 0 ? (
                <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, padding: "24px", textAlign: "center", color: "#6b7280", fontSize: 13 }}>
                  Nenhum repasse encontrado para {rdDia}/{rdMes}/{rdAno}.
                  {rdData.ultimo_pagamento && <div style={{ marginTop: 6 }}>Último pagamento: <strong>{rdData.ultimo_pagamento}</strong></div>}
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontWeight: 600, color: "#374151" }}>{rdData.repasses.length} repasse(s) encontrado(s)</span>
                    <span style={{ fontWeight: 800, fontSize: 16, color: "#16a34a" }}>Total: R$ {BRL(rdData.total)}</span>
                  </div>
                  <div style={{ overflowX: "auto", border: "1px solid #d1dce8", borderRadius: 4 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
                      <thead>
                        <tr style={{ background: "#b8cce4", color: "#1a3a6b" }}>
                          {["UF","Município","Entidade","Bloco","Ação","Valor","Data"].map(h => (
                            <th key={h} style={{ padding: "10px 10px", textAlign: h === "Valor" ? "right" : "left", fontWeight: 700, borderRight: "1px solid #a8bcd4", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rdData.repasses.map((r: any, i: number) => (
                          <tr key={i} style={{ borderBottom: "1px solid #e2eaf4", background: i % 2 === 0 ? "#fff" : "#f4f8fc" }}>
                            <td style={{ padding: "8px 10px", fontWeight: 700, color: "#1a3a6b" }}>{r.uf}</td>
                            <td style={{ padding: "8px 10px" }}>{r.municipio}</td>
                            <td style={{ padding: "8px 10px", fontSize: 11, color: "#6b7280", maxWidth: 180 }}>{r.entidade}</td>
                            <td style={{ padding: "8px 10px", fontSize: 11 }}>{r.bloco}</td>
                            <td style={{ padding: "8px 10px", fontSize: 11, maxWidth: 220 }}>{r.acao}</td>
                            <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#16a34a" }}>R$ {BRL(r.valor)}</td>
                            <td style={{ padding: "8px 10px", fontSize: 11, color: "#6b7280" }}>{r.data}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: "#e8f0f8", fontWeight: 700 }}>
                          <td colSpan={5} style={{ padding: "10px", textAlign: "right", color: "#1a3a6b" }}>Total</td>
                          <td style={{ padding: "10px", textAlign: "right", color: "#16a34a" }}>R$ {BRL(rdData.total)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
              <div style={{ marginTop: 8, fontSize: 11, color: "#9ca3af" }}>
                Fonte: <a href="https://consultafns.saude.gov.br" target="_blank" rel="noreferrer" style={{ color: "#2a5298" }}>consultafns.saude.gov.br</a>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ── CONSOLIDADA FUNDO A FUNDO ── */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {tipoAba === "consolidada" && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "18px 20px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", margin: "0 0 12px", borderBottom: "2px solid #e4e7ec", paddingBottom: 8 }}>Consolidada Fundo a Fundo</h2>
          <div style={{ background: "#dbeafe", borderRadius: 4, padding: "8px 12px", fontSize: 12, color: "#1e40af", marginBottom: 16, lineHeight: 1.5 }}>
            Exibe o consolidado das transferências Fundo a Fundo para um município/estado em determinado exercício.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "120px 130px 1fr 160px", gap: 14, marginBottom: 16, alignItems: "end" }}>
            <div><label style={lblSt}>Ano</label>
              <select style={selSt} defaultValue="2026">
                {[2026,2025,2024,2023,2022].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div><label style={lblSt}>Estado</label>
              <select style={selSt} defaultValue="AM">
                {ESTADOS_BR.filter(e => e).map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div><label style={lblSt}>Município (opcional)</label>
              <input style={inputSt} placeholder="Ex.: APUÍ" />
            </div>
            <div><label style={lblSt}>Tipo Repasse</label>
              <select style={selSt}>
                <option value="M">Municipal</option>
                <option value="E">Estadual</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #e5e7eb", paddingTop: 14, marginBottom: 20 }}>
            <button
              onClick={() => window.open("https://consultafns.saude.gov.br/#/consolidada","_blank")}
              style={{ background: "#2a5298", color: "#fff", border: "none", borderRadius: 4, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
            >
              ↗ Consultar no FNS
            </button>
          </div>

          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 20 }}>ℹ️</span>
            <div>
              <div style={{ fontWeight: 700, color: "#92400e", marginBottom: 4 }}>Consulta disponível no portal FNS</div>
              <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.6 }}>
                A consulta <strong>Consolidada Fundo a Fundo</strong> retorna o total consolidado de transferências por bloco de financiamento para o exercício selecionado. Por limitações de acesso à API interna, esta consulta abre diretamente no portal FNS onde você pode realizar a pesquisa completa.
              </div>
              <button onClick={() => window.open("https://consultafns.saude.gov.br/#/consolidada","_blank")}
                style={{ marginTop: 10, background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                Abrir Consolidada no FNS ↗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ── DESCONTO MAC ── */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {tipoAba === "desconto-mac" && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "18px 20px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", margin: "0 0 12px", borderBottom: "2px solid #e4e7ec", paddingBottom: 8 }}>Desconto Mac</h2>
          <div style={{ background: "#dbeafe", borderRadius: 4, padding: "8px 12px", fontSize: 12, color: "#1e40af", marginBottom: 16, lineHeight: 1.5 }}>
            Tipos de dedução (desconto) aplicados sobre o teto de Média e Alta Complexidade (MAC).
          </div>

          <div style={{ border: "1px solid #d1dce8", borderRadius: 6, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#b8cce4", color: "#1a3a6b" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700 }}>Código</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700 }}>Descrição</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { cod: "TCU",  desc: "Acórdãos do Tribunal de Contas da União" },
                  { cod: "JUD",  desc: "Decisão Judicial" },
                  { cod: "DVLC", desc: "Devoluções do Teto MAC" },
                  { cod: "EMPR", desc: "Empréstimos Consignados" },
                  { cod: "INSS", desc: "Contribuições INSS" },
                  { cod: "IRPJ", desc: "Imposto de Renda Pessoa Jurídica" },
                  { cod: "OUTR", desc: "Outros Descontos" },
                ].map((item, i) => (
                  <tr key={item.cod} style={{ borderBottom: "1px solid #e2eaf4", background: i % 2 === 0 ? "#fff" : "#f4f8fc" }}>
                    <td style={{ padding: "9px 14px", fontWeight: 700, color: "#2a5298", fontFamily: "monospace" }}>{item.cod}</td>
                    <td style={{ padding: "9px 14px", color: "#374151" }}>{item.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16 }}>
            <button onClick={() => window.open("https://consultafns.saude.gov.br/#/desconto-mac","_blank")}
              style={{ background: "#2a5298", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              Consultar Descontos MAC no FNS ↗
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ── ACESSO RESTRITO (Convênios, Equipamentos, Pendências, Gráfico, Proposta) ── */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {!tipoAtual.publico && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "24px 20px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", margin: "0 0 12px", borderBottom: "2px solid #e4e7ec", paddingBottom: 8 }}>
            {tipoAtual.label}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "32px 20px", background: "#f8fafc", borderRadius: 10, border: "1px dashed #cbd5e1", textAlign: "center" }}>
            <div style={{ fontSize: 48 }}>🔒</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", marginBottom: 6 }}>Autenticação necessária</div>
              <div style={{ fontSize: 13, color: "#6b7280", maxWidth: 420, lineHeight: 1.6 }}>
                A consulta <strong>{tipoAtual.label}</strong> requer login com CPF e senha no portal do FNS. Acesse diretamente o portal para realizar esta consulta.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => window.open(`https://consultafns.saude.gov.br/#/${tipoAtual.hash}`,"_blank")}
                style={{ background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6, padding: "10px 24px", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
              >
                Abrir {tipoAtual.label} no FNS ↗
              </button>
              <button
                onClick={() => { setTipoAba("detalhada"); }}
                style={{ background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "10px 20px", cursor: "pointer", fontSize: 13 }}
              >
                ← Ir para Detalhada
              </button>
            </div>
          </div>

          <div style={{ marginTop: 16, background: "#eff6ff", borderRadius: 6, padding: "12px 16px", fontSize: 12, color: "#1e40af" }}>
            <strong>Dica:</strong> As consultas públicas disponíveis neste sistema são: <em>Detalhada, Repasses do Dia, Contas Bancárias, Consolidada Fundo a Fundo</em> e <em>Desconto Mac</em>.
          </div>
        </div>
      )}
    </div>
  );
}

const MESES_LABEL = ["","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MESES_FULL  = ["","Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export default function PainelFinanceiro() {
  const [aba, setAba] = useState<"visao-geral" | "blocos" | "repasses" | "empenhos" | "siops" | "consulta-fns">("visao-geral");
  const [mesBlocos, setMesBlocos] = useState(0); // 0 = acumulado anual

  const { data, isLoading, refetch } = useQuery<Painel>({
    queryKey: ["financeiro-painel", mesBlocos],
    queryFn: () => apiGet(`/api/financeiro/painel${mesBlocos ? `?mes=${mesBlocos}` : ""}`) as Promise<Painel>,
    staleTime: 60_000,
  });

  const handleExportPdf = async () => {
    const token = localStorage.getItem("ersus_token");
    const res = await fetch(
      `${import.meta.env.VITE_API_URL || ""}/api/relatorios/exportar-pdf?tipo=gerencial&ano=2026`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) { alert("Erro ao gerar PDF"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Painel_Financeiro_Apui_2026.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const k = data?.kpis;
  const ABAS = [
    { id: "visao-geral",   label: "Visão Geral" },
    { id: "blocos",        label: "Blocos FNS"  },
    { id: "repasses",      label: "Repasses"    },
    { id: "empenhos",      label: `Empenhos (${data?.empenhos_pendentes?.length ?? "…"})` },
    { id: "siops",         label: "SIOPS"       },
    { id: "consulta-fns",  label: "🔍 Consulta FNS" },
  ] as const;

  return (
    <div style={{ padding: 24, maxWidth: 1040, margin: "0 auto" }}>

      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Painel Financeiro</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            Execução orçamentária · {data?.municipio}/{data?.uf} · {data?.mes_referencia ?? "2026"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => refetch()} style={{ display: "flex", alignItems: "center", gap: 5, border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 12px", background: "#fff", cursor: "pointer", fontSize: 13 }}>
            <RefreshCw size={13} /> Atualizar
          </button>
          <button onClick={handleExportPdf} style={{ display: "flex", alignItems: "center", gap: 5, background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            <Download size={13} /> PDF
          </button>
        </div>
      </div>

      {isLoading && <div style={{ textAlign: "center", padding: 60 }}><RefreshCw size={28} color="#9ca3af" style={{ animation: "spin 1s linear infinite" }} /></div>}

      {data && k && (
        <>
          {/* Alertas */}
          {data.alertas.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {data.alertas.map((al, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, alignItems: "center", padding: "8px 14px", borderRadius: 8,
                  background: al.nivel === "CRITICO" ? "#fff7f7" : "#fffbeb",
                  border: `1px solid ${al.nivel === "CRITICO" ? "#fca5a5" : "#fde68a"}`,
                }}>
                  <AlertTriangle size={15} color={al.nivel === "CRITICO" ? "#dc2626" : "#d97706"} />
                  <span style={{ fontSize: 13, color: al.nivel === "CRITICO" ? "#991b1b" : "#92400e" }}>{al.msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "2px solid #e4e7ec" }}>
            {ABAS.map(a => (
              <button key={a.id} onClick={() => setAba(a.id)} style={{
                padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13,
                borderBottom: aba === a.id ? "2px solid #1d4ed8" : "2px solid transparent",
                color: aba === a.id ? "#1d4ed8" : "#6b7280", fontWeight: aba === a.id ? 700 : 400, marginBottom: -2,
              }}>{a.label}</button>
            ))}
          </div>

          {/* ── Visão Geral ── */}
          {aba === "visao-geral" && (
            <div>
              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                <KpiCard label="Execução Geral" val={`${k.pct_execucao_geral}%`}
                  sub={`${R(data.despesas.pago)} pagos`}
                  icon={<TrendingUp size={20} />} bg="#eff6ff" cor="#1d4ed8" delta={3.2} />
                <KpiCard label="Saldo Disponível" val={R(k.saldo_disponivel)}
                  sub="arrecadado − pago"
                  icon={<DollarSign size={20} />} bg="#f0fdf4" cor="#16a34a" />
                <KpiCard label="SIOPS — Rec. Próprios" val={`${data.siops.pct_proprio_saude}%`}
                  sub={`Meta ≥ ${data.siops.meta_minima}% • ${data.siops.conforme ? "✓ Conforme" : "⚠ Crítico"}`}
                  icon={<CheckCircle size={20} />}
                  bg={data.siops.conforme ? "#f0fdf4" : "#fff7f7"}
                  cor={data.siops.conforme ? "#16a34a" : "#dc2626"} />
              </div>

              {/* Gráfico receita vs despesa */}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginBottom: 16 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Receita × Despesa — 2026</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

                  {/* Barras receita */}
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Arrecadação por fonte</div>
                    {[
                      { label: "FNS",        val: data.receitas.fns_recebido,         total: data.receitas.fns_previsto,        cor: "#2563eb" },
                      { label: "Próprio",    val: data.receitas.municipio_proprio,    total: data.receitas.municipio_proprio,   cor: "#16a34a" },
                      { label: "Convênios",  val: data.receitas.convenios_recebido,   total: data.receitas.convenios_recebido,  cor: "#7c3aed" },
                      { label: "Emendas",    val: data.receitas.emendas_recebido,     total: data.receitas.emendas_recebido,    cor: "#d97706" },
                    ].map(item => (
                      <div key={item.label} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                          <span>{item.label}</span>
                          <span style={{ fontWeight: 600 }}>{R(item.val)}</span>
                        </div>
                        <MiniBar pct={(item.val / item.total) * 100} cor={item.cor} height={7} />
                      </div>
                    ))}
                  </div>

                  {/* Estágios da despesa */}
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Estágios da despesa</div>
                    {[
                      { label: "Dotação atualizada", val: data.despesas.dotacao_atualizada, cor: "#e5e7eb", pct: 100 },
                      { label: "Empenhado",          val: data.despesas.empenhado,           cor: "#1d4ed8", pct: data.despesas.empenhado / data.despesas.dotacao_atualizada * 100 },
                      { label: "Liquidado",          val: data.despesas.liquidado,           cor: "#1565c0", pct: data.despesas.liquidado / data.despesas.dotacao_atualizada * 100 },
                      { label: "Pago",               val: data.despesas.pago,               cor: "#2563eb", pct: data.despesas.pago / data.despesas.dotacao_atualizada * 100 },
                    ].map(item => (
                      <div key={item.label} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                          <span>{item.label}</span>
                          <span style={{ fontWeight: item.label === "Pago" ? 700 : 400 }}>{R(item.val)}</span>
                        </div>
                        <MiniBar pct={item.pct} cor={item.cor} height={7} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Empenhos pendentes resumo */}
              {data.empenhos_pendentes.length > 0 && (
                <div style={{ border: "1px solid #fde68a", borderRadius: 8, padding: 14, background: "#fffbeb" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Clock size={15} color="#d97706" />
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#92400e" }}>
                      {data.empenhos_pendentes.length} empenhos aguardando — {R(k.valor_pendente_liquidar)} a liquidar
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {data.empenhos_pendentes.slice(0, 3).map(e => (
                      <span key={e.id} style={{ fontSize: 11, background: "#fff", border: "1px solid #fde68a", borderRadius: 6, padding: "3px 8px" }}>
                        {e.credor.split(" ").slice(0, 2).join(" ")} · {R(e.valor)}
                      </span>
                    ))}
                    {data.empenhos_pendentes.length > 3 && (
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>+{data.empenhos_pendentes.length - 3} mais…</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Blocos FNS ── */}
          {aba === "blocos" && (
            <div>
              {/* Filtro de mês */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginRight: 4 }}>Competência:</span>
                <button
                  onClick={() => setMesBlocos(0)}
                  style={{ padding: "4px 12px", borderRadius: 20, border: "1px solid", fontSize: 12, fontWeight: 600, cursor: "pointer", background: mesBlocos === 0 ? "#1e40af" : "#f3f4f6", color: mesBlocos === 0 ? "#fff" : "#374151", borderColor: mesBlocos === 0 ? "#1e40af" : "#d1d5db" }}
                >
                  Acumulado
                </button>
                {MESES_LABEL.filter((_,i) => i > 0).map((lbl, idx) => {
                  const m = idx + 1;
                  const recebido = m <= 6; // Jan-Jun recebidos
                  return (
                    <button
                      key={m}
                      onClick={() => setMesBlocos(m)}
                      style={{ padding: "4px 10px", borderRadius: 20, border: "1px solid", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        background: mesBlocos === m ? "#1e40af" : recebido ? "#f0fdf4" : "#f9fafb",
                        color: mesBlocos === m ? "#fff" : recebido ? "#15803d" : "#9ca3af",
                        borderColor: mesBlocos === m ? "#1e40af" : recebido ? "#bbf7d0" : "#e5e7eb" }}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>

              {/* Título do período */}
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
                {mesBlocos === 0
                  ? "Exibindo: acumulado anual 2026"
                  : `Exibindo: ${MESES_FULL[mesBlocos]}/2026${mesBlocos <= 6 ? " — parcela recebida" : " — aguardando repasse"}`}
              </div>

              {/* KPIs por bloco */}
              {(() => {
                const blocosMes = mesBlocos && data.blocos_mes?.length ? data.blocos_mes : null;
                const fonte = blocosMes ?? data.blocos;
                return (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 16 }}>
                      {fonte.map((b: any) => {
                        const pct = blocosMes ? (b.pct_execucao_mes ?? 0) : b.pct_execucao;
                        const statusMes = blocosMes ? b.status_mes : null;
                        const cor = statusMes === "pendente" ? "#9ca3af" : pct >= 65 ? "#16a34a" : pct >= 40 ? "#d97706" : "#dc2626";
                        return (
                          <div key={b.codigo} style={{ textAlign: "center", padding: "10px 6px", background: b.cor + "0d", borderRadius: 8, border: `1px solid ${b.cor}20` }}>
                            {statusMes === "pendente"
                              ? <div style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af" }}>—</div>
                              : <div style={{ fontSize: 20, fontWeight: 800, color: cor }}>{pct}%</div>}
                            <div style={{ fontSize: 10, color: "#6b7280" }}>{b.codigo}</div>
                            {blocosMes && b.recebido_mes != null && b.recebido_mes > 0 && (
                              <div style={{ fontSize: 9, color: "#15803d", marginTop: 2 }}>{BRL(b.recebido_mes)}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ height: 220, marginBottom: 20 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={fonte} barGap={4}>
                          <XAxis dataKey="codigo" tick={{ fontSize: 11 }} />
                          <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                          <Tooltip
                            formatter={(v: number, name: string) => [R(v), name === "recebido_ano" ? "Recebido (ano)" : name === "recebido_mes" ? "Recebido (mês)" : name === "pago" ? "Pago" : name]}
                            contentStyle={TOOLTIPSTYLE}
                          />
                          {blocosMes ? (
                            <Bar dataKey="recebido_mes" name="Recebido (mês)" radius={[4,4,0,0]}>
                              {fonte.map((b: any) => <Cell key={b.codigo} fill={b.recebido_mes > 0 ? b.cor : "#e5e7eb"} />)}
                            </Bar>
                          ) : (
                            <>
                              <Bar dataKey="recebido_ano" name="Recebido" radius={[4,4,0,0]}>
                                {data.blocos.map(b => <Cell key={b.codigo} fill={b.cor + "88"} />)}
                              </Bar>
                              <Bar dataKey="pago" name="Pago" radius={[4,4,0,0]}>
                                {data.blocos.map(b => <Cell key={b.codigo} fill={b.cor} />)}
                              </Bar>
                            </>
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {data.blocos.map(b => <BlocoCard key={b.codigo} b={b} />)}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* ── Repasses mensais ── */}
          {aba === "repasses" && (
            <div>
              <div style={{ height: 240, marginBottom: 20 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.repasses_mensais} barGap={6}>
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip content={<TooltipRepasse />} />
                    <Bar dataKey="previsto"  name="Previsto"  fill="#1d4ed8" radius={[4,4,0,0]} />
                    <Bar dataKey="recebido"  name="Recebido"  radius={[4,4,0,0]}>
                      {data.repasses_mensais.map((r, i) => (
                        <Cell key={i} fill={r.recebido == null ? "#e5e7eb" : "#2563eb"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                      <th style={{ padding: "8px 12px" }}>Mês</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Previsto</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Recebido</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Diferença</th>
                      <th style={{ padding: "8px 12px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.repasses_mensais.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: r.recebido == null ? "#f9fafb" : "white" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 500 }}>{r.mes}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: "#6b7280" }}>{R(r.previsto)}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>
                          {r.recebido != null ? R(r.recebido) : <span style={{ color: "#9ca3af" }}>—</span>}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>
                          {r.diferenca != null ? (
                            <span style={{ color: r.diferenca >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                              {r.diferenca >= 0 ? "+" : ""}{R(r.diferenca)}
                            </span>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          {r.recebido == null
                            ? <span style={{ background: "#f3f4f6", color: "#9ca3af", fontSize: 11, padding: "2px 8px", borderRadius: 10 }}>Pendente</span>
                            : r.diferenca != null && r.diferenca < -5000
                            ? <span style={{ background: "#fff7f7", color: "#dc2626", fontSize: 11, padding: "2px 8px", borderRadius: 10 }}>Glosa parcial</span>
                            : <span style={{ background: "#f0fdf4", color: "#16a34a", fontSize: 11, padding: "2px 8px", borderRadius: 10 }}>✓ Recebido</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Empenhos ── */}
          {aba === "empenhos" && (
            <div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                      <th style={{ padding: "8px 12px" }}>NE</th>
                      <th style={{ padding: "8px 12px" }}>Credor</th>
                      <th style={{ padding: "8px 12px" }}>Objeto</th>
                      <th style={{ padding: "8px 12px" }}>Bloco</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Valor</th>
                      <th style={{ padding: "8px 12px" }}>Vencimento</th>
                      <th style={{ padding: "8px 12px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.empenhos_pendentes.map(e => {
                      const venc = new Date(e.data + "T00:00");
                      const dias = Math.ceil((venc.getTime() - Date.now()) / 86400000);
                      const atrasado = dias < 0;
                      return (
                        <tr key={e.id} style={{ borderBottom: "1px solid #f3f4f6", background: atrasado ? "#fff7f7" : "white" }}>
                          <td style={{ padding: "8px 12px", fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{e.id}</td>
                          <td style={{ padding: "8px 12px", fontWeight: 500, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.credor}</td>
                          <td style={{ padding: "8px 12px", color: "#6b7280", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.objeto}</td>
                          <td style={{ padding: "8px 12px" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, background: "#e0f2fe", color: "#0369a1", padding: "1px 6px", borderRadius: 6 }}>{e.bloco}</span>
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700 }}>{R(e.valor)}</td>
                          <td style={{ padding: "8px 12px", fontSize: 12 }}>
                            <span style={{ color: atrasado ? "#dc2626" : dias <= 3 ? "#d97706" : "#6b7280" }}>
                              {venc.toLocaleDateString("pt-BR")} {atrasado ? `(${Math.abs(dias)}d atraso)` : dias <= 3 ? "(urgente)" : ""}
                            </span>
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <span style={{
                              fontSize: 11, padding: "2px 8px", borderRadius: 10,
                              background: e.status === "a_liquidar" ? "#fffbeb" : "#eff6ff",
                              color: e.status === "a_liquidar" ? "#d97706" : "#2563eb",
                              fontWeight: 600,
                            }}>
                              {e.status === "a_liquidar" ? "A liquidar" : "A pagar"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 10, textAlign: "right", fontSize: 12, color: "#6b7280" }}>
                Total pendente: <strong>{R(k.valor_pendente_liquidar)}</strong>
              </div>
            </div>
          )}

          {/* ── Consulta FNS ── */}
          {aba === "consulta-fns" && <AbaConsultaFNS />}

          {/* ── SIOPS ── */}
          {aba === "siops" && (
            <div>
              {/* Gauge principal */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{
                  background: data.siops.conforme ? "#f0fdf4" : "#fff7f7",
                  border: `2px solid ${data.siops.conforme ? "#bbf7d0" : "#fca5a5"}`,
                  borderRadius: 12, padding: "20px 24px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: data.siops.conforme ? "#16a34a" : "#dc2626" }}>
                    {data.siops.pct_proprio_saude}%
                  </div>
                  <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>Recursos próprios em saúde</div>
                  <div style={{ marginTop: 12 }}>
                    <span style={{
                      background: data.siops.conforme ? "#16a34a" : "#dc2626",
                      color: "#fff", fontWeight: 700, fontSize: 14,
                      padding: "4px 16px", borderRadius: 20,
                    }}>
                      {data.siops.conforme ? "✓ CONFORME" : "✗ NÃO CONFORME"}
                    </span>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af" }}>
                    Meta mínima: {data.siops.meta_minima}% · Margem: +{data.siops.margem_seguranca}%
                  </div>
                </div>

                <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Histórico SIOPS</h3>
                  <div style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.siops.historico}>
                        <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
                        <YAxis domain={[13, 20]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [`${v}%`, "Rec. Próprios"]} contentStyle={TOOLTIPSTYLE} />
                        <ReferenceLine y={15} stroke="#dc2626" strokeDasharray="4 4" label={{ value: "15% mín", position: "right", fontSize: 10, fill: "#dc2626" }} />
                        <Line type="monotone" dataKey="pct" stroke="#16a34a" strokeWidth={2} dot={{ fill: "#16a34a", r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "12px 16px", fontSize: 13 }}>
                <strong>Base legal:</strong> LC 141/2012 — Municípios devem aplicar no mínimo 15% das receitas próprias em ações e serviços públicos de saúde. O não cumprimento implica sanções do Tribunal de Contas e bloqueio de transferências federais voluntárias.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
