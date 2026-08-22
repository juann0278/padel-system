# Etapa 1: Limpieza y compilacion con Maven y Java 21
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src

# Sanitizar application.properties
RUN iconv -c -f UTF-8 -t UTF-8 src/main/resources/application.properties -o src/main/resources/application.properties.clean && \
    mv src/main/resources/application.properties.clean src/main/resources/application.properties || true

RUN mvn clean package -DskipTests -Dproject.build.sourceEncoding=UTF-8

# Etapa 2: Imagen final liviana con Java 21 JRE
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]