#install.packages("devtools")     # solo una vez
#devtools::install_github("centromagis/paqueteMETODOS") #descarga paquete paqueteMETODOS
library(dplyr)
library(ggplot2)
library(paqueteMETODOS)

# Cargar datos
data(vivienda_faltantes)
vivienda <- vivienda_faltantes

# Análisis del precio por zona
resumen_precios <- vivienda %>%
  group_by(zona) %>%
  summarise(precio_promedio = mean(preciom, na.rm = TRUE), .groups = 'drop')

ggplot(resumen_precios, aes(x = zona, y = precio_promedio)) +
  geom_bar(stat = "identity") +
  theme_minimal() +
  labs(title = "Precio Promedio de Viviendas por Zona",
       x = "Zona",
       y = "Precio Promedio")



#Análisis del tipo de vivienda
resumen_tipos <- vivienda %>%
  count(tipo) %>%
  arrange(desc(n))

ggplot(resumen_tipos, aes(x = reorder(tipo, n), y = n)) +
  geom_bar(stat = "identity") +
  theme_minimal() +
  labs(title = "Tipos de Viviendas Más Ofertadas",
       x = "Tipo de Vivienda",
       y = "Cantidad") +
  coord_flip()



#Análisis de características de las viviendas
resumen_caracteristicas <- vivienda %>%
  summarise(across(c(areaconst, parquea, banios, habitac), mean, na.rm = TRUE))

print(resumen_caracteristicas)

