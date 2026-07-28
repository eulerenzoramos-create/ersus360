// src/pages/RegistrarVisita.tsx — ACS → Registrar Visita Domiciliar
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, MapPin, Play, CheckCircle2 } from "lucide-react";
import { apiGet, apiPost } from "../lib/api";

interface Opcoes {
  profissionais: { id: number; nome: string; cargo: string | null }[];
  domicilios: { id: number; uuid_ficha: string; microarea_id: number }[];
  cidadaos: { id: number; nome: string; cns_mascarado: string; domicilio_id: number | null }[];
}

const TIPOS_VISITA = ["Rotina", "Busca ativa", "Puerpério", "Acompanhamento gestante", "Retorno", "Outro"];
const DESFECHOS = ["Realizada", "Ausente", "Recusa", "Domicílio fechado", "Mudança de endereço"];

export default function RegistrarVisita() {
  const navigate = useNavigate();
  const [profissionalId, setProfissionalId] = useState<number | "">("");
  const [domicilioId, setDomicilioId] = useState<number | "">("");
  const [cidadaoId, setCidadaoId] = useState<number | "">("");
  const [motivoVisita, setMotivoVisita] = useState("");
  const [tipoVisita, setTipoVisita] = useState(TIPOS_VISITA[0]);
  const [acompanhamento, setAcompanhamento] = useState("");
  const [desfecho, setDesfecho] = useState(DESFECHOS[0]);
  const [inicio, setInicio] = useState<number | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [erroGeo, setErroGeo] = useState<string | null>(null);

  const { data: opcoes, isLoading } = useQuery<Opcoes>({
    queryKey: ["visitas-domiciliares-opcoes"],
    queryFn: () => apiGet("/api/visitas-domiciliares/opcoes") as Promise<Opcoes>,
  });

  const registrar = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiPost("/api/visitas-domiciliares", body),
    onSuccess: (resp: any) => {
      setSucesso(resp.mensagem || "Visita registrada com sucesso.");
      setInicio(null);
      setMotivoVisita(""); setAcompanhamento("");
    },
  });

  const iniciarVisita = () => {
    setInicio(Date.now());
    setSucesso(null);
    setErroGeo(null);
  };

  const concluirVisita = () => {
    if (!profissionalId || !domicilioId || !inicio) return;
    const duracaoSegundos = Math.round((Date.now() - inicio) / 1000);

    const enviar = (lat?: number, lng?: number, precisao?: number) => {
      registrar.mutate({
        profissional_id: profissionalId,
        domicilio_id: domicilioId,
        cidadao_id: cidadaoId || null,
        motivo_visita: motivoVisita || tipoVisita,
        tipo_visita: tipoVisita,
        acompanhamento_realizado: acompanhamento || null,
        desfecho,
        duracao_segundos: duracaoSegundos,
        latitude_visita: lat ?? null,
        longitude_visita: lng ?? null,
        precisao_gps_metros: precisao ?? null,
      });
    };

    if (!navigator.geolocation) {
      setErroGeo("Geolocalização não disponível neste dispositivo — visita será salva sem coordenadas.");
      enviar();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => enviar(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      err => {
        setErroGeo(`Não foi possível capturar a localização (${err.message}) — visita será salva sem coordenadas.`);
        enviar();
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#0c4a6e 0%,#075985 100%)", padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}>
            <ClipboardCheck size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>Registrar Visita Domiciliar</span>
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginTop: 4 }}>
          A localização só é capturada ao concluir a visita, com sua autorização do navegador.
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 60px" }}>
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 12, padding: 18 }}>

          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>ACS responsável</label>
          <select value={profissionalId} disabled={!!inicio} onChange={e => setProfissionalId(Number(e.target.value))}
            style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 14, borderRadius: 8, border: "1px solid #d1d5db" }}>
            <option value="">{isLoading ? "Carregando..." : "Selecione"}</option>
            {opcoes?.profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>

          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Domicílio</label>
          <select value={domicilioId} disabled={!!inicio} onChange={e => setDomicilioId(Number(e.target.value))}
            style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 14, borderRadius: 8, border: "1px solid #d1d5db" }}>
            <option value="">{isLoading ? "Carregando..." : "Selecione"}</option>
            {opcoes?.domicilios.map(d => <option key={d.id} value={d.id}>Domicílio #{d.id} ({d.uuid_ficha})</option>)}
          </select>

          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Cidadão (opcional)</label>
          <select value={cidadaoId} disabled={!!inicio} onChange={e => setCidadaoId(e.target.value ? Number(e.target.value) : "")}
            style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 14, borderRadius: 8, border: "1px solid #d1d5db" }}>
            <option value="">Visita geral do domicílio (sem cidadão específico)</option>
            {opcoes?.cidadaos
              .filter(c => !domicilioId || c.domicilio_id === domicilioId)
              .map(c => <option key={c.id} value={c.id}>{c.nome} ({c.cns_mascarado})</option>)}
          </select>

          {!inicio ? (
            <button onClick={iniciarVisita} disabled={!profissionalId || !domicilioId}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: profissionalId && domicilioId ? "#0284c7" : "#e5e7eb",
                color: profissionalId && domicilioId ? "#fff" : "#9ca3af",
                border: "none", borderRadius: 8, padding: "12px 0", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              <Play size={14} /> Iniciar Visita
            </button>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "#0284c7", marginBottom: 12 }}>
                Visita iniciada às {new Date(inicio).toLocaleTimeString("pt-BR")}
              </div>

              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Tipo de visita</label>
              <select value={tipoVisita} onChange={e => setTipoVisita(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 14, borderRadius: 8, border: "1px solid #d1d5db" }}>
                {TIPOS_VISITA.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Motivo da visita</label>
              <input value={motivoVisita} onChange={e => setMotivoVisita(e.target.value)} placeholder="Ex.: acompanhamento mensal"
                style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 14, borderRadius: 8, border: "1px solid #d1d5db" }} />

              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Acompanhamento realizado</label>
              <textarea value={acompanhamento} onChange={e => setAcompanhamento(e.target.value)} rows={3}
                style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 14, borderRadius: 8, border: "1px solid #d1d5db", resize: "vertical" as const }} />

              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Desfecho</label>
              <select value={desfecho} onChange={e => setDesfecho(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 16, borderRadius: 8, border: "1px solid #d1d5db" }}>
                {DESFECHOS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <button onClick={concluirVisita} disabled={registrar.isPending}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "12px 0",
                  fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                <MapPin size={14} /> {registrar.isPending ? "Salvando..." : "Concluir e Registrar"}
              </button>
            </>
          )}

          {erroGeo && (
            <div style={{ marginTop: 12, fontSize: 11, color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 10px" }}>
              {erroGeo}
            </div>
          )}

          {sucesso && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#166534",
                background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px" }}>
                <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {sucesso}
              </div>
              <button onClick={() => navigate("/acs/mapa-visitas")}
                style={{ background: "none", border: "1px solid #0284c7", color: "#0284c7", borderRadius: 8,
                  padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Ver no Mapa de Visitas Domiciliares
              </button>
            </div>
          )}

          {registrar.isError && (
            <div style={{ marginTop: 12, fontSize: 11, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 10px" }}>
              Erro ao registrar a visita. Tente novamente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
