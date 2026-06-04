FROM eclipse-temurin:21-jdk-slim AS build
WORKDIR /app
COPY ./mvnw ./pom.xml ./
COPY ./ .
RUN ./mvnw -B package -DskipTests

FROM eclipse-temurin:21-jre-slim
WORKDIR /app
# create non‑root user
RUN groupadd -r abora && useradd -r -g abora abora && \
    mkdir -p /app && chown -R abora:abora /app
USER abora
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
