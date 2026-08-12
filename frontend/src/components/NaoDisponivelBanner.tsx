import { AlertTriangle, Plug } from "lucide-react";

interface Props {
  titulo?: string;
  nota?: string;
  /** Variante compacta para uso dentro de cards/seções */
  compact?: boolean;
}

/**
 * Exibido quando backend retorna situacao_dado: "nao_disponivel".
 * Nunca mostra valores inventados — informa claramente que a integração
 * precisa ser configurada no Railway.
 */
export default function NaoDisponivelBanner({
  titulo = "Dados indisponíveis",
  nota = "Integração com sistema externo ainda não configurada. Nenhum valor foi inventado.",
  compact = false,
}: Props) {
  const pad = compact ? "20px 20px" : "48px 24px";
  const iconSz = compact ? 28 : 40;
  const titleSz = compact ? 14 : 18;
  const noteSz = compact ? 12 : 13;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: pad,
      gap: compact ? 10 : 16,
      background: "#fff",
      border: "1px solid #fde68a",
      borderRadius: compact ? 8 : 12,
      textAlign: "center",
    }}>
      <div style={{
        width: compact ? 44 : 60,
        height: compact ? 44 : 60,
        borderRadius: "50%",
        background: "#fffbeb",
        border: "1px solid #fde68a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <AlertTriangle size={iconSz} color="#d97706" />
      </div>

      <div>
        <div style={{ fontSize: titleSz, fontWeight: 700, color: "#0d2137", marginBottom: 6 }}>
          {titulo}
        </div>
        <div style={{
          fontSize: noteSz,
          color: "#64748b",
          maxWidth: 480,
          lineHeight: 1.6,
        }}>
          {nota}
        </div>
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        color: "#94a3b8",
        marginTop: compact ? 0 : 4,
      }}>
        <Plug size={12} />
        Configure as credenciais no Railway para habilitar esta integração.
      </div>
    </div>
  );
}
