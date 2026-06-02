# DK Vroom — Flow-Level QA Report

**Date:** June 2, 2026  
**Scope:** End-to-end business flow testing across all 7 modules  
**Methodology:** Real-world scenario simulation — testing that flows make sense from user perspective, pricing is consistent, data flows correctly between steps and across modules

---

## Executive Summary

After tracing every user flow from landing page through booking/payment to completion, **5 of 7 modules have broken payment flows** — they either skip payment entirely or never redirect to the payment page. Only Rent and Buy properly lead to QR payment. This means 71% of the platform's revenue-generating flows are incomplete.

| Module | Flow Completeness | Payment Flow | Key Issue |
|---|---|---|---|
| Rent | ✅ 90% | ✅ Working | Pricing logic skips weekly/monthly rates |
| Buy & Sell | ✅ 85% | ✅ Working | Enquiry fee hardcoded to RM 100 in UI |
| Auction | ⚠️ 60% | ⚠️ Partial | No auto-close, no real-time bidding |
| Repair/Workshop | ❌ 40% | ❌ Missing | No payment redirect after booking |
| Insurance | ❌ 35% | ❌ Missing | No payment redirect after enquiry |
| Loan | ❌ 40% | ❌ Missing | No payment redirect after application |
| Continue Loan | ⚠️ 55% | ❌ Missing | No deposit payment flow; agreement flow skips payment |

---

## 1. RENT FLOW AUDIT

### User Journey
```
Browse /rent → Filter/Search → View Car Detail → Select Dates → See Pricing → Book Now → Pay Deposit via QR → Upload Receipt → Admin Verifies → Contact Unlocked → Pick Up Car → Return Car
```

### Findings

#### FLOW-001: Weekly/Monthly Pricing Is Display-Only — Never Applied
**Severity: High**  
**Location:** `src/components/car-detail.tsx:619-643`, `src/app/api/bookings/route.ts:223`

The car detail page beautifully shows Daily / Weekly / Monthly rates. But when the user selects 7+ days, the booking API calculates:
```
totalAmount = car.price * days   // Always uses daily rate!
```
It **never** checks if the rental period qualifies for weekly or monthly pricing. So renting for 7 days at RM 200/day = RM 1,400, even if the weekly rate (displayed on the same page) is RM 1,100.

**Real-world user expectation:** "I see Weekly = RM 1,100, and I'm renting for 7 days. Why am I charged RM 1,400?"

**Fix needed:** Booking API must apply weekly rate when days >= 7, monthly when days >= 30.

#### FLOW-002: Booking Amount Shown to User vs. Actual Amount Charged Are Different
**Severity: Medium**  
**Location:** `src/components/car-detail.tsx:1065`

When user clicks "Book Now" for rent:
```javascript
amount = car.deposit || car.price   // This is shown as "Amount to Pay"
```

But then the API calculates:
```javascript
totalAmount = car.price * days      // This is what's actually charged
```

If deposit = RM 500 and daily rate = RM 200 for 3 days, user sees "Pay RM 500" but the booking is created with RM 600. The payment page shows RM 600 (from the API response), creating confusion.

#### FLOW-003: No Visual Availability Calendar
**Severity: Medium**  
**Location:** `src/components/car-detail.tsx:1209-1236`

Date selection uses plain `<input type="date">` with no visual calendar showing booked dates. The API does check for date conflicts, but the user has no way to know which dates are already booked until they try and get a 409 error.

#### FLOW-004: No Delivery/Pickup Address Collection
**Severity: Low**  
**Location:** `src/components/car-detail.tsx`

The UI shows "Self Pickup Available" and "Delivery Available" (with fee), but never asks the user for their preferred pickup location or delivery address. After payment, the user has to coordinate this via WhatsApp — no established flow within the app.

#### FLOW-005: Estimated Total Calculation Missing Deposit
**Severity: Low**  
**Location:** `src/components/car-detail.tsx:1251-1257`

The "Estimated Total" shown during date selection is just `daily rate × days`. It doesn't include the security deposit, which could be significant (sometimes equal to 1 month's rental). The actual payment amount might be `(daily rate × days) + deposit`, but the user only sees `daily rate × days`.

