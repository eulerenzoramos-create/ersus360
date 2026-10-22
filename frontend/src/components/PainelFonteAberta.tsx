import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGetRaw } from "../lib/api";
import { useMunicipioAtivo } from "../lib/municipio";
import NaoDisponivelBanner from "./NaoDisponivelBanner";

/**
 * Tela de módulo que só exibe o que o backend devolveu de uma fonte oficial.
 * Sem dado oficial → NaoDisponivelBanner com a nota do backend. Campo ausente → "—".
 * Nunca há valor fixo, meta ou texto com número escrito na tela.
 */
export interface CampoFonte {
  /** Caminho no objeto devolvido, ex.: "obitos" ou "financeiro.minimo_constitucional_pct_aplicado" */
  chave: string;
  label: string;
  /** Explicação curta do que o número é (e do que não é) */
  sub?: string;
  formato?: "numero" | "pct" | "brl";
}

interface Props {
  titulo: string;
  subtitulo?: string;
  Icon: LucideIcon;
  endpoint: string;
  campos?: CampoFonte[];
  /** Conteúdo extra abaixo dos cartões (só quando há dado oficial) */
  children?: (dado: any) => ReactNode;
}

const ACCENT = "#1d4ed8";

function ler(obj: any, caminho: string) {
  return caminho.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function formatar(v: unknown, formato: CampoFonte["formato"] = "numero") {
  if (v === null || v === undefined || v === "" || (typeof v === "number" && Number.isNaN(v))) return "—";
  if (typeof v !== "number") return String(v);
  if (formato === "pct") return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
  if (formato === "brl") return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return v.toLocaleString("pt-BR");
}

function dataHora(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("pt-BR");
}

export default function PainelFonteAberta({ titulo, subtitulo, Icon, endpoint, campos = [], children }: Props) {
  const { municipio } = useMunicipioAtivo();
  const q = useQuery({ queryKey: ["painel-fonte", endpoint], queryFn: () => apiGetRaw<any>(endpoint), retry: 1 });
  const d = q.data as any;
  const oficial = d && typeof d === "object" && d.situacao_dado === "oficial_validado";

  return (
    <div style={{ padding: "24px 32px", fontFamily: "Inter,sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Icon size={28} color={ACCENT} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0d2137" }}>{titulo}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {[subtitulo, municipio].filter(Boolean).join(" — ")}
          </div>
        </div>
      </div>

      {q.isLoading && <div style={{ fontSize: 13, color: "#6b7280" }}>Consultando a fonte oficial…</div>}

      {!q.isLoading && !oficial && (
        <NaoDisponivelBanner
          nota={d?.nota || d?.mensagem || (q.isError ? "Não foi possível consultar o servidor agora." : "A fonte oficial não devolveu dado para este município.")}
          rodape="Nenhum valor foi inventado ou estimado."
        />
      )}

      {oficial && (
        <div>
          {campos.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              {campos.map((c) => (
                <div key={c.chave} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px", minWidth: 160 }}>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: ACCENT }}>{formatar(ler(d, c.chave), c.formato)}</div>
                  {c.sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, maxWidth: 220 }}>{c.sub}</div>}
                </div>
              ))}
            </div>
          )}
          {children?.(d)}
          {d.nota && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 12, fontSize: 12, color: "#92400e", marginTop: 12 }}>
              {d.nota}
            </div>
          )}
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 12 }}>
            Fonte: {d.fonte || "não informada"}
            {d.ano ? ` · ano ${d.ano}` : ""}
            {d.verificado_em ? ` · consultado em ${dataHora(d.verificado_em)}` : ""}
          </div>
        </div>
      )}
    </div>
  );
}
