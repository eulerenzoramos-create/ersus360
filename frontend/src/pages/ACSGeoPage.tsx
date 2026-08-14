/**
 * ACSGeoPage — Página de Geo-localização em Tempo Real dos ACS
 * Mapa Leaflet + feed de produção + painel lateral de status
 */
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wifi, WifiOff, MapPin, Activity, Users, CheckCircle,
  Clock, Navigation, RefreshCw, AlertTriangle, Smartphone,
  ClipboardList, ChevronDown, ChevronRight, Filter,
  FileText, Printer, Search, Calendar,
} from "lucide-react";
import { AcsMapaGeo } from "../components/AcsMapaGeo";
import { useAcsGeo, type PosicaoAcs, type RegistroProducao } from "../hooks/useAcsGeo";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

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

// ── Timeline: visitas + envios de produção ────────────────────────────────────

interface EventoTimeline {
  tipo: "visita" | "producao" | "login" | "offline";
  acs_id: number;
  acs_nome: string;
  microarea: string;
  descricao: string;
  ts: string;
  lat?: number;
  lng?: number;
}

// Gera timestamp para N dias atrás na hora H:MM
function ts(diasAtras: number, hora: number, min: number): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  d.setHours(hora, min, 0, 0);
  return d.toISOString();
}

const TIMELINE_DEMO: EventoTimeline[] = [
  // Hoje
  { tipo:"login",    acs_id:1,  acs_nome:"Maria Aparecida Silva",    microarea:"MA-01", descricao:"ACS entrou em campo — início de jornada", ts: ts(0,7,30) },
  { tipo:"login",    acs_id:4,  acs_nome:"Raimundo Nonato Costa",    microarea:"MA-04", descricao:"ACS entrou em campo — início de jornada", ts: ts(0,7,45) },
  { tipo:"visita",   acs_id:1,  acs_nome:"Maria Aparecida Silva",    microarea:"MA-01", descricao:"Visita domiciliar — Família Souza (verificação PA, orientação HAS)", ts: ts(0,8,20), lat:-7.1930, lng:-59.8840 },
  { tipo:"visita",   acs_id:4,  acs_nome:"Raimundo Nonato Costa",    microarea:"MA-04", descricao:"Visita domiciliar — Família Pereira (DM, orientação dieta)", ts: ts(0,9,10), lat:-7.2019, lng:-59.8858 },
  { tipo:"producao", acs_id:1,  acs_nome:"Maria Aparecida Silva",    microarea:"MA-01", descricao:"Produção enviada — 3 registros (HAS, visita domiciliar, cadastro atualizado)", ts: ts(0,9,45), lat:-7.1928, lng:-59.8842 },
  { tipo:"visita",   acs_id:7,  acs_nome:"Benedita Sousa Oliveira",  microarea:"MA-07", descricao:"Visita gestante — 28 semanas, PA 120/80, caderneta atualizada", ts: ts(0,10,15), lat:-7.2098, lng:-59.8998 },
  { tipo:"visita",   acs_id:2,  acs_nome:"João Carlos Nascimento",   microarea:"MA-02", descricao:"Visita criança <2a — Caderneta vacinal conferida, DTP em dia", ts: ts(0,10,50), lat:-7.1960, lng:-59.8790 },
  { tipo:"producao", acs_id:3,  acs_nome:"Ana Paula Ferreira",       microarea:"MA-03", descricao:"Produção enviada — 4 registros (1 gestante, 2 crianças, 1 HAS)", ts: ts(0,11,30), lat:-7.1992, lng:-59.8914 },
  { tipo:"offline",  acs_id:8,  acs_nome:"Sebastião Alves Teixeira", microarea:"MA-08", descricao:"ACS offline — bateria crítica (12%)", ts: ts(0,12,0) },
  { tipo:"producao", acs_id:2,  acs_nome:"João Carlos Nascimento",   microarea:"MA-02", descricao:"Produção enviada — 2 registros (vacinas, visita domiciliar)", ts: ts(0,12,55) },
  { tipo:"visita",   acs_id:5,  acs_nome:"Francisca Lima Santos",    microarea:"MA-05", descricao:"Visita idoso — Aferição PA + orientação medicação HAS", ts: ts(0,13,10), lat:-7.1880, lng:-59.8950 },
  // Ontem (1 dia atrás)
  { tipo:"login",    acs_id:3,  acs_nome:"Ana Paula Ferreira",       microarea:"MA-03", descricao:"ACS entrou em campo — início de jornada", ts: ts(1,7,30) },
  { tipo:"visita",   acs_id:3,  acs_nome:"Ana Paula Ferreira",       microarea:"MA-03", descricao:"Visita domiciliar — Família Castro (gestante 32 sem)", ts: ts(1,8,10), lat:-7.1992, lng:-59.8914 },
  { tipo:"visita",   acs_id:5,  acs_nome:"Francisca Lima Santos",    microarea:"MA-05", descricao:"Visita criança <2a — Vacinas em atraso, encaminhado UBS", ts: ts(1,9,0), lat:-7.1880, lng:-59.8950 },
  { tipo:"producao", acs_id:5,  acs_nome:"Francisca Lima Santos",    microarea:"MA-05", descricao:"Produção enviada — 5 registros", ts: ts(1,11,45) },
  { tipo:"visita",   acs_id:7,  acs_nome:"Benedita Sousa Oliveira",  microarea:"MA-07", descricao:"Visita HAS/DM — Família Rodrigues, medicação verificada", ts: ts(1,10,30), lat:-7.2100, lng:-59.9000 },
  { tipo:"producao", acs_id:7,  acs_nome:"Benedita Sousa Oliveira",  microarea:"MA-07", descricao:"Produção enviada — 3 registros (HAS, visita gestante, idoso)", ts: ts(1,14,0) },
  { tipo:"offline",  acs_id:2,  acs_nome:"João Carlos Nascimento",   microarea:"MA-02", descricao:"ACS offline — sem sinal (zona rural)", ts: ts(1,15,30) },
  // 2 dias atrás
  { tipo:"login",    acs_id:2,  acs_nome:"João Carlos Nascimento",   microarea:"MA-02", descricao:"ACS entrou em campo", ts: ts(2,7,15) },
  { tipo:"visita",   acs_id:2,  acs_nome:"João Carlos Nascimento",   microarea:"MA-02", descricao:"Visita domiciliar — Família Silva (HAS, DM, idoso)", ts: ts(2,8,30), lat:-7.1960, lng:-59.8790 },
  { tipo:"visita",   acs_id:1,  acs_nome:"Maria Aparecida Silva",    microarea:"MA-01", descricao:"Visita puérpera — RN 15 dias, aleitamento materno orientado", ts: ts(2,9,20), lat:-7.1930, lng:-59.8840 },
  { tipo:"producao", acs_id:1,  acs_nome:"Maria Aparecida Silva",    microarea:"MA-01", descricao:"Produção enviada — 4 registros", ts: ts(2,12,0) },
  { tipo:"producao", acs_id:2,  acs_nome:"João Carlos Nascimento",   microarea:"MA-02", descricao:"Produção enviada — 3 registros (visitas domiciliares)", ts: ts(2,13,15) },
  { tipo:"visita",   acs_id:4,  acs_nome:"Raimundo Nonato Costa",    microarea:"MA-04", descricao:"Busca ativa gestante faltosa — localizada, agendada consulta", ts: ts(2,10,0), lat:-7.2020, lng:-59.8860 },
  { tipo:"producao", acs_id:4,  acs_nome:"Raimundo Nonato Costa",    microarea:"MA-04", descricao:"Produção enviada — 2 registros (busca ativa, visita domiciliar)", ts: ts(2,14,30) },
];

