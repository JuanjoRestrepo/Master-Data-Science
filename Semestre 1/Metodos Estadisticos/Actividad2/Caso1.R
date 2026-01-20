#Gráfica 1

#Se necesita el paquete pwr 
if(!require(pwr)){install.packages("pwr"); library(pwr)}
if(!require(ggplot2)){install.packages("ggplot2"); library(ggplot2)}
if(!require(plotly)){install.packages("plotly"); library(plotly)}
if(!require(dplyr)){install.packages("dplyr"); library(dplyr)}
if(!require(tidyr)){install.packages("tidyr"); library(tidyr)}

# t-TEST
# Se aplicará power.t.test del paquete stats (ya en R). Calcula la potencia de la prueba t de una o dos muestras, o determina los parámetros para obtener un valor particular de la potencia.

d<-seq(.1,2,by=.1) # 20 tamaños de los efectos
n<-1:150 # Tamaños muestrales

t.test.power.effect <-as.data.frame(do.call("cbind",lapply(1:length(d),function(i)
{
  sapply(1:length(n),function(j)
  {
    power.t.test(n=n[j],d=d[i],sig.level=0.05,power=NULL,type= "two.sample")$power
  })
})))

# Si algunas potencias no se pueden calcular, se ajustan a cero:
t.test.power.effect[is.na(t.test.power.effect)] <- 0 
colnames(t.test.power.effect)<-paste (d,"effect size")

#Graficando los resultados

prueba <-t.test.power.effect #data frame de 150 X 20 (para graficar)
cuts_num<-c(2,5,8) # cortes

#Cortes basados en: Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Hillsdale, NJ: Lawrence Erlbaum Associates, Publishers.
cuts_cat<-c("pequeño","medio","grande") 

columnas <- 1:ncol(prueba) #Lista de los valores 1:20
color_linea<-rainbow(length(columnas), alpha=.5) # Lista de 20 colores
grosor_linea=3 # Grosor de la línea

#Para el tipo de línea: (“blank”, “solid”, “dashed”, “dotted”, “dotdash”, “longdash”, “twodash”) ó  (0, 1, 2, 3, 4, 5, 6). 
#Note que lty = “solid” is idéntica a lty=1.

tipo_linea <- rep(1,length(color_linea))        #Repetir length(color)=20 veces el 1
tipo_linea[cuts_num]<-c(2:(length(cuts_num)+1)) #Asignar 2, 3, 4 en las posiciones 2, 5, 8 de tipo_linea

#Resaltar posiciones importantes
cuts_num<-c(2,5,8) # Cortes

#Cortes basados en: Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Hillsdale, NJ: Lawrence Erlbaum Associates, Publishers.
cuts_cat<-c("pequeño","medio","grande") 
color_linea[cuts_num]<-c("black")

efecto <- d # Listado de los 20 valores de 20
efecto[cuts_num] <- cuts_cat  #Reemplazar en "efecto" las posiciones cuts_num (2, 5, 8) por las categorías de cuts_cat

par(fig=c(0,.8,0,1),new=TRUE)

#Gráfica
plot(1, type="n", #no produce puntos ni líneas
     frame.plot=FALSE, 
     xlab="Tamaño muestral", ylab="Potencia", 
     xlim=c(1,150),  ylim=c(0,1), 
     main="t-Test", axes = FALSE)

#Editando los ejes, grid, etc.
abline(v=seq(0,150,by=10), col = "lightgray", lty = "dotted") # Grid vertical
abline(h=seq(0,1,by=.05), col = "lightgray", lty = "dotted")  # Grid horizontal
axis(1,seq(0,150,by=10)) # Números en eje X
axis(2,seq(0,1,by=.05))  # Números en eje Y

#Plot de las lineas 
#columnas <- 1:ncol(prueba) # lista de los valores 1:20
for(i in 1:length(columnas)) #length(columnas)=20
{
  lines(1:150,
        #prueba (data frame de 150 X 20, para graficar)
        #columna <- 1:ncol(prueba) listado de valores 1:20 
        prueba[,columnas[i]], #filtrar "prueba" para valor de columna
        col=color_linea[i],   #color_linea[cuts_num]<-c("black")
        lwd=grosor_linea,     #grosor de cada linea
        lty=tipo_linea[i]     #tipo_linea[cuts_num]<-c(2:(length(cuts_num)+1))
  )
}

#Leyendas
par(fig=c(.65,1,0,1),new=TRUE)
plot.new()
legend("top",legend=efecto, col=color_linea, lwd=3, lty=tipo_linea, title="Tamaño efecto", 
       bty="n" #Opciones: o (complete box), n (no box), 7, L, C, U
)

#Gráfica 2

#plot using ggplot2

#library(ggplot2)
#library(reshape)
#library(plotly)

obj <- cbind(size=1:150, prueba) #Agregando el tamaño al data frame "prueba" 

# Usar melt y unir con "effect" para el mapeo
#El data frame "obj" se reconstruye con respecto al parámetro id="size". 
melted <- cbind(reshape::melt(obj, id="size"), effect=rep(d,each=150)) 

p<- ggplot(data=melted, aes(x=size, y=value, color=as.factor(effect))) + 
  geom_line(size=0.7,alpha=.5) +
  ylab("Potencia") + 
  xlab("Tamaño muestral") + 
  ggtitle("t-Test")+
  theme_bw() +
  #guides(fill=guide_legend(title="Efecto"))
  #scale_fill_discrete(name = "Efecto")
  #labs(fill='Efecto') 
  #scale_fill_manual("Efecto"#,values=c("orange","red")
  scale_color_discrete(name = "Tamaño del efecto")    

# Interactive plot
plotly::ggplotly(p)

