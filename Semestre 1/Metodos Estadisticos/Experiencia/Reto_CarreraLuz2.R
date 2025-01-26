library(paqueteMETODOS)
data("CarreraLuz22")  # contiene todos los datos

# Inspeccionar la estructura del conjunto de datos
str(CarreraLuz22)

# Ver las primeras filas del conjunto de datos
head(CarreraLuz22)




library(dplyr)
# Crear subconjuntos de datos según las categorías especificadas

# Mujeres categoría juvenil
CarreraLu22_c1F <- CarreraLuz22 %>% filter(categoria == "1. Juvenil" & sex == "Mujer")

# Hombres categoría juvenil
CarreraLu22_c1M <- CarreraLuz22 %>% filter(categoria == "1. Juvenil" & sex == "Hombre")

# Mujeres categoría abierta
CarreraLu22_c2F <- CarreraLuz22 %>% filter(categoria == "2. Abierta" & sex == "Mujer")

# Hombres categoría abierta
CarreraLu22_c2M <- CarreraLuz22 %>% filter(categoria == "2. Abierta" & sex == "Hombre")

# Mujeres categoría veteranos A
CarreraLu22_c3F <- CarreraLuz22 %>% filter(categoria == "3. Veteranos A" & sex == "Mujer")

# Hombres categoría veteranos A
CarreraLu22_c3M <- CarreraLuz22 %>% filter(categoria == "3. Veteranos A" & sex == "Hombre")

# Mujeres categoría veteranos B
CarreraLu22_c4F <- CarreraLuz22 %>% filter(categoria == "4. Veteranos B" & sex == "Mujer")

# Hombres categoría veteranos B
CarreraLu22_c4M <- CarreraLuz22 %>% filter(categoria == "4. Veteranos B" & sex == "Hombre")

# Mujeres categoría veteranos C
CarreraLu22_c5F <- CarreraLuz22 %>% filter(categoria == "5. Veteranos C" & sex == "Mujer")

# Hombres categoría veteranos C
CarreraLu22_c5M <- CarreraLuz22 %>% filter(categoria == "5. Veteranos C" & sex == "Hombre")

# Mujeres (todas las categorías)
CarreraLu22F <- CarreraLuz22 %>% filter(sex == "Mujer")

# Hombres (todas las categorías)
CarreraLu22M <- CarreraLuz22 %>% filter(sex == "Hombre")


# Reconstruir la data original combinando todas las bases de datos segmentadas
CarreraLuz22_reconstructed <- bind_rows(
  CarreraLu22_c1F,
  CarreraLu22_c1M,
  CarreraLu22_c2F,
  CarreraLu22_c2M,
  CarreraLu22_c3F,
  CarreraLu22_c3M,
  CarreraLu22_c4F,
  CarreraLu22_c4M,
  CarreraLu22_c5F,
  CarreraLu22_c5M,
  CarreraLu22F,
  CarreraLu22M
)

CarreraLuz22_reconstructed_RBIN <- rbind(
  CarreraLu22_c1F,
  CarreraLu22_c1M,
  CarreraLu22_c2F,
  CarreraLu22_c2M,
  CarreraLu22_c3F,
  CarreraLu22_c3M,
  CarreraLu22_c4F,
  CarreraLu22_c4M,
  CarreraLu22_c5F,
  CarreraLu22_c5M,
  CarreraLu22F,
  CarreraLu22M
)


# Verificar la estructura de la data reconstruida
#str(CarreraLuz22_reconstructed)
str(CarreraLuz22_reconstructed_RBIN)

# Ver las primeras filas del conjunto de datos reconstruido
#head(CarreraLuz22_reconstructed)
head(CarreraLuz22_reconstructed_RBIN)



# Conclusiones
'''
Usando cbind()
cbind() combina columnas, por lo que solo es útil si los conjuntos de datos tienen el mismo número de filas y estás agregando columnas diferentes.

Usando merge()
merge() se utiliza para combinar conjuntos de datos basándose en columnas clave. Es útil cuando tienes diferentes conjuntos de datos con información complementaria y necesitas fusionarlos en función de columnas comunes.

Sin embargo, en nuestro caso, merge() no es adecuado ya que estamos combinando filas y no tenemos columnas clave diferentes.
En resumen, para nuestro caso de combinar filas de subconjuntos de CarreraLuz22, rbind() o bind_rows() de dplyr
'''