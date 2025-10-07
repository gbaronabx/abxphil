import Papa from 'papaparse';
import type { ParsedCsv, RowObject } from '../types';

export async function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results: any) => {
        const rows = (results.data as RowObject[]).filter(Boolean);
        const headers = results.meta?.fields ?? inferHeadersFromRows(rows);
        resolve({ headers: headers ?? [], rows: rows.map(cleanUndefinedToEmpty) });
      },
      error: (err: any) => reject(err),
    });
  });
}

export function unparseCsv(headers: string[], rows: RowObject[]): string {
  return Papa.unparse({ fields: headers, data: rows.map((r) => headers.map((h) => r[h] ?? '')) });
}

function inferHeadersFromRows(rows: RowObject[]): string[] {
  const set = new Set<string>();
  rows.forEach((r) => Object.keys(r || {}).forEach((k) => set.add(k)));
  return Array.from(set);
}

function cleanUndefinedToEmpty(row: RowObject): RowObject {
  const out: RowObject = {};
  Object.entries(row).forEach(([k, v]) => (out[k] = v == null ? '' : String(v)));
  return out;
}

