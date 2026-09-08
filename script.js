// ---------- section switching ----------
function show(id) {
  ['home', 'poojas', 'book', 'gallery', 'info', 'lookup'].forEach(s => {
    document.getElementById('sec-' + s).classList.toggle('hidden', s !== id);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id === 'poojas') loadPoojas();
  if (id === 'gallery') loadGallery();
  if (id === 'info') loadInfo();
}

// converts a Google Drive share link into a direct-viewable image URL
function driveImgUrl(link) {
  const match = String(link).match(/\/d\/([a-zA-Z0-9_-]+)/) || String(link).match(/id=([a-zA-Z0-9_-]+)/);
  if (match) return 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w1000';
  return link;
}

// ---------- home / announcements ----------
async function loadAnnouncements() {
  const res = await api('getAnnouncements');
  const el = document.getElementById('announceList');
  if (!res.success || res.data.length === 0) {
    el.innerHTML = '<p class="muted">No announcements right now.</p>';
    return;
  }
  el.innerHTML = res.data.map(a => `
    <div class="announce-card">
      <div class="announce-date">${a.date || ''}</div>
      <h3 style="margin:4px 0;">${a.title}</h3>
      <p class="muted" style="margin:0;">${a.message}</p>
    </div>`).join('');
}

// ---------- poojas ----------
async function loadPoojas() {
  const grid = document.getElementById('poojaGrid');
  grid.innerHTML = '<p class="muted">Loading poojas…</p>';
  const res = await api('getPoojas');
  if (!res.success || res.data.length === 0) {
    grid.innerHTML = '<p class="muted">No poojas available yet.</p>';
    return;
  }
  grid.innerHTML = res.data.map(p => `
    <div class="card">
      <h3 style="margin:0 0 8px;">${p.name}</h3>
      <p class="muted" style="min-height:40px;">${p.description || ''}</p>
      <p style="font-weight:bold;color:var(--teal);font-size:18px;">₹${p.price}</p>
      <button class="btn-ghost" onclick='startBooking(${JSON.stringify(p.name)})'>Book This Pooja</button>
    </div>`).join('');
}

let currentPooja = '', currentSlot = '';
function startBooking(name) {
  currentPooja = name;
  currentSlot = '';
  document.getElementById('bookTitle').textContent = 'Book: ' + name;
  document.getElementById('inpDate').value = '';
  document.querySelectorAll('.slot-row button').forEach(b => b.classList.remove('sel'));
  document.getElementById('bookStep1').classList.remove('hidden');
  document.getElementById('bookStep2').classList.add('hidden');
  document.getElementById('bookStep3').classList.add('hidden');
  show('book');
}
function pickSlot(btn, slot) {
  document.querySelectorAll('.slot-row button').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  currentSlot = slot;
}
function goDetails() {
  const date = document.getElementById('inpDate').value;
  if (!date || !currentSlot) { alert('Please select a date and time slot.'); return; }
  document.getElementById('bookStep1').classList.add('hidden');
  document.getElementById('bookStep2').classList.remove('hidden');
}
function backToStep1() {
  document.getElementById('bookStep2').classList.add('hidden');
  document.getElementById('bookStep1').classList.remove('hidden');
}
async function submitBooking() {
  const name = document.getElementById('inpName').value.trim();
  const phone = document.getElementById('inpPhone').value.trim();
  const addr = document.getElementById('inpAddr').value.trim();
  const errEl = document.getElementById('bookErr');
  errEl.textContent = '';
  if (!name || !phone || !addr) { errEl.textContent = 'Please fill in all fields.'; return; }

  const res = await api('createBooking', {
    poojaName: currentPooja,
    date: document.getElementById('inpDate').value,
    slot: currentSlot,
    name, phone, address: addr
  });
  if (!res.success) { errEl.textContent = res.error || 'Something went wrong. Please try again.'; return; }

  document.getElementById('refOut').textContent = res.refId;
  document.getElementById('bookStep2').classList.add('hidden');
  document.getElementById('bookStep3').classList.remove('hidden');
}

// ---------- gallery ----------
async function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '<p class="muted">Loading gallery…</p>';
  const res = await api('getGallery');
  if (!res.success || res.data.length === 0) {
    grid.innerHTML = '<p class="muted">No photos added yet.</p>';
    return;
  }
  grid.innerHTML = res.data.map(g => `
    <div>
      <img src="${driveImgUrl(g.driveLink)}" alt="${g.title || ''}">
      <p class="muted" style="margin:6px 0 0;font-size:13px;">${g.title || ''}</p>
    </div>`).join('');
}

// ---------- temple info ----------
async function loadInfo() {
  const box = document.getElementById('infoBox');
  const res = await api('getTempleInfo');
  if (!res.success) { box.innerHTML = '<p class="muted">Could not load info.</p>'; return; }
  const d = res.data;
  box.innerHTML = `
    <p><b>Timings:</b> ${d.timings || '—'}</p>
    <p><b>Address:</b> ${d.address || '—'}</p>
    <p><b>Phone:</b> ${d.phone || '—'}</p>
    <p><b>Email:</b> ${d.email || '—'}</p>
    ${d.mapEmbedUrl ? `<iframe src="${d.mapEmbedUrl}" width="100%" height="260" style="border:0;border-radius:4px;" loading="lazy"></iframe>` : ''}
  `;
}

// ---------- lookup ----------
async function doLookup() {
  const val = document.getElementById('lookupVal').value.trim();
  const resultEl = document.getElementById('lookupResult');
  if (!val) return;
  resultEl.innerHTML = '<p class="muted">Searching…</p>';
  const res = await api('lookupBooking', { value: val });
  if (!res.success || res.data.length === 0) {
    resultEl.innerHTML = '<p class="muted">No booking found for that reference ID or phone number.</p>';
    return;
  }
  resultEl.innerHTML = res.data.map(b => {
    const statusClass = b.status === 'Confirmed' ? 'status-confirmed' : (b.status === 'Cancelled' ? 'status-cancelled' : 'status-pending');
    const canCancel = b.status !== 'Cancelled';
    return `
      <div class="card" style="margin-bottom:10px;">
        <p><b>Ref:</b> ${b.refId} &nbsp; <b>Pooja:</b> ${b.poojaName}</p>
        <p><b>Date:</b> ${b.date} &nbsp; <b>Slot:</b> ${b.slot}</p>
        <p><span class="${statusClass}">${b.status}</span></p>
        ${canCancel ? `<button class="btn-ghost" onclick="cancelBooking('${b.refId}')">Cancel this booking</button>` : ''}
      </div>`;
  }).join('');
}
async function cancelBooking(refId) {
  if (!confirm('Cancel booking ' + refId + '?')) return;
  const res = await api('cancelBooking', { refId });
  if (res.success) { doLookup(); } else { alert(res.error || 'Could not cancel.'); }
}

// ---------- temple name (shown in header + tab title) ----------
async function loadBrand() {
  const res = await api('getTempleInfo');
  if (res.success && res.data.templeName) {
    document.getElementById('brandName').textContent = res.data.templeName;
    document.title = res.data.templeName;
  }
}

// ---------- init ----------
loadBrand();
loadAnnouncements();
