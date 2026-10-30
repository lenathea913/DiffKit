# 🧮 DiffKit — Bandingkan JSON/CSV Secara Offline

[![Build](https://github.com/lenathea913/DiffKit/actions/workflows/ci.yml/badge.svg)](https://github.com/lenathea913/DiffKit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
![Vite](https://img.shields.io/badge/build-Vite_5-646CFF.svg)

> **English:** A free, open-source **offline JSON/CSV diff tool** that runs entirely in your browser — drop in two files (or paste text), pick the row key, and see what was added, removed or changed. Nothing is ever uploaded. Built with vanilla JS + Vite, MIT licensed.

Alat untuk **membandingkan dua file JSON atau CSV** tanpa mengunggahnya ke mana pun: semua diproses di browser. Cocok untuk memeriksa hasil ekspor, backup, konfigurasi, atau data sebelum-sesudah perubahan script.

## ✨ Fitur (MVP saat ini)

- **Dua input** — pilih file (`.json` / `.csv` / `.txt`) atau tempel teks langsung
- **Deteksi format otomatis** — JSON (array/objek) atau CSV dengan baris judul
- **Pilihan kunci baris** — ketik kolom pembanding (`id, symbol`), atau biarkan otomatis (mendeteksi kolom mirip `id`/`key`/`symbol`, selanjutnya kolom pertama)
- **Empat hasil** — Tambah (hanya di B), Hapus (hanya di A), Ubah (kunci sama, isi beda), Sama
- **Detail per baris** — nilai lama vs baru, dengan warna hijau/merah/amber
- **Offline penuh** — tidak ada permintaan jaringan, tidak ada akun

## 🚀 Mulai cepat

**Syarat:** Node.js ≥ 18 ([nodejs.org](https://nodejs.org)) dan browser apa pun.

```bash
git clone https://github.com/lenathea913/DiffKit.git
cd DiffKit
npm install     # sekali saja
npm run dev     # lalu buka http://localhost:5176
```

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | server pengembangan (port **5176**, dikunci) |
| `npm run build` | build produksi ke `dist/` |
| `npm run preview` | pratinjau hasil build |

> Port dikunci di `vite.config.js` supaya tidak bentrok dengan proyek lokal lain.

## 🧱 Struktur proyek

```
DiffKit/
├── index.html      # dua pane input, toolbar, ringkasan, daftar hasil
├── vite.config.js  # port dikunci, output build
└── src/
    ├── csv.js      # parser CSV (kutip ganda, CRLF, BOM)
    ├── diff.js     # deteksi format, pemilihan kunci, diff per baris
    ├── main.js     # binding file/keyboard, render hasil
    └── style.css   # token & komponen visual
```

Konvensi: modul kecil satu-tanggung-jawab, komentar bahasa Indonesia, tanpa framework/pustaka runtime — Vite hanya sebagai toolchain.

## ⚠️ Keterbatasan (dan kenapa masih MVP)

- **Perbandingan satu arah & satu kunci** — belum ada tampilan *side-by-side* penuh, diff per karakter, atau konsep "sebelum/sesudah" per kolom tertentu.
- **Belum ada ekspor hasil** — tombol unduh diff (CSV/JSON) ada di roadmap.
- **Kunci duplikat diperlakukan adil** (dibandingkan berdasarkan urutan kemunculan), tapi **baris tanpa kunci yang sama dianggap tambah/hapus** — bukan "berpindah".
- **Kolom judul duplikat pada CSV disatukan** (yang terakhir menang) — periksa seandainya file-mu memakai judul kembar.
- **Batas tampil 120 baris** di daftar hasil (ringkasan angka tetap lengkap) agar halaman tetap responsif.
- Nama **DiffKit kemungkinan besar tidak unik** di ekosistem — cek ketersediaan sebelum publikasi/publish ke registry.

## 🗺️ Roadmap (belum dikerjakan)

- Ekspor hasil diff ke CSV/JSON
- Diff per kolom terpilih (abaikan kolom tertentu, mis. `updated_at`)
- Mode JSON *deep-diff* untuk objek bersarang
- Simpan preferensi (kunci, abaikan kolom) di localStorage
- Bandingkan via URL/parameter agar bisa dibagikan tanpa mengunggah data

Lihat [Issues](https://github.com/lenathea913/DiffKit/issues) untuk detail & diskusi.

## 🤝 Berkontribusi

1. Fork & buat branch fitur (`git checkout -b fitur/nama-fitur`)
2. Ikuti pola yang ada: modul kecil, komentar Indonesia, tanpa dependensi baru tanpa diskusi dulu
3. Pastikan `npm run build` lulus
4. Buka Pull Request yang menjelaskan *perubahan* dan *mengapa*

Bug atau format file yang gagal dibaca? Buka [Issues](https://github.com/lenathea913/DiffKit/issues) — sertakan potongan data (dengan data sensitif yang sudah disamarkan).

## 🔒 Privasi

File yang kamu pilih tidak pernah meninggalkan browser: dibaca lewat `FileReader`, diproses di memori, dan tidak disimpan (termasuk tidak dikirim ke server mana pun).

## 📄 Lisensi

[MIT](LICENSE) — bebas dipakai, dimodifikasi, dan didistribusikan.
