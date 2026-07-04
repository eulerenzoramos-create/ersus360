import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, MapPin, Home, CheckCircle, TrendingUp, Baby,
  Heart, Activity, Star, AlertTriangle, RefreshCw, ChevronDown,
  ChevronRight, UserCheck, User,
} from "lucide-react";
import { apiGet } from "../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AcsItem {
  id: number;
  nome: string;
  microarea: string;
  esf: string;
  ativo: boolean;
  familias_cadastradas: number;
  familias_meta: number;
  pct_visitas: number;
  pct_cadastro: number;
  status: "destaque" | "regular" | "critico" | "afastado";
  visitas: { programadas: number; realizadas: number; nao_encontradas: number; recusas: number };
  indicadores: { gestantes_ativas: number; criancas_lt2: number; has: number; dm: number; idosos: number };
}

interface DashboardAcs {
  kpis: {
    total_acs: number;
    acs_ativos: number;
    total_microareas: number;
    familias_cadastradas: number;
    pct_cobertura: number;
    pct_visitas: number;
    gestantes_ativas: number;
    criancas_lt2: number;
    has_acompanhados: number;
    dm_acompanhados: number;
  };
  acs_destaques: AcsItem[];
  acs_criticos: AcsItem[];
  distribuicao_esf: Record<string, number>;
  mes_referencia: { label: string };
}

interface Microarea {
  codigo: string;
  nome: string;
  zona: string;
  esf: string;
  acs_count: number;
  acs_ativos: number;
  familias_cadastradas: number;
  familias_meta: number;
  pct_cobertura: number;
  pct_visitas: number;
  gestantes_ativas: number;
  semaforo: "verde" | "amarelo" | "vermelho";
}

interface ListaAcs { acs: AcsItem[] }

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusCor: Record<string, string> = {
  destaque: "#16a34a",
  regular:  "#2563eb",
  critico:  "#dc2626",
  afastado: "#9ca3af",
};
const statusLabel: Record<string, string> = {
  destaque: "Destaque",
  regular:  "Regular",
  critico:  "Atenção",
  afastado: "Afastado",
};

const semCor: Record<string, string> = {
  verde:    "#16a34a",
  amarelo:  "#d97706",
  vermelho: "#dc2626",
};

function MiniBar({ pct, cor }: { pct: number; cor: string }) {
  return (
    <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: cor, borderRadius: 3, transition: "width .5s" }} />
    </div>
  );
}

function KpiCard({ icon, label, val, sub, cor = "#2563eb", bg = "#eff6ff" }: {
  icon: React.ReactNode; label: string; val: string | number; sub?: string; cor?: string; bg?: string;
}) {
  return (
    <div style={{ background: bg, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ color: cor }}>{icon}</div>
        <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: cor }}>{val}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Card ACS ──────────────────────────────────────────────────────────────────

