import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Download, RefreshCw, CheckCircle, AlertTriangle,
  XCircle, Clock, TrendingUp, DollarSign, Activity, ChevronDown,
  ChevronRight, Calendar, Users, BarChart2,
} from "lucide-react";
import { apiRdqa } from "../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Acao {
  codigo: string;
  descricao: string;
  meta_fisica: number;
  realizado: number;
  pct: number;
  status: "Concluído" | "Em execução" | "Crítico" | "Não iniciado";
}

interface Eixo { eixo: string; acoes: Acao[] }

interface IndicadorPrevine {
  numero: number;
  nome: string;
  resultado: number;
  meta: number;
  status: "verde" | "amarelo" | "vermelho";
}

interface BlocoFinanceiro {
  bloco: string;
  previsto: number;
  realizado: number;
  pct: number;
}

interface Rdqa {
  municipio: string;
  uf: string;
  ibge: string;
  ano: number;
  quadrimestre: number;
  quadrimestre_label: string;
  periodo_meses: string;
  prazo_apresentacao: string;
  gerado_em: string;
  resumo: {
    total_acoes: number;
    concluidas: number;
    em_execucao: number;
    criticas: number;
    pct_execucao_medio: number;
    previne_verdes: number;
    previne_vermelhos: number;
    financeiro_execucao_pct: number;
    proprio_saude_pct: number;
    proprio_saude_ok: boolean;
  };
  eixos: Eixo[];
  previne_brasil: {
    indicadores: IndicadorPrevine[];
    total_verde: number;
    total_vermelho: number;
    total_amarelo: number;
  };
  financeiro: {
    receita_prevista: number;
    receita_realizada: number;
    despesa_prevista: number;
    despesa_realizada: number;
    execucao_pct: number;
    fns_recebido: number;
    proprio_saude_pct: number;
    proprio_saude_meta: number;
    blocos: BlocoFinanceiro[];
  };
  alertas_gestao: { nivel: string; titulo: string; acao: string }[];
  proximos_passos: string[];
}