---

## 2. BUY & SELL FLOW AUDIT

### User Journey
```
Browse /buy → Filter/Search → View Car Detail → See Price → Send Enquiry → Pay RM X Booking Fee via QR → Upload Receipt → Admin Verifies → Contact Unlocked → Negotiate with Dealer → Buy off-platform → Dealer marks as Sold
```

### Findings

#### FLOW-006: Enquiry Fee Hardcoded to RM 100 in UI — But API Uses Car-Specific Fee
**Severity: High**  
**Location:** `src/components/car-detail.tsx:533, 1068, 1389`

The UI everywhere says "RM 100 enquiry fee":
- SalePricingCard: `"Send an enquiry with a RM 100 booking fee"`
- Under CTA: `"RM 100 enquiry fee required to unlock dealer contact"`
- handlePrimaryCta: `amount = 100`

But the API correctly uses: `totalAmount = car.bookingFee || car.deposit || car.price` (line 225 of bookings route)

If a dealer has set bookingFee = RM 500, the user sees RM 100 everywhere but is charged RM 500. The amounts will always mismatch unless the car's bookingFee happens to be RM 100.

#### FLOW-007: Dealer Cannot Mark Car as Sold in the Flow
**Severity: Medium**  
**Location:** No dealer flow for marking sold

SRS says: "Sale completes off-platform → Dealer marks car as sold → Admin tracks sale in dashboard." There is no UI or API for a dealer to mark a car as sold. The car's `status` field has a `sold` value in constants, but no flow sets it.

#### FLOW-008: Marketplace Disclaimer Missing from Sale Detail Page
**Severity: Low**  
**Location:** `src/components/car-detail.tsx`

Continue Loan detail shows a MarketplaceDisclaimer. Rent shows a LockedContactNotice. Sale shows neither. Given that sales happen off-platform, this disclaimer is important for legal protection.

---

## 3. AUCTION FLOW AUDIT

### User Journey
```
Browse /auction → Filter by Condition → View Car Detail → See Auction Details → Place Bid → Get Outbid Notifications → Win → Pay 10% Deposit via QR → Upload Receipt → Admin Verifies → Contact Unlocked → Inspect Vehicle → Complete Purchase
```

### Findings

#### FLOW-009: No Automatic Auction Close — Auctions Never End
**Severity: Critical**  
**Location:** No server-side scheduler

The `auctionEnd` field exists, and the UI shows a countdown timer. But there is **no server-side cron job, scheduler, or trigger** to automatically close auctions when `auctionEnd` passes. The `auctionActive` field is never toggled to false automatically. Without manual admin intervention, every auction runs forever.

#### FLOW-010: No Bid Increment Rules
**Severity: Medium**  
**Location:** `src/app/api/auctions/route.ts`

There is no minimum bid increment. A user can bid RM 1 over the current highest bid on a RM 500,000 car. In real-world auctions, there are standard increment rules (e.g., 5-10% of current bid).

#### FLOW-011: No Real-Time Bidding — Uses 15s Polling
**Severity: Medium**  
**Location:** No WebSocket/SSE implementation

Bids are placed via HTTP POST and the auction page refreshes data periodically. In a competitive auction scenario, 15-second polling means users can easily be outbid without knowing for up to 15 seconds. No real-time bid updates.

#### FLOW-012: Winner Declaration Logic Not Automated
**Severity: High**  
**Location:** No automated winner selection

The SRS says: "Auction ends at auctionEnd: if highest bid >= auctionReserve, winner declared." There is no automated logic to:
1. Detect when auction has ended
2. Compare highest bid to reserve price
3. Declare a winner
4. Notify the winner
5. Initiate the payment flow for the deposit

---

## 4. REPAIR & WORKSHOP FLOW AUDIT

### User Journey (Expected)
```
Browse /repair → Select Service Category → Browse Workshops → Select Workshop → Fill Appointment Form → Pay Service Deposit via QR → Upload Receipt → Admin Verifies → Dealer Confirms → Work In Progress → Completed
```

