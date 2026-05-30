# Task 3: Dealer Dashboard Overhaul

## Summary
Overhauled the dealer dashboard component with all 9 requested changes.

## Changes Made to `/home/z/my-project/src/components/dealer-dashboard.tsx`

### 1. Replace luxury fonts with normal dashboard fonts
- All `heading-md` classes → `dash-heading-md`
- All `heading-sm` classes → `dash-heading-sm`
- No `heading-lg` instances found in file

### 2. Fix Hero/Overview section alignment
- Stats cards already had consistent `p-4 sm:p-6` padding
- Headings are left-aligned (default by CardTitle)
- Quick actions grid properly aligned with `grid grid-cols-1 sm:grid-cols-3`

### 3. Convert listings from TABLE to CARD GRID
- Replaced desktop `<table>` + mobile cards with a single `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">` card grid for all screen sizes
- Each card has: photo with aspect-[16/10], VehicleTypeBadge, StatusBadge, Featured badge, brand/model, year, price, city with MapPin icon, and action buttons (Edit, Delete, Feature toggle)

### 4. Make Edit Button Work
- Added `editingCarId` state
- Added `handleEditCar(car: CarItem)` function that populates form fields and switches to addCar tab
- Updated `handleAddCar` to call `carsApi.update(editingCarId, carData)` when editing, or `carsApi.create(carData)` when adding
- Updated `resetForm()` to clear `editingCarId`
- Card title shows "Edit Car" vs "Add New Car" based on editingCarId
- Added Cancel button next to Submit when in edit mode

### 5. Add Signout to Sidebar and Top Bar
- **Desktop sidebar**: Added Sign Out button below "Back to Site" with `LogOut` icon and red styling
- **Mobile sidebar**: Same Sign Out button added
- **Top bar**: Replaced static avatar with `DropdownMenu` containing "Sign Out" option
- Changed "Back to Site" from `goBack()` to `router.push('/')`
- Imported `useRouter` from `next/navigation`, `logout` from store

### 6. Add Dynamic Notifications
- Replaced static Bell button with `<NotificationDropdown />` component
- Imported from `@/components/shared`

### 7. Card Skeletons for Loading State
- Replaced `<LoadingState message="Loading listings..." />` with animated pulse card skeletons
- 6 skeleton cards matching the card grid layout

### 8. Import LogOut from lucide-react
- Added `LogOut` to lucide-react imports
- Removed `Bell` from lucide-react imports (no longer needed directly)

### 9. Import useRouter from next/navigation
- Added `import { useRouter } from 'next/navigation'`
- Used in component: `const router = useRouter()`
- Updated "Back to Site" to use `router.push('/')`

## Additional Fix
- Fixed `app-shell.tsx`: Corrected JSX closing tag (`</AppShellWrapper>` → `</AppShell>`)
- Fixed `layout.tsx`: Changed named import `{ AppShellWrapper }` to default import `AppShellWrapper`

## Lint Results
- Only `<img>` warnings (existing pattern, same as before)
- No errors

## Files Modified
- `src/components/dealer-dashboard.tsx` — All 9 changes
- `src/components/app-shell.tsx` — Fixed JSX closing tag bug
- `src/app/layout.tsx` — Fixed import style for AppShellWrapper
