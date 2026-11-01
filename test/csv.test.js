/* ============================================================
   DiffKit — csv.test.js : parser CSV (kutip ganda, CRLF, BOM).
   Jalankan dengan: npm test  (node --test test/)
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { parseCsv, toObjects } from "../src/csv.js";

test("CSV sederhana: baris judul + data", () => {
  const t = parseCsv("id,nama\n1,Budi\n2,Ani");
  assert.deepEqual(t, [
    ["id", "nama"],
    ["1", "Budi"],
    ["2", "Ani"],
  ]);
});

test("kutip ganda menahan koma dan newline", () => {
  const t = parseCsv('id,catatan\n1,"halo, dunia"\n2,"baris\nkedua"');
  assert.equal(t[1][1], "halo, dunia");
  assert.equal(t[2][1], "baris\nkedua");
});

test("kutip ganda ganda di dalam kutip (\"\") jadi satu tanda kutip", () => {
  const t = parseCsv('id,catatan\n1,"kata ""docker"" bagus"');
  assert.equal(t[1][1], 'kata "docker" bagus');
});

test("CRLF dan BOM ikut ditangani", () => {
  const t = parseCsv("\uFEFFid,nama\r\n1,Budi\r\n2,Ani\r\n");
  assert.deepEqual(t[0], ["id", "nama"]);
  assert.equal(t.length, 3);
  assert.equal(t[2][1], "Ani");
});

test("baris kosong dilewati", () => {
  const t = parseCsv("id\n1\n\n\n2\n");
  assert.equal(t.length, 3);
});

test("baris terakhir tanpa newline tetap terbaca", () => {
  const t = parseCsv("id\n1");
  assert.deepEqual(t, [["id"], ["1"]]);
});

test("toObjects: judul dipakai jadi kunci, kolom kurang jadi string kosong", () => {
  const rows = toObjects(parseCsv("id, nama\n1,Budi"));
  assert.deepEqual(rows, [{ id: "1", nama: "Budi" }]);

  const short = toObjects(parseCsv("id,nama,catatan\n1,Budi"));
  assert.equal(short[0].catatan, "");
});

test("toObjects: judul kosong diberi nama kolomN", () => {
  const rows = toObjects(parseCsv("id,,nilai\n1,x,9"));
  assert.deepEqual(Object.keys(rows[0]), ["id", "kolom2", "nilai"]);
});