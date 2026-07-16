import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Users, Stethoscope, BarChart2, Clock, Smile, UserCheck, RefreshCw, CalendarDays } from "lucide-react";
import { apiGet } from "../lib/api";

// ── helpers ──────────────────────────────────────────────────────────────────
const corStatus = (s: string) =>
  s === "critico" ? "#ef4444" : s === "atencao" ? "#f59e0b" : "#22c55e";

const badgeStatus = (s: string) => {
  const map: Record<string, { bg: string; txt: string; label: string }> = {
    critico: { bg: "#fef2f2", txt: "#b91c1c", label: "CRÍTICO" },
    atencao: { bg: "#fffbeb", txt: "#92400e", label: "ATENÇÃO" },
    normal:  { bg: "#f0fdf4", txt: "#166534", label: "NORMAL" },
    verde:   { bg: "#f0fdf4", txt: "#166534", label: "ATINGIDO" },
    amarelo: { bg: "#fffbeb", txt: "#92400e", label: "PARCIAL" },
    vermelho:{ bg: "#fef2f2", txt: "#b91c1c", label: "CRÍTICO" },
  };
  const c = map[s] ?? map.normal;
  return (
    <span style={{
      background: c.bg, color: c.txt, border: `1px solid ${c.txt}22`,
      borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
    }}>{c.label}</span>
  );
};

function Barra({ pct, s }: { pct: number; s: string }) {
  const cor = corStatus(s);
  return (
    <div style={{ background: "#e5e7eb", borderRadius: 4, height: 8, width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, background: cor, height: "100%", borderRadius: 4, transition: "width .4s" }} />
    </div>
  );
}

function Pulse() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%", background: "#22c55e",
        boxShadow: "0 0 0 0 #22c55e", animation: "pulse-dot 1.4s infinite",
        display: "inline-block",
      }} />
      <style>{`@keyframes pulse-dot{0%{box-shadow:0 0 0 0 #22c55e88}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}`}</style>
      AO VIVO
    </span>
  );
}

