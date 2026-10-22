import { Scale } from "lucide-react"
import PainelFonteAberta from "../components/PainelFonteAberta"

// Só exibe o que o backend devolve de fonte oficial. Até 21/10/2026 esta tela lia campos que o backend
// não devolve e tinha textos com números escritos à mão — removidos.
export default function JudicializacaoSaudeApui() {
  return (
    <PainelFonteAberta
      titulo="Judicialização em Saúde"
      subtitulo="Processos · Medicamentos · Impacto orçamentário"
      Icon={Scale}
      endpoint="/api/judicializacao-saude-apui/dashboard"
    />
  )
}
