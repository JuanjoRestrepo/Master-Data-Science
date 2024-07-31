install.packages("learnr")          # solo una vez
install.packages("devtools")     # solo una vez
devtools::install_github("Centromagis/paqueteMETODOS", force = TRUE) #descarga paquete paqueteMETODOS
learnr::run_tutorial("Tutorial101", "paqueteMETODOS")  # carga Tutorial101
