/* ============================================================
   TURNAMENKÚ — Script
   State management, tab routing, team registration,
   bracket generator, live scoreboard
   ============================================================ */

// ─── STATE ────────────────────────────────────────────────────
const state = {
  teams: [],
  matches: [],
  score: { a: 0, b: 0, teamA: "Tim A", teamB: "Tim B" },
  history: [],
};

// ─── UTILS ────────────────────────────────────────────────────
function showToast(msg, type = "default") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => (toast.className = "toast"), 2400);
}

function now() {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function bumpScore(elId) {
  const el = document.getElementById(elId);
  el.classList.remove("bump");
  void el.offsetWidth; // reflow
  el.classList.add("bump");
  setTimeout(() => el.classList.remove("bump"), 300);
}

// ─── TABS ─────────────────────────────────────────────────────
const navBtns = document.querySelectorAll(".nav-btn");
const tabs    = document.querySelectorAll(".tab");

navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;
    navBtns.forEach(b => b.classList.remove("active"));
    tabs.forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${target}`).classList.add("active");
    if (target === "bagan") renderBagan();
    if (target === "skor") renderMatchSelect();
  });
});

// ─── DAFTAR TIM ───────────────────────────────────────────────
const btnSimpan   = document.getElementById("btn-simpan");
const inputNama   = document.getElementById("input-nama-tim");
const inputPemain = document.getElementById("input-pemain");
const feedback    = document.getElementById("form-feedback");
const teamList    = document.getElementById("team-list");
const teamCount   = document.getElementById("team-count");

btnSimpan.addEventListener("click", () => {
  const nama   = inputNama.value.trim();
  const pemain = inputPemain.value.trim();

  if (!nama || !pemain) {
    setFeedback("Nama tim dan pemain wajib diisi!", "error");
    return;
  }
  if (state.teams.find(t => t.nama.toLowerCase() === nama.toLowerCase())) {
    setFeedback("Nama tim sudah terdaftar, gunakan nama lain.", "error");
    return;
  }

  const pemainList = pemain.split(",").map(p => p.trim()).filter(Boolean);
  state.teams.push({ id: Date.now(), nama, pemain: pemainList });

  inputNama.value   = "";
  inputPemain.value = "";
  setFeedback(`Tim "${nama}" berhasil didaftarkan! 🎉`, "success");
  renderTeamList();
  showToast(`✅ ${nama} bergabung!`, "success");
});

[inputNama, inputPemain].forEach(el => {
  el.addEventListener("keydown", e => { if (e.key === "Enter") btnSimpan.click(); });
});

function setFeedback(msg, type) {
  feedback.textContent = msg;
  feedback.className   = `feedback ${type}`;
  clearTimeout(feedback._t);
  feedback._t = setTimeout(() => {
    feedback.textContent = "";
    feedback.className   = "feedback";
  }, 3000);
}

function renderTeamList() {
  teamCount.textContent = `${state.teams.length} Tim`;
  if (!state.teams.length) {
    teamList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏟️</div>
        <p>Belum ada tim terdaftar.<br/>Isi form di atas untuk memulai!</p>
      </div>`;
    return;
  }
  teamList.innerHTML = state.teams.map((t, i) => `
    <div class="team-card">
      <div class="team-card-num">${String(i + 1).padStart(2, "0")}</div>
      <div class="team-card-name">${escHtml(t.nama)}</div>
      <div class="team-card-players">${t.pemain.map(escHtml).join(" · ")}</div>
      <button class="btn-remove-team" data-id="${t.id}" title="Hapus tim">✕ hapus</button>
    </div>
  `).join("");

  teamList.querySelectorAll(".btn-remove-team").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const tim = state.teams.find(t => t.id === id);
      state.teams = state.teams.filter(t => t.id !== id);
      renderTeamList();
      showToast(`🗑️ ${tim.nama} dihapus`, "error");
    });
  });
}

function escHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ─── BAGAN ────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateMatches() {
  const shuffled = shuffle(state.teams);
  state.matches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      state.matches.push({ home: shuffled[i], away: shuffled[i + 1] });
    } else {
      state.matches.push({ home: shuffled[i], away: null }); // bye
    }
  }
}

