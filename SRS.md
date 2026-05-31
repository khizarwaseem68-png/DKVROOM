# DK Vroom — Software Requirements Specification (SRS)

**Project:** DK Vroom — Malaysia's Premium Automotive Marketplace Super App  
**Version:** 1.0  
**Date:** May 2026  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall System Architecture](#2-overall-system-architecture)
3. [User Roles & Relationships](#3-user-roles--relationships)
4. [Complete System Flow](#4-complete-system-flow)
5. [Module Specifications](#5-module-specifications)
6. [Payment Flow (Core to All Modules)](#6-payment-flow-core-to-all-modules)
7. [Notification System](#7-notification-system)
8. [Security & Auth System](#8-security--auth-system)
9. [Data Model & Entity Relationships](#9-data-model--entity-relationships)
10. [API Architecture](#10-api-architecture)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Role-Based Access Control Matrix](#12-role-based-access-control-matrix)
13. [Cross-Role Interaction Map](#13-cross-role-interaction-map)
14. [Non-Functional Requirements](#14-non-functional-requirements)

---

## 1. Introduction

### 1.1 Purpose

DK Vroom is a premium automotive marketplace super app designed for the Malaysian market. It serves as a single platform connecting customers who want to rent, buy, repair, insure, auction, or finance vehicles with verified dealers who provide these services. An admin panel governs the entire ecosystem, ensuring trust, safety, and quality control across all transactions.

### 1.2 Scope

The platform covers seven core automotive modules under one unified brand and user experience:

| Module | Malaysian Term | Description |
|---|---|---|
| **Rent** | Car Rental | Premium daily/weekly/monthly car rentals from verified dealers |
| **Buy & Sell** | Buy & Sell | Certified pre-owned and new vehicle purchases |
| **Repair & Workshop** | Repair & Workshop | Service bookings with trusted workshops and mechanics |
| **Insurance** | Insurance | Motor insurance quotes and policy purchases |
| **Auction** | Auction | Live bidding on running, used, accident, salvage, and rebuild vehicles |
| **Loan** | Loan | Car financing applications through partner banks |
| **Continue Loan** | Sambung Bayar | Takeover of existing car loans with bank approval |

### 1.3 Design Philosophy

The platform follows a **black and gold luxury branding** theme for the public-facing landing page, while internal dashboards (Dealer, Admin, Customer) use a clean, functional dark interface optimized for productivity. The entire system uses a **manual QR-code payment flow** with admin verification — no automatic payment gateways — to maintain control and trust in the Malaysian market context.

---

## 2. Overall System Architecture

### 2.1 Technology Stack

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  Next.js 16 (App Router) + React 19 + TypeScript    │
│  Tailwind CSS 4 + shadcn/ui + Zustand               │
│  Framer Motion + Lucide Icons + QRCode.react         │
├─────────────────────────────────────────────────────┤
│                    BACKEND                           │
│  Next.js API Routes (serverless functions)           │
│  Prisma ORM + PostgreSQL                             │
│  bcryptjs (password) + jose/JWT (auth tokens)        │
│  File System Storage (uploads)                       │
├─────────────────────────────────────────────────────┤
│                  MIDDLEWARE                          │
│  Security Headers (X-Frame, XSS, Content-Type)       │
│  Rate Limiting (60 req/min API, 10/15min Auth)       │
│  Input Sanitization & SQL Injection Prevention       │
│  CORS Configuration                                  │
├─────────────────────────────────────────────────────┤
│                   DATABASE                           │
│  PostgreSQL (server-based) — Prisma-managed          │
│  17 Models with full relational integrity            │
└─────────────────────────────────────────────────────┘
```

### 2.2 High-Level Data Flow

```
Customer/Browser
      │
      ▼
  Next.js Frontend (React SPA + App Router pages)
      │
      ├──► Landing Page (public, luxury themed)
      ├──► Module Pages (/rent, /buy, /repair, /insurance, /auction, /loan, /continue-loan)
      ├──► Auth Pages (/login, /register)
      ├──► Dashboard Pages (/dealer-dashboard, /admin-dashboard, /customer-dashboard)
      ├──► Car Detail (/car/[id])
      └──► Payment Flow (/payment)
      │
      ▼
  Next.js API Routes (/api/*)
      │
      ├──► Prisma ORM ──► PostgreSQL Database
      ├──► File Upload Handler (/api/upload)
      ├──► Auth Handlers (/api/auth/login, /register, /me)
      └──► Module-Specific APIs (cars, bookings, payments, loans, auctions, etc.)
```

---

## 3. User Roles & Relationships

### 3.1 Role Hierarchy

```
┌──────────────────────────────────────────┐
│              ADMIN (Super User)           │
│  Full platform control & oversight       │
│  Verifies dealers, approves cars,        │
│  verifies payments, manages disputes     │
│  Views all data across all roles         │
├──────────────────────────────────────────┤
│           DEALER (Service Provider)       │
│  Creates listings, manages bookings,     │
│  receives payments, responds to enquiries │
│  Types: used_car, rental, workshop,      │
│         insurance, auction, loan          │
├──────────────────────────────────────────┤
│           CUSTOMER (End User)            │
│  Browses vehicles, makes bookings,       │
│  uploads payment receipts, tracks status │
│  Applies for loans, bids on auctions     │
└──────────────────────────────────────────┘
```

### 3.2 How Roles Relate to Each Other

#### Customer ↔ Dealer Relationship
```
Customer                     Dealer
   │                           │
   │── Browses Dealer's Cars ──►│
   │                           │
   │── Makes Booking/Enquiry ──►│
   │                           │
   │── Uploads Payment ────────►│ (via Admin verification)
   │                           │
   │── Gets Contact Unlocked ──►│ (WhatsApp, Phone, Location)
   │                           │
   │── Communicates via WhatsApp│
   │                           │
   │── Completes Transaction ──►│
   │                           │
   │── Leaves Review/Rating ───►│
```

#### Admin ↔ Dealer Relationship
```
Admin                        Dealer
   │                           │
   │── Reviews Dealer Application◄── Registers as Dealer
   │                           │
   │── Verifies/Rejects Dealer ──►│
   │                           │
   │── Approves/Rejects Cars ────►│── Submits Car Listings
   │                           │
   │── Verifies Payments ────────►│── Receives Payouts
   │                           │
   │── Monitors Activity ────────►│
   │                           │
   │── Handles Disputes ─────────►│
```

#### Admin ↔ Customer Relationship
```
Admin                        Customer
   │                           │
   │── Verifies Payments ───────►│── Gets Booking Confirmed
   │                           │
   │── Manages Platform ────────►│── Uses All Modules
   │                           │
   │── Reviews Reports ─────────►│── Reports Issues
   │                           │
   │── Sends Notifications ─────►│── Receives Alerts
```

### 3.3 Dealer Sub-Types

The `dealerType` field determines which modules a dealer participates in:

| Dealer Type | Module Access | What They Can List |
|---|---|---|
| `used_car` | Buy & Sell | Cars for sale |
| `rental` | Rent | Cars for daily/weekly/monthly rental |
| `workshop` | Repair & Workshop | Workshop services (no car listings) |
| `insurance` | Insurance | Insurance quotes (no car listings) |
| `auction` | Auction | Auction vehicles |
| `loan` | Loan | Loan products (no car listings) |

A dealer can list Continue Loan vehicles regardless of type if they have active car listings with `type = 'continueLoan'`.

---

## 4. Complete System Flow

### 4.1 User Registration & Authentication Flow

```
START
  │
  ├──► User visits /login or /register
  │      │
  │      ├── LOGIN FLOW:
  │      │    ├── Select role (Customer / Dealer / Admin)
  │      │    ├── Enter email + password
  │      │    ├── POST /api/auth/login
  │      │    │    ├── Validate credentials (bcrypt compare)
  │      │    │    ├── Check account lock (5 failed attempts → 15min lock)
  │      │    │    ├── Generate JWT token (7-day expiry)
  │      │    │    └── Return { token, user }
  │      │    ├── Store token in localStorage
  │      │    ├── Set Zustand auth state
  │      │    └── Redirect by role:
  │      │         ├── Customer → Home page (/)
  │      │         ├── Dealer → Dealer Dashboard (/dealer-dashboard)
  │      │         └── Admin → Admin Dashboard (/admin-dashboard)
  │      │
  │      └── REGISTER FLOW:
  │           ├── Select role (Customer / Dealer)
  │           ├── Customer Registration:
  │           │    ├── Full name, phone, WhatsApp, email, password
  │           │    ├── Address, IC number, driving license
  │           │    ├── Upload IC document + driving license
  │           │    └── Agree to Terms
  │           ├── Dealer Registration:
  │           │    ├── Business name, dealer type, contact person
  │           │    ├── Phone, WhatsApp, email, password
  │           │    ├── Business address, SSM registration number
  │           │    ├── Upload SSM document
  │           │    ├── Bank details (name, account, holder)
  │           │    └── Agree to Terms + Dealer Agreement
  │           ├── POST /api/auth/register
  │           │    ├── Hash password (bcrypt, 12 rounds)
  │           │    ├── Create User record
  │           │    ├── If dealer: create Dealer record (verified = false)
  │           │    ├── Generate JWT token
  │           │    └── Return { token, user }
  │           ├── If Customer: redirect to Home
  │           └── If Dealer: redirect to Dealer Dashboard (limited access until verified)
  │
  └──► Auth persists via JWT in localStorage
       ├── Every API call includes Authorization: Bearer <token>
       ├── App Shell checks auth on page load (GET /api/auth/me)
       ├── Token expiry triggers auth:expired event → auto logout
       └── Logout clears token + Zustand state → redirect to /
```

### 4.2 Complete Booking-to-Completion Flow (All Modules)

This is the **core transaction flow** that applies to ALL seven modules:

```
CUSTOMER SIDE                              ADMIN SIDE                    DEALER SIDE
    │                                          │                              │
    │── 1. Browses module page ──────────────────────────────────────────────►│
    │   (Rent/Buy/Repair/Insurance/           │                              │
    │    Auction/Loan/ContinueLoan)            │                              │
    │                                          │                              │
    │── 2. Selects vehicle/service ──────────────────────────────────────────►│
    │   ┌─────────────────────────┐            │                              │
    │   │ Views: car details,     │            │                              │
    │   │ dealer info, price,     │            │                              │
    │   │ photos, features,       │            │                              │
    │   │ condition, terms        │            │                              │
    │   └─────────────────────────┘            │                              │
    │                                          │                              │
    │── 3. Clicks "Book Now" / "Enquire" ───────────────────────────────────►│
    │   │                                      │                              │
    │   ├── Creates Booking record             │                              │
    │   │   type: rent/sale/continueLoan/       │                              │
    │   │         auction/insurance/workshop    │                              │
    │   │   status: pending                     │                              │
    │   │                                      │                              │
    │   ├── Creates Payment record             │                              │
    │   │   method: qr_manual                   │                              │
    │   │   status: pending                     │                              │
    │   │   Generates QR reference              │                              │
    │   │                                      │                              │
    │   └── Redirects to /payment page         │                              │
    │                                          │                              │
    │── 4. Payment Page ───────────────────────────────────────────────────── │
    │   ┌─────────────────────────┐            │                              │
    │   │ Step 1: Booking created │            │                              │
    │   │ Step 2: QR generated    │            │                              │
    │   │ Step 3: Customer scans  │            │                              │
    │   │   QR with banking app   │            │                              │
    │   │ Step 4: Upload receipt  │            │                              │
    │   │ Step 5: Admin verifies  │◄───────────┤                              │
    │   └─────────────────────────┘            │                              │
    │                                          │                              │
    │── 5. Upload Payment Receipt ─────────────────────────────────────────── │
    │   ├── Select file (JPG/PNG/PDF, max 5MB)│                              │
    │   ├── POST /api/upload (file → server)   │                              │
    │   ├── PUT /api/payments/[id]             │                              │
    │   │   { receiptUrl, status: 'uploaded' } │                              │
    │   └── Payment status → "uploaded"        │                              │
    │                                          │                              │
    │   ...waiting for admin...                │                              │
    │                                          │                              │
    │                                          │── 6. Admin Reviews Receipt ──┤
    │                                          │   In Admin Dashboard:        │
    │                                          │   /admin-dashboard → Payments│
    │                                          │   Views receipt image        │
    │                                          │                              │
    │                                          │── 7a. VERIFY ───────────────┤
    │                                          │   Payment → "verified"       │
    │                                          │   Booking → "confirmed"      │
    │                                          │   contactUnlocked = true     │
    │                                          │   Notification → Customer    │
    │                                          │   Dealer payout calculated   │
    │                                          │                              │
    │                                          │── 7b. REJECT ───────────────┤
    │                                          │   Payment → "rejected"       │
    │                                          │   Reason recorded            │
    │                                          │   Notification → Customer    │
    │                                          │   Customer can re-upload     │
    │                                          │                              │
    │── 8. Contact Unlocked (if verified) ─────────────────────────────────── │
    │   ┌─────────────────────────┐            │                              │
    │   │ Dealer Phone: revealed  │            │                              │
    │   │ Dealer WhatsApp: click  │            │                              │
    │   │   to chat directly      │            │                              │
    │   │ Exact Location: shown   │            │                              │
    │   └─────────────────────────┘            │                              │
    │                                          │                              │
    │── 9. Customer ↔ Dealer Communication ──────────────────────────────────►│
    │   Via WhatsApp (external)                │                              │
    │   Or in-app chat (ChatMessage model)     │                              │
    │                                          │                              │
    │── 10. Transaction Completion ──────────────────────────────────────────►│
    │   Booking status → completed/active      │                              │
    │   Dealer receives payout                 │                              │
    │   Customer can leave review              │                              │
    │                                          │                              │
    └── END                                   │                              │
```

### 4.3 Dealer Verification Flow

```
NEW DEALER REGISTERS
    │
    ├── Dealer record created: verified = false
    ├── Dealer sees limited dashboard (cannot list cars yet)
    │
    ├── ADMIN reviews in /admin-dashboard → Dealers tab
    │   ├── Sees: company name, city, registration docs, bank details
    │   │
    │   ├── APPROVE:
    │   │   ├── Dealer.verified = true
    │   │   ├── Dealer.verifiedAt = now()
    │   │   ├── Dealer.verifiedBy = admin.id
    │   │   ├── Notification sent to Dealer
    │   │   └── Dealer can now list cars
    │   │
    │   └── REJECT:
    │       ├── Dealer.rejectedAt = now()
    │       ├── Dealer.rejectionReason = "reason text"
    │       ├── Notification sent to Dealer
    │       └── Dealer must re-apply or contact support
    │
    └── Dealer is now VERIFIED
        ├── Can add car listings (subject to admin approval)
        ├── Can receive bookings
        ├── Appears in "Verified Dealers" section
        └── Gets Verified badge on profile
```

### 4.4 Car Listing Approval Flow

```
DEALER ADDS CAR
    │
    ├── POST /api/cars (car data + photos)
    ├── Car record created: status = "pending"
    ├── Dealer sees listing with "Pending" badge
    │
    ├── ADMIN reviews in /admin-dashboard → Cars tab
    │   ├── Sees: brand, model, photos, price, type, dealer info
    │   │
    │   ├── APPROVE:
    │   │   ├── Car.status = "approved"
    │   │   ├── Car.approvedAt = now()
    │   │   ├── Car.approvedBy = admin.id
    │   │   ├── Notification sent to Dealer
    │   │   └── Car appears on public listing pages
    │   │
    │   └── REJECT:
    │       ├── Car.status = "rejected"
    │       ├── Car.rejectionReason = "reason text"
    │       ├── Notification sent to Dealer
    │       └── Dealer must edit and resubmit
    │
    └── Car is now LIVE on the platform
        ├── Visible in module pages (/rent, /buy, /auction, etc.)
        ├── Appears in search results
        ├── Appears in featured section (if featured = true)
        └── Customers can view and book
```

---

## 5. Module Specifications

### 5.1 Rent Module

**Route:** `/rent`  
**Dealer Type:** `rental`  
**Car Type:** `rent`

**Flow:**
1. Customer browses rental cars on `/rent` page
2. Filters by city, brand, price range, availability dates
3. Views car detail: daily/weekly/monthly prices, deposit, rental terms, delivery options
4. Selects dates → Creates Booking (type: `rent`, status: `pending`)
5. Payment flow (QR → receipt → admin verify)
6. Contact unlocked → coordinates pickup/delivery with dealer
7. Rental period begins → Dealer tracks in their dashboard
8. Rental completes → Booking status → `completed`

**Car Fields Specific to Rent:**
- `price` = daily rate (RM)
- `weeklyPrice` = weekly rate (RM)
- `monthlyPrice` = monthly rate (RM)
- `deposit` = security deposit (RM)
- `rentalTerms` = JSON string ({ minAge, minLicense, depositRequired, insuranceIncluded, mileageLimit, excessCharge })
- `pickupAvailable` = self-pickup option
- `deliveryAvailable` = delivery option
- `deliveryFee` = delivery charge (RM)
- `availableFrom` / `availableTo` = availability window

### 5.2 Buy & Sell Module

**Route:** `/buy`  
**Dealer Type:** `used_car`  
**Car Type:** `sale`

**Flow:**
1. Customer browses cars for sale on `/buy` page
2. Filters by brand, model, year, mileage, price range, city, condition
3. Views car detail: price, mileage, condition, features, service history
4. Clicks "Enquire" → Creates Booking (type: `purchase`, bookingFee applies)
5. Payment flow for enquiry fee (small amount, e.g., RM 200-500)
6. Contact unlocked → Customer negotiates directly with dealer
7. Sale completes off-platform → Dealer marks car as `sold`
8. Admin tracks sale in dashboard

**Car Fields Specific to Sale:**
- `price` = total sale price (RM)
- `bookingFee` = enquiry fee (RM)
- `mileage` = odometer reading (km)
- `condition` = new / used / certified

### 5.3 Repair & Workshop Module

**Route:** `/repair`  
**Dealer Type:** `workshop`

**Flow:**
1. Customer browses workshops on `/repair` page
2. Views workshop details: rating, services, operating hours, location
3. Fills appointment form:
   - Service type (general_service, engine_repair, bodywork, electrical, tire_battery, ac_service, others)
   - Vehicle details (brand, model, year, registration number)
   - Issue description + photos
   - Preferred date and time
4. Creates WorkshopAppointment (status: `pending`)
5. Payment flow (service deposit)
6. Dealer confirms appointment → status: `confirmed`
7. Work begins → status: `in_progress`
8. Work completes → status: `completed`, estimated cost confirmed

**Model:** `WorkshopAppointment` (separate from Car model — no car listing needed)

### 5.4 Insurance Module

**Route:** `/insurance`  
**Dealer Type:** `insurance`

**Flow:**
1. Customer fills insurance enquiry form:
   - Vehicle details (brand, model, year, registration number)
   - Coverage type (comprehensive, third_party, third_party_fire_theft)
   - Current insurer, NCD percentage
   - Personal details (age, driving experience, claims history)
2. Creates InsuranceEnquiry (status: `pending`)
3. Dealer/Agent reviews and provides quote:
   - `quotedPremium` = annual premium (RM)
   - `quoteExpiry` = quote validity date
   - status → `quoted`
4. Customer accepts → Payment flow for premium
5. Policy issued → status: `accepted`

**Model:** `InsuranceEnquiry` (separate from Car model)

### 5.5 Auction Module

**Route:** `/auction`  
**Dealer Type:** `auction`  
**Car Type:** `auction`

**Flow:**
1. Dealer lists auction vehicle with condition details
2. Customer browses auction listings with countdown timers
3. Customer places bid (must be higher than current highest bid)
4. Creates AuctionBid record
5. Real-time bid updates (outbid notifications)
6. Auction ends at `auctionEnd` datetime:
   - If highest bid >= `auctionReserve`: winner declared
   - If highest bid < `auctionReserve`: no sale (reserve not met)
7. Winner pays deposit via QR payment flow
8. Contact unlocked → coordinates vehicle inspection and purchase

**Auction Vehicle Condition Categories:**

| Category | Description | Running Status | Example |
|---|---|---|---|
| `running` | Fully operational | running | Used car in good condition |
| `used` | Normal wear and tear | running | Standard used vehicle |
| `accident` | Collision damage | non_running | Front-end collision |
| `wreck` | Severe structural damage | non_running | Side impact, flood damage |
| `salvage` | Salvage title | varies | Flood, theft recovery |
| `insurance_writeoff` | Written off by insurer | varies | Theft recovery with missing parts |
| `rebuild_project` | Intended for rebuild | running/non_running | Rear-end damage, good engine |

**Car Fields Specific to Auction:**
- `auctionStartBid` = minimum starting bid (RM)
- `auctionReserve` = reserve price (RM)
- `currentBid` = highest bid (RM)
- `auctionEnd` = auction end datetime
- `auctionActive` = is auction live
- `conditionCategory` = running / used / wreck / accident / salvage / insurance_writeoff / rebuild_project
- `damageDescription` = detailed damage description
- `runningStatus` = running / non_running
- `salvageStatus` = clean / salvage / rebuilt
- `repairEstimate` = estimated repair cost (RM)

### 5.6 Loan Module

**Route:** `/loan`  
**Dealer Type:** `loan`

**Flow:**
1. Customer fills loan application:
   - Loan amount, tenure (months)
   - Monthly income, employment type (employed/self-employed/government)
   - Employer name
   - Uploads: payslips, bank statements, EPF statement
2. Creates LoanApplication (status: `pending`, type: `loan`)
3. Dealer/Bank reviews application:
   - status → `reviewing`
4. Bank decision:
   - **Approved:** `approvedAmount`, `approvedTenure`, `interestRate`, `monthlyRepayment`
   - **Rejected:** `rejectionReason`
5. If approved, payment flow for processing fee
6. Loan disbursed → status: `disbursed`

**Model:** `LoanApplication` (type: `loan`)

### 5.7 Continue Loan (Sambung Bayar) Module

**Route:** `/continue-loan`  
**Car Type:** `continueLoan`

**Flow:**
1. Customer browses continue loan vehicles
2. Views details: monthly installment, remaining months, remaining balance, takeover amount, bank name, vehicle condition, required documents
3. Clicks "Enquire" → Creates ContinueLoanEnquiry (status: `pending`)
4. Customer uploads required documents:
   - IC (MyKad)
   - 3 months payslip
   - Bank statement (3 months)
   - EPF statement
   - Utility bill
   - Driving license
5. Agreement flow:
   - status → `agreement_sent` (dealer sends agreement)
   - status → `agreement_signed` (customer signs)
   - status → `deposit_paid` (customer pays deposit)
   - status → `handover_complete` (vehicle handed over)
6. Payment flow for deposit/takeover amount
7. Contact unlocked → coordinates handover

**Car Fields Specific to Continue Loan:**
- `monthlyInstallment` = monthly payment (RM)
- `remainingMonths` = months remaining
- `remainingBalance` = outstanding balance (RM)
- `takeoverAmount` = upfront takeover cost (RM)
- `bankName` = current financing bank
- `vehicleCondition` = detailed condition description
- `requiredDocs` = JSON array of required document names

---

## 6. Payment Flow (Core to All Modules)

### 6.1 Manual QR Payment System

DK Vroom uses a **manual QR-code-based payment system** — there is no automatic payment gateway integration. This design choice reflects the Malaysian market's preference for manual bank transfers, DuitNow QR, and eWallet payments where the customer pays externally and then proves payment by uploading a receipt.

### 6.2 Payment States

```
pending → uploaded → verified
                    └──► rejected → (re-upload possible)
```

| State | Meaning | Who Sets It | What Happens |
|---|---|---|---|
| `pending` | QR generated, awaiting payment | System (auto) | Customer sees QR code |
| `uploaded` | Receipt uploaded, awaiting review | System (auto on upload) | Admin sees pending verification |
| `verified` | Admin confirmed payment | Admin | Contact unlocked, booking confirmed |
| `rejected` | Admin rejected receipt | Admin | Customer can re-upload |
| `failed` | Payment failed (system error) | System | Retry available |
| `refunded` | Payment refunded | Admin | Refund reason recorded |

### 6.3 Payment Page Flow (Step-by-Step)

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: BOOKING SUBMITTED                              │
│  - Booking record created                               │
│  - Payment record created (status: pending)             │
│  - QR reference generated                               │
├─────────────────────────────────────────────────────────┤
│  Step 2: QR CODE GENERATED                              │
│  - Customer sees QR code on screen                      │
│  - QR contains: payment URL + booking ID + amount       │
│  - Payment amount clearly displayed in RM               │
│  - Supported methods shown:                             │
│    FPX, DuitNow, TNG eWallet, Boost, GrabPay,          │
│    Maybank2U, CIMB Clicks                               │
├─────────────────────────────────────────────────────────┤
│  Step 3: CUSTOMER PAYS EXTERNALLY                       │
│  - Opens banking app / eWallet                          │
│  - Scans QR code                                       │
│  - Pays exact amount                                   │
│  - Includes Booking ID as payment reference             │
├─────────────────────────────────────────────────────────┤
│  Step 4: RECEIPT UPLOADED                               │
│  - Customer selects receipt file (JPG/PNG/PDF, max 5MB) │
│  - File uploaded via POST /api/upload                   │
│  - Receipt URL saved to Payment record                  │
│  - Payment status → "uploaded"                          │
│  - Customer sees "Receipt Uploaded Successfully"        │
├─────────────────────────────────────────────────────────┤
│  Step 5: ADMIN VERIFICATION                             │
│  - Admin sees pending payments in dashboard             │
│  - Views receipt image/document                        │
│  - Cross-checks with bank statement                     │
│  - VERIFIES:                                           │
│    ├── Payment.status → "verified"                      │
│    ├── Booking.status → "confirmed"                    │
│    ├── Payment.contactUnlocked → true                   │
│    ├── Payment.verifiedAt → now()                       │
│    ├── Payment.verifiedBy → admin.id                    │
│    ├── Dealer payout calculated (amount - platformFee)  │
│    └── Notification sent to Customer                    │
│  - REJECTS:                                            │
│    ├── Payment.status → "rejected"                     │
│    ├── Payment.rejectionReason → "reason"               │
│    └── Customer can re-upload receipt                   │
├─────────────────────────────────────────────────────────┤
│  Step 6: CONTACT UNLOCKED (on verification)             │
│  - Customer sees dealer's phone number                  │
│  - Customer sees dealer's WhatsApp number               │
│  - "Chat on WhatsApp" button available                  │
│  - Exact pickup/visit location revealed                 │
│  - Customer and dealer coordinate directly              │
└─────────────────────────────────────────────────────────┘
```

### 6.4 Payment Types

| Payment Type | Used For | Amount Source |
|---|---|---|
| `booking` | Rental bookings | Rental total (daily rate x days) |
| `enquiry_fee` | Buy & Sell enquiries | `bookingFee` from car listing |
| `deposit` | Continue loan takeover | `takeoverAmount` or `deposit` |
| `auction_deposit` | Auction bid deposit | Percentage of bid amount |
| `insurance` | Insurance premium | `quotedPremium` |
| `workshop` | Workshop service | `estimatedCost` |
| `subscription` | Dealer subscription | Tier-based pricing |

### 6.5 Platform Fee & Dealer Payout

```
Total Payment Amount:  RM 1,000
Platform Fee (5%):    RM 50
Dealer Payout (95%):  RM 950

These are tracked per Payment record:
- Payment.amount = 1000
- Payment.platformFee = 50
- Payment.dealerPayout = 950
```

---

## 7. Notification System

### 7.1 Notification Model

Each notification has:
- `userId` — recipient
- `title` — notification heading
- `message` — notification body
- `type` — info, success, warning, error, payment, booking
- `link` — URL to relevant page (optional)
- `read` — boolean (default: false)

### 7.2 Notification Triggers

| Event | Recipient | Type | Example Message |
|---|---|---|---|
| Dealer registration approved | Dealer | success | "Your dealer account has been verified!" |
| Dealer registration rejected | Dealer | error | "Your dealer application was rejected: [reason]" |
| Car listing approved | Dealer | success | "Your BMW M4 listing has been approved" |
| Car listing rejected | Dealer | error | "Your listing was rejected: [reason]" |
| New booking received | Dealer | booking | "New rental booking for BMW M4 from Ahmad" |
| Payment verified | Customer | payment | "Your payment of RM 3,400 has been verified!" |
| Payment rejected | Customer | warning | "Your payment receipt was rejected. Please re-upload." |
| Contact unlocked | Customer | success | "Dealer contact details are now available" |
| Auction outbid | Customer | warning | "You have been outbid on Lamborghini Huracan EVO" |
| Loan approved | Customer | success | "Your loan application has been approved for RM 99,900" |
| Loan rejected | Customer | error | "Your loan application was rejected: Insufficient income" |

### 7.3 Notification Delivery

Notifications are stored in the database and delivered via:
1. **Bell icon dropdown** — Header component shows unread count badge
2. **Page-specific notifications** — Contextual alerts within dashboards
3. **Toast messages** — Real-time feedback for immediate actions

---

## 8. Security & Auth System

### 8.1 Authentication

| Aspect | Implementation |
|---|---|
| Password Storage | bcryptjs with 12 salt rounds |
| Token Format | JWT (HS256) via `jose` library |
| Token Expiry | 7 days |
| Token Storage | localStorage (`dkvroom_token`) |
| Auth Header | `Authorization: Bearer <token>` |
| Session Check | `GET /api/auth/me` on page load |
| Token Expiry Handler | `auth:expired` custom event → auto logout |

### 8.2 Account Lockout

- Maximum 5 failed login attempts
- 15-minute lockout after exceeding limit
- Auto-reset after lockout expires
- Tracked per user: `loginAttempts` and `lockedUntil` fields

### 8.3 Security Middleware

| Protection | Implementation |
|---|---|
| Rate Limiting (API) | 60 requests/minute per IP |
| Rate Limiting (Auth) | 10 requests/15 minutes per IP |
| SQL Injection | Pattern-based detection + parameterized queries (Prisma) |
| XSS | Input sanitization (HTML entity encoding) |
| CSRF | Same-origin policy + JWT Bearer tokens |
| Clickjacking | X-Frame-Options: DENY |
| MIME Sniffing | X-Content-Type-Options: nosniff |
| Referrer Leak | Referrer-Policy: strict-origin-when-cross-origin |
| Device Access | Permissions-Policy: camera=(), microphone=(), geolocation=() |
| CORS | Whitelisted origin (NEXT_PUBLIC_APP_URL) |

### 8.4 File Upload Security

- Maximum file size: 10MB (configurable via `MAX_FILE_SIZE_MB`)
- Allowed types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- Files stored outside public directory
- Served via `/api/serve-upload/[...path]` with auth check
- Unique filenames using UUID to prevent path traversal

---

## 9. Data Model & Entity Relationships

### 9.1 Entity Relationship Diagram (Text)

```
User (1) ────────► (0..1) Dealer
  │                       │
  │                       ├── (0..*) Car [via DealerListedCars]
  │                       ├── (0..*) Booking [via DealerBookings]
  │                       ├── (0..*) LoanApplication [via DealerLoans]
  │                       ├── (0..*) Payment [via DealerPayments]
  │                       ├── (0..*) ContinueLoanEnquiry [via DealerEnquiries]
  │                       ├── (0..*) WorkshopAppointment [via DealerWorkshopAppointments]
  │                       └── (0..*) InsuranceEnquiry [via DealerInsuranceEnquiries]
  │
  ├── (0..*) Car [via DealerCars — user who is dealer]
  ├── (0..*) Booking [via UserBookings]
  ├── (0..*) LoanApplication [via UserLoans]
  ├── (0..*) Payment [via UserPayments]
  ├── (0..*) ChatMessage [sent] + [received]
  ├── (0..*) Notification
  ├── (0..*) Review
  ├── (0..*) ContinueLoanEnquiry [via CustomerEnquiries]
  ├── (0..*) WorkshopAppointment
  ├── (0..*) InsuranceEnquiry
  ├── (0..*) AuctionBid
  └── (0..*) AuditLog

Car (1) ────────► (0..*) Booking
  │
  ├── (0..*) LoanApplication
  ├── (0..*) AuctionBid
  ├── (0..*) Review
  └── (0..*) ContinueLoanEnquiry

Booking (1) ────────► (0..*) Payment

ContinueLoanEnquiry (1) ────────► (0..*) Payment

WorkshopAppointment (1) ────────► (0..*) Payment

InsuranceEnquiry (1) ────────► (0..*) Payment
```

### 9.2 Complete Model List

| Model | Primary Key | Key Fields | Purpose |
|---|---|---|---|
| User | cuid | email, password, name, phone, role, verified | All platform users |
| Dealer | cuid | companyName, dealerType, verified, rating, bankDetails | Business profiles |
| Car | cuid | type, brand, model, year, price, status, photos | All vehicle listings |
| Booking | cuid | type, status, totalAmount, contactUnlocked | Reservations/enquiries |
| Payment | cuid | amount, method, status, receiptUrl, verifiedBy | Payment tracking |
| LoanApplication | cuid | type, amount, tenure, status, interestRate | Loan processing |
| AuctionBid | cuid | amount, status, isWinning | Auction bidding |
| ContinueLoanEnquiry | cuid | agreementStatus, depositAmount | Sambung Bayar flow |
| WorkshopAppointment | cuid | serviceType, status, estimatedCost | Repair bookings |
| InsuranceEnquiry | cuid | coverageType, status, quotedPremium | Insurance quotes |
| Review | cuid | rating (1-5), comment | Customer feedback |
| ChatMessage | cuid | message, type, read | User-dealer messaging |
| Notification | cuid | title, message, type, read | Alert system |
| AuditLog | cuid | action, resource, severity | Security audit trail |
| PlatformSetting | cuid | key, value | System configuration |

---

## 10. API Architecture

### 10.1 API Route Structure

```
/api
├── /auth
│   ├── POST /login          — Authenticate user, return JWT
│   ├── POST /register       — Create new user (customer/dealer)
│   └── GET  /me             — Get current user profile
│
├── /cars
│   ├── GET  /               — List cars (with filters)
│   ├── GET  /[id]           — Get car detail
│   ├── POST /               — Create car (dealer only)
│   ├── PUT  /[id]           — Update car (dealer only)
│   └── DELETE /[id]         — Delete car (dealer only)
│
├── /bookings
│   ├── GET  /               — List bookings
│   ├── GET  /[id]           — Get booking detail
│   ├── POST /               — Create booking
│   └── PUT  /[id]           — Update booking status
│
├── /payments
│   ├── GET  /               — List payments
│   ├── GET  /[id]           — Get payment detail
│   └── PUT  /[id]           — Update payment (upload receipt, verify, reject)
│
├── /loans
│   ├── GET  /               — List loan applications
│   ├── GET  /[id]           — Get loan detail
│   ├── POST /               — Create loan application
│   └── PUT  /[id]           — Update loan status
│
├── /auctions
│   ├── GET  /               — List auction cars
│   └── POST /               — Place bid
│
├── /continue-loan
│   ├── GET  /               — List continue loan enquiries
│   ├── GET  /[id]           — Get enquiry detail
│   ├── POST /               — Create enquiry
│   └── PUT  /[id]           — Update enquiry status
│
├── /workshops
│   ├── GET  /               — List workshops
│   └── POST /               — Create appointment
│
├── /insurance
│   ├── GET  /               — List insurance enquiries
│   └── POST /               — Create insurance enquiry
│
├── /notifications
│   ├── GET  /               — List user notifications
│   └── PUT  /               — Mark as read (single or all)
│
├── /upload
│   └── POST /               — Upload file (multipart/form-data)
│
├── /dealer
│   ├── GET  /cars           — Dealer's own car listings
│   ├── GET  /bookings       — Dealer's bookings
│   └── GET  /stats          — Dealer dashboard statistics
│
└── /admin
    ├── GET  /stats          — Platform-wide statistics
    ├── GET  /dealers        — All dealers (with filters)
    ├── PUT  /dealers        — Verify/reject dealer
    ├── GET  /cars           — All cars (with filters)
    ├── PUT  /cars           — Approve/reject car
    ├── GET  /payments       — All payments (with filters)
    └── PUT  /payments       — Verify/reject payment
```

### 10.2 Authentication on API Routes

All protected routes require:
```
Authorization: Bearer <JWT_TOKEN>
```

The `getUserFromRequest()` helper in `lib/auth/auth-utils.ts` extracts and verifies the JWT, then loads the user from the database with their dealer profile included.

### 10.3 Standard API Response Format

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

Error response:
```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## 11. Frontend Architecture

### 11.1 Page Routes (Next.js App Router)

| Route | Component | Access | Description |
|---|---|---|---|
| `/` | HomePage | Public | Landing page with hero, services, featured cars, dealers |
| `/login` | AuthPage (login mode) | Public | Login form with role selection |
| `/register` | AuthPage (register mode) | Public | Registration form (customer/dealer) |
| `/rent` | RentPage | Public | Browse rental cars |
| `/buy` | BuyPage | Public | Browse cars for sale |
| `/repair` | RepairPage | Public | Browse workshops + appointment form |
| `/insurance` | InsurancePage | Public | Insurance enquiry form |
| `/auction` | AuctionPage | Public | Browse auction vehicles + bidding |
| `/loan` | LoanPage | Public | Loan application form |
| `/continue-loan` | ContinueLoanPage | Public | Browse continue loan vehicles |
| `/car/[id]` | CarDetail | Public | Vehicle detail page |
| `/payment` | PaymentPage | Authenticated | QR payment flow |
| `/dealer-dashboard` | DealerDashboard | Dealer | Dealer management panel |
| `/admin-dashboard` | AdminDashboard | Admin | Admin control panel |
| `/customer-dashboard` | CustomerDashboard | Customer | Customer activity panel |

### 11.2 App Shell Architecture

```
RootLayout (layout.tsx)
  ├── Font loading (Plus Jakarta Sans, Playfair Display, Geist Mono)
  ├── AppShellWrapper (app-shell.tsx)
  │    ├── Auth check on mount (GET /api/auth/me)
  │    ├── Auth expiry listener (auto-logout)
  │    ├── Conditional Header (hidden on dashboard routes)
  │    └── Children (page content)
  └── Toaster (sonner — toast notifications)
```

The Header is hidden on dashboard routes (`/login`, `/register`, `/dealer-dashboard`, `/admin-dashboard`, `/customer-dashboard`) because those pages have their own internal navigation sidebars.

### 11.3 State Management (Zustand)

```
useAppStore
  ├── Navigation State
  │    ├── selectedCarId / selectedCarType
  │    └── (URL-based routing, no more view state)
  │
  ├── Search & Filters
  │    ├── searchQuery, selectedCity, filterType
  │    └── setSearch(), setCity(), setFilter()
  │
  ├── Auth State
  │    ├── isLoggedIn, user (UserState)
  │    ├── login(), logout(), checkAuth()
  │    └── Auto-redirect on logout
  │
  ├── UI State
  │    ├── showMobileMenu, loading
  │    └── toggleMobileMenu(), setLoading()
  │
  └── Booking Flow State
       ├── booking: { bookingId, bookingType, amount, paymentStatus, ... }
       ├── startBooking(), uploadReceipt(), verifyPayment()
       ├── rejectPayment(), resetBooking()
       └── Payment status tracked: none → pending → uploaded → verified
```

### 11.4 Dashboard Sidebar Navigation

**Dealer Dashboard:**
- Overview (stats, revenue, recent bookings)
- My Listings (filter by type, CRUD operations)
- Add Car (form with type-specific fields)
- Bookings (filter by status, view details)
- Enquiries (continue loan, workshop, insurance)
- Analytics (revenue charts, views, engagement)
- Payments (received payments, payout history)
- Settings (profile, bank details, operating hours)

**Admin Dashboard:**
- Overview (platform stats, pending counts, alerts)
- Dealers (search, filter by status, verify/reject)
- Cars (filter by status, approve/reject listings)
- Bookings (all bookings across platform)
- Loans (all loan applications)
- Payments (all payments, verify/reject receipts)
- Disputes (flagged transactions)
- Fraud (security alerts)
- Analytics (platform-wide metrics)
- Settings (platform configuration)

**Customer Dashboard:**
- Overview (recent activity, active bookings)
- My Bookings (track all booking statuses)
- My Loans (loan application tracking)
- My Auctions (active bids, won auctions)
- My Enquiries (insurance, workshop, continue loan)
- Payment History (all payments and receipts)
- Profile (personal info, documents, settings)

---

## 12. Role-Based Access Control Matrix

| Feature / Action | Customer | Dealer | Admin |
|---|:---:|:---:|:---:|
| Browse public pages | ✅ | ✅ | ✅ |
| View car listings | ✅ | ✅ | ✅ |
| Search & filter vehicles | ✅ | ✅ | ✅ |
| Register as customer | ✅ | — | — |
| Register as dealer | — | ✅ | — |
| Login (own role only) | ✅ | ✅ | ✅ |
| View own dashboard | ✅ | ✅ | ✅ |
| **Dealer Actions** | | | |
| Create car listing | — | ✅ | — |
| Edit own car listing | — | ✅ | — |
| Delete own car listing | — | ✅ | — |
| View own bookings | — | ✅ | ✅ (all) |
| View own payments/revenue | — | ✅ | ✅ (all) |
| Update dealer profile | — | ✅ | — |
| **Customer Actions** | | | |
| Create booking/enquiry | ✅ | — | — |
| Upload payment receipt | ✅ | — | — |
| View unlocked contacts | ✅ | — | — |
| Place auction bid | ✅ | — | — |
| Submit loan application | ✅ | — | — |
| Create insurance enquiry | ✅ | — | — |
| Create workshop appointment | ✅ | — | — |
| Leave review/rating | ✅ | — | — |
| **Admin Actions** | | | |
| Verify/reject dealers | — | — | ✅ |
| Approve/reject car listings | — | — | ✅ |
| Verify/reject payments | — | — | ✅ |
| View all platform data | — | — | ✅ |
| Manage disputes | — | — | ✅ |
| View audit logs | — | — | ✅ |
| Modify platform settings | — | — | ✅ |

---

## 13. Cross-Role Interaction Map

### 13.1 Complete Interaction Diagram

```
                         ┌──────────────────┐
                         │     CUSTOMER     │
                         │  (End Consumer)  │
                         └────────┬─────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
     ┌────────────────┐  ┌───────────────┐  ┌──────────────────┐
     │  RENT Module   │  │  BUY Module   │  │  CONTINUE LOAN   │
     │                │  │               │  │    Module        │
     │ Customer:      │  │ Customer:     │  │ Customer:        │
     │  Browse cars   │  │  Browse cars  │  │  Browse cars     │
     │  Select dates  │  │  Enquire      │  │  Submit enquiry  │
     │  Book rental   │  │  Pay fee      │  │  Upload docs     │
     │  Pay deposit   │  │  Get contact  │  │  Pay deposit     │
     │  Get contact   │  │  Negotiate    │  │  Sign agreement  │
     │  Pick up car   │  │  Buy car      │  │  Get contact     │
     │  Return car    │  │               │  │  Handover        │
     └───────┬────────┘  └───────┬───────┘  └────────┬─────────┘
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │     PAYMENT SYSTEM     │
                    │  QR Code → Receipt →   │
                    │  Admin Verification    │
                    └────────────┬───────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
           ┌────────────┐ ┌──────────┐ ┌──────────────┐
           │  AUCTION   │ │  LOAN    │ │  INSURANCE   │
           │  Module    │ │  Module  │ │  Module      │
           │            │ │          │ │              │
           │ Customer:  │ │ Customer:│ │ Customer:    │
           │  Browse    │ │  Apply   │ │  Enquire     │
           │  Place bid │ │  Upload  │ │  Get quote   │
           │  Pay if won│ │  docs    │ │  Pay premium │
           │  Get contact│ │ Wait for │ │  Get policy  │
           └─────┬──────┘ │  decision│ └──────┬───────┘
                 │        └────┬─────┘        │
                 │             │              │
                 └─────────────┼──────────────┘
                               │
                 ┌─────────────┼──────────────┐
                 │             │              │
                 ▼             ▼              ▼
        ┌──────────────────────────────────────────┐
        │              DEALER (Provider)            │
        │                                          │
        │  Types: used_car, rental, workshop,      │
        │         insurance, auction, loan          │
        │                                          │
        │  Actions:                                │
        │   ├── Create & manage car listings       │
        │   ├── Receive bookings & enquiries       │
        │   ├── View revenue & analytics           │
        │   ├── Respond to customer enquiries       │
        │   ├── Provide insurance quotes           │
        │   ├── Review loan applications           │
        │   └── Manage workshop appointments       │
        └──────────────────┬───────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────────┐
        │              ADMIN (Governor)             │
        │                                          │
        │  Oversight:                              │
        │   ├── Verify/reject dealer applications  │
        │   ├── Approve/reject car listings        │
        │   ├── Verify/reject payment receipts     │
        │   ├── Monitor platform activity          │
        │   ├── Handle disputes & fraud            │
        │   ├── View audit logs                    │
        │   ├── Manage platform settings           │
        │   └── View analytics & reports           │
        └──────────────────────────────────────────┘
```

### 13.2 How the Three Roles Connect Through Data

```
┌─────────┐       creates       ┌──────────┐      belongs to     ┌─────────┐
│ CUSTOMER │────────────────────►│ BOOKING  │◄────────────────────│ DEALER  │
└────┬─────┘                     └────┬─────┘                     └────┬────┘
     │                                │                                │
     │ pays for                       │ generates                     │ owns
     ▼                                ▼                                ▼
┌─────────┐      verifies     ┌──────────┐      approves     ┌─────────┐
│ PAYMENT │◄──────────────────│  ADMIN   │──────────────────►│  CAR    │
└─────────┘                   └──────────┘                   └─────────┘
     │                              │
     │ unlocks                      │ also oversees
     ▼                              ▼
┌─────────────┐             ┌──────────────┐
│ CONTACT     │             │ LOAN APP     │
│ (Phone/WA/  │             │ AUCTION BID  │
│  Location)  │             │ NOTIFICATION │
└─────────────┘             │ AUDIT LOG    │
                            └──────────────┘
```

**Key Insight:** Every transaction flows through three roles:
1. **Customer** initiates (books, pays, applies)
2. **Admin** verifies (approves dealer, approves car, verifies payment)
3. **Dealer** fulfills (provides the car, service, insurance, loan)

Without admin verification at each step, the platform would lack the trust layer that makes DK Vroom reliable for the Malaysian automotive market.

---

## 14. Non-Functional Requirements

### 14.1 Performance

- Landing page load: < 3 seconds (first contentful paint)
- API response time: < 500ms for standard queries
- Skeleton loading states on all data-fetching pages
- Image lazy loading for car photos
- Dynamic imports for heavy components (`next/dynamic` with `ssr: false`)

### 14.2 Security

- All API routes protected with JWT authentication
- Admin-only routes verify `role === 'admin'`
- Dealer-only routes verify `role === 'dealer'`
- File upload validation (type, size, content)
- Rate limiting on all endpoints
- Input sanitization on all user inputs
- Password hashing with bcrypt (12 rounds)
- Account lockout after 5 failed attempts

### 14.3 Usability

- Responsive design (mobile-first, breakpoints: sm/md/lg/xl)
- Dark theme with black & gold branding
- Accessible UI (shadcn/ui + Radix primitives)
- WhatsApp integration for direct dealer communication
- QR code payment familiar to Malaysian users
- Quick demo login buttons on login page for testing

### 14.4 Data Integrity

- Prisma ORM ensures referential integrity
- Cascade deletes on related records
- Audit log tracks all admin actions
- Payment records immutable after verification
- Booking status transitions follow defined state machines

### 14.5 Scalability Considerations

- PostgreSQL handles current scale; can scale vertically or migrate to managed Postgres
- Stateless JWT authentication (horizontal scaling friendly)
- File system uploads can migrate to S3/CloudFlare R2
- API route structure supports microservice extraction
- Zustand store can be replaced with server state (React Query) for larger scale
