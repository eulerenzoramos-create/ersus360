// src/pages/ConselhoMunicipalSaude.tsx — Conselho Municipal de Saúde · CMS
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, FileText, CheckCircle, Clock, ChevronDown, ChevronRight,
  Calendar, MessageSquare, Download,
} from "lucide-react";
import { apiGet } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

interface Reuniao {
  id: string; numero: string; data: string; hora: string; local: string;
  tipo: "ordinaria" | "extraordinaria";
  status: "realizada" | "agendada" | "cancelada";
  pauta: string[]; deliberacoes: Deliberacao[];
  quorum: number | null; total_conselheiros: number;
  ata_aprovada: boolean;
}

interface Deliberacao {
  numero: string; descricao: string;
  situacao: "aprovada" | "rejeitada" | "em_acompanhamento" | "cumprida";
}

interface Conselheiro {
  id: string; nome: string; entidade: string;
  segmento: "gestao" | "prestadores" | "trabalhadores" | "usuarios";
  cargo: "presidente" | "vice_presidente" | "secretario" | "membro";
  titular: boolean; mandato_ate: string;
}

interface ResumoCMS {
  total_conselheiros: number; reunioes_ano: number; reunioes_realizadas: number;
  deliberacoes_total: number; deliberacoes_cumpridas: number;
  proxima_reuniao: string; proxima_data: string;
}

const COR_SEG: Record<string, string> = {
  gestao: "#1351b4", prestadores: "#7c3aed", trabalhadores: "#d97706", usuarios: "#16a34a",
};
const LABEL_SEG: Record<string, string> = {
  gestao: "Gestão", prestadores: "Prestadores", trabalhadores: "Trabalhadores", usuarios: "Usuários",
};
const COR_DELIB: Record<string, string> = {
  aprovada: "#16a34a", rejeitada: "#dc2626", em_acompanhamento: "#d97706", cumprida: "#0d9488",
};
const LABEL_DELIB: Record<string, string> = {
  aprovada: "Aprovada", rejeitada: "Rejeitada", em_acompanhamento: "Em acompanhamento", cumprida: "Cumprida",
};

