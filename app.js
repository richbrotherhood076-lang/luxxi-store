(() => {
  const $ = (id) => document.getElementById(id);
  const today = new Date();
  const dateISO = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  let db = null, currentUser = null, currentProfile = null, selectedStatus = "hadir", adminRows = [];

  const show = (id, yes = true) => $(id).classList.toggle("hidden", !yes);
  const message = (id, text, kind = "") => { $(id).textContent = text; $(id).className = `message ${kind}`; };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const prettyDate = (d) => d ? new Date(`${d}T00:00:00`).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}) : "-";
  const statusLabel = (s) => ({hadir:"Hadir",sakit:"Sakit",izin:"Izin",alpa:"Alpa"}[s] || s);
  const badge = (s) => `<span class="status-badge status-${esc(s)}">${esc(statusLabel(s))}</span>`;

  function initConfig() {
    const url = window.SUPABASE_URL, key = window.SUPABASE_ANON_KEY;
    if (!url || !key || url.includes("TEMPEL_") || key.includes("TEMPEL_")) {
      show("setupNotice");
      $("setupNotice").textContent = "Website belum terhubung. Isi SUPABASE_URL dan SUPABASE_ANON_KEY di file config.js terlebih dahulu.";
      $("loginForm").querySelector("button").disabled = true;
      return false;
    }
    db = window.supabase.createClient(url, key);
    $("todayLabel").textContent = prettyDate(dateISO);
    $("filterDate").value = dateISO;
    return true;
  }

  async function loadProfile() {
    const { data, error } = await db.from("profiles").select("id, full_name, class_name, role").eq("id", currentUser.id).single();
    if (error || !data) throw new Error("Profil belum dibuat oleh admin. Hubungi pihak sekolah.");
    currentProfile = data;
  }

  async function enterApp() {
    await loadProfile();
    show("loginView", false); show("appView"); show("logoutBtn");
    $("welcomeTitle").textContent = `Halo, ${currentProfile.full_name}`;
    $("welcomeSub").textContent = currentProfile.role === "admin" ? "Kelola dan pantau absensi siswa." : `Kelas ${currentProfile.class_name || "Belum diatur"}`;
    $("rolePill").textContent = currentProfile.role === "admin" ? "Admin" : "Siswa";
    show("studentView", currentProfile.role === "student");
    show("adminView", currentProfile.role === "admin");
    if (currentProfile.role === "admin") await loadAdmin();
    else await loadMine();
  }

  async function loadMine() {
    const { data, error } = await db.from("attendance").select("attendance_date,status,note,created_at").eq("student_id", currentUser.id).order("attendance_date",{ascending:false}).limit(60);
    if (error) { $("myHistory").innerHTML = `<p class="muted">Gagal memuat riwayat: ${esc(error.message)}</p>`; return; }
    $("myHistory").innerHTML = data.length ? `<table><thead><tr><th>Tanggal</th><th>Status</th><th>Catatan</th></tr></thead><tbody>${data.map(r=>`<tr><td>${prettyDate(r.attendance_date)}</td><td>${badge(r.status)}</td><td>${esc(r.note || "-")}</td></tr>`).join("")}</tbody></table>` : `<p class="empty">Belum ada riwayat absensi.</p>`;
  }

  async function submitAttendance() {
    const btn = $("submitAttendance"); btn.disabled = true;
    message("attendanceMessage", "Menyimpan...");
    const note = $("studentNote").value.trim();
    const { error } = await db.from("attendance").upsert({
      student_id: currentUser.id, attendance_date: dateISO, status: selectedStatus, note
    }, { onConflict: "student_id,attendance_date" });
    btn.disabled = false;
    if (error) { message("attendanceMessage", `Belum berhasil disimpan: ${error.message}`, "error"); return; }
    message("attendanceMessage", `Absensi ${statusLabel(selectedStatus)} berhasil disimpan.`, "success");
    await loadMine();
  }

  async function loadAdmin() {
    message("adminMessage", "Memuat data...");
    // Ambil data profil dan absensi yang dapat dilihat admin berdasarkan kebijakan RLS.
    const { data, error } = await db.from("attendance")
      .select("id,student_id,attendance_date,status,note,created_at,profiles:profiles!attendance_student_id_fkey(full_name,class_name)")
      .order("attendance_date",{ascending:false}).limit(2000);
    if (error) { message("adminMessage", `Gagal memuat rekap: ${error.message}`, "error"); return; }
    adminRows = data || [];
    renderAdmin();
    message("adminMessage", `${adminRows.length} catatan dimuat.`, "success");
  }

  function renderAdmin() {
    const date = $("filterDate").value, cls = $("filterClass").value.trim().toLowerCase(), name = $("filterName").value.trim().toLowerCase();
    const rows = adminRows.filter(r => (!date || r.attendance_date === date)
      && (!cls || (r.profiles?.class_name || "").toLowerCase().includes(cls))
      && (!name || `${r.profiles?.full_name || ""} ${r.student_id}`.toLowerCase().includes(name)));
    $("statTotal").textContent = rows.length;
    for (const s of ["hadir","sakit","izin","alpa"]) $(`stat${s[0].toUpperCase()+s.slice(1)}`).textContent = rows.filter(r=>r.status===s).length;
    $("adminTable").innerHTML = rows.length ? `<table><thead><tr><th>Tanggal</th><th>Nama</th><th>Kelas</th><th>Status</th><th>Catatan</th><th>Ubah status</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${prettyDate(r.attendance_date)}</td><td>${esc(r.profiles?.full_name || "Siswa")}</td><td>${esc(r.profiles?.class_name || "-")}</td><td>${badge(r.status)}</td><td>${esc(r.note || "-")}</td><td><select class="status-edit" data-id="${esc(r.id)}" aria-label="Ubah status"><option value="hadir" ${r.status==="hadir"?"selected":""}>Hadir</option><option value="sakit" ${r.status==="sakit"?"selected":""}>Sakit</option><option value="izin" ${r.status==="izin"?"selected":""}>Izin</option><option value="alpa" ${r.status==="alpa"?"selected":""}>Alpa</option></select></td></tr>`).join("")}</tbody></table>` : `<p class="empty">Tidak ada catatan sesuai filter.</p>`;
    $("adminTable").querySelectorAll(".status-edit").forEach(el => el.addEventListener("change", async e => {
      const { error } = await db.from("attendance").update({status:e.target.value}).eq("id", e.target.dataset.id);
      if (error) { message("adminMessage", `Gagal mengubah status: ${error.message}`, "error"); await loadAdmin(); return; }
      const row = adminRows.find(x => x.id === e.target.dataset.id); if (row) row.status = e.target.value;
      renderAdmin(); message("adminMessage", "Status berhasil diperbarui.", "success");
    }));
  }

  function exportCsv() {
    const date = $("filterDate").value, cls = $("filterClass").value.trim().toLowerCase(), name = $("filterName").value.trim().toLowerCase();
    const rows = adminRows.filter(r => (!date || r.attendance_date === date)
      && (!cls || (r.profiles?.class_name || "").toLowerCase().includes(cls))
      && (!name || `${r.profiles?.full_name || ""} ${r.student_id}`.toLowerCase().includes(name)));
    const cell = v => `"${String(v ?? "").replace(/"/g,'""')}"`;
    const csv = [["Tanggal","Nama","Kelas","Status","Catatan"], ...rows.map(r=>[r.attendance_date,r.profiles?.full_name,r.profiles?.class_name,statusLabel(r.status),r.note])].map(row=>row.map(cell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8;"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `rekap-absensi-${date || "semua-tanggal"}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  async function logout() { await db.auth.signOut(); currentUser = null; currentProfile = null; show("appView",false); show("logoutBtn",false); show("loginView"); }
  function bindEvents() {
    $("loginForm").addEventListener("submit", async e => {
      e.preventDefault(); message("loginMessage","Sedang masuk...");
      const { data, error } = await db.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
      if (error) { message("loginMessage","Email atau kata sandi salah, atau akun belum aktif.", "error"); return; }
      currentUser = data.user;
      try { await enterApp(); } catch (err) { message("loginMessage",err.message,"error"); await db.auth.signOut(); }
    });
    $("logoutBtn").addEventListener("click",logout);
    document.querySelectorAll(".status-choice").forEach(btn => btn.addEventListener("click",()=>{
      selectedStatus = btn.dataset.status;
      document.querySelectorAll(".status-choice").forEach(b=>b.classList.toggle("selected",b===btn));
    }));
    $("submitAttendance").addEventListener("click",submitAttendance);
    $("refreshMine").addEventListener("click",loadMine);
    $("applyFilters").addEventListener("click",renderAdmin);
    $("clearFilters").addEventListener("click",()=>{$("filterDate").value="";$("filterClass").value="";$("filterName").value="";renderAdmin();});
    $("exportCsv").addEventListener("click",exportCsv);
  }

  if (initConfig()) {
    bindEvents();
    db.auth.getSession().then(async ({data}) => {
      if (data.session) {
        currentUser = data.session.user;
        try { await enterApp(); } catch (_) { await db.auth.signOut(); }
      }
    });
    db.auth.onAuthStateChange((_event, session) => {
      if (!session) { currentUser = null; currentProfile = null; show("appView",false); show("logoutBtn",false); show("loginView"); }
    });
  }
})();