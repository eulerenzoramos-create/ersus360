import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, api } from "../lib/api";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  RefreshCw, CheckCircle, AlertTriangle, WifiOff, Database,
  ExternalLink, Download, Search, Pencil, Trash2, Save, X,
} from "lucide-react";

const BRAND  = "#dbeafe";
const ACCENT = "#1d4ed8";
const OK     = "#16a34a";
const WARN   = "#d97706";
const CRIT   = "#dc2626";
const COLORS = ["#dbeafe","#1d4ed8","#0891b2","#7c3aed","#16a34a","#d97706","#dc2626","#059669","#c026d3","#ea580c"];

const BRLK = (v: number) => {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `R$${(v / 1_000).toFixed(0)}K`;
  return `R$${v.toFixed(2)}`;
};
const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const PCT = (a: number, b: number) => b ? `${((a / b) * 100).toFixed(1)}%` : "—";

const KPI = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.07)" }}>
    <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{label}</p>
    <p style={{ fontSize: 22, fontWeight: 700, color: color || BRAND, margin: "4px 0 0" }}>{value}</p>
    {sub && <p style={{ fontSize: 11, color: "#6b7280", margin: "2px 0 0" }}>{sub}</p>}
  </div>
);

function FonteBadge({ fonte }: { fonte?: string }) {
  const isApi = fonte?.startsWith("API");
  const isErr = fonte === "indisponível" || !fonte;
  const color = isApi ? OK : isErr ? CRIT : ACCENT;
  const Icon  = isApi ? CheckCircle : isErr ? WifiOff : Database;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 500, background: `${color}18`, color }}>
      <Icon size={12}/> {fonte || "Não sincronizado"}
    </span>
  );
}

// ── Componente de tabela com busca + edição ──────────────────────────────────
interface Row { [key: string]: any }

