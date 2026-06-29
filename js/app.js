// ============================================================
// SANEAMENTO E SPCI — Lógica Principal
// ============================================================

let allDemandas      = [];
let filteredDemandas = [];
let editingId        = null;

// ---- ID ----
function gerarID() {
  const d = new Date();
  return 'DM-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + '-' + Math.floor(1000 + Math.random() * 9000);
}

// ---- Carregar ----
async function loadDemandas() {
  mostrarLoading(true);
  try {
    allDemandas = await dbCarregarDemandas();
    allDemandas.sort((a, b) => new Date(b.data) - new Date(a.data));
  } catch(e) {
    toast('Erro ao carregar demandas: ' + e.message, 'error');
  } finally {
    mostrarLoading(false);
  }
  popularFiltros();
  aplicarFiltros();
}

// ---- Filtros ----
function popularFiltros() {
  const sites  = [...new Set(allDemandas.map(d => d.site).filter(Boolean))].sort();
  const locais = [...new Set(allDemandas.map(d => d.local).filter(Boolean))].sort();
  const sols   = [...new Set(allDemandas.map(d => d.solicitante).filter(Boolean))].sort();
  const fs = document.getElementById('f-site'), fl = document.getElementById('f-local'), fso = document.getElementById('f-solicitante');
  const sv = fs.value, lv = fl.value, solv = fso.value;
  fs.innerHTML  = '<option value="">Todos os sites</option>' + sites.map(s  => `<option${s===sv?' selected':''}>${s}</option>`).join('');
  fl.innerHTML  = '<option value="">Todos os locais</option>' + locais.map(l => `<option${l===lv?' selected':''}>${l}</option>`).join('');
  fso.innerHTML = '<option value="">Todos solicitantes</option>' + sols.map(s => `<option${s===solv?' selected':''}>${s}</option>`).join('');
}

function aplicarFiltros() {
  const busca    = document.getElementById('f-busca').value.toLowerCase();
  const dIni     = document.getElementById('f-data-ini').value;
  const dFim     = document.getElementById('f-data-fim').value;
  const site     = document.getElementById('f-site').value;
  const local    = document.getElementById('f-local').value;
  const situacao = document.getElementById('f-situacao').value;
  const prio     = document.getElementById('f-prioridade').value;
  // const status   = document.getElementById('f-status').value;
  const statusSelecionados = getMultiSelectValues('f-status');
  
  const equipe   = document.getElementById('f-equipe').value;
  const sol      = document.getElementById('f-solicitante').value;

  filteredDemandas = allDemandas.filter(d => {
    const st = d.status || 'Aberta';
    if (busca && ![d.id,d.tag,d.local,d.descricao,d.solicitante,d.om].some(v => (v||'').toLowerCase().includes(busca))) return false;
    if (dIni && d.data < dIni) return false;
    if (dFim && d.data > dFim) return false;
    if (site && d.site !== site) return false;
    if (local && d.local !== local) return false;
    if (situacao && d.situacao !== situacao) return false;
    if (prio && d.prioridade !== prio) return false;
    // if (status && st !== status) return false;
    if (statusSelecionados.length > 0 && !statusSelecionados.includes(d.status)) return false;
    
    if (equipe && d.equipe !== equipe) return false;
    if (sol && d.solicitante !== sol) return false;
    return true;
  });

  const pd = { P0:0, P1:1, P2:2, P3:3, P4:4, P5:5 };
  filteredDemandas.sort((a, b) => {
    const dd = new Date(b.data) - new Date(a.data);
    if (dd !== 0) return dd;
    return (pd[a.prioridade] ?? 99) - (pd[b.prioridade] ?? 99);
  });
  renderDemandasTable();
  renderStats();
}

