# DK Vroom — Project Setup Guide

Complete installation and setup instructions for **Windows** and **Ubuntu (Linux)**.

---

## Table of Contents

1. [Tech Stack Overview](#tech-stack-overview)
2. [Prerequisites](#prerequisites)
3. [Setup on Ubuntu (Linux)](#setup-on-ubuntu-linux)
4. [Setup on Windows](#setup-on-windows)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup & Seeding](#database-setup--seeding)
7. [Running the Project](#running-the-project)
8. [Production Build](#production-build)
9. [Default Login Credentials](#default-login-credentials)
10. [Project Structure](#project-structure)
11. [Troubleshooting](#troubleshooting)

---

## Tech Stack Overview

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.x | Full-stack React framework (App Router) |
| React | 19.x | UI library |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 4.x | Utility-first CSS framework |
| Prisma | 6.x | ORM for database management |
| PostgreSQL | 16+ | Relational database (server-based) |
| Bun | 1.x+ | JavaScript runtime & package manager |
| Zustand | 5.x | Client-side state management |
| bcryptjs | 3.x | Password hashing |
| jose | (via Next.js) | JWT token signing & verification |
| Radix UI | latest | Accessible UI primitives |
| shadcn/ui | latest | Pre-built UI components |
| Lucide React | latest | Icon library |
| Framer Motion | 12.x | Animations |

---

## Prerequisites

### For Ubuntu

| Tool | Minimum Version | Install Command |
|---|---|---|
| Node.js | 20.x LTS | `curl -fsSL https://deb.nodesource.com/setup_20.x \| sudo -E bash - && sudo apt install -y nodejs` |
| Bun | 1.x | `curl -fsSL https://bun.sh/install \| bash` |
| Git | 2.x | `sudo apt install -y git` |

### For Windows

| Tool | Minimum Version | Download |
|---|---|---|
| Node.js | 20.x LTS | [nodejs.org](https://nodejs.org/) |
| Bun | 1.x | [bun.sh](https://bun.sh/) |
| Git | 2.x | [git-scm.com](https://git-scm.com/) |
| Visual Studio Build Tools | 2022 | Required for native modules (`npm install -g windows-build-tools`) |

---

## Setup on Ubuntu (Linux)

### Step 1: Install System Dependencies

```bash
# Update package manager
sudo apt update && sudo apt upgrade -y

# Install essential build tools (needed for bcryptjs, sharp, etc.)
sudo apt install -y build-essential libssl-dev pkg-config

# Install Git (if not already installed)
sudo apt install -y git
```

### Step 2: Install Node.js

```bash
# Using NodeSource repository (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version   # Should show v20.x.x or higher
npm --version    # Should show 10.x.x or higher
```

### Step 3: Install Bun

```bash
# Official Bun installer
curl -fsSL https://bun.sh/install | bash

# Reload shell to apply PATH changes
source ~/.bashrc   # or source ~/.zshrc if using zsh

# Verify installation
bun --version      # Should show 1.x.x or higher
```

### Step 4: Clone the Project

```bash
# Navigate to your preferred workspace
cd ~/projects      # or any directory you prefer

# Clone the repository (replace with actual repo URL)
git clone <repository-url> dk-vroom
cd dk-vroom
```

### Step 5: Install Dependencies

```bash
# Install all npm packages using Bun
bun install

# If bun install fails, try with npm as fallback
npm install
```

### Step 6: Configure Environment

```bash
# Create the .env file from the template below
cp .env.example .env   # if .env.example exists

# OR create manually:
nano .env
```

Paste the following content (adjust paths for your system):

```env
# Database — PostgreSQL connection string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dkvroom

# Security — MUST change in production
JWT_SECRET=dk-vroom-prod-jwt-secret-2024-change-me-b4f2a8c9e1

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=DK Vroom

# Upload limits
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=./uploads

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
```

> **Important**: The `DATABASE_URL` uses a PostgreSQL connection string. Make sure PostgreSQL 16+ is installed and the database `dkvroom` exists. Create it with: `createdb dkvroom`.

### Step 7: Initialize Database

```bash
# Generate Prisma client
bunx prisma generate

# Create the database and push schema
bunx prisma db push

# Seed the database with mock data (admin, dealers, customers, cars, bookings, etc.)
bun run db:seed
```

### Step 8: Create Upload Directories

```bash
# Create the uploads directory
mkdir -p uploads/vehicle_photos
mkdir -p uploads/default
mkdir -p uploads/receipts
mkdir -p uploads/documents
```

### Step 9: Start Development Server

```bash
# Start the Next.js dev server on port 3000
bun run dev

# Or use npm
npm run dev
```

The application will be available at **http://localhost:3000**

---

## Setup on Windows

### Step 1: Install Visual Studio Build Tools

This is required for native Node.js modules like `bcryptjs` and `sharp`.

```powershell
# Open PowerShell as Administrator
# Install chocolatey (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install build tools via chocolatey
choco install visualstudio2022buildtools -y
choco install visualstudio2022-workload-vctools -y
```

**Alternative (without Chocolatey):**
1. Download [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
2. Run the installer and select **"Desktop development with C++"**
3. Complete the installation

### Step 2: Install Node.js

```powershell
# Option A: Download from nodejs.org
# Visit https://nodejs.org/ and download the LTS (20.x) Windows Installer (.msi)
# Run the installer and follow the wizard

# Option B: Using winget
winget install OpenJS.NodeJS.LTS

# Option C: Using chocolatey
choco install nodejs-lts -y

# Verify installation (open NEW terminal)
node --version   # Should show v20.x.x or higher
npm --version    # Should show 10.x.x or higher
```

### Step 3: Install Bun

```powershell
# Official Bun installer for Windows
powershell -c "irm bun.sh/install.ps1 | iex"

# Or using npm
npm install -g bun

# Verify installation
bun --version
```

### Step 4: Install Git

```powershell
# Download from git-scm.com or use winget
winget install Git.Git

# Verify installation
git --version
```

### Step 5: Clone the Project

```powershell
# Navigate to your preferred workspace
cd C:\Projects    # or any directory you prefer

# Clone the repository
git clone <repository-url> dk-vroom
cd dk-vroom
```

### Step 6: Install Dependencies

```powershell
# Install all packages using Bun
bun install

# If bun install fails due to native modules, try:
npm install

# If bcryptjs fails to build, try:
npm rebuild bcryptjs
```

### Step 7: Configure Environment

```powershell
# Create the .env file
# Use Notepad, VS Code, or any editor
notepad .env
```

Paste the following content (**note the Windows path format**):

```env
# Database — PostgreSQL connection string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dkvroom

# Security — MUST change in production
JWT_SECRET=dk-vroom-prod-jwt-secret-2024-change-me-b4f2a8c9e1

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=DK Vroom

# Upload limits
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=./uploads

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
```

> **Note**: Ensure PostgreSQL 16+ is running and the `dkvroom` database exists. Create it with: `createdb dkvroom` or via `psql -U postgres -c "CREATE DATABASE dkvroom"`.

### Step 8: Initialize Database

```powershell
# Generate Prisma client
npx prisma generate

# Create the database and push schema
npx prisma db push

# Seed the database with mock data
bun run db:seed

# If bun is not available, use:
npx tsx prisma/seed.ts
```

### Step 9: Create Upload Directories

```powershell
# Create the uploads directories
mkdir uploads\vehicle_photos
mkdir uploads\default
mkdir uploads\receipts
mkdir uploads\documents
```

### Step 10: Start Development Server

```powershell
# Start the Next.js dev server on port 3000
bun run dev

# Or with npm
npm run dev
```

The application will be available at **http://localhost:3000**

---

## Environment Configuration

### Complete `.env` Reference

```env
# =============================================
# DATABASE
# =============================================
# PostgreSQL connection string
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dkvroom

# =============================================
# SECURITY — CRITICAL FOR PRODUCTION
# =============================================
# JWT secret key for authentication tokens
# MUST be changed in production! Generate with: openssl rand -base64 32
JWT_SECRET=dk-vroom-prod-jwt-secret-2024-change-me-b4f2a8c9e1

# =============================================
# APPLICATION
# =============================================
# Public URL of the application (used for CORS, redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Application display name
NEXT_PUBLIC_APP_NAME=DK Vroom

# =============================================
# FILE UPLOADS
# =============================================
# Maximum file upload size in megabytes
MAX_FILE_SIZE_MB=10

# Directory for uploaded files (relative to project root)
# On Ubuntu/Linux: ./uploads or /absolute/path/to/uploads
# On Windows: ./uploads or C:/absolute/path/to/uploads
UPLOAD_DIR=./uploads

# =============================================
# RATE LIMITING
# =============================================
# Time window for rate limiting (in milliseconds)
RATE_LIMIT_WINDOW_MS=60000

# Maximum requests per window per IP
RATE_LIMIT_MAX_REQUESTS=60
```

### Production Security Checklist

Before deploying to production, you MUST:

1. **Change `JWT_SECRET`**: Generate a strong secret
   ```bash
   # On Ubuntu/Mac
   openssl rand -base64 32

   # On Windows PowerShell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
   ```

2. **Set `NEXT_PUBLIC_APP_URL`** to your production domain (e.g., `https://dkvroom.com`)

3. **Use absolute paths** for `UPLOAD_DIR` and `DATABASE_URL`

4. **Enable HTTPS** via reverse proxy (Nginx, Caddy, Cloudflare)

---

## Database Setup & Seeding

### Understanding the Schema

The project uses **Prisma ORM** with **PostgreSQL**. The database schema includes these main models:

| Model | Purpose |
|---|---|
| `User` | All users (customers, dealers, admins) |
| `Dealer` | Dealer business profiles (linked to User) |
| `Car` | Vehicle listings (rent, sale, auction, continueLoan) |
| `Booking` | Reservations and purchase enquiries |
| `Payment` | Payment records with QR/manual flow |
| `LoanApplication` | Loan and continue loan applications |
| `AuctionBid` | Bids on auction vehicles |
| `ContinueLoanEnquiry` | Sambung Bayar enquiries |
| `WorkshopAppointment` | Repair/workshop bookings |
| `InsuranceEnquiry` | Insurance quote requests |
| `Notification` | User notifications |
| `Review` | Dealer/vehicle reviews |
| `ChatMessage` | User-to-dealer messages |
| `AuditLog` | Security audit trail |
| `PlatformSetting` | Platform configuration |

### Database Commands

```bash
# Generate Prisma Client from schema
npx prisma generate        # or: bunx prisma generate

# Push schema changes to database (dev mode)
npx prisma db push         # or: bunx prisma db push

# Create a proper migration (production)
npx prisma migrate dev --name init

# Reset database (DESTROYS ALL DATA)
npx prisma migrate reset

# Seed with mock data
bun run db:seed            # or: npx tsx prisma/seed.ts

# Open Prisma Studio (visual database browser)
npx prisma studio          # Opens at http://localhost:5555
```

### What the Seed Creates

Running `bun run db:seed` creates the following mock data:

| Role | Count | Email Pattern | Password |
|---|---|---|---|
| Admin | 1 | `admin@dkvroom.com` | `Admin@123` |
| Dealers | 16 | Various (e.g., `prestige@dkvroom.com`) | `Dealer@123` |
| Customers | 8 | Various (e.g., `ahmad@dkvroom.com`) | `Customer@123` |
| Cars | ~20 | — | — |
| Bookings | 6 | — | — |
| Loan Applications | 5 | — | — |
| Auction Bids | 6 | — | — |

---

## Running the Project

### Development Mode

```bash
# Start dev server with hot reload on port 3000
bun run dev

# Or with npm
npm run dev
```

### Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start development server on port 3000 |
| `bun run build` | Create production build (standalone output) |
| `bun run start` | Run production build |
| `bun run lint` | Run ESLint checks |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Generate Prisma Client |
| `bun run db:migrate` | Create and apply migrations |
| `bun run db:reset` | Reset database (destructive) |
| `bun run db:seed` | Seed database with mock data |

---

## Production Build

### Building for Production

```bash
# Step 1: Generate Prisma Client
npx prisma generate

# Step 2: Build the Next.js standalone output
bun run build
# This also copies static files and public directory into the standalone build

# Step 3: Run the production server
NODE_ENV=production bun .next/standalone/server.js
# Or: bun run start
```

### Deploying with Caddy (Ubuntu)

The project includes a `Caddyfile` for production deployment:

```bash
# Install Caddy
sudo apt install -y caddy

# Copy the Caddyfile to /etc/caddy/
sudo cp Caddyfile /etc/caddy/Caddyfile

# Edit the domain name
sudo nano /etc/caddy/Caddyfile

# Start Caddy
sudo systemctl start caddy
sudo systemctl enable caddy
```

### Deploying with Nginx (Ubuntu)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/dk-vroom
```

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name dkvroom.com www.dkvroom.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/dk-vroom /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Deploying on Windows (IIS)

For Windows Server deployments, you can use IIS with the `iisnode` module, or simply run the Node.js process as a Windows Service using [PM2](https://pm2.keymetrics.io/) or [NSSM](https://nssm.cc/).

```powershell
# Using PM2 (recommended)
npm install -g pm2

# Start the application
pm2 start .next/standalone/server.js --name dk-vroom

# Save the process list for auto-restart on reboot
pm2 save
pm2 startup
```

---

## Default Login Credentials

After seeding the database, use these accounts to test:

### Admin Panel
| Field | Value |
|---|---|
| Email | `admin@dkvroom.com` |
| Password | `Admin@123` |
| Dashboard | `http://localhost:3000/admin-dashboard` |

### Dealer Panel
| Field | Value |
|---|---|
| Email | `prestige@dkvroom.com` |
| Password | `Dealer@123` |
| Dashboard | `http://localhost:3000/dealer-dashboard` |

Other dealer emails: `mercgallery@dkvroom.com`, `stuttgart@dkvroom.com`, `southern@dkvroom.com`, `hondapower@dkvroom.com`, etc. (all use `Dealer@123`)

### Customer Panel
| Field | Value |
|---|---|
| Email | `ahmad@dkvroom.com` |
| Password | `Customer@123` |
| Dashboard | `http://localhost:3000/customer-dashboard` |

Other customer emails: `sarah@dkvroom.com`, `limwj@dkvroom.com`, `nurul@dkvroom.com`, `david@dkvroom.com`, etc. (all use `Customer@123`)

---

## Project Structure

```
dk-vroom/
├── prisma/
│   ├── schema.prisma          # Database schema (models, relations)
│   └── seed.ts                # Mock data seeder
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── page.tsx           # Home page (landing)
│   │   ├── layout.tsx         # Root layout (fonts, shell)
│   │   ├── globals.css        # Global styles (dark + gold theme)
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── rent/              # Rent module page
│   │   ├── buy/               # Buy & Sell module page
│   │   ├── repair/            # Repair/Workshop page
│   │   ├── insurance/         # Insurance page
│   │   ├── auction/           # Auction module page
│   │   ├── loan/              # Loan application page
│   │   ├── continue-loan/     # Continue Loan (Sambung Bayar) page
│   │   ├── car/[id]/          # Car detail page
│   │   ├── payment/           # Payment flow page
│   │   ├── dealer-dashboard/  # Dealer panel
│   │   ├── admin-dashboard/   # Admin panel
│   │   ├── customer-dashboard/# Customer panel
│   │   └── api/               # Backend API routes
│   │       ├── auth/          #   Login, Register, Me
│   │       ├── cars/          #   CRUD for cars
│   │       ├── bookings/      #   Booking management
│   │       ├── payments/      #   Payment processing
│   │       ├── loans/         #   Loan applications
│   │       ├── auctions/      #   Auction bids
│   │       ├── continue-loan/ #   Continue loan enquiries
│   │       ├── workshops/     #   Workshop appointments
│   │       ├── insurance/     #   Insurance enquiries
│   │       ├── notifications/ #   User notifications
│   │       ├── upload/        #   File upload handler
│   │       ├── dealer/        #   Dealer-specific APIs
│   │       └── admin/         #   Admin-specific APIs
│   ├── components/            # React components
│   │   ├── header.tsx         # Main navigation header
│   │   ├── home-page.tsx      # Landing page component
│   │   ├── app-shell.tsx      # App wrapper (auth, header)
│   │   ├── dealer-dashboard.tsx
│   │   ├── admin-dashboard.tsx
│   │   ├── customer-dashboard.tsx
│   │   ├── auth-page.tsx      # Login/Register forms
│   │   ├── car-listing.tsx    # Car listing grid
│   │   ├── car-detail.tsx     # Car detail view
│   │   ├── payment-page.tsx   # Payment flow with QR
│   │   ├── repair-page.tsx
│   │   ├── insurance-page.tsx
│   │   ├── auction-page.tsx
│   │   ├── loan-page.tsx
│   │   ├── loan-application.tsx
│   │   ├── continue-loan-enquiry.tsx
│   │   ├── shared/            # Shared/reusable components
│   │   │   ├── index.tsx      #   Barrel exports
│   │   │   ├── states.tsx     #   Loading/empty/error states
│   │   │   ├── notification-dropdown.tsx
│   │   │   ├── star-rating.tsx
│   │   │   ├── countdown-timer.tsx
│   │   │   ├── status-badge.tsx
│   │   │   └── badges.tsx
│   │   └── ui/                # shadcn/ui components (50+)
│   ├── lib/                   # Core libraries
│   │   ├── api.ts             # API client (fetch wrapper)
│   │   ├── db.ts              # Prisma client instance
│   │   ├── store.ts           # Zustand state management
│   │   ├── constants.ts       # App constants, cities, formatters
│   │   ├── utils.ts           # Utility functions (cn, etc.)
│   │   ├── mock-data.ts       # Static fallback data
│   │   ├── auth/
│   │   │   └── auth-utils.ts  # JWT, bcrypt, auth helpers
│   │   └── security/
│   │       └── middleware.ts  # Rate limiting, sanitization, CORS
│   └── hooks/                 # Custom React hooks
│       ├── use-api.ts         # Data fetching, debounce, scroll
│       ├── use-mobile.ts      # Mobile detection
│       └── use-toast.ts       # Toast notifications
├── db/
│   └── custom.db              # Legacy SQLite database (not used with PostgreSQL)
├── uploads/                   # File upload storage
├── public/
│   └── logo.svg               # App logo
├── .env                       # Environment variables (NOT committed)
├── package.json               # Dependencies and scripts
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── components.json            # shadcn/ui configuration
├── Caddyfile                  # Caddy reverse proxy config
└── SETUP.md                   # This file
```

---

## Troubleshooting

### Common Issues

#### 1. `bun install` fails on Windows

**Problem**: Native modules (bcryptjs, sharp) fail to compile.

**Solution**:
```powershell
# Install Visual Studio Build Tools (see Step 1 of Windows setup)
# Then try:
npm install

# If bcryptjs still fails:
npm rebuild bcryptjs
```

#### 2. Prisma Client not generated

**Problem**: `Error: @prisma/client did not initialize yet`.

**Solution**:
```bash
# Generate the client
npx prisma generate

# If the issue persists, clear the cache:
npx prisma generate --no-engine
rm -rf node_modules/.prisma
npx prisma generate
```

#### 3. Database file not found

**Problem**: `Error: P1003: Database file not found`.

**Solution**:
```bash
# Ensure the db directory exists
# Ensure PostgreSQL is running and database exists
createdb dkvroom 2>/dev/null || psql -U postgres -c "CREATE DATABASE dkvroom"

# Push the schema
npx prisma db push
```

#### 4. Port 3000 already in use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`.

**Solution**:
```bash
# Ubuntu: Find and kill the process
lsof -i :3000
kill -9 <PID>

# Windows: Find and kill the process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or start on a different port
npx next dev -p 3001
```

#### 5. File uploads not working

**Problem**: Uploaded files return 404 or upload API returns errors.

**Solution**:
```bash
# Ensure the uploads directory exists and has write permissions
# Ubuntu:
mkdir -p uploads/vehicle_photos uploads/default uploads/receipts uploads/documents
chmod -R 755 uploads

# Windows:
mkdir uploads\vehicle_photos uploads\default uploads\receipts uploads\documents
```

Also verify `UPLOAD_DIR` in `.env` points to the correct directory.

#### 6. Hot reload not working on Ubuntu

**Problem**: File changes are not reflected in the browser.

**Solution**:
```bash
# Increase inotify watch limit (Ubuntu)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Restart the dev server
bun run dev
```

#### 7. Images from Unsplash not loading

**Problem**: Car listing images (hosted on Unsplash) fail to load.

**Solution**: The seed data uses Unsplash URLs. If these are blocked in your region:
1. The images will show broken — this is expected with external URLs
2. You can replace the URLs in `prisma/seed.ts` with local image paths
3. Or configure a proxy/CDN for image hosting

#### 8. JWT errors in production

**Problem**: `Error: JWT_SECRET environment variable is required in production`.

**Solution**:
```bash
# Set the JWT_SECRET environment variable
# Ubuntu:
export JWT_SECRET="your-strong-secret-here"

# Windows PowerShell:
$env:JWT_SECRET="your-strong-secret-here"

# Or set it in .env (never commit .env to version control!)
```

#### 9. PostgreSQL connection issues

**Problem**: `Can't reach database server` or `Connection refused`.

**Solution**:
```bash
# Ensure PostgreSQL is running
# Ubuntu:
sudo systemctl start postgresql

# Windows: Start the PostgreSQL service from Services app or:
pg_ctl start

# macOS:
brew services start postgresql@16

# Then verify the dkvroom database exists:
psql -U postgres -c "CREATE DATABASE dkvroom;" 2>/dev/null || true
```

#### 10. Build fails with out-of-memory error

**Problem**: `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`.

**Solution**:
```bash
# Increase Node.js memory limit
# Ubuntu / Windows:
export NODE_OPTIONS="--max-old-space-size=4096"
bun run build

# Windows PowerShell:
$env:NODE_OPTIONS="--max-old-space-size=4096"
bun run build
```

---

## Quick Start (TL;DR)

### Ubuntu
```bash
sudo apt update && sudo apt install -y build-essential git
curl -fsSL https://bun.sh/install | bash && source ~/.bashrc
git clone <repo-url> dk-vroom && cd dk-vroom
bun install
cp .env.example .env        # then edit .env
bunx prisma generate && bunx prisma db push && bun run db:seed
mkdir -p uploads/vehicle_photos uploads/default uploads/receipts uploads/documents
bun run dev
```

### Windows (PowerShell)
```powershell
# Install Node.js from nodejs.org, then:
powershell -c "irm bun.sh/install.ps1 | iex"
git clone <repo-url> dk-vroom; cd dk-vroom
bun install
notepad .env                 # create .env with config above
npx prisma generate; npx prisma db push; bun run db:seed
mkdir uploads\vehicle_photos uploads\default uploads\receipts uploads\documents
bun run dev
```

Open **http://localhost:3000** and login with `admin@dkvroom.com` / `Admin@123`
