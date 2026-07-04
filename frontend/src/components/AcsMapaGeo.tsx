/**
 * AcsMapaGeo — Mapa Leaflet com posições em tempo real dos ACS
 * Exige que o CSS do Leaflet esteja no index.html (CDN).
 */
import { useEffect, useRef } from "react";
import type { PosicaoAcs, RegistroProducao } from "../hooks/useAcsGeo";

// Coordenadas reais de Apuí/AM
const APUI_CENTER: [number, number] = [-7.1972, -59.8878];
const ZOOM_INICIAL = 14;

// Microáreas — coordenadas aproximadas dos bairros de Apuí/AM
const MICROAREAS_GEO: Record<string, { lat: number; lng: number; nome: string; cor: string }> = {
  "MA-01": { lat: -7.193,  lng: -59.884, nome: "Centro",             cor: "#2563eb" },
  "MA-02": { lat: -7.196,  lng: -59.879, nome: "Bairro Novo",        cor: "#7c3aed" },
  "MA-03": { lat: -7.199,  lng: -59.891, nome: "Santo Antônio",      cor: "#0891b2" },
  "MA-04": { lat: -7.202,  lng: -59.886, nome: "Industrial",         cor: "#d97706" },
  "MA-05": { lat: -7.188,  lng: -59.895, nome: "Rio Apuí",           cor: "#16a34a" },
  "MA-06": { lat: -7.185,  lng: -59.880, nome: "Setor Norte",        cor: "#dc2626" },
  "MA-07": { lat: -7.210,  lng: -59.900, nome: "Ramal do Cupim",     cor: "#0d9488" },
  "MA-08": { lat: -7.215,  lng: -59.870, nome: "Assentamento Trop.", cor: "#9333ea" },
};

const STATUS_COR: Record<string, string> = {
  ativo:        "#16a34a",
  em_visita:    "#2563eb",
  deslocamento: "#d97706",
  offline:      "#9ca3af",
};

const STATUS_LABEL: Record<string, string> = {
  ativo:        "Ativo",
  em_visita:    "Em Visita",
  deslocamento: "Deslocamento",
  offline:      "Offline",
};

interface Props {
  posicoes: PosicaoAcs[];
  producaoHoje: RegistroProducao[];
  altura?: number;
}

export function AcsMapaGeo({ posicoes, producaoHoje, altura = 480 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<number, any>>({});
  const producaoMarkersRef = useRef<any[]>([]);

  // Inicializa o mapa (uma única vez)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Leaflet injetado via CDN no index.html; acessa pelo global
    const L = (window as any).L;
    if (!L) {
      console.warn("[AcsMapaGeo] Leaflet não encontrado no window.L");
      return;
    }

    const map = L.map(containerRef.current, {
      center: APUI_CENTER,
      zoom: ZOOM_INICIAL,
      zoomControl: true,
    });
    mapRef.current = map;

    // Tiles OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Marcadores de referência das microáreas
    Object.entries(MICROAREAS_GEO).forEach(([codigo, ma]) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          background:${ma.cor}22;border:2px solid ${ma.cor};border-radius:50%;
          width:36px;height:36px;display:flex;align-items:center;justify-content:center;
          font-size:9px;font-weight:700;color:${ma.cor};text-align:center;line-height:1.2;
        ">${codigo}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      L.marker([ma.lat, ma.lng], { icon, zIndexOffset: 0 })
        .addTo(map)
        .bindPopup(`<b>${codigo} — ${ma.nome}</b><br>Área de referência`);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Atualiza marcadores dos ACS quando posições mudam
  useEffect(() => {
    const L = (window as any).L;
    const map = mapRef.current;
    if (!L || !map) return;

    posicoes.forEach(pos => {
      const cor = STATUS_COR[pos.status] ?? "#9ca3af";
      const pulse = pos.status === "em_visita" ? `
        @keyframes pulse-acs {0%{box-shadow:0 0 0 0 ${cor}88}100%{box-shadow:0 0 0 12px transparent}}
        animation:pulse-acs 1.5s infinite;
      ` : "";

      const html = `
        <div style="position:relative;width:40px;height:48px">
          <div style="
            background:${cor};border:3px solid #fff;border-radius:50% 50% 50% 0;
            width:28px;height:28px;transform:rotate(-45deg);
            box-shadow:0 2px 8px rgba(0,0,0,.3);${pulse}
          "></div>
          <div style="
            position:absolute;top:4px;left:6px;
            color:#fff;font-size:9px;font-weight:800;
            transform:rotate(0deg);line-height:1;text-align:center;width:16px;
          ">${pos.acs_id}</div>
        </div>`;

      const icon = L.divIcon({
        className: "",
        html,
        iconSize: [40, 48],
        iconAnchor: [20, 48],
        popupAnchor: [0, -50],
      });

      const popupHtml = `
        <div style="font-family:sans-serif;min-width:180px">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px">${pos.nome}</div>
          <div style="font-size:11px;color:#6b7280">Microárea: ${pos.microarea || "—"}</div>
          <div style="font-size:11px;margin-top:2px">
            <span style="background:${cor}22;color:${cor};padding:2px 6px;border-radius:8px;font-weight:600">
              ${STATUS_LABEL[pos.status] ?? pos.status}
            </span>
          </div>
          ${pos.bateria !== null ? `<div style="font-size:10px;color:#9ca3af;margin-top:4px">🔋 ${pos.bateria}%</div>` : ""}
          <div style="font-size:10px;color:#9ca3af;margin-top:2px">
            📍 ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}<br>
            🕐 ${new Date(pos.ts).toLocaleTimeString("pt-BR")}
          </div>
        </div>`;

      if (markersRef.current[pos.acs_id]) {
        markersRef.current[pos.acs_id].setLatLng([pos.lat, pos.lng]);
        markersRef.current[pos.acs_id].setIcon(icon);
        markersRef.current[pos.acs_id].setPopupContent(popupHtml);
      } else {
        const marker = L.marker([pos.lat, pos.lng], { icon, zIndexOffset: 1000 })
          .addTo(map)
          .bindPopup(popupHtml);
        markersRef.current[pos.acs_id] = marker;
      }
    });
  }, [posicoes]);

  // Pinos de produção/visitas registradas
  useEffect(() => {
    const L = (window as any).L;
    const map = mapRef.current;
    if (!L || !map) return;

    // Remove os anteriores
    producaoMarkersRef.current.forEach(m => map.removeLayer(m));
    producaoMarkersRef.current = [];

    producaoHoje
      .filter(r => r.lat && r.lng)
      .slice(-50)  // últimas 50 visitas com GPS
      .forEach(r => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            background:#16a34a;border:2px solid #fff;border-radius:50%;
            width:12px;height:12px;box-shadow:0 1px 4px rgba(0,0,0,.4);
          "></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        const m = L.marker([r.lat!, r.lng!], { icon, zIndexOffset: 500 })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;font-size:12px">
              <b>✅ Visita registrada</b><br>
              <span style="color:#6b7280">${r.nome}</span><br>
              Família: ${r.familia}<br>
              ${r.procedimentos.length ? `Procedimentos: ${r.procedimentos.join(", ")}<br>` : ""}
              🕐 ${new Date(r.ts).toLocaleTimeString("pt-BR")}
            </div>`);
        producaoMarkersRef.current.push(m);
      });
  }, [producaoHoje]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: altura, borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" }}
    />
  );
}
