# DK Vroom — Comprehensive Test Cases

## Document Information

| Field | Value |
|-------|-------|
| **Project** | DK Vroom — Malaysia Premium Automotive Marketplace |
| **Version** | 1.0.0 |
| **Date** | 2026-05-30 |
| **Environment** | Next.js 16 / React 19 / Prisma / PostgreSQL |
| **Panels** | Customer, Dealer, Admin |

---

## 1. Authentication Module

### 1.1 Customer Registration — Stepper Form

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| AUTH-001 | Register with valid customer details | 1. Navigate to Register page<br>2. Select "Customer" role<br>3. Fill Step 1: Name, Phone, Email<br>4. Click Next<br>5. Fill Step 2: Password (8+ chars, 1 uppercase, 1 number), Confirm Password<br>6. Click Next<br>7. Fill Step 3: Address, IC Number, License Number<br>8. Upload IC document (JPG/PNG/PDF)<br>9. Upload License document<br>10. Click Next<br>11. Review details on Step 4<br>12. Check "Agree to terms"<br>13. Click "Create Account" | Account created, redirected to home page, JWT token stored in localStorage, welcome notification created | High |
| AUTH-002 | Step validation — empty required fields | 1. Go to Customer Registration Step 1<br>2. Leave Name empty, fill Phone & Email<br>3. Click Next | Validation error shown for Name field, step does not advance | High |
| AUTH-003 | Step validation — invalid email | 1. Go to Customer Registration Step 1<br>2. Enter invalid email like "notanemail"<br>3. Click Next | Validation error: "Please enter a valid email", step does not advance | High |
| AUTH-004 | Step validation — invalid phone format | 1. Enter phone "12345" (not Malaysian format)<br>2. Click Next | Validation error: "Please enter a valid Malaysian phone number" | High |
| AUTH-005 | Step validation — weak password | 1. Go to Step 2<br>2. Enter password "pass" (less than 8 chars, no uppercase, no number)<br>3. Click Next | Validation errors: "min 8 chars", "1 uppercase", "1 number" | High |
| AUTH-006 | Step validation — password mismatch | 1. Enter password "Password1"<br>2. Enter confirm password "Different1"<br>3. Click Next | Validation error: "Passwords do not match" | High |
| AUTH-007 | Back button navigation | 1. Fill Step 1, go to Step 2<br>2. Click Back | Returns to Step 1 with all previously entered values preserved | Medium |
| AUTH-008 | File upload — IC document | 1. On Step 3, click Upload IC<br>2. Select a valid JPG file<br>3. Observe upload progress<br>4. File uploaded successfully | File name shown, green checkmark, upload URL captured in state | High |
| AUTH-009 | File upload — change uploaded file | 1. Upload IC document<br>2. Click "Change" button<br>3. Select a different file | Previous file replaced, new file name shown, new URL captured | High |
| AUTH-010 | File upload — delete uploaded file | 1. Upload License document<br>2. Click X button to delete | File removed from state, upload area returns to empty state | High |
| AUTH-011 | File upload — file too large | 1. Upload a file larger than 5MB | Error message shown: file size exceeds limit | High |
| AUTH-012 | File upload — invalid file type | 1. Upload a .exe or .txt file | File rejected, only JPG/PNG/PDF accepted | High |
| AUTH-013 | Duplicate email registration | 1. Register with an email that already exists in the system | Error: "An account with this email already exists" | High |
| AUTH-014 | Terms not agreed | 1. Fill all steps correctly<br>2. Do NOT check "Agree to terms"<br>3. Click "Create Account" | Validation error: "You must agree to the terms" | Medium |
| AUTH-015 | Review step shows correct data | 1. Fill all steps with specific values<br>2. Navigate to Step 4 (Review)<br>3. Verify all entered information is displayed | All entered data is correctly shown in the review summary | Medium |

