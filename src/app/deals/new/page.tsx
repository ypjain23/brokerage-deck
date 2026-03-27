'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { supabase, BrokerDeal } from '@/lib/supabase';
import { FIRM_STYLES, FirmStyleKey } from '@/lib/firm-styles';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DealFormData = Omit<BrokerDeal, 'id' | 'created_at' | 'updated_at' | 'om_draft' | 'bov_draft'>;

const PROPERTY_TYPES = [
  'Industrial',
  'Office',
  'Retail',
  'Multifamily',
  'Mixed-Use',
  'Land',
  'Hospitality',
  'Self-Storage',
  'Medical Office',
  'Data Center',
];

const STATUS_OPTIONS = [
  'Active Listing',
  'Under LOI',
  'Under Contract',
  'Closed',
  'Withdrawn',
  'Draft',
];

const FIRM_OPTIONS: { key: FirmStyleKey; label: string }[] = [
  { key: 'cbre', label: 'CBRE' },
  { key: 'cushman', label: 'Cushman & Wakefield' },
  { key: 'jll', label: 'JLL' },
  { key: 'marcus_millichap', label: 'Marcus & Millichap' },
  { key: 'newmark', label: 'Newmark' },
];

function emptyForm(): DealFormData {
  return {
    property_name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    property_type: 'Industrial',
    asset_class: '',
    total_sf: null,
    land_area_acres: null,
    year_built: null,
    occupancy_pct: null,
    num_tenants: null,
    num_buildings: null,
    clear_height: null,
    dock_doors: null,
    grade_doors: null,
    asking_price: null,
    cap_rate: null,
    price_per_sf: null,
    noi: null,
    walt: null,
    zoning: null,
    parking_spaces: null,
    submarket: null,
    county: null,
    highlights: [],
    status: 'Draft',
    firm_style: null,
    photos: [],
    documents: [],
  };
}

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                 */
/* ------------------------------------------------------------------ */

function formatMoneyInput(raw: string): string {
  const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return raw;
  return num.toLocaleString('en-US');
}

