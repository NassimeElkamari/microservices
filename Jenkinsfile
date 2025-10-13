pipeline {
    agent any

    environment {
        DOCKER_HUB_USER = 'nassimeelkamari'
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
    }

    stages {
        stage('Checkout') {
            steps {
                echo '📥 Cloning repository...'
                git branch: 'main', url: 'https://github.com/NassimeElkamari/microservices.git'
            }
        }

        stage('Cleanup Old Containers') {
            steps {
                echo '🧹 Cleaning up old containers and networks...'
                bat '''
                docker-compose -f %DOCKER_COMPOSE_FILE% down -v || exit 0
                '''
            }
        }

        stage('Docker Login') {
            steps {
                echo '🔑 Logging in to Docker Hub...'
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    bat """
                    echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                    """
                }
            }
        }

        stage('Build and Tag Images') {
            steps {
                echo '📦 Building Docker images for all microservices...'
                bat 'docker-compose -f %DOCKER_COMPOSE_FILE% build --no-cache'

                echo '🏷️ Tagging images for Docker Hub...'
                bat """
                docker tag microservices-angular-frontend:latest %DOCKER_HUB_USER%/microservices-angular-frontend:latest
                docker tag microservices-nodejs-task-service:latest %DOCKER_HUB_USER%/microservices-nodejs-task-service:latest
                docker tag microservices-spring-user-service:latest %DOCKER_HUB_USER%/microservices-spring-user-service:latest
                """
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                echo '☁️ Pushing images to Docker Hub...'
                bat """
                docker push %DOCKER_HUB_USER%/microservices-angular-frontend:latest
                docker push %DOCKER_HUB_USER%/microservices-nodejs-task-service:latest
                docker push %DOCKER_HUB_USER%/microservices-spring-user-service:latest
                """
            }
        }

        stage('Run Containers') {
            steps {
                echo '🚀 Starting containers from the newly built images...'
                bat 'docker-compose -f %DOCKER_COMPOSE_FILE% up -d --force-recreate'
            }
        }

        stage('Test') {
            steps {
                echo '🧪 Running tests...'
                // Example: bat 'npm test'
                // Example: bat 'mvn test'
            }
        }

        stage('Optional Cleanup') {
            steps {
                echo '🧹 (Optional) Stopping containers after tests...'
                // Uncomment for production
                // bat 'docker-compose -f %DOCKER_COMPOSE_FILE% down -v'
            }
        }
    }

    post {
        always {
            echo '✅ Pipeline finished'
            bat 'docker logout'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}
