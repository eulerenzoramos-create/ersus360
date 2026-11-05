/**
 * Painel de Vigilância em Saúde — entrada da aba VIGILÂNCIA EM SAÚDE (painel gerencial).
 * Oito áreas: visão geral; respiratórias e qualidade do ar; diarreicas e água; arboviroses e endemias;
 * notificação compulsória; ambiental e clima; PQA-VS; relatórios, mapas e inteligência — mais a central de
 * alertas por prioridade. Fontes oficiais públicas (FVS-RCP/AM, INPE, SISAGUA) dos 62 municípios do AM.
 * Começa no município da sessão; qualquer município do AM pode ser consultado (dado público).
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Activity, ArrowLeft, Bot, Brain, Bug, ClipboardList, Droplets, FileText, Flame, Map as MapIcon, Network, Scale, ShieldCheck, Siren,
  Target, Wind } from "lucide-react";
import { apiGet } from "../lib/api";
import { useAuth } from "../App";
import { COR, FVS_API, IBGE_AM, ROTULO_RECORTE, ibge6, fmt, fmtPct, useCatalogoFvs, useMunicipiosFvs,
  type EstadoFonte, type LinhaSerie } from "../lib/vigilanciaFvs";
import { PainelOficial, Secao, SeletorAno, SeletorMunicipioFvs, SeloFonteFvs, TabelaSimples, Vazio,
  botaoSec, rotuloStyle, selectStyle } from "../components/vigilancia/FvsBase";
import { BarrasAnuais, BarrasRecorte, CurvaSemanal } from "../components/vigilancia/Graficos";
import MapaAmazonas, { type ValorMapa } from "../components/vigilancia/MapaAmazonas";
import CentralAlertas, { ResumoAlertas, useCentral, type Prioridade } from "../components/vigilancia/CentralAlertas";
import { AZUL, AreaAmbiental, AreaArboviroses, AreaDiarreicas, AreaInteligencia, AreaNotificacoes, AreaPqa, AreaRespiratoria,
  AreaVisao } from "../components/vigilancia/AreasPainel";
import { AbaAgenteIA, AbaIntegracoes, AbaRelatorios } from "../components/vigilancia/AbasFerramentas";

type Aba = "visao" | "alertas" | "respiratoria" | "diarreicas" | "arboviroses" | "notificacoes" | "ambiental" | "pqa" | "ferramentas";
const ABAS: { id: Aba; rotulo: string; Icon: typeof Activity }[] = [
  { id: "visao", rotulo: "Visão geral", Icon: Activity },
  { id: "alertas", rotulo: "Central de alertas", Icon: Siren },
  { id: "respiratoria", rotulo: "Respiratórias e ar", Icon: Wind },
  { id: "diarreicas", rotulo: "Diarreicas e água", Icon: Droplets },
  { id: "arboviroses", rotulo: "Arboviroses e endemias", Icon: Bug },
  { id: "notificacoes", rotulo: "Notificação compulsória", Icon: ClipboardList },
  { id: "ambiental", rotulo: "Ambiental e clima", Icon: Flame },
  { id: "pqa", rotulo: "PQA-VS", Icon: Target },
  { id: "ferramentas", rotulo: "Relatórios, mapas e inteligência", Icon: Brain },
];
type Ferramenta = "inteligencia" | "relatorios" | "mapa" | "comparativo" | "ia" | "integracoes" | "paineis";
const FERRAMENTAS: { id: Ferramenta; rotulo: string; Icon: typeof Activity }[] = [
  { id: "inteligencia", rotulo: "Inteligência epidemiológica", Icon: Brain }, { id: "relatorios", rotulo: "Relatórios", Icon: FileText },
  { id: "mapa", rotulo: "Mapa do AM", Icon: MapIcon }, { id: "comparativo", rotulo: "Comparativo", Icon: Scale },
  { id: "ia", rotulo: "Agente IA", Icon: Bot }, { id: "integracoes", rotulo: "Integrações", Icon: Network },
  { id: "paineis", rotulo: "Painéis oficiais", Icon: ShieldCheck },
];
const RELATORIO_DA_AREA: Partial<Record<Aba, string>> = { visao: "municipal", alertas: "alertas", respiratoria: "respiratorio",
  diarreicas: "diarreicas", arboviroses: "arboviroses", pqa: "pqa_vs", notificacoes: "consolidado", ambiental: "respiratorio" };

interface Painel {
  municipio: { ibge6: string; nome: string }; ano: number;
  populacao_referencia: { ano: number; valor: number; fonte: string } | null;
  fontes: Record<string, EstadoFonte>;
  agravos: { agravo: string; indicador: string; casos_ano: number | null; casos_ano_anterior: number | null; incidencia_100mil: number | null }[];
}

function lerHash(): { aba: Aba; ferramenta: Ferramenta } {
  const [a, f] = (typeof window !== "undefined" ? window.location.hash.slice(1) : "").split(":");
  return { aba: (ABAS.some(x => x.id === a) ? a : "visao") as Aba, ferramenta: (FERRAMENTAS.some(x => x.id === f) ? f : "inteligencia") as Ferramenta };
}

export default function VigilanciaSaudePainel() {
  const auth = useAuth();
  const [{ aba, ferramenta }, setNav] = useState(lerHash);
  const [prioridade, setPrioridade] = useState<Prioridade | undefined>();
  const [tipoRelatorio, setTipoRelatorio] = useState("municipal");
  const [mun, setMun] = useState(() => ibge6(auth.municipio_ibge) || "130014");
  const [ano, setAno] = useState(new Date().getFullYear());
  const painel = useQuery({ queryKey: ["fvs-painel", mun, ano], queryFn: () => apiGet<Painel>(`${FVS_API}/painel`, { mun, ano }) });
  const central = useCentral(mun, ano);
  const agravos = useMemo(() => (painel.data?.agravos ?? []).map(a => a.agravo), [painel.data]);
  const munSessao = mun === IBGE_AM ? ibge6(auth.municipio_ibge) : mun;
  const ir = (a: Aba, f?: Ferramenta) => {
    const fer = f ?? ferramenta;
    setNav({ aba: a, ferramenta: fer });
    try { window.history.replaceState(null, "", "#" + a + (a === "ferramentas" ? ":" + fer : "")); } catch { /* sem histórico */ }
  };
  const abrirAlertas = (p?: Prioridade) => { setPrioridade(p); ir("alertas"); };
  const irArea = (x: string) => { const [a, f] = x.split(":"); ir(a as Aba, f as Ferramenta | undefined); };
  const relatorio = RELATORIO_DA_AREA[aba];
  const temAlertaGrave = (central.data?.resumo.critico ?? 0) + (central.data?.resumo.alto ?? 0);

  return (
    <div style={{ minHeight: "100vh", background: COR.fundo, padding: "16px clamp(12px, 3vw, 24px)" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <Link to="/" style={{ display: "inline-flex", gap: 4, alignItems: "center", fontSize: 12, color: COR.sub, textDecoration: "none" }}>
              <ArrowLeft size={13} /> Início</Link>
            <h1 style={{ margin: "4px 0 2px", fontSize: 22, fontWeight: 800, color: COR.texto }}>Painel de Vigilância em Saúde</h1>
            <div style={{ fontSize: 12.5, color: COR.sub }}>{painel.data?.municipio.nome ?? "—"} · {ano}{ano === new Date().getFullYear() ? " (parcial)" : ""} ·
              {" "}dados públicos oficiais (FVS-RCP/AM, INPE, SISAGUA) dos 62 municípios do Amazonas</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
            <SeletorMunicipioFvs valor={mun} onChange={setMun} incluirEstado />
            <SeletorAno valor={ano} onChange={setAno} desde={2015} />
          </div>
        </div>

        <ResumoAlertas central={central.data} onAbrir={abrirAlertas} />

        <nav style={{ display: "flex", gap: 2, overflowX: "auto", borderBottom: `1px solid ${COR.borda}` }} aria-label="Áreas do painel">
          {ABAS.map(a => (
            <button key={a.id} onClick={() => { if (a.id === "alertas") setPrioridade(undefined); ir(a.id); }} aria-current={aba === a.id ? "page" : undefined}
              style={{ display: "inline-flex", gap: 5, alignItems: "center", padding: "9px 11px", border: 0, background: "none", cursor: "pointer",
                whiteSpace: "nowrap", fontSize: 13, fontWeight: 700, color: aba === a.id ? AZUL : COR.sub,
                borderBottom: `2px solid ${aba === a.id ? AZUL : "transparent"}` }}>
              <a.Icon size={14} /> {a.rotulo}
              {a.id === "alertas" && temAlertaGrave > 0 &&
                <span style={{ background: "#b91c1c", color: "#fff", borderRadius: 999, fontSize: 10, padding: "0 6px" }}>{temAlertaGrave}</span>}
            </button>
          ))}
        </nav>
        {relatorio && <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -8 }}>
          <button style={{ ...botaoSec, fontSize: 11.5 }} onClick={() => { setTipoRelatorio(relatorio); ir("ferramentas", "relatorios"); }}>
            <FileText size={13} /> Relatório desta área (PDF/Excel/Word)</button></div>}

        {aba === "visao" && <AreaVisao mun={mun} ano={ano} central={central.data} onAlertas={abrirAlertas} onArea={irArea} />}
        {aba === "alertas" && <CentralAlertas key={prioridade ?? "todas"} mun={mun} ano={ano} prioridadeInicial={prioridade} />}
        {aba === "respiratoria" && <AreaRespiratoria mun={mun} ano={ano} />}
        {aba === "diarreicas" && <AreaDiarreicas mun={mun} ano={ano} />}
        {aba === "arboviroses" && <AreaArboviroses mun={mun} ano={ano} />}
        {aba === "notificacoes" && <><AreaNotificacoes mun={mun} ano={ano} />
          <DetalhePorAgravo agravos={agravos} mun={mun} ano={ano} nome={painel.data?.municipio.nome ?? ""} /></>}
        {aba === "ambiental" && <AreaAmbiental mun={mun} ano={ano} onMunicipio={setMun} />}
        {aba === "pqa" && <AreaPqa mun={mun} />}
        {aba === "ferramentas" && <>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} role="tablist" aria-label="Ferramentas">
            {FERRAMENTAS.map(f => <button key={f.id} role="tab" aria-selected={ferramenta === f.id} onClick={() => ir("ferramentas", f.id)}
              style={{ ...botaoSec, borderRadius: 999, background: ferramenta === f.id ? AZUL : "#fff", color: ferramenta === f.id ? "#fff" : COR.texto,
                borderColor: ferramenta === f.id ? AZUL : COR.borda }}><f.Icon size={13} /> {f.rotulo}</button>)}
          </div>
          {ferramenta === "inteligencia" && <AreaInteligencia mun={mun} ano={ano} />}
          {ferramenta === "relatorios" && <AbaRelatorios key={tipoRelatorio} mun={munSessao} agravos={agravos} tipoInicial={tipoRelatorio} />}
          {ferramenta === "mapa" && <AbaMapa ano={ano} agravos={agravos} onMunicipio={m => { setMun(m); ir("visao"); }} mun={mun} />}
          {ferramenta === "comparativo" && <AbaComparativo mun={mun} ano={ano} />}
          {ferramenta === "ia" && <AbaAgenteIA mun={munSessao} />}
          {ferramenta === "integracoes" && <AbaIntegracoes />}
          {ferramenta === "paineis" && <AbaPaineis />}
        </>}
      </div>
    </div>
  );
}

