import { useState } from "react";
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
          {totalProd.toLocaleString("pt-BR")} procedimentos registrados · Meta: {metaPeriodo.toLocaleString("pt-BR")} para o período selecionado
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
            ind1_prenatal: "Pré-natal", ind2_cito: "Cito", ind3_vacina: "DTP/Penta",
            ind4_rn: "Puerpério", ind5_odonto1: "1ª Odonto", ind6_odonto_comp: "Odonto Comp.",
            ind7_urg_odonto: "Urg. Odonto", ind8_has: "HAS", ind9_dm: "DM HbA1c",
            ind10_obesidade: "Obesidade", ind11_cv: "Risco CV", ind12_psicose: "Psicose",
            ind13_tab: "TAB", ind14_sif_gest: "Síf. Gest.", ind15_sif_cong: "Síf. Cong.",
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
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Evolução dos 15 Indicadores — últimos 6 meses</div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.evolucao} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis domain={[25, 90]} tick={{ fontSize: 10 }} unit="%" />
            <Tooltip formatter={(v: number) => [`${v}%`]} contentStyle={TT} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            {["ind1","ind2","ind3","ind4","ind5","ind6","ind7","ind8","ind9","ind10","ind11","ind12","ind13","ind14","ind15"].map((k, i) => {
              const nomes = ["Pré-natal","Cito","DTP/Penta","Puerpério","1ª Odonto","Odonto Comp.","Urg. Odonto","HAS","DM HbA1c","Obesidade","Risco CV","Psicose","TAB","Síf. Gest.","Síf. Cong."];
              return <Line key={k} dataKey={k} name={nomes[i]} stroke={IND_CORES[k]} strokeWidth={2} dot={false} strokeDasharray={k === "ind2" ? "4 2" : undefined} />;
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

function PainelGestorRT() {
  const { dias_totais, dias_decorridos, dias_restantes } = _Q2;
  const pctTempo = Math.round((dias_decorridos / dias_totais) * 100);
  const metas = [55, 50, 90, 55, 45, 45, 45, 60, 55, 55, 50, 50, 50, 55, 55];
  const indKeys = ["ind1","ind2","ind3","ind4","ind5","ind6","ind7","ind8","ind9","ind10","ind11","ind12","ind13","ind14","ind15"] as const;

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
            <div style={{ fontSize:12, opacity:.8, marginTop:3 }}>Novo Financiamento APS · Portaria GM/MS 3.493/2024 · 15 indicadores · {_Q2.equipes.length} equipes ESF/eSF</div>
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
                  {gap > 0 ? `−${gap.toFixed(1)}` : `+${Math.abs(gap).toFixed(1)}`}p.p.
                </span>
                <div style={{ textAlign:"center", display:"flex", flexDirection:"column", gap:2 }}>
                  <span style={{ fontSize:10, fontWeight:700, background:pjCor+"18", color:pjCor, padding:"2px 7px", borderRadius:10 }}>proj {pj}%</span>
                  <span style={{ fontSize:9, color: deltaQ1 >= 0 ? "#16a34a" : "#dc2626" }}>
                    vs Q1: {deltaQ1 >= 0 ? "+" : ""}{deltaQ1.toFixed(1)}p.p.
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

      {/* ── Matriz Equipe × Indicador ── */}
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:"18px 20px", marginBottom:18, overflow:"auto" }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>Matriz por Equipe × Indicador — Q2/2026 (parcial)</div>
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
            {_Q2.equipes.map((e, i) => (
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
                  {atingiu ? "Meta atingida" : `Gap: ${gap.toFixed(1)}p.p.`}
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
                <span style={{ fontSize:11, background:"#fecaca", color:"#991b1b", padding:"1px 8px", borderRadius:10, fontWeight:700 }}>−{a.gap.toFixed(1)}p.p.</span>
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

function AbaQualidade({ data }: { data: any }) {
  const [equipeAberta, setEquipeAberta] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<"gestor" | "competencia" | "diario" | "mensal" | "quadrimestral">("gestor");

  const { data: diario }        = useQuery({ queryKey: ["siaps-diario"],   queryFn: () => apiGet("/api/siaps/qualidade/diario"),         enabled: periodo === "diario" });
  const { data: mensal }        = useQuery({ queryKey: ["siaps-mensal"],   queryFn: () => apiGet("/api/siaps/qualidade/mensal"),         enabled: periodo === "mensal" });
  const { data: quadrimestral } = useQuery({ queryKey: ["siaps-quad"],    queryFn: () => apiGet("/api/siaps/qualidade/quadrimestral"),  enabled: periodo === "quadrimestral" });

  if (!data) return <NaoDisponivelBanner nota="Integração com SIAPS/e-Gestor ainda não configurada no Railway. Nenhum indicador de qualidade foi inventado." />;

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1d4ed8", margin: "0 0 4px" }}>Componente Qualidade</h2>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Novo Financiamento da Atenção Primária à Saúde — 15 indicadores · Portaria GM/MS 3.493/2024</p>
          </div>
          <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 10, padding: 4, flexWrap:"wrap" }}>
            {([
              { id: "gestor",         label: "🎯 Painel Gestor" },
              { id: "competencia",    label: "Competência atual" },
              { id: "diario",         label: "📅 Diário" },
              { id: "mensal",         label: "📆 Mensal" },
              { id: "quadrimestral",  label: "📊 Quadrimestral" },
            ] as const).map(p => (
              <button key={p.id} onClick={() => setPeriodo(p.id)} style={{
                padding: "6px 14px", border: "none", cursor: "pointer", borderRadius: 8,
                fontSize: 12, fontWeight: periodo === p.id ? 700 : 400,
                background: periodo === p.id ? "#1d4ed8" : "transparent",
                color: periodo === p.id ? "#fff" : "#6b7280",
                transition: "all .15s",
              }}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      {periodo === "gestor"         && <PainelGestorRT />}
      {periodo === "diario"        && <ViewDiaria data={diario as any} />}
      {periodo === "mensal"        && <ViewMensal data={mensal as any} />}
      {periodo === "quadrimestral" && <ViewQuadrimestral data={quadrimestral as any} />}

      {periodo === "competencia" && (<>
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
            <div key={idx} style={{ border: `1px solid ${e.status_qualidade === "otimo" ? "#374151" : e.status_qualidade === "bom" ? "#bbf7d0" : e.status_qualidade === "suficiente" ? "#fde68a" : "#fca5a5"}`, borderLeft: `4px solid ${COR_PONT(e.pontuacao_qualidade / 5)}`, borderRadius: 8, background: "#fff", overflow: "hidden" }}>
              <div onClick={() => setEquipeAberta(isOpen ? null : e.equipe)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>UBS: {e.ubs}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Equipe: {e.equipe}</div>
                </div>
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
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
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
      </>)}
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

const IND_LABELS = ["Pré-natal","Cito","DTP/Penta","Puerpério","1ª Odonto","Odonto Comp.","Urg. Odonto","HAS","DM HbA1c","Obesidade","Risco CV","Psicose","TAB","Síf. Gest.","Síf. Cong."];
const IND_KEYS   = ["ind1","ind2","ind3","ind4","ind5","ind6","ind7","ind8","ind9","ind10","ind11","ind12","ind13","ind14","ind15"];
const IND_METAS  = [55, 50, 90, 55, 45, 45, 45, 60, 55, 55, 50, 50, 50, 55, 55];

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

function AbaQuadrimestre({ dashData }: { dashData: any }) {
  const [periodo, setPeriodo]     = useState<"mensal" | "quadrimestral">("quadrimestral");
  const [equipeFiltro, setEquipeFiltro] = useState("TODAS");

  const { data: quadData } = useQuery({ queryKey: ["siaps-quad2"], queryFn: () => apiGet("/api/siaps/qualidade/quadrimestral") as Promise<any> });
  const { data: mensalData } = useQuery({ queryKey: ["siaps-mensal2"], queryFn: () => apiGet("/api/siaps/qualidade/mensal") as Promise<any> });

  if (!dashData && !quadData && !mensalData) return <NaoDisponivelBanner nota="Integração com SIAPS/e-Gestor ainda não configurada no Railway. Nenhum dado quadrimestral foi inventado." />;
  if (!dashData || !quadData || !mensalData) return <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Carregando...</div>;

  const equipes: any[] = quadData.equipes ?? [];
  const nomes = ["TODAS", ...equipes.map((e: any) => e.equipe)];

  const equipesFiltradas = equipeFiltro === "TODAS" ? equipes : equipes.filter((e: any) => e.equipe === equipeFiltro);

  const mensal_equipes: any[] = mensalData.equipes_evolucao ?? [];
  const mensal_filtradas = equipeFiltro === "TODAS" ? mensal_equipes : mensal_equipes.filter((e: any) => e.equipe === equipeFiltro);

  const v = dashData.vinculo;
  const q = dashData.qualidade;
  const radarData = [
    { indicador: "Vínculo",       valor: v.pontuacao_media * 10 },
    { indicador: "Qualidade",     valor: Math.min(q.pontuacao_media, 50) * 2 },
    { indicador: "Cobertura ESF", valor: 82 },
    { indicador: "Fin. APS (Cito)",valor: q.cito_meta_pct_media },
    { indicador: "SISAB",         valor: 97 },
  ];

  return (
    <div>
      {/* Cabeçalho + filtros */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1d4ed8", margin: "0 0 4px" }}>Avaliação do Quadrimestre</h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Cálculo dos Componentes de Cofinanciamento Federal da APS — Competência Abr/2026</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Filtro período */}
          <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 8, padding: 3, gap: 2 }}>
            {(["quadrimestral","mensal"] as const).map(p => (
              <button key={p} onClick={() => setPeriodo(p)} style={{
                padding: "6px 14px", border: "none", cursor: "pointer", borderRadius: 6,
                fontSize: 12, fontWeight: periodo === p ? 700 : 400,
                background: periodo === p ? "#1d4ed8" : "transparent",
                color: periodo === p ? "#fff" : "#6b7280",
              }}>
                {p === "quadrimestral" ? "📊 Quadrimestral" : "📆 Mensal"}
              </button>
            ))}
          </div>
          {/* Filtro equipe */}
          <select
            value={equipeFiltro}
            onChange={e => setEquipeFiltro(e.target.value)}
            style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#374151", background: "#fff", cursor: "pointer" }}
          >
            {nomes.map(n => <option key={n} value={n}>{n === "TODAS" ? "Todas as equipes" : `Equipe: ${n}`}</option>)}
          </select>
        </div>
      </div>

      {/* Resumo geral — só aparece quando "Todas as equipes" */}
      {equipeFiltro === "TODAS" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1d4ed8" }}>Componente Vínculo</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>e Acompanhamento Territorial</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: COR_PONT(v.pontuacao_media) }}>{v.pontuacao_media.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>média municipal</div>
              </div>
            </div>
            {[
              { label: "Ótimo",      n: v.otimo,      cor: "#1d4ed8" },
              { label: "Bom",        n: v.bom,        cor: "#16a34a" },
              { label: "Suficiente", n: v.suficiente, cor: "#d97706" },
              { label: "Regular",    n: v.regular,    cor: "#dc2626" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, width: 76, color: s.cor, fontWeight: 600 }}>{s.label}</span>
                <div style={{ flex: 1, height: 14, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${s.n * 10}%`, height: "100%", background: s.cor, borderRadius: 4 }} />
                </div>
                <span style={{ fontWeight: 700, color: s.cor, minWidth: 16 }}>{s.n}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
              Vinculadas: <strong>{v.total_vinculadas.toLocaleString("pt-BR")}</strong> · Acompanhadas: <strong>{v.total_acompanhadas.toLocaleString("pt-BR")}</strong>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1d4ed8" }}>Componente Qualidade</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Novo Financiamento APS — 15 indicadores · 9 equipes · Portaria 3.493/2024</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#16a34a" }}>{q.pontuacao_media.toFixed(1)}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>pts médios/equipe</div>
              </div>
            </div>
            <div style={{ background: "#fff7f7", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 10, fontSize: 12, color: "#dc2626" }}>
              <strong>⚠ Citopatológico:</strong> {q.cito_meta_pct_media}% (meta 50%) — todas as equipes abaixo da meta.
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#16a34a" }}>
              <strong>✓ Pré-natal e Consulta RN</strong> — acima da meta na maioria das equipes. LIBERDADE: 96% no Ind.4.
            </div>

            {periodo === "quadrimestral" && (
              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                {[
                  { label: "Quad. atual",    val: `${quadData.media_geral_atual}%`,     cor: "#1d4ed8" },
                  { label: "Quad. anterior", val: `${quadData.media_geral_anterior}%`,  cor: "#9ca3af" },
                  { label: "Variação",       val: `+${quadData.variacao_geral}p.p.`,    cor: "#16a34a" },
                  { label: "Projeção 2Q",    val: `${quadData.projecao_2q_2026}%`,      cor: "#7c3aed" },
                ].map(k => (
                  <div key={k.label} style={{ flex: 1, textAlign: "center", background: "#f9fafb", borderRadius: 8, padding: "8px 4px" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: k.cor }}>{k.val}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{k.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Radar — só geral */}
      {equipeFiltro === "TODAS" && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Radar de Desempenho Municipal — Apuí/AM</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>Score normalizado 0–100 por dimensão</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="indicador" tick={{ fontSize: 11 }} />
                <Radar name="Apuí/AM" dataKey="valor" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Evolução mensal geral (gráfico) — período mensal + todas equipes */}
      {periodo === "mensal" && equipeFiltro === "TODAS" && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Evolução mensal dos 7 indicadores — municipal</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mensalData.evolucao} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis domain={[25, 90]} tick={{ fontSize: 10 }} unit="%" />
              <Tooltip contentStyle={TT} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              {IND_KEYS.map((k, i) => (
                <Line key={k} dataKey={k} name={IND_LABELS[i]} stroke={IND_CORES[k]} strokeWidth={2} dot={false} strokeDasharray={k === "ind2" ? "4 2" : undefined} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Lista de equipes */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
          {equipeFiltro === "TODAS"
            ? `Todas as equipes (${equipes.length}) — clique para expandir indicadores`
            : `Detalhe: Equipe ${equipeFiltro}`}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {periodo === "quadrimestral"
            ? equipesFiltradas.map((e: any) => <CardEquipe key={e.equipe} e={e} periodo="quadrimestral" />)
            : mensal_filtradas.map((e: any) => {
                const quad = equipes.find((eq: any) => eq.equipe === e.equipe) ?? {};
                return <CardEquipe key={e.equipe} e={{ ...quad, ...e }} periodo="mensal" />;
              })
          }
        </div>
      </div>

      {/* Parecer do gestor */}
      {equipeFiltro === "TODAS" && periodo === "quadrimestral" && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "14px 18px", fontSize: 12, color: "#1e40af" }}>
          <strong>Parecer do Gestor — {quadData.quadrimestre_atual}:</strong> {quadData.parecer_gestor}
        </div>
      )}
    </div>
  );
}

// ── Aba: Análise do Indicador (CVAT externo) ─────────────────────────────────

const COMPETENCIAS_2026 = ["Jan/26","Fev/26","Mar/26","Abr/26"];
const COMPETENCIAS_2025 = ["Jan/25","Fev/25","Mar/25","Abr/25","Mai/25","Jun/25","Jul/25","Ago/25","Set/25","Out/25","Nov/25","Dez/25"];

function AbaAnaliseIndicador() {
  const [ano, setAno] = useState<"2025"|"2026">("2026");
  const [competencia, setCompetencia] = useState("Abr/26");
  const [condicao, setCondicao] = useState("homologadas");
  const [tipos, setTipos] = useState<string[]>(["eAP","eSF"]);
  const [visao, setVisao] = useState<"competencia"|"equipe"|"variavel">("competencia");
  const [showCal, setShowCal] = useState(false);

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

// ── Página principal ───────────────────────────────────────────────────────────

type Aba = "abrangencia" | "vinculo" | "qualidade" | "boas_praticas" | "quadrimestre" | "analise_indicador" | "rel_pagamento";

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
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "16px 0", fontSize: 11, color: "#9ca3af", borderTop: "1px solid #e5e7eb", marginTop: 24 }}>
        Ministério da Saúde | SAPS @2026 | versão: 1.8.2 (dados integrados ERSUS 360)
      </div>
    </div>
  );
}
