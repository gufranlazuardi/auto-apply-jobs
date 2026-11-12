# LinkedIn Job Scraper + Auto Apply

Scraper buat ngumpulin lowongan kerja dari LinkedIn (via guest API, tanpa login), nyaring yang ada email kontaknya di deskripsi, lalu auto-kirim lamaran (resume) ke email tersebut lewat Gmail.

## Cara Kerja

1. **Scraping** (`scrapping.js`) — fetch daftar lowongan dari `linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search` untuk setiap kombinasi keyword (`jobList`) & lokasi (`locationList`), lalu buka detail tiap lowongan dan regex-match alamat email di deskripsinya. Lowongan yang ada email-nya disimpan incremental ke `jobs.json` (aman di-Ctrl+C, hasil yang udah ketemu tetap kesimpen & nggak di-scrape ulang pas dijalanin lagi).
2. **Apply** (`apply.js`) — baca `jobs.json`, kirim email + attachment resume ke tiap alamat email yang ketemu, lalu catat yang udah dikirim di `applied.json` biar nggak kirim dobel kalau dijalanin ulang.
3. **Run sekali jalan** (`run.js`) — jalanin `scrapping.js` lalu lanjut `apply.js` otomatis secara berurutan.

Kalau kena rate limit (HTTP 429) pas scraping, script otomatis retry dengan delay yang makin lama (bukan langsung berhenti).

## Requirement

- Node.js v20.6+ (disaranin v22, karena pakai `fetch` native & flag `--env-file`)
- Package: `cheerio`, `nodemailer`
- Akun Gmail dengan **App Password** (2-Step Verification harus aktif dulu)
- File resume (PDF) disimpan di folder `resume/`

## Instalasi

```bash
npm install
```

### Setup `.env`

Isi `.env` (contoh ada di `.env.example`):

```
SMTP_USER=emailkamu@gmail.com
SMTP_PASS=16karakterapppassword
```

Cara ambil App Password:
1. Aktifkan 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords (pilih app "Mail")
3. Pakai password 16 karakter itu, **bukan** password Gmail asli.

### Setup resume

Taruh file PDF resume kamu di folder `resume/`, lalu sesuaikan nama file di `RESUME_PATH` pada `apply.js`.

## Menjalankan

Jalanin dua tahap sekaligus (scrape lalu auto-apply):

```bash
node run.js
```

Atau jalanin manual satu-satu kalau mau cek hasil scraping dulu sebelum apply:

```bash
# 1. Scraping job + email
node scrapping.js

# 2. Kirim lamaran ke email yang ketemu
node --env-file=.env apply.js
```

## Output

- `jobs.json` — daftar lowongan yang ada email kontaknya (hasil scraping).
- `applied.json` — log lamaran yang udah dikirim (email, title, company, waktu kirim), dipakai buat cegah duplikat kirim.

## Konfigurasi

**`scrapping.js`**
- `jobList` — daftar keyword pekerjaan yang dicari (default: `frontend developer`, `fullstack developer`, `software engineer`).
- `locationList` — daftar lokasi yang dicari (default: `Indonesia`, `Malaysia`).
- `randomDelay()` — jarak waktu antar request (default 15–30 detik) buat ngurangin risiko diblokir LinkedIn.
- `fetchWithRetry()` — jumlah percobaan ulang saat kena rate limit (default 5x).

**`apply.js`**
- `RESUME_PATH` — lokasi file resume yang di-attach.
- `YOUR_NAME` — nama pengirim di body email.
- `buildEmail()` — template subject & body email lamaran.

## Catatan

- LinkedIn cukup agresif nge-rate-limit endpoint guest API ini. Kalau masih sering kena 429 walau udah retry, coba perbesar delay atau kurangi jumlah keyword/lokasi yang di-scrape.
- Gmail punya limit kirim harian (~500 email/hari untuk akun biasa) dan bisa keflag spam kalau kirim terlalu cepat — `apply.js` udah kasih delay 5-10 detik antar kirim, jangan diperkecil drastis.
- `.env`, `jobs.json`, `applied.json`, dan folder `resume/` sengaja di-gitignore karena berisi data sensitif/pribadi.
- Script ini cuma buat scraping data publik yang ditampilkan di halaman pencarian kerja LinkedIn tanpa login — gunakan secara wajar dan sesuai ToS LinkedIn, ini murni buat keperluan personal/belajar.
