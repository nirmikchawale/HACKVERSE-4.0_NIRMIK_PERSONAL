"""One hundred bounded, transparent teaching scenarios for the Jalna preparation planner.

These are configured examples, NOT observed Jalna farm records, government
measurements, or user declarations. Every decision is computed by the same
deterministic engine used by POST /api/evaluate.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from .engine import evaluate

# (label, target, baseline capacity, task hours, available hours,
#  readiness, optional capacity, option confirmation)
# The handling_unit is abstract: do not infer kilograms, hectares or crop yields.
EXAMPLES = (
    ("Cover preparation · added crew", 80, 60, 2.5, 6, "yes", 25, "confirmed"),
    ("Sheltered handling · enough capacity", 70, 75, 3, 8, "yes", 0, "none"),
    ("Tight deadline · extra transport", 125, 95, 4, 3, "yes", 40, "confirmed"),
    ("Shelter readiness unconfirmed", 45, 45, 1.5, 5, "unknown", 0, "none"),
    ("Requested equipment not secured", 100, 65, 2, 9, "yes", 35, "requested"),
    ("Large batch · confirmed help", 150, 110, 6, 10, "yes", 40, "confirmed"),
    ("Balanced work and deadline", 90, 90, 4, 4, "yes", 0, "none"),
    ("Storage not ready · limited time", 80, 55, 3, 2, "no", 30, "confirmed"),
    ("Available capacity exceeds work", 120, 128, 3, 7, "yes", 0, "none"),
    ("Small shortfall · confirmed helper", 60, 48, 2, 5, "yes", 12, "confirmed"),
    ("Adequate crew · insufficient hours", 100, 110, 4, 2, "yes", 0, "none"),
    ("Multi-load staging option", 130, 90, 4, 8, "yes", 45, "confirmed"),
    ("Capacity plus unknown shelter", 45, 35, 1.5, 5, "unknown", 10, "confirmed"),
    ("Extra crew requested only", 120, 108, 2.5, 6, "yes", 12, "requested"),
    ("Early staging · sufficient crew", 160, 160, 7, 10, "yes", 0, "none"),
    ("Short window despite spare crew", 90, 95, 2, 1.5, "yes", 0, "none"),
    ("Handling location not prepared", 80, 80, 3, 5, "no", 0, "none"),
    ("Reinforced handling option", 95, 60, 2, 7, "yes", 40, "confirmed"),
    ("Small crew addition confirmed", 75, 66, 3, 9, "yes", 10, "confirmed"),
    ("All baseline checks satisfied", 115, 120, 5, 5.5, "yes", 0, "none"),
)


# Five evidence-separated, deterministic planning experiments per seed. They are
# NOT 100 unique observed farms, nor agriculture-specific calibrated estimates.
VARIANTS = (
    ("baseline", "Declared baseline example"),
    ("compressed_window", "Shortened preparation window"),
    ("capacity_resilience", "Additional baseline handling capacity"),
    ("readiness_review", "Handling-location readiness reassessed"),
    ("support_confirmation", "Additional support confirmation sensitivity"),
)
CATALOG_SIZE = len(EXAMPLES) * len(VARIANTS)


def get_scenarios(now: datetime | None = None) -> dict:
    instant = now or datetime.now(timezone.utc)
    if instant.tzinfo is None or instant.utcoffset() is None:
        raise ValueError("A timezone-aware evaluation time is required.")
    instant = instant.astimezone(timezone.utc).replace(second=0, microsecond=0)
    rows = []
    for source_index, seed in enumerate(EXAMPLES, 1):
        name, target, seed_capacity, duration, seed_lead, seed_readiness, seed_extra, seed_confirmation = seed
        for variation_index, (variant_key, variant_description) in enumerate(VARIANTS):
            case_index = (source_index - 1) * len(VARIANTS) + variation_index + 1
            capacity, lead, readiness, extra, confirmation = (
                seed_capacity, seed_lead, seed_readiness, seed_extra, seed_confirmation
            )
            if variant_key == "compressed_window":
                # Stress-test timeline assumptions: time pressure is a what-if,
                # not a forecast of rain onset at an actual farm.
                lead = max(0.5, min(seed_lead, round(duration * 0.55, 2)))
            elif variant_key == "capacity_resilience":
                # Abstract capacity increase, not a verified equipment rate.
                capacity += max(1, round(target * 0.25))
            elif variant_key == "readiness_review":
                readiness = "unknown" if seed_readiness == "yes" else "yes"
            elif variant_key == "support_confirmation":
                if extra == 0:
                    extra = max(5, round(target * 0.2))
                    confirmation = "requested"
                else:
                    confirmation = "requested" if seed_confirmation == "confirmed" else "confirmed"

            changes = []
            if extra:
                changes.append({
                    "id": f"example-{case_index:03d}-option",
                    "type": "add_capacity",
                    "value": extra,
                    "unit": "handling_unit",
                    "availability": "available" if confirmation == "confirmed" else "unknown",
                    "confirmation_state": confirmation,
                    "resource_id": f"example-{case_index:03d}-additional",
                    "cost": None,
                })
            case = {
                "target_units": target,
                "capacity_units": capacity,
                "required_hours": duration,
                "now": instant.isoformat(),
                "deadline": (instant + timedelta(hours=lead)).isoformat(),
                "readiness": readiness,
                "completed": False,
                "unit": "handling_unit",
                "baseline_resource_ids": [f"example-{case_index:03d}-baseline"],
                "changes": changes,
            }
            result = evaluate(case)
            rows.append({
                "id": f"JAL-EX-{case_index:03d}",
                "source_seed": f"JAL-SEED-{source_index:02d}",
                "variant": variant_key,
                "variant_description": variant_description,
                "label": name + " · " + variant_description,
                "input_kind": "configured_example_not_farm_observation",
                "assumptions": {
                    "target_units": target,
                    "capacity_units": capacity,
                    "required_hours": duration,
                    "hours_until_candidate_deadline": lead,
                    "readiness": readiness,
                    "additional_capacity_units": extra,
                    "additional_capacity_confirmation": confirmation,
                },
                "result": result,
            })
    assert len(rows) == CATALOG_SIZE == 100
    return {
        "status": "calculated",
        "location_scope": "Jalna, Maharashtra · already-picked cotton preparedness",
        "data_kind": "illustrative_planning_cases",
        "engine": "FastAPI deterministic resource-feasibility evaluator",
        "evaluated_at_utc": instant.isoformat(),
        "count": len(rows),
        "unit": "handling_unit",
        "scenario_design": "20 configured seed cases × 5 explicitly described sensitivity variants",
        "records": rows,
        "notice": (
            "One hundred reproducible example configurations, calculated by "
            "the real Python engine. The inputs are not government observations, "
            "actual farmer submissions, weather forecasts, field safety thresholds "
            "or crop protection claims. Replace these assumptions with "
            "farmer-confirmed inputs before operational resource decisions."
        ),
    }