### 1.2 Dealer Registration — Stepper Form

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| AUTH-016 | Register with valid dealer details | 1. Select "Dealer" role<br>2. Step 1: Business Name, Dealer Type, Registration No, Address, City<br>3. Step 2: Contact Person, Phone, WhatsApp, Email, Password, Confirm Password<br>4. Step 3: Bank Name, Account Number, Account Holder, Upload SSM Doc<br>5. Step 4: Review, agree to terms, submit | Account created, dealer record created with `verified: false`, redirected to dealer dashboard | High |
| AUTH-017 | Dealer type selection | 1. Click Dealer Type dropdown<br>2. Verify all options: Used Car Dealer, Rental Company, Workshop, Insurance Agent, Auction House, Loan Provider | All 6 dealer types are available | Medium |
| AUTH-018 | Dealer verification notice | 1. Navigate to Dealer Registration Step 4 | Notice shown: "Your dealer account will be reviewed and verified by our admin team within 24-48 hours." | Medium |
| AUTH-019 | Dealer SSM document upload | 1. On Step 3, upload SSM/Registration document<br>2. Verify category is sent as 'documents' | File uploaded with category 'documents', URL captured | High |
| AUTH-020 | Dealer registration without business name | 1. Leave Business Name empty<br>2. Try to proceed | Validation error: "Business name is required" | High |

### 1.3 Login

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| AUTH-021 | Login as customer | 1. Select "Customer" role<br>2. Enter email: ahmad@dkvroom.com<br>3. Enter password: Customer@123<br>4. Click Sign In | Successfully logged in, redirected to home page, user info in store | High |
| AUTH-022 | Login as dealer | 1. Select "Dealer" role<br>2. Enter email: prestige@dkvroom.com<br>3. Enter password: Dealer@123<br>4. Click Sign In | Successfully logged in, redirected to dealer dashboard | High |
| AUTH-023 | Login as admin | 1. Select "Admin" role<br>2. Enter email: admin@dkvroom.com<br>3. Enter password: Admin@123<br>4. Click Sign In | Successfully logged in, redirected to admin dashboard | High |
| AUTH-024 | Login with wrong password | 1. Enter valid email<br>2. Enter wrong password<br>3. Click Sign In | Error: "Invalid email or password" | High |
| AUTH-025 | Login with non-existent email | 1. Enter email not in system<br>2. Enter any password<br>3. Click Sign In | Error: "Invalid email or password" | High |
| AUTH-026 | Account lockout after 5 failed attempts | 1. Enter wrong password 5 times consecutively for same email<br>2. Try 6th time with correct password | Account locked for 15 minutes, error message about lockout | High |
| AUTH-027 | Demo credentials auto-fill | 1. Click "Customer" demo badge | Email and password fields auto-filled with demo credentials | Medium |
| AUTH-028 | Password visibility toggle | 1. Click eye icon in password field | Password shown/hidden accordingly | Low |
| AUTH-029 | Token persistence | 1. Login successfully<br>2. Refresh the page<br>3. Check auth state | Token restored from localStorage, user still logged in | High |
| AUTH-030 | Token expiry handling | 1. Login successfully<br>2. Manually corrupt/expire the token<br>3. Make an API call | 401 response, token cleared, user redirected to login | High |

---

## 2. Dealer Dashboard Module

### 2.1 Overview Tab

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| DL-001 | Stats cards display | 1. Login as dealer<br>2. Navigate to Overview tab | Stats cards show: Total Listings, Active Bookings, Revenue This Month, Rating | High |
| DL-002 | Revenue overview card | 1. View Revenue Overview card | Shows total revenue and monthly revenue from API | Medium |
| DL-003 | Recent bookings list | 1. View Recent Bookings card | Shows latest bookings with customer name, car details, amount, status | Medium |
| DL-004 | Quick action navigation | 1. Click "Add New Car" quick action | Navigates to Add Car tab | Medium |
| DL-005 | Sidebar collapse | 1. Click collapse button in sidebar | Sidebar collapses to icon-only mode | Low |
| DL-006 | Mobile sidebar | 1. View on mobile<br>2. Click hamburger menu | Mobile sidebar overlay opens with navigation items | Medium |

