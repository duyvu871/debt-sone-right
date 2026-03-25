# Sổ nợ (Debt ledger)

Ứng dụng đơn giản: **một trang** với thống kê tổng nợ, danh sách chủ nợ, khoản nợ, lịch sử trả nợ. Form thêm/sửa dùng **modal phía dưới màn hình**.

## Biến môi trường

File mẫu **đầy đủ**: [`env.example`](../env.example) ở root repo.

```bash
cp env.example .env
```

Hoặc `make env` (chỉ tạo nếu `.env` chưa có).

| Biến | Mô tả |
|------|--------|
| `DATABASE_URL` | PostgreSQL (`@prisma/adapter-pg` / node-postgres). |
| `DEBT_APP_PASSWORD` | Mật khẩu mọi thao tác ghi trên UI. |
| `TENANT_ID` | *(Tuỳ chọn)* UUID `Organization`; bỏ trống = org đầu tiên. |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | `false` / `0` / `no` nếu TLS lỗi chứng chỉ (ưu tiên CA đúng trên production). |
| `DIRECT_DATABASE_URL` | *(Tuỳ chọn)* Shadow DB cho `prisma migrate dev`. |
| `POSTGRES_*` | Dùng cho **Docker Compose** (đọc từ `.env` cùng `docker-compose.yml`). |

## shadcn UI

- Cấu hình: [`components.json`](../components.json) (`ui` → `src/shared/ui`, `cn` → `@/lib/utils` → [`src/lib/utils.ts`](../src/lib/utils.ts)).
- Thêm component: `npm run ui:add -- sheet -y` (thay `sheet` bằng tên khác; `-o` để ghi đè).

### React Bits (animation) + MCP

- Registry đã khai báo trong `components.json` (`@react-bits` → `https://reactbits.dev/r/{name}.json`).
- Cài một component (ví dụ FadeContent từ JSON registry):  
  `npx shadcn@latest add "https://reactbits.dev/r/FadeContent-TS-TW.json" --yes`  
  *(sau đó có thể chuyển file vào `src/shared/ui` cho đúng FSD, như `fade-content.tsx` hiện tại).*
- **MCP** (Cursor / Claude): bật [shadcn MCP](https://ui.shadcn.com/docs/mcp), ví dụ `npx shadcn@latest mcp init --client cursor`, rồi gợi ý kiểu *“add FadeContent from React Bits”* — xem [React Bits MCP](https://reactbits.dev/get-started/mcp).
- Animation dashboard: **GSAP** (`FadeContent` React Bits) cho bento, header, skeleton, empty state, danh sách mobile (stagger), và nội dung form trong bottom sheet (`replayWhenOpen` đồng bộ với `open` của Sheet); **tw-animate-css** vẫn dùng cho overlay / khung Sheet (`animate-in` / slide).

## Makefile

```bash
make help
```

Một vài target: `make setup` (env + `npm i` + prisma generate), `make db-bootstrap` (Docker Postgres + migrate deploy + seed), `make dev`, `make docker-up`, `make prisma-migrate-deploy`, …

## Khởi tạo DB (không Docker)

```bash
make prisma-migrate-deploy
make prisma-seed
```

Seed mặc định: tạo **organization** nếu chưa có; nếu tenant **chưa có chủ nợ** thì thêm **~30 chủ nợ**, **~60 khoản nợ** (VND/USD, OPEN/OVERDUE/COMPLETED) và **hàng chục bản ghi trả nợ**. Nếu DB đã có chủ nợ, seed sẽ bỏ qua lô demo — chạy `npx prisma migrate reset` để nạp lại từ đầu, hoặc thêm lô nữa:

```bash
SEED_DEMO_BULK=1 npx prisma db seed
```

## Docker Compose (PostgreSQL)

1. `cp env.example .env` (đã có `POSTGRES_*` và `DATABASE_URL` khớp mặc định).
2. `make docker-up`
3. `make prisma-migrate-deploy` và `make prisma-seed`

Log: `make docker-logs`. Dừng: `make docker-down`.

## PM2 (production trên host)

Sau `make build`, cấu hình `DATABASE_URL` / `DEBT_APP_PASSWORD` trong môi trường (hoặc `.env.production`):

```bash
make pm2-start
```

Xem [`../ecosystem.config.cjs`](../ecosystem.config.cjs). Log: `npx pm2 logs debt-done-right`. Reload: `make pm2-reload`. Dừng: `make pm2-stop`.

## API

- `GET /api/ledger` — đọc công khai. Ghi qua các route `POST`/`PATCH`/`DELETE` dưới `/api/creditors`, `/api/debts`, `/api/repayments` (và `POST .../append-principal`) sau khi xác thực (`POST /api/auth/mutation-password` đặt cookie phiên 1 giờ).
