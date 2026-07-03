# ANÁLISE DETALHADA — MANUT_SPCI

## 📋 Estrutura do Projeto
- **index.html**: Arquivo principal com toda a estrutura
- **css/styles.css**: Estilos principais do sistema
- **css/CSS_CheckBos01.css**: Estilos de componente customizado (não utilizado atualmente)
- **js/config.js**: Configuração do Supabase
- **js/db.js**: Camada de dados (Supabase + IndexedDB)
- **js/auth.js**: Sistema de autenticação
- **js/app.js**: Lógica principal da aplicação
- **js/CheckBox01.js**: Plugin jQuery (não utilizado atualmente)

---

## 🎨 ANÁLISE DO INDEX.HTML

### 1. **HEADER - Topbar (Linhas 16-39)**
Barra de navegação superior fixa com logo e menu.

```
┌─────────────────────────────────────────────────────────────┐
│  [LOGO] Saneamento e SPCI    [Demandas] [Entrar]  [Offline] │
└─────────────────────────────────────────────────────────────┘
```

**Elemento**: `<header class="topbar">` (linha 16)
- **Classe CSS**: `.topbar` (styles.css linha 23)
- **Propósito**: Container principal da barra superior
- **Propriedades CSS**:
  - `position: sticky; top: 0; z-index: 100` → Fica fixa no topo
  - `background: var(--bg2)` → Cor de fundo escura
  - `height: 56px` → Altura padrão

**Sub-elementos**:

#### 1.1 Logo da Marca (Linhas 17-23)
```html
<div class="topbar-brand">
  <svg viewBox="0 0 28 28" fill="none">...</svg>
  <span>Saneamento e SPCI</span>
</div>
```
- **Classe**: `.topbar-brand` (styles.css linha 24)
- **Referência JS**: Apenas exibição, sem lógica específica
- **Propósito**: Identificação visual da aplicação

#### 1.2 Navegação (Linhas 24-33)
```html
<nav class="topbar-nav">
  <button class="nav-btn active" onclick="showPage('demandas')" id="nav-demandas">
  <button class="nav-btn" onclick="showPage('login')" id="nav-login">
</nav>
```
- **Classe**: `.nav-btn` (styles.css linha 27)
- **Eventos**:
  - `onclick="showPage('demandas')"` → Função em app.js (linha 624-632)
  - `onclick="showPage('login')"` → Mostra página de login
- **Referência CSS**: `.nav-btn.active` (linha 29) aplica cor azul quando ativo

#### 1.3 Badge de Status Offline (Linhas 34-38)
```html
<div class="offline-badge" id="offline-badge">
  <span class="pending-dot"></span> Offline — <span id="pending-count">0</span> pendente(s)
</div>
```
- **ID**: `offline-badge` (referenciado em db.js linhas 191-194)
- **Classe**: `.offline-badge` (styles.css linha 31)
- **Propósito**: Mostra quando offline + quantidade de operações pendentes
- **Referência JS**: db.js `atualizarBadgeOffline()` função (linha 189)

---

### 2. **CONTAINER DE TOASTS (Linha 41)**
```html
<div class="toast-container" id="toasts"></div>
```
- **ID**: `toasts` (referenciado em app.js `toast()` função linha 638-645)
- **Classe**: `.toast-container` (styles.css linha 149)
- **Propósito**: Container para notificações pop-up
- **Referência JS**: 
  - Criado dinamicamente por `toast()` em app.js
  - Estilos: `.toast`, `.toast.show`, `.toast.success`, `.toast.error`, `.toast.info`

---

### 3. **PÁGINA DEMANDAS (Linhas 46-143)**

#### 3.1 Page Container
```html
<div class="page active" id="page-demandas">
```
- **Classe**: `.page` (styles.css linha 36)
- **ID**: `page-demandas` (referenciado por `showPage()` em app.js)
- **Propósito**: Container da página principal

#### 3.2 Page Header (Linhas 47-69)
```html
<div class="page-header">
  <h1>Demandas de Manutenção</h1>
  <div class="page-header-actions">
    <button id="btn-toggle-filtros" class="btn btn-secondary btn-sm">
    <button class="btn btn-secondary btn-sm" onclick="exportExcel()">
    <button class="btn btn-primary" onclick="openNovaDemanda(null)">
```

**Botão de Filtros** (Linhas 53-59):
- **ID**: `btn-toggle-filtros`
- **Classe**: `.btn .btn-secondary .btn-sm` (styles.css linhas 70-75)
- **Evento**: Referenciado em app.js para toggle de visibilidade
- **Referência**: `aria-expanded="false"` → Estados de acessibilidade
- **Propósito**: Mostrar/ocultar seção de filtros

**Botão Exportar Excel** (Linhas 60-63):
- **Evento**: `onclick="exportExcel()"`
- **Referência JS**: Função em app.js (deve estar implementada)
- **Dependência**: `<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>` (linha 9)

**Botão Nova Demanda** (Linhas 64-67):
- **Evento**: `onclick="openNovaDemanda(null)"`
- **Referência JS**: Função em app.js (linha ~500)
- **Classe**: `.btn-primary` (styles.css linha 71)

