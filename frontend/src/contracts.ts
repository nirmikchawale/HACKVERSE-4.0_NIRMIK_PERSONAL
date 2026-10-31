export type ForecastStatus = 'retrieved_live' | 'cached_recent' | 'stale_cache' | 'unavailable';
export type DecisionStatus = 'feasible' | 'blocked' | 'unknown' | 'completed';
export type ConstraintStatus = 'pass' | 'blocked' | 'unknown';
export type Availability = 'available' | 'unavailable' | 'unknown';
export type Confirmation = 'confirmed' | 'requested' | 'unknown';
export type Readiness = 'yes' | 'no' | 'unknown';
export type ChangeType = 'add_capacity' | 'reduce_target';
export const HANDLING_UNIT = 'handling_unit' as const;

export interface ForecastHour {
  time: string;
  precipitation_mm: number | null;
  precipitation_probability_pct: number | null;
}
export interface ForecastResponse {
  status: ForecastStatus;
  hours: ForecastHour[];
  retrieved_at_utc?: string;
  forecast_age_hours?: number;
  request_url?: string;
  attribution?: string;
  error?: string | null;
  notice?: string;
  location_label?: string;
  validated?: {
    timezone: string;
    units: { time: string; precipitation: string; precipitation_probability: string };
    model_grid_latitude?: number;
    model_grid_longitude?: number;
  };
}
export interface PermittedChange {
  id: string;
  type: ChangeType;
  value: number;
  unit: typeof HANDLING_UNIT;
  availability: Availability;
  confirmation_state: Confirmation;
  resource_id: string | null;
  cost: null;
}
export interface EvaluateRequest {
  target_units: number;
  capacity_units: number;
  required_hours: number;
  unit: typeof HANDLING_UNIT;
  readiness: Readiness;
  now: string;
  deadline: string;
  completed: boolean;
  baseline_resource_ids: string[];
  changes: PermittedChange[];
}
export interface Constraint {
  id: string;
  status: ConstraintStatus;
  explanation: string;
  provenance: string;
}
export interface Assessment {
  status: Exclude<DecisionStatus, 'completed'>;
  constraints: Constraint[];
  known_blockers: string[];
  time_budget: {
    candidate_deadline: string | null;
    evaluated_at: string;
    available_hours: number | null;
    required_hours: number;
    time_slack_hours: number | null;
    basis: string;
  };
  projected_capacity_units: number;
  projected_target_units: number;
  original_target_unhandled_units: number;
  shortfall_units: number;
}
export interface ChangePackage {
  change_ids: string[];
  projected: Assessment;
  warning: string;
  objective_changed: boolean;
}
export interface EvaluationResponse {
  status: DecisionStatus;
  baseline: Assessment;
  packages: ChangePackage[];
  excluded_changes: {
    id: string;
    reason: string;
    availability: Availability;
    confirmation_state: Confirmation;
  }[];
  message: string;
  meaning: string;
  unit: typeof HANDLING_UNIT;
}

type RecordData = Record<string, unknown>;
const record = (value: unknown): value is RecordData =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const finiteOrNull = (v: unknown): v is number | null =>
  v === null || (typeof v === 'number' && Number.isFinite(v));
const oneOf = <T extends string>(v: unknown, choices: readonly T[]): v is T =>
  typeof v === 'string' && choices.includes(v as T);

