// Fase 5 — Auditoria consolidada em painel único com abas
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiAuditoria } from "../lib/api";
import { Shield, Download, Search, AlertTriangle, Info, CheckCircle } from "lucide-react";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import CentralAuditoria from "./CentralAuditoria";
import AuditoriaAutomatica from "./AuditoriaAutomatica";
import TrilhaAuditoria from "./TrilhaAuditoria";
import RelatorioRAS from "./RelatorioRAS";

// ── Estilos compartilhados ────────────────────────────────────────────────────

const S = {
  page:  { padding: 20 } as React.CSSProperties,
  card:  { background: "#fff", borderRadius: 8, border: "1px solid #e5e5e3", padding: 16, marginBottom: 14 } as React.CSSProperties,
  input: { border: "1px solid #e5e5e3", borderRadius: 6, padding: "7px 10px", fontSize: 13, background: "#fff" } as React.CSSProperties,
  badge: (cor: string) => ({ background: cor + "15", color: cor, borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 600 } as React.CSSProperties),
};

const NIVEIS: Record<string, { cor: string; icone: React.ReactNode }> = {
  INFO:     { cor: "#0284c7", icone: <Info size={12} /> },
  AUDIT:    { cor: "#059669", icone: <CheckCircle size={12} /> },
  WARN:     { cor: "#d97706", icone: <AlertTriangle size={12} /> },
  CRITICAL: { cor: "#dc2626", icone: <AlertTriangle size={12} /> },
};

const ACOES_PT: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  visualizar: "Visualizou",
  criar: "Criou",
  editar: "Editou",
  excluir: "Excluiu",
  exportar: "Exportou",
  sincronizar: "Sincronizou",
  acesso_negado: "Acesso negado",
  login_falhou: "Login falhou",
};

interface LogEntry {
  id: number;
  usuario_nome: string;
  ip_address: string;
  acao: string;
  modulo: string;
  descricao: string;
  nivel: string;
  criado_em: string;
}

// ── Aba Sistema (conteúdo original) ──────────────────────────────────────────

