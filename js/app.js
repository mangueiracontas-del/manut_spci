// ============================================================
// SANEAMENTO E SPCI — Lógica Principal
// ============================================================

let allDemandas      = [];
let filteredDemandas = [];
let allSites         = [];
let allLocais        = [];
let editingId        = null;
let editingSiteId    = null;
let editingLocalId   = null;
let editingUserId    = null;
let allUsuarios      = [];
let loginTabAtivo    = 'login';  // <-- CORREÇÃO: variável declarada

// ---- ID ----
function gerarID() {
  const d = new Date();
  return 'DM-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + '-' + Math.floor(1000 + Math.random() * 9000);
}

function gerarIDSite() {
  const d = new Date();
  return 'ST-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + '-' + Math.floor(100 + Math.random() * 900);
}

function gerarIDLocal() {
  const d = new Date();
  return 'LC-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + '-' + Math.floor(100 + Math.random() * 900);
}

function gerarIDUsuario() {
  const d = new Date();
  return 'USR-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + '-' + Math.floor(100 + Math.random() * 900);
}

// ---- Carregar ----
async function loadDemandas() {
  mostrarLoading(true);
  try {
    allDemandas = await dbCarregarDemandas();
    allDemandas.sort((a, b) => new Date(b.data) - new Date(a.data));
    console.log('[APP] Demandas carregadas:', allDemandas.length);
  } catch(e) {
    console.error('[APP] Erro ao carregar demandas:', e);
    toast('Erro ao carregar demandas: ' + e.message, 'error');
    allDemandas = [];
  } finally {
    mostrarLoading(false);
  }
  popularFiltros();
  aplicarFiltros();
}

async function loadSites() {
  mostrarLoading(true);
  try {
    allSites = await dbCarregarSites();
    allSites.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  } catch(e) {
    toast('Erro ao carregar sites: ' + e.message, 'error');
  } finally {
    mostrarLoading(false);
  }
  renderSitesTable();
}

async function loadLocais() {
  mostrarLoading(true);
  try {
    allLocais = await dbCarregarLocais();
    allLocais.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  } catch(e) {
    toast('Erro ao carregar locais: ' + e.message, 'error');
  } finally {
    mostrarLoading(false);
  }
  renderLocaisTable();
}

async function loadUsuarios() {
  mostrarLoading(true);
  try {
    allUsuarios = await dbCarregarUsuarios();
    allUsuarios.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  } catch(e) {
    toast('Erro ao carregar usuarios: ' + e.message, 'error');
  } finally {
    mostrarLoading(false);
  }
  renderUsuariosTable();
}

// ---- Filtros ----
function popularFiltros() {
  const sites  = [...new Set(allDemandas.map(d => d.site).filter(Boolean))].sort();
  const locais = [...new Set(allDemandas.map(d => d.local).filter(Boolean))].sort();
  const sols   = [...new Set(allDemandas.map(d => d.solicitante).filter(Boolean))].sort();
  const fs = document.getElementById('f-site'), fl = document.getElementById('f-local'), fso = document.getElementById('f-solicitante');
  const sv = fs.value, lv = fl.value, solv = fso.value;
  fs.innerHTML  = '<option value="">Sites</option>' + sites.map(s  => `<option${s===sv?' selected':''}>${s}</option>`).join('');
  fl.innerHTML  = '<option value="">Locais</option>' + locais.map(l => `<option${l===lv?' selected':''}>${l}</option>`).join('');
  fso.innerHTML = '<option value="">Solicitantes</option>' + sols.map(s => `<option${s===solv?' selected':''}>${s}</option>`).join('');
}

function aplicarFiltros() {
  const busca    = document.getElementById('f-busca').value.toLowerCase();
  const dIni     = document.getElementById('f-data-ini').value;
  const dFim     = document.getElementById('f-data-fim').value;
  const site     = document.getElementById('f-site').value;
  const local    = document.getElementById('f-local').value;
  const situacao = document.getElementById('f-situacao').value;
  const prio     = document.getElementById('f-prioridade').value;
  const statusSelecionados = getMultiSelectValues('f-status');

  const equipe   = document.getElementById('f-equipe').value;
  const sol      = document.getElementById('f-solicitante').value;

  filteredDemandas = allDemandas.filter(d => {
    const st = d.status || 'Aberta';
    if (busca && ![d.site,d.tag,d.local,d.descricao,d.solicitante,d.om].some(v => (v||'').toLowerCase().includes(busca))) return false;
    if (dIni && d.data < dIni) return false;
    if (dFim && d.data > dFim) return false;
    if (site && d.site !== site) return false;
    if (local && d.local !== local) return false;
    if (situacao && d.situacao !== situacao) return false;
    if (prio && d.prioridade !== prio) return false;
    if (statusSelecionados.length > 0 && !statusSelecionados.includes(d.status)) return false;

    if (equipe && d.equipe !== equipe) return false;
    if (sol && d.solicitante !== sol) return false;
    return true;
  });

  const pd = { P0:0, P1:1, P2:2, P3:3, P4:4, P5:5 };
  const st = { 'Aberta':0, 'Em Análise':1, 'Em Andamento':2, 'Concluída':3, 'Cancelada':4, 'Improcedente':3 };
  filteredDemandas.sort((a, b) => {
      const statusDiff = (st[a.status || 'Aberta'] ?? 0) - (st[b.status || 'Aberta'] ?? 0);
      if (statusDiff !== 0) return statusDiff;
      const prioDiff = (pd[a.prioridade] ?? 99) - (pd[b.prioridade] ?? 99);
      if (prioDiff !== 0) return prioDiff;
      return new Date(b.data) - new Date(a.data);
  });
  renderDemandasTable();
  renderStats();
}

