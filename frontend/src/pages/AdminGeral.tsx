/**
 * Administração geral — ERSUS 360
 *
 * Tela do ADMINISTRADOR_GERAL fora de um ambiente municipal: painel de todos os
 * municípios, cadastro/credenciamento, usuários e autorizações, auditoria e
 * backups. Todas as ações passam por /api/admin-geral e ficam na auditoria.
 */
import { useCallback, useEffect, useState } from "react";
import { LogOut, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { ListaMunicipios } from "../components/SeletorMunicipio";

type Aba = "entrar" | "municipios" | "usuarios" | "auditoria" | "backups";

const SITUACOES: Record<string, { rotulo: string; cor: string }> = {
  disponivel:  { rotulo: "Disponível",     cor: "#64748b" },
  implantacao: { rotulo: "Em implantação", cor: "#b45309" },
  ativo:       { rotulo: "Ativo",          cor: "#15803d" },
  suspenso:    { rotulo: "Suspenso",       cor: "#b91c1c" },
  encerrado:   { rotulo: "Encerrado",      cor: "#334155" },
};

const PERFIS = ["gestor", "admin", "coordenador", "enfermeiro", "medico", "tecnico_aps", "acs",
  "odontologia", "farmaceutico", "vigilancia", "financeiro", "contabilidade", "planejamento",
  "auditoria", "prefeito", "conselho", "consulta"];

const S = {
  card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 } as const,
  th: { textAlign: "left" as const, fontSize: 11, color: "#64748b", padding: "6px 8px", borderBottom: "1px solid #e2e8f0" },
  td: { fontSize: 12.5, color: "#0f172a", padding: "7px 8px", borderBottom: "1px solid #f1f5f9", verticalAlign: "top" as const },
  btn: { border: "1px solid #cbd5e1", background: "#fff", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer" },
  btnP: { border: "none", background: "#1d4ed8", color: "#fff", borderRadius: 6, padding: "7px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" },
  input: { border: "1px solid #cbd5e1", borderRadius: 6, padding: "6px 8px", fontSize: 12.5, minWidth: 0 },
};

function erroDe(e: any): string {
  return e?.response?.data?.detail ? String(e.response.data.detail) : "Não foi possível concluir a operação.";
}

function Situacao({ s }: { s: string }) {
  const x = SITUACOES[s] ?? { rotulo: s, cor: "#64748b" };
  return <span style={{ fontSize: 11, fontWeight: 700, color: x.cor }}>{x.rotulo}</span>;
}

function Aviso({ msg, erro }: { msg: string; erro?: boolean }) {
  if (!msg) return null;
  return <div role={erro ? "alert" : "status"} style={{ fontSize: 12.5, margin: "8px 0",
    color: erro ? "#b91c1c" : "#15803d" }}>{msg}</div>;
}

// ── Credenciais (somente situação; valores nunca saem do servidor) ────────────
function Credenciais({ municipio, onFechar }: { municipio: any; onFechar: () => void }) {
  const [dados, setDados] = useState<any>(null);
  const [erro, setErro] = useState("");
  useEffect(() => {
    api.get(`/api/admin-geral/municipios/${municipio.uuid}/credenciais`)
      .then(r => setDados(r.data)).catch(e => setErro(erroDe(e)));
  }, [municipio.uuid]);
  return (
    <div style={{ ...S.card, marginTop: 12, borderColor: "#93c5fd" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <b style={{ fontSize: 13 }}>Credenciais de integração — {municipio.nome}/{municipio.uf}</b>
        <button style={{ ...S.btn, marginLeft: "auto" }} onClick={onFechar}>Fechar</button>
      </div>
      <Aviso msg={erro} erro />
      {dados && <>
        <p style={{ fontSize: 12, color: "#475569", margin: "0 0 8px" }}>
          As senhas ficam só nas variáveis de ambiente do servidor (Railway). Cada município usa as
          variáveis com o próprio código IBGE; nenhum usa a credencial de outro.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={S.th}>Integração</th><th style={S.th}>Situação</th><th style={S.th}>Variáveis</th></tr></thead>
            <tbody>
              {dados.sistemas.map((s: any) => (
                <tr key={s.sistema}>
                  <td style={S.td}><b>{s.sistema}</b><div style={{ fontSize: 11, color: "#64748b" }}>{s.descricao}</div></td>
                  <td style={{ ...S.td, color: s.configurado ? "#15803d" : "#64748b", fontWeight: 700 }}>
                    {s.configurado ? "Configurada" : "Não configurada"}</td>
                  <td style={S.td}>
                    {Object.entries(s.campos).map(([campo, c]: [string, any]) => (
                      <div key={campo} style={{ fontSize: 11.5, fontFamily: "ui-monospace,monospace" }}>
                        {c.configurada ? "✓" : "·"} {c.variavel}
                        {c.origem === "legado_apui" && <span style={{ color: "#b45309" }}> (variável histórica sem sufixo)</span>}
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>}
    </div>
  );
}

// ── Municípios ────────────────────────────────────────────────────────────────
function Municipios() {
  const [lista, setLista] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("contratados");
  const [msg, setMsg] = useState(""); const [erro, setErro] = useState(false);
  const [novo, setNovo] = useState({ nome: "", uf: "AM", codigo_ibge: "", situacao: "implantacao" });
  const [credenciais, setCredenciais] = useState<any>(null);

  const carregar = useCallback(async () => {
    const r = await api.get("/api/admin-geral/municipios", { params: filtro === "todos" || filtro === "contratados" ? {} : { situacao: filtro } });
    setLista(filtro === "contratados" ? r.data.filter((m: any) => m.situacao !== "disponivel") : r.data);
  }, [filtro]);
  useEffect(() => { carregar().catch(e => { setErro(true); setMsg(erroDe(e)); }); }, [carregar]);

  const acao = async (fn: () => Promise<any>, ok: string) => {
    setMsg(""); setErro(false);
    try { await fn(); setMsg(ok); await carregar(); } catch (e) { setErro(true); setMsg(erroDe(e)); }
  };

  const mudarSituacao = (m: any, situacao: string) => {
    const motivo = window.prompt(`Motivo para mudar ${m.nome}/${m.uf} para "${SITUACOES[situacao].rotulo}":`) ?? "";
    if (situacao === "suspenso" && !window.confirm(`Suspender ${m.nome}? Todos os usuários do município perdem o acesso imediatamente (os dados são preservados).`)) return;
    acao(() => api.post(`/api/admin-geral/municipios/${m.uuid}/situacao`, { situacao, motivo }), "Situação atualizada.");
  };

  return (
    <div style={S.card}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <select aria-label="Filtrar municípios" value={filtro} onChange={e => setFiltro(e.target.value)} style={S.input}>
          <option value="contratados">Contratados</option>
          <option value="todos">Todos</option>
          {Object.entries(SITUACOES).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
        </select>
        <button style={S.btn} onClick={() => acao(() => api.post("/api/admin-geral/municipios/importar-ibge", null, { params: { uf: "AM" } }),
          "Relação oficial do IBGE (AM) importada como disponível.")}>Importar os 62 municípios do AM (IBGE)</button>
      </div>
      <Aviso msg={msg} erro={erro} />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={S.th}>Município</th><th style={S.th}>IBGE</th><th style={S.th}>Situação</th><th style={S.th}>Plano</th><th style={S.th}>Ações</th></tr></thead>
          <tbody>
            {lista.map(m => (
              <tr key={m.uuid}>
                <td style={S.td}>{m.nome}/{m.uf}</td>
                <td style={S.td}>{m.codigo_ibge}</td>
                <td style={S.td}><Situacao s={m.situacao} /></td>
                <td style={S.td}>{m.plano ?? "—"}</td>
                <td style={S.td}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <select aria-label={`Mudar situação de ${m.nome}`} value="" onChange={e => e.target.value && mudarSituacao(m, e.target.value)} style={S.input}>
                      <option value="">Mudar situação…</option>
                      {Object.entries(SITUACOES).filter(([k]) => k !== m.situacao).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
                    </select>
                    <button style={S.btn} onClick={() => setCredenciais(m)}>Credenciais</button>
                  </div>
                </td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td style={S.td} colSpan={5}>Nenhum município neste filtro.</td></tr>}
          </tbody>
        </table>
      </div>
      {credenciais && <Credenciais municipio={credenciais} onFechar={() => setCredenciais(null)} />}
      <h3 style={{ fontSize: 13, margin: "16px 0 8px" }}>Cadastrar município</h3>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <input aria-label="Nome" placeholder="Nome" value={novo.nome} onChange={e => setNovo({ ...novo, nome: e.target.value })} style={S.input} />
        <input aria-label="UF" placeholder="UF" maxLength={2} value={novo.uf} onChange={e => setNovo({ ...novo, uf: e.target.value.toUpperCase() })} style={{ ...S.input, width: 50 }} />
        <input aria-label="Código IBGE" placeholder="IBGE (7 dígitos)" value={novo.codigo_ibge} onChange={e => setNovo({ ...novo, codigo_ibge: e.target.value.replace(/\D/g, "") })} style={S.input} />
        <select aria-label="Situação inicial" value={novo.situacao} onChange={e => setNovo({ ...novo, situacao: e.target.value })} style={S.input}>
          {Object.entries(SITUACOES).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
        </select>
        <button style={S.btnP} onClick={() => acao(() => api.post("/api/admin-geral/municipios", novo), "Município cadastrado.")}>Cadastrar</button>
      </div>
    </div>
  );
}

// ── Usuários ──────────────────────────────────────────────────────────────────
function Usuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [msg, setMsg] = useState(""); const [erro, setErro] = useState(false);
  const [novo, setNovo] = useState({ nome: "", email: "", senha: "", perfil: "gestor", municipio_uuid: "" });

  const carregar = useCallback(async () => {
    const [u, m] = await Promise.all([api.get("/api/admin-geral/usuarios"), api.get("/api/admin-geral/municipios")]);
    setUsuarios(u.data);
    setMunicipios(m.data.filter((x: any) => x.situacao !== "disponivel"));
  }, []);
  useEffect(() => { carregar().catch(e => { setErro(true); setMsg(erroDe(e)); }); }, [carregar]);

  const acao = async (fn: () => Promise<any>, ok: string) => {
    setMsg(""); setErro(false);
    try { await fn(); setMsg(ok); await carregar(); } catch (e) { setErro(true); setMsg(erroDe(e)); }
  };
  const nomeMun = (uuid: string) => { const m = municipios.find(x => x.uuid === uuid); return m ? `${m.nome}/${m.uf}` : "—"; };

  const editarAutorizacoes = (u: any) => {
    const opcoes = municipios.filter(m => m.uuid !== u.municipio_uuid);
    const atual = opcoes.filter(m => u.municipios_extras_uuid.includes(m.uuid)).map(m => m.codigo_ibge).join(", ");
    const resp = window.prompt(
      `Municípios ADICIONAIS que ${u.nome} pode acessar (códigos IBGE separados por vírgula; vazio = nenhum).\n` +
      `Disponíveis: ${opcoes.map(m => `${m.nome} ${m.codigo_ibge}`).join("; ")}`, atual);
    if (resp === null) return;
    const codigos = resp.split(",").map(s => s.trim()).filter(Boolean);
    const uuids = opcoes.filter(m => codigos.includes(m.codigo_ibge)).map(m => m.uuid);
    acao(() => api.put(`/api/admin-geral/usuarios/${u.id}/municipios`, { municipios_uuid: uuids }), "Autorizações atualizadas.");
  };

  return (
    <div style={S.card}>
      <Aviso msg={msg} erro={erro} />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={S.th}>Usuário</th><th style={S.th}>Perfil</th><th style={S.th}>Município</th><th style={S.th}>Outros municípios</th><th style={S.th}>Situação</th><th style={S.th}>Ações</th></tr></thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id}>
                <td style={S.td}>{u.nome}<div style={{ fontSize: 11, color: "#64748b" }}>{u.email}</div></td>
                <td style={S.td}>{u.perfil}</td>
                <td style={S.td}>{u.municipio ?? "—"}</td>
                <td style={S.td}>{u.municipios_extras_uuid.map(nomeMun).join(", ") || "—"}</td>
                <td style={S.td} >{u.ativo ? "Ativo" : <span style={{ color: "#b91c1c" }}>Suspenso</span>}</td>
                <td style={S.td}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <button style={S.btn} onClick={() => acao(() => api.patch(`/api/admin-geral/usuarios/${u.id}`, { ativo: !u.ativo }),
                      u.ativo ? "Usuário suspenso." : "Usuário reativado.")}>{u.ativo ? "Suspender" : "Reativar"}</button>
                    <button style={S.btn} onClick={() => editarAutorizacoes(u)}>Autorizações</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 style={{ fontSize: 13, margin: "16px 0 8px" }}>Cadastrar usuário municipal</h3>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <input aria-label="Nome do usuário" placeholder="Nome" value={novo.nome} onChange={e => setNovo({ ...novo, nome: e.target.value })} style={S.input} />
        <input aria-label="E-mail" placeholder="E-mail (login)" value={novo.email} onChange={e => setNovo({ ...novo, email: e.target.value })} style={S.input} />
        <input aria-label="Senha inicial" placeholder="Senha inicial (8+)" type="password" value={novo.senha} onChange={e => setNovo({ ...novo, senha: e.target.value })} style={S.input} />
        <select aria-label="Perfil" value={novo.perfil} onChange={e => setNovo({ ...novo, perfil: e.target.value })} style={S.input}>
          {PERFIS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select aria-label="Município do usuário" value={novo.municipio_uuid} onChange={e => setNovo({ ...novo, municipio_uuid: e.target.value })} style={S.input}>
          <option value="">Município…</option>
          {municipios.map(m => <option key={m.uuid} value={m.uuid}>{m.nome}/{m.uf}</option>)}
        </select>
        <button style={S.btnP} onClick={() => acao(async () => {
          await api.post("/api/admin-geral/usuarios", novo);
          setNovo({ nome: "", email: "", senha: "", perfil: "gestor", municipio_uuid: "" });
        }, "Usuário cadastrado.")}>Cadastrar</button>
      </div>
    </div>
  );
}

// ── Auditoria ─────────────────────────────────────────────────────────────────
function Auditoria() {
  const [itens, setItens] = useState<any[]>([]);
  const [acao, setAcao] = useState("");
  const [erro, setErro] = useState("");
  const carregar = useCallback(() => {
    api.get("/api/admin-geral/auditoria", { params: { limite: 300, ...(acao ? { acao } : {}) } })
      .then(r => { setItens(r.data); setErro(""); }).catch(e => setErro(erroDe(e)));
  }, [acao]);
  useEffect(carregar, [carregar]);
  return (
    <div style={S.card}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <select aria-label="Filtrar por ação" value={acao} onChange={e => setAcao(e.target.value)} style={S.input}>
          <option value="">Todas as ações</option>
          {["ACESSO_NEGADO", "LOGIN", "LOGIN_FALHA", "LOGIN_NEGADO", "TROCA_MUNICIPIO", "SUPORTE_INICIO", "SUPORTE_FIM",
            "ESCRITA", "MUNICIPIO_SITUACAO", "USUARIO_CRIADO", "AUTORIZACAO_MUNICIPIOS", "BACKUP_GERADO",
            "RESTAURACAO_MUNICIPIO"].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button style={S.btn} onClick={carregar}><RefreshCw size={12} /> Atualizar</button>
      </div>
      <Aviso msg={erro} erro />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={S.th}>Quando (UTC)</th><th style={S.th}>Ação</th><th style={S.th}>Usuário</th><th style={S.th}>Município</th><th style={S.th}>Detalhe</th><th style={S.th}>IP</th></tr></thead>
          <tbody>
            {itens.map(a => (
              <tr key={a.id}>
                <td style={S.td}>{String(a.criado_em).replace("T", " ").slice(0, 19)}</td>
                <td style={{ ...S.td, fontWeight: 700, color: a.acao.includes("NEGADO") || a.acao.includes("FALHA") ? "#b91c1c" : "#0f172a" }}>{a.acao}</td>
                <td style={S.td}>{a.usuario_login ?? "—"}</td>
                <td style={S.td}>{a.municipio_id ?? "geral"}</td>
                <td style={{ ...S.td, maxWidth: 420, wordBreak: "break-word" }}>{a.detalhe ?? ""}</td>
                <td style={S.td}>{a.ip_origem ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Backups ───────────────────────────────────────────────────────────────────
function Backups() {
  const [dados, setDados] = useState<any>(null);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [alvo, setAlvo] = useState("");
  const [msg, setMsg] = useState(""); const [erro, setErro] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    const [b, m] = await Promise.all([api.get("/api/admin-geral/backups"), api.get("/api/admin-geral/municipios")]);
    setDados(b.data);
    setMunicipios(m.data.filter((x: any) => x.situacao !== "disponivel"));
  }, []);
  useEffect(() => { carregar().catch(e => { setErro(true); setMsg(erroDe(e)); }); }, [carregar]);

  const acao = async (fn: () => Promise<any>, ok: (r: any) => string) => {
    setMsg(""); setErro(false); setOcupado(true);
    try { const r = await fn(); setMsg(ok(r)); await carregar(); } catch (e) { setErro(true); setMsg(erroDe(e)); }
    finally { setOcupado(false); }
  };

  const restaurar = (b: any) => {
    const nome = window.prompt(
      `RESTAURAR ${b.municipio} para o backup de ${String(b.iniciado_em).slice(0, 16).replace("T", " ")}?\n\n` +
      `Somente os dados deste município voltam ao estado do backup; os demais municípios não são alterados. ` +
      `Um backup de segurança do estado atual é gravado antes.\n\nDigite o nome do município para confirmar:`);
    if (!nome) return;
    acao(() => api.post(`/api/admin-geral/backups/${b.id}/restaurar`, { confirmacao: nome }),
      r => `Restauração concluída. Backup de segurança nº ${r.data.backup_seguranca_id}.`);
  };

  const kb = (n: number | null) => n == null ? "—" : n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`;

  return (
    <div style={S.card}>
      {dados && (!dados.armazenamento_persistente || !dados.chave_dedicada) && (
        <div role="alert" style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 8, padding: 10, fontSize: 12.5, marginBottom: 10 }}>
          {!dados.armazenamento_persistente && <div>⚠ Os backups estão em pasta temporária do servidor e somem a cada deploy. Configure <b>BACKUP_DIR</b>/<b>ARMAZENAMENTO_DIR</b> num volume persistente.</div>}
          {!dados.chave_dedicada && <div>⚠ <b>BACKUP_CHAVE</b> não definida: a criptografia usa chave derivada do SECRET_KEY.</div>}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <select aria-label="Escopo do backup" value={alvo} onChange={e => setAlvo(e.target.value)} style={S.input}>
          <option value="">Backup geral (todo o banco)</option>
          {municipios.map(m => <option key={m.uuid} value={m.uuid}>{m.nome}/{m.uf}</option>)}
        </select>
        <button style={S.btnP} disabled={ocupado} onClick={() => acao(() => api.post("/api/admin-geral/backups", { municipio_uuid: alvo || null }),
          r => r.data.status === "ok" ? `Backup gerado e ${r.data.verificacao_ok ? "aprovado no teste de restauração" : "REPROVADO no teste de restauração"}.` : `Falha: ${r.data.erro}`)}>
          {ocupado ? "Processando…" : "Gerar backup agora"}</button>
        {dados && <span style={{ fontSize: 12, color: "#64748b" }}>Rotina automática diária às 02:30 · retenção {dados.retencao_dias} dias</span>}
      </div>
      <Aviso msg={msg} erro={erro} />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={S.th}>Data (UTC)</th><th style={S.th}>Escopo</th><th style={S.th}>Origem</th><th style={S.th}>Situação</th><th style={S.th}>Tamanho</th><th style={S.th}>Teste de restauração</th><th style={S.th}>Ações</th></tr></thead>
          <tbody>
            {(dados?.backups ?? []).map((b: any) => (
              <tr key={b.id}>
                <td style={S.td}>{String(b.iniciado_em).replace("T", " ").slice(0, 16)}</td>
                <td style={S.td}>{b.municipio ?? "Geral"}</td>
                <td style={S.td}>{b.origem}</td>
                <td style={{ ...S.td, color: b.status === "ok" ? "#15803d" : b.status === "erro" ? "#b91c1c" : "#64748b" }}>{b.status}{b.erro ? `: ${b.erro}` : ""}</td>
                <td style={S.td}>{kb(b.tamanho_bytes)} · {b.total_registros ?? "—"} reg.</td>
                <td style={{ ...S.td, color: b.verificacao_ok ? "#15803d" : b.verificacao_ok === false ? "#b91c1c" : "#64748b" }}
                    title={b.verificacao_detalhe ?? ""}>{b.verificacao_ok == null ? "—" : b.verificacao_ok ? "Aprovado" : "Reprovado"}</td>
                <td style={S.td}>
                  {b.status === "ok" && <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <button style={S.btn} disabled={ocupado} onClick={() => acao(() => api.post(`/api/admin-geral/backups/${b.id}/verificar`),
                      r => r.data.verificacao_ok ? "Teste de restauração aprovado." : `Reprovado: ${r.data.detalhe}`)}>Testar</button>
                    {b.tipo === "municipio" && b.verificacao_ok && <button style={{ ...S.btn, color: "#b91c1c", borderColor: "#fca5a5" }} disabled={ocupado} onClick={() => restaurar(b)}>Restaurar</button>}
                  </div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function AdminGeral({ nome, onLogout }: { nome: string; onLogout: () => void }) {
  const [aba, setAba] = useState<Aba>("entrar");
  const [painel, setPainel] = useState<any>(null);
  useEffect(() => { api.get("/api/admin-geral/painel").then(r => setPainel(r.data)).catch(() => {}); }, [aba]);

  const abas: [Aba, string][] = [["entrar", "Entrar em um município"], ["municipios", "Municípios"],
    ["usuarios", "Usuários"], ["auditoria", "Auditoria"], ["backups", "Backups"]];

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <header style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)", color: "#fff",
        padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>ERSUS 360</div>
        <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(251,191,36,.18)", color: "#fbbf24",
          borderRadius: 4, padding: "2px 8px" }}>ADMINISTRAÇÃO GERAL</span>
        <div style={{ marginLeft: "auto", fontSize: 12.5, color: "#cbd5e1" }}>{nome} · Administrador Geral</div>
        <button onClick={onLogout} style={{ background: "none", border: "1px solid rgba(255,255,255,.25)", color: "#e2e8f0",
          borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <LogOut size={12} /> Sair</button>
      </header>

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: 16 }}>
        {painel && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            {Object.entries(SITUACOES).map(([k, v]) => (
              <div key={k} style={{ ...S.card, padding: "10px 14px", minWidth: 120 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: v.cor }}>{painel.municipios_por_situacao?.[k] ?? 0}</div>
                <div style={{ fontSize: 11.5, color: "#475569" }}>{v.rotulo}</div>
              </div>
            ))}
          </div>
        )}
        <nav role="tablist" aria-label="Administração geral" style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
          {abas.map(([k, rotulo]) => (
            <button key={k} role="tab" aria-selected={aba === k} onClick={() => setAba(k)} style={{
              border: "1px solid " + (aba === k ? "#1d4ed8" : "#cbd5e1"), background: aba === k ? "#1d4ed8" : "#fff",
              color: aba === k ? "#fff" : "#0f172a", borderRadius: 6, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
            }}>{rotulo}</button>
          ))}
        </nav>
        {aba === "entrar" && (
          <div style={{ ...S.card, maxWidth: 520 }}>
            <p style={{ fontSize: 13, color: "#475569", marginTop: 0 }}>
              Escolha o ambiente municipal. O início e o fim do acesso de suporte e todas as alterações feitas ficam registrados na auditoria.
            </p>
            <ListaMunicipios />
          </div>
        )}
        {aba === "municipios" && <Municipios />}
        {aba === "usuarios" && <Usuarios />}
        {aba === "auditoria" && <Auditoria />}
        {aba === "backups" && <Backups />}
      </main>
    </div>
  );
}
