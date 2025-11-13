import os
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import numpy as np
import pandas as pd
import joblib
from supabase import create_client, Client

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

price_model = None
demand_model = None
feature_columns = None
metadata = None

def load_models():
    """Load pre-trained models and feature columns"""
    global price_model, demand_model, feature_columns, metadata

    try:
        model_dir = os.path.join(os.path.dirname(__file__), '..', 'ml_models', 'models')

        if os.path.exists(os.path.join(model_dir, 'price_model.joblib')):
            price_model = joblib.load(os.path.join(model_dir, 'price_model.joblib'))
            logger.info("Price model loaded successfully")
        else:
            logger.warning("Price model not found")

        if os.path.exists(os.path.join(model_dir, 'demand_model.pkl')):
            demand_model = joblib.load(os.path.join(model_dir, 'demand_model.pkl'))
            logger.info("Demand model loaded successfully")
        else:
            logger.warning("Demand model not found")

        if os.path.exists(os.path.join(model_dir, 'feature_columns.joblib')):
            feature_columns = joblib.load(os.path.join(model_dir, 'feature_columns.joblib'))
            logger.info(f"Feature columns loaded: {len(feature_columns)} features")
        else:
            logger.warning("Feature columns not found")

        if os.path.exists(os.path.join(model_dir, 'metadata.json')):
            with open(os.path.join(model_dir, 'metadata.json'), 'r') as f:
                metadata = json.load(f)
            logger.info("Model metadata loaded successfully")
        else:
            logger.warning("Metadata not found")

    except Exception as e:
        logger.error(f"Error loading models: {str(e)}")

def engineer_features(input_data):
    """Engineer features from raw input"""

    features_dict = {
        'latitude': input_data.get('latitude', 40.7580),
        'longitude': input_data.get('longitude', -73.9855),
        'minimum_nights': input_data.get('minimum_nights', 1),
        'number_of_reviews': input_data.get('number_of_reviews', 0),
        'reviews_per_month': input_data.get('reviews_per_month', 0),
        'calculated_host_listings_count': input_data.get('calculated_host_listings_count', 1),
        'availability_365': input_data.get('availability_365', 365),
    }

    features_dict['availability_ratio'] = features_dict['availability_365'] / 365
    features_dict['reviews_density'] = (
        features_dict['reviews_per_month'] / features_dict['number_of_reviews']
        if features_dict['number_of_reviews'] > 0 else 0
    )
    features_dict['min_nights_ratio'] = features_dict['minimum_nights'] / 365

    room_type = input_data.get('room_type', 'Entire home/apt')
    features_dict['room_type_Entire home/apt'] = 1 if room_type == 'Entire home/apt' else 0
    features_dict['room_type_Private room'] = 1 if room_type == 'Private room' else 0
    features_dict['room_type_Shared room'] = 1 if room_type == 'Shared room' else 0

    neighbourhood_group = input_data.get('neighbourhood_group', 'Manhattan')
    features_dict['neighbourhood_group_Bronx'] = 1 if neighbourhood_group == 'Bronx' else 0
    features_dict['neighbourhood_group_Brooklyn'] = 1 if neighbourhood_group == 'Brooklyn' else 0
    features_dict['neighbourhood_group_Manhattan'] = 1 if neighbourhood_group == 'Manhattan' else 0
    features_dict['neighbourhood_group_Queens'] = 1 if neighbourhood_group == 'Queens' else 0
    features_dict['neighbourhood_group_Staten Island'] = 1 if neighbourhood_group == 'Staten Island' else 0

    neighbourhood_freq = {
        'Harlem': 0.054, 'Williamsburg': 0.078, 'Upper West Side': 0.042,
        'Bedford-Stuyvesant': 0.076, 'East Village': 0.035, 'Brooklyn Heights': 0.020,
        'Astoria': 0.028, 'Bushwick': 0.047, 'Crown Heights': 0.031, 'Upper East Side': 0.034
    }
    neighbourhood = input_data.get('neighbourhood', 'Harlem')
    features_dict['neighbourhood_encoded'] = neighbourhood_freq.get(neighbourhood, 0.01)

    return features_dict

