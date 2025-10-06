# Design Guidelines: Client Management & Billing System

## Design Approach: Enterprise Dashboard System
**Selected Framework:** shadcn/ui with airline-inspired corporate theming  
**Rationale:** Enterprise data-heavy application requiring proven patterns for forms, tables, and dashboards with professional aviation industry aesthetics

**Core Principles:**
- Data clarity and accessibility over visual flourish
- Professional, trustworthy airline industry aesthetic
- Efficient workflows for finance and CSM teams
- Responsive across all enterprise devices

---

## Color Palette

**Light Mode:**
- **Primary (Aviation Blue):** 214 88% 45% - for CTAs, active states, key metrics
- **Secondary (Sky Blue):** 204 75% 60% - for accents, charts, secondary actions
- **Background:** 0 0% 100% (white)
- **Surface:** 210 20% 98% (light gray-blue)
- **Border:** 214 20% 88%
- **Text Primary:** 214 25% 15% (deep blue-gray)
- **Text Secondary:** 214 15% 45%

**Dark Mode:**
- **Primary:** 214 85% 55%
- **Secondary:** 204 70% 50%
- **Background:** 222 30% 10% (dark blue-gray)
- **Surface:** 222 25% 14%
- **Border:** 214 20% 22%
- **Text Primary:** 210 15% 95%
- **Text Secondary:** 210 10% 70%

**Status Colors:**
- Success (Active/Paid): 142 76% 36%
- Warning (Expiring/Pending): 38 92% 50%
- Error (Overdue/Inactive): 0 84% 60%
- Info (Forecasts): 199 89% 48%

**Chart Colors:** Use 6-color palette derived from primary/secondary with varying saturations for multi-series data

---

## Typography

**Font Families:**
- **Primary:** Inter (via Google Fonts CDN) - UI elements, body text, data tables
- **Display:** Montserrat (via Google Fonts CDN) - headings, dashboard metrics
- **Monospace:** JetBrains Mono - financial figures, IDs, codes

**Type Scale:**
- **Dashboard Metrics (Display):** text-4xl md:text-5xl, font-bold, Montserrat
- **Page Headers:** text-2xl md:text-3xl, font-semibold, Montserrat
- **Section Headers:** text-xl, font-semibold, Inter
- **Body/Labels:** text-sm md:text-base, font-normal, Inter
- **Data Tables:** text-sm, font-medium, Inter
- **Financial Figures:** text-base md:text-lg, font-semibold, JetBrains Mono
- **Helper Text:** text-xs, font-normal, Inter

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20
- Component internal spacing: p-4, p-6
- Section spacing: py-8, py-12, py-16
- Card gaps: gap-4, gap-6
- Grid gaps: gap-6, gap-8

**Grid System:**
- Dashboard: 12-column grid with responsive breakpoints
- Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 for metrics
- Tables: Full-width with horizontal scroll on mobile
- Forms: max-w-4xl centered, two-column on desktop

**Container Widths:**
- Main content area: max-w-7xl mx-auto px-4 md:px-6
- Data tables: w-full
- Forms: max-w-4xl
- Modals: max-w-2xl for standard, max-w-6xl for complex

---

## Component Library

### Navigation
- **Sidebar:** Fixed left sidebar (280px) with collapsible menu, icon + label navigation, section groupings
- **Top Bar:** Header with company logo, search, notifications bell, user profile dropdown
- **Breadcrumbs:** Show current location path using chevron separators

### Dashboard Cards
- **Metric Cards:** White/surface background, rounded-lg, shadow-sm, p-6
  - Large number (text-4xl) in primary color
  - Label below in secondary text
  - Small trend indicator (↑ 12% from last month)
  - Icon in top-right corner with subtle background circle

### Data Display
- **Tables:** shadcn/ui Table component with:
  - Sticky header with bg-surface
  - Row hover states (hover:bg-surface)
  - Striped rows option (odd:bg-surface/50)
  - Action column (right-aligned) with icon buttons
  - Pagination controls at bottom
  - Sort indicators in headers
  
- **Charts (Recharts):**
  - Line charts for revenue trends
  - Bar charts for client distribution
  - Pie/Donut for payment status breakdown
  - Use consistent color palette
  - Tooltips with white background, shadow-lg
  - Grid lines in subtle gray

### Forms
- **Input Fields:** shadcn/ui components with:
  - Floating labels or top-aligned labels
  - Helper text below in text-xs
  - Error states with red border and message
  - Currency inputs with prefix symbols
  - Date pickers with calendar icon
  
- **Dropdowns:** shadcn/ui Select with search functionality for long lists (Industry/Sector)

- **File Upload:** Drag-and-drop zone with dashed border, cloud upload icon, file type indicators

### Actions
- **Primary Buttons:** bg-primary, text-white, rounded-md, px-6 py-2.5, font-medium
- **Secondary Buttons:** variant="outline", border-primary, text-primary
- **Icon Buttons:** Ghost variant for table actions
- **Danger Actions:** Red background for delete/remove

### Overlays
- **Modals:** shadcn/ui Dialog with backdrop blur, slide-in animation
- **Alerts:** Top-right toast notifications using shadcn/ui Sonner
- **Tooltips:** shadcn/ui Tooltip with black background, white text, small arrow

---

## Module-Specific Layouts

### Dashboard (Home)
- **Top Section:** 4-column metric cards (Total Clients, Active Agreements, Monthly Revenue, Outstanding)
- **Middle Section:** 2-column layout - Revenue chart (left 2/3) + Quick Actions (right 1/3)
- **Bottom Section:** Recent activity table + Upcoming renewals widget

### Client Management
- **List View:** Filterable table with search, status filter, region filter
- **Detail View:** Two-column layout - Client info (left) + Services/Agreements tabs (right)
- **Create/Edit:** Centered form with sections (Basic Info, Contact Details, Billing Info)

### Reports
- **Filter Panel:** Top horizontal bar with date range, client selector, currency, export button
- **Results Display:** Table below with summary cards above
- **Export Options:** Dropdown with Excel/PDF/CSV icons

---

## Animations
**Minimal Approach:**
- Page transitions: Subtle fade-in (200ms)
- Card hover: Slight scale(1.01) with shadow increase
- Button states: Opacity changes only
- Loading states: Spinner or skeleton screens (no elaborate animations)

---

## Images
**Logo/Branding:** 
- Company logo (Infiniti Software Solutions) in top-left of sidebar
- Client logos in client cards (circular avatars, 40px)

**Illustrations:**
- Empty states: Simple line illustrations for "No clients yet", "No pending invoices"
- Error states: Minimal aviation-themed icon

**No hero image required** - this is a dashboard application, not a marketing site