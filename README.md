# Medi-Care Online Appointment System

> A modern, secure healthcare appointment and clinic management platform connecting **Patients**, **Doctors**, and **Administrators** in one unified ecosystem.

![Build Status](https://img.shields.io/badge/Status-Fully%20Functional-brightgreen?style=flat-square)
![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Tailwind-blue?style=flat-square)
![Backend](https://img.shields.io/badge/Backend-PHP%20%7C%20Custom%20MVC%20%7C%20PDO-purple?style=flat-square)
![Database](https://img.shields.io/badge/Database-MySQL-orange?style=flat-square)
![Authentication](https://img.shields.io/badge/Auth-JWT%20%2B%20RBAC-red?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)

---

## 1. Project Status

The **Medi-Care Online Appointment System** is fully implemented, verified, and operational:

- **Backend**: Built with modern PHP using a clean Layered MVC architecture, custom HTTP routing, JSON REST responses, robust JWT authentication, role guards, and transactional database repositories.
- **Frontend**: Single Page Application (SPA) powered by React 19, TypeScript, Vite, Tailwind CSS, TanStack React Query, and Lucide React icons.
- **Database**: Normalized MySQL relational schema with foreign key integrity, indexing, automated schema migration, and a comprehensive database seeder.

The application is turnkey and ready to run locally for development, evaluation, and demonstration.

---

## 2. Features by Role

### 👤 Patient / User Portal
- **Authentication & Security**: Account registration, secure login with JWT sessions, token expiration handling, and clean logout. Unauthenticated visitors attempting to book a consultation are directed to `/login` and seamlessly returned to the doctor's booking modal after authentication.
- **Doctor Discovery & Booking Only From Doctor Cards**:
  - The appointment booking modal always receives a fixed chosen doctor from a `DoctorCard` or Doctor Details page. The doctor cannot be changed within the modal, and standalone doctor-select dropdowns have been removed.
  - Doctor-less booking entry points have been removed from the patient dashboard and appointments header; subtle "Find a doctor" links direct patients to the physician directory (`/dashboard/doctors`).
  - Read-only doctor summary card at the top (photo/thumbnail, name, specialization, department, consultation fee, rating), interactive 14-day date picker with doctor non-working days disabled, slot grid (available, booked, selected), 255-character reason textarea with live counter, and summary row with fee.
- **Patient Profile (`/dashboard/profile`)**:
  - Dedicated personal profile and security management view on a clean `bg-gray-100` layout.
  - Left summary card with deterministic initials `Avatar` component, name, email, account role, and member-since date.
  - Personal Information card: name (2–80 chars), email (read-only with lock indicator), phone (10–15 digits), gender (`male`, `female`, `other`), and date of birth (age 0–120) with dynamically calculated age.
  - Security card: change password with current password verification (`password_verify`), minimum 8 characters with letter and number, and password strength indicator.
  - Strict privacy: No patient avatar photo uploads, blood group, address, or emergency fields exist. Initials avatars are used consistently for patients everywhere.
- **Patient Visit Reviews & Feedback**:
  - Patients can rate only their own appointments, strictly when status is `COMPLETED`, with one review per appointment.
  - Required 1–5 star rating with interactive hover/keyboard labels ("Poor" to "Excellent"), optional tags multi-select ("Good listener", "On time", "Clear explanation", "Friendly staff", "Long wait", "Rushed visit"), and optional comment (max 500 characters, tags stripped).
  - 7-day edit/delete window enforced on the server (`PUT/DELETE /api/appointments/{id}/feedback`); displays "Edited" tag and locks reviews after 7 days.
  - Doctor's aggregated average rating and total review counts recalculate atomically upon creation, edit, or deletion.
  - When a doctor completes a visit, a notification link (`/dashboard/appointments?tab=history&rate={id}`) switches to the history tab, scrolls to the card, and opens the feedback modal.
  - Patient dashboard features a "Pending visit reviews" alert card (up to 3 completed unrated visits), hidden when empty.
- **Appointment Management & Tabs**: Redesigned appointments view divided into **Upcoming**, **Past Visits**, and **All Records** tabs with live badge indicators:
  - Self-service rescheduling up to 2 times, keeping the doctor fixed.
  - Demo payment and printable receipt modals.
  - Review status: shows "Rate your visit" on completed unrated cards, read-only stars and comment with edit/delete buttons within 7 days, or a "Review locked" note.
- **Clinical History**: Access doctor consultation notes, diagnoses, and medical prescriptions recorded during completed appointments.

### 🩺 Doctor Clinical Portal
- **Registration & Verification Flow**: Self-registration for doctors requiring professional profile details plus **two mandatory verification fields**:
  - **Medical License Number**: Unique, 5–30 characters, alphanumeric with hyphens and slashes only (`/^[A-Za-z0-9\-\/]{5,30}$/`).
  - **Profile Photo**: JPG, PNG, or WebP (max 2 MB), validated server-side with `finfo`.
  - Account is initially registered in `pending` status.
- **Verification Workflow**:
  ```
  Doctor Registers (with License Number + Profile Photo)
        ↓
  Status: 'pending' (Access to clinical portal withheld)
        ↓
  Admin Reviews at /admin/doctor-requests (Verifies photo & license number against official medical council register)
        ├── Admin Approves → Status: 'active' → Doctor can log in and manage clinic
        └── Admin Rejects  → Status: 'rejected' → Application denied with feedback
  ```
- **Clinical Dashboard**: Real-time overview of today's schedule, pending appointments, active patient count, and upcoming consultations.
- **Schedule Management**: Weekly schedule builder to configure working days, shift hours (`start_time` - `end_time`), slot duration (default 30 mins), and toggle daily availability.
- **Appointments Management**: Segmented by **Requests (Pending)**, **Upcoming Visits**, and **Consultation History**:
  - **Approve / Decline Requests**: Approve with one click or decline with an optional rejection reason shared with the patient.
  - **Doctor Reschedule**: Direct slot reschedule preserving confirmed status without reset.
  - **Payment Tracking**: Integrated payment badges (`unpaid`, `paid`, `refunded`) visible across all rows.
  - **Complete & Prescribe**: Electronic medical records modal to record clinical diagnosis, prescription items, and consultation advice.
- **Patient Reviews & Ratings (`/doctor/reviews`)**: Dedicated reviews hub displaying overall rating score, 5-star distribution chart, and paginated patient feedback cards.
- **Doctor Profile Settings**: Update biography, contact phone, consultation fees, department assignment, room/office location, and upload a new profile photo (re-generates 480x480 thumbnail and purges old image files). License number is displayed as read-only.

### 🛡️ Administrator Control Center
- **Protected Administrative Access**: Admin accounts are pre-seeded via configuration and cannot be registered publicly via client endpoints.
- **Admin Doctor Dossier & Modal (`GET /api/admin/doctors/{id}`)**:
  - Unified `DoctorDetailsModal` used across both **Admin > Doctors** and **Admin > Doctor Requests** tabs.
  - Opened via an Eye icon button (blue outline, soft shadow, tooltip "View details") in the Actions column, by clicking the doctor row/name, or via "Review application" button on requests.
  - Wide modal (`max-w-4xl`) with fixed header, internal scrollable body, and sticky action footer.
  - Header strip with soft brand gradient: large doctor portrait (96–112px with initials fallback), name, specialization, department chip, status badge, verified check, and rating.
  - Aggregated performance stat tiles on `bg-gray-50`: total visits, completed, upcoming, cancelled, unique patients, and total revenue.
  - Segmented tabs:
    - **Overview**: Contact channels, professional qualifications, license verification with one-click copy button, registration/approved dates, and full biography.
    - **Weekly Timetable**: 7-day timetable with consultation hours, slot duration, and Available/Off badges.
    - **Activity**: Recent appointments (up to 5) and verified patient reviews (up to 3).
  - Status-aware action footer with `ConfirmModal` confirmations:
    - `pending`: Approve & Activate (green) and Reject (red outline) with license verification reminder.
    - `active`: Deactivate and Delete Doctor.
    - `inactive` / `rejected`: Activate Doctor and Delete Doctor.
  - Multi-query cache invalidation (`admin.doctors`, `admin.doctorRequests`, `admin.stats`, public doctors directory) ensures instant UI updates without manual refresh.
- **Real-Time Analytics & Financial Metrics**: High-level KPIs tracking total active doctors, pending doctor approval requests, registered patients, today's appointments, upcoming bookings, and a dedicated **Revenue & Payment Intelligence** block.
- **Doctor Credentialing & Approval Queue**: Dedicated review inbox to examine doctor registration requests, review qualifications, department, license number, and photo, with single-click Approve (`active`) or Reject (`rejected`) actions.
- **Doctor Directory Management**: Filter and manage doctors across all statuses (`active`, `pending`, `rejected`, `inactive`) with account status toggles.
- **Patient Management**: Central directory of all registered patients, contact details, account status, and appointment visit history counts.
- **Department Administration**: Full CRUD capabilities to create, edit, activate, or deactivate clinical departments and icons.
- **Central Appointment Oversight**: Comprehensive monitoring of all hospital appointments with multi-criteria filtering by doctor, date, and status, with serial numbers, payment badges, and pagination.
- **Feedback & Review Moderation (`/admin/feedback`)**: Full moderation interface to monitor patient reviews, filter by doctor and star rating, inspect comments, and delete abusive/inappropriate reviews with real-time recalculation of doctor rating aggregates.
- **Hospital Reports & Breakdown**: Visual breakdowns of appointments categorized by status, payment metrics, and doctors distributed across departments.

---

## 3. Tech Stack

| Layer | Technologies & Libraries | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, TypeScript (~5.7), Vite 6 | High-performance SPA with strict type safety and fast HMR |
| **Styling & UI** | Tailwind CSS 3.4, PostCSS, Lucide React, clsx, tailwind-merge | Modern clinical UI, responsive layouts, accessible components |
| **Routing & Navigation** | React Router DOM v7 | Nested routing, layout wrappers, and protected role-based guards |
| **State & API Client** | TanStack React Query v5, Axios | Server-state caching, automatic refetching, JWT interceptors |
| **Backend Framework** | PHP 8.1+ / 8.2+ (Custom MVC) | Modular routing, middleware pipeline, service/repository layers |
| **Persistence / ORM** | MySQL 8.x / MariaDB, PHP PDO | Normalized relational schema, prepared statements, transactions |
| **Authentication** | Custom HMAC-SHA256 JWT, Bcrypt | Stateless Bearer token auth, role authorization, secure password hashing |
| **Local Environment** | XAMPP (Apache + MySQL), Composer, Node.js | Cross-platform local server hosting and package dependency management |

---

## 4. Architecture & Design Patterns

### Backend: Layered Clean MVC Architecture
The backend follows a clear separation of concerns to guarantee testability and maintainability:

```mermaid
flowchart LR
    Client([HTTP Request]) --> Router[Core Router]
    Router --> Middleware[Auth & Role Middleware]
    Middleware --> Controller[Module Controller]
    Controller --> Service[Domain Service]
    Repository --> DB[(MySQL Database)]
    Service --> Repository[Repository Layer]
    Repository --> Model[Data / Entity Mapping]
    Model --> Service
    Service --> Controller
    Controller --> Response[JSON Response]
    Response --> Client
```

- **Router (`App\Core\Router`)**: Resolves incoming HTTP method and URI paths, handles CORS pre-flight headers, extracts path parameters (e.g. `{id}`), and executes route-specific middleware chains.
- **Middleware Pipeline (`App\Middleware`)**:
  - `CorsMiddleware`: Manages cross-origin resource sharing, allowable headers, and 204 OPTIONS preflights.
  - `AuthMiddleware`: Validates Bearer JWT tokens, verifies user active status in the database, and attaches the authenticated user context to the request.
  - `RoleMiddleware`: Enforces fine-grained Role-Based Access Control (`patient`, `doctor`, `admin`) and verifies doctor activation status.
- **Controllers (`App\Modules\*` )**: Thin HTTP handlers that extract request bodies, query parameters, invoke appropriate service methods, and output standardized JSON responses (`App\Core\Response`).
- **Services (`App\Modules\*` )**: Encapsulate core business rules (e.g. preventing duplicate appointment times, calculating available 30-minute intervals, validating registration data, and orchestrating status transitions).
- **Repositories (`App\Modules\*` )**: Dedicated data-access objects abstracting SQL queries, utilizing PDO prepared statements to safeguard against SQL injection.
- **Database (`App\Config\Database`)**: Singleton PDO connection manager with automated `.env` environment variable loading and database initialization.

### Frontend: Feature-Based Modular Architecture
The frontend codebase is partitioned into self-contained feature slices:

```
frontend/src/
├── app/               # Application-level bootstrapping
│   ├── providers/     # QueryClientProvider, AuthProvider context
│   └── router/        # AppRouter, ProtectedRoute, RoleRoute definitions
├── components/        # Reusable global design system
│   ├── layout/        # Navbar, Sidebar, AdminLayout, DoctorLayout, DashboardLayout
│   └── ui/            # Button, Input, Modal, Card, Table, Badge, Toast, States
├── features/          # Domain-driven feature modules
│   ├── admin/         # Admin API services, queries, and mutations
│   ├── appointments/  # Booking modals, appointment listings, slot hooks
│   ├── auth/          # Auth context, login/register API calls, token persistence
│   ├── departments/   # Department listings, queries, and types
│   └── doctors/       # Doctor directory hooks, schedule management
├── lib/               # Shared utilities (Axios instance, queryKeys factory, QueryClient)
└── pages/             # Route-level view components (Public, Patient, Doctor, Admin)
```

### Data Freshness & Caching Architecture
- **Single Source of Truth (`['auth', 'me']`)**:
  - The authenticated user identity is driven exclusively by the React Query cache key `['auth', 'me']` (`GET /api/auth/me`).
  - Stale duplicates in separate `useState` or `localStorage` copies are eliminated (only the JWT Bearer token is persisted in client storage).
  - Profile updates (e.g., name, avatar, contact) immediately call `queryClient.setQueryData(queryKeys.auth.me, updatedUser)` using the server response, synchronizing the header, sidebar, and dashboard in real time without requiring page refreshes.
- **Central Query Key Factory (`FE/src/lib/queryKeys.ts`)**:
  - All query keys are managed systematically through a central factory (`queryKeys.auth.me`, `queryKeys.doctors.*`, `queryKeys.appointments.*`, `queryKeys.departments.*`, `queryKeys.admin.*`).
  - Every mutation precisely invalidates affected cache entries upon settlement (e.g. appointment updates invalidate slots and dashboard statistics, department mutations invalidate doctor and department listings).
- **Default Policy & Optimistic Updates**:
  - Default `staleTime` is set to 30 seconds with `refetchOnWindowFocus: true` and single retry (skipping 401, 403, and 404 errors).
  - High-tempo surfaces (appointment queues and administrative operational counters) leverage a 30-second `refetchInterval` for automated polling.
  - Optimistic updates with rollback are applied exclusively to fast toggles (such as activating or deactivating medical staff accounts).
  - Image URLs incorporate a cache-busting version query string (`?v={timestamp}`) to eliminate browser asset staleness.

---

## 5. Authentication & Security

1. **Stateless JWT Authentication**:
   - Access tokens are cryptographically signed using HMAC-SHA256 with the server's `JWT_SECRET`.
   - Token payload encapsulates `sub` (User ID), `email`, and `role`.
   - Configurable expiration (default 24 hours / 86400 seconds via `JWT_EXPIRY`).
2. **Password Protection**:
   - Secure one-way password hashing using `PASSWORD_BCRYPT` with dynamic salt generation.
   - Verified via native `password_verify` on authentication.
3. **Role-Based Access Control (RBAC)**:
   - Routes and resources strictly segregated into `patient`, `doctor`, and `admin` scopes.
   - Frontend route guards (`ProtectedRoute`, `RoleRoute`) prevent unauthorized client-side views.
   - Backend controller middleware guarantees zero unauthorized data leaks at the API layer.
4. **Doctor Credentialing & Approval Gate**:
   ```
   Doctor Registers (License + Photo) -> Status: 'pending' -> Admin checks license number & photo -> Approve/Reject
         ├── Admin Approves -> Status: 'active'   -> Doctor logs in & manages clinic
         └── Admin Rejects  -> Status: 'rejected' -> Login blocked with status notification
   ```
5. **Admin Safeguards**:
   - Administrative registration is completely disabled over the public registration endpoint.
   - Admin credentials are provisioned securely through environment variables and seed scripts.

---

## 6. Project Structure

```
Medi-Care Online Appointment System/
├── backend/
│   ├── config/                     # Configuration definitions
│   ├── migrations/
│   │   ├── schema.sql              # Relational database schema
│   │   └── seed.php                # Database migration runner & data seeder
│   ├── public/
│   │   └── index.php               # Single entry point / API dispatcher
│   ├── src/
│   │   ├── Config/
│   │   │   └── Database.php        # PDO connection & .env parser
│   │   ├── Core/
│   │   │   ├── Jwt.php             # JWT encode/decode implementation
│   │   │   ├── Request.php         # HTTP Request abstraction
│   │   │   ├── Response.php        # Standardized JSON response emitter
│   │   │   └── Router.php          # RESTful route matcher & dispatcher
│   │   ├── Middleware/
│   │   │   ├── AuthMiddleware.php  # Token validation & user session loader
│   │   │   ├── CorsMiddleware.php  # CORS header configuration
│   │   │   └── RoleMiddleware.php  # Role-based authorization guard
│   │   ├── Modules/
│   │   │   ├── Admin/              # Admin stats, doctor approvals, reports
│   │   │   ├── Appointment/        # Booking, cancellation, status, consultation
│   │   │   ├── Auth/               # Login, registration, profile retrieval
│   │   │   ├── Department/         # Department management
│   │   │   └── Doctor/             # Doctor profiles, schedules, search
│   │   └── Routes/
│   │       ├── api.php             # API route definitions
│   │       └── ApiRoutes.php       # Static route registry
│   ├── vendor/
│   │   └── autoload.php            # PSR-4 Autoloader
│   ├── .env.example                # Backend configuration template
│   └── .gitignore
│
├── frontend/
│   ├── public/                     # Static assets & favicon
│   ├── src/
│   │   ├── app/                    # Routing, AuthProvider, React Query
│   │   ├── components/             # Reusable UI & Layout components
│   │   ├── features/               # Feature-based business logic & hooks
│   │   ├── lib/                    # Axios client & helper utilities
│   │   ├── pages/                  # Page views (Patient, Doctor, Admin, Auth)
│   │   ├── styles/                 # Tailwind CSS styles
│   │   ├── main.tsx                # Application mounting entry point
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package.json                # Frontend dependencies and scripts
│   ├── postcss.config.js
│   ├── tailwind.config.js          # Tailwind CSS theme configuration
│   ├── tsconfig.json               # TypeScript configuration
│   └── vite.config.ts              # Vite server & API proxy config
│
└── README.md
```

---

## 7. Prerequisites

Before running the application, make sure the following software is installed on your workstation:

- **XAMPP** (or standalone Apache & MySQL / MariaDB)
- **PHP**: Version `8.1` or higher (PHP 8.2 recommended, with `pdo_mysql`, `mbstring`, `json`, and `openssl` extensions enabled)
- **Composer**: Dependency manager for PHP (or use the built-in PSR-4 autoloader)
- **Node.js**: Version `18.x` or `20.x` LTS
- **npm**: Version `9.x` or higher

---

## 8. Installation & Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/shaamyll/Medicare-online-appointment-system.git
cd "Medicare-online-appointment-system"
```

---

### Step 2: Configure and Run the Backend (BE/)

1. **Navigate to the backend directory (`BE/`)**:
   ```bash
   cd backend
   ```

2. **Set up Environment Variables**:
   Copy the example environment file to `BE/.env`:
   ```bash
   # On Windows (PowerShell)
   Copy-Item .env.example .env

   # On Linux/macOS
   cp .env.example .env
   ```

3. **Configure Database & Secrets**:
   Open `BE/.env` and update your MySQL connection details and a secure JWT key (see [Environment Variables](#9-environment-variables)).

4. **Start MySQL in XAMPP**:
   Open the **XAMPP Control Panel** and start the **MySQL** module (default port `3306`).

5. **Run Migrations & Database Seeder**:
   Execute the migration script in `BE/` to automatically create the database `medicare_appointment_db`, generate the SQL schema tables, and insert initial seed data (departments, doctors, patients, and the admin account):
   ```bash
   php migrations/seed.php
   ```
   *Expected output:*
   ```text
   Running migrations...
   Schema migrated successfully.
   Seeded Admin: admin@medicare.com / ********
   Seeded Approved Doctor: dr.sarah@medicare.com / ********
   Seeded Inactive Doctor: dr.emily@medicare.com
   Seeded Pending Doctor Request: dr.michael@medicare.com
   Seeded Demo Patient: patient@medicare.com / ******** (with phone, gender, date of birth)
   Database seeding finished successfully!
   ```

6. **Start the Backend Server**:
   You can serve the backend via PHP's built-in development server pointing to `BE/public/`:
   ```bash
   php -S localhost:8000 -t public
   ```
   Alternatively, place the project inside your XAMPP `htdocs` directory and serve via Apache.

---

### Step 3: Configure and Run the Frontend (FE/)

1. **Navigate to the frontend directory (`FE/`)**:
   ```bash
   cd ../frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure API Base URL (Optional)**:
   By default, Vite is configured with a proxy in `FE/vite.config.ts` redirecting all `/api` requests to `http://localhost:8000`. If you wish to specify an explicit endpoint, create an environment file in `FE/.env`:
   ```bash
   VITE_API_URL=http://localhost:8000/api
   ```

4. **Start the Frontend Development Server**:
   ```bash
   npm run dev
   ```

5. **Access the Web Application**:
   Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 9. Environment Variables

The backend uses a configuration file in `BE/.env` loaded automatically by `App\Config\Database::loadEnv()`.

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DB_HOST` | Host address of the MySQL database server | `127.0.0.1` |
| `DB_PORT` | Port number for the MySQL database connection | `3306` |
| `DB_NAME` | Name of the application database | `medicare_appointment_db` |
| `DB_USER` | MySQL database username | `root` |
| `DB_PASS` | MySQL database password (placeholder) | `<your-db-password>` |
| `JWT_SECRET` | Secret key used to sign and verify HMAC-SHA256 JWTs | `<your-jwt-secret>` |
| `JWT_EXPIRY` | Token time-to-live in seconds (e.g. 86400 = 24 hours) | `86400` |
| `ADMIN_NAME` | Initial administrator full name used by the seeder | `Hospital Administrator` |
| `ADMIN_EMAIL` | Initial administrator login email used by the seeder | `admin@medicare.com` |
| `ADMIN_PASSWORD`| Initial administrator password used by the seeder | `<your-admin-seed-password>` |

> [!NOTE]
> Never commit active secrets or database passwords to version control. Keep `BE/.env` and `FE/.env` included in your `.gitignore`.

---

## 10. Default Admin & Demo Access

For security, the administrator role cannot be registered through public forms. It is initialized strictly through `BE/migrations/seed.php` using the values configured in `BE/.env`.

### 🔐 Administrative Access
- **Standard Login Screen**: The hospital administrator signs in through the standard user login screen (`/login`) using the seeded credentials. The login interface contains no text, link, hint, or visual indicator suggesting administrative access.
- **Dashboard Redirect**: Upon successful authentication, administrators are automatically redirected by the system to `/admin/dashboard`.
- **Credentials**: Configured via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `BE/.env` file.
- **Modifying Admin Credentials**: You can modify `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `BE/.env` prior to executing `php migrations/seed.php`. To change credentials later, update the `users` table record or change the password hash in the database.

### 🧪 Pre-Seeded Demo Accounts for Testing
The seeder creates working demo accounts for each role so you can test all workflows immediately:

| Role | Email | Password (from seeder) | Sign-In Portal & Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@medicare.com` | *From `BE/.env`* | Signs in via `/login` &rarr; redirected to `/admin/dashboard` |
| **Admin (Secondary)**| `admin123@medicare.com` | `123456` | Signs in via `/login` &rarr; redirected to `/admin/dashboard` |
| **Approved Doctor** | `dr.sarah@medicare.com` | `Doctor123!` | Signs in via `/doctor/login` &rarr; access clinical schedules & appointments |
| **Pending Doctor** | `dr.michael@medicare.com` | `Doctor123!` | Signs in via `/doctor/login` &rarr; test pending approval verification block |
| **Patient** | `patient@medicare.com` | `Patient123!` | Signs in via `/login` &rarr; browse doctors, book slots, cancel visits |

---

## 11. User Flows & Application Routes

### Client-Side Routes (Frontend - FE/)

The application features exactly **two public authentication screens** (Patient/User portal and Doctor portal) with role-guarded redirection:

| Path | Access Level | Layout / Component | Description |
| :--- | :--- | :--- | :--- |
| `/` | Public | `LandingPage` | Home hero, clinical specialties, department overview, call-to-actions |
| `/login` | Public | `LoginPage` | User login & patient registration toggle (also used by seeded admin) |
| `/doctor/login` | Public | `DoctorLoginPage` | Doctor clinical login & medical specialist application toggle |
| `/dashboard` | Patient | `DashboardLayout` | Patient overview, upcoming appointments, quick doctor search |
| `/dashboard/appointments` | Patient | `PatientAppointmentsPage` | View appointment status, book new slot, cancel visits, read notes |
| `/dashboard/doctors` | Patient | `DoctorsBrowsePage` | Directory of approved doctors with search & department filters |
| `/dashboard/notifications` | Patient | `DashboardLayout` | Real-time alerts, booking confirmations, prescriptions, pagination |
| `/doctor/dashboard` | Doctor | `DoctorLayout` | Clinical summary, today's schedule, patient count |
| `/doctor/appointments`| Doctor | `DoctorAppointmentsPage` | Manage bookings, approve/reject, add diagnosis & prescriptions |
| `/doctor/schedule` | Doctor | `DoctorSchedulePage` | Configure working days, start/end hours, and appointment durations |
| `/doctor/patients` | Doctor | `DoctorPatientsPage` | View assigned patients and their past consultations |
| `/doctor/profile` | Doctor | `DoctorProfilePage` | Update specialization, consultation fees, biography, and room number |
| `/doctor/notifications`| Doctor | `DoctorLayout` | Patient booking requests, status alerts, approvals, notification history |
| `/admin/dashboard` | Admin | `AdminLayout` | Overview metrics, quick actions, recent hospital appointments |
| `/admin/doctors` | Admin | `AdminDoctorsPage` | Doctor roster management and account status toggles |
| `/admin/doctor-requests`| Admin | `AdminDoctorRequestsPage` | Review and approve/reject pending doctor applications |
| `/admin/patients` | Admin | `AdminPatientsPage` | Directory of registered hospital patients |
| `/admin/departments`| Admin | `AdminDepartmentsPage` | Create, update, and manage medical departments |
| `/admin/appointments`| Admin | `AdminAppointmentsPage` | Global oversight and filters for all hospital bookings |
| `/admin/settings` | Admin | `AdminSettingsPage` | Administrative environment and configuration overview |
| `/admin/notifications` | Admin | `AdminLayout` | New doctor registrations, patient signups, cancellations overview |

---

## 12. API Reference Overview

All API endpoints are hosted by `BE/` and prefixed with `/api` (or accessed directly depending on router dispatch).

### 🔑 Authentication & Profile
| Method | Endpoint | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Patient & Admin login; returns JWT token & user object |
| `POST` | `/api/auth/doctor/login` | Public | Doctor login with status verification (pending, rejected, active) |
| `POST` | `/api/auth/register` | Public | Register patient account (creates `patient` role only) |
| `POST` | `/api/auth/doctor/register` | Public | Submit doctor application (creates doctor with `pending` status) |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile and doctor metadata |
| `GET` | `/api/patient/profile` | Patient | Retrieve patient profile (name, email, phone, gender, date of birth, age) |
| `PUT` | `/api/patient/profile` | Patient | Update personal info (name, phone, gender, date of birth; email read-only, no photo) |
| `PUT` | `/api/patient/profile/password` | Patient | Update password with current password verification (`password_verify`) |
| `GET` | `/api/health` | Public | Verify backend availability and system timestamp |

### 🏥 Departments & Doctors
| Method | Endpoint | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/departments` | Public | List active departments (or all when `?all=true` for admin) sorted by name/created_at |
| `GET` | `/api/departments/{id}` | Public | Retrieve a single department by ID |
| `POST` | `/api/departments` | Admin | Create a new department |
| `PUT` | `/api/departments/{id}` | Admin | Update department name, description, icon, or active status |
| `DELETE`| `/api/departments/{id}` | Admin | Delete department (blocked if assigned doctor count > 0; prompts to deactivate) |
| `GET` | `/api/doctors` | Public | Browse approved doctors sorted by `rating_avg DESC, name ASC, id ASC` |
| `GET` | `/api/doctors/{id}` | Public | Detailed doctor profile including weekly schedule |

### 📅 Appointments, Status Flow & Rescheduling

#### Appointment Status State Machine
```
              ┌───────────────┐
              │    pending    │
              └───────┬───────┘
         ┌────────────┼────────────┐
         ▼            ▼            ▼
  ┌────────────┐┌────────────┐┌────────────┐
  │  approved  ││  rejected  ││ cancelled  │
  └──────┬─────┘│  (final)   ││  (final)   │
    ┌────┴────┐ └────────────┘└────────────┘
    ▼         ▼
┌──────────┐┌──────────┐
│completed ││cancelled │
│ (final)  ││ (final)  │
└──────────┘└──────────┘
```
- Server-side state machine enforced in `AppointmentService` (invalid moves return `422 Unprocessable Entity`).
- Rejecting or doctor-cancelling stores an optional `rejection_reason` (max 255 chars) shown directly to the patient.
- Patient reschedule on an approved appointment returns status to `pending` so the doctor re-confirms.
- Doctor reschedule keeps current status.
- Rescheduling is permitted at least 2 hours before the appointment and max 2 times per booking.
- Fixed doctor booking: All appointment bookings are initiated strictly from a `DoctorCard` or Doctor Profile; standalone doctor selectors are disabled.

| Method | Endpoint | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/appointments/slots` | Public / All | Get generated 30-min slots for a doctor & date (`?doctorId=&date=`) |
| `GET` | `/api/appointments` | Authenticated | Retrieve appointments (supports `?sort=` and `?order=` with whitelist validation) |
| `GET` | `/api/appointments/{id}` | Authenticated | Get full appointment details, payment, feedback, and reschedule history |
| `POST` | `/api/appointments` | Patient | Book a specific appointment slot with fixed doctor (auto-creates unpaid payment) |
| `PATCH`| `/api/appointments/{id}/reschedule` | Patient / Doctor | Reschedule appointment date and slot with row locking (max 2 times, >= 2h prior) |
| `POST` | `/api/appointments/{id}/cancel` | Authenticated | Cancel an appointment with optional reason; refunds payment if paid |
| `PATCH`| `/api/appointments/{id}/status` | Doctor | Update status (`approved`, `completed`, `cancelled`, `rejected`) with optional reason |
| `POST` | `/api/appointments/{id}/consultation` | Doctor | Save diagnosis, prescription, and consultation notes; marks completed |

### 💳 Demo Payments & Receipts
| Method | Endpoint | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/appointments/{id}/pay` | Owning Patient | Simulated payment checkout (`upi`, `card`, `cash`); sets paid, generates ref |
| `GET` | `/api/appointments/{id}/receipt` | Authenticated | Retrieve printable receipt data (patient, doctor of appointment, or admin) |

### ⭐ Feedback & Reviews
| Method | Endpoint | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/appointments/{id}/feedback`| Owning Patient | Submit 1–5 star rating and comment for completed appointment (once only) |
| `PUT` | `/api/appointments/{id}/feedback`| Owning Patient | Update review within 7-day edit window; sets `is_edited=true` |
| `DELETE`| `/api/appointments/{id}/feedback`| Owning Patient | Delete review within 7-day window; atomically recalculates doctor rating |
| `GET` | `/api/doctors/{id}/feedback` | Public | Paginated reviews & rating distribution for a doctor (privacy-masked patient name) |
| `GET` | `/api/doctor/feedback` | Doctor | Doctor's own ratings, 1-5 star distribution, and paginated patient reviews |
| `GET` | `/api/admin/feedback` | Admin | Moderation list of all reviews sorted by `created_at DESC, id DESC` |
| `DELETE`| `/api/admin/feedback/{id}` | Admin | Moderation removal of review; recalculates doctor average rating |

### 🩺 Doctor Workspace
| Method | Endpoint | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/doctor/schedule` | Doctor | Retrieve the authenticated doctor's weekly timetable |
| `PUT` | `/api/doctor/schedule` | Doctor | Save/update weekly schedule availability |
| `GET` | `/api/doctor/profile` | Doctor | Retrieve authenticated doctor's profile (including `clinic_address`) |
| `PUT` | `/api/doctor/profile` | Doctor | Update bio, clinic address, room number, fee, qualification, specialization |
| `PUT` | `/api/doctor/change-password` | Doctor | Update password verifying current password with `password_verify` (min 8 chars, letter + number) |
| `GET` | `/api/doctor/feedback` | Doctor | View doctor's own patient ratings and reviews |

### 🛡️ Administrator Operations
| Method | Endpoint | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Admin | Aggregate dashboard counters, recent appointments, and payment revenue |
| `GET` | `/api/admin/doctors` | Admin | List all doctors sorted by `created_at DESC, id DESC` (supports filter `?status=`) |
| `POST`| `/api/admin/doctors` | Admin | Create a new doctor in `active` status (multipart/form-data with optional photo). Generates and returns a random 12-char alphanumeric temporary password once (`tempPassword`). |
| `GET` | `/api/admin/doctors/{id}` | Admin | Full doctor dossier modal: profile, stats, 7-day schedule, appointments, reviews |
| `GET` | `/api/admin/doctor-requests`| Admin | Retrieve pending doctor registrations awaiting approval |
| `POST` | `/api/admin/doctors/{id}/approve` | Admin | Approve a pending doctor account |
| `POST` | `/api/admin/doctors/{id}/reject` | Admin | Reject a pending doctor account |
| `PATCH`| `/api/admin/doctors/{id}/status` | Admin | Change doctor status (`active`, `inactive`, `rejected`) |
| `GET` | `/api/admin/doctors/{id}/delete-impact` | Admin | Return total & upcoming appointments affected by doctor deletion |
| `DELETE`| `/api/admin/doctors/{id}` | Admin | Hard delete doctor, schedules, consultation notes, appointments, user, and avatar files |
| `GET` | `/api/admin/patients` | Admin | List all registered patients sorted by `created_at DESC, id DESC` |
| `POST`| `/api/admin/patients` | Admin | Create a new patient in `active` status. Generates and returns a random 12-char alphanumeric temporary password once (`tempPassword`). |
| `GET` | `/api/admin/reports` | Admin | Distribution analytics (appointments by status, revenue, doctors per dept) |
| `GET` | `/api/admin/feedback` | Admin | Moderation review list with filtering and pagination |
| `DELETE`| `/api/admin/feedback/{id}` | Admin | Delete a patient review and recompute rating aggregates |

> [!IMPORTANT]
> **Temporary Password Security Policy**:
> When an administrator provisions a doctor (`POST /api/admin/doctors`) or a patient (`POST /api/admin/patients`), a secure 12-character random alphanumeric temporary password is generated via `random_bytes()`, securely hashed via `password_hash()` with `PASSWORD_BCRYPT`, and returned strictly **once** in the API response under `tempPassword`.
> - The temporary password is **never** logged to server logs or persisted in plain text in the database.
> - The frontend displays it in a one-time copyable `CredentialsModal` and does not persist it in React Query cache, `localStorage`, or `sessionStorage`.
> - The user can log in immediately with this credential and change their password anytime from their account profile settings.

### 🔔 Notifications (All Authenticated Roles)
| Method | Endpoint | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Authenticated | List notifications sorted by `created_at DESC, id DESC` (`?page=1&limit=10&filter=all\|unread`) |
| `GET` | `/api/notifications/unread-count` | Authenticated | Get real-time unread notifications count |
| `PATCH`| `/api/notifications/{id}/read` | Authenticated | Mark a single notification as read (scoped to current user) |
| `POST` | `/api/notifications/read-all` | Authenticated | Mark all notifications as read for current user |
| `DELETE`| `/api/notifications/{id}` | Authenticated | Delete a single notification (scoped to current user) |
| `DELETE`| `/api/notifications` | Authenticated | Delete all read notifications for current user |

> [!NOTE]
> **New Doctor Registration Notifications (`new_doctor_registration`)**:
> - When a doctor self-registers via `POST /api/auth/doctor/register`, the system automatically calls `NotificationService::notifyAdmins()` with type `new_doctor_registration`, title `"New doctor request"`, message `"Dr. <name> (<specialization>) has applied and is waiting for approval."`, data `{"doctor_id": <id>}`, and link `"/admin/doctor-requests"`.
> - Delivered in real time to all active administrators via the WebSocket bridge (`event: "notification"` and `event: "data_changed"` for doctor requests and stats), updating the header bell, sidebar badges, and dashboard counters instantly without requiring a page refresh, with seamless 30-second polling fallback.
> - Doctors created directly by administrators through "Add doctor" do **not** dispatch this notification.

---

## 13. Data Ordering & Server-Side Sorting (`SortConfig`)

To guarantee deterministic, consistent lists and avoid unstable pagination, Medi-Care implements a centralized server-side sorting architecture governed by `BE/src/Config/SortConfig.php`.

### Ordering Rules & Whitelist Specifications

| Context / Surface | Endpoint | Allowed Sort Keys | Default Sort Order | Primary Key Tie-Breaker |
| :--- | :--- | :--- | :--- | :--- |
| **Admin All Appointments** | `GET /api/appointments` | `created_at`, `appointment_date`, `patient_name`, `doctor_name`, `status` | `created_at DESC` | `a.id DESC` |
| **Doctor Booking Requests** | `GET /api/appointments?status=pending` | `created_at`, `appointment_date` | `created_at DESC` (newest first) | `a.id DESC` |
| **Doctor Upcoming Visits** | `GET /api/appointments?tab=upcoming` | `appointment_date`, `start_time` | `appointment_date ASC, start_time ASC` | `a.id ASC` |
| **Doctor Past History** | `GET /api/appointments?tab=history` | `appointment_date`, `start_time` | `appointment_date DESC, start_time DESC` | `a.id DESC` |
| **Patient Appointments** | `GET /api/appointments` | `created_at`, `appointment_date`, `status` | `created_at DESC` | `a.id DESC` |
| **Admin Doctor Roster** | `GET /api/admin/doctors` | `created_at`, `name`, `status` | `created_at DESC` | `u.id DESC` |
| **Admin Doctor Requests** | `GET /api/admin/doctor-requests`| `created_at` | `created_at DESC` (oldest pending first or newest) | `u.id DESC` |
| **Admin Patient Directory**| `GET /api/admin/patients` | `created_at`, `name` | `created_at DESC` | `u.id DESC` |
| **Admin Departments** | `GET /api/departments?all=true` | `created_at`, `name` | `created_at DESC` | `d.id DESC` |
| **Public Departments** | `GET /api/departments` | `name` | `name ASC` (alphabetical A-Z) | `d.id ASC` |
| **Public Doctor Directory**| `GET /api/doctors` | `rating_avg`, `name`, `experience_years` | `rating_avg DESC, u.name ASC` | `u.id ASC` |
| **Notifications** | `GET /api/notifications` | `created_at` | `created_at DESC` | `id DESC` |
| **Feedback / Reviews** | `GET /api/admin/feedback` | `created_at`, `rating` | `created_at DESC` | `f.id DESC` |

### Security & Whitelisting
- Every incoming query parameter `?sort=` and `?order=` is strictly validated against `SortConfig::$whitelists`.
- Unrecognized or malicious column names are safely discarded and replaced with the safe context default.
- The direction `?order=` is restricted to `ASC` or `DESC` (case-insensitive).
- All queries append the table's primary key (`id DESC` or `id ASC`) to resolve identical timestamps deterministically.

---

## 14. File Uploads & Static Assets

Doctor profile photos and thumbnails are processed and managed entirely on the backend:

- **Native PHP Uploads**: File uploads are processed directly by native PHP business logic (`App\Services\UploadService`), **NOT** multer (which is Node.js-only).
- **Storage Locations**:
  - Full Images: `backend/public/uploads/doctors/`
  - Cropped Thumbnails (480x480 via GD): `backend/public/uploads/doctors/thumbs/`
  - Default Avatar Placeholder: `backend/public/uploads/defaults/doctor-default.png`
- **Thumbnail Regeneration Utility**:
  - To regenerate high-resolution 480x480 thumbnails for existing doctor portraits (skipping defaults, idempotent), run:
    ```bash
    php bin/regenerate-thumbnails.php
    ```
- **Allowed Types & Limits**:
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp` (validated strictly using PHP `finfo` against file contents, not just client file extensions).
  - Maximum file size: `2 MB`.
- **Security & Execution Protection**:
  - Safe randomized filenames generated via `bin2hex(random_bytes(16)) . '.' . $extension` (never using original client filenames).
  - PHP script execution is disabled inside `backend/public/uploads/.htaccess` and enforced at the router level.
  - Orphan files are automatically deleted via database transactions and cleanup routines on failure or photo update.
- **PHP Extension Requirements**:
  - `ext-gd`: Required for image cropping and generating 480x480 thumbnails.
  - `ext-fileinfo`: Required for verifying actual MIME types.
  - *Enabling in XAMPP*: In `C:\xampp\php\php.ini`, ensure `extension=gd` and `extension=fileinfo` are uncommented (remove the leading semicolon `;`), then restart Apache.

---

## 15. Database Schema & Columns

The relational database (`medicare_appointment_db`) contains the following tables and columns:

### `users`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT |
| `name` | `VARCHAR(100)` | NOT NULL |
| `email` | `VARCHAR(150)` | NOT NULL, UNIQUE, Indexed |
| `password` | `VARCHAR(255)` | NOT NULL (Bcrypt hashed) |
| `role` | `ENUM('admin', 'doctor', 'patient')` | NOT NULL, Indexed |
| `phone` | `VARCHAR(30)` | NULL |
| `status` | `ENUM('active', 'pending', 'rejected', 'inactive')`| DEFAULT 'active', Indexed |
| `created_at` | `DATETIME` | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | `DATETIME` | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### `departments`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE |
| `description` | `TEXT` | NULL |
| `icon` | `VARCHAR(50)` | DEFAULT 'Activity' |
| `is_active` | `TINYINT(1)` | DEFAULT 1 |
| `created_at` | `DATETIME` | DEFAULT CURRENT_TIMESTAMP |

### `doctor_profiles`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT |
| `user_id` | `INT` | NOT NULL, UNIQUE, FOREIGN KEY (`users.id`) ON DELETE CASCADE |
| `department_id` | `INT` | NULL, FOREIGN KEY (`departments.id`) ON DELETE SET NULL |
| `specialization` | `VARCHAR(150)` | NOT NULL, Indexed |
| `qualification` | `VARCHAR(200)` | NOT NULL |
| `license_number` | `VARCHAR(50)` | NULL, **UNIQUE**, Indexed (5–30 chars, alphanumeric + hyphens/slashes) |
| `image_path` | `VARCHAR(255)` | NULL (Relative path to full image in `uploads/doctors/`) |
| `thumbnail_path` | `VARCHAR(255)` | NULL (Relative path to 480x480 thumbnail in `uploads/doctors/thumbs/`) |
| `experience_years`| `INT` | DEFAULT 0 |
| `consultation_fee`| `DECIMAL(10,2)` | DEFAULT 0.00 |
| `bio` | `TEXT` | NULL |
| `room_number` | `VARCHAR(50)` | NULL |
| `clinic_address` | `TEXT` | NULL (Physical practice or clinic address) |
| `created_at` | `DATETIME` | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | `DATETIME` | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### `doctor_schedules`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT |
| `doctor_id` | `INT` | NOT NULL, FOREIGN KEY (`users.id`) ON DELETE CASCADE |
| `day_of_week` | `ENUM('Monday'...'Sunday')` | NOT NULL |
| `start_time` | `TIME` | NOT NULL |
| `end_time` | `TIME` | NOT NULL |
| `slot_duration_minutes` | `INT` | DEFAULT 30 |
| `is_available` | `TINYINT(1)` | DEFAULT 1 |
| `created_at` | `DATETIME` | DEFAULT CURRENT_TIMESTAMP |

### `appointments`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT |
| `appointment_number` | `VARCHAR(30)` | UNIQUE, NOT NULL |
| `patient_id` | `INT` | NOT NULL, FOREIGN KEY (`users.id`) ON DELETE CASCADE |
| `doctor_id` | `INT` | NOT NULL, FOREIGN KEY (`users.id`) ON DELETE CASCADE |
| `appointment_date` | `DATE` | NOT NULL, Indexed |
| `start_time` | `TIME` | NOT NULL |
| `end_time` | `TIME` | NOT NULL |
| `status` | `ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled')` | DEFAULT 'pending', Indexed |
| `reason_for_visit` | `TEXT` | NULL |
| `rejection_reason` | `VARCHAR(255)` | NULL (Explanation provided when doctor rejects or cancels) |
| `reschedule_count` | `INT` | DEFAULT 0 (Tracks reschedule operations, max 2 allowed) |
| `created_at` | `DATETIME` | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | `DATETIME` | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### `appointment_reschedules`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT |
| `appointment_id` | `INT` | NOT NULL, FOREIGN KEY (`appointments.id`) ON DELETE CASCADE |
| `old_date` | `DATE` | NOT NULL |
| `old_start_time` | `TIME` | NOT NULL |
| `new_date` | `DATE` | NOT NULL |
| `new_start_time` | `TIME` | NOT NULL |
| `rescheduled_by` | `INT` | NOT NULL, FOREIGN KEY (`users.id`) ON DELETE CASCADE |
| `created_at` | `DATETIME` | DEFAULT CURRENT_TIMESTAMP |

### `payments`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT |
| `appointment_id` | `INT` | NOT NULL, UNIQUE, FOREIGN KEY (`appointments.id`) ON DELETE CASCADE |
| `amount` | `DECIMAL(10,2)` | NOT NULL (Snapshot of doctor fee at booking time) |
| `status` | `ENUM('unpaid', 'paid', 'refunded')` | DEFAULT 'unpaid', Indexed |
| `method` | `ENUM('upi', 'card', 'cash')` | NULL |
| `transaction_ref` | `VARCHAR(100)` | NULL (e.g. `MC-20260101-AB12CD`) |
| `paid_at` | `DATETIME` | NULL |
| `created_at` | `DATETIME` | DEFAULT CURRENT_TIMESTAMP |

### `feedback`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT |
| `appointment_id` | `INT` | NOT NULL, UNIQUE, FOREIGN KEY (`appointments.id`) ON DELETE CASCADE |
| `patient_id` | `INT` | NOT NULL, FOREIGN KEY (`users.id`) ON DELETE CASCADE |
| `doctor_id` | `INT` | NOT NULL, FOREIGN KEY (`users.id`) ON DELETE CASCADE |
| `rating` | `TINYINT` | NOT NULL (Rating between 1 and 5) |
| `comment` | `VARCHAR(500)` | NULL |
| `created_at` | `DATETIME` | DEFAULT CURRENT_TIMESTAMP |

### `consultation_records`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT |
| `appointment_id` | `INT` | NOT NULL, UNIQUE, FOREIGN KEY (`appointments.id`) ON DELETE CASCADE |
| `diagnosis` | `TEXT` | NULL |
| `prescription` | `TEXT` | NULL |
| `consultation_notes`| `TEXT` | NULL |
| `created_at` | `DATETIME` | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | `DATETIME` | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### `notifications`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `INT` | PRIMARY KEY, AUTO_INCREMENT |
| `user_id` | `INT` | NOT NULL, FOREIGN KEY (`users.id`) ON DELETE CASCADE |
| `type` | `VARCHAR(50)` | NOT NULL, Event category identifier |
| `title` | `VARCHAR(255)` | NOT NULL, Notification title |
| `message` | `TEXT` | NOT NULL, Body text / explanation |
| `data` | `JSON` | NULL, Contextual references (`appointment_id`, `doctor_id`, etc.) |
| `link` | `VARCHAR(255)` | NULL, Target route to navigate to upon click |
| `is_read` | `TINYINT(1)` | DEFAULT 0, Read indicator (0 = unread, 1 = read) |
| `read_at` | `DATETIME` | NULL, Timestamp when marked as read |
| `created_at` | `DATETIME` | DEFAULT CURRENT_TIMESTAMP |

> **Performance Composite Index**: `(user_id, is_read, created_at DESC)` ensures zero-scan scoped queries, instantaneous unread count calculation, and snappy paginated inbox listing.

---

## 16. Real-Time Notification System & WebSocket Architecture

Medi-Care features an enterprise-grade, event-driven real-time notification subsystem shared seamlessly across all three roles (**Patient**, **Doctor**, and **Admin**).

### Dual-Port WebSocket Architecture
The WebSocket server runs as an independent daemon process alongside Apache and the Vite dev server using **Ratchet** and **ReactPHP**:

```
[ Browser Clients ] ──(ws://127.0.0.1:8080)──► [ Ratchet WsServer ]
                                                       │
                                            [ EventLoop Dispatcher ]
                                                       ▲
[ PHP Backend HTTP ] ──(POST /publish)──────► [ ReactPHP HTTP Bridge ]
 (NotificationService) (127.0.0.1:8081)
```

1. **Client WebSocket Server (`127.0.0.1:8080`)**:
   - Accepts WebSocket connections from browser tabs.
   - **Handshake Authentication**: Clients connect and immediately send `{ type: "auth", token: "<JWT>" }` as their first frame. Tokens are **never** passed in the URL to prevent leakage in proxy and server access logs.
   - Connections that fail to authenticate within 5 seconds are terminated.
   - Origin checking enforces access only from approved client domains (`WS_ALLOWED_ORIGINS`).
   - Supports multi-tab tracking per user with automatic heartbeat ping/pong every 30 seconds.

2. **Internal Publish Bridge (`127.0.0.1:8081/publish`)**:
   - Binds strictly to `127.0.0.1` and accepts internal `POST /publish` requests dispatched by `NotificationService`.
   - Protected by `X-Internal-Secret` header validation.
   - Main request non-blocking safety: Backend services invoke the bridge via cURL with a 1-second timeout. Any network failure is logged and safely suppressed without interrupting database transactions or user operations.

3. **Event Dispatch Matrix**:
   - `notification`: Delivers full notification record and updated `unreadCount` to recipient user sockets.
   - `data_changed`: Instructs client query caches to invalidate specified entities (`appointments`, `doctors`, `admin-stats`, `patients`) so open screens update live.
   - `force_logout`: Dispatched when medical credentials or user accounts are deactivated/deleted, terminating active sessions immediately.

4. **Resilience & Polling Fallback**:
   - The frontend singleton WebSocket client (`lib/socket.ts`) automatically reconnects using exponential backoff (1s &rarr; 30s max).
   - If the WebSocket server is offline or unreachable, React Query activates an automatic fallback: polling `GET /api/notifications/unread-count` every 30 seconds (`refetchInterval` active only while disconnected).
   - Once the socket reconnects, polling deactivates and the badge count is refetched once.

### Starting the WebSocket Server

1. **Environment Settings** (in `backend/.env`):
   ```env
   WS_HOST=127.0.0.1
   WS_PORT=8080
   WS_INTERNAL_PORT=8081
   WS_INTERNAL_SECRET=medicare_ws_internal_secret_998877_secure
   WS_ALLOWED_ORIGINS=http://localhost:5173
   ```

2. **Run in a Separate Terminal**:
   ```bash
   cd backend
   composer ws:start
   # Or directly: php bin/websocket.php
   ```

---

## 17. Project Scope

To ensure high performance, security, and a focused clinical appointment lifecycle, the following features are **intentionally out of scope**:

- ❌ Pharmacy and physical medication inventory management.
- ❌ Payment gateway integration: Only a demo payment (no gateway, no real money charged, zero credit card storage) exists for simulated clinical billing and receipt generation.
- ❌ Full Hospital EMR / inpatient bed management.
- ❌ Nurse, ward staff, or lab technician workflows.
- ❌ Real-time WebRTC audio/video calling.
- ❌ AI-based automated diagnostic or predictive triage tools.

---

## 18. Troubleshooting

### 1. Apache Stripping the Authorization Header in XAMPP
**Issue**: Requests fail with `401 Unauthorized: Missing authentication token` even though a Bearer token is sent in the header.
**Cause**: Apache in XAMPP by default often suppresses the HTTP `Authorization` header in CGI/FastCGI environments.
**Solution**:
1. Check `backend/src/Middleware/AuthMiddleware.php`: Notice the application already supports fallback inspection of `$_SERVER['REDIRECT_HTTP_AUTHORIZATION']`.
2. Ensure your `public/.htaccess` includes the rewrite rule:
   ```apache
   RewriteEngine On
   RewriteCond %{HTTP:Authorization} ^(.*)
   RewriteRule .* - [e=HTTP_AUTHORIZATION:%1]
   ```

### 2. Database Connection Error (`SQLSTATE[HY000] [2002]`)
**Issue**: Backend reports `Database connection failed`.
**Solution**:
- Ensure MySQL is running in the XAMPP Control Panel.
- Check `backend/.env` and verify `DB_HOST=127.0.0.1` and `DB_PORT=3306`. Using `127.0.0.1` instead of `localhost` avoids Unix/Windows named socket conflicts.
- Ensure the password in `DB_PASS` matches your MySQL root user (default XAMPP root password is empty `""`).

### 3. WebSocket Port In Use (`Address already in use` 8080 or 8081)
**Issue**: Running `composer ws:start` reports `Failed to listen on "tcp://127.0.0.1:8080": Address already in use`.
**Solution**:
- Check which process is occupying port 8080 or 8081:
  ```powershell
  netstat -ano | findstr :8080
  netstat -ano | findstr :8081
  ```
- Terminate the conflicting process (`taskkill /PID <PID> /F`) or change `WS_PORT` / `WS_INTERNAL_PORT` in `backend/.env`.

### 4. WebSocket Disconnected / Polling Fallback Active
**Issue**: Browser console displays `WebSocket connection to 'ws://localhost:8080/' failed`.
**Solution**:
- The frontend gracefully handles this scenario: the notification badge switches to polling `GET /api/notifications/unread-count` every 30 seconds so all features remain functional.
- To enable instant real-time pushes, open a terminal in `backend/` and start the daemon with `composer ws:start`. Upon launching, the frontend will automatically reconnect without needing a page refresh.

### 5. Windows Firewall Blocking WebSocket Handshake
**Issue**: Local browser connections to `ws://127.0.0.1:8080` are rejected or reset.
**Solution**:
- Ensure Windows Firewall or third-party antivirus permits inbound TCP connections to `127.0.0.1:8080` and `127.0.0.1:8081`.

### 6. Doctor Account Cannot Log In
**Issue**: Newly registered doctor receives `403 Forbidden` on login attempt.
**Solution**:
- This is intentional: newly registered doctors are placed into `pending` status upon submission.
- Sign in with your administrator credentials via `/login` (which redirects to `/admin/dashboard`), navigate to **Doctor Requests**, and click **Approve** on the doctor's profile. Once approved, the doctor can immediately sign in at `/doctor/login`.

---

## 19. Author & License

- **Author**: Medi-Care Engineering Team
- **Repository**: [https://github.com/shaamyll/Medicare-online-appointment-system](https://github.com/shaamyll/Medicare-online-appointment-system)
- **License**: Released under the [MIT License](LICENSE).

