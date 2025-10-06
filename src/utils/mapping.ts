import type { Mapping, MappingRule, RowObject } from '../types';

export function normalizeHeader(h: string): string {
  return (h || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/firstname|first_name|givenname|fname/, 'firstname')
    .replace(/lastname|last_name|surname|lname|familyname/, 'lastname')
    .replace(/^name$/, 'name');
}

export function tokens(h: string): Set<string> {
  return new Set((h || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = new Set([...a].filter((x) => b.has(x))).size;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

export function autoMap(templateHeaders: string[], sourceHeaders: string[]): Mapping {
  const mapping: Mapping = {};
  const normSource = sourceHeaders.map((s) => ({ raw: s, norm: normalizeHeader(s), toks: tokens(s) }));

  for (const target of templateHeaders) {
    const tNorm = normalizeHeader(target);
    const tToks = tokens(target);

    // 1) Exact raw (case-insensitive)
    const exact = normSource.find((s) => s.raw.toLowerCase() === target.toLowerCase());
    if (exact) {
      mapping[target] = { kind: 'direct', source: exact.raw };
      continue;
    }

    // 2) Exact normalized
    const exactNorm = normSource.find((s) => s.norm === tNorm);
    if (exactNorm) {
      mapping[target] = { kind: 'direct', source: exactNorm.raw };
      continue;
    }

    // 3) Special Name split
    if ((tNorm === 'firstname' || tNorm === 'lastname')) {
      const nameCol = normSource.find((s) => s.norm === 'name' || s.raw.toLowerCase() === 'name');
      if (nameCol) {
        mapping[target] = {
          kind: 'split_name',
          source: nameCol.raw,
          part: tNorm === 'firstname' ? 'first' : 'last',
        };
        continue;
      }
    }

    // 4) Fuzzy by token Jaccard
    let best: { s: string; score: number } | null = null;
    for (const s of normSource) {
      const score = jaccard(tToks, s.toks);
      if (!best || score > best.score) best = { s: s.raw, score };
    }
    if (best && best.score >= 0.6) {
      mapping[target] = { kind: 'direct', source: best.s };
    } else {
      mapping[target] = { kind: 'none' };
    }
  }

  return mapping;
}

export function applyMapping(mapping: Mapping, templateHeaders: string[], sourceRows: RowObject[]): RowObject[] {
  return sourceRows.map((row) => {
    const out: RowObject = {};
    for (const target of templateHeaders) {
      const rule: MappingRule = mapping[target] || { kind: 'none' };
      switch (rule.kind) {
        case 'none':
          out[target] = '';
          break;
        case 'direct':
          out[target] = row[rule.source] ?? '';
          break;
        case 'split_name':
          out[target] = splitName(row[rule.source] ?? '', rule.part);
          break;
        case 'concat': {
          const sep = rule.separator ?? ' ';
          const parts = (rule.sources || []).map((s) => (row[s] ?? '').trim()).filter((v) => v.length > 0);
          out[target] = parts.join(sep);
          break;
        }
      }
    }
    return out;
  });
}

function splitName(full: string, part: 'first' | 'last'): string {
  const s = (full || '').trim();
  if (!s) return '';
  // Case: "Last, First"
  if (s.includes(',')) {
    const [last, first] = s.split(',').map((x) => x.trim());
    return part === 'first' ? (first || '') : (last || '');
  }
  // Default: split by last space -> allows middle names in first
  const idx = s.lastIndexOf(' ');
  if (idx === -1) {
    return part === 'first' ? s : '';
  }
  const first = s.slice(0, idx).trim();
  const last = s.slice(idx + 1).trim();
  return part === 'first' ? first : last;
}