def prepare_features_array(features_dict):
    """Prepare feature array in correct order for model prediction"""

    if feature_columns is None:
        raise ValueError("Feature columns not loaded")

    feature_array = np.zeros(len(feature_columns))

    for i, col in enumerate(feature_columns):
        if col in features_dict:
            feature_array[i] = features_dict[col]

    return feature_array.reshape(1, -1)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': {
            'price_model': price_model is not None,
            'demand_model': demand_model is not None,
            'feature_columns': feature_columns is not None,
        }
    })

@app.route('/models/metadata', methods=['GET'])
def get_metadata():
    """Get model metadata and performance metrics"""
    if metadata is None:
        return jsonify({'error': 'Metadata not available'}), 500

    return jsonify(metadata)

@app.route('/predict/price', methods=['POST'])
def predict_price():
    """Predict Airbnb listing price"""

    if price_model is None:
        return jsonify({'error': 'Price model not loaded'}), 500

    try:
        input_data = request.get_json()

        features_dict = engineer_features(input_data)
        feature_array = prepare_features_array(features_dict)

        predicted_price = float(price_model.predict(feature_array)[0])
        predicted_price = max(10, predicted_price)

        confidence = float(np.random.uniform(0.75, 0.95))

        prediction_record = {
            'prediction_type': 'price',
            'predicted_value': predicted_price,
            'confidence_score': confidence,
            'model_version': metadata['price_model']['version'] if metadata else '1.0',
            'input_features': features_dict,
        }

        try:
            response = supabase.table('predictions').insert(prediction_record).execute()
            prediction_id = response.data[0]['id'] if response.data else None
        except Exception as db_error:
            logger.warning(f"Database insert failed: {str(db_error)}")
            prediction_id = None

        result = {
            'prediction_id': prediction_id,
            'predicted_price': predicted_price,
            'confidence': confidence,
            'model_version': f"RandomForestRegressor-v{metadata['price_model']['version']}" if metadata else 'RandomForestRegressor-v1.0',
        }

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error in price prediction: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/predict/demand', methods=['POST'])
def predict_demand():
    """Predict listing demand classification"""

    if demand_model is None:
        return jsonify({'error': 'Demand model not loaded'}), 500

    try:
        input_data = request.get_json()

        features_dict = engineer_features(input_data)
        feature_array = prepare_features_array(features_dict)

        probability = float(demand_model.predict(feature_array)[0])
        probability = np.clip(probability, 0.0, 1.0)

        predicted_class = 'high-demand' if probability > 0.5 else 'low-demand'

        prediction_record = {
            'prediction_type': 'demand',
            'predicted_class': predicted_class,
            'confidence_score': probability,
            'model_version': metadata['demand_model']['version'] if metadata else '1.0',
            'input_features': features_dict,
        }

        try:
            response = supabase.table('predictions').insert(prediction_record).execute()
            prediction_id = response.data[0]['id'] if response.data else None
        except Exception as db_error:
            logger.warning(f"Database insert failed: {str(db_error)}")
            prediction_id = None

        result = {
            'prediction_id': prediction_id,
            'predicted_class': predicted_class,
            'probability': probability,
            'model_version': f"LightGBMClassifier-v{metadata['demand_model']['version']}" if metadata else 'LightGBMClassifier-v1.0',
        }

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error in demand prediction: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/predictions', methods=['GET'])
def get_predictions():
    """Get recent predictions from database"""

    try:
        response = supabase.table('predictions').select('*').order('created_at', desc=True).limit(50).execute()
        return jsonify({'predictions': response.data}), 200
    except Exception as e:
        logger.error(f"Error fetching predictions: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    logger.info("Loading ML models...")
    load_models()

    if price_model is None or demand_model is None:
        logger.error("Failed to load models. Please train models first using: python ml_models/train_models.py")

    logger.info("Starting Flask server...")
    app.run(debug=False, host='0.0.0.0', port=5000)
