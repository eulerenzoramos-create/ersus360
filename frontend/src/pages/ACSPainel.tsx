import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, MapPin, Home, CheckCircle, TrendingUp, Baby,
  Heart, Activity, Star, AlertTriangle, RefreshCw, ChevronDown,
  ChevronRight, UserCheck, User, Navigation, FileText,
  XCircle, Search, Filter,
} from "lucide-react";
import { apiGet } from "../lib/api";
import ACSGeoPage from "./ACSGeoPage";

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

// ── Cadastro SIS ──────────────────────────────────────────────────────────────
interface CampoSis {
  campo: string;
  label: string;
  preenchido: boolean;
}

interface CadastroPaciente {
  id: number;
  nome: string;
  cns: string;
  data_nascimento: string;
  microarea: string;
  acs_nome: string;
  acs_id: number;
  visitas_no_mes: number;
  ultima_visita: string;
  campos: CampoSis[];
  pct_completo: number;
  status_cadastro: "completo" | "parcial" | "incompleto";
}

// ── Dados simulados SIS ───────────────────────────────────────────────────────
const CAMPOS_SIS = [
  "CNS / CPF",
  "Data de Nascimento",
  "Raça / Cor",
  "Escolaridade",
  "Situação de Trabalho",
  "Condições de Saúde",
  "Endereço Completo",
  "Responsável Familiar",
];

