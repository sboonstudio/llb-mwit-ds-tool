# Learning Progress Intelligence: Design Specification

เอกสารฉบับนี้ระบุโครงสร้างฐานข้อมูลและระบบ API สำหรับการประมวลผลข้อมูลการเรียนรู้ (Insights) เพื่อนำไปสร้าง Dashboards

## 1. Aggregation Database Schema (Prisma)

ตารางสรุปผลเพื่อลดภาระการ Query จาก Raw Logs

```prisma
// สรุปกิจกรรมรายวันของนักเรียน
model DailyUserStats {
  id                String   @id @default(cuid())
  date              DateTime @db.Date
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  totalActiveTime   Int      // รวมเวลาที่เปิด Lab (นาที)
  sessionCount      Int      // จำนวนครั้งที่ Login/Spawn
  cellExecutions    Int      // จำนวนครั้งที่รันโค้ดทั้งหมด
  successExecutions Int      // จำนวนครั้งที่รันผ่าน
  errorExecutions   Int      // จำนวนครั้งที่รันพลาด
  lastSeen          DateTime
  
  @@unique([date, userId])
}

// สรุปความคืบหน้าตามหัวข้อ/บทเรียน
model TopicProgress {
  id              String   @id @default(cuid())
  notebookPath    String   // ชื่อไฟล์หรือ Path ของบทเรียน
  totalStudents   Int      // จำนวนนักเรียนที่เคยเปิดไฟล์นี้
  avgSuccessRate  Float    // อัตราการรันผ่านเฉลี่ย
  commonErrorType String?  // Error ที่พบบ่อยที่สุดในบทเรียนนี้
  updatedAt       DateTime @updatedAt

  @@unique([notebookPath])
}

// สรุปสถิติ Error รายวัน
model ErrorAnalytics {
  id          String   @id @default(cuid())
  date        DateTime @db.Date
  errorType   String   // เช่น SyntaxError, NameError
  count       Int
  sampleCode  String?  @db.Text

  @@unique([date, errorType])
}
```

## 2. Dashboard API Design

### Overview API (`GET /api/dashboard/overview`)
- ข้อมูล Real-time: Active Users, Total Reg, Resource Health.

### Trends API (`GET /api/dashboard/trends`)
- ข้อมูล Timeseries สำหรับกราฟ Code Executions และ Active Users.

### Intelligence API (`GET /api/dashboard/intelligence/errors`)
- วิเคราะห์จุดที่นักเรียนติดขัด (Top Errors) และนักเรียนกลุ่มเสี่ยง (At-risk students).

### Topic API (`GET /api/dashboard/intelligence/topics`)
- สรุปความนิยมและการทำสำเร็จของแต่ละบทเรียน (Completion rate, Avg time).

## 3. Data Processing Strategy (ETL)

1. **Extraction**: ดึงข้อมูลจาก `ActivityLog` (Raw Data)
2. **Transformation**: จัดกลุ่มตาม `date`, `userId`, และ `notebookPath`
3. **Loading**: บันทึกลงใน Aggregation Tables ทุก 10-30 นาที (Cron Job)
4. **Caching**: ใช้ Next.js Data Cache สำหรับข้อมูลที่ไม่เปลี่ยนแปลงบ่อย

## 4. Hierarchical Grouping Strategy (v2 Upgrade)

เพื่อให้ข้อมูลมีความหมายเชิงการเรียนการสอนมากขึ้น ระบบจะจัดกลุ่มเหตุการณ์ดังนี้:

### 4.1 Environment Lifecycle Group (ENV_LIFECYCLE)
ยุบรวมเหตุการณ์ที่เกี่ยวกับสภาพแวดล้อมการเรียนเพื่อให้เห็นความพร้อมของระบบ:
- **Action Type: READY_LAB** (จาก `LAB_SPAWN`, `JupyterHub Launch`)
- **Action Type: READY_KERNEL** (จาก `KERNEL_START`)
- **Action Type: STOP_ENV** (จาก `LAB_STOP`, `KERNEL_STOP`)

### 4.2 File-Centric Execution Group
จัดกลุ่มการรันโค้ดโดยยึดโครงสร้างไฟล์เป็นหลัก:
- **Level 1 (Topic):** Folder Name (เช่น `lab01-basics`)
- **Level 2 (Filename):** Specific File (เช่น `exercise.ipynb`)
- **Activity:** `CELL_EXECUTION` (Success/Error counts)

---
*บันทึกข้อเสนอและปรับปรุง: 7 มิถุนายน 2569*