### 2.2 Add Car — Real Photo Upload

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| DL-007 | Upload single car photo | 1. Go to Add Car tab<br>2. Click upload area<br>3. Select one image file (JPG, under 5MB) | Photo uploaded to server via `/api/upload` with category `vehicle_photos`, thumbnail preview shown | High |
| DL-008 | Upload multiple car photos | 1. Click upload area<br>2. Select 3 image files simultaneously | All 3 photos uploaded, 3 thumbnails shown in grid | High |
| DL-009 | Upload up to 10 photos maximum | 1. Upload 10 photos<br>2. Try to upload 11th | 10 photos accepted, "+" button disappears after 10 photos | High |
| DL-010 | Photo upload with invalid file type | 1. Try to upload a PDF or .txt file as car photo | File rejected — input only accepts image/jpeg, image/png, image/webp | High |
| DL-011 | Photo upload exceeds 5MB | 1. Try to upload an image larger than 5MB | Upload fails, error message shown | High |
| DL-012 | Upload progress indicator | 1. Upload a photo<br>2. Observe upload state | Loader/spinner shown during upload with "Uploading photos..." text | Medium |
| DL-013 | Photo preview shows actual image | 1. Upload a photo<br>2. Check the thumbnail in the grid | Thumbnail shows the actual uploaded image (not a placeholder car icon) | High |
| DL-014 | Delete photo via three-dot menu | 1. Upload 2+ photos<br>2. Hover over a photo thumbnail<br>3. Click three-dot menu<br>4. Click "Delete" | Photo removed from array, grid updates | High |
| DL-015 | Set photo as cover via three-dot menu | 1. Upload 3 photos<br>2. Hover over 3rd photo<br>3. Click three-dot menu<br>4. Click "Set as Cover" | Photo moves to position 0, "Cover" badge moves to this photo | High |
| DL-016 | Cover photo does not show "Set as Cover" | 1. Upload photos (1st is cover)<br>2. Hover over 1st photo<br>3. Open three-dot menu | Only "Delete" option shown (no "Set as Cover" for the current cover) | Medium |
| DL-017 | Cover badge shown on first photo | 1. Upload multiple photos<br>2. Check first photo in grid | "Cover" badge visible on the first photo thumbnail | Medium |

### 2.3 Add Car — Form Submission

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| DL-018 | Add rental car | 1. Select "For Rent" listing type<br>2. Upload photos<br>3. Fill Brand, Model, Year, Location<br>4. Fill Daily Price, Weekly Price, Monthly Price, Deposit<br>5. Toggle availability<br>6. Fill Rental Terms<br>7. Toggle Self-pickup/Delivery<br>8. Click "Add Car" | Car created with type 'rent', status 'pending', photos stored as JSON array of URLs, redirected to listings | High |
| DL-019 | Add car for sale | 1. Select "For Sale" listing type<br>2. Fill sale-specific fields: Sale Price, Booking Fee, Condition, Mileage, Features<br>3. Submit | Car created with type 'sale', condition set correctly | High |
| DL-020 | Add continue loan car | 1. Select "Continue Loan" listing type<br>2. Fill: Monthly Installment, Remaining Months, Takeover Amount, Bank Name, Vehicle Condition<br>3. Submit | Car created with type 'continueLoan', all loan-specific fields saved | High |
| DL-021 | Add auction car | 1. Select "Auction" listing type<br>2. Fill: Starting Bid, End Date/Time, Reserve Price, Condition<br>3. Submit | Car created with type 'auction', auction fields saved | High |
| DL-022 | Add car without required fields | 1. Select listing type<br>2. Leave Brand empty<br>3. Click "Add Car" | Submission fails or shows validation error (brand, model, year, price are required by API) | High |
| DL-023 | Add car photos stored as real URLs | 1. Upload 3 real photos<br>2. Add the car<br>3. Check the created car in database | `photos` field contains JSON array of actual server URLs like `/uploads/vehicle_photos/{userId}/{uuid}.jpg` | High |
| DL-024 | Form reset after submission | 1. Add a car successfully<br>2. Check form fields | All form fields cleared, photo array reset | Medium |

