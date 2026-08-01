# Warehouse Management ERP Frontend

React-based frontend for a warehouse ERP workflow. The app supports product and SKU management, inventory operations, order processing, warehouse administration, and system configuration for a protected back-office experience.

This repository contains frontend code only. Backend URLs, service credentials, platform tokens, and production secrets must stay outside Git.

## Main Modules

- Dashboard with KPI cards, inventory summaries, order status charts, sales trends, recent orders, and low-stock alerts
- Product Management for merchant SKU products and combine SKU workflows
- Inventory Management for merchant SKUs, SKU mapping, inventory list, manual inbound, inbound/outbound flows, and inventory logs
- Order Management for platform order processing, manual orders, platform manual orders, AfterShip/EasyParcel-related manual order flows, order details, waybill/PDF actions, export, and print tools
- Warehouse Management for warehouse records, defaults, details, and maintenance actions
- System Configuration for store authorization, sub-account management, role management, and permission setup
- Authentication screens for login, registration, forgot password, and email verification
- Multi-language support through `i18next` and `react-i18next`

## Tech Stack

- React 19
- Vite 7
- React Router 7
- TanStack React Query
- TanStack Table
- Zustand
- Tailwind CSS
- Radix UI primitives
- Recharts
- React Hook Form and Zod
- Axios
- Lucide React
- Sonner toast notifications

## Project Structure

```text
src/
  assets/                 Static images and platform logos
  components/             Shared layout, UI, and reusable controls
  features/               Feature modules grouped by business area
  hooks/                  Shared React hooks
  lib/                    API clients, query client, constants, helpers
  router/                 App routes and protected route handling
  stores/                 Zustand stores
  styles/                 Shared styles
  utils/                  Shared utility functions
```

## Environment Variables

Create a local `.env` file from `.env.example`, then replace values with private environment-specific URLs from the backend/deployment owner.

Required or commonly used variables:

```text
VITE_AUTH_BASE_URL=
VITE_AUTH_BASE_LOGIN_URL=
VITE_ORDER_PLATFORM_BASE_URL=
VITE_PLATFORM_API_BASE_URL=
VITE_PDF_MERGE_BASE_URL=
```

Do not commit real API URLs, access tokens, platform secrets, courier credentials, or customer data. Keep `.env` private.

## Local Development

```bash
npm install
npm run dev
```

The Vite app is configured with base path:

```text
/warehouse_management
```

## Available Scripts

```bash
npm run dev      # Start local development server
npm run build    # Create production build
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

## Build

```bash
npm run build
```

The production output is generated in `dist/`.

## Security Notes

- This frontend attaches stored access tokens to protected API requests.
- Do not hardcode secrets, tokens, private server URLs, or customer records in source files.
- Keep generated archives, local logs, and build artifacts out of commits unless the release process explicitly requires them.
- Review `.env.example` before publishing and replace real service URLs with placeholders if needed.

## GitHub Checklist

Before pushing:

```bash
npm run build
npm run lint
```

Also confirm that only intended source files are staged and that `.env`, logs, local archives, and sensitive notes are not included.
