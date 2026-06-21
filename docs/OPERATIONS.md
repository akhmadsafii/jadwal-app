# Operasional produksi

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
