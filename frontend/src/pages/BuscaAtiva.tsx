// src/pages/BuscaAtiva.tsx — Busca Ativa de Pacientes (Novo Financiamento APS)
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiPrevine } from "../lib/api";
import {
  Search, Baby, Heart, Syringe, Users, Activity,
  AlertTriangle, CheckCircle2, ArrowRight, MapPin, UserCheck,
} from "lucide-react";

// ── Grupos de busca ativa ─────────────────────────────────────────────────────
const GRUPOS = [
  {
    id: 1,
    indicador: 1,
    label: "Gestantes — Pré-natal",
    desc: "Gestantes com < 6 consultas ou sem início no 1º trimestre",
    icon: Baby,
    cor: "#e91e63",
    bg: "#fce4ec",
    meta: 60,
    path: "gestante",
  },
  {
    id: 2,
    indicador: 2,
    label: "Citopatológico",
    desc: "Mulheres 25–64 anos sem coleta de exame preventivo na APS",
    icon: Activity,
    cor: "#c62828",
    bg: "#ffebee",
    meta: 60,
    path: "cito",
    critico: true,
  },
  {
    id: 3,
    indicador: 3,
    label: "Vacinação — DTP/Penta",
    desc: "Crianças sem cobertura vacinal completa (DTP/Pentavalente)",
    icon: Syringe,
    cor: "#1565c0",
    bg: "#e3f2fd",
    meta: 95,
    path: "vacinas",
  },
  {
    id: 4,
    indicador: 4,
    label: "Consulta RN",
    desc: "Recém-nascidos sem consulta na 1ª semana de vida",
    icon: Heart,
    cor: "#6a1b9a",
    bg: "#f3e5f5",
    meta: 60,
    path: "rn",
  },
  {
    id: 5,
    indicador: 5,
    label: "Hipertensão — HAS",
    desc: "Hipertensos sem acompanhamento regular na APS",
    icon: Activity,
    cor: "#e65100",
    bg: "#fff3e0",
    meta: 70,
    path: "has",
  },
  {
    id: 6,
    indicador: 6,
    label: "Diabetes — DM",
    desc: "Diabéticos sem HbA1c solicitada nos últimos 12 meses",
    icon: Activity,
    cor: "#2e7d32",
    bg: "#e8f5e9",
    meta: 55,
    path: "dm",
  },
  {
    id: 7,
    indicador: 7,
    label: "Obesidade Infantil",
    desc: "Crianças 5–7 anos com IMC sem registro na APS",
    icon: Users,
    cor: "#00838f",
    bg: "#e0f7fa",
    meta: 55,
    path: "obesidade",
  },
];

function PrioridadeBadge({ pendentes }: { pendentes: number }) {
  if (pendentes >= 100) return <span style={{ background: "#ffebee", color: "#c62828", fontWeight: 700, fontSize: 10, padding: "2px 8px", borderRadius: 3 }}>ALTA</span>;
  if (pendentes >= 30)  return <span style={{ background: "#fff8e1", color: "#e65100", fontWeight: 700, fontSize: 10, padding: "2px 8px", borderRadius: 3 }}>MÉDIA</span>;
  return <span style={{ background: "#e8f5e9", color: "#2e7d32", fontWeight: 700, fontSize: 10, padding: "2px 8px", borderRadius: 3 }}>BAIXA</span>;
}

