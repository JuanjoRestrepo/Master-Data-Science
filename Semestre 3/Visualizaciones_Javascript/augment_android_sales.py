# guarda como augment_android_sales.py y ejecútalo: python augment_android_sales.py
import pandas as pd
import numpy as np

# Ajusta la ruta:
infile = "data/android_games_sales.xlsx"   # tu archivo original
outfile = "data/android_games_sales.csv"

df = pd.read_excel(infile)

rng = np.random.default_rng(42)  # semilla reproducible

n = len(df)

# generar regiones
df['US_Sales'] = rng.integers(1000, 200000, size=n)
df['EU_Sales'] = rng.integers(1000, 150000, size=n)
df['JP_Sales'] = rng.integers(500, 80000, size=n)

# global = sum(regionales) + ruido
noise = rng.integers(0, 300000, size=n)
df['Global_Sales'] = df['US_Sales'] + df['EU_Sales'] + df['JP_Sales'] + noise

# ratings
df['User_rating'] = np.round(rng.random(n) * 9 + 1, 1)       # 1.0 - 10.0
df['Critic_Rating'] = rng.integers(10, 100, size=n)         # 10 - 100

# opcional: añadir Year_of_Release si te hace falta para series
df['Year_of_Release'] = rng.integers(2010, 2025, size=n)

df.to_csv(outfile, index=False)
print("Archivo guardado:", outfile)
