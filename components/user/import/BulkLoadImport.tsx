import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/database.types';
import {
    CANONICAL_FIELDS,
    autoMapColumns,
    buildQuoteRow,
    downloadTemplateCsv,
    parseSpreadsheet,
    validateRow,
    type ColumnMapping,
    type FieldGroup,
    type ParsedSheet,
} from '@/lib/loadImport';
import {
    UploadCloud,
    FileSpreadsheet,
    Download,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Wand2,
    Save,
} from 'lucide-react';

type Step = 'upload' | 'map' | 'review' | 'done';

const GROUP_LABELS: Record<FieldGroup, string> = {
    freight: 'Freight / Equipment',
    origin: 'Origin (Pickup)',
    destination: 'Destination (Delivery)',
    dates: 'Dates',
    other: 'Other',
};

const GROUP_ORDER: FieldGroup[] = ['freight', 'origin', 'destination', 'dates', 'other'];

const BATCH_SIZE = 50;

const BulkLoadImport: React.FC = () => {
    const router = useRouter();
    const session = useSession();
    const supabase = useSupabaseClient<Database>();

    const [step, setStep] = useState<Step>('upload');
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const [parsing, setParsing] = useState(false);
    const [error, setError] = useState('');
    const [sheet, setSheet] = useState<ParsedSheet | null>(null);
    const [mapping, setMapping] = useState<ColumnMapping>({});
    const [dragActive, setDragActive] = useState(false);

    const [importing, setImporting] = useState(false);
    const [saveLocations, setSaveLocations] = useState(true);
    const [saveFreight, setSaveFreight] = useState(true);
    const [result, setResult] = useState<{ inserted: number; skipped: number; savedLocations: number; savedFreight: number } | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchCompany = async () => {
            if (!session?.user?.id) return;
            const { data } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', session.user.id)
                .maybeSingle();
            setCompanyId(data?.company_id ?? null);
        };
        fetchCompany();
    }, [session?.user?.id, supabase]);

    const handleFile = useCallback(async (file: File) => {
        setError('');
        setParsing(true);
        setFileName(file.name);
        try {
            const parsed = await parseSpreadsheet(file);
            if (!parsed.headers.length || !parsed.rows.length) {
                setError('That file has no data rows we could read. Check that the first row is a header.');
                setParsing(false);
                return;
            }
            setSheet(parsed);
            setMapping(autoMapColumns(parsed.headers));
            setStep('map');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not read that file.');
        } finally {
            setParsing(false);
        }
    }, []);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const setFieldMapping = (fieldKey: string, header: string) => {
        setMapping((prev) => {
            const next = { ...prev };
            // A header can only feed one field — clear it from any other field.
            for (const k of Object.keys(next)) {
                if (next[k] === header && k !== fieldKey) delete next[k];
            }
            if (header) next[fieldKey] = header;
            else delete next[fieldKey];
            return next;
        });
    };

    const mappedCount = Object.values(mapping).filter(Boolean).length;

    const builtRows = useMemo(() => {
        if (!sheet) return [];
        return sheet.rows.map((row) => ({
            row,
            payload: buildQuoteRow(row, mapping, { userId: session?.user?.id ?? null, companyId }),
            problems: validateRow(row, mapping),
        }));
    }, [sheet, mapping, session?.user?.id, companyId]);

    const validRows = builtRows.filter((r) => r.problems.length === 0);
    const invalidRows = builtRows.filter((r) => r.problems.length > 0);

    const dedupeLocations = () => {
        const seen = new Set<string>();
        const out: any[] = [];
        for (const { payload } of validRows) {
            const p = payload as any;
            const buildLoc = (prefix: 'origin' | 'destination', type: string) => {
                const city = p[`${prefix}_city`];
                const zip = p[`${prefix}_zip`];
                const street = p[`${prefix}_street`];
                if (!city && !zip && !street) return;
                const key = `${type}|${street || ''}|${city || ''}|${zip || ''}`.toLowerCase();
                if (seen.has(key)) return;
                seen.add(key);
                out.push({
                    user_id: session?.user?.id ?? null,
                    company_id: companyId,
                    label: [street, city, p[`${prefix}_state`], zip].filter(Boolean).join(', ') || `${type} location`,
                    location_type: type,
                    contact_name: p[`${prefix}_name`] || null,
                    phone: p[`${prefix}_phone`] || null,
                    street: street || null,
                    city: city || null,
                    state: p[`${prefix}_state`] || null,
                    zip: zip || null,
                });
            };
            buildLoc('origin', 'origin');
            buildLoc('destination', 'destination');
        }
        return out;
    };

    const dedupeFreight = () => {
        const seen = new Set<string>();
        const out: any[] = [];
        for (const { payload } of validRows) {
            const p = payload as any;
            const label = [p.year, p.make, p.model].filter(Boolean).join(' ') || p.commodity || p.freight_type;
            if (!label) continue;
            const key = `${p.freight_type || ''}|${label}`.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            out.push({
                user_id: session?.user?.id ?? null,
                company_id: companyId,
                label,
                freight_type: p.freight_type || null,
                year: p.year || null,
                make: p.make || null,
                model: p.model || null,
                commodity: p.commodity || null,
                length: p.length || null,
                length_unit: null,
                width: p.width || null,
                width_unit: null,
                height: p.height || null,
                height_unit: null,
                weight: p.weight || null,
                weight_unit: null,
            });
        }
        return out;
    };

    const runImport = async () => {
        if (!validRows.length) return;
        setImporting(true);
        setError('');
        try {
            let inserted = 0;
            const payloads = validRows.map((r) => r.payload);
            for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
                const batch = payloads.slice(i, i + BATCH_SIZE);
                const { error: insertError, data } = await (supabase.from('shippingquotes') as any)
                    .insert(batch)
                    .select('id');
                if (insertError) throw new Error(insertError.message);
                inserted += data?.length ?? batch.length;
            }

            let savedLocations = 0;
            let savedFreight = 0;

            if (saveLocations) {
                const locs = dedupeLocations();
                if (locs.length) {
                    const { error: locError, data } = await (supabase as any)
                        .from('saved_locations')
                        .insert(locs)
                        .select('id');
                    if (!locError) savedLocations = data?.length ?? locs.length;
                }
            }

            if (saveFreight) {
                const fr = dedupeFreight();
                if (fr.length) {
                    const { error: frError, data } = await (supabase as any)
                        .from('saved_freight')
                        .insert(fr)
                        .select('id');
                    if (!frError) savedFreight = data?.length ?? fr.length;
                }
            }

            setResult({ inserted, skipped: invalidRows.length, savedLocations, savedFreight });
            setStep('done');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Import failed.');
        } finally {
            setImporting(false);
        }
    };

    const reset = () => {
        setStep('upload');
        setSheet(null);
        setMapping({});
        setFileName('');
        setError('');
        setResult(null);
    };

    // ---- Steps ---------------------------------------------------------------
    const Stepper = (
        <div className="mb-6 flex items-center gap-2 text-xs font-medium">
            {(['upload', 'map', 'review', 'done'] as Step[]).map((s, i) => {
                const labels = ['Upload', 'Map Columns', 'Review', 'Done'];
                const active = step === s;
                const done = (['upload', 'map', 'review', 'done'] as Step[]).indexOf(step) > i;
                return (
                    <React.Fragment key={s}>
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${
                                active ? 'bg-blue-600 text-white' : done ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                            }`}
                        >
                            {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
                            {labels[i]}
                        </span>
                        {i < 3 && <span className="h-px w-4 bg-slate-200" />}
                    </React.Fragment>
                );
            })}
        </div>
    );

    return (
        <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Bulk Import Loads</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Upload a CSV or Excel file of your loads. We&apos;ll match your columns automatically —
                        no specific template required.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => downloadTemplateCsv()}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                    <Download className="h-4 w-4" />
                    Download template
                </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {Stepper}

                {error && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Step: Upload */}
                {step === 'upload' && (
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragActive(true);
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={onDrop}
                        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
                            dragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50'
                        }`}
                    >
                        {parsing ? (
                            <>
                                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                                <p className="text-sm font-medium text-slate-600">Reading {fileName}…</p>
                            </>
                        ) : (
                            <>
                                <UploadCloud className="h-12 w-12 text-slate-300" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">Drag &amp; drop your file here</p>
                                    <p className="text-xs text-slate-400">CSV, XLSX or XLS</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Choose file
                                </button>
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) handleFile(f);
                                        if (inputRef.current) inputRef.current.value = '';
                                    }}
                                />
                            </>
                        )}
                    </div>
                )}

                {/* Step: Map */}
                {step === 'map' && sheet && (
                    <div>
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Wand2 className="h-4 w-4 text-blue-600" />
                                Auto-matched <strong>{mappedCount}</strong> of {sheet.headers.length} columns from{' '}
                                <strong>{fileName}</strong>. Adjust anything below.
                            </div>
                            <span className="text-xs text-slate-400">{sheet.rows.length} rows detected</span>
                        </div>

                        <div className="space-y-6">
                            {GROUP_ORDER.map((group) => {
                                const fields = CANONICAL_FIELDS.filter((f) => f.group === group);
                                return (
                                    <div key={group}>
                                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            {GROUP_LABELS[group]}
                                        </h3>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {fields.map((f) => (
                                                <div key={f.key} className="rounded-lg border border-slate-200 p-3">
                                                    <label className="mb-1 block text-xs font-medium text-slate-600">{f.label}</label>
                                                    <select
                                                        value={mapping[f.key] || ''}
                                                        onChange={(e) => setFieldMapping(f.key, e.target.value)}
                                                        className={`w-full rounded-md border px-2 py-1.5 text-sm ${
                                                            mapping[f.key] ? 'border-blue-300 bg-blue-50/40 text-slate-800' : 'border-slate-200 text-slate-400'
                                                        }`}
                                                    >
                                                        <option value="">— Not mapped —</option>
                                                        {sheet.headers.map((h) => (
                                                            <option key={h} value={h}>
                                                                {h}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={reset}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Start over
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep('review')}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                Review {sheet.rows.length} rows
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Review */}
                {step === 'review' && sheet && (
                    <div>
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {validRows.length} ready to import
                            </span>
                            {invalidRows.length > 0 && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    {invalidRows.length} skipped (missing origin/destination)
                                </span>
                            )}
                        </div>

                        <div className="max-h-80 overflow-auto rounded-lg border border-slate-200">
                            <table className="w-full text-left text-xs">
                                <thead className="sticky top-0 bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">#</th>
                                        <th className="px-3 py-2 font-medium">Freight</th>
                                        <th className="px-3 py-2 font-medium">Origin</th>
                                        <th className="px-3 py-2 font-medium">Destination</th>
                                        <th className="px-3 py-2 font-medium">Pickup</th>
                                        <th className="px-3 py-2 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {builtRows.slice(0, 100).map((r, i) => {
                                        const p = r.payload as any;
                                        const ok = r.problems.length === 0;
                                        return (
                                            <tr key={i} className={ok ? '' : 'bg-amber-50/50'}>
                                                <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                                                <td className="px-3 py-2 text-slate-700">
                                                    {[p.year, p.make, p.model].filter(Boolean).join(' ') || p.commodity || p.freight_type || '—'}
                                                </td>
                                                <td className="px-3 py-2 text-slate-700">
                                                    {[p.origin_city, p.origin_state].filter(Boolean).join(', ') || p.origin_zip || p.origin_address || '—'}
                                                </td>
                                                <td className="px-3 py-2 text-slate-700">
                                                    {[p.destination_city, p.destination_state].filter(Boolean).join(', ') || p.destination_zip || '—'}
                                                </td>
                                                <td className="px-3 py-2 text-slate-700">{p.earliest_pickup_date || '—'}</td>
                                                <td className="px-3 py-2">
                                                    {ok ? (
                                                        <span className="text-green-600">Ready</span>
                                                    ) : (
                                                        <span className="text-amber-600" title={r.problems.join(', ')}>
                                                            {r.problems.join(', ')}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {builtRows.length > 100 && (
                            <p className="mt-2 text-xs text-slate-400">Showing first 100 of {builtRows.length} rows.</p>
                        )}

                        <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input type="checkbox" checked={saveLocations} onChange={(e) => setSaveLocations(e.target.checked)} />
                                <Save className="h-4 w-4 text-slate-400" />
                                Save these origins &amp; destinations to my library for future quotes
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input type="checkbox" checked={saveFreight} onChange={(e) => setSaveFreight(e.target.checked)} />
                                <Save className="h-4 w-4 text-slate-400" />
                                Save this freight to my library for future quotes
                            </label>
                        </div>

                        {!companyId && (
                            <p className="mt-3 text-xs text-amber-600">
                                Heads up: your account has no company assigned yet, so imported quotes will be flagged for review.
                            </p>
                        )}

                        <div className="mt-6 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setStep('map')}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to mapping
                            </button>
                            <button
                                type="button"
                                onClick={runImport}
                                disabled={importing || validRows.length === 0}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                                {importing ? 'Importing…' : `Import ${validRows.length} loads`}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Done */}
                {step === 'done' && result && (
                    <div className="flex flex-col items-center gap-4 py-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Import complete</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {result.inserted} quote request{result.inserted === 1 ? '' : 's'} created
                                {result.skipped > 0 && `, ${result.skipped} skipped`}.
                            </p>
                            {(result.savedLocations > 0 || result.savedFreight > 0) && (
                                <p className="mt-1 text-xs text-slate-400">
                                    Saved {result.savedLocations} location{result.savedLocations === 1 ? '' : 's'} and{' '}
                                    {result.savedFreight} freight item{result.savedFreight === 1 ? '' : 's'} to your library.
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={reset}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                            >
                                Import another file
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push('/user/logistics-management?tab=requests')}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                View my quote requests
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BulkLoadImport;
