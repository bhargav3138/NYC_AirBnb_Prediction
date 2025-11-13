#!/bin/bash

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "Training ML models..."
python ml_models/train_models.py

echo ""
echo "Starting Flask backend server..."
python backend/app.py
