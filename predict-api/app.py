from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import os

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global variables for model and encoder
model = None
checkpoint_encoder = None

# Load resources during application startup
def load_resources():
    global model
    global checkpoint_encoder
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(script_dir, 'voting_classifier_best_model.joblib')
        encoder_path = os.path.join(script_dir, 'checkpoint_encoder.joblib')
        model = joblib.load(model_path)
        checkpoint_encoder = joblib.load(encoder_path)
        print("Model and encoder loaded successfully.")
    except Exception as e:
        print(f"Error loading model or encoder: {e}")
        raise RuntimeError("Failed to load required files during startup")

# Call the resource loader at application startup
with app.app_context():
    load_resources()

@app.route("/predict", methods=["POST"])
def predict_status():
    try:
        # Parse JSON request body
        input_data = request.json

        # Validate input fields
        required_fields = ["checkpoint", "day_of_week", "hour"]
        for field in required_fields:
            if field not in input_data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        # Prepare input data
        input_df = pd.DataFrame([{
            'checkpoint': input_data['checkpoint'],
            'day_of_week': input_data['day_of_week'],
            'hour': input_data['hour']
        }])
        
        checkpoint_encoded = checkpoint_encoder.transform(input_df[['checkpoint']])
        checkpoint_encoded_df = pd.DataFrame(
            checkpoint_encoded,
            columns=checkpoint_encoder.get_feature_names_out(['checkpoint'])
        )

        checkpoint_encoded_df[input_data['checkpoint']] = 1
        
        day_mapping = {'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6}
        day_num = input_df['day_of_week'].map(day_mapping)
        input_df['day_sin'] = np.sin(2 * np.pi * day_num / 7)
        input_df['day_cos'] = np.cos(2 * np.pi * day_num / 7)
        input_df['hour_sin'] = np.sin(2 * np.pi * input_data['hour'] / 24)
        input_df['hour_cos'] = np.cos(2 * np.pi * input_data['hour'] / 24)
        
        # Combine features and make predictions
        features = pd.concat([input_df[['hour_sin', 'hour_cos', 'day_sin', 'day_cos']], checkpoint_encoded_df], axis=1)
        feature_array = features.values
        prediction = model.predict(feature_array)[0]
        prediction_proba = model.predict_proba(feature_array)[0]
        class_labels = ['Open', 'Traffic']
        predicted_class = class_labels[prediction]
        
        # Return prediction result
        return jsonify({
            'predicted_status': predicted_class,
            'probabilities': {
                'Open': float(prediction_proba[0]),
                'Traffic': float(prediction_proba[1])
            }
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Hello, Flask!"})

# Run the app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
