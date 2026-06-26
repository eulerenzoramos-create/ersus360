// src/pages/Modulos.tsx
import { useNavigate } from "react-router-dom";
import {
  Stethoscope, ArrowLeftRight, ClipboardList, Pill,
  Eye, Ambulance, ShieldCheck, ExternalLink,
} from "lucide-react";

const modulos = [
  {
    icon: ClipboardList, cor: "#534AB7", bg: "#EEEDFE",
    nome: "Painel Gestor", desc: "Visão 360° consolidada de todos os indicadores estratégicos", rota: "/", status: "ok",
  },
  {
    icon: Stethoscope, cor: "#0F6E56", bg: "#E1F5EE",
    nome: "Atenção Primária (APS)", desc: "SISAB, e-SUS APS, indicadores de cobertura e ICSAP", rota: "/aps", status: "atencao",
  },
  {
    icon: ArrowLeftRight, cor: "#185FA5", bg: "#E6F1FB",
    nome: "FNS / Convênios", desc: "Repasses federais, SIOPS, sync automático", rota: "/fns", status: "critico",
  },
  {
    icon: ClipboardList, cor: "#534AB7", bg: "#EEEDFE",
    nome: "Planejamento", desc: "PMS, Programação Anual de Saúde e RAG automatizado", rota: "/planejamento", status: "ok",
  },
  {
    icon: Pill, cor: "#0F6E56", bg: "#E1F5EE",
    nome: "Farmácia", desc: "Hórus, BNAFAR, estoque, dispensação e Farmácia Popular", rota: "/farmacia", status: "critico",
  },
  {
    icon: Eye, cor: "#BA7517", bg: "#FAEEDA",
    nome: "Vigilância em Saúde", desc: "Agravos, vacinação, vigilância sanitária e epidemiológica", rota: "/vigilancia", status: "ok",
  },
  {
    icon: Ambulance, cor: "#993C1D", bg: "#FAECE7",
    nome: "Transporte / TFD", desc: "Frota municipal, manutenção e Tratamento Fora do Domicílio", rota: "/transporte", status: "ok",
  },
  {
    icon: ShieldCheck, cor: "#185FA5", bg: "#E6F1FB",
    nome: "Regulação", desc: "Solicitações, autorizações e tempo médio de espera", rota: "/regulacao", status: "ok",
  },
];

const badge: Record<string, { bg: string; cor: string; label: string }> = {
  ok: { bg: "#EAF3DE", cor: "#3B6D11", label: "Normal" },
  atencao: { bg: "#FAEEDA", cor: "#854F0B", label: "Atenção" },
  critico: { bg: "#FCEBEB", cor: "#A32D2D", label: "Crítico" },
};

export default function Modulos() {
  const nav = useNavigate();
  return (
    <div style={{ padding: "16px" }}>
      <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "14px", color: "var(--color-text-secondary)" }}>
        Módulos ERSUS 360 — clique para acessar
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: "10px" }}>
        {modulos.map((m) => {
          const b = badge[m.status];
          return (
            <div key={m.nome} onClick={() => nav(m.rota)}
              style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "12px", padding: "14px", cursor: "pointer", transition: "border-color .15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = m.cor)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border-tertiary)")}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <m.icon size={18} color={m.cor} />
              </div>
              <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: 4 }}>{m.nome}</div>
              <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: 8 }}>{m.desc}</div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 20, background: b.bg, color: b.cor }}>
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