function renderBagan() {
  const container = document.getElementById("bagan-container");
  if (state.teams.length < 2) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎯</div>
        <p>Daftarkan minimal 2 tim<br/>untuk melihat bagan pertandingan.</p>
      </div>`;
    return;
  }
  if (!state.matches.length) generateMatches();

  container.innerHTML = state.matches.map((m, i) => {
    if (!m.away) {
      return `<div class="bye-card">Match ${i+1} — <strong>${escHtml(m.home.nama)}</strong> mendapat <em>Bye</em> (langsung lolos)</div>`;
    }
    return `
      <div class="match-card" style="animation-delay:${i * 0.06}s">
        <div class="match-num">M${i + 1}</div>
        <div class="match-team home">${escHtml(m.home.nama)}</div>
        <div class="match-mid">VS</div>
        <div class="match-team away">${escHtml(m.away.nama)}</div>
      </div>`;
  }).join("");
}

document.getElementById("btn-acak").addEventListener("click", () => {
  if (state.teams.length < 2) { showToast("Butuh minimal 2 tim!", "error"); return; }
  generateMatches();
  renderBagan();
  showToast("🔀 Match diacak ulang!");
});

document.getElementById("btn-reset-bagan").addEventListener("click", () => {
  if (!state.teams.length) return;
  if (!confirm("Yakin mau reset semua tim terdaftar?")) return;
  state.teams   = [];
  state.matches = [];
  renderTeamList();
  renderBagan();
  showToast("🗑️ Semua tim direset");
});

// ─── SCOREBOARD ───────────────────────────────────────────────
const matchSelect = document.getElementById("match-select");
const skorA       = document.getElementById("skor-a");
const skorB       = document.getElementById("skor-b");
const namaA       = document.getElementById("nama-tim-a");
const namaB       = document.getElementById("nama-tim-b");
const historyEl   = document.getElementById("score-history");

function renderMatchSelect() {
  const real = state.matches.filter(m => m.away);
  if (!real.length) {
    matchSelect.innerHTML = `<option value="">-- Buat bagan dulu di tab Bagan --</option>`;
    return;
  }
  const current = matchSelect.value;
  matchSelect.innerHTML = `<option value="">-- Pilih Match --</option>` +
    real.map((m, i) => `<option value="${i}">${escHtml(m.home.nama)} vs ${escHtml(m.away.nama)}</option>`).join("");
  if (current !== "") matchSelect.value = current;
}

matchSelect.addEventListener("change", () => {
  const idx = matchSelect.value;
  if (idx === "") return;
  const real = state.matches.filter(m => m.away);
  const m    = real[Number(idx)];
  state.score.teamA = m.home.nama;
  state.score.teamB = m.away.nama;
  state.score.a = 0;
  state.score.b = 0;
  updateScoreUI();
  showToast(`⚽ ${m.home.nama} vs ${m.away.nama} dimulai!`);
});

function updateScoreUI() {
  namaA.textContent = state.score.teamA;
  namaB.textContent = state.score.teamB;
  skorA.textContent = state.score.a;
  skorB.textContent = state.score.b;

  // highlight leader
  document.getElementById("panel-a").classList.toggle("leading", state.score.a > state.score.b);
  document.getElementById("panel-b").classList.toggle("leading", state.score.b > state.score.a);
}

function addPoint(team) {
  if (team === "a") {
    state.score.a++;
    bumpScore("skor-a");
    addHistory(state.score.teamA, state.score.a, state.score.b);
  } else {
    state.score.b++;
    bumpScore("skor-b");
    addHistory(state.score.teamB, state.score.a, state.score.b);
  }
  updateScoreUI();
}

function subPoint(team) {
  if (team === "a" && state.score.a > 0) {
    state.score.a--;
    addHistory(`[koreksi] ${state.score.teamA}`, state.score.a, state.score.b);
  } else if (team === "b" && state.score.b > 0) {
    state.score.b--;
    addHistory(`[koreksi] ${state.score.teamB}`, state.score.a, state.score.b);
  }
  updateScoreUI();
}

document.getElementById("btn-plus-a").addEventListener("click",  () => addPoint("a"));
document.getElementById("btn-plus-b").addEventListener("click",  () => addPoint("b"));
document.getElementById("btn-minus-a").addEventListener("click", () => subPoint("a"));
document.getElementById("btn-minus-b").addEventListener("click", () => subPoint("b"));

document.getElementById("btn-reset-skor").addEventListener("click", () => {
  state.score.a = 0;
  state.score.b = 0;
  updateScoreUI();
  showToast("🔄 Skor direset ke 0 - 0");
});

// ─── HISTORY ─────────────────────────────────────────────────
function addHistory(team, sa, sb) {
  state.history.unshift({ team, sa, sb, time: now() });
  renderHistory();
}

function renderHistory() {
  if (!state.history.length) {
    historyEl.innerHTML = `<p class="history-empty">Belum ada skor tercatat.</p>`;
    return;
  }
  historyEl.innerHTML = state.history.slice(0, 30).map(h => `
    <div class="history-item">
      <span class="h-time">${h.time}</span>
      <span class="h-team">+1 ${escHtml(h.team)}</span>
      <span class="h-score">${h.sa} — ${h.sb}</span>
    </div>`).join("");
}

// ─── KEYBOARD SHORTCUTS ───────────────────────────────────────
document.addEventListener("keydown", e => {
  const activeTab = document.querySelector(".tab.active").id;
  if (activeTab !== "tab-skor") return;
  if (e.key === "a" || e.key === "A") addPoint("a");
  if (e.key === "b" || e.key === "B") addPoint("b");
});

// ─── INIT ─────────────────────────────────────────────────────
renderTeamList();
renderHistory();
updateScoreUI();
