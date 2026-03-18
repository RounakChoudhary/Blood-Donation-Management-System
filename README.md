<div align="center">

# 🩸 Blood Donation Management System

**A full-stack blood donation coordination platform — connecting donors, hospitals, and blood banks through a unified digital system**

Digitizes emergency blood request handling, geospatial donor matching, donation eligibility tracking, camp discovery, email notifications, and administrative oversight — eliminating fragmented manual coordination during critical situations.

[![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-PostGIS_3-blue?logo=postgresql)](https://www.postgresql.org/)
[![Frontend](https://img.shields.io/badge/Frontend-HTML_CSS_JS-yellow?logo=html5)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![Auth](https://img.shields.io/badge/Auth-JWT_HS256-orange)](https://jwt.io/)
[![Notifications](https://img.shields.io/badge/Notifications-Nodemailer_SMTP-red?logo=gmail)](https://nodemailer.com/)
[![Sprint](https://img.shields.io/badge/Sprint_3-Complete-brightgreen)]()
[![Status](https://img.shields.io/badge/Backend-Core_Operational-success)]()

</div>

---

## 🔍 Overview

Manual blood donation coordination between donors, hospitals, and blood banks causes critical delays during emergencies — no unified system, no automated donor matching, no real-time notification, no donation history tracking.

**BDMS** replaces this fragmented process with a centralised platform. A hospital raises an emergency request; the system instantly runs a geospatial ABO/Rh-compatible donor search, dispatches tokenised email alerts, records donor responses, and tracks the full request lifecycle — all automatically.

> See the [Testing Report](https://drive.google.com/file/d/1ykCAF0_ZO68oGofBqHzWPx9dXE8o62l3/view?usp=drive_link) for API validation results.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js + Express.js (MVC structure) |
| **Database** | PostgreSQL 16 + PostGIS 3 (geospatial queries) |
| **Frontend** | HTML / CSS / JavaScript (React dashboards — in progress) |
| **Authentication** | JWT HS256 (24-hour expiry) + bcrypt password hashing |
| **Authorization** | `middleware/requireRole.js` — RBAC enforced on all endpoints |
| **Email / OTP** | Nodemailer via Gmail App Password / SendGrid SMTP |
| **Geospatial** | PostGIS `ST_DWithin` + `ST_Distance` for proximity matching |
| **Schema Management** | Incremental SQL migration files under `database/` (immutable once committed) |
| **Task Tracking** | ClickUp |
| **UML Diagrams** | Draw.io + PlantUML |
| **API Testing** | Postman |
| **Version Control** | Git / GitHub |
| **IDE** | VS Code |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Web Frontend (Browser)                      │
│   Donor Dashboard │ Hospital Dashboard │ Blood Bank │ Admin      │
│          (HTML/CSS/JS — React dashboards in Sprint 4)            │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / JSON
┌──────────────────────────────▼──────────────────────────────────┐
│                  Node.js + Express REST API                       │
│                  (MVC: controllers/ models/ routes/               │
│                   services/ middleware/ utils/ database/)         │
│                                                                   │
│  ┌──────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │  auth.middle │  │  requireRole.js │  │  Global Error       │ │
│  │  ware.js     │  │  (RBAC guard)   │  │  Handler            │ │
│  └──────────────┘  └─────────────────┘  └─────────────────────┘ │
│                                                                   │
│  Auth │ Donor │ Hospital │ BloodBank │ Emergency │ Camp │ Admin  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Parameterised queries
┌────────────────────────────────▼────────────────────────────────┐
│             PostgreSQL 16 + PostGIS 3                             │
│  Users · Donors · Hospitals · BloodBanks · EmergencyRequests     │
│  DonationRecords · BloodCamps · EmailLog                         │
│  GIST spatial indexes on donor + facility location columns        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
          ┌────────────────────┴────────────────────┐
          │        Nodemailer / SMTP Gateway          │
          │  (Gmail App Password / SendGrid)          │
          │  OTPs · Emergency alerts · Deep-links     │
          └─────────────────────────────────────────┘
```

---

## 👥 User Roles & Access Control

RBAC is enforced at the middleware layer via `requireRole.js` on every protected endpoint. No cross-role access is possible by design.

| Role | Description | Key Capabilities |
|------|-------------|-----------------|
| `donor` | Registered blood donor | View eligibility, respond to emergency requests, view donation history |
| `hospital_staff` | Hospital medical/admin personnel | Create & track emergency + regular blood requests |
| `blood_bank_staff` | Blood bank personnel | Manage inventory, donation records, camp operations |
| `camp_organiser` | Camp event organisers | Submit camp proposals, track approval status |
| `admin` | System administrator | Verify hospitals & blood banks, manage users, system configuration, reports |

---

## ✨ Features by Module

### 🔐 Auth & User Management
- **Donor registration** with browser geolocation capture, age validation (18–65), and **email OTP verification** (6-digit code, 10-minute TTL via Nodemailer)
- Account remains inactive until OTP is verified — no system access before confirmation
- **Hospital & Blood Bank registration** with admin verification workflow before activation
- JWT HS256 login with role-based dashboard routing; account locked after 5 failed attempts within 15 minutes
- `requireRole.js` middleware enforces role separation across all endpoints
- All passwords hashed with bcrypt (minimum cost factor 12)
- All database queries use parameterised statements — SQL injection prevented by design

### 🚨 Emergency Blood Request Management
- **Verified hospitals only** may create emergency requests — enforced via hospital auth middleware
- One open request per blood group per hospital enforced at controller level
- Urgency levels: `Critical` | `Urgent` | `Routine`
- **Geospatial donor matching** via PostGIS `ST_DWithin` with ABO/Rh blood-group compatibility filter (`utils/bloodCompat.js`), 90-day donation cooldown check, results sorted by `ST_Distance`
- **Dynamic radius expansion**: default 3 km → 6 km → 9 km, triggered every 5 minutes if no donor response *(Sprint 5)*
- Nearby blood banks notified of urgent requirements *(Sprint 5)*

### 📧 Email Notification Service
- HTML emails dispatched via Nodemailer/SMTP containing hospital name, blood group, urgency, and a **tokenised deep-link** (2-hour expiry) for donor accept/decline
- Retry logic: 3 attempts with exponential back-off (5 s → 25 s → 125 s) on delivery failure
- All delivery events (sent, failed, retried) recorded in `email_log` table via migration
- WhatsApp integration fully removed in v2.2 — email is the sole notification and OTP channel

### 💉 Donor Response Flow
- Donor receives email with tokenised deep-link; clicks to accept or decline without logging in
- Token authenticated server-side (2-hour TTL); response recorded; donor availability set to `Unavailable` on acceptance
- Hospital notified of donor acceptance via email immediately

### 👤 Donor Profile Management
- 90-day donation cooldown enforced at controller level (computed from last confirmed donation date)
- Eligibility status displayed on donor dashboard
- Email address and blood group are **immutable** after OTP verification
- Phone, address, geolocation, and availability status are updatable

### 🏕 Blood Donation Camp Management *(Passive Discovery Model)*
- Organiser submits camp proposal (name, date, time, venue, geolocation, capacity, organiser contact, optional approval document)
- Admin reviews and approves/rejects; organiser notified via email
- Approved camps listed for donor discovery by proximity and date range
- System does **not** process on-site registrations or record donations — passive information model only

### 📍 Location Services
- Find nearby blood banks within a given radius using PostGIS
- Find eligible donors by blood group, proximity, and cooldown status
- GIST spatial indexes on all donor and facility location columns for query performance

### 📊 Report Generation *(Sprint 6)*
- Donation summary report across date range
- Emergency response performance report: average donor response time, total requests fulfilled

### 🛡 Admin Console *(Sprint 5)*
- Verify hospitals and blood banks with licence validation
- Activate, deactivate, or restrict user accounts
- System configuration: matching radius, cooldown period, max donors to notify per request, SMTP sender identity

---

## 🗄 Database Schema

Managed via incremental SQL migration files under `database/`. Existing migration files are **never modified** — all schema changes are new additions only.

```
Core Tables
  Users          — base auth + role for all user types
  Donors         — profile, geolocation (PostGIS geography), blood group, availability
  Hospitals      — registration, location, verification status
  BloodBanks     — registration, location, inventory, verification status

Emergency & Matching
  EmergencyRequests  — blood group, urgency, hospital, status
  DonationRecords    — donor, hospital, date, blood group, units (cooldown source)

Camp & Notifications
  BloodCamps    — proposals, approval status, location, organiser
  EmailLog      — all notification delivery events (sent / failed / retried)

Spatial Indexes
  GIST index on Donors.location
  GIST index on Hospitals.location
  GIST index on BloodBanks.location

Blood Compatibility
  utils/bloodCompat.js — ABO/Rh compatibility matrix hardcoded
```

---

## 📡 API Reference

All routes are prefixed with `/api/v1` (or per MVC route files). Protected routes require `Authorization: Bearer <token>`.

### Auth — Donors
| Method | Route | Access | FR |
|--------|-------|--------|-----|
| `POST` | `/auth/register` | Public | FR 4.1.1 |
| `POST` | `/auth/login` | Public | FR 4.1.4 |
| `POST` | `/auth/verify-otp` | Public | FR 4.1.1 |
| `POST` | `/auth/forgot-password` | Public | FR 4.1.5 |

### Auth — Hospitals
| Method | Route | Access | FR |
|--------|-------|--------|-----|
| `POST` | `/blood-banks/register` | Public | FR 4.1.2 |
| `POST` | `/hospitals/register` | Public | FR 4.1.3 |
| `POST` | `/hospitals/login` | Public | FR 4.1.4 |

### Donors
| Method | Route | Access | FR |
|--------|-------|--------|-----|
| `POST` | `/donors/become-volunteer` | Authenticated | FR 4.4.1 |
| `GET` | `/donors/me` | `donor` | FR 4.4.1 |
| `PATCH` | `/donors/availability` | `donor` | FR 4.4.2 |
| `GET` | `/donor-requests` | `donor` | FR 4.2.4 |
| `POST` | `/donor-requests/:matchId/accept` | `donor` | FR 4.2.4 |
| `POST` | `/donor-requests/:matchId/reject` | `donor` | FR 4.2.4 |

### Emergency Blood Requests
| Method | Route | Access | FR |
|--------|-------|--------|-----|
| `POST` | `/blood-requests` | `hospital_staff` (verified) | FR 4.2.1 |
| `GET` | `/blood-requests/mine` | `hospital_staff` | FR 4.5.2 |
| `POST` | `/blood-requests/:id/match` | `hospital_staff` | FR 4.2.2 |

### Location Services
| Method | Route | Access | FR |
|--------|-------|--------|-----|
| `GET` | `/donors/nearby` | `hospital_staff`, `admin` | FR 4.6.2 |
| `GET` | `/blood-banks/nearby` | All authenticated | FR 4.6.1 |

### Admin
| Method | Route | Access | FR |
|--------|-------|--------|-----|
| `GET` | `/admin/hospitals/pending` | `admin` | FR 4.9.2 |
| `POST` | `/admin/hospitals/:id/verify` | `admin` | FR 4.9.2 |
| `GET` | `/admin/users` | `admin` | FR 4.9.3 |
| `PATCH` | `/admin/users/:id` | `admin` | FR 4.9.3 |

---

## 🚀 Sprint Progress

> **Plan Period:** Feb 7 – Apr 30, 2026 &nbsp;|&nbsp; **Current:** Mar 18, 2026 — Sprint 3 Complete

### ✅ Sprint 1 — Core Backend Foundation
*Feb 7 – Feb 14, 2026*

- [x] Donor registration with email OTP verification (FR 4.1.1)
- [x] Hospital registration with admin verification workflow (FR 4.1.3)
- [x] JWT HS256 login + role-based RBAC middleware (FR 4.1.4)
- [x] PostgreSQL 16 + PostGIS 3 schema with GIST spatial indexes
- [x] Geospatial donor matching engine — `ST_DWithin` + `ST_Distance` + ABO/Rh compatibility (FR 4.2.2)

### ✅ Sprint 2 — Auth Hardening & Requests
*Feb 15 – Feb 26, 2026*

- [x] `requireRole.js` RBAC middleware enforcing role separation across all endpoints
- [x] Emergency request creation model with one-open-request-per-blood-group enforcement (FR 4.2.1)
- [x] Blood compatibility filtering via `utils/bloodCompat.js`
- [x] 90-day donation cooldown data model and controller enforcement (FR 4.4.1)
- [x] Hospital onboarding — register, pending list, verify, auth setup, hospital login (FR 4.1.3 extended)
- [x] Verified-hospital middleware protecting emergency request endpoints (FR 4.5.1)

### ✅ Sprint 3 — Email Service & Donor Flow
*Feb 27 – Mar 14, 2026*

- [x] Nodemailer/SMTP email notification service with HTML donor alert emails (FR 4.7.1)
- [x] Tokenised deep-link generation (2-hour expiry) for donor accept/decline (FR 4.2.3)
- [x] Retry logic — 3 attempts, exponential back-off (5 s → 25 s → 125 s)
- [x] All delivery events recorded in `email_log` table via migration
- [x] Donor accept/decline response flow — token auth, response recorded, hospital notified on acceptance (FR 4.2.4)
- [x] Donor dashboard — eligibility status, donation history, notification actions
- [x] Hospital dashboard — request creation and status tracking
- [x] WhatsApp fully removed; email is sole OTP, notification, and alert channel

### 🔲 Sprint 4 — Frontend Dashboards
*Mar 15 – Mar 31, 2026*

- [ ] Complete donor dashboard (eligibility, history, accept/decline actions)
- [ ] Complete hospital dashboard (request creation, status view, donor responses)
- [ ] Request status view (FR 4.5.2)
- [ ] Donor profile management — update fields, view history (FR 4.4.2, FR 4.4.3)
- [ ] Blood bank registration flow (FR 4.1.2)

### 🔲 Sprint 5 — Camp Management & Admin
*Apr 1 – Apr 15, 2026*

- [ ] Camp proposal submission, admin approval/rejection, organiser notification (FR 4.3.1, FR 4.3.2)
- [ ] Camp discovery by donors — proximity + date range search (FR 4.3.3)
- [ ] Admin console — verify hospitals/blood banks, manage users, system config (FR 4.9.1–4.9.4)
- [ ] Dynamic radius expansion — 3 km → 6 km → 9 km on no-response timeout (FR 4.2.5)
- [ ] Nearby blood bank notification on emergency request (FR 4.2.6)
- [ ] Password reset via email with single-use 30-minute token (FR 4.1.5)

### 🔲 Sprint 6 — Reports & Polish
*Apr 16 – Apr 30, 2026*

- [ ] Donation summary report across date range (FR 4.8.1)
- [ ] Emergency response performance report — avg response time, fulfilment count (FR 4.8.2)
- [ ] Audit logging
- [ ] System-wide testing and bug fixes
- [ ] Mark notification as read (FR 4.7.2)

---

## ⚙️ Getting Started

```bash
# Clone the repository
git clone https://github.com/RounakChoudhary/Blood-Donation-Management-System.git
cd Blood-Donation-Management-System

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Set: DATABASE_URL, JWT_SECRET, SMTP_HOST, SMTP_USER, SMTP_PASS

# Run database migrations (incremental SQL files under database/)
# Apply each migration file in order using your PostgreSQL client

# Enable PostGIS extension
psql -d your_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Start development server
node index.js
```

> See the [Testing Report](https://drive.google.com/file/d/1ykCAF0_ZO68oGofBqHzWPx9dXE8o62l3/view?usp=drive_link) for Postman collection and API validation details.

---

## 🧠 Design Decisions

### WhatsApp → Email (v2.2)
WhatsApp integration via Twilio was originally planned but removed in SRS v2.2. Reasons: Twilio requires a paid subscription with sandbox approval overhead, significant implementation complexity, and third-party platform dependency. Nodemailer/SMTP is free (Gmail App Password or SendGrid free tier), simpler to implement, and delivers directly — with no platform intermediary. WhatsApp has been fully removed from all interfaces, constraints, and the codebase.

### Passive Camp Discovery Model
The system does not process on-site attendee registrations or record donations from camps. It acts purely as an information intermediary — publishing approved camp listings for donor discovery. This avoids out-of-scope complexity (on-site ops, physical donation recording) and keeps the system boundary clean.

### Incremental SQL Migrations
All schema changes are applied as new numbered SQL migration files under `database/`. Existing migration files are **never modified**. This guarantees version consistency and safe, reversible updates across all deployment environments.

### Geospatial Matching via PostGIS
Donor search uses `ST_DWithin` for radius filtering combined with ABO/Rh compatibility (`utils/bloodCompat.js`), 90-day cooldown check, and `ST_Distance` for distance-sorted ranking. GIST spatial indexes are placed on all location columns to meet the 3-second performance requirement for up to 10,000 donors.

### Tokenised Deep-Links for Donor Response
Rather than requiring donors to log in to respond to emergency alerts, each email contains a tokenised URL (2-hour TTL). The server authenticates the token server-side, records the response, and updates request status — minimising friction during time-critical donation decisions.

---

## 📋 Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| **Performance** | Emergency donor match + email dispatch within **10 seconds** of request creation |
| **Performance** | `ST_DWithin` geospatial query within **3 seconds** for up to 10,000 donors |
| **Performance** | User authentication and dashboard load within **2 seconds** |
| **Performance** | API 95th-percentile response under **300 ms** at 50 concurrent users |
| **Performance** | Email SMTP handshake + queue within **2 seconds** |
| **Security** | HTTPS (TLS 1.2 minimum) for all client-server communication |
| **Security** | bcrypt password hashing with minimum cost factor 12 |
| **Security** | JWT HS256 tokens stored in env variables; 24-hour expiry |
| **Security** | SMTP credentials exclusively in `.env` — never in source code or logs |
| **Security** | All database queries use parameterised statements — no SQL injection possible |
| **Safety** | Emergency request creation restricted to verified hospitals only |
| **Business Rule** | One open request per blood group per hospital at a time |
| **Business Rule** | 90-day donation cooldown enforced before a donor can be matched again |
| **Business Rule** | Camps visible to donors only after administrator approval |

---

## 👩‍💻 Team

| Member | Role |
|--------|------|
| Rounak Choudhary | Backend & Database Lead |
| Rahul Bishnoi | Requirements Alpha Manager & Backend |
| Priyam Patel | Work & Team Alpha Manager |
| Teenu Kumari | Customer Alpha Manager |

*Branching strategy: feature branches → PR review → merge to `main`.*  
*MVC directory structure standardised across all team members from Sprint 1.*

---

## 📚 Resources

- [SRS v2.2](https://drive.google.com/file/d/1Kkm7wSxr37vrIVnnJfeyL3WPR3Wh6VRB/view?usp=drive_link)
- [Testing Report](https://drive.google.com/file/d/1ykCAF0_ZO68oGofBqHzWPx9dXE8o62l3/view?usp=drive_link)
- [General Progression Tracker](https://1drv.ms/x/c/d49313ea524b7720/IQDpHMvWDcn5QLp9cm8qjWBWAQHQQcToyccj38a_5N5EAr4?e=KhL41x)

---

<div align="center">

**Software Engineering [CSL 2060]** &nbsp;·&nbsp; Group 10 ·&nbsp; Blood Donation Management System &nbsp;  &nbsp;

</div>
