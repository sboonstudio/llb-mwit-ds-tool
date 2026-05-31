# LearnLab Bridge Core Projects

**Purpose:** กำหนดชุดโครงการแกนหลักของ LearnLab Bridge เพื่อใช้เป็นฐานพัฒนา open source core และต่อยอดเป็นผลิตภัณฑ์/บริการเพิ่มเติมในอนาคต

## 1. แนวคิด Core Projects

LearnLab Bridge ไม่ควรมีโครงการเดียวที่รวมทุกอย่างจนขยายยาก แต่ควรแบ่งเป็น **Core Projects** ที่มีหน้าที่ชัดเจน สามารถพัฒนา แยกทีม ทดสอบ release และขายบริการต่อได้เป็นระบบ

แนวคิดหลัก:

- `Core Projects` คือส่วนแกนที่จำเป็นต่อการทำงานของแพลตฟอร์ม
- `Extension Projects` คือส่วนเสริมที่เพิ่มมูลค่า เช่น AI, analytics ขั้นสูง, content marketplace
- `Service Packages` คือชุดบริการเชิงพาณิชย์ เช่น ติดตั้ง อบรม ดูแลระบบ

## 2. Recommended Core Projects

### 2.1 llbridge-core

**บทบาท:** meta project และ integration layer ของระบบ LearnLab Bridge

ควรเก็บ:

- project configuration กลาง
- shared documentation
- release coordination
- integration tests
- deployment reference
- module compatibility matrix

ไม่ควรเก็บ:

- source code ทุกอย่างแบบรวมถาวร
- customer data
- production secret

สถานะที่แนะนำ:

- เริ่มเป็น folder ใน `learnlab-bridge`
- เมื่อระบบโตขึ้น ค่อยแยก repo เป็น `llbridge-core`

### 2.2 llbridge-web

**บทบาท:** Web portal สำหรับผู้เรียน ครู และผู้ดูแล

ขอบเขต:

- login
- dashboard
- launch lab
- profile
- activity log
- basic LMS navigation
- user-facing UI

ย้ายจากโปรเจกต์เดิม:

```text
LMS-TOOL-DS-t2020101/nextjs-app
-> learnlab-bridge/02-products/llb-main-core/platform/apps/web
```

อนาคต:

- course dashboard
- teacher dashboard
- learner portfolio
- notification
- API integration

### 2.3 llbridge-hub

**บทบาท:** จัดการ JupyterHub integration, lab session, secure launch และ secure logout

ขอบเขต:

- JupyterHub config
- custom authenticator
- launch token validation
- logout synchronization
- DockerSpawner configuration
- workspace isolation

ย้ายจากโปรเจกต์เดิม:

```text
LMS-TOOL-DS-t2020101/jupyterhub
-> learnlab-bridge/02-products/llb-main-core/infrastructure/lab/jupyterhub
```

อนาคต:

- quota
- idle shutdown
- multi-image lab environment
- role-based lab profiles
- GPU/AI lab profile

### 2.4 llbridge-lab

**บทบาท:** สภาพแวดล้อมปฏิบัติการของผู้เรียน เช่น JupyterLab, notebook templates, lab UI settings

ขอบเขต:

- JupyterLab settings
- button/link กลับ LearnLab Bridge
- notebook templates
- datasets
- lab extensions
- starter environments

ย้ายจากโปรเจกต์เดิม:

```text
LMS-TOOL-DS-t2020101/jupyter/singleuser-config
-> learnlab-bridge/02-products/llb-main-core/infrastructure/lab/jupyterlab/singleuser-config

LMS-TOOL-DS-t2020101/jupyter/notebooks
-> learnlab-bridge/02-products/llb-main-core/infrastructure/content/sample-notebooks
```

อนาคต:

- Python lab image
- AI lab image
- Data Science lab image
- Web coding lab image
- custom JupyterLab extensions

### 2.5 llbridge-admin

**บทบาท:** ระบบจัดการหลังบ้าน

ขอบเขต:

- user management
- role management
- course/class management
- system status
- lab session visibility
- admin audit view

สถานะ:

- ยังเป็น future core project
- เริ่มใน `03-modules/llbridge-admin`
- เมื่อ stable ย้ายไป `02-products/llb-main-core/platform/apps/admin`

### 2.6 llbridge-analytics

**บทบาท:** ระบบเก็บและวิเคราะห์กิจกรรมการเรียนรู้

ขอบเขต:

- activity events
- lab launch logs
- lesson progress
- assignment progress
- teacher reports
- export reports

สถานะ:

- เริ่มจาก activity log ใน web
- ขยายเป็น service แยกเมื่อ event model ชัดเจน

### 2.7 llbridge-deploy

**บทบาท:** deployment และ operations reference

ขอบเขต:

- Docker Compose
- production compose
- reverse proxy
- HTTPS
- backup/restore
- monitoring
- Kubernetes ในอนาคต

ย้ายจากโปรเจกต์เดิม:

```text
LMS-TOOL-DS-t2020101/docker-compose.yml
-> learnlab-bridge/02-products/llb-main-core/docker-compose.yml
```

อนาคต:

- `compose.dev.yml`
- `compose.prod.yml`
- Helm chart
- Terraform templates
- monitoring stack

## 3. Proposed Folder Mapping

```text
learnlab-bridge/
  02-products/llb-main-core/platform/
    CORE_PROJECTS.md
    apps/
      web/               # llbridge-web
      admin/             # llbridge-admin
    services/
      auth/
      analytics/         # llbridge-analytics
      lab-orchestrator/
    packages/
      ui/
      shared/
      config/

  02-products/llb-main-core/infrastructure/lab/
    jupyterhub/          # llbridge-hub
    jupyterlab/          # llbridge-lab
    notebook-templates/
    datasets/
    extensions/

  02-products/llb-main-core/infrastructure/
    compose/             # llbridge-deploy
    docker/
    kubernetes/
    monitoring/
    backup/
```

