// src/pages/PainelVacinacao.tsx — Painel de Vacinação PNI · SIPNI
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Syringe, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { apiGet } from "../lib/api";

interface ImunoBiologico {
  id: string; nome: string; sigla: string;
  publico_alvo: string; doses_aplicadas: number; meta: number;
  cobertura_pct: number; homogeneidade_pct: number;
  status: "meta_atingida" | "alerta" | "critico";
  doses_por_mes: number[]; meses: string[];
  alertas: string[];
}

interface ResumoVacinacao {
  total_doses_ano: number; meta_doses_ano: number;
  imuno_meta_atingida: number; imuno_alerta: number; imuno_critico: number;
  cobertura_media: number; homogeneidade_media: number;
  doses_ultimo_mes: number;
}

const COR_STATUS: Record<string, string> = {
  meta_atingida: "#16a34a", alerta: "#d97706", critico: "#dc2626",
};
const LABEL_STATUS: Record<string, string> = {
  meta_atingida: "Meta Atingida", alerta: "Alerta", critico: "Crítico",
};

function MiniBar({ valores, meta }: { valores: number[]; meta: number }) {
  const max = Math.max(...valores, meta);
  return (
    <svg width="120" height="32" style={{ display: "block" }}>
      {valores.map((v, i) => {
        const h = Math.round((v / max) * 28);
        const cor = v >= meta ? "#16a34a" : v >= meta * 0.8 ? "#d97706" : "#dc2626";
        return <rect key={i} x={i * 10} y={30 - h} width={8} height={h} rx={2} fill={cor} opacity={0.8}/>;
      })}
    </svg>
  );
}

