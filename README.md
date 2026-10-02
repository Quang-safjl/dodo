# Đô Đô Tea Shop - Web App Quản lý quán trà sữa

Tech stack: React (Vite) + Node.js/Express + MySQL + JWT.

## Cấu trúc thư mục

- `client/`: frontend React + Ant Design
- `server/`: backend Express + Sequelize (MySQL)
- `database/`: `schema.sql`, `seed.sql`

## 1) Tạo Database + dữ liệu mẫu

Mở MySQL (Workbench/CLI) và chạy lần lượt:

- `database/schema.sql`
- `database/seed.sql`

Database mặc định: `do_do_tea_shop`

Tài khoản mẫu:

- Admin: `admin@dodo.local` / `admin123`
- Manager: `manager@dodo.local` / `manager123`
- Staff: `staff@dodo.local` / `staff123`

## 2) Chạy Backend

Tạo file `.env` từ mẫu:

- Copy `server/.env.example` → `server/.env`
- Điền `DB_HOST/DB_USER/DB_PASSWORD/...` đúng máy bạn

Chạy:

```bash
cd server
npm install
npm run dev
```

API: `http://localhost:5000`
Healthcheck: `GET /health`

## 3) Chạy Frontend

```bash
cd client
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Ghi chú: Vite đã cấu hình proxy `/api` → `http://localhost:5000`.

## API chính (tóm tắt)

- `POST /api/auth/login`
- `GET /api/products` (staff)
- `POST /api/orders` (staff)
- `PUT /api/orders/:id/complete` (staff)
- `GET /api/reports/revenue` (manager)
- `GET /api/inventory` (manager)
- `POST /api/inventory/receipt` (manager)
- `CRUD /api/menu/*, /api/promotions, /api/employees` (manager/admin)

