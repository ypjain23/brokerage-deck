'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, BrokerDeal } from '@/lib/supabase';
import { WINCHESTER_SEED } from '@/lib/seed-data';
import { formatCurrency, formatNumber, formatPercent, formatSF } from '@/lib/format';
import { FIRM_STYLES, FirmStyleKey } from '@/lib/firm-styles';

type UploadedFile = { name: string; url: string; type: 'pdf' | 'image' | 'excel' | 'other' };

function fileIcon(type: UploadedFile['type']) {
  if (type === 'pdf') return '📄';
  if (type === 'image') return '🖼️';
  if (type === 'excel') return '📊';
  return '📎';
}

export default function DealDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [deal, setDeal] = useState<Partial<BrokerDeal> | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSeeded = id === 'seed-winchester-001';

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

  // Load previously uploaded files from Supabase storage
  useEffect(() => {
    if (isSeeded) return;
    async function loadFiles() {
      const { data } = await supabase.storage.from('broker-docs').list(id, { limit: 100 });
      if (!data) return;
      const files: UploadedFile[] = data.map((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        const type: UploadedFile['type'] = ext === 'pdf' ? 'pdf'
          : ['jpg','jpeg','png','webp','gif'].includes(ext) ? 'image'
          : ['xls','xlsx','csv'].includes(ext) ? 'excel' : 'other';
        const { data: urlData } = supabase.storage.from('broker-docs').getPublicUrl(`${id}/${f.name}`);
        return { name: f.name, url: urlData.publicUrl, type };
      });
      setUploadedFiles(files);
    }
    loadFiles();
  }, [id, isSeeded]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (isSeeded) return;
    setUploading(true);
    const newFiles: UploadedFile[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const type: UploadedFile['type'] = ext === 'pdf' ? 'pdf'
        : ['jpg','jpeg','png','webp','gif'].includes(ext) ? 'image'
        : ['xls','xlsx','csv'].includes(ext) ? 'excel' : 'other';
      const path = `${id}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from('broker-docs').upload(path, file, { upsert: true });
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('broker-docs').getPublicUrl(data.path);
        newFiles.push({ name: file.name, url: urlData.publicUrl, type });
      }
    }
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setUploading(false);

    // Auto-parse if PDFs were uploaded
    if (newFiles.some(f => f.type === 'pdf')) {
      const allFiles = [...uploadedFiles, ...newFiles];
      setParsing(true);
      try {
        const res = await fetch('/api/parse-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentUrls: allFiles.map(f => f.url),
            fileNames: allFiles.map(f => f.name),
          }),
        });
        const result = await res.json();
        if (result.success && result.data) {
          const d = result.data;
          const updates: Partial<BrokerDeal> = {
            property_name: d.property_name ?? deal?.property_name,
            address: d.address ?? deal?.address,
            city: d.city ?? deal?.city,
            state: d.state ?? deal?.state,
            zip: d.zip ?? deal?.zip,
            asset_type: d.property_type ?? d.asset_class ?? deal?.asset_type,
            size_sf: d.total_sf ?? deal?.size_sf,
            lot_size_acres: d.land_area_acres ?? deal?.lot_size_acres,
            year_built: d.year_built ?? deal?.year_built,
            occupancy: d.occupancy_pct ?? deal?.occupancy,
            tenant_name: d.tenant_name ?? deal?.tenant_name,
            lease_type: d.lease_type ?? deal?.lease_type,
            lease_expiration: d.lease_expiration ?? deal?.lease_expiration,
            walt: d.walt ?? deal?.walt,
            noi: d.noi ?? deal?.noi,
            asking_price: d.asking_price ?? deal?.asking_price,
            cap_rate: d.cap_rate ?? deal?.cap_rate,
            price_per_sf: d.price_per_sf ?? deal?.price_per_sf,
            clear_height_ft: d.clear_height ?? deal?.clear_height_ft,
            dock_doors: d.dock_doors ?? deal?.dock_doors,
            grade_level_doors: d.grade_doors ?? deal?.grade_level_doors,
            auto_parking: d.parking_spaces ?? deal?.auto_parking,
            market: d.submarket ?? deal?.market,
            submarket: d.submarket ?? deal?.submarket,
            zoning: d.zoning ?? deal?.zoning,
            highlights: Array.isArray(d.highlights) ? d.highlights.join('\n') : deal?.highlights,
          };
          setDeal(prev => ({ ...prev, ...updates }));
          await supabase.from('broker_deals').update(updates).eq('id', id);
        }
      } catch { /* silent */ }
      setParsing(false);
    }
  }, [id, isSeeded, deal, uploadedFiles]);

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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  Documents
                </h2>
                {parsing && (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Parsing with AI...
                  </span>
                )}
              </div>

              {/* Drop zone */}
              {!isSeeded && (
                <div
                  onDragEnter={() => setDragActive(true)}
                  onDragLeave={() => setDragActive(false)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors mb-4 ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.csv"
                    className="hidden"
                    onChange={e => e.target.files && handleFiles(e.target.files)}
                  />
                  {uploading ? (
                    <p className="text-sm text-blue-600">Uploading...</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-600">Drop files here or click to upload</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, images, XLS — PDFs are parsed automatically</p>
                    </>
                  )}
                </div>
              )}

              {/* File list */}
              {uploadedFiles.length > 0 ? (
                <ul className="space-y-2">
                  {uploadedFiles.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span>{fileIcon(f.type)}</span>
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 truncate">{f.name}</a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">{isSeeded ? 'Seed deal — upload a real deal to add documents.' : 'No documents yet.'}</p>
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
