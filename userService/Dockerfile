# Stage 1: Build the Spring Boot JAR
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source and build the JAR
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the Spring Boot app
FROM eclipse-temurin:17-jdk
WORKDIR /app

# Copy the JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# Copy wait-for-it script
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Expose Spring Boot port
EXPOSE 8081

# Run Spring Boot only after MySQL is ready
CMD ["sh", "-c", "./wait-for-it.sh mysql-db:3306 --timeout=60 --strict -- java -jar app.jar"]
