#!/usr/bin/env python3
"""
Root Flask Entry Point for AI Studio Container / Flask CLI
Imports and launches the Flask API application from backend/flask_app.py
"""

from backend.flask_app import app, run_flask, HAS_FLASK

if __name__ == '__main__':
    run_flask()
