# Native AI Brokerage — Broker Platform

AI-native operating system for the commercial broker. Upload deal documents, generate firm-styled Offering Memorandums, and produce Broker Opinions of Value — all powered by Claude.

## Setup

### 1. Environment Variables

Copy `.env.local` and fill in your keys:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-anthropic-key
```

### 2. Supabase Setup

#### Create Auth User
In the Supabase Auth dashboard, manually create:
- **Email:** `yash@hempsteadcap.com`
- **Password:** (set a secure password)

#### Create Storage Bucket
In Supabase Storage, create a bucket:
- **Name:** `broker-docs`
- **Public:** Yes (enable public read access)

#### Create Database Table
Run this SQL in the Supabase SQL Editor:

```sql
CREATE TABLE broker_deals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  property_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  property_type TEXT,
  asset_class TEXT,
  total_sf NUMERIC,
  land_area_acres NUMERIC,
  year_built INTEGER,
  occupancy_pct NUMERIC,
  num_tenants INTEGER,
  num_buildings INTEGER,
  clear_height TEXT,
  dock_doors INTEGER,
  grade_doors INTEGER,
  asking_price NUMERIC,
  cap_rate NUMERIC,
  price_per_sf NUMERIC,
  noi NUMERIC,
  walt NUMERIC,
  zoning TEXT,
  parking_spaces INTEGER,
  submarket TEXT,
  county TEXT,
  highlights JSONB DEFAULT '[]',
  status TEXT DEFAULT 'Draft',
  firm_style TEXT,
  photos JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]',
  om_draft JSONB,
  bov_draft JSONB
);

-- Enable RLS (optional for development)
ALTER TABLE broker_deals ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (development policy)
CREATE POLICY "Allow all for authenticated" ON broker_deals
  FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER broker_deals_updated_at
  BEFORE UPDATE ON broker_deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3. Run Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000/deals`

### 4. Deploy

```bash
vercel --yes
```

## Features

- **Deal Management** — Upload documents, AI-extract deal data, review and edit
- **OM Generator** — Firm-styled Offering Memorandums (CBRE, Cushman, JLL, M&M, Newmark)
- **BOV Tool** — Three-approach valuation with AI-powered comp research
- **PDF Export** — Branded PDF documents for OMs and BOVs
- **Venture Deck** — Available at `/deck.html`

## Firm Style Profiles

The OM generator matches the exact voice, structure, and vocabulary of 5 major CRE brokerage firms, extracted from 9 real offering memorandums.
