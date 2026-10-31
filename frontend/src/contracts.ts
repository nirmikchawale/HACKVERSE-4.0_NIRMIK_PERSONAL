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


export interface HealthResponse {
  ok: boolean;
  version: string;
  forecast_validated_cache_present: boolean;
  disclaimer: string;
}
export interface ReferenceSource {
  id: string;
  title: string;
  url: string;
  short_supported_statement: string;
  limitations: string;
}
export interface SourcesResponse {
  sources: ReferenceSource[];
  operational_rules: unknown[];
  input_categories: string[];
}
export interface ComparisonChanges {
  changed_fields: string[];
  status_before: DecisionStatus;
  status_after: DecisionStatus;
  time_slack_delta_hours: number | null;
  new_blockers: string[];
  resolved_blockers: string[];
  new_unknowns: string[];
  resolved_unknowns: string[];
  packages_before: string[][];
  packages_after: string[][];
}
export interface ComparisonResponse {
  before: EvaluationResponse;
  after: EvaluationResponse;
  changes: ComparisonChanges;
  interpretation: string;
}
export interface ForecastSelection {
  source: string;
  selected_hour_local: string;
  candidate_deadline: string;
  retrieved_at_utc: string;
  forecast_age_hours: number;
  forecast_status: 'retrieved_live' | 'cached_recent';
  precipitation_mm: number | null;
  precipitation_probability_pct: number | null;
  request_url: string;
  attribution: string;
  limitation: string;
}
export interface ReplanResponse extends ComparisonResponse {
  forecast_selection: ForecastSelection;
}
export interface CompareRequest {
  before: EvaluateRequest;
  after: EvaluateRequest;
}
export interface ReplanRequest extends CompareRequest {
  selected_hour_local: string;
}
export function parseHealth(payload: unknown): HealthResponse {
  if (!record(payload) || payload.ok !== true || typeof payload.version !== 'string' ||
      typeof payload.forecast_validated_cache_present !== 'boolean' ||
      typeof payload.disclaimer !== 'string') {
    throw new Error('Health API returned an invalid response.');
  }
  return payload as unknown as HealthResponse;
}
export function parseSources(payload: unknown): SourcesResponse {
  if (!record(payload) || !Array.isArray(payload.sources) ||
      !payload.sources.every((s: unknown) => record(s) &&
        typeof s.id === 'string' && typeof s.title === 'string' &&
        typeof s.url === 'string' && typeof s.short_supported_statement === 'string' &&
        typeof s.limitations === 'string') ||
      !Array.isArray(payload.operational_rules) || !Array.isArray(payload.input_categories)) {
    throw new Error('Source registry API returned an invalid response.');
  }
  return payload as unknown as SourcesResponse;
}
export function parseComparison(payload: unknown): ComparisonResponse {
  if (!record(payload) || !record(payload.changes) ||
      !Array.isArray(payload.changes.changed_fields) ||
      !payload.changes.changed_fields.every((s: unknown) => typeof s === 'string') ||
      !oneOf(payload.changes.status_before, ['feasible','blocked','unknown','completed']) ||
      !oneOf(payload.changes.status_after, ['feasible','blocked','unknown','completed']) ||
      !finiteOrNull(payload.changes.time_slack_delta_hours) ||
      typeof payload.interpretation !== 'string') {
    throw new Error('Comparison API returned an invalid response.');
  }
  parseEvaluation(payload.before);
  parseEvaluation(payload.after);
  return payload as unknown as ComparisonResponse;
}
export function parseReplan(payload: unknown): ReplanResponse {
  const comparison = parseComparison(payload);
  if (!record(payload) || !record(payload.forecast_selection) ||
      typeof payload.forecast_selection.selected_hour_local !== 'string' ||
      typeof payload.forecast_selection.candidate_deadline !== 'string' ||
      !oneOf(payload.forecast_selection.forecast_status, ['retrieved_live','cached_recent']) ||
      !Number.isFinite(Date.parse(String(payload.forecast_selection.retrieved_at_utc))) ||
      typeof payload.forecast_selection.attribution !== 'string' ||
      typeof payload.forecast_selection.limitation !== 'string' ||
      !finiteOrNull(payload.forecast_selection.precipitation_mm) ||
      !finiteOrNull(payload.forecast_selection.precipitation_probability_pct)) {
    throw new Error('Replan API did not return verified forecast selection metadata.');
  }
  return comparison as ReplanResponse;
}
export async function checkHealth(): Promise<HealthResponse> {
  return parseHealth(await jsonRequest('/api/health'));
}
export async function loadSources(): Promise<SourcesResponse> {
  return parseSources(await jsonRequest('/api/sources'));
}
export async function compareCases(payload: CompareRequest): Promise<ComparisonResponse> {
  return parseComparison(await jsonRequest('/api/compare', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }));
}
export async function replanCase(payload: ReplanRequest): Promise<ReplanResponse> {
  return parseReplan(await jsonRequest('/api/replan', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }));
}