### 2.4 Listings Management

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| DL-025 | View listings table (desktop) | 1. Navigate to My Listings tab | Table shows: Photo, Brand/Model, Type, Price, Status, Actions for each car | High |
| DL-026 | View listings cards (mobile) | 1. View on mobile<br>2. Navigate to My Listings | Cards with photo, brand/model, type badge, status badge, price, action buttons | Medium |
| DL-027 | Filter listings by type | 1. Click "For Rent" filter button<br>2. Check displayed listings | Only rental cars shown | Medium |
| DL-028 | Delete car with confirmation | 1. Click delete (trash) icon on a listing<br>2. Confirmation dialog appears<br>3. Click "Delete" in dialog | Car deleted from database, listing removed from table, stats refreshed | High |
| DL-029 | Cancel delete | 1. Click delete icon<br>2. Click "Cancel" in dialog | Dialog closes, car not deleted | Medium |
| DL-030 | Listing photo shows actual image | 1. View listings with uploaded photos | Table/card shows actual uploaded image (not placeholder) | High |

### 2.5 Bookings Tab

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| DL-031 | View bookings list | 1. Navigate to Bookings tab | Bookings table shows: Customer, Car, Amount, Status, Date | High |
| DL-032 | Filter bookings by status | 1. Select status filter (e.g., "confirmed") | Only confirmed bookings shown | Medium |
| DL-033 | Approve booking | 1. Click approve on a pending booking | Booking status changes to confirmed | Medium |
| DL-034 | Reject booking | 1. Click reject on a pending booking | Booking status changes to cancelled | Medium |

### 2.6 Settings Tab

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| DL-035 | View dealer profile settings | 1. Navigate to Settings tab | Shows company name, email, phone, location fields | Medium |
| DL-036 | Update profile | 1. Edit company name<br>2. Click Save | Profile updated (if API endpoint exists) | Low |

---

## 3. Customer — Car Browsing & Booking

### 3.1 Car Listing Pages

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| CAR-001 | View rental cars | 1. Navigate to Rent page | Grid of rental car cards with photos, brand, model, price/day, location | High |
| CAR-002 | View cars for sale | 1. Navigate to Buy & Sell page | Grid of sale car cards with price, mileage, condition | High |
| CAR-003 | View auction cars | 1. Navigate to Auction page | Auction listings with starting bid, time remaining, condition badges | High |
| CAR-004 | View continue loan cars | 1. Navigate to Continue Loan page | Listings with monthly installment, remaining months, takeover amount | High |
| CAR-005 | Filter cars by brand | 1. Select a brand filter | Only cars of that brand shown | Medium |
| CAR-006 | Filter cars by city | 1. Select a city filter | Only cars in that city shown | Medium |
| CAR-007 | Filter cars by price range | 1. Set min and max price | Cars within price range shown | Medium |
| CAR-008 | Search cars | 1. Type search query in search bar<br>2. Press enter | Cars matching brand, model, or description shown | Medium |
| CAR-009 | Car card shows real photo | 1. View car listings | Cards display actual uploaded images (not placeholder icons) | High |
| CAR-010 | Empty state | 1. Filter with criteria that returns no results | Empty state message with "No cars found" description | Low |

### 3.2 Car Detail View

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| CAR-011 | View car details | 1. Click on a car card | Full detail page: photo gallery, all specs, pricing, dealer info, description | High |
| CAR-012 | Image gallery | 1. View car with multiple photos<br>2. Navigate through images | Image gallery/carousel shows all uploaded photos, first image is the cover | High |
| CAR-013 | Dealer info on detail page | 1. View car detail | Dealer company name, verified badge, rating shown | Medium |

### 3.3 Booking Flow

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| BK-001 | Create rental booking | 1. View rental car detail<br>2. Select dates<br>3. Click "Book Now" | Booking created with status 'pending', payment flow initiated | High |
| BK-002 | Create sale enquiry | 1. View car for sale<br>2. Click "Enquire" or "Book" | Enquiry/booking created | High |
| BK-003 | Place auction bid | 1. View auction car<br>2. Enter bid amount<br>3. Click "Place Bid" | Bid created if amount > current bid, bid counter incremented | High |
| BK-004 | Continue loan enquiry | 1. View continue loan car<br>2. Click "Enquire" | Enquiry created with status 'pending' | High |

---

## 4. Payment Module

