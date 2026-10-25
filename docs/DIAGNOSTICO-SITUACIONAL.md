# Diagnóstico Situacional da Saúde Municipal

Tela: `/diagnostico-situacional` (menu "Planejamento e Prestação de Contas"). API: `/api/diagnostico-situacional/*`.
Multi-município: tudo é filtrado pelo município da sessão; registro de outro município → 404 auditado.

## Regras
- Classificação por item: **Regular**, **Com pendência**, **Crítico**, **Não se aplica**, **Não verificado**.
- Cada item guarda fonte, competência do dado, evidência, data, justificativa, prioridade, responsável e observações.
- **Ausência de dado = Não verificado**, nunca irregularidade. Falha ou bloqueio da fonte também é "Não verificado", com o motivo.
- **Achado comprovado × hipótese** (`natureza`). Exemplo: um repasse do FNS que não foi identificado entra como hipótese, porque a coleta pode estar incompleta.
- **Tipo de dado** no painel e no relatório:
  - Automático: fonte oficial integrada.
  - Declarado: informado pelo município.
  - Validado: confirmado por técnico.
- Quando o técnico altera um dado automático, o item passa a ser declarado e volta para "aguardando validação".
- A coleta nova não reescreve item declarado, validado ou contestado; o histórico registra a tentativa.
- **Crítico** só sai de regra explícita: SIOPS abaixo do mínimo da LC 141, suspensão publicada no e-Gestor ou composição mínima incompleta no CNES.
- O plano 5W2H só aceita problema validado (Com pendência ou Crítico, confirmado). Prazo vencido sem conclusão = ação atrasada.
- Alertas do painel:
  - novo crítico em relação ao diagnóstico anterior;
  - piora de classificação;
  - crítico sem validação;
  - ação atrasada.

  Os novos críticos também vão para a central `alertas`, no módulo "Diagnóstico", sem duplicar.
- Rotina diária às 08:00 (Manaus), job `diagnostico_situacional`: atualiza a coleta automática dos diagnósticos **não concluídos** de cada município ativo. Roda depois das coletas da manhã (SIAPS, e-Gestor, FVS e InvestSUS), segue as mesmas regras da coleta manual, registra alertas centrais e é auditada como `sistema`.
- Diagnóstico concluído bloqueia edição até ser reaberto. Toda escrita vai para a auditoria (`DIAGNOSTICO_*`) e para o histórico do item.
- Anexos ficam em `documentos/diagnostico/{id}` do município: limite de 10 MB, tipos restritos, exclusão lógica. Entram no backup municipal.

## Fontes por item (catálogo: `backend/services/diagnostico_catalogo.py`)
| Modo | Itens |
|---|---|
| Dado automático (8) | B01 SIAPS (quadrimestre público) · B02 e-Gestor ausência de envio · B03 e-Gestor pagamento por equipe · C01 XML-CNES (composição mínima) · E01 PQA-VS (FVS-AM) · G01 SIOPS (EC 29/LC 141) · G02 FNS previsto × recebido · G03 InvestSUS |
| Exige integração (11) | A01–A04 DigiSUS Gestor/DGMP (PMS, PAS, RDQA, RAG) · B04 e I02 agente PEC (fórmula de cobertura ainda não validada) · D02 SISREG · E03 SIPNI · E04 SINAN · F02 Hórus/BNAFAR · G04 extratos das contas do FMS |
| Levantamento municipal (21) | A05, A06, B05, C02–C04, D01, D03, D04, E02, F01, F03, F04, G05, H01–H04, I01, I03, I04 |

Até a integração existir, os itens "exige integração" são preenchidos pelo município com evidência e passam pela validação técnica.

## Piloto Apuí/AM — situação em 25/10/2026
Nenhum resultado foi preenchido à mão. Ao gerar o diagnóstico em produção, cada item automático mostra o que a fonte trouxe para o período. Se não houver dado, mostra "Não verificado" com o motivo.

- **Com dado já coletado no ERSUS360**:
  - SIAPS público: o 1º quadrimestre de 2026 está no teste com a publicação real de 17/10/2026, que tem 2 eSF em Regular.
  - e-Gestor: pagamento e ausência de envio.
  - XML-CNES, quando importado.
  - FVS-AM PQA-VS.
  - InvestSUS e FNS, quando sincronizados ou cadastrados.
- **Não comprovado ao vivo nesta entrega**: SIOPS. A API `apidadosabertos.saude.gov.br` recusa a conexão a partir da máquina de desenvolvimento ("Connection was reset"); por isso o item ficou "Não verificado", como manda a regra. Conferir em produção (Railway) gerando um diagnóstico anual.
- **Depende do município**: todas as áreas A, D, F, H e I e os itens C02–C04, que tratam de funcionamento real, estrutura e carga horária.

## Relatório PDF (12 seções)
1. Identificação
2. Objetivo e metodologia
3. Fontes e períodos
4. Síntese
5. Diagnóstico por área
6. Problemas, separando comprovados de hipóteses
7. Pendências de verificação
8. Vazios assistenciais
9. Recomendações (as ações 5W2H registradas e os problemas validados ainda sem ação)
10. Prioridades
11. Limitações
12. Responsáveis

## Testes
`backend/tests/test_diagnostico_situacional.py` (15 testes): regras sem rede, fluxo completo pela API, validação, 5W2H, anexos, PDF, comparação, alerta central, falha de uma fonte sem desfazer as outras, rotina diária e isolamento entre municípios.
