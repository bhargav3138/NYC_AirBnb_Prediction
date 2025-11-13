import { useState } from 'react';
import { Home, DollarSign, TrendingUp } from 'lucide-react';
import PredictionForm from './components/PredictionForm';
import ResultsDisplay from './components/ResultsDisplay';
import StatisticsPanel from './components/StatisticsPanel';
import { PredictionInput, PricePredictionResult, DemandPredictionResult } from './types';

type Tab = 'price' | 'demand';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('price');
  const [isLoading, setIsLoading] = useState(false);
  const [priceResult, setPriceResult] = useState<PricePredictionResult | null>(null);
  const [demandResult, setDemandResult] = useState<DemandPredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePrediction = async (input: PredictionInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      const apiUrl = `${supabaseUrl}/functions/v1/predict`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Prediction failed');
      }

      const result = await response.json();

      if (input.prediction_type === 'price') {
        setPriceResult(result);
      } else {
        setDemandResult(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Prediction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <Home className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                NYC Airbnb Predictor
              </h1>
              <p className="text-gray-600 mt-1">
                Predict prices and booking demand for New York City Airbnb listings
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => {
                    setActiveTab('price');
                    setError(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                    activeTab === 'price'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  Price Prediction
                </button>
                <button
                  onClick={() => {
                    setActiveTab('demand');
                    setError(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                    activeTab === 'demand'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                  Demand Prediction
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <PredictionForm
                onSubmit={handlePrediction}
                isLoading={isLoading}
                predictionType={activeTab}
              />

              {activeTab === 'price' && priceResult && (
                <ResultsDisplay result={priceResult} type="price" />
              )}

              {activeTab === 'demand' && demandResult && (
                <ResultsDisplay result={demandResult} type="demand" />
              )}
            </div>

            <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About the Models</h2>
              <div className="space-y-4 text-sm text-gray-600">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Price Prediction Model</h3>
                  <p>
                    Random Forest Regressor trained on 44,000+ NYC Airbnb listings.
                    Considers location, room type, reviews, and availability to predict nightly rates.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Demand Classification Model</h3>
                  <p>
                    LightGBM Classifier that predicts booking likelihood based on availability patterns,
                    review frequency, and location factors.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <StatisticsPanel />
          </div>
        </div>

        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>Dataset: NYC Airbnb 2019 | 48,000+ listings analyzed</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