### User Journey (Actual)
```
Browse /repair → Select Service Category → Browse Workshops → Select Workshop → Fill Appointment Form → Create Appointment → DONE. No payment.
```

### Findings

#### FLOW-013: Payment Flow Completely Missing
**Severity: Critical**  
**Location:** `src/components/repair-page.tsx:278-302`

After `handleBookAppointment` creates the appointment, the function just resets the form and shows nothing. There is:
- No call to `startBooking()` in the store
- No redirect to `/payment`
- No QR code generation
- No receipt upload
- No admin verification

The appointment is created with status `pending` and stays there forever. The dealer never gets paid, and the customer's booking is never confirmed.

**Fix needed:** After creating appointment, redirect to payment page with the appropriate amount for the service deposit.

#### FLOW-014: Missing Required Form Fields
**Severity: Medium**  
**Location:** `src/components/repair-page.tsx:543-607`

SRS specifies these fields for the appointment form:
- Service type ✅
- Vehicle details (brand, model, year, registration number) ❌ (model, year, registration missing)
- Issue description + photos ❌ (only text notes, no photo upload)
- Preferred date and time ✅ (date only, no time)

A repair shop needs to know the vehicle model, year, and registration number to prepare parts. The current form cannot function for real-world bookings.

#### FLOW-015: Dealer Cannot Provide Estimated Cost
**Severity: Medium**  
**Location:** No dealer-side appointment management flow

The SRS mentions `estimatedCost` field on WorkshopAppointment, but there's no dealer UI to:
- View incoming appointments
- Confirm or reject appointments
- Provide estimated cost
- Update work status (in_progress → completed)

---

## 5. INSURANCE FLOW AUDIT

### User Journey (Expected)
```
Browse /insurance → Fill Enquiry Form → Get Quote → Pay Premium via QR → Upload Receipt → Admin Verifies → Get Policy
```

### User Journey (Actual)
```
Browse /insurance → Fill Enquiry Form → Click "Get Protected Now" → Create Enquiry → DONE. No payment.
```

### Findings

#### FLOW-016: No Payment Flow After Quote Acceptance
**Severity: Critical**  
**Location:** `src/components/insurance-page.tsx:216-235`

The `handleCreateEnquiry` function creates an InsuranceEnquiry record but:
- No redirect to payment page
- No amount stored for payment
- No QR code generation
- No receipt upload

The user calculates a premium, sees "Estimated Annual Premium RM 3,240", clicks "Get Protected Now", and... nothing happens (the page just silently submits). The user has no way to actually pay and get the policy.

**Fix needed:** After creating the enquiry (or once the dealer provides a quote), redirect to payment page with the premium amount.

#### FLOW-017: Missing Form Fields
**Severity: Medium**  
**Location:** `src/components/insurance-page.tsx:331-417`

SRS specifies:
- Vehicle details (brand, model, year, registration) ❌ (registration number missing)
- Coverage type ✅
- Current insurer ❌
- NCD percentage ✅
- Personal details (age, driving experience, claims history) ❌ (driving experience, claims history missing)

Without knowing the current insurer and claims history, insurers cannot provide accurate quotes.

#### FLOW-018: No Way to Track Quote Status
**Severity: Medium**  
**Location:** `src/components/insurance-page.tsx`

After submitting the enquiry, there's no way for the user to:
- See that their enquiry was submitted
- Track whether a dealer has provided a quote
- See the quoted premium vs. their estimate
- Accept or reject the quote
- Pay the premium

The entire post-enquiry flow is missing.

---

## 6. LOAN FLOW AUDIT

### User Journey (Expected)
```
Browse /loan → Use Loan Calculator → Click "Apply Now" → Fill Application (3 steps) → Upload Documents → Submit → Bank Reviews → Approved/Rejected → Pay Processing Fee via QR → Loan Disbursed
```

### User Journey (Actual)
```
Browse /loan → Use Loan Calculator → Click "Apply Now" → Fill Application (3 steps) → Upload Documents → Submit → DONE. No processing fee payment.
```

### Findings

