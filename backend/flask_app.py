#!/usr/bin/env python3
"""
Flask Backend API for Twi Cholera Health AI Chatbot
Provides Flask REST API endpoints for:
- Model Training (/api/flask/train)
- Real-time Intent Prediction (/api/flask/predict)
- Model Metadata & Metrics (/api/flask/model_info)
- Dataset Explorer & Ingestion (/api/flask/dataset, /api/flask/add_sample)
- Server Health Check (/api/flask/health)
"""

import sys
import os
import csv
import json
from datetime import datetime

# Ensure root directory is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.ml_model import TwiIntentModel

# Try importing Flask; if not installed, provide lightweight micro-Flask compatibility wrapper
try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    HAS_FLASK = True
except ImportError:
    HAS_FLASK = False

# Initialize Model Engine
model_engine = TwiIntentModel()
# Attempt loading pre-trained weights if available, else train on load
if not model_engine.load_model():
    print("Pre-trained model weights not found. Initializing training...")
    try:
        model_engine.train()
        model_engine.save_model()
    except Exception as err:
        print(f"Warning: Model initial training failed: {err}")


if HAS_FLASK:
    app = Flask(__name__)
    CORS(app)

    @app.route('/api/flask/health', methods=['GET'])
    def health():
        return jsonify({
            'status': 'ok',
            'framework': 'Flask 3.x',
            'model_trained': model_engine.is_trained,
            'last_trained_at': model_engine.last_trained_at,
            'vocabulary_size': len(model_engine.vocabulary),
            'timestamp': datetime.now().isoformat()
        })

    @app.route('/api/flask/train', methods=['POST'])
    def train_model():
        try:
            metrics = model_engine.train()
            model_engine.save_model()
            return jsonify({
                'success': True,
                'message': 'Model re-trained successfully',
                'metrics': metrics,
                'last_trained_at': model_engine.last_trained_at
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/flask/predict', methods=['POST'])
    def predict_intent():
        data = request.get_json() or {}
        text = data.get('text', '') or data.get('message', '')
        if not text:
            return jsonify({'error': 'Parameter "text" or "message" is required'}), 400

        res = model_engine.predict(text)
        return jsonify(res)

    @app.route('/api/flask/model_info', methods=['GET'])
    def model_info():
        return jsonify({
            'is_trained': model_engine.is_trained,
            'last_trained_at': model_engine.last_trained_at,
            'metrics': model_engine.metrics,
            'classes': model_engine.classes,
            'vocabulary_size': len(model_engine.vocabulary),
            'dataset_info': model_engine.dataset_info
        })

    @app.route('/api/flask/dataset', methods=['GET'])
    def get_dataset():
        csv_path = 'data/cholera_twi.csv'
        if not os.path.exists(csv_path):
            csv_path = os.path.join(os.path.dirname(__file__), '../data/cholera_twi.csv')

        rows = []
        if os.path.exists(csv_path):
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for r in reader:
                    rows.append(r)

        intent_counts = {}
        for r in rows:
            it = r.get('intent', 'unknown')
            intent_counts[it] = intent_counts.get(it, 0) + 1

        return jsonify({
            'total_samples': len(rows),
            'intent_counts': intent_counts,
            'samples': rows
        })

    @app.route('/api/flask/add_sample', methods=['POST'])
    def add_sample():
        data = request.get_json() or {}
        twi_query = data.get('twi_query', '').strip()
        intent = data.get('intent', '').strip()
        twi_response = data.get('twi_response', '').strip()
        english_translation = data.get('english_translation', '').strip()
        source = data.get('source', 'User Contributed')

        if not twi_query or not intent:
            return jsonify({'error': 'twi_query and intent are required fields'}), 400

        csv_path = 'data/cholera_twi.csv'
        if not os.path.exists(csv_path):
            csv_path = os.path.join(os.path.dirname(__file__), '../data/cholera_twi.csv')

        try:
            file_exists = os.path.exists(csv_path)
            with open(csv_path, 'a', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=['twi_query', 'intent', 'twi_response', 'english_translation', 'source'])
                if not file_exists:
                    writer.writeheader()
                writer.writerow({
                    'twi_query': twi_query,
                    'intent': intent,
                    'twi_response': twi_response,
                    'english_translation': english_translation,
                    'source': source
                })

            # Auto re-train model after new dataset entry
            metrics = model_engine.train()
            model_engine.save_model()

            return jsonify({
                'success': True,
                'message': 'Sample added and model re-trained successfully!',
                'metrics': metrics
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    def run_flask():
        port = int(os.environ.get('FLASK_PORT', 5000))
        print(f"🚀 [Flask Backend] Serving API on http://0.0.0.0:{port}")
        app.run(host='0.0.0.0', port=port, debug=False)

else:
    # Standard library fallback WSGI runner implementing Flask API routing schema
    from wsgiref.simple_server import make_server
    from urllib.parse import parse_qs

    def wsgi_app(environ, start_response):
        path = environ.get('PATH_INFO', '')
        method = environ.get('REQUEST_METHOD', 'GET')

        headers = [
            ('Content-Type', 'application/json; charset=utf-8'),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
            ('Access-Control-Allow-Headers', 'Content-Type')
        ]

        if method == 'OPTIONS':
            start_response('200 OK', headers)
            return [b'']

        # Read JSON body for POST requests
        body = {}
        if method == 'POST':
            try:
                content_length = int(environ.get('CONTENT_LENGTH', 0) or 0)
                if content_length > 0:
                    raw_body = environ['wsgi.input'].read(content_length)
                    body = json.loads(raw_body.decode('utf-8'))
            except Exception:
                body = {}

        response_body = {}
        status = '200 OK'

        if path == '/api/flask/health':
            response_body = {
                'status': 'ok',
                'framework': 'Flask-Compatible WSGI Engine',
                'model_trained': model_engine.is_trained,
                'last_trained_at': model_engine.last_trained_at,
                'vocabulary_size': len(model_engine.vocabulary),
                'timestamp': datetime.now().isoformat()
            }
        elif path == '/api/flask/train' and method == 'POST':
            try:
                metrics = model_engine.train()
                model_engine.save_model()
                response_body = {
                    'success': True,
                    'message': 'Model re-trained successfully',
                    'metrics': metrics,
                    'last_trained_at': model_engine.last_trained_at
                }
            except Exception as e:
                status = '500 Internal Server Error'
                response_body = {'success': False, 'error': str(e)}
        elif path == '/api/flask/predict' and method == 'POST':
            text = body.get('text', '') or body.get('message', '')
            if not text:
                status = '400 Bad Request'
                response_body = {'error': 'Parameter "text" or "message" is required'}
            else:
                response_body = model_engine.predict(text)
        elif path == '/api/flask/model_info':
            response_body = {
                'is_trained': model_engine.is_trained,
                'last_trained_at': model_engine.last_trained_at,
                'metrics': model_engine.metrics,
                'classes': model_engine.classes,
                'vocabulary_size': len(model_engine.vocabulary),
                'dataset_info': model_engine.dataset_info
            }
        elif path == '/api/flask/dataset':
            csv_path = 'data/cholera_twi.csv'
            if not os.path.exists(csv_path):
                csv_path = os.path.join(os.path.dirname(__file__), '../data/cholera_twi.csv')

            rows = []
            if os.path.exists(csv_path):
                with open(csv_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for r in reader:
                        rows.append(r)

            intent_counts = {}
            for r in rows:
                it = r.get('intent', 'unknown')
                intent_counts[it] = intent_counts.get(it, 0) + 1

            response_body = {
                'total_samples': len(rows),
                'intent_counts': intent_counts,
                'samples': rows
            }
        elif path == '/api/flask/add_sample' and method == 'POST':
            twi_query = body.get('twi_query', '').strip()
            intent = body.get('intent', '').strip()
            twi_response = body.get('twi_response', '').strip()
            english_translation = body.get('english_translation', '').strip()
            source = body.get('source', 'User Contributed')

            if not twi_query or not intent:
                status = '400 Bad Request'
                response_body = {'error': 'twi_query and intent are required fields'}
            else:
                csv_path = 'data/cholera_twi.csv'
                if not os.path.exists(csv_path):
                    csv_path = os.path.join(os.path.dirname(__file__), '../data/cholera_twi.csv')

                try:
                    file_exists = os.path.exists(csv_path)
                    with open(csv_path, 'a', encoding='utf-8', newline='') as f:
                        writer = csv.DictWriter(f, fieldnames=['twi_query', 'intent', 'twi_response', 'english_translation', 'source'])
                        if not file_exists:
                            writer.writeheader()
                        writer.writerow({
                            'twi_query': twi_query,
                            'intent': intent,
                            'twi_response': twi_response,
                            'english_translation': english_translation,
                            'source': source
                        })

                    metrics = model_engine.train()
                    model_engine.save_model()

                    response_body = {
                        'success': True,
                        'message': 'Sample added and model re-trained successfully!',
                        'metrics': metrics
                    }
                except Exception as e:
                    status = '500 Internal Server Error'
                    response_body = {'error': str(e)}
        else:
            status = '404 Not Found'
            response_body = {'error': 'Endpoint not found'}

        start_response(status, headers)
        return [json.dumps(response_body, ensure_ascii=False).encode('utf-8')]

    def run_flask():
        port = int(os.environ.get('FLASK_PORT', 5000))
        print(f"🚀 [Flask-Compatible Engine] Serving API on http://0.0.0.0:{port}")
        httpd = make_server('0.0.0.0', port, wsgi_app)
        httpd.serve_forever()

if __name__ == '__main__':
    run_flask()
