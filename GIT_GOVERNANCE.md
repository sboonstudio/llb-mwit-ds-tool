# 🚀 LearnLab Bridge: Git Governance & Release Lifecycle Policy

นโยบายนี้จัดทำขึ้นเพื่อเป็นมาตรฐานในการบริหารจัดการ source code และวงจรการปล่อยซอฟต์แวร์ของโครงการ LearnLab Bridge เพื่อความเสถียรและความเป็นมืออาชีพ

## 1. มาตรฐานข้อความ Commit (Conventional Commits)
ทุกการ Commit ต้องใช้รูปแบบ: `type(scope): description`

*   ✨ **`feat`**: เพิ่มฟีเจอร์ใหม่
*   🐛 **`fix`**: แก้ไขบั๊ก
*   📝 **`docs`**: แก้ไขเอกสาร
*   ⚡ **`perf`**: เพิ่มประสิทธิภาพ
*   ♻️ **`refactor`**: ปรับปรุงโครงสร้างโค้ด (ไม่ใช่การแก้บั๊กหรือเพิ่มฟีเจอร์)
*   🔧 **`chore`**: งานจิปาถะ (อัปเดต Dependency, แก้ไขสคริปต์ Build)
*   🧪 **`test`**: เพิ่ม/แก้ไขชุดทดสอบ

---

## 2. โครงสร้าง Branch มาตรฐาน (Branching Model)
ใช้ระบบ **GitLab Flow**:

| Branch | หน้าที่ | การเข้าถึง |
| :--- | :--- | :--- |
| **`main`** | **Production**: โค้ดที่เสถียรที่สุดและใช้งานจริง | **Protected** (เฉพาะ Lead Dev) |
| **`develop`** | **Integration**: รวมฟีเจอร์ใหม่ๆ เพื่อทดสอบก่อน Release | **Protected** (ผ่าน MR เท่านั้น) |
| **`feature/*`** | **Development**: แยกทำตามหัวข้องาน/ฟีเจอร์ | **Developer** (ลบทิ้งเมื่อ Merge เสร็จ) |
| **`hotfix/*`** | **Urgent**: แก้ไขบั๊กวิกฤตบน Production | **Developer** (Merge เข้าทั้ง main/develop) |

---

## 3. ลำดับขั้นตอนการออกเวอร์ชัน (Release Stages)
ใช้ระบบ **Semantic Versioning (SemVer)**: `vMAJOR.MINOR.PATCH[-STAGE.n]`

### **ลำดับขั้นของเวอร์ชัน (Lifecycle Stages):**
1.  **`Alpha` (v0.x.x-alpha.n)**: ช่วงเริ่มต้นพัฒนา ฟีเจอร์ยังไม่ครบถ้วน
2.  **`Beta` (v0.x.x-beta.n)**: ฟีเจอร์หลักครบ (Feature Complete) เปิดให้กลุ่มผู้ใช้เฉพาะทดสอบ
3.  **`RC` (Release Candidate) (v0.x.x-rc.n)**: มีความเสถียรสูง เตรียมเป็นเวอร์ชันจริง
4.  **`Stable / Production` (v1.x.x)**: เวอร์ชันสมบูรณ์ที่พร้อมใช้งานจริงอย่างเป็นทางการ (GA)

---

## 4. ข้อกำหนดการใส่ Tag
*   **ทุกครั้งที่ Merge เข้า `main`**: ต้องมีการระบุเวอร์ชันใหม่เสมอ
*   **รูปแบบ Tag**: ต้องขึ้นต้นด้วย `v` เช่น `v1.2.0-beta.1`
*   **Changelog**: ข้อมูลในหน้า Release จะถูกสร้างจาก Commit messages โดยอัตโนมัติ

---

## 5. ข้อกำหนดทางเทคนิค (Technical Rules)
*   **No Direct Push**: ห้าม Push โค้ดลง `main` หรือ `develop` โดยตรงเด็ดขาด
*   **Merge Requests**: การ Merge เข้าสายหลักต้องผ่านการตรวจสอบ (Review) อย่างน้อย 1 คน
*   **Clean History**: แนะนำให้ใช้ `git rebase` เพื่อรักษาประวัติ Git ให้เป็นเส้นตรงและอ่านง่าย

---
*ประกาศใช้เมื่อ: 31 พฤษภาคม 2569*