function DetalhePorAgravo({ agravos, mun, ano, nome }: { agravos: string[]; mun: string; ano: number; nome: string }) {
  const [agravo, setAgravo] = useState("");
  if (!agravos.length) return null;
  return <Secao titulo="Detalhe por agravo (série histórica e perfil)">
    <label style={rotuloStyle}>Doença/agravo
      <select value={agravo} onChange={e => setAgravo(e.target.value)} style={{ ...selectStyle, maxWidth: 360 }}>
        <option value="">Escolha…</option>{agravos.map(a => <option key={a}>{a}</option>)}</select></label>
    {agravo && <DetalheAgravo agravo={agravo} mun={mun} ano={ano} nome={nome} onFechar={() => setAgravo("")} />}
  </Secao>;
}

function DetalheAgravo({ agravo, mun, ano, nome, onFechar }: { agravo: string; mun: string; ano: number; nome: string; onFechar: () => void }) {
  const ind = `casos:${agravo}`;
  const [recorte, setRecorte] = useState("faixa_etaria");
  const anual = useQuery({ queryKey: ["fvs-serie", ind, mun, "ano"], queryFn: () =>
    apiGet<{ linhas: LinhaSerie[] }>(`${FVS_API}/serie`, { fonte: "sinan", indicador: ind, mun: `${mun},${IBGE_AM}`, ano_inicio: ano - 9, ano_fim: ano, periodo_tipo: "ano" }) });
  const sem = useQuery({ queryKey: ["fvs-serie", ind, mun, "se", ano], queryFn: () =>
    apiGet<{ linhas: LinhaSerie[] }>(`${FVS_API}/serie`, { fonte: "sinan", indicador: ind, mun, ano_inicio: ano - 1, ano_fim: ano, periodo_tipo: "se" }) });
  const rec = useQuery({ queryKey: ["fvs-serie", ind, mun, recorte, ano], queryFn: () =>
    apiGet<{ linhas: LinhaSerie[] }>(`${FVS_API}/serie`, { fonte: "sinan", indicador: ind, mun, ano_inicio: ano, ano_fim: ano, periodo_tipo: "ano", recorte }) });
  const anos = Array.from({ length: 10 }, (_, i) => ano - 9 + i);
  const dados = anos.map(a => ({ ano: String(a),
    mun: anual.data?.linhas.find(r => r.ano === a && r.ibge6 === mun)?.valor ?? 0 }));
  return (
    <div style={{ background: "#fff", border: `1px solid ${COR.borda}`, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <b style={{ fontSize: 15, color: COR.texto }}>{agravo} — {nome}</b>
        <button style={botaoSec} onClick={onFechar}>Fechar</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        <div><div style={{ fontSize: 12, fontWeight: 700, color: COR.sub }}>Notificações por ano</div>
          <BarrasAnuais dados={dados} series={[{ chave: "mun", nome }]} /></div>
        <div><div style={{ fontSize: 12, fontWeight: 700, color: COR.sub }}>Semana epidemiológica — {ano} × {ano - 1}</div>
          <CurvaSemanal linhas={sem.data?.linhas ?? []} ano={ano} /></div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <label style={rotuloStyle}>Perfil em {ano}
          <select value={recorte} onChange={e => setRecorte(e.target.value)} style={selectStyle}>
            {["faixa_etaria", "sexo", "zona", "raca_cor"].map(r => <option key={r} value={r}>{ROTULO_RECORTE[r]}</option>)}
          </select></label>
      </div>
      {rec.data?.linhas.length
        ? <BarrasRecorte itens={rec.data.linhas.map(r => ({ rotulo: r.recorte_valor, valor: r.valor ?? 0 }))} />
        : <Vazio>Sem recorte por {ROTULO_RECORTE[recorte].toLowerCase()} em {ano}.</Vazio>}
    </div>
  );
}

// ── Mapa ──────────────────────────────────────────────────────────────────────

function AbaMapa({ ano, agravos, onMunicipio, mun }: { ano: number; agravos: string[]; onMunicipio: (m: string) => void; mun: string }) {
  const [indicador, setIndicador] = useState("sinan|casos:Malária");
  const [medida, setMedida] = useState<"valor" | "taxa_100mil" | "variacao_pct">("valor");
  const [fonte, ind] = indicador.split("|");
  const anoMapa = fonte === "malaria" && ind === "ipa" ? ano - 1 : ano;
  const q = useQuery({ queryKey: ["fvs-mapa", indicador, anoMapa],
    queryFn: () => apiGet<{ municipios: ValorMapa[]; sem_dado: string[]; estado: EstadoFonte; taxa: any }>(`${FVS_API}/mapa`, { fonte, indicador: ind, ano: anoMapa }) });
  const lista = useQuery({ queryKey: ["fvs-indicadores-sinan"], queryFn: () => apiGet<{ indicadores: string[] }>(`${FVS_API}/indicadores`, { fonte: "sinan" }) });
  const opcoes = (lista.data?.indicadores ?? agravos.map(a => `casos:${a}`)).filter(i => i.startsWith("casos:"));
  const medidaOk = medida === "taxa_100mil" && !q.data?.taxa ? "valor" : medida;
  const rotulo = medidaOk === "valor" ? (ind === "ipa" ? "IPA" : "Casos") : medidaOk === "taxa_100mil" ? "Casos por 100 mil hab." : `Variação ${anoMapa} × ${anoMapa - 1}`;
  const ordenados = [...(q.data?.municipios ?? [])].sort((a, b) => ((b[medidaOk] as number) ?? -1e9) - ((a[medidaOk] as number) ?? -1e9));
  return (
    <Secao titulo={`Mapa epidemiológico do Amazonas — ${anoMapa}`} direita={<SeloFonteFvs estado={q.data?.estado} compacto />}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={rotuloStyle}>Indicador
          <select value={indicador} onChange={e => setIndicador(e.target.value)} style={{ ...selectStyle, minWidth: 240 }}>
            <optgroup label="Malária (SIVEP)">
              <option value="malaria|positivos">Malária — positivos (SIVEP)</option>
              <option value="malaria|ipa">Malária — IPA do ano anterior</option>
            </optgroup>
            <optgroup label="Doenças e agravos (SINAN — base FVS)">
              {opcoes.map(o => <option key={o} value={`sinan|${o}`}>{o.slice(6)}</option>)}
            </optgroup>
          </select></label>
        <label style={rotuloStyle}>Medida
          <select value={medidaOk} onChange={e => setMedida(e.target.value as any)} style={selectStyle}>
            <option value="valor">{ind === "ipa" ? "IPA" : "Casos"}</option>
            {q.data?.taxa && <option value="taxa_100mil">Taxa por 100 mil</option>}
            <option value="variacao_pct">Variação × ano anterior</option>
          </select></label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12, alignItems: "start" }}>
        <div style={{ background: "#fff", border: `1px solid ${COR.borda}`, borderRadius: 10, padding: 10 }}>
          <MapaAmazonas valores={q.data?.municipios ?? []} medida={medidaOk} selecionados={[mun]} rotuloMedida={rotulo}
            onSelecionar={onMunicipio} />
          <div style={{ fontSize: 11, color: COR.sub, marginTop: 4 }}>Limites municipais: IBGE (malhas territoriais). Clique num município para abrir o painel dele.
            {medidaOk !== "valor" || ind === "ipa" ? " Taxas e variações calculadas pelo ERSUS360 sobre números oficiais." : ""}
            {fonte === "malaria" ? " Malária por município provável de infecção." : ""}</div>
        </div>
        <div style={{ maxHeight: 560, overflowY: "auto" }}>
          <TabelaSimples colunas={["Município", rotulo, `${anoMapa - 1}`]}
            linhas={ordenados.map(m => [<button style={{ background: "none", border: 0, padding: 0, color: COR.primaria, cursor: "pointer", fontSize: 12.5, textAlign: "left" }}
              onClick={() => onMunicipio(m.ibge6)}>{m.nome}</button>,
              medidaOk === "variacao_pct" ? fmtPct(m.variacao_pct) : fmt(m[medidaOk] as number, medidaOk === "valor" && ind !== "ipa" ? 0 : ind === "ipa" ? 2 : 1),
              fmt(m.ano_anterior, ind === "ipa" ? 2 : 0)])} />
        </div>
      </div>
    </Secao>
  );
}