### 4.1 QR Payment Flow

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| PAY-001 | Payment page display | 1. Create a booking<br>2. Navigate to payment page | QR code displayed, booking summary shown, progress steps visible | High |
| PAY-002 | QR code generation | 1. View payment page | QR code contains booking ID and amount as URL | High |
| PAY-003 | Upload payment receipt | 1. Click upload area<br>2. Select receipt image (JPG/PNG/PDF, under 5MB)<br>3. Click "Upload Receipt" | Receipt uploaded, status changes to "uploaded", progress step advances | High |
| PAY-004 | Change receipt before upload | 1. Select a receipt file<br>2. Click "Choose a different file"<br>3. Select different file | Previous file replaced with new selection | High |
| PAY-005 | Delete selected receipt | 1. Select a receipt file<br>2. Click X button | File deselected, upload area returns to initial state | Medium |
| PAY-006 | Upload receipt too large | 1. Try to upload receipt > 5MB | Error message shown | High |
| PAY-007 | Admin verify payment | 1. Login as admin<br>2. Go to payment page<br>3. Click "Verify Payment" | Payment status changes to 'verified', contact details unlocked for customer | High |
| PAY-008 | Contact details unlocked | 1. Payment verified<br>2. View verified state | Phone, WhatsApp, exact location shown with green "Contact Details Unlocked" card | High |
| PAY-009 | Copy booking reference | 1. Click copy icon next to booking ID | Booking ID copied to clipboard, checkmark shown briefly | Low |
| PAY-010 | Double upload bug (fixed) | 1. Upload receipt on payment page | Receipt uploaded only ONCE (not double-uploaded as in previous bug) | High |

---

## 5. Auction Module

### 5.1 Auction-Specific Features

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| AUC-001 | View auction with condition badges | 1. View auction listing | Condition category badge shown (Running, Used, Wreck, Accident, Salvage, etc.) | High |
| AUC-002 | Place bid below current bid | 1. View auction car<br>2. Enter amount less than current bid<br>3. Submit | Error: bid must be higher than current bid | High |
| AUC-003 | Place valid bid | 1. Enter amount higher than current bid<br>2. Submit | Bid accepted, current bid updated, bid count incremented | High |
| AUC-004 | Auction countdown timer | 1. View active auction | Countdown timer shows time remaining until auction end | Medium |
| AUC-005 | Auction ended | 1. View auction where end date has passed | Auction shows "Ended" status, no more bids accepted | Medium |
| AUC-006 | Condition category filter | 1. Filter auctions by condition category | Only auctions with matching condition shown | Medium |

---

## 6. Continue Loan (Sambung Bayar) Module

### 6.1 Continue Loan Flow

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| CL-001 | Submit continue loan enquiry | 1. View continue loan listing<br>2. Click "Enquire"<br>3. Fill enquiry form | Enquiry created with status 'pending' | High |
| CL-002 | View continue loan steps | 1. Track enquiry status | Progress shows 6 steps: Enquiry → Agreement Sent → Agreement Signed → Deposit Paid → Handover → Completed | High |
| CL-003 | Document upload in loan flow | 1. Upload required documents (IC, License, Payslip, Bank Statement) | Documents uploaded successfully with category tracking | Medium |

---

## 7. Insurance Module

### 7.1 Insurance Enquiry

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| INS-001 | Browse insurance partners | 1. Navigate to Insurance page | List of insurance providers with coverage types | Medium |
| INS-002 | Submit insurance enquiry | 1. Fill vehicle and personal details<br>2. Select coverage type<br>3. Submit | Enquiry created with status 'quoted' | Medium |
| INS-003 | Coverage type options | 1. Open coverage type dropdown | Shows: Comprehensive, Third Party, Third Party Fire & Theft | Medium |

---

## 8. Repair & Workshop Module

### 8.1 Workshop Booking

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| WKS-001 | Browse workshops | 1. Navigate to Repair page | List of workshops with services, ratings, location | Medium |
| WKS-002 | Book workshop appointment | 1. Select a workshop<br>2. Choose service type<br>3. Select date/time<br>4. Submit | Appointment created | Medium |
| WKS-003 | Service type selection | 1. Open service type dropdown | Shows: General Service, Engine Repair, Bodywork, Electrical, Tire & Battery, A/C Service, Others | Medium |

---

## 9. Loan Module

