# Saneamento e SPCI — Gestão de Demandas

Sistema web para registro e acompanhamento de demandas de manutenção, com banco de dados Supabase (online) e cache offline via IndexedDB.

---

## Estrutura de Arquivos

```
spci/
├── index.html          ← Página principal
├── css/
│   └── styles.css      ← Estilos globais
├── js/
│   ├── config.js       ← ⚠️ SUAS credenciais Supabase (editar)
│   ├── db.js           ← Camada de dados (Supabase + IndexedDB)
│   ├── auth.js         ← Autenticação e login
│   └── app.js          ← Lógica principal da aplicação
├── supabase_setup.sql  ← Script SQL para criar tabelas no Supabase
└── README.md           ← Este arquivo
```

---

## Passo 1 — Criar projeto no Supabase

1. Acesse **https://supabase.com** e faça login (ou crie conta gratuita)
2. Clique em **New project**
3. Dê um nome (ex: `spci-saneamento`), escolha uma região próxima (ex: São Paulo) e defina uma senha de banco
4. Aguarde o projeto ser criado (~2 minutos)

---

## Passo 2 — Criar as tabelas

1. No menu lateral do Supabase, clique em **SQL Editor**
2. Clique em **New query**
3. Copie todo o conteúdo do arquivo `supabase_setup.sql` e cole no editor
4. Clique em **Run** (ou Ctrl+Enter)
5. Você verá a mensagem `Success. No rows returned`

---

## Passo 3 — Obter as credenciais

1. No menu lateral, clique em **Settings** → **API**
2. Copie:
   - **Project URL** (ex: `https://abcdefgh.supabase.co`)
   - **anon public** key (a chave longa que começa com `eyJ...`)

---

## Passo 4 — Configurar o arquivo config.js

Abra o arquivo `js/config.js` e substitua os valores:

```js
const SUPABASE_URL  = 'https://SEU_PROJECT_ID.supabase.co';
const SUPABASE_ANON = 'SUA_ANON_PUBLIC_KEY';
```

Exemplo preenchido:
```js
const SUPABASE_URL  = 'https://xyzabcde.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## Passo 5 — Publicar no GitHub Pages

### 5a. Criar repositório no GitHub

1. Acesse **https://github.com** e faça login
2. Clique em **New repository**
3. Nome sugerido: `spci-saneamento`
4. Deixe como **Public** (necessário para GitHub Pages gratuito)
5. Clique em **Create repository**

### 5b. Fazer upload dos arquivos

**Opção A — Interface web (mais simples):**
1. Na página do repositório, clique em **uploading an existing file**
2. Arraste a pasta `spci/` inteira (ou os arquivos individualmente mantendo a estrutura)
3. Clique em **Commit changes**

**Opção B — Git (recomendado):**
```bash
cd spci
git init
git add .
git commit -m "Initial commit - SPCI Saneamento"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/spci-saneamento.git
git push -u origin main
```

### 5c. Ativar GitHub Pages

1. No repositório, clique em **Settings**
2. Role até a seção **Pages** no menu lateral
3. Em **Source**, selecione **Deploy from a branch**
4. Em **Branch**, selecione `main` e pasta `/ (root)`
5. Clique em **Save**
6. Aguarde ~2 minutos e acesse: `https://SEU_USUARIO.github.io/spci-saneamento`

---

## Senhas Padrão

| Perfil        | Senha padrão  |
|---------------|---------------|
| Planejamento  | `plan@2024`   |
| Manutenção    | `manu@2024`   |

As senhas podem ser alteradas pelo menu **Entrar → Alterar Senha** após o login.

> ⚠️ As senhas são armazenadas localmente no navegador (IndexedDB). Cada dispositivo tem suas próprias senhas. Para senhas compartilhadas entre dispositivos, considere migrar a autenticação para o Supabase Auth.

---

## Funcionamento Offline

- Quando sem internet, as demandas são salvas no IndexedDB do navegador
- Um badge laranja indica quantas operações estão pendentes
- Ao reconectar, a fila é sincronizada automaticamente com o Supabase

---

## Perfis de Acesso

| Funcionalidade                         | Público | Planejamento | Manutenção |
|----------------------------------------|:-------:|:------------:|:----------:|
| Visualizar demandas                    | ✓       | ✓            | ✓          |
| Criar nova demanda                     | ✓       | ✓            | ✓          |
| Duplicar demanda                       | ✓       | ✓            | ✓          |
| Aceitar e editar (todos os campos)     | —       | ✓            | —          |
| Aceitar (equipe/prioridade/técnico)    | —       | —            | ✓          |
| Adicionar comentário de planejamento   | —       | ✓            | —          |
| Lançar análise e resolução + Nº OM     | —       | —            | ✓          |
| Excluir demanda                        | —       | ✓            | —          |
| Exportar Excel                         | ✓       | ✓            | ✓          |

---

## Tecnologias Utilizadas

- **HTML5 / CSS3 / JavaScript** — sem frameworks
- **Supabase** — banco de dados PostgreSQL na nuvem (REST API)
- **IndexedDB** — cache offline no navegador
- **SheetJS (xlsx)** — exportação para Excel
- **GitHub Pages** — hospedagem estática gratuita
- **IBM Plex Sans / Mono** — tipografia (Google Fonts)
