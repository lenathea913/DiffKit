/* ============================================================
   DiffKit — main.js : baca file/tempel teks, jalankan diff,
   render ringkasan & daftar perubahan.
   ============================================================ */
import { parseInput, diff, sameValue } from "./diff.js";

const $ = (s, r = document) => r.querySelector(s);
const LIST_LIMIT = 120;

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

function note(type, text) {
  const el = $("#diffNote");
  if (!text) { el.hidden = true; return; }
  el.hidden = false;
  el.className = "form-note " + type;
  el.textContent = text;
}

/* ---------- baca file ke textarea ---------- */
function bindFile(fileSel, textSel) {
  $(fileSel).addEventListener("change", async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = "";
    if (!file) return;
    try {
      $(textSel).value = await file.text();
      note("", "");
      run();
    } catch (e) {
      note("err", "Gagal membaca file: " + e.message);
    }
  });
}

/* ---------- render ---------- */
/** nilai → teks tampil: objek/array ditulis sebagai JSON, bukan [object Object] */
function fmtVal(v) {
  if (v !== null && typeof v === "object") {
    try { return JSON.stringify(v); } catch (e) { return String(v); }
  }
  return v ?? "";
}

function rowLine(row) {
  return Object.entries(row)
    .map(([k, v]) => `<span class="kv"><b>${esc(k)}</b> ${esc(fmtVal(v))}</span>`)
    .join("");
}

/**
 * Detail baris "Ubah": hanya kolom yang benar-benar berbeda yang ditandai
 * (nama kolom + nilai lama → baru). Kolom sama diringkas jadi satu catatan.
 */
function changedLine(d) {
  const before = d.before || {};
  const after = d.after || {};
  const cols = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  const diffCols = cols.filter((c) => !sameValue(before[c], after[c]));
  const sameCount = cols.length - diffCols.length;

  const body = diffCols
    .map(
      (c) =>
        `<span class="kv chg"><b>${esc(c)}</b>` +
        `<s class="old">${esc(fmtVal(before[c]))}</s>` +
        `<i class="arrow">→</i><span class="new">${esc(fmtVal(after[c]))}</span></span>`
    )
    .join("");
  const note = sameCount
    ? `<span class="kv same-note">+ ${sameCount} kolom lain tidak berubah</span>`
    : "";
  return `<div class="d-row">${body}${note}</div>`;
}

function item(cls, label, key, body) {
  return `<li class="d-item ${cls}">
    <span class="d-badge ${cls}">${label}</span>
    <span class="d-key num">${esc(key)}</span>
    <div class="d-body">${body}</div>
  </li>`;
}

function render(res, fmtA, fmtB) {
  $("#cntAdd").textContent = res.added.length;
  $("#cntDel").textContent = res.removed.length;
  $("#cntChg").textContent = res.changed.length;
  $("#cntSame").textContent = res.same;
  $("#metaInfo").textContent =
    `kunci: ${res.keys.join(", ")} · format A ${fmtA.toUpperCase()} / B ${fmtB.toUpperCase()} · ${res.cols.length} kolom`;

  $("#emptyState").hidden = true;
  const list = $("#diffList");
  list.hidden = false;

  const parts = [];
  res.changed.forEach(d =>
    parts.push(item("changed", "Ubah", d.key, changedLine(d)))
  );
  res.added.forEach(d => parts.push(item("added", "Tambah", d.key, `<div class="d-row">${rowLine(d.row)}</div>`)));
  res.removed.forEach(d => parts.push(item("removed", "Hapus", d.key, `<div class="d-row">${rowLine(d.row)}</div>`)));

  if (!parts.length) {
    list.innerHTML = `<li class="d-item none"><span class="d-badge">Sama</span><span class="d-key">Tidak ada perbedaan — kedua data identik (menurut kunci terpilih).</span></li>`;
    return;
  }
  const shown = parts.slice(0, LIST_LIMIT);
  list.innerHTML = shown.join("") +
    (parts.length > shown.length
      ? `<li class="d-item none">… dan ${parts.length - shown.length} perbedaan lain tidak ditampilkan (batas tampil ${LIST_LIMIT}).</li>`
      : "");
}

/* ---------- jalankan ---------- */
function run() {
  const a = parseInput($("#textA").value);
  const b = parseInput($("#textB").value);
  if (a.error || b.error) {
    note("err", (a.error ? "Sisi A: " + a.error + " " : "") + (b.error ? "Sisi B: " + b.error : ""));
    return;
  }
  note("", "");
  const res = diff(a.rows, b.rows, $("#keyInput").value);
  render(res, a.format, b.format);
}

/* ---------- init ---------- */
bindFile("#fileA", "#textA");
bindFile("#fileB", "#textB");
$("#btnRun").addEventListener("click", run);
["#textA", "#textB"].forEach((s) =>
  $(s).addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(); }
  })
);
