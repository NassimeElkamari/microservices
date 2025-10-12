pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
    }

    stages {
        stage('Checkout') {
            steps {
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

        stage('Build Images') {
            steps {
                echo '📦 Building Docker images...'
                bat 'docker-compose -f %DOCKER_COMPOSE_FILE% build --no-cache'
            }
        }

        stage('Run Containers') {
            steps {
                echo '🚀 Starting containers...'
                bat 'docker-compose -f %DOCKER_COMPOSE_FILE% up -d --force-recreate'
            }
        }

        stage('Test') {
            steps {
                echo '🧪 Running tests...'
                // Example placeholders:
                // bat 'npm test'
                // bat 'mvn test'
            }
        }

        stage('Final Cleanup') {
            steps {
                echo '🧹 Cleaning up (optional, can be skipped in dev)...'
                // Uncomment if you want to stop and remove containers automatically after tests
                // bat 'docker-compose -f %DOCKER_COMPOSE_FILE% down -v'
            }
        }
    }

    post {
        always {
            echo '✅ Pipeline finished'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}
