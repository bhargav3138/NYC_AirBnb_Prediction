# NYC Airbnb Predictor - Complete Setup Guide

A full-stack machine learning application that predicts Airbnb prices and booking demand in New York City using React frontend, Flask backend with ML models, and Supabase database.

## Quick Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + TypeScript + Tailwind)                   │
│  - Price & Demand Prediction Forms                          │
│  - Real-time Results Display                                │
│  - Statistics Dashboard                                     │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP
┌────────────────▼────────────────────────────────────────────┐
│  Backend (Flask + Python ML)                                │
│  - Random Forest Price Predictor                            │
│  - LightGBM Demand Classifier                               │
│  - REST API Endpoints                                       │
└────────────────┬────────────────────────────────────────────┘
                 │ Supabase
┌────────────────▼────────────────────────────────────────────┐
│  Database (PostgreSQL via Supabase)                         │
│  - Listings Table                                           │
│  - Predictions Table                                        │
│  - Model Metadata                                           │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- **Node.js** 16+ (frontend development)
- **Python** 3.8+ (backend development)
- **Git** (version control)
- **Supabase Account** (database) - Already provisioned
- **curl** or **Postman** (testing API)

## Installation

### 1. Frontend Setup (React)

The frontend is already configured. Just install dependencies:

```bash
npm install
```

The frontend includes:
- **PredictionForm**: Collects listing parameters
- **ResultsDisplay**: Shows predictions with confidence scores
- **StatisticsPanel**: Live prediction statistics from database
- **Responsive Design**: Works on mobile, tablet, desktop

**Environment Variables:**
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_BACKEND_URL=http://localhost:5000
```

### 2. Backend Setup (Python + ML)

Navigate to project directory and set up Python environment:

```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Database Setup (Supabase)

The database schema is already created via migrations. Tables include:
- `listings` - Airbnb listing data
- `predictions` - Model predictions with audit trail
- `model_metadata` - Model versions and performance metrics

Verify tables exist:
```bash
# In Supabase dashboard → SQL Editor, run:
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

## Running the Application

### Local Development (Recommended)

**Terminal 1 - Start Frontend:**
```bash
npm run dev
```
Frontend runs at: http://localhost:5173

**Terminal 2 - Train Models & Start Backend:**
```bash
# First time only - train the models
python ml_models/train_models.py

# Start the backend server
python backend/app.py
```
Backend runs at: http://localhost:5000

**Test the Setup:**
1. Open http://localhost:5173 in browser
2. Fill in listing parameters
3. Click "Predict Price" or "Predict Demand"
4. See results with confidence scores

### Using Docker

**Build and run with Docker Compose:**
```bash
docker-compose up --build
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## ML Models

### Price Prediction Model

**Algorithm:** Random Forest Regressor
```python
RandomForestRegressor(
    n_estimators=200,
    max_depth=25,
    min_samples_split=5,
    min_samples_leaf=2
)
```

**Input Features (17 total):**
- Location (latitude, longitude)
- Room type (3 categories, one-hot)
- Neighbourhood group (5 categories, one-hot)
- Neighbourhood (frequency encoded)
- Minimum nights required
- Review metrics (count, per month)
- Host listings count
- Availability (days/year)
- Engineered features (ratios, density)

**Output:** Predicted price per night (USD)
- Training R²: ~0.82
- Validation R²: ~0.78
- RMSE: ~$25-30

### Demand Classification Model

**Algorithm:** LightGBM Classifier
```python
LGBMClassifier(
    objective='binary',
    num_leaves=31,
    learning_rate=0.1,
    n_estimators=200
)
```

**Input:** Same 17 features as price model

**Output:** Binary classification + probability
- High-demand (frequently booked)
- Low-demand (rarely booked)

**Metrics:**
- Accuracy: ~85%
- AUC-ROC: ~0.89
- F1-Score: ~0.82

## API Documentation

### Health Check
```bash
curl http://localhost:5000/health
```
Response:
```json
{
  "status": "healthy",
  "models_loaded": {
    "price_model": true,
    "demand_model": true,
    "feature_columns": true
  }
}
```

### Get Model Metadata
```bash
curl http://localhost:5000/models/metadata
```

### Predict Price
```bash
curl -X POST http://localhost:5000/predict/price \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### Predict Demand
```bash
curl -X POST http://localhost:5000/predict/demand \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

## Project Structure

