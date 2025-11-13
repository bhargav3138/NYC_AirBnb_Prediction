import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Listing {
  id: number;
  listing_id: number;
  name: string;
  host_id: number;
  host_name: string;
  neighbourhood_group: string;
  neighbourhood: string;
  latitude: number;
  longitude: number;
  room_type: string;
  price: number;
  minimum_nights: number;
  number_of_reviews: number;
  last_review: string | null;
  reviews_per_month: number;
  calculated_host_listings_count: number;
  availability_365: number;
  created_at: string;
}

export interface Prediction {
  id: string;
  listing_id: number | null;
  prediction_type: 'price' | 'demand';
  predicted_value: number | null;
  predicted_class: 'high-demand' | 'low-demand' | null;
  confidence_score: number | null;
  model_version: string;
  input_features: Record<string, unknown>;
  created_at: string;
}

export interface ModelMetadata {
  id: string;
  model_name: string;
  model_type: 'regression' | 'classification';
  version: string;
  accuracy_metrics: Record<string, unknown>;
  feature_importance: Record<string, unknown> | null;
  is_active: boolean;
  trained_at: string;
  created_at: string;
}
