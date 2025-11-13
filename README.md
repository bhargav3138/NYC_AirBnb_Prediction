# NYC Airbnb Predictor

A machine learning-powered web application that predicts Airbnb listing prices and booking demand for New York City properties. Built with React, TypeScript, and Supabase.

## Features

- **Price Prediction**: Predict nightly rates for NYC Airbnb listings using a Random Forest model trained on 44,000+ listings
- **Demand Prediction**: Forecast booking likelihood using a LightGBM classifier
- **Real-time Analysis**: Get instant predictions based on listing characteristics
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase Edge Functions (serverless)
- **Database**: Supabase PostgreSQL
- **ML Models**: Random Forest (price), LightGBM (demand)

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Supabase account with project credentials

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Create an optimized production build:
```bash
npm run build
```

### Linting

Check code quality:
```bash
npm run lint
```

### Type Checking

Verify TypeScript types:
```bash
npm run typecheck
```

## How It Works

### Price Prediction

Input the following listing details to predict the nightly rate:
- Room type (Entire home, Private room, Shared room)
- Number of bedrooms and bathrooms
- Availability percentage
- Review score and count
- Borough/neighborhood

The model returns:
- Predicted price per night
- Confidence interval
- Key factors influencing the prediction

### Demand Prediction

Predict booking likelihood based on:
- Availability patterns
- Review frequency
- Location factors
- Historical occupancy data

The model outputs:
- Booking probability (High/Medium/Low)
- Demand score
- Recommendations for improvement

## Project Structure

```
src/
├── components/
│   ├── PredictionForm.tsx      # Input form for predictions
│   ├── ResultsDisplay.tsx       # Display prediction results
│   └── StatisticsPanel.tsx      # Statistics sidebar
├── lib/
│   └── supabase.ts             # Supabase client setup
├── types/
│   └── index.ts                # TypeScript definitions
├── App.tsx                      # Main application component
├── main.tsx                     # Entry point
└── index.css                    # Global styles
```

## Machine Learning Models

### Price Prediction Model
- **Algorithm**: Random Forest Regressor
- **Training Data**: 44,000+ NYC Airbnb listings
- **Features**: Location, room type, amenities, reviews, availability
- **Performance**: Optimized for mean absolute error

### Demand Prediction Model
- **Algorithm**: LightGBM Classifier
- **Classes**: High, Medium, Low demand
- **Training Data**: Historical booking patterns
- **Features**: Availability, review frequency, location, seasonality

## Backend API

The application uses Supabase Edge Functions to handle predictions. All API calls are routed through:

```
POST https://[SUPABASE_URL]/functions/v1/predict
```

**Request Format:**
```json
{
  "prediction_type": "price" | "demand",
  "room_type": "Entire home" | "Private room" | "Shared room",
  "bedrooms": number,
  "bathrooms": number,
  "availability_365": number,
  "review_scores_rating": number,
  "number_of_reviews": number,
  "neighbourhood_group": string
}
```

**Response Format:**
```json
{
  "prediction": number,
  "confidence": number,
  "factors": {
    "factor_name": weight
  }
}
```

## Security

- All predictions are processed through Supabase Edge Functions
- Database access is protected with Row Level Security (RLS)
- Environment variables are securely stored and never exposed to the client
- API calls include proper authentication headers

## Dataset

The models are trained on the NYC Airbnb 2019 dataset containing:
- 48,000+ listings
- 16+ features per listing
- Comprehensive price and demand data
- Geographic distribution across all NYC boroughs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions, please open an issue in the repository or contact the development team.

---

**Built with machine learning and modern web technologies** to help hosts optimize their Airbnb listings in New York City.
# NYC_AirBnb_Prediction