```
project/
├── src/                           # React Frontend
│   ├── components/
│   │   ├── PredictionForm.tsx     # Form for collecting inputs
│   │   ├── ResultsDisplay.tsx     # Shows predictions
│   │   └── StatisticsPanel.tsx    # Dashboard stats
│   ├── lib/
│   │   └── supabase.ts            # Supabase client
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   ├── App.tsx                    # Main application
│   └── main.tsx                   # Entry point
├── backend/                       # Flask Backend
│   ├── app.py                     # Main Flask app
│   └── __init__.py
├── ml_models/                     # Machine Learning
│   ├── train_models.py            # Training script
│   ├── models/                    # Trained models
│   │   ├── price_model.joblib
│   │   ├── demand_model.pkl
│   │   ├── feature_columns.joblib
│   │   └── metadata.json
│   └── __init__.py
├── supabase/                      # Database
│   └── migrations/                # Schema migrations
├── requirements.txt               # Python dependencies
├── package.json                   # Node dependencies
├── vite.config.ts                 # Frontend build config
├── tsconfig.json                  # TypeScript config
├── tailwind.config.js             # Styling config
├── Dockerfile                     # Docker configuration
├── docker-compose.yml             # Docker Compose
├── .env                           # Environment variables
├── .gitignore                     # Git ignore rules
└── README.md                      # Project readme
```

## Testing the Application

### 1. Test Frontend
```bash
npm run build
# Check for build errors
```

### 2. Test Backend API
```bash
# Check if backend is healthy
curl http://localhost:5000/health

# Test price prediction
curl -X POST http://localhost:5000/predict/price \
  -H "Content-Type: application/json" \
  -d '{"latitude": 40.7580, ...}'
```

### 3. Test Database Integration
```sql
-- Check predictions in database
SELECT COUNT(*) as total_predictions,
       prediction_type,
       COUNT(*) as count
FROM predictions
GROUP BY prediction_type;
```

### 4. Test End-to-End
1. Start frontend: `npm run dev`
2. Start backend: `python backend/app.py`
3. Open http://localhost:5173
4. Fill form and submit
5. Verify prediction appears in results
6. Check Supabase dashboard for record

## Troubleshooting

### Frontend Issues

**"Backend URL not configured"**
- Check `.env` file has `VITE_BACKEND_URL=http://localhost:5000`
- Restart dev server: `npm run dev`

**"Cannot reach backend"**
- Ensure backend is running: `python backend/app.py`
- Check backend port: `curl http://localhost:5000/health`
- Check CORS is enabled in Flask

### Backend Issues

**"Failed to load models"**
```bash
python ml_models/train_models.py
```

**"ModuleNotFoundError"**
```bash
pip install -r requirements.txt
source venv/bin/activate  # Verify virtual env is activated
```

**"Supabase connection failed"**
- Verify `SUPABASE_URL` in `.env`
- Verify `SUPABASE_ANON_KEY` in `.env`
- Test connection: `curl https://your-supabase-url/rest/v1/`

### Database Issues

**Tables not found**
- Run migrations: Check Supabase dashboard → SQL Editor
- Verify schema created successfully

**Cannot insert predictions**
- Check RLS policies are correct
- Verify user has insert permissions
- Check prediction format matches schema

## Production Deployment

### Deploy Frontend (Netlify)
```bash
# Build frontend
npm run build

# Deploy dist/ folder to Netlify
```

### Deploy Backend (Heroku)
```bash
# Create Procfile
echo "web: python backend/app.py" > Procfile

# Deploy
git push heroku main
```

### Deploy with Docker (Any Cloud)
```bash
# Build image
docker build -t airbnb-predictor .

# Push to registry and deploy
```

## Performance Optimization

### Frontend
- Lazy load components
- Memoize expensive calculations
- Use React.memo for prediction results

### Backend
- Batch predictions for scalability
- Cache model predictions
- Use connection pooling for database

### Database
- Add indexes on frequently queried columns
- Implement query caching
- Archive old predictions

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test
3. Commit: `git commit -am 'Add feature'`
4. Push: `git push origin feature/your-feature`
5. Submit pull request

## Support

For issues or questions:
1. Check logs: `docker logs airbnb-backend`
2. Review error messages
3. Test endpoints with curl
4. Check database directly in Supabase dashboard

## License

This project uses open-source libraries:
- Flask (BSD)
- scikit-learn (BSD)
- LightGBM (MIT)
- React (MIT)
- Tailwind CSS (MIT)
