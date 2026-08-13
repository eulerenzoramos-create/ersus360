// src/pages/PortalCidadao.tsx — Portal do Cidadão ERSUS 360
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiPortais, apiPost } from "../lib/api";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

type Unidade = { nome: string; endereco: string; telefone: string; horario: string; servicos: string[] };
type Obra = { descricao: string; status: string; percentual_fisico: number; valor_total: number; origem_recurso: string; previsao_conclusao: string };
type Indicador = { indicador: string; resultado_pct: number; meta_pct: number };

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cor: string; bg: string }> = {
    em_execucao: { label: "Em execução", cor: "#1565c0", bg: "#e3f2fd" },
    contratada:  { label: "Contratada",  cor: "#e65100", bg: "#fff3e0" },
    concluida:   { label: "Concluída",   cor: "#2e7d32", bg: "#e8f5e9" },
    paralisada:  { label: "Paralisada",  cor: "#c62828", bg: "#ffebee" },
  };
  const s = map[status] ?? { label: status, cor: "#616161", bg: "#f5f5f5" };
  return <span style={{ background: s.bg, color: s.cor, padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{s.label}</span>;
}

export default function PortalCidadao() {
  const [aba, setAba] = useState<"unidades" | "indicadores" | "obras" | "ouvidoria">("unidades");
  const [ouvidoriaForm, setOuvidoriaForm] = useState({ tipo: "reclamacao", assunto: "", descricao: "", unidade: "", contato: "" });
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const [buscaProtocolo, setBuscaProtocolo] = useState("");
  const [acompanhamento, setAcompanhamento] = useState<{ status: string; descricao: string; prazo_resposta: string } | null>(null);

  const { data: unidades } = useQuery({ queryKey: ["publico-unidades"], queryFn: apiPortais.unidades });
  const { data: indicadores } = useQuery({ queryKey: ["publico-indicadores"], queryFn: apiPortais.indicadores });
  const { data: obras } = useQuery({ queryKey: ["publico-obras"], queryFn: apiPortais.obras });

  const mutation = useMutation({
    mutationFn: (dados: typeof ouvidoriaForm) =>
      apiPost("/api/publico/ouvidoria", dados),
    onSuccess: (data: { protocolo: string }) => {
      setProtocolo(data.protocolo);
      setOuvidoriaForm({ tipo: "reclamacao", assunto: "", descricao: "", unidade: "", contato: "" });
    },
  });

  const buscarProtocolo = () => {
    if (!buscaProtocolo.trim()) return;
    apiPortais.acompanharOuvidoria(buscaProtocolo.trim()).then(setAcompanhamento);
  };

  const abas = [
    { key: "unidades" as const, label: "Unidades de Saúde" },
    { key: "indicadores" as const, label: "Indicadores" },
    { key: "obras" as const, label: "Obras" },
    { key: "ouvidoria" as const, label: "Ouvidoria" },
  ];

  if (!isLoading && !unidades) return (
    <div style={{ padding: 24 }}>
      <NaoDisponivelBanner
        titulo="PortalCidadao indisponivel"
        nota="Dados nao disponiveis — integracao pendente de configuracao no Railway."
      />
    </div>
  );

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      {/* Cabeçalho */}
      <div style={{ background: "linear-gradient(135deg, #1565c0, #0d47a1)", borderRadius: 10, padding: "20px 24px", marginBottom: 20, color: "#fff" }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Portal do Cidadão — Saúde de Apuí/AM</div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>Transparência e acesso à informação em saúde pública · Lei de Acesso à Informação (Lei 12.527/2011)</div>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "2px solid #e4e7ec" }}>
        {abas.map(a => (
          <button key={a.key} onClick={() => setAba(a.key)}
            style={{ padding: "9px 18px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: aba === a.key ? "#1565c0" : "transparent",
              color: aba === a.key ? "#fff" : "#555",
              borderRadius: "6px 6px 0 0",
            }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Unidades */}
      {aba === "unidades" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {unidades?.unidades?.map((u: Unidade) => (
            <div key={u.nome} style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1565c0", marginBottom: 8 }}>{u.nome}</div>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>📍 {u.endereco}</div>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>📞 {u.telefone}</div>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>🕐 {u.horario}</div>
              <div style={{ fontSize: 12, color: "#666", fontWeight: 600, marginBottom: 6 }}>Serviços disponíveis:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {u.servicos?.map((s: string) => (
                  <span key={s} style={{ background: "#e3f2fd", color: "#1565c0", padding: "2px 8px", borderRadius: 12, fontSize: 11 }}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Indicadores */}
      {aba === "indicadores" && indicadores && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 16 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#2e7d32" }}>{indicadores.cobertura_ab_pct}%</div>
              <div style={{ fontSize: 13, color: "#555" }}>Cobertura da Atenção Básica</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 16 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#1565c0" }}>{indicadores.cobertura_vacinal_pct}%</div>
              <div style={{ fontSize: 13, color: "#555" }}>Cobertura Vacinal Geral</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 16 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#555" }}>{indicadores.competencia}</div>
              <div style={{ fontSize: 13, color: "#555" }}>Competência dos dados</div>
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: "#333" }}>Indicadores Novo Financiamento APS — {indicadores.municipio}</div>
            {indicadores.previne_brasil?.map((ind: Indicador) => {
              const pct = ind.resultado_pct;
              const atingiu = pct >= ind.meta_pct;
              return (
                <div key={ind.indicador} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                    <span>{ind.indicador}</span>
                    <span>
                      <strong style={{ color: atingiu ? "#2e7d32" : "#c62828" }}>{pct.toFixed(1)}%</strong>
                      <span style={{ color: "#999", marginLeft: 6 }}>meta {ind.meta_pct}%</span>
                    </span>
                  </div>
                  <div style={{ height: 7, background: "#f0f0f0", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: atingiu ? "#2e7d32" : "#c62828", borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize: 11, color: "#999", marginTop: 12 }}>Fonte: SISAB/Ministério da Saúde · Atualização quadrimestral</div>
          </div>
        </div>
      )}

      {/* Obras */}
      {aba === "obras" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {obras?.obras?.map((o: Obra, i: number) => (
            <div key={i} style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#333" }}>{o.descricao}</div>
                <StatusBadge status={o.status} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#888" }}>Valor Total</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>R$ {o.valor_total.toLocaleString("pt-BR")}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#888" }}>Origem do Recurso</div>
                  <div style={{ fontSize: 13 }}>{o.origem_recurso}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#888" }}>Previsão de Conclusão</div>
                  <div style={{ fontSize: 13 }}>{o.previsao_conclusao}</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Execução física: <strong>{o.percentual_fisico}%</strong></div>
                <div style={{ height: 10, background: "#f0f0f0", borderRadius: 5 }}>
                  <div style={{ height: "100%", width: `${o.percentual_fisico}%`, background: o.percentual_fisico >= 80 ? "#2e7d32" : "#1565c0", borderRadius: 5 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ouvidoria */}
      {aba === "ouvidoria" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Formulário */}
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#333", marginBottom: 16 }}>Registrar Manifestação</div>
            {protocolo ? (
              <div style={{ background: "#e8f5e9", borderRadius: 8, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#2e7d32", marginBottom: 4 }}>Manifestação registrada!</div>
                <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 800, color: "#1565c0", margin: "12px 0" }}>{protocolo}</div>
                <div style={{ fontSize: 13, color: "#555" }}>Prazo de resposta: 30 dias úteis</div>
                <button onClick={() => setProtocolo(null)} style={{ marginTop: 14, padding: "8px 18px", background: "#1565c0", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
                  Nova manifestação
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(ouvidoriaForm); }}>
                {[
                  { field: "assunto", label: "Assunto *", type: "text" },
                  { field: "descricao", label: "Descrição *", type: "textarea" },
                  { field: "unidade", label: "Unidade envolvida (opcional)", type: "text" },
                  { field: "contato", label: "Contato para retorno (opcional)", type: "text" },
                ].map(({ field, label, type }) => (
                  <div key={field} style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 4 }}>{label}</label>
                    {type === "textarea" ? (
                      <textarea rows={4} value={(ouvidoriaForm as Record<string, string>)[field]}
                        onChange={e => setOuvidoriaForm(f => ({ ...f, [field]: e.target.value }))}
                        style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
                    ) : (
                      <input type="text" value={(ouvidoriaForm as Record<string, string>)[field]}
                        onChange={e => setOuvidoriaForm(f => ({ ...f, [field]: e.target.value }))}
                        style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }} />
                    )}
                  </div>
                ))}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 4 }}>Tipo *</label>
                  <select value={ouvidoriaForm.tipo} onChange={e => setOuvidoriaForm(f => ({ ...f, tipo: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}>
                    <option value="reclamacao">Reclamação</option>
                    <option value="sugestao">Sugestão</option>
                    <option value="denuncia">Denúncia</option>
                    <option value="elogio">Elogio</option>
                    <option value="solicitacao">Solicitação</option>
                  </select>
                </div>
                <button type="submit" disabled={mutation.isPending || !ouvidoriaForm.assunto || !ouvidoriaForm.descricao}
                  style={{ width: "100%", padding: "10px", background: "#1565c0", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  {mutation.isPending ? "Enviando..." : "Enviar Manifestação"}
                </button>
              </form>
            )}
          </div>

          {/* Acompanhamento */}
          <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#333", marginBottom: 16 }}>Acompanhar Manifestação</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 6 }}>Número do protocolo</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="text" placeholder="OUV-202607-XXXXXX" value={buscaProtocolo}
                  onChange={e => setBuscaProtocolo(e.target.value)}
                  style={{ flex: 1, padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }} />
                <button onClick={buscarProtocolo}
                  style={{ padding: "8px 16px", background: "#1565c0", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
                  Buscar
                </button>
              </div>
            </div>
            {acompanhamento && (
              <div style={{ background: "#f5f5f5", borderRadius: 8, padding: 16, marginTop: 12 }}>
                <div style={{ fontSize: 13, color: "#333", marginBottom: 6 }}>
                  <strong>Status:</strong> {acompanhamento.status === "em_analise" ? "Em análise" : acompanhamento.status}
                </div>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>{acompanhamento.descricao}</div>
                <div style={{ fontSize: 12, color: "#888" }}>Prazo: {acompanhamento.prazo_resposta}</div>
              </div>
            )}
            <div style={{ marginTop: 24, padding: 16, background: "#e8f5e9", borderRadius: 8, fontSize: 13, color: "#2e7d32" }}>
              <strong>Lei de Acesso à Informação (LAI)</strong><br />
              Sua manifestação será respondida em até 30 dias úteis. Para recursos, contate a Controladoria Municipal.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
