import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import {
  Activity, Users, CheckCircle, AlertTriangle, AlertCircle,
  RefreshCw, Clock, Stethoscope, UserCheck, Home, Syringe,
} from "lucide-react";

// ── Cores ────────────────────────────────────────────────────────────────────
const BRAND = "#1e3a5f";
const OK    = "#16a34a";
const WARN  = "#d97706";
const CRIT  = "#dc2626";
const BLUE  = "#2563eb";

const COR_STATUS = (s: string) => s === "normal" ? OK : s === "atencao" ? WARN : CRIT;
const BG_STATUS  = (s: string) => s === "normal" ? "#f0fdf4" : s === "atencao" ? "#fffbeb" : "#fff7f7";

const CBO_ICON: Record<string, JSX.Element> = {
  "Médico de Família":           <Stethoscope size={14} />,
  "Enfermeiro":                  <UserCheck size={14} />,
  "Técnico de Enfermagem":       <Activity size={14} />,
  "Cirurgião-Dentista":          <Stethoscope size={14} />,
  "Agente Comunitário de Saúde": <Home size={14} />,
  "Vacina":                      <Syringe size={14} />,
};

// ── Componentes básicos ────────────────────────────────────────────────────
function Pulse({ ativo }: { ativo: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: ativo ? OK : CRIT,
        boxShadow: ativo ? `0 0 0 3px ${OK}44` : "none",
        animation: ativo ? "pulse 1.5s infinite" : "none",
      }} />
      <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 0 ${OK}44} 50%{box-shadow:0 0 0 6px ${OK}00} }`}</style>
    </span>
  );
}

function KPI({ label, value, sub, color = BRAND, icon }: { label: string; value: string | number; sub?: string; color?: string; icon?: JSX.Element }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${color}22`, borderTop: `3px solid ${color}`, borderRadius: 10, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af" }}>{sub}</div>}
    </div>
  );
}

function BarraProgresso({ pct, status }: { pct: number; status: string }) {
  const cor = COR_STATUS(status);
  return (
    <div style={{ background: "#f3f4f6", borderRadius: 6, height: 8, overflow: "hidden", position: "relative" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: cor, borderRadius: 6, transition: "width 0.5s" }} />
    </div>
  );
}

// ── Abas ──────────────────────────────────────────────────────────────────────
type Aba = "geral" | "equipes" | "profissionais" | "atendimentos" | "hora";

