# 🛡️ Threat Hunting & Security Investigation Platform — Architecture Plan

> **Status**: Awaiting user confirmation before Phase 1 begins.

---

## 1. FINAL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                         WINDOWS 11 HOST                         │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │    SPLUNK    │    │    DJANGO    │    │      REACT        │  │
│  │              │◄───│   BACKEND   │◄───│    FRONTEND       │  │
│  │ :8000 (Web)  │    │   :8001     │    │    :3000          │  │
│  │ :8089 (API)  │    │             │    │                   │  │
│  └──────────────┘    └──────┬──────┘    └───────────────────┘  │
│                             │                                   │
│                      ┌──────▼──────┐                           │
│                      │ PostgreSQL  │                           │
│                      │   :5432     │                           │
│                      └─────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### Communication Chain
```
Browser (Analyst)
     ↓ HTTPS/HTTP
React Frontend (:3000)
     ↓ REST API calls (JSON)
Django Backend (:8001)
     ↓ Splunk REST API (HTTPS, token/basic auth)
Splunk (:8089)
     ↓ SPL Search
Splunk Index: threathunt
     ↓
Security Events (Windows Logs, Sysmon)
```

**Key Principle**: Splunk credentials live ONLY in Django backend `.env` file. React never touches Splunk directly.

---

## 2. TECHNOLOGY STACK

| Component | Technology | Version | Purpose |
|---|---|---|---|
| SIEM | Splunk Enterprise/Free | Existing install | Log storage, SPL, event search |
| Backend Framework | Django + DRF | 4.x / 3.x | REST API, business logic |
| Frontend Framework | React + Vite | 18.x | UI, SOC interface |
| Database | PostgreSQL | 15.x | Cases, findings, notes, metadata |
| HTTP Client (BE) | `requests` / `splunk-sdk` | latest | Splunk REST API calls |
| HTTP Client (FE) | Axios | latest | Django API calls |
| Charts | Recharts | latest | Dashboard visualizations |
| UI Styling | Tailwind CSS | 3.x | Dark SOC-style design |
| Auth (Backend) | Django SimpleJWT | latest | JWT token authentication |
| Auth (Frontend) | JWT + localStorage | — | Session management |
| PDF Reports | ReportLab / WeasyPrint | latest | SOC report generation |
| Testing (BE) | pytest-django | latest | Backend unit + integration tests |
| Testing (FE) | Vitest + RTL | latest | Frontend component tests |
| Dev Env | Python venv + npm | — | Local dependency isolation |
| Container (later) | Docker + Compose | latest | Django + React + PostgreSQL |

---

## 3. DATA FLOW

### 3A. Log Ingestion Flow
```
Real Dataset (EVTX / CSV / JSON)
     ↓
Splunk Universal Forwarder OR manual upload
     ↓
Splunk Index: "threathunt"
     ↓
Available via SPL: index=threathunt
```

### 3B. Threat Hunting Flow
```
Analyst opens Threat Hunting page
     ↓ selects hunt category (e.g. PowerShell)
React sends POST /api/hunts/run/ {hunt_id, time_range}
     ↓
Django receives request
     ↓
SplunkService.execute_search(spl_query)
     ↓
Splunk REST API: POST /services/search/jobs
     ↓
Poll job until complete
     ↓
GET /services/search/jobs/{sid}/results
     ↓
Django parses + returns JSON to React
     ↓
React renders event table + MITRE card
```

### 3C. Investigation Flow
```
Analyst clicks "Investigate" on a suspicious event
     ↓
React: POST /api/cases/ {event_id, title, host, user}
     ↓
Django creates InvestigationCase in PostgreSQL
     ↓
Django fetches related events from Splunk (correlation)
     ↓ (by host + user + ±30min time window)
React renders: Timeline + Related Events + MITRE Mapping
     ↓
Analyst adds notes: POST /api/cases/{id}/notes/
     ↓
Analyst generates report: POST /api/reports/ {case_id}
     ↓
Django builds PDF/JSON report from case data
     ↓
Report returned to analyst
```

### 3D. Correlation Logic
```
Trigger event (e.g. EventCode=4720, user=backupadmin)
     ↓
Correlation query: same host + same user ± 30 minutes
     ↓
index=threathunt host=WIN-SERVER-01 user=backupadmin
     earliest=-30m@m latest=+30m@m
     | sort _time
     ↓
Returns: login events, process events, privilege events
     ↓
Django builds unified timeline
```

---

## 4. UI PAGES

