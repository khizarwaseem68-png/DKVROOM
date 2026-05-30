# Task 5: Admin Dashboard Overhaul

## Work Summary

Overhauled the admin dashboard component (`src/components/admin-dashboard.tsx`) with the following changes:

### 1. Replaced luxury fonts with dashboard fonts
- All `heading-md` → `dash-heading-md` (6 instances)
- All `heading-sm` → `dash-heading-sm` (8 instances)
- No `heading-lg` instances were found in the file
- These use normal sans-serif instead of Playfair Display

### 2. Added ID column with short readable IDs
- Added "ID" column as FIRST column in all 4 table views: dealers, cars, loans, payments
- Each ID cell shows first 8 characters of UUID in a `<code>` element with copy button
- Copy button uses `navigator.clipboard.writeText()` and `toast.success('ID copied!')`
- Added `Copy` import from `lucide-react` and `toast` from `sonner`
- For payments table, replaced the old "Transaction ID" column (which showed full UUID) with the new short ID + copy format

### 3. Card Skeletons for Loading States
Replaced all `LoadingState` components with card-shaped skeleton grids:
- **Dealers loading**: 6-card grid (1/2/3 cols responsive) with skeleton lines
- **Cars loading**: 6-card grid with photo placeholder skeleton
- **Payments loading**: 6-card grid with skeleton lines
- **Loans loading**: 6-card grid with skeleton lines
- **Bookings loading**: 6-card grid with skeleton lines
- **Analytics Top Dealers**: 3-row skeleton list
- Removed `LoadingState` from imports (no longer used)

### 4. Added Sign Out to Sidebar and Top Bar
- **Desktop sidebar**: Added Sign Out button below "Back to Site" in bottom section
- **Mobile sidebar**: Added "Back to Site" and Sign Out buttons in bottom section
- **Top bar**: Replaced static user info with `DropdownMenu` containing Sign Out option
- Sign Out uses `logout()` from store and `router.push('/')` for navigation
- Added `LogOut` import from `lucide-react`, `DropdownMenu*` from shadcn, `useRouter` from next/navigation

### 5. Dynamic Notifications
- Replaced static Bell button + red dot with `<NotificationDropdown />` component
- Imported from `@/components/shared`
- Removed `Bell` from lucide-react imports

### 6. Fixed Overview Alignment
- Updated "Back to Site" button to use `router.push('/')` instead of `goBack()`
- Removed unused `goBack` from store destructuring
- All section titles use `dash-heading-sm` (left-aligned via CardTitle)
- Stats grid uses consistent `grid-cols-2 lg:grid-cols-4 gap-4`
- Quick stats in platform overview use `grid-cols-2 sm:grid-cols-4 gap-4` for even spacing

### 7. Import Changes
Added imports:
- `useRouter` from `next/navigation`
- `LogOut, Copy` from `lucide-react`
- `NotificationDropdown` from `@/components/shared`
- `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger` from `@/components/ui/dropdown-menu`
- `toast` from `sonner`

Removed imports:
- `LoadingState` from `@/components/shared`
- `Bell` from `lucide-react`

Component additions:
- `const logout = useAppStore((state) => state.logout)`
- `const router = useRouter()`

## Lint Results
- Only warnings about `<img>` vs `<Image />` (pre-existing, same pattern as other dashboards)
- No errors in admin-dashboard.tsx
