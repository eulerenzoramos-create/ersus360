/**
 * Seção "Dados oficiais FVS-AM" acrescentada a cada uma das 15 subabas da Vigilância em Saúde.
 * Não substitui a tela existente: aparece acima dela, recolhível, com os números da FVS-RCP/AM
 * ligados àquela subaba, os painéis oficiais correspondentes e a situação de cada fonte.
 */
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Landmark, LayoutDashboard } from "lucide-react";
import { apiGet } from "../../lib/api";
import { useAuth } from "../../App";
import { COR, FVS_API, fmt, fmtPct, ibge6, type EstadoFonte, type LinhaSerie, type PainelFvs } from "../../lib/vigilanciaFvs";
import { Cartao, PainelOficial, Secao, SeletorAno, SeletorMunicipioFvs, SeloFonteFvs, TabelaSimples, Vazio } from "./FvsBase";
import { BarrasAnuais, CurvaSemanal } from "./Graficos";

interface Comparacao { ate_se: number; acumulado: number; mesmo_periodo_ano_anterior: number; variacao_pct: number | null;
  ultimas_semanas: number | null; semanas_anteriores: number | null; variacao_recente_pct: number | null; janela_semanas: number }
interface RespostaSubaba {
  id: string; subaba: string; municipio: { ibge6: string; nome: string }; ano: number;
  paineis: PainelFvs[]; sem_fonte_fvs: string | null;
  agravos: { agravo: string; anual: LinhaSerie[]; semanal: LinhaSerie[]; comparacao: Comparacao | null }[];
  pqa_vs: { indicadores: { indicador: string; nome: string | null; historico: any[] }[] } | null;
  malaria?: { anual: LinhaSerie[]; semanal: LinhaSerie[]; parasita: LinhaSerie[]; comparacao: Comparacao | null };
  aesop?: { ultima: Record<string, any> | null; semanal: LinhaSerie[] };
  vacinometro?: { anual: LinhaSerie[]; dose: LinhaSerie[] };
  fontes: Record<string, EstadoFonte>;
}

const PREFERENCIA_SECAO = "ersus360.fvs.secao.aberta";

function lerAberto(): boolean {
  try { return localStorage.getItem(PREFERENCIA_SECAO) !== "0"; } catch { return true; }
}

export function ComFvs({ id, children }: { id: string; children: ReactNode }) {
  return <>
    <div style={{ padding: "16px 16px 0", maxWidth: 1280, margin: "0 auto" }}><DadosOficiaisFvs id={id} /></div>
    {children}
  </>;
}

export default function DadosOficiaisFvs({ id }: { id: string }) {
  const auth = useAuth();
  const [aberto, setAberto] = useState(lerAberto);
  const [mun, setMun] = useState(() => ibge6(auth.municipio_ibge) || "130014");
  const [ano, setAno] = useState(new Date().getFullYear());
  const q = useQuery({
    queryKey: ["fvs-subaba", id, mun, ano], enabled: aberto,
    queryFn: () => apiGet<RespostaSubaba>(`${FVS_API}/subaba`, { id, mun, ano }),
  });
  const alternar = () => {
    setAberto(a => { try { localStorage.setItem(PREFERENCIA_SECAO, a ? "0" : "1"); } catch { /* sem armazenamento */ } return !a; });
  };
  const d = q.data;
  return (
    <div style={{ background: "#f0fdfa", border: `1px solid #99f6e4`, borderRadius: 12, marginBottom: 16 }}>
      <button onClick={alternar} aria-expanded={aberto}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "none", border: 0, cursor: "pointer", textAlign: "left" }}>
        {aberto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Landmark size={16} color={COR.primaria} />
        <span style={{ fontWeight: 800, fontSize: 14, color: COR.texto }}>Dados oficiais FVS-AM</span>
        <span style={{ fontSize: 12, color: COR.sub }}>Fundação de Vigilância em Saúde do Amazonas · painéis públicos</span>
      </button>
      {aberto && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
              <SeletorMunicipioFvs valor={mun} onChange={setMun} />
              <SeletorAno valor={ano} onChange={setAno} desde={2015} />
            </div>
            <Link to="/vigilancia-saude" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: COR.primaria }}>
              <LayoutDashboard size={14} /> Painel de Vigilância (mapa, alertas, relatórios, IA)</Link>
          </div>
          {q.isLoading && <Vazio>Carregando dados da FVS…</Vazio>}
          {q.isError && <Vazio>Não foi possível carregar os dados da FVS agora. A tela abaixo continua funcionando.</Vazio>}
          {d && <Conteudo d={d} />}
        </div>
      )}
    </div>
  );
}