function CardImuno({ im }: { im: ImunoBiologico }) {
  const [aberto, setAberto] = useState(false);
  const cor = COR_STATUS[im.status];
  const pct = Math.min(100, im.cobertura_pct);

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}25`, borderLeft: `4px solid ${cor}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setAberto(o => !o)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: cor + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" as const }}>
          <svg width="48" height="48" style={{ position: "absolute" as const, top: 0, left: 0 }}>
            <circle cx="24" cy="24" r="20" fill="none" stroke={cor + "30"} strokeWidth="4"/>
            <circle cx="24" cy="24" r="20" fill="none" stroke={cor} strokeWidth="4"
              strokeDasharray={`${(pct / 100) * 125.6} 125.6`}
              strokeDashoffset="31.4" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 10, fontWeight: 900, color: cor, zIndex: 1 }}>{pct.toFixed(0)}%</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>{im.nome}</span>
            <span style={{ fontSize: 9, fontWeight: 800, background: cor + "18", color: cor, padding: "2px 7px", borderRadius: 10 }}>{LABEL_STATUS[im.status]}</span>
            <span style={{ fontSize: 9, color: "#9ca3af" }}>{im.sigla} · {im.publico_alvo}</span>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 10, color: "#6b7280" }}>
            <span>Aplicadas: <b style={{ color: "#111" }}>{im.doses_aplicadas.toLocaleString("pt-BR")}</b></span>
            <span>Meta: <b style={{ color: "#111" }}>{im.meta.toLocaleString("pt-BR")}</b></span>
            <span>Homogeneidade: <b style={{ color: im.homogeneidade_pct >= 80 ? "#16a34a" : "#dc2626" }}>{im.homogeneidade_pct}%</b></span>
          </div>
          {im.alertas.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" as const }}>
              {im.alertas.map((a, i) => (
                <span key={i} style={{ fontSize: 9, background: "#fef3c7", color: "#92400e", padding: "1px 7px", borderRadius: 8, fontWeight: 600 }}>⚠ {a}</span>
              ))}
            </div>
          )}
        </div>
        <MiniBar valores={im.doses_por_mes} meta={im.meta / 12}/>
        {aberto ? <ChevronDown size={14} color="#9ca3af"/> : <ChevronRight size={14} color="#9ca3af"/>}
      </div>

      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}15`, padding: "14px 16px", background: "#fafafa" }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10 }}>Doses aplicadas por mês (2026)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 6 }}>
            {im.doses_por_mes.map((d, i) => {
              const cor2 = d >= im.meta / 12 ? "#16a34a" : d >= (im.meta / 12) * 0.8 ? "#d97706" : "#dc2626";
              return (
                <div key={i} style={{ textAlign: "center" as const }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: cor2 }}>{d}</div>
                  <div style={{ fontSize: 8, color: "#9ca3af" }}>{im.meses[i]}</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { l: "Cobertura atual", v: `${im.cobertura_pct.toFixed(1)}%`, cor: cor },
              { l: "Meta anual",      v: im.meta.toLocaleString("pt-BR"),   cor: "#374151" },
              { l: "Déficit",         v: Math.max(0, im.meta - im.doses_aplicadas).toLocaleString("pt-BR") + " doses", cor: "#dc2626" },
            ].map(k => (
              <div key={k.l} style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", border: "1px solid #e4e7ec" }}>
                <div style={{ fontSize: 9, color: "#9ca3af" }}>{k.l}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: k.cor }}>{k.v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PainelVacinacao() {
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const { data: resumo } = useQuery<ResumoVacinacao>({
    queryKey: ["vacina-resumo"],
    queryFn: () => apiGet("/api/vacinacao/resumo") as Promise<ResumoVacinacao>,
    staleTime: 300_000,
  });

  const { data: imunos = [], isLoading } = useQuery<ImunoBiologico[]>({
    queryKey: ["vacina-imunos", filtroStatus],
    queryFn: () => apiGet("/api/vacinacao/imunobiologicos", { status: filtroStatus !== "todos" ? filtroStatus : undefined }) as Promise<ImunoBiologico[]>,
    staleTime: 300_000,
  });

  const r = resumo;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#0c4a6e 0%,#0369a1 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><Syringe size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Painel de Vacinação · PNI</span>
              <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,.2)", color: "#bae6fd", padding: "2px 9px", borderRadius: 10 }}>SIPNI</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Cobertura vacinal · Homogeneidade · Imunobiológicos do Calendário Nacional · FMS Apuí/AM · 2026
            </div>
          </div>
        </div>

        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 8, marginTop: 16 }}>
            {[
              { l: "Doses no Ano",      v: r.total_doses_ano.toLocaleString("pt-BR"), cor: "#bae6fd" },
              { l: "Meta Anual",        v: r.meta_doses_ano.toLocaleString("pt-BR"),  cor: "#bae6fd" },
              { l: "Cobertura Média",   v: `${r.cobertura_media}%`,                   cor: "#86efac" },
              { l: "Homogeneidade",     v: `${r.homogeneidade_media}%`,               cor: "#86efac" },
              { l: "Meta Atingida",     v: r.imuno_meta_atingida,                     cor: "#86efac" },
              { l: "Em Alerta",         v: r.imuno_alerta,                            cor: "#fde68a" },
              { l: "Crítico",           v: r.imuno_critico,                           cor: "#fca5a5" },
              { l: "Doses Ult. Mês",   v: r.doses_ultimo_mes.toLocaleString("pt-BR"), cor: "#bae6fd" },
            ].map(k => (
              <div key={k.l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 8px", textAlign: "center" as const }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: k.cor }}>{k.v}</div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,.5)" }}>{k.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" as const, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Status:</span>
          {["todos", "meta_atingida", "alerta", "critico"].map(s => {
            const cor = s === "todos" ? "#0369a1" : COR_STATUS[s];
            const ativo = filtroStatus === s;
            return (
              <button key={s} onClick={() => setFiltroStatus(s)}
                style={{ padding: "5px 12px", fontSize: 10, borderRadius: 20, border: `1px solid ${ativo ? cor : "#d1d5db"}`, background: ativo ? cor + "15" : "#fff", color: ativo ? cor : "#374151", cursor: "pointer", fontWeight: ativo ? 700 : 400 }}>
                {s === "todos" ? "Todos" : LABEL_STATUS[s]}
              </button>
            );
          })}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af" }}>{imunos.length} imunobiológico(s)</span>
        </div>

        {isLoading
          ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando coberturas vacinais...</div>
          : imunos.map(im => <CardImuno key={im.id} im={im}/>)
        }
      </div>
    </div>
  );
}
