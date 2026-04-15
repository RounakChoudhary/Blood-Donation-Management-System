<div align="center">

# 🩸 Blood Donation Management System

**A full-stack blood donation coordination platform — connecting donors, hospitals, and blood banks through a unified digital system**

Digitizes emergency blood request handling, geospatial donor matching, donation eligibility tracking, camp discovery, email notifications, and administrative oversight — eliminating fragmented manual coordination during critical situations.

[![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-PostGIS_3-blue?logo=postgresql)](https://www.postgresql.org/)
[![Frontend](https://img.shields.io/badge/Frontend-HTML_CSS_JS-yellow?logo=html5)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![Auth](https://img.shields.io/badge/Auth-JWT_HS256-orange)](https://jwt.io/)
[![Notifications](https://img.shields.io/badge/Notifications-Resend_API-red)](https://resend.com/)
[![Deployment](https://img.shields.io/badge/Deployment-Vercel%20%2B%20Railway-success)]()

</div>

---

## 🔍 Overview

Blood donation coordination is often slowed down by fragmented hospital records, manual calling chains, informal messaging groups, and the lack of a location-aware system for finding compatible donors quickly. In emergency situations, that discovery delay directly affects whether blood can be arranged within the critical treatment window.

**BDMS** is designed as a centralized blood donation management platform that helps hospitals, donors, blood banks, and administrators work through one system. It combines geospatial donor matching, ABO/Rh compatibility checks, donation cooldown enforcement, OTP-based account activation, emergency request workflows, and email-driven response links so that urgent requests can move from creation to donor outreach in seconds instead of hours.

Beyond emergency matching, the platform also supports donor profile management, blood camp discovery, hospital and blood bank onboarding, administrative review flows, and deployment on a modern cloud stack using Vercel, Railway, and Neon PostgreSQL with PostGIS.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js + Express.js (MVC structure) |
| **Database** | PostgreSQL 16 + PostGIS 3 (geospatial queries) |
| **Frontend** | HTML / CSS / JavaScript (React dashboards — in progress) |
| **Authentication** | JWT HS256 (24-hour expiry) + bcrypt password hashing |
| **Authorization** | `middleware/requireRole.js` — RBAC enforced on all endpoints |
| **Email / OTP** | Resend Email API |
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
│             (React frontend for donor, hospital, admin)           │
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
          │            Resend Email API                │
          │  OTPs · Emergency alerts · Deep-links     │
          └─────────────────────────────────────────┘
```

---

## 👥 User Roles & Access Control

RBAC is enforced at the middleware layer via `requireRole.js` for user/admin routes, while verified hospital access is enforced through `hospitalAuth.middleware.js`.

| Role | Description | Key Capabilities |
|------|-------------|-----------------|
| `user` | Registered platform user | Register, verify OTP, create donor profile, manage donor availability |
| `admin` | System administrator | Verify hospitals, review camps, access admin routes, manage users |
| `hospital` | Verified hospital actor via hospital JWT | Create blood requests, rematch donors, view own requests |
| `blood_bank` | Registered blood bank entity | Registration is implemented; full authenticated blood bank module is still in progress |

---

## ✨ Features by Module

### 🔐 Auth & User Management
- **Donor registration** with OTP-based email verification (6-digit code, 10-minute TTL via Resend)
- Donor accounts remain inactive until OTP verification succeeds
- **Hospital registration** with admin verification and separate hospital auth setup/login
- **Blood bank registration** with pending onboarding status
- JWT login with **24-hour expiry**
- `requireRole.js` middleware enforces role separation across all endpoints
- All passwords hashed with bcrypt (minimum cost factor 12)
- All database queries use parameterised statements — SQL injection prevented by design

### 🚨 Emergency Blood Request Management
- **Verified hospitals only** may create emergency requests — enforced via hospital auth middleware
- Blood request lifecycle persisted with `open | matched | fulfilled | cancelled`
- **Geospatial donor matching** via PostGIS `ST_DWithin` with ABO/Rh compatibility from `utils/bloodCompat.js`, cooldown filtering, availability filtering, and `ST_Distance` sorting
- Radius expansion service logic exists for `3 km -> 6 km -> 9 km`, but scheduler wiring is still pending
- Blood bank emergency notification flow is still pending

### 📧 Email Notification Service
- Resend-powered email delivery for OTPs, emergency donor alerts, camp status emails, and hospital acceptance notifications
- Emergency donor alert emails include **single-use signed deep-links** for accept/decline
- Deep-link tokens are stored as **hashes only** and expire after **2 hours**
- Retry logic is implemented with exponential backoff: **5s -> 25s -> 125s**
- Delivery state is tracked in both `notifications` and `email_log` with `pending | sent | failed`
- Runtime notification pipeline is **email-only**; no WhatsApp fallback exists in application code

### 💉 Donor Response Flow
- Donor receives email with tokenised deep-link; clicks to accept or decline without logging in
- Token authenticated server-side (2-hour TTL, single-use, hash stored only)
- Response recorded against the matched request
- Donor availability is set to `unavailable` on acceptance
- Hospital notified of donor acceptance via email immediately

### 👤 Donor Profile Management
- Donor volunteer onboarding validates age, BMI, blood group, and last donation date
- Cooldown eligibility is computed from `last_donation_date` and `deferred_until`
- Donor profile retrieval and availability updates are implemented
- Full donor profile edit workflow and donation history module are still pending

### 🏕 Blood Donation Camp Management *(Passive Discovery Model)*
- Organiser submits camp proposal (name, date, time, venue, geolocation, capacity, organiser contact)
- Admin reviews and approves/rejects; organiser notified via email
- Approved camps listed for donor discovery by proximity and date range
- System does **not** process on-site registrations or record donations — passive information model only

### 📍 Location Services
- Find eligible donors by blood group, proximity, cooldown status, and availability
- GIST spatial indexes are used on user, hospital, blood bank, request, and camp locations
- Dedicated nearby blood bank API is not implemented yet

### 📊 Report Generation
- Reporting modules are pending implementation

### 🛡 Admin Console
- Admin routes exist for users, hospitals, blood banks, and blood requests
- Hospital verification and blood bank verification endpoints exist
- Broader system configuration and reporting screens are still pending

---

## 🗄 Database Schema

Managed via incremental SQL migration files under `database/`. Existing migration files are **never modified** — all schema changes are new additions only.

```
Core Tables
  Users          — base auth, role, activation flags, soft-delete flag
  Donors         — profile, blood group, cooldown, availability
  Hospitals      — registration, verification, optional hospital login, soft-delete flag
  BloodBanks     — registration, verification, optional auth fields, soft-delete flag

Emergency & Matching
  EmergencyRequests  — blood group, units, hospital, location, radius, status, soft-delete flag
  BloodRequestMatches — matched donor records and donor response status
  ResponseTokens     — hashed single-use donor response tokens (2-hour TTL)

Auth & Notifications
  OtpTokens     — hashed OTP verification records with expiry and consumption tracking
  Notifications — email notification lifecycle records
  EmailLog      — delivery events, attempts, last attempt time, final status

Camp
  BloodCamps    — proposals, approval status, location, organiser details

Spatial Indexes
  GIST index on Users.location
  GIST index on Hospitals.location
  GIST index on BloodBanks.location
  GIST index on BloodRequests.location
  GIST index on BloodCamps.location

Blood Compatibility
  utils/bloodCompat.js — ABO/Rh compatibility matrix hardcoded
```

---

## 📡 API Reference

Routes are mounted directly from `index.js`. Protected routes require `Authorization: Bearer <token>`.

### Auth — Donors
| Method | Route | Access | FR |
|--------|-------|--------|-----|
| `POST` | `/auth/register` | Public | FR 4.1.1 |
| `POST` | `/auth/login` | Public | FR 4.1.4 |
| `POST` | `/auth/verify-otp` | Public | FR 4.1.1 |

### Auth — Hospitals
| Method | Route | Access | FR |
|--------|-------|--------|-----|
| `POST` | `/blood-banks/register` | Public | FR 4.1.2 |
| `POST` | `/hospitals/register` | Public | FR 4.1.3 |
| `POST` | `/hospitals/login` | Public | FR 4.1.4 |
| `GET` | `/hospitals/pending` | `admin` | FR 4.9.2 |
| `POST` | `/hospitals/:id/verify` | `admin` | FR 4.9.2 |
| `POST` | `/hospitals/:id/setup-auth` | `admin` | FR 4.1.3 |

### Donors
| Method | Route | Access | FR |
|--------|-------|--------|-----|
| `POST` | `/donors/become-volunteer` | Authenticated | FR 4.4.1 |
| `GET` | `/donors/me` | Authenticated | FR 4.4.1 |
| `PATCH` | `/donors/availability` | Authenticated | FR 4.4.2 |
| `GET` | `/donor-requests` | Authenticated | FR 4.2.4 |
| `POST` | `/donor-requests/:matchId/accept` | Authenticated | FR 4.2.4 |
| `POST` | `/donor-requests/:matchId/reject` | Authenticated | FR 4.2.4 |
| `GET` | `/donor-requests/respond/accept?token=...` | Public | FR 4.2.4 |
| `GET` | `/donor-requests/respond/decline?token=...` | Public | FR 4.2.4 |

### Emergency Blood Requests
| Method | Route | Access | FR |
|--------|-------|--------|-----|
| `POST` | `/blood-requests` | Verified hospital | FR 4.2.1 |
| `GET` | `/blood-requests/mine` | Verified hospital | FR 4.5.2 |
| `GET` | `/blood-requests/:id` | Verified hospital | FR 4.5.2 |
| `POST` | `/blood-requests/:id/match` | Verified hospital | FR 4.2.2 |

### Camps
| Method | Route | Access | FR |
|--------|-------|--------|-----|
| `POST` | `/camps` | Public | FR 4.3.1 |
| `POST` | `/camps/:id/review` | `admin` | FR 4.3.2 |
| `GET` | `/camps/nearby` | Public | FR 4.3.3 |

### Admin
| Method | Route | Access | FR |
|--------|-------|--------|-----|
| `GET` | `/admin/users` | `admin` | FR 4.9.3 |
| `PATCH` | `/admin/users/:id/role` | `admin` | FR 4.9.3 |
| `DELETE` | `/admin/users/:id` | `admin` | FR 4.9.3 |
| `GET` | `/admin/hospitals` | `admin` | FR 4.9.2 |
| `PATCH` | `/admin/hospitals/:id/approve` | `admin` | FR 4.9.2 |
| `PATCH` | `/admin/hospitals/:id/reject` | `admin` | FR 4.9.2 |
| `DELETE` | `/admin/hospitals/:id` | `admin` | FR 4.9.2 |
| `GET` | `/admin/blood-banks` | `admin` | FR 4.9.2 |
| `PATCH` | `/admin/blood-banks/:id/verify` | `admin` | FR 4.9.2 |
| `DELETE` | `/admin/blood-banks/:id` | `admin` | FR 4.9.2 |
| `GET` | `/admin/blood-requests` | `admin` | FR 4.9.x |
| `DELETE` | `/admin/blood-requests/:id` | `admin` | FR 4.9.x |
| `GET` | `/admin/stats` | `admin` | FR 4.9.x |

---

## 🚀 Deployment

The project is structured for a split deployment:

- **Frontend:** Vercel
- **Backend:** Railway
- **Database:** Neon PostgreSQL with PostGIS
- **Email:** Resend Email API

### Railway environment variables

- `DATABASE_URL`
- `PORT`
- `JWT_SECRET`
- `FRONTEND_URL`
- `APP_BASE_URL`
- `ENABLE_BACKGROUND_JOBS`
- `ALLOW_VERCEL_PREVIEW_ORIGINS`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `RESPONSE_TOKEN_SECRET` (recommended)

### Vercel environment variables

- `VITE_API_BASE_URL`

### Deployment notes

- Set `FRONTEND_URL` to the primary Vercel production domain used by the app.
- Set `APP_BASE_URL` to the frontend URL that should appear in password reset and email links.
- Enable `ALLOW_VERCEL_PREVIEW_ORIGINS=true` on Railway if Vercel preview deployments should be able to call the backend.
- Keep `ENABLE_BACKGROUND_JOBS=false` unless you explicitly want scheduled jobs running in that Railway service.

## ⚙️ Getting Started

```bash
# Clone the repository
git clone https://github.com/RounakChoudhary/Blood-Donation-Management-System.git
cd Blood-Donation-Management-System

# Install dependencies
npm install

# Configure environment variables
# Create .env manually and set:
# DATABASE_URL
# PORT
# JWT_SECRET
# FRONTEND_URL
# APP_BASE_URL
# ENABLE_BACKGROUND_JOBS
# ALLOW_VERCEL_PREVIEW_ORIGINS
# RESEND_API_KEY
# EMAIL_FROM
# VITE_API_BASE_URL (frontend)
# RESPONSE_TOKEN_SECRET (recommended)
# OTP_TTL_MINUTES (optional)

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
WhatsApp integration via Twilio was originally planned but removed in SRS v2.2. Resend email delivery is the active runtime notification channel used by the backend. Because migrations are append-only, historical legacy migration files may still document older notification approaches, but application code no longer uses them.

### Passive Camp Discovery Model
The system does not process on-site attendee registrations or record donations from camps. It acts purely as an information intermediary — publishing approved camp listings for donor discovery. This avoids out-of-scope complexity (on-site ops, physical donation recording) and keeps the system boundary clean.

### Incremental SQL Migrations
All schema changes are applied as new numbered SQL migration files under `database/`. Existing migration files are **never modified**. This guarantees version consistency and safe, reversible updates across all deployment environments.

### Geospatial Matching via PostGIS
Donor search uses `ST_DWithin` for radius filtering combined with ABO/Rh compatibility (`utils/bloodCompat.js`), 90-day cooldown check, and `ST_Distance` for distance-sorted ranking. GIST spatial indexes are placed on all location columns to meet the 3-second performance requirement for up to 10,000 donors.

### Tokenised Deep-Links for Donor Response
Rather than requiring donors to log in to respond to emergency alerts, each email contains a tokenised URL (2-hour TTL). The raw token is signed and only its hash is stored in the database. The server validates the link, records the response, marks the token single-use, and updates donor availability on acceptance.

---

## 📋 Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| **Performance** | Emergency donor match + email dispatch within **10 seconds** of request creation |
| **Performance** | `ST_DWithin` geospatial query within **3 seconds** for up to 10,000 donors |
| **Performance** | User authentication and dashboard load within **2 seconds** |
| **Performance** | API 95th-percentile response under **300 ms** at 50 concurrent users |
| **Performance** | Email API dispatch handshake within **2 seconds** |
| **Security** | HTTPS (TLS 1.2 minimum) for all client-server communication |
| **Security** | bcrypt password hashing with minimum cost factor 12 |
| **Security** | JWT HS256 tokens stored in env variables; 24-hour expiry |
| **Security** | Email API credentials exclusively in `.env` — never in source code or logs |
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
