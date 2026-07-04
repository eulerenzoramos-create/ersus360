/**
 * ACSGeoPage — Página de Geo-localização em Tempo Real dos ACS
 * Mapa Leaflet + feed de produção + painel lateral de status
 */
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wifi, WifiOff, MapPin, Activity, Users, CheckCircle,
  Clock, Navigation, RefreshCw, AlertTriangle, Smartphone,
  ClipboardList, ChevronDown, ChevronRight,
} from "lucide-react";
import { AcsMapaGeo } from "../components/AcsMapaGeo";
import { useAcsGeo, type PosicaoAcs, type RegistroProducao } from "../hooks/useAcsGeo";
import { apiGet } from "../lib/api";

// ── Coordenadas fixas p/ simular ACS no mapa (demo) ──────────────────────────
// Em produção, os ACS enviam localização real pelo app/celular.
const POS_DEMO: PosicaoAcs[] = [
  { acs_id: 1,  nome: "Maria Aparecida Silva",    lat: -7.1930, lng: -59.8840, status: "em_visita",    microarea: "MA-01", precisao: 5,  bateria: 82,  ts: new Date().toISOString() },
  { acs_id: 2,  nome: "João Carlos Nascimento",   lat: -7.1960, lng: -59.8790, status: "deslocamento", microarea: "MA-02", precisao: 8,  bateria: 61,  ts: new Date().toISOString() },
  { acs_id: 3,  nome: "Ana Paula Ferreira",        lat: -7.1990, lng: -59.8910, status: "ativo",       microarea: "MA-03", precisao: 6,  bateria: 95,  ts: new Date().toISOString() },
  { acs_id: 4,  nome: "Raimundo Nonato Costa",    lat: -7.2020, lng: -59.8860, status: "em_visita",    microarea: "MA-04", precisao: 4,  bateria: 44,  ts: new Date().toISOString() },
  { acs_id: 5,  nome: "Francisca Lima Santos",    lat: -7.1880, lng: -59.8950, status: "ativo",       microarea: "MA-05", precisao: 10, bateria: 78,  ts: new Date().toISOString() },
  { acs_id: 7,  nome: "Benedita Sousa Oliveira",  lat: -7.2100, lng: -59.9000, status: "em_visita",    microarea: "MA-07", precisao: 7,  bateria: 55,  ts: new Date().toISOString() },
  { acs_id: 8,  nome: "Sebastião Alves Teixeira", lat: -7.2150, lng: -59.8700, status: "offline",     microarea: "MA-08", precisao: 0,  bateria: 12,  ts: new Date(Date.now()-1800000).toISOString() },
];

