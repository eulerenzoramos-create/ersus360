// src/pages/ProducaoAPS.tsx — Produção APS · SISAB · PEC e-SUS
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Activity, Search } from "lucide-react";
import { apiGet } from "../lib/api";

interface AtendimentoMes {
  mes: string; medico: number; enfermeiro: number; odontologia: number;
  outros: number; total: number;
}

interface CIDGrupo {
  codigo: string; descricao: string; categoria: string;
  atendimentos: number; internacoes_evitaveis: number | null;
}

interface FichaCAPS {
  tipo: string; registros: number; meta_mensal: number; pct: number;
}

interface ResumoAPS {
  atendimentos_mes: number; meta_mensal: number; pct_meta: number;
  atendimentos_medico: number; atendimentos_enfermeiro: number;
  consultas_retorno_pct: number; atend_demanda_espontanea_pct: number;
  fichas_pendentes: number; registros_pec_pct: number;
}

const COR_PROF: Record<string, string> = {
  medico: "#1351b4", enfermeiro: "#16a34a", odontologia: "#0891b2", outros: "#9ca3af",
};

function BarGrupo({ valor, max, cor }: { valor: number; max: number; cor: string }) {
  const pct = max > 0 ? (valor / max) * 100 : 0;
  return (
    <div style={{ flex: 1, height: 6, background: "#e5e7eb", borderRadius: 3 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: cor, borderRadius: 3 }}/>
    </div>
  );
}

