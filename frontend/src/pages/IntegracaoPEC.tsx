// src/pages/IntegracaoPEC.tsx — Configurações → Integrações → PEC e-SUS APS
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plug, Zap, RefreshCw, RotateCcw, CheckCircle, XCircle, HelpCircle, Shield } from "lucide-react";
import { apiGet, apiPost } from "../lib/api";

interface StatusPEC {
  ambiente: "homologacao" | "producao";
  base_url: string | null;
  https_ativo: boolean;
  credencial_configurada: boolean;
  integracao_habilitada: boolean;
  situacao_conexao: boolean | null;   // null = nunca testado / desativado
  mensagem: string;
  ledi_version: string | null;
  mivdt_version: string | null;
  verificado_em: string;
}

interface SituacaoPEC {
  cadastros_sincronizados: {
    equipes: number; profissionais: number; microareas: number; domicilios: number; cidadaos: number;
  };
  ultima_sincronizacao: string | null;
  ultimo_envio_pec: string | null;
  registros_aceitos: number;
  registros_rejeitados: number;
  erros_recentes: { acao: string; detalhe: string; criado_em: string }[];
}

function corConexao(s: boolean | null) {
  if (s === true) return "#16a34a";
  if (s === false) return "#dc2626";
  return "#9ca3af";
}

function IconeConexao({ s }: { s: boolean | null }) {
  const cor = corConexao(s);
  if (s === true) return <CheckCircle size={16} color={cor} />;
  if (s === false) return <XCircle size={16} color={cor} />;
  return <HelpCircle size={16} color={cor} />;
}

function LinhaInfo({ label, valor, mono, destaqueCor }: { label: string; valor: string; mono?: boolean; destaqueCor?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: destaqueCor ? 700 : 400, color: destaqueCor || "#374151", fontFamily: mono ? "monospace" : "inherit" }}>
        {valor}
      </span>
    </div>
  );
}

function Botao({ onClick, disabled, cor, Icon, children }: { onClick: () => void; disabled?: boolean; cor: string; Icon: React.ElementType; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: "flex", alignItems: "center", gap: 6, background: disabled ? "#e5e7eb" : `${cor}15`,
        color: disabled ? "#9ca3af" : cor, border: `1px solid ${disabled ? "#e5e7eb" : cor}40`, borderRadius: 8,
        padding: "8px 14px", cursor: disabled ? "default" : "pointer", fontSize: 12, fontWeight: 700 }}>
      <Icon size={13} />{children}
    </button>
  );
}

