const API_URL = 'http://localhost:8000';

// Theme
const THEME_KEY = 'pdfai_theme';
const themeToggle = document.getElementById('themeToggle');
const sunSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const moonSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.classList.add('light');
    themeToggle.title = 'Switch to dark mode';
    themeToggle.innerHTML = moonSVG;
  } else {
    document.documentElement.classList.remove('light');
    themeToggle.title = 'Switch to light mode';
    themeToggle.innerHTML = sunSVG;
  }
}

applyTheme(localStorage.getItem(THEME_KEY) || 'dark');

themeToggle.addEventListener('click', () => {
  const next = document.documentElement.classList.contains('light') ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
const filenameEl = document.getElementById('resultsFilename');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');
const confirmModal = document.getElementById('confirmModal');
const modalCancel = document.getElementById('modalCancel');
const modalConfirm = document.getElementById('modalConfirm');
const copyBtn = document.getElementById('copyBtn');
const copyBtnLabel = document.getElementById('copyBtnLabel');

const STORAGE_KEY = 'pdfai_history';

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map(e => ({ ...e, timestamp: new Date(e.timestamp) }));
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// History: [{ id, filename, data, timestamp }]
let history = loadHistory();
let activeId = history[0]?.id ?? null;

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById(`tab${capitalize(tab.dataset.tab)}`).classList.remove('hidden');
  });
});

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Copy to clipboard
copyBtn.addEventListener('click', () => {
  const activeTab = document.querySelector('.tab.active')?.dataset.tab;
  let text = '';

  if (activeTab === 'text') {
    text = document.getElementById('textContent').textContent;
  } else if (activeTab === 'tables') {
    text = document.getElementById('tablesContent').innerText;
  } else if (activeTab === 'structure') {
    text = document.getElementById('structureContent').innerText;
  } else if (activeTab === 'raw') {
    text = document.getElementById('rawContent').textContent;
  }

  navigator.clipboard.writeText(text).then(() => {
    copyBtnLabel.textContent = 'Copied!';
    copyBtn.classList.add('copy-btn--success');
    setTimeout(() => {
      copyBtnLabel.textContent = 'Copy';
      copyBtn.classList.remove('copy-btn--success');
    }, 2000);
  });
});

// Drag & drop
uploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file?.type === 'application/pdf') processFile(file);
});
uploadZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) processFile(fileInput.files[0]);
});

clearHistoryBtn.addEventListener('click', () => {
  confirmModal.classList.remove('hidden');
});

modalCancel.addEventListener('click', () => {
  confirmModal.classList.add('hidden');
});

confirmModal.addEventListener('click', e => {
  if (e.target === confirmModal) confirmModal.classList.add('hidden');
});

modalConfirm.addEventListener('click', () => {
  confirmModal.classList.add('hidden');
  history = [];
  activeId = null;
  saveHistory();
  renderHistorySidebar();
  resultsEl.classList.add('hidden');
});

// Restore sidebar (and last-viewed file) on load
renderHistorySidebar();
if (history.length) {
  const first = history[0];
  renderResults(first.filename, first.data);
}

function showStatus(type, message) {
  statusEl.className = `status ${type}`;
  if (type === 'loading') {
    statusEl.innerHTML = `<div class="spinner"></div><span>${message}</span>`;
  } else {
    statusEl.innerHTML = `<span>${message}</span>`;
  }
  statusEl.classList.remove('hidden');
}

function hideStatus() {
  statusEl.classList.add('hidden');
}