| # | Page | Route | Data Source |
|---|---|---|---|
| 1 | Login | `/login` | Django Auth (JWT) |
| 2 | SOC Dashboard | `/` | Splunk + PostgreSQL |
| 3 | Threat Hunting | `/hunt` | Splunk (live SPL) |
| 4 | SPL Query Library | `/spl-library` | PostgreSQL (HuntQuery model) |
| 5 | Event Timeline | `/timeline` | Splunk |
| 6 | Alerts & Findings | `/findings` | PostgreSQL (Finding model) |
| 7 | Investigation Cases | `/cases` | PostgreSQL |
| 8 | Case Detail | `/cases/:id` | PostgreSQL + Splunk |
| 9 | Host Investigation | `/hosts/:hostname` | Splunk |
| 10 | User Investigation | `/users/:username` | Splunk |
| 11 | MITRE ATT&CK View | `/mitre` | PostgreSQL (MITRETechnique) |
| 12 | Process Tree | `/processes` | Splunk (Sysmon EID 1) |
| 13 | Global Search | `/search` | Splunk |
| 14 | Report Viewer | `/reports/:id` | PostgreSQL + generated PDF |

### Dashboard Layout (Page 2 detail)
```
┌────────────────────────────────────────────────────────┐
│  🛡️ Threat Hunting Platform         [User] [Logout]    │
├──────────┬─────────────────────────────────────────────┤
│          │  [KPI Cards: Events | Hosts | Users |       │
│ SIDEBAR  │   Suspicious | Cases | Techniques]          │
│          ├─────────────────────────────────────────────┤
│ Dashboard│  [Events Over Time — Line Chart]            │
│ Hunt     │  [Top Hosts — Bar] [Top Users — Bar]        │
│ SPL Lib  │  [Event ID Dist — Bar] [Auth Success/Fail]  │
│ Timeline │  [MITRE Heatmap] [Severity Distribution]    │
│ Findings │                                             │
│ Cases    │  [Recent Suspicious Findings Table]         │
│ Hosts    │  [Open Cases Table]                         │
│ Users    │                                             │
│ MITRE    │                                             │
│ Search   │                                             │
│ Reports  │                                             │
└──────────┴─────────────────────────────────────────────┘
```

---

## 5. DATABASE DESIGN (PostgreSQL)

### Models Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     POSTGRESQL SCHEMA                       │
├──────────────────────┬──────────────────────────────────────┤
│ Model                │ Key Fields                           │
├──────────────────────┼──────────────────────────────────────┤
│ User (Django default)│ username, email, password (hashed)   │
├──────────────────────┼──────────────────────────────────────┤
│ InvestigationCase    │ id, title, status, priority,         │
│                      │ created_at, host, username,          │
│                      │ source_ip, splunk_query,             │
│                      │ conclusion, recommended_actions,     │
│                      │ assigned_analyst (FK: User)          │
├──────────────────────┼──────────────────────────────────────┤
│ Finding              │ id, title, detection_rule,           │
│                      │ timestamp, host, username,           │
│                      │ severity, evidence_raw,              │
│                      │ classification (TP/FP/Benign/etc),   │
│                      │ reason, case (FK: Case),             │
│                      │ mitre_techniques (M2M: MITRE)        │
├──────────────────────┼──────────────────────────────────────┤
│ Evidence             │ id, event_id, event_time, host,      │
│                      │ username, event_code, raw_event,     │
│                      │ source_ip, dest_ip, process,         │
│                      │ command_line, case (FK: Case)        │
├──────────────────────┼──────────────────────────────────────┤
│ MITRETechnique       │ technique_id (T1059.001), name,      │
│                      │ tactic, description, evidence_count, │
│                      │ confidence                           │
├──────────────────────┼──────────────────────────────────────┤
│ HuntQuery            │ id, name, category, description,     │
│                      │ hypothesis, spl, mitre (FK: MITRE),  │
│                      │ data_source, expected_evidence,      │
│                      │ investigation_notes, enabled         │
├──────────────────────┼──────────────────────────────────────┤
│ DetectionRule        │ id, name, description, spl,          │
│                      │ severity, data_source, enabled,      │
│                      │ fp_notes, mitre (FK: MITRE)          │
├──────────────────────┼──────────────────────────────────────┤
│ AnalystNote          │ id, content, created_at,             │
│                      │ analyst (FK: User),                  │
│                      │ case (FK: Case)                      │
├──────────────────────┼──────────────────────────────────────┤
│ Dataset              │ id, name, source, format,            │
│                      │ available_logs, available_fields,    │
│                      │ event_ids, limitations, license      │
├──────────────────────┼──────────────────────────────────────┤
│ SoCReport            │ id, case (FK: Case), generated_at,   │
│                      │ generated_by (FK: User),             │
│                      │ file_path, summary, findings_json    │
└──────────────────────┴──────────────────────────────────────┘
```

> **Important**: Raw Splunk events are NOT stored in PostgreSQL. Only references (event IDs, timestamps, host/user keys) are stored for correlation back to Splunk.

---

## 6. SPLUNK INTEGRATION DESIGN

### SplunkService (Django service layer)

```python
# backend/splunk/service.py

