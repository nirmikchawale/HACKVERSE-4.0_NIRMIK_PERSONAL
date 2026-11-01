"""The root Cloudflare pyproject must package only the intended Python app."""
from pathlib import Path
import tomllib

ROOT = Path(__file__).resolve().parents[2]


def test_cloudflare_project_has_bounded_python_package_discovery():
    conf = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))
    settings = conf["tool"]["setuptools"]["packages"]["find"]
    assert settings["where"] == ["."]
    assert settings["include"] == ["backend", "backend.unlockplan", "backend.unlockplan.*"]
    assert settings["exclude"] == ["backend.tests", "backend.tests.*"]
    assert settings["namespaces"] is True
    assert conf["build-system"]["build-backend"] == "setuptools.build_meta"
    assert not any("frontend" in x or "contrib" in x for x in settings["include"])
