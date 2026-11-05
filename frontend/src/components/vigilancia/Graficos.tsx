import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmt, type LinhaSerie } from "../../lib/vigilanciaFvs";

// Paleta categórica validada (skill de visualização): ordem fixa, nunca ciclada
export const SERIE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
// Rampa sequencial (azul) para magnitude no mapa
export const RAMPA = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"];

const eixo = { fontSize: 11, fill: "#52514e" };
const grade = <CartesianGrid stroke="#e7e5e4" vertical={false} />;

function Dica({ active, payload, label, unidade, fmtLabel }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 9px", fontSize: 12, boxShadow: "0 2px 6px #0001", color: "#0b0b0b" }}>
      <div style={{ fontWeight: 700, marginBottom: 3 }}>{fmtLabel ? fmtLabel(label) : label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: "inline-block" }} />
          <span style={{ color: "#52514e" }}>{p.name}:</span>
          <b style={{ fontVariantNumeric: "tabular-nums" }}>{p.value === null || p.value === undefined ? "—" : fmt(p.value, unidade === "taxa" ? 1 : 0)}</b>
        </div>
      ))}
    </div>
  );
}

/** Semana epidemiológica: ano atual × ano anterior (mesmo município). */
export function CurvaSemanal({ linhas, ano, altura = 220 }: { linhas: LinhaSerie[]; ano: number; altura?: number }) {
  const por: Record<number, { se: number; atual?: number; anterior?: number }> = {};
  for (const r of linhas) {
    if (r.periodo_tipo !== "se") continue;
    const p = (por[r.periodo] ??= { se: r.periodo });
    if (r.ano === ano) p.atual = r.valor ?? 0;
    if (r.ano === ano - 1) p.anterior = r.valor ?? 0;
  }
  const ult = Math.max(0, ...linhas.filter(r => r.ano === ano).map(r => r.periodo));
  const dados = Array.from({ length: 53 }, (_, i) => i + 1).map(se => ({
    se: `SE ${se}`, atual: se <= ult ? (por[se]?.atual ?? 0) : null, anterior: por[se]?.anterior ?? 0,
  }));
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <LineChart data={dados} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        {grade}
        <XAxis dataKey="se" tick={eixo} interval={7} tickLine={false} axisLine={{ stroke: "#d6d3d1" }} />
        <YAxis tick={eixo} allowDecimals={false} tickLine={false} axisLine={false} />
        <Tooltip content={<Dica />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="anterior" name={String(ano - 1)} stroke={SERIE[1]} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="atual" name={`${ano} (parcial)`} stroke={SERIE[0]} strokeWidth={2} dot={false} connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Série anual (uma ou mais séries nomeadas). */
export function BarrasAnuais({ dados, series, altura = 220 }: {
  dados: Record<string, number | string | null>[]; series: { chave: string; nome: string }[]; altura?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={dados} margin={{ top: 8, right: 12, left: -12, bottom: 0 }} barGap={2}>
        {grade}
        <XAxis dataKey="ano" tick={eixo} tickLine={false} axisLine={{ stroke: "#d6d3d1" }} />
        <YAxis tick={eixo} allowDecimals={false} tickLine={false} axisLine={false} />
        <Tooltip content={<Dica />} cursor={{ fill: "#0000000a" }} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => <Bar key={s.chave} dataKey={s.chave} name={s.nome} fill={SERIE[i]} radius={[4, 4, 0, 0]} maxBarSize={28} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Recorte (sexo, faixa etária…) como barras horizontais de um ano. */
export function BarrasRecorte({ itens, altura }: { itens: { rotulo: string; valor: number }[]; altura?: number }) {
  return (
    <ResponsiveContainer width="100%" height={altura ?? Math.max(120, itens.length * 26 + 30)}>
      <BarChart data={itens} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
        <XAxis type="number" tick={eixo} allowDecimals={false} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="rotulo" tick={eixo} width={160} tickLine={false} axisLine={false} interval={0}
          tickFormatter={(v: string) => (v.length > 26 ? v.slice(0, 25) + "…" : v)} />
        <Tooltip content={<Dica />} cursor={{ fill: "#0000000a" }} />
        <Bar dataKey="valor" name="Casos" fill={SERIE[0]} radius={[0, 4, 4, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Linhas por semana epidemiológica — uma série por chave (ex.: anos). Valores null interrompem a linha. */
export function LinhasSE({ dados, series, altura = 240, syncId, unidade, chaveX = "se", fmtX = (v: number) => `SE ${v}`, intervalo = 7 }: {
  dados: Record<string, number | null>[]; series: { chave: string; nome: string; cor?: string; tracejado?: boolean }[];
  altura?: number; syncId?: string; unidade?: string; chaveX?: string; fmtX?: (v: number) => string; intervalo?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <LineChart data={dados} syncId={syncId} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        {grade}
        <XAxis dataKey={chaveX} tick={eixo} interval={intervalo} tickLine={false} axisLine={{ stroke: "#d6d3d1" }} tickFormatter={fmtX} />
        <YAxis tick={eixo} allowDecimals={false} tickLine={false} axisLine={false} />
        <Tooltip content={<Dica unidade={unidade} fmtLabel={fmtX} />} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => <Line key={s.chave} type="monotone" dataKey={s.chave} name={s.nome} stroke={s.cor ?? SERIE[i]}
          strokeWidth={i === series.length - 1 ? 2.4 : 1.6} strokeDasharray={s.tracejado ? "4 3" : undefined} dot={false} connectNulls={false} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Barras verticais com rótulo categórico (meses, anos…). */
export function BarrasCategoria({ dados, chaveX, series, altura = 220 }: {
  dados: Record<string, number | string | null>[]; chaveX: string; series: { chave: string; nome: string; cor?: string }[]; altura?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={dados} margin={{ top: 8, right: 12, left: -12, bottom: 0 }} barGap={2}>
        {grade}
        <XAxis dataKey={chaveX} tick={eixo} tickLine={false} axisLine={{ stroke: "#d6d3d1" }} />
        <YAxis tick={eixo} allowDecimals={false} tickLine={false} axisLine={false} />
        <Tooltip content={<Dica />} cursor={{ fill: "#0000000a" }} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => <Bar key={s.chave} dataKey={s.chave} name={s.nome} fill={s.cor ?? SERIE[i]} radius={[4, 4, 0, 0]} maxBarSize={26} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}
