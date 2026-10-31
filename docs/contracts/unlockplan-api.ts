/**
 * UnlockPlan P0 / A-05 TypeScript API contract (verified against FastAPI tests).
 * Do not confuse external Open-Meteo *model forecasts* with farm observations.
 * Type declarations provide editor support but do NOT validate untrusted JSON at runtime.
 * Source of truth for request errors: backend FastAPI and test_contract_a05.py.
 * Keep this module outside frontend/ until Workstream B adopts its types.
 */

/** ISO 8601 including an explicit UTC or local offset (e.g. +05:30). */
export type OffsetTimestamp = string;
/** Exact model source-native Asia/Kolkata hourly value; no UTC offset. */
export type ForecastHourLocal = string;
export type HandlingUnit = 'handling_unit'; // Artificial demonstration unit, not kg/hectares.
export type Readiness = 'yes' | 'no' | 'unknown';
export type Availability = 'available' | 'unavailable' | 'unknown';
export type Confirmation = 'confirmed' | 'requested' | 'unknown';
export type ChangeKind = 'add_capacity' | 'reduce_target';
export type Outcome = 'feasible' | 'blocked' | 'unknown' | 'completed';
export type ConstraintState = 'pass' | 'blocked' | 'unknown';
export type ConstraintID = 'readiness' | 'capacity' | 'timing';

export interface PermittedChange {
  id: string;
  type: ChangeKind;
  value: number; // finite and positive
  unit: HandlingUnit;
  availability: Availability;
  confirmation_state: Confirmation;
  resource_id?: string | null;
  cost?: number | null; // optional; the engine never minimizes cost
}

export interface PlanningCase {
  target_units: number; // finite and nonnegative
  capacity_units: number; // finite and nonnegative
  required_hours: number; // finite and nonnegative
  unit?: HandlingUnit;
  readiness: Readiness;
  now: OffsetTimestamp; // never omit; do not fake an evaluation time
  deadline?: OffsetTimestamp | null; // null means timing is unknown
  completed?: boolean;
  baseline_resource_ids?: string[];
  changes?: PermittedChange[];
}

export interface ConstraintResult {
  id: ConstraintID;
  status: ConstraintState;
  explanation: string;
  provenance: string;
}

export interface TimeBudget {
  candidate_deadline: OffsetTimestamp | null;
  evaluated_at: OffsetTimestamp;
  available_hours: number | null;
  required_hours: number;
  time_slack_hours: number | null;
  basis: string;
}

export interface CheckedPlan {
  status: Exclude<Outcome, 'completed'>;
  constraints: ConstraintResult[];
  known_blockers: ConstraintID[];
  time_budget: TimeBudget;
  projected_capacity_units: number;
  projected_target_units: number;
  original_target_unhandled_units: number;
  shortfall_units: number;
}

export interface ConditionalPackage {
  change_ids: string[];
  projected: CheckedPlan;
  warning: string;
  objective_changed: boolean; // reduction of target requires explaining unhandled units
}

export interface ExcludedChange {
  id: string;
  reason: string;
  availability: Availability;
  confirmation_state: Confirmation;
}

export interface EvaluationResponse {
  status: Outcome;
  baseline: CheckedPlan;
  packages: ConditionalPackage[];
  excluded_changes: ExcludedChange[];
  message: string;
  meaning: string;
  unit: HandlingUnit;
  method?: string; // absent when action is already declared completed
}

export interface ComparisonRequest {
  before: PlanningCase;
  after: PlanningCase;
}

export type TrackedField =
  | 'now' | 'deadline' | 'target_units' | 'capacity_units' | 'required_hours'
  | 'readiness' | 'completed' | 'baseline_resource_ids' | 'changes';

export interface ComparisonChanges {
  changed_fields: TrackedField[];
  status_before: Outcome;
  status_after: Outcome;
  time_slack_delta_hours: number | null;
  new_blockers: ConstraintID[];
  resolved_blockers: ConstraintID[];
  new_unknowns: ConstraintID[];
  resolved_unknowns: ConstraintID[];
  packages_before: string[][];
  packages_after: string[][];
}

export interface ComparisonResponse {
  before: EvaluationResponse;
  after: EvaluationResponse;
  changes: ComparisonChanges;
  interpretation: string;
}

export interface ReplanRequest extends ComparisonRequest {
  selected_hour_local: ForecastHourLocal;
}

export interface ForecastSelection {
  source: string;
  selected_hour_local: ForecastHourLocal;
  candidate_deadline: OffsetTimestamp;
  retrieved_at_utc: OffsetTimestamp;
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

export interface ForecastHour {
  time: ForecastHourLocal;
  precipitation_mm: number | null;
  precipitation_probability_pct: number | null;
}

export interface ForecastValidated {
  hours: number;
  missing_precipitation: number;
  missing_probability: number;
  first_hour: ForecastHourLocal;
  last_hour: ForecastHourLocal;
  timezone: 'Asia/Kolkata';
  units: { time: 'iso8601'; precipitation: 'mm'; precipitation_probability: '%' };
  model_grid_latitude: number;
  model_grid_longitude: number;
  positive_precipitation_hours: number;
}

export interface AvailableForecast {
  status: 'retrieved_live' | 'cached_recent' | 'stale_cache';
  error: string | null;
  source: string;
  latitude_reference: number;
  longitude_reference: number;
  location_label: string;
  retrieved_at_utc: OffsetTimestamp;
  forecast_age_hours: number;
  request_url: string;
  attribution: string;
  validated: ForecastValidated;
  hours: ForecastHour[];
  notice: string;
}

export interface UnavailableForecast {
  status: 'unavailable';
  error: string;
  source: string;
  request_url: string;
  attribution: string;
  location_label: string;
  hours: []; // no synthetic fallback, cannot be interpreted as zero rain
  notice: string;
}

export type ForecastResponse = AvailableForecast | UnavailableForecast;

export interface HealthResponse {
  ok: boolean;
  version: string;
  forecast_validated_cache_present: boolean; // NOT evidence of freshness
  disclaimer: string;
}

export interface ReferenceSource {
  id: string;
  title: string;
  url: string;
  publication_date: string | null;
  access_date: string;
  page_section: string;
  short_supported_statement: string;
  geographic_applicability: string;
  verification_state: string;
  reuse_status: string;
  limitations: string;
}

export interface OperationalRule {
  [key: string]: unknown; // See GET /api/sources; human-readable provenance rules, not validated thresholds.
}

export interface SourcesResponse {
  sources: ReferenceSource[];
  operational_rules: OperationalRule[];
  input_categories: string[];
}

export interface ErrorResponse {
  /** FastAPI/Pydantic may return a string or an array of structured errors. */
  detail: string | Array<{ type: string; loc: Array<string | number>; msg: string; input?: unknown }>;
}

export interface ApiRoutes {
  'GET /api/health': { response: HealthResponse };
  'GET /api/sources': { response: SourcesResponse };
  'GET /api/forecast': { response: ForecastResponse; query?: { refresh?: boolean } };
  'POST /api/evaluate': { request: PlanningCase; response: EvaluationResponse };
  'POST /api/compare': { request: ComparisonRequest; response: ComparisonResponse };
  'POST /api/replan': { request: ReplanRequest; response: ReplanResponse };
}

/** Status alone is insufficient: stale weather is displayable but not replan-eligible. */
export function forecastMayBeSelected(forecast: ForecastResponse): forecast is AvailableForecast & {
  status: 'retrieved_live' | 'cached_recent';
} {
  return forecast.status === 'retrieved_live' || forecast.status === 'cached_recent';
}