function AbaSistema() {
  const [busca, setBusca] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState("TODOS");
  const [moduloFiltro, setModuloFiltro] = useState("todos");

  const { data: logsApi = [] } = useQuery<LogEntry[]>({
    queryKey: ["auditoria"],
    queryFn: () => apiAuditoria.logs().catch(() => []),
    staleTime: 30_000,
  });

  const logs: LogEntry[] = logsApi;

  const logsFiltrados = logs.filter((l) => {
    const matchBusca = !busca || l.usuario_nome.toLowerCase().includes(busca.toLowerCase()) || l.descricao.toLowerCase().includes(busca.toLowerCase());
    const matchNivel = nivelFiltro === "TODOS" || l.nivel === nivelFiltro;
    const matchModulo = moduloFiltro === "todos" || l.modulo === moduloFiltro;
    return matchBusca && matchNivel && matchModulo;
  });

  const contadores = {
    INFO:     logs.filter((l) => l.nivel === "INFO").length,
    AUDIT:    logs.filter((l) => l.nivel === "AUDIT").length,
    WARN:     logs.filter((l) => l.nivel === "WARN").length,
    CRITICAL: logs.filter((l) => l.nivel === "CRITICAL").length,
  };

  const modulos = [...new Set(logs.map((l) => l.modulo))];

  function exportarCSV() {
    const header = "ID,Usuário,IP,Ação,Módulo,Descrição,Nível,Data\n";
    const rows = logsFiltrados.map((l) =>
      `${l.id},"${l.usuario_nome}","${l.ip_address}","${l.acao}","${l.modulo}","${l.descricao}","${l.nivel}","${new Date(l.criado_em).toLocaleString("pt-BR")}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria_ersus_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  if (logs.length === 0) {
    return (
      <div style={S.page}>
        <NaoDisponivelBanner titulo="Logs de auditoria indisponiveis" nota="Dados nao disponiveis — integracao pendente de configuracao no Railway." />
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* Cards de resumo por nível */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        {(["INFO", "AUDIT", "WARN", "CRITICAL"] as const).map((nivel) => {
          const n = NIVEIS[nivel];
          return (
            <button
              key={nivel}
              onClick={() => setNivelFiltro(nivelFiltro === nivel ? "TODOS" : nivel)}
              style={{ ...S.card, marginBottom: 0, textAlign: "left", cursor: "pointer", borderColor: nivelFiltro === nivel ? n.cor : "#e5e5e3", outline: nivelFiltro === nivel ? `2px solid ${n.cor}` : "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, color: n.cor }}>
                {n.icone}
                <span style={{ fontSize: 11, fontWeight: 600 }}>{nivel}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: n.cor }}>{contadores[nivel]}</div>
              <div style={{ fontSize: 10, color: "#737373" }}>eventos</div>
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div style={{ ...S.card, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 200 }}>
          <Search size={13} color="#737373" />
          <input
            style={{ ...S.input, flex: 1, border: "none", outline: "none" }}
            placeholder="Buscar por usuário ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select style={S.input} value={moduloFiltro} onChange={(e) => setModuloFiltro(e.target.value)}>
          <option value="todos">Todos os módulos</option>
          {modulos.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <button
          onClick={exportarCSV}
          style={{ padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, background: "#1565C0", color: "#fff", display: "flex", alignItems: "center", gap: 5 }}
        >
          <Download size={13} /> Exportar CSV
        </button>
      </div>

      {/* Tabela de logs */}
      <div style={S.card}>
        <div style={{ fontSize: 12, color: "#737373", marginBottom: 10 }}>
          {logsFiltrados.length === logs.length
            ? `${logs.length} eventos registrados`
            : `${logsFiltrados.length} de ${logs.length} eventos (filtrado)`}
          {logsApi.length === 0 && <span style={{ color: "#d97706", marginLeft: 8 }}>· dados de demonstração</span>}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e4e7ec" }}>
                {["Data/Hora", "Usuário", "Ação", "Módulo", "Descrição", "Nível", "IP"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: "#737373", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logsFiltrados.map((l) => {
                const n = NIVEIS[l.nivel] ?? NIVEIS.INFO;
                return (
                  <tr key={l.id} style={{ borderBottom: "1px solid #f9f9f7" }}>
                    <td style={{ padding: "8px", whiteSpace: "nowrap", color: "#404040" }}>
                      {new Date(l.criado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "8px", fontWeight: 500 }}>{l.usuario_nome}</td>
                    <td style={{ padding: "8px" }}>{ACOES_PT[l.acao] ?? l.acao}</td>
                    <td style={{ padding: "8px" }}>
                      <span style={{ background: "#f5f5f3", borderRadius: 4, padding: "1px 6px" }}>{l.modulo}</span>
                    </td>
                    <td style={{ padding: "8px", color: "#555", maxWidth: 300 }}>{l.descricao}</td>
                    <td style={{ padding: "8px" }}>
                      <span style={{ ...S.badge(n.cor), display: "flex", alignItems: "center", gap: 3, width: "fit-content" }}>
                        {n.icone} {l.nivel}
                      </span>
                    </td>
                    <td style={{ padding: "8px", color: "#737373", fontFamily: "monospace", fontSize: 11 }}>{l.ip_address}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {logsFiltrados.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: "#737373" }}>Nenhum evento encontrado com os filtros aplicados.</div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#737373", textAlign: "center" }}>
        Logs de auditoria são mantidos por 5 anos conforme RN-011-03. Exportação disponível somente para perfis Gestor e Admin.
      </div>
    </div>
  );
}

// ── Painel principal com abas ────────────────────────────────────────────────

type TabId = "sistema" | "central" | "automatica" | "trilha" | "ras";

const TABS: { id: TabId; label: string }[] = [
  { id: "sistema",    label: "Sistema"      },
  { id: "central",    label: "APS Central"  },
  { id: "automatica", label: "Automática"   },
  { id: "trilha",     label: "Trilha"       },
  { id: "ras",        label: "RAS"          },
];

export default function Auditoria() {
  const [activeTab, setActiveTab] = useState<TabId>("sistema");

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Cabeçalho com abas */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e5e3", padding: "12px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Shield size={16} color="#1565C0" />
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0d2137" }}>Auditoria do Sistema</span>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 18px",
                border: "none",
                borderBottom: activeTab === tab.id ? "3px solid #1565C0" : "3px solid transparent",
                background: "transparent",
                color: activeTab === tab.id ? "#1565C0" : "#737373",
                fontWeight: activeTab === tab.id ? 700 : 400,
                cursor: "pointer",
                fontSize: 13,
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo da aba ativa */}
      <div>
        {activeTab === "sistema"    && <AbaSistema />}
        {activeTab === "central"    && <CentralAuditoria />}
        {activeTab === "automatica" && <AuditoriaAutomatica />}
        {activeTab === "trilha"     && <TrilhaAuditoria />}
        {activeTab === "ras"        && <RelatorioRAS />}
      </div>
    </div>
  );
}
