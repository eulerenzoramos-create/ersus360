/**
 * Origem dos recursos FNS — Ministério da Saúde × Emendas Parlamentares.
 *
 * O FNS soma no mesmo grupo (Atenção Primária, MAC…) o repasse regular do
 * Ministério e o que veio de emenda. Aqui a composição vem do detalhamento
 * oficial de cada pagamento. O tipo da emenda (individual, bancada, comissão)
 * não é informado pelo FNS: vem da classificação da Secretaria ou do InvestSUS.
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { api, apiGet } from "../lib/api";
import { useAuth } from "../App";

const T = {
  blue: "#1351b4", text: "#0f172a", textSec: "#475569", gray: "#6b7280",
  grayL: "#f8fafc", grayBdr: "#e2e8f0", white: "#ffffff", amber: "#b45309", red: "#dc2626", green: "#15803d",
};
export const COR_ORIGEM: Record<string, string> = {
  ministerio: "#1351b4",
  individual: "#c2410c",
  bancada: "#7c3aed",
  comissao: "#0f766e",
  emenda_nao_classificada: "#d97706",
  proposta_nao_identificada: "#94a3b8",
};
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const PODE_EDITAR = new Set(["administrador_geral", "superadmin", "admin", "gestor", "financeiro", "contabilidade"]);
const brl = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const abrev = (v: number) => v >= 1e6 ? `${(v / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`
  : v >= 1e3 ? `${(v / 1e3).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil` : String(v);
const erroDe = (e: any) => e?.response?.data?.detail ? String(e.response.data.detail) : "Não foi possível salvar.";

export function useOrigemRecursos(exercicio: number) {
  return useQuery<any>({
    queryKey: ["fns-origem", exercicio],
    queryFn: () => apiGet(`/api/fns-origem/painel?exercicio=${exercicio}`),
    staleTime: 120_000,
  });
}

export default function OrigemRecursosFns({ exercicio, mesesVisiveis }: { exercicio: number; mesesVisiveis: number[] }) {
  const auth = useAuth();
  const podeEditar = PODE_EDITAR.has(auth.perfil);
  const qc = useQueryClient();
  const { data, isLoading } = useOrigemRecursos(exercicio);
  const [grupo, setGrupo] = useState<string>("Atenção Primária + MAC");
  const [editando, setEditando] = useState<any | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  const grupos: string[] = useMemo(() => Object.keys(data?.grupos ?? {}), [data]);
  const filtroGrupo = (g: string) => grupo === "Todos" ? true
    : grupo === "Atenção Primária + MAC" ? (g === "Atenção Primária" || g.startsWith("MAC")) : g === grupo;
  const categorias: { chave: string; rotulo: string }[] = data?.categorias ?? [];

  const serie = useMemo(() => mesesVisiveis.map(m => {
    const linha: any = { label: MESES[m - 1], mes: m };
    const gs = data?.meses?.[m] ?? {};
    for (const c of categorias) {
      linha[c.chave] = Object.entries(gs).filter(([g]) => filtroGrupo(g))
        .reduce((s, [, v]: any) => s + (v[c.chave] ?? 0), 0) || undefined;
    }
    return linha;
  }), [data, mesesVisiveis, grupo, categorias]);  // eslint-disable-line react-hooks/exhaustive-deps

  const resumo = useMemo(() => {
    const r: Record<string, number> = {};
    for (const [g, v] of Object.entries<any>(data?.grupos ?? {})) {
      if (!filtroGrupo(g)) continue;
      for (const c of categorias) r[c.chave] = (r[c.chave] ?? 0) + (v[c.chave] ?? 0);
    }
    return r;
  }, [data, grupo, categorias]);  // eslint-disable-line react-hooks/exhaustive-deps
  const total = Object.values(resumo).reduce((s, v) => s + v, 0);
  const emendas = ["individual", "bancada", "comissao", "emenda_nao_classificada"].reduce((s, k) => s + (resumo[k] ?? 0), 0);
  const propostas = (data?.propostas ?? []).filter((p: any) => filtroGrupo(p.grupo));

  const salvar = async (p: any, tipo: string | null, parlamentar: string, numeroEmenda: string) => {
    setMsg(null);
    try {
      await api.put(`/api/fns-origem/propostas/${p.numero_proposta}`,
        { tipo, parlamentar: parlamentar || null, numero_emenda: numeroEmenda || null });
      setEditando(null);
      setMsg({ ok: true, t: `Proposta ${p.numero_proposta} classificada. Registrado na auditoria.` });
      await qc.invalidateQueries({ queryKey: ["fns-origem"] });
    } catch (e) { setMsg({ ok: false, t: erroDe(e) }); }
  };

  const card = { background: T.white, border: `1px solid ${T.grayBdr}`, borderRadius: 16, padding: "22px 26px", marginBottom: 20 };

  if (isLoading) return <div style={card}>Carregando origem dos recursos…</div>;
  if (!data || !data.meses_com_detalhe?.length) return (
    <div style={card}>
      <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>Origem dos Recursos — Ministério da Saúde × Emendas Parlamentares</div>
      <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>
        Ainda não há detalhamento dos pagamentos. Clique em <b>Sincronizar com FNS</b> para buscar, em cada pagamento,
        a marca de emenda e o nº da proposta.
      </div>
    </div>
  );

  return (
    <div style={card}>
      <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>Origem dos Recursos — Ministério da Saúde × Emendas Parlamentares</div>
      <div style={{ fontSize: 12.5, color: T.textSec, margin: "4px 0 14px" }}>
        Os valores de Atenção Primária e MAC incluem recursos de emendas parlamentares. Separação pelo detalhamento
        oficial de cada pagamento do FNS.
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {["Atenção Primária + MAC", "Todos", ...grupos].map(g => (
          <button key={g} onClick={() => setGrupo(g)} style={{
            padding: "5px 12px", fontSize: 11.5, borderRadius: 20, cursor: "pointer",
            border: `2px solid ${grupo === g ? T.blue : T.grayBdr}`, background: grupo === g ? "#e8f0fe" : T.white,
            color: grupo === g ? T.blue : T.textSec, fontWeight: grupo === g ? 700 : 500 }}>{g}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 16 }}>
        <Resumo rotulo="Total recebido" valor={total} cor={T.text} />
        <Resumo rotulo="Ministério da Saúde (regular)" valor={resumo.ministerio ?? 0} cor={COR_ORIGEM.ministerio}
          sub={total ? `${((resumo.ministerio ?? 0) / total * 100).toFixed(1)}%` : undefined} />
        <Resumo rotulo="Emendas parlamentares" valor={emendas} cor={COR_ORIGEM.individual}
          sub={total ? `${(emendas / total * 100).toFixed(1)}% do total` : undefined} />
        {(["individual", "bancada", "comissao", "emenda_nao_classificada", "proposta_nao_identificada"] as const)
          .filter(k => (resumo[k] ?? 0) > 0).map(k => (
            <Resumo key={k} rotulo={categorias.find(c => c.chave === k)?.rotulo ?? k} valor={resumo[k]} cor={COR_ORIGEM[k]} pequeno />
          ))}
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={serie} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: T.textSec }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={abrev} tick={{ fontSize: 10 }} width={70} axisLine={false} tickLine={false} />
          <Tooltip content={({ active, payload, label }: any) => {
            if (!active || !payload?.length) return null;
            const tot = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0);
            const em = payload.filter((p: any) => p.dataKey !== "ministerio" && p.dataKey !== "proposta_nao_identificada")
              .reduce((s: number, p: any) => s + (p.value ?? 0), 0);
            return (
              <div style={{ background: T.white, border: `1px solid ${T.grayBdr}`, borderRadius: 10, padding: "12px 16px",
                boxShadow: "0 6px 20px rgba(0,0,0,.12)", fontSize: 12, minWidth: 280 }}>
                <div style={{ fontWeight: 800, color: T.blue, marginBottom: 8, borderBottom: `2px solid ${T.blue}`, paddingBottom: 6 }}>
                  {String(label).toUpperCase()} / {exercicio} · {grupo}
                </div>
                {[...payload].reverse().map((p: any) => (
                  <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
                    <span style={{ color: T.textSec }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: p.color, marginRight: 6 }} />{p.name}</span>
                    <b style={{ color: p.color }}>{brl(p.value)}</b>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${T.grayBdr}`, marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
                  <span>Total</span><b>{brl(tot)}</b>
                </div>
                {tot > 0 && <div style={{ color: COR_ORIGEM.individual, fontWeight: 700, marginTop: 2 }}>
                  Emendas: {(em / tot * 100).toFixed(1)}% do mês</div>}
              </div>
            );
          }} />
          <Legend wrapperStyle={{ fontSize: 11.5 }} />
          {categorias.map(c => (
            <Bar key={c.chave} dataKey={c.chave} name={c.rotulo} stackId="o" fill={COR_ORIGEM[c.chave]} maxBarSize={46} />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <div style={{ fontWeight: 800, fontSize: 14, color: T.text, margin: "18px 0 6px" }}>
        Emendas e propostas recebidas ({propostas.length})
      </div>
      <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>
        O FNS identifica a emenda e o nº da proposta, mas <b>não informa se é individual, de bancada ou de comissão</b>.
        {podeEditar ? " Classifique cada proposta (fica registrado na auditoria)." : ""} Propostas cadastradas no InvestSUS
        com o tipo da emenda são classificadas automaticamente.
      </div>
      {msg && <div role={msg.ok ? "status" : "alert"} style={{ fontSize: 12.5, marginBottom: 8, color: msg.ok ? T.green : T.red }}>{msg.t}</div>}
      <div style={{ overflowX: "auto", border: `1px solid ${T.grayBdr}`, borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: T.grayL, textAlign: "left" }}>
              {["Proposta", "Grupo / Programa FNS", "Portaria", "Pagamentos", "Valor", "Origem", ""].map(h =>
                <th key={h} style={{ padding: "8px 10px", fontSize: 11, color: T.gray, whiteSpace: "nowrap" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {propostas.map((p: any) => {
              const cl = p.classificacao;
              const aberto = editando?.numero_proposta === p.numero_proposta;
              return (
                <tr key={p.numero_proposta} style={{ borderTop: `1px solid ${T.grayBdr}`, verticalAlign: "top" }}>
                  <td style={{ padding: "8px 10px", fontFamily: "monospace", whiteSpace: "nowrap" }}>{p.numero_proposta}</td>
                  <td style={{ padding: "8px 10px", minWidth: 220 }}>
                    <div style={{ fontWeight: 600 }}>{p.grupo}</div>
                    <div style={{ fontSize: 11, color: T.gray }}>{p.componente}</div>
                  </td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{p.portarias.join(", ") || "—"}</td>
                  <td style={{ padding: "8px 10px", fontSize: 11.5, whiteSpace: "nowrap" }}>
                    {p.pagamentos.map((pg: any, i: number) => (
                      <div key={i}>{pg.data_ob || MESES[pg.mes - 1]} · OB {pg.numero_ob || "—"} · {brl(pg.valor)}</div>
                    ))}
                  </td>
                  <td style={{ padding: "8px 10px", fontWeight: 700, whiteSpace: "nowrap" }}>{brl(p.valor)}</td>
                  <td style={{ padding: "8px 10px", minWidth: 190 }}>
                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                      color: T.white, background: COR_ORIGEM[p.categoria] }}>
                      {categorias.find(c => c.chave === p.categoria)?.rotulo}
                    </span>
                    {cl?.parlamentar && <div style={{ fontSize: 11.5, marginTop: 3 }}>{cl.parlamentar}{cl.numero_emenda ? ` · emenda ${cl.numero_emenda}` : ""}</div>}
                    <div style={{ fontSize: 10.5, color: T.gray, marginTop: 2 }}>
                      {cl ? `Classificação: ${cl.fonte}${cl.classificado_por ? ` (${cl.classificado_por})` : ""}`
                        : p.origem_fns === "emenda" ? "FNS: marcada como EMENDA" : "FNS: proposta sem marca de emenda"}
                    </div>
                    {aberto && <FormClassificar p={p} tipos={data.tipos_classificacao} onSalvar={salvar} onCancelar={() => setEditando(null)} />}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    {podeEditar && !aberto && <button onClick={() => setEditando(p)} style={{ padding: "4px 10px", fontSize: 11.5,
                      borderRadius: 6, border: `1px solid ${T.blue}`, background: T.white, color: T.blue, cursor: "pointer", whiteSpace: "nowrap" }}>
                      Classificar</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: T.gray, marginTop: 8 }}>{data.nota}</div>
    </div>
  );
}

function Resumo({ rotulo, valor, cor, sub, pequeno }: { rotulo: string; valor: number; cor: string; sub?: string; pequeno?: boolean }) {
  return (
    <div style={{ border: `1px solid ${T.grayBdr}`, borderLeft: `4px solid ${cor}`, borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ fontSize: 10.5, color: T.gray, fontWeight: 700, textTransform: "uppercase" }}>{rotulo}</div>
      <div style={{ fontSize: pequeno ? 14 : 17, fontWeight: 800, color: cor, marginTop: 3 }}>{brl(valor)}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>}
    </div>
  );
}

function FormClassificar({ p, tipos, onSalvar, onCancelar }: {
  p: any; tipos: { chave: string; rotulo: string }[];
  onSalvar: (p: any, tipo: string | null, parlamentar: string, numeroEmenda: string) => void; onCancelar: () => void;
}) {
  const [tipo, setTipo] = useState<string>(p.classificacao?.fonte === "Secretaria" ? p.classificacao.tipo : "");
  const [parl, setParl] = useState<string>(p.classificacao?.parlamentar ?? "");
  const [num, setNum] = useState<string>(p.classificacao?.numero_emenda ?? "");
  const inp = { width: "100%", padding: "4px 6px", fontSize: 12, border: `1px solid ${T.grayBdr}`, borderRadius: 5, marginTop: 4 };
  return (
    <div style={{ marginTop: 6, background: T.grayL, borderRadius: 8, padding: 8 }}>
      <select value={tipo} onChange={e => setTipo(e.target.value)} style={inp} aria-label="Tipo">
        <option value="">— sem classificação —</option>
        {tipos.map(t => <option key={t.chave} value={t.chave}>{t.rotulo}</option>)}
      </select>
      {tipo && tipo !== "programa_ms" && <>
        <input value={parl} onChange={e => setParl(e.target.value)} placeholder="Parlamentar / bancada / comissão" style={inp} />
        <input value={num} onChange={e => setNum(e.target.value)} placeholder="Nº da emenda (opcional)" style={inp} />
      </>}
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <button onClick={() => onSalvar(p, tipo || null, parl, num)} style={{ padding: "4px 10px", fontSize: 11.5, borderRadius: 6,
          border: "none", background: T.blue, color: T.white, fontWeight: 700, cursor: "pointer" }}>Salvar</button>
        <button onClick={onCancelar} style={{ padding: "4px 10px", fontSize: 11.5, borderRadius: 6,
          border: `1px solid ${T.grayBdr}`, background: T.white, cursor: "pointer" }}>Cancelar</button>
      </div>
    </div>
  );
}