#### 3.3 Stats Grid (Linha 71)
```html
<div class="stats-grid" id="stats-grid"></div>
```
- **ID**: `stats-grid`
- **Classe**: `.stats-grid` (styles.css linha 45)
- **Propósito**: Grid responsivo com estatísticas
- **Referência JS**: Preenchido dinamicamente por `renderStats()` em app.js

**Exemplo de conteúdo CSS**:
```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.stat-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  padding: 16px;
}
.stat-value { font-size: 26px; font-weight: 600; }
```

#### 3.4 Card de Filtros (Linhas 73-126)
```html
<div class="card" id="filtros-card">
  <div class="filter-bar">
    <div class="search-box">
    <input type="date" id="f-data-ini" onchange="aplicarFiltros()">
    <select class="form-control" id="f-site" onchange="aplicarFiltros()">
    <select class="form-control" id="f-local" onchange="aplicarFiltros()">
    <select class="form-control" id="f-situacao" onchange="aplicarFiltros()">
    <select class="form-control" id="f-prioridade" onchange="aplicarFiltros()">
    <div class="multi-select" id="f-status">
    <select class="form-control" id="f-equipe" onchange="aplicarFiltros()">
    <select class="form-control" id="f-solicitante" onchange="aplicarFiltros()">
    <button class="btn btn-secondary btn-sm" onclick="limparFiltros()">
```

**Classe Card**: `.card` (styles.css linha 41)
- **Propósito**: Estilo padronizado de container

**Search Box** (Linhas 75-78):
- **ID**: `f-busca`
- **Evento**: `oninput="aplicarFiltros()"`
- **Classe**: `.search-box` (styles.css linha 95)
- **Propósito**: Busca por ID, TAG, local, OM

**Filtros por Data** (Linhas 79-80):
- **IDs**: `f-data-ini`, `f-data-fim`
- **Evento**: `onchange="aplicarFiltros()"`
- **Propósito**: Filtrar por intervalo de datas

**Filtro Situação** (Linhas 83-89):
- **ID**: `f-situacao`
- **Valores**: "Crítico", "Prioritário", "Moderado", "Leve"
- **Referência JS**: Mapeado para valores de banco de dados

**Filtro Prioridade** (Linhas 90-93):
- **ID**: `f-prioridade`
- **Valores**: P0 a P5
- **Classe**: `.prio-p0` até `.prio-p5` (styles.css linhas 63-67)

**Multi-Select Status** (Linhas 101-112):
- **ID**: `f-status`
- **Classe**: `.multi-select` (styles.css linha 172)
- **Função de Toggle**: `toggleMultiSelect('f-status')` em app.js (linha 660)
- **Valores Selecionáveis**: Aberta, Em Análise, Em Andamento, Concluída
- **CSS Especial**: 
  ```css
  .multi-select-dropdown { display: none; }
  .multi-select.open .multi-select-dropdown { display: block; }
  ```
- **Propósito**: Seleção múltipla de status

#### 3.5 Tabela de Demandas (Linhas 128-143)
```html
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>ID</th><th>Data</th><th>Site</th><th>Local</th><th>TAG</th>
        <th>Situação</th><th>Status</th><th>Prioridade</th><th>Equipe</th><th>Solicitante</th><th>Ações</th>
      </tr>
    </thead>
    <tbody id="demandas-tbody"></tbody>
  </table>
</div>
<div id="empty-demandas" class="empty-state" style="display:none">
```

**Classe Table Wrapper**: `.table-wrap` (styles.css linha 100)
- **CSS**: 
  ```css
  overflow-x: auto;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  ```

**Tbody ID**: `demandas-tbody`
- **Preenchido por**: `renderDemandasTable()` em app.js
- **Padrão de linha**: `<tr onclick="openDetalhes(${d.id})">` para cada demanda

**Empty State** (Linha 139-142):
- **ID**: `empty-demandas`
- **Classe**: `.empty-state` (styles.css linha 159)
- **Propósito**: Mensagem quando não há demandas

---

### 4. **PÁGINA LOGIN (Linhas 146-173)**

```html
<div class="page" id="page-login">
  <div class="card">
    <div class="login-tabs">
      <button class="login-tab active" id="tab-plan" onclick="switchLoginTab('planejamento')">
      <button class="login-tab" id="tab-man" onclick="switchLoginTab('manutencao')">
    </div>
    <div id="login-form-area"></div>
    <div id="logado-area" style="display:none">
```

**Classe Login Tab**: `.login-tab` (styles.css linha 145)
- **Estados**: `.active` para destacar aba ativa
- **Eventos**: 
  - `onclick="switchLoginTab('planejamento')"` → auth.js (linha 66)
  - `onclick="switchLoginTab('manutencao')"` → auth.js (linha 66)

**Login Form Area** (Linha 162):
- **ID**: `login-form-area`
- **Preenchido por**: `renderLoginForm()` em auth.js (linha 73)
- **Conteúdo Dinâmico**: 
  ```html
  <input type="password" class="form-control" id="login-pwd">
  <button class="btn btn-primary" onclick="doLogin()">
  ```

