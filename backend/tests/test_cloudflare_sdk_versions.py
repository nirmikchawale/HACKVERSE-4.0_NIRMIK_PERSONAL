"""Cloudflare SDK is mandatory with current Python Workers runtime.

No disable_python_external_sdk workaround is accepted; Cloudflare packages must
be assembled by pywrangler, never raw npx wrangler preview/deploy.
"""
import tomllib
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]

def test_cloudflare_python_sdk_configuration():
    conf=tomllib.loads((ROOT/"pyproject.toml").read_text())
    dev=conf["dependency-groups"]["dev"]
    assert any(item.startswith("workers-py>=1.17.9") for item in dev)
    assert any(item.startswith("workers-runtime-sdk>=1.9.5") for item in dev)
    wrangler=(ROOT/"wrangler.jsonc").read_text()
    assert '"python_workers"' in wrangler
    assert "disable_python_external_sdk" not in wrangler
    workflow=(ROOT/".github/workflows/mig-cloudflare-local.yml").read_text()
    assert "pywrangler deploy --dry-run" in workflow
    assert "npx wrangler preview" not in workflow
