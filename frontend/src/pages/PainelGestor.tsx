// src/pages/PainelGestor.tsx — ERSUS 360 · Home estilo InvestSUS
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiDashboard, apiAlertas, apiSistema, apiGet, apiConformidade } from "../lib/api";
import { BRL, BRL_AXIS } from "../lib/fmt";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import {
  Heart, Target, BarChart2, Users, Pill, Syringe, Brain, Map,
  TrendingUp, DollarSign, FileText, Activity, Eye, EyeOff,
  CheckCircle, AlertTriangle, Wifi,
} from "lucide-react";

const BLUE   = "#0078d4";
const BLUE2  = "#005a9e";

// ── Módulos / Serviços ────────────────────────────────────────────────────────
const MODULOS = [
  { label: "Saúde Brasil 360",     desc: "Vínculo e qualidade das equipes APS",     Icon: Heart,       path: "/sb360/consolidado-territorial",  cor: BLUE },
  { label: "Componente Qualidade", desc: "15 indicadores — Portaria 3.493/2024",    Icon: Target,      path: "/previne",                        cor: BLUE },
  { label: "Painel de Gestão",     desc: "Atendimentos, procedimentos e vacinas",   Icon: BarChart2,   path: "/gestao",                         cor: BLUE },
  { label: "Busca Ativa",          desc: "Gestantes e crianças sem acompanhamento", Icon: Users,       path: "/busca-ativa/gestante",           cor: BLUE },
  { label: "ACS",                  desc: "Cadastros, visitas e calendário",          Icon: Activity,    path: "/acs/painel",                     cor: BLUE },
  { label: "Assist. Farmacêutica", desc: "Dispensação, estoque e medicamentos",     Icon: Pill,        path: "/farmacia",                       cor: BLUE },
  { label: "Vigilância em Saúde",  desc: "Epidemiológica, sanitária, imunização",   Icon: Syringe,     path: "/vigilancia",                     cor: BLUE },
  { label: "IA Gestora",           desc: "Assistente inteligente para gestão",       Icon: Brain,       path: "/ia",                             cor: BLUE },
  { label: "Mapa de Desempenho",   desc: "Ranking municipal AM e nacional",          Icon: Map,         path: "/mapa-desempenho",                cor: BLUE },
  { label: "Sprint ÓTIMO",         desc: "Monitoramento SIAPS Q2/2026",              Icon: TrendingUp,  path: "/sprint-otimo",                   cor: BLUE },
  { label: "Repasses FNS",         desc: "Controle de repasses e execução",          Icon: DollarSign,  path: "/repasses",                       cor: BLUE },
  { label: "Documentos",           desc: "Portarias, ofícios e termos",              Icon: FileText,    path: "/documentos",                     cor: BLUE },
];

const fmt = (v: number) =>
  v >= 1_000_000 ? BRL(v )
  : v >= 1_000   ? BRL(v )
  : `R$ ${v?.toFixed(2).replace(".", ",")}`;

