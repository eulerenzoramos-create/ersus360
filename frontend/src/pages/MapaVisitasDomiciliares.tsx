// src/pages/MapaVisitasDomiciliares.tsx — ACS → Mapa de Visitas Domiciliares
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Map, Info } from "lucide-react";
import { apiGet } from "../lib/api";
import { useAcsGeo } from "../hooks/useAcsGeo";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

const APUI_CENTER: [number, number] = [-7.1972, -59.8878];

interface UbsMapa { cnes: string; nome: string; tipo: string; latitude: number; longitude: number }
interface DomicilioMapa { id: number; latitude: number | null; longitude: number | null; status_localizacao: "atual" | "desatualizada" }
interface VisitaMapa {
  id: number; numero_controle: string; latitude: number | null; longitude: number | null;
  status_localizacao: string; cor_legenda: "verde" | "amarelo" | "laranja" | "vermelho" | "cinza" | "roxo";
  acs: string | null; equipe: string | null; microarea: string | null;
  data: string; hora_inicio: string; hora_conclusao: string | null; duracao_segundos: number | null;
  precisao_gps_metros: number | null; status_sincronizacao: string; status_pec: string;
  data_ultimo_processamento: string | null;
}
interface DadosMapa { ubs: UbsMapa[]; domicilios: DomicilioMapa[]; visitas: VisitaMapa[] }

// Legenda exata pedida — 7 cores.
const CORES: Record<string, string> = {
  azul: "#2563eb", verde: "#16a34a", amarelo: "#f59e0b", laranja: "#ea580c",
  vermelho: "#dc2626", cinza: "#9ca3af", roxo: "#7c3aed",
};

const LEGENDA = [
  { cor: "azul", label: "ACS em atividade", pulsante: true },
  { cor: "verde", label: "Concluída e recebida pelo PEC" },
  { cor: "amarelo", label: "Salva, aguardando sincronização" },
  { cor: "laranja", label: "Transmitida, aguardando processamento" },
  { cor: "vermelho", label: "Rejeitada ou com erro" },
  { cor: "cinza", label: "Localização desatualizada" },
  { cor: "roxo", label: "Processada e incluída no fluxo oficial" },
];

const STATUS_LABEL: Record<string, string> = {
  criado_localmente: "Criada localmente", sincronizado_ersus: "Sincronizada no ERSUS",
  validado_ersus: "Validada no ERSUS", preparado_ledi: "Preparada (LEDI)",
  enviado_pec: "Enviada ao PEC", recebido_pec: "Recebida pelo PEC",
  processando_pec: "Processando no PEC", aceito_pec: "Aceita pelo PEC",
  rejeitado_pec: "Rejeitada pelo PEC", corrigido: "Corrigida", reenviado: "Reenviada",
  processado_fluxo_oficial: "Incluída no fluxo oficial",
};

function formatarDuracao(segundos: number | null) {
  if (segundos == null) return "—";
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return `${min}min ${seg}s`;
}

function PainelDetalheVisita({ v, onFechar }: { v: VisitaMapa; onFechar: () => void }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Detalhe da Visita</span>
        <button onClick={onFechar} style={{ border: "none", background: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16 }}>×</button>
      </div>
      {[
        { label: "ACS", val: v.acs || "—" },
        { label: "Equipe", val: v.equipe || "—" },
        { label: "Microárea", val: v.microarea || "—" },
        { label: "Data", val: new Date(v.data).toLocaleDateString("pt-BR") },
        { label: "Hora de início", val: new Date(v.hora_inicio).toLocaleTimeString("pt-BR") },
        { label: "Hora de conclusão", val: v.hora_conclusao ? new Date(v.hora_conclusao).toLocaleTimeString("pt-BR") : "—" },
        { label: "Duração", val: formatarDuracao(v.duracao_segundos) },
        { label: "Precisão do GPS", val: v.precisao_gps_metros != null ? `${v.precisao_gps_metros.toFixed(0)}m` : "—" },
        { label: "Status de sincronização", val: STATUS_LABEL[v.status_sincronizacao] || v.status_sincronizacao },
        { label: "Status no PEC", val: STATUS_LABEL[v.status_pec] || v.status_pec },
        { label: "Número de controle", val: v.numero_controle, mono: true },
        { label: "Último processamento", val: v.data_ultimo_processamento ? new Date(v.data_ultimo_processamento).toLocaleString("pt-BR") : "ainda não processado" },
      ].map(i => (
        <div key={i.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: 11, color: "#6b7280" }}>{i.label}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", fontFamily: i.mono ? "monospace" : "inherit" }}>{i.val}</span>
        </div>
      ))}
    </div>
  );
}

