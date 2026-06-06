# 🚀 MWIT DS Tool (LearnLab Bridge) - Installation Guide

คู่มือการติดตั้งและเริ่มต้นใช้งานระบบ **MWIT DS Tool** สำหรับบริหารจัดการสภาพแวดล้อมการเรียนรู้ Data Science (JupyterLab) แบบครบวงจร

---

## 📋 ขั้นตอนที่ 1: การเตรียมเครื่องมือ (Prerequisites)

ก่อนเริ่มติดตั้ง โปรดตรวจสอบว่าเครื่องคอมพิวเตอร์ของคุณ (ระบบปฏิบัติการ Windows) มีเครื่องมือดังนี้พร้อมใช้งาน:

1.  **WSL 2 (Windows Subsystem for Linux)**:
    *   ต้องติดตั้งและเปิดใช้งาน (แนะนำ Ubuntu 22.04 LTS หรือสูงกว่า)
2.  **Docker Desktop**:
    *   ดาวน์โหลดและติดตั้งจาก [Docker Official Website](https://www.docker.com/products/docker-desktop/)
    *   **สำคัญ**: เข้าไปที่ Settings > General > ติ๊กถูกที่ "Use the WSL 2 based engine"
    *   เข้าไปที่ Settings > Resources > WSL Integration > เปิดใช้งาน (Enable) สำหรับ Ubuntu ที่คุณใช้งาน
3.  **Docker Engine**:
    *   ตรวจสอบว่า Docker Desktop รันอยู่ (ไอคอนปลาวาฬที่มุมขวาล่างเป็นสีเขียว)
4.  **Git**:
    *   ติดตั้ง Git สำหรับรันคำสั่ง Clone

---

## 📥 ขั้นตอนที่ 2: การเตรียมโครงการ (Project Setup)

1.  เปิด **Terminal** (แนะนำ PowerShell หรือ Windows Terminal)
2.  ใช้คำสั่งคัดลอกโครงการไปยังเครื่องของคุณ:
    ```bash
    git clone https://git.mwit.ac.th/service/mwit-ds-tool.git
    ```
3.  เข้าไปที่โฟลเดอร์โครงการ:
    ```bash
    cd mwit-ds-tool
    ```

---

## 🚀 ขั้นตอนที่ 3: การรันระบบ (Deployment)

1.  รันสคริปต์เพื่อเริ่มต้นระบบ (ระบบจะทำจัดการ Build Image และตั้งค่าฐานข้อมูลให้โดยอัตโนมัติ):
    *   **สำหรับ PowerShell (Windows)**:
        ```powershell
        .\scripts\up.ps1
        ```
        *(หากพบปัญหา Permission ให้รัน: `Set-ExecutionPolicy Bypass -Scope Process; .\scripts\up.ps1`)*
    *   **สำหรับ Bash (Linux/WSL)**:
        ```bash
        ./scripts/up.sh
        ```
2.  รอจนกว่ากระบวนการ Build และ Container จะขึ้นสถานะ `Running` ทั้งหมด

---

## 🔑 ขั้นตอนที่ 4: การเข้าใช้งาน (Access & First Login)

เมื่อระบบรันเสร็จสมบูรณ์ คุณสามารถเข้าใช้งานได้ผ่านเบราว์เซอร์:

1.  **Platform Web (Main UI)**: [http://localhost:3000](http://localhost:3000)
2.  **JupyterHub (Lab Environment)**: [http://localhost:8000](http://localhost:8000)

### **การเข้าใช้ระบบครั้งแรก (First-time Admin Login)**
เพื่อเข้าไปตั้งค่าระบบและจัดการผู้ใช้ ให้ใช้สิทธิ์ผู้ดูแลระบบเริ่มต้น:
*   **Username (Email)**: `admin@sboon.org`
*   **Password**: *ตามที่ระบบสุ่มให้ใน Log หรือใช้รหัสผ่านเริ่มต้น (หากมีการตั้งค่าไว้ใน .env)*

---

## 💡 ข้อมูลเพิ่มเติม
*   **การปิดระบบ**: สามารถรัน `.\scripts\down.ps1` เพื่อหยุดการทำงานของ Containers
*   **การแก้ไขค่าคอนฟิก**: สามารถปรับแต่งตัวแปรต่างๆ ได้ในไฟล์ `.env` (คัดลอกมาจาก `.env.example`)

---
*เวอร์ชันระบบ: {{VERSION}} | อัปเดตล่าสุด: 2026-06-06*
