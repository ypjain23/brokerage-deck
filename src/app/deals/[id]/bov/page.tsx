'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, BrokerDeal } from '@/lib/supabase';
import { WINCHESTER_SEED } from '@/lib/seed-data';
import { formatCurrency, formatNumber, formatPercent, formatSF } from '@/lib/format';
import { FIRM_STYLES, FirmStyleKey } from '@/lib/firm-styles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Comp {
  address: string;
  city: string;
  sale_price: number;
  sale_date: string;
  sf: number;
  price_per_sf: number;
  cap_rate: number;
  distance_miles: number;
}

interface IncomeInputs {
  grossPotentialRent: number;
  vacancyRate: number;
  operatingExpenses: number;
  capRate: number;
}

interface CostInputs {
  replacementCostPerSF: number;
  landValue: number;
  depreciation: number;
}

interface Weights {
  income: number;
  salesComp: number;
  cost: number;
}

interface BovDraft {
  incomeInputs: IncomeInputs;
  comps: Comp[];
  costInputs: CostInputs;
  weights: Weights;
  narrative: string;
  reconciledValue: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function currencyFull(value: number | null | undefined): string {
  if (value === null || value === undefined) return '$0';
  return '$' + Math.round(value).toLocaleString();
}

function pctLabel(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// PDF generation (dynamic import of @react-pdf/renderer)
// ---------------------------------------------------------------------------

async function generateBovPdf(
  deal: Partial<BrokerDeal>,
  incomeInputs: IncomeInputs,
  comps: Comp[],
  costInputs: CostInputs,
  weights: Weights,
  narrative: string,
  incomeValue: number,
  salesCompValue: number,
  costValue: number,
  reconciledValue: number,
) {
  const ReactPDF = await import('@react-pdf/renderer');
  const { Document, Page, Text, View, StyleSheet, pdf } = ReactPDF;

  const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4, color: '#0d47a1' },
    subtitle: { fontSize: 12, color: '#555', marginBottom: 20 },
    sectionHeader: { fontSize: 14, fontWeight: 'bold', marginTop: 16, marginBottom: 8, color: '#0d47a1', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
    label: { fontSize: 10, color: '#555' },
    value: { fontSize: 10, fontWeight: 'bold' },
    reconciledBox: { marginTop: 16, padding: 12, backgroundColor: '#e8f5e9', borderRadius: 4 },
    reconciledLabel: { fontSize: 11, color: '#2e7d32' },
    reconciledValue: { fontSize: 20, fontWeight: 'bold', color: '#1b5e20', marginTop: 4 },
    narrativeText: { fontSize: 9, lineHeight: 1.5, color: '#333', marginTop: 8 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', paddingVertical: 4, paddingHorizontal: 2, marginTop: 8 },
    tableHeaderCell: { fontSize: 8, fontWeight: 'bold', color: '#555' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#eee', paddingVertical: 3, paddingHorizontal: 2 },
    tableCell: { fontSize: 8 },
    disclaimer: { marginTop: 20, fontSize: 7, color: '#999', lineHeight: 1.4 },
    pageNumber: { position: 'absolute', bottom: 20, right: 40, fontSize: 8, color: '#999' },
  });

  const firmStyle = deal.firm_style ? FIRM_STYLES[deal.firm_style as FirmStyleKey] : null;

  const doc = (
    <Document>
      {/* Page 1 */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Broker Opinion of Value</Text>
        <Text style={styles.subtitle}>
          {deal.property_name} | {deal.address}, {deal.city}, {deal.state} {deal.zip}
        </Text>

        {/* Property overview */}
        <View style={styles.row}><Text style={styles.label}>Property Type</Text><Text style={styles.value}>{deal.property_type || '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Total SF</Text><Text style={styles.value}>{deal.total_sf ? formatSF(deal.total_sf) : '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Year Built</Text><Text style={styles.value}>{deal.year_built || '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Occupancy</Text><Text style={styles.value}>{deal.occupancy_pct != null ? `${deal.occupancy_pct}%` : '—'}</Text></View>

        {/* Income Approach */}
        <Text style={styles.sectionHeader}>Income Approach</Text>
        <View style={styles.row}><Text style={styles.label}>Gross Potential Rent</Text><Text style={styles.value}>{currencyFull(incomeInputs.grossPotentialRent)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Vacancy Rate</Text><Text style={styles.value}>{pctLabel(incomeInputs.vacancyRate)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Operating Expenses</Text><Text style={styles.value}>{currencyFull(incomeInputs.operatingExpenses)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Cap Rate</Text><Text style={styles.value}>{pctLabel(incomeInputs.capRate)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Indicated Value</Text><Text style={styles.value}>{currencyFull(incomeValue)}</Text></View>

        {/* Sales Comparison */}
        <Text style={styles.sectionHeader}>Sales Comparison Approach</Text>
        <View style={styles.row}><Text style={styles.label}>Avg $/SF</Text><Text style={styles.value}>{comps.length > 0 ? '$' + (comps.reduce((s, c) => s + c.price_per_sf, 0) / comps.length).toFixed(2) : '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Indicated Value</Text><Text style={styles.value}>{currencyFull(salesCompValue)}</Text></View>

        {/* Cost Approach */}
        <Text style={styles.sectionHeader}>Cost Approach</Text>
        <View style={styles.row}><Text style={styles.label}>Replacement Cost/SF</Text><Text style={styles.value}>{currencyFull(costInputs.replacementCostPerSF)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Land Value</Text><Text style={styles.value}>{currencyFull(costInputs.landValue)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Depreciation</Text><Text style={styles.value}>{pctLabel(costInputs.depreciation)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Indicated Value</Text><Text style={styles.value}>{currencyFull(costValue)}</Text></View>

        {/* Reconciliation */}
        <Text style={styles.sectionHeader}>Weighted Reconciliation</Text>
        <View style={styles.row}><Text style={styles.label}>Income ({pctLabel(weights.income)})</Text><Text style={styles.value}>{currencyFull(incomeValue * weights.income / 100)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Sales Comp ({pctLabel(weights.salesComp)})</Text><Text style={styles.value}>{currencyFull(salesCompValue * weights.salesComp / 100)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Cost ({pctLabel(weights.cost)})</Text><Text style={styles.value}>{currencyFull(costValue * weights.cost / 100)}</Text></View>

        <View style={styles.reconciledBox}>
          <Text style={styles.reconciledLabel}>Reconciled Value</Text>
          <Text style={styles.reconciledValue}>{currencyFull(reconciledValue)}</Text>
        </View>

        <Text style={styles.pageNumber}>Page 1 of 2</Text>
      </Page>

      {/* Page 2 */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>BOV Narrative & Comparables</Text>
        <Text style={styles.subtitle}>
          {deal.property_name} | {deal.city}, {deal.state}
        </Text>

        {/* Narrative */}
        <Text style={styles.sectionHeader}>Narrative</Text>
        <Text style={styles.narrativeText}>{narrative || 'No narrative generated.'}</Text>

        {/* Comps Table */}
        <Text style={styles.sectionHeader}>Comparable Sales</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: '22%' }]}>Address</Text>
          <Text style={[styles.tableHeaderCell, { width: '14%' }]}>City</Text>
          <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Sale Price</Text>
          <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Date</Text>
          <Text style={[styles.tableHeaderCell, { width: '10%' }]}>SF</Text>
          <Text style={[styles.tableHeaderCell, { width: '10%' }]}>$/SF</Text>
          <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Cap Rate</Text>
          <Text style={[styles.tableHeaderCell, { width: '8%' }]}>Miles</Text>
        </View>
        {comps.map((c, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '22%' }]}>{c.address}</Text>
            <Text style={[styles.tableCell, { width: '14%' }]}>{c.city}</Text>
            <Text style={[styles.tableCell, { width: '14%' }]}>{currencyFull(c.sale_price)}</Text>
            <Text style={[styles.tableCell, { width: '12%' }]}>{c.sale_date}</Text>
            <Text style={[styles.tableCell, { width: '10%' }]}>{formatNumber(c.sf)}</Text>
            <Text style={[styles.tableCell, { width: '10%' }]}>${c.price_per_sf.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { width: '10%' }]}>{pctLabel(c.cap_rate)}</Text>
            <Text style={[styles.tableCell, { width: '8%' }]}>{c.distance_miles.toFixed(1)}</Text>
          </View>
        ))}

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          {firmStyle
            ? firmStyle.disclaimer
            : 'This Broker Opinion of Value is provided for informational purposes only. It is not an appraisal and should not be relied upon as such. The values expressed herein are estimates only and are based on assumptions that may not materialize. The broker makes no warranty or representation regarding the accuracy of the information provided.'}
        </Text>

        <Text style={styles.pageNumber}>Page 2 of 2</Text>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BOV_${(deal.property_name || 'Property').replace(/\s+/g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function BovPage() {
  const params = useParams();
  const id = params.id as string;

  // Deal data
  const [deal, setDeal] = useState<Partial<BrokerDeal> | null>(null);
  const [loading, setLoading] = useState(true);

  // Income Approach
  const [incomeInputs, setIncomeInputs] = useState<IncomeInputs>({
    grossPotentialRent: 0,
    vacancyRate: 5,
    operatingExpenses: 0,
    capRate: 6,
  });

  // Comps
  const [comps, setComps] = useState<Comp[]>([]);
  const [researchingComps, setResearchingComps] = useState(false);

  // Cost Approach
  const [costInputs, setCostInputs] = useState<CostInputs>({
    replacementCostPerSF: 150,
    landValue: 0,
    depreciation: 20,
  });

  // Weights
  const [weights, setWeights] = useState<Weights>({
    income: 40,
    salesComp: 40,
    cost: 20,
  });

  // Narrative
  const [narrative, setNarrative] = useState('');
  const [generatingNarrative, setGeneratingNarrative] = useState(false);
  const narrativeRef = useRef<HTMLDivElement>(null);

  // PDF
  const [exportingPdf, setExportingPdf] = useState(false);

  // Editing comp index
  const [editingCompIdx, setEditingCompIdx] = useState<number | null>(null);

  // Auto-save debounce ref
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -----------------------------------------------------------------------
  // Fetch deal
  // -----------------------------------------------------------------------

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

  // -----------------------------------------------------------------------
  // Initialize from deal / bov_draft
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!deal) return;

    const draft = deal.bov_draft as BovDraft | null | undefined;

    if (draft) {
      if (draft.incomeInputs) setIncomeInputs(draft.incomeInputs);
      if (draft.comps) setComps(draft.comps);
      if (draft.costInputs) setCostInputs(draft.costInputs);
      if (draft.weights) setWeights(draft.weights);
      if (draft.narrative) setNarrative(draft.narrative);
      return;
    }

    // Derive defaults from deal data
    const noi = deal.noi || 0;
    const capRate = deal.cap_rate || 6;
    const totalSf = deal.total_sf || 0;

    // Rough derivation: if NOI is known, back into GPR assuming 35% expense ratio and 5% vacancy
    const estimatedGPR = noi > 0 ? Math.round(noi / 0.65 / 0.95) : 0;
    const estimatedExpenses = noi > 0 ? Math.round(estimatedGPR * 0.35) : 0;

    setIncomeInputs({
      grossPotentialRent: estimatedGPR,
      vacancyRate: 5,
      operatingExpenses: estimatedExpenses,
      capRate: capRate,
    });

    // Cost defaults
    const replacementCostPerSF = deal.property_type === 'Industrial' ? 150 : 200;
    const landValue = deal.land_area_acres ? Math.round(deal.land_area_acres * 500000) : 0;
    const yearBuilt = deal.year_built || 2000;
    const age = new Date().getFullYear() - yearBuilt;
    const depreciation = Math.min(age * 1.0, 50);

    setCostInputs({
      replacementCostPerSF,
      landValue,
      depreciation,
    });
  }, [deal]);

  // -----------------------------------------------------------------------
  // Calculated values (live)
  // -----------------------------------------------------------------------

  const effectiveGrossIncome = useMemo(() => {
    return incomeInputs.grossPotentialRent * (1 - incomeInputs.vacancyRate / 100);
  }, [incomeInputs.grossPotentialRent, incomeInputs.vacancyRate]);

  const calculatedNOI = useMemo(() => {
    return effectiveGrossIncome - incomeInputs.operatingExpenses;
  }, [effectiveGrossIncome, incomeInputs.operatingExpenses]);

  const incomeValue = useMemo(() => {
    if (incomeInputs.capRate <= 0) return 0;
    return calculatedNOI / (incomeInputs.capRate / 100);
  }, [calculatedNOI, incomeInputs.capRate]);

  const avgPricePerSF = useMemo(() => {
    if (comps.length === 0) return 0;
    return comps.reduce((sum, c) => sum + c.price_per_sf, 0) / comps.length;
  }, [comps]);

  const avgCapRate = useMemo(() => {
    if (comps.length === 0) return 0;
    return comps.reduce((sum, c) => sum + c.cap_rate, 0) / comps.length;
  }, [comps]);

  const salesCompValue = useMemo(() => {
    const sf = deal?.total_sf || 0;
    return sf * avgPricePerSF;
  }, [deal?.total_sf, avgPricePerSF]);

  const replacementCostTotal = useMemo(() => {
    const sf = deal?.total_sf || 0;
    return sf * costInputs.replacementCostPerSF;
  }, [deal?.total_sf, costInputs.replacementCostPerSF]);

  const depreciationAmount = useMemo(() => {
    return replacementCostTotal * (costInputs.depreciation / 100);
  }, [replacementCostTotal, costInputs.depreciation]);

  const costValue = useMemo(() => {
    return replacementCostTotal - depreciationAmount + costInputs.landValue;
  }, [replacementCostTotal, depreciationAmount, costInputs.landValue]);

  const weightsSum = weights.income + weights.salesComp + weights.cost;

  const reconciledValue = useMemo(() => {
    return (
      incomeValue * (weights.income / 100) +
      salesCompValue * (weights.salesComp / 100) +
      costValue * (weights.cost / 100)
    );
  }, [incomeValue, salesCompValue, costValue, weights]);

  const perSfValue = useMemo(() => {
    const sf = deal?.total_sf || 0;
    if (sf <= 0) return 0;
    return reconciledValue / sf;
  }, [reconciledValue, deal?.total_sf]);

  // -----------------------------------------------------------------------
  // Auto-save
  // -----------------------------------------------------------------------

  const saveDraft = useCallback(async () => {
    if (!deal || id === 'seed-winchester-001') return;

    const draft: BovDraft = {
      incomeInputs,
      comps,
      costInputs,
      weights,
      narrative,
      reconciledValue,
    };

    try {
      await supabase
        .from('broker_deals')
        .update({ bov_draft: draft, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch {
      // silently fail
    }
  }, [id, deal, incomeInputs, comps, costInputs, weights, narrative, reconciledValue]);

  useEffect(() => {
    if (!deal) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDraft();
    }, 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [incomeInputs, comps, costInputs, weights, narrative, saveDraft, deal]);

  // -----------------------------------------------------------------------
  // Research comps
  // -----------------------------------------------------------------------

  const handleResearchComps = useCallback(async () => {
    if (!deal) return;
    setResearchingComps(true);
    try {
      const res = await fetch('/api/research-comps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal }),
      });
      const json = await res.json();
      if (json.success && json.data?.comps) {
        setComps(json.data.comps);
      }
    } catch {
      // ignore
    }
    setResearchingComps(false);
  }, [deal]);

  // -----------------------------------------------------------------------
  // Generate narrative
  // -----------------------------------------------------------------------

  const handleGenerateNarrative = useCallback(async () => {
    if (!deal) return;
    setGeneratingNarrative(true);
    try {
      const res = await fetch('/api/generate-bov', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal, comparables: comps }),
      });
      const json = await res.json();
      if (json.success && json.data?.narrative) {
        setNarrative(json.data.narrative);
      }
    } catch {
      // ignore
    }
    setGeneratingNarrative(false);
  }, [deal, comps]);

  // -----------------------------------------------------------------------
  // Export PDF
  // -----------------------------------------------------------------------

  const handleExportPdf = useCallback(async () => {
    if (!deal) return;
    setExportingPdf(true);
    try {
      await generateBovPdf(
        deal,
        incomeInputs,
        comps,
        costInputs,
        weights,
        narrative,
        incomeValue,
        salesCompValue,
        costValue,
        reconciledValue,
      );
    } catch (err) {
      console.error('PDF export error:', err);
    }
    setExportingPdf(false);
  }, [deal, incomeInputs, comps, costInputs, weights, narrative, incomeValue, salesCompValue, costValue, reconciledValue]);

  // -----------------------------------------------------------------------
  // Add manual comp
  // -----------------------------------------------------------------------

  const handleAddComp = useCallback(() => {
    const newComp: Comp = {
      address: '',
      city: '',
      sale_price: 0,
      sale_date: new Date().toISOString().slice(0, 10),
      sf: 0,
      price_per_sf: 0,
      cap_rate: 0,
      distance_miles: 0,
    };
    setComps((prev) => [...prev, newComp]);
    setEditingCompIdx(comps.length);
  }, [comps.length]);

  // -----------------------------------------------------------------------
  // Update comp field
  // -----------------------------------------------------------------------

  const updateComp = useCallback((idx: number, field: keyof Comp, value: string | number) => {
    setComps((prev) => {
      const updated = [...prev];
      const comp = { ...updated[idx] };

      if (field === 'address' || field === 'city' || field === 'sale_date') {
        (comp as any)[field] = value;
      } else {
        (comp as any)[field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
      }

      // Recalculate price_per_sf when sale_price or sf changes
      if ((field === 'sale_price' || field === 'sf') && comp.sf > 0) {
        comp.price_per_sf = parseFloat((comp.sale_price / comp.sf).toFixed(2));
      }

      updated[idx] = comp;
      return updated;
    });
  }, []);

  // -----------------------------------------------------------------------
  // Remove comp
  // -----------------------------------------------------------------------

  const removeComp = useCallback((idx: number) => {
    setComps((prev) => prev.filter((_, i) => i !== idx));
    setEditingCompIdx(null);
  }, []);

  // -----------------------------------------------------------------------
  // Income input handler
  // -----------------------------------------------------------------------

  const handleIncomeChange = useCallback((field: keyof IncomeInputs, value: string) => {
    const num = parseFloat(value) || 0;
    setIncomeInputs((prev) => ({ ...prev, [field]: num }));
  }, []);

  // -----------------------------------------------------------------------
  // Cost input handler
  // -----------------------------------------------------------------------

  const handleCostChange = useCallback((field: keyof CostInputs, value: string) => {
    const num = parseFloat(value) || 0;
    setCostInputs((prev) => ({ ...prev, [field]: num }));
  }, []);

  // -----------------------------------------------------------------------
  // Weight handler
  // -----------------------------------------------------------------------

  const handleWeightChange = useCallback((field: keyof Weights, value: string) => {
    const num = parseFloat(value) || 0;
    setWeights((prev) => ({ ...prev, [field]: num }));
  }, []);

  // -----------------------------------------------------------------------
  // Narrative blur save
  // -----------------------------------------------------------------------

  const handleNarrativeBlur = useCallback(() => {
    if (narrativeRef.current) {
      setNarrative(narrativeRef.current.innerText);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/deals/${id}`}
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
          >
            &larr; Back to Deal
          </Link>
          <h1
            className="text-3xl font-bold text-gray-900 mt-2"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Broker Opinion of Value
          </h1>
          <p className="text-gray-500 mt-1">
            {deal.property_name} &mdash; {deal.address}, {deal.city}, {deal.state} {deal.zip}
          </p>
        </div>

        {/* Two-Panel Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT PANEL (60%) */}
          <div className="w-full lg:w-[60%] space-y-6">
            {/* ============ INCOME APPROACH ============ */}
            <div className="bg-white rounded-xl p-6">
              <h2
                className="text-xl font-semibold text-gray-900 mb-4"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Income Approach
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gross Potential Rent */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Gross Potential Rent ($)
                  </label>
                  <input
                    type="number"
                    value={incomeInputs.grossPotentialRent || ''}
                    onChange={(e) => handleIncomeChange('grossPotentialRent', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Vacancy Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Vacancy Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={incomeInputs.vacancyRate || ''}
                    onChange={(e) => handleIncomeChange('vacancyRate', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5"
                  />
                </div>

                {/* Operating Expenses */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Operating Expenses ($)
                  </label>
                  <input
                    type="number"
                    value={incomeInputs.operatingExpenses || ''}
                    onChange={(e) => handleIncomeChange('operatingExpenses', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Cap Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Cap Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={incomeInputs.capRate || ''}
                    onChange={(e) => handleIncomeChange('capRate', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="6"
                  />
                </div>
              </div>

              {/* Calculated Values */}
              <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Effective Gross Income</span>
                  <span className="font-medium text-gray-900">{currencyFull(effectiveGrossIncome)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Net Operating Income (NOI)</span>
                  <span className="font-medium text-gray-900">{currencyFull(calculatedNOI)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-blue-700">Indicated Value (Income)</span>
                  <span className="text-blue-700">{currencyFull(incomeValue)}</span>
                </div>
              </div>
            </div>

            {/* ============ SALES COMPARABLES ============ */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-xl font-semibold text-gray-900"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  Sales Comparables
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleResearchComps}
                    disabled={researchingComps}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {researchingComps ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Researching...
                      </span>
                    ) : (
                      'Research Comps with AI'
                    )}
                  </button>
                  <button
                    onClick={handleAddComp}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Add Comp
                  </button>
                </div>
              </div>

              {comps.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-sm">No comparables yet. Use AI to research comps or add manually.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase">Address</th>
                        <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase">City</th>
                        <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 uppercase">Sale Price</th>
                        <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 uppercase">SF</th>
                        <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 uppercase">$/SF</th>
                        <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 uppercase">Cap Rate</th>
                        <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 uppercase">Distance</th>
                        <th className="py-2 px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {comps.map((comp, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() => setEditingCompIdx(editingCompIdx === idx ? null : idx)}
                        >
                          {editingCompIdx === idx ? (
                            <>
                              <td className="py-1 px-1">
                                <input
                                  type="text"
                                  value={comp.address}
                                  onChange={(e) => updateComp(idx, 'address', e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="text"
                                  value={comp.city}
                                  onChange={(e) => updateComp(idx, 'city', e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="number"
                                  value={comp.sale_price || ''}
                                  onChange={(e) => updateComp(idx, 'sale_price', e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-right"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="date"
                                  value={comp.sale_date}
                                  onChange={(e) => updateComp(idx, 'sale_date', e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="number"
                                  value={comp.sf || ''}
                                  onChange={(e) => updateComp(idx, 'sf', e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-right"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={comp.price_per_sf || ''}
                                  onChange={(e) => updateComp(idx, 'price_per_sf', e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-right"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={comp.cap_rate || ''}
                                  onChange={(e) => updateComp(idx, 'cap_rate', e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-right"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={comp.distance_miles || ''}
                                  onChange={(e) => updateComp(idx, 'distance_miles', e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-right"
                                />
                              </td>
                              <td className="py-1 px-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeComp(idx); }}
                                  className="text-red-400 hover:text-red-600 text-xs"
                                  title="Remove comp"
                                >
                                  &times;
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 px-2 text-gray-900">{comp.address || '—'}</td>
                              <td className="py-2 px-2 text-gray-700">{comp.city || '—'}</td>
                              <td className="py-2 px-2 text-right text-gray-900">{currencyFull(comp.sale_price)}</td>
                              <td className="py-2 px-2 text-gray-700">{comp.sale_date}</td>
                              <td className="py-2 px-2 text-right text-gray-900">{formatNumber(comp.sf)}</td>
                              <td className="py-2 px-2 text-right text-gray-900">${comp.price_per_sf.toFixed(2)}</td>
                              <td className="py-2 px-2 text-right text-gray-900">{pctLabel(comp.cap_rate)}</td>
                              <td className="py-2 px-2 text-right text-gray-700">{comp.distance_miles.toFixed(1)} mi</td>
                              <td className="py-2 px-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeComp(idx); }}
                                  className="text-red-400 hover:text-red-600 text-xs"
                                  title="Remove comp"
                                >
                                  &times;
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Averages */}
                  <div className="mt-4 pt-3 border-t border-gray-200 flex gap-8 text-sm">
                    <div>
                      <span className="text-gray-500">Avg $/SF: </span>
                      <span className="font-semibold text-gray-900">${avgPricePerSF.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Avg Cap Rate: </span>
                      <span className="font-semibold text-gray-900">{pctLabel(avgCapRate)}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex justify-between text-sm font-semibold">
                    <span className="text-blue-700">Indicated Value (Sales Comp)</span>
                    <span className="text-blue-700">{currencyFull(salesCompValue)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ============ COST APPROACH ============ */}
            <div className="bg-white rounded-xl p-6">
              <h2
                className="text-xl font-semibold text-gray-900 mb-4"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Cost Approach
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Replacement Cost / SF ($)
                  </label>
                  <input
                    type="number"
                    value={costInputs.replacementCostPerSF || ''}
                    onChange={(e) => handleCostChange('replacementCostPerSF', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Land Value ($)
                  </label>
                  <input
                    type="number"
                    value={costInputs.landValue || ''}
                    onChange={(e) => handleCostChange('landValue', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Depreciation (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={costInputs.depreciation || ''}
                    onChange={(e) => handleCostChange('depreciation', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="20"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Replacement Cost ({formatSF(deal.total_sf)} x ${costInputs.replacementCostPerSF})</span>
                  <span className="font-medium text-gray-900">{currencyFull(replacementCostTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Less: Depreciation ({pctLabel(costInputs.depreciation)})</span>
                  <span className="font-medium text-red-600">({currencyFull(depreciationAmount)})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plus: Land Value</span>
                  <span className="font-medium text-gray-900">{currencyFull(costInputs.landValue)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-blue-700">Indicated Value (Cost)</span>
                  <span className="text-blue-700">{currencyFull(costValue)}</span>
                </div>
              </div>
            </div>

            {/* ============ WEIGHTED RECONCILIATION ============ */}
            <div className="bg-white rounded-xl p-6">
              <h2
                className="text-xl font-semibold text-gray-900 mb-4"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Weighted Reconciliation
              </h2>

              {weightsSum !== 100 && (
                <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  Weights sum to {pctLabel(weightsSum)} -- they must equal 100%.
                </div>
              )}

              <div className="space-y-3">
                {/* Income */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-32">Income Approach</span>
                  <input
                    type="number"
                    step="1"
                    value={weights.income || ''}
                    onChange={(e) => handleWeightChange('income', e.target.value)}
                    className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-400">%</span>
                  <span className="text-sm text-gray-500 ml-auto">{currencyFull(incomeValue)}</span>
                  <span className="text-sm font-medium text-gray-900 w-32 text-right">
                    {currencyFull(incomeValue * weights.income / 100)}
                  </span>
                </div>

                {/* Sales Comp */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-32">Sales Comparison</span>
                  <input
                    type="number"
                    step="1"
                    value={weights.salesComp || ''}
                    onChange={(e) => handleWeightChange('salesComp', e.target.value)}
                    className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-400">%</span>
                  <span className="text-sm text-gray-500 ml-auto">{currencyFull(salesCompValue)}</span>
                  <span className="text-sm font-medium text-gray-900 w-32 text-right">
                    {currencyFull(salesCompValue * weights.salesComp / 100)}
                  </span>
                </div>

                {/* Cost */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-32">Cost Approach</span>
                  <input
                    type="number"
                    step="1"
                    value={weights.cost || ''}
                    onChange={(e) => handleWeightChange('cost', e.target.value)}
                    className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-400">%</span>
                  <span className="text-sm text-gray-500 ml-auto">{currencyFull(costValue)}</span>
                  <span className="text-sm font-medium text-gray-900 w-32 text-right">
                    {currencyFull(costValue * weights.cost / 100)}
                  </span>
                </div>
              </div>

              {/* Reconciled Value */}
              <div className="mt-6 pt-4 border-t-2 border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-blue-800">Reconciled Value</span>
                  <span className="text-2xl font-bold text-blue-700">{currencyFull(reconciledValue)}</span>
                </div>
              </div>
            </div>

            {/* ============ BOV NARRATIVE ============ */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-xl font-semibold text-gray-900"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  BOV Narrative
                </h2>
                <button
                  onClick={handleGenerateNarrative}
                  disabled={generatingNarrative}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {generatingNarrative ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Generating...
                    </span>
                  ) : (
                    'Generate BOV Narrative'
                  )}
                </button>
              </div>

              {narrative ? (
                <div
                  ref={narrativeRef}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={handleNarrativeBlur}
                  className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-lg p-3 min-h-[120px] border border-transparent hover:border-gray-200 transition-colors cursor-text"
                >
                  {narrative}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Generate a narrative after adding comparables.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL (40%) */}
          <div className="w-full lg:w-[40%]">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* ============ LIVE CALCULATION SUMMARY ============ */}
              <div className="bg-white rounded-xl p-6">
                <h2
                  className="text-lg font-semibold text-gray-900 mb-5"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  Valuation Summary
                </h2>

                {/* Income bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Income Approach</span>
                    <span className="font-medium text-gray-900">{currencyFull(incomeValue)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: reconciledValue > 0
                          ? `${Math.min((incomeValue / (reconciledValue * 1.5)) * 100, 100)}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>

                {/* Sales Comp bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Sales Comparison</span>
                    <span className="font-medium text-gray-900">{currencyFull(salesCompValue)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: reconciledValue > 0
                          ? `${Math.min((salesCompValue / (reconciledValue * 1.5)) * 100, 100)}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>

                {/* Cost bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Cost Approach</span>
                    <span className="font-medium text-gray-900">{currencyFull(costValue)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-amber-500 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: reconciledValue > 0
                          ? `${Math.min((costValue / (reconciledValue * 1.5)) * 100, 100)}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>

                {/* Reconciled */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                  <p className="text-sm text-green-700 font-medium mb-1">Reconciled Value</p>
                  <p className="text-3xl font-bold text-green-800">{currencyFull(reconciledValue)}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {deal.total_sf && deal.total_sf > 0
                      ? `$${perSfValue.toFixed(2)} / SF`
                      : ''}
                  </p>
                </div>

                {/* Weight sliders */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-3">Weight Adjustment</p>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Income</span>
                        <span>{pctLabel(weights.income)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={weights.income}
                        onChange={(e) => handleWeightChange('income', e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Sales Comp</span>
                        <span>{pctLabel(weights.salesComp)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={weights.salesComp}
                        onChange={(e) => handleWeightChange('salesComp', e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Cost</span>
                        <span>{pctLabel(weights.cost)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={weights.cost}
                        onChange={(e) => handleWeightChange('cost', e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  </div>

                  {weightsSum !== 100 && (
                    <p className="mt-2 text-xs text-amber-600">
                      Weights total {pctLabel(weightsSum)} (must be 100%)
                    </p>
                  )}
                </div>
              </div>

              {/* ============ EXPORT PDF ============ */}
              <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="w-full px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {exportingPdf ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export BOV PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
