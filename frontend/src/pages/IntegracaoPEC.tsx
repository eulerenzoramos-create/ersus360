// src/pages/IntegracaoPEC.tsx — Integração e-SUS PEC
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plug, Zap, RefreshCw, CheckCircle, XCircle, HelpCircle,
  AlertTriangle, Database, Activity, Settings, ChevronRight,
  Server, Shield, BarChart2,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface StatusPEC {
  verificado_em: string;
  municipio: string;
  ibge: string;
  pec_local: {
    configurada: boolean;
    testada: boolean;
    online: boolean | null;
    mensagem: string;
    url: string | null;
  };
  egestor_aps: {
    disponivel: boolean;
    ultima_parcela: string | null;
    nota: string;
  };
  env_vars: Record<string, { configurada: boolean; valor_exemplo: string }>;
  instrucoes_configuracao: Record<string, string>;
}

interface IndicadoresQualidade {
  fonte: string;
  nota: string;
  competencia_referencia: string;
  nu_parcela: string;
  coletado_em: string;
  indicadores: {
    qualidade_esf:    { classificacao: string | null; nivel?: string; situacao_dado: string };
    qualidade_emulti: { classificacao: string | null; nivel?: string; situacao_dado: string };
    vinculo:          { classificacao: string | null; nivel?: string; situacao_dado: string };
    equidade_estrato: { estrato: string | null; situacao_dado: string };
  };
  equipes_referencia: {
    esf:   { pagas: number | null; teto: number | null; situacao_dado: string };
    emulti: { pagas: number | null; situacao_dado: string };
    esb:   { pagas: number | null; teto: number | null; situacao_dado: string };
    acs:   { pagos: number | null; situacao_dado: string };
  };
}

interface SituacaoPEC {
  verificado_em: string;
  pec_local: { situacao_dado: string; nota?: string; contagens?: Record<string, number> };
  egestor_aps: {
    situacao_dado: string;
    parcelas_ciclo_2026: number;
    ultima_parcela: string | null;
    nota: string;
  };
}

// ─── Helpers visuais ─────────────────────────────────────────────────────────

type StatusConexao = true | false | null;

function corStatus(s: StatusConexao) {
  if (s === true)  return "#16a34a";
  if (s === false) return "#dc2626";
  return "#9ca3af";
}

function IconStatus({ s }: { s: StatusConexao }) {
  if (s === true)  return <CheckCircle size={15} color="#16a34a" />;
  if (s === false) return <XCircle    size={15} color="#dc2626" />;
  return <HelpCircle size={15} color="#9ca3af" />;
}

function BadgeNivel({ nivel, texto }: { nivel?: string; texto?: string | null }) {
  if (!texto) return <span style={{ color: "#9ca3af", fontSize: 11 }}>—</span>;
  const cores: Record<string, { bg: string; txt: string }> = {
    success: { bg: "#dcfce7", txt: "#15803d" },
    warning: { bg: "#fef9c3", txt: "#854d0e" },
    danger:  { bg: "#fee2e2", txt: "#b91c1c" },
    neutral: { bg: "#f1f5f9", txt: "#475569" },
  };
  const c = cores[nivel || "neutral"] || cores.neutral;
  return (
    <span style={{
      background: c.bg, color: c.txt,
      borderRadius: 6, padding: "2px 10px",
      fontSize: 11, fontWeight: 700,
    }}>
      {texto}
    </span>
  );
}

function LinhaInfo({ label, valor, mono, destaque }: {
  label: string; valor: string; mono?: boolean; destaque?: string
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "7px 0", borderBottom: "1px solid #f1f5f9",
    }}>
      <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
      <span style={{
        fontSize: 12, fontWeight: destaque ? 700 : 400,
        color: destaque || "#374151",
        fontFamily: mono ? "monospace" : "inherit",
      }}>
        {valor}
      </span>
    </div>
  );
}

