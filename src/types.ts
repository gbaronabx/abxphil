export type RowObject = Record<string, string>;

export type ParsedCsv = {
  headers: string[];
  rows: RowObject[];
};

// Optional provenance to distinguish auto-matches vs user-selected matches
export type MappingProvenance = { origin?: 'auto' | 'manual' };

export type MappingRule = (
  | { kind: 'none' }
  | { kind: 'direct'; source: string }
  | { kind: 'split_name'; source: string; part: 'first' | 'last' }
  | { kind: 'concat'; sources: string[]; separator?: string }
) & MappingProvenance;

export type Mapping = Record<string, MappingRule>;
