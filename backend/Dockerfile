# Etapa 1: Compilacion forzando UTF-8 puro
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests -Dproject.build.sourceEncoding=UTF-8 -Dproject.reporting.outputEncoding=UTF-8

# Etapa 2: Imagen liviana para ejecucion
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]