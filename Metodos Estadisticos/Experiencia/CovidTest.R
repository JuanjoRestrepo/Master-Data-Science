library(RSocrata)    # llamado de libreria
token <- "zxMsD6eXc0zlEMryRGW87Hwrz"  # token
Colombia <- read.socrata("https://www.datos.gov.co/resource/gt2j-8ykr.json", app_token = token) # lectura 
saveRDS(Colombia, file = "Colombia.RDS")
data(iris)  # data set iris
data(cars)  # data set cars
data(vivienda_faltantes) # data contenida en paqueteMETODOS
