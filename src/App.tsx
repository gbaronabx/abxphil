import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { AppBar, Backdrop, Box, Button, Chip, Container, FormControl, InputLabel, MenuItem, Paper, Popover, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Toolbar, Typography } from '@mui/material';
import { parseCsvFile, unparseCsv } from './utils/csv';
import type { Mapping, MappingRule, ParsedCsv, RowObject } from './types';
import { applyMapping, autoMap } from './utils/mapping';
import { saveAs } from 'file-saver';
import { Close } from '@mui/icons-material';


function App() {
  const [templateCsv, setTemplateCsv] = useState<ParsedCsv | null>(null);
  const [dataCsv, setDataCsv] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});

  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const tourSteps = [
    { anchorId: 'btn-upload-template', title: 'Upload Template CSV', body: 'Choose your destination field list (the template) to define the columns you want to produce.' },
    { anchorId: 'btn-upload-data', title: 'Upload Data CSV', body: 'Select the source data you want to map into the template.' },
    { anchorId: 'mapping-table', title: 'Map Fields', body: 'Use the Source dropdowns and rules (Direct, Split Name, Concatenate) to align columns. Matched rows are highlighted in green.' },
    { anchorId: 'btn-save-mapping', title: 'Save Your Work', body: 'Download a mapping file so you can resume later or share with teammates.' },
    { anchorId: 'btn-upload-save', title: 'Restore a Save', body: 'Re-upload a saved mapping to instantly restore all matches and rules.' },
    { anchorId: 'btn-export', title: 'Export Mapped CSV', body: 'When ready, export a new CSV that matches your template with all rules applied.' },
  ];

  // Auto-start walkthrough on first visit
  useEffect(() => {
    try {
      const key = 'abxphil_walkthrough_seen_v1';
      const seen = localStorage.getItem(key);
      if (!seen) {
        setTourStep(0);
        setTourOpen(true);
      }
    } catch { }
  }, []);

  function markWalkthroughSeen() {
    try {
      localStorage.setItem('abxphil_walkthrough_seen_v1', '1');
    } catch { }
  }



  // Initialize automap when both CSVs are available
  useEffect(() => {
    if (templateCsv && dataCsv) {
      setMapping((prev) => ({ ...autoMap(templateCsv.headers, dataCsv.headers), ...prev }));
    }
  }, [templateCsv, dataCsv]);

  const previewRows: RowObject[] = useMemo(() => {
    if (!templateCsv || !dataCsv) return [];
    return applyMapping(mapping, templateCsv.headers, dataCsv.rows).slice(0, 20);
  }, [mapping, templateCsv, dataCsv]);



  async function onTemplateSelected(file?: File | null) {
    if (!file) return;
    const parsed = await parseCsvFile(file);
    setTemplateCsv(parsed);
  }

  async function onDataSelected(file?: File | null) {
    if (!file) return;
    const parsed = await parseCsvFile(file);
    setDataCsv(parsed);
  }

  function updateRule(target: string, rule: MappingRule) {
    setMapping((m) => ({ ...m, [target]: rule }));
  }


  function exportCsv() {
    if (!templateCsv || !dataCsv) return;
    const rows = applyMapping(mapping, templateCsv.headers, dataCsv.rows);
    const csv = unparseCsv(templateCsv.headers, rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'mapped.csv');
  }
  function saveMappingFile() {
    const payload = {
      version: 1,
      templateHeaders: templateCsv?.headers ?? [],
      sourceHeaders: dataCsv?.headers ?? [],
      mapping,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    saveAs(blob, 'mapping.abxphil.json');
  }

  async function onUploadSaveSelected(file?: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const loaded: Mapping = parsed?.mapping ?? parsed;
      // Filter to current template headers if available
      const allowed = templateCsv?.headers;
      const next: Mapping = {};
      if (loaded && typeof loaded === 'object') {
        const keys = allowed ?? Object.keys(loaded);
        for (const k of keys) {
          if ((loaded as any)[k]) next[k] = (loaded as any)[k] as any;
        }
        setMapping(next);
      }
    } catch (e) {
      console.error('Failed to load saved mapping', e);
    }
  }

  const sourceHeaders = dataCsv?.headers ?? [];
  const templateHeaders = templateCsv?.headers ?? [];


  const currentAnchor = typeof window !== 'undefined' ? (document.getElementById(tourSteps[tourStep]?.anchorId) as HTMLElement | null) : null;

  return (<>
    <AppBar position="static" color="primary" sx={{ mb: 2 }}>
      <Toolbar variant="dense" sx={{ minHeight: 44 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          AkitaBox Phil — CSV Mapper
        </Typography>
        <Box flexGrow={1} />
        <Button color="inherit" size="small" onClick={() => { setTourStep(0); setTourOpen(true); }}>Walkthrough</Button>
      </Toolbar>
    </AppBar>

    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>

        AkitaBox Phil — CSV Mapper
      </Typography>

      <Box display="flex" gap={2} alignItems="center" mb={3}>
        <Button id="btn-upload-template" variant="contained" component="label" color="primary">
          Upload Template CSV
          <input

            hidden
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => onTemplateSelected(e.target.files?.[0])}
          />
        </Button>
        <Typography variant="body2" color="text.secondary">
          {templateCsv ? `${templateHeaders.length} fields` : 'No template uploaded'}
        </Typography>

        <Button id="btn-upload-data" variant="contained" component="label" color="secondary">
          Upload Data CSV
          <input
            hidden
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => onDataSelected(e.target.files?.[0])}
          />
        </Button>
        <Typography variant="body2" color="text.secondary">
          {dataCsv ? `${sourceHeaders.length} columns, ${dataCsv.rows.length} rows` : 'No data uploaded'}
        </Typography>

        <Box flexGrow={1} />
        <Button variant="text" onClick={() => { setTourStep(0); setTourOpen(true); }}>
          Walkthrough
        </Button>
        <Button id="btn-save-mapping" variant="outlined" onClick={saveMappingFile} disabled={Object.keys(mapping).length === 0}>
          Save Mapping
        </Button>
        <Button id="btn-upload-save" variant="outlined" component="label">
          Upload Save
          <input
            hidden
            type="file"
            accept=".json,.abxphil,.abxphil.json,application/json"
            onChange={(e) => onUploadSaveSelected(e.target.files?.[0])}
          />
        </Button>
        <Button id="btn-export" variant="contained" onClick={exportCsv} disabled={!templateCsv || !dataCsv}>
          Export
        </Button>
      </Box>

      {templateCsv && dataCsv && (
        <Box>
          <Box mb={3}>
            {/* Right: Template Mapping */}
            <Box flex={1} minWidth={0}>
              <Typography variant="h6" gutterBottom>
                Template Mapping
              </Typography>
              <TableContainer id="mapping-table" component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Source Column</TableCell>
                      <TableCell width={180}>Rule</TableCell>
                      <TableCell width={280}>Template Field</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {templateHeaders.map((target) => {
                      const rule = mapping[target] ?? { kind: 'none' };
                      const matched = isRuleMatched(rule);
                      return (
                        <TableRow key={target} hover sx={matched ? { backgroundColor: 'rgba(76,175,80,0.06)' } : undefined}>
                          <TableCell sx={matched ? { borderLeft: '3px solid', borderLeftColor: 'success.main' } : undefined}>
                            {rule.kind === 'split_name' ? (
                              <Box display="flex" gap={2} alignItems="center">
                                <FormControl size="small" sx={{ minWidth: 240 }}>
                                  <InputLabel>Source</InputLabel>
                                  <Select
                                    label="Source"
                                    value={(rule as any).source || ''}
                                    onChange={(e) =>
                                      updateRule(target, {
                                        kind: 'split_name',
                                        source: e.target.value,
                                        part: (mapping[target] as any)?.part || guessPart(target),
                                      })
                                    }
                                  >
                                    {sourceHeaders.map((s) => (
                                      <MenuItem key={s} value={s}>
                                        {s}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ minWidth: 160 }}>
                                  <InputLabel>Part</InputLabel>
                                  <Select
                                    label="Part"
                                    value={(rule as any).part || guessPart(target)}
                                    onChange={(e) =>
                                      updateRule(target, {
                                        kind: 'split_name',
                                        source: (rule as any).source,
                                        part: e.target.value as 'first' | 'last',
                                      })
                                    }
                                  >
                                    <MenuItem value="first">First</MenuItem>
                                    <MenuItem value="last">Last</MenuItem>
                                  </Select>
                                </FormControl>
                              </Box>
                            ) : (rule as any).kind === 'concat' ? (
                              <Box display="flex" flexDirection="column" gap={1}>
                                <Box display="flex" flexWrap="wrap" gap={1}>
                                  {((rule as any).sources || []).map((s: string, idx: number) => (
                                    <Chip
                                      key={s}
                                      label={`${idx + 1}. ${s}`}
                                      onDelete={() => {
                                        setMapping((m) => {
                                          const r = (m[target] as any) || { kind: 'concat', sources: [] };
                                          const next = { ...r, sources: r.sources.filter((x: string) => x !== s) };
                                          return { ...m, [target]: next };
                                        });
                                      }}
                                      deleteIcon={<Close fontSize="small" />}
                                      variant="outlined"
                                      color="primary"
                                    />
                                  ))}
                                </Box>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Add source</InputLabel>
                                    <Select
                                      label="Add source"
                                      value=""
                                      onChange={(e) => {
                                        const val = e.target.value as string;
                                        if (!val) return;
                                        setMapping((m) => {
                                          const r = (m[target] as any) || { kind: 'concat', sources: [] };
                                          const exists = (r.sources as string[]).includes(val);
                                          const next = {
                                            ...r,
                                            kind: 'concat',
                                            sources: exists ? r.sources : [...r.sources, val],
                                          };
                                          return { ...m, [target]: next };
                                        });
                                      }}
                                    >
                                      <MenuItem value="" disabled>
                                        Select source
                                      </MenuItem>
                                      {sourceHeaders.map((s) => (
                                        <MenuItem key={s} value={s}>
                                          {s}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                  <TextField
                                    size="small"
                                    label="Separator"
                                    sx={{ width: 140 }}
                                    value={(rule as any).separator ?? ' '}
                                    onChange={(e) => {
                                      const sep = e.target.value;
                                      setMapping((m) => {
                                        const r = (m[target] as any) || { kind: 'concat', sources: [] };
                                        const next = { ...r, kind: 'concat', separator: sep };
                                        return { ...m, [target]: next };
                                      });
                                    }}
                                  />
                                </Box>
                              </Box>
                            ) : (
                              <FormControl size="small" sx={{ minWidth: 240 }}>
                                <InputLabel>Source</InputLabel>
                                <Select
                                  label="Source"
                                  value={rule.kind === 'direct' ? (rule as any).source || '' : ''}
                                  onChange={(e) => {
                                    const val = e.target.value as string;
                                    if (!val) updateRule(target, { kind: 'none' });
                                    else updateRule(target, { kind: 'direct', source: val });
                                  }}
                                  renderValue={(val) =>
                                    !val ? <span style={{ color: '#d32f2f' }}>No match</span> : String(val)
                                  }
                                  sx={{
                                    '& .MuiSelect-select': {
                                      color: rule.kind === 'direct' && (rule as any).source ? 'inherit' : 'error.main',
                                      bgcolor: rule.kind === 'direct' && (rule as any).source ? 'rgba(76,175,80,0.12)' : undefined,
                                      borderRadius: 1,
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: rule.kind === 'direct' && (rule as any).source ? 'success.main' : undefined,
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: rule.kind === 'direct' && (rule as any).source ? 'success.dark' : undefined,
                                    },
                                  }}
                                >
                                  <MenuItem value="">
                                    <em>No match</em>
                                  </MenuItem>
                                  {sourceHeaders.map((s) => (
                                    <MenuItem key={s} value={s}>
                                      {s}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          </TableCell>
                          <TableCell>
                            <FormControl size="small" fullWidth>
                              <InputLabel>Rule</InputLabel>
                              <Select
                                label="Rule"
                                value={rule.kind}
                                onChange={(e) => {
                                  const kind = e.target.value as MappingRule['kind'];
                                  if (kind === 'none') updateRule(target, { kind: 'none' });
                                  if (kind === 'direct')
                                    updateRule(target, {
                                      kind: 'direct',
                                      source: sourceHeaders[0] || '',
                                    });
                                  if (kind === 'split_name')
                                    updateRule(target, {
                                      kind: 'split_name',
                                      source:
                                        findDefaultNameColumn(sourceHeaders) || sourceHeaders[0] || '',
                                      part: guessPart(target),
                                    });
                                  if (kind === 'concat')
                                    updateRule(target, {
                                      kind: 'concat',
                                      sources: [],
                                      separator: ' ',
                                    } as any);
                                }}
                              >
                                <MenuItem value="none">None</MenuItem>
                                <MenuItem value="direct">Direct</MenuItem>
                                <MenuItem value="split_name">Split Name</MenuItem>
                                <MenuItem value="concat">Concatenate</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>{target}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>

          <Typography variant="h6" gutterBottom>
            Preview (first 20 rows)
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {templateHeaders.map((h) => (
                    <TableCell key={h}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewRows.map((row, idx) => (
                  <TableRow key={idx}>
                    {templateHeaders.map((h) => (
                      <TableCell key={h}>{row[h] ?? ''}</TableCell>
                    ))}
                  </TableRow>


                ))}
              </TableBody>
            </Table>
          </TableContainer>


        </Box>
      )}

      {/* Walkthrough Backdrop and Popover */}
      <Backdrop open={tourOpen} sx={{ zIndex: (theme) => theme.zIndex.modal - 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onClick={() => setTourOpen(false)} />
      <Popover
        open={tourOpen}
        anchorEl={currentAnchor}
        onClose={() => setTourOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box p={2} maxWidth={360}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Step {tourStep + 1} of {tourSteps.length}
          </Typography>
          <Typography variant="h6" gutterBottom>
            {tourSteps[tourStep]?.title}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {tourSteps[tourStep]?.body}
          </Typography>
          <Stack direction="row" gap={1} alignItems="center">
            <Button size="small" disabled={tourStep === 0} onClick={() => setTourStep((s) => Math.max(0, s - 1))}>Back</Button>
            <Box flexGrow={1} />
            <Button size="small" color="secondary" onClick={() => { markWalkthroughSeen(); setTourOpen(false); }}>Don't show again</Button>
            <Button size="small" onClick={() => setTourOpen(false)}>Close</Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                if (tourStep < tourSteps.length - 1) setTourStep((s) => s + 1);
                else { markWalkthroughSeen(); setTourOpen(false); }
              }}
            >
              {tourStep < tourSteps.length - 1 ? 'Next' : 'Done'}
            </Button>
          </Stack>
        </Box>
      </Popover>



    </Container>
  </>

  );
  function isRuleMatched(rule: MappingRule): boolean {
    switch (rule.kind) {
      case 'direct':
        return Boolean((rule as any).source);
      case 'split_name':
        return Boolean((rule as any).source);
      case 'concat':
        return Array.isArray((rule as any).sources) && (rule as any).sources.length > 0;
      default:
        return false;
    }
  }

}

function findDefaultNameColumn(headers: string[]): string | undefined {
  return headers.find((h) => h.toLowerCase() === 'name' || h.toLowerCase().includes('name'));
}

function guessPart(target: string): 'first' | 'last' {
  const t = target.toLowerCase();
  if (t.includes('first')) return 'first';
  if (t.includes('last')) return 'last';
  return 'first';
}

export default App;
