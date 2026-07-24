// src/pages/MapaSanitario.tsx — Mapa Sanitário · Georreferenciamento das Unidades de Saúde
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Activity, Users, Stethoscope, ChevronDown, ChevronRight } from "lucide-react";
import { apiGet } from "../lib/api";

interface UnidadeSaude {
  id: string; nome: string; tipo: string; cnes: string;
  endereco: string; bairro: string; zona: "urbana" | "rural";
  latitude: number; longitude: number;
  equipes: number; profissionais: number; populacao_vinculada: number;
  score_previne: number | null; status_cnes: "ativo" | "inativo" | "pendente";
  servicos: string[]; horario: string;
  indicadores: { nome: string; valor: string; cor: string }[];
}

interface ResumoMapa {
  total_unidades: number; unidades_ativas: number;
  populacao_coberta: number; populacao_total: number;
  cobertura_esf_pct: number; equipes_esf: number;
  municipio: string; area_km2: number;
}

const COR_TIPO: Record<string, string> = {
  "UBS":      "#16a34a",
  "UPA":      "#dc2626",
  "CAPS":     "#7c3aed",
  "Hospital": "#1351b4",
  "SAD":      "#0d9488",
  "NASF-AB":  "#d97706",
  "LAM":      "#ea580c",
  "CEO":      "#9333ea",
};

const ICONE_TIPO: Record<string, string> = {
  "UBS": "🏥", "UPA": "🚨", "CAPS": "🧠", "Hospital": "🏥",
  "SAD": "🏠", "NASF-AB": "👥", "LAM": "🔬", "CEO": "🦷",
};

function PinSVG({ cor, label }: { cor: string; label: string }) {
  return (
    <g>
      <circle cx="0" cy="0" r="12" fill={cor} opacity={0.2}/>
      <circle cx="0" cy="0" r="7" fill={cor}/>
      <text x="0" y="3.5" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="900">{label}</text>
    </g>
  );
}

// SVG estilizado do município de Apuí (AM) — polígono simplificado
function MapaApui({ unidades, selecionado, onSelect }: {
  unidades: UnidadeSaude[];
  selecionado: string | null;
  onSelect: (id: string) => void;
}) {
  // Coordenadas normalizadas para a viewport 600x360
  const toXY = (lat: number, lng: number) => {
    const xMin = -60.1, xMax = -58.9, yMin = -7.8, yMax = -6.8;
    return {
      x: ((lng - xMin) / (xMax - xMin)) * 560 + 20,
      y: ((lat - yMin) / (yMax - yMin)) * 320 + 20,
    };
  };

  // Contorno simplificado do município de Apuí/AM (aproximado)
  const contorno = [
    [-6.85, -59.10], [-6.90, -59.40], [-7.00, -59.70], [-7.15, -59.95],
    [-7.30, -60.05], [-7.50, -60.00], [-7.65, -59.80], [-7.75, -59.50],
    [-7.70, -59.15], [-7.55, -58.95], [-7.30, -58.90], [-7.05, -58.95],
    [-6.85, -59.10],
  ].map(([lat, lng]) => toXY(lat, lng));

  const pts = contorno.map(p => `${p.x},${p.y}`).join(" ");

  // Rios (traços indicativos)
  const rio1 = [
    [-7.20, -59.80], [-7.15, -59.55], [-7.05, -59.30], [-6.95, -59.10],
  ].map(([lat, lng]) => toXY(lat, lng));
  const rio1pts = rio1.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 600 360" style={{ width: "100%", maxWidth: 600, border: "1px solid #e4e7ec", borderRadius: 12, background: "#f0fdf4" }}>
      {/* Fundo */}
      <rect width="600" height="360" fill="#e0f2fe" rx="12"/>
      {/* Área do município */}
      <polygon points={pts} fill="#dcfce7" stroke="#16a34a" strokeWidth="1.5"/>
      {/* Rio (indicativo) */}
      <polyline points={rio1pts} fill="none" stroke="#60a5fa" strokeWidth="2" opacity={0.7} strokeDasharray="4 2"/>
      {/* Label do município */}
      <text x="300" y="30" textAnchor="middle" fontSize="12" fontWeight="800" fill="#166534" opacity={0.6}>APUÍ · AM</text>
      {/* Unidades de saúde */}
      {unidades.map(u => {
        const { x, y } = toXY(u.latitude, u.longitude);
        const cor = COR_TIPO[u.tipo] ?? "#374151";
        const sel = selecionado === u.id;
        return (
          <g key={u.id} transform={`translate(${x},${y})`} style={{ cursor: "pointer" }} onClick={() => onSelect(u.id)}>
            {sel && <circle cx="0" cy="0" r="18" fill={cor} opacity={0.25}/>}
            <circle cx="0" cy="0" r={sel ? 11 : 9} fill={cor} stroke="#fff" strokeWidth="2"/>
            <text x="0" y="3.5" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="900">
              {u.tipo.substring(0, 3)}
            </text>
            {sel && (
              <text x="0" y="-15" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1f2937"
                style={{ background: "#fff" }}>
                {u.nome.length > 20 ? u.nome.substring(0, 18) + "…" : u.nome}
              </text>
            )}
          </g>
        );
      })}
      {/* Legenda */}
      {Object.entries(COR_TIPO).map(([tipo, cor], i) => (
        <g key={tipo} transform={`translate(${10 + (i % 4) * 140},${320 + Math.floor(i / 4) * 14})`}>
          <circle cx="5" cy="5" r="5" fill={cor}/>
          <text x="14" y="9" fontSize="9" fill="#374151">{tipo}</text>
        </g>
      ))}
    </svg>
  );
}