function TabelaEditavel({
  dados, colChave, colLabel, categoria, overrides, onSaveOverride, onDeleteOverride,
}: {
  dados: Row[];
  colChave: string;
  colLabel: string;
  categoria: string;
  overrides: Row[];
  onSaveOverride: (item: any) => void;
  onDeleteOverride: (cat: string, chave: string, campo: string) => void;
}) {
  const [busca, setBusca]       = useState("");
  const [editKey, setEditKey]   = useState<string | null>(null);
  const [editVal, setEditVal]   = useState("");
  const [editObs, setEditObs]   = useState("");

  const filtrados = useMemo(() =>
    dados.filter((r) =>
      String(r[colChave] || "").toLowerCase().includes(busca.toLowerCase())
    ), [dados, busca, colChave]);

  const totalPago = dados.reduce((s, r) => s + (r.pago || 0), 0);

  const ovrMap: Record<string, Row> = {};
  overrides.filter((o) => o.categoria === colChave).forEach((o) => {
    ovrMap[`${o.chave}::${o.campo}`] = o;
  });

  function iniciarEdicao(r: Row) {
    setEditKey(r[colChave]);
    setEditVal(String(r.pago || 0));
    setEditObs("");
  }

  function salvar(r: Row) {
    onSaveOverride({
      categoria: colChave,
      chave: r[colChave],
      campo: "pago",
      valor: parseFloat(editVal) || 0,
      observacao: editObs,
    });
    setEditKey(null);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Barra de busca */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={`Pesquisar ${colLabel.toLowerCase()}…`}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400"
          />
        </div>
        <span className="text-xs text-slate-400">{filtrados.length} de {dados.length}</span>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{colLabel}</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor Pago</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">% do Total</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Barra</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.map((r, i) => {
              const chave = r[colChave];
              const ovrKey = `${chave}::pago`;
              const ovr = ovrMap[ovrKey];
              const valorExibido = ovr ? ovr.valor : r.pago || 0;
              const pct = totalPago ? (valorExibido / totalPago) * 100 : 0;
              const editing = editKey === chave;

              return (
                <tr key={chave} className={`hover:bg-slate-50 ${ovr ? "bg-amber-50" : ""}`}>
                  <td className="px-4 py-3 text-slate-700 max-w-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="truncate">{chave}</span>
                      {ovr && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 shrink-0">editado</span>}
                    </div>
                    {ovr?.observacao && <p className="text-xs text-slate-400 ml-4 mt-0.5">{ovr.observacao}</p>}
                  </td>

                  {editing ? (
                    <>
                      <td className="px-4 py-2" colSpan={3}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="number"
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                            className="w-36 px-2 py-1 text-sm border border-blue-400 rounded outline-none"
                            placeholder="Valor (R$)"
                            autoFocus
                          />
                          <input
                            value={editObs}
                            onChange={(e) => setEditObs(e.target.value)}
                            className="flex-1 min-w-[140px] px-2 py-1 text-sm border border-slate-200 rounded outline-none"
                            placeholder="Observação (opcional)"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => salvar(r)}
                            className="p-1.5 rounded-lg text-white" style={{ background: OK }}>
                            <Save size={13}/>
                          </button>
                          <button onClick={() => setEditKey(null)}
                            className="p-1.5 rounded-lg text-white" style={{ background: "#6b7280" }}>
                            <X size={13}/>
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700 tabular-nums">
                        {BRL(valorExibido)}
                        {ovr && <span className="block text-xs font-normal text-slate-400 line-through">{BRL(r.pago || 0)}</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 tabular-nums">{pct.toFixed(1)}%</td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-slate-100 rounded-full h-2 min-w-[60px]">
                          <div className="h-2 rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => iniciarEdicao(r)} title="Editar"
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                            <Pencil size={13}/>
                          </button>
                          {ovr && (
                            <button onClick={() => onDeleteOverride(colChave, chave, "pago")} title="Remover edição"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                              <Trash2 size={13}/>
                            </button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 border-t-2 border-slate-200">
            <tr>
              <td className="px-4 py-3 font-bold text-slate-700">Total</td>
              <td className="px-4 py-3 text-right font-bold text-slate-700 tabular-nums">{BRL(totalPago)}</td>
              <td className="px-4 py-3 text-right text-slate-500">100%</td>
              <td colSpan={2}/>
            </tr>
          </tfoot>
        </table>
      </div>

      {filtrados.length === 0 && (
        <div className="text-center py-10 text-slate-400 text-sm">Nenhum resultado para "{busca}"</div>
      )}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function SIOPSLive() {
  const [aba, setAba] = useState("dashboard");
  const [baixandoPdf, setBaixandoPdf] = useState(false);
  const qc = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ["siops-live-status"],
    queryFn: () => apiGet("/api/siops-live/status"),
    refetchInterval: 30_000,
  });

  const { data: dash, isLoading: dashLoading, isError: dashErr } = useQuery({
    queryKey: ["siops-live-dash"],
    queryFn: () => apiGet("/api/siops-live/dashboard"),
    enabled: aba === "dashboard",
    retry: 1,
  });

  const { data: porFonte }  = useQuery({ queryKey: ["siops-live-fonte"],  queryFn: () => apiGet("/api/siops-live/despesas/por-fonte"),      enabled: aba === "fontes" });
  const { data: porSubfun } = useQuery({ queryKey: ["siops-live-subfun"], queryFn: () => apiGet("/api/siops-live/despesas/por-subfuncao"),   enabled: aba === "subfuncoes" });
  const { data: porNat }    = useQuery({ queryKey: ["siops-live-nat"],    queryFn: () => apiGet("/api/siops-live/despesas/por-natureza"),    enabled: aba === "natureza" });
  const { data: overrides = [] } = useQuery({ queryKey: ["siops-overrides"], queryFn: () => apiGet("/api/siops-live/overrides"), refetchInterval: 5_000 });

  const sincMut = useMutation({
    mutationFn: () => api.post("/api/siops-live/sincronizar"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["siops-live-status"] });
      qc.invalidateQueries({ queryKey: ["siops-live-dash"] });
      qc.invalidateQueries({ queryKey: ["siops-live-fonte"] });
      qc.invalidateQueries({ queryKey: ["siops-live-subfun"] });
      qc.invalidateQueries({ queryKey: ["siops-live-nat"] });
    },
  });

  const overrideMut = useMutation({
    mutationFn: (item: any) => api.post("/api/siops-live/override", item),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["siops-overrides"] }),
  });

  const deleteOvrMut = useMutation({
    mutationFn: ({ cat, chave, campo }: any) =>
      api.delete(`/api/siops-live/override/${cat}/${encodeURIComponent(chave)}/${campo}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["siops-overrides"] }),
  });

  async function baixarPdf() {
    setBaixandoPdf(true);
    try {
      const resp = await api.get("/api/siops-live/exportar-pdf", { responseType: "blob" });
      const url  = URL.createObjectURL(new Blob([resp.data], { type: "application/pdf" }));
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `SIOPS_Apui_AM_${new Date().toISOString().slice(0,10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erro ao gerar PDF. Sincronize os dados primeiro.");
    } finally {
      setBaixandoPdf(false);
    }
  }

  const st = status as any;
  const d  = dash   as any;
  const ovr = overrides as any[];

  const ABAS = [
    { key: "dashboard",  label: "Dashboard"    },
    { key: "fontes",     label: "Por Fonte"     },
    { key: "subfuncoes", label: "Por Subfunção" },
    { key: "natureza",   label: "Por Natureza"  },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: BRAND }}>
              <Database size={22} color="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: BRAND }}>SIOPS — Dados Oficiais</h1>
              <p className="text-sm text-slate-500">Portal FNS · IBGE 1300144 · Apuí/AM</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => sincMut.mutate()} disabled={sincMut.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
              style={{ background: sincMut.isPending ? "#6b7280" : BRAND }}>
              <RefreshCw size={14} className={sincMut.isPending ? "animate-spin" : ""}/>
              {sincMut.isPending ? "Sincronizando…" : "Sincronizar"}
            </button>
            <button onClick={baixarPdf} disabled={baixandoPdf || !st?.cache_valido}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
              style={{ background: baixandoPdf || !st?.cache_valido ? "#6b7280" : OK }}>
              <Download size={14} className={baixandoPdf ? "animate-bounce" : ""}/>
              {baixandoPdf ? "Gerando PDF…" : "Baixar PDF"}
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Fonte:</span>
              <FonteBadge fonte={st?.fonte} />
            </div>
            <div>
              <span className="text-slate-400 mr-1">Última sync:</span>
              <span className="font-medium text-slate-600">
                {st?.sincronizado_em
                  ? new Date(st.sincronizado_em).toLocaleString("pt-BR")
                  : "Nunca"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 mr-1">Cache:</span>
              <span className="font-medium" style={{ color: st?.cache_valido ? OK : WARN }}>
                {st?.cache_valido ? "Válido (24h)" : "Expirado"}
              </span>
            </div>
            {ovr.length > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                {ovr.length} edição{ovr.length > 1 ? "ões" : ""} manual{ovr.length > 1 ? "is" : ""}
              </span>
            )}
            <a href="https://portalfns.saude.gov.br/siops/" target="_blank" rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-blue-600 hover:underline text-xs">
              Portal FNS <ExternalLink size={11}/>
            </a>
          </div>
          {sincMut.isSuccess && (sincMut.data?.data as any)?.fonte && (
            <div className="mt-2 p-2 rounded-lg text-xs" style={{ background: `${OK}14`, color: OK }}>
              ✓ Sincronizado — <b>{(sincMut.data?.data as any).fonte}</b>
              {(sincMut.data?.data as any).erro && <span className="ml-2" style={{ color: CRIT }}>Aviso: {(sincMut.data?.data as any).erro}</span>}
            </div>
          )}
          {sincMut.isError && (
            <div className="mt-2 p-2 rounded-lg text-xs" style={{ background: `${CRIT}14`, color: CRIT }}>
              Erro na sincronização — verifique conectividade do servidor Railway.
            </div>
          )}
        </div>

        {!st?.cache_valido && !sincMut.isPending && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5 flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: WARN }}/>
            <div className="text-sm text-yellow-800">
              <b>Dados não carregados.</b> Clique em <b>"Sincronizar"</b> para buscar os dados do portal FNS.
              <span className="text-xs block mt-1 text-yellow-600">Tentará a API SIOPS; se indisponível, baixa o CSV oficial 2025.</span>
            </div>
          </div>
        )}

        {/* Abas */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {ABAS.map((a) => (
            <button key={a.key} onClick={() => setAba(a.key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={aba === a.key ? { background: BRAND, color: "white" } : { background: "white", color: "#475569", border: "1px solid #e2e8f0" }}>
              {a.label}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD ── */}
        {aba === "dashboard" && (
          <>
            {dashLoading && <div className="text-center py-20 text-slate-400">Carregando…</div>}
            {dashErr && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">
                <b>Dados não disponíveis.</b> Clique em "Sincronizar" para buscar do portal FNS.
              </div>
            )}
            {d && !dashLoading && (
              <div className="space-y-5">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
                  <KPI label="Dotação"    value={BRLK(d.totais?.dotacao   || 0)} color={BRAND}/>
                  <KPI label="Empenhado"  value={BRLK(d.totais?.empenhado || 0)} sub={PCT(d.totais?.empenhado||0, d.totais?.dotacao||1)} color={ACCENT}/>
                  <KPI label="Liquidado"  value={BRLK(d.totais?.liquidado || 0)} sub={PCT(d.totais?.liquidado||0, d.totais?.dotacao||1)} color={"#0891b2"}/>
                  <KPI label="Pago"       value={BRLK(d.totais?.pago      || 0)} sub={`${d.pct_execucao || 0}% da dotação`} color={OK}/>
                </div>

                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.07)" }}>
                  <h3 className="font-semibold text-slate-700 mb-4">Pipeline Orçamentário</h3>
                  {[
                    { label: "Dotação",   val: d.totais?.dotacao,   color: "#6b7280" },
                    { label: "Empenhado", val: d.totais?.empenhado, color: ACCENT },
                    { label: "Liquidado", val: d.totais?.liquidado, color: "#0891b2" },
                    { label: "Pago",      val: d.totais?.pago,      color: OK },
                  ].map((item) => {
                    const pct = d.totais?.dotacao ? Math.min(((item.val||0)/d.totais.dotacao)*100,100) : 0;
                    return (
                      <div key={item.label} className="flex items-center gap-3 text-sm mb-2">
                        <span className="w-24 text-slate-500 shrink-0">{item.label}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-3">
                          <div className="h-3 rounded-full" style={{ width: `${pct}%`, background: item.color }}/>
                        </div>
                        <span className="w-28 text-right font-semibold text-slate-700">{BRLK(item.val||0)}</span>
                        <span className="w-10 text-right text-slate-400 text-xs">{pct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
                  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.07)" }}>
                    <h3 className="font-semibold text-slate-700 mb-3 text-sm">Top Fontes (pago)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={(d.top_fontes||[]).slice(0,6)} layout="vertical" margin={{ left: 0, right: 50 }}>
                        <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 9 }}/>
                        <YAxis type="category" dataKey="fonte" tick={{ fontSize: 8 }} width={130}/>
                        <Tooltip formatter={(v: number) => BRL(v)}/>
                        <Bar dataKey="pago" radius={[0,3,3,0]}>
                          {(d.top_fontes||[]).slice(0,6).map((_: any, i: number) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.07)" }}>
                    <h3 className="font-semibold text-slate-700 mb-3 text-sm">Natureza da Despesa</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={(d.top_naturezas||[]).slice(0,6)} dataKey="pago" nameKey="natureza" cx="50%" cy="50%" outerRadius={80}>
                          {(d.top_naturezas||[]).slice(0,6).map((_: any, i: number) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                        </Pie>
                        <Tooltip formatter={(v: number) => BRL(v)}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-100 rounded-xl p-3 text-xs text-slate-500 flex items-center gap-2">
                  <Database size={12}/>
                  {d.total_linhas_csv ? `${d.total_linhas_csv} registros · ` : ""}
                  Fonte: <b>{d.fonte}</b> · {d.sincronizado_em ? new Date(d.sincronizado_em).toLocaleString("pt-BR") : "—"}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── POR FONTE ── */}
        {aba === "fontes" && Array.isArray(porFonte) && (
          <TabelaEditavel
            dados={porFonte as Row[]}
            colChave="fonte"
            colLabel="Fonte de Recurso"
            categoria="fonte"
            overrides={ovr}
            onSaveOverride={(item) => overrideMut.mutate(item)}
            onDeleteOverride={(cat, chave, campo) => deleteOvrMut.mutate({ cat, chave, campo })}
          />
        )}

        {/* ── POR SUBFUNÇÃO ── */}
        {aba === "subfuncoes" && Array.isArray(porSubfun) && (
          <TabelaEditavel
            dados={porSubfun as Row[]}
            colChave="subfuncao"
            colLabel="Subfunção"
            categoria="subfuncao"
            overrides={ovr}
            onSaveOverride={(item) => overrideMut.mutate(item)}
            onDeleteOverride={(cat, chave, campo) => deleteOvrMut.mutate({ cat, chave, campo })}
          />
        )}

        {/* ── POR NATUREZA ── */}
        {aba === "natureza" && Array.isArray(porNat) && (
          <TabelaEditavel
            dados={porNat as Row[]}
            colChave="natureza"
            colLabel="Natureza de Despesa"
            categoria="natureza"
            overrides={ovr}
            onSaveOverride={(item) => overrideMut.mutate(item)}
            onDeleteOverride={(cat, chave, campo) => deleteOvrMut.mutate({ cat, chave, campo })}
          />
        )}
      </div>
    </div>
  );
}