### 9.1 Loan Application

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| LOAN-001 | Submit loan application | 1. Navigate to Loan page<br>2. Fill personal and vehicle details<br>3. Select loan type and tenure<br>4. Submit | Loan application created with status 'reviewing' | High |
| LOAN-002 | Loan document uploads | 1. Upload IC front and back<br>2. Upload 3 months payslip<br>3. Upload 3 months bank statement<br>4. Upload additional docs | All documents uploaded with proper categories | High |
| LOAN-003 | Loan type options | 1. Open loan type dropdown | Shows: New Car, Used Car, Continue Loan | Medium |
| LOAN-004 | Loan tenure options | 1. Open tenure dropdown | Shows: 5 Years, 7 Years, 9 Years | Medium |

---

## 10. Admin Dashboard

### 10.1 Admin Car Management

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| ADM-001 | View all cars | 1. Login as admin<br>2. Navigate to Cars section | All cars from all dealers shown with status | High |
| ADM-002 | Approve car listing | 1. Find a pending car<br>2. Click "Approve" | Car status changes to 'approved', visible to customers | High |
| ADM-003 | Reject car listing | 1. Find a pending car<br>2. Click "Reject"<br>3. Enter reason | Car status changes to 'rejected', dealer notified | High |

### 10.2 Admin Dealer Management

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| ADM-004 | View pending dealers | 1. Navigate to Dealers section | List of dealers with pending verification status | High |
| ADM-005 | Verify dealer | 1. Find pending dealer<br>2. Click "Verify" | Dealer `verified` flag set to true, dealer can now add cars | High |
| ADM-006 | Reject dealer | 1. Find pending dealer<br>2. Click "Reject"<br>3. Enter reason | Dealer rejected, cannot add cars | High |

### 10.3 Admin Payment Verification

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| ADM-007 | View pending payments | 1. Navigate to Payments section | List of payments with 'uploaded' status pending verification | High |
| ADM-008 | Verify payment | 1. Review receipt<br>2. Click "Verify" | Payment status changes to 'verified', booking confirmed, contact unlocked | High |
| ADM-009 | Reject payment | 1. Review receipt<br>2. Click "Reject"<br>3. Enter reason | Payment status changes to 'rejected', customer notified | High |

### 10.4 Admin Platform Stats

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| ADM-010 | View platform statistics | 1. Navigate to Stats/Overview | Stats: Total users, dealers, cars, revenue, bookings | High |

---

## 11. Security Test Cases

### 11.1 Authentication Security

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| SEC-001 | Password hashing | 1. Register a new user<br>2. Check database | Password stored as bcrypt hash, not plaintext | Critical |
| SEC-002 | JWT token validation | 1. Make API call without token | 401 Unauthorized response | Critical |
| SEC-003 | Invalid JWT token | 1. Make API call with invalid/expired token | 401 Unauthorized, token cleared | Critical |
| SEC-004 | Role-based access — customer cannot access dealer APIs | 1. Login as customer<br>2. Try to call POST /api/cars | 403 Forbidden response | Critical |
| SEC-005 | Role-based access — unverified dealer cannot add cars | 1. Login as unverified dealer<br>2. Try to create car listing | 403 "Dealer account not yet verified" | Critical |
| SEC-006 | Account lockout | 1. Fail login 5 times<br>2. Try to login with correct credentials | Account locked for 15 minutes | High |
| SEC-007 | SQL injection prevention | 1. Enter SQL injection in email field: `' OR 1=1 --`<br>2. Submit login | Input sanitized, no SQL injection occurs | Critical |
| SEC-008 | XSS prevention | 1. Enter `<script>alert('xss')</script>` in name field<br>2. Register | Input sanitized, script tags not rendered | Critical |

### 11.2 File Upload Security

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| SEC-009 | File type validation | 1. Try to upload .exe, .php, .sh files | Server rejects with "Invalid file" error | Critical |
| SEC-010 | File size validation | 1. Upload file exceeding category limit | Server rejects with file size error | Critical |
| SEC-011 | Path traversal prevention | 1. Try to access `/api/serve-upload/../../etc/passwd` | Request blocked, no file served | Critical |
| SEC-012 | Upload requires authentication | 1. Try to upload without JWT token | 401 Unauthorized | Critical |
| SEC-013 | Upload rate limiting | 1. Upload 20+ files within 1 minute from same IP | 429 Too Many Requests after limit exceeded | High |