**Logado Area** (Linhas 163-169):
- **ID**: `logado-area`
- **Visibilidade**: Controlada por `updateAuthUI()` em auth.js (linha 42)
- **Conteúdo**: 
  - Status de conexão
  - Botão de Sair: `onclick="fazerLogout()"` (auth.js linha 34)
  - Botão Alterar Senha: `onclick="openChangePassword()"` (auth.js linha 101)

---

### 5. **MODALS (Linhas 178-246)**

#### 5.1 Modal Overlay Base
```html
<div class="modal-overlay" id="modal-*">
  <div class="modal">
```
- **Classe**: `.modal-overlay` (styles.css linha 109)
- **CSS de Abertura**: `.modal-overlay.open` (opacity: 1, pointer-events: all)
- **Funções**: `openModal(id)` (app.js 584) e `closeModal(id)` (app.js 585)

#### 5.2 Modal Nova/Duplicar Demanda
- **ID**: `modal-nova`
- **Classe**: `.modal-lg` (max-width: 880px)
- **Título ID**: `nova-titulo`
- **Body ID**: `nova-body`
- **Propósito**: Criar ou duplicar uma demanda
- **Função de Abertura**: `openNovaDemanda(null)` em app.js

#### 5.3 Modal Detalhe
- **ID**: `modal-detalhe`
- **Título ID**: `detalhe-titulo`
- **Data ID**: `detalhe-data`
- **Content ID**: `detalhe-content`
- **Propósito**: Visualizar detalhes de uma demanda
- **Função de Abertura**: `openDetalhes(id)` em app.js

#### 5.4 Modal Aceite
- **ID**: `modal-aceite`
- **Título ID**: `aceite-titulo`
- **Content ID**: `aceite-content`
- **Propósito**: Aceitar uma demanda para análise
- **Função de Abertura**: Chamada quando status muda para "Em Análise"

#### 5.5 Modal Análise e Resolução
- **ID**: `modal-analise`
- **Content ID**: `analise-content`
- **Propósito**: Inserir análise técnica e resolução
- **Função de Abertura**: `openAnalise(id)` em app.js

#### 5.6 Modal Alterar Senha
- **ID**: `modal-senha`
- **Content ID**: `senha-content`
- **Propósito**: Formulário de alteração de senha
- **Função de Abertura**: `openChangePassword()` em auth.js (linha 101)

---

## 🎨 ANÁLISE DO CSS/STYLES.CSS

### **1. Root Variables (Linhas 5-18)**
Define sistema de cores e tipografia global.

```css
:root {
  --bg: #0D1117;           /* Fundo principal muito escuro */
  --bg2: #161B22;          /* Fundo secundário (cards) */
  --bg3: #21262D;          /* Fundo terciário (inputs) */
  --bg4: #30363D;          /* Fundo quaternário (hover) */
  
  --border: #30363D;       /* Cor de borda principal */
  --border2: #484F58;      /* Cor de borda hover */
  
  --text: #E6EDF3;         /* Texto principal */
  --text2: #8B949E;        /* Texto secundário */
  --text3: #6E7681;        /* Texto terciário */
  
  /* Cores semânticas */
  --blue: #58A6FF;
  --green: #3FB950;
  --yellow: #D29922;
  --orange: #F0883E;
  --red: #F85149;
  --purple: #BC8CFF;
  
  /* Backgrounds associados */
  --blue-bg: #0D2D6B;
  --green-bg: #0D3320;
  /* ... mais colors ... */
  
  --radius: 8px;           /* Border radius padrão */
  --radius-lg: 12px;       /* Border radius maior */
  --font: 'IBM Plex Sans';
  --mono: 'IBM Plex Mono';
  --shadow: 0 1px 3px rgba(0,0,0,.4);
}
```

**Uso no HTML**:
- Todos os elementos usam `var(--bg)`, `var(--text)`, etc.
- Exemplo: `background: var(--bg2)` no `.card`

---

### **2. TOPBAR Styles (Linhas 23-32)**

```css
.topbar {
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 100;
}
```

**Elementos referenciados**:
- `.topbar-brand` (linha 24): Logo e texto
- `.topbar-nav` (linha 26): Container de botões de navegação
- `.nav-btn` (linha 27): Botões individuais
  - Hover: muda fundo para `var(--bg3)`
  - Active: muda cor do texto para `var(--blue)` e background

---

### **3. BADGES (Linhas 51-60)**

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.badge-red { background: var(--red-bg); color: var(--red); }
.badge-orange { ... }
.badge-green { ... }
/* etc */

.badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
```

**Uso HTML**:
```html
<span class="badge badge-red">● Crítico</span>
<span class="badge badge-green">● Concluída</span>
```

---

### **4. PRIORITY BADGES (Linhas 62-67)**

```css
.prio-p0 { background: #2D0A0A; color: #FF6B6B; }
.prio-p1 { background: var(--red-bg); color: var(--red); }
.prio-p2 { background: var(--orange-bg); color: var(--orange); }
.prio-p3 { background: var(--yellow-bg); color: var(--yellow); }
.prio-pn { background: var(--bg4); color: var(--text2); }
```

**Uso HTML** (gerado dinamicamente em app.js):
```html
<span class="prio-p0">P0</span>
<span class="prio-p1">P1</span>
```

---

### **5. BUTTONS (Linhas 69-77)**

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius);
  font-family: var(--font);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all .15s;
}

.btn-primary { background: var(--blue-light); color: #fff; }
.btn-primary:hover { background: #1A80FF; }

.btn-secondary { background: var(--bg3); color: var(--text); border: 1px solid var(--border); }
.btn-secondary:hover { border-color: var(--border2); background: var(--bg4); }

.btn-danger { background: var(--red-bg); color: var(--red); }
.btn-success { background: var(--green-bg); color: var(--green); }

.btn-sm { padding: 5px 10px; font-size: 12px; }
.btn-icon { width: 32px; height: 32px; padding: 0; }
```

**Uso HTML**:
```html
<button class="btn btn-primary">Salvar</button>
<button class="btn btn-secondary btn-sm">Cancelar</button>
<button class="btn btn-danger">Excluir</button>
```

---

### **6. FORMS (Linhas 79-88)**

```css
.form-control {
  width: 100%;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  padding: 9px 12px;
  font-family: var(--font);
  font-size: 14px;
  transition: border-color .15s;
}

.form-control:focus {
  border-color: var(--blue-light);
  box-shadow: 0 0 0 3px rgba(31,111,235,.15);
}

textarea.form-control { resize: vertical; min-height: 80px; }
select.form-control { background-image: url(...); /* dropdown arrow */ }
```

**Uso HTML**:
```html
<input type="text" class="form-control" placeholder="Nome">
<textarea class="form-control"></textarea>
<select class="form-control"><option>...</option></select>
```

---

### **7. MULTI-SELECT (Linhas 172-279)**

```css
.multi-select {
  position: relative;
  display: inline-flex;
}

.multi-select-trigger {
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 36px;
  padding: 0 32px 0 10px;
  background: var(--bg3);
  border: 1px solid var(--border);
  cursor: pointer;
}

.multi-select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  display: none;
  background: var(--bg3);
  border: 1px solid var(--border);
  padding: 8px;
}

.multi-select.open .multi-select-dropdown { display: block; }

.multi-select-option {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
}

.multi-select-option:hover { background: var(--bg4); }
```

**Uso HTML** (em index.html linhas 101-112):
```html
<div class="multi-select" id="f-status">
  <button class="multi-select-trigger" onclick="toggleMultiSelect('f-status')">
    <span class="multi-select-label">Status</span>
    <svg class="icon">...</svg>
  </button>
  <div class="multi-select-dropdown">
    <label class="multi-select-option">
      <input type="checkbox" value="Aberta">
      Aberta
    </label>
    <!-- mais opções -->
  </div>
</div>
```

**Funções JavaScript** (app.js):
- `toggleMultiSelect(id)` (linha 660) → Adiciona/remove classe `.open`
- `getMultiSelectValues(id)` (linha 671) → Pega valores selecionados

---

### **8. TABLE (Linhas 99-106)**

```css
.table-wrap {
  overflow-x: auto;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

th {
  background: var(--bg3);
  color: var(--text2);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

tbody tr:hover td { background: var(--bg3); cursor: pointer; }
```

---

### **9. MODALS (Linhas 108-116)**

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.75);
  z-index: 200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity .2s;
}

.modal-overlay.open {
  opacity: 1;
  pointer-events: all;
}

.modal {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 700px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,.5);
}

.modal-lg { max-width: 880px; }
```

**Funções JavaScript** (app.js):
- `openModal(id)` (linha 584) → Adiciona classe `.open`
- `closeModal(id)` (linha 585) → Remove classe `.open`

---

### **10. COLLAPSIBLE (Linhas 282-308)**

```css
.collapsible {
  overflow: hidden;
  max-height: 1000px;
  transition: max-height .28s ease, opacity .2s ease;
  opacity: 1;
}

.collapsible.collapsed {
  max-height: 0;
  opacity: 0;
}

.card.collapsible {
  overflow: hidden;
  transition: max-height .28s ease, opacity .2s ease;
  max-height: 1200px;
}

.card.collapsible.collapsed {
  max-height: 0;
  opacity: 0;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  pointer-events: none;
}
```

**Uso** (Card de filtros pode ser colapsado):
- Adicionando classe `.collapsed` anima o colapso

---

### **11. RESPONSIVE (Linhas 310-333)**

```css
@media(max-width:768px) {
  .form-row, .detail-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  main { padding: 16px; }
  .topbar-nav .nav-btn span { display: none; } /* Esconde texto */
  .filter-bar .form-control { width: 100%; }
  table { min-width: 700px; }
}

