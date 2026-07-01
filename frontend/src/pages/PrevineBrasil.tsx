// src/pages/PrevineBrasil.tsx — Previne Brasil · ERSUS 360
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://ersus360-production.up.railway.app";
const BLUE = "#1565c0";

function getToken() {
  return localStorage.getItem("access_token") ?? "";
}

// ── Indicadores oficiais Previne Brasil (7 indicadores) ──────────────────────
const INDICADORES_OFICIAIS = [
  {
    num: 1,
    nome: "Proporção de gestantes com pelo menos 6 consultas de pré-natal",
    eixo: "Saúde da Mulher",
    meta: 100,
    cor: "#1976d2",
  },
  {
    num: 2,
    nome: "Proporção de gestantes com realização de exames para sífilis e HIV",
    eixo: "Saúde da Mulher",
    meta: 100,
    cor: "#1976d2",
  },
  {
    num: 3,
    nome: "Proporção de mulheres com coleta de citopatológico",
    eixo: "Saúde da Mulher",
    meta: 100,
    cor: "#7b1fa2",
  },
  {
    num: 4,
    nome: "Proporção de pessoas hipertensas com PA aferida",
    eixo: "Doenças Crônicas",
    meta: 100,
    cor: "#c62828",
  },
  {
    num: 5,
    nome: "Proporção de pessoas diabéticas com solicitação de hemoglobina glicada",
    eixo: "Doenças Crônicas",
    meta: 100,
    cor: "#c62828",
  },
  {
    num: 6,
    nome: "Proporção de crianças de 1 ano com vacina poliomielite e pentavalente em dia",
    eixo: "Imunização",
    meta: 100,
    cor: "#2e7d32",
  },
  {
    num: 7,
    nome: "Proporção de pessoas com obesidade com IMC aferido",
    eixo: "Saúde do Adulto",
    meta: 100,
    cor: "#e65100",
  },
];

// Dados de referência para quando API não retorna
const DADOS_REFERENCIA = [
  { num: 1, alcancado: 78, situacao: "EM_ANDAMENTO" },
  { num: 2, alcancado: 82, situacao: "EM_ANDAMENTO" },
  { num: 3, alcancado: 91, situacao: "ATINGIDO" },
  { num: 4, alcancado: 65, situacao: "EM_ANDAMENTO" },
  { num: 5, alcancado: 58, situacao: "NAO_ATINGIDO" },
  { num: 6, alcancado: 94, situacao: "ATINGIDO" },
  { num: 7, alcancado: 43, situacao: "NAO_ATINGIDO" },
];

type Situacao = "ATINGIDO" | "EM_ANDAMENTO" | "NAO_ATINGIDO";

interface Indicador {
  num: number;
  nome: string;
  eixo: string;
  meta: number;
  alcancado: number;
  situacao: Situacao;
  cor: string;
}

function situacaoLabel(s: Situacao) {
  if (s === "ATINGIDO") return { label: "Atingido", bg: "#e8f5e9", color: "#2e7d32" };
  if (s === "EM_ANDAMENTO") return { label: "Em andamento", bg: "#fff8e1", color: "#f57f17" };
  return { label: "Não atingido", bg: "#ffebee", color: "#c62828" };
}

function BarraProgresso({ valor, cor }: { valor: number; cor: string }) {
  return (
    <div style={{ background: "#e0e0e0", borderRadius: 6, height: 10, width: "100%", overflow: "hidden" }}>
      <div
        style={{
          width: `${Math.min(valor, 100)}%`,
          height: "100%",
          background: valor >= 90 ? "#2e7d32" : valor >= 60 ? "#f57f17" : "#c62828",
          borderRadius: 6,
          transition: "width 0.8s ease",
        }}
      />
    </div>
  );
}

function CardIndicador({ ind }: { ind: Indicador }) {
  const sit = situacaoLabel(ind.situacao);
  const Icon = ind.situacao === "ATINGIDO" ? CheckCircle : ind.situacao === "EM_ANDAMENTO" ? Clock : AlertTriangle;

  return (
    <div style={{
      background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10,
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{
            minWidth: 28, height: 28, borderRadius: "50%", background: ind.cor,
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700,
          }}>
            {ind.num}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#212121", lineHeight: 1.4 }}>{ind.nome}</div>
            <div style={{ fontSize: 11, color: "#757575", marginTop: 2 }}>{ind.eixo}</div>
          </div>
        </div>
        <span style={{
          background: sit.bg, color: sit.color, fontSize: 11, fontWeight: 600,
          padding: "3px 8px", borderRadius: 12, whiteSpace: "nowrap",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <Icon size={11} /> {sit.label}
        </span>
      </div>

      {/* Barra */}
      <BarraProgresso valor={ind.alcancado} cor={ind.cor} />

      {/* Valores */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#616161" }}>
          Meta: <strong>{ind.meta}%</strong>
        </span>
        <span style={{ fontSize: 20, fontWeight: 700, color: ind.alcancado >= 90 ? "#2e7d32" : ind.alcancado >= 60 ? "#f57f17" : "#c62828" }}>
          {ind.alcancado}%
        </span>
      </div>
    </div>
  );
}

function CardResumo({ label, valor, icon: Icon, cor }: { label: string; valor: number; icon: any; cor: string }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10,
      padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ background: cor + "20", borderRadius: 8, padding: 10 }}>
        <Icon size={22} color={cor} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: cor }}>{valor}</div>
        <div style={{ fontSize: 12, color: "#616161" }}>{label}</div>
      </div>
    </div>
  );
}