const TIPO_COR: Record<string,string> = { visita:"#2563eb", producao:"#16a34a", login:"#0891b2", offline:"#9ca3af" };
const TIPO_LABEL: Record<string,string> = { visita:"Visita", producao:"Produção enviada", login:"Entrada em campo", offline:"Offline" };
const TIPO_ICON: Record<string,React.ReactNode> = {
  visita:   <MapPin size={12}/>,
  producao: <ClipboardList size={12}/>,
  login:    <CheckCircle size={12}/>,
  offline:  <AlertTriangle size={12}/>,
};

function TimelinePanel({ eventos, filtroAcs, filtroMicroarea, filtroTipo }:
  { eventos: EventoTimeline[]; filtroAcs: string; filtroMicroarea: string; filtroTipo: string }) {

  const filtrados = eventos.filter(e => {
    if (filtroAcs !== "Todos" && e.acs_nome !== filtroAcs) return false;
    if (filtroMicroarea !== "Todas" && e.microarea !== filtroMicroarea) return false;
    if (filtroTipo !== "Todos" && e.tipo !== filtroTipo) return false;
    return true;
  });

  return (
    <div style={{ overflowY:"auto", maxHeight:460 }}>
      {filtrados.length === 0 && (
        <div style={{ textAlign:"center", padding:24, color:"#9ca3af", fontSize:12 }}>
          Nenhum evento com os filtros selecionados.
        </div>
      )}
      {filtrados.map((ev, i) => {
        const cor = TIPO_COR[ev.tipo];
        return (
          <div key={i} style={{ display:"flex", gap:10, paddingBottom:12, position:"relative" }}>
            {/* linha vertical */}
            {i < filtrados.length - 1 && (
              <div style={{ position:"absolute", left:15, top:28, width:2, bottom:0, background:"#e5e7eb" }}/>
            )}
            {/* dot */}
            <div style={{
              width:30, height:30, borderRadius:15, background:cor+"18",
              border:`2px solid ${cor}`, display:"flex", alignItems:"center",
              justifyContent:"center", flexShrink:0, color:cor, zIndex:1,
            }}>{TIPO_ICON[ev.tipo]}</div>
            {/* conteúdo */}
            <div style={{ flex:1, background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, padding:"8px 12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <span style={{ fontSize:10, fontWeight:700, color:cor, background:cor+"12", padding:"1px 6px", borderRadius:8, marginRight:6 }}>
                    {TIPO_LABEL[ev.tipo]}
                  </span>
                  <span style={{ fontSize:11, fontWeight:600 }}>{ev.acs_nome.split(" ").slice(0,2).join(" ")}</span>
                  <span style={{ fontSize:10, color:"#9ca3af", marginLeft:6 }}>{ev.microarea}</span>
                </div>
                <span style={{ fontSize:10, color:"#9ca3af", whiteSpace:"nowrap" }}>
                  {new Date(ev.ts).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
                </span>
              </div>
              <div style={{ fontSize:11, color:"#6b7280", marginTop:4, lineHeight:1.4 }}>{ev.descricao}</div>
              {ev.lat && (
                <div style={{ fontSize:10, color:"#9ca3af", marginTop:2 }}>
                  📍 {ev.lat?.toFixed(4)}, {ev.lng?.toFixed(4)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Painel de Relatório ───────────────────────────────────────────────────────

function RelatorioPanel({ posicoes, producao, eventos }:
  { posicoes: PosicaoAcs[]; producao: RegistroProducao[]; eventos: EventoTimeline[] }) {
  const [filtroAcs, setFiltroAcs] = useState("Todos");
  const [filtroMa, setFiltroMa] = useState("Todas");
  // período: por padrão mostra os últimos 3 dias
  const hoje = new Date().toISOString().slice(0,10);
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 2); return d.toISOString().slice(0,10);
  });
  const [dataFim, setDataFim] = useState(hoje);

  const acsNomes = ["Todos", ...posicoes.map(p => p.nome)];
  const microareas = ["Todas", ...Array.from(new Set(posicoes.map(p => p.microarea)))];

  const fmtData = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" });

  const linhas = useMemo(() => posicoes.map(p => {
    // filtra eventos do ACS no intervalo selecionado
    const evsAcs = eventos.filter(e => {
      if (e.acs_id !== p.acs_id) return false;
      const d = new Date(e.ts).toISOString().slice(0, 10);
      return d >= dataInicio && d <= dataFim;
    });
    const visitas = evsAcs.filter(e => e.tipo === "visita");
    const envios  = evsAcs.filter(e => e.tipo === "producao");
    // data/hora do evento mais recente
    const ultimaVisita = [...visitas].sort((a,b) => b.ts.localeCompare(a.ts))[0]?.ts;
    const ultimoEnvio  = [...envios].sort((a,b) => b.ts.localeCompare(a.ts))[0]?.ts;
    return {
      ...p,
      visitas_periodo: visitas.length,
      envios_periodo:  envios.length,
      ultima_visita: ultimaVisita
        ? new Date(ultimaVisita).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})
        : "—",
      ultimo_envio: ultimoEnvio
        ? new Date(ultimoEnvio).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})
        : "—",
    };
  }).filter(r => {
    if (filtroAcs !== "Todos" && r.nome !== filtroAcs) return false;
    if (filtroMa !== "Todas" && r.microarea !== filtroMa) return false;
    return true;
  }), [posicoes, eventos, filtroAcs, filtroMa, dataInicio, dataFim]);

  const totalVisitas = linhas.reduce((s, r) => s + r.visitas_periodo, 0);
  const totalEnvios  = linhas.reduce((s, r) => s + r.envios_periodo, 0);

  return (
    <div>
      {/* Filtros relatório */}
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        {/* Período */}
        <div style={{ display:"flex", alignItems:"center", gap:6, background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, padding:"4px 10px" }}>
          <Calendar size={13} color="#6b7280"/>
          <span style={{ fontSize:11, color:"#6b7280", fontWeight:600 }}>De</span>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
            max={dataFim}
            style={{ border:"none", background:"transparent", fontSize:12, outline:"none", cursor:"pointer" }}/>
          <span style={{ fontSize:11, color:"#6b7280", fontWeight:600 }}>até</span>
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
            min={dataInicio} max={hoje}
            style={{ border:"none", background:"transparent", fontSize:12, outline:"none", cursor:"pointer" }}/>
        </div>
        <select value={filtroAcs} onChange={e => setFiltroAcs(e.target.value)}
          style={{ border:"1px solid #e5e7eb", borderRadius:6, padding:"5px 8px", fontSize:12 }}>
          {acsNomes.map(n => <option key={n} value={n}>{n === "Todos" ? "Todos os ACS" : n}</option>)}
        </select>
        <select value={filtroMa} onChange={e => setFiltroMa(e.target.value)}
          style={{ border:"1px solid #e5e7eb", borderRadius:6, padding:"5px 8px", fontSize:12 }}>
          {microareas.map(m => <option key={m} value={m}>{m === "Todas" ? "Todas as Microáreas" : m}</option>)}
        </select>
        <button onClick={() => window.print()} style={{
          marginLeft:"auto", display:"flex", alignItems:"center", gap:6,
          border:"1px solid #d1d5db", borderRadius:6, padding:"6px 12px",
          background:"#fff", cursor:"pointer", fontSize:12,
        }}>
          <Printer size={13}/> Imprimir / PDF
        </button>
      </div>

      {/* KPIs do período */}
      <div style={{ display:"flex", gap:10, marginBottom:12 }}>
        {[
          { label:"Total de Visitas", valor:totalVisitas, cor:"#2563eb" },
          { label:"Envios de Produção", valor:totalEnvios, cor:"#16a34a" },
          { label:"ACS no período", valor:linhas.filter(r => r.visitas_periodo > 0).length, cor:"#7c3aed" },
        ].map(k => (
          <div key={k.label} style={{ flex:1, background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, padding:"10px 14px" }}>
            <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{k.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.cor, marginTop:2 }}>{k.valor}</div>
            <div style={{ fontSize:10, color:"#9ca3af", marginTop:1 }}>{fmtData(dataInicio)} → {fmtData(dataFim)}</div>
          </div>
        ))}
      </div>

      {/* Tabela relatório */}
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"#f9fafb", borderBottom:"1px solid #e5e7eb" }}>
              {["ACS","Microárea","Status","Visitas no Período","Últ. Visita","Envios Produção","Últ. Envio","Bateria"].map(h => (
                <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:600, color:"#6b7280", fontSize:11, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((r, i) => {
              const cor = STATUS_COR[r.status];
              return (
                <tr key={r.acs_id} style={{ borderBottom:"1px solid #f3f4f6", background: i%2===0?"#fff":"#fafafa" }}>
                  <td style={{ padding:"10px 12px", fontWeight:500 }}>{r.nome.split(" ").slice(0,2).join(" ")}</td>
                  <td style={{ padding:"10px 12px", color:"#6b7280" }}>{r.microarea}</td>
                  <td style={{ padding:"10px 12px" }}>
                    <span style={{ background:cor+"15", color:cor, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10 }}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td style={{ padding:"10px 12px", textAlign:"center", fontWeight:700,
                    color: r.visitas_periodo === 0 ? "#dc2626" : r.visitas_periodo >= 3 ? "#16a34a" : "#d97706" }}>
                    {r.visitas_periodo}
                  </td>
                  <td style={{ padding:"10px 12px", color: r.ultima_visita === "—" ? "#dc2626" : "#374151", fontSize:11 }}>
                    {r.ultima_visita}
                  </td>
                  <td style={{ padding:"10px 12px", textAlign:"center", fontWeight:700,
                    color: r.envios_periodo === 0 ? "#9ca3af" : "#16a34a" }}>
                    {r.envios_periodo}
                  </td>
                  <td style={{ padding:"10px 12px", color: r.ultimo_envio === "—" ? "#9ca3af" : "#374151", fontSize:11 }}>
                    {r.ultimo_envio}
                  </td>
                  <td style={{ padding:"10px 12px" }}>
                    {r.bateria !== null
                      ? <span style={{ color: r.bateria < 20 ? "#dc2626" : r.bateria < 50 ? "#d97706" : "#16a34a", fontWeight:600 }}>
                          🔋 {r.bateria}%
                        </span>
                      : <span style={{ color:"#9ca3af" }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding:"10px 12px", borderTop:"1px solid #e5e7eb", fontSize:11, color:"#9ca3af" }}>
          {linhas.length} ACS · Período: {fmtData(dataInicio)} até {fmtData(dataFim)} · Gerado em {new Date().toLocaleTimeString("pt-BR")}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ACSGeoPage() {
  const { posicoes: posWs, producaoHoje: prodWs, totalAtivos, totalVisitas, conectado, ultimoEvento } = useAcsGeo();
  const [modoDemo, setModoDemo] = useState(false);
  const [vistaGeo, setVistaGeo] = useState<"mapa"|"timeline"|"relatorio">("mapa");
  const [filtroAcsGeo, setFiltroAcsGeo] = useState("Todos");
  const [filtroMaGeo, setFiltroMaGeo] = useState("Todas");
  const [filtroStatusGeo, setFiltroStatusGeo] = useState("Todos");
  const [filtroTipoTimeline, setFiltroTipoTimeline] = useState("Todos");

  // Carrega snapshot REST como fallback (até WebSocket trazer dados)
  const { data: snapshot } = useQuery({
    queryKey: ["acs-localizacoes"],
    queryFn: () => apiGet("/api/acs/localizacoes") as Promise<any>,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // Sem WebSocket ativo e sem snapshot → aguarda dados reais
  useEffect(() => {
    if (!conectado && posWs.length === 0) setModoDemo(false);
    else if (posWs.length > 0) setModoDemo(false);
  }, [conectado, posWs.length]);

  const posicoes = posWs.length > 0 ? posWs : (snapshot?.posicoes ?? []);
  const producao = prodWs.length > 0 ? prodWs : (snapshot?.producao_hoje ?? []);
  const timeline = TIMELINE_DEMO;

  // Sem dados reais → mostrar banner em vez de DEMO fictício
  if (!conectado && posicoes.length === 0) {
    return (
      <div style={{ padding: 40 }}>
        <NaoDisponivelBanner
          titulo="Localização ACS indisponível"
          nota="Nenhum ACS com app de rastreamento conectado. Para habilitar o monitoramento em tempo real, os ACS precisam instalar o app ERSUS ACS e ativar o envio de localização."
        />
      </div>
    );
  }

  const acsNomesGeo  = useMemo(() => ["Todos", ...posicoes.map(p => p.nome)], [posicoes]);
  const microareasGeo = useMemo(() => ["Todas", ...Array.from(new Set(posicoes.map(p => p.microarea)))], [posicoes]);

  const posicoesFiltradas = useMemo(() => posicoes.filter(p => {
    if (filtroAcsGeo !== "Todos" && p.nome !== filtroAcsGeo) return false;
    if (filtroMaGeo !== "Todas" && p.microarea !== filtroMaGeo) return false;
    if (filtroStatusGeo !== "Todos" && p.status !== filtroStatusGeo) return false;
    return true;
  }), [posicoes, filtroAcsGeo, filtroMaGeo, filtroStatusGeo]);

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

      {/* ── Tabs de Vista ── */}
      <div style={{ display:"flex", gap:4, borderBottom:"2px solid #e5e7eb" }}>
        {([
          { id:"mapa",      label:"🗺 Mapa em Tempo Real",   icon:<Navigation size={13}/> },
          { id:"timeline",  label:"⏱ Timeline Visitas",      icon:<Clock size={13}/> },
          { id:"relatorio", label:"📋 Relatório",             icon:<FileText size={13}/> },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setVistaGeo(t.id)} style={{
            display:"flex", alignItems:"center", gap:5,
            padding:"8px 14px", border:"none", background:"none",
            borderBottom: vistaGeo===t.id ? "2px solid #2563eb" : "2px solid transparent",
            color: vistaGeo===t.id ? "#2563eb" : "#6b7280",
            fontWeight: vistaGeo===t.id ? 700 : 400,
            cursor:"pointer", fontSize:13, marginBottom:-2,
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* ── Filtros globais (Mapa + Timeline) ── */}
      {vistaGeo !== "relatorio" && (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, padding:"8px 12px" }}>
          <Filter size={13} color="#9ca3af"/>
          <select value={filtroAcsGeo} onChange={e => setFiltroAcsGeo(e.target.value)}
            style={{ border:"1px solid #e5e7eb", borderRadius:6, padding:"4px 8px", fontSize:12 }}>
            {acsNomesGeo.map(n => <option key={n} value={n}>{n === "Todos" ? "Todos os ACS" : n.split(" ").slice(0,2).join(" ")}</option>)}
          </select>
          <select value={filtroMaGeo} onChange={e => setFiltroMaGeo(e.target.value)}
            style={{ border:"1px solid #e5e7eb", borderRadius:6, padding:"4px 8px", fontSize:12 }}>
            {microareasGeo.map(m => <option key={m} value={m}>{m === "Todas" ? "Todas as Microáreas" : m}</option>)}
          </select>
          {vistaGeo === "mapa" && (
            <div style={{ display:"flex", gap:4 }}>
              {["Todos","ativo","em_visita","deslocamento","offline"].map(s => (
                <button key={s} onClick={() => setFiltroStatusGeo(s)} style={{
                  padding:"3px 9px", fontSize:11, borderRadius:12,
                  border:`1px solid ${STATUS_COR[s]??"#374151"}60`,
                  background: filtroStatusGeo===s ? (STATUS_COR[s]??"#374151") : "#fff",
                  color: filtroStatusGeo===s ? "#fff" : (STATUS_COR[s]??"#374151"),
                  cursor:"pointer", fontWeight:600,
                }}>{s === "Todos" ? "Todos" : STATUS_LABEL[s]}</button>
              ))}
            </div>
          )}
          {vistaGeo === "timeline" && (
            <div style={{ display:"flex", gap:4 }}>
              {["Todos","visita","producao","login","offline"].map(t => (
                <button key={t} onClick={() => setFiltroTipoTimeline(t)} style={{
                  padding:"3px 9px", fontSize:11, borderRadius:12,
                  border:`1px solid ${TIPO_COR[t]??"#374151"}60`,
                  background: filtroTipoTimeline===t ? (TIPO_COR[t]??"#374151") : "#fff",
                  color: filtroTipoTimeline===t ? "#fff" : (TIPO_COR[t]??"#374151"),
                  cursor:"pointer", fontWeight:600,
                }}>{t === "Todos" ? "Todos" : TIPO_LABEL[t]}</button>
              ))}
            </div>
          )}
          <span style={{ marginLeft:"auto", fontSize:11, color:"#9ca3af" }}>
            {vistaGeo === "mapa" ? `${posicoesFiltradas.length} ACS` : `${timeline.length} eventos`}
          </span>
        </div>
      )}

      {/* ── Vista: Timeline ── */}
      {vistaGeo === "timeline" && (
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
            <Clock size={16} color="#2563eb"/> Timeline — Visitas e Envios de Produção
            <span style={{ marginLeft:"auto", fontSize:11, color:"#9ca3af" }}>
              {new Date().toLocaleDateString("pt-BR")} · Tempo Real
            </span>
          </div>
          <TimelinePanel
            eventos={timeline}
            filtroAcs={filtroAcsGeo}
            filtroMicroarea={filtroMaGeo}
            filtroTipo={filtroTipoTimeline}
          />
        </div>
      )}

      {/* ── Vista: Relatório ── */}
      {vistaGeo === "relatorio" && (
        <RelatorioPanel posicoes={posicoes} producao={producao} eventos={timeline}/>
      )}

      {/* ── Vista: Mapa ── */}
      {vistaGeo === "mapa" && (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, flex: 1 }}>

        {/* Mapa */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <AcsMapaGeo posicoes={posicoesFiltradas} producaoHoje={producao} altura={440} />

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
            <PainelStatusAcs posicoes={posicoesFiltradas} />
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
      )}
    </div>
  );
}