#### FLOW-019: No Processing Fee Payment Flow
**Severity: Critical**  
**Location:** `src/components/loan-application.tsx:220-256`

The SRS says: "If approved, payment flow for processing fee." But:
- The submission just creates the loan application
- No redirect to payment
- No QR code
- The approval flow isn't connected to payment at all

Even if the loan is approved, there's no way for the customer to pay the processing fee through the app.

#### FLOW-020: No Loan Application Status Tracking in Dashboard
**Severity: Medium**  
**Location:** `src/components/loan-application.tsx:832-938`

The loan tracking tab exists within the loan application page, but there's no way to see loan application status from the main Customer Dashboard (`/customer-dashboard`). The SRS specifies "My Loans" as a section in the customer dashboard.

#### FLOW-021: Interest Rate Used in Calculator vs. Monthly Estimate Inconsistency
**Severity: Low**  
**Location:** `src/components/loan-application.tsx:325`

The calculator on the loan page uses the selected interest rate (3.5%, 4.0%, or 4.5%). But the monthly estimate on the loan application page (step 2) hardcodes 3.5%:
```javascript
estimatedMonthly = ... / (1 + 0.035 * Number(loanTenure))
//                                 ^^^^ hardcoded 3.5%
```

If user selected 4.5% on the calculator, the application form will show a different (lower) monthly payment.

#### FLOW-022: No Dealer/Bank Review UI 
**Severity: High**  
**Location:** No dealer-side loan review flow

The SRS says: "Dealer/Bank reviews application → status changes to reviewing → Bank decision (approved/rejected)." There is no dealer or admin UI to:
- View pending loan applications
- Review uploaded documents
- Change application status
- Set approved amount, tenure, interest rate, monthly repayment

---

## 7. CONTINUE LOAN (SAMBUNG BAYAR) FLOW AUDIT

### User Journey (Expected)
```
Browse /continue-loan → View Car Detail → Click "Submit Enquiry" → Fill Form → Upload Documents → Agreement Sent → Agreement Signed → Pay Deposit via QR → Upload Receipt → Admin Verifies → Contact Unlocked → Handover
```

### User Journey (Actual)
```
Browse /continue-loan → View Car Detail → Click "Submit Enquiry" → Fill Form → Upload Documents → Confirm Agreement → DONE. No deposit payment.
```

### Findings

#### FLOW-023: No Deposit/Takeover Payment Flow
**Severity: Critical**  
**Location:** `src/components/continue-loan-enquiry.tsx:278-295`

The SRS clearly states: "Payment flow for deposit/takeover amount" and the status progression is: agreement_sent → agreement_signed → **deposit_paid** → handover_complete.

The actual flow goes: form → documents → agreement → **submitted**. The `handleConfirmAgreement` function just calls `continueLoanApi.update({ status: 'agreement', agreementAccepted: true })` and moves to the "submitted" phase. There is:
- No redirect to payment page
- No QR code for the takeover amount
- No receipt upload
- The `deposit_paid` status is never set

The takeover amount (potentially RM 5,000 - RM 50,000) is never collected through the platform.

#### FLOW-024: Agreement Flow Doesn't Match SRS State Machine
**Severity: Medium**  
**Location:** `src/components/continue-loan-enquiry.tsx`

SRS state machine: `agreement_sent → agreement_signed → deposit_paid → handover_complete`
Actual implementation: Just a single "Confirm & Accept Agreement" button that bypasses all intermediate states.

Missing:
- `agreement_sent` — No notification that the owner has sent an agreement
- `agreement_signed` — The agreement is just accepted once, no two-party signing
- `deposit_paid` — No payment step
- `handover_complete` — No handover confirmation

#### FLOW-025: Continue Loan Used Car Model Instead of Separate Enquiry Model
**Severity: Medium**  
**Location:** `src/app/continue-loan/page.tsx`, `src/app/api/continue-loan/route.ts`

The SRS shows `ContinueLoanEnquiry` as a separate model from `Car`, with its own flow. But the `/continue-loan` listing page reuses the `CarListing` component with `type="continueLoan"`. The flow then uses `ContinueLoanEnquiry` for the actual transaction. This creates a disconnect — the car listing and the enquiry are using different models, and the relationship between a continue-loan car listing and its enquiries may not be coherent.