@media(max-width:480px) {
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .page-header { flex-direction: column; }
  .filter-bar { flex-direction: column; }
}
```

---

## 🔧 ANÁLISE DO JS/CONFIG.JS

```javascript
const SUPABASE_URL = 'https://llnecvfzboqqgspvbibg.supabase.co'
const SUPABASE_ANON = 'sb_publishable_b8LkKFq6_pKoMsPbXzguoA_VAbpZIT4'

window.SUPABASE_URL = SUPABASE_URL
window.SUPABASE_ANON = SUPABASE_ANON
```

**Função**: Define credenciais globais para Supabase
**Referência**: Usado em db.js linhas 35, 42, 50, 60 (`window.SUPABASE_URL`, `window.SUPABASE_ANON`)

---

## 🔧 ANÁLISE DO JS/DB.JS

### **1. IndexedDB Setup (Linhas 10-29)**

```javascript
const IDB_NAME = 'spci_cache', IDB_VERSION = 1;
let idb;

function openIDB() {
  // Cria object stores: 'demandas', 'queue', 'config'
}
```

**Propósito**: Cache local para funcionamento offline
**Lojas**:
- `demandas`: Armazena registros de demandas (keyPath: 'id')
- `queue`: Fila de operações pendentes (keyPath: 'qid')
- `config`: Configurações como senhas (keyPath: 'key')

---

### **2. IndexedDB Helpers (Linhas 26-29)**

```javascript
const idbAll    = s => new Promise(...)  /* Pega todos registros */
const idbPut    = (s,o) => new Promise(...)  /* Salva/atualiza */
const idbDelete = (s,k) => new Promise(...)  /* Deleta */
const idbGet    = (s,k) => new Promise(...)  /* Pega um registro */
```

---

### **3. Supabase Helpers (Linhas 32-65)**

```javascript
function sbHeaders() {
  // Retorna headers com apikey e token Bearer
}

async function sbSelect(table, params = '')
async function sbUpsert(table, row)
async function sbDelete(table, id)
```

**Referência**: Usados em `dbCarregarDemandas()`, `dbSalvarDemanda()`, `dbExcluirDemanda()`

---

### **4. Mapeamento de Dados (Linhas 68-116)**

```javascript
function toDb(d) {
  // Converte camelCase JS → snake_case DB
  return {
    id: d.id,
    data: d.data,
    data_hora: d.dataHora,
    site: d.site,
    // ... mais campos
  };
}

function fromDb(r) {
  // Converte snake_case DB → camelCase JS
}
```

**Propósito**: Manter compatibilidade entre JS e banco de dados

**Campos mapeados**:
- `dataHora` ↔ `data_hora`
- `comentarioPlan` ↔ `comentario_plan`
- `dataAceite` ↔ `data_aceite`
- `dataConclusao` ↔ `data_conclusao`

---

### **5. API Pública (Linhas 121-187)**

```javascript
async function dbCarregarDemandas()
  // Online: busca Supabase + atualiza cache
  // Offline: retorna cache

async function dbSalvarDemanda(demanda)
  // Sempre salva no cache
  // Online: envia ao Supabase
  // Offline: enfileira na 'queue'

async function dbExcluirDemanda(id)
  // Similar a dbSalvarDemanda

async function dbGetConfig(key) / dbSetConfig(key, value)
  // Somente IndexedDB (local)

async function sincronizarFila()
  // Processa fila quando volta online
```

---

### **6. Badge Offline (Linhas 189-195)**

```javascript
async function atualizarBadgeOffline() {
  const fila = await idbAll('queue');
  const badge = document.getElementById('offline-badge');
  const cnt = document.getElementById('pending-count');
  
  if (fila.length > 0) {
    badge.classList.add('show');
    cnt.textContent = fila.length;
  } else {
    badge.classList.remove('show');
  }
}
```

**Referência HTML**: 
- `#offline-badge` (index.html linha 35)
- `#pending-count` (index.html linha 36)

---

### **7. Event Listeners (Linhas 197-198)**

```javascript
window.addEventListener('online',  () => {
  toast('Conexão restaurada. Sincronizando…', 'info');
  sincronizarFila();
});

window.addEventListener('offline', () => {
  toast('Sem conexão. Dados salvos localmente.', 'info');
  atualizarBadgeOffline();
});
```

**Propósito**: Sincroniza dados automaticamente quando volta online

---

## 🔐 ANÁLISE DO JS/AUTH.JS

### **1. Variáveis Globais (Linhas 5-6)**

```javascript
let currentUser = null;
const DEFAULT_PASSWORDS = {
  planejamento: 'plan@2024',
  manutencao: 'manu@2024'
};
```

---

### **2. Inicialização (Linhas 8-12)**

```javascript
async function initAuth() {
  const saved = localStorage.getItem('spci_user');
  if (saved) currentUser = JSON.parse(saved);
  updateAuthUI();
}
```

**Propósito**: Restaura sessão do usuário ao carregar página

---

### **3. Gerenciamento de Senhas (Linhas 14-21)**

```javascript
async function getPassword(role) {
  // Tenta buscar do banco
  // Volta ao padrão se não encontrar
}

async function setPassword(role, pwd) {
  // Salva senha no IndexedDB
}
```

**Referência DB**: Usa `dbGetConfig()` e `dbSetConfig()` de db.js

