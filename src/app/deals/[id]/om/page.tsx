'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, BrokerDeal } from '@/lib/supabase';
import { WINCHESTER_SEED } from '@/lib/seed-data';
import { FIRM_STYLES, FirmStyleKey } from '@/lib/firm-styles';
import { CushmanOM } from '@/templates/cushman/CushmanOM';
import type { CushmanOMData } from '@/templates/cushman/types';

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

export default function OMEditorPage() {
  const params = useParams();
  const id = params.id as string;

  const [deal, setDeal] = useState<Partial<BrokerDeal> | null>(null);
  const [sections, setSections] = useState<{ title: string; content: string }[]>([]);
  const [selectedFirmStyle, setSelectedFirmStyle] = useState<FirmStyleKey>('cushman');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  // Photo picker state
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [availablePhotos, setAvailablePhotos] = useState<string[]>([]);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Fetch Deal ─────────────────────────────────────────────────────────────

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

  // ─── Fetch available photos ─────────────────────────────────────────────────

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
        // Silently fail
      }

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

  // ─── Save draft ─────────────────────────────────────────────────────────────

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

  const debouncedSaveDraft = useCallback(
    (updatedSections: OMSection[], photos?: string[]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveDraft(updatedSections, photos);
      }, 1000);
    },
    [saveDraft]
  );

  // ─── Generate OM ────────────────────────────────────────────────────────────

  async function generateOMSections() {
    if (!deal) return;

    setGenerating(true);
    setGenerateProgress(0);

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

  // ─── Section change handler ─────────────────────────────────────────────────

  function handleSectionChange(index: number, newContent: string) {
    const updatedSections = [...sections];
    updatedSections[index] = { ...updatedSections[index], content: newContent };
    setSections(updatedSections);
    debouncedSaveDraft(updatedSections);
  }

  // ─── Export PDF ─────────────────────────────────────────────────────────────

  function handleExportPdf() {
    const printWindow = window.open(`/deals/${id}/om/print`, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print();
        }, 1500);
      });
    }
  }

  // ─── Photo picker handlers ─────────────────────────────────────────────────

  function togglePhotoSelection(url: string) {
    setSelectedPhotos((prev) => {
      const next = prev.includes(url) ? prev.filter((p) => p !== url) : [...prev, url];
      debouncedSaveDraft(sections, next);
      return next;
    });
  }

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
    const reordered = [...selectedPhotos];
    const [moved] = reordered.splice(dragFrom, 1);
    reordered.splice(index, 0, moved);
    setSelectedPhotos(reordered);
    debouncedSaveDraft(sections, reordered);
    setDragFrom(null);
    setDragOver(null);
  }

  // ─── Build OM data ─────────────────────────────────────────────────────────

  const omData: CushmanOMData = {
    deal: deal || {},
    sections,
    selectedPhotos,
    firmStyle: selectedFirmStyle,
  };

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#666', fontSize: 18 }}>Loading deal...</p>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {/* ── Toolbar ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link
            href={`/deals/${id}`}
            style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}
          >
            &larr; Back to Deal
          </Link>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#111827' }}>
            Offering Memorandum
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select
            value={selectedFirmStyle}
            onChange={(e) => setSelectedFirmStyle(e.target.value as FirmStyleKey)}
            style={{
              padding: '6px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
              background: '#fff',
            }}
          >
            {FIRM_OPTIONS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowPhotoPicker(true)}
            style={{
              padding: '6px 16px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Photos ({selectedPhotos.length})
          </button>

          <button
            onClick={generateOMSections}
            disabled={generating}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              background: generating ? '#9ca3af' : '#2563eb',
              color: '#fff',
              cursor: generating ? 'not-allowed' : 'pointer',
              fontWeight: 500,
            }}
          >
            {generating ? 'Generating...' : sections.length > 0 ? 'Regenerate All' : 'Generate OM'}
          </button>

          {sections.length > 0 && (
            <button
              onClick={handleExportPdf}
              style={{
                padding: '6px 16px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                background: '#fff',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* ── Generating progress ── */}
      {generating && (
        <div style={{ padding: '24px 24px 0', maxWidth: 600, margin: '0 auto' }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: 24,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 12px', fontWeight: 500 }}>
              Generating your Offering Memorandum...
            </p>
            <div
              style={{
                background: '#e5e7eb',
                borderRadius: 999,
                height: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: '#2563eb',
                  height: '100%',
                  width: `${generateProgress}%`,
                  borderRadius: 999,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#6b7280' }}>
              {Math.round(generateProgress)}%
            </p>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!generating && sections.length === 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 60px)',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '48px 40px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              textAlign: 'center',
              maxWidth: 420,
              width: '100%',
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: '#111827' }}>
              Generate your first OM
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 24px' }}>
              Select a firm style and generate AI-powered content for your Offering Memorandum.
            </p>

            <select
              value={selectedFirmStyle}
              onChange={(e) => setSelectedFirmStyle(e.target.value as FirmStyleKey)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                width: '100%',
                marginBottom: 16,
                background: '#fff',
              }}
            >
              {FIRM_OPTIONS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>

            <button
              onClick={generateOMSections}
              style={{
                padding: '10px 24px',
                border: 'none',
                borderRadius: 6,
                fontSize: 15,
                background: '#2563eb',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                width: '100%',
              }}
            >
              Generate OM
            </button>
          </div>
        </div>
      )}

      {/* ── OM Document ── */}
      {!generating && sections.length > 0 && (
        <div ref={containerRef} style={{ width: '100%', overflowX: 'auto', padding: '24px 0' }}>
          <div
            style={{
              transform: 'scale(0.55)',
              transformOrigin: 'top center',
              width: 1056,
              margin: '0 auto',
            }}
          >
            <CushmanOM data={omData} onSectionChange={handleSectionChange} />
          </div>
        </div>
      )}

      {/* ── Photo Picker Modal ── */}
      {showPhotoPicker && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onClick={() => setShowPhotoPicker(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              maxWidth: 720,
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                Select & Order Photos ({selectedPhotos.length} selected)
              </h3>
              <button
                onClick={() => setShowPhotoPicker(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                &times;
              </button>
            </div>

            {/* Selected photos (draggable) */}
            {selectedPhotos.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                  Drag to reorder. Click to remove.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedPhotos.map((url, i) => (
                    <div
                      key={url}
                      draggable
                      onDragStart={() => handlePhotoDragStart(i)}
                      onDragOver={(e) => handlePhotoDragOver(e, i)}
                      onDrop={() => handlePhotoDrop(i)}
                      onClick={() => togglePhotoSelection(url)}
                      style={{
                        width: 100,
                        height: 75,
                        borderRadius: 6,
                        overflow: 'hidden',
                        border:
                          dragOver === i ? '2px solid #2563eb' : '2px solid #10b981',
                        cursor: 'grab',
                        position: 'relative',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: 2,
                          background: '#10b981',
                          color: '#fff',
                          borderRadius: 4,
                          padding: '1px 5px',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available photos */}
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
              Available photos (click to toggle):
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {availablePhotos.map((url) => {
                const isSelected = selectedPhotos.includes(url);
                return (
                  <div
                    key={url}
                    onClick={() => togglePhotoSelection(url)}
                    style={{
                      width: 100,
                      height: 75,
                      borderRadius: 6,
                      overflow: 'hidden',
                      border: isSelected
                        ? '2px solid #10b981'
                        : '2px solid #e5e7eb',
                      cursor: 'pointer',
                      opacity: isSelected ? 1 : 0.6,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Available"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                );
              })}
              {availablePhotos.length === 0 && (
                <p style={{ color: '#9ca3af', fontSize: 13 }}>
                  No photos found. Upload photos to the deal first.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
