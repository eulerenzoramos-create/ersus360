// src/pages/Sus360.tsx — SUS 360° integrado via iframe
import { useState } from "react";
import { ExternalLink, RefreshCw, Maximize2, Minimize2, Monitor } from "lucide-react";

const URL_SUS360 = "https://sus360.saude.gov.br/";
const BLUE = "#1565c0";

const PAINEIS = [
  { label: "Início", url: "https://sus360.saude.gov.br/" },
  { label: "Produção Consolidada", url: "https://sus360.saude.gov.br/" },
  { label: "Panorama Clínico", url: "https://sus360.saude.gov.br/" },
  { label: "Monitor de Oncologia", url: "https://sus360.saude.gov.br/" },
  { label: "Monitor de Hemodiálise", url: "https://sus360.saude.gov.br/" },
  { label: "Capacidade Instalada", url: "https://sus360.saude.gov.br/" },
  { label: "Saldo do Gestor", url: "https://sus360.saude.gov.br/" },
];

export default function Sus360() {
  const [url, setUrl] = useState(URL_SUS360);
  const [key, setKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);

  function recarregar() {
    setKey(k => k + 1);
    setBloqueado(false);
  }

  function abrirExterno() {
    window.open(url, "_blank", "noopener");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: fullscreen ? "100vh" : "calc(100vh - 56px)", background: "#f5f5f3" }}>

      {/* Barra de controle */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e0e0e0",
        padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
      }}>
        {/* Logo + título */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 8 }}>
          <Monitor size={18} color={BLUE} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#212121" }}>SUS 360°</span>
          <span style={{ fontSize: 11, color: "#757575", background: "#e3f2fd", padding: "2px 7px", borderRadius: 10 }}>
            Ministério da Saúde
          </span>
        </div>

        {/* Abas de painéis */}
        <div style={{ display: "flex", gap: 4, flex: 1, overflowX: "auto" }}>
          {PAINEIS.map(p => (
            <button
              key={p.label}
              onClick={() => { setUrl(p.url); setBloqueado(false); setKey(k => k + 1); }}
              style={{
                padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                border: "1px solid", whiteSpace: "nowrap",
                background: url === p.url ? BLUE : "#fff",
                color: url === p.url ? "#fff" : "#616161",
                borderColor: url === p.url ? BLUE : "#e0e0e0",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Ações */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={recarregar} title="Recarregar" style={btnStyle}>
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setFullscreen(f => !f)} title="Tela cheia" style={btnStyle}>
            {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button onClick={abrirExterno} title="Abrir em nova aba" style={{ ...btnStyle, background: BLUE, color: "#fff", borderColor: BLUE }}>
            <ExternalLink size={15} />
            <span style={{ fontSize: 12 }}>Abrir</span>
          </button>
        </div>
      </div>

      {/* Iframe ou mensagem de bloqueio */}
      <div style={{ flex: 1, position: "relative" }}>
        {bloqueado ? (
          <Bloqueado onAbrir={abrirExterno} onTentar={recarregar} />
        ) : (
          <iframe
            key={key}
            src={url}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            title="SUS 360°"
            onError={() => setBloqueado(true)}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        )}
      </div>

      {/* Aviso caso iframe bloqueie */}
      <div style={{
        padding: "6px 16px", background: "#fff8e1", borderTop: "1px solid #ffe082",
        fontSize: 11, color: "#795548", display: "flex", justifyContent: "space-between",
      }}>
        <span>⚠ Se o sistema não carregar abaixo, clique em "Abrir" para visualizar em nova aba.</span>
        <span style={{ color: "#757575" }}>sus360.saude.gov.br · Ministério da Saúde</span>
      </div>
    </div>
  );
}

function Bloqueado({ onAbrir, onTentar }: { onAbrir: () => void; onTentar: () => void }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 16, background: "#fafafa",
    }}>
      <Monitor size={52} color="#bdbdbd" />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#424242" }}>SUS 360° não pôde ser carregado aqui</div>
        <div style={{ fontSize: 13, color: "#757575", marginTop: 4 }}>
          O site do Ministério da Saúde pode bloquear exibição dentro de outros sistemas.
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onTentar} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Tentar novamente
        </button>
        <button onClick={onAbrir} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: BLUE, color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <ExternalLink size={14} /> Abrir SUS 360° em nova aba
        </button>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 4,
  padding: "6px 10px", borderRadius: 6, border: "1px solid #e0e0e0",
  background: "#fff", color: "#424242", cursor: "pointer", fontSize: 12,
};