function KPI({ label, value, sub, cor }: { label: string; value: string | number; sub?: string; cor?: string }) {
  return (
    <div style={{
      background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10,
      padding: "14px 18px", borderTop: `3px solid ${cor ?? "#3b82f6"}`,
    }}>
      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "var(--fg)", lineHeight: 1.1, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const ABAS = [
  { key: "geral",        label: "Geral",             Icon: Activity },
  { key: "mensal",       label: "Mês/Dia",           Icon: CalendarDays },
  { key: "esf",          label: "ESF · Equipes",     Icon: Users },
  { key: "esb",          label: "ESB · Odontologia", Icon: Smile },
  { key: "emulti",       label: "eMulti",            Icon: UserCheck },
  { key: "profissionais",label: "Profissionais",     Icon: Stethoscope },
  { key: "atendimentos", label: "Atendimentos",      Icon: Clock },
  { key: "producao",     label: "Produção/Hora",     Icon: BarChart2 },
];

const REFETCH = 60_000;

// ── Componente: Saúde Bucal por Equipe ───────────────────────────────────────
function OdontoEquipes({ m, hoje }: { m: any; hoje: number }) {
  const equipes: any[] = m.indicadores_odonto_mes_por_equipe ?? [];
  const [equipeIdx, setEquipeIdx] = useState(0);
  const eq = equipes[equipeIdx];

  const diasFiltrados = (m.dias ?? []).filter((d: any) => d.is_util && !d.is_futuro && d.total != null);

  if (!eq) return null;

  return (
    <div>
      {/* Header */}
      <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <span style={{ fontWeight: 700, color: "#5b21b6", fontSize: 13 }}>🦷 Saúde Bucal — Indicadores {m.mes_ano}</span>
          <span style={{ color: "#7c3aed", fontSize: 12, marginLeft: 8 }}>{eq.ubs} · {m.dias_uteis_passados} dias registrados</span>
        </div>
        {/* Seletor de equipe */}
        <div style={{ display: "flex", gap: 4 }}>
          {equipes.map((e: any, i: number) => (
            <button key={i} onClick={() => setEquipeIdx(i)} style={{
              padding: "4px 12px", borderRadius: 6, border: "1px solid #ddd6fe", cursor: "pointer", fontSize: 11,
              background: equipeIdx === i ? "#7c3aed" : "var(--card-bg)",
              color: equipeIdx === i ? "#fff" : "#5b21b6",
              fontWeight: equipeIdx === i ? 700 : 400,
            }}>
              {e.equipe.split(" — ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de indicadores da equipe selecionada */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12, marginBottom: 18 }}>
        {eq.indicadores.map((ind: any) => (
          <div key={ind.ind} style={{
            background: "var(--card-bg)", border: "1px solid #ddd6fe", borderRadius: 10, padding: 14,
            borderLeft: `4px solid ${ind.status === "verde" ? "#22c55e" : ind.status === "amarelo" ? "#f59e0b" : "#ef4444"}`,
          }}>
            <div style={{ fontSize: 12, color: "#7c3aed", marginBottom: 6 }}>{ind.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "#8b5cf6" }}>
              {ind.resultado_pct}%
            </div>
            <div style={{ marginBottom: 6, marginTop: 4 }}>
              <Barra pct={ind.resultado_pct} s={ind.status === "verde" ? "normal" : ind.status === "amarelo" ? "atencao" : "critico"} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {badgeStatus(ind.status)}
              <span style={{ fontSize: 11, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>Meta: {ind.meta_pct}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela evolução diária da equipe selecionada */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Evolução Diária — {eq.equipe}</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: "var(--hover)" }}>
                <th style={{ padding: "6px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 700, whiteSpace: "nowrap" }}>Indicador / Meta</th>
                {diasFiltrados.map((d: any) => (
                  <th key={d.dia} style={{
                    padding: "6px 6px", textAlign: "center",
                    color: d.dia === hoje ? "#f59e0b" : "var(--muted)",
                    fontWeight: d.dia === hoje ? 800 : 600, whiteSpace: "nowrap",
                  }}>{d.data}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {eq.indicadores.map((ind: any) => (
                <tr key={ind.ind} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "6px 8px", fontWeight: 600, whiteSpace: "nowrap", color: "#5b21b6" }}>
                    {ind.label}
                    <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 4 }}>({ind.meta_pct}%)</span>
                  </td>
                  {diasFiltrados.map((d: any) => {
                    const eqDia = d.indicadores_odonto_por_equipe?.find((e: any) => e.equipe === eq.equipe);
                    const v = eqDia?.indicadores?.find((i: any) => i.ind === ind.ind);
                    if (!v) return <td key={d.dia} style={{ padding: "6px 6px", textAlign: "center" }}>—</td>;
                    const cor2 = v.status === "verde" ? "#166534" : v.status === "amarelo" ? "#92400e" : "#b91c1c";
                    const bg2  = v.status === "verde" ? "#f0fdf4" : v.status === "amarelo" ? "#fffbeb" : "#fef2f2";
                    return (
                      <td key={d.dia} style={{ padding: "4px 6px", textAlign: "center" }}>
                        <span style={{ background: bg2, color: cor2, borderRadius: 4, padding: "2px 5px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                          {v.resultado_pct}%
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function MonitoramentoRtApui() {
  const [aba, setAba]             = useState("geral");
  const [countdown, setCountdown] = useState(REFETCH / 1000);
  const [agora, setAgora]         = useState(new Date());
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const qDash   = useQuery({ queryKey: ["mrt-dash"],   queryFn: () => apiGet("/api/monitoramento-rt/dashboard"),        refetchInterval: REFETCH });
  const qMensal = useQuery({ queryKey: ["mrt-mensal"], queryFn: () => apiGet("/api/monitoramento-rt/producao-mensal"),  refetchInterval: REFETCH, enabled: aba === "mensal" });
  const qEsf    = useQuery({ queryKey: ["mrt-esf"],    queryFn: () => apiGet("/api/monitoramento-rt/equipes-esf"),     refetchInterval: REFETCH, enabled: aba === "esf" });
  const qEsb    = useQuery({ queryKey: ["mrt-esb"],    queryFn: () => apiGet("/api/monitoramento-rt/equipes-esb"),     refetchInterval: REFETCH, enabled: aba === "esb" });
  const qEmulti = useQuery({ queryKey: ["mrt-emulti"], queryFn: () => apiGet("/api/monitoramento-rt/equipe-emulti"),   refetchInterval: REFETCH, enabled: aba === "emulti" });
  const qProfs  = useQuery({ queryKey: ["mrt-profs"],  queryFn: () => apiGet("/api/monitoramento-rt/profissionais"),   refetchInterval: REFETCH, enabled: aba === "profissionais" });
  const qAtend  = useQuery({ queryKey: ["mrt-atend"],  queryFn: () => apiGet("/api/monitoramento-rt/atendimentos"),    refetchInterval: REFETCH, enabled: aba === "atendimentos" });
  const qHora   = useQuery({ queryKey: ["mrt-hora"],   queryFn: () => apiGet("/api/monitoramento-rt/producao-hora"),   refetchInterval: REFETCH, enabled: aba === "producao" });

  useEffect(() => {
    const iv = setInterval(() => {
      setAgora(new Date());
      setCountdown(c => (c <= 1 ? REFETCH / 1000 : c - 1));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const dash = qDash.data;

  // ── HEADER ──────────────────────────────────────────────────────────────────
  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--fg)" }}>
          ⚡ Monitor em Tempo Real · Apuí/AM
        </h2>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
          {agora.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} · {agora.toLocaleTimeString("pt-BR")}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>
          <RefreshCw size={11} style={{ verticalAlign: "middle" }} /> atualiza em {countdown}s
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}><Pulse /></span>
      </div>
    </div>
  );

  // ── TABS ─────────────────────────────────────────────────────────────────────
  const tabs = (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", borderBottom: "2px solid var(--border)", marginBottom: 18 }}>
      {ABAS.map(({ key, label, Icon }) => {
        const active = aba === key;
        return (
          <button key={key} onClick={() => setAba(key)} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "8px 14px",
            border: "none", cursor: "pointer", borderRadius: "8px 8px 0 0",
            fontSize: 13, fontWeight: active ? 700 : 500,
            background: active ? "var(--accent)" : "transparent",
            color: active ? "#fff" : "var(--muted)",
            borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
          }}>
            <Icon size={14} /> {label}
          </button>
        );
      })}
    </div>
  );

  // ── ABA GERAL ────────────────────────────────────────────────────────────────
  const abaGeral = !dash ? (
    <div style={{ color: "var(--muted)", padding: 24 }}>Carregando dashboard...</div>
  ) : (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 12, marginBottom: 20 }}>
        <KPI label="Atendimentos Hoje" value={dash.total_atendimentos_hoje} sub={`Meta: ${dash.meta_dia}`} cor={corStatus(dash.status_geral)} />
        <KPI label="% da Meta" value={`${dash.pct_meta}%`} sub="acumulado" cor={corStatus(dash.status_geral)} />
        <KPI label="Equipes ESF" value={dash.total_esf} sub="Saúde da Família" cor="#3b82f6" />
        <KPI label="Equipes ESB" value={dash.total_esb} sub="Saúde Bucal" cor="#8b5cf6" />
        <KPI label="eMulti" value={dash.total_emulti} sub="Multiprofissional" cor="#06b6d4" />
        <KPI label="Profissionais" value={dash.total_profissionais} sub={`${dash.profissionais_com_producao} ativos`} cor="#f59e0b" />
      </div>

      {dash.alertas?.length > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: "#b91c1c", marginBottom: 6, fontSize: 13 }}>⚠️ ALERTAS</div>
          {dash.alertas.map((a: string, i: number) => (
            <div key={i} style={{ fontSize: 13, color: "#7f1d1d", marginBottom: 3 }}>• {a}</div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Status por Equipe</div>
          {dash.equipes?.map((eq: any) => (
            <div key={eq.equipe} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: corStatus(eq.status), display: "inline-block" }} />
                <span style={{ fontSize: 12 }}>{eq.equipe}</span>
                <span style={{ fontSize: 10, color: "var(--muted)", background: "var(--hover)", borderRadius: 4, padding: "0 5px" }}>{eq.tipo}</span>
              </div>
              <span style={{ fontSize: 12, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{eq.total} atend.</span>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Top Tipos de Atendimento</div>
          {dash.producao_por_tipo?.slice(0, 10).map((tp: any) => (
            <div key={tp.tipo} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12 }}>{tp.tipo}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>{tp.total}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── ABA ESF ──────────────────────────────────────────────────────────────────
  const abaEsf = !qEsf.data?.equipes ? (
    <div style={{ color: "var(--muted)", padding: 24 }}>Carregando equipes ESF...</div>
  ) : (
    <div>
      {qEsf.data.equipes.map((eq: any) => (
        <div key={eq.nome} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 14, borderLeft: `4px solid ${corStatus(eq.status)}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", cursor: "pointer" }}
            onClick={() => setExpandedTeam(expandedTeam === eq.nome ? null : eq.nome)}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>ESF · {eq.nome}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{eq.ubs} · INE {eq.ine}</div>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: corStatus(eq.status), fontVariantNumeric: "tabular-nums" }}>{eq.total_atendimentos}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>atend. · {eq.pct_meta}% meta</div>
              </div>
              {badgeStatus(eq.status)}
              <span style={{ fontSize: 16, color: "var(--muted)" }}>{expandedTeam === eq.nome ? "▲" : "▼"}</span>
            </div>
          </div>

          {expandedTeam === eq.nome && (
            <div style={{ padding: "0 16px 16px" }}>
              {/* Novo Financiamento APS */}
              <div style={{ background: "var(--hover)", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: "var(--fg)", textTransform: "uppercase" }}>Indicadores Novo Financiamento APS</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(215px,1fr))", gap: 8 }}>
                  {eq.indicadores_previne?.map((ind: any) => (
                    <div key={ind.ind} style={{ background: "var(--card-bg)", borderRadius: 6, padding: 8, border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>{ind.label}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>{ind.resultado_pct}%</span>
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>Meta {ind.meta_pct}%</span>
                      </div>
                      <Barra pct={ind.resultado_pct} s={ind.status === "verde" ? "normal" : ind.status === "amarelo" ? "atencao" : "critico"} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Profissionais */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "var(--hover)" }}>
                      {["Profissional","CBO","CNS","Atend.","Meta","% Meta","Status","Últ. reg."].map(h => (
                        <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontWeight: 700, color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {eq.profissionais?.map((p: any) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "6px 8px", fontWeight: 600, whiteSpace: "nowrap" }}>{p.nome}</td>
                        <td style={{ padding: "6px 8px", color: "var(--muted)", fontSize: 11 }}>{p.cbo}</td>
                        <td style={{ padding: "6px 8px", color: "var(--muted)", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{p.cns}</td>
                        <td style={{ padding: "6px 8px", fontWeight: 700, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{p.total_atendimentos}</td>
                        <td style={{ padding: "6px 8px", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{p.meta_dia}</td>
                        <td style={{ padding: "6px 8px", minWidth: 90 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Barra pct={p.pct_meta} s={p.status} />
                            <span style={{ fontSize: 11, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{p.pct_meta}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "6px 8px" }}>{badgeStatus(p.status)}</td>
                        <td style={{ padding: "6px 8px", textAlign: "center", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{p.ultimo_registro}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Produção detalhada */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 6, color: "var(--muted)", textTransform: "uppercase" }}>Produção Detalhada por Profissional</div>
                {eq.profissionais?.map((p: any) => (
                  <div key={p.id} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>{p.nome} ({p.cbo})</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {p.producao_detalhada?.map((pr: any) => (
                        <div key={pr.tipo} style={{
                          background: "var(--hover)", borderRadius: 5, padding: "3px 8px", fontSize: 11,
                          border: `1px solid ${pr.pct >= 75 ? "#bbf7d0" : pr.pct >= 50 ? "#fef9c3" : "#fecaca"}`,
                        }}>
                          <span style={{ color: "var(--muted)" }}>{pr.label}: </span>
                          <span style={{ fontWeight: 700, color: corStatus(pr.pct >= 75 ? "normal" : pr.pct >= 50 ? "atencao" : "critico") }}>
                            {pr.realizado}/{pr.meta_dia}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // ── ABA ESB ──────────────────────────────────────────────────────────────────
  const abaEsb = !qEsb.data?.equipes ? (
    <div style={{ color: "var(--muted)", padding: 24 }}>Carregando equipes ESB...</div>
  ) : (
    <div>
      <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 8, padding: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: "#5b21b6", fontWeight: 700 }}>🦷 Saúde Bucal — ESB I, II e III + CEO Apuí</span>
      </div>
      {qEsb.data.equipes.map((eq: any) => (
        <div key={eq.nome} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 14, borderLeft: "4px solid #8b5cf6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", cursor: "pointer" }}
            onClick={() => setExpandedTeam(expandedTeam === eq.nome ? null : eq.nome)}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>🦷 {eq.nome} — {eq.ubs}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>INE {eq.ine} · {eq.profissionais?.length} profissionais</div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#8b5cf6", fontVariantNumeric: "tabular-nums" }}>{eq.total_atendimentos}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>atend. · {eq.pct_meta}% meta</div>
              </div>
              {badgeStatus(eq.status)}
              <span style={{ fontSize: 16, color: "var(--muted)" }}>{expandedTeam === eq.nome ? "▲" : "▼"}</span>
            </div>
          </div>

          {expandedTeam === eq.nome && (
            <div style={{ padding: "0 16px 16px" }}>
              {/* Indicadores Odonto */}
              <div style={{ background: "#f5f3ff", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: "#5b21b6", textTransform: "uppercase" }}>Indicadores Saúde Bucal</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 8 }}>
                  {eq.indicadores_odontologia?.map((ind: any) => (
                    <div key={ind.ind} style={{ background: "var(--card-bg)", borderRadius: 6, padding: 8, border: "1px solid #ddd6fe" }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>{ind.label}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 15, color: "#5b21b6", fontVariantNumeric: "tabular-nums" }}>{ind.resultado_pct}%</span>
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>Meta {ind.meta_pct}%</span>
                      </div>
                      <Barra pct={ind.resultado_pct} s={ind.status === "verde" ? "normal" : ind.status === "amarelo" ? "atencao" : "critico"} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Profissionais */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "var(--hover)" }}>
                      {["Profissional","CBO","CNS","Atend.","Meta","% Meta","Status"].map(h => (
                        <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontWeight: 700, color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {eq.profissionais?.map((p: any) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "6px 8px", fontWeight: 600, whiteSpace: "nowrap" }}>{p.nome}</td>
                        <td style={{ padding: "6px 8px", color: "var(--muted)", fontSize: 11 }}>{p.cbo}</td>
                        <td style={{ padding: "6px 8px", color: "var(--muted)", fontSize: 11 }}>{p.cns}</td>
                        <td style={{ padding: "6px 8px", fontWeight: 700, color: "#8b5cf6", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{p.total_atendimentos}</td>
                        <td style={{ padding: "6px 8px", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{p.meta_dia}</td>
                        <td style={{ padding: "6px 8px", minWidth: 90 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Barra pct={p.pct_meta} s={p.status} />
                            <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{p.pct_meta}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "6px 8px" }}>{badgeStatus(p.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Procedimentos dentistas */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 6, color: "#5b21b6", textTransform: "uppercase" }}>Procedimentos Odontológicos</div>
                {eq.profissionais?.filter((p: any) => p.cbo.includes("Cirurgião")).map((p: any) => (
                  <div key={p.id} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>{p.nome}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {p.producao_detalhada?.map((pr: any) => (
                        <div key={pr.tipo} style={{ background: "#f5f3ff", borderRadius: 5, padding: "3px 8px", fontSize: 11, border: "1px solid #ddd6fe" }}>
                          <span style={{ color: "#5b21b6" }}>{pr.label}: </span>
                          <span style={{ fontWeight: 700 }}>{pr.realizado}/{pr.meta_dia}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // ── ABA eMulti ───────────────────────────────────────────────────────────────
  const abaEmulti = !qEmulti.data ? (
    <div style={{ color: "var(--muted)", padding: 24 }}>Carregando eMulti...</div>
  ) : (
    <div>
      <div style={{ background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 8, padding: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: "#0e7490", fontWeight: 700 }}>🌐 Equipe Multiprofissional — eMulti Apuí</span>
        <span style={{ fontSize: 12, color: "#0891b2", marginLeft: 8 }}>
          {qEmulti.data.total_atendimentos} atend. hoje · {qEmulti.data.pct_meta}% meta
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 10, marginBottom: 16 }}>
        <KPI label="Atendimentos" value={qEmulti.data.total_atendimentos} cor="#06b6d4" />
        <KPI label="% da Meta"   value={`${qEmulti.data.pct_meta}%`}     cor={corStatus(qEmulti.data.status)} />
        <KPI label="Profissionais" value={qEmulti.data.profissionais?.length ?? 0} cor="#06b6d4" />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--hover)" }}>
              {["Profissional","CBO","CNS","Atend.","Meta","% Meta","Status","Produções"].map(h => (
                <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {qEmulti.data.profissionais?.map((p: any) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 10px", fontWeight: 600, whiteSpace: "nowrap" }}>{p.nome}</td>
                <td style={{ padding: "8px 10px", color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap" }}>{p.cbo}</td>
                <td style={{ padding: "8px 10px", color: "var(--muted)", fontSize: 11 }}>{p.cns}</td>
                <td style={{ padding: "8px 10px", fontWeight: 700, color: "#06b6d4", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{p.total_atendimentos}</td>
                <td style={{ padding: "8px 10px", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{p.meta_dia}</td>
                <td style={{ padding: "8px 10px", minWidth: 100 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Barra pct={p.pct_meta} s={p.status} />
                    <span style={{ fontSize: 11, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{p.pct_meta}%</span>
                  </div>
                </td>
                <td style={{ padding: "8px 10px" }}>{badgeStatus(p.status)}</td>
                <td style={{ padding: "8px 10px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 320 }}>
                    {p.producao_detalhada?.map((pr: any) => (
                      <span key={pr.tipo} style={{
                        background: "#ecfeff", borderRadius: 4, padding: "2px 6px",
                        fontSize: 10, color: "#0e7490", border: "1px solid #a5f3fc", whiteSpace: "nowrap",
                      }}>{pr.label}: {pr.realizado}/{pr.meta_dia}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── ABA PROFISSIONAIS ────────────────────────────────────────────────────────
  const abaProfs = !qProfs.data ? (
    <div style={{ color: "var(--muted)", padding: 24 }}>Carregando profissionais...</div>
  ) : (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <KPI label="ESF"    value={qProfs.data.esf}    cor="#3b82f6" />
        <KPI label="ESB"    value={qProfs.data.esb}    cor="#8b5cf6" />
        <KPI label="eMulti" value={qProfs.data.emulti} cor="#06b6d4" />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--hover)" }}>
              {["#","Profissional","Equipe","Tipo","CBO","Atend.","Meta","% Meta","Status","Últ. reg."].map(h => (
                <th key={h} style={{ padding: "7px 8px", textAlign: "left", fontWeight: 700, color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {qProfs.data.profissionais?.map((p: any, i: number) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)", background: p.status === "critico" ? "#fff5f5" : "transparent" }}>
                <td style={{ padding: "6px 8px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{i + 1}</td>
                <td style={{ padding: "6px 8px", fontWeight: 600, whiteSpace: "nowrap" }}>{p.nome}</td>
                <td style={{ padding: "6px 8px", color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap" }}>{p.equipe}</td>
                <td style={{ padding: "6px 8px" }}>
                  <span style={{
                    background: p.tipo_equipe === "ESB" ? "#f5f3ff" : p.tipo_equipe === "eMulti" ? "#ecfeff" : "#eff6ff",
                    color: p.tipo_equipe === "ESB" ? "#5b21b6" : p.tipo_equipe === "eMulti" ? "#0e7490" : "#1d4ed8",
                    borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 700,
                  }}>{p.tipo_equipe}</span>
                </td>
                <td style={{ padding: "6px 8px", color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap" }}>{p.cbo}</td>
                <td style={{ padding: "6px 8px", fontWeight: 700, color: "var(--accent)", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{p.total_atendimentos}</td>
                <td style={{ padding: "6px 8px", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{p.meta_dia}</td>
                <td style={{ padding: "6px 8px", minWidth: 90 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Barra pct={p.pct_meta} s={p.status} />
                    <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{p.pct_meta}%</span>
                  </div>
                </td>
                <td style={{ padding: "6px 8px" }}>{badgeStatus(p.status)}</td>
                <td style={{ padding: "6px 8px", textAlign: "center", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{p.ultimo_registro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── ABA ATENDIMENTOS ─────────────────────────────────────────────────────────
  const abaAtend = !qAtend.data ? (
    <div style={{ color: "var(--muted)", padding: 24 }}>Carregando atendimentos...</div>
  ) : (
    <div>
      <div style={{ marginBottom: 10, fontSize: 13, color: "var(--muted)" }}>
        Últimos 30 min · ESF + ESB + eMulti — {qAtend.data.total_30min} registros
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--hover)" }}>
              {["Horário","Profissional","CBO","Equipe","Tipo Atendimento","Duração","Há"].map(h => (
                <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 700, color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {qAtend.data.atendimentos?.map((at: any) => (
              <tr key={at.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "7px 10px", color: "var(--accent)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{at.horario}</td>
                <td style={{ padding: "7px 10px", fontWeight: 600, whiteSpace: "nowrap" }}>{at.profissional}</td>
                <td style={{ padding: "7px 10px", color: "var(--muted)", fontSize: 11 }}>{at.cbo}</td>
                <td style={{ padding: "7px 10px" }}>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{at.equipe} </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: at.tipo_equipe === "ESB" ? "#8b5cf6" : at.tipo_equipe === "eMulti" ? "#0891b2" : "#3b82f6",
                  }}>[{at.tipo_equipe}]</span>
                </td>
                <td style={{ padding: "7px 10px" }}>{at.tipo_atendimento}</td>
                <td style={{ padding: "7px 10px", textAlign: "center", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{at.duracao_min}min</td>
                <td style={{ padding: "7px 10px", color: "var(--muted)", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{at.minutos_atras}min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── ABA PRODUÇÃO/HORA ────────────────────────────────────────────────────────
  const abaProducao = !qHora.data ? (
    <div style={{ color: "var(--muted)", padding: 24 }}>Carregando produção por hora...</div>
  ) : (() => {
    const horas: any[] = qHora.data.horas ?? [];
    const max    = Math.max(...horas.map((h: any) => h.atendimentos), 1);
    const total  = horas.reduce((s: number, h: any) => s + h.atendimentos, 0);
    const media  = horas.length > 0 ? Math.round(total / horas.length) : 0;
    const pico   = horas.reduce((p: any, h: any) => h.atendimentos > (p?.atendimentos ?? 0) ? h : p, null);
    return (
      <div>
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <KPI label="Total Hoje"  value={total}                   sub="todos os profissionais" cor="#3b82f6" />
          <KPI label="Média/Hora"  value={media}                   sub="atendimentos por hora"  cor="#8b5cf6" />
          <KPI label="Pico"        value={pico?.atendimentos ?? 0} sub={`às ${pico?.hora ?? "--"}`} cor="#f59e0b" />
        </div>
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>
            Atendimentos por Hora — {qHora.data.data}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160 }}>
            {horas.map((h: any) => {
              const hp = (h.atendimentos / max) * 100;
              return (
                <div key={h.hora} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 36 }}>
                  <span style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2, fontVariantNumeric: "tabular-nums" }}>{h.atendimentos}</span>
                  <div style={{
                    width: "100%", height: `${hp}%`, minHeight: 4,
                    background: "linear-gradient(to top, #3b82f6, #60a5fa)",
                    borderRadius: "4px 4px 0 0",
                  }} />
                  <span style={{ fontSize: 9, color: "var(--muted)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{h.hora}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  })();

  // ── ABA MÊS/DIA ──────────────────────────────────────────────────────────────
  const [diaExpandido, setDiaExpandido] = useState<number | null>(null);
  const [visaoMes, setVisaoMes]         = useState<"tabela" | "indicadores" | "odonto">("tabela");

  const abaMensal = !qMensal.data ? (
    <div style={{ color: "var(--muted)", padding: 24 }}>Carregando dados mensais...</div>
  ) : (() => {
    const m = qMensal.data;
    const hoje = new Date().getDate();
    const maxTotal = Math.max(...m.dias.filter((d: any) => d.total != null).map((d: any) => d.total), 1);

    return (
      <div>
        {/* KPIs do mês */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(148px,1fr))", gap: 10, marginBottom: 18 }}>
          <KPI label="Total Mês"      value={m.total_mes.toLocaleString("pt-BR")} sub={m.mes_ano}                      cor="#3b82f6" />
          <KPI label="Média/Dia"      value={m.media_dia}                          sub="atend. por dia útil"            cor="#8b5cf6" />
          <KPI label="ESF acumulado"  value={m.acumulado_esf.toLocaleString("pt-BR")} sub="Saúde da Família"           cor="#10b981" />
          <KPI label="ESB acumulado"  value={m.acumulado_esb.toLocaleString("pt-BR")} sub="Odontologia"                cor="#8b5cf6" />
          <KPI label="eMulti acum."   value={m.acumulado_emulti.toLocaleString("pt-BR")} sub="Multiprofissional"       cor="#06b6d4" />
          <KPI label="Dias úteis"     value={m.dias_uteis_passados}                sub={`de ${m.dias_no_mes} dias`}    cor="#f59e0b" />
        </div>

        {/* Seletor de visão */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {(["tabela","indicadores","odonto"] as const).map(v => (
            <button key={v} onClick={() => setVisaoMes(v)} style={{
              padding: "5px 14px", borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer", fontSize: 12,
              background: visaoMes === v ? "var(--accent)" : "var(--card-bg)",
              color: visaoMes === v ? "#fff" : "var(--muted)", fontWeight: visaoMes === v ? 700 : 400,
            }}>
              {v === "tabela" ? "📊 Produção Diária" : v === "indicadores" ? "🎯 Novo Financiamento APS" : "🦷 Saúde Bucal"}
            </button>
          ))}
        </div>

        {/* ── VISÃO TABELA ── */}
        {visaoMes === "tabela" && (
          <div>
            {/* Gráfico de barras horizontal compacto */}
            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Atendimentos por Dia — {m.mes_ano}</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80, overflowX: "auto" }}>
                {m.dias.map((d: any) => {
                  if (!d.is_util) return (
                    <div key={d.dia} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 22, flex: "0 0 22px" }}>
                      <div style={{ height: 4, width: "100%", background: "var(--border)", borderRadius: 2 }} />
                      <span style={{ fontSize: 8, color: "var(--border)", marginTop: 2 }}>{d.dia}</span>
                    </div>
                  );
                  if (d.is_futuro || d.total == null) return (
                    <div key={d.dia} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 22, flex: "0 0 22px" }}>
                      <div style={{ height: 4, width: "100%", background: "#e5e7eb", borderRadius: 2, opacity: 0.3 }} />
                      <span style={{ fontSize: 8, color: "var(--muted)", marginTop: 2, opacity: 0.5 }}>{d.dia}</span>
                    </div>
                  );
                  const hp = Math.round((d.total / maxTotal) * 72);
                  const isH = d.dia === hoje;
                  return (
                    <div key={d.dia} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 22, flex: "0 0 22px", cursor: "pointer" }}
                      onClick={() => setDiaExpandido(diaExpandido === d.dia ? null : d.dia)}>
                      <div style={{
                        width: "100%", height: hp, minHeight: 4,
                        background: isH ? "#f59e0b" : "linear-gradient(to top,#3b82f6,#60a5fa)",
                        borderRadius: "3px 3px 0 0",
                        boxShadow: isH ? "0 0 6px #f59e0b88" : undefined,
                      }} />
                      <span style={{ fontSize: 8, color: isH ? "#f59e0b" : "var(--muted)", marginTop: 2, fontWeight: isH ? 800 : 400 }}>{d.dia}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>🟡 = hoje · clique em um dia para expandir detalhes</div>
            </div>

            {/* Tabela diária */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "var(--hover)" }}>
                    {["Dia","Data","","ESF","ESB","eMulti","Total","Acum. ESF","Acum. ESB","Acum. eMulti",""].map((h, i) => (
                      <th key={i} style={{ padding: "7px 8px", textAlign: "left", fontWeight: 700, color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {m.dias.map((d: any) => {
                    const isH = d.dia === hoje;
                    const rowBg = isH ? "#fffbeb" : !d.is_util ? "var(--hover)" : "transparent";
                    const expanded = diaExpandido === d.dia;
                    return [
                      <tr key={`r-${d.dia}`}
                        style={{ borderBottom: "1px solid var(--border)", background: rowBg, cursor: d.is_util && !d.is_futuro ? "pointer" : "default" }}
                        onClick={() => d.is_util && !d.is_futuro && d.total != null && setDiaExpandido(expanded ? null : d.dia)}>
                        <td style={{ padding: "6px 8px", fontWeight: isH ? 800 : 600, color: isH ? "#f59e0b" : "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{d.dia}</td>
                        <td style={{ padding: "6px 8px", color: "var(--muted)", fontSize: 11 }}>{d.data}</td>
                        <td style={{ padding: "6px 8px", fontSize: 10 }}>
                          {isH ? <span style={{ color: "#f59e0b", fontWeight: 700 }}>HOJE</span>
                            : !d.is_util ? <span style={{ color: "var(--border)" }}>FDS</span>
                            : d.is_futuro ? <span style={{ color: "var(--border)" }}>—</span>
                            : null}
                        </td>
                        <td style={{ padding: "6px 8px", fontVariantNumeric: "tabular-nums", color: "#3b82f6", fontWeight: 600 }}>
                          {d.esf != null ? d.esf.total : "—"}
                        </td>
                        <td style={{ padding: "6px 8px", fontVariantNumeric: "tabular-nums", color: "#8b5cf6", fontWeight: 600 }}>
                          {d.esb != null ? d.esb.total : "—"}
                        </td>
                        <td style={{ padding: "6px 8px", fontVariantNumeric: "tabular-nums", color: "#06b6d4", fontWeight: 600 }}>
                          {d.emulti != null ? d.emulti.total : "—"}
                        </td>
                        <td style={{ padding: "6px 8px", fontWeight: 800, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                          {d.total != null ? d.total : "—"}
                        </td>
                        <td style={{ padding: "6px 8px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                          {d.acumulado_mes_esf != null ? d.acumulado_mes_esf.toLocaleString("pt-BR") : "—"}
                        </td>
                        <td style={{ padding: "6px 8px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                          {d.acumulado_mes_esb != null ? d.acumulado_mes_esb.toLocaleString("pt-BR") : "—"}
                        </td>
                        <td style={{ padding: "6px 8px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                          {d.acumulado_mes_emulti != null ? d.acumulado_mes_emulti.toLocaleString("pt-BR") : "—"}
                        </td>
                        <td style={{ padding: "6px 8px" }}>
                          {d.is_util && !d.is_futuro && d.total != null && (
                            <span style={{ fontSize: 11, color: "var(--accent)" }}>{expanded ? "▲" : "▼"}</span>
                          )}
                        </td>
                      </tr>,
                      expanded && d.indicadores_previne ? (
                        <tr key={`exp-${d.dia}`}>
                          <td colSpan={11} style={{ padding: "12px 16px", background: "var(--hover)" }}>
                            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
                              📅 {d.data} ({d.dia_semana}) — Indicadores Novo Financiamento APS
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(195px,1fr))", gap: 8, marginBottom: 10 }}>
                              {d.indicadores_previne.map((ind: any) => (
                                <div key={ind.ind} style={{ background: "var(--card-bg)", borderRadius: 6, padding: 8, border: "1px solid var(--border)" }}>
                                  <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3 }}>{ind.label}</div>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontWeight: 800, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{ind.resultado_pct}%</span>
                                    <span style={{ fontSize: 10, color: "var(--muted)" }}>Acum: {ind.acumulado_pct}%</span>
                                  </div>
                                  <Barra pct={ind.resultado_pct} s={ind.status === "verde" ? "normal" : ind.status === "amarelo" ? "atencao" : "critico"} />
                                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                                    {badgeStatus(ind.status)}
                                    <span style={{ fontSize: 10, color: "var(--muted)" }}>Meta {ind.meta_pct}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>🦷 Indicadores Odontologia</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(195px,1fr))", gap: 8 }}>
                              {d.indicadores_odonto.map((ind: any) => (
                                <div key={ind.ind} style={{ background: "var(--card-bg)", borderRadius: 6, padding: 8, border: "1px solid #ddd6fe" }}>
                                  <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3 }}>{ind.label}</div>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontWeight: 800, fontSize: 14, color: "#8b5cf6", fontVariantNumeric: "tabular-nums" }}>{ind.resultado_pct}%</span>
                                    <span style={{ fontSize: 10, color: "var(--muted)" }}>Meta {ind.meta_pct}%</span>
                                  </div>
                                  <Barra pct={ind.resultado_pct} s={ind.status === "verde" ? "normal" : ind.status === "amarelo" ? "atencao" : "critico"} />
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ) : null,
                    ];
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── VISÃO INDICADORES PREVINE ── */}
        {visaoMes === "indicadores" && (
          <div>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: 10, marginBottom: 14 }}>
              <span style={{ fontWeight: 700, color: "#1d4ed8", fontSize: 13 }}>🎯 Novo Financiamento APS — Consolidado {m.mes_ano}</span>
              <span style={{ color: "#3b82f6", fontSize: 12, marginLeft: 8 }}>média das 9 equipes ESF · {m.dias_uteis_passados} dias úteis registrados</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12, marginBottom: 18 }}>
              {m.indicadores_previne_mes?.map((ind: any) => (
                <div key={ind.ind} style={{
                  background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 14,
                  borderLeft: `4px solid ${ind.status === "verde" ? "#22c55e" : ind.status === "amarelo" ? "#f59e0b" : "#ef4444"}`,
                }}>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{ind.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: corStatus(ind.status === "verde" ? "normal" : ind.status === "amarelo" ? "atencao" : "critico") }}>
                    {ind.resultado_pct}%
                  </div>
                  <div style={{ marginBottom: 6, marginTop: 4 }}>
                    <Barra pct={ind.resultado_pct} s={ind.status === "verde" ? "normal" : ind.status === "amarelo" ? "atencao" : "critico"} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {badgeStatus(ind.status)}
                    <span style={{ fontSize: 11, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>Meta: {ind.meta_pct}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Evolução diária dos indicadores */}
            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Evolução Diária — Indicadores Novo Financiamento APS</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "var(--hover)" }}>
                      <th style={{ padding: "6px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 700, whiteSpace: "nowrap" }}>Indicador / Meta</th>
                      {m.dias.filter((d: any) => d.is_util && !d.is_futuro && d.total != null).map((d: any) => (
                        <th key={d.dia} style={{
                          padding: "6px 6px", textAlign: "center", color: d.dia === hoje ? "#f59e0b" : "var(--muted)",
                          fontWeight: d.dia === hoje ? 800 : 600, whiteSpace: "nowrap",
                        }}>{d.data}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {m.indicadores_previne_mes?.map((ind: any) => (
                      <tr key={ind.ind} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "6px 8px", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {ind.label}
                          <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 4 }}>({ind.meta_pct}%)</span>
                        </td>
                        {m.dias.filter((d: any) => d.is_util && !d.is_futuro && d.total != null).map((d: any) => {
                          const v = d.indicadores_previne?.find((i: any) => i.ind === ind.ind);
                          if (!v) return <td key={d.dia} style={{ padding: "6px 6px", textAlign: "center", color: "var(--muted)" }}>—</td>;
                          const cor2 = v.status === "verde" ? "#166534" : v.status === "amarelo" ? "#92400e" : "#b91c1c";
                          const bg2  = v.status === "verde" ? "#f0fdf4" : v.status === "amarelo" ? "#fffbeb" : "#fef2f2";
                          return (
                            <td key={d.dia} style={{ padding: "4px 6px", textAlign: "center" }}>
                              <span style={{ background: bg2, color: cor2, borderRadius: 4, padding: "2px 5px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                                {v.resultado_pct}%
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── VISÃO ODONTO ── */}
        {visaoMes === "odonto" && (
          <OdontoEquipes m={m} hoje={hoje} />
        )}
      </div>
    );
  })();

  const abaContent: Record<string, JSX.Element> = {
    geral: abaGeral, mensal: abaMensal, esf: abaEsf, esb: abaEsb,
    emulti: abaEmulti, profissionais: abaProfs,
    atendimentos: abaAtend, producao: abaProducao,
  };

  return (
    <div style={{ padding: "20px 24px", fontFamily: "system-ui, sans-serif", maxWidth: 1280, margin: "0 auto" }}>
      <style>{`
        :root{--card-bg:#fff;--border:#e5e7eb;--fg:#111827;--muted:#6b7280;--accent:#3b82f6;--hover:#f9fafb;}
        @media(prefers-color-scheme:dark){:root{--card-bg:#1e2127;--border:#374151;--fg:#f9fafb;--muted:#9ca3af;--accent:#60a5fa;--hover:#252a33;}}
        :root[data-theme="dark"]{--card-bg:#1e2127;--border:#374151;--fg:#f9fafb;--muted:#9ca3af;--accent:#60a5fa;--hover:#252a33;}
        :root[data-theme="light"]{--card-bg:#fff;--border:#e5e7eb;--fg:#111827;--muted:#6b7280;--accent:#3b82f6;--hover:#f9fafb;}
        *{box-sizing:border-box;}
      `}</style>
      {header}
      {tabs}
      {abaContent[aba] ?? null}
    </div>
  );
}
