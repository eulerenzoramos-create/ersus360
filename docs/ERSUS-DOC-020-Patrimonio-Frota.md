# ERSUS-DOC-020 — Patrimônio e Frota
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir os módulos de Patrimônio e Frota do ERSUS 360, cobrindo inventário de bens móveis e imóveis, tombamento, depreciação, conservação, veículos, manutenção e controle de combustível da Secretaria Municipal de Saúde.

---

## 2. Módulo Patrimônio

### 2.1 Tipos de bem patrimonial
| Tipo | Exemplos |
|---|---|
| Equipamento médico | Autoclave, nebulizador, sonar obstétrico |
| Equipamento odontológico | Cadeira odontológica, compressor |
| Equipamento de informática | Computadores, tablets, impressoras |
| Mobiliário | Mesas, cadeiras, armários |
| Veículo | Ambulâncias, veículos de campo |
| Imóvel | UBS, CAPS, farmácia (bens imóveis) |
| Instrumento/ferramenta | Bisturis, pinças, estetoscópios |

### 2.2 Dados do bem
| Campo | Tipo | Obrigatório |
|---|---|---|
| Número de tombamento | string | ✅ |
| Descrição | texto | ✅ |
| Tipo | enum | ✅ |
| Marca / Modelo | texto | — |
| Número de série | texto | — |
| Fornecedor | FK | — |
| Nota fiscal | texto | — |
| Valor de aquisição | decimal | ✅ |
| Data de aquisição | data | ✅ |
| Vida útil (anos) | inteiro | ✅ |
| Valor residual | decimal | — |
| Localização atual | FK → Unidade | ✅ |
| Responsável | FK → Servidor | ✅ |
| Estado de conservação | enum | ✅ |
| Ativo | boolean | ✅ |

### 2.3 Estado de conservação
```
otimo       → novo ou seminovo, pleno funcionamento
bom         → funcionamento normal, desgaste moderado
regular     → funcionamento com limitações, manutenção pendente
ruim        → dificuldade de uso, manutenção urgente
inservivel  → sem conserto, aguardando descarte
```

### 2.4 Depreciação
- Cálculo pelo método linear: (Valor aquisição - Valor residual) / Vida útil
- Registrado anualmente no inventário
- Alerta quando bem atinge 80% de depreciação

---

## 3. Módulo Frota

### 3.1 Tipos de veículo
| Tipo | Exemplos |
|---|---|
| Ambulância UTI | UTI móvel — transferências de risco |
| Ambulância Simples | APH básico, transporte de pacientes |
| Veículo Leve | Supervisão ACS, reuniões, coleta |
| Moto | ACS em microáreas rurais |
| Barco | UBS fluviais (Amazônia) |
| Micro-ônibus | TFD (Tratamento Fora Domicílio) |

### 3.2 Dados do veículo
| Campo | Tipo | Obrigatório |
|---|---|---|
| Placa | string | ✅ |
| Tipo | enum | ✅ |
| Marca / Modelo / Ano | texto | ✅ |
| Cor | texto | — |
| Renavam | string | ✅ |
| Chassi | string | — |
| Programa de origem (recurso) | texto | — |
| Unidade responsável | FK | ✅ |
| Condutor habitual | FK → Servidor | — |
| Hodômetro atual | inteiro | ✅ |
| Status | enum | ✅ |

### 3.3 Status de frota
```
disponivel     → pronto para uso
em_uso         → em viagem ou atividade
manutencao     → na oficina
aguardando     → aguardando peça ou orçamento
inativo        → fora de uso (sinistro, leilão)
```

### 3.4 Manutenção de veículos
| Campo | Tipo |
|---|---|
| Veículo | FK |
| Tipo (preventiva / corretiva) | enum |
| Descrição do serviço | texto |
| Fornecedor (oficina) | FK |
| Hodômetro na manutenção | inteiro |
| Valor | decimal |
| Data de entrada / saída | data |
| Próxima manutenção (km/data) | inteiro/data |

### 3.5 Abastecimento
| Campo | Tipo |
|---|---|
| Veículo | FK |
| Motorista | FK → Servidor |
| Data | datetime |
| Posto | texto |
| Combustível | enum (gasolina/diesel/flex/GNV) |
| Litros | decimal |
| Valor total | decimal |
| Hodômetro | inteiro |
| Consumo médio (km/l) | calculado |

---

## 4. Frota Apuí/AM — Referência

| Veículo | Tipo | Placa | Status |
|---|---|---|---|
| FIAT DUCATO 2020 | Ambulância Simples | APU-1234 | Disponível |
| VW KOMBI 2015 | Ambulância Simples | APU-5678 | Manutenção |
| FORD RANGER 2021 | Veículo Leve | APU-9012 | Disponível |
| HONDA CG 160 2022 | Moto | APU-3456 | Disponível |
| BARCO DE ALUMÍNIO 2019 | Barco | — | Disponível |

---

## 5. Endpoints da API

```
# Patrimônio
GET  /api/patrimonio/bens             → inventário completo
GET  /api/patrimonio/bens/{id}        → detalhe do bem
GET  /api/patrimonio/dashboard        → KPIs patrimônio
GET  /api/patrimonio/depreciacoes     → bens com alta depreciação

# Frota
GET  /api/frota/veiculos              → ✅ implementado
GET  /api/frota/veiculos/{id}         → detalhe do veículo
GET  /api/frota/manutencoes           → histórico de manutenções
GET  /api/frota/abastecimentos        → histórico de abastecimentos
GET  /api/frota/dashboard             → KPIs frota (consumo, custos)
GET  /api/frota/alertas               → veículos em atraso de manutenção
```

---

## 6. Regras de Negócio

- RN-020-01: Todo bem patrimonial deve ter número de tombamento único
- RN-020-02: Transferência de bem entre unidades deve ter Termo de Responsabilidade
- RN-020-03: Bem inservível deve passar por processo de desfazimento (leilão/doação)
- RN-020-04: Veículo com manutenção vencida não pode ser liberado para uso
- RN-020-05: Ambulância deve ter vistoria semestral — alerta automático
- RN-020-06: Inventário patrimonial anual obrigatório — divergências devem ser justificadas

---

## 7. Critérios de Aceite

- [ ] Inventário patrimonial com filtro por unidade e estado de conservação
- [ ] Frota com status visual e alertas de manutenção
- [ ] Registro de abastecimento com consumo calculado automaticamente
- [ ] Depreciação calculada e exibida por bem
- [ ] Dashboard frota: km rodados, custo/km, custo total mensal

---

**Documento:** ERSUS-DOC-020
**Versão:** 1.0 · Julho/2026
**Anterior:** ERSUS-DOC-019 — Obras e Infraestrutura
**Próximo:** ERSUS-DOC-021 — Business Intelligence
