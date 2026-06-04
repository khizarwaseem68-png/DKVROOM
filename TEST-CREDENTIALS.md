# DK Vroom — Test Credentials

**Platform URL:** http://localhost:3000  
**Password for all accounts:** `12345678`

---

## Admin

| Role  | Email                  | Password   |
|-------|------------------------|------------|
| Admin | admin@dkvroom.com      | 12345678   |

> Full platform control — verify dealers, approve car listings, verify payments, manage loans.

---

## Customer

| Name         | Email               | Password |
|--------------|---------------------|----------|
| Ahmad Razak  | ahmad@dkvroom.com   | 12345678 |
| Sarah Tan    | sarah@dkvroom.com   | 12345678 |
| Lim Wei Jie  | limwj@dkvroom.com   | 12345678 |
| Nurul Aisyah | nurul@dkvroom.com   | 12345678 |
| David Kumar  | david@dkvroom.com   | 12345678 |

> Customers can browse vehicles, make bookings, upload payment receipts, place auction bids, and apply for loans.

---

## Dealers (Verified)

| Company               | Type          | Email                      | Password |
|-----------------------|---------------|----------------------------|----------|
| Prestige Auto KL      | Rental        | prestige@dkvroom.com       | 12345678 |
| Merc Gallery MY       | Used Car      | mercgallery@dkvroom.com    | 12345678 |
| Stuttgart Motors      | Rental        | stuttgart@dkvroom.com      | 12345678 |
| Southern Auto Hub     | Used Car      | southern@dkvroom.com       | 12345678 |
| Honda Power Zone      | Used Car      | hondapower@dkvroom.com     | 12345678 |
| MyviMart Shah Alam    | Used Car      | myvimart@dkvroom.com       | 12345678 |
| Bavarian Motors KL    | Used Car      | bavarian@dkvroom.com       | 12345678 |
| Supercars Asia        | Auction       | supercars@dkvroom.com      | 12345678 |
| JDM Legends MY        | Auction       | jdmlegends@dkvroom.com     | 12345678 |
| Proton Elite Penang   | Used Car      | protonelite@dkvroom.com    | 12345678 |
| Zoom-Zoom Auto        | Used Car      | zoomzoom@dkvroom.com       | 12345678 |
| Four Rings Garage     | Rental        | fourrings@dkvroom.com      | 12345678 |
| AutoFix Workshop      | Workshop      | autofix@dkvroom.com        | 12345678 |
| KK Workshop & Parts   | Workshop      | kkworkshop@dkvroom.com     | 12345678 |
| Shield Insurance MY   | Insurance     | shieldins@dkvroom.com      | 12345678 |
| CovCare Insurance     | Insurance     | covcare@dkvroom.com        | 12345678 |

---

## Dealer (Pending Verification)

| Company                    | Email                    | Password |
|----------------------------|--------------------------|----------|
| New Auto Dealer (Pending)  | newdealer@dkvroom.com    | 12345678 |

> This account is unverified. Use the Admin account to approve or reject it under the **Dealers** tab in the Admin Dashboard.

---

## Key Flows to Demo

### As Admin (`admin@dkvroom.com`)
1. Go to **Admin Dashboard → Cars** — approve the pending Volvo XC90 listing (set a booking fee)
2. Go to **Admin Dashboard → Dealers** — verify or reject the pending dealer
3. Go to **Admin Dashboard → Payments** — verify uploaded payment receipts

### As Customer (`ahmad@dkvroom.com`)
1. Browse `/rent`, `/buy`, `/auction`, `/continue-loan`
2. Click any car → **Book Now / Place Bid / Send Enquiry**
3. Complete the QR payment flow — upload any image as a receipt
4. Check **Customer Dashboard → My Bookings** for booking status

### As Dealer (`prestige@dkvroom.com`)
1. Go to **Dealer Dashboard → My Listings** to see rental cars
2. Go to **Dealer Dashboard → Bookings** to see incoming bookings
3. Go to **Dealer Dashboard → Payments** to track revenue

---

*All passwords are `12345678` — minimum 8 characters.*
