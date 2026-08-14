/**
 * CvatDashboard — Componente Vínculo e Acompanhamento Territorial
 * Página multimunicípio que usa /api/cvat/{ibge}/vinculo
 *
 * Regras ERSUS 360:
 *  - Nunca exibe dado não validado como se fosse real
 *  - Exibe o status de cada campo (situacao_dado) com cor e legenda
 *  - Proveniência completa disponível em painel expansível
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, MapPin, AlertTriangle, CheckCircle, Clock,
  RefreshCw, ChevronDown, ChevronRight, Info, Shield,
  Database, ExternalLink,
} from "lucide-react";
import { apiGet } from "../lib/api";
import { useMunicipioSeletor } from "../lib/municipio";
import MunicipioSeletor from "../components/MunicipioSeletor";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type SituacaoDado =
  | "oficial_validado" | "oficial_aguardando" | "divergente"
  | "rejeitado" | "nao_localizado" | "nao_disponivel"
  | "estimativa_autorizada" | "dado_nao_validado";

interface EquipeCVAT {
  ubs: string; equipe: string; tipo: string;
  K: number; H: number;
  ine?: string | null; cnes?: string | null;
  rejeicao_cnes?: boolean;
}

interface MetricasCVAT {
  total_equipes: number;
  total_vinculadas: number;
  total_acompanhadas: number;
  situacao_k: SituacaoDado;
  situacao_h: SituacaoDado;
  populacao_ibge_censo2022?: number;
  cobertura_vinculacao_pct?: number;
  sem_vinculo_estimado?: number;
  nota_sem_vinculo?: string;
  nota_h?: string;
  situacao_sem_vinculo?: SituacaoDado;
}

interface CvatResponse {
  municipio_ibge: string;
  competencia: string;
  situacao_dado: SituacaoDado;
  fonte?: string;
  mensagem?: string;
  instrucao?: string;
  metricas?: MetricasCVAT;
  equipes?: EquipeCVAT[];
  populacao_ibge?: { populacao: number | null; fonte: string; situacao: string };
  proveniencia?: Record<string, unknown>;
  consultado_em: string;
}

// ── Badges de situação ────────────────────────────────────────────────────────

const SITUACAO_CONFIG: Record<SituacaoDado, { label: string; cor: string; bg: string; icon: React.ReactNode }> = {
  oficial_validado:      { label: "Oficial validado",      cor: "#166534", bg: "#dcfce7", icon: <CheckCircle size={12}/> },
  oficial_aguardando:    { label: "Oficial — aguardando",  cor: "#854d0e", bg: "#fef3c7", icon: <Clock size={12}/> },
  divergente:            { label: "Divergente",             cor: "#9a3412", bg: "#ffedd5", icon: <AlertTriangle size={12}/> },
  rejeitado:             { label: "Rejeitado SCNES",        cor: "#991b1b", bg: "#fee2e2", icon: <AlertTriangle size={12}/> },
  nao_localizado:        { label: "Não localizado",         cor: "#6b21a8", bg: "#f3e8ff", icon: <Info size={12}/> },
  nao_disponivel:        { label: "Não disponível",         cor: "#475569", bg: "#f1f5f9", icon: <Info size={12}/> },
  estimativa_autorizada: { label: "Estimativa autorizada",  cor: "#1d4ed8", bg: "#dbeafe", icon: <Shield size={12}/> },
  dado_nao_validado:     { label: "Dado não validado",      cor: "#374151", bg: "#f9fafb", icon: <Database size={12}/> },
};

function SituacaoBadge({ s }: { s: SituacaoDado }) {
  const cfg = SITUACAO_CONFIG[s] ?? SITUACAO_CONFIG.dado_nao_validado;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
      color: cfg.cor, background: cfg.bg,
    }}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ── Card de métrica ───────────────────────────────────────────────────────────

function MetCard({
  label, valor, situacao, nota, cor = "#1e293b",
}: {
  label: string; valor: string | number | null; situacao: SituacaoDado;
  nota?: string; cor?: string;
}) {
  const [expandido, setExpandido] = useState(false);
  const semDado = valor === null || valor === undefined || situacao === "dado_nao_validado" || situacao === "nao_disponivel";

  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: "18px 20px",
      border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.05)",
    }}>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: semDado ? 14 : 28, fontWeight: 700, color: semDado ? "#94a3b8" : cor, marginBottom: 8 }}>
        {semDado ? "Dado não validado" : (typeof valor === "number" ? valor?.toLocaleString("pt-BR") : valor)}
      </div>
      <SituacaoBadge s={situacao} />
      {nota && (
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => setExpandido(!expandido)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, color: "#64748b", fontSize: 11 }}
          >
            {expandido ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
            Nota metodológica
          </button>
          {expandido && (
            <div style={{ marginTop: 6, padding: "8px 10px", background: "#f8fafc", borderRadius: 8, fontSize: 11, color: "#475569", lineHeight: 1.5 }}>
              {nota}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tabela de equipes ─────────────────────────────────────────────────────────

function TabelaEquipes({ equipes }: { equipes: EquipeCVAT[] }) {
  const th: React.CSSProperties = {
    padding: "8px 12px", background: "#f8fafc", fontSize: 11, fontWeight: 600,
    color: "#475569", textAlign: "left", borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  };
  const td: React.CSSProperties = {
    padding: "10px 12px", fontSize: 12, color: "#374151",
    borderBottom: "1px solid #f1f5f9",
  };
  const num: React.CSSProperties = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
        <thead>
          <tr>
            <th style={th}>UBS</th>
            <th style={th}>Equipe</th>
            <th style={th}>Tipo</th>
            <th style={{ ...th, textAlign: "right" }}>K — Vinculadas</th>
            <th style={{ ...th, textAlign: "right" }}>H — Acompanhadas</th>
            <th style={th}>INE</th>
            <th style={th}>CNES</th>
            <th style={th}>Situação SCNES</th>
          </tr>
        </thead>
        <tbody>
          {equipes.map((e, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
              <td style={td}>{e.ubs}</td>
              <td style={td}>{e.equipe}</td>
              <td style={td}><span style={{ fontSize: 11, padding: "2px 7px", background: "#eff6ff", color: "#1d4ed8", borderRadius: 6 }}>{e.tipo}</span></td>
              <td style={num}>{e.K > 0 ? e.K?.toLocaleString("pt-BR") : <span style={{ color: "#94a3b8" }}>—</span>}</td>
              <td style={num}>{e.H > 0 ? e.H?.toLocaleString("pt-BR") : <span style={{ color: "#94a3b8" }}>—</span>}</td>
              <td style={{ ...td, fontFamily: "monospace", fontSize: 11 }}>{e.ine ?? <span style={{ color: "#94a3b8" }}>Aguardando</span>}</td>
              <td style={{ ...td, fontFamily: "monospace", fontSize: 11 }}>{e.cnes ?? "—"}</td>
              <td style={td}>
                {e.rejeicao_cnes
                  ? <span style={{ fontSize: 11, color: "#991b1b", background: "#fee2e2", padding: "2px 7px", borderRadius: 6 }}>Rejeitado SCNES</span>
                  : <span style={{ fontSize: 11, color: "#166534", background: "#dcfce7", padding: "2px 7px", borderRadius: 6 }}>Regular</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Painel de proveniência ────────────────────────────────────────────────────

function PainelProveniencia({ prov }: { prov: Record<string, unknown> }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          display: "flex", alignItems: "center", gap: 6, background: "none",
          border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px",
          cursor: "pointer", fontSize: 12, color: "#475569",
        }}
      >
        <Database size={13} />
        {aberto ? "Ocultar" : "Ver"} proveniência completa
        {aberto ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
      </button>
      {aberto && (
        <div style={{ marginTop: 8, background: "#0f172a", borderRadius: 10, padding: 16, overflowX: "auto" }}>
          <pre style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
            {JSON.stringify(prov, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Estado sem dados ──────────────────────────────────────────────────────────

function SemDados({ dados }: { dados: CvatResponse }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "40px 32px", textAlign: "center",
      border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.05)",
    }}>
      <Database size={40} color="#cbd5e1" style={{ marginBottom: 16 }} />
      <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
        Dado não validado
      </div>
      <div style={{ fontSize: 13, color: "#64748b", maxWidth: 480, margin: "0 auto 20px", lineHeight: 1.6 }}>
        {dados.mensagem ?? "Aguardando acesso ou relatório oficial do SIAPS."}
      </div>
      {dados.instrucao && (
        <div style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10,
          padding: "12px 16px", fontSize: 12, color: "#166534", textAlign: "left",
          maxWidth: 520, margin: "0 auto",
        }}>
          <strong>Como obter dados reais:</strong><br />{dados.instrucao}
        </div>
      )}
      {dados.populacao_ibge?.populacao && (
        <div style={{ marginTop: 20, padding: "12px 20px", background: "#eff6ff", borderRadius: 10, display: "inline-block" }}>
          <div style={{ fontSize: 11, color: "#1d4ed8", fontWeight: 600 }}>IBGE Censo 2022 (disponível)</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#1e293b" }}>
            {dados.populacao_ibge.populacao?.toLocaleString("pt-BR")} hab.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

const COMPETENCIAS = ["202605","202604","202603","202602","202601","202512","202511","202510"];

export default function CvatDashboard() {
  const { ibge, setIbge } = useMunicipioSeletor();
  const [competencia, setCompetencia] = useState("202605");

  const { data, isLoading, isError, refetch, isFetching } = useQuery<CvatResponse>({
    queryKey: ["cvat-vinculo", ibge, competencia],
    queryFn: () => apiGet(`/api/cvat/${ibge}/vinculo?competencia=${competencia}`),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const temDados = data && data.equipes && data.equipes.length > 0;

  if (!isLoading && !data) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="CvatDashboard indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>

      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Users size={22} color="#1d4ed8" />
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e293b" }}>
              CVAT — Vínculo e Acompanhamento Territorial
            </h1>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Componente do Novo Financiamento APS · Portaria GM/MS 3.493/2024
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <MunicipioSeletor onChange={(novoIbge) => setIbge(novoIbge)} />

          <select
            value={competencia}
            onChange={e => setCompetencia(e.target.value)}
            style={{
              padding: "8px 12px", borderRadius: 10, border: "1.5px solid #cbd5e1",
              fontSize: 13, fontWeight: 600, color: "#1e293b", background: "#fff",
              cursor: "pointer",
            }}
          >
            {COMPETENCIAS.map(c => (
              <option key={c} value={c}>
                {c.slice(4)}/{c.slice(0,4)}
              </option>
            ))}
          </select>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff",
              cursor: isFetching ? "default" : "pointer", fontSize: 12, color: "#475569",
            }}
          >
            <RefreshCw size={13} style={{ animation: isFetching ? "spin 1s linear infinite" : "none" }} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Indicador município + competência */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
        padding: "8px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0",
        fontSize: 12, color: "#475569",
      }}>
        <MapPin size={13} color="#1d4ed8" />
        <span>
          Município IBGE <strong>{ibge}</strong> · Competência{" "}
          <strong>{competencia.slice(4)}/{competencia.slice(0,4)}</strong>
        </span>
        {data && (
          <>
            <span style={{ marginLeft: "auto" }}>
              Consultado em {new Date(data.consultado_em).toLocaleString("pt-BR")}
            </span>
            {data.fonte && (
              <span style={{ padding: "2px 8px", background: "#dbeafe", color: "#1d4ed8", borderRadius: 6, fontWeight: 600 }}>
                Fonte: {data.fonte}
              </span>
            )}
          </>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
          <RefreshCw size={28} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
          <div style={{ fontSize: 14 }}>Consultando SIAPS e IBGE…</div>
        </div>
      )}

      {/* Erro */}
      {isError && !isLoading && (
        <div style={{ background: "#fff7f7", border: "1px solid #fecaca", borderRadius: 12, padding: 24, textAlign: "center" }}>
          <AlertTriangle size={24} color="#dc2626" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 14, color: "#dc2626", fontWeight: 600 }}>Erro ao consultar a API</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Verifique se o backend está disponível.</div>
        </div>
      )}

      {/* Sem dados */}
      {data && !temDados && !isLoading && <SemDados dados={data} />}

      {/* Com dados */}
      {data && temDados && !isLoading && (() => {
        const m = data.metricas!;
        return (
          <>
            {/* Métricas principais */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
              <MetCard
                label="Equipes ESF/EAPS"
                valor={m.total_equipes}
                situacao="oficial_validado"
                cor="#1d4ed8"
              />
              <MetCard
                label="Pessoas Vinculadas (K)"
                valor={m.total_vinculadas}
                situacao={m.situacao_k}
                cor="#166534"
              />
              <MetCard
                label="Pessoas Acompanhadas (H)"
                valor={m.total_acompanhadas > 0 ? m.total_acompanhadas : null}
                situacao={m.situacao_h}
                nota={m.nota_h}
                cor="#0369a1"
              />
              <MetCard
                label="População IBGE Censo 2022"
                valor={m.populacao_ibge_censo2022 ?? null}
                situacao={m.populacao_ibge_censo2022 ? "oficial_validado" : "nao_disponivel"}
                cor="#7c3aed"
              />
              {m.cobertura_vinculacao_pct !== undefined && (
                <MetCard
                  label="Cobertura de Vinculação"
                  valor={`${m.cobertura_vinculacao_pct}%`}
                  situacao={m.situacao_k}
                  cor="#0369a1"
                />
              )}
              {m.sem_vinculo_estimado !== undefined && (
                <MetCard
                  label="Sem vínculo (estimado)"
                  valor={m.sem_vinculo_estimado}
                  situacao={m.situacao_sem_vinculo ?? "estimativa_autorizada"}
                  nota={m.nota_sem_vinculo}
                  cor="#dc2626"
                />
              )}
            </div>

            {/* Tabela de equipes */}
            <div style={{
              background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
              boxShadow: "0 1px 4px rgba(0,0,0,.05)", marginBottom: 20,
            }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
                <Users size={15} color="#1d4ed8" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                  Equipes — {data.equipes!.length} registros
                </span>
              </div>
              <TabelaEquipes equipes={data.equipes!} />
            </div>

            {/* Proveniência */}
            {data.proveniencia && Object.keys(data.proveniencia).length > 0 && (
              <PainelProveniencia prov={data.proveniencia} />
            )}
          </>
        );
      })()}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
