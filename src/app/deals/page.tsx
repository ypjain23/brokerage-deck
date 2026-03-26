'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, BrokerDeal } from '@/lib/supabase';
import { WINCHESTER_SEED } from '@/lib/seed-data';
import { formatCurrency, formatSF, formatPercent } from '@/lib/format';

export default function DealsPage() {
  const [deals, setDeals] = useState<Partial<BrokerDeal>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeals() {
      try {
        const { data, error } = await supabase
          .from('broker_deals')
          .select('*')
          .order('updated_at', { ascending: false });

        if (error || !data || data.length === 0) {
          setDeals([WINCHESTER_SEED]);
        } else {
          setDeals(data);
        }
      } catch {
        setDeals([WINCHESTER_SEED]);
      } finally {
        setLoading(false);
      }
    }

    fetchDeals();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="animate-pulse text-[#6b7280] text-lg">Loading deals...</div>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#6b7280] text-6xl mb-4">&#128203;</div>
          <h2
            className="text-2xl font-bold text-[#0d1117] mb-2"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            No deals yet
          </h2>
          <p className="text-[#6b7280] mb-6">
            Create your first deal to get started.
          </p>
          <Link
            href="/deals/new"
            className="inline-block bg-[#2462F5] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1b4fd4] transition-colors"
          >
            Create New Deal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <h1
            className="text-3xl font-bold text-[#0d1117]"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Your Deals
          </h1>
          <span className="inline-flex items-center justify-center bg-[#2462F5] text-white text-sm font-semibold rounded-full px-3 py-0.5">
            {deals.length}
          </span>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deals.map((deal) => (
            <Link
              key={deal.id}
              href={`/deals/${deal.id}`}
              className="block bg-white rounded-2xl shadow hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6 relative">
                {/* Status Badge */}
                <div className="absolute top-6 right-6">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      deal.status?.toLowerCase().includes('active')
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {deal.status?.toLowerCase().includes('active')
                      ? 'Active'
                      : 'Draft'}
                  </span>
                </div>

                {/* Property Name */}
                <h2
                  className="text-xl text-[#0d1117] pr-24 mb-1"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  {deal.property_name}
                </h2>

                {/* Address */}
                <p className="text-[#6b7280] text-sm mb-4">
                  {deal.city}, {deal.state} {deal.zip}
                </p>

                {/* Divider */}
                <hr className="border-gray-200 mb-4" />

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div>
                    <p className="text-[#6b7280] text-xs uppercase tracking-wide mb-1">
                      SF
                    </p>
                    <p className="text-[#0d1117] text-sm font-semibold">
                      {formatSF(deal.total_sf)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6b7280] text-xs uppercase tracking-wide mb-1">
                      Occupancy
                    </p>
                    <p className="text-[#0d1117] text-sm font-semibold">
                      {formatPercent(deal.occupancy_pct)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6b7280] text-xs uppercase tracking-wide mb-1">
                      WALT
                    </p>
                    <p className="text-[#0d1117] text-sm font-semibold">
                      {deal.walt != null ? `${deal.walt} Yrs` : '\u2014'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6b7280] text-xs uppercase tracking-wide mb-1">
                      Cap Rate
                    </p>
                    <p className="text-[#0d1117] text-sm font-semibold">
                      {formatPercent(deal.cap_rate)}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {deal.property_type && (
                    <span className="inline-block bg-[#f8f7f4] text-[#6b7280] text-xs font-medium px-3 py-1 rounded-full">
                      {deal.property_type}
                    </span>
                  )}
                  {deal.asset_class && (
                    <span className="inline-block bg-[#f8f7f4] text-[#6b7280] text-xs font-medium px-3 py-1 rounded-full">
                      {deal.asset_class}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
