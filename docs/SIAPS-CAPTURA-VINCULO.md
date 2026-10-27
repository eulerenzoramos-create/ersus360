# Captura do Vínculo (CVAT) mensal — SIAPS área logada → ERSUS360

O resultado mensal por equipe do Componente Vínculo e Acompanhamento Territorial (variáveis A–K e pontuação)
só existe na área logada do SIAPS. O SIAPS monta o relatório oficial ("Baixar dados filtrados em tela" → .csv)
no próprio navegador; o comando abaixo captura esse conteúdo **sem baixar arquivo** e o entrega à Captura
assistida do eGestor, que o importa pelo mesmo leitor da importação manual (`services/siaps_relatorio.py`,
mesmas validações: município da sessão, "Visão por Competência", colunas A–K). Senha e token não saem do SIAPS.

Requer o frontend desta branch (Captura assistida aceita `arquivos` no pacote).

## Passo a passo

1. No navegador logado no SIAPS, abrir `https://siaps.saude.gov.br/componentes/cvat` (Visão por Competência).
   Conferir no filtro a competência desejada (ex.: Ago/26), equipes homologadas, tipo eAP e eSF.
2. F12 → Console → colar o comando → Enter. Esperar ~15 s.
3. Digitar `__resumo` → Enter: mostra a competência e o número de linhas capturadas.
4. Digitar `copy(__pacote)` → Enter.
5. No ERSUS360 › eGestor › Componente Qualidade › "▸ Captura assistida do SIAPS": colar (Ctrl+V) e
   clicar **Importar captura**. Aparece "Importado: Vínculo (CVAT) Ago/2026 · N equipes".

## Comando

```js
(async () => {
  const capturado = [];
  const oc = URL.createObjectURL, ok = HTMLAnchorElement.prototype.click, od = HTMLAnchorElement.prototype.dispatchEvent;
  URL.createObjectURL = function (b) {
    if (b instanceof Blob && /csv/i.test(b.type)) capturado.push(b.text());
    return oc.call(URL, b);
  };
  // não deixa o navegador baixar o arquivo: o conteúdo vai direto para o ERSUS360
  HTMLAnchorElement.prototype.click = function () { if (this.download) return; return ok.call(this); };
  HTMLAnchorElement.prototype.dispatchEvent = function (e) { if (this.download && e.type === "click") return true; return od.call(this, e); };
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const botao = re => [...document.querySelectorAll("button")].find(b => re.test(b.textContent.trim()));
  try {
    const aplicar = botao(/aplicar filtro/i);
    if (!aplicar) { window.__resumo = "ERRO: abra https://siaps.saude.gov.br/componentes/cvat logado"; return; }
    aplicar.click(); await espera(6000);
    const baixar = botao(/baixar dados/i);
    if (!baixar) { window.__resumo = "ERRO: botão 'Baixar dados' não encontrado"; return; }
    baixar.click(); await espera(1500);
    if (!capturado.length) {
      const csv = [...document.querySelectorAll("a, li, span, button, [role=menuitem]")].find(e => e.textContent.trim().toLowerCase() === ".csv");
      if (csv) { csv.click(); await espera(4000); }
    }
    if (!capturado.length) { window.__resumo = "ERRO: o SIAPS não gerou o relatório .csv"; return; }
    const conteudo = await capturado[capturado.length - 1];
    const comp = (conteudo.match(/Compet[eê]ncia selecionada:\s*([A-Z]{3}\/\d{2})/i) || [])[1] || "?";
    if (!/CVAT/i.test(conteudo)) { window.__resumo = "ERRO: o relatório gerado não é o do Vínculo (CVAT)"; return; }
    window.__pacote = JSON.stringify({ formato: "ersus360-siaps-captura-v1", fonte: "SIAPS área logada", municipio_ibge: "130014",
      capturado_em: new Date().toISOString(), colunas: [], linhas: [],
      arquivos: [{ nome: `siaps-cvat-${comp.replace("/", "-")}.csv`, conteudo }] });
    window.__resumo = `Vínculo (CVAT) ${comp}: ${conteudo.split(/\r?\n/).length} linhas no relatório — agora rode copy(__pacote)`;
  } finally {
    URL.createObjectURL = oc; HTMLAnchorElement.prototype.click = ok; HTMLAnchorElement.prototype.dispatchEvent = od;
  }
})()
```
