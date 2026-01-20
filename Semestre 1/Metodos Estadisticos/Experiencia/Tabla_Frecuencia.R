library(paqueteMETODOS)

# Cargar el conjunto de datos 'vivienda_faltantes'
data("vivienda_faltantes")

# Inspeccionar la estructura del conjunto de datos
str(vivienda_faltantes)

# Ver las primeras filas del conjunto de datos
head(vivienda_faltantes)

# Mostrar nombres de las columnas
colnames(vivienda_faltantes)

# Verificar valores faltantes en el conjunto de datos
table(is.na(vivienda_faltantes))

# Ver estadísticas descriptivas básicas
summary(vivienda_faltantes)
