/* ============================================================
   DiffKit — diff.js : deteksi format, pemilihan kunci, dan
   perbandingan dua kumpulan baris (tambah / hapus / ubah / sama).
   ============================================================ */
import { parseCsv, toObjects } from "./csv.js";

const SEP = "\u0001";

/** ubah teks (JSON atau CSV) menjadi { format, rows } atau { error } */
function parseInput(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return { error: "Masih kosong — tempel data atau pilih file." };

  if (raw.startsWith("[") || raw.startsWith("{")) {
    let data;
    try { data = JSON.parse(raw); }
    catch (e) { return { error: "JSON tidak valid — " + e.message }; }

    if (Array.isArray(data)) {
      if (!data.length) return { error: "Array JSON kosong." };
      const rows = data.map(x =>
        x && typeof x === "object" && !Array.isArray(x)
          ? { ...x }
          : { nilai: x === null || x === undefined ? "" : String(x) }
      );
      return { format: "json", rows };
    }
    if (data && typeof data === "object") {
      // objek tunggal → jadikan satu baris agar tetap bisa dibandingkan
      return { format: "json", rows: [{ ...data }] };
    }
    return { error: "Format JSON yang didukung: array atau objek." };
  }

  const table = parseCsv(raw);
  if (table.length < 2) return { error: "CSV butuh minimal baris judul + 1 baris data." };
  const rows = toObjects(table);
  if (!rows.length) return { error: "CSV tidak punya baris data." };
  return { format: "csv", rows };
}

/** daftar kolom: sisi A dulu, lalu kolom baru dari sisi B */
function columns(aRows, bRows) {
  const out = [];
  [...aRows, ...bRows].forEach(r => {
    Object.keys(r || {}).forEach(k => { if (!out.includes(k)) out.push(k); });
  });
  return out;
}

/**
 * Pilih kolom kunci: yang diminta pengguna (bila cocok),
 * kalau tidak → kolom mirip "id"/"key", lalu kolom pertama.
 */
function pickKeyCols(cols, requested) {
  const want = String(requested || "").split(",").map(s => s.trim()).filter(Boolean);
  const found = want.filter(c => cols.includes(c));
  if (found.length) return found;
  const hint = cols.find(c => /^(id|_?id|key|kode|symbol|ticker)$/i.test(c));
  return hint ? [hint] : cols.slice(0, 1);
}

/** kelompokkan baris per kunci (menangani duplikat kunci secara adil) */
function groupBy(rows, keys) {
  const m = new Map();
  rows.forEach(r => {
    const k = keys.map(c => String(r?.[c] ?? "")).join(SEP);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r || {});
  });
  return m;
}

const sameRow = (a, b) => {
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(k => String(a[k] ?? "") === String(b[k] ?? ""));
};

/**
 * Bandingkan dua kumpulan baris.
 * @returns {{added:[], removed:[], changed:[], same:number, keys:string[], cols:string[]}}
 */
function diff(aRows, bRows, requestedKeys) {
  const cols = columns(aRows, bRows);
  const keys = pickKeyCols(cols, requestedKeys);
  const A = groupBy(aRows, keys);
  const B = groupBy(bRows, keys);

  const added = [], removed = [], changed = [];
  let same = 0;

  const allKeys = [...new Set([...A.keys(), ...B.keys()])];
  allKeys.forEach(k => {
    const la = A.get(k) || [];
    const lb = B.get(k) || [];
    if (!A.has(k)) { lb.forEach(row => added.push({ key: k, row })); return; }
    if (!B.has(k)) { la.forEach(row => removed.push({ key: k, row })); return; }
    const n = Math.max(la.length, lb.length);
    for (let i = 0; i < n; i++) {
      const ra = la[i], rb = lb[i];
      if (!ra) { added.push({ key: k, row: rb }); continue; }
      if (!rb) { removed.push({ key: k, row: ra }); continue; }
      if (sameRow(ra, rb)) same++;
      else changed.push({ key: k, before: ra, after: rb });
    }
  });

  return { added, removed, changed, same, keys, cols };
}

export { parseInput, columns, pickKeyCols, diff };
