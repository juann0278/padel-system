# Etapa 1: Limpieza y compilacion con Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src

# Asegurar encoding UTF-8 puro sin BOM ni caracteres invalidos
RUN iconv -c -f UTF-8 -t UTF-8 src/main/resources/application.properties -o src/main/resources/application.properties.clean && \
    mv src/main/resources/application.properties.clean src/main/resources/application.properties || true

RUN mvn clean package -DskipTests -Dresources.skip=false -Dproject.build.sourceEncoding=UTF-8

# Etapa 2: Imagen final liviana
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]