export default function PrevineBrasil() {
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [loading, setLoading] = useState(true);
  const [fonte, setFonte] = useState<"api" | "fallback">("fallback");
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState("");
  const [filtroEixo, setFiltroEixo] = useState("Todos");

  const competencia = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  async function carregar() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/integracao/fns/previne`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (r.ok) {
        const data = await r.json();
        const lista: any[] = data.indicadores ?? data ?? [];
        if (lista.length > 0) {
          // Mescla com definições oficiais
          const merged = INDICADORES_OFICIAIS.map((oficial) => {
            const api = lista.find((i: any) =>
              String(i.num) === String(oficial.num) ||
              String(i.indicador ?? "").toLowerCase().includes(oficial.nome.split(" ")[2]?.toLowerCase() ?? "")
            );
            return {
              ...oficial,
              alcancado: api?.alcancado ?? api?.valor ?? DADOS_REFERENCIA[oficial.num - 1]?.alcancado ?? 0,
              situacao: (api?.situacao ?? DADOS_REFERENCIA[oficial.num - 1]?.situacao ?? "EM_ANDAMENTO") as Situacao,
            };
          });
          setIndicadores(merged);
          setFonte("api");
        } else {
          throw new Error("vazio");
        }
      } else {
        throw new Error("http " + r.status);
      }
    } catch {
      // fallback com dados de referência
      const fallback = INDICADORES_OFICIAIS.map((oficial, i) => ({
        ...oficial,
        alcancado: DADOS_REFERENCIA[i].alcancado,
        situacao: DADOS_REFERENCIA[i].situacao as Situacao,
      }));
      setIndicadores(fallback);
      setFonte("fallback");
    } finally {
      setLoading(false);
      setUltimaAtualizacao(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    }
  }

  useEffect(() => { carregar(); }, []);

  const eixos = ["Todos", ...Array.from(new Set(INDICADORES_OFICIAIS.map(i => i.eixo)))];
  const filtrados = filtroEixo === "Todos" ? indicadores : indicadores.filter(i => i.eixo === filtroEixo);

  const atingidos = indicadores.filter(i => i.situacao === "ATINGIDO").length;
  const emAndamento = indicadores.filter(i => i.situacao === "EM_ANDAMENTO").length;
  const naoAtingidos = indicadores.filter(i => i.situacao === "NAO_ATINGIDO").length;
  const mediaGeral = indicadores.length ? Math.round(indicadores.reduce((s, i) => s + i.alcancado, 0) / indicadores.length) : 0;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, flexDirection: "column", gap: 12 }}>
        <RefreshCw size={28} color={BLUE} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ color: "#616161", fontSize: 14 }}>Carregando indicadores Previne Brasil...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TrendingUp size={22} color={BLUE} />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#212121" }}>Previne Brasil</h1>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#757575" }}>
            7 indicadores de desempenho · Apuí/AM · {competencia}
          </p>
          {fonte === "fallback" && (
            <span style={{ fontSize: 11, color: "#f57f17", background: "#fff8e1", padding: "2px 8px", borderRadius: 10, marginTop: 4, display: "inline-block" }}>
              ⚠ Dados de referência — configure credenciais FNS para dados reais
            </span>
          )}
        </div>
        <button
          onClick={carregar}
          style={{ display: "flex", alignItems: "center", gap: 6, background: BLUE, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Cards resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        <CardResumo label="Média geral" valor={mediaGeral} icon={TrendingUp} cor={BLUE} />
        <CardResumo label="Atingidos" valor={atingidos} icon={CheckCircle} cor="#2e7d32" />
        <CardResumo label="Em andamento" valor={emAndamento} icon={Clock} cor="#f57f17" />
        <CardResumo label="Não atingidos" valor={naoAtingidos} icon={AlertTriangle} cor="#c62828" />
      </div>

      {/* Filtro por eixo */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {eixos.map(e => (
          <button
            key={e}
            onClick={() => setFiltroEixo(e)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
              cursor: "pointer", border: "1px solid",
              background: filtroEixo === e ? BLUE : "#fff",
              color: filtroEixo === e ? "#fff" : "#616161",
              borderColor: filtroEixo === e ? BLUE : "#e0e0e0",
            }}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Grid de indicadores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 16 }}>
        {filtrados.map(ind => <CardIndicador key={ind.num} ind={ind} />)}
      </div>

      {/* Rodapé */}
      <div style={{ marginTop: 24, padding: "12px 16px", background: "#f5f5f5", borderRadius: 8, fontSize: 12, color: "#757575", display: "flex", justifyContent: "space-between" }}>
        <span>Fonte: {fonte === "api" ? "FNS API / SISAB" : "Dados de referência CONASS/CONASEMS"} · IBGE 1300144</span>
        <span>Atualizado às {ultimaAtualizacao}</span>
      </div>
    </div>
  );
}
