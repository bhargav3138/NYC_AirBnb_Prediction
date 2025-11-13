# NYC Airbnb Predictor - Python Backend Setup

This guide explains how to set up and run the Python Flask backend with machine learning models.

## Project Structure

```
project/
├── backend/
│   ├── app.py              # Flask application with API endpoints
│   └── __init__.py
├── ml_models/
│   ├── train_models.py     # Model training script
│   ├── models/             # Trained model storage
│   │   ├── price_model.joblib
│   │   ├── demand_model.pkl
│   │   ├── feature_columns.joblib
│   │   └── metadata.json
│   └── __init__.py
├── requirements.txt        # Python dependencies
├── Dockerfile             # Docker container configuration
├── docker-compose.yml     # Docker Compose setup
└── start_backend.sh       # Startup script
```

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Supabase project setup with database tables (already created via migrations)

## Quick Start

### Option 1: Local Setup (Linux/Mac/Windows WSL)

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Train models:**
   ```bash
   python ml_models/train_models.py
   ```
   This generates:
   - `ml_models/models/price_model.joblib` - Random Forest regressor
   - `ml_models/models/demand_model.pkl` - LightGBM classifier
   - `ml_models/models/feature_columns.joblib` - Feature column names
   - `ml_models/models/metadata.json` - Model performance metrics

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Supabase credentials:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

4. **Start the backend:**
   ```bash
   python backend/app.py
   ```
   The server will run on `http://localhost:5000`

### Option 2: Using Docker

1. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

2. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Access the backend:**
   The API will be available at `http://localhost:5000`

### Option 3: Using startup script (Linux/Mac)

```bash
chmod +x start_backend.sh
./start_backend.sh
```

## API Endpoints

### Health Check
```
GET /health
```
Returns model loading status and system health.

### Model Metadata
```
GET /models/metadata
```
Returns model versions, training metrics, and feature importance.

### Price Prediction
```
POST /predict/price
Content-Type: application/json

{
  "latitude": 40.7580,
  "longitude": -73.9855,
  "room_type": "Entire home/apt",
  "neighbourhood_group": "Manhattan",
  "neighbourhood": "Harlem",
  "minimum_nights": 1,
  "number_of_reviews": 0,
  "reviews_per_month": 0,
  "calculated_host_listings_count": 1,
  "availability_365": 365
}
```

Response:
```json
{
  "prediction_id": "uuid",
  "predicted_price": 150.50,
  "confidence": 0.85,
  "model_version": "RandomForestRegressor-v1.0"
}
```

### Demand Prediction
```
POST /predict/demand
Content-Type: application/json

{
  "latitude": 40.7580,
  "longitude": -73.9855,
  "room_type": "Entire home/apt",
  "neighbourhood_group": "Manhattan",
  "neighbourhood": "Harlem",
  "minimum_nights": 1,
  "number_of_reviews": 30,
  "reviews_per_month": 2.5,
  "calculated_host_listings_count": 1,
  "availability_365": 100
}
```

Response:
```json
{
  "prediction_id": "uuid",
  "predicted_class": "high-demand",
  "probability": 0.87,
  "model_version": "LightGBMClassifier-v1.0"
}
```

### Get Recent Predictions
```
GET /predictions
```
Returns last 50 predictions from database.

## ML Models

### 1. Price Prediction Model (Random Forest Regressor)

**Algorithm:** Random Forest Regressor
- **Trees:** 200
- **Max Depth:** 25
- **Features:** 17 engineered features
- **Training Data:** 4,000 synthetic NYC Airbnb listings
- **Target:** Price per night ($)

**Performance:**
- Train R²: ~0.82
- Validation R²: ~0.78
- RMSE: ~$25-30

**Features Used:**
- Location (latitude, longitude)
- Room type (one-hot encoded)
- Neighbourhood group (one-hot encoded)
- Neighbourhood (frequency encoded)
- Minimum nights required
- Number of reviews
- Reviews per month
- Host listings count
- Availability (days/year)
- Engineered features:
  - availability_ratio
  - reviews_density
  - min_nights_ratio

### 2. Demand Classification Model (LightGBM Classifier)

**Algorithm:** LightGBM Classifier
- **Boosting Rounds:** 200
- **Num Leaves:** 31
- **Learning Rate:** 0.1
- **Features:** Same 17 engineered features as price model
- **Target:** High-demand (1) vs Low-demand (0)

**Performance:**
- Train Accuracy: ~0.89
- Validation Accuracy: ~0.85
- Train AUC: ~0.93
- Validation AUC: ~0.89
- F1-Score: ~0.82

## Feature Engineering

Features are automatically engineered from input data:

```
1. Raw Features (as provided):
   - latitude, longitude
   - minimum_nights
   - number_of_reviews
   - reviews_per_month
   - calculated_host_listings_count
   - availability_365

2. Engineered Features:
   - availability_ratio = availability_365 / 365
   - reviews_density = reviews_per_month / number_of_reviews
   - min_nights_ratio = minimum_nights / 365

3. Categorical Features (One-Hot Encoded):
   - room_type (3 categories)
   - neighbourhood_group (5 categories)
   - neighbourhood_encoded (frequency encoding)
```

## Database Integration

All predictions are automatically stored in Supabase:

**Table:** `predictions`
- `id`: UUID (primary key)
- `prediction_type`: 'price' or 'demand'
- `predicted_value`: Predicted price (for price predictions)
- `predicted_class`: 'high-demand' or 'low-demand' (for demand predictions)
- `confidence_score`: Model confidence (0-1)
- `model_version`: Model version string
- `input_features`: JSON object of all input features
- `created_at`: Timestamp

## Troubleshooting

### Models not loading
```
Error: Failed to load models. Please train models first
```
**Solution:** Run `python ml_models/train_models.py` to train models.

### Supabase connection error
```
Error: Supabase connection failed
```
**Solution:** Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`.

### CORS errors from frontend
The Flask backend is configured with CORS enabled. Ensure:
1. Backend is running on `http://localhost:5000`
2. Frontend has `VITE_BACKEND_URL=http://localhost:5000` in `.env`

### Port already in use
If port 5000 is already used:
1. Kill the process: `lsof -ti:5000 | xargs kill -9`
2. Or change port in `backend/app.py`: `app.run(port=5001)`

## Production Deployment

### Using Heroku

1. Create `Procfile`:
   ```
   web: python backend/app.py
   ```

2. Deploy:
   ```bash
   git push heroku main
   ```

### Using AWS Lambda

Use AWS SAM or Zappa to package Flask app for Lambda.

### Using Google Cloud Run

```bash
gcloud run deploy airbnb-predictor --source . --region us-central1
```

## Training Custom Models

To retrain models with your own data:

1. **Prepare CSV data** with columns:
   - latitude, longitude, room_type, neighbourhood_group, neighbourhood
   - minimum_nights, number_of_reviews, reviews_per_month
   - calculated_host_listings_count, availability_365, price, high_demand

2. **Modify** `ml_models/train_models.py`:
   - Replace `generate_realistic_nyc_airbnb_data()` with your data loading function
   - Adjust hyperparameters as needed

3. **Train**:
   ```bash
   python ml_models/train_models.py
   ```

## Development Notes

- Models are loaded on server startup
- Feature engineering happens on every prediction
- Predictions are stored asynchronously (database errors don't fail predictions)
- Models support batching for future optimization

## License

This project is part of the NYC Airbnb Predictor application.
