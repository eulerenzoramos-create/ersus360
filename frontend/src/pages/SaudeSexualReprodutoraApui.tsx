import { Heart } from "lucide-react"
import PainelFonteAberta from "../components/PainelFonteAberta"

// Só exibe o que o backend devolve de fonte oficial. Até 21/10/2026 esta tela lia campos que o backend
// não devolve e tinha textos com números escritos à mão — removidos.
export default function SaudeSexualReprodutoraApui() {
  return (
    <PainelFonteAberta
      titulo="Saúde Sexual e Reprodutiva"
      subtitulo="Planejamento familiar · Pré-natal"
      Icon={Heart}
      endpoint="/api/saude-sexual-reprodutiva-apui/dashboard"
      campos={[
        {chave: "nascidos_vivos", label: "Nascidos vivos (SINASC)"},
      ]}
    />
  )
}