## 4. Core Project Release Plan

### v0.1.0-alpha

เป้าหมาย: ระบบ core ใช้งาน demo ได้

- `llbridge-web`: login, dashboard, launch lab
- `llbridge-hub`: secure launch token, JupyterHub login
- `llbridge-lab`: JupyterLab workspace และ Back to LMS
- `llbridge-deploy`: Docker Compose quickstart

### v0.2.0-beta

เป้าหมาย: ใช้ pilot ในห้องเรียนได้

- `llbridge-web`: learner activity dashboard
- `llbridge-hub`: idle shutdown, better session control
- `llbridge-lab`: starter notebooks and datasets
- `llbridge-admin`: basic user and class management draft
- `llbridge-analytics`: basic event schema

### v1.0.0

เป้าหมาย: stable open source core

- production setup guide
- PostgreSQL support
- role-based access control
- backup/restore
- audit logs
- admin manual
- user manual
- security checklist

## 5. Extension Projects

เมื่อ core projects เสถียรแล้ว ค่อยเปิดโครงการขยายเพิ่ม

### 5.1 llbridge-ai

ฟีเจอร์:

- AI learning assistant
- prompt lab
- notebook feedback
- responsible AI checker
- AI usage transparency

เริ่มที่:

```text
03-modules/llbridge-ai
```

### 5.2 llbridge-content

ฟีเจอร์:

- course packs
- notebook lessons
- assignment templates
- rubrics
- public lesson library

เริ่มที่:

```text
02-products/llb-main-core/infrastructure/content/
03-modules/llbridge-content
```

### 5.3 llbridge-marketplace

ฟีเจอร์:

- module catalog
- course catalog
- lab image catalog
- partner content

เริ่มหลัง v1.0.0

### 5.4 llbridge-mobile

ฟีเจอร์:

- mobile learner dashboard
- progress view
- notifications
- low-bandwidth mode

เริ่มหลัง web flow stable

### 5.5 llbridge-enterprise

ฟีเจอร์:

- SSO/SAML/OIDC integration
- multi-school management
- compliance reports
- enterprise backup
- advanced monitoring

เชื่อมกับ commercial packages

## 6. Migration Plan จาก LMS-TOOL-DS-t2020101

### Step 1: Freeze Legacy Folder

เปลี่ยนสถานะ `LMS-TOOL-DS-t2020101` เป็น legacy prototype

แนะนำชื่อ archive:

```text
legacy-lms-tool-ds-prototype
```

### Step 2: Copy Source Only

ย้ายเฉพาะ source/config ที่ปลอดภัย:

```text
nextjs-app/
jupyterhub/
jupyter/singleuser-config/
jupyter/notebooks/
docker-compose.yml
README.md
LICENSE
CONTRIBUTING.md
CODE_OF_CONDUCT.md
```

ห้ามย้าย:

```text
.env จริง
data/
jupyter/hub-workspaces/users/
database จริง
cookie/session/token
```

### Step 3: Rename Runtime Identity

เปลี่ยนชื่อ runtime:

```env
COMPOSE_PROJECT_NAME=sboon-llb-main-core
DOCKER_NETWORK_NAME=sboon-llb-main-core_default
```

เปลี่ยน service/container prefix:

```text
lms-jupyter-* -> llbridge-lab-*
LMS Tool DS -> LearnLab Bridge
```

### Step 4: Run Compose Through Wrapper

Use the Compose wrapper so env sync happens first and Compose args can be
passed through directly.

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\docker-compose-up.ps1 -d --build
```

Windows Command Prompt:

```cmd
scripts\docker-compose-up.cmd -d --build
```

Linux and macOS:

```bash
sh ./scripts/docker-compose-up.sh -d --build
```

If you need to relocate the clone root, set `LLBRIDGE_PROJECT_ROOT_OVERRIDE`
before calling the wrapper.

### Step 5: Validate

ต้องตรวจ:

- `npm run lint`
- `npm run build`
- `scripts/docker-compose-up.* -d --build`
- `scripts/docker-compose-down.*`
- `docker compose --env-file .env -f docker-compose.yml config`
- login
- launch lab
- Back to LMS
- File -> Logout
- workspace isolation

## 7. Governance for Expansion

ก่อนเริ่ม extension project ใหม่ ต้องมีเอกสาร:

```text
03-modules/<module-name>/README.md
03-modules/<module-name>/requirements.md
03-modules/<module-name>/architecture.md
00-governance/decision-records/ADR-xxxx-<module-name>.md
```

เกณฑ์อนุมัติ:

- มี use case ชัดเจน
- ไม่ซ้ำกับ core project
- มี owner
- มี release target
- มี security/privacy impact assessment
- มีแผนเอกสารและทดสอบ

## 8. Recommended Next Move

ลำดับที่ควรทำต่อ:

1. สร้าง `ADR-0001-core-projects.md`
2. ย้าย prototype เดิมเข้า `02-products/llb-main-core/platform/apps/web`, `02-products/llb-main-core/infrastructure/lab`, `02-products/llb-main-core/infrastructure`
3. เปลี่ยน branding เป็น LearnLab Bridge
4. รัน `scripts/sync-env.ps1` หรือ `scripts/sync-env.sh`
5. สร้าง `llbridge` Docker Compose profile
6. เตรียม `v0.1.0-alpha`
7. เปิด public repo เฉพาะ core ที่ sanitize แล้ว
