import pandas as pd
import numpy as np
from math import radians, sin, cos, sqrt, atan2

# Load routes and stages
routes_df = pd.read_csv('routes.csv')
stages_df = pd.read_csv('stages.csv')

print("=== ROUTES DATA ===")
print(f"Rows: {len(routes_df)}, Columns: {routes_df.columns.tolist()}")
print(routes_df.head(3))
print(f"Route IDs: {routes_df['url_route_id'].nunique()}")

print("\n=== STAGES DATA ===")
print(f"Rows: {len(stages_df)}, Columns: {stages_df.columns.tolist()}")
print(f"Stages per route avg: {len(stages_df) / len(routes_df):.1f}")

# Save info for later use
with open('data_analysis.txt', 'w') as f:
    f.write(f"Routes: {len(routes_df)}\n")
    f.write(f"Stages: {len(stages_df)}\n")
    f.write(f"Unique routes: {routes_df['url_route_id'].nunique()}\n")
