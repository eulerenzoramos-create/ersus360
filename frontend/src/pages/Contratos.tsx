import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from "recharts";
import {
  FileText, AlertTriangle, CheckCircle, Clock,
  ChevronDown, ChevronRight, Search, Filter,
  Building2, DollarSign, TrendingUp, ExternalLink,
} from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import { BRL, BRL_AXIS } from "../lib/fmt";

// ── Helpers ───────────────────────────────────────────────────────────────────


const COR_STATUS: Record<string, string> = {
  vigente:   "#16a34a",
  vencendo:  "#d97706",
  concluido: "#6b7280",
  licitando: "#1d4ed8",
  planejado: "#7c3aed",
};
const BG_STATUS: Record<string, string> = {
  vigente:   "#f0fdf4",
  vencendo:  "#fffbeb",
  concluido: "#f9fafb",
  licitando: "#eff6ff",
  planejado: "#f5f3ff",
};
const LABEL_STATUS: Record<string, string> = {
  vigente:   "Vigente",
  vencendo:  "Vencendo em 30d",
  concluido: "Concluído",
  licitando: "Em licitação",
  planejado: "Planejado",
};

const COR_MOD: Record<string, string> = {
  "Pregão Eletrônico": "#1d4ed8",
  "Dispensa":          "#16a34a",
  "Tomada de Preços":  "#d97706",
  "Inexigibilidade":   "#7c3aed",
};

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, cor, icon }: { label: string; value: string | number; sub?: string; cor: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}22`, borderTop: `3px solid ${cor}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
        <div style={{ background: `${cor}15`, borderRadius: 6, padding: 5 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: cor, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ── Aba: Dashboard ────────────────────────────────────────────────────────────
function AbaDashboard({ dash }: { dash: any }) {
  if (!dash) return <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Carregando…</div>;

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Total contratos"      value={dash.total_contratos}  sub={dash.competencia}          cor="#1d4ed8"  icon={<FileText size={14} color="#1d4ed8" />} />
        <KpiCard label="Vigentes"             value={dash.vigentes}         sub="em execução"               cor="#16a34a"  icon={<CheckCircle size={14} color="#16a34a" />} />
        <KpiCard label="Vencendo em 30 dias"  value={dash.vencendo_30d}     sub="renovar urgente"           cor="#d97706"  icon={<Clock size={14} color="#d97706" />} />
        <KpiCard label="Em licitação"         value={dash.em_licitacao}     sub="processos abertos"         cor="#7c3aed"  icon={<TrendingUp size={14} color="#7c3aed" />} />
        <KpiCard label="Valor total contratos" value={BRL(dash.total_valor)} sub="soma dos contratos 2026" cor="#0891b2"  icon={<DollarSign size={14} color="#0891b2" />} />
        <KpiCard label="Execução (% pago)"    value={`${dash.pct_pago}%`}   sub={`${BRL(dash.total_pago)} pagos`} cor={dash.pct_pago >= 50 ? "#16a34a" : "#d97706"} icon={<TrendingUp size={14} color={dash.pct_pago >= 50 ? "#16a34a" : "#d97706"} />} />
      </div>

      {/* Barra execução geral */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 18px", marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Execução financeira geral</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#1d4ed8" }}>{dash.pct_pago}%</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          {[
            { label: "Valor total",     val: dash.total_valor,      cor: "#6b7280" },
            { label: "Empenhado",        val: dash.total_empenhado,  cor: "#d97706" },
            { label: "Pago",             val: dash.total_pago,       cor: "#16a34a" },
          ].map(k => (
            <div key={k.label} style={{ textAlign: "center", padding: "10px", background: "#f9fafb", borderRadius: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: k.cor }}>{BRL(k.val)}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>{k.label}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 10, background: "#f3f4f6", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ width: `${dash.pct_pago}%`, height: "100%", background: "#16a34a", borderRadius: 6 }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 22 }}>
        {/* Por área */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Valor contratado por área</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.por_area} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => `${BRL(v)}`} />
                <YAxis type="category" dataKey="area" tick={{ fontSize: 10 }} width={100} />
                <Tooltip contentStyle={TT} formatter={(v: number) => [BRL(v), "Valor"]} />
                <Bar dataKey="valor" name="Valor" fill="#1d4ed8" radius={[0,4,4,0]}>
                  {dash.por_area.map((_: any, i: number) => (
                    <Cell key={i} fill={["#1d4ed8","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626","#374151","#059669"][i % 8]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Por modalidade + histórico */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Licitações por modalidade</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {dash.por_modalidade.map((m: any) => {
              const cor = COR_MOD[m.modalidade] ?? "#6b7280";
              return (
                <div key={m.modalidade} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, minWidth: 140 }}>{m.modalidade}</span>
                  <div style={{ flex: 1, height: 10, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${(m.n / dash.total_contratos) * 100}%`, height: "100%", background: cor, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: cor, minWidth: 20, textAlign: "right" }}>{m.n}</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Histórico de abertura/mês</div>
          <div style={{ height: 90 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.historico} barSize={10}>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={TT} />
                <Bar dataKey="pregao"   stackId="a" fill="#1d4ed8" name="Pregão" />
                <Bar dataKey="dispensa" stackId="a" fill="#16a34a" name="Dispensa" />
                <Bar dataKey="tomada"   stackId="a" fill="#d97706" name="Tom.Preços" />
                <Bar dataKey="inexig"   stackId="a" fill="#7c3aed" name="Inexig." radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Aba: Lista de Contratos ───────────────────────────────────────────────────
function AbaLista({ items }: { items: any[] | undefined }) {
  const [abertas, setAbertas] = useState<Set<number>>(new Set());
  const [busca, setBusca] = useState("");
  if (!items) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;

  const toggle = (id: number) => setAbertas(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });

  const filtrados = busca
    ? items.filter(c => c.objeto.toLowerCase().includes(busca.toLowerCase()) || c.numero.includes(busca) || c.fornecedor.toLowerCase().includes(busca.toLowerCase()))
    : items;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            placeholder="Buscar por número, objeto ou fornecedor…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: "100%", paddingLeft: 32, padding: "7px 12px 7px 32px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>{filtrados.length} contratos</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtrados.map(c => {
          const isOpen = abertas.has(c.id);
          const cor = COR_STATUS[c.status] ?? "#6b7280";
          const bg  = BG_STATUS[c.status]  ?? "#f9fafb";
          return (
            <div key={c.id} style={{ border: `1px solid ${cor}22`, borderLeft: `4px solid ${cor}`, borderRadius: 8, background: "#fff", overflow: "hidden" }}>
              <div onClick={() => toggle(c.id)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", cursor: "pointer" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4, alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Nº {c.numero}</span>
                    <span style={{ background: `${COR_MOD[c.modalidade] ?? "#6b7280"}15`, color: COR_MOD[c.modalidade] ?? "#6b7280", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4 }}>{c.modalidade}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{c.area}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.objeto}</div>
                  {c.fornecedor !== "—" && (
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                      <Building2 size={10} style={{ marginRight: 4 }} />{c.fornecedor}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                  <span style={{ background: bg, color: cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                    {LABEL_STATUS[c.status]}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{BRL(c.valor_total)}</span>
                </div>
                {isOpen ? <ChevronDown size={13} color="#9ca3af" /> : <ChevronRight size={13} color="#9ca3af" />}
              </div>

              {isOpen && (
                <div style={{ padding: "12px 14px", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
                    {[
                      { label: "Processo",         val: c.processo },
                      { label: "Vigência início",  val: c.vigencia_inicio },
                      { label: "Vigência fim",      val: c.vigencia_fim },
                      { label: "CNPJ fornecedor",  val: c.cnpj },
                    ].map(d => (
                      <div key={d.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>{d.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{d.val}</div>
                      </div>
                    ))}
                  </div>
                  {/* Execução financeira */}
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Execução financeira</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 10 }}>
                      {[
                        { label: "Valor contrato",  val: c.valor_total,     cor: "#374151" },
                        { label: "Empenhado",        val: c.valor_empenhado, cor: "#d97706" },
                        { label: "Pago",             val: c.valor_pago,      cor: "#16a34a" },
                      ].map(k => (
                        <div key={k.label} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: k.cor }}>{BRL(k.val)}</div>
                          <div style={{ fontSize: 10, color: "#9ca3af" }}>{k.label}</div>
                        </div>
                      ))}
                    </div>
                    {c.pct_pago > 0 && (
                      <div>
                        <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${c.pct_pago}%`, height: "100%", background: "#16a34a", borderRadius: 4 }} />
                        </div>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3 }}>{c.pct_pago}% pago do total</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Aba: Alertas ──────────────────────────────────────────────────────────────
function AbaAlertas({ alertas }: { alertas: any }) {
  if (!alertas) return <NaoDisponivelBanner nota="Dados n�o dispon�veis no momento. Integra��o pendente de configura��o no Railway." />;
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#d97706", margin: "0 0 4px" }}>Alertas de Contratos</h2>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Contratos próximos do vencimento e processos em licitação</p>
      </div>

      {alertas.vencendo?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Clock size={16} color="#d97706" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#d97706" }}>Contratos a vencer em 30 dias — {alertas.vencendo.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {alertas.vencendo.map((c: any) => (
              <div key={c.id} style={{ background: "#fffbeb", border: "1px solid #fde68a", borderLeft: "4px solid #d97706", borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>Nº {c.numero} · {c.modalidade} · {c.area}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#78350f", marginTop: 2 }}>{c.objeto}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Vigência até {c.vigencia_fim} · {c.fornecedor}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#d97706" }}>{BRL(c.valor_total)}</div>
                    <button style={{ marginTop: 4, background: "#d97706", color: "#fff", border: "none", borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>
                      Renovar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alertas.licitando?.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <FileText size={16} color="#1d4ed8" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1d4ed8" }}>Em licitação — {alertas.licitando.length} processos</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {alertas.licitando.map((c: any) => (
              <div key={c.id} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderLeft: "4px solid #1d4ed8", borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>Nº {c.numero} · {c.modalidade} · {c.area}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e40af", marginTop: 2 }}>{c.objeto}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1d4ed8" }}>{BRL(c.valor_total)}</div>
                    <span style={{ fontSize: 10, background: "#1d4ed8", color: "#fff", padding: "2px 7px", borderRadius: 4 }}>
                      {c.status === "licitando" ? "Em licitação" : "Planejado"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

type Aba = "dashboard" | "lista" | "alertas";

const FILTROS_STATUS = [
  { val: "",          label: "Todos" },
  { val: "vigente",   label: "Vigentes" },
  { val: "vencendo",  label: "Vencendo" },
  { val: "licitando", label: "Em licitação" },
  { val: "concluido", label: "Concluídos" },
];

export default function Contratos() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const [filtroStatus, setFiltroStatus] = useState("");

  const { data: dash }    = useQuery({ queryKey: ["cont-dashboard"], queryFn: () => apiGet("/api/contratos/dashboard") as Promise<any> });
  const { data: lista }   = useQuery({ queryKey: ["cont-lista", filtroStatus], queryFn: () => apiGet("/api/contratos/lista", filtroStatus ? { status: filtroStatus } : {}) as Promise<any[]>, enabled: aba === "lista" });
  const { data: alertas } = useQuery({ queryKey: ["cont-alertas"], queryFn: () => apiGet("/api/contratos/alertas") as Promise<any>, enabled: aba === "alertas" });

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "lista",     label: "Lista de Contratos" },
    { id: "alertas",   label: "Alertas" },
  ];

  const nAlertas = (dash?.vencendo_30d ?? 0) + (dash?.em_licitacao ?? 0);

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui, sans-serif" }}>
      {/* Cabeçalho */}
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Contratos & Licitações</h1>
            <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>
              Lei 14.133/2021 · FMS Apuí/AM · Portal da Transparência
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {dash && (
              <div style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{BRL(dash.total_valor)}</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>valor total 2026</div>
              </div>
            )}
            <a href="https://www.comprasgovernamentais.gov.br" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", textDecoration: "none", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
              <ExternalLink size={12} /> ComprasGov
            </a>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 24px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{
              padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13,
              borderBottom: aba === a.id ? "2px solid #1d4ed8" : "2px solid transparent",
              color: aba === a.id ? "#1d4ed8" : "#6b7280",
              fontWeight: aba === a.id ? 700 : 400, marginBottom: -2,
            }}>
              {a.label}
              {a.id === "alertas" && nAlertas > 0 && (
                <span style={{ marginLeft: 5, background: "#d97706", color: "#fff", borderRadius: 10, fontSize: 9, fontWeight: 900, padding: "1px 5px" }}>{nAlertas}</span>
              )}
            </button>
          ))}
        </div>

        {/* Filtros status */}
        {aba === "lista" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
            <Filter size={13} color="#6b7280" />
            {FILTROS_STATUS.map(f => (
              <button key={f.val} onClick={() => setFiltroStatus(f.val)} style={{
                padding: "5px 12px", border: `1px solid ${filtroStatus === f.val ? "#1d4ed8" : "#d1d5db"}`,
                borderRadius: 20, fontSize: 12, cursor: "pointer",
                background: filtroStatus === f.val ? "#eff6ff" : "#fff",
                color: filtroStatus === f.val ? "#1d4ed8" : "#6b7280",
                fontWeight: filtroStatus === f.val ? 700 : 400,
              }}>{f.label}</button>
            ))}
          </div>
        )}

        {aba === "dashboard" && !dash && <NaoDisponivelBanner nota="Integração com sistema externo ainda não configurada no Railway. Nenhum valor foi inventado." />}
        {aba === "dashboard" && <AbaDashboard dash={dash} />}
        {aba === "lista"     && <AbaLista items={lista} />}
        {aba === "alertas"   && <AbaAlertas alertas={alertas} />}
      </div>
    </div>
  );
}
