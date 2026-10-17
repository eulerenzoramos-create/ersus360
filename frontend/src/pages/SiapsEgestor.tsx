import { useState, useMemo } from "react";
import ComponenteQualidade from "./ComponenteQualidade";
import QualidadeOficialPorEquipe, { capturaNoEndereco } from "../components/QualidadeOficialPorEquipe";
import QuadrimestralEquipes, { ConferenciaFontes } from "../components/QuadrimestralEquipes";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  Users, Star, TrendingUp, AlertTriangle, CheckCircle,
  ChevronDown, ChevronRight, RefreshCw, Download, Info,
} from "lucide-react";
import { apiGet, apiGetRaw, apiPost } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";
import { BRL, BRL_AXIS, PCT } from "../lib/fmt";

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

const TT = { fontSize: 11, background: "#ffffff", border: "none", borderRadius: 6, color: "#f8fafc" };

// ── Logo MS ───────────────────────────────────────────────────────────────────

function LogoMS() {
  const nome = localStorage.getItem("ersus_nome") || "Usuário";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 24px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
      {/* Ícone gov.br — faixas horizontais verde/amarelo/azul */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ width: 28, height: 5, background: "#009c3b", borderRadius: 1 }} />
        <div style={{ width: 28, height: 5, background: "#ffdf00", borderRadius: 1 }} />
        <div style={{ width: 28, height: 5, background: "#002776", borderRadius: 1 }} />
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
        Olá, {nome} ▾
      </div>
    </div>
  );
}

// ── Abrangência Municipal ─────────────────────────────────────────────────────

