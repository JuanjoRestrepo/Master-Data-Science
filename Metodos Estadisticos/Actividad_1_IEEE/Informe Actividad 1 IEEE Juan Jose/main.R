library(dplyr)
library(ggplot2)
library(paqueteMETODOS)
library(tidyverse)
library(visdat)
library(naniar)
library(sf)
library(corrplot)

data(vivienda_faltantes)
vivienda <- vivienda_faltantes

head(vivienda)
summary(vivienda)
str(vivienda)  
dim(vivienda)

# Verificar valores faltantes por columna
datosFaltantes <- colSums(is.na(vivienda))