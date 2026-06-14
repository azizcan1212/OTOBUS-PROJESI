# ===== Stage 1: Build (Maven + JDK 21) =====
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Once wrapper + pom.xml kopyala -> bagimliliklar degismedikce cache'den gelir
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline || true

COPY src src
RUN ./mvnw -B clean package -DskipTests

# ===== Stage 2: Run (sadece JRE, root olmayan kullanici) =====
FROM eclipse-temurin:21-jre-alpine

# Root olmayan kullanici/grup olustur
RUN addgroup -g 1001 -S spring \
    && adduser -u 1001 -S spring -G spring

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

RUN chown -R spring:spring /app
USER spring

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