function limparFiltros() {
  ['f-busca','f-data-ini','f-data-fim','f-site','f-local','f-situacao','f-prioridade','f-equipe','f-solicitante']
    .forEach(id => document.getElementById(id).value = '');
    document.querySelectorAll('#f-status input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelector('#f-status .multi-select-label').textContent = 'Status';
  aplicarFiltros();
}

// ---- Badges ----
function situacaoBadge(s) {
  const map = { 'Sistema parado - Crítico':'badge-red', 'Sistema parcialmente parado - Prioritário':'badge-orange', 'Sistema com Restrição - Moderado':'badge-yellow', 'Sistema operando - Leve':'badge-green' };
  return `<span class="badge ${map[s]||'badge-gray'} no-border">${s ? s.split(' - ')[1]||s : '—'}</span>`;
}
function statusBadge(s) {
  const map = { 'Aberta':'badge-blue', 'Em Análise':'badge-purple', 'Em Andamento':'badge-orange', 'Concluída':'badge-green', 'Cancelada':'badge-gray', 'Improcedente':'badge-green' };
  const v = s || 'Aberta';
  return `<span class="badge ${map[v]||'badge-gray'}">${v}</span>`;
}
function prioBadge(p) {
  if (!p) return `<span style="color:var(--text3);font-size:12px">—</span>`;
  const n = parseInt(p.replace('P',''));
  return `<span class="badge ${n===0?'prio-p0':n===1?'prio-p1':n===2?'prio-p2':n===3?'prio-p3':'prio-pn'}">${p}</span>`;
}
function equipeBadge(e) {
  const map = { 'Manutenção Corretiva':'badge-red', 'Manutenção Preventiva':'badge-orange', 'Inspeção':'badge-yellow', 'PCM':'badge-purple' };
  if (!e) return '<span style="color:var(--text3);font-size:12px">—</span>';
  return `<span class="badge ${map[e]||'badge-gray'} no-border" style="font-size:11px">${e}</span>`;
}
function tipoBadge(t) {
  if (t === 'admin') return '<span class="badge badge-red">Admin</span>';
  return '<span class="badge badge-blue">Normal</span>';
}
function roleBadge(r) {
  const map = { 'admin':'badge-red', 'planejamento':'badge-purple', 'manutencao':'badge-orange' };
  const labels = { 'admin':'Admin', 'planejamento':'Planejamento', 'manutencao':'Manutenção' };
  return `<span class="badge ${map[r]||'badge-gray'}">${labels[r]||r}</span>`;
}

// ---- Tabela Demandas ----
function renderDemandasTable() {
  const tbody = document.getElementById('demandas-tbody');
  const empty = document.getElementById('empty-demandas');
  if (!filteredDemandas.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  const isPlan = isPlanejamento();
  const isMan  = isManutencao();

  tbody.innerHTML = filteredDemandas.map(d => {
    const st       = d.status || 'Aberta';
    const encerrada = st === 'Concluída' || st === 'Cancelada' || st === 'Improcedente';
    const btnDup = `<button class="btn btn-secondary btn-sm btn-icon" title="Duplicar" onclick="event.stopPropagation();openNovaDemanda('${d.id}')">
      <svg class="icon" viewBox="0 0 16 16" fill="currentColor"><path d="M5 1h7l3 3v9H5V1zm2 0v3h6M1 5h4v10h8"/></svg>
    </button>`;
    let acoes = '';
    if (isPlan) {
      acoes = `
        <button class="btn btn-secondary btn-sm btn-icon" title="Aceitar / Editar" onclick="event.stopPropagation();openAceite('${d.id}','planejamento')">
          <svg class="icon" viewBox="0 0 16 16" fill="currentColor"><path d="M2 8l4 4 8-8"/></svg>
        </button>${btnDup}
        <button class="btn btn-danger btn-sm btn-icon" title="Excluir" onclick="event.stopPropagation();excluirDemanda('${d.id}')">
          <svg class="icon" viewBox="0 0 16 16" fill="currentColor"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"/></svg>
        </button>`;
    } else if (isMan) {
      acoes = `
        ${!encerrada ? `<button class="btn btn-success btn-sm btn-icon" title="Aceitar" onclick="event.stopPropagation();openAceite('${d.id}','manutencao')">
          <svg class="icon" viewBox="0 0 16 16" fill="currentColor"><path d="M2 8l4 4 8-8"/></svg>
        </button>` : ''}
        ${st === 'Em Andamento' ? `<button class="btn btn-secondary btn-sm btn-icon" title="Análise / Resolução" onclick="event.stopPropagation();openAnalise('${d.id}')">
          <svg class="icon" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h12v12H2z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5 6h6M5 9h4"/></svg>
        </button>` : ''}${btnDup}`;
    } else {
      acoes = btnDup;
    }

    return `<tr onclick="verDetalhe('${d.id}')">
      <td class="td-mono">${d.id}</td>
      <td class="td-mono">${formatDate(d.data)}</td>
      <td>${esc(d.site)}</td>
      <td style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(d.local)}">${esc(d.local)}</td>
      <td class="td-mono">${esc(d.tag)}</td>
      <td>${situacaoBadge(d.situacao)}</td>
      <td>${statusBadge(st)}</td>
      <td>${prioBadge(d.prioridade)}</td>
      <td>${equipeBadge(d.equipe)}</td>
      <td style="max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(d.solicitante)}</td>
      <td class="td-mono" style="color:var(--text2);white-space:nowrap">${calcularTempoVida(d)}</td>
      <td onclick="event.stopPropagation()"><div style="display:flex;gap:4px">${acoes}</div></td>
    </tr>`;
  }).join('');
}

function renderStats() {
  const d    = allDemandas;
  const grid = document.getElementById('stats-grid');
  grid.innerHTML = `
    <div class="stat-card"><div class="stat-label">Total</div><div class="stat-value">${d.length}</div><div class="stat-sub">demandas</div></div>
    <div class="stat-card"><div class="stat-label">Abertas</div><div class="stat-value" style="color:var(--blue)">${d.filter(x=>!x.status||x.status==='Aberta').length}</div><div class="stat-sub">abertas</div></div>
    <div class="stat-card"><div class="stat-label">Em Análise</div><div class="stat-value" style="color:var(--purple)">${d.filter(x=>x.status==='Em Análise').length}</div><div class="stat-sub">em análise</div></div>
    <div class="stat-card"><div class="stat-label">Em Andamento</div><div class="stat-value" style="color:var(--orange)">${d.filter(x=>x.status==='Em Andamento').length}</div><div class="stat-sub">em andamento</div></div>
    <div class="stat-card"><div class="stat-label">Críticos</div><div class="stat-value" style="color:var(--red)">${d.filter(x=>x.situacao?.includes('Crítico')).length}</div><div class="stat-sub">críticos</div></div>
    <div class="stat-card"><div class="stat-label">Concluídas</div><div class="stat-value" style="color:var(--green)">${d.filter(x=>x.status==='Concluída').length}</div><div class="stat-sub">resolvidas</div></div>
    <div class="stat-card"><div class="stat-label">Improcedentes</div><div class="stat-value" style="color:var(--green)">${d.filter(x=>x.status==='Improcedente').length}</div><div class="stat-sub">improcedentes</div></div>
  `;
}

// ---- Tabela Sites ----
function renderSitesTable() {
  const tbody = document.getElementById('sites-tbody');
  const empty = document.getElementById('empty-sites');
  if (!allSites.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  tbody.innerHTML = allSites.map(s => `
    <tr>
      <td class="td-mono">${esc(s.id)}</td>
      <td><strong>${esc(s.nome)}</strong></td>
      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(s.descricao||'')}">${esc(s.descricao||'—')}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-secondary btn-sm btn-icon" title="Editar" onclick="openModalSite('${s.id}')">
            <svg class="icon" viewBox="0 0 16 16" fill="currentColor"><path d="M11.5 1l3 3L5 13.5 1.5 10 11.5 1z"/></svg>
          </button>
          <button class="btn btn-danger btn-sm btn-icon" title="Excluir" onclick="excluirSite('${s.id}')">
            <svg class="icon" viewBox="0 0 16 16" fill="currentColor"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ---- Tabela Locais ----
function renderLocaisTable() {
  const tbody = document.getElementById('locais-tbody');
  const empty = document.getElementById('empty-locais');
  if (!allLocais.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  tbody.innerHTML = allLocais.map(l => {
    const siteNome = l.siteNome || (l.siteId ? '—' : '—');
    return `
    <tr>
      <td class="td-mono">${esc(l.id)}</td>
      <td><strong>${esc(l.nome)}</strong></td>
      <td>${esc(siteNome)}</td>
      <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(l.descricao||'')}">${esc(l.descricao||'—')}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-secondary btn-sm btn-icon" title="Editar" onclick="openModalLocal('${l.id}')">
            <svg class="icon" viewBox="0 0 16 16" fill="currentColor"><path d="M11.5 1l3 3L5 13.5 1.5 10 11.5 1z"/></svg>
          </button>
          <button class="btn btn-danger btn-sm btn-icon" title="Excluir" onclick="excluirLocal('${l.id}')">
            <svg class="icon" viewBox="0 0 16 16" fill="currentColor"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ---- Tabela Usuários ----
function renderUsuariosTable() {
  const tbody = document.getElementById('usuarios-tbody');
  const empty = document.getElementById('empty-usuarios');
  if (!allUsuarios.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  tbody.innerHTML = allUsuarios.map(u => `
    <tr>
      <td class="td-mono">${esc(u.id)}</td>
      <td><strong>${esc(u.nome)}</strong></td>
      <td>${tipoBadge(u.tipo)}</td>
      <td>${roleBadge(u.role)}</td>
      <td style="font-family:var(--mono);font-size:12px;color:var(--text3)">••••••••</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-secondary btn-sm btn-icon" title="Editar" onclick="openModalUsuario('${u.id}')">
            <svg class="icon" viewBox="0 0 16 16" fill="currentColor"><path d="M11.5 1l3 3L5 13.5 1.5 10 11.5 1z"/></svg>
          </button>
          <button class="btn btn-danger btn-sm btn-icon" title="Excluir" onclick="excluirUsuario('${u.id}')">
            <svg class="icon" viewBox="0 0 16 16" fill="currentColor"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ---- Dropdown helpers ----
function buildSiteOptions(selected) {
  const opts = allSites.map(s => `<option value="${esc(s.nome)}" ${s.nome === selected ? 'selected' : ''}>${esc(s.nome)}</option>`).join('');
  return `<option value="">— Selecione —</option>` + opts;
}

function buildLocalOptions(selected, siteNome) {
  let locaisFiltrados = allLocais;
  if (siteNome) {
    const site = allSites.find(s => s.nome === siteNome);
    if (site) {
      locaisFiltrados = allLocais.filter(l => l.siteId === site.id);
    }
  }
  const opts = locaisFiltrados.map(l => `<option value="${esc(l.nome)}" ${l.nome === selected ? 'selected' : ''}>${esc(l.nome)}</option>`).join('');
  return `<option value="">— Selecione —</option>` + opts;
}

// NOVO: Atualiza o select de locais baseado no site selecionado
function atualizarLocaisPorSite(selectSiteId, selectLocalId, selectedLocal) {
  const siteNome = document.getElementById(selectSiteId).value;
  const localSelect = document.getElementById(selectLocalId);
  if (!localSelect) return;
  const currentVal = selectedLocal !== undefined ? selectedLocal : localSelect.value;
  localSelect.innerHTML = buildLocalOptions(currentVal, siteNome);
}

// ---- Nova / Duplicar ----
async function openNovaDemanda(sourceId) {
  if (!allSites.length) {
    mostrarLoading(true);
    try { allSites = await dbCarregarSites(); } catch(e) {}
    mostrarLoading(false);
  }
  if (!allLocais.length) {
    mostrarLoading(true);
    try { allLocais = await dbCarregarLocais(); } catch(e) {}
    mostrarLoading(false);
  }

  const src   = sourceId ? allDemandas.find(x => x.id === sourceId) : null;
  const isDup = !!src;
  document.getElementById('nova-titulo').textContent = isDup ? 'Duplicar Demanda' : 'Nova Demanda de Manutenção';
  editingId = null;
  const isPlan = isPlanejamento();
  const isMan  = isManutencao();

  const secaoDir = (isPlan || isMan) ? `
    <hr class="section-sep">
    <p style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--text2);margin-bottom:12px;font-weight:600">
      ${isPlan ? 'Direcionamento (opcional)' : 'Aceite direto (opcional)'}
    </p>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Direcionar para equipe</label>
        <select class="form-control" id="nd-equipe">
          <option value="">— Selecionar depois —</option>
          <option>Manutenção Corretiva</option><option>Manutenção Preventiva</option><option>Inspeção</option><option>PCM</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Prioridade</label>
        <select class="form-control" id="nd-prioridade">
          <option value="">— Sem prioridade —</option>
          <option>P0</option><option>P1</option><option>P2</option><option>P3</option><option>P4</option><option>P5</option>
        </select>
      </div>
    </div>` : '';

  document.getElementById('nova-body').innerHTML = `
    ${isDup ? `<div style="background:var(--blue-bg);border:1px solid #58A6FF30;border-radius:var(--radius);padding:10px 14px;margin-bottom:16px;font-size:13px;color:var(--blue)">
      Campos pré-preenchidos com base em <b>${src.id}</b>. Um novo ID será gerado ao registrar.</div>` : ''}
    <div class="form-row">
      <div class="form-group"><label class="form-label">Site *</label>
        <select class="form-control" id="nd-site" required onchange="atualizarLocaisPorSite('nd-site','nd-local')">
          ${buildSiteOptions(src?.site || '')}
        </select></div>
      <div class="form-group"><label class="form-label">Local *</label>
        <select class="form-control" id="nd-local" required>
          ${buildLocalOptions(src?.local || '', src?.site || '')}
        </select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">TAG do Equipamento *</label>
        <input class="form-control" id="nd-tag" value="${esc(src?.tag||'')}" placeholder="Ex: BLW-001" required></div>
      <div class="form-group"><label class="form-label">Solicitante *</label>
        <input class="form-control" id="nd-solicitante" value="${esc(src?.solicitante||'')}" placeholder="Nome completo" required></div>
    </div>
    <div class="form-group">
      <label class="form-label">Situação Atual *</label>
      <select class="form-control" id="nd-situacao" required>
        <option value="">Selecione a situação</option>
        <option value="Sistema parado - Crítico" ${src?.situacao==='Sistema parado - Crítico'?'selected':''}>🔴 Sistema parado — Crítico</option>
        <option value="Sistema parcialmente parado - Prioritário" ${src?.situacao==='Sistema parcialmente parado - Prioritário'?'selected':''}>🟠 Sistema parcialmente parado — Prioritário</option>
        <option value="Sistema com Restrição - Moderado" ${src?.situacao==='Sistema com Restrição - Moderado'?'selected':''}>🟡 Sistema com Restrição — Moderado</option>
        <option value="Sistema operando - Leve" ${src?.situacao==='Sistema operando - Leve'?'selected':''}>🟢 Sistema operando — Leve</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Descrição Detalhada *</label>
      <textarea class="form-control" id="nd-descricao" rows="4" placeholder="Descreva a falha em detalhes..." required style="min-height:90px">${esc(src?.descricao||'')}</textarea>
    </div>

    ${secaoDir}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
      <button type="button" class="btn btn-secondary" onclick="closeModal('modal-nova')">Cancelar</button>
      <button type="button" class="btn btn-primary" onclick="submitNovaDemanda()">Registrar Demanda</button>
    </div>`;
  openModal('modal-nova');
}



async function submitNovaDemanda() {
  const site       = document.getElementById('nd-site').value.trim();
  const local      = document.getElementById('nd-local').value.trim();
  const tag        = document.getElementById('nd-tag').value.trim().toUpperCase();
  const solicitante= document.getElementById('nd-solicitante').value.trim();
  const situacao   = document.getElementById('nd-situacao').value;
  const descricao  = document.getElementById('nd-descricao').value.trim();
  if (!site||!local||!tag||!solicitante||!situacao||!descricao) { toast('Preencha todos os campos obrigatórios.','error'); return; }

  const equipeEl   = document.getElementById('nd-equipe');
  const prioEl     = document.getElementById('nd-prioridade');
  const equipe     = equipeEl ? equipeEl.value || null : null;
  const prioridade = prioEl   ? prioEl.value   || null : null;
  const isMan      = isManutencao();
  const statusInicial = isMan ? 'Em Análise' : (equipe ? 'Em Análise' : 'Aberta');

  const d = {
    id: gerarID(), data: new Date().toISOString().split('T')[0], dataHora: new Date().toISOString(),
    site, local, tag, solicitante, situacao, descricao,
    status: statusInicial, prioridade, equipe,
    comentarioPlan: null, analise: null, resolucao: null, om: null,
    dataAceite: equipe ? new Date().toISOString().split('T')[0] : null,
    dataConclusao: null, tecnico: null
  };

  mostrarLoading(true);
  try {
    await dbSalvarDemanda(d);
    closeModal('modal-nova');
    await loadDemandas();
    toast('Demanda ' + d.id + ' registrada!', 'success');
  } catch(e) {
    toast('Erro ao salvar: ' + e.message, 'error');
  } finally { mostrarLoading(false); }
}

// ---- Modal Site ----
function openModalSite(id) {
  const isEdit = !!id;
  const s = isEdit ? allSites.find(x => x.id === id) : null;
  editingSiteId = isEdit ? id : null;
  document.getElementById('site-titulo').textContent = isEdit ? 'Editar Site' : 'Novo Site';
  document.getElementById('site-body').innerHTML = `
    <div class="form-group">
      <label class="form-label">Nome do Site *</label>
      <input class="form-control" id="site-nome" value="${esc(s?.nome||'')}" placeholder="Ex: ETE Norte" required>
    </div>
    <div class="form-group">
      <label class="form-label">Descrição</label>
      <textarea class="form-control" id="site-descricao" rows="3" placeholder="Descrição opcional do site...">${esc(s?.descricao||'')}</textarea>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
      <button type="button" class="btn btn-secondary" onclick="closeModal('modal-site')">Cancelar</button>
      <button type="button" class="btn btn-primary" onclick="submitSite()">${isEdit ? 'Salvar Alterações' : 'Cadastrar Site'}</button>
    </div>`;
  openModal('modal-site');
}

async function submitSite() {
  const nome = document.getElementById('site-nome').value.trim();
  const descricao = document.getElementById('site-descricao').value.trim() || null;
  if (!nome) { toast('Informe o nome do site.', 'error'); return; }

  const site = { id: editingSiteId || gerarIDSite(), nome, descricao };

  mostrarLoading(true);
  try {
    await dbSalvarSite(site);
    closeModal('modal-site');
    await loadSites();
    toast(editingSiteId ? 'Site atualizado!' : 'Site cadastrado!', 'success');
  } catch(e) {
    toast('Erro ao salvar: ' + e.message, 'error');
  } finally { mostrarLoading(false); }
}

async function excluirSite(id) {
  if (!confirm('Excluir site? Esta ação é irreversível.')) return;
  const vinculadas = allDemandas.filter(d => d.site === allSites.find(s => s.id === id)?.nome);
  if (vinculadas.length > 0) {
    if (!confirm(`Atenção: ${vinculadas.length} demanda(s) estão vinculadas a este site. Deseja excluir mesmo assim?`)) return;
  }
  mostrarLoading(true);
  try {
    await dbExcluirSite(id);
    await loadSites();
    toast('Site excluído.', 'info');
  } catch(e) { toast('Erro: ' + e.message, 'error'); }
  finally { mostrarLoading(false); }
}

// ---- Modal Local ----
function openModalLocal(id) {
  const isEdit = !!id;
  const l = isEdit ? allLocais.find(x => x.id === id) : null;
  editingLocalId = isEdit ? id : null;
  document.getElementById('local-titulo').textContent = isEdit ? 'Editar Local' : 'Novo Local';

  const siteOptions = allSites.map(s =>
    `<option value="${esc(s.id)}" ${l?.siteId === s.id ? 'selected' : ''}>${esc(s.nome)}</option>`
  ).join('');

  document.getElementById('local-body').innerHTML = `
    
    <div class="form-group">
      <label class="form-label">Site *</label>
      <select class="form-control" id="local-site" required>
        <option value="">— Selecione um site —</option>
        ${siteOptions}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Nome do Local *</label>
      <input class="form-control" id="local-nome" value="${esc(l?.nome||'')}" placeholder="Ex: Blower A — Sala 01" required>
    </div>
    <div class="form-group">
      <label class="form-label">Descrição</label>
      <textarea class="form-control" id="local-descricao" rows="3" placeholder="Descrição opcional do local...">${esc(l?.descricao||'')}</textarea>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
      <button type="button" class="btn btn-secondary" onclick="closeModal('modal-local')">Cancelar</button>
      <button type="button" class="btn btn-primary" onclick="submitLocal()">${isEdit ? 'Salvar Alterações' : 'Cadastrar Local'}</button>
    </div>`;
  openModal('modal-local');
}

async function submitLocal() {
  const nome = document.getElementById('local-nome').value.trim();
  const siteId = document.getElementById('local-site').value;
  const descricao = document.getElementById('local-descricao').value.trim() || null;
  if (!nome) { toast('Informe o nome do local.', 'error'); return; }
  if (!siteId) { toast('Selecione o site ao qual este local pertence.', 'error'); return; }

  const local = { id: editingLocalId || gerarIDLocal(), nome, siteId, descricao };

  mostrarLoading(true);
  try {
    await dbSalvarLocal(local);
    closeModal('modal-local');
    // Recarrega locais e sites para manter consistência
    await loadLocais();
    toast(editingLocalId ? 'Local atualizado!' : 'Local cadastrado!', 'success');
  } catch(e) {
    toast('Erro ao salvar: ' + e.message, 'error');
  } finally { mostrarLoading(false); }
}

async function excluirLocal(id) {
  if (!confirm('Excluir local? Esta ação é irreversível.')) return;
  const vinculadas = allDemandas.filter(d => d.local === allLocais.find(l => l.id === id)?.nome);
  if (vinculadas.length > 0) {
    if (!confirm(`Atenção: ${vinculadas.length} demanda(s) estão vinculadas a este local. Deseja excluir mesmo assim?`)) return;
  }
  mostrarLoading(true);
  try {
    await dbExcluirLocal(id);
    await loadLocais();
    toast('Local excluído.', 'info');
  } catch(e) { toast('Erro: ' + e.message, 'error'); }
  finally { mostrarLoading(false); }
}

// ---- Modal Usuário ----
function openModalUsuario(id) {
  const isEdit = !!id;
  const u = isEdit ? allUsuarios.find(x => x.id === id) : null;
  editingUserId = isEdit ? id : null;
  document.getElementById('usuario-titulo').textContent = isEdit ? 'Editar Usuário' : 'Novo Usuário';

  const tipoOptions = `
    <option value="normal" ${u?.tipo==='normal'?'selected':''}>Normal</option>
    <option value="admin" ${u?.tipo==='admin'?'selected':''}>Administrador</option>
  `;

  const roleOptions = `
    <option value="admin" ${u?.role==='admin'?'selected':''}>Admin</option>
    <option value="planejamento" ${u?.role==='planejamento'?'selected':''}>Planejamento</option>
    <option value="manutencao" ${u?.role==='manutencao'?'selected':''}>Manutenção</option>
  `;

  document.getElementById('usuario-body').innerHTML = `
    <div class="form-group">
      <label class="form-label">Nome de Usuário *</label>
      <input class="form-control" id="user-nome" value="${esc(u?.nome||'')}" placeholder="Ex: João Silva" required>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Tipo de Usuário *</label>
        <select class="form-control" id="user-tipo" required>
          ${tipoOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Função/Perfil *</label>
        <select class="form-control" id="user-role" required>
          ${roleOptions}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Senha ${isEdit ? '(deixe em branco para manter a atual)' : '*'}</label>
      <input type="password" class="form-control" id="user-senha" placeholder="${isEdit ? '••••••••' : 'Mínimo 6 caracteres'}" ${isEdit ? '' : 'required'}>
    </div>
    <div class="form-group">
      <label class="form-label">Confirmar Senha ${isEdit ? '(deixe em branco para manter a atual)' : '*'}</label>
      <input type="password" class="form-control" id="user-senha-conf" placeholder="${isEdit ? '••••••••' : 'Repita a senha'}" ${isEdit ? '' : 'required'}>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
      <button type="button" class="btn btn-secondary" onclick="closeModal('modal-usuario')">Cancelar</button>
      <button type="button" class="btn btn-primary" onclick="submitUsuario()">${isEdit ? 'Salvar Alterações' : 'Cadastrar Usuário'}</button>
    </div>`;
  openModal('modal-usuario');
}

async function submitUsuario() {
  const nome = document.getElementById('user-nome').value.trim();
  const tipo = document.getElementById('user-tipo').value;
  const role = document.getElementById('user-role').value;
  const senha = document.getElementById('user-senha').value;
  const senhaConf = document.getElementById('user-senha-conf').value;

  if (!nome) { toast('Informe o nome do usuário.', 'error'); return; }
  if (!tipo || !role) { toast('Selecione o tipo e a função do usuário.', 'error'); return; }

  const isEdit = !!editingUserId;
  const usuarioExistente = allUsuarios.find(u => u.nome.toLowerCase() === nome.toLowerCase() && u.id !== editingUserId);
  if (usuarioExistente) { toast('Já existe um usuário com este nome.', 'error'); return; }

  let senhaFinal;
  if (isEdit) {
    const u = allUsuarios.find(x => x.id === editingUserId);
    if (!senha) {
      senhaFinal = u.senha;
    } else {
      if (senha.length < 6) { toast('A senha deve ter no mínimo 6 caracteres.', 'error'); return; }
      if (senha !== senhaConf) { toast('As senhas não conferem.', 'error'); return; }
      senhaFinal = senha;
    }
  } else {
    if (!senha) { toast('Informe a senha.', 'error'); return; }
    if (senha.length < 6) { toast('A senha deve ter no mínimo 6 caracteres.', 'error'); return; }
    if (senha !== senhaConf) { toast('As senhas não conferem.', 'error'); return; }
    senhaFinal = senha;
  }

  const usuario = {
    id: editingUserId || gerarIDUsuario(),
    nome, tipo, role,
    senha: senhaFinal,
    dataCriacao: isEdit ? allUsuarios.find(u => u.id === editingUserId)?.dataCriacao : new Date().toISOString()
  };

  mostrarLoading(true);
  try {
    await dbSalvarUsuario(usuario);
    closeModal('modal-usuario');
    await loadUsuarios();
    toast(isEdit ? 'Usuário atualizado!' : 'Usuário cadastrado!', 'success');
  } catch(e) {
    toast('Erro ao salvar: ' + e.message, 'error');
  } finally { mostrarLoading(false); }
}

async function excluirUsuario(id) {
  if (!confirm('Excluir usuário? Esta ação é irreversível.')) return;
  if (id === currentUser?.id) { toast('Você não pode excluir seu próprio usuário.', 'error'); return; }

  mostrarLoading(true);
  try {
    await dbExcluirUsuario(id);
    await loadUsuarios();
    toast('Usuário excluído.', 'info');
  } catch(e) { toast('Erro: ' + e.message, 'error'); }
  finally { mostrarLoading(false); }
}

// ---- Detalhe ----
function verDetalhe(id) {
  const d = allDemandas.find(x => x.id === id);
  if (!d) return;
  document.getElementById('detalhe-titulo').textContent = 'Demanda ' + d.id;
  document.getElementById('detalhe-data').textContent   = 'Registrada em ' + formatDateTime(d.dataHora) + ' por ' + d.solicitante;
  const steps = ['Aberta','Em Análise','Em Andamento','Concluída','Improcedente'];
  const si    = steps.indexOf(d.status || 'Aberta');
  const stepHtml = steps.map((s,i) => `<div class="status-step"><div class="step-dot ${i<si?'done':i===si?'active':''}">${i<si?'✓':i+1}</div><div class="step-label">${s}</div></div>`).join('');
  const st       = d.status || 'Aberta';
  const encerrada= st === 'Concluída' || st === 'Cancelada' || st === 'Improcedente';
  const isPlan   = currentUser?.role === 'planejamento';
  const isMan    = currentUser?.role === 'manutencao';

  document.getElementById('detalhe-content').innerHTML = `
    <div class="status-flow">${stepHtml}</div>
    <div style="margin:14px 0;display:flex;gap:8px;flex-wrap:wrap">${situacaoBadge(d.situacao)} ${statusBadge(st)} ${prioBadge(d.prioridade)} ${equipeBadge(d.equipe)}</div>
    <div class="detail-grid">
      <div>
        <div class="detail-field"><label>Site</label><span>${esc(d.site)}</span></div>
        <div class="detail-field"><label>Local</label><span>${esc(d.local)}</span></div>
        <div class="detail-field"><label>TAG Equipamento</label><span style="font-family:var(--mono)">${esc(d.tag)}</span></div>
        <div class="detail-field"><label>Solicitante</label><span>${esc(d.solicitante)}</span></div>
      </div>
      <div>
        <div class="detail-field"><label>Data Abertura</label><span>${formatDate(d.data)}</span></div>
        <div class="detail-field"><label>Prioridade</label><span>${d.prioridade||'Não definida'}</span></div>
        <div class="detail-field"><label>Equipe</label><span>${d.equipe||'Não direcionada'}</span></div>
        ${d.tecnico?`<div class="detail-field"><label>Técnico</label><span>${esc(d.tecnico)}</span></div>`:''}
        ${d.om?`<div class="detail-field"><label>Nº OM</label><span style="font-family:var(--mono)">${esc(d.om)}</span></div>`:''}
      </div>
    </div>
    <div class="detail-field" style="margin-top:8px"><label>Descrição</label>
      <p style="background:var(--bg3);padding:12px;border-radius:var(--radius);margin-top:4px;line-height:1.7">${esc(d.descricao)}</p></div>
    ${d.comentarioPlan?`<div class="comment-callout"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--blue);margin-bottom:4px;font-weight:600">💬 Comentário do Planejamento</div><p style="font-size:13px;color:var(--text2)">${esc(d.comentarioPlan)}</p></div>`:''}
    ${d.foto?`<div style="margin-top:12px"><img src="${d.foto}" style="max-width:100%;border-radius:var(--radius);max-height:260px;object-fit:contain;background:var(--bg3)" alt="foto"></div>`:''}
    ${d.analise||d.resolucao||d.om?`<div class="analysis-section">
      <h3 style="font-size:12px;font-weight:600;margin-bottom:12px;color:var(--text2);text-transform:uppercase;letter-spacing:.04em">Análise e Resolução</h3>
      ${d.om?`<div class="detail-field"><label>Número da OM</label><span style="font-family:var(--mono)">${esc(d.om)}</span></div>`:''}
      ${d.tecnico?`<div class="detail-field"><label>Técnico</label><span>${esc(d.tecnico)}</span></div>`:''}
      ${d.analise?`<div class="detail-field"><label>Causa</label><p>${esc(d.analise)}</p></div>`:''}
      ${d.resolucao?`<div class="detail-field"><label>Resolução</label><p>${esc(d.resolucao)}</p></div>`:''}
      ${d.dataConclusao?`<div class="detail-field"><label>Conclusão</label><span>${formatDate(d.dataConclusao)}</span></div>`:''}
    </div>`:''}
    <div style="display:flex;gap:8px;margin-top:20px;justify-content:flex-end;flex-wrap:wrap">
      <button class="btn btn-secondary btn-sm" onclick="closeModal('modal-detalhe')">Cancelar</button>
      <button class="btn btn-secondary btn-sm" onclick="closeModal('modal-detalhe');openNovaDemanda('${d.id}')">
        <svg class="icon" viewBox="0 0 16 16" fill="currentColor"><path d="M5 1h7l3 3v9H5V1zm2 0v3h6M1 5h4v10h8"/></svg> Duplicar
      </button>
      ${isPlan&&!encerrada?`<button class="btn btn-secondary btn-sm" onclick="closeModal('modal-detalhe');openAceite('${d.id}','planejamento')">Aceitar / Editar</button>
        <button class="btn btn-danger btn-sm" onclick="closeModal('modal-detalhe');excluirDemanda('${d.id}')">Excluir</button>`:''}
      ${isMan&&!encerrada?`<button class="btn btn-secondary btn-sm" onclick="closeModal('modal-detalhe');openAceite('${d.id}','manutencao')">Aceitar / Editar</button>`:''}
      ${isMan&&st==='Em Andamento'?`<button class="btn btn-primary btn-sm" onclick="closeModal('modal-detalhe');openAnalise('${d.id}')">Lançar Análise</button>`:''}
      ${isAdmin()&&(encerrada)?`<button class="btn btn-secondary btn-sm" onclick="closeModal('modal-detalhe');openAlterarStatus('${d.id}')">Alterar Status</button>`:''}
    </div>`;
  openModal('modal-detalhe');
}

// ---- Aceite Planejamento ----
async function openAceite(id, perfil) {
  if (!allSites.length) {
    mostrarLoading(true);
    try { allSites = await dbCarregarSites(); } catch(e) {}
    mostrarLoading(false);
  }
  if (!allLocais.length) {
    mostrarLoading(true);
    try { allLocais = await dbCarregarLocais(); } catch(e) {}
    mostrarLoading(false);
  }

  const d = allDemandas.find(x => x.id === id);
  if (!d) { toast('Demanda não encontrada', 'error'); return; }
  editingId = id;
  const isPlan = perfil === 'planejamento';
  document.getElementById('aceite-titulo').textContent = isPlan ? 'Aceitar / Editar Demanda' : 'Aceitar Demanda';

  if (isPlan) {
    const situacaoOpts = ['Sistema parado - Crítico','Sistema parcialmente parado - Prioritário','Sistema com Restrição - Moderado','Sistema operando - Leve'];
    document.getElementById('aceite-content').innerHTML = `
      <div style="background:var(--bg3);border-radius:var(--radius);padding:8px 14px;margin-bottom:16px;font-size:12px;color:var(--text2)">
        ID (não editável): <span style="font-family:var(--mono);color:var(--text);font-weight:600">${d.id}</span></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Site *</label>
          <select class="form-control" id="ac-site" required onchange="atualizarLocaisPorSite('ac-site','ac-local')">
            ${buildSiteOptions(d.site || '')}
          </select></div>
        <div class="form-group"><label class="form-label">Local *</label>
          <select class="form-control" id="ac-local" required>
            ${buildLocalOptions(d.local || '', d.site || '')}
          </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">TAG *</label><input class="form-control" id="ac-tag" value="${esc(d.tag||'')}" required></div>
        <div class="form-group"><label class="form-label">Solicitante *</label><input class="form-control" id="ac-solicitante" value="${esc(d.solicitante||'')}" required></div>
      </div>
      <div class="form-group"><label class="form-label">Situação *</label>
        <select class="form-control" id="ac-situacao">
          ${situacaoOpts.map(o=>`<option value="${o}" ${d.situacao===o?'selected':''}>${o}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Descrição *</label>
        <textarea class="form-control" id="ac-descricao" rows="3" required>${esc(d.descricao||'')}</textarea></div>
      <hr class="section-sep">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Equipe *</label>
          <select class="form-control" id="ac-equipe">
            <option value="">— Selecionar —</option>
            ${['Manutenção Corretiva','Manutenção Preventiva','Inspeção','PCM'].map(e=>`<option ${d.equipe===e?'selected':''}>${e}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Prioridade</label>
          <select class="form-control" id="ac-prio">
            <option value="">— Sem prioridade —</option>
            ${['P0','P1','P2','P3','P4','P5'].map(p=>`<option ${d.prioridade===p?'selected':''}>${p}</option>`).join('')}
          </select></div>
      </div>
      <div class="form-group"><label class="form-label">Comentário do Planejamento</label>
        <textarea class="form-control" id="ac-comentario" rows="2" placeholder="Observações para a equipe...">${esc(d.comentarioPlan||'')}</textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-secondary" onclick="closeModal('modal-aceite')">Cancelar</button>
        <button class="btn btn-primary" onclick="confirmarAceite('planejamento')">Confirmar</button>
      </div>`;
  } else {
    const ro = 'background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);color:var(--text2);padding:9px 12px;font-size:14px;';
    document.getElementById('aceite-content').innerHTML = `
      <p style="font-size:12px;color:var(--text3);margin-bottom:14px">Campos da demanda são somente leitura. Defina equipe, prioridade e técnico para iniciar.</p>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ID</label><div style="${ro}font-family:var(--mono)">${esc(d.id)}</div></div>
        <div class="form-group"><label class="form-label">Data</label><div style="${ro}">${formatDate(d.data)}</div></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Site</label><div style="${ro}">${esc(d.site)}</div></div>
        <div class="form-group"><label class="form-label">Local</label><div style="${ro}">${esc(d.local)}</div></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">TAG</label><div style="${ro}font-family:var(--mono)">${esc(d.tag)}</div></div>
        <div class="form-group"><label class="form-label">Solicitante</label><div style="${ro}">${esc(d.solicitante)}</div></div>
      </div>
      <div class="form-group"><label class="form-label">Situação</label><div style="${ro}">${esc(d.situacao)}</div></div>
      <div class="form-group"><label class="form-label">Descrição</label><div style="${ro}min-height:60px;line-height:1.6;white-space:pre-wrap">${esc(d.descricao)}</div></div>
      ${d.foto?`<div class="form-group"><label class="form-label">Foto</label><img src="${d.foto}" style="max-width:100%;max-height:140px;object-fit:contain;border-radius:var(--radius);background:var(--bg3);padding:8px" alt="foto"></div>`:''}
      ${d.comentarioPlan?`<div style="background:var(--blue-bg);border:1px solid #58A6FF30;border-radius:var(--radius);padding:12px 14px;margin-bottom:14px">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--blue);margin-bottom:4px;font-weight:600">💬 Comentário do Planejamento</div>
        <p style="font-size:13px;color:var(--text2)">${esc(d.comentarioPlan)}</p></div>`:''}
      <hr class="section-sep">
      <p style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--text2);margin-bottom:12px;font-weight:600">Atribuição da manutenção</p>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Equipe</label>
          <select class="form-control" id="ac-equipe">
            <option value="">— Selecionar —</option>
            ${['Manutenção Corretiva','Manutenção Preventiva','Inspeção','PCM'].map(e=>`<option ${d.equipe===e?'selected':''}>${e}</option>`).join('')}
          </select></div>
        <div class="form-group"><label class="form-label">Prioridade</label>
          <select class="form-control" id="ac-prio">
            <option value="">— Sem prioridade —</option>
            ${['P0','P1','P2','P3','P4','P5'].map(p=>`<option ${d.prioridade===p?'selected':''}>${p}</option>`).join('')}
          </select></div>
      </div>
      <div class="form-group"><label class="form-label">Técnico Responsável</label>
        <input class="form-control" id="ac-tecnico" value="${esc(d.tecnico||'')}" placeholder="Nome do técnico"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-secondary" onclick="closeModal('modal-aceite')">Cancelar</button>
        <button class="btn btn-primary" onclick="confirmarAceite('manutencao')">Aceitar — Iniciar</button>
      </div>`;
  }
  openModal('modal-aceite');
}

async function confirmarAceite(perfil) {
  const d = allDemandas.find(x => x.id === editingId);
  if (!d) return;
  const isPlan = perfil === 'planejamento';
  const equipe = document.getElementById('ac-equipe').value || null;
  if (isPlan && !equipe) { toast('Selecione a equipe de destino.','error'); return; }
  d.equipe     = equipe;
  d.prioridade = document.getElementById('ac-prio').value || null;
  if (isPlan) {
    d.site          = document.getElementById('ac-site').value.trim();
    d.local         = document.getElementById('ac-local').value.trim();
    d.tag           = document.getElementById('ac-tag').value.trim().toUpperCase();
    d.solicitante   = document.getElementById('ac-solicitante').value.trim();
    d.situacao      = document.getElementById('ac-situacao').value;
    d.descricao     = document.getElementById('ac-descricao').value.trim();
    d.comentarioPlan= document.getElementById('ac-comentario').value.trim() || null;
    if (!d.status || d.status === 'Aberta') d.status = 'Em Análise';
  } else {
    d.tecnico = document.getElementById('ac-tecnico').value.trim() || null;
    d.status  = 'Em Andamento';
  }
  d.dataAceite = d.dataAceite || new Date().toISOString().split('T')[0];
  mostrarLoading(true);
  try {
    await dbSalvarDemanda(d);
    closeModal('modal-aceite');
    await loadDemandas();
    toast('Demanda ' + d.id + ' atualizada!', 'success');
  } catch(e) { toast('Erro: ' + e.message,'error'); }
  finally { mostrarLoading(false); }
}


async function openAnalise(id) {
  const d = allDemandas.find(x => x.id === id);
  if (!d) return;
  editingId = id;
  document.getElementById('analise-content').innerHTML = `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Nº OM</label>
        <input class="form-control" id="al-om" value="${esc(d.om||'')}" placeholder="Ex: OM-2025-0042" style="font-family:var(--mono)"></div>
      <div class="form-group"><label class="form-label">Técnico Responsável</label>
        <input class="form-control" id="al-tecnico" value="${esc(d.tecnico||'')}" placeholder="Nome"></div>
    </div>
    <div class="form-group"><label class="form-label">Análise da Causa Raiz</label>
      <textarea class="form-control" id="al-analise" rows="3" placeholder="Causa identificada...">${esc(d.analise||'')}</textarea></div>
    <div class="form-group"><label class="form-label">Ação de Resolução</label>
      <textarea class="form-control" id="al-resolucao" rows="3" placeholder="O que foi feito...">${esc(d.resolucao||'')}</textarea></div>
    <div class="form-group"><label class="form-label">Status Final</label>
      <select class="form-control" id="al-status">
        <option value="Em Andamento" ${d.status==='Em Andamento'?'selected':''}>Em Andamento</option>
        <option value="Concluída" ${d.status==='Concluída'?'selected':''}>Concluída</option>
        <option value="Improcedente" ${d.status==='Improcedente'?'selected':''}>Improcedente</option>
      </select></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
      <button class="btn btn-secondary" onclick="closeModal('modal-analise')">Cancelar</button>
      <button class="btn btn-primary" onclick="salvarAnalise()">Salvar</button>
    </div>`;
  openModal('modal-analise');
}

async function salvarAnalise() {
  const d = allDemandas.find(x => x.id === editingId);
  d.om       = document.getElementById('al-om').value.trim()       || null;
  d.tecnico  = document.getElementById('al-tecnico').value.trim()   || null;
  d.analise  = document.getElementById('al-analise').value.trim()   || null;
  d.resolucao= document.getElementById('al-resolucao').value.trim() || null;
  d.status   = document.getElementById('al-status').value;
  if (d.status === 'Concluída' || d.status === 'Improcedente') d.dataConclusao = new Date().toISOString().split('T')[0];
  mostrarLoading(true);
  try {
    await dbSalvarDemanda(d);
    closeModal('modal-analise');
    await loadDemandas();
    toast('Análise salva!', 'success');
  } catch(e) { toast('Erro: ' + e.message,'error'); }
  finally { mostrarLoading(false); }
}

// ---- Alterar Status (Admin) ----
async function openAlterarStatus(id) {
  const d = allDemandas.find(x => x.id === id);
  if (!d) return;
  editingId = id;
  document.getElementById('alterar-status-content').innerHTML = `
    <p style="font-size:12px;color:var(--text3);margin-bottom:14px">Você está alterando o status da demanda <b>${esc(d.id)}</b>. Esta ação é restrita a administradores.</p>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Status Atual</label>
        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);color:var(--text2);padding:9px 12px;font-size:14px;font-family:var(--mono)">${esc(d.status || 'Aberta')}</div></div>
      <div class="form-group"><label class="form-label">Novo Status *</label>
        <select class="form-control" id="alt-status">
          <option value="Aberta" ${d.status==='Aberta'?'selected':''}>Aberta</option>
          <option value="Em Análise" ${d.status==='Em Análise'?'selected':''}>Em Análise</option>
          <option value="Em Andamento" ${d.status==='Em Andamento'?'selected':''}>Em Andamento</option>
          <option value="Concluída" ${d.status==='Concluída'?'selected':''}>Concluída</option>
          <option value="Improcedente" ${d.status==='Improcedente'?'selected':''}>Improcedente</option>
          <option value="Cancelada" ${d.status==='Cancelada'?'selected':''}>Cancelada</option>
        </select></div>
    </div>
    <div class="form-group"><label class="form-label">Motivo da Alteração *</label>
      <textarea class="form-control" id="alt-motivo" rows="3" placeholder="Informe o motivo da alteração de status..." required></textarea></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
      <button class="btn btn-secondary" onclick="closeModal('modal-alterar-status')">Cancelar</button>
      <button class="btn btn-primary" onclick="confirmarAlterarStatus()">Confirmar Alteração</button>
    </div>`;
  openModal('modal-alterar-status');
}

async function confirmarAlterarStatus() {
  const d = allDemandas.find(x => x.id === editingId);
  if (!d) return;

  const novoStatus = document.getElementById('alt-status').value;
  const motivo = document.getElementById('alt-motivo').value.trim();

  if (!motivo) { toast('Informe o motivo da alteração.','error'); return; }
  if (novoStatus === d.status) { toast('Selecione um status diferente do atual.','error'); return; }

  // Atualiza o status
  d.status = novoStatus;

  // Se voltar para um status não-encerrado, limpa data de conclusão
  const encerrados = ['Concluída', 'Improcedente', 'Cancelada'];
  if (!encerrados.includes(novoStatus)) {
    d.dataConclusao = null;
  } else {
    // Se for para encerrado, define data de conclusão
    d.dataConclusao = new Date().toISOString().split('T')[0];
  }

  // Adiciona o motivo como comentário do planejamento (append)
  const logEntry = `[${new Date().toLocaleString('pt-BR')}] Admin alterou status de "${d.status}" para "${novoStatus}". Motivo: ${motivo}`;
  d.comentarioPlan = d.comentarioPlan ? d.comentarioPlan + "\n\n" + logEntry : logEntry;

  mostrarLoading(true);
  try {
    await dbSalvarDemanda(d);
    closeModal('modal-alterar-status');
    await loadDemandas();
    toast('Status da demanda ' + d.id + ' alterado com sucesso!', 'success');
  } catch(e) { toast('Erro: ' + e.message,'error'); }
  finally { mostrarLoading(false); }
}


// ---- Excluir ----
async function excluirDemanda(id) {
  if (!confirm('Excluir demanda ' + id + '? Esta ação é irreversível.')) return;
  mostrarLoading(true);
  try {
    await dbExcluirDemanda(id);
    await loadDemandas();
    toast('Demanda excluída.','info');
  } catch(e) { toast('Erro: ' + e.message,'error'); }
  finally { mostrarLoading(false); }
}

// ---- Excel ----
function exportExcel() {
  if (!filteredDemandas.length) { toast('Nenhuma demanda para exportar.','error'); return; }
  const rows = [
    ['ID','Data','Site','Local','TAG','Situação','Status','Prioridade','Equipe','Solicitante','Tempo Vida (dias)','Descrição','Nº OM','Análise','Resolução','Técnico','Data Conclusão','Comentário Planejamento'],
    ...filteredDemandas.map(d => [d.id,d.data,d.site,d.local,d.tag,d.situacao,d.status||'Aberta',d.prioridade||'',d.equipe||'',d.solicitante,calcularTempoVida(d).replace(' dias','').replace('< ','').replace(' dia',''),d.descricao,d.om||'',d.analise||'',d.resolucao||'',d.tecnico||'',d.dataConclusao||'',d.comentarioPlan||''])
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:16},{wch:12},{wch:18},{wch:22},{wch:14},{wch:36},{wch:14},{wch:10},{wch:22},{wch:22},{wch:16},{wch:60},{wch:16},{wch:40},{wch:40},{wch:22},{wch:14},{wch:50}];
  XLSX.utils.book_append_sheet(wb, ws, 'Demandas');
  XLSX.writeFile(wb, 'SPCI_Demandas_' + new Date().toISOString().split('T')[0] + '.xlsx');
  toast('Excel exportado!','success');
}

// ---- Utils UI ----
function mostrarLoading(show) {
  let el = document.getElementById('loading-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loading-overlay';
    el.className = 'loading-overlay';
    el.innerHTML = '<div class="spinner"></div><p>Aguarde…</p>';
    document.body.appendChild(el);
  }
  el.style.display = show ? 'flex' : 'none';
}

function showPage(name) {
  // Proteção de acesso à página de relatório
  if (name === 'relatorio' && !isRelatorioAccess()) {
    toast('Acesso negado. Apenas usuários de Manutenção, Planejamento ou Admin podem acessar o relatório.', 'error');
    showPage('demandas');
    return;
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  if (name === 'login') {
    renderLoginForm(window.loginTabAtivo || 'login');
    if (currentUser) {
      document.getElementById('login-form-area').style.display = 'none';
      document.getElementById('logado-area').style.display     = 'block';
      document.getElementById('logado-nome').textContent = currentUser.nome + ' (' + currentUser.role + ')';
    } else {
      document.getElementById('login-form-area').style.display = 'block';
      document.getElementById('logado-area').style.display     = 'none';
    }
  }
  if (name === 'sites') loadSites();
  if (name === 'locais') loadLocais();
  if (name === 'usuarios') loadUsuarios();
  if (name === 'relatorio') loadRelatorio();
}

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.addEventListener('DOMContentLoaded', () => {
  const modaisSemFecharNoOverlay = ['modal-nova', 'modal-site', 'modal-local', 'modal-aceite', 'modal-analise', 'modal-detalhe', 'modal-senha', 'modal-usuario'];
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.addEventListener('click', e => { 
        if (e.target === m && !modaisSemFecharNoOverlay.includes(m.id)) closeModal(m.id); 
      });
    });

  const btn = document.getElementById('btn-toggle-filtros');
  const card = document.getElementById('filtros-card');
  if (!btn || !card) return;

  const iconFilter = btn.querySelector('.icon-filter');
  const iconClose = btn.querySelector('.icon-close');
  const label = btn.querySelector('.btn-label');

  function applyState(isOpen) {
    if (isOpen) {
      card.classList.remove('collapsed', 'hidden');
    } else {
      card.classList.add('collapsed', 'hidden');
    }
    btn.setAttribute('aria-expanded', String(isOpen));
    if (label) label.textContent = isOpen ? 'Ocultar filtros' : 'Mostrar filtros';
    if (iconFilter) iconFilter.style.display = isOpen ? 'none' : 'inline-block';
    if (iconClose) iconClose.style.display = isOpen ? 'inline-block' : 'none';
  }

  applyState(false);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    applyState(!isOpen);
  });

  /*
  document.addEventListener('click', (ev) => {
    if (btn.contains(ev.target)) return;
    if (!card.classList.contains('collapsed') && !card.contains(ev.target)) {
      applyState(false);
    }
  });
  */
});

function toast(msg, type = 'info') {
  const c = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + type; t.textContent = msg; c.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}

function formatDate(d)    { if(!d) return '—'; const[y,m,dd]=d.split('-'); return `${dd}/${m}/${y}`; }
function formatDateTime(dt){ if(!dt) return '—'; const d=new Date(dt); return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }
function calcularTempoVida(d) {
  if (!d.data) return '—';
  
  // Parse a data como componentes YYYY-MM-DD para evitar problemas de timezone
  const [ano, mes, dia] = d.data.split('-').map(Number);
  
  // Cria datas em UTC para evitar qualquer interferência de timezone local
  const dataCadastro = Date.UTC(ano, mes - 1, dia);
  
  let dataFimMs;
  if (d.status === 'Concluída' && d.dataConclusao) {
    const [anoF, mesF, diaF] = d.dataConclusao.split('-').map(Number);
    dataFimMs = Date.UTC(anoF, mesF - 1, diaF);
  } else {
    const hoje = new Date();
    dataFimMs = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  }
  
  const diffMs = dataFimMs - dataCadastro;
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDias < 0) return '0 dias';
  if (diffDias === 0) return '< 1 dia';
  if (diffDias === 1) return '1 dia';
  return diffDias + ' dias';
}

function esc(s)           { if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }


// ============================================================
// RELATÓRIO DIÁRIO DE MANUTENÇÕES
// ============================================================

let relatorioFiltrado = [];
let relatorioSelecionados = new Set(); // IDs das demandas selecionadas para o relatório

async function loadRelatorio() {
  mostrarLoading(true);
  try {
    // Garante que demandas estão carregadas
    if (!allDemandas.length) {
      allDemandas = await dbCarregarDemandas();
    }

    // Define data padrão como hoje
    const hoje = new Date().toISOString().split('T')[0];
    const dataInput = document.getElementById('rel-data');
    if (dataInput && !dataInput.value) {
      dataInput.value = hoje;
    }

    aplicarFiltrosRelatorio();
  } catch(e) {
    console.error('[APP] Erro ao carregar relatório:', e);
    toast('Erro ao carregar relatório: ' + e.message, 'error');
  } finally {
    mostrarLoading(false);
  }
}

function aplicarFiltrosRelatorio() {
  const data = document.getElementById('rel-data').value;

  // Filtra apenas demandas concluídas ou improcedentes com data de conclusão
  relatorioFiltrado = allDemandas.filter(d => {
    const st = d.status || 'Aberta';
    if (st !== 'Concluída' && st !== 'Improcedente') return false;
    if (data && d.dataConclusao !== data) return false;
    if (!data && !d.dataConclusao) return false;
    return true;
  });

  // Ordena por data de conclusão decrescente, depois por prioridade
  const pd = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4, P5: 5 };
  relatorioFiltrado.sort((a, b) => {
    const dataDiff = new Date(b.dataConclusao || b.data) - new Date(a.dataConclusao || a.data);
    if (dataDiff !== 0) return dataDiff;
    return (pd[a.prioridade] ?? 99) - (pd[b.prioridade] ?? 99);
  });

  renderRelatorioTable();
  renderRelatorioStats();
  atualizarContadorSelecionados();
}

function limparFiltrosRelatorio() {
  const dataInput = document.getElementById('rel-data');
  if (dataInput) dataInput.value = '';
  relatorioSelecionados.clear();
  aplicarFiltrosRelatorio();
}

function renderRelatorioTable() {
  const tbody = document.getElementById('relatorio-tbody');
  const empty = document.getElementById('empty-relatorio');
  const checkAll = document.getElementById('rel-check-all');

  if (!relatorioFiltrado.length) { 
    if (tbody) tbody.innerHTML = ''; 
    if (empty) empty.style.display = 'block'; 
    if (checkAll) checkAll.checked = false;
    return; 
  }
  if (empty) empty.style.display = 'none';

  // Verifica se todos estão selecionados
  const todosSelecionados = relatorioFiltrado.length > 0 && 
    relatorioFiltrado.every(d => relatorioSelecionados.has(d.id));
  if (checkAll) checkAll.checked = todosSelecionados;

  if (!tbody) return;
  tbody.innerHTML = relatorioFiltrado.map(d => {
    const selecionado = relatorioSelecionados.has(d.id) ? 'checked' : '';
    return `
    <tr>
      <td style="text-align:center" onclick="event.stopPropagation()">
        <input type="checkbox" ${selecionado} onchange="toggleSelecaoRelatorio('${d.id}', this.checked)" style="cursor:pointer;width:16px;height:16px;accent-color:var(--blue-light)">
      </td>
      <td class="td-mono">${esc(d.id)}</td>
      <td class="td-mono">${formatDate(d.dataConclusao)}</td>
      <td>${esc(d.site)}</td>
      <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(d.local)}">${esc(d.local)}</td>
      <td class="td-mono">${esc(d.tag)}</td>
      <td>${situacaoBadge(d.situacao)}</td>
      <td>${equipeBadge(d.equipe)}</td>
      <td>${esc(d.tecnico || '—')}</td>
      <td class="td-mono">${esc(d.om || '—')}</td>
      <td>${statusBadge(d.status)}</td>
    </tr>`;
  }).join('');
}

function renderRelatorioStats() {
  const grid = document.getElementById('relatorio-stats');
  if (!grid) return;
  const d = relatorioFiltrado;
  const total = d.length;
  const selecionados = relatorioSelecionados.size;
  const criticos = d.filter(x => x.situacao?.includes('Crítico')).length;
  const prioritarios = d.filter(x => x.situacao?.includes('Prioritário')).length;
  const moderados = d.filter(x => x.situacao?.includes('Moderado')).length;
  const leves = d.filter(x => x.situacao?.includes('Leve')).length;

  grid.innerHTML = `
    <div class="stat-card"><div class="stat-label">Total</div><div class="stat-value">${total}</div><div class="stat-sub">manutenções</div></div>
    <div class="stat-card"><div class="stat-label">Selecionados</div><div class="stat-value" style="color:var(--blue)">${selecionados}</div><div class="stat-sub">para PDF</div></div>
    <div class="stat-card"><div class="stat-label">Críticas</div><div class="stat-value" style="color:var(--red)">${criticos}</div><div class="stat-sub">paradas</div></div>
    <div class="stat-card"><div class="stat-label">Prioritárias</div><div class="stat-value" style="color:var(--orange)">${prioritarios}</div><div class="stat-sub">parciais</div></div>
    <div class="stat-card"><div class="stat-label">Moderadas</div><div class="stat-value" style="color:var(--yellow)">${moderados}</div><div class="stat-sub">restrições</div></div>
    <div class="stat-card"><div class="stat-label">Leves</div><div class="stat-value" style="color:var(--green)">${leves}</div><div class="stat-sub">operando</div></div>
  `;
}

// ---- Seleção de demandas para relatório ----

function toggleSelecaoRelatorio(id, checked) {
  if (checked) {
    relatorioSelecionados.add(id);
  } else {
    relatorioSelecionados.delete(id);
  }
  atualizarContadorSelecionados();
  renderRelatorioTable();
  renderRelatorioStats();
}

function selecionarTodosRelatorio(selecionar) {
  if (selecionar) {
    relatorioFiltrado.forEach(d => relatorioSelecionados.add(d.id));
  } else {
    relatorioFiltrado.forEach(d => relatorioSelecionados.delete(d.id));
  }
  atualizarContadorSelecionados();
  renderRelatorioTable();
  renderRelatorioStats();
}

function toggleSelectAllRelatorio(checkbox) {
  selecionarTodosRelatorio(checkbox.checked);
}

function atualizarContadorSelecionados() {
  const el = document.getElementById('rel-selecionados-count');
  if (el) el.textContent = relatorioSelecionados.size;
}

async function gerarRelatorioPDF() {
  // Usa apenas as demandas selecionadas
  const demandasParaRelatorio = relatorioFiltrado.filter(d => relatorioSelecionados.has(d.id));

  if (!demandasParaRelatorio.length) { 
    toast('Nenhuma manutenção selecionada. Marque as demandas desejadas.', 'error'); 
    return; 
  }

  mostrarLoading(true);
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const dataRel = document.getElementById('rel-data').value;
    const dataFormatada = dataRel ? formatDate(dataRel) : 'Todas as datas';

    // ── Cores ──
    const C_TXT    = '#1a1a1a', C_TXT2 = '#555555', C_BORDA = '#bbbbbb';
    const C_HEADER = '#f0f0f0', C_ALT   = '#f8f8f8', C_ACCENT = '#1F6FEB';
    const C_RED    = '#dc2626', C_ORANGE = '#ea580c', C_YELLOW = '#ca8a04', C_GREEN = '#16a34a';

    function hexRgb(hex) {
      const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return r ? [parseInt(r[1],16), parseInt(r[2],16), parseInt(r[3],16)] : [0,0,0];
    }
    function setT(doc, hex) { const [r,g,b]=hexRgb(hex); doc.setTextColor(r,g,b); }
    function setF(doc, hex) { const [r,g,b]=hexRgb(hex); doc.setFillColor(r,g,b); }
    function setD(doc, hex) { const [r,g,b]=hexRgb(hex); doc.setDrawColor(r,g,b); }

    const M = 6;
    const W = 198;
    const PAGE_H = 297;
    const FOOTER_H = 5;
    const ASSIN_H = 14;
    const USABLE_H = PAGE_H - M - FOOTER_H - ASSIN_H;

    function drawGlobalHeader(pageNum, totalPages) {
      setF(doc, C_ACCENT);
      doc.rect(0, 0, 210, 5, 'F');
      doc.setTextColor(255,255,255);
      doc.setFontSize(6); doc.setFont('helvetica','bold');
      doc.text('Relatorio Diario de Manutencoes — Saneamento e SPCI', M, 3.5);
      doc.setFontSize(5.5); doc.setFont('helvetica','normal');
      doc.text(`Data: ${dataFormatada}  |  Total: ${demandasParaRelatorio.length} manut.  |  Pag. ${pageNum}/${totalPages}`, 145, 3.5);
    }

    function drawResumoCards(y) {
      function norm(s) { return s ? s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() : ''; }
      const criticos = demandasParaRelatorio.filter(x => norm(x.situacao).includes('critico')).length;
      const prioritarios = demandasParaRelatorio.filter(x => norm(x.situacao).includes('prioritario')).length;
      const moderados = demandasParaRelatorio.filter(x => norm(x.situacao).includes('moderado')).length;
      const leves = demandasParaRelatorio.filter(x => norm(x.situacao).includes('leve')).length;

      const cards = [
        { l:'Total', v:demandasParaRelatorio.length, c:C_ACCENT },
        { l:'Criticas', v:criticos, c:C_RED },
        { l:'Prioritarias', v:prioritarios, c:C_ORANGE },
        { l:'Moderadas', v:moderados, c:C_YELLOW },
        { l:'Leves', v:leves, c:C_GREEN }
      ];

      const cw = 37, ch = 6.5;
      let cx = M;
      cards.forEach(cd => {
        setD(doc, C_BORDA); doc.setLineWidth(0.15);
        doc.roundedRect(cx, y, cw, ch, 0.6, 0.6, 'S');
        const [cr,cg,cb] = hexRgb(cd.c);
        doc.setFillColor(cr,cg,cb); doc.rect(cx, y, cw, 1, 'F');
        setT(doc, C_TXT2); doc.setFontSize(7); doc.setFont('helvetica','normal');
        doc.text(cd.l + ':', cx + 2, y + 4.2);
        setT(doc, C_TXT); doc.setFontSize(10); doc.setFont('helvetica','bold');
        doc.text(String(cd.v), cx + cw - 2, y + 4.2, { align: 'right' });
        cx += cw + 2;
      });
      return y + ch + 1.5;
    }

    function addSecCompact(y, titulo, texto) {
      if (!texto || !texto.trim()) return y;
      y += 2;
      const maxW = W - 10;
      const linhas = doc.splitTextToSize(texto, maxW);
      const lineH = 3.5;
      const h = Math.max(linhas.length * lineH + 5, 8);

      setT(doc, C_ACCENT); doc.setFontSize(7); doc.setFont('helvetica','bold');
      doc.text(titulo.toUpperCase(), M, y);
      y += 2.2;
      setF(doc, '#fafafa'); setD(doc, '#dddddd'); doc.setLineWidth(0.1);
      doc.rect(M, y, W, h, 'F'); doc.rect(M, y, W, h, 'S');
      setT(doc, C_TXT); doc.setFontSize(9); doc.setFont('helvetica','normal');
      doc.text(linhas, M + 2.5, y + 3, { align: 'left', lineHeightFactor: 1.1 });
      return y + h + 1.5;
    }

    function drawDemandaHeader(y, d, idx, total) {
      const sitColor = d.situacao?.includes('Critico') ? C_RED :
                       d.situacao?.includes('Prioritario') ? C_ORANGE :
                       d.situacao?.includes('Moderado') ? C_YELLOW : C_GREEN;
      const [cr,cg,cb] = hexRgb(sitColor);
      doc.setFillColor(cr,cg,cb); doc.rect(M, y, 1.2, 9, 'F');

      setT(doc, C_TXT); doc.setFontSize(10); doc.setFont('helvetica','bold');
      doc.text(`${d.id}`, M+3, y+3);
      setT(doc, C_TXT2); doc.setFontSize(7); doc.setFont('helvetica','normal');
      doc.text(`${idx+1}/${total}  |  Concluida: ${formatDate(d.dataConclusao)}  |  Site: ${d.site||'—'}  |  Local: ${d.local||'—'}`, M+3, y+5.5);

      const prio = d.prioridade || '—';
      const prioW = doc.getTextWidth(prio) + 4;
      const prioColor = d.prioridade === 'P0' ? '#2D0A0A' :
                        d.prioridade === 'P1' ? C_RED :
                        d.prioridade === 'P2' ? C_ORANGE :
                        d.prioridade === 'P3' ? C_YELLOW : '#666';
      const [pr,pg,pb] = hexRgb(prioColor);
      doc.setFillColor(pr,pg,pb); doc.setDrawColor(pr,pg,pb);
      doc.roundedRect(M + W - prioW - 1, y+0.5, prioW, 3.2, 0.6, 0.6, 'FD');
      doc.setTextColor(255,255,255); doc.setFontSize(7); doc.setFont('helvetica','bold');
      doc.text(prio, M + W - prioW/2 - 1, y+2.7, { align: 'center' });

      return y + 7.5;
    }

    function drawInfoGrid(y, d) {
      const gridH = 8;
      setF(doc, C_ALT); setD(doc, C_BORDA); doc.setLineWidth(0.1);
      doc.rect(M, y, W, gridH, 'F'); doc.rect(M, y, W, gridH, 'S');

      const colW = W / 4;
      const labels = ['TAG', 'EQUIPE', 'TECNICO', 'OM'];
      const vals = [d.tag||'—', d.equipe||'—', d.tecnico||'—', d.om||'—'];

      setT(doc, C_TXT); doc.setFontSize(7); doc.setFont('helvetica','normal');
      for (let i=0; i<4; i++) {
        const labelText = labels[i] + ': ';
        const labelW = doc.getTextWidth(labelText);
        setT(doc, C_TXT2); doc.setFont('helvetica','bold');
        doc.text(labelText, M + i*colW + 1.5, y+2.8);
        setT(doc, C_TXT); doc.setFont('helvetica','normal');
        doc.text(vals[i].substring(0, 18), M + i*colW + 1.5 + labelW, y+2.8);
      }

      const labels2 = ['SITUACAO', 'PRIORIDADE', 'STATUS', 'SOLICITANTE'];
      const sitCurta = d.situacao ? (d.situacao.split(' - ')[1] || d.situacao) : '—';
      const vals2 = [sitCurta, d.prioridade||'—', d.status||'—', d.solicitante||'—'];

      setT(doc, C_TXT); doc.setFontSize(7); doc.setFont('helvetica','normal');
      for (let i=0; i<4; i++) {
        const labelText = labels2[i] + ': ';
        const labelW = doc.getTextWidth(labelText);
        setT(doc, C_TXT2); doc.setFont('helvetica','bold');
        doc.text(labelText, M + i*colW + 1.5, y+5.2);
        setT(doc, C_TXT); doc.setFont('helvetica','normal');
        doc.text(vals2[i].substring(0, 18), M + i*colW + 1.5 + labelW, y+5.2);
      }

      return y + gridH + 1;
    }


    function drawAssinaturas(y) {
      const terco = (W - 16) / 3;
      const gap = 8;
      const linhaY = y + 8;

      setD(doc, C_TXT); doc.setLineWidth(0.25);
      doc.line(M, linhaY, M + terco, linhaY);
      doc.line(M + terco + gap, linhaY, M + terco*2 + gap, linhaY);
      doc.line(M + terco*2 + gap*2, linhaY, M + W, linhaY);

      setT(doc, C_TXT); doc.setFontSize(8); doc.setFont('helvetica','normal');
      doc.text('Técnico 1', M + terco/2, linhaY + 3.5, { align: 'center' });
      doc.text('Técnico 2', M + terco + gap + terco/2, linhaY + 3.5, { align: 'center' });
      doc.text('Encarregado', M + terco*2 + gap*2 + terco/2, linhaY + 3.5, { align: 'center' });

      return linhaY + 6;
    }

    function drawFooter(pageNum, totalPages) {
      setD(doc, C_BORDA); doc.setLineWidth(0.12);
      doc.line(M, 293, M+W, 293);
      setT(doc, C_TXT2); doc.setFontSize(6.5); doc.setFont('helvetica','normal');
      doc.text(`Pagina ${pageNum} de ${totalPages}`, M, 295.5);
      doc.text('Saneamento e SPCI — Gestao de Demandas', 78, 295.5);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 152, 295.5);
    }

    let currentPage = 1;
    let y = 9;

    drawGlobalHeader(currentPage, 1);
    y = drawResumoCards(y);

    function estimateDemandaHeight(d) {
      let h = 7.5;      // header
      h += 9;           // info grid + gap
      if (d.descricao) {
        const lines = Math.ceil((d.descricao.length) / 110);
        h += Math.max(lines * 3.6 + 5, 8) + 5.7;
      }
      if (d.analise) {
        const lines = Math.ceil((d.analise.length) / 110);
        h += Math.max(lines * 3.6 + 5, 8) + 5.7;
      }
      if (d.resolucao) {
        const lines = Math.ceil((d.resolucao.length) / 110);
        h += Math.max(lines * 3.6 + 5, 8) + 5.7;
      }
      if (d.comentarioPlan) {
        const lines = Math.ceil((d.comentarioPlan.length) / 110);
        h += Math.max(lines * 3.6 + 5, 8) + 5.7;
      }
      h += 1.5;
      return h;
    }

    demandasParaRelatorio.forEach((d, idx) => {
      const neededH = estimateDemandaHeight(d);

      if (y + neededH > USABLE_H && idx > 0) {
        drawAssinaturas(USABLE_H + M);
        drawFooter(currentPage, 1);
        doc.addPage();
        currentPage++;
        y = 8;
        setF(doc, C_ACCENT);
        doc.rect(0, 0, 210, 5, 'F');
        doc.setTextColor(255,255,255);
        doc.setFontSize(6); doc.setFont('helvetica','bold');
        doc.text('Relatorio Diario de Manutencoes — Saneamento e SPCI', M, 3.5);
      }

      if (idx > 0 && y > 20) {
        setD(doc, '#e0e0e0'); doc.setLineWidth(0.15);
        doc.line(M, y-0.6, M+W, y-0.6);
      }

      y = drawDemandaHeader(y, d, idx, demandasParaRelatorio.length);
      y = drawInfoGrid(y, d);
      y = addSecCompact(y, 'Demanda', d.descricao);
      y = addSecCompact(y, 'Analise', d.analise);
      y = addSecCompact(y, 'Resolucao', d.resolucao);
      y = addSecCompact(y, 'Comentario do Planejamento', d.comentarioPlan);
      y += 1;
    });

    drawAssinaturas(USABLE_H + M);
    drawFooter(currentPage, currentPage);

    doc.setPage(1);
    drawGlobalHeader(1, currentPage);

    for (let i = 2; i <= currentPage; i++) {
      doc.setPage(i);
      setF(doc, C_ACCENT);
      doc.rect(0, 0, 210, 5, 'F');
      doc.setTextColor(255,255,255);
      doc.setFontSize(6); doc.setFont('helvetica','bold');
      doc.text('Relatorio Diario de Manutencoes — Saneamento e SPCI', M, 3.5);
      doc.setFontSize(5.5); doc.setFont('helvetica','normal');
      doc.text(`Pag. ${i}/${currentPage}`, 170, 3.5);
    }

    for (let i = 1; i <= currentPage; i++) {
      doc.setPage(i);
      drawFooter(i, currentPage);
    }

    doc.save(`Relatorio_Manutencoes_${dataRel || 'todas'}.pdf`);
    toast('PDF exportado com sucesso!', 'success');
  } catch(e) {
    console.error('Erro ao gerar PDF:', e);
    toast('Erro ao gerar PDF: ' + e.message, 'error');
  } finally {
    mostrarLoading(false);
  }
}


// ---- Init ----
async function init() {
  try {
    await openIDB();
    await seedUsuarios();
    await initAuth();

    // SEMPRE carrega demandas primeiro — página principal
    await loadDemandas();

    // SEMPRE mostra a página de demandas como principal
    // Login só é acessado via clique no botão "Entrar"
    showPage('demandas');

    await atualizarBadgeOffline();
  } catch (e) {
    console.error('Erro na inicialização:', e);
    toast('Erro ao inicializar o app. Verifique sua conexão.', 'error');
    showPage('demandas');
  }
}

// ---- Filtro -----
function toggleMultiSelect(id) {
  document.getElementById(id).classList.toggle('open');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.multi-select')) {
    document.querySelectorAll('.multi-select.open').forEach(el => el.classList.remove('open'));
  }
});

function getMultiSelectValues(id) {
  const container = document.getElementById(id);
  const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
  const values = Array.from(checkboxes).map(cb => cb.value);
  const label = container.querySelector('.multi-select-label');
  if (values.length === 0) {
    label.textContent = 'Status';
  } else if (values.length === 1) {
    label.textContent = values[0];
  } else {
    label.textContent = `${values.length} selecionados`;
  }
  return values;
}

init();
