import { useState, type ReactNode } from "react";
import { ExternalLink, ShieldAlert, Eye, Database, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { COR, dataHora, useMunicipiosFvs, type EstadoFonte, type PainelFvs, IBGE_AM } from "../../lib/vigilanciaFvs";

/** Seletor dos 62 municípios do AM, com filtro por Região de Saúde (lista da FVS). */
export function SeletorMunicipioFvs({ valor, onChange, incluirEstado = false, rotulo = "Município" }: {
  valor: string; onChange: (ibge6: string) => void; incluirEstado?: boolean; rotulo?: string;
}) {
  const { data } = useMunicipiosFvs();
  const [regiao, setRegiao] = useState("");
  const lista = (data?.municipios ?? []).filter(m => !regiao || m.regiao_saude === regiao);
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
      <label style={rotuloStyle}>
        Região de Saúde
        <select value={regiao} onChange={e => setRegiao(e.target.value)} style={selectStyle}>
          <option value="">Todas</option>
          {(data?.regioes ?? []).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>
      <label style={rotuloStyle}>
        {rotulo}
        <select value={valor} onChange={e => onChange(e.target.value)} style={{ ...selectStyle, minWidth: 190 }}>
          {incluirEstado && <option value={IBGE_AM}>Amazonas (estado)</option>}
          {!lista.some(m => m.ibge6 === valor) && valor !== IBGE_AM && <option value={valor}>{valor}</option>}
          {lista.map(m => <option key={m.ibge6} value={m.ibge6}>{m.nome}</option>)}
        </select>
      </label>
    </div>
  );
}

export const rotuloStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 3, fontSize: 11, color: COR.sub, fontWeight: 600 };
export const selectStyle: React.CSSProperties = { padding: "7px 9px", border: `1px solid ${COR.borda}`, borderRadius: 7, fontSize: 13, background: "#fff", color: COR.texto, minHeight: 36 };

export function SeletorAno({ valor, onChange, desde = 2012 }: { valor: number; onChange: (a: number) => void; desde?: number }) {
  const hoje = new Date().getFullYear();
  const anos = Array.from({ length: hoje - desde + 1 }, (_, i) => hoje - i);
  return (
    <label style={rotuloStyle}>
      Ano
      <select value={valor} onChange={e => onChange(Number(e.target.value))} style={selectStyle}>
        {anos.map(a => <option key={a} value={a}>{a}{a === hoje ? " (parcial)" : ""}</option>)}
      </select>
    </label>
  );
}

const SITUACAO: Record<string, { cor: string; rotulo: string; Icon: typeof CheckCircle2 }> = {
  ok: { cor: "#15803d", rotulo: "Atualizado", Icon: CheckCircle2 },
  erro: { cor: COR.alto, rotulo: "Falha na última atualização", Icon: AlertTriangle },
  bloqueado_lgpd: { cor: COR.alto, rotulo: "Bloqueado (proteção de dados)", Icon: ShieldAlert },
  nunca_sincronizada: { cor: COR.medio, rotulo: "Ainda não sincronizado", Icon: Clock },
};

/** Fonte, data de referência e última sincronização — obrigatório junto de cada número da FVS. */
export function SeloFonteFvs({ estado, compacto = false }: { estado?: EstadoFonte; compacto?: boolean }) {
  if (!estado) return null;
  const s = SITUACAO[estado.situacao] ?? SITUACAO.nunca_sincronizada;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: compacto ? 6 : 10, alignItems: "center", fontSize: 11, color: COR.sub,
      background: "#fff", border: `1px solid ${COR.borda}`, borderRadius: 8, padding: compacto ? "4px 8px" : "6px 10px" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: s.cor, fontWeight: 700 }}>
        <s.Icon size={13} /> {s.rotulo}
      </span>
      <span><Database size={11} style={{ verticalAlign: -1 }} /> {estado.rotulo}</span>
      {estado.data_referencia && <span>· {estado.data_referencia}</span>}
      {!compacto && <span>· publicado pela FVS em {dataHora(estado.publicado_na_fonte)}</span>}
      <span>· sincronizado em {dataHora(estado.ultima_sincronizacao)}</span>
      {estado.erro && <span style={{ color: COR.alto, width: "100%" }}>{estado.erro}</span>}
    </div>
  );
}

export function TagOrigem({ origem }: { origem: "oficial" | "calculado" | "calculado_ersus360" | "integracao" | string }) {
  const oficial = origem === "oficial";
  const calc = origem.startsWith("calculado");
  const cor = oficial ? COR.oficial : calc ? COR.calculado : COR.baixo;
  const txt = oficial ? "Oficial FVS" : calc ? "Calculado ERSUS360" : "Integração";
  return <span title={oficial ? "Número publicado pela FVS-RCP/AM" : calc ? "Conta feita pelo ERSUS360 sobre números oficiais" : ""}
    style={{ fontSize: 10, fontWeight: 700, color: cor, background: `${cor}12`, border: `1px solid ${cor}33`, borderRadius: 4, padding: "1px 6px", whiteSpace: "nowrap" }}>{txt}</span>;
}