interface HistoricoItem {
  quadrimestre: number;
  periodo: string;
  status_apresentacao: string;
  data_apresentacao: string | null;
  pct_execucao: number | null;
  observacao: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

const statusColors: Record<string, string> = {
  "Concluído":     "#16a34a",
  "Em execução":   "#2563eb",
  "Crítico":       "#dc2626",
  "Não iniciado":  "#6b7280",
};

const StatusIcon = ({ s }: { s: string }) =>
  s === "Concluído"    ? <CheckCircle size={14} color="#16a34a" /> :
  s === "Em execução"  ? <Clock        size={14} color="#2563eb" /> :
  s === "Crítico"      ? <XCircle      size={14} color="#dc2626" /> :
                         <Clock        size={14} color="#6b7280" />;

function BarMeta({ pct, meta = 100, cor = "#2563eb" }: { pct: number; meta?: number; cor?: string }) {
  return (
    <div style={{ position: "relative", height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "visible" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: cor, borderRadius: 4, transition: "width .4s" }} />
      {meta < 100 && (
        <div style={{
          position: "absolute", top: -3, left: `${meta}%`,
          width: 2, height: 14, background: "#1d4ed8", borderRadius: 1,
        }} title={`Meta: ${meta}%`} />
      )}
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function EixoCard({ eixo }: { eixo: Eixo }) {
  const [open, setOpen] = useState(true);
  const criticas = eixo.acoes.filter(a => a.status === "Crítico").length;

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", cursor: "pointer",
          background: criticas > 0 ? "#fff7f7" : "#f9fafb",
          borderBottom: open ? "1px solid #e5e7eb" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <strong style={{ fontSize: 14 }}>{eixo.eixo}</strong>
          {criticas > 0 && (
            <span style={{ background: "#fee2e2", color: "#dc2626", fontSize: 11, padding: "1px 7px", borderRadius: 12, fontWeight: 600 }}>
              {criticas} crítica{criticas > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: "#6b7280" }}>{eixo.acoes.length} ações</span>
      </div>

      {open && (
        <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {eixo.acoes.map(a => (
            <div key={a.codigo}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <StatusIcon s={a.status} />
                  <span style={{ fontSize: 13 }}>{a.descricao}</span>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{a.codigo}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: statusColors[a.status] ?? "#374151" }}>
                  {a.pct}%
                </span>
              </div>
              <BarMeta pct={a.pct} cor={a.pct >= 70 ? "#16a34a" : a.pct >= 40 ? "#d97706" : "#dc2626"} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PrevineTabela({ indicadores }: { indicadores: IndicadorPrevine[] }) {
  const cores: Record<string, string> = { verde: "#16a34a", amarelo: "#d97706", vermelho: "#dc2626" };
  const bg: Record<string, string>    = { verde: "#f0fdf4", amarelo: "#fffbeb", vermelho: "#fff7f7" };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
          <th style={{ padding: "8px 10px" }}>#</th>
          <th style={{ padding: "8px 10px" }}>Indicador</th>
          <th style={{ padding: "8px 10px", textAlign: "right" }}>Resultado</th>
          <th style={{ padding: "8px 10px", textAlign: "right" }}>Meta</th>
          <th style={{ padding: "8px 10px" }}>Situação</th>
        </tr>
      </thead>
      <tbody>
        {indicadores.map(i => (
          <tr key={i.numero} style={{ background: bg[i.status], borderBottom: "1px solid #e5e7eb" }}>
            <td style={{ padding: "8px 10px", fontWeight: 600, color: "#6b7280" }}>{i.numero}</td>
            <td style={{ padding: "8px 10px" }}>{i.nome}</td>
            <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: cores[i.status] }}>
              {i.resultado}%
            </td>
            <td style={{ padding: "8px 10px", textAlign: "right", color: "#6b7280" }}>{i.meta}%</td>
            <td style={{ padding: "8px 10px" }}>
              <span style={{
                background: cores[i.status] + "22", color: cores[i.status],
                fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12,
              }}>
                {i.status === "verde" ? "✓ Meta atingida" : i.status === "amarelo" ? "⚠ Próximo da meta" : "✗ Abaixo da meta"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BlocoFinanceiroRow({ b }: { b: BlocoFinanceiro }) {
  const cor = b.pct >= 70 ? "#16a34a" : b.pct >= 40 ? "#d97706" : "#dc2626";
  return (
    <div style={{ padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13 }}>{b.bloco}</span>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280" }}>
          <span>Prev: {fmt(b.previsto)}</span>
          <span>Real: {fmt(b.realizado)}</span>
          <span style={{ fontWeight: 700, color: cor }}>{b.pct}%</span>
        </div>
      </div>
      <BarMeta pct={b.pct} cor={cor} />
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function RDQA() {
  const [quadrimestre, setQuadrimestre] = useState(2);
  const [aba, setAba] = useState<"resumo" | "acoes" | "previne" | "financeiro" | "historico">("resumo");

  const { data: rdqa, isLoading, refetch } = useQuery<Rdqa>({
    queryKey: ["rdqa", quadrimestre],
    queryFn: () => apiRdqa.gerar(quadrimestre) as Promise<Rdqa>,
    staleTime: 60_000,
  });

  const { data: hist } = useQuery<{ historico: HistoricoItem[] }>({
    queryKey: ["rdqa-historico"],
    queryFn: () => apiRdqa.historico() as Promise<{ historico: HistoricoItem[] }>,
    staleTime: 300_000,
  });

  const handleExportPdf = async () => {
    const token = localStorage.getItem("ersus_token");
    const res = await fetch(
      `${import.meta.env.VITE_API_URL || ""}/api/relatorios/exportar-pdf?tipo=gerencial&ano=${rdqa?.ano ?? 2026}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) { alert("Erro ao gerar PDF"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RDQA_${rdqa?.municipio}_${rdqa?.quadrimestre_label}_${rdqa?.ano}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ABAS = [
    { id: "resumo",     label: "Resumo Executivo", icon: <BarChart2 size={14} /> },
    { id: "acoes",      label: "Ações por Eixo",   icon: <CheckCircle size={14} /> },
    { id: "previne",    label: "Novo Financiamento APS",    icon: <Activity size={14} /> },
    { id: "financeiro", label: "Financeiro",        icon: <DollarSign size={14} /> },
    { id: "historico",  label: "Histórico CMS",     icon: <Calendar size={14} /> },
  ] as const;

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>

      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>RDQA</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            Relatório Detalhado Quadrimestral de Ações — apresentação obrigatória ao CMS
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Seletor quadrimestre */}
          <select
            value={quadrimestre}
            onChange={e => setQuadrimestre(Number(e.target.value))}
            style={{
              border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px",
              fontSize: 13, background: "#fff", cursor: "pointer",
            }}
          >
            <option value={1}>1º Quadrimestre (Jan–Abr)</option>
            <option value={2}>2º Quadrimestre (Mai–Ago)</option>
            <option value={3}>3º Quadrimestre (Set–Dez)</option>
          </select>

          <button onClick={() => refetch()} style={{
            display: "flex", alignItems: "center", gap: 6,
            border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 12px",
            background: "#fff", cursor: "pointer", fontSize: 13,
          }}>
            <RefreshCw size={14} /> Atualizar
          </button>

          <button onClick={handleExportPdf} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#dc2626", color: "#fff",
            border: "none", borderRadius: 6, padding: "6px 12px",
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>
            <Download size={14} /> Exportar PDF
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          <RefreshCw size={28} style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ marginTop: 12 }}>Gerando RDQA…</p>
        </div>
      )}

      {rdqa && (
        <>
          {/* Banner período */}
          <div style={{
            background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
            borderRadius: 10, padding: "16px 20px", color: "#fff", marginBottom: 20,
            display: "flex", gap: 24, alignItems: "center",
          }}>
            <FileText size={32} style={{ opacity: .85 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>
                {rdqa.quadrimestre_label} / {rdqa.ano}
              </div>
              <div style={{ opacity: .85, fontSize: 13 }}>
                {rdqa.periodo_meses} · {rdqa.municipio}/{rdqa.uf} · IBGE {rdqa.ibge}
              </div>
              <div style={{ marginTop: 4, fontSize: 12, opacity: .75 }}>
                Prazo de apresentação ao CMS: <strong>{rdqa.prazo_apresentacao}</strong>
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, opacity: .75 }}>
              Gerado em {new Date(rdqa.gerado_em).toLocaleString("pt-BR")}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #e5e7eb", paddingBottom: 0 }}>
            {ABAS.map(a => (
              <button key={a.id} onClick={() => setAba(a.id)} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "8px 14px", border: "none", background: "none",
                borderBottom: aba === a.id ? "2px solid #2563eb" : "2px solid transparent",
                color: aba === a.id ? "#2563eb" : "#6b7280",
                fontWeight: aba === a.id ? 700 : 400,
                cursor: "pointer", fontSize: 13, marginBottom: -2,
              }}>
                {a.icon} {a.label}
              </button>
            ))}
          </div>

          {/* ── Resumo Executivo ── */}
          {aba === "resumo" && (
            <div>
              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Ações Concluídas",   val: `${rdqa.resumo.concluidas}/${rdqa.resumo.total_acoes}`,  icon: <CheckCircle size={20} color="#16a34a" />, bg: "#f0fdf4" },
                  { label: "Ações Críticas",      val: rdqa.resumo.criticas,     icon: <XCircle size={20} color="#dc2626" />,    bg: "#fff7f7" },
                  { label: "Execução Média",      val: `${rdqa.resumo.pct_execucao_medio}%`, icon: <TrendingUp size={20} color="#2563eb" />, bg: "#eff6ff" },
                  { label: "Recursos Próprios",   val: `${rdqa.resumo.proprio_saude_pct}%`,
                    icon: <DollarSign size={20} color={rdqa.resumo.proprio_saude_ok ? "#16a34a" : "#dc2626"} />,
                    bg: rdqa.resumo.proprio_saude_ok ? "#f0fdf4" : "#fff7f7" },
                ].map(k => (
                  <div key={k.label} style={{ background: k.bg, borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      {k.icon}
                      <span style={{ fontSize: 12, color: "#6b7280" }}>{k.label}</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{k.val}</div>
                  </div>
                ))}
              </div>

              {/* Alertas para o CMS */}
              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Pontos Críticos para o Conselho</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {rdqa.alertas_gestao.map((al, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 12, padding: "12px 16px", borderRadius: 8,
                    background: al.nivel === "CRITICO" ? "#fff7f7" : "#fffbeb",
                    border: `1px solid ${al.nivel === "CRITICO" ? "#fca5a5" : "#fde68a"}`,
                  }}>
                    {al.nivel === "CRITICO"
                      ? <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                      : <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{al.titulo}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>Ação recomendada: {al.acao}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Próximos passos */}
              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Próximos Passos</h3>
              <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                {rdqa.proximos_passos.map((p, i) => (
                  <li key={i} style={{ fontSize: 13 }}>{p}</li>
                ))}
              </ol>
            </div>
          )}

          {/* ── Ações por Eixo ── */}
          {aba === "acoes" && (
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "Concluídas",   val: rdqa.resumo.concluidas,                                                  cor: "#16a34a" },
                  { label: "Em execução",  val: rdqa.resumo.em_execucao,                                                  cor: "#2563eb" },
                  { label: "Críticas",     val: rdqa.resumo.criticas,                                                     cor: "#dc2626" },
                  { label: "Total",        val: rdqa.resumo.total_acoes,                                                   cor: "#374151" },
                ].map(k => (
                  <div key={k.label} style={{
                    flex: 1, textAlign: "center", padding: "10px 0",
                    borderRadius: 8, border: `2px solid ${k.cor}22`, background: `${k.cor}08`,
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: k.cor }}>{k.val}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{k.label}</div>
                  </div>
                ))}
              </div>
              {rdqa.eixos.map(e => <EixoCard key={e.eixo} eixo={e} />)}
            </div>
          )}

          {/* ── Novo Financiamento APS ── */}
          {aba === "previne" && (
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "Meta atingida", val: rdqa.previne_brasil.total_verde,    bg: "#f0fdf4", cor: "#16a34a" },
                  { label: "Próximo",       val: rdqa.previne_brasil.total_amarelo,  bg: "#fffbeb", cor: "#d97706" },
                  { label: "Abaixo da meta",val: rdqa.previne_brasil.total_vermelho, bg: "#fff7f7", cor: "#dc2626" },
                ].map(k => (
                  <div key={k.label} style={{ flex: 1, textAlign: "center", padding: "12px 0", borderRadius: 8, background: k.bg }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: k.cor }}>{k.val}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{k.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                <PrevineTabela indicadores={rdqa.previne_brasil.indicadores} />
              </div>
            </div>
          )}

          {/* ── Financeiro ── */}
          {aba === "financeiro" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Receita Realizada", val: fmt(rdqa.financeiro.receita_realizada), sub: `de ${fmt(rdqa.financeiro.receita_prevista)} previsto` },
                  { label: "Despesa Realizada", val: fmt(rdqa.financeiro.despesa_realizada), sub: `Execução ${rdqa.financeiro.execucao_pct}%` },
                  {
                    label: "Recursos Próprios / Saúde",
                    val: `${rdqa.financeiro.proprio_saude_pct}%`,
                    sub: `Meta: ≥ ${rdqa.financeiro.proprio_saude_meta}%`,
                    cor: rdqa.financeiro.proprio_saude_pct >= rdqa.financeiro.proprio_saude_meta ? "#16a34a" : "#dc2626",
                  },
                ].map(k => (
                  <div key={k.label} style={{ background: "#f9fafb", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: (k as any).cor ?? "#111827" }}>{k.val}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Execução por Bloco de Financiamento</h3>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "4px 16px" }}>
                {rdqa.financeiro.blocos.map(b => <BlocoFinanceiroRow key={b.bloco} b={b} />)}
              </div>
            </div>
          )}

          {/* ── Histórico CMS ── */}
          {aba === "historico" && (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(hist?.historico ?? []).map(h => {
                  const statusCor: Record<string, string> = {
                    "Aprovado": "#16a34a", "Pendente": "#d97706", "Não iniciado": "#9ca3af",
                  };
                  const cor = statusCor[h.status_apresentacao] ?? "#6b7280";
                  return (
                    <div key={h.quadrimestre} style={{
                      border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 18px",
                      display: "flex", alignItems: "center", gap: 16,
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 22, background: cor + "22",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 16, color: cor, flexShrink: 0,
                      }}>{h.quadrimestre}º</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{h.periodo}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{h.observacao}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{
                          background: cor + "22", color: cor,
                          fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 12,
                        }}>{h.status_apresentacao}</span>
                        {h.pct_execucao !== null && (
                          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                            Exec. {h.pct_execucao}%
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