function Conteudo({ d }: { d: RespostaSubaba }) {
  const temDado = d.agravos.length || d.pqa_vs || d.malaria?.anual.length || d.aesop?.ultima || d.vacinometro?.anual.length;
  return <>
    {d.sem_fonte_fvs && <Vazio>{d.sem_fonte_fvs} As funcionalidades desta subaba continuam com as fontes que já usavam.</Vazio>}
    {!temDado && !d.sem_fonte_fvs && <Vazio>Os dados da FVS para esta subaba ainda não foram sincronizados. A situação de cada fonte aparece em
      "Painel de Vigilância → Integrações".</Vazio>}
    {d.malaria && d.malaria.anual.length > 0 && <BlocoMalaria d={d} />}
    {d.agravos.map(a => <BlocoAgravo key={a.agravo} a={a} ano={d.ano} nome={d.municipio.nome} estado={d.fontes.sinan} />)}
    {d.aesop?.ultima && <BlocoAesop d={d} />}
    {d.vacinometro && d.vacinometro.anual.length > 0 && <BlocoVacinometro d={d} />}
    {d.pqa_vs && <BlocoPqa d={d} />}
    {d.paineis.length > 0 && (
      <Secao titulo="Painéis oficiais da FVS relacionados">
        <div style={{ display: "grid", gap: 8 }}>{d.paineis.map(p => <PainelOficial key={p.id} painel={p} />)}</div>
      </Secao>
    )}
  </>;
}

function anualParaGrafico(linhas: LinhaSerie[], mun: string, indicador?: string) {
  const anos = Array.from(new Set(linhas.map(r => r.ano))).sort();
  return anos.map(ano => ({ ano: String(ano), valor: linhas.find(r => r.ano === ano && r.ibge6 === mun && (!indicador || r.indicador === indicador))?.valor ?? 0 }));
}

function ResumoComparacao({ c, ano }: { c: Comparacao | null; ano: number }) {
  if (!c) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 8 }}>
      <Cartao titulo={`Acumulado ${ano} (SE 1–${c.ate_se})`} valor={fmt(c.acumulado)} origem="oficial" />
      <Cartao titulo={`Mesmo período ${ano - 1}`} valor={fmt(c.mesmo_periodo_ano_anterior)} origem="oficial" cor="#eb6834" />
      <Cartao titulo="Variação no período" valor={fmtPct(c.variacao_pct)} origem="calculado" cor="#7c3aed"
        sub={`Últimas ${c.janela_semanas} SE: ${fmt(c.ultimas_semanas)} × ${fmt(c.semanas_anteriores)} (${fmtPct(c.variacao_recente_pct)})`} />
    </div>
  );
}

function BlocoAgravo({ a, ano, nome, estado }: { a: RespostaSubaba["agravos"][number]; ano: number; nome: string; estado?: EstadoFonte }) {
  const mun = a.anual.find(r => r.ibge6 !== "130000")?.ibge6 ?? "";
  const dados = anualParaGrafico(a.anual, mun);
  return (
    <Secao titulo={`${a.agravo} — ${nome}`} direita={<SeloFonteFvs estado={estado} compacto />}>
      {a.anual.length === 0 && a.semanal.length === 0
        ? <Vazio>Sem notificações de {a.agravo} na base da FVS para este município no período.</Vazio>
        : <>
          <ResumoComparacao c={a.comparacao} ano={ano} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
            <div style={caixa}><div style={tituloCaixa}>Notificações por ano</div><BarrasAnuais dados={dados} series={[{ chave: "valor", nome: "Notificações" }]} /></div>
            <div style={caixa}><div style={tituloCaixa}>Por semana epidemiológica — {ano} × {ano - 1}</div><CurvaSemanal linhas={a.semanal} ano={ano} /></div>
          </div>
        </>}
    </Secao>
  );
}

