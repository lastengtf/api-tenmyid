// Clean, focused, high-performance UI for TEN API Gateway
export function renderDashboardHtml() {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Gateway - api.ten.my.id</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --surface: #101726;
      --surface-border: #1e293b;
      --primary: #38bdf8;
      --primary-hover: #0ea5e9;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --danger: #ef4444;
      --success: #10b981;
      --warning: #f59e0b;
      --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Utilitas */
    .hidden { display: none !important; }
    .mono { font-family: var(--font-mono); }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
      text-decoration: none;
    }
    .btn-primary { background: var(--primary); color: #04111d; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-secondary { background: var(--surface); border-color: var(--surface-border); color: var(--text); }
    .btn-secondary:hover { background: #1a2333; }
    .btn-danger { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: #fca5a5; }
    .btn-danger:hover { background: rgba(239, 68, 68, 0.25); }
    .btn-sm { padding: 4px 10px; font-size: 12px; }

    /* Input & Form */
    .form-group { margin-bottom: 14px; }
    .form-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
    .form-control {
      width: 100%;
      background: #0b1120;
      border: 1px solid var(--surface-border);
      color: var(--text);
      padding: 9px 12px;
      border-radius: 6px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s;
    }
    .form-control:focus { border-color: var(--primary); }
    .form-check { display: flex; align-items: center; gap: 8px; margin-top: 6px; cursor: pointer; font-size: 13px; }
    .form-check input { width: 16px; height: 16px; accent-color: var(--primary); cursor: pointer; }

    /* Login View */
    #login-view {
      margin: auto;
      width: 100%;
      max-width: 380px;
      padding: 24px;
    }
    .login-card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 28px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .brand-title {
      font-size: 20px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    }
    .brand-badge {
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-weight: 600;
    }
    .brand-subtitle { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; }

    /* Dashboard Header */
    header {
      background: var(--surface);
      border-bottom: 1px solid var(--surface-border);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .nav-tabs {
      display: flex;
      gap: 8px;
      padding: 14px 24px;
      border-bottom: 1px solid var(--surface-border);
      background: #0c121e;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tab-btn:hover { color: var(--text); background: rgba(255,255,255,0.04); }
    .tab-btn.active { color: var(--primary); background: rgba(56, 189, 248, 0.12); }

    /* Content Area */
    main {
      flex: 1;
      padding: 24px;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .section-title { font-size: 16px; font-weight: 700; }

    /* Tables */
    .table-container {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      overflow-x: auto;
    }
    table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
    th {
      background: #0d1422;
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 10px 14px;
      border-bottom: 1px solid var(--surface-border);
    }
    td { padding: 12px 14px; border-bottom: 1px solid #141c2c; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255,255,255,0.02); }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      font-family: var(--font-mono);
    }
    .badge-get { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .badge-post { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
    .badge-put { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .badge-delete { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .badge-all { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
    .badge-active { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .badge-inactive { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
      padding: 16px;
    }
    .modal-card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      width: 100%;
      max-width: 520px;
      padding: 20px 24px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.6);
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .modal-title { font-size: 16px; font-weight: 700; }
    .modal-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 18px;
      cursor: pointer;
    }
    .modal-close:hover { color: var(--text); }

    /* Grid for quick stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 16px;
    }
    .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 6px; }
    .stat-val { font-size: 24px; font-weight: 700; font-family: var(--font-mono); color: var(--primary); }

    /* Tester Result Area */
    .test-box {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 20px;
    }
    pre {
      background: #070a11;
      padding: 14px;
      border-radius: 6px;
      border: 1px solid #141c2c;
      font-family: var(--font-mono);
      font-size: 12px;
      overflow-x: auto;
      max-height: 350px;
      color: #38bdf8;
    }

    #alert-toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1e293b;
      border: 1px solid var(--surface-border);
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 13px;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      display: none;
    }
  </style>
</head>
<body>

  <!-- Toast Notification -->
  <div id="alert-toast"></div>

  <!-- LOGIN VIEW -->
  <div id="login-view">
    <div class="login-card">
      <div class="brand-title">
        <span>TEN API GATEWAY</span>
      </div>
      <div class="brand-subtitle">api.ten.my.id</div>

      <form id="login-form">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" id="login-email" class="form-control" required placeholder="admin@ten.my.id" autocomplete="username">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="login-password" class="form-control" required placeholder="••••••••" autocomplete="current-password">
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px;">Masuk</button>
      </form>
    </div>
  </div>

  <!-- DASHBOARD VIEW -->
  <div id="dashboard-view" class="hidden">
    <header>
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-weight: 700; font-size: 15px;">API GATEWAY</span>
        <span class="brand-badge">api.ten.my.id</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <span id="user-display" class="mono" style="font-size: 12px; color: var(--text-muted);"></span>
        <button id="btn-logout" class="btn btn-secondary btn-sm">Keluar</button>
      </div>
    </header>

    <div class="nav-tabs">
      <button class="tab-btn active" data-tab="tab-routes">Routes</button>
      <button class="tab-btn" data-tab="tab-keys">API Keys</button>
      <button class="tab-btn" data-tab="tab-tester">Tester</button>
      <button class="tab-btn" data-tab="tab-info">Info & KV</button>
    </div>

    <main>
      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Routes</div>
          <div class="stat-val" id="stat-routes">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Active API Keys</div>
          <div class="stat-val" id="stat-keys">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">KV Storage</div>
          <div class="stat-val" style="font-size: 16px; color: var(--success); padding-top: 6px;">API_KV Connected</div>
        </div>
      </div>

      <!-- TAB: ROUTES -->
      <div id="tab-routes" class="tab-content">
        <div class="section-header">
          <div class="section-title">Daftar Endpoint Route</div>
          <button id="btn-add-route" class="btn btn-primary btn-sm">+ Tambah Route</button>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Prefix Path</th>
                <th>Target Upstream URL</th>
                <th>Methods</th>
                <th>Auth</th>
                <th>Status</th>
                <th style="text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody id="routes-tbody">
              <tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Memuat routes...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB: API KEYS -->
      <div id="tab-keys" class="tab-content hidden">
        <div class="section-header">
          <div class="section-title">API Keys (Autentikasi Klien)</div>
          <button id="btn-add-key" class="btn btn-primary btn-sm">+ Buat Key Baru</button>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nama Client</th>
                <th>API Key</th>
                <th>Dibuat</th>
                <th>Status</th>
                <th style="text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody id="keys-tbody">
              <tr><td colspan="5" style="text-align:center; color: var(--text-muted);">Memuat API keys...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB: TESTER -->
      <div id="tab-tester" class="tab-content hidden">
        <div class="section-header">
          <div class="section-title">API Gateway Tester</div>
        </div>
        <div class="test-box">
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <select id="test-method" class="form-control" style="width: 110px;">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
            <input type="text" id="test-path" class="form-control mono" placeholder="/v1/users">
            <button id="btn-send-test" class="btn btn-primary">Kirim Request</button>
          </div>

          <div class="form-group">
            <label class="form-label">Optional API Key Header (x-api-key)</label>
            <input type="text" id="test-key" class="form-control mono" placeholder="ten_live_...">
          </div>

          <div class="form-group">
            <label class="form-label">Request Body (JSON - opsional)</label>
            <textarea id="test-body" class="form-control mono" rows="3" placeholder='{"query": "sample"}'></textarea>
          </div>

          <div style="margin-top: 16px;">
            <div class="form-label">Response Output <span id="test-status" class="mono" style="margin-left:8px; color: var(--primary);"></span></div>
            <pre id="test-response">// Respon upstream gateway akan tampil di sini</pre>
          </div>
        </div>
      </div>

      <!-- TAB: INFO & KV -->
      <div id="tab-info" class="tab-content hidden">
        <div class="section-header">
          <div class="section-title">Konfigurasi & Informasi Sistem</div>
        </div>
        <div class="table-container" style="padding: 20px;">
          <table style="max-width: 800px;">
            <tr>
              <td style="width: 220px; color: var(--text-muted);">Domain API</td>
              <td class="mono">api.ten.my.id</td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">KV Binding</td>
              <td class="mono">API_KV</td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">KV ID</td>
              <td class="mono">c20b11151e224d98acf1bea7469700fb</td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">Dashboard Login Auth</td>
              <td>Environment Variable Cloudflare: <code>ADMIN_EMAIL</code> & <code>ADMIN_PASSWORD</code></td>
            </tr>
            <tr>
              <td style="color: var(--text-muted);">Cara Pasang Custom Header Gateway</td>
              <td>Kirim header <code>x-api-key: [key]</code> atau <code>Authorization: Bearer [key]</code> untuk endpoint yang mengaktifkan Auth.</td>
            </tr>
          </table>
        </div>
      </div>
    </main>
  </div>

  <!-- MODAL: ADD / EDIT ROUTE -->
  <div id="modal-route" class="modal-overlay hidden">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title" id="modal-route-title">Tambah Route</div>
        <button class="modal-close" id="btn-close-route-modal">&times;</button>
      </div>
      <form id="form-route">
        <input type="hidden" id="route-id">
        <div class="form-group">
          <label class="form-label">Nama Route</label>
          <input type="text" id="route-name" class="form-control" required placeholder="User Service API">
        </div>
        <div class="form-group">
          <label class="form-label">Prefix Path (di api.ten.my.id)</label>
          <input type="text" id="route-prefix" class="form-control mono" required placeholder="/v1/users">
        </div>
        <div class="form-group">
          <label class="form-label">Target Upstream URL</label>
          <input type="url" id="route-target" class="form-control mono" required placeholder="https://backend-service.com/api">
        </div>
        <div class="form-group">
          <label class="form-label">Metode HTTP yang diizinkan</label>
          <input type="text" id="route-methods" class="form-control mono" value="ALL" placeholder="ALL atau GET, POST, PUT">
        </div>
        <div class="form-group">
          <label class="form-label">Custom Header Tambahan (JSON, opsional)</label>
          <input type="text" id="route-headers" class="form-control mono" placeholder='{"X-Gateway": "ten"}'>
        </div>
        <div class="form-group">
          <label class="form-check">
            <input type="checkbox" id="route-auth"> Wajibkan API Key untuk route ini
          </label>
          <label class="form-check">
            <input type="checkbox" id="route-strip" checked> Hapus prefix path saat forward ke upstream
          </label>
          <label class="form-check">
            <input type="checkbox" id="route-active" checked> Aktifkan route sekarang
          </label>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" id="btn-cancel-route">Batal</button>
          <button type="submit" class="btn btn-primary">Simpan</button>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: CREATE API KEY -->
  <div id="modal-key" class="modal-overlay hidden">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">Buat API Key Baru</div>
        <button class="modal-close" id="btn-close-key-modal">&times;</button>
      </div>
      <form id="form-key">
        <div class="form-group">
          <label class="form-label">Nama Client / Aplikasi</label>
          <input type="text" id="key-name" class="form-control" required placeholder="Mobile App v1">
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" id="btn-cancel-key">Batal</button>
          <button type="submit" class="btn btn-primary">Generate Key</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    // State
    let authToken = localStorage.getItem('ten_gateway_token') || '';
    let routes = [];
    let apiKeys = [];

    // Helper: Toast
    function showToast(msg, duration = 3000) {
      const toast = document.getElementById('alert-toast');
      toast.innerText = msg;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, duration);
    }

    // Helper: Fetch with Auth
    async function apiRequest(endpoint, options = {}) {
      const headers = options.headers || {};
      if (authToken) {
        headers['Authorization'] = 'Bearer ' + authToken;
      }
      headers['Content-Type'] = 'application/json';

      try {
        const res = await fetch(endpoint, { ...options, headers });
        if (res.status === 401) {
          logout();
          throw new Error('Sesi telah berakhir, silakan login kembali.');
        }
        return await res.json();
      } catch (err) {
        throw err;
      }
    }

    // Auth Check
    async function checkAuth() {
      if (!authToken) {
        showLogin();
        return;
      }
      try {
        const res = await apiRequest('/api/auth/me');
        if (res && res.authenticated) {
          showDashboard(res.email);
          loadAllData();
        } else {
          showLogin();
        }
      } catch (e) {
        showLogin();
      }
    }

    function showLogin() {
      document.getElementById('login-view').classList.remove('hidden');
      document.getElementById('dashboard-view').classList.add('hidden');
    }

    function showDashboard(email) {
      document.getElementById('login-view').classList.add('hidden');
      document.getElementById('dashboard-view').classList.remove('hidden');
      document.getElementById('user-display').innerText = email || 'Admin';
    }

    function logout() {
      authToken = '';
      localStorage.removeItem('ten_gateway_token');
      showLogin();
    }

    // Data Loading
    async function loadAllData() {
      await Promise.all([loadRoutes(), loadKeys()]);
    }

    async function loadRoutes() {
      try {
        const res = await apiRequest('/api/manage/routes');
        routes = res.routes || [];
        renderRoutes();
        document.getElementById('stat-routes').innerText = routes.length;
      } catch (err) {
        showToast('Gagal memuat routes: ' + err.message);
      }
    }

    async function loadKeys() {
      try {
        const res = await apiRequest('/api/manage/keys');
        apiKeys = res.keys || [];
        renderKeys();
        document.getElementById('stat-keys').innerText = apiKeys.filter(k => k.isActive).length;
      } catch (err) {
        showToast('Gagal memuat API keys: ' + err.message);
      }
    }

    // Render Routes Table
    function renderRoutes() {
      const tbody = document.getElementById('routes-tbody');
      if (routes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-muted); padding: 24px;">Belum ada route. Klik "+ Tambah Route" di atas.</td></tr>';
        return;
      }
      tbody.innerHTML = routes.map(r => {
        const methodClass = (r.methods === 'ALL' || !r.methods) ? 'badge-all' : 'badge-get';
        return \`
          <tr>
            <td style="font-weight: 600;">\${escapeHtml(r.name)}</td>
            <td class="mono" style="color: var(--primary);">\${escapeHtml(r.prefix)}</td>
            <td class="mono" style="color: var(--text-muted); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="\${escapeHtml(r.target)}">\${escapeHtml(r.target)}</td>
            <td><span class="badge \${methodClass}">\${escapeHtml(r.methods || 'ALL')}</span></td>
            <td>\${r.authRequired ? '<span class="badge badge-active">API Key</span>' : '<span style="color:var(--text-muted);font-size:12px;">Public</span>'}</td>
            <td><span class="badge \${r.isActive ? 'badge-active' : 'badge-inactive'}">\${r.isActive ? 'Aktif' : 'Non-aktif'}</span></td>
            <td style="text-align: right;">
              <button class="btn btn-secondary btn-sm" onclick="editRoute('\${r.id}')">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteRoute('\${r.id}')">Hapus</button>
            </td>
          </tr>
        \`;
      }).join('');
    }

    // Render Keys Table
    function renderKeys() {
      const tbody = document.getElementById('keys-tbody');
      if (apiKeys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 24px;">Belum ada API Key. Klik "+ Buat Key Baru" di atas.</td></tr>';
        return;
      }
      tbody.innerHTML = apiKeys.map(k => \`
        <tr>
          <td style="font-weight: 600;">\${escapeHtml(k.name)}</td>
          <td class="mono" style="color: var(--primary);">
            <span>\${escapeHtml(k.key)}</span>
            <button class="btn btn-secondary btn-sm" style="margin-left: 8px; padding: 2px 6px;" onclick="copyText('\${escapeHtml(k.key)}')">Salin</button>
          </td>
          <td style="color: var(--text-muted); font-size: 12px;">\${new Date(k.createdAt).toLocaleDateString('id-ID')}</td>
          <td><span class="badge \${k.isActive ? 'badge-active' : 'badge-inactive'}">\${k.isActive ? 'Aktif' : 'Dicabut'}</span></td>
          <td style="text-align: right;">
            <button class="btn btn-danger btn-sm" onclick="deleteKey('\${k.id}')">Hapus</button>
          </td>
        </tr>
      \`).join('');
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function copyText(txt) {
      navigator.clipboard.writeText(txt);
      showToast('Key berhasil disalin ke clipboard');
    }

    // Event Handlers
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.token) {
          authToken = data.token;
          localStorage.setItem('ten_gateway_token', authToken);
          showDashboard(email);
          loadAllData();
          showToast('Login berhasil!');
        } else {
          alert(data.error || 'Login gagal. Periksa email & password.');
        }
      } catch (err) {
        alert('Gagal menghubungi server: ' + err.message);
      }
    });

    document.getElementById('btn-logout').addEventListener('click', logout);

    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        btn.classList.add('active');
        document.getElementById(btn.getAttribute('data-tab')).classList.remove('hidden');
      });
    });

    // Route Modal
    const modalRoute = document.getElementById('modal-route');
    document.getElementById('btn-add-route').addEventListener('click', () => {
      document.getElementById('modal-route-title').innerText = 'Tambah Route';
      document.getElementById('form-route').reset();
      document.getElementById('route-id').value = '';
      document.getElementById('route-methods').value = 'ALL';
      document.getElementById('route-strip').checked = true;
      document.getElementById('route-active').checked = true;
      modalRoute.classList.remove('hidden');
    });

    document.getElementById('btn-close-route-modal').addEventListener('click', () => modalRoute.classList.add('hidden'));
    document.getElementById('btn-cancel-route').addEventListener('click', () => modalRoute.classList.add('hidden'));

    window.editRoute = (id) => {
      const r = routes.find(item => item.id === id);
      if (!r) return;
      document.getElementById('modal-route-title').innerText = 'Edit Route';
      document.getElementById('route-id').value = r.id;
      document.getElementById('route-name').value = r.name || '';
      document.getElementById('route-prefix').value = r.prefix || '';
      document.getElementById('route-target').value = r.target || '';
      document.getElementById('route-methods').value = r.methods || 'ALL';
      document.getElementById('route-headers').value = r.headers ? JSON.stringify(r.headers) : '';
      document.getElementById('route-auth').checked = !!r.authRequired;
      document.getElementById('route-strip').checked = r.stripPrefix !== false;
      document.getElementById('route-active').checked = r.isActive !== false;
      modalRoute.classList.remove('hidden');
    };

    window.deleteRoute = async (id) => {
      if (!confirm('Yakin ingin menghapus route ini?')) return;
      try {
        await apiRequest('/api/manage/routes/' + id, { method: 'DELETE' });
        showToast('Route berhasil dihapus');
        loadRoutes();
      } catch (err) {
        alert(err.message);
      }
    };

    document.getElementById('form-route').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('route-id').value;
      let customHeaders = null;
      const headersRaw = document.getElementById('route-headers').value.trim();
      if (headersRaw) {
        try { customHeaders = JSON.parse(headersRaw); } catch(e) {
          alert('Format JSON Headers tidak valid');
          return;
        }
      }

      const payload = {
        name: document.getElementById('route-name').value,
        prefix: document.getElementById('route-prefix').value.trim(),
        target: document.getElementById('route-target').value.trim(),
        methods: document.getElementById('route-methods').value.trim() || 'ALL',
        headers: customHeaders,
        authRequired: document.getElementById('route-auth').checked,
        stripPrefix: document.getElementById('route-strip').checked,
        isActive: document.getElementById('route-active').checked
      };

      try {
        if (id) {
          await apiRequest('/api/manage/routes/' + id, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
          await apiRequest('/api/manage/routes', { method: 'POST', body: JSON.stringify(payload) });
        }
        modalRoute.classList.add('hidden');
        showToast('Route berhasil disimpan');
        loadRoutes();
      } catch (err) {
        alert(err.message);
      }
    });

    // Key Modal
    const modalKey = document.getElementById('modal-key');
    document.getElementById('btn-add-key').addEventListener('click', () => {
      document.getElementById('form-key').reset();
      modalKey.classList.remove('hidden');
    });
    document.getElementById('btn-close-key-modal').addEventListener('click', () => modalKey.classList.add('hidden'));
    document.getElementById('btn-cancel-key').addEventListener('click', () => modalKey.classList.add('hidden'));

    document.getElementById('form-key').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('key-name').value;
      try {
        const res = await apiRequest('/api/manage/keys', {
          method: 'POST',
          body: JSON.stringify({ name })
        });
        modalKey.classList.add('hidden');
        showToast('API Key dibuat!');
        loadKeys();
      } catch (err) {
        alert(err.message);
      }
    });

    window.deleteKey = async (id) => {
      if (!confirm('Hapus API key ini? Client yang menggunakan key ini tidak akan bisa mengakses route ber-autentikasi.')) return;
      try {
        await apiRequest('/api/manage/keys/' + id, { method: 'DELETE' });
        showToast('API key dihapus');
        loadKeys();
      } catch (err) {
        alert(err.message);
      }
    };

    // Tester
    document.getElementById('btn-send-test').addEventListener('click', async () => {
      const method = document.getElementById('test-method').value;
      const path = document.getElementById('test-path').value.trim();
      const apiKey = document.getElementById('test-key').value.trim();
      const bodyRaw = document.getElementById('test-body').value.trim();
      const resPre = document.getElementById('test-response');
      const statusEl = document.getElementById('test-status');

      if (!path) {
        alert('Masukkan endpoint path untuk diuji, contoh: /v1/users');
        return;
      }

      statusEl.innerText = 'Mengirim request...';
      resPre.innerText = 'Loading...';

      const headers = {};
      if (apiKey) headers['x-api-key'] = apiKey;
      if (['POST', 'PUT', 'PATCH'].includes(method) && bodyRaw) {
        headers['Content-Type'] = 'application/json';
      }

      const startTime = performance.now();
      try {
        const res = await fetch(path, {
          method,
          headers,
          body: ['POST', 'PUT', 'PATCH'].includes(method) && bodyRaw ? bodyRaw : undefined
        });

        const duration = Math.round(performance.now() - startTime);
        statusEl.innerText = \`Status: \${res.status} \${res.statusText} (\${duration}ms)\`;

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json();
          resPre.innerText = JSON.stringify(json, null, 2);
        } else {
          resPre.innerText = await res.text();
        }
      } catch (err) {
        statusEl.innerText = 'Error';
        resPre.innerText = 'Fetch Error: ' + err.message;
      }
    });

    // Init
    checkAuth();
  </script>
</body>
</html>`;
}
