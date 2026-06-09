// ============================================================
// SANEAMENTO E SPCI — Autenticação
// ============================================================

let currentUser = null;
const DEFAULT_PASSWORDS = { planejamento: 'plan@2024', manutencao: 'manu@2024' };

async function initAuth() {
  const saved = localStorage.getItem('spci_user');
  if (saved) currentUser = JSON.parse(saved);
  updateAuthUI();
}

async function getPassword(role) {
  const stored = await dbGetConfig('pwd_' + role);
  return stored || DEFAULT_PASSWORDS[role];
}

async function setPassword(role, pwd) {
  await dbSetConfig('pwd_' + role, pwd);
}

async function login(role, pwd) {
  const real = await getPassword(role);
  if (pwd === real) {
    currentUser = { role, name: role === 'planejamento' ? 'Planejamento' : 'Manutenção' };
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
  renderLoginForm('planejamento');
  toast('Sessão encerrada.', 'info');
}

function updateAuthUI() {
  const lbl = document.getElementById('user-nav-label');
  if (currentUser) lbl.textContent = currentUser.name;
  else lbl.textContent = 'Entrar';

  const logArea  = document.getElementById('logado-area');
  const formArea = document.getElementById('login-form-area');
  if (logArea) {
    if (currentUser) {
      logArea.style.display  = 'block';
      formArea.style.display = 'none';
      const nm = document.getElementById('logado-nome');
      if (nm) nm.textContent = currentUser.name + ' (' + currentUser.role + ')';
    } else {
      logArea.style.display  = 'none';
      formArea.style.display = 'block';
    }
  }
  renderDemandasTable();
}

// ---- UI de login ----
let loginTabAtivo = 'planejamento';

function switchLoginTab(role) {
  loginTabAtivo = role;
  document.getElementById('tab-plan').classList.toggle('active', role === 'planejamento');
  document.getElementById('tab-man').classList.toggle('active', role === 'manutencao');
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
    <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="doLogin()">
      Entrar como ${role === 'planejamento' ? 'Planejamento' : 'Manutenção'}
    </button>`;
}

async function doLogin() {
  const pwd = document.getElementById('login-pwd').value;
  if (!pwd) { toast('Informe a senha', 'error'); return; }
  const ok = await login(loginTabAtivo, pwd);
  if (ok) {
    toast('Bem-vindo, ' + currentUser.name + '!', 'success');
    document.getElementById('login-form-area').style.display = 'none';
    document.getElementById('logado-area').style.display     = 'block';
    document.getElementById('logado-nome').textContent = currentUser.name + ' (' + currentUser.role + ')';
  } else {
    toast('Senha incorreta.', 'error');
    document.getElementById('login-pwd').value = '';
  }
}

function openChangePassword() {
  document.getElementById('senha-content').innerHTML = `
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
  if (!atual || !nova || !conf) { toast('Preencha todos os campos', 'error'); return; }
  if (nova.length < 6) { toast('Mínimo 6 caracteres', 'error'); return; }
  if (nova !== conf)   { toast('As senhas não conferem', 'error'); return; }
  const real = await getPassword(currentUser.role);
  if (atual !== real)  { toast('Senha atual incorreta', 'error'); return; }
  await setPassword(currentUser.role, nova);
  closeModal('modal-senha');
  toast('Senha alterada!', 'success');
}