export default function MonitoramentoRtApui() {
  const [aba, setAba] = useState<Aba>("geral");
  const [tick, setTick] = useState(0);
  const [segundos, setSegundos] = useState(60);
  const [horaAgora, setHoraAgora] = useState(new Date().toLocaleTimeString("pt-BR"));

  // Atualiza relógio e conta regressiva
  useEffect(() => {
    const id = setInterval(() => {
      setSegundos(s => {
        if (s <= 1) { setTick(t => t + 1); return 60; }
        return s - 1;
      });
      setHoraAgora(new Date().toLocaleTimeString("pt-BR"));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const opts = { refetchInterval: 60_000, staleTime: 55_000 };

  const { data: dash,   isFetching: fDash }   = useQuery({ queryKey: ["rt-dash",   tick], queryFn: () => apiGet("/api/monitoramento-rt/dashboard"),     ...opts });
  const { data: eqs,    isFetching: fEqs }    = useQuery({ queryKey: ["rt-eqs",    tick], queryFn: () => apiGet("/api/monitoramento-rt/equipes"),        ...opts, enabled: aba === "equipes" });
  const { data: profs,  isFetching: fProfs }  = useQuery({ queryKey: ["rt-profs",  tick], queryFn: () => apiGet("/api/monitoramento-rt/profissionais"),  ...opts, enabled: aba === "profissionais" });
  const { data: atends, isFetching: fAtends } = useQuery({ queryKey: ["rt-atends", tick], queryFn: () => apiGet("/api/monitoramento-rt/atendimentos"),   ...opts, enabled: aba === "atendimentos" });
  const { data: horas,  isFetching: fHoras }  = useQuery({ queryKey: ["rt-horas",  tick], queryFn: () => apiGet("/api/monitoramento-rt/producao-hora"),  ...opts, enabled: aba === "hora" });

  const d   = dash   as any;
  const e   = eqs    as any;
  const p   = profs  as any;
  const at  = atends as any;
  const hr  = horas  as any;

  const carregando = fDash || fEqs || fProfs || fAtends || fHoras;

  const ABAS: { key: Aba; label: string; icon: JSX.Element }[] = [
    { key: "geral",          label: "Geral",            icon: <Activity size={14}/> },
    { key: "equipes",        label: "Equipes",          icon: <Users size={14}/> },
    { key: "profissionais",  label: "Profissionais",    icon: <UserCheck size={14}/> },
    { key: "atendimentos",   label: "Atendimentos",     icon: <CheckCircle size={14}/> },
    { key: "hora",           label: "Produção / Hora",  icon: <Clock size={14}/> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 20 }}>
      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: BRAND, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={22} color="#fff" />
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Monitoramento em Tempo Real</span>
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>FMS Apuí/AM · 9 Equipes · {d?.total_profissionais ?? 38} Profissionais</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px" }}>
            <Pulse ativo={!carregando} />
            <span style={{ fontSize: 12, fontWeight: 700, color: BRAND }}>{horaAgora}</span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>· atualiza em {segundos}s</span>
          </div>
          <button onClick={() => { setTick(t => t + 1); setSegundos(60); }} style={{ display: "flex", alignItems: "center", gap: 5, background: BLUE, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            <RefreshCw size={13} className={carregando ? "animate-spin" : ""} /> Atualizar
          </button>
        </div>
      </div>

      {/* ── Abas ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {ABAS.map(a => (
          <button key={a.key} onClick={() => setAba(a.key)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
            borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all .15s",
            background: aba === a.key ? BRAND : "#fff",
            color: aba === a.key ? "#fff" : "#475569",
            boxShadow: aba === a.key ? "none" : "0 1px 3px #00000011",
          }}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      {/* ── ABA: GERAL ────────────────────────────────────────────────── */}
      {aba === "geral" && d && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
            <KPI label="Atendimentos Hoje"    value={d.total_atendimentos_hoje.toLocaleString("pt-BR")} sub={`meta: ${d.meta_dia}`} color={COR_STATUS(d.status_geral)} icon={<CheckCircle size={12}/>} />
            <KPI label="% da Meta do Dia"     value={`${d.pct_meta}%`}  sub={`${d.profissionais_com_producao} prof. com produção`} color={COR_STATUS(d.status_geral)} icon={<Activity size={12}/>} />
            <KPI label="Equipes Ativas"       value={d.total_equipes_ativas} sub="9 equipes ESF" color={BLUE} icon={<Users size={12}/>} />
            <KPI label="Profissionais"        value={d.total_profissionais}  sub="médicos, enf., ACS, téc." color={BRAND} icon={<UserCheck size={12}/>} />
          </div>

          {/* Alertas */}
          {d.alertas?.length > 0 && (
            <div style={{ background: "#fff7f7", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontWeight: 700, color: CRIT, fontSize: 13 }}>
                <AlertCircle size={16} /> {d.alertas.length} alerta{d.alertas.length > 1 ? "s" : ""} de produção
              </div>
              {d.alertas.map((a: string, i: number) => (
                <div key={i} style={{ fontSize: 12, color: CRIT, padding: "3px 0" }}>⚠ {a}</div>
              ))}
            </div>
          )}

          {/* Equipes — mini grid */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: BRAND, marginBottom: 10 }}>Status das Equipes</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 10 }}>
              {d.equipes?.map((eq: any) => (
                <div key={eq.equipe} style={{ background: BG_STATUS(eq.status), border: `1px solid ${COR_STATUS(eq.status)}33`, borderLeft: `4px solid ${COR_STATUS(eq.status)}`, borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: BRAND }}>{eq.equipe}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>{eq.ubs}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, background: COR_STATUS(eq.status) + "22", color: COR_STATUS(eq.status), padding: "2px 8px", borderRadius: 10 }}>
                      {eq.status === "normal" ? "NORMAL" : eq.status === "atencao" ? "ATENÇÃO" : "CRÍTICO"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#374151", marginBottom: 5 }}>
                    <span><b style={{ color: COR_STATUS(eq.status) }}>{eq.total_atendimentos}</b> atendimentos</span>
                    <span style={{ color: "#6b7280" }}>{eq.profissionais_ativos} prof.</span>
                  </div>
                  <BarraProgresso pct={0} status={eq.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Produção por tipo */}
          {d.producao_por_tipo?.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: BRAND, marginBottom: 12 }}>Top 10 — Tipos de Atendimento Hoje</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={d.producao_por_tipo} layout="vertical" margin={{ left: 10, right: 40 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="tipo" tick={{ fontSize: 10 }} width={180} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="total" name="Atendimentos" radius={[0,4,4,0]}>
                    {d.producao_por_tipo.map((_: any, i: number) => (
                      <Cell key={i} fill={i === 0 ? BLUE : i < 3 ? OK : "#94a3b8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── ABA: EQUIPES ─────────────────────────────────────────────── */}
      {aba === "equipes" && e?.equipes && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {e.equipes.map((eq: any) => (
            <div key={eq.nome} style={{ background: "#fff", border: `1px solid ${COR_STATUS(eq.status)}33`, borderLeft: `5px solid ${COR_STATUS(eq.status)}`, borderRadius: 10, padding: 18 }}>
              {/* Cabeçalho equipe */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: BRAND }}>Equipe {eq.nome}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{eq.ubs} · {eq.tipo} · INE: {eq.ine}</div>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: COR_STATUS(eq.status) }}>{eq.total_atendimentos}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>atendimentos</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: COR_STATUS(eq.status) + "22", color: COR_STATUS(eq.status), padding: "4px 10px", borderRadius: 12 }}>
                    {eq.status === "normal" ? "NORMAL" : eq.status === "atencao" ? "ATENÇÃO" : "CRÍTICO"}
                  </span>
                </div>
              </div>

              {/* Tipos de atendimento */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {Object.entries(eq.tipos_atendimento as Record<string, number>).map(([tipo, qtd]) => (
                  <div key={tipo} style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: BLUE }}>{qtd as number}</div>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>{tipo.replace(/_/g," ")}</div>
                  </div>
                ))}
              </div>

              {/* Profissionais da equipe */}
              <div style={{ border: "1px solid #f3f4f6", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: "#374151", fontWeight: 700 }}>Profissional</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", color: "#374151", fontWeight: 700 }}>CBO</th>
                      <th style={{ padding: "8px 10px", textAlign: "right", color: "#374151", fontWeight: 700 }}>Atend.</th>
                      <th style={{ padding: "8px 10px", textAlign: "right", color: "#374151", fontWeight: 700 }}>Meta</th>
                      <th style={{ padding: "8px 10px", textAlign: "right", color: "#374151", fontWeight: 700 }}>% Meta</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", color: "#374151", fontWeight: 700 }}>Status</th>
                      <th style={{ padding: "8px 10px", textAlign: "center", color: "#374151", fontWeight: 700 }}>Último reg.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eq.profissionais?.map((pr: any, i: number) => (
                      <tr key={pr.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                          <div>{pr.nome}</div>
                          <div style={{ fontSize: 10, color: "#9ca3af" }}>CNS: {pr.cns}</div>
                        </td>
                        <td style={{ padding: "10px 10px", color: "#6b7280" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            {CBO_ICON[pr.cbo] ?? <Activity size={14}/>} {pr.cbo}
                          </div>
                        </td>
                        <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 800, color: COR_STATUS(pr.status) }}>{pr.total_atendimentos}</td>
                        <td style={{ padding: "10px 10px", textAlign: "right", color: "#6b7280" }}>{pr.meta_dia}</td>
                        <td style={{ padding: "10px 10px", textAlign: "right" }}>
                          <span style={{ fontWeight: 700, color: COR_STATUS(pr.status) }}>{pr.pct_meta}%</span>
                        </td>
                        <td style={{ padding: "10px 10px", textAlign: "center" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, background: COR_STATUS(pr.status)+"22", color: COR_STATUS(pr.status), padding: "2px 8px", borderRadius: 8 }}>
                            {pr.status === "normal" ? "OK" : pr.status === "atencao" ? "ATENÇÃO" : "CRÍTICO"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 10px", textAlign: "center", color: "#6b7280", fontSize: 11 }}>{pr.ultimo_registro}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ABA: PROFISSIONAIS ───────────────────────────────────────── */}
      {aba === "profissionais" && p?.profissionais && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: BRAND }}>Todos os Profissionais — {p.total} cadastrados</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Ordenado por % da meta (menor primeiro)</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 900 }}>
              <thead>
                <tr style={{ background: BRAND, color: "#fff" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Profissional</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>CBO</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Equipe</th>
                  <th style={{ padding: "10px 10px", textAlign: "right" }}>Atend.</th>
                  <th style={{ padding: "10px 10px", textAlign: "right" }}>Meta/dia</th>
                  <th style={{ padding: "10px 10px", textAlign: "right", minWidth: 120 }}>% Meta</th>
                  <th style={{ padding: "10px 12px", textAlign: "center" }}>Status</th>
                  <th style={{ padding: "10px 10px", textAlign: "center" }}>Último</th>
                </tr>
              </thead>
              <tbody>
                {p.profissionais.map((pr: any, i: number) => (
                  <tr key={pr.id} style={{ borderTop: "1px solid #f3f4f6", background: pr.status === "critico" ? "#fff7f7" : pr.status === "atencao" ? "#fffbeb" : i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontWeight: 600 }}>{pr.nome}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>CNS: {pr.cns}</div>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#6b7280" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>{CBO_ICON[pr.cbo] ?? <Activity size={12}/>} {pr.cbo}</div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600, color: BLUE, fontSize: 11 }}>{pr.equipe}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>{pr.ubs}</div>
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 800, fontSize: 15, color: COR_STATUS(pr.status) }}>{pr.total_atendimentos}</td>
                    <td style={{ padding: "10px 10px", textAlign: "right", color: "#6b7280" }}>{pr.meta_dia}</td>
                    <td style={{ padding: "10px 10px", textAlign: "right" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end" }}>
                        <span style={{ fontWeight: 700, color: COR_STATUS(pr.status) }}>{pr.pct_meta}%</span>
                        <div style={{ width: 80, background: "#f3f4f6", borderRadius: 4, height: 5 }}>
                          <div style={{ width: `${Math.min(pr.pct_meta, 100)}%`, height: "100%", background: COR_STATUS(pr.status), borderRadius: 4 }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, background: COR_STATUS(pr.status)+"22", color: COR_STATUS(pr.status), padding: "2px 8px", borderRadius: 8 }}>
                        {pr.status === "normal" ? "OK" : pr.status === "atencao" ? "ATENÇÃO" : "CRÍTICO"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "center", color: "#6b7280", fontSize: 11 }}>{pr.ultimo_registro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ABA: ATENDIMENTOS RECENTES ───────────────────────────────── */}
      {aba === "atendimentos" && at?.atendimentos && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px" }}>
            <Pulse ativo={true} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: BRAND }}>Últimos 30 minutos — {at.total_30min} atendimentos registrados</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Atualizado em {new Date(at.timestamp).toLocaleTimeString("pt-BR")}</div>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: BRAND, color: "#fff" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Horário</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Profissional</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Equipe / UBS</th>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Tipo de Atendimento</th>
                  <th style={{ padding: "10px 10px", textAlign: "right" }}>Duração</th>
                  <th style={{ padding: "10px 10px", textAlign: "right" }}>Min. atrás</th>
                </tr>
              </thead>
              <tbody>
                {at.atendimentos.map((a: any, i: number) => (
                  <tr key={a.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: BLUE }}>{a.horario}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600 }}>{a.profissional}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>{a.cbo}</div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600, color: BRAND, fontSize: 11 }}>{a.equipe}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>{a.ubs}</div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: "#eff6ff", color: BLUE, fontWeight: 600, fontSize: 11, padding: "2px 8px", borderRadius: 6 }}>{a.tipo_atendimento}</span>
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "right", color: "#6b7280" }}>{a.duracao_min} min</td>
                    <td style={{ padding: "10px 10px", textAlign: "right" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: a.minutos_atras < 10 ? OK : "#6b7280" }}>{a.minutos_atras} min</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ABA: PRODUÇÃO / HORA ─────────────────────────────────────── */}
      {aba === "hora" && hr?.horas && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: BRAND, marginBottom: 4 }}>Produção por Hora — {hr.data}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 20 }}>Atendimentos registrados por hora em todas as equipes</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hr.horas} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [v, "Atendimentos"]} />
              <Bar dataKey="atendimentos" name="Atendimentos" radius={[4,4,0,0]}>
                {hr.horas.map((_: any, i: number) => (
                  <Cell key={i} fill={i === hr.horas.length - 1 ? BLUE : "#94a3b8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 16px" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: BLUE }}>{hr.horas.reduce((s: number, h: any) => s + h.atendimentos, 0)}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Total até agora</div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 16px" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: OK }}>{Math.round(hr.horas.reduce((s: number, h: any) => s + h.atendimentos, 0) / Math.max(hr.horas.length, 1))}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Média por hora</div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 16px" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: WARN }}>{Math.max(...hr.horas.map((h: any) => h.atendimentos))}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Pico do dia</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
