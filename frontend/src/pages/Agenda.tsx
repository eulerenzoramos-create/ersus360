// src/pages/Agenda.tsx — Agenda de Gestão ERSUS 360
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiAgenda } from "../lib/api";
import { Calendar, Clock, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";

type Evento = {
  id: number; titulo: string; tipo: string; data: string; status: string;
  prioridade: string; responsavel: string; descricao: string;
  dias_restantes?: number; urgencia?: string;
};

const TIPO_COR: Record<string, string> = {
  legal: "#c62828", reuniao: "#1565c0", producao: "#2e7d32",
  rh: "#6a1b9a", patrimonio: "#e65100", capacitacao: "#f57f17", vigilancia: "#00838f",
};

const TIPO_LABEL: Record<string, string> = {
  legal: "Legal", reuniao: "Reunião", producao: "Produção APS",
  rh: "RH", patrimonio: "Patrimônio", capacitacao: "Capacitação", vigilancia: "Vigilância",
};

function UrgenciaBadge({ urgencia, dias }: { urgencia?: string; dias?: number }) {
  if (urgencia === "vencido")   return <span style={{ background: "#ffebee", color: "#c62828", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>VENCIDO</span>;
  if (urgencia === "urgente")   return <span style={{ background: "#fff8e1", color: "#e65100", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>URGENTE ({dias}d)</span>;
  if (urgencia === "proximo")   return <span style={{ background: "#e3f2fd", color: "#1565c0", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>PRÓXIMO ({dias}d)</span>;
  return <span style={{ background: "#f5f5f5", color: "#9e9e9e", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{dias}d</span>;
}

function EventoCard({ ev }: { ev: Evento }) {
  const [expandido, setExpandido] = useState(false);
  const cor = TIPO_COR[ev.tipo] ?? "#9e9e9e";
  const concluido = ev.status === "concluido";

  return (
    <div style={{
      background: concluido ? "#fafafa" : "#fff",
      borderRadius: 8, border: `1px solid ${cor}20`,
      borderLeft: `4px solid ${concluido ? "#e0e0e0" : cor}`,
      marginBottom: 8, overflow: "hidden",
    }}>
      <div
        onClick={() => setExpandido(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer" }}
      >
        {concluido
          ? <CheckCircle2 size={16} color="#2e7d32" />
          : ev.urgencia === "vencido" || ev.urgencia === "urgente"
            ? <AlertTriangle size={16} color={cor} />
            : <Clock size={16} color={cor} />
        }
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 700, background: cor + "18", color: cor, padding: "1px 7px", borderRadius: 3 }}>
              {TIPO_LABEL[ev.tipo] ?? ev.tipo}
            </span>
            <span style={{ fontSize: 11, color: "#888" }}>{ev.responsavel}</span>
          </div>
          <div style={{ fontWeight: concluido ? 400 : 600, fontSize: 13, color: concluido ? "#9e9e9e" : "#212121", textDecoration: concluido ? "line-through" : "none" }}>
            {ev.titulo}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>
            {new Date(ev.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
          {!concluido && ev.urgencia && <UrgenciaBadge urgencia={ev.urgencia} dias={ev.dias_restantes} />}
          {concluido && <span style={{ fontSize: 11, background: "#e8f5e9", color: "#2e7d32", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>CONCLUÍDO</span>}
        </div>
        <ChevronRight size={14} color="#9e9e9e" style={{ transform: expandido ? "rotate(90deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
      </div>

      {expandido && (
        <div style={{ padding: "0 16px 14px 46px", fontSize: 13, color: "#555", borderTop: "1px solid #f5f5f5" }}>
          <div style={{ paddingTop: 10 }}>{ev.descricao}</div>
        </div>
      )}
    </div>
  );
}

export default function Agenda() {
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const params: Record<string, unknown> = {};
  if (filtroTipo   !== "todos") params.tipo   = filtroTipo;
  if (filtroStatus !== "todos") params.status = filtroStatus;

  const { data, isLoading } = useQuery({
    queryKey: ["agenda-eventos", filtroTipo, filtroStatus],
    queryFn: () => apiAgenda.eventos(params),
  });

  const { data: prazos } = useQuery({
    queryKey: ["agenda-prazos"],
    queryFn: () => apiAgenda.proximosPrazos(30),
  });

  const eventos: Evento[] = data?.eventos ?? [];
  const urgentesCount = eventos.filter(e => e.urgencia === "urgente" || e.urgencia === "vencido").length;

  const tipos = ["todos", "legal", "producao", "rh", "reuniao", "patrimonio", "capacitacao", "vigilancia"];

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1565c0" }}>
          <Calendar size={20} style={{ verticalAlign: "middle", marginRight: 8 }} />
          Agenda de Gestão
        </h2>
        <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>
          Obrigações legais · Prazos · Reuniões · Apuí/AM · Jul/2026
        </p>
      </div>

      {/* KPIs */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", border: "1px solid #e0e0e0" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#1565c0" }}>{data.total}</div>
            <div style={{ fontSize: 13, color: "#555" }}>Total de eventos</div>
          </div>
          <div style={{ background: "#fff3e0", borderRadius: 8, padding: "14px 18px", border: "1px solid #ffcc80" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#e65100" }}>{data.pendentes}</div>
            <div style={{ fontSize: 13, color: "#555" }}>Pendentes</div>
          </div>
          <div style={{ background: urgentesCount > 0 ? "#ffebee" : "#f5f5f5", borderRadius: 8, padding: "14px 18px", border: urgentesCount > 0 ? "1px solid #ef9a9a" : "1px solid #e0e0e0" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: urgentesCount > 0 ? "#c62828" : "#9e9e9e" }}>{urgentesCount}</div>
            <div style={{ fontSize: 13, color: "#555" }}>Urgentes / Vencidos</div>
          </div>
          <div style={{ background: "#e8f5e9", borderRadius: 8, padding: "14px 18px", border: "1px solid #c8e6c9" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#2e7d32" }}>{data.total - data.pendentes}</div>
            <div style={{ fontSize: 13, color: "#555" }}>Concluídos</div>
          </div>
        </div>
      )}

      {/* Próximos prazos críticos */}
      {prazos && prazos.prazos?.filter((p: Evento) => p.prioridade === "alta").length > 0 && (
        <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: "#e65100", fontSize: 14, marginBottom: 8 }}>
            ⚠ Próximos prazos de alta prioridade (30 dias)
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {prazos.prazos
              .filter((p: Evento) => p.prioridade === "alta")
              .slice(0, 4)
              .map((p: Evento) => (
                <div key={p.id} style={{ background: "#fff", borderRadius: 8, padding: "8px 12px", border: "1px solid #ffe082", fontSize: 12 }}>
                  <div style={{ fontWeight: 600, color: "#333" }}>{p.titulo}</div>
                  <div style={{ color: "#e65100", marginTop: 2 }}>{new Date(p.data + "T12:00:00").toLocaleDateString("pt-BR")} · {p.dias_restantes}d</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {tipos.map(t => (
            <button key={t}
              onClick={() => setFiltroTipo(t)}
              style={{
                padding: "5px 12px", borderRadius: 20, border: `1px solid ${t === "todos" ? "#e0e0e0" : (TIPO_COR[t] ?? "#e0e0e0")}`,
                background: filtroTipo === t ? (t === "todos" ? "#1565c0" : (TIPO_COR[t] ?? "#1565c0")) : "#fff",
                color: filtroTipo === t ? "#fff" : "#555",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
              }}>
              {t === "todos" ? "Todos" : TIPO_LABEL[t] ?? t}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          {["todos", "pendente", "concluido"].map(s => (
            <button key={s}
              onClick={() => setFiltroStatus(s)}
              style={{
                padding: "5px 12px", borderRadius: 20, border: "1px solid #e0e0e0",
                background: filtroStatus === s ? "#424242" : "#fff",
                color: filtroStatus === s ? "#fff" : "#555",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
              }}>
              {s === "todos" ? "Todos" : s === "pendente" ? "Pendentes" : "Concluídos"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de eventos */}
      {isLoading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9e9e9e" }}>Carregando...</div>
      ) : eventos.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9e9e9e", fontSize: 13 }}>
          Nenhum evento encontrado com os filtros selecionados
        </div>
      ) : (
        <div>
          {/* Agrupa por mês */}
          {(() => {
            const meses: Record<string, Evento[]> = {};
            eventos.forEach(e => {
              const key = e.data.slice(0, 7);
              meses[key] = meses[key] ?? [];
              meses[key].push(e);
            });
            return Object.entries(meses).sort(([a], [b]) => a.localeCompare(b)).map(([mes, evs]) => {
              const [ano, m] = mes.split("-");
              const nomeMes = new Date(parseInt(ano), parseInt(m) - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
              return (
                <div key={mes}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#888", textTransform: "capitalize", padding: "10px 0 6px", borderBottom: "1px solid #f0f0f0", marginBottom: 8 }}>
                    {nomeMes} · {evs.length} evento{evs.length !== 1 ? "s" : ""}
                  </div>
                  {evs.map(ev => <EventoCard key={ev.id} ev={ev} />)}
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}
