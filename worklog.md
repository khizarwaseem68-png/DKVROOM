# Worklog: Fix Dealer Dashboard Car Photo Upload & Add Cover Photo Management

## Date: 2025-01-24

## Task Summary
Fixed the fake photo upload in the dealer dashboard's "Add Car" tab and added cover photo management and delete car functionality.

## Changes Made

### 1. Imports Added
- `useRef` from React
- `uploadApi` from `@/lib/api`
- `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger` from `@/components/ui/dropdown-menu`
- `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle` from `@/components/ui/alert-dialog`
- `MoreVertical` from `lucide-react`

### 2. State Changes
- Changed `carPhotos` from `useState<string[]>([])` to `useState<Array<{ url: string; name: string }>>([])`
- Added `uploadingPhotos` state for upload progress tracking
- Added `deleteCarId` state for delete confirmation dialog
- Added `fileInputRef` using `useRef<HTMLInputElement>(null)`

### 3. Real Photo Upload (replaces fake upload)
- Added hidden `<input type="file" multiple accept="image/jpeg,image/png,image/webp" />` with ref
- Upload area onClick now triggers `fileInputRef.current?.click()`
- `handlePhotoUpload` function uploads each file via `uploadApi.upload(file, 'vehicle_photos')`
- Shows loading spinner while uploading
- Image previews now show actual uploaded images using `<img src={photo.url} />`
- Max 10 photos enforced
- "+" button also triggers file picker instead of fake placeholder

### 4. Cover Photo Management
- Each photo thumbnail shows a dropdown menu on hover (three-dot button)
- Dropdown contains "Set as Cover" (moves photo to position 0) and "Delete" options
- Cover photo (index 0) does NOT show "Set as Cover" option, only "Delete"
- Cover photo still shows "Cover" badge
- `setAsCover(idx)` moves the selected photo to position 0
- `removePhoto(idx)` removes the photo from the array

### 5. Updated handleAddCar
- Changed `photos: JSON.stringify(carPhotos)` to `photos: JSON.stringify(carPhotos.map(p => p.url))`
- Now stores actual upload URLs instead of fake string paths

### 6. Delete Car Functionality
- Delete buttons in listings (both desktop table and mobile cards) now have `onClick={() => setDeleteCarId(car.id)}`
- AlertDialog confirmation dialog appears before deletion
- `handleDeleteCar` calls `carsApi.delete(deleteCarId)` and refreshes listings/stats
- Cancel button closes dialog without deleting

### 7. Reset Form
- Added `setUploadingPhotos(false)` to `resetForm()`

## Files Modified
- `src/components/dealer-dashboard.tsx` - All changes in this single file

## Lint Results
- Only warnings about `<img>` vs `<Image />` from Next.js (same pattern as existing code)
- No errors
---
Task ID: 1
Agent: Main Agent
Task: Stepper form, file upload fixes, cover photo management, test cases

Work Log:
- Fixed uploadApi.upload() to accept optional category parameter (api.ts + apiUpload helper)
- Fixed register API to save icDocumentUrl, licenseDocumentUrl, registrationDocUrl
- Rewrote auth-page.tsx with 4-step stepper form for both Customer and Dealer registration
- Added wider form (max-w-2xl instead of max-w-lg)
- Added FileUploadBox with Change/Delete buttons and upload progress
- Added Review step showing summary before submission
- Fixed dealer-dashboard.tsx: replaced fake photo upload with real file upload using uploadApi
- Added cover photo management with three-dot dropdown menu (Set as Cover / Delete)
- Added delete car functionality with AlertDialog confirmation
- Created comprehensive test cases MD file with 175 test cases across 16 modules
- Build passes successfully, APIs verified working

Stage Summary:
- Auth page: Stepper form with 4 steps per role, file upload with change/delete
- Dealer dashboard: Real photo upload, cover photo management, delete car with confirmation
- API: uploadApi supports category, register saves document URLs
- Test cases: 175 TCs in /home/z/my-project/download/DK-Vroom-Test-Cases.md
