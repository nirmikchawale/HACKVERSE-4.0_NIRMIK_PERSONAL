"""Generate a source-labeled, deterministic 100-case snapshot using real Python engine.

This is a BUILD artifact. Inputs are configured examples, not observed farm or
government data. Never generate or substitute NASA/forecast measurements.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from unlockplan.scenarios import get_scenarios  # noqa: E402


def main() -> None:
    evaluated = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    payload = get_scenarios(evaluated)
    if payload["count"] != 100 or len(payload["records"]) != 100:
        raise RuntimeError("The engine did not calculate exactly 100 examples.")
    if len({record["id"] for record in payload["records"]}) != 100:
        raise RuntimeError("Duplicate example IDs in generated catalog.")
    if any(record["input_kind"] != "configured_example_not_farm_observation"
           for record in payload["records"]):
        raise RuntimeError("Unknown or mislabeled example source.")
    if not {"feasible", "blocked", "unknown"} <= {
        record["result"]["status"] for record in payload["records"]
    }:
        raise RuntimeError("Required uncertainty and blocker coverage missing.")
    source_sha = None
    try:
        source_sha = subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True,
            stderr=subprocess.DEVNULL, timeout=5
        ).strip()
    except (OSError, subprocess.SubprocessError):
        pass
    if source_sha and (len(source_sha) != 40 or not all(x in "0123456789abcdef" for x in source_sha)):
        raise RuntimeError("Invalid source commit reference.")
    payload["catalog_source"] = "prebuilt_python_engine_snapshot"
    payload["snapshot_generated_at_utc"] = evaluated.isoformat()
    payload["snapshot_source_sha"] = source_sha
    payload["snapshot_notice"] = (
        "Build-time Python engine calculations for configured educational examples. "
        "These are NOT live farm assessments, genuine farm observations or government "
        "weather values; no farmer input is saved or evaluated in this snapshot."
    )
    path = ROOT / "frontend" / "public" / "feasibility-examples-snapshot.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":"), allow_nan=False) + "\n", encoding="utf-8")
    print("Built 100 verified Python-engine example scenarios as public static fallback; no weather data simulated.")


if __name__ == "__main__":
    main()
