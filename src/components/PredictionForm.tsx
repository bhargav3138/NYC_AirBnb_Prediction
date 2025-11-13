import { useState } from 'react';
import { PredictionInput } from '../types';

interface PredictionFormProps {
  onSubmit: (input: PredictionInput) => void;
  isLoading: boolean;
  predictionType: 'price' | 'demand';
}

const neighbourhoodGroups = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
const roomTypes = ['Entire home/apt', 'Private room', 'Shared room'];

const neighbourhoods: Record<string, string[]> = {
  Manhattan: ['Harlem', 'Upper West Side', 'Hell\'s Kitchen', 'East Village', 'Upper East Side', 'Midtown', 'East Harlem', 'West Village', 'Chelsea', 'SoHo'],
  Brooklyn: ['Williamsburg', 'Bedford-Stuyvesant', 'Bushwick', 'Crown Heights', 'Park Slope', 'Greenpoint', 'Fort Greene', 'Brooklyn Heights'],
  Queens: ['Astoria', 'Long Island City', 'Flushing', 'Jamaica', 'Ridgewood', 'Forest Hills'],
  Bronx: ['Kingsbridge', 'Concourse', 'Mott Haven', 'Fordham'],
  'Staten Island': ['St. George', 'Tompkinsville', 'Stapleton']
};

export default function PredictionForm({ onSubmit, isLoading, predictionType }: PredictionFormProps) {
  const [formData, setFormData] = useState({
    latitude: 40.7580,
    longitude: -73.9855,
    room_type: 'Entire home/apt',
    neighbourhood_group: 'Manhattan',
    neighbourhood: 'Harlem',
    minimum_nights: 1,
    number_of_reviews: 0,
    reviews_per_month: 0,
    calculated_host_listings_count: 1,
    availability_365: 365,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, prediction_type: predictionType });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['latitude', 'longitude', 'minimum_nights', 'number_of_reviews', 'reviews_per_month', 'calculated_host_listings_count', 'availability_365'];

    if (name === 'neighbourhood_group') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        neighbourhood: neighbourhoods[value][0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Neighbourhood Group
          </label>
          <select
            name="neighbourhood_group"
            value={formData.neighbourhood_group}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {neighbourhoodGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Neighbourhood
          </label>
          <select
            name="neighbourhood"
            value={formData.neighbourhood}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {neighbourhoods[formData.neighbourhood_group].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room Type
          </label>
          <select
            name="room_type"
            value={formData.room_type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {roomTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Nights
          </label>
          <input
            type="number"
            name="minimum_nights"
            value={formData.minimum_nights}
            onChange={handleChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Latitude
          </label>
          <input
            type="number"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            step="0.0001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Longitude
          </label>
          <input
            type="number"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            step="0.0001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Reviews
          </label>
          <input
            type="number"
            name="number_of_reviews"
            value={formData.number_of_reviews}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reviews per Month
          </label>
          <input
            type="number"
            name="reviews_per_month"
            value={formData.reviews_per_month}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Host Listings Count
          </label>
          <input
            type="number"
            name="calculated_host_listings_count"
            value={formData.calculated_host_listings_count}
            onChange={handleChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Availability (days/year)
          </label>
          <input
            type="number"
            name="availability_365"
            value={formData.availability_365}
            onChange={handleChange}
            min="0"
            max="365"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Predicting...' : `Predict ${predictionType === 'price' ? 'Price' : 'Demand'}`}
      </button>
    </form>
  );
}
