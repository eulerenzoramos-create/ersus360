import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell,
} from "recharts";
import {
  Users, Star, TrendingUp, AlertTriangle, CheckCircle,
  ChevronDown, ChevronRight, RefreshCw, Download, Info,
} from "lucide-react";
import { apiGet } from "../lib/api";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface EquipeVinculo {
  ubs: string; equipe: string; tipo: string; parametro: number;
  A: number; B: number; C: number; D: number; E: number;
  F: number; G: number; H: number; I: number; J: number; K: number;
  pontuacao: number; status: string;
}

interface EquipeQualidade {
  ubs: string; equipe: string;
  indicadores: Record<string, { resultado: number; meta: number; status: string }>;
  pontuacao_qualidade: number;
  status_qualidade: string;
}

// ── Helpers de cor ────────────────────────────────────────────────────────────

const COR_PONT = (p: number) =>
  p > 8.5 ? "#1d4ed8" : p >= 7 ? "#16a34a" : p >= 5 ? "#d97706" : "#dc2626";

const LABEL_PONT = (p: number) =>
  p > 8.5 ? "Ótimo" : p >= 7 ? "Bom" : p >= 5 ? "Suficiente" : "Regular";

const BG_PONT = (p: number) =>
  p > 8.5 ? "#eff6ff" : p >= 7 ? "#f0fdf4" : p >= 5 ? "#fffbeb" : "#fff7f7";

const COR_IND = (s: string) =>
  s === "verde" ? "#16a34a" : s === "amarelo" ? "#d97706" : "#dc2626";

const TT = { fontSize: 11, background: "#1e293b", border: "none", borderRadius: 6, color: "#f8fafc" };

// ── Logo MS ───────────────────────────────────────────────────────────────────

function LogoMS() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 24px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
      <div style={{ display: "flex", gap: 3 }}>
        <div style={{ width: 8, height: 24, background: "#009c3b" }} />
        <div style={{ width: 8, height: 24, background: "#ffdf00" }} />
        <div style={{ width: 8, height: 24, background: "#002776" }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#002776" }}>gov.br</div>
      <div style={{ width: 1, height: 20, background: "#d1d5db" }} />
      <div style={{ fontSize: 12, color: "#374151" }}>Ministério da Saúde</div>
      <div style={{ width: 1, height: 20, background: "#d1d5db", marginLeft: 8 }} />
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8", marginLeft: 4 }}>
        Siaps — Sistema de Informação para a Atenção Primária à Saúde
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6b7280" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Users size={14} color="#6b7280" />
        </div>
        Olá, Rosangela ▾
      </div>
    </div>
  );
}

// ── Abrangência Municipal ─────────────────────────────────────────────────────

