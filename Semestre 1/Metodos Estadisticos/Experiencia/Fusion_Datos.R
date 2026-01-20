library(paqueteMETODOS)
library(dplyr)

data("rotacion")
id = 1:1470
data= data.frame(id, rotacion)

data1 = data[1:6,c(2,3,4,5)]
data1

data2 = data[7:12,c(2,3,4,5)]
data2

data20 = rbind(data1,data2)
data20


data3 = data[1:10,c(1,2,3)]
data4 = data[1:10,c(1,4,5)]
data5 = data[3:12,c(1,4,5)]
data3
data4

#cbind() Utilizada para combinar dos o mas conjuntos por columnas, agregando un conjunto de columnas. Es decir pegar dos datas que presentan el mismo orden de registros
cbind(data3, data4[,2:3])

# merge(). Se utiliza para combinar conjuntos de datos por columnas clave específicas, independientemente del número de filas.
data5
merge(data3, data5, by = "id", all = TRUE)
