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

const TOOLTIPSTYLE = { fontSize: 12, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };

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
      {prev && <div style={{ color: "#93c5fd" }}>Previsto: {R(prev.value)}</div>}
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

function AbaConsultaFNS() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = MESES_FNS[new Date().getMonth()];

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
  const [proposta, setProposta]   = useState("");
  const [repasse, setRepasse]     = useState("");
  const [dtIni, setDtIni]         = useState("");
  const [dtFim, setDtFim]         = useState("");
  const [portaria, setPortaria]   = useState("");
  const [consultado, setConsultado] = useState(true); // começa com resultado para Apuí
  const [pgSize, setPgSize]       = useState(25);
  const [pgCur, setPgCur]         = useState(1);

  const { data: fnsData } = useQuery({
    queryKey: ["fns-acoes"],
    queryFn: () => apiGet("/api/financeiro/fns-acoes") as Promise<any>,
  });

  const acoes: any[] = fnsData?.acoes ?? [];
  const entidade = fnsData?.entidade;

  const totalPages = Math.ceil(acoes.length / pgSize);
  const paginadas = acoes.slice((pgCur - 1) * pgSize, pgCur * pgSize);

  const limpar = () => {
    setAno(String(anoAtual)); setMes(mesAtual); setTipo("Fundo a Fundo");
    setBloco(""); setCpf(""); setEstado(""); setMunicipio(""); setMunicipiosLista([]);
    setProcesso(""); setProposta(""); setRepasse("");
    setDtIni(""); setDtFim(""); setPortaria("");
    setConsultado(false);
  };

  const inputSt: React.CSSProperties = { width: "100%", border: "1px solid #d1d5db", borderRadius: 4, padding: "7px 10px", fontSize: 13, background: "#fff", outline: "none", boxSizing: "border-box" };
  const selSt: React.CSSProperties   = { ...inputSt, cursor: "pointer" };
  const lblSt: React.CSSProperties   = { fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>

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
          <button onClick={() => window.open("https://consultafns.saude.gov.br/#/detalhada","_blank")} style={{ background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.4)", color: "#fff", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 11 }}>? Ajuda ↗</button>
        </div>
      </div>

      {/* Sub-menu */}
      <div style={{ background: "#2a5298", padding: "7px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button style={{ background: "none", border: "none", color: "#fff", fontSize: 13, cursor: "pointer" }}>Tipos de consulta ▾</button>
        <button onClick={() => window.open("https://consultafns.saude.gov.br/#/detalhada","_blank")} style={{ background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.4)", color: "#fff", borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>↗ Abrir no FNS</button>
      </div>

      {/* Breadcrumb */}
      <div style={{ background: "#f3f4f6", padding: "5px 20px", fontSize: 12, color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>Detalhada</div>

      {/* ── Formulário ── */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "18px 20px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: "0 0 12px", borderBottom: "2px solid #1a3a6b", paddingBottom: 8 }}>Detalhada</h2>

        <div style={{ background: "#dbeafe", borderRadius: 4, padding: "8px 12px", fontSize: 12, color: "#1e40af", marginBottom: 8 }}>
          Os campos com <span style={{ color: "#dc2626" }}>*</span> são obrigatórios.
        </div>
        <div style={{ background: "#dbeafe", borderRadius: 4, padding: "8px 12px", fontSize: 12, color: "#1e40af", marginBottom: 16, lineHeight: 1.5 }}>
          De acordo com o Manual de Ordem Bancária da STN, os valores repassados serão creditados em no máximo dois dias úteis após a data de emissão da OB para correntistas do Banco do Brasil. Para os demais bancos o prazo é de no máximo três dias úteis.
        </div>

        {/* Linha 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "120px 160px 1fr 200px", gap: 14, marginBottom: 14 }}>
          <div><label style={lblSt}><span style={{ color: "#dc2626" }}>* </span>Ano</label>
            <select value={ano} onChange={e => setAno(e.target.value)} style={selSt}>
              {[2026,2025,2024,2023,2022].map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div><label style={lblSt}>Mês</label>
            <select value={mes} onChange={e => setMes(e.target.value)} style={selSt}>
              {MESES_FNS.map(m => <option key={m}>{m}</option>)}
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

        {/* Linha 2 */}
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
              <input value={loadingMunicipios ? "Carregando..." : municipio} onChange={e => setMunicipio(e.target.value)} placeholder={estado ? "Carregando municípios..." : "Selecione o estado primeiro"} style={{ ...inputSt, color: loadingMunicipios ? "#9ca3af" : undefined }} disabled={loadingMunicipios} />
            )}
          </div>
          <div><label style={lblSt}>Processo</label>
            <input value={processo} onChange={e => setProcesso(e.target.value)} placeholder="Ex.: (12345678901234567)" style={inputSt} />
          </div>
        </div>

        {/* Linha 3 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div><label style={lblSt}>Proposta</label><input value={proposta} onChange={e => setProposta(e.target.value)} style={inputSt} /></div>
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
          <button onClick={() => { setConsultado(true); setPgCur(1); }} style={{ background: "#2a5298", color: "#fff", border: "none", borderRadius: 4, padding: "8px 22px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>🔍 Consultar</button>
        </div>
      </div>

      {/* ── Resultado: dados entidade ── */}
      {consultado && entidade && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderTop: "none", padding: "16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, marginBottom: 16, fontSize: 13 }}>
            {[
              ["Entidade", entidade.nome],
              ["CPF/CNPJ", entidade.cnpj],
              ["UF", "AM"],
              ["Município", "APUÍ"],
              ["Código IBGE", entidade.ibge],
              ["População", `${Number(entidade.populacao).toLocaleString("pt-BR")} habitantes`],
              ["Ano Censo", entidade.ano_censo],
              ["Prefeito(a)", entidade.prefeito],
              ["Data Inicial Gestão", entidade.data_gestao],
              ["Secretário(a)", entidade.secretario],
              ["Presidente Conselho", entidade.presidente_conselho],
            ].map(([label, val]) => (
              <div key={label} style={{ padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 1 }}>{label}</div>
                <div style={{ fontWeight: 600, color: "#1e293b" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* ── Tabela resultado estilo FNS ── */}
          <div style={{ overflowX: "auto", border: "1px solid #d1dce8", borderRadius: 4 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 900 }}>
              <thead>
                <tr style={{ background: "#b8cce4", color: "#1a3a6b" }}>
                  {["Bloco ⇅","Grupo ⇅","Ação ⇅","Ação Detalhada ⇅","Valor Total ⇅","Valor Desconto ⇅","Valor Líquido ⇅","Ações"].map(h => (
                    <th key={h} style={{ padding: "10px 10px", textAlign: h === "Valor Total ⇅" || h === "Valor Desconto ⇅" || h === "Valor Líquido ⇅" ? "right" : "left", fontWeight: 700, borderRight: "1px solid #a8bcd4", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginadas.map((row: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e2eaf4", background: i % 2 === 0 ? "#fff" : "#f4f8fc" }}>
                    <td style={{ padding: "9px 10px", color: "#2a5298", fontSize: 12, maxWidth: 160, lineHeight: 1.4 }}>{row.bloco}</td>
                    <td style={{ padding: "9px 10px", fontWeight: 600, color: "#1a3a6b", maxWidth: 180, lineHeight: 1.4 }}>{row.grupo}</td>
                    <td style={{ padding: "9px 10px", color: "#374151", maxWidth: 200, lineHeight: 1.4 }}>{row.acao || ""}</td>
                    <td style={{ padding: "9px 10px", color: row.valor_total ? "#374151" : "#6b7280", fontStyle: row.valor_total ? "normal" : "italic", maxWidth: 220, lineHeight: 1.4 }}>{row.acao_detalhada}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: row.valor_total ? 700 : 400, color: row.valor_total ? "#1a3a6b" : "#9ca3af" }}>{row.valor_total != null ? BRL(row.valor_total) : ""}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: "#374151" }}>{row.valor_desconto != null ? BRL(row.valor_desconto) : ""}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: row.valor_liquido ? 700 : 400, color: row.valor_liquido ? "#16a34a" : "#9ca3af" }}>{row.valor_liquido != null ? BRL(row.valor_liquido) : ""}</td>
                    <td style={{ padding: "9px 10px", textAlign: "center" }}>
                      <button onClick={() => window.open("https://consultafns.saude.gov.br/#/detalhada","_blank")} style={{ background: "#2a5298", border: "none", borderRadius: 4, width: 28, height: 28, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "#fff", fontSize: 13 }}>👁</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#e8f0f8", fontWeight: 700 }}>
                  <td colSpan={4} style={{ padding: "10px 10px", textAlign: "right", color: "#1a3a6b", fontSize: 13 }}>Total Geral</td>
                  <td style={{ padding: "10px 10px", textAlign: "right", color: "#1a3a6b", fontSize: 13 }}>{fnsData ? BRL(fnsData.total_geral) : "—"}</td>
                  <td style={{ padding: "10px 10px", textAlign: "right", color: "#1a3a6b", fontSize: 13 }}>{fnsData ? BRL(fnsData.total_desconto) : "—"}</td>
                  <td style={{ padding: "10px 10px", textAlign: "right", color: "#16a34a", fontSize: 13 }}>{fnsData ? BRL(fnsData.total_liquido) : "—"}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Paginação */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setPgCur(p => Math.max(1, p - 1))} disabled={pgCur === 1} style={{ border: "1px solid #d1dce8", borderRadius: 3, padding: "4px 10px", cursor: "pointer", background: pgCur === 1 ? "#f3f4f6" : "#fff", fontSize: 13 }}>«</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPgCur(p)} style={{ border: "1px solid #d1dce8", borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontSize: 13, background: pgCur === p ? "#2a5298" : "#fff", color: pgCur === p ? "#fff" : "#374151", fontWeight: pgCur === p ? 700 : 400 }}>{p}</button>
              ))}
              <button onClick={() => setPgCur(p => Math.min(totalPages, p + 1))} disabled={pgCur === totalPages} style={{ border: "1px solid #d1dce8", borderRadius: 3, padding: "4px 10px", cursor: "pointer", background: pgCur === totalPages ? "#f3f4f6" : "#fff", fontSize: 13 }}>»</button>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[10, 25, 50, 100].map(n => (
                <button key={n} onClick={() => { setPgSize(n); setPgCur(1); }} style={{ border: "1px solid #d1dce8", borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontSize: 13, background: pgSize === n ? "#2a5298" : "#fff", color: pgSize === n ? "#fff" : "#374151", fontWeight: pgSize === n ? 700 : 400 }}>{n}</button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 8, fontSize: 11, color: "#9ca3af" }}>
            Fonte: <a href="https://consultafns.saude.gov.br/#/detalhada/acao" target="_blank" rel="noreferrer" style={{ color: "#2a5298" }}>consultafns.saude.gov.br</a> — dados reais {ano}
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
          <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "2px solid #e5e7eb" }}>
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
                      { label: "Empenhado",          val: data.despesas.empenhado,           cor: "#93c5fd", pct: data.despesas.empenhado / data.despesas.dotacao_atualizada * 100 },
                      { label: "Liquidado",          val: data.despesas.liquidado,           cor: "#60a5fa", pct: data.despesas.liquidado / data.despesas.dotacao_atualizada * 100 },
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
                              <div style={{ fontSize: 9, color: "#15803d", marginTop: 2 }}>R$ {(b.recebido_mes/1000).toFixed(1)}k</div>
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
                    <Bar dataKey="previsto"  name="Previsto"  fill="#93c5fd" radius={[4,4,0,0]} />
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
