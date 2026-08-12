import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";
import {
  AlertTriangle, CheckCircle, ExternalLink, Globe,
  TrendingUp, DollarSign, Shield, Info, RefreshCw,
} from "lucide-react";

const BLUE   = "#1d4ed8";
const GREEN  = "#16a34a";
const AMBER  = "#d97706";
const RED    = "#dc2626";
const SLATE  = "#64748b";

// ── tipos inferidos da API ──────────────────────────────────────────
type Status = {
  fonte: "live" | "referencia";
  rreo_disponivel: boolean;
  rgf_disponivel: boolean;
  alerta: string | null;
  instrucoes_envio: Record<string, string>;
  consultado_em: string;
};
type RREOResp = {
  fonte: "live" | "referencia";
  aviso?: string;
  dados: Record<string, number | boolean>;
  rubricas_receita?: Array<{ rubrica: string; orcado: number; realizado: number; pct: number }>;
  rubricas_despesa?: Array<{ rubrica: string; orcado: number; liquidado: number; pct: number }>;
  bimestres?: Array<{ bimestre: string; receita: number; despesa: number; asps: number }>;
};
type RGFResp = {
  fonte: "live" | "referencia";
  aviso?: string;
  dados: Record<string, number | boolean>;
};

// ── componentes menores ─────────────────────────────────────────────
const FonteBadge = ({ fonte }: { fonte: "live" | "referencia" }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
    fonte === "live"
      ? "bg-green-100 text-green-800 border border-green-300"
      : "bg-amber-100 text-amber-800 border border-amber-300"
  }`}>
    {fonte === "live" ? <Globe size={10}/> : <AlertTriangle size={10}/>}
    {fonte === "live" ? "SICONFI LIVE" : "REFERÊNCIA"}
  </span>
);

const KPI = ({
  label, value, sub, color = BLUE, tooltip,
}: { label: string; value: string; sub?: string; color?: string; tooltip?: string }) => (
  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
    padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,.07)", position: "relative" }}>
    <p style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase",
      letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 4 }}>
      {label}
      {tooltip && <span title={tooltip} style={{ cursor: "help", lineHeight: 0 }}><Info size={12} color={SLATE}/></span>}
    </p>
    <p style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color }}>{value}</p>
    {sub && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{sub}</p>}
  </div>
);

const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div className="w-full bg-slate-100 rounded-full h-2">
    <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }}/>
  </div>
);

// ── banner de integração não-enviada ────────────────────────────────
function AlertaSiconfi({ status }: { status: Status }) {
  const [open, setOpen] = useState(false);
  if (!status.alerta) return null;
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} color={AMBER} className="flex-shrink-0 mt-0.5"/>
        <div className="flex-1">
          <p className="font-semibold text-amber-900 text-sm">Declaração SICONFI não localizada</p>
          <p className="text-amber-800 text-xs mt-1">{status.alerta}</p>
          <button onClick={() => setOpen(o => !o)}
            className="mt-2 text-xs font-medium text-blue-700 underline flex items-center gap-1">
            {open ? "Ocultar instruções" : "Ver como enviar ao SICONFI"}
          </button>
          {open && (
            <div className="mt-3 bg-white rounded-lg border border-amber-200 p-3 text-xs text-slate-700 space-y-1.5">
              <p className="font-semibold text-slate-800 mb-2">Passo a passo para transmissão:</p>
              {Object.entries(status.instrucoes_envio).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  {k === "portal" ? (
                    <a href={v} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-700 font-medium hover:underline">
                      <ExternalLink size={11}/> Portal SICONFI
                    </a>
                  ) : (
                    <>
                      <span className="text-slate-400 font-mono w-16 flex-shrink-0">{k}</span>
                      <span>{v}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <FonteBadge fonte="referencia"/>
      </div>
    </div>
  );
}

// ── aba RREO ─────────────────────────────────────────────────────────
function AbaRREO({ rreo }: { rreo: RREOResp }) {
  const d = rreo.dados as any;
  return (
    <div className="space-y-6">
      {rreo.aviso && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {rreo.aviso}
        </p>
      )}

      {/* KPIs receita/despesa */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <KPI label="Receita Orçada" value={BRL(d.receitaOrcada)} color={BLUE}
          tooltip="Total de receitas previstas na LOA para o exercício"/>
        <KPI label="Receita Realizada" value={BRL(d.receitaRealizada)}
          sub={PCT(d.receitaRealizada / d.receitaOrcada * 100)} color={GREEN}
          tooltip="Receitas efetivamente arrecadadas no período"/>
        <KPI label="Despesa Liquidada" value={BRL(d.despesaLiquidada)}
          sub={PCT(d.despesaLiquidada / d.despesaOrcada * 100)} color={AMBER}
          tooltip="Despesas reconhecidas como dívida — base da execução financeira"/>
        <KPI label="Superávit/Déficit" value={BRL(d.superavitDeficit)}
          color={d.superavitDeficit >= 0 ? GREEN : RED}
          tooltip="Diferença entre receita realizada e despesa liquidada"/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <KPI label="Despesa Empenhada"  value={BRL(d.despesaEmpenhada)}  color={BLUE}/>
        <KPI label="Despesa Paga"       value={BRL(d.despesaPaga)}       color={GREEN}/>
        <KPI label="Restos a Pagar"     value={BRL(d.restosApagarInscritos)}
          sub={`Pagos: ${BRL(d.restosApagarPagos)}`} color={AMBER}
          tooltip="Valores empenhados não pagos no exercício — inscritos em restos a pagar"/>
        <KPI label="ASPS % Aplicado"    value={`${d.aspsPctAplicado}%`}
          sub="Mín. constitucional: 15%" color={d.aspsCumpriu ? GREEN : RED}
          tooltip="LC 141/2012 — mínimo de 15% das receitas líquidas em Ações e Serviços Públicos de Saúde"/>
      </div>

      {/* ASPS barra */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-3 text-sm flex items-center gap-2">
          <Shield size={16} color={d.aspsCumpriu ? GREEN : RED}/>
          Mínimo Constitucional ASPS — LC 141/2012
          {d.aspsCumpriu
            ? <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={11}/> Cumprido</span>
            : <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle size={11}/> Irregular</span>}
        </h3>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-sm text-slate-600">Aplicado em ASPS:</span>
          <span className="font-bold text-lg" style={{ color: d.aspsCumpriu ? GREEN : RED }}>{d.aspsPctAplicado}%</span>
          <span className="text-xs text-slate-400">/ mínimo 15%</span>
        </div>
        <ProgressBar value={d.aspsPctAplicado} max={25} color={d.aspsCumpriu ? GREEN : RED}/>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>0%</span><span>15% (min)</span><span>25%</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Valor mínimo constitucional: {BRL(d.aspsMinConstitucional)} ·
          Total aplicado em ASPS: {BRL(d.aspsDespesaTotal)}
        </p>
      </div>

      {/* Gráfico bimestres */}
      {rreo.bimestres && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm">Evolução Bimestral — Receita × Despesa × ASPS</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={rreo.bimestres} margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="bimestre" tick={{ fontSize: 10 }}/>
              <YAxis tickFormatter={BRL_AXIS} width={90} tick={{ fontSize: 10 }}/>
              <Tooltip formatter={(v: any) => BRL(v)}/>
              <Legend/>
              <Bar dataKey="receita"  name="Receita"  fill={BLUE}  radius={[3,3,0,0]}/>
              <Bar dataKey="despesa"  name="Despesa"  fill={AMBER} radius={[3,3,0,0]}/>
              <Bar dataKey="asps"     name="ASPS"     fill={GREEN} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabelas de rubricas */}
      {rreo.rubricas_receita && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm overflow-x-auto">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm">Receitas por Rubrica</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="text-left py-2 pr-4">Rubrica</th>
                <th className="text-right py-2 pr-4">Orçado</th>
                <th className="text-right py-2 pr-4">Realizado</th>
                <th className="text-right py-2">Exec.%</th>
              </tr>
            </thead>
            <tbody>
              {rreo.rubricas_receita.map(r => (
                <tr key={r.rubrica} className="border-b border-slate-100">
                  <td className="py-2 pr-4 text-slate-700">{r.rubrica}</td>
                  <td className="py-2 pr-4 text-right text-slate-500 font-mono tabular-nums">{BRL(r.orcado)}</td>
                  <td className="py-2 pr-4 text-right font-mono tabular-nums">{BRL(r.realizado)}</td>
                  <td className="py-2 text-right font-bold" style={{ color: r.pct >= 90 ? GREEN : r.pct >= 75 ? AMBER : RED }}>{r.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rreo.rubricas_despesa && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm overflow-x-auto">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm">Despesas por Rubrica</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="text-left py-2 pr-4">Rubrica</th>
                <th className="text-right py-2 pr-4">Orçado</th>
                <th className="text-right py-2 pr-4">Liquidado</th>
                <th className="text-right py-2">Exec.%</th>
              </tr>
            </thead>
            <tbody>
              {rreo.rubricas_despesa.map(r => (
                <tr key={r.rubrica} className="border-b border-slate-100">
                  <td className="py-2 pr-4 text-slate-700">{r.rubrica}</td>
                  <td className="py-2 pr-4 text-right text-slate-500 font-mono tabular-nums">{BRL(r.orcado)}</td>
                  <td className="py-2 pr-4 text-right font-mono tabular-nums">{BRL(r.liquidado)}</td>
                  <td className="py-2 text-right font-bold" style={{ color: r.pct >= 90 ? GREEN : r.pct >= 75 ? AMBER : RED }}>{r.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── aba RGF ──────────────────────────────────────────────────────────
function AbaRGF({ rgf }: { rgf: RGFResp }) {
  const d = rgf.dados as any;
  const pctPessoal = d.pctDTP;
  const limPrud = d.limitePrudencial;
  const limLegal = d.limiteLegal;

  return (
    <div className="space-y-6">
      {rgf.aviso && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {rgf.aviso}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPI label="Receita Corrente Líquida" value={BRL(d.receitaCorrenteLiquida)} color={BLUE}
          tooltip="Base de cálculo para todos os limites da LRF"/>
        <KPI label="Desp. Total com Pessoal" value={BRL(d.despesaTotalPessoal)}
          sub={`${d.pctDTP}% da RCL`}
          color={pctPessoal <= limPrud ? GREEN : pctPessoal <= limLegal ? AMBER : RED}
          tooltip="Despesa total com pessoal incluindo encargos — LRF art. 19"/>
        <KPI label="Disponibilidade de Caixa" value={BRL(d.dispCaixaLiq)} color={GREEN}
          tooltip="Caixa líquido disponível após obrigações de curto prazo"/>
        <KPI label="Dívida Consolidada Líquida" value={BRL(d.dividaConsolidadaLiquida)}
          sub={`${d.pctDCL}% da RCL`} color={d.pctDCL < 120 ? GREEN : RED}
          tooltip="Dívida consolidada deduzidas disponibilidades — limite LRF: 120% da RCL"/>
        <KPI label="Garantias Concedidas" value={BRL(d.garantiasConcedidas)} color={SLATE}
          tooltip="Avais e garantias prestadas pelo município — limite LRF: 22% da RCL"/>
        <KPI label="Operações de Crédito" value={BRL(d.operacoesCredito)} color={SLATE}
          tooltip="Operações de crédito realizadas no exercício — limite LRF: 16% da RCL"/>
      </div>

      {/* Barra de pessoal */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-3 text-sm flex items-center gap-2">
          <TrendingUp size={16}/>
          Limite de Pessoal — LRF art. 19 e 20
          {pctPessoal <= limPrud
            ? <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={11}/> Dentro do limite</span>
            : pctPessoal <= limLegal
            ? <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Limite prudencial</span>
            : <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Excede limite legal</span>}
        </h3>
        <div className="flex items-center gap-4 mb-2">
          <span className="font-bold text-2xl" style={{ color: pctPessoal <= limPrud ? GREEN : RED }}>
            {pctPessoal}%
          </span>
          <span className="text-sm text-slate-500">da RCL</span>
        </div>

        {/* Barra com marcadores */}
        <div className="relative w-full h-6 bg-slate-100 rounded-full overflow-hidden mb-1">
          <div className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(pctPessoal / limLegal * 100, 100)}%`,
              background: pctPessoal <= limPrud ? GREEN : pctPessoal <= limLegal ? AMBER : RED,
            }}/>
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>0%</span>
          <span>{limPrud}% prudencial</span>
          <span>{limLegal}% legal</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3 text-xs text-slate-600">
          <div className="bg-slate-50 rounded p-2">
            <span className="font-medium">Limite prudencial ({limPrud}%):</span>{" "}
            {BRL(d.receitaCorrenteLiquida * limPrud / 100)}
          </div>
          <div className="bg-slate-50 rounded p-2">
            <span className="font-medium">Limite legal ({limLegal}%):</span>{" "}
            {BRL(d.receitaCorrenteLiquida * limLegal / 100)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── página principal ─────────────────────────────────────────────────
export default function SICONFIPanel() {
  const [aba, setAba] = useState<"rreo" | "rgf" | "status">("rreo");
  const [bimestre, setBimestre]  = useState(6);
  const [quadrimestre, setQuad] = useState(3);

  const { data: status, isLoading: stLoad, refetch: refStatus } =
    useQuery<Status>({
      queryKey: ["siconfi-status"],
      queryFn: () => apiGet("/api/siconfi/status"),
      staleTime: 5 * 60_000,
    });

  const { data: rreo, isLoading: rreoLoad } =
    useQuery<RREOResp>({
      queryKey: ["siconfi-rreo", bimestre],
      queryFn: () => apiGet(`/api/siconfi/rreo?exercicio=2024&bimestre=${bimestre}`),
      enabled: aba === "rreo",
    });

  const { data: rgf, isLoading: rgfLoad } =
    useQuery<RGFResp>({
      queryKey: ["siconfi-rgf", quadrimestre],
      queryFn: () => apiGet(`/api/siconfi/rgf?exercicio=2024&quadrimestre=${quadrimestre}`),
      enabled: aba === "rgf",
    });

  const isLive = status?.fonte === "live";

  const ABAS = [
    { key: "rreo",   label: "RREO — Execução Orçamentária", icon: <DollarSign size={15}/> },
    { key: "rgf",    label: "RGF — Gestão Fiscal",          icon: <Shield size={15}/> },
    { key: "status", label: "Status da Integração",         icon: <Globe size={15}/> },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-700 rounded-lg">
              <Globe size={22} color="white"/>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-900">SICONFI — Tesouro Nacional</h1>
              <p className="text-sm text-slate-500">
                Sistema de Informações Contábeis e Fiscais · Apuí/AM · IBGE 1300144
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {status && <FonteBadge fonte={status.fonte}/>}
            <button onClick={() => refStatus()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <RefreshCw size={13}/> Verificar API
            </button>
            <a href="https://siconfi.tesouro.gov.br/siconfi/index.jsf"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors">
              <ExternalLink size={13}/> Portal SICONFI
            </a>
          </div>
        </div>

        {/* Banner de alerta se não enviou */}
        {!stLoad && status && <AlertaSiconfi status={status}/>}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {ABAS.map(a => (
            <button key={a.key} onClick={() => setAba(a.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={aba === a.key
                ? { background: BLUE, color: "white" }
                : { background: "white", color: "#475569", border: "1px solid #e2e8f0" }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>

        {/* Filtros de período */}
        {aba === "rreo" && (
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-slate-600 font-medium">Bimestre 2024:</label>
            {[1,2,3,4,5,6].map(b => (
              <button key={b} onClick={() => setBimestre(b)}
                className="px-3 py-1 text-xs rounded-lg font-medium transition-all"
                style={bimestre === b
                  ? { background: BLUE, color: "white" }
                  : { background: "white", border: "1px solid #e2e8f0", color: "#475569" }}>
                {b}º Bim
              </button>
            ))}
          </div>
        )}
        {aba === "rgf" && (
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-slate-600 font-medium">Quadrimestre 2024:</label>
            {[1,2,3].map(q => (
              <button key={q} onClick={() => setQuad(q)}
                className="px-3 py-1 text-xs rounded-lg font-medium transition-all"
                style={quadrimestre === q
                  ? { background: BLUE, color: "white" }
                  : { background: "white", border: "1px solid #e2e8f0", color: "#475569" }}>
                {q}º Quad
              </button>
            ))}
          </div>
        )}

        {/* Conteúdo */}
        {aba === "rreo" && (
          rreoLoad
            ? <p className="text-slate-500 text-sm">Consultando SICONFI…</p>
            : rreo ? <AbaRREO rreo={rreo}/> : <NaoDisponivelBanner compact nota="RREO indisponível — integração com SICONFI não configurada no Railway. Nenhum dado fiscal foi inventado." />
        )}

        {aba === "rgf" && (
          rgfLoad
            ? <p className="text-slate-500 text-sm">Consultando SICONFI…</p>
            : rgf ? <AbaRGF rgf={rgf}/> : <NaoDisponivelBanner compact nota="RGF indisponível — integração com SICONFI não configurada no Railway. Nenhum dado fiscal foi inventado." />
        )}

        {aba === "status" && (
          stLoad
            ? <p className="text-slate-500 text-sm">Verificando API…</p>
            : status && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">RREO no SICONFI</p>
                    <div className="flex items-center gap-2">
                      {status.rreo_disponivel
                        ? <CheckCircle size={20} color={GREEN}/>
                        : <AlertTriangle size={20} color={AMBER}/>}
                      <span className="font-semibold text-slate-800">
                        {status.rreo_disponivel ? "Disponível" : "Não encontrado"}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">RGF no SICONFI</p>
                    <div className="flex items-center gap-2">
                      {status.rgf_disponivel
                        ? <CheckCircle size={20} color={GREEN}/>
                        : <AlertTriangle size={20} color={AMBER}/>}
                      <span className="font-semibold text-slate-800">
                        {status.rgf_disponivel ? "Disponível" : "Não encontrado"}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Modo dos dados</p>
                    <FonteBadge fonte={status.fonte}/>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-sm space-y-2">
                  <p className="font-semibold text-slate-700">Detalhes da consulta</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-slate-600 text-xs">
                    <span>Município: <b>Apuí/AM</b></span>
                    <span>IBGE: <b>1300144</b></span>
                    <span>API consultada em: <b>{new Date(status.consultado_em).toLocaleString("pt-BR")}</b></span>
                    <span>API URL: <code className="bg-slate-100 px-1 rounded text-xs">{status.api_url}</code></span>
                  </div>
                </div>

                {status.alerta && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                    <p className="font-semibold text-blue-900 text-sm mb-2">Passo a passo para transmitir ao SICONFI</p>
                    <div className="space-y-1.5 text-xs text-blue-800">
                      {Object.entries(status.instrucoes_envio).map(([k, v]) => (
                        <div key={k} className="flex gap-3">
                          <span className="font-mono font-bold w-16 flex-shrink-0 text-blue-600">{k}</span>
                          {k === "portal"
                            ? <a href={v} target="_blank" rel="noopener noreferrer"
                                className="text-blue-700 hover:underline flex items-center gap-1">
                                <ExternalLink size={11}/> {v}
                              </a>
                            : <span>{v}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
        )}

        {/* Rodapé informativo */}
        <div className="mt-8 text-center text-xs text-slate-400 space-y-1">
          <p>
            Dados {isLive ? "obtidos em tempo real da API do SICONFI" : "de referência baseados no SIOPS/LOA 2024"} ·
            Tesouro Nacional · STN
          </p>
          <p>
            RREO — bimestral (LC 101/2000 art. 52) · RGF — quadrimestral (LC 101/2000 art. 54)
          </p>
        </div>
      </div>
    </div>
  );
}
