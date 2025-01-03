from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
import joblib
import numpy as np
import pandas as pd
import os
from fastapi.middleware.cors import CORSMiddleware

class CheckpointInput(BaseModel):
    checkpoint: str
    day_of_week: str
    hour: float

@asynccontextmanager
async def lifespan(app: FastAPI):
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
        print("Error loading model or encoder:", e)
        raise RuntimeError("Failed to load required files during startup")
    yield  # Application lifespan continues
    print("Application shutting down...")

app = FastAPI(lifespan=lifespan)
origins = [
    "http://localhost",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
def predict_status(input_data: CheckpointInput):
    try:
        input_df = pd.DataFrame([{
            'checkpoint': input_data.checkpoint,
            'day_of_week': input_data.day_of_week,
            'hour': input_data.hour
        }])
        
        checkpoint_encoded = checkpoint_encoder.transform(input_df[['checkpoint']])
        checkpoint_encoded_df = pd.DataFrame(
            checkpoint_encoded,
            columns=checkpoint_encoder.get_feature_names_out(['checkpoint'])
        )

        checkpoint_encoded_df[input_data.checkpoint] = 1
        
        day_mapping = {'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6}
        day_num = input_df['day_of_week'].map(day_mapping)
        input_df['day_sin'] = np.sin(2 * np.pi * day_num / 7)
        input_df['day_cos'] = np.cos(2 * np.pi * day_num / 7)
        input_df['hour_sin'] = np.sin(2 * np.pi * input_data.hour / 24)
        input_df['hour_cos'] = np.cos(2 * np.pi * input_data.hour / 24)
        
        
        features = pd.concat([input_df[['hour_sin', 'hour_cos', 'day_sin', 'day_cos']], checkpoint_encoded_df], axis=1)
        feature_array = features.values
        prediction = model.predict(feature_array)[0]
        prediction_proba = model.predict_proba(feature_array)[0]
        class_labels = ['Open', 'Traffic']
        predicted_class = class_labels[prediction]
        
        return {
            'predicted_status': predicted_class,
            'probabilities': {
                'Open': float(prediction_proba[0]),
                'Traffic': float(prediction_proba[1])
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("predictApi:app", host="0.0.0.0", port=8000, reload=True)