export function Cartao({ titulo, valor, sub, origem, cor = COR.primaria, onClick }: {
  titulo: string; valor: ReactNode; sub?: ReactNode; origem?: string; cor?: string; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={e => { if (onClick && (e.key === "Enter" || e.key === " ")) onClick(); }}
      style={{ background: "#fff", border: `1px solid ${COR.borda}`, borderTop: `3px solid ${cor}`, borderRadius: 10, padding: "12px 14px",
        cursor: onClick ? "pointer" : "default", display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "flex-start" }}>
        <span style={{ fontSize: 12, color: COR.sub, fontWeight: 600 }}>{titulo}</span>
        {origem && <TagOrigem origem={origem} />}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: COR.texto, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{valor}</div>
      {sub && <div style={{ fontSize: 11, color: COR.sub }}>{sub}</div>}
    </div>
  );
}

/** Painel oficial da FVS incorporado (Tableau/Power BI). Só carrega quando o usuário pede. */
export function PainelOficial({ painel }: { painel: PainelFvs }) {
  const [aberto, setAberto] = useState(false);
  const bloqueado = painel.integracao === "bloqueado_lgpd";
  const rotuloIntegracao = painel.integracao === "extracao"
    ? "Dados extraídos automaticamente"
    : bloqueado ? "Só visualização — pasta pública contém dado pessoal (não extraída)"
    : painel.plataforma === "powerbi" ? "Só visualização — Power BI não oferece exportação de dados"
    : "Só visualização";
  return (
    <div style={{ border: `1px solid ${COR.borda}`, borderRadius: 10, background: "#fff", overflow: "hidden" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between", padding: "10px 12px" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: COR.texto }}>{painel.titulo}</div>
          <div style={{ fontSize: 11, color: COR.sub }}>{painel.descricao} · {painel.plataforma === "powerbi" ? "Power BI" : "Tableau Public"} ·{" "}
            <span style={{ color: bloqueado ? COR.alto : painel.integracao === "extracao" ? "#15803d" : COR.sub }}>{rotuloIntegracao}</span>
            {painel.nota ? ` · ${painel.nota}` : ""}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setAberto(a => !a)} style={botaoSec}><Eye size={13} /> {aberto ? "Fechar" : "Ver painel oficial"}</button>
          {painel.ver_painel && <a href={`https://www.fvs.am.gov.br/ver_painel/${painel.ver_painel}`} target="_blank" rel="noreferrer" style={botaoSec}>
            <ExternalLink size={13} /> FVS</a>}
        </div>
      </div>
      {aberto && (
        <iframe title={painel.titulo} src={painel.embed} loading="lazy" referrerPolicy="no-referrer"
          style={{ width: "100%", height: "min(80vh, 900px)", border: 0, borderTop: `1px solid ${COR.borda}` }} allowFullScreen />
      )}
    </div>
  );
}

export const botaoSec: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 7, border: `1px solid ${COR.borda}`,
  background: "#fff", color: COR.texto, fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none", minHeight: 32,
};

export const botaoPri: React.CSSProperties = {
  ...botaoSec, background: COR.primaria, color: "#fff", border: `1px solid ${COR.primaria}`,
};

export function Vazio({ children }: { children: ReactNode }) {
  return <div style={{ padding: 16, border: `1px dashed ${COR.borda}`, borderRadius: 10, color: COR.sub, fontSize: 13, background: "#fff" }}>{children}</div>;
}

export function Secao({ titulo, children, direita }: { titulo: ReactNode; children: ReactNode; direita?: ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: COR.texto }}>{titulo}</h3>
        {direita}
      </div>
      {children}
    </section>
  );
}

export function TabelaSimples({ colunas, linhas, alinhar }: { colunas: string[]; linhas: ReactNode[][]; alinhar?: ("left" | "right")[] }) {
  return (
    <div style={{ overflowX: "auto", border: `1px solid ${COR.borda}`, borderRadius: 10, background: "#fff" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead>
          <tr>{colunas.map((c, i) => <th key={i} style={{ textAlign: alinhar?.[i] ?? (i ? "right" : "left"), padding: "8px 10px",
            background: COR.fundo, color: COR.sub, fontWeight: 700, borderBottom: `1px solid ${COR.borda}`, whiteSpace: "nowrap" }}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => <tr key={i}>{l.map((v, j) => <td key={j} style={{ textAlign: alinhar?.[j] ?? (j ? "right" : "left"),
            padding: "7px 10px", borderBottom: `1px solid ${COR.borda}`, fontVariantNumeric: "tabular-nums", color: COR.texto }}>{v}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
