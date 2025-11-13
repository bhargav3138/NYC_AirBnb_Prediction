import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
import lightgbm as lgb
import joblib
import os
from datetime import datetime, timedelta

np.random.seed(42)

def generate_realistic_nyc_airbnb_data(n_samples=4000):
    """Generate realistic NYC Airbnb dataset for training"""

    data = {
        'latitude': np.random.uniform(40.58, 40.92, n_samples),
        'longitude': np.random.uniform(-74.29, -73.70, n_samples),
        'room_type': np.random.choice(['Entire home/apt', 'Private room', 'Shared room'], n_samples, p=[0.5, 0.45, 0.05]),
        'neighbourhood_group': np.random.choice(['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'], n_samples, p=[0.40, 0.32, 0.18, 0.07, 0.03]),
        'neighbourhood': np.random.choice(['Harlem', 'Williamsburg', 'Upper West Side', 'Bedford-Stuyvesant', 'East Village', 'Brooklyn Heights', 'Astoria', 'Bushwick', 'Crown Heights', 'Upper East Side'], n_samples),
        'minimum_nights': np.random.choice([1, 2, 3, 7, 30, 90], n_samples, p=[0.40, 0.20, 0.15, 0.15, 0.07, 0.03]),
        'number_of_reviews': np.random.exponential(scale=15, size=n_samples).astype(int),
        'reviews_per_month': np.random.exponential(scale=1.5, size=n_samples),
        'calculated_host_listings_count': np.random.choice(range(1, 50), n_samples, p=np.exp(-np.arange(50)/10)/np.sum(np.exp(-np.arange(50)/10))),
        'availability_365': np.random.uniform(0, 365, n_samples),
    }

    df = pd.DataFrame(data)

    price = 100
    price += np.where(df['room_type'] == 'Entire home/apt', 80, 0)
    price += np.where(df['room_type'] == 'Private room', 30, 0)
    price += np.where(df['neighbourhood_group'] == 'Manhattan', 60, 0)
    price += np.where(df['neighbourhood_group'] == 'Brooklyn', 30, 0)
    price += df['number_of_reviews'] * 0.5
    price += df['reviews_per_month'] * 10
    price -= df['availability_365'] * 0.05
    price += np.random.normal(0, 20, n_samples)
    df['price'] = np.maximum(10, price)

    df['high_demand'] = (
        ((df['availability_365'] < 100) & (df['number_of_reviews'] > 10)).astype(int) |
        ((df['reviews_per_month'] > 2) & (df['neighbourhood_group'] == 'Manhattan')).astype(int)
    )

    return df

def engineer_features(df):
    """Engineer features for modeling"""

    df = df.copy()

    df['availability_ratio'] = df['availability_365'] / 365
    df['reviews_density'] = np.where(df['number_of_reviews'] > 0, df['reviews_per_month'] / df['number_of_reviews'], 0)
    df['min_nights_ratio'] = df['minimum_nights'] / 365

    room_type_dummies = pd.get_dummies(df['room_type'], prefix='room_type')
    neighbourhood_group_dummies = pd.get_dummies(df['neighbourhood_group'], prefix='neighbourhood_group')

    neighbourhood_freq = df['neighbourhood'].value_counts(normalize=True).to_dict()
    df['neighbourhood_encoded'] = df['neighbourhood'].map(neighbourhood_freq)

    df = pd.concat([df, room_type_dummies, neighbourhood_group_dummies], axis=1)

    return df

def train_price_model(X_train, y_train, X_val, y_val):
    """Train Random Forest price prediction model"""

    print("Training Random Forest Price Prediction Model...")

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=25,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
        verbose=1
    )

    model.fit(X_train, y_train)

    train_score = model.score(X_train, y_train)
    val_score = model.score(X_val, y_val)

    train_rmse = np.sqrt(np.mean((model.predict(X_train) - y_train) ** 2))
    val_rmse = np.sqrt(np.mean((model.predict(X_val) - y_val) ** 2))

    print(f"Price Model - Train R²: {train_score:.4f}, Val R²: {val_score:.4f}")
    print(f"Price Model - Train RMSE: ${train_rmse:.2f}, Val RMSE: ${val_rmse:.2f}")

    metrics = {
        'train_r2': float(train_score),
        'val_r2': float(val_score),
        'train_rmse': float(train_rmse),
        'val_rmse': float(val_rmse),
        'model_type': 'RandomForestRegressor',
        'n_features': len(X_train.columns),
    }

    feature_importance = dict(zip(X_train.columns, model.feature_importances_))

    return model, metrics, feature_importance