function parseMoneyInput(display: string): number | null {
  const num = parseFloat(display.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num;
}

/* ------------------------------------------------------------------ */
/*  Upload Zone component                                              */
/* ------------------------------------------------------------------ */

function UploadZone({
  label,
  accept,
  files,
  onDrop,
  onRemove,
}: {
  label: string;
  accept: Record<string, string[]>;
  files: File[];
  onDrop: (accepted: File[]) => void;
  onRemove: (index: number) => void;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: true,
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        <svg
          className="mx-auto h-8 w-8 text-gray-400 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16v-8m0 0-3 3m3-3 3 3M6.75 20.25h10.5A2.25 2.25 0 0019.5 18V6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6v12a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-500 mt-1">
          {isDragActive ? 'Drop files here...' : 'Drag & drop or click to browse'}
        </p>
      </div>
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="truncate">{f.name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {(f.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function NewDealPage() {
  const router = useRouter();

  // Step management
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 state — files
  const [offeringDocs, setOfferingDocs] = useState<File[]>([]);
  const [financialDocs, setFinancialDocs] = useState<File[]>([]);
  const [propertyPhotos, setPropertyPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Step 2 state — form data
  const [form, setForm] = useState<DealFormData>(emptyForm());

  // Uploaded URLs tracking
  const [uploadedDocUrls, setUploadedDocUrls] = useState<string[]>([]);
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);

  // Step 3 state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  /* ------ Money display state for formatted inputs ------ */
  const [askingPriceDisplay, setAskingPriceDisplay] = useState('');
  const [noiDisplay, setNoiDisplay] = useState('');
  const [pricePerSfDisplay, setPricePerSfDisplay] = useState('');

  /* ------ Helpers ------ */

  const setField = <K extends keyof DealFormData>(key: K, value: DealFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setNumericField = (key: keyof DealFormData, raw: string) => {
    const num = raw === '' ? null : parseFloat(raw);
    setField(key, (num !== null && !isNaN(num) ? num : null) as any);
  };

  /* ------ Step 1: Upload & parse ------ */

  const handleUploadAndParse = useCallback(async () => {
    setUploading(true);
    setUploadError(null);

    try {
      const allFiles = [
        ...offeringDocs.map((f) => ({ file: f, folder: 'offering' })),
        ...financialDocs.map((f) => ({ file: f, folder: 'financial' })),
        ...propertyPhotos.map((f) => ({ file: f, folder: 'photos' })),
      ];

      if (allFiles.length === 0) {
        setUploadError('Please upload at least one document.');
        setUploading(false);
        return;
      }

      const documentUrls: string[] = [];
      const photoUrls: string[] = [];
      const fileNames: string[] = [];

      // Upload each file to Supabase storage
      for (const { file, folder } of allFiles) {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${folder}/${timestamp}-${safeName}`;

        const { data, error } = await supabase.storage
          .from('broker-docs')
          .upload(path, file);

        if (error) {
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('broker-docs')
          .getPublicUrl(data.path);

        const publicUrl = urlData.publicUrl;

        if (folder === 'photos') {
          photoUrls.push(publicUrl);
        } else {
          documentUrls.push(publicUrl);
        }
        fileNames.push(file.name);
      }

      setUploadedDocUrls(documentUrls);
      setUploadedPhotoUrls(photoUrls);

      // Call AI parse endpoint
      const parseRes = await fetch('/api/parse-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentUrls: [...documentUrls, ...photoUrls], fileNames }),
      });

      if (!parseRes.ok) {
        throw new Error('AI parsing failed. You can still fill in fields manually.');
      }

      const parsed = await parseRes.json();

      // Pre-fill form with parsed data
      setForm((prev) => {
        const merged = { ...prev };
        for (const [key, value] of Object.entries(parsed)) {
          if (key in merged && value !== null && value !== undefined && value !== '') {
            (merged as any)[key] = value;
          }
        }
        merged.documents = documentUrls;
        merged.photos = photoUrls;
        return merged;
      });

      // Sync money display fields
      if (parsed.asking_price) setAskingPriceDisplay(formatMoneyInput(String(parsed.asking_price)));
      if (parsed.noi) setNoiDisplay(formatMoneyInput(String(parsed.noi)));
      if (parsed.price_per_sf) setPricePerSfDisplay(formatMoneyInput(String(parsed.price_per_sf)));

      setStep(2);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
      // Still allow moving to step 2 manually on parse failure
      if (uploadedDocUrls.length > 0 || uploadedPhotoUrls.length > 0) {
        setForm((prev) => ({
          ...prev,
          documents: uploadedDocUrls,
          photos: uploadedPhotoUrls,
        }));
      }
    } finally {
      setUploading(false);
    }
  }, [offeringDocs, financialDocs, propertyPhotos, uploadedDocUrls, uploadedPhotoUrls]);

  /* ------ Step 2: Save deal ------ */

  const handleSaveDeal = useCallback(async () => {
    setSaving(true);
    setSaveError(null);

    try {
      const { data, error } = await supabase
        .from('broker_deals')
        .insert([
          {
            property_name: form.property_name,
            address: form.address,
            city: form.city,
            state: form.state,
            zip: form.zip,
            property_type: form.property_type,
            asset_class: form.asset_class,
            total_sf: form.total_sf,
            land_area_acres: form.land_area_acres,
            year_built: form.year_built,
            occupancy_pct: form.occupancy_pct,
            num_tenants: form.num_tenants,
            num_buildings: form.num_buildings,
            clear_height: form.clear_height,
            dock_doors: form.dock_doors,
            grade_doors: form.grade_doors,
            asking_price: form.asking_price,
            cap_rate: form.cap_rate,
            price_per_sf: form.price_per_sf,
            noi: form.noi,
            walt: form.walt,
            zoning: form.zoning,
            parking_spaces: form.parking_spaces,
            submarket: form.submarket,
            county: form.county,
            highlights: form.highlights,
            status: form.status,
            firm_style: form.firm_style,
            photos: form.photos,
            documents: form.documents,
          },
        ])
        .select()
        .single();

      if (error) throw new Error(error.message);

      setSavedId(data.id);
      setStep(3);

      // Redirect after brief success display
      setTimeout(() => {
        router.push(`/deals/${data.id}`);
      }, 2000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save deal');
    } finally {
      setSaving(false);
    }
  }, [form, router]);

  /* ------ Highlight management ------ */

  const addHighlight = () => {
    setForm((prev) => ({
      ...prev,
      highlights: [...(prev.highlights || []), ''],
    }));
  };

  const updateHighlight = (index: number, value: string) => {
    setForm((prev) => {
      const updated = [...(prev.highlights || [])];
      updated[index] = value;
      return { ...prev, highlights: updated };
    });
  };

  const removeHighlight = (index: number) => {
    setForm((prev) => {
      const updated = [...(prev.highlights || [])];
      updated.splice(index, 1);
      return { ...prev, highlights: updated };
    });
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* ---- Step indicator ---- */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-0.5 ${
                    step > s ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/*  STEP 1: Upload Documents                                     */}
        {/* ============================================================ */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              New Deal &mdash; Upload Documents
            </h1>
            <p className="text-gray-500 mb-8">
              Upload offering memorandums, rent rolls, appraisals, and property photos.
              Our AI will extract key deal details automatically.
            </p>

            <div className="grid gap-6">
              <UploadZone
                label="Offering Documents"
                accept={{
                  'application/pdf': ['.pdf'],
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                }}
                files={offeringDocs}
                onDrop={(accepted) => setOfferingDocs((prev) => [...prev, ...accepted])}
                onRemove={(i) => setOfferingDocs((prev) => prev.filter((_, idx) => idx !== i))}
              />

              <UploadZone
                label="Financial Documents"
                accept={{
                  'application/pdf': ['.pdf'],
                  'application/vnd.ms-excel': ['.xls'],
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                  'text/csv': ['.csv'],
                }}
                files={financialDocs}
                onDrop={(accepted) => setFinancialDocs((prev) => [...prev, ...accepted])}
                onRemove={(i) => setFinancialDocs((prev) => prev.filter((_, idx) => idx !== i))}
              />

              <UploadZone
                label="Property Photos"
                accept={{
                  'image/jpeg': ['.jpg', '.jpeg'],
                  'image/png': ['.png'],
                  'image/webp': ['.webp'],
                }}
                files={propertyPhotos}
                onDrop={(accepted) => setPropertyPhotos((prev) => [...prev, ...accepted])}
                onRemove={(i) => setPropertyPhotos((prev) => prev.filter((_, idx) => idx !== i))}
              />
            </div>

            {uploadError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {uploadError}
              </div>
            )}

            <button
              onClick={handleUploadAndParse}
              disabled={uploading}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Uploading &amp; Parsing...
                </>
              ) : (
                'Upload & Parse with AI'
              )}
            </button>

            {/* Skip to manual entry */}
            <button
              onClick={() => setStep(2)}
              className="mt-3 w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors"
            >
              Skip &mdash; enter details manually
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/*  STEP 2: Review Extracted Data                                */}
        {/* ============================================================ */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Review Deal Details
            </h1>
            <p className="text-gray-500 mb-8">
              AI extracted these fields from your documents. Edit anything before saving.
            </p>

            <div className="space-y-8">
              {/* ---- Property Info ---- */}
              <section>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                  Property Info
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Property Name"
                    value={form.property_name}
                    onChange={(v) => setField('property_name', v)}
                  />
                  <FormInput
                    label="Address"
                    value={form.address}
                    onChange={(v) => setField('address', v)}
                  />
                  <FormInput
                    label="City"
                    value={form.city}
                    onChange={(v) => setField('city', v)}
                  />
                  <FormInput
                    label="State"
                    value={form.state}
                    onChange={(v) => setField('state', v)}
                  />
                  <FormInput
                    label="ZIP"
                    value={form.zip}
                    onChange={(v) => setField('zip', v)}
                  />
                  <FormSelect
                    label="Property Type"
                    value={form.property_type}
                    options={PROPERTY_TYPES}
                    onChange={(v) => setField('property_type', v)}
                  />
                  <FormInput
                    label="Asset Class"
                    value={form.asset_class}
                    onChange={(v) => setField('asset_class', v)}
                  />
                </div>
              </section>

              {/* ---- Building Specs ---- */}
              <section>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                  Building Specs
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormNumeric
                    label="Total SF"
                    value={form.total_sf}
                    onChange={(v) => setField('total_sf', v)}
                  />
                  <FormNumeric
                    label="Land Area (Acres)"
                    value={form.land_area_acres}
                    onChange={(v) => setField('land_area_acres', v)}
                    step="0.01"
                  />
                  <FormNumeric
                    label="Year Built"
                    value={form.year_built}
                    onChange={(v) => setField('year_built', v)}
                    step="1"
                  />
                  <FormInput
                    label="Clear Height"
                    value={form.clear_height || ''}
                    onChange={(v) => setField('clear_height', v || null)}
                  />
                  <FormNumeric
                    label="Dock Doors"
                    value={form.dock_doors}
                    onChange={(v) => setField('dock_doors', v)}
                    step="1"
                  />
                  <FormNumeric
                    label="Grade Doors"
                    value={form.grade_doors}
                    onChange={(v) => setField('grade_doors', v)}
                    step="1"
                  />
                  <FormNumeric
                    label="Buildings"
                    value={form.num_buildings}
                    onChange={(v) => setField('num_buildings', v)}
                    step="1"
                  />
                  <FormNumeric
                    label="Parking Spaces"
                    value={form.parking_spaces}
                    onChange={(v) => setField('parking_spaces', v)}
                    step="1"
                  />
                  <FormInput
                    label="Zoning"
                    value={form.zoning || ''}
                    onChange={(v) => setField('zoning', v || null)}
                  />
                </div>
              </section>

              {/* ---- Financial ---- */}
              <section>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                  Financial
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormMoney
                    label="Asking Price"
                    display={askingPriceDisplay}
                    onDisplayChange={setAskingPriceDisplay}
                    onValueChange={(v) => setField('asking_price', v)}
                  />
                  <FormNumeric
                    label="Cap Rate (%)"
                    value={form.cap_rate}
                    onChange={(v) => setField('cap_rate', v)}
                    step="0.01"
                  />
                  <FormMoney
                    label="Price / SF"
                    display={pricePerSfDisplay}
                    onDisplayChange={setPricePerSfDisplay}
                    onValueChange={(v) => setField('price_per_sf', v)}
                  />
                  <FormMoney
                    label="NOI"
                    display={noiDisplay}
                    onDisplayChange={setNoiDisplay}
                    onValueChange={(v) => setField('noi', v)}
                  />
                  <FormNumeric
                    label="WALT (Years)"
                    value={form.walt}
                    onChange={(v) => setField('walt', v)}
                    step="0.1"
                  />
                  <FormNumeric
                    label="Occupancy (%)"
                    value={form.occupancy_pct}
                    onChange={(v) => setField('occupancy_pct', v)}
                    step="0.1"
                  />
                  <FormNumeric
                    label="Tenants"
                    value={form.num_tenants}
                    onChange={(v) => setField('num_tenants', v)}
                    step="1"
                  />
                </div>
              </section>

              {/* ---- Listing ---- */}
              <section>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                  Listing
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Submarket"
                    value={form.submarket || ''}
                    onChange={(v) => setField('submarket', v || null)}
                  />
                  <FormInput
                    label="County"
                    value={form.county || ''}
                    onChange={(v) => setField('county', v || null)}
                  />
                  <FormSelect
                    label="Firm Style"
                    value={form.firm_style || ''}
                    options={FIRM_OPTIONS.map((f) => f.key)}
                    displayOptions={FIRM_OPTIONS.map((f) => f.label)}
                    onChange={(v) => setField('firm_style', v || null)}
                    allowEmpty
                  />
                  <FormSelect
                    label="Status"
                    value={form.status}
                    options={STATUS_OPTIONS}
                    onChange={(v) => setField('status', v)}
                  />
                </div>
              </section>

              {/* ---- Highlights ---- */}
              <section>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                  Highlights
                </h2>
                <div className="space-y-3">
                  {(form.highlights || []).map((h, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => updateHighlight(i, e.target.value)}
                        className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Highlight ${i + 1}`}
                      />
                      <button
                        onClick={() => removeHighlight(i)}
                        className="text-red-400 hover:text-red-600 px-2 transition-colors"
                        title="Remove"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addHighlight}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Highlight
                  </button>
                </div>
              </section>
            </div>

            {saveError && (
              <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {saveError}
              </div>
            )}

            <div className="flex gap-3 mt-10">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSaveDeal}
                disabled={saving || !form.property_name}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Deal'
                )}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  STEP 3: Confirmation                                         */}
        {/* ============================================================ */}
        {step === 3 && (
          <div className="text-center py-20">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Deal Created!</h1>
            <p className="text-gray-500">
              Redirecting to your new deal...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable form field components                                     */
/* ------------------------------------------------------------------ */

function FormInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

function FormNumeric({
  label,
  value,
  onChange,
  step = 'any',
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        value={value !== null && value !== undefined ? value : ''}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            onChange(null);
          } else {
            const num = parseFloat(raw);
            onChange(isNaN(num) ? null : num);
          }
        }}
        step={step}
        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

function FormMoney({
  label,
  display,
  onDisplayChange,
  onValueChange,
}: {
  label: string;
  display: string;
  onDisplayChange: (v: string) => void;
  onValueChange: (v: number | null) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
        <input
          type="text"
          value={display}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, '');
            onDisplayChange(raw);
            onValueChange(parseMoneyInput(raw));
          }}
          onBlur={() => {
            if (display) {
              onDisplayChange(formatMoneyInput(display));
            }
          }}
          className="w-full bg-white border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}

function FormSelect({
  label,
  value,
  options,
  displayOptions,
  onChange,
  allowEmpty,
}: {
  label: string;
  value: string;
  options: string[];
  displayOptions?: string[];
  onChange: (v: string) => void;
  allowEmpty?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {allowEmpty && <option value="">Select...</option>}
        {options.map((opt, i) => (
          <option key={opt} value={opt}>
            {displayOptions ? displayOptions[i] : opt}
          </option>
        ))}
      </select>
    </div>
  );
}
