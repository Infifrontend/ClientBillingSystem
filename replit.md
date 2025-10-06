# Infiniti CMS - Client Management & Billing System

## Overview

Infiniti CMS is an enterprise-grade client management and billing system designed specifically for airline and travel technology solutions. The application provides comprehensive tools for managing client relationships, service agreements, invoicing, and financial reporting with AI-powered insights for revenue forecasting and client health monitoring.

**Core Functionality:**
- Client lifecycle management with industry-specific categorization (airlines, travel agencies, GDS, OTA, aviation services)
- Service catalog management supporting multiple service types (implementation, change requests, subscriptions, hosting)
- Multi-currency billing and invoicing (INR, USD, EUR)
- Agreement tracking with renewal notifications
- Financial reporting and analytics
- AI-driven insights for revenue forecasting and risk analysis

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework Stack:**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server
- **Wouter** for lightweight client-side routing
- **TanStack Query v5** for server state management and data fetching

**UI Design System:**
- **shadcn/ui** component library with "new-york" style variant
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Radix UI** primitives for accessible, unstyled components
- Custom airline-inspired color palette with aviation blue (214 88% 45%) as primary
- Typography: Inter (UI/body), Montserrat (headings/metrics), JetBrains Mono (financial figures)

**State Management Pattern:**
- Server state handled via TanStack Query with centralized query client
- Authentication state managed through custom `useAuth` hook
- Form state managed with React Hook Form and Zod validation
- No global client state management library (leverages React Query cache)

### Backend Architecture

**Server Framework:**
- **Express.js** with TypeScript for REST API endpoints
- **Node.js** runtime with ESM module system
- Session-based authentication via express-session

**Authentication & Authorization:**
- **Replit Auth** integration using OpenID Connect
- Passport.js strategy for OAuth flow
- Session storage in PostgreSQL via connect-pg-simple
- Role-based access control with enum: admin, finance, csm, manager

**API Design Pattern:**
- RESTful endpoints under `/api` namespace
- Request/response logging middleware
- Centralized error handling with status code mapping
- JSON payload validation using Zod schemas derived from Drizzle

**Key API Routes:**
- `/api/auth/user` - Current user session
- `/api/dashboard/*` - Analytics and statistics
- `/api/clients/*` - Client CRUD operations
- `/api/services/*` - Service management
- `/api/agreements/*` - Agreement lifecycle
- `/api/invoices/*` - Billing and invoicing
- `/api/reports/*` - Financial reporting
- `/api/insights/*` - AI-powered analytics

### Data Architecture

**ORM & Database:**
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** via Neon serverless with WebSocket support
- Schema-first approach with TypeScript inference
- Migration management via drizzle-kit

**Schema Design:**
- **users** - Authentication and role management
- **clients** - Client profiles with industry classification and CSM assignment
- **services** - Service catalog with pricing and billing cycles
- **agreements** - Contract management with status tracking (active, expiring_soon, expired, renewed)
- **invoices** - Billing records with payment status (pending, paid, overdue, cancelled)
- **notifications** - Alert system for payment reminders and renewals
- **ai_insights** - ML-generated forecasts and risk assessments
- **sessions** - Server-side session storage (required for Replit Auth)

**Data Relationships:**
- Clients have many Services and Agreements
- Services belong to Clients and link to Invoices
- Agreements belong to Clients with renewal tracking
- Users are assigned as CSMs to multiple Clients

**Enums & Type Safety:**
- User roles, client status, industry types, service types, currencies, agreement/invoice status defined as PostgreSQL enums
- Drizzle-Zod integration for automatic schema validation
- Full type inference from database schema to API layer

### External Dependencies

**Database:**
- **Neon PostgreSQL** - Serverless Postgres with WebSocket connectivity
- Connection pooling via @neondatabase/serverless
- DATABASE_URL environment variable required

**Authentication Provider:**
- **Replit Auth** - OAuth/OIDC provider
- Required environment variables: REPL_ID, ISSUER_URL, SESSION_SECRET, REPLIT_DOMAINS
- Automatic user provisioning on first login

**Development Tools:**
- **Replit-specific plugins**: cartographer (code mapping), dev-banner, runtime-error-modal
- Google Fonts CDN for typography (Inter, Montserrat, JetBrains Mono)

**Runtime Environment:**
- Node.js with TypeScript compilation via tsx (development) and esbuild (production)
- Vite middleware mode for SSR-like development experience
- Production build outputs to `dist/` directory

**Build & Deployment:**
- Development: `npm run dev` (tsx with Vite HMR)
- Production build: `npm run build` (Vite + esbuild bundling)
- Production start: `npm start` (Node.js ESM execution)
- Database migrations: `npm run db:push` (Drizzle Kit)