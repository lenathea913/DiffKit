/* ============================================================
   DiffKit — diff.test.js : deteksi format, pilihan kunci, diff.
   Jalankan dengan: npm test  (node --test test/)
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { parseInput, pickKeyCols, diff } from "../src/diff.js";

/* ---------- parseInput ---------- */

test("parseInput: array objek JSON", () => {
  const r = parseInput('[{"id":"1","nama":"Budi"}]');
  assert.equal(r.error, undefined);
  assert.equal(r.format, "json");
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].nama, "Budi");
});

test("parseInput: array JSON berisi skalar jadi baris {nilai}", () => {
  const r = parseInput("[1, null, true]");
  assert.equal(r.rows.length, 3);
  assert.deepEqual(r.rows[0], { nilai: "1" });
  assert.deepEqual(r.rows[1], { nilai: "" });
  assert.deepEqual(r.rows[2], { nilai: "true" });
});

test("parseInput: objek tunggal jadi satu baris", () => {
  const r = parseInput('{"id":"1","nama":"Budi"}');
  assert.equal(r.rows.length, 1);
  assert.deepEqual(r.rows[0], { id: "1", nama: "Budi" });
});

test("parseInput: JSON rusak memberi pesan error", () => {
  const r = parseInput('[{"id":');
  assert.match(r.error, /JSON tidak valid/);
});

test("parseInput: input kosong memberi pesan error", () => {
  assert.match(parseInput("   ").error, /kosong/);
});

test("parseInput: CSV dengan baris judul terdeteksi otomatis", () => {
  const r = parseInput("id,nama\n1,Budi");
  assert.equal(r.format, "csv");
  assert.deepEqual(r.rows, [{ id: "1", nama: "Budi" }]);
});

test("parseInput: CSV cuma punya baris judul → error", () => {
  assert.match(parseInput("id,nama").error, /baris judul/);
});

/* ---------- pickKeyCols ---------- */

test("pickKeyCols: kolom yang diminta dipakai bila ada", () => {
  assert.deepEqual(pickKeyCols(["symbol", "id", "harga"], "symbol"), ["symbol"]);
});

test("pickKeyCols: permintaan tak cocok → fallback deteksi id/key", () => {
  assert.deepEqual(pickKeyCols(["nama", "kode"], "tidakada"), ["kode"]);
  assert.deepEqual(pickKeyCols(["nama", "key"], "tidakada"), ["key"]);
});

test("pickKeyCols: tanpa kandidat → kolom pertama", () => {
  assert.deepEqual(pickKeyCols(["harga", "qty"], ""), ["harga"]);
});

test("pickKeyCols: beberapa kunci didukung (urut sesuai permintaan)", () => {
  assert.deepEqual(pickKeyCols(["symbol", "tf", "id"], "tf, symbol"), ["tf", "symbol"]);
});

/* ---------- diff ---------- */

test("diff: tambah / hapus / ubah / sama", () => {
  const a = [
    { id: "1", nama: "Budi" },
    { id: "2", nama: "Ani" },
    { id: "3", nama: "Citra" },
  ];
  const b = [
    { id: "1", nama: "Budi" },
    { id: "3", nama: "Citra!" },
    { id: "4", nama: "Dewi" },
  ];
  const r = diff(a, b, "id");

  assert.deepEqual(r.added.map(x => x.key), ["4"]);
  assert.deepEqual(r.removed.map(x => x.key), ["2"]);
  assert.deepEqual(r.changed.map(x => x.key), ["3"]);
  assert.equal(r.same, 1);
  assert.deepEqual(r.keys, ["id"]);
  assert.deepEqual(r.changed[0].before, { id: "3", nama: "Citra" });
  assert.deepEqual(r.changed[0].after, { id: "3", nama: "Citra!" });
});

test("diff: data identik → same = jumlah baris", () => {
  const rows = [{ id: "1" }, { id: "2" }];
  const r = diff(rows, rows.map(x => ({ ...x })), "id");
  assert.equal(r.same, 2);
  assert.equal(r.added.length + r.removed.length + r.changed.length, 0);
});

test("diff: kolom baru di sisi B ikut dihitung sebagai perubahan", () => {
  const r = diff([{ id: "1" }], [{ id: "1", catatan: "baru" }], "id");
  assert.equal(r.changed.length, 1);
  assert.ok(r.cols.includes("catatan"));
});

test("diff: kunci duplikat dipasangkan sesuai urutan kemunculan", () => {
  const a = [{ id: "1", v: "a" }, { id: "1", v: "b" }];
  const b = [{ id: "1", v: "a" }, { id: "1", v: "c" }];
  const r = diff(a, b, "id");
  assert.equal(r.same, 1);
  assert.equal(r.changed.length, 1);
  assert.equal(r.changed[0].after.v, "c");
});

test("diff: angka dan teks dianggap sama (dibandingkan sebagai teks)", () => {
  const r = diff([{ id: 1, qty: 5 }], [{ id: "1", qty: "5" }], "id");
  assert.equal(r.same, 1);
});

/* ---------- regresi: JSON bersarang ---------- */

test("regresi: objek bersarang yang beda dianggap ubah, bukan sama", () => {
  const a = [{ id: "1", meta: { x: 1 } }];
  const b = [{ id: "1", meta: { x: 99 } }];
  const r = diff(a, b, "id");
  assert.equal(r.changed.length, 1, "objek beda isi harus terdeteksi");
  assert.equal(r.same, 0);
});

test("regresi: objek bersarang identik tetap dianggap sama", () => {
  const a = [{ id: "1", meta: { x: 1, list: [1, 2] } }];
  const b = [{ id: "1", meta: { x: 1, list: [1, 2] } }];
  const r = diff(a, b, "id");
  assert.equal(r.same, 1);
  assert.equal(r.changed.length, 0);
});

test("regresi: array bersarang beda panjang / beda isi terdeteksi", () => {
  assert.equal(diff([{ id: "1", xs: [1, 2] }], [{ id: "1", xs: [1] }], "id").changed.length, 1);
  assert.equal(diff([{ id: "1", xs: [1, 2] }], [{ id: "1", xs: [1, 3] }], "id").changed.length, 1);
  assert.equal(diff([{ id: "1", xs: [1, 2] }], [{ id: "1", xs: [1, 2] }], "id").same, 1);
});

test("regresi: objek vs array, atau objek vs teks, tidak dianggap sama", () => {
  assert.equal(diff([{ id: "1", v: { a: 1 } }], [{ id: "1", v: [1] }], "id").changed.length, 1);
  assert.equal(diff([{ id: "1", v: { a: 1 } }], [{ id: "1", v: "{a:1}" }], "id").changed.length, 1);
  assert.equal(diff([{ id: "1", v: { a: 1 } }], [{ id: "1", v: "" }], "id").changed.length, 1);
});

test("regresi: kedua sisi null/undefined dianggap sama", () => {
  assert.equal(diff([{ id: "1", v: null }], [{ id: "1", v: undefined }], "id").same, 1);
});