import { HANDLING_UNIT } from './contracts';
import type { Availability, Confirmation, ChangeType, EvaluateRequest, PermittedChange, Readiness } from './contracts';

export interface ChangeDraft {
  id: string;
  enabled: boolean;
  type: ChangeType;
  amount: string;
  resourceId: string;
  availability: Availability;
  confirmation: Confirmation;
}
export interface PlanDraft {
  target: string;
  capacity: string;
  hours: string;
  deadlineLocal: string;
  readiness: Readiness;
  completed: boolean;
  acknowledged: boolean;
  baselineIds: string;
  changes: ChangeDraft[];
}

export function finiteNumber(text: string, label: string, positive = false): number {
  if (text.trim() === '') throw new Error(label + ' is required.');
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0 || (positive && n === 0)) {
    throw new Error(label + ' must be a finite ' + (positive ? 'positive' : 'nonnegative') + ' number.');
  }
  return n;
}
export function localDeadlineISO(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    throw new Error('Select a candidate deadline in Jalna local time (IST).');
  }
  const iso = value + ':00+05:30';
  if (!Number.isFinite(Date.parse(iso))) {
    throw new Error('Candidate deadline is not a valid timestamp.');
  }
  return iso;
}
export function createRequest(draft: PlanDraft, nowUTC: string): EvaluateRequest {
  if (!draft.acknowledged) {
    throw new Error('Confirm the quantities are user-reported and comparable before evaluating.');
  }
  if (!Number.isFinite(Date.parse(nowUTC)) || !nowUTC.endsWith('Z')) {
    throw new Error('The browser clock did not supply a valid UTC evaluation timestamp.');
  }
  const baseline_resource_ids = draft.baselineIds.split(',').map(x => x.trim()).filter(Boolean);
  if (new Set(baseline_resource_ids).size !== baseline_resource_ids.length) {
    throw new Error('Baseline resource identifiers must be distinct.');
  }
  const changes: PermittedChange[] = draft.changes.filter(x => x.enabled).map(change => {
    const resourceId = change.type === 'add_capacity' ? change.resourceId.trim() : null;
    if (change.type === 'add_capacity' && !resourceId) {
      throw new Error('Enter the distinct resource identifier for option ' + change.id + '.');
    }
    return {
      id: change.id,
      type: change.type,
      value: finiteNumber(change.amount, 'Option ' + change.id + ' amount', true),
      unit: HANDLING_UNIT,
      availability: change.availability,
      confirmation_state: change.confirmation,
      resource_id: resourceId,
      cost: null,
    };
  });
  const resourceIds = changes.map(c => c.resource_id).filter((s): s is string => s !== null);
  if (new Set(resourceIds).size !== resourceIds.length ||
      resourceIds.some(id => baseline_resource_ids.includes(id))) {
    throw new Error('Each additional capacity resource must be distinct from other options and the baseline.');
  }
  return {
    target_units: finiteNumber(draft.target, 'Planned amount'),
    capacity_units: finiteNumber(draft.capacity, 'Confirmed capacity'),
    required_hours: finiteNumber(draft.hours, 'Estimated preparation time'),
    deadline: localDeadlineISO(draft.deadlineLocal),
    now: nowUTC,
    unit: HANDLING_UNIT,
    readiness: draft.readiness,
    completed: draft.completed,
    baseline_resource_ids,
    changes,
  };
}