// ── Comparativo ───────────────────────────────────────────────────────────────

function AbaComparativo({ mun, ano }: { mun: string; ano: number }) {
  const { data: lista } = useMunicipiosFvs();
  const [outros, setOutros] = useState<string[]>([]);
  const sel = [mun, ...outros.filter(o => o !== mun)].filter(x => x !== IBGE_AM).slice(0, 10);
  const q = useQuery({ queryKey: ["fvs-comparativo", sel.join(","), ano], enabled: sel.length > 0,
    queryFn: () => apiGet<{ municipios: { ibge6: string; nome: string; populacao: [number, number] | null }[];
      linhas: { fonte: string; indicador: string; valores: Record<string, { valor: number | null; taxa_100mil: number | null; texto: string | null }> }[];
      pqa_vs: Record<string, { periodo: string; atingidos: number; avaliados: number } | null> }>(`${FVS_API}/comparativo`, { mun: sel.join(","), ano }) });
  const tend = useQuery({ queryKey: ["fvs-tendencias", ano], queryFn: () => apiGet<{ municipios: any[] }>(`${FVS_API}/tendencias`, { fonte: "malaria", indicador: "positivos", ano }) });
  return <>
    <Secao titulo={`Comparação entre municípios — ${ano}`}>
      <label style={rotuloStyle}>Acrescentar municípios (até 9; Ctrl para vários)
        <select multiple value={outros} onChange={e => setOutros(Array.from(e.target.selectedOptions).map(o => o.value).slice(0, 9))}
          style={{ ...selectStyle, height: 130, maxWidth: 360 }}>
          {(lista?.municipios ?? []).filter(m => m.ibge6 !== mun).map(m => <option key={m.ibge6} value={m.ibge6}>{m.nome} — {m.regiao_saude}</option>)}
        </select></label>
      {q.data && <TabelaSimples colunas={["Indicador", ...q.data.municipios.map(m => m.nome ?? m.ibge6)]}
        linhas={[
          ["PQA-VS (metas atingidas)", ...q.data.municipios.map(m => { const p = q.data!.pqa_vs[m.ibge6]; return p ? `${p.atingidos}/${p.avaliados} (${p.periodo})` : "—"; })],
          ...q.data.linhas.map(l => [(l.fonte === "malaria" ? "Malária — " : "") + l.indicador.replace("casos:", ""),
            ...q.data!.municipios.map(m => { const v = l.valores[m.ibge6]; if (!v) return "—";
              return `${fmt(v.valor, l.indicador === "ipa" ? 2 : 0)}${v.taxa_100mil !== null && v.taxa_100mil !== undefined ? ` (${fmt(v.taxa_100mil, 1)}/100 mil)` : ""}`; })]),
        ]} />}
      <div style={{ fontSize: 11, color: COR.sub }}>Contagens oficiais da FVS; taxas por 100 mil calculadas pelo ERSUS360 com a população do PQA-VS.</div>
    </Secao>
    <Secao titulo={`Malária — municípios com maior aumento em ${ano} (mesmo período do ano anterior)`}>
      {tend.data?.municipios.length ? <TabelaSimples colunas={["Município", "Acumulado", "Mesmo período ano anterior", "Variação"]}
        linhas={tend.data.municipios.map(t => [t.nome, fmt(t.acumulado), fmt(t.mesmo_periodo_ano_anterior), fmtPct(t.variacao_pct)])} />
        : <Vazio>Sem série semanal para comparar.</Vazio>}
    </Secao>
  </>;
}

