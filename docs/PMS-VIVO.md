# PMS Vivo — Gestão, Execução e Resultados do Plano Municipal de Saúde

Tela: `/pms-vivo` (menu "Planejamento e Prestação de Contas"). API: `/api/pms-vivo/*`. Multi-município, com auditoria.

## Entrega 1 — fases 1 a 3 (esta branch)

### PMS: cadastro, importação e versões
- O PMS do quadriênio é guardado com diretrizes, objetivos e metas.
- Cada meta tem um identificador próprio (`uid`), que continua o mesmo entre as versões, e o código do documento.
- Cada meta registra:
  - indicador e tipo do indicador (percentual, taxa, índice, absoluto acumulável ou não acumulável, sim/não);
  - unidade, polaridade e fórmula;
  - linha de base e meta quadrienal;
  - meta prevista para cada ano da vigência;
  - fonte e setor responsável.
- **Importação:** planilha Excel modelo (`GET /modelo.xlsx`).
  - A prévia aponta erros e avisos e não grava nada.
  - Célula ilegível fica vazia, nunca estimada.
  - Só a confirmação depois da revisão grava as metas.
- O PDF oficial do PMS fica anexado ao plano.
- **Versões:**
  - A versão aprovada (com a resolução do CMS) é a oficial e não pode ser editada.
  - Uma alteração vira "nova versão" (proposta), com os mesmos `uid`.
  - Quando a proposta é aprovada, a versão anterior passa a "substituído" e continua consultável.

### PAS e ações
- Uma PAS por exercício da vigência, sempre ligada a uma versão aprovada do PMS. Ela também é aprovada com a resolução do CMS.
- Cada ação registra:
  - código, descrição, produto/entrega e quantidade prevista;
  - prazo, setor e responsável (usuário do município);
  - recursos e fonte de financiamento;
  - indicador de acompanhamento e evidência esperada.
- Relação de N para N entre ações e metas (`pms_acao_meta`): uma ação pode servir a várias metas e uma meta pode ter várias ações. A tela do PMS mostra quantas ações cada meta tem.
- Com a PAS aprovada, código, descrição e quantidade ficam travados. A ação não é excluída: só pode ser cancelada.

### Execução — "não basta marcar uma caixa"
- O responsável informa a situação: em andamento, concluída, parcialmente executada, não executada ou cancelada.
- Junto com a situação, informa o percentual, a quantidade realizada, o resultado, a justificativa e a evidência.
- A informação fica **aguardando validação**. A situação oficial da ação só muda quando outra pessoa valida.
- Quem valida: Secretário, Planejamento, Coordenação ou administrador.
- Ninguém valida a própria atualização, nem o Secretário.
- Regras de preenchimento:
  - Concluída exige o resultado.
  - Parcial, não executada e cancelada exigem justificativa.
  - Validar uma conclusão exige que a evidência esperada esteja anexada.
  - Cancelamento só é validado pelo Secretário, pelo Planejamento ou pelo administrador.
- Devolução exige motivo, que aparece para o responsável.
- A tela separa a execução física da ação do cumprimento da meta e do desempenho do indicador. Os dois últimos ficam para a entrega 2.

### Minhas Ações
- Mostra as ações do usuário da sessão, com contadores:
  - atrasadas;
  - prazo em até 15 dias;
  - aguardando validação;
  - devolvidas;
  - evidências a apresentar.
- Cada ação mostra metas, prazo, entrega e evidência esperada.

### Perfis
Usa os perfis que já existem, sem criar perfil novo no banco:

| Papel | Perfil |
|---|---|
| Secretário | `gestor` |
| Coordenação de Planejamento | `planejamento` |
| Coordenadores | `coordenador` |
| Assessoria | `admin` / `auditoria` |
| Controle social / consulta | `conselho` / `consulta` (só leitura) |
| Executor | o usuário indicado na ação |

## Próximas entregas
- **Entrega 2 (fases 4 e 5):**
  - painel do gestor com filtros, Kanban e cronograma;
  - alertas e cobranças;
  - resultado anual das metas, com fórmula por tipo de indicador (sem somar percentuais e taxas);
  - indicadores do ERSUS360 como fonte quando a correspondência for exata;
  - análise FCA.
- **Entrega 3 (fases 6 e 7):**
  - "Reprogramar para o Exercício Seguinte", com aprovação;
  - relatórios de apoio ao RDQA e ao RAG, em PDF e Excel;
  - reuniões mensais com pauta e decisões;
  - ligação com os problemas do Diagnóstico Situacional.
- **Fase 8:** carregar o PMS real de Apuí, que o usuário vai enviar, e validar os fluxos.

## Testes
`backend/tests/test_pms_vivo.py` cobre:
- a planilha: números, erros apontados sem correção automática e prévia;
- a importação, a aprovação e as versões;
- a PAS e as ações N:N;
- a execução, a validação, a devolução, o cancelamento e a proibição de autovalidação;
- Minhas Ações, o isolamento entre municípios e os perfis.
