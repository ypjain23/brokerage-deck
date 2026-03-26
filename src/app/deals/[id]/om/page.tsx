'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, BrokerDeal } from '@/lib/supabase';
import { WINCHESTER_SEED } from '@/lib/seed-data';
import { FIRM_STYLES, FirmStyleKey } from '@/lib/firm-styles';

type OMSection = {
  title: string;
  content: string;
};

type OMDraft = {
  sections: OMSection[];
  firmStyle: FirmStyleKey;
  updatedAt: string;
  selectedPhotos?: string[];
};

const FIRM_OPTIONS: { key: FirmStyleKey; label: string }[] = [
  { key: 'cbre', label: 'CBRE' },
  { key: 'cushman', label: 'Cushman & Wakefield' },
  { key: 'jll', label: 'JLL' },
  { key: 'marcus_millichap', label: 'Marcus & Millichap' },
  { key: 'newmark', label: 'Newmark' },
];

// ─── Formatting Helpers ────────────────────────────────────────────────────────

function fmtNum(n: number | null | undefined): string {
  if (n == null) return '--';
  return n.toLocaleString('en-US');
}

function fmtDollar(n: number | null | undefined): string {
  if (n == null) return '--';
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDollarDec(n: number | null | undefined): string {
  if (n == null) return '--';
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return '--';
  return n.toFixed(1) + '%';
}

export default function OMEditorPage() {
  const params = useParams();
  const id = params.id as string;

  const [deal, setDeal] = useState<Partial<BrokerDeal> | null>(null);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<OMSection[]>([]);
  const [selectedFirmStyle, setSelectedFirmStyle] = useState<FirmStyleKey>('cushman');
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Photo picker state
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [availablePhotos, setAvailablePhotos] = useState<string[]>([]);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Fetch Deal ───────────────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchDeal() {
      let dealData: Partial<BrokerDeal> | null = null;

      if (id === 'seed-winchester-001') {
        dealData = WINCHESTER_SEED;
      } else {
        try {
          const { data, error } = await supabase
            .from('broker_deals')
            .select('*')
            .eq('id', id)
            .single();

          if (error || !data) {
            dealData = WINCHESTER_SEED;
          } else {
            dealData = data;
          }
        } catch {
          dealData = WINCHESTER_SEED;
        }
      }

      setDeal(dealData);

      if (dealData?.firm_style) {
        setSelectedFirmStyle(dealData.firm_style as FirmStyleKey);
      }

      if (dealData?.om_draft) {
        const draft = dealData.om_draft as OMDraft;
        if (draft.sections && draft.sections.length > 0) {
          setSections(draft.sections);
        }
        if (draft.firmStyle) {
          setSelectedFirmStyle(draft.firmStyle);
        }
        if (draft.selectedPhotos) {
          setSelectedPhotos(draft.selectedPhotos);
        }
      }

      if (dealData?.photos && dealData.photos.length > 0) {
        setSelectedPhotos((prev) => (prev.length > 0 ? prev : dealData!.photos!));
      }

      setLoading(false);
    }

    fetchDeal();
  }, [id]);

  // ─── Fetch available photos from broker-docs bucket ───────────────────────────

  useEffect(() => {
    async function fetchAvailablePhotos() {
      try {
        const { data, error } = await supabase.storage
          .from('broker-docs')
          .list(id, { limit: 100, sortBy: { column: 'name', order: 'asc' } });

        if (!error && data) {
          const imageFiles = data.filter((f) => {
            const ext = f.name.toLowerCase().split('.').pop() || '';
            return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext);
          });

          const urls = imageFiles.map((f) => {
            const { data: urlData } = supabase.storage
              .from('broker-docs')
              .getPublicUrl(`${id}/${f.name}`);
            return urlData.publicUrl;
          });

          setAvailablePhotos(urls);
        }
      } catch {
        // If bucket listing fails, use deal photos as fallback
      }

      // Also add deal.photos if present
      if (deal?.photos && deal.photos.length > 0) {
        setAvailablePhotos((prev) => {
          const combined = [...new Set([...prev, ...deal.photos!])];
          return combined;
        });
      }
    }

    if (deal) {
      fetchAvailablePhotos();
    }
  }, [deal, id]);

  // ─── Save draft to supabase ───────────────────────────────────────────────────

  const saveDraft = useCallback(
    async (updatedSections: OMSection[], photos?: string[]) => {
      if (id === 'seed-winchester-001') return;

      const draft: OMDraft = {
        sections: updatedSections,
        firmStyle: selectedFirmStyle,
        updatedAt: new Date().toISOString(),
        selectedPhotos: photos ?? selectedPhotos,
      };

      try {
        await supabase
          .from('broker_deals')
          .update({ om_draft: draft })
          .eq('id', id);
      } catch {
        // Silently fail for seed data
      }
    },
    [id, selectedFirmStyle, selectedPhotos]
  );

  // ─── Generate OM Sections ─────────────────────────────────────────────────────

  async function generateOMSections() {
    if (!deal) return;

    setGenerating(true);
    setGenerateProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerateProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const response = await fetch('/api/generate-om', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal: deal,
          firmStyle: selectedFirmStyle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate OM');
      }

      const result = await response.json();
      const generatedSections: OMSection[] = result.sections;

      setGenerateProgress(100);
      setSections(generatedSections);
      await saveDraft(generatedSections);
    } catch (err) {
      console.error('Error generating OM:', err);
      // Fallback: generate placeholder sections from firm style
      const firmConfig = FIRM_STYLES[selectedFirmStyle];
      const fallbackSections: OMSection[] = firmConfig.sectionOrder.map((title) => ({
        title,
        content: `[Content for "${title}" will be generated using ${firmConfig.displayName} style. Please check your API configuration and try again.]`,
      }));
      setSections(fallbackSections);
      await saveDraft(fallbackSections);
    } finally {
      clearInterval(progressInterval);
      setGenerating(false);
      setGenerateProgress(0);
    }
  }

  // ─── Section Editing ──────────────────────────────────────────────────────────

  function handleSectionClick(index: number) {
    setEditingIndex(index);
  }

  async function handleSectionBlur(index: number) {
    const el = sectionRefs.current[index];
    if (!el) return;

    const newContent = el.innerText;
    const updatedSections = [...sections];
    updatedSections[index] = { ...updatedSections[index], content: newContent };
    setSections(updatedSections);
    setEditingIndex(null);

    await saveDraft(updatedSections);

    // Show "Saved" flash
    setSavedIndex(index);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => {
      setSavedIndex(null);
    }, 2000);
  }

  // ─── Photo Drag & Drop ───────────────────────────────────────────────────────

  function handlePhotoDragStart(index: number) {
    setDragFrom(index);
  }

  function handlePhotoDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOver(index);
  }

  function handlePhotoDrop(index: number) {
    if (dragFrom === null || dragFrom === index) {
      setDragFrom(null);
      setDragOver(null);
      return;
    }

    const newPhotos = [...selectedPhotos];
    const [removed] = newPhotos.splice(dragFrom, 1);
    newPhotos.splice(index, 0, removed);
    setSelectedPhotos(newPhotos);
    setDragFrom(null);
    setDragOver(null);

    saveDraft(sections, newPhotos);
  }

  function togglePhotoSelection(url: string) {
    setSelectedPhotos((prev) => {
      if (prev.includes(url)) {
        return prev.filter((p) => p !== url);
      }
      return [...prev, url];
    });
  }

  // ─── Export PDF ───────────────────────────────────────────────────────────────

  async function fetchImageAsBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return '';
    }
  }

  async function handleExportPdf() {
    if (!deal) return;

    setExportingPdf(true);

    try {
      // Pre-fetch all photo URLs and convert to base64
      const photoBase64Map: Record<string, string> = {};
      for (const photoUrl of selectedPhotos) {
        const base64 = await fetchImageAsBase64(photoUrl);
        if (base64) {
          photoBase64Map[photoUrl] = base64;
        }
      }

      // Dynamically import @react-pdf/renderer
      const {
        Document,
        Page,
        Text,
        View,
        Image,
        StyleSheet,
        pdf,
      } = await import('@react-pdf/renderer');

      const firmConfig = FIRM_STYLES[selectedFirmStyle];

      // ─── Design Tokens ──────────────────────────────────────────────
      const NAVY = '#0d1117';
      const NAVY_HEADER = '#0f172a';
      const BLUE_ACCENT = '#2462F5';
      const BLUE_LIGHT = '#3b82f6';
      const CARD_BG = '#f8f7f4';
      const CARD_BORDER = '#e5e5e5';
      const TEXT_DARK = '#1a1a1a';
      const TEXT_BODY = '#374151';
      const TEXT_MUTED = '#6b7280';
      const TEXT_LIGHT_MUTED = '#9ca3af';
      const WHITE = '#ffffff';
      const TABLE_ALT_ROW = '#f9fafb';

      // ─── Computed deal values ───────────────────────────────────────
      const propertyName = deal.property_name || 'Property';
      const address = [deal.address, deal.city, deal.state, deal.zip]
        .filter(Boolean)
        .join(', ');
      const totalSf = deal.total_sf || 275243;
      const landAcres = deal.land_area_acres || 12.03;
      const yearBuilt = deal.year_built || 2001;
      const occupancy = deal.occupancy_pct ?? 100;
      const waltYears = deal.walt || 4.5;
      const clearHeight = deal.clear_height || "32' clear";
      const dockDoors = deal.dock_doors ?? 44;
      const gradeDoors = deal.grade_doors ?? 4;
      const numTenants = deal.num_tenants ?? 1;
      const numBuildings = deal.num_buildings ?? 1;
      const parking = deal.parking_spaces ?? 226;
      const zoning = deal.zoning || 'LI (Light Industrial)';
      const submarket = deal.submarket || 'Inland Empire South';
      const county = deal.county || 'Riverside';
      const askingPrice = deal.asking_price || 45000000;
      const capRate = deal.cap_rate || 5.25;
      const pricePerSf = deal.price_per_sf || (askingPrice / totalSf);
      const noi = deal.noi || (askingPrice * capRate / 100);
      const assetClass = deal.asset_class || 'Single-Tenant NNN';
      const propertyType = deal.property_type || 'Industrial';

      // Helper to find section content by fuzzy title match
      function findSectionContent(keywords: string[]): string {
        for (const kw of keywords) {
          const found = sections.find((s) =>
            s.title.toLowerCase().includes(kw.toLowerCase())
          );
          if (found) return found.content;
        }
        return '';
      }

      const execSummaryText = findSectionContent(['executive summary', 'summary']) ||
        `${firmConfig.openingPhrase} ${propertyName}, a ${fmtNum(totalSf)} square foot ${propertyType.toLowerCase()} property located at ${address}. The ${assetClass.toLowerCase()} asset is ${occupancy}% leased with ${waltYears} years of weighted average lease term remaining. The property features ${clearHeight} clear heights, ${dockDoors} dock-high doors, and ${gradeDoors} grade-level doors, situated on ${landAcres} acres in the ${submarket} submarket.`;

      const propertyDescText = findSectionContent(['property description', 'property overview', 'property & tenancy']) ||
        `${propertyName} is a ${fmtNum(totalSf)} square foot ${propertyType.toLowerCase()} facility built in ${yearBuilt}, situated on approximately ${landAcres} acres in ${deal.city || 'Temecula'}, ${deal.state || 'CA'}. The building features ${clearHeight} clear heights, ${dockDoors} dock-high loading doors, and ${gradeDoors} grade-level doors, providing exceptional functionality for warehouse and distribution operations. The property includes ${parking} parking spaces and is zoned ${zoning}. The ${submarket} submarket benefits from proximity to major transportation corridors and a growing population base, making this an attractive logistics location.`;

      const marketOverviewText = findSectionContent(['market overview', 'market context', 'area overview', 'market highlights']) ||
        `The ${submarket} submarket in ${county} County continues to demonstrate strong industrial fundamentals. The region benefits from its strategic location along major transportation corridors, providing access to key distribution networks throughout Southern California. Industrial vacancy rates in the submarket remain historically low, driven by sustained demand from e-commerce, logistics, and last-mile delivery operators. Limited developable land and restrictive zoning policies continue to constrain new supply, supporting rent growth and value appreciation for existing assets.`;

      const tenantOverviewText = findSectionContent(['tenant', 'lease']) ||
        `The property is ${occupancy}% leased with ${waltYears} years of weighted average lease term remaining. The current lease structure provides stable, predictable cash flow with scheduled rent escalations throughout the term.`;

      // ─── Photo base64 array (up to 4) ──────────────────────────────
      const photoB64Array: string[] = [];
      for (let i = 0; i < Math.min(selectedPhotos.length, 4); i++) {
        const b64 = photoBase64Map[selectedPhotos[i]];
        if (b64) photoB64Array.push(b64);
      }

      // ─── PDF Styles ────────────────────────────────────────────────
      const s = StyleSheet.create({
        // ── Landscape page base ──
        landscapePage: {
          width: 792,
          height: 612,
          fontFamily: 'Helvetica',
          fontSize: 10,
          color: TEXT_DARK,
          position: 'relative' as const,
        },

        // ── Cover page ──
        coverPage: {
          width: 792,
          height: 612,
          backgroundColor: NAVY,
          padding: 0,
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          position: 'relative' as const,
        },
        coverFirmLine: {
          fontSize: 9,
          color: '#64748b',
          letterSpacing: 3,
          textTransform: 'uppercase' as const,
          textAlign: 'center' as const,
          marginBottom: 24,
          paddingHorizontal: 60,
        },
        coverPropertyName: {
          fontSize: 36,
          fontFamily: 'Helvetica-Bold',
          color: WHITE,
          textAlign: 'center' as const,
          marginBottom: 12,
          paddingHorizontal: 60,
        },
        coverAddress: {
          fontSize: 13,
          color: '#94a3b8',
          textAlign: 'center' as const,
          marginBottom: 28,
        },
        coverMetricsLine: {
          fontSize: 10,
          color: '#cbd5e1',
          textAlign: 'center' as const,
          letterSpacing: 1.5,
          marginBottom: 28,
          paddingHorizontal: 40,
        },
        coverDivider: {
          width: 100,
          height: 3,
          backgroundColor: BLUE_ACCENT,
          marginBottom: 28,
        },
        coverConfidential: {
          fontSize: 10,
          color: '#475569',
          letterSpacing: 3,
          textTransform: 'uppercase' as const,
          textAlign: 'center' as const,
        },

        // ── Navy header bar (non-cover pages) ──
        headerBar: {
          height: 36,
          backgroundColor: NAVY_HEADER,
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          paddingHorizontal: 36,
          justifyContent: 'space-between' as const,
        },
        headerBarText: {
          fontSize: 8,
          color: '#94a3b8',
          letterSpacing: 2,
          textTransform: 'uppercase' as const,
        },

        // ── Page body ──
        pageBody: {
          flex: 1,
          padding: 36,
          paddingTop: 24,
        },

        // ── Section header ──
        sectionHeader: {
          fontSize: 20,
          fontFamily: 'Helvetica-Bold',
          color: NAVY_HEADER,
          marginBottom: 4,
        },
        sectionHeaderUnderline: {
          width: 60,
          height: 3,
          backgroundColor: BLUE_ACCENT,
          marginBottom: 20,
        },

        // ── Callout card ──
        calloutCard: {
          backgroundColor: CARD_BG,
          borderRadius: 8,
          border: `1px solid ${CARD_BORDER}`,
          borderWidth: 1,
          borderColor: CARD_BORDER,
          padding: 16,
        },
        calloutCardTitle: {
          fontSize: 12,
          fontFamily: 'Helvetica-Bold',
          color: NAVY_HEADER,
          marginBottom: 12,
          paddingBottom: 6,
          borderBottomWidth: 2,
          borderBottomColor: BLUE_ACCENT,
        },

        // ── Metric items ──
        metricValue: {
          fontSize: 20,
          fontFamily: 'Helvetica-Bold',
          color: TEXT_DARK,
        },
        metricLabel: {
          fontSize: 7,
          color: TEXT_MUTED,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.5,
          marginTop: 2,
        },

        // ── Body text ──
        bodyText: {
          fontSize: 9,
          lineHeight: 1.7,
          color: TEXT_BODY,
          textAlign: 'justify' as const,
        },

        // ── Table styles ──
        tableHeaderRow: {
          flexDirection: 'row' as const,
          backgroundColor: BLUE_ACCENT,
          paddingVertical: 6,
          paddingHorizontal: 8,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
        },
        tableHeaderCell: {
          fontSize: 7,
          fontFamily: 'Helvetica-Bold',
          color: WHITE,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.5,
        },
        tableRow: {
          flexDirection: 'row' as const,
          paddingVertical: 5,
          paddingHorizontal: 8,
          borderBottomWidth: 0.5,
          borderBottomColor: '#e5e7eb',
        },
        tableRowAlt: {
          flexDirection: 'row' as const,
          paddingVertical: 5,
          paddingHorizontal: 8,
          backgroundColor: TABLE_ALT_ROW,
          borderBottomWidth: 0.5,
          borderBottomColor: '#e5e7eb',
        },
        tableCell: {
          fontSize: 8,
          color: TEXT_BODY,
        },

        // ── Page footer ──
        pageFooter: {
          position: 'absolute' as const,
          bottom: 16,
          left: 36,
          right: 36,
          flexDirection: 'row' as const,
          justifyContent: 'space-between' as const,
          alignItems: 'center' as const,
        },
        pageFooterText: {
          fontSize: 7,
          color: TEXT_LIGHT_MUTED,
        },

        // ── Placeholder box ──
        placeholderBox: {
          backgroundColor: '#e2e8f0',
          borderRadius: 6,
          display: 'flex' as const,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
        },
        placeholderText: {
          fontSize: 11,
          color: TEXT_MUTED,
          fontFamily: 'Helvetica-Bold',
        },

        // ── Two-column layout ──
        row: {
          flexDirection: 'row' as const,
        },

        // ── Highlight card ──
        highlightCard: {
          backgroundColor: CARD_BG,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: CARD_BORDER,
          padding: 10,
          flexDirection: 'row' as const,
          alignItems: 'flex-start' as const,
        },
        highlightDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: BLUE_ACCENT,
          marginTop: 3,
          marginRight: 8,
        },
        highlightText: {
          fontSize: 8,
          color: TEXT_BODY,
          lineHeight: 1.5,
          flex: 1,
        },

        // ── Spec row ──
        specRow: {
          flexDirection: 'row' as const,
          justifyContent: 'space-between' as const,
          paddingVertical: 6,
          borderBottomWidth: 0.5,
          borderBottomColor: '#e5e7eb',
        },
        specLabel: {
          fontSize: 8,
          color: TEXT_MUTED,
        },
        specValue: {
          fontSize: 8,
          fontFamily: 'Helvetica-Bold',
          color: TEXT_DARK,
        },

        // ── Financial metric card ──
        finMetricCard: {
          backgroundColor: CARD_BG,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: CARD_BORDER,
          padding: 12,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          flex: 1,
        },
      });

      // ─── Reusable PDF sub-components ────────────────────────────────

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const HeaderBar = ({ firmName, propName }: { firmName: string; propName: string }) => (
        <View style={s.headerBar}>
          <Text style={s.headerBarText}>{firmName}</Text>
          <Text style={s.headerBarText}>{propName}</Text>
        </View>
      );

      const SectionTitle = ({ title }: { title: string }) => (
        <View>
          <Text style={s.sectionHeader}>{title}</Text>
          <View style={s.sectionHeaderUnderline} />
        </View>
      );

      const PageFooter = ({ pageNum }: { pageNum: number }) => (
        <View style={s.pageFooter} fixed>
          <Text style={s.pageFooterText}>{firmConfig.displayName}</Text>
          <Text style={s.pageFooterText}>CONFIDENTIAL</Text>
          <Text style={s.pageFooterText}>{pageNum}</Text>
        </View>
      );

      // Metric cell for snapshot grids
      const MetricCell = ({ value, label, width }: { value: string; label: string; width?: number | string }) => (
        <View style={{ width: width || '25%', marginBottom: 14 }}>
          <Text style={s.metricValue}>{value}</Text>
          <Text style={s.metricLabel}>{label}</Text>
        </View>
      );

      // Photo or placeholder
      const PhotoOrPlaceholder = ({ index, photoB64, width, height }: { index: number; photoB64?: string; width: number | string; height: number }) => {
        if (photoB64) {
          return (
            <View style={{ width, height, borderRadius: 6, overflow: 'hidden' as const }}>
              <Image src={photoB64} style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} />
            </View>
          );
        }
        return (
          <View style={[s.placeholderBox, { width, height }]}>
            <Text style={s.placeholderText}>Property Photo {index + 1}</Text>
          </View>
        );
      };

      // ─── Build highlights from deal or fallback ─────────────────────
      const highlights = deal.highlights && deal.highlights.length > 0
        ? deal.highlights
        : [
          `${occupancy}% leased ${assetClass.toLowerCase()} investment`,
          `${firmConfig.sfSymbol}${fmtNum(totalSf)} SF on ${firmConfig.sfSymbol}${landAcres} acres in ${submarket}`,
          `${waltYears} Year WALT with scheduled rent growth`,
          `Functional ${propertyType.toLowerCase()} building with ${clearHeight}, ${dockDoors} dock-high doors`,
          `Strategic location with access to major distribution corridors`,
          `Below market rents with near-term mark-to-market upside`,
        ];

      // ─── Build the PDF Document ─────────────────────────────────────

      const OMDocument = (
        <Document>
          {/* ══════════════════════════════════════════════════════════════
              PAGE 1 — COVER
              ══════════════════════════════════════════════════════════════ */}
          <Page size="A4" orientation="landscape" style={s.coverPage}>
            <View style={{ flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const }}>
              {/* Firm tagline */}
              <Text style={s.coverFirmLine}>
                {`A ${firmConfig.displayName.toUpperCase()} ${firmConfig.group.toUpperCase()} INVESTMENT OPPORTUNITY`}
              </Text>

              {/* Property name */}
              <Text style={s.coverPropertyName}>{propertyName}</Text>

              {/* Address */}
              <Text style={s.coverAddress}>{address}</Text>

              {/* Coverline metrics */}
              <Text style={s.coverMetricsLine}>
                {`STABLE IN-PLACE CASH FLOW  |  ${occupancy}% LEASED  |  ${firmConfig.sfSymbol}${fmtNum(totalSf)} SF  |  ${firmConfig.sfSymbol}${landAcres} ACRES  |  ${waltYears} YEAR WALT`}
              </Text>

              {/* Blue accent divider */}
              <View style={s.coverDivider} />

              {/* Confidential label */}
              <Text style={s.coverConfidential}>CONFIDENTIAL OFFERING MEMORANDUM</Text>
            </View>
          </Page>

          {/* ══════════════════════════════════════════════════════════════
              PAGE 2 — EXECUTIVE SUMMARY
              ══════════════════════════════════════════════════════════════ */}
          <Page size="A4" orientation="landscape" style={s.landscapePage}>
            <HeaderBar firmName={firmConfig.displayName} propName={propertyName} />
            <View style={s.pageBody}>
              <SectionTitle title="Executive Summary" />

              <View style={[s.row, { gap: 20 }]}>
                {/* Left column — 55% text */}
                <View style={{ width: '53%' }}>
                  <Text style={[s.bodyText, { marginBottom: 16 }]}>
                    {execSummaryText}
                  </Text>

                  {/* Investment Highlights */}
                  <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY_HEADER, marginBottom: 10 }}>
                    Investment Highlights
                  </Text>
                  <View style={{ flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 }}>
                    {highlights.slice(0, 6).map((h, i) => (
                      <View key={i} style={[s.highlightCard, { width: '48%' }]}>
                        <View style={s.highlightDot} />
                        <Text style={s.highlightText}>{h}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Right column — 45% Investment Snapshot */}
                <View style={{ width: '45%' }}>
                  <View style={s.calloutCard}>
                    <Text style={s.calloutCardTitle}>Investment Snapshot</Text>
                    <View style={{ flexDirection: 'row' as const, flexWrap: 'wrap' as const }}>
                      <MetricCell value={`${firmConfig.sfSymbol}${fmtNum(totalSf)}`} label="Total SF" />
                      <MetricCell value={`${firmConfig.sfSymbol}${landAcres} AC`} label="Land Area" />
                      <MetricCell value={String(yearBuilt)} label="Year Built" />
                      <MetricCell value={`${occupancy}%`} label="Occupancy" />
                      <MetricCell value={`${waltYears} YR`} label="WALT" />
                      <MetricCell value={clearHeight} label="Clear Height" />
                      <MetricCell value={String(dockDoors)} label="Dock Doors" />
                      <MetricCell value={String(gradeDoors)} label="Grade Doors" />
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <PageFooter pageNum={2} />
          </Page>

          {/* ══════════════════════════════════════════════════════════════
              PAGE 3 — PROPERTY PHOTOS
              ══════════════════════════════════════════════════════════════ */}
          <Page size="A4" orientation="landscape" style={s.landscapePage}>
            <HeaderBar firmName={firmConfig.displayName} propName={propertyName} />
            <View style={s.pageBody}>
              <SectionTitle title="Property Overview" />

              {/* 2x2 photo grid */}
              <View style={{ flexDirection: 'row' as const, gap: 12, marginBottom: 12 }}>
                <PhotoOrPlaceholder index={0} photoB64={photoB64Array[0]} width="49%" height={210} />
                <PhotoOrPlaceholder index={1} photoB64={photoB64Array[1]} width="49%" height={210} />
              </View>
              <View style={{ flexDirection: 'row' as const, gap: 12 }}>
                <PhotoOrPlaceholder index={2} photoB64={photoB64Array[2]} width="49%" height={210} />
                <PhotoOrPlaceholder index={3} photoB64={photoB64Array[3]} width="49%" height={210} />
              </View>

              {/* Captions */}
              <View style={{ flexDirection: 'row' as const, gap: 12, marginTop: 6 }}>
                {[1, 2, 3, 4].map((n) => (
                  <View key={n} style={{ width: '24%' }}>
                    <Text style={{ fontSize: 7, color: TEXT_MUTED, textAlign: 'center' as const }}>
                      {photoB64Array[n - 1] ? `Photo ${n}` : `Photo ${n} — Placeholder`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <PageFooter pageNum={3} />
          </Page>

          {/* ══════════════════════════════════════════════════════════════
              PAGE 4 — AERIAL / LOCATION
              ══════════════════════════════════════════════════════════════ */}
          <Page size="A4" orientation="landscape" style={s.landscapePage}>
            <HeaderBar firmName={firmConfig.displayName} propName={propertyName} />
            <View style={s.pageBody}>
              <SectionTitle title="Location Overview" />

              {/* Aerial placeholder */}
              <View style={[s.placeholderBox, { width: '100%', height: 300, marginBottom: 16 }]}>
                <Text style={[s.placeholderText, { fontSize: 14 }]}>Aerial View — Map Placeholder</Text>
              </View>

              {/* Three callout cards */}
              <View style={{ flexDirection: 'row' as const, gap: 12 }}>
                {/* Regional Access */}
                <View style={[s.calloutCard, { flex: 1 }]}>
                  <Text style={[s.calloutCardTitle, { fontSize: 10 }]}>Regional Access</Text>
                  <Text style={{ fontSize: 8, color: TEXT_BODY, lineHeight: 1.6 }}>
                    {`\u2022  Interstate 15 — 2 miles\n\u2022  Interstate 215 — 8 miles\n\u2022  Ports of LA/Long Beach — 85 miles\n\u2022  Ontario International Airport — 45 miles`}
                  </Text>
                </View>

                {/* Nearby Tenants */}
                <View style={[s.calloutCard, { flex: 1 }]}>
                  <Text style={[s.calloutCardTitle, { fontSize: 10 }]}>Nearby Tenants</Text>
                  <Text style={{ fontSize: 8, color: TEXT_BODY, lineHeight: 1.6 }}>
                    {`\u2022  Amazon Fulfillment Center\n\u2022  FedEx Ground Hub\n\u2022  Walmart Distribution\n\u2022  Home Depot Supply Chain`}
                  </Text>
                </View>

                {/* Transportation */}
                <View style={[s.calloutCard, { flex: 1 }]}>
                  <Text style={[s.calloutCardTitle, { fontSize: 10 }]}>Transportation</Text>
                  <Text style={{ fontSize: 8, color: TEXT_BODY, lineHeight: 1.6 }}>
                    {`\u2022  Major freight corridors\n\u2022  BNSF Railway access\n\u2022  Intermodal facilities nearby\n\u2022  Growing labor pool within 30 min`}
                  </Text>
                </View>
              </View>
            </View>
            <PageFooter pageNum={4} />
          </Page>

          {/* ══════════════════════════════════════════════════════════════
              PAGE 5 — PROPERTY DESCRIPTION
              ══════════════════════════════════════════════════════════════ */}
          <Page size="A4" orientation="landscape" style={s.landscapePage}>
            <HeaderBar firmName={firmConfig.displayName} propName={propertyName} />
            <View style={s.pageBody}>
              <SectionTitle title="Property Description" />

              <View style={[s.row, { gap: 20 }]}>
                {/* Left 60% — text */}
                <View style={{ width: '58%' }}>
                  <Text style={s.bodyText}>
                    {propertyDescText}
                  </Text>
                </View>

                {/* Right 40% — Building Specifications card */}
                <View style={{ width: '40%' }}>
                  <View style={s.calloutCard}>
                    <Text style={s.calloutCardTitle}>Building Specifications</Text>

                    <View style={s.specRow}>
                      <Text style={s.specLabel}>Clear Height</Text>
                      <Text style={s.specValue}>{clearHeight}</Text>
                    </View>
                    <View style={s.specRow}>
                      <Text style={s.specLabel}>Dock Doors</Text>
                      <Text style={s.specValue}>{dockDoors}</Text>
                    </View>
                    <View style={s.specRow}>
                      <Text style={s.specLabel}>Grade-Level Doors</Text>
                      <Text style={s.specValue}>{gradeDoors}</Text>
                    </View>
                    <View style={s.specRow}>
                      <Text style={s.specLabel}>Parking</Text>
                      <Text style={s.specValue}>{`${parking} spaces`}</Text>
                    </View>
                    <View style={s.specRow}>
                      <Text style={s.specLabel}>Power</Text>
                      <Text style={s.specValue}>3-Phase, 4,000A</Text>
                    </View>
                    <View style={s.specRow}>
                      <Text style={s.specLabel}>Sprinklers</Text>
                      <Text style={s.specValue}>ESFR</Text>
                    </View>
                    <View style={s.specRow}>
                      <Text style={s.specLabel}>Zoning</Text>
                      <Text style={s.specValue}>{zoning}</Text>
                    </View>
                    <View style={s.specRow}>
                      <Text style={s.specLabel}>Year Built</Text>
                      <Text style={s.specValue}>{yearBuilt}</Text>
                    </View>
                    <View style={[s.specRow, { borderBottomWidth: 0 }]}>
                      <Text style={s.specLabel}>Buildings</Text>
                      <Text style={s.specValue}>{numBuildings}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <PageFooter pageNum={5} />
          </Page>

          {/* ══════════════════════════════════════════════════════════════
              PAGE 6 — TENANT OVERVIEW
              ══════════════════════════════════════════════════════════════ */}
          <Page size="A4" orientation="landscape" style={s.landscapePage}>
            <HeaderBar firmName={firmConfig.displayName} propName={propertyName} />
            <View style={s.pageBody}>
              <SectionTitle title="Tenant & Lease Summary" />

              {/* Tenant summary card */}
              <View style={[s.calloutCard, { marginBottom: 20, flexDirection: 'row' as const, justifyContent: 'space-around' as const }]}>
                <View style={{ alignItems: 'center' as const }}>
                  <Text style={[s.metricValue, { fontSize: 16 }]}>
                    {numTenants === 1 ? 'Single Tenant' : `${numTenants} Tenants`}
                  </Text>
                  <Text style={s.metricLabel}>Tenant Profile</Text>
                </View>
                <View style={{ alignItems: 'center' as const }}>
                  <Text style={[s.metricValue, { fontSize: 16 }]}>NNN</Text>
                  <Text style={s.metricLabel}>Lease Type</Text>
                </View>
                <View style={{ alignItems: 'center' as const }}>
                  <Text style={[s.metricValue, { fontSize: 16 }]}>{`${waltYears} Years`}</Text>
                  <Text style={s.metricLabel}>WALT</Text>
                </View>
                <View style={{ alignItems: 'center' as const }}>
                  <Text style={[s.metricValue, { fontSize: 16 }]}>{fmtDollar(noi)}</Text>
                  <Text style={s.metricLabel}>Annual Rent (NOI)</Text>
                </View>
              </View>

              {/* Tenant description */}
              <Text style={[s.bodyText, { marginBottom: 16 }]}>
                {tenantOverviewText}
              </Text>

              {/* Rent Roll Table */}
              <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY_HEADER, marginBottom: 8 }}>
                Rent Roll
              </Text>

              {/* Table Header */}
              <View style={s.tableHeaderRow}>
                <Text style={[s.tableHeaderCell, { width: '8%' }]}>Suite</Text>
                <Text style={[s.tableHeaderCell, { width: '20%' }]}>Tenant</Text>
                <Text style={[s.tableHeaderCell, { width: '12%', textAlign: 'right' as const }]}>SF</Text>
                <Text style={[s.tableHeaderCell, { width: '10%', textAlign: 'right' as const }]}>% of NRA</Text>
                <Text style={[s.tableHeaderCell, { width: '13%', textAlign: 'center' as const }]}>Lease Start</Text>
                <Text style={[s.tableHeaderCell, { width: '13%', textAlign: 'center' as const }]}>Lease End</Text>
                <Text style={[s.tableHeaderCell, { width: '12%', textAlign: 'right' as const }]}>Mo. Rent</Text>
                <Text style={[s.tableHeaderCell, { width: '12%', textAlign: 'right' as const }]}>Ann. PSF</Text>
              </View>

              {/* Table Rows (placeholder data) */}
              {[
                { suite: '100', tenant: 'Primary Tenant', sf: totalSf, pctNra: '100.0%', start: '01/2020', end: '06/2029', moRent: fmtDollar(Math.round(noi / 12)), annPsf: fmtDollarDec(noi / totalSf) },
              ].map((row, i) => (
                <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.tableCell, { width: '8%' }]}>{row.suite}</Text>
                  <Text style={[s.tableCell, { width: '20%' }]}>{row.tenant}</Text>
                  <Text style={[s.tableCell, { width: '12%', textAlign: 'right' as const }]}>{fmtNum(row.sf)}</Text>
                  <Text style={[s.tableCell, { width: '10%', textAlign: 'right' as const }]}>{row.pctNra}</Text>
                  <Text style={[s.tableCell, { width: '13%', textAlign: 'center' as const }]}>{row.start}</Text>
                  <Text style={[s.tableCell, { width: '13%', textAlign: 'center' as const }]}>{row.end}</Text>
                  <Text style={[s.tableCell, { width: '12%', textAlign: 'right' as const }]}>{row.moRent}</Text>
                  <Text style={[s.tableCell, { width: '12%', textAlign: 'right' as const }]}>{row.annPsf}</Text>
                </View>
              ))}

              {/* Totals row */}
              <View style={[s.tableRow, { backgroundColor: '#eef2ff', borderTopWidth: 1, borderTopColor: BLUE_ACCENT }]}>
                <Text style={[s.tableCell, { width: '8%', fontFamily: 'Helvetica-Bold' }]}></Text>
                <Text style={[s.tableCell, { width: '20%', fontFamily: 'Helvetica-Bold' }]}>TOTAL</Text>
                <Text style={[s.tableCell, { width: '12%', textAlign: 'right' as const, fontFamily: 'Helvetica-Bold' }]}>{fmtNum(totalSf)}</Text>
                <Text style={[s.tableCell, { width: '10%', textAlign: 'right' as const, fontFamily: 'Helvetica-Bold' }]}>100.0%</Text>
                <Text style={[s.tableCell, { width: '13%' }]}></Text>
                <Text style={[s.tableCell, { width: '13%' }]}></Text>
                <Text style={[s.tableCell, { width: '12%', textAlign: 'right' as const, fontFamily: 'Helvetica-Bold' }]}>{fmtDollar(Math.round(noi / 12))}</Text>
                <Text style={[s.tableCell, { width: '12%', textAlign: 'right' as const, fontFamily: 'Helvetica-Bold' }]}>{fmtDollarDec(noi / totalSf)}</Text>
              </View>
            </View>
            <PageFooter pageNum={6} />
          </Page>

          {/* ══════════════════════════════════════════════════════════════
              PAGE 7 — FINANCIAL SUMMARY / CASH FLOW
              ══════════════════════════════════════════════════════════════ */}
          <Page size="A4" orientation="landscape" style={s.landscapePage}>
            <HeaderBar firmName={firmConfig.displayName} propName={propertyName} />
            <View style={s.pageBody}>
              <SectionTitle title="Financial Analysis" />

              <View style={[s.row, { gap: 20 }]}>
                {/* Left — Pro Forma Table */}
                <View style={{ width: '58%' }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY_HEADER, marginBottom: 8 }}>
                    Income & Expense Pro Forma
                  </Text>

                  {/* Pro forma header */}
                  <View style={s.tableHeaderRow}>
                    <Text style={[s.tableHeaderCell, { width: '40%' }]}></Text>
                    <Text style={[s.tableHeaderCell, { width: '20%', textAlign: 'right' as const }]}>Year 1</Text>
                    <Text style={[s.tableHeaderCell, { width: '20%', textAlign: 'right' as const }]}>Year 2</Text>
                    <Text style={[s.tableHeaderCell, { width: '20%', textAlign: 'right' as const }]}>Year 3</Text>
                  </View>

                  {/* Pro forma rows */}
                  {(() => {
                    const yr1Gpr = noi * 1.15;
                    const yr1Vacancy = yr1Gpr * 0.03;
                    const yr1Egi = yr1Gpr - yr1Vacancy;
                    const yr1Taxes = noi * 0.06;
                    const yr1Insurance = noi * 0.02;
                    const yr1Cam = noi * 0.04;
                    const yr1Mgmt = noi * 0.03;
                    const yr1TotalExp = yr1Taxes + yr1Insurance + yr1Cam + yr1Mgmt;
                    const yr1Noi = yr1Egi - yr1TotalExp;
                    const growth = 1.03;

                    const proFormaRows = [
                      { label: 'Gross Potential Rent', y1: yr1Gpr, y2: yr1Gpr * growth, y3: yr1Gpr * growth * growth, bold: false },
                      { label: '  Less: Vacancy (3%)', y1: -yr1Vacancy, y2: -yr1Vacancy * growth, y3: -yr1Vacancy * growth * growth, bold: false },
                      { label: 'Effective Gross Income', y1: yr1Egi, y2: yr1Egi * growth, y3: yr1Egi * growth * growth, bold: true },
                      { label: '', y1: 0, y2: 0, y3: 0, bold: false, spacer: true },
                      { label: '  Real Estate Taxes', y1: yr1Taxes, y2: yr1Taxes * growth, y3: yr1Taxes * growth * growth, bold: false },
                      { label: '  Insurance', y1: yr1Insurance, y2: yr1Insurance * growth, y3: yr1Insurance * growth * growth, bold: false },
                      { label: '  CAM / Repairs', y1: yr1Cam, y2: yr1Cam * growth, y3: yr1Cam * growth * growth, bold: false },
                      { label: '  Management (3%)', y1: yr1Mgmt, y2: yr1Mgmt * growth, y3: yr1Mgmt * growth * growth, bold: false },
                      { label: 'Total Operating Expenses', y1: yr1TotalExp, y2: yr1TotalExp * growth, y3: yr1TotalExp * growth * growth, bold: true },
                      { label: '', y1: 0, y2: 0, y3: 0, bold: false, spacer: true },
                      { label: 'Net Operating Income', y1: yr1Noi, y2: yr1Noi * growth, y3: yr1Noi * growth * growth, bold: true },
                    ];

                    return proFormaRows.map((r, i) => {
                      if (r.spacer) {
                        return <View key={i} style={{ height: 6 }} />;
                      }
                      return (
                        <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                          <Text style={[s.tableCell, { width: '40%', fontFamily: r.bold ? 'Helvetica-Bold' : 'Helvetica' }]}>{r.label}</Text>
                          <Text style={[s.tableCell, { width: '20%', textAlign: 'right' as const, fontFamily: r.bold ? 'Helvetica-Bold' : 'Helvetica' }]}>{fmtDollar(Math.round(r.y1))}</Text>
                          <Text style={[s.tableCell, { width: '20%', textAlign: 'right' as const, fontFamily: r.bold ? 'Helvetica-Bold' : 'Helvetica' }]}>{fmtDollar(Math.round(r.y2))}</Text>
                          <Text style={[s.tableCell, { width: '20%', textAlign: 'right' as const, fontFamily: r.bold ? 'Helvetica-Bold' : 'Helvetica' }]}>{fmtDollar(Math.round(r.y3))}</Text>
                        </View>
                      );
                    });
                  })()}
                </View>

                {/* Right — Key Financial Metrics */}
                <View style={{ width: '38%' }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY_HEADER, marginBottom: 8 }}>
                    Key Financial Metrics
                  </Text>

                  <View style={{ gap: 10 }}>
                    <View style={s.finMetricCard}>
                      <Text style={[s.metricValue, { color: BLUE_ACCENT }]}>{fmtDollar(askingPrice)}</Text>
                      <Text style={s.metricLabel}>Asking Price</Text>
                    </View>
                    <View style={s.finMetricCard}>
                      <Text style={[s.metricValue, { color: BLUE_ACCENT }]}>{fmtPct(capRate)}</Text>
                      <Text style={s.metricLabel}>Cap Rate</Text>
                    </View>
                    <View style={{ flexDirection: 'row' as const, gap: 10 }}>
                      <View style={s.finMetricCard}>
                        <Text style={[s.metricValue, { fontSize: 16, color: BLUE_ACCENT }]}>{fmtDollarDec(pricePerSf)}</Text>
                        <Text style={s.metricLabel}>Price / SF</Text>
                      </View>
                      <View style={s.finMetricCard}>
                        <Text style={[s.metricValue, { fontSize: 16, color: BLUE_ACCENT }]}>{fmtDollar(Math.round(noi))}</Text>
                        <Text style={s.metricLabel}>NOI</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <PageFooter pageNum={7} />
          </Page>

          {/* ══════════════════════════════════════════════════════════════
              PAGE 8 — MARKET OVERVIEW
              ══════════════════════════════════════════════════════════════ */}
          <Page size="A4" orientation="landscape" style={s.landscapePage}>
            <HeaderBar firmName={firmConfig.displayName} propName={propertyName} />
            <View style={s.pageBody}>
              <SectionTitle title="Market Overview" />

              <View style={[s.row, { gap: 20 }]}>
                {/* Left 55% — market text */}
                <View style={{ width: '53%' }}>
                  <Text style={s.bodyText}>
                    {marketOverviewText}
                  </Text>
                </View>

                {/* Right 45% — Market Snapshot card */}
                <View style={{ width: '45%' }}>
                  <View style={s.calloutCard}>
                    <Text style={s.calloutCardTitle}>Market Snapshot</Text>

                    <View style={s.specRow}>
                      <Text style={s.specLabel}>Submarket</Text>
                      <Text style={s.specValue}>{submarket}</Text>
                    </View>
                    <View style={s.specRow}>
                      <Text style={s.specLabel}>Submarket Vacancy</Text>
                      <Text style={s.specValue}>3.2%</Text>
                    </View>
                    <View style={s.specRow}>
                      <Text style={s.specLabel}>Avg Asking Rent</Text>
                      <Text style={s.specValue}>$1.15 NNN</Text>
                    </View>
                    <View style={s.specRow}>
                      <Text style={s.specLabel}>Net Absorption (YTD)</Text>
                      <Text style={s.specValue}>2.8 MSF</Text>
                    </View>
                    <View style={s.specRow}>
                      <Text style={s.specLabel}>Under Construction</Text>
                      <Text style={s.specValue}>1.4 MSF</Text>
                    </View>
                    <View style={s.specRow}>
                      <Text style={s.specLabel}>County</Text>
                      <Text style={s.specValue}>{county}</Text>
                    </View>
                    <View style={[s.specRow, { borderBottomWidth: 0 }]}>
                      <Text style={s.specLabel}>5-Yr Avg Rent Growth</Text>
                      <Text style={s.specValue}>4.8%</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <PageFooter pageNum={8} />
          </Page>

          {/* ══════════════════════════════════════════════════════════════
              PAGE 9 — DISCLAIMER
              ══════════════════════════════════════════════════════════════ */}
          <Page size="A4" orientation="landscape" style={s.landscapePage}>
            <HeaderBar firmName={firmConfig.displayName} propName={propertyName} />
            <View style={[s.pageBody, { justifyContent: 'center' as const }]}>
              <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: NAVY_HEADER, marginBottom: 6 }}>
                Confidentiality & Disclaimer
              </Text>
              <View style={{ width: 50, height: 3, backgroundColor: BLUE_ACCENT, marginBottom: 24 }} />

              <Text style={{ fontSize: 9, lineHeight: 1.9, color: TEXT_MUTED, textAlign: 'justify' as const, marginBottom: 40 }}>
                {firmConfig.disclaimer}
              </Text>

              <View style={{ alignItems: 'center' as const, marginTop: 20 }}>
                <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: TEXT_BODY, marginBottom: 4 }}>
                  {firmConfig.fullName}
                </Text>
                <Text style={{ fontSize: 9, color: TEXT_MUTED, marginBottom: 4 }}>
                  {firmConfig.group}
                </Text>
                <Text style={{ fontSize: 8, color: TEXT_LIGHT_MUTED }}>
                  {new Date().getFullYear()}
                </Text>
              </View>
            </View>
            <PageFooter pageNum={9} />
          </Page>
        </Document>
      );

      // Generate blob and download
      const blob = await pdf(OMDocument).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${propertyName.replace(/\s+/g, '_')}_OM_${firmConfig.displayName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  }

  // ─── Loading State ────────────────────────────────────────────────────────────

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

  const firmConfig = FIRM_STYLES[selectedFirmStyle];
  const hasSections = sections.length > 0;

  // ─── Empty State ──────────────────────────────────────────────────────────────

  if (!hasSections && !generating) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Link */}
          <Link
            href={`/deals/${id}`}
            className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block"
          >
            &larr; Back to Deal
          </Link>

          {/* Empty State Card */}
          <div className="bg-white rounded-xl p-12 text-center mt-8">
            {/* Illustration Placeholder */}
            <div className="mx-auto w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <h2
              className="text-2xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Generate your first OM
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Create a professional Offering Memorandum for{' '}
              <span className="font-medium text-gray-700">
                {deal.property_name}
              </span>{' '}
              using AI-powered content generation with firm-specific styling.
            </p>

            {/* Firm Style Selector */}
            <div className="max-w-xs mx-auto mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Firm Style
              </label>
              <select
                value={selectedFirmStyle}
                onChange={(e) =>
                  setSelectedFirmStyle(e.target.value as FirmStyleKey)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                {FIRM_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Generate CTA */}
            <button
              onClick={generateOMSections}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Generate OM
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Editor Layout ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href={`/deals/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block"
        >
          &larr; Back to Deal
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 mt-2">
          <div>
            <h1
              className="text-3xl font-bold text-gray-900"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Offering Memorandum
            </h1>
            <p className="text-gray-500 mt-1">{deal.property_name}</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Firm Style Dropdown */}
            <select
              value={selectedFirmStyle}
              onChange={(e) =>
                setSelectedFirmStyle(e.target.value as FirmStyleKey)
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
            >
              {FIRM_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Regenerate All */}
            <button
              onClick={generateOMSections}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Regenerate All
                </>
              )}
            </button>

            {/* Export PDF */}
            <button
              onClick={handleExportPdf}
              disabled={exportingPdf || sections.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exportingPdf ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                  Exporting...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generating Progress */}
        {generating && (
          <div className="mb-6">
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  Generating OM sections with {firmConfig.displayName} style...
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(generateProgress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {generateProgress < 30
                  ? 'Analyzing property data...'
                  : generateProgress < 60
                  ? 'Writing sections...'
                  : generateProgress < 90
                  ? 'Applying firm voice and formatting...'
                  : 'Finalizing...'}
              </p>
            </div>
          </div>
        )}

        {/* ── Landscape Page Preview (matches PDF layout) ── */}
        {!generating && (() => {
          const firmConfig = FIRM_STYLES[selectedFirmStyle];
          const propertyName = deal?.property_name || 'Property';
          const address = [deal?.address, deal?.city, deal?.state, deal?.zip].filter(Boolean).join(', ');
          const totalSf = deal?.total_sf || 275243;
          const landAcres = deal?.land_area_acres || 12.03;
          const yearBuilt = deal?.year_built || 2001;
          const occupancy = deal?.occupancy_pct ?? 100;
          const waltYears = deal?.walt || 4.5;
          const clearHeight = deal?.clear_height || "32' clear";
          const dockDoors = deal?.dock_doors ?? 44;
          const gradeDoors = deal?.grade_doors ?? 4;
          const parking = deal?.parking_spaces ?? 226;
          const zoning = deal?.zoning || 'LI (Light Industrial)';
          const submarket = deal?.submarket || 'Inland Empire South';
          const askingPrice = deal?.asking_price || 45000000;
          const capRate = deal?.cap_rate || 5.25;
          const pricePerSf = deal?.price_per_sf || (askingPrice / totalSf);
          const noiVal = deal?.noi || (askingPrice * capRate / 100);
          const propertyType = deal?.property_type || 'Industrial';
          const assetClass = deal?.asset_class || 'Single-Tenant NNN';

          // Helper: find section content + index by keyword
          function getSectionContent(keyword: string): { content: string; index: number } | null {
            const idx = sections.findIndex((s) => s.title.toLowerCase().includes(keyword.toLowerCase()));
            if (idx >= 0) return { content: sections[idx].content, index: idx };
            return null;
          }

          const execSummary = getSectionContent('executive summary') || getSectionContent('summary');
          const propDesc = getSectionContent('property description') || getSectionContent('property overview') || getSectionContent('property & tenancy');
          const tenantSection = getSectionContent('tenant') || getSectionContent('lease');
          const marketSection = getSectionContent('market');
          const financialSection = getSectionContent('financial') || getSectionContent('investment analysis') || getSectionContent('financials');

          const coverMetrics = [
            `${fmtNum(totalSf)} SF`,
            `${landAcres} Acres`,
            `${waltYears} Yr WALT`,
            `${occupancy}% Occupied`,
          ].join('  |  ');

          // Shared navy header bar component
          const NavyHeader = () => (
            <div className="h-9 bg-[#0d1117] flex items-center justify-between px-6">
              <span className="text-[10px] text-white/80 tracking-wider uppercase">{firmConfig.displayName}</span>
              <span className="text-[10px] text-white/60">{propertyName}</span>
            </div>
          );

          // Shared page number
          const PageNum = ({ num }: { num: number }) => (
            <div className="absolute bottom-3 right-5 text-[9px] text-gray-400">{num}</div>
          );

          // Editable text block
          const EditableText = ({ sectionIndex, fallback }: { sectionIndex: number | null; fallback: string }) => {
            const isEditing = sectionIndex !== null && editingIndex === sectionIndex;
            return (
              <div
                ref={(el) => { if (sectionIndex !== null) sectionRefs.current[sectionIndex] = el; }}
                contentEditable={isEditing}
                suppressContentEditableWarning
                onClick={() => { if (sectionIndex !== null) handleSectionClick(sectionIndex); }}
                onBlur={() => { if (sectionIndex !== null) handleSectionBlur(sectionIndex); }}
                className={`text-[10px] leading-relaxed text-[#374151] whitespace-pre-wrap outline-none cursor-text ${
                  isEditing ? 'ring-2 ring-blue-200 rounded bg-blue-50/30 p-1' : 'hover:bg-gray-50/50 rounded p-1 -m-1 transition-colors'
                }`}
              >
                {sectionIndex !== null && sections[sectionIndex] ? sections[sectionIndex].content : fallback}
              </div>
            );
          };

          return (
          <div className="space-y-8">

            {/* ════════ PAGE 1 — Cover ════════ */}
            <div className="aspect-[11/8.5] bg-[#0d1117] rounded-xl shadow-lg overflow-hidden relative" style={{ maxWidth: '960px', margin: '0 auto 2rem' }}>
              <div className="flex flex-col items-center justify-center h-full px-12">
                <p className="text-[10px] text-[#64748b] tracking-[3px] uppercase mb-6">{firmConfig.group}</p>
                <p className="text-[10px] text-[#94b4fb] tracking-[4px] uppercase mb-4">{firmConfig.displayName}</p>
                <h1 className="text-3xl font-bold text-white text-center mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>{propertyName}</h1>
                <p className="text-xs text-[#94a3b8] text-center mb-5">{address}</p>
                <p className="text-[10px] text-white/60 text-center tracking-wider mb-6">{coverMetrics}</p>
                <div className="h-0.5 bg-[#2462F5] w-20 mb-6" />
                <p className="text-[9px] text-[#475569] tracking-[3px] uppercase">CONFIDENTIAL OFFERING MEMORANDUM</p>
              </div>
            </div>

            {/* ════════ PAGE 2 — Executive Summary ════════ */}
            <div className="aspect-[11/8.5] bg-white rounded-xl shadow-lg overflow-hidden relative" style={{ maxWidth: '960px', margin: '0 auto 2rem' }}>
              <NavyHeader />
              <div className="flex gap-5 p-6 h-[calc(100%-2.25rem)]">
                {/* Left 55% */}
                <div className="w-[55%] flex flex-col">
                  <h2 className="text-lg font-bold text-[#0d1117] mb-1">Executive Summary</h2>
                  <div className="h-0.5 bg-[#2462F5] w-12 mb-3" />
                  <div className="flex-1 overflow-hidden">
                    <EditableText sectionIndex={execSummary?.index ?? null} fallback={`${firmConfig.openingPhrase} ${propertyName}, a ${fmtNum(totalSf)} SF ${propertyType.toLowerCase()} property located at ${address}.`} />
                  </div>
                  {/* Investment Highlights */}
                  {deal?.highlights && deal.highlights.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] font-bold text-[#0d1117] mb-2 uppercase tracking-wider">Investment Highlights</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {deal.highlights.slice(0, 8).map((h, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2462F5] mt-1 flex-shrink-0" />
                            <span className="text-[9px] text-[#374151] leading-tight">{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Right 45% — Investment Snapshot */}
                <div className="w-[45%]">
                  <div className="bg-[#f8f7f4] rounded-lg p-4">
                    <p className="text-[11px] font-bold text-[#0d1117] mb-3 uppercase tracking-wider">Investment Snapshot</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Total SF', value: fmtNum(totalSf) },
                        { label: 'Land Area', value: `${landAcres} AC` },
                        { label: 'Year Built', value: String(yearBuilt) },
                        { label: 'Occupancy', value: `${occupancy}%` },
                        { label: 'WALT', value: `${waltYears} Yrs` },
                        { label: 'Clear Height', value: clearHeight },
                        { label: 'Dock Doors', value: String(dockDoors) },
                        { label: 'Grade Doors', value: String(gradeDoors) },
                      ].map((m) => (
                        <div key={m.label}>
                          <p className="text-sm font-bold text-[#0d1117]">{m.value}</p>
                          <p className="text-[9px] text-[#6b7280]">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <PageNum num={2} />
            </div>

            {/* ════════ PAGE 3 — Property Photos ════════ */}
            <div className="aspect-[11/8.5] bg-white rounded-xl shadow-lg overflow-hidden relative" style={{ maxWidth: '960px', margin: '0 auto 2rem' }}>
              <NavyHeader />
              <div className="p-6 h-[calc(100%-2.25rem)] flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#0d1117]">Property Overview</h2>
                    <div className="h-0.5 bg-[#2462F5] w-12 mt-1" />
                  </div>
                  <button
                    onClick={() => setShowPhotoPicker(true)}
                    className="text-[10px] text-[#2462F5] hover:text-blue-700 font-medium"
                  >
                    Select Photos
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 flex-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg overflow-hidden bg-[#e5e5e5] flex items-center justify-center">
                      {selectedPhotos[i] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selectedPhotos[i]} alt={`Property photo ${i + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-[#9ca3af]">Property Photo {i + 1}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <PageNum num={3} />
            </div>

            {/* ════════ PAGE 4 — Aerial / Location ════════ */}
            <div className="aspect-[11/8.5] bg-white rounded-xl shadow-lg overflow-hidden relative" style={{ maxWidth: '960px', margin: '0 auto 2rem' }}>
              <NavyHeader />
              <div className="p-6 h-[calc(100%-2.25rem)] flex flex-col">
                <h2 className="text-lg font-bold text-[#0d1117] mb-1">Location Overview</h2>
                <div className="h-0.5 bg-[#2462F5] w-12 mb-4" />
                <div className="flex-1 bg-[#e5e5e5] rounded-lg flex items-center justify-center mb-4" style={{ minHeight: '55%' }}>
                  <span className="text-xs text-[#9ca3af]">Aerial View — Map Placeholder</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['Regional Access', 'Nearby Tenants', 'Transportation'].map((title) => (
                    <div key={title} className="bg-[#f8f7f4] rounded-lg p-3">
                      <p className="text-[10px] font-bold text-[#0d1117] mb-2">{title}</p>
                      {[1, 2, 3].map((n) => (
                        <p key={n} className="text-[9px] text-[#6b7280] mb-1">• Placeholder item {n}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <PageNum num={4} />
            </div>

            {/* ════════ PAGE 5 — Property Description ════════ */}
            <div className="aspect-[11/8.5] bg-white rounded-xl shadow-lg overflow-hidden relative" style={{ maxWidth: '960px', margin: '0 auto 2rem' }}>
              <NavyHeader />
              <div className="flex gap-5 p-6 h-[calc(100%-2.25rem)]">
                {/* Left 58% */}
                <div className="w-[58%] flex flex-col">
                  <h2 className="text-lg font-bold text-[#0d1117] mb-1">Property Description</h2>
                  <div className="h-0.5 bg-[#2462F5] w-12 mb-3" />
                  <div className="flex-1 overflow-hidden">
                    <EditableText sectionIndex={propDesc?.index ?? null} fallback={`${propertyName} is a ${fmtNum(totalSf)} SF ${propertyType.toLowerCase()} facility built in ${yearBuilt}, situated on approximately ${landAcres} acres.`} />
                  </div>
                </div>
                {/* Right 40% — Building Specifications */}
                <div className="w-[42%]">
                  <div className="bg-[#f8f7f4] rounded-lg p-4">
                    <p className="text-[11px] font-bold text-[#0d1117] mb-3 uppercase tracking-wider">Building Specifications</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Clear Height', value: clearHeight },
                        { label: 'Dock Doors', value: String(dockDoors) },
                        { label: 'Grade-Level Doors', value: String(gradeDoors) },
                        { label: 'Parking', value: `${parking} spaces` },
                        { label: 'Power', value: 'TBD' },
                        { label: 'Sprinklers', value: 'TBD' },
                        { label: 'Zoning', value: zoning },
                        { label: 'Year Built', value: String(yearBuilt) },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between border-b border-[#e5e5e5] pb-1">
                          <span className="text-[9px] text-[#6b7280]">{row.label}</span>
                          <span className="text-[9px] font-semibold text-[#0d1117]">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <PageNum num={5} />
            </div>

            {/* ════════ PAGE 6 — Tenant Overview ════════ */}
            <div className="aspect-[11/8.5] bg-white rounded-xl shadow-lg overflow-hidden relative" style={{ maxWidth: '960px', margin: '0 auto 2rem' }}>
              <NavyHeader />
              <div className="p-6 h-[calc(100%-2.25rem)] flex flex-col">
                <h2 className="text-lg font-bold text-[#0d1117] mb-1">Tenant &amp; Lease Summary</h2>
                <div className="h-0.5 bg-[#2462F5] w-12 mb-3" />
                {/* Top metric cards */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {[
                    { label: 'Tenant', value: deal?.num_tenants ? `${deal.num_tenants} Tenant${deal.num_tenants > 1 ? 's' : ''}` : '1 Tenant' },
                    { label: 'Lease Type', value: 'NNN' },
                    { label: 'WALT', value: `${waltYears} Yrs` },
                    { label: 'Annual Rent', value: fmtDollar(noiVal) },
                  ].map((m) => (
                    <div key={m.label} className="bg-[#f8f7f4] rounded-lg p-2 text-center">
                      <p className="text-xs font-bold text-[#0d1117]">{m.value}</p>
                      <p className="text-[8px] text-[#6b7280]">{m.label}</p>
                    </div>
                  ))}
                </div>
                {/* Tenant description */}
                <div className="mb-3">
                  <EditableText sectionIndex={tenantSection?.index ?? null} fallback={`The property is ${occupancy}% leased with ${waltYears} years of WALT remaining.`} />
                </div>
                {/* Rent Roll table */}
                <div className="flex-1 overflow-hidden">
                  <table className="w-full text-[9px]">
                    <thead>
                      <tr className="bg-[#2462F5] text-white">
                        {['Suite', 'Tenant', 'SF', '% of NRA', 'Lease Start', 'Lease End', 'Monthly Rent', 'Annual PSF'].map((col) => (
                          <th key={col} className="px-2 py-1.5 text-left font-semibold">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="px-2 py-1.5">100</td>
                        <td className="px-2 py-1.5">Primary Tenant</td>
                        <td className="px-2 py-1.5">{fmtNum(totalSf)}</td>
                        <td className="px-2 py-1.5">100%</td>
                        <td className="px-2 py-1.5">01/2021</td>
                        <td className="px-2 py-1.5">12/2028</td>
                        <td className="px-2 py-1.5">{fmtDollar(Math.round(noiVal / 12))}</td>
                        <td className="px-2 py-1.5">{fmtDollarDec(noiVal / totalSf)}</td>
                      </tr>
                      <tr className="bg-[#f9fafb] font-bold">
                        <td className="px-2 py-1.5" colSpan={2}>Total</td>
                        <td className="px-2 py-1.5">{fmtNum(totalSf)}</td>
                        <td className="px-2 py-1.5">100%</td>
                        <td className="px-2 py-1.5" colSpan={2} />
                        <td className="px-2 py-1.5">{fmtDollar(Math.round(noiVal / 12))}</td>
                        <td className="px-2 py-1.5">{fmtDollarDec(noiVal / totalSf)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <PageNum num={6} />
            </div>

            {/* ════════ PAGE 7 — Financial Summary ════════ */}
            <div className="aspect-[11/8.5] bg-white rounded-xl shadow-lg overflow-hidden relative" style={{ maxWidth: '960px', margin: '0 auto 2rem' }}>
              <NavyHeader />
              <div className="flex gap-5 p-6 h-[calc(100%-2.25rem)]">
                {/* Left 55% — Pro Forma */}
                <div className="w-[55%] flex flex-col">
                  <h2 className="text-lg font-bold text-[#0d1117] mb-1">Financial Analysis</h2>
                  <div className="h-0.5 bg-[#2462F5] w-12 mb-3" />
                  <div className="mb-3">
                    <EditableText sectionIndex={financialSection?.index ?? null} fallback="The following pro forma illustrates projected income and expenses based on current lease terms." />
                  </div>
                  <table className="w-full text-[9px]">
                    <thead>
                      <tr className="bg-[#2462F5] text-white">
                        <th className="px-2 py-1.5 text-left font-semibold">Item</th>
                        <th className="px-2 py-1.5 text-right font-semibold">Year 1</th>
                        <th className="px-2 py-1.5 text-right font-semibold">Year 2</th>
                        <th className="px-2 py-1.5 text-right font-semibold">Year 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Gross Potential Rent', y1: noiVal * 1.05 },
                        { label: 'Vacancy (5%)', y1: -(noiVal * 0.05) },
                        { label: 'Effective Gross Income', y1: noiVal },
                        { label: 'Operating Expenses', y1: 0 },
                        { label: 'Net Operating Income', y1: noiVal },
                      ].map((row, i) => (
                        <tr key={row.label} className={i % 2 === 1 ? 'bg-[#f9fafb]' : 'bg-white'}>
                          <td className={`px-2 py-1.5 ${row.label === 'Net Operating Income' ? 'font-bold' : ''}`}>{row.label}</td>
                          <td className="px-2 py-1.5 text-right">{fmtDollar(Math.round(row.y1))}</td>
                          <td className="px-2 py-1.5 text-right">{fmtDollar(Math.round(row.y1 * 1.03))}</td>
                          <td className="px-2 py-1.5 text-right">{fmtDollar(Math.round(row.y1 * 1.0609))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Right 45% — Key Financial Metrics */}
                <div className="w-[45%]">
                  <p className="text-[11px] font-bold text-[#0d1117] mb-3 uppercase tracking-wider">Key Financial Metrics</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Asking Price', value: fmtDollar(askingPrice), color: 'bg-[#0d1117] text-white' },
                      { label: 'Cap Rate', value: fmtPct(capRate), color: 'bg-[#2462F5] text-white' },
                      { label: 'Price / SF', value: fmtDollarDec(pricePerSf), color: 'bg-[#f8f7f4] text-[#0d1117]' },
                      { label: 'Net Operating Income', value: fmtDollar(Math.round(noiVal)), color: 'bg-[#f8f7f4] text-[#0d1117]' },
                    ].map((card) => (
                      <div key={card.label} className={`${card.color} rounded-lg p-3`}>
                        <p className="text-[9px] opacity-70 mb-0.5">{card.label}</p>
                        <p className="text-sm font-bold">{card.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <PageNum num={7} />
            </div>

            {/* ════════ PAGE 8 — Market Overview ════════ */}
            <div className="aspect-[11/8.5] bg-white rounded-xl shadow-lg overflow-hidden relative" style={{ maxWidth: '960px', margin: '0 auto 2rem' }}>
              <NavyHeader />
              <div className="flex gap-5 p-6 h-[calc(100%-2.25rem)]">
                {/* Left 55% */}
                <div className="w-[55%] flex flex-col">
                  <h2 className="text-lg font-bold text-[#0d1117] mb-1">Market Overview</h2>
                  <div className="h-0.5 bg-[#2462F5] w-12 mb-3" />
                  <div className="flex-1 overflow-hidden">
                    <EditableText sectionIndex={marketSection?.index ?? null} fallback={`The ${submarket} submarket continues to demonstrate strong industrial fundamentals driven by sustained demand from e-commerce, logistics, and distribution operators.`} />
                  </div>
                </div>
                {/* Right 45% — Market Snapshot */}
                <div className="w-[45%]">
                  <div className="bg-[#f8f7f4] rounded-lg p-4">
                    <p className="text-[11px] font-bold text-[#0d1117] mb-3 uppercase tracking-wider">Market Snapshot</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Submarket Vacancy', value: '3.2%' },
                        { label: 'Avg Asking Rent', value: `${fmtDollarDec(noiVal / totalSf)} NNN` },
                        { label: 'Net Absorption', value: '2.1 MSF' },
                        { label: 'Under Construction', value: '1.4 MSF' },
                        { label: 'Rent Growth', value: '+4.2%' },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between border-b border-[#e5e5e5] pb-1">
                          <span className="text-[9px] text-[#6b7280]">{row.label}</span>
                          <span className="text-[9px] font-semibold text-[#0d1117]">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <PageNum num={8} />
            </div>

            {/* ════════ PAGE 9 — Disclaimer ════════ */}
            <div className="aspect-[11/8.5] bg-white rounded-xl shadow-lg overflow-hidden relative" style={{ maxWidth: '960px', margin: '0 auto 2rem' }}>
              <NavyHeader />
              <div className="p-6 h-[calc(100%-2.25rem)] flex flex-col">
                <h2 className="text-lg font-bold text-[#0d1117] mb-1">Confidentiality &amp; Disclaimer</h2>
                <div className="h-0.5 bg-[#2462F5] w-12 mb-4" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-[10px] leading-relaxed text-[#374151] whitespace-pre-wrap">{firmConfig.disclaimer}</p>
                </div>
                <div className="mt-auto pt-4 border-t border-[#e5e5e5]">
                  <p className="text-[9px] text-[#6b7280] text-center">{firmConfig.displayName} &bull; {firmConfig.group} &bull; 2026</p>
                </div>
              </div>
              <PageNum num={9} />
            </div>

          </div>
          );
        })()}
      </div>

      {/* Photo Picker Modal */}
      {showPhotoPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPhotoPicker(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Select Photos
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedPhotos.length} photo
                  {selectedPhotos.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPhotoPicker(false);
                  saveDraft(sections, selectedPhotos);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {availablePhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availablePhotos.map((photo, index) => {
                    const isSelected = selectedPhotos.includes(photo);
                    return (
                      <button
                        key={`${photo}-${index}`}
                        onClick={() => togglePhotoSelection(photo)}
                        className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo}
                          alt={`Available photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="w-12 h-12 text-gray-300 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-gray-500">
                    No photos available. Upload photos to the deal to see them
                    here.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowPhotoPicker(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPhotoPicker(false);
                  saveDraft(sections, selectedPhotos);
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