class SplunkService:
    def __init__(self):
        # Loads from environment variables
        self.host = settings.SPLUNK_HOST      # localhost
        self.port = settings.SPLUNK_PORT      # 8089
        self.username = settings.SPLUNK_USERNAME
        self.password = settings.SPLUNK_PASSWORD
        self.index = settings.SPLUNK_INDEX    # threathunt
        self.verify_ssl = settings.SPLUNK_VERIFY_SSL

    def health_check(self) -> bool
        # Test Splunk connectivity
    
    def execute_search(self, spl: str, earliest: str, latest: str) -> list[dict]
        # Run a blocking SPL search, return results
    
    def get_events_by_host(self, host: str, earliest: str, latest: str) -> list[dict]
        # index=threathunt host=<host>
    
    def get_events_by_user(self, username: str, earliest: str, latest: str) -> list[dict]
        # index=threathunt (user=<u> OR User=<u>)
    
    def get_events_by_eventcode(self, code: int) -> list[dict]
        # index=threathunt EventCode=<code>
    
    def get_correlated_events(self, host: str, user: str, timestamp: str, window_minutes: int = 30) -> list[dict]
        # Returns all events within ±window around a pivot event
    
    def get_dashboard_stats(self) -> dict
        # Total events, unique hosts, unique users
    
    def get_events_over_time(self, span: str = "1h") -> list[dict]
        # index=threathunt | timechart span=1h count