function AbaAbrangencia({ data }: { data: any }) {
  if (!data) return null;
  const TIPOS = ["eAP", "eAPP", "eCR", "eMulti", "eSB", "eSF", "eSFR"];
  const COLS = [
    { key: "total_equipes",             label: "Total de equipes",                     icon: <Users size={20} color="#1d4ed8" /> },
    { key: "equipes_homologadas",        label: "Total de equipes homologadas",          icon: <Star size={20} color="#1d4ed8" /> },
    { key: "equipes_validas_componentes",label: "Total de equipes válidas para os componentes", icon: <CheckCircle size={20} color="#1d4ed8" /> },
  ];
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1d4ed8", margin: "0 0 6px" }}>Abrangência Municipal</h2>
        <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Dados em nível municipal, referentes à competência vigente.</p>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        <span style={{ background: "#e0f2fe", color: "#0369a1", fontWeight: 700, padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>UF: {data.uf}</span>
        <span style={{ background: "#e0f2fe", color: "#0369a1", fontWeight: 700, padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>Município: {data.municipio}</span>
        <span style={{ background: "#fef3c7", color: "#92400e", fontWeight: 700, padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>IED: {data.ied}</span>
        <span style={{ background: "#f3f4f6", color: "#6b7280", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>Competência: Abr/2026</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {COLS.map(col => (
          <div key={col.key} style={{ border: "2px solid #dbeafe", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ background: "#eff6ff", borderRadius: 8, padding: 8 }}>{col.icon}</div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1e40af" }}>{col.label}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TIPOS.map(t => (
                <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, color: "#1d4ed8" }}>📊</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{t}</span>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: data[col.key][t] > 0 ? "#1d4ed8" : "#9ca3af" }}>
                    {data[col.key][t]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Componente Vínculo ────────────────────────────────────────────────────────

const VARIAVEIS = [
  { key: "A", desc: "Nº pessoas somente com Cadastro Individual atualizado", pts: "0,75 pts/pessoa" },
  { key: "B", desc: "Nº pessoas com Cadastro Individual e Cadastro Domiciliar atualizado", pts: "1,5 pts/pessoa" },
  { key: "C", desc: "Total de pessoas com Cadastro (A + B)", pts: "—" },
  { key: "D", desc: "Nº pessoas acompanhadas sem critério", pts: "1 pts/pessoa" },
  { key: "E", desc: "Nº crianças e idosos acompanhados", pts: "1,2 pts/pessoa" },
  { key: "F", desc: "Nº de beneficiários BPC ou PBF acompanhados", pts: "1,3 pts/equipe" },
  { key: "G", desc: "Nº de crianças e idosos beneficiários BPC ou PBF acompanhados", pts: "2,5 pts/pessoa" },
  { key: "H", desc: "Total de pessoas Acompanhadas", pts: "—" },
  { key: "I", desc: "Nº Atendimentos sujeitos à Avaliação de Satisfação", pts: "—" },
  { key: "J", desc: "Atendimentos com Avaliação de Satisfação (>5% → 0,3 pts; ≤5% → 0,15 pts)", pts: "variável" },
  { key: "K", desc: "Nº de pessoas vinculadas à Equipe", pts: "—" },
];

function AbaVinculo({ data }: { data: any }) {
  const [showVars, setShowVars] = useState(false);
  const [filtro, setFiltro] = useState("");
  if (!data) return null;

  const equipes: EquipeVinculo[] = data.equipes.filter((e: EquipeVinculo) =>
    filtro === "" || e.ubs.toLowerCase().includes(filtro.toLowerCase()) || e.equipe.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1d4ed8", margin: "0 0 4px" }}>
            Componente Vínculo e Acompanhamento Territorial
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>Dado preliminar</span>
            <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>Competência: Abr/2026</span>
            <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>Tipo: eAP, eSF</span>
          </div>
        </div>
        <button onClick={() => {}} style={{ display: "flex", alignItems: "center", gap: 5, background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 6, padding: "7px 14px", cursor: "pointer", fontSize: 12 }}>
          <Download size={13} /> Baixar dados
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Equipes", val: data.total_equipes, cor: "#1d4ed8" },
          { label: "Pessoas vinculadas", val: data.total_pessoas_vinculadas.toLocaleString("pt-BR"), cor: "#7c3aed" },
          { label: "Pessoas acompanhadas", val: data.total_pessoas_acompanhadas.toLocaleString("pt-BR"), cor: "#16a34a" },
          { label: "Pontuação média", val: data.pontuacao_media.toFixed(2), cor: COR_PONT(data.pontuacao_media) },
          { label: "IED municipal", val: data.ied, cor: "#d97706" },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", border: `1px solid ${k.cor}22`, borderTop: `3px solid ${k.cor}`, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.cor }}>{k.val}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Distribuição de status */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
        {[
          { label: "Ótimo (>8.5)",     n: data.por_status.otimo,      cor: "#1d4ed8", bg: "#eff6ff" },
          { label: "Bom (7–8.5)",      n: data.por_status.bom,        cor: "#16a34a", bg: "#f0fdf4" },
          { label: "Suficiente (5–6.9)",n: data.por_status.suficiente, cor: "#d97706", bg: "#fffbeb" },
          { label: "Regular (<5)",     n: data.por_status.regular,    cor: "#dc2626", bg: "#fff7f7" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.cor}22`, borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: s.cor, fontWeight: 600 }}>{s.label}</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: s.cor }}>{s.n}</span>
          </div>
        ))}
      </div>

      {/* Gráfico pontuações */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 16px 8px", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Pontuação por equipe</div>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.equipes.map((e: EquipeVinculo) => ({ nome: e.equipe, pontuacao: e.pontuacao, status: e.status }))} barGap={4}>
              <XAxis dataKey="nome" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={45} />
              <YAxis domain={[0, 10.5]} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={TT} formatter={(v: number) => [v.toFixed(2), "Pontuação"]} />
              <Bar dataKey="pontuacao" name="Pontuação" radius={[4,4,0,0]}>
                {data.equipes.map((e: EquipeVinculo, i: number) => (
                  <Cell key={i} fill={COR_PONT(e.pontuacao)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtro */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
        <input
          placeholder="Pesquisar UBS ou equipe…"
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 12px", fontSize: 13, flex: 1, outline: "none" }}
        />
        <span style={{ fontSize: 12, color: "#9ca3af" }}>Quantidade de itens: {equipes.length}</span>
      </div>

      {/* Tabela principal */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 900 }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              <th style={{ padding: "10px 12px", textAlign: "left", whiteSpace: "nowrap", position: "sticky", left: 0, background: "#1d4ed8" }}>EQUIPE</th>
              <th style={{ padding: "10px 8px", textAlign: "right" }}>PARÂM.</th>
              {["A","B","C","D","E","F","G","H","I","J","K"].map(v => (
                <th key={v} style={{ padding: "10px 8px", textAlign: "right" }}>{v}</th>
              ))}
              <th style={{ padding: "10px 12px", textAlign: "right" }}>PONTUAÇÃO</th>
            </tr>
            <tr style={{ background: "#1e40af", color: "#93c5fd", fontSize: 9 }}>
              <th style={{ padding: "4px 12px", textAlign: "left", position: "sticky", left: 0, background: "#1e40af" }}>DIMENSÃO CADASTRO ←→ DIMENSÃO ACOMPANHAMENTO</th>
              <th />{["","","","","","","","","","",""].map((_,i) => <th key={i} />)}
              <th />
            </tr>
          </thead>
          <tbody>
            {equipes.map((e: EquipeVinculo, idx: number) => {
              const cor = COR_PONT(e.pontuacao);
              return (
                <tr key={idx} style={{ borderTop: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={{ padding: "10px 12px", position: "sticky", left: 0, background: idx % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>UBS: {e.ubs}</div>
                    <div style={{ fontWeight: 700 }}>Equipe: {e.equipe}</div>
                  </td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: "#6b7280" }}>{e.parametro.toLocaleString("pt-BR")}</td>
                  {(["A","B","C","D","E","F","G","H","I","J","K"] as const).map(v => (
                    <td key={v} style={{ padding: "10px 8px", textAlign: "right", fontWeight: ["C","H","K"].includes(v) ? 700 : 400, color: ["C","H","K"].includes(v) ? "#1d4ed8" : "#374151" }}>
                      {(e as any)[v].toLocaleString("pt-BR")}
                    </td>
                  ))}
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: cor }}>{e.pontuacao.toFixed(2)}</span>
                      <span style={{ background: BG_PONT(e.pontuacao), color: cor, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
                        {LABEL_PONT(e.pontuacao)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legenda pontuação */}
      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11, color: "#6b7280" }}>
        <span style={{ fontWeight: 700 }}>Pontuação:</span>
        {[
          { label: "Regular", range: "< 5",    cor: "#dc2626" },
          { label: "Suficiente", range: "5 a 6,9", cor: "#d97706" },
          { label: "Bom", range: "7 a 8,5",    cor: "#16a34a" },
          { label: "Ótimo", range: "> 8,5",    cor: "#1d4ed8" },
        ].map(l => (
          <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: l.cor, display: "inline-block" }} />
            <strong style={{ color: l.cor }}>{l.label}</strong> {l.range}
          </span>
        ))}
      </div>

      {/* Variáveis */}
      <div style={{ marginTop: 16 }}>
        <button onClick={() => setShowVars(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "none", cursor: "pointer", color: "#1d4ed8", fontWeight: 700, fontSize: 13 }}>
          <Info size={14} /> Variáveis e pontuação {showVars ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
        </button>
        {showVars && (
          <div style={{ marginTop: 10, border: "1px solid #dbeafe", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#eff6ff" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", width: 30, color: "#1d4ed8", fontWeight: 700 }}>Var.</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "#1d4ed8", fontWeight: 700 }}>Descrição</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", color: "#1d4ed8", fontWeight: 700 }}>Pontos</th>
                </tr>
              </thead>
              <tbody>
                {VARIAVEIS.map(v => (
                  <tr key={v.key} style={{ borderTop: "1px solid #dbeafe" }}>
                    <td style={{ padding: "7px 12px", fontWeight: 800, color: "#1d4ed8" }}>{v.key}</td>
                    <td style={{ padding: "7px 12px", color: "#374151" }}>{v.desc}</td>
                    <td style={{ padding: "7px 12px", textAlign: "right", color: "#6b7280" }}>{v.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componente Qualidade ──────────────────────────────────────────────────────

const IND_NOMES: Record<string, string> = {
  ind1_prenatal: "Ind.1 — Pré-natal (≥6 consultas)",
  ind2_cito:     "Ind.2 — Citopatológico",
  ind3_vacina:   "Ind.3 — Vacinação DTP/Penta",
  ind4_rn:       "Ind.4 — Consulta RN 1ª semana",
  ind5_has:      "Ind.5 — Acompanhamento HAS",
  ind6_dm:       "Ind.6 — Acompanhamento DM",
  ind7_infantil: "Ind.7 — Desenvolvimento Infantil",
};

function AbaQualidade({ data }: { data: any }) {
  const [equipeAberta, setEquipeAberta] = useState<string | null>(null);
  if (!data) return null;

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1d4ed8", margin: "0 0 4px" }}>Componente Qualidade</h2>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Previne Brasil — 7 indicadores oficiais · Competência Abr/2026</p>
      </div>

      {/* Consolidado por indicador */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Consolidado municipal — status por indicador</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(data.indicadores_resumo).map(([key, ind]: [string, any]) => (
            <div key={key} style={{ display: "grid", gridTemplateColumns: "200px 1fr 60px 60px 60px 80px", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 12 }}>{IND_NOMES[key] ?? key}</span>
              <div style={{ height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(ind.media, 100)}%`, height: "100%", background: ind.media >= 60 ? "#16a34a" : "#dc2626", borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: ind.media >= 60 ? "#16a34a" : "#dc2626", textAlign: "right" }}>{ind.media}%</span>
              <span style={{ fontSize: 10, textAlign: "center", background: "#f0fdf4", color: "#16a34a", borderRadius: 4, padding: "2px 4px" }}>✓ {ind.otimo}</span>
              <span style={{ fontSize: 10, textAlign: "center", background: "#fffbeb", color: "#d97706", borderRadius: 4, padding: "2px 4px" }}>⚠ {ind.atencao}</span>
              <span style={{ fontSize: 10, textAlign: "center", background: "#fff7f7", color: "#dc2626", borderRadius: 4, padding: "2px 4px" }}>✗ {ind.critico}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cards por equipe */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(data.equipes as EquipeQualidade[]).map((e, idx) => {
          const isOpen = equipeAberta === e.equipe;
          const cor = COR_PONT(e.pontuacao_qualidade / 5); // normaliza para 0-10
          const verdes = Object.values(e.indicadores).filter(i => i.status === "verde").length;
          const vermelhos = Object.values(e.indicadores).filter(i => i.status === "vermelho").length;
          return (
            <div key={idx} style={{ border: `1px solid ${e.status_qualidade === "otimo" ? "#bfdbfe" : e.status_qualidade === "bom" ? "#bbf7d0" : e.status_qualidade === "suficiente" ? "#fde68a" : "#fca5a5"}`, borderLeft: `4px solid ${COR_PONT(e.pontuacao_qualidade / 5)}`, borderRadius: 8, background: "#fff", overflow: "hidden" }}>
              <div onClick={() => setEquipeAberta(isOpen ? null : e.equipe)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>UBS: {e.ubs}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Equipe: {e.equipe}</div>
                </div>
                {/* Mini semáforo dos 7 indicadores */}
                <div style={{ display: "flex", gap: 3 }}>
                  {Object.values(e.indicadores).map((ind, i) => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: COR_IND(ind.status) }} title={Object.keys(e.indicadores)[i]} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#16a34a" }}>✓{verdes}</span>
                  <span style={{ fontSize: 11, color: "#dc2626" }}>✗{vermelhos}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: COR_PONT(e.pontuacao_qualidade / 5), minWidth: 52, textAlign: "right" }}>
                    {e.pontuacao_qualidade.toFixed(1)}pts
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: BG_PONT(e.pontuacao_qualidade / 5), color: COR_PONT(e.pontuacao_qualidade / 5), padding: "2px 7px", borderRadius: 4 }}>
                    {e.status_qualidade.toUpperCase()}
                  </span>
                </div>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>

              {isOpen && (
                <div style={{ padding: "12px 16px", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
                    {Object.entries(e.indicadores).map(([key, ind]) => {
                      const cor2 = COR_IND(ind.status);
                      return (
                        <div key={key} style={{ textAlign: "center", background: "#fff", border: `1px solid ${cor2}22`, borderRadius: 8, padding: "10px 6px" }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: cor2 }}>{ind.resultado.toFixed(1)}%</div>
                          <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>meta {ind.meta}%</div>
                          <div style={{ fontSize: 9, marginTop: 4, color: "#6b7280" }}>{IND_NOMES[key]?.slice(0, 20) ?? key}</div>
                          <div style={{ marginTop: 4 }}>
                            {ind.status === "verde" ? <CheckCircle size={12} color="#16a34a" /> :
                             ind.status === "amarelo" ? <AlertTriangle size={12} color="#d97706" /> :
                             <AlertTriangle size={12} color="#dc2626" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Boas Práticas ─────────────────────────────────────────────────────────────

function AbaBoasPraticas({ data }: { data: any }) {
  if (!data) return null;
  const COR_TIPO: Record<string, string> = {
    vinculo: "#1d4ed8", qualidade: "#16a34a",
    alerta_critico: "#dc2626", plano_melhoria: "#d97706",
  };
  const BG_TIPO: Record<string, string> = {
    vinculo: "#eff6ff", qualidade: "#f0fdf4",
    alerta_critico: "#fff7f7", plano_melhoria: "#fffbeb",
  };
  const LABEL_TIPO: Record<string, string> = {
    vinculo: "Vínculo", qualidade: "Qualidade",
    alerta_critico: "Alerta Crítico", plano_melhoria: "Plano de Melhoria",
  };

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1d4ed8", margin: "0 0 4px" }}>Boas Práticas e Alertas</h2>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Destaques e recomendações para Apuí/AM — Abr/2026</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
        <div style={{ background: "#eff6ff", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1d4ed8" }}>{data.total}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Observações totais</div>
        </div>
        <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#16a34a" }}>{data.destaques}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Destaques positivos</div>
        </div>
        <div style={{ background: "#fff7f7", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#dc2626" }}>{data.alertas}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Alertas / Planos de melhoria</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.boas_praticas.map((bp: any, i: number) => {
          const cor = COR_TIPO[bp.tipo] ?? "#6b7280";
          const bg  = BG_TIPO[bp.tipo]  ?? "#f9fafb";
          return (
            <div key={i} style={{ background: bg, border: `1px solid ${cor}20`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {bp.destaque ? <Star size={14} color={cor} /> : <Info size={14} color={cor} />}
                  <span style={{ fontSize: 14, fontWeight: 700, color: cor }}>{bp.titulo}</span>
                </div>
                <span style={{ background: cor, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, flexShrink: 0, marginLeft: 8 }}>
                  {LABEL_TIPO[bp.tipo]}
                </span>
              </div>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{bp.descricao}</p>
              {bp.ubs !== "TODAS" && (
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  UBS: {bp.ubs} · Equipe: {bp.equipe}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Aba: Avaliação Quadrimestral ──────────────────────────────────────────────

function AbaQuadrimestre({ dashData }: { dashData: any }) {
  if (!dashData) return null;
  const v = dashData.vinculo;
  const q = dashData.qualidade;

  const radarData = [
    { indicador: "Vínculo", valor: v.pontuacao_media * 10 },
    { indicador: "Qualidade", valor: Math.min(q.pontuacao_media, 50) * 2 },
    { indicador: "Cobertura ESF", valor: 82 },
    { indicador: "Previne (Cito)", valor: q.cito_meta_pct_media },
    { indicador: "SISAB", valor: 97 },
  ];

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1d4ed8", margin: "0 0 4px" }}>Avaliação do Quadrimestre</h2>
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
          Cálculo dos Componentes de Cofinanciamento Federal da APS — Competência Abr/2026
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Componente Vínculo */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1d4ed8" }}>Componente Vínculo</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>e Acompanhamento Territorial</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: COR_PONT(v.pontuacao_media) }}>{v.pontuacao_media.toFixed(2)}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>média municipal</div>
            </div>
          </div>
          {[
            { label: "Ótimo",       n: v.otimo,      cor: "#1d4ed8", w: `${v.otimo * 11}%` },
            { label: "Bom",         n: v.bom,        cor: "#16a34a", w: `${v.bom * 11}%`   },
            { label: "Suficiente",  n: v.suficiente, cor: "#d97706", w: `${v.suficiente * 11}%` },
            { label: "Regular",     n: v.regular,    cor: "#dc2626", w: `${v.regular * 11}%` },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 12, width: 80, color: s.cor, fontWeight: 600 }}>{s.label}</span>
              <div style={{ flex: 1, height: 18, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: s.w, height: "100%", background: s.cor, borderRadius: 4 }} />
              </div>
              <span style={{ fontWeight: 700, color: s.cor, minWidth: 20, textAlign: "right" }}>{s.n}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
            Total pessoas vinculadas: <strong>{v.total_vinculadas.toLocaleString("pt-BR")}</strong><br />
            Total acompanhadas: <strong>{v.total_acompanhadas.toLocaleString("pt-BR")}</strong>
          </div>
        </div>

        {/* Componente Qualidade */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1d4ed8" }}>Componente Qualidade</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Previne Brasil — 7 indicadores</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#16a34a" }}>{q.pontuacao_media.toFixed(1)}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>pts médios/equipe</div>
            </div>
          </div>
          <div style={{ background: "#fff7f7", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 2 }}>⚠ Ponto crítico: Citopatológico</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Média municipal: <strong>{q.cito_meta_pct_media}%</strong> (meta: 60%).
              Todas as 9 equipes estão abaixo da meta. Necessário plano de ação urgente.
            </div>
          </div>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", marginBottom: 2 }}>✓ Destaque: Pré-natal e Consulta RN</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              7 de 9 equipes atingiram a meta do Ind.1 (Pré-natal). Equipe LIBERDADE com 100% no Ind.4.
            </div>
          </div>
        </div>
      </div>

      {/* Radar */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Radar de Desempenho — Apuí/AM</div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>Score normalizado 0–100 por dimensão</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="indicador" tick={{ fontSize: 11 }} />
              <Radar name="Apuí/AM" dataKey="valor" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

type Aba = "abrangencia" | "vinculo" | "qualidade" | "boas_praticas" | "quadrimestre";

export default function SiapsEgestor() {
  const [aba, setAba] = useState<Aba>("vinculo");

  const { data: dashData }  = useQuery({ queryKey: ["siaps-dashboard"],  queryFn: () => apiGet("/api/siaps/dashboard") as Promise<any> });
  const { data: abrangData } = useQuery({ queryKey: ["siaps-abrang"],    queryFn: () => apiGet("/api/siaps/abrangencia") as Promise<any> });
  const { data: vinculo }    = useQuery({ queryKey: ["siaps-vinculo"],   queryFn: () => apiGet("/api/siaps/vinculo-acompanhamento") as Promise<any>, enabled: aba === "vinculo" });
  const { data: qualidade }  = useQuery({ queryKey: ["siaps-qualidade"], queryFn: () => apiGet("/api/siaps/qualidade") as Promise<any>, enabled: aba === "qualidade" });
  const { data: boas }       = useQuery({ queryKey: ["siaps-boas"],      queryFn: () => apiGet("/api/siaps/boas-praticas") as Promise<any>, enabled: aba === "boas_praticas" });

  const ABAS: { id: Aba; label: string }[] = [
    { id: "abrangencia",    label: "Abrangência Municipal" },
    { id: "vinculo",        label: "Vínculo e Acompanhamento" },
    { id: "qualidade",      label: "Componente Qualidade" },
    { id: "boas_praticas",  label: "Boas Práticas" },
    { id: "quadrimestre",   label: "Avaliação Quadrimestre" },
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#f8fafc" }}>
      <LogoMS />

      {/* Breadcrumb */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "8px 24px", fontSize: 12, color: "#6b7280" }}>
        Página inicial › <span style={{ color: "#1d4ed8", fontWeight: 600 }}>Componentes do Cofinanciamento da APS</span>
      </div>

      {/* Dados Município */}
      {dashData && (
        <div style={{ background: "#1d4ed8", color: "#fff", padding: "10px 24px", display: "flex", gap: 24, alignItems: "center", fontSize: 13 }}>
          <span><strong>UF:</strong> {dashData.uf}</span>
          <span><strong>Município:</strong> {dashData.municipio}</span>
          <span><strong>IED:</strong> {dashData.ied}</span>
          <span><strong>Competência:</strong> {dashData.competencia}</span>
          <span style={{ marginLeft: "auto", background: "rgba(255,255,255,.15)", borderRadius: 20, padding: "3px 12px", fontSize: 11 }}>
            Dado preliminar
          </span>
        </div>
      )}

      <div style={{ padding: "24px 24px 32px", maxWidth: 1100, margin: "0 auto" }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #dbeafe", flexWrap: "wrap" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{
              padding: "9px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13,
              borderBottom: aba === a.id ? "2px solid #1d4ed8" : "2px solid transparent",
              color: aba === a.id ? "#1d4ed8" : "#6b7280",
              fontWeight: aba === a.id ? 700 : 400, marginBottom: -2, whiteSpace: "nowrap",
            }}>{a.label}</button>
          ))}
        </div>

        {aba === "abrangencia"   && <AbaAbrangencia data={abrangData} />}
        {aba === "vinculo"       && <AbaVinculo data={vinculo} />}
        {aba === "qualidade"     && <AbaQualidade data={qualidade} />}
        {aba === "boas_praticas" && <AbaBoasPraticas data={boas} />}
        {aba === "quadrimestre"  && <AbaQuadrimestre dashData={dashData} />}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "16px 0", fontSize: 11, color: "#9ca3af", borderTop: "1px solid #e5e7eb", marginTop: 24 }}>
        Ministério da Saúde | SAPS @2026 | versão: 1.8.2 (dados integrados ERSUS 360)
      </div>
    </div>
  );
}