def train_demand_model(X_train, y_train, X_val, y_val):
    """Train LightGBM demand classification model"""

    print("Training LightGBM Demand Classification Model...")

    train_data = lgb.Dataset(X_train, label=y_train)
    val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)

    params = {
        'objective': 'binary',
        'metric': 'binary_logloss',
        'num_leaves': 31,
        'learning_rate': 0.1,
        'verbose': 0,
    }

    model = lgb.train(
        params,
        train_data,
        num_boost_round=200,
        valid_sets=[train_data, val_data],
        valid_names=['train', 'val'],
    )

    train_pred = model.predict(X_train)
    val_pred = model.predict(X_val)

    from sklearn.metrics import accuracy_score, roc_auc_score, f1_score

    train_acc = accuracy_score(y_train, (train_pred > 0.5).astype(int))
    val_acc = accuracy_score(y_val, (val_pred > 0.5).astype(int))

    train_auc = roc_auc_score(y_train, train_pred)
    val_auc = roc_auc_score(y_val, val_pred)

    train_f1 = f1_score(y_train, (train_pred > 0.5).astype(int))
    val_f1 = f1_score(y_val, (val_pred > 0.5).astype(int))

    print(f"Demand Model - Train Acc: {train_acc:.4f}, Val Acc: {val_acc:.4f}")
    print(f"Demand Model - Train AUC: {train_auc:.4f}, Val AUC: {val_auc:.4f}")
    print(f"Demand Model - Train F1: {train_f1:.4f}, Val F1: {val_f1:.4f}")

    metrics = {
        'train_accuracy': float(train_acc),
        'val_accuracy': float(val_acc),
        'train_auc': float(train_auc),
        'val_auc': float(val_auc),
        'train_f1': float(train_f1),
        'val_f1': float(val_f1),
        'model_type': 'LightGBMClassifier',
        'n_features': len(X_train.columns),
    }

    feature_importance = dict(zip(X_train.columns, model.feature_importance(importance_type='gain')))

    return model, metrics, feature_importance

def main():
    """Main training pipeline"""

    os.makedirs('ml_models/models', exist_ok=True)

    print("=" * 60)
    print("NYC AIRBNB ML MODELS TRAINING PIPELINE")
    print("=" * 60)

    print("\n1. Generating realistic NYC Airbnb dataset...")
    df = generate_realistic_nyc_airbnb_data(n_samples=4000)
    print(f"   Generated {len(df)} samples")
    print(f"   Data shape: {df.shape}")

    print("\n2. Engineering features...")
    df = engineer_features(df)
    print(f"   Final feature shape: {df.shape}")

    feature_cols = [col for col in df.columns if col not in ['price', 'high_demand', 'neighbourhood']]

    print("\n3. Splitting data...")
    X_train, X_test, y_price_train, y_price_test = train_test_split(
        df[feature_cols], df['price'], test_size=0.2, random_state=42
    )

    _, _, y_demand_train, y_demand_test = train_test_split(
        df[feature_cols], df['high_demand'], test_size=0.2, random_state=42
    )

    X_train, X_val, y_price_train, y_price_val = train_test_split(
        X_train, y_price_train, test_size=0.2, random_state=42
    )

    _, _, y_demand_train, y_demand_val = train_test_split(
        X_train, y_demand_train, test_size=0.2, random_state=42
    )

    print(f"   Train size: {len(X_train)}, Val size: {len(X_val)}, Test size: {len(X_test)}")

    print("\n4. Training price prediction model...")
    price_model, price_metrics, price_importance = train_price_model(
        X_train, y_price_train, X_val, y_price_val
    )

    test_price_pred = price_model.predict(X_test)
    test_price_rmse = np.sqrt(np.mean((test_price_pred - y_price_test) ** 2))
    test_price_r2 = price_model.score(X_test, y_price_test)
    print(f"   Test R²: {test_price_r2:.4f}, Test RMSE: ${test_price_rmse:.2f}")

    print("\n5. Training demand classification model...")
    demand_model, demand_metrics, demand_importance = train_demand_model(
        X_train, y_demand_train, X_val, y_demand_val
    )

    from sklearn.metrics import accuracy_score
    test_demand_pred = demand_model.predict(X_test)
    test_demand_acc = accuracy_score(y_demand_test, (test_demand_pred > 0.5).astype(int))
    print(f"   Test Accuracy: {test_demand_acc:.4f}")

    print("\n6. Saving models...")
    joblib.dump(price_model, 'ml_models/models/price_model.joblib')
    joblib.dump(demand_model, 'ml_models/models/demand_model.pkl')
    joblib.dump(X_train.columns.tolist(), 'ml_models/models/feature_columns.joblib')

    print("   ✓ Price model saved to ml_models/models/price_model.joblib")
    print("   ✓ Demand model saved to ml_models/models/demand_model.pkl")
    print("   ✓ Feature columns saved")

    print("\n7. Saving metadata...")
    metadata = {
        'price_model': {
            'version': '1.0',
            'trained_at': datetime.now().isoformat(),
            'metrics': price_metrics,
            'feature_importance': {k: v for k, v in sorted(price_importance.items(), key=lambda x: x[1], reverse=True)[:10]}
        },
        'demand_model': {
            'version': '1.0',
            'trained_at': datetime.now().isoformat(),
            'metrics': demand_metrics,
            'feature_importance': {k: v for k, v in sorted(demand_importance.items(), key=lambda x: x[1], reverse=True)[:10]}
        },
        'feature_columns': X_train.columns.tolist(),
    }

    import json
    with open('ml_models/models/metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)

    print("   ✓ Metadata saved to ml_models/models/metadata.json")

    print("\n" + "=" * 60)
    print("TRAINING COMPLETE!")
    print("=" * 60)

if __name__ == '__main__':
    main()
