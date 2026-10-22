import { CloudSun } from "lucide-react"
import PainelFonteAberta from "../components/PainelFonteAberta"

// Até 21/10/2026 esta tela lia campos que o backend não devolve (focos de queimada, dias de ar ruim, temperatura)
// e mostrava "undefined". Clima (INMET/INPE) não está integrado; só casos notificados aparecem.
export default function ClimaSaudeApui() {
  return (
    <PainelFonteAberta
      titulo="Clima e Saúde"
      subtitulo="Doenças sensíveis ao clima"
      Icon={CloudSun}
      endpoint="/api/clima-saude-apui/dashboard"
      campos={[
        { chave: "malaria.total_casos", label: "Casos de malária notificados", sub: "SIVEP-Malária" },
        { chave: "dengue.total_casos", label: "Casos de dengue notificados", sub: "SINAN" },
      ]}
    />
  )
}
