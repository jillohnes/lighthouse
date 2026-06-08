# Lighthouse — Trade Program Dashboard

Interactive measurement dashboard for trade program performance, built with Next.js.

## Features

- Filterable dashboard by Brand, Region, Market, and date range
- KPI cards with target-based color coding (green / yellow / red)
- On Premise & Off Premise performance drill-downs
- Targets & Pacing summary
- Collapsible AI Insights panel
- Supabase database integration with Excel import

## Getting Started

### 1. Install dependencies

```bash
corepack pnpm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Add your Supabase credentials to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Set up the database

Run `supabase/schema.sql` in your Supabase SQL Editor.

### 4. Import Excel data

Place your spreadsheet at `data/import.xlsx`, then:

```bash
corepack pnpm import:data
```

See `data/import-template.csv` for the expected column format.

### 5. Run the dev server

```bash
corepack pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm import:data` | Import Excel file into Supabase |

## Tech Stack

- Next.js 16 · React 19 · TypeScript · Tailwind CSS
- Recharts · Supabase · react-day-picker
