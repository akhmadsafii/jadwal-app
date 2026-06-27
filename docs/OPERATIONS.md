# Operasional produksi

## URL aplikasi dan masa sesi

Tambahkan konfigurasi berikut pada `.env` produksi agar link approval WhatsApp selalu memakai domain publik:

```env
APP_URL="https://domain-aplikasi.example"
JWT_EXPIRY="365d"
APPROVAL_LINK_EXPIRY="7d"
```

`JWT_EXPIRY` mengatur lama sesi login pada perangkat. `APPROVAL_LINK_EXPIRY` mengatur masa berlaku link approval WhatsApp.

## Database dan migration

Jalankan migration `prisma/migrations/` memakai owner database atau role yang mempunyai hak `CREATE`, `ALTER`, dan `GRANT`. User aplikasi hanya perlu `SELECT`, `INSERT`, `UPDATE`, dan `DELETE` pada semua tabel aplikasi.

## Backup PostgreSQL

Jalankan harian dari server/cron yang memiliki `pg_dump`:

```bash
pg_dump "$DATABASE_URL" --format=custom --file="backup-jadwal-$(date +%F).dump"
```

Simpan backup di lokasi terpisah dan uji pemulihan secara berkala:

```bash
pg_restore --clean --if-exists --dbname="$DATABASE_URL" backup-jadwal-YYYY-MM-DD.dump
```

## Monitoring

Pantau `GET /api/health`. Respons `200` dengan `database: ok` berarti aplikasi dan database dapat diakses; respons `503` memerlukan pemeriksaan log Node.js/PostgreSQL.
