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
| **`main`** | **Production**: โค้ดที่เสถียรที่สุดและใช้งานจริง (Private) | **Protected** |
| **`develop`** | **Integration**: รวมฟีเจอร์ใหม่ๆ เพื่อทดสอบก่อน Release | **Protected** |
| **`public/export-mwit-ds`** | **Public Tool**: สำหรับส่งออกไปยัง Repo สาธารณะ | **Worktree Isolated** |
| **`feature/*`** | **Development**: แยกทำตามหัวข้องาน/ฟีเจอร์ | Developer |

---

## 3. ระบบ Git Worktree (Multi-Agent Safe)
เพื่อป้องกันความสับสนเมื่อมีการสลับ Agent AI หรือสลับบริบทการทำงาน โครงการนี้ใช้ **Git Worktree** ในการแยกสภาพแวดล้อม:

*   **Primary Path**: `/learnlab-bridge` (Branch: `main`)
*   **Export Path**: `/learnlab-bridge-public` (Branch: `public/export-mwit-ds`)

### **กฎสำหรับ Agent AI:**
1.  **Context Check**: ก่อนเริ่มงาน Agent ต้องรัน `git worktree list` และ `git remote -v` เสมอ
2.  **Isolated Commits**: ห้ามสลับ Branch ไปมาใน Folder เดียวกัน ให้ทำงานใน Folder ที่กำหนดไว้เท่านั้น
3.  **Sync Protocol**: การส่งออกโค้ดจาก `main` ไปยัง `public` ต้องทำผ่านการ Merge/Cherry-pick ข้าม Worktree เท่านั้น

---

## 4. มาตรฐานเวอร์ชัน (Versioning & Tags)
ใช้ระบบ **Semantic Versioning (SemVer)**: `vMAJOR.MINOR.PATCH[-STAGE]`

*   **Single Source of Tag**: ต้องสร้าง Tag ที่ Branch `main` เป็นหลัก
*   **Dual Remote Sync**: เมื่อสร้าง Tag แล้ว ต้อง Push ไปยังทั้ง `origin` และ `public` remotes เสมอ เพื่อให้เวอร์ชันตรงกัน

---

## 5. ลำดับขั้นตอนการ Release (Sync Workflow)
เมื่อต้องการ Release เวอร์ชันใหม่:
1.  อัปเดตไฟล์ `VERSION` ใน `main`
2.  Commit และ Tag `vX.X.X-alpha` ในโฟลเดอร์ `/learnlab-bridge`
3.  ไปที่โฟลเดอร์ `/learnlab-bridge-public` แล้วทำการซิงโครไนซ์โค้ด
4.  อัปเดตไฟล์ `VERSION` ใน Public Branch ให้ตรงกัน
5.  Push ทั้ง 2 Remotes พร้อม Tags

---

## 6. ข้อกำหนดทางเทคนิค (Technical Rules)
*   **No Direct Push**: ห้าม Push โค้ดลง `main` โดยตรง (เว้นแต่เป็นการแก้ไขจิปาถะที่ผ่านการตรวจสอบแล้ว)
*   **IP-Based Security**: (v0.4.3+) ต้องคงมาตรการตรวจสอบความปลอดภัยราย IP ในระบบลงทะเบียนไว้เสมอ
*   **Clean History**: รักษาประวัติ Git ให้สะอาดเพื่อให้อ่านง่ายเมื่อสลับผู้ปฏิบัติงาน

---
*อัปเดตล่าสุด: 4 มิถุนายน 2569 (จัดระเบียบใหม่สำหรับ Multi-Agent Support)*