// ── Painéis oficiais ──────────────────────────────────────────────────────────

function AbaPaineis() {
  const { data } = useCatalogoFvs();
  if (!data) return <Vazio>Carregando o inventário…</Vazio>;
  const grupos = Array.from(new Set(data.paineis.map(p => p.grupo)));
  return <>
    <Vazio>Inventário dos painéis públicos da FVS-RCP/AM levantado em 23/10/2026. "Dados extraídos" entram nos indicadores do ERSUS360;
      os demais são exibidos como painel oficial. As pastas com dado pessoal identificado não são baixadas pelo ERSUS360 (LGPD) e
      aparecem sem barra de download.</Vazio>
    {grupos.map(g => (
      <Secao key={g} titulo={g}>
        <div style={{ display: "grid", gap: 8 }}>{data.paineis.filter(p => p.grupo === g).map(p => (
          <div key={p.id}>
            <PainelOficial painel={p} />
            <div style={{ fontSize: 11, color: COR.sub, padding: "3px 4px" }}>Subabas: {p.subabas.map(s => data.subabas[s]).join(" · ")}</div>
          </div>))}</div>
      </Secao>
    ))}
    <Secao titulo="Subabas sem painel da FVS">
      <TabelaSimples colunas={["Subaba", "Situação"]} alinhar={["left", "left"]}
        linhas={Object.entries(data.sem_fonte_fvs).map(([s, t]) => [data.subabas[s], t])} />
    </Secao>
  </>;
}
