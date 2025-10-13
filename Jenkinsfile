pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
        K8S_DIR    = 'k8s'
        NAMESPACE  = 'microservices'

        // Local images produced by compose build
        LOCAL_ANGULAR = 'microservices-angular-frontend:latest'
        LOCAL_NODE    = 'microservices-nodejs-task-service:latest'
        LOCAL_SPRING  = 'microservices-spring-user-service:latest'

        // Docker Hub repo (public)
        DOCKER_HUB_USER = 'nassimeelkamari'
        HUB_ANGULAR = "docker.io/${DOCKER_HUB_USER}/microservices-angular-frontend:latest"
        HUB_NODE    = "docker.io/${DOCKER_HUB_USER}/microservices-nodejs-task-service:latest"
        HUB_SPRING  = "docker.io/${DOCKER_HUB_USER}/microservices-spring-user-service:latest" // existing image on Hub
    }

    options {
        timeout(time: 40, unit: 'MINUTES')
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Cloning repository...'
                git branch: 'main', url: 'https://github.com/NassimeElkamari/microservices.git'
            }
        }

        stage('Prepare Minikube') {
            steps {
                echo 'Ensuring Minikube is running...'
                bat '''
                minikube status || minikube start --driver=docker
                kubectl config current-context
                '''
            }
        }

        stage('Build Images') {
            steps {
                echo 'Building Docker images with docker-compose...'
                bat 'docker-compose -f %DOCKER_COMPOSE_FILE% build --no-cache'
                echo 'Tagging images for Docker Hub...'
                bat """
                docker tag %LOCAL_ANGULAR% %HUB_ANGULAR%
                docker tag %LOCAL_NODE%    %HUB_NODE%
                docker tag %LOCAL_SPRING%  %HUB_SPRING%
                """
            }
        }

        stage('Docker Hub Login & Push (Angular + Node only)') {
            steps {
                echo 'Logging in & pushing images to Docker Hub (skip Spring)...'
                withCredentials([usernamePassword(credentialsId: 'dockerHub_cred', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    // Use PowerShell to avoid Windows CMD escaping issues on secrets
                    powershell '''
                        $ErrorActionPreference = "Stop"
                        $env:DOCKER_PASS | docker login --username $env:DOCKER_USER --password-stdin
                    '''
                    retry(2) {
                        bat "docker push %HUB_ANGULAR%"
                    }
                    retry(2) {
                        bat "docker push %HUB_NODE%"
                    }
                    echo 'Skipping Spring push: using existing image on Docker Hub.'
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo 'Applying Kubernetes manifests...'
                bat """
                kubectl apply -f %K8S_DIR%/namespace.yaml
                kubectl apply -f %K8S_DIR% -n %NAMESPACE%
                """
                echo 'Waiting for rollouts...'
                bat """
                kubectl rollout status deployment/mysql-db            -n %NAMESPACE% --timeout=180s || true
                kubectl rollout status deployment/nodejs-task-service -n %NAMESPACE% --timeout=180s || true
                kubectl rollout status deployment/spring-user-service -n %NAMESPACE% --timeout=180s || true
                kubectl rollout status deployment/angular-frontend    -n %NAMESPACE% --timeout=180s || true
                """
            }
        }

        stage('Scale') {
            steps {
                echo 'Scaling deployments...'
                bat """
                kubectl scale deployment nodejs-task-service -n %NAMESPACE% --replicas=2
                kubectl scale deployment spring-user-service -n %NAMESPACE% --replicas=2
                kubectl scale deployment angular-frontend    -n %NAMESPACE% --replicas=1
                """
            }
        }

        stage('Smoke Check') {
            steps {
                echo 'Verifying services and printing URL...'
                bat """
                kubectl get deploy,po,svc -n %NAMESPACE%
                echo.
                echo Angular service URL:
                minikube -p minikube -n %NAMESPACE% service angular-frontend --url
                """
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished'
        }
        failure {
            echo 'Pipeline failed!'
            bat 'kubectl -n %NAMESPACE% get events --sort-by=.lastTimestamp || exit 0'
        }
    }
}
