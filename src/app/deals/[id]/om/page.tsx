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

      // Define PDF styles
      const styles = StyleSheet.create({
        page: {
          padding: 50,
          fontFamily: 'Helvetica',
          fontSize: 11,
          lineHeight: 1.6,
          color: '#1a1a1a',
        },
        coverPage: {
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0f172a',
          height: '100%',
        },
        coverContent: {
          padding: 60,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          flexGrow: 1,
        },
        coverFirmName: {
          fontSize: 14,
          color: '#94a3b8',
          letterSpacing: 4,
          textTransform: 'uppercase' as const,
          marginBottom: 40,
        },
        coverPropertyName: {
          fontSize: 32,
          color: '#ffffff',
          fontFamily: 'Helvetica-Bold',
          textAlign: 'center',
          marginBottom: 16,
        },
        coverAddress: {
          fontSize: 14,
          color: '#cbd5e1',
          textAlign: 'center',
          marginBottom: 40,
        },
        coverDivider: {
          width: 80,
          height: 2,
          backgroundColor: '#3b82f6',
          marginBottom: 40,
        },
        coverLabel: {
          fontSize: 10,
          color: '#64748b',
          letterSpacing: 2,
          textTransform: 'uppercase' as const,
        },
        coverPhoto: {
          width: '100%',
          height: 250,
          objectFit: 'cover' as const,
        },
        sectionTitle: {
          fontSize: 18,
          fontFamily: 'Helvetica-Bold',
          color: '#1e3a5f',
          marginBottom: 16,
          paddingBottom: 8,
          borderBottomWidth: 2,
          borderBottomColor: '#3b82f6',
        },
        sectionContent: {
          fontSize: 11,
          lineHeight: 1.7,
          color: '#374151',
          textAlign: 'justify' as const,
        },
        photoGrid: {
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
        },
        photoItem: {
          width: '48%',
          height: 200,
          objectFit: 'cover' as const,
          borderRadius: 4,
          marginBottom: 10,
        },
        photosTitle: {
          fontSize: 18,
          fontFamily: 'Helvetica-Bold',
          color: '#1e3a5f',
          marginBottom: 20,
          paddingBottom: 8,
          borderBottomWidth: 2,
          borderBottomColor: '#3b82f6',
        },
        disclaimerTitle: {
          fontSize: 14,
          fontFamily: 'Helvetica-Bold',
          color: '#6b7280',
          marginBottom: 20,
        },
        disclaimerText: {
          fontSize: 9,
          lineHeight: 1.8,
          color: '#9ca3af',
          textAlign: 'justify' as const,
        },
        pageFooter: {
          position: 'absolute',
          bottom: 30,
          left: 50,
          right: 50,
          flexDirection: 'row',
          justifyContent: 'space-between',
          fontSize: 8,
          color: '#9ca3af',
        },
      });

      const propertyName = deal.property_name || 'Property';
      const address = [deal.address, deal.city, deal.state, deal.zip]
        .filter(Boolean)
        .join(', ');
      const coverPhotoBase64 =
        selectedPhotos.length > 0 ? photoBase64Map[selectedPhotos[0]] : null;

      // Build PDF document
      const OMDocument = (
        <Document>
          {/* Cover Page */}
          <Page size="LETTER" style={{ padding: 0 }}>
            <View style={styles.coverPage}>
              {coverPhotoBase64 && (
                <Image src={coverPhotoBase64} style={styles.coverPhoto} />
              )}
              <View style={styles.coverContent}>
                <Text style={styles.coverFirmName}>
                  {firmConfig.displayName}
                </Text>
                <Text style={styles.coverPropertyName}>{propertyName}</Text>
                <Text style={styles.coverAddress}>{address}</Text>
                <View style={styles.coverDivider} />
                <Text style={styles.coverLabel}>OFFERING MEMORANDUM</Text>
              </View>
            </View>
          </Page>

          {/* Section Pages */}
          {sections.map((section, idx) => (
            <Page key={idx} size="LETTER" style={styles.page}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
              <View style={styles.pageFooter} fixed>
                <Text>{firmConfig.displayName}</Text>
                <Text>{propertyName}</Text>
              </View>
            </Page>
          ))}

          {/* Photos Page */}
          {selectedPhotos.length > 0 && (
            <Page size="LETTER" style={styles.page}>
              <Text style={styles.photosTitle}>Property Photos</Text>
              <View style={styles.photoGrid}>
                {selectedPhotos.map((photoUrl, idx) => {
                  const b64 = photoBase64Map[photoUrl];
                  if (!b64) return null;
                  return (
                    <Image key={idx} src={b64} style={styles.photoItem} />
                  );
                })}
              </View>
              <View style={styles.pageFooter} fixed>
                <Text>{firmConfig.displayName}</Text>
                <Text>{propertyName}</Text>
              </View>
            </Page>
          )}

          {/* Disclaimer Page */}
          <Page size="LETTER" style={styles.page}>
            <Text style={styles.disclaimerTitle}>Confidentiality & Disclaimer</Text>
            <Text style={styles.disclaimerText}>{firmConfig.disclaimer}</Text>
            <View style={{ marginTop: 40 }}>
              <Text
                style={{
                  fontSize: 10,
                  color: '#6b7280',
                  textAlign: 'center' as const,
                }}
              >
                {firmConfig.fullName}
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  color: '#9ca3af',
                  textAlign: 'center' as const,
                  marginTop: 4,
                }}
              >
                {firmConfig.group}
              </Text>
            </View>
            <View style={styles.pageFooter} fixed>
              <Text>{firmConfig.displayName}</Text>
              <Text>{propertyName}</Text>
            </View>
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

        {/* Sections */}
        {!generating && (
          <div className="space-y-6">
            {sections.map((section, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border-l-4 border-blue-500 cursor-text group relative"
                onClick={() => handleSectionClick(index)}
              >
                {/* Section Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    {section.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    {editingIndex === index && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        Editing
                      </span>
                    )}
                    {savedIndex === index && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <svg
                          className="w-3 h-3"
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
                        Saved
                      </span>
                    )}
                  </div>
                </div>

                {/* Section Content */}
                <div
                  ref={(el) => {
                    sectionRefs.current[index] = el;
                  }}
                  contentEditable={editingIndex === index}
                  suppressContentEditableWarning
                  onBlur={() => handleSectionBlur(index)}
                  className={`text-sm text-gray-700 leading-relaxed whitespace-pre-wrap outline-none ${
                    editingIndex === index
                      ? 'ring-2 ring-blue-200 rounded-lg p-3 bg-blue-50/30'
                      : 'group-hover:bg-gray-50/50 rounded-lg p-3 -m-3 transition-colors'
                  }`}
                >
                  {section.content}
                </div>
              </div>
            ))}

            {/* Property Photos Section */}
            <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Property Photos
                </h2>
                <button
                  onClick={() => setShowPhotoPicker(true)}
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Select Photos
                </button>
              </div>

              {selectedPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {selectedPhotos.map((photo, index) => (
                    <div
                      key={`${photo}-${index}`}
                      draggable
                      onDragStart={() => handlePhotoDragStart(index)}
                      onDragOver={(e) => handlePhotoDragOver(e, index)}
                      onDrop={() => handlePhotoDrop(index)}
                      onDragEnd={() => {
                        setDragFrom(null);
                        setDragOver(null);
                      }}
                      className={`relative aspect-[4/3] rounded-lg overflow-hidden cursor-grab active:cursor-grabbing group/photo border-2 transition-colors ${
                        dragOver === index
                          ? 'border-blue-400 scale-105'
                          : 'border-transparent'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={`Property photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/20 transition-colors" />
                      <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover/photo:opacity-100 transition-opacity">
                        {index + 1}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = selectedPhotos.filter(
                            (_, i) => i !== index
                          );
                          setSelectedPhotos(updated);
                          saveDraft(sections, updated);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover/photo:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="w-10 h-10 text-gray-300 mx-auto mb-2"
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
                  <p className="text-sm text-gray-400">
                    No photos selected. Click &quot;Select Photos&quot; to add
                    property images.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
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
