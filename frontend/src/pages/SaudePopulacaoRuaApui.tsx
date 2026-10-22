import { Home } from "lucide-react"
import PainelFonteAberta from "../components/PainelFonteAberta"

// Só exibe o que o backend devolve de fonte oficial. Até 21/10/2026 esta tela lia campos que o backend
// não devolve e tinha textos com números escritos à mão — removidos.
export default function SaudePopulacaoRuaApui() {
  return (
    <PainelFonteAberta
      titulo="Saúde da População em Situação de Rua"
      subtitulo="Consultório na Rua / eCR"
      Icon={Home}
      endpoint="/api/saude-populacao-rua-apui/dashboard"
    />
  )
}
