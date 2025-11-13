import { DollarSign, TrendingUp, Activity } from 'lucide-react';
import { PricePredictionResult, DemandPredictionResult } from '../types';

interface ResultsDisplayProps {
  result: PricePredictionResult | DemandPredictionResult | null;
  type: 'price' | 'demand';
}

export default function ResultsDisplay({ result, type }: ResultsDisplayProps) {
  if (!result) return null;

  const isPriceResult = (res: PricePredictionResult | DemandPredictionResult): res is PricePredictionResult => {
    return 'predicted_price' in res;
  };

  if (type === 'price' && isPriceResult(result)) {
    return (
      <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-600 rounded-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Price Prediction</h3>
            <p className="text-sm text-gray-600">{result.model_version}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Predicted Price</p>
            <p className="text-3xl font-bold text-blue-600">${result.predicted_price.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">per night</p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Confidence Score</p>
            <p className="text-3xl font-bold text-green-600">{(result.confidence * 100).toFixed(1)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${result.confidence * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">
            Prediction ID: <span className="font-mono text-gray-800">{result.prediction_id}</span>
          </p>
        </div>
      </div>
    );
  }

  if (type === 'demand' && !isPriceResult(result)) {
    const isHighDemand = result.predicted_class === 'high-demand';

    return (
      <div className="mt-6 p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-lg ${isHighDemand ? 'bg-green-600' : 'bg-orange-600'}`}>
            {isHighDemand ? (
              <TrendingUp className="w-6 h-6 text-white" />
            ) : (
              <Activity className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Demand Prediction</h3>
            <p className="text-sm text-gray-600">{result.model_version}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Classification</p>
            <p className={`text-2xl font-bold ${isHighDemand ? 'text-green-600' : 'text-orange-600'}`}>
              {isHighDemand ? 'High Demand' : 'Low Demand'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {isHighDemand ? 'Frequently booked' : 'Less frequent bookings'}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Probability</p>
            <p className={`text-3xl font-bold ${isHighDemand ? 'text-green-600' : 'text-orange-600'}`}>
              {(result.probability * 100).toFixed(1)}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${isHighDemand ? 'bg-green-600' : 'bg-orange-600'}`}
                style={{ width: `${result.probability * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-gray-600">
            Prediction ID: <span className="font-mono text-gray-800">{result.prediction_id}</span>
          </p>
        </div>
      </div>
    );
  }

  return null;
}
