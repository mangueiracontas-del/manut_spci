// ============================================================
// SANEAMENTO E SPCI — Camada de Dados
// Supabase (online) + IndexedDB (offline fallback)
// ============================================================

// ---- IndexedDB (cache offline) ----
const IDB_NAME = 'spci_cache', IDB_VERSION = 1;
let idb;

function openIDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('demandas'))
        d.createObjectStore('demandas', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('queue'))
        d.createObjectStore('queue', { keyPath: 'qid', autoIncrement: true });
      if (!d.objectStoreNames.contains('config'))
        d.createObjectStore('config', { keyPath: 'key' });
    };
    req.onsuccess  = e => { idb = e.target.result; res(idb); };
    req.onerror    = () => rej(req.error);
  });
}
const idbAll    = s => new Promise((r,j)=>{ const tx=idb.transaction(s,'readonly'); const q=tx.objectStore(s).getAll(); q.onsuccess=()=>r(q.result); q.onerror=()=>j(q.error); });
const idbPut    = (s,o) => new Promise((r,j)=>{ const tx=idb.transaction(s,'readwrite'); const q=tx.objectStore(s).put(o); q.onsuccess=()=>r(q.result); q.onerror=()=>j(q.error); });
const idbDelete = (s,k) => new Promise((r,j)=>{ const tx=idb.transaction(s,'readwrite'); const q=tx.objectStore(s).delete(k); q.onsuccess=()=>r(); q.onerror=()=>j(q.error); });
const idbGet    = (s,k) => new Promise((r,j)=>{ const tx=idb.transaction(s,'readonly'); const q=tx.objectStore(s).get(k); q.onsuccess=()=>r(q.result); q.onerror=()=>j(q.error); });

// ---- Supabase helpers ----
function sbHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': window.SUPABASE_ANON,
    'Authorization': 'Bearer ' + window.SUPABASE_ANON,
    'Prefer': 'return=representation'
  };
}

async function sbSelect(table, params = '') {
  const r = await fetch(`${window.SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: sbHeaders()
  });
  if (!r.ok) throw new Error(`Supabase SELECT erro: ${r.status}`);
  return r.json();
}

async function sbUpsert(table, row) {
  const r = await fetch(`${window.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...sbHeaders(), 'Prefer': 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(row)
  });
  if (!r.ok) throw new Error(`Supabase UPSERT erro: ${r.status}`);
  return r.json();
}

async function sbDelete(table, id) {
  const r = await fetch(`${window.SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: sbHeaders()
  });
  if (!r.ok) throw new Error(`Supabase DELETE erro: ${r.status}`);
}

// ---- Mapeamento de colunas (camelCase JS ↔ snake_case DB) ----
function toDb(d) {
  return {
    id:              d.id,
    data:            d.data,
    data_hora:       d.dataHora,
    site:            d.site,
    local:           d.local,
    tag:             d.tag,
    solicitante:     d.solicitante,
    situacao:        d.situacao,
    descricao:       d.descricao,
    foto:            d.foto || null,
    status:          d.status || 'Aberta',
    prioridade:      d.prioridade || null,
    equipe:          d.equipe || null,
    comentario_plan: d.comentarioPlan || null,
    analise:         d.analise || null,
    resolucao:       d.resolucao || null,
    om:              d.om || null,
    tecnico:         d.tecnico || null,
    data_aceite:     d.dataAceite || null,
    data_conclusao:  d.dataConclusao || null
  };
}

function fromDb(r) {
  return {
    id:            r.id,
    data:          r.data,
    dataHora:      r.data_hora,
    site:          r.site,
    local:         r.local,
    tag:           r.tag,
    solicitante:   r.solicitante,
    situacao:      r.situacao,
    descricao:     r.descricao,
    foto:          r.foto,
    status:        r.status,
    prioridade:    r.prioridade,
    equipe:        r.equipe,
    comentarioPlan:r.comentario_plan,
    analise:       r.analise,
    resolucao:     r.resolucao,
    om:            r.om,
    tecnico:       r.tecnico,
    dataAceite:    r.data_aceite,
    dataConclusao: r.data_conclusao
  };
}

// ---- API pública usada pelo app ----

/** Carrega todas as demandas. Online = Supabase; Offline = cache IDB */
async function dbCarregarDemandas() {
  if (!navigator.onLine) {
    const cached = await idbAll('demandas');
    return cached.map(fromDb);
  }
  try {
    const rows = await sbSelect('demandas', 'order=data.desc,data_hora.desc');
    // Atualiza cache local
    for (const r of rows) await idbPut('demandas', r);
    return rows.map(fromDb);
  } catch (err) {
    console.warn('Supabase offline, usando cache:', err);
    const cached = await idbAll('demandas');
    return cached.map(fromDb);
  }
}

/** Salva/atualiza uma demanda. Online = Supabase; Offline = enfileira */
async function dbSalvarDemanda(demanda) {
  const row = toDb(demanda);
  // Sempre salva no cache local
  await idbPut('demandas', row);
  if (navigator.onLine) {
    await sbUpsert('demandas', row);
  } else {
    await idbPut('queue', { action: 'upsert', table: 'demandas', row, ts: Date.now() });
    atualizarBadgeOffline();
  }
}

/** Exclui uma demanda */
async function dbExcluirDemanda(id) {
  await idbDelete('demandas', id);
  if (navigator.onLine) {
    await sbDelete('demandas', id);
  } else {
    await idbPut('queue', { action: 'delete', table: 'demandas', id, ts: Date.now() });
    atualizarBadgeOffline();
  }
}

/** Configuração (senhas) — somente IndexedDB local */
async function dbGetConfig(key) {
  const r = await idbGet('config', key);
  return r ? r.value : null;
}
async function dbSetConfig(key, value) {
  await idbPut('config', { key, value });
}

/** Sincroniza a fila offline ao reconectar */
async function sincronizarFila() {
  if (!navigator.onLine) return;
  const fila = await idbAll('queue');
  if (!fila.length) return;
  for (const item of fila) {
    try {
      if (item.action === 'upsert') await sbUpsert(item.table, item.row);
      if (item.action === 'delete') await sbDelete(item.table, item.id);
      await idbDelete('queue', item.qid);
    } catch (err) {
      console.warn('Erro ao sincronizar item:', err);
    }
  }
  atualizarBadgeOffline();
  toast(`Fila sincronizada com Supabase!`, 'success');
}

async function atualizarBadgeOffline() {
  const fila = await idbAll('queue');
  const badge = document.getElementById('offline-badge');
  const cnt   = document.getElementById('pending-count');
  if (fila.length > 0) { badge.classList.add('show'); cnt.textContent = fila.length; }
  else badge.classList.remove('show');
}

window.addEventListener('online',  () => { toast('Conexão restaurada. Sincronizando…', 'info'); sincronizarFila(); });
window.addEventListener('offline', () => { toast('Sem conexão. Dados salvos localmente.', 'info'); atualizarBadgeOffline(); });
