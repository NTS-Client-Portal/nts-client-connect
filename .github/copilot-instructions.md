# NTS Logistics Platform - Copilot Instructions

## Project Overview
NTS Logistics is a freight brokerage platform connecting shippers (customers) with NTS brokers who manage their shipping needs. The platform handles quote requests, pricing, order management, and company-broker assignments.

---

## Core Business Model

### User Types
1. **Shippers** - Customer users who request freight quotes
   - Self-signup with company information
   - Can create quotes, view pricing, accept/reject quotes
   - Multiple shippers can belong to same company
   
2. **NTS Users (Brokers)** - Internal staff who manage shippers
   - Admin-created only (no self-signup)
   - Two roles: `admin` (can invite/remove users) and `user` (regular broker)
   - Each broker is assigned entire companies (not individual shippers)

### Quote → Order Lifecycle
1. **Shipper** creates a quote request with freight details
2. **Broker** (assigned to that company) prices the quote
3. **Shipper** reviews and either accepts or rejects
4. **Accepted quotes** become **orders** (separate table)
5. **Broker** manages order through delivery

---

## Database Schema (Refactored 2026)

### Core Tables

**companies**
- Represents shipper organizations
- Each company has ONE assigned broker (`assigned_broker_id`)
- Multiple shippers can belong to one company

**shippers** (formerly `profiles`)
- Customer user accounts
- Linked to `companies` via `company_id`
- References `auth.users` for authentication

**nts_users**
- Internal staff/broker accounts
- Role: `admin` or `user`
- References `auth.users` for authentication
- Admins created by superadmin only

**quotes**
- Pre-acceptance quote requests
- Status: `pending`, `priced`, `accepted`, `rejected`
- Linked to shipper, company, and assigned broker

**orders**
- Accepted quotes that became active shipments
- Contains snapshot of quote data at acceptance time
- Status: `pending`, `carrier_assigned`, `picked_up`, `in_transit`, `delivered`, `cancelled`
- Tracks carrier information and delivery dates

**edit_requests**
- Shippers can request changes to quotes
- Broker must approve/reject with notes
- Sends notifications and emails on review

**notifications**
- In-app notifications for both user types
- Tracks read/unread status

**documents** & **templates**
- Document generation system
- Templates use shortcodes replaced with quote/order data

**edit_history**
- Audit trail for all quote/order changes
- Tracks who made changes and what changed

### Key Relationships
```
companies (1) ←→ (1) nts_users (assigned_broker_id)
companies (1) ←→ (many) shippers (company_id)
shippers (1) ←→ (many) quotes (shipper_id)
quotes (1) ←→ (0-1) orders (quote_id)
```

---

## Authentication Flows

### Shipper Signup
1. User fills multi-step form (email/password → personal info → company info)
2. Creates `auth.users` record
3. Creates `companies` record with UUID
4. Creates `shippers` record linked to company
5. Auto-login and redirect to dashboard

### NTS User Creation
- Admin-only function
- Creates `auth.users` record
- Creates `nts_users` record with role
- No self-signup form exists

### Login
- Both user types use same login page
- `_app.tsx` determines user type by checking both tables
- Redirects to appropriate dashboard
- Uses context providers: `ProfilesUserProvider` for shippers, `NtsUsersProvider` for NTS users

---

## Project Structure (App Router)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Dashboard shell with navigation
│   │   ├── quotes/             # Quote management
│   │   ├── orders/             # Order tracking
│   │   ├── companies/          # Admin: company/broker assignment
│   │   ├── analytics/          # Dashboard analytics
│   │   └── settings/           # User settings
│   └── layout.tsx
├── components/
│   ├── ui/                     # Shadcn/UI primitives
│   ├── quotes/                 # Quote-specific components
│   ├── orders/                 # Order-specific components
│   ├── companies/              # Company management
│   └── shared/                 # Shared across features
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server-side client
│   │   └── types.ts           # Generated DB types
│   ├── hooks/                 # Custom React hooks
│   ├── utils/                 # Utility functions
│   └── validations/           # Zod schemas
└── types/
    └── database.ts
