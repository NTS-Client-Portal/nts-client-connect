/**
 * Bulk load import — parsing + smart column mapping.
 *
 * Users upload a CSV or XLSX of loads. Because we don't want to force a rigid
 * template, we detect their columns and fuzzy-map them to our canonical fields
 * (they can then correct the mapping in the UI). The mapped rows become quote
 * requests (shippingquotes rows with status 'quote').
 *
 * No network calls here — pure parsing/transform helpers.
 */

import Fuse from 'fuse.js';

export type FieldGroup = 'freight' | 'origin' | 'destination' | 'dates' | 'other';

export interface CanonicalField {
    key: string;        // maps to a shippingquotes column (or a virtual full-address field)
    label: string;      // human label used in the template + mapping UI
    group: FieldGroup;
    synonyms: string[]; // header variants we try to auto-detect
    example?: string;   // sample value for the downloadable template
    required?: boolean; // used only to score row completeness
}

// Canonical target fields. `key` matches the shippingquotes column name, except
// origin_address / destination_address which are "full address" convenience
// inputs that get parsed into street/city/state/zip when the split columns
// aren't provided.
export const CANONICAL_FIELDS: CanonicalField[] = [
    { key: 'po_number', label: 'PO Number', group: 'freight', synonyms: ['po number', 'po', 'po #', 'po#', 'purchase order', 'purchase order number', 'reference', 'reference number', 'ref', 'ref #', 'customer reference', 'shipper reference', 'order number', 'order #'], example: 'PO-10432' },
    { key: 'freight_type', label: 'Freight Type', group: 'freight', synonyms: ['freight type', 'type', 'load type', 'equipment type', 'shipment type'], example: 'equipment' },
    { key: 'year', label: 'Year', group: 'freight', synonyms: ['year', 'yr', 'equipment year'], example: '2020' },
    { key: 'make', label: 'Make', group: 'freight', synonyms: ['make', 'manufacturer', 'brand'], example: 'Caterpillar' },
    { key: 'model', label: 'Model', group: 'freight', synonyms: ['model', 'equipment model'], example: '320' },
    { key: 'commodity', label: 'Commodity / Description', group: 'freight', synonyms: ['commodity', 'goods', 'description', 'item', 'cargo', 'product', 'load description'], example: 'Excavator' },
    { key: 'length', label: 'Length', group: 'freight', synonyms: ['length', 'len', 'long'], example: '25' },
    { key: 'width', label: 'Width', group: 'freight', synonyms: ['width', 'wide'], example: '8.5' },
    { key: 'height', label: 'Height', group: 'freight', synonyms: ['height', 'tall', 'high'], example: '10' },
    { key: 'weight', label: 'Weight (lbs)', group: 'freight', synonyms: ['weight', 'wt', 'lbs', 'pounds', 'gross weight'], example: '48000' },

    { key: 'origin_name', label: 'Origin Contact', group: 'origin', synonyms: ['origin contact', 'shipper name', 'pickup contact', 'origin name', 'from name', 'shipper'], example: 'Adam Noah' },
    { key: 'origin_phone', label: 'Origin Phone', group: 'origin', synonyms: ['origin phone', 'pickup phone', 'shipper phone', 'from phone'], example: '954-826-4318' },
    { key: 'origin_address', label: 'Origin Address (full)', group: 'origin', synonyms: ['origin address', 'pickup address', 'from address', 'origin', 'pickup location', 'origin full address', 'pickup'], example: '3650 North 56th Avenue, Hollywood, FL 33021' },
    { key: 'origin_street', label: 'Origin Street', group: 'origin', synonyms: ['origin street', 'pickup street', 'from street', 'origin address 1', 'origin street address'], example: '3650 North 56th Avenue' },
    { key: 'origin_city', label: 'Origin City', group: 'origin', synonyms: ['origin city', 'pickup city', 'from city'], example: 'Hollywood' },
    { key: 'origin_state', label: 'Origin State', group: 'origin', synonyms: ['origin state', 'pickup state', 'from state', 'origin st'], example: 'FL' },
    { key: 'origin_zip', label: 'Origin Zip', group: 'origin', synonyms: ['origin zip', 'pickup zip', 'from zip', 'origin postal', 'origin zipcode', 'origin postal code'], example: '33021' },

    { key: 'destination_name', label: 'Destination Contact', group: 'destination', synonyms: ['destination contact', 'consignee name', 'delivery contact', 'destination name', 'to name', 'consignee'], example: 'Bradley Hassoun' },
    { key: 'destination_phone', label: 'Destination Phone', group: 'destination', synonyms: ['destination phone', 'delivery phone', 'consignee phone', 'to phone'], example: '843-223-3769' },
    { key: 'destination_address', label: 'Destination Address (full)', group: 'destination', synonyms: ['destination address', 'delivery address', 'to address', 'destination', 'dropoff address', 'delivery location', 'destination full address', 'delivery'], example: '955 South Federal Highway, Lakewood, NJ 08701' },
    { key: 'destination_street', label: 'Destination Street', group: 'destination', synonyms: ['destination street', 'delivery street', 'to street', 'destination address 1'], example: '955 South Federal Highway' },
    { key: 'destination_city', label: 'Destination City', group: 'destination', synonyms: ['destination city', 'delivery city', 'to city'], example: 'Lakewood' },
    { key: 'destination_state', label: 'Destination State', group: 'destination', synonyms: ['destination state', 'delivery state', 'to state', 'destination st'], example: 'NJ' },
    { key: 'destination_zip', label: 'Destination Zip', group: 'destination', synonyms: ['destination zip', 'delivery zip', 'to zip', 'destination postal', 'destination zipcode'], example: '08701' },

    { key: 'earliest_pickup_date', label: 'Earliest Pickup Date', group: 'dates', synonyms: ['earliest pickup', 'pickup date', 'earliest pickup date', 'pickup', 'ready date', 'pick up date', 'ship date'], example: '2025-01-06' },
    { key: 'latest_pickup_date', label: 'Latest Pickup Date', group: 'dates', synonyms: ['latest pickup', 'latest pickup date', 'pickup by', 'pickup deadline'], example: '2025-01-20' },
    { key: 'due_date', label: 'Delivery / Due Date', group: 'dates', synonyms: ['due date', 'delivery date', 'deliver by', 'drop date', 'dropoff date', 'delivery deadline'], example: '2025-01-25' },

    { key: 'notes', label: 'Notes', group: 'other', synonyms: ['notes', 'note', 'comments', 'remarks', 'special instructions', 'instructions'], example: 'Call ahead before delivery' },
];

