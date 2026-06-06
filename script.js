let dataPeserta = [];
let dataKamar = [];
let warningsGlobal = [];
let sidebarOpen = false;

document.addEventListener("DOMContentLoaded", () => {
  initDarkMode();
  initDragDrop();
  lucide.createIcons();
});

function byId(id) {
  return document.getElementById(id);
}

function safeText(value) {
  return String(value ?? "").trim();
}

function escapeHtml(value) {
  return safeText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  byId("sidebar").classList.toggle("open", sidebarOpen);
  byId("sidebarOverlay").classList.toggle("show", sidebarOpen);
}

function initDarkMode() {
  const saved = localStorage.getItem("roomlistDarkMode");
  if (saved === "true") {
    document.documentElement.classList.add("dark");
  }
  updateDarkModeLabel();
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("roomlistDarkMode", String(isDark));
  updateDarkModeLabel();
  lucide.createIcons();
}

function updateDarkModeLabel() {
  const label = byId("darkModeLabel");
  if (!label) return;
  label.textContent = document.documentElement.classList.contains("dark") ? "Light Mode" : "Dark Mode";
}

function showToast(message, type = "info") {
  const container = byId("toastContainer");
  const toast = document.createElement("div");

  const config = {
    success: {
      icon: "check-circle-2",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-800",
      iconText: "text-emerald-500"
    },
    error: {
      icon: "x-circle",
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-800",
      iconText: "text-rose-500"
    },
    warning: {
      icon: "alert-triangle",
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      iconText: "text-amber-500"
    },
    info: {
      icon: "info",
      bg: "bg-teal-50",
      border: "border-teal-200",
      text: "text-teal-800",
      iconText: "text-teal-500"
    }
  };

  const c = config[type] || config.info;

  toast.className = `toast-anim pointer-events-auto rounded-xl border ${c.bg} ${c.border} p-3 shadow-lg`;
  toast.innerHTML = `
    <div class="flex items-start gap-2">
      <i data-lucide="${c.icon}" class="mt-0.5 h-4 w-4 ${c.iconText}"></i>
      <p class="text-sm font-semibold leading-snug ${c.text}">${escapeHtml(message)}</p>
    </div>
  `;

  container.appendChild(toast);
  lucide.createIcons({ nodes: Array.from(toast.querySelectorAll("i[data-lucide]")) });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(120%)";
    toast.style.transition = "0.25s ease";
    setTimeout(() => toast.remove(), 260);
  }, 3500);
}

function syncCapacity(value) {
  const val = Math.max(1, Math.min(20, Number(value) || 1));
  byId("kapasitasKamar").value = val;
  byId("kapasitasDisplay").textContent = val;

  const range = byId("kapasitasRange");
  if (val <= Number(range.max)) {
    range.value = val;
  }
}

function handleFile(type) {
  const input = type === "peserta" ? byId("filePeserta") : byId("fileKamar");
  const file = input.files[0];

  const box = type === "peserta" ? byId("uploadPesertaBox") : byId("uploadKamarBox");
  const status = type === "peserta" ? byId("statusPeserta") : byId("statusKamar");
  const iconBox = type === "peserta" ? byId("iconPeserta") : byId("iconKamar");

  if (!file) return;

  const isExcel = /\.(xlsx|xls)$/i.test(file.name);
  if (!isExcel) {
    box.classList.add("error");
    box.classList.remove("ready");
    status.textContent = "Format harus .xlsx atau .xls";
    showToast("Format file harus Excel (.xlsx atau .xls).", "error");
    return;
  }

  box.classList.add("ready");
  box.classList.remove("error");
  status.textContent = file.name;
  iconBox.innerHTML = `<i data-lucide="check-circle-2" class="h-5 w-5 text-teal-600"></i>`;
  lucide.createIcons({ nodes: Array.from(iconBox.querySelectorAll("i[data-lucide]")) });

  updateSteps();
}

function initDragDrop() {
  const pairs = [
    {
      type: "peserta",
      boxId: "uploadPesertaBox",
      inputId: "filePeserta"
    },
    {
      type: "kamar",
      boxId: "uploadKamarBox",
      inputId: "fileKamar"
    }
  ];

  pairs.forEach((item) => {
    const box = byId(item.boxId);
    const input = byId(item.inputId);
    if (!box || !input) return;

    box.addEventListener("dragover", (event) => {
      event.preventDefault();
      box.classList.add("ready");
    });

    box.addEventListener("dragleave", () => {
      if (!input.files[0]) box.classList.remove("ready");
    });

    box.addEventListener("drop", (event) => {
      event.preventDefault();

      if (!event.dataTransfer.files.length) return;
      input.files = event.dataTransfer.files;
      handleFile(item.type);
    });
  });
}

function updateSteps() {
  const hasPeserta = byId("filePeserta").files.length > 0;
  const hasKamar = byId("fileKamar").files.length > 0;
  const hasResult = dataPeserta.length > 0;

  setStep(1, true, true);

  if (hasPeserta && hasKamar) {
    setStep(2, true, !hasResult);
  } else {
    setStep(2, false, true);
  }

  if (hasResult) {
    setStep(3, true, true);
  } else {
    setStep(3, false, false);
  }
}

