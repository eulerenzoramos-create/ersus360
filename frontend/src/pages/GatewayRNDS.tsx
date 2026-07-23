// src/pages/GatewayRNDS.tsx — RNDS FHIR R4 Gateway · Monitor e Integração
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Network, RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock,
  ChevronDown, ChevronRight, Search, Zap, Shield, Activity,
  Server, Database, Globe, Copy, ExternalLink,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface StatusRNDS {
  conexao: "online" | "offline" | "degradado";
  autenticacao: "ok" | "expirado" | "erro";
  mtls_valido: boolean; certificado_validade: string; certificado_dias_restantes: number;
  token_expira: string; ultimo_ping: string; latencia_ms: number;
  ambiente: "producao" | "homologacao"; versao_fhir: string;
  endpoints: EndpointFHIR[];
}

interface EndpointFHIR {
  recurso: string; path: string; metodos: string[];
  status: "ok" | "erro" | "nao_testado"; ultima_chamada: string | null;
  tempo_resposta_ms: number | null; total_chamadas: number; erros_24h: number;
}

interface RegistroEnviado {
  id: string; tipo_recurso: string; identificador: string; paciente_nome: string;
  data_envio: string; status: "enviado" | "rejeitado" | "pendente" | "reprocessar";
  codigo_resposta: number | null; mensagem_retorno: string | null; tentativas: number;
}