const FIELD_BY_KEY: Record<string, CanonicalField> = Object.fromEntries(
    CANONICAL_FIELDS.map((f) => [f.key, f])
);

export interface ParsedSheet {
    headers: string[];
    rows: Record<string, string>[];
}

/** Column mapping: canonical field key -> source header (or '' when unmapped). */
export type ColumnMapping = Record<string, string>;

const normalize = (s: string): string =>
    (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Parse a CSV or XLSX File into headers + row objects (all values as strings). */
export async function parseSpreadsheet(file: File): Promise<ParsedSheet> {
    const name = file.name.toLowerCase();

    if (name.endsWith('.csv') || file.type === 'text/csv') {
        const Papa = (await import('papaparse')).default as any;
        const text = await file.text();
        const result = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h: string) => h.trim(),
        });
        const rows = (result.data as Record<string, string>[]) || [];
        const headers: string[] =
            result.meta?.fields || (rows[0] ? Object.keys(rows[0]) : []);
        return { headers: headers.map((h) => h.trim()), rows };
    }

    // XLSX / XLS — parse the first sheet.
    const XLSX = await import('xlsx');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const matrix = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        raw: false,
        defval: '',
        dateNF: 'yyyy-mm-dd',
    }) as unknown[][];

    const headers = (matrix[0] || []).map((h) => String(h ?? '').trim());
    const rows = matrix
        .slice(1)
        .filter((r) => r.some((c) => String(c ?? '').trim() !== ''))
        .map((r) => {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => {
                obj[h] = r[i] != null ? String(r[i]).trim() : '';
            });
            return obj;
        });

    return { headers, rows };
}

/**
 * Fuzzy-map incoming headers to canonical fields. Returns a mapping keyed by
 * canonical field -> best-matching source header. Each header maps to at most
 * one field and vice versa (greedy best-score assignment).
 */
export function autoMapColumns(headers: string[]): ColumnMapping {
    // Flat index of every synonym/label term for fuzzy search.
    const terms = CANONICAL_FIELDS.flatMap((f) =>
        [f.label, ...f.synonyms].map((t) => ({ key: f.key, term: normalize(t) }))
    );
    const fuse = new Fuse(terms, {
        keys: ['term'],
        includeScore: true,
        threshold: 0.45,
        ignoreLocation: true,
    });

    // Build candidate (header, field, score) triples. Lower score = better.
    const candidates: { header: string; field: string; score: number }[] = [];
    for (const header of headers) {
        const hn = normalize(header);
        if (!hn) continue;

        // Strong exact / substring matches first.
        for (const f of CANONICAL_FIELDS) {
            for (const t of [f.label, ...f.synonyms]) {
                const tn = normalize(t);
                if (hn === tn) candidates.push({ header, field: f.key, score: 0 });
                else if (hn.includes(tn) || tn.includes(hn))
                    candidates.push({ header, field: f.key, score: 0.2 });
            }
        }

        // Fuzzy fallback.
        for (const r of fuse.search(hn).slice(0, 4)) {
            candidates.push({
                header,
                field: r.item.key,
                score: 0.3 + (r.score ?? 0.3),
            });
        }
    }

    candidates.sort((a, b) => a.score - b.score);

    const mapping: ColumnMapping = {};
    const usedHeaders = new Set<string>();
    const usedFields = new Set<string>();
    for (const c of candidates) {
        if (usedHeaders.has(c.header) || usedFields.has(c.field)) continue;
        mapping[c.field] = c.header;
        usedHeaders.add(c.header);
        usedFields.add(c.field);
    }
    return mapping;
}

