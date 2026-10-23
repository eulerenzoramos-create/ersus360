import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmt, type LinhaSerie } from "../../lib/vigilanciaFvs";

// Paleta categórica validada (skill de visualização): ordem fixa, nunca ciclada
export const SERIE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
// Rampa sequencial (azul) para magnitude no mapa
export const RAMPA = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"];

const eixo = { fontSize: 11, fill: "#52514e" };
const grade = <CartesianGrid stroke="#e7e5e4" vertical={false} />;

function Dica({ active, payload, label, unidade }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 9px", fontSize: 12, boxShadow: "0 2px 6px #0001", color: "#0b0b0b" }}>
      <div style={{ fontWeight: 700, marginBottom: 3 }}>{label}</div>
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
        <YAxis type="category" dataKey="rotulo" tick={eixo} width={130} tickLine={false} axisLine={false} />
        <Tooltip content={<Dica />} cursor={{ fill: "#0000000a" }} />
        <Bar dataKey="valor" name="Casos" fill={SERIE[0]} radius={[0, 4, 4, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