function MapaLeaflet({ dados, posicoesAcs, onSelecionarVisita }: {
  dados: DadosMapa | undefined; posicoesAcs: ReturnType<typeof useAcsGeo>["posicoes"];
  onSelecionarVisita: (v: VisitaMapa) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const camadasRef = useRef<any[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const L = (window as any).L;
    if (!L) { console.warn("[MapaVisitasDomiciliares] Leaflet não encontrado no window.L"); return; }

    const map = L.map(containerRef.current, { center: APUI_CENTER, zoom: 14, zoomControl: true });
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19,
    }).addTo(map);

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const L = (window as any).L;
    const map = mapRef.current;
    if (!L || !map) return;

    camadasRef.current.forEach(l => map.removeLayer(l));
    camadasRef.current = [];

    // UBS
    (dados?.ubs || []).forEach(u => {
      const icon = L.divIcon({
        className: "", html: `<div style="background:#0c4a6e;border:2px solid #fff;border-radius:6px;width:22px;height:22px;
          display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;box-shadow:0 1px 4px rgba(0,0,0,.3)">+</div>`,
        iconSize: [22, 22], iconAnchor: [11, 11],
      });
      const m = L.marker([u.latitude, u.longitude], { icon }).addTo(map)
        .bindPopup(`<b>${u.nome}</b><br>${u.tipo}<br>CNES ${u.cnes}`);
      camadasRef.current.push(m);
    });

    // Domicílios (sem identificação nominal)
    (dados?.domicilios || []).forEach(d => {
      if (d.latitude == null || d.longitude == null) return;
      const cor = d.status_localizacao === "desatualizada" ? CORES.cinza : "#cbd5e1";
      const icon = L.divIcon({
        className: "", html: `<div style="background:${cor};border:1px solid #fff;border-radius:50%;width:8px;height:8px"></div>`,
        iconSize: [8, 8], iconAnchor: [4, 4],
      });
      const m = L.marker([d.latitude, d.longitude], { icon, zIndexOffset: -100 }).addTo(map)
        .bindPopup(`Domicílio #${d.id}<br><span style="color:#9ca3af;font-size:11px">Sem identificação nominal</span>`);
      camadasRef.current.push(m);
    });

    // Visitas — cor por status_fila
    (dados?.visitas || []).forEach(v => {
      if (v.latitude == null || v.longitude == null) return;
      const cor = CORES[v.cor_legenda] || CORES.cinza;
      const icon = L.divIcon({
        className: "", html: `<div style="background:${cor};border:2px solid #fff;border-radius:50%;width:16px;height:16px;
          box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8], popupAnchor: [0, -10],
      });
      const m = L.marker([v.latitude, v.longitude], { icon, zIndexOffset: 400 }).addTo(map);
      m.on("click", () => onSelecionarVisita(v));
      m.bindTooltip(`${v.microarea || ""} · ${STATUS_LABEL[v.status_pec] || v.status_pec}`);
      camadasRef.current.push(m);
    });

    // ACS em atividade — azul pulsante (dado operacional, não oficial)
    posicoesAcs.forEach(pos => {
      const emAtividade = pos.status !== "offline";
      const cor = emAtividade ? CORES.azul : CORES.cinza;
      const pulse = emAtividade
        ? `animation:pulse-acs-visitas 1.4s infinite; box-shadow:0 0 0 0 ${cor}aa;`
        : "";
      const icon = L.divIcon({
        className: "",
        html: `<style>@keyframes pulse-acs-visitas{0%{box-shadow:0 0 0 0 ${cor}88}100%{box-shadow:0 0 0 14px transparent}}</style>
          <div style="background:${cor};border:3px solid #fff;border-radius:50%;width:20px;height:20px;${pulse}"></div>`,
        iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -12],
      });
      const m = L.marker([pos.lat, pos.lng], { icon, zIndexOffset: 900 }).addTo(map)
        .bindPopup(`<b>${pos.nome}</b><br>${emAtividade ? "Em atividade de campo" : "Fora de atividade"}<br>
          <span style="font-size:10px;color:#9ca3af">Última atualização: ${new Date(pos.ts).toLocaleTimeString("pt-BR")}</span>`);
      camadasRef.current.push(m);
    });
  }, [dados, posicoesAcs, onSelecionarVisita]);

  return <div ref={containerRef} style={{ width: "100%", height: 560, borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" }} />;
}

export default function MapaVisitasDomiciliares() {
  const [visitaSelecionada, setVisitaSelecionada] = useState<VisitaMapa | null>(null);
  const { posicoes } = useAcsGeo();

  const { data: dados, isLoading } = useQuery<DadosMapa>({
    queryKey: ["mapa-visitas-domiciliares"],
    queryFn: () => apiGet("/api/mapa-visitas-domiciliares/dados") as Promise<DadosMapa>,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (!isLoading && !dados) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="MapaVisitasDomiciliares indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#0c4a6e 0%,#075985 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
          <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}>
            <Map size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>ACS · Mapa de Visitas Domiciliares</span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
          Monitoramento operacional e territorial — dados clínicos e identificação de cidadãos nunca são exibidos aqui.
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as const, marginTop: 14 }}>
          {LEGENDA.map(l => (
            <span key={l.cor} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,.85)" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: CORES[l.cor], display: "inline-block" }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 28px 60px", display: "grid", gridTemplateColumns: visitaSelecionada ? "1fr 320px" : "1fr", gap: 16 }}>
        <div>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: 80, color: "#9ca3af" }}>Carregando mapa...</div>
          ) : (
            <MapaLeaflet dados={dados} posicoesAcs={posicoes} onSelecionarVisita={setVisitaSelecionada} />
          )}

          {dados && dados.visitas.length === 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, background: "#eff6ff",
              border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#1e40af" }}>
              <Info size={14} />
              Nenhuma visita domiciliar registrada ainda — o aplicativo do ACS que alimenta este mapa está em desenvolvimento
              (ver docs/ERSUS-DOC-024-App-Mobile-ACS.md). Os domicílios e UBS acima já refletem dados reais/reconciliados.
            </div>
          )}
        </div>

        {visitaSelecionada && (
          <PainelDetalheVisita v={visitaSelecionada} onFechar={() => setVisitaSelecionada(null)} />
        )}
      </div>
    </div>
  );
}
