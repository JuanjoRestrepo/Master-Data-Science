Proyecto: Android Games Sales - Google Charts Dashboard
Equipo:
- Juan Jose Restrepo Rosero
- Nombre 2
- Nombre 3

Archivos incluidos:
- android_games_sales_augmented.csv  -> dataset con columnas originales + las columnas nuevas generadas.
- index.html                        -> Dashboard (Google Charts). Requiere internet para cargar la librería gcharts.
- README.txt                         -> Este archivo.

Columnas añadidas y método de generación:
- US_Sales, EU_Sales, JP_Sales: enteros generados aleatoriamente (RANDBETWEEN o numpy integers). Rango approx:
    - US_Sales: 1,000 - 200,000
    - EU_Sales: 1,000 - 150,000
    - JP_Sales: 500 - 80,000
- Global_Sales: = US_Sales + EU_Sales + JP_Sales + noise (noise random 0-300,000)
- User_rating: 1.0 - 10.0 (1 decimal)
- Critic_Rating: 10 - 100
- Year_of_Release: 2010 - 2024 (valores sintéticos añadidos para permitir análisis temporales).
- Release_Date: si se añadió, formato YYYY-MM-DD (opcional).

Justificación:
- Rangos y lógica generativa elegidos para que los números sean plausibles y permitan la demostración de visualizaciones (treemap, stacked area, bubble, sankey, calendar y gauge).
- Semilla: rng seed=42 (si usaste Python) para reproducibilidad.

Cómo correr la demo (recomendado):
1. Extrae la carpeta y abre una terminal en la carpeta.
2. Ejecuta: `python -m http.server 8000`
3. Abre en tu navegador: `http://localhost:8000/index.html`
(Se requiere conexión a internet para cargar Google Charts.)

Notas:
- Si quieres que yo te genere el CSV y los archivos web, dime y lo creo; solo necesito confirmación para generar los ficheros aquí.
