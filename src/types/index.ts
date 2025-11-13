export interface PredictionInput {
  latitude: number;
  longitude: number;
  room_type: string;
  neighbourhood_group: string;
  neighbourhood: string;
  minimum_nights: number;
  number_of_reviews: number;
  reviews_per_month: number;
  calculated_host_listings_count: number;
  availability_365: number;
  prediction_type: 'price' | 'demand';
}

export interface PricePredictionResult {
  prediction_id: string;
  predicted_price: number;
  confidence: number;
  model_version: string;
}

export interface DemandPredictionResult {
  prediction_id: string;
  predicted_class: 'high-demand' | 'low-demand';
  probability: number;
  model_version: string;
}