function gerarCadastrosSIS(acs: AcsItem[]): CadastroPaciente[] {
  const seed = (n: number) => ((n * 1103515245 + 12345) & 0x7fffffff) % 100;
  const pacientes: CadastroPaciente[] = [];
  let id = 1;
  acs.forEach(a => {
    const qtd = Math.floor(a.familias_cadastradas * 3.2);
    for (let i = 0; i < Math.min(qtd, 15); i++) {
      const campos: CampoSis[] = CAMPOS_SIS.map((label, ci) => ({
        campo: label.toLowerCase().replace(/\s+/g, "_").replace(/\//g, "_"),
        label,
        preenchido: seed((a.id * 31 + i * 17 + ci * 7)) > (a.status === "critico" ? 55 : a.status === "destaque" ? 15 : 35),
      }));
      const preenchidos = campos.filter(c => c.preenchido).length;
      const pct = Math.round((preenchidos / campos.length) * 100);
      const status_cadastro: CadastroPaciente["status_cadastro"] =
        pct === 100 ? "completo" : pct >= 60 ? "parcial" : "incompleto";
      const visitas = seed(a.id * 13 + i * 5) > 50 ? Math.floor(seed(a.id + i) / 25) + 1 : 0;
      pacientes.push({
        id: id++,
        nome: `Paciente ${i + 1} — ${a.microarea}`,
        cns: `${700_000_000_000_000 + a.id * 10000 + i}`,
        data_nascimento: `${1940 + ((a.id * 7 + i * 3) % 65)}-${String(((a.id + i) % 12) + 1).padStart(2,"0")}-${String(((a.id * 3 + i) % 28) + 1).padStart(2,"0")}`,
        microarea: a.microarea,
        acs_nome: a.nome,
        acs_id: a.id,
        visitas_no_mes: visitas,
        ultima_visita: visitas > 0 ? `2025-06-${String(((a.id * 5 + i * 2) % 28) + 1).padStart(2,"0")}` : "—",
        campos,
        pct_completo: pct,
        status_cadastro,
      });
    }
  });
  return pacientes;
}

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
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
                Visitas — <strong>{a.visitas.realizadas}</strong>/{a.visitas.programadas} programadas
              </div>
              <MiniBar pct={a.pct_visitas} cor={a.pct_visitas >= 90 ? "#16a34a" : a.pct_visitas >= 70 ? "#d97706" : "#dc2626"} />
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                {a.visitas.nao_encontradas} não encontradas · {a.visitas.recusas} recusas
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
                Cadastro SIS — {a.familias_cadastradas}/{a.familias_meta} fam. · {a.pct_cadastro}% completo
              </div>
              <MiniBar pct={a.pct_cadastro} cor={a.pct_cadastro >= 90 ? "#16a34a" : "#d97706"} />
              <div style={{ fontSize: 10, color: a.pct_cadastro < 80 ? "#dc2626" : "#9ca3af", marginTop: 2 }}>
                {a.pct_cadastro < 80
                  ? `⚠ ${a.familias_meta - a.familias_cadastradas} cadastros pendentes no SIS`
                  : "✓ Cadastros SIS atualizados"}
              </div>
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
  const [aba, setAba] = useState<"dashboard" | "acs" | "microareas" | "geo" | "sis">("dashboard");
  const [esfFiltro, setEsfFiltro] = useState("Todas");
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  const [sisAcsFiltro, setSisAcsFiltro] = useState("Todos");
  const [sisStatusFiltro, setSisStatusFiltro] = useState("Todos");
  const [sisBusca, setSisBusca] = useState("");

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

  const todosCadastros = useMemo(
    () => gerarCadastrosSIS(listaData?.acs ?? []),
    [listaData?.acs]
  );

  const [sisMicroareaFiltro, setSisMicroareaFiltro] = useState("Todas");
  const [sisIncFiltro, setSisIncFiltro] = useState(false);

  const todasMicroareas = useMemo(() =>
    ["Todas", ...Array.from(new Set(todosCadastros.map(p => p.microarea)))],
    [todosCadastros]
  );

  // Detecção de inconsistências por paciente
  const cadComInconsistencias = useMemo(() => todosCadastros.map(p => {
    const inc: string[] = [];
    if (!p.campos.find(c => c.campo === "cns___cpf" && c.preenchido)) inc.push("CNS/CPF ausente");
    if (!p.campos.find(c => c.campo === "raça___cor" && c.preenchido)) inc.push("Raça/Cor não informada");
    if (!p.campos.find(c => c.campo === "condições_de_saúde" && c.preenchido)) inc.push("Condições de saúde em branco");
    if (!p.campos.find(c => c.campo === "endereço_completo" && c.preenchido)) inc.push("Endereço incompleto");
    if (!p.campos.find(c => c.campo === "responsável_familiar" && c.preenchido)) inc.push("Responsável sem CNS");
    if (p.visitas_no_mes === 0) inc.push("Sem visita no mês");
    const ano = parseInt(p.data_nascimento.slice(0, 4));
    if (ano > 2025) inc.push("Data nascimento inválida");
    if (ano < 1900) inc.push("Data nascimento suspeita");
    return { ...p, inconsistencias: inc };
  }), [todosCadastros]);

  const cadFiltrados = useMemo(() => cadComInconsistencias.filter(p => {
    if (sisAcsFiltro !== "Todos" && p.acs_nome !== sisAcsFiltro) return false;
    if (sisMicroareaFiltro !== "Todas" && p.microarea !== sisMicroareaFiltro) return false;
    if (sisStatusFiltro !== "Todos" && p.status_cadastro !== sisStatusFiltro) return false;
    if (sisIncFiltro && p.inconsistencias.length === 0) return false;
    if (sisBusca && !p.nome.toLowerCase().includes(sisBusca.toLowerCase()) &&
        !p.cns.includes(sisBusca)) return false;
    return true;
  }), [cadComInconsistencias, sisAcsFiltro, sisMicroareaFiltro, sisStatusFiltro, sisIncFiltro, sisBusca]);

  const resumoSis = useMemo(() => ({
    total: todosCadastros.length,
    completos:       todosCadastros.filter(p => p.status_cadastro === "completo").length,
    parciais:        todosCadastros.filter(p => p.status_cadastro === "parcial").length,
    incompletos:     todosCadastros.filter(p => p.status_cadastro === "incompleto").length,
    semVisita:       todosCadastros.filter(p => p.visitas_no_mes === 0).length,
    comInconsistencia: cadComInconsistencias.filter(p => p.inconsistencias.length > 0).length,
  }), [todosCadastros, cadComInconsistencias]);

  const acsNomes = useMemo(() =>
    ["Todos", ...Array.from(new Set((listaData?.acs ?? []).map(a => a.nome)))],
    [listaData?.acs]
  );

  const ABAS = [
    { id: "dashboard",  label: "Dashboard",                 icon: <Activity   size={13} /> },
    { id: "geo",        label: "🗺 Tempo Real",              icon: <Navigation size={13} /> },
    { id: "acs",        label: "Lista de ACS",              icon: <Users      size={13} /> },
    { id: "microareas", label: "Microáreas",                icon: <MapPin     size={13} /> },
    { id: "sis",        label: "Cadastros SIS",             icon: <FileText   size={13} /> },
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

      {/* ── Geo-localização em Tempo Real ── */}
      {aba === "geo" && (
        <div style={{ margin: "0 -24px -24px", minHeight: 640 }}>
          <ACSGeoPage />
        </div>
      )}

      {/* ── Microáreas ── */}
      {aba === "microareas" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {(maData?.microareas ?? []).map(ma => <MicroareaCard key={ma.codigo} ma={ma} />)}
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 16, fontSize: 11, color: "#9ca3af" }}>
            {[{ cor:"#16a34a",label:"≥90% cobertura"},{cor:"#d97706",label:"70–89%"},{cor:"#dc2626",label:"<70%"}].map(l => (
              <span key={l.label} style={{ display:"flex",alignItems:"center",gap:4 }}>
                <span style={{ width:10,height:10,borderRadius:2,background:l.cor,display:"inline-block" }}/>{l.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Cadastros SIS ── */}
      {aba === "sis" && (
        <div>

          {/* Resumo KPIs */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:18 }}>
            {[
              { label:"Total Cadastros",     val:resumoSis.total,                cor:"#0891b2", bg:"#ecfeff" },
              { label:"Completos",           val:resumoSis.completos,            cor:"#16a34a", bg:"#f0fdf4" },
              { label:"Parciais",            val:resumoSis.parciais,             cor:"#d97706", bg:"#fffbeb" },
              { label:"Incompletos",         val:resumoSis.incompletos,          cor:"#dc2626", bg:"#fff7f7" },
              { label:"Sem Visita/Mês",      val:resumoSis.semVisita,            cor:"#6b7280", bg:"#f9fafb" },
              { label:"Com Inconsistências", val:resumoSis.comInconsistencia,    cor:"#9333ea", bg:"#faf5ff" },
            ].map(k => (
              <div key={k.label} style={{ background:k.bg, borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:700, color:k.cor }}>{k.val}</div>
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{k.label}</div>
                <div style={{ marginTop:6 }}>
                  <MiniBar pct={Math.round((k.val/resumoSis.total)*100)} cor={k.cor}/>
                </div>
              </div>
            ))}
          </div>

          {/* Barra de completude geral */}
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:600 }}>Completude Geral dos Cadastros SIS</span>
              <span style={{ fontSize:13, fontWeight:700, color:"#16a34a" }}>
                {resumoSis.total > 0 ? Math.round((resumoSis.completos/resumoSis.total)*100) : 0}% completos
              </span>
            </div>
            <div style={{ height:10, background:"#e5e7eb", borderRadius:5, overflow:"hidden", display:"flex" }}>
              <div style={{ width:`${Math.round((resumoSis.completos/resumoSis.total)*100)}%`, background:"#16a34a", transition:"width .5s" }}/>
              <div style={{ width:`${Math.round((resumoSis.parciais/resumoSis.total)*100)}%`, background:"#d97706" }}/>
              <div style={{ width:`${Math.round((resumoSis.incompletos/resumoSis.total)*100)}%`, background:"#dc2626" }}/>
            </div>
            <div style={{ display:"flex", gap:16, marginTop:6, fontSize:11, color:"#9ca3af" }}>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:10, height:10, borderRadius:2, background:"#16a34a", display:"inline-block" }}/> Completo</span>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:10, height:10, borderRadius:2, background:"#d97706", display:"inline-block" }}/> Parcial (≥60%)</span>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:10, height:10, borderRadius:2, background:"#dc2626", display:"inline-block" }}/> Incompleto (&lt;60%)</span>
            </div>
          </div>

          {/* Campos mais problemáticos */}
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Campos com Maior Pendência</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
              {CAMPOS_SIS.map(campo => {
                const faltando = todosCadastros.filter(p =>
                  p.campos.find(c => c.label === campo && !c.preenchido)
                ).length;
                const pct = todosCadastros.length > 0 ? Math.round((faltando/todosCadastros.length)*100) : 0;
                return (
                  <div key={campo} style={{ background:pct>40?"#fff7f7":pct>20?"#fffbeb":"#f9fafb", borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ fontSize:12, fontWeight:500, marginBottom:4 }}>{campo}</div>
                    <div style={{ fontSize:18, fontWeight:700, color:pct>40?"#dc2626":pct>20?"#d97706":"#16a34a" }}>
                      {faltando} <span style={{ fontSize:11, fontWeight:400, color:"#9ca3af" }}>pendentes</span>
                    </div>
                    <MiniBar pct={100-pct} cor={pct>40?"#dc2626":pct>20?"#d97706":"#16a34a"}/>
                    <div style={{ fontSize:10, color:"#9ca3af", marginTop:2 }}>{100-pct}% preenchido</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filtros */}
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"12px 16px", marginBottom:14 }}>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, flex:1, minWidth:200 }}>
                <Search size={13} color="#9ca3af"/>
                <input
                  value={sisBusca}
                  onChange={e => setSisBusca(e.target.value)}
                  placeholder="Buscar por nome ou CNS..."
                  style={{ border:"1px solid #e5e7eb", borderRadius:6, padding:"6px 10px", fontSize:12, flex:1 }}
                />
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <Filter size={13} color="#9ca3af"/>
                <select value={sisAcsFiltro} onChange={e => setSisAcsFiltro(e.target.value)}
                  style={{ border:"1px solid #e5e7eb", borderRadius:6, padding:"6px 10px", fontSize:12 }}>
                  {acsNomes.map(n => <option key={n} value={n}>{n === "Todos" ? "Todos os ACS" : n}</option>)}
                </select>
                <select value={sisMicroareaFiltro} onChange={e => setSisMicroareaFiltro(e.target.value)}
                  style={{ border:"1px solid #e5e7eb", borderRadius:6, padding:"6px 10px", fontSize:12 }}>
                  {todasMicroareas.map(m => <option key={m} value={m}>{m === "Todas" ? "Todas as Microáreas" : m}</option>)}
                </select>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[
                  { val:"Todos",      label:"Todos",         cor:"#374151" },
                  { val:"completo",   label:"Completo",      cor:"#16a34a" },
                  { val:"parcial",    label:"Parcial",       cor:"#d97706" },
                  { val:"incompleto", label:"Incompleto",    cor:"#dc2626" },
                ].map(s => (
                  <button key={s.val} onClick={() => setSisStatusFiltro(s.val)} style={{
                    padding:"4px 10px", fontSize:11, borderRadius:16,
                    border:"1px solid " + s.cor + "60",
                    background: sisStatusFiltro===s.val ? s.cor : "#fff",
                    color: sisStatusFiltro===s.val ? "#fff" : s.cor,
                    cursor:"pointer", fontWeight:600,
                  }}>{s.label}</button>
                ))}
                <button onClick={() => setSisIncFiltro(v => !v)} style={{
                  padding:"4px 10px", fontSize:11, borderRadius:16,
                  border:"1px solid #9333ea60",
                  background: sisIncFiltro ? "#9333ea" : "#fff",
                  color: sisIncFiltro ? "#fff" : "#9333ea",
                  cursor:"pointer", fontWeight:600,
                }}>⚠ Só inconsistências</button>
              </div>
              <span style={{ fontSize:12, color:"#9ca3af", marginLeft:"auto" }}>{cadFiltrados.length} registros</span>
            </div>
          </div>

          {/* Tabela de cadastros */}
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ background:"#f9fafb", borderBottom:"1px solid #e5e7eb" }}>
                    {["Paciente / CNS","ACS","Microárea","Visitas/Mês","Últ. Visita","Completude","Inconsistências SIS","Campos Pendentes","Status"].map(h => (
                      <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:600, color:"#6b7280", fontSize:11, whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cadFiltrados.map((p, i) => {
                    const corStatus = p.status_cadastro === "completo" ? "#16a34a" : p.status_cadastro === "parcial" ? "#d97706" : "#dc2626";
                    const bgRow = i % 2 === 0 ? "#fff" : "#fafafa";
                    const faltando = p.campos.filter(c => !c.preenchido).map(c => c.label);
                    return (
                      <tr key={p.id} style={{ borderBottom:"1px solid #f3f4f6", background:bgRow }}>
                        <td style={{ padding:"10px 12px" }}>
                          <div style={{ fontWeight:500 }}>{p.nome}</div>
                          <div style={{ fontSize:10, color:"#9ca3af" }}>CNS: {p.cns.slice(0,7)}…</div>
                        </td>
                        <td style={{ padding:"10px 12px", color:"#374151" }}>{p.acs_nome}</td>
                        <td style={{ padding:"10px 12px", color:"#374151" }}>{p.microarea}</td>
                        <td style={{ padding:"10px 12px", textAlign:"center" }}>
                          <span style={{
                            fontWeight:700, fontSize:13,
                            color: p.visitas_no_mes === 0 ? "#dc2626" : p.visitas_no_mes >= 2 ? "#16a34a" : "#d97706",
                          }}>
                            {p.visitas_no_mes}
                          </span>
                          {p.visitas_no_mes === 0 && (
                            <div style={{ fontSize:9, color:"#dc2626" }}>sem visita</div>
                          )}
                        </td>
                        <td style={{ padding:"10px 12px", color:"#374151", whiteSpace:"nowrap" }}>
                          {p.ultima_visita !== "—" ? new Date(p.ultima_visita).toLocaleDateString("pt-BR") : <span style={{ color:"#dc2626" }}>—</span>}
                        </td>
                        <td style={{ padding:"10px 12px", minWidth:100 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <MiniBar pct={p.pct_completo} cor={corStatus}/>
                            <span style={{ fontSize:11, fontWeight:700, color:corStatus, minWidth:30 }}>{p.pct_completo}%</span>
                          </div>
                        </td>
                        <td style={{ padding:"10px 12px", maxWidth:160 }}>
                          {(p as any).inconsistencias?.length === 0 ? (
                            <span style={{ color:"#16a34a", fontSize:11 }}>✓ Sem inconsistências</span>
                          ) : (
                            <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                              {((p as any).inconsistencias as string[]).map((inc: string) => (
                                <span key={inc} style={{
                                  background:"#faf5ff", color:"#9333ea",
                                  fontSize:9, padding:"1px 5px", borderRadius:4, whiteSpace:"nowrap",
                                  border:"1px solid #e9d5ff",
                                }}>⚠ {inc}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ padding:"10px 12px", maxWidth:160 }}>
                          {faltando.length === 0 ? (
                            <span style={{ color:"#16a34a", fontSize:11 }}>✓ Todos preenchidos</span>
                          ) : (
                            <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                              {faltando.map(f => (
                                <span key={f} style={{
                                  background:"#fee2e2", color:"#dc2626",
                                  fontSize:9, padding:"1px 5px", borderRadius:4, whiteSpace:"nowrap",
                                }}>{f}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ padding:"10px 12px" }}>
                          <span style={{
                            background: corStatus + "18", color: corStatus,
                            fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10,
                            whiteSpace:"nowrap",
                          }}>
                            {p.status_cadastro === "completo" ? "✓ Completo" : p.status_cadastro === "parcial" ? "⚠ Parcial" : "✗ Incompleto"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {cadFiltrados.length === 0 && (
                <div style={{ textAlign:"center", padding:32, color:"#9ca3af", fontSize:13 }}>
                  Nenhum cadastro encontrado com os filtros selecionados.
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
