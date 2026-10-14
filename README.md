# TEN API Gateway (api.ten.my.id)

Platform API Gateway modern, ringan, dan cepat berbasis **Cloudflare Workers** & **Cloudflare Workers KV**.

## Fitur Utama

- **Reverse Proxy Gateway**: Meneruskan request dari `api.ten.my.id` ke berbagai microservice/backend secara dinamis.
- **Path-based Routing**: Mengatur route dengan prefix path (misal `/v1/users`, `/wa-bot`, `/webhook`).
- **Autentikasi API Key**: Mengamankan endpoint route dengan opsi mewajibkan API Key (`x-api-key` atau `Authorization: Bearer <key>`).
- **Path Stripping & Custom Headers**: Opsi otomatis memotong prefix path dan menginjeksi custom header ke upstream.
- **CORS Otomatis**: Mendukung CORS preflight `OPTIONS` dan response header secara out-of-the-box.
- **Dashboard Admin Terintegrasi**: Dashboard sederhana, cepat, dan fungsional langsung dari root domain (`/`).
- **Database Cloudflare KV**: Menggunakan KV namespace untuk menyimpan konfigurasi route, API key, dan sesi.

---

## Konfigurasi Cloudflare

### 1. KV Namespace
Konfigurasi KV telah disesuaikan di `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "API_KV"
id = "c20b11151e224d98acf1bea7469700fb"
```

### 2. Environment Variables (Autentikasi Dashboard)
Untuk login ke platform dashboard, buat variabel di dashboard Cloudflare Workers:
- Masuk ke Cloudflare Dashboard -> **Workers & Pages** -> Pilih worker `api-tenmyid`.
- Masuk ke tab **Settings** -> **Variables and Secrets**.
- Tambahkan:
  - `ADMIN_EMAIL`: Email login admin (misal: `admin@ten.my.id`)
  - `ADMIN_PASSWORD`: Password login admin (simpan sebagai **Secret**)

Atau gunakan CLI:
```bash
npx wrangler secret put ADMIN_PASSWORD
```

### 3. Custom Domain
Tambahkan domain kustom di Cloudflare Dashboard:
- Buka worker `api-tenmyid` -> **Settings** -> **Domains & Routes**.
- Klik **Add** -> **Custom Domain**.
- Masukkan `api.ten.my.id`.

---

## Menjalankan Secara Lokal

Untuk menguji di komputer lokal:

```bash
# Install dependency
npm install

# Jalankan lokal dev server
npm run dev
```

---

## Mendeploy ke Cloudflare

```bash
npm run deploy
```

---

## Format Penggunaan API Gateway

### 1. Request Publik
Klien dapat langsung memanggil endpoint yang sudah didaftarkan:
```bash
curl -X GET "https://api.ten.my.id/v1/users"
```

### 2. Request dengan API Key
Jika route diset mewajibkan API Key:
```bash
curl -X POST "https://api.ten.my.id/v1/orders" \
  -H "x-api-key: ten_xxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"item": "Laptop"}'
```
Atau menggunakan header Bearer:
```bash
curl -X GET "https://api.ten.my.id/v1/orders" \
  -H "Authorization: Bearer ten_xxxxxxxxxxxxxxxxxxxxxx"
```