```

### Splunk Authentication
- Method: **HTTP Basic Auth** over HTTPS to port 8089
- Alternative: Splunk session token (login → get `sessionKey` → use in subsequent requests)
- SSL verification: configurable via `SPLUNK_VERIFY_SSL=false` for local dev

### Error Handling
```
Splunk unreachable → Return {"error": "Splunk unavailable", "code": "SPLUNK_CONN_ERROR"}
Invalid credentials → Return {"error": "Authentication failed", "code": "SPLUNK_AUTH_ERROR"}  
Invalid SPL → Return {"error": "Search syntax error", "detail": "..."}
Empty results → Return {"results": [], "message": "No events matched"}
Timeout → Return {"error": "Search timed out", "code": "SPLUNK_TIMEOUT"}
```

---

## 7. MITRE ATT&CK INTEGRATION DESIGN

### Principle: Evidence-Based Only
```
Event exists → Evaluate evidence → If sufficient → Map to technique
NOT: Event exists → Auto-map to MITRE
```

### Mapping Table (pre-loaded into DB)

| Technique ID | Name | Tactic | Trigger Evidence |
|---|---|---|---|
| T1078 | Valid Accounts | Initial Access, Defense Evasion | 4624 from unusual IP/time |
| T1059.001 | PowerShell | Execution | 4688/Sysmon with powershell.exe + -enc flag |
| T1059.003 | Windows Command Shell | Execution | 4688/Sysmon with cmd.exe |
| T1136.001 | Create Local Account | Persistence | EventCode=4720 |
| T1098 | Account Manipulation | Persistence | 4728/4732/4756 |
| T1543.003 | Windows Service | Persistence | EventCode=7045 |
| T1003.001 | LSASS Memory | Credential Access | Sysmon process access to lsass.exe |
| T1021.001 | Remote Desktop | Lateral Movement | 4624 LogonType=10 |
| T1021.002 | SMB/Windows Admin Shares | Lateral Movement | 4624 LogonType=3 + share access |
| T1560 | Archive Collected Data | Collection | 7zip/WinRAR process creation |
| T1053.005 | Scheduled Task | Persistence | Scheduled task events |
| T1547.001 | Registry Run Keys | Persistence | Sysmon registry events |

### Confidence Levels
- **High**: Multiple correlated events directly matching technique
- **Medium**: Single clear indicator
- **Low**: Circumstantial / needs more investigation

### MITRE Page Display
- Filter by tactic
- Show only observed techniques
- Each card: ID + Name + Tactic + Evidence Count + Confidence + Related Cases

---

## 8. PROJECT DIRECTORY STRUCTURE

```
threat-hunting-platform/
│
├── backend/                          # Django project
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── config/                       # Django settings
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── splunk/                       # Splunk integration
│   │   ├── __init__.py
│   │   └── service.py                # SplunkService class
│   ├── api/                          # Core API views/serializers
│   │   ├── __init__.py
│   │   ├── urls.py
│   │   └── views/
│   │       ├── dashboard.py
│   │       ├── search.py
│   │       └── health.py
│   ├── investigations/               # Cases, findings, evidence
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── tests.py
│   ├── detections/                   # Detection rules, hunt queries
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── fixtures/
│   │   │   └── hunt_queries.json     # Pre-built hunt library
│   │   └── tests.py
│   ├── mitre/                        # MITRE techniques
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── fixtures/
│   │       └── mitre_techniques.json # Pre-loaded techniques
│   └── reports/                      # Report generation
│       ├── generator.py
│       ├── views.py
│       └── urls.py
│
├── frontend/                         # React + Vite project
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css                 # Global dark SOC theme
│       ├── services/
│       │   ├── api.js                # Axios instance
│       │   ├── auth.js
│       │   ├── splunk.js
│       │   ├── cases.js
│       │   └── reports.js
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useSplunk.js
│       │   └── useCases.js
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.jsx
│       │   │   ├── Navbar.jsx
│       │   │   └── Layout.jsx
│       │   ├── dashboard/
│       │   │   ├── KPICard.jsx
│       │   │   ├── EventsChart.jsx
│       │   │   └── MITREHeatmap.jsx
│       │   ├── timeline/
│       │   │   └── Timeline.jsx
│       │   ├── investigation/
│       │   │   ├── CaseCard.jsx
│       │   │   └── EvidenceTable.jsx
│       │   ├── mitre/
│       │   │   └── TechniqueCard.jsx
│       │   └── shared/
│       │       ├── SeverityBadge.jsx
│       │       ├── StatusBadge.jsx
│       │       └── LoadingSpinner.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── ThreatHunting.jsx
│           ├── SPLLibrary.jsx
│           ├── Timeline.jsx
│           ├── Findings.jsx
│           ├── Cases.jsx
│           ├── CaseDetail.jsx
│           ├── HostInvestigation.jsx
│           ├── UserInvestigation.jsx
│           ├── MITREView.jsx
│           ├── ProcessTree.jsx
│           ├── Search.jsx
│           └── Reports.jsx
│
├── spl/                              # SPL query files (documentation)
│   ├── authentication/
│   │   ├── failed_logins.spl
│   │   ├── brute_force.spl
│   │   └── unusual_logon_time.spl
│   ├── powershell/
│   │   ├── encoded_powershell.spl
│   │   └── suspicious_parent.spl
│   ├── persistence/
│   │   ├── new_service.spl
│   │   └── scheduled_task.spl
│   ├── privilege/
│   │   └── group_membership.spl
│   ├── lateral_movement/
│   │   ├── rdp.spl
│   │   └── smb.spl
│   └── collection/
│       └── archive_creation.spl
│
├── datasets/
│   └── README.md                     # Dataset documentation
│
├── reports/
│   └── examples/                     # Example generated reports
│
├── docs/
│   ├── architecture.md
│   ├── installation.md
│   ├── splunk-setup.md
│   ├── hunting-guide.md
│   ├── mitre-mapping.md
│   └── investigation-guide.md
│
├── screenshots/                      # UI screenshots for README
│
├── .env.example
├── .gitignore
├── README.md
└── docker-compose.yml                # Django + React + PostgreSQL (later)
```

---

## 9. DEVELOPMENT PHASES

| Phase | Name | What Gets Built | Deliverable |
|---|---|---|---|
| **1** | Project Setup | Directory structure, Python venv, Django project scaffold, React+Vite scaffold, PostgreSQL setup, `.env` | Running "hello world" backends |
| **2** | Splunk Connectivity | `SplunkService`, health check endpoint, env config, connection test | `GET /api/health/` returns Splunk status |
| **3** | Dataset Ingestion | Identify & ingest real dataset into Splunk `threathunt` index | Events visible in Splunk search |
| **4** | Verify Real Events | Run verification SPL queries, document available event IDs/fields | Confirmed data available for hunting |
| **5** | Backend Foundation | Django models, migrations, serializers, JWT auth, core API endpoints | Auth works, models in DB |
| **6** | SPL Hunt Library | Pre-built hunt queries fixture, `/api/hunts/` endpoint, `/api/hunts/run/` | Can execute hunts via API |
| **7** | Frontend Dashboard | Dark SOC UI, sidebar, KPI cards, charts, event tables (using real Splunk data) | Dashboard renders real data |
| **8** | Investigation Cases | Case creation, case detail, analyst notes, evidence linking | Full case workflow functional |
| **9** | Timeline & Correlation | Event correlation by host/user/time, interactive timeline component | Timeline shows correlated events |
| **10** | MITRE Integration | Technique fixtures, evidence-based mapping, MITRE ATT&CK view page | MITRE page shows observed techniques |
| **11** | Report Generation | PDF/JSON report builder, report endpoint, report viewer page | Reports downloadable from cases |
| **12** | Security Hardening | Rate limiting, CORS, secure headers, input validation review | Security checklist satisfied |
| **13** | Testing | Backend: pytest-django tests; Frontend: Vitest tests | Test suites pass |
| **14** | Documentation | README, installation guide, hunting guide, screenshots | Portfolio-ready repo |

---

## 10. EXACT PREREQUISITES

Before Phase 1 begins, you need the following installed and working on your Windows 11 machine:

### ✅ Already Have
- [ ] **Splunk** — running at `localhost:8000` and `localhost:8089`
- [ ] **Windows 11** — development machine

### 🔧 Need to Install / Verify

| Tool | Required Version | Check Command | Install |
|---|---|---|---|
| Python | 3.10+ | `python --version` | python.org |
| pip | latest | `pip --version` | included with Python |
| Node.js | 18+ LTS | `node --version` | nodejs.org |
| npm | 9+ | `npm --version` | included with Node |
| PostgreSQL | 15+ | `psql --version` | postgresql.org |
| Git | any | `git --version` | git-scm.com |

### 🔑 Information to Gather About Your Splunk
Before Phase 2 (Splunk Connectivity), you'll need:
1. Splunk username (the one you log into `localhost:8000` with)
2. Splunk password
3. Confirm REST API port (default: 8089)
4. Whether SSL is enabled on port 8089

### 📦 Dataset to Decide
Before Phase 3 (Dataset Ingestion), choose one real dataset:

| Dataset | Format | Events | URL |
|---|---|---|---|
| **BOTS v3** (Boss of the SOC) | JSON | Windows, Sysmon, network | Splunk's official dataset |
| **EVTX-ATTACK-SAMPLES** | EVTX | Windows Security events | GitHub: sbousseaden |
| **OTRF Security Datasets** | JSON | Windows, Sysmon, ATT&CK mapped | securitydatasets.com |
| **Mordor Datasets** | JSON/EVTX | ATT&CK simulations | mordordatasets.com |

> **Recommendation**: Start with **OTRF/Mordor** datasets — they are ATT&CK mapped, available in JSON (easy Splunk ingestion), and have Windows Security + Sysmon events.

---

## ⚠️ IMPORTANT CONSTRAINTS (Reminders)

> [!IMPORTANT]
> - Splunk credentials MUST NEVER appear in frontend code or Git commits
> - MITRE mappings must be evidence-based — no auto-mapping
> - Dashboard statistics must come from real Splunk data once connected
> - Never fabricate events if dataset doesn't contain them
> - Label ALL demo/mock data clearly during development

> [!NOTE]
> Docker will NOT be introduced until after the basic application is working locally on Windows. Start simple: Python + Node + local PostgreSQL.

---

## ✅ CONFIRMATION CHECKLIST

Before I begin Phase 1, please confirm:

- [ ] You're okay with the tech stack (Django + React + PostgreSQL)
- [ ] You want to use Tailwind CSS for the dark SOC UI
- [ ] You have Python 3.10+ installed (or willing to install)
- [ ] You have Node.js 18+ installed (or willing to install)
- [ ] You have PostgreSQL installed, or want to start with SQLite for now
- [ ] You know your Splunk username/password (for Phase 2)
- [ ] You have a preference for the dataset (or want my recommendation)
- [ ] The project root should be `C:\Users\Acer\Desktop\Threat Hunting\`

**Reply "confirmed" or let me know any changes, and I'll begin Phase 1 immediately.**