---

## 8. CROSS-MODULE & SYSTEMIC FLOW ISSUES

### Findings

#### FLOW-026: 5 of 7 Modules Never Reach Payment Page
**Severity: Critical**  
**Location:** All non-rental/buy flows

Only Rent and Buy & Sell properly redirect to the payment page. The other 5 modules:
- Auction: Gets partial (only for deposit after winning, but winner is never auto-declared)
- Repair/Workshop: ❌ No payment
- Insurance: ❌ No payment
- Loan: ❌ No payment
- Continue Loan: ❌ No payment

This means **71% of the platform's services cannot collect payment through the system.**

#### FLOW-027: Contact Unlock Only Works Through Booking Model
**Severity: High**  
**Location:** `src/components/car-detail.tsx:1003-1009`

Contact unlock is gated by: `booking.contactUnlocked === true && booking.paymentStatus === 'verified'`. This only works for Rent and Sale bookings. For Auction, Repair, Insurance, Loan, and Continue Loan, the booking model isn't used centrally enough, so contact may remain locked even after legitimate payments.

#### FLOW-028: No Way to Return to Payment Page If Closed
**Severity: High**  
**Location:** `src/components/payment-page.tsx`

The warning says "Do NOT close this page until you have uploaded your payment receipt." But if the user does close it, there's no way to get back to the payment page. The payment page is accessed via URL `/payment`, which reads from Zustand state. If the page is refreshed or closed, the Zustand state resets and the user sees a blank payment page.

**Fix needed:** Store current booking/payment ID in URL params so the payment page can reload state from the API.

#### FLOW-029: Dashboard Navigation Doesn't Reflect Payment Status
**Severity: Medium**  
**Location:** `src/components/admin-dashboard.tsx`, `src/components/dealer-dashboard.tsx`

The dashboards have tabs for Bookings, Payments, etc., but there's no way to:
- See bookings that have payment pending vs. verified vs. rejected in the main overview
- Navigate directly to a booking's payment page from the dashboard
- See aggregated revenue broken down by module

#### FLOW-030: Search Filters Across Modules Are Inconsistent
**Severity: Low**

Rent has price filters as `/day` ranges (Under RM 200/day, RM 200-800/day, Above RM 800/day). Buy has fixed price ranges (Under RM 100K, etc.). But there's no filter for:
- Weekly/monthly rental pricing (for Rent)
- Auction reserve price (for Auction)
- Monthly installment range (for Continue Loan)

---

## 9. REAL-WORLD SCENARIO TESTING

### Scenario 1: Customer Rents a BMW 5-Series for 10 Days

**Expected flow:**
1. Browse /rent → see BMW 5-Series at RM 350/day, RM 2,100/week
2. Select 10-day rental period
3. See weekly rate applied (1 week @ RM 2,100 + 3 days @ RM 350 = RM 3,150)
4. Pay deposit + rental fee = RM 3,150 + RM 1,000 deposit = RM 4,150
5. Upload receipt → admin verifies → contact unlocked
6. Coordinate pickup → pick up car → return after 10 days

**Actual flow:**
1. ✅ Browse, select dates
2. ⚠️ See "Estimated Total" = RM 350 × 10 = RM 3,500 (weekly rate ignored)
3. ❌ Amount to pay = deposit only (RM 1,000) shown on CTA, but total booking = RM 3,500 charged
4. ✅ Payment page works
5. ⚠️ Amount charged = RM 3,500, but user expected different amount

**Result:** User is overcharged RM 350 vs. expected weekly pricing.

### Scenario 2: Customer Wants to Buy a Toyota Camry

**Expected flow:**
1. Browse /buy → see Toyota Camry at RM 148,000
2. Click "Send Enquiry" → pay RM 500 booking fee (as set by dealer)
3. Get contact → negotiate → buy off-platform

