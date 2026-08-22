<<<<<<< HEAD
# Etapa 1: Compilacion con Maven
=======
# Etapa 1: Compilación con Maven
>>>>>>> 559c00e9f95e8485106384c5fc674714838f2a08
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

<<<<<<< HEAD
# Etapa 2: Imagen para ejecucion
=======
# Etapa 2: Imagen liviana para ejecución
>>>>>>> 559c00e9f95e8485106384c5fc674714838f2a08
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
<<<<<<< HEAD
ENTRYPOINT ["java", "-jar", "app.jar"]
=======
ENTRYPOINT ["java", "-jar", "app.jar"]
>>>>>>> 559c00e9f95e8485106384c5fc674714838f2a08