function Card({ children, titulo, Icon }: {
  children: React.ReactNode; titulo: string; Icon: React.ElementType;
}) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e4e7ec",
      borderRadius: 12, padding: "18px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Icon size={16} color="#075985" />
        <span style={{ fontWeight: 700, fontSize: 14 }}>{titulo}</span>
      </div>
      {children}
    </div>
  );
}

function Btn({ onClick, disabled, cor, Icon, children }: {
  onClick: () => void; disabled?: boolean; cor: string; Icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "flex", alignItems: "center", gap: 6,
      background: disabled ? "#e5e7eb" : `${cor}15`,
      color: disabled ? "#9ca3af" : cor,
      border: `1px solid ${disabled ? "#e5e7eb" : cor}40`,
      borderRadius: 8, padding: "8px 14px",
      cursor: disabled ? "default" : "pointer",
      fontSize: 12, fontWeight: 700,
    }}>
      <Icon size={13} />{children}
    </button>
  );
}

// ─── Abas ────────────────────────────────────────────────────────────────────

const ABAS = [
  { id: "status",      label: "Status",              Icon: Plug },
  { id: "qualidade",   label: "Indicadores de Qualidade", Icon: BarChart2 },
  { id: "producao",    label: "Produção APS",          Icon: Activity },
  { id: "config",      label: "Configuração",          Icon: Settings },
];

// ─── Sub-tela: Status ─────────────────────────────────────────────────────────

