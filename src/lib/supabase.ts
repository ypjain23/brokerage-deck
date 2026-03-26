import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type BrokerDeal = {
  id: string;
  created_at: string;
  updated_at: string;
  property_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  property_type: string;
  asset_class: string;
  total_sf: number | null;
  land_area_acres: number | null;
  year_built: number | null;
  occupancy_pct: number | null;
  num_tenants: number | null;
  num_buildings: number | null;
  clear_height: string | null;
  dock_doors: number | null;
  grade_doors: number | null;
  asking_price: number | null;
  cap_rate: number | null;
  price_per_sf: number | null;
  noi: number | null;
  walt: number | null;
  zoning: string | null;
  parking_spaces: number | null;
  submarket: string | null;
  county: string | null;
  highlights: string[] | null;
  status: string;
  firm_style: string | null;
  photos: string[] | null;
  documents: string[] | null;
  om_draft: any | null;
  bov_draft: any | null;
};
