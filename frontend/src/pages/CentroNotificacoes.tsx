// src/pages/CentroNotificacoes.tsx — Centro de Notificações · ERSUS 360
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell, AlertTriangle, CheckCircle, Info, XCircle, RefreshCw, Check,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { apiGet, apiPost } from "../lib/api";

interface Notificacao {
  id: string; titulo: string; descricao: string;
  modulo: string; rota: string; tipo: "critico" | "alerta" | "info" | "sucesso";
  data: string; hora: string; lida: boolean; acao: string | null;
}

interface ResumoNotif {
  total: number; nao_lidas: number; criticas: number;
  alertas: number; info: number; sucessos: number;
}

const COR: Record<string, string> = {
  critico: "#dc2626", alerta: "#d97706", info: "#1351b4", sucesso: "#16a34a",
};
const BG: Record<string, string> = {
  critico: "#fee2e2", alerta: "#fef3c7", info: "#eff6ff", sucesso: "#dcfce7",
};

function IconTipo({ t }: { t: string }) {
  if (t === "critico")  return <XCircle      size={16} color={COR.critico}/>;
  if (t === "alerta")   return <AlertTriangle size={16} color={COR.alerta}/>;
  if (t === "sucesso")  return <CheckCircle   size={16} color={COR.sucesso}/>;
  return <Info size={16} color={COR.info}/>;
}

