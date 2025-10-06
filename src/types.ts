export type RowObject = Record<string, string>;

export type ParsedCsv = {
  headers: string[];
  rows: RowObject[];
};

export type MappingRule =
  | { kind: 'none' }
  | { kind: 'direct'; source: string }
  | { kind: 'split_name'; source: string; part: 'first' | 'last' }
  | { kind: 'concat'; sources: string[]; separator?: string };

export type Mapping = Record<string, MappingRule>;