---

### **4. Login (Linhas 23-40)**

```javascript
async function login(role, pwd) {
  const real = await getPassword(role);
  if (pwd === real) {
    currentUser = { role, name: ... };
    localStorage.setItem('spci_user', JSON.stringify(currentUser));
    updateAuthUI();
    return true;
  }
  return false;
}

function fazerLogout() {
  currentUser = null;
  localStorage.removeItem('spci_user');
  updateAuthUI();
  toast('Sessão encerrada.', 'info');
}
```

---

### **5. UI de Autenticação (Linhas 42-84)**

```javascript
function updateAuthUI() {
  const lbl = document.getElementById('user-nav-label');
  // HTML: <span id="user-nav-label">Entrar</span> (index.html linha 31)
  
  if (currentUser) lbl.textContent = currentUser.name;
  else lbl.textContent = 'Entrar';

  const logArea  = document.getElementById('logado-area');
  // HTML: <div id="logado-area"> (index.html linha 163)
  
  const formArea = document.getElementById('login-form-area');
  // HTML: <div id="login-form-area"> (index.html linha 162)
  
  if (currentUser) {
    logArea.style.display  = 'block';
    formArea.style.display = 'none';
  } else {
    logArea.style.display  = 'none';
    formArea.style.display = 'block';
  }
  
  renderDemandasTable(); // Referência app.js
}
```

### **6. Tabs de Login (Linhas 64-71)**

```javascript
let loginTabAtivo = 'planejamento';

function switchLoginTab(role) {
  loginTabAtivo = role;
  document.getElementById('tab-plan').classList.toggle('active', role === 'planejamento');
  // HTML: <button class="login-tab active" id="tab-plan">... (index.html linha 159)
  
  document.getElementById('tab-man').classList.toggle('active', role === 'manutencao');
  // HTML: <button class="login-tab" id="tab-man">... (index.html linha 160)
  
  renderLoginForm(role);
}

function renderLoginForm(role) {
  if (currentUser) return;
  document.getElementById('login-form-area').innerHTML = `
    <div class="form-group">
      <label class="form-label">${role === 'planejamento' ? 'Equipe de Planejamento' : 'Equipe de Manutenção'}</label>
      <input type="password" class="form-control" id="login-pwd" placeholder="Senha de acesso"
             onkeydown="if(event.key==='Enter')doLogin()">
    </div>
    <button class="btn btn-primary" style="width:100%" onclick="doLogin()">
      Entrar como ${role === 'planejamento' ? 'Planejamento' : 'Manutenção'}
    </button>`;
}
```

### **7. Autenticação (Linhas 86-99)**

```javascript
async function doLogin() {
  const pwd = document.getElementById('login-pwd').value;
  // HTML: <input ... id="login-pwd"> (gerado dinamicamente)
  
  if (!pwd) {
    toast('Informe a senha', 'error');
    return;
  }
  
  const ok = await login(loginTabAtivo, pwd);
  if (ok) {
    toast('Bem-vindo, ' + currentUser.name + '!', 'success');
    // Atualiza HTML dinamicamente
  } else {
    toast('Senha incorreta.', 'error');
  }
}
```

### **8. Alteração de Senha (Linhas 101-128)**

```javascript
function openChangePassword() {
  document.getElementById('senha-content').innerHTML = `
    // HTML gerado dinamicamente (preenche #senha-content)
    // HTML: <div id="senha-content"> (index.html linha 244)
  `;
  openModal('modal-senha');
  // HTML: <div class="modal-overlay" id="modal-senha"> (index.html linha 236)
}

async function salvarSenha() {
  const atual = document.getElementById('cp-atual').value;
  const nova  = document.getElementById('cp-nova').value;
  const conf  = document.getElementById('cp-conf').value;
  
  // Validações
  const real = await getPassword(currentUser.role);
  if (atual !== real) {
    toast('Senha atual incorreta', 'error');
    return;
  }
  
  await setPassword(currentUser.role, nova);
  closeModal('modal-senha');
  toast('Senha alterada!', 'success');
}
```

---

## ⚙️ ANÁLISE DO JS/APP.JS (Principais Funções)

Este é o arquivo de lógica principal (39KB). Aqui estão as principais funções e referências:

### **1. Inicialização (Linhas 650-660)**

```javascript
async function init() {
  await openIDB();          // db.js
  await initAuth();         // auth.js
  carregarDemandas();
  setupEventListeners();
  renderStats();
}
```

### **2. Navegação de Páginas**

```javascript
function showPage(name) {
  // Alterna entre #page-demandas e #page-login
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  
  // Atualiza botões de navegação
  document.getElementById('nav-demandas').classList.toggle('active', name === 'demandas');
  document.getElementById('nav-login').classList.toggle('active', name === 'login');
}
```

**Referência HTML**:
- `#page-demandas` (index.html linha 46)
- `#page-login` (index.html linha 146)
- `#nav-demandas` (index.html linha 25)
- `#nav-login` (index.html linha 29)

### **3. Carregamento de Demandas**

