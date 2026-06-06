# กลยุทธ์การจัดการฐานข้อมูล (SQLite & PostgreSQL)

LearnLab Bridge ถูกออกแบบมาให้มีความยืดหยุ่นในการเลือกใช้ฐานข้อมูล โดยปัจจุบันเริ่มต้นด้วย **SQLite** เพื่อความง่ายในการติดตั้ง แต่รองรับการขยายตัวไปยัง **PostgreSQL** ในอนาคต

## สถานะปัจจุบัน
- **ORM**: Prisma
- **Default Database**: SQLite (จัดเก็บในไฟล์ `infrastructure/data/nextjs/dev.db`)
- **Schema**: ใช้ `schema.prisma` ที่เป็นกลาง (Agnostic) ไม่มีการใช้ฟีเจอร์เฉพาะทางของฐานข้อมูลใดฐานข้อมูลหนึ่งเป็นพิเศษ

## วิธีการเปลี่ยนไปใช้ PostgreSQL
หากต้องการย้ายระบบไปใช้ PostgreSQL ในอนาคต ให้ดำเนินการตามขั้นตอนดังนี้:

### 1. ปรับปรุงไฟล์ `.env`
เปลี่ยนค่า `DATABASE_URL` ให้ชี้ไปที่ PostgreSQL:
```env
# ยกเลิก SQLite
# DATABASE_URL=file:/app/data/dev.db

# เปิดใช้งาน PostgreSQL (เชื่อมต่อผ่าน Docker Service)
DATABASE_URL=postgresql://llbridge:llbridge_pass@llbridge-db-pg:5432/llbridge?schema=public
POSTGRES_USER=llbridge
POSTGRES_PASSWORD=llbridge_pass
POSTGRES_DB=llbridge
```

### 2. ปรับปรุง Prisma Schema
เปิดไฟล์ `platform/apps/web/prisma/schema.prisma` และเปลี่ยน provider:
```prisma
datasource db {
  provider = "postgresql" // เปลี่ยนจาก "sqlite"
  url      = env("DATABASE_URL")
}
```

### 3. เริ่มการทำงานของ PostgreSQL Container
ระบบได้เตรียม PostgreSQL Service ไว้ใน `docker-compose.yml` ภายใต้โปรไฟล์ชื่อ `postgres` คุณสามารถสั่งรันได้ดังนี้:
```bash
docker compose --profile postgres up -d
```

### 4. รันการ Migrate ฐานข้อมูล
สั่งให้ Prisma สร้างโครงสร้างตารางใน PostgreSQL:
```bash
docker compose exec llbridge-web npx prisma migrate dev --name init_postgres
```

## ข้อควรระวังในการเขียน Code (เพื่อให้ยืดหยุ่น)
- **หลีกเลี่ยง Raw SQL**: ให้ใช้ Prisma Client Methods (`findMany`, `create`, `update`) เสมอ
- **Data Types**: ใช้ Type มาตรฐานที่ Prisma รองรับข้ามฐานข้อมูล (เช่น `String`, `Int`, `DateTime`, `Json`)
- **Auto-increment**: Prisma จัดการ `cuid()` หรือ `uuid()` ให้โดยอัตโนมัติ ซึ่งทำงานได้ดีทั้งใน SQLite และ Postgres

---
*จัดทำเมื่อ: 31 พฤษภาคม 2569*
