# TEN API Gateway (api.ten.my.id)

Platform API Gateway modern, tangguh, dan cepat berbasis **Cloudflare Workers** & **Cloudflare Workers KV**.

## Fitur Unggulan

- **Dynamic Reverse Proxy Gateway**: Meneruskan request dari `api.ten.my.id` ke berbagai microservice/backend secara dinamis.
- **⚡ Google Apps Script (GAS) Router & Shortener**:
  - Panggil URL Apps Script tanpa kerumitan redirect 302 dan masalah CORS.
  - **Instant Shortener**: `https://api.ten.my.id/gas/<DEPLOYMENT_ID>` otomatis terhubung ke script Google Anda.
  - Dukungan kustom route alias (misal: `https://api.ten.my.id/absen` -> GAS Deployment ID).
- **Edge Caching**: Opsi menyimpan cache respon `GET` di Cloudflare Edge (TTL detik) untuk respon instan (< 15ms).
- **Rate Limiting**: Pencegahan spam dan overload per Client IP atau per API Key (request/menit).
- **Live Activity Logs**: Menampilkan riwayat 100 request terakhir lengkap dengan HTTP method, status code, latency (ms), dan IP klien.
- **Uptime / Health Check Ping**: Menguji ketersediaan backend upstream secara langsung dari dashboard.
- **Autentikasi & Scoping API Key**: Pembatasan hak akses route tertentu untuk API key tertentu (`x-api-key` atau Bearer token).
- **Dashboard Admin Terintegrasi**: Dashboard responsif dan fungsional langsung diakses dari browser (`/`).
- **CI/CD GitHub Actions**: Otomatisasi deploy ke Cloudflare Workers setiap push ke branch `main`.

---

## Panduan Penggunaan Google Apps Script (GAS)

### Cara 1: Instant Shortener (Tanpa Konfigurasi)
Cukup panggil URL berikut:
```bash
# GET Request
curl "https://api.ten.my.id/gas/AKfycbx1234567890abcdefg?action=getData"

# POST Request
curl -X POST "https://api.ten.my.id/gas/AKfycbx1234567890abcdefg" \
  -H "Content-Type: application/json" \
  -d '{"nama": "Budi", "status": "Hadir"}'
```

### Cara 2: Custom Alias di Dashboard
1. Buka dashboard `api.ten.my.id` -> Tab **Routes** -> Klik **+ Route Apps Script**.
2. Masukkan Prefix Path (misal `/presensi`) dan Deployment ID Google Anda.
3. Klien sekarang bisa memanggil `https://api.ten.my.id/presensi` secara langsung dan rapi!

---

## Konfigurasi Cloudflare

### 1. KV Namespace
Binding KV telah dikonfigurasi di `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "API_KV"
id = "c20b11151e224d98acf1bea7469700fb"
```

### 2. Environment Variables (Autentikasi Dashboard)
Atur variabel di Cloudflare Dashboard -> **Workers & Pages** -> `api-tenmyid` -> **Settings** -> **Variables and Secrets**:
- `ADMIN_EMAIL`: Email login admin platform.
- `ADMIN_PASSWORD`: Password login admin platform (simpan sebagai **Secret**).

### 3. GitHub Actions CI/CD Secrets
Untuk auto-deploy via GitHub Actions, tambahkan Secrets di repository GitHub Anda (**Settings** -> **Secrets and variables** -> **Actions**):
- `CLOUDFLARE_API_TOKEN`: API Token Cloudflare dengan izin Edit Workers.
- `CLOUDFLARE_ACCOUNT_ID`: Account ID Cloudflare Anda.

---

## Menjalankan Secara Lokal

```bash
# Install dependency
npm install

# Jalankan lokal dev server
npm run dev
```

## Mendeploy Manual
```bash
npm run deploy
```
