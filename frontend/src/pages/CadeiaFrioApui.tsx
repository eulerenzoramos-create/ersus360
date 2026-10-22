import { Thermometer } from "lucide-react"
import PainelFonteAberta from "../components/PainelFonteAberta"

// Só exibe o que o backend devolve de fonte oficial. Até 21/10/2026 esta tela lia campos que o backend
// não devolve e tinha textos com números escritos à mão — removidos.
export default function CadeiaFrioApui() {
  return (
    <PainelFonteAberta
      titulo="Cadeia de Frio / PNI"
      subtitulo="Rede de Frio · Equipamentos"
      Icon={Thermometer}
      endpoint="/api/cadeia-frio-apui/dashboard"
    />
  )
}
