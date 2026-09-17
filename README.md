# House Manager — Web

CSE 400 Software Development IV (Fall 2026) course project. A web rebuild
of the [house-manager](https://github.com/gitsifat091/house-manager) Flutter
app, using React + Firebase.

This is a **separate Firebase project** from the Flutter app — do not point
it at the same one unless you intend to share data between them.

## Stack

- React 18 + Vite
- React Router for role-based routing (landlord vs tenant)
- Firebase Auth, Firestore, Storage
- Tailwind CSS (via CDN in `index.html`, no build step needed)

## Setup

1. Create a new Firebase project at https://console.firebase.google.com
2. Enable **Authentication → Email/Password**
3. Enable **Firestore Database** (start in test mode for development)
4. Enable **Storage** if you'll handle images/documents
5. In Project Settings → General, add a Web App and copy the config values
6. Copy `.env.example` to `.env` and fill in the values:
   ```
   cp .env.example .env
   ```
7. Install dependencies and run:
   ```
   npm install
   npm run dev
   ```
8. Deploy Firestore rules (once you have the Firebase CLI set up):
   ```
   firebase deploy --only firestore:rules
   ```

## What's built (Phase 1)

- Auth: login, register (role selection), forgot password
- Role-based routing: landlords land on `/landlord`, tenants on `/tenant`
- Landlord: Properties page (full CRUD — add/edit/delete/list as To-Let)
- Tenant: Find Home page (browses listed properties)
- Shared dashboard layout with sidebar nav

## What's next (Phase 2 / 3)

Each nav item in `LandlordDashboard.jsx` / `TenantDashboard.jsx` that
currently shows a placeholder needs its own page component, following the
same pattern as `PropertiesPage.jsx`:

**Landlord**: Rooms, Tenants, Payments, Maintenance, Utilities, Notices,
Rules, Rental Requests, Chat, Analytics

**Tenant**: Payments, Maintenance, Utilities, Notices, Rules, History,
Community, Chat, Profile

Each domain gets:
1. A service file in `src/services/` (Firestore CRUD, same shape as
   `propertyService.js`)
2. A page component in `src/pages/landlord/` or `src/pages/tenant/`
3. A line added to that dashboard's `NAV_ITEMS` and render block

## Project structure

```
src/
  firebase.js           # Firebase init
  App.jsx                # Routes
  main.jsx               # Entry point
  context/AuthContext.jsx
  components/
    ProtectedRoute.jsx
    DashboardLayout.jsx
  services/               # Firestore CRUD, one file per domain
    authService.js
    propertyService.js
    roomService.js
    tenantService.js
  pages/
    auth/
    landlord/
    tenant/
```