function AbaAbrangencia({ data }: { data: any }) {
  if (!data || data.situacao_dado === "nao_disponivel") return <NaoDisponivelBanner nota="Importe o XML do CNES em Equipes do CNES para ver as equipes por tipo. Nenhum valor de abrangência foi inventado." />;
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
        <span style={{ background: "#f3f4f6", color: "#6b7280", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>Competência: {data?.competencia ?? "—"}</span>
        {data?.fonte_detalhe && <span style={{ background: "#ecfdf5", color: "#065f46", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>{data.fonte_detalhe}</span>}
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
                  <span style={{ fontSize: 15, fontWeight: 700, color: (data[col.key]?.[t] ?? 0) > 0 ? "#1d4ed8" : "#9ca3af" }}>
                    {data[col.key] ? (data[col.key][t] ?? 0) : "—"}
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
  if (!data) return <NaoDisponivelBanner nota="Integração com SIAPS/e-Gestor ainda não configurada no Railway. Nenhum valor de vinculação foi inventado." />;

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
            {data?.dado_preliminar !== false && (
              <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>Dado preliminar</span>
            )}
            {data?.dado_preliminar === false && (
              <span style={{ background: "#dcfce7", color: "#166534", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>Verificado e-Gestor</span>
            )}
            <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>Competência: {data?.competencia ?? "—"}</span>
            <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>Tipo: eAP, eSF</span>
            {data.aviso && <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>{data.aviso}</span>}
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
          { label: "Pessoas vinculadas", val: data.total_pessoas_vinculadas?.toLocaleString("pt-BR"), cor: "#7c3aed" },
          { label: "Pessoas acompanhadas", val: data.total_pessoas_acompanhadas?.toLocaleString("pt-BR"), cor: "#16a34a" },
          { label: "Pontuação média", val: data.pontuacao_media?.toFixed(2), cor: COR_PONT(data.pontuacao_media) },
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
              <Tooltip contentStyle={TT} formatter={(v: number) => [`${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pts`]} />
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
            <tr style={{ background: "#1e40af", color: "#1d4ed8", fontSize: 9 }}>
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
                  <td style={{ padding: "10px 8px", textAlign: "right", color: "#6b7280" }}>{e.parametro?.toLocaleString("pt-BR")}</td>
                  {(["A","B","C","D","E","F","G","H","I","J","K"] as const).map(v => (
                    <td key={v} style={{ padding: "10px 8px", textAlign: "right", fontWeight: ["C","H","K"].includes(v) ? 700 : 400, color: ["C","H","K"].includes(v) ? "#1d4ed8" : "#374151" }}>
                      {(e as any)[v].toLocaleString("pt-BR")}
                    </td>
                  ))}
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: cor }}>{e.pontuacao?.toFixed(2)}</span>
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

// ── Cores helpers ────────────────────────────────────────────────────────────

const COR_STATUS = (s: string) =>
  s === "otimo" ? "#1d4ed8" : s === "bom" ? "#16a34a" : s === "suficiente" ? "#d97706" : "#dc2626";

const LABEL_STATUS = (s: string) =>
  s === "otimo" ? "ÓTIMO" : s === "bom" ? "BOM" : s === "suficiente" ? "SUFICIENTE" : "REGULAR";

const COR_TEND = (t: string) =>
  t === "crescente" ? "#16a34a" : t === "critica" ? "#dc2626" : t === "crescente_insuf" ? "#d97706" : "#6b7280";

// ── View Diária (com seletor De/Até) ─────────────────────────────────────────

// ── View Mensal ───────────────────────────────────────────────────────────────

const IND_CORES: Record<string, string> = {
  ind1:  "#1d4ed8", ind2:  "#dc2626", ind3:  "#7c3aed", ind4:  "#0891b2",
  ind5:  "#0d9488", ind6:  "#0f766e", ind7:  "#14b8a6",
  ind8:  "#d97706", ind9:  "#ea580c", ind10: "#16a34a",
  ind11: "#9333ea", ind12: "#c026d3", ind13: "#db2777",
  ind14: "#b91c1c", ind15: "#991b1b",
};

// ── View Quadrimestral ────────────────────────────────────────────────────────

// ── Painel Gestor RT ─────────────────────────────────────────────────────────

const GRUPOS_IND = {
  esf: {
    label: "eSF — Saúde da Família",
    cor: "#1d4ed8",
    bg: "#eff6ff",
    border: "#bfdbfe",
    indices: [0,1,2,3, 7,8,9,10, 13,14],   // ind1-4, ind8-11, ind14-15
    eixos: ["Criança e Mulher","Doenças Crônicas","IST"],
  },
  bucal: {
    label: "eSB — Saúde Bucal",
    cor: "#7c3aed",
    bg: "#faf5ff",
    border: "#e9d5ff",
    indices: [4,5,6],                        // ind5-7
    eixos: ["Saúde Bucal"],
  },
  emulti: {
    label: "eMulti — Multiprofissional",
    cor: "#0891b2",
    bg: "#f0f9ff",
    border: "#bae6fd",
    indices: [11,12],                        // ind12-13
    eixos: ["Saúde Mental"],
  },
} as const;

type TipoEquipe = keyof typeof GRUPOS_IND;

// ── Painel dos 15 Indicadores por Equipe ─────────────────────────────────────
// ── Componente Qualidade ──────────────────────────────────────────────────────

const IND_NOMES: Record<string, string> = {
  ind1_prenatal:    "I01 — Pré-natal ≥7 consultas (1º trim.)",
  ind2_cito:        "I02 — Citopatológico",
  ind3_vacina:      "I03 — DTP/Pentavalente",
  ind4_rn:          "I04 — Puerpério / RN 1ª semana",
  ind5_odonto1:     "I05 — 1ª Consulta Odontológica",
  ind6_odonto_comp: "I06 — Tratamento Odontológico Completado",
  ind7_urg_odonto:  "I07 — Urgência Odontológica Resolvida",
  ind8_has:         "I08 — Acompanhamento HAS",
  ind9_dm:          "I09 — Acompanhamento DM (HbA1c)",
  ind10_obesidade:  "I10 — Obesidade Infantil",
  ind11_cv:         "I11 — Alto Risco Cardiovascular",
  ind12_psicose:    "I12 — Esquizofrenia / Psicose",
  ind13_tab:        "I13 — Transtorno Afetivo Bipolar",
  ind14_sif_gest:   "I14 — Sífilis em Gestante",
  ind15_sif_cong:   "I15 — Sífilis Congênita",
};

function AbaQualidade({ data: _data }: { data: any }) {
  const [extraindo, setExtraindo] = useState(false);
  const [msgExtracao, setMsgExtracao] = useState<string | null>(null);

  const { data: syncStatus } = useQuery({
    queryKey: ["sync-status"],
    queryFn: () => apiGet("/api/sync/status") as Promise<any>,
    staleTime: 30_000,
    refetchInterval: extraindo ? 5000 : false,
  });

  const handleExtrair = async () => {
    setExtraindo(true);
    setMsgExtracao("Iniciando extração SIAPS Jan–Ago/2026…");
    try {
      const d = await apiPost("/api/sync/extrair-historico") as any;
      setMsgExtracao((d as any)?.mensagem || "Extração iniciada em background.");
    } catch (err: any) {
      console.error("[extrair-historico] erro:", err);
      const status = err?.response?.status;
      const raw    = err?.response?.data;
      const detalhe: string =
        typeof raw?.detail === "string" ? raw.detail :
        typeof raw?.mensagem === "string" ? raw.mensagem :
        raw ? JSON.stringify(raw) :
        typeof err?.message === "string" ? err.message : "erro desconhecido";
      if (status === 401 || status === 403) {
        setMsgExtracao("Sessão expirada — faça login novamente.");
      } else if (detalhe.toLowerCase().includes("credencial") || detalhe.toLowerCase().includes("cpf") || detalhe.toLowerCase().includes("senha")) {
        setMsgExtracao("Credenciais SIAPS inválidas — verifique SIAPS_CPF/SIAPS_SENHA no Railway.");
      } else {
        setMsgExtracao(`Erro na extração (HTTP ${status ?? "?"}): ${detalhe}`);
      }
      setExtraindo(false);
    }
  };

  const cache: any[] = syncStatus?.cache_disponivel ?? [];
  const emAndamento: boolean = syncStatus?.extracao?.em_andamento ?? false;

  return (
    <div>
      {/* Painel de extração */}
      <div style={{
        background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10,
        padding: "12px 18px", marginBottom: 16, display: "flex",
        alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0369a1", marginBottom: 2 }}>
            Extração SIAPS · e-Gestor
          </div>
          <div style={{ fontSize: 11, color: "#475569" }}>
            {cache.length > 0
              ? `${cache.length} competências no cache · última via ${cache[cache.length-1]?.fonte ?? "?"}`
              : "Nenhuma extração realizada. Clique em Extrair para buscar Jan–Ago/2026."}
          </div>
          {msgExtracao && (
            <div style={{ fontSize: 11, color: emAndamento ? "#d97706" : "#16a34a", marginTop: 4 }}>
              {emAndamento ? "⏳ " : "✓ "}{msgExtracao}
            </div>
          )}
        </div>
        <button
          onClick={handleExtrair}
          disabled={emAndamento || extraindo}
          style={{
            background: emAndamento ? "#9ca3af" : "#0ea5e9",
            color: "#fff", border: "none", borderRadius: 8,
            padding: "7px 16px", fontSize: 12, fontWeight: 700,
            cursor: emAndamento ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          {emAndamento ? "⏳ Extraindo…" : "⬇ Extrair Histórico"}
        </button>
      </div>

      {/* Status compacto por competência */}
      {cache.length > 0 && (
        <div style={{
          display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12,
        }}>
          {cache.map((c: any) => (
            <span key={c.competencia} style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
              background: c.equipes >= 5 ? "#dcfce7" : "#fef9c3",
              color: c.equipes >= 5 ? "#166534" : "#713f12", border: "1px solid",
              borderColor: c.equipes >= 5 ? "#86efac" : "#fde68a",
            }}>
              {c.label} · {c.equipes}eq
            </span>
          ))}
        </div>
      )}

      <QualidadeOficialPorEquipe />
      <QualidadeImportada />
      <ComponenteQualidade />
    </div>
  );
}

// ── Indicadores de Qualidade importados do SIAPS ("Baixar dados") ─────────────
function QualidadeImportada() {
  const { data } = useQuery({
    queryKey: ["siaps-relatorios", undefined],
    queryFn: () => apiGet("/api/siaps-relatorios/painel") as Promise<any>,
    staleTime: 60_000,
  });
  const qual: any[] = data?.qualidade ?? [];
  if (!data || data.situacao_dado === "nao_disponivel" || qual.length === 0) {
    return (
      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 12 }}>
        Nenhum relatório de Qualidade do SIAPS importado. Baixe no SIAPS (Visão por Competência → "Baixar dados"),
        inclusive a aba eSFR, e importe em <a href="/siaps-relatorios" style={{ color: "#1d4ed8" }}>Relatórios do SIAPS</a>.
      </div>
    );
  }
  const indicadores = Array.from(new Set(qual.map(q => q.indicador))) as string[];
  const equipes: any[] = (data.equipes ?? []).filter((e: any) => Object.keys(e.qualidade ?? {}).length > 0);
  const fmt = (v: number | null | undefined) => (v === null || v === undefined ? "—" : v.toLocaleString("pt-BR"));
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, marginBottom: 16, overflowX: "auto", color: "#1f2937" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 700, color: "#1d4ed8" }}>Qualidade — relatórios do SIAPS importados · {data.competencia}</div>
        <a href="/siaps-relatorios" style={{ fontSize: 12, color: "#1d4ed8" }}>Importar / ver detalhes</a>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead><tr style={{ background: "#f5f5f3", textAlign: "left" }}>
          <th style={{ padding: "6px 8px" }}>Equipe</th><th style={{ padding: "6px 8px" }}>Tipo</th>
          {indicadores.map(i => <th key={i} style={{ padding: "6px 8px" }}>{i}</th>)}
        </tr></thead>
        <tbody>{equipes.map(e => (
          <tr key={e.ine} style={{ borderTop: "1px solid #eee" }}>
            <td style={{ padding: "6px 8px", fontWeight: 600 }}>{e.equipe}</td>
            <td style={{ padding: "6px 8px" }}>{e.sigla}</td>
            {indicadores.map(i => <td key={i} style={{ padding: "6px 8px" }}>{fmt(e.qualidade?.[i])}</td>)}
          </tr>))}
        </tbody>
      </table>
      {(data.avisos ?? []).map((a: string, k: number) => <div key={k} style={{ fontSize: 11, color: "#525252", marginTop: 6 }}>ⓘ {a}</div>)}
    </div>
  );
}

// ── Boas Práticas ─────────────────────────────────────────────────────────────

function AbaBoasPraticas({ data }: { data: any }) {
  if (!data || !data.boas_praticas?.length) return <NaoDisponivelBanner nota="Ainda não há resultado oficial captado: importe o relatório CVAT do SIAPS ou atualize a Avaliação Quadrimestre. Nenhum dado de boas práticas é inventado." />;
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
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Gerados dos resultados oficiais: {data.fontes?.join(" · ")}</p>
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
          const ranking: any[] = bp.por_equipe ?? [];
          const meta = ranking.length > 0
            ? (bp.descricao.match(/meta.*?(\d+(?:[,.]\d+)?)%/)?.[1] ?? null)
            : null;
          return (
            <div key={i} style={{ background: bg, border: `1px solid ${cor}20`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {bp.destaque ? <Star size={14} color={cor} /> : <Info size={14} color={cor} />}
                  <span style={{ fontSize: 14, fontWeight: 700, color: cor }}>{bp.titulo}</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                  {bp.indicador && (
                    <span style={{ background: "#f1f5f9", color: "#475569", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                      {bp.indicador.split("—")[0].trim()}
                    </span>
                  )}
                  <span style={{ background: cor, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                    {LABEL_TIPO[bp.tipo]}
                  </span>
                </div>
              </div>

              {/* Ranking por equipe — só para cards de indicador */}
              {ranking.length > 0 && (
                <div style={{ marginBottom: 10, overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        <th style={{ textAlign: "left", padding: "4px 8px", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>#</th>
                        <th style={{ textAlign: "left", padding: "4px 8px", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>Equipe</th>
                        <th style={{ textAlign: "left", padding: "4px 8px", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>UBS</th>
                        <th style={{ textAlign: "right", padding: "4px 8px", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>Resultado</th>
                        <th style={{ textAlign: "center", padding: "4px 8px", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((r: any, j: number) => {
                        const cls = r.classificacao as string | undefined;
                        const CLS_COR: Record<string, [string, string, string]> = {
                          otimo: ["#1d4ed8", "#eff6ff", "Ótimo"], bom: ["#16a34a", "#f0fdf4", "Bom"],
                          suficiente: ["#d97706", "#fffbeb", "Suficiente"], regular: ["#dc2626", "#fff7f7", "Regular"],
                        };
                        const sCor = cls ? CLS_COR[cls]?.[0] ?? "#6b7280" : r.status === "verde" ? "#16a34a" : r.status === "amarelo" ? "#d97706" : "#dc2626";
                        const sBg  = cls ? CLS_COR[cls]?.[1] ?? "#f9fafb" : r.status === "verde" ? "#f0fdf4" : r.status === "amarelo" ? "#fffbeb" : "#fff7f7";
                        return (
                          <tr key={j} style={{ borderBottom: "1px solid #f1f5f9", background: j % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td style={{ padding: "4px 8px", color: "#9ca3af", fontWeight: 700 }}>{j + 1}º</td>
                            <td style={{ padding: "4px 8px", fontWeight: 700, color: "#1e293b" }}>{r.equipe}</td>
                            <td style={{ padding: "4px 8px", color: "#64748b", fontSize: 10 }}>{r.ubs}</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 800, color: sCor }}>
                              {typeof r.resultado === "number" ? r.resultado.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : r.resultado}{cls ? "" : "%"}
                              {meta && (
                                <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: 4 }}>/ {meta}%</span>
                              )}
                            </td>
                            <td style={{ padding: "4px 8px", textAlign: "center" }}>
                              <span style={{ background: sBg, color: sCor, fontWeight: 700, fontSize: 10, padding: "2px 7px", borderRadius: 10 }}>
                                {cls ? CLS_COR[cls]?.[2] ?? cls : r.status === "verde" ? "✓ Meta" : r.status === "amarelo" ? "~ Alerta" : "✗ Crítico"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {bp.descricao && <div style={{ fontSize: 12.5, color: "#374151", marginBottom: 6 }}>{bp.descricao}</div>}
              <div style={{ fontSize: 11, color: "#9ca3af" }}>
                {bp.ubs !== "TODAS" && bp.ubs !== "VER DETALHES" && <>UBS: {bp.ubs} · Equipe: {bp.equipe} · </>}
                Fonte: {bp.fonte}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Aba: Avaliação do Quadrimestre — resultado OFICIAL publicado no SIAPS (área pública) ─────────
// Fonte: apisiaps.saude.gov.br/api/public, sincronizado todo dia pelo backend (/api/siaps-publico).
// Nada é calculado aqui: só as contagens Ótimo/Bom/Suficiente/Regular publicadas pelo MS.

type ContagemQ = { otimo: number; bom: number; suficiente: number; regular: number; total: number };
type ComponenteQ = ContagemQ & { componente: string; origem: string; tipo_equipe: string };
type IndicadorQ = ContagemQ & { tipo_equipe: string; co_indicador: number; indicador?: string; dimensao?: string };
type QuadOficial = {
  quadrimestre: string; rotulo: string; versao: number; revisado_pelo_ms: boolean; coletado_em: string;
  componentes: ComponenteQ[]; indicadores_qualidade: IndicadorQ[]; dimensoes_cvat: IndicadorQ[];
};
type PainelSiapsPublico = {
  situacao_dado: string; fonte: string; nota: string; quadrimestres: QuadOficial[];
  equidade: { faixa_ied: string; porte_populacional: string; competencia_referencia: string } | null;
  alertas: { severidade: string; texto: string }[];
  ultima_sincronizacao: { quando: string; sucesso: boolean; erro: string | null } | null;
};

const _CLASSES: { k: keyof ContagemQ; label: string; cor: string; bg: string }[] = [
  { k: "otimo",      label: "Ótimo",      cor: "#1d4ed8", bg: "#eff6ff" },
  { k: "bom",        label: "Bom",        cor: "#16a34a", bg: "#f0fdf4" },
  { k: "suficiente", label: "Suficiente", cor: "#d97706", bg: "#fffbeb" },
  { k: "regular",    label: "Regular",    cor: "#dc2626", bg: "#fff7f7" },
];
const _dataBR = (iso?: string | null) => iso ? new Date(iso.endsWith("Z") ? iso : iso + "Z").toLocaleString("pt-BR") : "—";
const _chaveComp = (c: { origem: string; tipo_equipe: string }) => `${c.origem}|${c.tipo_equipe}`;

function MarkdownIA({ texto }: { texto: string }) {
  // renderização simples do texto da IA: títulos, listas e negrito
  const negrito = (s: string) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>);
  return (
    <div style={{ fontSize: 13, color: "#1f2937", lineHeight: 1.6 }}>
      {texto.split("\n").map((l, i) => {
        const t = l.trim();
        if (!t) return <div key={i} style={{ height: 6 }} />;
        const h = t.match(/^(#{1,4})\s+(.*)$/);
        if (h) return <div key={i} style={{ fontWeight: 800, fontSize: h[1].length <= 2 ? 15 : 13.5, color: "#1e3a8a", marginTop: 8 }}>{negrito(h[2])}</div>;
        const li = t.match(/^([-*•]|\d+[.)])\s+(.*)$/);
        if (li) return <div key={i} style={{ paddingLeft: 18, textIndent: -12 }}>• {negrito(li[2])}</div>;
        if (t.startsWith("|")) return <div key={i} style={{ fontFamily: "monospace", fontSize: 11.5, whiteSpace: "pre" }}>{t}</div>;
        return <div key={i}>{negrito(t)}</div>;
      })}
    </div>
  );
}

function PainelErsusIA() {
  const [pergunta, setPergunta] = useState("");
  const [carregando, setCarregando] = useState<string | null>(null);
  const [resp, setResp] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function pedir(modo: string) {
    if (modo === "pergunta" && !pergunta.trim()) return;
    setCarregando(modo); setErro(null);
    try {
      setResp(await apiPost("/api/siaps-ia/analisar", { modo, pergunta: modo === "pergunta" ? pergunta : null }));
    } catch (e: any) {
      setErro(e?.response?.data?.detail ?? "Não foi possível consultar a IA agora.");
    } finally {
      setCarregando(null);
    }
  }

  function baixar() {
    if (!resp) return;
    const corpo = `${resp.resposta}\n\n---\nFontes: ${resp.fontes.join("; ")}\nGerado em ${_dataBR(resp.gerado_em)} · ${resp.aviso}\n`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([corpo], { type: "text/markdown;charset=utf-8" }));
    a.download = `ERSUS-IA-SIAPS-${resp.modo}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
  }

  const botoes = [
    { modo: "analise", label: "Analisar desempenho" },
    { modo: "plano", label: "Plano de ação" },
    { modo: "relatorio", label: "Relatório técnico" },
  ];
  return (
    <div style={{ background: "#fff", border: "1px solid #c7d2fe", borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#3730a3" }}>ERSUS IA — Analista SIAPS</div>
      </div>
      <div style={{ fontSize: 11.5, color: "#6b7280", marginBottom: 12 }}>
        Analisa somente os resultados oficiais já captados (SIAPS público, relatório SIAPS importado e e-Gestor). Não inventa nem recalcula números.
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {botoes.map(b => (
          <button key={b.modo} onClick={() => pedir(b.modo)} disabled={!!carregando}
            style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #4f46e5", background: "#4f46e5", color: "#fff",
                     fontSize: 12, fontWeight: 700, cursor: carregando ? "wait" : "pointer", opacity: carregando && carregando !== b.modo ? .5 : 1 }}>
            {carregando === b.modo ? "Gerando…" : b.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={pergunta} onChange={e => setPergunta(e.target.value)} maxLength={2000}
          onKeyDown={e => { if (e.key === "Enter") pedir("pergunta"); }}
          placeholder="Pergunte, ex.: quais indicadores de Qualidade pioraram em relação ao quadrimestre anterior?"
          style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12.5 }} />
        <button onClick={() => pedir("pergunta")} disabled={!!carregando || !pergunta.trim()}
          style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #4f46e5", background: "#fff", color: "#4f46e5",
                   fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          {carregando === "pergunta" ? "Pensando…" : "Perguntar"}
        </button>
      </div>
      {carregando && <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 10 }}>A análise pode levar até um minuto…</div>}
      {erro && <div style={{ marginTop: 10, fontSize: 12, color: "#b91c1c", background: "#fef2f2", borderRadius: 6, padding: "8px 10px" }}>{erro}</div>}
      {resp && !carregando && (
        <div style={{ marginTop: 14, borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
          <MarkdownIA texto={resp.resposta} />
          <div style={{ marginTop: 12, fontSize: 11, color: "#6b7280", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <span>Fontes: {resp.fontes.join(" · ")} · {_dataBR(resp.gerado_em)}<br />{resp.aviso}</span>
            <button onClick={baixar} style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>
              <Download size={11} /> Baixar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AbaQuadrimestre({ dashData: _unused }: { dashData: any }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["siaps-publico"],
    queryFn: () => apiGetRaw("/api/siaps-publico") as Promise<PainelSiapsPublico>,
    staleTime: 5 * 60 * 1000,
  });
  const [quadSel, setQuadSel] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [msgAtualizar, setMsgAtualizar] = useState<string | null>(null);

  const quads = data?.quadrimestres ?? [];
  const atual = quads.find(q => q.quadrimestre === quadSel) ?? quads[0];
  const anterior = atual ? quads[quads.indexOf(atual) + 1] : undefined;

  async function atualizar() {
    setAtualizando(true); setMsgAtualizar(null);
    try {
      const r: any = await apiPost("/api/siaps-publico/sincronizar");
      setMsgAtualizar(r.novo.length || r.revisado.length
        ? `Novidades do SIAPS: ${[...r.novo, ...r.revisado].join(", ")}`
        : "SIAPS consultado agora — sem novidades publicadas.");
      await refetch();
    } catch (e: any) {
      setMsgAtualizar(e?.response?.data?.detail ?? "Não foi possível consultar o SIAPS agora.");
    } finally {
      setAtualizando(false);
    }
  }

  // evolução: uma série por componente/tipo de equipe, do quadrimestre mais antigo ao mais recente
  const evolucao = useMemo(() => {
    const series: Record<string, { titulo: string; pontos: any[] }> = {};
    [...quads].reverse().forEach(q => q.componentes.forEach(c => {
      const k = _chaveComp(c);
      series[k] ??= { titulo: `${c.componente} — ${c.tipo_equipe}`, pontos: [] };
      series[k].pontos.push({ q: q.quadrimestre, Ótimo: c.otimo, Bom: c.bom, Suficiente: c.suficiente, Regular: c.regular });
    }));
    return Object.values(series);
  }, [quads]);

  const ant = (lista: IndicadorQ[] | undefined, i: IndicadorQ) =>
    lista?.find(x => x.co_indicador === i.co_indicador && x.tipo_equipe === i.tipo_equipe);

  const cab = { padding: "7px 8px", fontSize: 11, fontWeight: 700, color: "#475569", textAlign: "center" as const, background: "#f1f5f9" };
  const cel = { padding: "6px 8px", fontSize: 12, textAlign: "center" as const, borderTop: "1px solid #f1f5f9" };

  const tabela = (titulo: string, linhas: IndicadorQ[], antes?: IndicadorQ[]) => (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, overflowX: "auto" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e3a8a", marginBottom: 8 }}>{titulo}</div>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
        <thead><tr>
          <th style={{ ...cab, textAlign: "left" }}>Indicador</th><th style={cab}>Equipe</th>
          {_CLASSES.map(c => <th key={c.k} style={{ ...cab, color: c.cor }}>{c.label}</th>)}
          <th style={cab}>Regular vs. anterior</th>
        </tr></thead>
        <tbody>
          {linhas.map(i => {
            const a = ant(antes, i);
            const delta = a ? i.regular - a.regular : null;
            return (
              <tr key={`${i.tipo_equipe}-${i.co_indicador}`} style={{ background: i.regular ? "#fff7f7" : undefined }}>
                <td style={{ ...cel, textAlign: "left" }}>{i.indicador ?? i.dimensao}</td>
                <td style={cel}>{i.tipo_equipe}</td>
                {_CLASSES.map(c => <td key={c.k} style={{ ...cel, color: i[c.k] ? c.cor : "#cbd5e1", fontWeight: i[c.k] ? 700 : 400 }}>{i[c.k]}</td>)}
                <td style={{ ...cel, color: delta == null ? "#94a3b8" : delta > 0 ? "#dc2626" : delta < 0 ? "#16a34a" : "#64748b", fontWeight: 700 }}>
                  {delta == null ? "—" : delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : "="}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Barra SIAPS — UF / Município / IED / Quadrimestre ── */}
      <div>
        <div style={{ background: "#1d4ed8", borderRadius: "10px 10px 0 0", padding: "10px 18px", display: "flex",
                      alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            {[
              { k: "UF", v: "AM" },
              { k: "Município", v: "APUÍ" },
              { k: "IED", v: data?.equidade?.faixa_ied ?? "—" },
              { k: "Quadrimestre", v: atual?.rotulo ?? "—" },
            ].map(item => (
              <div key={item.k} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#93c5fd", fontWeight: 600 }}>{item.k}:</span>
                <span style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>{item.v}</span>
              </div>
            ))}
          </div>
          <div style={{ background: "#ffffff33", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#fff", fontWeight: 600 }}>
            {atual ? `Resultado oficial · SIAPS${atual.revisado_pelo_ms ? " · revisado pelo MS" : ""}` : "Aguardando SIAPS"}
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 10px 10px",
                      padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>Avaliação do Quadrimestre</div>
          {quads.length > 0 && (
            <select value={atual?.quadrimestre} onChange={e => setQuadSel(e.target.value)}
              style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12 }}>
              {quads.map(q => <option key={q.quadrimestre} value={q.quadrimestre}>{q.rotulo}</option>)}
            </select>
          )}
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            Última consulta ao SIAPS: {_dataBR(data?.ultima_sincronizacao?.quando)}
            {data?.ultima_sincronizacao && !data.ultima_sincronizacao.sucesso && <span style={{ color: "#b91c1c" }}> · falhou: {data.ultima_sincronizacao.erro}</span>}
            {" "}· atualização automática diária
          </div>
          <button onClick={atualizar} disabled={atualizando}
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6,
                     border: "1px solid #1d4ed8", background: "#fff", color: "#1d4ed8", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <RefreshCw size={12} /> {atualizando ? "Consultando SIAPS…" : "Atualizar do SIAPS"}
          </button>
          {msgAtualizar && <div style={{ width: "100%", fontSize: 11.5, color: "#334155" }}>{msgAtualizar}</div>}
        </div>
      </div>

      {isLoading && <div style={{ padding: 30, textAlign: "center", color: "#6b7280" }}>Carregando resultados do SIAPS…</div>}
      {!isLoading && !atual && (
        <div style={{ padding: 30, textAlign: "center", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10, color: "#475569", fontSize: 13 }}>
          Ainda não há resultado do quadrimestre captado do SIAPS para este município. Clique em <b>Atualizar do SIAPS</b>.
        </div>
      )}

      {atual && <>
        {/* ── Alertas ── */}
        {data!.alertas.length > 0 && quadSel == null && (
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "#9a3412", marginBottom: 6, display: "flex", gap: 6, alignItems: "center" }}>
              <AlertTriangle size={14} /> Pontos de atenção — {quads[0].rotulo}
            </div>
            {data!.alertas.map((a, i) => (
              <div key={i} style={{ fontSize: 12, color: a.severidade === "alta" ? "#b91c1c" : "#9a3412", padding: "2px 0" }}>• {a.texto}</div>
            ))}
          </div>
        )}

        {/* ── Classificação final por componente e tipo de equipe ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
          {atual.componentes.map(c => {
            const a = anterior?.componentes.find(x => _chaveComp(x) === _chaveComp(c));
            return (
              <div key={_chaveComp(c)} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e3a8a" }}>{c.componente}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10 }}>{c.tipo_equipe} · {c.total} equipes avaliadas</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {_CLASSES.map(k => (
                    <div key={k.k} style={{ background: k.bg, borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: k.cor }}>{c[k.k]}</div>
                      <div style={{ fontSize: 10.5, color: k.cor }}>{k.label}</div>
                      {a && <div style={{ fontSize: 9.5, color: "#94a3b8" }}>antes {a[k.k]}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Evolução entre quadrimestres ── */}
        {quads.length > 1 && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e3a8a", marginBottom: 10 }}>Evolução por quadrimestre (nº de equipes por classificação)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              {evolucao.map(s => (
                <div key={s.titulo}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", marginBottom: 4 }}>{s.titulo}</div>
                  <ResponsiveContainer width="100%" height={170}>
                    <BarChart data={s.pontos}>
                      <XAxis dataKey="q" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} />
                      <Tooltip contentStyle={{ fontSize: 11 }} />
                      {_CLASSES.map(k => <Bar key={k.k} dataKey={k.label} stackId="a" fill={k.cor} />)}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </div>
        )}

        {tabela("Componente Qualidade — conceito por indicador", atual.indicadores_qualidade, anterior?.indicadores_qualidade)}
        {tabela("Vínculo e Acompanhamento Territorial — dimensões", atual.dimensoes_cvat, anterior?.dimensoes_cvat)}

        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#0369a1", display: "flex", gap: 8 }}>
          <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            {data!.fonte} · {atual.rotulo} · captado em {_dataBR(atual.coletado_em)}
            {atual.revisado_pelo_ms && ` (versão ${atual.versao}: o MS alterou o resultado depois da primeira publicação)`}
            {data!.equidade && ` · Equidade: IED ${data!.equidade.faixa_ied}, porte ${data!.equidade.porte_populacional}`}.
            {" "}{data!.nota}
          </span>
        </div>
      </>}

      <QuadrimestralEquipes />
      <ConferenciaFontes />

      <PainelErsusIA />
    </div>
  );
}

// ── Aba: Análise do Indicador — resultado oficial por indicador, equipe e competência (SIAPS) ───────
function AbaAnaliseIndicador() {
  return <QualidadeOficialPorEquipe modo="analise" />;
}


// ── Aba: Relatório de Pagamento (e-Gestor APS) ────────────────────────────────

// Dados lidos automaticamente do e-Gestor (relatório público de pagamento, sem login) — /api/egestor-pagamento
interface PgtoEquipe {
  ine: string; equipe: string | null; tipo: string | null; componente: string | null; co_componente: number;
  cnes: string | null; ine_vinculada: string | null; equipe_vinculada: string | null; st_pagamento: string | null;
  pendencias: { campo: string; rotulo: string; situacao: string }[]; ok: boolean; detalhe: Record<string, string>;
}
interface PgtoComponente {
  co_plano: number; plano: string; co_componente: number; componente: string; vl_total: number | null;
  vl_desconto: number | null; vl_ajuste: number | null; classificacao_qualidade: string | null;
  classificacao_vinculo: string | null; resumo: Record<string, number | string | null>;
}
interface PgtoPainel {
  situacao_dado: string; fonte: string; parcelas: { nu_parcela: string; rotulo: string }[]; parcela?: string;
  parcela_rotulo?: string; competencia_cnes_rotulo?: string; coletado_em?: string; classificacao_qualidade?: string | null;
  classificacao_vinculo?: string | null; total?: number; descontos?: number; componentes?: PgtoComponente[];
  equipes?: PgtoEquipe[]; equipes_com_pendencia?: number;
}

const PLANOS: { id: number; label: string }[] = [
  { id: 8, label: "eSF e eAP" }, { id: 10, label: "Saúde Bucal" }, { id: 9, label: "eMulti" },
  { id: 2, label: "ACS" }, { id: 11, label: "Demais programas" }, { id: 12, label: "Per capita" }, { id: 16, label: "Promoção à saúde" },
];
const COR_CLASSIF: Record<string, string> = { "ÓTIMO": "#1d4ed8", "BOM": "#16a34a", "SUFICIENTE": "#d97706", "REGULAR": "#dc2626" };
const ROTULO_RESUMO: Record<string, string> = {
  qtTeto: "Teto", qtCredenciado: "Credenciadas", qtHomologado: "Homologadas", qtPagamento: "Pagas",
  vlPagamentoFixo: "Componente fixo", vlPagamentoQualidade: "Componente qualidade", vlPagamentoVinculo: "Componente vínculo",
  vlPagamentoImplantacao: "Implantação", vlPagamento: "Pagamento", vlAjuste: "Ajuste", vlDesconto: "Desconto",
  dsFaixaIndiceEquidade: "Faixa do índice de equidade", dsClassificacaoQualidade: "Classificação Qualidade",
  dsClassificacaoVinculo: "Classificação Vínculo", qtPagamentoModalidadeI: "Pagas modalidade I", qtPagamentoModalidadeII: "Pagas modalidade II",
};
const pgCard: React.CSSProperties = { background: "#fff", color: "#1f2937", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, marginBottom: 16 };
const pgTh: React.CSSProperties = { padding: "7px 10px", textAlign: "left", fontSize: 12, color: "#374151", background: "#f3f4f6", whiteSpace: "nowrap" };
const pgTd: React.CSSProperties = { padding: "7px 10px", fontSize: 12, borderTop: "1px solid #eef0f3", color: "#1f2937" };
const valorResumo = (k: string, v: unknown) =>
  typeof v === "number" ? (k.startsWith("vl") ? BRL(v) : v.toLocaleString("pt-BR")) : String(v ?? "—");

function AbaRelatorioPagamento() {
  const [parcela, setParcela] = useState<string | undefined>();
  const [plano, setPlano] = useState(8);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { data, refetch, isLoading } = useQuery<PgtoPainel>({
    queryKey: ["egestor-pagamento", parcela],
    queryFn: () => apiGetRaw<PgtoPainel>("/api/egestor-pagamento", parcela ? { parcela } : undefined),
  });
  const atualizar = async () => {
    setAtualizando(true); setErro(null);
    try { await apiPost("/api/egestor-pagamento/sincronizar"); await refetch(); }
    catch (e: any) { setErro(e?.response?.data?.detail ?? "e-Gestor indisponível no momento — tente mais tarde."); }
    finally { setAtualizando(false); }
  };
  const comps = (data?.componentes ?? []).filter(c => c.co_plano === plano);
  const equipes = (data?.equipes ?? []).filter(e => comps.some(c => c.co_componente === e.co_componente));
  const totalPlano = comps.reduce((s, c) => s + (c.vl_total ?? 0), 0);
  const planosComDados = PLANOS.filter(p => (data?.componentes ?? []).some(c => c.co_plano === p.id));

  return (
    <div>
      <div style={{ ...pgCard, padding: 0, overflow: "hidden" }}>
        <div style={{ background: "#1a56db", color: "#fff", padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>e-Gestor Atenção Primária à Saúde — Relatório de Pagamento</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
              Atualizado automaticamente todo dia pelo ERSUS360 · {data?.coletado_em ? `última leitura ${new Date(data.coletado_em + "Z").toLocaleString("pt-BR")}` : "aguardando a primeira leitura"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={atualizar} disabled={atualizando} style={{ background: "#fff", color: "#1a56db", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              {atualizando ? "Atualizando…" : "↻ Atualizar agora"}
            </button>
            <button onClick={() => window.open("https://relatorioaps.saude.gov.br/gerenciaaps/pagamento", "_blank")} style={{ background: "rgba(255,255,255,.18)", color: "#fff", border: "1px solid rgba(255,255,255,.4)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              ↗ Abrir no e-Gestor
            </button>
          </div>
        </div>
        {erro && <div style={{ padding: "8px 18px", background: "#fef2f2", color: "#b91c1c", fontSize: 12 }}>{erro}</div>}
        {isLoading ? <div style={{ padding: 18, fontSize: 13, color: "#6b7280" }}>Carregando…</div>
          : data?.situacao_dado !== "oficial_validado" ? (
            <div style={{ padding: 18, fontSize: 13, color: "#374151" }}>
              Ainda não há leitura do e-Gestor para este município. Clique em <strong>Atualizar agora</strong> — a leitura é automática e não precisa baixar arquivo.
            </div>
          ) : (
            <div style={{ padding: "14px 18px", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center", fontSize: 13 }}>
              <label style={{ color: "#374151" }}>Parcela{" "}
                <select value={data.parcela} onChange={e => setParcela(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "5px 8px", fontSize: 13, background: "#fff", color: "#1f2937" }}>
                  {data.parcelas.map(p => <option key={p.nu_parcela} value={p.nu_parcela}>{p.rotulo}</option>)}
                </select>
              </label>
              <span style={{ color: "#374151" }}>Competência CNES: <strong>{data.competencia_cnes_rotulo}</strong></span>
              <span style={{ color: "#374151" }}>Total da parcela: <strong>{BRL(data.total ?? 0)}</strong></span>
              {!!data.descontos && <span style={{ color: "#b91c1c" }}>Descontos: <strong>{BRL(data.descontos)}</strong></span>}
              <span style={{ color: "#374151" }}>Qualidade: <strong style={{ color: COR_CLASSIF[data.classificacao_qualidade ?? ""] }}>{data.classificacao_qualidade ?? "—"}</strong></span>
              <span style={{ color: "#374151" }}>Vínculo: <strong style={{ color: COR_CLASSIF[data.classificacao_vinculo ?? ""] }}>{data.classificacao_vinculo ?? "—"}</strong></span>
              <span style={{ color: data.equipes_com_pendencia ? "#b91c1c" : "#15803d", fontWeight: 600 }}>
                {data.equipes_com_pendencia ? `⚠ ${data.equipes_com_pendencia} equipe(s) com pendência` : "✓ Nenhuma equipe com pendência"}
              </span>
            </div>
          )}
      </div>

      {data?.situacao_dado === "oficial_validado" && (
        <>
          <div role="tablist" style={{ display: "flex", gap: 2, borderBottom: "2px solid #e4e7ec", marginBottom: 16, flexWrap: "wrap" }}>
            {planosComDados.map(p => (
              <button key={p.id} role="tab" aria-selected={plano === p.id} onClick={() => setPlano(p.id)} style={{
                padding: "9px 18px", border: "none", background: "none", cursor: "pointer", fontSize: 13,
                borderBottom: plano === p.id ? "3px solid #1d4ed8" : "3px solid transparent", marginBottom: -2,
                color: plano === p.id ? "#1d4ed8" : "#6b7280", fontWeight: plano === p.id ? 700 : 500,
              }}>{p.label}</button>
            ))}
          </div>

          <div style={pgCard}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{comps[0]?.plano ?? PLANOS.find(p => p.id === plano)?.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Total: {BRL(totalPlano)}</div>
            </div>
            {comps.length === 0 ? <div style={{ fontSize: 13, color: "#6b7280" }}>Sem pagamento nesta parcela.</div> : comps.map(c => (
              <div key={c.co_componente} style={{ border: "1px solid #eef0f3", borderRadius: 8, marginBottom: 10, overflow: "hidden" }}>
                <div style={{ background: "#f8fafc", padding: "8px 12px", display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                  <span>{c.componente}</span><span>{BRL(c.vl_total ?? 0)}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, padding: "10px 12px" }}>
                  {Object.entries(c.resumo).filter(([k, v]) => v !== null && v !== "" && k !== "vlTotal" && (ROTULO_RESUMO[k] || k.startsWith("vl"))).map(([k, v]) => (
                    <div key={k} style={{ fontSize: 12 }}>
                      <div style={{ color: "#6b7280" }}>{ROTULO_RESUMO[k] ?? k}</div>
                      <div style={{ fontWeight: 600, color: k === "vlDesconto" && Number(v) < 0 ? "#b91c1c" : "#1f2937" }}>{valorResumo(k, v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {equipes.length > 0 && (
            <div style={pgCard}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Validação por equipe — {data.parcela_rotulo}</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["Equipe", "INE", "CNES", "Tipo", plano === 10 ? "eSF/eAP vinculada" : "Composição", "Pagamento", "Situação"].map(h => <th key={h} style={pgTh}>{h}</th>)}</tr></thead>
                  <tbody>{equipes.map(e => (
                    <tr key={`${e.co_componente}-${e.ine}`}>
                      <td style={{ ...pgTd, fontWeight: 600 }}>{e.equipe ?? "—"}</td>
                      <td style={pgTd}>{e.ine}</td>
                      <td style={pgTd}>{e.cnes ?? "—"}</td>
                      <td style={pgTd}>{e.tipo ?? "—"}{e.detalhe.dsSubTipoEquipe ? ` · ${e.detalhe.dsSubTipoEquipe}` : ""}{e.detalhe.modalidade ? ` · modalidade ${e.detalhe.modalidade}` : ""}</td>
                      <td style={pgTd}>{plano === 10 ? (e.equipe_vinculada ?? e.ine_vinculada ?? "—") : (e.detalhe.composicao ?? "—")}</td>
                      <td style={pgTd}>{e.st_pagamento ?? "—"}</td>
                      <td style={{ ...pgTd, color: e.ok ? "#15803d" : "#b91c1c", fontWeight: 600 }}>
                        {e.ok ? "✓ Sem pendência" : e.pendencias.map(p => `${p.rotulo}: ${p.situacao}`).join(" · ")}
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
          <div style={{ fontSize: 11, color: "#6b7280" }}>Fonte: {data.fonte}. Valores e situações exatamente como publicados pelo Ministério da Saúde — o ERSUS360 não recalcula.</div>
        </>
      )}
    </div>
  );
}

// ── Aba: Diagnóstico / Cobertura da Atenção Básica ───────────────────────────

function AbaDiagnosticoCobertura() {
  const PARCELAS = [
    { val: "202611", label: "SET/2026 (11ª parcela)" },
    { val: "202610", label: "AGO/2026 (10ª parcela)" },
    { val: "202609", label: "JUL/2026 (9ª parcela)"  },
    { val: "202608", label: "JUN/2026 (8ª parcela)"  },
    { val: "202607", label: "MAI/2026 (7ª parcela)"  },
    { val: "202606", label: "ABR/2026 (6ª parcela)"  },
    { val: "202605", label: "MAR/2026 (5ª parcela)"  },
    { val: "202604", label: "FEV/2026 (4ª parcela)"  },
    { val: "202603", label: "JAN/2026 (3ª parcela)"  },
  ];
  const [parcela, setParcela] = useState("202611");

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["siaps-diag-cobertura", parcela],
    queryFn: () => apiGet(`/api/siaps/diagnostico-cobertura?parcela=${parcela}`) as Promise<any>,
    staleTime: 300_000,
  });

  const BRL_local = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

  function CardPrograma({ titulo, cor, items, scraped, fonteLabel }: {
    titulo: string; cor: string;
    items: { label: string; val: string | number; destaque?: boolean }[];
    scraped?: boolean;
    fonteLabel?: string;
  }) {
    return (
      <div style={{ border: `1px solid ${cor}33`, borderTop: `3px solid ${cor}`, borderRadius: 10, padding: "14px 18px", background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: cor }}>{titulo}</div>
          {scraped !== undefined && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
              background: scraped ? "#f0fdf4" : "#fffbeb",
              color: scraped ? "#16a34a" : "#d97706",
            }}>
              {scraped ? (fonteLabel || "✓ e-Gestor") : "⏳ Aguard. e-Gestor"}
            </span>
          )}
        </div>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < items.length - 1 ? "1px solid #f3f4f6" : "none" }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{it.label}</span>
            <span style={{ fontSize: it.destaque ? 16 : 13, fontWeight: it.destaque ? 800 : 600, color: it.destaque ? cor : "#1e293b", fontVariantNumeric: "tabular-nums" }}>{it.val}</span>
          </div>
        ))}
      </div>
    );
  }

  function BadgeDiag({ sev }: { sev: string }) {
    const map: Record<string, { bg: string; cor: string; label: string }> = {
      ok:      { bg: "#f0fdf4", cor: "#16a34a", label: "✓ OK" },
      info:    { bg: "#eff6ff", cor: "#1d4ed8", label: "ℹ Info" },
      alerta:  { bg: "#fffbeb", cor: "#d97706", label: "⚠ Alerta" },
      critico: { bg: "#fff7f7", cor: "#dc2626", label: "✗ Crítico" },
    };
    const s = map[sev] ?? map.info;
    return (
      <span style={{ background: s.bg, color: s.cor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, flexShrink: 0 }}>{s.label}</span>
    );
  }

  const plLabel = PARCELAS.find(p => p.val === parcela)?.label ?? parcela;

  if (isLoading || isFetching) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 16 }}>
        <RefreshCw size={28} color="#1d4ed8" style={{ animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 14, color: "#6b7280" }}>Consultando API e-Gestor APS…</div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (data?.situacao_dado === "nao_disponivel") {
    return (
      <div>
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "28px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0369a1", marginBottom: 8 }}>
            Diagnóstico / Cobertura
          </div>
          <div style={{ fontSize: 13, color: "#374151", maxWidth: 480, margin: "0 auto 20px" }}>
            {data.nota ?? "Integração com e-Gestor APS ainda não configurada."}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => refetch()} style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={13} /> Atualizar
            </button>
          </div>
        </div>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#1e40af", marginTop: 12 }}>
          <strong>Nota:</strong> Esta aba consulta a API pública do e-Gestor APS (relatorioaps-prd.saude.gov.br). Configure <code>EGESTOR_TOKEN</code> no Railway para ativar a integração em tempo real.
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "28px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0369a1", marginBottom: 8 }}>Diagnóstico / Cobertura</div>
          <div style={{ fontSize: 13, color: "#374151", maxWidth: 480, margin: "0 auto 20px" }}>
            Dados não disponíveis no momento. A API do Ministério da Saúde pode estar temporariamente indisponível.
          </div>
          <button onClick={() => refetch()} style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, margin: "0 auto" }}>
            <RefreshCw size={13} /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const _MAPA_PARCELA: Record<string, string> = {
    "202601":"NOV/2025","202602":"DEZ/2025","202603":"JAN/2026","202604":"FEV/2026",
    "202605":"MAR/2026","202606":"ABR/2026","202607":"MAI/2026","202608":"JUN/2026",
    "202609":"JUL/2026","202610":"AGO/2026","202611":"SET/2026","202612":"OUT/2026",
  };

  const esf    = data.esf    ?? {};
  const eap    = data.eap    ?? {};
  const emulti = data.emulti ?? {};
  const esb    = data.esb    ?? {};
  const acs    = data.acs    ?? {};
  const esfrb  = data.esfrb  ?? {};
  const esfr   = data.esfr   ?? {};
  const micro  = data.microscopista ?? {};
  const perCap = data.per_capita ?? {};
  const tetos  = data.tetos  ?? {};
  const diags: any[] = data.diagnosticos ?? [];

  const sevOrder: Record<string, number> = { critico: 0, alerta: 1, info: 2, ok: 3 };
  const diagsOrdenados = [...diags].sort((a, b) => (sevOrder[a.severidade] ?? 9) - (sevOrder[b.severidade] ?? 9));

  const criticos = diags.filter(d => d.severidade === "critico").length;
  const alertas  = diags.filter(d => d.severidade === "alerta").length;

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1d4ed8", margin: "0 0 4px" }}>
            Diagnóstico / Cobertura da Atenção Básica
          </h2>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ background: "#e0f2fe", color: "#0369a1", fontWeight: 700, padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>
              {data.municipio}/{data.uf} · IBGE {data.ibge}
            </span>
            <span style={{ background: "#fef3c7", color: "#92400e", fontWeight: 700, padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>
              {data.competencia} · {data.parcela}ª parcela
            </span>
            {data.nu_comp_cnes && (
              <span style={{ background: "#f3f4f6", color: "#6b7280", padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>
                Comp. CNES: {data.nu_comp_cnes}
              </span>
            )}
            <span style={{ background: "#f0fdf4", color: "#15803d", padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>
              {data.fonte === "scnes_verificado" ? "Fonte: SCNES/DATASUS (verificado)" : "Fonte: e-Gestor APS (dados oficiais)"}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={parcela} onChange={e => setParcela(e.target.value)}
            style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "7px 10px", fontSize: 12, background: "#fff", cursor: "pointer" }}>
            {PARCELAS.map(p => <option key={p.val} value={p.val}>{p.label}</option>)}
          </select>
          <button onClick={() => refetch()} style={{ display: "flex", alignItems: "center", gap: 5, background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 6, padding: "7px 14px", cursor: "pointer", fontSize: 12 }}>
            <RefreshCw size={13} /> Atualizar
          </button>
          <button
            onClick={async () => {
              try {
                await apiGet("/api/sync/atualizar-tudo", { method: "POST" } as any);
                setTimeout(() => refetch(), 3000);
              } catch { /* ignore */ }
            }}
            title="Atualiza SIAPS, e-Gestor, CVAT e Diagnóstico automaticamente"
            style={{ display: "flex", alignItems: "center", gap: 5, background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, padding: "7px 14px", cursor: "pointer", fontSize: 12 }}>
            ⚡ Atualizar Tudo
          </button>
        </div>
      </div>

      {/* KPIs gerais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "eSF credenciadas",  val: esf.qt_credenciadas ?? tetos.esf ?? 0,                                         cor: "#1d4ed8" },
          { label: "Score médio SCNES", val: data.score_medio_scnes != null ? `${data.score_medio_scnes} pts` : "—",          cor: "#16a34a" },
          { label: "Vinculadas CVAT",   val: data.total_vinculadas_cvat != null ? (data.total_vinculadas_cvat as number).toLocaleString("pt-BR") : "—", cor: "#7c3aed" },
          { label: "Pendências SCNES",  val: data.pendencias_total != null ? `${data.pendencias_criticas} críticas / ${data.pendencias_total}` : "—",   cor: "#dc2626" },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", border: `1px solid ${k.cor}22`, borderTop: `3px solid ${k.cor}`, borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
            <div style={{ fontSize: typeof k.val === "string" && k.val.includes("/") ? 15 : 22, fontWeight: 800, color: k.cor }}>{k.val}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>
      {/* Aviso quando pagamento não foi scrapeado */}
      {!(esf as any)?._scraped && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 16px", fontSize: 12, color: "#92400e", marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>⚠</span>
          <span>
            <strong>Valores de pagamento indisponíveis:</strong> a página pública do e-Gestor APS não retornou dados nesta consulta.
            Os tetos de credenciamento exibidos nos cards são confirmados via SCNES (Set/2026).
            <a href="https://relatorioaps.saude.gov.br/gerenciaaps/pagamento" target="_blank" rel="noreferrer"
               style={{ marginLeft: 8, color: "#1d4ed8", fontWeight: 600 }}>Acessar e-Gestor APS ↗</a>
          </span>
        </div>
      )}

      {/* Diagnósticos */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Diagnóstico Automático — {plLabel}</div>
          <div style={{ display: "flex", gap: 6 }}>
            {criticos > 0 && <span style={{ background: "#fff7f7", color: "#dc2626", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 10 }}>{criticos} crítico{criticos > 1 ? "s" : ""}</span>}
            {alertas  > 0 && <span style={{ background: "#fffbeb", color: "#d97706", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 10 }}>{alertas} alerta{alertas > 1 ? "s" : ""}</span>}
            {criticos === 0 && alertas === 0 && <span style={{ background: "#f0fdf4", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 10 }}>✓ Sem pendências</span>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {diagsOrdenados.map((d, i) => (
            <div key={i} style={{
              display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 14px",
              borderRadius: 8, border: "1px solid #f3f4f6",
              background: d.severidade === "critico" ? "#fff7f7" : d.severidade === "alerta" ? "#fffbeb" : d.severidade === "ok" ? "#f0fdf4" : "#f8fafc",
            }}>
              <BadgeDiag sev={d.severidade} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>{d.titulo}</div>
                <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{d.texto}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score por Equipe — tabela por equipe SCNES */}
      {data.equipes_scnes?.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
              Score por Equipe — {data._meta?.scnes_varredura ?? "Set/2026"}
            </div>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Fonte: SCNES/DATASUS · Portaria GM/MS 3.493/2024</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "7px 10px", textAlign: "left",   color: "#374151", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>Equipe</th>
                  <th style={{ padding: "7px 10px", textAlign: "center", color: "#374151", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>Score / Nível</th>
                  <th style={{ padding: "7px 10px", textAlign: "right",  color: "#374151", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>Vinculadas CVAT</th>
                  <th style={{ padding: "7px 10px", textAlign: "left",   color: "#374151", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>Pendências SCNES</th>
                </tr>
              </thead>
              <tbody>
                {(data.equipes_scnes as any[]).map((eq: any, i: number) => {
                  const criticos = eq.pendencias?.filter((p: any) => p.sev === "critico") ?? [];
                  const alertas  = eq.pendencias?.filter((p: any) => p.sev === "alerta")  ?? [];
                  const scoreOk  = eq.score >= 90;
                  const scoreWarn = eq.score >= 70 && eq.score < 90;
                  const scoreCrit = eq.score < 70;
                  const scoreBg  = scoreOk ? "#f0fdf4" : scoreWarn ? "#fffbeb" : "#fff7f7";
                  const scoreCor = scoreOk ? "#15803d" : scoreWarn ? "#b45309" : "#dc2626";
                  return (
                    <tr key={eq.nome} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600, color: "#1e293b", borderBottom: "1px solid #f3f4f6" }}>{eq.nome}</td>
                      <td style={{ padding: "8px 10px", textAlign: "center", borderBottom: "1px solid #f3f4f6" }}>
                        <span style={{ background: scoreBg, color: scoreCor, fontWeight: 700, padding: "2px 10px", borderRadius: 12, fontSize: 11, display: "inline-block", minWidth: 90, fontVariantNumeric: "tabular-nums" }}>
                          {eq.score} pts — {eq.nivel}
                        </span>
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: eq.vinculadas > 0 ? "#1e293b" : "#dc2626", borderBottom: "1px solid #f3f4f6" }}>
                        {eq.vinculadas > 0 ? eq.vinculadas.toLocaleString("pt-BR") : "0 — sem vínculo"}
                      </td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f3f4f6" }}>
                        {eq.pendencias?.length === 0
                          ? <span style={{ color: "#16a34a", fontSize: 11 }}>✓ OK</span>
                          : <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              {criticos.map((p: any, j: number) => (
                                <span key={j} style={{ background: "#fff7f7", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 6, display: "inline-block" }}>✗ {p.desc}</span>
                              ))}
                              {alertas.map((p: any, j: number) => (
                                <span key={j} style={{ background: "#fffbeb", color: "#d97706", fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 6, display: "inline-block" }}>⚠ {p.desc}</span>
                              ))}
                            </div>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f0f9ff", borderTop: "2px solid #bae6fd" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 700, color: "#0369a1" }}>{(data.equipes_scnes as any[]).length} equipes</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: "#0369a1" }}>Média: {data.score_medio_scnes} pts</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#0369a1", fontVariantNumeric: "tabular-nums" }}>
                    {data.total_vinculadas_cvat?.toLocaleString("pt-BR")} total
                  </td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: "#6b7280" }}>
                    {(data.equipes_scnes as any[]).reduce((s: number, e: any) => s + (e.pendencias?.length ?? 0), 0)} pendência(s) ativas
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Histórico de Incentivos */}
      {data.historico_incentivos?.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>
            Histórico de Incentivos Totais — Apuí/AM
            <span style={{ fontSize: 11, fontWeight: 400, color: "#6b7280", marginLeft: 8 }}>Fonte: e-Gestor APS · Todas as parcelas disponíveis</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", color: "#374151", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>Competência</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", color: "#374151", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>Parcela</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", color: "#374151", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>Incentivo Total</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", color: "#374151", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>Var. Mês Anterior</th>
                </tr>
              </thead>
              <tbody>
                {[...data.historico_incentivos].reverse().map((h: any, i: number, arr: any[]) => {
                  const prev = arr[i + 1];
                  const diff = prev ? h.total - prev.total : null;
                  const isSelected = _MAPA_PARCELA[parcela] === h.competencia;
                  return (
                    <tr key={h.parcela_code} style={{ background: isSelected ? "#eff6ff" : i % 2 === 0 ? "#fff" : "#f9fafb", borderLeft: isSelected ? "3px solid #1d4ed8" : "3px solid transparent" }}>
                      <td style={{ padding: "8px 12px", fontWeight: isSelected ? 700 : 500, color: isSelected ? "#1d4ed8" : "#1e293b" }}>{h.competencia}</td>
                      <td style={{ padding: "8px 12px", textAlign: "center", color: "#6b7280" }}>{h.parcela}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#1e293b" }}>
                        {h.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: diff === null ? "#9ca3af" : diff >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                        {diff === null ? "—" : `${diff >= 0 ? "▲" : "▼"} ${Math.abs(diff).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f0f9ff", borderTop: "2px solid #bae6fd" }}>
                  <td colSpan={2} style={{ padding: "8px 12px", fontWeight: 700, color: "#0369a1" }}>Acumulado {data.historico_incentivos.length} parcelas</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 800, color: "#0369a1", fontVariantNumeric: "tabular-nums" }}>
                    {data.historico_incentivos.reduce((s: number, h: any) => s + h.total, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Cards por programa */}
      {/* fonteLabel dinâmico: usa competencia retornada pela API (ex: "JUL/2026") */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 20 }}>
        <CardPrograma titulo="eSF — Equipes de Saúde da Família" cor="#1d4ed8" scraped={(esf as any)._scraped} fonteLabel={data.competencia ? `✓ Verificado ${data.competencia}` : "✓ e-Gestor APS"} items={[
          { label: "Teto",                        val: (esf as any).qt_teto ?? tetos.esf ?? 0 },
          { label: "Credenciadas",                val: esf.qt_credenciadas ?? 0 },
          { label: "Homologadas",                 val: esf.qt_homologadas ?? 0 },
          { label: "Pagas",                       val: esf.qt_pagas ?? 0 },
          { label: "IED",                         val: (esf as any).ied || data.faixa_equidade_esf || "—" },
          { label: "Class. Qualidade",            val: (esf as any).classificacao_qualidade || data.classificacao_qualidade_esf || "—" },
          { label: "Class. Vínculo",              val: (esf as any).classificacao_vinculo || data.classificacao_vinculo_esf || "—" },
          { label: "Componente Equidade",         val: BRL_local((esf as any).vl_equidade ?? esf.vl_fixo ?? 0) },
          { label: "Qualidade",                   val: BRL_local(esf.vl_qualidade ?? 0) },
          { label: "Vínculo e Acompanhamento",    val: BRL_local(esf.vl_vinculo ?? 0) },
          { label: "Ajuste",                      val: BRL_local((esf as any).vl_ajuste ?? 0) },
          { label: "Desconto",                    val: BRL_local((esf as any).vl_desconto ?? 0) },
          { label: "Total eSF",                   val: BRL_local(esf.vl_total_bruto ?? 0), destaque: true },
        ]} />

        <CardPrograma titulo="eMulti — Equipes Multiprofissionais" cor="#0891b2" scraped={(emulti as any)._scraped} fonteLabel={data.competencia ? `✓ Verificado ${data.competencia}` : "✓ e-Gestor APS"} items={[
          { label: "Teto",                  val: tetos.emulti ?? 1 },
          { label: "Credenciadas",          val: emulti.qt_credenciadas ?? 1 },
          { label: "eMulti Estratégica",    val: (emulti as any).qt_estrategica ?? 1 },
          { label: "eMulti Ampliada",       val: (emulti as any).qt_ampliada ?? 0 },
          { label: "eMulti Complementar",   val: (emulti as any).qt_complementar ?? 0 },
          { label: "Pagas",                 val: emulti.qt_pagas ?? 1 },
          { label: "Vl. Custeio",          val: BRL_local(emulti.vl_custeio ?? 12_000) },
          { label: "Vl. Qualidade",        val: BRL_local(emulti.vl_qualidade ?? 2_250) },
          { label: "Vl. Atend. Remoto",    val: BRL_local(emulti.vl_atend_remoto ?? 0) },
          { label: "Total eMulti",         val: BRL_local(emulti.vl_total ?? 14_250), destaque: true },
        ]} />

        <CardPrograma titulo="eSB — Saúde Bucal 40h · UOM · LRPD" cor="#7c3aed" scraped={(esb as any)._scraped} fonteLabel={data.competencia ? `✓ Verificado ${data.competencia}` : "✓ e-Gestor APS"} items={[
          { label: "Teto",                 val: tetos.esb ?? 9 },
          { label: "Credenciadas 40h",     val: esb.qt_40h_credenciadas ?? 9 },
          { label: "Homologadas 40h",      val: esb.qt_40h_homologadas ?? 9 },
          { label: "Pagas (Modal. I)",     val: esb.qt_40h_pagas_modal_i ?? 9 },
          { label: "Pagas (Modal. II)",    val: esb.qt_40h_pagas_modal_ii ?? 0 },
          { label: "Vl. eSB 40h (custeio)",val: BRL_local(esb.vl_esb_40h ?? 54_189) },
          { label: "Vl. Qualidade 40h",   val: BRL_local(esb.vl_qualidade_40h ?? 30_000) },
          { label: "UOM (1 unidade)",      val: BRL_local((esb as any).vl_uom ?? 9_360) },
          { label: "LRPD Municipal",       val: BRL_local(esb.vl_lrpd_municipal ?? 11_250) },
          { label: "Total eSB",           val: BRL_local(esb.vl_total_sb_calculado ?? 104_799), destaque: true },
        ]} />

        <CardPrograma titulo="ACS — Agentes Comunitários de Saúde" cor="#16a34a" scraped={(acs as any)._scraped} fonteLabel={data.competencia ? `✓ Verificado ${data.competencia}` : "✓ e-Gestor APS"} items={[
          { label: "Teto ACS",             val: acs.qt_teto ?? tetos.acs ?? 65 },
          { label: "Credenciados",         val: acs.qt_direto_credenciado ?? 67 },
          { label: "Pagos",                val: acs.qt_direto_pago ?? 66 },
          { label: "Vl. Referência",      val: BRL_local((acs as any).vl_ref_custeio ?? 3_242) },
          { label: "Total ACS",           val: BRL_local(acs.vl_total ?? acs.vl_direto ?? 213_972), destaque: true },
        ]} />

        <CardPrograma titulo="eSFR — Saúde da Família Ribeirinha" cor="#d97706" scraped={(esfr as any)._scraped} fonteLabel={data.competencia ? `✓ Verificado ${data.competencia}` : "✓ e-Gestor APS"} items={[
          { label: "Credenciadas",         val: (esfr as any).qt_credenciadas ?? 1 },
          { label: "Homologadas",          val: (esfr as any).qt_homologadas ?? 1 },
          { label: "Pagas",                val: (esfr as any).qt_pagas ?? 1 },
          { label: "Vl. Custeio",         val: BRL_local((esfr as any).vl_custeio ?? 24_000) },
          { label: "Vl. CVAT",            val: BRL_local((esfr as any).vl_vinculo ?? 6_000) },
          { label: "Total eSFR",          val: BRL_local((esfr as any).vl_total ?? 30_000), destaque: true },
        ]} />

        <CardPrograma titulo="Microscopista" cor="#64748b" scraped={(micro as any)._scraped} fonteLabel={data.competencia ? `✓ Verificado ${data.competencia}` : "✓ e-Gestor APS"} items={[
          { label: "Credenciados",         val: (micro as any).qt_credenciados ?? 5 },
          { label: "Pagos",                val: (micro as any).qt_pagos ?? 5 },
          { label: "Vl. Referência",      val: BRL_local((micro as any).vl_ref_custeio ?? 3_242) },
          { label: "Total Microscopista", val: BRL_local((micro as any).vl_total ?? 16_210), destaque: true },
        ]} />

        <CardPrograma titulo="eAP · Per Capita · PSE" cor="#6b7280" items={[
          { label: "eAP credenciadas",     val: eap.qt_credenciadas ?? 0 },
          { label: "eAP pagas",            val: eap.qt_pagas ?? 0 },
          { label: "Total eAP",           val: BRL_local(eap.vl_total_bruto ?? 0) },
          { label: "Teto eAP",            val: tetos.eap ?? 0 },
          { label: "Per capita (pop.)",   val: (data.populacao ?? 0).toLocaleString("pt-BR") },
          { label: "Vl. Per capita",      val: BRL_local(perCap.vl_pagamento ?? 0) },
          { label: "Faixa equidade eSF",  val: data.faixa_equidade_esf ?? "—" },
          { label: "Classif. vínculo eSF",val: data.classificacao_vinculo_esf ?? "—" },
          { label: "Classif. qualidade",  val: data.classificacao_qualidade_esf ?? "—" },
          { label: "Total calculado",     val: BRL_local(data.total_calculado), destaque: true },
        ]} />
      </div>

      {/* Cruzamento SIAPS × Pagamento */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "14px 18px", fontSize: 12, color: "#1e40af", marginBottom: 16 }}>
        <strong>Cruzamento SIAPS × e-Gestor:</strong> Os dados de equipes credenciadas e homologadas nesta aba provêm do relatório de pagamento do e-Gestor APS. Compare os totais com a aba "Abrangência Municipal" (SIAPS autenticado) para identificar divergências entre a base de cálculo do pagamento e o registro no CNES.
      </div>

      {/* Rodapé fonte */}
      <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#6b7280", display: "flex", gap: 8, alignItems: "center" }}>
        <Info size={13} />
        <span>
          {data.fonte === "scnes_verificado"
            ? <>Fonte: <strong>SCNES/DATASUS</strong> — varredura {data._meta?.scnes_varredura ?? "Set/2026"} · {data._meta?.nota ?? ""}</>
            : <>Fonte: <strong>e-Gestor APS</strong> — relatorioaps-prd.saude.gov.br · tipoRelatorio=COMPLETO</>
          } · Coletado em {data.coletado_em ? new Date(data.coletado_em).toLocaleString("pt-BR") : "—"} · Competência {data.competencia} · IBGE {data.ibge}
        </span>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

type Aba = "abrangencia" | "vinculo" | "qualidade" | "boas_praticas" | "quadrimestre" | "analise_indicador" | "rel_pagamento" | "diag_cobertura";

export default function SiapsEgestor() {
  // a captura assistida do SIAPS chega pelo endereço (#captura-siaps=…) e abre direto na aba Qualidade
  const [aba, setAba] = useState<Aba>(() => (capturaNoEndereco() ? "qualidade" : "vinculo"));

  const { data: dashData }  = useQuery({ queryKey: ["siaps-dashboard"],  queryFn: () => apiGet("/api/siaps/dashboard") as Promise<any> });
  const { data: abrangData } = useQuery({ queryKey: ["siaps-abrang"],    queryFn: () => apiGet("/api/siaps/abrangencia") as Promise<any> });
  const { data: vinculo }    = useQuery({ queryKey: ["siaps-vinculo"],   queryFn: () => apiGet("/api/siaps/vinculo-acompanhamento") as Promise<any>, enabled: aba === "vinculo" });
  const { data: qualidade }  = useQuery({ queryKey: ["siaps-qualidade"], queryFn: () => apiGet("/api/siaps/qualidade") as Promise<any>, enabled: aba === "qualidade" });
  const { data: boas }       = useQuery({ queryKey: ["siaps-boas"],      queryFn: () => apiGet("/api/siaps/boas-praticas") as Promise<any>, enabled: aba === "boas_praticas" });

  const ABAS: { id: Aba; label: string }[] = [
    { id: "abrangencia",        label: "Abrangência Municipal" },
    { id: "vinculo",            label: "Vínculo e Acompanhamento" },
    { id: "qualidade",          label: "Componente Qualidade" },
    { id: "boas_praticas",      label: "Boas Práticas" },
    { id: "quadrimestre",       label: "Avaliação Quadrimestre" },
    { id: "analise_indicador",  label: "📊 Análise do Indicador" },
    { id: "rel_pagamento",      label: "💳 Relatório de Pagamento (e-Gestor)" },
    { id: "diag_cobertura",    label: "🩺 Diagnóstico / Cobertura" },
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
            {dashData.fonte === "siaps_relatorio_importado"
              ? `Relatório SIAPS importado${dashData.dado_preliminar ? " · dado preliminar" : ""}`
              : "Referência Abr/2026 · importe os relatórios em Relatórios do SIAPS"}
          </span>
        </div>
      )}

      <div style={{ padding: "24px 24px 32px", maxWidth: 1100, margin: "0 auto" }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "2px solid #e4e7ec", flexWrap: "wrap" }}>
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} style={{
              padding: "9px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13,
              borderBottom: aba === a.id ? "2px solid #1d4ed8" : "2px solid transparent",
              color: aba === a.id ? "#1d4ed8" : "#6b7280",
              fontWeight: aba === a.id ? 700 : 400, marginBottom: -2, whiteSpace: "nowrap",
            }}>{a.label}</button>
          ))}
        </div>

        {aba === "abrangencia"       && <AbaAbrangencia data={abrangData} />}
        {aba === "vinculo"           && <AbaVinculo data={vinculo} />}
        {aba === "qualidade"         && <AbaQualidade data={qualidade} />}
        {aba === "boas_praticas"     && <AbaBoasPraticas data={boas} />}
        {aba === "quadrimestre"      && <AbaQuadrimestre dashData={dashData} />}
        {aba === "analise_indicador" && <AbaAnaliseIndicador />}
        {aba === "rel_pagamento"     && <AbaRelatorioPagamento />}
        {aba === "diag_cobertura"   && <AbaDiagnosticoCobertura />}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "16px 0", fontSize: 11, color: "#9ca3af", borderTop: "1px solid #e5e7eb", marginTop: 24 }}>
        Ministério da Saúde | SAPS @2026 | versão: 1.8.2 (dados integrados ERSUS 360)
      </div>
    </div>
  );
}
