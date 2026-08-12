import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle, XCircle, Clock, AlertTriangle, Shield,
  RefreshCw, Filter, ExternalLink, Calendar, ChevronDown, ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Obrigacao {
  id: string;
  categoria: string;
  titulo: string;
  descricao: string;
  prazo: string;
  status: string;
  responsavel: string;
  base_legal: string;
  modulo: string;
  prioridade: "alta" | "media" | "baixa";
  dias_para_prazo: number;
  semaforo: "verde" | "amarelo" | "vermelho" | "azul" | "cinza";
  urgente: boolean;
  vencido: boolean;
}

interface ConformidadeData {
  municipio: string;
  data_referencia: string;
  resumo: {
    total: number;
    concluidos: number;
    vencidos: number;
    urgentes: number;
    proximos_60d: number;
    pct_conformidade: number;
  };
  obrigacoes: Obrigacao[];
  categorias: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const semaforoCor: Record<string, string> = {
  verde:    "#16a34a",
  amarelo:  "#d97706",
  vermelho: "#dc2626",
  azul:     "#2563eb",
  cinza:    "#9ca3af",
};

const semaforoBg: Record<string, string> = {
  verde:    "#f0fdf4",
  amarelo:  "#fffbeb",
  vermelho: "#fff7f7",
  azul:     "#eff6ff",
  cinza:    "#f9fafb",
};

const statusLabel: Record<string, string> = {
  concluido:     "Concluído",
  pendente:      "Pendente",
  em_elaboracao: "Em elaboração",
  nao_iniciado:  "Não iniciado",
};

const StatusIcon = ({ semaforo }: { semaforo: string }) => {
  const cor = semaforoCor[semaforo];
  if (semaforo === "verde")    return <CheckCircle size={16} color={cor} />;
  if (semaforo === "vermelho") return <XCircle     size={16} color={cor} />;
  if (semaforo === "amarelo")  return <AlertTriangle size={16} color={cor} />;
  return <Clock size={16} color={cor} />;
};

function PrazoChip({ dias, semaforo, status }: { dias: number; semaforo: string; status: string }) {
  const cor = semaforoCor[semaforo];
  if (status === "concluido") return (
    <span style={{ background: "#f0fdf4", color: "#16a34a", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12 }}>
      ✓ Concluído
    </span>
  );
  if (dias < 0) return (
    <span style={{ background: "#fff7f7", color: "#dc2626", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12 }}>
      {Math.abs(dias)}d em atraso
    </span>
  );
  return (
    <span style={{ background: cor + "18", color: cor, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12 }}>
      {dias === 0 ? "Hoje!" : `${dias}d`}
    </span>
  );
}

// ── Componente de linha ───────────────────────────────────────────────────────

function ObrigacaoRow({ ob }: { ob: Obrigacao }) {
  const [aberta, setAberta] = useState(false);
  const navigate = useNavigate();
  const cor = semaforoCor[ob.semaforo];
  const bg  = semaforoBg[ob.semaforo];

  return (
    <div style={{
      border: `1px solid ${cor}40`,
      borderLeft: `4px solid ${cor}`,
      borderRadius: 8,
      overflow: "hidden",
      background: bg,
      marginBottom: 8,
    }}>
      {/* Linha principal */}
      <div
        onClick={() => setAberta(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "11px 14px", cursor: "pointer",
        }}
      >
        <StatusIcon semaforo={ob.semaforo} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{ob.titulo}</span>
            <span style={{
              background: "#e5e7eb", color: "#6b7280",
              fontSize: 10, padding: "1px 6px", borderRadius: 8,
            }}>{ob.categoria}</span>
            {ob.prioridade === "alta" && (
              <span style={{ background: "#fee2e2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8 }}>
                Alta prioridade
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
            Prazo: {new Date(ob.prazo + "T00:00").toLocaleDateString("pt-BR")} · {ob.responsavel}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <PrazoChip dias={ob.dias_para_prazo} semaforo={ob.semaforo} status={ob.status} />
          {aberta ? <ChevronDown size={14} color="#9ca3af" /> : <ChevronRight size={14} color="#9ca3af" />}
        </div>
      </div>

      {/* Detalhe expandido */}
      {aberta && (
        <div style={{
          padding: "10px 14px 14px",
          borderTop: "1px solid " + cor + "30",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <p style={{ margin: 0, fontSize: 12, color: "#374151" }}>{ob.descricao}</p>

          <div style={{ display: "flex", gap: 20, fontSize: 11, color: "#6b7280", flexWrap: "wrap" }}>
            <span><strong>Base legal:</strong> {ob.base_legal}</span>
            <span><strong>Status:</strong> {statusLabel[ob.status] ?? ob.status}</span>
            <span><strong>Responsável:</strong> {ob.responsavel}</span>
          </div>

          <button
            onClick={e => { e.stopPropagation(); navigate(ob.modulo); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: cor, color: "#fff", border: "none", borderRadius: 6,
              padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              alignSelf: "flex-start", marginTop: 4,
            }}
          >
            <ExternalLink size={12} /> Abrir módulo
          </button>
        </div>
      )}
    </div>
  );
}

// ── Gauge conformidade ────────────────────────────────────────────────────────

function GaugeConformidade({ pct }: { pct: number }) {
  const cor = pct >= 80 ? "#16a34a" : pct >= 60 ? "#d97706" : "#dc2626";
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width={110} height={110} viewBox="0 0 110 110">
      <circle cx={55} cy={55} r={r} fill="none" stroke="#e5e7eb" strokeWidth={10} />
      <circle cx={55} cy={55} r={r} fill="none" stroke={cor} strokeWidth={10}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 55 55)" style={{ transition: "stroke-dasharray .8s" }} />
      <text x={55} y={51} textAnchor="middle" fontSize={20} fontWeight={700} fill={cor}>{pct}%</text>
      <text x={55} y={65} textAnchor="middle" fontSize={9} fill="#9ca3af">conformidade</text>
    </svg>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Conformidade() {
  const [catFiltro, setCatFiltro] = useState<string>("Todas");
  const [semaforoFiltro, setSemaforoFiltro] = useState<string>("Todos");

  const { data, isLoading, refetch } = useQuery<ConformidadeData>({
    queryKey: ["conformidade"],
    queryFn: () => apiGet("/api/conformidade") as Promise<ConformidadeData>,
    staleTime: 120_000,
  });

  const obrigacoes = data?.obrigacoes ?? [];
  const filtradas  = obrigacoes.filter(ob => {
    const passaCat = catFiltro === "Todas" || ob.categoria === catFiltro;
    const passaSem = semaforoFiltro === "Todos"
      || (semaforoFiltro === "Critico"   && (ob.vencido || ob.urgente))
      || (semaforoFiltro === "Pendente"  && ob.status !== "concluido" && !ob.vencido && !ob.urgente)
      || (semaforoFiltro === "Concluido" && ob.status === "concluido");
    return passaCat && passaSem;
  });

  const r = data?.resumo;

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>

      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={22} color="#1d4ed8" /> Conformidade Legal
          </h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            Obrigações legais periódicas — {data?.municipio} · Referência: {data?.data_referencia
              ? new Date(data.data_referencia + "T00:00").toLocaleDateString("pt-BR") : "—"}
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

      {isLoading && (
        <div style={{ textAlign: "center", padding: 60 }}>
          <RefreshCw size={28} color="#9ca3af" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {!isLoading && !r && (
        <NaoDisponivelBanner nota="Integração com sistema de conformidade ainda não configurada no Railway. Nenhum dado foi inventado." />
      )}

      {r && (
        <>
          {/* KPIs */}
          <div style={{
            display: "grid", gridTemplateColumns: "110px 1fr",
            border: "1px solid #e5e7eb", borderRadius: 12, padding: 20,
            gap: 20, marginBottom: 20, background: "#fff", alignItems: "center",
          }}>
            <GaugeConformidade pct={r.pct_conformidade} />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[
                { label: "Concluídas",    val: r.concluidos,    cor: "#16a34a", bg: "#f0fdf4" },
                { label: "Vencidas",      val: r.vencidos,      cor: "#dc2626", bg: "#fff7f7" },
                { label: "Urgentes (7d)", val: r.urgentes,      cor: "#d97706", bg: "#fffbeb" },
                { label: "Próximas 60d",  val: r.proximos_60d,  cor: "#2563eb", bg: "#eff6ff" },
              ].map(k => (
                <div key={k.label} style={{ textAlign: "center", padding: "10px 8px", background: k.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: k.cor }}>{k.val}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{k.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas críticos destacados */}
          {(r.vencidos > 0 || r.urgentes > 0) && (
            <div style={{
              background: "#fff7f7", border: "1px solid #fca5a5", borderRadius: 8,
              padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
            }}>
              <AlertTriangle size={18} color="#dc2626" />
              <span style={{ fontSize: 13, color: "#991b1b" }}>
                <strong>{r.vencidos + r.urgentes} obrigação(ões) precisam de atenção imediata</strong> —
                {r.vencidos > 0 && ` ${r.vencidos} vencida(s)`}
                {r.urgentes > 0 && ` ${r.urgentes} urgente(s) (≤7 dias)`}
              </span>
            </div>
          )}

          {/* Filtros */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <Filter size={14} color="#9ca3af" />

            {/* Categoria */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {["Todas", ...(data?.categorias ?? [])].map(c => (
                <button key={c} onClick={() => setCatFiltro(c)} style={{
                  padding: "4px 10px", fontSize: 12, borderRadius: 20, border: "1px solid #d1d5db",
                  background: catFiltro === c ? "#1d4ed8" : "#fff",
                  color: catFiltro === c ? "#fff" : "#374151",
                  cursor: "pointer", fontWeight: catFiltro === c ? 600 : 400,
                }}>{c}</button>
              ))}
            </div>

            <div style={{ width: 1, height: 20, background: "#e5e7eb" }} />

            {/* Status rápido */}
            {[
              { key: "Todos",     label: "Todos",      cor: "#374151" },
              { key: "Critico",   label: "🚨 Críticos", cor: "#dc2626" },
              { key: "Pendente",  label: "⏳ Pendentes", cor: "#d97706" },
              { key: "Concluido", label: "✓ Concluídos", cor: "#16a34a" },
            ].map(s => (
              <button key={s.key} onClick={() => setSemaforoFiltro(s.key)} style={{
                padding: "4px 10px", fontSize: 12, borderRadius: 20, border: "1px solid #d1d5db",
                background: semaforoFiltro === s.key ? s.cor : "#fff",
                color: semaforoFiltro === s.key ? "#fff" : "#374151",
                cursor: "pointer", fontWeight: semaforoFiltro === s.key ? 600 : 400,
              }}>{s.label}</button>
            ))}

            <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>
              {filtradas.length}/{obrigacoes.length} obrigações
            </span>
          </div>

          {/* Lista de obrigações */}
          {filtradas.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
              Nenhuma obrigação encontrada com esse filtro.
            </div>
          ) : (
            filtradas.map(ob => <ObrigacaoRow key={ob.id} ob={ob} />)
          )}

          {/* Legenda */}
          <div style={{ marginTop: 16, display: "flex", gap: 16, fontSize: 11, color: "#9ca3af", flexWrap: "wrap" }}>
            {[
              { cor: "#16a34a", label: "Concluído" },
              { cor: "#dc2626", label: "Vencido / Urgente (≤7d)" },
              { cor: "#d97706", label: "Próximo (8–30d)" },
              { cor: "#2563eb", label: "Em elaboração" },
              { cor: "#9ca3af", label: "Futuro (>30d)" },
            ].map(l => (
              <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: l.cor, display: "inline-block" }} />
                {l.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
