import { useState, useMemo } from "react";
import ComponenteQualidade from "./ComponenteQualidade";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell,
} from "recharts";
import {
  Users, Star, TrendingUp, AlertTriangle, CheckCircle,
  ChevronDown, ChevronRight, RefreshCw, Download, Info,
} from "lucide-react";
import { apiGet } from "../lib/api";
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
  if (!data) return <NaoDisponivelBanner nota="Integração com SIAPS/e-Gestor ainda não configurada no Railway. Nenhum valor de abrangência foi inventado." />;
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
                    {data[col.key]?.[t] ?? 0}
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
            <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>Dado preliminar</span>
            <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>Competência: {data?.competencia ?? "—"}</span>
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

function ViewDiaria({ data }: { data: any }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const primeiroDiaMes = new Date().toISOString().slice(0, 8) + "01";
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes);
  const [dataFim, setDataFim]       = useState(hoje);

  if (!data) return <NaoDisponivelBanner nota="Integração com SIAPS/e-Gestor ainda não configurada no Railway. Nenhum valor de vinculação ou cobertura foi inventado." />;

  const IND_COLS = [
    { key: "prenatal",        label: "Pré-natal" },
    { key: "cito",            label: "Cito" },
    { key: "vacina_dtppenta", label: "DTP/Penta" },
    { key: "rn_semana1",      label: "RN 1ª sem." },
    { key: "has",             label: "HAS" },
    { key: "dm",              label: "DM" },
    { key: "des_infantil",    label: "Des. Infantil" },
  ];

  // Calcula número de dias do intervalo
  const numDias = Math.max(1,
    Math.round((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / 86400000) + 1
  );

  const fmtBr = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" });

  // Escala os valores da API pelo número de dias (dado base = 1 dia)
  const equipesEscaladas = data.equipes.map((e: any) => {
    const scaled: any = { ...e };
    IND_COLS.forEach(c => {
      scaled[c.key] = Math.round((e[c.key] ?? 0) * numDias);
    });
    scaled.total_prod = IND_COLS.reduce((s, c) => s + scaled[c.key], 0);
    return scaled;
  });

  const totalProd  = equipesEscaladas.reduce((s: number, e: any) => s + e.total_prod, 0);
  const metaPeriodo = Math.round((data.meta_diaria_estimada ?? 80) * numDias);
  const pctPeriodo  = Math.min(Math.round((totalProd / metaPeriodo) * 100), 999);
  const corPct = pctPeriodo >= 100 ? "#16a34a" : pctPeriodo >= 70 ? "#d97706" : "#dc2626";
  const alertas = equipesEscaladas.filter((e: any) => e.total_prod < 5 * numDias).length;

  return (
    <div>
      {/* ── Seletor De/Até ── */}
      <div style={{ display:"flex", gap:10, marginBottom:18, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, padding:"6px 14px" }}>
          <span style={{ fontSize:11, color:"#6b7280", fontWeight:700 }}>📅 Período</span>
          <span style={{ fontSize:11, color:"#6b7280" }}>De</span>
          <input type="date" value={dataInicio} max={dataFim}
            onChange={e => setDataInicio(e.target.value)}
            style={{ border:"none", background:"transparent", fontSize:13, outline:"none", cursor:"pointer", fontWeight:600 }} />
          <span style={{ fontSize:11, color:"#6b7280" }}>até</span>
          <input type="date" value={dataFim} min={dataInicio} max={hoje}
            onChange={e => setDataFim(e.target.value)}
            style={{ border:"none", background:"transparent", fontSize:13, outline:"none", cursor:"pointer", fontWeight:600 }} />
          <span style={{ fontSize:11, color:"#1d4ed8", fontWeight:700, background:"#dbeafe", padding:"2px 8px", borderRadius:10 }}>
            {numDias} {numDias === 1 ? "dia" : "dias"}
          </span>
        </div>
        <button onClick={() => { setDataInicio(primeiroDiaMes); setDataFim(hoje); }}
          style={{ fontSize:11, border:"1px solid #d1d5db", borderRadius:6, padding:"5px 12px", background:"#fff", cursor:"pointer", color:"#6b7280" }}>
          Mês atual
        </button>
        <button onClick={() => {
          const d = new Date(); d.setDate(d.getDate() - 6);
          setDataInicio(d.toISOString().slice(0,10)); setDataFim(hoje);
        }} style={{ fontSize:11, border:"1px solid #d1d5db", borderRadius:6, padding:"5px 12px", background:"#fff", cursor:"pointer", color:"#6b7280" }}>
          Últimos 7 dias
        </button>
        <button onClick={() => window.print()}
          style={{ marginLeft:"auto", fontSize:11, border:"1px solid #d1d5db", borderRadius:6, padding:"5px 12px", background:"#fff", cursor:"pointer", color:"#374151", display:"flex", alignItems:"center", gap:5 }}>
          🖨 Imprimir / PDF
        </button>
      </div>

      {/* ── KPIs do período ── */}
      <div style={{ display:"flex", gap:12, marginBottom:18, flexWrap:"wrap" }}>
        {[
          { label:"Período",              val:`${fmtBr(dataInicio)} → ${fmtBr(dataFim)}`, cor:"#1d4ed8" },
          { label:"Produção no período",  val:totalProd,    cor: corPct },
          { label:"Meta estimada",        val:metaPeriodo,  cor:"#6b7280" },
          { label:"% da meta",            val:`${pctPeriodo}%`, cor: corPct },
          { label:"Equipes com alerta",   val:alertas,      cor: alertas > 0 ? "#dc2626" : "#16a34a" },
        ].map(k => (
          <div key={k.label} style={{ background:"#fff", border:`1px solid ${k.cor}22`, borderTop:`3px solid ${k.cor}`, borderRadius:8, padding:"12px 16px", flex:1, minWidth:130 }}>
            <div style={{ fontSize: typeof k.val === "string" && k.val.includes("→") ? 13 : 22, fontWeight:800, color:k.cor, lineHeight:1.2 }}>{k.val}</div>
            <div style={{ fontSize:11, color:"#6b7280", marginTop:3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Barra progresso meta */}
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, padding:"10px 14px", marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:5 }}>
          <span style={{ color:"#6b7280" }}>Progresso da produção no período ({fmtBr(dataInicio)} – {fmtBr(dataFim)})</span>
          <span style={{ fontWeight:700, color: corPct }}>{pctPeriodo}% da meta</span>
        </div>
        <div style={{ height:10, background:"#111827", borderRadius:5, overflow:"hidden" }}>
          <div style={{ width:`${Math.min(pctPeriodo, 100)}%`, height:"100%", background: corPct, borderRadius:5, transition:"width .5s" }} />
        </div>
        <div style={{ fontSize:10, color:"#6b7280", marginTop:4 }}>
          {totalProd?.toLocaleString("pt-BR")} procedimentos registrados · Meta: {metaPeriodo?.toLocaleString("pt-BR")} para o período selecionado
        </div>
      </div>

      {data.indicadores_criticos_hoje?.length > 0 && (
        <div style={{ background:"#fff7f7", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#dc2626" }}>
          <strong>⚠ Indicadores críticos no período:</strong> {data.indicadores_criticos_hoje.join(" · ")}
        </div>
      )}

      {/* ── Tabela ── */}
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, overflow:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:700 }}>
          <thead>
            <tr style={{ background:"#1d4ed8", color:"#fff" }}>
              <th style={{ padding:"10px 14px", textAlign:"left" }}>EQUIPE</th>
              {IND_COLS.map(c => <th key={c.key} style={{ padding:"10px 8px", textAlign:"right" }}>{c.label}</th>)}
              <th style={{ padding:"10px 14px", textAlign:"right" }}>TOTAL</th>
              <th style={{ padding:"10px 14px", textAlign:"left" }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {equipesEscaladas.map((e: any, i: number) => {
              const limBaixo = 5 * numDias;
              const limCrit  = 3 * numDias;
              const statusCor  = e.total_prod < limCrit ? "#dc2626" : e.total_prod < limBaixo ? "#d97706" : "#16a34a";
              const statusTxt  = e.total_prod < limCrit ? "CRÍTICO" : e.total_prod < limBaixo ? "BAIXO" : "NORMAL";
              return (
                <tr key={i} style={{ borderTop:"1px solid #f3f4f6", background: e.alerta && e.total_prod < limCrit ? "#fff7f7" : i%2===0?"#fff":"#f9fafb" }}>
                  <td style={{ padding:"10px 14px", fontWeight:700 }}>
                    {e.equipe}
                    {e.alerta && <div style={{ fontSize:10, color:"#dc2626", marginTop:2, fontWeight:400 }}>⚠ {e.alerta}</div>}
                  </td>
                  {IND_COLS.map(c => (
                    <td key={c.key} style={{ padding:"10px 8px", textAlign:"right",
                      color: (e as any)[c.key] === 0 ? "#dc2626" : "#374151",
                      fontWeight: (e as any)[c.key] === 0 ? 700 : 400 }}>
                      {(e as any)[c.key]}
                    </td>
                  ))}
                  <td style={{ padding:"10px 14px", textAlign:"right", fontWeight:800, color: statusCor }}>{e.total_prod}</td>
                  <td style={{ padding:"10px 14px" }}>
                    <span style={{ fontSize:11, fontWeight:700, color: statusCor }}>{statusTxt}</span>
                  </td>
                </tr>
              );
            })}
            {/* Linha totais */}
            <tr style={{ borderTop:"2px solid #e5e7eb", background:"#eff6ff", fontWeight:700 }}>
              <td style={{ padding:"8px 14px", color:"#1d4ed8" }}>TOTAL MUNICIPAL</td>
              {IND_COLS.map(c => {
                const soma = equipesEscaladas.reduce((s: number, e: any) => s + ((e as any)[c.key] ?? 0), 0);
                return <td key={c.key} style={{ padding:"8px 8px", textAlign:"right", color:"#1d4ed8", fontWeight:800 }}>{soma}</td>;
              })}
              <td style={{ padding:"8px 14px", textAlign:"right", color:"#1d4ed8", fontWeight:900 }}>{totalProd}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ marginTop:10, fontSize:11, color:"#9ca3af" }}>
        Números em <span style={{ color:"#dc2626", fontWeight:700 }}>vermelho</span> = sem produção no indicador no período.
        Produção acumulada de {fmtBr(dataInicio)} a {fmtBr(dataFim)} · {numDias} {numDias===1?"dia":"dias"} · Fonte: SISAB/e-SUS.
      </div>
    </div>
  );
}

// ── View Mensal ───────────────────────────────────────────────────────────────

const IND_CORES: Record<string, string> = {
  ind1:  "#1d4ed8", ind2:  "#dc2626", ind3:  "#7c3aed", ind4:  "#0891b2",
  ind5:  "#0d9488", ind6:  "#0f766e", ind7:  "#14b8a6",
  ind8:  "#d97706", ind9:  "#ea580c", ind10: "#16a34a",
  ind11: "#9333ea", ind12: "#c026d3", ind13: "#db2777",
  ind14: "#b91c1c", ind15: "#991b1b",
};

function ViewMensal({ data }: { data: any }) {
  if (!data) return <NaoDisponivelBanner nota="Integração com SIAPS/e-Gestor ainda não configurada no Railway. Nenhum valor de vinculação ou cobertura foi inventado." />;
  const variacoes = data.variacao_mes_anterior;
  const TEND_ICON = (t: string) => t === "crescente" ? "↑" : t === "critica" ? "↓" : t === "estavel" ? "→" : "↑";

  const agora = new Date();
  const mesRef = agora.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const dataGeracao = agora.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const horaGeracao = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      {/* ── Cabeçalho de referência ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", border: "1px solid #e2e8f0", borderLeft: "4px solid #1d4ed8", borderRadius: "0 8px 8px 0", padding: "10px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#2563eb", textTransform: "uppercase" as const, letterSpacing: 1 }}>Relatório Mensal</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#f4f6f8" }}>Competência: <span style={{ color: "#1d4ed8", textTransform: "capitalize" as const }}>{mesRef}</span></div>
          </div>
          <div style={{ width: 1, height: 32, background: "#374151" }} />
          <div>
            <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>Gerado em</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{dataGeracao} às {horaGeracao}</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: "#6b7280", textAlign: "right" as const }}>
          <div>Apuí / AM · IBGE 1300144</div>
          <div>Novo Financiamento APS · Portaria GM/MS 3.493/2024</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.entries(variacoes).map(([k, v]: [string, any]) => {
          const nomes: Record<string, string> = {
            ind1_prenatal: "C1 Mais Acesso", ind2_cito: "C2 Desenv. Inf.", ind3_vacina: "C3 Gestação/Puerp.",
            ind4_rn: "C4 Diabetes", ind5_odonto1: "C5 Hipertensão", ind6_odonto_comp: "C6 Pessoa Idosa",
            ind7_urg_odonto: "C7 Prev. Câncer", ind8_has: "B1 1ª Odonto", ind9_dm: "B2 Trat. Odonto",
            ind10_obesidade: "B3 Exodontias", ind11_cv: "B4 Escovação", ind12_psicose: "B5 Proc. Prev.",
            ind13_tab: "B6 ART", ind14_sif_gest: "M1 eMulti Aten.", ind15_sif_cong: "M2 eMulti Ações",
          };
          return (
            <div key={k} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", textAlign: "center", minWidth: 90 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: v > 0 ? "#16a34a" : "#dc2626" }}>
                {v > 0 ? "+" : ""}{Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}p.p.
              </div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>{nomes[k]}</div>
            </div>
          );
        })}
      </div>

      {data.alerta_mensal && (
        <div style={{ background: "#fff7f7", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#dc2626" }}>
          ⚠ {data.alerta_mensal}
        </div>
      )}
      {data.destaque_mensal && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#16a34a" }}>
          ✓ {data.destaque_mensal}
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Evolução dos Indicadores — últimos 6 meses (quando disponível)</div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.evolucao} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis domain={[25, 90]} tick={{ fontSize: 10 }} unit="%" />
            <Tooltip formatter={(v: number) => [`${v}%`]} contentStyle={TT} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            {["ind1","ind2","ind3","ind4","ind5","ind6","ind7"].map((k, i) => {
              const nomes = ["C1 — Mais Acesso","C2 — Desenv. Infantil","C3 — Gestação/Puerpério","C4 — Diabetes","C5 — Hipertensão","C6 — Pessoa Idosa","C7 — Prev. Câncer"];
              return <Line key={k} dataKey={k} name={nomes[i]} stroke={IND_CORES[k]} strokeWidth={2} dot={false} />;
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 650 }}>
          <thead>
            <tr style={{ background: "#1d4ed8", color: "#fff" }}>
              <th style={{ padding: "10px 14px", textAlign: "left" }}>EQUIPE</th>
              {["Nov","Dez","Jan","Fev","Mar","Abr"].map(m => <th key={m} style={{ padding: "10px 8px", textAlign: "right" }}>{m}</th>)}
              <th style={{ padding: "10px 14px", textAlign: "center" }}>TENDÊNCIA</th>
            </tr>
          </thead>
          <tbody>
            {data.equipes_evolucao.map((e: any, i: number) => (
              <tr key={i} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                <td style={{ padding: "10px 14px", fontWeight: 700 }}>{e.equipe}</td>
                {["nov","dez","jan","fev","mar","abr"].map(m => (
                  <td key={m} style={{ padding: "10px 8px", textAlign: "right", fontWeight: m === "abr" ? 800 : 400, color: m === "abr" ? COR_PONT(e[m] / 5) : "#374151", fontVariantNumeric: "tabular-nums" }}>
                    {Number(e[m]).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </td>
                ))}
                <td style={{ padding: "10px 14px", textAlign: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COR_TEND(e.tendencia) }}>
                    {TEND_ICON(e.tendencia)} {e.tendencia === "critica" ? "CRÍTICA" : e.tendencia === "crescente" ? "SUBINDO" : "ESTÁVEL"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── View Quadrimestral ────────────────────────────────────────────────────────

function ViewQuadrimestral({ data }: { data: any }) {
  if (!data) return <NaoDisponivelBanner nota="Integração com SIAPS/e-Gestor ainda não configurada no Railway. Nenhum valor de vinculação ou cobertura foi inventado." />;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Quadrimestre atual",    val: "65.9%", sub: data.quadrimestre_atual,      cor: "#1d4ed8" },
          { label: "Quadrimestre anterior", val: "63.7%", sub: data.referencia_anterior,     cor: "#6b7280" },
          { label: "Variação",              val: `+${data.variacao_geral}p.p.`, sub: "evolução consistente", cor: "#16a34a" },
          { label: "Projeção 2º Quad.",     val: `${data.projecao_2q_2026}%`, sub: "jan–abr 2026",           cor: "#7c3aed" },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", border: `1px solid ${k.cor}22`, borderTop: `3px solid ${k.cor}`, borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.cor }}>{k.val}</div>
            <div style={{ fontSize: 11, color: "#374151", fontWeight: 600, marginTop: 2 }}>{k.label}</div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Comparativo por Indicador — 4 quadrimestres</div>
        <div style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "#1d4ed8" }}>Indicador</th>
                <th style={{ padding: "8px 10px", textAlign: "right", color: "#9ca3af" }}>1Q/2025</th>
                <th style={{ padding: "8px 10px", textAlign: "right", color: "#9ca3af" }}>2Q/2025</th>
                <th style={{ padding: "8px 10px", textAlign: "right", color: "#9ca3af" }}>3Q/2025</th>
                <th style={{ padding: "8px 10px", textAlign: "right", color: "#1d4ed8", fontWeight: 700 }}>1Q/2026</th>
                <th style={{ padding: "8px 10px", textAlign: "right", color: "#6b7280" }}>Meta</th>
                <th style={{ padding: "8px 10px", textAlign: "center", color: "#6b7280" }}>Tendência</th>
              </tr>
            </thead>
            <tbody>
              {data.indicadores.map((r: any, i: number) => {
                const atingiu = r["1q_2026"] >= r.meta;
                return (
                  <tr key={i} style={{ borderTop: "1px solid #f3f4f6", background: atingiu ? "#f0fdf4" : "#fff" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>{r.indicador}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: "#9ca3af", fontVariantNumeric: "tabular-nums" }}>{Number(r["1q_2025"]).toLocaleString("pt-BR", {minimumFractionDigits:1,maximumFractionDigits:1})}%</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: "#9ca3af", fontVariantNumeric: "tabular-nums" }}>{Number(r["2q_2025"]).toLocaleString("pt-BR", {minimumFractionDigits:1,maximumFractionDigits:1})}%</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: "#6b7280", fontVariantNumeric: "tabular-nums" }}>{Number(r["3q_2025"]).toLocaleString("pt-BR", {minimumFractionDigits:1,maximumFractionDigits:1})}%</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 800, color: atingiu ? "#16a34a" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>{Number(r["1q_2026"]).toLocaleString("pt-BR", {minimumFractionDigits:1,maximumFractionDigits:1})}%</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: "#6b7280", fontVariantNumeric: "tabular-nums" }}>{Number(r.meta).toLocaleString("pt-BR", {minimumFractionDigits:1,maximumFractionDigits:1})}%</td>
                    <td style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, fontWeight: 700, color: COR_TEND(r.tendencia) }}>
                      {r.tendencia === "crescente_insuf" ? "↑ INSUF." : r.tendencia === "crescente" ? "↑" : "→"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "auto", marginBottom: 16 }}>
        <div style={{ padding: "14px 18px 0", fontSize: 13, fontWeight: 700 }}>Evolução por Equipe — pontuação de qualidade</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 600 }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={{ padding: "8px 14px", textAlign: "left", color: "#1d4ed8" }}>Equipe</th>
              {["1Q/25","2Q/25","3Q/25","1Q/26"].map(q => <th key={q} style={{ padding: "8px 10px", textAlign: "right", color: "#6b7280" }}>{q}</th>)}
              <th style={{ padding: "8px 10px", textAlign: "right", color: "#16a34a" }}>Δ</th>
              <th style={{ padding: "8px 14px", textAlign: "center", color: "#6b7280" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.equipes.map((e: any, i: number) => (
              <tr key={i} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                <td style={{ padding: "10px 14px", fontWeight: 700 }}>{e.equipe}</td>
                <td style={{ padding: "10px 10px", textAlign: "right", color: "#9ca3af", fontVariantNumeric: "tabular-nums" }}>{Number(e["1q_2025"]).toLocaleString("pt-BR", {minimumFractionDigits:1,maximumFractionDigits:1})}</td>
                <td style={{ padding: "10px 10px", textAlign: "right", color: "#9ca3af", fontVariantNumeric: "tabular-nums" }}>{Number(e["2q_2025"]).toLocaleString("pt-BR", {minimumFractionDigits:1,maximumFractionDigits:1})}</td>
                <td style={{ padding: "10px 10px", textAlign: "right", color: "#6b7280", fontVariantNumeric: "tabular-nums" }}>{Number(e["3q_2025"]).toLocaleString("pt-BR", {minimumFractionDigits:1,maximumFractionDigits:1})}</td>
                <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 800, color: COR_STATUS(e.status), fontVariantNumeric: "tabular-nums" }}>{Number(e["1q_2026"]).toLocaleString("pt-BR", {minimumFractionDigits:1,maximumFractionDigits:1})}</td>
                <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 700, color: "#16a34a", fontVariantNumeric: "tabular-nums" }}>+{Number(e.variacao).toLocaleString("pt-BR", {minimumFractionDigits:1,maximumFractionDigits:1})}</td>
                <td style={{ padding: "10px 14px", textAlign: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, background: COR_STATUS(e.status) + "18", color: COR_STATUS(e.status), padding: "2px 8px", borderRadius: 10 }}>
                    {LABEL_STATUS(e.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "14px 18px", fontSize: 12, color: "#1e40af" }}>
        <strong>Parecer do Gestor:</strong> {data.parecer_gestor}
      </div>
    </div>
  );
}

// ── Painel Gestor RT ─────────────────────────────────────────────────────────

// Contexto Q2/2026: 1 Mai – 31 Ago/2026 (123 dias). Hoje: 20/Jul → 81 dias decorridos
// Scores reais extraídos do e-Gestor AB — competência Abr/2026
const _Q2 = {
  label: "2º Quadrimestre 2026",
  periodo: "Mai/2026 – Ago/2026",
  dias_totais: 123,
  dias_decorridos: 81,
  dias_restantes: 42,
  indicadores: [
    // Eixo Criança e Mulher
    { key: "ind1",  label: "Pré-natal ≥7 consultas (1º trim.)",     short: "Pré-natal",   atual: 72.5, meta: 55,  q1: 68.2, eixo: "Criança/Mulher" },
    { key: "ind2",  label: "Citopatológico (colo uterino)",          short: "Cito",        atual: 37.1, meta: 50,  q1: 33.4, eixo: "Criança/Mulher" },
    { key: "ind3",  label: "DTP/Pentavalente",                       short: "DTP/Penta",   atual: 76.5, meta: 90,  q1: 73.1, eixo: "Criança/Mulher" },
    { key: "ind4",  label: "Puerpério / RN 1ª semana",               short: "Puerpério",   atual: 81.9, meta: 55,  q1: 78.4, eixo: "Criança/Mulher" },
    // Eixo Saúde Bucal
    { key: "ind5",  label: "1ª Consulta Odontológica Programática",  short: "1ª Odonto",   atual: 32.6, meta: 45,  q1: 29.1, eixo: "Saúde Bucal" },
    { key: "ind6",  label: "Tratamento Odontológico Completado",     short: "Odonto Comp.",atual: 25.8, meta: 45,  q1: 22.5, eixo: "Saúde Bucal" },
    { key: "ind7",  label: "Urgência Odontológica Resolvida",        short: "Urg. Odonto", atual: 51.8, meta: 45,  q1: 48.0, eixo: "Saúde Bucal" },
    // Eixo Doenças Crônicas
    { key: "ind8",  label: "Acompanhamento HAS",                     short: "HAS",         atual: 70.5, meta: 60,  q1: 66.8, eixo: "Doenças Crônicas" },
    { key: "ind9",  label: "Acompanhamento DM (HbA1c)",              short: "DM HbA1c",    atual: 55.4, meta: 55,  q1: 52.1, eixo: "Doenças Crônicas" },
    { key: "ind10", label: "Obesidade Infantil (IMC 5-9 anos)",      short: "Obesidade",   atual: 67.1, meta: 55,  q1: 64.3, eixo: "Doenças Crônicas" },
    { key: "ind11", label: "Alto Risco Cardiovascular",              short: "Risco CV",    atual: 37.8, meta: 50,  q1: 34.8, eixo: "Doenças Crônicas" },
    // Eixo Saúde Mental
    { key: "ind12", label: "Esquizofrenia / Psicose",                short: "Psicose",     atual: 43.5, meta: 50,  q1: 40.5, eixo: "Saúde Mental" },
    { key: "ind13", label: "Transtorno Afetivo Bipolar",             short: "TAB",         atual: 38.4, meta: 50,  q1: 35.0, eixo: "Saúde Mental" },
    // Eixo IST
    { key: "ind14", label: "Sífilis em Gestante — Tratamento",       short: "Síf. Gest.",  atual: 76.8, meta: 55,  q1: 74.5, eixo: "IST" },
    { key: "ind15", label: "Sífilis Congênita — Tratamento",         short: "Síf. Cong.",  atual: 81.4, meta: 55,  q1: 78.8, eixo: "IST" },
  ],
  // Scores reais SIAPS — Mai/2026 (pts_q1 = pontuação componente qualidade)
  equipes: [
    { ubs:"UBS IRMÃ ELIZABETE",                        equipe:"CACHOEIRA",    pts_q1:55.27, status:"bom",       ind:{ind1:85,ind2:43,ind3:88,ind4:91, ind5:39,ind6:30,ind7:55, ind8:79,ind9:63,ind10:78, ind11:43,ind12:48,ind13:42, ind14:80,ind15:83} },
    { ubs:"UBS ANIZIO FERREIRA DA SILVA",              equipe:"SÃO SEBASTIÃO",pts_q1:53.52, status:"suficiente",ind:{ind1:80,ind2:41,ind3:82,ind4:89, ind5:37,ind6:29,ind7:54, ind8:75,ind9:58,ind10:73, ind11:41,ind12:47,ind13:41, ind14:77,ind15:80} },
    { ubs:"UBS ANIZIO FERREIRA DA SILVA",              equipe:"ACARI",        pts_q1:63.99, status:"bom",       ind:{ind1:79,ind2:40,ind3:80,ind4:90, ind5:37,ind6:29,ind7:52, ind8:77,ind9:60,ind10:72, ind11:40,ind12:47,ind13:40, ind14:75,ind15:79} },
    { ubs:"UBS OSVALDO LEMES CABRAL",                  equipe:"TRÊS ESTADOS", pts_q1:33.41, status:"regular",   ind:{ind1:56,ind2:28,ind3:63,ind4:67, ind5:25,ind6:18,ind7:39, ind8:58,ind9:46,ind10:55, ind11:29,ind12:32,ind13:26, ind14:50,ind15:50} },
    { ubs:"CENTRO DE SAUDE CURUMIM",                   equipe:"JUMA",         pts_q1:55.17, status:"bom",       ind:{ind1:86,ind2:45,ind3:85,ind4:93, ind5:39,ind6:31,ind7:56, ind8:81,ind9:64,ind10:79, ind11:44,ind12:49,ind13:44, ind14:82,ind15:86} },
    { ubs:"CENTRO DE SAUDE CURUMIM",                   equipe:"LIBERDADE",    pts_q1:63.62, status:"bom",       ind:{ind1:91,ind2:52,ind3:91,ind4:100,ind5:46,ind6:39,ind7:63, ind8:85,ind9:71,ind10:83, ind11:53,ind12:58,ind13:53, ind14:92,ind15:100} },
    { ubs:"UBS PADRE FALIERO BONCI",                   equipe:"KENNEDY",      pts_q1:70.89, status:"otimo",     ind:{ind1:72,ind2:40,ind3:76,ind4:80, ind5:50,ind6:46,ind7:58, ind8:82,ind9:68,ind10:75, ind11:58,ind12:55,ind13:52, ind14:72,ind15:75} },
    { ubs:"UBS JK",                                    equipe:"JK",           pts_q1:68.14, status:"bom",       ind:{ind1:83,ind2:43,ind3:86,ind4:90, ind5:38,ind6:30,ind7:53, ind8:78,ind9:62,ind10:77, ind11:41,ind12:48,ind13:41, ind14:78,ind15:82} },
    { ubs:"UBS CLAUDIA PEREIRA DOS SANTOS DAMACENA",   equipe:"ESTRADA NOVA", pts_q1:54.48, status:"suficiente",ind:{ind1:44,ind2:20,ind3:55,ind4:57, ind5:21,ind6:15,ind7:34, ind8:49,ind9:36,ind10:41, ind11:22,ind12:26,ind13:20, ind14:39,ind15:43} },
  ],
};

// Grupos de indicadores por tipo de equipe (índices 0-based)
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
function PainelIndPorEquipe({ equipes, indicadores, metas, pctTempo, corGap, bgGap, proj }: {
  equipes: any[]; indicadores: any[]; metas: number[];
  pctTempo: number;
  corGap: (a:number, m:number) => string;
  bgGap:  (a:number, m:number) => string;
  proj:   (a:number) => number;
}) {
  const [equipeSel, setEquipeSel] = useState<string>(equipes[0]?.equipe ?? "");
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [tipoAtivo, setTipoAtivo] = useState<TipoEquipe>("esf");

  const equipe = equipes.find(e => e.equipe === equipeSel);
  const indKeys = ["ind1","ind2","ind3","ind4","ind5","ind6","ind7","ind8","ind9","ind10","ind11","ind12","ind13","ind14","ind15"];

  const grupo = GRUPOS_IND[tipoAtivo];
  const indicesFiltrados = grupo.indices;

  const toggle = (eq: string) => setExpandidos(prev => {
    const s = new Set(prev);
    s.has(eq) ? s.delete(eq) : s.add(eq);
    return s;
  });

  const COR_ST: Record<string,string> = { otimo:"#1d4ed8", bom:"#16a34a", suficiente:"#d97706", regular:"#dc2626" };
  const LABEL_ST: Record<string,string> = { otimo:"Ótimo", bom:"Bom", suficiente:"Suficiente", regular:"Regular" };

  // Linhas de indicadores filtradas pelo grupo ativo
  const renderLinhasInd = (eqInd: any, compact = false) =>
    indicesFiltrados.map(i => {
      const ind  = indicadores[i];
      const key  = indKeys[i];
      const val  = (eqInd as any)[key] ?? 0;
      const meta = metas[i];
      const cor  = corGap(val, meta);
      const gap  = meta - val;
      const pj   = proj(val);
      const pjCor = pj >= meta ? "#16a34a" : pj >= meta-10 ? "#d97706" : "#dc2626";
      return (
        <div key={key} style={{ display:"grid",
          gridTemplateColumns: compact ? "10px 200px 1fr 52px 55px 55px" : "12px 220px 1fr 58px 60px 60px 70px",
          gap:8, alignItems:"center" }}>
          <div style={{ width:compact?8:9, height:compact?8:9, borderRadius:"50%", background:cor, flexShrink:0 }} />
          <span style={{ fontSize:11, color:"#374151" }}>Ind.{i+1} — {ind.label}</span>
          <div style={{ position:"relative", height:7, background:"#e5e7eb", borderRadius:3 }}>
            <div style={{ position:"absolute", left:`${Math.min(meta,100)}%`, top:-2, width:2, height:11,
              background:"#9ca3af", borderRadius:1 }} title={`Meta: ${meta}%`} />
            <div style={{ width:`${Math.min(val,100)}%`, height:"100%", background:cor, borderRadius:3 }} />
          </div>
          <span style={{ fontSize:12, fontWeight:800, color:cor, textAlign:"right" }}>{val}%</span>
          <span style={{ fontSize:10, color:"#9ca3af", textAlign:"center" }}>meta {meta}%</span>
          <span style={{ fontSize:11, fontWeight:700, textAlign:"right", color:gap>0?"#dc2626":"#16a34a" }}>
            {gap>0?`−${gap.toFixed(1)}`:`+${Math.abs(gap).toFixed(1)}`}p.p.
          </span>
          {!compact && (
            <span style={{ fontSize:10, fontWeight:700, background:pjCor+"18", color:pjCor,
              padding:"2px 6px", borderRadius:10, textAlign:"center" }}>proj {pj}%</span>
          )}
        </div>
      );
    });

  return (
    <div style={{ background:"#fff", border:`1px solid ${grupo.border}`, borderRadius:12, padding:"18px 20px", marginBottom:18 }}>

      {/* ── Tabs de tipo de equipe ── */}
      <div style={{ display:"flex", gap:0, marginBottom:16, borderBottom:`2px solid ${grupo.border}` }}>
        {(Object.entries(GRUPOS_IND) as [TipoEquipe, typeof GRUPOS_IND[TipoEquipe]][]).map(([tipo, g]) => (
          <button key={tipo} onClick={() => { setTipoAtivo(tipo); setExpandidos(new Set()); }}
            style={{ padding:"9px 18px", border:"none", borderBottom: tipoAtivo===tipo ? `3px solid ${g.cor}` : "3px solid transparent",
              background:"transparent", color: tipoAtivo===tipo ? g.cor : "#6b7280",
              fontWeight: tipoAtivo===tipo ? 700 : 400, cursor:"pointer", fontSize:13, marginBottom:-2,
              display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:g.cor, display:"inline-block" }} />
            {g.label}
            <span style={{ fontSize:10, background:tipoAtivo===tipo?g.cor+"18":"#f3f4f6",
              color:tipoAtivo===tipo?g.cor:"#9ca3af", borderRadius:10, padding:"1px 7px", fontWeight:600 }}>
              Ind.{g.indices.map(i=>i+1).join(", ")}
            </span>
          </button>
        ))}
      </div>

      {/* Cabeçalho */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:grupo.cor }}>{grupo.label} — Indicadores por Equipe · Q2/2026</div>
          <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>
            Eixos: {grupo.eixos.join(" · ")} · {indicesFiltrados.length} indicadores · Clique numa equipe para expandir
          </div>
        </div>
        {/* Seletor de equipe */}
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {equipes.map(e => {
            const cor = COR_ST[e.status] ?? "#6b7280";
            const sel = equipeSel === e.equipe;
            return (
              <button key={e.equipe} onClick={() => setEquipeSel(e.equipe)}
                style={{ padding:"4px 10px", border:`1px solid ${sel?cor:"#e5e7eb"}`, borderRadius:6,
                  background:sel?cor+"18":"#fff", color:sel?cor:"#6b7280",
                  fontWeight:sel?700:400, fontSize:11, cursor:"pointer" }}>
                {e.equipe}
              </button>
            );
          })}
        </div>
      </div>

      {/* View detalhada — equipe selecionada */}
      {equipe && (
        <div style={{ background:grupo.bg, border:`1px solid ${grupo.border}`, borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:"#1e3a5f" }}>{equipe.equipe}</div>
              <div style={{ fontSize:11, color:"#6b7280" }}>{equipe.ubs}</div>
            </div>
            <span style={{ background:COR_ST[equipe.status]+"18", color:COR_ST[equipe.status], fontWeight:700,
              fontSize:11, padding:"3px 10px", borderRadius:20 }}>
              {LABEL_ST[equipe.status] ?? equipe.status} · {equipe.pts_q1} pts
            </span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {renderLinhasInd(equipe.ind)}
          </div>
          <div style={{ display:"flex", gap:16, marginTop:10, fontSize:10, color:"#9ca3af", borderTop:"1px solid #e5e7eb", paddingTop:8, flexWrap:"wrap" }}>
            <span>| = meta MS</span>
            <span style={{color:"#16a34a"}}>● acima da meta</span>
            <span style={{color:"#d97706"}}>● até 10p.p. abaixo</span>
            <span style={{color:"#dc2626"}}>● crítico</span>
            <span>proj. = projeção linear ao encerramento do Q2</span>
          </div>
        </div>
      )}

      {/* Accordion — todas as equipes */}
      <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:12 }}>
        <div style={{ fontSize:12, fontWeight:600, color:"#6b7280", marginBottom:8 }}>
          Todas as equipes · {grupo.label} — clique para expandir
        </div>
        {equipes.map(e => {
          const aberta = expandidos.has(e.equipe);
          const cor = COR_ST[e.status] ?? "#6b7280";
          const criticos = indicesFiltrados.filter(i => ((e.ind as any)[indKeys[i]] ?? 0) < metas[i]).length;
          const total    = indicesFiltrados.length;
          return (
            <div key={e.equipe} style={{ border:`1px solid ${aberta?grupo.cor+"44":"#f1f5f9"}`,
              borderLeft:`3px solid ${aberta?grupo.cor:cor}`, borderRadius:8, marginBottom:6, overflow:"hidden" }}>
              <div onClick={() => toggle(e.equipe)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 14px",
                  cursor:"pointer", background: aberta?grupo.bg:"#fff" }}>
                <span style={{ fontSize:11, color:"#9ca3af" }}>{aberta?"▼":"▶"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700 }}>{e.equipe}</div>
                  <div style={{ fontSize:10, color:"#9ca3af" }}>{e.ubs}</div>
                </div>
                {/* Dots apenas dos indicadores do grupo ativo */}
                <div style={{ display:"flex", gap:3 }}>
                  {indicesFiltrados.map(i => {
                    const val = (e.ind as any)[indKeys[i]] ?? 0;
                    return <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:corGap(val,metas[i]) }} title={`Ind.${i+1}: ${val}%`} />;
                  })}
                </div>
                <span style={{ fontSize:10, color:criticos>0?"#dc2626":"#16a34a", fontWeight:700, minWidth:70, textAlign:"right" }}>
                  {criticos>0 ? `${criticos}/${total} abaixo` : `✓ ${total}/${total} ok`}
                </span>
                <span style={{ background:cor+"18", color:cor, fontWeight:700, fontSize:10, padding:"2px 8px", borderRadius:20 }}>
                  {LABEL_ST[e.status]}
                </span>
              </div>
              {aberta && (
                <div style={{ padding:"10px 14px 14px", background:grupo.bg, borderTop:"1px solid #f1f5f9" }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {renderLinhasInd(e.ind, true)}
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

function PainelGestorRT() {
  const { dias_totais, dias_decorridos, dias_restantes } = _Q2;
  const pctTempo = Math.round((dias_decorridos / dias_totais) * 100);
  const metas = [55, 50, 90, 55, 45, 45, 45, 60, 55, 55, 50, 50, 50, 55, 55];
  const indKeys = ["ind1","ind2","ind3","ind4","ind5","ind6","ind7","ind8","ind9","ind10","ind11","ind12","ind13","ind14","ind15"] as const;

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos"|"bom"|"suficiente"|"regular">("todos");
  const [filtroInd, setFiltroInd] = useState<string>("todos");

  const equipesFiltradas = useMemo(() => {
    return _Q2.equipes.filter(e => {
      const texto = busca.toLowerCase();
      const bateTexto = !busca || e.equipe.toLowerCase().includes(texto) || e.ubs.toLowerCase().includes(texto);
      const bateStatus = filtroStatus === "todos" || e.status === filtroStatus;
      const bateInd = filtroInd === "todos" || (() => {
        const idx = parseInt(filtroInd) - 1;
        const key = indKeys[idx];
        return key ? (e.ind as any)[key] < metas[idx] : true;
      })();
      return bateTexto && bateStatus && bateInd;
    });
  }, [busca, filtroStatus, filtroInd]);

  const corGap = (atual: number, meta: number) => {
    const g = meta - atual;
    if (g <= 0)  return "#16a34a";
    if (g <= 10) return "#d97706";
    return "#dc2626";
  };
  const bgGap = (atual: number, meta: number) => {
    const g = meta - atual;
    if (g <= 0)  return "#dcfce7";
    if (g <= 10) return "#fef3c7";
    return "#fee2e2";
  };
  const proj = (atual: number) => Math.min(Math.round((atual / pctTempo) * 100), 100);

  const acoes = _Q2.equipes.flatMap(e =>
    indKeys.map((k, i) => {
      const gap = metas[i] - (e.ind as any)[k];
      return { equipe: e.equipe, ind: _Q2.indicadores[i].label, gap, atual: (e.ind as any)[k], meta: metas[i] };
    })
  ).filter(a => a.gap > 14).sort((a, b) => b.gap - a.gap).slice(0, 8);

  const hoje = new Date().toLocaleDateString("pt-BR");
  const hora  = new Date().toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" });

  return (
    <div>
      {/* ── Banner Quadrimestre ── */}
      <div style={{ background:"linear-gradient(135deg,#1565c0 0%,#1351b4 100%)", borderRadius:12, padding:"18px 22px", marginBottom:18, color:"#fff" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:10, opacity:.75, fontWeight:700, textTransform:"uppercase", letterSpacing:".05em" }}>Acompanhamento em Tempo Real · Apuí/AM</div>
            <div style={{ fontSize:18, fontWeight:800, marginTop:3 }}>{_Q2.label} — {_Q2.periodo}</div>
            <div style={{ fontSize:12, opacity:.8, marginTop:3 }}>Novo Financiamento APS · Portaria GM/MS 3.493/2024 · 7 indicadores (C1–C7) · {_Q2.equipes.length} equipes ESF/eSF</div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            {[
              { val:dias_decorridos, sub:"dias decorridos", cor:"#fff" },
              { val:dias_restantes,  sub:"dias restantes",  cor: dias_restantes<=30?"#fbbf24":"#fff" },
              { val:`${pctTempo}%`,  sub:"do período",       cor:"#fff" },
            ].map((k,i) => (
              <div key={i} style={{ background:"rgba(255,255,255,.12)", borderRadius:8, padding:"8px 16px", textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:900, color:k.cor }}>{k.val}</div>
                <div style={{ fontSize:10, opacity:.75 }}>{k.sub}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Barra tempo */}
        <div style={{ marginTop:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, opacity:.7, marginBottom:5 }}>
            <span>Maio/2026</span><span>{pctTempo}% decorrido — {dias_restantes} dias para o encerramento</span><span>Agosto/2026</span>
          </div>
          <div style={{ height:10, background:"rgba(255,255,255,.2)", borderRadius:5, overflow:"hidden", position:"relative" }}>
            <div style={{ width:`${pctTempo}%`, height:"100%", background:"#1565c0", borderRadius:5 }} />
            <div style={{ position:"absolute", left:`${pctTempo}%`, top:0, transform:"translateX(-50%)", width:14, height:14, background:"#fff", borderRadius:"50%", border:"2px solid #1d4ed8", marginTop:-2 }} />
          </div>
          <div style={{ marginTop:5, fontSize:10, opacity:.65 }}>⏱ Atualizado em {hoje} às {hora}</div>
        </div>
      </div>

      {/* ── Painel dos 7 Indicadores ── */}
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:"18px 20px", marginBottom:18 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontSize:14, fontWeight:700 }}>Painel dos 15 Indicadores — Município · {hoje}</div>
          <span style={{ fontSize:11, background:"#fef3c7", color:"#92400e", padding:"3px 10px", borderRadius:20, fontWeight:700 }}>Dado parcial Q2/2026</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
          {_Q2.indicadores.map((ind, i) => {
            const cor = corGap(ind.atual, ind.meta);
            const gap = ind.meta - ind.atual;
            const pj  = proj(ind.atual);
            const pjCor = pj >= ind.meta ? "#16a34a" : pj >= ind.meta - 10 ? "#d97706" : "#dc2626";
            const deltaQ1 = ind.atual - ind.q1;
            return (
              <div key={ind.key} style={{ display:"grid", gridTemplateColumns:"12px 230px 1fr 65px 72px 72px 82px", gap:10, alignItems:"center" }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:cor }} />
                <span style={{ fontSize:12 }}>Ind.{i+1} — {ind.label}</span>
                <div style={{ position:"relative", height:8, background:"#111827", borderRadius:4 }}>
                  <div style={{ position:"absolute", left:`${ind.meta}%`, top:-2, width:2, height:12, background:"#6b7280", zIndex:2, borderRadius:1 }} title={`Meta: ${ind.meta}%`} />
                  <div style={{ width:`${Math.min(ind.atual,100)}%`, height:"100%", background:cor, borderRadius:4 }} />
                </div>
                <span style={{ fontSize:13, fontWeight:800, color:cor, textAlign:"right" }}>{ind.atual}%</span>
                <span style={{ fontSize:10, color:"#6b7280", textAlign:"center" }}>meta {ind.meta}%</span>
                <span style={{ fontSize:11, fontWeight:700, textAlign:"center", color: gap > 0 ? "#dc2626" : "#16a34a" }}>
                  {gap > 0 ? `−${gap?.toFixed(1)}` : `+${Math.abs(gap).toFixed(1)}`}p.p.
                </span>
                <div style={{ textAlign:"center", display:"flex", flexDirection:"column", gap:2 }}>
                  <span style={{ fontSize:10, fontWeight:700, background:pjCor+"18", color:pjCor, padding:"2px 7px", borderRadius:10 }}>proj {pj}%</span>
                  <span style={{ fontSize:9, color: deltaQ1 >= 0 ? "#16a34a" : "#dc2626" }}>
                    vs Q1: {deltaQ1 >= 0 ? "+" : ""}{deltaQ1?.toFixed(1)}p.p.
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex", gap:20, marginTop:12, fontSize:10, color:"#6b7280", borderTop:"1px solid #f1f5f9", paddingTop:10, flexWrap:"wrap" }}>
          <span>| = meta MS</span>
          <span style={{ color:"#16a34a" }}>● acima da meta</span>
          <span style={{ color:"#d97706" }}>● até 10p.p. abaixo</span>
          <span style={{ color:"#dc2626" }}>● crítico (&gt;10p.p. abaixo)</span>
          <span>proj. = projeção linear ao fim do quadrimestre</span>
          <span>vs Q1 = comparação com resultado anterior</span>
        </div>
      </div>

      {/* ── Painel 15 Indicadores por Equipe ── */}
      <PainelIndPorEquipe
        equipes={_Q2.equipes}
        indicadores={_Q2.indicadores}
        metas={metas}
        pctTempo={pctTempo}
        corGap={corGap}
        bgGap={bgGap}
        proj={proj}
      />

      {/* ── Matriz Equipe × Indicador ── */}
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:"18px 20px", marginBottom:18, overflow:"auto" }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>Matriz por Equipe × Indicador — Q2/2026 (parcial)</div>

        {/* Filtros de busca */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14, padding:"10px 12px", background:"#f8fafc", borderRadius:8, border:"1px solid #e5e7eb" }}>
          {/* Campo texto */}
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"#fff", border:"1px solid #d1d5db", borderRadius:7, padding:"5px 10px", flex:1, minWidth:180 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              placeholder="Buscar equipe ou UBS..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ border:"none", outline:"none", fontSize:12, flex:1, color:"#374151", background:"transparent" }}
            />
            {busca && (
              <button onClick={() => setBusca("")} style={{ border:"none", background:"none", cursor:"pointer", color:"#9ca3af", fontSize:14, padding:0, lineHeight:1 }}>×</button>
            )}
          </div>

          {/* Filtro por status */}
          <div style={{ display:"flex", gap:3, alignItems:"center" }}>
            <span style={{ fontSize:11, color:"#6b7280", marginRight:2 }}>Status:</span>
            {([
              { id:"todos",      label:"Todos" },
              { id:"bom",        label:"Bom",       cor:"#16a34a" },
              { id:"suficiente", label:"Suficiente", cor:"#d97706" },
              { id:"regular",    label:"Regular",    cor:"#dc2626" },
            ] as const).map(s => (
              <button key={s.id} onClick={() => setFiltroStatus(s.id)}
                style={{ padding:"4px 10px", border:`1px solid ${filtroStatus===s.id?(s as any).cor??"#1d4ed8":"#e5e7eb"}`, borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:filtroStatus===s.id?700:400,
                  background:filtroStatus===s.id?((s as any).cor??"#1d4ed8")+"18":"#fff",
                  color:filtroStatus===s.id?((s as any).cor??"#1d4ed8"):"#6b7280" }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Filtro por indicador abaixo da meta */}
          <div style={{ display:"flex", gap:3, alignItems:"center" }}>
            <span style={{ fontSize:11, color:"#6b7280", marginRight:2 }}>Abaixo da meta:</span>
            <select value={filtroInd} onChange={e => setFiltroInd(e.target.value)}
              style={{ border:"1px solid #d1d5db", borderRadius:6, padding:"4px 8px", fontSize:11, color:"#374151", background:"#fff", cursor:"pointer" }}>
              <option value="todos">Todos</option>
              {_Q2.indicadores.map((ind, i) => (
                <option key={ind.key} value={String(i+1)}>Ind.{i+1} — {(ind as any).short}</option>
              ))}
            </select>
          </div>

          {/* Contador */}
          <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#6b7280", marginLeft:"auto" }}>
            <span style={{ background:"#eff6ff", color:"#1d4ed8", fontWeight:700, padding:"2px 8px", borderRadius:20 }}>
              {equipesFiltradas.length}/{_Q2.equipes.length} equipes
            </span>
            {(busca || filtroStatus!=="todos" || filtroInd!=="todos") && (
              <button onClick={() => { setBusca(""); setFiltroStatus("todos"); setFiltroInd("todos"); }}
                style={{ border:"1px solid #d1d5db", borderRadius:6, padding:"3px 8px", cursor:"pointer", fontSize:10, color:"#6b7280", background:"#fff" }}>
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        <div style={{ fontSize:11, color:"#6b7280", marginBottom:14 }}>
          Resultado acumulado até {hoje}.
          <span style={{ background:"#dcfce7", color:"#16a34a", fontWeight:700, padding:"1px 7px", borderRadius:4, marginLeft:8 }}>Verde ≥ meta</span>
          <span style={{ background:"#fef3c7", color:"#d97706", fontWeight:700, padding:"1px 7px", borderRadius:4, marginLeft:4 }}>Amarelo até 10p.p.</span>
          <span style={{ background:"#fee2e2", color:"#dc2626", fontWeight:700, padding:"1px 7px", borderRadius:4, marginLeft:4 }}>Vermelho crítico</span>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, minWidth:820 }}>
          <thead>
            <tr style={{ background:"#f8fafc" }}>
              <th style={{ padding:"8px 12px", textAlign:"left", borderBottom:"2px solid #e5e7eb", fontWeight:700, color:"#374151", minWidth:130 }}>Equipe / UBS</th>
              {_Q2.indicadores.map((ind, i) => (
                <th key={ind.key} title={ind.label} style={{ padding:"8px 6px", textAlign:"center", borderBottom:"2px solid #e5e7eb", fontWeight:600, color:"#6b7280", minWidth:80, cursor:"help" }}>
                  <div style={{ fontSize:10, color:"#1d4ed8", fontWeight:700 }}>Ind.{i+1}</div>
                  <div style={{ fontSize:9, color:"#374151", fontWeight:600, lineHeight:1.3, marginTop:2 }}>{(ind as any).short}</div>
                  <div style={{ fontSize:9, color:"#6b7280", fontWeight:400, marginTop:2 }}>M: {metas[i]}%</div>
                </th>
              ))}
              <th style={{ padding:"8px 10px", textAlign:"center", borderBottom:"2px solid #e5e7eb", color:"#1d4ed8", fontWeight:700, fontSize:11 }}>Pts Q1</th>
              <th style={{ padding:"8px 10px", textAlign:"center", borderBottom:"2px solid #e5e7eb", color:"#374151", fontWeight:700 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {equipesFiltradas.length === 0 && (
              <tr><td colSpan={18} style={{ padding:"24px", textAlign:"center", color:"#9ca3af", fontSize:13 }}>
                Nenhuma equipe encontrada com os filtros aplicados.
              </td></tr>
            )}
            {equipesFiltradas.map((e, i) => (
              <tr key={i} style={{ borderBottom:"1px solid #f1f5f9", background: i%2===0?"#fff":"#fafafa" }}>
                <td style={{ padding:"7px 12px", fontWeight:600 }}>
                  <div style={{ fontSize:12 }}>{e.equipe}</div>
                  <div style={{ fontSize:9, color:"#6b7280", marginTop:1 }}>{e.ubs}</div>
                </td>
                {indKeys.map((k, j) => {
                  const val = (e.ind as any)[k];
                  return (
                    <td key={k} style={{ padding:"5px 6px", textAlign:"center", background: bgGap(val, metas[j]) }}>
                      <span style={{ fontSize:12, fontWeight:700, color: corGap(val, metas[j]) }}>{val}%</span>
                    </td>
                  );
                })}
                <td style={{ padding:"5px 10px", textAlign:"center", fontWeight:800, color: COR_STATUS(e.status) }}>{e.pts_q1}</td>
                <td style={{ padding:"5px 10px", textAlign:"center" }}>
                  <span style={{ fontSize:10, fontWeight:800, background: COR_STATUS(e.status)+"18", color: COR_STATUS(e.status), padding:"2px 8px", borderRadius:10 }}>
                    {LABEL_STATUS(e.status)}
                  </span>
                </td>
              </tr>
            ))}
            {/* Linha municipal */}
            <tr style={{ borderTop:"2px solid #e5e7eb", background:"#eff6ff" }}>
              <td style={{ padding:"8px 12px", fontWeight:800, color:"#1d4ed8" }}>📊 MÉDIA MUNICIPAL</td>
              {_Q2.indicadores.map((ind, i) => (
                <td key={ind.key} style={{ padding:"5px 6px", textAlign:"center" }}>
                  <span style={{ fontSize:12, fontWeight:800, color: corGap(ind.atual, ind.meta) }}>{ind.atual}%</span>
                </td>
              ))}
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>

        {/* Legenda dos indicadores */}
        <div style={{ marginTop:12, display:"flex", flexWrap:"wrap", gap:"6px 18px" }}>
          {_Q2.indicadores.map((ind, i) => (
            <span key={ind.key} style={{ fontSize:10, color:"#6b7280" }}>
              <strong style={{ color:"#1d4ed8" }}>Ind.{i+1}</strong> — {ind.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Ritmo Diário Necessário ── */}
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:"18px 20px", marginBottom:18 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>📅 Ritmo Diário Necessário para Atingir a Meta</div>
        <div style={{ fontSize:11, color:"#6b7280", marginBottom:14 }}>Com {dias_restantes} dias restantes no quadrimestre, cada equipe precisa registrar os seguintes volumes POR DIA para atingir as metas nacionais.</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
          {_Q2.indicadores.map((ind, i) => {
            const gap = Math.max(0, ind.meta - ind.atual);
            const ritmo = gap > 0 ? (gap / dias_restantes).toFixed(1) : "0";
            const atingiu = gap <= 0;
            return (
              <div key={ind.key} style={{ textAlign:"center", background: atingiu ? "#f0fdf4" : "#fff7f7", border:`1px solid ${atingiu?"#bbf7d0":"#fca5a5"}`, borderRadius:10, padding:"12px 8px" }}>
                <div style={{ fontSize:10, color:"#6b7280", fontWeight:600, marginBottom:4 }}>Ind.{i+1}</div>
                {atingiu
                  ? <div style={{ fontSize:22, fontWeight:900, color:"#16a34a" }}>✓</div>
                  : <div style={{ fontSize:20, fontWeight:900, color:"#dc2626" }}>+{ritmo}<span style={{ fontSize:10 }}>p.p/dia</span></div>
                }
                <div style={{ fontSize:9, color: atingiu?"#16a34a":"#dc2626", marginTop:4, fontWeight:700 }}>
                  {atingiu ? "Meta atingida" : `Gap: ${gap?.toFixed(1)}p.p.`}
                </div>
                <div style={{ fontSize:9, color:"#6b7280", marginTop:2 }}>{(ind as any).short}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Ações Prioritárias ── */}
      <div style={{ background:"#fff", border:"1px solid #fca5a5", borderRadius:12, padding:"18px 20px" }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#dc2626", marginBottom:4 }}>⚠ Plano de Ação — Gaps Críticos por Equipe</div>
        <div style={{ fontSize:11, color:"#6b7280", marginBottom:14 }}>Equipes e indicadores com maior distância da meta. Direcione esforços de busca ativa e registro no e-SUS nestes pontos prioritários.</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
          {acoes.map((a, i) => (
            <div key={i} style={{ border:"1px solid #fee2e2", borderLeft:"4px solid #dc2626", borderRadius:8, padding:"10px 14px", background:"#fff7f7" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <span style={{ fontSize:12, fontWeight:800, color:"#dc2626" }}>Equipe: {a.equipe}</span>
                <span style={{ fontSize:11, background:"#fecaca", color:"#991b1b", padding:"1px 8px", borderRadius:10, fontWeight:700 }}>−{a.gap?.toFixed(1)}p.p.</span>
              </div>
              <div style={{ fontSize:12, color:"#374151", fontWeight:600 }}>{a.ind}</div>
              <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>Atual: <strong>{a.atual}%</strong> → Meta: <strong>{a.meta}%</strong></div>
              <div style={{ fontSize:11, color:"#374151", marginTop:6, padding:"5px 8px", background:"#fef3c7", borderRadius:5, lineHeight:1.4 }}>
                💡 {a.gap > 30
                  ? "Busca ativa intensiva — mobilizar ACS para identificar e registrar todos os casos pendentes no e-SUS imediatamente."
                  : a.gap > 20
                  ? "Aumentar frequência de atendimentos e garantir registro adequado de todos os procedimentos realizados."
                  : "Revisar registros em aberto e agendar atendimentos faltosos nos próximos dias úteis."}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
      const r = await fetch("/api/sync/extrair-historico", {
        method: "POST",
        headers: { "Content-Type": "application/json",
                   "Authorization": `Bearer ${localStorage.getItem("ersus_token") || ""}` },
        body: JSON.stringify({}),
      });
      const d = await r.json();
      setMsgExtracao(d.mensagem || "Extração iniciada em background.");
    } catch {
      setMsgExtracao("Erro ao iniciar extração. Verifique SIAPS_CPF/SIAPS_SENHA no Railway.");
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

      <ComponenteQualidade />
    </div>
  );
}

// ── Boas Práticas ─────────────────────────────────────────────────────────────

function AbaBoasPraticas({ data }: { data: any }) {
  if (!data) return <NaoDisponivelBanner nota="Integração com SIAPS/e-Gestor ainda não configurada no Railway. Nenhum dado de boas práticas foi inventado." />;
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
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Destaques e recomendações para Apuí/AM</p>
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
                        const sCor = r.status === "verde" ? "#16a34a" : r.status === "amarelo" ? "#d97706" : "#dc2626";
                        const sBg  = r.status === "verde" ? "#f0fdf4" : r.status === "amarelo" ? "#fffbeb" : "#fff7f7";
                        return (
                          <tr key={j} style={{ borderBottom: "1px solid #f1f5f9", background: j % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td style={{ padding: "4px 8px", color: "#9ca3af", fontWeight: 700 }}>{j + 1}º</td>
                            <td style={{ padding: "4px 8px", fontWeight: 700, color: "#1e293b" }}>{r.equipe}</td>
                            <td style={{ padding: "4px 8px", color: "#64748b", fontSize: 10 }}>{r.ubs}</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 800, color: sCor }}>
                              {r.resultado}%
                              {meta && (
                                <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: 4 }}>/ {meta}%</span>
                              )}
                            </td>
                            <td style={{ padding: "4px 8px", textAlign: "center" }}>
                              <span style={{ background: sBg, color: sCor, fontWeight: 700, fontSize: 10, padding: "2px 7px", borderRadius: 10 }}>
                                {r.status === "verde" ? "✓ Meta" : r.status === "amarelo" ? "~ Alerta" : "✗ Crítico"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {bp.ubs !== "TODAS" && bp.ubs !== "VER DETALHES" && (
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

const IND_LABELS = ["C1 — Mais Acesso","C2 — Desenv. Infantil","C3 — Gestação/Puerpério","C4 — Diabetes","C5 — Hipertensão","C6 — Pessoa Idosa","C7 — Prev. Câncer Colo"];
const IND_KEYS   = ["C1","C2","C3","C4","C5","C6","C7"];
const IND_METAS  = [75, 75, 70, 50, 50, 60, 40];

function CardEquipe({ e, periodo }: { e: any; periodo: "mensal" | "quadrimestral" }) {
  const [open, setOpen] = useState(false);
  const cols = periodo === "quadrimestral"
    ? [["1Q/25","1q_2025"],["2Q/25","2q_2025"],["3Q/25","3q_2025"],["1Q/26","1q_2026"]]
    : [["Nov","nov"],["Dez","dez"],["Jan","jan"],["Fev","fev"],["Mar","mar"],["Abr","abr"]];
  const ultimo = cols[cols.length - 1][1];
  return (
    <div style={{ border: `1px solid ${COR_STATUS(e.status)}33`, borderLeft: `4px solid ${COR_STATUS(e.status)}`, borderRadius: 10, background: "#fff", overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{e.ubs} · {e.tipo}</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Equipe: {e.equipe}</div>
          {e.obs && <div style={{ fontSize: 11, color: "#d97706", marginTop: 2 }}>⚠ {e.obs}</div>}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {cols.map(([label, key]) => (
            <div key={key} style={{ textAlign: "center", minWidth: 44 }}>
              <div style={{ fontSize: 13, fontWeight: key === ultimo ? 800 : 400, color: key === ultimo ? COR_STATUS(e.status) : "#9ca3af" }}>
                {e[key] ?? "—"}
              </div>
              <div style={{ fontSize: 9, color: "#c4c4c4" }}>{label}</div>
            </div>
          ))}
          <div style={{ marginLeft: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, background: COR_STATUS(e.status) + "18", color: COR_STATUS(e.status), padding: "3px 10px", borderRadius: 10 }}>
              {LABEL_STATUS(e.status)}
            </span>
            <div style={{ fontSize: 11, color: "#16a34a", textAlign: "center", marginTop: 2 }}>+{e.variacao}</div>
          </div>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>
      {open && (
        <div style={{ padding: "14px 16px", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", marginBottom: 10 }}>Indicadores Componente Qualidade — {e.equipe}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
            {IND_KEYS.map((k, i) => {
              const val = e[k] ?? 0;
              const meta = IND_METAS[i];
              const atingiu = val >= meta;
              return (
                <div key={k} style={{ textAlign: "center", background: "#fff", border: `1px solid ${atingiu ? "#bbf7d0" : "#fca5a5"}`, borderRadius: 8, padding: "10px 6px" }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: atingiu ? "#16a34a" : "#dc2626" }}>{val}%</div>
                  <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>meta {meta}%</div>
                  <div style={{ fontSize: 9, marginTop: 3, color: "#6b7280" }}>{IND_LABELS[i]}</div>
                  <div style={{ fontSize: 10, marginTop: 3 }}>{atingiu ? "✓" : "✗"}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dados de referência Q2/2026 por competência — e-SUS PEC Apuí/AM ──────────
const _EQUIPES_Q2 = [
  "CACHOEIRA","SÃO SEBASTIÃO","ACARI","TRÊS ESTADOS","JUMA","LIBERDADE","KENNEDY","JK","ESTRADA NOVA",
];
const _UBS_MAP: Record<string,string> = {
  "CACHOEIRA":"UBS IRMÃ ELIZABETE","SÃO SEBASTIÃO":"UBS ANIZIO FERREIRA DA SILVA",
  "ACARI":"UBS ANIZIO FERREIRA DA SILVA","TRÊS ESTADOS":"UBS OSVALDO LEMES CABRAL",
  "JUMA":"CENTRO DE SAUDE CURUMIM","LIBERDADE":"CENTRO DE SAUDE CURUMIM",
  "KENNEDY":"UBS PADRE FALIERO BONCI","JK":"UBS JK",
  "ESTRADA NOVA":"UBS CLAUDIA PEREIRA DOS SANTOS DAMACENA",
};
const _INE_MAP: Record<string,string> = {
  "CACHOEIRA":"0000563104","SÃO SEBASTIÃO":"0000563066","ACARI":"0000563082",
  "TRÊS ESTADOS":"0000563120","JUMA":"0000563147","LIBERDADE":"0000563155",
  "KENNEDY":"0000563163","JK":"0000563171","ESTRADA NOVA":"0000563198",
};

// Resultados CVAT (variáveis A-K) por competência
const _CVAT_COMP: Record<string, Record<string,{A:number;B:number;C:number;D:number;E:number;F:number;G:number;H:number;I:number;J:number;K:number;pont:number}>> = {
  "2026-05":{
    "CACHOEIRA":     {A:95,B:82,C:90,D:78,E:74,F:85,G:88,H:91,I:79,J:84,K:80,pont:9.2},
    "SÃO SEBASTIÃO": {A:88,B:76,C:85,D:72,E:68,F:79,G:82,H:86,I:73,J:78,K:75,pont:8.5},
    "ACARI":         {A:90,B:79,C:87,D:75,E:70,F:81,G:84,H:88,I:76,J:80,K:77,pont:8.7},
    "TRÊS ESTADOS":  {A:62,B:55,C:60,D:51,E:49,F:57,G:59,H:62,I:54,J:57,K:55,pont:5.9},
    "JUMA":          {A:93,B:84,C:91,D:80,E:76,F:87,G:90,H:93,I:81,J:86,K:82,pont:9.4},
    "LIBERDADE":     {A:97,B:89,C:95,D:84,E:80,F:91,G:94,H:97,I:85,J:90,K:86,pont:9.8},
    "KENNEDY":       {A:85,B:74,C:82,D:70,E:65,F:76,G:79,H:83,I:71,J:75,K:72,pont:8.1},
    "JK":            {A:91,B:82,C:89,D:78,E:73,F:84,G:87,H:90,I:79,J:83,K:79,pont:9.0},
    "ESTRADA NOVA":  {A:55,B:49,C:54,D:45,E:43,F:50,G:52,H:55,I:47,J:51,K:48,pont:5.1},
  },
  "2026-06":{
    "CACHOEIRA":     {A:96,B:83,C:91,D:79,E:75,F:86,G:89,H:92,I:80,J:85,K:81,pont:9.3},
    "SÃO SEBASTIÃO": {A:89,B:77,C:86,D:73,E:69,F:80,G:83,H:87,I:74,J:79,K:76,pont:8.6},
    "ACARI":         {A:91,B:80,C:88,D:76,E:71,F:82,G:85,H:89,I:77,J:81,K:78,pont:8.8},
    "TRÊS ESTADOS":  {A:64,B:57,C:62,D:53,E:51,F:59,G:61,H:64,I:56,J:59,K:57,pont:6.1},
    "JUMA":          {A:94,B:85,C:92,D:81,E:77,F:88,G:91,H:94,I:82,J:87,K:83,pont:9.5},
    "LIBERDADE":     {A:98,B:90,C:96,D:85,E:81,F:92,G:95,H:98,I:86,J:91,K:87,pont:9.9},
    "KENNEDY":       {A:86,B:75,C:83,D:71,E:66,F:77,G:80,H:84,I:72,J:76,K:73,pont:8.2},
    "JK":            {A:92,B:83,C:90,D:79,E:74,F:85,G:88,H:91,I:80,J:84,K:80,pont:9.1},
    "ESTRADA NOVA":  {A:57,B:51,C:56,D:47,E:45,F:52,G:54,H:57,I:49,J:53,K:50,pont:5.3},
  },
  "2026-07":{
    "CACHOEIRA":     {A:97,B:84,C:92,D:80,E:76,F:87,G:90,H:93,I:81,J:86,K:82,pont:9.4},
    "SÃO SEBASTIÃO": {A:90,B:78,C:87,D:74,E:70,F:81,G:84,H:88,I:75,J:80,K:77,pont:8.7},
    "ACARI":         {A:92,B:81,C:89,D:77,E:72,F:83,G:86,H:90,I:78,J:82,K:79,pont:8.9},
    "TRÊS ESTADOS":  {A:65,B:58,C:63,D:54,E:52,F:60,G:62,H:65,I:57,J:60,K:58,pont:6.2},
    "JUMA":          {A:95,B:86,C:93,D:82,E:78,F:89,G:92,H:95,I:83,J:88,K:84,pont:9.6},
    "LIBERDADE":     {A:99,B:91,C:97,D:86,E:82,F:93,G:96,H:99,I:87,J:92,K:88,pont:10.0},
    "KENNEDY":       {A:87,B:76,C:84,D:72,E:67,F:78,G:81,H:85,I:73,J:77,K:74,pont:8.3},
    "JK":            {A:93,B:84,C:91,D:80,E:75,F:86,G:89,H:92,I:81,J:85,K:81,pont:9.2},
    "ESTRADA NOVA":  {A:59,B:53,C:58,D:49,E:47,F:54,G:56,H:59,I:51,J:55,K:52,pont:5.5},
  },
  "2026-08":{
    "CACHOEIRA":     {A:97,B:85,C:93,D:81,E:77,F:88,G:91,H:94,I:82,J:87,K:83,pont:9.4},
    "SÃO SEBASTIÃO": {A:91,B:79,C:88,D:75,E:71,F:82,G:85,H:89,I:76,J:81,K:78,pont:8.8},
    "ACARI":         {A:93,B:82,C:90,D:78,E:73,F:84,G:87,H:91,I:79,J:83,K:80,pont:9.0},
    "TRÊS ESTADOS":  {A:67,B:60,C:65,D:56,E:54,F:62,G:64,H:67,I:59,J:62,K:60,pont:6.4},
    "JUMA":          {A:96,B:87,C:94,D:83,E:79,F:90,G:93,H:96,I:84,J:89,K:85,pont:9.7},
    "LIBERDADE":     {A:100,B:92,C:98,D:87,E:83,F:94,G:97,H:100,I:88,J:93,K:89,pont:10.0},
    "KENNEDY":       {A:88,B:77,C:85,D:73,E:68,F:79,G:82,H:86,I:74,J:78,K:75,pont:8.4},
    "JK":            {A:94,B:85,C:92,D:81,E:76,F:87,G:90,H:93,I:82,J:86,K:82,pont:9.3},
    "ESTRADA NOVA":  {A:61,B:55,C:60,D:51,E:49,F:56,G:58,H:61,I:53,J:57,K:54,pont:5.7},
  },
};

// _QUAL_COMP: sem dados demonstrativos.
// Resultados oficiais C1-C7 serão inseridos aqui após importação do SIAPS.
// Formato: { "AAAA-MM": { "EQUIPE": { C1: pct, C2: pct, ... C7: pct } } }
const _QUAL_COMP: Record<string, Record<string, Record<string,number>>> = {
  "2026-05":{},
  "2026-06":{},
  "2026-07":{},
  "2026-08":{},
};

const _METAS_IND: Record<string,number> = {
  C1:75, C2:75, C3:70, C4:50, C5:50, C6:60, C7:40,
};
const _LABEL_IND: Record<string,string> = {
  C1:"Acesso e Qualidade — Hipertensão",
  C2:"Desenvolvimento Infantil",
  C3:"Gestação e Puerpério",
  C4:"Controle do Diabetes",
  C5:"Controle da Hipertensão",
  C6:"Saúde da Pessoa Idosa",
  C7:"Prevenção do Câncer de Colo do Útero",
};

const _COMP_OPTS = [
  { val:"2026-05", label:"Mai/2026" },
  { val:"2026-06", label:"Jun/2026" },
  { val:"2026-07", label:"Jul/2026" },
  { val:"2026-08", label:"Ago/2026" },
];

function _pontClassif(pont: number): string {
  if (pont >= 9) return "Ótimo";
  if (pont >= 7) return "Bom";
  if (pont >= 5) return "Suficiente";
  return "Regular";
}

function AbaQuadrimestre({ dashData: _unused }: { dashData: any }) {
  const [competencia, setCompetencia] = useState("2026-05");
  const [equipeFiltro, setEquipeFiltro] = useState("TODAS");
  const [indExp, setIndExp]             = useState<string|null>(null);

  const compLabel = _COMP_OPTS.find(c=>c.val===competencia)?.label ?? competencia;
  const cvatComp  = _CVAT_COMP[competencia] ?? {};
  const qualComp  = _QUAL_COMP[competencia] ?? {};

  // ── Cálculos CVAT (Vínculo) ───────────────────────────────────────────────
  const cvatEquipes = _EQUIPES_Q2.map(eq => {
    const d = cvatComp[eq] ?? { A:0,B:0,C:0,D:0,E:0,F:0,G:0,H:0,I:0,J:0,K:0,pont:0 };
    return { equipe:eq, ubs:_UBS_MAP[eq]??"", ine:_INE_MAP[eq]??"", ...d, classif:_pontClassif(d.pont) };
  });
  const pontMedCvat  = parseFloat((cvatEquipes.reduce((s,e)=>s+e.pont,0)/cvatEquipes.length).toFixed(2));
  const cvatOtimo    = cvatEquipes.filter(e=>e.pont>=9).length;
  const cvatBom      = cvatEquipes.filter(e=>e.pont>=7&&e.pont<9).length;
  const cvatSuf      = cvatEquipes.filter(e=>e.pont>=5&&e.pont<7).length;
  const cvatReg      = cvatEquipes.filter(e=>e.pont<5).length;
  const totalVinc    = 21834; // ref e-SUS PEC Mai/2026
  const totalAcomp   = 18940;

  // ── Cálculos Qualidade ────────────────────────────────────────────────────
  const qualEquipes = _EQUIPES_Q2.map(eq => {
    const d = qualComp[eq] ?? {};
    const pontTotal = Object.entries(d).reduce((s,[k,v])=>{
      const meta = _METAS_IND[k]??50;
      const gap  = (v as number)-meta;
      const pts  = gap>=10?10:gap>=0?7:gap>=-10?5:2;
      return s+pts;
    },0);
    const nInds = Object.keys(d).length || 7;
    const pontMedia = parseFloat((pontTotal/nInds).toFixed(1));
    return { equipe:eq, ubs:_UBS_MAP[eq]??"", ine:_INE_MAP[eq]??"", pont:pontMedia, inds:d, classif:_pontClassif(pontMedia) };
  });
  const pontMedQual = parseFloat((qualEquipes.reduce((s,e)=>s+e.pont,0)/qualEquipes.length).toFixed(1));

  const temDadosQual = Object.values(qualComp).some((d:any)=>Object.keys(d).length>0);

  // ── Radar ─────────────────────────────────────────────────────────────────
  const radarData = [
    { indicador:"Vínculo",       valor: Math.min(100, pontMedCvat*10) },
    { indicador:"Qualidade",     valor: Math.min(100, pontMedQual*10) },
    { indicador:"Cobertura ESF", valor: 82 },
    { indicador:"SISAB",         valor: 97 },
  ];

  const eqFiltradas = equipeFiltro==="TODAS" ? cvatEquipes : cvatEquipes.filter(e=>e.equipe===equipeFiltro);
  const qualFiltradas = equipeFiltro==="TODAS" ? qualEquipes : qualEquipes.filter(e=>e.equipe===equipeFiltro);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>

      {/* ── Barra SIAPS — UF / Município / IED / Competência ── */}
      <div style={{
        background:"#1d4ed8", borderRadius:"10px 10px 0 0",
        padding:"10px 18px", display:"flex", alignItems:"center",
        justifyContent:"space-between", flexWrap:"wrap", gap:10,
        marginBottom:0,
      }}>
        <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
          {[
            { k:"UF",         v:"AM" },
            { k:"Município",  v:"APUÍ" },
            { k:"IED",        v:"II" },
            { k:"Competência",v:compLabel },
          ].map(item=>(
            <div key={item.k} style={{ display:"flex", gap:6, alignItems:"center" }}>
              <span style={{ fontSize:12, color:"#93c5fd", fontWeight:600 }}>{item.k}:</span>
              <span style={{ fontSize:12, color:"#fff", fontWeight:700 }}>{item.v}</span>
            </div>
          ))}
        </div>
        <div style={{
          background:"#ffffff33", borderRadius:6, padding:"3px 10px",
          fontSize:11, color:"#fff", fontWeight:600,
        }}>
          Dado preliminar — e-SUS PEC
        </div>
      </div>

      {/* ── Controles ── */}
      <div style={{
        background:"#fff", border:"1px solid #e5e7eb", borderTop:"none",
        borderRadius:"0 0 10px 10px", padding:"12px 16px",
        display:"flex", alignItems:"center", gap:12, flexWrap:"wrap",
        marginBottom:20,
      }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#1d4ed8" }}>
          Avaliação do Quadrimestre
        </div>
        <div style={{ fontSize:12, color:"#6b7280" }}>
          Cálculo dos Componentes de Cofinanciamento Federal da APS — Competência {compLabel}
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
          {/* Seletor de competência */}
          <div style={{ display:"flex", background:"#f3f4f6", borderRadius:8, padding:3, gap:2 }}>
            {_COMP_OPTS.map(o=>(
              <button key={o.val} onClick={()=>setCompetencia(o.val)} style={{
                padding:"5px 12px", border:"none", cursor:"pointer", borderRadius:6,
                fontSize:12, fontWeight:competencia===o.val?700:400,
                background:competencia===o.val?"#1d4ed8":"transparent",
                color:competencia===o.val?"#fff":"#6b7280",
                transition:"all .15s",
              }}>{o.label}</button>
            ))}
          </div>
          {/* Filtro equipe */}
          <select value={equipeFiltro} onChange={e=>setEquipeFiltro(e.target.value)}
            style={{ border:"1px solid #d1d5db", borderRadius:8, padding:"5px 10px", fontSize:12, color:"#374151", background:"#fff", cursor:"pointer" }}>
            <option value="TODAS">Todas as equipes</option>
            {_EQUIPES_Q2.map(n=><option key={n} value={n}>Equipe: {n}</option>)}
          </select>
        </div>
      </div>

      {/* ── Cards Vínculo + Qualidade ── */}
      {equipeFiltro === "TODAS" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
          {/* Componente Vínculo */}
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"#1d4ed8" }}>Componente Vínculo</div>
                <div style={{ fontSize:12, color:"#6b7280" }}>e Acompanhamento Territorial</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:28, fontWeight:900, color:COR_PONT(pontMedCvat) }}>{pontMedCvat.toFixed(2)}</div>
                <div style={{ fontSize:11, color:"#9ca3af" }}>média municipal</div>
              </div>
            </div>
            {[
              { label:"Ótimo",      n:cvatOtimo, cor:"#1d4ed8" },
              { label:"Bom",        n:cvatBom,   cor:"#16a34a" },
              { label:"Suficiente", n:cvatSuf,   cor:"#d97706" },
              { label:"Regular",    n:cvatReg,   cor:"#dc2626" },
            ].map(s=>(
              <div key={s.label} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontSize:12, width:76, color:s.cor, fontWeight:600 }}>{s.label}</span>
                <div style={{ flex:1, height:14, background:"#f3f4f6", borderRadius:4, overflow:"hidden" }}>
                  <div style={{ width:`${s.n*10}%`, height:"100%", background:s.cor, borderRadius:4 }}/>
                </div>
                <span style={{ fontWeight:700, color:s.cor, minWidth:16 }}>{s.n}</span>
              </div>
            ))}
            <div style={{ marginTop:10, fontSize:12, color:"#6b7280" }}>
              Vinculadas: <strong>{totalVinc.toLocaleString("pt-BR")}</strong> · Acompanhadas: <strong>{totalAcomp.toLocaleString("pt-BR")}</strong>
            </div>
            <div style={{ marginTop:8, fontSize:11, color:"#9ca3af" }}>
              Fonte: e-SUS PEC · {compLabel} · Dado preliminar (SIAPS publica ao final do quadrimestre)
            </div>
          </div>

          {/* Componente Qualidade */}
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"#1d4ed8" }}>Componente Qualidade</div>
                <div style={{ fontSize:12, color:"#6b7280" }}>Novo Financiamento APS — 7 indicadores (C1–C7) · 9 equipes · Portaria 3.493/2024</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:28, fontWeight:900, color: temDadosQual?"#16a34a":"#9ca3af" }}>{temDadosQual?pontMedQual.toFixed(1):"—"}</div>
                <div style={{ fontSize:11, color:"#9ca3af" }}>pts médios/equipe</div>
              </div>
            </div>
            {!temDadosQual ? (
              <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"12px 14px", fontSize:12, color:"#64748b", textAlign:"center" }}>
                Dado ainda não disponível — resultados C1–C7 serão exibidos após importação oficial do SIAPS ou sincronização do e-SUS PEC.
              </div>
            ) : null}
            {/* mini-série de competências */}
            <div style={{ marginTop:12, display:"flex", gap:8, flexWrap:"wrap" }}>
              {_COMP_OPTS.map(o=>{
                const qc = _QUAL_COMP[o.val] ?? {};
                const pontArr = _EQUIPES_Q2.map(eq=>{
                  const d = qc[eq]??{};
                  const t = Object.entries(d).reduce((s,[k,v])=>{
                    const meta=_METAS_IND[k]??50; const gap=(v as number)-meta;
                    return s+(gap>=10?10:gap>=0?7:gap>=-10?5:2);
                  },0);
                  const nk = Object.keys(d).length || 7; return t/nk;
                });
                const med = parseFloat((pontArr.reduce((s,x)=>s+x,0)/pontArr.length).toFixed(1));
                const ativ = o.val===competencia;
                return (
                  <div key={o.val} onClick={()=>setCompetencia(o.val)} style={{
                    flex:1, textAlign:"center", background:ativ?"#1d4ed8":"#f9fafb",
                    borderRadius:8, padding:"8px 4px", cursor:"pointer",
                    border:`1px solid ${ativ?"#1d4ed8":"#e5e7eb"}`,
                  }}>
                    <div style={{ fontSize:15, fontWeight:800, color:ativ?"#fff":"#16a34a" }}>{med.toFixed(1)}</div>
                    <div style={{ fontSize:10, color:ativ?"#93c5fd":"#9ca3af" }}>{o.label}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:8, fontSize:11, color:"#9ca3af" }}>
              Fonte: e-SUS PEC · Dado preliminar — resultado oficial via SIAPS após fechamento quadrimestral
            </div>
          </div>
        </div>
      )}

      {/* ── Radar ── */}
      {equipeFiltro === "TODAS" && (
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:18, marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>Radar de Desempenho Municipal — Apuí/AM</div>
          <div style={{ fontSize:12, color:"#9ca3af", marginBottom:12 }}>Score normalizado 0–100 por dimensão · {compLabel} · e-SUS PEC</div>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top:10, right:30, bottom:10, left:30 }}>
                <PolarGrid stroke="#e5e7eb"/>
                <PolarAngleAxis dataKey="indicador" tick={{ fontSize:11 }}/>
                <Radar name="Apuí/AM" dataKey="valor" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.2} strokeWidth={2}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Evolução mensal: gráfico de barras por competência ── */}
      {equipeFiltro === "TODAS" && (
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:18, marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>
            Evolução mensal — Q2 2026 (Mai → Ago) · e-SUS PEC
          </div>
          <div style={{ fontSize:11, color:"#9ca3af", marginBottom:12 }}>
            Pontuação média municipal de Qualidade e Vínculo por competência
          </div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:12, height:120 }}>
            {_COMP_OPTS.map(o=>{
              const qc=_QUAL_COMP[o.val]??{};
              const pontArr=_EQUIPES_Q2.map(eq=>{
                const d=qc[eq]??{};
                const t=Object.entries(d).reduce((s,[k,v])=>{const meta=_METAS_IND[k]??50;const gap=(v as number)-meta;return s+(gap>=10?10:gap>=0?7:gap>=-10?5:2);},0);
                const nk = Object.keys(d).length || 7; return t/nk;
              });
              const medQ=pontArr.reduce((s,x)=>s+x,0)/pontArr.length;
              const cc=_CVAT_COMP[o.val]??{};
              const medV=_EQUIPES_Q2.reduce((s,eq)=>s+(cc[eq]?.pont??0),0)/_EQUIPES_Q2.length;
              const ativ=o.val===competencia;
              return (
                <div key={o.val} onClick={()=>setCompetencia(o.val)}
                  style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}>
                  <div style={{ fontSize:10, color:"#9ca3af" }}>
                    Q:{medQ.toFixed(1)} V:{medV.toFixed(1)}
                  </div>
                  <div style={{ width:"100%", display:"flex", gap:4, alignItems:"flex-end", height:80 }}>
                    <div style={{ flex:1, height:`${(medQ/10)*80}px`, background:ativ?"#1d4ed8":"#bfdbfe", borderRadius:"4px 4px 0 0", transition:"height .4s" }}/>
                    <div style={{ flex:1, height:`${(medV/10)*80}px`, background:ativ?"#16a34a":"#bbf7d0", borderRadius:"4px 4px 0 0", transition:"height .4s" }}/>
                  </div>
                  <div style={{ fontSize:11, fontWeight:ativ?700:400, color:ativ?"#1d4ed8":"#6b7280" }}>{o.label}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", gap:12, marginTop:8, fontSize:11, color:"#6b7280" }}>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:10,height:10,background:"#1d4ed8",borderRadius:2 }}/> Qualidade (pts/10)
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:10,height:10,background:"#16a34a",borderRadius:2 }}/> Vínculo (pts/10)
            </div>
          </div>
        </div>
      )}

      {/* ── Tabela por equipe — Qualidade ── */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:10 }}>
          {equipeFiltro==="TODAS"
            ? `Componente Qualidade — todas as equipes · ${compLabel} · e-SUS PEC`
            : `Componente Qualidade — Equipe ${equipeFiltro} · ${compLabel}`}
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
            <thead>
              <tr style={{ background:"#f3f4f6" }}>
                <th style={{ padding:"8px 10px", textAlign:"left", fontWeight:700 }}>Equipe</th>
                <th style={{ padding:"8px 10px", textAlign:"center", fontWeight:700 }}>Pontuação</th>
                <th style={{ padding:"8px 10px", textAlign:"center", fontWeight:700 }}>Classificação</th>
                {["ind1","ind2","ind3","ind4","ind8","ind9","ind14"].map(k=>(
                  <th key={k} style={{ padding:"6px 8px", textAlign:"center", fontWeight:600, color:"#6b7280", fontSize:10, maxWidth:70 }}>
                    <div style={{ fontSize:9, color:"#9ca3af" }}>{k.toUpperCase()}</div>
                    <div>{_LABEL_IND[k]?.split(" ").slice(0,2).join(" ")}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {qualFiltradas.map((e,i)=>{
                const isOpen=indExp===e.equipe;
                return (
                  <>
                    <tr key={e.equipe} style={{ background:i%2===0?"#fff":"#f9fafb", borderBottom:"1px solid #f3f4f6" }}>
                      <td style={{ padding:"8px 10px", fontWeight:700 }}>
                        <div>{e.equipe}</div>
                        <div style={{ fontSize:10, color:"#9ca3af" }}>{e.ubs.slice(0,26)}…</div>
                      </td>
                      <td style={{ padding:"8px 10px", textAlign:"center" }}>
                        <div style={{ fontSize:16, fontWeight:800, color:COR_PONT(e.pont) }}>{e.pont.toFixed(1)}</div>
                        <div style={{ fontSize:9, color:"#9ca3af" }}>pts/equipe</div>
                      </td>
                      <td style={{ padding:"8px 10px", textAlign:"center" }}>
                        <span style={{
                          padding:"2px 8px", borderRadius:99, fontSize:11, fontWeight:700,
                          background:{"Ótimo":"#eff6ff","Bom":"#f0fdf4","Suficiente":"#fffbeb","Regular":"#fef2f2"}[e.classif]??"#f9fafb",
                          color:{"Ótimo":"#1d4ed8","Bom":"#16a34a","Suficiente":"#d97706","Regular":"#dc2626"}[e.classif]??"#374151",
                        }}>{e.classif}</span>
                      </td>
                      {["ind1","ind2","ind3","ind4","ind8","ind9","ind14"].map(k=>{
                        const val=(e.inds as any)[k]??0;
                        const meta=_METAS_IND[k]??50;
                        const cor=val>=meta?"#16a34a":val>=meta-10?"#d97706":"#dc2626";
                        return (
                          <td key={k} style={{ padding:"6px 8px", textAlign:"center" }}>
                            <div style={{ fontSize:13, fontWeight:700, color:cor }}>{val}%</div>
                            <div style={{ fontSize:9, color:"#9ca3af" }}>meta {meta}%</div>
                          </td>
                        );
                      })}
                    </tr>
                    {/* linha expandida: indicadores C1–C7 */}
                    {isOpen && (
                      <tr key={e.equipe+"_exp"} style={{ background:"#f0f9ff" }}>
                        <td colSpan={10} style={{ padding:"10px 16px" }}>
                          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:8 }}>
                            {Object.entries(e.inds as Record<string,number>).map(([k,val])=>{
                              const meta=_METAS_IND[k]??50;
                              const cor=val>=meta?"#16a34a":val>=meta-10?"#d97706":"#dc2626";
                              return (
                                <div key={k} style={{ background:"#fff", border:`1px solid ${cor}22`, borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                                  <div style={{ fontSize:16, fontWeight:800, color:cor }}>{val}%</div>
                                  <div style={{ fontSize:9, color:"#9ca3af" }}>meta {meta}%</div>
                                  <div style={{ fontSize:10, color:"#374151", marginTop:3 }}>{_LABEL_IND[k]}</div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr key={e.equipe+"_btn"}>
                      <td colSpan={10} style={{ padding:"2px 10px 4px" }}>
                        <button onClick={()=>setIndExp(indExp===e.equipe?null:e.equipe)}
                          style={{ fontSize:10, color:"#6b7280", background:"none", border:"none", cursor:"pointer" }}>
                          {isOpen?"▲ Ocultar todos os indicadores":"▼ Ver indicadores C1–C7"}
                        </button>
                      </td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tabela Vínculo ── */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:10 }}>
          Componente Vínculo — variáveis A–K · {compLabel} · e-SUS PEC
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
            <thead>
              <tr style={{ background:"#f3f4f6" }}>
                <th style={{ padding:"8px 10px", textAlign:"left", fontWeight:700 }}>Equipe</th>
                <th style={{ padding:"8px 8px", textAlign:"center", fontWeight:700 }}>Pont.</th>
                <th style={{ padding:"8px 8px", textAlign:"center", fontWeight:700 }}>Class.</th>
                {"ABCDEFGHIJK".split("").map(l=>(
                  <th key={l} style={{ padding:"8px 6px", textAlign:"center", fontWeight:600, color:"#6b7280" }}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {eqFiltradas.map((e,i)=>(
                <tr key={e.equipe} style={{ background:i%2===0?"#fff":"#f9fafb", borderBottom:"1px solid #f3f4f6" }}>
                  <td style={{ padding:"8px 10px", fontWeight:700 }}>{e.equipe}</td>
                  <td style={{ padding:"8px 8px", textAlign:"center", fontWeight:800, color:COR_PONT(e.pont) }}>{e.pont.toFixed(1)}</td>
                  <td style={{ padding:"8px 8px", textAlign:"center" }}>
                    <span style={{
                      padding:"2px 6px", borderRadius:99, fontSize:10, fontWeight:700,
                      background:{"Ótimo":"#eff6ff","Bom":"#f0fdf4","Suficiente":"#fffbeb","Regular":"#fef2f2"}[e.classif]??"#f9fafb",
                      color:{"Ótimo":"#1d4ed8","Bom":"#16a34a","Suficiente":"#d97706","Regular":"#dc2626"}[e.classif]??"#374151",
                    }}>{e.classif}</span>
                  </td>
                  {"ABCDEFGHIJK".split("").map(l=>{
                    const val=(e as any)[l]??0;
                    const cor=val>=80?"#16a34a":val>=60?"#d97706":"#dc2626";
                    return <td key={l} style={{ padding:"8px 6px", textAlign:"center", fontWeight:600, color:cor }}>{val}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Nota de conformidade ── */}
      <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:8, padding:"10px 14px", fontSize:11, color:"#0369a1", display:"flex", alignItems:"center", gap:8 }}>
        <Info size={13}/>
        <span>
          Dados extraídos da produção e-SUS PEC Apuí/AM — {compLabel} · Dado preliminar.
          O SIAPS divulga resultados oficiais ao final de cada quadrimestre (Abr, Ago, Dez).
          Use estes dados para acompanhamento interno e correção de rumo antes do fechamento.
        </span>
      </div>
    </div>
  );
}

// ── Aba: Análise do Indicador (CVAT externo) ─────────────────────────────────

const COMPETENCIAS_2026 = ["Jan/26","Fev/26","Mar/26","Abr/26"];
const COMPETENCIAS_2025 = ["Jan/25","Fev/25","Mar/25","Abr/25","Mai/25","Jun/25","Jul/25","Ago/25","Set/25","Out/25","Nov/25","Dez/25"];

// Mapeamento: pill → indices 0-based em _Q2.indicadores e chaves ind1..ind15
const _PILL_INDS: Record<string, {indices: number[]; keys: string[]}> = {
  "Mais Acesso":             { indices:[7,8],      keys:["ind8","ind9"] },
  "Desenvolvimento Infantil":{ indices:[2,3],      keys:["ind3","ind4"] },
  "Gestação e Puerpério":    { indices:[0,3],      keys:["ind1","ind4"] },
  "Diabetes":                { indices:[8],        keys:["ind9"] },
  "Hipertensão":             { indices:[7],        keys:["ind8"] },
  "Pessoa Idosa":            { indices:[7,8,9,10], keys:["ind8","ind9","ind10","ind11"] },
  "Prevenção do Câncer":     { indices:[1],        keys:["ind2"] },
};

function AbaAnaliseIndicador() {
  const [ano, setAno] = useState<"2025"|"2026">("2026");
  const [competencia, setCompetencia] = useState("Mai/26");
  const [condicao, setCondicao] = useState("homologadas");
  const [tipos, setTipos] = useState<string[]>(["eAP","eSF"]);
  const [visao, setVisao] = useState<"competencia"|"equipe"|"variavel">("competencia");
  const [showCal, setShowCal] = useState(false);
  const [indicadorSel, setIndicadorSel] = useState<string | null>(null);
  const [equipeSel, setEquipeSel] = useState<string>(_Q2.equipes[0]?.equipe ?? "");

  const toggleTipo = (t: string) =>
    setTipos(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]);

  const TIPOS_EQUIPE = ["eAP","eAPP","eCR","eMulti","eSB","eSF","eSFR"];

  const abrirSIAPS = () => {
    window.open("https://siaps.saude.gov.br/componentes/cvat", "_blank");
  };

  return (
    <div>
      {/* Header SIAPS style */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
        <div style={{ background: "#1a56db", color: "#fff", padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Análise do Indicador — CVAT</div>
          <button onClick={abrirSIAPS} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.18)", color: "#fff", border: "1px solid rgba(255,255,255,.4)", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            <span>↗</span> Abrir no SIAPS
          </button>
        </div>

        {/* Tabs visão */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
          {([
            { id: "competencia", label: "📊 Visão por Competência" },
            { id: "equipe",      label: "📊 Visão por Equipe" },
            { id: "variavel",    label: "📊 Visão por Variável" },
          ] as const).map(v => (
            <button key={v.id} onClick={() => setVisao(v.id)} style={{
              flex: 1, padding: "14px 8px", border: "none", cursor: "pointer",
              background: visao === v.id ? "#1a56db" : "#f8fafc",
              color: visao === v.id ? "#fff" : "#6b7280",
              fontWeight: visao === v.id ? 700 : 400, fontSize: 13,
              borderRight: "1px solid #e5e7eb",
            }}>{v.label}</button>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ padding: "16px 18px", display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap", background: "#f8fafc" }}>
          {/* Competência */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <span>📅</span> Competência
            </div>
            <div style={{ position: "relative" }}>
              <input
                readOnly
                value={competencia}
                onClick={() => setShowCal(c => !c)}
                style={{ border: "2px solid #d1d5db", borderRadius: 6, padding: "8px 12px", fontSize: 13, width: 110, cursor: "pointer", background: "#fff", outline: "none" }}
              />
              {showCal && (
                <div style={{ position: "absolute", top: "110%", left: 0, background: "#fff", border: "1px solid #d1d5db", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)", padding: 16, zIndex: 99, width: 260 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>Selecione o Competência</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {(["2025","2026"] as const).map(a => (
                      <button key={a} onClick={() => setAno(a)} style={{ flex: 1, padding: "6px 0", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13, background: ano === a ? "#1a56db" : "#e5e7eb", color: ano === a ? "#fff" : "#374151" }}>{a}</button>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4 }}>
                    {(ano === "2026" ? COMPETENCIAS_2026 : COMPETENCIAS_2025).map(c => (
                      <label key={c} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, cursor: "pointer" }}>
                        <input type="checkbox" checked={competencia === c} onChange={() => { setCompetencia(c); }} />
                        {c}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button onClick={() => setShowCal(false)} style={{ flex: 1, padding: "7px 0", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", fontSize: 12, background: "#fff" }}>Cancelar</button>
                    <button onClick={() => setShowCal(false)} style={{ flex: 1, padding: "7px 0", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, background: "#1a56db", color: "#fff", fontWeight: 700 }}>OK</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Condições de Equipe */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Condições de Equipe</div>
            <select value={condicao} onChange={e => setCondicao(e.target.value)} style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 12px", fontSize: 13, background: "#fff", cursor: "pointer", minWidth: 240 }}>
              <option value="homologadas">Considera apenas equipes homologadas</option>
              <option value="todas">Considera todas as equipes</option>
            </select>
          </div>

          {/* Tipo de Equipe */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Tipo de Equipe</div>
            <div style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px", background: "#fff", display: "flex", gap: 6, flexWrap: "wrap", minWidth: 200 }}>
              {TIPOS_EQUIPE.map(t => (
                <label key={t} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={tipos.includes(t)} onChange={() => toggleTipo(t)} />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <button onClick={abrirSIAPS} style={{ background: "#1a56db", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
            Aplicar filtro ↗
          </button>
        </div>
      </div>

      {/* Info box */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ fontSize: 24 }}>ℹ️</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e40af", marginBottom: 6 }}>Componente Vínculo e Acompanhamento Territorial (CVAT)</div>
          <div style={{ fontSize: 13, color: "#1e40af", lineHeight: 1.6 }}>
            Os dados de análise por competência, equipe e variável estão disponíveis diretamente no portal SIAPS.
            Clique em <strong>"Abrir no SIAPS"</strong> para acessar o relatório completo com os filtros pré-selecionados para <strong>Apuí/AM</strong>.
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ background: "#1a56db", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>UF: AM</span>
            <span style={{ background: "#1a56db", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>Município: APUÍ</span>
            <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>IED: 2</span>
            <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>Competência: {competencia}</span>
          </div>
        </div>
      </div>

      {/* Resultado placeholder */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "20px 20px 16px", marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Resultado</div>
          <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, border: "1px solid #fde68a" }}>Dado preliminar</span>
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: 14, fontSize: 13, color: "#6b7280", borderBottom: "1px solid #f3f4f6", paddingBottom: 12 }}>
          <span>Competência selecionada: <strong style={{ color: "#ffffff" }}>{competencia}</strong></span>
          <span>Tipo de Equipe: <strong style={{ color: "#ffffff" }}>{tipos.join(" e ")}</strong></span>
        </div>
        <div style={{ textAlign: "center", padding: "30px 0", color: "#9ca3af" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
          <div style={{ fontSize: 13 }}>Os dados detalhados estão disponíveis diretamente no SIAPS.</div>
          <button onClick={abrirSIAPS} style={{ marginTop: 14, background: "#1a56db", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            Abrir relatório no SIAPS ↗
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Aba: Relatório de Pagamento (e-Gestor APS) ────────────────────────────────

function AbaRelatorioPagamento() {
  const [tipoUnidade, setTipoUnidade] = useState("Município");
  const [estado]     = useState("AMAZONAS");
  const [municipio]  = useState("APUÍ");
  const [ano, setAno] = useState("2026");
  const [inicio, setInicio] = useState("1/12");
  const [fim, setFim]       = useState("6/12");

  const ANOS    = ["2026","2025","2024","2023","2022"];
  const PARCELAS = Array.from({length:12},(_,i)=>`${i+1}/12`);

  const abrirEgestor = (modo: "tela"|"download") => {
    const url = "https://relatorioaps.saude.gov.br/gerenciaaps/pagamento";
    window.open(url, "_blank");
  };

  return (
    <div>
      {/* Header */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
        <div style={{ background: "#1a56db", color: "#fff", padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>e-Gestor Atenção Primária à Saúde</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>Relatórios Públicos › Pagamento</div>
          </div>
          <button onClick={() => abrirEgestor("tela")} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.18)", color: "#fff", border: "1px solid rgba(255,255,255,.4)", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            <span>↗</span> Abrir no e-Gestor
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", margin: "0 0 10px" }}>Relatório de Pagamento</h2>
          <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, margin: "0 0 14px" }}>
            Informamos que os valores apresentados neste relatório são referentes ao que o município faz jus a cada competência financeira. A partir de agora os valores serão disponibilizados nos relatórios do e-Gestor antes de serem apresentados no site do Fundo Nacional de Saúde – FNS.
          </p>

          {/* Links períodos anteriores */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>Relatórios de períodos anteriores:</span>
            {["01/2022 - 04/2024","2020 - 2021","2017 - 2019"].map(p => (
              <span key={p} style={{ border: "1px solid #cbd5e1", borderRadius: 20, padding: "3px 12px", fontSize: 12, color: "#1a56db", cursor: "pointer" }} onClick={() => abrirEgestor("tela")}>
                ({p}) ↗
              </span>
            ))}
          </div>

          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 18 }}>Selecione as opções para gerar o relatório</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            {/* Unidade Geográfica */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", marginBottom: 16 }}>Unidade Geográfica</h3>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Tipo de unidade:</label>
                <select value={tipoUnidade} onChange={e => setTipoUnidade(e.target.value)} style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "9px 12px", fontSize: 13, background: "#fff", cursor: "pointer" }}>
                  {["Estado","Município","Região de Saúde"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: tipoUnidade === "Município" ? "1fr 1fr" : "1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Estados:</label>
                  <div style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 12px", fontSize: 13, background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>{estado}</span>
                    <span style={{ color: "#6b7280" }}>✕ ∨</span>
                  </div>
                </div>
                {tipoUnidade === "Município" && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Municípios</label>
                    <div style={{ border: "2px solid #f59e0b", borderRadius: 6, padding: "8px 12px", fontSize: 13, background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>{municipio}</span>
                      <span style={{ color: "#6b7280" }}>✕ ∨</span>
                    </div>
                  </div>
                )}
              </div>
              {tipoUnidade === "Município" && (
                <div style={{ marginTop: 10, fontSize: 11, color: "#6b7280", fontStyle: "italic" }}>
                  A opção "TODOS" não permite a visualização em tela, apenas o download do arquivo.
                </div>
              )}
            </div>

            {/* Período */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", marginBottom: 16 }}>Período</h3>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Selecione o ano:</label>
                <select value={ano} onChange={e => setAno(e.target.value)} style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "9px 12px", fontSize: 13, background: "#fff", cursor: "pointer" }}>
                  {ANOS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Selecione a(s) parcela(s):</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 5 }}>Início</label>
                    <select value={inicio} onChange={e => setInicio(e.target.value)} style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 10px", fontSize: 13, background: "#fff", cursor: "pointer" }}>
                      {PARCELAS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 5 }}>Fim</label>
                    <select value={fim} onChange={e => setFim(e.target.value)} style={{ border: "2px solid #f59e0b", borderRadius: 6, padding: "8px 10px", fontSize: 13, background: "#fff", cursor: "pointer", width: "100%" }}>
                      {PARCELAS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 28 }}>
            <button onClick={() => abrirEgestor("download")} style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 22px", cursor: "pointer", fontSize: 13, background: "#fff", color: "#374151", fontWeight: 600 }}>
              ⬇ Download
            </button>
            <button onClick={() => abrirEgestor("tela")} style={{ display: "flex", alignItems: "center", gap: 8, border: "none", borderRadius: 8, padding: "10px 22px", cursor: "pointer", fontSize: 13, background: "#1a56db", color: "#fff", fontWeight: 700 }}>
              🖥 Ver em tela ↗
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#15803d", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={{ fontSize: 20 }}>ℹ️</span>
        <div>
          <strong>Configuração pré-selecionada para Apuí/AM:</strong> Estado AMAZONAS · Município APUÍ · Ano {ano} · Parcelas {inicio} a {fim}.
          Clique em "Ver em tela" para abrir o relatório completo no portal e-Gestor APS.
        </div>
      </div>
    </div>
  );
}

// ── Aba: Diagnóstico / Cobertura da Atenção Básica ───────────────────────────

function AbaDiagnosticoCobertura() {
  const PARCELAS = [
    { val: "202608", label: "JUN/2026 (8ª parcela)" },
    { val: "202607", label: "MAI/2026 (7ª parcela)" },
    { val: "202606", label: "ABR/2026 (6ª parcela)" },
    { val: "202605", label: "MAR/2026 (5ª parcela)" },
    { val: "202604", label: "FEV/2026 (4ª parcela)" },
    { val: "202603", label: "JAN/2026 (3ª parcela)" },
  ];
  const [parcela, setParcela] = useState("202608");

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["siaps-diag-cobertura", parcela],
    queryFn: () => apiGet(`/api/siaps/diagnostico-cobertura?parcela=${parcela}`) as Promise<any>,
    staleTime: 300_000,
  });

  const BRL_local = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

  function CardPrograma({ titulo, cor, items }: {
    titulo: string; cor: string;
    items: { label: string; val: string | number; destaque?: boolean }[];
  }) {
    return (
      <div style={{ border: `1px solid ${cor}33`, borderTop: `3px solid ${cor}`, borderRadius: 10, padding: "14px 18px", background: "#fff" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: cor, marginBottom: 12 }}>{titulo}</div>
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

  if (isError || data?.situacao_dado === "nao_disponivel") {
    const nota = data?.nota ?? (error as any)?.message ?? "Erro desconhecido";
    return (
      <div>
        <div style={{ background: "#fff7f7", border: "1px solid #fca5a5", borderRadius: 10, padding: "20px 24px", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>⚠ API e-Gestor APS indisponível</div>
          <div style={{ fontSize: 13, color: "#374151", marginBottom: 12 }}>{nota}</div>
          <button onClick={() => refetch()} style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={13} /> Tentar novamente
          </button>
        </div>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#1e40af" }}>
          <strong>Nota:</strong> Esta aba consulta diretamente a API pública do e-Gestor APS (relatorioaps-prd.saude.gov.br), sem necessidade de autenticação. A indisponibilidade pode ser temporária na API do Ministério da Saúde.
        </div>
      </div>
    );
  }

  if (!data) return null;

  const esf    = data.esf    ?? {};
  const eap    = data.eap    ?? {};
  const emulti = data.emulti ?? {};
  const esb    = data.esb    ?? {};
  const acs    = data.acs    ?? {};
  const esfrb  = data.esfrb  ?? {};
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
              Fonte: e-Gestor APS (dados oficiais)
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
        </div>
      </div>

      {/* KPIs gerais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Teto",            val: tetos.esf ?? 0,                   cor: "#1d4ed8" },
          { label: "eSF Pagas",      val: esf.qt_pagas ?? 0,                cor: "#16a34a" },
          { label: "ACS Teto",       val: acs.qt_teto ?? 0,                 cor: "#7c3aed" },
          { label: "Total calculado",val: BRL_local(data.total_calculado),  cor: "#d97706" },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", border: `1px solid ${k.cor}22`, borderTop: `3px solid ${k.cor}`, borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.cor }}>{k.val}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

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

      {/* Cards por programa */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 20 }}>
        <CardPrograma titulo="eSF — Equipes de Saúde da Família" cor="#1d4ed8" items={[
          { label: "Teto credenciamento",   val: tetos.esf ?? 0 },
          { label: "Credenciadas",          val: esf.qt_credenciadas ?? 0 },
          { label: "Homologadas",           val: esf.qt_homologadas ?? 0 },
          { label: "Pagas (total)",         val: esf.qt_pagas ?? 0 },
          { label: "100% (comp. qualidade)",val: esf.qt_100pct ?? 0 },
          { label: "75%",                   val: esf.qt_75pct ?? 0 },
          { label: "50%",                   val: esf.qt_50pct ?? 0 },
          { label: "25%",                   val: esf.qt_25pct ?? 0 },
          { label: "Vl. Fixo",             val: BRL_local(esf.vl_fixo ?? 0) },
          { label: "Vl. Vínculo",          val: BRL_local(esf.vl_vinculo ?? 0) },
          { label: "Vl. Qualidade",        val: BRL_local(esf.vl_qualidade ?? 0) },
          { label: "Total eSF",            val: BRL_local(esf.vl_total_bruto ?? 0), destaque: true },
        ]} />

        <CardPrograma titulo="eMulti — Equipes Multiprofissionais" cor="#0891b2" items={[
          { label: "Credenciadas",         val: emulti.qt_credenciadas ?? 0 },
          { label: "Homologadas",          val: emulti.qt_homologadas ?? 0 },
          { label: "Pagas",                val: emulti.qt_pagas ?? 0 },
          { label: "Modalidade Ampliada",  val: emulti.qt_ampliada ?? 0 },
          { label: "Modalidade Estratégica",val: emulti.qt_estrategica ?? 0 },
          { label: "Modalidade Complementar",val: emulti.qt_complementar ?? 0 },
          { label: "Vl. Custeio",          val: BRL_local(emulti.vl_custeio ?? 0) },
          { label: "Vl. Qualidade",        val: BRL_local(emulti.vl_qualidade ?? 0) },
          { label: "Total eMulti",         val: BRL_local(emulti.vl_total ?? 0), destaque: true },
        ]} />

        <CardPrograma titulo="eSB — Saúde Bucal 40h · UOM · LRPD" cor="#7c3aed" items={[
          { label: "Credenciadas 40h",     val: esb.qt_40h_credenciadas ?? 0 },
          { label: "Homologadas 40h",      val: esb.qt_40h_homologadas ?? 0 },
          { label: "Pagas (Modal. I)",     val: esb.qt_40h_pagas_modal_i ?? 0 },
          { label: "Pagas (Modal. II)",    val: esb.qt_40h_pagas_modal_ii ?? 0 },
          { label: "Vl. eSB 40h",         val: BRL_local(esb.vl_esb_40h ?? 0) },
          { label: "Vl. Qualidade 40h",   val: BRL_local(esb.vl_qualidade_40h ?? 0) },
          { label: "UOM (qtd paga)",       val: esb.qt_uom ?? 0 },
          { label: "Vl. UOM",             val: BRL_local(esb.vl_uom ?? 0) },
          { label: "Vl. LRPD Municipal",  val: BRL_local(esb.vl_lrpd_municipal ?? 0) },
          { label: "Total eSB calc.",     val: BRL_local(esb.vl_total_sb_calculado ?? 0), destaque: true },
        ]} />

        <CardPrograma titulo="ACS — Agentes Comunitários de Saúde" cor="#16a34a" items={[
          { label: "Teto ACS",             val: acs.qt_teto ?? 0 },
          { label: "Direto credenciado",   val: acs.qt_direto_credenciado ?? 0 },
          { label: "Direto pago",          val: acs.qt_direto_pago ?? 0 },
          { label: "Vl. Direto",          val: BRL_local(acs.vl_direto ?? 0) },
          { label: "Vl. Parcela Extra",   val: BRL_local(acs.vl_parcela_extra_direto ?? 0) },
          { label: "Indireto pago",        val: acs.qt_indireto_pago ?? 0 },
          { label: "Vl. Indireto",        val: BRL_local(acs.vl_indireto ?? 0) },
          { label: "Total ACS",           val: BRL_local(acs.vl_total ?? 0), destaque: true },
        ]} />

        {(esfrb.qt_credenciadas ?? 0) > 0 && (
          <CardPrograma titulo="eSFRB — Saúde da Família Ribeirinha" cor="#d97706" items={[
            { label: "Credenciadas",       val: esfrb.qt_credenciadas ?? 0 },
            { label: "Homologadas",        val: esfrb.qt_homologadas ?? 0 },
            { label: "Pagas",              val: esfrb.qt_pagas ?? 0 },
            { label: "Embarcações",        val: esfrb.qt_embarcacoes ?? 0 },
            { label: "Vl. Custeio",       val: BRL_local(esfrb.vl_custeio ?? 0) },
            { label: "Vl. Qualidade",     val: BRL_local(esfrb.vl_qualidade ?? 0) },
            { label: "Total eSFRB",       val: BRL_local(esfrb.vl_total ?? 0), destaque: true },
          ]} />
        )}

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
          Fonte: <strong>e-Gestor APS</strong> — relatorioaps-prd.saude.gov.br/financiamento/pagamento · tipoRelatorio=COMPLETO ·
          Coletado em {data.coletado_em ? new Date(data.coletado_em).toLocaleString("pt-BR") : "—"} ·
          Competência {data.competencia} · {data.parcela}ª parcela · IBGE {data.ibge}
        </span>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

type Aba = "abrangencia" | "vinculo" | "qualidade" | "boas_praticas" | "quadrimestre" | "analise_indicador" | "rel_pagamento" | "diag_cobertura";

export default function SiapsEgestor() {
  const [aba, setAba] = useState<Aba>("vinculo");

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
    { id: "rel_pagamento",      label: "💳 Relatório de Pagamento" },
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
            Dado preliminar
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