/** Best-effort parse of a single-line full address into parts. */
export function parseAddress(input: string): {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
} {
    const value = (input || '').trim();
    if (!value) return {};

    const parts = value.split(',').map((p) => p.trim()).filter(Boolean);
    const result: { street?: string; city?: string; state?: string; zip?: string } = {};

    // Pull "ST 12345" (or ST 12345-6789) off the end.
    const last = parts[parts.length - 1] || '';
    const stateZip = last.match(/([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)/);
    if (stateZip) {
        result.state = stateZip[1].toUpperCase();
        result.zip = stateZip[2];
        parts.pop();
    } else {
        const zipOnly = last.match(/^(\d{5}(?:-\d{4})?)$/);
        if (zipOnly) {
            result.zip = zipOnly[1];
            parts.pop();
        }
    }

    if (parts.length >= 2) {
        result.city = parts[parts.length - 1];
        result.street = parts.slice(0, parts.length - 1).join(', ');
    } else if (parts.length === 1) {
        result.street = parts[0];
    }
    return result;
}

/** Normalize a date-ish string to YYYY-MM-DD, or null when unparseable. */
export function parseDateValue(input: string): string | null {
    const value = (input || '').trim();
    if (!value) return null;

    // Already ISO-ish.
    const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) {
        const [, y, m, d] = iso;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    // M/D/Y or M-D-Y.
    const mdy = value.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
    if (mdy) {
        let [, m, d, y] = mdy;
        if (y.length === 2) y = `20${y}`;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    return null;
}

export interface BuildRowOptions {
    userId: string | null;
    companyId: string | null;
}

export interface MappedQuoteRow {
    [key: string]: unknown;
}

const val = (row: Record<string, string>, mapping: ColumnMapping, key: string): string =>
    mapping[key] ? (row[mapping[key]] || '').trim() : '';

/** Turn a source row + mapping into a shippingquotes insert payload. */
export function buildQuoteRow(
    row: Record<string, string>,
    mapping: ColumnMapping,
    opts: BuildRowOptions
): MappedQuoteRow {
    const g = (k: string) => val(row, mapping, k);

    const originAddress = g('origin_address');
    const destAddress = g('destination_address');
    const po = originAddress ? parseAddress(originAddress) : {};
    const pd = destAddress ? parseAddress(destAddress) : {};

    return {
        user_id: opts.userId,
        company_id: opts.companyId,
        status: 'quote',
        created_at: new Date().toISOString(),
        needs_admin_review: !opts.companyId,
        save_to_inventory: false,
        po_number: g('po_number') || null,
        freight_type: g('freight_type') || null,
        year: g('year') || null,
        make: g('make') || null,
        model: g('model') || null,
        commodity: g('commodity') || null,
        length: g('length') || null,
        width: g('width') || null,
        height: g('height') || null,
        weight: g('weight') || null,
        origin_name: g('origin_name') || null,
        origin_phone: g('origin_phone') || null,
        origin_address: originAddress || null,
        origin_street: g('origin_street') || po.street || null,
        origin_city: g('origin_city') || po.city || null,
        origin_state: g('origin_state') || po.state || null,
        origin_zip: g('origin_zip') || po.zip || null,
        destination_name: g('destination_name') || null,
        destination_phone: g('destination_phone') || null,
        destination_street: g('destination_street') || pd.street || null,
        destination_city: g('destination_city') || pd.city || null,
        destination_state: g('destination_state') || pd.state || null,
        destination_zip: g('destination_zip') || pd.zip || null,
        earliest_pickup_date: parseDateValue(g('earliest_pickup_date')),
        latest_pickup_date: parseDateValue(g('latest_pickup_date')),
        due_date: parseDateValue(g('due_date')),
        notes: g('notes') || null,
    };
}

/**
 * A row is considered importable if it has some origin and some destination
 * signal. Returns a list of human-readable problems (empty when valid).
 */
export function validateRow(
    row: Record<string, string>,
    mapping: ColumnMapping
): string[] {
    const g = (k: string) => val(row, mapping, k);
    const problems: string[] = [];

    const hasOrigin = !!(g('origin_address') || g('origin_city') || g('origin_zip'));
    const hasDest = !!(g('destination_address') || g('destination_city') || g('destination_zip'));

    if (!hasOrigin) problems.push('Missing origin');
    if (!hasDest) problems.push('Missing destination');
    return problems;
}

/** Build a CSV template string (canonical headers + one example row). */
export function buildTemplateCsv(): string {
    const headers = CANONICAL_FIELDS.map((f) => f.label);
    const example = CANONICAL_FIELDS.map((f) => f.example ?? '');
    const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    return [headers.map(escape).join(','), example.map(escape).join(',')].join('\n');
}

/** Trigger a browser download of the CSV template. */
export function downloadTemplateCsv(filename = 'nts-load-import-template.csv'): void {
    const blob = new Blob([buildTemplateCsv()], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
