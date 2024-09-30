library(paqueteMETODOS)
library(tidyverse)
library(corrplot)
library(mice)
library(mice)
library(knitr)
library(visdat)
library(naniar)
library(sf)


# Cargar datos
data(vivienda_faltantes)
viviendas <- vivienda_faltantes

head(viviendas)
summary(viviendas)
str(viviendas)  
dim(viviendas)

# Valores faltantes. Calculamos la cantidad y el porcentaje
valores_faltantes <- colSums(is.na(viviendas))
porcentaje_valores_faltantes <- (valores_faltantes/nrow(viviendas)) * 100

# creamos un dataframe con el resumen de los datos faltantes
resumen_data_faltante <- data.frame(Valores_Faltantes = valores_faltantes, 
                                  Porcentaje = porcentaje_valores_faltantes)




# Estadística descriptiva
descrip_Stats <- summary(viviendas)
descrip_Stats

# Contamos los valores nulos por columna
valores_nulos <- sapply(viviendas, function(x) sum(is.na(x) ) )
valores_nulos


# Visualizamos los valores faltantes
vis_miss(vivienda, sort_miss = TRUE,
         cluster = TRUE)

boxplot(viviendas$piso, viviendas$parquea,
        names = c("Pisos", "Parqueaderos"),
        col = c("lightblue", "lightgreen"),
        main = "Distribución de Pisos y Parqueaderos",
        ylab = "Número",
        xlab = "Variable")


print(paste0("Mínimo Pisos: ", which.min(viviendas$piso) ) )
print(paste0("Máximo Pisos: ", which.max(viviendas$piso) ) )

# Como la variable piso es de tipo caracter,
# La transformaremos a numérico
typeof(vivienda$piso)
vivienda$piso <- as.numeric(vivienda$piso)


hist(vivienda$piso,
     breaks = 15,
     col = "steelblue",
     pch = 19,
     lwd = 5,
     xlab = 'Pisos',
     main = "Histograma pisos")


# Medianas piso y parqueaderos
mediana_pisos <- median(viviendas$piso, na.rm = TRUE)
mediana_parqueaderos <- median(viviendas$parquea, na.rm = TRUE)


print(paste0("Mediana de pisos: ", mediana_pisos))
print(paste0("Mediana de parqueaderos: ", mediana_parqueaderos))

# Observaciones Generales:


## Filas con valores NA en piso y parqueadero
#filas_con_na_piso <- which(is.na(viviendas$piso))
#print(filas_con_na_piso)


#filas_con_na_parquea <- which(is.na(viviendas$parquea))
#print(filas_con_na_parquea)

#viviendas_con_na <- viviendas[is.na(viviendas$piso) | is.na(viviendas$parquea), ]
#print(viviendas_con_na)
