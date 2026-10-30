/* ============================================================
   DiffKit — csv.js : parser CSV standar (kutip ganda, CRLF, BOM).
   Dipinjam dari pola proyek sejenis supaya perilakunya konsisten.
   ============================================================ */

/** parser CSV: mengembalikan array of array of string */
function parseCsv(text) {
  text = String(text ?? "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let cur = "";
  let inQ = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += c;
    } else if (c === '"') {
      inQ = true;
    } else if (c === ",") {
      row.push(cur); cur = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some(v => v.trim() !== "")) rows.push(row);
      row = [];
    } else {
      cur += c;
    }
  }
  row.push(cur);
  if (row.some(v => v.trim() !== "")) rows.push(row);
  return rows;
}

/** tabel (array of array) → array of object memakai baris pertama sebagai judul */
function toObjects(table) {
  const head = table[0].map((h, i) => (h || "").trim() || "kolom" + (i + 1));
  return table.slice(1).map(r => {
    const o = {};
    head.forEach((h, i) => { o[h] = String(r[i] ?? "").trim(); });
    return o;
  });
}

export { parseCsv, toObjects };
