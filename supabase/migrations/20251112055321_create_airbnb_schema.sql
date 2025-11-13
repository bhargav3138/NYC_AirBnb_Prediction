/*
  # Airbnb Prediction System Database Schema

  ## Overview
  This migration creates the complete database structure for the Airbnb price prediction 
  and booking likelihood system for NYC listings.

  ## New Tables
  
  ### 1. `listings`
  Stores Airbnb listing data from the NYC 2019 dataset
  - `id` (bigserial, primary key) - Auto-incrementing listing ID
  - `listing_id` (bigint, unique) - Original Airbnb listing ID
  - `name` (text) - Listing name
  - `host_id` (bigint) - Host ID
  - `host_name` (text) - Host name
  - `neighbourhood_group` (text) - Borough (Manhattan, Brooklyn, etc.)
  - `neighbourhood` (text) - Specific neighborhood
  - `latitude` (decimal) - Geographical latitude
  - `longitude` (decimal) - Geographical longitude
  - `room_type` (text) - Type of room (Entire home/apt, Private room, Shared room)
  - `price` (decimal) - Price per night
  - `minimum_nights` (integer) - Minimum nights required
  - `number_of_reviews` (integer) - Total number of reviews
  - `last_review` (date) - Date of last review
  - `reviews_per_month` (decimal) - Average reviews per month
  - `calculated_host_listings_count` (integer) - Number of listings by host
  - `availability_365` (integer) - Days available in year
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. `predictions`
  Stores prediction results from both models
  - `id` (uuid, primary key) - Unique prediction ID
  - `listing_id` (bigint) - Reference to listing
  - `prediction_type` (text) - 'price' or 'demand'
  - `predicted_value` (decimal) - Predicted price or probability
  - `predicted_class` (text) - For classification: 'high-demand' or 'low-demand'
  - `confidence_score` (decimal) - Model confidence/probability
  - `model_version` (text) - Which model version was used
  - `input_features` (jsonb) - Features used for prediction
  - `created_at` (timestamptz) - When prediction was made

  ### 3. `model_metadata`
  Tracks model versions and performance metrics
  - `id` (uuid, primary key) - Unique model ID
  - `model_name` (text) - Model name (e.g., 'RandomForestRegressor', 'LightGBMClassifier')
  - `model_type` (text) - 'regression' or 'classification'
  - `version` (text) - Version string
  - `accuracy_metrics` (jsonb) - Performance metrics (RMSE, R2, accuracy, etc.)
  - `feature_importance` (jsonb) - Feature importance scores
  - `is_active` (boolean) - Whether this is the active model
  - `trained_at` (timestamptz) - When model was trained
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Public read access for listings and model metadata
  - Authenticated users can create predictions
  - Only authenticated users can insert/update listings and model metadata
*/

CREATE TABLE IF NOT EXISTS listings (
  id bigserial PRIMARY KEY,
  listing_id bigint UNIQUE NOT NULL,
  name text NOT NULL,
  host_id bigint NOT NULL,
  host_name text NOT NULL,
  neighbourhood_group text NOT NULL,
  neighbourhood text NOT NULL,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  room_type text NOT NULL,
  price decimal(10, 2) NOT NULL,
  minimum_nights integer NOT NULL DEFAULT 1,
  number_of_reviews integer NOT NULL DEFAULT 0,
  last_review date,
  reviews_per_month decimal(5, 2) DEFAULT 0,
  calculated_host_listings_count integer NOT NULL DEFAULT 1,
  availability_365 integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id bigint,
  prediction_type text NOT NULL CHECK (prediction_type IN ('price', 'demand')),
  predicted_value decimal(10, 2),
  predicted_class text CHECK (predicted_class IN ('high-demand', 'low-demand', NULL)),
  confidence_score decimal(5, 4),
  model_version text NOT NULL,
  input_features jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS model_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  model_type text NOT NULL CHECK (model_type IN ('regression', 'classification')),
  version text NOT NULL,
  accuracy_metrics jsonb NOT NULL,
  feature_importance jsonb,
  is_active boolean DEFAULT false,
  trained_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_neighbourhood_group ON listings(neighbourhood_group);
CREATE INDEX IF NOT EXISTS idx_listings_room_type ON listings(room_type);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_predictions_type ON predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_model_metadata_active ON model_metadata(is_active) WHERE is_active = true;

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view listings"
  ON listings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view predictions"
  ON predictions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create predictions"
  ON predictions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view model metadata"
  ON model_metadata FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert model metadata"
  ON model_metadata FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update model metadata"
  ON model_metadata FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);