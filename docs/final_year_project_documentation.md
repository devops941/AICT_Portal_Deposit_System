# 🎓 FINAL YEAR PROJECT TECHNICAL DOCUMENTATION REPORT

---

**PROJECT TITLE:**  
# AICTE Security Deposit & FDR Lifecycle Management Portal  
### *A Statutory Digital Ledger & Multi-Tier Governance Ecosystem with AI OCR Intelligence*

**ACADEMIC DOMAIN:** Full-Stack Enterprise Software Engineering / FinTech Governance  
**TECHNOLOGY STACK:** MERN (MongoDB, Express.js, React.js, Node.js) with Strict TypeScript, Tailwind CSS, TanStack Query, Docker, and AI OCR Engine  
**CLIENT / REGULATORY BODY:** All India Council for Technical Education (AICTE), Ministry of Education, Government of India  

---

## 📑 TABLE OF CONTENTS

1. [Abstract](#1-abstract)
2. [Chapter 1: Introduction & Problem Statement](#chapter-1-introduction--problem-statement)
   - 1.1 Background & Domain Context
   - 1.2 Limitations of the Existing Manual System
   - 1.3 Objectives of the Proposed System
   - 1.4 Scope of the Project
3. [Chapter 2: System Requirements Specification (SRS)](#chapter-2-system-requirements-specification-srs)
   - 2.1 Hardware Requirements
   - 2.2 Software Requirements
   - 2.3 User Personas & Role Matrix
   - 2.4 Functional Requirements
   - 2.5 Non-Functional Requirements
4. [Chapter 3: System Architecture & Design](#chapter-3-system-architecture--design)
   - 3.1 High-Level Architecture (3-Tier & 6-Layer Pattern)
   - 3.2 Data Flow Diagrams (DFD Level 0, Level 1)
   - 3.3 Database Schema & Entity Relationships
   - 3.4 FDR State Machine Lifecycle
   - 3.5 End-to-End Sequence Diagram
5. [Chapter 4: Detailed Module Specifications](#chapter-4-detailed-module-specifications)
   - 4.1 Module 1: Authentication & Role-Based Access Control (RBAC)
   - 4.2 Module 2: Institutional Master & Directory
   - 4.3 Module 3: Security Deposit Norms & AICTE Deficit Engine
   - 4.4 Module 4: Fixed Deposit Receipt (FDR) Joint Pledging Registry
   - 4.5 Module 5: Two-Way Desk Scrutiny & Bank Lien Verification
   - 4.6 Module 6: Discrepancy Tracking & Resolution Workflow
   - 4.7 Module 7: Multi-Tier Executive Approval Engine
   - 4.8 Module 8: Automated Maturity Forecasting & Alerts Monitor
   - 4.9 Module 9: FDR Renewal & Tenure Extension Engine
   - 4.10 Module 10: Security Deposit Release, Penalty & NOC Issuance
   - 4.11 Module 11: AI-Powered OCR Document Intelligence Engine
   - 4.12 Module 12: Statutory Reports, Analytics & Audit Logging
6. [Chapter 5: Key Algorithms & Implementation Details](#chapter-5-key-algorithms--implementation-details)
7. [Chapter 6: Software Testing & Validation](#chapter-6-software-testing--validation)
8. [Chapter 7: Conclusion & Future Enhancements](#chapter-7-conclusion--future-enhancements)
9. [Appendix: Viva Voce & Technical Defense Q&A](#appendix-viva-voce--technical-defense-qa)

---

## 1. ABSTRACT

Technical education institutions operating under the regulatory purview of the **All India Council for Technical Education (AICTE)** are statutorily required to pledge security deposits in the form of Fixed Deposit Receipts (FDRs) jointly executed with the Member Secretary, AICTE. Managing over 10,000+ technical colleges and tens of thousands of paper-based deposit certificates across regional directorates creates severe operational bottlenecks, including unmonitored maturities, premature liquidation by commercial banks, lien-marking ambiguities, and prolonged delays during institutional closure or No Objection Certificate (NOC) issuance.

The **AICTE Security Deposit & FDR Lifecycle Management Portal** is a production-grade web application developed using the MERN stack with strict TypeScript typing, modern micro-component architecture, and AI-powered document intelligence. The platform automates the end-to-end statutory lifecycle: institutional intake-based requirement calculation, digital FDR submission, AI OCR verification of physical bank certificates, two-tier desk scrutiny, multi-level executive authorization, automated 30/60/90-day maturity alerts, automated renewals, and statutory lien release certificates. By replacing error-prone manual registers with an immutable digital audit ledger, the portal ensures 100% compliance transparency, eliminates loss of government funds, and provides real-time oversight for policymakers.

---

## CHAPTER 1: INTRODUCTION & PROBLEM STATEMENT

### 1.1 Background & Domain Context
Under the AICTE Approval Process Handbook (APH), technical institutions offering Engineering, Management, Pharmacy, Architecture, and Applied Arts programs must maintain an irrevocable security deposit with AICTE for a mandatory tenure (typically 8 to 10 years). The deposit protects student interests against institutional insolvency, infrastructural abandonment, or regulatory non-compliance.

The deposit is maintained as an FDR created in a Scheduled Commercial Bank in the **joint names of the Institution/Trust and the Regional Officer/Member Secretary, AICTE**, with an explicit tripartite bank lien endorsement prohibiting premature withdrawal without written authorization.

### 1.2 Limitations of the Existing Manual System
1. **Physical Document Vulnerability**: Heavy reliance on paper FDR physical certificates submitted by courier or in person, leading to risk of misplacement, wear, or document loss.
2. **Lack of Automated Maturity Alerts**: Commercial banks often auto-renew deposits at reduced default savings rates or auto-liquidate matured FDRs when institutions fail to track expiry dates manually.
3. **Lien Verification Bottlenecks**: Scrutiny officers lack instant verification mechanisms to confirm whether commercial bank branches have stamped non-encumbrance and joint lien clauses.
4. **Calculational Deficits**: When student intake or course offerings expand, calculating additional mandated deposit amounts across multiple colleges requires complex manual spreadsheet auditing.
5. **Slow NOC Clearance**: During program closure, extracting old deposit records for refund takes months of manual cross-referencing between regional and central offices.

### 1.3 Objectives of the Proposed System
- **Centralize Statutory Records**: Unify institutional profiles, requirements, and pledged instruments into a single secure relational-style document store.
- **Implement AI OCR Document Intelligence**: Automatically extract and validate bank name, FDR serial number, principal value, tenure, interest rate, and maturity date from scanned documents.
- **Enforce Hierarchical Multi-Tier Approval**: Guarantee that no deposit can be registered, renewed, or released without two-level scrutiny (Desk Scrutiny Officer ➔ Approving Director).
- **Proactive Expiry Prevention**: Provide automated countdown timers and email/dashboard notifications for FDRs approaching maturity (30, 60, and 90 days out).
- **Audit-Ready Financial Accountability**: Generate real-time statutory ledger reports, regional compliance ratios, and immutable audit logs.

### 1.4 Scope of the Project
- **In Scope**:
  - Web portal for Central AICTE Administrators, Scrutiny Officers, Approving Directors, Auditors, and Institutional Authorities.
  - Automated AICTE intake-to-deposit requirement calculation engine.
  - Two-way bank endorsement verification and discrepancy resolution workflow.
  - AI OCR verification engine with visual field confidence scoring.
  - Automated maturity monitoring, rolling renewals, and NOC release generation.
  - Production deployment architecture with Docker, Vercel, and cloud database connectivity.
- **Out of Scope**: Direct automated core-banking integration (SWIFT/SFMS API) with every individual commercial bank branch (simulated via verified bank endorsement certificate upload).

---

## CHAPTER 2: SYSTEM REQUIREMENTS SPECIFICATION (SRS)

### 2.1 Hardware Requirements
- **Development & Hosting Environment**:
  - Processor: Quad-Core Intel Core i5 / AMD Ryzen 5 or higher (Server: 2 vCPU minimum).
  - RAM: 8 GB minimum (16 GB recommended for concurrent builds and Docker).
  - Storage: 20 GB SSD storage minimum.
- **Client Device Requirements**:
  - Any standard PC, laptop, or tablet with modern browser support.
  - Screen resolution: 1280x720 minimum (Responsive up to 4K Ultra-wide).

### 2.2 Software Requirements
- **Operating System**: Cross-platform (Windows 10/11, Ubuntu 22.04 LTS, macOS).
- **Frontend Technologies**: React 18, TypeScript 5+, Vite 6, Tailwind CSS 3, Lucide React, TanStack Query v5, Axios.
- **Backend Technologies**: Node.js v20+, Express.js 4+, TypeScript, Zod Validation, Mongoose 8.
- **Database Engine**: MongoDB v6+ (Replica Set enabled for multi-document ACID transactions).
- **Document Processing**: Tesseract / Node Canvas / PDF Parser OCR pipeline.
- **Containerization & Deployment**: Docker, Docker Compose, Vercel Serverless.

### 2.3 User Personas & Role Matrix

| Role Code | Role Title | Key Permissions | Target Users |
| :--- | :--- | :--- | :--- |
| `SYSTEM_ADMINISTRATOR` | Central IT Super Admin | Full read/write, user provisioning, role permission mapping, system config | AICTE HQ IT Cell |
| `VERIFICATION_OFFICER` | Desk Scrutiny Officer | Scrutinize FDR uploads, check bank lien stamps, flag discrepancies | Regional Bureau Staff |
| `SENIOR_VERIFICATION_OFFICER`| Senior Scrutiny Officer | Review flagged discrepancies, escalate high-value deficit deposits | Bureau Deputy Director |
| `APPROVING_AUTHORITY` | Approving Director | Final approval or rejection of FDR pledges, renewals, and releases | Regional Director |
| `AUDITOR` | Statutory Auditor (FCA) | Read-only access to all ledgers, financial reconciliations, export reports | Internal & CAG Auditors |
| `INSTITUTION_ADMIN` | College Dean / Principal | Register college profile, view deficits, submit pledged instruments | College Leadership |
| `INSTITUTION_STAFF` | College Finance Officer | Upload bank certificates, submit renewal requests, track NOC status | College Accounts Dept |

### 2.4 Functional Requirements
- **FR-01 (Authentication)**: System must authenticate users via JWT tokens, supporting remember-me sessions and one-click role switching for evaluations.
- **FR-02 (Deficit Calculation)**: System must automatically calculate required security deposits based on institutional category, program types, and intake slabs.
- **FR-03 (FDR Registration)**: System must record bank details, FDR serial numbers, joint title confirmation, and file attachments up to 10 MB.
- **FR-04 (AI OCR Extraction)**: System must parse uploaded PDF/Image FDRs and highlight any discrepancy between user inputs and bank certificate values.
- **FR-05 (Two-Tier Approval)**: Pledges and releases must pass through a mandatory two-step workflow (Scrutinized ➔ Approved).
- **FR-06 (Maturity Monitoring)**: Scheduled cron jobs must identify FDRs maturing within 90 days and transition status flags to `MATURING_SOON`.
- **FR-07 (Release & NOC)**: System must enforce clearance validation, calculate applicable penalty deductions, and generate an official AICTE lien discharge letter.

### 2.5 Non-Functional Requirements
- **Performance**: API response times under 200ms for 95% of queries; client bundle load time under 1.5 seconds.
- **Security**: Passwords hashed with bcrypt (salt rounds = 10); JWT stored in secure storage; all endpoints protected by Zod input validation schemas to prevent SQL/NoSQL injection.
- **Scalability**: Stateless backend architecture capable of horizontal scaling across cloud containers.
- **Aesthetic Excellence**: High-contrast modern white theme with intuitive alignment, fluid micro-interactions, and accessible typography.

---

## CHAPTER 3: SYSTEM ARCHITECTURE & DESIGN

### 3.1 High-Level Architecture (3-Tier & 6-Layer Pattern)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PRESENTATION TIER (Frontend)                         │
│  React 18 SPA + Vite + TypeScript + Tailwind CSS                      │
│  TanStack Query State Management + Responsive Layout                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS REST JSON / JWT
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   APPLICATION TIER (Node.js / Express)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │    Routes    │──│ Controllers  │──│   Services   │──│ Repositories│ │
│  │ (Express/Zod)│  │ (HTTP Mapping│  │(Business Log)│  │ (Mongoose)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Middleware: AuthGuard (JWT), RBAC, ErrorHandler, AI OCR Pipeline  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Mongoose ODM / ACID Transactions
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      DATA TIER (Storage & Database)                    │
│  MongoDB Database (Institutions, Requirements, FDRs, Verifications)    │
│  Secure File Storage (Encrypted Document PDFs & Verification Scans)    │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow Diagram (DFD Level 0 - Context Level)

```
                     Institutional Profile & Pledged FDRs
  [ College Admin ] ──────────────────────────────────────────► ┌──────────────────┐
                    ◄────────────────────────────────────────── │                  │
                            Approval Status & Deficit Notice    │                  │
                                                                │  AICTE Security  │
                       Verification Checklist & Discrepancies   │   Deposit & FDR  │
  [ Scrutiny Officer ] ──────────────────────────────────────► │    Portal Core   │
                       ◄────────────────────────────────────── │      System      │
                            Pending Queue & Document Previews   │                  │
                                                                │                  │
                       Executive Authorizations & Rejections    │                  │
  [ Regional Director ] ─────────────────────────────────────► │                  │
                       ◄────────────────────────────────────── └──────────────────┘
                            Compliance Reports & NOC Letters
```

### 3.3 Database Schema & Entity Relationships

The database utilizes strict Mongoose schemas with relational object references:

1. **`Institution`**:
   - `_id`, `institutionId` (Unique AICTE Code, e.g., `INST-CEG-001`), `name`, `type` (`GOVERNMENT`, `PRIVATE_UNAIDED`, etc.), `state`, `district`, `approvalYear`, `status` (`ACTIVE`, `UNDER_SCRUTINY`, `DEFAULTER`).
2. **`Requirement`**:
   - `_id`, `requirementId`, `institutionId` (ref), `academicYear`, `mandatedAmount`, `totalPledgedAmount`, `deficitAmount`, `complianceStatus` (`COMPLIANT`, `DEFICIT`, `PENDING_REVIEW`).
3. **`FDR` (Fixed Deposit Receipt)**:
   - `_id`, `fdrId`, `institutionId` (ref), `requirementId` (ref), `fdrNumber`, `bankName`, `branchName`, `ifscCode`, `principalAmount`, `roi`, `tenureMonths`, `issueDate`, `maturityDate`, `jointAccountTitle`, `status` (`DRAFT`, `SUBMITTED`, `UNDER_VERIFICATION`, `VERIFIED`, `APPROVED`, `MATURING_SOON`, `RENEWED`, `RELEASED`).
4. **`Verification`**:
   - `_id`, `verificationId`, `fdrId` (ref), `officerId` (ref), `checklist` (JointNameVerified, LienMarked, AutoRenewChecked), `discrepancyNotes`, `status` (`RECOMMENDED`, `DISCREPANCY_RAISED`, `REJECTED`).
5. **`Approval`**:
   - `_id`, `approvalId`, `fdrId` (ref), `directorId` (ref), `decision` (`APPROVED`, `REJECTED`), `remarks`, `digitalStamp`, `timestamp`.
6. **`Release`**:
   - `_id`, `releaseId`, `institutionId` (ref), `fdrId` (ref), `reason` (`CLOSURE`, `EXCESS_DEPOSIT`), `penaltyAmount`, `netRefundAmount`, `nocCertificateNumber`.

---

## CHAPTER 4: DETAILED MODULE SPECIFICATIONS

### 4.1 Module 1: Authentication & Role-Based Access Control (RBAC)
- **Purpose**: Provides secure, authenticated entry with role enforcement.
- **Key Features**:
  - Modern White Theme Split Screen with high-resolution visual branding.
  - Interactive **Quick Demo Credentials** selector enabling single-click role switching for evaluation testing.
  - JWT token generation with 7-day persistence and automatic HTTP 401 token refresh/eviction.
  - Route-level middleware protecting sensitive routes based on permissions (`REQUIRE_VERIFIER`, `REQUIRE_APPROVER`, `REQUIRE_ADMIN`).

### 4.2 Module 2: Institutional Master & Directory
- **Purpose**: Centralized registry of all technical colleges.
- **Key Features**:
  - Filterable directory by state, university affiliation, and institution type.
  - Institutional detail modal showing historical deposit records, active staff users, and statutory documents.
  - Dynamic status indicators highlighting whether a college is in good standing or in deficit.

### 4.3 Module 3: Security Deposit Norms & AICTE Deficit Engine
- **Purpose**: Calculates statutory security deposit obligations.
- **Logic**:
  $$\text{Deficit Amount} = \max\left(0, \text{Mandated Deposit} - \sum \text{Approved FDR Amounts}\right)$$
- Automatically identifies colleges running in deficit and generates statutory alert notices.

### 4.4 Module 4: FDR Joint Pledging Registry
- **Purpose**: Intake and cataloging of Fixed Deposit Receipts.
- **Key Features**:
  - Form validation enforcing joint title convention: *"[College Name] & Member Secretary, AICTE"*.
  - Upload of original FDR certificates and bank confirmation letters.
  - Real-time calculation of maturity date based on issue date and tenure in months.

### 4.5 Module 5: Two-Way Desk Scrutiny & Bank Lien Verification
- **Purpose**: First-line statutory audit by AICTE Verification Officers.
- **Audit Checklist**:
  1. Joint account naming confirmed against AICTE guidelines.
  2. Commercial bank lien stamp and branch seal authenticated.
  3. Safe-custody deposit clause verified.
  4. Maturity date meets minimum required program tenure.

### 4.6 Module 6: Discrepancy Tracking & Resolution Workflow
- **Purpose**: Manages communication between AICTE and colleges when issues arise.
- **Key Features**:
  - Officers can pause verification and flag specific discrepancies (e.g., *"IFSC code mismatch"*, *"Lien stamp missing"*).
  - Institutions receive notifications, upload corrected certificates, and submit explanations.
  - Complete history maintained for forensic audit trails.

### 4.7 Module 7: Multi-Tier Executive Approval Engine
- **Purpose**: Final authorization tier for Regional Directors.
- **Key Features**:
  - Review of scrutiny notes and verification history.
  - One-click executive approval with automated cryptographic digital stamp generation.
  - Rejection with formal statutory remarks sent to institutional administration.

### 4.8 Module 8: Automated Maturity Forecasting & Alerts Monitor
- **Purpose**: Proactive monitoring of deposit expiration dates.
- **Alert Tiers**:
  - **Critical Alert (< 30 days)**: Red pulse indicator; automated notification sent to Regional Officer and College Dean.
  - **Impending Alert (30 - 60 days)**: Amber indicator; renewal documentation reminder.
  - **Upcoming Alert (60 - 90 days)**: Blue indicator; standard planning window.

### 4.9 Module 9: FDR Renewal & Tenure Extension Engine
- **Purpose**: Handles renewal processing without breaking statutory continuity.
- **Key Features**:
  - Parent-to-child FDR linkage tracking the original deposit through multiple renewals.
  - Revision of interest rates, updated certificate numbers, and new maturity dates.

### 4.10 Module 10: Security Deposit Release, Penalty & NOC Issuance
- **Purpose**: Statutory closure and deposit refund protocol.
- **Key Features**:
  - Audit checklist: No outstanding student complaints, infrastructural obligations cleared.
  - Penalty deduction calculator deducting unpaid statutory fines from the principal.
  - Generates downloadable official **AICTE Bank Lien Discharge Letter & NOC**.

### 4.11 Module 11: AI-Powered OCR Document Intelligence Engine
- **Purpose**: Automated parsing and validation of scanned FDR certificates.
- **Capabilities**:
  - Optical Character Recognition scanning uploaded PDFs and image receipts.
  - Automatic extraction of Bank Name, FDR Number, Amount, Issue Date, and Maturity Date.
  - Side-by-side verification comparing OCR extracted values against user-submitted form data with visual confidence badges.

### 4.12 Module 12: Statutory Reports, Analytics & Audit Logging
- **Purpose**: High-level administrative business intelligence.
- **Capabilities**:
  - Real-time KPI statistics: Total Value Pledged (₹ Crores), Compliant Institutions (%), Maturing Value.
  - Zone-wise and State-wise deposit distribution charts.
  - One-click CSV and Excel ledger export for parliamentary review and CAG audits.

---

## CHAPTER 5: KEY ALGORITHMS & IMPLEMENTATION DETAILS

### 5.1 AICTE Compliance Deficit Algorithm
```typescript
function calculateInstitutionCompliance(
  mandatedAmount: number,
  instruments: Array<{ amount: number; status: string }>
): { totalPledged: number; deficit: number; isCompliant: boolean } {
  // Only APPROVED instruments contribute to compliance
  const totalPledged = instruments
    .filter(inst => inst.status === 'APPROVED')
    .reduce((sum, inst) => sum + inst.amount, 0);

  const deficit = Math.max(0, mandatedAmount - totalPledged);
  const isCompliant = deficit === 0;

  return { totalPledged, deficit, isCompliant };
}
```

### 5.2 Automated Maturity Forecasting Logic
```typescript
function classifyMaturityUrgency(maturityDate: Date): 'CRITICAL' | 'WARNING' | 'UPCOMING' | 'HEALTHY' {
  const now = new Date();
  const diffDays = Math.ceil((new Date(maturityDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 30) return 'CRITICAL';      // Less than 30 days
  if (diffDays <= 60) return 'WARNING';       // 30 - 60 days
  if (diffDays <= 90) return 'UPCOMING';      // 60 - 90 days
  return 'HEALTHY';                           // More than 90 days
}
```

---

## CHAPTER 6: SOFTWARE TESTING & VALIDATION

### 6.1 Testing Methodology
- **Unit Testing**: Validation of calculation algorithms (deficit, maturity classification, date arithmetic) using Jest.
- **Integration Testing**: Verifying end-to-end API workflows with Supertest (Login ➔ Register FDR ➔ Scrutiny ➔ Approval).
- **Security Testing**: Role-based endpoint authorization checks ensuring a College Admin cannot approve an FDR or clear a discrepancy.

### 6.2 Key Test Cases Matrix

| Test Case ID | Test Scenario | Input Data | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | Valid Super Admin Login | `admin@gmail.com` / `Admin@123` | 200 OK, JWT returned, redirects to `/dashboard` | PASS |
| **TC-AUTH-02** | Invalid Password Attempt | `admin@gmail.com` / `WrongPass` | 401 Unauthorized, descriptive error message | PASS |
| **TC-RBAC-01** | College Admin accesses Approval API | POST `/v1/approvals` as `INSTITUTION_ADMIN` | 403 Forbidden, access denied | PASS |
| **TC-FDR-01** | Submit valid FDR with joint title | Amount: 35,00,000; Title: "CEG & Member Secretary AICTE" | 201 Created, status set to `SUBMITTED` | PASS |
| **TC-VERIF-01**| Scrutiny Officer flags missing lien | Checklist item `lienMarked: false` | Status changes to `DISCREPANCY_RAISED` | PASS |
| **TC-APPR-01** | Director approves recommended FDR | Click "Authorize Pledge" | Status set to `APPROVED`, digital stamp created | PASS |
| **TC-MAT-01**  | Detect FDR expiring in 20 days | Maturity Date: Current Date + 20 days | Tagged as `CRITICAL`, alerts triggered | PASS |

---

## CHAPTER 7: CONCLUSION & FUTURE ENHANCEMENTS

### 7.1 Conclusion
The **AICTE Security Deposit & FDR Lifecycle Management Portal** delivers an automated, secure, and auditable digital solution for national statutory governance. It replaces archaic paper-based record-keeping with an enterprise-ready MERN stack application featuring strict TypeScript verification, two-tier scrutiny, automated maturity monitoring, and AI OCR validation. The system guarantees financial transparency, eliminates deposit expiry losses, and streamlines the regulatory lifecycle for both institutions and AICTE officials.

### 7.2 Future Enhancements
1. **Direct Core Banking (SFMS / API) Integration**: Real-time two-way communication with scheduled banks via Reserve Bank of India (RBI) approved financial APIs for direct digital lien-marking.
2. **Blockchain Smart Contracts**: Recording approved pledges on a permissioned Hyperledger Fabric network for immutable, decentralized government auditability.
3. **Automated Digilocker Integration**: Pulling institutional registration certificates directly from the National Academic Depository (NAD) and Digilocker.

---

## APPENDIX: VIVA VOCE & TECHNICAL DEFENSE Q&A

**Q1: Why did you choose MongoDB instead of a traditional relational SQL database like MySQL or PostgreSQL?**  
*Answer:* While FDR transactions require relational integrity, institutional structures, fluctuating course categories, document metadata, checklist criteria, and AI OCR extraction payloads have dynamic, semi-structured schemas. MongoDB combined with Mongoose schemas provides strict typing while offering the flexibility to store complex audit logs and document payloads in single roundtrips. Additionally, multi-document ACID transactions in MongoDB 6+ guarantee consistency during status updates.

**Q2: How is security ensured during the verification and approval process?**  
*Answer:* Security is implemented via a multi-layered defense:
1. **Stateless JWT with bcrypt password hashing**: Passwords are never stored in plain text.
2. **Role-Based Access Control (RBAC)**: Enforced at both the Express router middleware layer and the React UI routing layer.
3. **Immutable Audit Stamps**: Every approval generates a digital signature hash containing the approver's ID, timestamp, and decision, preventing retroactive alterations.

**Q3: How does the system handle an FDR that is expiring soon?**  
*Answer:* A background cron scheduler evaluates the `maturityDate` against the current timestamp. FDRs are classified into 30, 60, and 90-day warning buckets. The dashboard flags these with color-coded badges, and automated renewal workflows allow colleges to upload renewed deposit receipts without losing their historical deposit compliance credit.

**Q4: What is the purpose of the 6-layer architecture in the backend?**  
*Answer:* The backend separates concerns into `Routes` ➔ `Controllers` ➔ `Services` ➔ `Repositories` ➔ `Validation (Zod)` ➔ `Types`. This ensures business logic (Services) is decoupled from HTTP transport protocols (Controllers) and database queries (Repositories), making the codebase modular, testable, and maintainable.

---

*Report prepared and compiled for Final Year Project Examination & Viva Voce Submission.*  
*Repository Source:* `https://github.com/devops941/AICT_Portal_Deposit_System`
