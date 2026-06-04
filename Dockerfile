FROM public.ecr.aws/amazoncorretto/amazoncorretto:21 AS build

WORKDIR /app

RUN yum install -y tar gzip && yum clean all

COPY backend/.mvn .mvn
COPY backend/mvnw .
COPY backend/pom.xml .
COPY backend/src ./src

RUN chmod +x mvnw && ./mvnw clean package -DskipTests

FROM public.ecr.aws/amazoncorretto/amazoncorretto:21

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

CMD ["java", "-jar", "app.jar"]