**Actual flow:**
1. ✅ Browse, see car
2. ⚠️ See "RM 100 enquiry fee" everywhere, but charged RM 500 if dealer set different
3. ❌ No way for dealer to mark car as sold
4. ❌ No marketplace disclaimer for legal protection

**Result:** Amount confusion; no transaction completion tracking.

### Scenario 3: Customer Needs Engine Repair for Honda Civic

**Expected flow:**
1. Browse /repair → select "Engine Repair" → see workshops
2. Select workshop → fill form with car details + issue description + photos
3. Pay service deposit → workshop confirms → work begins

**Actual flow:**
1. ✅ Browse, select
2. ❌ Form missing: car model, year, registration number, photos
3. ❌ After booking: no payment, no confirmation, nothing

**Result:** Car gets dropped off at wrong workshop; no payment collected; no work tracking.

### Scenario 4: Customer Wins a Porsche 911 Auction

**Expected flow:**
1. Browse /auction → place bids on Porsche
2. Get outbid → bid again → win at RM 350,000
3. Automatic notification: "You won! Pay 10% deposit (RM 35,000)"
4. Pay deposit → contact unlocked → inspect → complete sale

**Actual flow:**
1. ✅ Place bids
2. ⚠️ No real-time update — might miss counter-bids
3. ❌ Auction never auto-closes → winner never declared
4. ❌ No automated payment initiation

**Result:** Auction runs forever; winner never knows they won; no payment is ever initiated.

### Scenario 5: Customer Applies for RM 100,000 Car Loan

**Expected flow:**
1. Browse /loan → calculate: RM 100K, 30% down, 7 years @ 4%
2. Click "Apply Now" → fill 3-step form → upload documents
3. Submit → bank reviews → approved → pay processing fee → loan disbursed

**Actual flow:**
1. ✅ Calculate
2. ✅ Fill form + upload documents (but calculator rate vs. application rate mismatch)
3. ❌ After submit: nothing. No tracking in dashboard. No processing fee payment.

**Result:** Application disappears into a void; no way to pay processing fee even if approved.

### Scenario 6: Customer Takes Over a Honda Civic Continue Loan

**Expected flow:**
1. Browse /continue-loan → see Honda Civic with RM 1,200/mo, 36 months left
2. Click "Submit Enquiry" → fill form + upload documents
3. Owner sends agreement → customer signs → pay RM 15,000 takeover deposit
4. Upload receipt → admin verifies → contact unlocked → handover

**Actual flow:**
1. ✅ Browse, see details
2. ✅ Fill form + upload documents
3. ⚠️ "Confirm & Accept Agreement" — signs immediately without owner sending first
4. ❌ No deposit payment → no QR → no receipt → handover never completed

**Result:** Agreement signed but deposit never paid; transaction stuck at 50%.

---

## 10. SUMMARY OF ALL FLOW DEFECTS

### Defect Count by Severity

| Severity | Count | IDs |
|---|---|---|
| Critical | 6 | FLOW-009, FLOW-013, FLOW-016, FLOW-019, FLOW-023, FLOW-026 |
| High | 8 | FLOW-001, FLOW-006, FLOW-012, FLOW-015, FLOW-022, FLOW-025, FLOW-027, FLOW-028 |
| Medium | 11 | FLOW-002, FLOW-003, FLOW-007, FLOW-010, FLOW-011, FLOW-014, FLOW-017, FLOW-018, FLOW-020, FLOW-024, FLOW-029 |
| Low | 4 | FLOW-004, FLOW-005, FLOW-008, FLOW-030 |

**Total: 29 flow-level defects**

### Defects by Module

| Module | Critical | High | Medium | Low | Total |
|---|---|---|---|---|---|
| Rent | 0 | 1 | 2 | 2 | 5 |
| Buy & Sell | 0 | 1 | 1 | 1 | 3 |
| Auction | 1 | 1 | 2 | 0 | 4 |
| Repair/Workshop | 1 | 1 | 2 | 0 | 4 |
| Insurance | 1 | 1 | 2 | 0 | 4 |
| Loan | 1 | 1 | 1 | 1 | 4 |
| Continue Loan | 1 | 1 | 1 | 0 | 3 |
| Cross-Module | 1 | 1 | 1 | 0 | 3 |