function setStep(step, done, current) {
  const dot = byId(`stepDot${step}`);
  const num = byId(`stepNum${step}`);
  const line = byId(`stepLine${step}`);

  dot.classList.remove("done", "current", "pending");

  if (done) {
    dot.classList.add("done");
    dot.innerHTML = `<i data-lucide="check" class="h-4 w-4"></i>`;
  } else if (current) {
    dot.classList.add("current");
    dot.innerHTML = `<span id="stepNum${step}">${step}</span>`;
  } else {
    dot.classList.add("pending");
    dot.innerHTML = `<span id="stepNum${step}">${step}</span>`;
  }

  if (line) line.classList.toggle("active", done);

  lucide.createIcons({ nodes: Array.from(dot.querySelectorAll("i[data-lucide]")) });
}

function bacaExcel(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject("File belum dipilih.");
      return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        if (!rows.length) {
          resolve([]);
          return;
        }

        let headerIndex = -1;

        for (let i = 0; i < rows.length; i++) {
          const normalized = rows[i].map((cell) => safeText(cell).toLowerCase());
          const hasPesertaHeader = normalized.includes("nama") && normalized.some((h) => h.includes("jenis kelamin") || h === "jk" || h === "gender");
          const hasKamarHeader = normalized.includes("no kamar") || normalized.includes("nomor kamar") || normalized.includes("kamar");

          if (hasPesertaHeader || hasKamarHeader) {
            headerIndex = i;
            break;
          }
        }

        if (headerIndex === -1) {
          reject("Header tidak ditemukan. Pastikan file memakai template yang benar.");
          return;
        }

        const headers = rows[headerIndex].map((header) => safeText(header));
        const result = [];

        for (let i = headerIndex + 1; i < rows.length; i++) {
          const row = rows[i];

          if (row.every((cell) => safeText(cell) === "")) continue;

          const firstCell = safeText(row[0]);
          if (firstCell.startsWith("[") && firstCell.endsWith("]")) continue;

          const item = {};
          headers.forEach((header, index) => {
            if (header !== "") item[header] = row[index];
          });

          result.push(item);
        }

        resolve(result);
      } catch (error) {
        reject("Gagal membaca file Excel.");
      }
    };

    reader.onerror = () => reject("Gagal membaca file.");
    reader.readAsArrayBuffer(file);
  });
}

function getValue(row, possibleKeys) {
  const keys = Object.keys(row);

  for (const target of possibleKeys) {
    const foundKey = keys.find((key) => safeText(key).toLowerCase() === safeText(target).toLowerCase());
    if (foundKey) return safeText(row[foundKey]);
  }

  for (const target of possibleKeys) {
    const foundKey = keys.find((key) => safeText(key).toLowerCase().includes(safeText(target).toLowerCase()));
    if (foundKey) return safeText(row[foundKey]);
  }

  return "";
}

function normalizeGender(value) {
  const v = safeText(value).toLowerCase().replaceAll(".", "").replaceAll("-", "").replaceAll("_", "").replace(/\s+/g, "");

  if (["lk", "l", "lakilaki", "laki", "pria", "male", "man"].includes(v)) return "Laki-laki";
  if (["pr", "p", "perempuan", "wanita", "female", "woman"].includes(v)) return "Perempuan";

  return value ? "Invalid" : "";
}

function prosesSemuaFile() {
  const filePeserta = byId("filePeserta").files[0];
  const fileKamar = byId("fileKamar").files[0];

  if (!filePeserta) {
    showToast("Upload file peserta terlebih dahulu.", "warning");
    return;
  }

  if (!fileKamar) {
    showToast("Upload file kamar terlebih dahulu.", "warning");
    return;
  }

  setLoadingButton(true);

  Promise.all([bacaExcel(filePeserta), bacaExcel(fileKamar)])
    .then(([jsonPeserta, jsonKamar]) => {
      if (!jsonPeserta.length) throw new Error("File peserta kosong.");
      if (!jsonKamar.length) throw new Error("File kamar kosong.");

      warningsGlobal = [];

      dataPeserta = parsePeserta(jsonPeserta);
      dataKamar = parseKamar(jsonKamar);

      if (!dataKamar.length) throw new Error("Data kamar tidak ditemukan. Pastikan ada kolom No Kamar / Nomor Kamar / Kamar.");

      cekDuplikatPeserta();
      bagiKamar();

      renderTable();
      updateStats();
      updateKamarFilter();
      updateSummaryCapacity();
      validasiPembagianKamar(false);
      updateSteps();

      if (sidebarOpen) toggleSidebar();

      if (warningsGlobal.length) {
        showToast(`Selesai dengan ${warningsGlobal.length} peringatan.`, "warning");
      } else {
        showToast("Pembagian kamar berhasil diproses.", "success");
      }
    })
    .catch((error) => {
      showToast(error.message || error, "error");
    })
    .finally(() => {
      setLoadingButton(false);
    });
}

