# Painel de Vigilância em Saúde — painel gerencial (nov/2026)

Reestruturação da tela `/vigilancia-saude` (entrada da aba VIGILÂNCIA EM SAÚDE). Continua usando a base pública
da FVS-RCP/AM (ver `VIGILANCIA-FVS-AM.md`) e acrescenta duas fontes oficiais verificadas: **INPE — focos de calor**
e **SISAGUA — vigilância da qualidade da água**. As 15 subabas e as demais telas não foram alteradas.

## 1. Arquitetura encontrada (antes)

| Peça | Situação |
|---|---|
| `routers/vigilancia_fvs.py` + `services/fvs_*.py` | 5 coletores reais (PQA-VS, SINAN, malária/SIVEP, AESOP, vacinômetro), série `fvs_serie`, alertas, mapa, comparativo, relatórios, Agente IA |
| `pages/VigilanciaSaudePainel.tsx` | 8 abas (visão geral, mapa, comparativo, PQA-VS, relatórios, IA, integrações, painéis) |
| Alertas | lista corrida; integração ("fonte sem atualização") misturada aos epidemiológicos |
| Queimadas, VigiÁgua, clima | rotas respondem `nao_disponivel` (sem fonte) — nada simulado |

Dados simulados: **nenhum** no painel. Tudo vem de fonte pública oficial ou aparece como "Dados não disponíveis".

## 2. Nova estrutura da tela

Faixa fixa no topo: filtros (Região de Saúde, município, ano) + **resumo de alertas** por prioridade.

| Aba | Conteúdo |
|---|---|
| Visão geral | 8 cartões executivos; situações prioritárias; evolução semanal (3 anos); 10 agravos mais notificados; comparativo de períodos equivalentes; distribuição por zona de residência |
| Central de alertas | crítico/alto/moderado/informativo; filtros por categoria, área, situação, busca; detalhe expansível; avaliação técnica + providências com histórico; avisos de integração em bloco separado |
| Respiratórias e ar | SRAG, síndrome gripal na APS, atendimentos APS, avisos AESOP, vírus (GAL), focos de calor; gráficos alinhados por semana; comparação semanas de maior × menor exposição |
| Diarreicas e água | MDDA (não disponível — motivo); SISAGUA: amostras, E. coli, coliformes, turbidez, cloro; agravos de transmissão hídrica |
| Arboviroses e endemias | dengue, chikungunya, zika, febre amarela, leishmanioses, leptospirose, Chagas; malária (positivos, IPA, espécie, semana) |
| Notificação compulsória | tabela com CID-10, ano × anterior, mesmo período, variação, tendência, notificação imediata; pesquisa, filtro, ordenação, exportação CSV (Excel) |
| Ambiental e clima | focos por mês (5 anos), por ano, mapa e ranking dos 62 municípios; painel oficial de inundação da FVS |
| PQA-VS | semáforo (verde/amarelo/vermelho/cinza), % de cumprimento da meta publicada, histórico |
| Relatórios, mapas e inteligência | inteligência epidemiológica (fatos/hipóteses/investigar/limitações), relatórios, mapa do AM, comparativo, Agente IA, integrações, painéis oficiais |

## 3. Indicadores e fontes

| Indicador | Fonte | Situação |
|---|---|---|
| Notificações por agravo, SE, sexo, faixa etária, zona | FVS — monitoramento SINAN | integrado |
| Casos confirmados × suspeitos | — | **não disponível** (base pública só conta notificações) |
| Malária: positivos, IPA, espécie | FVS — SIVEP-Malária | integrado |
| Malária autóctone × importada, localidade | — | não disponível (painel conta por município provável de infecção) |
| SRAG, SG na APS, avisos AESOP, vírus GAL | FVS/CIEVS — AESOP | integrado |
| Focos de calor (satélite de referência AQUA_M-T) | INPE — Programa Queimadas | **novo coletor** `inpe_focos` |
| Amostras de água (E. coli, coliformes, turbidez, cloro) | MS — API Dados Abertos SISAGUA | **novo coletor** `sisagua` |
| PM2,5 / qualidade do ar | INPE-SISAM / CAMS (estimativa de modelo) | **decisão pendente** da Secretaria |
| Precipitação, estiagem | INMET | não disponível (API exige token institucional) |
| Cheias, emergências | FVS (painel Inundação), Defesa Civil/S2iD | painel oficial incorporado; série aberta não verificada |
| MDDA (diarreia por SE, faixa etária, surtos) | Sivep-DDA | não disponível (sem acesso público) |
| Internações / óbitos por causas prioritárias | SIH/SUS, SIM | fase 2 (arquivos DATASUS) |
| PQA-VS: meta, resultado, alcance | FVS — PQA-VS | integrado; metas lidas da publicação |