interface EstatisticasRNDS {
  total_enviados_mes: number; total_rejeitados_mes: number; taxa_sucesso: number;
  recursos_por_tipo: Record<string, number>; historico_diario: { data: string; enviados: number; rejeitados: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const FHIR_COR: Record<string, string> = {
  ok: "#16a34a", erro: "#dc2626", nao_testado: "#9ca3af",
  online: "#16a34a", offline: "#dc2626", degradado: "#d97706",
  enviado: "#16a34a", rejeitado: "#dc2626", pendente: "#d97706", reprocessar: "#7c3aed",
};
const FHIR_ICON: Record<string, React.ElementType> = {
  ok: CheckCircle, erro: XCircle, nao_testado: Clock,
};

function Badge({ status, label }: { status: string; label?: string }) {
  const cor = FHIR_COR[status] || "#9ca3af";
  return (
    <span style={{ background: `${cor}18`, color: cor, fontSize: 9, fontWeight: 800,
      padding: "2px 8px", borderRadius: 20, border: `1px solid ${cor}35` }}>
      {label || status.toUpperCase()}
    </span>
  );
}

// ── Card Endpoint ─────────────────────────────────────────────────────────────

function CardEndpoint({ ep }: { ep: EndpointFHIR }) {
  const cor = FHIR_COR[ep.status];
  const Icon = FHIR_ICON[ep.status] || Clock;
  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}25`, borderLeft: `3px solid ${cor}`,
      borderRadius: 8, padding: "11px 14px", display: "flex", alignItems: "center", gap: 14 }}>
      <Icon size={16} color={cor} style={{ flexShrink: 0 }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>{ep.recurso}</span>
          <div style={{ display: "flex", gap: 4 }}>
            {ep.metodos.map(m => (
              <span key={m} style={{ fontSize: 9, fontFamily: "monospace", background: "#1351b415",
                color: "#1351b4", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>{m}</span>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }}>{ep.path}</div>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center", textAlign: "right" as const, flexShrink: 0 }}>
        {ep.tempo_resposta_ms !== null && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: ep.tempo_resposta_ms < 500 ? "#16a34a" : "#d97706" }}>
              {ep.tempo_resposta_ms}ms
            </div>
            <div style={{ fontSize: 9, color: "#9ca3af" }}>latência</div>
          </div>
        )}
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#374151" }}>{ep.total_chamadas.toLocaleString("pt-BR")}</div>
          <div style={{ fontSize: 9, color: "#9ca3af" }}>chamadas</div>
        </div>
        {ep.erros_24h > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#dc2626" }}>{ep.erros_24h}</div>
            <div style={{ fontSize: 9, color: "#9ca3af" }}>erros/24h</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card Registro ─────────────────────────────────────────────────────────────

function CardRegistro({ r, onReprocess }: { r: RegistroEnviado; onReprocess: (id: string) => void }) {
  const cor = FHIR_COR[r.status];
  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}25`, borderLeft: `3px solid ${cor}`,
      borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: 12 }}>{r.paciente_nome}</span>
          <Badge status={r.status} label={{ enviado:"Enviado",rejeitado:"Rejeitado",pendente:"Pendente",reprocessar:"Reprocessar" }[r.status]}/>
          <span style={{ fontSize: 9, background: "#eff6ff", color: "#1d4ed8", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
            {r.tipo_recurso}
          </span>
        </div>
        <div style={{ fontSize: 10, color: "#9ca3af" }}>
          ID: <span style={{ fontFamily: "monospace" }}>{r.identificador}</span> · Enviado {r.data_envio}
          {r.codigo_resposta && ` · HTTP ${r.codigo_resposta}`}
          {r.tentativas > 1 && ` · ${r.tentativas} tentativas`}
        </div>
        {r.mensagem_retorno && r.status === "rejeitado" && (
          <div style={{ fontSize: 10, color: "#dc2626", marginTop: 3, fontFamily: "monospace",
            background: "#fef2f2", padding: "2px 6px", borderRadius: 4 }}>
            {r.mensagem_retorno}
          </div>
        )}
      </div>
      {r.status === "rejeitado" && (
        <button onClick={() => onReprocess(r.id)}
          style={{ padding: "5px 12px", fontSize: 11, borderRadius: 6, border: "1px solid #7c3aed",
            background: "#faf5ff", color: "#7c3aed", cursor: "pointer", fontWeight: 700, flexShrink: 0 }}>
          Reprocessar
        </button>
      )}
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function GatewayRNDS() {
  const [abaAtiva, setAbaAtiva] = useState<"status"|"endpoints"|"registros"|"estatisticas">("status");
  const [filtroReg, setFiltroReg] = useState("todos");
  const [busca, setBusca] = useState("");
  const qc = useQueryClient();

  const { data: status, isLoading: loadStatus, refetch } = useQuery<StatusRNDS>({
    queryKey: ["rnds-status"],
    queryFn: () => apiGet("/api/rnds/status") as Promise<StatusRNDS>,
    staleTime: 30_000, refetchInterval: 60_000,
  });

  const { data: registros = [], isLoading: loadReg } = useQuery<RegistroEnviado[]>({
    queryKey: ["rnds-registros", filtroReg],
    queryFn: () => apiGet("/api/rnds/registros", { status: filtroReg !== "todos" ? filtroReg : undefined }) as Promise<RegistroEnviado[]>,
    staleTime: 60_000,
  });

  const { data: stats } = useQuery<EstatisticasRNDS>({
    queryKey: ["rnds-estatisticas"],
    queryFn: () => apiGet("/api/rnds/estatisticas") as Promise<EstatisticasRNDS>,
    staleTime: 120_000,
  });

  const testarConexao = useMutation({
    mutationFn: () => apiPost("/api/rnds/testar-conexao"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rnds-status"] }); },
  });

  const reprocessar = useMutation({
    mutationFn: (id: string) => apiPost(`/api/rnds/registros/${id}/reprocessar`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rnds-registros"] }); },
  });

  const s = status;
  const corConexao = s ? FHIR_COR[s.conexao] : "#9ca3af";

  const regVisiveis = registros.filter(r =>
    !busca || r.paciente_nome.toLowerCase().includes(busca.toLowerCase()) ||
    r.identificador.includes(busca) || r.tipo_recurso.toLowerCase().includes(busca.toLowerCase())
  );

  const ABAS = [
    { id: "status" as const, label: "Status e Certificado" },
    { id: "endpoints" as const, label: `Endpoints FHIR (${s?.endpoints.length ?? 0})` },
    { id: "registros" as const, label: `Registros (${registros.length})` },
    { id: "estatisticas" as const, label: "Estatísticas" },
  ];

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#3730a3 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}>
                <Network size={18} color="#fff"/>
              </div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Gateway RNDS · FHIR R4</span>
              {s && (
                <span style={{ background: `${corConexao}25`, color: corConexao, borderRadius: 6,
                  padding: "2px 10px", fontSize: 11, fontWeight: 700, border: `1px solid ${corConexao}50` }}>
                  {s.conexao === "online" ? "● Online" : s.conexao === "degradado" ? "◐ Degradado" : "○ Offline"}
                </span>
              )}
              {s && (
                <span style={{ background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.7)", borderRadius: 6,
                  padding: "2px 10px", fontSize: 10, fontWeight: 600 }}>
                  {s.ambiente === "producao" ? "🟢 Produção" : "🟡 Homologação"} · FHIR {s.versao_fhir}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Rede Nacional de Dados em Saúde · mTLS · Certificado ICP-Brasil · CONASS/CONASEMS
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => testarConexao.mutate()} disabled={testarConexao.isPending}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)",
                color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 14px",
                cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              <Zap size={12}/>{testarConexao.isPending ? "Testando..." : "Testar Conexão"}
            </button>
            <button onClick={() => refetch()}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.1)",
                color: "#fff", border: "1px solid rgba(255,255,255,.2)", borderRadius: 8, padding: "8px 14px",
                cursor: "pointer", fontSize: 12 }}>
              <RefreshCw size={12}/>
            </button>
          </div>
        </div>

        {/* KPIs */}
        {s && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginTop: 16 }}>
            {[
              { label: "Latência RNDS", val: `${s.latencia_ms}ms`, cor: s.latencia_ms < 300 ? "#86efac" : "#fde68a" },
              { label: "mTLS", val: s.mtls_valido ? "✓ Válido" : "✗ Inválido", cor: s.mtls_valido ? "#86efac" : "#fca5a5" },
              { label: "Certificado", val: `${s.certificado_dias_restantes}d`, cor: s.certificado_dias_restantes > 60 ? "#86efac" : s.certificado_dias_restantes > 30 ? "#fde68a" : "#fca5a5" },
              { label: "Auth Token", val: s.autenticacao === "ok" ? "✓ OK" : "✗ Erro", cor: s.autenticacao === "ok" ? "#86efac" : "#fca5a5" },
              { label: "Último Ping", val: s.ultimo_ping, cor: "#bfdbfe" },
            ].map(k => (
              <div key={k.label} style={{ background: "rgba(255,255,255,.1)", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: k.cor }}>{k.val}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.55)" }}>{k.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Abas */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e4e7ec", padding: "0 28px", display: "flex" }}>
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAbaAtiva(a.id)}
            style={{ padding: "12px 18px", fontSize: 13, fontWeight: abaAtiva===a.id ? 700 : 400,
              background: "none", border: "none", borderBottom: abaAtiva===a.id ? "2px solid #3730a3" : "2px solid transparent",
              color: abaAtiva===a.id ? "#3730a3" : "#6b7280", cursor: "pointer" }}>
            {a.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>

        {/* ── ABA STATUS ── */}
        {abaAtiva === "status" && s && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Certificado mTLS */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Shield size={16} color="#3730a3"/>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Certificado mTLS · ICP-Brasil</span>
              </div>
              {[
                { label: "Tipo", val: "Certificado Digital ICP-Brasil A3" },
                { label: "Validade", val: s.certificado_validade },
                { label: "Dias restantes", val: `${s.certificado_dias_restantes} dias`, destaque: true, cor: s.certificado_dias_restantes > 60 ? "#16a34a" : "#d97706" },
                { label: "mTLS ativo", val: s.mtls_valido ? "Sim — bidirecional" : "Não", destaque: true, cor: s.mtls_valido ? "#16a34a" : "#dc2626" },
                { label: "Emitente", val: "AC DATAPREV RFB v4" },
                { label: "Algoritmo", val: "RSA 2048 / SHA-256" },
              ].map(i => (
                <div key={i.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0",
                  borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{i.label}</span>
                  <span style={{ fontSize: 12, fontWeight: i.destaque ? 700 : 400, color: i.cor || "#374151" }}>{i.val}</span>
                </div>
              ))}
              {s.certificado_dias_restantes <= 60 && (
                <div style={{ marginTop: 12, background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 12px", fontSize: 11, color: "#92400e" }}>
                  ⚠ Certificado vence em {s.certificado_dias_restantes} dias. Solicitar renovação à DATAPREV/RFB.
                </div>
              )}
            </div>

            {/* Auth OAUTH2 */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Server size={16} color="#3730a3"/>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Autenticação OAuth 2.0</span>
              </div>
              {[
                { label: "Status", val: s.autenticacao === "ok" ? "✓ Token válido" : "✗ Erro", cor: s.autenticacao === "ok" ? "#16a34a" : "#dc2626" },
                { label: "Token expira", val: s.token_expira },
                { label: "Fluxo", val: "Client Credentials" },
                { label: "Endpoint", val: "/api/contexto-atendimento-v1", mono: true },
                { label: "Ambiente", val: s.ambiente === "producao" ? "Produção RNDS" : "Homologação" },
                { label: "Último ping", val: s.ultimo_ping },
              ].map(i => (
                <div key={i.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "7px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{i.label}</span>
                  <span style={{ fontSize: 12, fontWeight: i.cor ? 700 : 400, color: i.cor || "#374151",
                    fontFamily: i.mono ? "monospace" : "inherit" }}>{i.val}</span>
                </div>
              ))}
            </div>

            {/* Recursos FHIR suportados */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px", gridColumn: "1 / -1" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Recursos FHIR R4 — Mapa de Implementação</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
                {[
                  { recurso: "Patient", status: "implementado", descricao: "Cadastro CADSUS/RNDS" },
                  { recurso: "Immunization", status: "implementado", descricao: "Registro de vacinas" },
                  { recurso: "AllergyIntolerance", status: "implementado", descricao: "Alergias e intolerâncias" },
                  { recurso: "Condition", status: "parcial", descricao: "Diagnósticos CID-10" },
                  { recurso: "Procedure", status: "parcial", descricao: "Procedimentos SIGTAP" },
                  { recurso: "MedicationRequest", status: "planejado", descricao: "Prescrições eletrônicas" },
                  { recurso: "Observation", status: "planejado", descricao: "Sinais vitais / LOINC" },
                  { recurso: "DiagnosticReport", status: "planejado", descricao: "Laudos laboratoriais" },
                  { recurso: "Encounter", status: "planejado", descricao: "Atendimentos eSUS PEC" },
                ].map(r => {
                  const cor = r.status === "implementado" ? "#16a34a" : r.status === "parcial" ? "#d97706" : "#9ca3af";
                  return (
                    <div key={r.recurso} style={{ background: `${cor}08`, border: `1px solid ${cor}25`, borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 12, color: "#374151" }}>{r.recurso}</span>
                        <span style={{ fontSize: 9, fontWeight: 800, color: cor }}>
                          {r.status === "implementado" ? "✓ OK" : r.status === "parcial" ? "⚡ Parcial" : "○ Planejado"}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>{r.descricao}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 10, color: "#9ca3af" }}>
                {[{c:"#16a34a",l:"Implementado"},{c:"#d97706",l:"Parcial"},{c:"#9ca3af",l:"Planejado (Fase 4)"}].map(x=>(
                  <span key={x.l} style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{width:8,height:8,borderRadius:2,background:x.c,display:"inline-block"}}/>{x.l}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ABA ENDPOINTS ── */}
        {abaAtiva === "endpoints" && s && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {s.endpoints.map((ep, i) => <CardEndpoint key={i} ep={ep}/>)}
          </div>
        )}

        {/* ── ABA REGISTROS ── */}
        {abaAtiva === "registros" && (
          <>
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px",
              marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafc",
                border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 12px" }}>
                <Search size={12} color="#9ca3af"/>
                <input value={busca} onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar paciente, ID ou recurso..."
                  style={{ border: "none", outline: "none", fontSize: 12, width: 220, background: "transparent" }}/>
              </div>
              {["todos","enviado","pendente","rejeitado","reprocessar"].map(f => (
                <button key={f} onClick={() => setFiltroReg(f)}
                  style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20,
                    border: `1px solid ${filtroReg===f?"#3730a3":"#d1d5db"}`,
                    background: filtroReg===f?"#ede9fe":"#fff",
                    color: filtroReg===f?"#3730a3":"#374151", cursor: "pointer", fontWeight: filtroReg===f?700:400 }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>{regVisiveis.length} registros</span>
            </div>
            {loadReg
              ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando registros RNDS...</div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {regVisiveis.map(r => <CardRegistro key={r.id} r={r} onReprocess={id => reprocessar.mutate(id)}/>)}
                  {regVisiveis.length === 0 && (
                    <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>Nenhum registro encontrado.</div>
                  )}
                </div>
            }
          </>
        )}

        {/* ── ABA ESTATÍSTICAS ── */}
        {abaAtiva === "estatisticas" && stats && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Resumo mensal */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Resumo do Mês</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { label: "Enviados", val: stats.total_enviados_mes, cor: "#1351b4" },
                  { label: "Rejeitados", val: stats.total_rejeitados_mes, cor: "#dc2626" },
                  { label: "Taxa Sucesso", val: `${stats.taxa_sucesso}%`, cor: stats.taxa_sucesso >= 95 ? "#16a34a" : "#d97706" },
                ].map(k => (
                  <div key={k.label} style={{ textAlign: "center", background: `${k.cor}08`,
                    border: `1px solid ${k.cor}20`, borderRadius: 8, padding: "14px 8px" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: k.cor }}>{k.val}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{k.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, fontWeight: 600, fontSize: 12, marginBottom: 10 }}>Por Tipo de Recurso</div>
              {Object.entries(stats.recursos_por_tipo).map(([tipo, qtd]) => (
                <div key={tipo} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "#374151", minWidth: 130 }}>{tipo}</span>
                  <div style={{ flex: 1, height: 6, background: "#e5e7eb", borderRadius: 3 }}>
                    <div style={{ width: `${Math.min((qtd/stats.total_enviados_mes)*100,100)}%`,
                      height: "100%", background: "#3730a3", borderRadius: 3 }}/>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", minWidth: 40, textAlign: "right" as const }}>{qtd}</span>
                </div>
              ))}
            </div>

            {/* Histórico diário */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Histórico Diário — Últimos 10 dias</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 100 }}>
                {stats.historico_diario.map((d, i) => {
                  const maxEnv = Math.max(...stats.historico_diario.map(x => x.enviados));
                  const hEnv = maxEnv > 0 ? (d.enviados / maxEnv) * 90 : 0;
                  const hRej = d.rejeitados > 0 ? Math.max(4, (d.rejeitados / maxEnv) * 90) : 0;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 1, width: "100%" }}>
                        <div style={{ flex: 1, height: Math.max(4, hEnv), background: "#3730a3", borderRadius: "2px 2px 0 0", opacity: 0.85 }}/>
                        {hRej > 0 && <div style={{ flex: 1, height: hRej, background: "#dc2626", borderRadius: "2px 2px 0 0" }}/>}
                      </div>
                      <div style={{ fontSize: 8, color: "#9ca3af", whiteSpace: "nowrap" as const }}>{d.data.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 10, color: "#9ca3af" }}>
                <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:"#3730a3",display:"inline-block"}}/>Enviados</span>
                <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:"#dc2626",display:"inline-block"}}/>Rejeitados</span>
              </div>
            </div>
          </div>
        )}

        {loadStatus && abaAtiva === "status" && (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Consultando RNDS...</div>
        )}
      </div>
    </div>
  );
}
