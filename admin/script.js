// Session token is kept in sessionStorage (cleared when the tab closes) —
// not localStorage, and never sent to or shared with the customer site.
function getToken() { return sessionStorage.getItem('adminToken'); }
function setToken(t) { sessionStorage.setItem('adminToken', t); }
function clearToken() { sessionStorage.removeItem('adminToken'); }

async function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginErr');
  errEl.textContent = '';
  if (!username || !password) { errEl.textContent = 'Enter username and password.'; return; }
  const res = await api('adminLogin', { username, password });
  if (!res.success) { errEl.textContent = res.error || 'Login failed.'; return; }
  setToken(res.token);
  enterDashboard();
}

function logout() {
  clearToken();
  document.getElementById('dashView').style.display = 'none';
  document.getElementById('loginView').style.display = 'flex';
}

async function enterDashboard() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('dashView').style.display = 'grid';
  showPanel('bookings');
  const res = await api('getTempleInfo');
  if (res.success && res.data.templeName) {
    document.getElementById('adminBrand').textContent = res.data.templeName;
  }
}

// if a token already exists this tab (e.g. page refresh), skip login
window.addEventListener('DOMContentLoaded', () => {
  if (getToken()) enterDashboard();
});

function showPanel(name) {
  ['bookings', 'poojas', 'announcements', 'gallery', 'info'].forEach(p => {
    document.getElementById('panel-' + p).classList.toggle('active', p === name);
    document.getElementById('tab-' + p).classList.toggle('active', p === name);
  });
  document.getElementById('panelTitle').textContent = name[0].toUpperCase() + name.slice(1);
  if (name === 'bookings') loadBookings();
  if (name === 'poojas') loadPoojasAdmin();
  if (name === 'announcements') loadAnnouncementsAdmin();
  if (name === 'gallery') loadGalleryAdmin();
  if (name === 'info') loadInfoAdmin();
}

// ---------- BOOKINGS ----------
async function loadBookings() {
  const res = await api('adminGetBookings', { token: getToken() });
  const body = document.getElementById('bookingsBody');
  if (!res.success) { body.innerHTML = `<tr><td colspan="7" class="muted">${res.error}</td></tr>`; return; }
  const rows = res.data;
  const today = new Date().toDateString();
  const todayCount = rows.filter(b => new Date(b.timestamp).toDateString() === today).length;
  const pendingCount = rows.filter(b => b.status === 'Pending').length;

  document.getElementById('statRow').innerHTML = `
    <div class="stat-card"><div class="num">${todayCount}</div><div class="lab">Today's bookings</div></div>
    <div class="stat-card"><div class="num">${pendingCount}</div><div class="lab">Pending confirmation</div></div>
    <div class="stat-card"><div class="num">${rows.length}</div><div class="lab">Total bookings</div></div>
  `;

  if (rows.length === 0) { body.innerHTML = `<tr><td colspan="7" class="muted">No bookings yet.</td></tr>`; return; }
  body.innerHTML = rows.slice().reverse().map(b => `
    <tr>
      <td>${b.refId}</td><td>${b.name}</td><td>${b.poojaName}</td>
      <td>${b.date} · ${b.slot}</td><td>${b.phone}</td>
      <td><span class="badge badge-${b.status}">${b.status}</span></td>
      <td class="row-actions">
        ${b.status === 'Pending' ? `<button class="yes" onclick="updateStatus('${b.refId}','Confirmed')">Confirm</button><button class="no" onclick="updateStatus('${b.refId}','Cancelled')">Cancel</button>` : '—'}
      </td>
    </tr>`).join('');
}
async function updateStatus(refId, status) {
  const res = await api('adminUpdateBookingStatus', { token: getToken(), refId, status });
  if (res.success) loadBookings(); else alert(res.error);
}

