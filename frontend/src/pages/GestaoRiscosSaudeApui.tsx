import { ShieldCheck } from "lucide-react"
import PainelFonteAberta from "../components/PainelFonteAberta"

// Só exibe o que o backend devolve de fonte oficial. Até 21/10/2026 esta tela lia campos que o backend
// não devolve e tinha textos com números escritos à mão — removidos.
export default function GestaoRiscosSaudeApui() {
  return (
    <PainelFonteAberta
      titulo="Gestão de Riscos em Saúde"
      subtitulo="Agravos notificados"
      Icon={ShieldCheck}
      endpoint="/api/gestao-riscos-saude-apui/dashboard"
      campos={[
        {chave: "casos_malaria", label: "Casos de malária notificados", sub: "SIVEP-Malária"},
      ]}>
      {(d: any) =>
        Array.isArray(d.agravos) && d.agravos.some((a: any) => a?.situacao_dado === "oficial_validado") ? (
          <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Casos notificados por agravo</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <tbody>
                {d.agravos.map((a: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "6px 8px", textTransform: "capitalize" }}>{a?.agravo ?? "—"}</td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700 }}>
                      {a?.situacao_dado === "oficial_validado" ? (a.total_casos ?? "—") : "não disponível"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null
      }
    </PainelFonteAberta>
  )
}
