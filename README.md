# debt_done_right

Single-page ứng dụng sổ nợ (Next.js + Prisma + PostgreSQL): tổng quan số nợ, chủ nợ, CRUD nợ và trả nợ. **Không** đăng nhập; thao tác ghi cần `DEBT_APP_PASSWORD`.

## Cấu hình

- Biến môi trường: **[`env.example`](env.example)** → `cp env.example .env` hoặc `make env`
- Chi tiết, Docker, PM2: [docs/README.md](docs/README.md)

## Chạy local

```bash
make setup          # hoặc: cp env.example .env && npm install && npm run prisma:generate
make docker-up      # Postgres trong Docker (tuỳ chọn)
make db-bootstrap   # migrate deploy + seed (cần DB đã chạy)
make dev
```

Mở [http://localhost:3000](http://localhost:3000).

**Makefile:** `make help`

## Scripts npm

- `npm run build` — production build
- `npm run typecheck` — TypeScript
- `npm run lint` — Biome
