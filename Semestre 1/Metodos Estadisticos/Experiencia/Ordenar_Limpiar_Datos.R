library(paqueteMETODOS) # carga paqueteMETODOS
library(dplyr)          # carga paqiete dplyr 
library(naniar)
library(VIM)
library(DescTools)

data("rotacionNA")      # carga data set rotacionNA del paqueteMETODOS
set.seed(123)           # fija semilla para numeros aleatorios
rotacionNA<-sample_n(rotacionNA, 1000) # toma una muestra de tamaño 1000 de la data
datosNA <- rotacionNA  # copia el contenido a datosNA
str(datosNA)  # explora contenido de datosNA

# Ahora para visualizar que variables y con que frecuencia se presentan los datos faltantes o NA utilizamos el siguiente código
faltantes <- colSums(is.na(datosNA)) %>%
  as.data.frame() 

faltantes

# La función colSums(is.na(datosNA)) totaliza el número total de datos faltantes por variable para la data datosNA
gg_miss_var(datosNA) # grafico de datos faltantes

# Otra forma de detectar y representar gráficamente los datos faltantes es utilizando la función md.pattern(datosNA, rotate.names = TRUE) del paquete mice
VIM::aggr(datosNA, cex.axis = 0.5, cex.lab= 0.8)  # graficos de datos faltantes


#  Eliminación de datos faltantes
# La función : na.omit() , permite elimitar todos los registros contenidos en la base de datos que contenga datos faltantes (NA)
datosSINA <- na.omit(datosNA)  # elimina todos los valores con  NA
VIM::aggr(datosSINA, cex.axis = 0.4, cex.lab= 0.8)
cat("dimensión dataSINA : ", dim(datosSINA))
# Este proceso elimina 100 de los registros, dejando una data de 900 x 25 .




# Tratamiento de datos faltantes como una categoría
datosNA <- rotacionNA
datosNA$Otro_motivo <- 0
datosNA$faltante[is.na(datosNA$`Viaje de Negocios`)] <- 1 
VIM::aggr(datosNA, cex.axis = 0.4, cex.lab= 0.8)


# 2. Imputación de valores
# Si no se desea eliminar los registros que contiene datos faltantes, dado que se puede perder un gran porcentaje de la información, entoces se recurre a reemplazar estos valores, primero calculado el valor por el cual se debe reemplazar (imputación de datos).

# Caso imputación por cero
#  el caso de la data rotacionNA, es posible que los empleados al ser interrogados, entendieron que no debian responder la pregunta: Horas Extras, cuando no trabajan horas por fuera de su jornada laboral.
#  En otros casos es posible que se trate de un dato faltante real -no respuesta - y se deba reeplazar por un valor que lo represente.
#  El caso de reemplazar los NA por cero en la variable Horas_Extra, se procede la siguiente forma:
datosNA$Años_Experiencia[is.na(datosNA$Años_Experiencia)] <- 0
datosNA <- rotacionNA
datosNA$Años_Experiencia[is.na(datosNA$Años_Experiencia)] <- 0
VIM::aggr(datosNA, cex.axis = 0.5, cex.lab= 0.8)

#   Caso reemplazo por la media
#   En el caso de reemplazar el NA por el valor correspondiente a la media se asigna este valor de la siguiente manera:
# Calcula la media de la variable "Años_Experiencia"
datosNA <- rotacionNA

# Calcula la media de la variable "Años_Experiencia"
media_Años_Experiencia <- mean(datosNA$Años_Experiencia, na.rm = TRUE) %>%
  round(0)

datosNA$Años_Experiencia[is.na(datosNA$Años_Experiencia)] <- media_Años_Experiencia
VIM::aggr(datosNA, cex.axis = 0.4, cex.lab= 0.8)
cat("media Años_Experiencia : ", media_Años_Experiencia)


# Caso reemplazo por la mediana
#En el caso de reemplazar el NA por el valor correspondiente a la mediana se asigna este valor de la siguiente manera:
datosNA <- rotacionNA
# Calcula la mediana de la variable "Años_Experiencia"
mediana_Años_Experiencia <- median(datosNA$Años_Experiencia, na.rm = TRUE) %>%
  round(0)

datosNA$Años_Experiencia[is.na(datosNA$Años_Experiencia)] <- mediana_Años_Experiencia
VIM::aggr(datosNA, cex.axis = 0.4, cex.lab= 0.8)
cat("mediana Años_Experiencia : ", mediana_Años_Experiencia)



#Caso reemplazo por la moda
#En el caso de la variable piso, que corresponde cualitativa de escala ordinal, si se desea reemplazar por la moda a los datos faltantes procedemos de la siguiente forma:
# install.packages("DescTools")
moda_Estado_Civil <- Mode(datosNA$Estado_Civil, na.rm = TRUE)
datosNA$Estado_Civil[is.na(datosNA$Estado_Civil)] <- moda_Estado_Civil
VIM::aggr(datosNA, cex.axis = 0.5, cex.lab= 0.8)
cat("moda Estado_Civil : ", moda_Estado_Civil)
