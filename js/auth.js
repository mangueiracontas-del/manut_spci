// ============================================================
// SANEAMENTO E SPCI — Autenticação
// ============================================================

let currentUser = null;

async function initAuth() {
  const saved = localStorage.getItem('spci_user');
  if (saved) {
    currentUser = JSON.parse(saved);
  }
  updateAuthUI();
}

// ---- Login por nome de usuário e senha ----
async function login(nome, senha) {
  const usuario = await dbBuscarUsuarioPorNome(nome);
  if (!usuario) return false;
  if (usuario.senha !== senha) return false;

  currentUser = {
    id: usuario.id,
    nome: usuario.nome,
    role: usuario.role, // 'admin', 'planejamento', 'manutencao'
    tipo: usuario.tipo  // 'admin' ou 'normal'
  };
  localStorage.setItem('spci_user', JSON.stringify(currentUser));
  updateAuthUI();
  return true;
}

function fazerLogout() {
  currentUser = null;
  localStorage.removeItem('spci_user');
  updateAuthUI();
  showPage('login');
  toast('Sessão encerrada.', 'info');
}

function updateAuthUI() {
  const lbl = document.getElementById('user-nav-label');
  if (currentUser) {
    lbl.textContent = currentUser.nome;
  } else {
    lbl.textContent = 'Entrar';
  }

  const logArea  = document.getElementById('logado-area');
  const formArea = document.getElementById('login-form-area');

  if (logArea) {
    if (currentUser) {
      logArea.style.display  = 'block';
      if (formArea) formArea.style.display = 'none';
      const nm = document.getElementById('logado-nome');
      if (nm) nm.textContent = currentUser.nome + ' (' + currentUser.role + ')';
    } else {
      logArea.style.display  = 'none';
      if (formArea) {
        formArea.style.display = 'block';
        renderLoginForm(); // Re-renderiza o form caso tenha sido limpo
      }
    }
  }

  // Atualizar visibilidade dos botões de navegação baseado na role
  updateNavVisibility();
  renderDemandasTable();
}

function updateNavVisibility() {
  const navSites = document.getElementById('nav-sites');
  const navLocais = document.getElementById('nav-locais');
  const navUsuarios = document.getElementById('nav-usuarios');
  const navRelatorio = document.getElementById('nav-relatorio');

  const isAdmin = currentUser && currentUser.tipo === 'admin';

  if (navSites) navSites.style.display = isAdmin ? 'flex' : 'none';
  if (navLocais) navLocais.style.display = isAdmin ? 'flex' : 'none';
  if (navUsuarios) navUsuarios.style.display = isAdmin ? 'flex' : 'none';
  if (navRelatorio) navRelatorio.style.display = isRelatorioAccess() ? 'flex' : 'none';
}

function isAdmin() {
  return currentUser && currentUser.tipo === 'admin';
}

function isPlanejamento() {
  return currentUser && (currentUser.role === 'planejamento' || currentUser.tipo === 'admin');
}

function isManutencao() {
  return currentUser && (currentUser.role === 'manutencao' || currentUser.tipo === 'admin');
}

function isRelatorioAccess() {
  return currentUser && (currentUser.role === 'manutencao' || currentUser.role === 'planejamento' || currentUser.tipo === 'admin');
}


// ---- UI de login ----
function renderLoginForm() {
  const formArea = document.getElementById('login-form-area');
  if (!formArea) return;

  formArea.innerHTML = `
    <div class="form-group">
      <label class="form-label">Nome de Usuário</label>
      <input type="text" class="form-control" id="login-nome" placeholder="Digite seu nome de usuário"
             onkeydown="if(event.key==='Enter')doLogin()">
    </div>
    <div class="form-group">
      <label class="form-label">Senha</label>
      <input type="password" class="form-control" id="login-senha" placeholder="Digite sua senha"
             onkeydown="if(event.key==='Enter')doLogin()">
    </div>
    <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="doLogin()">
      Entrar
    </button>`;
}