function BlocoMalaria({ d }: { d: RespostaSubaba }) {
  const m = d.malaria!;
  const pos = m.anual.filter(r => r.indicador === "positivos" && r.ibge6 === d.municipio.ibge6);
  const ipa = m.anual.filter(r => r.indicador === "ipa" && r.ibge6 === d.municipio.ibge6);
  const ipaAnt = ipa.find(r => r.ano === d.ano - 1);
  const par = m.parasita.filter(r => r.ano === d.ano);
  return (
    <Secao titulo={`Malária (SIVEP-Malária) — ${d.municipio.nome}`} direita={<SeloFonteFvs estado={d.fontes.malaria} compacto />}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 8 }}>
        <Cartao titulo={`Positivos ${d.ano}`} valor={fmt(pos.find(r => r.ano === d.ano)?.valor)} origem="oficial"
          sub="Exames positivos sem LVC, por município provável de infecção" />
        <Cartao titulo={`IPA ${d.ano - 1}`} valor={fmt(ipaAnt?.valor, 2)} origem="calculado" cor="#7c3aed"
          sub={ipaAnt?.texto ?? "positivos ÷ pop. da planilha FVS × 1.000"} />
        {par.map(p => <Cartao key={p.recorte_valor} titulo={`${p.recorte_valor} ${d.ano}`} valor={fmt(p.valor)} origem="oficial" cor="#1baf7a" />)}
      </div>
      <ResumoComparacao c={m.comparacao} ano={d.ano} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        <div style={caixa}><div style={tituloCaixa}>Positivos por ano</div>
          <BarrasAnuais dados={anualParaGrafico(m.anual, d.municipio.ibge6, "positivos")} series={[{ chave: "valor", nome: "Positivos" }]} /></div>
        <div style={caixa}><div style={tituloCaixa}>Positivos por semana — {d.ano} × {d.ano - 1}</div><CurvaSemanal linhas={m.semanal} ano={d.ano} /></div>
      </div>
    </Secao>
  );
}

function BlocoAesop({ d }: { d: RespostaSubaba }) {
  const a = d.aesop!.ultima!;
  const sim = (v: any) => String(v ?? "").toLowerCase() === "sim";
  return (
    <Secao titulo={`Alerta precoce de síndromes respiratórias (AESOP) — SE ${a.se}/${a.ano}`} direita={<SeloFonteFvs estado={d.fontes.aesop} compacto />}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
        {[["Aviso AESOP", a.aviso_aesop], ["Aviso APS", a.aviso_aps], ["Aviso PIP", a.aviso_pip]].map(([t, v]) =>
          <Cartao key={t} titulo={t} valor={v ?? "—"} origem="oficial" cor={sim(v) ? COR.alto : "#15803d"} />)}
        <Cartao titulo="Probabilidade de crescimento" valor={`${fmt(a.prob_crescimento_pct, 1)}%`} origem="oficial" />
        <Cartao titulo="Síndrome gripal na APS" valor={fmt(a.sindrome_gripal_aps)} sub={`de ${fmt(a.atendimentos_aps)} atendimentos`} origem="oficial" />
        <Cartao titulo="Qualidade do dado (DQI)" valor={a.dqi ?? "—"} origem="oficial" cor={COR.baixo} />
      </div>
    </Secao>
  );
}

function BlocoVacinometro({ d }: { d: RespostaSubaba }) {
  const v = d.vacinometro!;
  return (
    <Secao titulo={`Vacinômetro COVID-19 — ${d.municipio.nome}`} direita={<SeloFonteFvs estado={d.fontes.vacinometro} compacto />}>
      <div style={caixa}><div style={tituloCaixa}>Doses aplicadas em estabelecimentos do município, por ano</div>
        <BarrasAnuais dados={anualParaGrafico(v.anual, d.municipio.ibge6)} series={[{ chave: "valor", nome: "Doses" }]} /></div>
    </Secao>
  );
}

function BlocoPqa({ d }: { d: RespostaSubaba }) {
  const linhas = d.pqa_vs!.indicadores.flatMap(i => i.historico.slice(-6).reverse().map(h => [
    i.indicador.replace("IND_", "Ind. "), h.periodo, fmt(h.resultado, 1), h.meta ?? "—",
    h.observacao === "Ausência de casos" ? "não avaliado" : h.alcance ?? "—", h.nome ?? h.observacao ?? "",
  ]));
  return (
    <Secao titulo="PQA-VS — indicadores ligados a esta subaba" direita={<SeloFonteFvs estado={d.fontes.pqa_vs} compacto />}>
      {linhas.length ? <TabelaSimples colunas={["Indicador", "Período", "Resultado", "Meta", "Atingiu", "Descrição / obs."]}
        linhas={linhas} alinhar={["left", "left", "right", "left", "left", "left"]} />
        : <Vazio>Sem resultado do PQA-VS publicado para este município.</Vazio>}
      <div style={{ fontSize: 11, color: COR.sub }}>Últimos 6 períodos publicados. De 2024 em diante os indicadores seguem a Portaria GM/MS nº 6.878/2025.</div>
    </Secao>
  );
}

const caixa: React.CSSProperties = { background: "#fff", border: `1px solid ${COR.borda}`, borderRadius: 10, padding: 10, minWidth: 0 };
const tituloCaixa: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: COR.sub, marginBottom: 4 };