function CardUnidade({ u }: { u: UnidadeSaude }) {
  const [aberto, setAberto] = useState(false);
  const cor = COR_TIPO[u.tipo] ?? "#374151";

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}25`, borderLeft: `3px solid ${cor}`, borderRadius: 8, marginBottom: 6, overflow: "hidden" }}>
      <div onClick={() => setAberto(o => !o)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer" }}>
        <span style={{ fontSize: 16 }}>{ICONE_TIPO[u.tipo] ?? "🏥"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" as const }}>
            <span style={{ fontWeight: 700, fontSize: 12 }}>{u.nome}</span>
            <span style={{ fontSize: 8, fontWeight: 800, background: cor + "18", color: cor, padding: "1px 6px", borderRadius: 8 }}>{u.tipo}</span>
            <span style={{ fontSize: 8, color: "#9ca3af" }}>CNES {u.cnes} · {u.zona}</span>
          </div>
          <div style={{ fontSize: 10, color: "#6b7280" }}>
            {u.endereco} · Pop. vinculada: <b>{u.populacao_vinculada.toLocaleString("pt-BR")}</b>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {u.indicadores.slice(0, 2).map((ind, i) => (
            <span key={i} style={{ fontSize: 9, fontWeight: 800, color: ind.cor, background: ind.cor + "15", padding: "2px 6px", borderRadius: 6 }}>
              {ind.valor}
            </span>
          ))}
        </div>
        {aberto ? <ChevronDown size={13} color="#9ca3af"/> : <ChevronRight size={13} color="#9ca3af"/>}
      </div>

      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}15`, padding: "12px 14px", background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>Informações</div>
              {[
                ["Endereço", u.endereco],
                ["Bairro/Localidade", u.bairro],
                ["Zona", u.zona],
                ["Horário", u.horario],
                ["Equipes ESF", u.equipes.toString()],
                ["Profissionais", u.profissionais.toString()],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 9, color: "#9ca3af" }}>{l}</span>
                  <span style={{ fontSize: 9, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 6 }}>Indicadores</div>
              {u.indicadores.map((ind, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 9, color: "#6b7280" }}>{ind.nome}</span>
                  <span style={{ fontSize: 10, fontWeight: 900, color: ind.cor }}>{ind.valor}</span>
                </div>
              ))}
              <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, marginBottom: 4 }}>Serviços</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
                {u.servicos.map((s, i) => (
                  <span key={i} style={{ fontSize: 8, background: "#f3f4f6", color: "#374151", padding: "2px 6px", borderRadius: 6 }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapaSanitario() {
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroZona, setFiltroZona] = useState("todos");

  const { data: resumo } = useQuery<ResumoMapa>({
    queryKey: ["mapa-resumo"],
    queryFn: () => apiGet("/api/mapa-sanitario/resumo") as Promise<ResumoMapa>,
    staleTime: 300_000,
  });

  const { data: unidades = [], isLoading } = useQuery<UnidadeSaude[]>({
    queryKey: ["mapa-unidades"],
    queryFn: () => apiGet("/api/mapa-sanitario/unidades") as Promise<UnidadeSaude[]>,
    staleTime: 300_000,
  });

  const tipos = ["todos", ...Array.from(new Set(unidades.map(u => u.tipo))).sort()];
  const visiveis = unidades.filter(u => {
    const okTipo = filtroTipo === "todos" || u.tipo === filtroTipo;
    const okZona = filtroZona === "todos" || u.zona === filtroZona;
    return okTipo && okZona;
  });

  const r = resumo;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#064e3b 0%,#047857 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><MapPin size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Mapa Sanitário · Rede de Atenção</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Georreferenciamento das Unidades de Saúde · SCNES · Apuí/AM · {r?.area_km2?.toLocaleString("pt-BR") ?? "54.279"} km²
            </div>
          </div>
        </div>

        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginTop: 16 }}>
            {[
              { l: "Unidades",        v: r.total_unidades,                                    cor: "#bbf7d0" },
              { l: "Ativas",          v: r.unidades_ativas,                                   cor: "#86efac" },
              { l: "Equipes ESF",     v: r.equipes_esf,                                       cor: "#86efac" },
              { l: "Pop. Coberta",    v: r.populacao_coberta.toLocaleString("pt-BR"),         cor: "#bae6fd" },
              { l: "Pop. Total",      v: r.populacao_total.toLocaleString("pt-BR"),           cor: "#bae6fd" },
              { l: "Cobertura ESF",   v: `${r.cobertura_esf_pct}%`,                          cor: "#86efac" },
            ].map(k => (
              <div key={k.l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 10px", textAlign: "center" as const }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: k.cor }}>{k.v}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)" }}>{k.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        {/* Mapa SVG */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: "#374151" }}>
            Distribuição Geográfica das Unidades · Clique para selecionar
          </div>
          {!isLoading && <MapaApui unidades={visiveis} selecionado={selecionado} onSelect={id => setSelecionado(id === selecionado ? null : id)}/>}
        </div>

        {/* Filtros */}
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" as const, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Tipo:</span>
          {tipos.map(t => {
            const cor = t === "todos" ? "#047857" : COR_TIPO[t] ?? "#374151";
            const ativo = filtroTipo === t;
            return (
              <button key={t} onClick={() => setFiltroTipo(t)}
                style={{ padding: "5px 10px", fontSize: 10, borderRadius: 20, border: `1px solid ${ativo ? cor : "#d1d5db"}`, background: ativo ? cor + "15" : "#fff", color: ativo ? cor : "#374151", cursor: "pointer" }}>
                {t === "todos" ? "Todos" : t}
              </button>
            );
          })}
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Zona:</span>
          {["todos", "urbana", "rural"].map(z => (
            <button key={z} onClick={() => setFiltroZona(z)}
              style={{ padding: "5px 10px", fontSize: 10, borderRadius: 20, border: `1px solid ${filtroZona===z?"#047857":"#d1d5db"}`, background: filtroZona===z?"#dcfce7":"#fff", color: filtroZona===z?"#047857":"#374151", cursor: "pointer" }}>
              {z === "todos" ? "Todas" : z.charAt(0).toUpperCase() + z.slice(1)}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af" }}>{visiveis.length} unidade(s)</span>
        </div>

        {isLoading
          ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando rede de saúde...</div>
          : visiveis.map(u => <CardUnidade key={u.id} u={u}/>)
        }
      </div>
    </div>
  );
}
