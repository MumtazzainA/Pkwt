# Cara Setup Email Notifications untuk PKWT Management

## Langkah 1: Buat Gmail App Password

Untuk keamanan, Gmail tidak mengizinkan login dengan password biasa. Anda harus membuat **App Password**.

### Cara Membuat App Password:

1. **Buka Google Account**: https://myaccount.google.com/
2. **Klik "Security"** di menu sebelah kiri
3. **Aktifkan "2-Step Verification"** (jika belum aktif)
   - Klik "2-Step Verification"
   - Ikuti langkah-langkahnya (verify dengan phone number)
   - Aktifkan
4. **Kembali ke Security** → Scroll ke bawah
5. **Klik "App passwords"** atau "App-specific passwords"
6. **Pilih app**: "Mail"
7. **Pilih device**: "Other (custom name)" → ketik "PKWT App"
8. **Klik "Generate"**
9. **Copy 16-digit password** yang muncul (contoh: `abcd efgh ijkl mnop`)

## Langkah 2: Edit File .env

Buka file `.env` di root project dan edit:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email-anda@gmail.com           # ← Ganti dengan email Gmail Anda
SMTP_PASS=abcdefghijklmnop               # ← Paste App Password (tanpa spasi)
```

**Contoh lengkap:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@gmail.com
SMTP_PASS=abcdefghijklmnop
```

⚠️ **PENTING**: 
- Gunakan App Password, BUKAN password Gmail biasa
- Hapus semua spasi dari App Password
- Jangan share file .env ke orang lain

## Langkah 3: Restart Server

Setelah edit `.env`, restart server:

```bash
# Stop server yang running (Ctrl+C)
# Lalu start lagi:
npm run server
```

## Langkah 4: Test Email

### A. Buat Kontrak Baru dengan End Date 30 Hari Lagi

1. Buka halaman "Input Data"
2. Buat kontrak dengan:
   - End Date = 30 hari dari sekarang
   - Status = Active
3. Save

### B. Tunggu Checker (Otomatis)

Sistem akan check setiap 1 jam. Untuk test langsung:
- Restart server (sistem akan check saat startup)

### C. Cek Email

1. Buka email inbox Anda
2. Cari email dengan subject: **"Pemberitahuan: Kontrak PKWT Akan Berakhir"**
3. Email akan dikirim ke **semua user** di database

## Troubleshooting

### Email Tidak Terkirim?

**1. Cek Log Server**

Di terminal server, cari pesan error seperti:
```
❌ [Email Service] Error sending email to admin@gmail.com
```

**2. Error "Invalid login"**

✅ **Solusi**: Pastikan menggunakan App Password, bukan password biasa

**3. Error "Connection timeout"**

✅ **Solusi**: 
- Cek koneksi internet
- Pastikan port 587 tidak diblokir firewall

**4. Email masuk ke Spam**

✅ **Solusi**: 
- Cek folder Spam di Gmail
- Mark email sebagai "Not Spam"

### Cek Apakah Email Terkirim?

1. Buka halaman "Notifikasi"
2. Lihat badge **"✉️ Email terkirim"** di setiap notifikasi
3. Jika muncul, berarti email berhasil dikirim

## SMTP Settings untuk Provider Lain

### Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Yahoo Mail:
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

### Custom SMTP:
```env
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587               # atau 465 untuk SSL
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-smtp-password
```

## Fitur Email Notification

✅ **Dikirim ke semua user** di database  
✅ **HTML template** dengan styling menarik  
✅ **3 level urgency**: Info (30d), Warning (7d), Critical (1d)  
✅ **Detail kontrak** lengkap dalam email  
✅ **Tracking**: System tahu email sudah terkirim atau belum  

---

**Butuh bantuan?** Check error log di terminal server untuk detail error message.