function setLoadingButton(isLoading) {
  const buttons = [byId("btnProses"), byId("btnProsesMobile")].filter(Boolean);

  buttons.forEach((btn) => {
    btn.disabled = isLoading;
    btn.classList.toggle("opacity-70", isLoading);
    btn.innerHTML = isLoading
      ? `<i data-lucide="loader-2" class="h-4 w-4 animate-spin"></i> Memproses...`
      : `<i data-lucide="play" class="h-4 w-4 fill-current"></i> Proses Pembagian`;
  });

  lucide.createIcons();
}

function parsePeserta(rows) {
  return rows.map((row, index) => {
    const nama = getValue(row, ["nama", "name", "nama lengkap"]);
    const jenisKelaminRaw = getValue(row, ["jenis kelamin", "jk", "gender", "kelamin"]);
    const jenisKelamin = normalizeGender(jenisKelaminRaw);

    let status = "Belum diproses";
    if (!nama) status = "Error: Nama kosong";
    if (!jenisKelamin || jenisKelamin === "Invalid") status = "Error: Jenis kelamin invalid";

    return {
      no: index + 1,
      nama,
      jabatan: getValue(row, ["jabatan", "posisi", "pekerjaan"]),
      asalKecamatan: getValue(row, ["asal kecamatan", "kecamatan", "asal", "wilayah"]),
      kelas: getValue(row, ["kelas", "class"]),
      jenisKelamin,
      jenisKelaminAsli: jenisKelaminRaw,
      noKamar: "",
      status
    };
  });
}

function parseKamar(rows) {
  const kamarMentah = rows
    .map((row) => getValue(row, ["No Kamar", "Nomor Kamar", "Kamar", "Room", "no kamar", "nomor kamar", "room"]))
    .map((value) => safeText(value))
    .filter(Boolean);

  const seen = new Set();
  const duplicates = [];
  const unique = [];

  kamarMentah.forEach((kamar) => {
    if (seen.has(kamar)) {
      duplicates.push(kamar);
    } else {
      seen.add(kamar);
      unique.push(kamar);
    }
  });

  if (duplicates.length) {
    warningsGlobal.push(`Nomor kamar duplikat ditemukan: ${[...new Set(duplicates)].join(", ")}. Duplikat hanya dipakai satu kali.`);
  }

  return unique.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

function cekDuplikatPeserta() {
  const map = new Map();

  dataPeserta.forEach((p) => {
    const key = `${safeText(p.nama).toLowerCase()}|${safeText(p.asalKecamatan).toLowerCase()}|${safeText(p.kelas).toLowerCase()}`;

    if (!safeText(p.nama)) return;

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key).push(p);
  });

  map.forEach((items) => {
    if (items.length > 1) {
      items.forEach((p) => {
        if (!p.status.startsWith("Error")) {
          p.status = "Warning: Data peserta kemungkinan duplikat";
        }
      });

      warningsGlobal.push(`Peserta kemungkinan duplikat: ${items[0].nama}`);
    }
  });
}

function bagiKamar() {
  const kapasitas = Number(byId("kapasitasKamar").value) || 4;
  let indexKamar = 0;

  const kelompok = {
    "Laki-laki": dataPeserta.filter((p) => p.jenisKelamin === "Laki-laki" && !p.status.startsWith("Error")),
    "Perempuan": dataPeserta.filter((p) => p.jenisKelamin === "Perempuan" && !p.status.startsWith("Error"))
  };

  Object.keys(kelompok).forEach((gender) => {
    const peserta = kelompok[gender];

    for (let i = 0; i < peserta.length; i += kapasitas) {
      const kamar = dataKamar[indexKamar];

      if (!kamar) {
        peserta.slice(i, i + kapasitas).forEach((p) => {
          p.noKamar = "";
          p.status = "Error: Kamar tidak cukup";
        });
        continue;
      }

      peserta.slice(i, i + kapasitas).forEach((p) => {
        p.noKamar = kamar;
        if (p.status.startsWith("Warning")) {
          p.status = p.status;
        } else {
          p.status = "OK";
        }
      });

      indexKamar++;
    }
  });
}

