# บันทึกแนวทางการแก้ไขระบบ Sign-out (LLBridge + JupyterHub)

## ปัญหาที่พบ (Root Cause)
จากการตรวจสอบพบว่ากระบวนการออกจากระบบ (Sign-out) ทำงานไม่สมบูรณ์ในหลายกรณี:
1.  **Session Mismatch**: การกด Sign out ในหน้าเว็บหลัก บางครั้งไม่ได้ไปล้าง Session ใน JupyterHub ทำให้ถ้าผู้ใช้เข้า URL ของ JupyterHub ตรงๆ จะยังเข้าใช้งานได้อยู่
2.  **Broken Redirection**: เมื่อ JupyterHub Session หมดอายุ (Expired) ตัว Authenticator จะ Redirect ไปที่หน้า Login โดยตรง ข้ามขั้นตอนการล้างคุกกี้ของ Next.js ทำให้หน้าเว็บหลักยังมองว่า Login อยู่
3.  **Zombie Containers**: ในบางสถานการณ์ Lab Container ไม่ถูก Shutdown เมื่อผู้ใช้กด Sign out จากหน้าเว็บหลัก

## แนวทางการแก้ไข (Implementation Details)

### 1. ปรับปรุงฝั่ง Web Application (Next.js)
-   **File**: `src/actions/auth.ts`
-   **Action**: เปลี่ยนจาก `redirect()` ไปที่ API ตรงๆ เป็นการเรียกใช้ `signOut({ redirectTo: "/api/jupyter/logout" })` ของ NextAuth
-   **Result**: มั่นใจได้ว่าคุกกี้ของฝั่งเว็บ (Session Token) ถูกล้างออก **ทันที** ก่อนที่จะส่งผู้ใช้ไปยัง JupyterHub

### 2. ปรับปรุงฝั่ง JupyterHub Authenticator (Python)
-   **File**: `infrastructure/lab/jupyterhub/llbridge_authenticator.py`
-   **Class**: `LLBridgeLogoutHandler`
-   **Change**: 
    -   ปรับปรุงลำดับการทำงานให้เรียก `default_handle_logout()` เพื่อล้าง Session ภายในให้สะอาด
    -   เพิ่ม Logic ให้ตรวจสอบว่าหากสร้าง `logout_redirect_url` แบบมี Token ไม่ได้ (เช่น กรณี Session หลุดไปแล้ว) ให้ใช้ `logout_fallback_redirect_url` แทนเสมอ
-   **Result**: ไม่ว่าสถานะ Session ใน JupyterHub จะเป็นอย่างไร ระบบจะ Redirect ผู้ใช้กลับมาที่ API ของเว็บเพื่อจบกระบวนการเสมอ

### 3. ปรับปรุงการกำหนดค่าระบบ (Configuration)
-   **File**: `infrastructure/lab/jupyterhub/jupyterhub_config.py`
-   **Config**: `c.LLBridgeAuthenticator.logout_fallback_redirect_url`
-   **Change**: เปลี่ยนจาก `/login` เป็น `/api/jupyter/logout/complete`
-   **Result**: เป็นการบังคับให้ "ทุกเส้นทาง" ของการ Logout จาก JupyterHub ต้องผ่าน API Verification และการล้าง Session รอบสุดท้ายที่ฝั่งเว็บ

## ลำดับขั้นตอนการทำงานใหม่ (New Flow)
1.  **User** กดปุ่ม "Sign out" ในหน้า Dashboard
2.  **Web Action** ล้างคุกกี้ NextAuth -> Redirect ไป `/api/jupyter/logout`
3.  **Logout API** ค้นหา Base URL ของ JupyterHub -> Redirect ไป `/hub/llbridge-logout`
4.  **JupyterHub** ล้าง Session ตัวเอง -> Shutdown Container (ถ้าตั้งค่าไว้) -> Redirect กลับมาที่ `/api/jupyter/logout/complete?token=...`
5.  **Complete API** ตรวจสอบ Token (ความปลอดภัย) -> สั่ง `signOut` อีกรอบ (เพื่อความชัวร์) -> ส่งผู้ใช้ไปหน้า `/login`

## การตรวจสอบ (Verification)
- [x] กด Sign out แล้วต้องกลับมาหน้า Login
- [x] เมื่อกลับมาหน้า Login แล้ว ต้องไม่สามารถกดเข้าหน้า `/dashboard` ได้ (ต้องถูกเด้งกลับ)
- [x] ตรวจสอบใน Docker Desktop หรือคำสั่ง `docker ps` ว่า Container ของ User นั้นๆ ถูก Remove ออกไป (Shutdown on logout)
- [x] ลองลบคุกกี้ฝั่งเว็บออก แล้วลองกด Logout จากฝั่ง JupyterHub ต้องทำงานได้ถูกต้อง

---
*บันทึกเมื่อ: 31 พฤษภาคม 2569*
