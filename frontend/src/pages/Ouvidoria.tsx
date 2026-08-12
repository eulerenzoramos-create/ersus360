import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell,
} from "recharts";
import {
  MessageSquare, AlertTriangle, CheckCircle, Clock,
  ChevronDown, ChevronRight, Filter, ExternalLink,
  Phone, Mail, Monitor, User, Search,
} from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// ── Helpers ───────────────────────────────────────────────────────────────────

const COR_SEM = (s: string) =>
  s === "vencido" ? "#dc2626" : s === "urgente" ? "#ea580c" : s === "atencao" ? "#d97706" : "#16a34a";

const BG_SEM  = (s: string) =>
  s === "vencido" ? "#fff7f7" : s === "urgente" ? "#fff4ee" : s === "atencao" ? "#fffbeb" : "#f0fdf4";

const LABEL_SEM = (s: string) =>
  s === "vencido" ? "Prazo vencido" : s === "urgente" ? "≤ 5 dias" : s === "atencao" ? "≤ 15 dias" : "Em dia";

const COR_PRIOR: Record<string, string> = {
  critica: "#dc2626", alta: "#d97706", normal: "#16a34a",
};
const BG_PRIOR: Record<string, string> = {
  critica: "#fff7f7", alta: "#fffbeb", normal: "#f0fdf4",
};

const COR_TIPO: Record<string, string> = {
  "Reclamação":          "#dc2626",
  "Denúncia":            "#7c3aed",
  "Sugestão":            "#0891b2",
  "Elogio":              "#16a34a",
  "Solicitação":         "#d97706",
  "Acesso à Informação": "#374151",
};

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };

const CANAL_ICON: Record<string, React.ReactNode> = {
  "Presencial":   <User size={11} />,
  "Fala.BR":      <Monitor size={11} />,
  "Telefone 136": <Phone size={11} />,
  "E-mail":       <Mail size={11} />,
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, cor, icon }: { label: string; value: string | number; sub?: string; cor: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}22`, borderTop: `3px solid ${cor}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
        <div style={{ background: `${cor}15`, borderRadius: 6, padding: 5 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: cor, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ── Badge semáforo ────────────────────────────────────────────────────────────
function BadgeSem({ sem, dias }: { sem: string; dias: number }) {
  const cor = COR_SEM(sem);
  return (
    <span style={{ background: BG_SEM(sem), color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, whiteSpace: "nowrap" }}>
      {sem === "vencido" ? `${Math.abs(dias)}d vencido` : LABEL_SEM(sem)}
    </span>
  );
}

// ── Aba: Dashboard ────────────────────────────────────────────────────────────
function AbaDashboard({ dash }: { dash: any }) {
  if (!dash) return <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Carregando…</div>;

  return (
    <div>
      {/* Aviso legal */}
      <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 18, fontSize: 12, color: "#92400e" }}>
        <strong>Lei 13.460/2017 · Decreto 9.492/2018</strong> — Prazo legal para resposta: <strong>30 dias</strong> (prorrogável por mais 30 mediante justificativa ao requerente). Integração com plataforma <strong>Fala.BR / e-OUV</strong>.
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 22 }}>
        <KpiCard label="Total manifestações" value={dash.total} sub={dash.competencia} cor="#1d4ed8" icon={<MessageSquare size={14} color="#1d4ed8" />} />
        <KpiCard label="Concluídas" value={dash.concluidas} sub={`${dash.pct_concluidas}% do total`} cor="#16a34a" icon={<CheckCircle size={14} color="#16a34a" />} />
        <KpiCard label="Em andamento" value={dash.em_andamento} sub="aguardando resposta" cor="#d97706" icon={<Clock size={14} color="#d97706" />} />
        <KpiCard label="Prazo vencido" value={dash.prazo_vencido} sub="AÇÃO IMEDIATA" cor="#dc2626" icon={<AlertTriangle size={14} color="#dc2626" />} />
        <KpiCard label="Urgente (≤5 dias)" value={dash.prazo_urgente} sub="atenção prioritária" cor="#ea580c" icon={<AlertTriangle size={14} color="#ea580c" />} />
        <KpiCard label="Prioridade crítica" value={dash.criticas} sub="denúncias e urgências" cor="#7c3aed" icon={<AlertTriangle size={14} color="#7c3aed" />} />
      </div>

      {/* Tempo médio + % resolução */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 18, marginBottom: 22 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Indicadores de qualidade</div>
          {[
            { label: "Tempo médio de resposta", val: `${dash.tempo_medio_dias} dias`, meta: "≤ 20 dias", ok: true },
            { label: "Taxa de resolução", val: `${dash.pct_concluidas}%`, meta: "meta ≥ 80%", ok: dash.pct_concluidas >= 80 },
            { label: "Manifestações vencidas", val: dash.prazo_vencido, meta: "meta = 0", ok: dash.prazo_vencido === 0 },
          ].map(q => (
            <div key={q.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
              <div>
                <div style={{ fontSize: 12 }}>{q.label}</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{q.meta}</div>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: q.ok ? "#16a34a" : "#dc2626" }}>{q.val}</span>
            </div>
          ))}
        </div>

        {/* Histórico */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Evolução mensal (recebidas × concluídas)</div>
          <div style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.historico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TT} />
                <Line type="monotone" dataKey="recebidas"  stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }} name="Recebidas" />
                <Line type="monotone" dataKey="concluidas" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} name="Concluídas" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Distribuição */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
        {/* Por tipo */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Por tipo</div>
          <div style={{ height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.por_tipo} layout="vertical" barSize={12}>
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="tipo" tick={{ fontSize: 9 }} width={90} />
                <Tooltip contentStyle={TT} />
                <Bar dataKey="n" name="Qtd" radius={[0,4,4,0]}>
                  {dash.por_tipo.map((t: any, i: number) => (
                    <Cell key={i} fill={COR_TIPO[t.tipo] ?? "#6b7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Por área */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Por área de saúde</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dash.por_area.map((a: any) => (
              <div key={a.area} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, minWidth: 120 }}>{a.area}</span>
                <div style={{ flex: 1, height: 10, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${(a.n / dash.total) * 100}%`, height: "100%", background: "#1d4ed8", borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", minWidth: 18, textAlign: "right" }}>{a.n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Por canal */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Por canal de entrada</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dash.por_canal.map((c: any) => (
              <div key={c.canal} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 130, fontSize: 11 }}>
                  <span style={{ color: "#6b7280" }}>{CANAL_ICON[c.canal] ?? <MessageSquare size={11} />}</span>
                  {c.canal}
                </div>
                <div style={{ flex: 1, height: 10, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${(c.n / dash.total) * 100}%`, height: "100%", background: "#7c3aed", borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", minWidth: 18, textAlign: "right" }}>{c.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Aba: Manifestações ────────────────────────────────────────────────────────
function AbaManifestacoes({ items }: { items: any[] | undefined }) {
  const [abertas, setAbertas] = useState<Set<number>>(new Set());
  const [busca, setBusca] = useState("");
  if (!items) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;

  const toggle = (id: number) => setAbertas(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });

  const filtradas = busca
    ? items.filter(m => m.assunto.toLowerCase().includes(busca.toLowerCase()) || m.protocolo.toLowerCase().includes(busca.toLowerCase()))
    : items;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            placeholder="Buscar por protocolo ou assunto…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: "100%", paddingLeft: 32, padding: "7px 12px 7px 32px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>{filtradas.length} manifestações</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtradas.map((m) => {
          const isOpen = abertas.has(m.id);
          const corTipo = COR_TIPO[m.tipo] ?? "#6b7280";
          const corPrior = COR_PRIOR[m.prioridade];
          return (
            <div key={m.id} style={{ border: `1px solid ${COR_SEM(m.semaforo)}22`, borderLeft: `4px solid ${COR_SEM(m.semaforo)}`, borderRadius: 8, background: "#fff", overflow: "hidden" }}>
              <div onClick={() => toggle(m.id)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", cursor: "pointer" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4, alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#6b7280" }}>{m.protocolo}</span>
                    <span style={{ background: `${corTipo}15`, color: corTipo, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4 }}>{m.tipo}</span>
                    <span style={{ background: BG_PRIOR[m.prioridade], color: corPrior, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4, textTransform: "uppercase" }}>{m.prioridade}</span>
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>{m.area}</span>
                  </div>
                  <div style={{ fontSize: 13 }}>{m.assunto}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                    {CANAL_ICON[m.canal]} {m.canal} · Cidadão: {m.cidadao} · Aberto: {m.criado}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <BadgeSem sem={m.semaforo} dias={m.dias_restantes} />
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: m.status === "concluida" ? "#f0fdf4" : "#fffbeb",
                    color: m.status === "concluida" ? "#16a34a" : "#d97706",
                    padding: "1px 7px", borderRadius: 4,
                  }}>
                    {m.status === "concluida" ? "✓ Concluída" : "⏳ Em andamento"}
                  </span>
                </div>
                {isOpen ? <ChevronDown size={13} color="#9ca3af" /> : <ChevronRight size={13} color="#9ca3af" />}
              </div>

              {isOpen && (
                <div style={{ padding: "12px 14px", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#374151" }}>Detalhes</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 12 }}>
                    {[
                      { label: "Protocolo", val: m.protocolo },
                      { label: "Data abertura", val: m.criado },
                      { label: "Canal", val: m.canal },
                      { label: "Dias restantes", val: m.dias_restantes < 0 ? `${Math.abs(m.dias_restantes)} dias vencido` : `${m.dias_restantes} dias` },
                    ].map(d => (
                      <div key={d.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>{d.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{d.val}</div>
                      </div>
                    ))}
                  </div>
                  {m.resposta ? (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", marginBottom: 4 }}>✓ Resposta enviada ao cidadão</div>
                      <div style={{ fontSize: 12, color: "#374151" }}>{m.resposta}</div>
                    </div>
                  ) : (
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#92400e" }}>Aguardando resposta da área responsável</span>
                      <button style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>
                        Registrar resposta
                      </button>
                    </div>
                  )}
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
  if (!alertas) return <NaoDisponivelBanner nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />;
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#dc2626", margin: "0 0 4px" }}>Central de Alertas</h2>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Manifestações críticas e com prazo vencido ou iminente</p>
      </div>

      {alertas.criticos?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={16} color="#dc2626" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#dc2626" }}>Ação imediata — {alertas.criticos.length} manifestações</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {alertas.criticos.map((m: any) => (
              <div key={m.id} style={{ background: "#fff7f7", border: "1px solid #fca5a5", borderLeft: "4px solid #dc2626", borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{m.protocolo} · {m.tipo} · {m.area}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#7f1d1d", marginTop: 2 }}>{m.assunto}</div>
                  </div>
                  <BadgeSem sem={m.semaforo} dias={m.dias_restantes} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alertas.urgentes?.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Clock size={16} color="#d97706" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#d97706" }}>Urgente (≤ 5 dias) — {alertas.urgentes.length} manifestações</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {alertas.urgentes.map((m: any) => (
              <div key={m.id} style={{ background: "#fffbeb", border: "1px solid #fde68a", borderLeft: "4px solid #d97706", borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{m.protocolo} · {m.tipo} · {m.area}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#78350f", marginTop: 2 }}>{m.assunto}</div>
                  </div>
                  <BadgeSem sem={m.semaforo} dias={m.dias_restantes} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alertas.criticos?.length === 0 && alertas.urgentes?.length === 0 && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <CheckCircle size={40} color="#16a34a" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: "#16a34a" }}>Nenhum alerta ativo!</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Todas as manifestações estão dentro do prazo.</div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

type Aba = "dashboard" | "manifestacoes" | "alertas";

const FILTROS_STATUS = [
  { val: "",            label: "Todas" },
  { val: "em_andamento",label: "Em andamento" },
  { val: "concluida",   label: "Concluídas" },
];

export default function Ouvidoria() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const [filtroStatus, setFiltroStatus] = useState("");

  const { data: dash }       = useQuery({ queryKey: ["ouv-dashboard"], queryFn: () => apiGet("/api/ouvidoria/dashboard") as Promise<any> });
  const { data: manif }      = useQuery({ queryKey: ["ouv-manif", filtroStatus], queryFn: () => apiGet("/api/ouvidoria/manifestacoes", filtroStatus ? { status: filtroStatus } : {}) as Promise<any[]>, enabled: aba === "manifestacoes" });
  const { data: alertas }    = useQuery({ queryKey: ["ouv-alertas"], queryFn: () => apiGet("/api/ouvidoria/alertas") as Promise<any>, enabled: aba === "alertas" });

  const ABAS: { id: Aba; label: string }[] = [
    { id: "dashboard",      label: "Dashboard" },
    { id: "manifestacoes",  label: "Manifestações" },
    { id: "alertas",        label: "Alertas" },
  ];

  const nAlertas = (dash?.prazo_vencido ?? 0) + (dash?.prazo_urgente ?? 0);

  return (
    <div style={{ padding: "0 0 32px", fontFamily: "system-ui, sans-serif" }}>
      {/* Cabeçalho */}
      <div style={{ background: "linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", color: "#fff", padding: "20px 24px 16px", borderRadius: "0 0 16px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Ouvidoria SUS — Apuí/AM</h1>
            <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>Lei 13.460/2017 · Prazo 30 dias · Integração Fala.BR / e-OUV</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {nAlertas > 0 && (
              <div style={{ background: "#dc2626", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{nAlertas}</div>
                <div style={{ fontSize: 10, opacity: 0.9 }}>alertas ativos</div>
              </div>
            )}
            <a href="https://falabr.cgu.gov.br" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", textDecoration: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12 }}>
              <ExternalLink size={12} /> Fala.BR
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
              fontWeight: aba === a.id ? 700 : 400, marginBottom: -2, position: "relative",
            }}>
              {a.label}
              {a.id === "alertas" && nAlertas > 0 && (
                <span style={{ marginLeft: 5, background: "#dc2626", color: "#fff", borderRadius: 10, fontSize: 9, fontWeight: 900, padding: "1px 5px" }}>{nAlertas}</span>
              )}
            </button>
          ))}
        </div>

        {/* Filtros para manifestações */}
        {aba === "manifestacoes" && (
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
        {aba === "dashboard"     && <AbaDashboard dash={dash} />}
        {aba === "manifestacoes" && <AbaManifestacoes items={manif} />}
        {aba === "alertas"       && <AbaAlertas alertas={alertas} />}
      </div>
    </div>
  );
}