const PROD_DEMO: RegistroProducao[] = [
  { acs_id: 1, nome: "Maria Aparecida",  familia: "Família Souza",     cns_responsavel: "707 0070 3321 4421", microarea: "MA-01", lat: -7.1928, lng: -59.8842, procedimentos: ["Visita domiciliar", "Verificação HAS"],   observacao: "", ts: new Date(Date.now()-1200000).toISOString() },
  { acs_id: 4, nome: "Raimundo Nonato",  familia: "Família Pereira",   cns_responsavel: "706 8043 2211 0031", microarea: "MA-04", lat: -7.2019, lng: -59.8858, procedimentos: ["Visita domiciliar", "Orientação DM"],     observacao: "Glicemia elevada, orientado dieta", ts: new Date(Date.now()-3000000).toISOString() },
  { acs_id: 7, nome: "Benedita Sousa",   familia: "Família Teixeira",  cns_responsavel: "709 1234 5678 9012", microarea: "MA-07", lat: -7.2098, lng: -59.8998, procedimentos: ["Visita gestante", "Aferição PA"],         observacao: "Gestante 28 sem, PA 120/80", ts: new Date(Date.now()-600000).toISOString() },
  { acs_id: 3, nome: "Ana Paula",        familia: "Família Lima",      cns_responsavel: "700 1111 2222 3333", microarea: "MA-03", lat: -7.1992, lng: -59.8914, procedimentos: ["Visita criança < 2a", "Caderneta vacinação"], observacao: "", ts: new Date(Date.now()-300000).toISOString() },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COR: Record<string, string> = {
  ativo:        "#16a34a",
  em_visita:    "#2563eb",
  deslocamento: "#d97706",
  offline:      "#9ca3af",
};
const STATUS_LABEL: Record<string, string> = {
  ativo:        "Ativo",
  em_visita:    "Em Visita",
  deslocamento: "Deslocamento",
  offline:      "Offline",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  ativo:        <Activity size={12} />,
  em_visita:    <CheckCircle size={12} />,
  deslocamento: <Navigation size={12} />,
  offline:      <AlertTriangle size={12} />,
};

function TempoAtras({ ts }: { ts: string }) {
  const d = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  const str = d < 60 ? `${d}s atrás` : d < 3600 ? `${Math.floor(d/60)}m atrás` : `${Math.floor(d/3600)}h atrás`;
  return <span style={{ fontSize: 10, color: "#9ca3af" }}>{str}</span>;
}

// ── Painel lateral: status dos ACS ───────────────────────────────────────────

function PainelStatusAcs({ posicoes, onFocar }: { posicoes: PosicaoAcs[]; onFocar?: (p: PosicaoAcs) => void }) {
  const grupos = {
    em_visita:    posicoes.filter(p => p.status === "em_visita"),
    ativo:        posicoes.filter(p => p.status === "ativo"),
    deslocamento: posicoes.filter(p => p.status === "deslocamento"),
    offline:      posicoes.filter(p => p.status === "offline"),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", maxHeight: 440 }}>
      {Object.entries(grupos).map(([status, lista]) => lista.length === 0 ? null : (
        <div key={status}>
          <div style={{ fontSize: 10, fontWeight: 700, color: STATUS_COR[status], textTransform: "uppercase", letterSpacing: .5, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
            {STATUS_ICON[status]} {STATUS_LABEL[status]} ({lista.length})
          </div>
          {lista.map(p => (
            <div
              key={p.acs_id}
              onClick={() => onFocar?.(p)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 10px", borderRadius: 8, marginBottom: 4,
                background: STATUS_COR[p.status] + "0d",
                border: `1px solid ${STATUS_COR[p.status]}30`,
                cursor: "pointer",
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 14,
                background: STATUS_COR[p.status] + "22",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: STATUS_COR[p.status], flexShrink: 0,
              }}>{p.acs_id}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.nome.split(" ").slice(0, 2).join(" ")}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <TempoAtras ts={p.ts} />
                  {p.microarea && <span style={{ fontSize: 10, color: "#9ca3af" }}>{p.microarea}</span>}
                </div>
              </div>
              {p.bateria !== null && (
                <div style={{ fontSize: 10, color: p.bateria < 20 ? "#dc2626" : "#9ca3af" }}>
                  🔋{p.bateria}%
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
      {posicoes.length === 0 && (
        <div style={{ textAlign: "center", padding: 20, color: "#9ca3af", fontSize: 12 }}>
          Nenhum ACS conectado ainda.<br />
          <span style={{ fontSize: 11 }}>Aguardando localização dos dispositivos…</span>
        </div>
      )}
    </div>
  );
}

// ── Feed de produção ──────────────────────────────────────────────────────────

function FeedProducao({ registros }: { registros: RegistroProducao[] }) {
  const [abertos, setAbertos] = useState<Set<number>>(new Set());

  const toggle = (i: number) => setAbertos(prev => {
    const s = new Set(prev);
    s.has(i) ? s.delete(i) : s.add(i);
    return s;
  });

  if (registros.length === 0) {
    return <div style={{ textAlign: "center", padding: 20, color: "#9ca3af", fontSize: 12 }}>Nenhuma produção registrada ainda hoje.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 340, overflowY: "auto" }}>
      {registros.map((r, i) => (
        <div
          key={i}
          style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: "#fff" }}
        >
          <div onClick={() => toggle(i)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", cursor: "pointer" }}>
            <CheckCircle size={14} color="#16a34a" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.familia}
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>
                {r.nome.split(" ")[0]} · {r.microarea} · <TempoAtras ts={r.ts} />
              </div>
            </div>
            {r.lat && <MapPin size={10} color="#16a34a" />}
            {abertos.has(i) ? <ChevronDown size={12} color="#9ca3af" /> : <ChevronRight size={12} color="#9ca3af" />}
          </div>
          {abertos.has(i) && (
            <div style={{ padding: "6px 10px 10px", borderTop: "1px solid #f3f4f6" }}>
              {r.procedimentos.length > 0 && (
                <div style={{ marginBottom: 4 }}>
                  {r.procedimentos.map(p => (
                    <span key={p} style={{ display: "inline-block", background: "#eff6ff", color: "#2563eb", fontSize: 10, padding: "1px 6px", borderRadius: 8, marginRight: 4, marginBottom: 2 }}>
                      {p}
                    </span>
                  ))}
                </div>
              )}
              {r.observacao && <div style={{ fontSize: 11, color: "#6b7280", fontStyle: "italic" }}>"{r.observacao}"</div>}
              {r.cns_responsavel && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>CNS: {r.cns_responsavel}</div>}
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                {new Date(r.ts).toLocaleString("pt-BR")}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ACSGeoPage() {
  const { posicoes: posWs, producaoHoje: prodWs, totalAtivos, totalVisitas, conectado, ultimoEvento } = useAcsGeo();
  const [modoDemo, setModoDemo] = useState(false);

  // Carrega snapshot REST como fallback (até WebSocket trazer dados)
  const { data: snapshot } = useQuery({
    queryKey: ["acs-localizacoes"],
    queryFn: () => apiGet("/api/acs/localizacoes") as Promise<any>,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // Usa demo automaticamente se WS não trouxe dados ainda
  useEffect(() => {
    if (!conectado && posWs.length === 0) setModoDemo(true);
    else if (posWs.length > 0) setModoDemo(false);
  }, [conectado, posWs.length]);

  const posicoes = modoDemo ? POS_DEMO : (posWs.length > 0 ? posWs : (snapshot?.posicoes ?? POS_DEMO));
  const producao = modoDemo ? PROD_DEMO : (prodWs.length > 0 ? prodWs : (snapshot?.producao_hoje ?? PROD_DEMO));

  const ativos       = posicoes.filter(p => p.status !== "offline").length;
  const emVisita     = posicoes.filter(p => p.status === "em_visita").length;
  const totalHoje    = producao.length;
  const ultimaHora   = producao.filter(r => Date.now() - new Date(r.ts).getTime() < 3600000).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 20, gap: 16, maxWidth: 1200, margin: "0 auto" }}>

      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Navigation size={20} color="#2563eb" />
            Localização em Tempo Real — ACS
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
            Monitoramento de campo · Apuí/AM
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Indicador conexão */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: conectado ? "#f0fdf4" : "#f9fafb", border: `1px solid ${conectado ? "#bbf7d0" : "#e5e7eb"}`, borderRadius: 20 }}>
            {conectado ? <Wifi size={13} color="#16a34a" /> : <WifiOff size={13} color="#9ca3af" />}
            <span style={{ fontSize: 11, fontWeight: 600, color: conectado ? "#16a34a" : "#9ca3af" }}>
              {conectado ? "WebSocket ativo" : "Reconectando…"}
            </span>
          </div>

          {modoDemo && (
            <div style={{ padding: "4px 10px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 20, fontSize: 11, color: "#d97706", fontWeight: 600 }}>
              Modo demonstração
            </div>
          )}

          <button
            onClick={() => setModoDemo(d => !d)}
            style={{ display: "flex", alignItems: "center", gap: 5, border: "1px solid #d1d5db", borderRadius: 6, padding: "5px 10px", background: "#fff", cursor: "pointer", fontSize: 12 }}
          >
            <Smartphone size={13} />
            {modoDemo ? "Usar dados reais" : "Ver demo"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[
          { label: "ACS em Campo",     val: ativos,    cor: "#16a34a", bg: "#f0fdf4", icon: <Users size={16} /> },
          { label: "Em Visita Agora",  val: emVisita,  cor: "#2563eb", bg: "#eff6ff", icon: <CheckCircle size={16} /> },
          { label: "Visitas Hoje",     val: totalHoje, cor: "#7c3aed", bg: "#faf5ff", icon: <ClipboardList size={16} /> },
          { label: "Última Hora",      val: ultimaHora,cor: "#d97706", bg: "#fffbeb", icon: <Clock size={16} /> },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, color: k.cor }}>{k.icon}<span style={{ fontSize: 11, color: "#6b7280" }}>{k.label}</span></div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.cor }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Layout principal: mapa + painéis laterais */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, flex: 1 }}>

        {/* Mapa */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <AcsMapaGeo posicoes={posicoes} producaoHoje={producao} altura={440} />

          {/* Último evento */}
          {ultimoEvento && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#f9fafb", borderRadius: 6, fontSize: 11, color: "#6b7280" }}>
              <Activity size={11} color="#2563eb" />
              <span style={{ fontWeight: 600, color: "#2563eb" }}>Último evento:</span>
              {ultimoEvento}
            </div>
          )}

          {/* Legenda */}
          <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#6b7280", flexWrap: "wrap" }}>
            {Object.entries(STATUS_LABEL).map(([k, label]) => (
              <span key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COR[k], display: "inline-block" }} />
                {label}
              </span>
            ))}
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: "#16a34a", display: "inline-block" }} />
              Visita registrada
            </span>
          </div>
        </div>

        {/* Painel direito */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Status dos ACS */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={14} color="#2563eb" /> Status em Campo
            </div>
            <PainelStatusAcs posicoes={posicoes} />
          </div>

          {/* Feed produção */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <ClipboardList size={14} color="#7c3aed" />
              Produção Hoje
              <span style={{ marginLeft: "auto", background: "#faf5ff", color: "#7c3aed", fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 10 }}>
                {totalHoje}
              </span>
            </div>
            <FeedProducao registros={producao} />
          </div>
        </div>
      </div>
    </div>
  );
}
