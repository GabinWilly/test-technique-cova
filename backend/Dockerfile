# syntax=docker/dockerfile:1

# ---------- Etape de construction ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Les dependances sont resolues avant de copier les sources : tant que le POM
# ne change pas, cette couche est reprise du cache et le build reste rapide.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -B -q dependency:go-offline

COPY src/ src/
RUN ./mvnw -B -q clean package -DskipTests

# ---------- Image d'execution ----------
FROM eclipse-temurin:21-jre-alpine AS runtime

# Rattrape les correctifs Alpine publies depuis la derniere image de base, que
# l'analyse Trivy de la CI signalerait sinon comme critiques.
RUN apk upgrade --no-cache

# Un utilisateur sans privileges : un processus compromis ne doit pas etre root.
RUN addgroup -S taskcova && adduser -S -G taskcova taskcova

WORKDIR /app
COPY --from=build --chown=taskcova:taskcova /build/target/*.jar app.jar

USER taskcova

# Cloud Run impose le port par la variable PORT ; 8081 sert de repli en local.
ENV PORT=8081
EXPOSE 8081

# MaxRAMPercentage plutot qu'un Xmx fixe : la JVM s'adapte a la memoire
# reellement allouee au conteneur, qui varie d'un environnement a l'autre.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseContainerSupport"

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
