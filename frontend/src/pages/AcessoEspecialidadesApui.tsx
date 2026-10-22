import { Stethoscope } from "lucide-react"
import PainelFonteAberta from "../components/PainelFonteAberta"

// Só exibe o que o backend devolve de fonte oficial. Até 21/10/2026 esta tela lia campos que o backend
// não devolve e tinha textos com números escritos à mão — removidos.
export default function AcessoEspecialidadesApui() {
  return (
    <PainelFonteAberta
      titulo="Acesso a Especialidades Médicas"
      subtitulo="TFD / Regulação / Fila de Espera"
      Icon={Stethoscope}
      endpoint="/api/acesso-especialidades-apui/dashboard"
    />
  )
}