function CardNotif({ n, onMarcar }: { n: Notificacao; onMarcar: (id: string) => void }) {
  const [aberto, setAberto] = useState(false);
  const cor = COR[n.tipo];
  const bg  = BG[n.tipo];

  return (
    <div style={{ background: n.lida ? "#fff" : bg, border: `1px solid ${cor}${n.lida ? "20" : "40"}`, borderLeft: `4px solid ${n.lida ? "#e4e7ec" : cor}`, borderRadius: 10, marginBottom: 6, overflow: "hidden", opacity: n.lida ? 0.65 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px" }}>
        <IconTipo t={n.tipo}/>
        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setAberto(o => !o)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" as const }}>
            <span style={{ fontWeight: n.lida ? 600 : 800, fontSize: 12, color: "#111" }}>{n.titulo}</span>
            <span style={{ fontSize: 8, fontWeight: 800, background: cor + "18", color: cor, padding: "1px 6px", borderRadius: 8 }}>{n.modulo}</span>
            {!n.lida && <span style={{ fontSize: 8, background: cor, color: "#fff", padding: "1px 5px", borderRadius: 8, fontWeight: 800 }}>NOVO</span>}
          </div>
          <div style={{ fontSize: 10, color: "#6b7280" }}>{n.data} às {n.hora}</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
          {!n.lida && (
            <button onClick={() => onMarcar(n.id)}
              style={{ padding: "4px 8px", fontSize: 9, fontWeight: 700, background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
              <Check size={9}/> Marcar como lida
            </button>
          )}
          <div onClick={() => setAberto(o => !o)} style={{ cursor: "pointer" }}>
            {aberto ? <ChevronDown size={13} color="#9ca3af"/> : <ChevronRight size={13} color="#9ca3af"/>}
          </div>
        </div>
      </div>
      {aberto && (
        <div style={{ borderTop: `1px solid ${cor}20`, padding: "10px 14px", background: "#fff", fontSize: 11, color: "#374151", lineHeight: 1.6 }}>
          {n.descricao}
          {n.acao && (
            <div style={{ marginTop: 8 }}>
              <button style={{ padding: "5px 12px", fontSize: 10, fontWeight: 700, background: cor, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
                {n.acao}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CentroNotificacoes() {
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroLida, setFiltroLida] = useState("todas");
  const qc = useQueryClient();

  const { data: resumo } = useQuery<ResumoNotif>({
    queryKey: ["notif-resumo"],
    queryFn: () => apiGet("/api/notificacoes/resumo") as Promise<ResumoNotif>,
    staleTime: 30_000, refetchInterval: 30_000,
  });

  const { data: notificacoes = [], isLoading } = useQuery<Notificacao[]>({
    queryKey: ["notif-lista", filtroTipo, filtroLida],
    queryFn: () => apiGet("/api/notificacoes/lista", {
      tipo:  filtroTipo  !== "todos"  ? filtroTipo  : undefined,
      lida:  filtroLida  === "lidas"  ? "true"      : filtroLida === "nao_lidas" ? "false" : undefined,
    }) as Promise<Notificacao[]>,
    staleTime: 30_000, refetchInterval: 30_000,
  });

  const marcar = useMutation({
    mutationFn: (id: string) => apiPost(`/api/notificacoes/marcar-lida`, { id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notif-resumo"] }); qc.invalidateQueries({ queryKey: ["notif-lista"] }); },
  });

  const marcarTodas = useMutation({
    mutationFn: () => apiPost("/api/notificacoes/marcar-todas-lidas"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notif-resumo"] }); qc.invalidateQueries({ queryKey: ["notif-lista"] }); },
  });

  const r = resumo;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f4f6f8", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#4338ca 100%)", padding: "18px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: 6, position: "relative" as const }}>
                <Bell size={18} color="#fff"/>
                {r && r.nao_lidas > 0 && (
                  <span style={{ position: "absolute" as const, top: -4, right: -4, background: "#dc2626", color: "#fff", fontSize: 8, fontWeight: 900, borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{r.nao_lidas > 9 ? "9+" : r.nao_lidas}</span>
                )}
              </div>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Centro de Notificações</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
              Alertas automáticos de todos os módulos · ERSUS 360 · FMS Apuí/AM
            </div>
          </div>
          <button onClick={() => marcarTodas.mutate()} disabled={marcarTodas.isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
            <Check size={12}/> Marcar todas como lidas
          </button>
        </div>

        {r && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginTop: 16 }}>
            {[
              { l: "Total",       v: r.total,     cor: "#c7d2fe" },
              { l: "Não lidas",   v: r.nao_lidas, cor: r.nao_lidas > 0 ? "#fca5a5" : "#86efac" },
              { l: "Críticas",    v: r.criticas,  cor: "#fca5a5" },
              { l: "Alertas",     v: r.alertas,   cor: "#fde68a" },
              { l: "Informações", v: r.info,       cor: "#bfdbfe" },
              { l: "Sucessos",    v: r.sucessos,  cor: "#86efac" },
            ].map(k => (
              <div key={k.l} style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "10px 10px", textAlign: "center" as const }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: k.cor }}>{k.v}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)" }}>{k.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "20px 28px 60px" }}>
        <div style={{ background: "#fff", border: "1px solid #e4e7ec", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" as const, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Tipo:</span>
          {["todos","critico","alerta","info","sucesso"].map(t => {
            const cor = t === "todos" ? "#4338ca" : COR[t];
            const ativo = filtroTipo === t;
            return (
              <button key={t} onClick={() => setFiltroTipo(t)}
                style={{ padding: "5px 10px", fontSize: 10, borderRadius: 20, border: `1px solid ${ativo ? cor : "#d1d5db"}`, background: ativo ? cor + "15" : "#fff", color: ativo ? cor : "#374151", cursor: "pointer", fontWeight: ativo ? 700 : 400 }}>
                {t === "todos" ? "Todos" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            );
          })}
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginLeft: 8 }}>Leitura:</span>
          {["todas","nao_lidas","lidas"].map(l => (
            <button key={l} onClick={() => setFiltroLida(l)}
              style={{ padding: "5px 10px", fontSize: 10, borderRadius: 20, border: `1px solid ${filtroLida===l?"#4338ca":"#d1d5db"}`, background: filtroLida===l?"#eef2ff":"#fff", color: filtroLida===l?"#4338ca":"#374151", cursor: "pointer" }}>
              {l === "todas" ? "Todas" : l === "nao_lidas" ? "Não lidas" : "Lidas"}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af" }}>{notificacoes.length} notificação(ões)</span>
        </div>

        {isLoading
          ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando notificações...</div>
          : notificacoes.length === 0
            ? <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}><CheckCircle size={32} color="#86efac" style={{ marginBottom: 8 }}/><br/>Nenhuma notificação encontrada.</div>
            : notificacoes.map(n => <CardNotif key={n.id} n={n} onMarcar={id => marcar.mutate(id)}/>)
        }
      </div>
    </div>
  );
}