```

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** Railway PostgreSQL
- **Auth:** NextAuth.js with PostgreSQL adapter
- **Styling:** Tailwind CSS + Shadcn UI
- **Deployment:** Vercel (or Netlify)
- **State:** React Context (no Redux)
- **Forms:** React Hook Form + Zod validation
- **Email:** SendGrid (via API routes)

---

## Key Features

### For Shippers
- Self-signup with company information
- Create quote requests with detailed freight info
- View assigned broker and quote status
- Accept/reject priced quotes
- Request edits to quotes (broker must approve)
- View quote history and order tracking
- Analytics dashboard (recent orders, shipping calendar)
- Notification system

### For Brokers (NTS Users)
- View all quotes for assigned companies
- Price quote requests
- Manage orders through delivery
- Approve/reject edit requests
- Assign carriers to orders
- Update order status
- View company contacts (all shippers in assigned companies)
- Analytics/CRM dashboard

### For Admins (NTS Users with admin role)
- All broker features plus:
- Invite new NTS users
- Remove NTS users
- Assign/reassign brokers to companies
- Manage company list

---

## Important Patterns

### Query Patterns
- Always query by `id` (not email) for performance
- Use `session?.user?.id` as stable dependency (not full session object)
- Use `.maybeSingle()` for nullable queries (not `.single()`)
- Combine OR conditions in single call: `.or('cond1,cond2')`

### Component Organization
- Feature-based folders (quotes/, orders/, companies/)
- Shared UI components in ui/ and shared/
- Keep business logic in hooks and utils
- Server components by default, client only when needed

### Role Checking
- Simple role system: only `admin` and `user` in `nts_users.role`
- No complex RBAC - keep it simple for MVP
- Check user type in `_app.tsx` by table presence

### Error Handling
- Use try/catch with user-friendly error messages
- Log errors to console for debugging
- Show toast notifications for user feedback

---

## Code Style Preferences

- Use functional components with hooks (no class components)
- Prefer const over let
- Use TypeScript strict mode
- Keep components small and focused (<200 lines)
- Extract complex logic to custom hooks
- Use descriptive variable names
- Comment complex business logic

---

## Common Operations

### Creating a Quote
1. Fetch shipper's company_id
2. Insert into quotes table with shipper_id and company_id
3. Auto-assign company's broker via company.assigned_broker_id
4. Send notification to broker

### Accepting a Quote
1. Create order record with quote data snapshot
2. Update quote status to 'accepted'
3. Send notification to broker
4. Redirect shipper to orders page

### Assigning Broker to Company
1. Update companies.assigned_broker_id
2. All shippers in that company now see that broker
3. Broker sees all quotes/orders for that company

---

## Database Conventions

- Use UUIDs for user-related IDs (auth.users linkage)
- Use BIGSERIAL for auto-incrementing IDs (quotes, orders, etc.)
- All tables have `created_at` and `updated_at` timestamps
- Use TEXT for variable-length strings
- Use JSONB for flexible data (shipment_items, changes)
- Status fields use CHECK constraints for valid values
- Foreign keys use ON DELETE CASCADE where appropriate

---

## Migration Notes (2026 Refactor)

### What Changed
- Renamed `profiles` → `shippers` for clarity
- Split `shippingquotes` → `quotes` + `orders`
- Removed complex RBAC (simplified to admin/user)
- Deleted unused tables (boats, freight, etc.)
- Moved from Pages Router → App Router
- Removed `company_sales_users` junction (1:1 broker assignment)
- Cleaned up duplicate company fields

### What Stayed
- Dual user table system (shippers + nts_users)
- Edit request workflow
- Document generation system
- Notification system
- Core quote/order business logic

---

## Testing Approach

- Test on localhost with `netlify dev`
- Use real Supabase instance (not mocks)
- Seed test data for both user types
- Test complete user flows end-to-end
- Check responsive design (mobile/tablet/desktop)

---

## Deployment

- **Platform:** Netlify
- **Environment:** Production uses environment variables
- **Database:** Supabase hosted PostgreSQL
- **Functions:** Netlify serverless functions for email, admin operations
- **Build:** Next.js static + serverless functions

---

## Current State (Post-Refactor)

The platform is being rebuilt from scratch on a new branch with:
- Clean Next.js App Router architecture
- Simplified database schema
- Organized component structure
- Modern React patterns
- TypeScript throughout
- Focus on core MVP features

Priority is shipping a clean, working MVP with the essential quote-to-order workflow, then iterating with additional features.

