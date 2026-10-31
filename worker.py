"""Cloudflare Python Worker entrypoint; no socket-based Uvicorn is used."""
from workers import asgi
from backend.unlockplan.edge import app

Default = asgi.entrypoint(app)