```javascript
async function carregarDemandas() {
  try {
    const demandas = await dbCarregarDemandas();  // db.js
    renderDemandasTable();
    renderStats();
  } catch (err) {
    toast('Erro ao carregar demandas', 'error');
  }
}
```

### **4. Renderização da Tabela**

```javascript
function renderDemandasTable() {
  const tbody = document.getElementById('demandas-tbody');
  // HTML: <tbody id="demandas-tbody"> (index.html linha 136)
  
  demandas.forEach(d => {
    const tr = document.createElement('tr');
    tr.onclick = () => openDetalhes(d.id);
    tr.innerHTML = `
      <td>${d.id}</td>
      <td>${formatDate(d.data)}</td>
      <td>${d.site}</td>
      <td>${d.local}</td>
      <td>${d.tag}</td>
      <td><span class="badge badge-${getSituacaoBadgeColor(d.situacao)}">${d.situacao}</span></td>
      <td><span class="badge badge-${getStatusColor(d.status)}">${d.status}</span></td>
      <td><span class="prio-${getPriorityClass(d.prioridade)}">${d.prioridade || 'N/A'}</span></td>
      <td>${d.equipe}</td>
      <td>${d.solicitante}</td>
      <td>
        <button class="btn btn-icon" onclick="openDetalhes(${d.id})">...</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
```

### **5. Filtros**

```javascript
function aplicarFiltros() {
  // Pega valores dos inputs
  const busca = document.getElementById('f-busca').value;
  const dataIni = document.getElementById('f-data-ini').value;
  const dataFim = document.getElementById('f-data-fim').value;
  const site = document.getElementById('f-site').value;
  const local = document.getElementById('f-local').value;
  const situacao = document.getElementById('f-situacao').value;
  const prioridade = document.getElementById('f-prioridade').value;
  const status = getMultiSelectValues('f-status');  // Função em app.js linha 671
  const equipe = document.getElementById('f-equipe').value;
  const solicitante = document.getElementById('f-solicitante').value;
  
  // Filtra demandas localmente
  filtradas = demandas.filter(d => {
    // Lógica de filtro
  });
  
  renderDemandasTable();
}

function limparFiltros() {
  // Reseta todos os inputs
  document.getElementById('f-busca').value = '';
  document.getElementById('f-data-ini').value = '';
  // ... mais resets
  aplicarFiltros();
}
```

### **6. Multi-Select**

```javascript
function toggleMultiSelect(id) {
  const container = document.getElementById(id);
  container.classList.toggle('open');
}

function getMultiSelectValues(id) {
  const container = document.getElementById(id);
  const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}
```

### **7. Criar Nova Demanda**

```javascript
function openNovaDemanda(demandaParaDuplicar) {
  const titulo = document.getElementById('nova-titulo');
  // HTML: <h2 class="modal-title" id="nova-titulo"> (index.html linha 184)
  
  titulo.textContent = demandaParaDuplicar ? 'Duplicar Demanda' : 'Nova Demanda';
  
  const body = document.getElementById('nova-body');
  // HTML: <div id="nova-body"> (index.html linha 189)
  
  body.innerHTML = `
    <div class="form-group">
      <label class="form-label">Data</label>
      <input type="date" class="form-control" id="nova-data">
    </div>
    <div class="form-group">
      <label class="form-label">Site</label>
      <select class="form-control" id="nova-site">...</select>
    </div>
    <!-- ... mais campos ... -->
    <div class="form-group">
      <label class="form-label">Foto (opcional)</label>
      <div class="photo-upload" onclick="document.getElementById('nova-foto').click()">
        <input type="file" id="nova-foto" accept="image/*">
        <p>Clique para selecionar</p>
        <img class="photo-preview-img" id="foto-preview">
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">
      <button class="btn btn-secondary" onclick="closeModal('modal-nova')">Cancelar</button>
      <button class="btn btn-primary" onclick="submitNovaDemanda()">Salvar</button>
    </div>
  `;
  
  openModal('modal-nova');  // Mostra modal
}

async function submitNovaDemanda() {
  const data = document.getElementById('nova-data').value;
  const site = document.getElementById('nova-site').value;
  // ... mais campos ...
  
  if (!site || !local || !tag) {
    toast('Preencha todos os campos obrigatórios.', 'error');
    return;
  }
  
  const demanda = {
    id: generateId(),
    data, site, local, tag, // ... mais campos
    status: 'Aberta',
    dataHora: new Date().toISOString()
  };
  
  await dbSalvarDemanda(demanda);  // db.js
  toast('Demanda criada!', 'success');
  closeModal('modal-nova');
  carregarDemandas();
}
```

### **8. Detalhes da Demanda**

```javascript
function openDetalhes(id) {
  const demanda = demandas.find(d => d.id === id);
  if (!demanda) return;
  
  const titulo = document.getElementById('detalhe-titulo');
  titulo.textContent = 'Demanda ' + demanda.id;
  
  const content = document.getElementById('detalhe-content');
  content.innerHTML = `
    <div class="detail-grid">
      <div class="detail-field">
        <label>ID</label>
        <span>${demanda.id}</span>
      </div>
      <div class="detail-field">
        <label>Data</label>
        <span>${formatDate(demanda.data)}</span>
      </div>
      <!-- ... mais campos ... -->
    </div>
    <div class="status-flow">
      <div class="status-step">
        <div class="step-dot ${demanda.status !== 'Aberta' ? 'done' : 'active'}"></div>
        <div class="step-label">Aberta</div>
      </div>
      <!-- ... mais steps ... -->
    </div>
    <!-- Botões de ação baseados no status -->
    ${demanda.status === 'Aberta' ? `<button class="btn btn-primary" onclick="abrirAceite('${demanda.id}')">Aceitar</button>` : ''}
  `;
  
  openModal('modal-detalhe');
}
```

**Referência HTML**:
- `#detalhe-titulo` (index.html linha 198)
- `#detalhe-data` (index.html linha 199)
- `#detalhe-content` (index.html linha 205)

