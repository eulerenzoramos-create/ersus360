/**
 * GatewayIntegracao — ERSUS 360
 * Painel de controle do ERSUS Integration Gateway.
 * Status RNDS/LEDI, botão de pausa, diagnóstico e histórico de transmissões.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, Activity, Pause, Play, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, Clock, Wifi, WifiOff, Loader, ExternalLink,
  List, Settings, Zap, Lock, Database, ArrowRight,
} from "lucide-react";
import { api } from "../lib/api";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Sistema {
  sistema: string;
  descricao: string;
  configurado: boolean;
  ativo: boolean;
  ambiente: string;
  endpoint: string;
  autenticacao: string;
  status: string;
}

interface GatewayStatus {
  pausado: boolean;
  modo_diagnostico: boolean;
  sistemas: Sistema[];
  nota: string;
  verificado_em: string;
}

interface Transmissao {
  id: number;
  sistema: string;
  endpoint: string;
  operacao: string | null;
  status: string;
  id_transacao: string | null;
  codigo_retorno: number | null;
  tentativas: number;
  criado_em: string | null;
}

interface TransmisoesResp {
  total: number;
  transmissoes: Transmissao[];
}

interface DiagnosticoResp {
  rnds: {
    ok: boolean;
    certificado_configurado: boolean;
    token_obtido: boolean;
    latencia_ms: number | null;
    ambiente: string;
    endpoint: string;
    nota: string;
  };
  ledi: {
    ok: boolean;
    configurado: boolean;
    nota: string;
  };
  verificado_em: string;
}

// ── Helpers visuais ───────────────────────────────────────────────────────────

const STATUS_CORES: Record<string, string> = {
  Processado:      "#16a34a",
  Enviado:         "#2563eb",
  Pendente:        "#d97706",
  Rejeitado:       "#dc2626",
  Erro:            "#dc2626",
  Reprocessamento: "#7c3aed",
};

function BadgeStatus({ status }: { status: string }) {
  const cor = STATUS_CORES[status] ?? "#64748b";
  return (
    <span style={{
      background: cor + "22", color: cor,
      fontWeight: 600, fontSize: 11, padding: "2px 8px",
      borderRadius: 4, whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

function IconeStatus({ ok, loading }: { ok: boolean | null; loading?: boolean }) {
  if (loading) return <Loader size={16} style={{ animation: "spin 1s linear infinite", color: "#64748b" }} />;
  if (ok === null) return <AlertTriangle size={16} color="#d97706" />;
  return ok
    ? <CheckCircle size={16} color="#16a34a" />
    : <XCircle size={16} color="#dc2626" />;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function GatewayIntegracao() {
  const qc = useQueryClient();
  const [abaAtiva, setAbaAtiva] = useState<"status" | "diagnostico" | "historico" | "config">("status");
  const [filtroSistema, setFiltroSistema] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [diagExec, setDiagExec] = useState(false);
  const [diagResult, setDiagResult] = useState<DiagnosticoResp | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: gw, isLoading: loadingGw, refetch: refetchGw } = useQuery<GatewayStatus>({
    queryKey: ["gateway-status"],
    queryFn: () => api.get("/api/gateway/status").then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: txs, isLoading: loadingTxs, refetch: refetchTxs } = useQuery<TransmisoesResp>({
    queryKey: ["gateway-transmissoes", filtroSistema, filtroStatus],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filtroSistema) params.append("sistema", filtroSistema);
      if (filtroStatus) params.append("status", filtroStatus);
      params.append("limit", "100");
      return api.get(`/api/gateway/transmissoes?${params}`).then((r) => r.data);
    },
    enabled: abaAtiva === "historico",
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const pausar = useMutation({
    mutationFn: () => api.post("/api/gateway/pausar"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gateway-status"] }),
  });

  const retomar = useMutation({
    mutationFn: () => api.post("/api/gateway/retomar"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gateway-status"] }),
  });

  const toggleDiag = useMutation({
    mutationFn: (ativo: boolean) => api.post(`/api/gateway/modo-diagnostico?ativo=${ativo}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gateway-status"] }),
  });

  async function executarDiagnostico() {
    setDiagExec(true);
    try {
      const r = await api.post("/api/gateway/diagnostico");
      setDiagResult(r.data);
    } catch {
      setDiagResult(null);
    } finally {
      setDiagExec(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  const pausado = gw?.pausado ?? false;
  const modoDiag = gw?.modo_diagnostico ?? true;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <Shield size={22} color="#1e3a5f" />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1e3a5f", margin: 0 }}>
          ERSUS Integration Gateway
        </h1>
        {pausado && (
          <span style={{ background: "#fef3c7", color: "#b45309", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>
            PAUSADO
          </span>
        )}
        {modoDiag && !pausado && (
          <span style={{ background: "#dbeafe", color: "#1e3a5f", fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20 }}>
            MODO DIAGNÓSTICO
          </span>
        )}
      </div>
      <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 20px 34px" }}>
        Camada de integração segura com e-SUS APS (LEDI) e RNDS (FHIR R4) — APIs oficiais MS/DATASUS
      </p>

      {/* Botões de controle */}
      <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
        {pausado ? (
          <button
            onClick={() => retomar.mutate()}
            disabled={retomar.isPending}
            style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Play size={14} /> Retomar Gateway
          </button>
        ) : (
          <button
            onClick={() => pausar.mutate()}
            disabled={pausar.isPending}
            style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Pause size={14} /> Pausar Gateway
          </button>
        )}

        <button
          onClick={() => toggleDiag.mutate(!modoDiag)}
          disabled={toggleDiag.isPending}
          style={{ background: modoDiag ? "#f0fdf4" : "#eff6ff", color: modoDiag ? "#16a34a" : "#2563eb", border: `1px solid ${modoDiag ? "#86efac" : "#93c5fd"}`, borderRadius: 6, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          {modoDiag ? <><Wifi size={14} /> Sair do modo diagnóstico</> : <><WifiOff size={14} /> Ativar modo diagnóstico</>}
        </button>

        <button
          onClick={() => { refetchGw(); refetchTxs(); }}
          style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 6, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Nota atual */}
      {gw?.nota && (
        <div style={{ background: pausado ? "#fef3c7" : modoDiag ? "#eff6ff" : "#f0fdf4", border: `1px solid ${pausado ? "#fde68a" : modoDiag ? "#bfdbfe" : "#86efac"}`, borderRadius: 7, padding: "10px 14px", fontSize: 13, color: pausado ? "#92400e" : modoDiag ? "#1e3a5f" : "#15803d", marginBottom: 22, display: "flex", alignItems: "center", gap: 8 }}>
          {pausado ? <Pause size={14} /> : modoDiag ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
          {gw.nota}
        </div>
      )}

      {/* Abas */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 0 }}>
        {([
          { id: "status", label: "Status", icon: <Activity size={14} /> },
          { id: "diagnostico", label: "Diagnóstico", icon: <Zap size={14} /> },
          { id: "historico", label: "Histórico", icon: <List size={14} /> },
          { id: "config", label: "Configuração", icon: <Settings size={14} /> },
        ] as const).map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "8px 14px", fontSize: 13, fontWeight: 600,
              color: abaAtiva === aba.id ? "#1e3a5f" : "#64748b",
              borderBottom: abaAtiva === aba.id ? "2px solid #1e3a5f" : "2px solid transparent",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {aba.icon} {aba.label}
          </button>
        ))}
      </div>

      {/* ── ABA STATUS ─────────────────────────────────────────────────────────── */}
      {abaAtiva === "status" && (
        <div>
          {loadingGw ? (
            <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
              <Loader size={24} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
              {(gw?.sistemas ?? []).map((s) => (
                <div key={s.sistema} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20, borderLeft: `4px solid ${s.configurado ? (s.ativo ? "#16a34a" : "#2563eb") : "#94a3b8"}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Shield size={18} color={s.configurado ? "#1e3a5f" : "#94a3b8"} />
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#1e3a5f" }}>{s.sistema}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: s.configurado ? "#dbeafe" : "#f1f5f9", color: s.configurado ? "#2563eb" : "#94a3b8" }}>
                      {s.status === "disponivel" ? "Configurado" : "Não configurado"}
                    </span>
                  </div>
                  <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 12px" }}>{s.descricao}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <Lock size={12} color="#94a3b8" />
                      <span style={{ color: "#64748b" }}>{s.autenticacao}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <Database size={12} color="#94a3b8" />
                      <span style={{ color: "#64748b" }}>Ambiente: <strong>{s.ambiente}</strong></span>
                    </div>
                    {s.endpoint && (
                      <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                        <ExternalLink size={12} color="#94a3b8" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span style={{ color: "#94a3b8", wordBreak: "break-all", fontFamily: "monospace", fontSize: 11 }}>{s.endpoint}</span>
                      </div>
                    )}
                  </div>
                  {!s.configurado && (
                    <div style={{ marginTop: 12, background: "#fef3c7", borderRadius: 6, padding: "8px 10px", fontSize: 11, color: "#92400e", display: "flex", gap: 6, alignItems: "flex-start" }}>
                      <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                      Configure as credenciais no Railway (env vars) para ativar este sistema.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Arquitetura resumida */}
          <div style={{ marginTop: 24, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1e3a5f", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <Activity size={14} /> Fluxo de transmissão
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12 }}>
              {["ERSUS 360", "Gateway", "Validação", "Fila", "API Oficial MS"].map((item, i, arr) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: i === 1 ? "#1e3a5f" : i === 4 ? "#16a34a" : "#e2e8f0", color: i === 1 ? "#fff" : i === 4 ? "#fff" : "#475569", padding: "5px 12px", borderRadius: 6, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {item}
                  </span>
                  {i < arr.length - 1 && <ArrowRight size={14} color="#94a3b8" />}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12 }}>
              {["Pendente", "Enviado", "Processado", "Rejeitado", "Erro", "Reprocessamento"].map((s) => (
                <span key={s} style={{ background: (STATUS_CORES[s] ?? "#64748b") + "22", color: STATUS_CORES[s] ?? "#64748b", fontWeight: 600, fontSize: 10, padding: "2px 8px", borderRadius: 4 }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ABA DIAGNÓSTICO ────────────────────────────────────────────────────── */}
      {abaAtiva === "diagnostico" && (
        <div>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "14px 16px", fontSize: 13, color: "#1e3a5f", marginBottom: 20, display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Wifi size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Modo somente leitura.</strong> O diagnóstico verifica conectividade e credenciais sem enviar dados.
              Requer certificado RNDS e/ou credenciais LEDI configurados no Railway.
            </span>
          </div>

          <button
            onClick={executarDiagnostico}
            disabled={diagExec}
            style={{ background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 6, padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}
          >
            {diagExec ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={14} />}
            {diagExec ? "Executando diagnóstico..." : "Executar diagnóstico agora"}
          </button>

          {diagResult && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              {/* RNDS */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20, borderLeft: `4px solid ${diagResult.rnds.ok ? "#16a34a" : "#dc2626"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <IconeStatus ok={diagResult.rnds.ok} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5f" }}>RNDS — FHIR R4</span>
                </div>
                {([
                  ["Certificado configurado", diagResult.rnds.certificado_configurado],
                  ["Token JWT obtido", diagResult.rnds.token_obtido],
                  ["Conectividade OK", diagResult.rnds.ok],
                ] as [string, boolean][]).map(([label, val]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13 }}>
                    <IconeStatus ok={val} />
                    <span style={{ color: "#475569" }}>{label}</span>
                  </div>
                ))}
                {diagResult.rnds.latencia_ms != null && (
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                    <Clock size={12} style={{ display: "inline", marginRight: 4 }} />
                    Latência: <strong>{diagResult.rnds.latencia_ms} ms</strong>
                  </div>
                )}
                <div style={{ marginTop: 10, background: diagResult.rnds.ok ? "#f0fdf4" : "#fef2f2", borderRadius: 6, padding: "8px 10px", fontSize: 12, color: diagResult.rnds.ok ? "#15803d" : "#dc2626" }}>
                  {diagResult.rnds.nota}
                </div>
              </div>

              {/* LEDI */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20, borderLeft: `4px solid ${diagResult.ledi.ok ? "#16a34a" : "#dc2626"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <IconeStatus ok={diagResult.ledi.ok} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5f" }}>LEDI — e-SUS APS</span>
                </div>
                {([
                  ["PEC URL configurado", diagResult.ledi.configurado],
                  ["Sessão criada (login)", diagResult.ledi.ok],
                ] as [string, boolean][]).map(([label, val]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13 }}>
                    <IconeStatus ok={val} />
                    <span style={{ color: "#475569" }}>{label}</span>
                  </div>
                ))}
                <div style={{ marginTop: 10, background: diagResult.ledi.ok ? "#f0fdf4" : "#fef2f2", borderRadius: 6, padding: "8px 10px", fontSize: 12, color: diagResult.ledi.ok ? "#15803d" : "#dc2626" }}>
                  {diagResult.ledi.nota}
                </div>
              </div>
            </div>
          )}

          <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 16 }}>
            Verificado em: {diagResult?.verificado_em ?? "—"}
          </p>
        </div>
      )}

      {/* ── ABA HISTÓRICO ──────────────────────────────────────────────────────── */}
      {abaAtiva === "historico" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <select
              value={filtroSistema}
              onChange={(e) => setFiltroSistema(e.target.value)}
              style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 10px", fontSize: 13, color: "#475569" }}
            >
              <option value="">Todos os sistemas</option>
              <option value="RNDS">RNDS</option>
              <option value="LEDI">LEDI</option>
              <option value="ESUS_EXT">e-SUS Externo</option>
            </select>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 10px", fontSize: 13, color: "#475569" }}
            >
              <option value="">Todos os status</option>
              {["Pendente", "Enviado", "Processado", "Rejeitado", "Erro", "Reprocessamento"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button onClick={() => refetchTxs()} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569" }}>
              <RefreshCw size={13} />
            </button>
          </div>

          {loadingTxs ? (
            <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
              <Loader size={20} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : !txs?.transmissoes?.length ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", background: "#f8fafc", borderRadius: 10, border: "1px dashed #e2e8f0" }}>
              <List size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <p style={{ margin: 0 }}>Nenhuma transmissão registrada ainda.</p>
              <p style={{ margin: "4px 0 0", fontSize: 12 }}>As transmissões aparecerão aqui após a configuração e ativação do gateway.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    {["ID", "Sistema", "Operação", "Status", "HTTP", "Tentativas", "Data"].map((h) => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txs.transmissoes.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "9px 12px", color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>{t.id}</td>
                      <td style={{ padding: "9px 12px", fontWeight: 600, color: "#1e3a5f" }}>{t.sistema}</td>
                      <td style={{ padding: "9px 12px", color: "#475569" }}>{t.operacao ?? "—"}</td>
                      <td style={{ padding: "9px 12px" }}><BadgeStatus status={t.status} /></td>
                      <td style={{ padding: "9px 12px", fontVariantNumeric: "tabular-nums", color: "#475569" }}>{t.codigo_retorno ?? "—"}</td>
                      <td style={{ padding: "9px 12px", fontVariantNumeric: "tabular-nums", color: "#475569" }}>{t.tentativas}</td>
                      <td style={{ padding: "9px 12px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {t.criado_em ? new Date(t.criado_em).toLocaleString("pt-BR") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 8 }}>
                {txs.total} transmissão(ões) encontrada(s)
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── ABA CONFIGURAÇÃO ───────────────────────────────────────────────────── */}
      {abaAtiva === "config" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#92400e", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Lock size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Segurança:</strong> Todas as credenciais devem ser configuradas exclusivamente como
              variáveis de ambiente no Railway (Secret Manager). Nunca colocar em código ou arquivos de configuração versionados.
            </span>
          </div>

          {([
            {
              titulo: "RNDS — Rede Nacional de Dados em Saúde",
              cor: "#2563eb",
              vars: [
                ["RNDS_CERT_PATH", "Caminho do certificado ICP-Brasil PKCS12 (.pfx)", true],
                ["RNDS_CERT_KEY_PATH", "Chave privada do certificado", true],
                ["RNDS_CNES", "CNES do estabelecimento de saúde", true],
                ["RNDS_UF", "UF do estabelecimento (ex: am)", false],
                ["RNDS_AMBIENTE", "homologacao | producao (padrão: homologacao)", false],
                ["RNDS_AUTH_URL", "URL EHR-AUTH (padrão: homologação)", false],
                ["RNDS_SERVICES_URL", "URL EHR-SERVICES (auto por UF se vazio)", false],
                ["RNDS_CNS_PROFISSIONAL", "CNS do profissional autorizado para requisições FHIR", true],
              ] as [string, string, boolean][],
            },
            {
              titulo: "LEDI — e-SUS APS API LEDI v8.5.0",
              cor: "#16a34a",
              vars: [
                ["LEDI_PEC_URL", "URL base do PEC com HTTPS (ex: https://pec.apui.am.gov.br)", true],
                ["LEDI_USUARIO", "Usuário gerado no PEC: Gestão → Integrações → Credenciais para API", true],
                ["LEDI_SENHA", "Senha LEDI — exibida uma única vez no PEC, armazenar imediatamente", true],
                ["LEDI_AMBIENTE", "homologacao | producao (padrão: producao)", false],
              ] as [string, string, boolean][],
            },
          ]).map((grupo) => (
            <div key={grupo.titulo} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: grupo.cor + "10", borderBottom: "1px solid " + grupo.cor + "30", padding: "12px 18px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: grupo.cor, flexShrink: 0 }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: "#1e3a5f" }}>{grupo.titulo}</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: "7px 16px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Variável</th>
                    <th style={{ padding: "7px 16px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Descrição</th>
                    <th style={{ padding: "7px 16px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Obrig.</th>
                  </tr>
                </thead>
                <tbody>
                  {grupo.vars.map(([nome, desc, obrig]) => (
                    <tr key={nome} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "9px 16px" }}>
                        <code style={{ background: "#f1f5f9", color: "#1e3a5f", padding: "2px 6px", borderRadius: 3, fontSize: 11, fontFamily: "monospace" }}>{nome}</code>
                      </td>
                      <td style={{ padding: "9px 16px", color: "#475569" }}>{desc}</td>
                      <td style={{ padding: "9px 16px" }}>
                        {obrig
                          ? <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 11 }}>Sim</span>
                          : <span style={{ color: "#94a3b8", fontSize: 11 }}>Opcional</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#15803d", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <CheckCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Após configurar as variáveis no Railway, use a aba <strong>Diagnóstico</strong> para verificar a conectividade
              antes de desativar o modo diagnóstico e habilitar transmissão real.
            </span>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