function AbaStatus({ status, sit, testar, sinc }: {
  status: StatusPEC | undefined;
  sit: SituacaoPEC | undefined;
  testar: { mutate: () => void; isPending: boolean; data?: { online: boolean; mensagem: string } };
  sinc: { mutate: () => void; isPending: boolean };
}) {
  const s = status;
  const pec = s?.pec_local;
  const eg = s?.egestor_aps;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* PEC Local */}
      <Card titulo="PEC e-SUS — Instância Local" Icon={Server}>
        {!s ? (
          <div style={{ color: "#9ca3af", textAlign: "center", padding: 24 }}>Consultando...</div>
        ) : (
          <>
            <LinhaInfo
              label="Status"
              valor={pec?.online === true ? "Online" : pec?.online === false ? "Offline" : "Não testado"}
              destaque={pec?.online === true ? "#16a34a" : pec?.online === false ? "#dc2626" : undefined}
            />
            <LinhaInfo
              label="URL configurada"
              valor={pec?.url || "Não configurada"}
              mono
            />
            <LinhaInfo
              label="Credenciais"
              valor={pec?.configurada ? "Configuradas" : "Não configuradas"}
              destaque={pec?.configurada ? "#16a34a" : "#dc2626"}
            />
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12,
              background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px",
            }}>
              <IconStatus s={pec?.online ?? null} />
              <span style={{ fontSize: 11, color: "#6b7280" }}>{pec?.mensagem}</span>
            </div>
            {testar.data && (
              <div style={{
                marginTop: 8, padding: "8px 12px", borderRadius: 8,
                background: testar.data.online ? "#dcfce7" : "#fee2e2",
                border: `1px solid ${testar.data.online ? "#bbf7d0" : "#fecaca"}`,
                fontSize: 11, color: testar.data.online ? "#15803d" : "#b91c1c",
              }}>
                {testar.data.mensagem}
              </div>
            )}
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 8 }}>
              Verificado em {s ? new Date(s.verificado_em).toLocaleString("pt-BR") : "—"}
            </div>
          </>
        )}
      </Card>

      {/* e-Gestor APS */}
      <Card titulo="e-Gestor APS — Indicadores de Qualidade" Icon={Database}>
        {!s ? (
          <div style={{ color: "#9ca3af", textAlign: "center", padding: 24 }}>Consultando...</div>
        ) : (
          <>
            <LinhaInfo
              label="Disponibilidade"
              valor={eg?.disponivel ? "Online" : "Indisponível"}
              destaque={eg?.disponivel ? "#16a34a" : "#dc2626"}
            />
            <LinhaInfo
              label="Última competência"
              valor={eg?.ultima_parcela || "—"}
            />
            <div style={{
              marginTop: 12, background: "#f0f9ff", border: "1px solid #bae6fd",
              borderRadius: 8, padding: "10px 12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <CheckCircle size={13} color="#0284c7" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#0284c7" }}>Sempre disponível</span>
              </div>
              <p style={{ fontSize: 11, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
                {eg?.nota}
              </p>
            </div>
          </>
        )}
      </Card>

      {/* Situação de sincronização */}
      <Card titulo="Sincronização" Icon={RefreshCw}>
        {!sit ? (
          <div style={{ color: "#9ca3af", textAlign: "center", padding: 24 }}>Consultando...</div>
        ) : (
          <>
            <LinhaInfo
              label="PEC local"
              valor={sit.pec_local.situacao_dado === "oficial_validado" ? "Sincronizado" : "Não sincronizado"}
              destaque={sit.pec_local.situacao_dado === "oficial_validado" ? "#16a34a" : "#9ca3af"}
            />
            <LinhaInfo
              label="Parcelas e-Gestor 2026"
              valor={`${sit.egestor_aps.parcelas_ciclo_2026} de 12 disponíveis`}
            />
            {sit.pec_local.nota && (
              <div style={{
                marginTop: 10, padding: "8px 10px", borderRadius: 8,
                background: "#fffbeb", border: "1px solid #fde68a",
                fontSize: 11, color: "#92400e",
              }}>
                <AlertTriangle size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
                {sit.pec_local.nota}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Fontes de dados */}
      <Card titulo="Fontes de Dados Ativas" Icon={Shield}>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
          {[
            {
              nome: "e-Gestor APS (relatorioaps-prd.saude.gov.br)",
              status: s?.egestor_aps.disponivel ?? false,
              descricao: "Financiamento + Indicadores de Qualidade APS (Portaria 3.493/2024)",
            },
            {
              nome: `PEC Local (${s?.pec_local.url || "não configurado"})`,
              status: s?.pec_local.online === true,
              descricao: "Fichas CDS, atendimentos, cadastros",
            },
          ].map((f) => (
            <div key={f.nome} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "8px 10px", borderRadius: 8,
              background: f.status ? "#f0fdf4" : "#fafafa",
              border: `1px solid ${f.status ? "#bbf7d0" : "#e5e7eb"}`,
            }}>
              <div style={{ paddingTop: 2 }}>
                {f.status
                  ? <CheckCircle size={14} color="#16a34a" />
                  : <XCircle size={14} color="#9ca3af" />}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{f.nome}</div>
                <div style={{ fontSize: 10, color: "#6b7280" }}>{f.descricao}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Sub-tela: Indicadores de Qualidade APS ──────────────────────────────────

function AbaQualidade({ data, isLoading }: { data: IndicadoresQualidade | undefined; isLoading: boolean }) {
  if (isLoading || !data) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
        Buscando indicadores no e-Gestor APS...
      </div>
    );
  }

  const { indicadores: ind, equipes_referencia: eq } = data;

  const linhasIndicadores = [
    { label: "Qualidade eSF",      ...ind.qualidade_esf,    extra: "" },
    { label: "Qualidade eMulti",   ...ind.qualidade_emulti, extra: "" },
    { label: "Indicador de Vínculo", ...ind.vinculo,        extra: "" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>

      {/* Banner fonte */}
      <div style={{
        background: "#f0f9ff", border: "1px solid #bae6fd",
        borderRadius: 10, padding: "12px 16px",
        display: "flex", alignItems: "flex-start", gap: 10,
      }}>
        <CheckCircle size={16} color="#0284c7" style={{ marginTop: 1 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: "#0284c7" }}>
            Fonte oficial: {data.fonte}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
            Competência de referência: <strong>{data.competencia_referencia}</strong> · {data.nota}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Indicadores de classificação */}
        <Card titulo="Classificação de Qualidade APS" Icon={BarChart2}>
          {linhasIndicadores.map((row) => (
            <div key={row.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: "1px solid #f1f5f9",
            }}>
              <span style={{ fontSize: 12, color: "#374151" }}>{row.label}</span>
              {row.situacao_dado === "oficial_validado"
                ? <BadgeNivel nivel={row.nivel} texto={row.classificacao} />
                : <span style={{ fontSize: 11, color: "#9ca3af" }}>não disponível</span>
              }
            </div>
          ))}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0",
          }}>
            <span style={{ fontSize: 12, color: "#374151" }}>Estrato de Equidade</span>
            {ind.equidade_estrato.situacao_dado === "oficial_validado"
              ? <BadgeNivel nivel="neutral" texto={ind.equidade_estrato.estrato} />
              : <span style={{ fontSize: 11, color: "#9ca3af" }}>não disponível</span>
            }
          </div>
        </Card>

        {/* Equipes de referência */}
        <Card titulo="Equipes — Referência de Pagamento" Icon={Activity}>
          {[
            { label: "eSF (Estratégia Saúde da Família)", pagas: eq.esf.pagas, teto: eq.esf.teto },
            { label: "eMulti (Equipe Multiprofissional)",  pagas: eq.emulti.pagas, teto: null },
            { label: "eSB (Saúde Bucal)",                  pagas: eq.esb.pagas, teto: eq.esb.teto },
            { label: "ACS (Agentes Comunitários)",          pagas: eq.acs.pagos, teto: null },
          ].map((e) => (
            <div key={e.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "7px 0", borderBottom: "1px solid #f1f5f9",
            }}>
              <span style={{ fontSize: 12, color: "#374151" }}>{e.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#075985" }}>
                {e.pagas !== null && e.pagas !== undefined
                  ? `${e.pagas}${e.teto ? ` / ${e.teto}` : ""}`
                  : <span style={{ color: "#9ca3af", fontWeight: 400 }}>—</span>}
              </span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 8 }}>
            Dados coletados em {new Date(data.coletado_em).toLocaleString("pt-BR")}
          </div>
        </Card>

      </div>

      {/* Nota explicativa */}
      <div style={{
        background: "#fffbeb", border: "1px solid #fde68a",
        borderRadius: 10, padding: "12px 16px",
      }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: "#92400e", marginBottom: 4 }}>
          Como estes indicadores se relacionam com o e-SUS PEC
        </div>
        <p style={{ fontSize: 11, color: "#78350f", margin: 0, lineHeight: 1.6 }}>
          Os indicadores de qualidade APS (classificação de qualidade eSF, eMulti, vínculo e estrato
          de equidade) são calculados pelo DATASUS mensalmente a partir das fichas CDS e PEC
          transmitidas pelo e-SUS PEC, com base na Portaria GM/MS nº 3.493/2024. São publicados
          no e-Gestor APS junto ao financiamento. Com o PEC local conectado ao ERSUS360 é possível
          acompanhar a evolução em tempo real antes da publicação oficial.
        </p>
      </div>
    </div>
  );
}

// ─── Sub-tela: Produção APS ───────────────────────────────────────────────────

function AbaProducao({ statusPec }: { statusPec: StatusPEC | undefined }) {
  const pecOnline = statusPec?.pec_local.online === true;

  if (!pecOnline) {
    return (
      <div style={{
        textAlign: "center", padding: "60px 40px",
        background: "#fff", borderRadius: 12, border: "1px solid #e4e7ec",
      }}>
        <Server size={40} color="#d1d5db" style={{ marginBottom: 16 }} />
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: "#374151" }}>
          PEC local não conectado
        </div>
        <p style={{ color: "#6b7280", fontSize: 13, maxWidth: 480, margin: "0 auto 20px" }}>
          Os dados de produção APS (fichas CDS, atendimentos individuais, visitas domiciliares)
          requerem conexão com a instância local do e-SUS PEC do município.
        </p>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: 8, padding: "10px 16px", fontSize: 12, color: "#92400e",
        }}>
          <AlertTriangle size={14} />
          Configure ESUS_PEC_URL, ESUS_USUARIO e ESUS_SENHA no Railway para habilitar.
        </div>
      </div>
    );
  }

  // PEC conectado — exibir resumo de fichas
  return (
    <div style={{
      background: "#fff", borderRadius: 12, border: "1px solid #e4e7ec",
      padding: "24px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Activity size={16} color="#075985" />
        <span style={{ fontWeight: 700, fontSize: 14 }}>Produção APS — PEC Local</span>
        <span style={{
          background: "#dcfce7", color: "#15803d",
          borderRadius: 6, padding: "1px 8px", fontSize: 10, fontWeight: 700,
        }}>● Conectado</span>
      </div>
      <p style={{ color: "#6b7280", fontSize: 12 }}>
        PEC local conectado. Os dados de produção (fichas CDS, atendimentos, cadastros)
        estão disponíveis via <code style={{ fontSize: 11 }}>/api/integracao-pec/situacao</code>.
        A exibição detalhada por ficha estará disponível na próxima versão.
      </p>
    </div>
  );
}

// ─── Sub-tela: Configuração ──────────────────────────────────────────────────

function AbaConfig({ status }: { status: StatusPEC | undefined }) {
  const vars = status?.env_vars || {};
  const inst = status?.instrucoes_configuracao || {};

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>

      <Card titulo="Variáveis de Ambiente — Railway" Icon={Settings}>
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 0, marginBottom: 16 }}>
          Configure estas variáveis no painel do Railway para habilitar a integração com o PEC local.
          O e-Gestor APS não requer configuração adicional.
        </p>
        {Object.entries(vars).map(([key, info]) => (
          <div key={key} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "9px 0", borderBottom: "1px solid #f1f5f9",
          }}>
            <div>
              <code style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{key}</code>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>ex: {info.valor_exemplo}</div>
            </div>
            {info.configurada
              ? <CheckCircle size={14} color="#16a34a" />
              : <XCircle    size={14} color="#dc2626" />}
          </div>
        ))}
      </Card>

      <Card titulo="Passo a passo" Icon={ChevronRight}>
        {Object.entries(inst).filter(([k]) => k.startsWith("passo")).map(([key, val]) => (
          <div key={key} style={{
            display: "flex", gap: 10, padding: "8px 0",
            borderBottom: "1px solid #f1f5f9",
          }}>
            <span style={{
              minWidth: 22, height: 22, borderRadius: "50%",
              background: "#075985", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700,
            }}>
              {key.replace("passo_", "")}
            </span>
            <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{val as string}</span>
          </div>
        ))}
        {inst.nota && (
          <div style={{
            marginTop: 12, padding: "10px 12px", borderRadius: 8,
            background: "#f0f9ff", border: "1px solid #bae6fd",
            fontSize: 11, color: "#0369a1",
          }}>
            {inst.nota}
          </div>
        )}
      </Card>

      <Card titulo="Sobre o e-SUS PEC" Icon={HelpCircle}>
        <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
          O <strong>e-SUS PEC</strong> (Prontuário Eletrônico do Cidadão) é o sistema de registro
          de atendimentos da Atenção Primária à Saúde do SUS. Ele é instalado localmente nos
          municípios e transmite fichas CDS ao SISAB/DATASUS. A integração direta requer que o
          servidor PEC seja acessível via HTTPS na internet (ou via túnel). Os indicadores de
          qualidade APS calculados a partir dos dados do PEC já estão disponíveis
          via e-Gestor APS, sem configuração adicional.
        </p>
      </Card>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function IntegracaoPEC() {
  const qc = useQueryClient();
  const [aba, setAba] = useState<"status" | "qualidade" | "producao" | "config">("status");

  const { data: statusData, isLoading: loadingStatus } = useQuery<StatusPEC>({
    queryKey: ["integracao-pec-status-v2"],
    queryFn: () => apiGet("/api/integracao-pec/status") as Promise<StatusPEC>,
    staleTime: 30_000,
  });

  const { data: qualidadeData, isLoading: loadingQualidade } = useQuery<IndicadoresQualidade>({
    queryKey: ["integracao-pec-qualidade"],
    queryFn: () => apiGet("/api/integracao-pec/indicadores-qualidade") as Promise<IndicadoresQualidade>,
    staleTime: 120_000,
  });

  const { data: situacaoData } = useQuery<SituacaoPEC>({
    queryKey: ["integracao-pec-situacao-v2"],
    queryFn: () => apiGet("/api/integracao-pec/situacao") as Promise<SituacaoPEC>,
    staleTime: 60_000,
  });

  const testar = useMutation({
    mutationFn: () => apiPost("/api/integracao-pec/testar-conexao") as Promise<{ online: boolean; mensagem: string }>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integracao-pec-status-v2"] });
    },
  });

  const sinc = useMutation({
    mutationFn: () => apiPost("/api/integracao-pec/sincronizar-cadastros"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integracao-pec-situacao-v2"] }),
  });

  const pecOnline = statusData?.pec_local.online === true;

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
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>
                Integração · e-SUS PEC
              </span>
              <span style={{
                background: pecOnline ? "rgba(22,163,74,.25)" : "rgba(156,163,175,.25)",
                color: pecOnline ? "#86efac" : "#d1d5db",
                borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700,
                border: `1px solid ${pecOnline ? "rgba(22,163,74,.4)" : "rgba(156,163,175,.4)"}`,
              }}>
                {pecOnline ? "● PEC Conectado" : "○ PEC não configurado"}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Apuí/AM · IBGE 130014 · O ERSUS360 não escreve no PEC — apenas lê e monitora.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
            <Btn onClick={() => testar.mutate()} disabled={testar.isPending} cor="#0ea5e9" Icon={Zap}>
              {testar.isPending ? "Testando..." : "Testar Conexão"}
            </Btn>
            <Btn onClick={() => sinc.mutate()} disabled={sinc.isPending} cor="#7c3aed" Icon={RefreshCw}>
              {sinc.isPending ? "Sincronizando..." : "Sincronizar"}
            </Btn>
            <Btn
              onClick={() => {
                qc.invalidateQueries({ queryKey: ["integracao-pec-status-v2"] });
                qc.invalidateQueries({ queryKey: ["integracao-pec-qualidade"] });
              }}
              cor="#059669" Icon={RefreshCw}
            >
              Atualizar
            </Btn>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 0, background: "#fff", borderBottom: "1px solid #e4e7ec", padding: "0 28px" }}>
        {ABAS.map(({ id, label, Icon }) => {
          const ativo = aba === id;
          return (
            <button key={id} onClick={() => setAba(id as typeof aba)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "12px 16px", fontSize: 13, fontWeight: ativo ? 700 : 400,
              color: ativo ? "#0369a1" : "#6b7280",
              background: "none", border: "none",
              borderBottom: ativo ? "2px solid #0369a1" : "2px solid transparent",
              cursor: "pointer",
            }}>
              <Icon size={14} />{label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      <div style={{ padding: "20px 28px 60px" }}>
        {aba === "status" && (
          <AbaStatus
            status={statusData}
            sit={situacaoData}
            testar={testar}
            sinc={sinc}
          />
        )}
        {aba === "qualidade" && (
          <AbaQualidade data={qualidadeData} isLoading={loadingQualidade} />
        )}
        {aba === "producao" && (
          <AbaProducao statusPec={statusData} />
        )}
        {aba === "config" && (
          <AbaConfig status={statusData} />
        )}
      </div>
    </div>
  );
}