function GrupoCard({ grupo, selecionado, onClick }: {
  grupo: typeof GRUPOS[0];
  selecionado: boolean;
  onClick: () => void;
}) {
  const { data } = useQuery({
    queryKey: ["busca-ativa", grupo.indicador],
    queryFn: () => apiPrevine.buscaAtiva(grupo.indicador),
    staleTime: 60_000,
  });

  const pendentes = data?.pendentes ?? 0;
  const total     = data?.total_elegivel ?? 0;
  const realizado = data?.total_realizado ?? 0;
  const pct       = total > 0 ? Math.round((realizado / total) * 100) : 0;
  const corPct    = pct >= grupo.meta ? "#2e7d32" : pct >= grupo.meta * 0.85 ? "#f57f17" : "#c62828";

  return (
    <div
      onClick={onClick}
      style={{
        background: selecionado ? grupo.bg : "#fff",
        border: `2px solid ${selecionado ? grupo.cor : "#e0e0e0"}`,
        borderRadius: 10, padding: "16px", cursor: "pointer",
        transition: "all .15s",
        boxShadow: selecionado ? `0 2px 12px ${grupo.cor}30` : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ background: grupo.bg, borderRadius: 8, padding: 8 }}>
          <grupo.icon size={18} color={grupo.cor} />
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {grupo.critico && (
            <AlertTriangle size={13} color="#c62828" />
          )}
          <PrioridadeBadge pendentes={pendentes} />
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#212121", marginBottom: 3 }}>{grupo.label}</div>
      <div style={{ fontSize: 11, color: "#757575", lineHeight: 1.4, marginBottom: 12 }}>{grupo.desc}</div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#555" }}>{realizado}/{total} realizados</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: corPct }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "#e0e0e0", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: corPct, borderRadius: 3 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <span style={{ color: "#9e9e9e" }}>Meta: {grupo.meta}%</span>
        <span style={{ fontWeight: 700, color: "#c62828" }}>{pendentes} pendentes</span>
      </div>
    </div>
  );
}