// ---------- POOJAS ----------
async function loadPoojasAdmin() {
  const res = await api('getPoojas');
  const list = document.getElementById('poojaList');
  if (!res.success || res.data.length === 0) { list.innerHTML = '<p class="muted">No poojas yet.</p>'; return; }
  list.innerHTML = res.data.map(p => `
    <div class="item-row">
      <div><b>${p.name}</b> — ₹${p.price}<br><span class="muted">${p.description || ''}</span></div>
      <button class="del" onclick="deletePooja('${p.id}')">Delete</button>
    </div>`).join('');
}
async function addPooja() {
  const name = document.getElementById('pName').value.trim();
  const price = document.getElementById('pPrice').value;
  const description = document.getElementById('pDesc').value.trim();
  if (!name || !price) { alert('Enter name and price.'); return; }
  const res = await api('adminAddPooja', { token: getToken(), name, price, description });
  if (res.success) {
    document.getElementById('pName').value = '';
    document.getElementById('pPrice').value = '';
    document.getElementById('pDesc').value = '';
    loadPoojasAdmin();
  } else alert(res.error);
}
async function deletePooja(id) {
  if (!confirm('Delete this pooja?')) return;
  const res = await api('adminDeletePooja', { token: getToken(), id });
  if (res.success) loadPoojasAdmin(); else alert(res.error);
}

// ---------- ANNOUNCEMENTS ----------
async function loadAnnouncementsAdmin() {
  const res = await api('getAnnouncements');
  const list = document.getElementById('announceList2');
  if (!res.success || res.data.length === 0) { list.innerHTML = '<p class="muted">No announcements yet.</p>'; return; }
  list.innerHTML = res.data.map(a => `
    <div class="item-row">
      <div><b>${a.title}</b> <span class="muted">(${a.date})</span><br><span class="muted">${a.message}</span></div>
      <button class="del" onclick="deleteAnnouncement('${a.id}')">Delete</button>
    </div>`).join('');
}
async function addAnnouncement() {
  const date = document.getElementById('aDate').value;
  const title = document.getElementById('aTitle').value.trim();
  const message = document.getElementById('aMsg').value.trim();
  if (!title || !message) { alert('Enter a title and message.'); return; }
  const res = await api('adminAddAnnouncement', { token: getToken(), date, title, message });
  if (res.success) {
    document.getElementById('aTitle').value = '';
    document.getElementById('aMsg').value = '';
    loadAnnouncementsAdmin();
  } else alert(res.error);
}
async function deleteAnnouncement(id) {
  if (!confirm('Delete this announcement?')) return;
  const res = await api('adminDeleteAnnouncement', { token: getToken(), id });
  if (res.success) loadAnnouncementsAdmin(); else alert(res.error);
}

// ---------- GALLERY ----------
async function loadGalleryAdmin() {
  const res = await api('getGallery');
  const list = document.getElementById('galleryList2');
  if (!res.success || res.data.length === 0) { list.innerHTML = '<p class="muted">No photos yet.</p>'; return; }
  list.innerHTML = res.data.map(g => `
    <div class="item-row">
      <div><b>${g.title || '(untitled)'}</b><br><span class="muted" style="word-break:break-all;">${g.driveLink}</span></div>
      <button class="del" onclick="deleteGallery('${g.id}')">Delete</button>
    </div>`).join('');
}
async function addGallery() {
  const title = document.getElementById('gTitle').value.trim();
  const driveLink = document.getElementById('gLink').value.trim();
  if (!driveLink) { alert('Paste a Google Drive link.'); return; }
  const res = await api('adminAddGallery', { token: getToken(), title, driveLink });
  if (res.success) {
    document.getElementById('gTitle').value = '';
    document.getElementById('gLink').value = '';
    loadGalleryAdmin();
  } else alert(res.error);
}
async function deleteGallery(id) {
  if (!confirm('Delete this photo?')) return;
  const res = await api('adminDeleteGallery', { token: getToken(), id });
  if (res.success) loadGalleryAdmin(); else alert(res.error);
}

// ---------- TEMPLE INFO ----------
async function loadInfoAdmin() {
  const res = await api('getTempleInfo');
  if (!res.success) return;
  const d = res.data;
  document.getElementById('iName').value = d.templeName || '';
  document.getElementById('iTimings').value = d.timings || '';
  document.getElementById('iAddress').value = d.address || '';
  document.getElementById('iPhone').value = d.phone || '';
  document.getElementById('iEmail').value = d.email || '';
  document.getElementById('iMap').value = d.mapEmbedUrl || '';
}
async function saveInfo() {
  const fields = {
    templeName: document.getElementById('iName').value,
    timings: document.getElementById('iTimings').value,
    address: document.getElementById('iAddress').value,
    phone: document.getElementById('iPhone').value,
    email: document.getElementById('iEmail').value,
    mapEmbedUrl: document.getElementById('iMap').value
  };
  for (const key in fields) {
    await api('adminUpdateTempleInfo', { token: getToken(), key, value: fields[key] });
  }
  alert('Temple info saved.');
}
