/**
 * Painel de Vigilância em Saúde — entrada da aba VIGILÂNCIA EM SAÚDE.
 * Painel executivo consolidado com os dados públicos da FVS-RCP/AM (62 municípios do AM):
 * visão geral + alertas, mapa, comparativo, PQA-VS, relatórios, Agente IA, integrações e painéis oficiais.
 * Começa no município da sessão; qualquer município do AM pode ser consultado (dado público).
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, ArrowLeft, Bot, FileText, Map as MapIcon, Network, Scale, ShieldCheck, Target } from "lucide-react";
import { apiGet } from "../lib/api";
import { useAuth } from "../App";
import { COR, FVS_API, IBGE_AM, ROTULO_RECORTE, SUBABA_ROTA, fmt, fmtPct, ibge6, useCatalogoFvs, useMunicipiosFvs,
  type EstadoFonte, type LinhaSerie } from "../lib/vigilanciaFvs";
import { Cartao, PainelOficial, Secao, SeletorAno, SeletorMunicipioFvs, SeloFonteFvs, TabelaSimples, TagOrigem, Vazio,
  botaoSec, rotuloStyle, selectStyle } from "../components/vigilancia/FvsBase";
import { BarrasAnuais, BarrasRecorte, CurvaSemanal } from "../components/vigilancia/Graficos";
import MapaAmazonas, { type ValorMapa } from "../components/vigilancia/MapaAmazonas";
import { AbaAgenteIA, AbaIntegracoes, AbaRelatorios } from "../components/vigilancia/AbasFerramentas";

type Aba = "geral" | "mapa" | "comparativo" | "pqa" | "relatorios" | "ia" | "integracoes" | "paineis";
const ABAS: { id: Aba; rotulo: string; Icon: typeof Activity }[] = [
  { id: "geral", rotulo: "Visão geral", Icon: Activity }, { id: "mapa", rotulo: "Mapa do AM", Icon: MapIcon },
  { id: "comparativo", rotulo: "Comparativo", Icon: Scale }, { id: "pqa", rotulo: "PQA-VS", Icon: Target },
  { id: "relatorios", rotulo: "Relatórios", Icon: FileText }, { id: "ia", rotulo: "Agente IA", Icon: Bot },
  { id: "integracoes", rotulo: "Integrações", Icon: Network }, { id: "paineis", rotulo: "Painéis oficiais", Icon: ShieldCheck },
];

interface Comparacao { ate_se: number; acumulado: number; mesmo_periodo_ano_anterior: number; variacao_pct: number | null }
interface Painel {
  municipio: { ibge6: string; nome: string }; ano: number;
  populacao_referencia: { ano: number; valor: number; fonte: string } | null;
  fontes: Record<string, EstadoFonte>;
  cartoes: Record<string, { valor: number | null; total?: number; periodo?: string; origem: string; fonte: string; nota?: string }>;
  agravos: { agravo: string; indicador: string; casos_ano: number | null; casos_ano_anterior: number | null; incidencia_100mil: number | null; comparacao: Comparacao | null }[];
  malaria: { positivos_ano: number | null; positivos_ano_anterior: number | null; ipa_ano_anterior: LinhaSerie | null; comparacao: Comparacao | null } | null;
  aesop: Record<string, any> | null;
  pqa_vs: { periodo_rotulo: string; atingidos: number; avaliados: number; itens: any[]; abaixo_da_meta: any[] } | null;
  indisponivel: { item: string; motivo: string }[];
}
interface Alerta { tipo: "oficial" | "calculado" | "integracao"; nivel: string; fonte: string; titulo: string; detalhe: string; formula?: string; subaba: string }

export default function VigilanciaSaudePainel() {
  const auth = useAuth();
  const [aba, setAba] = useState<Aba>("geral");
  const [mun, setMun] = useState(() => ibge6(auth.municipio_ibge) || "130014");
  const [ano, setAno] = useState(new Date().getFullYear());
  const painel = useQuery({ queryKey: ["fvs-painel", mun, ano], queryFn: () => apiGet<Painel>(`${FVS_API}/painel`, { mun, ano }) });
  const agravos = useMemo(() => (painel.data?.agravos ?? []).map(a => a.agravo), [painel.data]);

  return (
    <div style={{ minHeight: "100vh", background: COR.fundo, padding: "16px clamp(12px, 3vw, 24px)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <Link to="/" style={{ display: "inline-flex", gap: 4, alignItems: "center", fontSize: 12, color: COR.sub, textDecoration: "none" }}>
              <ArrowLeft size={13} /> Início</Link>
            <h1 style={{ margin: "4px 0 2px", fontSize: 22, fontWeight: 800, color: COR.texto }}>Painel de Vigilância em Saúde</h1>
            <div style={{ fontSize: 12.5, color: COR.sub }}>Dados públicos da FVS-RCP/AM para os 62 municípios do Amazonas ·{" "}
              <a href="https://www.fvs.am.gov.br/dadossaude" target="_blank" rel="noreferrer" style={{ color: COR.primaria }}>fvs.am.gov.br/dadossaude</a></div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
            <SeletorMunicipioFvs valor={mun} onChange={setMun} incluirEstado />
            <SeletorAno valor={ano} onChange={setAno} desde={2015} />
          </div>
        </div>

        <nav style={{ display: "flex", gap: 4, overflowX: "auto", borderBottom: `1px solid ${COR.borda}` }} aria-label="Seções do painel">
          {ABAS.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)} aria-current={aba === a.id}
              style={{ display: "inline-flex", gap: 5, alignItems: "center", padding: "9px 12px", border: 0, background: "none", cursor: "pointer",
                whiteSpace: "nowrap", fontSize: 13, fontWeight: 700, color: aba === a.id ? COR.primaria : COR.sub,
                borderBottom: `2px solid ${aba === a.id ? COR.primaria : "transparent"}` }}>
              <a.Icon size={14} /> {a.rotulo}</button>
          ))}
        </nav>

        {aba === "geral" && <AbaGeral painel={painel.data} carregando={painel.isLoading} erro={painel.isError} mun={mun} ano={ano} />}
        {aba === "mapa" && <AbaMapa ano={ano} agravos={agravos} onMunicipio={m => { setMun(m); setAba("geral"); }} mun={mun} />}
        {aba === "comparativo" && <AbaComparativo mun={mun} ano={ano} />}
        {aba === "pqa" && <AbaPqa mun={mun} />}
        {aba === "relatorios" && <AbaRelatorios mun={mun === IBGE_AM ? ibge6(auth.municipio_ibge) : mun} agravos={agravos} />}
        {aba === "ia" && <AbaAgenteIA mun={mun === IBGE_AM ? ibge6(auth.municipio_ibge) : mun} />}
        {aba === "integracoes" && <AbaIntegracoes />}
        {aba === "paineis" && <AbaPaineis />}
      </div>
    </div>
  );
}

// ── Visão geral ───────────────────────────────────────────────────────────────

function AbaGeral({ painel: p, carregando, erro, mun, ano }: { painel?: Painel; carregando: boolean; erro: boolean; mun: string; ano: number }) {
  const [agravo, setAgravo] = useState<string | null>(null);
  const alertas = useQuery({ queryKey: ["fvs-alertas", mun, ano], enabled: mun !== IBGE_AM,
    queryFn: () => apiGet<{ alertas: Alerta[]; legenda: Record<string, string> }>(`${FVS_API}/alertas`, { mun, ano }) });
  if (carregando) return <Vazio>Carregando o painel…</Vazio>;
  if (erro || !p) return <Vazio>Não foi possível carregar o painel agora.</Vazio>;
  const c = p.cartoes;
  const semDado = Object.values(p.fontes).every(f => f.situacao === "nunca_sincronizada");
  return <>
    {semDado && <Vazio>Os dados da FVS ainda não foram sincronizados neste servidor. A primeira coleta roda automaticamente alguns minutos depois
      da publicação do sistema; perfis autorizados podem iniciar agora em "Integrações".</Vazio>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
      <Cartao titulo={`Notificações SINAN ${ano}`} valor={fmt(c.notificacoes_sinan?.valor)} origem="oficial" sub="todas as doenças/agravos da base FVS"
        onClick={() => document.getElementById("fvs-agravos")?.scrollIntoView({ behavior: "smooth" })} />
      <Cartao titulo={`Malária — positivos ${ano}`} valor={fmt(c.malaria_positivos?.valor)} origem="oficial" cor="#2a78d6"
        sub={p.malaria?.ipa_ano_anterior ? `IPA ${ano - 1}: ${fmt(p.malaria.ipa_ano_anterior.valor, 2)} — ${p.malaria.ipa_ano_anterior.texto}` : "SIVEP-Malária"} />
      <Cartao titulo={`SRAG ${ano}`} valor={fmt(c.srag_casos?.valor)} origem="oficial" cor="#eb6834"
        sub={p.aesop ? `Aviso AESOP SE ${p.aesop.se}: ${p.aesop.aviso_aesop ?? "—"}` : "SIVEP-Gripe (painel AESOP)"} />
      <Cartao titulo="PQA-VS — metas atingidas" valor={c.pqa_vs?.valor === null || c.pqa_vs?.valor === undefined ? "—" : `${c.pqa_vs.valor}/${c.pqa_vs.total}`}
        origem="oficial" cor="#1baf7a" sub={c.pqa_vs?.periodo ?? "sem resultado publicado"} />
      <Cartao titulo="Vacinas COVID-19 (total)" valor={fmt(c.vacinas_covid_doses?.valor)} origem="oficial" cor="#6250d6" sub="Vacinômetro FVS · série 2021–2025" />
    </div>

    {mun !== IBGE_AM && (
      <Secao titulo={<span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><AlertTriangle size={16} /> Alertas epidemiológicos</span>}>
        {alertas.data?.alertas.length ? (
          <div style={{ display: "grid", gap: 6 }}>
            {alertas.data.alertas.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fff", border: `1px solid ${COR.borda}`,
                borderLeft: `4px solid ${a.nivel === "alto" ? COR.alto : a.nivel === "medio" ? COR.medio : COR.baixo}`, borderRadius: 8, padding: "8px 10px" }}>
                <AlertTriangle size={15} color={a.nivel === "alto" ? COR.alto : a.nivel === "medio" ? COR.medio : COR.baixo} style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <b style={{ fontSize: 13, color: COR.texto }}>{a.titulo}</b>
                    <TagOrigem origem={a.tipo} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: COR.sub }}>NÍVEL {a.nivel.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: COR.sub }}>{a.detalhe}</div>
                  {a.formula && <div style={{ fontSize: 11, color: COR.sub }}>Cálculo: {a.formula}</div>}
                </div>
                {SUBABA_ROTA[a.subaba] && <Link to={SUBABA_ROTA[a.subaba]} style={{ ...botaoSec, flexShrink: 0 }}>Detalhar</Link>}
              </div>
            ))}
            <div style={{ fontSize: 11, color: COR.sub }}>{alertas.data.legenda.oficial} {alertas.data.legenda.calculado}</div>
          </div>
        ) : <Vazio>{alertas.isLoading ? "Calculando alertas…" : "Nenhum alerta para o município no período."}</Vazio>}
      </Secao>
    )}

    <div id="fvs-agravos" />
    <Secao titulo={`Doenças e agravos de notificação — ${p.municipio.nome}`} direita={<SeloFonteFvs estado={p.fontes.sinan} compacto />}>
      {p.agravos.length ? (
        <TabelaSimples colunas={["Doença/agravo", `${ano}`, `${ano - 1}`, "Mesmo período", "Variação", "Incid./100 mil", ""]}
          linhas={p.agravos.map(a => [a.agravo, fmt(a.casos_ano), fmt(a.casos_ano_anterior),
            a.comparacao ? `${fmt(a.comparacao.acumulado)} × ${fmt(a.comparacao.mesmo_periodo_ano_anterior)} (SE 1–${a.comparacao.ate_se})` : "—",
            fmtPct(a.comparacao?.variacao_pct), fmt(a.incidencia_100mil, 1),
            <button style={botaoSec} onClick={() => setAgravo(a.agravo)}>Detalhar</button>])} />
      ) : <Vazio>Sem notificações na base da FVS para {p.municipio.nome} em {ano} e {ano - 1}.</Vazio>}
      <div style={{ fontSize: 11, color: COR.sub }}>
        {p.populacao_referencia ? `Incidência calculada pelo ERSUS360: casos ÷ população ${p.populacao_referencia.ano} (${fmt(p.populacao_referencia.valor)} hab., ${p.populacao_referencia.fonte}) × 100.000. ` : ""}
        Variação = mesmas semanas epidemiológicas dos dois anos (calculada pelo ERSUS360).</div>
    </Secao>
    {agravo && <DetalheAgravo agravo={agravo} mun={mun} ano={ano} nome={p.municipio.nome} onFechar={() => setAgravo(null)} />}

    <Secao titulo="Informações indisponíveis nas fontes públicas">
      <div style={{ display: "grid", gap: 6 }}>{p.indisponivel.map(i => <Vazio key={i.item}><b>{i.item}:</b> {i.motivo}</Vazio>)}</div>
    </Secao>
  </>;
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

// ── PQA-VS ────────────────────────────────────────────────────────────────────

function AbaPqa({ mun }: { mun: string }) {
  const q = useQuery({ queryKey: ["fvs-pqa", mun], enabled: mun !== IBGE_AM,
    queryFn: () => apiGet<{ ultimo: Painel["pqa_vs"]; historico: any[]; nota_definicoes: string; estado: EstadoFonte }>(`${FVS_API}/pqa-vs`, { mun }) });
  const [ind, setInd] = useState("IND_01");
  if (mun === IBGE_AM) return <Vazio>Escolha um município: o PQA-VS é avaliado por município.</Vazio>;
  const u = q.data?.ultimo;
  const hist = (q.data?.historico ?? []).filter(h => h.indicador === ind && h.resultado !== null);
  return <>
    <Secao titulo={`PQA-VS — ${u?.periodo_rotulo ?? "sem resultado"}`} direita={<SeloFonteFvs estado={q.data?.estado} compacto />}>
      {u ? <TabelaSimples colunas={["Nº", "Numerador", "Denominador", "Resultado", "Meta", "Atingiu", "Observação"]}
        alinhar={["left", "right", "right", "right", "left", "left", "left"]}
        linhas={u.itens.map((i: any) => [<button style={{ background: "none", border: 0, padding: 0, color: COR.primaria, cursor: "pointer" }}
          onClick={() => setInd(i.indicador)}>{i.indicador.replace("IND_", "Indicador ")}</button>,
          fmt(i.numerador, i.numerador % 1 ? 2 : 0), fmt(i.denominador, i.denominador % 1 ? 2 : 0), fmt(i.resultado, 1), i.meta ?? "—",
          i.observacao === "Ausência de casos" ? "não avaliado" : <b style={{ color: i.alcance === "SIM" ? "#15803d" : COR.alto }}>{i.alcance ?? "—"}</b>,
          i.observacao ?? ""])} /> : <Vazio>Sem resultado do PQA-VS publicado para este município.</Vazio>}
      {u && <div style={{ fontSize: 12, color: COR.sub }}>Metas atingidas: <b>{u.atingidos} de {u.avaliados}</b> avaliados (alcance publicado pela FVS). {q.data?.nota_definicoes}</div>}
    </Secao>
    <Secao titulo={`Histórico — ${ind.replace("IND_", "indicador ")}`}>
      {hist.length ? <BarrasAnuais dados={hist.map(h => ({ ano: h.periodo, valor: h.resultado }))} series={[{ chave: "valor", nome: "Resultado" }]} />
        : <Vazio>Sem histórico numérico para este indicador.</Vazio>}
      <div style={{ fontSize: 11, color: COR.sub }}>Até 2023 por ano; a partir de 2025 por quadrimestre. A definição de alguns indicadores mudou em 2024 — compare com cuidado.</div>
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