### Root Cause Analysis

| Root Cause | Defects Count | % of Total |
|---|---|---|
| Payment flow not implemented for module | 5 | 17.2% |
| Backend calculation doesn't match UI display | 4 | 13.8% |
| Missing required form fields for real-world use | 3 | 10.3% |
| No automated state transitions (cron/triggers) | 3 | 10.3% |
| Missing post-submission tracking/dealer UI | 4 | 13.8% |
| Data inconsistency between frontend and API | 3 | 10.3% |
| State machine doesn't match SRS specification | 2 | 6.9% |
| Missing navigation/recovery paths | 2 | 6.9% |
| Hardcoded values where dynamic needed | 1 | 3.4% |
| Missing legal/marketplace disclaimers | 1 | 3.4% |

---

## 11. TOP 5 MUST-FIX FLOWS (Priority Order)

### P1: Add Payment Flow to All Modules
**Affects:** FLOW-013, FLOW-016, FLOW-019, FLOW-023, FLOW-026  
**Impact:** Platform cannot collect revenue from 5 of 7 modules  
**Fix:** After creating any booking/enquiry/appointment, the system must redirect to `/payment` with the appropriate amount. Each module needs to determine what amount to collect (service deposit, premium, processing fee, takeover deposit).

### P2: Implement Weekly/Monthly Rental Pricing Logic
**Affects:** FLOW-001, FLOW-005  
**Impact:** Customers are overcharged for long rentals  
**Fix:** Update booking API to check rental duration and apply the appropriate pricing tier:
- days >= 30: apply monthly rate
- days >= 7: apply weekly rate
- else: apply daily rate
- Include deposit in total calculation

### P3: Implement Auction Auto-Close and Winner Declaration
**Affects:** FLOW-009, FLOW-012  
**Impact:** Auctions never end; no winners are declared; no post-auction flow  
**Fix:** Add a server-side scheduler that checks expired auctions, declares winners, sends notifications, and initiates payment flow.

### P4: Add Payment Page Persistence and Recovery
**Affects:** FLOW-028  
**Impact:** Users who close the payment page cannot return  
**Fix:** Store `bookingId` and `paymentId` in URL search params so the payment page can reload state from the API on refresh or revisit.

### P5: Fix Enquiry Fee Display to Match Actual Charges
**Affects:** FLOW-006  
**Impact:** Users see RM 100 but are charged car-specific fee  
**Fix:** Dynamically read `car.bookingFee` and display it in all CTA areas, payment info notices, and pass it correctly to the booking creation.

---

## 12. FLOW HEALTH SCORES

| Module | User Flow Score | Business Logic Score | Payment Integration | Overall |
|---|---|---|---|---|
| Rent | 8/10 | 6/10 | 9/10 | 7.7/10 |
| Buy & Sell | 7/10 | 5/10 | 8/10 | 6.7/10 |
| Auction | 5/10 | 3/10 | 4/10 | 4.0/10 |
| Repair/Workshop | 4/10 | 3/10 | 1/10 | 2.7/10 |
| Insurance | 4/10 | 3/10 | 1/10 | 2.7/10 |
| Loan | 5/10 | 4/10 | 1/10 | 3.3/10 |
| Continue Loan | 5/10 | 4/10 | 1/10 | 3.3/10 |

**Platform Average Flow Health: 4.3/10**

---

## 13. VERDICT

**The platform has solid individual pages with beautiful UI, but the flows between them are frequently broken.** 

- Rent and Buy flows are **functional end-to-end** but have pricing inconsistencies
- All other modules **stop working after the submission step** because the payment loop is never entered
- The auction module has **no automated lifecycle** — auctions never close, winners are never declared
- The repair, insurance, loan, and continue loan modules **cannot collect any payment** through the platform
- **29 flow-level defects** were identified, of which 6 are critical (preventing the core transaction from completing)

**Recommendation: Fix the payment flow gap across all modules first, then address pricing inconsistencies and missing auto-triggers.** Without payment, the platform is a lead generation tool, not a transaction platform.