export default function IntegracaoPEC() {
  const qc = useQueryClient();

  const { data: status, isLoading: carregandoStatus } = useQuery<StatusPEC>({
    queryKey: ["integracao-pec-status"],
    queryFn: () => apiGet("/api/integracao-pec/status") as Promise<StatusPEC>,
    staleTime: 30_000,
  });

  const { data: situacao, isLoading: carregandoSituacao } = useQuery<SituacaoPEC>({
    queryKey: ["integracao-pec-situacao"],
    queryFn: () => apiGet("/api/integracao-pec/situacao") as Promise<SituacaoPEC>,
    staleTime: 30_000,
  });

  const testarConexao = useMutation({
    mutationFn: () => apiPost("/api/integracao-pec/testar-conexao"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integracao-pec-status"] }),
  });

  const sincronizarCadastros = useMutation({
    mutationFn: () => apiPost("/api/integracao-pec/sincronizar-cadastros"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integracao-pec-situacao"] }),
  });

  const consultarSituacao = useMutation({
    mutationFn: () => apiGet("/api/integracao-pec/situacao"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integracao-pec-situacao"] }),
  });

  const reprocessarPendencias = useMutation({
    mutationFn: () => apiPost("/api/integracao-pec/reprocessar-pendencias"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integracao-pec-situacao"] }),
  });

  const s = status;
  const sit = situacao;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0c4a6e 0%,#075985 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" as const, gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}>
                <Plug size={18} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Configurações · Integrações · PEC e-SUS APS</span>
              {s && (
                <span style={{ background: `${corConexao(s.situacao_conexao)}25`, color: corConexao(s.situacao_conexao),
                  borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700, border: `1px solid ${corConexao(s.situacao_conexao)}50` }}>
                  {s.situacao_conexao === true ? "● Conectado" : s.situacao_conexao === false ? "● Falha" : "○ Não testado"}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              O PEC e-SUS APS permanece a base oficial de cadastro — esta tela apenas monitora e sincroniza, nunca escreve diretamente no PEC.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
            <Botao onClick={() => testarConexao.mutate()} disabled={testarConexao.isPending} cor="#0ea5e9" Icon={Zap}>
              {testarConexao.isPending ? "Testando..." : "Testar Conexão"}
            </Botao>
            <Botao onClick={() => sincronizarCadastros.mutate()} disabled={sincronizarCadastros.isPending} cor="#7c3aed" Icon={RefreshCw}>
              {sincronizarCadastros.isPending ? "Sincronizando..." : "Sincronizar Cadastros"}
            </Botao>
            <Botao onClick={() => consultarSituacao.mutate()} disabled={consultarSituacao.isPending} cor="#0284c7" Icon={HelpCircle}>
              Consultar Situação
            </Botao>
            <Botao onClick={() => reprocessarPendencias.mutate()} disabled={reprocessarPendencias.isPending} cor="#d97706" Icon={RotateCcw}>
              Reprocessar Pendências
            </Botao>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 28px 60px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Conexão e configuração */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Shield size={16} color="#075985" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Conexão e Configuração</span>
          </div>
          {carregandoStatus || !s ? (
            <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Consultando status...</div>
          ) : (
            <>
              <LinhaInfo label="Ambiente" valor={s.ambiente === "producao" ? "Produção" : "Homologação"} destaqueCor={s.ambiente === "producao" ? "#dc2626" : "#d97706"} />
              <LinhaInfo label="Endereço da instalação" valor={s.base_url || "não configurado"} mono />
              <LinhaInfo label="HTTPS ativo" valor={s.https_ativo ? "Sim" : "Não"} destaqueCor={s.https_ativo ? "#16a34a" : "#dc2626"} />
              <LinhaInfo label="Credencial configurada" valor={s.credencial_configurada ? "Sim" : "Não"} destaqueCor={s.credencial_configurada ? "#16a34a" : "#dc2626"} />
              <LinhaInfo label="Integração habilitada" valor={s.integracao_habilitada ? "Sim" : "Não (ESUS_INTEGRATION_ENABLED=false)"} destaqueCor={s.integracao_habilitada ? "#16a34a" : "#9ca3af"} />
              <LinhaInfo label="Versão LEDI" valor={s.ledi_version || "não definida"} />
              <LinhaInfo label="Versão MIVDT" valor={s.mivdt_version || "não definida"} />
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12, background: "#f8fafc",
                border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px" }}>
                <IconeConexao s={s.situacao_conexao} />
                <span style={{ fontSize: 11, color: "#6b7280" }}>{s.mensagem}</span>
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 8 }}>
                Verificado em {new Date(s.verificado_em).toLocaleString("pt-BR")}
              </div>
            </>
          )}
        </div>

        {/* Situação de sincronização/transmissão */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <RefreshCw size={16} color="#075985" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Sincronização e Transmissão</span>
          </div>
          {carregandoSituacao || !sit ? (
            <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Consultando situação...</div>
          ) : (
            <>
              <LinhaInfo label="Última sincronização" valor={sit.ultima_sincronizacao ? new Date(sit.ultima_sincronizacao).toLocaleString("pt-BR") : "nunca sincronizado"} />
              <LinhaInfo label="Último envio ao PEC" valor={sit.ultimo_envio_pec ? new Date(sit.ultimo_envio_pec).toLocaleString("pt-BR") : "nenhum envio"} />
              <LinhaInfo label="Registros aceitos" valor={String(sit.registros_aceitos)} destaqueCor="#16a34a" />
              <LinhaInfo label="Registros rejeitados" valor={String(sit.registros_rejeitados)} destaqueCor={sit.registros_rejeitados > 0 ? "#dc2626" : undefined} />

              <div style={{ marginTop: 14, fontWeight: 600, fontSize: 12, marginBottom: 8 }}>Cadastros sincronizados (cache local)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
                {[
                  { label: "Equipes", val: sit.cadastros_sincronizados.equipes },
                  { label: "Profissionais", val: sit.cadastros_sincronizados.profissionais },
                  { label: "Microáreas", val: sit.cadastros_sincronizados.microareas },
                  { label: "Domicílios", val: sit.cadastros_sincronizados.domicilios },
                  { label: "Cidadãos", val: sit.cadastros_sincronizados.cidadaos },
                ].map(c => (
                  <div key={c.label} style={{ textAlign: "center", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "8px 4px" }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#075985" }}>{c.val}</div>
                    <div style={{ fontSize: 9, color: "#9ca3af" }}>{c.label}</div>
                  </div>
                ))}
              </div>

              {sit.erros_recentes.length > 0 && (
                <>
                  <div style={{ marginTop: 14, fontWeight: 600, fontSize: 12, marginBottom: 8 }}>Erros recentes</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" as const }}>
                    {sit.erros_recentes.map((e, i) => (
                      <div key={i} style={{ fontSize: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "6px 8px" }}>
                        <span style={{ fontWeight: 700, color: "#dc2626" }}>{e.acao}</span> — {e.detalhe}
                        <div style={{ color: "#9ca3af", marginTop: 2 }}>{new Date(e.criado_em).toLocaleString("pt-BR")}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
