import pandas as pd
import numpy as np
import os
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# 1. Load Data
data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'synthetic_urgency_data.csv')
print(f"Loading data from {data_path}...")
df = pd.read_csv(data_path)

# Features and Target
# We predict the continuous score (Regression), not the discrete priority.
# We can easily map score back to priority later.
X = df[['pga', 'vulnerability', 'occupancy', 'smoke_detected', 'gas_detected', 'fire_detected']]
y = df['urgency_score']

# 2. Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"Training set: {X_train.shape[0]} samples")
print(f"Test set: {X_test.shape[0]} samples")

# 3. Initialize and Train Model
print("Training Random Forest Regressor...")
model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
model.fit(X_train, y_train)

# 4. Evaluate Model
y_pred = model.predict(X_test)

mse = mean_squared_error(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print("\n--- Model Performance ---")
print(f"Mean Squared Error (MSE): {mse:.2f}")
print(f"Mean Absolute Error (MAE): {mae:.2f}")
print(f"R-squared (R2): {r2:.4f}")

# 5. Feature Importance
importance = model.feature_importances_
feature_names = X.columns
feat_imp_df = pd.DataFrame({'Feature': feature_names, 'Importance': importance}).sort_values(by='Importance', ascending=False)

print("\n--- Feature Importance ---")
print(feat_imp_df)

# Plot Feature Importance
plt.figure(figsize=(10, 6))
sns.barplot(x='Importance', y='Feature', data=feat_imp_df, palette='viridis')
plt.title('A-RES Urgency Model: Feature Importance')
plt.tight_layout()
plot_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'feature_importance.png')
plt.savefig(plot_path)
print(f"\nSaved feature importance plot to {plot_path}")

# 6. Save the Model
model_dir = os.path.join(os.path.dirname(__file__), '..', 'src', 'server')
os.makedirs(model_dir, exist_ok=True)
model_path = os.path.join(model_dir, 'urgency_model.pkl')
joblib.dump(model, model_path)
print(f"Model successfully saved to {model_path}")
print("\nTraining Complete! You can now use this model in the A-RES central server.")
