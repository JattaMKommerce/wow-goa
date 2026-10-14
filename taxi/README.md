# Taxi B2B Operations & Chauffeur Mobility Module for Wow Goa

## 1. Overview & Architecture
This module introduces an enterprise-grade **B2B Taxi, Fleet & Chauffeur Dispatch System** to the **Wow Goa** ecosystem.

### Architectural Placement: "Self Drive Holidays" vs. "Taxi B2B Operations"

| Feature | Self Drive Holidays (Existing Wow Goa) | Taxi B2B Operations (This Module) |
| :--- | :--- | :--- |
| **Target Audience** | B2C tourists, vacationers, holiday package buyers | B2B travel partners, hotels, dispatchers, corporate clients |
| **Vehicle Control** | Unchauffered (Customer drives car/bike themselves) | Chauffeur-driven with licensed professional drivers |
| **Operational Core** | Multi-day itinerary packages, hotel stays, rental duration | Flight radar arrivals, point-to-point dispatch, live trip state machine |
| **Driver Portal** | Basic driver task checklist | Full Chauffeur Duty Portal (Duty toggle, upcoming dispatches, turn-by-turn state progression) |
| **Inter-Fleet Sharing** | Static vendor car listing | Real-Time Live Fleet Directory (Search partner cars, per-km rates, immediate dispatch) |
| **Admin Control** | E-commerce booking orders & CMS | Real-time Kanban Dispatch Desk, Flight Radar, Telematics & GPS tracking |

---

## 2. Recommended Integration Points in Wow Goa (Zero-Code Modification)
This module has been isolated inside `taxi/` to strictly protect all existing Wow Goa code from being changed or broken.

When Wow Goa developers are ready to integrate navigation into the main application, the recommended touchpoints are:

1. **B2B Portal Integration (`frontend/src/pages/b2b/`)**:
   - In `B2BDashboardTab.jsx`, alongside "Self Drive Holidays", add an option for **"B2B Taxi & Chauffeur Transfers"** linking to the Taxi dispatch and booking portal.
2. **Customer & Corporate Airport Transfers (`frontend/src/pages/customer/`)**:
   - Airport arrivals at Goa Dabolim (GOI) and Manohar Mopa (GOX) can route corporate pickup requests directly to the Taxi Dispatcher Desk.
3. **Driver Operations (`frontend/src/pages/driver/`)**:
   - Wow Goa drivers can switch into the full Chauffeur Portal for real-time dispatch assignments, trip milestones (Arrived, On Trip, Completed), and daily payouts.
4. **Backend API Microservice**:
   - Wow Goa's core backend is PHP (`backend/api.php`). The Taxi engine runs independently as a high-performance Python/Django REST API (`taxi/backend/`) with zero conflicts.

---

## 3. Directory Structure
```
taxi/
├── backend/                  # Django REST Framework API Engine
│   ├── apps/
│   │   ├── authentication/   # JWT auth & multi-role permissions (Fleet Admin, Dispatcher, Chauffeur)
│   │   ├── billing/          # Corporate rate cards, automated invoicing, tariff calculations
│   │   ├── dispatches/       # Kanban dispatch desk, flight tracking, trip state machine
│   │   ├── drivers/          # Chauffeur onboarding, duty shifts, documents & KYC
│   │   ├── fleet/            # Vehicle fleet directory, per-km tariffs, maintenance logs
│   │   └── telematics/       # Live GPS feeds, geofencing, speed & battery alerts
│   ├── config/               # Django settings, WSGI, URLs
│   ├── manage.py
│   ├── requirements.txt
│   └── seed_*.py             # Complete realistic Goa demonstration dataset
├── frontend/                 # React 18 + Vite Chauffeur & Dispatch Frontend
│   ├── src/
│   │   ├── components/       # Header, Sidebar, FlightRadar Desk, VIP Placards, Matchmaker Modal
│   │   ├── pages/            # 10 comprehensive operational views
│   │   │   ├── LandingPage.jsx         # Executive B2B mobility marketing & booking preview
│   │   │   ├── DashboardOverview.jsx   # Fleet Admin KPIs, utilization, trip volume
│   │   │   ├── B2BDispatches.jsx       # Real-time Drag/Click Kanban Dispatcher Desk
│   │   │   ├── ChauffeurPortal.jsx     # Driver mobile-first duty & trip execution portal
│   │   │   ├── LiveFleetDirectory.jsx  # Inter-fleet partner car viewing & per-km pricing
│   │   │   ├── VehicleManagement.jsx   # Vehicle fleet CRUD & service records
│   │   │   ├── DriverDirectory.jsx     # Chauffeur registry & documents
│   │   │   ├── BillingSettlements.jsx  # Invoicing & partner commissions
│   │   │   ├── LiveTelematicsMap.jsx   # GPS fleet tracking & telemetry health
│   │   │   └── ComplianceVault.jsx     # Regulatory insurance & permit vault
│   ├── package.json
│   └── vite.config.js
└── QA_REPORT.md              # 100% verified E2E QA Test Report (all roles & workflows passed)
```

---

## 4. Running the Taxi Module Locally

### Step 1: Start Django Backend (Port 8000)
```bash
cd taxi/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python seed_phase1.py
python seed_dispatches.py
python seed_billing.py
python seed_telematics.py
python manage.py runserver 127.0.0.1:8000
```

### Step 2: Start Vite Frontend (Port 5173 / 5174)
```bash
cd taxi/frontend
npm install
npm run dev
```

---

## 5. Demonstration Credentials
- **Fleet Admin**: `admin` / `admin123`
- **Dispatcher Desk**: `dispatcher` / `dispatch123`
- **Chauffeur Portal**: `driver` / `driver123`
