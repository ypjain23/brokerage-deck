'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, BrokerDeal } from '@/lib/supabase';
import { WINCHESTER_SEED } from '@/lib/seed-data';
import { formatCurrency, formatNumber, formatPercent, formatSF } from '@/lib/format';
import { FIRM_STYLES, FirmStyleKey } from '@/lib/firm-styles';

export default function DealDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [deal, setDeal] = useState<Partial<BrokerDeal> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeal() {
      if (id === 'seed-winchester-001') {
        setDeal(WINCHESTER_SEED);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('broker_deals')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          setDeal(WINCHESTER_SEED);
        } else {
          setDeal(data);
        }
      } catch {
        setDeal(WINCHESTER_SEED);
      }

      setLoading(false);
    }

    fetchDeal();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Deal not found.</p>
      </div>
    );
  }

  const firmStyle = deal.firm_style
    ? FIRM_STYLES[deal.firm_style as FirmStyleKey]
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/deals"
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
          >
            &larr; Back to Deals
          </Link>

          <div className="flex flex-wrap items-start gap-3 mt-2">
            <h1
              className="text-3xl font-bold text-gray-900"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {deal.property_name}
            </h1>

            {deal.status && (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  deal.status === 'Active Listing' || deal.status === 'Active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {deal.status}
              </span>
            )}

            {firmStyle && (
              <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-medium">
                {firmStyle.displayName}
              </span>
            )}
          </div>

          <p className="text-gray-500 mt-1">
            {deal.address}, {deal.city}, {deal.state} {deal.zip}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6">
            <p
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {formatSF(deal.total_sf)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Total SF</p>
          </div>
          <div className="bg-white rounded-xl p-6">
            <p
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {formatPercent(deal.occupancy_pct)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Occupancy</p>
          </div>
          <div className="bg-white rounded-xl p-6">
            <p
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {deal.walt != null ? `${deal.walt} Yrs` : '—'}
            </p>
            <p className="text-sm text-gray-500 mt-1">WALT</p>
          </div>
          <div className="bg-white rounded-xl p-6">
            <p
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {formatPercent(deal.cap_rate)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Cap Rate</p>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Property Details */}
            <div className="bg-white rounded-xl p-6">
              <h2
                className="text-xl font-semibold text-gray-900 mb-4"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Property Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {([
                  ['Property Type', deal.property_type],
                  ['Asset Class', deal.asset_class],
                  ['Year Built', deal.year_built],
                  ['Clear Height', deal.clear_height],
                  ['Dock Doors', deal.dock_doors],
                  ['Grade Doors', deal.grade_doors],
                  ['Buildings', deal.num_buildings],
                  ['Parking', deal.parking_spaces != null ? `${formatNumber(deal.parking_spaces)} spaces` : null],
                  ['Zoning', deal.zoning],
                  ['Submarket', deal.submarket],
                  ['County', deal.county],
                ] as [string, string | number | null | undefined][]).map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {value != null ? String(value) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Investment Highlights */}
            <div className="bg-white rounded-xl p-6">
              <h2
                className="text-xl font-semibold text-gray-900 mb-4"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Investment Highlights
              </h2>
              {deal.highlights && deal.highlights.length > 0 ? (
                <ul className="space-y-3">
                  {deal.highlights.map((highlight, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1.5 text-xs">&#9679;</span>
                      <span className="text-sm text-gray-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">No investment highlights yet.</p>
              )}
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl p-6">
              <h2
                className="text-xl font-semibold text-gray-900 mb-4"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Documents
              </h2>
              {deal.documents && deal.documents.length > 0 ? (
                <ul className="space-y-2">
                  {deal.documents.map((doc, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      {doc}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">No documents uploaded yet.</p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Financial Summary */}
            <div className="bg-white rounded-xl p-6">
              <h2
                className="text-xl font-semibold text-gray-900 mb-4"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Financial Summary
              </h2>
              <div className="space-y-3">
                {([
                  ['Asking Price', formatCurrency(deal.asking_price)],
                  ['Cap Rate', formatPercent(deal.cap_rate)],
                  ['Price / SF', formatCurrency(deal.price_per_sf)],
                  ['NOI', formatCurrency(deal.noi)],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate OM */}
            <Link href={`/deals/${id}/om`} className="block">
              <div
                className="rounded-xl p-6 text-white"
                style={{
                  background: 'linear-gradient(135deg, #2462F5, #1a4fd4)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Generate Offering Memorandum</h3>
                    <p className="text-sm text-blue-100 mt-1">
                      AI-powered OM with firm-specific styling
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Generate BOV */}
            <Link href={`/deals/${id}/bov`} className="block">
              <div
                className="rounded-xl p-6 text-white"
                style={{
                  background: 'linear-gradient(135deg, #0d1117, #161b22)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Generate Broker Opinion of Value</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Three-approach valuation with AI comps
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