### **9. Exportar Excel**

```javascript
async function exportExcel() {
  const ws = XLSX.utils.json_to_sheet(demandas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Demandas');
  XLSX.writeFile(wb, 'demandas.xlsx');
}
```

**Dependência**: `<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>` (index.html linha 9)

### **10. Toast Notifications**

```javascript
function toast(msg, type = 'info') {
  const container = document.getElementById('toasts');
  // HTML: <div class="toast-container" id="toasts"> (index.html linha 41)
  
  const el = document.createElement('div');
  el.className = `toast ${type}`;  // Classes: .success, .error, .info
  el.textContent = msg;
  container.appendChild(el);
  
  el.classList.add('show');
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}
```

**Classes CSS** (styles.css linhas 149-154):
```css
.toast-container { position: fixed; top: 70px; right: 20px; }
.toast { ... transform: translateX(calc(100% + 24px)); }
.toast.show { transform: translateX(0); }
.toast.success { border-left: 3px solid var(--green); }
.toast.error { border-left: 3px solid var(--red); }
.toast.info { border-left: 3px solid var(--blue); }
```

### **11. Utilidades**

```javascript
function openModal(id)     { document.getElementById(id).classList.add('open'); }
function closeModal(id)    { document.getElementById(id).classList.remove('open'); }
function formatDate(d)     { return `${dd}/${m}/${y}`; }
function formatDateTime(dt){ return d.toLocaleDateString('pt-BR') + ' ' + ...; }
function esc(s)            { return String(s).replace(/&/g,'&amp;')...; }  // XSS prevention
```

---

## 📊 DIAGRAMA DE FLUXO

```
┌─────────────────────────────────────────────────────────────────┐
│                      INDEX.HTML                                  │
│  (Estrutura HTML + IDs para elementos dinâmicos)                 │
└─────────────────────────────────────────────────────────────────┘
                    ↓
        ┌───────────┴─────────────┐
        ↓                         ↓
  ┌─────────────┐          ┌─────────────┐
  │  CSS/STYLES │          │   JS FILES  │
  ├─────────────┤          ├─────────────┤
  │ .topbar     │          │ config.js   │
  │ .page       │  ←────→  │ db.js       │
  │ .card       │          │ auth.js     │
  │ .btn        │          │ app.js      │
  │ .modal      │          │             │
  │ .table      │          │             │
  │ .form       │          │             │
  └─────────────┘          └─────────────┘
        ↓                         ↓
   Estilo visual           Lógica + Dados
                                  ↓
                          ┌──────────────────┐
                          │  Supabase + IDB  │
                          │  (Banco de dados)│
                          └──────────────────┘
```

---

## 🔗 REFERÊNCIAS CRUZADAS RESUMIDAS

### **Elementos HTML → CSS**
- `<header class="topbar">` → `.topbar` (styles.css:23)
- `<div class="page">` → `.page` (styles.css:36)
- `<button class="btn btn-primary">` → `.btn`, `.btn-primary` (styles.css:70-71)
- `<div class="multi-select" id="f-status">` → `.multi-select` (styles.css:172)
- `<table>` → `.table-wrap`, `th`, `td` (styles.css:100-106)
- `<div class="modal-overlay">` → `.modal-overlay` (styles.css:109)

### **Elementos HTML → JS**
- `<input id="f-busca">` → app.js `aplicarFiltros()`
- `<button onclick="openNovaDemanda(null)">` → app.js `openNovaDemanda()`
- `<div id="demandas-tbody">` → app.js `renderDemandasTable()`
- `<div id="offline-badge">` → db.js `atualizarBadgeOffline()`
- `<span id="user-nav-label">` → auth.js `updateAuthUI()`
- `<div id="toasts">` → app.js `toast()`

### **JS → CSS**
- app.js `openModal()` → `.modal-overlay.open`
- app.js `toggleMultiSelect()` → `.multi-select.open`
- auth.js `updateAuthUI()` → `.active`, display properties
- db.js `atualizarBadgeOffline()` → `.offline-badge.show`

---

Este documento cobre toda a estrutura, componentes, estilos e funcionalidades principais do projeto **MANUT_SPCI**.