function PainelDetalhe({ grupo }: { grupo: typeof GRUPOS[0] }) {
  const { data, isLoading } = useQuery({
    queryKey: ["busca-ativa", grupo.indicador],
    queryFn: () => apiPrevine.buscaAtiva(grupo.indicador),
    staleTime: 60_000,
  });

  if (isLoading) return <div style={{ padding: 40, textAlign: "center", color: "#9e9e9e" }}>Carregando...</div>;

  const pendentes = data?.pendentes ?? 0;
  const total = data?.total_elegivel ?? 0;
  const realizado = data?.total_realizado ?? 0;
  const pct = total > 0 ? Math.round((realizado / total) * 100) : 0;
  const microareas: string[] = data?.microareas_criticas ?? [];
  const acs: string[] = data?.acs_responsaveis ?? [];

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: `1px solid ${grupo.cor}30`, padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ background: grupo.bg, borderRadius: 10, padding: 12 }}>
          <grupo.icon size={24} color={grupo.cor} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#212121" }}>{grupo.label}</div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{grupo.desc}</div>
        </div>
        {grupo.critico && (
          <div style={{ marginLeft: "auto", background: "#ffebee", border: "1px solid #ef9a9a", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
            <AlertTriangle size={16} color="#c62828" />
            <div style={{ fontSize: 11, fontWeight: 700, color: "#c62828", marginTop: 2 }}>INDICADOR CRÍTICO</div>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "14px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#212121" }}>{total}</div>
          <div style={{ fontSize: 12, color: "#555" }}>Elegíveis</div>
        </div>
        <div style={{ background: "#e8f5e9", borderRadius: 8, padding: "14px 18px", textAlign: "center", border: "1px solid #c8e6c9" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#2e7d32" }}>{realizado}</div>
          <div style={{ fontSize: 12, color: "#555" }}>Realizados</div>
        </div>
        <div style={{ background: "#ffebee", borderRadius: 8, padding: "14px 18px", textAlign: "center", border: "1px solid #ef9a9a" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#c62828" }}>{pendentes}</div>
          <div style={{ fontSize: 12, color: "#555" }}>Pendentes</div>
        </div>
        <div style={{
          background: pct >= grupo.meta ? "#e8f5e9" : "#ffebee",
          borderRadius: 8, padding: "14px 18px", textAlign: "center",
          border: `1px solid ${pct >= grupo.meta ? "#c8e6c9" : "#ef9a9a"}`,
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: pct >= grupo.meta ? "#2e7d32" : "#c62828" }}>{pct}%</div>
          <div style={{ fontSize: 12, color: "#555" }}>Meta: {grupo.meta}%</div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
          <span style={{ color: "#555" }}>Progresso em relação à meta</span>
          <span style={{ fontWeight: 700, color: pct >= grupo.meta ? "#2e7d32" : "#c62828" }}>
            {pct >= grupo.meta ? "✓ Meta atingida" : `Faltam ${grupo.meta - pct}pp para a meta`}
          </span>
        </div>
        <div style={{ height: 12, background: "#f0f0f0", borderRadius: 6, overflow: "visible", position: "relative" }}>
          <div style={{
            width: `${pct}%`, height: "100%",
            background: pct >= grupo.meta ? "#2e7d32" : "#c62828",
            borderRadius: 6, transition: "width .5s",
          }} />
          <div style={{
            position: "absolute", top: -2,
            left: `${grupo.meta}%`, transform: "translateX(-50%)",
            width: 2, height: 16, background: "#1565c0",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <span style={{ fontSize: 11, color: "#1565c0", fontWeight: 600 }}>▲ Meta {grupo.meta}%</span>
        </div>
      </div>

      {/* Microáreas críticas + ACS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "#fffde7", border: "1px solid #fff59d", borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f57f17", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <MapPin size={13} /> Microáreas críticas
          </div>
          {microareas.length > 0 ? microareas.map(m => (
            <div key={m} style={{ fontSize: 12, color: "#555", padding: "4px 0", borderBottom: "1px solid #fff59d" }}>
              {m} — concentração de pendentes
            </div>
          )) : (
            <div style={{ fontSize: 12, color: "#9e9e9e" }}>Nenhuma microárea crítica identificada</div>
          )}
        </div>
        <div style={{ background: "#e3f2fd", border: "1px solid #90caf9", borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1565c0", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <UserCheck size={13} /> ACS responsáveis
          </div>
          {acs.map(a => (
            <div key={a} style={{ fontSize: 12, color: "#555", padding: "4px 0", borderBottom: "1px solid #90caf9" }}>
              {a}
            </div>
          ))}
        </div>
      </div>

      {/* Observação */}
      {data?.observacao && (
        <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#757575" }}>
          <CheckCircle2 size={12} style={{ verticalAlign: "middle", marginRight: 5 }} />
          {data.observacao}
        </div>
      )}
    </div>
  );
}

export default function BuscaAtiva() {
  const [grupoSel, setGrupoSel] = useState(GRUPOS[1]); // Citopatológico é o crítico
  const [busca, setBusca] = useState("");

  const gruposFiltrados = GRUPOS.filter(g =>
    !busca || g.label.toLowerCase().includes(busca.toLowerCase()) || g.desc.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Search size={20} color="#1565c0" />
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1565c0" }}>Busca Ativa</h2>
        </div>
        <p style={{ margin: 0, color: "#666", fontSize: 13 }}>
          Identifique pacientes elegíveis com ações pendentes · 7 indicadores Novo Financiamento APS · Apuí/AM · Jul/2026
        </p>
      </div>

      {/* Banner indicador crítico */}
      <div style={{
        background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 10,
        padding: "12px 18px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <AlertTriangle size={18} color="#e65100" style={{ flexShrink: 0 }} />
        <div>
          <span style={{ fontWeight: 700, color: "#e65100", fontSize: 13 }}>Atenção prioritária: Citopatológico </span>
          <span style={{ fontSize: 13, color: "#555" }}>
            — 678 mulheres sem exame preventivo. Indicador em vermelho (43% vs meta 60%).
            Requer busca ativa imediata pelas equipes ESF.
          </span>
        </div>
        <button
          onClick={() => setGrupoSel(GRUPOS[1])}
          style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 8, border: "1px solid #e65100", background: "#fff3e0", color: "#e65100", cursor: "pointer", fontSize: 12, fontWeight: 700, flexShrink: 0 }}
        >
          Ver detalhes <ArrowRight size={11} style={{ verticalAlign: "middle" }} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>
        {/* Coluna esquerda — lista de grupos */}
        <div>
          <div style={{ marginBottom: 12 }}>
            <input
              placeholder="Filtrar grupos..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ width: "100%", border: "1px solid #e0e0e0", borderRadius: 8, padding: "8px 12px", fontSize: 13, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {gruposFiltrados.map(g => (
              <GrupoCard
                key={g.id}
                grupo={g}
                selecionado={grupoSel.id === g.id}
                onClick={() => setGrupoSel(g)}
              />
            ))}
          </div>
        </div>

        {/* Coluna direita — detalhe */}
        <div>
          <PainelDetalhe grupo={grupoSel} />
        </div>
      </div>
    </div>
  );
}
