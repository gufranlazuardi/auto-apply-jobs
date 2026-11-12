# LinkedIn Job Scraper

Scraper sederhana buat ngumpulin lowongan kerja dari LinkedIn (via guest API, tanpa login) dan nyaring yang ada email kontaknya di deskripsi.

## Cara Kerja

1. Fetch daftar lowongan dari `linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search` berdasarkan keyword & lokasi.
2. Buka detail tiap lowongan, ambil deskripsinya, dan regex-match alamat email.
3. Simpan lowongan yang punya email ke `jobs.json`.
4. Kalau kena rate limit (HTTP 429), script otomatis retry dengan delay yang makin lama (bukan langsung berhenti).

## Requirement

- Node.js (v18+ disaranin, karena pakai `fetch` native)
- Package `cheerio`

## Instalasi

```bash
npm install cheerio
```

## Menjalankan

```bash
node scrapping.js
```

Hasil scraping bakal tersimpan di `jobs.json` pada direktori yang sama.

## Konfigurasi

Edit langsung di `scrapping.js`:

- `jobList` — daftar keyword pekerjaan yang dicari (default: `frontend developer`, `fullstack developer`, `software engineer`).
- `randomDelay()` — jarak waktu antar request (default 15–30 detik) buat ngurangin risiko diblokir LinkedIn.
- `fetchWithRetry()` — jumlah percobaan ulang saat kena rate limit (default 5x).

## Catatan

- LinkedIn cukup agresif nge-rate-limit endpoint guest API ini. Kalau masih sering kena 429 walau udah retry, coba perbesar delay atau kurangi jumlah keyword/halaman yang di-scrape.
- Script ini cuma buat scraping data publik yang ditampilkan di halaman pencarian kerja LinkedIn tanpa login — gunakan secara wajar dan sesuai ToS LinkedIn, ini murni buat keperluan personal/belajar.