async function doLogin() {
  const nome = document.getElementById('login-nome').value.trim();
  const senha = document.getElementById('login-senha').value;

  if (!nome || !senha) { 
    toast('Preencha nome de usuário e senha.', 'error'); 
    return; 
  }

  const ok = await login(nome, senha);
  if (ok) {
    toast('Bem-vindo, ' + currentUser.nome + '!', 'success');
    document.getElementById('login-form-area').style.display = 'none';
    document.getElementById('logado-area').style.display = 'block';
    document.getElementById('logado-nome').textContent = currentUser.nome + ' (' + currentUser.role + ')';
    showPage('demandas');
  } else {
    toast('Nome de usuário ou senha incorretos.', 'error');
    document.getElementById('login-senha').value = '';
  }
}

// ---- Alterar senha do usuário logado ----
function openChangePassword() {
  document.getElementById('senha-content').innerHTML = `
    <div style="background:var(--bg3);border-radius:var(--radius);padding:8px 14px;margin-bottom:16px;font-size:12px;color:var(--text2)">
      Usuário: <span style="font-family:var(--mono);color:var(--text);font-weight:600">${esc(currentUser.nome)}</span>
    </div>
    <div class="form-group"><label class="form-label">Senha Atual</label>
      <input type="password" class="form-control" id="cp-atual"></div>
    <div class="form-group"><label class="form-label">Nova Senha</label>
      <input type="password" class="form-control" id="cp-nova" placeholder="Mínimo 6 caracteres"></div>
    <div class="form-group"><label class="form-label">Confirmar Nova Senha</label>
      <input type="password" class="form-control" id="cp-conf"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
      <button class="btn btn-secondary" onclick="closeModal('modal-senha')">Cancelar</button>
      <button class="btn btn-primary" onclick="salvarSenha()">Alterar</button>
    </div>`;
  openModal('modal-senha');
}

async function salvarSenha() {
  const atual = document.getElementById('cp-atual').value;
  const nova  = document.getElementById('cp-nova').value;
  const conf  = document.getElementById('cp-conf').value;

  if (!atual || !nova || !conf) { 
    toast('Preencha todos os campos', 'error'); 
    return; 
  }
  if (nova.length < 6) { 
    toast('Mínimo 6 caracteres', 'error'); 
    return; 
  }
  if (nova !== conf) { 
    toast('As senhas não conferem', 'error'); 
    return; 
  }

  // Buscar usuário atual no banco
  const usuarios = await dbCarregarUsuarios();
  const usuario = usuarios.find(u => u.id === currentUser.id);

  if (!usuario || atual !== usuario.senha) { 
    toast('Senha atual incorreta', 'error'); 
    return; 
  }

  usuario.senha = nova;
  await dbSalvarUsuario(usuario);

  closeModal('modal-senha');
  toast('Senha alterada com sucesso!', 'success');
}

// ---- Seed de usuários padrão ----
async function seedUsuarios() {
  const usuarios = await dbCarregarUsuarios();

  // Verifica se já existem usuários
  if (usuarios.length === 0) {
    const defaultUsers = [
      { id: 'USR-' + Date.now() + '-1', nome: 'Anderson', senha: '986532', role: 'admin', tipo: 'admin', dataCriacao: new Date().toISOString() },
      { id: 'USR-' + Date.now() + '-2', nome: 'Planejador', senha: 'plan@2024', role: 'planejamento', tipo: 'normal', dataCriacao: new Date().toISOString() },
      { id: 'USR-' + Date.now() + '-3', nome: 'Manutencao', senha: 'manu@2024', role: 'manutencao', tipo: 'normal', dataCriacao: new Date().toISOString() }
    ];

    for (const user of defaultUsers) {
      await dbSalvarUsuario(user);
    }
    console.log('Usuários padrão criados com sucesso!');
  }
}
