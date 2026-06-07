# Project Status: LearnLab Bridge (v0.4.6-alpha)
*Date: 2026-06-07*

## 1. Executive Summary
โครงการ LearnLab Bridge ก้าวเข้าสู่ระยะการนำข้อมูลมาวิเคราะห์เพื่อการเรียนรู้ (Learning Intelligence) โดยมีการเพิ่มระบบ Dashboard สำหรับ Admin เพื่อติดตามกิจกรรมของผู้ใช้งาน และระบบ Sync ข้อมูลจาก JupyterHub logs เข้าสู่ฐานข้อมูล PostgreSQL/Prisma เพื่อการประมวลผลเชิงลึก

## 2. Technical Infrastructure
- **Branching Model**: GitLab Flow
    - `main`: เสถียรที่สุด (Private)
    - `develop`: พัฒนาฟีเจอร์ใหม่
    - `public/export-mwit-ds`: สำหรับ Release สู่สาธารณะ (ผ่าน Git Worktree)
- **Multi-Remote Sync**:
    - `origin`: `sboon/learnlab-bridge` (Full History + Internal Tags)
    - `public`: `mwit-ds-tool` (Clean Release Only)
- **Worktree Architecture**:
    - `/learnlab-bridge`: พื้นที่หลัก (Branch: `main`)
    - `/learnlab-bridge-export`: พื้นที่ส่งออก (Branch: `public/export-mwit-ds`)

## 3. Key Achievements (v0.4.6 Milestones)
- **Learning Intelligence Dashboard**: ระบบแสดงผลภาพรวมกิจกรรมผู้ใช้งาน (Insights) สำหรับผู้ดูแลระบบ พร้อมปุ่ม **Sync Now** เพื่อประมวลผลข้อมูลล่าสุด
- **Log Aggregation & Sync Fix**: ปรับปรุงสคริปต์ Sync ให้เสถียรขึ้นด้วยระบบ Upsert และเพิ่ม Unique Constraint ในฐานข้อมูลเพื่อป้องกันข้อมูลซ้ำซ้อน
- **Database Schema Evolution**: เพิ่มตารางสำหรับรองรับการเก็บข้อมูลพฤติกรรมการใช้งานแบบรายบุคคล และทำ Migration สำหรับ Aggregation Tables
- **Tag Organization**: รักษามาตรฐานกลยุทธ์ "Separate & Clean" อย่างต่อเนื่อง

## 4. Operational Guardrails (For Agents)
- **Encoding Rule**: ทุกไฟล์ JSON/TS/VERSION ต้องบันทึกเป็น **UTF-8 without BOM** เสมอ
- **Tagging Rule**: ห้าม Push `-alpha` tags ลง `public` remote
- **Sync Rule**: การแก้ไขใน `main` ต้องซิงค์ไป `public/export-mwit-ds` ผ่านสคริปต์ที่กำหนดเสมอเพื่อความปลอดภัย (Scrubbing Secrets)

## 5. Roadmap & Next Steps
- ตรวจสอบ Resource Usage per User
- พัฒนาระบบ Snapshot Lab State ก่อน Shutdown
- เตรียมความพร้อมสำหรับ OAuth Integration
- ปรับปรุง UI/UX ของ Dashboard ให้รองรับการกรองข้อมูลตามช่วงเวลา

---
*Status recorded for agent continuity.*