function renderTable() {
  const tbody = byId("tabelBody");
  tbody.innerHTML = "";

  if (!dataPeserta.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-5 py-14 text-center">
          <div class="flex flex-col items-center gap-2">
            <div class="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-base-300 bg-base-100">
              <i data-lucide="inbox" class="h-5 w-5 text-base-400"></i>
            </div>
            <p class="text-sm font-semibold text-base-500">Belum ada data</p>
            <p class="text-xs text-base-400">Upload file peserta dan kamar untuk memulai</p>
          </div>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  dataPeserta.forEach((p, index) => {
    const tr = document.createElement("tr");
    tr.className = "row-anim";

    if (p.status.startsWith("Error")) tr.classList.add("error-row");
    if (p.status.startsWith("Warning")) tr.classList.add("warn-row");

    tr.dataset.nama = safeText(p.nama).toLowerCase();
    tr.dataset.jabatan = safeText(p.jabatan).toLowerCase();
    tr.dataset.asal = safeText(p.asalKecamatan).toLowerCase();
    tr.dataset.kelas = safeText(p.kelas).toLowerCase();
    tr.dataset.gender = safeText(p.jenisKelamin);
    tr.dataset.kamar = safeText(p.noKamar);
    tr.dataset.status = safeText(p.status);

    tr.innerHTML = `
      <td class="px-4 py-3 font-semibold text-base-500">${index + 1}</td>
      <td class="px-4 py-3">
        <p class="font-bold text-base-800">${escapeHtml(p.nama || "-")}</p>
      </td>
      <td class="px-4 py-3">${escapeHtml(p.jabatan || "-")}</td>
      <td class="px-4 py-3">${escapeHtml(p.asalKecamatan || "-")}</td>
      <td class="px-4 py-3">${escapeHtml(p.kelas || "-")}</td>
      <td class="px-4 py-3">${renderGenderBadge(p.jenisKelamin)}</td>
      <td class="px-4 py-3">
        ${
          p.noKamar
            ? `<span class="font-extrabold text-base-800">${escapeHtml(p.noKamar)}</span>`
            : `<span class="text-base-400">Belum</span>`
        }
      </td>
      <td class="px-4 py-3">${renderStatusBadge(p.status)}</td>
    `;

    tbody.appendChild(tr);
  });

  lucide.createIcons();
  applyFilters();
}

function renderGenderBadge(gender) {
  if (gender === "Laki-laki") {
    return `<span class="badge-sm bg-teal-50 text-teal-700 border border-teal-100">Lk</span>`;
  }

  if (gender === "Perempuan") {
    return `<span class="badge-sm bg-indigo-50 text-indigo-700 border border-indigo-100">Pr</span>`;
  }

  return `<span class="badge-sm badge-error">Invalid</span>`;
}

function renderStatusBadge(status) {
  const s = safeText(status);

  if (s === "OK") {
    return `<span class="badge-sm badge-ok"><i data-lucide="check" class="h-3 w-3"></i>OK</span>`;
  }

  if (s.startsWith("Warning")) {
    return `<span class="badge-sm badge-warning"><i data-lucide="alert-triangle" class="h-3 w-3"></i>${escapeHtml(s)}</span>`;
  }

  if (s.startsWith("Error")) {
    return `<span class="badge-sm badge-error"><i data-lucide="x" class="h-3 w-3"></i>${escapeHtml(s)}</span>`;
  }

  return `<span class="badge-sm badge-empty">${escapeHtml(s || "Kosong")}</span>`;
}

function updateStats() {
  const total = dataPeserta.length;
  const laki = dataPeserta.filter((p) => p.jenisKelamin === "Laki-laki").length;
  const perempuan = dataPeserta.filter((p) => p.jenisKelamin === "Perempuan").length;
  const kamarTerpakai = new Set(dataPeserta.filter((p) => p.noKamar).map((p) => p.noKamar)).size;
  const belum = dataPeserta.filter((p) => !p.noKamar).length;

  byId("totalPeserta").textContent = total;
  byId("totalLaki").textContent = laki;
  byId("totalPerempuan").textContent = perempuan;
  byId("totalKamarTerdaftar").textContent = dataKamar.length;
  byId("totalKamarTerpakai").textContent = kamarTerpakai;
  byId("totalBelumDapatKamar").textContent = belum;
  byId("totalCount").textContent = total;
}

function updateSummaryCapacity() {
  const box = byId("summaryCapacity");
  const kapasitas = Number(byId("kapasitasKamar").value) || 4;
  const totalKapasitas = dataKamar.length * kapasitas;
  const total = dataPeserta.filter((p) => p.jenisKelamin === "Laki-laki" || p.jenisKelamin === "Perempuan").length;
  const sisa = totalKapasitas - total;

  const laki = dataPeserta.filter((p) => p.jenisKelamin === "Laki-laki").length;
  const perempuan = dataPeserta.filter((p) => p.jenisKelamin === "Perempuan").length;

  const butuhLaki = Math.ceil(laki / kapasitas);
  const butuhPerempuan = Math.ceil(perempuan / kapasitas);
  const totalButuh = butuhLaki + butuhPerempuan;

  const cukup = dataKamar.length >= totalButuh;

  box.classList.remove("hidden");
  box.innerHTML = `
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-sm font-extrabold text-base-800">Ringkasan Kapasitas</p>
        <p class="mt-1 text-xs text-base-500">
          Total kapasitas: <b>${totalKapasitas}</b> orang • Peserta valid: <b>${total}</b> orang • 
          ${sisa >= 0 ? `Sisa kapasitas: <b>${sisa}</b>` : `Kurang kapasitas: <b>${Math.abs(sisa)}</b>`}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <span class="badge-sm ${cukup ? "badge-ok" : "badge-error"}">
          ${cukup ? "Kamar cukup" : "Kamar tidak cukup"}
        </span>
        <span class="badge-sm badge-empty">Butuh Lk: ${butuhLaki} kamar</span>
        <span class="badge-sm badge-empty">Butuh Pr: ${butuhPerempuan} kamar</span>
      </div>
    </div>
  `;
}

function validasiPembagianKamar(showMessage = true) {
  if (!dataPeserta.length) {
    setValidationBox("neutral", "Status Validasi", "Belum ada data yang diproses.");
    if (showMessage) showToast("Belum ada data untuk divalidasi.", "warning");
    return;
  }

  const kapasitas = Number(byId("kapasitasKamar").value) || 4;
  const errors = [];
  const warnings = [...warningsGlobal];

  const grouped = new Map();

  dataPeserta.forEach((p) => {
    if (p.noKamar) {
      if (!grouped.has(p.noKamar)) grouped.set(p.noKamar, []);
      grouped.get(p.noKamar).push(p);
    }

    if (!p.nama) errors.push(`Baris ${p.no}: Nama kosong.`);
    if (!p.jenisKelamin || p.jenisKelamin === "Invalid") errors.push(`Baris ${p.no}: Jenis kelamin invalid.`);
    if (p.status.startsWith("Error")) errors.push(`Baris ${p.no}: ${p.status}.`);
    if (p.status.startsWith("Warning")) warnings.push(`Baris ${p.no}: ${p.status}.`);
  });

  grouped.forEach((items, room) => {
    const genders = new Set(items.map((p) => p.jenisKelamin));

    if (genders.has("Laki-laki") && genders.has("Perempuan")) {
      errors.push(`Kamar ${room} berisi laki-laki dan perempuan.`);
    }

    if (items.length > kapasitas) {
      errors.push(`Kamar ${room} melebihi kapasitas. Isi ${items.length}, kapasitas ${kapasitas}.`);
    }
  });

  const uniqueErrors = [...new Set(errors)];
  const uniqueWarnings = [...new Set(warnings)];

  if (uniqueErrors.length) {
    setValidationBox(
      "error",
      `Validasi menemukan ${uniqueErrors.length} error`,
      createValidationList(uniqueErrors, uniqueWarnings)
    );
    if (showMessage) showToast("Validasi menemukan error.", "error");
    return;
  }

  if (uniqueWarnings.length) {
    setValidationBox(
      "warning",
      `Validasi aman, tetapi ada ${uniqueWarnings.length} peringatan`,
      createValidationList([], uniqueWarnings)
    );
    if (showMessage) showToast("Validasi aman, tetapi ada peringatan.", "warning");
    return;
  }

  setValidationBox(
    "success",
    "Validasi Berhasil",
    "Semua kamar aman. Tidak ada kamar campur laki-laki/perempuan, tidak ada kapasitas berlebih, dan seluruh peserta valid sudah diproses."
  );

  if (showMessage) showToast("Validasi berhasil. Data aman.", "success");
}

function createValidationList(errors, warnings) {
  let html = "";

  if (errors.length) {
    html += `<p class="mb-1 text-sm font-bold text-rose-700">Error:</p>`;
    html += `<ul class="mb-3 list-disc space-y-1 pl-5 text-sm text-base-600">`;
    errors.slice(0, 10).forEach((item) => {
      html += `<li>${escapeHtml(item)}</li>`;
    });
    if (errors.length > 10) html += `<li>Dan ${errors.length - 10} error lainnya.</li>`;
    html += `</ul>`;
  }

  if (warnings.length) {
    html += `<p class="mb-1 text-sm font-bold text-amber-700">Peringatan:</p>`;
    html += `<ul class="list-disc space-y-1 pl-5 text-sm text-base-600">`;
    warnings.slice(0, 10).forEach((item) => {
      html += `<li>${escapeHtml(item)}</li>`;
    });
    if (warnings.length > 10) html += `<li>Dan ${warnings.length - 10} peringatan lainnya.</li>`;
    html += `</ul>`;
  }

  return html || "Tidak ada catatan.";
}

function setValidationBox(type, title, content) {
  const box = byId("hasilValidasi");
  box.className = `validation-box ${type}`;
  box.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="validation-icon">
        <i data-lucide="${type === "success" ? "check-circle-2" : type === "error" ? "x-circle" : type === "warning" ? "alert-triangle" : "info"}" class="h-4 w-4"></i>
      </div>
      <div>
        <p class="mb-0.5 font-bold text-base-800">${escapeHtml(title)}</p>
        <div class="text-sm leading-relaxed text-base-600">${content}</div>
      </div>
    </div>
  `;
  lucide.createIcons({ nodes: Array.from(box.querySelectorAll("i[data-lucide]")) });
}

function applyFilters() {
  const search = safeText(byId("filterSearch").value).toLowerCase();
  const gender = byId("filterGender").value;
  const status = byId("filterStatus").value;
  const kamar = byId("filterKamar").value;

  const rows = Array.from(byId("tabelBody").querySelectorAll("tr"));
  let visible = 0;

  rows.forEach((row) => {
    if (!row.dataset.nama) return;

    const combined = [
      row.dataset.nama,
      row.dataset.jabatan,
      row.dataset.asal,
      row.dataset.kelas,
      row.dataset.gender,
      row.dataset.kamar,
      row.dataset.status
    ].join(" ");

    let show = true;

    if (search && !combined.includes(search)) show = false;

    if (gender) {
      if (gender === "invalid") {
        if (row.dataset.gender !== "Invalid" && row.dataset.gender !== "") show = false;
      } else if (row.dataset.gender !== gender) {
        show = false;
      }
    }

    if (status) {
      if (status === "kosong") {
        if (row.dataset.status) show = false;
      } else if (!row.dataset.status.startsWith(status)) {
        show = false;
      }
    }

    if (kamar) {
      if (kamar === "belum") {
        if (row.dataset.kamar) show = false;
      } else if (row.dataset.kamar !== kamar) {
        show = false;
      }
    }

    row.style.display = show ? "" : "none";
    if (show) visible++;
  });

  byId("showingCount").textContent = visible;
  byId("totalCount").textContent = dataPeserta.length;

  updateFilterTags({ search, gender, status, kamar });
}

function updateFilterTags(filters) {
  const container = byId("activeFilters");
  container.innerHTML = "";

  const tags = [];

  if (filters.search) tags.push({ label: `"${filters.search}"`, type: "search" });
  if (filters.gender) tags.push({ label: filters.gender === "invalid" ? "Invalid" : filters.gender, type: "gender" });
  if (filters.status) tags.push({ label: filters.status, type: "status" });
  if (filters.kamar) tags.push({ label: filters.kamar === "belum" ? "Belum Dapat" : `Kamar ${filters.kamar}`, type: "kamar" });

  if (!tags.length) {
    container.classList.add("hidden");
    return;
  }

  container.classList.remove("hidden");
  container.classList.add("flex");

  tags.forEach((tag) => {
    const span = document.createElement("span");
    span.className = "filter-tag";
    span.innerHTML = `
      ${escapeHtml(tag.label)}
      <button type="button" onclick="removeFilter('${tag.type}')" class="rounded p-0.5 hover:bg-teal-100">
        <i data-lucide="x" class="h-3 w-3"></i>
      </button>
    `;
    container.appendChild(span);
  });

  lucide.createIcons({ nodes: Array.from(container.querySelectorAll("i[data-lucide]")) });
}

function removeFilter(type) {
  if (type === "search") byId("filterSearch").value = "";
  if (type === "gender") byId("filterGender").value = "";
  if (type === "status") byId("filterStatus").value = "";
  if (type === "kamar") byId("filterKamar").value = "";
  applyFilters();
}

function resetFilters() {
  byId("filterSearch").value = "";
  byId("filterGender").value = "";
  byId("filterStatus").value = "";
  byId("filterKamar").value = "";
  applyFilters();
  showToast("Filter direset.", "info");
}

function updateKamarFilter() {
  const select = byId("filterKamar");
  const current = select.value;

  select.innerHTML = `
    <option value="">Kamar</option>
    <option value="belum">Belum</option>
  `;

  const rooms = [...new Set(dataPeserta.filter((p) => p.noKamar).map((p) => p.noKamar))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  rooms.forEach((room) => {
    const option = document.createElement("option");
    option.value = room;
    option.textContent = room;
    select.appendChild(option);
  });

  select.value = current;
}

function resetData() {
  if (!confirm("Yakin ingin reset semua data?")) return;

  dataPeserta = [];
  dataKamar = [];
  warningsGlobal = [];

  byId("filePeserta").value = "";
  byId("fileKamar").value = "";

  byId("statusPeserta").textContent = "Klik untuk pilih file .xlsx";
  byId("statusKamar").textContent = "Klik untuk pilih file .xlsx";

  byId("uploadPesertaBox").classList.remove("ready", "error");
  byId("uploadKamarBox").classList.remove("ready", "error");

  byId("iconPeserta").innerHTML = `<i data-lucide="users" class="h-5 w-5 text-base-400 transition group-hover:text-teal-600"></i>`;
  byId("iconKamar").innerHTML = `<i data-lucide="door-open" class="h-5 w-5 text-base-400 transition group-hover:text-indigo-600"></i>`;

  byId("summaryCapacity").classList.add("hidden");
  byId("summaryCapacity").innerHTML = "";

  setValidationBox("neutral", "Status Validasi", "Belum ada data yang diproses. Upload file peserta dan kamar, lalu klik <b>Proses Pembagian</b>.");
  renderTable();
  updateStats();
  updateKamarFilter();
  updateSteps();
  resetFilters();

  showToast("Data berhasil direset.", "success");
  lucide.createIcons();
}

function makeWorksheet(data, options = {}) {
  const ws = XLSX.utils.aoa_to_sheet(data);

  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const ref = XLSX.utils.encode_cell({ r: row, c: col });
      if (!ws[ref]) continue;

      ws[ref].s = {
        font: { name: "Arial", sz: 10 },
        alignment: { vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "D9E2F3" } },
          bottom: { style: "thin", color: { rgb: "D9E2F3" } },
          left: { style: "thin", color: { rgb: "D9E2F3" } },
          right: { style: "thin", color: { rgb: "D9E2F3" } }
        }
      };
    }
  }

  if (options.headerRows) {
    options.headerRows.forEach((rowIndex) => {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const ref = XLSX.utils.encode_cell({ r: rowIndex, c: col });
        if (!ws[ref]) continue;

        ws[ref].s = {
          ...ws[ref].s,
          font: { name: "Arial", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "0F766E" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: {
            top: { style: "thin", color: { rgb: "115E59" } },
            bottom: { style: "thin", color: { rgb: "115E59" } },
            left: { style: "thin", color: { rgb: "115E59" } },
            right: { style: "thin", color: { rgb: "115E59" } }
          }
        };
      }
    });
  }

  if (options.titleRows) {
    options.titleRows.forEach((rowIndex) => {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const ref = XLSX.utils.encode_cell({ r: rowIndex, c: col });
        if (!ws[ref]) continue;

        ws[ref].s = {
          ...ws[ref].s,
          font: { name: "Arial", sz: rowIndex === 0 ? 14 : 11, bold: true, color: { rgb: "0F172A" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true }
        };
      }
    });
  }

  ws["!cols"] = options.cols || [];
  ws["!merges"] = options.merges || [];

  return ws;
}

function downloadTemplatePeserta() {
  const wb = XLSX.utils.book_new();

  const data = [
    ["TEMPLATE DATA PESERTA"],
    ["Nama", "Jabatan", "Asal Kecamatan", "Kelas", "Jenis Kelamin"],
    ["Contoh Peserta 1", "Peserta", "Garut Kota", "A", "Lk"],
    ["Contoh Peserta 2", "Peserta", "Tarogong Kidul", "A", "Pr"]
  ];

  const ws = makeWorksheet(data, {
    titleRows: [0],
    headerRows: [1],
    merges: [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }],
    cols: [
      { wch: 28 },
      { wch: 18 },
      { wch: 22 },
      { wch: 12 },
      { wch: 16 }
    ]
  });

  XLSX.utils.book_append_sheet(wb, ws, "Template Peserta");
  XLSX.writeFile(wb, "template_peserta.xlsx");
}

function downloadTemplateKamar() {
  const wb = XLSX.utils.book_new();

  const data = [
    ["TEMPLATE DAFTAR KAMAR"],
    ["No Kamar"],
    ["101"],
    ["102"],
    ["103"],
    ["104"]
  ];

  const ws = makeWorksheet(data, {
    titleRows: [0],
    headerRows: [1],
    merges: [{ s: { r: 0, c: 0 }, e: { r: 0, c: 0 } }],
    cols: [{ wch: 18 }]
  });

  XLSX.utils.book_append_sheet(wb, ws, "Template Kamar");
  XLSX.writeFile(wb, "template_kamar.xlsx");
}

function openPreviewDownload() {
  if (!dataPeserta.length) {
    showToast("Belum ada data untuk didownload.", "warning");
    return;
  }

  const modal = byId("previewDownloadModal");
  const summary = byId("previewDownloadSummary");
  const warning = byId("previewDownloadWarning");

  const total = dataPeserta.length;
  const ok = dataPeserta.filter((p) => p.status === "OK").length;
  const warningCount = dataPeserta.filter((p) => safeText(p.status).startsWith("Warning")).length;
  const error = dataPeserta.filter((p) => safeText(p.status).startsWith("Error")).length;
  const belum = dataPeserta.filter((p) => !safeText(p.noKamar)).length;
  const kamarTerpakai = new Set(dataPeserta.filter((p) => p.noKamar).map((p) => p.noKamar)).size;

  summary.innerHTML = `
    <div class="preview-stat-card">
      <p class="preview-stat-label">Total</p>
      <p class="preview-stat-number">${total}</p>
    </div>

    <div class="preview-stat-card">
      <p class="preview-stat-label">OK</p>
      <p class="preview-stat-number text-emerald-600">${ok}</p>
    </div>

    <div class="preview-stat-card">
      <p class="preview-stat-label">Warning</p>
      <p class="preview-stat-number text-amber-600">${warningCount}</p>
    </div>

    <div class="preview-stat-card">
      <p class="preview-stat-label">Error</p>
      <p class="preview-stat-number text-rose-600">${error}</p>
    </div>

    <div class="preview-stat-card">
      <p class="preview-stat-label">Belum Kamar</p>
      <p class="preview-stat-number text-rose-600">${belum}</p>
    </div>

    <div class="preview-stat-card">
      <p class="preview-stat-label">Kamar Terpakai</p>
      <p class="preview-stat-number">${kamarTerpakai}</p>
    </div>
  `;

  if (error > 0 || belum > 0 || warningCount > 0) {
    warning.classList.remove("hidden");
    warning.innerHTML = `
      <div class="flex gap-2">
        <i data-lucide="alert-triangle" class="mt-0.5 h-4 w-4 shrink-0"></i>
        <div>
          <p class="font-bold">Ada catatan sebelum export.</p>
          <p class="mt-0.5">
            Ditemukan ${error} error, ${warningCount} warning, dan ${belum} peserta belum dapat kamar.
            Kamu tetap bisa download semua data atau hanya data bermasalah.
          </p>
        </div>
      </div>
    `;
  } else {
    warning.classList.add("hidden");
    warning.innerHTML = "";
  }

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  lucide.createIcons();
}

function closePreviewDownload() {
  const modal = byId("previewDownloadModal");
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function downloadExcel(mode = "all") {
  if (!dataPeserta.length) {
    showToast("Belum ada data untuk didownload.", "warning");
    return;
  }

  let exportData = [...dataPeserta];
  let fileSuffix = "semua_data";
  let sheetTitle = "Roomlist";

  if (mode === "error") {
    exportData = dataPeserta.filter((p) => safeText(p.status).startsWith("Error"));

    if (!exportData.length) {
      showToast("Tidak ada data error untuk didownload.", "info");
      return;
    }

    fileSuffix = "data_error";
    sheetTitle = "Data Error";
  }

  if (mode === "belum") {
    exportData = dataPeserta.filter((p) => !safeText(p.noKamar));

    if (!exportData.length) {
      showToast("Tidak ada peserta yang belum dapat kamar.", "info");
      return;
    }

    fileSuffix = "belum_dapat_kamar";
    sheetTitle = "Belum Dapat Kamar";
  }

  const judul = safeText(byId("judulRoomlist").value) || "ROOMLIST PELATIHAN";
  const hotel = safeText(byId("namaHotel").value) || "HOTEL / GELOMBANG";
  const tanggal = safeText(byId("infoTanggal").value) || "INFO CHECK IN / OUT";

  const wb = XLSX.utils.book_new();

  const header = [
    "No",
    "Nama",
    "Jabatan",
    "Asal Kecamatan",
    "Kelas",
    "Jenis Kelamin",
    "No Kamar",
    "Status"
  ];

  const rows = exportData.map((p, index) => [
    index + 1,
    p.nama,
    p.jabatan,
    p.asalKecamatan,
    p.kelas,
    p.jenisKelamin,
    p.noKamar,
    p.status
  ]);

  const data = [
    [judul],
    [hotel],
    [tanggal],
    [],
    header,
    ...rows
  ];

  const ws = makeWorksheet(data, {
    titleRows: [0, 1, 2],
    headerRows: [4],
    merges: [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }
    ],
    cols: [
      { wch: 6 },
      { wch: 30 },
      { wch: 18 },
      { wch: 22 },
      { wch: 12 },
      { wch: 16 },
      { wch: 12 },
      { wch: 32 }
    ]
  });

  for (let i = 5; i < data.length; i++) {
    const statusCell = ws[XLSX.utils.encode_cell({ r: i, c: 7 })];
    if (!statusCell) continue;

    const status = safeText(statusCell.v);

    if (status.startsWith("Error")) {
      for (let c = 0; c <= 7; c++) {
        const ref = XLSX.utils.encode_cell({ r: i, c });
        if (ws[ref]) ws[ref].s.fill = { fgColor: { rgb: "FFE4E6" } };
      }
    }

    if (status.startsWith("Warning")) {
      for (let c = 0; c <= 7; c++) {
        const ref = XLSX.utils.encode_cell({ r: i, c });
        if (ws[ref]) ws[ref].s.fill = { fgColor: { rgb: "FEF3C7" } };
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

  const summary = [
    ["RINGKASAN EXPORT"],
    ["Mode Export", mode === "all" ? "Semua Data" : mode === "error" ? "Data Error Saja" : "Belum Dapat Kamar"],
    ["Total Data Diexport", exportData.length],
    ["Total Peserta Keseluruhan", dataPeserta.length],
    ["Total OK", dataPeserta.filter((p) => p.status === "OK").length],
    ["Total Warning", dataPeserta.filter((p) => safeText(p.status).startsWith("Warning")).length],
    ["Total Error", dataPeserta.filter((p) => safeText(p.status).startsWith("Error")).length],
    ["Belum Dapat Kamar", dataPeserta.filter((p) => !safeText(p.noKamar)).length],
    ["Total Kamar Terdaftar", dataKamar.length],
    ["Total Kamar Terpakai", new Set(dataPeserta.filter((p) => p.noKamar).map((p) => p.noKamar)).size],
    ["Kapasitas per Kamar", Number(byId("kapasitasKamar").value) || 4]
  ];

  const wsSummary = makeWorksheet(summary, {
    titleRows: [0],
    merges: [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }],
    cols: [
      { wch: 28 },
      { wch: 24 }
    ]
  });

  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

  const now = new Date();
  const tanggalFile = now.toISOString().slice(0, 10);

  XLSX.writeFile(wb, `roomlist_${fileSuffix}_${tanggalFile}.xlsx`);

  closePreviewDownload();
  showToast("File Excel berhasil didownload.", "success");
}