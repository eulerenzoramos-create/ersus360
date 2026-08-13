// src/pages/LinhaTempoCidadao.tsx — Linha do Tempo Unificada do Cidadão (CADSUS + PEC + RNDS)
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User, Search, Calendar, Syringe, Pill, Stethoscope, FileText,
  Activity, Home, AlertCircle, ChevronDown, ChevronRight, MapPin,
  Heart, Shield, Clock, Database, RefreshCw, X,
} from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Cidadao {
  cns: string; cpf: string; nome: string; data_nascimento: string; sexo: string;
  mae: string; municipio_nascimento: string; uf_nascimento: string;
  raca_cor: string; escolaridade: string; situacao_trabalho: string;
  cns_ativo: boolean; ultimo_atendimento: string; microarea: string; acs: string; equipe: string;
  fontes: string[];
}

interface EventoTimeline {
  id: string; data: string; hora: string | null;
  tipo: "atendimento" | "vacina" | "prescricao" | "exame" | "visita" | "cadastro" | "internacao" | "encaminhamento";
  titulo: string; descricao: string; profissional: string | null; local: string | null;
  fonte: "PEC" | "RNDS" | "CADSUS" | "SIAPS"; cid?: string; procedimentos?: string[];
  medicamentos?: string[]; resultado?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIPO_COR: Record<string, string> = {
  atendimento: "#1351b4", vacina: "#16a34a", prescricao: "#7c3aed",
  exame: "#d97706", visita: "#0891b2", cadastro: "#9ca3af",
  internacao: "#dc2626", encaminhamento: "#f59e0b",
};
const TIPO_ICON: Record<string, React.ElementType> = {
  atendimento: Stethoscope, vacina: Syringe, prescricao: Pill,
  exame: Activity, visita: Home, cadastro: FileText,
  internacao: AlertCircle, encaminhamento: MapPin,
};
const FONTE_COR: Record<string, string> = {
  PEC: "#1351b4", RNDS: "#3730a3", CADSUS: "#059669", SIAPS: "#d97706",
};

// ── Componente Timeline ───────────────────────────────────────────────────────

function ItemTimeline({ ev }: { ev: EventoTimeline }) {
  const [aberto, setAberto] = useState(false);
  const cor = TIPO_COR[ev.tipo];
  const Icon = TIPO_ICON[ev.tipo] || FileText;
  const fonteCor = FONTE_COR[ev.fonte];

  return (
    <div style={{ display: "flex", gap: 14, position: "relative" }}>
      {/* Linha vertical */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 32 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${cor}15`,
          border: `2px solid ${cor}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} color={cor}/>
        </div>
        <div style={{ width: 2, flex: 1, background: "#e4e7ec", marginTop: 6 }}/>
      </div>

      {/* Card */}
      <div style={{ flex: 1, background: "#fff", border: `1px solid ${cor}20`,
        borderRadius: 10, marginBottom: 12, overflow: "hidden" }}>
        <div onClick={() => setAberto(o => !o)}
          style={{ padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{ev.titulo}</span>
              <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 7px", borderRadius: 10,
                background: `${fonteCor}15`, color: fonteCor, border: `1px solid ${fonteCor}30` }}>
                {ev.fonte}
              </span>
              {ev.cid && (
                <span style={{ fontSize: 9, fontFamily: "monospace", background: "#f1f5f9",
                  color: "#475569", padding: "1px 5px", borderRadius: 4 }}>{ev.cid}</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              {ev.data}{ev.hora ? ` às ${ev.hora}` : ""}
              {ev.local && ` · ${ev.local}`}
              {ev.profissional && ` · ${ev.profissional}`}
            </div>
          </div>
          {aberto ? <ChevronDown size={13} color="#9ca3af"/> : <ChevronRight size={13} color="#9ca3af"/>}
        </div>

        {aberto && (
          <div style={{ padding: "12px 14px", background: "#fafafa", borderTop: `1px solid ${cor}15` }}>
            <p style={{ fontSize: 12, color: "#374151", marginBottom: 10, lineHeight: 1.6 }}>{ev.descricao}</p>
            {ev.procedimentos && ev.procedimentos.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 5 }}>Procedimentos</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                  {ev.procedimentos.map((p, i) => (
                    <span key={i} style={{ fontSize: 10, background: "#eff6ff", color: "#1d4ed8",
                      padding: "2px 8px", borderRadius: 6, fontFamily: "monospace" }}>{p}</span>
                  ))}
                </div>
              </div>
            )}
            {ev.medicamentos && ev.medicamentos.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 5 }}>Medicamentos</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                  {ev.medicamentos.map((m, i) => (
                    <span key={i} style={{ fontSize: 10, background: "#faf5ff", color: "#7c3aed",
                      padding: "2px 8px", borderRadius: 6 }}>{m}</span>
                  ))}
                </div>
              </div>
            )}
            {ev.resultado && (
              <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>Resultado: {ev.resultado}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Painel do Cidadão ─────────────────────────────────────────────────────────

function PainelCidadao({ c }: { c: Cidadao }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg,#1351b4,#0c3d8a)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <User size={24} color="#fff"/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{c.nome}</span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10,
              background: c.cns_ativo ? "#dcfce7" : "#fee2e2", color: c.cns_ativo ? "#16a34a" : "#dc2626",
              fontWeight: 700 }}>{c.cns_ativo ? "CNS Ativo" : "CNS Inativo"}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 8 }}>
            {[
              { label: "CNS", val: c.cns, mono: true },
              { label: "CPF", val: c.cpf ? c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "—", mono: true },
              { label: "Nascimento", val: c.data_nascimento },
              { label: "Sexo", val: c.sexo },
              { label: "Raça/Cor", val: c.raca_cor },
              { label: "Escolaridade", val: c.escolaridade },
              { label: "Microárea", val: c.microarea },
              { label: "ACS", val: c.acs },
              { label: "Equipe", val: c.equipe },
            ].map(i => (
              <div key={i.label} style={{ background: "#f8fafc", borderRadius: 7, padding: "7px 10px" }}>
                <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" as const }}>{i.label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151",
                  fontFamily: i.mono ? "monospace" : "inherit" }}>{i.val}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {c.fontes.map(f => (
              <span key={f} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10,
                background: `${FONTE_COR[f] || "#9ca3af"}15`, color: FONTE_COR[f] || "#9ca3af",
                fontWeight: 700, border: `1px solid ${FONTE_COR[f] || "#9ca3af"}30` }}>
                ✓ {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────

export default function LinhaTempoCidadao() {
  const [cns, setCns] = useState("");
  const [buscando, setBuscando] = useState("");
  const [filtroFonte, setFiltroFonte] = useState<string[]>([]);
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const { data: cidadao, isLoading: loadCid, error: errCid } = useQuery<Cidadao>({
    queryKey: ["cidadao", buscando],
    queryFn: () => apiGet("/api/linha-tempo/cidadao", { cns: buscando }) as Promise<Cidadao>,
    enabled: buscando.length > 0,
    staleTime: 120_000,
  });

  const { data: eventos = [], isLoading: loadEv } = useQuery<EventoTimeline[]>({
    queryKey: ["linha-tempo-eventos", buscando, filtroFonte, filtroTipo],
    queryFn: () => apiGet("/api/linha-tempo/eventos", {
      cns: buscando,
      fontes: filtroFonte.length > 0 ? filtroFonte.join(",") : undefined,
      tipo: filtroTipo !== "todos" ? filtroTipo : undefined,
    }) as Promise<EventoTimeline[]>,
    enabled: buscando.length > 0,
    staleTime: 120_000,
  });

  const handleBuscar = () => {
    const v = cns.replace(/\D/g, "");
    if (v.length >= 10) setBuscando(v);
  };

  // Agrupar eventos por ano/mês
  const grupos: Record<string, EventoTimeline[]> = {};
  for (const ev of eventos) {
    const [ano, mes] = ev.data.split("/").length === 3
      ? [ev.data.split("/")[2], ev.data.split("/")[1]]
      : [ev.data.split("-")[0], ev.data.split("-")[1]];
    const chave = `${ano}/${mes}`;
    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(ev);
  }

  const MESES: Record<string, string> = {
    "01":"Janeiro","02":"Fevereiro","03":"Março","04":"Abril","05":"Maio","06":"Junho",
    "07":"Julho","08":"Agosto","09":"Setembro","10":"Outubro","11":"Novembro","12":"Dezembro",
  };

  const toggleFonte = (f: string) => {
    setFiltroFonte(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  if (!loadCid && !cidadao) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="LinhaTempoCidadao indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0c4a6e 0%,#0369a1 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
          <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}>
            <Clock size={18} color="#fff"/>
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Linha do Tempo Unificada do Cidadão</span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
          Histórico completo · CADSUS + eSUS PEC + RNDS FHIR R4 + SIAPS · Por CNS
        </div>

        {/* Busca */}
        <div style={{ display: "flex", gap: 10, marginTop: 16, maxWidth: 520 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)",
            borderRadius: 10, padding: "10px 14px" }}>
            <User size={14} color="rgba(255,255,255,.7)"/>
            <input value={cns} onChange={e => setCns(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleBuscar()}
              placeholder="CNS do cidadão (15 dígitos)..."
              style={{ flex: 1, background: "none", border: "none", outline: "none",
                color: "#fff", fontSize: 14, fontFamily: "monospace" }}/>
            {cns && <X size={14} color="rgba(255,255,255,.5)" onClick={() => { setCns(""); setBuscando(""); }} style={{ cursor: "pointer" }}/>}
          </div>
          <button onClick={handleBuscar}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.9)",
              color: "#0369a1", border: "none", borderRadius: 10, padding: "10px 20px",
              fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
            <Search size={14}/> Buscar
          </button>
        </div>
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        {!buscando && (
          <div style={{ textAlign: "center", padding: 80, color: "#9ca3af" }}>
            <User size={48} color="#d1d5db" style={{ marginBottom: 12 }}/>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Busque pelo CNS do cidadão</div>
            <div style={{ fontSize: 13 }}>O histórico completo de CADSUS, eSUS PEC e RNDS será exibido na linha do tempo.</div>
          </div>
        )}

        {buscando && (loadCid || loadEv) && (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
            <RefreshCw size={24} color="#d1d5db" style={{ marginBottom: 8 }}/>
            <div>Consultando CADSUS · eSUS PEC · RNDS...</div>
          </div>
        )}

        {cidadao && (
          <>
            <PainelCidadao c={cidadao}/>

            {/* Filtros */}
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px",
              marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap" as const, alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Fonte:</span>
              {(["PEC","RNDS","CADSUS","SIAPS"] as const).map(f => (
                <button key={f} onClick={() => toggleFonte(f)}
                  style={{ padding: "4px 10px", fontSize: 11, borderRadius: 20,
                    border: `1px solid ${filtroFonte.includes(f) ? FONTE_COR[f] : "#d1d5db"}`,
                    background: filtroFonte.includes(f) ? `${FONTE_COR[f]}15` : "#fff",
                    color: filtroFonte.includes(f) ? FONTE_COR[f] : "#374151",
                    cursor: "pointer", fontWeight: filtroFonte.includes(f) ? 700 : 400 }}>
                  {f}
                </button>
              ))}
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginLeft: 8 }}>Tipo:</span>
              {["todos","atendimento","vacina","prescricao","exame","visita","internacao"].map(t => (
                <button key={t} onClick={() => setFiltroTipo(t)}
                  style={{ padding: "4px 10px", fontSize: 11, borderRadius: 20,
                    border: `1px solid ${filtroTipo===t ? "#0369a1" : "#d1d5db"}`,
                    background: filtroTipo===t ? "#eff6ff" : "#fff",
                    color: filtroTipo===t ? "#0369a1" : "#374151",
                    cursor: "pointer", fontWeight: filtroTipo===t ? 700 : 400 }}>
                  {t === "todos" ? "Todos" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>{eventos.length} eventos</span>
            </div>

            {/* Linha do tempo */}
            {Object.entries(grupos).sort((a,b) => b[0].localeCompare(a[0])).map(([periodo, evs]) => {
              const [ano, mes] = periodo.split("/");
              return (
                <div key={periodo} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ background: "#0369a1", color: "#fff", borderRadius: 8,
                      padding: "4px 14px", fontSize: 12, fontWeight: 800 }}>
                      {MESES[mes] || mes} {ano}
                    </div>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{evs.length} evento(s)</span>
                    <div style={{ flex: 1, height: 1, background: "#e4e7ec" }}/>
                  </div>
                  {evs.map(ev => <ItemTimeline key={ev.id} ev={ev}/>)}
                </div>
              );
            })}

            {eventos.length === 0 && !loadEv && (
              <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
                Nenhum evento encontrado com os filtros atuais.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