async function processFile(file) {
  resultsEl.classList.add('hidden');
  showStatus('loading', `Processing ${file.name}...`);

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${API_URL}/extract`, { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Server error' }));
      throw new Error(err.detail || 'Extraction failed');
    }
    const data = await res.json();
    hideStatus();
    addToHistory(file.name, data);
    renderResults(file.name, data);
  } catch (err) {
    showStatus('error', `Error: ${err.message}`);
  }
}

function addToHistory(filename, data) {
  const entry = {
    id: Date.now(),
    filename,
    data,
    timestamp: new Date(),
  };
  history.unshift(entry);
  activeId = entry.id;
  saveHistory();
  renderHistorySidebar();
}

function renderHistorySidebar() {
  if (!history.length) {
    historyList.innerHTML = '<li class="history-empty">No files yet</li>';
    return;
  }

  historyList.innerHTML = history.map(entry => {
    const isActive = entry.id === activeId;
    const time = formatTime(entry.timestamp);
    const tableCount = entry.data.tables?.length ?? 0;
    const wordCount = entry.data.text ? entry.data.text.split(/\s+/).filter(Boolean).length : 0;
    return `
      <li class="history-item${isActive ? ' active' : ''}" data-id="${entry.id}">
        <div class="history-filename" title="${escape(entry.filename)}">${escape(entry.filename)}</div>
        <div class="history-meta">
          <span>${time}</span>
          <span>${wordCount.toLocaleString()} words</span>
          ${tableCount ? `<span>${tableCount} table${tableCount > 1 ? 's' : ''}</span>` : ''}
        </div>
        <button class="history-delete" data-id="${entry.id}" title="Remove">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </li>
    `;
  }).join('');

  historyList.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', e => {
      if (e.target.closest('.history-delete')) return;
      const id = Number(item.dataset.id);
      const entry = history.find(h => h.id === id);
      if (!entry) return;
      activeId = id;
      renderHistorySidebar();
      hideStatus();
      renderResults(entry.filename, entry.data);
    });
  });

  historyList.querySelectorAll('.history-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      history = history.filter(h => h.id !== id);
      if (activeId === id) {
        activeId = history[0]?.id ?? null;
        if (activeId) {
          const next = history.find(h => h.id === activeId);
          renderResults(next.filename, next.data);
        } else {
          resultsEl.classList.add('hidden');
        }
      }
      saveHistory();
      renderHistorySidebar();
    });
  });
}

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

function renderResults(filename, data) {
  filenameEl.textContent = filename;

  // Text tab
  const textEl = document.getElementById('textContent');
  textEl.textContent = data.text || '(No text extracted)';

  // Tables tab
  const tablesEl = document.getElementById('tablesContent');
  if (data.tables?.length) {
    tablesEl.innerHTML = data.tables.map((table, i) => {
      const rows = table.data || [];
      if (!rows.length) return '';
      return `
        <div class="table-item">
          <h3>Table ${i + 1}</h3>
          <table>
            <thead><tr>${(rows[0] || []).map(h => `<th>${escape(h)}</th>`).join('')}</tr></thead>
            <tbody>${rows.slice(1).map(row =>
              `<tr>${row.map(cell => `<td>${escape(cell)}</td>`).join('')}</tr>`
            ).join('')}</tbody>
          </table>
        </div>
      `;
    }).join('');
  } else {
    tablesEl.innerHTML = '<div class="empty-state">No tables found in this PDF</div>';
  }

  // Structure tab
  const structureEl = document.getElementById('structureContent');
  if (data.structure?.length) {
    structureEl.innerHTML = `<ul class="structure-list">${
      data.structure.map(item => `
        <li class="structure-item">
          <span class="structure-label">${escape(item.type)}</span>
          <span class="structure-text">${escape(item.text)}</span>
        </li>
      `).join('')
    }</ul>`;
  } else {
    structureEl.innerHTML = '<div class="empty-state">No structure extracted</div>';
  }

  // Raw tab
  document.getElementById('rawContent').textContent = JSON.stringify(data, null, 2);

  resultsEl.classList.remove('hidden');

  // Reset to text tab
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
  document.querySelector('[data-tab="text"]').classList.add('active');
  document.getElementById('tabText').classList.remove('hidden');
}

function escape(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
