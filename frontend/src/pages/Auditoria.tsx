// Fase 2 — Auditoria do Sistema (logs de acesso e operações)
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiAuditoria } from "../lib/api";
import { Shield, Download, Search, AlertTriangle, Info, CheckCircle } from "lucide-react";

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

// Dados de exemplo para quando a API retornar vazio
const LOGS_DEMO: LogEntry[] = [
  { id: 1, usuario_nome: "Euler Ramos", ip_address: "177.91.x.x", acao: "login", modulo: "auth", descricao: "Login realizado com sucesso", nivel: "INFO", criado_em: new Date().toISOString() },
  { id: 2, usuario_nome: "Euler Ramos", ip_address: "177.91.x.x", acao: "visualizar", modulo: "previne", descricao: "Acessou Novo Financiamento APS — 7 indicadores", nivel: "INFO", criado_em: new Date(Date.now() - 300000).toISOString() },
  { id: 3, usuario_nome: "Ana Souza", ip_address: "189.34.x.x", acao: "exportar", modulo: "fns", descricao: "Exportou relatório FNS — Convênios 2026", nivel: "AUDIT", criado_em: new Date(Date.now() - 600000).toISOString() },
  { id: 4, usuario_nome: "Desconhecido", ip_address: "200.10.x.x", acao: "login_falhou", modulo: "auth", descricao: "Senha incorreta — tentativa 1/5", nivel: "WARN", criado_em: new Date(Date.now() - 900000).toISOString() },
  { id: 5, usuario_nome: "Ana Souza", ip_address: "189.34.x.x", acao: "criar", modulo: "usuarios", descricao: "Criou usuário João Silva (perfil: financeiro)", nivel: "AUDIT", criado_em: new Date(Date.now() - 1800000).toISOString() },
];

export default function Auditoria() {
  const [busca, setBusca] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState("TODOS");
  const [moduloFiltro, setModuloFiltro] = useState("todos");

  const { data: logsApi = [] } = useQuery<LogEntry[]>({
    queryKey: ["auditoria"],
    queryFn: () => apiAuditoria.logs().catch(() => []),
    staleTime: 30_000,
  });

  const logs: LogEntry[] = logsApi.length > 0 ? logsApi : LOGS_DEMO;

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

  return (
    <div style={S.page}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Shield size={16} color="#1565C0" /> Auditoria do Sistema
      </div>

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

      {/* Nota de retenção */}
      <div style={{ fontSize: 11, color: "#737373", textAlign: "center" }}>
        Logs de auditoria são mantidos por 5 anos conforme RN-011-03. Exportação disponível somente para perfis Gestor e Admin.
      </div>
    </div>
  );
}