### 11.3 API Security

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| SEC-014 | Rate limiting on login | 1. Attempt 10+ logins in 1 minute | 429 response after limit | High |
| SEC-015 | Rate limiting on registration | 1. Attempt 5+ registrations in 1 minute | 429 response after limit | High |
| SEC-016 | Rate limiting on car creation | 1. Attempt 10+ car creations in 1 minute | 429 response after limit | Medium |
| SEC-017 | CORS headers | 1. Check response headers for CORS | Proper CORS headers set (or no CORS for same-origin) | Medium |
| SEC-018 | Input sanitization on car creation | 1. Enter HTML tags in brand/model fields | Input sanitized by server, no HTML stored | High |

---

## 12. File Upload Integration Test Cases

### 12.1 Upload Flow — End-to-End

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| UPL-001 | Customer IC upload during registration | 1. Start customer registration<br>2. On Step 3, upload IC file<br>3. Complete registration<br>4. Check user record in database | User record has `icDocumentUrl` populated with upload URL | High |
| UPL-002 | Customer license upload during registration | 1. Upload license during registration<br>2. Complete registration<br>3. Check database | User record has `licenseDocumentUrl` populated | High |
| UPL-003 | Dealer SSM document upload during registration | 1. Start dealer registration<br>2. On Step 3, upload SSM doc<br>3. Complete registration<br>4. Check database | Dealer record has `registrationDocUrl` populated | High |
| UPL-004 | Vehicle photo upload during car creation | 1. Login as verified dealer<br>2. Add car with 3 real photos<br>3. Check car record in database | Car `photos` field contains JSON array of 3 real URLs | High |
| UPL-005 | Uploaded file is accessible | 1. Upload a file<br>2. Get the URL from response<br>3. Navigate to the URL in browser | File is served correctly via `/api/serve-upload/` route | High |
| UPL-006 | Upload category subdirectory structure | 1. Upload a vehicle photo<br>2. Check file system | File saved at `uploads/vehicle_photos/{userId}/{uuid}.jpg` | Medium |
| UPL-007 | Receipt upload for payment | 1. Upload payment receipt<br>2. Check payment record | Payment record has `receiptUrl` populated | High |
| UPL-008 | Audit log on file upload | 1. Upload any file<br>2. Check AuditLog table | Entry created with action 'file_uploaded', category, size, URL logged | Medium |

---

## 13. Navigation & Routing Test Cases

### 13.1 SPA Hash-Based Navigation

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| NAV-001 | Navigate to home | 1. Click logo or "Home" | Hash changes to #home, home page rendered | High |
| NAV-002 | Navigate to Rent | 1. Click "Rent" in nav | Hash changes to #rent, rental listings shown | High |
| NAV-003 | Navigate to Buy | 1. Click "Buy & Sell" | Hash changes to #buy, sale listings shown | High |
| NAV-004 | Navigate to Auction | 1. Click "Auction" | Hash changes to #auction, auction listings shown | High |
| NAV-005 | Navigate to Continue Loan | 1. Click "Continue Loan" | Hash changes to #continueLoan, continue loan listings shown | High |
| NAV-006 | Navigate to Dealer Dashboard | 1. Login as dealer<br>2. Navigate to dashboard | Dealer dashboard rendered with sidebar navigation | High |
| NAV-007 | Browser back/forward | 1. Navigate through several pages<br>2. Click browser back<br>3. Click browser forward | Navigation works correctly with browser history | High |
| NAV-008 | Direct URL access | 1. Enter URL with hash: `http://localhost:3000/#auction` | Auction page loads directly | Medium |
| NAV-009 | Unauthorized dashboard access | 1. Not logged in<br>2. Try to navigate to #dealerDashboard | Redirected to login page | High |

---

## 14. Responsive Design Test Cases