function CardMes({ m, maxTotal }: { m: AtendimentoMes; maxTotal: number }) {
  const [aberto, setAberto] = useState(false);
  const profissionais = [
    { label: "Médico",      v: m.medico,       cor: COR_PROF.medico },
    { label: "Enfermeiro",  v: m.enfermeiro,   cor: COR_PROF.enfermeiro },
    { label: "Odontologia", v: m.odontologia,  cor: COR_PROF.odontologia },
    { label: "Outros",      v: m.outros,        cor: COR_PROF.outros },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderLeft: "4px solid #1351b4", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setAberto(o => !o)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer" }}>
        <div style={{ width: 52, flexShrink: 0, textAlign: "center" as const }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#1351b4" }}>{m.total.toLocaleString("pt-BR")}</div>
          <div style={{ fontSize: 9, color: "#9ca3af" }}>{m.mes}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <BarGrupo valor={m.total} max={maxTotal} cor="#1351b4"/>
          <div style={{ display: "flex", gap: 12, marginTop: 5, fontSize: 9, color: "#6b7280" }}>
            {profissionais.map(p => (
              <span key={p.label} style={{ color: p.cor, fontWeight: 700 }}>{p.label}: {p.v}</span>
            ))}
          </div>
        </div>
        {aberto ? <ChevronDown size={14} color="#9ca3af"/> : <ChevronRight size={14} color="#9ca3af"/>}
      </div>

      {aberto && (
        <div style={{ borderTop: "1px solid #e4e7ec", padding: "12px 16px", background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {profissionais.map(p => (
              <div key={p.label} style={{ background: "#fff", border: `1px solid ${p.cor}20`, borderTop: `3px solid ${p.cor}`, borderRadius: 8, padding: "10px 12px", textAlign: "center" as const }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: p.cor }}>{p.v}</div>
                <div style={{ fontSize: 9, color: "#9ca3af" }}>{p.label}</div>
                <div style={{ fontSize: 9, color: "#6b7280" }}>{m.total > 0 ? Math.round((p.v / m.total) * 100) : 0}% do total</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProducaoAPS() {
  const [aba, setAba] = useState<"atendimentos" | "cid" | "fichas">("atendimentos");
  const [buscaCID, setBuscaCID] = useState("");

  const { data: resumo } = useQuery<ResumoAPS>({
    queryKey: ["aps-resumo"],
    queryFn: () => apiGet("/api/producao-aps/resumo") as Promise<ResumoAPS>,
    staleTime: 300_000,
  });

  const { data: atendimentos = [], isLoading: loadA } = useQuery<AtendimentoMes[]>({
    queryKey: ["aps-atendimentos"],
    queryFn: () => apiGet("/api/producao-aps/atendimentos") as Promise<AtendimentoMes[]>,
    staleTime: 300_000,
  });

  const { data: cids = [], isLoading: loadC } = useQuery<CIDGrupo[]>({
    queryKey: ["aps-cids"],
    queryFn: () => apiGet("/api/producao-aps/cids") as Promise<CIDGrupo[]>,
    staleTime: 300_000,
  });

  const { data: fichas = [], isLoading: loadF } = useQuery<FichaCAPS[]>({
    queryKey: ["aps-fichas"],
    queryFn: () => apiGet("/api/producao-aps/fichas") as Promise<FichaCAPS[]>,
    staleTime: 300_000,
  });

  const maxTotal = Math.max(...atendimentos.map(m => m.total), 1);
  const cidsFiltrados = cids.filter(c =>
    !buscaCID || c.descricao.toLowerCase().includes(buscaCID.toLowerCase()) || c.codigo.includes(buscaCID)
  );
  const r = resumo;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6 }}><Activity size={18} color="#fff"/></div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Produção APS · SISAB</span>
              <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,.2)", color: "#bfdbfe", padding: "2px 9px", borderRadius: 10 }}>PEC e-SUS</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Atendimentos individuais · Fichas de cadastro · CID-10 · RNDS · FMS Apuí/AM · 2026
            </div>
          </div>
        </div>

        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 8, marginTop: 16 }}>
            {[
              { l: "Atend./mês",       v: r.atendimentos_mes.toLocaleString("pt-BR"),   cor: "#bfdbfe" },
              { l: "Meta/mês",         v: r.meta_mensal.toLocaleString("pt-BR"),        cor: "#bfdbfe" },
              { l: "% Meta",           v: `${r.pct_meta}%`,                             cor: r.pct_meta >= 100 ? "#86efac" : r.pct_meta >= 80 ? "#fde68a" : "#fca5a5" },
              { l: "Médico",           v: r.atendimentos_medico.toLocaleString("pt-BR"), cor: "#bfdbfe" },
              { l: "Enfermeiro",       v: r.atendimentos_enfermeiro.toLocaleString("pt-BR"), cor: "#86efac" },
              { l: "Retorno %",        v: `${r.consultas_retorno_pct}%`,                cor: "#bfdbfe" },
              { l: "Dem. Espontânea",  v: `${r.atend_demanda_espontanea_pct}%`,         cor: "#fde68a" },
              { l: "PEC registrado",   v: `${r.registros_pec_pct}%`,                   cor: r.registros_pec_pct >= 95 ? "#86efac" : "#fde68a" },
            ].map(k => (
              <div key={k.l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 8px", textAlign: "center" as const }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: k.cor }}>{k.v}</div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,.5)" }}>{k.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: 4, width: "fit-content" }}>
          {(["atendimentos", "cid", "fichas"] as const).map(a => (
            <button key={a} onClick={() => setAba(a)}
              style={{ padding: "7px 18px", fontSize: 11, fontWeight: 700, borderRadius: 8, border: "none", cursor: "pointer",
                background: aba === a ? "#2563eb" : "transparent", color: aba === a ? "#fff" : "#6b7280" }}>
              {a === "atendimentos" ? "Atendimentos por Mês" : a === "cid" ? "CID-10 Mais Frequentes" : "Fichas SISAB"}
            </button>
          ))}
        </div>

        {aba === "atendimentos" && (
          loadA
            ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando atendimentos...</div>
            : [...atendimentos].reverse().map(m => <CardMes key={m.mes} m={m} maxTotal={maxTotal}/>)
        )}

        {aba === "cid" && (
          <>
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ position: "relative" as const }}>
                <Search size={12} color="#9ca3af" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }}/>
                <input value={buscaCID} onChange={e => setBuscaCID(e.target.value)} placeholder="CID ou descrição..."
                  style={{ padding: "6px 10px 6px 28px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 8, outline: "none", width: 200 }}/>
              </div>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{cidsFiltrados.length} CID(s)</span>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["CID-10", "Descrição", "Categoria", "Atendimentos", "Intern. Evitáveis"].map(h => (
                      <th key={h} style={{ textAlign: "left" as const, padding: "10px 14px", fontSize: 9, fontWeight: 700, color: "#9ca3af", borderBottom: "1px solid #e4e7ec" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadC
                    ? <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Carregando...</td></tr>
                    : cidsFiltrados.map((c, i) => (
                        <tr key={c.codigo} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ padding: "9px 14px", fontSize: 10, fontWeight: 700, color: "#1351b4", fontFamily: "monospace" }}>{c.codigo}</td>
                          <td style={{ padding: "9px 14px", fontSize: 11, color: "#374151", fontWeight: 600 }}>{c.descricao}</td>
                          <td style={{ padding: "9px 14px" }}>
                            <span style={{ fontSize: 9, background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: 8, fontWeight: 600 }}>{c.categoria}</span>
                          </td>
                          <td style={{ padding: "9px 14px", fontSize: 11, fontWeight: 700 }}>{c.atendimentos}</td>
                          <td style={{ padding: "9px 14px", fontSize: 11, color: c.internacoes_evitaveis ? "#dc2626" : "#9ca3af", fontWeight: 700 }}>
                            {c.internacoes_evitaveis ?? "—"}
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          </>
        )}

        {aba === "fichas" && (
          <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Ficha SISAB", "Registros no mês", "Meta/mês", "% Meta"].map(h => (
                    <th key={h} style={{ textAlign: "left" as const, padding: "10px 14px", fontSize: 9, fontWeight: 700, color: "#9ca3af", borderBottom: "1px solid #e4e7ec" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadF
                  ? <tr><td colSpan={4} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Carregando...</td></tr>
                  : fichas.map((f, i) => {
                      const cor = f.pct >= 100 ? "#16a34a" : f.pct >= 75 ? "#d97706" : "#dc2626";
                      return (
                        <tr key={f.tipo} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ padding: "9px 14px", fontSize: 11, fontWeight: 700, color: "#374151" }}>{f.tipo}</td>
                          <td style={{ padding: "9px 14px", fontSize: 11, fontWeight: 700 }}>{f.registros.toLocaleString("pt-BR")}</td>
                          <td style={{ padding: "9px 14px", fontSize: 11, color: "#6b7280" }}>{f.meta_mensal.toLocaleString("pt-BR")}</td>
                          <td style={{ padding: "9px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, height: 5, background: "#e5e7eb", borderRadius: 3 }}>
                                <div style={{ height: "100%", width: `${Math.min(100, f.pct)}%`, background: cor, borderRadius: 3 }}/>
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 900, color: cor, minWidth: 36 }}>{f.pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
