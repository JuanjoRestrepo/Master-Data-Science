library(dplyr)
data(rotacion)
set.seed(123)
datos <- sample_n(rotacion, 1000)
# variables <- c("Edad", "Antigüedad", "Antigüedad_Cargo", "Años_ultima_promoción", "Años_acargo_con_mismo_jefe")
datos = datos[, c(2,18,21,22,23,24)] # se seleccionan variables de interes para facilitar su visualizacion
str(datos) # Muestra los datos originales

# Transformación directa
datos$Indicador1 = datos$Antigüedad/datos$Años_Experiencia
str(datos) 

# Transformacion utilizando la función mutate del paquete dplyr
datos <- mutate(datos, Indicador2 = Antigüedad / Años_Experiencia)
str(datos) # Muestra los datos originales


# Estandarizacion
datos <- sample_n(rotacion, 1000)
datos$Edad_estandarizada1 = (datos$Edad - mean(datos$Edad))/sd(datos$Edad)
datos$Edad_estandarizada2 = scale(datos$Edad)
str(datos[,c(2,25,26)]) 
summarytools::descr(datos[,c(2,25,26)])


# Normalización manual
datos <- sample_n(rotacion, 1000)
datos$Edad_normalizada1 = (datos$Edad - min(datos$Edad))/(max(datos$Edad)-min(datos$Edad))
library(scales)
datos$Edad_normalizada2 = rescale(datos$Edad, to =c(0,1))
str(datos[,c(2,25, 26)])
summarytools::descr(datos[,c(2,25,26)])