export function parseForecast(payload: unknown): ForecastResponse {
  if (!record(payload) || !oneOf(payload.status, ['retrieved_live', 'cached_recent', 'stale_cache', 'unavailable']) ||
      !Array.isArray(payload.hours)) throw new Error('Forecast API returned an invalid response.');
  const current = payload.status === 'retrieved_live' || payload.status === 'cached_recent';
  if (current) {
    const validated = payload.validated;
    if (!record(validated) || validated.timezone !== 'Asia/Kolkata' || !record(validated.units) ||
        validated.units.precipitation !== 'mm' ||
        validated.units.precipitation_probability !== '%' ||
        typeof payload.retrieved_at_utc !== 'string' ||
        !Number.isFinite(Date.parse(payload.retrieved_at_utc))) {
      throw new Error('Forecast source metadata or units could not be validated.');
    }
  }
  if (!payload.hours.every((h: unknown) =>
      record(h) && typeof h.time === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(h.time) &&
      finiteOrNull(h.precipitation_mm) && finiteOrNull(h.precipitation_probability_pct) &&
      (h.precipitation_mm === null || h.precipitation_mm >= 0) &&
      (h.precipitation_probability_pct === null ||
       (h.precipitation_probability_pct >= 0 && h.precipitation_probability_pct <= 100)))) {
    throw new Error('Forecast hourly measurements are malformed.');
  }
  return payload as unknown as ForecastResponse;
}

function validAssessment(value: unknown): value is Assessment {
  if (!record(value) || !oneOf(value.status, ['feasible', 'blocked', 'unknown']) ||
      !Array.isArray(value.constraints) || !record(value.time_budget)) return false;
  if (!value.constraints.every((c: unknown) => record(c) && typeof c.id === 'string' &&
      oneOf(c.status, ['pass', 'blocked', 'unknown']) &&
      typeof c.explanation === 'string' && typeof c.provenance === 'string')) return false;
  if (!Array.isArray(value.known_blockers) ||
      !value.known_blockers.every((s: unknown) => typeof s === 'string')) return false;
  if (!['projected_capacity_units', 'projected_target_units', 'original_target_unhandled_units', 'shortfall_units']
        .every(k => typeof value[k] === 'number' && Number.isFinite(value[k]))) return false;
  const t = value.time_budget;
  return finiteOrNull(t.available_hours) && finiteOrNull(t.time_slack_hours) &&
    typeof t.required_hours === 'number' && Number.isFinite(t.required_hours) &&
    typeof t.evaluated_at === 'string' && typeof t.basis === 'string';
}

export function parseEvaluation(payload: unknown): EvaluationResponse {
  if (!record(payload) || !oneOf(payload.status, ['feasible', 'blocked', 'unknown', 'completed']) ||
      !validAssessment(payload.baseline) || !Array.isArray(payload.packages) ||
      !Array.isArray(payload.excluded_changes) || typeof payload.message !== 'string' ||
      payload.unit !== HANDLING_UNIT) {
    throw new Error('Evaluation API returned an invalid response.');
  }
  if (!payload.packages.every((p: unknown) => record(p) && Array.isArray(p.change_ids) &&
      p.change_ids.every((id: unknown) => typeof id === 'string') &&
      validAssessment(p.projected) && typeof p.warning === 'string' &&
      typeof p.objective_changed === 'boolean')) {
    throw new Error('Evaluation API returned malformed change packages.');
  }
  return payload as unknown as EvaluationResponse;
}

