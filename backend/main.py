"""ASGI entrypoint for UnlockPlan on Vercel; implementation remains in unlockplan.api."""
from unlockplan.api import app

__all__ = ["app"]