function limparFiltros() {
  ['f-busca','f-data-ini','f-data-fim','f-site','f-local','f-situacao','f-prioridade','f-equipe','f-solicitante']
    .forEach(id => document.getElementById(id).value = '');
    document.querySelectorAll('#f-status input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelector('#f-status .multi-select-label').textContent = 'Todos status';
  aplicarFiltros();
}

// ---- Badges ----
function situacaoBadge(s) {
  const map = { 'Sistema parado - Crítico':'badge-red', 'Sistema parcialmente parado - Prioritário':'badge-orange', 'Sistema com Restrição - Moderado':'badge-yellow', 'Sistema operando - Leve':'badge-green' };
  return `<span class="badge ${map[s]||'badge-gray'}">${s ? s.split(' - ')[1]||s : '—'}</span>`;
}
function statusBadge(s) {
  const map = { 'Aberta':'badge-blue', 'Em Análise':'badge-purple', 'Em Andamento':'badge-orange', 'Concluída':'badge-green', 'Cancelada':'badge-gray' };
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
  return `<span class="badge ${map[e]||'badge-gray'}" style="font-size:11px">${e}</span>`;
}

// ---- Tabela ----
function renderDemandasTable() {
  const tbody = document.getElementById('demandas-tbody');
  const empty = document.getElementById('empty-demandas');
  if (!filteredDemandas.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  const isPlan = currentUser?.role === 'planejamento';
  const isMan  = currentUser?.role === 'manutencao';

  tbody.innerHTML = filteredDemandas.map(d => {
    const st       = d.status || 'Aberta';
    const encerrada = st === 'Concluída' || st === 'Cancelada';
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
      <td onclick="event.stopPropagation()"><div style="display:flex;gap:4px">${acoes}</div></td>
    </tr>`;
  }).join('');
}

function renderStats() {
  const d    = allDemandas;
  const grid = document.getElementById('stats-grid');
  grid.innerHTML = `
    <div class="stat-card"><div class="stat-label">Total</div><div class="stat-value">${d.length}</div><div class="stat-sub">demandas</div></div>
    <div class="stat-card"><div class="stat-label">Abertas</div><div class="stat-value" style="color:var(--blue)">${d.filter(x=>!x.status||x.status==='Aberta').length}</div><div class="stat-sub">aguardando</div></div>
    <div class="stat-card"><div class="stat-label">Em Análise</div><div class="stat-value" style="color:var(--purple)">${d.filter(x=>x.status==='Em Análise').length}</div><div class="stat-sub">planejadas</div></div>
    <div class="stat-card"><div class="stat-label">Em Andamento</div><div class="stat-value" style="color:var(--orange)">${d.filter(x=>x.status==='Em Andamento').length}</div><div class="stat-sub">em execução</div></div>
    <div class="stat-card"><div class="stat-label">Críticos</div><div class="stat-value" style="color:var(--red)">${d.filter(x=>x.situacao?.includes('Crítico')).length}</div><div class="stat-sub">sistema parado</div></div>
    <div class="stat-card"><div class="stat-label">Concluídas</div><div class="stat-value" style="color:var(--green)">${d.filter(x=>x.status==='Concluída').length}</div><div class="stat-sub">resolvidas</div></div>
  `;
}

// ---- Nova / Duplicar ----
function openNovaDemanda(sourceId) {
  const src   = sourceId ? allDemandas.find(x => x.id === sourceId) : null;
  const isDup = !!src;
  document.getElementById('nova-titulo').textContent = isDup ? 'Duplicar Demanda' : 'Nova Demanda de Manutenção';
  editingId = null;
  const isPlan = currentUser?.role === 'planejamento';
  const isMan  = currentUser?.role === 'manutencao';

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
        <input class="form-control" id="nd-site" value="${esc(src?.site||'')}" placeholder="Ex: ETE Norte" required></div>
      <div class="form-group"><label class="form-label">Local *</label>
        <input class="form-control" id="nd-local" value="${esc(src?.local||'')}" placeholder="Ex: Blower A — Sala 01" required></div>
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
    <div class="form-group">
      <label class="form-label">Foto do Defeito</label>
      <div class="photo-upload">
        <input type="file" accept="image/*" id="nd-foto" onchange="previewFoto()">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" style="margin-bottom:6px;opacity:.4"><rect x="2" y="6" width="28" height="20" rx="3" stroke="currentColor" stroke-width="1.5"/><circle cx="16" cy="16" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M11 6l2-4h6l2 4" stroke="currentColor" stroke-width="1.5" /></svg>
        <p style="color:var(--text3);font-size:12px">Clique ou arraste uma imagem</p>
        <img id="foto-preview" class="photo-preview-img" alt="preview">
      </div>
    </div>
    ${secaoDir}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
      <button type="button" class="btn btn-secondary" onclick="closeModal('modal-nova')">Cancelar</button>
      <button type="button" class="btn btn-primary" onclick="submitNovaDemanda()">Registrar Demanda</button>
    </div>`;
  openModal('modal-nova');
}

function previewFoto() {
  const f = document.getElementById('nd-foto').files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = e => { const img = document.getElementById('foto-preview'); img.src = e.target.result; img.style.display = 'block'; };
  r.readAsDataURL(f);
}

async function submitNovaDemanda() {
  const site       = document.getElementById('nd-site').value.trim();
  const local      = document.getElementById('nd-local').value.trim();
  const tag        = document.getElementById('nd-tag').value.trim().toUpperCase();
  const solicitante= document.getElementById('nd-solicitante').value.trim();
  const situacao   = document.getElementById('nd-situacao').value;
  const descricao  = document.getElementById('nd-descricao').value.trim();
  if (!site||!local||!tag||!solicitante||!situacao||!descricao) { toast('Preencha todos os campos obrigatórios.','error'); return; }

  const fotoInput = document.getElementById('nd-foto');
  let foto = null;
  if (fotoInput?.files[0]) {
    foto = await new Promise(r => { const fr = new FileReader(); fr.onload = e => r(e.target.result); fr.readAsDataURL(fotoInput.files[0]); });
  }
  const equipeEl   = document.getElementById('nd-equipe');
  const prioEl     = document.getElementById('nd-prioridade');
  const equipe     = equipeEl ? equipeEl.value || null : null;
  const prioridade = prioEl   ? prioEl.value   || null : null;
  const isMan      = currentUser?.role === 'manutencao';
  const statusInicial = isMan ? 'Em Análise' : (equipe ? 'Em Análise' : 'Aberta');

  const d = {
    id: gerarID(), data: new Date().toISOString().split('T')[0], dataHora: new Date().toISOString(),
    site, local, tag, solicitante, situacao, descricao, foto,
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

// ---- Detalhe ----
function verDetalhe(id) {
  const d = allDemandas.find(x => x.id === id);
  if (!d) return;
  document.getElementById('detalhe-titulo').textContent = 'Demanda ' + d.id;
  document.getElementById('detalhe-data').textContent   = 'Registrada em ' + formatDateTime(d.dataHora) + ' por ' + d.solicitante;
  const steps = ['Aberta','Em Análise','Em Andamento','Concluída'];
  const si    = steps.indexOf(d.status || 'Aberta');
  const stepHtml = steps.map((s,i) => `<div class="status-step"><div class="step-dot ${i<si?'done':i===si?'active':''}">${i<si?'✓':i+1}</div><div class="step-label">${s}</div></div>`).join('');
  const st       = d.status || 'Aberta';
  const encerrada= st === 'Concluída' || st === 'Cancelada';
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
      <button class="btn btn-secondary btn-sm" onclick="closeModal('modal-detalhe');openNovaDemanda('${d.id}')">
        <svg class="icon" viewBox="0 0 16 16" fill="currentColor"><path d="M5 1h7l3 3v9H5V1zm2 0v3h6M1 5h4v10h8"/></svg> Duplicar
      </button>
      ${isPlan&&!encerrada?`<button class="btn btn-secondary btn-sm" onclick="closeModal('modal-detalhe');openAceite('${d.id}','planejamento')">Aceitar / Editar</button>
        <button class="btn btn-danger btn-sm" onclick="closeModal('modal-detalhe');excluirDemanda('${d.id}')">Excluir</button>`:''}
      ${isMan&&!encerrada?`<button class="btn btn-secondary btn-sm" onclick="closeModal('modal-detalhe');openAceite('${d.id}','manutencao')">Aceitar / Editar</button>`:''}
      ${isMan&&st==='Em Andamento'?`<button class="btn btn-primary btn-sm" onclick="closeModal('modal-detalhe');openAnalise('${d.id}')">Lançar Análise</button>`:''}
    </div>`;
  openModal('modal-detalhe');
}

// ---- Aceite Planejamento ----
function openAceite(id, perfil) {
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
        <div class="form-group"><label class="form-label">Site *</label><input class="form-control" id="ac-site" value="${esc(d.site||'')}" required></div>
        <div class="form-group"><label class="form-label">Local *</label><input class="form-control" id="ac-local" value="${esc(d.local||'')}" required></div>
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
    // Manutenção: somente leitura + atribuição
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
      ${d.foto?`<div class="form-group"><label class="form-label">Foto</label><img src="${d.foto}" style="max-width:100%;max-height:140px;object-fit:contain;border-radius:var(--radius);background:var(--bg3)" alt="foto"></div>`:''}
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

// ---- Análise ----
function openAnalise(id) {
  const d = allDemandas.find(x => x.id === id);
  if (!d) return;
  editingId = id;
  document.getElementById('analise-content').innerHTML = `
    <p style="color:var(--text2);font-size:13px;margin-bottom:16px">${d.id} — <span style="font-family:var(--mono)">${esc(d.tag)}</span> — ${esc(d.local)}</p>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Número da OM</label>
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
  if (d.status === 'Concluída') d.dataConclusao = new Date().toISOString().split('T')[0];
  mostrarLoading(true);
  try {
    await dbSalvarDemanda(d);
    closeModal('modal-analise');
    await loadDemandas();
    toast('Análise salva!', 'success');
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
    ['ID','Data','Site','Local','TAG','Situação','Status','Prioridade','Equipe','Solicitante','Descrição','Nº OM','Análise','Resolução','Técnico','Data Conclusão','Comentário Planejamento'],
    ...filteredDemandas.map(d => [d.id,d.data,d.site,d.local,d.tag,d.situacao,d.status||'Aberta',d.prioridade||'',d.equipe||'',d.solicitante,d.descricao,d.om||'',d.analise||'',d.resolucao||'',d.tecnico||'',d.dataConclusao||'',d.comentarioPlan||''])
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:16},{wch:12},{wch:18},{wch:22},{wch:14},{wch:36},{wch:14},{wch:10},{wch:22},{wch:22},{wch:60},{wch:16},{wch:40},{wch:40},{wch:22},{wch:14},{wch:50}];
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
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  if (name === 'login') {
    renderLoginForm(loginTabAtivo);
    if (currentUser) {
      document.getElementById('login-form-area').style.display = 'none';
      document.getElementById('logado-area').style.display     = 'block';
      document.getElementById('logado-nome').textContent = currentUser.name + ' (' + currentUser.role + ')';
    }
  }
}

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });
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
function esc(s)           { if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ---- Init ----
async function init() {
  await openIDB();
  await initAuth();
  await loadDemandas();
  await atualizarBadgeOffline();
  renderLoginForm('planejamento');
}
init();

// ---- Filtro -----
function toggleMultiSelect(id) {
  document.getElementById(id).classList.toggle('open');
}

// Fecha dropdowns ao clicar fora
document.addEventListener('click', (e) => {
  if (!e.target.closest('.multi-select')) {
    document.querySelectorAll('.multi-select.open').forEach(el => el.classList.remove('open'));
  }
});
function getMultiSelectValues(id) {
  const container = document.getElementById(id);
  const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
  const values = Array.from(checkboxes).map(cb => cb.value);
  
  // Atualiza label do trigger
  const label = container.querySelector('.multi-select-label');
  if (values.length === 0) {
    label.textContent = 'Todos status';
  } else if (values.length === 1) {
    label.textContent = values[0];
  } else {
    label.textContent = `${values.length} selecionados`;
  }
  
  return values;
}