async function jsonRequest(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      cache: 'no-store',
      headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error('The Python API is not reachable. No feasibility result has been calculated.');
  }
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('The Python API is not configured on this preview. Live integration is pending in B-03.');
  }
  const data: unknown = await response.json();
  if (!response.ok) {
    const detail = record(data) && typeof data.detail === 'string' ? data.detail : 'API returned HTTP ' + response.status;
    throw new Error(detail);
  }
  return data;
}
export async function loadForecast(refresh = false): Promise<ForecastResponse> {
  return parseForecast(await jsonRequest('/api/forecast' + (refresh ? '?refresh=true' : '')));
}
export async function evaluateCase(request: EvaluateRequest): Promise<EvaluationResponse> {
  return parseEvaluation(await jsonRequest('/api/evaluate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  }));
}

/** A-05 authoritative contract adoption. Network data is untrusted until parsed. */
export interface HealthResponse {
  ok: true; version: string; forecast_validated_cache_present: boolean; disclaimer: string;
}
export interface SourceItem { id: string; title: string; url: string; limitations: string; }
export interface SourcesResponse {
  sources: SourceItem[]; operational_rules: unknown[]; input_categories: string[];
}
export interface ComparisonChanges {
  changed_fields: string[];
  status_before: DecisionStatus; status_after: DecisionStatus;
  time_slack_delta_hours: number | null;
  new_blockers: string[]; resolved_blockers: string[];
  new_unknowns: string[]; resolved_unknowns: string[];
  packages_before: string[][]; packages_after: string[][];
}
export interface ForecastSelection {
  source: string;
  selected_hour_local: string;
  candidate_deadline: string;
  retrieved_at_utc: string;
  forecast_status: 'retrieved_live' | 'cached_recent';
  request_url: string;
  attribution: string;
  limitation: string;
}
export interface ComparisonResponse {
  before: EvaluationResponse; after: EvaluationResponse;
  changes: ComparisonChanges;
  interpretation: string;
  forecast_selection?: ForecastSelection;
}
export async function loadHealth(): Promise<HealthResponse> {
  const result = await jsonRequest('/api/health');
  if (!record(result) || result.ok !== true || typeof result.version !== 'string' ||
      typeof result.disclaimer !== 'string' ||
      typeof result.forecast_validated_cache_present !== 'boolean') {
    throw new Error('Health API returned an invalid response.');
  }
  return result as unknown as HealthResponse;
}
export async function loadSources(): Promise<SourcesResponse> {
  const result = await jsonRequest('/api/sources');
  if (!record(result) || !Array.isArray(result.sources) ||
      !result.sources.every((source: unknown) =>
        record(source) && typeof source.id === 'string' &&
        typeof source.title === 'string' && typeof source.url === 'string' &&
        typeof source.limitations === 'string') ||
      !Array.isArray(result.operational_rules) ||
      !Array.isArray(result.input_categories)) {
    throw new Error('Evidence registry API returned an invalid response.');
  }
  return result as unknown as SourcesResponse;
}
export function parseComparison(result: unknown): ComparisonResponse {
  if (!record(result) || !record(result.changes) ||
      !Array.isArray(result.changes.changed_fields) ||
      !Array.isArray(result.changes.new_blockers) ||
      !Array.isArray(result.changes.resolved_blockers) ||
      !finiteOrNull(result.changes.time_slack_delta_hours) ||
      !oneOf(result.changes.status_before, ['feasible','blocked','unknown','completed']) ||
      !oneOf(result.changes.status_after, ['feasible','blocked','unknown','completed']) ||
      typeof result.interpretation !== 'string') {
    throw new Error('Comparison API returned an invalid response.');
  }
  parseEvaluation(result.before);
  parseEvaluation(result.after);
  if (result.forecast_selection !== undefined) {
    const selection=result.forecast_selection;
    if (!record(selection) || typeof selection.selected_hour_local !== 'string' ||
        typeof selection.candidate_deadline !== 'string' ||
        typeof selection.request_url !== 'string' ||
        typeof selection.retrieved_at_utc !== 'string' ||
        typeof selection.limitation !== 'string') {
      throw new Error('Forecast selection evidence is malformed.');
    }
  }
  return result as unknown as ComparisonResponse;
}
export async function compareCases(before: EvaluateRequest, after: EvaluateRequest): Promise<ComparisonResponse> {
  return parseComparison(await jsonRequest('/api/compare', {
    method:'POST', headers: {'Content-Type':'application/json'}, body:JSON.stringify({before,after}),
  }));
}
export async function replanCase(before: EvaluateRequest, after: EvaluateRequest, selectedHour: string): Promise<ComparisonResponse> {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(selectedHour)) {
    throw new Error('A current source-native forecast hour is required.');
  }
  return parseComparison(await jsonRequest('/api/replan', {
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({before,after,selected_hour_local:selectedHour}),
  }));
}
