import { useEffect, useState } from 'react';
import { BarChart3, Database, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Statistics {
  totalPredictions: number;
  pricePredictions: number;
  demandPredictions: number;
  recentPredictions: Array<{
    id: string;
    prediction_type: string;
    created_at: string;
  }>;
}

export default function StatisticsPanel() {
  const [stats, setStats] = useState<Statistics>({
    totalPredictions: 0,
    pricePredictions: 0,
    demandPredictions: 0,
    recentPredictions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const { data: allPredictions, error: allError } = await supabase
        .from('predictions')
        .select('id, prediction_type, created_at')
        .order('created_at', { ascending: false });

      if (allError) throw allError;

      const pricePreds = allPredictions?.filter(p => p.prediction_type === 'price') || [];
      const demandPreds = allPredictions?.filter(p => p.prediction_type === 'demand') || [];

      setStats({
        totalPredictions: allPredictions?.length || 0,
        pricePredictions: pricePreds.length,
        demandPredictions: demandPreds.length,
        recentPredictions: allPredictions?.slice(0, 5) || [],
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Statistics</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Total Predictions</span>
          </div>
          <span className="text-2xl font-bold text-blue-600">{stats.totalPredictions}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-xs text-gray-600 mb-1">Price</p>
            <p className="text-xl font-bold text-green-600">{stats.pricePredictions}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg text-center">
            <p className="text-xs text-gray-600 mb-1">Demand</p>
            <p className="text-xl font-bold text-orange-600">{stats.demandPredictions}</p>
          </div>
        </div>

        {stats.recentPredictions.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">Recent Predictions</h3>
            </div>
            <div className="space-y-2">
              {stats.recentPredictions.map((pred) => (
                <div
                  key={pred.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                >
                  <span className="font-mono text-gray-600 truncate max-w-[150px]">
                    {pred.id.substring(0, 8)}...
                  </span>
                  <span className={`px-2 py-1 rounded ${
                    pred.prediction_type === 'price'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {pred.prediction_type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