export default function PainelGestor() {
  const [showSaldo, setShowSaldo] = useState(true);

  const { data: stats, isLoading }   = useQuery({ queryKey: ["dashboard"],         queryFn: () => apiDashboard.stats() });
  const { data: alertas = [] }        = useQuery({ queryKey: ["alertas"],            queryFn: () => apiAlertas.list() });
  const { data: scoreData }           = useQuery({ queryKey: ["score-resumo-home"],  queryFn: () => apiGet("/api/score/resumo") as Promise<any> });
  const { data: conformidadeData }    = useQuery({ queryKey: ["conformidade-dash"],  queryFn: () => apiConformidade.dashboard() as Promise<any>, staleTime: 120_000 });
  const { data: sysInfo }             = useQuery({ queryKey: ["sistema-info"],       queryFn: apiSistema.info, staleTime: 60_000 });

  const alertasAtivos  = (alertas as any[]).filter((a: any) => !a.resolvido);
  const municipio      = sysInfo?.municipio ?? "APUÍ";
  const uf             = sysInfo?.uf        ?? "AM";
  const ibge           = sysInfo?.ibge      ?? "1300144";
  const scoreTotal     = scoreData?.score_total ?? null;
  const scoreNivel     = scoreData?.nivel       ?? null;
  const confPct        = conformidadeData?.pct_conformidade ?? null;
  const repasses       = stats?.total_repasses  ?? 0;
  const execucao       = stats?.execucao_pas    ?? null;
  const metasOk        = stats?.indicadores_atingidos ?? null;
  const metasTotal     = stats?.total_indicadores     ?? null;

  const base = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000";
  const { data: siaps } = useQuery({
    queryKey: ["siaps-mini"],
    queryFn:  () => fetch(`${base}/api/aps/siaps-ausencias?comp=202605&ibge6=130014`).then(r => r.json()),
    staleTime: 300_000,
  });
  const siapsAus = siaps?.equipes?.length ?? 0;

  if (!isLoading && !stats) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="PainelGestor indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ fontFamily: "Rawline, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh", padding: "24px 28px" }}>

      {/* ── Título da página ── */}
      <div style={{ fontSize: 15, fontWeight: 600, color: "#323232", marginBottom: 20 }}>Início</div>

      {/* ── Layout principal: card azul + serviços ── */}
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

        {/* ── Card azul esquerdo ── */}
        <div style={{
          width: 310, flexShrink: 0,
          background: `linear-gradient(160deg, ${BLUE} 0%, ${BLUE2} 60%, #003f74 100%)`,
          borderRadius: 12, padding: "24px 22px", color: "#fff",
          boxShadow: "0 4px 24px rgba(0,120,212,0.28)",
          minHeight: 480,
          display: "flex", flexDirection: "column", gap: 0,
        }}>
          {/* Ícone + nome */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚕</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.2, lineHeight: 1.3 }}>
                SECRETARIA MUNICIPAL<br />DE SAÚDE DE APUÍ
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, opacity: 0.82, marginBottom: 2 }}>{municipio} — {uf}</div>
          <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 20, fontFamily: "monospace" }}>IBGE {ibge}</div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", marginBottom: 20 }} />

          {/* Score ERSUS */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Score ERSUS 360</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{isLoading ? "—" : scoreTotal !== null ? (scoreTotal as number).toFixed(0) : "—"}</span>
              <span style={{ fontSize: 12, opacity: 0.8 }}>pts · {scoreNivel ?? "N/D"}</span>
            </div>
          </div>

          {/* Repasses FNS */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8, display: "flex", alignItems: "center", gap: 6 }}>
              Repasses FNS recebidos
              <button onClick={() => setShowSaldo(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 0, display: "flex" }}>
                {showSaldo ? <Eye size={13}/> : <EyeOff size={13}/>}
              </button>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
              {showSaldo ? (isLoading ? "—" : fmt(repasses)) : "R$ •••••••••"}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", marginBottom: 20 }} />

          {/* KPIs menores */}
          {[
            { label: "Execução PAS",        value: execucao !== null ? `${(execucao as number).toFixed(0)}%` : "—" },
            { label: "Metas atingidas",      value: metasOk !== null && metasTotal !== null ? `${metasOk}/${metasTotal}` : "—" },
            { label: "Conformidade Legal",   value: confPct !== null ? `${confPct}%` : "—" },
            { label: "Alertas ativos",       value: String(alertasAtivos.length) },
          ].map(k => (
            <div key={k.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 12, opacity: 0.78 }}>{k.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{isLoading ? "—" : k.value}</span>
            </div>
          ))}

          {/* SIAPS badge */}
          <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
            <div style={{ fontSize: 10, opacity: 0.65, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <Wifi size={10}/> SIAPS Mai/2026 — ao vivo
            </div>
            {siapsAus === 0
              ? <div style={{ display: "flex", gap: 5, alignItems: "center", fontSize: 11, fontWeight: 600 }}>
                  <CheckCircle size={12}/> Nenhuma ausência de envio
                </div>
              : <div style={{ display: "flex", gap: 5, alignItems: "center", fontSize: 11, fontWeight: 700, color: "#fde68a" }}>
                  <AlertTriangle size={12}/> {siapsAus} equipe{siapsAus > 1 ? "s" : ""} com ausência
                  <a href="/sprint-otimo" style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, marginLeft: 4, textDecoration: "none" }}>ver →</a>
                </div>
            }
          </div>
        </div>

        {/* ── Painel direito: SERVIÇOS ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "24px 24px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", border: "1px solid #e0e4ea" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#323232", marginBottom: 24, textTransform: "uppercase", letterSpacing: 1 }}>
              SERVIÇOS
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 0 }}>
              {MODULOS.map(m => (
                <a key={m.label} href={m.path} style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "20px 12px", textAlign: "center", cursor: "pointer",
                    borderRadius: 8, transition: "background 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#f0f7ff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Ícone circular azul outline */}
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%",
                      border: `2px solid ${BLUE}22`,
                      background: `${BLUE}0d`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginBottom: 10, flexShrink: 0,
                    }}>
                      <m.Icon size={24} color={BLUE} strokeWidth={1.5}/>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e", marginBottom: 3, lineHeight: 1.35 }}>{m.label}</div>
                    <div style={{ fontSize: 10.5, color: "#6b7280", lineHeight: 1.4 }}>{m.desc}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* ── Alertas (abaixo dos serviços) ── */}
          {alertasAtivos.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 12, padding: "18px 24px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", border: "1px solid #e0e4ea", marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#323232", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={14} color="#e65100"/> Alertas prioritários
                <span style={{ marginLeft: "auto", background: "#c62828", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>{alertasAtivos.length}</span>
              </div>
              {alertasAtivos.slice(0, 4).map((a: any) => (
                <div key={a.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #f3f4f6", alignItems: "flex-start" }}>
                  <AlertTriangle size={13} color="#e65100" style={{ flexShrink: 0, marginTop: 1 }}/>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#c62828" }}>{a.titulo}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{a.modulo}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Rodapé ── */}
      <div style={{ marginTop: 24, fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
        ERSUS 360 v1.0 · ERSUS Tecnologia em Saúde Pública · Dados: e-SUS APS, FNS, CNES, SISAB · Competência Jul/2026
      </div>
    </div>
  );
}
