// Aviso do próximo prazo de envio ao SIAPS (calendário oficial) + relatórios que faltam importar
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, FileDown } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export interface ItemCalendario {
  competencia: string; nome: string; inicio: string; fim: string; data_limite: string; data_relatorio: string;
  dias_para_limite: number; situacao: string; relatorio_importado?: boolean; nivel?: string;
}
export interface CalendarioSiaps {
  hoje: string; fonte: string; calendario: ItemCalendario[]; proximo_prazo: ItemCalendario | null;
  relatorios_pendentes: ItemCalendario[];
}

export const dataBr = (d: string) => d.split("-").reverse().join("/");
const COR = { critico: ["#fef2f2", "#b91c1c", "#fecaca"], atencao: ["#fffbeb", "#92400e", "#fde68a"], info: ["#eff6ff", "#1e40af", "#bfdbfe"] } as const;

export function useCalendarioSiaps() {
  return useQuery<CalendarioSiaps>({
    queryKey: ["siaps-calendario"],
    queryFn: () => api.get("/api/siaps-relatorios/calendario").then(r => r.data),
    staleTime: 60 * 60 * 1000,
  });
}

export default function PrazoSiapsBanner({ linkRelatorios = true }: { linkRelatorios?: boolean }) {
  const { data } = useCalendarioSiaps();
  const p = data?.proximo_prazo;
  if (!p) return null;
  const [fundo, texto, borda] = COR[(p.nivel as keyof typeof COR) ?? "info"] ?? COR.info;
  const quando = p.dias_para_limite === 0 ? "termina HOJE" : p.dias_para_limite === 1 ? "termina amanhã" : `faltam ${p.dias_para_limite} dias`;
  return (
    <div style={{ background: fundo, color: texto, border: `1px solid ${borda}`, borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
        {p.nivel === "info" ? <CalendarClock size={16} /> : <AlertTriangle size={16} />}
        SIAPS — envio da competência {p.nome}: {quando} (prazo {dataBr(p.data_limite)})
      </div>
      <div style={{ marginTop: 2 }}>
        Transmitir toda a produção do e-SUS PEC até o 10º dia útil. Relatório da competência: extrair em {dataBr(p.data_relatorio)}.
      </div>
      {(data?.relatorios_pendentes ?? []).length > 0 && (
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, color: "#92400e", fontWeight: 600 }}>
          <FileDown size={14} />
          Relatórios do SIAPS ainda não importados: {data!.relatorios_pendentes.map(r => r.nome).join(", ")}
          {linkRelatorios && <Link to="/siaps-relatorios" style={{ color: "#1d4ed8", marginLeft: 6 }}>Importar agora</Link>}
        </div>
      )}
    </div>
  );
}