Verificado em 05/11/2026: `dataserver-coids.inpe.br` (CSV anual por UF, satélite de referência; mensal Brasil),
`apidadosabertos.saude.gov.br/sisagua/vigilancia-parametros-basicos` (filtro `uf`, `ano`; `codigo_ibge` às vezes vazio →
casamento pelo nome). Apuí não tem amostra de vigilância no SISAGUA em 2024–2026 (lacuna de monitoramento, mostrada como tal).
`apitempo.inmet.gov.br` sem resposta sem credencial.

## 4. Critérios documentados

- **Crítico**: notificação no ano de agravo de notificação imediata (Lista Nacional de Notificação Compulsória —
  `fvs_catalogo.NOTIFICACAO_IMEDIATA`). Pede verificar a investigação; não afirma caso confirmado.
- **Alto**: aviso AESOP oficial; aumento ≥ 100% no acumulado do ano (≥ 5 casos); E. coli em amostra da vigilância nos últimos 3 meses.
- **Moderado**: aumento ≥ 50% (≥ 5 casos); crescimento ≥ 100% nas últimas 4 SE; meta PQA-VS não atingida; aumento ≥ 50% de focos (≥ 10 focos).
- **Informativo**: integração (falha/atraso), município sem amostras no SISAGUA.
- Categorias: epidemiológico, ambiental, desempenho, **integração (separada)**.
- Tendência: últimas 4 SE × 4 anteriores, ±25%; "números pequenos" abaixo de 5 casos.
- Semáforo PQA-VS: verde = alcance "SIM" publicado; amarelo = não atingiu, ≥ 90% da meta; vermelho = < 90%; cinza = sem dado/ausência de casos.
- Associação temporal (fumaça × respiratório, água × diarreia) é sempre descrita como coincidência, nunca causa.

## 5. Acompanhamento dos alertas (segurança)

Tabela `vig_alerta_acompanhamento` (por `municipio_id`, somente inclusão = histórico). Registra só o município da sessão,
perfis `admin, gestor, coordenador, vigilancia, enfermeiro, medico` (e administrador-geral); a chave precisa ser de um alerta
atual do município (404 caso contrário). Consulta de outro município mostra os alertas públicos, sem o acompanhamento.
Cada registro gera auditoria `VIG_ALERTA_ACOMPANHAMENTO`. A tela pede para não registrar nome/CPF/CNS de paciente.

## 6. Rotas novas

`GET /api/vigilancia-fvs/area/{visao|respiratoria|diarreicas|arboviroses|notificacoes|ambiental|inteligencia}?mun=&ano=`,
`GET /pqa-semaforo`, `GET /alertas/central`, `GET /alertas/acompanhamento/{chave}`, `POST /alertas/acompanhamento`.
Relatórios novos: `respiratorio`, `diarreicas`, `arboviroses` (PDF/Excel/Word).

## 7. Próximas fases

1. PM2,5: decidir uso de estimativa de modelo (SISAM/CAMS), rotulada como estimativa.
2. INMET: solicitar token institucional em nome da Secretaria.
3. SIH/SIM: internações e óbitos por causas prioritárias (arquivos públicos DATASUS).
4. Arboviroses confirmadas: microdados da API Dados Abertos (classificação final, com defasagem).
5. MDDA e território (bairro/localidade): dependem de planilha MDDA municipal / e-SUS APS do próprio município.
