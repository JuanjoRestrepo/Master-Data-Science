import pandas as pd

# Ruta del archivo CSV
file_path = r"C:\Users\Juan Jose Restrepo\Desktop\Master-Data-Science-main\Gestion Datos\Actividad 3\Mongo DB\university_db\Resultados Consultas\Consulta C.csv"

# Intenta leer el archivo con diferentes codificaciones
try:
    df = pd.read_csv(file_path, encoding='utf-8')
except UnicodeDecodeError:
    try:
        df = pd.read_csv(file_path, encoding='latin1')
    except UnicodeDecodeError:
        df = pd.read_csv(file_path, encoding='ISO-8859-1')

# Reemplazar caracteres incorrectos
df['Curso'] = df['Curso'].replace({
    'LÃ³gica': 'Lógica',
    'MatemÃ¡ticas': 'Matemáticas',
    'EstadÃ­stica': 'Estadística',
    'Ã‰tica': 'Ética',
    'PrÃ¡ctica': 'Práctica',
    'GeometrÃ­a': 'Geometría',
    'Ãlgebra': 'Álgebra'
}, regex=True)

# Filtrar las columnas necesarias y eliminar filas nulas
df_filtered = df.dropna()

# Guardar el DataFrame en un nuevo archivo CSV usando UTF-8
output_file_path = r'C:\Users\Juan Jose Restrepo\Desktop\Master-Data-Science-main\Gestion Datos\Actividad 3\Mongo DB\university_db\Resultados Consultas\Consulta_C_Resultados.csv'
df_filtered.to_csv(output_file_path, index=False, encoding='utf-8')

print(f'Archivo exportado exitosamente en: {output_file_path}')