### 14.1 Mobile Responsiveness

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| RES-001 | Header on mobile | 1. View on mobile (375px) | Hamburger menu shown, full nav hidden | High |
| RES-002 | Car cards grid on mobile | 1. View car listings on mobile | Single column layout, cards stack vertically | High |
| RES-003 | Dealer sidebar on mobile | 1. View dealer dashboard on mobile | Sidebar hidden, hamburger menu shows overlay sidebar | High |
| RES-004 | Registration form on mobile | 1. View stepper form on mobile | Form fields stack, stepper shows step numbers only (labels hidden on small screens) | Medium |
| RES-005 | Car photo grid on mobile | 1. View Add Car photo grid on mobile | 2-column grid instead of 4 | Medium |
| RES-006 | Tables on mobile | 1. View listings table on mobile | Table hidden, card layout shown instead | High |

---

## 15. Edge Cases & Error Handling

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| EDGE-001 | Network error during registration | 1. Disconnect network<br>2. Try to register | User-friendly error message shown | Medium |
| EDGE-002 | Network error during file upload | 1. Disconnect network mid-upload<br>2. Try to upload file | Error message shown, upload state reset | Medium |
| EDGE-003 | Session expiry during form fill | 1. Start filling a long form<br>2. Token expires | Graceful redirect to login, form data warning | Medium |
| EDGE-004 | Concurrent bids on same auction | 1. Two users bid simultaneously | Last valid bid wins, no race condition corruption | High |
| EDGE-005 | Empty database | 1. Start with empty database<br>2. Browse all pages | Empty state messages shown, no crashes | High |
| EDGE-006 | Very long text inputs | 1. Enter 1000+ characters in description field | Text accepted and stored correctly, no truncation | Low |
| EDGE-007 | Special characters in inputs | 1. Enter emojis, unicode, special chars in name fields | Characters handled correctly (sanitized if needed) | Medium |
| EDGE-008 | Zero price car | 1. Create car with price = 0 | Server rejects: "Price must be a positive number" | Medium |
| EDGE-009 | Future year car | 1. Enter year 2030 for a car | Server validates year range, rejects if beyond current year + 1 | Medium |
| EDGE-010 | Invalid auction end date | 1. Set auction end date in the past | Should be validated and rejected | Medium |

---

## 16. Data Integrity Test Cases

| TC ID | Test Case | Steps | Expected Result | Priority |
|-------|-----------|-------|-----------------|----------|
| DATA-001 | Car-dealer relationship | 1. Create car as dealer<br>2. Check car.dealerId | Car is linked to the correct dealer | High |
| DATA-002 | Booking-car relationship | 1. Create booking for a car<br>2. Check booking.carId | Booking is linked to the correct car | High |
| DATA-003 | Payment-booking relationship | 1. Create payment for a booking<br>2. Check payment.bookingId | Payment is linked to the correct booking | High |
| DATA-004 | Dealer total listings count | 1. Add 3 cars as dealer<br>2. Check dealer.totalListings | totalListings = 3, incremented on each car creation | Medium |
| DATA-005 | Cascade behavior on user deletion | 1. Delete a user who has cars, bookings<br>2. Check related records | Related records handled according to schema onDelete policies | Medium |
| DATA-006 | Auction bid ordering | 1. Place multiple bids on same car<br>2. Check car.currentBid | currentBid always reflects the highest bid | High |

---

## Test Execution Summary Template

| Module | Total Tests | Pass | Fail | Blocked | Not Run |
|--------|-------------|------|------|---------|---------|
| Authentication | 30 | - | - | - | - |
| Dealer Dashboard | 36 | - | - | - | - |
| Car Browsing | 13 | - | - | - | - |
| Payment | 10 | - | - | - | - |
| Auction | 6 | - | - | - | - |
| Continue Loan | 3 | - | - | - | - |
| Insurance | 3 | - | - | - | - |
| Workshop | 3 | - | - | - | - |
| Loan | 4 | - | - | - | - |
| Admin | 10 | - | - | - | - |
| Security | 18 | - | - | - | - |
| File Upload Integration | 8 | - | - | - | - |
| Navigation | 9 | - | - | - | - |
| Responsive Design | 6 | - | - | - | - |
| Edge Cases | 10 | - | - | - | - |
| Data Integrity | 6 | - | - | - | - |
| **TOTAL** | **175** | - | - | - | - |