function CardReuniao({ r }: { r: Reuniao }) {
  const [aberto, setAberto] = useState(false);
  const cor = r.status === "realizada" ? "#16a34a" : r.status === "agendada" ? "#1351b4" : "#6b7280";

  return (
    <div style={{ background: "#fff", border: `1px solid ${cor}25`, borderLeft: `4px solid ${cor}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setAberto(o => !o)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", cursor: "pointer" }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: cor + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Calendar size={16} color={cor}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>{r.numero}ª Reunião {r.tipo === "ordinaria" ? "Ordinária" : "Extraordinária"}</span>
            <span style={{ fontSize: 9, fontWeight: 800, background: cor + "18", color: cor, padding: "2px 7px", borderRadius: 10 }}>
              {r.status === "realizada" ? "Realizada" : r.status === "agendada" ? "Agendada" : "Cancelada"}
            </span>
            {r.ata_aprovada && <span style={{ fontSize: 9, background: "#dcfce7", color: "#16a34a", padding: "1px 6px", borderRadius: 8, fontWeight: 600 }}>Ata aprovada</span>}
          </div>
          <div style={{ fontSize: 10, color: "#6b7280" }}>
            {r.data} às {r.hora} · {r.local}
            {r.quorum !== null && ` · Quórum: ${r.quorum}/${r.total_conselheiros} conselheiros`}
          </div>
          {r.deliberacoes.length > 0 && (
            <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 3 }}>
              {r.deliberacoes.length} deliberação(ões) · {r.deliberacoes.filter(d => d.situacao === "cumprida").length} cumprida(s)
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" as const, flexShrink: 0, fontSize: 10 }}>
          <div style={{ color: "#9ca3af" }}>{r.pauta.length} ponto(s) de pauta</div>
        </div>
        {aberto ? <ChevronDown size={14} color="#9ca3af"/> : <ChevronRight size={14} color="#9ca3af"/>}
      </div>

      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}15`, padding: "14px 16px", background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Pauta</div>
              {r.pauta.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 11 }}>
                  <span style={{ color: "#1351b4", fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ color: "#374151" }}>{p}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Deliberações</div>
              {r.deliberacoes.length === 0
                ? <div style={{ fontSize: 10, color: "#9ca3af" }}>Nenhuma deliberação registrada.</div>
                : r.deliberacoes.map((d, i) => {
                    const dcor = COR_DELIB[d.situacao];
                    return (
                      <div key={i} style={{ padding: "8px 10px", marginBottom: 6, borderRadius: 8, background: dcor + "0d", borderLeft: `2px solid ${dcor}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: dcor }}>{d.numero}</span>
                          <span style={{ fontSize: 8, color: dcor, fontWeight: 700 }}>{LABEL_DELIB[d.situacao]}</span>
                        </div>
                        <div style={{ fontSize: 10, color: "#374151" }}>{d.descricao}</div>
                      </div>
                    );
                  })
              }
            </div>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, background: "#1351b4", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Download size={11}/> Baixar Ata
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConselhoMunicipalSaude() {
  const [aba, setAba] = useState<"reunioes" | "conselheiros">("reunioes");

  const { data: resumo } = useQuery<ResumoCMS>({
    queryKey: ["cms-resumo"],
    queryFn: () => apiGet("/api/cms/resumo") as Promise<ResumoCMS>,
    staleTime: 300_000,
  });

  const { data: reunioes = [], isLoading: loadR } = useQuery<Reuniao[]>({
    queryKey: ["cms-reunioes"],
    queryFn: () => apiGet("/api/cms/reunioes") as Promise<Reuniao[]>,
    staleTime: 300_000,
  });

  const { data: conselheiros = [], isLoading: loadC } = useQuery<Conselheiro[]>({
    queryKey: ["cms-conselheiros"],
    queryFn: () => apiGet("/api/cms/conselheiros") as Promise<Conselheiro[]>,
    staleTime: 300_000,
  });

  const r = resumo;

  if (!loadR && !resumo) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="ConselhoMunicipalSaude indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#1e3a2f 0%,#065f46 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><Users size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Conselho Municipal de Saúde</span>
              <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,.2)", color: "#86efac", padding: "2px 9px", borderRadius: 10 }}>Lei 8.142/1990</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Reuniões · Deliberações · Composição · Controle Social · FMS Apuí/AM
            </div>
          </div>
        </div>

        {r && (
          <>
            <div style={{ background: "rgba(255,255,255,.12)", borderRadius: 10, padding: "12px 16px", marginTop: 14, display: "flex", gap: 24, alignItems: "center", border: "1px solid rgba(255,255,255,.15)" }}>
              <Calendar size={20} color="#fde68a"/>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>Próxima reunião</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{r.proxima_reuniao}</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>Data</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#fde68a" }}>{r.proxima_data}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginTop: 12 }}>
              {[
                { l: "Conselheiros",  v: r.total_conselheiros,      cor: "#86efac" },
                { l: "Reuniões/ano",  v: r.reunioes_ano,            cor: "#bae6fd" },
                { l: "Realizadas",    v: r.reunioes_realizadas,      cor: "#86efac" },
                { l: "Deliberações",  v: r.deliberacoes_total,       cor: "#bae6fd" },
                { l: "Cumpridas",     v: r.deliberacoes_cumpridas,   cor: "#86efac" },
              ].map(k => (
                <div key={k.l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 12px", textAlign: "center" as const }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: k.cor }}>{k.v}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)" }}>{k.l}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        {/* Abas */}
        <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: 4, width: "fit-content" }}>
          {(["reunioes", "conselheiros"] as const).map(a => (
            <button key={a} onClick={() => setAba(a)}
              style={{ padding: "7px 18px", fontSize: 11, fontWeight: 700, borderRadius: 8, border: "none", cursor: "pointer",
                background: aba === a ? "#065f46" : "transparent", color: aba === a ? "#fff" : "#6b7280" }}>
              {a === "reunioes" ? "Reuniões" : "Conselheiros"}
            </button>
          ))}
        </div>

        {aba === "reunioes" && (
          loadR
            ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando reuniões...</div>
            : reunioes.map(r => <CardReuniao key={r.id} r={r}/>)
        )}

        {aba === "conselheiros" && (
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Nome", "Entidade", "Segmento", "Cargo", "Tipo", "Mandato até"].map(h => (
                    <th key={h} style={{ textAlign: "left" as const, padding: "10px 14px", fontSize: 9, fontWeight: 700, color: "#9ca3af", borderBottom: "1px solid #e4e7ec" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {conselheiros.map((c, i) => {
                  const scor = COR_SEG[c.segmento];
                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "9px 14px", fontWeight: 700, fontSize: 11 }}>{c.nome}</td>
                      <td style={{ padding: "9px 14px", fontSize: 10, color: "#6b7280" }}>{c.entidade}</td>
                      <td style={{ padding: "9px 14px" }}>
                        <span style={{ fontSize: 9, fontWeight: 800, background: scor + "18", color: scor, padding: "2px 7px", borderRadius: 8 }}>{LABEL_SEG[c.segmento]}</span>
                      </td>
                      <td style={{ padding: "9px 14px", fontSize: 10, color: "#374151", fontWeight: 600 }}>
                        {c.cargo === "presidente" ? "Presidente" : c.cargo === "vice_presidente" ? "Vice-Presidente" : c.cargo === "secretario" ? "Secretário(a)" : "Membro"}
                      </td>
                      <td style={{ padding: "9px 14px", fontSize: 10, color: "#9ca3af" }}>{c.titular ? "Titular" : "Suplente"}</td>
                      <td style={{ padding: "9px 14px", fontSize: 10, color: "#6b7280" }}>{c.mandato_ate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