function AcsCard({ a }: { a: AcsItem }) {
  const [open, setOpen] = useState(false);
  const cor = statusCor[a.status];

  return (
    <div style={{
      border: `1px solid ${cor}40`,
      borderLeft: `4px solid ${cor}`,
      borderRadius: 8,
      background: a.status === "critico" ? "#fff7f7" : a.status === "destaque" ? "#f0fdf4" : "#fff",
      overflow: "hidden",
    }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "11px 14px", cursor: "pointer",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 18, background: cor + "20",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <User size={16} color={cor} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            {a.nome}
            <span style={{
              background: cor + "22", color: cor,
              fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 10,
            }}>{statusLabel[a.status]}</span>
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            {a.microarea} · {a.esf} · {a.familias_cadastradas} famílias
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: a.pct_visitas >= 90 ? "#16a34a" : a.pct_visitas >= 70 ? "#d97706" : "#dc2626" }}>
              {a.pct_visitas}%
            </div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>visitas</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: a.pct_cadastro >= 90 ? "#16a34a" : "#d97706" }}>
              {a.pct_cadastro}%
            </div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>cadastro</div>
          </div>
          {open ? <ChevronDown size={14} color="#9ca3af" /> : <ChevronRight size={14} color="#9ca3af" />}
        </div>
      </div>

      {open && (
        <div style={{ padding: "10px 14px 14px", borderTop: "1px solid " + cor + "30" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>Visitas — {a.visitas.realizadas}/{a.visitas.programadas}</div>
              <MiniBar pct={a.pct_visitas} cor={a.pct_visitas >= 90 ? "#16a34a" : a.pct_visitas >= 70 ? "#d97706" : "#dc2626"} />
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                {a.visitas.nao_encontradas} não encontradas · {a.visitas.recusas} recusas
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>Cadastro — {a.familias_cadastradas}/{a.familias_meta} fam.</div>
              <MiniBar pct={a.pct_cadastro} cor={a.pct_cadastro >= 90 ? "#16a34a" : "#d97706"} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: "Gestantes",   val: a.indicadores.gestantes_ativas, cor: "#7c3aed" },
              { label: "< 2 anos",    val: a.indicadores.criancas_lt2,     cor: "#0891b2" },
              { label: "HAS",         val: a.indicadores.has,              cor: "#d97706" },
              { label: "DM",          val: a.indicadores.dm,               cor: "#dc2626" },
              { label: "Idosos",      val: a.indicadores.idosos,           cor: "#6b7280" },
            ].map(k => (
              <div key={k.label} style={{
                textAlign: "center", padding: "6px 10px", background: k.cor + "12",
                borderRadius: 6, minWidth: 50,
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: k.cor }}>{k.val}</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card Microárea ────────────────────────────────────────────────────────────

function MicroareaCard({ ma }: { ma: Microarea }) {
  const cor = semCor[ma.semaforo];
  return (
    <div style={{
      border: `1px solid ${cor}40`,
      borderTop: `3px solid ${cor}`,
      borderRadius: 8, padding: "12px 14px",
      background: "#fff",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{ma.codigo}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{ma.nome}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            {ma.zona === "urbana" ? "🏙 Urbana" : "🌲 Rural"} · {ma.esf}
          </div>
        </div>
        <div style={{
          background: cor + "18", color: cor,
          fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 10,
        }}>
          {ma.pct_cobertura}%
        </div>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>
          <span>Famílias: {ma.familias_cadastradas}/{ma.familias_meta}</span>
          <span>Visitas: {ma.pct_visitas}%</span>
        </div>
        <MiniBar pct={ma.pct_cobertura} cor={cor} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af" }}>
        <span>{ma.acs_ativos}/{ma.acs_count} ACS ativos</span>
        {ma.gestantes_ativas > 0 && (
          <span style={{ color: "#7c3aed" }}>♀ {ma.gestantes_ativas} gest.</span>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ACSPainel() {
  const [aba, setAba] = useState<"dashboard" | "acs" | "microareas">("dashboard");
  const [esfFiltro, setEsfFiltro] = useState("Todas");
  const [statusFiltro, setStatusFiltro] = useState("Todos");

  const { data: dash, isLoading, refetch } = useQuery<DashboardAcs>({
    queryKey: ["acs-dashboard"],
    queryFn: () => apiGet("/api/acs/dashboard") as Promise<DashboardAcs>,
    staleTime: 60_000,
  });

  const { data: listaData } = useQuery<ListaAcs>({
    queryKey: ["acs-lista", esfFiltro],
    queryFn: () => apiGet("/api/acs/lista", esfFiltro !== "Todas" ? { esf: esfFiltro } : undefined) as Promise<ListaAcs>,
    staleTime: 60_000,
  });

  const { data: maData } = useQuery<{ microareas: Microarea[] }>({
    queryKey: ["acs-microareas"],
    queryFn: () => apiGet("/api/acs/microareas") as Promise<{ microareas: Microarea[] }>,
    staleTime: 60_000,
  });

  const k = dash?.kpis;
  const acsListaFiltrada = (listaData?.acs ?? []).filter(a =>
    statusFiltro === "Todos" || a.status === statusFiltro
  );

  const ABAS = [
    { id: "dashboard",  label: "Dashboard",         icon: <Activity size={13} /> },
    { id: "acs",        label: "Lista de ACS",       icon: <Users    size={13} /> },
    { id: "microareas", label: "Microáreas",         icon: <MapPin   size={13} /> },
  ] as const;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>

      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <UserCheck size={22} color="#0891b2" /> Painel ACS
          </h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            Agentes Comunitários de Saúde · Apuí/AM · {dash?.mes_referencia?.label ?? ""}
          </p>
        </div>
        <button onClick={() => refetch()} style={{
          display: "flex", alignItems: "center", gap: 6,
          border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 12px",
          background: "#fff", cursor: "pointer", fontSize: 13,
        }}>
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #e5e7eb", paddingBottom: 0 }}>
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "8px 14px", border: "none", background: "none",
            borderBottom: aba === a.id ? "2px solid #0891b2" : "2px solid transparent",
            color: aba === a.id ? "#0891b2" : "#6b7280",
            fontWeight: aba === a.id ? 700 : 400,
            cursor: "pointer", fontSize: 13, marginBottom: -2,
          }}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: 60 }}>
          <RefreshCw size={28} color="#9ca3af" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {/* ── Dashboard ── */}
      {aba === "dashboard" && k && (
        <div>
          {/* KPIs principais */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            <KpiCard icon={<Users size={18} />}     label="ACS Ativos"         val={`${k.acs_ativos}/${k.total_acs}`} sub={`${k.total_microareas} microáreas`} cor="#0891b2" bg="#ecfeff" />
            <KpiCard icon={<Home size={18} />}      label="Cobertura Familiar"  val={`${k.pct_cobertura}%`} sub={`${k.familias_cadastradas.toLocaleString("pt-BR")} famílias`} cor="#16a34a" bg="#f0fdf4" />
            <KpiCard icon={<CheckCircle size={18} />} label="Visitas Realizadas" val={`${k.pct_visitas}%`} sub="do programado" cor={k.pct_visitas >= 90 ? "#16a34a" : k.pct_visitas >= 70 ? "#d97706" : "#dc2626"} bg="#f9fafb" />
            <KpiCard icon={<Activity size={18} />}  label="Grupos Prioritários" val={k.gestantes_ativas + k.criancas_lt2} sub={`${k.gestantes_ativas} gest. · ${k.criancas_lt2} <2a`} cor="#7c3aed" bg="#faf5ff" />
          </div>

          {/* Distribuição ESF + grupos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

            {/* ESF */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700 }}>Distribuição por Equipe ESF</h3>
              {Object.entries(dash!.distribuicao_esf).map(([esf, n]) => {
                const cores: Record<string, string> = { "ESF I": "#0891b2", "ESF II": "#7c3aed", "ESF III": "#16a34a" };
                return (
                  <div key={esf} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                      <span>{esf}</span>
                      <span style={{ fontWeight: 600, color: cores[esf] }}>{n} ACS</span>
                    </div>
                    <MiniBar pct={(n / k.acs_ativos) * 100} cor={cores[esf] ?? "#9ca3af"} />
                  </div>
                );
              })}
            </div>

            {/* Grupos prioritários */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700 }}>Grupos Prioritários Acompanhados</h3>
              {[
                { label: "Gestantes ativas",    val: k.gestantes_ativas,  cor: "#7c3aed", icon: <Baby size={14} /> },
                { label: "Crianças < 2 anos",   val: k.criancas_lt2,      cor: "#0891b2", icon: <Baby size={14} /> },
                { label: "HAS acompanhados",    val: k.has_acompanhados,  cor: "#d97706", icon: <Heart size={14} /> },
                { label: "DM acompanhados",     val: k.dm_acompanhados,   cor: "#dc2626", icon: <Activity size={14} /> },
              ].map(g => (
                <div key={g.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: g.cor }}>{g.icon}<span style={{ fontSize: 12, color: "#374151" }}>{g.label}</span></div>
                  <span style={{ fontWeight: 700, color: g.cor }}>{g.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Destaques e atenção */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Destaques */}
            {dash!.acs_destaques.length > 0 && (
              <div>
                <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  <Star size={14} color="#16a34a" /> ACS Destaque
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {dash!.acs_destaques.map(a => (
                    <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{a.nome}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{a.microarea} · {a.esf}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{a.pct_visitas}% visitas</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{a.familias_cadastradas} fam.</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Críticos */}
            {dash!.acs_criticos.length > 0 && (
              <div>
                <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={14} color="#dc2626" /> Necessitam Atenção
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {dash!.acs_criticos.map(a => (
                    <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#fff7f7", borderRadius: 8, border: "1px solid #fca5a5" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{a.nome}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{a.microarea} · {a.esf}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>{a.pct_visitas}% visitas</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{a.pct_cadastro}% cad.</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Lista ACS ── */}
      {aba === "acs" && (
        <div>
          {/* Filtros */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["Todas", "ESF I", "ESF II", "ESF III"].map(e => (
              <button key={e} onClick={() => setEsfFiltro(e)} style={{
                padding: "4px 12px", fontSize: 12, borderRadius: 20,
                border: "1px solid #d1d5db",
                background: esfFiltro === e ? "#0891b2" : "#fff",
                color: esfFiltro === e ? "#fff" : "#374151",
                cursor: "pointer", fontWeight: esfFiltro === e ? 600 : 400,
              }}>{e}</button>
            ))}
            <div style={{ width: 1, height: 20, background: "#e5e7eb", margin: "auto 0" }} />
            {["Todos", "destaque", "regular", "critico", "afastado"].map(s => (
              <button key={s} onClick={() => setStatusFiltro(s)} style={{
                padding: "4px 12px", fontSize: 12, borderRadius: 20,
                border: "1px solid #d1d5db",
                background: statusFiltro === s ? statusCor[s] ?? "#374151" : "#fff",
                color: statusFiltro === s ? "#fff" : "#374151",
                cursor: "pointer", fontWeight: statusFiltro === s ? 600 : 400,
              }}>
                {s === "Todos" ? "Todos" : statusLabel[s]}
              </button>
            ))}
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>
              {acsListaFiltrada.length} ACS
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {acsListaFiltrada.map(a => <AcsCard key={a.id} a={a} />)}
          </div>
        </div>
      )}

      {/* ── Microáreas ── */}
      {aba === "microareas" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {(maData?.microareas ?? []).map(ma => <MicroareaCard key={ma.codigo} ma={ma} />)}
          </div>

          {/* Legenda */}
          <div style={{ marginTop: 16, display: "flex", gap: 16, fontSize: 11, color: "#9ca3af" }}>
            {[
              { cor: "#16a34a", label: "≥90% cobertura" },
              { cor: "#d97706", label: "70–89%" },
              { cor: "#dc2626", label: "<70%" },
            ].map(l => (
              <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: l.cor, display: "inline-block" }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
