# ERSUS-DOC-024 — App Mobile ACS
**ERSUS Tecnologia em Saúde Pública**
Versão 1.0 · Julho/2026

---

## 1. Objetivo
Definir o App Mobile do ERSUS 360 para Agentes Comunitários de Saúde (ACS), disponível em Android e iOS, com funcionamento offline e sincronização automática quando houver conexão — adaptado à realidade de Apuí/AM, onde muitas microáreas têm sinal instável.

---

## 2. Stack Tecnológica

| Tecnologia | Escolha | Justificativa |
|---|---|---|
| Framework | React Native + Expo | Código compartilhado iOS/Android |
| Navegação | React Navigation v6 | Padrão React Native |
| Estado | Zustand | Leve, simples para mobile |
| Offline | SQLite local (expo-sqlite) | Funciona sem internet |
| Sincronização | Background fetch | Sincroniza quando tem sinal |
| Auth | JWT (mesmo do backend) | Reutiliza infraestrutura |
| Push | Expo Notifications | Alertas de busca ativa |
| Mapas | React Native Maps | Navegação por microárea |

---

## 3. Funcionalidades do App

### 3.1 Tela inicial — Dashboard ACS
- Nome do ACS, microárea, equipe
- Total de famílias cadastradas
- Visitas do mês: realizadas / meta
- Alertas de busca ativa (gestantes, vacinas)
- Botão: "Iniciar visita"

### 3.2 Lista de famílias
- Listagem de todas as famílias da microárea
- Filtros: sem visita há X dias, busca ativa, gestante
- Busca por nome/CNS
- Ordenação: última visita, risco

### 3.3 Registro de visita domiciliar
| Campo | Tipo |
|---|---|
| Família | Seleção da lista |
| Data/hora | Automático |
| Tipo de visita | enum (rotina, busca ativa, retorno) |
| Membros presentes | Lista de membros |
| Problemas identificados | Texto livre |
| Encaminhamentos | enum (UBS, CAPS, urgência) |
| Fotos | Câmera (opcional) |
| Localização GPS | Automático |

### 3.4 Busca Ativa
- Lista diária gerada pelo sistema (servidor)
- Gestantes sem consulta nos últimos 30 dias
- Crianças com vacinas em atraso
- Pacientes com doenças crônicas sem acompanhamento
- Status: pendente → visitado → encaminhado → resolvido

### 3.5 Funcionamento Offline
```
Online:   sincroniza tudo com o servidor em tempo real
Offline:  trabalha com banco SQLite local
          → registra visitas offline
          → ao reconectar: sincroniza automaticamente
          → conflitos são resolvidos por timestamp
```

---

## 4. UX/UI para ACS

### 4.1 Princípios de design
- Botões grandes (dedo, luva)
- Contraste alto (uso em campo, luz solar)
- Sem necessidade de digitação excessiva
- Ícones claros e autoexplicativos
- Funciona em telefone de R$ 600 (hardware mínimo)

### 4.2 Acessibilidade
- Fonte mínima 16px
- Alto contraste no modo externo (sol)
- VoiceOver/TalkBack compatível
- Modo offline sem degradação de UX

---

## 5. Sincronização Backend

### 5.1 Endpoints mobile-específicos
```
POST /api/mobile/sync                → sincronização bidirecional
GET  /api/mobile/familias/{acs_id}  → famílias da microárea
GET  /api/mobile/busca-ativa/{acs_id} → lista do dia
POST /api/mobile/visita              → registrar visita
POST /api/mobile/encaminhamento      → registrar encaminhamento
GET  /api/mobile/alertas/{acs_id}   → alertas push
```

### 5.2 Estratégia de sincronização
```
Ao abrir o app:   baixa lista atualizada de famílias e busca ativa
Durante uso:      salva tudo localmente (SQLite)
Ao fechar ou ter sinal: envia registros pendentes
Frequência background sync: a cada 15 minutos (quando há sinal)
```

---

## 6. Notificações Push

| Notificação | Gatilho |
|---|---|
| "X gestantes sem visita esta semana" | Toda segunda-feira |
| "Campanha de vacinação: X crianças pendentes" | Antes da campanha |
| "Nova família cadastrada em sua microárea" | Imediato |
| "Reunião de equipe hoje às 8h" | Dia da reunião |
| "Meta de visitas: você está em X% da meta mensal" | 20º dia do mês |

---

## 7. Regras de Negócio

- RN-024-01: ACS visualiza apenas as famílias da sua microárea
- RN-024-02: Visita registrada offline tem validade de 72h para sincronização
- RN-024-03: Fotos são comprimidas antes do upload (máx. 500KB por foto)
- RN-024-04: GPS é registrado automaticamente na visita (se autorizado)
- RN-024-05: App requer Android 8.0+ ou iOS 13+
- RN-024-06: Dados locais são criptografados no dispositivo (expo-secure-store)

---

## 8. Critérios de Aceite

- [ ] App instalável no Android via APK (beta) e iOS via TestFlight
- [ ] Registro de visita funcional offline
- [ ] Sincronização automática ao reconectar
- [ ] Busca ativa exibindo lista correta por ACS
- [ ] Push notifications recebidas em segundo plano
- [ ] Teste em dispositivo Android básico (Motorola G, Samsung A)

---

**Documento:** ERSUS-DOC-024
**Versão:** 1.0 · Julho/2026
**Anterior:** ERSUS-DOC-023 — IA Gestora Avançada
**Próximo:** ERSUS-DOC-025 — Portal do Gestor e Portal do Cidadão
